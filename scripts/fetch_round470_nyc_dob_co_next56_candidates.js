const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round406_nyc_dob_co_next48_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round470_nyc_dob_co_next56_candidates.generated.js";
const OUT_DIR = path.join("tmp", "subagents", "round470_nyc_dob_co_next56");
const ACCESSED_AT = "2026-05-20";
const TARGET_MAX_COUNT = 200;

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
  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json",
  "tmp/subagents/round406_nyc_dob_co_next48/candidates.json",
  "tmp/subagents/round412_nyc_dob_co_next49/candidates.json",
  "tmp/subagents/round415_nyc_dob_co_next50/candidates.json",
  "tmp/subagents/round417_nyc_dob_co_next51/candidates.json",
  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json",
  "tmp/subagents/round456_nyc_dob_co_next53/candidates.json",
  "tmp/subagents/round463_nyc_dob_co_next54/candidates.json",
  "tmp/subagents/round468_nyc_dob_co_next55/candidates.json"
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
  "400",
  "406",
  "412",
  "415",
  "417",
  "453",
  "456",
  "463",
  "468"
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

function replaceConstArray(source, name, values) {
  const pattern = new RegExp(`const ${name} = \\[\\n[\\s\\S]*?\\n\\];`);
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${name} array`);
  }
  const replacement = `const ${name} = [\n${values.map((value) => `  "${value}"`).join(",\n")}\n];`;
  return source.replace(pattern, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round470 wrapper is missing ${label}`);
  }
}

function exportMain(source) {
  return source.replace(
    /\nmain\(\)\.catch\(\(error\) => \{\n  console\.error\(error\);\n  process\.exit\(1\);\n\}\);\s*$/,
    "\nmodule.exports = { main };\n"
  );
}

function applyRound470GeneratedPatches(source) {
  let transformed = source;

  transformed = replaceOnce(
    transformed,
    "  if (summary.candidate_count !== TARGET_COUNT || candidates.length !== TARGET_COUNT) {\n    errors.push(`Expected ${TARGET_COUNT} candidates, found summary=${summary.candidate_count} candidates=${candidates.length}`);\n  }",
    "  if (summary.candidate_count !== candidates.length || candidates.length > TARGET_COUNT || candidates.length === 0) {\n    errors.push(`Expected between 1 and ${TARGET_COUNT} candidates and matching summary count, found summary=${summary.candidate_count} candidates=${candidates.length}`);\n  }",
    "up-to-target candidate count validation"
  );

  transformed = replaceOnce(
    transformed,
    "  const selected = [];\n  const ids = new Set();\n  const addressDateKeys = new Set();\n  for (const candidate of sorted) {\n    const addressDateKey = candidateAddressDateKey(candidate);\n    if (ids.has(candidate.candidate_id) || addressDateKeys.has(addressDateKey)) continue;",
    "  const selected = [];\n  const ids = new Set();\n  const addressDateKeys = new Set();\n  const jobNumberKeys = new Set();\n  for (const candidate of sorted) {\n    const addressDateKey = candidateAddressDateKey(candidate);\n    const jobNumberKey = normalizeKey(candidate.job_number || candidate.source_row_ref?.job_number || candidate.source_fields?.job_number || \"\");\n    if (ids.has(candidate.candidate_id) || addressDateKeys.has(addressDateKey) || (jobNumberKey && jobNumberKeys.has(jobNumberKey))) continue;",
    "selected-candidate job-number uniqueness"
  );

  transformed = replaceOnce(
    transformed,
    "    ids.add(candidate.candidate_id);\n    addressDateKeys.add(addressDateKey);",
    "    ids.add(candidate.candidate_id);\n    addressDateKeys.add(addressDateKey);\n    if (jobNumberKey) jobNumberKeys.add(jobNumberKey);",
    "selected-candidate job-number key registration"
  );

  return transformed;
}

function transformRound406Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round406_nyc_dob_co_next48", "round470_nyc_dob_co_next56")
    .replaceAll("fetch_round406_nyc_dob_co_next48_candidates", "fetch_round470_nyc_dob_co_next56_candidates")
    .replaceAll("Round406", "Round470")
    .replaceAll("round406", "round470")
    .replaceAll("next48", "next56")
    .replaceAll("Next48", "Next56")
    .replaceAll("through round400", "through round468")
    .replaceAll("through Round400", "through Round468")
    .replaceAll("Round400", "Round468")
    .replaceAll("required_round400_screened", "required_round468_screened");

  transformed = replaceConstArray(transformed, "ADDITIONAL_DOB_CO_FILES", ADDITIONAL_DOB_CO_FILES);
  transformed = replaceConstArray(transformed, "ADDITIONAL_SCREENED_ROUNDS", ADDITIONAL_SCREENED_ROUNDS);

  transformed = replaceOnce(
    transformed,
    "  transformed = addTitleDateScreening(transformed);\n\n  transformed = replaceOnce(\n    transformed,\n    \"main().catch((error) => {",
    "  transformed = addTitleDateScreening(transformed);\n\n  transformed = applyRound470GeneratedPatches(transformed);\n\n  transformed = replaceOnce(\n    transformed,\n    \"main().catch((error) => {",
    "Round470 generated-template patch hook"
  );

  transformed = replaceOnce(
    transformed,
    "function transformRound308Source(source) {",
    `${applyRound470GeneratedPatches.toString()}\n\nfunction transformRound308Source(source) {`,
    "Round470 generated-template patch function"
  );

  transformed = replaceOnce(
    transformed,
    "target_count_met: candidates.length === 200,",
    "candidate_count_within_target: candidates.length > 0 && candidates.length <= 200,",
    "Round470 readback up-to-target count check"
  );

  transformed = exportMain(transformed);

  assertContains(transformed, "round470_nyc_dob_co_next56", "Round470 output path");
  assertContains(transformed, "Round470 NYC DOB CO Next56 Candidate Pack", "Round470 notes title");
  assertContains(transformed, "nyc_dob_co_round470_legacy_", "Round470 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round468_nyc_dob_co_next55/candidates.json", "Round468 screened candidates");
  assertContains(transformed, "through round468", "duplicate-screening text through Round468");
  assertContains(transformed, "required_round468_screened", "Round468 validation result");
  assertContains(transformed, "Expected between 1 and ${TARGET_COUNT} candidates", "up-to-target validation");
  assertContains(transformed, "jobNumberKeys", "selected-candidate job-number screening");
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
  return doc.candidates || doc.events || doc.records || [];
}

