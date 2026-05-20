const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round293_nyc_dob_now_next16_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round397_nyc_dob_now_next17_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round397 wrapper patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function transformRound293Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round293/g, "Round397")
    .replace(/round293/g, "round397")
    .replace(/Next16/g, "Next17")
    .replace(/next16/g, "next17");

  transformed = replaceRequired(
    transformed,
    '  "round237"\n];',
    '  "round237",\n  "round293"\n];',
    "DOB NOW prior-round list"
  );

  transformed = replaceRequired(
    transformed,
    "  /round237_nyc_dob_now/i,",
    "  /round237_nyc_dob_now/i,\n  /round293_nyc_dob_now/i,\n  /round\\d+_nyc_dob_now/i,\n  /round\\d+_nyc_dob_co/i,",
    "DOB administrative prior patterns"
  );

  transformed = replaceRequired(
    transformed,
    "DOB NOW packs through round237",
    "DOB NOW packs through round293",
    "DOB NOW prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB NOW through round237",
    "DOB NOW through round293",
    "DOB NOW compact scope"
  );
  transformed = replaceRequired(
    transformed,
    "dob_now_rounds_through: \"round237\"",
    "dob_now_rounds_through: \"round293\"",
    "DOB NOW prior scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB CO packs through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO pack prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB CO through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO compact scope"
  );
  transformed = replaceRequired(
    transformed,
    "CO through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO short duplicate note"
  );
  transformed = replaceRequired(
    transformed,
    "DOB Certificate of Occupancy packs through round289",
    "DOB Certificate of Occupancy packs available under tmp/subagents",
    "DOB CO prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "dob_co_rounds_through: \"round289\"",
    "dob_co_rounds_screened: \"available tmp/subagents DOB CO packs\"",
    "DOB CO prior scope"
  );

  transformed = replaceRequired(
    transformed,
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round293_screened: prior.priorDobFiles.some((file) => /round293_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "Round293 validation marker"
  );

  return transformed;
}

const source = transformRound293Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));

vm.runInNewContext(source, {
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
}, {
  filename: SCRIPT_PATH
});
