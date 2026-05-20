const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND557_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round557_london_pld_lifecycle_next89_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, and round557";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round562 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function transformRound557Wrapper(source) {
  let transformed = source
    .replace(/round557_london_pld_lifecycle_next89/g, "round562_london_pld_lifecycle_next90")
    .replace(/round557\.london_pld_lifecycle_next89/g, "round562.london_pld_lifecycle_next90")
    .replace(/Bims5Round557PldLifecycleNext89/g, "Bims5Round562PldLifecycleNext90")
    .replace(/Round 557/g, "Round 562")
    .replace(/Round557/g, "Round562")
    .replace(/round557/g, "round562")
    .replace(/next89/g, "next90")
    .replace(/MAX_PRIOR_ROUND = 552/g, "MAX_PRIOR_ROUND = 557")
    .replace(/through round552/g, "through round557")
    .replace(/packRound\(entry\.name\) > 552/g, "packRound(entry.name) > 557")
    .replace(/\.replace\(\/round276\/g, "round552"\);/g, '.replace(/round276/g, "round557");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = transformed
    .replace(
      String.raw`  "round552_london_pld_lifecycle_next88"\\\\\\\\n];`,
      String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89"\\\\\\\\n];`
    )
    .replace(
      /pack\) => pack\.label === "round552_london_pld_lifecycle_next88" && pack\.exists === true/g,
      'pack) => pack.label === "round557_london_pld_lifecycle_next89" && pack.exists === true'
    )
    .replace(/round552 prior PLD lifecycle pack was scanned/g, "round557 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round562_london_pld_lifecycle_next90";', "round name");
  assertContains(transformed, 'const ROUND = "round562";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 557", "prior cutoff");
  assertContains(transformed, "through round557", "dedupe cutoff text");
  assertContains(transformed, "round552_london_pld_lifecycle_next88", "round552 prior pack");
  assertContains(transformed, "round557_london_pld_lifecycle_next89", "round557 prior pack");
  assertContains(transformed, "addRound562RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round562_london_pld_lifecycle_next90"', "validator round name");
  assertContains(transformed, "round562_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND557_WRAPPER, "utf8");
  const transformed = transformRound557Wrapper(source);
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
    filename: "generated_round562_london_pld_lifecycle_next90_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
