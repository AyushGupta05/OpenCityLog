const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND_NAME = "round432_london_pld_lifecycle_next58";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const BASE_ROUND404_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round404_london_pld_lifecycle_next52_candidates.js"
);

const LANGUAGE_CHECK_FILES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "notes.md",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "readback.json"
];

const RESTRICTED_OUTPUT_LANGUAGE =
  /\b(proof|proved|proves|predict\w*|forecast\w*|simulation\w*|causal|causation)\b|impact score/i;

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, and round428";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round432 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round432 source transform failed to include ${label}: ${needle}`);
  }
}

function transformRound404Source(source) {
  let transformed = source;

  transformed = replaceRequired(
    transformed,
    'const ROUND_NAME = "round404_london_pld_lifecycle_next52";',
    'const ROUND_NAME = "round432_london_pld_lifecycle_next58";',
    "outer round name"
  );

  transformed = transformed
    .replace(/round404_london_pld_lifecycle_next52/g, "round432_london_pld_lifecycle_next58")
    .replace(/round404\.london_pld_lifecycle_next52/g, "round432.london_pld_lifecycle_next58")
    .replace(/Bims5Round404PldLifecycleNext52/g, "Bims5Round432PldLifecycleNext58")
    .replace(/Round 404/g, "Round 432")
    .replace(/Round404/g, "Round432")
    .replace(/round404/g, "round432")
    .replace(/next52/g, "next58")
    .replace(/MAX_PRIOR_ROUND = 398/g, "MAX_PRIOR_ROUND = 428")
    .replace(/through round398/g, "through round428");

  transformed = replaceRequired(
    transformed,
    '  "round398_london_pld_lifecycle_next51"\n];',
    '  "round398_london_pld_lifecycle_next51",\n  "round404_london_pld_lifecycle_next52",\n  "round410_london_pld_lifecycle_next53",\n  "round416_london_pld_lifecycle_next54",\n  "round421_london_pld_lifecycle_next55",\n  "round425_london_pld_lifecycle_next56",\n  "round428_london_pld_lifecycle_next57"\n];',
    "round404, round410, round416, round421, round425, and round428 prior PLD lifecycle packs"
  );

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    '.replace(/round276/g, "round398");',
    '.replace(/round276/g, "round428");',
    "validator prior cutoff replacement"
  );

  transformed = transformed.replace(
    /main\(\)\.catch\(\(error\) => \{\s+console\.error\(error\);\s+process\.exit\(1\);\s+\}\);\s*$/,
    "module.exports = main;\n"
  );

  assertContains(transformed, 'const ROUND_NAME = "round432_london_pld_lifecycle_next58";', "round name");
  assertContains(transformed, 'const ROUND = "round432";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 428", "prior cutoff");
  assertContains(transformed, "through round428", "dedupe cutoff text");
  assertContains(transformed, "round404_london_pld_lifecycle_next52", "round404 prior pack");
  assertContains(transformed, "round410_london_pld_lifecycle_next53", "round410 prior pack");
  assertContains(transformed, "round416_london_pld_lifecycle_next54", "round416 prior pack");
  assertContains(transformed, "round421_london_pld_lifecycle_next55", "round421 prior pack");
  assertContains(transformed, "round425_london_pld_lifecycle_next56", "round425 prior pack");
  assertContains(transformed, "round428_london_pld_lifecycle_next57", "round428 prior pack");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round432_london_pld_lifecycle_next58"', "validator round name");
  assertContains(transformed, "module.exports = main;", "exported main");

  return transformed;
}

async function runTransformedRound404() {
  const source = fs.readFileSync(BASE_ROUND404_SCRIPT, "utf8");
  const transformed = transformRound404Source(source);
  const sandboxModule = { exports: {} };
  const sandbox = {
    require,
    console,
    process,
    fetch,
    __dirname,
    module: sandboxModule,
    exports: sandboxModule.exports
  };

  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_round432_london_pld_lifecycle_next58_candidates.js"
  });

  if (typeof sandboxModule.exports !== "function") {
    throw new Error("Round432 transform did not export the fetch main() function.");
  }

  await sandboxModule.exports();
}

function lifecycleMilestoneLabel(field) {
  if (field === "actual_completion_date") return "PLD source-reported actual completion date";
  if (field === "actual_commencement_date") return "PLD source-reported actual commencement date";
  return `PLD source-reported ${field || "lifecycle"} date`;
}

