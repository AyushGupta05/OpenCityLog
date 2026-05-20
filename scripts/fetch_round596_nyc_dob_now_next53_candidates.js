const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round596_nyc_dob_now_next53_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round596 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round596 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound596Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round596_nyc_dob_now_next53_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round596_nyc_dob_now_next53")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next53")
    .replace(/Round480/g, "Round596")
    .replace(/round480/g, "round596")
    .replace(/Next32/g, "Next53")
    .replace(/next32/g, "next53")
    .replace(/round596_nyc_dob_now_next5353/g, "round596_nyc_dob_now_next53")
    .replace(/nyc_dob_now_next5353/g, "nyc_dob_now_next53")
    .replace(/round596_nyc_dob_now_next5332/g, "round596_nyc_dob_now_next5353")
    .replace(/nyc_dob_now_next5332/g, "nyc_dob_now_next5353")
    .replace(/THROUGH_473/g, "THROUGH_591")
    .replace(/Round473/g, "Round591")
    .replace(/round473/g, "round591")
    .replace(/through_round473/g, "through_round591")
    .replace(/round473_candidates_checked/g, "round591_candidates_checked")
    .replace(/contains_round473/g, "contains_round591")
    .replace(/round473_records/g, "round591_records")
    .replace(/round number <= 473/g, "round number <= 591")
    .replace(/<= 473/g, "<= 591")
    .replace(/> 473/g, "> 591")
    .replace(/cutoff_round: 473/g, "cutoff_round: 591")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 591")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round591"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round591");

  source = replaceOnce(
    source,
    '  "round591"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498",\n  "round507",\n  "round510",\n  "round515",\n  "round520",\n  "round524",\n  "round531",\n  "round540",\n  "round546",\n  "round549",\n  "round556",\n  "round561",\n  "round566",\n  "round571",\n  "round575",\n  "round581",\n  "round585",\n  "round591"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round591"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498",\n  "round502",\n  "round506",\n  "round507",\n  "round509",\n  "round510",\n  "round514",\n  "round515",\n  "round516",\n  "round520",\n  "round521",\n  "round524",\n  "round531",\n  "round532",\n  "round533",\n  "round536",\n  "round540",\n  "round541",\n  "round545",\n  "round546",\n  "round549",\n  "round555",\n  "round556",\n  "round558",\n  "round561",\n  "round563",\n  "round566",\n  "round568",\n  "round571",\n  "round572",\n  "round574",\n  "round575",\n  "round578",\n  "round581",\n  "round583",\n  "round585",\n  "round591"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round591_nyc_dob_now_next31/candidates.json",
    "tmp/subagents/round591_nyc_dob_now_next52/candidates.json",
    "strict audit named Round591 boundary path"
  );
  source = replaceRequired(
    source,
    "/round591_nyc_dob_now_next31\\/candidates\\.json/i",
    "/round591_nyc_dob_now_next52\\/candidates\\.json/i",
    "strict audit Round591 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round591") || text.includes("Round591") || text.includes("nyc_dob_now_next31")',
    'text.includes("round591") || text.includes("Round591") || text.includes("nyc_dob_now_next52")',
    "manual corpus Round591 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB",
    "round480_nyc_dob_now_next53",
    "Round473",
    "through_round473",
    "round473_candidates_checked",
    "round number <= 473",
    "<= 473",
    "> 473",
    "cutoff_round: 473",
    "dob_admin_round_cutoff: 473",
    "through Round585",
    "through_round585",
    "round585_candidates_checked",
    "round number <= 585",
    "<= 585",
    "> 585",
    "cutoff_round: 585",
    "dob_admin_round_cutoff: 585",
    "round592",
    "round593",
    "round594",
    "round595"
  ];
  const remaining = forbidden.filter((token) => source.includes(token));
  if (remaining.length) {
    throw new Error(`Round596 source patch left stale boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round591_nyc_dob_now_next52")) {
    throw new Error("Round596 source patch did not preserve the Round591 dedupe boundary reference.");
  }
  if (!source.includes("round596_nyc_dob_now_next53")) {
    throw new Error("Round596 source patch did not create the Round596 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round591"')) {
    throw new Error("Round596 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round591"')) {
    throw new Error("Round596 source patch did not include the Round591 DOB NOW pack in the duplicate scan.");
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

vm.runInNewContext(buildRound596Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
