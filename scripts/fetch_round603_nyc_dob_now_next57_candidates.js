const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round603_nyc_dob_now_next57_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round603 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round603_nyc_dob_now_next57_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round603_nyc_dob_now_next57")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next57")
    .replace(/Round596/g, "Round603")
    .replace(/round596/g, "round603")
    .replace(/Next53/g, "Next57")
    .replace(/next53/g, "next57")
    .replace(/THROUGH_591/g, "THROUGH_602")
    .replace(/Round591/g, "Round602")
    .replace(/round591/g, "round602")
    .replace(/Next52/g, "Next56")
    .replace(/next52/g, "next56")
    .replace(/through_round591/g, "through_round602")
    .replace(/round591_candidates_checked/g, "round602_candidates_checked")
    .replace(/contains_round591/g, "contains_round602")
    .replace(/round591_records/g, "round602_records")
    .replace(/round number <= 591/g, "round number <= 602")
    .replace(/<= 591/g, "<= 602")
    .replace(/> 591/g, "> 602")
    .replace(/cutoff_round: 591/g, "cutoff_round: 602")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 602")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round602"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round602");

  transformed = replaceRequired(
    transformed,
    '  "round585",\\n  "round602"\\n];',
    '  "round585",\\n  "round591",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602"\\n];',
    "DOB NOW prior round list"
  );
  transformed = replaceRequired(
    transformed,
    '  "round583",\\n  "round585",\\n  "round602"\\n].join("|");',
    '  "round583",\\n  "round585",\\n  "round588",\\n  "round591",\\n  "round593",\\n  "round595",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602"\\n].join("|");',
    "DOB administrative prior round regex"
  );
  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round596_candidates_checked",\n    "round number <= 596",\n    "<= 596",\n    "> 596",\n    "cutoff_round: 596",\n    "dob_admin_round_cutoff: 596",\n    "round604",\n    "round605",\n    "round606"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round603_nyc_dob_now_next5732/g, "round603_nyc_dob_now_next5753"',
    'round603_nyc_dob_now_next5732/g, "round603_nyc_dob_now_next57"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5732/g, "nyc_dob_now_next5753"',
    'nyc_dob_now_next5732/g, "nyc_dob_now_next57"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round603_nyc_dob_now_next57/g, "round603_nyc_dob_now_next57")\\n    .replace(/nyc_dob_now_next57/g, "nyc_dob_now_next57");',
    '    .replace(/round603_nyc_dob_now_next5757/g, "round603_nyc_dob_now_next57")\\n    .replace(/nyc_dob_now_next5757/g, "nyc_dob_now_next57");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round603_nyc_dob_now_next57_candidates",
    "round603_nyc_dob_now_next57",
    "round602_nyc_dob_now_next56",
    "THROUGH_602",
    "round602_candidates_checked",
    'dob_now_rounds_through: "round602"',
    '"round602"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round603 wrapper transform missed required tokens: ${missing.join(", ")}`);
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
