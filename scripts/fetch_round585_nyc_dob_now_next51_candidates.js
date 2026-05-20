const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round585_nyc_dob_now_next51_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round585 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round585 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound585Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round585_nyc_dob_now_next51_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round585_nyc_dob_now_next51")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next51")
    .replace(/Round480/g, "Round585")
    .replace(/round480/g, "round585")
    .replace(/Next32/g, "Next51")
    .replace(/next32/g, "next51")
    .replace(/round585_nyc_dob_now_next5151/g, "round585_nyc_dob_now_next51")
    .replace(/nyc_dob_now_next5151/g, "nyc_dob_now_next51")
    .replace(/round585_nyc_dob_now_next5132/g, "round585_nyc_dob_now_next5151")
    .replace(/nyc_dob_now_next5132/g, "nyc_dob_now_next5151")
    .replace(/THROUGH_473/g, "THROUGH_581")
    .replace(/Round473/g, "Round581")
    .replace(/round473/g, "round581")
    .replace(/through_round473/g, "through_round581")
    .replace(/round473_candidates_checked/g, "round581_candidates_checked")
    .replace(/contains_round473/g, "contains_round581")
    .replace(/round473_records/g, "round581_records")
    .replace(/round number <= 473/g, "round number <= 581")
    .replace(/<= 473/g, "<= 581")
    .replace(/> 473/g, "> 581")
    .replace(/cutoff_round: 473/g, "cutoff_round: 581")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 581")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round581"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round581");

  source = replaceOnce(
    source,
    '  "round581"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556",\n  "round561",\n  "round566",\n  "round571",\n  "round575",\n  "round581"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round581"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556",\n  "round558",\n  "round561",\n  "round563",\n  "round566",\n  "round568",\n  "round571",\n  "round572",\n  "round574",\n  "round575",\n  "round578",\n  "round581"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round581_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round581_nyc_dob_now_next50/candidates.json",
    "strict audit named Round581 boundary path"
  );
  source = replaceRequired(
    source,
    "/round581_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round581_nyc_dob_now_next50\\/candidates\\.json/i",
    "strict audit Round581 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round581") || text.includes("Round581") || text.includes("nyc_dob_now_next31")',
    'text.includes("round581") || text.includes("Round581") || text.includes("nyc_dob_now_next50")',
    "manual corpus Round581 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next51",
    "Round473",
    "through_round473",
    "round473_candidates_checked",
    "round number <= 473",
    "<= 473",
    "> 473",
    "cutoff_round: 473",
    "dob_admin_round_cutoff: 473",
    "round575_candidates_checked",
    "round number <= 575",
    "<= 575",
    "> 575",
    "cutoff_round: 575",
    "dob_admin_round_cutoff: 575",
    "round582",
    "round583",
    "round584"
  ];
  const remaining = forbidden.filter((token) => source.includes(token));
  if (remaining.length) {
    throw new Error(`Round585 source patch left stale boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round581_nyc_dob_now_next50")) {
    throw new Error("Round585 source patch did not preserve the Round581 dedupe boundary reference.");
  }
  if (!source.includes("round585_nyc_dob_now_next51")) {
    throw new Error("Round585 source patch did not create the Round585 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round581"')) {
    throw new Error("Round585 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round581"')) {
    throw new Error("Round585 source patch did not include the Round581 DOB NOW pack in the duplicate scan.");
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

vm.runInNewContext(buildRound585Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
