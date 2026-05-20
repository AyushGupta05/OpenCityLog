const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round473_nyc_dob_now_next31_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round473_nyc_dob_now_next31");
const OUT_DIR_POSIX = OUT_DIR.replace(/\\/g, "/");
const CORPUS_PATH = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
const CORPUS_PATH_POSIX = CORPUS_PATH.replace(/\\/g, "/");
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const TARGET_COUNT = 200;

const DATASET_ENDPOINTS = {
  permits: {
    id: "rbx6-tga4",
    source_id: "nyc-dob-now-build-approved-permits-rbx6-tga4",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4",
    api: "https://data.cityofnewyork.us/resource/rbx6-tga4.json",
    metadata: "https://data.cityofnewyork.us/api/views/rbx6-tga4"
  },
  applications: {
    id: "w9ak-ipjd",
    source_id: "nyc-dob-now-build-job-application-filings-w9ak-ipjd",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd",
    api: "https://data.cityofnewyork.us/resource/w9ak-ipjd.json",
    metadata: "https://data.cityofnewyork.us/api/views/w9ak-ipjd"
  },
  canonical_source_id: "nyc-dob-filings-permits"
};

const DOB_NOW_ROUNDS_THROUGH_465 = [
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
  "round237",
  "round293",
  "round397",
  "round401",
  "round407",
  "round413",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round458",
  "round461",
  "round465"
];

const PRIOR_DOB_ROUND_REGEX_THROUGH_465 = [
  "round112",
  "round117",
  "round119",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round155",
  "round158",
  "round160",
  "round162",
  "round164",
  "round167",
  "round169",
  "round173",
  "round175",
  "round179",
  "round181",
  "round185",
  "round187",
  "round191",
  "round193",
  "round197",
  "round199",
  "round203",
  "round205",
  "round209",
  "round211",
  "round219",
  "round222",
  "round225",
  "round227",
  "round232",
  "round237",
  "round242",
  "round247",
  "round250",
  "round256",
  "round264",
  "round267",
  "round273",
  "round278",
  "round289",
  "round293",
  "round300",
  "round303",
  "round308",
  "round313",
  "round318",
  "round322",
  "round326",
  "round330",
  "round335",
  "round339",
  "round344",
  "round349",
  "round356",
  "round360",
  "round364",
  "round367",
  "round371",
  "round375",
  "round379",
  "round382",
  "round386",
  "round389",
  "round395",
  "round397",
  "round400",
  "round401",
  "round406",
  "round407",
  "round412",
  "round413",
  "round415",
  "round417",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round453",
  "round456",
  "round458",
  "round461",
  "round463",
  "round465"
].join("|");

const JSON_OUTPUTS = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "readback.json",
  "strict_duplicate_audit.json"
];

const ALL_OUTPUTS = [
  ...JSON_OUTPUTS,
  "notes.md"
].map((name) => path.join(OUT_DIR, name).replace(/\\/g, "/"));

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

