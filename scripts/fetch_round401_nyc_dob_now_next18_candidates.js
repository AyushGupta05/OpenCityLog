const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round293_nyc_dob_now_next16_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round401_nyc_dob_now_next18_candidates.js");

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round401 wrapper patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round401 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function transformRound293Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round293/g, "Round401")
    .replace(/round293/g, "round401")
    .replace(/Next16/g, "Next18")
    .replace(/next16/g, "next18");

  transformed = replaceRequired(
    transformed,
    '  "round237"\n];',
    '  "round237",\n  "round293",\n  "round397"\n];',
    "DOB NOW prior-round list"
  );

  transformed = replaceRequired(
    transformed,
    "  /round237_nyc_dob_now/i,",
    "  /round237_nyc_dob_now/i,\n  /round293_nyc_dob_now/i,\n  /round397_nyc_dob_now/i,\n  /round\\d+_nyc_dob_now/i,\n  /round\\d+_nyc_dob_co/i,",
    "DOB administrative prior patterns"
  );

  transformed = replaceRequired(
    transformed,
    "DOB NOW packs through round237",
    "DOB NOW packs through round397",
    "DOB NOW prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB NOW through round237",
    "DOB NOW through round397",
    "DOB NOW compact scope"
  );
  transformed = replaceRequired(
    transformed,
    'dob_now_rounds_through: "round237"',
    'dob_now_rounds_through: "round397"',
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
    'dob_co_rounds_through: "round289"',
    'dob_co_rounds_screened: "available tmp/subagents DOB CO packs"',
    "DOB CO prior scope"
  );

  transformed = replaceRequired(
    transformed,
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round293_screened: prior.priorDobFiles.some((file) => /round293_nyc_dob_now/i.test(file)),\n      required_round397_screened: prior.priorDobFiles.some((file) => /round397_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "Round401 validation marker"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
}

async function main() {
  const source = transformRound293Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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

  vm.runInNewContext(source, sandbox, { filename: SCRIPT_PATH });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed Round401 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
