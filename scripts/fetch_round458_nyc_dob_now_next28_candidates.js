const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round438_nyc_dob_now_next24_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round458_nyc_dob_now_next28_candidates.js");

const DOB_NOW_ROUNDS_THROUGH_449 = [
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
  "round449"
];

const PRIOR_ROUND_REGEX_THROUGH_449 = [
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
  "round449"
].join("|");

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round458 wrapper patch failed for ${label}: expected one match, found ${count}`);
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
    throw new Error(`Round458 wrapper patch failed for ${label}: expected one regex match, found ${count}`);
  }
  return output;
}

function transformRound438Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round438/g, "Round458")
    .replace(/round438/g, "round458")
    .replace(/Next24/g, "Next28")
    .replace(/next24/g, "next28")
    .replace(/DOB_NOW_ROUNDS_THROUGH_435/g, "DOB_NOW_ROUNDS_THROUGH_449")
    .replace(/PRIOR_ROUND_REGEX_THROUGH_435/g, "PRIOR_ROUND_REGEX_THROUGH_449")
    .replace(/Round435/g, "Round449")
    .replace(/round435/g, "round449");

  transformed = replaceRegexOnce(
    transformed,
    /const DOB_NOW_ROUNDS_THROUGH_449 = \[[\s\S]*?\];/,
    `const DOB_NOW_ROUNDS_THROUGH_449 = ${JSON.stringify(DOB_NOW_ROUNDS_THROUGH_449, null, 2)};`,
    "DOB NOW prior-round list"
  );

  transformed = replaceRegexOnce(
    transformed,
    /const PRIOR_ROUND_REGEX_THROUGH_449 = \[[\s\S]*?\]\.join\("\|"\);/,
    `const PRIOR_ROUND_REGEX_THROUGH_449 = ${JSON.stringify(PRIOR_ROUND_REGEX_THROUGH_449.split("|"), null, 2)}.join("|");`,
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
  const source = transformRound438Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round458 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
