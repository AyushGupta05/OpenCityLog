const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round581_nyc_dob_now_next50_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round581 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round581 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound581Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round581_nyc_dob_now_next50_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round581_nyc_dob_now_next50")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next50")
    .replace(/Round480/g, "Round581")
    .replace(/round480/g, "round581")
    .replace(/Next32/g, "Next50")
    .replace(/next32/g, "next50")
    .replace(/round581_nyc_dob_now_next5050/g, "round581_nyc_dob_now_next50")
    .replace(/nyc_dob_now_next5050/g, "nyc_dob_now_next50")
    .replace(/round581_nyc_dob_now_next5032/g, "round581_nyc_dob_now_next5050")
    .replace(/nyc_dob_now_next5032/g, "nyc_dob_now_next5050")
    .replace(/THROUGH_473/g, "THROUGH_575")
    .replace(/Round473/g, "Round575")
    .replace(/round473/g, "round575")
    .replace(/through_round473/g, "through_round575")
    .replace(/round473_candidates_checked/g, "round575_candidates_checked")
    .replace(/contains_round473/g, "contains_round575")
    .replace(/round473_records/g, "round575_records")
    .replace(/round number <= 473/g, "round number <= 575")
    .replace(/<= 473/g, "<= 575")
    .replace(/> 473/g, "> 575")
    .replace(/cutoff_round: 473/g, "cutoff_round: 575")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 575")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round575"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round575");

  source = replaceOnce(
    source,
    '  "round575"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556",\n  "round561",\n  "round566",\n  "round571",\n  "round575"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round575"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556",\n  "round558",\n  "round561",\n  "round563",\n  "round566",\n  "round568",\n  "round571",\n  "round572",\n  "round574",\n  "round575"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round575_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round575_nyc_dob_now_next49/candidates.json",
    "strict audit named Round575 boundary path"
  );
  source = replaceRequired(
    source,
    "/round575_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round575_nyc_dob_now_next49\\/candidates\\.json/i",
    "strict audit Round575 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round575") || text.includes("Round575") || text.includes("nyc_dob_now_next31")',
    'text.includes("round575") || text.includes("Round575") || text.includes("nyc_dob_now_next49")',
    "manual corpus Round575 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next50",
    "Round473",
    "through_round473",
    "round473_candidates_checked",
    "round number <= 473",
    "<= 473",
    "> 473",
    "cutoff_round: 473",
    "dob_admin_round_cutoff: 473",
    "round571_candidates_checked",
    "round number <= 571",
    "<= 571",
    "> 571",
    "cutoff_round: 571",
    "dob_admin_round_cutoff: 571"
  ];
  const remaining = forbidden.filter((token) => source.includes(token));
  if (remaining.length) {
    throw new Error(`Round581 source patch left stale boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round575_nyc_dob_now_next49")) {
    throw new Error("Round581 source patch did not preserve the Round575 dedupe boundary reference.");
  }
  if (!source.includes("round581_nyc_dob_now_next50")) {
    throw new Error("Round581 source patch did not create the Round581 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round575"')) {
    throw new Error("Round581 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round575"')) {
    throw new Error("Round581 source patch did not include the Round575 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round576") || source.includes("round577") || source.includes("round578") || source.includes("round579") || source.includes("round580")) {
    throw new Error("Round581 source patch unexpectedly included future/disjoint rounds beyond the requested Round575 boundary.");
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

vm.runInNewContext(buildRound581Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
