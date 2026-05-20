const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round470_nyc_dob_co_next56_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round475_nyc_dob_co_next57_candidates.generated.js";
const OUT_DIR = path.join("tmp", "subagents", "round475_nyc_dob_co_next57");
const ACCESSED_AT = "2026-05-20";
const TARGET_MAX_COUNT = 200;

const DOB_CO_FILES_THROUGH_ROUND470 = [
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
  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json",
  "tmp/subagents/round406_nyc_dob_co_next48/candidates.json",
  "tmp/subagents/round412_nyc_dob_co_next49/candidates.json",
  "tmp/subagents/round415_nyc_dob_co_next50/candidates.json",
  "tmp/subagents/round417_nyc_dob_co_next51/candidates.json",
  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json",
  "tmp/subagents/round456_nyc_dob_co_next53/candidates.json",
  "tmp/subagents/round463_nyc_dob_co_next54/candidates.json",
  "tmp/subagents/round468_nyc_dob_co_next55/candidates.json",
  "tmp/subagents/round470_nyc_dob_co_next56/candidates.json"
];

const SCREENED_ROUNDS_THROUGH_ROUND470 = [
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
  "400",
  "406",
  "412",
  "415",
  "417",
  "453",
  "456",
  "463",
  "468",
  "470"
];

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceConstArray(source, name, values) {
  const pattern = new RegExp(`const ${name} = \\[\\n[\\s\\S]*?\\n\\];`);
  if (!pattern.test(source)) throw new Error(`Could not find ${name} array`);
  const replacement = `const ${name} = [\n${values.map((value) => `  "${value}"`).join(",\n")}\n];`;
  return source.replace(pattern, replacement);
}

