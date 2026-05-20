const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round360_nyc_dob_co_next37_candidates.generated.js";
const REQUIRED_ROUND308_FILE = "tmp/subagents/round308_nyc_dob_co_next26/candidates.json";
const REQUIRED_ROUND313_FILE = "tmp/subagents/round313_nyc_dob_co_next27/candidates.json";
const REQUIRED_ROUND318_FILE = "tmp/subagents/round318_nyc_dob_co_next28/candidates.json";
const REQUIRED_ROUND322_FILE = "tmp/subagents/round322_nyc_dob_co_next29/candidates.json";
const REQUIRED_ROUND326_FILE = "tmp/subagents/round326_nyc_dob_co_next30/candidates.json";
const REQUIRED_ROUND330_FILE = "tmp/subagents/round330_nyc_dob_co_next31/candidates.json";
const REQUIRED_ROUND335_FILE = "tmp/subagents/round335_nyc_dob_co_next32/candidates.json";
const REQUIRED_ROUND339_FILE = "tmp/subagents/round339_nyc_dob_co_next33/candidates.json";
const REQUIRED_ROUND344_FILE = "tmp/subagents/round344_nyc_dob_co_next34/candidates.json";
const REQUIRED_ROUND349_FILE = "tmp/subagents/round349_nyc_dob_co_next35/candidates.json";
const REQUIRED_ROUND356_FILE = "tmp/subagents/round356_nyc_dob_co_next36/candidates.json";

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
    .replaceAll("round308", "round360")
    .replaceAll("Round308", "Round360")
    .replaceAll("next26", "next37")
    .replaceAll("Next26", "Next37")
    .replaceAll("through round303", "through round356");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const priorRoundFiles = [
    round303File,
    `"${REQUIRED_ROUND308_FILE}"`,
    `"${REQUIRED_ROUND313_FILE}"`,
    `"${REQUIRED_ROUND318_FILE}"`,
    `"${REQUIRED_ROUND322_FILE}"`,
    `"${REQUIRED_ROUND326_FILE}"`,
    `"${REQUIRED_ROUND330_FILE}"`,
    `"${REQUIRED_ROUND335_FILE}"`,
    `"${REQUIRED_ROUND339_FILE}"`,
    `"${REQUIRED_ROUND344_FILE}"`,
    `"${REQUIRED_ROUND349_FILE}"`,
    `"${REQUIRED_ROUND356_FILE}"`
  ].join(",\n  ");
  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "explicit duplicate Round308/Round313/Round318/Round322/Round326/Round330/Round335/Round339/Round344/Round349/Round356 files"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "required Round308/Round313/Round318/Round322/Round326/Round330/Round335/Round339/Round344/Round349/Round356 screened files"
  );
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    '  "300",\n  "303",\n  "308",\n  "313",\n  "318",\n  "322",\n  "326",\n  "330",\n  "335",\n  "339",\n  "344",\n  "349",\n  "356"\n];',
    "screened rounds include Round308 through Round356"
  );
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n      required_round308_screened: duplicateIndex.files.includes("tmp/subagents/round308_nyc_dob_co_next26/candidates.json"),\n      required_round313_screened: duplicateIndex.files.includes("tmp/subagents/round313_nyc_dob_co_next27/candidates.json"),\n      required_round318_screened: duplicateIndex.files.includes("tmp/subagents/round318_nyc_dob_co_next28/candidates.json"),\n      required_round322_screened: duplicateIndex.files.includes("tmp/subagents/round322_nyc_dob_co_next29/candidates.json"),\n      required_round326_screened: duplicateIndex.files.includes("tmp/subagents/round326_nyc_dob_co_next30/candidates.json"),\n      required_round330_screened: duplicateIndex.files.includes("tmp/subagents/round330_nyc_dob_co_next31/candidates.json"),\n      required_round335_screened: duplicateIndex.files.includes("tmp/subagents/round335_nyc_dob_co_next32/candidates.json"),\n      required_round339_screened: duplicateIndex.files.includes("tmp/subagents/round339_nyc_dob_co_next33/candidates.json"),\n      required_round344_screened: duplicateIndex.files.includes("tmp/subagents/round344_nyc_dob_co_next34/candidates.json"),\n      required_round349_screened: duplicateIndex.files.includes("tmp/subagents/round349_nyc_dob_co_next35/candidates.json"),\n      required_round356_screened: duplicateIndex.files.includes("tmp/subagents/round356_nyc_dob_co_next36/candidates.json"),',
    "Round308 through Round356 validation check fields"
  );
  transformed = replaceOnce(
    transformed,
    "  const sourceAuditEntry = {\n    ...metadata,\n    reliability:",
    "  const sourceAuditEntry = {\n    ...metadata,\n    accessed_at: ACCESSED_AT,\n    confidence: \"documented\",\n    method: \"Round360 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    transformation_method: \"Round360 queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.\",\n    limitations: \"Legacy CO issuance is an administrative/legal DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome. Coordinates are DOB/Open Data geocoded address points.\",\n    reliability:",
    "source audit provenance fields"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Counts",',
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Endpoint and Query",\n    "",\n    `- Endpoint: ${LEGACY_CO.api}`,\n    `- Metadata endpoint: ${LEGACY_CO.metadata}`,\n    `- Socrata query: $select=${LEGACY_SELECT.join(",")},:id; $where=c_o_issue_date between \\\'${START_DATE}T00:00:00\\\' and \\\'${END_DATE}T23:59:59\\\' AND latitude IS NOT NULL AND longitude IS NOT NULL AND application_status_raw=\\\'Issued\\\' AND issue_type in(\\\'Final\\\',\\\'Temporary\\\') AND job_type in(\\\'NB\\\',\\\'A1\\\'); $order=c_o_issue_date,job_number.`,\n    "",\n    "## Counts",',
    "notes endpoint and query section"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,',
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,\n    `- Skipped as prior DOB/CO identifier duplicates: ${rejectionCounts.existing_legacy_co_or_job_identifier || 0}`,\n    `- Skipped because outside legacy-preferred CO period: ${rejectionCounts.legacy_post_dob_now_coverage_period || 0}`,\n    `- Skipped below high-signal selection threshold: ${rejectionCounts.legacy_below_high_signal_threshold || 0}`,',
    "notes skipped duplicate counts"
  );
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,\n    `- Round308 screened: ${validation.checks.required_round308_screened}`,\n    `- Round313 screened: ${validation.checks.required_round313_screened}`,\n    `- Round318 screened: ${validation.checks.required_round318_screened}`,\n    `- Round322 screened: ${validation.checks.required_round322_screened}`,\n    `- Round326 screened: ${validation.checks.required_round326_screened}`,\n    `- Round330 screened: ${validation.checks.required_round330_screened}`,\n    `- Round335 screened: ${validation.checks.required_round335_screened}`,\n    `- Round339 screened: ${validation.checks.required_round339_screened}`,\n    `- Round344 screened: ${validation.checks.required_round344_screened}`,\n    `- Round349 screened: ${validation.checks.required_round349_screened}`,\n    `- Round356 screened: ${validation.checks.required_round356_screened}`,',
    "Round308 through Round356 validation report lines"
  );
  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round360_nyc_dob_co_next37", "Round360 output path");
  assertContains(transformed, "Round360 NYC DOB CO Next37 Candidate Pack", "Round360 notes title");
  assertContains(transformed, "nyc_dob_co_round360_legacy_", "Round360 candidate ID prefix");
  assertContains(transformed, REQUIRED_ROUND356_FILE, "Round356 screened file");
  assertContains(transformed, "through round356", "duplicate-screening text through Round356");
  assertContains(transformed, "required_round356_screened", "Round356 validation result");
  assertContains(transformed, "accessed_at: ACCESSED_AT", "source audit accessed_at");
  assertContains(transformed, "confidence: \"documented\"", "source audit confidence");
  assertContains(transformed, "transformation_method: \"Round360 queried", "Round360 source audit transformation method");
  assertContains(transformed, "scripts/fetch_round360_nyc_dob_co_next37_candidates.js standalone validation artifact", "Round360 validator label");
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
    throw new Error("Transformed Round360 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
