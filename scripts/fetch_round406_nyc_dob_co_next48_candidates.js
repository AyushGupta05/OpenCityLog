const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round406_nyc_dob_co_next48_candidates.generated.js";
const ROUND = "round406";
const ROUND_TITLE = "Round406";
const NEXT_LABEL = "next48";
const NEXT_TITLE = "Next48";
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const OUT_DIR = path.join("tmp", "subagents", "round406_nyc_dob_co_next48");

const ADDITIONAL_DOB_CO_FILES = [
  "tmp/subagents/round308_nyc_dob_co_next26/candidates.json",
  "tmp/subagents/round313_nyc_dob_co_next27/candidates.json",
  "tmp/subagents/round318_nyc_dob_co_next28/candidates.json",
  "tmp/subagents/round322_nyc_dob_co_next29/candidates.json",
  "tmp/subagents/round326_nyc_dob_co_next30/candidates.json",
  "tmp/subagents/round330_nyc_dob_co_next31/candidates.json",
  "tmp/subagents/round335_nyc_dob_co_next32/candidates.json",
  "tmp/subagents/round339_nyc_dob_co_next33/candidates.json",
  "tmp/subagents/round344_nyc_dob_co_next34/candidates.json",
  "tmp/subagents/round349_nyc_dob_co_next35/candidates.json",
  "tmp/subagents/round356_nyc_dob_co_next36/candidates.json",
  "tmp/subagents/round360_nyc_dob_co_next37/candidates.json",
  "tmp/subagents/round364_nyc_dob_co_next38/candidates.json",
  "tmp/subagents/round367_nyc_dob_co_next39/candidates.json",
  "tmp/subagents/round371_nyc_dob_co_next40/candidates.json",
  "tmp/subagents/round375_nyc_dob_co_next41/candidates.json",
  "tmp/subagents/round379_nyc_dob_co_next42/candidates.json",
  "tmp/subagents/round382_nyc_dob_co_next43/candidates.json",
  "tmp/subagents/round386_nyc_dob_co_next44/candidates.json",
  "tmp/subagents/round389_nyc_dob_co_next45/candidates.json",
  "tmp/subagents/round395_nyc_dob_co_next46/candidates.json",
  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json"
];

const ADDITIONAL_SCREENED_ROUNDS = [
  "308",
  "313",
  "318",
  "322",
  "326",
  "330",
  "335",
  "339",
  "344",
  "349",
  "356",
  "360",
  "364",
  "367",
  "371",
  "375",
  "379",
  "382",
  "386",
  "389",
  "395",
  "400"
];

const OUTPUT_FILENAMES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "notes.md",
  "readback.json"
];

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceFirst(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count < 1) {
    throw new Error(`${label} expected at least one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed template is missing ${label}`);
  }
}

function roundFromCandidateFile(file) {
  const match = file.match(/round(\d+)_/);
  if (!match) throw new Error(`Could not parse round from ${file}`);
  return match[1];
}

