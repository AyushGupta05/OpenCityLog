const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_ROUND467_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round467_london_pld_lifecycle_next66_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, and round478";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round481 source transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round481 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound467Script(source) {
  let transformed = source
    .replace(/round467_london_pld_lifecycle_next66/g, "round481_london_pld_lifecycle_next70")
    .replace(/round467\.london_pld_lifecycle_next66/g, "round481.london_pld_lifecycle_next70")
    .replace(/Bims5Round467PldLifecycleNext66/g, "Bims5Round481PldLifecycleNext70")
    .replace(/Round 467/g, "Round 481")
    .replace(/Round467/g, "Round481")
    .replace(/round467/g, "round481")
    .replace(/next66/g, "next70")
    .replace(/MAX_PRIOR_ROUND = 460/g, "MAX_PRIOR_ROUND = 478")
    .replace(/through round460/g, "through round478")
    .replace(/packRound\(entry\.name\) > 460/g, "packRound(entry.name) > 478")
    .replace(/\.replace\(\/round276\/g, "round460"\);/g, '.replace(/round276/g, "round478");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    '  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65"\\\\\\\\n];',
    '  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65",\\\\\\\\n  "round467_london_pld_lifecycle_next66",\\\\\\\\n  "round469_london_pld_lifecycle_next67",\\\\\\\\n  "round474_london_pld_lifecycle_next68",\\\\\\\\n  "round478_london_pld_lifecycle_next69"\\\\\\\\n];',
    "round467, round469, round474, and round478 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round460_london_pld_lifecycle_next65" && pack\.exists === true/g,
      'pack) => pack.label === "round478_london_pld_lifecycle_next69" && pack.exists === true'
    )
    .replace(/round460 prior PLD lifecycle pack was scanned/g, "round478 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round481_london_pld_lifecycle_next70";', "round name");
  assertContains(transformed, 'const ROUND = "round481";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 478", "prior cutoff");
  assertContains(transformed, "through round478", "dedupe cutoff text");
  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");
  assertContains(transformed, "round448_london_pld_lifecycle_next62", "round448 prior pack");
  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");
  assertContains(transformed, "round457_london_pld_lifecycle_next64", "round457 prior pack");
  assertContains(transformed, "round460_london_pld_lifecycle_next65", "round460 prior pack");
  assertContains(transformed, "round467_london_pld_lifecycle_next66", "round467 prior pack");
  assertContains(transformed, "round469_london_pld_lifecycle_next67", "round469 prior pack");
  assertContains(transformed, "round474_london_pld_lifecycle_next68", "round474 prior pack");
  assertContains(transformed, "round478_london_pld_lifecycle_next69", "round478 prior pack");
  assertContains(transformed, 'category: candidate.category || "built_environment"', "category alias");
  assertContains(transformed, 'layer: candidate.layer || "built_environment"', "layer alias");
  assertContains(transformed, "planning/development/lifecycle", "bucket alias");
  assertContains(transformed, "addRound481RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round481_london_pld_lifecycle_next70"', "validator round name");
  assertContains(transformed, "round481_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(BASE_ROUND467_SCRIPT, "utf8");
  const transformed = transformRound467Script(source);
  const sandbox = {
    require,
    console,
    process,
    fetch,
    __dirname,
    module: { exports: {} },
    exports: {}
  };

  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_round481_london_pld_lifecycle_next70_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
