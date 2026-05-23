const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round602_nyc_dob_now_next56_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round602 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round602_nyc_dob_now_next56_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round602_nyc_dob_now_next56")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next56")
    .replace(/Round596/g, "Round602")
    .replace(/round596/g, "round602")
    .replace(/Next53/g, "Next56")
    .replace(/next53/g, "next56")
    .replace(/THROUGH_591/g, "THROUGH_601")
    .replace(/Round591/g, "Round601")
    .replace(/round591/g, "round601")
    .replace(/Next52/g, "Next55")
    .replace(/next52/g, "next55")
    .replace(/through_round591/g, "through_round601")
    .replace(/round591_candidates_checked/g, "round601_candidates_checked")
    .replace(/contains_round591/g, "contains_round601")
    .replace(/round591_records/g, "round601_records")
    .replace(/round number <= 591/g, "round number <= 601")
    .replace(/<= 591/g, "<= 601")
    .replace(/> 591/g, "> 601")
    .replace(/cutoff_round: 591/g, "cutoff_round: 601")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 601")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round601"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round601");

  transformed = replaceRequired(
    transformed,
    '  "round585",\\n  "round601"\\n];',
    '  "round585",\\n  "round591",\\n  "round596",\\n  "round600",\\n  "round601"\\n];',
    "DOB NOW prior round list"
  );
  transformed = replaceRequired(
    transformed,
    '  "round583",\\n  "round585",\\n  "round601"\\n].join("|");',
    '  "round583",\\n  "round585",\\n  "round588",\\n  "round591",\\n  "round593",\\n  "round595",\\n  "round596",\\n  "round600",\\n  "round601"\\n].join("|");',
    "DOB administrative prior round regex"
  );
  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round596_candidates_checked",\n    "round number <= 596",\n    "<= 596",\n    "> 596",\n    "cutoff_round: 596",\n    "dob_admin_round_cutoff: 596",\n    "round603",\n    "round604",\n    "round605"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round602_nyc_dob_now_next5632/g, "round602_nyc_dob_now_next5653"',
    'round602_nyc_dob_now_next5632/g, "round602_nyc_dob_now_next56"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5632/g, "nyc_dob_now_next5653"',
    'nyc_dob_now_next5632/g, "nyc_dob_now_next56"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round602_nyc_dob_now_next56/g, "round602_nyc_dob_now_next56")\\n    .replace(/nyc_dob_now_next56/g, "nyc_dob_now_next56");',
    '    .replace(/round602_nyc_dob_now_next5656/g, "round602_nyc_dob_now_next56")\\n    .replace(/nyc_dob_now_next5656/g, "nyc_dob_now_next56");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round602_nyc_dob_now_next56_candidates",
    "round602_nyc_dob_now_next56",
    "round601_nyc_dob_now_next55",
    "THROUGH_601",
    "round601_candidates_checked",
    'dob_now_rounds_through: "round601"',
    '"round601"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round602 wrapper transform missed required tokens: ${missing.join(", ")}`);
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
