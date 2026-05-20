const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROUND_NAME = "round444_london_pld_lifecycle_next61";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const BASE_ROUND404_SCRIPT = path.join(
  ROOT,
  "scripts",
  "fetch_round404_london_pld_lifecycle_next52_candidates.js"
);

const LANGUAGE_CHECK_FILES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "notes.md",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "strict_duplicate_audit.json",
  "readback.json"
];

const RESTRICTED_OUTPUT_LANGUAGE =
  /\b(proof|proved|proves|predict\w*|forecast\w*|simulation\w*|causal|causation)\b|impact score/i;

const PRIOR_PROSE_AFTER_272 =
  "round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, round362, round365, round369, round373, round377, round380, round384, round387, round393, round398, round404, round410, round416, round421, round425, round428, round432, round436, and round439";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function replaceRequired(value, needle, replacement, label) {
  if (!value.includes(needle)) {
    const crlfNeedle = needle.replace(/\n/g, "\r\n");
    if (value.includes(crlfNeedle)) {
      return value.split(crlfNeedle).join(replacement.replace(/\n/g, "\r\n"));
    }
    throw new Error(`Round444 source transform could not find ${label}: ${needle}`);
  }
  return value.split(needle).join(replacement);
}

function assertContains(value, needle, label) {
  if (!value.includes(needle)) {
    throw new Error(`Round444 source transform failed to include ${label}: ${needle}`);
  }
}

