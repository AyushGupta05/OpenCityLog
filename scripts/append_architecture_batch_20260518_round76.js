const fs = require("fs");

const milestonePath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const inputPaths = ["tmp/subagents/london_arch_candidates_round75.json"];

const retrievedAt = "2026-05-18";
const sourceByCity = {
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages",
  belfast: "belfast-architecture-public-pages"
};

const cityFromId = (eventId) => {
  if (eventId.startsWith("lon_arch_")) return "london";
  if (eventId.startsWith("nyc_arch_")) return "nyc";
  if (eventId.startsWith("bfs_arch_")) return "belfast";
  throw new Error(`Cannot infer city_id from ${eventId}`);
};

const normalizeDate = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  throw new Error(`Unsupported effective date: ${text}`);
};

const bucketFromCandidate = (candidate) => {
  const category = String(candidate.category || "").trim();
  if (category.startsWith("planning/")) return category;
  const label = category || candidate.project_type || "architecture milestone";
  return `planning/development/architecture/${label.replace(/_/g, " ")}`;
};

const eventFromCandidate = (candidate) => {
  const eventId = candidate.event_id_suggestion || candidate.event_id;
  if (!eventId) {
    throw new Error(`Candidate missing event ID: ${candidate.title}`);
  }
  const cityId = cityFromId(eventId);
  const sourceId = sourceByCity[cityId];
  const effectiveDate = candidate.effective_date || candidate.date;

  return {
    city_id: cityId,
    event_id: eventId,
    date: normalizeDate(effectiveDate),
    bucket: bucketFromCandidate(candidate),
    title: candidate.title,
    summary: `${candidate.source_name} records "${candidate.title}" with source date ${effectiveDate}.`,
    observed_change: `A documented ${candidate.source_type || "public source"} recorded ${candidate.project_type}.`,
    area: candidate.area,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: [sourceId],
    source_name: candidate.source_name,
    publisher: candidate.publisher,
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: candidate.source_type,
    source_retrieved_at: retrievedAt,
    source_date_field: candidate.status_date_basis,
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: "The structured candidate review did not identify a separate architect field for this record.",
    project_type: candidate.project_type,
    geometry_source: candidate.geocode_note,
    geometry_precision:
      candidate.geocode_note && candidate.geocode_note.toLowerCase().includes("approx")
        ? "approximate point"
        : "source point",
    license_or_terms_note: candidate.license_or_terms_note,
    duplicate_check_note: candidate.duplicate_check_note,
    limitations: candidate.limitations
  };
};

const loadCandidates = (inputPath) => {
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const candidates = Array.isArray(payload) ? payload : payload.candidates || payload.records || payload.items || payload.events;
  if (!Array.isArray(candidates)) {
    throw new Error(`No candidate array found in ${inputPath}`);
  }
  return candidates;
};

const doc = JSON.parse(fs.readFileSync(milestonePath, "utf8"));
const records = inputPaths.flatMap(loadCandidates).map(eventFromCandidate);
const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);

const futureRecords = records.filter((event) => new Date(`${event.date}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) {
  throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);
}

const missingCore = records.filter((event) => {
  return (
    !event.event_id ||
    !event.title ||
    !event.summary ||
    !event.observed_change ||
    !event.source_url ||
    !event.source_retrieved_at ||
    !event.source_date_field ||
    !event.limitations ||
    event.latitude === null ||
    event.longitude === null
  );
});
if (missingCore.length > 0) {
  throw new Error(`Records missing required fields: ${missingCore.map((event) => event.event_id).join(", ")}`);
}

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

const newIds = new Set();
const duplicateNewIds = [];
for (const record of records) {
  if (newIds.has(record.event_id)) duplicateNewIds.push(record.event_id);
  newIds.add(record.event_id);
}
if (duplicateNewIds.length > 0) {
  throw new Error(`Duplicate IDs inside batch: ${duplicateNewIds.join(", ")}`);
}

const duplicateSourceRecords = records
  .filter((event) =>
    doc.events.some(
      (existing) =>
        existing.city_id === event.city_id &&
        existing.source_record_id === event.source_record_id &&
        existing.source_url === event.source_url
    )
  )
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) {
  throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);
}

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (Object.values(sourceByCity).includes(source.source_id)) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(milestonePath, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${milestonePath}`);
