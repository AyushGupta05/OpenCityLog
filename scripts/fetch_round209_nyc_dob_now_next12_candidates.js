const fs = require("fs");
const path = require("path");
const vm = require("vm");

const TEMPLATE_PATH = path.join("scripts", "fetch_round149_nyc_dob_now_next_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round209_nyc_dob_now_next12_candidates.js");

function replaceRequired(source, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(`Round209 template patch failed; missing expected text: ${needle}`);
  }
  return source.split(needle).join(replacement);
}

let source = fs.readFileSync(TEMPLATE_PATH, "utf8");

source = replaceRequired(source, 'const START_DATE = "2024-01-01";', 'const START_DATE = "2008-01-01";');
source = replaceRequired(
  source,
  'const OUT_DIR = "tmp/subagents/round149_nyc_dob_now_next";',
  'const OUT_DIR = "tmp/subagents/round209_nyc_dob_now_next12";'
);
source = replaceRequired(
  source,
  '  "Earthwork",\n  "Support of Excavation"',
  '  "Support of Excavation"'
);

const priorRoundsText = "round133, round136, round143, round149, round152, round158, round162, round167, round173, round179, round185, round191, round197, and round203";
const priorRoundsSlash = "round133/round136/round143/round149/round152/round158/round162/round167/round173/round179/round185/round191/round197/round203";
const priorRoundsRegex = "round133|round136|round143|round149|round152|round158|round162|round167|round173|round179|round185|round191|round197|round203";
const priorRoundsField = "screened_round133_round136_round143_round149_round152_round158_round162_round167_round173_round179_round185_round191_round197_round203_files";

source = source
  .replace(/round149/g, "round209")
  .replace(/Round149/g, "Round209")
  .replace(/nyc_dob_now_next(?!12)/g, "nyc_dob_now_next12")
  .replace(/NYC DOB NOW Next/g, "NYC DOB NOW Next12")
  .replace(/NYC DOB NOW next/g, "NYC DOB NOW next12")
  .replace(
    /round133, round136, and round143/g,
    priorRoundsText
  )
  .replace(
    /round133\/round136\/round143/g,
    priorRoundsSlash
  )
  .replace(
    /round133\|round136\|round143/g,
    priorRoundsRegex
  )
  .replace(
    /screened_round133_round136_round143_files/g,
    priorRoundsField
  )
  .replace(
    /\/round133\|round136\|round143\/i\.test\(file\)/g,
    `/${priorRoundsRegex}/i.test(file)`
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
