const fs = require("fs");
const path = require("path");

const ROUND471_SCRIPT = path.join(__dirname, "fetch_round471_nyc_lpc_permit_next66_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round471 marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

let source = fs.readFileSync(ROUND471_SCRIPT, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 471;/g, "const ROUND = 491;")
  .replace(/round471_nyc_lpc_permit_next66/g, "round491_nyc_lpc_permit_next72")
  .replace(/round471/g, "round491")
  .replace(/Round471/g, "Round491")
  .replace(/next66/g, "next72")
  .replace(/Next66/g, "Next72")
  .replace(/through round466/g, "through round489");

source = replaceOnce(
  source,
  '  "tmp/subagents/round466_nyc_lpc_permit_next65/candidates.json"\\n];`;',
  '  "tmp/subagents/round466_nyc_lpc_permit_next65/candidates.json",\\n  "tmp/subagents/round471_nyc_lpc_permit_next66/candidates.json",\\n  "tmp/subagents/round476_nyc_lpc_permit_next67/candidates.json",\\n  "tmp/subagents/round479_nyc_lpc_permit_next68/candidates.json",\\n  "tmp/subagents/round482_nyc_lpc_permit_next69/candidates.json",\\n  "tmp/subagents/round486_nyc_lpc_permit_next70/candidates.json",\\n  "tmp/subagents/round489_nyc_lpc_permit_next71/candidates.json"\\n];`;'
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);

let duplicateAuditWritten = false;

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function writeRound491DuplicateAudit() {
  if (duplicateAuditWritten || process.exitCode) return;
  duplicateAuditWritten = true;

  const root = path.resolve(__dirname, "..");
  const outDir = path.join(root, "tmp", "subagents", "round491_nyc_lpc_permit_next72");
  const candidatesPath = path.join(outDir, "candidates.json");
  const summaryPath = path.join(outDir, "summary.json");
  const validationPath = path.join(outDir, "validation_report.json");
  const readbackPath = path.join(outDir, "readback.json");
  const duplicateAuditPath = path.join(outDir, "duplicate_audit.json");
  const notesPath = path.join(outDir, "notes.md");

  const candidatesPayload = readJsonIfExists(candidatesPath);
  const summary = readJsonIfExists(summaryPath);
  const validation = readJsonIfExists(validationPath);
  const readback = readJsonIfExists(readbackPath);
  if (!candidatesPayload || !summary || !validation || !readback) return;

  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const recordDateKeys = candidates.map((candidate) => `${candidate.source_record_id}|${candidate.date}`);
  const sourceDateKeys = candidates.flatMap((candidate) => [
    `${String(candidate.source_id || "").toLowerCase()}|${candidate.source_record_id}|${candidate.date}`,
    `${String(candidate.source_dataset_id || "").toLowerCase()}|${candidate.source_record_id}|${candidate.date}`,
    `nyc-lpc-permit-application-information|${candidate.source_record_id}|${candidate.date}`,
    `dpm2-m9mq|${candidate.source_record_id}|${candidate.date}`
  ]);
  const checks = validation.checks || {};
  const priorPacks = Array.isArray(checks.prior_lpc_packs_scanned) ? checks.prior_lpc_packs_scanned : [];

  const audit = {
    generated_at: summary.generated_at,
    audit_scope: "Round491 duplicate audit for NYC LPC Permit Application Information next72 candidates.",
    dedupe_boundary: {
      latest_lpc_permit_pack: "tmp/subagents/round489_nyc_lpc_permit_next71/candidates.json",
      prior_lpc_packs_scanned: priorPacks,
      prior_lpc_pack_count: priorPacks.length,
      manual_corpus_scanned: checks.manual_corpus_scanned || null,
      overlap_inputs_scanned: checks.overlap_inputs_scanned || null,
      missing_overlap_inputs: checks.missing_overlap_inputs || []
    },
    selected_candidate_count: candidates.length,
    selected_unique_counts: {
      event_ids: new Set(candidates.map((candidate) => candidate.event_id)).size,
      source_record_ids: new Set(candidates.map((candidate) => candidate.source_record_id)).size,
      source_urls: new Set(candidates.map((candidate) => candidate.source_url)).size,
      record_date_keys: new Set(recordDateKeys).size,
      source_date_keys_checked: new Set(sourceDateKeys).size
    },
    validation_overlap_checks: {
      validation_passed: validation.passed === true,
      validation_error_count: Array.isArray(validation.errors) ? validation.errors.length : null,
      readback_passed: readback.passed === true,
      readback_error_count: Array.isArray(readback.errors) ? readback.errors.length : null,
      unique_event_ids: checks.unique_event_ids || null,
      unique_source_record_ids: checks.unique_source_record_ids || null,
      unique_record_date_keys: checks.unique_record_date_keys || null,
      unique_source_date_keys: checks.unique_source_date_keys || null,
      unique_source_urls: checks.unique_source_urls || null,
      unique_title_date_keys: checks.unique_title_date_keys || null
    },
    selected_source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    passed: validation.passed === true && readback.passed === true
  };

  fs.writeFileSync(duplicateAuditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

  if (fs.existsSync(notesPath)) {
    const notes = fs.readFileSync(notesPath, "utf8");
    if (!notes.includes("- duplicate_audit.json")) {
      fs.writeFileSync(notesPath, notes.replace("- notes.md", "- notes.md\n- duplicate_audit.json"), "utf8");
    }
  }
}

process.on("beforeExit", writeRound491DuplicateAudit);
