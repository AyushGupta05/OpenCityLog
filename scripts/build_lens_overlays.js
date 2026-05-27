const fs = require("fs");
const path = require("path");
const {
  LENS_DEFINITIONS,
  eventMatchesLens,
  licenseNeedsReview,
  sourceHasMinimumLicense,
} = require("../lib/atlas-lenses");

const rootDir = path.resolve(__dirname, "..");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");

const CATEGORY_COLORS = {
  built_environment: "#d8a64e",
  transport: "#62d3d7",
  environment: "#75c69b",
  civic_services: "#74bddb",
  economy: "#a58bd4",
  utilities: "#d28a8a",
};

const LENS_CATEGORIES = new Set([
  "built_environment",
  "transport",
  "environment",
  "civic_services",
  "economy",
  "utilities",
]);

const HOTSPOT_CELL_DEG = 0.01;
const ROAD_INDEX_CELL_DEG = 0.018;
const TRAFFIC_EVENT_RADIUS_KM = 0.85;
const TRAFFIC_WINDOW_YEARS = 2;
const LENS_CELL_CONFIGS = {
  built_environment: {
    layer: "planning_cell",
    sizeM: 95,
    label: "planning and built",
    kindField: "lifecycle_status",
  },
  civic_services: {
    layer: "civic_coverage_cell",
    sizeM: 260,
    label: "civic service",
    kindField: "service_type",
  },
  economy: {
    layer: "economy_activity_cell",
    sizeM: 120,
    label: "economy",
    kindField: "sector",
  },
};
const FRONTAGE_TRACE_RADIUS_KM = 0.55;
const UTILITY_TRACE_RADIUS_KM = 0.62;
const LENS_YEAR_CONTRACT_START = 2007;
const LENS_YEAR_CONTRACT_END = 2026;
const LENS_CONTRACT_CATEGORIES = new Set(["built_environment", "transport", "civic_services", "economy", "utilities"]);
const CITY_SCOPE_SOURCE_IDS = {
  belfast: ["opendatani-spatial-ni"],
  london: ["gla-statistical-gis-boundaries", "ons-geoportal-boundaries"],
  nyc: ["9nt8-h7nd", "ruf7-3wgc", "5crt-au7u"],
};
const COVERAGE_CONTEXT_BY_CATEGORY = {
  built_environment: {
    layer: "planning_cell",
    label: "planning and built",
    representation: "planning lens coverage context",
    props: { lifecycle_status: "coverage_context", status: "no_year_records" },
  },
  civic_services: {
    layer: "civic_coverage_cell",
    label: "civic service",
    representation: "civic lens coverage context",
    props: { service_type: "coverage_context", status: "no_year_records" },
  },
  economy: {
    layer: "economy_activity_cell",
    label: "economy",
    representation: "economy lens coverage context",
    props: { sector: "coverage_context", activity_status: "no_year_records", status: "no_year_records" },
  },
  utilities: {
    layer: "utility_trace",
    label: "utility",
    representation: "utility lens coverage context",
    props: { utility_type: "coverage_context", work_status: "no_year_records", status: "no_year_records" },
  },
};
const REPRESENTATIVE_LENS_BY_CATEGORY = new Map();
for (const lens of LENS_DEFINITIONS) {
  if (!REPRESENTATIVE_LENS_BY_CATEGORY.has(lens.category)) REPRESENTATIVE_LENS_BY_CATEGORY.set(lens.category, lens);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const text = `${JSON.stringify(value)}\n`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, text, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST"].includes(renameError.code)) {
          throw renameError;
        }
        fs.copyFileSync(tmpPath, filePath);
        fs.unlinkSync(tmpPath);
      }
      return;
    } catch (error) {
      lastError = error;
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (_) {
        // Best-effort cleanup before retrying a generated artifact write.
      }
      sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}

function sourceByIdFromCity(paths) {
  const sourcesPath = paths.sources ? path.join(rootDir, paths.sources) : null;
  if (!sourcesPath || !fs.existsSync(sourcesPath)) return new Map();
  const payload = readJson(sourcesPath);
  return new Map((payload.sources || []).map((source) => [source.source_id, source]));
}

function eventHasCompatibleSources(event, sourceById) {
  const ids = event.sourceIds || event.source_ids || [];
  const sources = ids.map((sourceId) => sourceById.get(sourceId));
  return sources.length > 0
    && sources.every((source) => sourceHasMinimumLicense(source) && !licenseNeedsReview(source));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCategory(value, lens, signals = []) {
  const text = String(value || lens || "").toLowerCase();
  if (text === "traffic" || text === "mobility" || signals.includes("traffic") || signals.includes("mobility")) return "transport";
  if (text === "planning" || text === "buildings" || text === "building" || text === "built_environment") return "built_environment";
  if (text === "services" || text === "public_services" || text === "civic" || text === "civic_services") return "civic_services";
  if (text === "jobs" || text === "business" || text === "economy") return "economy";
  if (text === "green_space" || text === "environment") return "environment";
  if (text === "electricity" || text === "utilities") return "utilities";
  return "built_environment";
}

function confidenceWeight(confidence) {
  const key = String(confidence || "").toLowerCase();
  if (key === "corroborated") return 1.12;
  if (key === "documented") return 1;
  if (key === "inferred") return 0.58;
  if (key === "disputed") return 0.22;
  return 0.72;
}

function coordinateValid(coord) {
  return Array.isArray(coord)
    && coord.length >= 2
    && Number.isFinite(Number(coord[0]))
    && Number.isFinite(Number(coord[1]));
}

function walkCoords(coords, visitor) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number") {
    visitor(coords);
    return;
  }
  coords.forEach((item) => walkCoords(item, visitor));
}

function pointOrCentroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && coordinateValid(geometry.coordinates)) {
    return [Number(geometry.coordinates[0]), Number(geometry.coordinates[1])];
  }
  let sx = 0;
  let sy = 0;
  let count = 0;
  walkCoords(geometry.coordinates, (coord) => {
    if (!coordinateValid(coord)) return;
    sx += Number(coord[0]);
    sy += Number(coord[1]);
    count += 1;
  });
  return count ? [sx / count, sy / count] : null;
}

function distanceKm(a, b) {
  if (!coordinateValid(a) || !coordinateValid(b)) return Infinity;
  const lat = ((Number(a[1]) + Number(b[1])) / 2) * Math.PI / 180;
  const dx = (Number(a[0]) - Number(b[0])) * 111.32 * Math.cos(lat);
  const dy = (Number(a[1]) - Number(b[1])) * 110.57;
  return Math.hypot(dx, dy);
}

