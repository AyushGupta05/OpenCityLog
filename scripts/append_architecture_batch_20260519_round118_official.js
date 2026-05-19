const fs = require("fs");

const retrievedAt = "2026-05-19";
const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";

const candidatePaths = {
  nycHpdParksOfficial: "tmp/subagents/round118_nyc_hpd_parks_official/candidates.json",
  londonPublicEstateOfficial: "tmp/subagents/round118_london_public_estate_official/candidates.json",
  londonPlanningControlsMore: "tmp/subagents/round118_london_planning_controls_more/candidates.json",
  nycDdcHpdParksPages: "tmp/subagents/round118_nyc_ddc_hpd_parks_pages/candidates.json",
  belfastPlanningCommitteesDeep: "tmp/subagents/round118_belfast_planning_committees_deep/candidates.json",
  belfastPublicHeritageProjects: "tmp/subagents/round118_belfast_public_heritage_projects/candidates.json",
  nycZoningTextMore: "tmp/subagents/round118_nyc_zoning_text_more/candidates.json"
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
    source_id: "planning-data-archaeological-priority-area",
    city_ids: ["london"],
    title: "Planning Data archaeological priority area records",
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / Historic England / local planning authorities",
    bucket: "planning/development/architecture/heritage_planning_control",
    access_url: "https://www.planning.data.gov.uk/dataset/archaeological-priority-area",
    licence: "Open Government Licence v3.0 and Crown copyright/database right attribution where stated by Planning Data.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected London archaeological-priority-area records observed in Planning Data during the 2008-2026 corpus window.",
    spatial_granularity: "Archaeological-priority-area polygon or Planning Data representative point.",
    temporal_granularity: "entry-date/source publication date where no separate designation/adoption date is exposed.",
    update_frequency: "Planning Data collector / local-authority update cadence",
    retrieved_at: retrievedAt,
    limitations: "Archaeological priority areas document planning/heritage-control status. Entry-date is a data-publication or status-observed date where no original adoption date is supplied. These records are not evidence of physical construction, excavation, alteration, opening, occupancy, or outcome effects."
  },
  {
    source_id: "planning-data-asset-of-community-value",
    city_ids: ["london"],
    title: "Planning Data asset of community value records",
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / local planning authorities",
    bucket: "planning/development/architecture/community_asset_status",
    access_url: "https://www.planning.data.gov.uk/dataset/asset-of-community-value",
    licence: "Open Government Licence v3.0 and Crown copyright/database right attribution where stated by Planning Data.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected London asset-of-community-value decision/status rows in the 2008-2026 corpus window.",
    spatial_granularity: "ACV record point or source-provided address coordinate.",
    temporal_granularity: "decision-date, nomination-date, expiry-date, or entry-date as labelled by the source.",
    update_frequency: "Planning Data collector / local-authority update cadence",
    retrieved_at: retrievedAt,
    limitations: "Asset-of-community-value status is a community-right-to-bid administrative record. It is not a listed-building designation, planning permission, physical change, construction, operation, or outcome record."
  },
  {
    source_id: "camden-local-list-open-data",
    city_ids: ["london"],
    title: "Camden Local List open data",
    publisher: "London Borough of Camden",
    bucket: "planning/development/architecture/local_heritage_status",
    access_url: "https://opendata.camden.gov.uk/resource/d3xk-4rbp.json",
    licence: "Camden open-data metadata says data is derived from Ordnance Survey products under the Public Sector Geospatial Agreement; retain Camden and OS attribution.",
    licence_url: "https://opendata.camden.gov.uk/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected Camden local-list status rows observed in the live open-data snapshot.",
    spatial_granularity: "Local-list asset polygon or representative coordinate.",
    temporal_granularity: "last_uploaded/source snapshot date where no original local-list adoption date is exposed.",
    update_frequency: "Live dataset / Camden open-data update cadence",
    retrieved_at: retrievedAt,
    limitations: "Camden local-list rows document local heritage/status presence in a source snapshot. last_uploaded is not necessarily the original adoption/designation date. Rows are not evidence of construction, repair, occupancy, physical condition, or outcome effects."
  },
  {
    source_id: "round118-brcd-belfast-stories-design-team-2023",
    city_ids: ["belfast"],
    title: "Belfast Stories design-team appointment page",
    publisher: "Belfast Region City Deal / Belfast City Council",
    bucket: "planning/development/architecture/civic_cultural",
    access_url: "https://belfastregioncitydeal.co.uk/news-events/design-team-appointed-for-belfast-stories-project-at-prominent-royal-avenue-site",
    licence: "Official Belfast Region City Deal web page; factual metadata and source URL retained pending fuller reuse review.",
    licence_url: "https://belfastregioncitydeal.co.uk/",
    coverage_years: { start: 2023, end: 2023 },
    time_coverage: "Belfast Stories design-stage record selected in Round118.",
    spatial_granularity: "Named Royal Avenue civic/cultural project site point.",
    temporal_granularity: "Published/project-stage date stated by the source.",
    update_frequency: "Project/news page publication",
    retrieved_at: retrievedAt,
    limitations: "Design-team appointment records a civic project stage. It is not planning approval, construction start, completion, opening, visitor use, or outcome evidence."
  },
  {
    source_id: "round118-bcc-belfast-blitz-memorial-designs-2026",
    city_ids: ["belfast"],
    title: "Belfast City Council Belfast Blitz War Memorial design page",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture/civic_memorial",
    access_url: "https://www.belfastcity.gov.uk/News/Striking-designs-revealed-for-Belfast-Blitz-War-Me",
    licence: "Belfast City Council copyright; factual metadata and source URL retained pending fuller reuse review.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2026, end: 2026 },
    time_coverage: "Belfast Blitz memorial design-stage page selected in Round118.",
    spatial_granularity: "Cathedral Gardens public-realm/memorial point.",
    temporal_granularity: "Published/design-stage date stated by the source.",
    update_frequency: "News/project page publication",
    retrieved_at: retrievedAt,
    limitations: "Design reveal records a project stage. It is not installation, unveiling, opening, construction completion, public use, or outcome evidence."
  },
  {
    source_id: "round118-dfi-york-street-station-investment-2021",
    city_ids: ["belfast"],
    title: "DfI York Street station investment page",
    publisher: "Department for Infrastructure Northern Ireland",
    bucket: "planning/development/architecture/transport_infrastructure",
    access_url: "https://www.infrastructure-ni.gov.uk/news/mallon-invest-ps10-million-transformation-new-train-station-york-street",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2021, end: 2021 },
    time_coverage: "York Street station project-stage/investment record selected in Round118.",
    spatial_granularity: "Station/site point.",
    temporal_granularity: "Publication/project-stage date.",
    update_frequency: "Departmental news page publication",
    retrieved_at: retrievedAt,
    limitations: "Investment/planning-stage records are not construction start, station opening, service change, usage, or transport outcome evidence."
  },
  {
    source_id: "round118-dfc-lisburn-road-library-upgrade-2016",
    city_ids: ["belfast"],
    title: "DfC Lisburn Road Library investment page",
    publisher: "Department for Communities Northern Ireland",
    bucket: "planning/development/architecture/civic_services",
    access_url: "https://www.communities-ni.gov.uk/news/ps15million-lisburn-road-library-investment-community-givan",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2016, end: 2016 },
    time_coverage: "Lisburn Road Library upgrade funding-stage record selected in Round118.",
    spatial_granularity: "Named library building/site point.",
    temporal_granularity: "Publication/funding-stage date.",
    update_frequency: "Departmental news page publication",
    retrieved_at: retrievedAt,
    limitations: "Funding-stage records are not evidence that works started, completed, reopened, changed service usage, or produced local outcomes."
  },
  {
    source_id: "round118-doh-belfast-maternity-nearing-completion-2022",
    city_ids: ["belfast"],
    title: "Department of Health Belfast maternity hospital status page",
    publisher: "Department of Health Northern Ireland",
    bucket: "planning/development/architecture/healthcare",
    access_url: "https://www.health-ni.gov.uk/news/new-ps70m-maternity-hospital-nearing-completion-health",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2022, end: 2022 },
    time_coverage: "Royal Hospitals maternity-building status record selected in Round118.",
    spatial_granularity: "Hospital campus/building point.",
    temporal_granularity: "Publication/status date.",
    update_frequency: "Departmental news page publication",
    retrieved_at: retrievedAt,
    limitations: "Nearing-completion status is not handover, public opening, clinical commissioning completion, service move, or health outcome evidence."
  },
  {
    source_id: "round118-ulster-cdht-planning-approval-2026",
    city_ids: ["belfast"],
    title: "Ulster University Centre for Digital Healthcare Technology planning page",
    publisher: "Ulster University",
    bucket: "planning/development/architecture/education_healthcare",
    access_url: "https://www.ulster.ac.uk/news/2026/january/major-digital-healthcare-centre-planned-for-belfast",
    licence: "Ulster University website copyright/terms; factual project metadata and source URL retained pending fuller reuse review.",
    licence_url: "https://www.ulster.ac.uk/",
    coverage_years: { start: 2026, end: 2026 },
    time_coverage: "Ulster University CDHT planning-stage record selected in Round118.",
    spatial_granularity: "Frederick Street / campus project site point.",
    temporal_granularity: "Publication/planning-stage date.",
    update_frequency: "University news page publication",
    retrieved_at: retrievedAt,
    limitations: "Planning approval records are not construction start, completion, opening, operational research activity, clinical validation, or outcome evidence."
  },
  {
    source_id: "round118-ulster-belfast-campus-phase-two-contract-2015",
    city_ids: ["belfast"],
    title: "Ulster University Belfast campus phase two contract page",
    publisher: "Ulster University",
    bucket: "planning/development/architecture/education",
    access_url: "https://www.ulster.ac.uk/news/2015/april/ulster-university-announces-lagan-somague-joint-venture-for-belfast-campus-second-phase",
    licence: "Ulster University website copyright/terms; factual project metadata and source URL retained pending fuller reuse review.",
    licence_url: "https://www.ulster.ac.uk/",
    coverage_years: { start: 2015, end: 2015 },
    time_coverage: "Ulster University Belfast campus phase-two contract-stage record selected in Round118.",
    spatial_granularity: "York Street / campus project point.",
    temporal_granularity: "Month-level source-stage date due migrated-page date caveat.",
    update_frequency: "University news/archive page publication",
    retrieved_at: retrievedAt,
    limitations: "Contract-award stage is not construction start, completion, opening, occupancy, or campus outcome evidence. The migrated page date may differ from the original archive date."
  },
  {
    source_id: "round118-qub-capital-completed-projects",
    city_ids: ["belfast"],
    title: "Queen's University Belfast completed capital projects page",
    publisher: "Queen's University Belfast Estates Directorate",
    bucket: "planning/development/architecture/education",
    access_url: "https://www.qub.ac.uk/directorates/EstatesDirectorate/CapitalDevelopmentProgramme/CompletedProjects/",
    licence: "Queen's University Belfast website copyright/terms; factual project metadata and source URL retained pending fuller reuse review.",
    licence_url: "https://www.qub.ac.uk/",
    coverage_years: { start: 2016, end: 2025 },
    time_coverage: "Selected QUB completed-project rows in the 2008-2026 corpus window.",
    spatial_granularity: "Named university building/facility point.",
    temporal_granularity: "Month/year project completion date as stated by the source page.",
    update_frequency: "Living project list page",
    retrieved_at: retrievedAt,
    limitations: "Completion rows are not necessarily launch, opening, occupancy, public access, education/research activity, or outcome evidence. The page may change over time."
  },
  {
    source_id: "round118-dfc-harni-templemore-baths-status",
    city_ids: ["belfast"],
    title: "HARNI Templemore Baths status record",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    bucket: "planning/development/architecture/heritage_at_risk",
    access_url: "https://apps.communities-ni.gov.uk/HARNI/barniview.aspx?id=891&js=false",
    licence: "Crown copyright / public-sector information terms; factual status metadata and source URL retained, excluding images, mapping tiles, logos, and third-party content pending rights review.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2019, end: 2024 },
    time_coverage: "Templemore Baths HARNI status notes selected in Round118.",
    spatial_granularity: "Listed public baths building/site point.",
    temporal_granularity: "Status year or source-observed heritage-risk status date.",
    update_frequency: "Live record / record-specific update cadence",
    retrieved_at: retrievedAt,
    limitations: "HARNI status may lag project delivery. It is not a completion certificate, opening record, building-control record, detailed condition survey, or outcome evidence."
  }
];

