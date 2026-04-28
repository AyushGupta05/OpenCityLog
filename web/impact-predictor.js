/* ================================================================
   BELFAST PROPOSAL CONTEXT WRAPPER

   Legacy dashboard code still calls window.BelfastPredictor. Keep that
   API shape, but only expose historical analogue/context helpers. This
   file no longer produces future deltas, trained outcomes, or calibrated
   claims; the planner-facing result comes from /api/proposal-impact.
   ================================================================ */

(function (global) {
  'use strict';

  const BASE_YEAR = 2026;
  const SIGNALS = ['traffic', 'jobs', 'electricity', 'buildings', 'services'];
  const ZERO_DELTAS = {
    population: 0,
    traffic: 0,
    air: 0,
    housing: 0,
    economy: 0,
    jobs: 0,
    transit: 0,
    opportunity: 0,
    fairness: 0
  };

  const eventsBySignal = { traffic: [], jobs: [], electricity: [], buildings: [], services: [] };
  let loaded = false;
  let loadingPromise = null;

  async function loadAllSignals() {
    if (loaded) return;
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      const fetches = SIGNALS.map(async (signal) => {
        try {
          const res = await fetch('/api/events?signal=' + encodeURIComponent(signal) + '&limit=5000');
          if (!res.ok) throw new Error('signal ' + signal + ' ' + res.status);
          const json = await res.json();
          if (Array.isArray(json.events)) {
            eventsBySignal[signal] = json.events
              .filter((event) => Array.isArray(event.coordinates) && event.coordinates.length === 2);
          }
        } catch (error) {
          console.warn('[BelfastProposalContext] failed to load signal', signal, error);
        }
      });
      await Promise.all(fetches);
      loaded = true;
      try { document.dispatchEvent(new CustomEvent('belfast-predictor-ready')); } catch (_) {}
    })();
    return loadingPromise;
  }

  function haversineMeters(lng1, lat1, lng2, lat2) {
    const radius = 6371000;
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLng = (lng2 - lng1) * toRad;
    const q = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
      Math.sin(dLng / 2) ** 2;
    return 2 * radius * Math.asin(Math.sqrt(q));
  }

  function circlePolygon(lng, lat, radiusM, segments) {
    const steps = segments || 48;
    const coords = [];
    const dLat = radiusM / 111111;
    const dLng = radiusM / (111111 * Math.cos(lat * Math.PI / 180));
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * 2 * Math.PI;
      coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
    }
    return coords;
  }

  function metricGoodDirection(metric) {
    if (metric === 'traffic' || metric === 'air' || metric === 'housing' || metric === 'electricity') return 'down';
    return 'up';
  }

  function confidenceWeight(value) {
    const confidence = String(value || '').toLowerCase();
    if (confidence === 'corroborated' || confidence === 'high') return 1;
    if (confidence === 'documented' || confidence === 'medium-high') return 0.82;
    if (confidence === 'medium') return 0.65;
    if (confidence === 'inferred') return 0.42;
    return 0.32;
  }

  function contextScores(lng, lat, opts) {
    const radiusM = (opts && opts.radiusM) || 1500;
    const scores = { traffic: 0, jobs: 0, electricity: 0, buildings: 0, services: 0 };
    const counts = { traffic: 0, jobs: 0, electricity: 0, buildings: 0, services: 0 };
    const nearest = [];

    SIGNALS.forEach((signal) => {
      const events = eventsBySignal[signal] || [];
      events.forEach((event) => {
        const coord = event.coordinates;
        if (!coord) return;
        const distanceM = haversineMeters(lng, lat, coord[0], coord[1]);
        if (!Number.isFinite(distanceM) || distanceM > radiusM) return;
        const distanceWeight = Math.exp(-distanceM / Math.max(radiusM, 1));
        const ageYears = Math.max(0, BASE_YEAR - (Number(event.year) || BASE_YEAR));
        const recencyWeight = Math.exp(-ageYears / 7);
        const weight = distanceWeight * recencyWeight * confidenceWeight(event.confidence);
        scores[signal] += weight;
        counts[signal] += 1;
        nearest.push({ ev: event, dist: distanceM, weight: weight, signal: signal });
      });
    });

    nearest.sort((a, b) => a.dist - b.dist);
    const totalNearby = SIGNALS.reduce((sum, signal) => sum + counts[signal], 0);
    return { scores: scores, counts: counts, totalNearby: totalNearby, nearest: nearest };
  }

  function confidenceLabel(totalNearby) {
    if (totalNearby >= 30) return 'medium';
    if (totalNearby >= 8) return 'medium';
    return 'low';
  }

  function predictForBuilding(building, currentYear) {
    if (!building || typeof building.lng !== 'number' || typeof building.lat !== 'number') return null;
    const placedYear = building.year || BASE_YEAR;
    const context = contextScores(building.lng, building.lat, { radiusM: 1500 });
    return {
      yearsSince: Math.max(0, (Number(currentYear) || BASE_YEAR) - placedYear),
      ramp: 0,
      deltas: Object.assign({}, ZERO_DELTAS),
      contextScores: context.scores,
      contextCounts: context.counts,
      totalNearby: context.totalNearby,
      confidence: confidenceLabel(context.totalNearby),
      nearest: context.nearest.slice(0, 12)
    };
  }

  function generateHeatmapPoints() {
    return [];
  }

  function preferredSignalForItem(item) {
    const type = String((item && item.type) || '').toLowerCase();
    const preset = String((item && item.preset) || '').toLowerCase();
    if (type === 'road') return 'traffic';
    if (type === 'infrastructure') return 'electricity';
    if (type === 'park') return 'services';
    if (/commercial|mixed/.test(preset)) return 'jobs';
    return 'buildings';
  }

  function similarEvents(item, limit) {
    if (!item || typeof item.lng !== 'number' || typeof item.lat !== 'number') return [];
    const preferred = preferredSignalForItem(item);
    const candidates = [];
    SIGNALS.forEach((signal) => {
      (eventsBySignal[signal] || []).forEach((event) => {
        const coord = event.coordinates;
        if (!coord) return;
        const distanceM = haversineMeters(item.lng, item.lat, coord[0], coord[1]);
        if (!Number.isFinite(distanceM) || distanceM > 2500) return;
        const categoryWeight = signal === preferred ? 1.2 : 0.85;
        const recencyWeight = Math.exp(-Math.max(0, BASE_YEAR - (Number(event.year) || BASE_YEAR)) / 7);
        const score = Math.exp(-distanceM / 900) * recencyWeight * confidenceWeight(event.confidence) * categoryWeight;
        candidates.push({ event: event, signal: signal, distanceM: distanceM, score: score });
      });
    });
    candidates.sort((a, b) => b.score - a.score);

    const seen = new Set();
    const out = [];
    for (let i = 0; i < candidates.length && out.length < (limit || 4); i += 1) {
      const candidate = candidates[i];
      const event = candidate.event;
      const key = String(event.title || '') + '|' + String(event.year || '') + '|' + candidate.signal;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: event.id,
        title: event.title || event.category || 'Past event',
        area: event.area || '',
        year: event.year,
        signal: candidate.signal,
        coordinates: event.coordinates,
        distM: Math.round(candidate.distanceM),
        confidence: event.confidence || 'inferred'
      });
    }
    return out;
  }

  function predictForBranch(branch, currentYear) {
    const items = Array.isArray(branch && branch.items) ? branch.items : [];
    let nearby = 0;
    const perBuilding = [];
    items.forEach((item) => {
      if (typeof item.lng !== 'number' || typeof item.lat !== 'number') return;
      const context = predictForBuilding(item, currentYear);
      if (!context) return;
      nearby += context.totalNearby;
      perBuilding.push({ item: item, prediction: context });
    });
    return {
      deltas: Object.assign({}, ZERO_DELTAS),
      totalBuildings: perBuilding.length,
      confidence: confidenceLabel(nearby),
      perBuilding: perBuilding
    };
  }

  global.BelfastPredictor = {
    BASE_YEAR: BASE_YEAR,
    SIGNALS: SIGNALS,
    loadAllSignals: loadAllSignals,
    isReady: function () { return loaded; },
    eventsBySignal: eventsBySignal,
    predictForBuilding: predictForBuilding,
    predictForBranch: predictForBranch,
    generateHeatmapPoints: generateHeatmapPoints,
    similarEvents: similarEvents,
    metricGoodDirection: metricGoodDirection,
    haversineMeters: haversineMeters,
    circlePolygon: circlePolygon
  };

})(window);
