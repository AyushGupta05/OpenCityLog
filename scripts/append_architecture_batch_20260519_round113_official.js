const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidateFiles = [
  "tmp/subagents/round113_london_gla_candidates.json",
  "tmp/subagents/round113_nyc_dcp_candidates.json",
  "tmp/subagents/round113_nyc_capital_candidates.json",
  "tmp/subagents/round113_belfast_official_candidates.json"
];
const retrievedAt = "2026-05-19";

const sourceIdAliases = {
  "planning-london-datahub-applications": "gla-planning-datahub-applications"
};
const rejectedEventIds = new Set([
  "nyc_arch_x487_ps_639_st_anns_school_opening_2024_candidate",
  "bfs_arch_transport_hub_condition_5_notice_opinion_2026"
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

const doc = readJson(path);

const candidates = candidateFiles.flatMap((file) => {
  const raw = readJson(file);
  const rows = Array.isArray(raw) ? raw : (raw.candidates || raw.records || raw.events || []);
  return rows.map((candidate) => ({ ...candidate, __file: file }));
});

if (candidates.length !== 47) {
  throw new Error(`Expected 47 round113 candidates, found ${candidates.length}`);
}
const acceptedCandidates = candidates.filter((candidate) => !rejectedEventIds.has(candidate.event_id));
if (acceptedCandidates.length !== 45) {
  throw new Error(`Expected 45 accepted round113 candidates, found ${acceptedCandidates.length}`);
}

const sourceEntries = [
  {
    source_id: "gla-planning-application-decisions",
    city_ids: ["london"],
    title: "Greater London Authority planning application decisions",
    publisher: "Greater London Authority / London City Hall",
    bucket: "planning/development/architecture",
    access_url: "https://www.london.gov.uk/programmes-strategies/planning/planning-applications-and-decisions/planning-application-decisions",
    licence: "GLA website terms; factual metadata and source URLs retained pending source-level reuse review.",
    licence_url: "https://www.london.gov.uk/about-us/governance-and-spending/privacy-policies/website-terms-and-conditions",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected mayoral strategic planning referral decisions from the 2008-2026 architecture corpus window.",
    spatial_granularity: "GLA application/site or associated Datahub application centroid where available.",
    temporal_granularity: "GLA report or decision date.",
    update_frequency: "Decision-specific publication",
    retrieved_at: retrievedAt,
    limitations: "GLA Stage 1, Stage 2, call-in, and direction records are administrative planning-process milestones. They do not document construction start, completion, occupation, opening, delivered design quality, or outcome effects."
  },
  {
    source_id: "gla-planning-datahub-applications",
    city_ids: ["london"],
    title: "Planning London Datahub - planning applications",
    publisher: "Greater London Authority / London planning authorities",
    bucket: "planning/development/architecture",
    access_url: "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/",
    licence: "London Datastore dataset page does not specify a single open licence; factual metadata and source URLs retained pending terms review.",
    licence_url: "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/",
    coverage_years: { start: 2020, end: 2026 },
    time_coverage: "Selected application rows with relevant application/status dates in the 2020-2026 Datahub window.",
    spatial_granularity: "Application centroid or site point from the Datahub row where available.",
    temporal_granularity: "Validation, decision, commencement, completion, or status dates as supplied by borough feeds.",
    update_frequency: "Daily according to the London Datastore dataset page.",
    retrieved_at: retrievedAt,
    limitations: "Planning London Datahub rows are administrative application records and can vary by borough feed/backfill quality. Centroids may be approximate. Rows do not by themselves document construction completion, opening, occupation, or outcome effects."
  },
  {
    source_id: "nyc-dcp-zap-project-data",
    city_ids: ["nyc"],
    title: "Zoning Application Portal project data",
    publisher: "New York City Department of City Planning",
    bucket: "planning/development/architecture/zoning",
    access_url: "https://data.cityofnewyork.us/d/hgx4-8ukb",
    licence: "NYC Open Data / NYC.gov Terms of Use; ZAP API and portal factual metadata cited with attribution.",
    licence_url: "https://www.nyc.gov/home/terms-of-use.page",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected ZAP/ULURP/CEQR approval records in the architecture corpus window.",
    spatial_granularity: "Project, action, and BBL-derived navigation point from ZAP details where available.",
    temporal_granularity: "Approval date or project milestone date in ZAP.",
    update_frequency: "NYC Open Data and ZAP portal refresh cadence is dataset/API-specific.",
    retrieved_at: retrievedAt,
    limitations: "ZAP records document land-use, zoning, CEQR, certification, authorization, or special-permit milestones. They are not evidence of construction start, completion, occupancy, design authorship, public opening, or outcome effects."
  },
  {
    source_id: "nyc-parks-capital-project-tracker-4hcv-tc5r",
    city_ids: ["nyc"],
    title: "NYC Parks Capital Project Tracker",
    publisher: "NYC Department of Parks and Recreation via NYC Open Data",
    bucket: "planning/development/architecture/public_realm",
    access_url: "https://data.cityofnewyork.us/Recreation/Capital-Project-Tracker/4hcv-tc5r",
    licence: "NYC Open Data / NYC.gov terms; dataset metadata license field is null.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected capital tracker rows with completion/status dates in the 2008-2026 architecture corpus window.",
    spatial_granularity: "Parks project or park point from tracker latitude/longitude.",
    temporal_granularity: "Month-level construction actual completion where provided.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "Tracker completion is a capital-project status record at tracker/date precision. It does not provide as-built drawings, measured work footprints, public-opening dates, operating status, or outcome effects."
  },
  {
    source_id: "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
    city_ids: ["nyc"],
    title: "HPD affordable housing production by project and building",
    publisher: "NYC Department of Housing Preservation and Development via NYC Open Data",
    bucket: "planning/development/architecture/housing",
    access_url: "https://data.cityofnewyork.us/Housing-Development/Affordable-Housing-Production-by-Project/hq68-rnsi",
    licence: "NYC Open Data / NYC.gov terms; dataset metadata license field is null.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2014, end: 2026 },
    time_coverage: "HPD housing-production projects after January 2014, with selected project/building completion rows in this batch.",
    spatial_granularity: "Project/building row with BBL/BIN/address and coordinates where provided.",
    temporal_granularity: "HPD project completion date.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "HPD completion is a housing-production administrative milestone. It is not necessarily first occupancy, DOB final certificate, ribbon cutting, completion of every non-housing space, or outcome evidence."
  },
  {
    source_id: "bcc-hed-listing-notifications-20260519",
    city_ids: ["belfast"],
    title: "Belfast Planning Committee HED listing notifications, 19 May 2026",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://minutes.belfastcity.gov.uk/documents/s127785/20260519HEDListingStructures.pdf",
    licence: "Belfast City Council copyright for committee papers; underlying DfC/HED statutory factual information may be Crown copyright / OGL where applicable. Factual metadata and source URLs retained.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2026, end: 2026 },
    time_coverage: "19 May 2026 committee report and appendices.",
    spatial_granularity: "Named structure, property, or approximate address point.",
    temporal_granularity: "Committee report date and HED notification status text.",
    update_frequency: "Meeting/report-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Confirmed-listing notifications can lag the underlying HED designation date, and proposed-listing records are not final statutory listing. These are heritage-status records, not evidence of physical works, building condition, reuse, or outcome effects."
  },
  {
    source_id: "bcc-planning-committee-agenda-20260519",
    city_ids: ["belfast"],
    title: "Belfast Planning Committee agenda reports, 19 May 2026",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture",
    access_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=12351",
    licence: "Belfast City Council copyright; factual metadata and source URLs only until fuller reuse terms are reviewed.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2026, end: 2026 },
    time_coverage: "19 May 2026 meeting-specific reports.",
    spatial_granularity: "Planning application, committee item, address, or site description.",
    temporal_granularity: "Meeting/report date and recommendation text.",
    update_frequency: "Meeting-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Agenda reports and officer recommendations are not final committee decisions unless minutes or decision notices confirm action. They do not document construction start, completion, occupation, opening, or public use."
  },
  
];

for (const sourceEntry of sourceEntries) {
  const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
  if (index >= 0) {
    doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
  } else {
    doc.sources.push(sourceEntry);
  }
}

const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));

