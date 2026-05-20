const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round293_nyc_dob_now_next16_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round293_nyc_dob_now_next16");
const CORPUS_PATH = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const TARGET_COUNT = 200;

const DOB_NOW_ROUNDS_THROUGH_237 = [
  "round117_nyc_dob_filings_permits",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round158",
  "round162",
  "round167",
  "round173",
  "round179",
  "round185",
  "round191",
  "round197",
  "round203",
  "round209",
  "round222",
  "round227",
  "round237"
];

const DOB_ADMIN_PRIOR_PATTERNS = [
  /round112_nyc_dob/i,
  /round117_nyc_dob/i,
  /round117_nyc_local_dob/i,
  /round119_nyc_dob/i,
  /round1(33|36|43|49|52|58|62|67|73|79|85|91|97)_nyc_dob_now/i,
  /round20(3|9)_nyc_dob_now/i,
  /round22(2|7)_nyc_dob_now/i,
  /round237_nyc_dob_now/i,
  /round1(55|60|64|69|75|81|87|93|99)_nyc_dob_co/i,
  /round20(5|11)_nyc_dob_co/i,
  /round2(19|25|32|42|47|50|56|64|67|73|78|89)_nyc_dob_co/i
];

const REQUIRED_OUTPUT_FILES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "notes.md",
  "rejected.json",
  "validation_report.json"
].map((name) => path.join(OUT_DIR, name));

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+|$)/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candidateArray(doc) {
  if (!doc) return [];
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function countBy(rows, fn) {
  const counts = {};
  for (const row of rows) {
    const key = cleanText(fn(row)) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function walkJsonCandidateFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  const ownOutDir = path.normalize(OUT_DIR).replace(/\\/g, "/");
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (normalized === ownOutDir) continue;
        stack.push(fullPath);
      } else if (
        entry.name === "candidates.json" ||
        /^nyc_arch_candidates.*\.json$/i.test(entry.name) ||
        /^round\d+_nyc_.*candidates.*\.json$/i.test(entry.name)
      ) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function addIdentifier(tokens, value) {
  const text = normalizeKey(value);
  if (text.length >= 4) tokens.add(text);
}

function addIdentifierRegexTokens(tokens, value) {
  const text = cleanText(value);
  if (!text) return;
  for (const match of text.matchAll(/\b[12345]\d{8}\b/g)) addIdentifier(tokens, match[0]);
  for (const match of text.matchAll(/\b[A-Z]\d{8}(?:-[A-Z0-9]+)?\b/gi)) {
    addIdentifier(tokens, match[0]);
    const base = match[0].match(/^([A-Z]\d{8})/i);
    if (base) addIdentifier(tokens, base[1]);
  }
  for (const match of text.matchAll(/\b[A-Z]{1,3}\d{6,}(?:-[A-Z0-9]+)?\b/gi)) addIdentifier(tokens, match[0]);
  for (const match of text.matchAll(/\bCO-\d{5,}\b/gi)) addIdentifier(tokens, match[0]);
  for (const match of text.matchAll(/\brow-[a-z0-9.~_-]+\b/gi)) addIdentifier(tokens, match[0]);
}

function addRecordIdentifiers(tokens, record) {
  if (!record || typeof record !== "object") return;
  for (const key of [
    "source_record_id",
    "source_url",
    "candidate_id",
    "event_id",
    "id",
    "job_filing_number",
    "base_job_filing_number",
    "permit_job_filing_number",
    "application_source_record_id",
    "application_number",
    "c_of_o_number",
    "job_number",
    "work_permit",
    "tracking_number"
  ]) {
    addIdentifier(tokens, record[key]);
    addIdentifierRegexTokens(tokens, record[key]);
  }
  for (const key of ["source_row_ref", "source_fields", "raw_row", "row_fields"]) {
    const nested = record[key];
    if (!nested || typeof nested !== "object") continue;
    if (Array.isArray(nested)) {
      for (const item of nested) addRecordIdentifiers(tokens, item);
    } else {
      for (const value of Object.values(nested)) addIdentifierRegexTokens(tokens, value);
    }
  }
}

function sourceDateKey(record) {
  const source = cleanText(record.source_dataset_id || record.source_id || "*");
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.work_permit ||
    record.tracking_number ||
    record.job_filing_number ||
    record.application_source_record_id ||
    record.application_number ||
    record.c_of_o_number ||
    record.job_number ||
    ""
  );
  const date = parseDate(record.date || record.effective_date || record.issuance_date || "");
  return sourceRecord && date ? `${source}|${sourceRecord}|${date}`.toLowerCase() : "";
}

function sourceDateWildcardKey(record) {
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.work_permit ||
    record.tracking_number ||
    record.job_filing_number ||
    record.application_source_record_id ||
    record.application_number ||
    record.c_of_o_number ||
    record.job_number ||
    ""
  );
  const date = parseDate(record.date || record.effective_date || record.issuance_date || "");
  return sourceRecord && date ? `*|${sourceRecord}|${date}`.toLowerCase() : "";
}

