const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round385_nyc_lpc_permit_next44_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 385;/g, "const ROUND = 394;")
  .replace(/round385_nyc_lpc_permit_next44/g, "round394_nyc_lpc_permit_next46")
  .replace(/round385/g, "round394")
  .replace(/Round385/g, "Round394")
  .replace(/next44/g, "next46")
  .replace(/Next44/g, "Next46")
  .replace(/through round381/g, "through round388");

source = replaceOnce(
  source,
  '"tmp/subagents/round381_nyc_lpc_permit_next43/candidates.json"\\\\\\\\\\\\\\\\n];`,',
  '"tmp/subagents/round381_nyc_lpc_permit_next43/candidates.json",\\\\\\\\\\\\\\\\n  "tmp/subagents/round385_nyc_lpc_permit_next44/candidates.json",\\\\\\\\\\\\\\\\n  "tmp/subagents/round388_nyc_lpc_permit_next45/candidates.json"\\\\\\\\\\\\\\\\n];`,'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
