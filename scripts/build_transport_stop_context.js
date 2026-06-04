const fs = require("fs");
const path = require("path");
const {
  loadCityScopeBoundary,
  pointInBoundary,
} = require("./build_lens_overlays");

const ROOT = path.resolve(__dirname, "..");
const ATLAS_INDEX = "web/data/city-atlas/index.json";

const CITY_INPUTS = {
  london: {
    displayName: "London",
    output: "web/data/city-atlas/cities/london/transport_stops_2026.geojson",
    maxAnchorsByMode: {
      bus: 5200,
      rail: 1700,
      ferry: 180,
    },
    inputs: [
      {
        path: "data/derived/2026/london_transport_stops_osm_2026.geojson",
        sourceName: "London public-transport stops and stations from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
      },
    ],
  },
  nyc: {
    displayName: "New York City",
    output: "web/data/city-atlas/cities/nyc/transport_stops_2026.geojson",
    maxAnchorsByMode: {
      bus: 5200,
      rail: 1700,
      ferry: 180,
    },
    inputs: [
      {
        path: "data/derived/2026/nyc_transport_stops_osm_2026.geojson",
        sourceName: "New York City public-transport stops and stations from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
      },
    ],
  },
};

const MODE_COLORS = {
  bus: "#277fb8",
  rail: "#7953a5",
  ferry: "#2f8fa4",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function round(value, precision = 7) {
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

function stableUnit(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function selectedCities() {
  const selectors = [
    ...process.argv.slice(2),
    ...String(process.env.ONLY || "").split(","),
  ].map((item) => item.trim()).filter(Boolean);
  if (!selectors.length) return Object.keys(CITY_INPUTS);
  const selected = new Set(selectors);
  return Object.keys(CITY_INPUTS).filter((cityId) => selected.has(cityId));
}

function inputGeneratedAt(payload) {
  const meta = payload.metadata || {};
  return meta.fetched_at || meta.generatedAt || meta.generated_at || "";
}

function inputAccessedAt(payload) {
  const generatedAt = inputGeneratedAt(payload);
  return generatedAt ? String(generatedAt).slice(0, 10) : "";
}

function cityBoundsFor(config) {
  const cityPath = path.join(path.dirname(path.join(ROOT, config.output)), "city.json");
  if (!fs.existsSync(cityPath)) return null;
  const doc = readJson(cityPath);
  if (!Array.isArray(doc.bounds) || doc.bounds.length !== 4) return null;
  const [west, south, east, north] = doc.bounds.map(Number);
  if (![west, south, east, north].every(Number.isFinite)) return null;
  return { west, south, east, north };
}

function pointInBounds(point, bounds) {
  if (!bounds) return true;
  return point[0] >= bounds.west && point[0] <= bounds.east && point[1] >= bounds.south && point[1] <= bounds.north;
}

function transportMode(props) {
  const text = [
    props.name,
    props.public_transport,
    props.highway,
    props.railway,
    props.station,
    props.amenity,
    props.bus,
    props.train,
    props.subway,
    props.tram,
    props.ferry,
    props.network,
    props.operator,
  ].filter(Boolean).join(" ").toLowerCase();
  const railTagged = ["station", "halt", "tram_stop", "subway_entrance"].includes(String(props.railway || ""))
    || ["subway", "train", "light_rail", "monorail"].includes(String(props.station || ""))
    || props.train === "yes"
    || props.subway === "yes"
    || props.tram === "yes"
    || /\b(railway|subway|train|tram|light_rail|metro|underground|tube|lirr|metro-north|path)\b/.test(text);
  const busTagged = props.highway === "bus_stop"
    || props.amenity === "bus_station"
    || props.bus === "yes"
    || /\bbus\b/.test(text);
  if (props.amenity === "ferry_terminal" || props.ferry === "yes" || /\bferry\b/.test(text)) return "ferry";
  if (railTagged && !props.highway && props.amenity !== "bus_station") return "rail";
  if (busTagged) return "bus";
  if (railTagged) return "rail";
  if (props.public_transport === "platform" || props.public_transport === "stop_position") return "bus";
  return "";
}

function stopRank(props, mode) {
  let rank = mode === "rail" ? 4.2 : mode === "ferry" ? 3.6 : 2;
  if (props.name) rank += 0.55;
  if (props.operator || props.network) rank += 0.25;
  if (props.amenity === "bus_station") rank += 1;
  if (props.railway === "station" || props.public_transport === "station") rank += 1;
  if (props.railway === "subway_entrance") rank += 0.4;
  if (props.route_ref || props.ref || props.local_ref) rank += 0.2;
  return round(Math.min(5, rank), 3);
}

function servingLinesFor(props) {
  const raw = [props.route_ref, props.ref, props.local_ref]
    .filter(Boolean)
    .join(";");
  return raw
    .split(/[;,|/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function stopWeight(props, mode, rank, lineCount) {
  const base = mode === "rail" ? 0.74 : mode === "ferry" ? 0.68 : 0.36;
  return round(Math.min(1, base + Math.min(0.14, lineCount * 0.012) + Math.min(0.18, rank * 0.035)), 3);
}

function sourceIdFor(feature, input, index) {
  const props = feature.properties || {};
  return props.source_id || props.id || props["@id"] || `${input.path}#${index}`;
}

function sourceUrlFor(feature, sourceId) {
  const props = feature.properties || {};
  if (props.source_url) return props.source_url;
  const [type, id] = String(sourceId || "").split("/");
  if (/^(node|way|relation)$/.test(type || "") && /^\d+$/.test(id || "")) {
    return `https://www.openstreetmap.org/${type}/${id}`;
  }
  return "";
}

function featurePoint(feature) {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
}

function featureCountsByMode(features) {
  return features.reduce((acc, feature) => {
    const key = feature.properties?.mode || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function thinningPriority(feature) {
  const props = feature.properties || {};
  const label = String(props.name || "");
  const namedBoost = label && !/^mapped /i.test(label) ? 0.75 : 0;
  const modeBoost = props.mode === "rail" ? 0.3 : props.mode === "ferry" ? 0.2 : 0;
  return Number(props.rank || 1) + namedBoost + modeBoost + stableUnit(props.source_id) * 0.01;
}

function thinFeatureGroup(group, limit) {
  if (!limit || group.length <= limit) return group;
  const points = group.map(featurePoint).filter(Boolean);
  if (!points.length) return group.slice(0, limit);
  const bounds = points.reduce((acc, point) => ({
    west: Math.min(acc.west, point[0]),
    east: Math.max(acc.east, point[0]),
    south: Math.min(acc.south, point[1]),
    north: Math.max(acc.north, point[1]),
  }), { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity });
  const ranked = group.slice().sort((a, b) =>
    thinningPriority(b) - thinningPriority(a)
    || String(a.properties?.source_id || "").localeCompare(String(b.properties?.source_id || "")));
  const cells = Math.max(16, Math.ceil(Math.sqrt(limit * 1.45)));
  const selected = [];
  const selectedIds = new Set();
  const usedCells = new Set();
  const width = Math.max(1e-9, bounds.east - bounds.west);
  const height = Math.max(1e-9, bounds.north - bounds.south);
  for (const feature of ranked) {
    if (selected.length >= limit) break;
    const point = featurePoint(feature);
    if (!point) continue;
    const cellX = Math.max(0, Math.min(cells - 1, Math.floor(((point[0] - bounds.west) / width) * cells)));
    const cellY = Math.max(0, Math.min(cells - 1, Math.floor(((point[1] - bounds.south) / height) * cells)));
    const cellKey = `${cellX}:${cellY}`;
    if (usedCells.has(cellKey)) continue;
    usedCells.add(cellKey);
    selected.push(feature);
    selectedIds.add(feature.properties?.id);
  }
  for (const feature of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(feature.properties?.id)) continue;
    selected.push(feature);
    selectedIds.add(feature.properties?.id);
  }
  return selected;
}

function applyCitywideThinning(features, config) {
  const limits = config.maxAnchorsByMode || {};
  if (!Object.keys(limits).length) return { features, before: featureCountsByMode(features), after: featureCountsByMode(features), applied: false };
  const groups = features.reduce((acc, feature) => {
    const key = feature.properties?.mode || "unknown";
    acc[key] = acc[key] || [];
    acc[key].push(feature);
    return acc;
  }, {});
  const output = [];
  for (const [mode, group] of Object.entries(groups)) {
    output.push(...thinFeatureGroup(group, Number(limits[mode] || 0)));
  }
  output.sort(featureSort);
  return { features: output, before: featureCountsByMode(features), after: featureCountsByMode(output), applied: true };
}

function featureSort(a, b) {
  return String(a.properties.mode).localeCompare(String(b.properties.mode))
    || Number(b.properties.rank) - Number(a.properties.rank)
    || String(a.properties.name).localeCompare(String(b.properties.name));
}

function cityScopeFilterMetadata(boundary, stats) {
  return {
    boundary_source_path: boundary.source_path,
    boundary_source_name: boundary.source_name,
    boundary_source_url: boundary.source_url,
    boundary_licence: boundary.licence,
    boundary_scope: boundary.boundary_scope,
    method: "Retains current mapped transport stop/station anchors only when their source point or Overpass center proxy falls inside the official city boundary. Atlas bounds are used as a retrieval prefilter; the official boundary controls published city scope.",
    input_feature_count: stats.inputFeatureCount,
    classified_feature_count: stats.classifiedFeatureCount,
    dropped_unclassified_feature_count: stats.droppedUnclassifiedFeatureCount,
    usable_anchor_count_before_bounds: stats.usableAnchorCountBeforeBounds,
    dropped_out_of_bounds_feature_count: stats.droppedOutOfBoundsFeatureCount,
    candidate_anchor_count_before_boundary: stats.candidateAnchorCountBeforeBoundary,
    dropped_out_of_scope_feature_count: stats.droppedOutOfScopeFeatureCount,
    duplicate_anchor_count: stats.duplicateAnchorCount,
    kept_feature_count: stats.keptFeatureCount,
    emitted_feature_count: stats.emittedFeatureCount,
    boundary_feature_count: boundary.feature_count,
    boundary_polygon_count: boundary.polygon_count,
  };
}

function normalizeCity(cityId, config) {
  const seen = new Set();
  const features = [];
  const sourcePaths = [];
  const inputGeneratedAts = [];
  const sourceMetadata = [];
  const bounds = cityBoundsFor(config);
  const boundary = loadCityScopeBoundary(cityId);
  const output = path.join(ROOT, config.output);
  const stats = {
    inputFeatureCount: 0,
    classifiedFeatureCount: 0,
    droppedUnclassifiedFeatureCount: 0,
    usableAnchorCountBeforeBounds: 0,
    droppedOutOfBoundsFeatureCount: 0,
    candidateAnchorCountBeforeBoundary: 0,
    droppedOutOfScopeFeatureCount: 0,
    duplicateAnchorCount: 0,
    keptFeatureCount: 0,
    emittedFeatureCount: 0,
  };

  for (const input of config.inputs) {
    const absolute = path.join(ROOT, input.path);
    if (!fs.existsSync(absolute)) continue;
    sourcePaths.push(input.path);
    const payload = readJson(absolute);
    if (payload.metadata) sourceMetadata.push(payload.metadata);
    const generatedAt = inputGeneratedAt(payload);
    const accessedAt = inputAccessedAt(payload);
    if (generatedAt) inputGeneratedAts.push(generatedAt);
    for (const [index, feature] of (payload.features || []).entries()) {
      stats.inputFeatureCount += 1;
      const props = feature.properties || {};
      const mode = transportMode(props);
      if (!mode) {
        stats.droppedUnclassifiedFeatureCount += 1;
        continue;
      }
      stats.classifiedFeatureCount += 1;
      const point = featurePoint(feature);
      if (!point) continue;
      stats.usableAnchorCountBeforeBounds += 1;
      if (!pointInBounds(point, bounds)) {
        stats.droppedOutOfBoundsFeatureCount += 1;
        continue;
      }
      stats.candidateAnchorCountBeforeBoundary += 1;
      if (!pointInBoundary(point, boundary)) {
        stats.droppedOutOfScopeFeatureCount += 1;
        continue;
      }
      const sourceId = sourceIdFor(feature, input, index);
      const key = `${sourceId}|${mode}|${round(point[0], 6)}|${round(point[1], 6)}`;
      if (seen.has(key)) {
        stats.duplicateAnchorCount += 1;
        continue;
      }
      seen.add(key);
      const sourceUrl = sourceUrlFor(feature, sourceId);
      const rank = stopRank(props, mode);
      const servingLines = servingLinesFor(props);
      const label = String(props.name || props.operator || `${mode} stop/station`).trim();
      features.push({
        type: "Feature",
        properties: {
          id: `${cityId}-transport-stop-${features.length + 1}`,
          layer: "transport_stop_anchor",
          source_id: sourceId,
          source_object_id: props.source_object_id || sourceId,
          source_registry_id: props.source_registry_id || "osm-overpass",
          source_url: sourceUrl,
          osm_element_type: props.osm_element_type || "",
          original_geometry_type: props.original_geometry_type || "",
          geometry_source: props.geometry_source || "",
          name: label,
          mode,
          bus: mode === "bus" ? "yes" : "",
          public_transport: props.public_transport || "",
          highway: props.highway || "",
          railway: props.railway || "",
          station: props.station || "",
          amenity: props.amenity || "",
          routeNode: props.public_transport === "stop_position" ? 1 : 0,
          servingLineCount: servingLines.length,
          servingLines: servingLines.join(", "),
          weight: stopWeight(props, mode, rank, servingLines.length),
          rank,
          color: MODE_COLORS[mode],
          sourceFamilies: "osm",
          sourceName: input.sourceName,
          publisher: input.publisher,
          source_type: "current mapped public-transport stop/station context",
          sourceUpdated: accessedAt || "2026-06-04",
          license: "Open Database License (ODbL); attribution required for OpenStreetMap contributors.",
          accessed_at: accessedAt || "2026-06-04",
          transformation_method: "Classified current mapped OSM public-transport stop/station features into bus, rail, and ferry anchors; deduplicated by source id/mode/location; retained only official-boundary-scoped current context for access-proxy guide generation.",
          caveat: "Current mapped stop/station anchor only; not official GTFS, timetable, service frequency, reliability, journey-time, accessibility, or entitlement evidence.",
        },
        geometry: { type: "Point", coordinates: [round(point[0]), round(point[1])] },
      });
    }
  }

  if (!sourcePaths.length) {
    if (fs.existsSync(output)) {
      console.log(`Preserving existing ${path.relative(ROOT, output)}; source input(s) missing. Run npm run fetch:transport-stops-osm first to refresh this artifact.`);
      return config.output;
    }
    throw new Error(`${cityId} transport stop context source input(s) are missing: ${config.inputs.map((input) => input.path).join(", ")}`);
  }

  features.sort(featureSort);
  stats.keptFeatureCount = features.length;
  const thinning = applyCitywideThinning(features, config);
  stats.emittedFeatureCount = thinning.features.length;

  writeJson(output, {
    type: "FeatureCollection",
    name: `${cityId}_transport_stops_2026`,
    metadata: {
      schema_version: "1.0.0",
      city_id: cityId,
      generated_at: inputGeneratedAts.sort().at(-1) || new Date().toISOString(),
      context_data_year: "2026",
      source_paths: sourcePaths,
      source_metadata: sourceMetadata,
      city_scope_filter: cityScopeFilterMetadata(boundary, stats),
      method: `Current OSM public-transport stop and station anchors for ${config.displayName}. The frontend uses these as mapped context for access-proxy guide geometry; they are not official service frequency, reliability, journey-time, or selected-year evidence.`,
      caveats: [
        "Current mapped transport anchors may post-date selected timeline years.",
        "OSM mapped visibility, stop names, and modal tags may be incomplete or stale.",
        "No GTFS service frequency, timetable, journey time, accessibility compliance, reliability, or capacity is inferred.",
      ],
      feature_layers: thinning.after,
      feature_layers_before_thinning: thinning.before,
      thinning_method: thinning.applied
        ? "Deterministic citywide grid-and-rank thinning keeps source-backed transport anchors distributed across the whole city while avoiding chaotic frontend density; selected anchors remain real OSM source objects."
        : "",
    },
    features: thinning.features,
  });
  console.log(`Wrote ${thinning.features.length} transport stop/station anchors to ${path.relative(ROOT, output)}`);
  return config.output;
}

function updateArtifactPath(cityId, relativePath) {
  if (!relativePath) return;
  const cityPath = path.join(ROOT, "web", "data", "city-atlas", "cities", cityId, "city.json");
  const cityDoc = readJson(cityPath);
  const sourcesPath = cityDoc.artifact_paths?.sources || `web/data/city-atlas/cities/${cityId}/sources.json`;
  const sourcesDoc = fs.existsSync(path.join(ROOT, sourcesPath)) ? readJson(path.join(ROOT, sourcesPath)) : null;
  const sourceCount = Array.isArray(sourcesDoc?.sources) ? sourcesDoc.sources.length : null;
  cityDoc.artifact_paths = Object.assign({}, cityDoc.artifact_paths, {
    transport_stops: relativePath,
  });
  writeJson(cityPath, cityDoc);

  const indexPath = path.join(ROOT, ATLAS_INDEX);
  const indexDoc = readJson(indexPath);
  for (const city of indexDoc.cities || []) {
    if (city.city_id !== cityId) continue;
    city.artifact_paths = Object.assign({}, city.artifact_paths, {
      transport_stops: relativePath,
    });
    if (sourceCount !== null) city.source_count = sourceCount;
  }
  writeJson(indexPath, indexDoc);
}

for (const cityId of selectedCities()) {
  const output = normalizeCity(cityId, CITY_INPUTS[cityId]);
  updateArtifactPath(cityId, output);
}
