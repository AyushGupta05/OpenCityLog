const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidatePath = "tmp/subagents/london_arch_candidates_round80.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const report = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const retrievedAt = "2026-05-18";
const sourceId = "london-architecture-public-pages";

const selectedIds = new Set([
  "lon_arch_kings_willowfield_building_opening_2023",
  "lon_arch_una_marson_library_opening_2024",
  "lon_arch_ark_white_city_primary_building_opening_2023",
  "lon_arch_camberwell_lodge_care_home_opening_2022",
  "lon_arch_ravenscourt_park_cafe_reopening_2023",
  "lon_arch_our_place_fulham_opening_2024",
  "lon_arch_nw_london_elective_orthopaedic_centre_opening_2024",
  "lon_arch_wembley_community_diagnostic_centre_opening_2024"
]);

const records = report.candidates
  .filter((candidate) => selectedIds.has(candidate.proposed_event_id))
  .map((candidate) => {
    const { proposed_event_id: eventId, accessed_at: _accessedAt, ...rest } = candidate;
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
  if (source.source_id === sourceId) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
