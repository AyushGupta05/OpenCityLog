const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND_NAME = "round404_london_pld_lifecycle_next52";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const BASE_FETCH_SCRIPT = path.join(ROOT, "scripts", "fetch_round284_london_pld_lifecycle_next25_candidates.js");
const BASE_VALIDATOR = path.join(
  ROOT,
  "tmp",
  "subagents",
  "round284_london_pld_lifecycle_next25",
  "validate_round284_pack.js"
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

const PRIOR_PACKS_AFTER_276 = [
  "round284_london_pld_lifecycle_next25",
  "round288_london_pld_lifecycle_next26",
  "round298_london_pld_lifecycle_next27",
  "round301_london_pld_lifecycle_next28",
  "round306_london_pld_lifecycle_next29",
  "round311_london_pld_lifecycle_next30",
  "round316_london_pld_lifecycle_next31",
  "round323_london_pld_lifecycle_next32",
  "round327_london_pld_lifecycle_next33",
  "round328_london_pld_lifecycle_next34",
  "round333_london_pld_lifecycle_next35",
  "round338_london_pld_lifecycle_next36",
  "round343_london_pld_lifecycle_next37",
  "round348_london_pld_lifecycle_next38",
  "round350_london_pld_lifecycle_next39",
  "round354_london_pld_lifecycle_next40",
  "round358_london_pld_lifecycle_next41",
  "round362_london_pld_lifecycle_next42",
  "round365_london_pld_lifecycle_next43",
  "round369_london_pld_lifecycle_next44",
  "round373_london_pld_lifecycle_next45",
  "round377_london_pld_lifecycle_next46",
  "round380_london_pld_lifecycle_next47",
  "round384_london_pld_lifecycle_next48",
  "round387_london_pld_lifecycle_next49",
  "round393_london_pld_lifecycle_next50",
  "round398_london_pld_lifecycle_next51"
];

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, and round398";

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
    throw new Error(`Round404 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round404 source transform failed to include ${label}: ${needle}`);
  }
}

