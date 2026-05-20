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
  .replace(/const ROUND = 405;/g, "const ROUND = 462;")
  .replace(/round405_nyc_lpc_permit_next48/g, "round462_nyc_lpc_permit_next64")
  .replace(/round405/g, "round462")
  .replace(/Round405/g, "Round462")
  .replace(/next48/g, "next64")
  .replace(/Next48/g, "Next64")
  .replace(/through round399/g, "through round459");

source = replaceOnce(
  source,
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json"\n];`;',
  '  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json",\n  "tmp/subagents/round405_nyc_lpc_permit_next48/candidates.json",\n  "tmp/subagents/round411_nyc_lpc_permit_next49/candidates.json",\n  "tmp/subagents/round418_nyc_lpc_permit_next50/candidates.json",\n  "tmp/subagents/round423_nyc_lpc_permit_next51/candidates.json",\n  "tmp/subagents/round424_nyc_lpc_permit_next52/candidates.json",\n  "tmp/subagents/round427_nyc_lpc_permit_next53/candidates.json",\n  "tmp/subagents/round430_nyc_lpc_permit_next54/candidates.json",\n  "tmp/subagents/round433_nyc_lpc_permit_next55/candidates.json",\n  "tmp/subagents/round437_nyc_lpc_permit_next56/candidates.json",\n  "tmp/subagents/round440_nyc_lpc_permit_next57/candidates.json",\n  "tmp/subagents/round443_nyc_lpc_permit_next58/candidates.json",\n  "tmp/subagents/round446_nyc_lpc_permit_next59/candidates.json",\n  "tmp/subagents/round447_nyc_lpc_permit_next60/candidates.json",\n  "tmp/subagents/round450_nyc_lpc_permit_next61/candidates.json",\n  "tmp/subagents/round455_nyc_lpc_permit_next62/candidates.json",\n  "tmp/subagents/round459_nyc_lpc_permit_next63/candidates.json"\n];`;'
);

source = replaceOnce(
  source,
  '    "geometry",\n    "latitude",',
  '    "geometry",\n    "geometry_ref",\n    "address",\n    "borough",\n    "latitude",'
);

source = replaceOnce(
  source,
  '    latitude: point.latitude,\\n    longitude: point.longitude,\\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\\n',
  '    latitude: point.latitude,\\n    longitude: point.longitude,\\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\\n    geometry_ref: [address, borough, cleanText(row.block) ? "block " + cleanText(row.block) : "", cleanText(row.lot) ? "lot " + cleanText(row.lot) : ""].filter(Boolean).join("; "),\\n'
);

source = replaceOnce(
  source,
  'const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);\n',
  `source = replaceOnce(
  source,
  '    area: areaParts.length ? areaParts.join("; ") : "New York City landmark or historic district context from LPC permit row",\\n    location_name: [address, borough, "New York City"].filter(Boolean).join(", "),\\n',
  '    area: areaParts.length ? areaParts.join("; ") : "New York City landmark or historic district context from LPC permit row",\\n    location_name: [address, borough, "New York City"].filter(Boolean).join(", "),\\n    address,\\n    borough,\\n'
);

source = replaceOnce(
  source,
  '    "accessed_at",\\n    "source_date_field",',
  '    "accessed_at",\\n    "retrieved_at",\\n    "source_date_field",'
);

source = replaceOnce(
  source,
  '    "accessed_at",\\n    "coverage_years_checked",',
  '    "accessed_at",\\n    "retrieved_at",\\n    "coverage_years_checked",'
);

source = replaceOnce(
  source,
  '    accessed_at: ACCESSED_AT,\\n    source_retrieved_at: ACCESSED_AT,\\n',
  '    accessed_at: ACCESSED_AT,\\n    retrieved_at: ACCESSED_AT,\\n    source_retrieved_at: ACCESSED_AT,\\n'
);

source = replaceOnce(
  source,
  '        accessed_at: ACCESSED_AT,\\n        rows_updated_at_utc:',
  '        accessed_at: ACCESSED_AT,\\n        retrieved_at: ACCESSED_AT,\\n        rows_updated_at_utc:'
);

source = replaceOnce(
  source,
  'license/terms, accessed_at, method, confidence',
  'license/terms, accessed_at/retrieved_at, method, confidence'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
`
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
