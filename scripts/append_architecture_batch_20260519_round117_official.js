const fs = require("fs");

const retrievedAt = "2026-05-19";
const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const sourceRegistryPath = "config/source_registry.json";
const cityConfigPaths = {
  london: "config/cities/london.json",
  nyc: "config/cities/nyc.json",
  belfast: "config/cities/belfast.json"
};

const candidatePaths = {
  londonPldMajor: "tmp/subagents/round117_london_pld_major/candidates.json",
  londonHeritageCivic: "tmp/subagents/round117_london_heritage_civic/candidates.json",
  nycDobCoScout: "tmp/subagents/round117_nyc_dob_co_high_signal/candidates.json",
  nycDobFilingsScout: "tmp/subagents/round117_nyc_dob_filings_permits/candidates.json",
  nycZapLpc: "tmp/subagents/round117_nyc_zap_lpc/candidates.json",
  belfastOfficialDeep: "tmp/subagents/round117_belfast_official_deep/candidates.json",
  nycLocalDobBulk: "tmp/subagents/round117_nyc_local_dob_bulk/candidates.json"
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

const doc = readJson(corpusPath);

const sourceEntries = [
  {
    source_id: "planning-data-article-4-direction-area",
    city_ids: ["london"],
    title: "Planning Data article 4 direction area records",
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / local planning authorities",
    bucket: "planning/development/architecture/planning_control",
    access_url: "https://www.planning.data.gov.uk/dataset/article-4-direction-area",
    licence: "Open Government Licence v3.0 and Crown copyright/database right attribution where stated by Planning Data.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected London article 4 direction area records with explicit start/effective dates in the 2008-2026 corpus window.",
    spatial_granularity: "Article 4 direction area polygon or Planning Data representative point.",
    temporal_granularity: "start-date, entry-date, adopted/effective date, or local-authority page date as cited.",
    update_frequency: "Planning Data collector / local-authority update cadence",
    retrieved_at: retrievedAt,
    limitations: "Article 4 records document planning-control status. They are not evidence of construction, demolition, opening, occupancy, public use, or local outcome effects."
  },
  {
    source_id: "planning-data-conservation-area",
    city_ids: ["london"],
    title: "Planning Data conservation area records",
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / local planning authorities / Historic England",
    bucket: "planning/development/architecture/heritage_status",
    access_url: "https://www.planning.data.gov.uk/dataset/conservation-area",
    licence: "Open Government Licence v3.0 with Historic England and Ordnance Survey attribution where applicable.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected London conservation-area rows with explicit designation/status dates in the 2008-2026 corpus window.",
    spatial_granularity: "Conservation-area polygon or source representative point.",
    temporal_granularity: "designation-date or start-date where exposed by the source row.",
    update_frequency: "Planning Data collector / local-authority update cadence",
    retrieved_at: retrievedAt,
    limitations: "Conservation-area rows document administrative heritage/planning status. They are not evidence of fabric condition, construction, demolition, repair, occupancy, or conservation outcomes."
  },
  {
    source_id: "camden-article-4-land-use-classes",
    city_ids: ["london"],
    title: "Camden Article 4 directions land-use classes page",
    publisher: "London Borough of Camden",
    bucket: "planning/development/architecture/planning_control",
    access_url: "https://www.camden.gov.uk/en/article-4-directions-land-use-classes",
    licence: "Camden Council web terms; factual dates and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.camden.gov.uk/copyright",
    coverage_years: { start: 2018, end: 2026 },
    time_coverage: "Selected Camden Article 4 effective/adopted dates cited by Round117.",
    spatial_granularity: "Borough policy or Article 4 area, with Planning Data geometry support where available.",
    temporal_granularity: "Adopted, modified, or effective date stated by Camden.",
    update_frequency: "Page-specific publication/update",
    retrieved_at: retrievedAt,
    limitations: "Camden Article 4 pages document policy/control status only. They do not document physical development, planning permission, construction, completion, or local effects."
  },
  {
    source_id: "barts-whipps-cross-stage2",
    city_ids: ["london"],
    title: "Barts Health Whipps Cross hospital planning-stage page",
    publisher: "Barts Health NHS Trust",
    bucket: "planning/development/architecture/public_facilities",
    access_url: "https://www.bartshealth.nhs.uk/news/new-whipps-cross-hospital-plans-approved-by-mayor-of-london-12823",
    licence: "Official NHS trust web page; factual project-stage metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.bartshealth.nhs.uk/",
    coverage_years: { start: 2021, end: 2026 },
    time_coverage: "Selected Whipps Cross project-stage and mayoral planning-stage records.",
    spatial_granularity: "Hospital site point or related official planning/heritage point.",
    temporal_granularity: "Publication, committee, or mayoral planning-stage date stated by the source.",
    update_frequency: "Project/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "The source documents a public-building planning-stage record. It is not evidence of construction start, completion, opening, clinical service change, usage, or outcome effects."
  },
  {
    source_id: "city-of-london-smithfield-museum-approval",
    city_ids: ["london"],
    title: "City of London Smithfield Museum of London planning approval page",
    publisher: "City of London Corporation",
    bucket: "planning/development/architecture/civic_cultural",
    access_url: "https://news.cityoflondon.gov.uk/plans-approved-to-create-new-museum-for-london-and-regenerate-smithfield/",
    licence: "City of London web terms; factual project-stage metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.cityoflondon.gov.uk/footer/terms-and-conditions",
    coverage_years: { start: 2018, end: 2026 },
    time_coverage: "Selected Smithfield / Museum of London project-stage records.",
    spatial_granularity: "Named civic/cultural site point.",
    temporal_granularity: "Planning approval or publication date stated by the official page.",
    update_frequency: "Project/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "The source documents an official planning/project-stage record. It is not evidence of all works packages, opening, occupancy, museum operations, regeneration effects, or public outcomes."
  },
  {
    source_id: "moorfields-oriel-groundbreak",
    city_ids: ["london"],
    title: "Moorfields Oriel official project milestone page",
    publisher: "Moorfields Eye Hospital NHS Foundation Trust",
    bucket: "planning/development/architecture/public_facilities",
    access_url: "https://www.moorfields.nhs.uk/about-us/moorfields-and-ucl-centre-for-eye-health/centre-for-eye-health-news/oriel-milestone",
    licence: "Official NHS trust web page; factual project-stage metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.moorfields.nhs.uk/",
    coverage_years: { start: 2021, end: 2026 },
    time_coverage: "Selected Oriel public-building project-stage records.",
    spatial_granularity: "Named hospital/university project site point.",
    temporal_granularity: "Source-stated project-stage or publication date.",
    update_frequency: "Project/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "The source documents an official public-building project-stage record. It is not evidence of final completion, opening, occupation, clinical outcomes, or usage."
  },
  {
    source_id: "nyc-dob-filings-permits",
    city_ids: ["nyc"],
    title: "NYC DOB construction filings and permits",
    publisher: "NYC Department of Buildings, via NYC Open Data",
    bucket: "planning/development/architecture/building_permits",
    access_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2",
    licence: "NYC Open Data / NYC.gov terms; dataset-specific metadata applies.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected high-signal DOB job application and DOB NOW Build filing/permit/status rows in the corpus window.",
    spatial_granularity: "DOB geocoded building/job address point.",
    temporal_granularity: "Application, approval, permit, signoff, LOC, or current-status date as labelled by the source row.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "DOB filing and permit rows document administrative job milestones. They are not evidence of construction completion, opening, occupancy level, design quality, safety, affordability, or outcome effects."
  },
  {
    source_id: "nyc-dcp-zap-bbl",
    city_ids: ["nyc"],
    title: "NYC Zoning Application Portal BBL records",
    publisher: "NYC Department of City Planning, via NYC Open Data",
    bucket: "planning/development/architecture/zoning",
    access_url: "https://data.cityofnewyork.us/d/2iga-a6mk",
    licence: "NYC Open Data / NYC.gov terms.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected ZAP project-to-tax-lot associations used as geometry support in Round117.",
    spatial_granularity: "ZAP project to tax-lot BBL association.",
    temporal_granularity: "Validated date or associated ZAP project milestone date.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "ZAP BBL rows identify associated tax lots. They are not exact project footprints, future lot configuration, construction status, occupancy, or outcome evidence."
  },
  {
    source_id: "nyc-pluto-mappluto-lots",
    city_ids: ["nyc"],
    title: "NYC PLUTO / MapPLUTO lot records",
    publisher: "NYC Department of City Planning, via NYC Open Data",
    bucket: "planning/development/architecture/parcel_geometry",
    access_url: "https://data.cityofnewyork.us/d/64uk-42ks",
    licence: "NYC Open Data / NYC DCP MapPLUTO terms; release-specific caveats apply.",
    licence_url: "https://www.nyc.gov/assets/planning/download/pdf/data-maps/open-data/meta_mappluto.pdf",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected PLUTO rows used as tax-lot geometry support for ZAP records.",
    spatial_granularity: "Tax-lot point or polygon-derived representative coordinate.",
    temporal_granularity: "Release snapshot date, not the project effective date.",
    update_frequency: "Release-specific / NYC Open Data refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "PLUTO coordinates are representative tax-lot geometry. They are not project footprints, construction dates, completion dates, building-condition evidence, or outcome evidence."
  },
  {
    source_id: "nyc-lpc-historic-districts-skyk-mpzq",
    city_ids: ["nyc"],
    title: "NYC LPC Historic Districts",
    publisher: "NYC Landmarks Preservation Commission, via NYC Open Data",
    bucket: "planning/development/architecture/historic_preservation",
    access_url: "https://data.cityofnewyork.us/d/skyk-mpzq",
    licence: "NYC Open Data / NYC.gov terms; dataset-specific metadata applies.",
    licence_url: "https://opendata.cityofnewyork.us/open-data-law/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected LPC historic-district calendaring, hearing, last-action, and designation dates in the corpus window.",
    spatial_granularity: "Historic-district official boundary or representative point.",
    temporal_granularity: "LPC calendar, public-hearing, last-action, or designation date as labelled by the source row.",
    update_frequency: "NYC Open Data dataset-specific refresh cadence",
    retrieved_at: retrievedAt,
    limitations: "Historic-district records document preservation administrative status. They are not evidence of physical work, condition, occupancy, compliance, or preservation outcomes."
  },
  {
    source_id: "bcc-planning-decisions-issued-2023",
    city_ids: ["belfast"],
    title: "Belfast City Council planning applications issued PDFs, 2023",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture",
    access_url: "https://minutes.belfastcity.gov.uk/",
    licence: "Belfast City Council copyright; factual metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2023, end: 2023 },
    time_coverage: "Selected February, April, and May 2023 planning application decision-list records.",
    spatial_granularity: "Planning application site/address point.",
    temporal_granularity: "Monthly decision-list period or decision issue date where stated.",
    update_frequency: "Committee/decision-list publication",
    retrieved_at: retrievedAt,
    limitations: "Planning permission rows document administrative planning decisions. They are not evidence of construction start, completion, occupation, opening, delivery, or outcome effects."
  },
  {
    source_id: "dfi-spd-advertised-applications",
    city_ids: ["belfast"],
    title: "DfI Strategic Planning Directorate advertised applications",
    publisher: "Department for Infrastructure Northern Ireland",
    bucket: "planning/development/architecture",
    access_url: "https://www.infrastructure-ni.gov.uk/articles/planning-applications-advertised-dfi",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2020, end: 2026 },
    time_coverage: "Selected DfI advertised planning application records in the corpus window.",
    spatial_granularity: "Application/site point from official application or advert.",
    temporal_granularity: "Advertised, consultation, or source publication date as stated by DfI.",
    update_frequency: "Application-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Advertised application records document application-stage planning status. They are not approvals, construction starts, completions, occupations, openings, service changes, or outcome evidence."
  },
  {
    source_id: "dfc-hed-buildings-harni",
    city_ids: ["belfast"],
    title: "DfC Historic Environment Division Buildings Database and HARNI records",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    bucket: "planning/development/architecture/heritage",
    access_url: "https://apps.communities-ni.gov.uk/",
    licence: "Crown copyright / public-sector information terms; factual metadata and source URLs retained, with images, mapping tiles, logos, and third-party content excluded pending rights review.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected listed-building and HARNI status records for Belfast in the corpus window.",
    spatial_granularity: "Individual listed building, heritage asset, or HARNI site point.",
    temporal_granularity: "Listing date, HARNI review/status year, source narrative year, or access-date status where no better date is exposed.",
    update_frequency: "Live register / record-specific update cadence",
    retrieved_at: retrievedAt,
    limitations: "HED/HARNI rows document statutory listing, heritage-risk, condition, or status observations. They are not evidence of construction, repair completion, reuse, safety, occupancy, or causal explanation unless the cited source directly says so and the event is framed narrowly."
  }
];