function assertAbsent(value, needle, label) {
  if (value.includes(needle)) {
    throw new Error(`Round404 source transform retained ${label}: ${needle}`);
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tightenLifecycleLanguage(source) {
  let transformed = source;

  transformed = replaceRequired(
    transformed,
    "Planning London Datahub records an actual completion date for this planning application row; this is a source-reported administrative lifecycle field, not proof of construction completion, opening, occupation, final built form, or outcomes.",
    "Planning London Datahub records an actual completion date for this planning application row; this is a source-reported administrative lifecycle field. Treat it as an administrative record only, not a direct site observation of construction completion, opening, occupation, final built form, or wider results.",
    "completion lifecycle wording"
  );
  transformed = replaceRequired(
    transformed,
    "Planning London Datahub records an actual commencement date for this planning application row; this is a source-reported administrative lifecycle field, not proof of construction start, completion, opening, occupation, final built form, or outcomes.",
    "Planning London Datahub records an actual commencement date for this planning application row; this is a source-reported administrative lifecycle field. Treat it as an administrative record only, not a direct site observation of construction start, completion, opening, occupation, final built form, or wider results.",
    "commencement lifecycle wording"
  );
  transformed = replaceRequired(
    transformed,
    "This row is not proof of construction start, construction completion, opening, occupation, current use, service outcomes, design quality, causation, or final built form.",
    "This row is an administrative planning feed record only; use source planning documents and site-specific evidence for construction start, construction completion, opening, occupation, current use, design quality, service-result statements, or final built form.",
    "candidate limitation wording"
  );
  transformed = replaceRequired(
    transformed,
    "actual_commencement_date and actual_completion_date are source-reported administrative/applicant/local-authority feed fields, not independent proof of construction start, construction completion, opening, occupation, current use, final built form, design quality, outcomes, or causation.",
    "actual_commencement_date and actual_completion_date are source-reported administrative/applicant/local-authority feed fields. Treat them as administrative planning feed fields only, not direct site observations of construction start, construction completion, opening, occupation, current use, final built form, design quality, service-result statements, or wider results.",
    "source audit lifecycle caveat"
  );
  transformed = replaceRequired(
    transformed,
    "Use selected rows as documented planning lifecycle milestones only, with inline limitations and no claims about delivery outcomes.",
    "Use selected rows as documented planning lifecycle milestones only, with inline limitations and no claims beyond the listed source fields.",
    "source audit ingestion recommendation"
  );
  transformed = replaceRequired(
    transformed,
    "Candidates are source-reported administrative lifecycle records, not proof that construction started, a building completed, opened, became occupied, reached final built form, or produced an outcome.",
    "Candidates are source-reported administrative lifecycle records only; source planning documents and site-specific evidence are needed before treating them as construction start, completion, opening, occupation, final built form, or wider-result records.",
    "summary caveat wording"
  );
  transformed = replaceRequired(
    transformed,
    "It does not use approval-only rows, previous-permission lifecycle fields, forecast dates, or inferred delivery dates.",
    "It does not use approval-only rows, previous-permission lifecycle fields, future-dated lifecycle values, or inferred delivery dates.",
    "notes lifecycle source scope"
  );
  transformed = replaceRequired(
    transformed,
    "Use these as source-reported administrative planning lifecycle milestones only. Do not infer construction start, construction completion, opening, occupation, current use, design quality, outcomes, causation, delivery of a wider masterplan, or final built form.",
    "Use these as source-reported administrative planning lifecycle milestones only. Treat construction start, construction completion, opening, occupation, current use, design quality, service-result statements, delivery of a wider masterplan, and final built form as requiring separate source evidence.",
    "notes lifecycle use guidance"
  );
  transformed = replaceRequired(
    transformed,
    'for (const term of ["not proof", "construction", "opening", "occupation", "final built form", "outcomes"]) {',
    'for (const term of ["source-reported administrative", "construction", "opening", "occupation", "final built form"]) {',
    "fetch validator required caveats"
  );
  transformed = replaceRequired(
    transformed,
    `    const overclaimText = [candidate.title, candidate.observed_change].join(" ").toLowerCase();
    if (/\\b(caused|causes|proved|proves|predicts|prediction)\\b/.test(overclaimText)) {
      throw new Error(\`Potential overclaim wording on \${candidate.candidate_id}\`);
    }`,
    `    const restrictedLifecycleText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations.join(" "),
      candidate.transformation_method
    ]
      .join(" ")
      .toLowerCase();
    if (RESTRICTED_OUTPUT_LANGUAGE.test(restrictedLifecycleText)) {
      throw new Error(\`Restricted lifecycle wording on \${candidate.candidate_id}\`);
    }`,
    "fetch validator restricted wording check"
  );
  transformed = `const RESTRICTED_OUTPUT_LANGUAGE = ${RESTRICTED_OUTPUT_LANGUAGE.toString()};\n${transformed}`;

  assertAbsent(transformed, "not proof", "legacy lifecycle wording");
  assertAbsent(transformed, "outcomes, causation", "legacy causation wording");
  assertAbsent(transformed, "forecast dates", "legacy date wording");
  return transformed;
}

function transformRound284Fetch(source) {
  let transformed = source
    .replace(/const ROUND = "round284";/, 'const ROUND = "round404";')
    .replace(
      /const ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const ROUND_NAME = "round404_london_pld_lifecycle_next52";'
    )
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 398;")
    .replace(/Bims5Round284PldLifecycleNext25/g, "Bims5Round404PldLifecycleNext52")
    .replace(/round284_london_pld_lifecycle_next25/g, "round404_london_pld_lifecycle_next52")
    .replace(/round284\.london_pld_lifecycle_next25/g, "round404.london_pld_lifecycle_next52")
    .replace(/Round284/g, "Round404")
    .replace(/Round 284/g, "Round 404")
    .replace(/round284/g, "round404")
    .replace(/next25/g, "next52")
    .replace(/through round276/g, "through round398")
    .replace(/round272, and round276/g, PRIOR_PROSE_AFTER_272);

  transformed = replaceRequired(
    transformed,
    '  "round276_london_pld_lifecycle_next24"\n];',
    `  "round276_london_pld_lifecycle_next24",\n${PRIOR_PACKS_AFTER_276.map((name) => `  "${name}"`).join(",\n")}\n];`,
    "explicit prior pack list"
  );

  transformed = tightenLifecycleLanguage(transformed);
  transformed = transformed.replace(
    /main\(\)\.catch\(\(error\) => \{\s+console\.error\(error\);\s+process\.exit\(1\);\s+\}\);\s*$/,
    "module.exports = main;\n"
  );

  assertContains(transformed, 'const ROUND = "round404";', "round id");
  assertContains(transformed, 'const ROUND_NAME = "round404_london_pld_lifecycle_next52";', "round name");
  assertContains(transformed, "MAX_PRIOR_ROUND = 398", "prior cutoff");
  for (const pack of PRIOR_PACKS_AFTER_276) {
    assertContains(transformed, pack, `prior pack ${pack}`);
  }
  assertContains(transformed, "through round398", "dedupe cutoff");
  assertContains(transformed, "module.exports = main;", "exported main");
  return transformed;
}

function transformRound284Validator(source) {
  let transformed = source
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 398;")
    .replace(
      /const CURRENT_ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const CURRENT_ROUND_NAME = "round404_london_pld_lifecycle_next52";'
    )
    .replace(/round284_london_pld_lifecycle_next25/g, "round404_london_pld_lifecycle_next52")
    .replace(/round284/g, "round404")
    .replace(/round276/g, "round398");

  transformed = replaceRequired(
    transformed,
    'assert(/source-reported administrative/i.test(notes) && /Do not infer/i.test(notes), "Notes missing lifecycle caveat");',
    'assert(/source-reported administrative/i.test(notes) && /separate source evidence/i.test(notes), "Notes missing lifecycle caveat");',
    "validator notes caveat check"
  );
  transformed = replaceRequired(
    transformed,
    '    assert(caveatText.includes("not proof"), `Missing not-proof caveat on ${candidate.candidate_id}`);',
    '    assert(caveatText.includes("administrative planning feed record only") || caveatText.includes("administrative record only"), `Missing administrative-only lifecycle caveat on ${candidate.candidate_id}`);',
    "validator candidate caveat check"
  );
  transformed = replaceRequired(
    transformed,
    '    assert(!/\\b(caused|causes|proved|proves|predicts|prediction|forecast|simulation)\\b/i.test(candidate.title + " " + candidate.observed_change), `Overclaim wording on ${candidate.candidate_id}`);',
    '    assert(!/\\b(proof|proved|proves|predict\\w*|forecast\\w*|simulation\\w*|causal|causation)\\b|impact score/i.test([candidate.title, candidate.summary, candidate.observed_change, candidate.limitations.join(" "), candidate.transformation_method].join(" ")), `Restricted lifecycle wording on ${candidate.candidate_id}`);',
    "validator restricted wording check"
  );
  transformed = replaceRequired(
    transformed,
    '      "no prediction/causation wording in title or observed_change"',
    '      "administrative-only wording in title and observed_change"',
    "validator report check wording"
  );

  assertContains(transformed, "MAX_PRIOR_ROUND = 398", "validator cutoff");
  assertContains(
    transformed,
    'CURRENT_ROUND_NAME = "round404_london_pld_lifecycle_next52"',
    "validator current round"
  );
  assertContains(transformed, "validation_report.json", "validation report writer");
  return transformed;
}

async function runTransformedFetch() {
  const source = fs.readFileSync(BASE_FETCH_SCRIPT, "utf8");
  const transformed = transformRound284Fetch(source);
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
    filename: "generated_round404_london_pld_lifecycle_next52_candidates.js"
  });
  if (typeof sandboxModule.exports !== "function") {
    throw new Error("Round404 transform did not export the fetch main() function.");
  }
  await sandboxModule.exports();
}

