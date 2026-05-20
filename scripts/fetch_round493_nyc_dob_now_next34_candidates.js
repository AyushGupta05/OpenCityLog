const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round493_nyc_dob_now_next34_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round493 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round493 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound493Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round493_nyc_dob_now_next34_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round493_nyc_dob_now_next34")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next34")
    .replace(/Round480/g, "Round493")
    .replace(/round480/g, "round493")
    .replace(/Next32/g, "Next34")
    .replace(/next32/g, "next34")
    .replace(/THROUGH_473/g, "THROUGH_484")
    .replace(/Round473/g, "Round484")
    .replace(/through_round473/g, "through_round484")
    .replace(/round473_candidates_checked/g, "round484_candidates_checked")
    .replace(/contains_round473/g, "contains_round484")
    .replace(/round473_records/g, "round484_records")
    .replace(/nyc_dob_now_next31/g, "nyc_dob_now_next33")
    .replace(/next3432/g, "next3434")
    .replace(/round number <= 473/g, "round number <= 484")
    .replace(/<= 473/g, "<= 484")
    .replace(/> 473/g, "> 484")
    .replace(/cutoff_round: 473/g, "cutoff_round: 484")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 484")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round484"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round484");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next33/candidates.json",
    "tmp/subagents/round484_nyc_dob_now_next33/candidates.json",
    "strict audit named Round484 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next33\\/candidates\\.json/i",
    "/round484_nyc_dob_now_next33\\/candidates\\.json/i",
    "strict audit Round484 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round484") || text.includes("nyc_dob_now_next33")',
    'text.includes("round484") || text.includes("Round484") || text.includes("nyc_dob_now_next33")',
    "manual corpus Round484 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB NOW",
    "round480_nyc_dob_now_next34",
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
    throw new Error(`Round493 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round484_nyc_dob_now_next33")) {
    throw new Error("Round493 source patch did not preserve the Round484 dedupe boundary reference.");
  }
  if (!source.includes("round493_nyc_dob_now_next34")) {
    throw new Error("Round493 source patch did not create the Round493 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round484"')) {
    throw new Error("Round493 source patch did not update DOB NOW through-round metadata.");
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

vm.runInNewContext(buildRound493Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
