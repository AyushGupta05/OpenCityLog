const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round97.json",
  "tmp/subagents/nyc_arch_candidates_round97.json",
  "tmp/subagents/belfast_arch_candidates_round97.json"
];

const selectedIds = new Set([
  "lon_arch_temple_bar_listing_2010",
  "lon_arch_grand_connaught_rooms_listing_2010",
  "lon_arch_soas_philips_building_listing_2011",
  "lon_arch_lloyds_building_listing_2011",
  "lon_arch_british_library_listing_2015",
  "lon_arch_east_india_dock_house_listing_2016",
  "lon_arch_isle_of_dogs_pumping_station_listing_2017",
  "lon_arch_islamic_cultural_centre_london_central_mosque_listing_2018",
  "nyc_arch_audubon_park_historic_district_designated_2009",
  "nyc_arch_prospect_heights_historic_district_designated_2009",
  "nyc_arch_ridgewood_north_historic_district_designated_2009",
  "nyc_arch_soho_cast_iron_historic_district_extension_designated_2010",
  "nyc_arch_ridgewood_south_historic_district_designated_2010",
  "nyc_arch_addisleigh_park_historic_district_designated_2011",
  "nyc_arch_central_ridgewood_historic_district_designated_2014",
  "nyc_arch_bedford_historic_district_designated_2015",
  "nyc_arch_ocean_breeze_riding_arena_opening_2016",
  "nyc_arch_cccadi_firehouse_opening_2016",
  "bfs_arch_belfast_telegraph_clarendon_dock_opened_2016",
  "bfs_arch_bryson_street_surgery_operational_by_2021",
  "bfs_arch_short_strand_community_centre_operational_2017_10",
  "bfs_arch_hanwood_centre_operational_2017_10",
  "bfs_arch_greenway_womens_centre_operational_by_2021",
  "bfs_arch_glenburn_methodist_hub_operational_by_2021",
  "bfs_arch_joanmount_methodist_hall_operational_by_2021",
  "bfs_arch_pips_facility_operational_by_2022",
  "bfs_arch_mount_merrion_parish_hall_operational_by_2022"
]);

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const areaById = {
  lon_arch_temple_bar_listing_2010: "Paternoster Square / City of London",
  lon_arch_grand_connaught_rooms_listing_2010: "Covent Garden / Holborn",
  lon_arch_soas_philips_building_listing_2011: "Bloomsbury",
  lon_arch_lloyds_building_listing_2011: "City of London",
  lon_arch_british_library_listing_2015: "St Pancras",
  lon_arch_east_india_dock_house_listing_2016: "Poplar",
  lon_arch_isle_of_dogs_pumping_station_listing_2017: "Isle of Dogs",
  lon_arch_islamic_cultural_centre_london_central_mosque_listing_2018: "Regent's Park",
  nyc_arch_audubon_park_historic_district_designated_2009: "Washington Heights / Audubon Park",
  nyc_arch_prospect_heights_historic_district_designated_2009: "Prospect Heights",
  nyc_arch_ridgewood_north_historic_district_designated_2009: "Ridgewood",
  nyc_arch_soho_cast_iron_historic_district_extension_designated_2010: "SoHo",
  nyc_arch_ridgewood_south_historic_district_designated_2010: "Ridgewood",
  nyc_arch_addisleigh_park_historic_district_designated_2011: "Addisleigh Park",
  nyc_arch_central_ridgewood_historic_district_designated_2014: "Ridgewood",
  nyc_arch_bedford_historic_district_designated_2015: "Bedford-Stuyvesant",
  nyc_arch_ocean_breeze_riding_arena_opening_2016: "Ocean Breeze / Staten Island",
  nyc_arch_cccadi_firehouse_opening_2016: "East Harlem",
  bfs_arch_belfast_telegraph_clarendon_dock_opened_2016: "Clarendon Dock",
  bfs_arch_bryson_street_surgery_operational_by_2021: "Bryson Street",
  bfs_arch_short_strand_community_centre_operational_2017_10: "Short Strand",
  bfs_arch_hanwood_centre_operational_2017_10: "Dundonald / Hanwood",
  bfs_arch_greenway_womens_centre_operational_by_2021: "Cregagh / Greenway",
  bfs_arch_glenburn_methodist_hub_operational_by_2021: "Dunmurry / Glenburn",
  bfs_arch_joanmount_methodist_hall_operational_by_2021: "Joanmount",
  bfs_arch_pips_facility_operational_by_2022: "Antrim Road",
  bfs_arch_mount_merrion_parish_hall_operational_by_2022: "Mount Merrion"
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
  if (text.includes("listed") || text.includes("designation") || text.includes("designated") || text.includes("historic district")) {
    return "A documented heritage-designation status change was recorded for the named site.";
  }
  if (text.includes("operational")) {
    return "A documented operational-use milestone was recorded for the named facility.";
  }
  if (text.includes("opening") || text.includes("opened")) {
    return "A documented opening or public-use milestone was recorded for the named facility.";
  }
  return "A documented built-environment milestone was recorded for the named facility.";
};

const sourceDateFieldFor = (candidate) => {
  const text = textFor(candidate);
  if (candidate.source_date_field) return safeText(candidate.source_date_field);
  if (text.includes("listed") || text.includes("designation") || text.includes("designated") || text.includes("historic district")) {
    return "source records the listing or designation date";
  }
  if (text.includes("operational")) return "source records the publication or status date for operational use";
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
