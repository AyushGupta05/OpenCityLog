const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const reports = [
  JSON.parse(fs.readFileSync("tmp/subagents/london_arch_candidates_round82.json", "utf8")),
  JSON.parse(fs.readFileSync("tmp/subagents/nyc_arch_candidates_round82.json", "utf8")),
  JSON.parse(fs.readFileSync("tmp/subagents/belfast_arch_candidates_round82.json", "utf8"))
];

const skippedIds = new Set([
  "lon_arch_qmul_graduate_centre_opening_2017",
  "lon_arch_ucl_22_gordon_street_reopening_2016",
  "nyc_arch_cooper_hewitt_carnegie_mansion_reopening_2014"
]);

const sourceIdsByCity = {
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages",
  belfast: "belfast-architecture-public-pages"
};

const records = reports
  .flatMap((report) => report.candidates || report)
  .filter((candidate) => !skippedIds.has(candidate.proposed_event_id || candidate.event_id))
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

if (records.length !== 33) {
  throw new Error(`Expected 33 selected records, found ${records.length}`);
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
