const fs = require("fs");
const path = require("path");
const {
  LENS_DEFINITIONS,
  LENS_SLUGS,
  eventDirectlyMatchesLensCategory,
  eventMatchesLens,
  eventWithholdsMapGeometry,
  licenseNeedsReview,
  sourceHasMinimumLicense,
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");
const { validateValue } = require("./validate_city_atlas_schema");

const REQUIRED_EXPORTS = [
  "selected_object_markdown",
  "filtered_view_csv",
  "filtered_view_geojson",
  "includes_citations_licenses_dates_confidence_limitations",
];
const REQUIRED_LENS_YEARS = Array.from({ length: 20 }, (_, index) => 2007 + index);
const LENS_BY_SLUG = new Map(LENS_DEFINITIONS.map((lens) => [lens.slug, lens]));

const BANNED = [
  /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b/i,
  /\bcaused?\b/i,
  /\bpredicts?\b/i,
  /\bprediction\b/i,
  /\bforecast(ed|s|ing)?\b/i,
  /\bsimulation result\b/i,
  /\bimpact score\b/i,
  /\bfake density\b/i,
];

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    atlasDir: "web/data/city-atlas",
    schemaPath: "schemas/lens_manifest.schema.json",
    lensYearCoverageSchemaPath: "schemas/lens_year_coverage.schema.json",
    contractPath: "docs/15_lens_city_design_contract.md",
    referenceDir: "tmp/reference-screens",
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
    } else if (arg === "--schema") {
      args.schemaPath = next;
      index += 1;
    } else if (arg === "--lens-year-coverage-schema") {
      args.lensYearCoverageSchemaPath = next;
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
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(failures, message) {
  failures.push(message);
}

function assert(failures, condition, message) {
  if (!condition) fail(failures, message);
}

function walkStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => walkStrings(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => walkStrings(item, out));
  }
  return out;
}

function assertNoOverclaim(failures, label, payload) {
  const joined = walkStrings(payload).join("\n");
  for (const regex of BANNED) {
    assert(failures, !regex.test(joined), `${label} contains overclaiming language: ${regex}`);
  }
}

function eventHasCompatibleSources(event, sourceById) {
  const sources = (event.source_ids || event.sourceIds || []).map((sourceId) => sourceById.get(sourceId));
  return sources.length > 0
    && sources.every((source) => sourceHasMinimumLicense(source) && !licenseNeedsReview(source));
}

function eventSourceIds(event) {
  return event.source_ids || event.sourceIds || [];
}

function sortedUniqueSourceIds(events) {
  const sourceIds = new Set();
  for (const event of events || []) {
    for (const sourceId of eventSourceIds(event)) sourceIds.add(sourceId);
  }
  return [...sourceIds].sort();
}

function arraysEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function lensDetailPath(citySummary, cityArtifact, year) {
  const template = citySummary.artifact_paths?.lens_detail_template || cityArtifact.artifact_paths?.lens_detail_template;
  return template ? template.replace("{year}", String(year)) : "";
}

function readLensDetail(root, citySummary, cityArtifact, year, cache) {
  const key = `${citySummary.city_id}:${year}`;
  if (cache.has(key)) return cache.get(key);
  const artifactPath = lensDetailPath(citySummary, cityArtifact, year);
  const payload = artifactPath && fs.existsSync(resolve(root, artifactPath))
    ? readJson(resolve(root, artifactPath))
    : null;
  const features = Array.isArray(payload?.features) ? payload.features : [];
  cache.set(key, features);
  return features;
}

function compatibleLensEventsForRow(root, row, eventsIndex, sourceById, eventCache) {
  const chunk = (eventsIndex.chunks || []).find((item) => Number(item.year) === Number(row.year));
  if (!chunk?.json_path || !fs.existsSync(resolve(root, chunk.json_path))) return [];
  if (!eventCache.has(row.year)) {
    eventCache.set(row.year, readJson(resolve(root, chunk.json_path)).events || []);
  }
  const lens = LENS_BY_SLUG.get(row.lens_slug);
  return (eventCache.get(row.year) || [])
    .filter((event) => eventMatchesLens(event, lens, sourceById) && eventHasCompatibleSources(event, sourceById))
}

