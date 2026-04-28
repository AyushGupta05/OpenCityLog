const fs = require("fs");
const path = require("path");

const MODEL_VERSION = "bims5-proposal-impact-sketch-v1";
const CURRENT_CONTEXT_YEAR = 2026;
const DEFAULT_CITY_ID = "belfast";
const DEFAULT_RADIUS_M = 1500;
const MAX_SIMILAR_EVENTS = 8;
const MAX_NEARBY_EVENTS = 16;

const VALID_CATEGORIES = new Set([
  "building_development",
  "road_transport_change",
  "transformer_energy_infrastructure",
  "green_public_space",
  "service_civic_infrastructure",
]);

const CATEGORY_ALIASES = {
  building: "building_development",
  buildings: "building_development",
  development: "building_development",
  housing: "building_development",
  mixed_use: "building_development",
  road: "road_transport_change",
  roads: "road_transport_change",
  transport: "road_transport_change",
  transportation: "road_transport_change",
  transit: "road_transport_change",
  mobility: "road_transport_change",
  transformer: "transformer_energy_infrastructure",
  energy: "transformer_energy_infrastructure",
  electricity: "transformer_energy_infrastructure",
  utilities: "transformer_energy_infrastructure",
  grid: "transformer_energy_infrastructure",
  green: "green_public_space",
  park: "green_public_space",
  parks: "green_public_space",
  public_space: "green_public_space",
  publicspace: "green_public_space",
  civic: "service_civic_infrastructure",
  service: "service_civic_infrastructure",
  services: "service_civic_infrastructure",
  school: "service_civic_infrastructure",
  health: "service_civic_infrastructure",
  community: "service_civic_infrastructure",
};

const CATEGORY_RULES = {
  building_development: {
    label: "building or development",
    eventCategories: ["built_environment", "economy"],
    lenses: ["buildings", "jobs"],
    affectedSignals: ["built_environment", "jobs", "mobility", "utilities", "civic_services", "green_space"],
    outputSignals: [
      ["built_environment", "mixed", "high", "The proposal is a physical development, so nearby building and planning records are the closest precedents."],
      ["mobility", "mixed", "medium", "New floor area can change local trip patterns, but this screen only flags the mobility signal for review."],
      ["utilities", "mixed", "medium", "Larger developments can touch electricity and services context. The available data is screening context only."],
      ["civic_services", "mixed", "medium", "Residents, workers, or visitors may add demand for public and civic services."],
      ["green_space", "mixed", "low", "A development can interact with tree canopy, public space, or surface cover, depending on the site design."],
      ["jobs", "positive", "low", "Commercial or mixed-use details can make employment and access-to-jobs worth checking."],
    ],
  },
  road_transport_change: {
    label: "road or transport change",
    eventCategories: ["transport"],
    lenses: ["mobility", "traffic", "services"],
    affectedSignals: ["mobility", "civic_services", "green_space", "jobs"],
    outputSignals: [
      ["mobility", "mixed", "high", "Transport records and nearby road or station changes are the primary analogues."],
      ["green_space", "mixed", "medium", "Road and corridor changes can alter public realm, severance, and environmental exposure."],
      ["civic_services", "mixed", "low", "Access to services can change when route, stop, or road context changes."],
      ["jobs", "mixed", "low", "Transport access can be relevant to employment areas, but the data here is not a labour-market model."],
    ],
  },
  transformer_energy_infrastructure: {
    label: "transformer or energy infrastructure",
    eventCategories: ["utilities"],
    lenses: ["utilities", "electricity"],
    affectedSignals: ["utilities", "built_environment", "jobs"],
    outputSignals: [
      ["utilities", "mixed", "high", "Utilities records and current electricity-context cells are the closest evidence base."],
      ["built_environment", "unknown", "low", "Grid assets can enable or respond to development, but this screen does not establish which direction applies."],
      ["jobs", "unknown", "low", "Employment effects are outside the direct evidence base and should be investigated separately."],
    ],
  },
  green_public_space: {
    label: "green or public-space intervention",
    eventCategories: ["civic_services", "built_environment"],
    lenses: ["services", "buildings"],
    affectedSignals: ["green_space", "civic_services", "mobility"],
    outputSignals: [
      ["green_space", "positive", "high", "The proposal directly concerns green or public space, so green-cover context is central."],
      ["civic_services", "positive", "medium", "Parks and public spaces can act as civic amenities, especially near service gaps."],
      ["mobility", "mixed", "low", "Access, walking routes, and nearby road context may be relevant."],
    ],
  },
  service_civic_infrastructure: {
    label: "service or civic infrastructure",
    eventCategories: ["civic_services", "transport", "economy"],
    lenses: ["services", "mobility", "jobs"],
    affectedSignals: ["civic_services", "mobility", "jobs", "utilities"],
    outputSignals: [
      ["civic_services", "positive", "high", "The proposal directly concerns public or civic service capacity."],
      ["mobility", "mixed", "medium", "Users may need access by walking, transit, cycle, road, or service vehicles."],
      ["jobs", "positive", "low", "Service facilities can support local employment, but this screen only flags that question."],
      ["utilities", "mixed", "low", "Some service facilities add electricity or infrastructure requirements."],
    ],
  },
};

