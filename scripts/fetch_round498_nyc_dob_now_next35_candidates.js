const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round498_nyc_dob_now_next35_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round498 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round498 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound498Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round498_nyc_dob_now_next35_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round498_nyc_dob_now_next35")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next35")
    .replace(/Round480/g, "Round498")
    .replace(/round480/g, "round498")
    .replace(/Next32/g, "Next35")
    .replace(/next32/g, "next35")
    .replace(/THROUGH_473/g, "THROUGH_493")
    .replace(/Round473/g, "Round493")
    .replace(/through_round473/g, "through_round493")
    .replace(/round473_candidates_checked/g, "round493_candidates_checked")
    .replace(/contains_round473/g, "contains_round493")
    .replace(/round473_records/g, "round493_records")
    .replace(/nyc_dob_now_next31/g, "nyc_dob_now_next34")
    .replace(/next3532/g, "next3535")
    .replace(/round number <= 473/g, "round number <= 493")
    .replace(/<= 473/g, "<= 493")
    .replace(/> 473/g, "> 493")
    .replace(/cutoff_round: 473/g, "cutoff_round: 493")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 493")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round493"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round493");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next34/candidates.json",
    "tmp/subagents/round493_nyc_dob_now_next34/candidates.json",
    "strict audit named Round493 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next34\\/candidates\\.json/i",
    "/round493_nyc_dob_now_next34\\/candidates\\.json/i",
    "strict audit Round493 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round493") || text.includes("nyc_dob_now_next34")',
    'text.includes("round493") || text.includes("Round493") || text.includes("nyc_dob_now_next34")',
    "manual corpus Round493 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB NOW",
    "round480_nyc_dob_now_next35",
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
    throw new Error(`Round498 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round493_nyc_dob_now_next34")) {
    throw new Error("Round498 source patch did not preserve the Round493 dedupe boundary reference.");
  }
  if (!source.includes("round498_nyc_dob_now_next35")) {
    throw new Error("Round498 source patch did not create the Round498 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round493"')) {
    throw new Error("Round498 source patch did not update DOB NOW through-round metadata.");
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

vm.runInNewContext(buildRound498Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
