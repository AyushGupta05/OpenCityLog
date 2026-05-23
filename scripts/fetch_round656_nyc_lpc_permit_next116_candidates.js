const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round656 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round656/next116.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 656;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next116";');
source = replaceAllLiteral(source, 'const ACCESSED_AT = "2026-05-20";', 'const ACCESSED_AT = "2026-05-23";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round656_nyc_lpc_permit_next1164");
source = replaceAllLiteral(source, "next944", "next1164");
source = replaceAllLiteral(source, "Next944", "Next1164");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round656_nyc_lpc_permit_next116");
source = replaceAllLiteral(source, "Round590", "Round656");
source = replaceAllLiteral(source, "round590", "round656");
source = replaceAllLiteral(source, "next94", "next116");
source = replaceAllLiteral(source, "Next94", "Next116");

// Advance the scratch-pack dedupe boundary to the latest available NYC LPC pack on disk.
// Later LPC rows already appended to the live manual corpus are still excluded by corpus scanning.
source = replaceAllLiteral(source, "ROUND586", "ROUND654");
source = replaceAllLiteral(source, "Round586", "Round654");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round654_nyc_lpc_permit_next115");
source = replaceAllLiteral(source, "through round586", "through round654");
source = replaceAllLiteral(source, "round586", "round654");

if (!source.includes("const ROUND = 656;") || !source.includes('const NEXT = "next116";')) {
  throw new Error("Round656 generator did not advance round/next constants");
}
if (!source.includes('const ACCESSED_AT = "2026-05-23";')) {
  throw new Error("Round656 generator did not update the retrieval date");
}
if (!source.includes('const ROUND654_PACK = "tmp/subagents/round654_nyc_lpc_permit_next115/candidates.json";')) {
  throw new Error("Round656 generator did not include Round654 as the latest available prior scratch pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round656 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