const SIGNAL_LABELS = {
  built_environment: "Built environment",
  mobility: "Mobility and access",
  utilities: "Energy and utilities",
  civic_services: "Civic services",
  green_space: "Green/public space",
  jobs: "Jobs and local economy",
};

const GRID_SIGNAL_FIELDS = {
  built_environment: ["buildings", "development_pressure", "planning_intensity"],
  mobility: ["traffic", "traffic_pressure", "transit_access", "bike_access"],
  utilities: ["electricity"],
  civic_services: ["services", "civic_service_context"],
  green_space: ["green_cover", "tree_canopy_context"],
  jobs: ["jobs"],
};

const CONFIDENCE_SCORE = {
  disputed: 0.1,
  inferred: 0.35,
  documented: 0.75,
  corroborated: 0.9,
  low: 0.25,
  medium: 0.55,
  "medium-high": 0.72,
  high: 0.82,
};

const RELIABILITY_SCORE = {
  reject: 0,
  risky: 0.3,
  usable_with_caveats: 0.62,
  strong: 0.88,
};

const SOURCE_CONFIDENCE_ORDER = ["disputed", "inferred", "documented", "corroborated"];

const dataCache = new Map();

function readJson(filePath) {
  const cached = dataCache.get(filePath);
  if (cached) return cached;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  dataCache.set(filePath, parsed);
  return parsed;
}

function readJsonIfExists(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function normalizeCategory(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
  return CATEGORY_ALIASES[normalized] || normalized;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min = 0, max = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function round(value, places = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number(number.toFixed(places));
}

function stableHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function collectCoordinatePairs(value, out = []) {
  if (!Array.isArray(value)) return out;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    out.push([value[0], value[1]]);
    return out;
  }
  for (const item of value) collectCoordinatePairs(item, out);
  return out;
}

function geometryCenter(geometry) {
  if (!geometry || typeof geometry !== "object") return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
  }
  if (geometry.type === "GeometryCollection") {
    const points = [];
    for (const item of geometry.geometries || []) {
      const center = geometryCenter(item);
      if (center) points.push([center.lng, center.lat]);
    }
    return averagePoint(points);
  }
  return averagePoint(collectCoordinatePairs(geometry.coordinates));
}

function averagePoint(points) {
  const clean = (points || []).filter((point) =>
    Array.isArray(point) &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1])
  );
  if (!clean.length) return null;
  const total = clean.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return { lng: total[0] / clean.length, lat: total[1] / clean.length };
}

function proposalLocation(input) {
  const loc = input?.location || {};
  const lng = finiteNumber(loc.lng ?? loc.lon ?? input?.lng ?? input?.lon);
  const lat = finiteNumber(loc.lat ?? input?.lat);
  if (lng !== null && lat !== null && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
    return {
      lng,
      lat,
      label: String(loc.label || input.location_label || input.locationName || "").trim() || null,
    };
  }
  const center = geometryCenter(input?.geometry);
  if (center) {
    return {
      ...center,
      label: String(input.location_label || input.locationName || "").trim() || null,
    };
  }
  return null;
}

