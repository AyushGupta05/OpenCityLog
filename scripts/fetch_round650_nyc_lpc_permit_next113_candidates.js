const fs = require("fs");
const path = require("path");

const BASE_WRAPPER = path.join(__dirname, "fetch_round648_nyc_lpc_permit_next112_candidates.js");

function replaceAllLiteral(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round650 generator marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs.readFileSync(BASE_WRAPPER, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

// Advance the current pack from Round648/next112 to Round650/next113.
source = replaceAllLiteral(source, "const ROUND = 648;", "const ROUND = 650;");
source = replaceAllLiteral(source, 'const NEXT = "next112";', 'const NEXT = "next113";');
source = replaceAllLiteral(source, "round648_nyc_lpc_permit_next1124", "round650_nyc_lpc_permit_next1134");
source = replaceAllLiteral(source, "next1124", "next1134");
source = replaceAllLiteral(source, "Next1124", "Next1134");
source = replaceAllLiteral(source, "round648_nyc_lpc_permit_next112", "round650_nyc_lpc_permit_next113");
source = replaceAllLiteral(source, "Round648", "Round650");
source = replaceAllLiteral(source, "round648", "round650");
source = replaceAllLiteral(source, "next112", "next113");
source = replaceAllLiteral(source, "Next112", "Next113");

// Advance the dedupe boundary so the generated Round650 pack excludes Round648.
source = replaceAllLiteral(source, "ROUND646", "ROUND648");
source = replaceAllLiteral(source, "Round646", "Round648");
source = replaceAllLiteral(source, "round646_nyc_lpc_permit_next111", "round648_nyc_lpc_permit_next112");
source = replaceAllLiteral(source, "through round646", "through round648");
source = replaceAllLiteral(source, "round646", "round648");

if (!source.includes("const ROUND = 650;") || !source.includes('const NEXT = "next113";')) {
  throw new Error("Round650 generator did not advance round/next constants");
}
if (!source.includes('const ACCESSED_AT = "2026-05-23";')) {
  throw new Error("Round650 generator did not retain the retrieval date");
}
if (!source.includes('const ROUND648_PACK = "tmp/subagents/round648_nyc_lpc_permit_next112/candidates.json";')) {
  throw new Error("Round650 generator did not include Round648 as the latest prior pack");
}
if (source.includes("ROUND646") || source.includes("round646_nyc_lpc_permit_next111")) {
  throw new Error("Round650 generator still references the Round646 boundary");
}

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
