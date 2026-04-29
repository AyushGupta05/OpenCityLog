const fs = require("fs");
const path = require("path");

const DEFAULT_GENERATED_AT = "2026-04-28T00:00:00Z";
const EVENT_SCHEMA_VERSION = "1.0.0";
const ATLAS_SCHEMA_VERSION = "1.0.0";

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    configDir: "config/cities",
    sourceRegistry: "config/source_registry.json",
    outputDir: "web/data/city-atlas",
    legacyCatalog: "data/derived/2026/belfast_infrastructure_events_2016_2026.json",
    generatedAt: process.env.BIMS_DATA_GENERATED_AT || DEFAULT_GENERATED_AT,
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
    } else if (arg === "--output") {
      args.outputDir = next;
      index += 1;
    } else if (arg === "--legacy-catalog") {
      args.legacyCatalog = next;
      index += 1;
    } else if (arg === "--generated-at") {
      args.generatedAt = next;
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

function writeJson(filePath, payload, options = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = options.pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  fs.writeFileSync(filePath, `${body}\n`, "utf8");
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeFromRoot(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function loadCityConfigs(root, configDir) {
  const dir = resolve(root, configDir);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)))
    .sort((a, b) => a.city_id.localeCompare(b.city_id));
}

function sourceAppliesToCity(source, cityId) {
  return Array.isArray(source.city_ids) && (source.city_ids.includes("*") || source.city_ids.includes(cityId));
}

function sourceRegistryForCity(registry, cityId) {
  return registry.sources
    .filter((source) => sourceAppliesToCity(source, cityId))
    .sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function yearRange(start, end) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function sourceIdForLegacyEvent(event) {
  const sourceName = String(event.sourceName || "");
  const sourceBasis = String(event.sourceBasis || "");
  if (/openstreetmap|overpass/i.test(sourceName) || /osm/i.test(sourceBasis)) return "osm-overpass";
  if (/planning statistics/i.test(sourceName) || /planning statistics/i.test(sourceBasis)) return "ni-planning-statistics";
  if (/ulster university/i.test(sourceName)) return "ulster-university-public-pages";
  if (/belfast city council/i.test(sourceName)) return "belfast-city-council-public-pages";
  if (/department for infrastructure/i.test(sourceName)) return "dfi-ni-public-project-pages";
  if (/translink|weavers cross/i.test(sourceName)) return "translink-public-project-pages";
  return "belfast-public-project-pages";
}

function categoryForLegacyEvent(event) {
  const value = String(event.category || event.signal || "").toLowerCase();
  if (value === "traffic") return "transport";
  if (value === "jobs") return "economy";
  if (value === "electricity") return "utilities";
  if (value === "services") return "civic_services";
  if (value === "buildings") return "built_environment";
  return value || "observed_change";
}

function lensForLegacyEvent(event) {
  const signal = String(event.signal || event.category || "").toLowerCase();
  const bySignal = {
    traffic: "mobility",
    jobs: "economic_opportunity",
    electricity: "utilities",
    services: "civic_services",
    buildings: "built_environment",
  };
  return bySignal[signal] || "city_change";
}

function affectedSignalsForLegacyEvent(event) {
  const signal = lensForLegacyEvent(event);
  const result = new Set([signal]);
  const tags = event.tags || {};
  if (tags.highway || event.category === "traffic") result.add("mobility");
  if (tags.building || event.category === "buildings") result.add("built_environment");
  if (tags.shop || tags.amenity || event.signal === "jobs") result.add("economic_opportunity");
  if (tags.power || event.category === "electricity") result.add("utilities");
  if (event.category === "services" || tags.amenity || tags.leisure) result.add("civic_services");
  return [...result].sort();
}

function confidenceForLegacyEvent(event) {
  const sourceId = sourceIdForLegacyEvent(event);
  if (sourceId === "osm-overpass") return "inferred";
  if (/corroborated/i.test(String(event.confidence || ""))) return "corroborated";
  if (/disputed/i.test(String(event.confidence || ""))) return "disputed";
  return "documented";
}

function validPoint(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}

function geometryForLegacyEvent(event) {
  return validPoint(event.coordinates)
    ? {
        type: "Point",
        coordinates: [Number(event.coordinates[0].toFixed(6)), Number(event.coordinates[1].toFixed(6))],
      }
    : null;
}

function parseMonthYear(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!match) return null;
  const months = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    sept: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };
  const month = months[match[1].toLowerCase()];
  return month ? `${match[2]}-${month}` : null;
}

