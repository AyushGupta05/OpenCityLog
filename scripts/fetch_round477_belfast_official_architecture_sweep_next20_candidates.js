#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round477_belfast_official_architecture_sweep_next20";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round477_belfast_official_architecture_sweep_next20_candidates.js";
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
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const NIW_TERMS_URL = "https://www.niwater.com/site-information";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round477 official Belfast architecture sweep after the completed Round472 next19 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning/statutory-consent decision date and official Easting/Northing suitable for deterministic point conversion.",
  "Each accepted record is an observed administrative planning or statutory-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Official Belfast/NI project, heritage and utility sources were checked for leads and kept out where they were duplicates, page-only, geometry-ref-only, status-only or lower priority for this point-first next20 pack."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round477OfficialArchitectureSweepNext20`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round477",
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
      "application-level administrative planning or statutory-consent decision with source Easting/Northing",
    reliability:
      "strong for administrative decision evidence; not physical-start, physical-completion or opening evidence"
  }
};

const PLANNING_LEADS = [
  {
    app_id: "LA04/2024/0841/F",
    event_id: "bfs_arch_round477_dehra_grove_flats_refurbishment_approval_2024",
    title: "Dehra Grove flats refurbishment planning permission was approved",
    observed_change:
      "Official planning-statistics row records approval for internal and external refurbishment to flats and communal areas at Blocks 1-4, 5-13 and 14-17 Dehra Grove.",
    admin_proposal_summary:
      "Internal and external refurbishment to flats and communal areas, with limited rear-wall, window and rear-door works.",
    event_type: "planning_decision_refurbishment",
    category: "architecture_residential_admin",
    limitation_topic: "multi-block flats refurbishment"
  },
  {
    app_id: "LA04/2024/0367/F",
    event_id: "bfs_arch_round477_castle_buildings_stormont_cladding_approval_2024",
    title: "Castle Buildings Stormont facade cladding works were approved",
    observed_change:
      "Official planning-statistics row records approval for high-level cladding panels at Castle Buildings, Stormont Estate.",
    admin_proposal_summary:
      "High-level cladding panels to conceal external rainwater downpipes; source text describes external facade works only.",
    event_type: "planning_decision_facade_works",
    category: "architecture_public_estate_admin",
    limitation_topic: "external facade cladding works"
  },
  {
    app_id: "LA04/2024/0611/F",
    event_id: "bfs_arch_round477_james_clow_cladding_remedial_approval_2024",
    title: "James Clow remedial cladding and balcony-decking works were approved",
    observed_change:
      "Official planning-statistics row records approval for remedial works to an existing building at 1-135 James Clow, Princess Dock Street.",
    admin_proposal_summary:
      "Disassembly and rebuilding of metal and stone cladding, plus removal and replacement of balcony decking.",
    event_type: "planning_decision_remedial_works",
    category: "architecture_residential_admin",
    limitation_topic: "cladding and balcony-decking remedial works"
  },
  {
    app_id: "LA04/2024/1362/F",
    event_id: "bfs_arch_round477_william_street_retail_subdivision_shopfront_approval_2024",
    title: "15-19 William Street South retail subdivision and shopfront works were approved",
    observed_change:
      "Official planning-statistics row records approval for subdivision of an existing retail unit at 15-19 William Street South, with ground-floor window, door and shopfront entrance works.",
    admin_proposal_summary:
      "Subdivision of an existing retail unit into two retail units, repair of windows/doors and reconfiguration of the William Street South shopfront entrance.",
    event_type: "planning_decision_shopfront_fitout",
    category: "architecture_commercial_admin",
    limitation_topic: "retail subdivision and shopfront works"
  },
  {
    app_id: "LA04/2024/1508/F",
    related_app_ids: ["LA04/2024/1509/DCA"],
    event_id: "bfs_arch_round477_bedford_house_louvres_demolition_approval_2024",
    title: "Bedford House louvre and window-panel works were approved",
    observed_change:
      "Official planning-statistics rows record full permission and demolition consent for window-panel removal and louvre insertion at Bedford House, 16-22 Bedford Street.",
    admin_proposal_summary:
      "Removal of two window panels to accommodate two louvres in the existing window system.",
    event_type: "planning_decision_demolition_consent",
    category: "architecture_commercial_admin",
    limitation_topic: "window-panel removal and louvre insertion"
  },
  {
    app_id: "LA04/2024/1572/F",
    event_id: "bfs_arch_round477_qub_mbc_lecture_hall_overcladding_approval_2024",
    title: "QUB Medical Biology Centre lecture-hall overcladding was approved",
    observed_change:
      "Official planning-statistics row records approval for overcladding two elevations of the lecture-hall building at Queen's University Belfast Medical Biology Centre.",
    admin_proposal_summary:
      "Overcladding of two elevations of the lecture-hall building.",
    event_type: "planning_decision_facade_works",
    category: "architecture_education_admin",
    limitation_topic: "lecture-hall overcladding"
  },
  {
    app_id: "LA04/2023/3238/F",
    event_id: "bfs_arch_round477_boucher_centre_performing_arts_studio_approval_2024",
    title: "Boucher Centre performing-arts studio change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of vacant first-floor kitchen showroom space to a dance, performing-arts and acrobatic academy studio at The Boucher Centre.",
    admin_proposal_summary:
      "Change of use from vacant first-floor kitchen showroom to a dance, performing-arts and acrobatic academy studio.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_cultural_commercial_admin",
    limitation_topic: "performing-arts studio change of use"
  },
  {
    app_id: "LA04/2024/1120/LBC",
    event_id: "bfs_arch_round477_campbell_college_sports_hall_lbc_2024",
    title: "Campbell College sports-hall listed-building consent amendment was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for changes to the Campbell College sports-hall proposal, including floor area, clerestory windows and high-level finish changes.",
    admin_proposal_summary:
      "Minor floor-area change, reduction in clerestory windows and substitution of high-level rainscreen cladding finish over a single-storey extension.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_education_admin",
    limitation_topic: "listed-building sports-hall amendment"
  },
  {
    app_id: "LA04/2024/1414/F",
    event_id: "bfs_arch_round477_franklin_st_gym_to_office_approval_2024",
    title: "29A Franklin Street gym-to-office change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from a sports gym to an office at 29A Franklin Street.",
    admin_proposal_summary:
      "Change of use from a sports gym to an office use class.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "sports-gym to office change of use"
  },
  {
    app_id: "LA04/2024/0875/LBC",
    event_id: "bfs_arch_round477_stormont_house_annex_demolition_lbc_2024",
    title: "Stormont House Annex demolition listed-building consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for demolition of Stormont House Annex and an associated bungalow, with retention of the link entrance and lower-ground plantroom.",
    admin_proposal_summary:
      "Demolition consent for Stormont House Annex and associated bungalow, retaining the link entrance and lower-ground plantroom for access/services to main Stormont House.",
    event_type: "planning_decision_listed_building_demolition_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building demolition consent"
  },
  {
    app_id: "LA04/2023/2338/F",
    event_id: "bfs_arch_round477_finlays_factory_office_building_approval_2024",
    title: "Former Finlay's Factory office-space building permission was approved",
    observed_change:
      "Official planning-statistics row records approval for a single-storey office-space building near the former Finlay's Factory and Black Mountain Shared Space Project.",
    admin_proposal_summary:
      "Single-storey building adjacent to the Peace IV Black Mountain Shared Space Project, comprising eight office spaces with accessible WC and kitchenette facilities.",
    event_type: "planning_decision_commercial_building",
    category: "architecture_civic_commercial_admin",
    limitation_topic: "single-storey office-space building"
  },
  {
    app_id: "LA04/2023/4143/F",
    event_id: "bfs_arch_round477_botanic_avenue_hostel_change_approval_2024",
    title: "11 Botanic Avenue office-to-hostel change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from office space to tourist-hostel accommodation at second-floor level at 11 Botanic Avenue.",
    admin_proposal_summary:
      "Change of use from office space to tourist-hostel accommodation at second-floor level.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_hospitality_admin",
    limitation_topic: "office-to-hostel change of use"
  },
  {
    app_id: "LA04/2024/1126/LBC",
    event_id: "bfs_arch_round477_mater_hospital_boardroom_windows_lbc_2024",
    title: "Mater Hospital boardroom decoration and window works consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for internal decoration and external window replacement at Mater Hospital, Crumlin Road.",
    admin_proposal_summary:
      "Internal decoration to board room and bishops office, with external window replacements.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_health_admin",
    limitation_topic: "listed-building internal decoration and window works"
  },
  {
    app_id: "LA04/2024/1626/LBC",
    event_id: "bfs_arch_round477_crescent_church_fabric_repairs_lbc_2024",
    title: "Crescent Church fabric-repair listed-building consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for gutter, stonework and pointing repairs at Crescent Church, 6 University Road.",
    admin_proposal_summary:
      "General maintenance repairs to gutters, stonework and pointing, including removal of cement-based pointing and repair of dressed stone.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_civic_admin",
    limitation_topic: "listed-building fabric repairs"
  },
  {
    app_id: "LA04/2024/1768/LBC",
    event_id: "bfs_arch_round477_royal_courts_fire_compartmentation_lbc_2024",
    title: "Royal Courts of Justice fire-compartmentation consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for corridor alterations to create fire compartmentation at the Royal Courts of Justice on May Street.",
    admin_proposal_summary:
      "Corridor alterations to create fire compartmentation, incorporating new hardwood double doors and associated stud walls.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building fire-compartmentation works"
  },
  {
    app_id: "LA04/2024/1438/F",
    related_app_ids: ["LA04/2024/1618/LBC"],
    event_id: "bfs_arch_round477_st_matthews_presbytery_access_repairs_approval_2024",
    title: "St Matthews Presbytery access and brick-repair consents were approved",
    observed_change:
      "Official planning-statistics rows record full permission and listed-building consent for St Matthews Presbytery works involving bin storage, ramped access, railings and remedial brick repairs.",
    admin_proposal_summary:
      "Amendment to include bin store, ramped access and railings, with listed-building consent for remedial brickwork and associated access/bin-storage works.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_civic_admin",
    limitation_topic: "listed-building access and brick-repair works"
  },
  {
    app_id: "LA04/2024/1524/F",
    event_id: "bfs_arch_round477_ormeau_road_access_doors_approval_2024",
    title: "330 Ormeau Road access-ramp and front-door works were approved",
    observed_change:
      "Official planning-statistics row records approval for removal of front steps, installation of a ramp and steps, and replacement of front doors at 330 Ormeau Road.",
    admin_proposal_summary:
      "Removal of front steps, installation of ramp and new steps, and replacement of double front doors with a single-leaf door.",
    event_type: "planning_decision_accessibility_works",
    category: "architecture_civic_admin",
    limitation_topic: "access-ramp, steps and front-door alterations"
  },
  {
    app_id: "LA04/2023/4240/F",
    event_id: "bfs_arch_round477_great_patrick_st_eye_clinic_approval_2024",
    title: "84-94 Great Patrick Street eye-clinic conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for ground-floor and first-floor change of use to an eye clinic and eye-clinic surgery at 84-94 Great Patrick Street, with rear extension and elevational works.",
    admin_proposal_summary:
      "Ground-floor art gallery and first-floor office space change of use to eye clinic/surgery, with rear extension, elevational changes, lift provision and escape stairs.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_health_commercial_admin",
    limitation_topic: "eye-clinic conversion and associated alterations"
  },
  {
    app_id: "LA04/2024/1516/F",
    related_app_ids: ["LA04/2024/1517/LBC"],
    event_id: "bfs_arch_round477_beaumont_lodge_training_facility_approval_2024",
    title: "Beaumont Lodge hospital staff training facility permission was approved",
    observed_change:
      "Official planning-statistics rows record full permission and listed-building consent for change of use from veterinary surgeons' consulting rooms to a hospital staff training facility at Beaumont Lodge, with a single-storey extension.",
    admin_proposal_summary:
      "Change of use from veterinary surgeons' consulting rooms to a hospital staff training facility with single-storey extension.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_health_education_admin",
    limitation_topic: "hospital staff training facility change of use and extension"
  },
  {
    app_id: "LA04/2023/4607/F",
    event_id: "bfs_arch_round477_parkmore_childcare_building_approval_2025",
    title: "Parkmore Building childcare-building permission was approved",
    observed_change:
      "Official planning-statistics row records approval for removal of temporary sectional buildings and a new three-storey childcare building at Parkmore Building, 284A Ormeau Road.",
    admin_proposal_summary:
      "Removal of temporary sectional buildings and new three-storey childcare building with external play area, landscaping and access alterations.",
    event_type: "planning_decision_civic_building",
    category: "architecture_childcare_admin",
    limitation_topic: "childcare building permission"
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round477_reject_university_road_same_address_prior_context_2024",
    title: "7 University Road canopy and internal-layout consent",
    rejection_category: "same_address_prior_context_not_promoted",
    reason:
      "The 2024 listed-building-consent row is point-backed, but the same 7 University Road address is already represented in the manual/prior Belfast architecture corpus for an earlier planning event. It was retained separately to keep the promoted next20 set strict.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/1726/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:12952",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/1726/LBC", "7 University Road", "BT7 1NA"]
  },
  {
    id: "bfs_arch_round477_reject_private_domestic_minor_rows",
    title: "Private domestic extension and demolition rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI CSV contains many point-backed Belfast rows for individual dwelling extensions, garages, dormers, boundary walls and minor domestic demolitions. These were not promoted to this official architecture atlas pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "planning-statistics-2024-25 domestic/private residual rows reviewed in Round477",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["single storey rear extension", "dormer", "dwelling"]
  },
  {
    id: "bfs_arch_round477_reject_bus_shelter_street_furniture_rows",
    title: "Bus-shelter and street-furniture planning rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Several DfI planning-statistics rows have source points but concern bus shelters, signs or street furniture rather than an architecture/building consent milestone for this pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "examples reviewed include APP_ID:LA04/2023/4447/F, APP_ID:LA04/2024/0425/F and APP_ID:LA04/2024/0943/F",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["bus shelter", "street furniture", "LA04/2024/0425/F"]
  },
  {
    id: "bfs_arch_round477_reject_harni_hed_status_only_no_new_physical_change",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_status_only",
    reason:
      "HED spatial layers are strong for official heritage status and location, but status/listing/visit dates do not document a new physical architecture-change milestone for this point-event pack.",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS feature service reviewed in Round477",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round477_reject_assembly_rooms_page_only_round472_boundary",
    title: "Assembly Rooms purchase and future-use page",
    rejection_category: "page_only_or_duplicate_prior_review",
    reason:
      "Belfast City Council's Assembly Rooms page remains a property/future-use lead already handled at the Round472 boundary; it does not add a new source-backed point event for this pack.",
    source_url:
      "https://www.belfastcity.gov.uk/News/Council-agrees-to-purchase-Assembly-Rooms-as-city",
    source_name: "Council agrees to purchase Assembly Rooms as city centre regeneration continues",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    source_record_id: "bcc-news-2025-09-01-assembly-rooms-purchase-reviewed-round477",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Assembly Rooms", "North Street", "Braddell"]
  },
  {
    id: "bfs_arch_round477_reject_niwater_shore_road_geometry_ref_only_round472_boundary",
    title: "Shore Road sewer relining works",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "NI Water's Shore Road relining source describes an area/route rather than a reusable official point or boundary; Round477 keeps it out of the point-only promoted set.",
    source_url:
      "https://www.niwater.com/about-us/news/2025/next-phase-of-shore-road-sewer-relining-works-gets-underway",
    source_name: "Next phase of Shore Road sewer relining works gets underway",
    publisher: "Northern Ireland Water",
    source_type: "official NI Water news page",
    source_record_id: "niwater-news-2025-01-03-shore-road-sewer-relining-reviewed-round477",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["Shore Road", "sewer relining", "St Vincent Street"]
  },
  {
    id: "bfs_arch_round477_reject_qub_weavers_hall_future_duplicate_round472_boundary",
    title: "Queen's Weavers' Hall accommodation page",
    rejection_category: "future_or_duplicate_not_accepted",
    reason:
      "The official QUB page is a future/duplicate planning-context lead already reviewed at Round472; it was not treated as a distinct completed observed change or point-ready administrative event here.",
    source_url: "https://www.qub.ac.uk/accommodation/student-accommodation/new-development/",
    source_name: "Weavers' Hall",
    publisher: "Queen's University Belfast",
    source_type: "official university accommodation page",
    source_record_id: "qub-accommodation-weavers-hall-page-reviewed-round477",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["Weavers' Hall", "Dublin Road", "459 beds"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round472 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus prior tmp Belfast candidates through round472",
  "source review: DfI planning activity statistics and 2024/25 annual dataset",
  "source review: Belfast City Council official project/news page-only leads already rejected at the Round472 boundary",
  "source review: HED/HARNI heritage feature service status-only rows",
  "source review: NI Water official page geometry-ref-only utility lead"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
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
  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
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

function niGridToReviewPoint(easting, northing) {
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
  const month = months[match[2]];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRoundNumber(filePath) {
  const match = filePath.match(/round(\d+)_/i);
  return match ? Number(match[1]) : null;
}

function listFilesRecursive(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
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
    if (roundNumber !== null && roundNumber > 472) continue;
    files.push(file);
  }

  const appIds = new Set();
  const sourceRecordIds = new Set();
  const eventIds = new Set();
  const urls = new Set();
  const chunks = [];
  let sampledChars = 0;
  const maxSampledChars = 12_000_000;
  const maxSamplePerFile = 180_000;
  for (const file of [...new Set(files)]) {
    const text = readTextIfExists(file);
    if (!text) continue;
    for (const match of text.matchAll(/LA04\/\d{4}\/\d{4}\/[A-Z]+/g)) {
      appIds.add(match[0]);
    }
    for (const match of text.matchAll(/APP_ID:LA04\/\d{4}\/\d{4}\/[A-Z]+[^"\n]*/g)) {
      sourceRecordIds.add(match[0].trim());
    }
    for (const match of text.matchAll(/bfs_arch_[a-z0-9_]+/g)) {
      eventIds.add(match[0]);
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
    files_checked: [...new Set(files)].length,
    roots: [
      "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
      "tmp/subagents Belfast accepted candidate packs through round472"
    ],
    files: [...new Set(files)],
    appIds,
    sourceRecordIds,
    eventIds,
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
  return bits.join("; ");
}

function limitationsFor(lead) {
  return [
    `This records an approved planning/listed-building/other-consent administrative milestone for ${lead.limitation_topic}; it does not confirm site works started, physical works completed, opening, occupation, operational use, final built form, funding, public access, heritage condition, service delivery or any outcome.`,
    "The point is transformed from official planning-statistics Easting/Northing and should be treated as an approximate site navigation point, not a surveyed footprint, legal red-line boundary, curtilage, room, facade, wall, streetworks area, campus boundary, or works extent.",
    "The source row supports the application decision date and administrative decision status only; separate completion/opening evidence would be required for a physical-change corpus record."
  ];
}

function candidateFromPlanningLead(lead, rowsById, duplicateHaystack) {
  const row = rowsById.get(lead.app_id);
  if (!row) throw new Error(`Planning lead missing source row: ${lead.app_id}`);
  const relatedRows = (lead.related_app_ids || []).map((appId) => rowsById.get(appId));
  if ((lead.related_app_ids || []).length !== relatedRows.length) {
    throw new Error(`Planning lead missing related source row: ${lead.event_id}`);
  }
  const decisionDate = parseDate(row.DecisionIssuedDate || row.DateValid);
  const easting = normaliseNumber(row.Easting);
  const northing = normaliseNumber(row.Northing);
  const point = niGridToReviewPoint(easting, northing);
  if (!decisionDate) throw new Error(`Planning lead missing decision date: ${lead.app_id}`);
  if (!point) throw new Error(`Planning lead missing source point: ${lead.app_id}`);

  const appIdsForCandidate = [row.ID, ...relatedRows.map((related) => related.ID)];
  for (const appId of appIdsForCandidate) {
    if (duplicateHaystack.appIds.has(appId)) {
      throw new Error(`Planning lead duplicates prior accepted/corpus APP_ID: ${appId}`);
    }
  }

  const sourceRecordId = sourceRecordIdFor(row, relatedRows);
  if (duplicateHaystack.sourceRecordIds.has(sourceRecordId)) {
    throw new Error(`Planning lead duplicates prior source record: ${sourceRecordId}`);
  }
  if (duplicateHaystack.eventIds.has(lead.event_id)) {
    throw new Error(`Planning lead duplicates prior event_id: ${lead.event_id}`);
  }

  const source = SOURCES.dfiPlanningStats;
  const duplicateTerms = [
    lead.event_id,
    row.ID,
    ...relatedRows.map((related) => related.ID),
    row.SiteAddress,
    lead.title,
    lead.admin_proposal_summary
  ];
  const duplicateScanHits = duplicateHitsForTerms(
    duplicateHaystack,
    duplicateTerms.filter((term) => !String(term).startsWith("LA04/")),
    lead.event_id
  );

  return {
    id: lead.event_id,
    event_id: lead.event_id,
    candidate_id: lead.event_id,
    city_id: CITY_ID,
    title: lead.title,
    summary: `${source.publisher}'s ${source.coverage_years} planning-statistics dataset records ${row.Decision_Withdrawal || row.StatusAt31Mar} for ${row.ID} at ${row.SiteAddress}. Administrative proposal summary: ${lead.admin_proposal_summary}`,
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
    source_record_id: sourceRecordId,
    source_date_field: "DecisionIssuedDate",
    source_date_value: row.DecisionIssuedDate,
    source_date_key: `${source.source_id}|${row.ID}|${decisionDate}`,
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
      "Approximate application/site navigation point from official planning-statistics row; not a surveyed footprint, legal boundary, facade, room, campus, streetworks area or works extent.",
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
      "The candidate is modelled as an observed administrative planning/statutory-consent milestone only.",
      "APP_ID and related APP_IDs were absent from the manual architecture corpus and prior accepted Belfast candidate packs through Round472 during this sweep."
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
      "APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and prior accepted Belfast candidate outputs through Round472 checked by the Round477 duplicate scan.",
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
    source_id: lead.id.replace(/^bfs_arch_round477_reject_/, "round477-reject-"),
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

