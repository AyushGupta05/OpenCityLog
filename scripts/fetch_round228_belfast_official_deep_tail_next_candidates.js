const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round228_belfast_official_deep_tail_next";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-19";
const ACCESSED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const TARGET_CAP = 20;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json")
};

const CIVIC_POINT = { lat: 54.59639, lon: -5.93018 };

const SOURCE_TEMPLATES = {
  bcc: {
    publisher: "Belfast City Council",
    source_type: "official council news, project, current planning or regeneration page",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; Belfast City Council website terms, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    update_frequency: "Council page, current planning list or project page; may be updated by publisher."
  },
  dfc: {
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department news, publication or regeneration page",
    license: "Crown copyright / UK Open Government Licence v3.0 where applicable to public-sector information; publication attachments, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities.",
    update_frequency: "Departmental news or publication page; may be updated by publisher."
  },
  dfi: {
    publisher: "Department for Infrastructure, Northern Ireland",
    source_type: "official department news, consultation or transport/active-travel page",
    license: "Crown copyright / UK Open Government Licence v3.0 where applicable to public-sector information; publication attachments, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Infrastructure.",
    update_frequency: "Departmental news or consultation page; may be updated by publisher."
  }
};

const SOURCES = {
  queensQuayPlanter: source(
    "bcc",
    "bcc-queens-quay-grey-to-green-round228",
    "Queen's Quay goes from grey to green",
    "https://www.belfastcity.gov.uk/News/Queen-s-Quay-goes-from-grey-to-green",
    "BCC Grey to Green / Maritime Mile public realm",
    "official council news page"
  ),
  bloombergFinalist: source(
    "bcc",
    "bcc-bloomberg-mayors-challenge-finalist-round228",
    "Belfast selected as a global finalist in Bloomberg Philanthropies 2025 Mayors Challenge",
    "https://www.belfastcity.gov.uk/news/belfast-selected-as-a-global-finalist-in-bloomberg",
    "BCC alleyway transformation programme",
    "official council news page"
  ),
  bloombergAward: source(
    "bcc",
    "bcc-bloomberg-mayors-challenge-award-round228",
    "Belfast secures $1 million from Bloomberg Philanthropies Mayors Challenge 2025-2026 to help transform alleyways",
    "https://www.belfastcity.gov.uk/news/belfast-secures-%241-million-from-bloomberg-philanth",
    "BCC alleyway transformation programme",
    "official council news page"
  ),
  natureTownsFunding: source(
    "bcc",
    "bcc-nature-towns-cities-funding-round228",
    "Belfast to receive over GBP850k of National Lottery funding to help connect people with nature",
    "https://www.belfastcity.gov.uk/News/Belfast-to-receive-over-%C2%A3850K-of-National-Lottery",
    "BCC nature recovery / green-blue infrastructure funding",
    "official council news page"
  ),
  majorProjects: source(
    "bcc",
    "bcc-city-centre-major-projects-round228",
    "Major projects in Belfast city centre",
    "https://www.belfastcity.gov.uk/city-centre/major-projects",
    "BCC city-centre major projects current status page",
    "official council project status page"
  ),
  currentPlanning: source(
    "bcc",
    "bcc-current-planning-applications-round228",
    "Current planning applications",
    "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    "BCC current planning applications list",
    "official council current planning application list"
  ),
  antrimRoadPublicRealm: source(
    "dfc",
    "dfc-antrim-road-public-realm-investment-round228",
    "Minister Hargey announces GBP482k investment for Antrim Road, Belfast",
    "https://www.communities-ni.gov.uk/news/minister-hargey-announces-ps482k-investment-antrim-road-belfast",
    "DfC Antrim Road public realm scheme",
    "official department regeneration news page"
  ),
  duncairnStudy: source(
    "dfc",
    "dfc-duncairn-gardens-development-study-round228",
    "Publication of the Duncairn Gardens Development Study for Belfast",
    "https://www.communities-ni.gov.uk/news/publication-duncairn-gardens-development-study-belfast",
    "DfC Duncairn Gardens development study",
    "official department regeneration news page"
  ),
  greenwayFunding: source(
    "dfi",
    "dfi-sydenham-greenway-funding-round228",
    "Kimmins announces over GBP1m for seven greenway projects",
    "https://www.infrastructure-ni.gov.uk/news/kimmins-announces-over-ps1m-seven-greenway-projects",
    "DfI active-travel greenway funding",
    "official department active-travel news page"
  ),
  ravenhillConsultation: source(
    "dfi",
    "dfi-ravenhill-ormeau-embankment-consultation-round228",
    "Ravenhill Road and Ormeau Embankment Pedestrian and Cycling Improvements - Statutory Consultation",
    "https://www.infrastructure-ni.gov.uk/consultations/ravenhill-road-and-ormeau-embankment-pedestrian-and-cycling-improvements-statutory-consultation",
    "DfI active-travel statutory consultation",
    "official department active-travel consultation page"
  )
};