function directCompatibleLensEventsForRow(root, row, eventsIndex, sourceById, eventCache) {
  const lens = LENS_BY_SLUG.get(row.lens_slug);
  return compatibleLensEventsForRow(root, row, eventsIndex, sourceById, eventCache)
    .filter((event) => eventDirectlyMatchesLensCategory(event, lens));
}

function eventHasMapEligibleSources(event, sourceById) {
  const sourceIds = event.source_ids || event.sourceIds || [];
  return eventHasCompatibleSources(event, sourceById)
    && !eventWithholdsMapGeometry(event)
    && sourceIds.every((sourceId) => !sourceWithholdsMapGeometry(sourceById.get(sourceId)));
}

function mapEligibleEvents(events, sourceById) {
  return events.filter((event) => event.geometry && eventHasMapEligibleSources(event, sourceById));
}

function validateReferenceScreens(root, referenceDir, failures) {
  const dir = resolve(root, referenceDir);
  assert(failures, fs.existsSync(dir), `Missing reference screen directory ${referenceDir}`);
  if (!fs.existsSync(dir)) return;
  const files = new Set(fs.readdirSync(dir).filter((name) => /\.(png|jpe?g|webp)$/i.test(name)));
  for (const slug of LENS_SLUGS) {
    assert(failures, files.has(`${slug}.jpg`) || files.has(`${slug}.png`) || files.has(`${slug}.webp`), `Missing reference screen for ${slug}`);
  }
}

function validateLensRow(failures, label, lens, sourceById) {
  assert(failures, LENS_SLUGS.includes(lens.slug), `${label} has unexpected lens slug ${lens.slug}`);
  assert(failures, Boolean(lens.public_label), `${label} missing public_label`);
  assert(failures, Boolean(lens.primary_selectable_object_type), `${label} missing primary selectable object type`);
  assert(failures, Boolean(lens.visual_metaphor), `${label} missing visual metaphor`);
  assert(failures, Boolean(lens.color_role), `${label} missing color role`);
  assert(failures, lens.full_city_scope_required === true, `${label} must require full city scope`);
  assert(failures, lens.coverage?.event_count > 0, `${label} has no source-backed events`);
  assert(failures, lens.coverage?.compatible_event_count > 0, `${label} has no license-compatible events`);
  assert(failures, lens.coverage?.event_count === lens.coverage?.compatible_event_count, `${label} includes events outside launched license-compatible coverage`);
  assert(failures, (lens.coverage?.review_required_event_count || 0) === 0, `${label} launched coverage includes review-required events`);
  assert(failures, lens.coverage?.source_count > 0, `${label} has no sources`);
  assert(failures, lens.coverage?.compatible_source_count > 0, `${label} has no license-compatible sources`);
  assert(failures, lens.coverage?.source_count === lens.coverage?.compatible_source_count, `${label} includes sources outside launched license-compatible coverage`);
  assert(failures, (lens.coverage?.review_required_source_count || 0) === 0, `${label} launched coverage includes review-required sources`);
  assert(failures, Array.isArray(lens.coverage?.caveats) && lens.coverage.caveats.length > 0, `${label} missing coverage caveats`);
  assert(failures, lens.coverage?.year_contract?.required_years?.start === 2007, `${label} year contract must start at 2007`);
  assert(failures, lens.coverage?.year_contract?.required_years?.end === 2026, `${label} year contract must end at 2026`);
  assert(failures, lens.coverage?.year_contract?.required_year_count === 20, `${label} year contract must require 20 years`);
  assert(
    failures,
    Number(lens.coverage?.year_contract?.visible_year_count || 0) <= Number(lens.coverage?.year_contract?.source_backed_record_year_count || 0),
    `${label} visible years must be a subset of real source-backed record years`,
  );
  assert(failures, (lens.coverage?.year_contract?.source_backed_context_year_count || 0) === 0, `${label} must not use context-only years`);
  assert(failures, Boolean(lens.coverage?.year_contract?.lens_year_coverage_path), `${label} missing lens_year_coverage_path`);
  assert(failures, Boolean(lens.freshness?.last_retrieved_or_reviewed), `${label} missing freshness retrieval/review date`);
  assert(failures, Boolean(lens.freshness?.source_coverage_period), `${label} missing source coverage period`);
  assert(failures, Boolean(lens.freshness?.update_cadence), `${label} missing update cadence`);
  assert(failures, Array.isArray(lens.provenance?.source_ids) && lens.provenance.source_ids.length > 0, `${label} missing provenance source_ids`);
  assert(failures, Array.isArray(lens.provenance?.compatible_source_ids) && lens.provenance.compatible_source_ids.length === lens.provenance.source_ids.length, `${label} compatible_source_ids must match launched source_ids`);
  assert(failures, !Array.isArray(lens.provenance?.review_required_source_ids) || lens.provenance.review_required_source_ids.length === 0, `${label} launched provenance contains review-required source ids`);
  assert(failures, Boolean(lens.provenance?.transformation_method), `${label} missing transformation method`);
  assert(failures, Boolean(lens.provenance?.methodology_path), `${label} missing methodology path`);
  assert(failures, Boolean(lens.provenance?.correction_path), `${label} missing correction path`);

  for (const key of REQUIRED_EXPORTS) {
    assert(failures, lens.exports?.[key] === true, `${label} export flag ${key} must be true`);
  }

  for (const sourceId of lens.provenance.source_ids || []) {
    const source = sourceById.get(sourceId);
    assert(failures, Boolean(source), `${label} references missing source ${sourceId}`);
    if (source) {
      validateSourceMinimumLicense(failures, label, sourceId, source);
    }
  }

  for (const source of lens.provenance.source_samples || []) {
    assert(failures, source.licence_review_required !== true, `${label} source sample ${source.source_id || source.title || "unknown"} still needs licence review`);
  }
}

