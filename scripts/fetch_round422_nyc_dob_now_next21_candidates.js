const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_WRAPPER_PATH = path.join("scripts", "fetch_round413_nyc_dob_now_next20_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round422_nyc_dob_now_next21_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round422_nyc_dob_now_next21");
const CORPUS_PATH = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const TARGET_COUNT = 200;

const JSON_OUTPUTS = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "readback.json"
];

const ALL_OUTPUTS = [
  ...JSON_OUTPUTS,
  "notes.md"
].map((name) => path.join(OUT_DIR, name).replace(/\\/g, "/"));

const DOB_NOW_ROUNDS_THROUGH_413 = [
  "round117_nyc_dob_filings_permits",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round158",
  "round162",
  "round167",
  "round173",
  "round179",
  "round185",
  "round191",
  "round197",
  "round203",
  "round209",
  "round222",
  "round227",
  "round237",
  "round293",
  "round397",
  "round401",
  "round407",
  "round413"
];

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round422 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function candidateArray(doc) {
  if (!doc) return [];
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function countBy(rows, fn) {
  const counts = {};
  for (const row of rows) {
    const key = cleanText(fn(row)) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function stableSet(values) {
  return [...new Set(values.filter(Boolean).map(cleanText))].sort();
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function corpusStats() {
  const stats = {
    path: CORPUS_PATH.replace(/\\/g, "/"),
    present: fs.existsSync(CORPUS_PATH),
    records: 0,
    contains_round413: false,
    round413_records: 0
  };
  if (!stats.present) return stats;
  const doc = readJson(CORPUS_PATH);
  const records = candidateArray(doc);
  stats.records = records.length;
  stats.round413_records = records.filter((record) => {
    const text = JSON.stringify(record);
    return text.includes("round413") || text.includes("Round413") || text.includes("nyc_dob_now_next20");
  }).length;
  stats.contains_round413 = stats.round413_records > 0;
  return stats;
}

function transformRound413Wrapper(source) {
  let transformed = source.replace(/\r\n/g, "\n");
  transformed = transformed
    .replace(/Round413/g, "Round422")
    .replace(/round413/g, "round422")
    .replace(/Next20/g, "Next21")
    .replace(/next20/g, "next21")
    .replace(/Round407/g, "Round413")
    .replace(/round407/g, "round413");

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );
  return transformed;
}

async function runTransformedRound413Main() {
  const source = transformRound413Wrapper(fs.readFileSync(BASE_WRAPPER_PATH, "utf8"));
  const sandbox = {
    Buffer,
    URL,
    clearTimeout,
    console,
    fetch,
    module: { exports: {} },
    process,
    require,
    setTimeout,
    __dirname: path.dirname(path.resolve(SCRIPT_PATH)),
    __filename: path.resolve(SCRIPT_PATH)
  };

  vm.runInNewContext(source, sandbox, { filename: SCRIPT_PATH });
  if (typeof sandbox.module.exports.main !== "function") {
    throw new Error("Transformed Round422 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
}

function addRound422ArtifactContext() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const rejectedPath = path.join(OUT_DIR, "rejected.json");
  const validationReportPath = path.join(OUT_DIR, "validation_report.json");
  const notesPath = path.join(OUT_DIR, "notes.md");

  const candidatesDoc = readJson(candidatesPath);
  const sourceAuditDoc = readJson(sourceAuditPath);
  const summaryDoc = readJson(summaryPath);
  const rejectedDoc = readJson(rejectedPath);
  const validationReport = readJson(validationReportPath);
  const candidates = candidateArray(candidatesDoc);
  const corpus = corpusStats();

  candidatesDoc.worker = "Round422 NYC DOB NOW next21 candidates";
  candidatesDoc.scope = "Official NYC DOB NOW Build approved-permit/job-filing candidate pack after screening the live manual architecture corpus and prior DOB NOW packs through Round413, with available DOB permit/application and DOB Certificate of Occupancy packs also screened. Records are administrative filing/permit/issued milestones and must not be presented as construction start, construction completion, opening, occupancy, impact, or causation evidence.";

  for (const candidate of candidates) {
    candidate.id = candidate.id || candidate.candidate_id || candidate.event_id;
    candidate.transformation_method = cleanText(candidate.transformation_method)
      .replace(/round407/g, "round413")
      .replace(/Round407/g, "Round413")
      .replace("current live manual corpus plus prior DOB permit/application packs, all DOB NOW packs through round413, and DOB Certificate of Occupancy packs available under tmp/subagents", "live manual corpus plus prior DOB permit/application packs, all DOB NOW packs through round413, and DOB Certificate of Occupancy packs available under tmp/subagents");
    candidate.duplicate_check_note = "Exact job_filing_number, base DOB NOW job number, work_permit, tracking_number, source_record_id, source_url, candidate_id, event_id, and stable id tokens were screened against the live manual architecture corpus and prior NYC DOB NOW, DOB permit/application, and DOB Certificate of Occupancy candidate packs available during this run, including DOB NOW through round413.";
    candidate.limitations = cleanText(candidate.limitations);
  }

  const priorScope = {
    manual_corpus: corpus,
    dob_now_rounds_through: "round413",
    dob_co_rounds_screened: "available tmp/subagents DOB CO packs",
    dob_now_rounds_screened: DOB_NOW_ROUNDS_THROUGH_413
  };

  candidatesDoc.selection_summary = candidatesDoc.selection_summary || {};
  candidatesDoc.selection_summary.prior_scope = priorScope;

  sourceAuditDoc.audit_scope = "Official NYC DOB NOW Build approved permits and job application filings, selected for residual administrative milestone candidate discovery after screening the live manual architecture corpus, DOB NOW packs through Round413, and available DOB permit/application and DOB Certificate of Occupancy packs.";
  sourceAuditDoc.caveat = "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, impacts, or causation unless another source explicitly supports that claim.";
  for (const source of sourceAuditDoc.sources || []) {
    if (typeof source.granularity === "string") source.granularity = source.granularity.replace(/round407/g, "round413");
  }

  summaryDoc.output_files = ALL_OUTPUTS;
  summaryDoc.worker = "Round422 NYC DOB NOW next21 candidates";
  summaryDoc.candidate_count = candidates.length;
  summaryDoc.source_ids = stableSet([
    ...(summaryDoc.source_ids || []),
    ...candidates.flatMap((candidate) => candidate.source_ids || [candidate.source_id])
  ]);
  summaryDoc.selection_summary = summaryDoc.selection_summary || {};
  summaryDoc.selection_summary.prior_scope = priorScope;
  summaryDoc.caveats = [
    "Administrative DOB NOW filing/permit milestone only.",
    "Not evidence that a building was built, completed, opened, occupied, or causally linked to outcomes.",
    "No construction completion, opening, occupancy, impact, or causation claim is made.",
    "Coordinates are DOB/Open Data geocoded address points.",
    "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
  ];

  rejectedDoc.accessed_at = ACCESSED_AT;
  rejectedDoc.rejected_counts = Object.fromEntries(Object.entries(rejectedDoc.rejected_counts || {}).sort(([a], [b]) => a.localeCompare(b)));

  validationReport.validator = "scripts/fetch_round422_nyc_dob_now_next21_candidates.js --validate-only; reads emitted JSON plus manual corpus and prior DOB NOW/DOB permit/DOB CO candidate packs, then writes supplemental validation.json/readback.json";
  validationReport.checked_files = ALL_OUTPUTS;
  validationReport.checks = {
    ...validationReport.checks,
    manual_corpus: corpus,
    required_round413_screened: validationReport.checks?.prior_dob_files_scanned?.some((file) => /round413_nyc_dob_now/i.test(file)) || false,
    required_round407_screened: validationReport.checks?.prior_dob_files_scanned?.some((file) => /round407_nyc_dob_now/i.test(file)) || false,
    required_manual_corpus_round413_present: corpus.contains_round413,
    supplemental_outputs: [
      path.join(OUT_DIR, "validation.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "readback.json").replace(/\\/g, "/")
    ]
  };

  const notes = [
    "# Round422 NYC DOB NOW Next21 Candidate Pack",
    "",
    `Generated ${candidates.length} fresh nonduplicate administrative DOB NOW approved-permit candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.",
    "",
    "## Caveats",
    "",
    "- Rows are administrative permit/job filing records only.",
    "- They do not document construction start, construction completion, public opening, occupancy, final built form, impact, causation, or outcome effects.",
    "- Scale fields are source-reported filing attributes and can be amended by later DOB records.",
    "- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.",
    "- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.",
    "",
    "## Duplicate Screening",
    "",
    `Screened against the live manual corpus (${corpus.records} records; Round413 present: ${corpus.contains_round413}) plus prior DOB NOW packs through Round413 and available DOB administrative candidate packs.`,
    "",
    "## Counts",
    "",
    `- Permit rows fetched: ${candidatesDoc.selection_summary.permit_rows_fetched}`,
    `- Permit rows after duplicate/geography filters: ${candidatesDoc.selection_summary.permit_rows_after_duplicate_and_geometry_filters}`,
    `- Application rows fetched: ${candidatesDoc.selection_summary.application_rows_fetched}`,
    `- Candidate pool before balancing: ${candidatesDoc.selection_summary.candidate_pool_before_balancing}`,
    `- Candidates retained: ${candidates.length}`,
    `- Validation report: ${path.join(OUT_DIR, "validation_report.json").replace(/\\/g, "/")}`
  ].join("\n");

  writeJson(candidatesPath, candidatesDoc);
  writeJson(sourceAuditPath, sourceAuditDoc);
  writeJson(summaryPath, summaryDoc);
  writeJson(rejectedPath, rejectedDoc);
  writeJson(validationReportPath, validationReport);
  fs.writeFileSync(notesPath, `${notes}\n`);
}

function buildReadbackAndValidation() {
  const errors = [];
  const warnings = [];
  const parsed = {};
  const fileStats = {};

  for (const name of JSON_OUTPUTS.filter((file) => file !== "validation.json" && file !== "readback.json")) {
    const fullPath = path.join(OUT_DIR, name);
    const relPath = fullPath.replace(/\\/g, "/");
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing JSON output ${relPath}`);
      continue;
    }
    try {
      parsed[name] = readJson(fullPath);
      fileStats[name] = {
        path: relPath,
        bytes: fs.statSync(fullPath).size,
        parsed: true
      };
    } catch (error) {
      errors.push(`Failed to parse ${relPath}: ${error.message}`);
      fileStats[name] = {
        path: relPath,
        bytes: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0,
        parsed: false
      };
    }
  }

  const notesPath = path.join(OUT_DIR, "notes.md");
  if (!fs.existsSync(notesPath)) errors.push(`Missing notes output ${notesPath.replace(/\\/g, "/")}`);

  const candidates = candidateArray(parsed["candidates.json"]);
  let minDate = "";
  let maxDate = "";
  const ids = new Set();
  const eventIds = new Set();
  const sourceRecordIds = new Set();
  const sourceIds = new Set();
  const banned = /\b(caused|proves?|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const requiredCandidateFields = [
    "id",
    "city_id",
    "candidate_id",
    "event_id",
    "title",
    "date",
    "effective_date",
    "latitude",
    "longitude",
    "geometry",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "license_or_terms_note",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method"
  ];

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.id || "unknown candidate";
    for (const field of requiredCandidateFields) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Missing ${field} for ${label}`);
      }
    }

    if (candidate.city_id !== "nyc") errors.push(`Unexpected city_id for ${label}: ${candidate.city_id}`);
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`Unexpected accessed_at for ${label}: ${candidate.accessed_at}`);

    const date = parseDate(candidate.effective_date || candidate.date);
    if (!date || date < START_DATE || date > END_DATE) {
      errors.push(`Date outside ${START_DATE}..${END_DATE} for ${label}: ${candidate.effective_date || candidate.date}`);
    }
    if (date && (!minDate || date < minDate)) minDate = date;
    if (date && (!maxDate || date > maxDate)) maxDate = date;

    const lat = Number(candidate.latitude);
    const lon = Number(candidate.longitude);
    if (!isNycPoint(lat, lon)) errors.push(`Invalid NYC lat/lon for ${label}: ${candidate.latitude}, ${candidate.longitude}`);
    if (candidate.geometry?.type !== "Point" || !Array.isArray(candidate.geometry.coordinates) || candidate.geometry.coordinates.length !== 2) {
      errors.push(`Invalid Point geometry for ${label}`);
    }

    for (const sourceId of candidate.source_ids || [candidate.source_id]) sourceIds.add(sourceId);

    for (const [set, value, field] of [
      [ids, candidate.id, "id"],
      [eventIds, candidate.event_id, "event_id"],
      [sourceRecordIds, candidate.source_record_id, "source_record_id"]
    ]) {
      const key = cleanText(value).toLowerCase();
      if (set.has(key)) errors.push(`Duplicate ${field}: ${value}`);
      set.add(key);
    }

    const prose = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method,
      candidate.duplicate_check_note
    ].join(" ");
    if (banned.test(prose)) errors.push(`Overclaim wording detected for ${label}`);
    if (!/administrative/i.test(candidate.limitations || "") || !/not evidence/i.test(candidate.limitations || "")) {
      errors.push(`Administrative/not-evidence caveat missing for ${label}`);
    }
  }

  const summary = parsed["summary.json"] || {};
  const sourceAudit = parsed["source_audit.json"] || {};
  const validationReport = parsed["validation_report.json"] || {};
  const rejected = parsed["rejected.json"] || {};
  const corpus = validationReport.checks?.manual_corpus || corpusStats();

  if (candidates.length !== TARGET_COUNT) warnings.push(`Candidate count ${candidates.length} differs from target ${TARGET_COUNT}`);
  if (summary.candidate_count !== candidates.length) errors.push("summary.json candidate_count does not match candidates array");
  if (validationReport.ok !== true || validationReport.passed !== true) errors.push("validation_report.json is not passing");
  if (validationReport.checks?.required_round413_screened !== true) errors.push("validation_report.json does not confirm Round413 DOB NOW screening");
  if (validationReport.checks?.required_manual_corpus_round413_present !== true) errors.push("validation_report.json does not confirm Round413 is present in the screened manual corpus");
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length < 2) errors.push("source_audit.json does not include both official DOB NOW sources");
  if (!rejected.rejected_counts || typeof rejected.rejected_counts !== "object") errors.push("rejected.json missing rejected_counts");

  const sourceRecordSamples = candidates.slice(0, 20).map((candidate) => candidate.source_record_id);
  const sourceApiSamples = candidates.slice(0, 5).map((candidate) => candidate.source_api_url || candidate.source_url);

  const readback = {
    schema_version: "round422.nyc_dob_now_next21_readback.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: errors.length === 0,
    output_dir: OUT_DIR.replace(/\\/g, "/"),
    json_files: fileStats,
    notes_file: {
      path: notesPath.replace(/\\/g, "/"),
      bytes: fs.existsSync(notesPath) ? fs.statSync(notesPath).size : 0,
      present: fs.existsSync(notesPath)
    },
    candidate_count: candidates.length,
    date_window: { start: START_DATE, end: END_DATE },
    date_range: { start: minDate, end: maxDate },
    source_ids: stableSet([...sourceIds, ...(summary.source_ids || [])]),
    source_record_id_samples: sourceRecordSamples,
    source_api_url_samples: sourceApiSamples,
    selected_summary: {
      by_borough: countBy(candidates, (candidate) => candidate.borough),
      by_work_type: countBy(candidates, (candidate) => candidate.work_type),
      by_job_type: countBy(candidates, (candidate) => candidate.job_type),
      by_year: countBy(candidates, (candidate) => String(candidate.date || candidate.effective_date || "").slice(0, 4))
    },
    prior_screening: {
      manual_corpus_screened: validationReport.checks?.screened_files_read > 0,
      manual_corpus: corpus,
      dob_now_through_round413_screened: validationReport.checks?.required_round413_screened === true,
      dob_now_through_round407_screened: validationReport.checks?.required_round407_screened === true,
      prior_dob_files_scanned: validationReport.checks?.prior_dob_files_scanned || [],
      prior_identifier_tokens_checked: validationReport.checks?.prior_identifier_tokens_checked || 0,
      no_overlap_with_screened_corpus_and_prior_packs: validationReport.checks?.no_overlap_with_screened_corpus_and_prior_packs === true
    },
    caveats: [
      "DOB NOW rows are administrative filing/permit milestones only.",
      "The pack does not claim construction completion, opening, occupancy, impact, or causation.",
      "Coordinates are NYC Open Data/DOB geocoded points, not surveyed footprints or work limits."
    ],
    errors,
    warnings
  };

  const validation = {
    schema_version: "round422.nyc_dob_now_next21_validation.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: errors.length === 0,
    passed: errors.length === 0,
    validator: SCRIPT_PATH.replace(/\\/g, "/"),
    checked_files: ALL_OUTPUTS,
    checks: {
      candidate_count: candidates.length,
      target_count: TARGET_COUNT,
      date_window: { start: START_DATE, end: END_DATE },
      date_range: { start: minDate, end: maxDate },
      unique_ids: ids.size,
      unique_event_ids: eventIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      source_ids: readback.source_ids,
      json_parse_ok: Object.values(fileStats).every((stat) => stat.parsed),
      readback_ok: readback.ok,
      validation_report_ok: validationReport.ok === true && validationReport.passed === true,
      required_round413_screened: validationReport.checks?.required_round413_screened === true,
      required_manual_corpus_round413_present: validationReport.checks?.required_manual_corpus_round413_present === true,
      no_overlap_with_screened_corpus_and_prior_packs: validationReport.checks?.no_overlap_with_screened_corpus_and_prior_packs === true,
      no_prediction_or_causation_language: errors.every((error) => !/Overclaim wording/i.test(error)),
      notes_present: fs.existsSync(notesPath)
    },
    errors,
    warnings
  };

  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);

  if (errors.length) {
    throw new Error(`Round422 validation failed with ${errors.length} errors. See ${path.join(OUT_DIR, "validation.json")}`);
  }

  return { readback, validation };
}

async function main() {
  if (!process.argv.includes("--validate-only")) {
    await runTransformedRound413Main();
  }
  addRound422ArtifactContext();
  const { validation } = buildReadbackAndValidation();
  console.log(`Round422 validation passed for ${validation.checks.candidate_count} candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