const SEEDS = [
  candidate({
    key: "queens_quay_planter_grey_to_green_2024",
    source: "queensQuayPlanter",
    date: "2024-07-26",
    date_precision: "day",
    title: "Queen's Quay planter transformed vacant waterfront land",
    summary: "Belfast City Council reported that a new planter with integrated seating, native plants and bug hotels had transformed a vacant area on Queen's Quay between the Odyssey Arena and the Lagan Weir pedestrian bridge.",
    observed_change: "Official council news records a completed small-scale public-realm/green-infrastructure intervention on the Maritime Mile.",
    milestone_type: "public_realm_green_infrastructure_installation_reported",
    area: "Queen's Quay / Maritime Mile",
    lat: 54.60395,
    lon: -5.91385,
    source_record_id: "Queen's Quay goes from grey to green news page, Date 26 July 2024",
    source_date_field: "news publication date",
    source_date_value: "26 July 2024",
    project_type: "public realm greening and seating intervention",
    raw_source_hint: "The council page says a new planter on Queen's Quay transformed a vacant area of land and was installed by Maritime Belfast Trust with support from Belfast City Council and DfC.",
    geometry_source: "Approximate point on Queen's Quay between the SSE/Odyssey area and Lagan Weir pedestrian bridge.",
    geometry_precision: "approximate project point"
  }),
  candidate({
    key: "bloomberg_alleyways_finalist_2025",
    source: "bloombergFinalist",
    date: "2025-06-26",
    date_precision: "day",
    title: "Belfast alleyway-transformation prototype funding was announced",
    summary: "Belfast City Council announced that Belfast had been selected as a Bloomberg Philanthropies Mayors Challenge finalist and would receive prototype funding to test approaches for reimagining city alleyways as shared community assets.",
    observed_change: "Official council news records a funding/prototyping milestone for an alleyway public-space improvement programme.",
    milestone_type: "public_realm_alleyway_programme_prototype_funding",
    area: "Belfast alleyway network",
    lat: 54.59639,
    lon: -5.93018,
    source_record_id: "Bloomberg Mayors Challenge finalist news page, Date 26 June 2025",
    source_date_field: "news publication date",
    source_date_value: "26 June 2025",
    project_type: "citywide alleyway public-space transformation prototype",
    raw_source_hint: "The source reports $50,000 prototype funding and a proposal to reimagine 126 miles of alleyways.",
    geometry_source: "Representative point at Belfast City Hall for a citywide alleyway programme.",
    geometry_precision: "representative citywide programme point"
  }),
  candidate({
    key: "bloomberg_alleyways_award_2026",
    source: "bloombergAward",
    date: "2026-02-24",
    date_precision: "day",
    title: "Belfast secured Bloomberg-funded alleyway transformation programme",
    summary: "Belfast City Council announced that Belfast had secured about GBP750,000 through the Bloomberg Philanthropies Mayors Challenge 2025-2026 to support a programme for improving the city's alleyway network with residents.",
    observed_change: "Official council news records a full award/funding milestone for a citywide alleyway public-space improvement programme.",
    milestone_type: "public_realm_alleyway_programme_award",
    area: "Belfast alleyway network",
    lat: 54.59639,
    lon: -5.93018,
    source_record_id: "Bloomberg Mayors Challenge award news page, Date 24 February 2026",
    source_date_field: "news publication date",
    source_date_value: "24 February 2026",
    project_type: "citywide alleyway public-space transformation programme",
    raw_source_hint: "The source reports selection as one of 24 cities and funding to transform how council and neighbourhoods manage and improve alleyways.",
    geometry_source: "Representative point at Belfast City Hall for a citywide alleyway programme.",
    geometry_precision: "representative citywide programme point"
  }),
  candidate({
    key: "nature_towns_cities_funding_2026",
    source: "natureTownsFunding",
    date: "2026-03-11",
    date_precision: "day",
    title: "Belfast received Nature Towns and Cities funding for green-space access work",
    summary: "Belfast City Council announced GBP850,514 from The National Lottery Heritage Fund for a project to connect people with nature, including work on streets, alleyways, pocket parks, wildflowers and existing parks/open spaces.",
    observed_change: "Official council news records a funding milestone for citywide green and blue infrastructure planning and neighbourhood greening.",
    milestone_type: "green_blue_infrastructure_programme_funding",
    area: "Belfast citywide green and blue spaces",
    lat: 54.59639,
    lon: -5.93018,
    source_record_id: "Nature Towns and Cities funding news page, Date 11 March 2026",
    source_date_field: "news publication date",
    source_date_value: "11 March 2026",
    project_type: "citywide green and blue infrastructure planning / neighbourhood greening",
    raw_source_hint: "The source says the project will explore greening streets and alleyways, creating pocket parks, planting wildflowers and improving existing parks/open spaces.",
    geometry_source: "Representative point at Belfast City Hall for a citywide green/blue infrastructure programme.",
    geometry_precision: "representative citywide programme point"
  }),
  candidate({
    key: "assembly_rooms_bought_current_status_2025",
    source: "majorProjects",
    date: "2025-10",
    date_precision: "month",
    title: "Assembly Rooms purchase completion was listed on city-centre major-project page",
    summary: "Belfast City Council's city-centre major-project page states that the council bought the historic Assembly Rooms, rear extension and adjacent assets in October 2025 and was exploring future uses.",
    observed_change: "Official council project page records a current-status acquisition milestone for a listed city-centre heritage asset cluster.",
    milestone_type: "heritage_asset_acquisition_current_status",
    area: "Assembly Rooms, North Street / Waring Street",
    lat: 54.60135,
    lon: -5.92745,
    source_record_id: "Major projects page: Assembly Rooms bought in October 2025",
    source_date_field: "source-reported month on current project page",
    source_date_value: "October 2025",
    project_type: "heritage asset acquisition and future-use planning",
    raw_source_hint: "The major-project page says the council bought the Assembly Rooms, rear extension and adjacent assets in October 2025.",
    geometry_source: "Approximate point for Assembly Rooms at North Street and Waring Street.",
    geometry_precision: "approximate listed-building cluster point"
  }),
  candidate({
    key: "antrim_road_public_realm_investment_2022",
    source: "antrimRoadPublicRealm",
    date: "2022-02-07",
    date_precision: "day",
    title: "Antrim Road public-realm investment was announced",
    summary: "The Department for Communities announced GBP482,000 for an Antrim Road public-realm scheme, with works due to begin in March 2022 along the section from Oceanic Avenue to Limestone Road.",
    observed_change: "Official department news records an investment and works-programme milestone for a named streetscape/public-realm scheme.",
    milestone_type: "public_realm_investment_and_works_programme",
    area: "Antrim Road from Oceanic Avenue to Limestone Road",
    lat: 54.6156,
    lon: -5.9436,
    source_record_id: "DfC Antrim Road public realm news page, Date published 7 February 2022",
    source_date_field: "department publication date",
    source_date_value: "7 February 2022",
    project_type: "streetscape public realm improvement",
    raw_source_hint: "The source says the scheme would upgrade footways and landscaping and include shopfront improvement works.",
    geometry_source: "Approximate midpoint for the source-described Antrim Road section from Oceanic Avenue to Limestone Road.",
    geometry_precision: "approximate street-corridor point"
  }),
  candidate({
    key: "duncairn_gardens_development_study_published_2023",
    source: "duncairnStudy",
    date: "2023-03-22",
    date_precision: "day",
    title: "Duncairn Gardens Development Study was published",
    summary: "The Department for Communities published a development study for Duncairn Gardens and Tiger's Bay, setting out recommendations for physical regeneration, under-used land and buildings, vacancy, dereliction and local-environment improvement.",
    observed_change: "Official department news records publication of a neighbourhood physical-regeneration development study.",
    milestone_type: "regeneration_development_study_publication",
    area: "Duncairn Gardens / Tiger's Bay",
    lat: 54.6136,
    lon: -5.9242,
    source_record_id: "DfC Duncairn Gardens Development Study news page, Date published 22 March 2023",
    source_date_field: "department publication date",
    source_date_value: "22 March 2023",
    project_type: "neighbourhood physical-regeneration development study",
    raw_source_hint: "The source says the study includes recommendations to regenerate under-utilised land and buildings, address vacancy and dereliction, and improve the local environment.",
    geometry_source: "Approximate point for the Duncairn Gardens / Tiger's Bay study area.",
    geometry_precision: "approximate neighbourhood study point"
  }),
  candidate({
    key: "adelaide_street_public_realm_application_advertised_2026",
    source: "currentPlanning",
    date: "2026-05-01",
    date_precision: "day",
    title: "Adelaide Street temporary public-realm retention application was advertised",
    summary: "Belfast City Council's current planning list advertised LA04/2026/0528/F for retention of widened public pavement and public realm at 8 to 83 Adelaide Street, including sheltered structures, seating, planters and incidental play.",
    observed_change: "Official council current-planning list records an advertised planning application for retention of public-realm works.",
    milestone_type: "planning_application_advertised_public_realm",
    area: "8 to 83 Adelaide Street",
    lat: 54.5946,
    lon: -5.9301,
    source_record_id: "LA04/2026/0528/F, advertised on 1 May 2026, 8 to 83 Adelaide Street",
    source_date_field: "current planning list advertised date",
    source_date_value: "Advertised on 1 May 2026",
    project_type: "temporary public realm retention planning application",
    raw_source_hint: "Retention of widened public pavement and public realm including sheltered structures, seating, planters and elements of incidental play.",
    geometry_source: "Approximate point on Adelaide Street for the source-listed address range.",
    geometry_precision: "approximate street-address point"
  }),
  candidate({
    key: "two_royal_avenue_fenestration_application_advertised_2026",
    source: "currentPlanning",
    date: "2026-05-01",
    date_precision: "day",
    title: "2 Royal Avenue access and fenestration application was advertised",
    summary: "Belfast City Council's current planning list advertised LA04/2026/0659/F for fenestration changes at 2 Royal Avenue, including new windows and a new ground-floor access door.",
    observed_change: "Official council current-planning list records an advertised planning application for alterations to a city-centre civic/heritage building.",
    milestone_type: "planning_application_advertised_building_alteration",
    area: "2 Royal Avenue",
    lat: 54.6003,
    lon: -5.9288,
    source_record_id: "LA04/2026/0659/F, advertised on 1 May 2026, 2 Royal Avenue",
    source_date_field: "current planning list advertised date",
    source_date_value: "Advertised on 1 May 2026",
    project_type: "city-centre building alteration planning application",
    raw_source_hint: "Fenestration changes to include new windows at first floor level and a new access door and windows at ground floor level.",
    geometry_source: "Approximate point for 2 Royal Avenue.",
    geometry_precision: "approximate address point"
  }),
  candidate({
    key: "qub_admin_extension_application_advertised_2026",
    source: "currentPlanning",
    date: "2026-04-17",
    date_precision: "day",
    title: "Queen's University administration-building extension application was advertised",
    summary: "Belfast City Council's current planning list advertised LA04/2026/0631/F for a four-storey extension, recladding, amphitheatre seating, landscaping and ancillary works at Queen's University Belfast's Administration Building.",
    observed_change: "Official council current-planning list records an advertised planning application for a university administration-building extension and landscape works.",
    milestone_type: "planning_application_advertised_civic_education_building_extension",
    area: "Queen's University Belfast Administration Building",
    lat: 54.5842,
    lon: -5.9346,
    source_record_id: "LA04/2026/0631/F, advertised on 17 April 2026, Administration building, Queen's University Belfast",
    source_date_field: "current planning list advertised date",
    source_date_value: "Advertised on 17 April 2026",
    project_type: "university administration-building extension and landscape works",
    raw_source_hint: "Four-storey extension to northern elevation, recladding, amphitheatre seating, steps, landscaping and ancillary works.",
    geometry_source: "Approximate point for Queen's University Belfast Administration Building.",
    geometry_precision: "approximate building point"
  }),
  candidate({
    key: "dirty_onion_timber_repairs_application_advertised_2026",
    source: "currentPlanning",
    date: "2026-05-01",
    date_precision: "day",
    title: "Dirty Onion external timber-frame repair application was advertised",
    summary: "Belfast City Council's current planning list advertised LA04/2026/0732/LBC for general repairs to the external timber frame at the Dirty Onion, 3 Hill Street.",
    observed_change: "Official council current-planning list records an advertised listed-building-consent application for external timber-frame repairs.",
    milestone_type: "listed_building_consent_application_advertised_repair",
    area: "Dirty Onion, 3 Hill Street",
    lat: 54.6007,
    lon: -5.9271,
    source_record_id: "LA04/2026/0732/LBC, advertised on 1 May 2026, Dirty Onion, 3 Hill Street",
    source_date_field: "current planning list advertised date",
    source_date_value: "Advertised on 1 May 2026",
    project_type: "listed building external timber-frame repair application",
    raw_source_hint: "General repairs to external timber frame.",
    geometry_source: "Approximate point for the Dirty Onion, 3 Hill Street.",
    geometry_precision: "approximate building point"
  }),
  candidate({
    key: "lord_craigavon_tomb_statue_application_advertised_2026",
    source: "currentPlanning",
    date: "2026-04-17",
    date_precision: "day",
    title: "Lord Craigavon's Tomb statue and paving applications were advertised",
    summary: "Belfast City Council's current planning list advertised LA04/2026/0597/F and LA04/2026/0598/LBC for a granite statue and paving works at Lord Craigavon's Tomb in the Stormont Estate.",
    observed_change: "Official council current-planning list records advertised planning/listed-building applications for public-art/heritage setting works.",
    milestone_type: "planning_application_advertised_public_art_heritage_setting",
    area: "Lord Craigavon's Tomb, Stormont Estate",
    lat: 54.5976,
    lon: -5.831,
    source_record_id: "LA04/2026/0597/F and LA04/2026/0598/LBC, advertised on 17 April 2026, Lord Craigavon's Tomb at Parliament Buildings, Stormont Estate",
    source_date_field: "current planning list advertised date",
    source_date_value: "Advertised on 17 April 2026",
    project_type: "public-art / heritage-setting planning and listed-building applications",
    raw_source_hint: "Granite statue on concrete plinth and paving to create a path from the tomb to the statue.",
    geometry_source: "Approximate point for Lord Craigavon's Tomb within Stormont Estate.",
    geometry_precision: "approximate heritage-setting point"
  })
];

