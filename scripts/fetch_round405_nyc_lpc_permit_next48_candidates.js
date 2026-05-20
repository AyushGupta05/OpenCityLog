const fs = require("fs");
const path = require("path");

const TEMPLATE = path.join(__dirname, "fetch_round204_nyc_lpc_permit_next9_candidates.js");

function replaceOnce(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Template marker not found: ${search}`);
  }
  return source.replace(search, replacement);
}

function replaceRegexOnce(source, regex, replacement, label) {
  if (!regex.test(source)) {
    throw new Error(`Template marker not found: ${label}`);
  }
  return source.replace(regex, replacement);
}

function validationReportForOutputsTemplate(existing) {
  const errors = [];
  const warnings = [];
  const checkedFilePaths = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    NOTES_PATH,
    REJECTED_PATH,
    VALIDATION_REPORT_PATH
  ];
  const checkedFiles = checkedFilePaths.map((file) => path.relative(ROOT, file));
  const requiredGeneratedBeforeReport = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    NOTES_PATH,
    REJECTED_PATH
  ];

  for (const file of requiredGeneratedBeforeReport) {
    if (!fs.existsSync(file)) errors.push(`missing generated file ${path.relative(ROOT, file)}`);
  }

  const candidatesPayload = readJsonIfExists(CANDIDATES_PATH) || {};
  const sourceAudit = readJsonIfExists(SOURCE_AUDIT_PATH) || {};
  const summary = readJsonIfExists(SUMMARY_PATH) || {};
  const notesText = readTextIfExists(NOTES_PATH);
  const rejectedPayload = readJsonIfExists(REJECTED_PATH) || {};
  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const source = Array.isArray(sourceAudit.sources) ? sourceAudit.sources[0] || {} : {};

  const requiredCandidateFields = [
    "city_id",
    "event_id",
    "candidate_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "effective_date",
    "date_precision",
    "geometry",
    "latitude",
    "longitude",
    "source_id",
    "source_name",
    "publisher",
    "source_url",
    "source_record_id",
    "source_type",
    "accessed_at",
    "source_date_field",
    "source_dataset_id",
    "confidence",
    "geometry_source",
    "geometry_precision",
    "license",
    "license_or_terms_note",
    "license_url",
    "attribution",
    "limitations",
    "transformation_method",
    "evidence_fields",
    "raw_row_subset"
  ];
  const requiredSourceFields = [
    "source_id",
    "source_dataset_id",
    "source_name",
    "publisher",
    "source_url",
    "metadata_url",
    "api_endpoint",
    "api_query",
    "source_type",
    "attribution",
    "license",
    "license_or_terms_note",
    "license_url",
    "accessed_at",
    "coverage_years_checked",
    "key_fields_used",
    "reliability",
    "required_caveats",
    "dedupe_inputs"
  ];
  const disallowedOutputTerms = /\b(proof|prediction|predictive|forecast|simulation|simulate|causal|causality)\b|impact score/i;
  const eventIds = new Set();
  const sourceRecordIds = new Set();
  const sourceUrls = new Set();
  const titleDateKeys = new Set();
  const recordDateKeys = new Set();
  const sourceDateKeys = new Set();

  if (candidates.length !== MAX_CANDIDATES) {
    errors.push(`candidate_count expected ${MAX_CANDIDATES}, found ${candidates.length}`);
  }
  if (candidatesPayload.candidate_count !== candidates.length) {
    errors.push("candidates.json candidate_count does not match candidates array length");
  }
  if (summary.candidate_count !== candidates.length) {
    errors.push("summary candidate_count does not match candidates array length");
  }
  if (sourceAudit.generated_at !== summary.generated_at) {
    errors.push("source_audit generated_at does not match summary generated_at");
  }
  if (!notesText.includes("validation_report.json") || !notesText.includes("validation.json") || !notesText.includes("readback.json")) {
    errors.push("notes.md does not list validation/readback outputs");
  }
  if (!rejectedPayload.rejected_counts || typeof rejectedPayload.rejected_counts !== "object") {
    errors.push("rejected.json missing rejected_counts object");
  }

  for (const [index, candidate] of candidates.entries()) {
    const label = candidate.source_record_id || `candidate ${index}`;
    for (const field of requiredCandidateFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${label}: missing ${field}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`${label}: city_id must be nyc`);
    if (candidate.date !== candidate.effective_date) errors.push(`${label}: date and effective_date differ`);
    if (candidate.date < START_DATE || candidate.date > END_DATE) {
      errors.push(`${label}: date outside ${START_DATE}..${END_DATE}`);
    }
    if (!nycPoint({ latitude: candidate.latitude, longitude: candidate.longitude })) {
      errors.push(`${label}: latitude/longitude outside NYC bounds`);
    }
    if (
      candidate.geometry?.type !== "Point" ||
      !Array.isArray(candidate.geometry.coordinates) ||
      candidate.geometry.coordinates.length !== 2
    ) {
      errors.push(`${label}: geometry must be a Point with two coordinates`);
    } else {
      const [lon, lat] = candidate.geometry.coordinates;
      if (Number(lon) !== Number(candidate.longitude) || Number(lat) !== Number(candidate.latitude)) {
        errors.push(`${label}: geometry coordinates do not match latitude/longitude fields`);
      }
    }
    if (candidate.source_dataset_id !== SOURCE_DATASET_ID) errors.push(`${label}: unexpected source_dataset_id`);
    if (candidate.source_date_field !== "issue_date") errors.push(`${label}: unexpected source_date_field`);
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`${label}: accessed_at must be ${ACCESSED_AT}`);
    if (candidate.confidence !== "documented") errors.push(`${label}: confidence must be documented`);
    if (candidate.license !== "NYC Open Data Terms of Use / NYC.gov Terms of Use") {
      errors.push(`${label}: missing normalized license label`);
    }
    if (candidate.license_url !== NYC_OPEN_DATA_TERMS) errors.push(`${label}: unexpected license_url`);
    if (candidate.source_url !== recordUrl(candidate.source_record_id)) errors.push(`${label}: unexpected source_url`);
    if (!/administrative/i.test(candidate.limitations)) {
      errors.push(`${label}: limitations must identify administrative LPC processing`);
    }
    const checkedEventText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.geometry_precision
    ].join(" ");
    if (disallowedOutputTerms.test(checkedEventText)) {
      errors.push(`${label}: event or caveat text contains disallowed overclaim wording`);
    }
    if (eventIds.has(candidate.event_id)) errors.push(`${label}: duplicate event_id in pack`);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${label}: duplicate source_record_id in pack`);
    if (sourceUrls.has(candidate.source_url)) errors.push(`${label}: duplicate source_url in pack`);
    if (existing.eventIds.has(candidate.event_id)) errors.push(`${label}: event_id already present in overlap inputs`);
    if (existing.recordIds.has(candidate.source_record_id)) errors.push(`${label}: source_record_id already present in overlap inputs`);
    if (existing.sourceUrls.has(candidate.source_url.toLowerCase())) errors.push(`${label}: source_url already present in overlap inputs`);

    const candidateTitleDateKey = titleDateKey(candidate.city_id, candidate.title, candidate.date);
    const candidateRecordDateKey = recordDateKey(candidate.source_record_id, candidate.date);
    const candidateSourceDateKeys = [
      sourceDateKey(candidate.source_id, candidate.source_record_id, candidate.date),
      sourceDateKey(candidate.source_dataset_id, candidate.source_record_id, candidate.date),
      sourceDateKey("nyc-lpc-permit-application-information", candidate.source_record_id, candidate.date),
      sourceDateKey(SOURCE_DATASET_ID, candidate.source_record_id, candidate.date)
    ];
    if (titleDateKeys.has(candidateTitleDateKey)) errors.push(`${label}: duplicate title/date key in pack`);
    if (existing.titleDates.has(candidateTitleDateKey)) errors.push(`${label}: title/date key already present in overlap inputs`);
    if (recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: duplicate record/date key in pack`);
    if (existing.recordDateKeys.has(candidateRecordDateKey)) errors.push(`${label}: record/date key already present in overlap inputs`);
    for (const key of new Set(candidateSourceDateKeys)) {
      if (sourceDateKeys.has(key)) errors.push(`${label}: duplicate source/date key in pack`);
      if (existing.sourceDateKeys.has(key)) errors.push(`${label}: source/date key already present in overlap inputs`);
      sourceDateKeys.add(key);
    }
    eventIds.add(candidate.event_id);
    sourceRecordIds.add(candidate.source_record_id);
    sourceUrls.add(candidate.source_url);
    titleDateKeys.add(candidateTitleDateKey);
    recordDateKeys.add(candidateRecordDateKey);
  }

  for (const field of requiredSourceFields) {
    if (source[field] === undefined || source[field] === null || source[field] === "") {
      errors.push(`source_audit source missing ${field}`);
    }
  }
  if (source.source_dataset_id !== SOURCE_DATASET_ID) errors.push("source_audit source_dataset_id mismatch");
  if (source.source_url !== DATASET_PAGE) errors.push("source_audit official source_url mismatch");
  if (source.license !== "NYC Open Data Terms of Use / NYC.gov Terms of Use") {
    errors.push("source_audit missing normalized license label");
  }
  if (source.license_url !== NYC_OPEN_DATA_TERMS) errors.push("source_audit license_url mismatch");
  if (source.accessed_at !== ACCESSED_AT) errors.push(`source_audit accessed_at must be ${ACCESSED_AT}`);
  const sourceCaveatText = JSON.stringify({
    required_caveats: source.required_caveats,
    ingestion_recommendation: source.ingestion_recommendation
  });
  if (disallowedOutputTerms.test(sourceCaveatText)) {
    errors.push("source_audit caveat text contains disallowed overclaim wording");
  }

  if (notesText && disallowedOutputTerms.test(notesText)) {
    errors.push("notes.md contains disallowed overclaim wording");
  }

  return {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    validator: "Round405 generator validation: re-read emitted JSON, checked provenance, geometry, date window, license/terms fields, duplicate keys, and source-audit caveats after scanning current corpus plus prior LPC packs through round399.",
    checked_files: checkedFiles,
    checks: {
      candidate_count: candidates.length,
      required_provenance_fields: "checked per candidate, including id, dates, geometry, source, publisher, source URL, license/terms, accessed_at, method, confidence, limitations, evidence fields, and raw source row subset",
      unique_event_ids: eventIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      unique_record_date_keys: recordDateKeys.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_urls: sourceUrls.size,
      unique_title_date_keys: titleDateKeys.size,
      date_window: `${START_DATE}..${END_DATE}`,
      date_range: summary.date_range || null,
      nyc_bounds: {
        minLat: 40.4774,
        maxLat: 40.9176,
        minLon: -74.2591,
        maxLon: -73.7004
      },
      source_dataset_only: SOURCE_DATASET_ID,
      source_date_field: "issue_date",
      accessed_at: ACCESSED_AT,
      official_source_url: DATASET_PAGE,
      manual_corpus_scanned: path.relative(ROOT, CORPUS_PATH),
      prior_lpc_packs_scanned: PRIOR_PACK_PATHS,
      missing_overlap_inputs: existing.missingFiles,
      overlap_inputs_scanned: existing.scannedFiles.length,
      existing_record_ids_seen: existing.recordIds.size,
      existing_event_ids_seen: existing.eventIds.size,
      source_audit_license: source.license || null,
      source_audit_license_url: source.license_url || null,
      by_regulation_type: summary.by_regulation_type || {},
      by_year: summary.by_year || {},
      by_bucket: summary.by_bucket || {},
      by_borough: summary.by_borough || {}
    },
    errors,
    warnings,
    passed: errors.length === 0
  };
}

function readbackValidationReportTemplate(validationReport) {
  const errors = [];
  const jsonFiles = [
    CANDIDATES_PATH,
    SOURCE_AUDIT_PATH,
    SUMMARY_PATH,
    REJECTED_PATH,
    VALIDATION_REPORT_PATH,
    VALIDATION_PATH
  ];
  const noteFiles = [NOTES_PATH];
  const payloads = new Map();

  for (const file of jsonFiles) {
    const payload = readJsonIfExists(file);
    if (!payload) {
      errors.push(`missing or unreadable JSON file ${path.relative(ROOT, file)}`);
    } else {
      payloads.set(file, payload);
    }
  }
  for (const file of noteFiles) {
    if (!readTextIfExists(file)) errors.push(`missing or unreadable notes file ${path.relative(ROOT, file)}`);
  }

  const candidatesPayload = payloads.get(CANDIDATES_PATH) || {};
  const summary = payloads.get(SUMMARY_PATH) || {};
  const validationAlias = payloads.get(VALIDATION_PATH) || {};
  const candidates = Array.isArray(candidatesPayload.candidates) ? candidatesPayload.candidates : [];
  const ids = new Set();
  const sourceRecordIds = new Set();
  const sourceUrls = new Set();
  const recordDateKeys = new Set();
  const dates = [];

  for (const [index, candidate] of candidates.entries()) {
    const label = candidate.source_record_id || `candidate ${index}`;
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`${label}: accessed_at mismatch in readback`);
    if (candidate.source_dataset_id !== SOURCE_DATASET_ID) errors.push(`${label}: source_dataset_id mismatch in readback`);
    if (candidate.license_url !== NYC_OPEN_DATA_TERMS) errors.push(`${label}: license_url mismatch in readback`);
    if (ids.has(candidate.event_id)) errors.push(`${label}: duplicate event_id in readback`);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${label}: duplicate source_record_id in readback`);
    if (sourceUrls.has(candidate.source_url)) errors.push(`${label}: duplicate source_url in readback`);
    const key = recordDateKey(candidate.source_record_id, candidate.date);
    if (recordDateKeys.has(key)) errors.push(`${label}: duplicate record/date key in readback`);
    ids.add(candidate.event_id);
    sourceRecordIds.add(candidate.source_record_id);
    sourceUrls.add(candidate.source_url);
    recordDateKeys.add(key);
    if (candidate.date) dates.push(candidate.date);
  }

  const sortedDates = [...dates].sort();
  const dateRange = {
    start: sortedDates[0] || null,
    end: sortedDates[sortedDates.length - 1] || null
  };
  if (candidates.length !== MAX_CANDIDATES) errors.push(`readback candidate_count expected ${MAX_CANDIDATES}, found ${candidates.length}`);
  if (summary.candidate_count !== candidates.length) errors.push("summary candidate_count mismatch in readback");
  if (summary.date_range && (summary.date_range.start !== dateRange.start || summary.date_range.end !== dateRange.end)) {
    errors.push("summary date_range mismatch in readback");
  }
  if (!validationReport.passed) errors.push("validation_report.json did not pass");
  if (validationAlias.validation_report_path !== path.relative(ROOT, VALIDATION_REPORT_PATH)) {
    errors.push("validation.json does not point to validation_report.json");
  }
  if (validationAlias.passed !== validationReport.passed) {
    errors.push("validation.json passed flag differs from validation_report.json");
  }

  return {
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    validator: "Round405 JSON readback validation: re-opened emitted files after write, checked parseability, counts, date range, IDs, source URLs, license URL, and validation alias.",
    checked_files: [...jsonFiles, ...noteFiles, READBACK_PATH].map((file) => path.relative(ROOT, file)),
    candidate_count: candidates.length,
    date_range: dateRange,
    source_dataset_id: SOURCE_DATASET_ID,
    source_record_ids: [...sourceRecordIds].sort(),
    sample_source_record_ids: [...sourceRecordIds].sort().slice(0, 20),
    unique_event_ids: ids.size,
    unique_source_record_ids: sourceRecordIds.size,
    unique_source_urls: sourceUrls.size,
    unique_record_date_keys: recordDateKeys.size,
    validation_report_passed: validationReport.passed,
    errors,
    warnings: [],
    passed: errors.length === 0
  };
}

