const fs = require("fs");
const path = require("path");

const ROUND405_SCRIPT = path.join(__dirname, "fetch_round405_nyc_lpc_permit_next48_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round405 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND405_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 405;/g, "const ROUND = 427;")
  .replace(/round405_nyc_lpc_permit_next48/g, "round427_nyc_lpc_permit_next53")
  .replace(/round405/g, "round427")
  .replace(/Round405/g, "Round427")
  .replace(/next48/g, "next53")
  .replace(/Next48/g, "Next53")
  .replace(/through round399/g, "through round424");

source = replaceOnce(
  source,
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json"\n];`;',
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json",\n  "tmp/subagents/round405_nyc_lpc_permit_next48/candidates.json",\n  "tmp/subagents/round411_nyc_lpc_permit_next49/candidates.json",\n  "tmp/subagents/round418_nyc_lpc_permit_next50/candidates.json",\n  "tmp/subagents/round423_nyc_lpc_permit_next51/candidates.json",\n  "tmp/subagents/round424_nyc_lpc_permit_next52/candidates.json"\n];`;'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
