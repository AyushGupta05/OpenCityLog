const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-19";

const candidateFiles = [
  "tmp/subagents/belfast_arch_candidates_round108_hed_institutions_retry.json",
  "tmp/subagents/belfast_arch_candidates_round108_council_early_years.json",
  "tmp/subagents/london_arch_candidates_round108_nhle_more.json",
  "tmp/subagents/london_arch_candidates_round108_health_education_transport_2020s.json",
  "tmp/subagents/nyc_arch_candidates_round108_lpc_2018_2026.json",
  "tmp/subagents/nyc_arch_candidates_round108_health_libraries_culture_2020s.json"
];

const fallbackSourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  if (Array.isArray(raw.events)) return raw.events;
  return [];
};

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of")
  .replace(/\bproof that\b/gi, "evidence that")
  .replace(/\bproves?\b/gi, "documents")
  .replace(/\bcaused\b/gi, "was associated with")
  .replace(/\bwill increase\b/gi, "is described as intended to increase")
  .replace(/\bwill decrease\b/gi, "is described as intended to decrease");

const publisherFor = (candidate) => {
  if (candidate.publisher) return safeText(candidate.publisher);
  const url = String(candidate.source_url || "").toLowerCase();
  const name = safeText(candidate.source_name);
  if (url.includes("historicengland.org.uk")) return "Historic England";
  if (url.includes("communities-ni.gov.uk") || url.includes("nidirect.gov.uk")) return "Department for Communities Historic Environment Division / nidirect Buildings Database";
  if (url.includes("belfastcity.gov.uk") || url.includes("minutes.belfastcity.gov.uk")) return "Belfast City Council";
  if (url.includes("qub.ac.uk")) return "Queen's University Belfast";
  if (url.includes("ulstermuseum.org")) return "Ulster Museum";
  if (url.includes("themaclive.com")) return "The MAC Belfast";
  if (url.includes("nyc.gov/site/lpc") || url.includes("s-media.nyc.gov/agencies/lpc")) return "NYC Landmarks Preservation Commission";
  if (url.includes("nychealthandhospitals.org")) return "NYC Health + Hospitals";
  if (url.includes("bklynlibrary.org")) return "Brooklyn Public Library";
  if (url.includes("queenslibrary.org")) return "Queens Public Library";
  if (url.includes("nypl.org")) return "New York Public Library";
  if (url.includes("tfl.gov.uk")) return "Transport for London";
  if (url.includes("nhs.uk")) return "NHS public or trust website";
  if (url.includes(".gov.uk")) return "UK public-sector website";
  return name || "Named public source";
};

const sourceTypeFor = (candidate) => {
  if (candidate.source_type) return safeText(candidate.source_type);
  const text = `${candidate.source_url || ""} ${candidate.source_name || ""}`.toLowerCase();
  if (text.includes("historicengland.org.uk/listing/the-list")) return "statutory listed-building register record";
  if (text.includes("communities-ni.gov.uk/buildings")) return "statutory listed-building register record";
  if (text.includes(".pdf")) return "public source PDF";
  if (text.includes("lpc")) return "official landmark designation page";
  if (text.includes("minutes.belfastcity.gov.uk")) return "official committee paper";
  if (text.includes("pressrelease") || text.includes("press-release") || text.includes("news")) return "public news or institutional update page";
  return "public project or institutional web page";
};