function stampRetrievedAt(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    value.retrieved_at = value.retrieved_at || value.accessed_at || ACCESSED_AT;
  }
  return value;
}

function postProcessRetrievedAt() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const validationPath = path.join(OUT_DIR, "validation.json");
  const validationReportPath = path.join(OUT_DIR, "validation_report.json");
  const readbackPath = path.join(OUT_DIR, "readback.json");
  const notesPath = path.join(OUT_DIR, "notes.md");

  const candidatesDoc = stampRetrievedAt(readJson(candidatesPath));
  for (const sourceAudit of candidatesDoc.source_audits || []) stampRetrievedAt(sourceAudit);

  const jobNumbers = new Set();
  const duplicateJobNumbers = new Set();
  for (const candidate of candidateRows(candidatesDoc)) {
    stampRetrievedAt(candidate);
    stampRetrievedAt(candidate.source_row_ref);
    const jobNumber = String(candidate.job_number || candidate.source_row_ref?.job_number || "").trim().toLowerCase();
    if (jobNumber) {
      if (jobNumbers.has(jobNumber)) duplicateJobNumbers.add(jobNumber);
      jobNumbers.add(jobNumber);
    }
  }
  writeJson(candidatesPath, candidatesDoc);

  const sourceAudit = stampRetrievedAt(readJson(sourceAuditPath));
  for (const source of sourceAudit.sources || []) stampRetrievedAt(source);
  writeJson(sourceAuditPath, sourceAudit);

  const summary = stampRetrievedAt(readJson(summaryPath));
  writeJson(summaryPath, summary);

  const validation = stampRetrievedAt(readJson(validationPath));
  validation.checks = validation.checks || {};
  validation.checks.retrieved_at_present = candidateRows(candidatesDoc)
    .every((candidate) => candidate.retrieved_at === ACCESSED_AT);
  validation.checks.unique_job_numbers = jobNumbers.size;
  validation.checks.no_duplicate_job_numbers = duplicateJobNumbers.size === 0;
  validation.checks.candidate_count_within_target = candidateRows(candidatesDoc).length > 0 &&
    candidateRows(candidatesDoc).length <= TARGET_MAX_COUNT;
  if (duplicateJobNumbers.size > 0) {
    validation.ok = false;
    validation.errors = validation.errors || [];
    validation.errors.push(`Duplicate DOB job numbers in Round470 pack: ${[...duplicateJobNumbers].sort().join(", ")}`);
  }
  writeJson(validationPath, validation);

  const validationReport = stampRetrievedAt(readJson(validationReportPath));
  validationReport.retrieved_at_present = validation.checks.retrieved_at_present;
  validationReport.unique_job_numbers = jobNumbers.size;
  validationReport.no_duplicate_job_numbers = validation.checks.no_duplicate_job_numbers;
  validationReport.candidate_count_within_target = validation.checks.candidate_count_within_target;
  validationReport.required_round468_screened = validation.checks.required_round468_screened;
  validationReport.validation_ok = validation.ok;
  validationReport.errors = validation.errors || [];
  writeJson(validationReportPath, validationReport);

  const readback = stampRetrievedAt(readJson(readbackPath));
  readback.checks = readback.checks || {};
  readback.checks.retrieved_at_present = validation.checks.retrieved_at_present;
  readback.checks.no_duplicate_job_numbers = validation.checks.no_duplicate_job_numbers;
  readback.checks.candidate_count_within_target = validation.checks.candidate_count_within_target;
  readback.checks.required_round468_screened = validation.checks.required_round468_screened === true;
  readback.unique_job_numbers = jobNumbers.size;
  readback.ok = Object.values(readback.checks).every(Boolean);
  writeJson(readbackPath, readback);
  if (!readback.ok) {
    throw new Error(`Round470 retrieved_at readback failed: ${JSON.stringify(readback.checks, null, 2)}`);
  }

  const notes = fs.readFileSync(notesPath, "utf8");
  const retrievedLine = `- Accessed/retrieved date: ${ACCESSED_AT}.\n`;
  let updatedNotes = notes;
  if (!updatedNotes.includes(retrievedLine.trim())) {
    updatedNotes = updatedNotes.replace(
      "- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.\n",
      `- Official NYC Open Data legacy DOB Certificate Of Occupancy (\`bs8b-p36w\`) rows.\n${retrievedLine}`
    );
  }
  const uniqueJobLine = `- Unique DOB job numbers retained: ${jobNumbers.size}.\n`;
  if (!updatedNotes.includes(uniqueJobLine.trim())) {
    updatedNotes = updatedNotes.replace(
      `- Candidates retained: ${candidateRows(candidatesDoc).length}\n`,
      `- Candidates retained: ${candidateRows(candidatesDoc).length}\n${uniqueJobLine}`
    );
  }
  if (updatedNotes !== notes) fs.writeFileSync(notesPath, updatedNotes);
}

async function main() {
  const source = transformRound406Wrapper(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round470 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
  postProcessRetrievedAt();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
