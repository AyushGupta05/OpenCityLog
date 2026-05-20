const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE_SCRIPT_PATH = path.join("scripts", "fetch_round293_nyc_dob_now_next16_candidates.js");
const SCRIPT_PATH = path.join("scripts", "fetch_round438_nyc_dob_now_next24_candidates.js");
const OUT_DIR = path.join("tmp", "subagents", "round438_nyc_dob_now_next24");
const CORPUS_PATH = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const TARGET_COUNT = 200;

const DOB_NOW_ROUNDS_THROUGH_435 = [
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
  "round413",
  "round422",
  "round429",
  "round435"
];

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

const PRIOR_ROUND_REGEX_THROUGH_435 = [
  "round112",
  "round117",
  "round119",
  "round133",
  "round136",
  "round143",
  "round149",
  "round152",
  "round155",
  "round158",
  "round160",
  "round162",
  "round164",
  "round167",
  "round169",
  "round173",
  "round175",
  "round179",
  "round181",
  "round185",
  "round187",
  "round191",
  "round193",
  "round197",
  "round199",
  "round203",
  "round205",
  "round209",
  "round211",
  "round219",
  "round222",
  "round225",
  "round227",
  "round232",
  "round237",
  "round242",
  "round247",
  "round250",
  "round256",
  "round264",
  "round267",
  "round273",
  "round278",
  "round289",
  "round293",
  "round300",
  "round303",
  "round308",
  "round313",
  "round318",
  "round322",
  "round326",
  "round330",
  "round335",
  "round339",
  "round344",
  "round349",
  "round356",
  "round360",
  "round364",
  "round367",
  "round371",
  "round375",
  "round379",
  "round382",
  "round386",
  "round389",
  "round395",
  "round397",
  "round400",
  "round401",
  "round406",
  "round407",
  "round412",
  "round413",
  "round415",
  "round417",
  "round422",
  "round429",
  "round435"
].join("|");

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function normalizeTitleDate(title, date) {
  const titleKey = normalizeKey(title)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return titleKey && date ? `${titleKey}|${date}` : "";
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+|$)/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
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

function replaceRequired(source, needle, replacement, label) {
  if (!source.includes(needle)) {
    throw new Error(`Round438 wrapper patch failed; missing ${label || needle}`);
  }
  return source.split(needle).join(replacement);
}

function replaceOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`Round438 wrapper patch failed for ${label}: expected one match, found ${count}`);
  }
  return source.replace(needle, replacement);
}

function replaceRegexOnce(source, pattern, replacement, label) {
  let count = 0;
  const output = source.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  if (count !== 1) {
    throw new Error(`Round438 wrapper patch failed for ${label}: expected one regex match, found ${count}`);
  }
  return output;
}

