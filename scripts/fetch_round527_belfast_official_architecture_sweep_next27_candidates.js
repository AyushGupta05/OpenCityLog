#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round527_belfast_official_architecture_sweep_next27";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round527_belfast_official_architecture_sweep_next27_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const EXPECTED_CANDIDATE_COUNT = 27;
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};
const DEDUPE_BOUNDARY_ROUND = 519;

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_ACTIVITY_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const DFI_2024_25_PUBLICATION_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025";
const DFI_2024_25_CSV_URL =
  "https://www.infrastructure-ni.gov.uk/system/files/2025-06/planning-statistics-2024-25-dataset.csv";
const DFI_2025_26_Q3_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-october-december-2025";
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const EPSG_29902_URL = "https://epsg.io/29902";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const HED_HISTORIC_BUILDINGS_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/1`;
const HED_HERITAGE_AT_RISK_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/3`;
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const BCC_COPYRIGHT_URL = "https://www.belfastcity.gov.uk/Copyright";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round527 official Belfast architecture sweep next27 after the completed Round519 next26 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning, demolition-consent or statutory-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using the EPSG projection parameters and TOWGS84 transform.",
  "Each accepted record is an observed administrative planning, listed-building, demolition-consent or other-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Round519 is treated as the latest Belfast official architecture sweep dedupe boundary; official page-only, geometry-ref-only, duplicate-project, status-only, signage-only, equipment-only and lower-priority minor domestic leads are retained separately."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round527OfficialArchitectureSweepNext27`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round527",
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

const PLANNING_LEADS = [];

const REJECTED_LEADS = [];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round519 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus official Belfast architecture sweep candidate packs through Round519",
  "source review: DfI planning activity statistics page and 2024/25 annual application-level CSV",
  "source review: DfI 2025/26 Q1-Q3 provisional quarterly publication pages; retained until final annual row-level dataset with coordinates",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED Historic Buildings and Heritage at Risk ArcGIS feature layers",
  "source review: Belfast City Council official project/news pages and website copyright terms",
  "source review: DfI point-backed duplicate-project, minor domestic, low-signal HMO/short-let, signage, equipment, transport and telecom rows retained outside promoted pack"
];

function replaceRound527LeadBlocks() {
  const lead = (
    app_id,
    related_app_ids,
    event_id,
    title,
    observed_change,
    admin_proposal_summary,
    event_type,
    category,
    limitation_topic
  ) => ({
    app_id,
    ...(related_app_ids.length ? { related_app_ids } : {}),
    event_id,
    title,
    observed_change,
    admin_proposal_summary,
    event_type,
    category,
    limitation_topic
  });

  PLANNING_LEADS.splice(
    0,
    PLANNING_LEADS.length,
    lead(
      "LA04/2023/3958/F",
      [],
      "bfs_arch_round527_botanic_avenue_apartment_conversion_approval_2024",
      "83 Botanic Avenue apartment-conversion approval was recorded",
      "Official planning-statistics row records approval for renovation and conversion of one domestic apartment to two domestic apartments at 83 Botanic Avenue.",
      "Renovation and conversion of one domestic apartment to two domestic apartments.",
      "planning_decision_residential_conversion",
      "architecture_residential_conversion_admin",
      "domestic apartment conversion from one apartment to two apartments"
    ),
    lead(
      "LA04/2022/2276/F",
      [],
      "bfs_arch_round527_belmont_church_road_four_dwellings_approval_2024",
      "151-153 Belmont Church Road residential-development approval was recorded",
      "Official planning-statistics row records approval for four detached three-storey dwellings with associated parking, landscaping, boundary treatment and site works at 151-153 Belmont Church Road.",
      "Four detached three-storey dwellings with integral garages, associated car parking, landscaping, boundary treatment and site works.",
      "planning_decision_residential_development",
      "architecture_residential_development_admin",
      "four-dwelling residential development approval"
    ),
    lead(
      "LA04/2022/2234/F",
      ["LA04/2022/2248/DCA"],
      "bfs_arch_round527_kings_road_refurbishment_demolition_approval_2024",
      "35 Kings Road refurbishment and demolition approvals were recorded",
      "Official planning-statistics rows record approval for refurbishment of the original house at 35 Kings Road, chimney reinstatement, side and rear extensions, and related demolition consent for later extensions and outbuildings.",
      "Original-house refurbishment, chimney reinstatement, side and rear extensions, access works, and demolition of later extensions and outbuildings.",
      "planning_decision_residential_refurbishment",
      "architecture_residential_fabric_admin",
      "private residential refurbishment, extension and related demolition-consent works"
    ),
    lead(
      "LA04/2023/3375/F",
      [],
      "bfs_arch_round527_bloomfield_avenue_office_residential_change_approval_2024",
      "122 Bloomfield Avenue office-to-dwelling approval was recorded",
      "Official planning-statistics row records approval for change of use from office to residential dwelling at 122 Bloomfield Avenue.",
      "Office-to-residential-dwelling change of use.",
      "planning_decision_change_of_use",
      "architecture_residential_commercial_admin",
      "office-to-dwelling administrative change of use"
    ),
    lead(
      "LA04/2024/0336/F",
      [],
      "bfs_arch_round527_lansdowne_road_replacement_coach_house_approval_2024",
      "84 Lansdowne Road replacement coach-house approval was recorded",
      "Official planning-statistics row records approval for erection of a two-storey replacement coach house within the curtilage of 84 Lansdowne Road and demolition of the existing two-storey coach house.",
      "Two-storey replacement coach house within an existing dwelling curtilage and demolition of an existing two-storey coach house.",
      "planning_decision_residential_outbuilding_replacement",
      "architecture_residential_fabric_admin",
      "replacement coach house and demolition of existing coach house"
    ),
    lead(
      "LA04/2023/3912/F",
      [],
      "bfs_arch_round527_ardenlee_avenue_two_storey_extension_approval_2024",
      "117 Ardenlee Avenue rear-extension approval was recorded",
      "Official planning-statistics row records approval for demolition of a rear projection and detached garage at 117 Ardenlee Avenue, with construction of a two-storey rear extension and associated landscaping.",
      "Demolition of rear projection and detached garage, construction of two-storey rear extension, landscaping and new front access.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "rear-projection and garage demolition with two-storey rear extension"
    ),
    lead(
      "LA04/2023/4012/F",
      ["LA04/2023/3980/DCA"],
      "bfs_arch_round527_myrtlefield_park_replacement_extension_demolition_approval_2024",
      "18 Myrtlefield Park replacement-extension approvals were recorded",
      "Official planning-statistics rows record approval for a replacement rear kitchen/dining extension and replacement garden room at 18 Myrtlefield Park, with related demolition consent for the existing rear extension and flat-roof garage.",
      "Replacement rear kitchen/dining extension, replacement detached garden room, external alterations, raised terrace and related demolition of existing rear extension and flat-roof garage.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "replacement rear extension, garden room and related demolition consent"
    ),
    lead(
      "LA04/2023/3779/F",
      [],
      "bfs_arch_round527_channel_commercial_park_mobile_offices_approval_2024",
      "Channel Commercial Park temporary mobile-office approval was recorded",
      "Official planning-statistics row records approval for temporary mobile offices and a reception area beside Units 1-6 Channel Commercial Park, with associated car parking and site works.",
      "Temporary mobile offices and reception area with car parking and associated site works.",
      "planning_decision_commercial_temporary_buildings",
      "architecture_commercial_estate_admin",
      "temporary mobile offices, reception area and associated commercial-estate site works"
    ),
    lead(
      "LA04/2022/2158/F",
      [],
      "bfs_arch_round527_lower_braniel_road_three_dwellings_approval_2024",
      "237 Lower Braniel Road three-dwelling approval was recorded",
      "Official planning-statistics row records approval for demolition of an existing building at 237 Lower Braniel Road and erection of three dwellings with garages, landscaping and associated site works.",
      "Demolition of existing building and erection of three dwellings, two with in-curtilage garages, landscaping and associated site works.",
      "planning_decision_residential_development",
      "architecture_residential_development_admin",
      "three-dwelling residential development approval with existing-building demolition"
    ),
    lead(
      "LA04/2023/3508/F",
      ["LA04/2023/3783/DCA"],
      "bfs_arch_round527_adelaide_park_flat_extension_garage_demolition_approval_2024",
      "38 Adelaide Park flat extension and garage-demolition approvals were recorded",
      "Official planning-statistics rows record approval for a side and rear extension to Flat 1, 38 Adelaide Park, and related demolition consent for a detached garage.",
      "Single-storey side and rear extension with related detached-garage demolition consent.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "flat extension and detached-garage demolition consent"
    ),
    lead(
      "LA04/2023/2715/F",
      ["LA04/2023/3424/DCA"],
      "bfs_arch_round527_shrewsbury_gardens_extension_demolition_approval_2024",
      "8 Shrewsbury Gardens extension and demolition approvals were recorded",
      "Official planning-statistics rows record approval for rear and side demolition, extensions, fenestration changes, detached-garage demolition and internal demolition at 8 Shrewsbury Gardens.",
      "Rear and side wall demolition to facilitate side and rear extensions, fenestration changes, detached-garage demolition and internal reconfiguration demolition.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "private residential wall demolition, extension, fenestration and garage-demolition works"
    ),
    lead(
      "LA04/2024/0144/F",
      [],
      "bfs_arch_round527_ardcarn_drive_roofspace_dormer_approval_2024",
      "30 Ardcarn Drive roofspace-dormer approval was recorded",
      "Official planning-statistics row records approval for conversion of existing roofspace at 30 Ardcarn Drive to a bedroom and ensuite, including erection of a dormer.",
      "Roofspace conversion to bedroom and ensuite, including dormer erection.",
      "planning_decision_residential_roof_alteration",
      "architecture_residential_fabric_admin",
      "roofspace conversion and dormer works"
    ),
    lead(
      "LA04/2023/3964/F",
      [],
      "bfs_arch_round527_finaghy_road_south_facade_extension_approval_2024",
      "164 Finaghy Road South facade and extension approval was recorded",
      "Official planning-statistics row records retrospective approval for side, front and rear extensions, facade alterations, a boundary wall and landscaping at 164 Finaghy Road South.",
      "First-floor side extension, single-storey front extension, two-storey rear extension, facade alterations, boundary wall and landscaping.",
      "planning_decision_residential_external_alteration",
      "architecture_residential_fabric_admin",
      "private residential extensions, facade alteration, boundary and landscaping works"
    ),
    lead(
      "LA04/2023/4316/F",
      [],
      "bfs_arch_round527_wynchurch_road_roof_conversion_extension_approval_2024",
      "47 Wynchurch Road roof-conversion and extension approval was recorded",
      "Official planning-statistics row records approval for a rear/side extension, roof conversion, hipped-to-pitched roof change, extended gable end and rear dormer at 47 Wynchurch Road.",
      "Single-storey rear/side extension, roof conversion, hipped-to-pitched roof change, extended gable end, rear dormer and associated site alterations.",
      "planning_decision_residential_roof_alteration",
      "architecture_residential_fabric_admin",
      "roof conversion, rear dormer, extension and associated site alterations"
    ),
    lead(
      "LA04/2024/0588/F",
      ["LA04/2024/0722/DCA"],
      "bfs_arch_round527_harberton_drive_rear_side_extension_demolition_approval_2024",
      "17 Harberton Drive rear and side extension approvals were recorded",
      "Official planning-statistics rows record approval for demolition of existing garage and rear/side extensions at 17 Harberton Drive, with new rear and side extensions, first-floor side extension, window amendments and door-canopy extension.",
      "Demolition of garage and rear/side extensions, new rear and side extensions, first-floor side extension, window amendments and door-canopy extension.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "private residential garage demolition, rear/side extensions, first-floor extension and window/door-canopy works"
    ),
    lead(
      "LA04/2024/0044/F",
      [],
      "bfs_arch_round527_lower_courtyard_hmo_single_dwelling_dormer_approval_2024",
      "17 Lower Courtyard HMO-to-dwelling dormer approval was recorded",
      "Official planning-statistics row records approval for change of use from HMO to single dwelling at 17 Lower Courtyard, with a rear dormer.",
      "HMO-to-single-dwelling change of use with proposed rear dormer.",
      "planning_decision_residential_conversion",
      "architecture_residential_use_fabric_admin",
      "HMO-to-single-dwelling administrative change with rear dormer"
    ),
    lead(
      "LA04/2023/4380/F",
      [],
      "bfs_arch_round527_weston_drive_new_dwelling_alterations_approval_2024",
      "36 Weston Drive new-dwelling and alteration approval was recorded",
      "Official planning-statistics row records approval for garage demolition, construction of a new two-storey dwelling adjacent to the existing dwelling, and alterations to the existing dwelling at 36 Weston Drive.",
      "Garage demolition, new two-storey dwelling adjacent to existing dwelling, and existing-dwelling alterations including front extension and material change.",
      "planning_decision_residential_development",
      "architecture_residential_development_admin",
      "new adjacent dwelling, garage demolition and existing-dwelling alterations"
    ),
    lead(
      "LA04/2024/1325/LBC",
      [],
      "bfs_arch_round527_donegall_street_emergency_exit_lbc_2024",
      "113-117 Donegall Street emergency-exit listed-building consent was recorded",
      "Official planning-statistics row records listed-building consent for removal of a uPVC window and metal roller shutter to create an emergency exit door with a disabled-access ramp in the rear courtyard at 113-117 Donegall Street.",
      "Listed-building consent for removal of uPVC window and metal roller shutter to create emergency exit door with disabled-access ramp in rear courtyard.",
      "planning_decision_listed_building_consent",
      "architecture_heritage_access_admin",
      "listed-building emergency-exit door and disabled-access ramp works"
    ),
    lead(
      "LA04/2023/4501/F",
      ["LA04/2023/4504/LBC"],
      "bfs_arch_round527_beersbridge_road_listed_house_extension_approval_2024",
      "287a Beersbridge Road listed-house extension approvals were recorded",
      "Official planning-statistics rows record retrospective full permission and listed-building consent for a single-storey living-room extension to the listed house at 287a Beersbridge Road.",
      "Retrospective extension to listed house to provide a single-storey living room.",
      "planning_decision_listed_building_extension",
      "architecture_heritage_residential_admin",
      "retrospective listed-house single-storey extension consent"
    ),
    lead(
      "LA04/2024/1231/DCA",
      [],
      "bfs_arch_round527_broomhill_park_demolition_consent_2024",
      "25 Broomhill Park partial-demolition consent was recorded",
      "Official planning-statistics row records demolition consent at 25 Broomhill Park for entrance-canopy, wall, flat-roof and internal-wall demolition associated with residential alterations.",
      "Demolition of pitched roof and entrance canopy, walls adjacent to windows, rear first-floor bedroom wall, flat roof with skylight and internal walls.",
      "planning_decision_demolition_consent",
      "architecture_residential_demolition_admin",
      "private residential partial-demolition consent for fabric and internal-wall alterations"
    ),
    lead(
      "LA04/2024/0287/F",
      [],
      "bfs_arch_round527_oberon_street_rear_extension_demolition_approval_2024",
      "57 Oberon Street rear-extension approval was recorded",
      "Official planning-statistics row records approval for demolition of an existing rear return and construction of a two-storey rear extension at 57 Oberon Street.",
      "Demolition of existing rear return and construction of two-storey rear extension.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "rear-return demolition and two-storey rear extension"
    ),
    lead(
      "LA04/2024/1454/F",
      [],
      "bfs_arch_round527_candahar_street_hmo_rear_dormer_approval_2024",
      "43 Candahar Street HMO rear-dormer approval was recorded",
      "Official planning-statistics row records approval for a rear dormer to an existing HMO at 43 Candahar Street.",
      "Rear dormer to existing HMO.",
      "planning_decision_hmo_fabric_change",
      "architecture_residential_use_fabric_admin",
      "rear dormer to existing HMO"
    ),
    lead(
      "LA04/2024/1404/F",
      [],
      "bfs_arch_round527_cregagh_road_replacement_extensions_approval_2024",
      "427 Cregagh Road replacement-extension approval was recorded",
      "Official planning-statistics row records approval for demolition of rear and side extensions at 427 Cregagh Road and replacement with single-storey side and two-storey rear extensions.",
      "Demolition of existing rear and side extensions and replacement with single-storey side and two-storey rear extensions.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "rear/side extension demolition and replacement side/rear extensions"
    ),
    lead(
      "LA04/2024/1019/F",
      [],
      "bfs_arch_round527_church_avenue_partial_demolition_extension_approval_2024",
      "19 Church Avenue partial-demolition and extension approval was recorded",
      "Official planning-statistics row records approval for partial rear and side demolition at 19 Church Avenue to facilitate a two-storey rear and side extension and new side entrance.",
      "Partial demolition to rear and side to facilitate two-storey rear and side extension and new side entrance.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "partial rear/side demolition, two-storey rear/side extension and side entrance"
    ),
    lead(
      "LA04/2024/1472/F",
      [],
      "bfs_arch_round527_chichester_park_counselling_facility_change_approval_2025",
      "4 Chichester Park Central counselling-facility approval was recorded",
      "Official planning-statistics row records approval for change of use of an existing detached dwelling at 4 Chichester Park Central to a health and well-being counselling facility, with access and front-boundary alterations.",
      "Detached-dwelling to health and well-being counselling-facility change of use with access, gates and front-boundary-fence alterations.",
      "planning_decision_civic_health_change",
      "architecture_civic_health_admin",
      "dwelling-to-counselling-facility administrative change with access and boundary alterations"
    ),
    lead(
      "LA04/2022/0357/F",
      ["LA04/2022/0370/DCA"],
      "bfs_arch_round527_harberton_drive_store_conversion_extension_approval_2025",
      "3 Harberton Drive extension and store-conversion approvals were recorded",
      "Official planning-statistics rows record approval for a first-floor dressing-room extension and conversion of a ground-floor store to an ensuite at 3 Harberton Drive, with related minor masonry-wall demolition consent.",
      "First-floor dressing-room extension, ground-floor store-to-ensuite conversion, internal refurbishment and related masonry-wall demolition consent.",
      "planning_decision_residential_extension",
      "architecture_residential_fabric_admin",
      "private residential extension, store conversion, refurbishment and related demolition consent"
    ),
    lead(
      "LA04/2025/0056/DCA",
      [],
      "bfs_arch_round527_jennymount_orangery_demolition_consent_2025",
      "Jennymount orangery demolition consent was recorded",
      "Official planning-statistics row records demolition consent at Jennymount, 150 Malone Road, for minimal demolition to the orangery elevation and sectional removal of rear anticlay roof to support extended orangery and roof works.",
      "Minimal orangery-elevation demolition and sectional rear roof removal to make way for extended orangery and roof works.",
      "planning_decision_demolition_consent",
      "architecture_residential_demolition_admin",
      "orangery-elevation and roof-section demolition consent"
    )
  );
}

replaceRound527LeadBlocks();

REJECTED_LEADS.splice(
  0,
  REJECTED_LEADS.length,
  {
    id: "bfs_arch_round527_reject_duplicate_project_rows_through_round519",
    title: "Residual duplicate-project planning rows through the Round519 boundary",
    rejection_category: "duplicate_project_boundary",
    reason:
      "Official point-backed DfI rows for already-covered project families or same-site milestones were retained outside the promoted pack because the manual architecture corpus or official Belfast architecture sweep records through Round519 already cover the same project family.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2022/1458/LBC; APP_ID:LA04/2024/0898/LBC; APP_ID:LA04/2021/1593/F; APP_ID:LA04/2024/0507/F; APP_ID:LA04/2024/0757/LBC; APP_ID:LA04/2021/0316/DCA; APP_ID:LA04/2023/4579/F; APP_ID:LA04/2024/1808/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "Glenwood Primary School",
      "41 High Street",
      "Blanchflower Playing Fields",
      "2 Adelaide Park",
      "99 Upper Newtownards Road",
      "37-39 Wellington Park",
      "70 High Street",
      "15-19 William Street South"
    ]
  },
  {
    id: "bfs_arch_round527_reject_2025_26_quarterly_tables_no_point_rows",
    title: "DfI 2025/26 provisional quarterly planning-statistics tables",
    rejection_category: "no_application_level_point_rows",
    reason:
      "The 2025/26 provisional quarterly publications available by 2026-05-20 provide bulletin/table material rather than the final annual application-level CSV with Easting/Northing used by this point-event contract. They were retained until a final annual 2025/26 dataset with point rows is published.",
    source_record_id:
      "DfI planning activity statistics 2025/26 Q1-Q3 publications checked; no annual application-level CSV ingested for this pack",
    source_url: DFI_2025_26_Q3_URL,
    source_name:
      "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_type: "official provisional quarterly planning-statistics publication",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "2025/26 third quarterly statistical tables",
      "October - December 2025"
    ]
  },
  {
    id: "bfs_arch_round527_reject_harni_hed_status_date_boundary",
    title: "HED Historic Buildings and Heritage at Risk spatial layers",
    rejection_category: "heritage_status_not_promoted_in_this_pack",
    reason:
      "The HED Historic Buildings layer is point-backed but lacks a usable post-2008 event date for a new designation/listing change in this pack. The HED Heritage at Risk layer has Date_Added and point geometry, but post-2008 Belfast rows are register/status records and were retained outside this DfI residual pack to avoid mixing heritage-condition status events with planning-decision events.",
    source_record_id:
      "HED FeatureServer layers 1 and 3 reviewed; examples include Historic Buildings and HARNI Date_Added status rows",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HED Heritage at Risk", "Date_Added", "Historic Buildings"]
  },
  {
    id: "bfs_arch_round527_reject_bcc_pages_page_only_or_license_limited",
    title: "Belfast City Council project and news pages",
    rejection_category: "page_only_or_license_limited",
    reason:
      "Council project/news pages were retained as citation-only leads where they did not expose reusable official point coordinates beyond DfI point rows or where website copyright terms support cautious citation metadata rather than redistribution of page content.",
    source_record_id: "bcc-project-pages-reviewed-round527",
    source_url: BCC_COPYRIGHT_URL,
    source_name: "Belfast City Council copyright and project/news pages",
    publisher: "Belfast City Council",
    source_type: "official council web pages",
    license:
      "Belfast City Council website copyright/terms; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Belfast City Council", "project page", "copyright"]
  },
  {
    id: "bfs_arch_round527_reject_bcc_planning_pages_no_defensible_point",
    title: "Belfast planning-application pages without source-backed point coordinates",
    rejection_category: "page_only_or_geometry_ref_only",
    reason:
      "Official planning/application pages can cite an application but were not promoted when the page did not provide reusable point coordinates, when coordinates would require generic geocoding, or when the page duplicated a DfI row already handled through the planning-statistics CSV.",
    source_record_id: "bcc-planning-application-page-only-leads-reviewed-round527",
    source_url: "https://planningregister.planningsystemni.gov.uk/",
    source_name: "Northern Ireland Planning Portal application pages",
    publisher: "Department for Infrastructure / Belfast City Council planning authority",
    source_type: "official planning application web pages",
    license:
      "Official application-page citation metadata retained; page content and documents require source-specific terms review before redistribution.",
    license_url: DFI_TERMS_URL,
    attribution: "Department for Infrastructure / Belfast City Council planning authority",
    duplicate_terms: [
      "Planning Portal",
      "planning application page",
      "no point coordinates"
    ]
  },
  {
    id: "bfs_arch_round527_reject_lower_priority_minor_domestic_rows",
    title: "Lower-priority minor private domestic alteration rows",
    rejection_category: "not_public_architecture_atlas_priority",
    reason:
      "The residual DfI 2024/25 Belfast rows include many point-backed private-house dormers, roofspace conversions, rear extensions, garages, porches and boundary changes. Rows without substantial fabric, heritage, commercial, civic, multi-unit or public-realm signal were retained outside this next27 pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0482/F; APP_ID:LA04/2024/1237/F; APP_ID:LA04/2024/1818/F; APP_ID:LA04/2024/1847/F; APP_ID:LA04/2024/2036/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "rear dormer",
      "roof space conversion",
      "private domestic",
      "single-storey rear extension"
    ]
  },
  {
    id: "bfs_arch_round527_reject_low_signal_short_let_hmo_rows",
    title: "Lower-signal short-let and HMO-only rows",
    rejection_category: "lower_priority_private_residential_use_change_not_promoted",
    reason:
      "Several residual DfI rows were point-backed and dated but limited to private apartment-to-short-let or dwelling-to-HMO use changes with little or no public/civic, heritage, multi-unit, commercial-frontage or substantial building-fabric signal. They are retained for a possible housing-use pass rather than this architecture next27 pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2023/3687/F; APP_ID:LA04/2023/4209/F; APP_ID:LA04/2024/0981/F; APP_ID:LA04/2024/1872/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["short term let", "HMO", "Sui Generis", "private residential"]
  },
  {
    id: "bfs_arch_round527_reject_signage_equipment_transport_rows",
    title: "Signage, equipment-only, transport and telecom rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Point-backed DfI rows for advertisements, ATM replacement, gas installation, air-conditioning-only works, rooftop PV/EV equipment, bus-stop works, fencing-only works and telecom mast changes were reviewed but not promoted because they do not add a higher-signal building-fabric, use, civic-facility or heritage-works milestone for this pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2022/2147/A; APP_ID:LA04/2023/2797/A; APP_ID:LA04/2023/2836/F; APP_ID:LA04/2023/3387/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "advertisement",
      "ATM",
      "gas installation",
      "telecom",
      "bus stop",
      "PV panels",
      "EV charger",
      "fencing"
    ]
  }
);

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
    if (!/belfast_official_architecture_sweep/i.test(normalized)) continue;
    if (!/candidates\.json$/i.test(normalized)) continue;
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
  const maxSamplePerFile = 220_000;
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
      `tmp/subagents official Belfast architecture sweep candidates through round${DEDUPE_BOUNDARY_ROUND}`
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
    `This records an approved planning/listed-building/demolition/other-consent administrative milestone for ${lead.limitation_topic}; it does not confirm site works started, physical works completed, opening, occupation, operational use, final built form, funding, public access, heritage condition, service delivery or any outcome.`,
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
  const sourceRowRefs = [
    {
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      source_record_id: `APP_ID:${row.ID}`,
      role: "primary"
    },
    ...relatedRows.map((related) => ({
      source_file_name: related.source_file_name,
      source_row_number: related.row_number,
      source_record_id: `APP_ID:${related.ID}`,
      role: "related"
    }))
  ];
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
  const cleanSiteAddress = row.SiteAddress.replace(/\.\s*$/, "");

  return {
    id: lead.event_id,
    event_id: lead.event_id,
    candidate_id: lead.event_id,
    city_id: CITY_ID,
    title: lead.title,
    summary: `${source.publisher}'s ${source.coverage_years} planning-statistics dataset records ${row.Decision_Withdrawal || row.StatusAt31Mar} for ${row.ID} at ${cleanSiteAddress}. Administrative proposal summary: ${lead.admin_proposal_summary}`,
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
    source_row_refs: sourceRowRefs,
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
      `APP_ID and related APP_IDs were absent from the manual architecture corpus and official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND} during this sweep.`
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
      `APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and official Belfast architecture sweep candidate outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the Round527 duplicate scan.`,
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
    source_id: lead.id.replace(/^bfs_arch_round527_reject_/, "round527-reject-"),
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
    "source_row_refs",
    "source_url",
    "source_dataset_url",
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
    "longitude",
    "geometry_source",
    "geometry_precision"
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
      `Expected ${EXPECTED_CANDIDATE_COUNT} promoted next27 candidates, found ${candidates.length}`
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
          `accepted curated residual Belfast planning/statutory-consent rows with official Easting/Northing after manual/corpus/official-sweep duplicate review through Round${DEDUPE_BOUNDARY_ROUND}`
      },
      {
        ...SOURCES.epsg29902,
        accepted_records: candidates.length,
        disposition:
          "used as coordinate-reference provenance for deterministic conversion of source Easting/Northing to WGS84 point coordinates"
      },
      {
        source_id: "dfi-planning-statistics-2025-26-quarterly-reviewed-round527",
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: "Department for Infrastructure, Northern Ireland",
        source_url: DFI_2025_26_Q3_URL,
        source_type: "official provisional quarterly planning-statistics publication",
        license:
          "Open Government Licence v3.0 where applicable to Department for Infrastructure public-sector information; verify release-specific terms before redistribution.",
        license_url: OGL_URL,
        attribution:
          "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0 where applicable.",
        accepted_records: 0,
        disposition:
          "reviewed for current coverage; not promoted because the available 2025/26 quarterly releases are not the final annual application-level CSV with Easting/Northing"
      },
      {
        source_id: "hed-historic-buildings-and-harni-reviewed-round527",
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        source_url: HED_FEATURE_SERVICE_URL,
        layer_urls: [HED_HISTORIC_BUILDINGS_LAYER_URL, HED_HERITAGE_AT_RISK_LAYER_URL],
        source_type: "official ArcGIS feature service",
        license: "Crown copyright / Open Government Licence v3.0 where applicable.",
        license_url: OGL_URL,
        attribution: "Department for Communities Historic Environment Division",
        accepted_records: 0,
        disposition:
          "reviewed; Historic Buildings layer lacks a usable event date for new dated listing/designation changes, while Heritage at Risk Date_Added rows are retained as status/admin leads outside this DfI residual next27 pack"
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
        `Duplicate scan is conservative and text-based over the manual architecture corpus and official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND}; generated web/data atlas outputs are not treated as source-of-truth blockers.`
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
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: "Department for Infrastructure, Northern Ireland",
        reliability:
          "usable for aggregate current context; not usable for this point-event ingestion until the annual application-level dataset is published",
        required_caveat:
          "Quarterly tables should not be treated as point-backed application rows without application IDs, row-level dates and Easting/Northing.",
        ingestion_recommendation:
          "Retain as source audit context and revisit after the final 2025/26 annual application-level dataset is available."
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
        reliability:
          "strong for heritage status/location; usable for dated Heritage at Risk Date_Added administrative records with caveats, but not for physical-change dating",
        required_caveat:
          "Status/listing/register dates are not construction, repair, completion or condition-improvement dates.",
        ingestion_recommendation:
          "Use Historic Buildings records only when a dated designation field exists; use HARNI Date_Added rows only as heritage register/status events and preserve status limitations."
      },
      {
        source_name: "Belfast City Council project/news pages",
        publisher: "Belfast City Council",
        reliability: "usable with caveats",
        required_caveat:
          "Council pages can document official announcements or project updates, but page-only leads must not be promoted without source-backed point geometry and compatible reuse terms.",
        ingestion_recommendation:
          "Use as citation-only context or reject unless a source-backed point/boundary and compatible reuse terms are present."
      }
    ],
    caveats: [
      "All accepted candidates are administrative planning/statutory-consent records, not physical start, completion, opening or occupation evidence.",
      "All accepted candidates are point-backed by official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit CRS parameters.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include duplicate-project consents, 2025/26 quarterly aggregate-only releases, lower-priority fixture/equipment-only changes, lower-signal HMO/short-let-only rows, telecom/transport/street-furniture rows, minor domestic rows, sign/advertisement/display rows, page-only leads and status-only heritage sources.",
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
    accepted_source_row_refs: candidates.flatMap((candidate) => candidate.source_row_refs),
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
    `- Department for Infrastructure planning statistics 2024/25: ${candidates.length} selected Belfast planning, demolition-consent or statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND}.`,
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- Categories include residential conversion and development, residential fabric alteration, listed-building access, heritage residential extension, commercial-estate temporary buildings, civic health change of use, and demolition-consent records.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- DfI 2025/26 provisional quarterly planning-statistics publications were checked as the current DfI planning-statistics coverage available by 2026-05-20, but they were not promoted because this pack requires application-level rows with Easting/Northing.",
    "- DfC/HED layers were checked: Historic Buildings is point-backed but lacks a usable event date for a new designation/listing event in this pack; HARNI Date_Added rows are status/register records and retained outside this DfI residual pack.",
    "- Belfast City Council project/news pages remain citation-only/page-only or license-limited leads unless a source-backed point/boundary and compatible reuse terms are available.",
    "- Minor private domestic rows, short-let/HMO-only rows without substantial fabric or public/commercial signal, signage/display-only rows, equipment-only rows, bus/telecom/street-furniture rows and duplicate same-project rows were retained in rejected.json.",
    "",
    "## Caveats",
    "",
    "- Planning approvals and listed-building/demolition/other consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.",
    "- Source-backed points come from official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84; use as application/site navigation points only.",
    "- No accepted record uses invented coordinates or generic geocoding.",
    "- No causality, prediction, simulation, service-performance, health, education, environmental, economic or heritage-condition impact claim is made.",
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
