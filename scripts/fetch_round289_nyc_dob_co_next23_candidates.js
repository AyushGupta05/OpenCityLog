const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round278_nyc_dob_co_next22_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round289_nyc_dob_co_next23_candidates.generated.js";
const OUT_DIR = path.join("tmp", "subagents", "round289_nyc_dob_co_next23");
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";

const OLD_PRIOR_ROUNDS = "117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219|225|232|242|247|250|256|264|267|273";
const NEW_PRIOR_ROUNDS = `${OLD_PRIOR_ROUNDS}|278`;
const OLD_CO_ROUNDS = "160|164|169|175|181|187|193|199|205|211|219|225|232|242|247|250|256|264|267|273";
const NEW_CO_ROUNDS = `${OLD_CO_ROUNDS}|278`;
const OLD_NEXT_ROUNDS = "2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21";
const NEW_NEXT_ROUNDS = `${OLD_NEXT_ROUNDS}|22`;
const REQUIRED_ROUND278_FILE = "tmp/subagents/round278_nyc_dob_co_next22/candidates.json";
const VALIDATION_PATH = path.join(OUT_DIR, "validation.json");
const VALIDATION_REPORT_PATH = path.join(OUT_DIR, "validation_report.md");

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
  const missingFiles = [];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file.replace(/\\/g, "/"));
      continue;
    }
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
    filesRead,
    missingFiles
  };
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed template is missing ${label}`);
  }
}

function transformRound278Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round278", "round289")
    .replaceAll("Round278", "Round289")
    .replaceAll("next22", "next23")
    .replaceAll("Next22", "Next23")
    .replaceAll("through round273", "through round278")
    .replaceAll(
      "225, 232, 242, 247, 250, 256, 264, 267, and 273",
      "225, 232, 242, 247, 250, 256, 264, 267, 273, and 278"
    )
    .replaceAll(
      "219, 225, 232, 242, 247, 250, 256, 264, 267, and 273",
      "219, 225, 232, 242, 247, 250, 256, 264, 267, 273, and 278"
    )
    .replaceAll(
      "\"232\", \"242\", \"247\", \"250\", \"256\", \"264\", \"267\", \"273\"]",
      "\"232\", \"242\", \"247\", \"250\", \"256\", \"264\", \"267\", \"273\", \"278\"]"
    );

  transformed = replaceOnce(
    transformed,
    `const PRIOR_ROUNDS = "${OLD_PRIOR_ROUNDS}";`,
    `const PRIOR_ROUNDS = "${NEW_PRIOR_ROUNDS}";`,
    "prior round list"
  );
  transformed = replaceOnce(
    transformed,
    `const CO_ROUNDS = "${OLD_CO_ROUNDS}";`,
    `const CO_ROUNDS = "${NEW_CO_ROUNDS}";`,
    "CO round list"
  );
  transformed = replaceOnce(
    transformed,
    `const NEXT_ROUNDS = "${OLD_NEXT_ROUNDS}";`,
    `const NEXT_ROUNDS = "${NEW_NEXT_ROUNDS}";`,
    "CO next-round list"
  );
  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json"\n];',
    '  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json"\n];',
    "required screened round278 file"
  );
  transformed = replaceOnce(
    transformed,
    '"tmp/subagents/round273_nyc_dob_co_next21/candidates.json"\\\\n];\';',
    '"tmp/subagents/round273_nyc_dob_co_next21/candidates.json",\\\\n  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json"\\\\n];\';',
    "duplicate block round278 file"
  );
  transformed = replaceOnce(
    transformed,
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");',
    '  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");\n  assertContains(transformed, "tmp/subagents/round278_nyc_dob_co_next22/candidates.json", "round278 screening file");',
    "round278 screening assertion"
  );

  assertContains(transformed, "round289_nyc_dob_co_next23", "round289 output path");
  assertContains(transformed, REQUIRED_ROUND278_FILE, "round278 screened file");
  assertContains(transformed, `const PRIOR_ROUNDS = "${NEW_PRIOR_ROUNDS}";`, "prior round constants including round278");
  assertContains(transformed, `const CO_ROUNDS = "${NEW_CO_ROUNDS}";`, "CO round constants including round278");
  assertContains(transformed, `const NEXT_ROUNDS = "${NEW_NEXT_ROUNDS}";`, "CO next-round constants including next22");
  assertContains(transformed, "including rounds 225, 232, 242, 247, 250, 256, 264, 267, 273, and 278", "notes validation caveat");
  assertContains(transformed, "scripts/fetch_round289_nyc_dob_co_next23_candidates.js independent post-generation validator", "round289 validator label");

  return transformed;
}

async function runTransformedRound278Main() {
  const source = transformRound278Wrapper(fs.readFileSync(TEMPLATE_PATH, "utf8"));
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

  vm.runInNewContext(source, sandbox, { filename: GENERATED_FILENAME });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed round289 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

function validateOutputs() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const notesPath = path.join(OUT_DIR, "notes.md");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");
  const requiredOutputFiles = [candidatesPath, sourceAuditPath, summaryPath, notesPath, rejectedPath];

  for (const file of requiredOutputFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing generated output: ${file}`);
    }
  }

  const candidatesDoc = readJson(candidatesPath);
  const sourceAudit = readJson(sourceAuditPath);
  const summary = readJson(summaryPath);
  const rejected = readJson(rejectedPath);
  const candidates = candidatesDoc.candidates || [];
  const screenedFiles = (summary.selection_summary?.duplicate_screening?.screened_files || []).map((file) => file.replace(/\\/g, "/"));
  const embeddedValidation = summary.independent_validation || summary.selection_summary?.independent_validation;

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
  const expectedDatasets = new Set(["pkdm-hqz6", "bs8b-p36w"]);
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const eventIds = new Set();
  const candidateIds = new Set();
  const sourceDateKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const errors = [];

  if (summary.candidate_count !== 200 || candidates.length !== 200) {
    errors.push(`Expected 200 candidates, found summary=${summary.candidate_count} candidates=${candidates.length}`);
  }
  if (!embeddedValidation?.ok) {
    errors.push("Embedded independent validation was missing or not ok.");
  }
  if (!screenedFiles.includes("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")) {
    errors.push("Manual architecture corpus was not listed in duplicate screening.");
  }
  if (!screenedFiles.includes(REQUIRED_ROUND278_FILE)) {
    errors.push("Round278 DOB CO candidate pack was not listed in duplicate screening.");
  }

  const existing = buildExistingIndex(screenedFiles);
  if (existing.missingFiles.length) {
    errors.push(`Duplicate screening listed missing files: ${existing.missingFiles.join(", ")}`);
  }

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.event_id || "(unknown candidate)";
    for (const field of requiredFields) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Missing ${field} for ${label}`);
      }
    }

    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`Unexpected accessed_at for ${label}: ${candidate.accessed_at}`);
    if (!confidenceValues.has(candidate.confidence)) errors.push(`Invalid confidence for ${label}: ${candidate.confidence}`);
    if (!expectedDatasets.has(candidate.source_dataset_id)) errors.push(`Unexpected dataset for ${label}: ${candidate.source_dataset_id}`);

    const date = parseDate(candidate.date);
    if (!date || date < START_DATE || date > END_DATE || candidate.effective_date !== date) {
      errors.push(`Out-of-window or mismatched date for ${label}: ${candidate.date}`);
    }

    const latitude = Number(candidate.latitude);
    const longitude = Number(candidate.longitude);
    if (!isNycPoint(latitude, longitude)) errors.push(`Outside NYC coordinate bounds for ${label}`);
    if (candidate.geometry?.type !== "Point" ||
      candidate.geometry.coordinates?.[0] !== longitude ||
      candidate.geometry.coordinates?.[1] !== latitude) {
      errors.push(`Invalid GeoJSON point for ${label}`);
    }

    const textForCaveats = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method
    ].join(" ");
    if (banned.test(textForCaveats)) errors.push(`Overclaim wording detected for ${label}`);

    const caveatText = normalizeKey(candidate.limitations);
    for (const phrase of ["not actual occupancy", "public opening", "project completion", "causal effect"]) {
      if (!caveatText.includes(phrase)) errors.push(`Missing CO caveat phrase '${phrase}' for ${label}`);
    }

    const eventKey = normalizeKey(candidate.event_id);
    const candidateKey = normalizeKey(candidate.candidate_id);
    if (eventIds.has(eventKey)) errors.push(`Duplicate event_id in pack: ${candidate.event_id}`);
    if (candidateIds.has(candidateKey)) errors.push(`Duplicate candidate_id in pack: ${candidate.candidate_id}`);
    eventIds.add(eventKey);
    candidateIds.add(candidateKey);
    if (existing.eventIds.has(eventKey) || existing.candidateIds.has(eventKey)) {
      errors.push(`Existing event/candidate id overlap for ${label}`);
    }

    const sourceDate = sourceDateKey(candidate);
    const wildcard = sourceDateWildcardKey(candidate);
    if (!sourceDate) errors.push(`Missing source/date key for ${label}`);
    if (sourceDateKeys.has(sourceDate)) errors.push(`Duplicate source/date key in pack: ${sourceDate}`);
    sourceDateKeys.add(sourceDate);
    if (existing.sourceDateKeys.has(sourceDate) || existing.sourceDateWildcardKeys.has(wildcard)) {
      errors.push(`Existing source/date overlap for ${label}: ${sourceDate}`);
    }

    const urlDate = sourceUrlDateKey(candidate);
    if (urlDate) {
      if (sourceUrlDateKeys.has(urlDate)) errors.push(`Duplicate source URL/date key in pack: ${urlDate}`);
      sourceUrlDateKeys.add(urlDate);
      if (existing.sourceUrlDateKeys.has(urlDate)) errors.push(`Existing source URL/date overlap for ${label}: ${urlDate}`);
    }

    const candidateTokens = new Set();
    addRecordIdentifiers(candidateTokens, candidate);
    for (const token of candidateTokens) {
      if (existing.identifierTokens.has(token)) {
        errors.push(`Existing identifier token overlap for ${label}: ${token}`);
        break;
      }
    }
  }

  const sourceMix = countBy(candidates, (candidate) => candidate.source_dataset_id);
  const boroughMix = countBy(candidates, (candidate) => candidate.borough);
  const sourceDateFieldMix = countBy(candidates, (candidate) => `${candidate.source_dataset_id}|${candidate.source_date_field}`);
  const dateValues = candidates.map((candidate) => parseDate(candidate.date)).filter(Boolean).sort();
  const validation = {
    schema_version: "round289.nyc_dob_co_next23_validation.v1",
    ok: errors.length === 0,
    checked_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: "scripts/fetch_round289_nyc_dob_co_next23_candidates.js standalone validation artifact",
    errors,
    checks: {
      candidate_count: candidates.length,
      summary_candidate_count: summary.candidate_count,
      required_provenance_fields: requiredFields,
      date_window: { start: START_DATE, end: END_DATE },
      date_range: {
        start: dateValues[0] || null,
        end: dateValues[dateValues.length - 1] || null
      },
      unique_event_ids: eventIds.size,
      unique_candidate_ids: candidateIds.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_url_date_keys: sourceUrlDateKeys.size,
      nyc_coordinate_bounds_valid: errors.every((error) => !error.includes("coordinate bounds")),
      screened_files_count: screenedFiles.length,
      screened_files_read: existing.filesRead.length,
      screened_files_missing: existing.missingFiles,
      required_round278_screened: screenedFiles.includes(REQUIRED_ROUND278_FILE),
      embedded_independent_validation_ok: Boolean(embeddedValidation?.ok),
      prior_source_date_keys_checked: existing.sourceDateKeys.size,
      prior_identifier_tokens_checked: existing.identifierTokens.size,
      no_overlap_with_screened_corpus_and_prior_packs: errors.every((error) => !error.includes("overlap")),
      by_source_dataset_id: sourceMix,
      by_borough: boroughMix,
      by_source_date_field: sourceDateFieldMix,
      rejected_count: Array.isArray(rejected.rejected) ? rejected.rejected.length : candidateArray(rejected).length,
      source_audit_count: Array.isArray(sourceAudit.sources) ? sourceAudit.sources.length : 0
    }
  };

  if (!validation.ok) {
    const preview = validation.errors.slice(0, 20).join("\n");
    throw new Error(`Round289 validation failed with ${validation.errors.length} error(s):\n${preview}`);
  }

  return validation;
}

function writeValidationArtifacts(validation) {
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const summary = readJson(summaryPath);
  const extraOutputFiles = [
    "tmp/subagents/round289_nyc_dob_co_next23/validation.json",
    "tmp/subagents/round289_nyc_dob_co_next23/validation_report.md"
  ];
  if (Array.isArray(summary.output_files)) {
    summary.output_files = Array.from(new Set([...summary.output_files, ...extraOutputFiles]));
    writeJson(summaryPath, summary);
  }

  writeJson(VALIDATION_PATH, validation);
  const lines = [
    "# Round289 NYC DOB CO Next23 Validation",
    "",
    `- Validation ok: ${validation.ok}`,
    `- Checked at: ${validation.checked_at}`,
    `- Candidate count: ${validation.checks.candidate_count}`,
    `- Date range: ${validation.checks.date_range.start} through ${validation.checks.date_range.end}`,
    `- Source mix: ${Object.entries(validation.checks.by_source_dataset_id).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Borough mix: ${Object.entries(validation.checks.by_borough).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Source date field mix: ${Object.entries(validation.checks.by_source_date_field).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Screened files read: ${validation.checks.screened_files_read}`,
    `- Prior source/date keys checked: ${validation.checks.prior_source_date_keys_checked}`,
    `- Prior identifier tokens checked: ${validation.checks.prior_identifier_tokens_checked}`,
    `- Round278 screened: ${validation.checks.required_round278_screened}`,
    `- No overlap with screened corpus and prior packs: ${validation.checks.no_overlap_with_screened_corpus_and_prior_packs}`,
    "",
    "The validation checks required provenance fields, the 2008-01-01 through 2026-05-20 date window, NYC point bounds, CO caveat wording, source/date uniqueness, source URL/date uniqueness, and event/source identifier overlap against the screened manual corpus and prior NYC DOB/CO packs."
  ];
  fs.writeFileSync(VALIDATION_REPORT_PATH, `${lines.join("\n")}\n`);
}

async function main() {
  if (process.argv.includes("--validate-only")) {
    const validation = validateOutputs();
    writeValidationArtifacts(validation);
    console.log(JSON.stringify({
      round: "round289_nyc_dob_co_next23",
      validation_only: true,
      candidate_count: validation.checks.candidate_count,
      date_range: validation.checks.date_range,
      source_mix: validation.checks.by_source_dataset_id,
      borough_mix: validation.checks.by_borough,
      source_date_field_mix: validation.checks.by_source_date_field,
      validation_ok: validation.ok
    }, null, 2));
    return;
  }

  await runTransformedRound278Main();
  const validation = validateOutputs();
  writeValidationArtifacts(validation);
  console.log(JSON.stringify({
    round: "round289_nyc_dob_co_next23",
    candidate_count: validation.checks.candidate_count,
    date_range: validation.checks.date_range,
    source_mix: validation.checks.by_source_dataset_id,
    borough_mix: validation.checks.by_borough,
    source_date_field_mix: validation.checks.by_source_date_field,
    screened_files_read: validation.checks.screened_files_read,
    validation_ok: validation.ok
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