function validateProposalInput(input = {}) {
  const errors = [];
  const warnings = [];
  const category = normalizeCategory(input.category || input.type || input.proposal_type);
  if (!VALID_CATEGORIES.has(category)) {
    errors.push(`category must be one of: ${Array.from(VALID_CATEGORIES).join(", ")}`);
  }

  const cityId = String(input.city_id || input.cityId || DEFAULT_CITY_ID).trim().toLowerCase();
  if (!cityId) errors.push("city_id is required");

  const title = String(input.title || input.name || "").trim();
  const description = String(input.description || input.prompt || input.notes || "").trim();
  if (!title && !description) {
    warnings.push("No title or description was supplied, so the proposal is labelled generically.");
  }

  const location = proposalLocation(input);
  if (!location) {
    warnings.push("No usable location or geometry was supplied; local context and distance weighting are limited.");
  }

  const rawScale = String(input.scale || input.size || "unknown").trim().toLowerCase().replace(/[-\s]+/g, "_");
  const scale = ["small", "medium", "large", "unknown"].includes(rawScale) ? rawScale : "unknown";
  if (scale === "unknown") warnings.push("Proposal scale is unknown, so signal strength is conservative.");

  const normalized = {
    schema_version: String(input.schema_version || "1.0.0"),
    proposal_id: String(input.proposal_id || input.proposalId || "").trim(),
    city_id: cityId,
    title: title || description.slice(0, 80) || "Untitled proposal",
    description,
    category,
    category_label: CATEGORY_RULES[category]?.label || category,
    location,
    geometry: input.geometry || (location ? { type: "Point", coordinates: [location.lng, location.lat] } : null),
    scale,
    timeframe: normalizeTimeframe(input.timeframe || input.delivery || input),
    details: input.details && typeof input.details === "object" ? input.details : {},
  };
  if (!normalized.proposal_id) {
    normalized.proposal_id = `proposal-${stableHash(JSON.stringify({
      title: normalized.title,
      category: normalized.category,
      location: normalized.location ? [round(normalized.location.lng, 5), round(normalized.location.lat, 5)] : null,
    }))}`;
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    proposal: normalized,
  };
}

function normalizeTimeframe(input = {}) {
  const start = finiteNumber(input.start_year ?? input.startYear ?? input.year);
  const end = finiteNumber(input.end_year ?? input.endYear ?? input.completionYear);
  const out = {};
  if (Number.isInteger(start)) out.start_year = start;
  if (Number.isInteger(end)) out.end_year = end;
  return Object.keys(out).length ? out : null;
}

function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const lng1 = Number(a.lng ?? a[0]);
  const lat1 = Number(a.lat ?? a[1]);
  const lng2 = Number(b.lng ?? b[0]);
  const lat2 = Number(b.lat ?? b[1]);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return Infinity;
  const radius = 6371000;
  const toRad = Math.PI / 180;
  const deltaLat = (lat2 - lat1) * toRad;
  const deltaLng = (lng2 - lng1) * toRad;
  const q = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

function eventPoint(event) {
  const center = geometryCenter(event.geometry);
  if (center) return center;
  if (Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
    const [lng, lat] = event.coordinates;
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
  }
  return null;
}

function loadSources(rootDir, cityId = DEFAULT_CITY_ID) {
  const sourcePayload = readJsonIfExists(
    path.join(rootDir, "web", "data", "city-atlas", "cities", cityId, "sources.json"),
    null
  ) || readJsonIfExists(path.join(rootDir, "config", "source_registry.json"), { sources: [] });
  const sources = Array.isArray(sourcePayload.sources) ? sourcePayload.sources : [];
  return new Map(sources.map((source) => [source.source_id, source]));
}

function loadAtlasEvents(rootDir, cityId = DEFAULT_CITY_ID) {
  const cacheKey = `events:${rootDir}:${cityId}`;
  const cached = dataCache.get(cacheKey);
  if (cached) return cached;
  const cityDir = path.join(rootDir, "web", "data", "city-atlas", "cities", cityId);
  const index = readJson(path.join(cityDir, "events.json"));
  const events = [];
  for (const chunk of index.chunks || []) {
    if (!chunk.json_path) continue;
    const chunkPath = path.join(rootDir, chunk.json_path);
    const payload = readJsonIfExists(chunkPath, null);
    if (payload && Array.isArray(payload.events)) events.push(...payload.events);
  }
  if (!events.length && Array.isArray(index.events)) events.push(...index.events);
  const payload = { index, events };
  dataCache.set(cacheKey, payload);
  return payload;
}

function loadGrid(rootDir) {
  const gridPath = path.join(rootDir, "web", "data", "mode-a", "grid_2026.geojson");
  const grid = readJsonIfExists(gridPath, null);
  return grid && Array.isArray(grid.features) ? grid : { type: "FeatureCollection", features: [] };
}

function eventMatchesRule(event, rule) {
  const category = String(event.category || "").toLowerCase();
  const lens = String(event.lens || event.signal || "").toLowerCase();
  const signals = (event.affected_signals || []).map((signal) => String(signal).toLowerCase());
  if ((rule.eventCategories || []).includes(category)) return true;
  if ((rule.lenses || []).includes(lens)) return true;
  return signals.some((signal) => (rule.lenses || []).includes(signal) || (rule.affectedSignals || []).includes(signal));
}

