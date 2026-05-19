const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round191_nyc_dob_now_next9_candidates.js");

function replaceRequired(source, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(`Round191 template patch failed; missing expected text: ${needle}`);
  }
  return source.split(needle).join(replacement);
}

let source = fs.readFileSync(TEMPLATE_PATH, "utf8");

source = replaceRequired(source, 'const START_DATE = "2024-01-01";', 'const START_DATE = "2008-01-01";');
source = replaceRequired(
  source,
  'const OUT_DIR = "tmp/subagents/round149_nyc_dob_now_next";',
  'const OUT_DIR = "tmp/subagents/round191_nyc_dob_now_next9";'
);

source = source
  .replace(/round149/g, "round191")
  .replace(/Round149/g, "Round191")
  .replace(/nyc_dob_now_next(?!9)/g, "nyc_dob_now_next9")
  .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next9")
  .replace(/NYC DOB NOW next/g, "NYC DOB NOW next9")
  .replace(
    /round133, round136, round143, round149, round152, round158, round162, round167, round173, and round179/g,
    "round133, round136, round143, round149, round152, round158, round162, round167, round173, round179, and round185"
  )
  .replace(
    /round133\/round136\/round143\/round149\/round152\/round158\/round162\/round167\/round173\/round179/g,
    "round133/round136/round143/round149/round152/round158/round162/round167/round173/round179/round185"
  )
  .replace(
    /round133\|round136\|round143\|round149\|round152\|round158\|round162\|round167\|round173\|round179/g,
    "round133|round136|round143|round149|round152|round158|round162|round167|round173|round179|round185"
  )
  .replace(
    /screened_round133_round136_round143_files/g,
    "screened_round133_round136_round143_round149_round152_round158_round162_round167_round173_round179_round185_files"
  )
  .replace(
    /\/round133\|round136\|round143\/i\.test\(file\)/g,
    "/round133|round136|round143|round149|round152|round158|round162|round167|round173|round179|round185/i.test(file)"
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
