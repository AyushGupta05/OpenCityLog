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
  .replace(/const ROUND = 505;/g, "const ROUND = 539;")
  .replace(/round505_nyc_lpc_permit_next76/g, "round539_nyc_lpc_permit_next84")
  .replace(/round505/g, "round539")
  .replace(/Round505/g, "Round539")
  .replace(/next76/g, "next84")
  .replace(/Next76/g, "Next84")
  .replace(/through round501/g, "through round535");

source = replaceOnce(
  source,
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"\\\\\\\\n];`;',
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json",\\\\\\\\n  "tmp/subagents/round505_nyc_lpc_permit_next76/candidates.json",\\\\\\\\n  "tmp/subagents/round513_nyc_lpc_permit_next77/candidates.json",\\\\\\\\n  "tmp/subagents/round518_nyc_lpc_permit_next78/candidates.json",\\\\\\\\n  "tmp/subagents/round523_nyc_lpc_permit_next79/candidates.json",\\\\\\\\n  "tmp/subagents/round525_nyc_lpc_permit_next80/candidates.json",\\\\\\\\n  "tmp/subagents/round528_nyc_lpc_permit_next81/candidates.json",\\\\\\\\n  "tmp/subagents/round530_nyc_lpc_permit_next82/candidates.json",\\\\\\\\n  "tmp/subagents/round535_nyc_lpc_permit_next83/candidates.json"\\\\\\\\n];`;'
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round535_nyc_lpc_permit_next83/candidates.json"'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
