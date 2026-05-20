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
  .replace(/const ROUND = 405;/g, "const ROUND = 437;")
  .replace(/round405_nyc_lpc_permit_next48/g, "round437_nyc_lpc_permit_next56")
  .replace(/round405/g, "round437")
  .replace(/Round405/g, "Round437")
  .replace(/next48/g, "next56")
  .replace(/Next48/g, "Next56")
  .replace(/through round399/g, "through round433");

source = replaceOnce(
  source,
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json"\n];`;',
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json",\n  "tmp/subagents/round405_nyc_lpc_permit_next48/candidates.json",\n  "tmp/subagents/round411_nyc_lpc_permit_next49/candidates.json",\n  "tmp/subagents/round418_nyc_lpc_permit_next50/candidates.json",\n  "tmp/subagents/round423_nyc_lpc_permit_next51/candidates.json",\n  "tmp/subagents/round424_nyc_lpc_permit_next52/candidates.json",\n  "tmp/subagents/round427_nyc_lpc_permit_next53/candidates.json",\n  "tmp/subagents/round430_nyc_lpc_permit_next54/candidates.json",\n  "tmp/subagents/round433_nyc_lpc_permit_next55/candidates.json"\n];`;'
);

source = replaceOnce(
  source,
  '    "geometry",\n    "latitude",',
  '    "geometry",\n    "geometry_ref",\n    "latitude",'
);

source = replaceOnce(
  source,
  '    latitude: point.latitude,\\n    longitude: point.longitude,\\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\\n',
  '    latitude: point.latitude,\\n    longitude: point.longitude,\\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\\n    geometry_ref: [address, borough, cleanText(row.block) ? "block " + cleanText(row.block) : "", cleanText(row.lot) ? "lot " + cleanText(row.lot) : ""].filter(Boolean).join("; "),\\n'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