const MANUAL_REJECTS = [
  reject("cathedral_gardens_works_start_duplicate", "Cathedral Gardens public-realm approval, works-start and memorial-design milestones are already represented in the live corpus and prior Belfast packs.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway"),
  reject("sandy_row_arts_digital_hub_duplicate", "Sandy Row Arts and Digital Hub opening and prior letter-of-offer/progress milestones are already represented in the live corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens"),
  reject("greater_ardoyne_youth_hub_duplicate", "The Greater Ardoyne youth hub sod-cut/works-start milestone is already represented in the live corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/Work-gets-underway-at-new-purpose-built-youth-and"),
  reject("ormeau_dog_park_duplicate", "The Ormeau Park dog play-area opening is already represented in the live corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/New-dog-park-at-Ormeau-Park-supports-responsible-d"),
  reject("white_rise_ohio_playgrounds_duplicate", "White Rise and Ohio Street playground reopening and related 2025-2026 playground-programme milestones are already represented in the live corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/%C2%A31-5-million-of-further-park-improvements-planned"),
  reject("shankill_gateway_public_realm_duplicate", "Shankill Gateway public-realm construction start is already represented in the live corpus.", "duplicate_existing_event", "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme"),
  reject("sydenham_greenway_funding_overlap", "The DfI greenway funding page was reviewed, but the Belfast item is the Sydenham Greenway feeder route already represented by existing cost-consultancy and Stage 3 committed records.", "duplicate_or_overlapping_existing_event", SOURCES.greenwayFunding.source_url),
  reject("city_quays_gardens_opening_duplicate", "City Quays Gardens official opening is already represented in the corpus; the Harbour and council pages were retained only as corroborating leads.", "duplicate_existing_event", "https://www.belfast-harbour.co.uk/news/park-life-arrives-at-belfast-harbour-as-official-opening-of-city-quays-gardens-signals-start-of-summer/"),
  reject("shankill_shared_womens_centre_duplicate", "Shankill Shared Women's Centre opening is already represented in the live corpus and prior Belfast packs.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/news/%C2%A37-8-million-shared-women-s-centre-at-belfast-inte"),
  reject("black_mountain_shared_space_duplicate", "Black Mountain Shared Space opening is already represented in the live corpus and prior Belfast packs.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/%C2%A37-million-shared-community-space-opens-at-Belfast"),
  reject("albertbridge_carnforth_development_brief_duplicate", "The Albertbridge Road / Carnforth Street development brief publication is already represented in the live corpus.", "duplicate_existing_event", "https://www.communities-ni.gov.uk/publications/269-283-albertbridge-road-and-2-carnforth-street-belfast-development-brief"),
  reject("ravenhill_ormeau_embankment_consultation_date_weak", "The DfI statutory-consultation lead is relevant active-travel evidence, but the page presents a future consultation close date and no clear publication/effective date in the available page text; held for a later source row with stronger date basis.", "weak_or_ambiguous_date_basis", SOURCES.ravenhillConsultation.source_url),
  reject("current_planning_householder_rows_rejected", "Householder extensions, small patios, sheds and minor residential alterations on current-planning pages were rejected as too low-signal for this deep-tail architecture/public-realm pack.", "low_signal_minor_development", SOURCES.currentPlanning.source_url),
  reject("current_planning_duplicate_refs_rejected", "Mercy College SEN building, Bruce Street structural bracing, Berry Street shopfront, Fountain Street bar/restaurant, Dalton Street apartments, Clarence Chambers hotel conversion, Harberton North classrooms and Redcar Street padel facility current-planning rows were already present in the live corpus or prior Belfast candidate packs.", "duplicate_existing_event", SOURCES.currentPlanning.source_url)
];

