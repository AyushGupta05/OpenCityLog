const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round480_nyc_dob_now_next32_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round484_nyc_dob_now_next33_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round484 source patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round484 source patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function buildRound484Source() {
  let source = fs.readFileSync(BASE_SCRIPT_PATH, "utf8").replace(/\r\n/g, "\n");

  source = source
    .replace(/fetch_round480_nyc_dob_now_next32_candidates/g, "fetch_round484_nyc_dob_now_next33_candidates")
    .replace(/round480_nyc_dob_now_next32/g, "round484_nyc_dob_now_next33")
    .replace(/nyc_dob_now_next32/g, "nyc_dob_now_next33")
    .replace(/Round480/g, "Round484")
    .replace(/round480/g, "round484")
    .replace(/Next32/g, "Next33")
    .replace(/next32/g, "next33")
    .replace(/THROUGH_473/g, "THROUGH_480")
    .replace(/Round473/g, "Round480")
    .replace(/through_round473/g, "through_round480")
    .replace(/round473_candidates_checked/g, "round480_candidates_checked")
    .replace(/contains_round473/g, "contains_round480")
    .replace(/round473_records/g, "round480_records")
    .replace(/nyc_dob_now_next31/g, "nyc_dob_now_next32")
    .replace(/round number <= 473/g, "round number <= 480")
    .replace(/<= 473/g, "<= 480")
    .replace(/> 473/g, "> 480")
    .replace(/cutoff_round: 473/g, "cutoff_round: 480")
    .replace(/dob_admin_round_cutoff: 473/g, "dob_admin_round_cutoff: 480")
    .replace(/dob_now_rounds_through: "round473"/g, 'dob_now_rounds_through: "round480"')
    .replace(/screened_prior_candidate_files_through_round473/g, "screened_prior_candidate_files_through_round480");

  source = replaceOnce(
    source,
    '  "round473"\n];',
    '  "round473",\n  "round480"\n];',
    "DOB NOW prior round list"
  );
  source = replaceOnce(
    source,
    '  "round473"\n].join("|");',
    '  "round473",\n  "round480"\n].join("|");',
    "DOB admin prior round regex"
  );
  source = replaceRequired(
    source,
    "tmp/subagents/round473_nyc_dob_now_next32/candidates.json",
    "tmp/subagents/round480_nyc_dob_now_next32/candidates.json",
    "strict audit named Round480 boundary path"
  );
  source = replaceRequired(
    source,
    "/round473_nyc_dob_now_next32\\/candidates\\.json/i",
    "/round480_nyc_dob_now_next32\\/candidates\\.json/i",
    "strict audit Round480 regex"
  );
  source = replaceRequired(
    source,
    'text.includes("round473") || text.includes("Round480") || text.includes("nyc_dob_now_next32")',
    'text.includes("round480") || text.includes("Round480") || text.includes("nyc_dob_now_next32")',
    "manual corpus Round480 marker check"
  );

  const forbidden = [
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
    throw new Error(`Round484 source patch left stale Round473/Round480 boundary tokens: ${remaining.join(", ")}`);
  }
  if (!source.includes("round480_nyc_dob_now_next32")) {
    throw new Error("Round484 source patch did not preserve the Round480 dedupe boundary reference.");
  }
  if (!source.includes("round484_nyc_dob_now_next33")) {
    throw new Error("Round484 source patch did not create the Round484 output reference.");
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

vm.runInNewContext(buildRound484Source(), sandbox, { filename: path.resolve(SCRIPT_PATH) });
