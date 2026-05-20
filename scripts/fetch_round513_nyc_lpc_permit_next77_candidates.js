const fs = require("fs");
const path = require("path");

const ROUND505_SCRIPT = path.join(__dirname, "fetch_round505_nyc_lpc_permit_next76_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round505 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND505_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 505;/g, "const ROUND = 513;")
  .replace(/round505_nyc_lpc_permit_next76/g, "round513_nyc_lpc_permit_next77")
  .replace(/round505/g, "round513")
  .replace(/Round505/g, "Round513")
  .replace(/next76/g, "next77")
  .replace(/Next76/g, "Next77")
  .replace(/through round501/g, "through round505");

source = replaceOnce(
  source,
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"\\\\\\\\n];`;',
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json",\\\\\\\\n  "tmp/subagents/round505_nyc_lpc_permit_next76/candidates.json"\\\\\\\\n];`;'
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round505_nyc_lpc_permit_next76/candidates.json"'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
