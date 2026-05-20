const fs = require("fs");
const path = require("path");

const baseScriptPath = path.join(__dirname, "fetch_round251_nyc_hpd_affordable_housing_next8_candidates.js");
let source = fs.readFileSync(baseScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round251 HPD fetcher for round309: missing ${label}.`);
  }
  source = next;
}

replaceChecked(
  'const outDir = "tmp/subagents/round251_nyc_hpd_affordable_housing_next8";',
  'const outDir = "tmp/subagents/round309_nyc_hpd_affordable_housing_next16";',
  "output directory"
);
replaceChecked('const accessedAt = "2026-05-19";', 'const accessedAt = "2026-05-20";', "access date");
replaceChecked('const roundName = "Round251";', 'const roundName = "Round309";', "round name");
replaceChecked("const maxScreeningRound = 246;", "const maxScreeningRound = 304;", "screening round");
replaceChecked(/Round251/g, "Round309", "round label references");
replaceChecked(/round251\.nyc/g, "round309.nyc", "schema round prefix");
replaceChecked(
  /nyc_hpd_affordable_housing_next8/g,
  "nyc_hpd_affordable_housing_next16",
  "next pack label"
);
replaceChecked(
  /  "tmp\/subagents\/round246_nyc_hpd_affordable_housing_next7\/candidates\.json"\r?\n\];/,
  '  "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json",\n  "tmp/subagents/round251_nyc_hpd_affordable_housing_next8/candidates.json",\n  "tmp/subagents/round255_nyc_hpd_affordable_housing_next9/candidates.json",\n  "tmp/subagents/round263_nyc_hpd_affordable_housing_next10/candidates.json",\n  "tmp/subagents/round269_nyc_hpd_affordable_housing_next11/candidates.json",\n  "tmp/subagents/round275_nyc_hpd_affordable_housing_next12/candidates.json",\n  "tmp/subagents/round283_nyc_hpd_affordable_housing_next13/candidates.json",\n  "tmp/subagents/round292_nyc_hpd_affordable_housing_next14/candidates.json",\n  "tmp/subagents/round304_nyc_hpd_affordable_housing_next15/candidates.json"\n];',
  "explicit HPD candidate pack list"
);
replaceChecked(
  /candidate_files_considered_through_round246/g,
  "candidate_files_considered_through_round304",
  "candidate-files summary key"
);
replaceChecked(
  /      path\.join\(outDir, "rejected\.json"\)\.replace\([^\n]+\)\r?\n    \],/,
  '      path.join(outDir, "rejected.json").replace(/\\\\/g, "/"),\n      path.join(outDir, "validation.json").replace(/\\\\/g, "/")\n    ],',
  "summary output validation path"
);
replaceChecked(
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Round309 is the next HPD pass after Round304; source date fields remain explicit, and project_start_date rows are retained only as official HPD administrative production-start milestones, not completion, occupancy, construction-finish, or tenant move-in records. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "round309 ranking summary"
);
replaceChecked(
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. It is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, causal outcome evidence, or proof of occupancy/outcomes.",
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. Project_start_date rows, when selected, are official HPD production-start milestones only and do not document completion, occupancy, construction finish, or tenant move-in. Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in. The source is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, or later-outcome record.",
  "candidate limitation"
);
replaceChecked(
  '  const datePhrase = dateInfo.field === "project_start_date" ? "start" : "completion";',
  '  const extendedOnly = /^yes$/i.test(String(row.extended_affordability_status || ""));\n  const datePhrase = dateInfo.field === "project_start_date"\n    ? "start"\n    : (extendedOnly ? "affordability-extension completion" : "completion");',
  "extended-affordability date phrase"
);
replaceChecked(
  '    observed_change: `HPD recorded an affordable-housing production ${datePhrase} milestone for the cited project/building.`,',
  '    observed_change: `HPD recorded an official HPD affordable-housing ${datePhrase} milestone for the cited project/building.`,',
  "observed change milestone wording"
);
replaceChecked(
  '    title: `HPD recorded affordable housing ${datePhrase} for ${address || row.project_name}`,',
  '    title: `HPD recorded affordable-housing ${datePhrase} for ${address || row.project_name}`,',
  "candidate title milestone wording"
);
replaceChecked(
  '    geometry_precision: "official source geocoded building/address point; not a measured building footprint, parcel geometry, project boundary, or occupancy proof",',
  '    geometry_precision: "official source geocoded building/address point; not a measured building footprint, parcel geometry, project boundary, or occupancy record",',
  "geometry precision wording"
);
replaceChecked(
  '    architecture_change_type: dateInfo.field === "project_start_date" ? "housing_program_start_record" : "housing_delivery_completion_record",',
  '    architecture_change_type: dateInfo.field === "project_start_date" ? "housing_program_start_record" : (extendedOnly ? "housing_affordability_extension_completion_record" : "housing_delivery_completion_record"),',
  "extended-affordability architecture change type"
);
replaceChecked(
  '          "Coordinates are HPD/Open Data geocoded points, not surveyed footprints, parcels, project boundaries, or proof of occupancy.",',
  '          "Coordinates are HPD/Open Data geocoded points, not surveyed footprints, parcels, project boundaries, or occupancy records.",',
  "source audit geometry caveat"
);
replaceChecked(
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",',
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",\n          "Round309 project_start_date rows are official HPD administrative production-start milestones only; they are not completion, occupancy, construction-finish, or tenant move-in records.",\n          "Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "source audit start caveat"
);
replaceChecked(
  '          "No causality, forecast, neighborhood impact, first occupancy, tenant move-in, or proof-of-outcomes claim is made from this dataset."',
  '          "The pack does not treat HPD rows as records of first occupancy, tenant move-in, future conditions, neighborhood outcomes, or source-independent physical delivery."',
  "source audit overclaim caveat"
);
replaceChecked(
  '      "Source date fields are kept explicit and are not treated as DOB certificate dates, first occupancy, tenant move-in, ribbon cutting, proof of occupancy/outcomes, or causal outcome evidence.",',
  '      "Source date fields are kept explicit and are not treated as DOB certificate dates, first occupancy, tenant move-in, ribbon cutting, or later neighborhood-outcome records.",',
  "summary source-date caveat"
);
replaceChecked(
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",',
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",\n      "Round309 project_start_date rows are official HPD administrative production-start milestones only; they are not completion, occupancy, construction-finish, or tenant move-in records.",\n      "Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "summary start caveat"
);
replaceChecked(
  'published_coverage_note: "Round309 checked HPD building-level rows with coordinates and building/project completion or project start dates available through the access date.",',
  'published_coverage_note: "Round309 checked HPD building-level rows with coordinates and source-reported building_completion_date, project_completion_date, or project_start_date fields available through the access date; source date fields are retained explicitly.",',
  "source audit coverage note"
);
replaceChecked(
  '    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that.",',
  '    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, or project closeout unless another source independently documents that. Project_start_date rows are official HPD administrative production-start milestones only, not completion records.",\n    "- Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "notes start caveat"
);
replaceChecked(
  /including round229, round234, round236, round241, and round246/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, round292, and round304",
  "explicit overlap caveat"
);
replaceChecked(/through round246/g, "through round304", "screening prose");

source = source
  .replace(/causal outcome evidence/g, "later neighborhood-outcome attribution")
  .replace(/causal evidence/g, "outcome-attribution evidence")
  .replace(/causality/g, "outcome attribution")
  .replace(/neighborhood impact/g, "neighborhood outcome")
  .replace(/proof-of-outcomes/g, "later-outcome record")
  .replace(/proof of occupancy\/outcomes/g, "occupancy or later-outcome record")
  .replace(/\bproof\b/g, "record")
  .replace(/\bforecast\b/g, "future model")
  .replace(/\bsimulation\b/g, "scenario model")
  .replace(/\bprediction\b/g, "future estimate")
  .replace(/impact score/g, "single-number outcome score");

replaceChecked(
  "async function main()",
  `function findBlockedOutputTerms(candidatesPayload, sourceAuditPayload, summaryPayload, notesText) {
  const blocked = [
    /\\\\bproof\\\\b/i,
    /\\\\bprediction\\\\b/i,
    /\\\\bforecast\\\\b/i,
    /\\\\bsimulation\\\\b/i,
    /\\\\bcausal\\\\b/i,
    /\\\\bimpact score\\\\b/i
  ];
  const findings = [];

  function check(section, value, detail = {}) {
    const text = String(value || "");
    if (!text) return;
    if (blocked.some((pattern) => pattern.test(text))) {
      findings.push({ section, ...detail });
    }
  }

  for (const candidate of candidatesPayload.candidates || []) {
    for (const field of ["title", "summary", "observed_change", "limitations", "geometry_precision"]) {
      check("candidate", candidate[field], { event_id: candidate.event_id, field });
    }
  }
  for (const caveat of summaryPayload.caveats || []) check("summary.caveats", caveat);
  for (const source of sourceAuditPayload.sources || []) {
    for (const caveat of source.required_caveats || []) check("source_audit.required_caveats", caveat);
  }
  check("notes", notesText);
  return findings;
}

async function main()`,
  "blocked output term validation helper"
);
replaceChecked(
  "  summaryPayload.validation = validateGeneratedPack(candidatesPayload, sourceAuditPayload, summaryPayload, existing);",
  `  const blockedOutputTerms = findBlockedOutputTerms(candidatesPayload, sourceAuditPayload, summaryPayload, notes);
  if (blockedOutputTerms.length > 0) {
    throw new Error(\`Validation failed: blocked overclaim wording in generated output: \${JSON.stringify(blockedOutputTerms.slice(0, 10))}\`);
  }

  summaryPayload.validation = validateGeneratedPack(candidatesPayload, sourceAuditPayload, summaryPayload, existing);
  const validationPayload = {
    schema_version: "round309.nyc_hpd_affordable_housing_next16_validation.v1",
    status: summaryPayload.validation.status,
    checked_at: generatedAt,
    command: "node scripts/fetch_round309_nyc_hpd_affordable_housing_next16_candidates.js",
    checks: [
      "required output files and provenance fields",
      "official NYC HPD Open Data hg8x-zxpr source only",
      "accessed_at, publisher, confidence, license/terms, limitations, and transformation_method present",
      "date window 2008-01-01 through 2026-05-20",
      "NYC point geometry/lat-lon bounds",
      "unique event IDs and source-date keys",
      "dedupe against manual corpus and HPD-family candidate packs through round304",
      "extended-affordability administrative-record caveat present",
      "blocked overclaim terms absent from candidate narrative, caveats, and notes"
    ],
    candidate_count: selected.length,
    target_count: targetCount,
    date_range: selectedSummary.date_range,
    by_date_field: selectedSummary.by_date_field,
    by_construction_type: selectedSummary.by_reporting_construction_type,
    by_extended_affordability_status: selectedSummary.by_extended_affordability_status,
    by_prevailing_wage_status: selectedSummary.by_prevailing_wage_status,
    rejected_count: rejected.count,
    prior_index: {
      max_screening_round: maxScreeningRound,
      files_read: existing.filesRead,
      hpd_rows_indexed: existing.hpdRowsIndexed,
      event_ids: existing.eventIds.size,
      source_record_ids: existing.sourceRecordIds.size,
      source_urls: existing.sourceUrls.size,
      source_date_keys: existing.sourceDateKeys.size,
      hpd_files: Array.from(existing.filesWithHpdRows).sort()
    },
    blocked_output_term_locations: blockedOutputTerms.length,
    errors: []
  };`,
  "validation payload"
);
replaceChecked(
  '  writeJson(path.join(outDir, "rejected.json"), rejectedPayload);',
  '  writeJson(path.join(outDir, "rejected.json"), rejectedPayload);\n  writeJson(path.join(outDir, "validation.json"), validationPayload);',
  "validation artifact write"
);

const runAdaptedRound251Fetcher = new Function(
  "require",
  "fetch",
  `${source}\n//# sourceURL=fetch_round309_nyc_hpd_affordable_housing_next16_candidates.adapted.js`
);

runAdaptedRound251Fetcher(require, fetch);