function addTitleDateScreening(source) {
  let transformed = source;

  transformed = replaceOnce(
    transformed,
    "    sourceUrlDateKeys: new Set(),\n    eventIds: new Set(),",
    "    sourceUrlDateKeys: new Set(),\n    titleDateKeys: new Set(),\n    eventIds: new Set(),",
    "duplicate index title/date key set"
  );
  transformed = replaceOnce(
    transformed,
    "      sourceUrlDateKeys: new Set(),\n      eventIds: new Set(),",
    "      sourceUrlDateKeys: new Set(),\n      titleDateKeys: new Set(),\n      eventIds: new Set(),",
    "candidate token title/date key set"
  );
  transformed = replaceOnce(
    transformed,
    "  const sourceUrl = cleanText(value.source_url);\n  if (sourceUrl && date) index.sourceUrlDateKeys.add(`${sourceUrl}|${date}`.toLowerCase());\n\n  for (const key of [\"source_row_ref\", \"source_fields\", \"raw_row\", \"row_fields\", \"group_key\"]) {",
    "  const sourceUrl = cleanText(value.source_url);\n  if (sourceUrl && date) index.sourceUrlDateKeys.add(`${sourceUrl}|${date}`.toLowerCase());\n  const title = normalizeKey(value.title || \"\");\n  if (title && date && index.titleDateKeys) index.titleDateKeys.add(`${title}|${date}`);\n\n  for (const key of [\"source_row_ref\", \"source_fields\", \"raw_row\", \"row_fields\", \"group_key\"]) {",
    "collect existing title/date keys"
  );
  transformed = replaceOnce(
    transformed,
    "  const addressDateKey = `${normalizeAddress(`${address} ${row.borough}`)}|${date}`;\n  const values = [",
    "  const addressDateKey = `${normalizeAddress(`${address} ${row.borough}`)}|${date}`;\n  const issueType = cleanText(row.issue_type);\n  const titleDateKey = `${normalizeKey(`DOB ${issueType.toLowerCase()} certificate of occupancy issued for ${address}`)}|${date}`;\n  const values = [",
    "legacy duplicate title/date key"
  );
  transformed = replaceOnce(
    transformed,
    "  if (existing.addressDateKeys.has(addressDateKey)) return \"existing_same_address_and_date\";\n  return \"\";",
    "  if (existing.addressDateKeys.has(addressDateKey)) return \"existing_same_address_and_date\";\n  if (existing.titleDateKeys && existing.titleDateKeys.has(titleDateKey)) return \"existing_same_title_and_date\";\n  return \"\";",
    "legacy duplicate title/date rejection"
  );
  transformed = replaceOnce(
    transformed,
    "  const addressDateKeys = new Set();\n\n  if (summary.candidate_count !== TARGET_COUNT || candidates.length !== TARGET_COUNT) {",
    "  const addressDateKeys = new Set();\n  const titleDateKeys = new Set();\n\n  if (summary.candidate_count !== TARGET_COUNT || candidates.length !== TARGET_COUNT) {",
    "validation title/date key set"
  );
  transformed = replaceOnce(
    transformed,
    "    if (duplicateIndex.addressDateKeys.has(addressDateKey)) errors.push(`Existing address/date overlap for ${label}: ${addressDateKey}`);\n\n    const sourceDate = sourceDateKey(candidate);",
    "    if (duplicateIndex.addressDateKeys.has(addressDateKey)) errors.push(`Existing address/date overlap for ${label}: ${addressDateKey}`);\n\n    const titleDateKey = `${normalizeKey(candidate.title || \"\")}|${date}`;\n    if (titleDateKeys.has(titleDateKey)) errors.push(`Duplicate title/date key in pack: ${titleDateKey}`);\n    titleDateKeys.add(titleDateKey);\n    if (duplicateIndex.titleDateKeys && duplicateIndex.titleDateKeys.has(titleDateKey)) errors.push(`Existing title/date overlap for ${label}: ${titleDateKey}`);\n\n    const sourceDate = sourceDateKey(candidate);",
    "validation title/date overlap check"
  );
  transformed = replaceOnce(
    transformed,
    "      unique_address_date_keys: addressDateKeys.size,\n      nyc_coordinate_bounds_valid:",
    "      unique_address_date_keys: addressDateKeys.size,\n      unique_title_date_keys: titleDateKeys.size,\n      nyc_coordinate_bounds_valid:",
    "validation unique title/date count"
  );
  transformed = replaceOnce(
    transformed,
    "      prior_source_date_keys_checked: duplicateIndex.sourceDateKeys.size,\n      prior_identifier_tokens_checked: duplicateIndex.tokens.size,",
    "      prior_source_date_keys_checked: duplicateIndex.sourceDateKeys.size,\n      prior_title_date_keys_checked: duplicateIndex.titleDateKeys ? duplicateIndex.titleDateKeys.size : 0,\n      prior_identifier_tokens_checked: duplicateIndex.tokens.size,",
    "validation prior title/date count"
  );
  transformed = replaceOnce(
    transformed,
    "      source_date_keys: duplicateIndex.sourceDateKeys.size,\n      screened_files:",
    "      source_date_keys: duplicateIndex.sourceDateKeys.size,\n      title_date_keys: duplicateIndex.titleDateKeys ? duplicateIndex.titleDateKeys.size : 0,\n      screened_files:",
    "selection summary title/date count"
  );
  transformed = replaceOnce(
    transformed,
    "source URLs, source_record_id text, candidate/event IDs, and same-address/same-date keys",
    "source URLs, source_record_id text, candidate/event IDs, same-title/same-date keys, and same-address/same-date keys",
    "duplicate note title/date wording"
  );
  transformed = replaceOnce(
    transformed,
    "`Screened ${duplicateIndex.files.length} files, ${duplicateIndex.tokens.size} identifier tokens, and ${duplicateIndex.sourceDateKeys.size} source-date keys, including the live manual corpus and prior DOB/CO candidate packs through round400.`",
    "`Screened ${duplicateIndex.files.length} files, ${duplicateIndex.tokens.size} identifier tokens, ${duplicateIndex.sourceDateKeys.size} source-date keys, and ${duplicateIndex.titleDateKeys ? duplicateIndex.titleDateKeys.size : 0} title/date keys, including the live manual corpus and prior DOB/CO candidate packs through round400.`",
    "notes title/date screening count"
  );

  return transformed;
}

