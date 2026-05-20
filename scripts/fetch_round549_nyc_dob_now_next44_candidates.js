const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round549_nyc_dob_now_next44_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round549 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round549 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound549Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round549_nyc_dob_now_next44_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round549_nyc_dob_now_next44")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next44")
    .replace(/Round480/g, "Round549")
    .replace(/round480/g, "round549")
    .replace(/Next32/g, "Next44")
    .replace(/next32/g, "next44")
    .replace(/round549_nyc_dob_now_next4444/g, "round549_nyc_dob_now_next44")
    .replace(/nyc_dob_now_next4444/g, "nyc_dob_now_next44")
    .replace(/round549_nyc_dob_now_next4432/g, "round549_nyc_dob_now_next4444")
    .replace(/nyc_dob_now_next4432/g, "nyc_dob_now_next4444")
    .replace(/THROUGH_473/g, "THROUGH_546")
    .replace(/Round473/g, "Round546")
    .replace(/through_round473/g, "through_round546")
    .replace(/round473_candidates_checked/g, "round546_candidates_checked")
    .replace(/contains_round473/g, "contains_round546")
    .replace(/round473_records/g, "round546_records")
    .replace(/round number <= 473/g, "round number <= 546")
    .replace(/<= 473/g, "<= 546")
    .replace(/> 473/g, "> 546")
    .replace(/cutoff_round: 473/g, "cutoff_round: 546")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 546")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round546"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round546");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round546_nyc_dob_now_next43/candidates.json",
    "strict audit named Round546 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round546_nyc_dob_now_next43\\/candidates\\.json/i",
    "strict audit Round546 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round546") || text.includes("nyc_dob_now_next31")',
    'text.includes("round546") || text.includes("Round546") || text.includes("nyc_dob_now_next43")',
    "manual corpus Round546 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next44",
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
    throw new Error(`Round549 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round546_nyc_dob_now_next43")) {
    throw new Error("Round549 source patch did not preserve the Round546 dedupe boundary reference.");
  }
  if (!source.includes("round549_nyc_dob_now_next44")) {
    throw new Error("Round549 source patch did not create the Round549 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round546"')) {
    throw new Error("Round549 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round546"')) {
    throw new Error("Round549 source patch did not include the Round546 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round548") || source.includes("round550")) {
    throw new Error("Round549 source patch unexpectedly included future/disjoint rounds beyond the requested Round546 boundary.");
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

vm.runInNewContext(buildRound549Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
