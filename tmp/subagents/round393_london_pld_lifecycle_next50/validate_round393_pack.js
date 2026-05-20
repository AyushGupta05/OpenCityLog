const fs = require("fs");
const path = require("path");

const OUT_DIR = __dirname;
const ROOT = path.resolve(OUT_DIR, "..", "..", "..");
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const TARGET_COUNT = 150;
const MAX_PRIOR_ROUND = 387;
const CURRENT_ROUND_NAME = "round393_london_pld_lifecycle_next50";
const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const LONDON_ENVELOPE = {
  minLon: -0.5103,
  maxLon: 0.334,
  minLat: 51.2868,
  maxLat: 51.6919
};
const REQUIRED_FILES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "notes.md",
  "rejected.json"
];
const REQUIRED_CANDIDATE_FIELDS = [
  "event_id",
  "candidate_id",
  "city_id",
  "title",
  "summary",
  "observed_change",
  "effective_date",
  "pld_id",
  "lpa_reference",
  "source_name",
  "publisher",
  "source_url",
  "row_url",
  "api_url",
  "api_endpoint",
  "api_query",
  "source_record_id",
  "source_type",
  "license",
  "license_or_terms_note",
  "attribution",
  "accessed_at",
  "source_date_field",
  "source_lifecycle_field",
  "source_lifecycle_date",
  "source_lifecycle_date_value",
  "raw_lifecycle_dates",
  "geometry",
  "geometry_source",
  "geometry_precision",
  "confidence",
  "limitations",
  "transformation_method"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function cleanText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePldId(value) {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(value || ""));
    } catch {
      return String(value || "");
    }
  })();
  return decoded
    .replace(/^PLD:/i, "")
    .replace(/^applications\/_source\//i, "")
    .replace(/^.*\/api-guest\/applications\/_source\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/\//g, "_")
    .trim()
    .toUpperCase();
}

function collectPldIdsFromText(value) {
  const text = String(value || "");
  const ids = [];
  for (const match of text.matchAll(/PLD:([^;\s]+)/gi)) ids.push(normalizePldId(match[1]));
  for (const match of text.matchAll(/applications\/_source\/([^?#\s"'<>]+)/gi)) {
    ids.push(normalizePldId(match[1]));
  }
  return ids.filter(Boolean);
}

function isoFromPldDate(value) {
  const text = cleanText(value);
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return "";
}

function dateFromRecord(record) {
  return record.effective_date || record.date || record.event_date || "";
}

function normalizeLifecycleField(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return "";
  if (text.includes("actual_completion_date")) return "actual_completion_date";
  if (text.includes("actual_commencement_date")) return "actual_commencement_date";
  if (text.includes("date_building_work_started_under_previous_permission")) {
    return "date_building_work_started_under_previous_permission";
  }
  if (text.includes("date_building_work_completed_under_previous_permission")) {
    return "date_building_work_completed_under_previous_permission";
  }
  return text.replace(/^pld\s+/, "").replace(/^planning london datahub\s+/, "").trim();
}

function sourceFieldDateKey(pldId, field, date) {
  const normalizedPldId = normalizePldId(pldId);
  const normalizedField = normalizeLifecycleField(field);
  const normalizedDate = isoFromPldDate(date) || dateFromRecord({ effective_date: date });
  if (!normalizedPldId || !normalizedField || !normalizedDate) return "";
  return `${normalizedPldId}|${normalizedField}|${normalizedDate}`;
}

function textForPldExtraction(record) {
  return [
    record.pld_id,
    record.source_record_id,
    record.source_url,
    record.row_url,
    record.url,
    record.title,
    record.summary,
    record.source_fields?.id,
    record.source_fields?.pld_id,
    record.source_fields?.source_record_id
  ]
    .flat()
    .filter(Boolean)
    .join(" ");
}

function recordsFrom(data) {
  return Array.isArray(data) ? data : data.candidates || data.events || [];
}

function packSortValue(name) {
  const match = name.match(/^round(\d+)_/);
  return match ? Number(match[1]) : 999999;
}

function addRecordKeys(index, record) {
  const date = dateFromRecord(record);
  const title = cleanText(record.title).toLowerCase();
  const field = normalizeLifecycleField(record.source_lifecycle_field || record.source_date_field);
  if (title && date) index.titleDateKeys.add(`london|${title}|${date}`);
  const ids = collectPldIdsFromText(textForPldExtraction(record));
  if (record.pld_id) ids.push(normalizePldId(record.pld_id));
  if (record.source_fields?.id) ids.push(normalizePldId(record.source_fields.id));
  if (record.source_fields?.pld_id) ids.push(normalizePldId(record.source_fields.pld_id));
  for (const id of ids.filter(Boolean)) {
    const key = sourceFieldDateKey(id, field, record.source_lifecycle_date || date);
    if (key) index.fieldDateKeys.add(key);
  }
}

function buildOverlapIndex() {
  const manualIndex = { fieldDateKeys: new Set(), titleDateKeys: new Set() };
  for (const record of recordsFrom(readJson(CORPUS_PATH))) addRecordKeys(manualIndex, record);

  const priorIndex = { fieldDateKeys: new Set(), titleDateKeys: new Set() };
  const priorPacks = [];
  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  for (const entry of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!/^round\d+_london_pld_lifecycle/.test(entry.name)) continue;
    if (entry.name === CURRENT_ROUND_NAME || packSortValue(entry.name) > MAX_PRIOR_ROUND) continue;
    const file = path.join(subagentsDir, entry.name, "candidates.json");
    if (!fs.existsSync(file)) continue;
    const rows = recordsFrom(readJson(file));
    for (const record of rows) addRecordKeys(priorIndex, record);
    priorPacks.push({ name: entry.name, candidates: rows.length });
  }

  priorPacks.sort((left, right) => packSortValue(left.name) - packSortValue(right.name) || left.name.localeCompare(right.name));
  return { manualIndex, priorIndex, priorPacks };
}

function inDateWindow(date) {
  return date >= START_DATE && date <= END_DATE;
}

function inLondon(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1])) &&
    Number(coordinates[0]) >= LONDON_ENVELOPE.minLon &&
    Number(coordinates[0]) <= LONDON_ENVELOPE.maxLon &&
    Number(coordinates[1]) >= LONDON_ENVELOPE.minLat &&
    Number(coordinates[1]) <= LONDON_ENVELOPE.maxLat
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validate() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(path.join(OUT_DIR, file)), `Missing required output file: ${file}`);
  }

  const pack = readJson(path.join(OUT_DIR, "candidates.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const sourceAudit = readJson(path.join(OUT_DIR, "source_audit.json"));
  const rejected = readJson(path.join(OUT_DIR, "rejected.json"));
  const notes = fs.readFileSync(path.join(OUT_DIR, "notes.md"), "utf8");
  const candidates = pack.candidates || [];
  const { manualIndex, priorIndex, priorPacks } = buildOverlapIndex();

  assert(pack.accessed_at === ACCESSED_AT, "Candidate pack accessed_at mismatch");
  assert(summary.accessed_at === ACCESSED_AT, "Summary accessed_at mismatch");
  assert(sourceAudit.accessed_at === ACCESSED_AT, "Source audit accessed_at mismatch");
  assert(rejected.accessed_at === ACCESSED_AT, "Rejected pack accessed_at mismatch");
  assert(candidates.length === TARGET_COUNT, `Expected ${TARGET_COUNT} candidates, got ${candidates.length}`);
  assert(pack.candidate_count === candidates.length, "Candidate count mismatch in candidates.json");
  assert(summary.candidate_count === candidates.length, "Candidate count mismatch in summary.json");
  assert(Array.isArray(sourceAudit.source_audits) && sourceAudit.source_audits.length >= 2, "Missing source audit entries");
  assert(/not specified/i.test(JSON.stringify(sourceAudit)), "Source audit does not preserve licence caveat");
  assert(/source-reported administrative/i.test(notes) && /separate source evidence/i.test(notes), "Notes missing lifecycle caveat");

  const eventIds = new Set();
  const candidateIds = new Set();
  const fieldDateKeys = new Set();
  const lifecycleMix = {};
  const dates = [];
  const acceptedFields = new Set(["actual_completion_date", "actual_commencement_date"]);

  for (const candidate of candidates) {
    for (const field of REQUIRED_CANDIDATE_FIELDS) {
      const value = candidate[field];
      assert(value !== undefined && value !== null && !(Array.isArray(value) && !value.length) && value !== "", `Missing ${field} on ${candidate.candidate_id || candidate.title}`);
    }
    assert(candidate.city_id === "london", `Unexpected city_id on ${candidate.candidate_id}`);
    assert(candidate.accessed_at === ACCESSED_AT, `accessed_at mismatch on ${candidate.candidate_id}`);
    assert(acceptedFields.has(candidate.source_date_field), `Unexpected source_date_field on ${candidate.candidate_id}`);
    assert(candidate.source_date_field === candidate.source_lifecycle_field, `source_date_field/source_lifecycle_field mismatch on ${candidate.candidate_id}`);
    assert(candidate.source_lifecycle_date === candidate.effective_date, `Lifecycle date mismatch on ${candidate.candidate_id}`);
    assert(inDateWindow(candidate.effective_date), `Date outside requested window on ${candidate.candidate_id}`);
    assert(candidate.geometry?.type === "Point" && inLondon(candidate.geometry.coordinates), `Geometry outside London bounds on ${candidate.candidate_id}`);
    assert(/^https:\/\/planningdata\.london\.gov\.uk\/api-guest\/applications\/_source\//.test(candidate.source_url), `Unexpected source_url on ${candidate.candidate_id}`);
    assert(candidate.row_url === candidate.source_url, `row_url/source_url mismatch on ${candidate.candidate_id}`);
    assert(candidate.api_url === "https://planningdata.london.gov.uk/api-guest/applications/_search", `Unexpected api_url on ${candidate.candidate_id}`);
    assert(candidate.publisher.includes("Greater London Authority"), `Publisher missing GLA attribution on ${candidate.candidate_id}`);
    assert(candidate.confidence === "documented", `Unexpected confidence on ${candidate.candidate_id}`);
    const caveatText = [
      candidate.observed_change,
      candidate.summary,
      candidate.limitations.join(" "),
      candidate.transformation_method
    ].join(" ").toLowerCase();
    assert(caveatText.includes("source-reported administrative"), `Missing source-reported caveat on ${candidate.candidate_id}`);
    assert(caveatText.includes("administrative planning feed record only") || caveatText.includes("administrative record only"), `Missing administrative-only lifecycle caveat on ${candidate.candidate_id}`);
    assert(!/\b(proof|proved|proves|predict\w*|forecast\w*|simulation\w*|causal|causation)\b|impact score/i.test([candidate.title, candidate.summary, candidate.observed_change, candidate.limitations.join(" "), candidate.transformation_method].join(" ")), `Restricted lifecycle wording on ${candidate.candidate_id}`);

    const fieldKey = sourceFieldDateKey(candidate.pld_id, candidate.source_date_field, candidate.effective_date);
    const titleDateKey = `london|${cleanText(candidate.title).toLowerCase()}|${candidate.effective_date}`;
    assert(!manualIndex.fieldDateKeys.has(fieldKey), `Overlap with manual corpus source-date key: ${fieldKey}`);
    assert(!priorIndex.fieldDateKeys.has(fieldKey), `Overlap with prior PLD lifecycle source-date key: ${fieldKey}`);
    assert(!manualIndex.titleDateKeys.has(titleDateKey), `Overlap with manual corpus title/date key: ${titleDateKey}`);
    assert(!priorIndex.titleDateKeys.has(titleDateKey), `Overlap with prior PLD lifecycle title/date key: ${titleDateKey}`);
    assert(!fieldDateKeys.has(fieldKey), `Duplicate source-date key inside round393: ${fieldKey}`);
    assert(!eventIds.has(candidate.event_id), `Duplicate event_id: ${candidate.event_id}`);
    assert(!candidateIds.has(candidate.candidate_id), `Duplicate candidate_id: ${candidate.candidate_id}`);
    fieldDateKeys.add(fieldKey);
    eventIds.add(candidate.event_id);
    candidateIds.add(candidate.candidate_id);
    lifecycleMix[candidate.source_date_field] = (lifecycleMix[candidate.source_date_field] || 0) + 1;
    dates.push(candidate.effective_date);
  }

  const sortedDates = [...dates].sort();
  const report = {
    ok: true,
    validated_at: "2026-05-20T00:00:00Z",
    candidate_count: candidates.length,
    date_range: {
      min: sortedDates[0],
      max: sortedDates[sortedDates.length - 1]
    },
    lifecycle_field_mix: lifecycleMix,
    unique_event_ids: eventIds.size,
    unique_source_date_keys: fieldDateKeys.size,
    manual_field_date_keys_scanned: manualIndex.fieldDateKeys.size,
    prior_field_date_keys_scanned: priorIndex.fieldDateKeys.size,
    prior_packs_scanned: priorPacks,
    checks: [
      "required output files",
      "required provenance fields",
      "accessed_at fixed to 2026-05-20",
      "literal source_date_field lifecycle names",
      "date window",
      "London coordinate bounds",
      "unique event ids and source-date keys",
      "no overlap with manual corpus",
      "no overlap with PLD lifecycle packs through round387",
      "source/row/API URLs",
      "licence and lifecycle caveats",
      "administrative-only wording in title and observed_change"
    ]
  };

  fs.writeFileSync(path.join(OUT_DIR, "validation_report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

validate();

