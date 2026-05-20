const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round167_nyc_dob_now_next5_candidates.js");

function replaceRequired(source, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(`Round167 template patch failed; missing expected text: ${needle}`);
  }
  return source.split(needle).join(replacement);
}

let source = fs.readFileSync(TEMPLATE_PATH, "utf8");

source = replaceRequired(source, 'const START_DATE = "2024-01-01";', 'const START_DATE = "2008-01-01";');
source = replaceRequired(
  source,
  'const OUT_DIR = "tmp/subagents/round149_nyc_dob_now_next";',
  'const OUT_DIR = "tmp/subagents/round167_nyc_dob_now_next5";'
);
source = replaceRequired(
  source,
  "if (normalized === ownOutDir) continue;",
  "// Round167 intentionally includes any pre-existing own-output candidates in the duplicate index when rerun."
);

source = source
  .replace(/round149/g, "round167")
  .replace(/Round149/g, "Round167")
  .replace(/nyc_dob_now_next(?!5)/g, "nyc_dob_now_next5")
  .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next5")
  .replace(/NYC DOB NOW next/g, "NYC DOB NOW next5")
  .replace(
    /round133, round136, and round143/g,
    "round133, round136, round143, round149, round152, round158, round162, and any pre-existing round167"
  )
  .replace(
    /round133\/round136\/round143/g,
    "round133/round136/round143/round149/round152/round158/round162/round167"
  )
  .replace(
    /round133\|round136\|round143/g,
    "round133|round136|round143|round149|round152|round158|round162|round167"
  )
  .replace(
    /screened_round133_round136_round143_files/g,
    "screened_round133_round136_round143_round149_round152_round158_round162_round167_files"
  );

vm.runInNewContext(source, {
  Buffer,
  URL,
  clearTimeout,
  console,
  fetch,
  process,
  require,
  setTimeout,
  __dirname: path.dirname(path.resolve(SCRIPT_PATH)),
  __filename: path.resolve(SCRIPT_PATH)
}, {
  filename: SCRIPT_PATH
});