const sourceIdAliases = {
  "planning-data-article-4-legal-instrument": "planning-data-article-4-direction-area",
  "nyc-dob-now-certificate-of-occupancy-pkdm-hqz6": "nyc-dob-now-co-pkdm-hqz6",
  "pkdm-hqz6": "nyc-dob-now-co-pkdm-hqz6",
  "nyc-dob-certificate-of-occupancy-bs8b-p36w": "nyc-dob-co-bs8b-p36w",
  "bs8b-p36w": "nyc-dob-co-bs8b-p36w",
  "nyc-dob-job-application-filings-ic3t-wcy2": "nyc-dob-filings-permits",
  "ic3t-wcy2": "nyc-dob-filings-permits",
  "nyc-dob-permit-issuance-ipu4-2q9a": "nyc-dob-filings-permits",
  "ipu4-2q9a": "nyc-dob-filings-permits",
  "nyc-dob-now-build-job-application-filings-w9ak-ipjd": "nyc-dob-filings-permits",
  "w9ak-ipjd": "nyc-dob-filings-permits",
  "nyc-dob-now-build-approved-permits-rbx6-tga4": "nyc-dob-filings-permits",
  "rbx6-tga4": "nyc-dob-filings-permits",
  "nyc-dcp-pluto": "nyc-pluto-mappluto-lots",
  "bcc-current-planning-applications-20260519": "bcc-current-planning-applications"
};

