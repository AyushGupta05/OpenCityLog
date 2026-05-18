const fs = require("fs");

const milestonePath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidatePath = "tmp/subagents/london_arch_candidates_round72.json";
const selectedIds = new Set([
  "lon_arch_mountview_drama_school_opening_2018",
  "lon_arch_london_south_bank_technical_college_opening_2023",
  "lon_arch_fusebox_kingston_opening_2023",
  "lon_arch_harrow_arts_centre_greenhill_opening_2023",
  "lon_arch_bloqs_meridian_water_completion_2021",
  "lon_arch_holborn_house_opening_2021",
  "lon_arch_studio_voltaire_reopening_2021"
]);

const retrievedAt = "2026-05-18";
const sourceId = "london-architecture-public-pages";

const normalizeDate = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  throw new Error(`Unsupported effective date: ${text}`);
};

const parseProjectType = (candidate) => {
  const text = String(candidate.architect_project_type || "architecture milestone").trim();
  const parts = text.split(";").map((part) => part.trim()).filter(Boolean);
  return {
    architect: parts.length > 1 ? parts[0] : "Source does not identify a separate architect field in the structured candidate review.",
    projectType: parts.length > 1 ? parts.slice(1).join("; ") : text
  };
};

const eventFromCandidate = (candidate) => {
  const eventId = candidate.event_id_suggestion || candidate.event_id;
  const date = normalizeDate(candidate.date || candidate.effective_date);
  const { architect, projectType } = parseProjectType(candidate);
  return {
    city_id: "london",
    event_id: eventId,
    date,
    bucket: "planning/development/architecture/cultural civic education workspace",
    title: candidate.title,
    summary: `${candidate.source_name} records "${candidate.title}" with source date ${candidate.date || candidate.effective_date}.`,
    observed_change: `A documented public, institutional, operator, or project source recorded ${projectType}.`,
    area: candidate.area,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: [sourceId],
    source_name: candidate.source_name,
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: "public project or institutional web record",
    source_retrieved_at: retrievedAt,
    source_date_field: candidate.status_date_basis,
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect,
    project_type: projectType,
    geometry_source: candidate.geocode_note,
    geometry_precision:
      candidate.geocode_note && candidate.geocode_note.toLowerCase().includes("approx")
        ? "approximate point"
        : "source point",
    license_or_terms_note:
      "Source-specific public web terms; factual metadata and source URL retained, with retrieval date 2026-05-18.",
    duplicate_check_note: candidate.duplicate_check_note,
    limitations: candidate.limitations
  };
};

const payload = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
const candidates = Array.isArray(payload) ? payload : payload.candidates || payload.records || payload.items || payload.events;
if (!Array.isArray(candidates)) {
  throw new Error(`No candidate array found in ${candidatePath}`);
}

const records = candidates
  .filter((candidate) => selectedIds.has(candidate.event_id_suggestion || candidate.event_id))
  .map(eventFromCandidate);

if (records.length !== selectedIds.size) {
  throw new Error(`Expected ${selectedIds.size} selected records, found ${records.length}`);
}

const doc = JSON.parse(fs.readFileSync(milestonePath, "utf8"));
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
  if (source.source_id === sourceId) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(milestonePath, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${milestonePath}`);
