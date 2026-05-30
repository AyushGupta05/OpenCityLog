const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round621 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round621/next98.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 621;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next98";');
source = replaceAllLiteral(source, 'const ACCESSED_AT = "2026-05-20";', 'const ACCESSED_AT = "2026-05-23";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round621_nyc_lpc_permit_next988");
source = replaceAllLiteral(source, "next944", "next988");
source = replaceAllLiteral(source, "Next944", "Next988");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round621_nyc_lpc_permit_next98");
source = replaceAllLiteral(source, "Round590", "Round621");
source = replaceAllLiteral(source, "round590", "round621");
source = replaceAllLiteral(source, "next94", "next98");
source = replaceAllLiteral(source, "Next94", "Next98");

// Advance the dedupe boundary so the generated Round621 pack excludes Round619.
source = replaceAllLiteral(source, "ROUND586", "ROUND619");
source = replaceAllLiteral(source, "Round586", "Round619");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round619_nyc_lpc_permit_next97");
source = replaceAllLiteral(source, "through round586", "through round619");
source = replaceAllLiteral(source, "round586", "round619");

if (!source.includes("const ROUND = 621;") || !source.includes('const NEXT = "next98";')) {
  throw new Error("Round621 generator did not advance round/next constants");
}
if (!source.includes('const ACCESSED_AT = "2026-05-23";')) {
  throw new Error("Round621 generator did not update the retrieval date");
}
if (!source.includes('const ROUND619_PACK = "tmp/subagents/round619_nyc_lpc_permit_next97/candidates.json";')) {
  throw new Error("Round621 generator did not include Round619 as the latest prior pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round621 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