function lineRepresentativePoint(geometry) {
  if (!geometry) return null;
  let bestLine = [];
  const lines = [];
  if (geometry.type === "LineString") lines.push(geometry.coordinates);
  if (geometry.type === "MultiLineString") lines.push(...geometry.coordinates);
  for (const line of lines) {
    if (Array.isArray(line) && line.length > bestLine.length) bestLine = line;
  }
  if (!bestLine.length) return pointOrCentroid(geometry);
  return pointOrCentroid({ type: "LineString", coordinates: bestLine });
}

function cellKey(coord, size) {
  return `${Math.floor(Number(coord[0]) / size)}|${Math.floor(Number(coord[1]) / size)}`;
}

function nearbyCellKeys(coord, size, radius = 2) {
  const x = Math.floor(Number(coord[0]) / size);
  const y = Math.floor(Number(coord[1]) / size);
  const cells = [];
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      cells.push(`${x + dx}|${y + dy}`);
    }
  }
  return cells;
}

function loadEvents(city, eventsIndex) {
  const out = [];
  for (const chunk of eventsIndex.chunks || []) {
    if (!chunk.json_path) continue;
    const chunkPath = path.join(rootDir, chunk.json_path);
    const payload = readJson(chunkPath);
    for (const event of payload.events || []) {
      const signals = Array.isArray(event.affected_signals) ? event.affected_signals.map((item) => String(item).toLowerCase()) : [];
      const coord = pointOrCentroid(event.geometry);
      const category = normalizeCategory(event.category, event.lens, signals);
      if (!coord || !LENS_CATEGORIES.has(category)) continue;
      const year = Number(event.year || chunk.year);
      if (!Number.isFinite(year)) continue;
      const confidence = String(event.confidence || "documented").toLowerCase();
      const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const provenance = event.provenance || {};
      const text = [
        event.title,
        event.short_description,
        event.explanation,
        event.affected_area?.label,
        event.source_date_field,
        provenance.source_basis,
        provenance.geometry_precision,
      ].filter(Boolean).join(" ");
      out.push({
        id: event.event_id || event.id || `${city.city_id}-${category}-${year}-${out.length}`,
        title: event.title || "Source-backed city record",
        description: event.short_description || "",
        area: event.affected_area?.label || "",
        effectiveDate: event.effective_date || "",
        datePrecision: event.date_precision || "",
        sourceDateField: event.source_date_field || provenance.source_date_field || "",
        geometryPrecision: provenance.geometry_precision || "",
        geometrySource: provenance.geometry_source || "",
        sourceBasis: provenance.source_basis || "",
        evidenceCount: evidence.length,
        year,
        category,
        confidence,
        sourceIds,
        sourceUrls: evidence.map((item) => item.url).filter(Boolean).slice(0, 4),
        signals,
        text,
        weight: confidenceWeight(confidence),
        coord,
      });
    }
  }
  out.sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
  return out;
}

