const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round204_nyc_lpc_permit_next9_candidates.js");
const ROOT = path.resolve(__dirname, "..");
const ROUND = 590;
const NEXT = "next94";
const ACCESSED_AT = "2026-05-20";
const OUT_DIR_NAME = `round${ROUND}_nyc_lpc_permit_${NEXT}`;
const OUT_DIR = path.join(ROOT, "tmp", "subagents", OUT_DIR_NAME);
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");
const VALIDATION_REPORT_PATH = path.join(OUT_DIR, "validation_report.json");
const VALIDATION_PATH = path.join(OUT_DIR, "validation.json");
const READBACK_PATH = path.join(OUT_DIR, "readback.json");
const STRICT_DUPLICATE_AUDIT_PATH = path.join(OUT_DIR, "strict_duplicate_audit.json");
const ROUND586_PACK = "tmp/subagents/round586_nyc_lpc_permit_next93/candidates.json";
const ROUND586_STRICT_AUDIT_PATH = path.join(ROOT, "tmp", "subagents", "round586_nyc_lpc_permit_next93", "strict_duplicate_audit.json");
const ROUND586_SUMMARY_PATH = path.join(ROOT, "tmp", "subagents", "round586_nyc_lpc_permit_next93", "summary.json");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round590 template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

function replaceRegexOnce(source, regex, replacement, label) {
  if (!regex.test(source)) {
    throw new Error(`Round590 template marker not found: ${label}`);
  }
  return source.replace(regex, replacement);
}

function readTextIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function readJsonIfExists(file) {
  const text = readTextIfExists(file);
  if (!text) return null;
  return JSON.parse(text);
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function cleanRelativePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function loadPriorPackPathsThroughRound586() {
  const strictAudit = readJsonIfExists(ROUND586_STRICT_AUDIT_PATH);
  let paths = strictAudit?.dedupe_boundary?.prior_lpc_packs_scanned;

  if (!Array.isArray(paths) || paths.length === 0) {
    const summary = readJsonIfExists(ROUND586_SUMMARY_PATH);
    paths = (summary?.dedupe_inputs?.scanned_files || []).filter((relative) =>
      cleanRelativePath(relative).startsWith("tmp/subagents/")
    );
  }

  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("Could not load prior NYC LPC pack list from Round586 outputs");
  }

  const unique = [];
  for (const relative of [...paths, ROUND586_PACK]) {
    const cleaned = cleanRelativePath(relative);
    if (cleaned && !unique.includes(cleaned)) unique.push(cleaned);
  }
  if (!unique.includes(ROUND586_PACK)) {
    throw new Error("Round590 prior-pack list does not include Round586");
  }
  return unique;
}

function priorPackPathsSource() {
  return `const PRIOR_PACK_PATHS = ${JSON.stringify(loadPriorPackPathsThroughRound586(), null, 2)};`;
}

function normalizeRound590Names(text) {
  return text
    .replace(/round590_nyc_lpc_permit_next944/g, "round590_nyc_lpc_permit_next94")
    .replace(/next944/g, "next94")
    .replace(/Next944/g, "Next94");
}