function tightenBareSourceDuplicateMatching(source) {
  let transformed = source;

  transformed = replaceRequired(
    transformed,
    [
      "    sourceKeys: new Set(),",
      "    titleDateKeys: new Set(),"
    ].join("\n"),
    [
      "    sourceKeys: new Set(),",
      "    sourceUrlKeys: new Set(),",
      "    sourceRecordIdKeys: new Set(),",
      "    titleDateKeys: new Set(),"
    ].join("\n"),
    "bare source duplicate index sets"
  );

  transformed = replaceRequired(
    transformed,
    [
      "  if (record.source_url || record.source_record_id) {",
      "    index.sourceKeys.add(",
      '      `london|${record.source_url || ""}|${record.source_record_id || ""}|${field}|${',
      "        record.source_lifecycle_date || date",
      "      }`.toLowerCase()",
      "    );",
      "  }"
    ].join("\n"),
    [
      "  const bareSourceUrl = cleanText(record.source_url || record.row_url || record.url).toLowerCase();",
      "  const bareSourceRecordId = cleanText(record.source_record_id).toLowerCase();",
      "  if (bareSourceUrl) index.sourceUrlKeys.add(bareSourceUrl);",
      "  if (bareSourceRecordId) index.sourceRecordIdKeys.add(bareSourceRecordId);",
      "",
      "  if (record.source_url || record.source_record_id) {",
      "    index.sourceKeys.add(",
      '      `london|${record.source_url || ""}|${record.source_record_id || ""}|${field}|${',
      "        record.source_lifecycle_date || date",
      "      }`.toLowerCase()",
      "    );",
      "  }"
    ].join("\n"),
    "bare source duplicate key collection"
  );

  transformed = replaceRequired(
    transformed,
    [
      "  const sourceKey = `london|${sourceUrl}|${sourceRecordId}|${normalizeLifecycleField(spec.field)}|${date}`.toLowerCase();",
      "  const lowValueAdminText = `${row.application_type_full || \"\"} ${row.description || \"\"}`;"
    ].join("\n"),
    [
      "  const sourceKey = `london|${sourceUrl}|${sourceRecordId}|${normalizeLifecycleField(spec.field)}|${date}`.toLowerCase();",
      "  const sourceUrlKey = sourceUrl.toLowerCase();",
      "  const sourceRecordIdKey = sourceRecordId.toLowerCase();",
      "  const lowValueAdminText = `${row.application_type_full || \"\"} ${row.description || \"\"}`;"
    ].join("\n"),
    "bare source duplicate keys in rejectionReason"
  );

  transformed = replaceRequired(
    transformed,
    [
      '  if (duplicateIndex.priorFieldKeys.has(fieldKey)) return "existing_prior_field_date_key";',
      '  if (duplicateIndex.sourceKeys.has(sourceKey)) return "existing_source_url_record_key";'
    ].join("\n"),
    [
      '  if (duplicateIndex.priorFieldKeys.has(fieldKey)) return "existing_prior_field_date_key";',
      '  if (duplicateIndex.sourceUrlKeys.has(sourceUrlKey)) return "existing_source_url_key";',
      '  if (duplicateIndex.sourceRecordIdKeys.has(sourceRecordIdKey)) return "existing_source_record_id_key";',
      '  if (duplicateIndex.sourceKeys.has(sourceKey)) return "existing_source_url_record_key";'
    ].join("\n"),
    "bare source duplicate rejection checks"
  );

  transformed = replaceRequired(
    transformed,
    '  if (batchKeys.has(fieldKey)) return "duplicate_row_date_field_inside_round444_batch";',
    [
      '  if (batchKeys.has(fieldKey)) return "duplicate_row_date_field_inside_round444_batch";',
      '  if (batchKeys.has(`source_url|${sourceUrlKey}`)) return "duplicate_source_url_inside_round444_batch";',
      '  if (batchKeys.has(`source_record_id|${sourceRecordIdKey}`)) return "duplicate_source_record_id_inside_round444_batch";',
      '  if (batchKeys.has(`title_date|${titleDate}`)) return "duplicate_title_date_inside_round444_batch";'
    ].join("\n"),
    "bare source duplicate batch rejection checks"
  );

  transformed = replaceRequired(
    transformed,
    [
      "      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));",
      "      selected.push(candidateFor(item));"
    ].join("\n"),
    [
      "      const selectedSourceUrl = pldSourceUrl(cleanText(item.row.id)).toLowerCase();",
      '      const selectedSourceRecordId = `PLD:${cleanText(item.row.id)}; LPA:${',
      '        cleanText(item.row.lpa_app_no) || "not supplied"',
      "      }`.toLowerCase();",
      "      const selectedTitleDate = `london|${cleanText(",
      "        `PLD ${item.spec.titleLabel} recorded for ${addressFor(item.row)}`",
      "      ).toLowerCase()}|${item.date}`;",
      "      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));",
      "      batchKeys.add(`source_url|${selectedSourceUrl}`);",
      "      batchKeys.add(`source_record_id|${selectedSourceRecordId}`);",
      "      batchKeys.add(`title_date|${selectedTitleDate}`);",
      "      selected.push(candidateFor(item));"
    ].join("\n"),
    "bare source duplicate batch key insertion"
  );

  transformed = replaceRequired(
    transformed,
    [
      "    const sourceKey = `${candidate.source_url}|${candidate.source_record_id}|${candidate.source_lifecycle_field}|${candidate.effective_date}`;",
      "    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source key: ${sourceKey}`);",
      "    sourceKeys.add(sourceKey);"
    ].join("\n"),
    [
      "    const bareSourceUrl = cleanText(candidate.source_url || candidate.row_url || candidate.url).toLowerCase();",
      "    const bareSourceRecordId = cleanText(candidate.source_record_id).toLowerCase();",
      "    if (bareSourceUrl && duplicateIndex.sourceUrlKeys.has(bareSourceUrl)) {",
      "      throw new Error(`Candidate duplicates prior/manual source_url: ${candidate.candidate_id}`);",
      "    }",
      "    if (bareSourceRecordId && duplicateIndex.sourceRecordIdKeys.has(bareSourceRecordId)) {",
      "      throw new Error(`Candidate duplicates prior/manual source_record_id: ${candidate.candidate_id}`);",
      "    }",
      "    if (bareSourceUrl && sourceKeys.has(`source_url|${bareSourceUrl}`)) {",
      "      throw new Error(`Duplicate source_url inside batch: ${candidate.candidate_id}`);",
      "    }",
      "    if (bareSourceRecordId && sourceKeys.has(`source_record_id|${bareSourceRecordId}`)) {",
      "      throw new Error(`Duplicate source_record_id inside batch: ${candidate.candidate_id}`);",
      "    }",
      "    if (bareSourceUrl) sourceKeys.add(`source_url|${bareSourceUrl}`);",
      "    if (bareSourceRecordId) sourceKeys.add(`source_record_id|${bareSourceRecordId}`);",
      "    const sourceKey = `${candidate.source_url}|${candidate.source_record_id}|${candidate.source_lifecycle_field}|${candidate.effective_date}`;",
      "    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source key: ${sourceKey}`);",
      "    sourceKeys.add(sourceKey);"
    ].join("\n"),
    "bare source duplicate validation checks"
  );

  transformed = transformed
    .replace(
      /source-record\/source-url\/date-field\/date keys, source-date-field\/date keys, and title\/date keys/g,
      "source URL/source record ids, source-record/source-url/date-field/date keys, source-date-field/date keys, and title/date keys"
    )
    .replace(
      /by PLD row id, source-date-field\/date, source URL\/source_record\/date-field\/date, and title\/date\./g,
      "by PLD row id, bare source URL/source_record id, source-date-field/date, source URL/source_record/date-field/date, and title/date."
    )
    .replace(
      /removed exact source row\/date-field\/date duplicates/g,
      "removed exact source row, source URL/source record, and date-field/date duplicates"
    );

  assertContains(transformed, "sourceUrlKeys", "bare source URL duplicate index");
  assertContains(transformed, "sourceRecordIdKeys", "bare source record duplicate index");
  assertContains(transformed, "existing_source_url_key", "bare source URL rejection reason");
  assertContains(transformed, "existing_source_record_id_key", "bare source record rejection reason");
  return transformed;
}

