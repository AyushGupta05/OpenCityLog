const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_ROUND444_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round444_london_pld_lifecycle_next61_candidates.js"
);

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, and round444";

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round448 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round448 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound444Script(source) {
  let transformed = source
    .replace(/round444_london_pld_lifecycle_next61/g, "round448_london_pld_lifecycle_next62")
    .replace(/round444\.london_pld_lifecycle_next61/g, "round448.london_pld_lifecycle_next62")
    .replace(/Bims5Round444PldLifecycleNext61/g, "Bims5Round448PldLifecycleNext62")
    .replace(/Round 444/g, "Round 448")
    .replace(/Round444/g, "Round448")
    .replace(/round444/g, "round448")
    .replace(/next61/g, "next62")
    .replace(/MAX_PRIOR_ROUND = 439/g, "MAX_PRIOR_ROUND = 444")
    .replace(/through round439/g, "through round444")
    .replace(/packRound\(entry\.name\) > 439/g, "packRound(entry.name) > 444")
    .replace(/\.replace\(\/round276\/g, "round439"\);/g, '.replace(/round276/g, "round444");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    '  "round436_london_pld_lifecycle_next59",\\n  "round439_london_pld_lifecycle_next60"\\n];',
    '  "round436_london_pld_lifecycle_next59",\\n  "round439_london_pld_lifecycle_next60",\\n  "round444_london_pld_lifecycle_next61"\\n];',
    "round444 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /assertContains\(transformed, "round439_london_pld_lifecycle_next60", "round439 prior pack"\);/,
      [
        'assertContains(transformed, "round439_london_pld_lifecycle_next60", "round439 prior pack");',
        '  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");'
      ].join("\n  ")
    )
    .replace(
      /pack\) => pack\.label === "round439_london_pld_lifecycle_next60" && pack\.exists === true/,
      'pack) => pack.label === "round444_london_pld_lifecycle_next61" && pack.exists === true'
    )
    .replace(/round439 prior PLD lifecycle pack was scanned/g, "round444 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round448_london_pld_lifecycle_next62";', "round name");
  assertContains(transformed, 'const ROUND = "round448";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 444", "prior cutoff");
  assertContains(transformed, "through round444", "dedupe cutoff text");
  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round448_london_pld_lifecycle_next62"', "validator round name");
  assertContains(transformed, "round448_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

async function main() {
  const source = fs.readFileSync(BASE_ROUND444_SCRIPT, "utf8");
  const transformed = transformRound444Script(source);
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
    filename: "generated_round448_london_pld_lifecycle_next62_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