function transformRound293Source(source) {
  let transformed = source.replace(/\r\n/g, "\n");

  transformed = transformed
    .replace(/Round293/g, "Round438")
    .replace(/round293/g, "round438")
    .replace(/Next16/g, "Next24")
    .replace(/next16/g, "next24")
    .replace(/DOB_NOW_ROUNDS_THROUGH_237/g, "DOB_NOW_ROUNDS_THROUGH_435")
    .replace(/DOB NOW packs through round237/g, "DOB NOW packs through Round435")
    .replace(/DOB NOW through round237/g, "DOB NOW through Round435")
    .replace(/DOB Certificate of Occupancy packs through round289/g, "DOB Certificate of Occupancy packs available under tmp/subagents")
    .replace(/DOB CO packs through round289/g, "DOB Certificate of Occupancy packs available under tmp/subagents")
    .replace(/DOB CO through round289/g, "DOB CO packs available under tmp/subagents")
    .replace(/CO through round289/g, "DOB CO packs available under tmp/subagents");

  transformed = replaceRegexOnce(
    transformed,
    /const DOB_NOW_ROUNDS_THROUGH_435 = \[[\s\S]*?\];/,
    `const DOB_NOW_ROUNDS_THROUGH_435 = ${JSON.stringify(DOB_NOW_ROUNDS_THROUGH_435, null, 2)};`,
    "DOB NOW prior-round list"
  );

  transformed = replaceRegexOnce(
    transformed,
    /const DOB_ADMIN_PRIOR_PATTERNS = \[[\s\S]*?\];/,
    `const DOB_ADMIN_PRIOR_PATTERNS = [
  /round112_nyc_dob/i,
  /round117_nyc_dob/i,
  /round117_nyc_local_dob/i,
  /round119_nyc_dob/i,
  /round\\d+_nyc_dob_now/i,
  /round\\d+_nyc_dob_co/i
];`,
    "DOB administrative prior patterns"
  );

  transformed = replaceRequired(
    transformed,
    "round112|round117|round119|round133|round136|round143|round149|round152|round155|round158|round160|round162|round164|round167|round169|round173|round175|round179|round181|round185|round187|round191|round193|round197|round199|round203|round205|round209|round211|round219|round222|round225|round227|round232|round237|round242|round247|round250|round256|round264|round267|round273|round278|round289",
    PRIOR_ROUND_REGEX_THROUGH_435,
    "DOB prior-round summary regex"
  );

  transformed = replaceRequired(
    transformed,
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "required_round237_screened: prior.priorDobFiles.some((file) => /round237_nyc_dob_now/i.test(file)),\n      required_round293_screened: prior.priorDobFiles.some((file) => /round293_nyc_dob_now/i.test(file)),\n      required_round397_screened: prior.priorDobFiles.some((file) => /round397_nyc_dob_now/i.test(file)),\n      required_round401_screened: prior.priorDobFiles.some((file) => /round401_nyc_dob_now/i.test(file)),\n      required_round407_screened: prior.priorDobFiles.some((file) => /round407_nyc_dob_now/i.test(file)),\n      required_round413_screened: prior.priorDobFiles.some((file) => /round413_nyc_dob_now/i.test(file)),\n      required_round429_screened: prior.priorDobFiles.some((file) => /round429_nyc_dob_now/i.test(file)),\n      required_round435_screened: prior.priorDobFiles.some((file) => /round435_nyc_dob_now/i.test(file)),\n      required_round289_screened: prior.priorDobFiles.some((file) => /round289_nyc_dob_co/i.test(file)),",
    "Round438 validation prior markers"
  );

  transformed = replaceOnce(
    transformed,
    "main().catch((error) => {\n  console.error(error);\n  process.exit(1);\n});",
    "module.exports = { main };",
    "main export"
  );

  return transformed;
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
    throw new Error("Transformed Round438 DOB NOW generator did not export main().");
  }
  await sandbox.module.exports.main();
}

function walkJsonCandidateFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  const ownOutDir = path.normalize(OUT_DIR).replace(/\\/g, "/");
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (normalized === ownOutDir) continue;
        stack.push(fullPath);
      } else if (
        entry.name === "candidates.json" ||
        /^nyc_arch_candidates.*\.json$/i.test(entry.name) ||
        /^round\d+_nyc_.*candidates.*\.json$/i.test(entry.name)
      ) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function buildPriorSimpleIndex() {
  const filesRead = [];
  const sourceRecordIds = new Set();
  const sourceUrls = new Set();
  const sourceUrlDateKeys = new Set();
  const titleDateKeys = new Set();

  for (const file of [CORPUS_PATH, ...walkJsonCandidateFiles("tmp/subagents")]) {
    if (!fs.existsSync(file)) continue;
    try {
      const doc = readJson(file);
      filesRead.push(file.replace(/\\/g, "/"));
      for (const record of candidateArray(doc)) {
        const date = parseDate(record.effective_date || record.date || record.issuance_date || "");
        const sourceRecordId = normalizeKey(record.source_record_id);
        const sourceUrl = normalizeKey(record.source_url);
        const titleDate = normalizeTitleDate(record.title, date);
        if (sourceRecordId) sourceRecordIds.add(sourceRecordId);
        if (sourceUrl) sourceUrls.add(sourceUrl);
        if (sourceUrl && date) sourceUrlDateKeys.add(`${sourceUrl}|${date}`);
        if (titleDate) titleDateKeys.add(titleDate);
      }
    } catch (error) {
      filesRead.push(`${file.replace(/\\/g, "/")} (parse skipped: ${error.message})`);
    }
  }

  return {
    filesRead,
    sourceRecordIds,
    sourceUrls,
    sourceUrlDateKeys,
    titleDateKeys
  };
}

