const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = ACCESSED_AT;
const TEMPLATE_PATH = path.join("scripts", "fetch_round242_nyc_dob_co_next15_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round247_nyc_dob_co_next16");
const REQUIRED_SCREENED_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"
];

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

function sourceDateKey(record) {
  const source = cleanText(record.source_dataset_id || record.source_id || "*");
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.application_number ||
    record.c_of_o_number ||
    record.job_number ||
    record.job_filing_name ||
    ""
  );
  const date = parseDate(record.date || record.effective_date || "");
  return sourceRecord && date ? `${source}|${sourceRecord}|${date}`.toLowerCase() : "";
}

function sourceDateWildcardKey(record) {
  const sourceRecord = cleanText(
    record.source_record_id ||
    record.application_number ||
    record.c_of_o_number ||
    record.job_number ||
    record.job_filing_name ||
    ""
  );
  const date = parseDate(record.date || record.effective_date || "");
  return sourceRecord && date ? `*|${sourceRecord}|${date}`.toLowerCase() : "";
}

function sourceUrlDateKey(record) {
  const sourceUrl = cleanText(record.source_url);
  const date = parseDate(record.date || record.effective_date || "");
  return sourceUrl && date ? `${sourceUrl}|${date}`.toLowerCase() : "";
}

function addIdentifier(tokens, value) {
  const text = normalizeKey(value);
  if (text.length >= 4) tokens.add(text);
}

function addIdentifierRegexTokens(tokens, value) {
  const text = cleanText(value);
  if (!text) return;
  for (const match of text.matchAll(/\bCO-\d{5,}\b/gi)) addIdentifier(tokens, match[0]);
  for (const match of text.matchAll(/\b[12345]\d{8}\b/g)) addIdentifier(tokens, match[0]);
  for (const match of text.matchAll(/\b[A-Z]\d{8}(?:-[A-Z0-9]+)?\b/gi)) {
    addIdentifier(tokens, match[0]);
    const base = match[0].match(/^([A-Z]\d{8})/i);
    if (base) addIdentifier(tokens, base[1]);
  }
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
    "application_source_record_id",
    "application_number",
    "c_of_o_number",
    "job_number",
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
      continue;
    }
    for (const value of Object.values(nested)) {
      addIdentifierRegexTokens(tokens, value);
    }
  }
}

function buildExistingIndex(files) {
  const eventIds = new Set();
  const candidateIds = new Set();
  const sourceDateKeys = new Set();
  const sourceDateWildcardKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const identifierTokens = new Set();
  const filesRead = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const doc = readJson(file);
    filesRead.push(file.replace(/\\/g, "/"));
    for (const record of candidateArray(doc)) {
      if (record.event_id) eventIds.add(normalizeKey(record.event_id));
      if (record.candidate_id) candidateIds.add(normalizeKey(record.candidate_id));
      const sourceDate = sourceDateKey(record);
      if (sourceDate) sourceDateKeys.add(sourceDate);
      const wildcard = sourceDateWildcardKey(record);
      if (wildcard) sourceDateWildcardKeys.add(wildcard);
      const urlDate = sourceUrlDateKey(record);
      if (urlDate) sourceUrlDateKeys.add(urlDate);
      addRecordIdentifiers(identifierTokens, record);
    }
  }

  return {
    eventIds,
    candidateIds,
    sourceDateKeys,
    sourceDateWildcardKeys,
    sourceUrlDateKeys,
    identifierTokens,
    filesRead
  };
}

function transformTemplate(source) {
  let transformed = source
    .replaceAll("round242", "round247")
    .replaceAll("Round242", "Round247")
    .replaceAll("next15", "next16")
    .replaceAll("Next15", "Next16")
    .replaceAll("through round232", "through round242")
    .replaceAll("219, 225, and 232", "219, 225, 232, and 242")
    .replaceAll("\"232\"]", "\"232\", \"242\"]");

  transformed = transformed.replace(
    /const PRIOR_DOB_ROUND_PATTERN = .+;\n/,
    "const PRIOR_DOB_ROUND_PATTERN = /round(117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219|225|232|242).*nyc.*(dob|co)|nyc.*(dob|co).*round(117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219|225|232|242)/i;\n"
  );

  const duplicateNeedle = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json"\n];';
  const duplicateReplacement = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",\n  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"\n];';
  if (!transformed.includes(duplicateNeedle)) {
    throw new Error("Template duplicate-file block did not match expected round232 tail.");
  }
  transformed = transformed.replace(duplicateNeedle, duplicateReplacement);

  transformed = transformed.replace(
    /\/round\(160\|164\|169\|175\|181\|187\|193\|199\|205\|211\|219\|225\|232\)_nyc_dob_co_next\(2\|3\|4\|5\|6\|7\|8\|9\|10\|11\|12\|13\|14\)\/i/,
    "/round(160|164|169|175|181|187|193|199|205|211|219|225|232|242)_nyc_dob_co_next(2|3|4|5|6|7|8|9|10|11|12|13|14|15)/i"
  );

  const invocation = `main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});`;
  if (!transformed.includes(invocation)) {
    throw new Error("Template main invocation did not match expected shape.");
  }
  transformed = transformed.replace(invocation, "module.exports = { main };");

  return transformed;
}

