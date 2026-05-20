const fs = require("fs");
const path = require("path");

const baseScriptPath = path.join(__dirname, "fetch_round251_nyc_hpd_affordable_housing_next8_candidates.js");
let source = fs.readFileSync(baseScriptPath, "utf8").replace(/^\uFEFF/, "");

function replaceChecked(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`Unable to adapt round251 HPD fetcher for round304: missing ${label}.`);
  }
  source = next;
}

replaceChecked(
  'const outDir = "tmp/subagents/round251_nyc_hpd_affordable_housing_next8";',
  'const outDir = "tmp/subagents/round304_nyc_hpd_affordable_housing_next15";',
  "output directory"
);
replaceChecked('const accessedAt = "2026-05-19";', 'const accessedAt = "2026-05-20";', "access date");
replaceChecked('const roundName = "Round251";', 'const roundName = "Round304";', "round name");
replaceChecked("const maxScreeningRound = 246;", "const maxScreeningRound = 292;", "screening round");
replaceChecked(/Round251/g, "Round304", "round label references");
replaceChecked(/round251\.nyc/g, "round304.nyc", "schema round prefix");
replaceChecked(
  /nyc_hpd_affordable_housing_next8/g,
  "nyc_hpd_affordable_housing_next15",
  "next pack label"
);
replaceChecked(
  /  "tmp\/subagents\/round246_nyc_hpd_affordable_housing_next7\/candidates\.json"\r?\n\];/,
  '  "tmp/subagents/round246_nyc_hpd_affordable_housing_next7/candidates.json",\n  "tmp/subagents/round251_nyc_hpd_affordable_housing_next8/candidates.json",\n  "tmp/subagents/round255_nyc_hpd_affordable_housing_next9/candidates.json",\n  "tmp/subagents/round263_nyc_hpd_affordable_housing_next10/candidates.json",\n  "tmp/subagents/round269_nyc_hpd_affordable_housing_next11/candidates.json",\n  "tmp/subagents/round275_nyc_hpd_affordable_housing_next12/candidates.json",\n  "tmp/subagents/round283_nyc_hpd_affordable_housing_next13/candidates.json",\n  "tmp/subagents/round292_nyc_hpd_affordable_housing_next14/candidates.json"\n];',
  "explicit HPD candidate pack list"
);
replaceChecked(
  /candidate_files_considered_through_round246/g,
  "candidate_files_considered_through_round292",
  "candidate-files summary key"
);
replaceChecked(
  /      path\.join\(outDir, "rejected\.json"\)\.replace\([^\n]+\)\r?\n    \],/,
  '      path.join(outDir, "rejected.json").replace(/\\\\/g, "/"),\n      path.join(outDir, "validation.json").replace(/\\\\/g, "/")\n    ],',
  "summary output validation path"
);
replaceChecked(
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Round304 is the next HPD pass after Round292; source date fields remain explicit, and project_start_date rows are retained only as official HPD administrative production-start milestones, not completion, occupancy, or causal evidence. Within each date-field tier, new-construction rows are preferred before unit-count score, senior/supportive text signals, and newer dates.",
  "round304 ranking summary"
);
replaceChecked(
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. It is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, causal outcome evidence, or proof of occupancy/outcomes.",
  "HPD Affordable Housing Production by Building is administrative affordable-housing program/building delivery evidence. Project_start_date rows, when selected, are official HPD production-start milestones only and do not document completion, occupancy, construction finish, or tenant move-in. Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in. The source is not a complete citywide construction inventory, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, causal outcome evidence, or proof of occupancy/outcomes.",
  "candidate start-milestone limitation"
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
  '    architecture_change_type: dateInfo.field === "project_start_date" ? "housing_program_start_record" : "housing_delivery_completion_record",',
  '    architecture_change_type: dateInfo.field === "project_start_date" ? "housing_program_start_record" : (extendedOnly ? "housing_affordability_extension_completion_record" : "housing_delivery_completion_record"),',
  "extended-affordability architecture change type"
);
replaceChecked(
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",',
  '          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",\n          "Round304 project_start_date rows are official HPD administrative production-start milestones only; they are not completion, occupancy, construction-finish, tenant move-in, or outcome evidence.",\n          "Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "source audit start caveat"
);
replaceChecked(
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",',
  '      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",\n      "Round304 project_start_date rows are official HPD administrative production-start milestones only; they are not completion, occupancy, construction-finish, tenant move-in, or outcome evidence.",\n      "Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "summary start caveat"
);
replaceChecked(
  'published_coverage_note: "Round304 checked HPD building-level rows with coordinates and building/project completion or project start dates available through the access date.",',
  'published_coverage_note: "Round304 checked HPD building-level rows with coordinates and source-reported building_completion_date, project_completion_date, or project_start_date fields available through the access date; source date fields are retained explicitly.",',
  "source audit coverage note"
);
replaceChecked(
  '    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that.",',
  '    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that. Project_start_date rows are official HPD administrative production-start milestones only, not completion records.",\n    "- Extended Affordability Only = Yes rows are administrative affordability-extension completion records, not independent evidence of new construction, full rehabilitation scope, occupancy, or tenant move-in.",',
  "notes start caveat"
);
replaceChecked(
  /including round229, round234, round236, round241, and round246/g,
  "including round229, round234, round236, round241, round246, round251, round255, round263, round269, round275, round283, and round292",
  "explicit overlap caveat"
);
replaceChecked(/through round246/g, "through round292", "screening prose");

const runAdaptedRound251Fetcher = new Function(
  "require",
  "fetch",
  `${source}\n//# sourceURL=fetch_round304_nyc_hpd_affordable_housing_next15_candidates.adapted.js`
);

runAdaptedRound251Fetcher(require, fetch);
