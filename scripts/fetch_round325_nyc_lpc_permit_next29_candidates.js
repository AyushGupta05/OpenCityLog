const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round307_nyc_lpc_permit_next25_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 307;/g, "const ROUND = 325;")
  .replace(/round307_nyc_lpc_permit_next25/g, "round325_nyc_lpc_permit_next29")
  .replace(/round307/g, "round325")
  .replace(/Round307/g, "Round325")
  .replace(/next25/g, "next29")
  .replace(/Next25/g, "Next29")
  .replace(/through round302/g, "through round321");

source = replaceOnce(
  source,
  '  "tmp/subagents/round302_nyc_lpc_permit_next24/candidates.json"\n];`,',
  '  "tmp/subagents/round302_nyc_lpc_permit_next24/candidates.json",\n  "tmp/subagents/round307_nyc_lpc_permit_next25/candidates.json",\n  "tmp/subagents/round312_nyc_lpc_permit_next26/candidates.json",\n  "tmp/subagents/round317_nyc_lpc_permit_next27/candidates.json",\n  "tmp/subagents/round321_nyc_lpc_permit_next28/candidates.json"\n];`,'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