function transformRound308Source(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round308", ROUND)
    .replaceAll("Round308", ROUND_TITLE)
    .replaceAll("next26", NEXT_LABEL)
    .replaceAll("Next26", NEXT_TITLE)
    .replaceAll("through round303", "through round400")
    .replaceAll("validation_report.md", "validation_report.json");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const priorRoundFiles = [
    round303File,
    ...ADDITIONAL_DOB_CO_FILES.map((file) => `"${file}"`)
  ].join(",\n  ");

  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "explicit duplicate files through Round400"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "required screened files through Round400"
  );

  const screenedRoundsReplacement = [
    '  "300"',
    '  "303"',
    ...ADDITIONAL_SCREENED_ROUNDS.map((round) => `  "${round}"`)
  ].join(",\n");
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    `${screenedRoundsReplacement}\n];`,
    "screened rounds include Round308 through Round400"
  );

  const additionalValidationChecks = ADDITIONAL_DOB_CO_FILES
    .map((file) => {
      const round = roundFromCandidateFile(file);
      return `      required_round${round}_screened: duplicateIndex.files.includes("${file}"),`;
    })
    .join("\n");
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    `      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n${additionalValidationChecks}`,
    "validation check fields through Round400"
  );

  transformed = replaceOnce(
    transformed,
    "  const sourceAuditEntry = {\n    ...metadata,\n    reliability:",
    `  const sourceAuditEntry = {\n    ...metadata,\n    accessed_at: ACCESSED_AT,\n    confidence: "documented",\n    method: "${ROUND_TITLE} queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates through Round400, and retained row-level provenance.",\n    transformation_method: "${ROUND_TITLE} queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates through Round400, and retained row-level provenance.",\n    limitations: "Legacy CO issuance is an administrative/legal DOB record. It is not a complete account of construction, occupancy, safety, or outcomes. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome. Coordinates are DOB/Open Data geocoded address points.",\n    reliability:`,
    "source audit provenance fields"
  );

  transformed = replaceOnce(
    transformed,
    '    "This certificate-of-occupancy row is a legal and administrative DOB record.",',
    '    "This certificate-of-occupancy row is a legal and administrative DOB record, not a complete account of construction, occupancy, safety, or outcomes.",',
    "candidate limitations include complete-account caveat"
  );

  transformed = replaceOnce(
    transformed,
    "- A CO row is a legal/admin DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
    "- A CO row is a legal/admin DOB record, not a complete account of construction, occupancy, safety, or outcomes. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
    "notes caveat includes complete-account caveat"
  );

  transformed = replaceOnce(
    transformed,
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Counts",',
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Endpoint and Query",\n    "",\n    `- Endpoint: ${LEGACY_CO.api}`,\n    `- Metadata endpoint: ${LEGACY_CO.metadata}`,\n    `- Socrata query: $select=${LEGACY_SELECT.join(",")},:id; $where=c_o_issue_date between \'${START_DATE}T00:00:00\' and \'${END_DATE}T23:59:59\' AND latitude IS NOT NULL AND longitude IS NOT NULL AND application_status_raw=\'Issued\' AND issue_type in(\'Final\',\'Temporary\') AND job_type in(\'NB\',\'A1\'); $order=c_o_issue_date,job_number.`,\n    "",\n    "## Counts",',
    "notes endpoint and query section"
  );

  transformed = replaceOnce(
    transformed,
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,',
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,\n    `- Skipped as prior DOB/CO identifier duplicates: ${rejectionCounts.existing_legacy_co_or_job_identifier || 0}`,\n    `- Skipped as prior title/date duplicates: ${rejectionCounts.existing_same_title_and_date || 0}`,\n    `- Skipped as prior address/date duplicates: ${rejectionCounts.existing_same_address_and_date || 0}`,\n    `- Skipped because outside legacy-preferred CO period: ${rejectionCounts.legacy_post_dob_now_coverage_period || 0}`,\n    `- Skipped below high-signal selection threshold: ${rejectionCounts.legacy_below_high_signal_threshold || 0}`,',
    "notes skipped duplicate counts"
  );

  const additionalReportLines = ADDITIONAL_SCREENED_ROUNDS
    .map((round) => `    \`- Round${round} screened: \${validation.checks.required_round${round}_screened}\`,`)
    .join("\n");
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    `    \`- Round303 screened: \${validation.checks.required_round303_screened}\`,\n${additionalReportLines}`,
    "validation report lines through Round400"
  );

  transformed = addTitleDateScreening(transformed);

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round406_nyc_dob_co_next48", "Round406 output path");
  assertContains(transformed, "Round406 NYC DOB CO Next48 Candidate Pack", "Round406 notes title");
  assertContains(transformed, "nyc_dob_co_round406_legacy_", "Round406 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round400_nyc_dob_co_next47/candidates.json", "Round400 screened file");
  assertContains(transformed, "through round400", "duplicate-screening text through Round400");
  assertContains(transformed, "required_round400_screened", "Round400 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "titleDateKeys", "title/date duplicate screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "accessed_at: ACCESSED_AT", "source audit accessed_at");
  assertContains(transformed, 'confidence: "documented"', "source audit confidence");
  assertContains(transformed, `transformation_method: "${ROUND_TITLE} queried`, "Round406 source audit transformation method");
  assertContains(transformed, "scripts/fetch_round406_nyc_dob_co_next48_candidates.js standalone validation artifact", "Round406 validator label");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
}