function validationReportForOutputsTemplate(existing) {
  const errors = [];
  const warnings = [];
  const checkedFilePaths = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    NOTES_PATH,
    REJECTED_PATH,
    VALIDATION_REPORT_PATH
  ];
  const checkedFiles = checkedFilePaths.map((file) => path.relative(ROOT, file));
  const requiredGeneratedBeforeReport = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    NOTES_PATH,
    REJECTED_PATH
  ];

  for (const file of requiredGeneratedBeforeReport) {
    if (!fs.existsSync(file)) errors.push(`missing generated file ${path.relative(ROOT, file)}`);
  }

  const candidatesPayload = readJsonIfExists(CANDIDATES_PATH) || {};
  const sourceAudit = readJsonIfExists(SOURCE_AUDIT_PATH) || {};
  const summary = readJsonIfExists(SUMMARY_PATH) || {};
  const notesText = readTextIfExists(NOTES_PATH);
  const rejectedPayload = readJsonIfExists(REJECTED_PATH) || {};
  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const source = Array.isArray(sourceAudit.sources) ? sourceAudit.sources[0] || {} : {};

  const requiredCandidateFields = [
    "city_id",
    "event_id",
    "candidate_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "effective_date",
    "date_precision",
    "address",
    "borough",
    "geometry",
    "geometry_ref",
    "latitude",
    "longitude",
    "source_id",
    "source_name",
    "publisher",
    "source_url",
    "source_record_id",
    "source_type",
    "accessed_at",
    "retrieved_at",
    "source_date_field",
    "source_dataset_id",
    "confidence",
    "geometry_source",
    "geometry_precision",
    "license",
    "license_or_terms_note",
    "license_url",
    "attribution",
    "limitations",
    "transformation_method",
    "evidence_fields",
    "raw_row_subset"
  ];
  const requiredSourceFields = [
    "source_id",
    "source_dataset_id",
    "source_name",
    "publisher",
    "source_url",
    "metadata_url",
    "api_endpoint",
    "api_query",
    "source_type",
    "attribution",
    "license",
    "license_or_terms_note",
    "license_url",
    "accessed_at",
    "retrieved_at",
    "coverage_years_checked",
    "key_fields_used",
    "reliability",
    "required_caveats",
    "dedupe_inputs"
  ];
  const disallowedOutputTerms = /\b(proof|prediction|predictive|forecast|simulation|simulate|causal|causality)\b|impact score/i;
  const eventIds = new Set();
  const sourceRecordIds = new Set();
  const sourceUrls = new Set();
  const titleDateKeys = new Set();
  const recordDateKeys = new Set();
  const sourceDateKeys = new Set();

  if (candidates.length !== MAX_CANDIDATES) {
    errors.push(`candidate_count expected ${MAX_CANDIDATES}, found ${candidates.length}`);
  }
  if (candidatesPayload.candidate_count !== candidates.length) {
    errors.push("candidates.json candidate_count does not match candidates array length");
  }
  if (summary.candidate_count !== candidates.length) {
    errors.push("summary candidate_count does not match candidates array length");
  }
  if (sourceAudit.generated_at !== summary.generated_at) {
    errors.push("source_audit generated_at does not match summary generated_at");
  }
  if (!notesText.includes("validation_report.json") || !notesText.includes("validation.json") || !notesText.includes("readback.json")) {
    errors.push("notes.md does not list validation/readback outputs");
  }
  if (!rejectedPayload.rejected_counts || typeof rejectedPayload.rejected_counts !== "object") {
    errors.push("rejected.json missing rejected_counts object");
  }

  for (const [index, candidate] of candidates.entries()) {
    const label = candidate.source_record_id || `candidate ${index}`;
    for (const field of requiredCandidateFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${label}: missing ${field}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`${label}: city_id must be nyc`);
    if (candidate.date !== candidate.effective_date) errors.push(`${label}: date and effective_date differ`);
    if (candidate.date < START_DATE || candidate.date > END_DATE) {
      errors.push(`${label}: date outside ${START_DATE}..${END_DATE}`);
    }
    if (!nycPoint({ latitude: candidate.latitude, longitude: candidate.longitude })) {
      errors.push(`${label}: latitude/longitude outside NYC bounds`);
    }
    if (
      candidate.geometry?.type !== "Point" ||
      !Array.isArray(candidate.geometry.coordinates) ||
      candidate.geometry.coordinates.length !== 2
    ) {
      errors.push(`${label}: geometry must be a Point with two coordinates`);
    } else {
      const [lon, lat] = candidate.geometry.coordinates;
      if (Number(lon) !== Number(candidate.longitude) || Number(lat) !== Number(candidate.latitude)) {
        errors.push(`${label}: geometry coordinates do not match latitude/longitude fields`);
      }
    }
    if (candidate.source_dataset_id !== SOURCE_DATASET_ID) errors.push(`${label}: unexpected source_dataset_id`);
    if (candidate.source_date_field !== "issue_date") errors.push(`${label}: unexpected source_date_field`);
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`${label}: accessed_at must be ${ACCESSED_AT}`);
    if (candidate.retrieved_at !== ACCESSED_AT) errors.push(`${label}: retrieved_at must be ${ACCESSED_AT}`);
    if (candidate.confidence !== "documented") errors.push(`${label}: confidence must be documented`);
    if (candidate.license !== "NYC Open Data Terms of Use / NYC.gov Terms of Use") {
      errors.push(`${label}: missing normalized license label`);
    }
    if (candidate.license_url !== NYC_OPEN_DATA_TERMS) errors.push(`${label}: unexpected license_url`);
    if (candidate.source_url !== recordUrl(candidate.source_record_id)) errors.push(`${label}: unexpected source_url`);
    if (!/administrative/i.test(candidate.limitations)) {
      errors.push(`${label}: limitations must identify administrative LPC processing`);
    }
    const checkedEventText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.geometry_precision
    ].join(" ");
    if (disallowedOutputTerms.test(checkedEventText)) {
      errors.push(`${label}: event or caveat text contains disallowed overclaim wording`);
    }
    if (eventIds.has(candidate.event_id)) errors.push(`${label}: duplicate event_id in pack`);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${label}: duplicate source_record_id in pack`);
    if (sourceUrls.has(candidate.source_url)) errors.push(`${label}: duplicate source_url in pack`);
    if (existing.eventIds.has(candidate.event_id)) errors.push(`${label}: event_id already present in overlap inputs`);
    if (existing.recordIds.has(candidate.source_record_id)) errors.push(`${label}: source_record_id already present in overlap inputs`);
    if (existing.sourceUrls.has(candidate.source_url.toLowerCase())) errors.push(`${label}: source_url already present in overlap inputs`);

    const candidateTitleDateKey = titleDateKey(candidate.city_id, candidate.title, candidate.date);
    const candidateRecordDateKey = recordDateKey(candidate.source_record_id, candidate.date);
    const candidateSourceDateKeys = [
      sourceDateKey(candidate.source_id, candidate.source_record_id, candidate.date),
      sourceDateKey(candidate.source_dataset_id, candidate.source_record_id, candidate.date),
      sourceDateKey("nyc-lpc-permit-application-information", candidate.source_record_id, candidate.date),
      sourceDateKey(SOURCE_DATASET_ID, candidate.source_record_id, candidate.date)
    ];
    if (titleDateKeys.has(candidateTitleDateKey)) errors.push(`${label}: duplicate title/date key in pack`);
    if (existing.titleDates.has(candidateTitleDateKey)) errors.push(`${label}: title/date key already present in overlap inputs`);
    if (recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: duplicate record/date key in pack`);
    if (existing.recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: record/date key already present in overlap inputs`);
    for (const key of new Set(candidateSourceDateKeys)) {
      if (sourceDateKeys.has(key)) errors.push(`${label}: duplicate source/date key in pack`);
      if (existing.sourceDateKeys.has(key)) errors.push(`${label}: source/date key already present in overlap inputs`);
      sourceDateKeys.add(key);
    }
    eventIds.add(candidate.event_id);
    sourceRecordIds.add(candidate.source_record_id);
    sourceUrls.add(candidate.source_url);
    titleDateKeys.add(candidateTitleDateKey);
    recordDateKeys.add(candidateRecordDateKey);
  }

  for (const field of requiredSourceFields) {
    if (source[field] === undefined || source[field] === null || source[field] === "") {
      errors.push(`source_audit source missing ${field}`);
    }
  }
  if (source.source_dataset_id !== SOURCE_DATASET_ID) errors.push("source_audit source_dataset_id mismatch");
  if (source.source_url !== DATASET_PAGE) errors.push("source_audit official source_url mismatch");
  if (source.license !== "NYC Open Data Terms of Use / NYC.gov Terms of Use") {
    errors.push("source_audit missing normalized license label");
  }
  if (source.license_url !== NYC_OPEN_DATA_TERMS) errors.push("source_audit license_url mismatch");
  if (source.accessed_at !== ACCESSED_AT) errors.push(`source_audit accessed_at must be ${ACCESSED_AT}`);
  if (source.retrieved_at !== ACCESSED_AT) errors.push(`source_audit retrieved_at must be ${ACCESSED_AT}`);
  const sourceCaveatText = JSON.stringify({
    required_caveats: source.required_caveats,
    ingestion_recommendation: source.ingestion_recommendation
  });
  if (disallowedOutputTerms.test(sourceCaveatText)) {
    errors.push("source_audit caveat text contains disallowed overclaim wording");
  }

  if (notesText && disallowedOutputTerms.test(notesText)) {
    errors.push("notes.md contains disallowed overclaim wording");
  }

  return {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    validator: "Round590 generator validation: re-read emitted JSON, checked provenance, geometry, date window, license/terms fields, duplicate keys, and source-audit caveats after scanning current corpus plus prior NYC LPC packs through round586.",
    checked_files: checkedFiles,
    checks: {
      candidate_count: candidates.length,
      required_provenance_fields: "checked per candidate, including id, dates, geometry, source, publisher, source URL, license/terms, accessed_at, method, confidence, limitations, evidence fields, and raw source row subset",
      unique_event_ids: eventIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      unique_record_date_keys: recordDateKeys.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_urls: sourceUrls.size,
      unique_title_date_keys: titleDateKeys.size,
      date_window: `${START_DATE}..${END_DATE}`,
      date_range: summary.date_range || null,
      nyc_bounds: {
        minLat: 40.4774,
        maxLat: 40.9176,
        minLon: -74.2591,
        maxLon: -73.7004
      },
      source_dataset_only: SOURCE_DATASET_ID,
      source_date_field: "issue_date",
      accessed_at: ACCESSED_AT,
      official_source_url: DATASET_PAGE,
      manual_corpus_scanned: path.relative(ROOT, CORPUS_PATH),
      latest_lpc_permit_pack: "tmp/subagents/round586_nyc_lpc_permit_next93/candidates.json",
      prior_lpc_packs_scanned: PRIOR_PACK_PATHS,
      missing_overlap_inputs: existing.missingFiles,
      overlap_inputs_scanned: existing.scannedFiles.length,
      existing_record_ids_seen: existing.recordIds.size,
      existing_event_ids_seen: existing.eventIds.size,
      existing_source_urls_seen: existing.sourceUrls.size,
      existing_record_date_keys_seen: existing.recordDateKeys.size,
      existing_source_date_keys_seen: existing.sourceDateKeys.size,
      existing_title_date_keys_seen: existing.titleDates.size,
      source_audit_license: source.license || null,
      source_audit_license_url: source.license_url || null,
      by_regulation_type: summary.by_regulation_type || {},
      by_year: summary.by_year || {},
      by_bucket: summary.by_bucket || {},
      by_borough: summary.by_borough || {}
    },
    errors,
    warnings,
    passed: errors.length === 0
  };
}

function readbackValidationReportTemplate(validationReport) {
  const errors = [];
  const jsonFiles = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    REJECTED_PATH,
    VALIDATION_REPORT_PATH,
    VALIDATION_PATH
  ];
  const noteFiles = [NOTES_PATH];
  const payloads = new Map();

  for (const file of jsonFiles) {
    const payload = readJsonIfExists(file);
    if (!payload) {
      errors.push(`missing or unreadable JSON file ${path.relative(ROOT, file)}`);
    } else {
      payloads.set(file, payload);
    }
  }
  for (const file of noteFiles) {
    if (!readTextIfExists(file)) errors.push(`missing or unreadable notes file ${path.relative(ROOT, file)}`);
  }

  const candidatesPayload = payloads.get(CANDIDATES_PATH) || {};
  const summary = payloads.get(SUMMARY_PATH) || {};
  const validationAlias = payloads.get(VALIDATION_PATH) || {};
  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const ids = new Set();
  const sourceRecordIds = new Set();
  const sourceUrls = new Set();
  const recordDateKeys = new Set();
  const dates = [];

  for (const [index, candidate] of candidates.entries()) {
    const label = candidate.source_record_id || `candidate ${index}`;
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`${label}: accessed_at mismatch in readback`);
    if (candidate.retrieved_at !== ACCESSED_AT) errors.push(`${label}: retrieved_at mismatch in readback`);
    if (candidate.source_dataset_id !== SOURCE_DATASET_ID) errors.push(`${label}: source_dataset_id mismatch in readback`);
    if (candidate.license_url !== NYC_OPEN_DATA_TERMS) errors.push(`${label}: license_url mismatch in readback`);
    if (ids.has(candidate.event_id)) errors.push(`${label}: duplicate event_id in readback`);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${label}: duplicate source_record_id in readback`);
    if (sourceUrls.has(candidate.source_url)) errors.push(`${label}: duplicate source_url in readback`);
    const key = recordDateKey(candidate.source_record_id, candidate.date);
    if (recordDateKeys.has(key)) errors.push(`${label}: duplicate record/date key in readback`);
    ids.add(candidate.event_id);
    sourceRecordIds.add(candidate.source_record_id);
    sourceUrls.add(candidate.source_url);
    recordDateKeys.add(key);
    if (candidate.date) dates.push(candidate.date);
  }

  const sortedDates = [...dates].sort();
  const dateRange = {
    start: sortedDates[0] || null,
    end: sortedDates[sortedDates.length - 1] || null
  };
  if (candidates.length !== MAX_CANDIDATES) errors.push(`readback candidate_count expected ${MAX_CANDIDATES}, found ${candidates.length}`);
  if (summary.candidate_count !== candidates.length) errors.push("summary candidate_count mismatch in readback");
  if (summary.date_range && (summary.date_range.start !== dateRange.start || summary.date_range.end !== dateRange.end)) {
    errors.push("summary date_range mismatch in readback");
  }
  if (!validationReport.passed) errors.push("validation_report.json did not pass");
  if (validationAlias.validation_report_path !== path.relative(ROOT, VALIDATION_REPORT_PATH)) {
    errors.push("validation.json does not point to validation_report.json");
  }
  if (validationAlias.passed !== validationReport.passed) {
    errors.push("validation.json passed flag differs from validation_report.json");
  }

  return {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    validator: "Round590 JSON readback validation: re-opened emitted files after write, checked parseability, counts, date range, IDs, source URLs, license URL, and validation alias.",
    checked_files: [...jsonFiles, ...noteFiles, READBACK_PATH].map((file) => path.relative(ROOT, file)),
    candidate_count: candidates.length,
    date_range: dateRange,
    source_dataset_id: SOURCE_DATASET_ID,
    source_record_ids: [...sourceRecordIds].sort(),
    sample_source_record_ids: [...sourceRecordIds].sort().slice(0, 20),
    unique_event_ids: ids.size,
    unique_source_record_ids: sourceRecordIds.size,
    unique_source_urls: sourceUrls.size,
    unique_record_date_keys: recordDateKeys.size,
    validation_report_passed: validationReport.passed,
    errors,
    warnings: [],
    passed: errors.length === 0
  };
}

function normalizedTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function writeStrictDuplicateAudit() {
  if (process.exitCode) return;

  const candidatesPayload = readJsonIfExists(CANDIDATES_PATH);
  const summary = readJsonIfExists(SUMMARY_PATH);
  const validation = readJsonIfExists(VALIDATION_REPORT_PATH);
  const readback = readJsonIfExists(READBACK_PATH);
  if (!candidatesPayload || !summary || !validation || !readback) return;

  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const recordDateKeys = candidates.map((candidate) => `${candidate.source_record_id}|${candidate.date}`);
  const sourceRecordDateKeys = candidates.map((candidate) =>
    `${String(candidate.source_dataset_id || candidate.source_id || "").toLowerCase()}|${candidate.source_record_id}|${candidate.date}`
  );
  const sourceUrlDateKeys = candidates.map((candidate) => `${String(candidate.source_url || "").toLowerCase()}|${candidate.date}`);
  const titleDateKeys = candidates.map((candidate) =>
    `${candidate.city_id || "nyc"}|${normalizedTitle(candidate.title)}|${candidate.date}`
  );
  const checks = validation.checks || {};
  const priorPacks = Array.isArray(checks.prior_lpc_packs_scanned) ? checks.prior_lpc_packs_scanned : [];

  const audit = {
    generated_at: summary.generated_at,
    audit_scope: "Round590 strict duplicate audit for NYC LPC Permit Application Information next94 candidates.",
    dedupe_boundary: {
      manual_corpus_scanned: checks.manual_corpus_scanned || null,
      latest_lpc_permit_pack: ROUND586_PACK,
      prior_lpc_packs_scanned: priorPacks,
      prior_lpc_pack_count: priorPacks.length,
      includes_round586: priorPacks.includes(ROUND586_PACK),
      missing_overlap_inputs: checks.missing_overlap_inputs || [],
      overlap_inputs_scanned: checks.overlap_inputs_scanned || null,
      existing_event_ids_seen: checks.existing_event_ids_seen || null,
      existing_record_ids_seen: checks.existing_record_ids_seen || null,
      existing_source_urls_seen: checks.existing_source_urls_seen || null,
      existing_record_date_keys_seen: checks.existing_record_date_keys_seen || null,
      existing_source_date_keys_seen: checks.existing_source_date_keys_seen || null,
      existing_title_date_keys_seen: checks.existing_title_date_keys_seen || null
    },
    selected_candidate_count: candidates.length,
    selected_unique_counts: {
      event_ids: new Set(candidates.map((candidate) => candidate.event_id)).size,
      source_record_ids: new Set(candidates.map((candidate) => candidate.source_record_id)).size,
      source_urls: new Set(candidates.map((candidate) => candidate.source_url)).size,
      source_url_date_keys: new Set(sourceUrlDateKeys).size,
      source_record_date_keys: new Set(recordDateKeys).size,
      source_dataset_record_date_keys: new Set(sourceRecordDateKeys).size,
      title_date_keys: new Set(titleDateKeys).size
    },
    validation_overlap_checks: {
      validation_passed: validation.passed === true,
      readback_passed: readback.passed === true,
      unique_event_ids: checks.unique_event_ids || null,
      unique_source_record_ids: checks.unique_source_record_ids || null,
      unique_source_urls: checks.unique_source_urls || null,
      unique_record_date_keys: checks.unique_record_date_keys || null,
      unique_source_date_keys: checks.unique_source_date_keys || null,
      unique_title_date_keys: checks.unique_title_date_keys || null
    },
    selected_source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    passed:
      validation.passed === true &&
      readback.passed === true &&
      priorPacks.includes(ROUND586_PACK) &&
      new Set(candidates.map((candidate) => candidate.event_id)).size === candidates.length &&
      new Set(candidates.map((candidate) => candidate.source_record_id)).size === candidates.length &&
      new Set(candidates.map((candidate) => candidate.source_url)).size === candidates.length &&
      new Set(sourceUrlDateKeys).size === candidates.length &&
      new Set(recordDateKeys).size === candidates.length &&
      new Set(titleDateKeys).size === candidates.length
  };

  writeJson(STRICT_DUPLICATE_AUDIT_PATH, audit);

  if (fs.existsSync(NOTES_PATH)) {
    const notes = fs.readFileSync(NOTES_PATH, "utf8");
    if (!notes.includes("- strict_duplicate_audit.json")) {
      fs.writeFileSync(NOTES_PATH, notes.replace("- readback.json", "- readback.json\n- strict_duplicate_audit.json"), "utf8");
    }
  }
}

