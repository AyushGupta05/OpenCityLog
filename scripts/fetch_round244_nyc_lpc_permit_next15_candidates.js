const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round204_nyc_lpc_permit_next9_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

function replaceRegexOnce(source, regex, replacement, label) {
  if (!regex.test(source)) {
    throw new Error(`Template marker not found: ${label}`);
  }
  return source.replace(regex, replacement);
}

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "");

source = source
  .replace(/const ROUND = 204;/g, "const ROUND = 244;")
  .replace(/round204_nyc_lpc_permit_next9/g, "round244_nyc_lpc_permit_next15")
  .replace(/round204/g, "round244")
  .replace(/Round204/g, "Round244")
  .replace(/next9/g, "next15")
  .replace(/Next9/g, "Next15")
  .replace(/through round198/g, "through round240");

source = replaceRegexOnce(
  source,
  /const PRIOR_PACK_PATHS = \[[\s\S]*?\];/,
  `const PRIOR_PACK_PATHS = [
  "tmp/subagents/round112_nyc_lpc_permit_candidates.json",
  "tmp/subagents/round114_nyc_lpc_landmarks_official/round114_nyc_lpc_landmarks_candidates.json",
  "tmp/subagents/round115_nyc_lpc_fuller_official/round115_nyc_lpc_fuller_candidates.json",
  "tmp/subagents/round115_nyc_lpc_individual_official/round115_nyc_lpc_individual_candidates.json",
  "tmp/subagents/round116_nyc_lpc_permits_official/candidates.json",
  "tmp/subagents/round120_nyc_lpc_designations_more/candidates.json",
  "tmp/subagents/round122_nyc_lpc_permits_designations/candidates.json",
  "tmp/subagents/round130_heritage_designations_more/candidates.json",
  "tmp/subagents/round138_nyc_lpc_individual_landmark_gaps/candidates.json",
  "tmp/subagents/round142_nyc_lpc_designation_gaps/candidates.json",
  "tmp/subagents/round154_nyc_lpc_permit_deep/candidates.json",
  "tmp/subagents/round159_nyc_lpc_permit_next/candidates.json",
  "tmp/subagents/round163_nyc_lpc_permit_next2/candidates.json",
  "tmp/subagents/round168_nyc_lpc_permit_next3/candidates.json",
  "tmp/subagents/round174_nyc_lpc_permit_next4/candidates.json",
  "tmp/subagents/round180_nyc_lpc_permit_next5/candidates.json",
  "tmp/subagents/round186_nyc_lpc_permit_next6/candidates.json",
  "tmp/subagents/round192_nyc_lpc_permit_next7/candidates.json",
  "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json",
  "tmp/subagents/round204_nyc_lpc_permit_next9/candidates.json",
  "tmp/subagents/round210_nyc_lpc_permit_next10/candidates.json",
  "tmp/subagents/round216_nyc_lpc_designation_tail/candidates.json",
  "tmp/subagents/round218_nyc_lpc_permit_next11/candidates.json",
  "tmp/subagents/round224_nyc_lpc_permit_next12/candidates.json",
  "tmp/subagents/round231_nyc_lpc_permit_next13/candidates.json",
  "tmp/subagents/round240_nyc_lpc_permit_next14/candidates.json"
];`,
  "PRIOR_PACK_PATHS"
);

source = replaceOnce(
  source,
  "    latitude: point.latitude,\n    longitude: point.longitude,\n",
  '    latitude: point.latitude,\n    longitude: point.longitude,\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\n'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