function transformRound404Source(source) {
  let transformed = source;

  transformed = replaceRequired(
    transformed,
    'const ROUND_NAME = "round404_london_pld_lifecycle_next52";',
    'const ROUND_NAME = "round444_london_pld_lifecycle_next61";',
    "outer round name"
  );

  transformed = transformed
    .replace(/round404_london_pld_lifecycle_next52/g, "round444_london_pld_lifecycle_next61")
    .replace(/round404\.london_pld_lifecycle_next52/g, "round444.london_pld_lifecycle_next61")
    .replace(/Bims5Round404PldLifecycleNext52/g, "Bims5Round444PldLifecycleNext61")
    .replace(/Round 404/g, "Round 444")
    .replace(/Round404/g, "Round444")
    .replace(/round404/g, "round444")
    .replace(/next52/g, "next61")
    .replace(/MAX_PRIOR_ROUND = 398/g, "MAX_PRIOR_ROUND = 439")
    .replace(/through round398/g, "through round439");

  transformed = replaceRequired(
    transformed,
    '  "round398_london_pld_lifecycle_next51"\n];',
    '  "round398_london_pld_lifecycle_next51",\n  "round404_london_pld_lifecycle_next52",\n  "round410_london_pld_lifecycle_next53",\n  "round416_london_pld_lifecycle_next54",\n  "round421_london_pld_lifecycle_next55",\n  "round425_london_pld_lifecycle_next56",\n  "round428_london_pld_lifecycle_next57",\n  "round432_london_pld_lifecycle_next58",\n  "round436_london_pld_lifecycle_next59",\n  "round439_london_pld_lifecycle_next60"\n];',
    "round404 through round439 prior PLD lifecycle packs"
  );

  transformed = transformed.replace(
    /const PRIOR_PROSE_AFTER_272 =\s+"[^"]+";/s,
    `const PRIOR_PROSE_AFTER_272 =\n  "${PRIOR_PROSE_AFTER_272}";`
  );

  transformed = replaceRequired(
    transformed,
    "\nfunction transformRound284Fetch(source) {",
    `\n${tightenBareSourceDuplicateMatching.toString()}\n\nfunction transformRound284Fetch(source) {`,
    "bare source duplicate transform helper"
  );

  transformed = replaceRequired(
    transformed,
    "  transformed = tightenLifecycleLanguage(transformed);\n  transformed = transformed.replace(",
    "  transformed = tightenLifecycleLanguage(transformed);\n  transformed = tightenBareSourceDuplicateMatching(transformed);\n  transformed = transformed.replace(",
    "bare source duplicate transform call"
  );

  transformed = replaceRequired(
    transformed,
    '.replace(/round276/g, "round398");',
    '.replace(/round276/g, "round439");',
    "validator prior cutoff replacement"
  );

  transformed = transformed.replace(
    /main\(\)\.catch\(\(error\) => \{\s+console\.error\(error\);\s+process\.exit\(1\);\s+\}\);\s*$/,
    "module.exports = main;\n"
  );

  assertContains(transformed, 'const ROUND_NAME = "round444_london_pld_lifecycle_next61";', "round name");
  assertContains(transformed, 'const ROUND = "round444";', "transformed fetch round id");
  assertContains(transformed, "MAX_PRIOR_ROUND = 439", "prior cutoff");
  assertContains(transformed, "through round439", "dedupe cutoff text");
  assertContains(transformed, "round404_london_pld_lifecycle_next52", "round404 prior pack");
  assertContains(transformed, "round410_london_pld_lifecycle_next53", "round410 prior pack");
  assertContains(transformed, "round416_london_pld_lifecycle_next54", "round416 prior pack");
  assertContains(transformed, "round421_london_pld_lifecycle_next55", "round421 prior pack");
  assertContains(transformed, "round425_london_pld_lifecycle_next56", "round425 prior pack");
  assertContains(transformed, "round428_london_pld_lifecycle_next57", "round428 prior pack");
  assertContains(transformed, "round432_london_pld_lifecycle_next58", "round432 prior pack");
  assertContains(transformed, "round436_london_pld_lifecycle_next59", "round436 prior pack");
  assertContains(transformed, "round439_london_pld_lifecycle_next60", "round439 prior pack");
  assertContains(transformed, "tightenBareSourceDuplicateMatching", "bare source duplicate transform");
  assertContains(transformed, 'CURRENT_ROUND_NAME = "round444_london_pld_lifecycle_next61"', "validator round name");
  assertContains(transformed, "module.exports = main;", "exported main");

  return transformed;
}

