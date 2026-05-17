const fs = require("fs");
const path = require("path");

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
]);

const HOTSPOT_CELL_DEG = 0.01;
const ROAD_INDEX_CELL_DEG = 0.018;
const TRAFFIC_EVENT_RADIUS_KM = 0.85;
const TRAFFIC_WINDOW_YEARS = 2;

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
      out.push({
        id: event.event_id || event.id || `${city.city_id}-${category}-${year}-${out.length}`,
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
  const paths = city.artifact_paths || {};
  const cityDir = path.dirname(path.join(rootDir, paths.city));
  const cityConfigPath = path.join(rootDir, paths.city);
  const eventsIndex = readJson(path.join(rootDir, paths.events));
  const years = (eventsIndex.event_years || (eventsIndex.chunks || []).map((chunk) => Number(chunk.year)))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const events = loadEvents(city, eventsIndex);
  const hotspotFeatures = buildHotspotFeatures(city.city_id, events);
  const overlayRelativePath = `web/data/city-atlas/cities/${city.city_id}/lens_overlays.geojson`;
  writeJson(path.join(cityDir, "lens_overlays.geojson"), {
    type: "FeatureCollection",
    name: `${city.city_id}_source_backed_lens_overlays`,
    metadata: {
      schema_version: "1.0.0",
      city_id: city.city_id,
      generated_at: new Date().toISOString(),
      years,
      categories: Array.from(LENS_CATEGORIES),
      source_paths: [
        `web/data/city-atlas/cities/${city.city_id}/events.json`,
        `web/data/city-atlas/cities/${city.city_id}/events_{year}.json`,
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

  const transportRoads = writeTransportRoadYears(city, paths, events, years, cityDir);
  const additions = {
    lens_overlays: overlayRelativePath,
    transport_roads_base: transportRoads.base,
    transport_roads_template: transportRoads.template,
  };
  updateArtifactPath(cityConfigPath, city.city_id, additions);
  console.log(`${city.city_id}: wrote ${hotspotFeatures.length} hotspot features, ${transportRoads.roadCount} road source features, ${years.length} transport-road year files.`);
  return { city_id: city.city_id, additions };
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
