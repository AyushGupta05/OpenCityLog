const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const reports = [
  JSON.parse(fs.readFileSync("tmp/subagents/nyc_arch_candidates_round80.json", "utf8")),
  JSON.parse(fs.readFileSync("tmp/subagents/belfast_arch_candidates_round80.json", "utf8"))
];

const selectedIds = new Set([
  "nyc_arch_colored_school_no4_landmark_rehab_funding_2023",
  "nyc_arch_barkin_levin_office_pavilion_landmark_designated_2023",
  "nyc_arch_joseph_drake_park_burial_ground_landmark_designated_2023",
  "nyc_arch_old_croton_aqueduct_walk_scenic_landmark_2024",
  "nyc_arch_temple_court_atrium_interior_landmark_designated_2024",
  "nyc_arch_1_wall_street_banking_room_interior_landmark_designated_2024",
  "nyc_arch_former_whitney_museum_landmark_designated_2025",
  "nyc_arch_modulightor_duplex_interior_landmark_designated_2025",
  "nyc_arch_east_river_park_sections_opening_2025",
  "nyc_arch_solar_one_environmental_education_center_opening_2025",
  "bfs_arch_belvoir_sure_start_centre_opening_2015",
  "bfs_arch_youth_justice_agency_charles_house_hq_opening_2024",
  "bfs_arch_rbhsc_bhive_virtual_learning_suite_opening_2024"
]);

const sourceIdsByCity = {
  nyc: "nyc-architecture-public-pages",
  belfast: "belfast-architecture-public-pages"
};

const records = reports
  .flatMap((report) => report.candidates || report)
  .filter((candidate) => selectedIds.has(candidate.proposed_event_id || candidate.event_id))
  .map((candidate) => {
    const { proposed_event_id: proposedEventId, accessed_at: _accessedAt, ...rest } = candidate;
    const eventId = proposedEventId || candidate.event_id;
    const sourceId = sourceIdsByCity[candidate.city_id];
    if (!sourceId) {
      throw new Error(`No source ID mapping for city ${candidate.city_id}`);
    }
    return {
      ...rest,
      event_id: eventId,
      source_ids: [sourceId],
      source_retrieved_at: retrievedAt,
      source_dataset_id: sourceId
    };
  });

if (records.length !== selectedIds.size) {
  throw new Error(`Expected ${selectedIds.size} selected records, found ${records.length}`);
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

const normalizeDate = (value) => {
  if (/^\d{4}$/.test(value)) {
    return `${value}-01-01`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }
  return value;
};

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
