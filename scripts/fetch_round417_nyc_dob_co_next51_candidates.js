const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round406_nyc_dob_co_next48_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round417_nyc_dob_co_next51_candidates.generated.js";
const ROUND406_CANDIDATES = "tmp/subagents/round406_nyc_dob_co_next48/candidates.json";
const ROUND412_CANDIDATES = "tmp/subagents/round412_nyc_dob_co_next49/candidates.json";
const ROUND415_CANDIDATES = "tmp/subagents/round415_nyc_dob_co_next50/candidates.json";

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round417 wrapper is missing ${label}`);
  }
}

function transformRound406Source(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round406", "round417")
    .replaceAll("Round406", "Round417")
    .replaceAll("next48", "next51")
    .replaceAll("Next48", "Next51")
    .replaceAll("through round400", "through round415")
    .replaceAll("through Round400", "through Round415")
    .replaceAll("required_round400_screened", "required_round415_screened");

  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json"\n];',
    `  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json",\n  "${ROUND406_CANDIDATES}",\n  "${ROUND412_CANDIDATES}",\n  "${ROUND415_CANDIDATES}"\n];`,
    "Round406, Round412, and Round415 prior DOB CO candidate files"
  );

  transformed = replaceOnce(
    transformed,
    '  "400"\n];',
    '  "400",\n  "406",\n  "412",\n  "415"\n];',
    "Round406, Round412, and Round415 screened round markers"
  );

  transformed = replaceOnce(
    transformed,
    'assertContains(transformed, "tmp/subagents/round400_nyc_dob_co_next47/candidates.json", "Round400 screened file");',
    `assertContains(transformed, "${ROUND415_CANDIDATES}", "Round415 screened file");`,
    "Round415 screened file assertion"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "base script main invocation"
  );

  assertContains(transformed, "round417_nyc_dob_co_next51", "Round417 output path");
  assertContains(transformed, "Round417 NYC DOB CO Next51 Candidate Pack", "Round417 notes title");
  assertContains(transformed, "nyc_dob_co_round417_legacy_", "Round417 candidate ID prefix");
  assertContains(transformed, ROUND406_CANDIDATES, "Round406 screened candidates");
  assertContains(transformed, ROUND412_CANDIDATES, "Round412 screened candidates");
  assertContains(transformed, ROUND415_CANDIDATES, "Round415 screened candidates");
  assertContains(transformed, "through round415", "duplicate-screening text through Round415");
  assertContains(transformed, "required_round415_screened", "Round415 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "titleDateKeys", "title/date duplicate screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "scripts/fetch_round417_nyc_dob_co_next51_candidates.js standalone validation artifact", "Round417 validator label");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
}

async function main() {
  const source = transformRound406Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round417 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
