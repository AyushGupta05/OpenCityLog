const fs = require("fs");
const path = require("path");

const CONFIDENCE_VALUES = new Set(["documented", "corroborated", "inferred", "disputed"]);
const RELIABILITY_VALUES = new Set(["strong", "usable_with_caveats", "risky", "reject"]);
const AVAILABILITY_VALUES = new Set(["ready", "partial_local", "planned", "adapter_placeholder", "blocked"]);
const EVIDENCE_KINDS = new Set(["source_url", "local_file", "changeset", "source_record"]);
const GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    configDir: "config/cities",
    sourceRegistry: "config/source_registry.json",
    atlasDir: "web/data/city-atlas",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--config-dir") {
      args.configDir = next;
      index += 1;
    } else if (arg === "--source-registry") {
      args.sourceRegistry = next;
      index += 1;
    } else if (arg === "--atlas-dir") {
      args.atlasDir = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function rel(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function fail(failures, message) {
  failures.push(message);
}

function assert(failures, condition, message) {
  if (!condition) fail(failures, message);
}

function loadCityConfigs(root, configDir, failures) {
  const dir = resolve(root, configDir);
  if (!fs.existsSync(dir)) {
    fail(failures, `City config directory is missing: ${rel(root, dir)}`);
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}

function validateLonLat(failures, value, label) {
  assert(failures, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  assert(failures, value.length === 2, `${label} must have [lon, lat]`);
  if (value.length !== 2) return;
  const [lon, lat] = value;
  assert(failures, Number.isFinite(lon) && lon >= -180 && lon <= 180, `${label} longitude is invalid`);
  assert(failures, Number.isFinite(lat) && lat >= -90 && lat <= 90, `${label} latitude is invalid`);
}

function validateBbox(failures, bbox, label) {
  assert(failures, Array.isArray(bbox) && bbox.length === 4, `${label} must be [west, south, east, north]`);
  if (!Array.isArray(bbox) || bbox.length !== 4) return;
  const [west, south, east, north] = bbox;
  assert(failures, [west, south, east, north].every(Number.isFinite), `${label} values must be finite`);
  assert(failures, west < east, `${label} west must be less than east`);
  assert(failures, south < north, `${label} south must be less than north`);
  validateLonLat(failures, [west, south], `${label} south-west`);
  validateLonLat(failures, [east, north], `${label} north-east`);
}

function validateCityConfig(failures, city) {
  assert(failures, /^[a-z0-9][a-z0-9_-]*$/.test(city.city_id || ""), `City id is invalid: ${city.city_id}`);
  assert(failures, Boolean(city.display_name), `City ${city.city_id} is missing display_name`);
  validateBbox(failures, city.bounds, `City ${city.city_id} bounds`);
  validateLonLat(failures, city.default_center, `City ${city.city_id} default_center`);
  const years = city.available_years || {};
  assert(failures, Number.isInteger(years.schema_supported_start), `City ${city.city_id} missing supported start year`);
  assert(failures, Number.isInteger(years.schema_supported_end), `City ${city.city_id} missing supported end year`);
  assert(failures, years.schema_supported_start >= 1700, `City ${city.city_id} must support 1700 or later`);
  assert(
    failures,
    years.schema_supported_end >= years.schema_supported_start,
    `City ${city.city_id} has invalid supported year range`,
  );
  for (const family of city.source_families || []) {
    assert(failures, Boolean(family.family_id), `City ${city.city_id} has source family without id`);
    assert(failures, AVAILABILITY_VALUES.has(family.availability), `City ${city.city_id} has invalid availability ${family.availability}`);
    assert(failures, Array.isArray(family.source_ids), `City ${city.city_id} family ${family.family_id} missing source_ids`);
    assert(failures, Array.isArray(family.years), `City ${city.city_id} family ${family.family_id} missing years`);
    assert(failures, Boolean(family.notes), `City ${city.city_id} family ${family.family_id} missing notes`);
  }
}

function validateSourceRegistry(root, sourceRegistryPath, cityConfigs, failures) {
  const registry = readJson(resolve(root, sourceRegistryPath));
  const byId = new Map();
  for (const source of registry.sources || []) {
    assert(failures, /^[a-z0-9][a-z0-9_-]*$/.test(source.source_id || ""), `Source id is invalid: ${source.source_id}`);
    assert(failures, !byId.has(source.source_id), `Duplicate source id: ${source.source_id}`);
    byId.set(source.source_id, source);
    assert(failures, Boolean(source.provider), `Source ${source.source_id} missing provider`);
    assert(failures, Boolean(source.licence), `Source ${source.source_id} missing licence`);
    assert(failures, Boolean(source.licence_url), `Source ${source.source_id} missing licence_url`);
    assert(failures, Boolean(source.attribution_text), `Source ${source.source_id} missing attribution_text`);
    assert(failures, !containsOverclaim((source.caveats || []).join(" ")), `Source ${source.source_id} caveats contain overclaiming language`);
    assert(failures, RELIABILITY_VALUES.has(source.reliability), `Source ${source.source_id} has invalid reliability`);
    assert(failures, CONFIDENCE_VALUES.has(source.source_confidence), `Source ${source.source_id} has invalid source_confidence`);
    const years = source.coverage_years || {};
    assert(failures, Number.isInteger(years.start) && years.start >= 1700, `Source ${source.source_id} invalid coverage start`);
    assert(failures, Number.isInteger(years.end) && years.end >= years.start, `Source ${source.source_id} invalid coverage end`);
  }

  for (const city of cityConfigs) {
    for (const family of city.source_families || []) {
      for (const sourceId of family.source_ids || []) {
        const source = byId.get(sourceId);
        assert(failures, Boolean(source), `City ${city.city_id} references unknown source ${sourceId}`);
        if (source) {
          assert(
            failures,
            source.city_ids.includes("*") || source.city_ids.includes(city.city_id),
            `Source ${sourceId} is not applicable to city ${city.city_id}`,
          );
        }
      }
    }
  }
  return byId;
}

function coordinatesAreValid(value) {
  if (!Array.isArray(value)) return false;
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]) && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
  }
  return value.every(coordinatesAreValid);
}

function geometryIsValid(geometry) {
  if (geometry === null || geometry === undefined) return true;
  if (!geometry || typeof geometry !== "object") return false;
  if (!GEOMETRY_TYPES.has(geometry.type)) return false;
  if (geometry.type === "GeometryCollection") {
    return Array.isArray(geometry.geometries) && geometry.geometries.every(geometryIsValid);
  }
  return coordinatesAreValid(geometry.coordinates);
}

function hasEvidencePointer(item) {
  return Boolean(item && (item.url || item.file_path || item.record_id));
}

function containsOverclaim(text) {
  const value = String(text || "");
  return [
    /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b/i,
    /\bcaused?\b/i,
    /\bpredicts?\b/i,
    /\bprediction\b/i,
    /\bforecast(ed|s|ing)?\b/i,
    /\bsimulation result\b/i,
    /\bimpact score\b/i,
    /\bproof\s+(of|that)\b/i,
    /\bas\s+proof\b/i,
    /\bnot\s+proof\b/i,
    /\bproves?\s+that\b/i,
  ].some((pattern) => pattern.test(value));
}

function isSourceLayerMarker(event) {
  return /^Current data layer:/i.test(event.title || "")
    || event.record_kind === "source_layer"
    || (event.caveats || []).some((item) => /current-state source marker/i.test(String(item)));
}

function hasProvenanceTrace(event) {
  const provenance = event.provenance || {};
  return Boolean(
    provenance.transform
      && (
        provenance.source_url
        || provenance.source_record_id
        || provenance.source_dataset_id
        || provenance.osm_timestamp
        || provenance.osm_changeset
        || provenance.planning_application_id
        || provenance.legacy_source_id
        || provenance.source_basis
      ),
  );
}

function hasSourceAccessTrace(source) {
  return Boolean(source.accessed_at || source.retrieved_at || source.registry_reviewed_at);
}

function isPlaceholderLicence(source) {
  return /requires source-level review|verify before redistribution|terms vary|dataset-specific/i.test(String(source.licence || ""));
}

function validateEvent(failures, event, city, sourceById, chunkPath) {
  const prefix = `${rel(process.cwd(), chunkPath)}:${event.event_id || "<missing event_id>"}`;
  assert(failures, event.schema_version === "1.0.0", `${prefix} has invalid schema_version`);
  assert(failures, event.city_id === city.city_id, `${prefix} city_id does not match ${city.city_id}`);
  assert(failures, Boolean(event.event_id), `${prefix} missing event_id`);
  assert(failures, Boolean(event.title), `${prefix} missing title`);
  assert(failures, Number.isInteger(event.year), `${prefix} missing integer year`);
  const supported = city.available_years || {};
  assert(
    failures,
    event.year >= supported.schema_supported_start && event.year <= supported.schema_supported_end,
    `${prefix} year ${event.year} outside configured city coverage`,
  );
  assert(failures, Boolean(event.category), `${prefix} missing category`);
  assert(failures, Boolean(event.lens), `${prefix} missing lens`);
  assert(failures, CONFIDENCE_VALUES.has(event.confidence), `${prefix} invalid confidence ${event.confidence}`);
  assert(failures, Array.isArray(event.source_ids) && event.source_ids.length > 0, `${prefix} missing source_ids`);
  assert(failures, Array.isArray(event.evidence) && event.evidence.length > 0, `${prefix} missing evidence`);
  assert(failures, event.geometry || event.affected_area?.label, `${prefix} needs geometry or affected_area label`);
  assert(failures, geometryIsValid(event.geometry), `${prefix} has invalid geometry`);
  assert(failures, Array.isArray(event.affected_signals), `${prefix} missing affected_signals array`);
  assert(failures, Boolean(event.explanation), `${prefix} missing explanation`);
  assert(failures, Array.isArray(event.caveats) && event.caveats.length > 0, `${prefix} missing caveats`);
  assert(failures, !isSourceLayerMarker(event), `${prefix} is a source-layer marker, not a real event`);
  assert(failures, hasProvenanceTrace(event), `${prefix} missing event-level provenance trace`);
  assert(failures, Boolean(event.source_date_field || event.provenance?.source_date_field), `${prefix} missing source_date_field for effective date interpretation`);
  assert(failures, !containsOverclaim(event.title), `${prefix} title contains overclaiming language`);
  assert(failures, !containsOverclaim(event.explanation), `${prefix} explanation contains overclaiming language`);
  assert(failures, !containsOverclaim((event.caveats || []).join(" ")), `${prefix} caveats contain overclaiming language`);

  for (const sourceId of event.source_ids || []) {
    const source = sourceById.get(sourceId);
    assert(failures, Boolean(source), `${prefix} references unknown source ${sourceId}`);
    if (source) {
      const years = source.coverage_years || {};
      assert(failures, event.year >= years.start && event.year <= years.end, `${prefix} year ${event.year} outside source ${sourceId} coverage`);
      assert(failures, Boolean(source.attribution_text), `${prefix} source ${sourceId} missing attribution`);
    }
  }

  for (const evidence of event.evidence || []) {
    assert(failures, event.source_ids.includes(evidence.source_id), `${prefix} evidence source ${evidence.source_id} not listed in source_ids`);
    assert(failures, EVIDENCE_KINDS.has(evidence.kind), `${prefix} evidence ${evidence.label || evidence.kind} has invalid kind ${evidence.kind}`);
    assert(failures, hasEvidencePointer(evidence), `${prefix} evidence ${evidence.label || evidence.kind} lacks url/file/record pointer`);
  }

  for (const delta of event.impact_deltas || []) {
    assert(failures, delta.observed === true, `${prefix} has non-observed impact delta; generated proxy metrics are not allowed`);
  }
  if (event.traffic_metrics) {
    assert(failures, event.traffic_metrics.observed === true, `${prefix} has non-observed traffic metrics; generated proxy metrics are not allowed`);
  }
}

function validateAtlas(root, atlasDir, cityConfigs, sourceById, failures) {
  const atlasRoot = resolve(root, atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  assert(failures, fs.existsSync(indexPath), `Atlas index missing: ${rel(root, indexPath)}`);
  if (!fs.existsSync(indexPath)) return;
  const index = readJson(indexPath);
  assert(failures, Array.isArray(index.cities), "Atlas index cities must be an array");

  const citiesById = new Map(cityConfigs.map((city) => [city.city_id, city]));
  for (const citySummary of index.cities || []) {
    const city = citiesById.get(citySummary.city_id);
    assert(failures, Boolean(city), `Atlas has city not present in config: ${citySummary.city_id}`);
    if (!city) continue;

    const cityDir = path.join(atlasRoot, "cities", citySummary.city_id);
    for (const name of ["city.json", "sources.json", "events.json", "availability.json"]) {
      assert(failures, fs.existsSync(path.join(cityDir, name)), `Missing ${citySummary.city_id}/${name}`);
    }
    const artifactCity = fs.existsSync(path.join(cityDir, "city.json")) ? readJson(path.join(cityDir, "city.json")) : city;
    const validationCity = { ...city, ...artifactCity };
    const sourcesPayload = readJson(path.join(cityDir, "sources.json"));
    const effectiveSourceById = new Map(sourceById);
    for (const source of sourcesPayload.sources || []) {
      effectiveSourceById.set(source.source_id, source);
      assert(failures, Boolean(source.source_id), `City artifact ${citySummary.city_id} includes source without id`);
      assert(failures, Boolean(source.attribution_text), `City artifact source ${source.source_id} missing attribution_text`);
      assert(failures, !containsOverclaim((source.caveats || []).join(" ")), `City artifact source ${source.source_id} caveats contain overclaiming language`);
      assert(failures, Boolean(source.source_family), `City artifact source ${source.source_id} missing source_family`);
      assert(failures, Boolean(source.licence_url), `City artifact source ${source.source_id} missing licence_url`);
      assert(failures, hasSourceAccessTrace(source), `City artifact source ${source.source_id} missing access/retrieval/review timestamp`);
      if (isPlaceholderLicence(source)) {
        assert(
          failures,
          (source.caveats || []).some((item) => /licen[cs]e|terms|review/i.test(String(item))),
          `City artifact source ${source.source_id} uses review-required licence text without a licence caveat`,
        );
      }
      assert(failures, Boolean(source.update_frequency), `City artifact source ${source.source_id} missing update_frequency`);
      assert(failures, RELIABILITY_VALUES.has(source.reliability), `City artifact source ${source.source_id} has invalid reliability ${source.reliability}`);
      assert(failures, CONFIDENCE_VALUES.has(source.source_confidence), `City artifact source ${source.source_id} has invalid source_confidence ${source.source_confidence}`);
      assert(failures, Array.isArray(source.caveats) && source.caveats.length > 0, `City artifact source ${source.source_id} missing caveats`);
    }

    const availability = readJson(path.join(cityDir, "availability.json"));
    assert(failures, Array.isArray(availability.matrix), `Availability matrix missing for ${city.city_id}`);
    for (const row of availability.matrix || []) {
      assert(failures, Boolean(row.family_id), `Availability row missing family_id for ${city.city_id}`);
      assert(failures, Array.isArray(row.source_ids), `Availability row ${row.family_id} missing source_ids`);
      for (const sourceId of row.source_ids || []) {
        assert(failures, effectiveSourceById.has(sourceId), `Availability row ${row.family_id} references unknown source ${sourceId}`);
      }
    }

    const eventsIndex = readJson(path.join(cityDir, "events.json"));
    let countedEvents = 0;
    for (const chunk of eventsIndex.chunks || []) {
      const chunkPath = resolve(root, chunk.json_path);
      const geojsonPath = resolve(root, chunk.geojson_path);
      assert(failures, fs.existsSync(chunkPath), `Missing event chunk ${chunk.json_path}`);
      assert(failures, fs.existsSync(geojsonPath), `Missing GeoJSON chunk ${chunk.geojson_path}`);
      if (!fs.existsSync(chunkPath)) continue;
      const payload = readJson(chunkPath);
      assert(failures, payload.year === chunk.year, `Chunk ${chunk.json_path} year does not match index`);
      assert(failures, payload.event_count === chunk.event_count, `Chunk ${chunk.json_path} event count does not match index`);
      countedEvents += payload.events.length;
      for (const event of payload.events || []) {
        validateEvent(failures, event, validationCity, effectiveSourceById, chunkPath);
      }
      if (fs.existsSync(geojsonPath)) {
        const geojson = readJson(geojsonPath);
        assert(failures, geojson.type === "FeatureCollection", `${chunk.geojson_path} is not a FeatureCollection`);
        assert(failures, Array.isArray(geojson.features), `${chunk.geojson_path} missing features`);
        assert(failures, geojson.features.length === payload.events.length, `${chunk.geojson_path} feature count mismatch`);
        for (const feature of geojson.features || []) {
          assert(failures, geometryIsValid(feature.geometry), `${chunk.geojson_path} has invalid feature geometry`);
        }
      }
    }
    assert(failures, countedEvents === eventsIndex.event_count, `${city.city_id} events index count mismatch`);
  }
}

function verify(args) {
  const failures = [];
  const cityConfigs = loadCityConfigs(args.root, args.configDir, failures);
  const seenCities = new Set();
  for (const city of cityConfigs) {
    assert(failures, !seenCities.has(city.city_id), `Duplicate city id: ${city.city_id}`);
    seenCities.add(city.city_id);
    validateCityConfig(failures, city);
  }
  const sourceById = validateSourceRegistry(args.root, args.sourceRegistry, cityConfigs, failures);
  validateAtlas(args.root, args.atlasDir, cityConfigs, sourceById, failures);
  return failures;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const failures = verify(args);
    if (failures.length) {
      console.error("Data verification failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
    console.log("Data verification OK: city configs, sources, availability matrices, events, references, attribution, coverage, and geometries are valid.");
  } catch (error) {
    console.error(`verify:data failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  verify,
  geometryIsValid,
  parseArgs,
};