function sourceReliability(event, sourceById) {
  const ids = event.source_ids || [];
  if (!ids.length) return { score: 0.35, label: "unknown", sources: [] };
  const sources = ids.map((id) => sourceById.get(id)).filter(Boolean);
  if (!sources.length) return { score: 0.35, label: "unknown", sources: [] };
  const score = sources.reduce((sum, source) => sum + (RELIABILITY_SCORE[source.reliability] ?? 0.45), 0) / sources.length;
  const label = score >= 0.78 ? "strong" : score >= 0.5 ? "usable_with_caveats" : "limited";
  return { score, label, sources };
}

function eventConfidenceScore(event) {
  return CONFIDENCE_SCORE[String(event.confidence || "").toLowerCase()] ?? 0.35;
}

function evidenceLinks(event, sourceById, limit = 4) {
  const links = [];
  for (const evidence of event.evidence || []) {
    links.push({
      source_id: evidence.source_id || null,
      label: evidence.label || evidence.source_id || "Evidence",
      kind: evidence.kind || "source_record",
      url: evidence.url || null,
      file_path: evidence.file_path || null,
      record_id: evidence.record_id || null,
    });
  }
  for (const sourceId of event.source_ids || []) {
    const source = sourceById.get(sourceId);
    if (!source || !source.url) continue;
    if (links.some((link) => link.source_id === sourceId && link.url === source.url)) continue;
    links.push({
      source_id: sourceId,
      label: source.title || sourceId,
      kind: "source_url",
      url: source.url,
      file_path: null,
      record_id: null,
    });
  }
  return links.slice(0, limit);
}

function scoreEventForProposal(event, proposal, sourceById, options = {}) {
  const rule = CATEGORY_RULES[proposal.category] || CATEGORY_RULES.building_development;
  const point = eventPoint(event);
  const proposalPoint = proposal.location;
  const distanceM = proposalPoint && point ? haversineMeters(proposalPoint, point) : null;
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  const categoryScore = eventMatchesRule(event, rule) ? 1 : 0.25;
  const distanceScore = distanceM === null ? 0.35 : Math.exp(-Math.max(0, distanceM) / Math.max(radiusM, 1));
  const year = Number(event.year || CURRENT_CONTEXT_YEAR);
  const age = Math.max(0, CURRENT_CONTEXT_YEAR - year);
  const recencyScore = Math.exp(-age / 7);
  const confidenceScore = eventConfidenceScore(event);
  const reliability = sourceReliability(event, sourceById);
  const sourceScore = reliability.score;
  const weighted =
    categoryScore * 0.34 +
    distanceScore * 0.24 +
    recencyScore * 0.18 +
    confidenceScore * 0.16 +
    sourceScore * 0.08;
  return {
    score: weighted,
    distance_m: distanceM === null ? null : Math.round(distanceM),
    score_breakdown: {
      category: round(categoryScore, 2),
      distance: round(distanceScore, 2),
      recency: round(recencyScore, 2),
      confidence: round(confidenceScore, 2),
      source_quality: round(sourceScore, 2),
    },
    source_quality: reliability.label,
  };
}

