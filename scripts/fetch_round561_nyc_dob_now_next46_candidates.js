const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round561_nyc_dob_now_next46_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round561 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round561 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound561Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round561_nyc_dob_now_next46_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round561_nyc_dob_now_next46")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next46")
    .replace(/Round480/g, "Round561")
    .replace(/round480/g, "round561")
    .replace(/Next32/g, "Next46")
    .replace(/next32/g, "next46")
    .replace(/round561_nyc_dob_now_next4646/g, "round561_nyc_dob_now_next46")
    .replace(/nyc_dob_now_next4646/g, "nyc_dob_now_next46")
    .replace(/round561_nyc_dob_now_next4632/g, "round561_nyc_dob_now_next4646")
    .replace(/nyc_dob_now_next4632/g, "nyc_dob_now_next4646")
    .replace(/THROUGH_473/g, "THROUGH_556")
    .replace(/Round473/g, "Round556")
    .replace(/through_round473/g, "through_round556")
    .replace(/round473_candidates_checked/g, "round556_candidates_checked")
    .replace(/contains_round473/g, "contains_round556")
    .replace(/round473_records/g, "round556_records")
    .replace(/round number <= 473/g, "round number <= 556")
    .replace(/<= 473/g, "<= 556")
    .replace(/> 473/g, "> 556")
    .replace(/cutoff_round: 473/g, "cutoff_round: 556")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 556")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round556"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round556");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round556_nyc_dob_now_next45/candidates.json",
    "strict audit named Round556 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round556_nyc_dob_now_next45\\/candidates\\.json/i",
    "strict audit Round556 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round556") || text.includes("nyc_dob_now_next31")',
    'text.includes("round556") || text.includes("Round556") || text.includes("nyc_dob_now_next45")',
    "manual corpus Round556 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next46",
    "Round473",
    "through_round473",
    "round473_candidates_checked",
    "round number <= 473",
    "<= 473",
    "> 473",
    "cutoff_round: 473",
    "dob_admin_round_cutoff: 473"
  ];
  const remaining = forbidden.filter((token) => source.includes(token));
  if (remaining.length) {
    throw new Error(`Round561 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round556_nyc_dob_now_next45")) {
    throw new Error("Round561 source patch did not preserve the Round556 dedupe boundary reference.");
  }
  if (!source.includes("round561_nyc_dob_now_next46")) {
    throw new Error("Round561 source patch did not create the Round561 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round556"')) {
    throw new Error("Round561 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round556"')) {
    throw new Error("Round561 source patch did not include the Round556 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round557") || source.includes("round558")) {
    throw new Error("Round561 source patch unexpectedly included future/disjoint rounds beyond the requested Round556 boundary.");
  }

  return source;
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

vm.runInNewContext(buildRound561Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
