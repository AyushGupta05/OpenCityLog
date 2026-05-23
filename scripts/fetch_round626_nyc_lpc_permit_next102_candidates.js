const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round626 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round626/next102.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 626;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next102";');
source = replaceAllLiteral(source, 'const ACCESSED_AT = "2026-05-20";', 'const ACCESSED_AT = "2026-05-23";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round626_nyc_lpc_permit_next1022");
source = replaceAllLiteral(source, "next944", "next1022");
source = replaceAllLiteral(source, "Next944", "Next1022");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round626_nyc_lpc_permit_next102");
source = replaceAllLiteral(source, "Round590", "Round626");
source = replaceAllLiteral(source, "round590", "round626");
source = replaceAllLiteral(source, "next94", "next102");
source = replaceAllLiteral(source, "Next94", "Next102");

// Advance the dedupe boundary so the generated Round626 pack excludes Round624.
source = replaceAllLiteral(source, "ROUND586", "ROUND624");
source = replaceAllLiteral(source, "Round586", "Round624");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round624_nyc_lpc_permit_next101");
source = replaceAllLiteral(source, "through round586", "through round624");
source = replaceAllLiteral(source, "round586", "round624");

if (!source.includes("const ROUND = 626;") || !source.includes('const NEXT = "next102";')) {
  throw new Error("Round626 generator did not advance round/next constants");
}
if (!source.includes('const ACCESSED_AT = "2026-05-23";')) {
  throw new Error("Round626 generator did not update the retrieval date");
}
if (!source.includes('const ROUND624_PACK = "tmp/subagents/round624_nyc_lpc_permit_next101/candidates.json";')) {
  throw new Error("Round626 generator did not include Round624 as the latest prior pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round626 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