function buildHotspotFeatures(cityId, events) {
  const buckets = new Map();
  for (const event of events) {
    const key = `${event.year}|${event.category}|${cellKey(event.coord, HOTSPOT_CELL_DEG)}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        year: event.year,
        category: event.category,
        sx: 0,
        sy: 0,
        weight: 0,
        confidenceWeight: 0,
        count: 0,
        sourceIds: new Set(),
        confidenceCounts: {},
      };
      buckets.set(key, bucket);
    }
    bucket.sx += event.coord[0] * event.weight;
    bucket.sy += event.coord[1] * event.weight;
    bucket.weight += event.weight;
    bucket.confidenceWeight += event.weight;
    bucket.count += 1;
    bucket.confidenceCounts[event.confidence] = (bucket.confidenceCounts[event.confidence] || 0) + 1;
    for (const id of event.sourceIds) {
      if (bucket.sourceIds.size < 8) bucket.sourceIds.add(id);
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || b.count - a.count)
    .map((bucket, index) => {
      const coord = bucket.weight > 0
        ? [bucket.sx / bucket.weight, bucket.sy / bucket.weight]
        : [bucket.sx / Math.max(1, bucket.count), bucket.sy / Math.max(1, bucket.count)];
      const confidence = Object.entries(bucket.confidenceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "documented";
      return {
        type: "Feature",
        properties: {
          id: `lens-hotspot-${cityId}-${bucket.year}-${bucket.category}-${index}`,
          layer: "lens_event",
          category: bucket.category,
          category_color: CATEGORY_COLORS[bucket.category] || CATEGORY_COLORS.built_environment,
          year: bucket.year,
          title: `${bucket.count} source-backed ${bucket.category.replace(/_/g, " ")} record${bucket.count === 1 ? "" : "s"}`,
          confidence,
          heat_weight: round(clamp(Math.log1p(bucket.count) * 0.85 + (bucket.confidenceWeight / Math.max(1, bucket.count)) * 0.55, 0.4, 8)),
          event_count: bucket.count,
          source_count: bucket.sourceIds.size,
          source_ids: Array.from(bucket.sourceIds).join(","),
          representation: "source-backed hotspot cell",
          timing_note: "Filtered by event effective year; administrative and OSM-mapped dates are evidence dates, not guaranteed physical completion dates.",
        },
        geometry: { type: "Point", coordinates: coord },
      };
    });
}

function roadSourcePath(city, paths) {
  if (city.city_id === "belfast" && paths.detail_layers) return path.join(rootDir, paths.detail_layers);
  const majorRoadsPath = path.join(rootDir, "data", "raw", "overpass", `${city.city_id}_major_roads_osm_2026.geojson`);
  return fs.existsSync(majorRoadsPath) ? majorRoadsPath : null;
}

function loadRoadFeatures(city, paths) {
  const sourcePath = roadSourcePath(city, paths);
  if (!sourcePath || !fs.existsSync(sourcePath)) return [];
  const payload = readJson(sourcePath);
  return (payload.features || [])
    .filter((feature) => feature.geometry && (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString"))
    .filter((feature) => city.city_id !== "belfast" || feature.properties?.layer === "road")
    .map((feature, index) => ({ feature, index, coord: lineRepresentativePoint(feature.geometry) }))
    .filter((item) => item.coord);
}

function buildRoadIndex(roads) {
  const index = new Map();
  for (const road of roads) {
    const key = cellKey(road.coord, ROAD_INDEX_CELL_DEG);
    const bucket = index.get(key) || [];
    bucket.push(road);
    index.set(key, bucket);
  }
  return index;
}

function nearbyRoads(index, coord) {
  const out = [];
  for (const key of nearbyCellKeys(coord, ROAD_INDEX_CELL_DEG, 3)) {
    const bucket = index.get(key);
    if (bucket) out.push(...bucket);
  }
  return out;
}

function transportEvents(events) {
  return events.filter((event) => event.category === "transport" || event.signals.includes("traffic") || event.signals.includes("mobility"));
}

function accumulateRoadScores(city, roads, events, years) {
  const yearSet = new Set(years);
  const scoresByYear = new Map(years.map((year) => [year, new Map()]));
  const roadIndex = buildRoadIndex(roads);
  const transport = transportEvents(events);

  for (const event of transport) {
    const candidates = nearbyRoads(roadIndex, event.coord);
    for (const road of candidates) {
      const km = distanceKm(event.coord, road.coord);
      if (km > TRAFFIC_EVENT_RADIUS_KM) continue;
      const distanceWeight = 1 - (km / TRAFFIC_EVENT_RADIUS_KM);
      for (let offset = 0; offset <= TRAFFIC_WINDOW_YEARS; offset += 1) {
        const year = event.year + offset;
        if (!yearSet.has(year)) continue;
        const ageWeight = offset === 0 ? 1 : offset === 1 ? 0.58 : 0.34;
        const yearScores = scoresByYear.get(year);
        const current = yearScores.get(road.index) || { raw: 0, count: 0 };
        current.raw += event.weight * ageWeight * distanceWeight;
        current.count += 1;
        yearScores.set(road.index, current);
      }
    }
  }

  if (city.city_id === "belfast") {
    for (const road of roads) {
      const props = road.feature.properties || {};
      const visibleYear = Number(props.visible_year || years[0]);
      for (let offset = 0; offset <= TRAFFIC_WINDOW_YEARS; offset += 1) {
        const year = visibleYear + offset;
        if (!yearSet.has(year)) continue;
        const rankWeight = clamp(Number(props.rank || 1) / 4, 0.25, 1);
        const yearScores = scoresByYear.get(year);
        const current = yearScores.get(road.index) || { raw: 0, count: 0 };
        current.raw += rankWeight * (offset === 0 ? 0.72 : offset === 1 ? 0.38 : 0.2);
        current.count += 1;
        yearScores.set(road.index, current);
      }
    }
  }

  return scoresByYear;
}

function roadOutputFeature(city, road, score, maxRaw, year) {
  const props = road.feature.properties || {};
  const stableRoadId = props.source_id || props.id || props.name || `road-${road.index}`;
  const activity = maxRaw > 0 ? clamp(score.raw / maxRaw, 0, 1) : 0;
  return {
    type: "Feature",
    properties: {
      id: `lens-traffic-road-${city.city_id}-${stableRoadId}`,
      layer: "traffic_road",
      category: "transport",
      year,
      visible_year: Number(props.visible_year || year),
      rank: Number(props.rank || 1),
      name: props.name || props.ref || "mapped road segment",
      source_id: stableRoadId,
      source_url: props.source_url || "",
      license: props.license || "ODbL",
      transport_raw: round(score.raw),
      transport_count: score.count,
      transport_activity: round(activity),
      representation: city.city_id === "belfast" ? "mapped road-change and transport-event activity" : "major-road transport-event activity",
      timing_note: city.city_id === "belfast"
        ? "Road color is a three-year mapped road-change and transport-event activity surface, not measured traffic volume or congestion."
        : "Road color is a three-year transport-event activity surface on current OSM major road geometry, not measured traffic volume or congestion.",
    },
    geometry: road.feature.geometry,
  };
}

function roadBaseOutputFeature(city, road) {
  const props = road.feature.properties || {};
  const stableRoadId = props.source_id || props.id || props.name || `road-${road.index}`;
  return {
    type: "Feature",
    properties: {
      id: `lens-traffic-road-base-${city.city_id}-${stableRoadId}`,
      layer: "traffic_road_base",
      category: "transport",
      rank: Number(props.rank || 1),
      highway: props.highway || "",
      name: props.name || props.ref || "mapped road segment",
      source_id: stableRoadId,
      source_url: props.source_url || "",
      license: props.license || "ODbL",
      representation: city.city_id === "belfast" ? "current OSM road geometry from the Belfast detail layer" : "current OSM major road geometry",
      timing_note: "Base roads are always-on current OSM geometry for citywide orientation; they are not measured traffic volume, congestion, or guaranteed construction timing.",
    },
    geometry: road.feature.geometry,
  };
}

function writeTransportRoadBase(city, roads, outDir) {
  const base = `web/data/city-atlas/cities/${city.city_id}/transport_roads_base.geojson`;
  const features = roads
    .map((road) => roadBaseOutputFeature(city, road))
    .sort((a, b) => Number(b.properties.rank) - Number(a.properties.rank) || String(a.properties.id).localeCompare(String(b.properties.id)));
  writeJson(path.join(outDir, "transport_roads_base.geojson"), {
    type: "FeatureCollection",
    name: `${city.city_id}_transport_roads_base`,
    metadata: {
      schema_version: "1.0.0",
      city_id: city.city_id,
      road_source: city.city_id === "belfast" ? "web/data/city-atlas/cities/belfast/detail_layers.geojson" : `data/raw/overpass/${city.city_id}_major_roads_osm_2026.geojson`,
      method: "Current OSM road geometry is loaded citywide as a required base layer; selected-year activity files color the subset near source-backed transport records.",
      caveat: "Base road lines are citywide OSM context and are not measured traffic counts, live congestion, or historical construction proof.",
    },
    features,
  });
  return base;
}

function writeTransportRoadYears(city, paths, events, years, outDir) {
  const roads = loadRoadFeatures(city, paths);
  const template = `web/data/city-atlas/cities/${city.city_id}/transport_roads_{year}.geojson`;
  if (!roads.length) {
    throw new Error(`${city.city_id}: missing required OSM road source for transport overlays; run npm run fetch:city-roads for non-Belfast cities.`);
  }

  const base = writeTransportRoadBase(city, roads, outDir);
  const scoresByYear = accumulateRoadScores(city, roads, events, years);
  const roadByIndex = new Map(roads.map((road) => [road.index, road]));

  for (const year of years) {
    const scores = scoresByYear.get(year) || new Map();
    const maxRaw = Math.max(0, ...Array.from(scores.values()).map((score) => score.raw));
    const features = Array.from(scores.entries())
      .filter(([, score]) => score.raw > 0)
      .map(([roadIndex, score]) => roadOutputFeature(city, roadByIndex.get(roadIndex), score, maxRaw, year))
      .sort((a, b) => Number(b.properties.transport_activity) - Number(a.properties.transport_activity) || String(a.properties.id).localeCompare(String(b.properties.id)));
    writeJson(path.join(outDir, `transport_roads_${year}.geojson`), {
      type: "FeatureCollection",
      name: `${city.city_id}_transport_roads_${year}`,
      metadata: {
        schema_version: "1.0.0",
        city_id: city.city_id,
        year,
        road_source: city.city_id === "belfast" ? "detail_layers.geojson" : `data/raw/overpass/${city.city_id}_major_roads_osm_2026.geojson`,
        method: "Road features are colored from nearby source-backed transport records in a rolling three-year window.",
        caveat: "Transport road colors are activity hotspots, not measured traffic counts or live congestion.",
      },
      features,
    });
  }

  return { base, template, roadCount: roads.length };
}

function lowerText(event) {
  return String(event.text || `${event.title || ""} ${event.description || ""}`).toLowerCase();
}

function lensDetailSkipReason(event) {
  if (!coordinateValid(event.coord)) return "missing_point_geometry";
  const precision = String(event.geometryPrecision || "").toLowerCase();
  const sourceBasis = String(event.sourceBasis || "").toLowerCase();
  const geometrySource = String(event.geometrySource || "").toLowerCase();
  const sourceIds = (event.sourceIds || []).join(" ").toLowerCase();
  const text = lowerText(event);
  const combined = `${precision} ${sourceBasis} ${geometrySource} ${sourceIds} ${text}`;
  const geometryScope = precision.trim();

  if (/\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/.test(combined)) {
    return "statistical_housing_market_record";
  }
  if (/\bborough aggregate\b|\baggregate,\s*not\b|\baggregate record\b/.test(combined)) {
    return "aggregate_record";
  }
  if (/\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b/.test(geometryScope)
    || /^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(multiple sites|multi[-\s]?site|programme approximate)\b/.test(geometryScope)) {
    return "non_site_scope";
  }
  if (/^area(?:\s+approximate)?$/.test(precision.trim())) {
    return "area_scope";
  }
  return "";
}

function isLensDetailEligibleEvent(event) {
  return !lensDetailSkipReason(event);
}

function lensDetailSkipSummary(yearEvents) {
  const reasons = {};
  for (const event of yearEvents) {
    if (!["built_environment", "civic_services", "economy", "utilities"].includes(event.category)) continue;
    const reason = lensDetailSkipReason(event);
    if (reason) incrementCounter(reasons, reason);
  }
  return reasons;
}

function matchKind(text, entries, fallback) {
  for (const [kind, pattern] of entries) {
    if (pattern.test(text)) return kind;
  }
  return fallback;
}

function classifyPlanningLifecycle(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred" || /osm|mapped[- ]visibility|mapped[- ]event|mapped in osm/.test(text)) return "inferred";
  return matchKind(text, [
    ["demolished", /\bdemolish(ed|ition)?\b|\bdemolition\b|\bremoved\b/],
    ["construction", /\bunder construction\b|\bconstruction\b|\bworks start(ed)?\b|\bstarted\b|\benabling works\b/],
    ["completed", /\bcompleted\b|\bopened\b|\bdelivered\b|\boccupied\b|\boperational\b/],
    ["permitted", /\bapproved\b|\bpermission\b|\bconsent\b|\bcondition variation\b|\bpermitted\b/],
    ["proposed", /\bpropos(ed|al)\b|\bapplication\b|\bsubmitted\b|\bconsultation\b/],
    ["planned", /\bplanned\b|\bstage\s*1\b|\bemerging\b|\bprogramme\b|\bmasterplan\b/],
  ], "uncertain");
}

function classifyCivicServiceType(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["health", /\bhealth\b|\bhospital\b|\bclinic\b|\bgp\b|\bmedical\b|\bcare\b/],
    ["education", /\bschool\b|\beducation\b|\buniversity\b|\bcollege\b|\bcampus\b|\bstudent\b/],
    ["library", /\blibrary\b|\blibraries\b/],
    ["leisure", /\bleisure\b|\bsport\b|\bpool\b|\bpark\b|\bplay\b|\brecreation\b/],
    ["community", /\bcommunity\b|\bcivic\b|\bcouncil\b|\bpublic service\b|\bservice centre\b/],
    ["safety", /\bpolice\b|\bfire\b|\bemergency\b|\bsafety\b/],
  ], "service");
}

function classifyCivicStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred") return "inferred";
  return matchKind(text, [
    ["planned", /\bplanned\b|\bproposed\b|\bstage\s*1\b|\bprogramme\b/],
    ["opened", /\bopened\b|\bcompleted\b|\boperational\b/],
    ["changed", /\brelocat(ed|ion)\b|\bupgrade(d)?\b|\bextension\b|\bchange\b/],
  ], "documented");
}

function classifyEconomySector(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["hospitality", /\bhotel\b|\brestaurant\b|\bcafe\b|\bbar\b|\bhospitality\b/],
    ["retail", /\bretail\b|\bshop\b|\bstore\b|\bmarket\b/],
    ["office", /\boffice\b|\bworkspace\b|\bbusiness\b|\bemployment\b/],
    ["industrial", /\bindustrial\b|\bfactory\b|\blogistics\b|\bwarehouse\b|\bclass b3\b/],
    ["culture_visitor", /\bvisitor\b|\bculture\b|\btouris[mt]\b|\bmuseum\b|\bvenue\b|\bhotel\b/],
    ["education_health", /\buniversity\b|\beducation\b|\bhealth\b|\bhospital\b|\bcampus\b/],
    ["residential_change", /\bresidential\b|\bstudent accommodation\b|\bhmo\b|\bhousing\b/],
    ["vacancy", /\bvacan(t|cy)\b|\bderelict\b|\bmeanwhile\b|\bclosed\b/],
  ], "commercial_activity");
}

function classifyEconomyStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred") return "inferred";
  return matchKind(text, [
    ["opening", /\bopened\b|\bopening\b|\blaunched\b/],
    ["closure", /\bclosed\b|\bclosure\b|\bvacan(t|cy)\b/],
    ["permitted", /\bapproved\b|\bpermission\b|\bconsent\b|\bpermitted\b/],
    ["planned", /\bplanned\b|\bproposed\b|\bstage\s*1\b|\bprogramme\b/],
  ], "documented");
}

function classifyUtilityType(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["electricity", /\belectricity\b|\bpower\b|\bgenerator\b|\bsubstation\b|\btransformer\b/],
    ["telecom", /\btelecom\b|\bbroadband\b|\bfibre\b|\bfiber\b|\bcable\b|\bcommunications?\b/],
    ["water", /\bwater\b|\bsewer\b|\bwastewater\b|\bdrain(age)?\b/],
    ["gas", /\bgas\b/],
    ["streetworks", /\bstreet\s*works\b|\broad\s*works\b|\bworks\b|\bclosure\b|\bdisruption\b/],
  ], "infrastructure");
}

function classifyUtilityStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred" || /osm|mapped[- ]visibility|mapped[- ]event|mapped in osm/.test(text)) return "mapped_asset";
  return matchKind(text, [
    ["repair", /\brepair\b|\bmaintenance\b|\breinstatement\b/],
    ["disruption", /\bdisruption\b|\bclosure\b|\bclosed\b|\boutage\b/],
    ["planned", /\bplanned\b|\bproposed\b|\bprogramme\b|\bpermit\b/],
    ["current", /\bopened\b|\boperational\b|\bcompleted\b/],
  ], "documented");
}

function classifyLensEvent(event) {
  if (event.category === "built_environment") {
    return { primary: classifyPlanningLifecycle(event), secondary: event.confidence === "inferred" ? "inferred" : "source_record" };
  }
  if (event.category === "civic_services") {
    return { primary: classifyCivicServiceType(event), secondary: classifyCivicStatus(event) };
  }
  if (event.category === "economy") {
    return { primary: classifyEconomySector(event), secondary: classifyEconomyStatus(event) };
  }
  if (event.category === "utilities") {
    return { primary: classifyUtilityType(event), secondary: classifyUtilityStatus(event) };
  }
  return { primary: "record", secondary: event.confidence || "documented" };
}

function incrementCounter(target, key, amount = 1) {
  target[key] = (target[key] || 0) + amount;
}

function dominantKey(counts, fallback = "documented") {
  const entries = Object.entries(counts || {});
  if (!entries.length) return fallback;
  return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function counterText(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
}

function addEventToBucket(bucket, event, classification) {
  bucket.count += 1;
  bucket.weight += event.weight || 1;
  bucket.sx += event.coord[0];
  bucket.sy += event.coord[1];
  bucket.distance += event.distanceKm || 0;
  incrementCounter(bucket.confidenceCounts, event.confidence || "documented");
  incrementCounter(bucket.primaryCounts, classification.primary);
  incrementCounter(bucket.secondaryCounts, classification.secondary);
  incrementCounter(bucket.geometryPrecisionCounts, event.geometryPrecision || "unspecified");
  for (const id of event.sourceIds || []) {
    if (bucket.sourceIds.size < 12) bucket.sourceIds.add(id);
  }
  bucket.eventIdsAll.push(event.id);
  if (bucket.eventIds.length < 10) bucket.eventIds.push(event.id);
  if (bucket.titles.length < 3) bucket.titles.push(event.title);
  for (const url of event.sourceUrls || []) {
    if (bucket.sourceUrls.size < 4) bucket.sourceUrls.add(url);
  }
}

function meterFactors(refLat) {
  const latRad = Number(refLat || 0) * Math.PI / 180;
  return {
    lon: Math.max(1, 111320 * Math.cos(latRad)),
    lat: 110574,
  };
}

function cityReferenceLat(city, events) {
  if (Array.isArray(city.default_center) && Number.isFinite(Number(city.default_center[1]))) {
    return Number(city.default_center[1]);
  }
  const lat = events.find((event) => coordinateValid(event.coord))?.coord?.[1];
  return Number.isFinite(Number(lat)) ? Number(lat) : 0;
}

function gridForCoord(coord, sizeM, refLat) {
  const factors = meterFactors(refLat);
  const x = Math.floor((coord[0] * factors.lon) / sizeM);
  const y = Math.floor((coord[1] * factors.lat) / sizeM);
  const west = (x * sizeM) / factors.lon;
  const east = ((x + 1) * sizeM) / factors.lon;
  const south = (y * sizeM) / factors.lat;
  const north = ((y + 1) * sizeM) / factors.lat;
  return {
    key: `${x}|${y}`,
    polygon: [
      [
        [round(west, 7), round(south, 7)],
        [round(east, 7), round(south, 7)],
        [round(east, 7), round(north, 7)],
        [round(west, 7), round(north, 7)],
        [round(west, 7), round(south, 7)],
      ],
    ],
  };
}

function detailBaseProperties(cityId, layer, category, year, bucket, representation, caveat) {
  const confidence = dominantKey(bucket.confidenceCounts);
  return {
    id: bucket.id,
    layer,
    category,
    year,
    visible_year: year,
    title: bucket.title,
    confidence,
    confidence_mix: counterText(bucket.confidenceCounts),
    event_count: bucket.count,
    source_count: bucket.sourceIds.size,
    source_ids: Array.from(bucket.sourceIds).join(","),
    event_ids: bucket.eventIds.join(","),
    event_ids_all: bucket.eventIdsAll.join(","),
    source_urls: Array.from(bucket.sourceUrls).join(","),
    geometry_precision_mix: counterText(bucket.geometryPrecisionCounts),
    representation,
    timing_note: "Filtered by event effective year. OSM mapped-visibility dates and administrative dates can differ from real-world physical change dates.",
    caveat,
    generated_from: `web/data/city-atlas/cities/${cityId}/events_${year}.json`,
  };
}

function scopeSourceIds(city, sourceById) {
  const preferred = CITY_SCOPE_SOURCE_IDS[city.city_id] || [];
  const ready = preferred.filter((sourceId) => {
    const source = sourceById.get(sourceId);
    return sourceHasMinimumLicense(source) && !licenseNeedsReview(source);
  });
  if (ready.length) return ready;
  return Array.from(sourceById.values())
    .filter((source) => sourceHasMinimumLicense(source) && !licenseNeedsReview(source))
    .filter((source) => /boundar|ward|borough|district|geograph|spatial/i.test([
      source.source_id,
      source.title,
      source.source_family,
      source.provenance_notes,
    ].filter(Boolean).join(" ")))
    .slice(0, 3)
    .map((source) => source.source_id);
}

function categoryHasCompatibleRecords(yearEvents, category, sourceById) {
  const representativeLens = REPRESENTATIVE_LENS_BY_CATEGORY.get(category);
  return yearEvents.some((event) => (
    (event.category === category || (representativeLens && eventMatchesLens(event, representativeLens, sourceById)))
      && eventHasCompatibleSources(event, sourceById)
  ));
}

function cityCoverageGridPolygons(city, columns = 5, rows = 5) {
  const bounds = Array.isArray(city.bounds) ? city.bounds.map(Number) : null;
  if (!bounds || bounds.length !== 4 || bounds.some((value) => !Number.isFinite(value))) return [];
  const [west, south, east, north] = bounds;
  const dx = (east - west) / columns;
  const dy = (north - south) / rows;
  const features = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const w = west + col * dx;
      const e = west + (col + 1) * dx;
      const s = south + row * dy;
      const n = south + (row + 1) * dy;
      features.push({
        index: row * columns + col,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [round(w, 7), round(s, 7)],
            [round(e, 7), round(s, 7)],
            [round(e, 7), round(n, 7)],
            [round(w, 7), round(n, 7)],
            [round(w, 7), round(s, 7)],
          ]],
        },
      });
    }
  }
  return features;
}

function cityCoverageGridLines(city, columns = 6, rows = 6) {
  const bounds = Array.isArray(city.bounds) ? city.bounds.map(Number) : null;
  if (!bounds || bounds.length !== 4 || bounds.some((value) => !Number.isFinite(value))) return [];
  const [west, south, east, north] = bounds;
  const dx = (east - west) / columns;
  const dy = (north - south) / rows;
  const lines = [];
  for (let col = 1; col < columns; col += 1) {
    const x = west + col * dx;
    lines.push({
      index: lines.length,
      geometry: { type: "LineString", coordinates: [[round(x, 7), round(south, 7)], [round(x, 7), round(north, 7)]] },
    });
  }
  for (let row = 1; row < rows; row += 1) {
    const y = south + row * dy;
    lines.push({
      index: lines.length,
      geometry: { type: "LineString", coordinates: [[round(west, 7), round(y, 7)], [round(east, 7), round(y, 7)]] },
    });
  }
  return lines;
}

function coverageContextProperties(city, year, category, config, sourceIds, index) {
  const title = `${city.display_name || city.city_id} ${year} ${config.label} coverage context`;
  return {
    id: `lens-detail-${city.city_id}-${year}-${config.layer}-coverage-context-${index}`,
    layer: config.layer,
    category,
    year,
    visible_year: year,
    title,
    confidence: "inferred",
    confidence_mix: "inferred:1",
    event_count: 0,
    source_count: sourceIds.length,
    source_ids: sourceIds.join(","),
    event_ids: "",
    event_ids_all: "",
    source_urls: "",
    geometry_precision_mix: "configured atlas coverage grid from official scope sources",
    representation: config.representation,
    timing_note: `No license-compatible ${config.label} records are currently ingested for ${year}; this lens geometry marks source coverage context only.`,
    caveat: "Coverage context is not a city-change event, not a measured condition, and is excluded from headline counts.",
    generated_from: `web/data/city-atlas/cities/${city.city_id}/events_${year}.json`,
    coverage_status: "no_same_category_records",
    evidence_role: "context_not_year_specific_change_evidence",
    source_kind: "official_scope_context",
    headline_count_excluded: true,
    intensity: 0.16,
    label: `No same-lens ${config.label} records currently ingested`,
    ...config.props,
  };
}

function buildCoverageContextFeatures(city, year, category, sourceIds) {
  const config = COVERAGE_CONTEXT_BY_CATEGORY[category];
  if (!config || !sourceIds.length) return [];
  const shapes = category === "utilities"
    ? cityCoverageGridLines(city, 7, 7)
    : cityCoverageGridPolygons(city, 5, 5);
  return shapes.map((shape, index) => ({
    type: "Feature",
    properties: coverageContextProperties(city, year, category, config, sourceIds, index),
    geometry: shape.geometry,
  }));
}

function buildCellFeatures(city, yearEvents, refLat) {
  const buckets = new Map();
  for (const event of yearEvents) {
    const config = LENS_CELL_CONFIGS[event.category];
    if (!config) continue;
    if (!isLensDetailEligibleEvent(event)) continue;
    const grid = gridForCoord(event.coord, config.sizeM, refLat);
    const classification = classifyLensEvent(event);
    const key = `${event.year}|${event.category}|${grid.key}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${config.layer}-${buckets.size}`,
        year: event.year,
        category: event.category,
        layer: config.layer,
        sizeM: config.sizeM,
        polygon: grid.polygon,
        count: 0,
        weight: 0,
        sx: 0,
        sy: 0,
        distance: 0,
        confidenceCounts: {},
        primaryCounts: {},
        secondaryCounts: {},
        geometryPrecisionCounts: {},
        sourceIds: new Set(),
        sourceUrls: new Set(),
        eventIds: [],
        eventIdsAll: [],
        titles: [],
      };
      buckets.set(key, bucket);
    }
    addEventToBucket(bucket, event, classification);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || b.count - a.count || a.id.localeCompare(b.id))
    .map((bucket) => {
      const config = LENS_CELL_CONFIGS[bucket.category];
      const primary = dominantKey(bucket.primaryCounts, "record");
      const secondary = dominantKey(bucket.secondaryCounts, "documented");
      bucket.title = `${bucket.count} source-backed ${config.label} record${bucket.count === 1 ? "" : "s"}`;
      const caveat = bucket.category === "built_environment"
        ? "Planning cells are derived from source-backed event locations; they are not parcel boundaries unless source geometry is separately present."
        : bucket.category === "civic_services"
          ? "Civic coverage cells are evidence grids around facility/service records, not surveyed catchment or capacity areas."
          : "Economy cells are evidence grids around source-backed activity records, not measured spend, vacancy, or footfall.";
      const properties = detailBaseProperties(
        city.city_id,
        bucket.layer,
        bucket.category,
        bucket.year,
        bucket,
        `${config.label} evidence grid cell`,
        caveat,
      );
      properties[config.kindField] = primary;
      properties.status = secondary;
      properties.cell_size_m = bucket.sizeM;
      properties.intensity = round(clamp(Math.log1p(bucket.count) / 2.4, 0.18, 1));
      properties.label = bucket.titles[0] || properties.title;
      return {
        type: "Feature",
        properties,
        geometry: { type: "Polygon", coordinates: bucket.polygon },
      };
    });
}

function buildPointDetailFeatures(city, yearEvents, category, layer, representation, caveat) {
  return yearEvents
    .filter((event) => event.category === category && isLensDetailEligibleEvent(event))
    .map((event, index) => {
      const classification = classifyLensEvent(event);
      const bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${layer}-${index}-${event.id}`,
        title: event.title,
        count: 1,
        sourceIds: new Set(event.sourceIds || []),
        sourceUrls: new Set(event.sourceUrls || []),
        eventIds: [event.id],
        eventIdsAll: [event.id],
        confidenceCounts: { [event.confidence || "documented"]: 1 },
        geometryPrecisionCounts: { [event.geometryPrecision || "unspecified"]: 1 },
      };
      const properties = detailBaseProperties(city.city_id, layer, category, event.year, bucket, representation, caveat);
      if (category === "civic_services") {
        properties.service_type = classification.primary;
        properties.status = classification.secondary;
      } else if (category === "utilities") {
        properties.utility_type = classification.primary;
        properties.work_status = classification.secondary;
      }
      properties.geometry_precision = event.geometryPrecision || "";
      return {
        type: "Feature",
        properties,
        geometry: { type: "Point", coordinates: event.coord },
      };
    });
}

