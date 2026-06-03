const fs = require("fs");
const path = require("path");
const {
  LENS_DEFINITIONS,
  eventDirectlyMatchesLensCategory,
  eventMatchesLens,
  eventWithholdsMapGeometry,
  licenseNeedsReview,
  sourceHasMinimumLicense,
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");

const SCHEMA_VERSION = "1.0.0";
const DEFAULT_GENERATED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const CONTRACT_DOC = "docs/15_lens_city_design_contract.md";
const REFERENCE_SCREENS = "tmp/reference-screens";
const METHODOLOGY_PATH = "docs/15_lens_source_audit.md";
const CORRECTION_PATH = "CONTRIBUTING.md#correction-flow";
const LENS_YEAR_COVERAGE_SCHEMA = "schemas/lens_year_coverage.schema.json";
const REQUIRED_LENS_YEARS = Array.from({ length: 20 }, (_, index) => 2007 + index);
const LENS_DETAIL_LAYERS_BY_GROUP = {
  planning: new Set(["planning_cell"]),
  transport: new Set([]),
  civic: new Set(["civic_coverage_cell", "civic_facility"]),
  economy: new Set(["economy_activity_cell", "economy_frontage"]),
  utilities: new Set(["utility_trace", "utility_asset"]),
};

const CITY_SCOPE = {
  belfast: {
    official_boundary: {
      label: "Belfast City Council boundary",
      source_name: "OSNI Open Data - Largescale Boundaries - Local Government Districts (2012)",
      publisher: "Land and Property Services / OpenDataNI",
      source_url: "https://ckan.publishing.service.gov.uk/dataset/osni-open-data-largescale-boundaries-local-government-districts-20123",
      source_type: "official boundary dataset",
      licence: "UK Open Government Licence (OGL) v3.0; contains Ordnance Survey of Northern Ireland data.",
      licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      attribution_text: "Contains public sector information licensed under the Open Government Licence v3.0 and Ordnance Survey of Northern Ireland attribution.",
      accessed_at: "2026-06-03",
      source_ids: ["osni-open-data-largescale-boundaries-local-government-districts-2012"],
    },
    admin_overlays: [
      "Belfast District Electoral Areas and wards where Spatial NI/NISRA source-backed boundaries are available.",
    ],
    scope_note: "Lens coverage is scoped to the Belfast City Council area, not only the city centre.",
  },
  london: {
    official_boundary: {
      label: "Greater London boundary and boroughs",
      source_name: "London Boroughs / ONS Open Geography boundary products",
      publisher: "Greater London Authority / Office for National Statistics",
      source_url: "https://data.london.gov.uk/dataset/london_boroughs/",
      source_type: "official boundary dataset",
      licence: "UK Open Government Licence v3.0 with required OS/GLA/ONS attribution where applicable",
      licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      attribution_text: "Contains public sector information licensed under the Open Government Licence v3.0.",
      accessed_at: "2026-05-25",
      source_ids: ["gla-statistical-gis-boundaries", "ons-geoportal-boundaries"],
    },
    admin_overlays: [
      "London boroughs, wards, LSOAs, MSOAs, and other ONS/GLA source-backed geographies where available.",
    ],
    scope_note: "Lens coverage is scoped to Greater London, including all boroughs and the City of London.",
  },
  nyc: {
    official_boundary: {
      label: "New York City five-borough boundary",
      source_name: "NYC Open Data borough/community district boundary datasets",
      publisher: "City of New York",
      source_url: "https://opendata.cityofnewyork.us/",
      source_type: "official boundary dataset",
      licence: "NYC Open Data Terms of Use; NYC Open Data FAQ states there are no restrictions on use",
      licence_url: "https://opendata.cityofnewyork.us/faq/",
      attribution_text: "Credit NYC Open Data and the publishing City agency.",
      accessed_at: "2026-05-25",
      source_ids: ["9nt8-h7nd", "ruf7-3wgc", "5crt-au7u"],
    },
    admin_overlays: [
      "Boroughs, community districts, council districts, NTAs, and census geographies where source-backed boundaries are available.",
    ],
    scope_note: "Lens coverage is scoped to all five boroughs of New York City.",
  },
};

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    atlasDir: "web/data/city-atlas",
    generatedAt: process.env.BIMS_DATA_GENERATED_AT || DEFAULT_GENERATED_AT,
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
    } else if (arg === "--generated-at") {
      args.generatedAt = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function toPosix(value) {
  return String(value).split(path.sep).join("/");
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function relativeFromRoot(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function readJson(filePath) {
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EACCES", "EBUSY", "UNKNOWN"].includes(error.code)) break;
      sleep(120 * (attempt + 1));
    }
  }
  throw lastError;
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(filePath, payload, options = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const spacing = options.compact ? 0 : 2;
  const tmpPath = `${filePath}.tmp`;
  const text = `${JSON.stringify(payload, null, spacing)}\n`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, text, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST", "UNKNOWN"].includes(renameError.code)) throw renameError;
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

function maxDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return String(a) > String(b) ? String(a) : String(b);
}

function minYear(a, b) {
  if (!Number.isInteger(a)) return b;
  if (!Number.isInteger(b)) return a;
  return Math.min(a, b);
}

function maxYear(a, b) {
  if (!Number.isInteger(a)) return b;
  if (!Number.isInteger(b)) return a;
  return Math.max(a, b);
}

function sourceAccessedAt(source) {
  return source?.accessed_at || source?.retrieved_at || source?.registry_reviewed_at || "";
}

function eventHasLicenseReadySources(event, sourceById) {
  const sources = (event.source_ids || event.sourceIds || []).map((sourceId) => sourceById.get(sourceId));
  return sources.length > 0 && sources.every(sourceHasMinimumLicense);
}

function eventHasCompatibleSources(event, sourceById) {
  const sources = (event.source_ids || event.sourceIds || []).map((sourceId) => sourceById.get(sourceId));
  return sources.length > 0 && sources.every((source) => sourceHasMinimumLicense(source) && !licenseNeedsReview(source));
}

function eventHasMapEligibleSources(event, sourceById) {
  const sourceIds = event.source_ids || event.sourceIds || [];
  return eventHasCompatibleSources(event, sourceById)
    && !eventWithholdsMapGeometry(event)
    && sourceIds.every((sourceId) => !sourceWithholdsMapGeometry(sourceById.get(sourceId)));
}

function collectEvents(root, eventsIndex) {
  const events = [];
  for (const chunk of eventsIndex.chunks || []) {
    const chunkPath = resolve(root, chunk.json_path);
    if (!fs.existsSync(chunkPath)) continue;
    const payload = readJson(chunkPath);
    for (const event of payload.events || []) events.push(event);
  }
  return events;
}

function groupEventsByYear(events) {
  const byYear = new Map();
  for (const event of events) {
    const year = Number(event.year);
    if (!Number.isInteger(year)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(event);
  }
  return byYear;
}

function sourceSummary(source) {
  return {
    source_id: source.source_id,
    title: source.title,
    publisher: source.provider,
    source_family: source.source_family,
    licence: source.licence,
    licence_url: source.licence_url,
    attribution_text: source.attribution_text,
    accessed_at: sourceAccessedAt(source),
    reliability: source.reliability,
    source_confidence: source.source_confidence,
    licence_review_required: licenseNeedsReview(source),
  };
}

function featureSourceIds(feature) {
  return String(feature?.properties?.source_ids || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function lensDetailPath(root, city, year) {
  const template = city.artifact_paths?.lens_detail_template;
  return template ? resolve(root, template.replace("{year}", String(year))) : null;
}

function loadLensDetailFeatures(root, city, year, cache) {
  if (cache.has(year)) return cache.get(year);
  const payload = readJsonIfExists(lensDetailPath(root, city, year));
  const features = Array.isArray(payload?.features) ? payload.features : [];
  cache.set(year, features);
  return features;
}

function transportContextCounts(root, city, sourceById) {
  return {
    detail_feature_count: 0,
    coverage_context_feature_count: 0,
    source_ids: [],
  };
}

function detailCountsForLens(root, city, lens, year, cache, sourceById) {
  if (lens.group === "transport") {
    return transportContextCounts(root, city, sourceById);
  }
  const layers = LENS_DETAIL_LAYERS_BY_GROUP[lens.group] || new Set();
  if (!layers.size) {
    return { detail_feature_count: 0, coverage_context_feature_count: 0, source_ids: [] };
  }
  const sourceIds = new Set();
  let detailFeatureCount = 0;
  for (const feature of loadLensDetailFeatures(root, city, year, cache)) {
    const props = feature.properties || {};
    if (props.category !== lens.category || !layers.has(props.layer)) continue;
    if (props.coverage_status === "no_same_category_records" || props.evidence_role === "context_not_year_specific_change_evidence") continue;
    detailFeatureCount += 1;
    for (const sourceId of featureSourceIds(feature)) sourceIds.add(sourceId);
  }
  return {
    detail_feature_count: detailFeatureCount,
    coverage_context_feature_count: 0,
    source_ids: [...sourceIds].sort(),
  };
}

function yearCoverageStatus(broadEventCount, directEventCount) {
  if (directEventCount > 0) return "source_backed_records";
  if (broadEventCount > 0) return "adjacent_source_backed_records";
  return "missing_source_backed_view";
}

function rowLimitations(status, lens, year, visibleMapContract = false, withheldGeometryEventCount = 0) {
  const common = [
    "Counts are source-backed records available in this repo, not a complete census of city change.",
    "Sparse areas remain sparse; no records are generated to create visual density.",
  ];
  if (status === "source_backed_records") {
    const directLimitations = [
      ...common,
      "Direct map marks and headline counts use same-category event geometry and derived lens-detail geometry where available; inspect evidence before reuse.",
    ];
    if (!visibleMapContract || withheldGeometryEventCount > 0) {
      directLimitations.push(
        `${withheldGeometryEventCount} source-backed ${lens.label} record(s) are evidence-only for map purposes because geometry is withheld for rights review, non-site scope, or aggregate/reference-location limits; they remain available in event JSON/evidence records, but do not create map marks or lens-detail surfaces.`,
      );
    }
    return directLimitations;
  }
  if (status === "adjacent_source_backed_records") {
    return [
      ...common,
      `Broad source-backed ${lens.label} lens matches are available for ${year}, but no direct same-category ${lens.category} records are currently ingested.`,
      "Direct map marks and headline counts are disabled for this lens/year; broad matches are retained only for adjacent-evidence audit and source review.",
    ];
  }
  return [
    ...common,
    `No license-compatible ${lens.label} records are currently ingested for ${year}.`,
    "No map marks or coverage surfaces are generated for this lens/year; sparse data remains sparse.",
    "Use the citywide boundary and event list to inspect what is available, not as evidence of complete coverage.",
  ];
}

function buildLensYearCoverage(root, citySummary, city, eventsIndex, events, sourceById, generatedAt) {
  const eventsByYear = groupEventsByYear(events);
  const detailCache = new Map();
  const rows = [];
  for (const lens of LENS_DEFINITIONS) {
    for (const year of REQUIRED_LENS_YEARS) {
      const yearEvents = eventsByYear.get(year) || [];
      const compatibleEvents = yearEvents.filter((event) => (
        eventMatchesLens(event, lens, sourceById) && eventHasCompatibleSources(event, sourceById)
      ));
      const directCompatibleEvents = compatibleEvents.filter((event) => eventDirectlyMatchesLensCategory(event, lens));
      const mapEligibleEvents = compatibleEvents.filter((event) => event.geometry && eventHasMapEligibleSources(event, sourceById));
      const directMapEligibleEvents = directCompatibleEvents.filter((event) => event.geometry && eventHasMapEligibleSources(event, sourceById));
      const withheldGeometryEventCount = Math.max(0, compatibleEvents.length - mapEligibleEvents.length);
      const directWithheldGeometryEventCount = Math.max(0, directCompatibleEvents.length - directMapEligibleEvents.length);
      const confidenceCounts = {};
      const eventSourceIds = new Set();
      for (const event of compatibleEvents) {
        confidenceCounts[event.confidence] = (confidenceCounts[event.confidence] || 0) + 1;
        for (const sourceId of event.source_ids || []) eventSourceIds.add(sourceId);
      }
      const directSourceIds = new Set();
      for (const event of directCompatibleEvents) {
        for (const sourceId of event.source_ids || []) directSourceIds.add(sourceId);
      }
      const rawDetailCounts = detailCountsForLens(root, city, lens, year, detailCache, sourceById);
      const status = yearCoverageStatus(compatibleEvents.length, directCompatibleEvents.length);
      const visibleMapContract = directMapEligibleEvents.length > 0;
      const detailCounts = visibleMapContract
        ? rawDetailCounts
        : { detail_feature_count: 0, coverage_context_feature_count: 0, source_ids: [] };
      const sourceIds = compatibleEvents.length ? [...eventSourceIds].sort() : [];
      const directSourceList = directCompatibleEvents.length ? [...directSourceIds].sort() : [];
      rows.push({
        city_id: citySummary.city_id,
        display_name: city.display_name,
        lens_slug: lens.slug,
        public_label: lens.label,
        group: lens.group,
        category: lens.category,
        year,
        required_year: true,
        visible_map_contract: visibleMapContract,
        status,
        event_count: compatibleEvents.length,
        compatible_event_count: compatibleEvents.length,
        map_event_count: mapEligibleEvents.length,
        map_direct_event_count: directMapEligibleEvents.length,
        withheld_geometry_event_count: withheldGeometryEventCount,
        direct_withheld_geometry_event_count: directWithheldGeometryEventCount,
        broad_match_event_count: compatibleEvents.length,
        broad_match_compatible_event_count: compatibleEvents.length,
        direct_event_count: directCompatibleEvents.length,
        direct_compatible_event_count: directCompatibleEvents.length,
        detail_feature_count: detailCounts.detail_feature_count,
        coverage_context_feature_count: detailCounts.coverage_context_feature_count,
        headline_count_included: directCompatibleEvents.length,
        headline_count_excluded_context_features: detailCounts.coverage_context_feature_count,
        confidence_counts: confidenceCounts,
        source_count: sourceIds.length,
        source_ids: sourceIds,
        compatible_source_ids: sourceIds,
        broad_match_source_count: sourceIds.length,
        broad_match_source_ids: sourceIds,
        direct_source_count: directSourceList.length,
        direct_source_ids: directSourceList,
        evidence_basis: compatibleEvents.length
          ? `Source-backed ${lens.label} event rows in web/data/city-atlas/cities/${citySummary.city_id}/events_${year}.json matched by lib/atlas-lenses.js#eventMatchesLens; ${directCompatibleEvents.length} direct same-category ${lens.category} row(s) matched; ${directMapEligibleEvents.length} direct row(s) have map-eligible geometry.`
          : `No same-lens source-backed event rows matched for ${year}; no generated filler geometry is emitted.`,
        map_artifacts: {
          events_json: `web/data/city-atlas/cities/${citySummary.city_id}/events_${year}.json`,
          events_geojson: `web/data/city-atlas/cities/${citySummary.city_id}/events_${year}.geojson`,
          lens_detail_geojson: `web/data/city-atlas/cities/${citySummary.city_id}/lens_detail_${year}.geojson`,
          ...(lens.group === "transport" && compatibleEvents.length > 0 && city.artifact_paths?.transport_roads_base
            ? { transport_roads_base: city.artifact_paths.transport_roads_base }
            : {}),
        },
        limitations: rowLimitations(status, lens, year, visibleMapContract, withheldGeometryEventCount),
        exports: {
          markdown: true,
          csv: true,
          geojson: true,
          includes_uncertainty_confidence_limitations_licenses_transform_notes: true,
        },
      });
    }
  }

  const coverage = {
    schema_version: SCHEMA_VERSION,
    artifact_kind: "bims_lens_year_coverage",
    generated_at: generatedAt,
    city_id: citySummary.city_id,
    display_name: city.display_name,
    contract_source: CONTRACT_DOC,
    visual_reference_set: REFERENCE_SCREENS,
    required_years: { start: REQUIRED_LENS_YEARS[0], end: REQUIRED_LENS_YEARS[REQUIRED_LENS_YEARS.length - 1] },
    required_lens_count: LENS_DEFINITIONS.length,
    required_row_count: LENS_DEFINITIONS.length * REQUIRED_LENS_YEARS.length,
    row_count: rows.length,
    status_counts: rows.reduce((counts, row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
      return counts;
    }, {}),
    rows,
  };
  const coveragePath = path.join(path.dirname(resolve(root, citySummary.artifact_paths.city)), "lens_year_coverage.json");
  writeJson(coveragePath, coverage);
  return { coverage, relative_path: relativeFromRoot(root, coveragePath) };
}

function summarizeYearContract(yearRows, relativeCoveragePath) {
  const visibleRows = yearRows.filter((row) => row.visible_map_contract);
  return {
    required_years: { start: REQUIRED_LENS_YEARS[0], end: REQUIRED_LENS_YEARS[REQUIRED_LENS_YEARS.length - 1] },
    required_year_count: REQUIRED_LENS_YEARS.length,
    visible_year_count: visibleRows.length,
    missing_visible_years: yearRows.filter((row) => !row.visible_map_contract).map((row) => row.year),
    source_backed_record_year_count: yearRows.filter((row) => row.status === "source_backed_records").length,
    source_backed_context_year_count: 0,
    lens_year_coverage_path: relativeCoveragePath,
  };
}

function summarizeLens(cityId, lens, events, sourceById, yearRows = [], relativeCoveragePath = "") {
  const matching = events.filter((event) => eventMatchesLens(event, lens, sourceById));
  const licenseReadyEvents = matching.filter((event) => eventHasLicenseReadySources(event, sourceById));
  const compatibleEvents = licenseReadyEvents.filter((event) => eventHasCompatibleSources(event, sourceById));
  const excludedReviewRequiredEventCount = Math.max(0, licenseReadyEvents.length - compatibleEvents.length);
  const sourceIds = new Set();
  const confidenceCounts = {};
  let firstYear = null;
  let lastYear = null;
  let lastRetrieved = "";

  for (const event of compatibleEvents) {
    confidenceCounts[event.confidence] = (confidenceCounts[event.confidence] || 0) + 1;
    firstYear = minYear(firstYear, event.year);
    lastYear = maxYear(lastYear, event.year);
    for (const sourceId of event.source_ids || []) {
      const source = sourceById.get(sourceId);
      if (!source) continue;
      sourceIds.add(sourceId);
      lastRetrieved = maxDate(lastRetrieved, sourceAccessedAt(source));
    }
    lastRetrieved = maxDate(lastRetrieved, event.provenance?.source_retrieved_at || "");
  }

  const sourceList = [...sourceIds].sort();
  const allSources = sourceList.map((sourceId) => sourceById.get(sourceId)).filter(Boolean);
  const sourceSamples = allSources.slice(0, 12).map(sourceSummary);
  const updateCadences = [...new Set(allSources.map((source) => source.update_frequency).filter(Boolean))].sort();

  return {
    slug: lens.slug,
    public_label: lens.label,
    group: lens.group,
    category: lens.category,
    primary_selectable_object_type: lens.primary_object_type,
    visual_metaphor: lens.visual_metaphor,
    color_role: lens.color_role,
    full_city_scope_required: true,
    event_filter: {
      method: "lib/atlas-lenses.js#eventMatchesLens",
      note: "A source-backed event may appear in more than one lens when its source family supports that lens view; the event id, evidence, licence, and caveats stay unchanged.",
    },
    coverage: {
      event_count: compatibleEvents.length,
      compatible_event_count: compatibleEvents.length,
      review_required_event_count: 0,
      source_count: sourceList.length,
      compatible_source_count: sourceList.length,
      review_required_source_count: 0,
      observed_years: Number.isInteger(firstYear) && Number.isInteger(lastYear) ? { start: firstYear, end: lastYear } : null,
      confidence_counts: confidenceCounts,
      caveats: [
        "Counts are source-backed records available in this repo, not a complete census of all city changes.",
        "Sparse areas remain sparse; no marks are generated to match visual density.",
        "Administrative records are not treated as evidence of construction, service quality, capacity, causation, or outcome.",
        "Launched lens counts exclude otherwise matching records whose source licence or reuse terms still need source-level review.",
      ],
      excluded_review_required_event_count: excludedReviewRequiredEventCount,
      year_contract: summarizeYearContract(yearRows, relativeCoveragePath),
    },
    freshness: {
      last_retrieved_or_reviewed: lastRetrieved,
      source_coverage_period: Number.isInteger(firstYear) && Number.isInteger(lastYear) ? `${firstYear}-${lastYear}` : "unknown",
      update_cadence: updateCadences.length ? updateCadences.slice(0, 8).join("; ") : "Source-specific; see source records.",
    },
    provenance: {
      source_ids: sourceList,
      compatible_source_ids: sourceList,
      review_required_source_ids: [],
      source_samples: sourceSamples,
      transformation_method: `scripts/build_15_lens_manifest.js#summarizeLens:${cityId}:${lens.slug}`,
      methodology_path: `${METHODOLOGY_PATH}#${lens.methodology_anchor}`,
      correction_path: CORRECTION_PATH,
    },
    exports: {
      selected_object_markdown: true,
      filtered_view_csv: true,
      filtered_view_geojson: true,
      includes_citations_licenses_dates_confidence_limitations: true,
    },
  };
}

function buildCityManifest(root, atlasRoot, citySummary, generatedAt) {
  const cityDir = path.join(atlasRoot, "cities", citySummary.city_id);
  const cityPath = path.join(cityDir, "city.json");
  const sourcesPath = path.join(cityDir, "sources.json");
  const eventsPath = path.join(cityDir, "events.json");
  const city = readJson(cityPath);
  const sourcesPayload = readJson(sourcesPath);
  const eventsIndex = readJson(eventsPath);
  const sources = sourcesPayload.sources || [];
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  const events = collectEvents(root, eventsIndex);
  const scope = CITY_SCOPE[citySummary.city_id] || {
    official_boundary: {
      label: city.display_name,
      source_name: "City adapter configuration",
      publisher: "Bims city adapter",
      source_url: "",
      source_type: "configured boundary/bounds",
      licence: "See city source registry",
      licence_url: "",
      attribution_text: "See city source registry",
      accessed_at: generatedAt,
      source_ids: [],
    },
    admin_overlays: [],
    scope_note: "City boundary scope is defined by the city adapter.",
  };

  const lensYearCoverage = buildLensYearCoverage(root, citySummary, city, eventsIndex, events, sourceById, generatedAt);
  const rowsByLens = new Map();
  for (const row of lensYearCoverage.coverage.rows || []) {
    if (!rowsByLens.has(row.lens_slug)) rowsByLens.set(row.lens_slug, []);
    rowsByLens.get(row.lens_slug).push(row);
  }
  const lensRows = LENS_DEFINITIONS.map((lens) => (
    summarizeLens(citySummary.city_id, lens, events, sourceById, rowsByLens.get(lens.slug) || [], lensYearCoverage.relative_path)
  ));
  const manifest = {
    schema_version: SCHEMA_VERSION,
    artifact_kind: "bims_15_lens_city_manifest",
    generated_at: generatedAt,
    city_id: citySummary.city_id,
    display_name: city.display_name,
    contract_source: CONTRACT_DOC,
    visual_reference_set: REFERENCE_SCREENS,
    launched_city: true,
    official_scope: scope,
    lens_year_coverage_path: lensYearCoverage.relative_path,
    lens_count: lensRows.length,
    lenses: lensRows,
  };

  const manifestPath = path.join(cityDir, "lens_manifest.json");
  writeJson(manifestPath, manifest);

  const relativeManifestPath = relativeFromRoot(root, manifestPath);
  city.artifact_paths = {
    ...(city.artifact_paths || {}),
    lens_manifest: relativeManifestPath,
    lens_year_coverage: lensYearCoverage.relative_path,
  };
  writeJson(cityPath, city, { compact: true });
  citySummary.artifact_paths = {
    ...(citySummary.artifact_paths || {}),
    lens_manifest: relativeManifestPath,
    lens_year_coverage: lensYearCoverage.relative_path,
  };
  return { manifest, relative_path: relativeManifestPath };
}

function buildLensManifest(args) {
  const root = args.root;
  const atlasRoot = resolve(root, args.atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  const index = readJson(indexPath);
  const cityManifests = [];
  for (const citySummary of index.cities || []) {
    cityManifests.push(buildCityManifest(root, atlasRoot, citySummary, args.generatedAt));
  }

  const topManifestPath = path.join(atlasRoot, "lens-manifest.json");
  const topManifest = {
    schema_version: SCHEMA_VERSION,
    artifact_kind: "bims_15_lens_manifest_index",
    generated_at: args.generatedAt,
    contract_source: CONTRACT_DOC,
    visual_reference_set: REFERENCE_SCREENS,
    lens_count: LENS_DEFINITIONS.length,
    lenses: LENS_DEFINITIONS.map((lens) => ({
      slug: lens.slug,
      public_label: lens.label,
      group: lens.group,
      primary_selectable_object_type: lens.primary_object_type,
      visual_metaphor: lens.visual_metaphor,
      color_role: lens.color_role,
    })),
    cities: cityManifests.map(({ manifest, relative_path }) => ({
      city_id: manifest.city_id,
      display_name: manifest.display_name,
      lens_count: manifest.lens_count,
      lens_manifest_path: relative_path,
      lens_year_coverage_path: manifest.lens_year_coverage_path,
      official_boundary: manifest.official_scope.official_boundary,
      lenses: manifest.lenses.map((lens) => ({
        slug: lens.slug,
        public_label: lens.public_label,
        event_count: lens.coverage.event_count,
        compatible_event_count: lens.coverage.compatible_event_count,
        source_count: lens.coverage.source_count,
        compatible_source_count: lens.coverage.compatible_source_count,
        last_retrieved_or_reviewed: lens.freshness.last_retrieved_or_reviewed,
        year_contract: lens.coverage.year_contract,
      })),
    })),
  };
  writeJson(topManifestPath, topManifest);

  index.contracts = {
    ...(index.contracts || {}),
    lens_manifest_schema: "schemas/lens_manifest.schema.json",
    lens_year_coverage_schema: LENS_YEAR_COVERAGE_SCHEMA,
  };
  index.lens_manifest_path = relativeFromRoot(root, topManifestPath);
  writeJson(indexPath, index);
  return topManifest;
}

function main() {
  try {
    const manifest = buildLensManifest(parseArgs(process.argv));
    console.log(`15-lens manifest ready: ${manifest.cities.length} cities, ${manifest.lens_count} lenses.`);
  } catch (error) {
    console.error(`build:lens-contract failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  buildLensManifest,
  parseArgs,
  summarizeLens,
};
