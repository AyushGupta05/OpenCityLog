const fs = require("fs");
const path = require("path");

const baseScriptPath = path.join(__dirname, "fetch_round251_nyc_hpd_affordable_housing_next8_candidates.js");
let source = fs.readFileSync(baseScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round251 HPD fetcher for round292: missing ${label}.`);
  }
  source = next;
}

replaceChecked(
  'const outDir = "tmp/subagents/round251_nyc_hpd_affordable_housing_next8";',
  'const outDir = "tmp/subagents/round292_nyc_hpd_affordable_housing_next14";',
  "output directory"
);
replaceChecked('const accessedAt = "2026-05-19";', 'const accessedAt = "2026-05-20";', "access date");
replaceChecked('const roundName = "Round251";', 'const roundName = "Round292";', "round name");
replaceChecked("const maxScreeningRound = 246;", "const maxScreeningRound = 283;", "screening round");
replaceChecked(/Round251/g, "Round292", "round label references");
replaceChecked(/round251\.nyc/g, "round292.nyc", "schema round prefix");
replaceChecked(
  /nyc_hpd_affordable_housing_next8/g,
  "nyc_hpd_affordable_housing_next14",
  "next pack label"
);
replaceChecked(
  /  "tmp\/subagents\/round246_nyc_hpd_affordable_housing_next7\/candidates\.json"\r?\n\];/,
  '  "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json",\n  "tmp/subagents/round251_nyc_hpd_affordable_housing_next8/candidates.json",\n  "tmp/subagents/round255_nyc_hpd_affordable_housing_next9/candidates.json",\n  "tmp/subagents/round263_nyc_hpd_affordable_housing_next10/candidates.json",\n  "tmp/subagents/round269_nyc_hpd_affordable_housing_next11/candidates.json",\n  "tmp/subagents/round275_nyc_hpd_affordable_housing_next12/candidates.json",\n  "tmp/subagents/round283_nyc_hpd_affordable_housing_next13/candidates.json"\n];',
  "explicit HPD candidate pack list"
);
replaceChecked(
  /candidate_files_considered_through_round246/g,
  "candidate_files_considered_through_round283",
  "candidate-files summary key"
);
replaceChecked(
  "function extractUrlRecordId(urlText) {",
  `function isCurrentRound292CorpusRow(row) {
  const method = String(row?.transformation_method || "");
  return /Round292|Next14Round292/i.test(method);
}

function extractUrlRecordId(urlText) {`,
  "current-round corpus idempotency helper"
);
replaceChecked(
  /    candidateFilesConsidered: 0\r?\n  };/,
  "    candidateFilesConsidered: 0,\n    skippedCurrentRoundCorpusRows: 0\n  };",
  "current-round skipped counter"
);
replaceChecked(
  /  for \(const row of corpus\.events \|\| \[\]\) \{\r?\n    if \(!isHpdRecord\(row\)\) continue;/,
  "  for (const row of corpus.events || []) {\n    if (isCurrentRound292CorpusRow(row)) {\n      index.skippedCurrentRoundCorpusRows += 1;\n      continue;\n    }\n    if (!isHpdRecord(row)) continue;",
  "skip current-round corpus rows"
);
replaceChecked(
  /      path\.join\(outDir, "rejected\.json"\)\.replace\([^\n]+\)\r?\n    \],/,
  '      path.join(outDir, "rejected.json").replace(/\\\\/g, "/"),\n      path.join(outDir, "validation.json").replace(/\\\\/g, "/")\n    ],',
  "summary output validation path"
);
replaceChecked(
  "async function main()",
  `const round292SelectionCache = new WeakMap();

function isPreservation(row) {
  return /preservation/i.test(String(row?.reporting_construction_type || ""));
}

function isExtendedAffordabilityOnly(row) {
  return /^yes$/i.test(String(row?.extended_affordability_status || ""));
}

function hasPositiveCandidateUnits(candidate) {
  const units = candidate?.units || {};
  return Math.max(Number(units.total_units || 0), Number(units.all_counted_units || 0)) > 0;
}

function isCompletionDateField(candidate) {
  return candidate.source_date_field === "building_completion_date" ||
    candidate.source_date_field === "project_completion_date";
}

function isClearlySupportedRound292PreservationCandidate(candidate) {
  return isCompletionDateField(candidate) &&
    isPreservation(candidate.raw_row) &&
    !isExtendedAffordabilityOnly(candidate.raw_row) &&
    hasPositiveCandidateUnits(candidate);
}

function isRound292PreferredCandidate(candidate) {
  if (!isCompletionDateField(candidate)) return false;
  if (isPreservation(candidate.raw_row)) return isClearlySupportedRound292PreservationCandidate(candidate);
  return true;
}

function selectedRound292CandidateIds(rankedCandidates) {
  if (round292SelectionCache.has(rankedCandidates)) return round292SelectionCache.get(rankedCandidates);
  const selectedIds = new Set();

  for (const candidate of rankedCandidates) {
    if (selectedIds.size >= targetCount) break;
    if (isRound292PreferredCandidate(candidate)) selectedIds.add(candidate.event_id);
  }

  for (const candidate of rankedCandidates) {
    if (selectedIds.size >= targetCount) break;
    if (selectedIds.has(candidate.event_id)) continue;
    if (isCompletionDateField(candidate) &&
        !isExtendedAffordabilityOnly(candidate.raw_row) &&
        hasPositiveCandidateUnits(candidate)) {
      selectedIds.add(candidate.event_id);
    }
  }

  round292SelectionCache.set(rankedCandidates, selectedIds);
  return selectedIds;
}

async function main()`,
  "round292 supported preservation selection helper"
);
replaceChecked(
  ".slice(0, targetCount)",
  ".filter((candidate, index, rankedCandidates) => selectedRound292CandidateIds(rankedCandidates).has(candidate.event_id))",
  "round292 selection call"
);
replaceChecked(
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows; project_start_date rows are excluded from the accepted Round292 pack. Preservation rows are admitted only when the selected row has an HPD completion date, source coordinates, positive unit counts, and Extended Affordability Only = No. Within each completion-date tier, New Construction rows remain ahead of Preservation rows before unit-count score, senior/supportive text signals, and newer dates.",
  "round292 ranking summary"
);
replaceChecked(
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. It is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, causal outcome evidence, or proof of occupancy/outcomes.",
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. It is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, causal outcome evidence, or proof of occupancy/outcomes. Preservation rows in this pack are retained only where HPD reports a building or project completion date, source coordinates, positive units, and Extended Affordability Only = No; they are not independent evidence of full rehabilitation scope or occupancy.",
  "candidate preservation limitation"
);
replaceChecked(
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",',
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",\n          "Round292 excludes project_start_date rows from accepted candidates.",\n          "Preservation rows are retained only as HPD administrative completion-date records with coordinates and positive units; they are not treated as independent evidence of full construction scope or occupancy.",',
  "source audit preservation caveat"
);
replaceChecked(
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",',
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",\n      "Round292 excludes project_start_date rows. Preservation rows are retained only when HPD reports building_completion_date or project_completion_date, coordinates, positive units, and Extended Affordability Only = No; they remain administrative delivery records, not independent proof of full rehabilitation scope or occupancy.",',
  "summary preservation caveat"
);
replaceChecked(
  'published_coverage_note: "Round292 checked HPD building-level rows with coordinates and building/project completion or project start dates available through the access date.",',
  'published_coverage_note: "Round292 fetched HPD building-level rows with coordinates and source date fields for duplicate screening; accepted candidates use completion dates only and exclude project_start_date.",',
  "source audit completion-only coverage note"
);
replaceChecked(
  '    "- Coordinates are HPD/Open Data geocoded points, not surveyed building footprints or project boundaries.",',
  '    "- Coordinates are HPD/Open Data geocoded points, not surveyed building footprints or project boundaries.",\n    "- Round292 excludes project_start_date rows. Preservation rows are included only when HPD reports building_completion_date or project_completion_date, coordinates, positive units, and Extended Affordability Only = No; this is still administrative delivery evidence, not independent proof of full rehabilitation scope or occupancy.",',
  "notes preservation caveat"
);
replaceChecked(
  '    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that.",',
  '    "- Completion dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that. Project start rows were screened for duplicates but excluded from accepted candidates.",',
  "notes completion-only caveat"
);
replaceChecked(
  "  const selectedSummary = summarizeCandidates(selected);",
  "  const completionOnlyEligibleCount = candidates.filter(isRound292PreferredCandidate).length;\n  const selectedSummary = summarizeCandidates(selected);",
  "completion-only eligible count"
);
replaceChecked(
  /      eligible_after_required_fields_and_duplicate_screening: candidates\.length,\r?\n      retained_less_than_target_reason: selected\.length < targetCount \? "Fewer unique eligible HPD rows remained after duplicate\/provenance screening\." : null,/,
  '      eligible_after_required_fields_and_duplicate_screening: candidates.length,\n      completion_date_eligible_after_round292_screening: completionOnlyEligibleCount,\n      excluded_from_accepted_pack_due_to_project_start_date_or_round292_completion_rules: Math.max(0, candidates.length - completionOnlyEligibleCount),\n      retained_less_than_target_reason: selected.length < targetCount ? `Only ${completionOnlyEligibleCount} completion-date HPD rows remained after duplicate/provenance screening and Round292 project_start_date exclusion.` : null,',
  "completion-only under-target reason"
);
replaceChecked(
  "        hpd_rows_indexed: existing.hpdRowsIndexed,",
  "        hpd_rows_indexed: existing.hpdRowsIndexed,\n        current_round_corpus_rows_skipped_for_idempotent_regeneration: existing.skippedCurrentRoundCorpusRows,",
  "current-round skipped summary"
);
replaceChecked(
  /    `- Eligible unique HPD rows after required-field and duplicate screening: \$\{candidates\.length\}`,\r?\n    `- Headroom after this candidate pack: \$\{headroomAfterPack\}`,/,
  '    `- Eligible unique HPD rows after required-field and duplicate screening: ${candidates.length}`,\n    `- Completion-date eligible after Round292 screening: ${completionOnlyEligibleCount}`,\n    `- Rows excluded from the accepted pack by completion-only rules: ${Math.max(0, candidates.length - completionOnlyEligibleCount)}`,\n    `- Headroom after this candidate pack: ${headroomAfterPack}`,',
  "notes completion-only counts"
);
replaceChecked(
  /including round229, round234, round236, round241, and round246/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, and round283",
  "explicit overlap caveat"
);
replaceChecked(/through round246/g, "through round283", "screening prose");

const runAdaptedRound251Fetcher = new Function(
  "require",
  "fetch",
  `${source}\n//# sourceURL=fetch_round292_nyc_hpd_affordable_housing_next14_candidates.adapted.js`
);

runAdaptedRound251Fetcher(require, fetch);