async function runTemplateMain() {
  const source = transformTemplate(fs.readFileSync(TEMPLATE_PATH, "utf8"));
  const sandbox = {
    require,
    console,
    process,
    setTimeout,
    clearTimeout,
    URL,
    fetch,
    module: { exports: {} },
    exports: {}
  };
  vm.runInNewContext(source, sandbox, {
    filename: "scripts/fetch_round247_nyc_dob_co_next16_candidates.generated.js"
  });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed template did not export main().");
  }
  await sandbox.module.exports.main();
}

function statusFor(candidate) {
  return candidate.source_dataset_id === "pkdm-hqz6"
    ? candidate.c_of_o_status
    : candidate.application_status_raw;
}

function validateIndependent(candidates, summary) {
  const requiredFields = [
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
    "source_fields"
  ];
  const confidenceValues = new Set(["documented", "corroborated", "inferred", "disputed"]);
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const screenedFiles = (summary.selection_summary?.duplicate_screening?.screened_files || []).map((file) => file.replace(/\\/g, "/"));

  for (const requiredFile of REQUIRED_SCREENED_FILES) {
    if (!screenedFiles.includes(requiredFile)) {
      throw new Error(`Independent validation missing required screened file: ${requiredFile}`);
    }
  }

  const existing = buildExistingIndex(screenedFiles);

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Independent validation missing ${field} for ${candidate.candidate_id || candidate.event_id}`);
      }
    }

    if (candidate.accessed_at !== ACCESSED_AT) {
      throw new Error(`Unexpected accessed_at for ${candidate.event_id}: ${candidate.accessed_at}`);
    }
    if (!confidenceValues.has(candidate.confidence)) {
      throw new Error(`Invalid confidence for ${candidate.event_id}: ${candidate.confidence}`);
    }
    if (!["pkdm-hqz6", "bs8b-p36w"].includes(candidate.source_dataset_id)) {
      throw new Error(`Unexpected source dataset ${candidate.source_dataset_id} for ${candidate.event_id}`);
    }
    const date = parseDate(candidate.date);
    if (!date || date < START_DATE || date > END_DATE || candidate.effective_date !== date) {
      throw new Error(`Out-of-window or mismatched date for ${candidate.event_id}: ${candidate.date}`);
    }
    const latitude = Number(candidate.latitude);
    const longitude = Number(candidate.longitude);
    if (!isNycPoint(latitude, longitude)) {
      throw new Error(`Outside NYC coordinate bounds for ${candidate.event_id}`);
    }
    if (candidate.geometry?.type !== "Point" ||
      candidate.geometry.coordinates?.[0] !== longitude ||
      candidate.geometry.coordinates?.[1] !== latitude) {
      throw new Error(`Invalid GeoJSON point for ${candidate.event_id}`);
    }
    const textForCaveats = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method
    ].join(" ");
    if (banned.test(textForCaveats)) {
      throw new Error(`Overclaim wording detected for ${candidate.event_id}`);
    }
    const caveatText = normalizeKey(candidate.limitations);
    for (const phrase of ["not actual occupancy", "public opening", "project completion", "causal effect"]) {
      if (!caveatText.includes(phrase)) {
        throw new Error(`Missing CO caveat phrase '${phrase}' for ${candidate.event_id}`);
      }
    }

    const eventKey = normalizeKey(candidate.event_id);
    if (eventIds.has(eventKey)) throw new Error(`Duplicate event_id in pack: ${candidate.event_id}`);
    eventIds.add(eventKey);
    if (existing.eventIds.has(eventKey) || existing.candidateIds.has(eventKey)) {
      throw new Error(`Existing event/candidate id overlap for ${candidate.event_id}`);
    }

    const sourceDate = sourceDateKey(candidate);
    if (!sourceDate) throw new Error(`Missing source/date key for ${candidate.event_id}`);
    if (sourceDateKeys.has(sourceDate)) throw new Error(`Duplicate source/date key in pack: ${sourceDate}`);
    sourceDateKeys.add(sourceDate);
    if (existing.sourceDateKeys.has(sourceDate) || existing.sourceDateWildcardKeys.has(sourceDateWildcardKey(candidate))) {
      throw new Error(`Existing source/date overlap for ${candidate.event_id}: ${sourceDate}`);
    }

    const urlDate = sourceUrlDateKey(candidate);
    if (urlDate) {
      if (sourceUrlDateKeys.has(urlDate)) throw new Error(`Duplicate source URL/date key in pack: ${urlDate}`);
      sourceUrlDateKeys.add(urlDate);
      if (existing.sourceUrlDateKeys.has(urlDate)) {
        throw new Error(`Existing source URL/date overlap for ${candidate.event_id}: ${urlDate}`);
      }
    }

    const candidateTokens = new Set();
    addRecordIdentifiers(candidateTokens, candidate);
    for (const token of candidateTokens) {
      if (existing.identifierTokens.has(token)) {
        throw new Error(`Existing identifier token overlap for ${candidate.event_id}: ${token}`);
      }
    }
  }

  return {
    ok: true,
    checked_at: GENERATED_AT,
    validator: "scripts/fetch_round247_nyc_dob_co_next16_candidates.js independent post-generation validator",
    checks: {
      required_provenance_fields: requiredFields,
      candidate_count: candidates.length,
      unique_event_ids: eventIds.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_url_date_keys: sourceUrlDateKeys.size,
      date_window: { start: START_DATE, end: END_DATE },
      date_window_valid: true,
      nyc_coordinate_bounds_valid: true,
      screened_required_files_present: REQUIRED_SCREENED_FILES,
      screened_files_read: existing.filesRead.length,
      prior_source_date_keys_checked: existing.sourceDateKeys.size,
      prior_identifier_tokens_checked: existing.identifierTokens.size,
      no_overlap_with_screened_corpus_and_prior_packs: true
    }
  };
}

function postProcessOutputs() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const notesPath = path.join(OUT_DIR, "notes.md");

  const candidatesDoc = readJson(candidatesPath);
  const sourceAudit = readJson(sourceAuditPath);
  const summary = readJson(summaryPath);
  const candidates = candidatesDoc.candidates || [];

  const byStatus = countBy(candidates, statusFor);
  const bySourceStatus = countBy(candidates, (candidate) => `${candidate.source_dataset_id}|${statusFor(candidate)}`);
  const validation = validateIndependent(candidates, summary);
  validation.checks.by_status = byStatus;
  validation.checks.by_source_status = bySourceStatus;

  candidatesDoc.selection_summary.selected_summary.by_status = byStatus;
  candidatesDoc.selection_summary.selected_summary.by_source_status = bySourceStatus;
  candidatesDoc.selection_summary.independent_validation = validation;

  summary.selected_summary.by_status = byStatus;
  summary.selected_summary.by_source_status = bySourceStatus;
  summary.selection_summary.selected_summary.by_status = byStatus;
  summary.selection_summary.selected_summary.by_source_status = bySourceStatus;
  summary.selection_summary.independent_validation = validation;
  summary.independent_validation = validation;

  sourceAudit.selection_summary.selected_summary.by_status = byStatus;
  sourceAudit.selection_summary.selected_summary.by_source_status = bySourceStatus;
  sourceAudit.selection_summary.independent_validation = validation;

  writeJson(candidatesPath, candidatesDoc);
  writeJson(summaryPath, summary);
  writeJson(sourceAuditPath, sourceAudit);

  fs.appendFileSync(notesPath, [
    "",
    "## Independent Validation",
    "",
    `- Required provenance fields present: ${validation.ok}.`,
    `- Unique event IDs: ${validation.checks.unique_event_ids}.`,
    `- Unique source/date keys: ${validation.checks.unique_source_date_keys}.`,
    `- Date window valid: ${validation.checks.date_window_valid} (${START_DATE} through ${END_DATE}).`,
    `- NYC coordinate bounds valid: ${validation.checks.nyc_coordinate_bounds_valid}.`,
    "- No exact event/source/date/source-URL/identifier overlap with the screened corpus and prior CO packs, including rounds 225, 232, and 242.",
    `- Status mix: ${Object.entries(bySourceStatus).map(([key, count]) => `${key}=${count}`).join(", ")}.`
  ].join("\n") + "\n");

  return {
    candidate_count: candidates.length,
    date_range: summary.selected_summary.date_range,
    source_mix: summary.selected_summary.by_source_dataset_id,
    status_mix: bySourceStatus,
    eligible_headroom_after_retained_candidates: summary.selection_summary.eligible_headroom_after_retained_candidates,
    validation
  };
}

async function main() {
  await runTemplateMain();
  const result = postProcessOutputs();
  console.log(JSON.stringify({
    round: "round247_nyc_dob_co_next16",
    candidate_count: result.candidate_count,
    date_range: result.date_range,
    source_mix: result.source_mix,
    status_mix: result.status_mix,
    eligible_headroom_after_retained_candidates: result.eligible_headroom_after_retained_candidates,
    independent_validation_ok: result.validation.ok
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
