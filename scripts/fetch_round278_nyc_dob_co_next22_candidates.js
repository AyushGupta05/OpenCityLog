const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round247_nyc_dob_co_next16_candidates.js");
const GENERATED_FILENAME = "scripts/fetch_round278_nyc_dob_co_next22_candidates.generated.js";
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";

const REQUIRED_SCREENED_BLOCK = `const REQUIRED_SCREENED_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"
];`;

const ROUND278_SCREENED_BLOCK = `const REQUIRED_SCREENED_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",
  "tmp/subagents/round247_nyc_dob_co_next16/candidates.json",
  "tmp/subagents/round250_nyc_dob_co_next17/candidates.json",
  "tmp/subagents/round256_nyc_dob_co_next18/candidates.json",
  "tmp/subagents/round264_nyc_dob_co_next19/candidates.json",
  "tmp/subagents/round267_nyc_dob_co_next20/candidates.json",
  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json"
];`;

const DUPLICATE_BLOCK = `const duplicateNeedle = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json"\\n];';
  const duplicateReplacement = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",\\n  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json"\\n];';
  if (!transformed.includes(duplicateNeedle)) {
    throw new Error("Template duplicate-file block did not match expected round232 tail.");
  }
  transformed = transformed.replace(duplicateNeedle, duplicateReplacement);`;

const ROUND278_DUPLICATE_BLOCK = `const duplicateNeedle = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json"\\n];';
  const duplicateReplacement = '  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",\\n  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",\\n  "tmp/subagents/round247_nyc_dob_co_next16/candidates.json",\\n  "tmp/subagents/round250_nyc_dob_co_next17/candidates.json",\\n  "tmp/subagents/round256_nyc_dob_co_next18/candidates.json",\\n  "tmp/subagents/round264_nyc_dob_co_next19/candidates.json",\\n  "tmp/subagents/round267_nyc_dob_co_next20/candidates.json",\\n  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json"\\n];';
  if (!transformed.includes(duplicateNeedle)) {
    throw new Error("Template duplicate-file block did not match expected round232 tail.");
  }
  transformed = transformed.replace(duplicateNeedle, duplicateReplacement);`;

const PRIOR_ROUNDS = "117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219|225|232|242|247|250|256|264|267|273";
const CO_ROUNDS = "160|164|169|175|181|187|193|199|205|211|219|225|232|242|247|250|256|264|267|273";
const NEXT_ROUNDS = "2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21";

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
  source = source.replace(/\r\n/g, "\n");
  let transformed = source
    .replaceAll('const ACCESSED_AT = "2026-05-19";', `const ACCESSED_AT = "${ACCESSED_AT}";`)
    .replaceAll('const GENERATED_AT = "2026-05-19T00:00:00Z";', `const GENERATED_AT = "${GENERATED_AT}";`)
    .replaceAll("round247", "round278")
    .replaceAll("Round247", "Round278")
    .replaceAll("next16", "next22")
    .replaceAll("Next16", "Next22")
    .replaceAll("through round242", "through round273")
    .replaceAll("225, 232, and 242", "225, 232, 242, 247, 250, 256, 264, 267, and 273")
    .replaceAll("219, 225, 232, and 242", "219, 225, 232, 242, 247, 250, 256, 264, 267, and 273")
    .replaceAll("\"232\", \"242\"]", "\"232\", \"242\", \"247\", \"250\", \"256\", \"264\", \"267\", \"273\"]");

  transformed = replaceOnce(
    transformed,
    "function transformTemplate(source) {\n  let transformed = source",
    `function transformTemplate(source) {
  source = source.replace(/\\r\\n/g, "\\n");
  source = source
    .replaceAll('const ACCESSED_AT = "2026-05-19";', 'const ACCESSED_AT = "${ACCESSED_AT}";')
    .replaceAll('const GENERATED_AT = "2026-05-19T00:00:00Z";', 'const GENERATED_AT = "${GENERATED_AT}";');
  let transformed = source`,
    "round278 template date injection"
  );

  transformed = replaceOnce(
    transformed,
    REQUIRED_SCREENED_BLOCK,
    ROUND278_SCREENED_BLOCK,
    "round278 required screened files"
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
    ROUND278_DUPLICATE_BLOCK,
    "round278 duplicate file insertion block"
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

  assertContains(transformed, `const ACCESSED_AT = "${ACCESSED_AT}";`, "round278 accessed_at");
  assertContains(transformed, `const GENERATED_AT = "${GENERATED_AT}";`, "round278 generated_at");
  assertContains(transformed, "round278_nyc_dob_co_next22", "round278 output path");
  assertContains(transformed, "tmp/subagents/round247_nyc_dob_co_next16/candidates.json", "round247 screening file");
  assertContains(transformed, "tmp/subagents/round250_nyc_dob_co_next17/candidates.json", "round250 screening file");
  assertContains(transformed, "tmp/subagents/round256_nyc_dob_co_next18/candidates.json", "round256 screening file");
  assertContains(transformed, "tmp/subagents/round264_nyc_dob_co_next19/candidates.json", "round264 screening file");
  assertContains(transformed, "tmp/subagents/round267_nyc_dob_co_next20/candidates.json", "round267 screening file");
  assertContains(transformed, "tmp/subagents/round273_nyc_dob_co_next21/candidates.json", "round273 screening file");
  assertContains(transformed, `round(${PRIOR_ROUNDS}).*nyc.*(dob|co)`, "prior round regex including round273");
  assertContains(transformed, `round(${CO_ROUNDS})_nyc_dob_co_next(${NEXT_ROUNDS})`, "CO round regex including round273");
  assertContains(transformed, "including rounds 225, 232, 242, 247, 250, 256, 264, 267, and 273", "notes validation caveat");
  assertContains(transformed, "scripts/fetch_round278_nyc_dob_co_next22_candidates.js independent post-generation validator", "round278 validator label");

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
    throw new Error("Transformed round278 wrapper did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
