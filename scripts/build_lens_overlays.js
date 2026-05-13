const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const cityDir = path.join(rootDir, "web", "data", "city-atlas", "cities", "belfast");
const eventsIndexPath = path.join(cityDir, "events.json");
const detailLayersPath = path.join(cityDir, "detail_layers.geojson");
const cityConfigPath = path.join(cityDir, "city.json");
const indexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const outputPath = path.join(cityDir, "lens_overlays.geojson");

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
]);

const TRAFFIC_EVENT_RADIUS_KM = 0.58;
const TRAFFIC_WINDOW_YEARS = 2;
const SPATIAL_CELL_DEG = 0.006;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`);
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

function spatialKey(coord) {
  return `${Math.floor(Number(coord[0]) / SPATIAL_CELL_DEG)}|${Math.floor(Number(coord[1]) / SPATIAL_CELL_DEG)}`;
}

function nearbyCells(coord) {
  const x = Math.floor(Number(coord[0]) / SPATIAL_CELL_DEG);
  const y = Math.floor(Number(coord[1]) / SPATIAL_CELL_DEG);
  const cells = [];
  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      cells.push(`${x + dx}|${y + dy}`);
    }
  }
  return cells;
}

function loadEvents(eventsIndex) {
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
      out.push({
        id: event.event_id || event.id || `${category}-${year}-${out.length}`,
        title: event.title || "Source-backed city record",
        year,
        category,
        confidence,
        sourceIds,
        signals,
        weight: confidenceWeight(confidence),
        coord,
      });
    }
  }
  out.sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
  return out;
}

function eventOverlayFeature(event) {
  return {
    type: "Feature",
    properties: {
      id: `lens-event-${event.id}`,
      layer: "lens_event",
      category: event.category,
      category_color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.built_environment,
      year: event.year,
      title: event.title,
      confidence: event.confidence,
      heat_weight: event.weight,
      source_count: event.sourceIds.length,
      source_ids: event.sourceIds.join(","),
      representation: "source-backed event heatmap point",
      timing_note: "Filtered by event effective year; administrative and OSM-mapped dates are evidence dates, not guaranteed physical completion dates.",
    },
    geometry: { type: "Point", coordinates: event.coord },
  };
}

function buildTransportIndex(events) {
  const index = new Map();
  for (const event of events) {
    if (event.category !== "transport" && !event.signals.includes("traffic") && !event.signals.includes("mobility")) continue;
    const key = spatialKey(event.coord);
    const bucket = index.get(key) || [];
    bucket.push(event);
    index.set(key, bucket);
  }
  return index;
}

function nearbyTransportEvents(index, coord) {
  const out = [];
  for (const key of nearbyCells(coord)) {
    const bucket = index.get(key);
    if (bucket) out.push(...bucket);
  }
  return out;
}

function roadActivityForYear(roadCoord, nearbyEvents, year, visibleYear, rank) {
  let raw = 0;
  let count = 0;
  const roadAge = year - visibleYear;
  if (roadAge >= 0 && roadAge <= TRAFFIC_WINDOW_YEARS) {
    const rankWeight = clamp(Number(rank || 1) / 4, 0.25, 1);
    raw += rankWeight * (roadAge === 0 ? 0.72 : roadAge === 1 ? 0.38 : 0.2);
    count += 1;
  }
  for (const event of nearbyEvents) {
    if (event.year > year || event.year < year - TRAFFIC_WINDOW_YEARS) continue;
    const km = distanceKm(roadCoord, event.coord);
    if (km > TRAFFIC_EVENT_RADIUS_KM) continue;
    const age = year - event.year;
    const ageWeight = age === 0 ? 1 : age === 1 ? 0.58 : 0.34;
    const distanceWeight = 1 - (km / TRAFFIC_EVENT_RADIUS_KM);
    raw += event.weight * ageWeight * distanceWeight;
    count += 1;
  }
  return { raw, count };
}

function buildTrafficRoadFeatures(detailLayers, events, years) {
  const roadFeatures = (detailLayers.features || []).filter((feature) => feature.properties?.layer === "road");
  const index = buildTransportIndex(events);
  const yearlyMax = Object.fromEntries(years.map((year) => [year, 0]));
  const staged = [];

  for (const feature of roadFeatures) {
    const coord = lineRepresentativePoint(feature.geometry);
    if (!coord) continue;
    const props = feature.properties || {};
    const visibleYear = Number(props.visible_year || years[0]);
    const nearby = nearbyTransportEvents(index, coord);
    const rawByYear = {};
    const countsByYear = {};
    for (const year of years) {
      if (visibleYear > year) {
        rawByYear[year] = 0;
        countsByYear[year] = 0;
        continue;
      }
      const activity = roadActivityForYear(coord, nearby, year, visibleYear, props.rank);
      rawByYear[year] = activity.raw;
      countsByYear[year] = activity.count;
      yearlyMax[year] = Math.max(yearlyMax[year], activity.raw);
    }
    staged.push({ feature, rawByYear, countsByYear, index: staged.length });
  }

  return staged.map(({ feature, rawByYear, countsByYear, index }) => {
    const props = feature.properties || {};
    const stableRoadId = props.source_id || props.id || props.name || `road-${index}`;
    const nextProps = {
      id: `lens-traffic-road-${stableRoadId}`,
      layer: "traffic_road",
      category: "transport",
      visible_year: Number(props.visible_year || years[0]),
      rank: Number(props.rank || 1),
      name: props.name || props.ref || "mapped road segment",
      source_id: props.source_id || props.id || "",
      source_url: props.source_url || "",
      license: props.license || "ODbL",
      representation: "transport change activity near mapped road",
      timing_note: "Road color is a three-year mapped road-change and transport-event activity surface, not measured traffic volume or congestion.",
    };
    for (const year of years) {
      const max = yearlyMax[year] || 1;
      nextProps[`transport_raw_${year}`] = round(rawByYear[year]);
      nextProps[`transport_count_${year}`] = countsByYear[year];
      nextProps[`transport_activity_${year}`] = round(clamp(rawByYear[year] / max, 0, 1));
    }
    return {
      type: "Feature",
      properties: nextProps,
      geometry: feature.geometry,
    };
  });
}

function updateArtifactPath(filePath, relativePath) {
  const json = readJson(filePath);
  if (Array.isArray(json.cities)) {
    for (const city of json.cities) {
      if (city.city_id !== "belfast") continue;
      city.artifact_paths = Object.assign({}, city.artifact_paths, { lens_overlays: relativePath });
    }
  } else {
    json.artifact_paths = Object.assign({}, json.artifact_paths, { lens_overlays: relativePath });
  }
  writeJson(filePath, json);
}

function main() {
  const eventsIndex = readJson(eventsIndexPath);
  const detailLayers = readJson(detailLayersPath);
  const years = (eventsIndex.event_years || (eventsIndex.chunks || []).map((chunk) => Number(chunk.year)))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const events = loadEvents(eventsIndex);
  const eventFeatures = events.map(eventOverlayFeature);
  const roadFeatures = buildTrafficRoadFeatures(detailLayers, events, years);
  const payload = {
    type: "FeatureCollection",
    name: "belfast_source_backed_lens_overlays",
    metadata: {
      schema_version: "1.0.0",
      city_id: "belfast",
      generated_at: new Date().toISOString(),
      years,
      categories: Array.from(LENS_CATEGORIES),
      source_paths: [
        "web/data/city-atlas/cities/belfast/events.json",
        "web/data/city-atlas/cities/belfast/events_{year}.json",
        "web/data/city-atlas/cities/belfast/detail_layers.geojson",
      ],
      license: "Mixed public source records; OSM-derived road geometry is ODbL.",
      method: "Lens heatmaps use source-backed event points filtered by effective year. Transport road colors use mapped road visibility/edit years plus nearby transport/mobility event density in a rolling three-year window around OSM road centerlines.",
      caveats: [
        "Transport road colors are hotspots of mapped road changes and documented transport-change records, not measured traffic counts or live congestion.",
        "Planning records are administrative evidence and do not prove construction completion.",
        "OSM edit or mapped-visibility dates can differ from real-world change dates.",
      ],
    },
    features: [...eventFeatures, ...roadFeatures],
  };
  writeJson(outputPath, payload);
  const relativeOutput = "web/data/city-atlas/cities/belfast/lens_overlays.geojson";
  updateArtifactPath(cityConfigPath, relativeOutput);
  updateArtifactPath(indexPath, relativeOutput);
  console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${eventFeatures.length} event heat points and ${roadFeatures.length} transport road activity features.`);
}

main();