function validateSourceMinimumLicense(failures, label, sourceId, source) {
  assert(failures, Boolean(source.licence), `${label} source ${sourceId} missing licence`);
  assert(failures, Boolean(source.licence_url), `${label} source ${sourceId} missing licence_url`);
  assert(failures, Boolean(source.attribution_text), `${label} source ${sourceId} missing attribution_text`);
}

function validateCityManifest(root, atlasRoot, schema, lensYearCoverageSchema, citySummary, failures) {
  const cityDir = path.join(atlasRoot, "cities", citySummary.city_id);
  const cityPath = path.join(cityDir, "city.json");
  const manifestPath = resolve(root, citySummary.artifact_paths?.lens_manifest || path.join(cityDir, "lens_manifest.json"));
  const sourcesPath = path.join(cityDir, "sources.json");
  const eventsPath = resolve(root, citySummary.artifact_paths?.events || path.join(cityDir, "events.json"));
  assert(failures, fs.existsSync(cityPath), `${citySummary.city_id} missing city artifact`);
  assert(failures, fs.existsSync(manifestPath), `${citySummary.city_id} missing lens manifest`);
  assert(failures, fs.existsSync(sourcesPath), `${citySummary.city_id} missing source artifact`);
  assert(failures, fs.existsSync(eventsPath), `${citySummary.city_id} missing event index`);
  if (!fs.existsSync(cityPath) || !fs.existsSync(manifestPath) || !fs.existsSync(sourcesPath) || !fs.existsSync(eventsPath)) return null;

  const cityArtifact = readJson(cityPath);
  const manifest = readJson(manifestPath);
  const eventsIndex = readJson(eventsPath);
  const cityPaths = cityArtifact.artifact_paths || {};
  const summaryPaths = citySummary.artifact_paths || {};
  const schemaFailures = [];
  validateValue(manifest, schema, rel(root, manifestPath), schemaFailures, schema);
  schemaFailures.forEach((message) => fail(failures, message));
  assertNoOverclaim(failures, rel(root, manifestPath), manifest);

  const sources = readJson(sourcesPath).sources || [];
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  assert(failures, manifest.artifact_kind === "bims_15_lens_city_manifest", `${citySummary.city_id} has wrong lens manifest kind`);
  assert(failures, manifest.city_id === citySummary.city_id, `${citySummary.city_id} manifest city_id mismatch`);
  assert(failures, manifest.contract_source === "docs/15_lens_city_design_contract.md", `${citySummary.city_id} manifest contract_source mismatch`);
  assert(failures, manifest.visual_reference_set === "tmp/reference-screens", `${citySummary.city_id} manifest visual reference mismatch`);
  assert(failures, manifest.lens_count === 15, `${citySummary.city_id} must have 15 lenses`);
  assert(failures, Boolean(manifest.lens_year_coverage_path), `${citySummary.city_id} manifest missing lens_year_coverage_path`);
  for (const key of ["lens_manifest", "lens_year_coverage"]) {
    assert(failures, Boolean(summaryPaths[key]), `Atlas index ${citySummary.city_id} missing artifact_paths.${key}`);
    assert(failures, Boolean(cityPaths[key]), `City artifact ${citySummary.city_id} missing artifact_paths.${key}`);
    if (summaryPaths[key] && cityPaths[key]) {
      assert(failures, summaryPaths[key] === cityPaths[key], `${citySummary.city_id} artifact_paths.${key} differs between index and city artifact`);
    }
  }
  assert(failures, manifest.launched_city === true, `${citySummary.city_id} must be marked launched_city true`);
  assert(failures, Boolean(manifest.official_scope?.official_boundary?.licence), `${citySummary.city_id} missing official boundary licence`);
  assert(failures, Boolean(manifest.official_scope?.official_boundary?.source_url), `${citySummary.city_id} missing official boundary source_url`);
  for (const sourceId of manifest.official_scope?.official_boundary?.source_ids || []) {
    const source = sourceById.get(sourceId);
    assert(failures, Boolean(source), `${citySummary.city_id} official boundary source ${sourceId} is not registered in sources artifact`);
    if (source) validateSourceMinimumLicense(failures, `${citySummary.city_id} official boundary`, sourceId, source);
  }
  assert(failures, Boolean(manifest.official_scope?.scope_note), `${citySummary.city_id} missing official scope note`);
  validateAreaFacets(failures, citySummary.city_id, eventsIndex);
  validateRequiredYearArtifacts(root, failures, citySummary, cityArtifact, eventsIndex);
  validateLensYearCoverage(root, lensYearCoverageSchema, citySummary, cityArtifact, manifest, eventsIndex, sourceById, failures);

  const slugs = (manifest.lenses || []).map((lens) => lens.slug);
  assert(failures, slugs.length === 15, `${citySummary.city_id} lens list must contain 15 rows`);
  for (const slug of LENS_SLUGS) {
    assert(failures, slugs.includes(slug), `${citySummary.city_id} missing lens ${slug}`);
  }
  for (const lens of manifest.lenses || []) {
    validateLensRow(failures, `${citySummary.city_id}/${lens.slug}`, lens, sourceById);
  }
  return manifest;
}

