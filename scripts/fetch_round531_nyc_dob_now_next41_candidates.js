const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round531_nyc_dob_now_next41_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round531 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round531 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound531Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round531_nyc_dob_now_next41_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round531_nyc_dob_now_next41")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next41")
    .replace(/Round480/g, "Round531")
    .replace(/round480/g, "round531")
    .replace(/Next32/g, "Next41")
    .replace(/next32/g, "next41")
    .replace(/round531_nyc_dob_now_next4141/g, "round531_nyc_dob_now_next41")
    .replace(/nyc_dob_now_next4141/g, "nyc_dob_now_next41")
    .replace(/round531_nyc_dob_now_next4132/g, "round531_nyc_dob_now_next4141")
    .replace(/nyc_dob_now_next4132/g, "nyc_dob_now_next4141")
    .replace(/THROUGH_473/g, "THROUGH_524")
    .replace(/Round473/g, "Round524")
    .replace(/through_round473/g, "through_round524")
    .replace(/round473_candidates_checked/g, "round524_candidates_checked")
    .replace(/contains_round473/g, "contains_round524")
    .replace(/round473_records/g, "round524_records")
    .replace(/round number <= 473/g, "round number <= 524")
    .replace(/<= 473/g, "<= 524")
    .replace(/> 473/g, "> 524")
    .replace(/cutoff_round: 473/g, "cutoff_round: 524")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 524")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round524"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round524");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round524"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round524_nyc_dob_now_next40/candidates.json",
    "strict audit named Round524 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round524_nyc_dob_now_next40\\/candidates\\.json/i",
    "strict audit Round524 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round524") || text.includes("nyc_dob_now_next31")',
    'text.includes("round524") || text.includes("Round524") || text.includes("nyc_dob_now_next40")',
    "manual corpus Round524 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next41",
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
    throw new Error(`Round531 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round524_nyc_dob_now_next40")) {
    throw new Error("Round531 source patch did not preserve the Round524 dedupe boundary reference.");
  }
  if (!source.includes("round531_nyc_dob_now_next41")) {
    throw new Error("Round531 source patch did not create the Round531 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round524"')) {
    throw new Error("Round531 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round524"')) {
    throw new Error("Round531 source patch did not include the Round524 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round525") || source.includes("round530")) {
    throw new Error("Round531 source patch unexpectedly included disjoint future rounds beyond the requested Round524 boundary.");
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

vm.runInNewContext(buildRound531Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
