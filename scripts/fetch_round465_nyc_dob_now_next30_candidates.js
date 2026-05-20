const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round461_nyc_dob_now_next29_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round465_nyc_dob_now_next30_candidates.js");

const DOB_NOW_ROUNDS_THROUGH_461 = [
  "round117_nyc_dob_filings_permits",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round158",
  "round162",
  "round167",
  "round173",
  "round179",
  "round185",
  "round191",
  "round197",
  "round203",
  "round209",
  "round222",
  "round227",
  "round237",
  "round293",
  "round397",
  "round401",
  "round407",
  "round413",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round458",
  "round461"
];

const PRIOR_ROUND_REGEX_THROUGH_461 = [
  "round112",
  "round117",
  "round119",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round155",
  "round158",
  "round160",
  "round162",
  "round164",
  "round167",
  "round169",
  "round173",
  "round175",
  "round179",
  "round181",
  "round185",
  "round187",
  "round191",
  "round193",
  "round197",
  "round199",
  "round203",
  "round205",
  "round209",
  "round211",
  "round219",
  "round222",
  "round225",
  "round227",
  "round232",
  "round237",
  "round242",
  "round247",
  "round250",
  "round256",
  "round264",
  "round267",
  "round273",
  "round278",
  "round289",
  "round293",
  "round300",
  "round303",
  "round308",
  "round313",
  "round318",
  "round322",
  "round326",
  "round330",
  "round335",
  "round339",
  "round344",
  "round349",
  "round356",
  "round360",
  "round364",
  "round367",
  "round371",
  "round375",
  "round379",
  "round382",
  "round386",
  "round389",
  "round395",
  "round397",
  "round400",
  "round401",
  "round406",
  "round407",
  "round412",
  "round413",
  "round415",
  "round417",
  "round422",
  "round429",
  "round435",
  "round438",
  "round441",
  "round445",
  "round449",
  "round453",
  "round456",
  "round458",
  "round461"
].join("|");

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round465 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceRegexOnce(source, pattern, replacement, label) {
  let count = 0;
  const output = source.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  if (count !== 1) {
    throw new Error(`Round465 wrapper patch failed for ${label}: expected one regex match, found ${count}`);
  }
  return output;
}

function transformRound461Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round461/g, "Round465")
    .replace(/round461/g, "round465")
    .replace(/Next29/g, "Next30")
    .replace(/next29/g, "next30")
    .replace(/DOB_NOW_ROUNDS_THROUGH_458/g, "DOB_NOW_ROUNDS_THROUGH_461")
    .replace(/PRIOR_ROUND_REGEX_THROUGH_458/g, "PRIOR_ROUND_REGEX_THROUGH_461");

  transformed = replaceOnce(
    transformed,
    "if (!round || round > 458) return false;",
    "if (!round || round > 461) return false;",
    "requested prior DOB max round"
  );

  transformed = replaceOnce(
    transformed,
    "scope: \"Manual architecture corpus plus NYC DOB NOW/DOB permit/DOB CO candidate packs through tmp/subagents/round458_nyc_dob_now_next28/candidates.json.\",",
    "scope: \"Manual architecture corpus plus NYC DOB NOW/DOB permit/DOB CO candidate packs through tmp/subagents/round461_nyc_dob_now_next29/candidates.json.\",",
    "requested duplicate scope prose"
  );

  transformed = replaceOnce(
    transformed,
    "round458_candidates_checked: priorDobFiles.some((file) => /round458_nyc_dob_now_next28\\/candidates\\.json/i.test(file)),",
    "round461_candidates_checked: priorDobFiles.some((file) => /round461_nyc_dob_now_next29\\/candidates\\.json/i.test(file)),",
    "requested duplicate scope round flag"
  );

  transformed = replaceOnce(
    transformed,
    "`Checked ${requestedScope.prior_dob_files_checked} prior DOB administrative candidate files plus the manual corpus through Round458.`,",
    "`Checked ${requestedScope.prior_dob_files_checked} prior DOB administrative candidate files plus the manual corpus through Round461.`,",
    "notes requested duplicate scope boundary"
  );

  transformed = replaceOnce(
    transformed,
    ".replace(/Round449/g, \"Round458\")",
    ".replace(/Round449/g, \"Round461\")",
    "nested Round449-to-Round461 marker"
  );

  transformed = replaceOnce(
    transformed,
    ".replace(/round449/g, \"round458\");",
    ".replace(/round449/g, \"round461\");",
    "nested round449-to-round461 marker"
  );

  transformed = replaceRegexOnce(
    transformed,
    /const DOB_NOW_ROUNDS_THROUGH_461 = \[[\s\S]*?\];/,
    `const DOB_NOW_ROUNDS_THROUGH_461 = ${JSON.stringify(DOB_NOW_ROUNDS_THROUGH_461, null, 2)};`,
    "DOB NOW prior-round list"
  );

  transformed = replaceRegexOnce(
    transformed,
    /const PRIOR_ROUND_REGEX_THROUGH_461 = \[[\s\S]*?\]\.join\("\|"\);/,
    `const PRIOR_ROUND_REGEX_THROUGH_461 = ${JSON.stringify(PRIOR_ROUND_REGEX_THROUGH_461.split("|"), null, 2)}.join("|");`,
    "DOB prior-round summary regex"
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
  const source = transformRound461Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round465 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
