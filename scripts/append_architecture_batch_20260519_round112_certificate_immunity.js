const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidateFile = "tmp/subagents/london_arch_candidates_round112_certificate_immunity.json";
const retrievedAt = "2026-05-19";
const sourceId = "planning-data-certificate-of-immunity";

const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const raw = JSON.parse(fs.readFileSync(candidateFile, "utf8"));
const candidates = Array.isArray(raw) ? raw : (raw.candidates || raw.records || raw.events || []);

if (candidates.length !== 109) {
  throw new Error(`Expected 109 London certificate-of-immunity candidates, found ${candidates.length}`);
}

const sourceEntry = {
  source_id: sourceId,
  city_ids: ["london"],
  title: "Planning Data certificate of immunity records",
  publisher: "Ministry of Housing, Communities and Local Government / Historic England",
  bucket: "planning/development/architecture/heritage",
  access_url: "https://www.planning.data.gov.uk/dataset/certificate-of-immunity",
  licence: "Open Government Licence v3.0; attribution to Historic England and Ordnance Survey where applicable.",
  licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
  coverage_years: { start: 2008, end: 2026 },
  time_coverage: "Selected rows with certificate start-date between 2020 and 2026.",
  spatial_granularity: "Planning Data entity point and polygon geometry; manual event stores a source point.",
  temporal_granularity: "start-date, end-date, and entry-date fields on each entity row.",
  update_frequency: "Planning Data source page says the collector last ran on 18 May 2026 and new data was last found on 12 May 2026.",
  retrieved_at: retrievedAt,
  limitations: "Certificate-of-immunity rows document a legal/planning heritage status period, not construction, alteration, opening, demolition, building condition, listing, or outcome effects. The manual London extract filters national rows to the atlas city envelope and excludes known outside-Greater-London false positives."
};

const existingSourceIndex = doc.sources.findIndex((source) => source.source_id === sourceId);
if (existingSourceIndex >= 0) {
  doc.sources[existingSourceIndex] = { ...doc.sources[existingSourceIndex], ...sourceEntry };
} else {
  doc.sources.push(sourceEntry);
}

const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));

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

const records = candidates.map((candidate) => ({
  city_id: "london",
  event_id: candidate.event_id,
  date: candidate.date,
  date_precision: candidate.date_precision || "day",
  bucket: safeText(candidate.category || "architecture/heritage/certificate_of_immunity"),
  title: safeText(candidate.title),
  summary: safeText(candidate.summary),
  observed_change: safeText(candidate.observed_change),
  area: safeText(candidate.location_name || "London"),
  latitude: candidate.lat,
  longitude: candidate.lon,
  source_ids: candidate.source_ids || [sourceId],
  source_name: safeText(candidate.source_name || "Planning Data certificate of immunity records"),
  publisher: safeText(candidate.publisher || "Ministry of Housing, Communities and Local Government / Historic England"),
  source_url: candidate.source_url,
  source_record_id: safeText(candidate.source_record_id),
  source_type: safeText(candidate.source_type || "official planning data entity row"),
  source_retrieved_at: candidate.accessed_at || retrievedAt,
  source_date_field: safeText(candidate.source_date_field || "start-date as certificate start; end-date as certificate end; entry-date as Planning Data row entry date"),
  source_dataset_id: candidate.source_dataset_id || "certificate-of-immunity",
  confidence: candidate.confidence || "documented",
  architect: safeText(candidate.architect || "Source row does not name a project architect."),
  project_type: safeText(candidate.project_type || candidate.subcategory || "certificate of immunity heritage/planning status"),
  geometry_source: safeText(candidate.geometry_source || "Planning Data point WKT and multipolygon geometry from the certificate-of-immunity entity row."),
  geometry_precision: safeText(candidate.geometry_precision || "Atlas event stores the source point marker; the source row also contains polygon geometry. This is not a measured building footprint in the manual corpus."),
  license_or_terms_note: safeText(candidate.license || candidate.license_or_terms_note || "Open Government Licence v3.0."),
  attribution: safeText(candidate.attribution || "Historic England; Ministry of Housing, Communities and Local Government; Ordnance Survey Crown copyright/database right 2026 where applicable"),
  limitations: safeText(candidate.limitations),
  transformation_method: safeText(candidate.transformation_method)
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
  if (!/^lon_arch_coi_/.test(event.event_id)) throw new Error(`Unexpected event_id prefix: ${event.event_id}`);
  if (!event.source_url.startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
  if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
    throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
  }
  for (const candidateSourceId of event.source_ids) {
    if (!knownSourceIds.has(candidateSourceId)) throw new Error(`Unknown source_id ${candidateSourceId} for ${event.event_id}`);
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
    event.source_date_field,
    event.project_type
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
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -0.5103 || longitude > 0.334 || latitude < 51.2868 || latitude > 51.6919) {
    throw new Error(`Invalid or outside-London-envelope coordinates for ${event.event_id}`);
  }
}

doc.events.push(...records);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));
doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

const tmpPath = `${path}.round112-certificate-immunity.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
