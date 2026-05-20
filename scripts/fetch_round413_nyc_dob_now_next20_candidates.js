const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round293_nyc_dob_now_next16_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round413_nyc_dob_now_next20_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round413_nyc_dob_now_next20");
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

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round413 wrapper patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round413 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function transformRound293Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round293/g, "Round413")
    .replace(/round293/g, "round413")
    .replace(/Next16/g, "Next20")
    .replace(/next16/g, "next20");

  transformed = replaceRequired(
    transformed,
    '  "round237"\n];',
    '  "round237",\n  "round293",\n  "round397",\n  "round401",\n  "round407"\n];',
    "DOB NOW prior-round list"
  );

  transformed = replaceRequired(
    transformed,
    "  /round237_nyc_dob_now/i,",
    "  /round237_nyc_dob_now/i,\n  /round293_nyc_dob_now/i,\n  /round397_nyc_dob_now/i,\n  /round401_nyc_dob_now/i,\n  /round407_nyc_dob_now/i,\n  /round\\d+_nyc_dob_now/i,\n  /round\\d+_nyc_dob_co/i,",
    "DOB administrative prior patterns"
  );

  transformed = replaceRequired(
    transformed,
    "DOB NOW packs through round237",
    "DOB NOW packs through round407",
    "DOB NOW prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB NOW through round237",
    "DOB NOW through round407",
    "DOB NOW compact scope"
  );
  transformed = replaceRequired(
    transformed,
    'dob_now_rounds_through: "round237"',
    'dob_now_rounds_through: "round407"',
    "DOB NOW prior scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB CO packs through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO pack prose scope"
  );
  transformed = replaceRequired(
    transformed,
    "DOB CO through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO compact scope"
  );
  transformed = replaceRequired(
    transformed,
    "CO through round289",
    "DOB CO packs available under tmp/subagents",
    "DOB CO short duplicate note"
  );
  transformed = replaceRequired(
    transformed,
    "DOB Certificate of Occupancy packs through round289",
    "DOB Certificate of Occupancy packs available under tmp/subagents",
    "DOB CO prose scope"
  );
  transformed = replaceRequired(
    transformed,
    'dob_co_rounds_through: "round289"',
    'dob_co_rounds_screened: "available tmp/subagents DOB CO packs"',
    "DOB CO prior scope"
  );

  transformed = replaceRequired(
    transformed,
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round293_screened: prior.priorDobFiles.some((file) => /round293_nyc_dob_now/i.test(file)),\n      required_round397_screened: prior.priorDobFiles.some((file) => /round397_nyc_dob_now/i.test(file)),\n      required_round401_screened: prior.priorDobFiles.some((file) => /round401_nyc_dob_now/i.test(file)),\n      required_round407_screened: prior.priorDobFiles.some((file) => /round407_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "Round413 validation marker"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
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

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function stableSet(values) {
  return [...new Set(values.filter(Boolean).map(cleanText))].sort();
}

function corpusStats() {
  const stats = {
    path: CORPUS_PATH.replace(/\\/g, "/"),
    present: fs.existsSync(CORPUS_PATH),
    records: 0,
    contains_round408: false,
    round408_records: 0
  };
  if (!stats.present) return stats;
  const doc = readJson(CORPUS_PATH);
  const records = candidateArray(doc);
  stats.records = records.length;
  stats.round408_records = records.filter((record) => JSON.stringify(record).includes("round408") || JSON.stringify(record).includes("Round408")).length;
  stats.contains_round408 = stats.round408_records > 0;
  return stats;
}

function ensureRound413Artifacts() {
  const candidatesPath = path.join(OUT_DIR, "candidates.json");
  const sourceAuditPath = path.join(OUT_DIR, "source_audit.json");
  const summaryPath = path.join(OUT_DIR, "summary.json");
  const validationReportPath = path.join(OUT_DIR, "validation_report.json");

  const candidatesDoc = readJson(candidatesPath);
  const sourceAuditDoc = readJson(sourceAuditPath);
  const summaryDoc = readJson(summaryPath);
  const validationReport = readJson(validationReportPath);
  const candidates = candidateArray(candidatesDoc);
  const corpus = corpusStats();

  candidatesDoc.scope = "Official NYC DOB NOW Build approved-permit/job-filing candidate pack after screening the live manual architecture corpus, including Round408 records, and DOB NOW packs through round407, with available DOB permit/application and DOB Certificate of Occupancy packs also screened. Records are administrative filing/permit/issued milestones and must not be presented as construction start, completion, opening, occupancy, impact, or causation evidence.";
  candidatesDoc.worker = "Round413 NYC DOB NOW next20 candidates";

  for (const candidate of candidates) {
    candidate.id = candidate.id || candidate.candidate_id || candidate.event_id;
    candidate.transformation_method = cleanText(candidate.transformation_method)
      .replace("manual corpus plus round117/round119/DOB NOW through round407/DOB CO packs available under tmp/subagents/other DOB permit-application packs candidate packs when present", "live manual corpus plus prior DOB permit/application packs, all DOB NOW packs through round407, and DOB Certificate of Occupancy packs available under tmp/subagents")
      .replace("current manual corpus plus round117/round119/DOB NOW through round407/DOB CO packs available under tmp/subagents/other DOB permit-application packs candidate packs when present", "live manual corpus plus prior DOB permit/application packs, all DOB NOW packs through round407, and DOB Certificate of Occupancy packs available under tmp/subagents");
    candidate.duplicate_check_note = "Exact job_filing_number, base DOB NOW job number, work_permit, tracking_number, source_record_id, source_url, candidate_id, event_id, and stable id tokens were screened against the live manual architecture corpus and prior NYC DOB NOW, DOB permit/application, and DOB Certificate of Occupancy candidate packs available during this run, including DOB NOW through round407 and the manual corpus containing Round408 records.";
  }

  if (candidatesDoc.selection_summary) {
    candidatesDoc.selection_summary.prior_scope = {
      manual_corpus: corpus,
      dob_now_rounds_through: "round407",
      dob_co_rounds_screened: "available tmp/subagents DOB CO packs",
      dob_now_rounds_screened: [
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
        "round407"
      ]
    };
  }

  sourceAuditDoc.audit_scope = "Official NYC DOB NOW Build approved permits and job application filings, selected for residual administrative milestone candidate discovery after screening the live manual architecture corpus through Round408, DOB NOW packs through round407, and available DOB permit/application and DOB Certificate of Occupancy packs.";
  sourceAuditDoc.caveat = "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, impacts, or causation unless another source explicitly supports that claim.";
  for (const source of sourceAuditDoc.sources || []) {
    if (typeof source.granularity === "string") {
      source.granularity = source.granularity
        .replace("beyond existing round117/round119/DOB NOW through round407/DOB CO packs available under tmp/subagents/other DOB permit-application packs/manual-corpus tokens", "beyond the live manual corpus through Round408, prior DOB permit/application packs, all DOB NOW packs through round407, and DOB CO packs available under tmp/subagents")
        .replace("beyond existing manual-corpus, DOB NOW through round407, DOB CO packs available under tmp/subagents, and prior DOB permit/application tokens", "beyond the live manual corpus through Round408, all DOB NOW packs through round407, DOB CO packs available under tmp/subagents, and prior DOB permit/application tokens");
    }
  }

  summaryDoc.output_files = stableSet([...summaryDoc.output_files || [], ...ALL_OUTPUTS]);
  summaryDoc.worker = "Round413 NYC DOB NOW next20 candidates";
  summaryDoc.caveats = [
    "Administrative DOB NOW filing/permit milestone only.",
    "Not evidence that a building was built, completed, opened, occupied, or causally linked to outcomes.",
    "No construction completion, opening, occupancy, impact, or causation claim is made.",
    "Coordinates are DOB/Open Data geocoded address points.",
    "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
  ];
  if (summaryDoc.selection_summary) {
    summaryDoc.selection_summary.prior_scope = candidatesDoc.selection_summary?.prior_scope;
  }

  validationReport.checked_files = stableSet([...validationReport.checked_files || [], ...ALL_OUTPUTS]);
  validationReport.validator = "scripts/fetch_round413_nyc_dob_now_next20_candidates.js --validate-only; reads emitted JSON plus manual corpus and prior DOB NOW/DOB permit/DOB CO candidate packs, then writes supplemental validation.json/readback.json";
  validationReport.checks = {
    ...validationReport.checks,
    manual_corpus: corpus,
    required_round407_screened: validationReport.checks?.prior_dob_files_scanned?.some((file) => /round407_nyc_dob_now/i.test(file)) || false,
    required_manual_corpus_round408_present: corpus.contains_round408,
    supplemental_outputs: [
      path.join(OUT_DIR, "validation.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "readback.json").replace(/\\/g, "/")
    ]
  };

  writeJson(candidatesPath, candidatesDoc);
  writeJson(sourceAuditPath, sourceAuditDoc);
  writeJson(summaryPath, summaryDoc);
  writeJson(validationReportPath, validationReport);
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
  if (!fs.existsSync(notesPath)) {
    errors.push(`Missing notes output ${notesPath.replace(/\\/g, "/")}`);
  }

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
  if (validationReport.checks?.required_round407_screened !== true) errors.push("validation_report.json does not confirm Round407 DOB NOW screening");
  if (validationReport.checks?.required_manual_corpus_round408_present !== true) errors.push("validation_report.json does not confirm Round408 is present in the screened manual corpus");
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length < 2) errors.push("source_audit.json does not include both official DOB NOW sources");
  if (!rejected.rejected_counts || typeof rejected.rejected_counts !== "object") errors.push("rejected.json missing rejected_counts");

  const sourceRecordSamples = candidates.slice(0, 20).map((candidate) => candidate.source_record_id);
  const sourceApiSamples = candidates.slice(0, 5).map((candidate) => candidate.source_api_url || candidate.source_url);

  const readback = {
    schema_version: "round413.nyc_dob_now_next20_readback.v1",
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
    schema_version: "round413.nyc_dob_now_next20_validation.v1",
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
      required_round407_screened: validationReport.checks?.required_round407_screened === true,
      required_manual_corpus_round408_present: validationReport.checks?.required_manual_corpus_round408_present === true,
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
    throw new Error(`Round413 supplemental validation failed with ${errors.length} errors. See ${path.join(OUT_DIR, "validation.json")}`);
  }

  return { readback, validation };
}

async function runTransformedRound293Main() {
  const source = transformRound293Source(fs.readFileSync(BASE_SCRIPT_PATH, "utf8"));
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
    throw new Error("Transformed Round413 generator did not export main().");
  }
  await sandbox.module.exports.main();
}

async function main() {
  if (process.argv.includes("--validate-only")) {
    await runTransformedRound293Main();
    ensureRound413Artifacts();
    const { validation } = buildReadbackAndValidation();
    console.log(`Round413 validation passed for ${validation.checks.candidate_count} candidates.`);
    return;
  }

  await runTransformedRound293Main();
  ensureRound413Artifacts();
  const { validation } = buildReadbackAndValidation();
  console.log(`Round413 wrote ${validation.checks.candidate_count} candidates plus validation.json and readback.json.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
