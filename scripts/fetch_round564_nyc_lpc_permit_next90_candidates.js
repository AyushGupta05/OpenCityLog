const fs = require("fs");
const path = require("path");

const ROUND559_SCRIPT = path.join(__dirname, "fetch_round559_nyc_lpc_permit_next89_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round559 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND559_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 559;/g, "const ROUND = 564;")
  .replace(/round559_nyc_lpc_permit_next89/g, "round564_nyc_lpc_permit_next90")
  .replace(/round559/g, "round564")
  .replace(/Round559/g, "Round564")
  .replace(/next89/g, "next90")
  .replace(/Next89/g, "Next90")
  .replace(/through round553/g, "through round559");

const priorAnchor = '"tmp/subagents/round553_nyc_lpc_permit_next88/candidates.json"';
const priorAnchorIndex = source.indexOf(priorAnchor);
if (priorAnchorIndex < 0) {
  throw new Error("Round559 prior-pack anchor not found");
}
const priorAnchorEnd = priorAnchorIndex + priorAnchor.length;
const priorListEnd = source.indexOf("];`;", priorAnchorEnd);
if (priorListEnd < 0) {
  throw new Error("Round559 prior-pack terminator not found");
}
const encodedLineBreak = source.slice(priorAnchorEnd, priorListEnd);
source =
  source.slice(0, priorAnchorEnd) +
  "," +
  encodedLineBreak +
  '  "tmp/subagents/round559_nyc_lpc_permit_next89/candidates.json"' +
  encodedLineBreak +
  source.slice(priorListEnd);

source = source.replace(/next900/g, "next90");

source = replaceOnce(
  source,
  'const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);\n',
  'source = source.replace(/next900/g, "next90");\nconst runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);\n'
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round553_nyc_lpc_permit_next88/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round559_nyc_lpc_permit_next89/candidates.json"'
);

const wrongOutDir = path.join(__dirname, "..", "tmp", "subagents", "round564_nyc_lpc_permit_next900");
const rightOutDir = path.join(__dirname, "..", "tmp", "subagents", "round564_nyc_lpc_permit_next90");

function normalizeOutputNames(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      normalizeOutputNames(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    const text = fs.readFileSync(fullPath, "utf8");
    if (text.includes("next900")) {
      fs.writeFileSync(fullPath, text.replace(/next900/g, "next90"));
    }
  }
}

function normalizeRound564Output() {
  if (fs.existsSync(wrongOutDir)) {
    fs.rmSync(rightOutDir, { recursive: true, force: true });
    fs.renameSync(wrongOutDir, rightOutDir);
  }
  normalizeOutputNames(rightOutDir);
}

process.once("beforeExit", normalizeRound564Output);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
