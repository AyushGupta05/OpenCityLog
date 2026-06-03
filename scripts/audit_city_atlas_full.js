const fs = require("fs");
const path = require("path");
const {
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");

const CONFIDENCE_VALUES = new Set(["documented", "corroborated", "inferred", "disputed"]);
const EVIDENCE_KINDS = new Set(["source_url", "local_file", "changeset", "source_record"]);
const GEOJSON_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);
const NYC_BOROUGH_CODES = new Set(["B", "BK", "BX", "M", "MN", "Q", "QN", "R", "SI", "X"]);
const SAFE_LENS_LABELS = new Map([
  ["Journey Speed", "Transport Activity"],
  ["Public Service Gaps", "Service Coverage Context"],
  ["Service Demand", "Service Context"],
  ["Economic Pull", "Economic Context Links"],
  ["Utility Capacity", "Utility Context"],
  ["Network Resilience", "Utility Network Context"],
]);

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    atlasDir: "web/data/city-atlas",
    maxSamples: 8,
    liveNycParks: true,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--atlas-dir") {
      args.atlasDir = next;
      index += 1;
    } else if (arg === "--max-samples") {
      args.maxSamples = Number(next);
      index += 1;
    } else if (arg === "--skip-live-nyc-parks") {
      args.liveNycParks = false;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.maxSamples) || args.maxSamples < 1) {
    throw new Error("--max-samples must be a positive integer");
  }
  return args;
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function rel(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compact(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function addIssue(audit, severity, code, details) {
  const key = `${severity}:${code}`;
  if (!audit.issue_counts[key]) {
    audit.issue_counts[key] = {
      severity,
      code,
      count: 0,
      samples: [],
    };
  }
  const bucket = audit.issue_counts[key];
  bucket.count += 1;
  if (bucket.samples.length < audit.maxSamples) bucket.samples.push(details);
}

function assertIssue(audit, condition, severity, code, details) {
  if (!condition) addIssue(audit, severity, code, details);
}

function walkFiles(dir, extensions) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      out.push(...walkFiles(filePath, extensions));
    } else if (extensions.some((ext) => name.endsWith(ext))) {
      out.push(filePath);
    }
  }
  return out.sort();
}

function isPosition(value) {
  return Array.isArray(value)
    && value.length >= 2
    && value.every((item) => typeof item === "number" && Number.isFinite(item))
    && value[0] >= -180
    && value[0] <= 180
    && value[1] >= -90
    && value[1] <= 90;
}

function positionsMatch(first, second) {
  return isPosition(first)
    && isPosition(second)
    && first.length === second.length
    && first.every((value, index) => value === second[index]);
}

function validLineString(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(isPosition);
}

function validLinearRing(value) {
  return Array.isArray(value)
    && value.length >= 4
    && value.every(isPosition)
    && positionsMatch(value[0], value[value.length - 1]);
}

function validPolygon(value) {
  return Array.isArray(value) && value.length >= 1 && value.every(validLinearRing);
}

function coordinatesAreValid(value) {
  if (isPosition(value)) return true;
  return Array.isArray(value) && value.length > 0 && value.every(coordinatesAreValid);
}

function geometryIsValid(geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (!GEOJSON_TYPES.has(geometry.type)) return false;
  switch (geometry.type) {
    case "Point":
      return isPosition(geometry.coordinates);
    case "MultiPoint":
      return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(isPosition);
    case "LineString":
      return validLineString(geometry.coordinates);
    case "MultiLineString":
      return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(validLineString);
    case "Polygon":
      return validPolygon(geometry.coordinates);
    case "MultiPolygon":
      return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(validPolygon);
    case "GeometryCollection":
      return Array.isArray(geometry.geometries) && geometry.geometries.length > 0 && geometry.geometries.every(geometryIsValid);
    default:
      return false;
  }
}

