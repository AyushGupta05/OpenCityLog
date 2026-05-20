const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round326_nyc_dob_co_next30_candidates.generated.js";
const REQUIRED_ROUND308_FILE = "tmp/subagents/round308_nyc_dob_co_next26/candidates.json";
const REQUIRED_ROUND313_FILE = "tmp/subagents/round313_nyc_dob_co_next27/candidates.json";
const REQUIRED_ROUND318_FILE = "tmp/subagents/round318_nyc_dob_co_next28/candidates.json";
const REQUIRED_ROUND322_FILE = "tmp/subagents/round322_nyc_dob_co_next29/candidates.json";

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
    .replaceAll("round308", "round326")
    .replaceAll("Round308", "Round326")
    .replaceAll("next26", "next30")
    .replaceAll("Next26", "Next30")
    .replaceAll("through round303", "through round322");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const priorRoundFiles = [
    round303File,
    `"${REQUIRED_ROUND308_FILE}"`,
    `"${REQUIRED_ROUND313_FILE}"`,
    `"${REQUIRED_ROUND318_FILE}"`,
    `"${REQUIRED_ROUND322_FILE}"`
  ].join(",\n  ");
  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "explicit duplicate Round308/Round313/Round318/Round322 files"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "required Round308/Round313/Round318/Round322 screened files"
  );
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    '  "300",\n  "303",\n  "308",\n  "313",\n  "318",\n  "322"\n];',
    "screened rounds include Round308, Round313, Round318, and Round322"
  );
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n      required_round308_screened: duplicateIndex.files.includes("tmp/subagents/round308_nyc_dob_co_next26/candidates.json"),\n      required_round313_screened: duplicateIndex.files.includes("tmp/subagents/round313_nyc_dob_co_next27/candidates.json"),\n      required_round318_screened: duplicateIndex.files.includes("tmp/subagents/round318_nyc_dob_co_next28/candidates.json"),\n      required_round322_screened: duplicateIndex.files.includes("tmp/subagents/round322_nyc_dob_co_next29/candidates.json"),',
    "Round308/Round313/Round318/Round322 validation check fields"
  );
  transformed = replaceOnce(
    transformed,
    "  const sourceAuditEntry = {\n    ...metadata,\n    reliability:",
    "  const sourceAuditEntry = {\n    ...metadata,\n    accessed_at: ACCESSED_AT,\n    confidence: \"documented\",\n    method: \"Round326 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    transformation_method: \"Round326 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    limitations: \"Legacy CO issuance is an administrative/legal DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome. Coordinates are DOB/Open Data geocoded address points.\",\n    reliability:",
    "source audit provenance fields"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,\n    `- Round308 screened: ${validation.checks.required_round308_screened}`,\n    `- Round313 screened: ${validation.checks.required_round313_screened}`,\n    `- Round318 screened: ${validation.checks.required_round318_screened}`,\n    `- Round322 screened: ${validation.checks.required_round322_screened}`,',
    "Round308/Round313/Round318/Round322 validation report lines"
  );
  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round326_nyc_dob_co_next30", "Round326 output path");
  assertContains(transformed, "Round326 NYC DOB CO Next30 Candidate Pack", "Round326 notes title");
  assertContains(transformed, "nyc_dob_co_round326_legacy_", "Round326 candidate ID prefix");
  assertContains(transformed, REQUIRED_ROUND308_FILE, "Round308 screened file");
  assertContains(transformed, REQUIRED_ROUND313_FILE, "Round313 screened file");
  assertContains(transformed, REQUIRED_ROUND318_FILE, "Round318 screened file");
  assertContains(transformed, REQUIRED_ROUND322_FILE, "Round322 screened file");
  assertContains(transformed, '  "308",\n  "313",\n  "318",\n  "322"\n];', "screened rounds include 308, 313, 318, and 322");
  assertContains(transformed, "through round322", "duplicate-screening text through Round322");
  assertContains(transformed, "required_round308_screened", "Round308 validation result");
  assertContains(transformed, "required_round313_screened", "Round313 validation result");
  assertContains(transformed, "required_round318_screened", "Round318 validation result");
  assertContains(transformed, "required_round322_screened", "Round322 validation result");
  assertContains(transformed, "accessed_at: ACCESSED_AT", "source audit accessed_at");
  assertContains(transformed, "confidence: \"documented\"", "source audit confidence");
  assertContains(transformed, "transformation_method: \"Round326 queried", "source audit transformation method");
  assertContains(transformed, "scripts/fetch_round326_nyc_dob_co_next30_candidates.js standalone validation artifact", "Round326 validator label");
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
    throw new Error("Transformed Round326 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
