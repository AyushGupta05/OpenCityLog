const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round456_nyc_dob_co_next53_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round468_nyc_dob_co_next55_candidates.generated.js";
const PRIOR_ROUND_FILES = [
  "tmp/subagents/round456_nyc_dob_co_next53/candidates.json",
  "tmp/subagents/round463_nyc_dob_co_next54/candidates.json"
];
const PRIOR_ROUNDS = ["456", "463"];

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function exportMain(source) {
  return source.replace(
    /\nmain\(\)\.catch\(\(error\) => \{\n  console\.error\(error\);\n  process\.exit\(1\);\n\}\);\s*$/,
    "\nmodule.exports = { main };\n"
  );
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round468 wrapper is missing ${label}`);
  }
}

function transformRound456Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round456", "round468")
    .replaceAll("Round456", "Round468")
    .replaceAll("next53", "next55")
    .replaceAll("Next53", "Next55")
    .replaceAll("through round453", "through round463")
    .replaceAll("through Round453", "through Round463")
    .replaceAll("required_round453_screened", "required_round463_screened");

  const additionalFiles = PRIOR_ROUND_FILES.map((file) => `  "${file}"`).join(",\n");
  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json"\n];',
    `  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json",\n${additionalFiles}\n];`,
    "Round468 prior DOB CO file list through Round463"
  );

  const additionalRounds = PRIOR_ROUNDS.map((round) => `"${round}"`).join(", ");
  transformed = replaceOnce(
    transformed,
    'const ADDITIONAL_SCREENED_ROUNDS = ["406", "412", "415", "417", "453"];',
    `const ADDITIONAL_SCREENED_ROUNDS = ["406", "412", "415", "417", "453", ${additionalRounds}];`,
    "Round468 screened round markers through Round463"
  );

  transformed = exportMain(transformed);

  assertContains(transformed, "round468_nyc_dob_co_next55", "Round468 output path");
  assertContains(transformed, "Round468 NYC DOB CO Next55 Candidate Pack", "Round468 notes title");
  assertContains(transformed, "nyc_dob_co_round468_legacy_", "Round468 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round456_nyc_dob_co_next53/candidates.json", "Round456 screened candidates");
  assertContains(transformed, "tmp/subagents/round463_nyc_dob_co_next54/candidates.json", "Round463 screened candidates");
  assertContains(transformed, "through round463", "duplicate-screening text through Round463");
  assertContains(transformed, "required_round463_screened", "Round463 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "titleDateKeys", "title/date duplicate screening");
  assertContains(transformed, "jobNumberKeys", "selected-candidate job-number screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "scripts/fetch_round468_nyc_dob_co_next55_candidates.js standalone validation artifact", "Round468 validator label");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
}

async function main() {
  const source = transformRound456Wrapper(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round468 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