function dateFieldsForLegacyEvent(event) {
  if (event.osmTimestamp && /^\d{4}-\d{2}-\d{2}/.test(event.osmTimestamp)) {
    return {
      effective_date: event.osmTimestamp.slice(0, 10),
      effective_date_range: null,
      date_precision: "day",
    };
  }
  if (event.planningDecisionDate && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(event.planningDecisionDate))) {
    const [day, month, year] = String(event.planningDecisionDate).split("/").map(Number);
    return {
      effective_date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      effective_date_range: null,
      date_precision: "day",
    };
  }
  const month = parseMonthYear(event.month);
  if (month) {
    return {
      effective_date: month,
      effective_date_range: null,
      date_precision: "month",
    };
  }
  return {
    effective_date: String(event.year),
    effective_date_range: null,
    date_precision: "year",
  };
}

function normalizedYearForLegacyEvent(event, dates) {
  const dateYear = Number(String(dates.effective_date || "").slice(0, 4));
  if (Number.isInteger(dateYear) && dateYear >= 2000 && dateYear <= 2026) return dateYear;
  return Number(event.year);
}

function evidenceForLegacyEvent(event, sourceId, legacyCatalogPath) {
  const evidence = [];
  if (event.sourceUrl) {
    evidence.push({
      source_id: sourceId,
      label: event.sourceName || sourceId,
      kind: "source_url",
      url: event.sourceUrl,
      file_path: null,
      record_id: event.sourceId || event.id || null,
    });
  }
  if (event.osmChangesetUrl) {
    evidence.push({
      source_id: "osm-overpass",
      label: "OpenStreetMap changeset",
      kind: "changeset",
      url: event.osmChangesetUrl,
      file_path: null,
      record_id: event.osmChangeset ? String(event.osmChangeset) : null,
    });
  }
  evidence.push({
    source_id: sourceId,
    label: "Belfast infrastructure event catalog",
    kind: "local_file",
    url: null,
    file_path: legacyCatalogPath,
    record_id: event.id || null,
  });
  return evidence;
}

function explanationForLegacyEvent(event, sourceId) {
  const area = event.area || "Belfast";
  if (sourceId === "osm-overpass") {
    return `OpenStreetMap metadata records this feature as publicly mapped near ${area}. This is an observed mapped-change record, not a confirmed real-world opening or construction date.`;
  }
  if (sourceId === "ni-planning-statistics") {
    return `The planning statistics record documents a planning decision associated with ${area}. It is administrative evidence of a planning decision, not evidence that works were completed.`;
  }
  return `Public source material documents this event near ${area}. Related local changes should be treated as associated context, not causal claims.`;
}

function caveatsForLegacyEvent(event, sourceId) {
  const caveats = [];
  if (sourceId === "osm-overpass") {
    caveats.push("OSM timestamps are edit or mapped-visibility dates and can differ from real-world effective dates.");
    caveats.push("Mapper activity and source availability can affect when a feature appears in OSM history.");
  } else if (sourceId === "ni-planning-statistics") {
    caveats.push("Planning approval does not prove that construction started or completed.");
    caveats.push("Coordinates may be approximate where source records use grid references or site addresses.");
  } else {
    caveats.push("Public project pages can change; keep source URL and access date with citation records.");
    caveats.push("This event is not used as evidence of causal outcomes.");
  }
  if (event.subtitle && /not a confirmed construction|not construction/i.test(event.subtitle)) {
    caveats.push(event.subtitle);
  }
  return [...new Set(caveats)];
}

