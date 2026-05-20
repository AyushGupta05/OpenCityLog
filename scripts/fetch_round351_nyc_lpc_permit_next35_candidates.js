const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round342_nyc_lpc_permit_next33_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 342;/g, "const ROUND = 351;")
  .replace(/round342_nyc_lpc_permit_next33/g, "round351_nyc_lpc_permit_next35")
  .replace(/round342/g, "round351")
  .replace(/Round342/g, "Round351")
  .replace(/next33/g, "next35")
  .replace(/Next33/g, "Next35")
  .replace(/through round337/g, "through round346");

source = replaceOnce(
  source,
  '  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json"\\\\n];`,',
  '  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json",\\\\n  "tmp/subagents/round342_nyc_lpc_permit_next33/candidates.json",\\\\n  "tmp/subagents/round346_nyc_lpc_permit_next34/candidates.json"\\\\n];`,'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
