const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND579_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round579_london_pld_lifecycle_next94_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, round567, round570, round576, round579, and round584";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round589 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round589 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound579Wrapper(source) {
  let transformed = source
    .replace(/round579_london_pld_lifecycle_next94/g, "round589_london_pld_lifecycle_next96")
    .replace(/round579\.london_pld_lifecycle_next94/g, "round589.london_pld_lifecycle_next96")
    .replace(/Bims5Round579PldLifecycleNext94/g, "Bims5Round589PldLifecycleNext96")
    .replace(/Round 579/g, "Round 589")
    .replace(/Round579/g, "Round589")
    .replace(/round579/g, "round589")
    .replace(/next94/g, "next96")
    .replace(/MAX_PRIOR_ROUND = 576/g, "MAX_PRIOR_ROUND = 584")
    .replace(/through round576/g, "through round584")
    .replace(/packRound\(entry\.name\) > 576/g, "packRound(entry.name) > 584")
    .replace(/\.replace\(\/round276\/g, "round576"\);/g, '.replace(/round276/g, "round584");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95"\\\\\\\\n];`,
    "round579 and round584 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round576_london_pld_lifecycle_next93" && pack\.exists === true/g,
      'pack) => pack.label === "round584_london_pld_lifecycle_next95" && pack.exists === true'
    )
    .replace(/round576 prior PLD lifecycle pack was scanned/g, "round584 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round589_london_pld_lifecycle_next96";', "round name");
  assertContains(transformed, 'const ROUND = "round589";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 584", "prior cutoff");
  assertContains(transformed, "through round584", "dedupe cutoff text");
  assertContains(transformed, "round570_london_pld_lifecycle_next92", "round570 prior pack");
  assertContains(transformed, "round576_london_pld_lifecycle_next93", "round576 prior pack");
  assertContains(transformed, "round579_london_pld_lifecycle_next94", "round579 prior pack");
  assertContains(transformed, "round584_london_pld_lifecycle_next95", "round584 prior pack");
  assertContains(transformed, "addRound589RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round589_london_pld_lifecycle_next96"', "validator round name");
  assertContains(transformed, "round589_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND579_WRAPPER, "utf8");
  const transformed = transformRound579Wrapper(source);
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
    filename: "generated_round589_london_pld_lifecycle_next96_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