process.once("beforeExit", writeStrictDuplicateAudit);

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 204;/g, "const ROUND = 590;")
  .replace(/const ACCESSED_AT = "2026-05-19";/g, 'const ACCESSED_AT = "2026-05-20";')
  .replace(/round204_nyc_lpc_permit_next9/g, "round590_nyc_lpc_permit_next94")
  .replace(/round204/g, "round590")
  .replace(/Round204/g, "Round590")
  .replace(/next9/g, "next94")
  .replace(/Next9/g, "Next94")
  .replace(/through round198/g, "through round586");

source = normalizeRound590Names(source);

source = replaceRegexOnce(
  source,
  /const PRIOR_PACK_PATHS = \[[\s\S]*?\];/,
  priorPackPathsSource(),
  "PRIOR_PACK_PATHS"
);

source = replaceOnce(
  source,
  'const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");\n',
  'const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");\nconst VALIDATION_REPORT_PATH = path.join(OUT_DIR, "validation_report.json");\nconst VALIDATION_PATH = path.join(OUT_DIR, "validation.json");\nconst READBACK_PATH = path.join(OUT_DIR, "readback.json");\n'
);

source = replaceOnce(
  source,
  "function collectExistingKeys() {\n",
  `function eventRowsFromCorpus(corpus) {
  if (Array.isArray(corpus)) return corpus;
  for (const key of ["events", "candidates", "milestones", "records"]) {
    if (Array.isArray(corpus?.[key])) return corpus[key];
  }
  return [];
}

function collectExistingKeys() {
`
);

