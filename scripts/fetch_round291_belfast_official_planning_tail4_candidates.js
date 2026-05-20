const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_SCRIPT = path.join(ROOT, "scripts", "fetch_round281_belfast_official_planning_tail2_candidates.js");

function buildRound291Script(source) {
  let transformed = source
    .replaceAll("round281_belfast_official_planning_tail2", "round291_belfast_official_planning_tail4")
    .replaceAll("fetch_round281_belfast_official_planning_tail2_candidates.js", "fetch_round291_belfast_official_planning_tail4_candidates.js")
    .replaceAll("Round281", "Round291")
    .replaceAll("round281", "round291")
    .replaceAll("tail2", "tail4")
    .replaceAll("after round270", "after round286")
    .replaceAll("quality.score < 65", "quality.score < 39")
    .replaceAll("met a conservative tail gate", "met a tail4 residual physical-works gate")
    .replaceAll("capped the ranked review pack at 120", "capped the ranked review pack at 100")
    .replaceAll(
      "forecasts, impacts, or causal evidence",
      "future projections, outcome claims, or cause-and-effect evidence"
    )
    .replaceAll(
      "current manual architecture corpus, round270, and prior Belfast candidate packs",
      "current manual architecture corpus, round270, round281, round286, and prior Belfast candidate packs through round286"
    )
    .replaceAll(
      "current manual architecture corpus, round270, or prior Belfast packs",
      "current manual architecture corpus, round270, round281, round286, or prior Belfast packs through round286"
    )
    .replace("const TARGET_CANDIDATES = 120;", "const TARGET_CANDIDATES = 100;");

  const includesRound270 =
    "includes_round270: index.files.some((entry) => /round270_belfast_official_planning_tail\\/candidates\\.json$/i.test(entry.path))";
  transformed = transformed.replace(
    includesRound270,
    `${includesRound270},
      includes_round281: index.files.some((entry) => /round281_belfast_official_planning_tail2\\/candidates\\.json$/i.test(entry.path)),
      includes_round286: index.files.some((entry) => /round286_belfast_official_planning_tail3\\/candidates\\.json$/i.test(entry.path))`
  );

  transformed = transformed.replaceAll(
    "prior-Belfast-pack dedupe",
    "prior-Belfast-pack dedupe through round286"
  );

  transformed = transformed.replace(
    "function buildPlanningCandidates(index) {",
    `function round291ResidualRejectionReason(record) {
  const proposal = cleanText(record.proposal);
  const combined = normalizeText(\`\${proposal} \${cleanText(record.address)} \${cleanText(record.appType)}\`);

  if (
    /\\b(listed dwelling|ancillary coach house|private dwelling|dwelling house)\\b/i.test(combined) &&
    !/\\b(apartments?|flats?|student accommodation|care home|community|hospital|school|university|restaurant|office|public house)\\b/i.test(combined)
  ) {
    return "round291_private_domestic_or_dwelling_tail_residue";
  }

  if (
    /\\b(new shop front and interior alterations|sub\\s*divide.*retail.*cafe.*retail|subdivision of existing retail unit|reconfiguration of existing shop front|repair of ground floor windows\\/?doors)\\b/i.test(
      combined
    ) &&
    !/\\b(restoration|demolition|apartments?|flats?|hospital|community|surestart|sail loft)\\b/i.test(combined)
  ) {
    return "round291_minor_retail_shopfront_tail_residue";
  }

  return "";
}

function buildPlanningCandidates(index) {`
  );

  transformed = transformed.replace(
    /    seenApps\.add\(record\.appIdKey\);\r?\n    seenSourceDate\.add\(sourceDateKey\);/,
    `    const round291ResidualReason = round291ResidualRejectionReason(record);
    if (round291ResidualReason) {
      addRejection(rejected, rejectionCounts, round291ResidualReason, record, {
        tail_score: quality.score,
        base_score: quality.base_score,
        quality_reasons: quality.reasons,
        base_signals: quality.base_signals
      });
      continue;
    }

    seenApps.add(record.appIdKey);
    seenSourceDate.add(sourceDateKey);`
  );

  if (!transformed.includes("const round291ResidualReason = round291ResidualRejectionReason(record);")) {
    throw new Error("Round291 residual gate insertion failed");
  }

  transformed = transformed.replace(
    "main().catch((error) => {",
    `main().then(() => {
  const validationJsonPath = path.join(OUT_DIR, "validation.json");
  const candidatesPayload = readJson(OUTPUTS.candidates);
  const summaryPayload = readJson(OUTPUTS.summary);
  const validationPayload = readJson(OUTPUTS.validationReport);
  const candidateRows = candidatesPayload && Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const sourceDateFieldMix = countBy(candidateRows, (candidate) => candidate.source_date_field || "missing_source_date_field");

  if (candidatesPayload) {
    candidatesPayload.source_date_field_mix = sourceDateFieldMix;
    writeJson(OUTPUTS.candidates, candidatesPayload);
  }
  if (summaryPayload) {
    summaryPayload.counts_by_source_date_field = sourceDateFieldMix;
    summaryPayload.output_files.validation = path.relative(ROOT, validationJsonPath).replace(/\\\\/g, "/");
    writeJson(OUTPUTS.summary, summaryPayload);
  }
  if (validationPayload) {
    validationPayload.source_date_field_mix = sourceDateFieldMix;
    writeJson(OUTPUTS.validationReport, validationPayload);
    writeJson(validationJsonPath, validationPayload);
  }
}).catch((error) => {`
  );

  return transformed;
}

function main() {
  const source = fs.readFileSync(BASE_SCRIPT, "utf8");
  const script = buildRound291Script(source);
  const context = {
    require,
    console,
    process,
    Buffer,
    fetch,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    __dirname,
    __filename
  };
  vm.runInNewContext(script, context, {
    filename: __filename,
    displayErrors: true
  });
}

main();