const sourceIdAliases = {
  "hg8x-zxpr": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "hq68-rnsi": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "4hcv-tc5r": "nyc-parks-capital-project-tracker-4hcv-tc5r",
  "gla-canada-water-stage3-report-2026": "gla-planning-application-decisions",
  "planning-london-datahub-lbc": "gla-planning-datahub-applications",
  "NYC DDC official page": "nyc-ddc-public-building-press-pages",
  "nyc-ddc-press": "nyc-ddc-public-building-press-pages",
  "nyc-dcp-pluto": "nyc-pluto-mappluto-lots",
  "nyc-dcp-zap-bbl": "nyc-dcp-zap-bbl",
  "nyc-dcp-zap-project-data": "nyc-dcp-zap-project-data",
  "planning-data-article-4-legal-instrument": "planning-data-article-4-direction-area",
  "bcc-current-planning-applications-20260519": "bcc-current-planning-applications",
  "dfc-hed-buildings-harni": "dfc-hed-buildings-harni"
};

function canonicalSourceId(sourceId) {
  return sourceIdAliases[sourceId] || sourceId;
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
  if (candidate.dataset_page_url) return candidate.dataset_page_url;
  return candidate.source_dataset_url || "";
}

function sourceRecordIdFor(candidate) {
  if (candidate.source_record_id) return candidate.source_record_id;
  if (Array.isArray(candidate.source_record_ids) && candidate.source_record_ids.length > 0) return candidate.source_record_ids.join("; ");
  if (Array.isArray(candidate.planning_refs) && candidate.planning_refs.length > 0) return candidate.planning_refs.join("; ");
  if (candidate.raw_row?.project_id && candidate.raw_row?.building_id) return `${candidate.raw_row.project_id}:${candidate.raw_row.building_id}`;
  if (candidate.raw_row?.trackerid) return String(candidate.raw_row.trackerid);
  return candidate.candidate_id || candidate.event_id || "";
}