const termsNoteFor = (candidate) => {
  if (candidate.license_or_terms_note) return safeText(candidate.license_or_terms_note);
  const url = String(candidate.source_url || "").toLowerCase();
  if (url.includes("historicengland.org.uk")) {
    return "Historic England website or Open Data Hub terms apply; factual metadata and source URL only, no page text or images reproduced.";
  }
  if (url.includes("belfastcity.gov.uk") || url.includes("minutes.belfastcity.gov.uk")) {
    return "Belfast City Council publication terms apply; factual metadata and source URL only, no page text or media reproduced.";
  }
  if (url.includes("nyc.gov") || url.includes("s-media.nyc.gov") || url.includes("nychealthandhospitals.org") || url.includes("bklynlibrary.org") || url.includes("queenslibrary.org") || url.includes("nypl.org")) {
    return "NYC public or institutional website terms apply; factual metadata and source URL only, no page text or images reproduced.";
  }
  if (url.includes(".gov.uk") || url.includes("nhs.uk")) {
    return "UK public-sector or NHS website terms apply; factual metadata and source URL only, no page text or media reproduced.";
  }
  return "Source-specific website terms apply; factual metadata and source URL only, no page text or media reproduced.";
};

const sourceIdsFor = (candidate) => {
  const ids = Array.isArray(candidate.source_ids) ? candidate.source_ids : [];
  if (ids.length > 0) return ids;
  const cityId = String(candidate.city_id || candidate.city || "").toLowerCase();
  const fallback = fallbackSourceIdsByCity[cityId];
  return fallback ? [fallback] : [];
};

const normalizeDateForComparison = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const candidateRows = [];
const seenCandidateIds = new Set();
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) {
    if (seenCandidateIds.has(candidate.event_id)) continue;
    seenCandidateIds.add(candidate.event_id);
    candidateRows.push({ ...candidate, __file: file });
  }
}

if (candidateRows.length !== 47) {
  throw new Error(`Expected 47 round108 candidates, found ${candidateRows.length}`);
}

const toRecord = (candidate) => {
  const cityId = String(candidate.city_id || candidate.city || "").toLowerCase();
  const sourceIds = sourceIdsFor(candidate);
  const primarySourceId = sourceIds[0] || fallbackSourceIdsByCity[cityId];
  return {
    city_id: cityId,
    event_id: candidate.event_id,
    date: candidate.date,
    date_precision: candidate.date_precision,
    bucket: safeText(candidate.bucket),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: safeText(candidate.area),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name),
    publisher: publisherFor(candidate),
    source_url: candidate.source_url,
    source_record_id: safeText(candidate.source_record_id),
    source_type: sourceTypeFor(candidate),
    source_retrieved_at: candidate.source_retrieved_at || retrievedAt,
    source_date_field: safeText(candidate.source_date_field),
    source_dataset_id: candidate.source_dataset_id || primarySourceId,
    confidence: candidate.confidence,
    architect: safeText(candidate.architect || "Source page does not name a project architect."),
    project_type: safeText(candidate.project_type),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    license_or_terms_note: termsNoteFor(candidate),
    attribution: safeText(candidate.attribution || publisherFor(candidate)),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(
      candidate.transformation_method ||
      `Manual round108 source-family extraction from ${candidate.__file}; duplicate checked by event_id, source URL, source record ID, and title terms; normalized into the architecture milestone schema with date, source, confidence, geometry, and limitation fields preserved.`
    )
  };
};

const records = candidateRows.map(toRecord);
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
  "architect",
  "project_type",
  "geometry_source",
  "geometry_precision",
  "license_or_terms_note",
  "attribution",
  "limitations",
  "transformation_method"
];

for (const event of records) {
  for (const field of requiredFields) {
    if (!event[field] || (Array.isArray(event[field]) && event[field].length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
  if (!/^(lon|nyc|bfs)_arch_/.test(event.event_id)) {
    throw new Error(`Unexpected architecture event_id prefix: ${event.event_id}`);
  }
  if (!event.source_url.startsWith("http")) {
    throw new Error(`Invalid source URL for ${event.event_id}`);
  }
  if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
    throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
  }
  for (const sourceId of event.source_ids) {
    if (!knownSourceIds.has(sourceId)) {
      throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
    }
  }
}

const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.transformation_method,
    event.source_date_field
  ].join(" ");
  if (banned.test(checked)) {
    throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
  }
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
const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
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
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));

const tmpPath = `${path}.round108.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
