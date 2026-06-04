const fs = require("fs");
const path = require("path");
const {
  eventWithholdsMapGeometry,
  licenseNeedsReview,
  sourceHasMinimumLicense,
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");

const CONFIDENCE_VALUES = new Set(["documented", "corroborated", "inferred", "disputed"]);
const RELIABILITY_VALUES = new Set(["strong", "usable_with_caveats", "risky", "reject"]);
const AVAILABILITY_VALUES = new Set(["ready", "partial_local", "planned", "adapter_placeholder", "blocked"]);
const EVIDENCE_KINDS = new Set(["source_url", "local_file", "changeset", "source_record"]);
const REQUIRED_OVERLAY_ARTIFACTS = ["lens_overlays", "lens_detail_template", "transport_roads_base", "transport_roads_template", "utility_network"];
const BELFAST_REQUIRED_OVERLAY_ARTIFACTS = ["detail_layers", ...REQUIRED_OVERLAY_ARTIFACTS];
const UTILITY_NETWORK_TYPES = new Set(["water", "electricity", "telecoms", "gas", "drainage", "district_energy"]);
const UTILITY_NETWORK_GEOMETRIES = new Set(["asset", "line", "area"]);
const GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);
const LENS_DETAIL_SITE_LAYERS = new Set(["planning_cell", "civic_coverage_cell", "economy_activity_cell", "economy_frontage", "civic_facility", "utility_trace", "utility_asset"]);
const LENS_DETAIL_BAD_SOURCE_PATTERN = /\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/i;
const LENS_DETAIL_BAD_PRECISION_PATTERN = /\bborough aggregate\b|\baggregate,\s*not\b|\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b|^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b|^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b|^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b|^(multiple sites|multi[-\s]?site|programme approximate)\b/i;
const REQUIRED_LENS_DETAIL_EVENT_IDS = {
  belfast: {
    2022: ["bfs_arch_aster_house_student_accommodation_completion_2022"],
  },
  london: {
    2020: ["lon_arch_poplar_works_opening_2020"],
    2021: ["lon_arch_one_park_drive_residential_opening_2021"],
  },
  nyc: {
    2019: ["nyc_arch_35_hudson_yards_completion_2019"],
  },
};

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

function positionIsValid(value) {
  return Array.isArray(value)
    && value.length === 2
    && Number.isFinite(value[0])
    && Number.isFinite(value[1])
    && value[0] >= -180
    && value[0] <= 180
    && value[1] >= -90
    && value[1] <= 90;
}

function lineStringIsValid(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(positionIsValid);
}