function dateFrom(candidate) {
  const value = candidate.date ||
    candidate.effective_date ||
    candidate.event_date ||
    candidate.date_fields?.decision_or_publication_date ||
    candidate.date_fields?.decision_date ||
    latestDateFromObject(candidate.dates) ||
    latestDateFromObject(candidate.date_fields) ||
    candidate.raw_row?.building_completion_date ||
    candidate.raw_row?.project_completion_date ||
    candidate.raw_row?.constructionactualcompletion;
  return normalizeDate(value);
}

function eventIdFor(candidate, date) {
  const prefix = { belfast: "bfs_arch", london: "lon_arch", nyc: "nyc_arch" }[candidate.city_id];
  const existing = safeText(candidate.event_id || "");
  if (prefix && existing.startsWith(prefix)) return existing;
  const token = candidate.candidate_id || candidate.event_id || `${candidate.title}_${sourceRecordIdFor(candidate)}_${date}`;
  return `${prefix}_${slugify(token)}`.slice(0, 140).replace(/_+$/g, "");
}

function sourceDateFieldFor(candidate) {
  const fields = [];
  if (candidate.source_date_field) fields.push(candidate.source_date_field);
  if (candidate.date_field) fields.push(candidate.date_field);
  if (candidate.date_basis) fields.push(candidate.date_basis);
  if (candidate.date_type) fields.push(candidate.date_type);
  return fields.filter(Boolean).join("; ") || "Observed administrative date from the cited source record.";
}

