const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round92.json",
  "tmp/subagents/nyc_arch_candidates_round92.json",
  "tmp/subagents/belfast_arch_candidates_round92.json"
];

const selectedIds = new Set([
  "lon_arch_sunderland_harbour_exchange_campus_opening_2025",
  "lon_arch_folajimi_apartments_opening_2024",
  "lon_arch_harold_moody_health_centre_opening_2025",
  "lon_arch_snowsfields_quarter_planning_approval_2025",
  "lon_arch_southwark_enterprise_hub_opening_2025",
  "lon_arch_golden_lane_estate_designed_landscape_registration_2020",
  "lon_arch_alexandra_road_park_registration_2020",
  "lon_arch_stockley_park_registration_2020",
  "lon_arch_willesden_jewish_cemetery_registration_2017",
  "lon_arch_hoop_lane_jewish_cemetery_registration_2020",
  "lon_arch_bunhill_fields_burial_ground_registration_2010",
  "nyc_arch_west_thames_pedestrian_bridge_opening_2019",
  "nyc_arch_flea_theater_new_home_unveiled_2017",
  "nyc_arch_city_tech_academic_complex_official_opening_2019",
  "nyc_arch_nyu_370_jay_street_opening_2019",
  "nyc_arch_roosevelt_house_reopening_2010",
  "nyc_arch_hunter_silberman_school_east_harlem_opening_2011",
  "nyc_arch_alexandria_center_life_science_phase_one_completion_2010",
  "nyc_arch_myrtle_wyckoff_pedestrian_plaza_unveiled_2016",
  "nyc_arch_pepsi_cola_sign_landmark_designated_2016",
  "nyc_arch_park_avenue_historic_district_designated_2014",
  "nyc_arch_east_10th_street_historic_district_designated_2012",
  "nyc_arch_crown_heights_north_ii_historic_district_designated_2011",
  "nyc_arch_stonewall_inn_individual_landmark_designated_2015",
  "bfs_arch_rbhsc_mri_unit_opened_2016",
  "bfs_arch_new_belfast_maternity_hospital_handover_2024",
  "bfs_arch_waterworks_footbridge_steps_approved_2024",
  "bfs_arch_queens_quay_kiosks_canopy_approved_2024",
  "bfs_arch_little_patrick_york_public_realm_approved_2024",
  "bfs_arch_deramore_park_replacement_dwelling_approved_2024",
  "bfs_arch_duncrue_complex_workshop_store_approved_2024"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const urlOverrides = {
  bfs_arch_new_belfast_maternity_hospital_handover_2024:
    "https://belfasttrust.hscni.net/2024/04/03/new-maternity-hospital-closer-to-welcoming-new-babies/"
};

const areaById = {
  lon_arch_sunderland_harbour_exchange_campus_opening_2025: "Canary Wharf / Isle of Dogs",
  lon_arch_folajimi_apartments_opening_2024: "South Bermondsey",
  lon_arch_harold_moody_health_centre_opening_2025: "Southwark",
  lon_arch_snowsfields_quarter_planning_approval_2025: "Snowsfields / London Bridge",
  lon_arch_southwark_enterprise_hub_opening_2025: "Elephant and Castle",
  lon_arch_golden_lane_estate_designed_landscape_registration_2020: "Golden Lane Estate",
  lon_arch_alexandra_road_park_registration_2020: "Camden / South Hampstead",
  lon_arch_stockley_park_registration_2020: "Stockley Park / Hillingdon",
  lon_arch_willesden_jewish_cemetery_registration_2017: "Willesden",
  lon_arch_hoop_lane_jewish_cemetery_registration_2020: "Golders Green",
  lon_arch_bunhill_fields_burial_ground_registration_2010: "Bunhill Fields / Islington",
  nyc_arch_west_thames_pedestrian_bridge_opening_2019: "Battery Park City / Lower Manhattan",
  nyc_arch_flea_theater_new_home_unveiled_2017: "Tribeca / Thomas Street",
  nyc_arch_city_tech_academic_complex_official_opening_2019: "Downtown Brooklyn",
  nyc_arch_nyu_370_jay_street_opening_2019: "Downtown Brooklyn",
  nyc_arch_roosevelt_house_reopening_2010: "Upper East Side / Lenox Hill",
  nyc_arch_hunter_silberman_school_east_harlem_opening_2011: "East Harlem",
  nyc_arch_alexandria_center_life_science_phase_one_completion_2010: "Kips Bay",
  nyc_arch_myrtle_wyckoff_pedestrian_plaza_unveiled_2016: "Bushwick / Ridgewood",
  nyc_arch_pepsi_cola_sign_landmark_designated_2016: "Long Island City",
  nyc_arch_park_avenue_historic_district_designated_2014: "Upper East Side",
  nyc_arch_east_10th_street_historic_district_designated_2012: "East Village",
  nyc_arch_crown_heights_north_ii_historic_district_designated_2011: "Crown Heights",
  nyc_arch_stonewall_inn_individual_landmark_designated_2015: "Greenwich Village",
  bfs_arch_rbhsc_mri_unit_opened_2016: "Royal Hospitals / West Belfast",
  bfs_arch_new_belfast_maternity_hospital_handover_2024: "Royal Hospitals / West Belfast",
  bfs_arch_waterworks_footbridge_steps_approved_2024: "Waterworks Park / North Belfast",
  bfs_arch_queens_quay_kiosks_canopy_approved_2024: "Queen's Quay / Titanic Quarter",
  bfs_arch_little_patrick_york_public_realm_approved_2024: "Little Patrick Street / City Centre",
  bfs_arch_deramore_park_replacement_dwelling_approved_2024: "Deramore Park / South Belfast",
  bfs_arch_duncrue_complex_workshop_store_approved_2024: "Duncrue / North Foreshore"
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
  if (text.includes("registered") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "A documented heritage-designation status change was recorded for the named site.";
  }
  if (text.includes("handover") || text.includes("completed") || text.includes("completion")) {
    return "A documented completion or handover milestone was recorded for the named facility.";
  }
  return "A documented opening or public-use milestone was recorded for the named facility.";
};

const sourceDateFieldFor = (candidate) => {
  const text = textFor(candidate);
  if (candidate.source_date_field) return candidate.source_date_field;
  if (text.includes("approv")) return "source records the planning committee or approval date";
  if (text.includes("registered") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "source records the registration or designation date";
  }
  if (text.includes("handover") || text.includes("completed") || text.includes("completion")) {
    return "source records the building completion or handover date";
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
  const sourceUrl = urlOverrides[eventId] || candidate.source_url;
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
    source_url: sourceUrl,
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
