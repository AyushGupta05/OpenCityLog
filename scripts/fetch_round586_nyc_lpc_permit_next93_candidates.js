const fs = require("fs");
const path = require("path");

const ROUND559_SCRIPT = path.join(__dirname, "fetch_round559_nyc_lpc_permit_next89_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round586 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

function normalizeRound586Names(text) {
  return text
    .replace(/round559_nyc_lpc_permit_next899/g, "round559_nyc_lpc_permit_next89")
    .replace(/round564_nyc_lpc_permit_next930/g, "round564_nyc_lpc_permit_next90")
    .replace(/round573_nyc_lpc_permit_next931/g, "round573_nyc_lpc_permit_next91")
    .replace(/round580_nyc_lpc_permit_next932/g, "round580_nyc_lpc_permit_next92")
    .replace(/round586_nyc_lpc_permit_next933/g, "round586_nyc_lpc_permit_next93")
    .replace(/next933/g, "next93")
    .replace(/Next933/g, "Next93");
}

let source = fs.readFileSync(ROUND559_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 559;/g, "const ROUND = 586;")
  .replace(/round559_nyc_lpc_permit_next89/g, "round586_nyc_lpc_permit_next93")
  .replace(/round559/g, "round586")
  .replace(/Round559/g, "Round586")
  .replace(/next89/g, "next93")
  .replace(/Next89/g, "Next93")
  .replace(/through round553/g, "through round580");

const priorAnchor = '"tmp/subagents/round553_nyc_lpc_permit_next88/candidates.json"';
const priorAnchorIndex = source.indexOf(priorAnchor);
if (priorAnchorIndex < 0) {
  throw new Error("Round586 prior-pack anchor not found");
}
const priorAnchorEnd = priorAnchorIndex + priorAnchor.length;
const priorListEnd = source.indexOf("];`;", priorAnchorEnd);
if (priorListEnd < 0) {
  throw new Error("Round586 prior-pack terminator not found");
}
const encodedLineBreak = source.slice(priorAnchorEnd, priorListEnd);
source =
  source.slice(0, priorAnchorEnd) +
  "," +
  encodedLineBreak +
  '"tmp/subagents/round559_nyc_lpc_permit_next89/candidates.json",' +
  encodedLineBreak +
  '"tmp/subagents/round564_nyc_lpc_permit_next90/candidates.json",' +
  encodedLineBreak +
  '"tmp/subagents/round573_nyc_lpc_permit_next91/candidates.json",' +
  encodedLineBreak +
  '"tmp/subagents/round580_nyc_lpc_permit_next92/candidates.json"' +
  encodedLineBreak +
  source.slice(priorListEnd);

source = normalizeRound586Names(source);

source = replaceOnce(
  source,
  'const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);\n',
  `${normalizeRound586Names.toString()}
source = normalizeRound586Names(source);
const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
`
);

source = replaceOnce(
  source,
  'latest_lpc_permit_pack: "tmp/subagents/round553_nyc_lpc_permit_next88/candidates.json"',
  'latest_lpc_permit_pack: "tmp/subagents/round580_nyc_lpc_permit_next92/candidates.json"'
);

const wrongOutDirs = [
  path.join(__dirname, "..", "tmp", "subagents", "round586_nyc_lpc_permit_next930"),
  path.join(__dirname, "..", "tmp", "subagents", "round586_nyc_lpc_permit_next931"),
  path.join(__dirname, "..", "tmp", "subagents", "round586_nyc_lpc_permit_next932"),
  path.join(__dirname, "..", "tmp", "subagents", "round586_nyc_lpc_permit_next933")
];
const rightOutDir = path.join(__dirname, "..", "tmp", "subagents", "round586_nyc_lpc_permit_next93");

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

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
    const normalized = normalizeRound586Names(text);
    if (normalized !== text) fs.writeFileSync(fullPath, normalized, "utf8");
  }
}

function normalizedTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function writeStrictDuplicateAudit() {
  const candidatesPath = path.join(rightOutDir, "candidates.json");
  const summaryPath = path.join(rightOutDir, "summary.json");
  const validationPath = path.join(rightOutDir, "validation_report.json");
  const readbackPath = path.join(rightOutDir, "readback.json");
  const strictPath = path.join(rightOutDir, "strict_duplicate_audit.json");
  const notesPath = path.join(rightOutDir, "notes.md");

  const candidatesPayload = readJsonIfExists(candidatesPath);
  const summary = readJsonIfExists(summaryPath);
  const validation = readJsonIfExists(validationPath);
  const readback = readJsonIfExists(readbackPath);
  if (!candidatesPayload || !summary || !validation || !readback) return;

  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const recordDateKeys = candidates.map((candidate) => `${candidate.source_record_id}|${candidate.date}`);
  const sourceRecordDateKeys = candidates.map((candidate) =>
    `${String(candidate.source_dataset_id || candidate.source_id || "").toLowerCase()}|${candidate.source_record_id}|${candidate.date}`
  );
  const titleDateKeys = candidates.map((candidate) =>
    `${candidate.city_id || "nyc"}|${normalizedTitle(candidate.title)}|${candidate.date}`
  );
  const checks = validation.checks || {};
  const priorPacks = Array.isArray(checks.prior_lpc_packs_scanned) ? checks.prior_lpc_packs_scanned : [];

  const audit = {
    generated_at: summary.generated_at,
    audit_scope: "Round586 strict duplicate audit for NYC LPC Permit Application Information next93 candidates.",
    dedupe_boundary: {
      manual_corpus_scanned: checks.manual_corpus_scanned || null,
      latest_lpc_permit_pack: "tmp/subagents/round580_nyc_lpc_permit_next92/candidates.json",
      prior_lpc_packs_scanned: priorPacks,
      prior_lpc_pack_count: priorPacks.length,
      includes_round580: priorPacks.includes("tmp/subagents/round580_nyc_lpc_permit_next92/candidates.json"),
      missing_overlap_inputs: checks.missing_overlap_inputs || [],
      overlap_inputs_scanned: checks.overlap_inputs_scanned || null,
      existing_event_ids_seen: checks.existing_event_ids_seen || null,
      existing_record_ids_seen: checks.existing_record_ids_seen || null
    },
    selected_candidate_count: candidates.length,
    selected_unique_counts: {
      event_ids: new Set(candidates.map((candidate) => candidate.event_id)).size,
      source_record_ids: new Set(candidates.map((candidate) => candidate.source_record_id)).size,
      source_urls: new Set(candidates.map((candidate) => candidate.source_url)).size,
      source_record_date_keys: new Set(recordDateKeys).size,
      source_dataset_record_date_keys: new Set(sourceRecordDateKeys).size,
      title_date_keys: new Set(titleDateKeys).size
    },
    validation_overlap_checks: {
      validation_passed: validation.passed === true,
      readback_passed: readback.passed === true,
      unique_event_ids: checks.unique_event_ids || null,
      unique_source_record_ids: checks.unique_source_record_ids || null,
      unique_source_urls: checks.unique_source_urls || null,
      unique_record_date_keys: checks.unique_record_date_keys || null,
      unique_source_date_keys: checks.unique_source_date_keys || null,
      unique_title_date_keys: checks.unique_title_date_keys || null
    },
    selected_source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    passed:
      validation.passed === true &&
      readback.passed === true &&
      priorPacks.includes("tmp/subagents/round580_nyc_lpc_permit_next92/candidates.json") &&
      new Set(candidates.map((candidate) => candidate.event_id)).size === candidates.length &&
      new Set(candidates.map((candidate) => candidate.source_record_id)).size === candidates.length &&
      new Set(candidates.map((candidate) => candidate.source_url)).size === candidates.length &&
      new Set(recordDateKeys).size === candidates.length &&
      new Set(titleDateKeys).size === candidates.length
  };

  fs.writeFileSync(strictPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

  if (fs.existsSync(notesPath)) {
    const notes = fs.readFileSync(notesPath, "utf8");
    if (!notes.includes("- strict_duplicate_audit.json")) {
      fs.writeFileSync(notesPath, notes.replace("- readback.json", "- readback.json\n- strict_duplicate_audit.json"), "utf8");
    }
  }
}

function finalizeRound586Output() {
  for (const wrongOutDir of wrongOutDirs) {
    if (!fs.existsSync(wrongOutDir)) continue;
    fs.rmSync(rightOutDir, { recursive: true, force: true });
    fs.renameSync(wrongOutDir, rightOutDir);
  }
  normalizeOutputNames(rightOutDir);
  writeStrictDuplicateAudit();
}

process.once("beforeExit", finalizeRound586Output);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
const normalizedConsole = {
  ...console,
  log: (...args) => console.log(...args.map((arg) => (typeof arg === "string" ? normalizeRound586Names(arg) : arg))),
  error: (...args) => console.error(...args.map((arg) => (typeof arg === "string" ? normalizeRound586Names(arg) : arg)))
};
runner(require, __dirname, __filename, process, normalizedConsole, fetch);