function validateAreaFacets(failures, cityId, eventsIndex) {
  assert(failures, Array.isArray(eventsIndex.chunks) && eventsIndex.chunks.length > 0, `${cityId} event index missing chunks`);
  for (const chunk of eventsIndex.chunks || []) {
    const label = `${cityId}/${chunk.year}`;
    assert(failures, chunk.area_facet_basis === "affected_area.label", `${label} area facets must be derived from affected_area.label`);
    assert(failures, Array.isArray(chunk.area_facets), `${label} missing area facets for admin/area filtering`);
    if (!Array.isArray(chunk.area_facets)) continue;
    const total = chunk.area_facets.reduce((sum, facet) => sum + Number(facet.count || 0), 0);
    assert(failures, total === Number(chunk.event_count || 0), `${label} area facet total must match event_count`);
    assert(failures, Number(chunk.area_facet_count || 0) === chunk.area_facets.length, `${label} area_facet_count mismatch`);
    for (const facet of chunk.area_facets) {
      assert(failures, Boolean(facet.label), `${label} area facet missing label`);
      assert(failures, Boolean(facet.search_text), `${label} area facet missing search_text`);
      assert(failures, facet.basis === "affected_area.label", `${label} area facet ${facet.label || "unknown"} has wrong basis`);
      assert(failures, facet.count > 0, `${label} area facet ${facet.label || "unknown"} has no records`);
      assert(failures, facet.counts_by_category && typeof facet.counts_by_category === "object", `${label} area facet ${facet.label || "unknown"} missing category counts`);
      assert(failures, facet.counts_by_category_confidence && typeof facet.counts_by_category_confidence === "object", `${label} area facet ${facet.label || "unknown"} missing confidence counts`);
    }
  }
}

