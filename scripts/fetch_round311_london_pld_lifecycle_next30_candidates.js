const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND_NAME = "round311_london_pld_lifecycle_next30";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const BASE_FETCH_SCRIPT = path.join(ROOT, "scripts", "fetch_round284_london_pld_lifecycle_next25_candidates.js");
const BASE_VALIDATOR = path.join(
  ROOT,
  "tmp",
  "subagents",
  "round284_london_pld_lifecycle_next25",
  "validate_round284_pack.js"
);
const OUTPUT_FILES = ["candidates.json", "source_audit.json", "summary.json", "notes.md", "rejected.json"];
const RESTRICTED_OUTPUT_LANGUAGE =
  /\b(proof|proved|proves|predict\w*|forecast\w*|simulation\w*|causal|causation)\b|impact score/i;

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round311 source transform failed to include ${label}: ${needle}`);
  }
}

function assertAbsent(value, needle, label) {
  if (value.includes(needle)) {
    throw new Error(`Round311 source transform retained ${label}: ${needle}`);
  }
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round311 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
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
    .replace(/const ROUND = "round284";/, 'const ROUND = "round311";')
    .replace(
      /const ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const ROUND_NAME = "round311_london_pld_lifecycle_next30";'
    )
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 306;")
    .replace(/Bims5Round284PldLifecycleNext25/g, "Bims5Round311PldLifecycleNext30")
    .replace(/round284_london_pld_lifecycle_next25/g, "round311_london_pld_lifecycle_next30")
    .replace(/round284\.london_pld_lifecycle_next25/g, "round311.london_pld_lifecycle_next30")
    .replace(/Round284/g, "Round311")
    .replace(/Round 284/g, "Round 311")
    .replace(/round284/g, "round311")
    .replace(/next25/g, "next30")
    .replace(/through round276/g, "through round306")
    .replace(
      /round272, and round276/g,
      "round272, round276, round284, round288, round298, round301, and round306"
    );

  transformed = transformed.replace(
    /  "round276_london_pld_lifecycle_next24"\n\];/,
    '  "round276_london_pld_lifecycle_next24",\n  "round284_london_pld_lifecycle_next25",\n  "round288_london_pld_lifecycle_next26",\n  "round298_london_pld_lifecycle_next27",\n  "round301_london_pld_lifecycle_next28",\n  "round306_london_pld_lifecycle_next29"\n];'
  );

  transformed = tightenLifecycleLanguage(transformed);

  transformed = transformed.replace(
    /main\(\)\.catch\(\(error\) => \{\s+console\.error\(error\);\s+process\.exit\(1\);\s+\}\);\s*$/,
    "module.exports = main;\n"
  );

  assertContains(transformed, 'const ROUND = "round311";', "round id");
  assertContains(transformed, "round284_london_pld_lifecycle_next25", "prior round284 pack");
  assertContains(transformed, "round288_london_pld_lifecycle_next26", "prior round288 pack");
  assertContains(transformed, "round298_london_pld_lifecycle_next27", "prior round298 pack");
  assertContains(transformed, "round301_london_pld_lifecycle_next28", "prior round301 pack");
  assertContains(transformed, "round306_london_pld_lifecycle_next29", "prior round306 pack");
  assertContains(transformed, "through round306", "dedupe cutoff");
  assertContains(transformed, "module.exports = main;", "exported main");
  return transformed;
}

function transformRound284Validator(source) {
  let transformed = source
    .replace(/const MAX_PRIOR_ROUND = 276;/, "const MAX_PRIOR_ROUND = 306;")
    .replace(
      /const CURRENT_ROUND_NAME = "round284_london_pld_lifecycle_next25";/,
      'const CURRENT_ROUND_NAME = "round311_london_pld_lifecycle_next30";'
    )
    .replace(/round284_london_pld_lifecycle_next25/g, "round311_london_pld_lifecycle_next30")
    .replace(/round284/g, "round311")
    .replace(/round284:/g, "round311:")
    .replace(/round276/g, "round306");

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

  assertContains(transformed, "MAX_PRIOR_ROUND = 306", "validator cutoff");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round311_london_pld_lifecycle_next30"', "validator current round");
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
    filename: "generated_round311_london_pld_lifecycle_next30_candidates.js"
  });
  if (typeof sandboxModule.exports !== "function") {
    throw new Error("Round311 transform did not export the fetch main() function.");
  }
  await sandboxModule.exports();
}

function writeValidator() {
  const validatorSource = fs.readFileSync(BASE_VALIDATOR, "utf8");
  const transformed = transformRound284Validator(validatorSource);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "validate_round311_pack.js"), transformed);
}

function assertGeneratedOutputLanguage() {
  for (const name of OUTPUT_FILES) {
    const file = path.join(OUT_DIR, name);
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(RESTRICTED_OUTPUT_LANGUAGE);
    if (match) {
      throw new Error(`Restricted lifecycle wording in ${path.relative(ROOT, file)}: ${match[0]}`);
    }
  }
}

async function main() {
  writeValidator();
  await runTransformedFetch();
  assertGeneratedOutputLanguage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