function source(templateName, source_id, source_name, source_url, source_family, source_type) {
  const template = SOURCE_TEMPLATES[templateName];
  return {
    source_id,
    source_name,
    source_url,
    source_family,
    publisher: template.publisher,
    source_type: source_type || template.source_type,
    license: template.license,
    license_url: template.license_url,
    attribution: template.attribution,
    update_frequency: template.update_frequency
  };
}

function candidate(seed) {
  return seed;
}

function reject(key, reason, category, source_url) {
  return {
    key,
    city_id: "belfast",
    reason,
    category,
    source_url,
    rejected_at: ACCESSED_AT
  };
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 140);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function rowsFromJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.candidates)) return value.candidates;
  if (Array.isArray(value.events)) return value.events;
  if (value.type === "FeatureCollection" && Array.isArray(value.features)) {
    return value.features.map((feature) => ({
      ...(feature.properties || {}),
      geometry: feature.geometry || null
    }));
  }
  return [];
}

function collectPriorFiles() {
  const files = [];
  const corpusPath = path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
  if (fs.existsSync(corpusPath)) files.push({ kind: "corpus", file: corpusPath });

  const tmpRoot = path.join(ROOT, "tmp", "subagents");
  if (fs.existsSync(tmpRoot)) {
    for (const entry of fs.readdirSync(tmpRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === ROUND_ID) continue;
      if (!/belfast/i.test(entry.name)) continue;
      const candidatePath = path.join(tmpRoot, entry.name, "candidates.json");
      if (fs.existsSync(candidatePath)) {
        files.push({ kind: "prior_candidate_pack", file: candidatePath });
      }
    }
    const standalone = path.join(tmpRoot, "round113_belfast_official_candidates.json");
    if (fs.existsSync(standalone)) {
      files.push({ kind: "prior_candidate_pack", file: standalone });
    }
  }
  return files;
}

