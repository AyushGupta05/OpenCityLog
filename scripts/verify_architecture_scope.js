const fs = require("fs");
const path = require("path");
const { validateValue } = require("./validate_city_atlas_schema");

const TARGET_START = "2008-01-01";
const TARGET_END = "2026-05-20";
const REQUIRED_CITIES = new Set(["london", "nyc", "belfast"]);
const REQUIRED_INVENTORY_SOURCES = [
  "london-pld-applications",
  "london-datastore-ldd-permissions",
  "london-borough-planning-portals",
  "london-historic-england-nhle",
  "nyc-dob-permit-issuance",
  "nyc-dob-job-application-filings",
  "nyc-dob-now-job-application-filings",
  "nyc-dob-now-approved-permits",
  "nyc-dob-certificate-occupancy",
  "nyc-dob-now-certificate-occupancy",
  "nyc-lpc-permit-application-finder",
  "nyc-zap-project-data",
  "belfast-dfi-planning-statistics",
  "belfast-ni-planning-portal",
  "belfast-city-current-planning-applications",
  "belfast-city-committee-packs",
  "belfast-hed-buildings-database",
  "belfast-harni",
  "belfast-official-project-pages",
];
const METHODOLOGY_PATH = "docs/architecture_methodology.md";
const SOURCE_REGISTRY_MANIFEST_PATH = "manifests/architecture_source_registry.json";
const URL_SPOT_CHECK_MANIFEST_PATH = "manifests/architecture_url_spot_check.json";
const EVENT_URL_SAMPLE_PER_CITY = 6;
const CONFIDENCE_VALUES = new Set(["documented", "corroborated", "inferred", "disputed"]);
const URL_RESPONSE_CLASSES = new Set([
  "reachable",
  "access_controlled",
  "client_error",
  "server_error",
  "network_error",
]);
const EVENT_FIELDS = [
  "city_id",
  "event_id",
  "date",
  "date_precision",
  "bucket",
  "title",
  "summary",
  "observed_change",
  "source_ids",
  "source_url",
  "source_record_id",
  "source_retrieved_at",
  "source_date_field",
  "confidence",
  "longitude",
  "latitude",
  "geometry_source",
  "geometry_precision",
  "license_or_terms_note",
  "attribution",
  "limitations",
  "transformation_method",
];
const SOURCE_FIELDS = [
  "source_id",
  "city_ids",
  "title",
  "publisher",
  "bucket",
  "access_url",
  "licence",
  "licence_url",
  "coverage_years",
  "time_coverage",
  "spatial_granularity",
  "temporal_granularity",
  "update_frequency",
  "retrieved_at",
  "limitations",
];

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    inventory: "config/architecture_source_inventory.json",
    inventorySchema: "schemas/architecture_source_inventory.schema.json",
    milestones: "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--inventory") {
      args.inventory = next;
      index += 1;
    } else if (arg === "--inventory-schema") {
      args.inventorySchema = next;
      index += 1;
    } else if (arg === "--milestones") {
      args.milestones = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
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
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return compactText(value).length > 0;
}

function fail(failures, message) {
  failures.push(message);
}

function assert(failures, condition, message) {
  if (!condition) fail(failures, message);
}

function containsOverclaim(value) {
  const text = compactText(value);
  return [
    /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b/i,
    /\bcaused?\b/i,
    /\bpredicts?\b/i,
    /\bprediction\b/i,
    /\bforecast(ed|s|ing)?\b/i,
    /\bsimulates?\b/i,
    /\bsimulation\b/i,
    /\bimpact score\b/i,
    /\bproves?\s+(that|the|a|an)?\b/i,
  ].some((pattern) => pattern.test(text));
}

