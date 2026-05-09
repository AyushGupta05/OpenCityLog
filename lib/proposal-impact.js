const fs = require("fs");
const path = require("path");

const MODEL_VERSION = "bims5-proposal-impact-sketch-v1";
const CURRENT_CONTEXT_YEAR = 2026;
const DEFAULT_CITY_ID = "belfast";
const DEFAULT_RADIUS_M = 1500;
const MAX_SIMILAR_EVENTS = 8;
const MAX_NEARBY_EVENTS = 16;
const MAX_PROPOSAL_CATEGORY_SCAN = 6000;

const VALID_CATEGORIES = new Set([
  "building_development",
  "road_transport_change",
  "energy_infrastructure",
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
  transformer: "energy_infrastructure",
  transformer_energy_infrastructure: "energy_infrastructure",
  energy: "energy_infrastructure",
  electricity: "energy_infrastructure",
  utilities: "energy_infrastructure",
  grid: "energy_infrastructure",
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
  energy_infrastructure: {
    label: "energy infrastructure",
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
    eventCategories: ["environment", "civic_services", "built_environment"],
    lenses: ["green_space", "environment", "services", "buildings"],
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

const SIGNAL_EVENT_RULES = {
  built_environment: {
    categories: ["built_environment"],
    lenses: ["buildings", "planning"],
    text: /\b(planning|development|housing|mixed.use|brownfield|building|construction|heritage|listed|conservation)\b/i,
  },
  mobility: {
    categories: ["transport"],
    lenses: ["mobility", "traffic"],
    text: /\b(traffic|transport|transit|mobility|road|street|station|bus|rail|cycle|walking|pedestrian|junction)\b/i,
  },
  utilities: {
    categories: ["utilities"],
    lenses: ["utilities", "electricity"],
    text: /\b(utility|utilities|electricity|grid|substation|transformer|power|energy)\b/i,
  },
  civic_services: {
    categories: ["civic_services"],
    lenses: ["services", "civic"],
    text: /\b(school|health|community|library|service|civic|facility|university|hospital)\b/i,
  },
  green_space: {
    categories: ["environment"],
    lenses: ["green_space", "environment"],
    text: /\b(green|park|tree|public realm|open space|flood|drainage|air quality|heat|resilience|biodiversity)\b/i,
  },
  jobs: {
    categories: ["economy"],
    lenses: ["jobs", "economy"],
    text: /\b(job|jobs|employment|retail|office|business|economy|commercial|high street)\b/i,
  },
};

const DESIGN_REVIEW_THEMES = [
  {
    id: "local_context",
    label: "Local context and character",
    signals: ["built_environment"],
    description: "Check whether the precedent responds to surrounding grain, heritage, scale, land use, and existing source limitations.",
  },
  {
    id: "connectivity",
    label: "Connectivity and access",
    signals: ["mobility"],
    description: "Review walking, cycling, public transport, servicing, crossings, and barriers between neighbouring communities.",
  },
  {
    id: "public_realm",
    label: "Public realm and inclusion",
    signals: ["green_space", "civic_services"],
    description: "Look for evidence about comfort, safety, accessibility, stewardship, and who can use the space at eye level.",
  },
  {
    id: "healthy_environment",
    label: "Healthy environment and resilience",
    signals: ["green_space", "utilities"],
    description: "Check tree, drainage, heat, air-quality, energy, and maintenance records before attaching environmental claims.",
  },
  {
    id: "mixed_use_value",
    label: "Use mix and everyday value",
    signals: ["jobs", "civic_services", "built_environment"],
    description: "Review whether the record shows daily services, active edges, jobs, housing, or only an administrative milestone.",
  },
];

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
const SPATIAL_CELL_DEGREES = 0.05;

const dataCache = new Map();
const eventPointCache = new WeakMap();
const eventSignalTextCache = new WeakMap();

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
  if (!event || typeof event !== "object") return null;
  if (eventPointCache.has(event)) return eventPointCache.get(event);
  const center = geometryCenter(event.geometry);
  eventPointCache.set(event, center);
  if (center) return center;
  if (Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
    const [lng, lat] = event.coordinates;
    const point = Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
    eventPointCache.set(event, point);
    return point;
  }
  eventPointCache.set(event, null);
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
  prepareAtlasEvents(events);
  const payload = { index, events };
  dataCache.set(cacheKey, payload);
  return payload;
}

function prepareAtlasEvents(events) {
  if (!Array.isArray(events) || events.__proposalIndex) return;
  const byProposalCategory = {};
  for (const category of VALID_CATEGORIES) byProposalCategory[category] = [];
  const spatial = new Map();
  for (const event of events) {
    const point = eventPoint(event);
    if (point) {
      const key = spatialCellKey(point.lng, point.lat);
      if (!spatial.has(key)) spatial.set(key, []);
      spatial.get(key).push(event);
    }
    for (const [category, rule] of Object.entries(CATEGORY_RULES)) {
      if (eventMatchesRule(event, rule)) byProposalCategory[category].push(event);
    }
  }
  for (const eventsForCategory of Object.values(byProposalCategory)) {
    eventsForCategory.sort((a, b) => staticCandidateScore(b) - staticCandidateScore(a));
  }
  Object.defineProperty(events, "__proposalIndex", {
    value: { byProposalCategory, spatial },
    enumerable: false,
    configurable: true,
  });
}

function staticCandidateScore(event) {
  const year = Number(event.year || 0);
  const recency = Math.max(0, Math.min(40, (year - 1990) / 1.2));
  const confidence = eventConfidenceScore(event) * 36;
  const sourceCount = Math.min(4, (event.source_ids || []).length) * 5;
  const id = String(event.event_id || "");
  const title = String(event.title || "");
  let score = recency + confidence + sourceCount;
  if (/(?:^|-)milestone-|official-source/i.test(id)) score += 42;
  if (/planning|development|transport|street|station|park|public realm|housing|brownfield|heritage|conservation/i.test(title)) score += 18;
  if (/^(lon_|nyc_|planning-)/i.test(id)) score -= 18;
  if (/food hygiene|false alarm|stop and search|crime/i.test(title)) score -= 28;
  return score;
}

function spatialCellKey(lng, lat) {
  return `${Math.floor(Number(lng) / SPATIAL_CELL_DEGREES)}:${Math.floor(Number(lat) / SPATIAL_CELL_DEGREES)}`;
}

function eventsNearLocation(location, events, radiusM) {
  if (!location || !Array.isArray(events)) return [];
  const index = events.__proposalIndex;
  if (!index?.spatial) {
    return events.map((event) => {
      const point = eventPoint(event);
      if (!point) return null;
      const distanceM = haversineMeters(location, point);
      return Number.isFinite(distanceM) && distanceM <= radiusM ? { event, distance_m: Math.round(distanceM) } : null;
    }).filter(Boolean).sort((a, b) => a.distance_m - b.distance_m);
  }
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const lngScale = Math.max(0.2, Math.cos(lat * Math.PI / 180));
  const latRange = radiusM / 111_320;
  const lngRange = radiusM / (111_320 * lngScale);
  const minX = Math.floor((lng - lngRange) / SPATIAL_CELL_DEGREES) - 1;
  const maxX = Math.floor((lng + lngRange) / SPATIAL_CELL_DEGREES) + 1;
  const minY = Math.floor((lat - latRange) / SPATIAL_CELL_DEGREES) - 1;
  const maxY = Math.floor((lat + latRange) / SPATIAL_CELL_DEGREES) + 1;
  const seen = new Set();
  const rows = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (const event of index.spatial.get(`${x}:${y}`) || []) {
        if (seen.has(event)) continue;
        seen.add(event);
        const point = eventPoint(event);
        const distanceM = point ? haversineMeters(location, point) : Infinity;
        if (Number.isFinite(distanceM) && distanceM <= radiusM) {
          rows.push({ event, distance_m: Math.round(distanceM) });
        }
      }
    }
  }
  return rows.sort((a, b) => a.distance_m - b.distance_m);
}

