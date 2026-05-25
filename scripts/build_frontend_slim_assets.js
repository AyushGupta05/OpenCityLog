const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const citiesDir = path.join(rootDir, "web", "data", "city-atlas", "cities");
const STOP_FIELDS = [
  "name",
  "label",
  "mode",
  "source_id",
  "sourceName",
  "sourceUpdated",
  "sourceFamilies",
  "servingLines",
  "servingLineCount",
  "routeNode",
  "weight",
];
const ROAD_FIELDS = [
  "id",
  "layer",
  "category",
  "year",
  "visible_year",
  "rank",
  "name",
  "road_name",
  "source_id",
  "transport_activity",
  "transport_count",
  "mode",
  "source",
  "source_kind",
  "highway",
  "route",
  "railway",
];
const EVENT_SUMMARY_FIELDS = [
  "event_id",
  "title",
  "year",
  "effective_date",
  "date_precision",
  "category",
  "confidence",
];
const COMPACT_EVENT_SUMMARY_FIELDS = [
  "event_id",
  "title",
  "year",
  "category",
  "confidence",
  "short_description",
  "affected_area_label",
  "lng",
  "lat",
  "effective_date",
  "date_precision",
  "evidence_count",
  "source_count",
  "caveat_count",
];
const SUMMARY_TEXT_LIMIT = 96;

function truncateText(value, limit = SUMMARY_TEXT_LIMIT) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function slimStopFeature(feature) {
  const props = feature.properties || {};
  const nextProps = {};
  for (const field of STOP_FIELDS) {
    if (props[field] !== undefined && props[field] !== null && props[field] !== "") {
      nextProps[field] = props[field];
    }
  }
  return {
    type: "Feature",
    properties: nextProps,
    geometry: feature.geometry,
  };
}

function buildSlimStops(cityId) {
  const cityDir = path.join(citiesDir, cityId);
  const sourcePath = path.join(cityDir, "transport_stops_2026.geojson");
  if (!fs.existsSync(sourcePath)) return null;
  const payload = readJson(sourcePath);
  const features = Array.isArray(payload.features)
    ? payload.features.filter((feature) => feature.geometry?.type === "Point").map(slimStopFeature)
    : [];
  const slim = { type: "FeatureCollection", features };
  const outPath = path.join(cityDir, "transport_stops_2026.slim.geojson");
  writeJson(outPath, slim);
  return {
    cityId,
    sourcePath,
    outPath,
    featureCount: features.length,
    sourceBytes: fs.statSync(sourcePath).size,
    slimBytes: fs.statSync(outPath).size,
  };
}

function slimRoadFeature(feature) {
  const props = feature.properties || {};
  const nextProps = {};
  for (const field of ROAD_FIELDS) {
    if (props[field] !== undefined && props[field] !== null && props[field] !== "") {
      nextProps[field] = props[field];
    }
  }
  return {
    type: "Feature",
    properties: nextProps,
    geometry: feature.geometry,
  };
}

function buildSlimTransportRoads(cityId) {
  const cityDir = path.join(citiesDir, cityId);
  const files = fs.readdirSync(cityDir)
    .filter((name) => /^transport_roads_\d{4}\.geojson$/.test(name))
    .sort();
  const results = [];
  for (const file of files) {
    const sourcePath = path.join(cityDir, file);
    const payload = readJson(sourcePath);
    const features = Array.isArray(payload.features)
      ? payload.features.filter((feature) => feature.geometry).map(slimRoadFeature)
      : [];
    const slim = { type: "FeatureCollection", features };
    const outPath = path.join(cityDir, file.replace(".geojson", ".slim.geojson"));
    writeJson(outPath, slim);
    results.push({
      cityId,
      year: Number(file.match(/\d{4}/)?.[0]),
      featureCount: features.length,
      sourceBytes: fs.statSync(sourcePath).size,
      slimBytes: fs.statSync(outPath).size,
    });
  }
  return results;
}

function averageRing(coords) {
  let lng = 0;
  let lat = 0;
  let count = 0;
  for (const coord of coords || []) {
    if (!Array.isArray(coord)) continue;
    const [x, y] = coord;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    lng += x;
    lat += y;
    count += 1;
  }
  return count ? [Number((lng / count).toFixed(6)), Number((lat / count).toFixed(6))] : null;
}

function averageNestedCoordinates(coords) {
  const points = [];
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      points.push(value);
      return;
    }
    value.forEach(visit);
  };
  visit(coords);
  return averageRing(points);
}

