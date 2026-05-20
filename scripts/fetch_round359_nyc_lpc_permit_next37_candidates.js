const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round351_nyc_lpc_permit_next35_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 351;/g, "const ROUND = 359;")
  .replace(/round351_nyc_lpc_permit_next35/g, "round359_nyc_lpc_permit_next37")
  .replace(/round351/g, "round359")
  .replace(/Round351/g, "Round359")
  .replace(/next35/g, "next37")
  .replace(/Next35/g, "Next37")
  .replace(/through round346/g, "through round355");

source = replaceOnce(
  source,
  '  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json",\\\\\\\\n  "tmp/subagents/round342_nyc_lpc_permit_next33/candidates.json",\\\\\\\\n  "tmp/subagents/round346_nyc_lpc_permit_next34/candidates.json"\\\\\\\\n];`,',
  '  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json",\\\\\\\\n  "tmp/subagents/round342_nyc_lpc_permit_next33/candidates.json",\\\\\\\\n  "tmp/subagents/round346_nyc_lpc_permit_next34/candidates.json",\\\\\\\\n  "tmp/subagents/round351_nyc_lpc_permit_next35/candidates.json",\\\\\\\\n  "tmp/subagents/round355_nyc_lpc_permit_next36/candidates.json"\\\\\\\\n];`,'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
