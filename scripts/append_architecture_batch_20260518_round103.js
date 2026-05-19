const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/belfast_arch_candidates_round103_civic.json",
  "tmp/subagents/belfast_arch_candidates_round103_culture.json",
  "tmp/subagents/belfast_arch_candidates_round103_heritage.json",
  "tmp/subagents/london_arch_candidates_round103_civic.json",
  "tmp/subagents/london_arch_candidates_round103_culture.json",
  "tmp/subagents/london_arch_candidates_round103_heritage.json",
  "tmp/subagents/nyc_arch_candidates_round103_civic.json",
  "tmp/subagents/nyc_arch_candidates_round103_culture.json",
  "tmp/subagents/nyc_arch_candidates_round103_landmarks.json"
];

const rejectedIds = new Set([
  "lon_arch_lesnes_abbey_woods_clearing_opening_2024",
  "nyc_arch_flushing_meadows_aquatics_center_reopening_2023",
  "bfs_arch_lisburn_road_library_refurbishment_completion_2017"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const additionalSources = [
  {
    source_id: "historic-england-nhle",
    city_ids: ["london"],
    title: "National Heritage List for England listed-building records",
    publisher: "Historic England",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://historicengland.org.uk/listing/the-list/",
    licence: "Historic England website terms; factual metadata and source URLs only until terms are reviewed",
    licence_url: "https://historicengland.org.uk/terms/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "2008-2026 designation records used for London architecture/heritage milestones",
    spatial_granularity: "Named listed-building point",
    temporal_granularity: "Listing or amendment date stated by NHLE record",
    update_frequency: "Live register / record-specific",
    retrieved_at: retrievedAt,
    limitations: "NHLE records document heritage designation changes, not construction completion or comprehensive development activity. Coordinates are curated points for atlas navigation, not measured statutory boundary geometry."
  },
  {
    source_id: "dfc-hed-nidirect-buildings",
    city_ids: ["belfast"],
    title: "Northern Ireland Historic Environment Division listed-building records",
    publisher: "Department for Communities Historic Environment Division / nidirect Buildings Database",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://apps.communities-ni.gov.uk/Buildings/",
    licence: "Department for Communities / nidirect web terms; factual metadata and source URLs only until terms are reviewed",
    licence_url: "https://www.nidirect.gov.uk/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "2008-2026 designation records used for Belfast architecture/heritage milestones",
    spatial_granularity: "Named listed-building point",
    temporal_granularity: "Listing date stated by building record",
    update_frequency: "Live register / record-specific",
    retrieved_at: retrievedAt,
    limitations: "Records document statutory listing/designation changes, not construction completion or comprehensive development activity. Coordinates are curated points for atlas navigation, not measured protected-site boundaries."
  }
];

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
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
  .replace(/\bas proof of\b/gi, "as evidence of")
  .replace(/\bproof that\b/gi, "evidence that")
  .replace(/\bwill increase\b/gi, "is described as intended to increase")
  .replace(/\bwill decrease\b/gi, "is described as intended to decrease");

const candidateRows = [];
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) {
    if (rejectedIds.has(candidate.event_id)) continue;
    candidateRows.push({ ...candidate, __file: file });
  }
}

if (candidateRows.length !== 42) {
  throw new Error(`Expected 42 accepted round103 candidates after local source-quality rejections, found ${candidateRows.length}`);
}

const toRecord = (candidate) => {
  const cityId = String(candidate.city_id || candidate.city || "").toLowerCase();
  if (!sourceIdsByCity[cityId]) {
    throw new Error(`Unsupported city for ${candidate.event_id}: ${candidate.city_id || candidate.city}`);
  }
  return {
    city_id: cityId,
    event_id: candidate.event_id,
    date: candidate.date,
    date_precision: candidate.date_precision,
    bucket: candidate.bucket,
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: candidate.area,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: candidate.source_ids && candidate.source_ids.length ? candidate.source_ids : [sourceIdsByCity[cityId]],
    source_name: safeText(candidate.source_name),
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_retrieved_at: candidate.source_retrieved_at || retrievedAt,
    source_date_field: safeText(candidate.source_date_field),
    source_dataset_id: candidate.source_dataset_id || sourceIdsByCity[cityId],
    confidence: candidate.confidence,
    architect: safeText(candidate.architect),
    project_type: safeText(candidate.project_type),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    limitations: safeText(candidate.limitations),
    duplicate_check_note: safeText(candidate.duplicate_check_note),
    source_audit_note: safeText(candidate.source_audit_note)
  };
};

const records = candidateRows.map(toRecord);
const requiredFields = [
  "city_id", "event_id", "date", "bucket", "title", "summary", "observed_change", "area",
  "latitude", "longitude", "source_ids", "source_name", "source_url", "source_record_id",
  "source_retrieved_at", "source_date_field", "source_dataset_id", "confidence", "architect",
  "project_type", "geometry_source", "geometry_precision", "limitations", "duplicate_check_note",
  "source_audit_note"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
  if (!/^(lon|nyc|bfs)_arch_/.test(event.event_id)) {
    throw new Error(`Unexpected architecture event_id prefix: ${event.event_id}`);
  }
  if (!event.source_url.startsWith("http")) {
    throw new Error(`Invalid source URL for ${event.event_id}`);
  }
  if (!sourceIdsByCity[event.city_id]) {
    throw new Error(`Unsupported city_id ${event.city_id} for ${event.event_id}`);
  }
  for (const sourceId of event.source_ids) {
    const knownSource = doc.sources.find((source) => source.source_id === sourceId) || additionalSources.find((source) => source.source_id === sourceId);
    if (!knownSource) {
      throw new Error(`Unexpected source_id ${sourceId} for ${event.event_id}`);
    }
    if (!(knownSource.city_ids || []).includes(event.city_id)) {
      throw new Error(`Source ${sourceId} does not cover ${event.city_id} for ${event.event_id}`);
    }
  }
  if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
    throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
  }
}

const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.duplicate_check_note,
    event.source_audit_note
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
const recordsToAdd = records.filter((event) => !existingIds.has(event.event_id));
if (recordsToAdd.length === 0) {
  throw new Error(`All round103 records already exist; duplicate event_id values: ${duplicateIds.join(", ")}`);
}

const existingSourceKeys = new Set(
  doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`)
);
const duplicateSourceRecords = recordsToAdd
  .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) {
  throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);
}

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = recordsToAdd.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) {
  throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);
}

const existingSourceIds = new Set(doc.sources.map((source) => source.source_id));
const sourcesToAdd = additionalSources.filter((source) => !existingSourceIds.has(source.source_id));
for (const source of sourcesToAdd) {
  doc.sources.push(source);
}
doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

for (const event of recordsToAdd) {
  const longitude = Number(event.longitude);
  const latitude = Number(event.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error(`Invalid coordinates for ${event.event_id}`);
  }
}

doc.events.push(...recordsToAdd);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));

const tmpPath = `${path}.round103.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: recordsToAdd.length, skipped_existing: duplicateIds.length, added_sources: sourcesToAdd.length, counts }, null, 2));