function pointGeometry(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    return Number.isFinite(lng) && Number.isFinite(lat)
      ? { type: "Point", coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] }
      : null;
  }
  const point = geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])
    ? averageRing(geometry.coordinates[0])
    : averageNestedCoordinates(geometry.coordinates);
  return point ? { type: "Point", coordinates: point } : null;
}

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function summarizeEvent(event) {
  const summary = { summary_record: true };
  for (const field of EVENT_SUMMARY_FIELDS) {
    if (event[field] !== undefined && event[field] !== null && event[field] !== "") summary[field] = event[field];
  }
  const evidence = Array.isArray(event.evidence) ? event.evidence : [];
  const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : Array.isArray(event.sources) ? event.sources : [];
  const shortDescription = truncateText(firstText(event.short_description, event.summary, event.explanation));
  if (shortDescription) summary.short_description = shortDescription;
  const point = pointGeometry(event.geometry);
  if (point) {
    summary.lng = point.coordinates[0];
    summary.lat = point.coordinates[1];
  }
  const areaLabel = firstText(event.affected_area_label, event.affected_area?.label);
  if (areaLabel) summary.affected_area_label = areaLabel;
  summary.evidence_count = evidence.length;
  summary.source_count = sourceIds.length;
  summary.caveat_count = Array.isArray(event.caveats) ? event.caveats.length : 0;
  return summary;
}

function compactSummaryEvent(event) {
  const summary = summarizeEvent(event);
  const row = COMPACT_EVENT_SUMMARY_FIELDS.map((field) => summary[field] ?? "");
  while (row.length && (row[row.length - 1] === "" || row[row.length - 1] === null || row[row.length - 1] === undefined)) {
    row.pop();
  }
  return row;
}

function buildEventSummaries(cityId) {
  const cityDir = path.join(citiesDir, cityId);
  const files = fs.readdirSync(cityDir)
    .filter((name) => /^events_\d{4}\.json$/.test(name))
    .sort();
  const results = [];
  for (const file of files) {
    const sourcePath = path.join(cityDir, file);
    const payload = readJson(sourcePath);
    const events = Array.isArray(payload.events) ? payload.events : [];
    const summaryPayload = {
      schema_version: payload.schema_version || "1.0.0",
      city_id: payload.city_id || cityId,
      year: payload.year || Number(file.match(/\d{4}/)?.[0]),
      event_count: events.length,
      summary: true,
      format: "compact-event-summary-v1",
      fields: COMPACT_EVENT_SUMMARY_FIELDS,
      events: events.map(compactSummaryEvent),
    };
    const outPath = path.join(cityDir, file.replace(".json", ".summary.json"));
    writeJson(outPath, summaryPayload);
    results.push({
      cityId,
      year: summaryPayload.year,
      eventCount: events.length,
      sourceBytes: fs.statSync(sourcePath).size,
      summaryBytes: fs.statSync(outPath).size,
    });
  }
  return results;
}

function parseArgs(argv) {
  const options = {
    cities: [],
    eventsOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--events-only") {
      options.eventsOnly = true;
    } else if (arg === "--city") {
      const city = argv[i + 1];
      if (!city) throw new Error("--city requires a city id");
      options.cities.push(city);
      i += 1;
    } else if (arg.startsWith("--city=")) {
      options.cities.push(arg.slice("--city=".length));
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function availableCityIds() {
  return fs.readdirSync(citiesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const cityIds = options.cities.length ? options.cities : availableCityIds();
  const available = new Set(availableCityIds());
  for (const cityId of cityIds) {
    if (!available.has(cityId)) throw new Error(`Unknown city: ${cityId}`);
  }

  if (!options.eventsOnly) {
    const results = cityIds.map(buildSlimStops).filter(Boolean);
    for (const result of results) {
      const reduction = result.sourceBytes
        ? Math.round((1 - result.slimBytes / result.sourceBytes) * 100)
        : 0;
      console.log(`${result.cityId}: ${result.featureCount} stops, ${reduction}% smaller`);
    }
    const roadResults = cityIds.flatMap(buildSlimTransportRoads);
    for (const cityId of cityIds) {
      const cityRoads = roadResults.filter((result) => result.cityId === cityId);
      const sourceBytes = cityRoads.reduce((sum, result) => sum + result.sourceBytes, 0);
      const slimBytes = cityRoads.reduce((sum, result) => sum + result.slimBytes, 0);
      const featureCount = cityRoads.reduce((sum, result) => sum + result.featureCount, 0);
      const reduction = sourceBytes ? Math.round((1 - slimBytes / sourceBytes) * 100) : 0;
      if (cityRoads.length) {
        console.log(`${cityId}: ${featureCount} road features across ${cityRoads.length} years, ${reduction}% smaller`);
      }
    }
  }

  const eventResults = cityIds.flatMap(buildEventSummaries);
  for (const result of eventResults) {
    const reduction = result.sourceBytes
      ? Math.round((1 - result.summaryBytes / result.sourceBytes) * 100)
      : 0;
    console.log(`${result.cityId} ${result.year}: ${result.eventCount} event summaries, ${reduction}% smaller`);
  }
}

main();