function canonicalSourceId(sourceId) {
  return sourceIdAliases[sourceId] || sourceId;
}

function upsertSources() {
  for (const sourceEntry of sourceEntries) {
    const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
    if (index >= 0) doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
    else doc.sources.push(sourceEntry);
  }
}

function safeText(value) {
  const text = Array.isArray(value) ? value.join(" ") : String(value || "");
  return text
    .replace(/\bdoes not prove\b/gi, "is not evidence of")
    .replace(/\bnot proof of\b/gi, "not evidence of")
    .replace(/\bas proof of\b/gi, "as evidence of")
    .replace(/\bproof that\b/gi, "evidence that")
    .replace(/\bproof\b/gi, "evidence")
    .replace(/\bproves?\b/gi, "documents")
    .replace(/\bcaused\b/gi, "was associated with")
    .replace(/\bcauses?\b/gi, "is associated with")
    .replace(/\bforecasts?\b/gi, "projects")
    .replace(/\bforecast(ed|ing)?\b/gi, "projected")
    .replace(/\bpredicts?\b/gi, "projects")
    .replace(/\bsimulates?\b/gi, "models")
    .replace(/\bwill increase\b/gi, "is described as intended to increase")
    .replace(/\bwill decrease\b/gi, "is described as intended to decrease")
    .trim();
}

