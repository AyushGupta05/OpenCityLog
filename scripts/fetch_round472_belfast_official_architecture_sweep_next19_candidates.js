#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round472_belfast_official_architecture_sweep_next19";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round472_belfast_official_architecture_sweep_next19_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_ACTIVITY_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const DFI_2024_25_PUBLICATION_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025";
const DFI_2024_25_CSV_URL =
  "https://www.infrastructure-ni.gov.uk/system/files/2025-06/planning-statistics-2024-25-dataset.csv";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const ULSTER_TERMS_URL = "https://www.ulster.ac.uk/about/terms";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";
const NIW_TERMS_URL = "https://www.niwater.com/site-information";
const TRANSLINK_TERMS_URL = "https://www.translink.co.uk/termsandconditions";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round472 official/public Belfast architecture sweep after Round464 next18.",
  "Accepted selected DfI planning-statistics 2024-25 Belfast rows only when the source row supplied official Easting/Northing, an approved decision/consent date, and architecture-related proposal text.",
  "Each accepted record is an administrative planning-decision milestone only, not evidence that works started, works completed, premises opened, occupancy changed, or any social, economic, transport, health, education, heritage or environmental outcome followed.",
  "Official Belfast/NI institutional web sources were checked for additional leads and rejected where already represented, outside Belfast, status-only, future/undated, or lacking source-backed point geometry for this point-first sweep.",
  "No prediction, simulation, causality, performance, capacity or impact claim is carried."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round472OfficialArchitectureSweepNext19`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round472",
    source_name: "Northern Ireland planning statistics 2024/25 annual dataset",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_dataset_url: DFI_2024_25_CSV_URL,
    source_type: "official annual planning-statistics CSV release",
    license:
      "Open Government Licence v3.0 where applicable to Department for Infrastructure public-sector information; verify release-specific terms before redistribution.",
    license_url: OGL_URL,
    attribution:
      "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0 where applicable.",
    publisher_terms_url: DFI_TERMS_URL,
    coverage_years: "2024-2025",
    geographic_scope: "Belfast planning authority rows in Northern Ireland planning statistics",
    granularity:
      "application-level administrative planning decision with source Easting/Northing",
    reliability:
      "strong for administrative decision evidence; not physical-completion evidence"
  }
};

const PLANNING_LEADS = [
  {
    app_id: "LA04/2023/4589/LBC",
    event_id: "bfs_arch_round472_clarence_house_repairs_lbc_2024",
    title: "Clarence House refurbishment and repair listed-building consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for internal demolition, refurbishment, repair, redecoration and external elevation repair works at Clarence House, 4-10 May Street.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_admin",
    limitation_topic:
      "listed-building consent, refurbishment and repair works"
  },
  {
    app_id: "LA04/2022/0860/F",
    event_id: "bfs_arch_round472_castleton_clubhouse_leisure_change_2024",
    title: "Castleton clubhouse leisure-use permission was approved",
    observed_change:
      "Official planning-statistics row records approval for retrospective change of use from former clubhouse to a leisure and private-hire venue at Castleton Bowling and Social Club.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_civic_commercial_admin",
    limitation_topic: "retrospective change of use"
  },
  {
    app_id: "LA04/2024/0054/F",
    event_id: "bfs_arch_round472_former_print_hall_conference_use_approval_2024",
    title: "Former Print Hall conference and event-space use was approved",
    observed_change:
      "Official planning-statistics row records approval for a conference-centre facility with associated event and entertainment-space use at the former Print Hall, 124-144 Royal Avenue.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_cultural_commercial_admin",
    limitation_topic: "conference/event-space change of use"
  },
  {
    app_id: "LA04/2023/3906/F",
    event_id: "bfs_arch_round472_winecellar_entry_short_lets_approval_2024",
    title: "Winecellar Entry office-to-short-let conversion was approved",
    observed_change:
      "Official planning-statistics row records approval to convert vacant office space at 1-9 Winecellar Entry into short-term-let bedrooms.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_residential_admin",
    limitation_topic: "office-to-short-term-let conversion"
  },
  {
    app_id: "LA04/2024/0059/F",
    related_app_ids: ["LA04/2024/0060/LBC"],
    event_id: "bfs_arch_round472_wellington_place_shopfront_fitout_approval_2024",
    title: "6 Wellington Place shopfront and fit-out approval was recorded",
    observed_change:
      "Official planning-statistics rows record full permission and listed-building consent for a change of use, new shopfront and internal fit-out works at 6 Wellington Place.",
    event_type: "planning_decision_shopfront_fitout",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "retail/professional-services fit-out and shopfront works"
  },
  {
    app_id: "LA04/2023/4340/F",
    event_id: "bfs_arch_round472_crumlin_road_community_hub_approval_2024",
    title: "Crumlin Road community hub building was approved",
    observed_change:
      "Official planning-statistics row records approval for a 1.5-storey community hub building at 948-952 Crumlin Road.",
    event_type: "planning_decision_civic_building",
    category: "architecture_civic_admin",
    limitation_topic: "community hub building"
  },
  {
    app_id: "LA04/2024/0523/LBC",
    event_id: "bfs_arch_round472_rugby_road_listed_internal_works_approval_2024",
    title: "45 Rugby Road listed-building internal and fenestration works were approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for stair removal, kitchen reconfiguration, WC/stair additions, and window/door fenestration amendments at 45 Rugby Road.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_admin",
    limitation_topic: "listed-building internal and fenestration works"
  },
  {
    app_id: "LA04/2023/2603/F",
    related_app_ids: ["LA04/2023/2592/DCA"],
    event_id: "bfs_arch_round472_malone_road_office_to_short_stay_approval_2024",
    title: "15 Malone Road office-to-short-stay apartment conversion was approved",
    observed_change:
      "Official planning-statistics rows record full permission and demolition consent for a change from offices to short-term private-rental apartments with alterations to the rear return at 15 Malone Road.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_residential_admin",
    limitation_topic: "office-to-short-stay conversion and associated demolition consent"
  },
  {
    app_id: "LA04/2023/2798/F",
    related_app_ids: ["LA04/2023/2791/DCA"],
    event_id: "bfs_arch_round472_thompsons_garage_redevelopment_approval_2024",
    title: "Thompsons Garage extension and Upper Arthur Street redevelopment were approved",
    observed_change:
      "Official planning-statistics rows record full permission and demolition consent for extension/redevelopment works involving Thompsons Garage and 51-53 Upper Arthur Street.",
    event_type: "planning_decision_civic_commercial_extension",
    category: "architecture_cultural_commercial_admin",
    limitation_topic: "nightclub/restaurant extension and partial demolition works"
  },
  {
    app_id: "LA04/2024/0032/F",
    event_id: "bfs_arch_round472_university_street_guesthouse_extension_approval_2024",
    title: "139 University Street office-to-guesthouse conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from offices to guesthouse, including a three-storey rear extension and internal alterations at 139 University Street.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_hospitality_admin",
    limitation_topic: "office-to-guesthouse conversion and rear extension"
  },
  {
    app_id: "LA04/2023/3676/F",
    event_id: "bfs_arch_round472_royal_avenue_cafe_serviced_apartments_approval_2024",
    title: "58-66 Royal Avenue cafe and serviced-apartment conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for refurbishment/change of use from retail to cafe at ground floor and conversion to short-term-let serviced apartments at 58-66 Royal Avenue.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_residential_admin",
    limitation_topic: "retail-to-cafe and serviced-apartment conversion"
  },
  {
    app_id: "LA04/2023/4388/DCA",
    event_id: "bfs_arch_round472_queen_street_shopfront_demolition_consent_2024",
    title: "23-29 Queen Street shopfront and internal demolition consent was approved",
    observed_change:
      "Official planning-statistics row records demolition consent for shopfront alteration, removal of exterior walkways/ladders, interior walls/partitions and window works at 23-29 Queen Street.",
    event_type: "planning_decision_demolition_consent",
    category: "architecture_commercial_admin",
    limitation_topic: "shopfront alteration and internal demolition consent"
  },
  {
    app_id: "LA04/2024/0574/F",
    event_id: "bfs_arch_round472_montgomery_road_temporary_school_soft_play_approval_2024",
    title: "Temporary nursery, primary school and soft-play use near Montgomery Road was approved",
    observed_change:
      "Official planning-statistics row records approval for a temporary nursery and primary school, soft-play area, access, parking, landscaping and ancillary site works east of 44 Montgomery Road.",
    event_type: "planning_decision_temporary_school_facility",
    category: "architecture_education_admin",
    limitation_topic: "temporary education and soft-play facility"
  },
  {
    app_id: "LA04/2023/4352/F",
    event_id: "bfs_arch_round472_berry_street_office_parish_hall_reconfig_approval_2024",
    title: "Berry Street office accommodation and parish-hall reconfiguration were approved",
    observed_change:
      "Official planning-statistics row records approval to change existing retail units to office accommodation and reconfigure an existing parish hall to include a conference room at 60, 62 and 64 Berry Street.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_civic_commercial_admin",
    limitation_topic: "retail-to-office change and parish-hall reconfiguration"
  },
  {
    app_id: "LA04/2024/0203/LBC",
    event_id: "bfs_arch_round472_belfast_telegraph_seaver_building_lbc_2024",
    title: "Former Belfast Telegraph Seaver building restoration consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for demolition of attached structures and retention/restoration works to the Seaver building within the former Belfast Telegraph complex.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_admin",
    limitation_topic: "listed-building restoration and attached-structure demolition consent"
  },
  {
    app_id: "LA04/2024/1143/F",
    related_app_ids: ["LA04/2024/1145/LBC", "LA04/2024/1144/A"],
    event_id: "bfs_arch_round472_donegall_place_listed_buildings_alterations_2024",
    title: "25-27 Donegall Place listed-building alterations were approved",
    observed_change:
      "Official planning-statistics rows record full permission, listed-building consent and advertisement consent for alterations to two listed buildings at 25-27 Donegall Place, including internal reordering, facade amendments and shopfront signage.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building alterations and signage"
  },
  {
    app_id: "LA04/2024/0470/F",
    event_id: "bfs_arch_round472_lower_botanic_gardens_community_garden_approval_2024",
    title: "Lower Botanic Gardens community garden was approved",
    observed_change:
      "Official planning-statistics row records approval to develop a community garden for sustainable food growth and education purposes at Lower Botanic Gardens.",
    event_type: "planning_decision_public_realm_civic",
    category: "architecture_public_realm_admin",
    limitation_topic: "community garden"
  },
  {
    app_id: "LA04/2023/2993/LBC",
    event_id: "bfs_arch_round472_clifton_house_gate_lodge_refurbishment_lbc_2024",
    title: "Clifton House Gate Lodge refurbishment consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for renovation and refurbishment works at Clifton House Gate Lodge, 2 North Queen Street.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_admin",
    limitation_topic: "listed-building renovation and refurbishment"
  },
  {
    app_id: "LA04/2023/4614/LBC",
    event_id: "bfs_arch_round472_campbell_college_repairs_lbc_2024",
    title: "Campbell College roof, stonework, mortar and window repair consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for repairs and alterations to roof, stonework, mortar joints and windows at Campbell College.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_education_admin",
    limitation_topic: "listed-building fabric repairs"
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round472_reject_studio_ulster_duplicate_2025",
    title: "Studio Ulster official opening",
    rejection_category: "duplicate_prior_corpus",
    reason:
      "Official opening evidence for Studio Ulster is already represented in the Belfast corpus and Round464 rejection review; not re-emitted.",
    source_url:
      "https://www.ulster.ac.uk/news/2025/june/ulster-university-leads-next-generation-of-virtual-film-production-with-studio-ulster-launch",
    source_name:
      "Ulster University leads next generation of virtual film production with Studio Ulster launch",
    publisher: "Ulster University",
    source_type: "official university news page",
    source_record_id: "ulster-news-2025-06-19-studio-ulster-launch",
    license:
      "Ulster University website copyright/terms; factual citation metadata and source URL retained.",
    license_url: ULSTER_TERMS_URL,
    attribution: "Ulster University",
    duplicate_terms: ["Studio Ulster", "official opening", "Belfast Harbour Studios"]
  },
  {
    id: "bfs_arch_round472_reject_grand_central_duplicate_2024",
    title: "Belfast Grand Central Station opening",
    rejection_category: "duplicate_prior_corpus",
    reason:
      "Grand Central Station opening/enabling milestones are already represented in the live Belfast corpus and Round464 review.",
    source_url:
      "https://www.translink.co.uk/about-translink/media/pressreleases/grandcentralopens",
    source_name: "Grand Central Station opens for bus services",
    publisher: "Translink",
    source_type: "official transport operator news page",
    source_record_id: "translink-news-2024-grand-central-opens",
    license:
      "Translink website terms/copyright; factual citation metadata and source URL retained.",
    license_url: TRANSLINK_TERMS_URL,
    attribution: "Translink",
    duplicate_terms: ["Belfast Grand Central Station", "Grand Central", "Translink"]
  },
  {
    id: "bfs_arch_round472_reject_lockhouse_prior_pack_2024",
    title: "Former Lockhouse redevelopment work begins",
    rejection_category: "duplicate_prior_tmp_pack",
    reason:
      "Belfast City Council Lockhouse work-begins evidence already appears in prior Belfast candidate packs; no new source-supported point was added here.",
    source_url:
      "https://www.belfastcity.gov.uk/News/Work-begins-on-%C2%A32-9m-shared-space-project-in-south",
    source_name: "Work begins on GBP2.9m shared space project in south Belfast",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    source_record_id: "bcc-news-2024-05-01-lockhouse-work-begins",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Lockhouse", "shared space project", "LORAG"]
  },
  {
    id: "bfs_arch_round472_reject_city_cemetery_duplicate_2025",
    title: "City Cemetery Heritage Project completion",
    rejection_category: "duplicate_prior_corpus",
    reason:
      "City Cemetery heritage works are already represented in the manual Belfast architecture corpus and prior heritage/restoration candidate notes.",
    source_url:
      "https://www.belfastcity.gov.uk/business-and-investment/physical-investment/projects-delivered-in-partnership/the-national-lottery-heritage-fund",
    source_name: "The National Lottery Heritage Fund",
    publisher: "Belfast City Council",
    source_type: "official council project page",
    source_record_id: "bcc-nlhf-projects-city-cemetery-completed-2025",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["City Cemetery Heritage Project", "City Cemetery"]
  },
  {
    id: "bfs_arch_round472_reject_assembly_rooms_purchase_no_physical_milestone_2025",
    title: "Assembly Rooms purchase announcement",
    rejection_category: "not_observed_architecture_change",
    reason:
      "Council purchase is a property/acquisition milestone and future-use lead; the source does not document a completed physical architecture change or source-backed point for this point-first pack.",
    source_url:
      "https://www.belfastcity.gov.uk/News/Council-agrees-to-purchase-Assembly-Rooms-as-city",
    source_name: "Council agrees to purchase Assembly Rooms as city centre regeneration continues",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    source_record_id: "bcc-news-2025-09-01-assembly-rooms-purchase",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Assembly Rooms", "North Street", "Braddell"]
  },
  {
    id: "bfs_arch_round472_reject_ulster_hospital_out_of_scope_2025",
    title: "Ulster Hospital Urgent Care Centre opening",
    rejection_category: "out_of_scope_location",
    reason:
      "The official Department of Health record concerns the Ulster Hospital in Dundonald, outside the Belfast city boundary for this corpus round.",
    source_url:
      "https://www.health-ni.gov.uk/news/health-minister-opens-new-urgent-care-centre-ulster-hospital",
    source_name: "Health Minister opens new Urgent Care Centre at Ulster Hospital",
    publisher: "Department of Health, Northern Ireland",
    source_type: "official department news page",
    source_record_id: "doh-news-2025-06-19-ulster-hospital-ucc-opening",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department of Health, Northern Ireland",
    duplicate_terms: ["Ulster Hospital", "Urgent Care Centre", "Dundonald"]
  },
  {
    id: "bfs_arch_round472_reject_shore_road_sewer_relining_geometry_ref_only_2025",
    title: "Shore Road sewer relining next phase",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "NI Water source identifies a route/area and works phase, but no reusable official point or works boundary was exposed for this point-first architecture sweep.",
    source_url:
      "https://www.niwater.com/about-us/news/2025/next-phase-of-shore-road-sewer-relining-works-gets-underway",
    source_name: "Next phase of Shore Road sewer relining works gets underway",
    publisher: "Northern Ireland Water",
    source_type: "official NI Water news page",
    source_record_id: "niwater-news-2025-01-03-shore-road-sewer-relining",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["Shore Road", "sewer relining", "St Vincent Street"]
  },
  {
    id: "bfs_arch_round472_reject_harni_hed_status_only_no_new_rows",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_exhausted_or_status_only",
    reason:
      "HARNI/HED spatial layers provide official heritage status/location rows, but prior Belfast heritage sweeps already cover status gaps and status/list dates are not physical works dates.",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS feature service reviewed in Round472",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round472_reject_qub_weavers_hall_future_or_duplicate_2026",
    title: "Queen's Weavers' Hall accommodation page",
    rejection_category: "future_or_duplicate_not_accepted",
    reason:
      "The official QUB page describes a 2026 opening expectation and the associated Dublin Road planning applications are already represented in the manual/prior corpus; no distinct completed observed change was accepted.",
    source_url: "https://www.qub.ac.uk/accommodation/student-accommodation/new-development/",
    source_name: "Weavers' Hall",
    publisher: "Queen's University Belfast",
    source_type: "official university accommodation page",
    source_record_id: "qub-accommodation-weavers-hall-page-reviewed-round472",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["Weavers' Hall", "Dublin Road", "459 beds"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  "site:belfastcity.gov.uk Belfast architecture building opened 2025 Belfast City Council official",
  "site:belfastcity.gov.uk/news Belfast opened 2025 new hub",
  "site:belfastcity.gov.uk/news Belfast work begins 2025 building",
  "site:belfastcity.gov.uk National Lottery Heritage Fund City Cemetery Strand Arts Centre",
  "site:communities-ni.gov.uk Belfast officially opened building 2025 Department for Communities",
  "site:health-ni.gov.uk Belfast opened new 2025 hospital building",
  "site:belfasttrust.hscni.net Belfast opened 2025 new facility",
  "site:qub.ac.uk Belfast new building opened 2025 Queen's University",
  "site:ulster.ac.uk Belfast campus opened building 2025 Studio Ulster official",
  "site:belfast-harbour.co.uk Belfast opened 2025 new building",
  "site:niwater.com Belfast completed 2025 project NI Water",
  "site:translink.co.uk Belfast opened 2025 building Translink",
  "DfI planning-statistics 2024-25 local CSV scan for Belfast APP_ID rows with source Easting/Northing absent from manual/prior accepted packs",
  "local duplicate scan: data/manual_drops/architecture_milestones plus prior tmp Belfast candidates through round464"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text || "").digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values, index) => {
    const record = {};
    headers.forEach((header, columnIndex) => {
      const key = header === "Status@31Mar" ? "StatusAt31Mar" : header;
      record[key] = values[columnIndex] === undefined ? "" : values[columnIndex].trim();
    });
    record.row_number = index + 2;
    record.source_file_name = PLANNING_DATASET;
    return record;
  });
}

function readPlanningRows() {
  const text = readTextIfExists(PLANNING_CSV_PATH);
  if (!text) {
    throw new Error(`Missing planning CSV: ${PLANNING_CSV_PATH}`);
  }
  return parseCsv(text);
}

function normaliseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCoord(value) {
  return Number(value.toFixed(6));
}

function niGridToApproxPoint(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  return {
    latitude: roundCoord(54.6 + (northing - 374000) / 111000),
    longitude: roundCoord(-5.93 + (easting - 333000) / 65000)
  };
}

function parseDate(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };
  const day = match[1].padStart(2, "0");
  const month = months[match[2]];
  if (!month) return null;
  return `${match[3]}-${month}-${day}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRoundNumber(filePath) {
  const match = filePath.match(/round(\d+)/i);
  return match ? Number(match[1]) : null;
}