const safeText = (value) => String(value || "")
  .replace(/\bdoes not prove\b/gi, "does not document")
  .replace(/\bnot proof of\b/gi, "not evidence of")
  .replace(/\bas proof of\b/gi, "as evidence of")
  .replace(/\bproof that\b/gi, "evidence that")
  .replace(/\bproof\b/gi, "evidence")
  .replace(/\bproves?\b/gi, "documents")
  .replace(/\bcaused\b/gi, "was associated with")
  .replace(/\bwill increase\b/gi, "is described as intended to increase")
  .replace(/\bwill decrease\b/gi, "is described as intended to decrease");

const normalizeDateForComparison = (value) => {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
};

const canonicalSourceId = (sourceId) => sourceIdAliases[sourceId] || sourceId;

const eventIdFor = (candidate) => safeText(candidate.event_id).replace(/_candidate$/, "");

const records = acceptedCandidates.map((candidate) => {
  const sourceIds = (candidate.source_ids || [candidate.source_id]).map(canonicalSourceId);
  return {
    city_id: candidate.city_id,
    event_id: eventIdFor(candidate),
    date: candidate.date || candidate.effective_date,
    date_precision: candidate.date_precision || candidate.effective_date_precision || "day",
    bucket: safeText(candidate.category || "architecture/official_record"),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: safeText(candidate.location_name || candidate.address || candidate.city_id),
    latitude: candidate.lat ?? candidate.latitude,
    longitude: candidate.lon ?? candidate.longitude,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name),
    publisher: safeText(candidate.publisher),
    source_url: candidate.source_url,
    source_record_id: safeText(candidate.source_record_id),
    source_type: safeText(candidate.source_type),
    source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || retrievedAt,
    source_date_field: safeText(candidate.source_date_field || "Observed administrative date from the cited source record."),
    source_dataset_id: canonicalSourceId(candidate.source_dataset_id || candidate.source_id),
    confidence: candidate.confidence,
    architect: safeText(candidate.architect || "Source record does not name a project architect."),
    project_type: safeText(candidate.subcategory || candidate.category || "official architecture-related administrative record"),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    license_or_terms_note: safeText(candidate.license || candidate.license_or_terms_note),
    attribution: safeText(candidate.attribution || candidate.publisher),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(
      `${candidate.transformation_method || `Round113 extraction from ${candidate.__file}.`} Normalized by scripts/append_architecture_batch_20260519_round113_official.js with canonical source IDs, duplicate checks, overclaim wording cleanup, current-date guards, city coordinate envelopes, and provenance fields preserved.`
    )
  };
});

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
    const value = event[field];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`Missing ${field} for ${event.event_id}`);
    }
  }
  if (event.city_id === "belfast" && !/^bfs_arch_/.test(event.event_id)) {
    throw new Error(`Unexpected Belfast event_id prefix: ${event.event_id}`);
  }
  if (event.city_id === "london" && !/^lon_arch_/.test(event.event_id)) {
    throw new Error(`Unexpected London event_id prefix: ${event.event_id}`);
  }
  if (event.city_id === "nyc" && !/^nyc_arch_/.test(event.event_id)) {
    throw new Error(`Unexpected NYC event_id prefix: ${event.event_id}`);
  }
  if (!event.source_url.startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
  if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
    throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
  }
  for (const sourceId of event.source_ids) {
    if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
  }
}