function limitationsFor(candidate) {
  const parts = [];
  if (Array.isArray(candidate.limitations)) parts.push(candidate.limitations.join(" "));
  else if (candidate.limitations) parts.push(candidate.limitations);
  if (candidate.confidence_note) parts.push(candidate.confidence_note);
  if (candidate.effective_date_note) parts.push(candidate.effective_date_note);
  parts.push("This event is retained as an observed, source-backed milestone only; broader design, delivery, usage, safety, affordability, regeneration, or causal claims are not inferred.");
  return parts.join(" ");
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
    area: safeText(candidate.area || candidate.address || candidate.location_name || candidate.location?.address || candidate.site || candidate.title || candidate.city_id),
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
    architect: safeText(candidate.architect || "Source record does not name a project architect."),
    project_type: safeText(candidate.project_type || candidate.subcategory || candidate.event_type || "official architecture-related record"),
    geometry_source: safeText(candidate.geometry_source || candidate.geometry?.source || candidate.location?.geometry_source || "Source candidate supplied official or cited approximate coordinates."),
    geometry_precision: safeText(candidate.geometry_precision || candidate.geometry?.precision || candidate.location?.geometry_precision || "source point for atlas navigation, not a measured project footprint"),
    license_or_terms_note: safeText(candidate.license_or_terms_note || candidate.license || candidate.license_terms || candidate.terms_note || "Source terms retained in source audit; review publisher terms before bulk redistribution."),
    attribution: safeText(candidate.attribution || candidate.publisher || candidate.source_name || primarySourceId),
    limitations: safeText(limitationsFor(candidate)),
    transformation_method: safeText(`Round118 ${packName} candidate ${candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title}; normalized by scripts/append_architecture_batch_20260519_round118_official.js after source-ID canonicalization, duplicate screening, required-provenance checks, overclaim wording cleanup, current-date guard, and city coordinate-envelope validation.`)
  };
}

