const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SOURCE_WRAPPER_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round604_nyc_dob_now_next58_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round604 wrapper transform failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound596Wrapper(source) {
  let transformed = source
    .replace(/fetch_round596_nyc_dob_now_next53_candidates/g, "fetch_round604_nyc_dob_now_next58_candidates")
    .replace(/round596_nyc_dob_now_next53/g, "round604_nyc_dob_now_next58")
    .replace(/nyc_dob_now_next53/g, "nyc_dob_now_next58")
    .replace(/Round596/g, "Round604")
    .replace(/round596/g, "round604")
    .replace(/Next53/g, "Next58")
    .replace(/next53/g, "next58")
    .replace(/THROUGH_591/g, "THROUGH_603")
    .replace(/Round591/g, "Round603")
    .replace(/round591/g, "round603")
    .replace(/Next52/g, "Next57")
    .replace(/next52/g, "next57")
    .replace(/through_round591/g, "through_round603")
    .replace(/round591_candidates_checked/g, "round603_candidates_checked")
    .replace(/contains_round591/g, "contains_round603")
    .replace(/round591_records/g, "round603_records")
    .replace(/round number <= 591/g, "round number <= 603")
    .replace(/<= 591/g, "<= 603")
    .replace(/> 591/g, "> 603")
    .replace(/cutoff_round: 591/g, "cutoff_round: 603")
    .replace(/dob_admin_round_cutoff: 591/g, "dob_admin_round_cutoff: 603")
    .replace(/dob_now_rounds_through: "round591"/g, 'dob_now_rounds_through: "round603"')
    .replace(/screened_prior_candidate_files_through_round591/g, "screened_prior_candidate_files_through_round603");

  transformed = replaceRequired(
    transformed,
    '  "round585",\\n  "round603"\\n];',
    '  "round585",\\n  "round591",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602",\\n  "round603"\\n];',
    "DOB NOW prior round list"
  );
  transformed = replaceRequired(
    transformed,
    '  "round583",\\n  "round585",\\n  "round603"\\n].join("|");',
    '  "round583",\\n  "round585",\\n  "round588",\\n  "round591",\\n  "round593",\\n  "round595",\\n  "round596",\\n  "round600",\\n  "round601",\\n  "round602",\\n  "round603"\\n].join("|");',
    "DOB administrative prior round regex"
  );
  transformed = replaceRequired(
    transformed,
    '"round592",\n    "round593",\n    "round594",\n    "round595"',
    '"round596_candidates_checked",\n    "round number <= 596",\n    "<= 596",\n    "> 596",\n    "cutoff_round: 596",\n    "dob_admin_round_cutoff: 596",\n    "round605",\n    "round606",\n    "round607"',
    "stale/future boundary token guard"
  );
  transformed = replaceRequired(
    transformed,
    'round604_nyc_dob_now_next5832/g, "round604_nyc_dob_now_next5853"',
    'round604_nyc_dob_now_next5832/g, "round604_nyc_dob_now_next58"',
    "generated round/name repair target"
  );
  transformed = replaceRequired(
    transformed,
    'nyc_dob_now_next5832/g, "nyc_dob_now_next5853"',
    'nyc_dob_now_next5832/g, "nyc_dob_now_next58"',
    "generated slug repair target"
  );
  transformed = replaceRequired(
    transformed,
    "  return source;\n}",
    `  source = source.replace(
    '    .replace(/round604_nyc_dob_now_next58/g, "round604_nyc_dob_now_next58")\\n    .replace(/nyc_dob_now_next58/g, "nyc_dob_now_next58");',
    '    .replace(/round604_nyc_dob_now_next5858/g, "round604_nyc_dob_now_next58")\\n    .replace(/nyc_dob_now_next5858/g, "nyc_dob_now_next58");'
  );
  return source;
}`,
    "template output directory repair insertion"
  );

  const required = [
    "fetch_round604_nyc_dob_now_next58_candidates",
    "round604_nyc_dob_now_next58",
    "round603_nyc_dob_now_next57",
    "THROUGH_603",
    "round603_candidates_checked",
    'dob_now_rounds_through: "round603"',
    '"round603"'
  ];
  const missing = required.filter((token) => !transformed.includes(token));
  if (missing.length) {
    throw new Error(`Round604 wrapper transform missed required tokens: ${missing.join(", ")}`);
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
