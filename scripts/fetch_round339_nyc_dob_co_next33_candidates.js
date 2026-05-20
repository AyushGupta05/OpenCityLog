const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round339_nyc_dob_co_next33_candidates.generated.js";
const REQUIRED_ROUND308_FILE = "tmp/subagents/round308_nyc_dob_co_next26/candidates.json";
const REQUIRED_ROUND313_FILE = "tmp/subagents/round313_nyc_dob_co_next27/candidates.json";
const REQUIRED_ROUND318_FILE = "tmp/subagents/round318_nyc_dob_co_next28/candidates.json";
const REQUIRED_ROUND322_FILE = "tmp/subagents/round322_nyc_dob_co_next29/candidates.json";
const REQUIRED_ROUND326_FILE = "tmp/subagents/round326_nyc_dob_co_next30/candidates.json";
const REQUIRED_ROUND330_FILE = "tmp/subagents/round330_nyc_dob_co_next31/candidates.json";
const REQUIRED_ROUND335_FILE = "tmp/subagents/round335_nyc_dob_co_next32/candidates.json";

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
    .replaceAll("round308", "round339")
    .replaceAll("Round308", "Round339")
    .replaceAll("next26", "next33")
    .replaceAll("Next26", "Next33")
    .replaceAll("through round303", "through round335");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const priorRoundFiles = [
    round303File,
    `"${REQUIRED_ROUND308_FILE}"`,
    `"${REQUIRED_ROUND313_FILE}"`,
    `"${REQUIRED_ROUND318_FILE}"`,
    `"${REQUIRED_ROUND322_FILE}"`,
    `"${REQUIRED_ROUND326_FILE}"`,
    `"${REQUIRED_ROUND330_FILE}"`,
    `"${REQUIRED_ROUND335_FILE}"`
  ].join(",\n  ");
  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "explicit duplicate Round308/Round313/Round318/Round322/Round326/Round330/Round335 files"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "required Round308/Round313/Round318/Round322/Round326/Round330/Round335 screened files"
  );
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    '  "300",\n  "303",\n  "308",\n  "313",\n  "318",\n  "322",\n  "326",\n  "330",\n  "335"\n];',
    "screened rounds include Round308, Round313, Round318, Round322, Round326, Round330, and Round335"
  );
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n      required_round308_screened: duplicateIndex.files.includes("tmp/subagents/round308_nyc_dob_co_next26/candidates.json"),\n      required_round313_screened: duplicateIndex.files.includes("tmp/subagents/round313_nyc_dob_co_next27/candidates.json"),\n      required_round318_screened: duplicateIndex.files.includes("tmp/subagents/round318_nyc_dob_co_next28/candidates.json"),\n      required_round322_screened: duplicateIndex.files.includes("tmp/subagents/round322_nyc_dob_co_next29/candidates.json"),\n      required_round326_screened: duplicateIndex.files.includes("tmp/subagents/round326_nyc_dob_co_next30/candidates.json"),\n      required_round330_screened: duplicateIndex.files.includes("tmp/subagents/round330_nyc_dob_co_next31/candidates.json"),\n      required_round335_screened: duplicateIndex.files.includes("tmp/subagents/round335_nyc_dob_co_next32/candidates.json"),',
    "Round308/Round313/Round318/Round322/Round326/Round330/Round335 validation check fields"
  );
  transformed = replaceOnce(
    transformed,
    "  const sourceAuditEntry = {\n    ...metadata,\n    reliability:",
    "  const sourceAuditEntry = {\n    ...metadata,\n    accessed_at: ACCESSED_AT,\n    confidence: \"documented\",\n    method: \"Round339 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    transformation_method: \"Round339 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    limitations: \"Legacy CO issuance is an administrative/legal DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome. Coordinates are DOB/Open Data geocoded address points.\",\n    reliability:",
    "source audit provenance fields"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,\n    `- Round308 screened: ${validation.checks.required_round308_screened}`,\n    `- Round313 screened: ${validation.checks.required_round313_screened}`,\n    `- Round318 screened: ${validation.checks.required_round318_screened}`,\n    `- Round322 screened: ${validation.checks.required_round322_screened}`,\n    `- Round326 screened: ${validation.checks.required_round326_screened}`,\n    `- Round330 screened: ${validation.checks.required_round330_screened}`,\n    `- Round335 screened: ${validation.checks.required_round335_screened}`,',
    "Round308/Round313/Round318/Round322/Round326/Round330/Round335 validation report lines"
  );
  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round339_nyc_dob_co_next33", "Round339 output path");
  assertContains(transformed, "Round339 NYC DOB CO Next33 Candidate Pack", "Round339 notes title");
  assertContains(transformed, "nyc_dob_co_round339_legacy_", "Round339 candidate ID prefix");
  assertContains(transformed, REQUIRED_ROUND308_FILE, "Round308 screened file");
  assertContains(transformed, REQUIRED_ROUND313_FILE, "Round313 screened file");
  assertContains(transformed, REQUIRED_ROUND318_FILE, "Round318 screened file");
  assertContains(transformed, REQUIRED_ROUND322_FILE, "Round322 screened file");
  assertContains(transformed, REQUIRED_ROUND326_FILE, "Round326 screened file");
  assertContains(transformed, REQUIRED_ROUND330_FILE, "Round330 screened file");
  assertContains(transformed, REQUIRED_ROUND335_FILE, "Round335 screened file");
  assertContains(transformed, '  "308",\n  "313",\n  "318",\n  "322",\n  "326",\n  "330",\n  "335"\n];', "screened rounds include 308, 313, 318, 322, 326, 330, and 335");
  assertContains(transformed, "through round335", "duplicate-screening text through Round335");
  assertContains(transformed, "required_round308_screened", "Round308 validation result");
  assertContains(transformed, "required_round313_screened", "Round313 validation result");
  assertContains(transformed, "required_round318_screened", "Round318 validation result");
  assertContains(transformed, "required_round322_screened", "Round322 validation result");
  assertContains(transformed, "required_round326_screened", "Round326 validation result");
  assertContains(transformed, "required_round330_screened", "Round330 validation result");
  assertContains(transformed, "required_round335_screened", "Round335 validation result");
  assertContains(transformed, "accessed_at: ACCESSED_AT", "source audit accessed_at");
  assertContains(transformed, "confidence: \"documented\"", "source audit confidence");
  assertContains(transformed, "transformation_method: \"Round339 queried", "source audit transformation method");
  assertContains(transformed, "scripts/fetch_round339_nyc_dob_co_next33_candidates.js standalone validation artifact", "Round339 validator label");
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
    throw new Error("Transformed Round339 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