function recordDate(row) {
  return row.date || row.effective_date || row.event_date || row.decision_date || row.source_date_value || "";
}

function buildIndex(files) {
  const index = {
    ids: new Set(),
    sourceKeys: new Set(),
    titleDateKeys: new Set(),
    textBlobs: [],
    indexedFiles: []
  };

  for (const { kind, file } of files) {
    const value = readJsonIfExists(file);
    const rows = rowsFromJson(value);
    index.indexedFiles.push({
      kind,
      path: path.relative(ROOT, file).replace(/\\/g, "/"),
      record_count: rows.length
    });

    for (const row of rows) {
      const city = row.city_id || row.city || "";
      if (city && city !== "belfast") continue;
      const id = row.event_id || row.candidate_id || row.id;
      if (id) index.ids.add(String(id));
      const date = recordDate(row);
      const sourceUrl = row.source_url || (row.source && row.source.url) || "";
      const sourceRecordId = row.source_record_id || row.source_id || row.application_reference || row.application_id || id || "";
      const sourceDateField = row.source_date_field || "";
      if (sourceUrl || sourceRecordId) {
        index.sourceKeys.add(["belfast", sourceUrl, sourceRecordId, sourceDateField, date].map((part) => String(part || "").trim()).join("|"));
      }
      const title = row.title || row.name || "";
      if (title && date) {
        index.titleDateKeys.add(`${normalizeText(title)}|${date}`);
      }
      index.textBlobs.push(normalizeText([
        id,
        row.title,
        row.summary,
        row.observed_change,
        row.area,
        row.source_record_id,
        row.source_name,
        row.source_url
      ].filter(Boolean).join(" ")));
    }
  }
  return index;
}