function listFilesRecursive(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
    } else {
      files.push(current);
    }
  }
  return files;
}

function collectDuplicateHaystack() {
  const files = [];
  const manualFile = path.join(
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  );
  if (fs.existsSync(manualFile)) files.push(manualFile);

  const tmpRoot = path.join("tmp", "subagents");
  for (const file of listFilesRecursive(tmpRoot)) {
    const normalized = file.replace(/\\/g, "/");
    if (normalized.includes(`${ROUND_ID}/`)) continue;
    if (!/belfast/i.test(normalized)) continue;
    if (!/(candidates\.json|belfast_arch_candidates_round\d+.*\.json)$/i.test(normalized)) {
      continue;
    }
    const roundNumber = extractRoundNumber(normalized);
    if (roundNumber !== null && roundNumber > 464) continue;
    files.push(file);
  }

  const appIds = new Set();
  const urls = new Set();
  const chunks = [];
  let sampledChars = 0;
  const maxSampledChars = 10_000_000;
  const maxSamplePerFile = 220_000;
  for (const file of files) {
    const text = readTextIfExists(file);
    if (!text) continue;
    for (const match of text.matchAll(/LA04\/\d{4}\/\d{4}\/[A-Z]+/g)) {
      appIds.add(match[0]);
    }
    for (const match of text.matchAll(/https?:\/\/[^\s"')]+/g)) {
      urls.add(match[0].replace(/[),.;]+$/, "").toLowerCase());
    }
    if (sampledChars < maxSampledChars) {
      const sample =
        text.length <= maxSamplePerFile
          ? text
          : `${text.slice(0, maxSamplePerFile / 2)}\n${text.slice(
              -maxSamplePerFile / 2
            )}`;
      chunks.push(sample);
      sampledChars += sample.length;
    }
  }
  return {
    files_checked: files.length,
    roots: [
      "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
      "tmp/subagents Belfast candidate packs through round464"
    ],
    files,
    appIds,
    urls,
    text: chunks.join("\n"),
    sampled_chars: sampledChars
  };
}

function duplicateHitsForTerms(haystack, terms, ownId) {
  const hits = [];
  const hay = normalizeText(haystack.text);
  for (const term of terms) {
    const normalized = normalizeText(term);
    if (!normalized || normalized === normalizeText(ownId)) continue;
    if (hay.includes(normalized)) hits.push(term);
  }
  return [...new Set(hits)];
}

function sourceRecordIdFor(row, relatedRows = []) {
  const bits = [
    `APP_ID:${row.ID}`,
    ...relatedRows.map((related) => `RELATED_APP_ID:${related.ID}`),
    `FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`,
    `ROW:${row.row_number}`
  ];
  for (const related of relatedRows) {
    bits.push(`RELATED_ROW:${related.row_number}`);
  }
  return bits.join("; ");
}

function limitationsFor(lead) {
  return [
    `This records an approved planning/listed-building/other-consent administrative milestone for ${lead.limitation_topic}; it does not confirm works started, works completed, opening, occupation, operational use, final built form, funding, public access, heritage condition, service delivery or any outcome.`,
    "The point is transformed from official planning-statistics Easting/Northing and should be treated as an approximate site navigation point, not a surveyed footprint, legal red-line boundary, curtilage, room, facade, wall, garden, streetworks area, or works extent.",
    "The source row supports the application decision date and administrative decision status only; separate completion/opening evidence would be required for a physical-change corpus record."
  ];
}

function candidateFromPlanningLead(lead, rowsById, duplicateHaystack) {
  const source = SOURCES.dfiPlanningStats;
  const row = rowsById.get(lead.app_id);
  if (!row) throw new Error(`Planning lead missing source row: ${lead.app_id}`);
  const relatedRows = (lead.related_app_ids || [])
    .map((appId) => rowsById.get(appId))
    .filter(Boolean);
  if ((lead.related_app_ids || []).length !== relatedRows.length) {
    throw new Error(`Planning lead missing related source row: ${lead.event_id}`);
  }
  const decisionDate = parseDate(row.DecisionIssuedDate || row.DateValid);
  const easting = normaliseNumber(row.Easting);
  const northing = normaliseNumber(row.Northing);
  const point = niGridToApproxPoint(easting, northing);
  if (!decisionDate) throw new Error(`Planning lead missing decision date: ${lead.app_id}`);
  if (!point) throw new Error(`Planning lead missing source point: ${lead.app_id}`);
  if (duplicateHaystack.appIds.has(row.ID)) {
    throw new Error(`Planning lead duplicates prior accepted APP_ID: ${row.ID}`);
  }
  for (const related of relatedRows) {
    if (duplicateHaystack.appIds.has(related.ID)) {
      throw new Error(`Planning lead duplicates prior accepted related APP_ID: ${related.ID}`);
    }
  }

  const duplicateTerms = [
    lead.event_id,
    row.ID,
    ...relatedRows.map((related) => related.ID),
    row.SiteAddress,
    row.Proposal,
    lead.title
  ];
  const duplicateScanHits = duplicateHitsForTerms(
    duplicateHaystack,
    duplicateTerms.filter((term) => !String(term).startsWith("LA04/")),
    lead.event_id
  );

  return {
    id: lead.event_id,
    event_id: lead.event_id,
    city_id: CITY_ID,
    title: lead.title,
    summary: `${source.publisher}'s ${source.coverage_years} planning-statistics dataset records ${row.Decision_Withdrawal || row.StatusAt31Mar} for ${row.ID} at ${row.SiteAddress}. Proposal text: ${row.Proposal}`,
    observed_change: lead.observed_change,
    event_type: lead.event_type,
    category: lead.category,
    date: decisionDate,
    effective_date: decisionDate,
    effective_date_range: null,
    date_precision: "day",
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_dataset_url: source.source_dataset_url,
    source_type: source.source_type,
    source_record_id: sourceRecordIdFor(row, relatedRows),
    source_date_field: "DecisionIssuedDate",
    source_date_value: row.DecisionIssuedDate,
    license: source.license,
    license_url: source.license_url,
    terms: source.publisher_terms_url,
    publisher_terms_url: source.publisher_terms_url,
    attribution: source.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    easting,
    northing,
    source_easting: easting,
    source_northing: northing,
    coordinate_reference_system: "Northern Ireland planning-statistics Easting/Northing",
    coordinate_conversion:
      "Approximate established Belfast review transform: longitude = -5.93 + (easting - 333000) / 65000; latitude = 54.6 + (northing - 374000) / 111000.",
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: null,
    geometry_source:
      "Source-backed planning-statistics Easting/Northing converted to WGS84 review coordinates.",
    geometry_precision:
      "Approximate application/site navigation point from official planning-statistics row; not a surveyed footprint, legal boundary, facade, room or works extent.",
    point_corpus_ready: true,
    source_fields: {
      ID: row.ID,
      related_app_ids: relatedRows.map((related) => related.ID),
      DateReceived: row.DateReceived,
      DateValid: row.DateValid,
      Authority: row.Authority,
      LPA19CD: row.LPA19CD,
      LPA19NM: row.LPA19NM,
      AppType: row.AppType,
      Classification: row.Classification,
      StatsCategory: row.StatsCategory,
      Proposal: row.Proposal,
      SiteAddress: row.SiteAddress,
      Easting: row.Easting,
      Northing: row.Northing,
      StatusAt31Mar: row.StatusAt31Mar,
      Decision_Withdrawal: row.Decision_Withdrawal,
      DecisionIssuedDate: row.DecisionIssuedDate,
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      related_source_rows: relatedRows.map((related) => ({
        ID: related.ID,
        AppType: related.AppType,
        StatsCategory: related.StatsCategory,
        Proposal: related.Proposal,
        SiteAddress: related.SiteAddress,
        Easting: related.Easting,
        Northing: related.Northing,
        Decision_Withdrawal: related.Decision_Withdrawal,
        DecisionIssuedDate: related.DecisionIssuedDate,
        source_row_number: related.row_number
      }))
    },
    evidence_basis: [
      "Official DfI planning-statistics row supplies application ID, decision status, decision date, site address, proposal text and Easting/Northing.",
      "The candidate is modelled as an observed administrative planning-decision milestone only.",
      "APP_ID and related APP_IDs were absent from the manual architecture corpus and prior accepted Belfast candidate packs through Round464 during this sweep."
    ],
    limitations: limitationsFor(lead),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      { rel: "primary_source_page", href: DFI_PLANNING_ACTIVITY_URL },
      { rel: "annual_publication", href: DFI_2024_25_PUBLICATION_URL },
      { rel: "source_dataset", href: DFI_2024_25_CSV_URL },
      { rel: "license", href: OGL_URL }
    ],
    duplicate_check_terms: duplicateTerms,
    duplicate_review:
      "APP_ID and related APP_IDs were absent from the manual architecture corpus and prior accepted Belfast candidate outputs through Round464 checked by the Round472 duplicate scan.",
    duplicate_scan_hits: duplicateScanHits
  };
}