function validate(candidates, rejected, duplicateHaystack) {
  const errors = [];
  const warnings = [];
  const required = [
    "id",
    "event_id",
    "candidate_id",
    "city_id",
    "title",
    "summary",
    "date",
    "effective_date",
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
  const seenCandidateIds = new Set();
  const seenSourceDateKeys = new Set();
  const seenSourceRecordIds = new Set();
  const pointBacked = [];
  const geometryRefOnly = [];
  const badClaim =
    /\b(predicts?|forecast|simulation|simulate|caused|causes|will increase|will decrease|proves|impact score|10-year|officially opened|was opened|has opened|completion report)\b/i;

  for (const candidate of candidates) {
    if (seenIds.has(candidate.event_id)) {
      errors.push(`Duplicate event_id in candidates: ${candidate.event_id}`);
    }
    seenIds.add(candidate.event_id);
    if (seenCandidateIds.has(candidate.candidate_id)) {
      errors.push(`Duplicate candidate_id in candidates: ${candidate.candidate_id}`);
    }
    seenCandidateIds.add(candidate.candidate_id);
    if (seenSourceDateKeys.has(candidate.source_date_key)) {
      errors.push(`Duplicate source/date key in candidates: ${candidate.source_date_key}`);
    }
    seenSourceDateKeys.add(candidate.source_date_key);
    if (seenSourceRecordIds.has(candidate.source_record_id)) {
      errors.push(`Duplicate source_record_id in candidates: ${candidate.source_record_id}`);
    }
    seenSourceRecordIds.add(candidate.source_record_id);
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
    if (duplicateHaystack.eventIds.has(candidate.event_id)) {
      errors.push(`${candidate.event_id} already appears in duplicate haystack`);
    }
    for (const appId of [
      candidate.source_fields.ID,
      ...(candidate.source_fields.related_app_ids || [])
    ]) {
      if (duplicateHaystack.appIds.has(appId)) {
        errors.push(`${candidate.event_id} overlaps prior APP_ID ${appId}`);
      }
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
        if (coords[1] < 54.45 || coords[1] > 54.75 || coords[0] < -6.2 || coords[0] > -5.65) {
          errors.push(`${candidate.event_id} point is outside broad Belfast review bounds`);
        }
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

function countBy(candidates, key) {
  return candidates.reduce((acc, candidate) => {
    const value = candidate[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
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
  const validation = validate(candidates, rejected, duplicateHaystack);
  const dateRange = minMaxDates(candidates);
  const publishers = [...new Set(candidates.map((candidate) => candidate.publisher))].sort();
  const pointBackedCount = validation.pointBacked.length;
  const geometryRefOnlyCount = validation.geometryRefOnly.length;
  const categoryCounts = countBy(candidates, "category");
  const eventTypeCounts = countBy(candidates, "event_type");

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
        accepted_app_ids: candidates.map((candidate) => candidate.source_fields.ID),
        accepted_related_app_ids: candidates.flatMap(
          (candidate) => candidate.source_fields.related_app_ids || []
        ),
        disposition:
          "accepted curated residual Belfast planning/statutory-consent rows with official Easting/Northing after manual/corpus/prior-pack duplicate review through Round472"
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
      source_record_id_count: duplicateHaystack.sourceRecordIds.size,
      event_id_count: duplicateHaystack.eventIds.size,
      url_count: duplicateHaystack.urls.size,
      sampled_chars: duplicateHaystack.sampled_chars,
      note:
        "Duplicate scan is conservative and text-based over the manual architecture corpus and prior accepted Belfast candidate packs through Round472; generated web/data atlas outputs are not treated as source-of-truth blockers."
    },
    source_assessment: [
      {
        source_name: SOURCES.dfiPlanningStats.source_name,
        publisher: SOURCES.dfiPlanningStats.publisher,
        reliability: SOURCES.dfiPlanningStats.reliability,
        required_caveat:
          "Rows support administrative planning/statutory-consent evidence only. They do not demonstrate built completion, opening, occupation, service delivery or outcomes.",
        ingestion_recommendation:
          "Point-backed review candidates may be promoted only if the atlas accepts planning/statutory-consent milestones and carries the administrative-status limitations inline."
      },
      {
        source_name: "Belfast City Council project/news pages",
        publisher: "Belfast City Council",
        reliability: "usable with caveats",
        required_caveat:
          "Council pages can document starts/completions/acquisitions but often lack reusable source points or duplicate existing corpus events.",
        ingestion_recommendation:
          "Use as project evidence only where source dates and geometry are adequate; otherwise retain as page-only/review leads."
      },
      {
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        reliability: "strong for heritage status/location; risky for physical-change dating",
        required_caveat:
          "Status/listing dates and visit dates are not construction, repair or completion dates.",
        ingestion_recommendation:
          "Do not emit physical-change candidates from status-only HED rows without a separate dated works source."
      },
      {
        source_name: "Northern Ireland Water project/news pages",
        publisher: "Northern Ireland Water",
        reliability: "usable with caveats",
        required_caveat:
          "Route/area works pages must not be promoted to point events without an official point or boundary.",
        ingestion_recommendation:
          "Retain geometry-ref-only utility leads separately unless source-backed point geometry is exposed."
      }
    ],
    caveats: [
      "All accepted candidates are administrative planning/statutory-consent records, not physical start, completion, opening or occupation evidence.",
      "All accepted candidates are point-backed by official Easting/Northing fields; WGS84 latitude/longitude uses the repo's established lightweight Belfast review transform and is approximate.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include duplicates, lower-priority domestic rows, street-furniture rows, page-only leads, geometry-ref-only route/area leads and status-only heritage sources.",
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
    source_record_id_count: new Set(candidates.map((candidate) => candidate.source_record_id))
      .size,
    source_date_key_count: new Set(candidates.map((candidate) => candidate.source_date_key))
      .size,
    category_counts: categoryCounts,
    event_type_counts: eventTypeCounts,
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
    source_mix: {
      source_types: countBy(candidates, "source_type"),
      categories: categoryCounts,
      event_types: eventTypeCounts
    },
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
    accepted_candidate_ids: candidates.map((candidate) => candidate.candidate_id),
    accepted_source_record_ids: candidates.map((candidate) => candidate.source_record_id),
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
    `- Rejected/retained leads: ${rejected.length}`,
    `- Point-backed candidates: ${pointBackedCount}`,
    `- Geometry-ref-only accepted candidates: ${geometryRefOnlyCount}`,
    `- Date range: ${dateRange.start} to ${dateRange.end}`,
    "",
    "## Accepted Source Mix",
    "",
    "- Department for Infrastructure planning statistics 2024/25: 20 selected Belfast planning/statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or prior accepted Belfast candidate packs through Round472.",
    "- Categories include residential-block refurbishment/remedial works, public-estate facade/demolition consent, commercial shopfront/change-of-use rows, education/childcare works, health/training facility consent, and listed-building repair/access/fire-compartmentation consents.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- Lower-priority DfI point-backed rows for small private domestic works and bus shelters/street furniture were retained outside the next20 promoted set.",
    "- The 7 University Road canopy/layout consent was retained separately because the same address already appears in the manual/prior Belfast corpus for an older planning event.",
    "- HARNI/HED spatial layers were treated as heritage status/location evidence only, not dated physical works evidence.",
    "- Belfast City Council Assembly Rooms and QUB Weavers' Hall page leads remain page-only/future/duplicate context at the Round472 boundary.",
    "- NI Water Shore Road remains geometry-ref-only for this point-first pack.",
    "",
    "## Caveats",
    "",
    "- Planning approvals and listed-building/demolition consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.",
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