function normalizeSourceAuditProvenance() {
  const file = path.join(OUT_DIR, "source_audit.json");
  const sourceAudit = readJson(file);
  const license =
    "Not specified on the London Datastore dataset page as checked on 2026-05-20; retain attribution, official source URLs, and review terms before redistribution.";
  sourceAudit.source_audits = (sourceAudit.source_audits || []).map((audit) => ({
    ...audit,
    license: audit.license || license,
    accessed_at: audit.accessed_at || ACCESSED_AT
  }));
  writeJson(file, sourceAudit);
}

function runValidationReport() {
  const validatorSource = fs.readFileSync(BASE_VALIDATOR, "utf8");
  const transformed = transformRound284Validator(validatorSource);
  const sandboxModule = { exports: {} };
  const sandbox = {
    require,
    console,
    process,
    __dirname: OUT_DIR,
    module: sandboxModule,
    exports: sandboxModule.exports
  };
  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_validate_round404_pack.js"
  });
}

function writeValidationJson() {
  const report = readJson(path.join(OUT_DIR, "validation_report.json"));
  const validation = {
    ok: report.ok === true,
    validated_at: report.validated_at,
    validation_type: "round404_london_pld_lifecycle_next52_pack_validation",
    candidate_count: report.candidate_count,
    date_range: report.date_range,
    lifecycle_field_mix: report.lifecycle_field_mix,
    unique_event_ids: report.unique_event_ids,
    unique_source_date_keys: report.unique_source_date_keys,
    manual_field_date_keys_scanned: report.manual_field_date_keys_scanned,
    prior_field_date_keys_scanned: report.prior_field_date_keys_scanned,
    prior_pack_count_scanned: (report.prior_packs_scanned || []).length,
    report_file: "validation_report.json",
    checks: report.checks
  };
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
}

function writeReadbackJson() {
  const candidatesPack = readJson(path.join(OUT_DIR, "candidates.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const rejected = readJson(path.join(OUT_DIR, "rejected.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const validationReport = readJson(path.join(OUT_DIR, "validation_report.json"));
  const notes = fs.readFileSync(path.join(OUT_DIR, "notes.md"), "utf8");
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
  const files = Object.fromEntries(
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
  const ok =
    candidates.length === summary.candidate_count &&
    candidates.length === validation.candidate_count &&
    candidates.length === validationReport.candidate_count &&
    candidates.length === candidatesPack.candidate_count &&
    validation.ok === true &&
    validationReport.ok === true &&
    sourceIds.includes("gla-planning-datahub-applications") &&
    sourceIds.includes("london-planning-datahub-api/core") &&
    /source-reported administrative/i.test(notes);

  if (!ok) {
    throw new Error("Readback validation failed for Round404 output pack.");
  }

  writeJson(path.join(OUT_DIR, "readback.json"), {
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
      "notes retain administrative lifecycle caveat"
    ]
  });
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
  await runTransformedFetch();
  normalizeSourceAuditProvenance();
  runValidationReport();
  writeValidationJson();
  writeReadbackJson();
  assertGeneratedOutputLanguage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
