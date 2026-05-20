#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round487_belfast_official_architecture_sweep_next21";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round487_belfast_official_architecture_sweep_next21_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};
const DEDUPE_BOUNDARY_ROUND = 477;

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
  "Round487 official Belfast architecture sweep next21 after the completed Round477 next20 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning/statutory-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using the EPSG projection parameters and TOWGS84 transform.",
  "Each accepted record is an observed administrative planning or statutory-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Official Belfast/NI project, heritage, utility and page-only leads were checked and kept out where they were duplicates, geometry-ref-only, status-only, future-only, page-only or lower priority for this point-first next21 pack."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round487OfficialArchitectureSweepNext21`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round487",
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
    app_id: "LA04/2024/1924/F",
    event_id: "bfs_arch_round487_rugby_road_nursery_to_office_approval_2025",
    title: "1 Rugby Road nursery-to-office change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from creche/day nursery to office accommodation at 1 Rugby Road.",
    admin_proposal_summary:
      "Change of use from creche/day nursery to office accommodation.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "nursery-to-office change of use"
  },
  {
    app_id: "LA04/2024/1101/LBC",
    related_app_ids: ["LA04/2024/1200/F"],
    event_id: "bfs_arch_round487_ni_regional_war_rooms_roof_plant_lbc_2025",
    title: "NI Regional War Rooms roof plant and louvre works were approved",
    observed_change:
      "Official planning-statistics rows record listed-building consent and full permission for roof-mounted air-conditioning plant, louvre acoustic barrier and PV panels at NI Regional War Rooms, 48 Mount Eden Park.",
    admin_proposal_summary:
      "Roof-mounted air-conditioning plant with associated louvre acoustic barrier and PV panels.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building roof plant, louvre barrier and PV-panel works"
  },
  {
    app_id: "LA04/2024/1948/LBC",
    event_id: "bfs_arch_round487_botanic_avenue_ceiling_floor_repairs_lbc_2025",
    title: "108 Botanic Avenue ceiling and floor repairs consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for ceiling strengthening, lath-and-plaster ceiling repair and floor-board works at 108 Botanic Avenue.",
    admin_proposal_summary:
      "Strengthening and repair of ceiling fabric, plus refixing or replacement of floor boards and floor coverings.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building ceiling and floor repairs"
  },
  {
    app_id: "LA04/2024/2033/F",
    event_id: "bfs_arch_round487_lislea_drive_portacabin_office_approval_2025",
    title: "18 Lislea Drive prefabricated office accommodation works were approved",
    observed_change:
      "Official planning-statistics row records approval for relocation of a prefabricated portacabin and fitting out as office accommodation at 18 Lislea Drive.",
    admin_proposal_summary:
      "Relocation of prefabricated portacabin on site, fitting out as office accommodation and associated site works including car-parking reconfiguration.",
    event_type: "planning_decision_office_accommodation",
    category: "architecture_commercial_admin",
    limitation_topic: "prefabricated office accommodation and associated site works"
  },
  {
    app_id: "LA04/2024/1415/F",
    event_id: "bfs_arch_round487_castlereagh_street_retail_apartment_hmo_approval_2025",
    title: "60 Castlereagh Street retail and apartment HMO change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of a ground-floor retail unit and upper-floor apartment into an HMO at 60 Castlereagh Street.",
    admin_proposal_summary:
      "Change of use of ground-floor retail unit and upper-floor apartment into an HMO.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "retail and apartment HMO change of use"
  },
  {
    app_id: "LA04/2024/1521/F",
    event_id: "bfs_arch_round487_templemore_avenue_commercial_short_let_approval_2025",
    title: "213 Templemore Avenue commercial-unit short-term-let change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from commercial unit to short-term-let accommodation at the ground floor of 213 Templemore Avenue.",
    admin_proposal_summary:
      "Change of use from commercial unit to short-term-let accommodation.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "commercial-unit to short-term-let change of use"
  },
  {
    app_id: "LA04/2023/2908/F",
    event_id: "bfs_arch_round487_odyssey_pavilion_refrigeration_wall_screen_approval_2025",
    title: "Odyssey Pavilion refrigeration plant, wall demolition and screen works were approved",
    observed_change:
      "Official planning-statistics row records approval for new refrigeration plant, demolition of an existing wall and erection of an acoustic fencing screen at 2 Odyssey Pavilion.",
    admin_proposal_summary:
      "Installation of refrigeration plant, demolition of existing wall and erection of new acoustic fencing screen.",
    event_type: "planning_decision_building_services_alteration",
    category: "architecture_commercial_admin",
    limitation_topic: "plant installation, wall demolition and acoustic-screen works"
  },
  {
    app_id: "LA04/2024/2047/LBC",
    event_id: "bfs_arch_round487_royal_victoria_hospital_internal_repairs_lbc_2025",
    title: "Royal Victoria Hospital internal alteration and repair consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for internal alterations and repairs to windows and downpipes at Royal Victoria Hospital.",
    admin_proposal_summary:
      "Internal alterations to floor, walls and existing entrance doors, with repairs to windows and downpipes.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_health_admin",
    limitation_topic: "listed-building hospital internal alterations and repair works"
  },
  {
    app_id: "LA04/2024/2120/F",
    event_id: "bfs_arch_round487_mcclintock_street_student_breakout_foyer_approval_2025",
    title: "1-3 McClintock Street student accommodation foyer change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use from retail to student accommodation break-out and foyer/reception areas at 1-3 McClintock Street.",
    admin_proposal_summary:
      "Retrospective change of use from retail to student accommodation break-out and foyer/reception areas.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_student_accommodation_admin",
    limitation_topic: "student accommodation foyer and break-out-area change of use"
  },
  {
    app_id: "LA04/2024/1911/F",
    event_id: "bfs_arch_round487_deanby_centre_external_lift_approval_2025",
    title: "Deanby Centre external lift works were approved",
    observed_change:
      "Official planning-statistics row records approval for creation of an external lift to serve two floors of the Deanby Centre, the former Our Lady's Girls' Primary School.",
    admin_proposal_summary:
      "Creation of an external lift to service two floors of the building.",
    event_type: "planning_decision_accessibility_works",
    category: "architecture_civic_admin",
    limitation_topic: "external lift accessibility works"
  },
  {
    app_id: "LA04/2024/1664/F",
    event_id: "bfs_arch_round487_wolseley_street_hmo_guesthouse_approval_2025",
    title: "22 Wolseley Street HMO flats to guesthouse change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from three HMO flats to a guesthouse at 22 Wolseley Street, including external and internal alterations.",
    admin_proposal_summary:
      "Change of use from three HMO flats to guesthouse, with external and internal alterations.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_residential_admin",
    limitation_topic: "HMO flats to guesthouse change of use and alterations"
  },
  {
    app_id: "LA04/2024/2119/F",
    event_id: "bfs_arch_round487_wellington_place_financial_services_to_coffee_shop_approval_2025",
    title: "5 Wellington Place financial-services to coffee-shop change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from financial services to coffee shop at 5 Wellington Place.",
    admin_proposal_summary:
      "Change of use from financial services use to sit-in coffee shop.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "financial-services to coffee-shop change of use"
  },
  {
    app_id: "LA04/2022/1880/F",
    event_id: "bfs_arch_round487_ormeau_road_retail_takeaway_flue_approval_2025",
    title: "463 Ormeau Road retail-to-hot-food-takeaway change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for retrospective change of use from retail unit to hot-food carry-out and extractor-flue works at 463 Ormeau Road.",
    admin_proposal_summary:
      "Retrospective change of use from retail unit to hot-food carry-out and erection of extractor flue.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "retail-to-hot-food-carry-out change of use and flue works"
  },
  {
    app_id: "LA04/2024/1233/DCA",
    event_id: "bfs_arch_round487_lombard_street_internal_walls_smoke_shaft_dca_2025",
    title: "1-3 Lombard Street internal-wall, smoke-shaft and external-opening consent was approved",
    observed_change:
      "Official planning-statistics row records other consent for removal of internal walls and doors, smoke-shaft creation and a new external opening at 1-3 Lombard Street.",
    admin_proposal_summary:
      "Removal of internal walls and doors on second to sixth floors, creation of a smoke shaft and new sixth-floor external opening for an external door and screen.",
    event_type: "planning_decision_demolition_consent",
    category: "architecture_commercial_admin",
    limitation_topic: "internal-wall removal, smoke-shaft and external-opening works"
  },
  {
    app_id: "LA04/2024/1585/LBC",
    event_id: "bfs_arch_round487_parliament_buildings_stonework_cleaning_lbc_2025",
    title: "Parliament Buildings external stonework cleaning consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for specialist cleaning of external stonework at Parliament Buildings.",
    admin_proposal_summary:
      "Specialist cleaning of external stonework.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building external stonework cleaning"
  },
  {
    app_id: "LA04/2024/2129/LBC",
    event_id: "bfs_arch_round487_parliament_buildings_roof_parapet_lbc_2025",
    title: "Parliament Buildings roof and parapet works consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for removal and reinstatement of roof equipment, replacement of roof and stone parapets and related parapet works at Parliament Buildings.",
    admin_proposal_summary:
      "Removal of mechanical and electrical equipment and solar array, removal of damaged parapet fabric, rebedding hoppers, replacement of roof and stone parapets, lead capping, free-standing protection rail and reinstatement of equipment and solar array.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building roof, parapet and equipment works"
  },
  {
    app_id: "LA04/2023/4234/F",
    event_id: "bfs_arch_round487_cregagh_road_retail_outlet_change_approval_2025",
    title: "44 Cregagh Road retail-outlet change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use to retail outlet at 44 Cregagh Road.",
    admin_proposal_summary:
      "Retrospective change of use to retail outlet.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "retail-outlet change of use"
  },
  {
    app_id: "LA04/2024/1667/F",
    event_id: "bfs_arch_round487_north_queen_street_offices_to_serviced_apartments_approval_2025",
    title: "208-210 North Queen Street offices-to-serviced-apartments change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from offices to two short-term-let serviced apartments at 208-210 North Queen Street, including external demolition and elevation changes.",
    admin_proposal_summary:
      "Change of use from offices to two short-term-let serviced apartments, including external demolition and elevation changes.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "offices to serviced apartments change of use with elevation changes"
  },
  {
    app_id: "LA04/2024/0601/F",
    event_id: "bfs_arch_round487_rosemary_street_gallery_short_let_facade_approval_2025",
    title: "43B Rosemary Street gallery-to-short-term-let facade works were approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from art gallery/events space to an eight-bed short-term let and facade alterations at 43B Rosemary Street.",
    admin_proposal_summary:
      "Change of use from art gallery/events space to an eight-bed short-term let and alterations to facade.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_cultural_admin",
    limitation_topic: "gallery/events-space to short-term-let change of use and facade alterations"
  },
  {
    app_id: "LA04/2025/0085/F",
    event_id: "bfs_arch_round487_victoria_house_retail_to_coffee_shop_approval_2025",
    title: "Victoria House retail-to-coffee-shop change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from retail shop unit to coffee shop at the ground-floor unit of Victoria House, 15-17 Gloucester Street.",
    admin_proposal_summary:
      "Change of use from retail shop unit to coffee shop.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_admin",
    limitation_topic: "retail-to-coffee-shop change of use"
  },
  {
    app_id: "LA04/2022/2412/F",
    event_id: "bfs_arch_round487_albertbridge_road_office_commercial_to_apartments_approval_2025",
    title: "157 Albertbridge Road office/commercial to apartments change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from office/commercial use to five apartments with communal amenity area and associated site works at 157 Albertbridge Road.",
    admin_proposal_summary:
      "Change of use from office/commercial to five apartments with communal amenity area and associated site works.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "office/commercial to apartment change of use and associated site works"
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round487_reject_bruce_street_temporary_bus_park_not_building_architecture_2025",
    title: "Bruce Street / Great Victoria Street temporary bus park change of use",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI row has source Easting/Northing and an approval date, but the proposal is temporary bus-park land use and ancillary works rather than a building architecture/statutory-consent milestone for this point-event pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/1612/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:12396",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/1612/F", "temporary bus park", "Bruce Street"]
  },
  {
    id: "bfs_arch_round487_reject_private_domestic_minor_dca_row_2025",
    title: "3 Harberton Drive minor domestic wall-demolition and ensuite conversion consent",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI DCA row is point-backed, but it concerns minor domestic masonry-wall demolition, ensuite conversion and internal refurbishment. It is retained outside this public architecture atlas next21 pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2022/0370/DCA; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:846",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2022/0370/DCA", "3 Harberton Drive", "ensuite"]
  },
  {
    id: "bfs_arch_round487_reject_single_apartment_short_let_rows_lower_priority_2025",
    title: "Single-apartment short-term-let planning rows",
    rejection_category: "lower_priority_unit_level_change_not_promoted",
    reason:
      "Point-backed DfI rows for Citygate, Bass Buildings and Cromwell Court individual apartment short-term-let changes were retained separately because this pack prioritized building-level, public/heritage, commercial, civic and facade/alteration records.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/1340/F; APP_ID:LA04/2024/1668/F; APP_ID:LA04/2024/0392/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["Citygate", "The Bass Buildings", "Cromwell Court", "short-term holiday-let"]
  },
  {
    id: "bfs_arch_round487_reject_signage_consent_rows_not_building_change_2025",
    title: "Digital sign and advertisement consent rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI CSV includes point-backed sign/advertisement consent rows, including Clifton Street and Royal Victoria Hospital Maternity Building examples. These were not promoted as architecture/building-change events for this pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2023/3286/A; APP_ID:LA04/2025/0196/A; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2023/3286/A", "LA04/2025/0196/A", "Digital Sign"]
  },
  {
    id: "bfs_arch_round487_reject_harni_hed_status_only_no_new_physical_change",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_status_only",
    reason:
      "HED spatial layers are strong for official heritage status and location, but status/listing/visit dates do not document a new physical architecture-change milestone under the current point-event contract.",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS feature service reviewed in Round487",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round487_reject_assembly_rooms_page_only_round477_boundary",
    title: "Assembly Rooms purchase and future-use page",
    rejection_category: "page_only_or_duplicate_prior_review",
    reason:
      "Belfast City Council's Assembly Rooms page remains a property/future-use lead already retained outside the point-first Belfast sweep boundary. It does not add a new source-backed point event for this pack.",
    source_url:
      "https://www.belfastcity.gov.uk/News/Council-agrees-to-purchase-Assembly-Rooms-as-city",
    source_name: "Council agrees to purchase Assembly Rooms as city centre regeneration continues",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    source_record_id: "bcc-news-2025-09-01-assembly-rooms-purchase-reviewed-round487",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Assembly Rooms", "North Street", "Braddell"]
  },
  {
    id: "bfs_arch_round487_reject_niwater_shore_road_geometry_ref_only_round477_boundary",
    title: "Shore Road sewer relining works",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "NI Water's Shore Road relining source describes an area/route rather than a reusable official point or boundary; Round487 keeps it out of the point-only promoted set.",
    source_url:
      "https://www.niwater.com/about-us/news/2025/next-phase-of-shore-road-sewer-relining-works-gets-underway",
    source_name: "Next phase of Shore Road sewer relining works gets underway",
    publisher: "Northern Ireland Water",
    source_type: "official NI Water news page",
    source_record_id: "niwater-news-2025-01-03-shore-road-sewer-relining-reviewed-round487",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["Shore Road", "sewer relining", "St Vincent Street"]
  },
  {
    id: "bfs_arch_round487_reject_qub_weavers_hall_future_duplicate_round477_boundary",
    title: "Queen's Weavers' Hall accommodation page",
    rejection_category: "future_or_duplicate_not_accepted",
    reason:
      "The official QUB page is a future/duplicate planning-context lead already reviewed at the Round477 boundary; it was not treated as a distinct completed observed change or point-ready administrative event here.",
    source_url: "https://www.qub.ac.uk/accommodation/student-accommodation/new-development/",
    source_name: "Weavers' Hall",
    publisher: "Queen's University Belfast",
    source_type: "official university accommodation page",
    source_record_id: "qub-accommodation-weavers-hall-page-reviewed-round487",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["Weavers' Hall", "Dublin Road", "459 beds"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round477 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus prior tmp Belfast candidates through round477",
  "source review: DfI planning activity statistics and 2024/25 annual dataset",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED ArcGIS feature service status-only rows",
  "source review: Belfast City Council official project/news page-only leads retained outside the Round477 boundary",
  "source review: NI Water official page geometry-ref-only utility lead",
  "source review: QUB Weavers' Hall official future/duplicate page lead"
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
      `APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and prior accepted Belfast candidate outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the Round487 duplicate scan.`,
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
    source_id: lead.id.replace(/^bfs_arch_round487_reject_/, "round487-reject-"),
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

  if (candidates.length !== 21) {
    errors.push(`Expected 21 promoted next21 candidates, found ${candidates.length}`);
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
      "All accepted candidates are point-backed by official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit CRS parameters.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include lower-priority unit-level changes, minor domestic rows, sign/advertisement rows, page-only leads, geometry-ref-only route/area leads and status-only heritage sources.",
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
    `- Dedupe boundary: Round${DEDUPE_BOUNDARY_ROUND}`,
    "",
    "## Accepted Source Mix",
    "",
    "- Department for Infrastructure planning statistics 2024/25: 21 selected Belfast planning/statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or prior accepted Belfast candidate packs through Round477.",
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- Categories include commercial and residential/commercial change-of-use rows, listed-building repair/alteration consents, public-estate heritage works, health and civic accessibility works, and facade/elevation/service alterations.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- Lower-priority DfI point-backed rows for temporary bus-park land use, minor private domestic works, single-apartment short-term-let changes and sign/advertisement consents were retained outside the promoted next21 set.",
    "- HARNI/HED spatial layers were treated as heritage status/location evidence only, not dated physical works evidence.",
    "- Belfast City Council Assembly Rooms and QUB Weavers' Hall page leads remain page-only/future/duplicate context at the Round477 boundary.",
    "- NI Water Shore Road remains geometry-ref-only for this point-first pack.",
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
