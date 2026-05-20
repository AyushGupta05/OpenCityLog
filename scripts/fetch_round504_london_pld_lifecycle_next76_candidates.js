const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_ROUND488_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round488_london_pld_lifecycle_next72_candidates.js"
);
const ROUND_NAME = "round504_london_pld_lifecycle_next76";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const REQUIRED_OUTPUT_FILES = [
  "candidates.json",
  "source_audit.json",
  "validation_report.json",
  "summary.json",
  "rejected.json",
  "readback.json",
  "validation.json",
  "strict_duplicate_audit.json",
  "notes.md"
];

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, round439, round444, round448, round451, round457, round460, round467, round469, round474, round478, round481, round485, round488, round490, round496, and round500";

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round504 source transform failed to include ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round504 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function transformRound488Script(source) {
  let transformed = source
    .replace(/round488_london_pld_lifecycle_next72/g, "round504_london_pld_lifecycle_next76")
    .replace(/round488\.london_pld_lifecycle_next72/g, "round504.london_pld_lifecycle_next76")
    .replace(/Bims5Round488PldLifecycleNext72/g, "Bims5Round504PldLifecycleNext76")
    .replace(/Round 488/g, "Round 504")
    .replace(/Round488/g, "Round504")
    .replace(/round488/g, "round504")
    .replace(/next72/g, "next76")
    .replace(/MAX_PRIOR_ROUND = 485/g, "MAX_PRIOR_ROUND = 500")
    .replace(/through round485/g, "through round500")
    .replace(/packRound\(entry\.name\) > 485/g, "packRound(entry.name) > 500")
    .replace(/\.replace\(\/round276\/g, "round485"\);/g, '.replace(/round276/g, "round500");');

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    String.raw`  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65",\\\\\\\\n  "round467_london_pld_lifecycle_next66",\\\\\\\\n  "round469_london_pld_lifecycle_next67",\\\\\\\\n  "round474_london_pld_lifecycle_next68",\\\\\\\\n  "round478_london_pld_lifecycle_next69",\\\\\\\\n  "round481_london_pld_lifecycle_next70",\\\\\\\\n  "round485_london_pld_lifecycle_next71"\\\\\\\\n];`,
    String.raw`  "round436_london_pld_lifecycle_next59",\\\\\\\\n  "round439_london_pld_lifecycle_next60",\\\\\\\\n  "round444_london_pld_lifecycle_next61",\\\\\\\\n  "round448_london_pld_lifecycle_next62",\\\\\\\\n  "round451_london_pld_lifecycle_next63",\\\\\\\\n  "round457_london_pld_lifecycle_next64",\\\\\\\\n  "round460_london_pld_lifecycle_next65",\\\\\\\\n  "round467_london_pld_lifecycle_next66",\\\\\\\\n  "round469_london_pld_lifecycle_next67",\\\\\\\\n  "round474_london_pld_lifecycle_next68",\\\\\\\\n  "round478_london_pld_lifecycle_next69",\\\\\\\\n  "round481_london_pld_lifecycle_next70",\\\\\\\\n  "round485_london_pld_lifecycle_next71",\\\\\\\\n  "round488_london_pld_lifecycle_next72",\\\\\\\\n  "round490_london_pld_lifecycle_next73",\\\\\\\\n  "round496_london_pld_lifecycle_next74",\\\\\\\\n  "round500_london_pld_lifecycle_next75"\\\\\\\\n];`,
    "round488, round490, round496, and round500 prior pack insertion"
  );

  transformed = transformed
    .replace(
      /pack\) => pack\.label === "round485_london_pld_lifecycle_next71" && pack\.exists === true/g,
      'pack) => pack.label === "round500_london_pld_lifecycle_next75" && pack.exists === true'
    )
    .replace(/round485 prior PLD lifecycle pack was scanned/g, "round500 prior PLD lifecycle pack was scanned");

  assertContains(transformed, 'const ROUND_NAME = "round504_london_pld_lifecycle_next76";', "round name");
  assertContains(transformed, 'const ROUND = "round504";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 500", "prior cutoff");
  assertContains(transformed, "through round500", "dedupe cutoff text");
  assertContains(transformed, "round444_london_pld_lifecycle_next61", "round444 prior pack");
  assertContains(transformed, "round448_london_pld_lifecycle_next62", "round448 prior pack");
  assertContains(transformed, "round451_london_pld_lifecycle_next63", "round451 prior pack");
  assertContains(transformed, "round457_london_pld_lifecycle_next64", "round457 prior pack");
  assertContains(transformed, "round460_london_pld_lifecycle_next65", "round460 prior pack");
  assertContains(transformed, "round467_london_pld_lifecycle_next66", "round467 prior pack");
  assertContains(transformed, "round469_london_pld_lifecycle_next67", "round469 prior pack");
  assertContains(transformed, "round474_london_pld_lifecycle_next68", "round474 prior pack");
  assertContains(transformed, "round478_london_pld_lifecycle_next69", "round478 prior pack");
  assertContains(transformed, "round481_london_pld_lifecycle_next70", "round481 prior pack");
  assertContains(transformed, "round485_london_pld_lifecycle_next71", "round485 prior pack");
  assertContains(transformed, "round488_london_pld_lifecycle_next72", "round488 prior pack");
  assertContains(transformed, "round490_london_pld_lifecycle_next73", "round490 prior pack");
  assertContains(transformed, "round496_london_pld_lifecycle_next74", "round496 prior pack");
  assertContains(transformed, "round500_london_pld_lifecycle_next75", "round500 prior pack");
  assertContains(transformed, 'category: candidate.category || "built_environment"', "category alias");
  assertContains(transformed, 'layer: candidate.layer || "built_environment"', "layer alias");
  assertContains(transformed, "planning/development/lifecycle", "bucket alias");
  assertContains(transformed, "addRound504RetrievedAtAlias", "candidate retrieved_at alias");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round504_london_pld_lifecycle_next76"', "validator round name");
  assertContains(transformed, "round504_strict_duplicate_audit", "strict duplicate audit label");
  assertContains(transformed, "module.exports = main;", "exported transformed fetch main");
  return transformed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGeneratedOutputs(startedAtMs) {
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    const filesReady = REQUIRED_OUTPUT_FILES.every((name) => {
      const file = path.join(OUT_DIR, name);
      return fs.existsSync(file) && fs.statSync(file).mtimeMs >= startedAtMs - 1000;
    });

    if (filesReady) {
      try {
        const candidates = readJson(path.join(OUT_DIR, "candidates.json"));
        const validation = readJson(path.join(OUT_DIR, "validation.json"));
        const report = readJson(path.join(OUT_DIR, "validation_report.json"));
        const strict = readJson(path.join(OUT_DIR, "strict_duplicate_audit.json"));
        if (
          candidates.candidate_count === 150 &&
          validation.ok === true &&
          report.ok === true &&
          strict.ok === true
        ) {
          return;
        }
      } catch (_error) {
        // Files may still be mid-write; keep polling.
      }
    }

    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${ROUND_NAME} generated outputs.`);
}

function addRound504SourceRowRefs() {
  const file = path.join(OUT_DIR, "candidates.json");
  const pack = readJson(file);
  let aliasCount = 0;
  pack.candidates = (pack.candidates || []).map((candidate) => {
    const sourceRowRef = candidate.source_row_ref || candidate.row_url || candidate.source_url;
    if (!sourceRowRef) {
      throw new Error(`Missing source row URL for ${candidate.candidate_id || candidate.event_id}`);
    }
    aliasCount += 1;
    return {
      ...candidate,
      source_row_ref: sourceRowRef,
      source_row_refs: candidate.source_row_refs || [
        {
          label: "Planning London Datahub source row",
          url: sourceRowRef,
          source_record_id: candidate.source_record_id,
          source_date_field: candidate.source_date_field,
          source_lifecycle_date: candidate.source_lifecycle_date || candidate.effective_date
        },
        {
          label: "Planning London Datahub applications API query",
          url: candidate.api_url || candidate.api_endpoint,
          source_record_id: candidate.source_record_id,
          source_date_field: candidate.source_date_field,
          source_lifecycle_date: candidate.source_lifecycle_date || candidate.effective_date
        }
      ]
    };
  });
  pack.round504_postprocess = {
    source_row_ref_alias_count: aliasCount,
    note: "Round504 wrapper added explicit source_row_ref/source_row_refs aliases from the official PLD row/API URLs after the inherited lifecycle worker completed."
  };
  writeJson(file, pack);
}

function updateRound504Readback() {
  const file = path.join(OUT_DIR, "readback.json");
  const readback = readJson(file);
  const candidates = readJson(path.join(OUT_DIR, "candidates.json")).candidates || [];
  const sourceRowRefAliasCount = candidates.filter(
    (candidate) => candidate.source_row_ref && Array.isArray(candidate.source_row_refs)
  ).length;

  readback.files = Object.fromEntries(
    REQUIRED_OUTPUT_FILES.map((name) => {
      const outputFile = path.join(OUT_DIR, name);
      return [
        name,
        {
          exists: fs.existsSync(outputFile),
          bytes: fs.existsSync(outputFile) ? fs.statSync(outputFile).size : 0
        }
      ];
    })
  );
  readback.source_row_ref_alias_count = sourceRowRefAliasCount;
  readback.round504_postprocess_checks = [
    "explicit source_row_ref and source_row_refs aliases are present on every promoted candidate"
  ];
  if (!readback.readback_checks.includes("candidate source row ref aliases present")) {
    readback.readback_checks.push("candidate source row ref aliases present");
  }
  writeJson(file, readback);
}

async function main() {
  const source = fs.readFileSync(BASE_ROUND488_SCRIPT, "utf8");
  const transformed = transformRound488Script(source);
  const startedAtMs = Date.now();
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
    filename: "generated_round504_london_pld_lifecycle_next76_candidates.js"
  });
  await waitForGeneratedOutputs(startedAtMs);
  addRound504SourceRowRefs();
  updateRound504Readback();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