function outputPath(name) {
  return path.join(OUT_DIR, name).replace(/\\/g, "/");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function asCandidates(doc) {
  if (Array.isArray(doc)) return doc;
  return doc.candidates || doc.events || doc.records || [];
}

function countBy(rows, fn) {
  const counts = {};
  for (const row of rows) {
    const key = String(fn(row) || "unknown");
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function dateRange(candidates) {
  const dates = candidates.map((candidate) => candidate.date || candidate.effective_date).filter(Boolean).sort();
  return dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null;
}

function validationReportJson(candidates, summary, sourceAudit, validation) {
  return {
    schema_version: "round406.nyc_dob_co_next48_validation_report.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    report_type: "json_readable_validation_summary",
    validation_ok: validation.ok,
    candidate_count: candidates.length,
    date_range: dateRange(candidates),
    source_ids: summary.source_ids || [],
    source_mix: countBy(candidates, (candidate) => candidate.source_dataset_id),
    borough_mix: countBy(candidates, (candidate) => candidate.borough),
    source_date_field_mix: countBy(candidates, (candidate) => `${candidate.source_dataset_id}|${candidate.source_date_field}`),
    screened_files_read: validation.checks.screened_files_read,
    prior_identifier_tokens_checked: validation.checks.prior_identifier_tokens_checked,
    prior_source_date_keys_checked: validation.checks.prior_source_date_keys_checked,
    prior_title_date_keys_checked: validation.checks.prior_title_date_keys_checked,
    manual_corpus_screened: validation.checks.manual_corpus_screened,
    required_round400_screened: validation.checks.required_round400_screened,
    no_overlap_with_screened_corpus_and_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs,
    source_audit_count: sourceAudit.sources.length,
    caveats: [
      "Certificate-of-occupancy rows are DOB legal/admin records only.",
      "No design quality, actual occupancy, construction completion, outcome, impact, causation, or unobserved construction detail is inferred.",
      "Coordinates are DOB/Open Data geocoded address points, not surveyed footprints or parcel polygons."
    ],
    errors: validation.errors
  };
}

function jsonFileCheck(file) {
  const check = {
    path: file.replace(/\\/g, "/"),
    exists: fs.existsSync(file),
    parse_ok: null,
    size_bytes: fs.existsSync(file) ? fs.statSync(file).size : 0
  };
  if (!check.exists) return check;
  if (path.extname(file).toLowerCase() !== ".json") return check;
  try {
    JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    check.parse_ok = true;
  } catch (error) {
    check.parse_ok = false;
    check.error = error.message;
  }
  return check;
}

function buildReadback() {
  const expectedPaths = OUTPUT_FILENAMES.map((name) => path.join(OUT_DIR, name));
  const fileChecks = expectedPaths.map(jsonFileCheck);
  const candidatesDoc = readJson(path.join(OUT_DIR, "candidates.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const rejected = readJson(path.join(OUT_DIR, "rejected.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const report = readJson(path.join(OUT_DIR, "validation_report.json"));
  const candidates = asCandidates(candidatesDoc);
  const candidateDateRange = dateRange(candidates);
  const sourceIds = Array.from(new Set(candidates.flatMap((candidate) => candidate.source_ids || [candidate.source_id]).filter(Boolean))).sort();
  const checks = {
    all_expected_files_present: fileChecks.every((check) => check.exists),
    json_files_parse: fileChecks.every((check) => check.parse_ok !== false),
    candidate_count_matches: candidatesDoc.candidate_count === candidates.length &&
      summary.candidate_count === candidates.length &&
      validation.checks.candidate_count === candidates.length &&
      report.candidate_count === candidates.length,
    target_count_met: candidates.length === 200,
    validation_ok: validation.ok === true,
    no_validation_errors: Array.isArray(validation.errors) && validation.errors.length === 0,
    source_dataset_only_bs8b_p36w: candidates.every((candidate) => candidate.source_dataset_id === "bs8b-p36w"),
    accessed_at_2026_05_20: candidates.every((candidate) => candidate.accessed_at === ACCESSED_AT) &&
      summary.accessed_at === ACCESSED_AT &&
      sourceAudit.accessed_at === ACCESSED_AT,
    required_round400_screened: validation.checks.required_round400_screened === true,
    title_date_screening_recorded: validation.checks.prior_title_date_keys_checked > 0 &&
      candidatesDoc.selection_summary.duplicate_screening.title_date_keys > 0,
    no_overlap_with_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs === true,
    source_audit_present: Array.isArray(sourceAudit.sources) && sourceAudit.sources.length === 1,
    rejected_report_present: rejected && typeof rejected.rejected_counts === "object",
    no_candidate_overclaim_terms: candidates.every((candidate) => {
      const text = [
        candidate.title,
        candidate.summary,
        candidate.observed_change,
        candidate.limitations,
        candidate.transformation_method
      ].join(" ").toLowerCase();
      return !/\b(predict|prediction|forecast|simulate|simulation|causal|causation|impact score)\b/.test(text);
    })
  };

  return {
    schema_version: "round406.nyc_dob_co_next48_readback.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    readback_at: GENERATED_AT,
    ok: Object.values(checks).every(Boolean),
    candidate_count: candidates.length,
    date_range: candidateDateRange,
    source_ids: sourceIds,
    source_record_id_sample: candidates.slice(0, 5).map((candidate) => candidate.source_record_id),
    source_url_sample: candidates.slice(0, 5).map((candidate) => candidate.source_url),
    checks,
    file_checks: fileChecks,
    validation_error_count: validation.errors.length,
    caveats: [
      "Readback confirms this pack contains certificate/admin records only.",
      "The pack does not infer design quality, actual occupancy, construction completion, outcomes, impacts, causation, or unobserved construction details."
    ],
    self_validation_note: "readback.json is written once before this final readback pass, then overwritten with this final result."
  };
}

function postProcessOutputs() {
  const candidatesDoc = readJson(path.join(OUT_DIR, "candidates.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const candidates = asCandidates(candidatesDoc);

  summary.output_files = OUTPUT_FILENAMES.map(outputPath);
  summary.independent_validation = validation;
  writeJson(path.join(OUT_DIR, "summary.json"), summary);

  const report = validationReportJson(candidates, summary, sourceAudit, validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), report);

  writeJson(path.join(OUT_DIR, "readback.json"), {
    schema_version: "round406.nyc_dob_co_next48_readback.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: false,
    note: "Initial readback placeholder before final self-check."
  });
  const readback = buildReadback();
  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  if (!readback.ok) {
    throw new Error(`Round406 readback validation failed: ${JSON.stringify(readback.checks, null, 2)}`);
  }
}

async function main() {
  const source = transformRound308Source(fs.readFileSync(TEMPLATE_PATH, "utf8"));
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
    throw new Error("Transformed Round406 generator did not export main().");
  }
  await sandbox.module.exports.main();
  postProcessOutputs();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
