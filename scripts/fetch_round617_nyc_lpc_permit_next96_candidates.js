const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round617 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round617/next96.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 617;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next96";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round617_nyc_lpc_permit_next966");
source = replaceAllLiteral(source, "next944", "next966");
source = replaceAllLiteral(source, "Next944", "Next966");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round617_nyc_lpc_permit_next96");
source = replaceAllLiteral(source, "Round590", "Round617");
source = replaceAllLiteral(source, "round590", "round617");
source = replaceAllLiteral(source, "next94", "next96");
source = replaceAllLiteral(source, "Next94", "Next96");

// Advance the dedupe boundary so the generated Round617 pack excludes Round598.
source = replaceAllLiteral(source, "ROUND586", "ROUND598");
source = replaceAllLiteral(source, "Round586", "Round598");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round598_nyc_lpc_permit_next95");
source = replaceAllLiteral(source, "through round586", "through round598");
source = replaceAllLiteral(source, "round586", "round598");

if (!source.includes("const ROUND = 617;") || !source.includes('const NEXT = "next96";')) {
  throw new Error("Round617 generator did not advance round/next constants");
}
if (!source.includes('const ROUND598_PACK = "tmp/subagents/round598_nyc_lpc_permit_next95/candidates.json";')) {
  throw new Error("Round617 generator did not include Round598 as the latest prior pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round617 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