function nearestRoad(index, coord, maxKm) {
  let best = null;
  let bestKm = Infinity;
  for (const road of nearbyRoads(index, coord)) {
    const km = distanceKm(coord, road.coord);
    if (km < bestKm) {
      best = road;
      bestKm = km;
    }
  }
  return best && bestKm <= maxKm ? { road: best, km: bestKm } : null;
}

function buildRoadTraceFeatures(city, yearEvents, roads, category, layer, radiusKm, representation, caveat) {
  if (!roads.length) return [];
  const index = buildRoadIndex(roads);
  const buckets = new Map();
  for (const event of yearEvents.filter((item) => item.category === category)) {
    if (!isLensDetailEligibleEvent(event)) continue;
    const nearest = nearestRoad(index, event.coord, radiusKm);
    if (!nearest) continue;
    const classification = classifyLensEvent(event);
    const roadProps = nearest.road.feature.properties || {};
    const stableRoadId = roadProps.source_id || roadProps.id || roadProps.name || `road-${nearest.road.index}`;
    const key = `${event.year}|${category}|${nearest.road.index}|${classification.primary}|${classification.secondary}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${layer}-${nearest.road.index}-${classification.primary}-${classification.secondary}`,
        title: roadProps.name || roadProps.ref || "Mapped street segment",
        year: event.year,
        category,
        layer,
        road: nearest.road,
        roadId: stableRoadId,
        roadName: roadProps.name || roadProps.ref || "mapped street segment",
        rank: Number(roadProps.rank || 1),
        count: 0,
        weight: 0,
        sx: 0,
        sy: 0,
        distance: 0,
        confidenceCounts: {},
        primaryCounts: {},
        secondaryCounts: {},
        geometryPrecisionCounts: {},
        sourceIds: new Set(),
        sourceUrls: new Set(),
        eventIds: [],
        eventIdsAll: [],
        titles: [],
      };
      buckets.set(key, bucket);
    }
    addEventToBucket(bucket, { ...event, distanceKm: nearest.km }, classification);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || b.count - a.count || a.id.localeCompare(b.id))
    .map((bucket) => {
      const primary = dominantKey(bucket.primaryCounts, "record");
      const secondary = dominantKey(bucket.secondaryCounts, "documented");
      bucket.title = `${bucket.count} source-backed ${category.replace(/_/g, " ")} record${bucket.count === 1 ? "" : "s"} near ${bucket.roadName}`;
      const properties = detailBaseProperties(city.city_id, layer, category, bucket.year, bucket, representation, caveat);
      properties.road_source_id = String(bucket.roadId);
      properties.road_name = bucket.roadName;
      properties.rank = bucket.rank;
      properties.nearest_event_distance_km = round(bucket.distance / Math.max(1, bucket.count), 3);
      properties.intensity = round(clamp(Math.log1p(bucket.count) / 2.2, 0.2, 1));
      if (category === "economy") {
        properties.sector = primary;
        properties.activity_status = secondary;
      } else if (category === "utilities") {
        properties.utility_type = primary;
        properties.work_status = secondary;
      }
      return {
        type: "Feature",
        properties,
        geometry: bucket.road.feature.geometry,
      };
    });
}