function slugify(value) {
  return safeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 112)
    .replace(/_+$/g, "");
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{4}-\d{2}$/.test(text) || /^\d{4}$/.test(text)) return text;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return text;
}

function normalizeDateForComparison(value) {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function datePrecision(value) {
  const text = String(value || "");
  if (/^\d{4}$/.test(text)) return "year";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  return "day";
}

function latestDateFromObject(obj) {
  if (!obj || typeof obj !== "object") return "";
  return Object.values(obj)
    .map(normalizeDate)
    .filter((value) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(value))
    .sort()
    .pop() || "";
}

function sourceIdsFor(candidate) {
  const explicit = [];
  if (Array.isArray(candidate.source_ids)) explicit.push(...candidate.source_ids);
  if (candidate.source_id) explicit.push(candidate.source_id);
  if (candidate.source_dataset_id) explicit.push(candidate.source_dataset_id);
  if (candidate.dataset_id) explicit.push(candidate.dataset_id);
  const seen = new Set();
  return explicit
    .map(canonicalSourceId)
    .filter(Boolean)
    .filter((sourceId) => {
      if (seen.has(sourceId)) return false;
      seen.add(sourceId);
      return true;
    });
}

function pointFrom(candidate) {
  const options = [
    [candidate.latitude, candidate.longitude],
    [candidate.lat, candidate.lon],
    [candidate.geometry?.latitude, candidate.geometry?.longitude],
    [candidate.location?.latitude, candidate.location?.longitude],
    [candidate.coordinates?.lat, candidate.coordinates?.lon],
    [candidate.coordinates?.latitude, candidate.coordinates?.longitude]
  ];
  for (const [lat, lon] of options) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  }
  return null;
}

function sourceUrlFor(candidate) {
  if (candidate.source_url) return candidate.source_url;
  if (Array.isArray(candidate.source_urls) && candidate.source_urls.length > 0) return candidate.source_urls[0];
  if (candidate.source_dataset_url) return candidate.source_dataset_url;
  if (candidate.dataset_page_url) return candidate.dataset_page_url;
  return "";
}

