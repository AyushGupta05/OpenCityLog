const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round329_nyc_lpc_permit_next30_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 329;/g, "const ROUND = 342;")
  .replace(/round329_nyc_lpc_permit_next30/g, "round342_nyc_lpc_permit_next33")
  .replace(/round329/g, "round342")
  .replace(/Round329/g, "Round342")
  .replace(/next30/g, "next33")
  .replace(/Next30/g, "Next33")
  .replace(/through round325/g, "through round337");

source = replaceOnce(
  source,
  '  "tmp/subagents/round302_nyc_lpc_permit_next24/candidates.json",\\n  "tmp/subagents/round307_nyc_lpc_permit_next25/candidates.json",\\n  "tmp/subagents/round312_nyc_lpc_permit_next26/candidates.json",\\n  "tmp/subagents/round317_nyc_lpc_permit_next27/candidates.json",\\n  "tmp/subagents/round321_nyc_lpc_permit_next28/candidates.json",\\n  "tmp/subagents/round325_nyc_lpc_permit_next29/candidates.json"\\n];`,',
  '  "tmp/subagents/round302_nyc_lpc_permit_next24/candidates.json",\\n  "tmp/subagents/round307_nyc_lpc_permit_next25/candidates.json",\\n  "tmp/subagents/round312_nyc_lpc_permit_next26/candidates.json",\\n  "tmp/subagents/round317_nyc_lpc_permit_next27/candidates.json",\\n  "tmp/subagents/round321_nyc_lpc_permit_next28/candidates.json",\\n  "tmp/subagents/round325_nyc_lpc_permit_next29/candidates.json",\\n  "tmp/subagents/round329_nyc_lpc_permit_next30/candidates.json",\\n  "tmp/subagents/round334_nyc_lpc_permit_next31/candidates.json",\\n  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json"\\n];`,'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