function firstIsoDate(value) {
  const text = compactText(value);
  const match = text.match(/(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) return null;
  const [, year, month = "01", day = "01"] = match;
  return `${year}-${month}-${day}`;
}

function validateUrlLike(failures, value, label) {
  if (value === null || value === undefined || value === "") return;
  assert(
    failures,
    /^https?:\/\//.test(String(value)) || /^[a-z0-9_./{}-]+$/i.test(String(value)),
    `${label} must be a URL or repo-local artifact path`,
  );
}

function validateInventory(root, inventoryPath, schemaPath, failures) {
  const inventory = readJson(inventoryPath);
  const schema = readJson(schemaPath);
  validateValue(inventory, schema, rel(root, inventoryPath), failures, schema);

  assert(failures, inventory.target_scope?.start_date === TARGET_START, `Architecture inventory target start must be ${TARGET_START}`);
  assert(failures, inventory.target_scope?.end_date === TARGET_END, `Architecture inventory target end must be ${TARGET_END}`);

  const eventTypes = new Set(inventory.event_type_values || []);
  const sourceIds = new Set();
  const cityCounts = {};
  for (const source of inventory.sources || []) {
    assert(failures, !sourceIds.has(source.source_id), `Duplicate architecture inventory source_id ${source.source_id}`);
    sourceIds.add(source.source_id);
    for (const cityId of source.city_ids || []) {
      cityCounts[cityId] = (cityCounts[cityId] || 0) + 1;
    }

    const accessUrls = Object.entries(source.access || {}).filter(([, value]) => value);
    assert(failures, accessUrls.length > 0, `Architecture source ${source.source_id} needs at least one access URL`);
    for (const [key, value] of Object.entries(source.access || {})) {
      validateUrlLike(failures, value, `Architecture source ${source.source_id} access.${key}`);
    }
    for (const value of Object.values(source.current_artifacts || {})) {
      const artifactPath = resolve(root, value);
      assert(failures, fs.existsSync(artifactPath), `Architecture source ${source.source_id} references missing artifact ${value}`);
    }
    for (const eventType of source.event_types || []) {
      assert(failures, eventTypes.has(eventType), `Architecture source ${source.source_id} uses unknown event type ${eventType}`);
    }
    assert(
      failures,
      source.coverage?.years?.end >= 2008 && source.coverage?.years?.start <= 2026,
      `Architecture source ${source.source_id} does not overlap the target window`,
    );
    assert(failures, !containsOverclaim(source.title), `Architecture source ${source.source_id} title overclaims`);
    assert(failures, !containsOverclaim((source.caveats || []).join(" ")), `Architecture source ${source.source_id} caveats overclaim`);
    assert(failures, !containsOverclaim(source.legal?.redistribution_caveat), `Architecture source ${source.source_id} redistribution caveat overclaims`);
  }

  for (const required of REQUIRED_INVENTORY_SOURCES) {
    assert(failures, sourceIds.has(required), `Missing required architecture inventory source ${required}`);
  }
  for (const cityId of REQUIRED_CITIES) {
    assert(failures, (cityCounts[cityId] || 0) > 0, `Architecture inventory has no sources for ${cityId}`);
  }
  return inventory;
}

function validateRegistrySync(root, inventory, failures) {
  const registryPath = resolve(root, "config/source_registry.json");
  const registry = readJson(registryPath);
  const registryById = new Map((registry.sources || []).map((source) => [source.source_id, source]));
  for (const source of inventory.sources || []) {
    const registrySource = registryById.get(source.source_id);
    assert(failures, Boolean(registrySource), `Architecture source ${source.source_id} is missing from config/source_registry.json`);
    if (!registrySource) continue;
    assert(failures, registrySource.provider === source.publisher, `Registry source ${source.source_id} provider does not match frozen inventory publisher`);
    assert(failures, registrySource.source_family === source.source_family, `Registry source ${source.source_id} source_family does not match frozen inventory`);
    assert(failures, registrySource.architecture_inventory?.priority_rank === source.priority_rank, `Registry source ${source.source_id} missing architecture_inventory priority rank`);
    assert(failures, Array.isArray(registrySource.architecture_inventory?.event_types), `Registry source ${source.source_id} missing architecture event types`);
    assert(failures, Boolean(registrySource.architecture_inventory?.data_shape), `Registry source ${source.source_id} missing architecture data_shape`);
  }
}

function validateMethodology(root, failures) {
  const methodologyPath = resolve(root, METHODOLOGY_PATH);
  assert(failures, fs.existsSync(methodologyPath), `${METHODOLOGY_PATH} is missing`);
  if (!fs.existsSync(methodologyPath)) return;
  const body = fs.readFileSync(methodologyPath, "utf8");
  const requiredPhrases = [
    TARGET_START,
    TARGET_END,
    "Planning approval is not construction",
    "permit issuance is not completion",
    "Source Freeze",
    "Collection Workflow",
    "Event Classification",
    "Deduplication",
    "Rejection Rules",
    "Verification",
    "config/architecture_source_inventory.json",
    "config/source_registry.json",
    SOURCE_REGISTRY_MANIFEST_PATH,
    URL_SPOT_CHECK_MANIFEST_PATH,
    "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
    "web/data/city-atlas/architecture-coverage-report.json",
  ];
  for (const phrase of requiredPhrases) {
    assert(failures, body.includes(phrase), `${METHODOLOGY_PATH} missing required methodology phrase: ${phrase}`);
  }
  assert(failures, !containsOverclaim(body), `${METHODOLOGY_PATH} contains overclaiming language`);
}

function validateSourceRegistryManifest(root, milestoneSourceById, failures) {
  const manifestPath = resolve(root, SOURCE_REGISTRY_MANIFEST_PATH);
  assert(failures, fs.existsSync(manifestPath), `${SOURCE_REGISTRY_MANIFEST_PATH} is missing`);
  if (!fs.existsSync(manifestPath)) return;
  const manifest = readJson(manifestPath);
  assert(failures, manifest.artifact_kind === "architecture_source_registry", `${SOURCE_REGISTRY_MANIFEST_PATH} has unexpected artifact_kind`);
  assert(failures, manifest.target_scope?.start_date === TARGET_START, `${SOURCE_REGISTRY_MANIFEST_PATH} target start must be ${TARGET_START}`);
  assert(failures, manifest.target_scope?.end_date === TARGET_END, `${SOURCE_REGISTRY_MANIFEST_PATH} target end must be ${TARGET_END}`);
  assert(failures, manifest.source_count === milestoneSourceById.size, `${SOURCE_REGISTRY_MANIFEST_PATH} source_count must match architecture milestone sources`);
  const seen = new Set();
  for (const [index, source] of (manifest.sources || []).entries()) {
    const label = `${SOURCE_REGISTRY_MANIFEST_PATH}.sources[${index}] ${source.source_id || "<missing-source-id>"}`;
    assert(failures, milestoneSourceById.has(source.source_id), `${label} is not present in architecture milestone sources`);
    assert(failures, !seen.has(source.source_id), `${SOURCE_REGISTRY_MANIFEST_PATH} has duplicate source_id ${source.source_id}`);
    seen.add(source.source_id);
    assert(failures, Boolean(source.access?.source_url || source.access?.portal_url || source.access?.api_url || source.access?.csv_url), `${label} missing access URL`);
    assert(failures, Boolean(source.legal?.licence), `${label} missing legal.licence`);
    assert(failures, Boolean(source.legal?.licence_url), `${label} missing legal.licence_url`);
    assert(failures, Boolean(source.legal?.attribution_text), `${label} missing legal.attribution_text`);
    assert(failures, Number.isInteger(source.coverage?.years?.start), `${label} missing coverage year start`);
    assert(failures, Number.isInteger(source.coverage?.years?.end), `${label} missing coverage year end`);
    assert(failures, Array.isArray(source.data_shape?.date_fields) && source.data_shape.date_fields.length > 0, `${label} missing date fields`);
    assert(failures, Array.isArray(source.data_shape?.geometry_fields) && source.data_shape.geometry_fields.length > 0, `${label} missing geometry fields`);
    assert(failures, Array.isArray(source.data_shape?.row_id_fields) && source.data_shape.row_id_fields.length > 0, `${label} missing row id fields`);
    assert(failures, Number.isInteger(source.event_count), `${label} missing event_count`);
    assert(failures, !containsOverclaim(source.title), `${label} title overclaims`);
    assert(failures, !containsOverclaim((source.caveats || []).join(" ")), `${label} caveats overclaim`);
    assert(failures, !containsOverclaim(source.legal?.redistribution_caveat), `${label} redistribution caveat overclaims`);
  }
  for (const sourceId of milestoneSourceById.keys()) {
    assert(failures, seen.has(sourceId), `${SOURCE_REGISTRY_MANIFEST_PATH} missing architecture milestone source ${sourceId}`);
  }
}

function validateUrlSpotCheckManifest(root, failures) {
  const manifestPath = resolve(root, URL_SPOT_CHECK_MANIFEST_PATH);
  assert(failures, fs.existsSync(manifestPath), `${URL_SPOT_CHECK_MANIFEST_PATH} is missing`);
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  assert(failures, manifest.artifact_kind === "architecture_url_spot_check", `${URL_SPOT_CHECK_MANIFEST_PATH} has unexpected artifact_kind`);
  assert(failures, manifest.target_scope?.start_date === TARGET_START, `${URL_SPOT_CHECK_MANIFEST_PATH} target start must be ${TARGET_START}`);
  assert(failures, manifest.target_scope?.end_date === TARGET_END, `${URL_SPOT_CHECK_MANIFEST_PATH} target end must be ${TARGET_END}`);
  assert(failures, hasValue(manifest.generated_at), `${URL_SPOT_CHECK_MANIFEST_PATH} missing generated_at`);
  assert(failures, Array.isArray(manifest.failures), `${URL_SPOT_CHECK_MANIFEST_PATH} failures must be an array`);
  assert(failures, (manifest.failures || []).length === 0, `${URL_SPOT_CHECK_MANIFEST_PATH} has recorded failures: ${(manifest.failures || []).join("; ")}`);
  assert(failures, Array.isArray(manifest.results), `${URL_SPOT_CHECK_MANIFEST_PATH} results must be an array`);
  assert(failures, manifest.sample_count === (manifest.results || []).length, `${URL_SPOT_CHECK_MANIFEST_PATH} sample_count must match results length`);

  const byCity = {};
  let reachableCount = 0;
  for (const [index, result] of (manifest.results || []).entries()) {
    const label = `${URL_SPOT_CHECK_MANIFEST_PATH}.results[${index}]`;
    assert(failures, ["event_source_url", "priority_source_access_url"].includes(result.kind), `${label} has unexpected kind ${result.kind}`);
    assert(failures, /^https?:\/\//.test(String(result.url || "")), `${label} url must be HTTP`);
    assert(failures, hasValue(result.checked_at), `${label} missing checked_at`);
    assert(failures, URL_RESPONSE_CLASSES.has(result.response_class), `${label} has unexpected response_class ${result.response_class}`);
    if (result.ok) {
      reachableCount += 1;
      assert(failures, Number(result.status) >= 200 && Number(result.status) < 400, `${label} ok result has non-reachable status ${result.status}`);
    }
    if (result.kind === "event_source_url") {
      assert(failures, REQUIRED_CITIES.has(result.city_id), `${label} has unexpected city_id ${result.city_id}`);
      assert(failures, hasValue(result.event_id), `${label} missing event_id`);
      assert(failures, hasValue(result.source_record_id), `${label} missing source_record_id`);
      byCity[result.city_id] ||= { checked: 0, reachable: 0, hardFailures: 0 };
      byCity[result.city_id].checked += 1;
      if (result.ok) byCity[result.city_id].reachable += 1;
      if (["client_error", "server_error", "network_error"].includes(result.response_class)) {
        byCity[result.city_id].hardFailures += 1;
      }
    }
  }

  for (const cityId of REQUIRED_CITIES) {
    const row = byCity[cityId] || { checked: 0, reachable: 0, hardFailures: 0 };
    assert(failures, row.checked >= EVENT_URL_SAMPLE_PER_CITY, `${URL_SPOT_CHECK_MANIFEST_PATH} checked ${row.checked} event URL(s) for ${cityId}; expected ${EVENT_URL_SAMPLE_PER_CITY}`);
    assert(failures, row.reachable >= 1, `${URL_SPOT_CHECK_MANIFEST_PATH} has no reachable event source URL for ${cityId}`);
    assert(
      failures,
      row.hardFailures <= Math.floor(EVENT_URL_SAMPLE_PER_CITY / 2),
      `${URL_SPOT_CHECK_MANIFEST_PATH} has too many hard event URL failures for ${cityId}: ${row.hardFailures}/${row.checked}`,
    );
  }
  assert(failures, reachableCount > 0, `${URL_SPOT_CHECK_MANIFEST_PATH} has no reachable URLs`);
  return { sampleCount: manifest.sample_count, reachableCount, byCity };
}

function validateMilestoneSources(payload, failures) {
  const sourceById = new Map();
  for (const [index, source] of (payload.sources || []).entries()) {
    const label = `architecture_milestones.sources[${index}]`;
    for (const field of SOURCE_FIELDS) {
      assert(failures, hasValue(source[field]), `${label} missing ${field}`);
    }
    assert(failures, !sourceById.has(source.source_id), `Duplicate architecture milestone source_id ${source.source_id}`);
    sourceById.set(source.source_id, source);
    assert(failures, /^https?:\/\//.test(source.access_url), `${label} access_url must be an HTTP URL`);
    assert(failures, /^https?:\/\//.test(source.licence_url), `${label} licence_url must be an HTTP URL`);
    assert(failures, Number.isInteger(source.coverage_years?.start), `${label} coverage_years.start must be an integer`);
    assert(failures, Number.isInteger(source.coverage_years?.end), `${label} coverage_years.end must be an integer`);
    assert(failures, !containsOverclaim(source.limitations), `${label} limitations overclaim`);
  }
  return sourceById;
}

function sourceRecordSignature(event) {
  const recordId = compactText(event.source_record_id).toLowerCase();
  if (!recordId) return null;
  return [
    compactText(event.city_id),
    (event.source_ids || []).map(String).sort().join(","),
    recordId,
    compactText(event.date),
    compactText(event.bucket).toLowerCase(),
    compactText(event.title).toLowerCase(),
  ].join("\u0000");
}

function validateMilestoneEvents(payload, sourceById, failures) {
  const eventIds = new Set();
  const recordSignatures = new Map();
  const byCity = {};
  let minDate = null;
  let maxDate = null;

  for (const [index, event] of (payload.events || []).entries()) {
    const label = `architecture_milestones.events[${index}] ${event.event_id || "<missing-event-id>"}`;
    for (const field of EVENT_FIELDS) {
      assert(failures, hasValue(event[field]), `${label} missing ${field}`);
    }
    assert(failures, REQUIRED_CITIES.has(event.city_id), `${label} has unexpected city_id ${event.city_id}`);
    byCity[event.city_id] = (byCity[event.city_id] || 0) + 1;
    assert(failures, !eventIds.has(event.event_id), `Duplicate architecture milestone event_id ${event.event_id}`);
    eventIds.add(event.event_id);

    const isoDate = firstIsoDate(event.date);
    assert(failures, Boolean(isoDate), `${label} has no parseable source date ${event.date}`);
    if (isoDate) {
      if (!minDate || isoDate < minDate) minDate = isoDate;
      if (!maxDate || isoDate > maxDate) maxDate = isoDate;
      assert(failures, isoDate >= TARGET_START && isoDate <= TARGET_END, `${label} date ${isoDate} outside ${TARGET_START} through ${TARGET_END}`);
    }

    assert(failures, /^https?:\/\//.test(event.source_url), `${label} source_url must be an HTTP URL`);
    assert(failures, CONFIDENCE_VALUES.has(event.confidence), `${label} has invalid confidence ${event.confidence}`);
    assert(failures, Number.isFinite(Number(event.longitude)) && Number(event.longitude) >= -180 && Number(event.longitude) <= 180, `${label} longitude is invalid`);
    assert(failures, Number.isFinite(Number(event.latitude)) && Number(event.latitude) >= -90 && Number(event.latitude) <= 90, `${label} latitude is invalid`);
    for (const sourceId of event.source_ids || []) {
      assert(failures, sourceById.has(sourceId), `${label} references unknown source ${sourceId}`);
    }

    assert(failures, !containsOverclaim(event.title), `${label} title overclaims`);
    assert(failures, !containsOverclaim(event.summary), `${label} summary overclaims`);
    assert(failures, !containsOverclaim(event.observed_change), `${label} observed_change overclaims`);
    assert(failures, !containsOverclaim(event.limitations), `${label} limitations overclaim`);

    const signature = sourceRecordSignature(event);
    if (signature) {
      const existing = recordSignatures.get(signature);
      assert(failures, !existing, `${label} duplicates source-record milestone ${existing}`);
      recordSignatures.set(signature, event.event_id);
    }
  }

  for (const cityId of REQUIRED_CITIES) {
    assert(failures, (byCity[cityId] || 0) > 0, `Architecture milestones have no events for ${cityId}`);
  }

  return { byCity, minDate, maxDate, eventCount: payload.events?.length || 0, sourceCount: payload.sources?.length || 0 };
}

function validateMilestones(root, milestonesPath, failures) {
  const payload = readJson(milestonesPath);
  assert(failures, payload.target_scope?.start_date === TARGET_START, `Architecture milestone package target start must be ${TARGET_START}`);
  assert(failures, payload.target_scope?.end_date === TARGET_END, `Architecture milestone package target end must be ${TARGET_END}`);
  assert(failures, !containsOverclaim(payload.scope_note), "Architecture milestone scope_note overclaims");
  assert(failures, !containsOverclaim(payload.license_note), "Architecture milestone license_note overclaims");
  const sourceById = validateMilestoneSources(payload, failures);
  const summary = validateMilestoneEvents(payload, sourceById, failures);
  validateSourceRegistryManifest(root, sourceById, failures);
  return summary;
}

function verify(args) {
  const root = args.root;
  const failures = [];
  const inventoryPath = resolve(root, args.inventory);
  const schemaPath = resolve(root, args.inventorySchema);
  const milestonesPath = resolve(root, args.milestones);

  const inventory = validateInventory(root, inventoryPath, schemaPath, failures);
  validateRegistrySync(root, inventory, failures);
  validateMethodology(root, failures);
  const summary = validateMilestones(root, milestonesPath, failures);
  summary.urlSpotCheck = validateUrlSpotCheckManifest(root, failures);
  return { failures, summary };
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const { failures, summary } = verify(args);
    if (failures.length) {
      console.error("Architecture scope verification failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
    console.log(
      `Architecture scope verification OK: ${summary.eventCount} events, ${summary.sourceCount} sources, dates ${summary.minDate} through ${summary.maxDate}, cities ${JSON.stringify(summary.byCity)}, URL spot checks ${summary.urlSpotCheck?.reachableCount || 0}/${summary.urlSpotCheck?.sampleCount || 0}.`,
    );
  } catch (error) {
    console.error(`verify:architecture failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  verify,
};