function validateRequiredYearArtifacts(root, failures, citySummary, cityArtifact, eventsIndex) {
  const chunksByYear = new Map((eventsIndex.chunks || []).map((chunk) => [Number(chunk.year), chunk]));
  for (const year of REQUIRED_LENS_YEARS) {
    const chunk = chunksByYear.get(year);
    assert(failures, Boolean(chunk), `${citySummary.city_id} missing required ${year} event chunk`);
    if (chunk) {
      assert(failures, fs.existsSync(resolve(root, chunk.json_path)), `${citySummary.city_id} missing required ${year} event JSON`);
      assert(failures, fs.existsSync(resolve(root, chunk.geojson_path)), `${citySummary.city_id} missing required ${year} event GeoJSON`);
    }
    const detailPath = lensDetailPath(citySummary, cityArtifact, year);
    assert(failures, Boolean(detailPath), `${citySummary.city_id} missing lens_detail_template for required years`);
    if (detailPath) {
      assert(failures, fs.existsSync(resolve(root, detailPath)), `${citySummary.city_id} missing required ${year} lens detail GeoJSON`);
    }
  }
}

function validateCoverageRow(failures, root, row, citySummary, cityArtifact, sourceById, eventsIndex, detailCache, eventCache) {
  const label = `${citySummary.city_id}/${row.lens_slug}/${row.year}`;
  const lens = LENS_BY_SLUG.get(row.lens_slug);
  assert(failures, Boolean(lens), `${label} has unknown lens`);
  if (lens) {
    assert(failures, row.group === lens.group, `${label} group mismatch`);
    assert(failures, row.category === lens.category, `${label} category mismatch`);
  }
  assert(failures, row.required_year === true, `${label} must be marked required_year`);
  assert(failures, !/context/i.test(row.status || ""), `${label} must not use generated filler status`);
  assert(failures, row.compatible_event_count === row.event_count, `${label} compatible_event_count must match launched event_count`);
  assert(failures, row.broad_match_event_count === row.event_count, `${label} broad_match_event_count must preserve event_count semantics`);
  assert(failures, row.broad_match_compatible_event_count === row.compatible_event_count, `${label} broad_match_compatible_event_count must preserve compatible_event_count semantics`);
  assert(failures, row.direct_compatible_event_count === row.direct_event_count, `${label} direct_compatible_event_count must match direct_event_count`);
  assert(failures, Number(row.direct_event_count || 0) <= Number(row.event_count || 0), `${label} direct_event_count must not exceed event_count`);
  assert(failures, row.headline_count_included === row.direct_event_count, `${label} headline_count_included must equal direct_event_count`);
  assert(failures, Number(row.coverage_context_feature_count || 0) === 0, `${label} must not expose generated filler features`);
  assert(failures, Number(row.headline_count_excluded_context_features || 0) === 0, `${label} must not hide generated context features from headline counts`);
  assert(failures, Array.isArray(row.limitations) && row.limitations.length > 0, `${label} missing limitations`);
  assert(failures, row.exports?.markdown === true && row.exports?.csv === true && row.exports?.geojson === true, `${label} missing required exports`);

  const actualCompatibleEvents = compatibleLensEventsForRow(root, row, eventsIndex, sourceById, eventCache);
  const actualDirectCompatibleEvents = directCompatibleLensEventsForRow(root, row, eventsIndex, sourceById, eventCache);
  const actualMapEligibleEvents = mapEligibleEvents(actualCompatibleEvents, sourceById);
  const actualDirectMapEligibleEvents = mapEligibleEvents(actualDirectCompatibleEvents, sourceById);
  const actualBroadSourceIds = sortedUniqueSourceIds(actualCompatibleEvents);
  const actualDirectSourceIds = sortedUniqueSourceIds(actualDirectCompatibleEvents);
  assert(failures, row.event_count === actualCompatibleEvents.length, `${label} event_count ${row.event_count} does not match source-backed events ${actualCompatibleEvents.length}`);
  assert(failures, row.direct_event_count === actualDirectCompatibleEvents.length, `${label} direct_event_count ${row.direct_event_count} does not match direct same-category events ${actualDirectCompatibleEvents.length}`);
  assert(failures, row.visible_map_contract === (actualDirectMapEligibleEvents.length > 0), `${label} visibility must follow direct map-eligible same-category source-backed event records`);
  assert(failures, Number(row.map_event_count || 0) === actualMapEligibleEvents.length, `${label} map_event_count ${row.map_event_count || 0} does not match map-eligible events ${actualMapEligibleEvents.length}`);
  assert(failures, Number(row.map_direct_event_count || 0) === actualDirectMapEligibleEvents.length, `${label} map_direct_event_count ${row.map_direct_event_count || 0} does not match direct map-eligible events ${actualDirectMapEligibleEvents.length}`);
  assert(failures, Number(row.withheld_geometry_event_count || 0) === Math.max(0, actualCompatibleEvents.length - actualMapEligibleEvents.length), `${label} withheld_geometry_event_count mismatch`);
  assert(failures, Number(row.direct_withheld_geometry_event_count || 0) === Math.max(0, actualDirectCompatibleEvents.length - actualDirectMapEligibleEvents.length), `${label} direct_withheld_geometry_event_count mismatch`);

  const sourceIds = row.source_ids || [];
  assert(failures, Number(row.broad_match_source_count || 0) === sourceIds.length, `${label} broad_match_source_count must match source_ids length`);
  assert(failures, arraysEqual(row.broad_match_source_ids || [], sourceIds), `${label} broad_match_source_ids must match source_ids`);
  assert(failures, arraysEqual(sourceIds.slice().sort(), actualBroadSourceIds), `${label} source_ids must match compatible broad source-backed events`);
  assert(failures, Number(row.direct_source_count || 0) === (row.direct_source_ids || []).length, `${label} direct_source_count must match direct_source_ids length`);
  assert(failures, arraysEqual((row.direct_source_ids || []).slice().sort(), actualDirectSourceIds), `${label} direct_source_ids must match direct same-category source-backed events`);
  if (row.event_count > 0) {
    assert(failures, sourceIds.length > 0, `${label} missing source_ids`);
    for (const sourceId of sourceIds) {
      const source = sourceById.get(sourceId);
      assert(failures, Boolean(source), `${label} references missing source ${sourceId}`);
      if (source) {
        validateSourceMinimumLicense(failures, label, sourceId, source);
        assert(failures, sourceHasMinimumLicense(source), `${label} source ${sourceId} missing minimum license fields`);
        assert(failures, !licenseNeedsReview(source), `${label} source ${sourceId} still needs license review`);
      }
    }
  } else {
    assert(failures, sourceIds.length === 0, `${label} missing-source rows must not borrow boundary/context sources`);
  }

  for (const artifactPath of Object.values(row.map_artifacts || {})) {
    assert(failures, Boolean(artifactPath), `${label} missing map artifact path`);
    if (artifactPath) assert(failures, fs.existsSync(resolve(root, artifactPath)), `${label} map artifact missing: ${artifactPath}`);
  }

  if (row.direct_event_count > 0) {
    assert(failures, row.status === "source_backed_records", `${label} with direct records must use source_backed_records status`);
    if (!row.visible_map_contract) {
      assert(failures, Number(row.direct_withheld_geometry_event_count || 0) > 0, `${label} with direct records but no map visibility must disclose withheld geometry count`);
      assert(failures, /withheld.*rights review|geometry withheld/i.test((row.limitations || []).join(" ")), `${label} missing geometry-withheld limitation`);
    }
    return;
  }

  if (row.event_count > 0) {
    assert(failures, row.status === "adjacent_source_backed_records", `${label} with broad-only records must use adjacent_source_backed_records status`);
    assert(failures, row.visible_map_contract === false, `${label} broad-only records must not be visible as direct map coverage`);
    assert(failures, /adjacent[- ]evidence/i.test((row.limitations || []).join(" ")), `${label} broad-only row missing adjacent-evidence limitation`);
    return;
  }

  assert(failures, row.status === "missing_source_backed_view", `${label} without records must stay missing, not filled with context geometry`);
  assert(failures, row.visible_map_contract === false, `${label} without records must not be visible on the map`);
  assert(failures, /No map marks or coverage surfaces are generated/i.test((row.limitations || []).join(" ")), `${label} missing plain no-filler limitation`);
}

