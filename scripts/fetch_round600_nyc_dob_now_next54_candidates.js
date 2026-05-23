const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round600_nyc_dob_now_next54_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round600 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round600_nyc_dob_now_next54_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round600_nyc_dob_now_next54")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next54")
    .replace(/Round596/g, "Round600")
    .replace(/round596/g, "round600")
    .replace(/Next53/g, "Next54")
    .replace(/next53/g, "next54")
    .replace(/THROUGH_591/g, "THROUGH_596")
    .replace(/Round591/g, "Round596")
    .replace(/round591/g, "round596")
    .replace(/Next52/g, "Next53")
    .replace(/next52/g, "next53")
    .replace(/through_round591/g, "through_round596")
    .replace(/round591_candidates_checked/g, "round596_candidates_checked")
    .replace(/contains_round591/g, "contains_round596")
    .replace(/round591_records/g, "round596_records")
    .replace(/round number <= 591/g, "round number <= 596")
    .replace(/<= 591/g, "<= 596")
    .replace(/> 591/g, "> 596")
    .replace(/cutoff_round: 591/g, "cutoff_round: 596")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 596")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round596"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round596");

  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round591_candidates_checked",\n    "round number <= 591",\n    "<= 591",\n    "> 591",\n    "cutoff_round: 591",\n    "dob_admin_round_cutoff: 591",\n    "round597",\n    "round598",\n    "round599"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round600_nyc_dob_now_next5432/g, "round600_nyc_dob_now_next5453"',
    'round600_nyc_dob_now_next5432/g, "round600_nyc_dob_now_next54"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5432/g, "nyc_dob_now_next5453"',
    'nyc_dob_now_next5432/g, "nyc_dob_now_next54"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round600_nyc_dob_now_next54/g, "round600_nyc_dob_now_next54")\\n    .replace(/nyc_dob_now_next54/g, "nyc_dob_now_next54");',
    '    .replace(/round600_nyc_dob_now_next5454/g, "round600_nyc_dob_now_next54")\\n    .replace(/nyc_dob_now_next5454/g, "nyc_dob_now_next54");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round600_nyc_dob_now_next54_candidates",
    "round600_nyc_dob_now_next54",
    "round596_nyc_dob_now_next53",
    "THROUGH_596",
    "round596_candidates_checked",
    'dob_now_rounds_through: "round596"',
    '"round596"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round600 wrapper transform missed required tokens: ${missing.join(", ")}`);
  }
  const forbidden = [];
  const remaining = forbidden.filter((token) => transformed.includes(token));
  if (remaining.length) {
    throw new Error(`Round600 wrapper transform left stale tokens: ${remaining.join(", ")}`);
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