const priorPackPathsSource = `const PRIOR_PACK_PATHS = [
  "tmp/subagents/round112_nyc_lpc_permit_candidates.json",
  "tmp/subagents/round114_nyc_lpc_landmarks_official/round114_nyc_lpc_landmarks_candidates.json",
  "tmp/subagents/round115_nyc_lpc_fuller_official/round115_nyc_lpc_fuller_candidates.json",
  "tmp/subagents/round115_nyc_lpc_individual_official/round115_nyc_lpc_individual_candidates.json",
  "tmp/subagents/round116_nyc_lpc_permits_official/candidates.json",
  "tmp/subagents/round120_nyc_lpc_designations_more/candidates.json",
  "tmp/subagents/round122_nyc_lpc_permits_designations/candidates.json",
  "tmp/subagents/round130_heritage_designations_more/candidates.json",
  "tmp/subagents/round138_nyc_lpc_individual_landmark_gaps/candidates.json",
  "tmp/subagents/round142_nyc_lpc_designation_gaps/candidates.json",
  "tmp/subagents/round154_nyc_lpc_permit_deep/candidates.json",
  "tmp/subagents/round159_nyc_lpc_permit_next/candidates.json",
  "tmp/subagents/round163_nyc_lpc_permit_next2/candidates.json",
  "tmp/subagents/round168_nyc_lpc_permit_next3/candidates.json",
  "tmp/subagents/round174_nyc_lpc_permit_next4/candidates.json",
  "tmp/subagents/round180_nyc_lpc_permit_next5/candidates.json",
  "tmp/subagents/round186_nyc_lpc_permit_next6/candidates.json",
  "tmp/subagents/round192_nyc_lpc_permit_next7/candidates.json",
  "tmp/subagents/round198_nyc_lpc_permit_next8/candidates.json",
  "tmp/subagents/round204_nyc_lpc_permit_next9/candidates.json",
  "tmp/subagents/round210_nyc_lpc_permit_next10/candidates.json",
  "tmp/subagents/round216_nyc_lpc_designation_tail/candidates.json",
  "tmp/subagents/round218_nyc_lpc_permit_next11/candidates.json",
  "tmp/subagents/round224_nyc_lpc_permit_next12/candidates.json",
  "tmp/subagents/round231_nyc_lpc_permit_next13/candidates.json",
  "tmp/subagents/round240_nyc_lpc_permit_next14/candidates.json",
  "tmp/subagents/round244_nyc_lpc_permit_next15/candidates.json",
  "tmp/subagents/round249_nyc_lpc_permit_next16/candidates.json",
  "tmp/subagents/round254_nyc_lpc_permit_next17/candidates.json",
  "tmp/subagents/round262_nyc_lpc_permit_next18/candidates.json",
  "tmp/subagents/round268_nyc_lpc_permit_next19/candidates.json",
  "tmp/subagents/round274_nyc_lpc_permit_next20/candidates.json",
  "tmp/subagents/round282_nyc_lpc_permit_next21/candidates.json",
  "tmp/subagents/round290_nyc_lpc_permit_next22/candidates.json",
  "tmp/subagents/round299_nyc_lpc_permit_next23/candidates.json",
  "tmp/subagents/round302_nyc_lpc_permit_next24/candidates.json",
  "tmp/subagents/round307_nyc_lpc_permit_next25/candidates.json",
  "tmp/subagents/round312_nyc_lpc_permit_next26/candidates.json",
  "tmp/subagents/round317_nyc_lpc_permit_next27/candidates.json",
  "tmp/subagents/round321_nyc_lpc_permit_next28/candidates.json",
  "tmp/subagents/round325_nyc_lpc_permit_next29/candidates.json",
  "tmp/subagents/round329_nyc_lpc_permit_next30/candidates.json",
  "tmp/subagents/round334_nyc_lpc_permit_next31/candidates.json",
  "tmp/subagents/round337_nyc_lpc_permit_next32/candidates.json",
  "tmp/subagents/round342_nyc_lpc_permit_next33/candidates.json",
  "tmp/subagents/round346_nyc_lpc_permit_next34/candidates.json",
  "tmp/subagents/round351_nyc_lpc_permit_next35/candidates.json",
  "tmp/subagents/round355_nyc_lpc_permit_next36/candidates.json",
  "tmp/subagents/round359_nyc_lpc_permit_next37/candidates.json",
  "tmp/subagents/round363_nyc_lpc_permit_next38/candidates.json",
  "tmp/subagents/round366_nyc_lpc_permit_next39/candidates.json",
  "tmp/subagents/round370_nyc_lpc_permit_next40/candidates.json",
  "tmp/subagents/round374_nyc_lpc_permit_next41/candidates.json",
  "tmp/subagents/round378_nyc_lpc_permit_next42/candidates.json",
  "tmp/subagents/round381_nyc_lpc_permit_next43/candidates.json",
  "tmp/subagents/round385_nyc_lpc_permit_next44/candidates.json",
  "tmp/subagents/round388_nyc_lpc_permit_next45/candidates.json",
  "tmp/subagents/round394_nyc_lpc_permit_next46/candidates.json",
  "tmp/subagents/round399_nyc_lpc_permit_next47/candidates.json"
];`;

