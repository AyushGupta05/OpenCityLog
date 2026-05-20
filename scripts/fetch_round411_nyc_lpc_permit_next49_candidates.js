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
  .replace(/const ROUND = 405;/g, "const ROUND = 411;")
  .replace(/round405_nyc_lpc_permit_next48/g, "round411_nyc_lpc_permit_next49")
  .replace(/round405/g, "round411")
  .replace(/Round405/g, "Round411")
  .replace(/next48/g, "next49")
  .replace(/Next48/g, "Next49")
  .replace(/through round399/g, "through round405");

source = replaceOnce(
  source,
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json"\n];`;',
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json",\n  "tmp/subagents/round405_nyc_lpc_permit_next48/candidates.json"\n];`;'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
