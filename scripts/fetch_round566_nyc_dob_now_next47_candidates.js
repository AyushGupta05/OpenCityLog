const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round566_nyc_dob_now_next47_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round566 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round566 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound566Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round566_nyc_dob_now_next47_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round566_nyc_dob_now_next47")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next47")
    .replace(/Round480/g, "Round566")
    .replace(/round480/g, "round566")
    .replace(/Next32/g, "Next47")
    .replace(/next32/g, "next47")
    .replace(/round566_nyc_dob_now_next4747/g, "round566_nyc_dob_now_next47")
    .replace(/nyc_dob_now_next4747/g, "nyc_dob_now_next47")
    .replace(/round566_nyc_dob_now_next4732/g, "round566_nyc_dob_now_next4747")
    .replace(/nyc_dob_now_next4732/g, "nyc_dob_now_next4747")
    .replace(/THROUGH_473/g, "THROUGH_561")
    .replace(/Round473/g, "Round561")
    .replace(/round473/g, "round561")
    .replace(/through_round473/g, "through_round561")
    .replace(/round473_candidates_checked/g, "round561_candidates_checked")
    .replace(/contains_round473/g, "contains_round561")
    .replace(/round473_records/g, "round561_records")
    .replace(/round number <= 473/g, "round number <= 561")
    .replace(/<= 473/g, "<= 561")
    .replace(/> 473/g, "> 561")
    .replace(/cutoff_round: 473/g, "cutoff_round: 561")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 561")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round561"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round561");

  source = replaceOnce(
    source,
    '  "round561"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556",\n  "round561"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round561"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556",\n  "round561"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round561_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round561_nyc_dob_now_next46/candidates.json",
    "strict audit named Round561 boundary path"
  );
  source = replaceRequired(
    source,
    "/round561_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round561_nyc_dob_now_next46\\/candidates\\.json/i",
    "strict audit Round561 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round561") || text.includes("Round561") || text.includes("nyc_dob_now_next31")',
    'text.includes("round561") || text.includes("Round561") || text.includes("nyc_dob_now_next46")',
    "manual corpus Round561 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next47",
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
    throw new Error(`Round566 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round561_nyc_dob_now_next46")) {
    throw new Error("Round566 source patch did not preserve the Round561 dedupe boundary reference.");
  }
  if (!source.includes("round566_nyc_dob_now_next47")) {
    throw new Error("Round566 source patch did not create the Round566 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round561"')) {
    throw new Error("Round566 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round561"')) {
    throw new Error("Round566 source patch did not include the Round561 DOB NOW pack in the duplicate scan.");
  }
  if (source.includes("round562") || source.includes("round563") || source.includes("round564")) {
    throw new Error("Round566 source patch unexpectedly included future/disjoint rounds beyond the requested Round561 boundary.");
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

vm.runInNewContext(buildRound566Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
