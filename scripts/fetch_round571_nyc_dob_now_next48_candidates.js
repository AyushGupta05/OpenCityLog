const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round571_nyc_dob_now_next48_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round571 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round571 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound571Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round571_nyc_dob_now_next48_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round571_nyc_dob_now_next48")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next48")
    .replace(/Round480/g, "Round571")
    .replace(/round480/g, "round571")
    .replace(/Next32/g, "Next48")
    .replace(/next32/g, "next48")
    .replace(/round571_nyc_dob_now_next4848/g, "round571_nyc_dob_now_next48")
    .replace(/nyc_dob_now_next4848/g, "nyc_dob_now_next48")
    .replace(/round571_nyc_dob_now_next4832/g, "round571_nyc_dob_now_next4848")
    .replace(/nyc_dob_now_next4832/g, "nyc_dob_now_next4848")
    .replace(/THROUGH_473/g, "THROUGH_566")
    .replace(/Round473/g, "Round566")
    .replace(/round473/g, "round566")
    .replace(/through_round473/g, "through_round566")
    .replace(/round473_candidates_checked/g, "round566_candidates_checked")
    .replace(/contains_round473/g, "contains_round566")
    .replace(/round473_records/g, "round566_records")
    .replace(/round number <= 473/g, "round number <= 566")
    .replace(/<= 473/g, "<= 566")
    .replace(/> 473/g, "> 566")
    .replace(/cutoff_round: 473/g, "cutoff_round: 566")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 566")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round566"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round566");

  source = replaceOnce(
    source,
    '  "round566"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556",\n  "round561",\n  "round566"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round566"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556",\n  "round558",\n  "round561",\n  "round563",\n  "round566"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round566_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round566_nyc_dob_now_next47/candidates.json",
    "strict audit named Round566 boundary path"
  );
  source = replaceRequired(
    source,
    "/round566_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round566_nyc_dob_now_next47\\/candidates\\.json/i",
    "strict audit Round566 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round566") || text.includes("Round566") || text.includes("nyc_dob_now_next31")',
    'text.includes("round566") || text.includes("Round566") || text.includes("nyc_dob_now_next47")',
    "manual corpus Round566 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next48",
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
    throw new Error(`Round571 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round566_nyc_dob_now_next47")) {
    throw new Error("Round571 source patch did not preserve the Round566 dedupe boundary reference.");
  }
  if (!source.includes("round571_nyc_dob_now_next48")) {
    throw new Error("Round571 source patch did not create the Round571 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round566"')) {
    throw new Error("Round571 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round566"')) {
    throw new Error("Round571 source patch did not include the Round566 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round567") || source.includes("round568")) {
    throw new Error("Round571 source patch unexpectedly included future/disjoint rounds beyond the requested Round566 boundary.");
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

vm.runInNewContext(buildRound571Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