const banned = /\b(caused|proves?|proof|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
for (const event of records) {
  const checked = [
    event.title,
    event.summary,
    event.observed_change,
    event.limitations,
    event.transformation_method,
    event.source_date_field,
    event.project_type
  ].join(" ");
  if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
}

const batchIds = new Set();
const batchSourceKeys = new Set();
for (const event of records) {
  if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
  batchIds.add(event.event_id);

  const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
  if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
  batchSourceKeys.add(sourceKey);
}

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);

const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
const duplicateSourceRecords = records
  .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
  .map((event) => event.event_id);
if (duplicateSourceRecords.length > 0) throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);

const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
const duplicateTitleDates = records
  .filter((event) => existingTitleDateKeys.has(`${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`))
  .map((event) => event.event_id);
if (duplicateTitleDates.length > 0) throw new Error(`Duplicate title/date records: ${duplicateTitleDates.join(", ")}`);

const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
if (futureRecords.length > 0) throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);

const cityEnvelopes = {
  belfast: { minLon: -6.12, maxLon: -5.74, minLat: 54.45, maxLat: 54.75 },
  london: { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 },
  nyc: { minLon: -74.2591, maxLon: -73.7004, minLat: 40.4774, maxLat: 40.9176 }
};

for (const event of records) {
  const envelope = cityEnvelopes[event.city_id];
  if (!envelope) throw new Error(`Unknown city envelope for ${event.event_id}`);
  const longitude = Number(event.longitude);
  const latitude = Number(event.latitude);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < envelope.minLon ||
    longitude > envelope.maxLon ||
    latitude < envelope.minLat ||
    latitude > envelope.maxLat
  ) {
    throw new Error(`Invalid or outside-${event.city_id}-envelope coordinates for ${event.event_id}`);
  }
}

doc.events.push(...records);
doc.events.sort((a, b) => (
  a.city_id.localeCompare(b.city_id) ||
  String(a.date).localeCompare(String(b.date)) ||
  a.event_id.localeCompare(b.event_id)
));
doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

const tmpPath = `${path}.round113-official.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
