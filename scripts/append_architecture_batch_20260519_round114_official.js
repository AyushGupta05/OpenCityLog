const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const candidateFiles = [
  "tmp/subagents/round114_belfast_planning_portal_architecture_records.json",
  "tmp/subagents/round114_london_heritage_candidates.json",
  "tmp/subagents/round114_nyc_lpc_landmarks_official/round114_nyc_lpc_landmarks_candidates.json"
];
const retrievedAt = "2026-05-19";

const rejectedEventIds = new Set([
  "belfast_arch_2022_weavers_cross_outline_recommendation_la04_2021_2856_o",
  "belfast_arch_2026_ulster_hall_facade_lighting_lbc_la04_2025_2216_lbc",
  "belfast_arch_2018_ni_regional_war_room_listed_hb26_18_099"
]);

const sourceIdAliases = {
  belfast_city_council_planning_minutes: "bcc-planning-committee-minutes",
  belfast_city_council_belfast_stories_pages: "belfast-city-council-belfast-stories-pages",
  dfc_hed_listed_buildings_register: "dfc-hed-nidirect-buildings",
  dfi_called_in_planning_documents: "dfi-called-in-planning-documents"
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

const doc = readJson(path);

const candidates = candidateFiles.flatMap((file) => {
  const raw = readJson(file);
  const rows = Array.isArray(raw) ? raw : (raw.candidates || raw.records || raw.events || []);
  return rows.map((candidate) => ({ ...candidate, __file: file }));
});

if (candidates.length !== 30) {
  throw new Error(`Expected 30 round114 candidates, found ${candidates.length}`);
}
const acceptedCandidates = candidates.filter((candidate) => !rejectedEventIds.has(candidate.event_id));
if (acceptedCandidates.length !== 27) {
  throw new Error(`Expected 27 accepted round114 candidates, found ${acceptedCandidates.length}`);
}

const sourceEntries = [
  {
    source_id: "dfi-called-in-planning-documents",
    city_ids: ["belfast"],
    title: "DfI regionally significant and called-in planning publications",
    publisher: "Department for Infrastructure / Belfast City Council",
    bucket: "planning/development/architecture/transport_infrastructure",
    access_url: "https://www.infrastructure-ni.gov.uk/topics/planning/regionally-significant-developments-and-called-applications",
    licence: "Open Government Licence v3.0 for Crown copyright material unless otherwise stated; Belfast committee PDFs may have council terms.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected called-in or regionally significant planning records in the 2008-2026 architecture corpus window.",
    spatial_granularity: "Application/site point from named official planning documents.",
    temporal_granularity: "Decision, report, consultation, or advert date as stated in official planning material.",
    update_frequency: "Application-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Called-in and regionally significant planning records document administrative planning status. They are not evidence of construction start, completion, occupation, opening, service frequency, patronage, or outcome effects."
  },
  {
    source_id: "belfast-city-council-belfast-stories-pages",
    city_ids: ["belfast"],
    title: "Belfast Stories project and consultation pages",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture/civic_buildings",
    access_url: "https://www.belfastcity.gov.uk/BelfastStories/What-is-it",
    licence: "Belfast City Council website terms; factual metadata and source URLs retained pending terms review.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2022, end: 2026 },
    time_coverage: "Selected Belfast Stories project-stage and consultation records.",
    spatial_granularity: "Named civic project site point.",
    temporal_granularity: "Project-stage or consultation date stated by the council page.",
    update_frequency: "Project-stage updates",
    retrieved_at: retrievedAt,
    limitations: "Project pages and consultation notices are civic/project-stage milestones, not planning decisions, construction starts, completion, opening, future benefits, or outcome evidence."
  },
  {
    source_id: "historic-england-har-2025",
    city_ids: ["london"],
    title: "Historic England Heritage at Risk Register 2025",
    publisher: "Historic England",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://historicengland.org.uk/whats-new/news/heritage-at-risk-2025/",
    licence: "Historic England website terms for announcement pages; Historic England GIS open data under OGL v3.0 where used for factual markers.",
    licence_url: "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/",
    coverage_years: { start: 2025, end: 2025 },
    time_coverage: "2025 annual Heritage at Risk announcement and linked register/list-entry records.",
    spatial_granularity: "Named heritage site point from NHLE/HAR context where available.",
    temporal_granularity: "Annual register publication/status date.",
    update_frequency: "Annual register publication",
    retrieved_at: retrievedAt,
    limitations: "Heritage-at-risk inclusion/removal is a risk-management status milestone. It is not construction, repair completion detail, ownership transfer, public benefit, operational arrangement, or outcome evidence."
  },
  {
    source_id: "mhclg-called-in-decisions",
    city_ids: ["london"],
    title: "Planning applications: called-in decisions and recovered appeals",
    publisher: "Ministry of Housing, Communities and Local Government / Planning Casework Unit",
    bucket: "planning/development/architecture",
    access_url: "https://www.gov.uk/government/collections/planning-applications-called-in-decisions-and-recovered-appeals",
    licence: "Open Government Licence v3.0 except where otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected London called-in and recovered planning decisions in the 2008-2026 corpus window.",
    spatial_granularity: "Named site point from decision letter/site address.",
    temporal_granularity: "Secretary of State decision date.",
    update_frequency: "Decision-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Secretary of State decisions are administrative planning milestones. Conditions, legal challenges, implementation, later consents, construction, completion, opening, and outcome effects must be tracked separately."
  },
  {
    source_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
    city_ids: ["nyc"],
    title: "NYC Open Data Individual Landmark Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    bucket: "planning/development/architecture/historic_preservation",
    access_url: "https://data.cityofnewyork.us/d/buis-pvji",
    licence: "NYC Open Data / NYC.gov terms; dataset metadata license field is null.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected LPC individual landmark designation rows with designation dates in the architecture corpus window.",
    spatial_granularity: "LPC landmark site point/polygon-derived navigation point.",
    temporal_granularity: "Designation date.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "LPC designation rows document legal/protective status only. They do not document construction, restoration, permit activity, current occupancy, owner action, physical condition change, or preservation outcomes."
  },
  {
    source_id: "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs",
    city_ids: ["nyc"],
    title: "NYC Open Data Designated and Calendared Buildings and Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    bucket: "planning/development/architecture/historic_preservation",
    access_url: "https://data.cityofnewyork.us/d/ncre-qhxs",
    licence: "NYC Open Data / NYC.gov terms; dataset metadata license field is null.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected LPC designation and calendaring records in the architecture corpus window.",
    spatial_granularity: "LPC designated/calendared site point or polygon-derived navigation point.",
    temporal_granularity: "Calendar, public hearing, last-action, or designation date as labelled by the source row.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "Calendar and public-hearing fields are administrative status/process milestones. They are not construction, restoration, occupancy, physical condition, permit activity, or preservation outcome evidence."
  }
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

const eventIdFor = (candidate) => safeText(candidate.event_id)
  .replace(/^belfast_arch_/, "bfs_arch_")
  .replace(/_candidate$/, "");

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
      `${candidate.transformation_method || `Round114 extraction from ${candidate.__file}.`} Normalized by scripts/append_architecture_batch_20260519_round114_official.js with canonical source IDs, duplicate/reject screening, overclaim wording cleanup, current-date guards, city coordinate envelopes, and provenance fields preserved.`
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

const tmpPath = `${path}.round114-official.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
fs.renameSync(tmpPath, path);

const counts = doc.events.reduce((acc, event) => {
  acc[event.city_id] = (acc[event.city_id] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ added: records.length, counts, total: doc.events.length }, null, 2));