function rejectedRecord(lead, duplicateHaystack) {
  return {
    id: lead.id,
    city_id: CITY_ID,
    title: lead.title,
    rejection_category: lead.rejection_category,
    reason: lead.reason,
    source_id: lead.id.replace(/^bfs_arch_round472_reject_/, "round472-reject-"),
    source_record_id: lead.source_record_id,
    source_url: lead.source_url,
    source_name: lead.source_name,
    publisher: lead.publisher,
    source_type: lead.source_type,
    license: lead.license,
    license_url: lead.license_url,
    attribution: lead.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    duplicate_check_terms: lead.duplicate_terms || [lead.title],
    duplicate_scan_hits: duplicateHitsForTerms(
      duplicateHaystack,
      lead.duplicate_terms || [lead.title],
      lead.id
    ),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD
  };
}

function validate(candidates, rejected) {
  const errors = [];
  const warnings = [];
  const required = [
    "id",
    "event_id",
    "city_id",
    "title",
    "summary",
    "source_record_id",
    "source_url",
    "source_name",
    "publisher",
    "source_type",
    "license",
    "attribution",
    "accessed_at",
    "retrieved_at",
    "confidence",
    "limitations",
    "method",
    "transformation_method"
  ];
  const seenIds = new Set();
  const pointBacked = [];
  const geometryRefOnly = [];
  const badClaim =
    /\b(predicts?|forecast|simulation|simulate|caused|causes|will increase|will decrease|proves|impact score|10-year)\b/i;

  for (const candidate of candidates) {
    if (seenIds.has(candidate.event_id)) {
      errors.push(`Duplicate event_id in candidates: ${candidate.event_id}`);
    }
    seenIds.add(candidate.event_id);
    for (const field of required) {
      if (
        candidate[field] === undefined ||
        candidate[field] === null ||
        candidate[field] === "" ||
        (Array.isArray(candidate[field]) && candidate[field].length === 0)
      ) {
        errors.push(`${candidate.event_id} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.event_id} has wrong city_id`);
    }
    if (
      candidate.effective_date < DATE_WINDOW.start ||
      candidate.effective_date > DATE_WINDOW.end
    ) {
      errors.push(`${candidate.event_id} effective_date outside task window`);
    }
    if (!candidate.geometry && !candidate.geometry_ref) {
      errors.push(`${candidate.event_id} missing geometry or geometry_ref`);
    }
    if (candidate.geometry) {
      const coords = candidate.geometry.coordinates || [];
      if (
        candidate.geometry.type !== "Point" ||
        coords.length !== 2 ||
        !Number.isFinite(coords[0]) ||
        !Number.isFinite(coords[1])
      ) {
        errors.push(`${candidate.event_id} has invalid point geometry`);
      } else {
        pointBacked.push(candidate.event_id);
      }
      if (
        !Number.isFinite(candidate.latitude) ||
        !Number.isFinite(candidate.longitude)
      ) {
        errors.push(`${candidate.event_id} has point geometry without latitude/longitude`);
      }
      if (candidate.point_corpus_ready !== true) {
        errors.push(`${candidate.event_id} point-backed record must set point_corpus_ready true`);
      }
    } else {
      geometryRefOnly.push(candidate.event_id);
      if (candidate.point_corpus_ready !== false) {
        errors.push(
          `${candidate.event_id} geometry_ref-only record must set point_corpus_ready false`
        );
      }
      warnings.push(`${candidate.event_id} is geometry_ref-only and not point-corpus-ready`);
    }
    const claimText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      ...(candidate.evidence_basis || []),
      ...(candidate.limitations || [])
    ].join(" ");
    if (badClaim.test(claimText)) {
      errors.push(`${candidate.event_id} contains overclaim language`);
    }
  }

  for (const item of rejected) {
    for (const field of [
      "id",
      "city_id",
      "title",
      "rejection_category",
      "reason",
      "source_url",
      "source_name",
      "publisher",
      "source_type",
      "source_record_id",
      "license",
      "attribution",
      "accessed_at",
      "retrieved_at"
    ]) {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id} missing rejected field ${field}`);
      }
    }
  }

  return { pointBacked, geometryRefOnly, errors, warnings };
}

function minMaxDates(candidates) {
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return {
    start: dates[0] || null,
    end: dates[dates.length - 1] || null
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  ensureDir(OUT_DIR);
  const planningRows = readPlanningRows();
  const rowsById = new Map(planningRows.map((row) => [row.ID, row]));
  const duplicateHaystack = collectDuplicateHaystack();

  const candidates = PLANNING_LEADS.map((lead) =>
    candidateFromPlanningLead(lead, rowsById, duplicateHaystack)
  ).sort(
    (a, b) =>
      a.effective_date.localeCompare(b.effective_date) ||
      a.event_id.localeCompare(b.event_id)
  );
  const rejected = REJECTED_LEADS.map((lead) => rejectedRecord(lead, duplicateHaystack));
  const validation = validate(candidates, rejected);
  const dateRange = minMaxDates(candidates);
  const publishers = [...new Set(candidates.map((candidate) => candidate.publisher))].sort();
  const pointBackedCount = validation.pointBacked.length;
  const geometryRefOnlyCount = validation.geometryRefOnly.length;

  const sourceAudit = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    sources_checked: [
      {
        ...SOURCES.dfiPlanningStats,
        local_file: PLANNING_CSV_PATH,
        local_file_sha256: sha256(readTextIfExists(PLANNING_CSV_PATH)),
        accepted_records: candidates.length,
        disposition:
          "accepted selected residual Belfast application rows with source Easting/Northing after manual/prior-pack duplicate review"
      },
      ...rejected.map((item) => ({
        source_id: item.source_id,
        source_name: item.source_name,
        publisher: item.publisher,
        source_url: item.source_url,
        source_type: item.source_type,
        disposition: item.rejection_category,
        reason: item.reason
      }))
    ],
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    duplicate_scan: {
      roots: duplicateHaystack.roots,
      files_checked: duplicateHaystack.files_checked,
      app_id_count: duplicateHaystack.appIds.size,
      url_count: duplicateHaystack.urls.size,
      sampled_chars: duplicateHaystack.sampled_chars,
      note:
        "Duplicate scan is conservative and text-based over the manual architecture corpus and prior Belfast accepted candidate packs through Round464; generated web/data atlas outputs were not treated as source-of-truth blockers."
    },
    source_assessment: [
      {
        source_name: SOURCES.dfiPlanningStats.source_name,
        publisher: SOURCES.dfiPlanningStats.publisher,
        reliability: SOURCES.dfiPlanningStats.reliability,
        required_caveat:
          "Rows support administrative planning decision evidence only. They do not demonstrate built completion, opening, occupation or outcomes.",
        ingestion_recommendation:
          "Point-backed review candidates may be promoted only if the atlas accepts planning-decision milestones and carries the administrative-status limitations inline."
      },
      {
        source_name: "Belfast City Council project/news pages",
        publisher: "Belfast City Council",
        reliability: "usable with caveats",
        required_caveat:
          "Council pages can document starts/completions/acquisitions but often lack reusable source points; duplicates and future-use leads should stay out of the point-only corpus.",
        ingestion_recommendation:
          "Use as project evidence only where source dates and geometry are adequate or retain as rejected/review leads."
      },
      {
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        reliability: "strong for heritage status/location; risky for physical-change dating",
        required_caveat:
          "Status/listing dates and visit dates are not construction, repair or completion dates.",
        ingestion_recommendation:
          "Do not emit new physical-change candidates from status-only HED rows without a separate dated works source."
      }
    ],
    caveats: [
      "All accepted candidates are administrative planning-decision records, not construction/completion/opening evidence.",
      "All accepted candidates are point-backed by official Easting/Northing fields; WGS84 latitude/longitude uses the repo's established lightweight Belfast review transform and is approximate.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages include duplicates, out-of-scope locations, future/undated leads, geometry-ref-only route/area leads and status-only heritage sources.",
      "No prediction, simulation, causality, service-performance, capacity, health, education, environmental, economic or heritage-condition outcome claim is made."
    ]
  };

  const validationReport = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    ok: validation.errors.length === 0,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    publishers,
    source_count: new Set(candidates.map((candidate) => candidate.source_id)).size,
    warnings: validation.warnings,
    errors: validation.errors,
    duplicate_scan_roots: duplicateHaystack.roots,
    duplicate_scan_files_checked: duplicateHaystack.files_checked,
    searched_queries: SEARCH_QUERIES_CHECKED
  };

  const summary = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    sources: publishers,
    caveats: sourceAudit.caveats,
    outputs: [
      path.join(OUT_DIR, "candidates.json"),
      path.join(OUT_DIR, "rejected.json"),
      path.join(OUT_DIR, "validation_report.json"),
      path.join(OUT_DIR, "source_audit.json"),
      path.join(OUT_DIR, "summary.json"),
      path.join(OUT_DIR, "readback.json"),
      path.join(OUT_DIR, "notes.md")
    ]
  };

  const readback = {
    round_id: ROUND_ID,
    accepted_event_ids: candidates.map((candidate) => candidate.event_id),
    rejected_ids: rejected.map((item) => item.id),
    point_backed_event_ids: validation.pointBacked,
    geometry_ref_only_event_ids: validation.geometryRefOnly,
    point_corpus_ready:
      validation.geometryRefOnly.length === 0 && validation.errors.length === 0,
    validation_ok: validation.errors.length === 0
  };

  const notes = [
    `# ${ROUND_ID}`,
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Result",
    "",
    `- Accepted candidates: ${candidates.length}`,
    `- Rejected leads: ${rejected.length}`,
    `- Point-backed candidates: ${pointBackedCount}`,
    `- Geometry-ref-only candidates: ${geometryRefOnlyCount}`,
    `- Date range: ${dateRange.start} to ${dateRange.end}`,
    "",
    "## Accepted Source Mix",
    "",
    "- Department for Infrastructure planning statistics 2024/25: selected residual Belfast planning-decision rows with official Easting/Northing and no APP_ID match in the manual architecture corpus or prior Belfast accepted candidate packs through Round464.",
    "",
    "## Rejected/Not Re-Emitted",
    "",
    "- Studio Ulster, Belfast Grand Central Station, Lockhouse and City Cemetery were rejected as duplicates or prior-pack coverage.",
    "- Assembly Rooms purchase was retained as a non-physical/property-acquisition lead, not an observed architecture-change candidate.",
    "- Ulster Hospital UCC was rejected as outside Belfast city scope.",
    "- Shore Road sewer relining was rejected as geometry-ref-only for this point-first pack.",
    "- HARNI/HED status layers were treated as status-only/no-new-physical-change evidence.",
    "- QUB Weavers' Hall page was treated as future/duplicate planning context, not a distinct completed observed change.",
    "",
    "## Caveats",
    "",
    "- Planning approvals are administrative milestones only. They do not show construction start, completion, opening, occupation, final built form, or outcomes.",
    "- Source-backed points come from official Easting/Northing fields converted with the repo's lightweight Belfast review transform; use as approximate navigation points only.",
    "- No accepted record uses invented coordinates or generic geocoding.",
    "- No causality, prediction, simulation, capacity, service-performance, health, education, environmental, economic or heritage-condition impact claim is made.",
    ""
  ].join("\n");

  writeJson(path.join(OUT_DIR, "candidates.json"), candidates);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejected);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), notes);

  if (validation.errors.length) {
    console.error(JSON.stringify(validationReport, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        accepted_count: candidates.length,
        rejected_count: rejected.length,
        point_backed_count: pointBackedCount,
        geometry_ref_only_count: geometryRefOnlyCount,
        date_range: dateRange,
        out_dir: OUT_DIR
      },
      null,
      2
    )
  );
}

main();