function enrichSeed(seed) {
  const src = SOURCES[seed.source];
  if (!src) throw new Error(`Unknown source key: ${seed.source}`);
  const id = `round228_belfast_${toSlug(seed.key || seed.title)}_${String(seed.date).slice(0, 4)}`;
  const limitations = [
    "Administrative or source-reported milestone only unless the source explicitly documents physical works or an opening. Do not treat as construction start, completion, occupation, usage, final built form, outcome or causation unless stated by the source.",
    "Point geometry is for atlas review/navigation only; it is not a surveyed boundary, parcel, building footprint, route alignment, works extent or legal planning red line.",
    "Current planning application rows and current-status pages are mutable; source rows should be re-checked against the NI Planning Portal or source page before production import.",
    "License and website terms, images, maps, logos and embedded third-party material require source-level rights review before production import."
  ];
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    id,
    candidate_id: id,
    event_id: id,
    event_id_suggestion: `bfs_arch_${id}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: null,
    date_precision: seed.date_precision || "day",
    bucket: "architecture/development/public-realm/official-record",
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
    geometry: {
      type: "Point",
      coordinates: [seed.lon, seed.lat]
    },
    geometry_ref: src.source_url,
    source_id: src.source_id,
    source_ids: [src.source_id],
    source_name: src.source_name,
    source_family: src.source_family,
    publisher: src.publisher,
    source_url: src.source_url,
    source_record_id: seed.source_record_id,
    source_type: src.source_type,
    license: src.license,
    license_url: src.license_url,
    license_or_terms_note: src.license,
    attribution: src.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.source_date_value,
    source_dataset_id: src.source_id,
    confidence: "documented",
    architect: seed.architect || "Source record does not name a project architect.",
    project_type: seed.project_type,
    geometry_source: seed.geometry_source || "Representative Belfast project point from source-described location.",
    geometry_precision: seed.geometry_precision || "representative point",
    limitations,
    transformation_method: "Round 228 official Belfast deep-tail ETL: official council, DfC and DfI web pages were searched for architecture, development, public-realm, active-travel, heritage or regeneration records from 2008-01-01 through 2026-05-19; weak and duplicate leads were rejected; provenance fields were normalized; source URLs were retrieved; and event/source/title-date duplicate keys were compared with the live corpus plus prior Belfast candidate packs.",
    raw_source_hint: seed.raw_source_hint
  };
}

function validateCandidate(row) {
  const errors = [];
  const required = [
    "event_id",
    "title",
    "summary",
    "date",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method"
  ];
  for (const key of required) {
    if (row[key] === undefined || row[key] === null || row[key] === "") {
      errors.push(`missing ${key}`);
    }
  }
  if (row.city_id !== "belfast") errors.push("city_id must be belfast");
  if (!row.geometry || row.geometry.type !== "Point") errors.push("geometry Point required");
  if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) errors.push("numeric coordinates required");
  if (row.latitude < 54.45 || row.latitude > 54.75 || row.longitude < -6.15 || row.longitude > -5.65) {
    errors.push("coordinates outside Belfast review envelope");
  }
  if (row.date < DATE_MIN || row.date > DATE_MAX) errors.push("date outside requested window");
  return errors;
}

function dedupeCandidates(candidates, index, auditByUrl) {
  const accepted = [];
  const rejected = [];
  const waveIds = new Set();
  const waveSourceKeys = new Set();
  const waveTitleDateKeys = new Set();

  for (const row of candidates) {
    const errors = validateCandidate(row);
    const sourceAudit = auditByUrl.get(row.source_url);
    if (!sourceAudit || !sourceAudit.retrieval.ok) {
      errors.push("source retrieval failed");
    }
    const id = row.event_id;
    const sourceKey = ["belfast", row.source_url, row.source_record_id, row.source_date_field || "", row.date].join("|");
    const titleDateKey = `${normalizeText(row.title)}|${row.date}`;

    if (index.ids.has(id)) errors.push("event_id already present in live corpus or prior Belfast candidate pack");
    if (waveIds.has(id)) errors.push("event_id duplicated inside round228 pack");
    if (index.sourceKeys.has(sourceKey)) errors.push("source-record/date key already present in live corpus or prior Belfast candidate pack");
    if (waveSourceKeys.has(sourceKey)) errors.push("source-record/date key duplicated inside round228 pack");
    if (index.titleDateKeys.has(titleDateKey)) errors.push("title/date duplicate already present in live corpus or prior Belfast candidate pack");
    if (waveTitleDateKeys.has(titleDateKey)) errors.push("title/date duplicate inside round228 pack");

    if (errors.length) {
      rejected.push({
        key: row.candidate_id,
        city_id: "belfast",
        reason: errors.join("; "),
        category: errors.some((error) => /duplicate|already present/.test(error)) ? "duplicate_or_invalid_candidate" : "invalid_or_unretrieved_candidate",
        source_url: row.source_url,
        source_record_id: row.source_record_id,
        date: row.date,
        rejected_at: ACCESSED_AT
      });
      continue;
    }

    waveIds.add(id);
    waveSourceKeys.add(sourceKey);
    waveTitleDateKeys.add(titleDateKey);
    accepted.push(row);
  }

  accepted.sort((a, b) => a.date.localeCompare(b.date) || a.event_id.localeCompare(b.event_id));
  return { accepted: accepted.slice(0, TARGET_CAP), rejected };
}

async function retrieve(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "Bims-5 Round228 provenance audit (public official-source retrieval; contact repo maintainer)"
      }
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      retrieved_at: ACCESSED_AT,
      http_status: response.status,
      ok: response.ok,
      elapsed_ms: Date.now() - started,
      final_url: response.url,
      content_sha256: sha256(buffer),
      bytes: buffer.length,
      error: null
    };
  } catch (error) {
    return {
      retrieved_at: ACCESSED_AT,
      http_status: null,
      ok: false,
      elapsed_ms: Date.now() - started,
      final_url: url,
      content_sha256: null,
      bytes: 0,
      error: String(error && error.message ? error.message : error)
    };
  }
}

async function buildSourceAudit(sourceList) {
  const unique = [...new Map(sourceList.map((src) => [src.source_url, src])).values()];
  const audit = [];
  for (const src of unique) {
    const retrieval = await retrieve(src.source_url);
    audit.push({
      source_id: src.source_id,
      source_name: src.source_name,
      publisher: src.publisher,
      url: src.source_url,
      final_url: retrieval.final_url,
      source_type: src.source_type,
      source_family: src.source_family,
      license: src.license,
      license_url: src.license_url,
      attribution: src.attribution,
      coverage_years: `Selected official Belfast records dated between ${DATE_MIN} and ${DATE_MAX}.`,
      update_frequency: src.update_frequency,
      geographic_scope: "Belfast city, Belfast city centre, Belfast neighbourhoods, Belfast Harbour/Maritime Mile, or named project/application area.",
      granularity: "Source page, news item, current planning row, programme funding milestone, project status item, development study, or public-realm/active-travel scheme milestone.",
      key_fields: [
        "title",
        "publication, advertised, meeting or source-reported milestone date",
        "publisher",
        "source URL",
        "source record text/application reference",
        "license/attribution"
      ],
      reliability_assessment: "usable with caveats",
      required_caveats: [
        "Use as administrative/source-reported evidence only unless the source explicitly documents physical works or opening.",
        "Do not infer completion, occupation, final design, planning outcome, usage, regeneration impact, environmental outcome, funding drawdown or causation.",
        "Representative points are not surveyed boundaries, parcels, footprints, routes or works extents.",
        "Mutable current planning pages require later verification against the NI Planning Portal for production import."
      ],
      ingestion_recommendation: "Candidate-level ingestion after taxonomy, duplicate and license review.",
      retrieval
    });
  }
  return audit.sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function countBy(rows, getKey) {
  const counts = {};
  for (const row of rows) {
    const key = getKey(row) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function dateRange(rows) {
  if (!rows.length) return { min: null, max: null };
  const dates = rows.map((row) => row.date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function buildNotes(accepted, rejected, audit) {
  const acceptedRange = dateRange(accepted);
  const lines = [
    `# ${ROUND_ID}`,
    "",
    "Round228 Belfast official deep-tail/discovery candidate pack.",
    "",
    "## Scope",
    "",
    `Official public Belfast architecture, development, public-realm, active-travel, heritage and regeneration source leads dated ${DATE_MIN} through ${DATE_MAX}. The pack was screened against the live manual architecture corpus and prior Belfast candidate packs.`,
    "",
    "## Results",
    "",
    `- Target cap: ${TARGET_CAP}`,
    `- Accepted candidates: ${accepted.length}`,
    `- Rejected leads/candidates: ${rejected.length}`,
    `- Accepted date range: ${acceptedRange.min || "none"} to ${acceptedRange.max || "none"}`,
    `- Source URLs retrieved OK: ${audit.filter((row) => row.retrieval.ok).length}/${audit.length}`,
    "",
    "## Accepted Source Mix",
    "",
    ...Object.entries(countBy(accepted, (row) => row.source_family)).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Caveats",
    "",
    "- Administrative/planning/funding/procurement/status records are not evidence of construction, completion, opening, occupation, final built form, delivery outcome or causation unless the source explicitly says so.",
    "- Current planning application rows are mutable and should be re-checked against the NI Planning Portal before production import.",
    "- Geometry is approximate review geometry only.",
    "- Public-sector information is attributed, but page-specific terms, images, logos, maps and third-party material require rights review."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const indexFiles = collectPriorFiles();
  const index = buildIndex(indexFiles);
  const enriched = SEEDS.map(enrichSeed);
  const sourceList = [
    ...Object.values(SOURCES),
    ...MANUAL_REJECTS.map((item) => Object.values(SOURCES).find((src) => src.source_url === item.source_url)).filter(Boolean)
  ];
  const audit = await buildSourceAudit(sourceList);
  const auditByUrl = new Map(audit.map((row) => [row.url, row]));
  const { accepted, rejected: dynamicRejected } = dedupeCandidates(enriched, index, auditByUrl);
  const rejected = [...MANUAL_REJECTS, ...dynamicRejected].sort((a, b) => String(a.key).localeCompare(String(b.key)));

  const acceptedRange = dateRange(accepted);
  const candidatesPayload = {
    schema_version: "round228.belfast_official_deep_tail_next.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    candidate_count: accepted.length,
    source_ids: [...new Set(accepted.flatMap((row) => row.source_ids))].sort(),
    source_urls: [...new Set(accepted.map((row) => row.source_url))].sort(),
    deduped_against: index.indexedFiles.map((entry) => entry.path),
    scope_note: "Conservative Belfast official deep-tail candidates from Belfast City Council, DfC and DfI sources not already represented by the live corpus or prior Belfast packs.",
    candidates: accepted
  };

  const sourceAuditPayload = {
    schema_version: "round228.belfast_official_deep_tail_next.source_audit.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    audit,
    retrieval_summary: {
      audited_source_urls: audit.length,
      retrieved_ok: audit.filter((row) => row.retrieval.ok).length,
      retrieval_failures: audit.filter((row) => !row.retrieval.ok).map((row) => ({
        source_id: row.source_id,
        url: row.url,
        error: row.retrieval.error,
        http_status: row.retrieval.http_status
      }))
    }
  };

  const summaryPayload = {
    schema_version: "round228.belfast_official_deep_tail_next.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
    manual_reject_count: MANUAL_REJECTS.length,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    date_window: {
      start: DATE_MIN,
      end: DATE_MAX
    },
    emitted_date_range: acceptedRange,
    counts_by_year: countBy(accepted, (row) => String(row.date).slice(0, 4)),
    counts_by_source_id: countBy(accepted, (row) => row.source_id),
    counts_by_source_name: countBy(accepted, (row) => row.source_name),
    counts_by_source_family: countBy(accepted, (row) => row.source_family),
    counts_by_milestone_type: countBy(accepted, (row) => row.milestone_type),
    source_mix: countBy(accepted, (row) => row.source_family),
    source_audit: sourceAuditPayload.retrieval_summary,
    dedupe: {
      indexed_files: index.indexedFiles,
      live_and_prior_id_count: index.ids.size,
      live_and_prior_source_key_count: index.sourceKeys.size,
      dynamic_duplicate_or_invalid_rejects: dynamicRejected.length
    },
    caveat: "These are official-source administrative/source-reported records. Planning adverts, funding awards, programme pages and current-status records do not prove physical delivery, completion, opening, occupation, final built form, outcomes or causation."
  };

  const rejectedPayload = {
    schema_version: "round228.belfast_official_deep_tail_next.rejected.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    rejected_count: rejected.length,
    rejected
  };

  writeJson(OUTPUTS.candidates, candidatesPayload);
  writeJson(OUTPUTS.sourceAudit, sourceAuditPayload);
  writeJson(OUTPUTS.summary, summaryPayload);
  fs.writeFileSync(OUTPUTS.notes, buildNotes(accepted, rejected, audit));
  writeJson(OUTPUTS.rejected, rejectedPayload);

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    emitted_date_range: acceptedRange,
    source_urls_retrieved_ok: `${sourceAuditPayload.retrieval_summary.retrieved_ok}/${sourceAuditPayload.retrieval_summary.audited_source_urls}`,
    output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