function addRound432RequestedAliases() {
  const file = path.join(OUT_DIR, "candidates.json");
  const pack = readJson(file);
  pack.candidates = (pack.candidates || []).map((candidate) => ({
    ...candidate,
    id: candidate.id || candidate.event_id,
    planning_reference: candidate.planning_reference || candidate.lpa_reference || "not supplied by PLD row",
    status:
      candidate.status ||
      candidate.planning_status ||
      candidate.source_fields?.status ||
      "not supplied by PLD row",
    decision: candidate.decision || candidate.source_fields?.decision || "not supplied by PLD row",
    lifecycle_milestone:
      candidate.lifecycle_milestone || lifecycleMilestoneLabel(candidate.source_lifecycle_field),
    lifecycle_milestone_date:
      candidate.lifecycle_milestone_date || candidate.source_lifecycle_date || candidate.effective_date,
    geometry_ref: candidate.geometry_ref || candidate.geometry_source,
    method: candidate.method || candidate.transformation_method
  }));
  writeJson(file, pack);
}

function fileStatuses() {
  return Object.fromEntries(
    LANGUAGE_CHECK_FILES.map((name) => {
      const file = path.join(OUT_DIR, name);
      return [
        name,
        {
          exists: fs.existsSync(file),
          bytes: fs.existsSync(file) ? fs.statSync(file).size : 0
        }
      ];
    })
  );
}

function validateAndRewriteReadbackJson() {
  const candidatesPack = readJson(path.join(OUT_DIR, "candidates.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const rejected = readJson(path.join(OUT_DIR, "rejected.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const validationReport = readJson(path.join(OUT_DIR, "validation_report.json"));
  const notes = fs.readFileSync(path.join(OUT_DIR, "notes.md"), "utf8");
  const readbackFile = path.join(OUT_DIR, "readback.json");
  const existingReadback = readJson(readbackFile);
  const candidates = candidatesPack.candidates || [];
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  const sourceIds = [
    ...new Set(
      candidates
        .flatMap((candidate) => candidate.source_ids || [candidate.source_id])
        .concat((sourceAudit.source_audits || []).map((audit) => audit.source_id))
        .filter(Boolean)
    )
  ].sort();
  const files = fileStatuses();
  const ok =
    candidates.length === summary.candidate_count &&
    candidates.length === validation.candidate_count &&
    candidates.length === validationReport.candidate_count &&
    candidates.length === candidatesPack.candidate_count &&
    validation.ok === true &&
    validationReport.ok === true &&
    files["readback.json"].exists === true &&
    sourceIds.includes("gla-planning-datahub-applications") &&
    sourceIds.includes("london-planning-datahub-api/core") &&
    /source-reported administrative/i.test(notes) &&
    candidates.every(
      (candidate) =>
        candidate.id &&
        candidate.method &&
        candidate.planning_reference &&
        candidate.status &&
        candidate.decision &&
        candidate.lifecycle_milestone &&
        candidate.lifecycle_milestone_date
    ) &&
    /through round428/i.test(summary.dedupe_basis || "") &&
    (summary.duplicate_index?.prior_packs || []).some(
      (pack) => pack.label === "round428_london_pld_lifecycle_next57" && pack.exists === true
    );

  if (!ok) {
    throw new Error("Readback validation failed for Round432 output pack.");
  }

  writeJson(readbackFile, {
    ...existingReadback,
    ok: true,
    read_at: GENERATED_AT,
    task: ROUND_NAME,
    files,
    candidate_count: candidates.length,
    date_range: {
      min: dates[0] || null,
      max: dates[dates.length - 1] || null
    },
    source_ids: sourceIds,
    source_audit_count: (sourceAudit.source_audits || []).length,
    rejection_count: rejected.rejection_count,
    validation_ok: validation.ok,
    validation_report_ok: validationReport.ok,
    lifecycle_field_mix: validation.lifecycle_field_mix,
    selected_by_borough: summary.selected_by_borough,
    dedupe_basis: summary.dedupe_basis,
    caveats: summary.caveats,
    readback_checks: [
      "all requested output files parsed",
      "candidate counts agree across candidates, summary, validation, and validation_report",
      "source audit includes PLD dataset and API source ids",
      "notes retain administrative lifecycle caveat",
      "candidate aliases include id, method, planning_reference, status, decision, and lifecycle_milestone",
      "dedupe basis includes PLD lifecycle packs through round428",
      "round428 prior PLD lifecycle pack was scanned",
      "readback file exists after final write"
    ]
  });

  const finalReadback = readJson(readbackFile);
  if (!finalReadback.ok || !finalReadback.files?.["readback.json"]?.exists) {
    throw new Error("Final readback self-check failed for Round432 output pack.");
  }
}

function assertGeneratedOutputLanguage() {
  for (const name of LANGUAGE_CHECK_FILES) {
    const file = path.join(OUT_DIR, name);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing expected output file for language check: ${path.relative(ROOT, file)}`);
    }
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(RESTRICTED_OUTPUT_LANGUAGE);
    if (match) {
      throw new Error(`Restricted lifecycle wording in ${path.relative(ROOT, file)}: ${match[0]}`);
    }
  }
}

async function main() {
  await runTransformedRound404();
  addRound432RequestedAliases();
  validateAndRewriteReadbackJson();
  assertGeneratedOutputLanguage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