function sourceToken(event) {
  const sourceId = event.source_dataset_id || (event.source_ids || [])[0] || "";
  const text = `${event.source_record_id || ""} ${event.source_url || ""} ${event.title || ""}`;
  if (sourceId === "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr") {
    const match = text.match(/\b\d+:\d+\b/);
    return match ? match[0] : text.toLowerCase();
  }
  if (sourceId === "nyc-parks-capital-project-tracker-4hcv-tc5r") {
    const match = text.match(/\b\d{3,}\b/);
    return match ? match[0] : text.toLowerCase();
  }
  if (sourceId === "nyc-dcp-zap-project-data" || sourceId === "nyc-dcp-zap-bbl") {
    const match = text.match(/\b\d{4}[A-Z]\d{4}\b/i);
    return match ? match[0].toUpperCase() : text.toLowerCase();
  }
  const planningRef = text.match(/\bLA04\/\d{4}\/\d{4}\/[A-Z]+\b/i)?.[0];
  if (planningRef) return planningRef.toUpperCase();
  const pld = text.match(/\bPLD:[^;\s]+/i)?.[0] || text.match(/\bPDU[-:]?\d{4,}\b/i)?.[0];
  if (pld) return pld.toUpperCase();
  if (sourceId.startsWith("planning-data-")) {
    const entity = text.match(/\bentity\s+(\d{6,})\b/i)?.[1] || text.match(/\/entity\/(\d{6,})\b/i)?.[1];
    if (entity) return `${sourceId}:${entity}`;
  }
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
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const cityEnvelopes = {
    belfast: { minLon: -6.12, maxLon: -5.74, minLat: 54.45, maxLat: 54.75 },
    london: { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 },
    nyc: { minLon: -74.2591, maxLon: -73.7004, minLat: 40.4774, maxLat: 40.9176 }
  };
  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");
  const batchIds = new Set();
  const batchSourceKeys = new Set();

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
    if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
    for (const sourceId of event.source_ids) {
      if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
    }
    const checked = [event.title, event.summary, event.observed_change, event.limitations, event.transformation_method, event.source_date_field, event.project_type, event.geometry_precision].join(" ");
    if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
    const comparable = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (Number.isNaN(comparable.getTime())) throw new Error(`Invalid date for ${event.event_id}: ${event.date}`);
    if (comparable > latestAllowedDate) throw new Error(`Future-dated record: ${event.event_id}`);
    if (comparable < earliestAllowedDate) throw new Error(`Pre-window record: ${event.event_id}`);
    const envelope = cityEnvelopes[event.city_id];
    const longitude = Number(event.longitude);
    const latitude = Number(event.latitude);
    if (!envelope || !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < envelope.minLon || longitude > envelope.maxLon || latitude < envelope.minLat || latitude > envelope.maxLat) {
      throw new Error(`Invalid or outside-${event.city_id}-envelope coordinates for ${event.event_id}`);
    }
    if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
    batchIds.add(event.event_id);
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
    batchSourceKeys.add(sourceKey);
  }
}

function upsertSources() {
  for (const sourceEntry of sourceEntries) {
    const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
    if (index >= 0) doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
    else doc.sources.push(sourceEntry);
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
  const registryPath = "config/source_registry.json";
  const registry = readJson(registryPath);
  const existing = new Set(registry.sources.map((source) => source.source_id));
  for (const source of sourceEntries) {
    if (!existing.has(source.source_id)) {
      registry.sources.push(registryEntryFromSource(source));
      existing.add(source.source_id);
    }
  }
  registry.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
}

function addSourceIdsToFamily(cityId, familyId, sourceIds) {
  const configPath = `config/cities/${cityId}.json`;
  const config = readJson(configPath);
  const family = config.source_families.find((item) => item.family_id === familyId);
  if (!family) throw new Error(`Missing ${cityId} ${familyId} source family`);
  const existing = new Set(family.source_ids);
  for (const sourceId of sourceIds) {
    if (!existing.has(sourceId)) {
      family.source_ids.push(sourceId);
      existing.add(sourceId);
    }
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function updateCityConfigs() {
  addSourceIdsToFamily("london", "planning", sourceEntries
    .filter((source) => source.city_ids.includes("london"))
    .map((source) => source.source_id));
  addSourceIdsToFamily("belfast", "planning", [
    "round118-dfc-harni-templemore-baths-status"
  ]);
  addSourceIdsToFamily("belfast", "transport", [
    "round118-dfi-york-street-station-investment-2021"
  ]);
  addSourceIdsToFamily("belfast", "civic_services", [
    "round118-brcd-belfast-stories-design-team-2023",
    "round118-bcc-belfast-blitz-memorial-designs-2026",
    "round118-dfc-lisburn-road-library-upgrade-2016",
    "round118-doh-belfast-maternity-nearing-completion-2022",
    "round118-ulster-cdht-planning-approval-2026",
    "round118-ulster-belfast-campus-phase-two-contract-2015",
    "round118-qub-capital-completed-projects"
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
    rejections: rejections.slice(0, 120)
  }, null, 2));
}

main();