source = replaceOnce(
  source,
  "    for (const event of corpus.events || []) {\n",
  "    for (const event of eventRowsFromCorpus(corpus)) {\n"
);

source = replaceOnce(
  source,
  [
    "    if (!regulationNumber) {",
    '      reject(rejected, "missing_regulation_number", row);',
    "      continue;",
    "    }",
    "    if (existing.recordIds.has(regulationNumber) || seenRecordIds.has(regulationNumber)) {"
  ].join("\n"),
  [
    "    if (!regulationNumber) {",
    '      reject(rejected, "missing_regulation_number", row);',
    "      continue;",
    "    }",
    "    if (!cleanText(row.address)) {",
    '      reject(rejected, "missing_address", row);',
    "      continue;",
    "    }",
    "    if (existing.recordIds.has(regulationNumber) || seenRecordIds.has(regulationNumber)) {"
  ].join("\n")
);

source = replaceOnce(
  source,
  '    location_name: [address, borough, "New York City"].filter(Boolean).join(", "),\n    latitude: point.latitude,\n    longitude: point.longitude,\n',
  '    location_name: [address, borough, "New York City"].filter(Boolean).join(", "),\n    address,\n    borough,\n    geometry_ref: `${address || "address not supplied"}; ${borough || "borough not supplied"}; block ${cleanText(row.block) || "not supplied"}; lot ${cleanText(row.lot) || "not supplied"}`,\n    latitude: point.latitude,\n    longitude: point.longitude,\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\n'
);

