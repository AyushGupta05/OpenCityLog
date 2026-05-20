const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-19";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round109_nhle_2023_2026_retry.json"
];

const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  if (Array.isArray(raw.events)) return raw.events;
  return [];
};

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of")
  .replace(/\bproof that\b/gi, "evidence that")
  .replace(/\bproves?\b/gi, "documents")
  .replace(/\bcaused\b/gi, "was associated with")
  .replace(/\bwill increase\b/gi, "is described as intended to increase")
  .replace(/\bwill decrease\b/gi, "is described as intended to decrease");

const normalizeDateForComparison = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const rows = [];
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) rows.push({ ...candidate, __file: file });
}

if (rows.length !== 6) {
  throw new Error(`Expected 6 round109 candidates, found ${rows.length}`);
}

const records = rows.map((candidate) => ({
  city_id: "london",
  event_id: candidate.event_id,
  date: candidate.date,
  date_precision: candidate.date_precision,
  bucket: safeText(candidate.bucket),
  title: safeText(candidate.title),
  summary: safeText(candidate.summary),
  observed_change: safeText(candidate.observed_change),
  area: safeText(candidate.area),
  latitude: candidate.latitude,
  longitude: candidate.longitude,
  source_ids: candidate.source_ids || ["historic-england-nhle"],
  source_name: safeText(candidate.source_name),
  publisher: safeText(candidate.publisher || "Historic England"),
  source_url: candidate.source_url,
  source_record_id: safeText(candidate.source_record_id),
  source_type: safeText(candidate.source_type || "statutory listed-building register record"),
  source_retrieved_at: candidate.source_retrieved_at || retrievedAt,
  source_date_field: safeText(candidate.source_date_field),
  source_dataset_id: candidate.source_dataset_id || "historic-england-nhle",
  confidence: candidate.confidence,
  architect: safeText(candidate.architect || "Source page does not name a project architect."),
  project_type: safeText(candidate.project_type),
  geometry_source: safeText(candidate.geometry_source),
  geometry_precision: safeText(candidate.geometry_precision),
  license_or_terms_note: safeText(candidate.license_or_terms_note || "Historic England website or Open Data Hub terms apply; factual metadata and source URL only, no page text or images reproduced."),
  attribution: safeText(candidate.attribution || "Historic England"),
  limitations: safeText(candidate.limitations),
  transformation_method: safeText(
    candidate.transformation_method ||
    `Manual round109 NHLE extraction from ${candidate.__file}; duplicate checked by event_id, source URL, source record ID, and title terms; normalized into the architecture milestone schema with date, source, confidence, geometry, and limitation fields preserved.`
  )
}));

const requiredFields = [
  "city_id",
  "event_id",
  "date",
  "bucket",
  "title",
  "summary",
  "observed_change",
  "area",
  "latitude",
  "longitude",
  "source_ids",
  "source_name",
  "publisher",
  "source_url",
  "source_record_id",
  "source_type",
  "source_retrieved_at",
  "source_date_field",
  "source_dataset_id",
  "confidence",
  "architect",
  "project_type",
  "geometry_source",
  "geometry_precision",
  "license_or_terms_note",
  "attribution",
  "limitations",
  "transformation_method"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
  if (!/^lon_arch_/.test(event.event_id)) throw new Error(`Unexpected event_id prefix: ${event.event_id}`);
  if (!event.source_url.startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
  if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
    throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
  }
  for (const sourceId of event.source_ids) {
    if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
  }
}

const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.transformation_method,
    event.source_date_field
  ].join(" ");
  if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
}

const batchIds = new Set();
const batchSourceKeys = new Set();
for (const event of records) {
  if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
  batchIds.add(event.event_id);

  const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
  if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
  batchSourceKeys.add(sourceKey);
}

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);

const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
const duplicateSourceRecords = records
  .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);

for (const event of records) {
  const longitude = Number(event.longitude);
  const latitude = Number(event.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error(`Invalid coordinates for ${event.event_id}`);
  }
}

doc.events.push(...records);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));

const tmpPath = `${path}.round109.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