async function runTransformedRound404() {
  const source = fs.readFileSync(BASE_ROUND404_SCRIPT, "utf8");
  const transformed = transformRound404Source(source);
  const sandboxModule = { exports: {} };
  const sandbox = {
    require,
    console,
    process,
    fetch,
    __dirname,
    module: sandboxModule,
    exports: sandboxModule.exports
  };

  vm.runInNewContext(transformed, sandbox, {
    filename: "generated_round444_london_pld_lifecycle_next61_candidates.js"
  });

  if (typeof sandboxModule.exports !== "function") {
    throw new Error("Round444 transform did not export the fetch main() function.");
  }

  await sandboxModule.exports();
}

function lifecycleMilestoneLabel(field) {
  if (field === "actual_completion_date") return "PLD source-reported actual completion date";
  if (field === "actual_commencement_date") return "PLD source-reported actual commencement date";
  return `PLD source-reported ${field || "lifecycle"} date`;
}

function addRound444RequestedAliases() {
  const file = path.join(OUT_DIR, "candidates.json");
  const pack = readJson(file);
  pack.candidates = (pack.candidates || []).map((candidate) => ({
    ...candidate,
    id: candidate.id || candidate.event_id,
    planning_reference: candidate.planning_reference || candidate.lpa_reference || "not supplied by PLD row",
    status:
      candidate.status ||
      candidate.planning_status ||
      candidate.source_fields?.status ||
      "not supplied by PLD row",
    decision: candidate.decision || candidate.source_fields?.decision || "not supplied by PLD row",
    lifecycle_milestone:
      candidate.lifecycle_milestone || lifecycleMilestoneLabel(candidate.source_lifecycle_field),
    lifecycle_milestone_date:
      candidate.lifecycle_milestone_date || candidate.source_lifecycle_date || candidate.effective_date,
    geometry_ref: candidate.geometry_ref || candidate.geometry_source,
    method: candidate.method || candidate.transformation_method
  }));
  writeJson(file, pack);
}

function cleanText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dateFromRecord(record) {
  return record.effective_date || record.date || record.event_date || "";
}

function loadRows(file) {
  if (!fs.existsSync(file)) return [];
  const data = readJson(file);
  return Array.isArray(data) ? data : data.candidates || data.events || [];
}

function packRound(name) {
  const match = name.match(/^round(\d+)_/);
  return match ? Number(match[1]) : 999999;
}

function addStrictDuplicateKeys(index, record) {
  const eventId = cleanText(record.event_id || record.id);
  const sourceUrl = cleanText(record.source_url || record.row_url || record.url).toLowerCase();
  const sourceRecordId = cleanText(record.source_record_id).toLowerCase();
  const title = cleanText(record.title).toLowerCase();
  const date = dateFromRecord(record);
  if (eventId) index.eventIds.add(eventId);
  if (sourceUrl) index.sourceUrls.add(sourceUrl);
  if (sourceRecordId) index.sourceRecordIds.add(sourceRecordId);
  if (title && date) index.titleDates.add(`${title}|${date}`);
}