function geometryCoordinates(geometry) {
  if (!geometry || typeof geometry !== "object") return [];
  if (geometry.type === "GeometryCollection") {
    return (geometry.geometries || []).flatMap(geometryCoordinates);
  }
  const out = [];
  function visit(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      out.push([value[0], value[1]]);
      return;
    }
    value.forEach(visit);
  }
  visit(geometry.coordinates);
  return out;
}

function coordinatesInBounds(geometry, bounds, tolerance = 0.02) {
  const [west, south, east, north] = bounds || [];
  if (![west, south, east, north].every(Number.isFinite)) return true;
  return geometryCoordinates(geometry).every(([lon, lat]) => (
    lon >= west - tolerance
    && lon <= east + tolerance
    && lat >= south - tolerance
    && lat <= north + tolerance
  ));
}

function eventText(event) {
  const caveats = Array.isArray(event.caveats) ? event.caveats : [];
  return [
    event.title,
    event.short_description,
    event.explanation,
    ...caveats,
  ].map(compact).filter(Boolean).join(" ");
}

function containsOverclaim(text) {
  return [
    /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b/i,
    /\bcaused?\b/i,
    /\bpredicts?\b|\bprediction\b|\bpredictive\b/i,
    /\bforecast(ed|s|ing)?\b/i,
    /\bsimulation result\b/i,
    /\bimpact score\b/i,
    /\bproof\s+(of|that)\b|\bas proof\b|\bproves?\s+that\b/i,
  ].some((pattern) => pattern.test(text));
}

function eventEvidence(event) {
  return Array.isArray(event.evidence) ? event.evidence : [];
}

function eventSourceIds(event) {
  return Array.isArray(event.source_ids) ? event.source_ids : [];
}

function hasEventRetrievalTrace(event, sourceById) {
  if (event.provenance?.source_retrieved_at) return true;
  if (eventEvidence(event).some((item) => item?.accessed_at)) return true;
  return eventSourceIds(event).some((sourceId) => {
    const source = sourceById.get(sourceId);
    return Boolean(source?.accessed_at || source?.retrieved_at || source?.registry_reviewed_at);
  });
}

function hasSourceAccessTrace(source) {
  return Boolean(source?.accessed_at || source?.retrieved_at || source?.registry_reviewed_at);
}

function nycBoroughName(value) {
  const text = compact(value).toUpperCase().replace(/[()]/g, "");
  if (text.includes("STATEN") || text.includes("RICHMOND")) return "Staten Island";
  if (text.includes("MANHATTAN") || text === "NEW YORK" || text === "M" || text === "MN") return "Manhattan";
  if (text.includes("BROOKLYN") || text === "KINGS" || text === "B" || text === "BK" || text === "K") return "Brooklyn";
  if (text.includes("BRONX") || text === "X" || text === "BX") return "Bronx";
  if (text.includes("QUEENS") || text === "Q" || text === "QN") return "Queens";
  if (text === "R" || text === "SI" || text === "S") return "Staten Island";
  return compact(value);
}

