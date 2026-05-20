const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round247_nyc_dob_co_next16_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round250_nyc_dob_co_next17_candidates.generated.js";

const REQUIRED_SCREENED_BLOCK = `const REQUIRED_SCREENED_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"
];`;

const ROUND250_SCREENED_BLOCK = `const REQUIRED_SCREENED_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",
  "tmp/subagents/round247_nyc_dob_co_next16/candidates.json"
];`;

const DUPLICATE_BLOCK = `const duplicateNeedle = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json"\\n];';
  const duplicateReplacement = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",\\n  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"\\n];';
  if (!transformed.includes(duplicateNeedle)) {
    throw new Error("Template duplicate-file block did not match expected round232 tail.");
  }
  transformed = transformed.replace(duplicateNeedle, duplicateReplacement);`;

const ROUND250_DUPLICATE_BLOCK = `const duplicateNeedle = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json"\\n];';
  const duplicateReplacement = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",\\n  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",\\n  "tmp/subagents/round247_nyc_dob_co_next16/candidates.json"\\n];';
  if (!transformed.includes(duplicateNeedle)) {
    throw new Error("Template duplicate-file block did not match expected round232 tail.");
  }
  transformed = transformed.replace(duplicateNeedle, duplicateReplacement);`;

const PRIOR_ROUNDS = "117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219|225|232|242|247";
const CO_ROUNDS = "160|164|169|175|181|187|193|199|205|211|219|225|232|242|247";
const NEXT_ROUNDS = "2|3|4|5|6|7|8|9|10|11|12|13|14|15|16";

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label} expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceRegexOnce(source, pattern, replacement, label) {
  const matches = source.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(`${label} expected one match, found ${matches.length}`);
  }
  return source.replace(pattern, replacement);
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Transformed template is missing ${label}`);
  }
}

function transformRound247Wrapper(source) {
  let transformed = source
    .replaceAll("round247", "round250")
    .replaceAll("Round247", "Round250")
    .replaceAll("next16", "next17")
    .replaceAll("Next16", "Next17")
    .replaceAll("through round242", "through round247")
    .replaceAll("225, 232, and 242", "225, 232, 242, and 247")
    .replaceAll("\"232\", \"242\"]", "\"232\", \"242\", \"247\"]");

  transformed = replaceOnce(
    transformed,
    REQUIRED_SCREENED_BLOCK,
    ROUND250_SCREENED_BLOCK,
    "round250 required screened files"
  );

  transformed = replaceRegexOnce(
    transformed,
    /"const PRIOR_DOB_ROUND_PATTERN = [^"]+\\n"/g,
    `"const PRIOR_DOB_ROUND_PATTERN = /round(${PRIOR_ROUNDS}).*nyc.*(dob|co)|nyc.*(dob|co).*round(${PRIOR_ROUNDS})/i;\\n"`,
    "prior DOB round pattern replacement string"
  );

  transformed = replaceOnce(
    transformed,
    DUPLICATE_BLOCK,
    ROUND250_DUPLICATE_BLOCK,
    "round250 duplicate file insertion block"
  );

  transformed = replaceRegexOnce(
    transformed,
    /"\/round\([^"]+_nyc_dob_co_next\([^"]+\/i"/g,
    `"/round(${CO_ROUNDS})_nyc_dob_co_next(${NEXT_ROUNDS})/i"`,
    "candidateFilesToScreen CO round replacement string"
  );

  transformed = replaceRegexOnce(
    transformed,
    /\nmain\(\)\.catch\(\(error\) => \{\n  console\.error\(error\);\n  process\.exit\(1\);\n\}\);\s*$/g,
    "\nmodule.exports = { main };\n",
    "outer main invocation"
  );

  assertContains(transformed, "round250_nyc_dob_co_next17", "round250 output path");
  assertContains(transformed, "tmp/subagents/round247_nyc_dob_co_next16/candidates.json", "round247 screening file");
  assertContains(transformed, `round(${PRIOR_ROUNDS}).*nyc.*(dob|co)`, "prior round regex including round247");
  assertContains(transformed, `round(${CO_ROUNDS})_nyc_dob_co_next(${NEXT_ROUNDS})`, "CO round regex including round247");
  assertContains(transformed, "including rounds 225, 232, 242, and 247", "notes validation caveat");
  assertContains(transformed, "scripts/fetch_round250_nyc_dob_co_next17_candidates.js independent post-generation validator", "round250 validator label");

  return transformed;
}

async function main() {
  const source = transformRound247Wrapper(fs.readFileSync(TEMPLATE_PATH, "utf8"));
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
    throw new Error("Transformed round250 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
