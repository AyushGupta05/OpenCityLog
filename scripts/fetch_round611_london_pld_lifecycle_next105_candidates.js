const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND610_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round610_london_pld_lifecycle_next104_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, round567, round570, round576, round579, round584, round589, round594, round597, round605, round606, round607, round608, round609, and round610";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round611 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round611 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound610Wrapper(source) {
  let transformed = source
    .replace(/round610_london_pld_lifecycle_next104/g, "round611_london_pld_lifecycle_next105")
    .replace(/round610\.london_pld_lifecycle_next104/g, "round611.london_pld_lifecycle_next105")
    .replace(/Bims5Round610PldLifecycleNext104/g, "Bims5Round611PldLifecycleNext105")
    .replace(/Round 610/g, "Round 611")
    .replace(/Round610/g, "Round611")
    .replace(/round610/g, "round611")
    .replace(/next104/g, "next105")
    .replace(/MAX_PRIOR_ROUND = 609/g, "MAX_PRIOR_ROUND = 610")
    .replace(/through round609/g, "through round610")
    .replace(/packRound\(entry\.name\) > 609/g, "packRound(entry.name) > 610")
    .replace(/\.replace\(\/round276\/g, "round609"\);/g, '.replace(/round276/g, "round610");')
    .replace(/round609 prior PLD lifecycle pack was scanned/g, "round610 prior PLD lifecycle pack was scanned")
    .replace(
      /pack\) => pack\.label === "round609_london_pld_lifecycle_next103" && pack\.exists === true/g,
      'pack) => pack.label === "round610_london_pld_lifecycle_next104" && pack.exists === true'
    );

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95",\\\\\\\\n  "round589_london_pld_lifecycle_next96",\\\\\\\\n  "round594_london_pld_lifecycle_next97",\\\\\\\\n  "round597_london_pld_lifecycle_next98",\\\\\\\\n  "round605_london_pld_lifecycle_next99",\\\\\\\\n  "round606_london_pld_lifecycle_next100",\\\\\\\\n  "round607_london_pld_lifecycle_next101",\\\\\\\\n  "round608_london_pld_lifecycle_next102",\\\\\\\\n  "round609_london_pld_lifecycle_next103"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95",\\\\\\\\n  "round589_london_pld_lifecycle_next96",\\\\\\\\n  "round594_london_pld_lifecycle_next97",\\\\\\\\n  "round597_london_pld_lifecycle_next98",\\\\\\\\n  "round605_london_pld_lifecycle_next99",\\\\\\\\n  "round606_london_pld_lifecycle_next100",\\\\\\\\n  "round607_london_pld_lifecycle_next101",\\\\\\\\n  "round608_london_pld_lifecycle_next102",\\\\\\\\n  "round609_london_pld_lifecycle_next103",\\\\\\\\n  "round610_london_pld_lifecycle_next104"\\\\\\\\n];`,
    "round610 prior pack insertion"
  );

  assertContains(transformed, 'const ROUND_NAME = "round611_london_pld_lifecycle_next105";', "round name");
  assertContains(transformed, 'const ROUND = "round611";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 610", "prior cutoff");
  assertContains(transformed, "through round610", "dedupe cutoff text");
  assertContains(transformed, "round609_london_pld_lifecycle_next103", "round609 prior pack");
  assertContains(transformed, "round610_london_pld_lifecycle_next104", "round610 prior pack");
  assertContains(transformed, "addRound611RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round611_london_pld_lifecycle_next105"', "validator round name");
  assertContains(transformed, "round611_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(ROUND610_WRAPPER, "utf8");
  const transformed = transformRound610Wrapper(source);
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
    filename: "generated_round611_london_pld_lifecycle_next105_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