function sourceRecordIdFor(candidate) {
  if (candidate.source_record_id) return candidate.source_record_id;
  if (Array.isArray(candidate.source_record_ids) && candidate.source_record_ids.length > 0) return candidate.source_record_ids.join("; ");
  if (Array.isArray(candidate.planning_refs) && candidate.planning_refs.length > 0) return candidate.planning_refs.join("; ");
  if (candidate.row_fields?.application_number) return candidate.row_fields.application_number;
  if (candidate.row_fields?.job_number) return candidate.row_fields.job_number;
  if (candidate.row_fields?.job_filing_number) return candidate.row_fields.job_filing_number;
  if (candidate.raw_row?.application_number) return candidate.raw_row.application_number;
  if (candidate.raw_row?.job_number) return candidate.raw_row.job_number;
  if (candidate.raw_row?.job_filing_number) return candidate.raw_row.job_filing_number;
  return candidate.candidate_id || candidate.event_id || "";
}

function eventIdFor(candidate, date) {
  const prefix = { belfast: "bfs_arch", london: "lon_arch", nyc: "nyc_arch" }[candidate.city_id];
  const existing = safeText(candidate.event_id || "");
  if (prefix && existing.startsWith(prefix)) return existing;
  const token = candidate.candidate_id || candidate.event_id || `${candidate.title}_${sourceRecordIdFor(candidate)}_${date}`;
  const slug = slugify(token);
  return `${prefix}_${slug}`.slice(0, 140).replace(/_+$/g, "");
}

function dateFrom(candidate) {
  const value = candidate.date ||
    candidate.effective_date ||
    candidate.event_date ||
    candidate.date_fields?.decision_or_publication_date ||
    candidate.date_fields?.decision_date ||
    candidate.dates?.decision_date ||
    candidate.dates?.committee_date ||
    candidate.dates?.date_last_advertised ||
    candidate.dates?.date_validated ||
    latestDateFromObject(candidate.dates) ||
    latestDateFromObject(candidate.date_fields) ||
    candidate.row_fields?.signoff_date ||
    candidate.row_fields?.current_status_date ||
    candidate.row_fields?.c_o_issue_date ||
    candidate.row_fields?.c_of_o_issuance_date ||
    candidate.raw_row?.c_o_issue_date ||
    candidate.raw_row?.c_of_o_issuance_date;
  return normalizeDate(value);
}

function sourceDateFieldFor(candidate) {
  const fields = [];
  if (candidate.source_date_field) fields.push(candidate.source_date_field);
  if (candidate.date_field) fields.push(candidate.date_field);
  if (candidate.date_basis) fields.push(candidate.date_basis);
  if (candidate.date_type) fields.push(candidate.date_type);
  if (candidate.source_date_raw) fields.push(`raw date ${candidate.source_date_raw}`);
  return fields.filter(Boolean).join("; ") || "Observed administrative date from the cited source record.";
}

function areaFor(candidate) {
  return candidate.area ||
    candidate.address ||
    candidate.location_name ||
    candidate.location?.address ||
    candidate.location?.name ||
    candidate.site ||
    candidate.title ||
    candidate.city_id;
}

function geometrySourceFor(candidate) {
  return candidate.geometry_source ||
    candidate.geometry?.source ||
    candidate.location?.geometry_source ||
    candidate.coordinates?.precision ||
    "Source candidate supplied official or cited approximate coordinates.";
}

function geometryPrecisionFor(candidate) {
  return candidate.geometry_precision ||
    candidate.geometry?.precision ||
    candidate.location?.geometry_precision ||
    candidate.coordinates?.precision ||
    "source point for atlas navigation, not a measured project footprint";
}

function architectFor(candidate) {
  if (candidate.architect) return candidate.architect;
  if (candidate.applicant_name) return `Source row names applicant: ${candidate.applicant_name}; role not independently verified.`;
  if (candidate.row_fields?.applicant_professional_title) return `Source row names applicant professional title: ${candidate.row_fields.applicant_professional_title}; role not independently verified.`;
  if (candidate.raw_row?.applicant_professional_title) return `Source row names applicant professional title: ${candidate.raw_row.applicant_professional_title}; role not independently verified.`;
  return "Source record does not name a project architect.";
}

function limitationsFor(candidate) {
  const parts = [];
  if (Array.isArray(candidate.limitations)) parts.push(candidate.limitations.join(" "));
  else if (candidate.limitations) parts.push(candidate.limitations);
  if (candidate.confidence_note) parts.push(candidate.confidence_note);
  if (candidate.effective_date_note) parts.push(candidate.effective_date_note);
  if (candidate.scale_note) parts.push(`Scale note from source fields: ${candidate.scale_note}.`);
  parts.push("This event is retained as an observed, source-backed milestone only; broader design, delivery, usage, safety, affordability, regeneration, or causal claims are not inferred.");
  return parts.join(" ");
}

