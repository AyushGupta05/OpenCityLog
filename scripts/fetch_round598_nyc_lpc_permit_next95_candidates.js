const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round598 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round598/next95.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 598;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next95";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round598_nyc_lpc_permit_next955");
source = replaceAllLiteral(source, "next944", "next955");
source = replaceAllLiteral(source, "Next944", "Next955");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round598_nyc_lpc_permit_next95");
source = replaceAllLiteral(source, "Round590", "Round598");
source = replaceAllLiteral(source, "round590", "round598");
source = replaceAllLiteral(source, "next94", "next95");
source = replaceAllLiteral(source, "Next94", "Next95");

// Advance the dedupe boundary so the generated Round598 pack excludes Round590.
source = replaceAllLiteral(source, "ROUND586", "ROUND590");
source = replaceAllLiteral(source, "Round586", "Round590");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round590_nyc_lpc_permit_next94");
source = replaceAllLiteral(source, "through round586", "through round590");
source = replaceAllLiteral(source, "round586", "round590");

if (!source.includes("const ROUND = 598;") || !source.includes('const NEXT = "next95";')) {
  throw new Error("Round598 generator did not advance round/next constants");
}
if (!source.includes('const ROUND590_PACK = "tmp/subagents/round590_nyc_lpc_permit_next94/candidates.json";')) {
  throw new Error("Round598 generator did not include Round590 as the latest prior pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round598 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