function linearRingIsValid(value) {
  if (!Array.isArray(value) || value.length < 4 || !value.every(positionIsValid)) return false;
  const first = value[0];
  const last = value[value.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

function polygonIsValid(value) {
  return Array.isArray(value) && value.length > 0 && value.every(linearRingIsValid);
}

function geometryIsValid(geometry) {
  if (!geometry || typeof geometry !== "object") return false;
  if (!GEOMETRY_TYPES.has(geometry.type)) return false;
  if (geometry.type === "Point") return positionIsValid(geometry.coordinates);
  if (geometry.type === "MultiPoint") return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(positionIsValid);
  if (geometry.type === "LineString") return lineStringIsValid(geometry.coordinates);
  if (geometry.type === "MultiLineString") return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(lineStringIsValid);
  if (geometry.type === "Polygon") return polygonIsValid(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.every(polygonIsValid);
  if (geometry.type === "GeometryCollection") {
    return Array.isArray(geometry.geometries) && geometry.geometries.length > 0 && geometry.geometries.every(geometryIsValid);
  }
  return false;
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

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function validMonth(year, month) {
  return Number.isInteger(year) && Number.isInteger(month) && year >= 1700 && month >= 1 && month <= 12;
}

function validDay(year, month, day) {
  if (!validMonth(year, month) || !Number.isInteger(day) || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function effectiveDateIsValid(value) {
  const text = String(value || "").trim();
  let match = text.match(/^(\d{4})$/);
  if (match) return Number(match[1]) >= 1700;
  match = text.match(/^(\d{4})-(\d{2})$/);
  if (match) return validMonth(Number(match[1]), Number(match[2]));
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return validDay(Number(match[1]), Number(match[2]), Number(match[3]));
  return false;
}

function effectiveDateSortKey(value) {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function sourceRecordSignature(event) {
  const provenance = event.provenance || {};
  const recordId = compactText(provenance.source_record_id || provenance.planning_application_id || provenance.legacy_source_id);
  if (!recordId) return null;
  const sourceIds = (event.source_ids || []).map(String).filter(Boolean).sort();
  if (!sourceIds.length || sourceIds.includes(recordId)) return null;
  const title = compactText(event.title).toLowerCase();
  return `${sourceIds.join(",")}\u0000${recordId}\u0000${event.effective_date || ""}\u0000${event.category || ""}\u0000${title}`;
}

function hasSourceAccessTrace(source) {
  return Boolean(source.accessed_at || source.retrieved_at || source.registry_reviewed_at);
}

function hasEventAccessTrace(event) {
  const provenance = event.provenance || {};
  return Boolean(
    provenance.source_retrieved_at
      || provenance.source_registry_reviewed_at
      || (event.evidence || []).some((item) => item.accessed_at),
  );
}

function hasOsmMappedVisibilityCaveat(event) {
  const text = [
    event.source_date_field,
    event.provenance?.source_date_field,
    event.provenance?.geometry_precision,
    event.explanation,
    ...(event.caveats || []),
  ].join(" ");
  return /OSM/i.test(text) && /mapped.visibility|edit timestamp|mapping activity|not (a )?(confirmed )?(real-world )?(construction|opening) date/i.test(text);
}

function isPlaceholderLicence(source) {
  return /requires source-level review|verify before redistribution|terms vary|dataset-specific/i.test(String(source.licence || ""));
}

function metadataHasMethod(meta) {
  return Boolean(meta && (meta.method || meta.source || meta.road_source || (Array.isArray(meta.source_paths) && meta.source_paths.length > 0)));
}

function metadataHasLimitations(meta) {
  return Boolean(meta && (meta.coverage_note || meta.caveat || (Array.isArray(meta.caveats) && meta.caveats.length > 0)));
}

function validateGeoJsonArtifact(failures, root, artifactPath, label, expectedCityId = null) {
  const filePath = resolve(root, artifactPath);
  assert(failures, fs.existsSync(filePath), `${label} missing generated artifact ${artifactPath}`);
  if (!fs.existsSync(filePath)) return null;
  const payload = readJson(filePath);
  assert(failures, payload.type === "FeatureCollection", `${label} must be a FeatureCollection`);
  assert(failures, Array.isArray(payload.features), `${label} missing features array`);
  const metadata = payload.metadata || {};
  if (expectedCityId) assert(failures, metadata.city_id === expectedCityId, `${label} metadata.city_id must be ${expectedCityId}`);
  assert(failures, metadataHasMethod(metadata), `${label} missing source/method metadata`);
  assert(failures, metadataHasLimitations(metadata), `${label} missing coverage/caveat metadata`);
  for (const [index, feature] of (payload.features || []).entries()) {
    assert(failures, geometryIsValid(feature.geometry), `${label} has invalid feature geometry at index ${index}`);
  }
  return payload;
}

function validateUtilityNetworkArtifact(failures, label, payload) {
  const caveatText = [
    payload.metadata?.caveat,
    ...(payload.metadata?.caveats || []),
  ].filter(Boolean).join(" ");
  assert(
    failures,
    /not (?:a )?(?:measured )?utility capacity|does not contain measured utility capacity|no capacity/i.test(caveatText)
      && /service availability|service-availability/i.test(caveatText),
    `${label} metadata must caveat capacity and service availability claims`,
  );
  assert(failures, (payload.features || []).length > 0, `${label} must include citywide utility network context features`);
  for (const [index, feature] of (payload.features || []).entries()) {
    const props = feature.properties || {};
    const featureLabel = `${label} feature ${props.id || index}`;
    assert(failures, props.layer === "utility_network", `${featureLabel} must use layer=utility_network`);
    assert(failures, props.category === "utilities", `${featureLabel} must use category=utilities`);
    assert(failures, UTILITY_NETWORK_TYPES.has(props.utility_type), `${featureLabel} has unsupported utility_type ${props.utility_type || "<missing>"}`);
    assert(failures, UTILITY_NETWORK_GEOMETRIES.has(props.network_geometry), `${featureLabel} has unsupported network_geometry ${props.network_geometry || "<missing>"}`);
    for (const field of ["source_id", "source_registry_id", "source_object_id", "source_name", "publisher", "source_url", "license", "accessed_at", "transformation_method", "geometry_source", "original_geometry_type", "context_year", "confidence", "caveat"]) {
      assert(failures, props[field] !== undefined && String(props[field]).trim() !== "", `${featureLabel} missing ${field}`);
    }
    assert(failures, props.source_registry_id === "osm-overpass", `${featureLabel} must retain source_registry_id=osm-overpass`);
    assert(failures, /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+/.test(String(props.source_url || "")), `${featureLabel} source_url must point to the OSM object`);
    assert(failures, /ODbL/i.test(String(props.license || "")), `${featureLabel} must retain ODbL license`);
    assert(failures, props.confidence === "inferred", `${featureLabel} must be confidence=inferred for current mapped context`);
    assert(
      failures,
      /not .*capacity|capacity measurement/i.test(String(props.caveat || ""))
        && /service[-\s]?availability/i.test(String(props.caveat || "")),
      `${featureLabel} caveat must reject capacity/service availability claims`,
    );
  }
}

function lensDetailSiteText(feature) {
  const props = feature.properties || {};
  return {
    source: String(props.source_ids || ""),
    precision: [
    props.geometry_precision,
    props.geometry_precision_mix,
    ].filter(Boolean).join(" "),
  };
}

function validateLensDetailSemantics(failures, label, features) {
  for (const feature of features || []) {
    const layer = feature.properties?.layer;
    if (!LENS_DETAIL_SITE_LAYERS.has(layer)) continue;
    if (feature.properties?.coverage_status === "no_same_category_records") {
      assert(failures, false, `${label} contains generated filler geometry in ${layer}: ${feature.properties?.id || "<unknown>"}`);
      continue;
    }
    if (feature.properties?.evidence_role === "context_not_year_specific_change_evidence") {
      assert(failures, false, `${label} contains context-only lens evidence in ${layer}: ${feature.properties?.id || "<unknown>"}`);
      continue;
    }
    const siteText = lensDetailSiteText(feature);
    assert(
      failures,
      !LENS_DETAIL_BAD_SOURCE_PATTERN.test(siteText.source) && !LENS_DETAIL_BAD_PRECISION_PATTERN.test(siteText.precision),
      `${label} contains aggregate/statistical/non-site record in ${layer}: ${feature.properties?.id || feature.properties?.event_ids_all || feature.properties?.event_ids || "<unknown>"}`,
    );
  }
}

function validateRequiredLensDetailEvents(failures, label, payload, requiredIds) {
  if (!requiredIds?.length) return;
  const emittedIds = new Set();
  for (const feature of payload.features || []) {
    for (const field of ["event_ids_all", "event_ids"]) {
      const ids = String(feature.properties?.[field] || "").split(",").map((item) => item.trim()).filter(Boolean);
      ids.forEach((id) => emittedIds.add(id));
    }
  }
  for (const eventId of requiredIds) {
    assert(failures, emittedIds.has(eventId), `${label} must preserve source-backed approximate site event ${eventId} in derived lens geometry`);
  }
}

function eventHasCompatibleSources(event, sourceById) {
  const ids = Array.isArray(event?.source_ids) ? event.source_ids : [];
  return ids.length > 0
    && ids.every((sourceId) => {
      const source = sourceById.get(sourceId);
      return sourceHasMinimumLicense(source) && !licenseNeedsReview(source);
    });
}

function compatibleRequiredLensDetailEventIds(root, eventsIndex, yearText, requiredIds, sourceById) {
  if (!requiredIds?.length) return [];
  const targetYear = Number(yearText);
  const chunk = (eventsIndex.chunks || []).find((item) => Number(item.year) === targetYear);
  if (!chunk?.json_path) return requiredIds;
  const payload = readJson(resolve(root, chunk.json_path));
  const eventById = new Map((payload.events || []).map((event) => [event.event_id, event]));
  return requiredIds.filter((eventId) => {
    const event = eventById.get(eventId);
    return !event || eventHasCompatibleSources(event, sourceById);
  });
}

function validateOverlayArtifacts(failures, root, citySummary, artifactCity, eventsIndex, sourceById) {
  const cityId = citySummary.city_id;
  const summaryPaths = citySummary.artifact_paths || {};
  const cityPaths = artifactCity.artifact_paths || {};
  const required = cityId === "belfast" ? BELFAST_REQUIRED_OVERLAY_ARTIFACTS : REQUIRED_OVERLAY_ARTIFACTS;
  const advertisedKeys = required.filter((key) => summaryPaths[key] || cityPaths[key]);
  if (!advertisedKeys.length) return;
  for (const key of advertisedKeys) {
    assert(failures, Boolean(summaryPaths[key]), `Atlas index ${cityId} missing artifact_paths.${key}`);
    assert(failures, Boolean(cityPaths[key]), `City artifact ${cityId} missing artifact_paths.${key}`);
    if (summaryPaths[key] && cityPaths[key]) {
      assert(failures, summaryPaths[key] === cityPaths[key], `${cityId} artifact_paths.${key} differs between index and city artifact`);
    }
  }
  for (const key of advertisedKeys.filter((item) => !["transport_roads_template", "lens_detail_template"].includes(item))) {
    const artifactPath = summaryPaths[key] || cityPaths[key];
    if (artifactPath) {
      const payload = validateGeoJsonArtifact(failures, root, artifactPath, `${cityId} ${key}`, cityId);
      if (key === "utility_network" && payload) validateUtilityNetworkArtifact(failures, `${cityId} ${key}`, payload);
    }
  }
  const template = summaryPaths.transport_roads_template || cityPaths.transport_roads_template;
  if (template) {
    const years = (eventsIndex.event_years || []).map(Number).filter(Number.isInteger);
    for (const year of years) {
      const artifactPath = template.replace("{year}", String(year));
      assert(failures, fs.existsSync(resolve(root, artifactPath)), `${cityId} missing transport road overlay for ${year}: ${artifactPath}`);
    }
    const sampleYears = [...new Set([years[0], years[Math.floor(years.length / 2)], years[years.length - 1]].filter(Number.isInteger))];
    for (const year of sampleYears) {
      validateGeoJsonArtifact(failures, root, template.replace("{year}", String(year)), `${cityId} transport_roads_${year}`, cityId);
    }
  }
  const lensTemplate = summaryPaths.lens_detail_template || cityPaths.lens_detail_template;
  if (lensTemplate) {
    assert(failures, lensTemplate.includes("{year}"), `${cityId} lens_detail_template must include {year}`);
    const years = (eventsIndex.event_years || []).map(Number).filter(Number.isInteger);
    for (const year of years) {
      const artifactPath = lensTemplate.replace("{year}", String(year));
      assert(failures, fs.existsSync(resolve(root, artifactPath)), `${cityId} missing lens detail overlay for ${year}: ${artifactPath}`);
    }
    const sampleYears = [...new Set([years[0], years[Math.floor(years.length / 2)], years[years.length - 1]].filter(Number.isInteger))];
    for (const year of sampleYears) {
      const payload = validateGeoJsonArtifact(failures, root, lensTemplate.replace("{year}", String(year)), `${cityId} lens_detail_${year}`, cityId);
      if (!payload) continue;
      const layers = new Set((payload.features || []).map((feature) => feature.properties?.layer).filter(Boolean));
      assert(
        failures,
        ["planning_cell", "civic_coverage_cell", "economy_activity_cell", "economy_frontage", "civic_facility", "utility_trace", "utility_asset"].some((layer) => layers.has(layer)) || (payload.features || []).length === 0,
        `${cityId} lens_detail_${year} must expose recognized lens-detail feature layers or be honestly empty`,
      );
      assert(
        failures,
        /evidence grids/i.test((payload.metadata?.caveats || []).join(" ")),
        `${cityId} lens_detail_${year} must caveat derived evidence grids`,
      );
      assert(
        failures,
        /excluded from site-like lens geometry/i.test((payload.metadata?.caveats || []).join(" ")),
        `${cityId} lens_detail_${year} must disclose aggregate/non-site exclusions`,
      );
      validateLensDetailSemantics(failures, `${cityId} lens_detail_${year}`, payload.features || []);
    }
    const requiredByYear = REQUIRED_LENS_DETAIL_EVENT_IDS[cityId] || {};
    for (const [yearText, requiredIds] of Object.entries(requiredByYear)) {
      const payload = validateGeoJsonArtifact(failures, root, lensTemplate.replace("{year}", yearText), `${cityId} lens_detail_${yearText}`, cityId);
      const compatibleRequiredIds = compatibleRequiredLensDetailEventIds(root, eventsIndex, yearText, requiredIds, sourceById);
      if (payload) validateRequiredLensDetailEvents(failures, `${cityId} lens_detail_${yearText}`, payload, compatibleRequiredIds);
    }
  }
}

function validateEvent(failures, event, city, sourceById, chunkPath) {
  const prefix = `${rel(process.cwd(), chunkPath)}:${event.event_id || "<missing event_id>"}`;
  assert(failures, event.schema_version === "1.0.0", `${prefix} has invalid schema_version`);
  assert(failures, event.city_id === city.city_id, `${prefix} city_id does not match ${city.city_id}`);
  assert(failures, Boolean(event.event_id), `${prefix} missing event_id`);
  assert(failures, Boolean(event.title), `${prefix} missing title`);
  const shortDescription = compactText(event.short_description);
  assert(failures, Boolean(shortDescription), `${prefix} missing short_description`);
  assert(failures, shortDescription.length >= 12, `${prefix} short_description is too short`);
  assert(failures, shortDescription.length <= 220, `${prefix} short_description is longer than 220 characters`);
  assert(failures, Number.isInteger(event.year), `${prefix} missing integer year`);
  assert(failures, effectiveDateIsValid(event.effective_date), `${prefix} has invalid effective_date ${event.effective_date || "<missing>"}`);
  const effectiveYear = Number(String(event.effective_date || "").slice(0, 4));
  if (Number.isInteger(effectiveYear) && event.date_precision !== "range") {
    assert(failures, effectiveYear === event.year, `${prefix} effective_date year ${effectiveYear} does not match event year ${event.year}`);
  }
  if (event.effective_date_range) {
    assert(failures, event.date_precision === "range", `${prefix} has effective_date_range but date_precision is ${event.date_precision}`);
    assert(failures, Boolean(event.effective_date_range.start && event.effective_date_range.end), `${prefix} effective_date_range must include start and end`);
    assert(failures, effectiveDateIsValid(event.effective_date_range.start), `${prefix} has invalid effective_date_range.start ${event.effective_date_range.start || "<missing>"}`);
    assert(failures, effectiveDateIsValid(event.effective_date_range.end), `${prefix} has invalid effective_date_range.end ${event.effective_date_range.end || "<missing>"}`);
    if (effectiveDateIsValid(event.effective_date_range.start) && effectiveDateIsValid(event.effective_date_range.end)) {
      assert(
        failures,
        effectiveDateSortKey(event.effective_date_range.start) <= effectiveDateSortKey(event.effective_date_range.end),
        `${prefix} effective_date_range start must be on or before end`,
      );
    }
  }
  if (event.date_precision === "range") {
    assert(failures, Boolean(event.effective_date_range), `${prefix} has range precision without effective_date_range`);
  }
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
  if (event.geometry) assert(failures, geometryIsValid(event.geometry), `${prefix} has invalid geometry`);
  assert(failures, Array.isArray(event.affected_signals), `${prefix} missing affected_signals array`);
  assert(failures, Boolean(event.explanation), `${prefix} missing explanation`);
  assert(failures, Array.isArray(event.caveats) && event.caveats.length > 0, `${prefix} missing caveats`);
  assert(failures, !isSourceLayerMarker(event), `${prefix} is a source-layer marker, not a real event`);
  assert(failures, hasProvenanceTrace(event), `${prefix} missing event-level provenance trace`);
  assert(failures, hasEventAccessTrace(event), `${prefix} missing event source retrieval or registry review timestamp`);
  assert(failures, Boolean(event.source_date_field || event.provenance?.source_date_field), `${prefix} missing source_date_field for effective date interpretation`);
  assert(failures, Boolean(event.provenance?.geometry_source), `${prefix} missing provenance.geometry_source for spatial interpretation`);
  assert(failures, Boolean(event.provenance?.geometry_precision), `${prefix} missing provenance.geometry_precision for spatial precision/caveats`);
  assert(failures, !containsOverclaim(event.title), `${prefix} title contains overclaiming language`);
  assert(failures, !containsOverclaim(event.short_description), `${prefix} short_description contains overclaiming language`);
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

  const mapWithheldSourceIds = (event.source_ids || [])
    .filter((sourceId) => sourceWithholdsMapGeometry(sourceById.get(sourceId)));
  if (mapWithheldSourceIds.length) {
    assert(failures, !event.geometry, `${prefix} uses map-withheld source geometry from ${mapWithheldSourceIds.join(", ")}`);
    assert(failures, event.geometry_status === "withheld_rights_review" || event.provenance?.geometry_status === "withheld_rights_review", `${prefix} missing withheld geometry status`);
    assert(failures, /withheld|rights/i.test(`${event.map_geometry_withheld_reason || ""} ${(event.caveats || []).join(" ")}`), `${prefix} missing withheld geometry caveat`);
  }
  if (eventWithholdsMapGeometry(event)) {
    assert(failures, !event.geometry, `${prefix} exposes event-level map-withheld geometry`);
    assert(failures, /^withheld_/.test(String(event.geometry_status || event.provenance?.geometry_status || "")), `${prefix} missing event-level withheld geometry status`);
    assert(failures, /withheld|reference|aggregate|evidence/i.test(`${event.map_geometry_withheld_reason || ""} ${(event.caveats || []).join(" ")}`), `${prefix} missing event-level withheld geometry caveat`);
  }

  for (const evidence of event.evidence || []) {
    assert(failures, event.source_ids.includes(evidence.source_id), `${prefix} evidence source ${evidence.source_id} not listed in source_ids`);
    assert(failures, EVIDENCE_KINDS.has(evidence.kind), `${prefix} evidence ${evidence.label || evidence.kind} has invalid kind ${evidence.kind}`);
    assert(failures, hasEvidencePointer(evidence), `${prefix} evidence ${evidence.label || evidence.kind} lacks url/file/record pointer`);
  }

  if (event.provenance?.osm_timestamp) {
    assert(failures, hasOsmMappedVisibilityCaveat(event), `${prefix} has OSM timestamp without mapped-visibility caveat`);
    if (event.confidence === "documented" || event.confidence === "corroborated") {
      assert(failures, !/osmTimestamp/i.test(String(event.source_date_field || event.provenance?.source_date_field || "")), `${prefix} uses OSM edit timestamp as documented/corroborated event date`);
    }
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
    validateOverlayArtifacts(failures, root, citySummary, artifactCity, eventsIndex, effectiveSourceById);
    let countedEvents = 0;
    const seenEventIds = new Set();
    const seenSourceRecords = new Map();
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
        assert(failures, !seenEventIds.has(event.event_id), `Duplicate event id in ${city.city_id}: ${event.event_id}`);
        seenEventIds.add(event.event_id);
        const signature = sourceRecordSignature(event);
        if (signature) {
          const existing = seenSourceRecords.get(signature);
          assert(
            failures,
            !existing,
            `Duplicate source-record event in ${city.city_id}: ${event.event_id} duplicates ${existing}`,
          );
          seenSourceRecords.set(signature, event.event_id);
        }
        validateEvent(failures, event, validationCity, effectiveSourceById, chunkPath);
      }
      if (fs.existsSync(geojsonPath)) {
        const geojson = readJson(geojsonPath);
        assert(failures, geojson.type === "FeatureCollection", `${chunk.geojson_path} is not a FeatureCollection`);
        assert(failures, Array.isArray(geojson.features), `${chunk.geojson_path} missing features`);
        const expectedMapFeatureCount = Number.isInteger(chunk.map_feature_count)
          ? chunk.map_feature_count
          : Number.isInteger(payload.map_feature_count)
            ? payload.map_feature_count
            : payload.events.filter((event) => event.geometry).length;
        const geojsonMapFeatureCount = Object.prototype.hasOwnProperty.call(geojson, "map_feature_count")
          ? geojson.map_feature_count
          : geojson.features.length;
        assert(failures, geojson.features.length === expectedMapFeatureCount, `${chunk.geojson_path} feature count mismatch`);
        assert(failures, Number(geojsonMapFeatureCount) === expectedMapFeatureCount, `${chunk.geojson_path} map_feature_count mismatch`);
        assert(failures, Number(chunk.withheld_geometry_event_count || 0) === Number(payload.withheld_geometry_event_count || 0), `${chunk.geojson_path} withheld geometry count differs between index and event JSON`);
        for (const feature of geojson.features || []) {
          assert(failures, geometryIsValid(feature.geometry), `${chunk.geojson_path} has invalid feature geometry`);
          const event = (payload.events || []).find((item) => item.event_id === (feature.id || feature.properties?.event_id));
          const mapWithheldSourceIds = (event?.source_ids || [])
            .filter((sourceId) => sourceWithholdsMapGeometry(effectiveSourceById.get(sourceId)));
          assert(failures, mapWithheldSourceIds.length === 0, `${chunk.geojson_path} exposes map-withheld source geometry for ${feature.id || feature.properties?.event_id}`);
          assert(failures, !eventWithholdsMapGeometry(event), `${chunk.geojson_path} exposes event-level map-withheld geometry for ${feature.id || feature.properties?.event_id}`);
        }
      }
    }
    assert(failures, countedEvents === eventsIndex.event_count, `${city.city_id} events index count mismatch`);
  }
  validateCoverageReport(root, atlasRoot, index, failures);
}

function validateCoverageReport(root, atlasRoot, index, failures) {
  const reportPath = resolve(root, index.coverage_report_path || path.join("web/data/city-atlas", "coverage-report.json"));
  assert(failures, fs.existsSync(reportPath), `Coverage report missing: ${rel(root, reportPath)}`);
  if (!fs.existsSync(reportPath)) return;
  const report = readJson(reportPath);
  assert(failures, report.artifact_kind === "city_atlas_coverage_report", "Coverage report has unexpected artifact_kind");
  assert(failures, Array.isArray(report.coverage_rows), "Coverage report missing coverage_rows");
  assert(failures, Array.isArray(report.cities), "Coverage report missing cities");
  const citySummaries = new Map((index.cities || []).map((city) => [city.city_id, city]));
  const seenRows = new Set();
  let eventTotal = 0;
  for (const city of report.cities || []) {
    const indexCity = citySummaries.get(city.city_id);
    assert(failures, Boolean(indexCity), `Coverage report has unknown city ${city.city_id}`);
    if (indexCity) {
      assert(failures, city.event_count === indexCity.event_count, `Coverage report count mismatch for ${city.city_id}`);
    }
    assert(failures, city.duplicate_event_id_count === 0, `Coverage report found duplicate event ids for ${city.city_id}`);
    assert(failures, Array.isArray(city.source_year_layer_rows), `Coverage report city ${city.city_id} missing source_year_layer_rows`);
    assert(failures, Array.isArray(city.sources), `Coverage report city ${city.city_id} missing source summaries`);
    assert(failures, city.target_coverage_gap === undefined, `Coverage report city ${city.city_id} must not use arbitrary target coverage gaps`);
    assert(failures, Array.isArray(city.gaps?.notes), `Coverage report city ${city.city_id} missing gaps notes`);
    eventTotal += Number(city.event_count || 0);
    for (const row of city.source_year_layer_rows || []) {
      assert(failures, row.city_id === city.city_id, `Coverage report row city mismatch for ${city.city_id}`);
      assert(failures, Boolean(row.source_id), `Coverage report row missing source_id for ${city.city_id}`);
      assert(failures, Number.isInteger(row.year), `Coverage report row missing integer year for ${city.city_id}`);
      assert(failures, Boolean(row.layer), `Coverage report row missing layer for ${city.city_id}`);
      assert(failures, Number.isInteger(row.event_count) && row.event_count > 0, `Coverage report row has invalid event_count for ${city.city_id}`);
      const key = `${row.city_id}\u0000${row.source_id}\u0000${row.year}\u0000${row.layer}`;
      assert(failures, !seenRows.has(key), `Duplicate coverage row for ${row.city_id}/${row.source_id}/${row.year}/${row.layer}`);
      seenRows.add(key);
    }
  }
  assert(failures, report.summary?.total_events === eventTotal, "Coverage report total event count mismatch");
  assert(failures, report.coverage_rows.length === seenRows.size, "Coverage report flattened row count mismatch");
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