source = replaceOnce(
  source,
  '    accessed_at: ACCESSED_AT,\n    source_retrieved_at: ACCESSED_AT,\n',
  '    accessed_at: ACCESSED_AT,\n    retrieved_at: ACCESSED_AT,\n    source_retrieved_at: ACCESSED_AT,\n'
);

source = replaceOnce(
  source,
  '    license_or_terms_note: "NYC Open Data / NYC.gov terms apply; dataset metadata licenseId/license is null. Attribute LPC/NYC Open Data, preserve row identifiers, and re-check metadata before redistribution.",\n    license_url: NYC_OPEN_DATA_TERMS,\n',
  '    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use",\n    license_or_terms_note: "NYC Open Data / NYC.gov terms apply; dataset metadata licenseId/license is null. Attribute LPC/NYC Open Data, preserve row identifiers, and re-check metadata before redistribution.",\n    license_url: NYC_OPEN_DATA_TERMS,\n'
);

source = replaceOnce(
  source,
  '        license_or_terms_note: "Dataset metadata licenseId/license is null. NYC Open Data Terms of Use and NYC.gov Terms of Use apply; public datasets may be updated, corrected, or refreshed by the submitting agency.",\n        license_url: NYC_OPEN_DATA_TERMS,\n',
  '        license: "NYC Open Data Terms of Use / NYC.gov Terms of Use",\n        license_or_terms_note: "Dataset metadata licenseId/license is null. NYC Open Data Terms of Use and NYC.gov Terms of Use apply; public datasets may be updated, corrected, or refreshed by the submitting agency.",\n        license_url: NYC_OPEN_DATA_TERMS,\n'
);