function findSimilarEvents(proposal, events, sourceById, options = {}) {
  const rule = CATEGORY_RULES[proposal.category] || CATEGORY_RULES.building_development;
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  const hasLocation = Boolean(proposal.location);
  const localCutoff = Math.max(radiusM * 3.4, 3500);
  const candidates = [];

  for (const event of events) {
    const scored = scoreEventForProposal(event, proposal, sourceById, { radius_m: radiusM });
    const categoryMatch = eventMatchesRule(event, rule);
    const localMatch = hasLocation && scored.distance_m !== null && scored.distance_m <= localCutoff;
    if (!categoryMatch && !localMatch) continue;
    if (hasLocation && !localMatch && scored.score < 0.54) continue;
    candidates.push({ event, ...scored });
  }

  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const output = [];
  for (const candidate of candidates) {
    if (output.length >= MAX_SIMILAR_EVENTS) break;
    const event = candidate.event;
    const point = eventPoint(event);
    const key = [
      String(event.title || "").toLowerCase(),
      event.year || "",
      (event.source_ids || [])[0] || "",
      point ? `${round(point.lng, 4)},${round(point.lat, 4)}` : "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(formatEventMatch(candidate, sourceById));
  }
  return output;
}

function formatEventMatch(candidate, sourceById) {
  const event = candidate.event;
  const point = eventPoint(event);
  return {
    event_id: event.event_id || event.id || null,
    title: event.title || "Past event",
    year: event.year || null,
    effective_date: event.effective_date || null,
    category: event.category || null,
    lens: event.lens || event.signal || null,
    affected_signals: event.affected_signals || [],
    distance_m: candidate.distance_m,
    distance_context: candidate.distance_m === null ? "citywide category match" : distanceLabel(candidate.distance_m),
    confidence: event.confidence || "inferred",
    source_ids: event.source_ids || [],
    source_quality: candidate.source_quality,
    score_breakdown: candidate.score_breakdown,
    explanation: event.explanation || "",
    caveats: event.caveats || [],
    evidence: evidenceLinks(event, sourceById),
    location: point,
  };
}

function distanceLabel(distanceM) {
  if (!Number.isFinite(distanceM)) return "unknown distance";
  if (distanceM < 1000) return `${Math.round(distanceM)} m away`;
  return `${round(distanceM / 1000, 1)} km away`;
}

function findNearbyEvents(proposal, events, sourceById, options = {}) {
  if (!proposal.location) return [];
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  return events
    .map((event) => {
      const point = eventPoint(event);
      if (!point) return null;
      const distanceM = haversineMeters(proposal.location, point);
      if (!Number.isFinite(distanceM) || distanceM > radiusM) return null;
      const reliability = sourceReliability(event, sourceById);
      return {
        event,
        distance_m: Math.round(distanceM),
        source_quality: reliability.label,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, MAX_NEARBY_EVENTS)
    .map((candidate) => formatEventMatch({
      event: candidate.event,
      distance_m: candidate.distance_m,
      source_quality: candidate.source_quality,
      score_breakdown: {},
    }, sourceById));
}

function extractCurrentContext(proposal, rootDir, options = {}) {
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  const grid = loadGrid(rootDir);
  if (!proposal.location) {
    return {
      radius_m: radiusM,
      current_signals: [],
      nearest_cells: [],
      source_confidence: "low",
      caveats: ["No local point or geometry was supplied, so current signal context could not be extracted."],
    };
  }

  const rows = [];
  for (const feature of grid.features || []) {
    const center = geometryCenter(feature.geometry);
    if (!center) continue;
    const distanceM = haversineMeters(proposal.location, center);
    if (distanceM <= radiusM) {
      rows.push({ feature, center, distance_m: distanceM });
    }
  }
  rows.sort((a, b) => a.distance_m - b.distance_m);
  if (!rows.length && grid.features?.length) {
    let nearest = null;
    for (const feature of grid.features) {
      const center = geometryCenter(feature.geometry);
      if (!center) continue;
      const distanceM = haversineMeters(proposal.location, center);
      if (!nearest || distanceM < nearest.distance_m) nearest = { feature, center, distance_m: distanceM };
    }
    if (nearest) rows.push(nearest);
  }

  const weightedRows = rows.map((row) => ({
    ...row,
    weight: Math.exp(-row.distance_m / Math.max(radiusM, 1)),
  }));
  const currentSignals = Object.entries(GRID_SIGNAL_FIELDS).map(([signal, fields]) => {
    const values = fields
      .map((field) => weightedAverage(weightedRows, (row) => row.feature.properties?.[field]))
      .filter((value) => value !== null);
    const value = values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null;
    const evidence = uniqueStrings(weightedRows.flatMap((row) => row.feature.properties?.evidence || [])).slice(0, 4);
    return {
      signal,
      label: SIGNAL_LABELS[signal] || signal,
      value: value === null ? null : round(value, 2),
      level: value === null ? "unknown" : levelForValue(value),
      fields,
      evidence,
      source_confidence: confidenceFromGrid(weightedRows),
    };
  });

  return {
    radius_m: radiusM,
    current_signals: currentSignals,
    nearest_cells: rows.slice(0, 6).map((row) => {
      const props = row.feature.properties || {};
      return {
        cell_id: props.cell_id || row.feature.id || null,
        distance_m: Math.round(row.distance_m),
        dominant_metric: props.dominant_metric || null,
        confidence: props.confidence || "medium",
        evidence: props.evidence || [],
      };
    }),
    source_confidence: confidenceFromGrid(weightedRows),
    caveats: rows.length
      ? ["Current-context values are normalized local screening signals, not measured outcomes for the proposal."]
      : ["No grid cell context was available near this proposal."],
  };
}

function weightedAverage(rows, getter) {
  let total = 0;
  let weightTotal = 0;
  for (const row of rows) {
    const value = finiteNumber(getter(row));
    if (value === null) continue;
    total += value * row.weight;
    weightTotal += row.weight;
  }
  return weightTotal > 0 ? total / weightTotal : null;
}

function confidenceFromGrid(rows) {
  if (!rows.length) return "low";
  const avg = rows.reduce((sum, row) => sum + (CONFIDENCE_SCORE[row.feature.properties?.confidence] ?? 0.55), 0) / rows.length;
  if (avg >= 0.72) return "high";
  if (avg >= 0.48) return "medium";
  return "low";
}

function levelForValue(value) {
  if (!Number.isFinite(value)) return "unknown";
  if (value >= 0.67) return "high";
  if (value >= 0.34) return "medium";
  return "low";
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function signalContext(localContext, signal) {
  return (localContext.current_signals || []).find((item) => item.signal === signal) || null;
}

function strengthRank(value) {
  return value === "high" ? 3 : value === "medium" ? 2 : value === "low" ? 1 : 0;
}

function rankStrength(rank) {
  if (rank >= 3) return "high";
  if (rank >= 2) return "medium";
  return "low";
}

function directionPhrase(direction) {
  if (direction === "positive") return "the signal may improve or gain capacity";
  if (direction === "negative") return "the signal may come under more pressure";
  if (direction === "mixed") return "the signal could move in more than one direction";
  return "the direction is not clear from the available evidence";
}

function buildImpactSketch(proposal, similarEvents, localContext) {
  const rule = CATEGORY_RULES[proposal.category] || CATEGORY_RULES.building_development;
  const scaleBoost = proposal.scale === "large" ? 1 : proposal.scale === "small" ? -1 : 0;
  const output = [];
  for (const [signal, baseDirection, baseStrength, baseReason] of rule.outputSignals) {
    const context = signalContext(localContext, signal);
    const eventMatches = similarEvents.filter((event) => {
      const lens = String(event.lens || "").toLowerCase();
      const category = String(event.category || "").toLowerCase();
      const signals = (event.affected_signals || []).map((item) => String(item).toLowerCase());
      return lens.includes(signal.split("_")[0]) ||
        signals.includes(signal) ||
        (signal === "mobility" && (category === "transport" || lens === "mobility")) ||
        (signal === "utilities" && category === "utilities") ||
        (signal === "built_environment" && category === "built_environment") ||
        (signal === "civic_services" && category === "civic_services") ||
        (signal === "jobs" && (category === "economy" || lens === "jobs"));
    });
    const contextBoost = context?.level === "high" ? 1 : context?.level === "low" ? -0.25 : 0;
    const evidenceBoost = eventMatches.length >= 3 ? 0.5 : eventMatches.length ? 0.2 : -0.4;
    const strength = rankStrength(strengthRank(baseStrength) + scaleBoost + contextBoost + evidenceBoost);
    const evidence = collectSignalEvidence(eventMatches, localContext, signal);
    const confidence = confidenceForSignal(eventMatches, context, proposal);
    const caveats = signalCaveats(signal, eventMatches, context, proposal);
    output.push({
      signal,
      label: SIGNAL_LABELS[signal] || signal,
      direction: baseDirection,
      direction_note: directionPhrase(baseDirection),
      strength,
      confidence,
      reason: [
        baseReason,
        context ? `Current local ${context.label.toLowerCase()} context is ${context.level}.` : "No current local context was available for this signal.",
        eventMatches.length
          ? `${eventMatches.length} similar or nearby event${eventMatches.length === 1 ? "" : "s"} support reviewing this signal.`
          : "No close analogue in this signal was found in the local event catalog.",
      ].join(" "),
      evidence,
      caveats,
      investigate: investigationPrompt(signal, proposal.category),
    });
  }
  return output;
}

function collectSignalEvidence(eventMatches, localContext, signal) {
  const links = [];
  for (const event of eventMatches.slice(0, 3)) {
    links.push({
      type: "event",
      event_id: event.event_id,
      title: event.title,
      year: event.year,
      distance_m: event.distance_m,
      confidence: event.confidence,
      evidence: (event.evidence || []).slice(0, 2),
    });
  }
  const context = signalContext(localContext, signal);
  if (context) {
    links.push({
      type: "current_context",
      signal,
      label: context.label,
      level: context.level,
      value: context.value,
      evidence: context.evidence || [],
    });
  }
  return links;
}

function confidenceForSignal(events, context, proposal) {
  let score = 0.2;
  if (proposal.location) score += 0.15;
  if (context && context.level !== "unknown") score += 0.16;
  if (events.length >= 4) score += 0.22;
  else if (events.length >= 2) score += 0.14;
  else if (events.length === 1) score += 0.07;
  const documented = events.filter((event) => ["documented", "corroborated"].includes(event.confidence)).length;
  if (documented >= 2) score += 0.18;
  else if (documented === 1) score += 0.1;
  const inferredShare = events.length ? events.filter((event) => event.confidence === "inferred").length / events.length : 1;
  if (inferredShare > 0.65) score -= 0.12;
  if (proposal.scale === "unknown") score -= 0.06;
  return confidenceLabel(score);
}

function confidenceLabel(score) {
  if (score >= 0.68) return "high";
  if (score >= 0.42) return "medium";
  return "low";
}

function signalCaveats(signal, events, context, proposal) {
  const caveats = [];
  if (!proposal.location) caveats.push("No site geometry was supplied, so this signal is not locally distance-weighted.");
  if (!events.length) caveats.push("No close analogue was found for this signal in the local event catalog.");
  if (events.some((event) => event.confidence === "inferred")) {
    caveats.push("Some evidence is inferred from mapped visibility or proxy records.");
  }
  if (!context || context.level === "unknown") caveats.push("Current local signal context is incomplete.");
  if (signal === "utilities") caveats.push("Utilities context is a screening signal and is not an engineering approval.");
  if (signal === "mobility") caveats.push("Mobility context does not replace transport modelling or junction analysis.");
  if (signal === "green_space") caveats.push("Green-space direction depends on design details that may not be in the proposal sketch.");
  return uniqueStrings(caveats);
}

function investigationPrompt(signal, category) {
  if (signal === "mobility") return "Check walking, cycling, transit, road access, servicing, and any safety or severance evidence.";
  if (signal === "utilities") return "Ask whether capacity, connection, and asset ownership evidence exists for the site.";
  if (signal === "civic_services") return "Check nearby service capacity, opening hours, catchments, and accessibility.";
  if (signal === "green_space") return "Check tree canopy, public-space access, drainage, and any habitat or heat-exposure context.";
  if (signal === "jobs") return "Check whether the proposal directly includes jobs or only changes access to employment areas.";
  if (category === "building_development") return "Check planning status, completion evidence, tenure/use mix, and site constraints.";
  return "Check the source records behind the closest analogues before relying on this signal.";
}

function buildConfidence(proposal, similarEvents, localContext, nearbyEvents, affectedSignals = []) {
  let score = 0.18;
  const reasons = [];
  if (proposal.location) {
    score += 0.16;
    reasons.push("A usable location allows distance-weighted local context.");
  } else {
    reasons.push("No usable location was supplied, so distance weighting is weak.");
  }
  if ((localContext.current_signals || []).length) {
    score += 0.16;
    reasons.push("Current local signal values were found in the 2026 grid.");
  } else {
    reasons.push("Current local signal values are missing.");
  }
  if (similarEvents.length >= 5) {
    score += 0.22;
    reasons.push("Several historical analogues were found.");
  } else if (similarEvents.length >= 2) {
    score += 0.14;
    reasons.push("A small set of historical analogues was found.");
  } else {
    reasons.push("Few historical analogues were found.");
  }
  const documented = similarEvents.filter((event) => ["documented", "corroborated"].includes(event.confidence)).length;
  if (documented >= 2) {
    score += 0.18;
    reasons.push("At least two similar events are documented or corroborated.");
  } else if (documented === 1) {
    score += 0.1;
    reasons.push("One similar event is documented or corroborated.");
  } else {
    reasons.push("Most similar events are inferred or lower-confidence records.");
  }
  if (nearbyEvents.length >= 5) score += 0.08;
  if (proposal.scale === "unknown") {
    score -= 0.06;
    reasons.push("Proposal scale is unknown.");
  }
  const inferredShare = similarEvents.length
    ? similarEvents.filter((event) => event.confidence === "inferred").length / similarEvents.length
    : 1;
  if (inferredShare > 0.65) {
    score -= 0.12;
    reasons.push("Most analogue evidence is inferred, often from OSM mapped visibility.");
  }

  let label = confidenceLabel(score);
  if (affectedSignals.length) {
    const signalRanks = affectedSignals.map((signal) => strengthRank(signal.confidence));
    const highSignals = signalRanks.filter((rank) => rank >= 3).length;
    const mediumSignals = signalRanks.filter((rank) => rank >= 2).length;
    if (label === "high" && highSignals === 0) {
      label = mediumSignals >= 2 ? "medium" : "low";
      reasons.push("Headline confidence is capped because signal-level evidence is not high.");
    } else if (label === "medium" && mediumSignals === 0) {
      label = "low";
      reasons.push("Headline confidence is capped because all signal-level evidence is low.");
    }
  }

  return {
    label,
    reasons: uniqueStrings(reasons),
  };
}

function globalCaveats(proposal, similarEvents, localContext) {
  const caveats = [
    "This is an analogue and context screen, not a calibrated outcome model.",
    "Similar past events do not establish causation.",
    "Direction and strength labels are planning prompts, not measured future effects.",
  ];
  if (!proposal.location) caveats.push("Missing location means local context and distance scoring are limited.");
  if (!similarEvents.length) caveats.push("No similar events were found, so confidence is low.");
  if (similarEvents.some((event) => event.confidence === "inferred")) {
    caveats.push("OSM-derived records show mapped visibility dates and may not match real-world completion dates.");
  }
  if (similarEvents.some((event) => /planning/i.test((event.source_ids || []).join(" ") + " " + event.title))) {
    caveats.push("Planning records can show decisions or applications rather than completed construction.");
  }
  for (const item of localContext.caveats || []) caveats.push(item);
  return uniqueStrings(caveats);
}

function buildEvidenceSummary(similarEvents, nearbyEvents, localContext) {
  const sourceIds = new Set();
  for (const event of similarEvents.concat(nearbyEvents)) {
    for (const id of event.source_ids || []) sourceIds.add(id);
  }
  const eventEvidence = similarEvents.slice(0, 5).map((event) => ({
    event_id: event.event_id,
    title: event.title,
    year: event.year,
    confidence: event.confidence,
    evidence: event.evidence,
  }));
  return {
    source_ids: Array.from(sourceIds).sort(),
    similar_event_evidence: eventEvidence,
    current_context_evidence: (localContext.current_signals || [])
      .filter((signal) => signal.evidence?.length)
      .map((signal) => ({
        signal: signal.signal,
        label: signal.label,
        level: signal.level,
        value: signal.value,
        evidence: signal.evidence,
      })),
  };
}

function summarySentence(proposal, affectedSignals, confidence) {
  const labels = affectedSignals.slice(0, 4).map((signal) => signal.label.toLowerCase());
  const signalText = labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
    : labels[0] || "local signals";
  return `Based on similar past events and current local context, this ${proposal.category_label} may affect ${signalText}. Confidence is ${confidence.label}; review the evidence and caveats before using it in planning discussion.`;
}

function methodNote(options = {}) {
  return {
    model_version: MODEL_VERSION,
    method: "Deterministic historical analogue lookup plus local context extraction.",
    similarity_weights: {
      category: 0.34,
      distance: 0.24,
      recency: 0.18,
      confidence: 0.16,
      source_quality: 0.08,
    },
    current_context_year: CURRENT_CONTEXT_YEAR,
    radius_m: Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M),
    limitations: [
      "The method retrieves and summarizes evidence. It does not estimate calibrated outcomes.",
      "Distance, recency, and category weights are transparent heuristics.",
      "Sparse or inferred data lowers confidence.",
    ],
  };
}

function assessProposal(input = {}, options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const validation = validateProposalInput(input);
  if (!validation.ok) {
    const error = new Error(validation.errors.join("; "));
    error.statusCode = 422;
    error.validation = validation;
    throw error;
  }
  const proposal = validation.proposal;
  const sourceById = loadSources(rootDir, proposal.city_id);
  const atlas = loadAtlasEvents(rootDir, proposal.city_id);
  const similarEvents = findSimilarEvents(proposal, atlas.events, sourceById, options);
  const nearbyEvents = findNearbyEvents(proposal, atlas.events, sourceById, options);
  const localContext = {
    ...extractCurrentContext(proposal, rootDir, options),
    nearby_historical_events: nearbyEvents,
    nearby_event_count: nearbyEvents.length,
  };
  const affectedSignals = buildImpactSketch(proposal, similarEvents, localContext);
  const confidence = buildConfidence(proposal, similarEvents, localContext, nearbyEvents, affectedSignals);
  const caveats = globalCaveats(proposal, similarEvents, localContext);
  const evidence = buildEvidenceSummary(similarEvents, nearbyEvents, localContext);
  return {
    ok: true,
    mode: "proposal_impact_sketch",
    generated_at: new Date().toISOString(),
    proposal,
    summary: summarySentence(proposal, affectedSignals, confidence),
    affected_signals: affectedSignals,
    similar_events: similarEvents,
    local_context: localContext,
    confidence,
    caveats,
    evidence,
    warnings: validation.warnings,
    method: methodNote(options),
  };
}

module.exports = {
  MODEL_VERSION,
  VALID_CATEGORIES,
  CATEGORY_RULES,
  DEFAULT_RADIUS_M,
  assessProposal,
  buildImpactSketch,
  extractCurrentContext,
  findSimilarEvents,
  haversineMeters,
  loadAtlasEvents,
  normalizeCategory,
  validateProposalInput,
};
