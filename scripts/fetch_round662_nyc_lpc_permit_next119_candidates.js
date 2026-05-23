const fs = require("fs");
const path = require("path");

const BASE_SCRIPT = path.join(__dirname, "fetch_round590_nyc_lpc_permit_next94_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round662 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round590/next94 to Round662/next119.
source = replaceAllLiteral(source, "const ROUND = 590;", "const ROUND = 662;");
source = replaceAllLiteral(source, 'const NEXT = "next94";', 'const NEXT = "next119";');
source = replaceAllLiteral(source, 'const ACCESSED_AT = "2026-05-20";', 'const ACCESSED_AT = "2026-05-23";');
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next944", "round662_nyc_lpc_permit_next1194");
source = replaceAllLiteral(source, "next944", "next1194");
source = replaceAllLiteral(source, "Next944", "Next1194");
source = replaceAllLiteral(source, "round590_nyc_lpc_permit_next94", "round662_nyc_lpc_permit_next119");
source = replaceAllLiteral(source, "Round590", "Round662");
source = replaceAllLiteral(source, "round590", "round662");
source = replaceAllLiteral(source, "next94", "next119");
source = replaceAllLiteral(source, "Next94", "Next119");

// Advance the scratch-pack dedupe boundary to the latest available NYC LPC pack on disk.
// Later LPC rows already appended to the live manual corpus are still excluded by corpus scanning.
source = replaceAllLiteral(source, "ROUND586", "ROUND660");
source = replaceAllLiteral(source, "Round586", "Round660");
source = replaceAllLiteral(source, "round586_nyc_lpc_permit_next93", "round660_nyc_lpc_permit_next118");
source = replaceAllLiteral(source, "through round586", "through round660");
source = replaceAllLiteral(source, "round586", "round660");

if (!source.includes("const ROUND = 662;") || !source.includes('const NEXT = "next119";')) {
  throw new Error("Round662 generator did not advance round/next constants");
}
if (!source.includes('const ACCESSED_AT = "2026-05-23";')) {
  throw new Error("Round662 generator did not update the retrieval date");
}
if (!source.includes('const ROUND660_PACK = "tmp/subagents/round660_nyc_lpc_permit_next118/candidates.json";')) {
  throw new Error("Round662 generator did not include Round660 as the latest available prior scratch pack");
}
if (source.includes("ROUND586") || source.includes("round586_nyc_lpc_permit_next93")) {
  throw new Error("Round662 generator still references the Round586 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
