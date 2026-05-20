const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_ROUND457_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round457_london_pld_lifecycle_next64_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, and round457";

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round460 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round460 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound457Script(source) {
  let transformed = source
    .replace(/round457_london_pld_lifecycle_next64/g, "round460_london_pld_lifecycle_next65")
    .replace(/round457\.london_pld_lifecycle_next64/g, "round460.london_pld_lifecycle_next65")
    .replace(/Bims5Round457PldLifecycleNext64/g, "Bims5Round460PldLifecycleNext65")
    .replace(/Round 457/g, "Round 460")
    .replace(/Round457/g, "Round460")
    .replace(/round457/g, "round460")
    .replace(/next64/g, "next65")
    .replace(/MAX_PRIOR_ROUND = 451/g, "MAX_PRIOR_ROUND = 457")
    .replace(/through round451/g, "through round457")
    .replace(/packRound\(entry\.name\) > 451/g, "packRound(entry.name) > 457")
    .replace(/\.replace\(\/round276\/g, "round451"\);/g, '.replace(/round276/g, "round457");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    '  "round436_london_pld_lifecycle_next59",\\\\n  "round439_london_pld_lifecycle_next60",\\\\n  "round444_london_pld_lifecycle_next61",\\\\n  "round448_london_pld_lifecycle_next62",\\\\n  "round451_london_pld_lifecycle_next63"\\\\n];',
    '  "round436_london_pld_lifecycle_next59",\\\\n  "round439_london_pld_lifecycle_next60",\\\\n  "round444_london_pld_lifecycle_next61",\\\\n  "round448_london_pld_lifecycle_next62",\\\\n  "round451_london_pld_lifecycle_next63",\\\\n  "round457_london_pld_lifecycle_next64"\\\\n];',
    "round457 prior pack insertion"
  );

  transformed = replaceRequired(
    transformed,
    '        \'  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");\'',
    [
      '        \'  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");\',',
      '        \'  assertContains(transformed, "round457_london_pld_lifecycle_next64", "round457 prior pack");\''
    ].join("\n"),
    "round457 prior pack assertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round451_london_pld_lifecycle_next63" && pack\.exists === true/,
      'pack) => pack.label === "round457_london_pld_lifecycle_next64" && pack.exists === true'
    )
    .replace(/round451 prior PLD lifecycle pack was scanned/g, "round457 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round460_london_pld_lifecycle_next65";', "round name");
  assertContains(transformed, 'const ROUND = "round460";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 457", "prior cutoff");
  assertContains(transformed, "through round457", "dedupe cutoff text");
  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");
  assertContains(transformed, "round448_london_pld_lifecycle_next62", "round448 prior pack");
  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");
  assertContains(transformed, "round457_london_pld_lifecycle_next64", "round457 prior pack");
  assertContains(transformed, 'category: candidate.category || "built_environment"', "category alias");
  assertContains(transformed, 'layer: candidate.layer || "built_environment"', "layer alias");
  assertContains(transformed, "planning/development/lifecycle", "bucket alias");
  assertContains(transformed, "addRound460RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round460_london_pld_lifecycle_next65"', "validator round name");
  assertContains(transformed, "round460_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(BASE_ROUND457_SCRIPT, "utf8");
  const transformed = transformRound457Script(source);
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
    filename: "generated_round460_london_pld_lifecycle_next65_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