source = replaceOnce(
  source,
  '        accessed_at: ACCESSED_AT,\n        rows_updated_at_utc: metadata.rowsUpdatedAt ? new Date(metadata.rowsUpdatedAt * 1000).toISOString() : null,\n',
  '        accessed_at: ACCESSED_AT,\n        retrieved_at: ACCESSED_AT,\n        rows_updated_at_utc: metadata.rowsUpdatedAt ? new Date(metadata.rowsUpdatedAt * 1000).toISOString() : null,\n'
);

source = replaceOnce(
  source,
  '          "Notice of Compliance, if present in the source, is not treated here as independent proof of compliance sign-off or final physical condition."\n',
  '          "Notice of Compliance, if present in the source, is not treated here as an independent final compliance or physical-condition observation."\n'
);

source = replaceOnce(
  source,
  '      caveat: "Administrative LPC permit/application processing only; no construction, completion, compliance, condition, outcome, causality, or geometry-of-work claim is made."\n',
  '      caveat: "Administrative LPC permit/application processing only; no construction, completion, compliance, condition, outcome, or approved-work-geometry claim is made."\n'
);

source = replaceOnce(
  source,
  "\nfunction markdownNotes(summary) {\n",
  `\n${validationReportForOutputsTemplate.toString().replace(
    "function validationReportForOutputsTemplate",
    "function validationReportForOutputs"
  )}

${readbackValidationReportTemplate.toString().replace(
    "function readbackValidationReportTemplate",
    "function readbackValidationReport"
  )}

function markdownNotes(summary) {\n`
);

