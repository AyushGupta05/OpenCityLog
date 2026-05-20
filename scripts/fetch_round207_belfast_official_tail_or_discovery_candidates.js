const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round207_belfast_official_tail_or_discovery";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const TARGET_CAP = 25;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const BELFAST = { minLat: 54.52, maxLat: 54.7, minLon: -6.08, maxLon: -5.78 };
const CIVIC_POINT = { lat: 54.59639, lon: -5.93018 };

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json")
};

const SOURCES = {
  bccValidationChecklist: {
    source_id: "bcc-planning-validation-checklist-2025-round207",
    source_name: "Planning Application Validation Checklist",
    publisher: "Belfast City Council",
    source_type: "official council planning application validation checklist page",
    source_family: "BCC planning application validation checklist",
    source_url: "https://www.belfastcity.gov.uk/documents/planning-application-validation-checklist/contents",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and embedded third-party material before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccValidationConsultation: {
    source_id: "bcc-yoursay-validation-checklist-consultation-round207",
    source_name: "Public Consultation - Draft Planning Application Validation Checklist",
    publisher: "Belfast City Council",
    source_type: "official council consultation page",
    source_family: "BCC planning application validation consultation",
    source_url: "https://yoursay.belfastcity.gov.uk/planning-application-validation-checklist",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify consultation-platform terms before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccValidationEqia: {
    source_id: "bcc-validation-checklist-equality-screening-2024-round207",
    source_name: "Planning Application Validation Checklist: Equality Screening Outcome Report",
    publisher: "Belfast City Council",
    source_type: "official council equality screening report page",
    source_family: "BCC planning validation equality screening",
    source_url: "https://www.belfastcity.gov.uk/Documents/Planning-Validation-Checklist-EQIA/Section-A-Details-about-the-policy-or-decision-to",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccMonitoring: {
    source_id: "bcc-land-availability-monitoring-2024-2025-round207",
    source_name: "Belfast Development Plan and Policy Monitoring",
    publisher: "Belfast City Council",
    source_type: "official council land availability monitoring page/report",
    source_family: "BCC land availability monitoring reports",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/development-plan-and-policy/monitoring",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; map viewers include OSNI/LPS restrictions and must not be redistributed without separate review.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council; monitor viewers may contain OSNI/LPS data."
  },
  dfcBudget: {
    source_id: "dfc-initial-budget-allocations-2025-2026-round207",
    source_name: "Oral statement NI Assembly - Communities Minister Gordon Lyons MLA - Initial Budget allocations 2025-26",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department ministerial budget statement",
    source_family: "DfC ministerial budget allocation statements",
    source_url: "https://www.communities-ni.gov.uk/news/oral-statement-ni-assembly-communities-minister-gordon-lyons-mla-initial-budget-allocations-2025-26",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party images before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  }
};

const SEEDS = [
  {
    key: "validation_consultation_opened_2024",
    source: "bccValidationConsultation",
    source_url: SOURCES.bccValidationConsultation.source_url,
    date: "2024-12-03",
    date_precision: "day",
    title: "Draft Planning Application Validation Checklist consultation opened",
    summary: "Belfast City Council's Your Say page records that public consultation on the draft Planning Application Validation Checklist opened on 3 December 2024.",
    observed_change: "Official council consultation page records an administrative consultation milestone for a planning application validation checklist.",
    milestone_type: "planning_validation_checklist_consultation_opened",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Your Say Belfast key date: Consultation open, 03 December 2024",
    source_date_field: "consultation key date",
    source_date_value: "2024-12-03"
  },
  {
    key: "validation_consultation_closed_2025",
    source: "bccValidationConsultation",
    source_url: SOURCES.bccValidationConsultation.source_url,
    date: "2025-02-10",
    date_precision: "day",
    title: "Draft Planning Application Validation Checklist consultation closed",
    summary: "Belfast City Council's Your Say page records that the draft Planning Application Validation Checklist consultation closed on 10 February 2025.",
    observed_change: "Official council consultation page records closure of an administrative consultation period.",
    milestone_type: "planning_validation_checklist_consultation_closed",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Your Say Belfast key date: Consultation closes, 10 February 2025",
    source_date_field: "consultation key date",
    source_date_value: "2025-02-10"
  },
  {
    key: "validation_eqia_published_2024",
    source: "bccValidationEqia",
    source_url: SOURCES.bccValidationEqia.source_url,
    date: "2024-12",
    date_precision: "month",
    title: "Planning Application Validation Checklist equality screening report was published",
    summary: "Belfast City Council's equality screening page for the draft Planning Application Validation Checklist is published as December 2024.",
    observed_change: "Official council equality-screening page records publication of an administrative screening document.",
    milestone_type: "planning_validation_checklist_equality_screening_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Planning Validation Checklist EQIA Section A page: Published December 2024",
    source_date_field: "page publication month",
    source_date_value: "December 2024"
  },
  {
    key: "validation_checklist_final_published_2025",
    source: "bccValidationChecklist",
    source_url: SOURCES.bccValidationChecklist.source_url,
    date: "2025-04-15",
    date_precision: "day",
    title: "Planning Application Validation Checklist was published",
    summary: "Belfast City Council's Planning Application Validation Checklist contents page is published on 15 April 2025 and lists the checklist sections and evidence requirements.",
    observed_change: "Official council planning page records publication of an administrative validation checklist for planning applications.",
    milestone_type: "planning_validation_checklist_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Planning Application Validation Checklist contents page: Published 15 April 2025",
    source_date_field: "page publication date",
    source_date_value: "2025-04-15"
  },
  {
    key: "validation_contextual_design_requirement_2025",
    source: "bccValidationChecklist",
    source_url: "https://www.belfastcity.gov.uk/documents/planning-application-validation-checklist/12-contextual-design-information",
    date: "2025-04-15",
    date_precision: "day",
    title: "Contextual Design Information validation requirement was published",
    summary: "Belfast City Council's validation checklist page for Contextual Design Information is published on 15 April 2025 and describes when design-context material is required for planning applications.",
    observed_change: "Official council checklist page records an administrative planning-validation evidence requirement.",
    milestone_type: "planning_validation_design_information_requirement_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Planning Application Validation Checklist item 12: Contextual Design Information, Published 15 April 2025",
    source_date_field: "page publication date",
    source_date_value: "2025-04-15"
  },
  {
    key: "validation_heritage_impact_requirement_2025",
    source: "bccValidationChecklist",
    source_url: "https://www.belfastcity.gov.uk/documents/planning-application-validation-checklist/22-heritage-impact-assessment",
    date: "2025-04-15",
    date_precision: "day",
    title: "Heritage Impact Assessment validation requirement was published",
    summary: "Belfast City Council's validation checklist includes a Heritage Impact Assessment evidence page in the April 2025 checklist set.",
    observed_change: "Official council checklist page records an administrative planning-validation evidence requirement for applications affecting heritage.",
    milestone_type: "planning_validation_heritage_impact_requirement_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Planning Application Validation Checklist item 22: Heritage Impact Assessment, Published 15 April 2025",
    source_date_field: "page publication date",
    source_date_value: "2025-04-15"
  },
  {
    key: "validation_tall_buildings_requirement_2025",
    source: "bccValidationChecklist",
    source_url: "https://www.belfastcity.gov.uk/documents/planning-application-validation-checklist/43-tall-buildings-design-statement",
    date: "2025-04-15",
    date_precision: "day",
    title: "Tall Buildings Design Statement validation requirement was published",
    summary: "Belfast City Council's validation checklist includes a Tall Buildings Design Statement evidence page in the April 2025 checklist set.",
    observed_change: "Official council checklist page records an administrative planning-validation evidence requirement.",
    milestone_type: "planning_validation_tall_buildings_requirement_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Planning Application Validation Checklist item 43: Tall Buildings Design Statement, Published 15 April 2025",
    source_date_field: "page publication date",
    source_date_value: "2025-04-15"
  },
  {
    key: "housing_land_monitor_2024_2025_published_2026",
    source: "bccMonitoring",
    source_url: "https://www.belfastcity.gov.uk/documents/belfast-housing-land-availability-monitor-summary/introduction",
    date: "2026-02",
    date_precision: "month",
    title: "Belfast Housing Land Availability Monitor 2024-2025 was published",
    summary: "Belfast City Council's online Housing Land Availability Monitor Summary Report for 2024-2025 is published as February 2026.",
    observed_change: "Official council monitoring page records publication of a land-availability monitoring report; this is an administrative monitoring record.",
    milestone_type: "housing_land_monitor_report_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Belfast Housing Land Availability Monitor Summary Report 2024-2025: Published February 2026",
    source_date_field: "page publication month",
    source_date_value: "February 2026"
  },
  {
    key: "employment_land_monitor_2024_2025_published_2026",
    source: "bccMonitoring",
    source_url: "https://www.belfastcity.gov.uk/documents/employment-monitor-report-2024-2025/introduction",
    date: "2026-02",
    date_precision: "month",
    title: "Belfast Employment Monitor Report 2024-2025 was published",
    summary: "Belfast City Council's online Employment Monitor Report for 2024-2025 is published as February 2026.",
    observed_change: "Official council monitoring page records publication of an employment-land monitoring report; this is an administrative monitoring record.",
    milestone_type: "employment_land_monitor_report_publication",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Employment Monitor Report 2024-2025: Published February 2026",
    source_date_field: "page publication month",
    source_date_value: "February 2026"
  },
  {
    key: "glencairn_community_centre_budget_support_2025",
    source: "dfcBudget",
    source_url: SOURCES.dfcBudget.source_url,
    date: "2025-06-02",
    date_precision: "day",
    title: "Glencairn Community Partnership new-build community centre support was announced",
    summary: "A Department for Communities ministerial budget statement dated 2 June 2025 states support for a new-build community centre for Glencairn Community Partnership.",
    observed_change: "Official department budget statement records a funding/support milestone for a named community infrastructure project. It does not record construction start, completion or opening.",
    milestone_type: "community_facility_budget_support_announcement",
    area: "Glencairn, Belfast",
    lat: 54.624,
    lon: -5.971,
    source_record_id: "DfC 2025-26 initial budget allocations statement: support for new build community centre for Glencairn Community Partnership",
    source_date_field: "statement publication date",
    source_date_value: "2025-06-02"
  }
];

const MANUAL_REJECTS = [
  {
    seed_key: "dfc_albertbridge_carnforth_development_brief_2026",
    title: "269-283 Albertbridge Road and 2 Carnforth Street development brief was published",
    date: "2026-02-02",
    source_url: "https://www.communities-ni.gov.uk/publications/269-283-albertbridge-road-and-2-carnforth-street-belfast-development-brief",
    reasons: ["duplicate_current_corpus_and_prior_pack_round124"]
  },
  {
    seed_key: "dfc_five_cs_accessibility_report_2024",
    title: "Five Cs Public Realm Project Accessibility and Inclusion Report was published",
    date: "2024-10-02",
    source_url: "https://www.communities-ni.gov.uk/publications/five-cs-public-realm-project-accessibility-inclusion-report",
    reasons: ["duplicate_current_corpus_and_prior_pack_round189"]
  },
  {
    seed_key: "bcc_city_quays_gardens_opened_2024",
    title: "City Quays Gardens opened",
    date: "2024",
    source_url: "https://www.belfastcity.gov.uk/news/belfast-city-centre-regeneration-steps-up-a-gear",
    reasons: ["duplicate_or_rejected_in_prior_round183", "source_family_already_represented_in_round183"]
  },
  {
    seed_key: "dfc_ardoyne_youth_enterprise_budget_support_2025",
    title: "Ardoyne Youth Enterprise youth hub budget support was announced",
    date: "2025-06-02",
    source_url: SOURCES.dfcBudget.source_url,
    reasons: ["related_project_stage_already_in_current_corpus", "less_specific_than_existing_tender_or_works_record"]
  },
  {
    seed_key: "dfc_bloomfield_community_association_budget_support_2025",
    title: "Bloomfield Community Association centre redevelopment support was announced",
    date: "2025-06-02",
    source_url: SOURCES.dfcBudget.source_url,
    reasons: ["related_project_stage_already_in_current_corpus", "less_specific_than_existing_design_contract_record"]
  },
  {
    seed_key: "dfc_northern_ireland_community_infrastructure_fund_2025",
    title: "Northern Ireland Community Infrastructure Fund opened for expressions of interest",
    date: "2025-10-01",
    source_url: "https://www.communities-ni.gov.uk/articles/northern-ireland-community-infrastructure-fund",
    reasons: ["not_belfast_specific_enough_for_city_id_belfast_candidate"]
  },
  {
    seed_key: "dfc_newforge_visit_2025",
    title: "Ministers visited Newforge multi-sports facility",
    date: "2025-04-09",
    source_url: "https://www.communities-ni.gov.uk/news/ministers-visit-sports-grounds-belfast-carrick-and-larne",
    reasons: ["visit_record_only", "does_not_date_physical_change"]
  }
];

const DEDUPE_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "web/data/city-atlas/cities/belfast/events.json",
  ...Array.from({ length: 20 }, (_, i) => `web/data/city-atlas/cities/belfast/events_${2007 + i}.json`)
];

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

function norm(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function flattenRecords(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const key of ["events", "candidates", "records", "items"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function allPriorBelfastPacks() {
  const base = path.join(ROOT, "tmp", "subagents");
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase().includes("belfast") && entry.name !== ROUND_ID)
    .map((entry) => `tmp/subagents/${entry.name}/candidates.json`);
}

function buildDedupeIndex() {
  const files = [...DEDUPE_FILES, ...allPriorBelfastPacks()];
  const index = {
    eventIds: new Set(),
    sourceRecordDate: new Set(),
    sourceUrlDate: new Set(),
    titleDate: new Set(),
    indexedFiles: []
  };

  for (const relPath of files) {
    const filePath = path.join(ROOT, relPath);
    const data = readJson(filePath);
    const records = flattenRecords(data);
    if (!records.length) continue;
    index.indexedFiles.push({ path: relPath.replace(/\\/g, "/"), record_count: records.length });
    for (const record of records) {
      const eventId = record.event_id || record.id || record.candidate_id;
      const date = record.date || record.effective_date || record.year;
      const sourceUrl = record.source_url || record.url || record.provenance?.source_url;
      const sourceRecordId = record.source_record_id || record.provenance?.source_record_id;
      if (eventId) index.eventIds.add(norm(eventId));
      if (sourceRecordId && date) index.sourceRecordDate.add(`${norm(sourceRecordId)}|${date}`);
      if (sourceUrl && date) index.sourceUrlDate.add(`${norm(sourceUrl)}|${date}`);
      if (record.title && date) index.titleDate.add(`${norm(record.title)}|${date}`);
    }
  }
  return index;
}

function inBelfast(lat, lon) {
  return lat >= BELFAST.minLat && lat <= BELFAST.maxLat && lon >= BELFAST.minLon && lon <= BELFAST.maxLon;
}

function inDateWindow(date) {
  return String(date) >= DATE_MIN && String(date) <= DATE_MAX;
}

function makeCandidate(seed) {
  const source = SOURCES[seed.source];
  const eventId = `round207_belfast_${slug(seed.key)}`;
  const limitations = [
    "Administrative/source-reported record only; do not treat as construction start, completion, opening, occupation, delivery outcome, impact evidence or causal evidence.",
    "Representative point geometry is for Belfast atlas navigation only and is not a policy boundary, parcel, building footprint, works extent, or surveyed asset location.",
    "Source page terms, copyright and any embedded third-party material should be reviewed before production import."
  ];
  if (source.source_id === SOURCES.bccMonitoring.source_id) {
    limitations.push("Do not reuse map-viewer or site-level OSNI/LPS geometry from this record without separate licence review.");
  }

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    id: eventId,
    candidate_id: eventId,
    event_id: eventId,
    event_id_suggestion: `bfs_arch_${eventId}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: null,
    date_precision: seed.date_precision,
    bucket: "planning/development/architecture/public-realm/community-facilities",
    event_family: "architecture/official-public-record",
    milestone_type: seed.milestone_type,
    title: seed.title,
    summary: seed.summary,
    observed_change: seed.observed_change,
    area: seed.area,
    lat: seed.lat,
    lon: seed.lon,
    latitude: seed.lat,
    longitude: seed.lon,
    geometry: { type: "Point", coordinates: [seed.lon, seed.lat] },
    geometry_ref: seed.source_url,
    source_id: source.source_id,
    source_ids: [source.source_id],
    source_name: source.source_name,
    source_family: source.source_family,
    publisher: source.publisher,
    source_url: seed.source_url,
    source_record_id: seed.source_record_id,
    source_type: source.source_type,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    accessed_at: GENERATED_AT,
    retrieved_at: GENERATED_AT,
    source_retrieved_at: GENERATED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.source_date_value,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: seed.milestone_type.replace(/_/g, " "),
    geometry_source: seed.area === "Belfast City Council area"
      ? "Representative point at Belfast City Hall for a citywide administrative planning or monitoring record."
      : `Approximate review point for ${seed.area}.`,
    geometry_precision: seed.area === "Belfast City Council area"
      ? "representative citywide administrative point, not a boundary"
      : "approximate named-area point, not a surveyed site boundary",
    limitations,
    transformation_method: "Round 207 manual tail/discovery ETL: official/public BCC and DfC pages were screened for Belfast records not represented by the round177/183/189/195/201 source-family focus, weak or duplicate records were rejected, required provenance fields were normalized, Belfast envelope/date-window checks were applied, and event_id/source-record-date/source-url-date/title-date duplicate keys were compared with the current corpus and prior Belfast candidate packs.",
    raw_source_hint: seed.source_record_id
  };
}

function validate(candidate) {
  const required = [
    "id", "title", "summary", "date", "date_precision", "city_id", "lat", "lon", "source_url",
    "source_record_id", "source_ids", "source_name", "publisher", "source_type", "license",
    "attribution", "retrieved_at", "confidence", "limitations", "transformation_method"
  ];
  const missing = required.filter((key) => candidate[key] === undefined || candidate[key] === null || candidate[key] === "");
  if (!Array.isArray(candidate.source_ids) || !candidate.source_ids.length) missing.push("source_ids_empty");
  if (!inDateWindow(candidate.date)) missing.push("outside_date_window");
  if (!inBelfast(candidate.lat, candidate.lon)) missing.push("outside_belfast_envelope");
  if (candidate.city_id !== "belfast") missing.push("city_id_not_belfast");
  if (!["documented", "corroborated", "inferred", "disputed"].includes(candidate.confidence)) missing.push("invalid_confidence");
  return missing;
}

function duplicateReason(candidate, index, accepted) {
  const eventKey = norm(candidate.event_id);
  const sourceRecordKey = `${norm(candidate.source_record_id)}|${candidate.date}`;
  const sourceUrlKey = `${norm(candidate.source_url)}|${candidate.date}`;
  const titleKey = `${norm(candidate.title)}|${candidate.date}`;
  if (index.eventIds.has(eventKey)) return "duplicate_event_id_existing";
  if (index.sourceRecordDate.has(sourceRecordKey)) return "duplicate_source_record_date_existing";
  if (index.sourceUrlDate.has(sourceUrlKey)) return "duplicate_source_url_date_existing";
  if (index.titleDate.has(titleKey)) return "duplicate_title_date_existing";
  if (accepted.eventIds.has(eventKey)) return "duplicate_event_id_within_round";
  if (accepted.sourceRecordDate.has(sourceRecordKey)) return "duplicate_source_record_date_within_round";
  if (accepted.sourceUrlDate.has(sourceUrlKey)) return "duplicate_source_url_date_within_round";
  if (accepted.titleDate.has(titleKey)) return "duplicate_title_date_within_round";
  return null;
}

async function auditSource(sourceId, sourceUrl) {
  const source = Object.values(SOURCES).find((item) => item.source_id === sourceId);
  const started = Date.now();
  let status = null;
  let ok = false;
  let finalUrl = sourceUrl;
  let hash = null;
  let error = null;
  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "Bims-5 round207 Belfast provenance auditor" }
    });
    status = response.status;
    ok = response.ok;
    finalUrl = response.url || sourceUrl;
    const body = await response.text();
    hash = crypto.createHash("sha256").update(body).digest("hex");
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  }

  return {
    source_id: sourceId,
    source_name: source.source_name,
    publisher: source.publisher,
    url: sourceUrl,
    final_url: finalUrl,
    source_type: source.source_type,
    source_family: source.source_family,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    coverage_years: "Selected official/public Belfast records dated between 2008-01-01 and 2026-05-19 where a publication, consultation, monitoring-report, or budget-statement date is present.",
    update_frequency: source.source_type.includes("statement") || source.source_type.includes("consultation") ? "Published record; may receive corrections." : "Council page/report; may be updated by publisher.",
    geographic_scope: "Belfast City Council area or named Belfast community/project area.",
    granularity: "Administrative planning checklist section, consultation key date, monitoring report publication, or budget-allocation statement.",
    key_fields: ["title", "publication/consultation/statement date", "publisher", "source URL", "record text", "license/attribution"],
    reliability_assessment: ok ? "usable with caveats" : "risky",
    required_caveats: [
      "Use as administrative/source-reported evidence only.",
      "Do not treat checklist, consultation, monitoring or budget-allocation records as evidence of physical delivery.",
      "Representative points are not boundaries, parcels, footprints, or works extents."
    ],
    ingestion_recommendation: ok ? "Candidate-level ingestion after taxonomy and source-family review." : "Hold until source URL can be retrieved and checked.",
    retrieval: {
      retrieved_at: GENERATED_AT,
      http_status: status,
      ok,
      elapsed_ms: Date.now() - started,
      content_sha256: hash,
      error
    }
  };
}

function countBy(records, field) {
  return records.reduce((acc, record) => {
    const key = record[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildDedupeIndex();
  const acceptedKeys = { eventIds: new Set(), sourceRecordDate: new Set(), sourceUrlDate: new Set(), titleDate: new Set() };
  const candidates = [];
  const rejected = [...MANUAL_REJECTS];

  for (const seed of SEEDS) {
    const candidate = makeCandidate(seed);
    const validation = validate(candidate);
    const duplicate = duplicateReason(candidate, index, acceptedKeys);
    if (validation.length || duplicate || candidates.length >= TARGET_CAP) {
      rejected.push({
        seed_key: seed.key,
        title: candidate.title,
        date: candidate.date,
        source_url: candidate.source_url,
        reasons: [...validation, duplicate, candidates.length >= TARGET_CAP ? "target_cap_reached" : null].filter(Boolean)
      });
      continue;
    }
    candidates.push(candidate);
    acceptedKeys.eventIds.add(norm(candidate.event_id));
    acceptedKeys.sourceRecordDate.add(`${norm(candidate.source_record_id)}|${candidate.date}`);
    acceptedKeys.sourceUrlDate.add(`${norm(candidate.source_url)}|${candidate.date}`);
    acceptedKeys.titleDate.add(`${norm(candidate.title)}|${candidate.date}`);
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.event_id.localeCompare(b.event_id));
  const uniqueSourceUrlPairs = [...new Map(candidates.map((candidate) => [`${candidate.source_id}|${candidate.source_url}`, [candidate.source_id, candidate.source_url]])).values()];
  const audit = await Promise.all(uniqueSourceUrlPairs.map(([sourceId, sourceUrl]) => auditSource(sourceId, sourceUrl)));
  const dates = candidates.map((candidate) => candidate.date).sort();

  const summary = {
    schema_version: "round207.belfast_official_tail_or_discovery.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
    manual_reject_count: MANUAL_REJECTS.length,
    accepted_candidates: candidates.length,
    rejected_candidates: rejected.length,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: dates.length ? { min: dates[0], max: dates[dates.length - 1] } : null,
    counts_by_year: candidates.reduce((acc, candidate) => {
      const year = String(candidate.date).slice(0, 4);
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {}),
    counts_by_source_id: countBy(candidates, "source_id"),
    counts_by_source_name: countBy(candidates, "source_name"),
    counts_by_source_family: countBy(candidates, "source_family"),
    counts_by_milestone_type: countBy(candidates, "milestone_type"),
    source_mix: countBy(candidates, "source_family"),
    source_audit: {
      audited_source_urls: audit.length,
      retrieved_ok: audit.filter((item) => item.retrieval.ok).length,
      retrieval_failures: audit.filter((item) => !item.retrieval.ok).map((item) => ({
        source_id: item.source_id,
        url: item.url,
        http_status: item.retrieval.http_status,
        error: item.retrieval.error
      }))
    },
    dedupe: {
      indexed_files: index.indexedFiles,
      indexed_event_ids: index.eventIds.size,
      indexed_source_record_date_keys: index.sourceRecordDate.size,
      indexed_source_url_date_keys: index.sourceUrlDate.size,
      indexed_title_date_keys: index.titleDate.size,
      duplicate_rejects: rejected.filter((item) => item.reasons.some((reason) => reason.includes("duplicate"))).length,
      explicit_duplicate_exclusion_rounds: [
        "tmp/subagents/round177_belfast_official_architecture_expansion/candidates.json",
        "tmp/subagents/round183_belfast_deep_public_realm/candidates.json",
        "tmp/subagents/round189_belfast_deep_committee/candidates.json",
        "tmp/subagents/round195_belfast_deep_tail/candidates.json",
        "tmp/subagents/round201_belfast_final_deep_tail/candidates.json"
      ]
    },
    output_files: {
      candidates: `tmp/subagents/${ROUND_ID}/candidates.json`,
      source_audit: `tmp/subagents/${ROUND_ID}/source_audit.json`,
      summary: `tmp/subagents/${ROUND_ID}/summary.json`,
      notes: `tmp/subagents/${ROUND_ID}/notes.md`,
      rejected: `tmp/subagents/${ROUND_ID}/rejected.json`
    },
    caveat: "This is a conservative tail/discovery pack. Records are source-backed candidates only and must not be counted as physical completions, construction starts, delivery outcomes, causation, forecasts, or impact evidence."
  };

  writeJson(OUTPUTS.candidates, {
    schema_version: "round207.belfast_official_tail_or_discovery.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    candidate_count: candidates.length,
    source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids))].sort(),
    source_urls: [...new Set(candidates.map((candidate) => candidate.source_url))].sort(),
    deduped_against: index.indexedFiles.map((item) => item.path),
    scope_note: "Conservative Belfast official tail/discovery candidates from BCC planning-validation, BCC land-monitoring, and DfC budget-allocation source families not represented by the source-family focus in rounds 177/183/189/195/201. Wording is administrative/observed only.",
    candidates
  });
  writeJson(OUTPUTS.sourceAudit, {
    schema_version: "round207.belfast_official_tail_or_discovery.source_audit.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    audit
  });
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.rejected, {
    schema_version: "round207.belfast_official_tail_or_discovery.rejected.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    rejected_count: rejected.length,
    rejected
  });
  fs.writeFileSync(OUTPUTS.notes, [
    "# Round 207 Belfast Official Tail / Discovery Notes",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Scope",
    "",
    "This scratch-only pack targets one final conservative Belfast official/public tail. Belfast easy official sources are close to exhausted, so the accepted candidates are administrative records from BCC planning-validation, BCC land-monitoring and one DfC ministerial budget-allocation statement rather than built-work delivery records.",
    "",
    "## Method",
    "",
    "- Manual source-backed seeds only; no corpus or appender edits.",
    "- Required provenance fields are emitted on every accepted candidate.",
    "- Duplicate exclusion indexes the current manual corpus, Belfast atlas event chunks, all prior Belfast subagent packs, and explicitly rounds 177, 183, 189, 195 and 201.",
    "- Duplicate keys checked: event id, source-record/date, source-url/date and title/date.",
    "- Each accepted source URL is fetched into `source_audit.json` with HTTP status and content hash.",
    "",
    "## Caveats",
    "",
    "- These records are administrative planning checklist, consultation, monitoring-report, or budget-allocation milestones.",
    "- They are not construction starts, completions, openings, occupations, final designs, policy outcomes, or delivery evidence.",
    "- Representative points should not be treated as policy boundaries, parcels, asset footprints, public-realm extents, or map-viewer geometries.",
    "- OSNI/LPS-linked map viewer material from BCC monitoring pages requires separate licence review before any reuse.",
    "- No candidate claims causation, prediction, economic impact, housing delivery, environmental improvement, or transport/public-realm outcome.",
    "",
    "## Outputs",
    "",
    `- Candidates: ${summary.output_files.candidates}`,
    `- Source audit: ${summary.output_files.source_audit}`,
    `- Summary: ${summary.output_files.summary}`,
    `- Rejected: ${summary.output_files.rejected}`,
    "",
    `Accepted candidates: ${candidates.length}`,
    `Rejected seeds/records: ${rejected.length}`,
    ""
  ].join("\n"));

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    accepted: candidates.length,
    rejected: rejected.length,
    date_range: summary.emitted_date_range,
    retrieval_ok: summary.source_audit.retrieved_ok,
    retrieval_failures: summary.source_audit.retrieval_failures.length,
    out_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
