const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND579_WRAPPER = path.join(
  ROOT,
  "scripts",
  "fetch_round579_london_pld_lifecycle_next94_candidates.js"
);
const ROUND_NAME = "round607_london_pld_lifecycle_next101";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const SOURCE_ID_FIX_FILES = ["candidates.json", "readback.json", "source_audit.json"];

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, round500, round504, round508, round512, round517, round522, round526, round529, round534, round537, round542, round547, round550, round552, round557, round562, round567, round570, round576, round579, round584, round589, round594, round597, round605, and round606";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round607 wrapper transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round607 wrapper transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound579Wrapper(source) {
  let transformed = source
    .replace(/round579_london_pld_lifecycle_next94/g, "round607_london_pld_lifecycle_next101")
    .replace(/round579\.london_pld_lifecycle_next94/g, "round607.london_pld_lifecycle_next101")
    .replace(/Bims5Round579PldLifecycleNext94/g, "Bims5Round607PldLifecycleNext101")
    .replace(/Round 579/g, "Round 607")
    .replace(/Round579/g, "Round607")
    .replace(/round579/g, "round607")
    .replace(/next94/g, "next101")
    .replace(/MAX_PRIOR_ROUND = 576/g, "MAX_PRIOR_ROUND = 606")
    .replace(/through round576/g, "through round606")
    .replace(/packRound\(entry\.name\) > 576/g, "packRound(entry.name) > 606")
    .replace(/\.replace\(\/round276\/g, "round576"\);/g, '.replace(/round276/g, "round606");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93"\\\\\\\\n];`,
    String.raw`  "round552_london_pld_lifecycle_next88",\\\\\\\\n  "round557_london_pld_lifecycle_next89",\\\\\\\\n  "round562_london_pld_lifecycle_next90",\\\\\\\\n  "round567_london_pld_lifecycle_next91",\\\\\\\\n  "round570_london_pld_lifecycle_next92",\\\\\\\\n  "round576_london_pld_lifecycle_next93",\\\\\\\\n  "round579_london_pld_lifecycle_next94",\\\\\\\\n  "round584_london_pld_lifecycle_next95",\\\\\\\\n  "round589_london_pld_lifecycle_next96",\\\\\\\\n  "round594_london_pld_lifecycle_next97",\\\\\\\\n  "round597_london_pld_lifecycle_next98",\\\\\\\\n  "round605_london_pld_lifecycle_next99",\\\\\\\\n  "round606_london_pld_lifecycle_next100"\\\\\\\\n];`,
    "round579, round584, round589, round594, round597, round605, and round606 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round576_london_pld_lifecycle_next93" && pack\.exists === true/g,
      'pack) => pack.label === "round606_london_pld_lifecycle_next100" && pack.exists === true'
    )
    .replace(/round576 prior PLD lifecycle pack was scanned/g, "round606 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round607_london_pld_lifecycle_next101";', "round name");
  assertContains(transformed, 'const ROUND = "round607";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 606", "prior cutoff");
  assertContains(transformed, "through round606", "dedupe cutoff text");
  assertContains(transformed, "round605_london_pld_lifecycle_next99", "round605 prior pack");
  assertContains(transformed, "round606_london_pld_lifecycle_next100", "round606 prior pack");
  assertContains(transformed, "addRound607RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round607_london_pld_lifecycle_next101"', "validator round name");
  assertContains(transformed, "round607_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "source_row_ref_alias_count", "postprocess source row ref aliases");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFreshOutputs(startedAtMs) {
  const required = ["candidates.json", "validation_report.json"];
  const deadline = Date.now() + 600000;
  while (Date.now() < deadline) {
    const ready = required.every((file) => {
      const filePath = path.join(OUT_DIR, file);
      if (!fs.existsSync(filePath)) {
        return false;
      }
      return fs.statSync(filePath).mtimeMs >= startedAtMs;
    });
    if (ready) {
      return;
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for fresh ${ROUND_NAME} output files`);
}

function normalizePldApiSourceId() {
  let replacements = 0;
  for (const file of SOURCE_ID_FIX_FILES) {
    const filePath = path.join(OUT_DIR, file);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const before = fs.readFileSync(filePath, "utf8");
    const count = (before.match(/london-planning-datahub-api\/core/g) || []).length;
    if (count === 0) {
      continue;
    }
    const after = before.replace(/london-planning-datahub-api\/core/g, "london-planning-datahub-api-core");
    fs.writeFileSync(filePath, after);
    replacements += count;
  }
  if (replacements > 0) {
    console.log(JSON.stringify({ round: ROUND_NAME, source_id_replacements: replacements }, null, 2));
  }
}

async function main() {
  const startedAtMs = Date.now() - 1000;
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
    filename: "generated_round607_london_pld_lifecycle_next101_candidates.js"
  });
  await waitForFreshOutputs(startedAtMs);
  normalizePldApiSourceId();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