function buildStrictDuplicateIndex() {
  const index = {
    eventIds: new Set(),
    sourceUrls: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set(),
    manual_rows_scanned: 0,
    prior_packs_scanned: [],
    prior_rows_scanned: 0
  };

  const corpusFile = path.join(
    ROOT,
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  );
  const manualRows = loadRows(corpusFile);
  index.manual_rows_scanned = manualRows.length;
  for (const row of manualRows) addStrictDuplicateKeys(index, row);

  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  if (fs.existsSync(subagentsDir)) {
    for (const entry of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!/^round\d+_london_pld_lifecycle/.test(entry.name)) continue;
      if (entry.name === ROUND_NAME || packRound(entry.name) > 439) continue;
      const file = path.join(subagentsDir, entry.name, "candidates.json");
      const rows = loadRows(file);
      index.prior_packs_scanned.push({ name: entry.name, rows: rows.length });
      index.prior_rows_scanned += rows.length;
      for (const row of rows) addStrictDuplicateKeys(index, row);
    }
  }

  return index;
}

function writeStrictDuplicateAuditAndAugmentReports() {
  const candidatesFile = path.join(OUT_DIR, "candidates.json");
  const candidatesPack = readJson(candidatesFile);
  const candidates = candidatesPack.candidates || [];
  const index = buildStrictDuplicateIndex();
  const duplicates = [];
  const batch = {
    eventIds: new Set(),
    sourceUrls: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set()
  };

  for (const candidate of candidates) {
    const eventId = cleanText(candidate.event_id || candidate.id);
    const sourceUrl = cleanText(candidate.source_url || candidate.row_url || candidate.url).toLowerCase();
    const sourceRecordId = cleanText(candidate.source_record_id).toLowerCase();
    const titleDate =
      cleanText(candidate.title) && dateFromRecord(candidate)
        ? `${cleanText(candidate.title).toLowerCase()}|${dateFromRecord(candidate)}`
        : "";
    const checks = [
      ["event_id", eventId, index.eventIds, batch.eventIds],
      ["source_url", sourceUrl, index.sourceUrls, batch.sourceUrls],
      ["source_record_id", sourceRecordId, index.sourceRecordIds, batch.sourceRecordIds],
      ["title_date", titleDate, index.titleDates, batch.titleDates]
    ];

    for (const [kind, key, priorSet, batchSet] of checks) {
      if (!key) continue;
      if (priorSet.has(key)) duplicates.push({ kind, key, candidate_id: candidate.candidate_id });
      if (batchSet.has(key)) duplicates.push({ kind: `batch_${kind}`, key, candidate_id: candidate.candidate_id });
      batchSet.add(key);
    }
  }

  const report = {
    ok: duplicates.length === 0,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validation_type: "round444_strict_duplicate_audit",
    candidate_count: candidates.length,
    duplicate_count: duplicates.length,
    duplicate_sample: duplicates.slice(0, 25),
    manual_rows_scanned: index.manual_rows_scanned,
    prior_pack_count_scanned: index.prior_packs_scanned.length,
    prior_rows_scanned: index.prior_rows_scanned,
    keys_checked: [
      "event_id/id",
      "source_url/row_url/url",
      "source_record_id",
      "title plus effective/date/event_date"
    ]
  };
  writeJson(path.join(OUT_DIR, "strict_duplicate_audit.json"), report);

  if (!report.ok) {
    throw new Error(`Round444 strict duplicate audit failed with ${report.duplicate_count} duplicate keys.`);
  }

  const validationReportFile = path.join(OUT_DIR, "validation_report.json");
  const validationReport = readJson(validationReportFile);
  validationReport.strict_duplicate_audit = {
    ok: true,
    file: "strict_duplicate_audit.json",
    manual_rows_scanned: report.manual_rows_scanned,
    prior_pack_count_scanned: report.prior_pack_count_scanned,
    prior_rows_scanned: report.prior_rows_scanned
  };
  validationReport.checks = [
    ...new Set([
      ...(validationReport.checks || []),
      "no overlap by event id, bare source_url/source_record_id, or title/date"
    ])
  ];
  writeJson(validationReportFile, validationReport);

  const validationFile = path.join(OUT_DIR, "validation.json");
  const validation = readJson(validationFile);
  validation.strict_duplicate_audit_ok = true;
  validation.strict_duplicate_audit_file = "strict_duplicate_audit.json";
  validation.checks = [
    ...new Set([
      ...(validation.checks || []),
      "no overlap by event id, bare source_url/source_record_id, or title/date"
    ])
  ];
  writeJson(validationFile, validation);
}

function fileStatuses() {
  return Object.fromEntries(
    LANGUAGE_CHECK_FILES.map((name) => {
      const file = path.join(OUT_DIR, name);
      return [
        name,
        {
          exists: fs.existsSync(file),
          bytes: fs.existsSync(file) ? fs.statSync(file).size : 0
        }
      ];
    })
  );
}