async function fetchNycParksBoroughs() {
  const url = new URL("https://data.cityofnewyork.us/resource/enfh-gkve.json");
  url.searchParams.set("$limit", "50000");
  url.searchParams.set("$select", "objectid,borough");
  url.searchParams.set("$where", "acquisitiondate IS NOT NULL AND multipolygon IS NOT NULL");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NYC Parks borough fetch failed with ${response.status}`);
  const rows = await response.json();
  const byObjectId = new Map();
  for (const row of rows) {
    if (row.objectid) byObjectId.set(String(row.objectid), nycBoroughName(row.borough));
  }
  return byObjectId;
}

function sourceRecordId(event) {
  return compact(event.provenance?.source_record_id || eventEvidence(event)[0]?.record_id || "");
}

function validateSources(audit, cityId, sourcesPayload, cityPath) {
  const sourceById = new Map();
  for (const source of sourcesPayload.sources || []) {
    const label = `${cityId}:${source.source_id || "<missing source_id>"}`;
    assertIssue(audit, Boolean(source.source_id), "blocker", "source_missing_id", { label, file: cityPath });
    if (source.source_id) {
      assertIssue(audit, !sourceById.has(source.source_id), "blocker", "source_duplicate_id", { label, file: cityPath });
      sourceById.set(source.source_id, source);
    }
    assertIssue(audit, Boolean(source.title), "blocker", "source_missing_title", { label, file: cityPath });
    assertIssue(audit, Boolean(source.provider), "blocker", "source_missing_provider", { label, file: cityPath });
    assertIssue(audit, Boolean(source.licence || source.license), "blocker", "source_missing_licence", { label, file: cityPath });
    assertIssue(audit, Boolean(source.licence_url || source.license_url), "blocker", "source_missing_licence_url", { label, file: cityPath });
    assertIssue(audit, Boolean(source.attribution_text), "blocker", "source_missing_attribution", { label, file: cityPath });
    assertIssue(audit, hasSourceAccessTrace(source), "warning", "source_missing_access_trace", { label, file: cityPath });
    assertIssue(audit, Array.isArray(source.caveats) && source.caveats.length > 0, "blocker", "source_missing_caveats", { label, file: cityPath });
  }
  return sourceById;
}

function validateLensYearCoverage(audit, root, cityId, cityDir) {
  const filePath = path.join(cityDir, "lens_year_coverage.json");
  if (!fs.existsSync(filePath)) {
    addIssue(audit, "blocker", "lens_year_coverage_missing", { city_id: cityId, file: rel(root, filePath) });
    return;
  }
  const payload = readJson(filePath);
  const rows = payload.rows || [];
  assertIssue(audit, Array.isArray(rows) && rows.length > 0, "blocker", "lens_year_coverage_empty", { city_id: cityId, file: rel(root, filePath) });
  for (const row of rows) {
    const safeLabel = SAFE_LENS_LABELS.get(row.public_label);
    assertIssue(
      audit,
      !safeLabel,
      "blocker",
      "lens_year_coverage_legacy_label",
      {
        city_id: cityId,
        year: row.year,
        lens: row.lens_slug,
        label: row.public_label,
        expected_label: safeLabel,
        file: rel(root, filePath),
      },
    );
    for (const [legacy, replacement] of SAFE_LENS_LABELS) {
      if (compact(row.evidence_basis).includes(legacy)) {
        addIssue(audit, "blocker", "lens_year_coverage_legacy_evidence_text", {
          city_id: cityId,
          year: row.year,
          lens: row.lens_slug,
          legacy,
          expected_text: replacement,
          file: rel(root, filePath),
        });
      }
    }
  }
}

function validateEvent(audit, root, city, sourceById, event, chunkPath, chunkYear, eventIdSet, parksBoroughById) {
  const eventId = event.event_id || "<missing event_id>";
  const label = `${city.city_id}:${chunkYear}:${eventId}`;
  const evidenceItems = eventEvidence(event);
  const sourceIds = eventSourceIds(event);
  assertIssue(audit, Boolean(event.event_id), "blocker", "event_missing_id", { label, file: rel(root, chunkPath) });
  assertIssue(audit, !eventIdSet.has(event.event_id), "blocker", "event_duplicate_id", { label, file: rel(root, chunkPath) });
  eventIdSet.add(event.event_id);
  assertIssue(audit, event.city_id === city.city_id, "blocker", "event_wrong_city", { label, got: event.city_id, file: rel(root, chunkPath) });
  assertIssue(audit, Number.isInteger(event.year) && event.year === chunkYear, "blocker", "event_year_chunk_mismatch", { label, year: event.year, chunk_year: chunkYear, file: rel(root, chunkPath) });
  assertIssue(audit, Boolean(compact(event.title)), "blocker", "event_missing_title", { label, file: rel(root, chunkPath) });
  assertIssue(audit, compact(event.short_description).length >= 12, "blocker", "event_short_description_bad", { label, file: rel(root, chunkPath) });
  assertIssue(audit, CONFIDENCE_VALUES.has(event.confidence), "blocker", "event_bad_confidence", { label, confidence: event.confidence, file: rel(root, chunkPath) });
  assertIssue(audit, Array.isArray(event.source_ids) && event.source_ids.length > 0, "blocker", "event_missing_source_ids", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Array.isArray(event.evidence) && event.evidence.length > 0, "blocker", "event_missing_evidence", { label, file: rel(root, chunkPath) });
  const mapWithheldSourceIds = sourceIds.filter((sourceId) => sourceWithholdsMapGeometry(sourceById.get(sourceId)));
  if (mapWithheldSourceIds.length) {
    assertIssue(audit, !event.geometry, "blocker", "event_map_withheld_source_has_geometry", { label, source_ids: mapWithheldSourceIds, file: rel(root, chunkPath) });
    assertIssue(audit, event.geometry_status === "withheld_rights_review" || event.provenance?.geometry_status === "withheld_rights_review", "blocker", "event_map_withheld_missing_status", { label, source_ids: mapWithheldSourceIds, file: rel(root, chunkPath) });
  } else {
    assertIssue(audit, geometryIsValid(event.geometry), "blocker", "event_invalid_geometry", { label, file: rel(root, chunkPath) });
    assertIssue(audit, coordinatesInBounds(event.geometry, city.bounds), "blocker", "event_geometry_outside_city_bounds", { label, coordinates: geometryCoordinates(event.geometry)[0], bounds: city.bounds, file: rel(root, chunkPath) });
  }
  assertIssue(audit, Boolean(compact(event.affected_area?.label)), "blocker", "event_missing_area_label", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Boolean(event.provenance?.transform), "blocker", "event_missing_transform", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Boolean(event.provenance?.source_date_field || event.source_date_field), "blocker", "event_missing_source_date_field", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Boolean(event.provenance?.geometry_source), "blocker", "event_missing_geometry_source", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Boolean(event.provenance?.geometry_precision), "blocker", "event_missing_geometry_precision", { label, file: rel(root, chunkPath) });
  assertIssue(audit, Array.isArray(event.caveats) && event.caveats.length > 0, "blocker", "event_missing_caveats", { label, file: rel(root, chunkPath) });
  assertIssue(audit, !containsOverclaim(eventText(event)), "blocker", "event_overclaim_text", { label, file: rel(root, chunkPath), text: eventText(event).slice(0, 240) });
  assertIssue(audit, hasEventRetrievalTrace(event, sourceById), "warning", "event_missing_retrieval_trace", { label, file: rel(root, chunkPath) });

  if (city.city_id === "nyc") {
    const area = compact(event.affected_area?.label);
    assertIssue(audit, !NYC_BOROUGH_CODES.has(area.toUpperCase()), "blocker", "nyc_event_area_is_raw_borough_code", { label, area, file: rel(root, chunkPath) });
    if (sourceIds.includes("enfh-gkve") && parksBoroughById) {
      const expected = parksBoroughById.get(sourceRecordId(event));
      assertIssue(audit, !expected || area === expected, "blocker", "nyc_parks_borough_label_mismatch", {
        label,
        area,
        expected,
        source_record_id: sourceRecordId(event),
        file: rel(root, chunkPath),
      });
    }
  }

  for (const sourceId of sourceIds) {
    assertIssue(audit, sourceById.has(sourceId), "blocker", "event_unknown_source_id", { label, source_id: sourceId, file: rel(root, chunkPath) });
  }
  for (const evidence of evidenceItems) {
    assertIssue(audit, EVIDENCE_KINDS.has(evidence?.kind), "blocker", "event_bad_evidence_kind", { label, evidence_kind: evidence?.kind, file: rel(root, chunkPath) });
    assertIssue(audit, sourceIds.includes(evidence?.source_id), "blocker", "event_evidence_source_not_listed", { label, evidence_source_id: evidence?.source_id, file: rel(root, chunkPath) });
    assertIssue(audit, Boolean(evidence?.url || evidence?.file_path || evidence?.record_id), "blocker", "event_evidence_missing_pointer", { label, evidence_source_id: evidence?.source_id, file: rel(root, chunkPath) });
  }
}

async function auditCity(audit, args, indexCity, parksBoroughById) {
  const atlasRoot = resolve(args.root, args.atlasDir);
  const cityDir = path.join(atlasRoot, "cities", indexCity.city_id);
  const cityPath = path.join(cityDir, "city.json");
  const sourcesPath = path.join(cityDir, "sources.json");
  const eventsIndexPath = path.join(cityDir, "events.json");
  const city = readJson(cityPath);
  const sourcesPayload = readJson(sourcesPath);
  const eventsIndex = readJson(eventsIndexPath);
  const sourceById = validateSources(audit, indexCity.city_id, sourcesPayload, rel(args.root, sourcesPath));
  validateLensYearCoverage(audit, args.root, indexCity.city_id, cityDir);

  const cityStats = {
    city_id: indexCity.city_id,
    event_count: 0,
    source_count: (sourcesPayload.sources || []).length,
    year_count: (eventsIndex.chunks || []).length,
    first_year: null,
    last_year: null,
  };
  const eventIdSet = new Set();
  for (const chunk of eventsIndex.chunks || []) {
    const chunkPath = resolve(args.root, chunk.json_path);
    const geojsonPath = resolve(args.root, chunk.geojson_path);
    assertIssue(audit, fs.existsSync(chunkPath), "blocker", "event_chunk_missing", { city_id: indexCity.city_id, path: chunk.json_path });
    assertIssue(audit, fs.existsSync(geojsonPath), "blocker", "event_geojson_chunk_missing", { city_id: indexCity.city_id, path: chunk.geojson_path });
    if (!fs.existsSync(chunkPath)) continue;
    const payload = readJson(chunkPath);
    const events = payload.events || [];
    assertIssue(audit, payload.year === chunk.year, "blocker", "event_chunk_year_mismatch", { city_id: indexCity.city_id, path: chunk.json_path, payload_year: payload.year, chunk_year: chunk.year });
    assertIssue(audit, payload.event_count === chunk.event_count && events.length === chunk.event_count, "blocker", "event_chunk_count_mismatch", { city_id: indexCity.city_id, path: chunk.json_path, payload_count: payload.event_count, chunk_count: chunk.event_count, actual_count: events.length });
    cityStats.event_count += events.length;
    cityStats.first_year = cityStats.first_year === null ? chunk.year : Math.min(cityStats.first_year, chunk.year);
    cityStats.last_year = cityStats.last_year === null ? chunk.year : Math.max(cityStats.last_year, chunk.year);
    for (const event of events) {
      validateEvent(audit, args.root, city, sourceById, event, chunkPath, chunk.year, eventIdSet, parksBoroughById);
    }
    if (fs.existsSync(geojsonPath)) {
      const geojson = readJson(geojsonPath);
      assertIssue(audit, geojson.type === "FeatureCollection", "blocker", "event_geojson_not_feature_collection", { city_id: indexCity.city_id, path: chunk.geojson_path });
      const expectedMapFeatureCount = Number.isInteger(chunk.map_feature_count)
        ? chunk.map_feature_count
        : Number.isInteger(payload.map_feature_count)
          ? payload.map_feature_count
          : events.filter((event) => event.geometry).length;
      const geojsonMapFeatureCount = Object.prototype.hasOwnProperty.call(geojson, "map_feature_count")
        ? geojson.map_feature_count
        : geojson.features.length;
      assertIssue(audit, Array.isArray(geojson.features) && geojson.features.length === expectedMapFeatureCount, "blocker", "event_geojson_feature_count_mismatch", { city_id: indexCity.city_id, path: chunk.geojson_path, event_count: events.length, map_feature_count: expectedMapFeatureCount, feature_count: geojson.features?.length });
      assertIssue(audit, Number(geojsonMapFeatureCount) === expectedMapFeatureCount, "blocker", "event_geojson_map_feature_count_mismatch", { city_id: indexCity.city_id, path: chunk.geojson_path, map_feature_count: expectedMapFeatureCount, geojson_map_feature_count: geojson.map_feature_count });
      for (const feature of geojson.features || []) {
        assertIssue(audit, geometryIsValid(feature.geometry), "blocker", "event_geojson_invalid_feature_geometry", { city_id: indexCity.city_id, path: chunk.geojson_path, id: feature.id || feature.properties?.event_id });
        const event = events.find((item) => item.event_id === (feature.id || feature.properties?.event_id));
        const mapWithheldSourceIds = eventSourceIds(event || {})
          .filter((sourceId) => sourceWithholdsMapGeometry(sourceById.get(sourceId)));
        assertIssue(audit, mapWithheldSourceIds.length === 0, "blocker", "event_geojson_exposes_withheld_geometry", { city_id: indexCity.city_id, path: chunk.geojson_path, id: feature.id || feature.properties?.event_id, source_ids: mapWithheldSourceIds });
      }
    }
  }
  assertIssue(audit, cityStats.event_count === eventsIndex.event_count, "blocker", "events_index_count_mismatch", { city_id: indexCity.city_id, counted: cityStats.event_count, indexed: eventsIndex.event_count });
  assertIssue(audit, cityStats.event_count === indexCity.event_count, "blocker", "atlas_index_count_mismatch", { city_id: indexCity.city_id, counted: cityStats.event_count, indexed: indexCity.event_count });
  audit.cities.push(cityStats);
}

function scanLfsPointers(audit, args) {
  const atlasRoot = resolve(args.root, args.atlasDir);
  for (const filePath of walkFiles(atlasRoot, [".json", ".geojson"])) {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 160);
    if (head.includes("version https://git-lfs.github.com/spec/v1")) {
      addIssue(audit, "blocker", "git_lfs_pointer_in_atlas_artifact", { file: rel(args.root, filePath) });
    }
  }
}

function printSummary(audit) {
  const buckets = Object.values(audit.issue_counts)
    .sort((a, b) => {
      const order = { blocker: 0, warning: 1 };
      return order[a.severity] - order[b.severity] || b.count - a.count || a.code.localeCompare(b.code);
    });
  console.log(JSON.stringify({
    artifact: "city_atlas_full_audit",
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    cities: audit.cities,
    issue_summary: buckets.map(({ severity, code, count }) => ({ severity, code, count })),
  }, null, 2));
  if (!buckets.length) {
    console.log("Full atlas audit OK: every advertised year chunk, event, source, GeoJSON chunk, lens-year row, and provenance reference passed the audit checks.");
    return;
  }
  console.error("\nFull atlas audit findings:");
  for (const bucket of buckets) {
    console.error(`- [${bucket.severity}] ${bucket.code}: ${bucket.count}`);
    for (const sample of bucket.samples) {
      console.error(`  sample: ${JSON.stringify(sample)}`);
    }
  }
}

async function run(args) {
  const audit = { maxSamples: args.maxSamples, cities: [], issue_counts: {} };
  const atlasRoot = resolve(args.root, args.atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  const index = readJson(indexPath);
  scanLfsPointers(audit, args);
  let parksBoroughById = null;
  if (args.liveNycParks) {
    try {
      parksBoroughById = await fetchNycParksBoroughs();
    } catch (error) {
      addIssue(audit, "warning", "nyc_parks_live_borough_check_unavailable", { message: error.message });
    }
  }
  for (const city of index.cities || []) {
    await auditCity(audit, args, city, parksBoroughById);
  }
  printSummary(audit);
  const hasBlockers = Object.values(audit.issue_counts).some((bucket) => bucket.severity === "blocker" && bucket.count > 0);
  if (hasBlockers) process.exit(1);
}

if (require.main === module) {
  run(parseArgs(process.argv)).catch((error) => {
    console.error(`audit:atlas failed: ${error.stack || error.message}`);
    process.exit(1);
  });
}

module.exports = {
  coordinatesAreValid,
  coordinatesInBounds,
  eventText,
  geometryCoordinates,
  geometryIsValid,
  hasEventRetrievalTrace,
  nycBoroughName,
};
