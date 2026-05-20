const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round406_nyc_dob_co_next48_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round415_nyc_dob_co_next50_candidates.generated.js";
const ROUND406_CANDIDATES = "tmp/subagents/round406_nyc_dob_co_next48/candidates.json";
const ROUND412_CANDIDATES = "tmp/subagents/round412_nyc_dob_co_next49/candidates.json";

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed Round415 wrapper is missing ${label}`);
  }
}

function transformRound406Source(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round406", "round415")
    .replaceAll("Round406", "Round415")
    .replaceAll("next48", "next50")
    .replaceAll("Next48", "Next50")
    .replaceAll("through round400", "through round412")
    .replaceAll("through Round400", "through Round412")
    .replaceAll("required_round400_screened", "required_round412_screened");

  transformed = replaceOnce(
    transformed,
    '  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json"\n];',
    `  "tmp/subagents/round400_nyc_dob_co_next47/candidates.json",\n  "${ROUND406_CANDIDATES}",\n  "${ROUND412_CANDIDATES}"\n];`,
    "Round406 and Round412 prior DOB CO candidate files"
  );

  transformed = replaceOnce(
    transformed,
    '  "400"\n];',
    '  "400",\n  "406",\n  "412"\n];',
    "Round406 and Round412 screened round markers"
  );

  transformed = replaceOnce(
    transformed,
    'assertContains(transformed, "tmp/subagents/round400_nyc_dob_co_next47/candidates.json", "Round400 screened file");',
    `assertContains(transformed, "${ROUND412_CANDIDATES}", "Round412 screened file");`,
    "Round412 screened file assertion"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "base script main invocation"
  );

  assertContains(transformed, "round415_nyc_dob_co_next50", "Round415 output path");
  assertContains(transformed, "Round415 NYC DOB CO Next50 Candidate Pack", "Round415 notes title");
  assertContains(transformed, "nyc_dob_co_round415_legacy_", "Round415 candidate ID prefix");
  assertContains(transformed, ROUND406_CANDIDATES, "Round406 screened candidates");
  assertContains(transformed, ROUND412_CANDIDATES, "Round412 screened candidates");
  assertContains(transformed, "through round412", "duplicate-screening text through Round412");
  assertContains(transformed, "required_round412_screened", "Round412 validation result");
  assertContains(transformed, "not a complete account of construction, occupancy, safety, or outcomes", "complete-account CO caveat");
  assertContains(transformed, "titleDateKeys", "title/date duplicate screening");
  assertContains(transformed, "validation_report.json", "JSON validation report path");
  assertContains(transformed, "scripts/fetch_round415_nyc_dob_co_next50_candidates.js standalone validation artifact", "Round415 validator label");
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
    throw new Error("Transformed Round415 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
