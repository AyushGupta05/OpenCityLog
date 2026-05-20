const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round313_nyc_dob_co_next27_candidates.generated.js";
const REQUIRED_ROUND308_FILE = "tmp/subagents/round308_nyc_dob_co_next26/candidates.json";

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

function transformRound308Source(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round308", "round313")
    .replaceAll("Round308", "Round313")
    .replaceAll("next26", "next27")
    .replaceAll("Next26", "Next27")
    .replaceAll("through round303", "through round308");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const round308File = `"${REQUIRED_ROUND308_FILE}"`;
  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${round303File},\n  ${round308File}\n];`,
    "explicit duplicate Round308 file"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${round303File},\n  ${round308File}\n];`,
    "required Round308 screened file"
  );
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    '  "300",\n  "303",\n  "308"\n];',
    "screened rounds include Round308"
  );
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n      required_round308_screened: duplicateIndex.files.includes("tmp/subagents/round308_nyc_dob_co_next26/candidates.json"),',
    "Round308 validation check field"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,\n    `- Round308 screened: ${validation.checks.required_round308_screened}`,',
    "Round308 validation report line"
  );
  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round313_nyc_dob_co_next27", "Round313 output path");
  assertContains(transformed, "Round313 NYC DOB CO Next27 Candidate Pack", "Round313 notes title");
  assertContains(transformed, "nyc_dob_co_round313_legacy_", "Round313 candidate ID prefix");
  assertContains(transformed, REQUIRED_ROUND308_FILE, "Round308 screened file");
  assertContains(transformed, '  "308"\n];', "screened rounds include 308");
  assertContains(transformed, "through round308", "duplicate-screening text through Round308");
  assertContains(transformed, "required_round308_screened", "Round308 validation result");
  assertContains(transformed, "scripts/fetch_round313_nyc_dob_co_next27_candidates.js standalone validation artifact", "Round313 validator label");
  assertContains(transformed, "module.exports = { main };", "exported main");

  return transformed;
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
    throw new Error("Transformed Round313 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
