#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round494_belfast_official_architecture_sweep_next22";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round494_belfast_official_architecture_sweep_next22_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const EXPECTED_CANDIDATE_COUNT = 22;
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};
const DEDUPE_BOUNDARY_ROUND = 487;

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_ACTIVITY_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const DFI_2024_25_PUBLICATION_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025";
const DFI_2024_25_CSV_URL =
  "https://www.infrastructure-ni.gov.uk/system/files/2025-06/planning-statistics-2024-25-dataset.csv";
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const EPSG_29902_URL = "https://epsg.io/29902";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const BCC_COPYRIGHT_URL = "https://www.belfastcity.gov.uk/Copyright";
const NIW_TERMS_URL = "https://www.niwater.com/site-information";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round494 official Belfast architecture sweep next22 after the completed Round487 next21 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning/statutory-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using the EPSG projection parameters and TOWGS84 transform.",
  "Each accepted record is an observed administrative planning or statutory-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Round487 is treated as the latest Belfast official sweep dedupe boundary; official page-only, geometry-ref-only, duplicate-project, status-only, signage-only, EV-media and minor domestic leads are retained separately."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round494OfficialArchitectureSweepNext22`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round494",
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
  },
  epsg29902: {
    source_id: "epsg-29902-tm65-irish-grid",
    source_name: "EPSG:29902 TM65 / Irish Grid",
    publisher: "EPSG registry via EPSG.io",
    source_url: EPSG_29902_URL,
    source_type: "coordinate reference system definition",
    license:
      "EPSG registry terms apply to CRS metadata; source URL retained for transformation provenance.",
    attribution: "EPSG registry / EPSG.io"
  }
};

const PLANNING_LEADS = [
  {
    app_id: "LA04/2023/4535/LBC",
    event_id: "bfs_arch_round494_bryson_house_secondary_windows_lbc_2024",
    title: "Bryson House secondary-window consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for fitting secondary windows internally to specified ground-floor windows at Bryson House, 28 Bedford Street.",
    admin_proposal_summary:
      "Fitting secondary windows internally to specified existing ground-floor windows.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building secondary-window fitting"
  },
  {
    app_id: "LA04/2024/0131/F",
    event_id: "bfs_arch_round494_lamh_dhearg_clubroom_extension_approval_2024",
    title: "Cumann Lamh Dhearg clubroom extension was approved",
    observed_change:
      "Official planning-statistics row records approval for a single-storey front and rear extension to the existing clubroom at Cumann Lamh Dhearg, 168 Upper Springfield Road.",
    admin_proposal_summary:
      "Single-storey front and rear extension to existing clubroom.",
    event_type: "planning_decision_civic_extension",
    category: "architecture_civic_admin",
    limitation_topic: "clubroom front and rear extension"
  },
  {
    app_id: "LA04/2024/0260/F",
    event_id: "bfs_arch_round494_great_victoria_street_living_wall_approval_2024",
    title: "Great Victoria Street living-wall system was approved",
    observed_change:
      "Official planning-statistics row records approval for installation of a living-wall system with frame and visual reference to the Flying Figures on the gable wall at 136-142 Great Victoria Street.",
    admin_proposal_summary:
      "Installation of living-wall system with frame and visual reference to the Flying Figures.",
    event_type: "planning_decision_facade_alteration",
    category: "architecture_commercial_public_realm_admin",
    limitation_topic: "gable-wall living-wall system"
  },
  {
    app_id: "LA04/2021/2504/F",
    event_id: "bfs_arch_round494_ormeau_road_restaurant_takeaway_approval_2024",
    title: "445-449 Ormeau Road restaurant-to-takeaway change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use from restaurant to hot-food takeaway with some seating at 445-449 Ormeau Road.",
    admin_proposal_summary:
      "Retrospective change of use from restaurant to hot-food takeaway with some seating.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "restaurant-to-hot-food-takeaway change of use"
  },
  {
    app_id: "LA04/2023/3841/F",
    event_id: "bfs_arch_round494_ormeau_road_estate_agent_coffee_shop_approval_2024",
    title: "236-238 Ormeau Road estate-agent-to-coffee-shop change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from estate agent to coffee shop at 236-238 Ormeau Road.",
    admin_proposal_summary: "Change of use from estate agent to coffee shop.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "estate-agent-to-coffee-shop change of use"
  },
  {
    app_id: "LA04/2023/3683/F",
    event_id: "bfs_arch_round494_castlereagh_road_a1_office_residential_approval_2024",
    title: "74 Castlereagh Road A1 unit and office-to-residential works were approved",
    observed_change:
      "Official planning-statistics row records approval to retain the ground-floor A1 unit, reinstate the rear yard and change first and second floor office use to a two-bedroom residential unit at 74 Castlereagh Road.",
    admin_proposal_summary:
      "Retention of ground-floor A1 use, reinstatement of rear yard, first and second floor office-to-residential change of use and additional site works.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "A1 unit retention, office-to-residential change of use and associated site works"
  },
  {
    app_id: "LA04/2023/3702/F",
    event_id: "bfs_arch_round494_glenveagh_school_modular_classrooms_approval_2024",
    title: "Glenveagh Special School modular classrooms were approved",
    observed_change:
      "Official planning-statistics row records approval for a four-classroom special-educational-needs modular unit with associated parking, play-space and site-securing works at Glenveagh Special School.",
    admin_proposal_summary:
      "Four-classroom special-educational-needs modular unit with associated parking, play spaces and site-securing works.",
    event_type: "planning_decision_school_modular_unit",
    category: "architecture_education_admin",
    limitation_topic: "school modular-classroom unit and associated site works"
  },
  {
    app_id: "LA04/2024/0092/F",
    event_id: "bfs_arch_round494_hamel_court_warden_office_apartments_approval_2024",
    title: "1 Hamel Court warden office and apartment conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from function room to wardens office, conversion of a vacant warden's dwelling to two apartments and construction of a porch at 1 Hamel Court.",
    admin_proposal_summary:
      "Change of use from function room to wardens office, conversion of vacant warden's dwelling to two apartments and construction of a single-storey porch.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_residential_civic_admin",
    limitation_topic: "function-room, warden-office, apartment-conversion and porch works"
  },
  {
    app_id: "LA04/2023/3789/F",
    event_id: "bfs_arch_round494_berry_street_office_short_lets_approval_2024",
    title: "22-24 Berry Street office-to-short-term-let change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from first- and second-floor office space to two short-term holiday lets at 22-24 Berry Street.",
    admin_proposal_summary:
      "Change of use from first- and second-floor office space to two short-term holiday lets.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "office-to-short-term-holiday-let change of use"
  },
  {
    app_id: "LA04/2024/0479/LBC",
    related_app_ids: ["LA04/2024/0584/F"],
    event_id: "bfs_arch_round494_mount_charles_lime_rendering_lbc_approval_2024",
    title: "3-5 Mount Charles rear-wall lime-rendering consent was approved",
    observed_change:
      "Official planning-statistics rows record listed-building consent and full permission for partial lime rendering of rear and yard wall elevations at 3-5 Mount Charles.",
    admin_proposal_summary:
      "Partial lime rendering of rear and yard wall elevations.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building rear and yard wall lime-rendering works"
  },
  {
    app_id: "LA04/2022/0930/F",
    event_id: "bfs_arch_round494_ravenhill_road_a1_d2_gymnasium_approval_2024",
    title: "47 Ravenhill Road A1/D2-to-gymnasium change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use from Class A1 and D2 to a ground-floor gymnasium at 47 Ravenhill Road.",
    admin_proposal_summary:
      "Retrospective change of use from Class A1 and D2 to a ground-floor gymnasium.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "Class A1/D2-to-gymnasium change of use"
  },
  {
    app_id: "LA04/2024/0751/LBC",
    event_id: "bfs_arch_round494_royal_avenue_roof_covering_lbc_approval_2024",
    title: "7-19 Royal Avenue roof-covering replacement consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for removal and replacement of artificial slate and single-ply roof coverings at 7-19 Royal Avenue, including insulation upgrading.",
    admin_proposal_summary:
      "Removal and replacement of artificial slate and single-ply roof coverings, including insulation upgrading.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building roof-covering replacement"
  },
  {
    app_id: "LA04/2024/0402/F",
    event_id: "bfs_arch_round494_lisburn_road_retail_solicitors_office_approval_2024",
    title: "679 Lisburn Road retail-to-solicitors-office change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of a ground-floor unit from retail use to solicitors office at 679 Lisburn Road.",
    admin_proposal_summary:
      "Change of use of ground-floor unit from retail use class A1 to solicitors office use class A2.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "retail-to-solicitors-office change of use"
  },
  {
    app_id: "LA04/2023/4416/F",
    event_id: "bfs_arch_round494_shankill_road_furniture_shop_takeaway_flue_approval_2024",
    title: "391-393 Shankill Road furniture-shop-to-takeaway change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from furniture shop to hot-food takeaway with external flue at 391-393 Shankill Road.",
    admin_proposal_summary:
      "Change of use from furniture shop to hot-food takeaway with external flue.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "furniture-shop-to-hot-food-takeaway change of use and flue works"
  },
  {
    app_id: "LA04/2024/0577/F",
    event_id: "bfs_arch_round494_prince_regent_road_warehouse_roof_recladding_approval_2024",
    title: "9 Prince Regent Road warehouse roofing works were approved",
    observed_change:
      "Official planning-statistics row records approval for retention of roof recladding and flat-roof replacement on an existing warehouse building at 9 Prince Regent Road.",
    admin_proposal_summary:
      "Retention of roofing recladding and replacement of flat roofing on an existing warehouse building.",
    event_type: "planning_decision_building_fabric_alteration",
    category: "architecture_industrial_commercial_admin",
    limitation_topic: "warehouse roof recladding and flat-roof replacement"
  },
  {
    app_id: "LA04/2024/0670/F",
    event_id: "bfs_arch_round494_falls_road_office_hmo_approval_2024",
    title: "461 Falls Road office-to-HMO change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from office to five-bedroom HMO at 461 Falls Road.",
    admin_proposal_summary: "Change of use from office to five-bedroom HMO.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "office-to-HMO change of use"
  },
  {
    app_id: "LA04/2024/0718/LBC",
    event_id: "bfs_arch_round494_royal_avenue_internal_shopfront_lbc_approval_2024",
    title: "6 Royal Avenue internal-space and shopfront consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for refurbishment works to internal spaces and external shopfront at 6 Royal Avenue, including replacement fascia and hanging signage.",
    admin_proposal_summary:
      "Refurbishment works to internal spaces and external shopfront, with replacement fascia and hanging signage.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building internal-space and shopfront refurbishment works"
  },
  {
    app_id: "LA04/2023/4616/F",
    event_id: "bfs_arch_round494_lisburn_road_glazed_box_external_seating_approval_2024",
    title: "54 Lisburn Road glazed external-seating enclosure was approved",
    observed_change:
      "Official planning-statistics row records approval for installation of a glazed box to enclose an existing external seating area at Nicos, 54 Lisburn Road.",
    admin_proposal_summary:
      "Installation of glazed box to enclose existing external seating area.",
    event_type: "planning_decision_external_alteration",
    category: "architecture_commercial_admin",
    limitation_topic: "glazed external-seating enclosure"
  },
  {
    app_id: "LA04/2024/0949/LBC",
    event_id: "bfs_arch_round494_mount_charles_stud_walls_access_hallway_lbc_2024",
    title: "26-30 Mount Charles stud-wall and access-hallway consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for reinstating and creating stud walls and doors, reinstating an opening between 26 and 28 Mount Charles and creating an access hallway.",
    admin_proposal_summary:
      "Reinstating and creating stud walls and doors, reinstating an opening between 26 and 28 Mount Charles and creating an access hallway.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_residential_admin",
    limitation_topic: "listed-building stud-wall, door and access-hallway works"
  },
  {
    app_id: "LA04/2023/3577/DCA",
    event_id: "bfs_arch_round494_donegall_place_internal_external_demolition_dca_2024",
    title: "Donegall Place and Fountain Lane internal/external demolition consent was approved",
    observed_change:
      "Official planning-statistics row records other consent for proposed partial demolition of internal and external walls, floors and stairs at 11-15 Donegall Place and 1-7 Fountain Lane.",
    admin_proposal_summary:
      "Proposed partial demolition of internal and external walls, floors and stairs.",
    event_type: "planning_decision_demolition_consent",
    category: "architecture_commercial_admin",
    limitation_topic: "partial internal and external demolition works"
  },
  {
    app_id: "LA04/2023/4007/F",
    event_id: "bfs_arch_round494_beechmount_avenue_office_apartment_approval_2024",
    title: "10 Beechmount Avenue office-to-apartment change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from ground-floor office unit to one-bedroom apartment with external changes at 10 Beechmount Avenue.",
    admin_proposal_summary:
      "Change of use from ground-floor office unit to one-bedroom apartment with external changes.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "office-to-apartment change of use with external changes"
  },
  {
    app_id: "LA04/2024/0332/LBC",
    event_id: "bfs_arch_round494_harbour_office_steps_railings_lbc_2024",
    title: "Harbour Office entrance-step and railing consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for replacement granite entrance steps, relocation of historic railings and regrading of footpath levels at Harbour Office, Corporation Square.",
    admin_proposal_summary:
      "Removal of existing granite entrance step, replacement with two granite steps, relocation of historic railings and regrading of existing footpath levels.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building entrance-step, railing and footpath-level works"
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round494_reject_malone_road_dca_duplicate_prior_full_app",
    title: "70-74 Malone Road front-elevation demolition consent",
    rejection_category: "duplicate_project_boundary",
    reason:
      "The DfI DCA row has a source point and approval date, but it is tied to the same 70-74 Malone Road shop/canopy project as prior accepted/manual APP_ID LA04/2022/2378/F, so it is retained outside the Round494 promoted set.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/0453/DCA; RELATED_PRIOR_APP_ID:LA04/2022/2378/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:7180",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/0453/DCA", "LA04/2022/2378/F", "70-74 Malone Road"]
  },
  {
    id: "bfs_arch_round494_reject_city_hall_cycle_racks_lower_priority",
    title: "Belfast City Hall wall-mounted cycle-rack consent",
    rejection_category: "lower_priority_fixture_change_not_promoted",
    reason:
      "The listed-building consent row is official and point-backed, but it concerns cycle-rack replacement rather than a higher-signal building-change milestone for this next22 pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/0778/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:8581",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/0778/LBC", "Belfast City Hall", "cycle racks"]
  },
  {
    id: "bfs_arch_round494_reject_signage_and_media_screen_rows_not_building_change",
    title: "Signage, advertisement and EV-media-screen planning rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Point-backed DfI rows for signs, advertisement panels and EV charger media screens were reviewed but not promoted because the current pack prioritizes planning/statutory-consent records for building fabric, use, public/civic facilities and heritage works.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/0018/F; APP_ID:LA04/2024/0712/A; APP_ID:LA04/2024/0726/LBC; APP_ID:LA04/2024/1093/A; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["screen media charger", "external building signage", "awning signage"]
  },
  {
    id: "bfs_arch_round494_reject_minor_domestic_rows_not_public_architecture",
    title: "Minor private domestic extension and demolition rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI CSV includes many point-backed domestic extensions, dormers, garages, access ramps and boundary demolitions. These are retained outside this public architecture next22 pack unless a later spec explicitly targets parcel-level domestic alterations.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0028/F; APP_ID:LA04/2024/0560/DCA; APP_ID:LA04/2024/1544/DCA; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["domestic extension", "rear dormer", "partial removal of rear elevation wall"]
  },
  {
    id: "bfs_arch_round494_reject_harni_hed_status_only_no_new_physical_change",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_status_only",
    reason:
      "HED spatial layers are strong for official heritage status and location, but status/listing/visit dates do not document a new physical architecture-change milestone under the current point-event contract.",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS feature service reviewed in Round494",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round494_reject_bcc_project_pages_page_only_or_copyright_limited",
    title: "Belfast City Council project and news pages",
    rejection_category: "page_only_or_license_limited",
    reason:
      "Council project/news pages were checked as official leads, but the reviewed pages did not add a new reusable source point beyond the DfI point rows or had website copyright terms that require citation-only treatment rather than redistribution of page content.",
    source_url: BCC_COPYRIGHT_URL,
    source_name: "Belfast City Council copyright and project/news pages",
    publisher: "Belfast City Council",
    source_type: "official council web pages",
    source_record_id: "bcc-project-pages-reviewed-round494",
    license:
      "Belfast City Council website copyright/terms; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Belfast City Council", "Assembly Rooms", "project page"]
  },
  {
    id: "bfs_arch_round494_reject_niwater_route_pages_geometry_ref_only",
    title: "Northern Ireland Water route/area works pages",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "Official NI Water works pages can document route or area works, but the reviewed leads did not expose a reusable official point coordinate or point-level source row for this point-event candidate pack.",
    source_url: NIW_TERMS_URL,
    source_name: "Northern Ireland Water project/news pages",
    publisher: "Northern Ireland Water",
    source_type: "official utility project/news pages",
    source_record_id: "niwater-project-pages-reviewed-round494",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["NI Water", "Shore Road", "sewer relining"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round487 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus prior tmp Belfast candidates through round487",
  "source review: DfI planning activity statistics and 2024/25 annual dataset",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED ArcGIS feature service status-only rows",
  "source review: Belfast City Council official project/news pages and website copyright terms",
  "source review: NI Water official page geometry-ref-only utility leads",
  "source review: DfI point-backed signage, EV-media, fixture and minor domestic rows retained outside promoted pack"
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
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
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

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function inverseIrishGridToTm65(easting, northing) {
  const a = 6377340.189;
  const inverseFlattening = 299.3249646;
  const b = a * (1 - 1 / inverseFlattening);
  const f0 = 1.000035;
  const lat0 = degToRad(53.5);
  const lon0 = degToRad(-8);
  const northing0 = 250000;
  const easting0 = 200000;
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b);

  let lat = lat0;
  let meridionalArc = 0;
  do {
    lat = (northing - northing0 - meridionalArc) / (a * f0) + lat;
    const ma =
      (1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * (lat - lat0);
    const mb =
      (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) *
      Math.sin(lat - lat0) *
      Math.cos(lat + lat0);
    const mc =
      ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) *
      Math.sin(2 * (lat - lat0)) *
      Math.cos(2 * (lat + lat0));
    const md =
      (35 / 24) *
      n ** 3 *
      Math.sin(3 * (lat - lat0)) *
      Math.cos(3 * (lat + lat0));
    meridionalArc = b * f0 * (ma - mb + mc - md);
  } while (Math.abs(northing - northing0 - meridionalArc) >= 0.000001);

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const tanLat = Math.tan(lat);
  const nu = (a * f0) / Math.sqrt(1 - e2 * sinLat ** 2);
  const rho =
    (a * f0 * (1 - e2)) / Math.pow(1 - e2 * sinLat ** 2, 1.5);
  const eta2 = nu / rho - 1;
  const dE = easting - easting0;
  const secLat = 1 / cosLat;

  const vii = tanLat / (2 * rho * nu);
  const viii =
    (tanLat / (24 * rho * nu ** 3)) *
    (5 + 3 * tanLat ** 2 + eta2 - 9 * tanLat ** 2 * eta2);
  const ix =
    (tanLat / (720 * rho * nu ** 5)) *
    (61 + 90 * tanLat ** 2 + 45 * tanLat ** 4);
  const x = secLat / nu;
  const xi = (secLat / (6 * nu ** 3)) * (nu / rho + 2 * tanLat ** 2);
  const xii =
    (secLat / (120 * nu ** 5)) *
    (5 + 28 * tanLat ** 2 + 24 * tanLat ** 4);
  const xiia =
    (secLat / (5040 * nu ** 7)) *
    (61 + 662 * tanLat ** 2 + 1320 * tanLat ** 4 + 720 * tanLat ** 6);

  return {
    latitudeRadians: lat - vii * dE ** 2 + viii * dE ** 4 - ix * dE ** 6,
    longitudeRadians:
      lon0 + x * dE - xi * dE ** 3 + xii * dE ** 5 - xiia * dE ** 7,
    semiMajorAxis: a,
    semiMinorAxis: b
  };
}

function geodeticToCartesian(latitudeRadians, longitudeRadians, height, semiMajorAxis, semiMinorAxis) {
  const e2 = 1 - (semiMinorAxis * semiMinorAxis) / (semiMajorAxis * semiMajorAxis);
  const sinLat = Math.sin(latitudeRadians);
  const nu = semiMajorAxis / Math.sqrt(1 - e2 * sinLat ** 2);
  return {
    x:
      (nu + height) *
      Math.cos(latitudeRadians) *
      Math.cos(longitudeRadians),
    y:
      (nu + height) *
      Math.cos(latitudeRadians) *
      Math.sin(longitudeRadians),
    z: ((1 - e2) * nu + height) * sinLat
  };
}

function applyTm65ToWgs84Transform(cartesian) {
  const tx = 482.5;
  const ty = -130.6;
  const tz = 564.6;
  const rx = -1.042;
  const ry = -0.214;
  const rz = -0.631;
  const scalePpm = 8.15;
  const arcSecondsToRadians = Math.PI / (180 * 3600);
  const rxRad = rx * arcSecondsToRadians;
  const ryRad = ry * arcSecondsToRadians;
  const rzRad = rz * arcSecondsToRadians;
  const scale = 1 + scalePpm * 1e-6;
  return {
    x: tx + scale * (cartesian.x - rzRad * cartesian.y + ryRad * cartesian.z),
    y: ty + scale * (rzRad * cartesian.x + cartesian.y - rxRad * cartesian.z),
    z: tz + scale * (-ryRad * cartesian.x + rxRad * cartesian.y + cartesian.z)
  };
}

function cartesianToGeodetic(cartesian, semiMajorAxis, semiMinorAxis) {
  const e2 = 1 - (semiMinorAxis * semiMinorAxis) / (semiMajorAxis * semiMajorAxis);
  const p = Math.sqrt(cartesian.x ** 2 + cartesian.y ** 2);
  let latitude = Math.atan2(cartesian.z, p * (1 - e2));
  let previousLatitude;
  do {
    previousLatitude = latitude;
    const nu = semiMajorAxis / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2);
    latitude = Math.atan2(cartesian.z + e2 * nu * Math.sin(latitude), p);
  } while (Math.abs(latitude - previousLatitude) > 1e-12);
  const longitude = Math.atan2(cartesian.y, cartesian.x);
  return { latitudeRadians: latitude, longitudeRadians: longitude };
}

function irishGridToWgs84(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const tm65 = inverseIrishGridToTm65(easting, northing);
  const tm65Cartesian = geodeticToCartesian(
    tm65.latitudeRadians,
    tm65.longitudeRadians,
    0,
    tm65.semiMajorAxis,
    tm65.semiMinorAxis
  );
  const wgs84Cartesian = applyTm65ToWgs84Transform(tm65Cartesian);
  const wgs84 = cartesianToGeodetic(
    wgs84Cartesian,
    6378137,
    6356752.314245179
  );
  return {
    latitude: roundCoord(radToDeg(wgs84.latitudeRadians)),
    longitude: roundCoord(radToDeg(wgs84.longitudeRadians))
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
    if (roundNumber !== null && roundNumber > DEDUPE_BOUNDARY_ROUND) continue;
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
      `tmp/subagents Belfast accepted candidate packs through round${DEDUPE_BOUNDARY_ROUND}`
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
    "The point is transformed from official planning-statistics Easting/Northing in EPSG:29902 TM65 / Irish Grid and should be treated as an application/site navigation point, not a surveyed footprint, legal red-line boundary, curtilage, room, facade, wall, streetworks area, campus boundary, or works extent.",
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
  const point = irishGridToWgs84(easting, northing);
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
    coordinate_reference_system: "EPSG:29902 TM65 / Irish Grid",
    coordinate_conversion:
      "Deterministic EPSG:29902 TM65 / Irish Grid inverse Transverse Mercator conversion to WGS84 using Airy Modified 1849 ellipsoid, latitude_of_origin 53.5, central_meridian -8, scale_factor 1.000035, false_easting 200000, false_northing 250000, and TOWGS84[482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15].",
    coordinate_reference_url: EPSG_29902_URL,
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: null,
    geometry_source:
      "Source-backed DfI planning-statistics Easting/Northing converted from EPSG:29902 TM65 / Irish Grid to WGS84.",
    geometry_precision:
      "Application/site navigation point from official planning-statistics row; not a surveyed footprint, legal boundary, facade, room, campus, streetworks area or works extent.",
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
      `APP_ID and related APP_IDs were absent from the manual architecture corpus and prior accepted Belfast candidate packs through Round${DEDUPE_BOUNDARY_ROUND} during this sweep.`
    ],
    limitations: limitationsFor(lead),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      { rel: "primary_source_page", href: DFI_PLANNING_ACTIVITY_URL },
      { rel: "annual_publication", href: DFI_2024_25_PUBLICATION_URL },
      { rel: "source_dataset", href: DFI_2024_25_CSV_URL },
      { rel: "license", href: OGL_URL },
      { rel: "coordinate_reference_system", href: EPSG_29902_URL }
    ],
    duplicate_check_terms: duplicateTerms,
    duplicate_review:
      `APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and prior accepted Belfast candidate outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the Round494 duplicate scan.`,
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
    source_id: lead.id.replace(/^bfs_arch_round494_reject_/, "round494-reject-"),
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
    "transformation_method",
    "latitude",
    "longitude"
  ];
  const seenIds = new Set();
  const seenCandidateIds = new Set();
  const seenSourceDateKeys = new Set();
  const seenSourceRecordIds = new Set();
  const pointBacked = [];
  const geometryRefOnly = [];
  const badClaim =
    /\b(predicts?|forecast|simulation|simulate|caused|causes|will increase|will decrease|proves|impact score|10-year|officially opened|was opened|has opened|completion report)\b/i;

  if (candidates.length !== EXPECTED_CANDIDATE_COUNT) {
    errors.push(
      `Expected ${EXPECTED_CANDIDATE_COUNT} promoted next22 candidates, found ${candidates.length}`
    );
  }

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
    dedupe_boundary: `Round${DEDUPE_BOUNDARY_ROUND}`,
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
          `accepted curated residual Belfast planning/statutory-consent rows with official Easting/Northing after manual/corpus/prior-pack duplicate review through Round${DEDUPE_BOUNDARY_ROUND}`
      },
      {
        ...SOURCES.epsg29902,
        accepted_records: candidates.length,
        disposition:
          "used as coordinate-reference provenance for deterministic conversion of source Easting/Northing to WGS84 point coordinates"
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
        `Duplicate scan is conservative and text-based over the manual architecture corpus and prior accepted Belfast candidate packs through Round${DEDUPE_BOUNDARY_ROUND}; generated web/data atlas outputs are not treated as source-of-truth blockers.`
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
        source_name: SOURCES.epsg29902.source_name,
        publisher: SOURCES.epsg29902.publisher,
        reliability:
          "strong for CRS parameter provenance; does not certify the DfI row point as a surveyed footprint",
        required_caveat:
          "Converted points represent source row Easting/Northing locations only, not planning red-line boundaries or building footprints.",
        ingestion_recommendation:
          "Retain source Easting/Northing, CRS URL and conversion method alongside WGS84 coordinates."
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
        source_name: "Belfast City Council project/news pages",
        publisher: "Belfast City Council",
        reliability: "usable with caveats",
        required_caveat:
          "Council pages can document official announcements, but reviewed pages did not expose a new reusable source point for this pack and website copyright limits redistribution of page content.",
        ingestion_recommendation:
          "Use as citation-only context or reject unless a source-backed point/boundary and compatible reuse terms are present."
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
      "All accepted candidates are point-backed by official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit CRS parameters.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include duplicate-project consents, lower-priority fixture changes, minor domestic rows, sign/advertisement/media-screen rows, page-only leads, geometry-ref-only route/area leads and status-only heritage sources.",
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
    dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND,
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
    accepted_source_date_keys: candidates.map((candidate) => candidate.source_date_key),
    rejected_ids: rejected.map((item) => item.id),
    point_backed_event_ids: validation.pointBacked,
    geometry_ref_only_event_ids: validation.geometryRefOnly,
    point_corpus_ready:
      validation.geometryRefOnly.length === 0 && validation.errors.length === 0,
    validation_ok: validation.errors.length === 0,
    dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND
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
    `- Dedupe boundary: Round${DEDUPE_BOUNDARY_ROUND}`,
    "",
    "## Accepted Source Mix",
    "",
    "- Department for Infrastructure planning statistics 2024/25: 22 selected Belfast planning/statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or prior accepted Belfast candidate packs through Round487.",
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- Categories include listed-building consents, commercial and residential/commercial change-of-use rows, civic/education facilities, facade/public-realm works, building-fabric/roofing works and demolition/alteration consents.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- The 70-74 Malone Road DCA row was retained outside the promoted pack because it overlaps a prior accepted/manual full-planning project record for the same site and works.",
    "- Signage, advertisement, EV-media-screen, fixture-only and minor domestic DfI rows were reviewed but not promoted as higher-signal public architecture events.",
    "- HARNI/HED spatial layers were treated as heritage status/location evidence only, not dated physical works evidence.",
    "- Belfast City Council pages and NI Water route/area pages remain citation-only/page-only or geometry-ref-only leads unless a source-backed point/boundary and compatible reuse terms are available.",
    "",
    "## Caveats",
    "",
    "- Planning approvals and listed-building/demolition/other consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.",
    "- Source-backed points come from official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84; use as application/site navigation points only.",
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