function validateLensYearCoverage(root, schema, citySummary, cityArtifact, manifest, eventsIndex, sourceById, failures) {
  const coveragePath = resolve(root, manifest.lens_year_coverage_path || citySummary.artifact_paths?.lens_year_coverage || path.join("web/data/city-atlas/cities", citySummary.city_id, "lens_year_coverage.json"));
  assert(failures, fs.existsSync(coveragePath), `${citySummary.city_id} missing lens year coverage artifact`);
  if (!fs.existsSync(coveragePath)) return null;
  const coverage = readJson(coveragePath);
  const schemaFailures = [];
  validateValue(coverage, schema, rel(root, coveragePath), schemaFailures, schema);
  schemaFailures.forEach((message) => fail(failures, message));
  assertNoOverclaim(failures, rel(root, coveragePath), coverage);
  assert(failures, coverage.artifact_kind === "bims_lens_year_coverage", `${citySummary.city_id} lens year coverage wrong artifact kind`);
  assert(failures, coverage.city_id === citySummary.city_id, `${citySummary.city_id} lens year coverage city mismatch`);
  assert(failures, coverage.contract_source === "docs/15_lens_city_design_contract.md", `${citySummary.city_id} lens year coverage contract mismatch`);
  assert(failures, coverage.required_years?.start === 2007 && coverage.required_years?.end === 2026, `${citySummary.city_id} lens year coverage must require 2007-2026`);
  assert(failures, coverage.required_row_count === 300 && coverage.row_count === 300, `${citySummary.city_id} lens year coverage must contain 300 rows`);

  const rows = coverage.rows || [];
  const seen = new Set();
  const detailCache = new Map();
  const eventCache = new Map();
  for (const row of rows) {
    const key = `${row.lens_slug}:${row.year}`;
    assert(failures, !seen.has(key), `${citySummary.city_id} duplicate lens-year row ${key}`);
    seen.add(key);
    validateCoverageRow(failures, root, row, citySummary, cityArtifact, sourceById, eventsIndex, detailCache, eventCache);
  }
  for (const slug of LENS_SLUGS) {
    for (const year of REQUIRED_LENS_YEARS) {
      assert(failures, seen.has(`${slug}:${year}`), `${citySummary.city_id} missing lens-year row ${slug}/${year}`);
    }
  }
  return coverage;
}