function exportMain(source) {
  return source.replace(
    /\nmain\(\)\.catch\(\(error\) => \{\n  console\.error\(error\);\n  process\.exit\(1\);\n\}\);\s*$/,
    "\nmodule.exports = { main };\n"
  );
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round475 wrapper is missing ${label}`);
  }
}

function transformRound470Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round470_nyc_dob_co_next56", "round475_nyc_dob_co_next57")
    .replaceAll("fetch_round470_nyc_dob_co_next56_candidates", "fetch_round475_nyc_dob_co_next57_candidates")
    .replaceAll("Round470", "Round475")
    .replaceAll("round470", "round475")
    .replaceAll("next56", "next57")
    .replaceAll("Next56", "Next57")
    .replaceAll("through round468", "through round470")
    .replaceAll("through Round468", "through Round470")
    .replaceAll("required_round468_screened", "required_round470_screened")
    .replaceAll("Round468", "Round470")
    .replaceAll("round468", "round470");

  transformed = replaceConstArray(transformed, "ADDITIONAL_DOB_CO_FILES", DOB_CO_FILES_THROUGH_ROUND470);
  transformed = replaceConstArray(transformed, "ADDITIONAL_SCREENED_ROUNDS", SCREENED_ROUNDS_THROUGH_ROUND470);
  transformed = transformed.replaceAll(
    "tmp/subagents/round470_nyc_dob_co_next55/candidates.json",
    "tmp/subagents/round470_nyc_dob_co_next56/candidates.json"
  );

  transformed = replaceOnce(
    transformed,
    "\"  if (summary.candidate_count !== candidates.length || candidates.length > TARGET_COUNT || candidates.length === 0) {\\n    errors.push(`Expected between 1 and ${TARGET_COUNT} candidates and matching summary count, found summary=${summary.candidate_count} candidates=${candidates.length}`);\\n  }\"",
    "\"  if (summary.candidate_count !== candidates.length || candidates.length > TARGET_COUNT) {\\n    errors.push(`Expected at most ${TARGET_COUNT} candidates and matching summary count, found summary=${summary.candidate_count} candidates=${candidates.length}`);\\n  }\"",
    "zero-candidate exhaustion validation"
  );

  transformed = replaceOnce(
    transformed,
    "Expected between 1 and ${TARGET_COUNT} candidates",
    "Expected at most ${TARGET_COUNT} candidates",
    "zero-candidate validation assertion"
  );

  transformed = replaceOnce(
    transformed,
    "candidate_count_within_target: candidates.length > 0 && candidates.length <= 200,",
    "candidate_count_within_target: candidates.length <= 200,",
    "zero-candidate readback target check"
  );

  transformed = replaceOnce(
    transformed,
    "  validation.checks.candidate_count_within_target = candidateRows(candidatesDoc).length > 0 &&\n    candidateRows(candidatesDoc).length <= TARGET_MAX_COUNT;",
    "  validation.checks.candidate_count_within_target = candidateRows(candidatesDoc).length <= TARGET_MAX_COUNT;",
    "zero-candidate retrieved_at readback target check"
  );

  const dateRangeNeedle = "    `- Date range: ${validation.checks.date_range.start} through ${validation.checks.date_range.end}`,";
  const dateRangeReplacement = "    `- Date range: ${validation.checks.date_range ? `${validation.checks.date_range.start} through ${validation.checks.date_range.end}` : 'none (no nonduplicate candidates retained)'}`,";
  const zeroCandidateDateRangePatch = [
    "  transformed = replaceOnce(",
    "    transformed,",
    `    ${JSON.stringify(dateRangeNeedle)},`,
    `    ${JSON.stringify(dateRangeReplacement)},`,
    "    \"zero-candidate validation report date range\"",
    "  );"
  ].join("\n");

  transformed = replaceOnce(
    transformed,
    "  );\n\n  return transformed;\n}\n\nfunction transformRound406Wrapper(source) {",
    `  );\n\n${zeroCandidateDateRangePatch}\n\n  return transformed;\n}\n\nfunction transformRound406Wrapper(source) {`,
    "zero-candidate validation report patch injection"
  );

  transformed = exportMain(transformed);

  assertContains(transformed, "round475_nyc_dob_co_next57", "Round475 output path");
  assertContains(transformed, "Round475 NYC DOB CO Next57 Candidate Pack", "Round475 notes title");
  assertContains(transformed, "nyc_dob_co_round475_legacy_", "Round475 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round470_nyc_dob_co_next56/candidates.json", "Round470 screened candidates");
  assertContains(transformed, "through round470", "duplicate-screening text through Round470");
  assertContains(transformed, "required_round470_screened", "Round470 validation result");
  assertContains(transformed, "Expected at most ${TARGET_COUNT} candidates", "zero-candidate validation");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candidateRows(doc) {
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

function jsonFileCheck(file) {
  const normalized = file.replace(/\\/g, "/");
  const check = {
    path: normalized,
    exists: fs.existsSync(file),
    parse_ok: null,
    size_bytes: fs.existsSync(file) ? fs.statSync(file).size : 0
  };
  if (!check.exists || path.extname(file).toLowerCase() !== ".json") return check;
  try {
    JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    check.parse_ok = true;
  } catch (error) {
    check.parse_ok = false;
    check.error = error.message;
  }
  return check;
}

function writeRound475AuditArtifacts() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");
  const validationPath = path.join(OUT_DIR, "validation.json");
  const readbackPath = path.join(OUT_DIR, "readback.json");
  const notesPath = path.join(OUT_DIR, "notes.md");
  const duplicateAuditPath = path.join(OUT_DIR, "duplicate_audit.json");

  const candidatesDoc = readJson(candidatesPath);
  const candidates = candidateRows(candidatesDoc);
  const summary = readJson(summaryPath);
  const rejected = readJson(rejectedPath);
  const validation = readJson(validationPath);
  const readback = readJson(readbackPath);
  const selection = summary.selection_summary || candidatesDoc.selection_summary || {};
  const duplicateScreening = selection.duplicate_screening || {};
  const rejectionCounts = rejected.rejected_counts || selection.rejected_counts || {};

  const duplicateAudit = {
    schema_version: "round475.nyc_dob_co_next57_duplicate_audit.v1",
    generated_at: summary.generated_at,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    audit_scope: "Duplicate and exhaustion audit for the Round475 NYC DOB Certificate Of Occupancy next57 candidate pack.",
    dedupe_boundary: "Manual architecture corpus and DOB CO candidate packs through Round470, including tmp/subagents/round470_nyc_dob_co_next56/candidates.json.",
    source_dataset_id: "bs8b-p36w",
    source_name: "NYC Open Data: DOB Certificate Of Occupancy",
    candidate_count: candidates.length,
    candidate_pool_before_selection: selection.candidate_pool_before_selection,
    exhausted_after_round470_boundary: candidates.length === 0 && selection.candidate_pool_before_selection === 0,
    no_weak_rows_forced: candidates.length === 0,
    validation_ok: validation.ok,
    no_overlap_with_screened_corpus_and_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs,
    required_round470_screened: validation.checks.required_round470_screened,
    duplicate_screening: {
      screened_files_read: validation.checks.screened_files_read,
      screened_files_count: duplicateScreening.files_read,
      manual_corpus_screened: validation.checks.manual_corpus_screened,
      prior_identifier_tokens_checked: validation.checks.prior_identifier_tokens_checked,
      prior_source_date_keys_checked: validation.checks.prior_source_date_keys_checked,
      prior_title_date_keys_checked: validation.checks.prior_title_date_keys_checked,
      screened_rounds: SCREENED_ROUNDS_THROUGH_ROUND470,
      screened_files: duplicateScreening.screened_files || []
    },
    source_query_evidence: {
      date_window: summary.date_window,
      legacy_preferred_end_date: summary.legacy_preferred_end_date,
      fetched_counts: selection.fetched_counts,
      rejected_counts: rejectionCounts,
      top_rejection_reasons: Object.entries(rejectionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([reason, count]) => ({ reason, count }))
    },
    selected_source_keys: candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      event_id: candidate.event_id,
      date: candidate.date,
      source_record_id: candidate.source_record_id,
      source_url: candidate.source_url
    })),
    caveats: [
      "Certificate-of-occupancy issuance is a DOB legal/admin milestone only.",
      "Round475 does not infer construction completion, actual occupancy, opening, causation, impact, or design quality.",
      "A zero-candidate result means the source/dedupe/high-signal filters found no additional nonduplicate rows after Round470."
    ]
  };

  writeJson(duplicateAuditPath, duplicateAudit);

  const duplicateAuditOutput = duplicateAuditPath.replace(/\\/g, "/");
  if (!summary.output_files.includes(duplicateAuditOutput)) summary.output_files.push(duplicateAuditOutput);
  summary.duplicate_audit = duplicateAuditOutput;
  summary.exhausted_after_round470_boundary = duplicateAudit.exhausted_after_round470_boundary;
  writeJson(summaryPath, summary);

  const notes = fs.readFileSync(notesPath, "utf8");
  const exhaustionLines = [
    "",
    "## Round475 Exhaustion Evidence",
    "",
    "- Round470 was treated as the latest DOB CO dedupe boundary.",
    `- Candidate pool before final selection after Round470 screening: ${selection.candidate_pool_before_selection}.`,
    `- Legacy rows fetched: ${selection.fetched_counts?.legacy_rows_fetched ?? "unknown"}.`,
    `- Legacy grouped rows: ${selection.fetched_counts?.legacy_grouped_rows ?? "unknown"}.`,
    `- Rejected as prior DOB/CO identifier duplicates: ${rejectionCounts.existing_legacy_co_or_job_identifier || 0}.`,
    "- No weak DOB CO rows were forced into the candidate pack.",
    `- Duplicate audit artifact: ${duplicateAuditOutput}.`
  ].join("\n");
  if (!notes.includes("## Round475 Exhaustion Evidence")) {
    fs.writeFileSync(notesPath, `${notes.trimEnd()}\n${exhaustionLines}\n`);
  }

  readback.checks = readback.checks || {};
  readback.checks.duplicate_audit_present = fs.existsSync(duplicateAuditPath);
  readback.checks.zero_candidate_exhaustion_valid = duplicateAudit.exhausted_after_round470_boundary ||
    (candidates.length > 0 && candidates.length <= TARGET_MAX_COUNT);
  readback.duplicate_audit = duplicateAuditOutput;
  readback.exhausted_after_round470_boundary = duplicateAudit.exhausted_after_round470_boundary;
  readback.source_ids = readback.source_ids && readback.source_ids.length ? readback.source_ids : summary.source_ids || [];
  readback.file_checks = summary.output_files.map(jsonFileCheck);
  readback.checks.all_expected_files_present = readback.file_checks.every((check) => check.exists);
  readback.checks.json_files_parse = readback.file_checks.every((check) => check.parse_ok !== false);
  readback.ok = Object.values(readback.checks).every(Boolean);
  writeJson(readbackPath, readback);
  if (!readback.ok) {
    throw new Error(`Round475 readback failed after duplicate audit: ${JSON.stringify(readback.checks, null, 2)}`);
  }

  return duplicateAudit;
}

async function main() {
  const source = transformRound470Wrapper(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round475 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
  const duplicateAudit = writeRound475AuditArtifacts();

  console.log(JSON.stringify({
    round: "round475_nyc_dob_co_next57",
    candidate_count: duplicateAudit.candidate_count,
    candidate_pool_before_selection: duplicateAudit.candidate_pool_before_selection,
    exhausted_after_round470_boundary: duplicateAudit.exhausted_after_round470_boundary,
    required_round470_screened: duplicateAudit.required_round470_screened,
    validation_ok: duplicateAudit.validation_ok,
    duplicate_audit: path.join(OUT_DIR, "duplicate_audit.json").replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
