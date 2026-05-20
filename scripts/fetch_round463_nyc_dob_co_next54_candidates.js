const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round456_nyc_dob_co_next53_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round463_nyc_dob_co_next54_candidates.generated.js";
const PRIOR_ROUND_FILE = "tmp/subagents/round456_nyc_dob_co_next53/candidates.json";
const PRIOR_ROUND = "456";

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
    throw new Error(`Transformed Round463 wrapper is missing ${label}`);
  }
}

function transformRound456Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round456", "round463")
    .replaceAll("Round456", "Round463")
    .replaceAll("next53", "next54")
    .replaceAll("Next53", "Next54")
    .replaceAll("through round453", "through round456")
    .replaceAll("through Round453", "through Round456")
    .replaceAll("required_round453_screened", "required_round456_screened");

  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json"\n];',
    `  "tmp/subagents/round453_nyc_dob_co_next52/candidates.json",\n  "${PRIOR_ROUND_FILE}"\n];`,
    "Round463 prior DOB CO file list through Round456"
  );

  transformed = replaceOnce(
    transformed,
    'const ADDITIONAL_SCREENED_ROUNDS = ["406", "412", "415", "417", "453"];',
    `const ADDITIONAL_SCREENED_ROUNDS = ["406", "412", "415", "417", "453", "${PRIOR_ROUND}"];`,
    "Round463 screened round markers through Round456"
  );

  transformed = exportMain(transformed);

  assertContains(transformed, "round463_nyc_dob_co_next54", "Round463 output path");
  assertContains(transformed, "Round463 NYC DOB CO Next54 Candidate Pack", "Round463 notes title");
  assertContains(transformed, "nyc_dob_co_round463_legacy_", "Round463 candidate ID prefix");
  assertContains(transformed, PRIOR_ROUND_FILE, "Round456 screened candidates");
  assertContains(transformed, "through round456", "duplicate-screening text through Round456");
  assertContains(transformed, "required_round456_screened", "Round456 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "jobNumberKeys", "selected-candidate job-number screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "scripts/fetch_round463_nyc_dob_co_next54_candidates.js standalone validation artifact", "Round463 validator label");
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
    throw new Error("Transformed Round463 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
