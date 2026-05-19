const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round99.json",
  "tmp/subagents/nyc_arch_candidates_round99.json",
  "tmp/subagents/belfast_arch_candidates_round99.json"
];

const selectedIds = new Set([
  "lon_arch_queen_elizabeth_ii_garden_opening_2026",
  "lon_arch_roehampton_dorothy_buchanan_building_opening_2026",
  "lon_arch_new_addington_community_diagnostic_centre_opening_2026",
  "lon_arch_st_andrew_apostle_school_building_opening_2025",
  "lon_arch_wandsworth_homelessness_assessment_hub_opening_2026",
  "lon_arch_brooke_house_acton_opening_2026",
  "nyc_arch_broadway_vision_union_square_phase_completion_2024",
  "nyc_arch_jfk_terminal_8_expansion_opening_2022",
  "nyc_arch_harlem_school_arts_renaissance_project_completion_2020",
  "nyc_arch_harlem_academy_new_home_move_2021",
  "nyc_arch_sculpturecenter_expanded_building_inauguration_2014",
  "bfs_arch_templemore_avenue_network_centre_operational_2017",
  "bfs_arch_ardoyne_youth_hub_sod_cut_2026",
  "bfs_arch_patrick_sarsfields_changing_rooms_opening_2018",
  "bfs_arch_kids_together_play_facilities_opening_2018"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const areaById = {
  lon_arch_queen_elizabeth_ii_garden_opening_2026: "Regent's Park",
  lon_arch_roehampton_dorothy_buchanan_building_opening_2026: "Roehampton",
  lon_arch_new_addington_community_diagnostic_centre_opening_2026: "New Addington",
  lon_arch_st_andrew_apostle_school_building_opening_2025: "Barnet",
  lon_arch_wandsworth_homelessness_assessment_hub_opening_2026: "Lavender Hill / Wandsworth",
  lon_arch_brooke_house_acton_opening_2026: "Acton",
  nyc_arch_broadway_vision_union_square_phase_completion_2024: "Union Square / Broadway",
  nyc_arch_jfk_terminal_8_expansion_opening_2022: "JFK Airport",
  nyc_arch_harlem_school_arts_renaissance_project_completion_2020: "Harlem",
  nyc_arch_harlem_academy_new_home_move_2021: "Harlem",
  nyc_arch_sculpturecenter_expanded_building_inauguration_2014: "Long Island City",
  bfs_arch_templemore_avenue_network_centre_operational_2017: "Templemore Avenue",
  bfs_arch_ardoyne_youth_hub_sod_cut_2026: "Ardoyne",
  bfs_arch_patrick_sarsfields_changing_rooms_opening_2018: "West Belfast / Patrick Sarsfields GAC",
  bfs_arch_kids_together_play_facilities_opening_2018: "Belfast / Kids Together"
};

const cityIdFromCandidate = (candidate) => {
  const city = String(candidate.city || candidate.city_id || "").toLowerCase();
  if (city.includes("london")) return "london";
  if (city.includes("new york") || city.includes("nyc")) return "nyc";
  if (city.includes("belfast")) return "belfast";
  throw new Error(`Cannot infer city for ${eventIdFor(candidate)}`);
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
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of");

const textFor = (candidate) => [
  candidate.title,
  candidate.summary,
  candidate.category,
  candidate.source_name,
  candidate.source_date_field
].filter(Boolean).join(" ").toLowerCase();

const observedChangeFor = (candidate) => {
  const text = textFor(candidate);
  if (text.includes("sod cut") || text.includes("works-start")) {
    return "A documented works-start milestone was recorded for the named facility.";
  }
  if (text.includes("operational")) {
    return "A documented operational-use milestone was recorded for the named facility.";
  }
  if (text.includes("completion") || text.includes("completed")) {
    return "A documented completion milestone was recorded for the named facility or public-realm project.";
  }
  if (text.includes("move") || text.includes("new home")) {
    return "A documented move-in or new-home milestone was recorded for the named institution.";
  }
  return "A documented opening or public-use milestone was recorded for the named facility.";
};

const sourceDateFieldFor = (candidate) => {
  const text = textFor(candidate);
  if (candidate.source_date_field) return safeText(candidate.source_date_field);
  if (text.includes("sod cut") || text.includes("works-start")) return "source records the works-start or sod-cutting date";
  if (text.includes("operational")) return "source records the publication or status date for operational use";
  if (text.includes("completion") || text.includes("completed")) return "source records the completion date";
  if (text.includes("move") || text.includes("new home")) return "source records the move-in or new-home date";
  return "source records the opening or public-use date";
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
  const cityId = cityIdFromCandidate(candidate);
  const sourceId = sourceIdsByCity[cityId];
  const date = candidate.date || candidate.effective_date || candidate.effective_date_range?.start;
  const latitude = candidate.latitude ?? candidate.geometry?.coordinates?.[1];
  const longitude = candidate.longitude ?? candidate.geometry?.coordinates?.[0];
  return {
    city_id: cityId,
    event_id: eventId,
    date,
    bucket: candidate.bucket || candidate.category,
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: candidate.observed_change ? safeText(candidate.observed_change) : observedChangeFor(candidate),
    area: candidate.area || areaById[eventId],
    latitude,
    longitude,
    source_ids: [sourceId],
    source_name: safeText(candidate.source_name),
    publisher: candidate.publisher,
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: candidate.source_type,
    source_retrieved_at: retrievedAt,
    source_date_field: sourceDateFieldFor(candidate),
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: candidate.architect || `${candidate.attribution || candidate.publisher} project team`,
    project_type: candidate.project_type || candidate.category,
    geometry_source: candidate.geometry_source || "Curated point from worker candidate geometry for the named source location.",
    geometry_precision: candidate.geometry_precision || "Approximate project point, not a measured footprint or parcel boundary.",
    license_or_terms_note: candidate.license_or_terms_note || candidate.license,
    attribution: candidate.attribution || candidate.publisher,
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(candidate.transformation_method) || "Manual worker candidate extraction from a public source; normalized into the architecture milestone schema with source, date, geometry, confidence, and limitation fields preserved."
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
const futureRecords = records.filter((event) => new Date(`${normalizeDate(event.date)}T00:00:00Z`) > latestAllowedDate);
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
doc.sources = doc.sources.map((source) => {
  if (Object.values(sourceIdsByCity).includes(source.source_id)) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

const outputPath = `${path}.round99.tmp`;
fs.writeFileSync(outputPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(outputPath, path);
console.log(`Appended ${records.length} records to ${path}`);
