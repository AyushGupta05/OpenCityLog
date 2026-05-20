const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND529_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round529_london_pld_lifecycle_next82_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, and round534";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round537 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round537 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound529Wrapper(source) {
  let transformed = source
    .replace(/round529_london_pld_lifecycle_next82/g, "round537_london_pld_lifecycle_next84")
    .replace(/round529\.london_pld_lifecycle_next82/g, "round537.london_pld_lifecycle_next84")
    .replace(/Bims5Round529PldLifecycleNext82/g, "Bims5Round537PldLifecycleNext84")
    .replace(/Round 529/g, "Round 537")
    .replace(/Round529/g, "Round537")
    .replace(/round529/g, "round537")
    .replace(/next82/g, "next84")
    .replace(/MAX_PRIOR_ROUND = 526/g, "MAX_PRIOR_ROUND = 534")
    .replace(/through round526/g, "through round534")
    .replace(/packRound\(entry\.name\) > 526/g, "packRound(entry.name) > 534")
    .replace(/\.replace\(\/round276\/g, "round526"\);/g, '.replace(/round276/g, "round534");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round488_london_pld_lifecycle_next72",\\\\\\\\n  "round490_london_pld_lifecycle_next73",\\\\\\\\n  "round496_london_pld_lifecycle_next74",\\\\\\\\n  "round500_london_pld_lifecycle_next75",\\\\\\\\n  "round504_london_pld_lifecycle_next76",\\\\\\\\n  "round508_london_pld_lifecycle_next77",\\\\\\\\n  "round512_london_pld_lifecycle_next78",\\\\\\\\n  "round517_london_pld_lifecycle_next79",\\\\\\\\n  "round522_london_pld_lifecycle_next80",\\\\\\\\n  "round526_london_pld_lifecycle_next81"\\\\\\\\n];`,
    String.raw`  "round488_london_pld_lifecycle_next72",\\\\\\\\n  "round490_london_pld_lifecycle_next73",\\\\\\\\n  "round496_london_pld_lifecycle_next74",\\\\\\\\n  "round500_london_pld_lifecycle_next75",\\\\\\\\n  "round504_london_pld_lifecycle_next76",\\\\\\\\n  "round508_london_pld_lifecycle_next77",\\\\\\\\n  "round512_london_pld_lifecycle_next78",\\\\\\\\n  "round517_london_pld_lifecycle_next79",\\\\\\\\n  "round522_london_pld_lifecycle_next80",\\\\\\\\n  "round526_london_pld_lifecycle_next81",\\\\\\\\n  "round529_london_pld_lifecycle_next82",\\\\\\\\n  "round534_london_pld_lifecycle_next83"\\\\\\\\n];`,
    "round529 and round534 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round526_london_pld_lifecycle_next81" && pack\.exists === true/g,
      'pack) => pack.label === "round534_london_pld_lifecycle_next83" && pack.exists === true'
    )
    .replace(/round526 prior PLD lifecycle pack was scanned/g, "round534 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round537_london_pld_lifecycle_next84";', "round name");
  assertContains(transformed, 'const ROUND = "round537";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 534", "prior cutoff");
  assertContains(transformed, "through round534", "dedupe cutoff text");
  assertContains(transformed, "round526_london_pld_lifecycle_next81", "round526 prior pack");
  assertContains(transformed, "round529_london_pld_lifecycle_next82", "round529 prior pack");
  assertContains(transformed, "round534_london_pld_lifecycle_next83", "round534 prior pack");
  assertContains(transformed, "addRound537RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round537_london_pld_lifecycle_next84"', "validator round name");
  assertContains(transformed, "round537_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND529_WRAPPER, "utf8");
  const transformed = transformRound529Wrapper(source);
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
    filename: "generated_round537_london_pld_lifecycle_next84_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
