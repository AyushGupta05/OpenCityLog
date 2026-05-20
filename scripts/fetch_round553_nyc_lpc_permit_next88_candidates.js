const fs = require("fs");
const path = require("path");

const ROUND505_SCRIPT = path.join(__dirname, "fetch_round505_nyc_lpc_permit_next76_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round505 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND505_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 505;/g, "const ROUND = 553;")
  .replace(/round505_nyc_lpc_permit_next76/g, "round553_nyc_lpc_permit_next88")
  .replace(/round505/g, "round553")
  .replace(/Round505/g, "Round553")
  .replace(/next76/g, "next88")
  .replace(/Next76/g, "Next88")
  .replace(/through round501/g, "through round551");

source = replaceOnce(
  source,
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"\\\\\\\\n];`;',
  '  "tmp/subagents/round491_nyc_lpc_permit_next72/candidates.json",\\\\\\\\n  "tmp/subagents/round492_nyc_lpc_permit_next73/candidates.json",\\\\\\\\n  "tmp/subagents/round497_nyc_lpc_permit_next74/candidates.json",\\\\\\\\n  "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json",\\\\\\\\n  "tmp/subagents/round505_nyc_lpc_permit_next76/candidates.json",\\\\\\\\n  "tmp/subagents/round513_nyc_lpc_permit_next77/candidates.json",\\\\\\\\n  "tmp/subagents/round518_nyc_lpc_permit_next78/candidates.json",\\\\\\\\n  "tmp/subagents/round523_nyc_lpc_permit_next79/candidates.json",\\\\\\\\n  "tmp/subagents/round525_nyc_lpc_permit_next80/candidates.json",\\\\\\\\n  "tmp/subagents/round528_nyc_lpc_permit_next81/candidates.json",\\\\\\\\n  "tmp/subagents/round530_nyc_lpc_permit_next82/candidates.json",\\\\\\\\n  "tmp/subagents/round535_nyc_lpc_permit_next83/candidates.json",\\\\\\\\n  "tmp/subagents/round539_nyc_lpc_permit_next84/candidates.json",\\\\\\\\n  "tmp/subagents/round543_nyc_lpc_permit_next85/candidates.json",\\\\\\\\n  "tmp/subagents/round548_nyc_lpc_permit_next86/candidates.json",\\\\\\\\n  "tmp/subagents/round551_nyc_lpc_permit_next87/candidates.json"\\\\\\\\n];`;'
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round501_nyc_lpc_permit_next75/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round551_nyc_lpc_permit_next87/candidates.json"'
);

source = replaceOnce(
  source,
  'const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);\n',
  `function injectRound553MissingAddressFilter(innerSource) {
  const selectorMarker = [
    '    if (!regulationNumber) {',
    '      reject(rejected, "missing_regulation_number", row);',
    '      continue;',
    '    }',
    '    if (existing.recordIds.has(regulationNumber) || seenRecordIds.has(regulationNumber)) {'
  ].join(String.fromCharCode(10));
  const selectorReplacement = [
    '    if (!regulationNumber) {',
    '      reject(rejected, "missing_regulation_number", row);',
    '      continue;',
    '    }',
    '    if (!cleanText(row.address)) {',
    '      reject(rejected, "missing_address", row);',
    '      continue;',
    '    }',
    '    if (existing.recordIds.has(regulationNumber) || seenRecordIds.has(regulationNumber)) {'
  ].join(String.fromCharCode(10));
  if (innerSource.includes(selectorMarker)) {
    return innerSource.replace(selectorMarker, selectorReplacement);
  }
  const runnerMarker = 'const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);' + String.fromCharCode(10);
  if (innerSource.includes(runnerMarker)) {
    const bridge = injectRound553MissingAddressFilter.toString() + String.fromCharCode(10) + 'source = injectRound553MissingAddressFilter(source);' + String.fromCharCode(10) + runnerMarker;
    return innerSource.replace(runnerMarker, bridge);
  }
  throw new Error("Round553 missing-address injection target not found");
}

source = injectRound553MissingAddressFilter(source);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
`
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
