const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round94.json",
  "tmp/subagents/nyc_arch_candidates_round94.json",
  "tmp/subagents/belfast_arch_candidates_round94.json"
];

const selectedIds = new Set([
  "lon_arch_qeh_purcell_hayward_listing_2026",
  "lon_arch_cobham_mews_studios_listing_2025",
  "lon_arch_old_palace_croydon_great_chamber_listing_2025",
  "lon_arch_groom_place_stable_yard_listing_2025",
  "lon_arch_connaught_place_16_18_listing_2024",
  "lon_arch_upminster_report_centre_listing_2023",
  "lon_arch_high_street_kensington_k8_kiosk_listing_2023",
  "lon_arch_st_mildred_addiscombe_listing_2023",
  "lon_arch_ironmongers_hall_listing_2023",
  "lon_arch_piper_building_listing_2022",
  "lon_arch_london_scottish_house_listing_2021",
  "lon_arch_guildhall_west_wing_listing_2021",
  "lon_arch_22_shad_thames_listing_2021",
  "lon_arch_former_tooting_police_station_listing_2021",
  "nyc_arch_st_michaels_episcopal_church_complex_landmark_designated_2016",
  "nyc_arch_east_village_lower_east_side_historic_district_designated_2012",
  "nyc_arch_south_village_historic_district_designated_2013",
  "nyc_arch_brooklyn_bridge_park_pier5_uplands_opening_2017",
  "nyc_arch_brooklyn_bridge_park_pier2_uplands_opening_2020",
  "nyc_arch_emily_warren_roebling_plaza_opening_2021",
  "nyc_arch_barnard_milstein_center_grand_opening_2018",
  "nyc_arch_gouverneur_health_modernization_completion_2015",
  "nyc_arch_lincoln_medical_center_ed_modernization_completion_2014",
  "bfs_arch_connected_health_training_suite_opened_2016",
  "bfs_arch_our_ladys_care_home_ot_department_opened_2016",
  "bfs_arch_belfast_city_acute_mental_health_unit_sod_cut_2016",
  "bfs_arch_knockbracken_hall_vaccination_clinic_opened_2021",
  "bfs_arch_royal_jubilee_maternity_quiet_room_reopened_2021",
  "bfs_arch_rvh_staff_hubs_opened_2023",
  "bfs_arch_sunningdale_gardens_nihe_homes_completed_2024",
  "bfs_arch_royal_hospitals_childrens_hospital_construction_start_2025"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const areaById = {
  lon_arch_qeh_purcell_hayward_listing_2026: "South Bank",
  lon_arch_cobham_mews_studios_listing_2025: "Camden / Cobham Mews",
  lon_arch_old_palace_croydon_great_chamber_listing_2025: "Croydon",
  lon_arch_groom_place_stable_yard_listing_2025: "Belgravia / Westminster",
  lon_arch_connaught_place_16_18_listing_2024: "Connaught Place / Westminster",
  lon_arch_upminster_report_centre_listing_2023: "Upminster",
  lon_arch_high_street_kensington_k8_kiosk_listing_2023: "High Street Kensington",
  lon_arch_st_mildred_addiscombe_listing_2023: "Addiscombe / Croydon",
  lon_arch_ironmongers_hall_listing_2023: "City of London",
  lon_arch_piper_building_listing_2022: "Fulham",
  lon_arch_london_scottish_house_listing_2021: "Westminster",
  lon_arch_guildhall_west_wing_listing_2021: "City of London",
  lon_arch_22_shad_thames_listing_2021: "Shad Thames",
  lon_arch_former_tooting_police_station_listing_2021: "Tooting",
  nyc_arch_st_michaels_episcopal_church_complex_landmark_designated_2016: "Manhattan Valley / Upper West Side",
  nyc_arch_east_village_lower_east_side_historic_district_designated_2012: "East Village / Lower East Side",
  nyc_arch_south_village_historic_district_designated_2013: "South Village / Greenwich Village",
  nyc_arch_brooklyn_bridge_park_pier5_uplands_opening_2017: "Brooklyn Bridge Park / Pier 5",
  nyc_arch_brooklyn_bridge_park_pier2_uplands_opening_2020: "Brooklyn Bridge Park / Pier 2",
  nyc_arch_emily_warren_roebling_plaza_opening_2021: "DUMBO / Brooklyn Bridge Park",
  nyc_arch_barnard_milstein_center_grand_opening_2018: "Morningside Heights",
  nyc_arch_gouverneur_health_modernization_completion_2015: "Lower East Side",
  nyc_arch_lincoln_medical_center_ed_modernization_completion_2014: "Mott Haven",
  bfs_arch_connected_health_training_suite_opened_2016: "Boucher Road",
  bfs_arch_our_ladys_care_home_ot_department_opened_2016: "Belfast",
  bfs_arch_belfast_city_acute_mental_health_unit_sod_cut_2016: "Belfast City Hospital",
  bfs_arch_knockbracken_hall_vaccination_clinic_opened_2021: "Knockbracken",
  bfs_arch_royal_jubilee_maternity_quiet_room_reopened_2021: "Royal Hospitals / West Belfast",
  bfs_arch_rvh_staff_hubs_opened_2023: "Royal Victoria Hospital / West Belfast",
  bfs_arch_sunningdale_gardens_nihe_homes_completed_2024: "North Belfast",
  bfs_arch_royal_hospitals_childrens_hospital_construction_start_2025: "Royal Hospitals / West Belfast"
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

const textFor = (candidate) => [
  candidate.title,
  candidate.summary,
  candidate.category,
  candidate.source_name,
  candidate.source_date_field
].filter(Boolean).join(" ").toLowerCase();

const observedChangeFor = (candidate) => {
  const text = textFor(candidate);
  if (text.includes("approv")) {
    return "A documented planning-approval milestone was recorded for the named built-environment proposal.";
  }
  if (text.includes("sod cut") || text.includes("construction start")) {
    return "A documented construction-start milestone was recorded for the named facility.";
  }
  if (text.includes("listed") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "A documented heritage-designation status change was recorded for the named site.";
  }
  if (text.includes("reopened")) {
    return "A documented reopening milestone was recorded for the named facility.";
  }
  if (text.includes("completed") || text.includes("completion") || text.includes("modernization")) {
    return "A documented completion milestone was recorded for the named facility.";
  }
  return "A documented opening or public-use milestone was recorded for the named facility.";
};

const sourceDateFieldFor = (candidate) => {
  const text = textFor(candidate);
  if (candidate.source_date_field) return candidate.source_date_field;
  if (text.includes("approv")) return "source records the planning committee or approval date";
  if (text.includes("sod cut") || text.includes("construction start")) return "source records the construction-start ceremony date";
  if (text.includes("listed") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "source records the listing, registration, or designation date";
  }
  if (text.includes("reopened")) return "source records the reopening date";
  if (text.includes("completed") || text.includes("completion") || text.includes("modernization")) {
    return "source records the building completion or modernization milestone date";
  }
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
    title: candidate.title,
    summary: candidate.summary,
    observed_change: candidate.observed_change || observedChangeFor(candidate),
    area: candidate.area || areaById[eventId],
    latitude,
    longitude,
    source_ids: [sourceId],
    source_name: candidate.source_name,
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
    limitations: candidate.limitations,
    transformation_method: candidate.transformation_method || "Manual worker candidate extraction from a public source; normalized into the architecture milestone schema with source, date, geometry, confidence, and limitation fields preserved."
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

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
