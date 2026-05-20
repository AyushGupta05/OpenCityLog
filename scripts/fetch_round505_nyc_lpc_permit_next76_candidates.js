const fs = require("fs");
const path = require("path");

const ROUND492_SCRIPT = path.join(__dirname, "fetch_round492_nyc_lpc_permit_next73_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round492 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND492_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 492;/g, "const ROUND = 505;")
  .replace(/round492_nyc_lpc_permit_next73/g, "round505_nyc_lpc_permit_next76")
  .replace(/round492/g, "round505")
  .replace(/Round492/g, "Round505")
  .replace(/next73/g, "next76")
  .replace(/Next73/g, "Next76")
  .replace(/through round491/g, "through round501");

source = replaceOnce(
  source,
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json"\\\\n];`;',
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"\\\\n];`;'
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
