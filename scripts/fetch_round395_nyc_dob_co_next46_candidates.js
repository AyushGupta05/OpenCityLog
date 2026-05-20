const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round308_nyc_dob_co_next26_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round395_nyc_dob_co_next46_candidates.generated.js";
const ROUND = "round395";
const ROUND_TITLE = "Round395";
const NEXT_LABEL = "next46";
const NEXT_TITLE = "Next46";

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
  "tmp/subagents/round389_nyc_dob_co_next45/candidates.json"
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
  "389"
];

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

function roundFromCandidateFile(file) {
  const match = file.match(/round(\d+)_/);
  if (!match) throw new Error(`Could not parse round from ${file}`);
  return match[1];
}

function transformRound308Source(source) {
  let transformed = source.replace(/\r\n/g, "\n")
    .replaceAll("round308", ROUND)
    .replaceAll("Round308", ROUND_TITLE)
    .replaceAll("next26", NEXT_LABEL)
    .replaceAll("Next26", NEXT_TITLE)
    .replaceAll("through round303", "through round389");

  const round303File = '"tmp/subagents/round303_nyc_dob_co_next25/candidates.json"';
  const priorRoundFiles = [
    round303File,
    ...ADDITIONAL_DOB_CO_FILES.map((file) => `"${file}"`)
  ].join(",\n  ");

  transformed = replaceFirst(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "explicit duplicate files through Round389"
  );
  transformed = replaceOnce(
    transformed,
    `${round303File}\n];`,
    `${priorRoundFiles}\n];`,
    "required screened files through Round389"
  );

  const screenedRoundsReplacement = [
    '  "300"',
    '  "303"',
    ...ADDITIONAL_SCREENED_ROUNDS.map((round) => `  "${round}"`)
  ].join(",\n");
  transformed = replaceOnce(
    transformed,
    '  "300",\n  "303"\n];',
    `${screenedRoundsReplacement}\n];`,
    "screened rounds include Round308 through Round389"
  );

  const additionalValidationChecks = ADDITIONAL_DOB_CO_FILES
    .map((file) => {
      const round = roundFromCandidateFile(file);
      return `      required_round${round}_screened: duplicateIndex.files.includes("${file}"),`;
    })
    .join("\n");
  transformed = replaceOnce(
    transformed,
    '      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),',
    `      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),\n${additionalValidationChecks}`,
    "validation check fields through Round389"
  );

  transformed = replaceOnce(
    transformed,
    "  const sourceAuditEntry = {\n    ...metadata,\n    reliability:",
    `  const sourceAuditEntry = {\n    ...metadata,\n    accessed_at: ACCESSED_AT,\n    confidence: "documented",\n    method: "${ROUND_TITLE} queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.",\n    transformation_method: "${ROUND_TITLE} queried the official NYC Open Data legacy DOB Certificate Of Occupancy API, filtered and grouped issued rows, screened duplicates, and retained row-level provenance.",\n    limitations: "Legacy CO issuance is an administrative/legal DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome. Coordinates are DOB/Open Data geocoded address points.",\n    reliability:`,
    "source audit provenance fields"
  );

  transformed = replaceOnce(
    transformed,
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Counts",',
    '    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset\'s stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,\n    "",\n    "## Endpoint and Query",\n    "",\n    `- Endpoint: ${LEGACY_CO.api}`,\n    `- Metadata endpoint: ${LEGACY_CO.metadata}`,\n    `- Socrata query: $select=${LEGACY_SELECT.join(",")},:id; $where=c_o_issue_date between \'${START_DATE}T00:00:00\' and \'${END_DATE}T23:59:59\' AND latitude IS NOT NULL AND longitude IS NOT NULL AND application_status_raw=\'Issued\' AND issue_type in(\'Final\',\'Temporary\') AND job_type in(\'NB\',\'A1\'); $order=c_o_issue_date,job_number.`,\n    "",\n    "## Counts",',
    "notes endpoint and query section"
  );

  transformed = replaceOnce(
    transformed,
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,',
    '    `- Duplicate/reject samples recorded: ${rejectedTotal}`,\n    `- Skipped as prior DOB/CO identifier duplicates: ${rejectionCounts.existing_legacy_co_or_job_identifier || 0}`,\n    `- Skipped because outside legacy-preferred CO period: ${rejectionCounts.legacy_post_dob_now_coverage_period || 0}`,\n    `- Skipped below high-signal selection threshold: ${rejectionCounts.legacy_below_high_signal_threshold || 0}`,',
    "notes skipped duplicate counts"
  );

  const additionalReportLines = ADDITIONAL_SCREENED_ROUNDS
    .map((round) => `    \`- Round${round} screened: \${validation.checks.required_round${round}_screened}\`,`)
    .join("\n");
  transformed = replaceOnce(
    transformed,
    '    `- Round303 screened: ${validation.checks.required_round303_screened}`,',
    `    \`- Round303 screened: \${validation.checks.required_round303_screened}\`,\n${additionalReportLines}`,
    "validation report lines through Round389"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "outer main invocation"
  );

  assertContains(transformed, "round395_nyc_dob_co_next46", "Round395 output path");
  assertContains(transformed, "Round395 NYC DOB CO Next46 Candidate Pack", "Round395 notes title");
  assertContains(transformed, "nyc_dob_co_round395_legacy_", "Round395 candidate ID prefix");
  assertContains(transformed, "tmp/subagents/round389_nyc_dob_co_next45/candidates.json", "Round389 screened file");
  assertContains(transformed, "through round389", "duplicate-screening text through Round389");
  assertContains(transformed, "required_round389_screened", "Round389 validation result");
  assertContains(transformed, "accessed_at: ACCESSED_AT", "source audit accessed_at");
  assertContains(transformed, 'confidence: "documented"', "source audit confidence");
  assertContains(transformed, `transformation_method: "${ROUND_TITLE} queried`, "Round395 source audit transformation method");
  assertContains(transformed, "scripts/fetch_round395_nyc_dob_co_next46_candidates.js standalone validation artifact", "Round395 validator label");
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
    throw new Error("Transformed Round395 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