function lensDetailLayerCounts(features) {
  const counts = {};
  for (const feature of features) {
    const layer = feature.properties?.layer || "unknown";
    counts[layer] = (counts[layer] || 0) + 1;
  }
  return counts;
}

function writeLensDetailYears(city, paths, events, years, outDir, sourceById) {
  const roads = loadRoadFeatures(city, paths);
  const template = `web/data/city-atlas/cities/${city.city_id}/lens_detail_{year}.geojson`;
  const refLat = cityReferenceLat(city, events);
  const coverageSourceIds = scopeSourceIds(city, sourceById);

  for (const year of years) {
    const yearEvents = events.filter((event) => event.year === year);
    const skippedLensDetailRecords = lensDetailSkipSummary(yearEvents);
    const features = [
      ...buildCellFeatures(city, yearEvents, refLat),
      ...buildRoadTraceFeatures(
        city,
        yearEvents,
        roads,
        "economy",
        "economy_frontage",
        FRONTAGE_TRACE_RADIUS_KM,
        "nearest mapped street frontage proxy from source-backed economy records",
        "Economy frontage traces use existing OSM street geometry nearest to source-backed event points; they are not measured footfall, spend, or vacancy data.",
      ),
      ...buildPointDetailFeatures(
        city,
        yearEvents,
        "civic_services",
        "civic_facility",
        "source-backed civic facility or service point",
        "Facility glyphs use event point geometry only; no catchment, capacity, or service quality is inferred.",
      ),
      ...buildRoadTraceFeatures(
        city,
        yearEvents,
        roads,
        "utilities",
        "utility_trace",
        UTILITY_TRACE_RADIUS_KM,
        "nearest mapped street or infrastructure-work trace from source-backed utility records",
        "Utility traces are nearest-road/work-location context from source-backed records and existing OSM geometry; no capacity data is inferred.",
      ),
      ...buildPointDetailFeatures(
        city,
        yearEvents,
        "utilities",
        "utility_asset",
        "source-backed utility asset or work point",
        "Utility glyphs show observed or mapped records only and do not imply network capacity.",
      ),
    ];
    for (const category of LENS_CONTRACT_CATEGORIES) {
      if (category === "transport") continue;
      if (categoryHasCompatibleRecords(yearEvents, category, sourceById)) continue;
      features.push(...buildCoverageContextFeatures(city, year, category, coverageSourceIds));
    }

    writeJson(path.join(outDir, `lens_detail_${year}.geojson`), {
      type: "FeatureCollection",
      name: `${city.city_id}_lens_detail_${year}`,
      metadata: {
        schema_version: "1.0.0",
        city_id: city.city_id,
        year,
        generated_at: new Date().toISOString(),
        source_paths: [
          `web/data/city-atlas/cities/${city.city_id}/events_${year}.json`,
          `web/data/city-atlas/cities/${city.city_id}/events.json`,
          city.city_id === "belfast" && paths.detail_layers ? paths.detail_layers : null,
          paths.transport_roads_base || null,
        ].filter(Boolean),
        method: "Derived OpenCityLog lens geometry built from source-backed event points plus existing OSM road/detail geometry. Grid cells aggregate events by effective year. Trace lines reuse nearest mapped road geometry for context.",
        caveats: [
          "Derived cells are evidence grids, not surveyed parcels, catchments, zones, or administrative boundaries.",
          "Trace lines are nearest mapped street or work-location context, not surveyed utility networks, measured traffic speed, spend, vacancy, or service quality. No capacity data is inferred.",
          "When a lens/year has no same-category source-backed records, faint coverage-context grids keep the lens visible while explicitly recording the source gap. Those context features are not city-change events and are excluded from headline counts.",
          "Borough, citywide, statistical, corridor, and multi-site records are excluded from site-like lens geometry; they remain available in the event list and evidence records.",
          "OSM mapped-visibility dates and administrative decision dates can differ from real-world physical change dates.",
        ],
        feature_layers: lensDetailLayerCounts(features),
        excluded_non_site_record_count: Object.values(skippedLensDetailRecords).reduce((sum, value) => sum + value, 0),
        excluded_non_site_reasons: skippedLensDetailRecords,
      },
      features,
    });
  }

  return { template, roadCount: roads.length };
}

