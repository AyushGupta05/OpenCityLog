const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidateFiles = [
  "tmp/subagents/round112_nyc_dob_candidates.json",
  "tmp/subagents/round112_nyc_lpc_permit_candidates.json"
];
const retrievedAt = "2026-05-19";

const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  if (Array.isArray(raw.events)) return raw.events;
  return [];
};

const candidates = candidateFiles.flatMap((file) => rowsFrom(file).map((candidate) => ({ ...candidate, __file: file })));
if (candidates.length !== 19) {
  throw new Error(`Expected 19 NYC round112 official candidates, found ${candidates.length}`);
}

const sourceEntries = [
  {
    source_id: "nyc-dob-now-co-pkdm-hqz6",
    city_ids: ["nyc"],
    title: "DOB NOW: Certificate of Occupancy",
    publisher: "NYC Department of Buildings via NYC Open Data",
    bucket: "planning/development/architecture/building_status",
    access_url: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Certificate-of-Occupancy/pkdm-hqz6",
    licence: "NYC Open Data / NYC.gov terms; factual metadata and source URLs retained.",
    licence_url: "https://www.nyc.gov/home/terms-of-use.page",
    coverage_years: { start: 2021, end: 2026 },
    time_coverage: "DOB NOW CO module records beginning around March 2021 through current NYC Open Data publication.",
    spatial_granularity: "DOB address-level latitude/longitude point where provided.",
    temporal_granularity: "CO issue date and application/job identifiers.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "CO issuance is an administrative occupancy/legal-use milestone for the cited application. It is not a public opening, tenant move-in, final completion of all work, design authorship, unit sale, or outcome effect."
  },
  {
    source_id: "nyc-dob-co-bs8b-p36w",
    city_ids: ["nyc"],
    title: "DOB Certificate Of Occupancy",
    publisher: "NYC Department of Buildings via NYC Open Data",
    bucket: "planning/development/architecture/building_status",
    access_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w",
    licence: "NYC Open Data / NYC.gov terms; factual metadata and source URLs retained.",
    licence_url: "https://www.nyc.gov/home/terms-of-use.page",
    coverage_years: { start: 2012, end: 2021 },
    time_coverage: "Legacy DOB CO records in the architecture corpus window, selected from 2018-2021 rows in this batch.",
    spatial_granularity: "DOB address-level latitude/longitude point where provided.",
    temporal_granularity: "CO issue date and job number.",
    update_frequency: "Legacy dataset; check NYC Open Data metadata before future refreshes",
    retrieved_at: retrievedAt,
    limitations: "Legacy CO rows can include repeated temporary COs and address-normalization differences. A temporary CO is an administrative occupancy status, not final completion, public opening, tenant move-in, or outcome evidence."
  },
  {
    source_id: "nyc-lpc-permit-application-information",
    city_ids: ["nyc"],
    title: "NYC Open Data LPC Permit Application Information",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    bucket: "planning/development/architecture/historic_preservation",
    access_url: "https://data.cityofnewyork.us/d/dpm2-m9mq",
    licence: "Dataset metadata license field is null; NYC Open Data / NYC.gov terms apply. Factual metadata and source URLs retained with LPC attribution.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected Certificate of Appropriateness rows with issue_date in 2025-2026 from a dataset covering historical permit records.",
    spatial_granularity: "LPC geocoded point by address/block/lot where provided.",
    temporal_granularity: "issue_date, received_date, expiration_date, and regulation number on each row.",
    update_frequency: "Daily per NYC Open Data metadata noted in the candidate audit.",
    retrieved_at: retrievedAt,
    limitations: "LPC permit issuance/application processing is an administrative preservation action. It is not construction start, completion, compliance sign-off, final physical condition, preservation outcome, or full approved-work geometry. Work-type text can summarize applicant/LPC metadata."
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

const eventIdFor = (candidate) => safeText(candidate.event_id).replace(/^nyc_lpc_/, "nyc_arch_lpc_");

const records = candidates.map((candidate) => ({
  city_id: "nyc",
  event_id: eventIdFor(candidate),
  date: candidate.date || candidate.effective_date,
  date_precision: candidate.date_precision || candidate.effective_date_precision || "day",
  bucket: safeText(candidate.category || "architecture/official_record"),
  title: safeText(candidate.title),
  summary: safeText(candidate.summary),
  observed_change: safeText(candidate.observed_change),
  area: safeText(candidate.location_name || candidate.address || "New York City"),
  latitude: candidate.lat ?? candidate.latitude,
  longitude: candidate.lon ?? candidate.longitude,
  source_ids: candidate.source_ids || [candidate.source_id],
  source_name: safeText(candidate.source_name),
  publisher: safeText(candidate.publisher),
  source_url: candidate.source_url,
  source_record_id: safeText(candidate.source_record_id),
  source_type: safeText(candidate.source_type),
  source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || retrievedAt,
  source_date_field: safeText(candidate.source_date_field || (candidate.source_id === "nyc-lpc-permit-application-information" ? "issue_date used as the observed administrative action date" : "certificate issue date used as the observed administrative action date")),
  source_dataset_id: candidate.source_dataset_id || candidate.source_id,
  confidence: candidate.confidence,
  architect: safeText(candidate.architect || "Source row does not name a project architect."),
  project_type: safeText(candidate.subcategory || candidate.category || "official administrative building or preservation record"),
  geometry_source: safeText(candidate.geometry_source),
  geometry_precision: safeText(candidate.geometry_precision),
  license_or_terms_note: safeText(candidate.license || candidate.license_or_terms_note),
  attribution: safeText(candidate.attribution || candidate.publisher),
  limitations: safeText(candidate.limitations),
  transformation_method: safeText(
    `${candidate.transformation_method || `Round112 extraction from ${candidate.__file}.`} Normalized by scripts/append_architecture_batch_20260519_round112_nyc_official.js with source-family IDs, duplicate checks, overclaim wording cleanup, current-date guard, and provenance fields preserved.`
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
  if (!/^nyc_arch_/.test(event.event_id)) throw new Error(`Unexpected event_id prefix: ${event.event_id}`);
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
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -74.2591 || longitude > -73.7004 || latitude < 40.4774 || latitude > 40.9176) {
    throw new Error(`Invalid or outside-NYC-envelope coordinates for ${event.event_id}`);
  }
}

doc.events.push(...records);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));
doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

const tmpPath = `${path}.round112-nyc-official.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
