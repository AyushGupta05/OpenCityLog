const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND570_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round570_london_pld_lifecycle_next92_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, round567, and round570";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round576 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round576 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound570Wrapper(source) {
  let transformed = source
    .replace(/round570_london_pld_lifecycle_next92/g, "round576_london_pld_lifecycle_next93")
    .replace(/round570\.london_pld_lifecycle_next92/g, "round576.london_pld_lifecycle_next93")
    .replace(/Bims5Round570PldLifecycleNext92/g, "Bims5Round576PldLifecycleNext93")
    .replace(/Round 570/g, "Round 576")
    .replace(/Round570/g, "Round576")
    .replace(/round570/g, "round576")
    .replace(/next92/g, "next93")
    .replace(/MAX_PRIOR_ROUND = 567/g, "MAX_PRIOR_ROUND = 570")
    .replace(/through round567/g, "through round570")
    .replace(/packRound\(entry\.name\) > 567/g, "packRound(entry.name) > 570")
    .replace(/\.replace\(\/round276\/g, "round567"\);/g, '.replace(/round276/g, "round570");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92"\\\\\\\\n];`,
    "round570 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round567_london_pld_lifecycle_next91" && pack\.exists === true/g,
      'pack) => pack.label === "round570_london_pld_lifecycle_next92" && pack.exists === true'
    )
    .replace(/round567 prior PLD lifecycle pack was scanned/g, "round570 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round576_london_pld_lifecycle_next93";', "round name");
  assertContains(transformed, 'const ROUND = "round576";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 570", "prior cutoff");
  assertContains(transformed, "through round570", "dedupe cutoff text");
  assertContains(transformed, "round567_london_pld_lifecycle_next91", "round567 prior pack");
  assertContains(transformed, "round570_london_pld_lifecycle_next92", "round570 prior pack");
  assertContains(transformed, "addRound576RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round576_london_pld_lifecycle_next93"', "validator round name");
  assertContains(transformed, "round576_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND570_WRAPPER, "utf8");
  const transformed = transformRound570Wrapper(source);
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
    filename: "generated_round576_london_pld_lifecycle_next93_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