source = replaceOnce(
  source,
  '    "- notes.md"\n  ].join("\\n");',
  '    "- notes.md",\n    "- validation_report.json",\n    "- validation.json",\n    "- readback.json"\n  ].join("\\n");'
);

source = replaceOnce(
  source,
  "  writeText(NOTES_PATH, markdownNotes(summary));\n\n  console.log(JSON.stringify({\n",
  `  writeText(NOTES_PATH, markdownNotes(summary));

  const validationReport = validationReportForOutputs(existing);
  writeJson(VALIDATION_REPORT_PATH, validationReport);

  const validationAlias = {
    generated_at: summary.generated_at,
    validator: "Round590 validation.json: alias of validation_report.json plus output file inventory for downstream pack readers.",
    validation_report_path: path.relative(ROOT, VALIDATION_REPORT_PATH),
    checked_files: validationReport.checked_files,
    checks: validationReport.checks,
    errors: validationReport.errors,
    warnings: validationReport.warnings,
    passed: validationReport.passed
  };
  writeJson(VALIDATION_PATH, validationAlias);

  const readbackReport = readbackValidationReport(validationReport);
  writeJson(READBACK_PATH, readbackReport);

  if (!validationReport.passed || !readbackReport.passed) {
    throw new Error([
      "Validation failed:",
      ...validationReport.errors.slice(0, 80),
      ...readbackReport.errors.slice(0, 80)
    ].join("\\n"));
  }

  console.log(JSON.stringify({
`
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
const normalizedConsole = {
  ...console,
  log: (...args) => console.log(...args.map((arg) => (typeof arg === "string" ? normalizeRound590Names(arg) : arg))),
  error: (...args) => console.error(...args.map((arg) => (typeof arg === "string" ? normalizeRound590Names(arg) : arg)))
};
runner(require, __dirname, __filename, process, normalizedConsole, fetch);
