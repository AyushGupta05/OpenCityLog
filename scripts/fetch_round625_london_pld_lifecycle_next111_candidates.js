const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND625_OUT_DIR = path.join(
  ROOT,
  "tmp",
  "subagents",
  "round625_london_pld_lifecycle_next111"
);
const ROUND616_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round616_london_pld_lifecycle_next109_candidates.js"
);
const INHERITED_ACCESS_DATE = "2026-05-20";
const ROUND625_ACCESS_DATE = "2026-05-23";

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, round567, round570, round576, round579, round584, round589, round594, round597, round605, round606, round607, round608, round609, round610, round611, round612, round613, round614, round616, and round618";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round625 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round625 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound616Wrapper(source) {
  let transformed = source
    .replace(/round616_london_pld_lifecycle_next109/g, "round625_london_pld_lifecycle_next111")
    .replace(/round616\.london_pld_lifecycle_next109/g, "round625.london_pld_lifecycle_next111")
    .replace(/Bims5Round616PldLifecycleNext109/g, "Bims5Round625PldLifecycleNext111")
    .replace(/Round 616/g, "Round 625")
    .replace(/Round616/g, "Round625")
    .replace(/round616/g, "round625")
    .replace(/next109/g, "next111")
    .replace(/MAX_PRIOR_ROUND = 614/g, "MAX_PRIOR_ROUND = 618")
    .replace(/through round614/g, "through round618")
    .replace(/packRound\(entry\.name\) > 614/g, "packRound(entry.name) > 618")
    .replace(/\.replace\(\/round276\/g, "round614"\);/g, '.replace(/round276/g, "round618");')
    .replace(/round614 prior PLD lifecycle pack was scanned/g, "round618 prior PLD lifecycle pack was scanned")
    .replace(
      /pack\) => pack\.label === "round614_london_pld_lifecycle_next108" && pack\.exists === true/g,
      'pack) => pack.label === "round618_london_pld_lifecycle_next110" && pack.exists === true'
    );

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95",\\\\\\\\n  "round589_london_pld_lifecycle_next96",\\\\\\\\n  "round594_london_pld_lifecycle_next97",\\\\\\\\n  "round597_london_pld_lifecycle_next98",\\\\\\\\n  "round605_london_pld_lifecycle_next99",\\\\\\\\n  "round606_london_pld_lifecycle_next100",\\\\\\\\n  "round607_london_pld_lifecycle_next101",\\\\\\\\n  "round608_london_pld_lifecycle_next102",\\\\\\\\n  "round609_london_pld_lifecycle_next103",\\\\\\\\n  "round610_london_pld_lifecycle_next104",\\\\\\\\n  "round611_london_pld_lifecycle_next105",\\\\\\\\n  "round612_london_pld_lifecycle_next106",\\\\\\\\n  "round613_london_pld_lifecycle_next107",\\\\\\\\n  "round614_london_pld_lifecycle_next108"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95",\\\\\\\\n  "round589_london_pld_lifecycle_next96",\\\\\\\\n  "round594_london_pld_lifecycle_next97",\\\\\\\\n  "round597_london_pld_lifecycle_next98",\\\\\\\\n  "round605_london_pld_lifecycle_next99",\\\\\\\\n  "round606_london_pld_lifecycle_next100",\\\\\\\\n  "round607_london_pld_lifecycle_next101",\\\\\\\\n  "round608_london_pld_lifecycle_next102",\\\\\\\\n  "round609_london_pld_lifecycle_next103",\\\\\\\\n  "round610_london_pld_lifecycle_next104",\\\\\\\\n  "round611_london_pld_lifecycle_next105",\\\\\\\\n  "round612_london_pld_lifecycle_next106",\\\\\\\\n  "round613_london_pld_lifecycle_next107",\\\\\\\\n  "round614_london_pld_lifecycle_next108",\\\\\\\\n  "round616_london_pld_lifecycle_next109",\\\\\\\\n  "round618_london_pld_lifecycle_next110"\\\\\\\\n];`,
    "round618 prior pack insertion"
  );

  assertContains(transformed, 'const ROUND_NAME = "round625_london_pld_lifecycle_next111";', "round name");
  assertContains(transformed, 'const ROUND = "round625";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 618", "prior cutoff");
  assertContains(transformed, "through round618", "dedupe cutoff text");
  assertContains(transformed, "round616_london_pld_lifecycle_next109", "round616 prior pack");
  assertContains(transformed, "round618_london_pld_lifecycle_next110", "round618 prior pack");
  assertContains(transformed, "addRound625RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round625_london_pld_lifecycle_next111"', "validator round name");
  assertContains(transformed, "round625_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  process.once("beforeExit", () => {
    if (!fs.existsSync(ROUND625_OUT_DIR)) return;
    for (const entry of fs.readdirSync(ROUND625_OUT_DIR, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.(json|md)$/i.test(entry.name)) continue;
      const filePath = path.join(ROUND625_OUT_DIR, entry.name);
      const before = fs.readFileSync(filePath, "utf8");
      const after = before.split(INHERITED_ACCESS_DATE).join(ROUND625_ACCESS_DATE);
      if (after !== before) fs.writeFileSync(filePath, after, "utf8");
    }
  });

  const source = fs.readFileSync(ROUND616_WRAPPER, "utf8");
  const transformed = transformRound616Wrapper(source);
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
    filename: "generated_round625_london_pld_lifecycle_next111_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