function validateAndRewriteReadbackJson() {
  const candidatesPack = readJson(path.join(OUT_DIR, "candidates.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const rejected = readJson(path.join(OUT_DIR, "rejected.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const validationReport = readJson(path.join(OUT_DIR, "validation_report.json"));
  const notes = fs.readFileSync(path.join(OUT_DIR, "notes.md"), "utf8");
  const readbackFile = path.join(OUT_DIR, "readback.json");
  const existingReadback = readJson(readbackFile);
  const candidates = candidatesPack.candidates || [];
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  const sourceIds = [
    ...new Set(
      candidates
        .flatMap((candidate) => candidate.source_ids || [candidate.source_id])
        .concat((sourceAudit.source_audits || []).map((audit) => audit.source_id))
        .filter(Boolean)
    )
  ].sort();
  const files = fileStatuses();
  const ok =
    candidates.length === summary.candidate_count &&
    candidates.length === validation.candidate_count &&
    candidates.length === validationReport.candidate_count &&
    candidates.length === candidatesPack.candidate_count &&
    validation.ok === true &&
    validationReport.ok === true &&
    validationReport.strict_duplicate_audit?.ok === true &&
    validation.strict_duplicate_audit_ok === true &&
    files["readback.json"].exists === true &&
    files["strict_duplicate_audit.json"].exists === true &&
    sourceIds.includes("gla-planning-datahub-applications") &&
    sourceIds.includes("london-planning-datahub-api/core") &&
    /source-reported administrative/i.test(notes) &&
    candidates.every(
      (candidate) =>
        candidate.id &&
        candidate.method &&
        candidate.planning_reference &&
        candidate.status &&
        candidate.decision &&
        candidate.lifecycle_milestone &&
        candidate.lifecycle_milestone_date
    ) &&
    /through round439/i.test(summary.dedupe_basis || "") &&
    (summary.duplicate_index?.prior_packs || []).some(
      (pack) => pack.label === "round439_london_pld_lifecycle_next60" && pack.exists === true
    );

  if (!ok) {
    throw new Error("Readback validation failed for Round444 output pack.");
  }

  writeJson(readbackFile, {
    ...existingReadback,
    ok: true,
    read_at: GENERATED_AT,
    task: ROUND_NAME,
    files,
    candidate_count: candidates.length,
    date_range: {
      min: dates[0] || null,
      max: dates[dates.length - 1] || null
    },
    source_ids: sourceIds,
    source_audit_count: (sourceAudit.source_audits || []).length,
    rejection_count: rejected.rejection_count,
    validation_ok: validation.ok,
    validation_report_ok: validationReport.ok,
    lifecycle_field_mix: validation.lifecycle_field_mix,
    selected_by_borough: summary.selected_by_borough,
    dedupe_basis: summary.dedupe_basis,
    caveats: summary.caveats,
    readback_checks: [
      "all requested output files parsed",
      "candidate counts agree across candidates, summary, validation, and validation_report",
      "source audit includes PLD dataset and API source ids",
      "notes retain administrative lifecycle caveat",
      "candidate aliases include id, method, planning_reference, status, decision, and lifecycle_milestone",
      "dedupe basis includes PLD lifecycle packs through round439",
      "round439 prior PLD lifecycle pack was scanned",
      "strict duplicate audit found no event id, source_url/source_record_id, or title/date overlap",
      "readback file exists after final write"
    ]
  });

  const finalReadback = readJson(readbackFile);
  if (!finalReadback.ok || !finalReadback.files?.["readback.json"]?.exists) {
    throw new Error("Final readback self-check failed for Round444 output pack.");
  }
}

function assertGeneratedOutputLanguage() {
  for (const name of LANGUAGE_CHECK_FILES) {
    const file = path.join(OUT_DIR, name);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing expected output file for language check: ${path.relative(ROOT, file)}`);
    }
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(RESTRICTED_OUTPUT_LANGUAGE);
    if (match) {
      throw new Error(`Restricted lifecycle wording in ${path.relative(ROOT, file)}: ${match[0]}`);
    }
  }
}

async function main() {
  await runTransformedRound404();
  addRound444RequestedAliases();
  writeStrictDuplicateAuditAndAugmentReports();
  validateAndRewriteReadbackJson();
  assertGeneratedOutputLanguage();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
