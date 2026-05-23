const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round601_nyc_dob_now_next55_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round601 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round601_nyc_dob_now_next55_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round601_nyc_dob_now_next55")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next55")
    .replace(/Round596/g, "Round601")
    .replace(/round596/g, "round601")
    .replace(/Next53/g, "Next55")
    .replace(/next53/g, "next55")
    .replace(/THROUGH_591/g, "THROUGH_600")
    .replace(/Round591/g, "Round600")
    .replace(/round591/g, "round600")
    .replace(/Next52/g, "Next54")
    .replace(/next52/g, "next54")
    .replace(/through_round591/g, "through_round600")
    .replace(/round591_candidates_checked/g, "round600_candidates_checked")
    .replace(/contains_round591/g, "contains_round600")
    .replace(/round591_records/g, "round600_records")
    .replace(/round number <= 591/g, "round number <= 600")
    .replace(/<= 591/g, "<= 600")
    .replace(/> 591/g, "> 600")
    .replace(/cutoff_round: 591/g, "cutoff_round: 600")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 600")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round600"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round600");

  transformed = replaceRequired(
    transformed,
    '  "round585",\\n  "round600"\\n];',
    '  "round585",\\n  "round591",\\n  "round596",\\n  "round600"\\n];',
    "DOB NOW prior round list"
  );
  transformed = replaceRequired(
    transformed,
    '  "round583",\\n  "round585",\\n  "round600"\\n].join("|");',
    '  "round583",\\n  "round585",\\n  "round588",\\n  "round591",\\n  "round593",\\n  "round595",\\n  "round596",\\n  "round600"\\n].join("|");',
    "DOB administrative prior round regex"
  );
  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round596_candidates_checked",\n    "round number <= 596",\n    "<= 596",\n    "> 596",\n    "cutoff_round: 596",\n    "dob_admin_round_cutoff: 596",\n    "round602",\n    "round603",\n    "round604"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round601_nyc_dob_now_next5532/g, "round601_nyc_dob_now_next5553"',
    'round601_nyc_dob_now_next5532/g, "round601_nyc_dob_now_next55"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5532/g, "nyc_dob_now_next5553"',
    'nyc_dob_now_next5532/g, "nyc_dob_now_next55"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round601_nyc_dob_now_next55/g, "round601_nyc_dob_now_next55")\\n    .replace(/nyc_dob_now_next55/g, "nyc_dob_now_next55");',
    '    .replace(/round601_nyc_dob_now_next5555/g, "round601_nyc_dob_now_next55")\\n    .replace(/nyc_dob_now_next5555/g, "nyc_dob_now_next55");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round601_nyc_dob_now_next55_candidates",
    "round601_nyc_dob_now_next55",
    "round600_nyc_dob_now_next54",
    "THROUGH_600",
    "round600_candidates_checked",
    'dob_now_rounds_through: "round600"',
    '"round600"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round601 wrapper transform missed required tokens: ${missing.join(", ")}`);
  }
  return transformed;
}

const sandbox = {
  Buffer,
  URL,
  clearTimeout,
  console,
  fetch,
  module: { exports: {} },
  process,
  require,
  setTimeout,
  __dirname: path.dirname(path.resolve(SCRIPT_PATH)),
  __filename: path.resolve(SCRIPT_PATH)
};

vm.runInNewContext(transformRound596Wrapper(fs.readFileSync(SOURCE_WRAPPER_PATH, "utf8")), sandbox, {
  filename: path.resolve(SCRIPT_PATH)
});
