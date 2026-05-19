const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round162_nyc_dob_now_next4_candidates.js");

function replaceRequired(source, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(`Round162 template patch failed; missing expected text: ${needle}`);
  }
  return source.split(needle).join(replacement);
}

let source = fs.readFileSync(TEMPLATE_PATH, "utf8");

source = replaceRequired(source, 'const START_DATE = "2024-01-01";', 'const START_DATE = "2008-01-01";');
source = replaceRequired(
  source,
  'const OUT_DIR = "tmp/subagents/round149_nyc_dob_now_next";',
  'const OUT_DIR = "tmp/subagents/round162_nyc_dob_now_next4";'
);
source = replaceRequired(
  source,
  "if (normalized === ownOutDir) continue;",
  "// Round162 intentionally includes any pre-existing own-output candidates in the duplicate index when rerun."
);

source = source
  .replace(/round149/g, "round162")
  .replace(/Round149/g, "Round162")
  .replace(/nyc_dob_now_next(?!4)/g, "nyc_dob_now_next4")
  .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next4")
  .replace(/NYC DOB NOW next/g, "NYC DOB NOW next4")
  .replace(
    /round133, round136, and round143/g,
    "round133, round136, round143, round149, round152, round158, and any pre-existing round162"
  )
  .replace(
    /round133\/round136\/round143/g,
    "round133/round136/round143/round149/round152/round158/round162"
  )
  .replace(
    /round133\|round136\|round143/g,
    "round133|round136|round143|round149|round152|round158|round162"
  )
  .replace(
    /screened_round133_round136_round143_files/g,
    "screened_round133_round136_round143_round149_round152_round158_round162_files"
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