function normalizeLoose(value) {
  return normalizeKey(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
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

function stableSet(values) {
  return [...new Set(values.filter(Boolean).map(cleanText))].sort();
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round473 template patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round473 template patch failed for ${label}: expected one match, found ${count}`);
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
    `const OUT_DIR = "${OUT_DIR_POSIX}";`,
    "output directory"
  );

  transformed = replaceRequired(transformed, "total_construction_floor_area_gte: 25000,", "total_construction_floor_area_gte: 5000,", "floor-area threshold");
  transformed = replaceRequired(transformed, "proposed_dwelling_units_gte: 20,", "proposed_dwelling_units_gte: 5,", "dwelling-unit threshold");
  transformed = replaceRequired(transformed, "proposed_height_gte: 45,", "proposed_height_gte: 25,", "height threshold");
  transformed = replaceRequired(transformed, "proposed_stories_gte: 5,", "proposed_stories_gte: 2,", "story threshold");
  transformed = replaceRequired(transformed, "initial_cost_or_estimated_job_costs_gte: 3000000,", "initial_cost_or_estimated_job_costs_gte: 250000,", "cost threshold");
  transformed = replaceRequired(transformed, "below_high_signal_scale_threshold", "below_round473_architecture_signal_threshold", "rejection threshold label");
  transformed = replaceRequired(transformed, "high_signal_thresholds: HIGH_SIGNAL_THRESHOLDS,", "architecture_signal_thresholds: HIGH_SIGNAL_THRESHOLDS,", "summary threshold label");
  transformed = replaceRequired(transformed, "Not proof that", "Not evidence that", "caveat wording");
  transformed = replaceRequired(transformed, "nonduplicate high-signal administrative permit row", "nonduplicate architecture-signal administrative permit row", "method wording");
  transformed = transformed.replace(/high-signal administrative permit row/g, "architecture-signal administrative permit row");

  const priorText = "manual corpus plus prior DOB NOW/DOB permit/DOB Certificate of Occupancy candidate packs through Round465";
  const priorSlash = "manual-corpus/DOB NOW/DOB permit/DOB CO packs through Round465";
  transformed = replaceRequired(transformed, "round133, round136, and round143", priorText, "prior round prose");
  transformed = replaceRequired(transformed, "round133/round136/round143", priorSlash, "prior slash prose");
  transformed = replaceRequired(transformed, "round133|round136|round143", PRIOR_DOB_ROUND_REGEX_THROUGH_465, "prior round regex");
  transformed = replaceRequired(transformed, "screened_round133_round136_round143_files", "screened_prior_candidate_files_through_round465", "prior summary field");

  const duplicateFilterHelper = `
function round473AllowedDuplicateIndexFile(file) {
  const normalized = String(file || "").replace(/\\\\/g, "/");
  if (normalized.startsWith("${OUT_DIR_POSIX}")) return false;
  const match = normalized.match(/round(\\d+)/i);
  if (!match) return true;
  return Number(match[1]) <= 465;
}

`;
  transformed = replaceOnce(
    transformed,
    "function buildExistingIndex() {",
    `${duplicateFilterHelper}function buildExistingIndex() {`,
    "duplicate index helper insertion"
  );
  transformed = replaceOnce(
    transformed,
    '  const candidateFiles = walkJsonCandidateFiles("tmp/subagents");',
    '  const candidateFiles = walkJsonCandidateFiles("tmp/subagents").filter(round473AllowedDuplicateIndexFile);',
    "duplicate index cutoff"
  );

  transformed = transformed
    .replace(/round149/g, "round473")
    .replace(/Round149/g, "Round473")
    .replace(/nyc_dob_now_next/g, "nyc_dob_now_next31")
    .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next31")
    .replace(/NYC DOB NOW next/g, "NYC DOB NOW next31")
    .replace(/Round473 generator queried DOB NOW/g, "Round473 generator queried official DOB NOW")
    .replace(/Generated \$\{candidates\.length\} additional administrative DOB NOW approved-permit candidates/g, "Generated ${candidates.length} residual administrative DOB NOW approved-permit candidates")
    .replace(/round473_nyc_dob_now_next3131/g, "round473_nyc_dob_now_next31")
    .replace(/nyc_dob_now_next3131/g, "nyc_dob_now_next31");

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
}

async function runTransformedTemplateMain() {
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
    throw new Error("Transformed Round473 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
}

function walkJsonCandidateFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (normalized === OUT_DIR_POSIX) continue;
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

function roundNumberFromPath(file) {
  const match = file.replace(/\\/g, "/").match(/(?:^|\/)round(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function isRequestedPriorDobFile(file) {
  const normalized = file.replace(/\\/g, "/");
  const round = roundNumberFromPath(normalized);
  if (!round || round > 465) return false;
  return /round\d+_nyc_dob/i.test(normalized) || /round117_nyc_local_dob/i.test(normalized);
}

function corpusStats() {
  const stats = {
    path: CORPUS_PATH_POSIX,
    present: fs.existsSync(CORPUS_PATH),
    records: 0,
    contains_round465: false,
    round465_records: 0
  };
  if (!stats.present) return stats;
  const records = candidateArray(readJson(CORPUS_PATH));
  stats.records = records.length;
  stats.round465_records = records.filter((record) => {
    const text = JSON.stringify(record);
    return text.includes("round465") || text.includes("Round465") || text.includes("nyc_dob_now_next30");
  }).length;
  stats.contains_round465 = stats.round465_records > 0;
  return stats;
}

function titleDateSiteKey(record) {
  const title = normalizeLoose(record.title);
  const date = parseDate(record.effective_date || record.date || record.issuance_date || record.issued_date);
  const site = normalizeLoose(
    record.address ||
    record.area ||
    record.site ||
    record.affected_area?.label ||
    record.source_fields?.permit?.street_name ||
    ""
  );
  return title && date && site ? `${title}|${date}|${site}` : "";
}

function identifierValues(record) {
  const values = [];
  for (const field of [
    "id",
    "event_id",
    "candidate_id",
    "source_record_id",
    "source_url",
    "application_source_url",
    "application_source_record_id",
    "job_filing_number",
    "base_job_filing_number",
    "permit_job_filing_number",
    "work_permit",
    "tracking_number",
    "application_number",
    "job_number",
    "c_of_o_number"
  ]) {
    if (record[field]) values.push(record[field]);
  }
  const refs = record.source_row_ref || {};
  for (const field of [
    "row_key",
    "work_permit",
    "tracking_number",
    "joined_application_row_key",
    "base_job_filing_number",
    "permit_job_filing_number",
    "job_filing_number"
  ]) {
    if (refs[field]) values.push(refs[field]);
  }
  return values.map(cleanText).filter(Boolean);
}

function sourceRecordOrUrlValues(record) {
  return [
    record.source_record_id,
    record.source_url,
    record.application_source_url,
    record.application_source_record_id
  ].map(cleanText).filter(Boolean);
}

function sourceDateTokenValues(record) {
  const date = parseDate(record.effective_date || record.date || record.issuance_date || record.issued_date);
  if (!date) return [];
  const values = [];
  for (const field of [
    "source_record_id",
    "job_filing_number",
    "base_job_filing_number",
    "permit_job_filing_number",
    "work_permit",
    "tracking_number",
    "application_source_record_id",
    "application_number",
    "job_number",
    "c_of_o_number"
  ]) {
    if (record[field]) values.push(record[field]);
  }
  const refs = record.source_row_ref || {};
  for (const field of [
    "row_key",
    "work_permit",
    "tracking_number",
    "joined_application_row_key",
    "base_job_filing_number",
    "permit_job_filing_number",
    "job_filing_number"
  ]) {
    if (refs[field]) values.push(refs[field]);
  }
  return [...new Set(
    values
      .map((value) => `${normalizeKey(value)}|${date}`)
      .filter((value) => value.length > date.length + 1)
  )];
}

function canonicalSourceDateKey(record) {
  const date = parseDate(record.effective_date || record.date || record.issuance_date || record.issued_date);
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.source_row_ref?.row_key ||
    record.work_permit ||
    record.tracking_number ||
    record.job_filing_number ||
    ""
  );
  return sourceRecord && date ? `${normalizeKey(sourceRecord)}|${date}` : "";
}

function addRecordToDuplicateIndex(index, record) {
  for (const value of identifierValues(record)) {
    const key = normalizeKey(value);
    if (key.length >= 4) index.identifierTokens.add(key);
  }
  for (const value of sourceRecordOrUrlValues(record)) {
    const key = normalizeKey(value);
    if (key.length >= 4) index.sourceRecordOrUrlTokens.add(key);
  }
  for (const key of sourceDateTokenValues(record)) index.sourceDateKeys.add(key);
  const titleSite = titleDateSiteKey(record);
  if (titleSite) index.titleDateSiteKeys.add(titleSite);
}

function buildRequestedDuplicateScopeCheck(candidates) {
  const priorDobFiles = walkJsonCandidateFiles("tmp/subagents")
    .map((file) => file.replace(/\\/g, "/"))
    .filter(isRequestedPriorDobFile)
    .sort();
  const priorFiles = [
    CORPUS_PATH_POSIX,
    ...priorDobFiles
  ];
  const index = {
    identifierTokens: new Set(),
    sourceRecordOrUrlTokens: new Set(),
    sourceDateKeys: new Set(),
    titleDateSiteKeys: new Set()
  };
  const parseSkipped = [];

  for (const file of priorFiles) {
    if (!fs.existsSync(file)) continue;
    try {
      for (const record of candidateArray(readJson(file))) addRecordToDuplicateIndex(index, record);
    } catch (error) {
      parseSkipped.push(`${file}: ${error.message}`);
    }
  }

  const overlaps = {
    identifier_token_records: 0,
    source_record_or_url_records: 0,
    source_date_records: 0,
    title_date_site_records: 0
  };
  const samples = [];
  const candidateSourceDateKeys = new Set();
  const candidateTitleDateSiteKeys = new Set();
  const internal = {
    duplicate_event_ids: 0,
    duplicate_candidate_ids: 0,
    duplicate_source_record_ids: 0,
    duplicate_source_date_keys: 0,
    duplicate_title_date_site_keys: 0
  };
  const seen = {
    event_ids: new Set(),
    candidate_ids: new Set(),
    source_record_ids: new Set()
  };

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.event_id || candidate.title || "unknown candidate";
    for (const [field, setName, countName] of [
      ["event_id", "event_ids", "duplicate_event_ids"],
      ["candidate_id", "candidate_ids", "duplicate_candidate_ids"],
      ["source_record_id", "source_record_ids", "duplicate_source_record_ids"]
    ]) {
      const key = normalizeKey(candidate[field]);
      if (key && seen[setName].has(key)) internal[countName] += 1;
      if (key) seen[setName].add(key);
    }

    const localIdentifiers = identifierValues(candidate).map(normalizeKey).filter((key) => key.length >= 4);
    const localSourceRecordOrUrl = sourceRecordOrUrlValues(candidate).map(normalizeKey).filter((key) => key.length >= 4);
    const localSourceDateKeys = sourceDateTokenValues(candidate);
    const canonicalSourceDate = canonicalSourceDateKey(candidate);
    const titleSite = titleDateSiteKey(candidate);

    if (localIdentifiers.some((token) => index.identifierTokens.has(token))) {
      overlaps.identifier_token_records += 1;
      if (samples.length < 20) samples.push({ candidate: label, overlap_type: "identifier_token" });
    }
    if (localSourceRecordOrUrl.some((token) => index.sourceRecordOrUrlTokens.has(token))) {
      overlaps.source_record_or_url_records += 1;
      if (samples.length < 20) samples.push({ candidate: label, overlap_type: "source_record_or_url" });
    }
    if (localSourceDateKeys.some((token) => index.sourceDateKeys.has(token))) {
      overlaps.source_date_records += 1;
      if (samples.length < 20) samples.push({ candidate: label, overlap_type: "source_date" });
    }
    if (titleSite && index.titleDateSiteKeys.has(titleSite)) {
      overlaps.title_date_site_records += 1;
      if (samples.length < 20) samples.push({ candidate: label, overlap_type: "title_date_site" });
    }

    if (canonicalSourceDate) {
      if (candidateSourceDateKeys.has(canonicalSourceDate)) internal.duplicate_source_date_keys += 1;
      candidateSourceDateKeys.add(canonicalSourceDate);
    }
    if (titleSite) {
      if (candidateTitleDateSiteKeys.has(titleSite)) internal.duplicate_title_date_site_keys += 1;
      candidateTitleDateSiteKeys.add(titleSite);
    }
  }

  return {
    schema_version: "round473.nyc_dob_now_next31_strict_duplicate_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    scope: "Manual architecture corpus plus NYC DOB NOW/DOB permit/DOB Certificate of Occupancy candidate packs with round number <= 465, including tmp/subagents/round465_nyc_dob_now_next30/candidates.json.",
    manual_corpus_path: CORPUS_PATH_POSIX,
    prior_files_checked: priorFiles.filter((file) => fs.existsSync(file)).length,
    prior_dob_files_checked: priorDobFiles.filter((file) => fs.existsSync(file)).length,
    prior_dob_files_scanned: priorDobFiles.filter((file) => fs.existsSync(file)),
    round465_candidates_checked: priorDobFiles.some((file) => /round465_nyc_dob_now_next30\/candidates\.json/i.test(file)),
    future_or_disjoint_rounds_required_for_requested_scope: false,
    prior_identifier_tokens_checked: index.identifierTokens.size,
    prior_source_record_or_url_tokens_checked: index.sourceRecordOrUrlTokens.size,
    prior_source_date_keys_checked: index.sourceDateKeys.size,
    prior_title_date_site_keys_checked: index.titleDateSiteKeys.size,
    candidate_internal_duplicate_counts: internal,
    overlap_counts: overlaps,
    overlap_samples: samples,
    parse_skipped: parseSkipped,
    no_duplicate_event_source_job_permit_source_date_or_title_date_site_records:
      Object.values(overlaps).every((count) => count === 0) &&
      Object.values(internal).every((count) => count === 0)
  };
}

function dateRangeFor(candidates) {
  return candidates.reduce((acc, candidate) => {
    const date = parseDate(candidate.effective_date || candidate.date);
    if (date && (!acc.start || date < acc.start)) acc.start = date;
    if (date && (!acc.end || date > acc.end)) acc.end = date;
    return acc;
  }, { start: "", end: "" });
}

function normalizeCandidateArtifacts(candidatesDoc, strictAudit) {
  const candidates = candidateArray(candidatesDoc);
  for (const candidate of candidates) {
    candidate.id = candidate.id || candidate.candidate_id || candidate.event_id;
    candidate.method = candidate.method || candidate.transformation_method;
    candidate.geometry_ref = candidate.geometry_ref || {
      type: "geocoded_point",
      source: candidate.geometry_source,
      precision: candidate.geometry_precision,
      address: candidate.address || "",
      borough: candidate.borough || "",
      bbl: candidate.bbl || "",
      bin: candidate.bin || ""
    };
    candidate.job_identifiers = candidate.job_identifiers || {
      job_filing_number: candidate.job_filing_number || "",
      base_job_filing_number: candidate.base_job_filing_number || "",
      permit_job_filing_number: candidate.permit_job_filing_number || "",
      work_permit: candidate.work_permit || "",
      tracking_number: candidate.tracking_number || "",
      sequence_number: candidate.sequence_number || ""
    };
    candidate.milestone_type = "DOB NOW approved permit issued";
    candidate.duplicate_check_note = "Exact event_id, source URL/record ID, DOB NOW job/permit/tracking identifiers, source-date tokens, and title/date/site keys were screened against the manual corpus plus NYC DOB NOW/DOB permit/DOB CO candidate packs through Round465.";
    candidate.transformation_method = `Round473 queried official NYC Open Data DOB NOW approved permit rows (${DATASET_ENDPOINTS.permits.id}) for ${START_DATE} through ${END_DATE}, joined retained permit rows to DOB NOW job application filing rows (${DATASET_ENDPOINTS.applications.id}), kept one nonduplicate architecture-signal administrative permit row per base DOB NOW job, and preserved row-level permit/application provenance. Duplicate scope: manual corpus plus prior DOB administrative candidate packs through Round465.`;
    candidate.method = candidate.transformation_method;
    candidate.limitations = cleanText(candidate.limitations);
    candidate.source_ids = stableSet([
      ...(candidate.source_ids || []),
      DATASET_ENDPOINTS.canonical_source_id,
      DATASET_ENDPOINTS.applications.source_id,
      DATASET_ENDPOINTS.permits.source_id
    ]);
  }

  candidatesDoc.schema_version = "round473.nyc_dob_now_next31_candidates.v1";
  candidatesDoc.generated_at = GENERATED_AT;
  candidatesDoc.accessed_at = ACCESSED_AT;
  candidatesDoc.worker = "Round473 NYC DOB NOW Next31 candidates";
  candidatesDoc.scope = "Official NYC DOB NOW Build approved-permit candidate pack joined to DOB NOW Build job application filings, screened against the manual corpus and prior DOB administrative candidate packs through Round465. Records are administrative permit/filing milestones only and must not be presented as construction start, completion, opening, occupancy, causation, or impact evidence.";
  candidatesDoc.candidate_count = candidates.length;
  candidatesDoc.selection_summary = {
    ...(candidatesDoc.selection_summary || {}),
    date_window: { start: START_DATE, end: END_DATE },
    target_count: TARGET_COUNT,
    prior_scope: {
      manual_corpus: corpusStats(),
      dob_now_rounds_through: "round465",
      dob_now_rounds_screened: DOB_NOW_ROUNDS_THROUGH_465,
      dob_admin_round_cutoff: 465,
      requested_duplicate_scope_check: strictAudit
    }
  };
}

function patchGeneratedArtifacts() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");
  const notesPath = path.join(OUT_DIR, "notes.md");

  const candidatesDoc = readJson(candidatesPath);
  const candidates = candidateArray(candidatesDoc);
  const strictAudit = buildRequestedDuplicateScopeCheck(candidates);
  normalizeCandidateArtifacts(candidatesDoc, strictAudit);

  const summaryDoc = readJson(summaryPath);
  const sourceAuditDoc = readJson(sourceAuditPath);
  const rejectedDoc = readJson(rejectedPath);
  const dateRange = dateRangeFor(candidates);
  const selectedSummary = {
    by_borough: countBy(candidates, (candidate) => candidate.borough),
    by_work_type: countBy(candidates, (candidate) => candidate.work_type),
    by_job_type: countBy(candidates, (candidate) => candidate.job_type),
    by_year: countBy(candidates, (candidate) => String(candidate.date || candidate.effective_date || "").slice(0, 4))
  };
  const priorScope = candidatesDoc.selection_summary.prior_scope;

  const sourceAudits = (candidatesDoc.source_audits || []).map((source) => ({
    ...source,
    coverage_years_checked: source.dataset_id === DATASET_ENDPOINTS.permits.id
      ? `${START_DATE} through ${END_DATE}; this round paginated approved permit rows directly before joining job filings.`
      : "Rows joined from the directly paginated permit set; job_type filtered to New Building, Alteration CO, and ALT-CO - New Building with Existing Elements to Remain.",
    granularity: source.dataset_id === DATASET_ENDPOINTS.permits.id
      ? "One approved permit row; this generator retains one substantial initial permit row per base DOB NOW job filing beyond the manual corpus and DOB administrative candidate packs through Round465."
      : "One DOB NOW job filing row; used as joined context for the retained approved-permit row.",
    candidates_retained: candidates.length
  }));
  candidatesDoc.source_audits = sourceAudits;

  sourceAuditDoc.schema_version = "round473.nyc_dob_now_next31_source_audit.v1";
  sourceAuditDoc.generated_at = GENERATED_AT;
  sourceAuditDoc.accessed_at = ACCESSED_AT;
  sourceAuditDoc.audit_scope = "Official NYC DOB NOW Build approved permits and job application filings, selected for residual administrative milestone candidate discovery after screening the manual corpus and DOB administrative candidate packs through Round465.";
  sourceAuditDoc.sources = sourceAudits;
  sourceAuditDoc.selection_summary = {
    ...(candidatesDoc.selection_summary || {}),
    requested_duplicate_scope_check: strictAudit
  };
  sourceAuditDoc.caveat = "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, impacts, or causation unless another source explicitly supports that claim.";

  summaryDoc.schema_version = "round473.nyc_dob_now_next31_summary.v1";
  summaryDoc.generated_at = GENERATED_AT;
  summaryDoc.accessed_at = ACCESSED_AT;
  summaryDoc.output_files = ALL_OUTPUTS;
  summaryDoc.worker = "Round473 NYC DOB NOW Next31 candidates";
  summaryDoc.candidate_count = candidates.length;
  summaryDoc.selected_summary = selectedSummary;
  summaryDoc.source_ids = stableSet([
    DATASET_ENDPOINTS.canonical_source_id,
    DATASET_ENDPOINTS.permits.source_id,
    DATASET_ENDPOINTS.applications.source_id,
    ...(summaryDoc.source_ids || [])
  ]);
  summaryDoc.date_window = { start: START_DATE, end: END_DATE };
  summaryDoc.date_range = dateRange;
  summaryDoc.duplicate_screening = {
    ...(summaryDoc.duplicate_screening || {}),
    requested_duplicate_scope_check: strictAudit,
    screened_prior_dob_now_permit_co_files: strictAudit.prior_dob_files_scanned,
    cutoff_round: 465,
    round465_candidates_checked: strictAudit.round465_candidates_checked
  };
  summaryDoc.selection_summary = {
    ...(summaryDoc.selection_summary || {}),
    prior_scope: priorScope,
    requested_duplicate_scope_check: strictAudit
  };
  summaryDoc.caveats = [
    "Administrative DOB NOW filing/permit milestone only.",
    "Not evidence that a building was built, construction started, construction completed, a public opening occurred, occupancy was granted, or a causal impact occurred.",
    "Candidate dates are DOB NOW approved-permit issued_date values.",
    "Coordinates are DOB/Open Data geocoded address points, not footprints or work boundaries.",
    "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
  ];

  rejectedDoc.schema_version = "round473.nyc_dob_now_next31_rejections.v1";
  rejectedDoc.generated_at = GENERATED_AT;
  rejectedDoc.accessed_at = ACCESSED_AT;
  rejectedDoc.rejected_counts = Object.fromEntries(Object.entries(rejectedDoc.rejected_counts || {}).sort(([a], [b]) => a.localeCompare(b)));

  const notes = [
    "# Round473 NYC DOB NOW Next31 Candidate Pack",
    "",
    `Generated ${candidates.length} residual, nonduplicate administrative DOB NOW approved-permit candidates on ${ACCESSED_AT}.`,
    "",
    "## Official Endpoints",
    "",
    `- Approved permits: ${DATASET_ENDPOINTS.permits.page}`,
    `- Approved permits API: ${DATASET_ENDPOINTS.permits.api}`,
    `- Approved permits metadata: ${DATASET_ENDPOINTS.permits.metadata}`,
    `- Job application filings: ${DATASET_ENDPOINTS.applications.page}`,
    `- Job application filings API: ${DATASET_ENDPOINTS.applications.api}`,
    `- Job application filings metadata: ${DATASET_ENDPOINTS.applications.metadata}`,
    "",
    "## Scope",
    "",
    `Official NYC Open Data DOB NOW Build approved permit rows (\`${DATASET_ENDPOINTS.permits.id}\`) joined to DOB NOW Build job application filing rows (\`${DATASET_ENDPOINTS.applications.id}\`). Candidate dates are permit \`issued_date\` values. Requested window: ${START_DATE} through ${END_DATE}. Retained candidate date range: ${dateRange.start || "n/a"} through ${dateRange.end || "n/a"}.`,
    "",
    "## Caveats",
    "",
    "- Rows are administrative permit/job filing records only.",
    "- They do not document construction start, construction completion, public opening, occupancy, final built form, causation, impacts, or outcome effects.",
    "- Scale fields are source-reported filing attributes and can be amended by later DOB records.",
    "- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.",
    "- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.",
    "",
    "## Duplicate Screening",
    "",
    `Strict requested audit checked ${strictAudit.prior_dob_files_checked} prior DOB administrative candidate files plus the manual corpus through Round465. Round465 pack checked: ${strictAudit.round465_candidates_checked}.`,
    `Identifier tokens checked: ${strictAudit.prior_identifier_tokens_checked}; source URL/record tokens checked: ${strictAudit.prior_source_record_or_url_tokens_checked}; source/date keys checked: ${strictAudit.prior_source_date_keys_checked}; title/date/site keys checked: ${strictAudit.prior_title_date_site_keys_checked}.`,
    `Overlap counts: ${JSON.stringify(strictAudit.overlap_counts)}. Internal duplicate counts: ${JSON.stringify(strictAudit.candidate_internal_duplicate_counts)}.`,
    "",
    "## Counts",
    "",
    `- Permit rows fetched: ${candidatesDoc.selection_summary.permit_rows_fetched}`,
    `- Permit rows after duplicate/geography filters: ${candidatesDoc.selection_summary.permit_rows_after_duplicate_and_geometry_filters}`,
    `- Application rows fetched: ${candidatesDoc.selection_summary.application_rows_fetched}`,
    `- Candidate pool before balancing: ${candidatesDoc.selection_summary.candidate_pool_before_balancing}`,
    `- Candidates retained: ${candidates.length}`,
    `- Validation report: ${path.join(OUT_DIR, "validation_report.json").replace(/\\/g, "/")}`
  ].join("\n");

  writeJson(candidatesPath, candidatesDoc);
  writeJson(sourceAuditPath, sourceAuditDoc);
  writeJson(summaryPath, summaryDoc);
  writeJson(rejectedPath, rejectedDoc);
  writeJson(path.join(OUT_DIR, "strict_duplicate_audit.json"), strictAudit);
  fs.writeFileSync(notesPath, `${notes}\n`);
  return { candidatesDoc, summaryDoc, sourceAuditDoc, rejectedDoc, strictAudit };
}

function buildReadbackAndValidation() {
  const errors = [];
  const warnings = [];
  const parsed = {};
  const fileStats = {};

  const preexistingJsonOutputs = JSON_OUTPUTS.filter((name) => ![
    "validation.json",
    "validation_report.json",
    "readback.json"
  ].includes(name));

  for (const name of preexistingJsonOutputs) {
    const fullPath = path.join(OUT_DIR, name);
    const relPath = fullPath.replace(/\\/g, "/");
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing JSON output ${relPath}`);
      continue;
    }
    try {
      parsed[name] = readJson(fullPath);
      fileStats[name] = {
        path: relPath,
        bytes: fs.statSync(fullPath).size,
        parsed: true
      };
    } catch (error) {
      errors.push(`Failed to parse ${relPath}: ${error.message}`);
      fileStats[name] = {
        path: relPath,
        bytes: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0,
        parsed: false
      };
    }
  }

  const notesPath = path.join(OUT_DIR, "notes.md");
  if (!fs.existsSync(notesPath)) errors.push(`Missing notes output ${notesPath.replace(/\\/g, "/")}`);

  const candidates = candidateArray(parsed["candidates.json"]);
  const summary = parsed["summary.json"] || {};
  const sourceAudit = parsed["source_audit.json"] || {};
  const rejected = parsed["rejected.json"] || {};
  const strictAudit = parsed["strict_duplicate_audit.json"] || buildRequestedDuplicateScopeCheck(candidates);
  const dateRange = dateRangeFor(candidates);
  const ids = new Set();
  const candidateIds = new Set();
  const eventIds = new Set();
  const sourceRecordIds = new Set();
  const sourceDateKeys = new Set();
  const jobPermitSourceDateTokens = new Set();
  const titleDateSiteKeys = new Set();
  const sourceIds = new Set();
  const banned = /\b(caused|proves?|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const requiredCandidateFields = [
    "id",
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

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.id || "unknown candidate";
    for (const field of requiredCandidateFields) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Missing ${field} for ${label}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`Unexpected city_id for ${label}: ${candidate.city_id}`);
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`Unexpected accessed_at for ${label}: ${candidate.accessed_at}`);
    if (candidate.source_dataset_id !== DATASET_ENDPOINTS.permits.source_id) errors.push(`Unexpected source_dataset_id for ${label}: ${candidate.source_dataset_id}`);
    if (!String(candidate.source_date_field || "").includes("issued_date")) errors.push(`source_date_field does not name issued_date for ${label}`);
    if (!candidate.source_ids?.includes(DATASET_ENDPOINTS.canonical_source_id)) errors.push(`Missing canonical DOB source id for ${label}`);

    const date = parseDate(candidate.effective_date || candidate.date);
    if (!date || date < START_DATE || date > END_DATE) {
      errors.push(`Date outside ${START_DATE}..${END_DATE} for ${label}: ${candidate.effective_date || candidate.date}`);
    }
    const lat = Number(candidate.latitude);
    const lon = Number(candidate.longitude);
    if (!isNycPoint(lat, lon)) errors.push(`Invalid NYC lat/lon for ${label}: ${candidate.latitude}, ${candidate.longitude}`);
    if (candidate.geometry?.type !== "Point" || !Array.isArray(candidate.geometry.coordinates) || candidate.geometry.coordinates.length !== 2) {
      errors.push(`Invalid Point geometry for ${label}`);
    }

    for (const sourceId of candidate.source_ids || [candidate.source_id]) sourceIds.add(sourceId);

    for (const [set, value, field] of [
      [ids, candidate.id, "id"],
      [candidateIds, candidate.candidate_id, "candidate_id"],
      [eventIds, candidate.event_id, "event_id"],
      [sourceRecordIds, candidate.source_record_id, "source_record_id"]
    ]) {
      const key = normalizeKey(value);
      if (key && set.has(key)) errors.push(`Duplicate ${field}: ${value}`);
      if (key) set.add(key);
    }

    const titleSite = titleDateSiteKey(candidate);
    if (titleDateSiteKeys.has(titleSite)) errors.push(`Duplicate title/date/site key ${titleSite}`);
    if (titleSite) titleDateSiteKeys.add(titleSite);
    const canonicalSourceDate = canonicalSourceDateKey(candidate);
    if (!canonicalSourceDate) {
      errors.push(`Missing canonical source/date key for ${label}`);
    } else {
      if (sourceDateKeys.has(canonicalSourceDate)) errors.push(`Duplicate candidate source/date key ${canonicalSourceDate}`);
      sourceDateKeys.add(canonicalSourceDate);
    }
    for (const key of sourceDateTokenValues(candidate)) jobPermitSourceDateTokens.add(key);

    const prose = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method,
      candidate.duplicate_check_note
    ].join(" ");
    if (banned.test(prose)) errors.push(`Overclaim wording detected for ${label}`);
    if (!/administrative/i.test(candidate.limitations || "") || !/not evidence/i.test(candidate.limitations || "")) {
      errors.push(`Administrative/not-evidence caveat missing for ${label}`);
    }
  }

  if (candidates.length > TARGET_COUNT) errors.push(`Candidate count ${candidates.length} exceeds target cap ${TARGET_COUNT}`);
  if (candidates.length !== TARGET_COUNT) warnings.push(`Candidate count ${candidates.length} differs from target ${TARGET_COUNT}`);
  if (summary.candidate_count !== candidates.length) errors.push("summary.json candidate_count does not match candidates array");
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length < 2) errors.push("source_audit.json does not include both official DOB NOW sources");
  if (!rejected.rejected_counts || typeof rejected.rejected_counts !== "object") errors.push("rejected.json missing rejected_counts");
  if (strictAudit.round465_candidates_checked !== true) errors.push("strict duplicate audit did not confirm Round465 screening");
  if (strictAudit.no_duplicate_event_source_job_permit_source_date_or_title_date_site_records !== true) errors.push("strict duplicate audit found requested-scope overlaps");

  const readback = {
    schema_version: "round473.nyc_dob_now_next31_readback.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: errors.length === 0,
    output_dir: OUT_DIR_POSIX,
    json_files: fileStats,
    notes_file: {
      path: notesPath.replace(/\\/g, "/"),
      bytes: fs.existsSync(notesPath) ? fs.statSync(notesPath).size : 0,
      present: fs.existsSync(notesPath)
    },
    candidate_count: candidates.length,
    date_window: { start: START_DATE, end: END_DATE },
    date_range: dateRange,
    endpoints: DATASET_ENDPOINTS,
    source_ids: stableSet([...sourceIds, ...(summary.source_ids || [])]),
    selected_summary: {
      by_borough: countBy(candidates, (candidate) => candidate.borough),
      by_work_type: countBy(candidates, (candidate) => candidate.work_type),
      by_job_type: countBy(candidates, (candidate) => candidate.job_type),
      by_year: countBy(candidates, (candidate) => String(candidate.date || candidate.effective_date || "").slice(0, 4))
    },
    prior_screening: {
      manual_corpus: corpusStats(),
      requested_duplicate_scope_check: strictAudit,
      no_overlap_with_requested_scope: strictAudit.no_duplicate_event_source_job_permit_source_date_or_title_date_site_records === true
    },
    caveats: summary.caveats || [],
    errors,
    warnings
  };

  const validation = {
    schema_version: "round473.nyc_dob_now_next31_validation.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: errors.length === 0,
    passed: errors.length === 0,
    validator: SCRIPT_PATH.replace(/\\/g, "/"),
    checked_files: ALL_OUTPUTS,
    checks: {
      candidate_count: candidates.length,
      target_count: TARGET_COUNT,
      summary_candidate_count: summary.candidate_count,
      required_provenance_fields: requiredCandidateFields,
      date_window: { start: START_DATE, end: END_DATE },
      date_range: dateRange,
      unique_ids: ids.size,
      unique_candidate_ids: candidateIds.size,
      unique_event_ids: eventIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_job_permit_source_date_tokens: jobPermitSourceDateTokens.size,
      unique_title_date_site_keys: titleDateSiteKeys.size,
      nyc_coordinate_bounds_valid: candidates.every((candidate) => isNycPoint(Number(candidate.latitude), Number(candidate.longitude))),
      source_dataset_only: "rbx6-tga4 joined to w9ak-ipjd",
      source_date_field: "issued_date",
      source_date_field_mix: countBy(candidates, (candidate) => `${candidate.source_row_ref?.dataset_id || "unknown"}|issued_date`),
      milestone_type_mix: countBy(candidates, (candidate) => candidate.milestone_type || "DOB NOW approved permit issued"),
      work_type_mix: countBy(candidates, (candidate) => candidate.work_type),
      job_type_mix: countBy(candidates, (candidate) => candidate.job_type),
      borough_mix: countBy(candidates, (candidate) => candidate.borough),
      year_mix: countBy(candidates, (candidate) => String(candidate.date || "").slice(0, 4)),
      requested_duplicate_scope_check: strictAudit,
      no_duplicate_event_source_job_permit_source_date_or_title_date_site_records: strictAudit.no_duplicate_event_source_job_permit_source_date_or_title_date_site_records === true,
      no_prediction_or_causation_language: errors.every((error) => !/Overclaim wording/i.test(error)),
      notes_present: fs.existsSync(notesPath),
      readback_ok: readback.ok
    },
    errors,
    warnings
  };

  const validationReport = {
    schema_version: "round473.nyc_dob_now_next31_validation_report.v1",
    ok: errors.length === 0,
    passed: errors.length === 0,
    checked_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: "scripts/fetch_round473_nyc_dob_now_next31_candidates.js --validate-only; validates emitted JSON, strict requested duplicate scope, provenance fields, point geometry, date window, and administrative-record caveats.",
    checked_files: ALL_OUTPUTS,
    checks: validation.checks,
    errors,
    warnings
  };

  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);

  if (errors.length) {
    throw new Error(`Round473 validation failed with ${errors.length} errors. See ${path.join(OUT_DIR, "validation.json")}`);
  }
  return { readback, validation, validationReport };
}

async function main() {
  if (!process.argv.includes("--validate-only")) {
    await runTransformedTemplateMain();
  }
  patchGeneratedArtifacts();
  const { validation } = buildReadbackAndValidation();
  console.log(`Round473 validation passed for ${validation.checks.candidate_count} candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