function sourceUrlDateKey(record) {
  const sourceUrl = cleanText(record.source_url);
  const date = parseDate(record.date || record.effective_date || record.issuance_date || "");
  return sourceUrl && date ? `${sourceUrl}|${date}`.toLowerCase() : "";
}

function buildPriorIndex() {
  const filesRead = [];
  const missingFiles = [];
  const sourceDateKeys = new Set();
  const sourceDateWildcardKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const identifierTokens = new Set();
  const priorDobFiles = [];

  const files = [CORPUS_PATH, ...walkJsonCandidateFiles("tmp/subagents")];
  for (const file of files) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file.replace(/\\/g, "/"));
      continue;
    }
    try {
      const doc = readJson(file);
      filesRead.push(file.replace(/\\/g, "/"));
      const records = candidateArray(doc);
      if (file !== CORPUS_PATH && DOB_ADMIN_PRIOR_PATTERNS.some((pattern) => pattern.test(file.replace(/\\/g, "/")))) {
        priorDobFiles.push(file.replace(/\\/g, "/"));
      }
      for (const record of records) {
        const sourceDate = sourceDateKey(record);
        if (sourceDate) sourceDateKeys.add(sourceDate);
        const wildcard = sourceDateWildcardKey(record);
        if (wildcard) sourceDateWildcardKeys.add(wildcard);
        const urlDate = sourceUrlDateKey(record);
        if (urlDate) sourceUrlDateKeys.add(urlDate);
        addRecordIdentifiers(identifierTokens, record);
      }
    } catch (error) {
      missingFiles.push(`${file.replace(/\\/g, "/")} (${error.message})`);
    }
  }

  return {
    filesRead,
    missingFiles,
    priorDobFiles,
    sourceDateKeys,
    sourceDateWildcardKeys,
    sourceUrlDateKeys,
    identifierTokens
  };
}

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round293 template patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round293 template patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function transformRound149Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = replaceRequired(transformed, 'const ACCESSED_AT = "2026-05-19";', `const ACCESSED_AT = "${ACCESSED_AT}";`, "access date");
  transformed = replaceRequired(transformed, 'const GENERATED_AT = "2026-05-19T00:00:00Z";', `const GENERATED_AT = "${GENERATED_AT}";`, "generated date");
  transformed = replaceRequired(transformed, 'const START_DATE = "2024-01-01";', `const START_DATE = "${START_DATE}";`, "start date");
  transformed = replaceRequired(transformed, "const END_DATE = ACCESSED_AT;", `const END_DATE = "${END_DATE}";`, "end date");
  transformed = replaceRequired(transformed, "const TARGET_COUNT = 240;", `const TARGET_COUNT = ${TARGET_COUNT};`, "target count");
  transformed = replaceRequired(
    transformed,
    'const OUT_DIR = "tmp/subagents/round149_nyc_dob_now_next";',
    'const OUT_DIR = "tmp/subagents/round293_nyc_dob_now_next16";',
    "output directory"
  );

  transformed = replaceRequired(transformed, "total_construction_floor_area_gte: 25000,", "total_construction_floor_area_gte: 5000,", "floor-area threshold");
  transformed = replaceRequired(transformed, "proposed_dwelling_units_gte: 20,", "proposed_dwelling_units_gte: 5,", "dwelling-unit threshold");
  transformed = replaceRequired(transformed, "proposed_height_gte: 45,", "proposed_height_gte: 25,", "height threshold");
  transformed = replaceRequired(transformed, "proposed_stories_gte: 5,", "proposed_stories_gte: 2,", "story threshold");
  transformed = replaceRequired(transformed, "initial_cost_or_estimated_job_costs_gte: 3000000,", "initial_cost_or_estimated_job_costs_gte: 250000,", "cost threshold");
  transformed = replaceRequired(transformed, "below_high_signal_scale_threshold", "below_round293_architecture_signal_threshold", "rejection threshold label");
  transformed = replaceRequired(transformed, "high_signal_thresholds: HIGH_SIGNAL_THRESHOLDS,", "architecture_signal_thresholds: HIGH_SIGNAL_THRESHOLDS,", "summary threshold label");
  transformed = replaceRequired(transformed, "Not proof that", "Not evidence that", "caveat wording");
  transformed = replaceRequired(transformed, "nonduplicate high-signal administrative permit row", "nonduplicate architecture-signal administrative permit row", "method wording");
  transformed = transformed.replace(/high-signal administrative permit row/g, "architecture-signal administrative permit row");

  const priorText = "round117 DOB filings/permits, round119 DOB legacy permits, DOB NOW packs through round237, DOB Certificate of Occupancy packs through round289, and other DOB permit/application packs available under tmp/subagents";
  const priorSlash = "round117/round119/DOB NOW through round237/DOB CO through round289/other DOB permit-application packs";
  transformed = replaceRequired(transformed, "round133, round136, and round143", priorText, "prior round prose");
  transformed = replaceRequired(transformed, "round133/round136/round143", priorSlash, "prior round slash prose");
  transformed = replaceRequired(transformed, "round133|round136|round143", "round112|round117|round119|round133|round136|round143|round149|round152|round155|round158|round160|round162|round164|round167|round169|round173|round175|round179|round181|round185|round187|round191|round193|round197|round199|round203|round205|round209|round211|round219|round222|round225|round227|round232|round237|round242|round247|round250|round256|round264|round267|round273|round278|round289", "prior round regex");
  transformed = replaceRequired(transformed, "screened_round133_round136_round143_files", "screened_prior_dob_now_permit_co_files", "prior round summary field");

  transformed = transformed
    .replace(/round149/g, "round293")
    .replace(/Round149/g, "Round293")
    .replace(/nyc_dob_now_next/g, "nyc_dob_now_next16")
    .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next16")
    .replace(/NYC DOB NOW next/g, "NYC DOB NOW next16")
    .replace(/Round293 generator queried DOB NOW/g, "Round293 generator queried official DOB NOW")
    .replace(/Generated \$\{candidates\.length\} additional administrative DOB NOW approved-permit candidates/g, "Generated ${candidates.length} residual administrative DOB NOW approved-permit candidates");

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
}

