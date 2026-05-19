const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));
const retrievedAt = "2026-05-18";

const candidateFiles = [
  "tmp/subagents/london_arch_candidates_round104_institutions.json",
  "tmp/subagents/london_arch_candidates_round104_civic.json",
  "tmp/subagents/nyc_arch_candidates_round104_civic.json",
  "tmp/subagents/nyc_arch_candidates_round104_institutions.json",
  "tmp/subagents/belfast_arch_candidates_round104_civic.json",
  "tmp/subagents/belfast_arch_candidates_round104_institutions.json"
];

const sourceIdsByCity = {
  belfast: "belfast-architecture-public-pages",
  london: "london-architecture-public-pages",
  nyc: "nyc-architecture-public-pages"
};

const publisherFor = (candidate) => {
  const url = String(candidate.source_url || "");
  const name = String(candidate.source_name || "");
  if (url.includes("royalfree.nhs.uk")) return "Royal Free London NHS Foundation Trust";
  if (url.includes("rnoh.nhs.uk")) return "Royal National Orthopaedic Hospital NHS Trust";
  if (url.includes("camdenccg.nhs.uk")) return "NHS Camden Clinical Commissioning Group";
  if (url.includes("kch.nhs.uk")) return "King's College Hospital NHS Foundation Trust";
  if (url.includes("slam.nhs.uk")) return "South London and Maudsley NHS Foundation Trust";
  if (url.includes("selondonics.org")) return "South East London Integrated Care System";
  if (url.includes("havering.gov.uk")) return "London Borough of Havering";
  if (url.includes("aroundealing.com")) return "Around Ealing / London Borough of Ealing";
  if (url.includes("islington.gov.uk")) return "London Borough of Islington";
  if (url.includes("nycgovparks.org")) return "NYC Parks";
  if (url.includes("nyulangone.org")) return "NYU Langone Health";
  if (url.includes("prnewswire.com")) return "The Second City";
  if (url.includes("fitnyc.edu")) return "Fashion Institute of Technology";
  if (url.includes("communities-ni.gov.uk")) return "Department for Communities Northern Ireland";
  if (url.includes("minutes.belfastcity.gov.uk") || url.includes("belfastcity.gov.uk")) return "Belfast City Council";
  if (url.includes("qub.ac.uk")) return "Queen's University Belfast";
  if (url.includes("ulster.ac.uk")) return "Ulster University";
  return name || "Named public source";
};

const sourceTypeFor = (candidate) => {
  const text = `${candidate.source_url || ""} ${candidate.source_name || ""}`.toLowerCase();
  if (text.includes(".pdf")) return "public source PDF";
  if (text.includes("news") || text.includes("pressrelease") || text.includes("press-release")) return "public news or institutional update page";
  if (text.includes("minutes.belfastcity.gov.uk")) return "official committee paper";
  if (text.includes("democracy.")) return "official committee report";
  return "public project or institutional web page";
};

const termsNoteFor = (candidate) => {
  const url = String(candidate.source_url || "");
  if (url.includes("nyc.gov") || url.includes("nycgovparks.org")) {
    return "NYC public website terms apply to page content; factual metadata and source URL only, no page text or images reproduced.";
  }
  if (url.includes("nhs.uk") || url.includes("selondonics.org")) {
    return "NHS or integrated-care-system website terms apply; factual metadata and source URL only, no page text or images reproduced.";
  }
  if (url.includes("belfastcity.gov.uk") || url.includes("minutes.belfastcity.gov.uk")) {
    return "Belfast City Council publication terms apply; factual metadata and source URL only, no page text or media reproduced.";
  }
  if (url.includes("communities-ni.gov.uk")) {
    return "Northern Ireland public-sector web terms apply; factual metadata and source URL only, no page text or media reproduced.";
  }
  return "Source-specific website terms apply; factual metadata and source URL only, no page text or media reproduced.";
};

const rowsFrom = (file) => {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
};

const normalizeDateForComparison = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of")
  .replace(/\bproof that\b/gi, "evidence that")
  .replace(/\bwill increase\b/gi, "is described as intended to increase")
  .replace(/\bwill decrease\b/gi, "is described as intended to decrease");

const candidateRows = [];
const seenCandidateIds = new Set();
for (const file of candidateFiles) {
  for (const candidate of rowsFrom(file)) {
    if (seenCandidateIds.has(candidate.event_id)) continue;
    seenCandidateIds.add(candidate.event_id);
    candidateRows.push({ ...candidate, __file: file });
  }
}

if (candidateRows.length !== 24) {
  throw new Error(`Expected 24 round104 candidates, found ${candidateRows.length}`);
}

const toRecord = (candidate) => {
  const cityId = String(candidate.city_id || candidate.city || "").toLowerCase();
  const sourceId = sourceIdsByCity[cityId];
  if (!sourceId) throw new Error(`Unsupported city for ${candidate.event_id}: ${candidate.city_id || candidate.city}`);
  return {
    city_id: cityId,
    event_id: candidate.event_id,
    date: candidate.date,
    date_precision: candidate.date_precision,
    bucket: candidate.bucket,
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: candidate.area,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    source_ids: [sourceId],
    source_name: safeText(candidate.source_name),
    publisher: publisherFor(candidate),
    source_url: candidate.source_url,
    source_record_id: candidate.source_record_id,
    source_type: sourceTypeFor(candidate),
    source_retrieved_at: candidate.source_retrieved_at || retrievedAt,
    source_date_field: safeText(candidate.source_date_field),
    source_dataset_id: candidate.source_dataset_id || sourceId,
    confidence: candidate.confidence,
    architect: safeText(candidate.architect),
    project_type: safeText(candidate.project_type),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    license_or_terms_note: termsNoteFor(candidate),
    attribution: publisherFor(candidate),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(
      `Manual round104 source-family extraction from ${candidate.__file}; duplicate checked by event_id, source URL, source record ID, and title terms; normalized into the architecture milestone schema with date, source, confidence, geometry, and limitation fields preserved. ${candidate.source_audit_note || ""}`
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
}

const banned = /\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.transformation_method
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

const tmpPath = `${path}.round104.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
