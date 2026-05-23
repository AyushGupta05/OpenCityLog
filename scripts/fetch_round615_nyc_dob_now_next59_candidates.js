const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round615_nyc_dob_now_next59_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round615 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round615_nyc_dob_now_next59_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round615_nyc_dob_now_next59")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next59")
    .replace(/Round596/g, "Round615")
    .replace(/round596/g, "round615")
    .replace(/Next53/g, "Next59")
    .replace(/next53/g, "next59")
    .replace(/THROUGH_591/g, "THROUGH_604")
    .replace(/Round591/g, "Round604")
    .replace(/round591/g, "round604")
    .replace(/Next52/g, "Next58")
    .replace(/next52/g, "next58")
    .replace(/through_round591/g, "through_round604")
    .replace(/round591_candidates_checked/g, "round604_candidates_checked")
    .replace(/contains_round591/g, "contains_round604")
    .replace(/round591_records/g, "round604_records")
    .replace(/round number <= 591/g, "round number <= 604")
    .replace(/<= 591/g, "<= 604")
    .replace(/> 591/g, "> 604")
    .replace(/cutoff_round: 591/g, "cutoff_round: 604")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 604")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round604"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round604");

  transformed = replaceRequired(
    transformed,
    '  "round585",\\n  "round604"\\n];',
    '  "round585",\\n  "round591",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602",\\n  "round603",\\n  "round604"\\n];',
    "DOB NOW prior round list"
  );
  transformed = replaceRequired(
    transformed,
    '  "round583",\\n  "round585",\\n  "round604"\\n].join("|");',
    '  "round583",\\n  "round585",\\n  "round588",\\n  "round591",\\n  "round593",\\n  "round595",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602",\\n  "round603",\\n  "round604"\\n].join("|");',
    "DOB administrative prior round regex"
  );
  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round596_candidates_checked",\n    "round number <= 596",\n    "<= 596",\n    "> 596",\n    "cutoff_round: 596",\n    "dob_admin_round_cutoff: 596",\n    "round616",\n    "round617",\n    "round618"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round615_nyc_dob_now_next5932/g, "round615_nyc_dob_now_next5953"',
    'round615_nyc_dob_now_next5932/g, "round615_nyc_dob_now_next59"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5932/g, "nyc_dob_now_next5953"',
    'nyc_dob_now_next5932/g, "nyc_dob_now_next59"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round615_nyc_dob_now_next59/g, "round615_nyc_dob_now_next59")\\n    .replace(/nyc_dob_now_next59/g, "nyc_dob_now_next59");',
    '    .replace(/round615_nyc_dob_now_next5959/g, "round615_nyc_dob_now_next59")\\n    .replace(/nyc_dob_now_next5959/g, "nyc_dob_now_next59");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round615_nyc_dob_now_next59_candidates",
    "round615_nyc_dob_now_next59",
    "round604_nyc_dob_now_next58",
    "THROUGH_604",
    "round604_candidates_checked",
    'dob_now_rounds_through: "round604"',
    '"round604"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round615 wrapper transform missed required tokens: ${missing.join(", ")}`);
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