function licenseFor(candidate) {
  return candidate.license_or_terms_note ||
    candidate.license ||
    candidate.license_terms ||
    candidate.license_terms_access_note ||
    candidate.terms_note ||
    "Source terms retained in source audit; review publisher terms before bulk redistribution.";
}

function normalizeCandidate(candidate, packName) {
  const date = dateFrom(candidate);
  const point = pointFrom(candidate);
  const sourceIds = sourceIdsFor(candidate);
  const primarySourceId = sourceIds[0] || canonicalSourceId(candidate.source_id || candidate.source_dataset_id || "");
  return {
    city_id: candidate.city_id,
    event_id: eventIdFor(candidate, date),
    date,
    date_precision: candidate.date_precision || candidate.date_granularity || candidate.effective_date_precision || datePrecision(date),
    bucket: safeText(candidate.bucket || candidate.category || "planning/development/architecture/official_record"),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change || candidate.summary || candidate.title),
    area: safeText(areaFor(candidate)),
    latitude: point?.latitude,
    longitude: point?.longitude,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name || candidate.dataset_page_url || primarySourceId),
    publisher: safeText(candidate.publisher || candidate.source_publisher || "Source publisher not supplied in candidate."),
    source_url: sourceUrlFor(candidate),
    source_record_id: safeText(sourceRecordIdFor(candidate)),
    source_type: safeText(candidate.source_type || candidate.event_type || "official/public source record"),
    source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || candidate.retrieved_at || retrievedAt,
    source_date_field: safeText(sourceDateFieldFor(candidate)),
    source_dataset_id: primarySourceId,
    confidence: candidate.confidence || "documented",
    architect: safeText(architectFor(candidate)),
    project_type: safeText(candidate.project_type || candidate.subcategory || candidate.event_type || "official architecture-related record"),
    geometry_source: safeText(geometrySourceFor(candidate)),
    geometry_precision: safeText(geometryPrecisionFor(candidate)),
    license_or_terms_note: safeText(licenseFor(candidate)),
    attribution: safeText(candidate.attribution || candidate.publisher || candidate.source_name || primarySourceId),
    limitations: safeText(limitationsFor(candidate)),
    transformation_method: safeText(`Round117 ${packName} candidate ${candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title}; normalized by scripts/append_architecture_batch_20260519_round117_official.js after source-ID canonicalization, duplicate screening, required-provenance checks, overclaim wording cleanup, current-date guard, and city coordinate-envelope validation.`)
  };
}

function sourceToken(event) {
  const sourceId = event.source_dataset_id || (event.source_ids || [])[0] || "";
  const text = `${event.source_record_id || ""} ${event.source_url || ""} ${event.title || ""}`;
  if (/nyc-dob/.test(sourceId)) {
    const co = text.match(/\bCO-\d{6,}\b/i);
    if (co) return co[0].toUpperCase();
    const filing = text.match(/\b[A-Z]\d{7,}(?:-[A-Z]\d+)?\b/i);
    if (filing) return filing[0].replace(/-[A-Z]\d+$/i, "").toUpperCase();
    const job = text.match(/\b\d{8,}\b/);
    return job ? job[0] : text.toLowerCase();
  }
  if (sourceId === "nyc-lpc-permit-application-information") {
    const match = text.match(/\b[A-Z]*COFA-\d{2}-\d{4,5}\b/i);
    return match ? match[0].replace(/^.*?(COFA-)/i, "COFA-").toUpperCase() : text.toLowerCase();
  }
  if (sourceId === "nyc-dcp-zap-project-data" || sourceId === "nyc-dcp-zap-bbl") {
    const match = text.match(/\b\d{4}[A-Z]\d{4}\b/i);
    return match ? match[0].toUpperCase() : text.toLowerCase();
  }
  if (/nyc-lpc/.test(sourceId)) {
    const lp = text.match(/\bLP[-\s]?\d{3,5}\b/i);
    return lp ? lp[0].replace(/\s+/g, "-").toUpperCase() : text.toLowerCase();
  }
  const planningRef = text.match(/\bLA04\/\d{4}\/\d{4}\/[A-Z]+\b/i)?.[0];
  if (planningRef) return planningRef.toUpperCase();
  const pld = text.match(/\bPLD:[^;\s]+/i)?.[0] || text.match(/\bPDU[-:]?\d{4,}\b/i)?.[0];
  if (pld) return pld.toUpperCase();
  if (sourceId.startsWith("planning-data-")) {
    const entity = text.match(/\bentity\s+(\d{6,})\b/i)?.[1] || text.match(/\/entity\/(\d{6,})\b/i)?.[1];
    if (entity) return `${sourceId}:${entity}`;
  }
  const article = text.match(/\barticle[-_\s]?4[-_\s]?[a-z0-9-]+\b/i)?.[0];
  if (article) return article.toLowerCase();
  return text.trim().toLowerCase();
}

