const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/belfast_arch_candidates_round80.json",
  "tmp/subagents/belfast_arch_candidates_round84.json",
  "tmp/subagents/london_arch_candidates_round72.json",
  "tmp/subagents/london_arch_candidates_round80.json",
  "tmp/subagents/london_arch_candidates_round82.json",
  "tmp/subagents/nyc_arch_candidates_round72.json",
  "tmp/subagents/nyc_arch_candidates_round82.json",
  "tmp/subagents/nyc_arch_candidates_round84.json"
];

const selectedIds = new Set([
  "bfs_arch_ulster_university_belfast_campus_phase_one_opening_2016",
  "bfs_arch_precision_medicine_centre_opening_2019",
  "bfs_arch_qub_advanced_manufacturing_facility_opening_2018",
  "bfs_arch_qub_cycle_parking_facilities_launch_2024",
  "bfs_arch_qub_upper_malone_hockey_facility_opening_2020",
  "lon_arch_lshtm_tavistock_place_2_opening_2023",
  "lon_arch_national_youth_theatre_redevelopment_completion_2021",
  "lon_arch_lsbu_hub_opening_2022",
  "lon_arch_edmonton_green_library_garden_learning_hub_opening_2024",
  "lon_arch_reardon_court_extra_care_completion_2024",
  "lon_arch_7_alexandra_avenue_battersea_listing_2022",
  "lon_arch_east_lodge_southwark_listing_2021",
  "lon_arch_pont_street_cabmens_shelter_listing_2022",
  "lon_arch_prince_alfred_lamp_standard_listing_2022",
  "lon_arch_shelley_house_chelsea_embankment_listing_2020",
  "lon_arch_qmul_graduate_centre_opening_2017",
  "lon_arch_ucl_22_gordon_street_reopening_2016",
  "nyc_arch_cooper_hewitt_carnegie_mansion_reopening_2014",
  "nyc_arch_downtown_art_renovation_reopening_2024"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const oldRecordOverrides = {
  lon_arch_lshtm_tavistock_place_2_opening_2023: {
    city_id: "london",
    bucket: "planning/development/architecture/university research building",
    publisher: "London School of Hygiene & Tropical Medicine",
    source_type: "institutional news page",
    source_date_field: "institutional page states official opening on 12 September 2023",
    summary: "London School of Hygiene & Tropical Medicine records the official opening of its Tavistock Place 2 building on 12 September 2023.",
    observed_change: "A university research and teaching building entered documented use at Tavistock Place.",
    architect: "LSHTM, Stanton Williams, and Tavistock Place 2 project team",
    project_type: "university research and teaching building",
    license_or_terms_note: "Publisher web terms not reviewed; cite URL and small factual metadata only."
  },
  lon_arch_national_youth_theatre_redevelopment_completion_2021: {
    city_id: "london",
    bucket: "planning/development/architecture/cultural education redevelopment",
    publisher: "DSDHA",
    source_type: "architect project page",
    source_date_field: "architect project page states completion in 2021",
    summary: "DSDHA records the National Youth Theatre redevelopment on Holloway Road as completed in 2021.",
    observed_change: "A theatre education and rehearsal building reached documented completion after redevelopment.",
    architect: "DSDHA and National Youth Theatre project team",
    project_type: "theatre education redevelopment",
    license_or_terms_note: "Architect project-page terms not reviewed; cite URL and small factual metadata only."
  }
};

const cityIdFromFile = (file) => {
  if (file.includes("belfast")) return "belfast";
  if (file.includes("london")) return "london";
  if (file.includes("nyc")) return "nyc";
  throw new Error(`Cannot infer city from ${file}`);
};

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
};

const eventIdFor = (candidate) => (
  candidate.proposed_event_id || candidate.event_id || candidate.event_id_suggestion || candidate.id
);

const normalizeDate = (value) => {
  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  return value;
};

const candidateRows = [];
const seenCandidateIds = new Set();
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) {
    const eventId = eventIdFor(candidate);
    if (!selectedIds.has(eventId) || seenCandidateIds.has(eventId)) continue;
    seenCandidateIds.add(eventId);
    candidateRows.push({ ...candidate, __file: file });
  }
}

const toRecord = (candidate) => {
  const eventId = eventIdFor(candidate);
  const override = oldRecordOverrides[eventId] || {};
  const cityId = candidate.city_id || override.city_id || cityIdFromFile(candidate.__file);
  const sourceId = sourceIdsByCity[cityId];
  const date = candidate.date || candidate.effective_date || candidate.effective_date_range?.start;
  const latitude = candidate.latitude ?? candidate.geometry?.coordinates?.[1];
  const longitude = candidate.longitude ?? candidate.geometry?.coordinates?.[0];
  return {
    city_id: cityId,
    event_id: eventId,
    date,
    bucket: candidate.bucket || override.bucket,
    title: candidate.title,
    summary: candidate.summary || override.summary,
    observed_change: candidate.observed_change || override.observed_change,
    area: candidate.area,
    latitude,
    longitude,
    source_ids: [sourceId],
    source_name: candidate.source_name,
    publisher: candidate.publisher || override.publisher,
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: candidate.source_type || override.source_type,
    source_retrieved_at: retrievedAt,
    source_date_field: candidate.source_date_field || override.source_date_field || candidate.status_date_basis,
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: candidate.architect || override.architect || candidate.architect_project_type,
    project_type: candidate.project_type || override.project_type || candidate.architect_project_type,
    geometry_source: candidate.geometry_source || candidate.geocode_note || `Curated project point from candidate coordinates for ${candidate.area}.`,
    geometry_precision: candidate.geometry_precision || "Approximate project point, not a measured footprint or parcel boundary.",
    license_or_terms_note: candidate.license_or_terms_note || override.license_or_terms_note,
    limitations: candidate.limitations,
    transformation_method: candidate.transformation_method || "Manual candidate extraction from prior source report; normalized into the architecture milestone schema with source and limitation fields preserved."
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
  "source_url",
  "source_record_id",
  "source_retrieved_at",
  "source_date_field",
  "confidence",
  "limitations"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
}

const outputText = JSON.stringify(records);
const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease)\b/i;
if (banned.test(outputText)) {
  throw new Error("Output records contain overclaim wording");
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

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${normalizeDate(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) {
  throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);
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

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (Object.values(sourceIdsByCity).includes(source.source_id)) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
