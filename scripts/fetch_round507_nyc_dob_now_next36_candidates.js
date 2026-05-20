const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round507_nyc_dob_now_next36_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round507 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round507 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound507Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round507_nyc_dob_now_next36_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round507_nyc_dob_now_next36")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next36")
    .replace(/Round480/g, "Round507")
    .replace(/round480/g, "round507")
    .replace(/Next32/g, "Next36")
    .replace(/next32/g, "next36")
    .replace(/THROUGH_473/g, "THROUGH_498")
    .replace(/Round473/g, "Round498")
    .replace(/through_round473/g, "through_round498")
    .replace(/round473_candidates_checked/g, "round498_candidates_checked")
    .replace(/contains_round473/g, "contains_round498")
    .replace(/round473_records/g, "round498_records")
    .replace(/nyc_dob_now_next31/g, "nyc_dob_now_next35")
    .replace(/next3632/g, "next3636")
    .replace(/round number <= 473/g, "round number <= 498")
    .replace(/<= 473/g, "<= 498")
    .replace(/> 473/g, "> 498")
    .replace(/cutoff_round: 473/g, "cutoff_round: 498")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 498")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round498"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round498");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480",\n  "round484",\n  "round493",\n  "round498"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round475",\n  "round480",\n  "round483",\n  "round484",\n  "round493",\n  "round495",\n  "round498"\n].join("|");',
    "DOB administrative prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next35/candidates.json",
    "tmp/subagents/round498_nyc_dob_now_next35/candidates.json",
    "strict audit named Round498 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next35\\/candidates\\.json/i",
    "/round498_nyc_dob_now_next35\\/candidates\\.json/i",
    "strict audit Round498 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round498") || text.includes("nyc_dob_now_next35")',
    'text.includes("round498") || text.includes("Round498") || text.includes("nyc_dob_now_next35")',
    "manual corpus Round498 marker check"
  );

  const forbidden = [
    "Round480 validation",
    "Round480 NYC DOB NOW",
    "round480_nyc_dob_now_next36",
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
    throw new Error(`Round507 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round498_nyc_dob_now_next35")) {
    throw new Error("Round507 source patch did not preserve the Round498 dedupe boundary reference.");
  }
  if (!source.includes("round507_nyc_dob_now_next36")) {
    throw new Error("Round507 source patch did not create the Round507 output reference.");
  }
  if (!source.includes('dob_now_rounds_through: "round498"')) {
    throw new Error("Round507 source patch did not update DOB NOW through-round metadata.");
  }
  if (!source.includes('"round495"')) {
    throw new Error("Round507 source patch did not include the Round495 DOB legacy permit pack in the administrative duplicate scan.");
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

vm.runInNewContext(buildRound507Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