async function runTransformedRound149Main() {
  const source = transformRound149Source(fs.readFileSync(TEMPLATE_PATH, "utf8"));
  const sandbox = {
    Buffer,
    URL,
    clearTimeout,
    console,
    fetch,
    module: { exports: {} },
    process,
    require,
    setTimeout,
    __dirname: path.dirname(path.resolve(SCRIPT_PATH)),
    __filename: path.resolve(SCRIPT_PATH)
  };

  vm.runInNewContext(source, sandbox, { filename: SCRIPT_PATH });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed round293 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

function patchGeneratedArtifacts() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const notesPath = path.join(OUT_DIR, "notes.md");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");

  const candidatesDoc = readJson(candidatesPath);
  const summaryDoc = readJson(summaryPath);
  const sourceAuditDoc = readJson(sourceAuditPath);
  const rejectedDoc = readJson(rejectedPath);

  const validationPath = path.join(OUT_DIR, "validation_report.json").replace(/\\/g, "/");
  const outputFiles = [
    candidatesPath,
    sourceAuditPath,
    summaryPath,
    notesPath,
    rejectedPath,
    path.join(OUT_DIR, "validation_report.json")
  ].map((file) => file.replace(/\\/g, "/"));

  candidatesDoc.scope = "Official NYC DOB NOW Build approved-permit/job-filing candidate pack after DOB NOW packs through round237, DOB CO packs through round289, and prior DOB permit/application packs. Records are administrative filing/permit/issued milestones and must not be presented as construction start, completion, opening, occupancy, or outcome evidence.";
  candidatesDoc.worker = "Round293 NYC DOB NOW next16 candidates";
  candidatesDoc.source_audits = candidatesDoc.source_audits.map((source) => ({
    ...source,
    coverage_years_checked: source.coverage_years_checked?.replace("2026-05-19", END_DATE) || `${START_DATE} through ${END_DATE}`,
    granularity: source.granularity?.replace("beyond existing round117/round133/round136/round143/round149/round152/round158/round162/round167/round173/round179/round185/round191/round197/round203/round209/round222/round227/manual-corpus tokens", "beyond existing manual-corpus, DOB NOW through round237, DOB CO through round289, and prior DOB permit/application tokens") ||
      source.granularity
  }));

  for (const candidate of candidatesDoc.candidates) {
    candidate.transformation_method = candidate.transformation_method
      .replace("Round149", "Round293")
      .replace("round133/round136/round143 candidate packs", "round117/round119 DOB permit packs, DOB NOW packs through round237, DOB CO packs through round289, and other DOB permit/application packs")
      .replace("current manual corpus plus round117 DOB filings/permits, round119 DOB legacy permits, DOB NOW packs through round237, DOB Certificate of Occupancy packs through round289, and other DOB permit/application packs available under tmp/subagents candidate packs", "manual corpus plus prior DOB administrative candidate packs");
    candidate.duplicate_check_note = "Exact job_filing_number, base DOB NOW job number, work_permit, tracking_number, source_record_id, source_url, candidate_id, and event_id tokens were screened against the manual architecture corpus and prior NYC DOB NOW, DOB permit/application, and DOB Certificate of Occupancy packs available during this run, including DOB NOW through round237 and CO through round289.";
    candidate.milestone_type = "DOB NOW approved permit issued";
    candidate.source_date_field = "issued_date from DOB NOW: Build - Approved Permits; filing_date, job_type, and scale fields joined from DOB NOW: Build - Job Application Filings by job_filing_number or DOB NOW base job number";
    candidate.accessed_at = ACCESSED_AT;
    candidate.source_row_ref.accessed_at = ACCESSED_AT;
    candidate.source_metadata.accessed_at = ACCESSED_AT;
  }

  candidatesDoc.selection_summary.date_window = { start: START_DATE, end: END_DATE };
  candidatesDoc.selection_summary.target_count = TARGET_COUNT;
  candidatesDoc.selection_summary.prior_scope = {
    dob_now_rounds_through: "round237",
    dob_co_rounds_through: "round289",
    dob_now_rounds_screened: DOB_NOW_ROUNDS_THROUGH_237
  };

  summaryDoc.output_files = outputFiles;
  summaryDoc.worker = "Round293 NYC DOB NOW next16 candidates";
  summaryDoc.date_window = { start: START_DATE, end: END_DATE };
  summaryDoc.duplicate_screening.screened_prior_dob_now_permit_co_files = candidatesDoc.selection_summary.duplicate_index_files
    .filter((file) => DOB_ADMIN_PRIOR_PATTERNS.some((pattern) => pattern.test(file)))
    .sort();
  summaryDoc.caveats = [
    "Administrative DOB NOW filing/permit milestone only.",
    "Not evidence that a building was built, completed, opened, occupied, or causally linked to outcomes.",
    "Coordinates are DOB/Open Data geocoded address points.",
    "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
  ];

  sourceAuditDoc.audit_scope = "Official NYC DOB NOW Build approved permits and job application filings, selected for residual architecture-change candidate discovery after prior DOB NOW, DOB permit/application, and DOB CO packs with administrative-record caveats.";
  sourceAuditDoc.sources = candidatesDoc.source_audits;
  sourceAuditDoc.selection_summary = candidatesDoc.selection_summary;
  sourceAuditDoc.caveat = "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, or outcomes unless another source explicitly supports that claim.";

  rejectedDoc.schema_version = "round293.nyc_dob_now_next16_rejections.v1";
  rejectedDoc.accessed_at = ACCESSED_AT;
  rejectedDoc.rejected_counts = Object.fromEntries(Object.entries(rejectedDoc.rejected_counts || {}).sort(([a], [b]) => a.localeCompare(b)));

  const notes = [
    "# Round293 NYC DOB NOW Next16 Candidate Pack",
    "",
    `Generated ${candidatesDoc.candidate_count} residual administrative DOB NOW approved-permit candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.",
    "",
    "## Caveats",
    "",
    "- Rows are administrative permit/job filing records only.",
    "- They do not document construction start, construction completion, public opening, occupancy, final built form, or outcome effects.",
    "- Scale fields are source-reported filing attributes and can be amended by later DOB records.",
    "- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.",
    "- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.",
    "",
    "## Duplicate Screening",
    "",
    `Screened against ${summaryDoc.duplicate_screening.files_read} manual-corpus/tmp candidate files and ${summaryDoc.duplicate_screening.tokens} exact identifier tokens, including DOB NOW through round237, DOB CO through round289, and prior DOB permit/application packs when present.`,
    "",
    "## Counts",
    "",
    `- Permit rows fetched: ${candidatesDoc.selection_summary.permit_rows_fetched}`,
    `- Permit rows after duplicate/geography filters: ${candidatesDoc.selection_summary.permit_rows_after_duplicate_and_geometry_filters}`,
    `- Application rows fetched: ${candidatesDoc.selection_summary.application_rows_fetched}`,
    `- Candidate pool before balancing: ${candidatesDoc.selection_summary.candidate_pool_before_balancing}`,
    `- Candidates retained: ${candidatesDoc.candidate_count}`,
    `- Validation report: ${validationPath}`
  ].join("\n");

  writeJson(candidatesPath, candidatesDoc);
  writeJson(summaryPath, summaryDoc);
  writeJson(sourceAuditPath, sourceAuditDoc);
  writeJson(rejectedPath, rejectedDoc);
  fs.writeFileSync(notesPath, `${notes}\n`);
}

function validateOutputs() {
  const errors = [];
  const warnings = [];
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const notesPath = path.join(OUT_DIR, "notes.md");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");
  const validationPath = path.join(OUT_DIR, "validation_report.json");

  for (const file of [candidatesPath, sourceAuditPath, summaryPath, notesPath, rejectedPath]) {
    if (!fs.existsSync(file)) errors.push(`Missing expected output file ${file}`);
  }

  const candidatesDoc = fs.existsSync(candidatesPath) ? readJson(candidatesPath) : { candidates: [] };
  const sourceAuditDoc = fs.existsSync(sourceAuditPath) ? readJson(sourceAuditPath) : { sources: [] };
  const summaryDoc = fs.existsSync(summaryPath) ? readJson(summaryPath) : {};
  const rejectedDoc = fs.existsSync(rejectedPath) ? readJson(rejectedPath) : {};
  const candidates = candidateArray(candidatesDoc);
  const prior = buildPriorIndex();

  const required = [
    "city_id",
    "candidate_id",
    "event_id",
    "date",
    "effective_date",
    "title",
    "summary",
    "observed_change",
    "address",
    "borough",
    "latitude",
    "longitude",
    "geometry",
    "source_id",
    "source_ids",
    "source_name",
    "publisher",
    "source_url",
    "source_api_url",
    "source_record_id",
    "source_type",
    "source_dataset_id",
    "source_date_field",
    "license",
    "license_url",
    "license_or_terms_note",
    "accessed_at",
    "confidence",
    "geometry_source",
    "geometry_precision",
    "attribution",
    "limitations",
    "transformation_method",
    "source_row_ref",
    "source_fields",
    "job_filing_number",
    "base_job_filing_number",
    "work_permit",
    "issuance_date"
  ];
  const banned = /\b(caused|proves?|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const eventIds = new Set();
  const candidateIds = new Set();
  const sourceRecords = new Set();
  const sourceDateKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const baseJobs = new Set();
  let minDate = "";
  let maxDate = "";

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.title || "unknown candidate";
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Missing ${field} for ${label}`);
      }
    }
    const date = parseDate(candidate.date || candidate.effective_date);
    if (!date || date < START_DATE || date > END_DATE) errors.push(`Date outside ${START_DATE}..${END_DATE} for ${label}: ${candidate.date}`);
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`Unexpected accessed_at for ${label}: ${candidate.accessed_at}`);
    if (candidate.source_dataset_id !== "nyc-dob-now-build-approved-permits-rbx6-tga4") errors.push(`Unexpected source_dataset_id for ${label}: ${candidate.source_dataset_id}`);
    if (!String(candidate.source_date_field || "").includes("issued_date")) errors.push(`source_date_field does not name issued_date for ${label}`);
    if (!candidate.source_ids?.includes("nyc-dob-filings-permits")) errors.push(`Missing canonical DOB source id for ${label}`);
    if (!isNycPoint(Number(candidate.latitude), Number(candidate.longitude))) errors.push(`Invalid NYC point for ${label}`);
    if (candidate.geometry?.type !== "Point" || !Array.isArray(candidate.geometry.coordinates) || candidate.geometry.coordinates.length !== 2) {
      errors.push(`Invalid Point geometry for ${label}`);
    }
    const prose = [candidate.title, candidate.summary, candidate.observed_change, candidate.limitations, candidate.transformation_method].join(" ");
    if (banned.test(prose)) errors.push(`Overclaim wording detected for ${label}`);
    if (!/administrative/i.test(candidate.limitations) || !/not evidence/i.test(candidate.limitations)) {
      errors.push(`Limitations do not clearly state administrative/not-evidence caveat for ${label}`);
    }

    for (const [set, value, name] of [
      [eventIds, candidate.event_id, "event_id"],
      [candidateIds, candidate.candidate_id, "candidate_id"],
      [sourceRecords, candidate.source_record_id, "source_record_id"],
      [baseJobs, candidate.base_job_filing_number, "base_job_filing_number"]
    ]) {
      const key = normalizeKey(value);
      if (set.has(key)) errors.push(`Duplicate ${name} ${value}`);
      set.add(key);
    }

    const candidateSourceDate = sourceDateKey(candidate);
    const candidateWildcard = sourceDateWildcardKey(candidate);
    const candidateSourceUrlDate = sourceUrlDateKey(candidate);
    if (sourceDateKeys.has(candidateSourceDate)) errors.push(`Duplicate candidate source/date key ${candidateSourceDate}`);
    sourceDateKeys.add(candidateSourceDate);
    if (sourceUrlDateKeys.has(candidateSourceUrlDate)) errors.push(`Duplicate candidate source URL/date key ${candidateSourceUrlDate}`);
    sourceUrlDateKeys.add(candidateSourceUrlDate);
    if (prior.sourceDateKeys.has(candidateSourceDate) || prior.sourceDateWildcardKeys.has(candidateWildcard) || prior.sourceUrlDateKeys.has(candidateSourceUrlDate)) {
      errors.push(`Candidate overlaps prior source/date key for ${label}`);
    }
    for (const value of [
      candidate.candidate_id,
      candidate.event_id,
      candidate.source_record_id,
      candidate.source_url,
      candidate.job_filing_number,
      candidate.base_job_filing_number,
      candidate.work_permit,
      candidate.tracking_number,
      candidate.application_source_record_id
    ]) {
      const key = normalizeKey(value);
      if (key.length >= 4 && prior.identifierTokens.has(key)) {
        errors.push(`Candidate identifier overlaps prior corpus for ${label}: ${value}`);
      }
    }
  }

  if (candidates.length !== TARGET_COUNT) warnings.push(`Candidate count ${candidates.length} differs from target ${TARGET_COUNT}`);
  if (candidatesDoc.candidate_count !== candidates.length) errors.push("candidates.json candidate_count does not match candidates array");
  if (summaryDoc.candidate_count !== candidates.length) errors.push("summary.json candidate_count does not match candidates array");
  if (!Array.isArray(sourceAuditDoc.sources) || sourceAuditDoc.sources.length < 2) errors.push("source_audit.json does not include both DOB NOW source audits");
  for (const source of sourceAuditDoc.sources || []) {
    for (const field of ["source_id", "source_name", "publisher", "source_url", "api_endpoint", "license", "license_url", "attribution", "required_caveats", "ingestion_recommendation"]) {
      if (!source[field] || (Array.isArray(source[field]) && source[field].length === 0)) errors.push(`source_audit missing ${field} for ${source.source_id || "unknown source"}`);
    }
  }
  if (!String(fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8") : "").includes("do not document construction start")) {
    errors.push("notes.md is missing explicit no-construction-start caveat");
  }
  if (!rejectedDoc.rejected_counts || typeof rejectedDoc.rejected_counts !== "object") errors.push("rejected.json missing rejected_counts");

  const report = {
    schema_version: "round293.nyc_dob_now_next16_validation_report.v1",
    ok: errors.length === 0,
    checked_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: "scripts/fetch_round293_nyc_dob_now_next16_candidates.js --validate-only; reads emitted JSON plus manual corpus and prior DOB NOW/DOB permit/DOB CO candidate packs without calling the generator main path",
    checked_files: REQUIRED_OUTPUT_FILES.map((file) => file.replace(/\\/g, "/")),
    checks: {
      candidate_count: candidates.length,
      target_count: TARGET_COUNT,
      summary_candidate_count: summaryDoc.candidate_count,
      required_provenance_fields: required,
      date_window: { start: START_DATE, end: END_DATE },
      date_range: { start: minDate, end: maxDate },
      unique_event_ids: eventIds.size,
      unique_candidate_ids: candidateIds.size,
      unique_source_record_ids: sourceRecords.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_url_date_keys: sourceUrlDateKeys.size,
      unique_base_job_filing_numbers: baseJobs.size,
      nyc_coordinate_bounds_valid: candidates.every((candidate) => isNycPoint(Number(candidate.latitude), Number(candidate.longitude))),
      source_dataset_only: "rbx6-tga4 joined to w9ak-ipjd",
      source_date_field: "issued_date",
      source_date_field_mix: countBy(candidates, (candidate) => `${candidate.source_row_ref?.dataset_id || "unknown"}|issued_date`),
      milestone_type_mix: countBy(candidates, (candidate) => candidate.milestone_type || "DOB NOW approved permit issued"),
      work_type_mix: countBy(candidates, (candidate) => candidate.work_type),
      job_type_mix: countBy(candidates, (candidate) => candidate.job_type),
      borough_mix: countBy(candidates, (candidate) => candidate.borough),
      year_mix: countBy(candidates, (candidate) => String(candidate.date || "").slice(0, 4)),
      screened_files_read: prior.filesRead.length,
      screened_files_missing: prior.missingFiles,
      prior_dob_files_scanned: prior.priorDobFiles,
      required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),
      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),
      prior_source_date_keys_checked: prior.sourceDateKeys.size,
      prior_identifier_tokens_checked: prior.identifierTokens.size,
      no_overlap_with_screened_corpus_and_prior_packs: errors.every((error) => !/overlaps prior/i.test(error))
    },
    errors,
    warnings,
    passed: errors.length === 0
  };

  writeJson(validationPath, report);
  if (errors.length) {
    throw new Error(`Round293 validation failed with ${errors.length} errors. See ${validationPath}`);
  }
  return report;
}

async function main() {
  if (process.argv.includes("--validate-only")) {
    const report = validateOutputs();
    console.log(`Round293 validation passed for ${report.checks.candidate_count} candidates.`);
    return;
  }

  await runTransformedRound149Main();
  patchGeneratedArtifacts();
  const report = validateOutputs();
  console.log(`Round293 wrote ${report.checks.candidate_count} candidates and validation_report.json.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
