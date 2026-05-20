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
  '  "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json",\n  "tmp/subagents/round204_nyc_lpc_permit_next9/candidates.json",\n  "tmp/subagents/round210_nyc_lpc_permit_next10/candidates.json"\n];'
);

source = source
  .replace(/const ROUND = 204;/g, "const ROUND = 218;")
  .replace(/round204_nyc_lpc_permit_next9/g, "round218_nyc_lpc_permit_next11")
  .replace(/round204/g, "round218")
  .replace(/Round204/g, "Round218")
  .replace(/next9/g, "next11")
  .replace(/Next9/g, "Next11")
  .replace(/through round198/g, "through round210");

source = replaceOnce(
  source,
  "    latitude: point.latitude,\n    longitude: point.longitude,\n",
  '    latitude: point.latitude,\n    longitude: point.longitude,\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\n'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
