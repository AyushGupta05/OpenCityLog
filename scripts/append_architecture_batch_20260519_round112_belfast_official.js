const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidateFile = "tmp/subagents/round112_belfast_official_sources.json";
const retrievedAt = "2026-05-19";

const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const raw = JSON.parse(fs.readFileSync(candidateFile, "utf8").replace(/^\uFEFF/, ""));
const candidates = Array.isArray(raw) ? raw : (raw.candidates || raw.records || raw.events || []);

if (candidates.length !== 9) {
  throw new Error(`Expected 9 Belfast round112 official candidates, found ${candidates.length}`);
}

const sourceEntries = [
  {
    source_id: "bcc-planning-committee-minutes",
    city_ids: ["belfast"],
    title: "Belfast City Council Planning Committee agenda and minutes",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture",
    access_url: "https://minutes.belfastcity.gov.uk/",
    licence: "Belfast City Council copyright; factual metadata and source URLs only until fuller reuse terms are reviewed.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Meeting-specific planning and consent decisions from the 2008-2026 architecture corpus window.",
    spatial_granularity: "Planning application, committee item, address, or site description; manual events use approximate site points.",
    temporal_granularity: "Meeting date and decision text in committee minutes.",
    update_frequency: "Meeting-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Committee minutes document administrative planning decisions, listed-building consents, conservation-area consents, and related recommendations. They are not evidence of construction start, completion, occupation, opening, building condition, or outcome effects."
  },
  {
    source_id: "dfc-hed-via-bcc-notifications",
    city_ids: ["belfast"],
    title: "DfC Historic Environment Division listing notifications reported to Belfast Planning Committee",
    publisher: "Department for Communities Historic Environment Division / Belfast City Council",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://minutes.belfastcity.gov.uk/",
    licence: "Underlying nidirect / Crown copyright information may be reusable under Open Government Licence where applicable; Belfast committee pages remain Belfast City Council copyright. Factual metadata and source URLs only here.",
    licence_url: "https://www.nidirect.gov.uk/node/11440",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Meeting-specific HED listing notifications found for 2023-2025.",
    spatial_granularity: "Named building or property; manual events use approximate address points.",
    temporal_granularity: "Committee notification date or listing month where stated in minutes.",
    update_frequency: "Notification-specific",
    retrieved_at: retrievedAt,
    limitations: "Committee notifications record HED listing notices or committee responses. Proposed-listing support is not final statutory listing. Confirmed-listing notices can lag the underlying HED designation date and should be reconciled with nidirect Buildings records for final grade, extent, exact listing date, and official HB reference."
  }
];

for (const sourceEntry of sourceEntries) {
  const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
  if (index >= 0) {
    doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
  } else {
    doc.sources.push(sourceEntry);
  }
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

const sourceRecordIdFor = (candidate) => {
  const rawId = safeText(candidate.source_record_id);
  const repeatedNotification = rawId === "Advance Notice of Listed Buildings - 143 Malone Road and Inchmarlo Prep School";
  if (repeatedNotification) return `${rawId}; site: ${safeText(candidate.location_name)}`;
  return rawId;
};

const records = candidates.map((candidate) => ({
  city_id: "belfast",
  event_id: candidate.event_id,
  date: candidate.date || candidate.effective_date,
  date_precision: candidate.date_precision || candidate.effective_date_precision || "day",
  bucket: safeText(`architecture/${candidate.category || "planning_development"}/${candidate.subcategory || "official_record"}`),
  title: safeText(candidate.title),
  summary: safeText(candidate.summary),
  observed_change: safeText(candidate.observed_change),
  area: safeText(candidate.location_name || candidate.address || "Belfast"),
  latitude: candidate.lat ?? candidate.latitude,
  longitude: candidate.lon ?? candidate.longitude,
  source_ids: candidate.source_ids || [candidate.source_id],
  source_name: safeText(candidate.source_name),
  publisher: safeText(candidate.publisher),
  source_url: candidate.source_url,
  source_record_id: sourceRecordIdFor(candidate),
  source_type: safeText(candidate.source_type),
  source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || retrievedAt,
  source_date_field: safeText(candidate.source_date_field || "Committee meeting date and decision or notification text in cited minutes."),
  source_dataset_id: candidate.source_dataset_id || candidate.source_id,
  confidence: candidate.confidence,
  architect: safeText(candidate.architect || "Source record does not name a project architect."),
  project_type: safeText(candidate.subcategory || candidate.category || "official planning or heritage milestone"),
  geometry_source: safeText(candidate.geometry_source),
  geometry_precision: safeText(candidate.geometry_precision),
  license_or_terms_note: safeText(candidate.license || candidate.license_or_terms_note),
  attribution: safeText(candidate.attribution || candidate.publisher),
  limitations: safeText(candidate.limitations),
  transformation_method: safeText(
    `${candidate.transformation_method || `Manual round112 extraction from ${candidateFile}.`} Normalized by scripts/append_architecture_batch_20260519_round112_belfast_official.js with source-family IDs, duplicate checks, overclaim wording cleanup, and provenance fields preserved.`
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
  if (!/^bfs_arch_/.test(event.event_id)) throw new Error(`Unexpected event_id prefix: ${event.event_id}`);
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

const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
const duplicateTitleDates = records
  .filter((event) => existingTitleDateKeys.has(`${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`))
  .map((event) => event.event_id);
if (duplicateTitleDates.length > 0) throw new Error(`Duplicate title/date records: ${duplicateTitleDates.join(", ")}`);

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);

for (const event of records) {
  const longitude = Number(event.longitude);
  const latitude = Number(event.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -6.1 || longitude > -5.7 || latitude < 54.45 || latitude > 54.75) {
    throw new Error(`Invalid or outside-Belfast-envelope coordinates for ${event.event_id}`);
  }
}

doc.events.push(...records);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));
doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

const tmpPath = `${path}.round112-belfast-official.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
