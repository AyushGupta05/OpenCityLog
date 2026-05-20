const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round406_nyc_dob_co_next48_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round456_nyc_dob_co_next53_candidates.generated.js";
const OUT_DIR = path.join("tmp", "subagents", "round456_nyc_dob_co_next53");
const ACCESSED_AT = "2026-05-20";

const ADDITIONAL_DOB_CO_FILES = [
  "tmp/subagents/round406_nyc_dob_co_next48/candidates.json",
  "tmp/subagents/round412_nyc_dob_co_next49/candidates.json",
  "tmp/subagents/round415_nyc_dob_co_next50/candidates.json",
  "tmp/subagents/round417_nyc_dob_co_next51/candidates.json",
  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json"
];

const ADDITIONAL_SCREENED_ROUNDS = ["406", "412", "415", "417", "453"];

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round456 wrapper is missing ${label}`);
  }
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
  if (duplicateJobNumbers.size > 0) {
    validation.ok = false;
    validation.errors = validation.errors || [];
    validation.errors.push(`Duplicate DOB job numbers in Round456 pack: ${[...duplicateJobNumbers].sort().join(", ")}`);
  }
  writeJson(validationPath, validation);

  const validationReport = stampRetrievedAt(readJson(validationReportPath));
  validationReport.retrieved_at_present = validation.checks.retrieved_at_present;
  validationReport.unique_job_numbers = jobNumbers.size;
  validationReport.no_duplicate_job_numbers = validation.checks.no_duplicate_job_numbers;
  validationReport.validation_ok = validation.ok;
  validationReport.errors = validation.errors || [];
  writeJson(validationReportPath, validationReport);

  const readback = stampRetrievedAt(readJson(readbackPath));
  readback.checks = readback.checks || {};
  readback.checks.retrieved_at_present = validation.checks.retrieved_at_present;
  readback.checks.no_duplicate_job_numbers = validation.checks.no_duplicate_job_numbers;
  readback.unique_job_numbers = jobNumbers.size;
  readback.ok = Object.values(readback.checks).every(Boolean);
  writeJson(readbackPath, readback);
  if (!readback.ok) {
    throw new Error(`Round456 retrieved_at readback failed: ${JSON.stringify(readback.checks, null, 2)}`);
  }

  const notes = fs.readFileSync(notesPath, "utf8");
  const retrievedLine = `- Accessed/retrieved date: ${ACCESSED_AT}.\n`;
  let updatedNotes = notes;
  if (!updatedNotes.includes(retrievedLine.trim())) {
    updatedNotes = updatedNotes.replace("- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.\n", `- Official NYC Open Data legacy DOB Certificate Of Occupancy (\`bs8b-p36w\`) rows.\n${retrievedLine}`);
  }
  const uniqueJobLine = `- Unique DOB job numbers retained: ${jobNumbers.size}.\n`;
  if (!updatedNotes.includes(uniqueJobLine.trim())) {
    updatedNotes = updatedNotes.replace(`- Candidates retained: ${candidateRows(candidatesDoc).length}\n`, `- Candidates retained: ${candidateRows(candidatesDoc).length}\n${uniqueJobLine}`);
  }
  if (updatedNotes !== notes) fs.writeFileSync(notesPath, updatedNotes);
}

function transformRound406Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round406", "round456")
    .replaceAll("Round406", "Round456")
    .replaceAll("next48", "next53")
    .replaceAll("Next48", "Next53")
    .replaceAll("through round400", "through round453")
    .replaceAll("through Round400", "through Round453")
    .replaceAll("required_round400_screened", "required_round453_screened");

  const additionalFiles = ADDITIONAL_DOB_CO_FILES.map((file) => `  "${file}"`).join(",\n");
  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json"\n];',
    `  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json",\n${additionalFiles}\n];`,
    "Round456 through Round453 additional DOB CO files"
  );

  const additionalRounds = ADDITIONAL_SCREENED_ROUNDS.map((round) => `  "${round}"`).join(",\n");
  transformed = replaceOnce(
    transformed,
    '  "400"\n];',
    `  "400",\n${additionalRounds}\n];`,
    "Round456 through Round453 screened round markers"
  );

  transformed = replaceOnce(
    transformed,
    "  transformed = addTitleDateScreening(transformed);\n\n  transformed = replaceOnce(\n    transformed,\n    \"main().catch((error) => {",
    "  transformed = addTitleDateScreening(transformed);\n\n  transformed = replaceOnce(\n    transformed,\n    \"  const selected = [];\\n  const ids = new Set();\\n  const addressDateKeys = new Set();\\n  for (const candidate of sorted) {\\n    const addressDateKey = candidateAddressDateKey(candidate);\\n    if (ids.has(candidate.candidate_id) || addressDateKeys.has(addressDateKey)) continue;\",\n    \"  const selected = [];\\n  const ids = new Set();\\n  const addressDateKeys = new Set();\\n  const jobNumberKeys = new Set();\\n  for (const candidate of sorted) {\\n    const addressDateKey = candidateAddressDateKey(candidate);\\n    const jobNumberKey = normalizeKey(candidate.job_number || candidate.source_row_ref?.job_number || candidate.source_fields?.job_number || '');\\n    if (ids.has(candidate.candidate_id) || addressDateKeys.has(addressDateKey) || (jobNumberKey && jobNumberKeys.has(jobNumberKey))) continue;\",\n    \"selected-candidate job-number uniqueness\"\n  );\n  transformed = replaceOnce(\n    transformed,\n    \"    ids.add(candidate.candidate_id);\\n    addressDateKeys.add(addressDateKey);\",\n    \"    ids.add(candidate.candidate_id);\\n    addressDateKeys.add(addressDateKey);\\n    if (jobNumberKey) jobNumberKeys.add(jobNumberKey);\",\n    \"selected-candidate job-number key registration\"\n  );\n\n  transformed = replaceOnce(\n    transformed,\n    \"main().catch((error) => {",
    "Round456 selected-candidate job-number screen injection"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "base wrapper main invocation"
  );

  assertContains(transformed, "round456_nyc_dob_co_next53", "Round456 output path");
  assertContains(transformed, "Round456 NYC DOB CO Next53 Candidate Pack", "Round456 notes title");
  assertContains(transformed, "nyc_dob_co_round456_legacy_", "Round456 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round453_nyc_dob_co_next52/candidates.json", "Round453 screened candidates");
  assertContains(transformed, "through round453", "duplicate-screening text through Round453");
  assertContains(transformed, "required_round453_screened", "Round453 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "titleDateKeys", "title/date duplicate screening");
  assertContains(transformed, "jobNumberKeys", "selected-candidate job-number screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "scripts/fetch_round456_nyc_dob_co_next53_candidates.js standalone validation artifact", "Round456 validator label");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
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
    throw new Error("Transformed Round456 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
  postProcessRetrievedAt();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
