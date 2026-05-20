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
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, and round451";

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round457 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round457 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound444Script(source) {
  let transformed = source
    .replace(/round444_london_pld_lifecycle_next61/g, "round457_london_pld_lifecycle_next64")
    .replace(/round444\.london_pld_lifecycle_next61/g, "round457.london_pld_lifecycle_next64")
    .replace(/Bims5Round444PldLifecycleNext61/g, "Bims5Round457PldLifecycleNext64")
    .replace(/Round 444/g, "Round 457")
    .replace(/Round444/g, "Round457")
    .replace(/round444/g, "round457")
    .replace(/next61/g, "next64")
    .replace(/MAX_PRIOR_ROUND = 439/g, "MAX_PRIOR_ROUND = 451")
    .replace(/through round439/g, "through round451")
    .replace(/packRound\(entry\.name\) > 439/g, "packRound(entry.name) > 451")
    .replace(/\.replace\(\/round276\/g, "round439"\);/g, '.replace(/round276/g, "round451");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    '  "round436_london_pld_lifecycle_next59",\\n  "round439_london_pld_lifecycle_next60"\\n];',
    '  "round436_london_pld_lifecycle_next59",\\n  "round439_london_pld_lifecycle_next60",\\n  "round444_london_pld_lifecycle_next61",\\n  "round448_london_pld_lifecycle_next62",\\n  "round451_london_pld_lifecycle_next63"\\n];',
    "round444, round448, and round451 prior pack insertion"
  );

  transformed = transformed
    .replace(
      [
        "  pack.candidates = (pack.candidates || []).map((candidate) => ({",
        "    ...candidate,",
        "    id: candidate.id || candidate.event_id,"
      ].join("\n"),
      [
        "  pack.candidates = (pack.candidates || []).map((candidate) => ({",
        "    ...candidate,",
        '    category: candidate.category || "built_environment",',
        '    layer: candidate.layer || "built_environment",',
        '    layer_id: candidate.layer_id || "built_environment",',
        '    atlas_layer: candidate.atlas_layer || "planning_lifecycle",',
        '    sub_layer: candidate.sub_layer || "planning_lifecycle",',
        "    bucket:",
        "      candidate.bucket ||",
        '      `planning/development/lifecycle/${candidate.source_lifecycle_field === "actual_commencement_date" ? "commencement" : "completion"}`,',
        "    id: candidate.id || candidate.event_id,"
      ].join("\n")
    )
    .replace(
      /assertContains\(transformed, "round439_london_pld_lifecycle_next60", "round439 prior pack"\);/,
      [
        'assertContains(transformed, "round439_london_pld_lifecycle_next60", "round439 prior pack");',
        '  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");',
        '  assertContains(transformed, "round448_london_pld_lifecycle_next62", "round448 prior pack");',
        '  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");'
      ].join("\n")
    )
    .replace(
      [
        "        candidate.id &&",
        "        candidate.method &&"
      ].join("\n"),
      [
        "        candidate.id &&",
        "        candidate.category &&",
        "        candidate.layer &&",
        "        candidate.bucket &&",
        "        candidate.method &&"
      ].join("\n")
    )
    .replace(
      /candidate aliases include id, method, planning_reference, status, decision, and lifecycle_milestone/g,
      "candidate aliases include category, layer, bucket, id, method, planning_reference, status, decision, and lifecycle_milestone"
    )
    .replace(
      /pack\) => pack\.label === "round439_london_pld_lifecycle_next60" && pack\.exists === true/,
      'pack) => pack.label === "round451_london_pld_lifecycle_next63" && pack.exists === true'
    )
    .replace(/round439 prior PLD lifecycle pack was scanned/g, "round451 prior PLD lifecycle pack was scanned");

  transformed = replaceRequired(
    transformed,
    "async function main() {",
    [
      "function addRound457RetrievedAtAlias() {",
      '  const file = path.join(OUT_DIR, "candidates.json");',
      "  const pack = readJson(file);",
      "  pack.candidates = (pack.candidates || []).map((candidate) => ({",
      "    ...candidate,",
      "    retrieved_at: candidate.retrieved_at || candidate.accessed_at || ACCESSED_AT",
      "  }));",
      "  writeJson(file, pack);",
      "}",
      "",
      "async function main() {"
    ].join("\n"),
    "candidate retrieved_at post-generation alias function"
  );

  transformed = replaceRequired(
    transformed,
    "  addRound457RequestedAliases();",
    ["  addRound457RequestedAliases();", "  addRound457RetrievedAtAlias();"].join("\n"),
    "candidate retrieved_at alias call"
  );

  assertContains(transformed, 'const ROUND_NAME = "round457_london_pld_lifecycle_next64";', "round name");
  assertContains(transformed, 'const ROUND = "round457";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 451", "prior cutoff");
  assertContains(transformed, "through round451", "dedupe cutoff text");
  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");
  assertContains(transformed, "round448_london_pld_lifecycle_next62", "round448 prior pack");
  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");
  assertContains(transformed, 'category: candidate.category || "built_environment"', "category alias");
  assertContains(transformed, 'layer: candidate.layer || "built_environment"', "layer alias");
  assertContains(transformed, "planning/development/lifecycle", "bucket alias");
  assertContains(transformed, "addRound457RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round457_london_pld_lifecycle_next64"', "validator round name");
  assertContains(transformed, "round457_strict_duplicate_audit", "strict duplicate audit label");
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
    filename: "generated_round457_london_pld_lifecycle_next64_candidates.js"
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