function normalizeLegacyBelfastEvent(event, legacyCatalogPath) {
  const sourceId = sourceIdForLegacyEvent(event);
  const dates = dateFieldsForLegacyEvent(event);
  const year = normalizedYearForLegacyEvent(event, dates);
  return {
    schema_version: EVENT_SCHEMA_VERSION,
    city_id: "belfast",
    event_id: String(event.id || event.event_id),
    title: String(event.title || "Observed city change"),
    year,
    effective_date: dates.effective_date,
    effective_date_range: dates.effective_date_range,
    date_precision: dates.date_precision,
    category: categoryForLegacyEvent(event),
    lens: lensForLegacyEvent(event),
    geometry: geometryForLegacyEvent(event),
    affected_area: {
      label: String(event.area || "Belfast"),
    },
    source_ids: [sourceId],
    evidence: evidenceForLegacyEvent(event, sourceId, legacyCatalogPath),
    confidence: confidenceForLegacyEvent(event),
    affected_signals: affectedSignalsForLegacyEvent(event),
    explanation: explanationForLegacyEvent(event, sourceId),
    caveats: caveatsForLegacyEvent(event, sourceId),
    provenance: {
      transform: "scripts/build_data.js#normalizeLegacyBelfastEvent",
      legacy_catalog_path: legacyCatalogPath,
      legacy_event_id: String(event.id || event.event_id),
      legacy_source_id: event.sourceId || null,
      source_basis: event.sourceBasis || null,
      osm_timestamp: event.osmTimestamp || null,
      osm_version: event.osmVersion || null,
      osm_changeset: event.osmChangeset || null,
      planning_application_id: event.planningApplicationId || null,
    },
  };
}

function loadBelfastLegacyEvents(root, legacyCatalogPath) {
  const absolute = resolve(root, legacyCatalogPath);
  if (!fs.existsSync(absolute)) return { events: [], migration: null };
  const payload = readJson(absolute);
  const events = (payload.events || [])
    .map((event) => normalizeLegacyBelfastEvent(event, toPosix(legacyCatalogPath)))
    .filter((event) => Number.isInteger(event.year) && event.event_id)
    .sort((a, b) => a.year - b.year || a.event_id.localeCompare(b.event_id));

  return {
    events,
    migration: {
      source_kind: payload.kind || "belfast.infrastructureEventCatalog",
      source_schema_version: payload.schemaVersion || null,
      source_path: toPosix(legacyCatalogPath),
      source_event_count: payload.eventCount || events.length,
      normalized_event_count: events.length,
      basis: payload.basis || [],
      notes: [
        "Belfast infrastructure events are normalized into the event-first atlas schema.",
        "OSM-derived records remain labelled as mapped visibility, not real-world construction dates.",
      ],
    },
  };
}

