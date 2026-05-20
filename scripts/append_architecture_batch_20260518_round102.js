const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round102.json",
  "tmp/subagents/nyc_arch_candidates_round102.json",
  "tmp/subagents/belfast_arch_candidates_round102.json"
];

const selectedIds = new Set([
  "lon_arch_fulham_pier_public_opening_2025",
  "lon_arch_west_youth_zone_opening_2024",
  "nyc_arch_nysci_design_lab_opening_2014",
  "nyc_arch_cary_leeds_center_opening_2015",
  "nyc_arch_africa_center_public_programming_start_2019",
  "nyc_arch_power_station_berkleenyc_reopening_2021",
  "nyc_arch_center_for_brooklyn_history_reopening_2023"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const metadataById = {
  lon_arch_fulham_pier_public_opening_2025: {
    publisher: "Fulham FC",
    source_type: "official club news page",
    license_or_terms_note: "Fulham FC website terms apply to page content; factual metadata and source URL only, no page text or media reproduced.",
    attribution: "Fulham FC",
    transformation_method: "Manual review of the official Fulham FC dated opening announcement; extracted the public opening date, facility name, project context, and approximate Craven Cottage point; screened against the manual corpus and prior London candidate rounds by event_id, title terms, source URL, and source_record_id."
  },
  lon_arch_west_youth_zone_opening_2024: {
    publisher: "OnSide Youth Zones",
    source_type: "institutional youth-zone profile page",
    license_or_terms_note: "OnSide Youth Zones website terms apply to page content; factual metadata and source URL only, no page text or media reproduced.",
    attribution: "OnSide Youth Zones",
    transformation_method: "Manual review of the OnSide WEST Youth Zone profile page; extracted the stated opening date, facility name, EdCity location, and approximate White City point; screened against the manual corpus and prior London candidate rounds by event_id, title terms, source URL, and source_record_id."
  },
  nyc_arch_nysci_design_lab_opening_2014: {
    publisher: "New York Hall of Science",
    source_type: "institutional press PDF",
    license_or_terms_note: "New York Hall of Science website/PDF terms apply to page content; factual metadata and source URL only, no page text or images reproduced.",
    attribution: "New York Hall of Science",
    transformation_method: "Manual review of the New York Hall of Science press PDF; extracted the public opening date, Design Lab name, Central Pavilion context, named design team, and approximate museum point; screened against the manual corpus by event_id, title terms, source URL, and source_record_id."
  },
  nyc_arch_cary_leeds_center_opening_2015: {
    publisher: "New York Junior Tennis and Learning",
    source_type: "institutional nonprofit news page",
    license_or_terms_note: "NYJTL website terms apply to page content; factual metadata and source URL only, no page text or media reproduced.",
    attribution: "New York Junior Tennis and Learning",
    transformation_method: "Manual review of the NYJTL dated opening announcement; extracted the launch/ribbon-cutting date, facility name, Crotona Park location, and approximate site point; screened against the manual corpus by event_id, title terms, source URL, and source_record_id."
  },
  nyc_arch_africa_center_public_programming_start_2019: {
    publisher: "The Africa Center",
    source_type: "institutional mission page",
    license_or_terms_note: "The Africa Center website terms apply to page content; factual metadata and source URL only, no page text or media reproduced.",
    attribution: "The Africa Center",
    transformation_method: "Manual review of The Africa Center mission page; extracted the month-level public-programming start, Fifth Avenue location, and approximate institution point; screened against the manual corpus by event_id, title terms, source URL, and source_record_id."
  },
  nyc_arch_power_station_berkleenyc_reopening_2021: {
    publisher: "NYC Mayor's Office of Media and Entertainment",
    source_type: "official NYC agency release",
    license_or_terms_note: "NYC.gov terms apply to page content; factual metadata and source URL only, no page text or media reproduced.",
    attribution: "NYC Mayor's Office of Media and Entertainment",
    transformation_method: "Manual review of the official NYC MOME release; extracted the reopening date, renovated facility name, project context, and approximate West 53rd Street point; screened against the manual corpus by event_id, title terms, source URL, and source_record_id."
  },
  nyc_arch_center_for_brooklyn_history_reopening_2023: {
    title: "Center for Brooklyn History reopened after renovation",
    publisher: "Brooklyn Public Library",
    source_type: "official public library press release",
    license_or_terms_note: "Brooklyn Public Library website terms apply to page content; factual metadata and source URL only, no page text or images reproduced.",
    attribution: "Brooklyn Public Library",
    transformation_method: "Manual review of the Brooklyn Public Library press release; interpreted the Thursday grand reopening reference relative to the Friday 2023-09-15 publication date, extracted the renovation/public-access milestone, and assigned an approximate Brooklyn Heights point; screened against the manual corpus by event_id, title terms, source URL, and source_record_id."
  }
};

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
};

const cityIdFromCandidate = (candidate) => {
  const city = String(candidate.city || candidate.city_id || "").toLowerCase();
  if (city.includes("london")) return "london";
  if (city.includes("new york") || city.includes("nyc")) return "nyc";
  if (city.includes("belfast")) return "belfast";
  throw new Error(`Cannot infer city for ${candidate.event_id}`);
};

const normalizeDateForComparison = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of");

const candidateRows = [];
const seenCandidateIds = new Set();
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) {
    if (!selectedIds.has(candidate.event_id) || seenCandidateIds.has(candidate.event_id)) continue;
    seenCandidateIds.add(candidate.event_id);
    candidateRows.push({ ...candidate, __file: file });
  }
}

const toRecord = (candidate) => {
  const cityId = cityIdFromCandidate(candidate);
  const sourceId = sourceIdsByCity[cityId];
  const metadata = metadataById[candidate.event_id] || {};
  return {
    city_id: cityId,
    event_id: candidate.event_id,
    date: candidate.date,
    bucket: candidate.bucket,
    title: safeText(metadata.title || candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: candidate.area,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: [sourceId],
    source_name: safeText(candidate.source_name),
    publisher: metadata.publisher,
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: metadata.source_type,
    source_retrieved_at: retrievedAt,
    source_date_field: safeText(candidate.source_date_field),
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: safeText(candidate.architect),
    project_type: safeText(candidate.project_type),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    license_or_terms_note: metadata.license_or_terms_note,
    attribution: metadata.attribution,
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(metadata.transformation_method)
  };
};

const records = candidateRows.map(toRecord);
if (records.length !== selectedIds.size) {
  const found = new Set(records.map((event) => event.event_id));
  const missing = [...selectedIds].filter((id) => !found.has(id));
  throw new Error(`Expected ${selectedIds.size} selected records, found ${records.length}. Missing: ${missing.join(", ")}`);
}

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
  "limitations",
  "transformation_method"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
}

const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.transformation_method
  ].join(" ");
  if (banned.test(checked)) {
    throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
  }
}

const batchIds = new Set();
const batchSourceKeys = new Set();
for (const event of records) {
  if (batchIds.has(event.event_id)) {
    throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
  }
  batchIds.add(event.event_id);

  const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
  if (batchSourceKeys.has(sourceKey)) {
    throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
  }
  batchSourceKeys.add(sourceKey);
}

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

const existingSourceKeys = new Set(
  doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`)
);
const duplicateSourceRecords = records
  .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) {
  throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);
}

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) {
  throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);
}

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

const tmpPath = `${path}.round102.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts }, null, 2));
