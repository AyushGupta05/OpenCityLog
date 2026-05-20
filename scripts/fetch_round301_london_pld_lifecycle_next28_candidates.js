const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND_NAME = "round301_london_pld_lifecycle_next28";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const BASE_FETCH_SCRIPT = path.join(ROOT, "scripts", "fetch_round284_london_pld_lifecycle_next25_candidates.js");
const BASE_VALIDATOR = path.join(
  ROOT,
  "tmp",
  "subagents",
  "round284_london_pld_lifecycle_next25",
  "validate_round284_pack.js"
);

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round301 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound284Fetch(source) {
  let transformed = source
    .replace(/const ROUND = "round284";/, 'const ROUND = "round301";')
    .replace(
      /const ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const ROUND_NAME = "round301_london_pld_lifecycle_next28";'
    )
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 298;")
    .replace(/Bims5Round284PldLifecycleNext25/g, "Bims5Round301PldLifecycleNext28")
    .replace(/round284_london_pld_lifecycle_next25/g, "round301_london_pld_lifecycle_next28")
    .replace(/round284\.london_pld_lifecycle_next25/g, "round301.london_pld_lifecycle_next28")
    .replace(/Round284/g, "Round301")
    .replace(/Round 284/g, "Round 301")
    .replace(/round284/g, "round301")
    .replace(/next25/g, "next28")
    .replace(/through round276/g, "through round298")
    .replace(
      /round272, and round276/g,
      "round272, round276, round284, round288, and round298"
    );

  transformed = transformed.replace(
    /  "round276_london_pld_lifecycle_next24"\n\];/,
    '  "round276_london_pld_lifecycle_next24",\n  "round284_london_pld_lifecycle_next25",\n  "round288_london_pld_lifecycle_next26",\n  "round298_london_pld_lifecycle_next27"\n];'
  );

  transformed = transformed.replace(
    /main\(\)\.catch\(\(error\) => \{\s+console\.error\(error\);\s+process\.exit\(1\);\s+\}\);\s*$/,
    "module.exports = main;\n"
  );

  assertContains(transformed, 'const ROUND = "round301";', "round id");
  assertContains(transformed, "round284_london_pld_lifecycle_next25", "prior round284 pack");
  assertContains(transformed, "round288_london_pld_lifecycle_next26", "prior round288 pack");
  assertContains(transformed, "round298_london_pld_lifecycle_next27", "prior round298 pack");
  assertContains(transformed, "through round298", "dedupe cutoff");
  assertContains(transformed, "module.exports = main;", "exported main");
  return transformed;
}

function transformRound284Validator(source) {
  const transformed = source
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 298;")
    .replace(
      /const CURRENT_ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const CURRENT_ROUND_NAME = "round301_london_pld_lifecycle_next28";'
    )
    .replace(/round284_london_pld_lifecycle_next25/g, "round301_london_pld_lifecycle_next28")
    .replace(/round284/g, "round301")
    .replace(/round284:/g, "round301:")
    .replace(/round276/g, "round298");

  assertContains(transformed, "MAX_PRIOR_ROUND = 298", "validator cutoff");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round301_london_pld_lifecycle_next28"', "validator current round");
  assertContains(transformed, "validation_report.json", "validation report writer");
  return transformed;
}

async function runTransformedFetch() {
  const source = fs.readFileSync(BASE_FETCH_SCRIPT, "utf8");
  const transformed = transformRound284Fetch(source);
  const sandboxModule = { exports: {} };
  const sandbox = {
    require,
    console,
    process,
    fetch,
    __dirname,
    module: sandboxModule,
    exports: sandboxModule.exports
  };
  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_round301_london_pld_lifecycle_next28_candidates.js"
  });
  if (typeof sandboxModule.exports !== "function") {
    throw new Error("Round301 transform did not export the fetch main() function.");
  }
  await sandboxModule.exports();
}

function writeValidator() {
  const validatorSource = fs.readFileSync(BASE_VALIDATOR, "utf8");
  const transformed = transformRound284Validator(validatorSource);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "validate_round301_pack.js"), transformed);
}

async function main() {
  writeValidator();
  await runTransformedFetch();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
