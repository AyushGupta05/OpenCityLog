const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round201_belfast_final_deep_tail";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const TARGET_CAP = 25;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const BELFAST = { minLat: 54.52, maxLat: 54.7, minLon: -6.08, maxLon: -5.78 };
const CIVIC_POINT = { lat: 54.59639, lon: -5.93018 };

const SOURCE_BASE = {
  bccLdpSpg: {
    source_id: "bcc-ldp-spg-may-2023-round201",
    source_name: "LDP Plan Strategy (May 2023) Supplementary Planning Guidance",
    publisher: "Belfast City Council",
    source_type: "official council supplementary planning guidance page",
    source_family: "BCC Local Development Plan / Supplementary Planning Guidance",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and embedded third-party material before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccLdp: {
    source_id: "bcc-local-development-plan-round201",
    source_name: "Belfast Local Development Plan",
    publisher: "Belfast City Council",
    source_type: "official council local development plan page",
    source_family: "BCC Local Development Plan statutory planning policy pages",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccDeveloperContributions: {
    source_id: "bcc-developer-contributions-monitoring-round201",
    source_name: "Developer contributions Annual Monitoring Report",
    publisher: "Belfast City Council",
    source_type: "official council developer-contributions monitoring page",
    source_family: "BCC planning monitoring / developer contributions pages",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify report-specific copyright before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  dfcFrameworks: {
    source_id: "dfc-belfast-urban-regeneration-frameworks-round201",
    source_name: "DfC Belfast urban regeneration plans and frameworks",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department regeneration plan/framework publication page",
    source_family: "DfC Belfast urban regeneration plans/frameworks",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify publication-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  },
  dfcNews: {
    source_id: "dfc-belfast-regeneration-news-round201",
    source_name: "DfC Belfast regeneration news",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department regeneration news page",
    source_family: "DfC Belfast regeneration news/admin pages",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify image-specific rights before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  }
};

const SPG_URLS = {
  affordable: "https://www.belfastcity.gov.uk/Documents/Affordable-housing-and-housing-mix",
  viability: "https://www.belfastcity.gov.uk/Documents/Development-Viability",
  residentialDesign: "https://www.belfastcity.gov.uk/Documents/Residential-Design-including-adaptable-and-access",
  residentialExtensions: "https://www.belfastcity.gov.uk/Documents/Residential-Extensions-and-Alterations",
  placemaking: "https://www.belfastcity.gov.uk/Documents/Placemaking-and-Urban-Design",
  tallBuildings: "https://www.belfastcity.gov.uk/Documents/Tall-Buildings",
  masterplanning: "https://www.belfastcity.gov.uk/Documents/Masterplanning-Approach-for-Major-Development",
  advertising: "https://www.belfastcity.gov.uk/Documents/Advertising-and-signage",
  retail: "https://www.belfastcity.gov.uk/Documents/Retail-and-Main-Town-Centre-Uses",
  employmentLand: "https://www.belfastcity.gov.uk/Documents/Loss-of-zoned-employment-land",
  nightTime: "https://www.belfastcity.gov.uk/Documents/Evening-and-night-time-economy",
  sensitiveUses: "https://www.belfastcity.gov.uk/Documents/Sensitive-Uses",
  transportation: "https://www.belfastcity.gov.uk/Documents/Transportation",
  waste: "https://www.belfastcity.gov.uk/Documents/Waste-Infrastructure",
  floodRisk: "https://www.belfastcity.gov.uk/Documents/Planning-and-flood-risk",
  suds: "https://www.belfastcity.gov.uk/Documents/Sustainable-Drainage-Systems-(SuDS)",
  trees: "https://www.belfastcity.gov.uk/Documents/Trees-and-Development"
};

const SEEDS = [
  ...[
    ["affordable", "Affordable housing and housing mix SPG was published", "Belfast City Council's LDP SPG page links the Affordable housing and housing mix guidance in the May 2023 SPG set.", "affordable_housing_policy_guidance_publication"],
    ["viability", "Development viability SPG was published", "Belfast City Council's LDP SPG page links the Development viability guidance in the May 2023 SPG set.", "development_viability_guidance_publication"],
    ["residentialDesign", "Residential design SPG was published", "Belfast City Council's LDP SPG page links the Residential design guidance, including adaptable and accessible accommodation, in the May 2023 SPG set.", "residential_design_guidance_publication"],
    ["residentialExtensions", "Residential extensions and alterations SPG was published", "Belfast City Council's LDP SPG page links the Residential extensions and alterations guidance in the May 2023 SPG set.", "residential_alterations_guidance_publication"],
    ["placemaking", "Placemaking and urban design SPG was published", "Belfast City Council's LDP SPG page links the Placemaking and urban design guidance in the May 2023 SPG set.", "placemaking_guidance_publication"],
    ["tallBuildings", "Tall buildings SPG was published", "Belfast City Council's LDP SPG page links the Tall buildings guidance in the May 2023 SPG set.", "tall_buildings_guidance_publication"],
    ["masterplanning", "Masterplanning approach for major development SPG was published", "Belfast City Council's LDP SPG page links the Masterplanning approach for major development guidance in the May 2023 SPG set.", "masterplanning_guidance_publication"],
    ["advertising", "Advertising and signage SPG was published", "Belfast City Council's LDP SPG page links the Advertising and signage guidance in the May 2023 SPG set.", "advertising_signage_guidance_publication"],
    ["retail", "Retail and main town centre uses SPG was published", "Belfast City Council's LDP SPG page links the Retail and main town centre uses guidance in the May 2023 SPG set.", "retail_town_centre_guidance_publication"],
    ["employmentLand", "Loss of zoned employment land SPG was published", "Belfast City Council's LDP SPG page links the Loss of zoned employment land guidance in the May 2023 SPG set.", "employment_land_guidance_publication"],
    ["nightTime", "Evening and night-time economy SPG was published", "Belfast City Council's LDP SPG page links the Evening and night-time economy guidance in the May 2023 SPG set.", "night_time_economy_guidance_publication"],
    ["sensitiveUses", "Sensitive uses SPG was published", "Belfast City Council's LDP SPG page links the Sensitive uses guidance in the May 2023 SPG set.", "sensitive_uses_guidance_publication"],
    ["transportation", "Transportation SPG was published", "Belfast City Council's LDP SPG page links the Transportation guidance in the May 2023 SPG set.", "transportation_guidance_publication"],
    ["waste", "Waste infrastructure SPG was published", "Belfast City Council's LDP SPG page links the Waste infrastructure guidance in the May 2023 SPG set.", "waste_infrastructure_guidance_publication"],
    ["floodRisk", "Planning and flood risk SPG was published", "Belfast City Council's LDP SPG page links the Planning and flood risk guidance in the May 2023 SPG set.", "flood_risk_guidance_publication"],
    ["suds", "Sustainable drainage systems SPG was published", "Belfast City Council's LDP SPG page links the Sustainable drainage systems guidance in the May 2023 SPG set.", "suds_guidance_publication"],
    ["trees", "Trees and development SPG was published", "Belfast City Council's LDP SPG page links the Trees and development guidance in the May 2023 SPG set.", "trees_development_guidance_publication"]
  ].map(([key, title, summary, milestone_type]) => ({
    key: `ldp_spg_${key}_published_2023`,
    source_key: "bccLdpSpg",
    source_url: SPG_URLS[key],
    date: "2023-05",
    date_precision: "month",
    title,
    summary,
    observed_change: "Official council planning-policy page records publication of non-statutory supplementary planning guidance; this is an administrative planning-policy record, not a built-work completion.",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: `LDP Plan Strategy May 2023 SPG topic: ${title.replace(" was published", "")}`,
    source_date_field: "document page publication month",
    source_date_value: "May 2023",
    milestone_type
  })),
  {
    key: "ldp_spg_draft_consultation_opened_2022",
    source_key: "bccLdpSpg",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/development-plan-and-policy/supplementary-planning-guidance/ldp-plan-strategy-%28may-2023%29-spg",
    date: "2022-05-12",
    date_precision: "day",
    title: "Draft LDP Supplementary Planning Guidance consultation opened",
    summary: "Belfast City Council's LDP SPG page records that the draft SPG documents were subject to public consultation from 12 May 2022 to 4 August 2022.",
    observed_change: "Official council planning-policy page records an administrative consultation milestone for the LDP SPG set.",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "LDP SPG page: draft SPG public consultation from 12 May 2022 to 4 August 2022",
    source_date_field: "consultation opening date",
    source_date_value: "2022-05-12",
    milestone_type: "supplementary_planning_guidance_consultation_opened"
  },
  {
    key: "ldp_plan_strategy_adopted_2023",
    source_key: "bccLdp",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/local-development-plan-%281%29/adoption-of-ldp-plan-strategy",
    date: "2023-05-02",
    date_precision: "day",
    title: "Belfast Local Development Plan Strategy was adopted",
    summary: "Belfast City Council states that the Belfast Local Development Plan Strategy was formally adopted on 2 May 2023.",
    observed_change: "Official council LDP page records adoption of the Plan Strategy as an administrative planning-policy milestone.",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Adoption of LDP Plan Strategy page: formally adopted on 2 May 2023",
    source_date_field: "formal adoption date",
    source_date_value: "2023-05-02",
    milestone_type: "local_development_plan_strategy_adoption"
  },
  {
    key: "ldp_revised_timetable_published_2023",
    source_key: "bccLdp",
    source_url: "https://www.belfastcity.gov.uk/ldp",
    date: "2023-11-15",
    date_precision: "day",
    title: "Revised Local Development Plan timetable notice was published",
    summary: "Belfast City Council's LDP page records a 15 November 2023 update giving notice of the revised Local Development Plan timetable after DfI approval in October 2023.",
    observed_change: "Official council LDP page records an administrative timetable-publication milestone for the Local Policies Plan process.",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "LDP page update 15 November 2023: revised Local Development Plan Timetable approved by DfI in October 2023",
    source_date_field: "page update date",
    source_date_value: "2023-11-15",
    milestone_type: "local_development_plan_timetable_notice"
  },
  {
    key: "developer_contributions_amr_period_closed_2020",
    source_key: "bccDeveloperContributions",
    source_url: "https://www.belfastcity.gov.uk/Planning-and-building-control/Planning/Development-plan-and-policy/Supplementary-planning-guidance/Developer-contributions-Annual-Monitoring-Report",
    date: "2020-03-31",
    date_precision: "period_end",
    title: "First developer contributions monitoring period closed",
    summary: "Belfast City Council's Developer Contributions Annual Monitoring Report page states that the inaugural report covers the financial period from April 2015 to March 2020.",
    observed_change: "Official council planning-monitoring page records the close of a developer-contributions reporting period; it is not evidence that any individual project was delivered.",
    area: "Belfast City Council area",
    ...CIVIC_POINT,
    source_record_id: "Developer Contributions Annual Monitoring Report page: inaugural report covers April 2015 to March 2020",
    source_date_field: "reporting period end",
    source_date_value: "2020-03-31",
    milestone_type: "developer_contributions_monitoring_period"
  },
  {
    key: "dfc_westside_masterplan_published_2009",
    source_key: "dfcFrameworks",
    source_url: "https://www.communities-ni.gov.uk/publications/belfast-city-centre-westside-regeneration-masterplan",
    date: "2009-09-15",
    date_precision: "day",
    title: "Westside regeneration masterplan was published",
    summary: "The Department for Communities publication page records the Belfast city centre Westside regeneration masterplan as published on 15 September 2009.",
    observed_change: "Official department publication page records a regeneration masterplan publication milestone.",
    area: "Westside, Belfast city centre",
    lat: 54.5963,
    lon: -5.9361,
    source_record_id: "DfC publication page: Belfast city centre - Westside regeneration masterplan; Date published 15 September 2009",
    source_date_field: "date published",
    source_date_value: "2009-09-15",
    milestone_type: "regeneration_masterplan_publication"
  },
  {
    key: "dfc_public_realm_masterplan_update_published_2013",
    source_key: "dfcFrameworks",
    source_url: "https://www.communities-ni.gov.uk/publications/belfast-city-centre-public-realm-masterplan-report-and-update",
    date: "2013-10-24",
    date_precision: "day",
    title: "Belfast city centre public realm masterplan update was published",
    summary: "The Department for Communities publication page records the Belfast city centre public realm masterplan report and update as published on 24 October 2013.",
    observed_change: "Official department publication page records a public-realm masterplan/report publication milestone.",
    area: "Belfast city centre",
    ...CIVIC_POINT,
    source_record_id: "DfC publication page: Belfast city centre public realm masterplan report and update; Date published 24 October 2013",
    source_date_field: "date published",
    source_date_value: "2013-10-24",
    milestone_type: "public_realm_masterplan_publication"
  },
  {
    key: "dfc_adopted_bcc_regeneration_strategy_2016",
    source_key: "dfcNews",
    source_url: "https://www.communities-ni.gov.uk/news/new-way-ahead-regeneration-belfast-city-centre",
    date: "2016-03-21",
    date_precision: "day",
    title: "DfC/DSD adoption of Belfast city-centre regeneration strategy was announced",
    summary: "The Department for Communities news page records that DSD, working with Belfast City Council, agreed to adopt the council's regeneration and investment strategy going forward.",
    observed_change: "Official department news page records an administrative strategy-adoption/joint-working milestone.",
    area: "Belfast city centre",
    ...CIVIC_POINT,
    source_record_id: "DfC news 21 March 2016: DSD agreed to adopt the Council's regeneration and investment strategy going forward",
    source_date_field: "date published",
    source_date_value: "2016-03-21",
    milestone_type: "regeneration_strategy_adoption_announcement"
  },
  {
    key: "dfc_queens_quay_consultation_launched_2021",
    source_key: "dfcNews",
    source_url: "https://www.communities-ni.gov.uk/news/hargey-launches-queens-quay-development-consultation",
    date: "2021-11-29",
    date_precision: "day",
    title: "Queen's Quay development consultation was launched",
    summary: "The Department for Communities news page records the launch of consultation on the future development of the Queen's Quay area of Belfast's waterfront on 29 November 2021.",
    observed_change: "Official department news page records an administrative consultation-launch milestone for a waterfront development area.",
    area: "Queen's Quay, Belfast waterfront",
    lat: 54.6045,
    lon: -5.9146,
    source_record_id: "DfC news 29 November 2021: consultation launched on future development of the Queen's Quay area",
    source_date_field: "date published",
    source_date_value: "2021-11-29",
    milestone_type: "waterfront_development_consultation_launch"
  },
  {
    key: "dfc_bolder_vision_current_framework_2026",
    source_key: "dfcFrameworks",
    source_url: "https://www.communities-ni.gov.uk/articles/bolder-vision-belfast-reimagining-our-city-centre",
    date: "2026-05-19",
    date_precision: "retrieval_day_current_status",
    title: "A Bolder Vision was listed as a current Belfast city-centre framework",
    summary: "The Department for Communities article, retrieved on 19 May 2026, lists A Bolder Vision for Belfast as a city-centre blueprint developed jointly by DfC, DfI and Belfast City Council.",
    observed_change: "Official department article records current framework status for a city-centre vision; no physical works or delivery are claimed.",
    area: "Belfast city centre",
    ...CIVIC_POINT,
    source_record_id: "DfC article: A Bolder Vision for Belfast - reimagining our city centre; current page retrieved 2026-05-19",
    source_date_field: "retrieval date for current-status article",
    source_date_value: "2026-05-19",
    milestone_type: "city_centre_framework_current_status"
  }
];

function norm(value) {
  return String(value || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function slug(value) {
  return norm(value).replace(/\s+/g, "_").slice(0, 100);
}

function comparableDate(date) {
  const text = String(date || "");
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function inDateWindow(date) {
  const value = comparableDate(date);
  return value >= DATE_MIN && value <= DATE_MAX;
}

function inBelfast(lat, lon) {
  return lat >= BELFAST.minLat && lat <= BELFAST.maxLat && lon >= BELFAST.minLon && lon <= BELFAST.maxLon;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function recordsFrom(node, records = []) {
  if (!node || typeof node !== "object") return records;
  if (Array.isArray(node)) {
    for (const item of node) recordsFrom(item, records);
    return records;
  }
  if (node.event_id || node.candidate_id || node.title || node.source_record_id) records.push(node);
  for (const key of ["events", "candidates", "features"]) {
    if (node[key]) recordsFrom(node[key], records);
  }
  if (node.properties) records.push({ ...node.properties, geometry: node.geometry });
  return records;
}

function recordDate(record) {
  return record.date || record.effective_date || record.source_date_value || record.year || "";
}

function buildDedupeIndex() {
  const files = [];
  const add = (kind, file) => {
    if (fs.existsSync(file)) files.push({ kind, file });
  };
  add("corpus", path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json"));
  for (const file of walk(path.join(ROOT, "web", "data", "city-atlas", "cities", "belfast"))) {
    if (/events(_\d{4})?\.json$/i.test(path.basename(file))) add("atlas", file);
  }
  for (const file of walk(path.join(ROOT, "tmp", "subagents"))) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (rel.includes(`${ROUND_ID}/`)) continue;
    if (!/belfast/i.test(rel)) continue;
    if (/(candidate|candidates|events)\.json$/i.test(path.basename(file))) add("prior_belfast_pack", file);
  }

  const index = {
    eventIds: new Set(),
    sourceRecordDate: new Set(),
    sourceUrlDate: new Set(),
    titleDate: new Set(),
    indexedFiles: []
  };

  for (const item of files) {
    const json = readJson(item.file);
    const records = recordsFrom(json);
    if (!records.length) continue;
    index.indexedFiles.push({ kind: item.kind, path: path.relative(ROOT, item.file).replace(/\\/g, "/"), record_count: records.length });
    for (const record of records) {
      const maybeBelfast = String(record.city_id || record.city || "").toLowerCase() === "belfast" || /belfast/i.test(item.file);
      if (!maybeBelfast) continue;
      const ids = [record.event_id, record.candidate_id, record.id].filter(Boolean);
      for (const id of ids) index.eventIds.add(norm(id));
      const date = recordDate(record);
      const sourceRecord = record.source_record_id || record.provenance?.source_record_id || record.record_id || "";
      const sourceUrl = record.source_url || record.provenance?.source_url || record.url || "";
      const title = record.title || record.name || "";
      if (sourceRecord && date) index.sourceRecordDate.add(`${norm(sourceRecord)}|${date}`);
      if (sourceUrl && date) index.sourceUrlDate.add(`${norm(sourceUrl)}|${date}`);
      if (title && date) index.titleDate.add(`${norm(title)}|${date}`);
    }
  }
  return index;
}

function makeCandidate(seed) {
  const source = SOURCE_BASE[seed.source_key];
  const id = `${ROUND_ID}_${slug(seed.key)}`;
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: id,
    event_id: id,
    event_id_suggestion: `bfs_arch_${id}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: seed.date_precision === "period_end" ? { start: "2015-04-01", end: "2020-03-31" } : null,
    date_precision: seed.date_precision,
    bucket: "planning/development/architecture/planning-policy/admin-tail",
    event_family: "architecture/official-planning-policy-tail-record",
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
    publisher: source.publisher,
    source_url: seed.source_url,
    source_record_id: seed.source_record_id,
    source_type: source.source_type,
    source_family: source.source_family,
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
    geometry_source: seed.lat === CIVIC_POINT.lat && seed.lon === CIVIC_POINT.lon
      ? "Representative point at Belfast City Hall for a citywide planning-policy or city-centre administrative record."
      : `Approximate review point for ${seed.area}.`,
    geometry_precision: "representative policy/project-area point, not surveyed asset geometry",
    limitations: [
      "Administrative planning-policy, consultation, monitoring, strategy or framework record only; it is not evidence of construction, completion, occupation, delivery or built-form change.",
      "No causation, forecast, social, economic, environmental, traffic, housing-delivery or public-realm outcome is claimed.",
      "Point geometry is representative review geometry for the named citywide policy area or framework area and should not be treated as a boundary or asset footprint."
    ],
    transformation_method: "Round 201 conservative Belfast final deep-tail ETL: official/public Belfast City Council LDP/SPG/developer-contributions pages and Department for Communities Belfast regeneration framework/news pages were manually seeded, normalized into event-first candidate records, source URLs were fetched for audit status and hashes, required provenance fields were checked, Belfast/date-window checks were applied, and event_id/source-record-date/source-url-date/title-date duplicate keys were compared against the current corpus, Belfast atlas chunks, prior Belfast packs, and explicitly rounds 177, 183, 189 and 195.",
    raw_source_hint: {
      seed_key: seed.key,
      source_record_id: seed.source_record_id,
      source_date_value: seed.source_date_value
    }
  };
}

function validate(candidate) {
  const missing = [];
  for (const field of [
    "event_id", "title", "summary", "date", "date_precision", "city_id", "lat", "lon", "source_url",
    "source_record_id", "source_ids", "source_name", "publisher", "source_type", "license", "attribution",
    "retrieved_at", "confidence", "limitations", "transformation_method"
  ]) {
    if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "" || (Array.isArray(candidate[field]) && !candidate[field].length)) {
      missing.push(`missing_${field}`);
    }
  }
  if (candidate.city_id !== "belfast") missing.push("city_id_not_belfast");
  if (!inDateWindow(candidate.date)) missing.push("outside_date_window");
  if (!inBelfast(candidate.lat, candidate.lon)) missing.push("outside_belfast_envelope");
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
  const source = Object.values(SOURCE_BASE).find((item) => item.source_id === sourceId);
  const started = Date.now();
  let status = null;
  let ok = false;
  let finalUrl = sourceUrl;
  let hash = null;
  let error = null;
  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "Bims-5 round201 Belfast provenance auditor" }
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
    coverage_years: "Belfast source records dated between 2008-01-01 and 2026-05-19 where a publication, adoption, consultation, reporting-period, or retrieval-current-status date is present.",
    update_frequency: source.source_type.includes("news") || source.source_type.includes("publication") ? "Published record; may receive corrections." : "Council/department page; may be updated by publisher.",
    geographic_scope: "Belfast citywide planning-policy area, Belfast city centre, or named Belfast regeneration framework area.",
    granularity: "Policy/guidance document, consultation notice, monitoring-period record, regeneration framework, or news/admin announcement.",
    key_fields: ["title", "publication/adoption/consultation/status date", "publisher", "source URL", "record text", "license/attribution"],
    reliability_assessment: ok ? "usable with caveats" : "risky",
    required_caveats: [
      "Use as administrative planning-policy/regeneration-framework evidence only.",
      "Do not treat policy, guidance, consultation, monitoring, strategy or framework records as evidence of physical delivery.",
      "Replace representative points with reviewed boundaries if these records are ever displayed as spatial policy areas."
    ],
    ingestion_recommendation: ok ? "Candidate-level ingestion after policy/event taxonomy review and duplicate review." : "Hold until source URL can be retrieved and checked.",
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

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildDedupeIndex();
  const acceptedKeys = { eventIds: new Set(), sourceRecordDate: new Set(), sourceUrlDate: new Set(), titleDate: new Set() };
  const candidates = [];
  const rejected = [];

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
  const sourceMix = candidates.reduce((acc, candidate) => {
    acc[candidate.source_family] = (acc[candidate.source_family] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    schema_version: "round201.belfast_final_deep_tail.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
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
    counts_by_milestone_type: countBy(candidates, "milestone_type"),
    source_mix: sourceMix,
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
        "tmp/subagents/round195_belfast_deep_tail/candidates.json"
      ]
    },
    output_files: {
      candidates: "tmp/subagents/round201_belfast_final_deep_tail/candidates.json",
      source_audit: "tmp/subagents/round201_belfast_final_deep_tail/source_audit.json",
      summary: "tmp/subagents/round201_belfast_final_deep_tail/summary.json",
      notes: "tmp/subagents/round201_belfast_final_deep_tail/notes.md",
      rejected: "tmp/subagents/round201_belfast_final_deep_tail/rejected.json"
    },
    caveat: "This is a conservative administrative planning-policy/regeneration-framework tail. Records are source-backed candidates only and must not be counted as physical completions, construction starts, delivery outcomes, causation, forecasts, or impact evidence."
  };

  writeJson("candidates.json", {
    schema_version: "round201.belfast_final_deep_tail.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    candidate_count: candidates.length,
    source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids))].sort(),
    source_urls: [...new Set(candidates.map((candidate) => candidate.source_url))].sort(),
    deduped_against: index.indexedFiles.map((item) => item.path),
    scope_note: "Conservative Belfast final deep-tail candidates from official/public BCC Local Development Plan/SPG/developer-contributions pages and DfC Belfast regeneration framework/news pages not used as source families in rounds 177/183/189/195. Wording is administrative/observed only.",
    candidates
  });
  writeJson("source_audit.json", {
    schema_version: "round201.belfast_final_deep_tail.source_audit.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    audit
  });
  writeJson("summary.json", summary);
  writeJson("rejected.json", {
    schema_version: "round201.belfast_final_deep_tail.rejected.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    rejected_count: rejected.length,
    rejected
  });
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), [
    "# Round 201 Belfast Final Deep Tail Notes",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Scope",
    "",
    "This scratch-only pack targets a conservative Belfast administrative tail from official/public source families not used in rounds 177, 183, 189, and 195: BCC Local Development Plan / Supplementary Planning Guidance, BCC developer-contributions monitoring, and DfC Belfast regeneration plans/frameworks/news records.",
    "",
    "## Method",
    "",
    "- Manual source-backed seeds only; no corpus or appender edits.",
    "- Required provenance fields are emitted on every candidate.",
    "- Duplicate exclusion indexes the current manual corpus, Belfast atlas event chunks, all prior Belfast subagent packs, and explicitly rounds 177, 183, 189, and 195.",
    "- Duplicate keys checked: event id, source-record/date, source-url/date, and title/date.",
    "- Each source URL is fetched into `source_audit.json` with HTTP status and content hash.",
    "",
    "## Caveats",
    "",
    "- These are administrative planning-policy, guidance, consultation, monitoring, strategy, or framework records.",
    "- They are not construction starts, completions, openings, occupations, final designs, or delivery evidence.",
    "- Representative points should not be treated as policy boundaries, parcels, asset footprints, or public-realm extents.",
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
    `Rejected seeds: ${rejected.length}`,
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
