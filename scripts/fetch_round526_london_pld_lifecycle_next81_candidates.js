const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_ROUND522_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round522_london_pld_lifecycle_next80_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, and round522";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round526 source transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round526 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound522Script(source) {
  let transformed = source
    .replace(/round522_london_pld_lifecycle_next80/g, "round526_london_pld_lifecycle_next81")
    .replace(/round522\.london_pld_lifecycle_next80/g, "round526.london_pld_lifecycle_next81")
    .replace(/Bims5Round522PldLifecycleNext80/g, "Bims5Round526PldLifecycleNext81")
    .replace(/Round 522/g, "Round 526")
    .replace(/Round522/g, "Round526")
    .replace(/round522/g, "round526")
    .replace(/next80/g, "next81")
    .replace(/MAX_PRIOR_ROUND = 517/g, "MAX_PRIOR_ROUND = 522")
    .replace(/through round517/g, "through round522")
    .replace(/packRound\(entry\.name\) > 517/g, "packRound(entry.name) > 522")
    .replace(/\.replace\(\/round276\/g, "round517"\);/g, '.replace(/round276/g, "round522");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65",\\\\\\\\n  "round467_london_pld_lifecycle_next66",\\\\\\\\n  "round469_london_pld_lifecycle_next67",\\\\\\\\n  "round474_london_pld_lifecycle_next68",\\\\\\\\n  "round478_london_pld_lifecycle_next69",\\\\\\\\n  "round481_london_pld_lifecycle_next70",\\\\\\\\n  "round485_london_pld_lifecycle_next71",\\\\\\\\n  "round488_london_pld_lifecycle_next72",\\\\\\\\n  "round490_london_pld_lifecycle_next73",\\\\\\\\n  "round496_london_pld_lifecycle_next74",\\\\\\\\n  "round500_london_pld_lifecycle_next75",\\\\\\\\n  "round504_london_pld_lifecycle_next76",\\\\\\\\n  "round508_london_pld_lifecycle_next77",\\\\\\\\n  "round512_london_pld_lifecycle_next78",\\\\\\\\n  "round517_london_pld_lifecycle_next79"\\\\\\\\n];`,
    String.raw`  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65",\\\\\\\\n  "round467_london_pld_lifecycle_next66",\\\\\\\\n  "round469_london_pld_lifecycle_next67",\\\\\\\\n  "round474_london_pld_lifecycle_next68",\\\\\\\\n  "round478_london_pld_lifecycle_next69",\\\\\\\\n  "round481_london_pld_lifecycle_next70",\\\\\\\\n  "round485_london_pld_lifecycle_next71",\\\\\\\\n  "round488_london_pld_lifecycle_next72",\\\\\\\\n  "round490_london_pld_lifecycle_next73",\\\\\\\\n  "round496_london_pld_lifecycle_next74",\\\\\\\\n  "round500_london_pld_lifecycle_next75",\\\\\\\\n  "round504_london_pld_lifecycle_next76",\\\\\\\\n  "round508_london_pld_lifecycle_next77",\\\\\\\\n  "round512_london_pld_lifecycle_next78",\\\\\\\\n  "round517_london_pld_lifecycle_next79",\\\\\\\\n  "round522_london_pld_lifecycle_next80"\\\\\\\\n];`,
    "round522 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round517_london_pld_lifecycle_next79" && pack\.exists === true/g,
      'pack) => pack.label === "round522_london_pld_lifecycle_next80" && pack.exists === true'
    )
    .replace(/round517 prior PLD lifecycle pack was scanned/g, "round522 prior PLD lifecycle pack was scanned");

  transformed = replaceRequired(
    transformed,
    '  assertContains(transformed, "round517_london_pld_lifecycle_next79", "round517 prior pack");',
    [
      '  assertContains(transformed, "round517_london_pld_lifecycle_next79", "round517 prior pack");',
      '  assertContains(transformed, "round522_london_pld_lifecycle_next80", "round522 prior pack");'
    ].join("\n"),
    "round522 prior pack assertion"
  );

  assertContains(transformed, 'const ROUND_NAME = "round526_london_pld_lifecycle_next81";', "round name");
  assertContains(transformed, 'const ROUND = "round526";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 522", "prior cutoff");
  assertContains(transformed, "through round522", "dedupe cutoff text");
  assertContains(transformed, "round517_london_pld_lifecycle_next79", "round517 prior pack");
  assertContains(transformed, "round522_london_pld_lifecycle_next80", "round522 prior pack");
  assertContains(transformed, 'category: candidate.category || "built_environment"', "category alias");
  assertContains(transformed, 'layer: candidate.layer || "built_environment"', "layer alias");
  assertContains(transformed, "planning/development/lifecycle", "bucket alias");
  assertContains(transformed, "addRound526RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round526_london_pld_lifecycle_next81"', "validator round name");
  assertContains(transformed, "round526_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "addRound526SourceRowRefs", "source row ref postprocess");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  if (!fs.existsSync(BASE_ROUND522_SCRIPT)) {
    throw new Error(`Missing prior worker script: ${BASE_ROUND522_SCRIPT}`);
  }

  const source = fs.readFileSync(BASE_ROUND522_SCRIPT, "utf8");
  const transformed = transformRound522Script(source);
  const sandbox = {
    require,
    console,
    process,
    fetch,
    setTimeout,
    clearTimeout,
    __dirname,
    module: { exports: {} },
    exports: {}
  };

  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_round526_london_pld_lifecycle_next81_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