function loadGrid(_rootDir) {
  return { type: "FeatureCollection", features: [] };
}

function eventMatchesRule(event, rule) {
  const category = String(event.category || "").toLowerCase();
  const lens = String(event.lens || event.signal || "").toLowerCase();
  const signals = (event.affected_signals || []).map((signal) => String(signal).toLowerCase());
  if ((rule.eventCategories || []).includes(category)) return true;
  if ((rule.lenses || []).includes(lens)) return true;
  return signals.some((signal) => (rule.lenses || []).includes(signal));
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
  const indexed = events.__proposalIndex?.byProposalCategory?.[proposal.category];
  const seedEvents = new Set(indexed ? indexed.slice(0, MAX_PROPOSAL_CATEGORY_SCAN) : events);
  if (hasLocation) {
    for (const row of eventsNearLocation(proposal.location, events, localCutoff)) {
      seedEvents.add(row.event);
    }
  }
  const candidates = [];

  for (const event of seedEvents) {
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
    match_score: round(candidate.score, 3),
    match_factors: matchFactors(candidate.score_breakdown),
    score_breakdown: candidate.score_breakdown,
    explanation: event.explanation || "",
    caveats: event.caveats || [],
    evidence: evidenceLinks(event, sourceById),
    location: point,
  };
}

