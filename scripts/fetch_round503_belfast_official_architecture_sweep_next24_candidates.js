#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round503_belfast_official_architecture_sweep_next24";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round503_belfast_official_architecture_sweep_next24_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const EXPECTED_CANDIDATE_COUNT = 24;
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};
const DEDUPE_BOUNDARY_ROUND = 499;

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
  "Round503 official Belfast architecture sweep next24 after the completed Round499 next23 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning/statutory-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using the EPSG projection parameters and TOWGS84 transform.",
  "Each accepted record is an observed administrative planning or statutory-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Round499 is treated as the latest Belfast official sweep dedupe boundary; official page-only, geometry-ref-only, duplicate-project, status-only, signage-only, rooftop-PV-only and minor domestic leads are retained separately."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round503OfficialArchitectureSweepNext24`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round503",
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
    app_id: "LA04/2023/2745/F",
    event_id: "bfs_arch_round503_milltown_road_petrol_station_extension_approval_2024",
    title: "Milltown Road petrol-station extension and forecourt works were approved",
    observed_change:
      "Official planning-statistics row records approval for an amendment to the Milltown Road Maxol petrol-station scheme, including an extension, forecourt canopy, storage, car-wash and associated petroleum works.",
    admin_proposal_summary:
      "Petrol-station extension and alterations including forecourt canopy, underground tanks, storage, car-wash works, EV charging points and associated site works.",
    event_type: "planning_decision_commercial_extension",
    category: "architecture_commercial_fuel_services_admin",
    limitation_topic: "petrol-station extension, forecourt canopy and associated commercial site works"
  },
  {
    app_id: "LA04/2024/0778/LBC",
    event_id: "bfs_arch_round503_city_hall_cycle_rack_lbc_2024",
    title: "Belfast City Hall cycle-rack replacement consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for removal of wall-mounted cycle racks and replacement with free-standing semi-vertical cycle racks at Belfast City Hall.",
    admin_proposal_summary:
      "Removal of existing wall-mounted cycle racks and replacement with free-standing semi-vertical cycle racks.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_civic_admin",
    limitation_topic: "listed-building cycle-rack replacement at Belfast City Hall"
  },
  {
    app_id: "LA04/2024/1222/F",
    event_id: "bfs_arch_round503_glenties_drive_roof_balcony_alterations_2024",
    title: "Glenties Drive block roof-profile and balcony works were approved",
    observed_change:
      "Official planning-statistics row records approval for changing the roof profile from flat to pitched roof, with balcony amendments and associated works at Blocks 2, 4, 6 and 8 Glenties Drive.",
    admin_proposal_summary:
      "Change of roof profile from flat to pitched roof, balcony amendments and associated works.",
    event_type: "planning_decision_residential_retrofit",
    category: "architecture_residential_retrofit_admin",
    limitation_topic: "residential-block roof-profile and balcony alteration works"
  },
  {
    app_id: "LA04/2024/0473/F",
    event_id: "bfs_arch_round503_chlorine_gardens_apartments_extension_approval_2024",
    title: "7 Chlorine Gardens apartment and rear-extension proposal was approved",
    observed_change:
      "Official planning-statistics row records approval for development of five apartments at 7 Chlorine Gardens, including a rear extension, alterations, landscaping and cycle parking.",
    admin_proposal_summary:
      "Five apartments with two and two-and-a-half-storey rear extension, alterations, landscaping and cycle parking.",
    event_type: "planning_decision_residential_conversion",
    category: "architecture_residential_conversion_admin",
    limitation_topic: "apartment development, rear extension and associated alterations"
  },
  {
    app_id: "LA04/2023/2755/F",
    event_id: "bfs_arch_round503_alexander_road_self_storage_approval_2024",
    title: "Alexander Road self-storage container use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of an existing car park west-south-west of Xtra Space NI, Alexander Road, to a self-storage facility formed from shipping containers.",
    admin_proposal_summary:
      "Change of use from parking to self-storage facility with 20-foot and 10-foot shipping containers.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_storage_admin",
    limitation_topic: "car-park-to-self-storage change of use with container storage"
  },
  {
    app_id: "LA04/2023/3826/LBC",
    event_id: "bfs_arch_round503_upper_newtownards_access_wall_lbc_2024",
    title: "99 Upper Newtownards Road access and wall works consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for alterations and widening of an existing access, with new access, pillars, gates and wall at 99 Upper Newtownards Road.",
    admin_proposal_summary:
      "Alterations and widening of existing access to provide new access with pillars, gates and 1.8m wall.",
    event_type: "planning_decision_listed_building_access_alteration",
    category: "architecture_heritage_access_boundary_admin",
    limitation_topic: "listed-building access, pillars, gates and wall works"
  },
  {
    app_id: "LA04/2024/1161/LBC",
    event_id: "bfs_arch_round503_derryvolgie_avenue_restoration_lbc_2024",
    title: "30 Derryvolgie Avenue restoration and maintenance consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for restoration and maintenance of the Grade 2 listed Victorian property at 30 Derryvolgie Avenue, with no additional building or extension stated.",
    admin_proposal_summary:
      "Restoration and maintenance of Grade 2 listed Victorian property with no additional building or extensions.",
    event_type: "planning_decision_listed_building_repair",
    category: "architecture_heritage_residential_admin",
    limitation_topic: "listed-building restoration and maintenance works"
  },
  {
    app_id: "LA04/2024/0148/F",
    event_id: "bfs_arch_round503_ewart_exterior_awnings_approval_2024",
    title: "The Ewart exterior awning and planter works were approved",
    observed_change:
      "Official planning-statistics row records approval for retractable canvas awnings and planter boxes to the exterior facades of Flame at The Ewart, Bedford Street.",
    admin_proposal_summary:
      "Installation of retractable canvas awnings and planter boxes to exterior facades.",
    event_type: "planning_decision_external_alteration",
    category: "architecture_commercial_facade_admin",
    limitation_topic: "commercial exterior awnings and planter-box facade works"
  },
  {
    app_id: "LA04/2023/3067/F",
    event_id: "bfs_arch_round503_fitzroy_avenue_hmo_apartment_short_stay_approval_2024",
    title: "8 Fitzroy Avenue apartment and short-stay conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from a six-bedroom HMO to one apartment and four short-term-stay apartments at 8 Fitzroy Avenue, including a rear extension, front gabled dormer and internal alterations.",
    admin_proposal_summary:
      "HMO-to-apartment and short-term-stay apartment conversion with three-storey rear extension, front gabled dormer and internal alterations.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_hospitality_residential_admin",
    limitation_topic: "HMO-to-apartment and short-term-stay conversion with rear extension and dormer"
  },
  {
    app_id: "LA04/2024/0061/F",
    event_id: "bfs_arch_round503_lisburn_road_hair_salon_apartments_approval_2024",
    title: "537a Lisburn Road hair-salon-to-apartments conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from first- and second-floor hair salon to three two-bedroom apartments at 537a Lisburn Road, including elevation changes, dormer, chimney-stack removal and roof re-slating.",
    admin_proposal_summary:
      "Hair-salon-to-apartments change of use with elevation changes, second-floor dormer, gable chimney-stack removal, roof re-slating and rear extractor fan.",
    event_type: "planning_decision_residential_conversion",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "hair-salon-to-apartments conversion and associated external alterations"
  },
  {
    app_id: "LA04/2024/1726/LBC",
    event_id: "bfs_arch_round503_university_road_canopy_layout_lbc_2024",
    title: "7 University Road canopy and internal-layout consent was approved",
    observed_change:
      "Official planning-statistics row records retrospective listed-building consent for a rear-elevation canopy and internal-layout changes at 7 University Road.",
    admin_proposal_summary:
      "Retrospective listed-building consent for rear-elevation canopy and internal-layout changes from previously approved listed-building-consent drawings.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_hospitality_admin",
    limitation_topic: "listed-building rear canopy and internal-layout alterations"
  },
  {
    app_id: "LA04/2022/1971/F",
    event_id: "bfs_arch_round503_parkgate_avenue_garage_gymnasium_approval_2024",
    title: "1D Parkgate Avenue garage-to-gymnasium change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use from mechanics garage to gymnasium for small-group training at 1D Parkgate Avenue.",
    admin_proposal_summary:
      "Retrospective change of use from mechanics garage to gymnasium for small-group training.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_leisure_admin",
    limitation_topic: "mechanics-garage-to-gymnasium change of use"
  },
  {
    app_id: "LA04/2024/0803/F",
    event_id: "bfs_arch_round503_rugby_road_service_buildings_approval_2024",
    title: "Rugby Road service-building renovation and extension was approved",
    observed_change:
      "Official planning-statistics row records approval for partial demolition, renovation, new roof, external cladding, internal alterations, two-storey extension, single-storey garage, bicycle store and recycling-facility reconfiguration on land near Rugby Road and College Park.",
    admin_proposal_summary:
      "Partial demolition, renovation, roof and cladding works, two-storey extension, garage, bicycle store, recycling-facility reconfiguration and associated car-parking changes.",
    event_type: "planning_decision_estate_renovation_extension",
    category: "architecture_education_estate_admin",
    limitation_topic: "service-building demolition, renovation, extension and estate-support works"
  },
  {
    app_id: "LA04/2024/1573/F",
    event_id: "bfs_arch_round503_summerhill_barber_healthcare_services_approval_2024",
    title: "17 Summerhill Avenue barber-shop-to-healthcare-services change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from barber shop to an extension of health-care services at 17 Summerhill Avenue.",
    admin_proposal_summary:
      "Change of use from barber shop to extension of health-care services.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_healthcare_commercial_admin",
    limitation_topic: "barber-shop-to-health-care-services change of use"
  },
  {
    app_id: "LA04/2022/0236/F",
    event_id: "bfs_arch_round503_newtownards_road_retail_gym_approval_2025",
    title: "213-223 Newtownards Road retail-to-gym change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for retention of part change of use from retail furniture sales to a gym at 213-223 Newtownards Road.",
    admin_proposal_summary:
      "Retention of part change of use from retail furniture sales to gym.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_leisure_admin",
    limitation_topic: "retail-furniture-sales-to-gym change of use"
  },
  {
    app_id: "LA04/2024/1343/F",
    event_id: "bfs_arch_round503_victoria_square_retail_restaurant_approval_2025",
    title: "Victoria Square retail-unit amalgamation and restaurant use was approved",
    observed_change:
      "Official planning-statistics row records approval for amalgamation of Victoria Square units UG30 and UG31 and change of use from retail unit to restaurant at ground and first-floor units.",
    admin_proposal_summary:
      "Amalgamation of retail units and change of use from retail to restaurant at ground and first-floor units.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_mixed_use_retail_hospitality_admin",
    limitation_topic: "retail-unit amalgamation and retail-to-restaurant change of use"
  },
  {
    app_id: "LA04/2024/1649/F",
    event_id: "bfs_arch_round503_arc_cafe_subdivision_approval_2025",
    title: "The Arc cafe subdivision was approved",
    observed_change:
      "Official planning-statistics row records approval for subdivision of an existing cafe at Block E, The Arc, Abercorn Basin, to create a new food-and-drink unit.",
    admin_proposal_summary:
      "Subdivision of existing cafe to create a new cafe/food-and-drink unit for consumption on the premises.",
    event_type: "planning_decision_commercial_subdivision",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "cafe subdivision and new food-and-drink unit"
  },
  {
    app_id: "LA04/2024/1382/LBC",
    event_id: "bfs_arch_round503_university_street_guest_accommodation_lbc_2025",
    title: "51 University Street guest-accommodation consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for change of use from dwelling to guest accommodation at 51 University Street, with a two-storey rear extension and internal alterations.",
    admin_proposal_summary:
      "Dwelling-to-guest-accommodation change of use with two-storey rear extension and internal alterations.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_hospitality_admin",
    limitation_topic: "listed-building dwelling-to-guest-accommodation conversion with rear extension"
  },
  {
    app_id: "LA04/2024/1622/F",
    event_id: "bfs_arch_round503_cliftonville_bar_off_sales_shopfront_approval_2025",
    title: "McGrath's Bar off-sales shopfront change was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from pool room to new off-sales area and a new shopfront at McGrath's Bar, Cliftonville Road.",
    admin_proposal_summary:
      "Change of use from pool room to off-sales area with new shopfront.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "pool-room-to-off-sales change of use and shopfront works"
  },
  {
    app_id: "LA04/2024/0816/LBC",
    related_app_ids: ["LA04/2024/0815/F"],
    event_id: "bfs_arch_round503_donegall_place_bank_shopfront_lbc_2025",
    title: "36-38 Donegall Place bank and shopfront works consent was approved",
    observed_change:
      "Official planning-statistics rows record listed-building consent and full permission for retail-to-bank change of use, internal alterations, shopfront alterations and a new ATM at 36-38 Donegall Place.",
    admin_proposal_summary:
      "Retail-to-bank change of use with internal alterations, shopfront alterations and new ATM.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building retail-to-bank change of use, shopfront alterations and ATM works"
  },
  {
    app_id: "LA04/2024/1130/F",
    event_id: "bfs_arch_round503_duncairn_gardens_hmo_extension_approval_2025",
    title: "94 Duncairn Gardens apartment-to-HMO works were approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from two residential apartments to a six-bedroom HMO at 94 Duncairn Gardens, with second-floor rear extension, front bay extension, dormer windows, bike storage and site works.",
    admin_proposal_summary:
      "Apartment-to-HMO change of use with rear extension, front bay extension, front and rear dormers, external bike storage and site works.",
    event_type: "planning_decision_residential_conversion",
    category: "architecture_residential_hmo_admin",
    limitation_topic: "apartment-to-HMO conversion with rear extension, bay extension and dormers"
  },
  {
    app_id: "LA04/2024/1440/F",
    event_id: "bfs_arch_round503_ravenhill_road_offices_short_let_approval_2025",
    title: "138-140 Ravenhill Road office-to-short-term-let change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of the first floor from offices to short-term let at 138-140 Ravenhill Road, with use of the rear flat roof as an open terrace.",
    admin_proposal_summary:
      "First-floor office-to-short-term-let change of use with rear flat-roof terrace use.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_residential_admin",
    limitation_topic: "office-to-short-term-let change of use and rear roof-terrace use"
  },
  {
    app_id: "LA04/2024/1300/F",
    event_id: "bfs_arch_round503_ormeau_road_retail_apartments_approval_2025",
    title: "297 Ormeau Road retail-to-apartments conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from existing retail to three two-bedroom apartments at 297 Ormeau Road, including a three-storey rear extension.",
    admin_proposal_summary:
      "Retail-to-three-apartments change of use with three-storey rear extension.",
    event_type: "planning_decision_residential_conversion",
    category: "architecture_residential_commercial_admin",
    limitation_topic: "retail-to-apartments conversion with rear extension"
  },
  {
    app_id: "LA04/2023/3220/F",
    event_id: "bfs_arch_round503_glen_road_retail_apartment_extension_approval_2025",
    title: "9 Glen Road dwelling-to-retail/apartment conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for a two-storey rear extension to facilitate change of use from dwelling to a ground-floor retail unit and first-floor apartment at 9 Glen Road.",
    admin_proposal_summary:
      "Two-storey rear extension to facilitate dwelling-to-ground-floor-retail and first-floor-apartment change of use.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_mixed_use_residential_retail_admin",
    limitation_topic: "dwelling-to-retail/apartment conversion with two-storey rear extension"
  }
];

const ROUND503_UNUSED_PRIOR_TEMPLATE_PLANNING_LEADS = [
  {
    app_id: "LA04/2023/3400/F",
    related_app_ids: ["LA04/2023/3409/LBC"],
    event_id: "bfs_arch_round503_malone_road_offices_guest_accommodation_approval_2024",
    title: "49-51 Malone Road office-to-guest-accommodation works were approved",
    observed_change:
      "Official planning-statistics rows record full permission and listed-building consent for alterations to 49-51 Malone Road to facilitate change of use from offices to guest accommodation, including a lift and front-boundary railings.",
    admin_proposal_summary:
      "Alterations to facilitate office-to-guest-accommodation change of use, with lift installation and front-boundary railings.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_heritage_hospitality_admin",
    limitation_topic: "office-to-guest-accommodation change of use and associated alterations"
  },
  {
    app_id: "LA04/2023/3061/F",
    event_id: "bfs_arch_round503_ormeau_road_cafe_restaurant_apartments_approval_2024",
    title: "305 Ormeau Road cafe/restaurant and apartment proposal was approved",
    observed_change:
      "Official planning-statistics row records approval for ground-floor cafe/restaurant use and four one-bedroom apartments on the first and second floors at 305 Ormeau Road and 1A Ava Avenue.",
    admin_proposal_summary:
      "Ground-floor cafe/restaurant use with four one-bedroom apartments on upper floors and associated bin storage.",
    event_type: "planning_decision_mixed_use_change",
    category: "architecture_mixed_use_residential_commercial_admin",
    limitation_topic: "ground-floor cafe/restaurant use and upper-floor apartments"
  },
  {
    app_id: "LA04/2024/0951/LBC",
    related_app_ids: ["LA04/2024/0950/F"],
    event_id: "bfs_arch_round503_high_street_storage_beauty_salon_lbc_2024",
    title: "43 High Street storage-to-beauty-salon consent was approved",
    observed_change:
      "Official planning-statistics rows record listed-building consent and full permission for change of use of a first-floor storage area to a beauty/hair salon at 43 High Street.",
    admin_proposal_summary:
      "Change of use of first-floor storage area to beauty/hair salon, with no external alterations stated in the source row.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "first-floor storage-to-beauty/hair-salon change of use"
  },
  {
    app_id: "LA04/2023/4315/F",
    event_id: "bfs_arch_round503_cavehill_road_takeaway_veterinary_practice_approval_2024",
    title: "128-130 Cavehill Road takeaway-to-veterinary-practice change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from hot-food takeaway to a veterinary practice at 128-130 Cavehill Road.",
    admin_proposal_summary:
      "Change of use from hot-food takeaway to veterinary practice.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_healthcare_admin",
    limitation_topic: "hot-food-takeaway-to-veterinary-practice change of use"
  },
  {
    app_id: "LA04/2023/4549/F",
    event_id: "bfs_arch_round503_holy_rosary_primary_school_extensions_approval_2024",
    title: "Holy Rosary Primary School extensions were approved",
    observed_change:
      "Official planning-statistics row records approval for ground-floor extensions to east and west elevations and first-floor extensions to north elevations at Holy Rosary Primary School.",
    admin_proposal_summary:
      "Ground-floor extensions to east and west elevations and first-floor extensions to north elevations.",
    event_type: "planning_decision_school_extension",
    category: "architecture_education_admin",
    limitation_topic: "primary-school ground-floor and first-floor extensions"
  },
  {
    app_id: "LA04/2024/1186/LBC",
    event_id: "bfs_arch_round503_donegall_square_north_branch_internal_lbc_2024",
    title: "10-15 Donegall Square North internal branch alterations consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for internal branch-layout alterations at 10-15 Donegall Square North, including internal manifestations, partitions and furniture replacement.",
    admin_proposal_summary:
      "Internal alterations including internal manifestations, non-load-bearing partitions, furniture replacement and secure partitioning.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building internal branch-layout alterations"
  },
  {
    app_id: "LA04/2024/0713/F",
    event_id: "bfs_arch_round503_linenhall_exchange_medical_services_approval_2024",
    title: "Linenhall Exchange office-to-medical-services change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use of ground-floor accommodation from offices to a medical services centre at Linenhall Exchange, 26 Linenhall Street.",
    admin_proposal_summary:
      "Change of use of ground-floor accommodation from offices to medical services centre.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_healthcare_commercial_admin",
    limitation_topic: "office-to-medical-services-centre change of use"
  },
  {
    app_id: "LA04/2024/0758/LBC",
    related_app_ids: ["LA04/2024/0798/LBC"],
    event_id: "bfs_arch_round503_ewart_bedford_street_partition_ceiling_lbc_2024",
    title: "The Ewart partition and ceiling consents were approved",
    observed_change:
      "Official planning-statistics rows record listed-building consent for removal of non-original suspended ceiling, raised-access-floor and stud-wall portions and construction of partition stud walls, screens and ceilings at The Ewart, Bedford Street.",
    admin_proposal_summary:
      "Removal of portions of non-original suspended ceiling, raised access floor and stud walls, with partition stud walls, screens and ceilings.",
    event_type: "planning_decision_listed_building_alterations",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building partition, screen and ceiling alterations"
  },
  {
    app_id: "LA04/2024/1230/LBC",
    event_id: "bfs_arch_round503_clarence_chambers_basement_doors_windows_lbc_2024",
    title: "Clarence Chambers basement and door/window consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for basement-level internal reconfiguration and external door and window refurbishment at Clarence Chambers, 18-19 Donegall Square East.",
    admin_proposal_summary:
      "Minor basement-level internal reconfiguration and refurbishment of external doors and windows.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building basement reconfiguration and external door/window refurbishment"
  },
  {
    app_id: "LA04/2024/0710/F",
    event_id: "bfs_arch_round503_agincourt_avenue_hmo_bed_breakfast_approval_2024",
    title: "48 Agincourt Avenue HMO-to-bed-and-breakfast change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from a house in multiple occupation to bed and breakfast at 48 Agincourt Avenue.",
    admin_proposal_summary:
      "Change of use from House in Multiple Occupation to Bed and Breakfast.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_residential_admin",
    limitation_topic: "HMO-to-bed-and-breakfast change of use"
  },
  {
    app_id: "LA04/2024/0352/F",
    event_id: "bfs_arch_round503_antrim_road_beauty_salon_extension_approval_2024",
    title: "545 Antrim Road beauty-salon extension was approved",
    observed_change:
      "Official planning-statistics row records approval for a single-storey extension to the existing beauty salon at Face Therapy NI, 545 Antrim Road.",
    admin_proposal_summary:
      "Single-storey extension to existing beauty salon.",
    event_type: "planning_decision_commercial_extension",
    category: "architecture_commercial_admin",
    limitation_topic: "beauty-salon single-storey extension"
  },
  {
    app_id: "LA04/2024/1040/F",
    event_id: "bfs_arch_round503_ballynafeigh_orange_hall_air_conditioning_approval_2024",
    title: "Ballynafeigh Orange Hall air-conditioning unit replacement was approved",
    observed_change:
      "Official planning-statistics row records approval for removal and replacement of rooftop outdoor air-conditioning units and internal air-conditioning evaporator units at Ballynafeigh Orange Hall.",
    admin_proposal_summary:
      "Removal and replacement of rooftop outdoor air-conditioning units and internal air-conditioning evaporator units.",
    event_type: "planning_decision_building_services_alteration",
    category: "architecture_civic_admin",
    limitation_topic: "Orange Hall air-conditioning unit replacement"
  },
  {
    app_id: "LA04/2024/1041/LBC",
    event_id: "bfs_arch_round503_ulster_reform_club_safety_guarding_lbc_2024",
    title: "Ulster Reform Club safety-guarding consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for new safety guarding to the Minstrels Gallery and alteration to the ground-floor handrail on an existing staircase at Ulster Reform Club, Royal Avenue.",
    admin_proposal_summary:
      "New safety guarding to Minstrels Gallery and alteration to ground-floor handrail on existing staircase.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_civic_admin",
    limitation_topic: "listed-building safety guarding and stair-handrail alteration"
  },
  {
    app_id: "LA04/2024/0629/F",
    related_app_ids: ["LA04/2024/0631/DCA"],
    event_id: "bfs_arch_round503_arthur_place_entrance_elevation_approval_2024",
    title: "2 Arthur Place entrance-elevation works were approved",
    observed_change:
      "Official planning-statistics rows record approval and demolition consent for removal of the existing entrance canopy and tiles and provision of new windows, tiling and wall-mounted lighting at ground-floor level of 2 Arthur Place.",
    admin_proposal_summary:
      "Removal of existing entrance canopy and tiles, with new windows, tiling and wall-mounted lighting to entrance elevation.",
    event_type: "planning_decision_external_alteration",
    category: "architecture_commercial_admin",
    limitation_topic: "commercial entrance-elevation alteration and associated demolition consent"
  },
  {
    app_id: "LA04/2024/0738/F",
    event_id: "bfs_arch_round503_chichester_street_roof_plant_office_fitout_approval_2024",
    title: "43-63 Chichester Street roof plant for office fit-out was approved",
    observed_change:
      "Official planning-statistics row records approval for additional roof plant to support office fit-out of levels 7 and 8 and new wi-fi access points on the level 8 terrace at 43-63 Chichester Street.",
    admin_proposal_summary:
      "Additional roof plant to support new office fit-out of levels 7 and 8, with wi-fi access points on level 8 terrace.",
    event_type: "planning_decision_building_services_alteration",
    category: "architecture_commercial_admin",
    limitation_topic: "office-fit-out roof plant and terrace wi-fi access points"
  },
  {
    app_id: "LA04/2024/1265/LBC",
    event_id: "bfs_arch_round503_victoria_street_suite_internal_refurb_lbc_2024",
    title: "34-38 Victoria Street suite internal refurbishment consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for internal refurbishment of suite 2 at 34-38 Victoria Street, including a new bathroom, removal of cabinetry and door alterations.",
    admin_proposal_summary:
      "Internal refurbishment of suite 2 including new bathroom, removal of cabinetry and alterations to door.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_commercial_admin",
    limitation_topic: "listed-building internal suite refurbishment"
  },
  {
    app_id: "LA04/2024/1173/F",
    event_id: "bfs_arch_round503_fitzroy_court_wardens_house_flats_approval_2024",
    title: "Fitzroy Court warden's house conversion to flats was approved",
    observed_change:
      "Official planning-statistics row records approval for conversion and remodelling of an existing two-storey warden's house into two flats to provide additional sheltered-housing accommodation at Fitzroy Court, Fitzroy Avenue.",
    admin_proposal_summary:
      "Conversion and remodelling of existing two-storey warden's house into two flats for additional sheltered-housing accommodation.",
    event_type: "planning_decision_residential_conversion",
    category: "architecture_residential_civic_admin",
    limitation_topic: "warden's-house conversion and remodelling into sheltered-housing flats"
  },
  {
    app_id: "LA04/2024/0255/F",
    event_id: "bfs_arch_round503_osborne_park_care_home_modifications_approval_2024",
    title: "69 Osborne Park care-home modifications were approved",
    observed_change:
      "Official planning-statistics row records approval to retain internal and external modifications to a care home at 69 Osborne Park, including internal reconfiguration, porch replacement, retaining-wall redirection, ground-level alterations and landscaping.",
    admin_proposal_summary:
      "Retention of internal and external care-home modifications, porch replacement, retaining-wall redirection, ground-level alterations and landscaping.",
    event_type: "planning_decision_care_home_alterations",
    category: "architecture_healthcare_civic_admin",
    limitation_topic: "care-home internal and external modifications"
  },
  {
    app_id: "LA04/2024/1299/F",
    event_id: "bfs_arch_round503_queens_elms_storage_building_extension_approval_2024",
    title: "Queen's Elms storage-building extension was approved",
    observed_change:
      "Official planning-statistics row records approval for a single-storey extension to an existing storage building off Sycamore Park, related to Queen's Elms village accommodation.",
    admin_proposal_summary:
      "Single-storey extension to existing storage building and associated site works for furniture and fixture storage related to Queen's Elms village accommodation.",
    event_type: "planning_decision_building_extension",
    category: "architecture_student_accommodation_admin",
    limitation_topic: "student-accommodation storage-building extension and associated site works"
  },
  {
    app_id: "LA04/2023/2779/F",
    event_id: "bfs_arch_round503_stranmillis_road_beauty_salon_short_stay_apartments_approval_2024",
    title: "141 Stranmillis Road beauty-salon-to-short-stay-apartments change of use was approved",
    observed_change:
      "Official planning-statistics row records approval for change of use from first- and second-floor beauty salon to two short-term-stay managed apartments at 141 Stranmillis Road, including a new external stairway, rear fenestration changes and internal alterations.",
    admin_proposal_summary:
      "Change of use from first- and second-floor beauty salon to two short-term-stay managed apartments, with external stairway, rear fenestration changes and internal alterations.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_hospitality_commercial_admin",
    limitation_topic: "beauty-salon-to-short-term-stay-apartment change of use and alterations"
  },
  {
    app_id: "LA04/2024/1444/LBC",
    event_id: "bfs_arch_round503_parliament_buildings_roof_parapet_lbc_2024",
    title: "Parliament Buildings roof and parapet consent was approved",
    observed_change:
      "Official planning-statistics row records listed-building consent for removal and reinstatement of mechanical and electrical equipment and solar arrays, replacement of roof and Portland stone parapets, lead capping, protection rail and reinstatement of lightning conductors and cameras at Parliament Buildings, Stormont Estate.",
    admin_proposal_summary:
      "Removal/reinstatement of mechanical and electrical equipment and solar arrays, replacement of roof and Portland stone parapets, lead capping and reinstatement of lightning conductors and cameras.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_public_estate_admin",
    limitation_topic: "listed-building roof, parapet, M&E and protection-rail works"
  },
  {
    app_id: "LA04/2024/1539/F",
    event_id: "bfs_arch_round503_all_saints_college_mobile_classrooms_approval_2024",
    title: "All Saints College mobile teaching-classroom unit was approved",
    observed_change:
      "Official planning-statistics row records approval for one mobile unit with two teaching classrooms at All Saints College, Glen Road.",
    admin_proposal_summary:
      "One mobile unit with two teaching classrooms.",
    event_type: "planning_decision_school_modular_unit",
    category: "architecture_education_admin",
    limitation_topic: "school mobile teaching-classroom unit"
  },
  {
    app_id: "LA04/2022/2198/F",
    event_id: "bfs_arch_round503_strand_studios_office_community_cultural_use_approval_2024",
    title: "Strand Studios office-to-community/cultural change of use was approved",
    observed_change:
      "Official planning-statistics row records retrospective approval for change of use from office accommodation to Class D1 community and cultural uses at Ground Floor Studio 1, Strand Studios, 150 Holywood Road.",
    admin_proposal_summary:
      "Retrospective change of use from office accommodation to Class D1 community and cultural uses.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_cultural_civic_admin",
    limitation_topic: "office-accommodation-to-community/cultural-use change of use"
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round503_reject_duplicate_project_rows_through_round499",
    title: "Residual duplicate-project planning rows through the Round499 boundary",
    rejection_category: "duplicate_project_boundary",
    reason:
      "Official point-backed DfI rows for Crumlin Road Gaol, Glenwood Primary School, 70 High Street and 15-19 William Street South were retained outside the promoted pack because prior manual or Belfast sweep records through Round499 already cover the same project family or same-site milestone.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0438/F; APP_ID:LA04/2022/1458/LBC; APP_ID:LA04/2023/4579/F; APP_ID:LA04/2024/1808/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "Crumlin Road Gaol",
      "Glenwood Primary School",
      "70 High Street",
      "15-19 William Street South",
      "LA04/2022/1458/LBC"
    ]
  },
  {
    id: "bfs_arch_round503_reject_minor_private_domestic_rows",
    title: "Minor private domestic alteration rows",
    rejection_category: "not_public_architecture_atlas_priority",
    reason:
      "The residual DfI 2024/25 Belfast rows include many point-backed private-house dormers, roofspace conversions, rear extensions, garages, porches and boundary changes. These were not promoted because this next24 pack prioritizes public, civic, commercial, heritage, multi-unit or mixed-use architecture-administrative milestones.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/1578/F; APP_ID:LA04/2024/1767/F; APP_ID:LA04/2024/2036/F; APP_ID:LA04/2024/2118/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
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
      "single storey rear extension"
    ]
  },
  {
    id: "bfs_arch_round503_reject_signage_advertisement_display_rows",
    title: "Signage, advertisement and display planning rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Point-backed DfI rows for building plaques, community-centre signs, digital display panels, fascia signage and similar display consents were reviewed but not promoted because they do not add a higher-signal building-fabric, use, civic-facility or heritage-works milestone for this pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/1656/A; APP_ID:LA04/2024/1826/A; APP_ID:LA04/2024/1946/A; APP_ID:LA04/2024/0726/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["building plaque", "community centre sign", "digital screen", "fascia"]
  },
  {
    id: "bfs_arch_round503_reject_rooftop_pv_ev_equipment_only_rows",
    title: "Rooftop PV, EV and equipment-only planning rows",
    rejection_category: "lower_priority_fixture_or_services_change_not_promoted",
    reason:
      "Official point-backed rows for rooftop solar/PV arrays, EV charger relocation and similar equipment-only works were retained separately because this pack is not an energy-equipment or building-services fixture sweep.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0696/F; APP_ID:LA04/2024/0699/F; APP_ID:LA04/2024/1496/F; APP_ID:LA04/2025/0079/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["photovoltaic", "PV panels", "EV charger", "rooftop solar"]
  },
  {
    id: "bfs_arch_round503_reject_low_signal_hmo_short_let_rows",
    title: "Lower-signal HMO and short-let-only rows",
    rejection_category: "lower_priority_private_residential_use_change_not_promoted",
    reason:
      "Several residual DfI rows were point-backed and dated but were limited to private HMO or short-let use changes with little or no public/civic, heritage, multi-unit, commercial-frontage or substantial building-fabric signal. They are retained for a possible housing-use pass rather than this architecture next24 pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0524/F; APP_ID:LA04/2024/1106/F; APP_ID:LA04/2024/1627/F; APP_ID:LA04/2024/0392/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
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
    id: "bfs_arch_round503_reject_transport_shelter_buildout_rows",
    title: "Bus shelter and bus-stop buildout planning rows",
    rejection_category: "street_furniture_not_architecture_core",
    reason:
      "DfI planning-statistics rows for a bus shelter with advertisement panel and a bus-stop pavement buildout are official and point-backed, but they were retained outside this pack because they are street-furniture/highway-management records rather than architecture or building-change milestones.",
    source_record_id:
      "APP_ID:LA04/2024/0422/F; APP_ID:LA04/2024/1087/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["bus shelter", "bus stop", "pavement buildout", "Grosvenor Road"]
  },
  {
    id: "bfs_arch_round503_reject_harni_hed_status_only_no_new_physical_change",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_status_only",
    reason:
      "HED spatial layers remain strong for official heritage status and location, but the reviewed status/listing/visit fields do not by themselves document a new dated architecture-change milestone under the point-event contract.",
    source_record_id: "HED GIS feature service reviewed in Round503",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round503_reject_bcc_project_pages_page_only_or_copyright_limited",
    title: "Belfast City Council project and news pages",
    rejection_category: "page_only_or_license_limited",
    reason:
      "Council project/news pages were retained as citation-only leads where they did not expose a reusable official point coordinate beyond DfI point rows or where website copyright terms support cautious citation metadata rather than redistribution of page content.",
    source_record_id: "bcc-project-pages-reviewed-round503",
    source_url: BCC_COPYRIGHT_URL,
    source_name: "Belfast City Council copyright and project/news pages",
    publisher: "Belfast City Council",
    source_type: "official council web pages",
    license: "Belfast City Council website copyright/terms; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Belfast City Council", "project page", "Assembly Rooms"]
  },
  {
    id: "bfs_arch_round503_reject_niwater_route_pages_geometry_ref_only",
    title: "Northern Ireland Water route/area works pages",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "Official NI Water works pages can document route or area works, but reviewed leads did not expose a reusable official point coordinate or point-level source row for this point-backed architecture pack.",
    source_record_id: "niwater-project-pages-reviewed-round503",
    source_url: NIW_TERMS_URL,
    source_name: "Northern Ireland Water project/news pages",
    publisher: "Northern Ireland Water",
    source_type: "official utility project/news pages",
    license: "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["NI Water", "route works", "sewer", "geometry-ref"]
  }
];

const ROUND503_UNUSED_PRIOR_TEMPLATE_REJECTED_LEADS = [
  {
    id: "bfs_arch_round503_reject_crumlin_road_gaol_section54_condition_variation",
    title: "Crumlin Road Gaol A Wing Section 54 condition-variation row",
    rejection_category: "condition_variation_not_promoted",
    reason:
      "The DfI row is official and point-backed, but it varies parking, access and management-plan conditions on an earlier A Wing distillery/tourist-centre approval rather than documenting a new standalone point-event milestone for this pack.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/0438/F; RELATED_PRIOR_APP_ID:LA04/2019/2756/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:6851",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/0438/F", "LA04/2019/2756/F", "Crumlin Road Gaol", "A Wing"]
  },
  {
    id: "bfs_arch_round503_reject_rooftop_pv_only_rows_not_promoted",
    title: "Commercial rooftop-PV-only planning rows",
    rejection_category: "lower_priority_fixture_or_services_change_not_promoted",
    reason:
      "Several DfI rows are official and point-backed but concern rooftop solar/PV equipment only. They are retained outside this public architecture next24 pack unless a later spec targets building-services fixtures or energy-equipment records.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/0696/F; APP_ID:LA04/2024/0699/F; APP_ID:LA04/2024/0695/F; APP_ID:LA04/2024/1496/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["rooftop PV", "solar panels", "LA04/2024/0696/F", "LA04/2024/0699/F", "LA04/2024/1496/F"]
  },
  {
    id: "bfs_arch_round503_reject_signage_advertisement_and_display_rows",
    title: "Signage, advertisement and display planning rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Point-backed DfI rows for signs, advertisements, display screens, vinyl graphics and building plaques were reviewed but not promoted because this pack prioritizes planning/statutory-consent records for building fabric, use, public/civic facilities and heritage works.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0996/A; APP_ID:LA04/2024/1656/A; APP_ID:LA04/2024/1963/LBC; APP_ID:LA04/2024/1997/A; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["vinyl installation", "building plaque", "shop signs", "Krispy Kreme signs"]
  },
  {
    id: "bfs_arch_round503_reject_minor_domestic_rows_not_public_architecture",
    title: "Minor private domestic extension and demolition rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "The DfI CSV includes many point-backed domestic extensions, dormers, internal demolitions, roof-profile changes, boundary changes and private-house access works. These are retained outside this public architecture next24 pack unless a later spec explicitly targets parcel-level domestic alterations.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/1095/DCA; APP_ID:LA04/2024/0884/F; APP_ID:LA04/2024/0464/DCA; APP_ID:LA04/2024/1402/DCA; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["domestic extension", "private domestic", "internal demolitions", "rear elevation wall"]
  },
  {
    id: "bfs_arch_round503_reject_malone_road_residential_home_duplicate_lbc",
    title: "3-5 Malone Road residential-home alteration full-permission row",
    rejection_category: "duplicate_project_boundary",
    reason:
      "The full-permission DfI row is official and point-backed, but the same 3-5 Malone Road residential-home alteration project is already present in the manual architecture corpus through related listed-building consent LA04/2023/4523/LBC, so this row is retained outside the promoted set.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2023/4574/F; RELATED_PRIOR_APP_ID:LA04/2023/4523/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:5115",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2023/4574/F", "LA04/2023/4523/LBC", "3-5 Malone Road", "43 bed residential home"]
  },
  {
    id: "bfs_arch_round503_reject_high_street_coffee_bakery_duplicate_lbc",
    title: "70 High Street retail-to-coffee-shop full-permission row",
    rejection_category: "duplicate_project_boundary",
    reason:
      "The full-permission DfI row is official and point-backed, but a related listed-building consent row for the same 70 High Street retail-to-coffee-shop and bakery frontage project is already present in prior Belfast architecture material, so this row is retained outside the promoted set.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2023/4579/F; RELATED_PRIOR_APP_ID:LA04/2023/4550/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:5167",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2023/4579/F", "LA04/2023/4550/LBC", "70 High Street", "retail to coffee shop & bakery"]
  },
  {
    id: "bfs_arch_round503_reject_william_street_south_fire_escape_duplicate_site",
    title: "15-19 William Street South external fire-escape-door rows",
    rejection_category: "duplicate_project_boundary",
    reason:
      "The listed-building and full-permission rows are official and point-backed, but 15-19 William Street South already has a prior accepted same-site retail subdivision/shopfront event through Round499, so the fire-escape-door rows are retained separately for later same-site sequencing review.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2024/1808/LBC; APP_ID:LA04/2024/1817/F; RELATED_PRIOR_APP_ID:LA04/2024/1362/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:13356; ROW:13358",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2024/1808/LBC", "LA04/2024/1817/F", "15-19 William Street South", "LA04/2024/1362/F"]
  },
  {
    id: "bfs_arch_round503_reject_glenwood_primary_school_duplicate_prior_corpus",
    title: "Glenwood Primary School listed-building-consent row",
    rejection_category: "duplicate_project_boundary",
    reason:
      "The DfI listed-building-consent row is official and point-backed, but the Glenwood Primary School refurbishment/extension approval and later construction-start milestone already appear in the Belfast architecture corpus, so this row is retained outside the promoted set.",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    source_record_id:
      "APP_ID:LA04/2022/1458/LBC; RELATED_PRIOR_APP_ID:LA04/2022/1206/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv; ROW:1083",
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["LA04/2022/1458/LBC", "LA04/2022/1206/F", "Glenwood Primary School"]
  },
  {
    id: "bfs_arch_round503_reject_harni_hed_status_only_no_new_physical_change",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_status_only",
    reason:
      "HED spatial layers are strong for official heritage status and location, but status/listing/visit dates do not document a new physical architecture-change milestone under the current point-event contract.",
    source_url: HED_FEATURE_SERVICE_URL,
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS feature service reviewed in Round503",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round503_reject_bcc_project_pages_page_only_or_copyright_limited",
    title: "Belfast City Council project and news pages",
    rejection_category: "page_only_or_license_limited",
    reason:
      "Council project/news pages were checked as official leads, but the reviewed pages did not add a new reusable source point beyond the DfI point rows or had website copyright terms that require citation-only treatment rather than redistribution of page content.",
    source_url: BCC_COPYRIGHT_URL,
    source_name: "Belfast City Council copyright and project/news pages",
    publisher: "Belfast City Council",
    source_type: "official council web pages",
    source_record_id: "bcc-project-pages-reviewed-round503",
    license:
      "Belfast City Council website copyright/terms; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Belfast City Council", "Assembly Rooms", "project page"]
  },
  {
    id: "bfs_arch_round503_reject_niwater_route_pages_geometry_ref_only",
    title: "Northern Ireland Water route/area works pages",
    rejection_category: "geometry_ref_only_not_point_ready",
    reason:
      "Official NI Water works pages can document route or area works, but the reviewed leads did not expose a reusable official point coordinate or point-level source row for this point-event candidate pack.",
    source_url: NIW_TERMS_URL,
    source_name: "Northern Ireland Water project/news pages",
    publisher: "Northern Ireland Water",
    source_type: "official utility project/news pages",
    source_record_id: "niwater-project-pages-reviewed-round503",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["NI Water", "Shore Road", "sewer relining"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round499 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus prior tmp Belfast candidates through round499",
  "source review: DfI planning activity statistics and 2024/25 annual dataset",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED ArcGIS feature service status-only rows",
  "source review: Belfast City Council official project/news pages and website copyright terms",
  "source review: NI Water official page geometry-ref-only utility leads",
  "source review: DfI point-backed signage, display, rooftop-PV/EV-only, duplicate-project, HMO/short-let-only, bus-shelter and minor domestic rows retained outside promoted pack"
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
      `APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and prior accepted Belfast candidate outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the Round503 duplicate scan.`,
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
    source_id: lead.id.replace(/^bfs_arch_round503_reject_/, "round503-reject-"),
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
      `Expected ${EXPECTED_CANDIDATE_COUNT} promoted next24 candidates, found ${candidates.length}`
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
      "Rejected official pages and rows include duplicate-project consents, lower-priority fixture or rooftop-PV/EV-only changes, lower-signal HMO/short-let-only rows, bus-shelter/street-furniture rows, minor domestic rows, sign/advertisement/display rows, page-only leads, geometry-ref-only route/area leads and status-only heritage sources.",
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
    "- Department for Infrastructure planning statistics 2024/25: 24 selected Belfast planning/statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or prior accepted Belfast candidate packs through Round499.",
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- Categories include listed-building consents, heritage/civic and heritage/residential works, commercial and leisure change-of-use rows, multi-unit residential conversions, mixed-use retail/apartment records, estate-support renovation and commercial facade/forecourt works.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- Crumlin Road Gaol Section 54, 70 High Street, 15-19 William Street South and Glenwood Primary School DfI rows were retained outside the promoted pack because they are condition-variation or duplicate-project/same-site review material against the corpus through Round499.",
    "- Signage, advertisement, display, rooftop-PV/EV-only, fixture-only, bus-shelter/street-furniture, low-signal HMO/short-let-only and minor domestic DfI rows were reviewed but not promoted as higher-signal public architecture events.",
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