let source = fs.readFileSync(TEMPLATE, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

source = source
  .replace(/const ROUND = 204;/g, "const ROUND = 405;")
  .replace(/const ACCESSED_AT = "2026-05-19";/g, 'const ACCESSED_AT = "2026-05-20";')
  .replace(/round204_nyc_lpc_permit_next9/g, "round405_nyc_lpc_permit_next48")
  .replace(/round204/g, "round405")
  .replace(/Round204/g, "Round405")
  .replace(/next9/g, "next48")
  .replace(/Next9/g, "Next48")
  .replace(/through round198/g, "through round399");

source = replaceRegexOnce(
  source,
  /const PRIOR_PACK_PATHS = \[[\s\S]*?\];/,
  priorPackPathsSource,
  "PRIOR_PACK_PATHS"
);

source = replaceOnce(
  source,
  'const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");\n',
  'const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");\nconst VALIDATION_REPORT_PATH = path.join(OUT_DIR, "validation_report.json");\nconst VALIDATION_PATH = path.join(OUT_DIR, "validation.json");\nconst READBACK_PATH = path.join(OUT_DIR, "readback.json");\n'
);

source = replaceOnce(
  source,
  "function collectExistingKeys() {\n",
  `function eventRowsFromCorpus(corpus) {
  if (Array.isArray(corpus)) return corpus;
  for (const key of ["events", "candidates", "milestones", "records"]) {
    if (Array.isArray(corpus?.[key])) return corpus[key];
  }
  return [];
}

function collectExistingKeys() {
`
);

source = replaceOnce(
  source,
  "    for (const event of corpus.events || []) {\n",
  "    for (const event of eventRowsFromCorpus(corpus)) {\n"
);

source = replaceOnce(
  source,
  "    latitude: point.latitude,\n    longitude: point.longitude,\n",
  '    latitude: point.latitude,\n    longitude: point.longitude,\n    geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },\n'
);

source = replaceOnce(
  source,
  '    license_or_terms_note: "NYC Open Data / NYC.gov terms apply; dataset metadata licenseId/license is null. Attribute LPC/NYC Open Data, preserve row identifiers, and re-check metadata before redistribution.",\n    license_url: NYC_OPEN_DATA_TERMS,\n',
  '    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use",\n    license_or_terms_note: "NYC Open Data / NYC.gov terms apply; dataset metadata licenseId/license is null. Attribute LPC/NYC Open Data, preserve row identifiers, and re-check metadata before redistribution.",\n    license_url: NYC_OPEN_DATA_TERMS,\n'
);

source = replaceOnce(
  source,
  '        license_or_terms_note: "Dataset metadata licenseId/license is null. NYC Open Data Terms of Use and NYC.gov Terms of Use apply; public datasets may be updated, corrected, or refreshed by the submitting agency.",\n        license_url: NYC_OPEN_DATA_TERMS,\n',
  '        license: "NYC Open Data Terms of Use / NYC.gov Terms of Use",\n        license_or_terms_note: "Dataset metadata licenseId/license is null. NYC Open Data Terms of Use and NYC.gov Terms of Use apply; public datasets may be updated, corrected, or refreshed by the submitting agency.",\n        license_url: NYC_OPEN_DATA_TERMS,\n'
);

source = replaceOnce(
  source,
  '          "Notice of Compliance, if present in the source, is not treated here as independent proof of compliance sign-off or final physical condition."\n',
  '          "Notice of Compliance, if present in the source, is not treated here as an independent final compliance or physical-condition observation."\n'
);

source = replaceOnce(
  source,
  '      caveat: "Administrative LPC permit/application processing only; no construction, completion, compliance, condition, outcome, causality, or geometry-of-work claim is made."\n',
  '      caveat: "Administrative LPC permit/application processing only; no construction, completion, compliance, condition, outcome, or approved-work-geometry claim is made."\n'
);

source = replaceOnce(
  source,
  "\nfunction markdownNotes(summary) {\n",
  `\n${validationReportForOutputsTemplate.toString().replace(
    "function validationReportForOutputsTemplate",
    "function validationReportForOutputs"
  )}

${readbackValidationReportTemplate.toString().replace(
    "function readbackValidationReportTemplate",
    "function readbackValidationReport"
  )}

function markdownNotes(summary) {\n`
);

source = replaceOnce(
  source,
  '    "- notes.md"\n  ].join("\\n");',
  '    "- notes.md",\n    "- validation_report.json",\n    "- validation.json",\n    "- readback.json"\n  ].join("\\n");'
);

source = replaceOnce(
  source,
  "  writeText(NOTES_PATH, markdownNotes(summary));\n\n  console.log(JSON.stringify({\n",
  `  writeText(NOTES_PATH, markdownNotes(summary));

  const validationReport = validationReportForOutputs(existing);
  writeJson(VALIDATION_REPORT_PATH, validationReport);

  const validationAlias = {
    generated_at: summary.generated_at,
    validator: "Round405 validation.json: alias of validation_report.json plus output file inventory for downstream pack readers.",
    validation_report_path: path.relative(ROOT, VALIDATION_REPORT_PATH),
    checked_files: validationReport.checked_files,
    checks: validationReport.checks,
    errors: validationReport.errors,
    warnings: validationReport.warnings,
    passed: validationReport.passed
  };
  writeJson(VALIDATION_PATH, validationAlias);

  const readbackReport = readbackValidationReport(validationReport);
  writeJson(READBACK_PATH, readbackReport);

  if (!validationReport.passed || !readbackReport.passed) {
    throw new Error([
      "Validation failed:",
      ...validationReport.errors.slice(0, 80),
      ...readbackReport.errors.slice(0, 80)
    ].join("\\n"));
  }

  console.log(JSON.stringify({
`
);

const runner = new Function("require", "__dirname", "__filename", "process", "console", "fetch", source);
runner(require, __dirname, __filename, process, console, fetch);