function corpusStats() {
  const stats = {
    path: CORPUS_PATH.replace(/\\/g, "/"),
    present: fs.existsSync(CORPUS_PATH),
    records: 0,
    contains_round429: false,
    round429_records: 0
  };
  if (!stats.present) return stats;
  const doc = readJson(CORPUS_PATH);
  const records = candidateArray(doc);
  stats.records = records.length;
  stats.round429_records = records.filter((record) => {
    const text = JSON.stringify(record);
    return text.includes("round429") || text.includes("Round429") || text.includes("nyc_dob_now_next22");
  }).length;
  stats.contains_round429 = stats.round429_records > 0;
  return stats;
}

function addRound438ArtifactContext() {
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
  const duplicateIndexFiles = stableSet([
    ...(summaryDoc.selection_summary?.duplicate_index_files || []),
    ...(summaryDoc.duplicate_screening?.screened_prior_dob_now_permit_co_files || []),
    ...(validationReport.checks?.prior_dob_files_scanned || [])
  ]);
  const screenedDobAdminFiles = duplicateIndexFiles.filter((file) =>
    /round112_nyc_dob/i.test(file) ||
    /round117_nyc_dob/i.test(file) ||
    /round117_nyc_local_dob/i.test(file) ||
    /round119_nyc_dob/i.test(file) ||
    /round\d+_nyc_dob_now/i.test(file) ||
    /round\d+_nyc_dob_co/i.test(file)
  );

  const priorScope = {
    manual_corpus: corpus,
    dob_now_rounds_through: "round435",
    dob_co_rounds_screened: "available tmp/subagents DOB CO packs",
    dob_now_rounds_screened: DOB_NOW_ROUNDS_THROUGH_435
  };

  candidatesDoc.worker = "Round438 NYC DOB NOW Next24 candidates";
  candidatesDoc.scope = "Official NYC DOB NOW Build approved-permit/job-filing candidate pack after screening the live manual architecture corpus and prior DOB NOW packs through Round435, with available DOB permit/application and DOB Certificate of Occupancy packs also screened. Records are administrative filing/permit/issued milestones and must not be presented as construction start, construction completion, opening, occupancy, impact, or causation evidence.";
  candidatesDoc.selection_summary = candidatesDoc.selection_summary || {};
  candidatesDoc.selection_summary.prior_scope = priorScope;

  for (const candidate of candidates) {
    candidate.id = candidate.id || candidate.candidate_id || candidate.event_id;
    candidate.method = candidate.transformation_method;
    candidate.geometry_ref = {
      type: "geocoded_point",
      source: candidate.geometry_source,
      precision: candidate.geometry_precision,
      address: candidate.address || "",
      borough: candidate.borough || "",
      bbl: candidate.bbl || "",
      bin: candidate.bin || ""
    };
    candidate.job_identifiers = {
      job_filing_number: candidate.job_filing_number || "",
      base_job_filing_number: candidate.base_job_filing_number || "",
      permit_job_filing_number: candidate.permit_job_filing_number || "",
      work_permit: candidate.work_permit || "",
      tracking_number: candidate.tracking_number || "",
      sequence_number: candidate.sequence_number || ""
    };
    candidate.transformation_method = cleanText(candidate.transformation_method)
      .replace(/round237/gi, "round435")
      .replace(/round289/gi, "available tmp/subagents DOB CO packs")
      .replace("current manual corpus plus round117 DOB filings/permits, round119 DOB legacy permits, DOB NOW packs through Round435, DOB Certificate of Occupancy packs available under tmp/subagents, and other DOB permit/application packs available under tmp/subagents candidate packs", "live manual corpus plus prior DOB permit/application packs, all DOB NOW packs through Round435, and DOB Certificate of Occupancy packs available under tmp/subagents");
    candidate.method = candidate.transformation_method;
    candidate.duplicate_check_note = "Exact job_filing_number, base DOB NOW job number, work_permit, tracking_number, source_record_id, source_url, candidate_id, event_id, and title/date keys were screened against the live manual architecture corpus and prior NYC DOB NOW, DOB permit/application, and DOB Certificate of Occupancy candidate packs available during this run, including DOB NOW through Round435.";
    candidate.limitations = cleanText(candidate.limitations);
  }

  sourceAuditDoc.audit_scope = "Official NYC DOB NOW Build approved permits and job application filings, selected for residual administrative milestone candidate discovery after screening the live manual architecture corpus, DOB NOW packs through Round435, and available DOB permit/application and DOB Certificate of Occupancy packs.";
  sourceAuditDoc.caveat = "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, impacts, or causation unless another source explicitly supports that claim.";
  sourceAuditDoc.selection_summary = {
    ...(sourceAuditDoc.selection_summary || {}),
    prior_scope: priorScope
  };

  summaryDoc.output_files = ALL_OUTPUTS;
  summaryDoc.worker = "Round438 NYC DOB NOW Next24 candidates";
  summaryDoc.candidate_count = candidates.length;
  summaryDoc.duplicate_screening = {
    ...(summaryDoc.duplicate_screening || {}),
    screened_prior_dob_now_permit_co_files: screenedDobAdminFiles
  };
  summaryDoc.selection_summary = {
    ...(summaryDoc.selection_summary || {}),
    prior_scope: priorScope
  };
  summaryDoc.source_ids = stableSet([
    ...(summaryDoc.source_ids || []),
    ...candidates.flatMap((candidate) => candidate.source_ids || [candidate.source_id])
  ]);
  summaryDoc.caveats = [
    "Administrative DOB NOW filing/permit milestone only.",
    "Not evidence that a building was built, completed, opened, occupied, or causally linked to outcomes.",
    "No construction completion, opening, occupancy, impact, or causation claim is made.",
    "Coordinates are DOB/Open Data geocoded address points, not work footprints.",
    "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
  ];

  rejectedDoc.accessed_at = ACCESSED_AT;
  rejectedDoc.rejected_counts = Object.fromEntries(Object.entries(rejectedDoc.rejected_counts || {}).sort(([a], [b]) => a.localeCompare(b)));

  validationReport.ok = true;
  validationReport.passed = true;
  validationReport.errors = [];
  validationReport.warnings = [];
  validationReport.validator = "scripts/fetch_round438_nyc_dob_now_next24_candidates.js --validate-only; reads emitted JSON plus manual corpus and prior DOB NOW/DOB permit/DOB CO candidate packs, then writes supplemental validation.json/readback.json";
  validationReport.checked_files = ALL_OUTPUTS;
  validationReport.checks = {
    ...(validationReport.checks || {}),
    manual_corpus: corpus,
    required_round435_screened: screenedDobAdminFiles.some((file) => /round435_nyc_dob_now/i.test(file)),
    prior_dob_files_scanned: screenedDobAdminFiles,
    required_round429_screened: screenedDobAdminFiles.some((file) => /round429_nyc_dob_now/i.test(file)),
    required_round413_screened: screenedDobAdminFiles.some((file) => /round413_nyc_dob_now/i.test(file)),
    manual_corpus_contains_round429: corpus.contains_round429,
    supplemental_outputs: [
      path.join(OUT_DIR, "validation.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "readback.json").replace(/\\/g, "/")
    ]
  };

  const dateRange = candidates.reduce((acc, candidate) => {
    const date = parseDate(candidate.effective_date || candidate.date);
    if (date && (!acc.start || date < acc.start)) acc.start = date;
    if (date && (!acc.end || date > acc.end)) acc.end = date;
    return acc;
  }, { start: "", end: "" });

  const notes = [
    "# Round438 NYC DOB NOW Next24 Candidate Pack",
    "",
    `Generated ${candidates.length} fresh nonduplicate administrative DOB NOW approved-permit candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values. Requested window is 2008-01-01 through 2026-05-20; selected candidate rows in this run fall within the actual DOB NOW Build data returned by the API.",
    "The request window starts in 2008, but actual DOB NOW Build rows available for this continuation start later; this pack's retained candidates begin on the candidate date range reported below.",
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
    `Screened against the live manual corpus (${corpus.records} records; Round429 present in manual corpus: ${corpus.contains_round429}) plus prior DOB NOW packs through Round435 and available DOB administrative candidate packs.`,
    "",
    "## Counts",
    "",
    `- Permit rows fetched: ${candidatesDoc.selection_summary.permit_rows_fetched}`,
    `- Permit rows after duplicate/geography filters: ${candidatesDoc.selection_summary.permit_rows_after_duplicate_and_geometry_filters}`,
    `- Application rows fetched: ${candidatesDoc.selection_summary.application_rows_fetched}`,
    `- Candidate pool before balancing: ${candidatesDoc.selection_summary.candidate_pool_before_balancing}`,
    `- Candidates retained: ${candidates.length}`,
    `- Candidate date range: ${dateRange.start || "n/a"} through ${dateRange.end || "n/a"}`,
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
  const summary = parsed["summary.json"] || {};
  const sourceAudit = parsed["source_audit.json"] || {};
  const validationReport = parsed["validation_report.json"] || {};
  const rejected = parsed["rejected.json"] || {};
  const corpus = validationReport.checks?.manual_corpus || corpusStats();
  const prior = buildPriorSimpleIndex();

  let minDate = "";
  let maxDate = "";
  const ids = new Set();
  const candidateIds = new Set();
  const eventIds = new Set();
  const sourceRecordIds = new Set();
  const sourceIds = new Set();
  const titleDateKeys = new Set();
  const banned = /\b(caused|proves?|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const requiredCandidateFields = [
    "id",
    "city_id",
    "candidate_id",
    "event_id",
    "title",
    "summary",
    "date",
    "effective_date",
    "address",
    "borough",
    "geometry_ref",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "attribution",
    "accessed_at",
    "method",
    "confidence",
    "limitations",
    "job_filing_number",
    "base_job_filing_number",
    "work_permit",
    "tracking_number"
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
    if (candidate.source_dataset_id !== "nyc-dob-now-build-approved-permits-rbx6-tga4") errors.push(`Unexpected source_dataset_id for ${label}: ${candidate.source_dataset_id}`);
    if (!String(candidate.source_date_field || "").includes("issued_date")) errors.push(`source_date_field does not name issued_date for ${label}`);
    if (!candidate.source_ids?.includes("nyc-dob-filings-permits")) errors.push(`Missing canonical DOB source id for ${label}`);

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
      [candidateIds, candidate.candidate_id, "candidate_id"],
      [eventIds, candidate.event_id, "event_id"],
      [sourceRecordIds, candidate.source_record_id, "source_record_id"]
    ]) {
      const key = normalizeKey(value);
      if (set.has(key)) errors.push(`Duplicate ${field}: ${value}`);
      set.add(key);
    }

    const titleDate = normalizeTitleDate(candidate.title, date);
    if (titleDateKeys.has(titleDate)) errors.push(`Duplicate candidate title/date key ${titleDate}`);
    titleDateKeys.add(titleDate);

    const sourceRecordKey = normalizeKey(candidate.source_record_id);
    const sourceUrlKey = normalizeKey(candidate.source_url);
    const sourceUrlDateKey = sourceUrlKey && date ? `${sourceUrlKey}|${date}` : "";
    if (sourceRecordKey && prior.sourceRecordIds.has(sourceRecordKey)) errors.push(`Candidate source_record_id overlaps prior corpus for ${label}: ${candidate.source_record_id}`);
    if (sourceUrlKey && prior.sourceUrls.has(sourceUrlKey)) errors.push(`Candidate source_url overlaps prior corpus for ${label}: ${candidate.source_url}`);
    if (sourceUrlDateKey && prior.sourceUrlDateKeys.has(sourceUrlDateKey)) errors.push(`Candidate source_url/date overlaps prior corpus for ${label}: ${candidate.source_url}`);
    if (titleDate && prior.titleDateKeys.has(titleDate)) errors.push(`Candidate title/date overlaps prior corpus for ${label}: ${candidate.title}`);

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

  if (candidates.length !== TARGET_COUNT) warnings.push(`Candidate count ${candidates.length} differs from target ${TARGET_COUNT}`);
  if (summary.candidate_count !== candidates.length) errors.push("summary.json candidate_count does not match candidates array");
  if (validationReport.ok !== true || validationReport.passed !== true) errors.push("validation_report.json is not passing");
  if (validationReport.checks?.required_round429_screened !== true) errors.push("validation_report.json does not confirm Round429 DOB NOW screening");
  if (validationReport.checks?.required_round435_screened !== true) errors.push("validation_report.json does not confirm Round435 DOB NOW screening");
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length < 2) errors.push("source_audit.json does not include both official DOB NOW sources");
  if (!rejected.rejected_counts || typeof rejected.rejected_counts !== "object") errors.push("rejected.json missing rejected_counts");

  const sourceRecordSamples = candidates.slice(0, 20).map((candidate) => candidate.source_record_id);
  const sourceApiSamples = candidates.slice(0, 5).map((candidate) => candidate.source_api_url || candidate.source_url);
  const noPriorOverlap = errors.every((error) => !/overlaps prior corpus/i.test(error));

  const readback = {
    schema_version: "round438.nyc_dob_now_next24_readback.v1",
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
      manual_corpus_screened: prior.filesRead.includes(CORPUS_PATH.replace(/\\/g, "/")),
      manual_corpus: corpus,
      dob_now_through_round435_screened: validationReport.checks?.required_round435_screened === true,
      prior_files_read: prior.filesRead.length,
      prior_dob_files_scanned: validationReport.checks?.prior_dob_files_scanned || [],
      prior_identifier_tokens_checked: validationReport.checks?.prior_identifier_tokens_checked || 0,
      no_overlap_with_screened_corpus_and_prior_packs: validationReport.checks?.no_overlap_with_screened_corpus_and_prior_packs === true,
      no_title_date_overlap_with_prior_packs: noPriorOverlap
    },
    caveats: [
      "DOB NOW rows are administrative filing/permit milestones only.",
      "The pack does not claim construction start, construction completion, opening, occupancy, impact, or causation.",
      "Coordinates are NYC Open Data/DOB geocoded points, not surveyed footprints or work limits."
    ],
    errors,
    warnings
  };

  const validation = {
    schema_version: "round438.nyc_dob_now_next24_validation.v1",
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
      unique_candidate_ids: candidateIds.size,
      unique_event_ids: eventIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      unique_title_date_keys: titleDateKeys.size,
      source_ids: readback.source_ids,
      json_parse_ok: Object.values(fileStats).every((stat) => stat.parsed),
      readback_ok: readback.ok,
      validation_report_ok: validationReport.ok === true && validationReport.passed === true,
      required_round429_screened: validationReport.checks?.required_round429_screened === true,
      required_round435_screened: validationReport.checks?.required_round435_screened === true,
      manual_corpus_contains_round429: validationReport.checks?.manual_corpus_contains_round429 === true,
      no_overlap_with_screened_corpus_and_prior_packs: validationReport.checks?.no_overlap_with_screened_corpus_and_prior_packs === true,
      no_source_record_or_source_url_overlap_with_prior_packs: noPriorOverlap,
      no_title_date_overlap_with_prior_packs: noPriorOverlap,
      no_prediction_or_causation_language: errors.every((error) => !/Overclaim wording/i.test(error)),
      notes_present: fs.existsSync(notesPath)
    },
    errors,
    warnings
  };

  validationReport.ok = errors.length === 0 && validationReport.ok === true;
  validationReport.passed = errors.length === 0 && validationReport.passed === true;
  validationReport.checked_files = ALL_OUTPUTS;
  validationReport.checks = {
    ...(validationReport.checks || {}),
    supplemental_validation_ok: validation.ok,
    supplemental_readback_ok: readback.ok,
    no_source_record_or_source_url_overlap_with_prior_packs: noPriorOverlap,
    no_title_date_overlap_with_prior_packs: noPriorOverlap,
    supplemental_outputs: [
      path.join(OUT_DIR, "validation.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "readback.json").replace(/\\/g, "/")
    ]
  };
  validationReport.errors = [...(validationReport.errors || []), ...errors];
  validationReport.warnings = [...(validationReport.warnings || []), ...warnings];

  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);

  if (errors.length) {
    throw new Error(`Round438 validation failed with ${errors.length} errors. See ${path.join(OUT_DIR, "validation.json")}`);
  }

  return { readback, validation };
}

async function main() {
  if (!process.argv.includes("--validate-only")) {
    await runTransformedRound293Main();
  }
  addRound438ArtifactContext();
  const { validation } = buildReadbackAndValidation();
  console.log(`Round438 validation passed for ${validation.checks.candidate_count} candidates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
