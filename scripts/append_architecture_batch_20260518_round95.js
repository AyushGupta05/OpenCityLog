const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round95.json",
  "tmp/subagents/nyc_arch_candidates_round95.json",
  "tmp/subagents/belfast_arch_candidates_round95.json"
];

const selectedIds = new Set([
  "lon_arch_triplet_gasholders_kings_cross_listing_2020",
  "lon_arch_bbc_maida_vale_studios_listing_2020",
  "lon_arch_sivill_house_listing_2020",
  "lon_arch_former_ibm_building_south_bank_listing_2020",
  "lon_arch_stapletons_repository_listing_2020",
  "lon_arch_lilian_baylis_house_listing_2021",
  "lon_arch_former_lambeth_county_court_listing_2021",
  "lon_arch_former_kennedy_shop_westow_hill_listing_2022",
  "lon_arch_chelsea_embankment_cabmens_shelter_listing_2022",
  "lon_arch_tangmere_house_mosaic_mural_listing_2022",
  "lon_arch_liverpool_street_great_eastern_memorial_listing_2022",
  "lon_arch_cork_street_19_20_listing_2023",
  "lon_arch_the_albion_listing_2023",
  "lon_arch_northwick_park_k8_kiosk_listing_2023",
  "lon_arch_old_palace_croydon_southern_range_listing_2025",
  "nyc_arch_ccny_spitzer_school_architecture_new_home_dedication_2009",
  "nyc_arch_bcc_gould_memorial_library_capital_projects_completion_2023",
  "nyc_arch_hostos_advisement_center_opening_2024",
  "nyc_arch_queensborough_humanities_theatre_performing_arts_center_reopening_2024",
  "nyc_arch_lehman_nursing_education_research_practice_center_opening_2024",
  "nyc_arch_hunter_student_union_opening_2019",
  "nyc_arch_east_tremont_gotham_health_center_upgrade_2017",
  "nyc_arch_metropolitan_hospital_floodwall_completion_2024",
  "nyc_arch_ida_g_israel_community_health_center_new_location_2025",
  "nyc_arch_lincoln_labor_delivery_suite_opening_2009",
  "nyc_arch_harlem_orthopedic_podiatry_clinic_opening_2026",
  "bfs_arch_marlborough_princes_court_apartments_approved_2025",
  "bfs_arch_the_oval_stadium_redevelopment_approved_2025",
  "bfs_arch_885_shore_road_pavilion_pitch_approved_2025",
  "bfs_arch_kings_hall_plot9_medical_reserved_matters_approved_2025",
  "bfs_arch_lagan_gateway_phase2_approved_2025",
  "bfs_arch_antrim_road_733_735_social_housing_approved_2025",
  "bfs_arch_st_teresas_gac_sports_facilities_approved_2026",
  "bfs_arch_santander_house_transitional_care_approved_2026",
  "bfs_arch_newhill_youth_centre_garden_playcourt_approved_2026",
  "bfs_arch_ulster_hall_facade_lighting_lbc_approved_2026",
  "bfs_arch_mays_meadow_office_public_realm_approved_2026",
  "bfs_arch_bedford_clarence_hotel_conversion_approved_2026",
  "bfs_arch_mount_masonic_hall_social_housing_approved_2026"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const areaById = {
  lon_arch_triplet_gasholders_kings_cross_listing_2020: "King's Cross",
  lon_arch_bbc_maida_vale_studios_listing_2020: "Maida Vale",
  lon_arch_sivill_house_listing_2020: "Bethnal Green",
  lon_arch_former_ibm_building_south_bank_listing_2020: "South Bank",
  lon_arch_stapletons_repository_listing_2020: "Islington",
  lon_arch_lilian_baylis_house_listing_2021: "Vauxhall",
  lon_arch_former_lambeth_county_court_listing_2021: "Lambeth",
  lon_arch_former_kennedy_shop_westow_hill_listing_2022: "Crystal Palace",
  lon_arch_chelsea_embankment_cabmens_shelter_listing_2022: "Chelsea Embankment",
  lon_arch_tangmere_house_mosaic_mural_listing_2022: "Wandsworth",
  lon_arch_liverpool_street_great_eastern_memorial_listing_2022: "Liverpool Street",
  lon_arch_cork_street_19_20_listing_2023: "Mayfair",
  lon_arch_the_albion_listing_2023: "Islington",
  lon_arch_northwick_park_k8_kiosk_listing_2023: "Northwick Park",
  lon_arch_old_palace_croydon_southern_range_listing_2025: "Croydon",
  nyc_arch_ccny_spitzer_school_architecture_new_home_dedication_2009: "Hamilton Heights",
  nyc_arch_bcc_gould_memorial_library_capital_projects_completion_2023: "University Heights",
  nyc_arch_hostos_advisement_center_opening_2024: "Mott Haven",
  nyc_arch_queensborough_humanities_theatre_performing_arts_center_reopening_2024: "Bayside",
  nyc_arch_lehman_nursing_education_research_practice_center_opening_2024: "Bedford Park",
  nyc_arch_hunter_student_union_opening_2019: "Upper East Side",
  nyc_arch_east_tremont_gotham_health_center_upgrade_2017: "East Tremont",
  nyc_arch_metropolitan_hospital_floodwall_completion_2024: "East Harlem",
  nyc_arch_ida_g_israel_community_health_center_new_location_2025: "Coney Island",
  nyc_arch_lincoln_labor_delivery_suite_opening_2009: "Mott Haven",
  nyc_arch_harlem_orthopedic_podiatry_clinic_opening_2026: "Harlem",
  bfs_arch_marlborough_princes_court_apartments_approved_2025: "City Centre / Marlborough House",
  bfs_arch_the_oval_stadium_redevelopment_approved_2025: "The Oval / East Belfast",
  bfs_arch_885_shore_road_pavilion_pitch_approved_2025: "Shore Road",
  bfs_arch_kings_hall_plot9_medical_reserved_matters_approved_2025: "King's Hall",
  bfs_arch_lagan_gateway_phase2_approved_2025: "Lagan Gateway / Annadale",
  bfs_arch_antrim_road_733_735_social_housing_approved_2025: "Antrim Road",
  bfs_arch_st_teresas_gac_sports_facilities_approved_2026: "Glen Road Heights",
  bfs_arch_santander_house_transitional_care_approved_2026: "Mays Meadow",
  bfs_arch_newhill_youth_centre_garden_playcourt_approved_2026: "Whiterock",
  bfs_arch_ulster_hall_facade_lighting_lbc_approved_2026: "Bedford Street / Ulster Hall",
  bfs_arch_mays_meadow_office_public_realm_approved_2026: "Mays Meadow",
  bfs_arch_bedford_clarence_hotel_conversion_approved_2026: "Bedford Street / Clarence Street",
  bfs_arch_mount_masonic_hall_social_housing_approved_2026: "Park Avenue / East Belfast"
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
  if (text.includes("approv") || text.includes("reserved matters") || text.includes("consent")) {
    return "A documented planning-approval or consent milestone was recorded for the named built-environment proposal.";
  }
  if (text.includes("listed") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "A documented heritage-designation status change was recorded for the named site.";
  }
  if (text.includes("reopened")) {
    return "A documented reopening milestone was recorded for the named facility.";
  }
  if (text.includes("completed") || text.includes("completion") || text.includes("upgrade")) {
    return "A documented completion or upgrade milestone was recorded for the named facility.";
  }
  return "A documented opening or public-use milestone was recorded for the named facility.";
};

const sourceDateFieldFor = (candidate) => {
  const text = textFor(candidate);
  if (candidate.source_date_field) return safeText(candidate.source_date_field);
  if (text.includes("approv") || text.includes("reserved matters") || text.includes("consent")) return "source records the planning committee approval or consent date";
  if (text.includes("listed") || text.includes("registration") || text.includes("designated") || text.includes("landmark") || text.includes("historic district")) {
    return "source records the listing, registration, or designation date";
  }
  if (text.includes("reopened")) return "source records the reopening date";
  if (text.includes("completed") || text.includes("completion") || text.includes("upgrade")) {
    return "source records the building completion or upgrade milestone date";
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

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
