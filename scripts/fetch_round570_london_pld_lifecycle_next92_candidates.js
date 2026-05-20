const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND567_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round567_london_pld_lifecycle_next91_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, and round567";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round570 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round570 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound567Wrapper(source) {
  let transformed = source
    .replace(/round567_london_pld_lifecycle_next91/g, "round570_london_pld_lifecycle_next92")
    .replace(/round567\.london_pld_lifecycle_next91/g, "round570.london_pld_lifecycle_next92")
    .replace(/Bims5Round567PldLifecycleNext91/g, "Bims5Round570PldLifecycleNext92")
    .replace(/Round 567/g, "Round 570")
    .replace(/Round567/g, "Round570")
    .replace(/round567/g, "round570")
    .replace(/next91/g, "next92")
    .replace(/MAX_PRIOR_ROUND = 562/g, "MAX_PRIOR_ROUND = 567")
    .replace(/through round562/g, "through round567")
    .replace(/packRound\(entry\.name\) > 562/g, "packRound(entry.name) > 567")
    .replace(/\.replace\(\/round276\/g, "round562"\);/g, '.replace(/round276/g, "round567");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91"\\\\\\\\n];`,
    "round567 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round562_london_pld_lifecycle_next90" && pack\.exists === true/g,
      'pack) => pack.label === "round567_london_pld_lifecycle_next91" && pack.exists === true'
    )
    .replace(/round562 prior PLD lifecycle pack was scanned/g, "round567 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round570_london_pld_lifecycle_next92";', "round name");
  assertContains(transformed, 'const ROUND = "round570";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 567", "prior cutoff");
  assertContains(transformed, "through round567", "dedupe cutoff text");
  assertContains(transformed, "round562_london_pld_lifecycle_next90", "round562 prior pack");
  assertContains(transformed, "round567_london_pld_lifecycle_next91", "round567 prior pack");
  assertContains(transformed, "addRound570RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round570_london_pld_lifecycle_next92"', "validator round name");
  assertContains(transformed, "round570_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND567_WRAPPER, "utf8");
  const transformed = transformRound567Wrapper(source);
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
    filename: "generated_round570_london_pld_lifecycle_next92_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