function matchFactors(scoreBreakdown = {}) {
  const labels = {
    category: "same change family",
    distance: "near the proposal",
    recency: "recent enough to review",
    confidence: "evidence confidence",
    source_quality: "source quality",
  };
  return Object.entries(scoreBreakdown)
    .map(([key, value]) => ({
      factor: key,
      label: labels[key] || key,
      value: round(value, 2),
    }))
    .filter((item) => item.value !== null)
    .sort((a, b) => b.value - a.value);
}

function distanceLabel(distanceM) {
  if (!Number.isFinite(distanceM)) return "unknown distance";
  if (distanceM < 1000) return `${Math.round(distanceM)} m away`;
  return `${round(distanceM / 1000, 1)} km away`;
}

function findNearbyEvents(proposal, events, sourceById, options = {}) {
  if (!proposal.location) return [];
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  return eventsNearLocation(proposal.location, events, radiusM)
    .map(({ event, distance_m }) => {
      const reliability = sourceReliability(event, sourceById);
      return {
        event,
        distance_m,
        source_quality: reliability.label,
      };
    })
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

function eventSignalText(event) {
  if (!event || typeof event !== "object") return "";
  if (eventSignalTextCache.has(event)) return eventSignalTextCache.get(event);
  const text = [
    event.title,
    event.category,
    event.lens,
    event.explanation,
    event.affected_area?.label,
    ...(event.affected_signals || []),
    ...(event.source_ids || []),
  ].filter(Boolean).join(" ");
  eventSignalTextCache.set(event, text);
  return text;
}

function eventMatchesSignal(event, signal) {
  const rule = SIGNAL_EVENT_RULES[signal];
  if (!rule) return false;
  const category = String(event.category || "").toLowerCase();
  const lens = String(event.lens || event.signal || "").toLowerCase();
  const signals = (event.affected_signals || []).map((item) => String(item).toLowerCase());
  if ((rule.categories || []).includes(category)) return true;
  if ((rule.lenses || []).includes(lens)) return true;
  if (signals.includes(signal)) return true;
  return rule.text.test(eventSignalText(event));
}

function eventSourceScore(event, sourceById) {
  return sourceReliability(event, sourceById).score;
}

function deriveEventContextSignals(proposal, events, sourceById, options = {}) {
  if (!proposal.location) return null;
  const radiusM = Number(options.radius_m || options.radiusM || DEFAULT_RADIUS_M);
  const contextRadius = Math.max(radiusM, 1200);
  const nearby = eventsNearLocation(proposal.location, events || [], contextRadius);
  nearby.sort((a, b) => a.distance_m - b.distance_m);
  if (!nearby.length) return null;

  const signals = Object.keys(GRID_SIGNAL_FIELDS).map((signal) => {
    const matches = nearby
      .filter(({ event }) => eventMatchesSignal(event, signal))
      .map(({ event, distance_m }) => {
        const distanceWeight = Math.exp(-distance_m / Math.max(contextRadius, 1));
        const evidenceWeight = eventConfidenceScore(event) * 0.62 + eventSourceScore(event, sourceById) * 0.38;
        return {
          event,
          distance_m,
          weight: distanceWeight * evidenceWeight,
        };
      })
      .sort((a, b) => b.weight - a.weight);
    const weightedEvidence = matches.reduce((sum, row) => sum + row.weight, 0);
    const value = matches.length ? round(Math.min(1, weightedEvidence / 3.6), 2) : null;
    return {
      signal,
      label: SIGNAL_LABELS[signal] || signal,
      value,
      level: value === null ? "unknown" : levelForValue(value),
      fields: ["nearby_event_density", "event_confidence", "source_quality"],
      evidence: matches.slice(0, 3).map(({ event, distance_m }) => {
        const title = event.title || event.event_id || "Historical event";
        const year = event.year || event.effective_date || "date unknown";
        return `${title} (${year}; ${distanceLabel(distance_m)})`;
      }),
      supporting_events: matches.slice(0, 5).map(({ event, distance_m }) => ({
        event_id: event.event_id || event.id || null,
        title: event.title || "Historical event",
        year: event.year || null,
        category: event.category || null,
        confidence: event.confidence || "inferred",
        distance_m,
        source_ids: event.source_ids || [],
      })),
      source_confidence: contextConfidenceFromEvents(matches.map((row) => row.event)),
      context_basis: "nearby_historical_event_density",
    };
  });

  return {
    context_basis: "nearby_historical_event_density",
    context_radius_m: contextRadius,
    nearby_event_sample: nearby.slice(0, 8).map(({ event, distance_m }) => ({
      event_id: event.event_id || event.id || null,
      title: event.title || "Historical event",
      year: event.year || null,
      category: event.category || null,
      confidence: event.confidence || "inferred",
      distance_m,
    })),
    signals,
    source_confidence: contextConfidenceFromEvents(nearby.map((row) => row.event)),
  };
}

function contextConfidenceFromEvents(events) {
  if (!events.length) return "low";
  const score = events.reduce((sum, event) => sum + eventConfidenceScore(event), 0) / events.length;
  if (score >= 0.7) return "high";
  if (score >= 0.42) return "medium";
  return "low";
}

function hasMeasuredGridContext(localContext) {
  return Boolean((localContext.nearest_cells || []).length) &&
    (localContext.current_signals || []).some((item) => item.value !== null && item.level !== "unknown");
}

function hasEventDerivedContext(localContext) {
  return localContext.context_basis === "nearby_historical_event_density" &&
    (localContext.current_signals || []).some((item) => item.value !== null && item.level !== "unknown");
}

function mergeEventContext(baseContext, eventContext) {
  if (!eventContext) return baseContext;
  const eventSignals = new Map(eventContext.signals.map((signal) => [signal.signal, signal]));
  const currentSignals = (baseContext.current_signals || []).map((signal) => {
    const eventSignal = eventSignals.get(signal.signal);
    if (!eventSignal) return signal;
    if (signal.value !== null && signal.level !== "unknown") {
      return {
        ...signal,
        supporting_events: eventSignal.supporting_events,
        context_basis: "grid_and_nearby_historical_events",
        evidence: uniqueStrings([...(signal.evidence || []), ...(eventSignal.evidence || [])]).slice(0, 6),
      };
    }
    return eventSignal;
  });
  for (const eventSignal of eventContext.signals) {
    if (!currentSignals.some((signal) => signal.signal === eventSignal.signal)) currentSignals.push(eventSignal);
  }
  const caveats = uniqueStrings([
    ...(baseContext.caveats || []),
    "Nearby historical event density is used as context when measured current signal cells are unavailable.",
    "Event-density context shows what has been documented near the site; it is not a direct measurement of current conditions.",
  ]);
  return {
    ...baseContext,
    current_signals: currentSignals,
    source_confidence: baseContext.source_confidence === "high" ? "high" : eventContext.source_confidence,
    context_basis: hasMeasuredGridContext(baseContext) ? "grid_and_nearby_historical_events" : eventContext.context_basis,
    context_radius_m: eventContext.context_radius_m,
    nearby_event_sample: eventContext.nearby_event_sample,
    caveats,
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

function hasMeasuredCurrentContext(localContext) {
  return hasMeasuredGridContext(localContext);
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
  const output = [];
  for (const [signal, baseDirection, baseStrength, baseReason] of rule.outputSignals) {
    const scaleBoost = proposal.scale === "large" ? 1 : proposal.scale === "small" && !(proposal.category === "energy_infrastructure" && signal === "utilities") ? -1 : 0;
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
  if (!context || context.level === "unknown") {
    caveats.push("Current local signal context is incomplete.");
  } else if (context.context_basis === "nearby_historical_event_density") {
    caveats.push("Current context is based on nearby documented event density, not a direct measurement of present conditions.");
  }
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
  if (hasMeasuredCurrentContext(localContext)) {
    score += 0.16;
    reasons.push("Current local signal values were found in source-backed context data.");
  } else if (hasEventDerivedContext(localContext)) {
    score += 0.1;
    reasons.push("Nearby historical records provide event-density context, but not measured current conditions.");
  } else {
    reasons.push("Current local signal values are missing or retired.");
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

function designReviewBasis(proposal, affectedSignals, localContext) {
  const signalById = new Map((affectedSignals || []).map((signal) => [signal.signal, signal]));
  const contextById = new Map((localContext.current_signals || []).map((signal) => [signal.signal, signal]));
  return DESIGN_REVIEW_THEMES.map((theme) => {
    const signals = theme.signals
      .map((signalId) => signalById.get(signalId) || contextById.get(signalId))
      .filter(Boolean);
    const strongest = signals.reduce((best, signal) => {
      if (!best) return signal;
      return strengthRank(signal.confidence || signal.level) > strengthRank(best.confidence || best.level) ? signal : best;
    }, null);
    const evidenceCount = signals.reduce((sum, signal) => {
      const eventCount = Array.isArray(signal.supporting_events) ? signal.supporting_events.length : 0;
      const evidenceCount = Array.isArray(signal.evidence) ? signal.evidence.length : 0;
      return sum + Math.max(eventCount, evidenceCount);
    }, 0);
    const status = evidenceCount >= 3 ? "ready_to_review" : evidenceCount > 0 ? "thin_evidence" : "gap";
    return {
      theme: theme.id,
      label: theme.label,
      status,
      evidence_count: evidenceCount,
      confidence: strongest?.confidence || strongest?.source_confidence || "low",
      description: theme.description,
      review_prompt: designReviewPrompt(theme.id, proposal.category),
      signals: signals.map((signal) => ({
        signal: signal.signal,
        label: signal.label || SIGNAL_LABELS[signal.signal] || signal.signal,
        level: signal.level || signal.strength || "unknown",
        confidence: signal.confidence || signal.source_confidence || "low",
      })),
    };
  });
}

function designReviewPrompt(themeId, category) {
  if (themeId === "connectivity") return "Compare desire lines, public transport access, crossing comfort, servicing, and barrier effects before design choices are fixed.";
  if (themeId === "public_realm") return "Pair the source record with public-life observation: who moves, who stays, who is missing, and when the place feels usable.";
  if (themeId === "healthy_environment") return "Check direct environmental records and maintenance responsibilities before writing resilience or health claims.";
  if (themeId === "mixed_use_value") return "Separate permission, delivery, active use, and local service value in the source brief.";
  if (category === "building_development") return "Check scale, frontage, heritage, daylight, servicing, and completion evidence against comparable records.";
  return "Use the source-backed precedent to define fieldwork questions and citation needs.";
}

function summarySentence(proposal, affectedSignals, confidence) {
  const labels = affectedSignals.slice(0, 4).map((signal) => signal.label.toLowerCase());
  const signalText = labels.length > 1
    ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
    : labels[0] || "local signals";
  return `Based on similar past events and source-backed local context, this ${proposal.category_label} may affect ${signalText}. Confidence is ${confidence.label}; review the evidence and caveats before using it in planning discussion.`;
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
    current_context_sources: [
      "source-backed grid cells when available",
      "nearby historical event density when grid cells are absent",
    ],
    limitations: [
      "The method retrieves and summarizes evidence. It does not estimate calibrated outcomes.",
      "Distance, recency, and category weights are transparent heuristics.",
      "Event-density context is not a direct measurement of present conditions.",
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
  const baseContext = extractCurrentContext(proposal, rootDir, options);
  const eventContext = deriveEventContextSignals(proposal, atlas.events, sourceById, options);
  const localContext = {
    ...mergeEventContext(baseContext, eventContext),
    nearby_historical_events: nearbyEvents,
    nearby_event_count: nearbyEvents.length,
  };
  const affectedSignals = buildImpactSketch(proposal, similarEvents, localContext);
  const confidence = buildConfidence(proposal, similarEvents, localContext, nearbyEvents, affectedSignals);
  const caveats = globalCaveats(proposal, similarEvents, localContext);
  const evidence = buildEvidenceSummary(similarEvents, nearbyEvents, localContext);
  const designReview = designReviewBasis(proposal, affectedSignals, localContext);
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
    design_review_basis: designReview,
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
  designReviewBasis,
  extractCurrentContext,
  findSimilarEvents,
  haversineMeters,
  loadAtlasEvents,
  normalizeCategory,
  validateProposalInput,
};