function eventsForCity(root, city, legacyCatalogPath) {
  if (city.city_id === "belfast") {
    return loadBelfastLegacyEvents(root, legacyCatalogPath);
  }
  return {
    events: [],
    migration: {
      source_kind: "adapter_placeholder",
      source_schema_version: null,
      source_path: null,
      source_event_count: 0,
      normalized_event_count: 0,
      basis: [],
      notes: ["No local adapter has been implemented for this city yet."],
    },
  };
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function featureForEvent(event) {
  return {
    type: "Feature",
    id: event.event_id,
    properties: {
      city_id: event.city_id,
      event_id: event.event_id,
      title: event.title,
      year: event.year,
      effective_date: event.effective_date,
      date_precision: event.date_precision,
      category: event.category,
      lens: event.lens,
      confidence: event.confidence,
      source_ids: event.source_ids,
      affected_area_label: event.affected_area?.label || null,
      explanation: event.explanation,
    },
    geometry: event.geometry || null,
  };
}

function availabilityMatrix(city, events) {
  return (city.source_families || []).map((family) => ({
    family_id: family.family_id,
    label: family.label,
    availability: family.availability,
    years: family.years || [],
    source_ids: family.source_ids || [],
    event_count: eventCountForFamily(family, events),
    notes: family.notes,
  }));
}

function eventCountForFamily(family, events) {
  const sourceIds = new Set(family.source_ids || []);
  if (!sourceIds.size) return 0;
  return events.filter((event) => (event.source_ids || []).some((sourceId) => sourceIds.has(sourceId))).length;
}

function buildCityArtifacts(root, outputDir, city, citySources, legacyCatalogPath, generatedAt) {
  const cityOutputDir = path.join(outputDir, "cities", city.city_id);
  const { events, migration } = eventsForCity(root, city, legacyCatalogPath);
  const eventsByYear = new Map();
  for (const event of events) {
    if (!eventsByYear.has(event.year)) eventsByYear.set(event.year, []);
    eventsByYear.get(event.year).push(event);
  }

  const chunks = [];
  for (const year of [...eventsByYear.keys()].sort((a, b) => a - b)) {
    const yearEvents = eventsByYear.get(year).sort((a, b) => a.event_id.localeCompare(b.event_id));
    const jsonPath = path.join(cityOutputDir, `events_${year}.json`);
    const geojsonPath = path.join(cityOutputDir, `events_${year}.geojson`);
    writeJson(jsonPath, {
      schema_version: ATLAS_SCHEMA_VERSION,
      city_id: city.city_id,
      year,
      event_count: yearEvents.length,
      events: yearEvents,
    });
    writeJson(geojsonPath, {
      type: "FeatureCollection",
      schema_version: ATLAS_SCHEMA_VERSION,
      city_id: city.city_id,
      year,
      features: yearEvents.map(featureForEvent),
    });
    chunks.push({
      year,
      event_count: yearEvents.length,
      counts_by_category: countBy(yearEvents, (event) => event.category),
      json_path: relativeFromRoot(root, jsonPath),
      geojson_path: relativeFromRoot(root, geojsonPath),
    });
  }

  const availability = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    summary: city.data_availability,
    matrix: availabilityMatrix(city, events),
    event_counts_by_year: countBy(events, (event) => String(event.year)),
    event_counts_by_category: countBy(events, (event) => event.category),
  };

  const eventsIndex = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    event_count: events.length,
    event_years: [...eventsByYear.keys()].sort((a, b) => a - b),
    chunks,
    migration,
  };

  const sourcePayload = {
    schema_version: ATLAS_SCHEMA_VERSION,
    city_id: city.city_id,
    generated_at: generatedAt,
    source_count: citySources.length,
    sources: citySources,
  };

  const cityPath = path.join(cityOutputDir, "city.json");
  const sourcesPath = path.join(cityOutputDir, "sources.json");
  const eventsPath = path.join(cityOutputDir, "events.json");
  const availabilityPath = path.join(cityOutputDir, "availability.json");
  const cityPayload = {
    ...city,
    schema_version: city.schema_version || ATLAS_SCHEMA_VERSION,
    artifact_paths: {
      city: relativeFromRoot(root, cityPath),
      sources: relativeFromRoot(root, sourcesPath),
      events: relativeFromRoot(root, eventsPath),
      availability: relativeFromRoot(root, availabilityPath),
    },
  };

  writeJson(cityPath, cityPayload);
  writeJson(sourcesPath, sourcePayload);
  writeJson(eventsPath, eventsIndex);
  writeJson(availabilityPath, availability);

  return {
    city_id: city.city_id,
    display_name: city.display_name,
    event_count: events.length,
    source_count: citySources.length,
    availability_status: city.data_availability?.status || "unknown",
    artifact_paths: cityPayload.artifact_paths,
  };
}

function buildAtlas(args) {
  const root = args.root;
  const outputDir = resolve(root, args.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const cityConfigs = loadCityConfigs(root, args.configDir);
  const registry = readJson(resolve(root, args.sourceRegistry));
  const citySummaries = cityConfigs.map((city) =>
    buildCityArtifacts(
      root,
      outputDir,
      city,
      sourceRegistryForCity(registry, city.city_id),
      args.legacyCatalog,
      args.generatedAt,
    ),
  );

  const index = {
    schema_version: ATLAS_SCHEMA_VERSION,
    generated_at: args.generatedAt,
    default_city_id: "belfast",
    city_count: citySummaries.length,
    cities: citySummaries,
    contracts: {
      city_schema: "schemas/city.schema.json",
      source_schema: "schemas/source.schema.json",
      event_schema: "schemas/event.schema.json",
      availability_schema: "schemas/availability.schema.json",
    },
  };
  writeJson(path.join(outputDir, "index.json"), index);
  return index;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const index = buildAtlas(args);
    console.log(
      `Wrote city atlas artifacts for ${index.city_count} city config(s) to ${toPosix(args.outputDir)}.`,
    );
    for (const city of index.cities) {
      console.log(`- ${city.city_id}: ${city.event_count} event(s), ${city.source_count} source(s)`);
    }
  } catch (error) {
    console.error(`build:data failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAtlas,
  normalizeLegacyBelfastEvent,
  parseArgs,
};