function buildExistingSourceTokens(events) {
  const bySource = new Map();
  for (const event of events) {
    const sourceIds = event.source_ids || [event.source_dataset_id].filter(Boolean);
    for (const rawSourceId of sourceIds) {
      const sourceId = canonicalSourceId(rawSourceId);
      const token = sourceToken({ ...event, source_dataset_id: sourceId });
      if (!token) continue;
      if (!bySource.has(sourceId)) bySource.set(sourceId, new Set());
      bySource.get(sourceId).add(token);
    }
  }
  return bySource;
}

function validateRecords(records) {
  const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));
  const requiredFields = [
    "city_id", "event_id", "date", "bucket", "title", "summary", "observed_change", "area",
    "latitude", "longitude", "source_ids", "source_name", "publisher", "source_url",
    "source_record_id", "source_type", "source_retrieved_at", "source_date_field",
    "source_dataset_id", "confidence", "architect", "project_type", "geometry_source",
    "geometry_precision", "license_or_terms_note", "attribution", "limitations",
    "transformation_method"
  ];

  for (const event of records) {
    for (const field of requiredFields) {
      const value = event[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${event.event_id}`);
      }
    }
    if (event.city_id === "belfast" && !/^bfs_arch_/.test(event.event_id)) throw new Error(`Unexpected Belfast event_id prefix: ${event.event_id}`);
    if (event.city_id === "london" && !/^lon_arch_/.test(event.event_id)) throw new Error(`Unexpected London event_id prefix: ${event.event_id}`);
    if (event.city_id === "nyc" && !/^nyc_arch_/.test(event.event_id)) throw new Error(`Unexpected NYC event_id prefix: ${event.event_id}`);
    if (!String(event.source_url).startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
    if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
      throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
    }
    for (const sourceId of event.source_ids) {
      if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
    }
  }

  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  for (const event of records) {
    const checked = [
      event.title, event.summary, event.observed_change, event.limitations,
      event.transformation_method, event.source_date_field, event.project_type,
      event.geometry_precision
    ].join(" ");
    if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
  }

  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");
  const cityEnvelopes = {
    belfast: { minLon: -6.12, maxLon: -5.74, minLat: 54.45, maxLat: 54.75 },
    london: { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 },
    nyc: { minLon: -74.2591, maxLon: -73.7004, minLat: 40.4774, maxLat: 40.9176 }
  };

  const batchIds = new Set();
  const batchSourceKeys = new Set();
  for (const event of records) {
    const comparable = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (Number.isNaN(comparable.getTime())) throw new Error(`Invalid date for ${event.event_id}: ${event.date}`);
    if (comparable > latestAllowedDate) throw new Error(`Future-dated record: ${event.event_id}`);
    if (comparable < earliestAllowedDate) throw new Error(`Pre-window record: ${event.event_id}`);
    const envelope = cityEnvelopes[event.city_id];
    const longitude = Number(event.longitude);
    const latitude = Number(event.latitude);
    if (
      !envelope ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < envelope.minLon ||
      longitude > envelope.maxLon ||
      latitude < envelope.minLat ||
      latitude > envelope.maxLat
    ) {
      throw new Error(`Invalid or outside-${event.city_id}-envelope coordinates for ${event.event_id}`);
    }
    if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
    batchIds.add(event.event_id);
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
    batchSourceKeys.add(sourceKey);
  }
}

function registryEntryFromSource(source) {
  return {
    source_id: source.source_id,
    title: source.title,
    provider: source.publisher,
    source_family: source.bucket.split("/").pop() || "planning",
    city_ids: source.city_ids,
    licence: source.licence,
    licence_url: source.licence_url,
    coverage_years: source.coverage_years,
    update_frequency: source.update_frequency,
    url: source.access_url,
    local_paths: [],
    reliability: "usable_with_caveats",
    source_confidence: "documented",
    attribution_text: `Attribute ${source.publisher}.`,
    provenance_notes: `${source.time_coverage} ${source.temporal_granularity}`,
    caveats: [source.limitations]
  };
}

function updateSourceRegistry() {
  const registry = readJson(sourceRegistryPath);
  const existing = new Set(registry.sources.map((source) => source.source_id));
  for (const source of sourceEntries) {
    if (!existing.has(source.source_id)) {
      registry.sources.push(registryEntryFromSource(source));
      existing.add(source.source_id);
    }
  }
  registry.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  writeJson(sourceRegistryPath, registry);
}

function addSourceIdsToFamily(cityId, familyId, sourceIds) {
  const file = cityConfigPaths[cityId];
  const config = readJson(file);
  const family = config.source_families.find((item) => item.family_id === familyId);
  if (!family) throw new Error(`Missing ${cityId} source family ${familyId}`);
  const existing = new Set(family.source_ids);
  for (const sourceId of sourceIds) {
    if (!existing.has(sourceId)) {
      family.source_ids.push(sourceId);
      existing.add(sourceId);
    }
  }
  writeJson(file, config);
}

function updateCityConfigs() {
  addSourceIdsToFamily("london", "planning", [
    "planning-data-article-4-direction-area",
    "planning-data-conservation-area",
    "camden-article-4-land-use-classes",
    "barts-whipps-cross-stage2",
    "city-of-london-smithfield-museum-approval",
    "moorfields-oriel-groundbreak"
  ]);
  addSourceIdsToFamily("nyc", "land_use_documents", ["nyc-dcp-zap-bbl"]);
  addSourceIdsToFamily("nyc", "historic_preservation", ["nyc-lpc-historic-districts-skyk-mpzq"]);
  addSourceIdsToFamily("belfast", "planning", [
    "bcc-planning-decisions-issued-2023",
    "dfi-spd-advertised-applications",
    "dfc-hed-buildings-harni"
  ]);
}

function main() {
  upsertSources();

  const rows = [];
  const rejections = [];
  const missingCandidatePacks = [];
  for (const [packName, file] of Object.entries(candidatePaths)) {
    if (!fs.existsSync(file)) {
      missingCandidatePacks.push(file);
      continue;
    }
    const candidates = readJson(file).candidates || [];
    for (const candidate of candidates) {
      const event = normalizeCandidate(candidate, packName);
      if (!event.latitude || !event.longitude) {
        rejections.push({ id: candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title, reason: "Missing source geometry after candidate normalization." });
        continue;
      }
      rows.push(event);
    }
  }

  const existingSourceTokens = buildExistingSourceTokens(doc.events);
  const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
  const existingIds = new Set(doc.events.map((event) => event.event_id));
  const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
  const batchSourceTokens = new Set();
  const records = [];
  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");

  for (const event of rows) {
    const titleDateKey = `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`;
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    const token = sourceToken(event);
    const tokenKey = `${event.source_dataset_id}|${token}`;
    const comparableDate = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (!event.date || Number.isNaN(comparableDate.getTime())) {
      rejections.push({ id: event.event_id, reason: "Missing or invalid event date after candidate normalization." });
      continue;
    }
    if (comparableDate > latestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Future-dated event date after access date: ${event.date}` });
      continue;
    }
    if (comparableDate < earliestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Pre-window event date: ${event.date}` });
      continue;
    }
    if (existingIds.has(event.event_id)) {
      rejections.push({ id: event.event_id, reason: "Existing event_id." });
      continue;
    }
    if (existingSourceKeys.has(sourceKey)) {
      rejections.push({ id: event.event_id, reason: `Existing source key: ${sourceKey}` });
      continue;
    }
    if (existingTitleDateKeys.has(titleDateKey)) {
      rejections.push({ id: event.event_id, reason: `Existing title/date key: ${titleDateKey}` });
      continue;
    }
    if (existingSourceTokens.get(event.source_dataset_id)?.has(token)) {
      rejections.push({ id: event.event_id, reason: `Existing source token for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    if (batchSourceTokens.has(tokenKey)) {
      rejections.push({ id: event.event_id, reason: `Duplicate source token inside batch for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    batchSourceTokens.add(tokenKey);
    records.push(event);
  }

  validateRecords(records);

  doc.events.push(...records);
  doc.events.sort((a, b) => (
    a.city_id.localeCompare(b.city_id) ||
    String(a.date).localeCompare(String(b.date)) ||
    a.event_id.localeCompare(b.event_id)
  ));
  doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  writeJson(corpusPath, doc);
  updateSourceRegistry();
  updateCityConfigs();

  const counts = doc.events.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedByCity = records.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedBySource = records.reduce((acc, event) => {
    acc[event.source_dataset_id] = (acc[event.source_dataset_id] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    added: records.length,
    rejected: rejections.length,
    missingCandidatePacks,
    addedByCity,
    addedBySource,
    counts,
    total: doc.events.length,
    sources: doc.sources.length,
    rejections: rejections.slice(0, 120)
  }, null, 2));
}

main();