function updateArtifactPath(filePath, cityId, additions) {
  const json = readJson(filePath);
  if (Array.isArray(json.cities)) {
    for (const city of json.cities) {
      if (city.city_id !== cityId) continue;
      city.artifact_paths = Object.assign({}, city.artifact_paths, additions);
    }
  } else {
    json.artifact_paths = Object.assign({}, json.artifact_paths, additions);
  }
  writeJson(filePath, json);
}

function buildCity(city) {
  const summaryPaths = city.artifact_paths || {};
  const cityConfigPath = path.join(rootDir, summaryPaths.city);
  const cityArtifact = readJson(cityConfigPath);
  const paths = Object.assign({}, cityArtifact.artifact_paths || {}, summaryPaths);
  const buildCityRecord = Object.assign({}, cityArtifact, city, { artifact_paths: paths });
  const cityDir = path.dirname(path.join(rootDir, paths.city));
  const eventsIndex = readJson(path.join(rootDir, paths.events));
  const years = (eventsIndex.event_years || (eventsIndex.chunks || []).map((chunk) => Number(chunk.year)))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  for (let year = LENS_YEAR_CONTRACT_START; year <= LENS_YEAR_CONTRACT_END; year += 1) {
    if (!years.includes(year)) years.push(year);
  }
  years.sort((a, b) => a - b);
  const sourceById = sourceByIdFromCity(paths);
  const events = loadEvents(buildCityRecord, eventsIndex);
  const hotspotFeatures = buildHotspotFeatures(buildCityRecord.city_id, events);
  const overlayRelativePath = `web/data/city-atlas/cities/${buildCityRecord.city_id}/lens_overlays.geojson`;
  writeJson(path.join(cityDir, "lens_overlays.geojson"), {
    type: "FeatureCollection",
    name: `${buildCityRecord.city_id}_source_backed_lens_overlays`,
    metadata: {
      schema_version: "1.0.0",
      city_id: buildCityRecord.city_id,
      generated_at: new Date().toISOString(),
      years,
      categories: Array.from(LENS_CATEGORIES),
      source_paths: [
        `web/data/city-atlas/cities/${buildCityRecord.city_id}/events.json`,
        `web/data/city-atlas/cities/${buildCityRecord.city_id}/events_{year}.json`,
      ],
      method: "Lens heatmaps aggregate source-backed event points into citywide hotspot cells by category and effective year.",
      caveats: [
        "Hotspots are event-density surfaces, not causal outcome measurements.",
        "Transport road colors are hotspots of mapped or documented transport-change records, not measured traffic counts or live congestion.",
        "OSM edit or mapped-visibility dates can differ from real-world change dates.",
      ],
    },
    features: hotspotFeatures,
  });

  const transportRoads = writeTransportRoadYears(buildCityRecord, paths, events, years, cityDir);
  const lensDetail = writeLensDetailYears(buildCityRecord, paths, events, years, cityDir, sourceById);
  const additions = {
    lens_overlays: overlayRelativePath,
    lens_detail_template: lensDetail.template,
    transport_roads_base: transportRoads.base,
    transport_roads_template: transportRoads.template,
  };
  updateArtifactPath(cityConfigPath, buildCityRecord.city_id, additions);
  console.log(`${buildCityRecord.city_id}: wrote ${hotspotFeatures.length} hotspot features, ${transportRoads.roadCount} road source features, ${years.length} transport-road year files, and ${years.length} lens-detail year files.`);
  return { city_id: buildCityRecord.city_id, additions };
}

function main() {
  const atlas = readJson(atlasIndexPath);
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  const additionsByCity = [];
  for (const city of atlas.cities || []) {
    if (only.size && !only.has(city.city_id)) continue;
    additionsByCity.push(buildCity(city));
  }
  const latestIndex = readJson(atlasIndexPath);
  for (const item of additionsByCity) {
    for (const city of latestIndex.cities || []) {
      if (city.city_id !== item.city_id) continue;
      city.artifact_paths = Object.assign({}, city.artifact_paths, item.additions);
    }
  }
  writeJson(atlasIndexPath, latestIndex);
}

main();