function verify(args) {
  const failures = [];
  const root = args.root;
  const atlasRoot = resolve(root, args.atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  const topManifestPath = path.join(atlasRoot, "lens-manifest.json");
  const schema = readJson(resolve(root, args.schemaPath));
  const lensYearCoverageSchema = readJson(resolve(root, args.lensYearCoverageSchemaPath));

  assert(failures, fs.existsSync(resolve(root, args.contractPath)), `Missing contract doc ${args.contractPath}`);
  validateReferenceScreens(root, args.referenceDir, failures);
  assert(failures, fs.existsSync(indexPath), `Missing atlas index ${rel(root, indexPath)}`);
  assert(failures, fs.existsSync(topManifestPath), `Missing top lens manifest ${rel(root, topManifestPath)}`);
  if (!fs.existsSync(indexPath) || !fs.existsSync(topManifestPath)) return failures;

  const index = readJson(indexPath);
  const topManifest = readJson(topManifestPath);
  assertNoOverclaim(failures, rel(root, topManifestPath), topManifest);
  assert(failures, index.lens_manifest_path === "web/data/city-atlas/lens-manifest.json", "Atlas index missing lens_manifest_path");
  assert(failures, index.contracts?.lens_manifest_schema === "schemas/lens_manifest.schema.json", "Atlas index missing lens manifest schema contract");
  assert(failures, index.contracts?.lens_year_coverage_schema === "schemas/lens_year_coverage.schema.json", "Atlas index missing lens year coverage schema contract");
  assert(failures, topManifest.lens_count === 15, "Top lens manifest must declare 15 lenses");
  assert(failures, Array.isArray(topManifest.cities), "Top lens manifest missing city list");

  for (const citySummary of index.cities || []) {
    validateCityManifest(root, atlasRoot, schema, lensYearCoverageSchema, citySummary, failures);
  }
  return failures;
}

function main() {
  try {
    const failures = verify(parseArgs(process.argv));
    if (failures.length) {
      console.error("15-lens contract verification failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
    console.log("15-lens contract OK: launched cities expose 15 lens-year audit rows for every year 2007-2026; visible rows are source-backed and zero-event rows stay explicit, invisible, and filler-free.");
  } catch (error) {
    console.error(`verify:lens-contract failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  parseArgs,
  verify,
};
