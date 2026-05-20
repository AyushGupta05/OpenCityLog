const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round204_nyc_lpc_permit_next9_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "");

source = replaceOnce(
  source,
  '  "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json"\n];',
  '  "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json",\n  "tmp/subagents/round204_nyc_lpc_permit_next9/candidates.json",\n  "tmp/subagents/round210_nyc_lpc_permit_next10/candidates.json",\n  "tmp/subagents/round218_nyc_lpc_permit_next11/candidates.json"\n];'
);

source = source
  .replace(/const ROUND = 204;/g, "const ROUND = 224;")
  .replace(/round204_nyc_lpc_permit_next9/g, "round224_nyc_lpc_permit_next12")
  .replace(/round204/g, "round224")
  .replace(/Round204/g, "Round224")
  .replace(/next9/g, "next12")
  .replace(/Next9/g, "Next12")
  .replace(/through round198/g, "through round218");

source = replaceOnce(
  source,
  "    latitude: point.latitude,\n    longitude: point.longitude,\n",
  '    latitude: point.latitude,\n    longitude: point.longitude,\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\n'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
