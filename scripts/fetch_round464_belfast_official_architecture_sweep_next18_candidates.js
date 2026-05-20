#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round464_belfast_official_architecture_sweep_next18";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round464_belfast_official_architecture_sweep_next18_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_STATS_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const NI_WATER_RAVENHILL_URL =
  "https://www.niwater.com/about-us/news/2023/7-million-ravenhill-avenue-flood-alleviation-project-complete";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";
const ULSTER_TERMS_URL = "https://www.ulster.ac.uk/about/terms";
const NIW_TERMS_URL = "https://www.niwater.com/site-information";
const BELFAST_HARBOUR_TERMS_URL = "https://www.belfast-harbour.co.uk/terms/";
const BELFAST_TRUST_COPYRIGHT_URL = "https://belfasttrust.hscni.net/copyright/";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round464 official/public Belfast architecture sweep after Round452.",
  "Accepted DfI planning-statistics rows only when the application row supplied an official easting/northing coordinate reference and the milestone is described as an administrative planning decision, not built completion.",
  "Accepted one NI Water completion record as geometry_ref-only because the official source documents a Belfast infrastructure completion but does not provide a reusable point coordinate.",
  "Rejected high-profile official web records when already present in the live/manual corpus or prior Belfast packs, outside Belfast, or lacking a source-supported point for the current point-only corpus.",
  "No prediction, simulation, causality, service-performance, health, environmental, economic or capacity outcome claim is carried."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round464OfficialArchitectureSweepNext18`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round464",
    source_name: "Northern Ireland planning activity statistics 2024-25 dataset",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: DFI_PLANNING_STATS_URL,
    source_type: "official annual planning-statistics CSV release",
    license:
      "Open Government Licence v3.0 where applicable to Department for Infrastructure public-sector information; verify release-specific terms before redistribution.",
    license_url: OGL_URL,
    attribution:
      "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0 where applicable.",
    publisher_terms_url: OGL_URL,
    coverage_years: "2024-2025",
    geographic_scope: "Belfast planning authority rows in Northern Ireland planning statistics",
    granularity:
      "application-level administrative planning decision with source Easting/Northing",
    reliability: "strong for administrative decision evidence; not physical-completion evidence"
  },
  niWaterRavenhill: {
    source_id: "niwater-ravenhill-avenue-flood-alleviation-complete-2023-round464",
    source_name: "GBP7 Million Ravenhill Avenue Flood Alleviation Project Complete",
    publisher: "Northern Ireland Water",
    source_url: NI_WATER_RAVENHILL_URL,
    source_type: "official NI Water news page",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained, no page text or media reproduced.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    publisher_terms_url: NIW_TERMS_URL,
    coverage_years: "2023",
    geographic_scope: "Ravenhill Avenue area, south Belfast",
    granularity: "area-level project completion; no source coordinate extracted",
    reliability:
      "strong for completion/source-date evidence; geometry_ref-only for atlas review"
  }
};

const PLANNING_LEADS = [
  {
    app_id: "LA04/2023/4327/LBC",
    event_id: "bfs_arch_round464_upper_crescent_guest_house_lbc_2024",
    title:
      "14-15 Upper Crescent guest-house alterations listed-building consent was approved",
    observed_change:
      "Official planning-statistics row records a listed-building consent approval for internal alterations at 14 and 15 Upper Crescent.",
    event_type: "planning_decision_listed_building_consent",
    category: "architecture_heritage_admin",
    limitations: [
      "Planning/listed-building consent is an administrative decision only; it does not confirm works started, works completed, opening, occupation, business operation, visitor numbers, or heritage outcome.",
      "The row supports the application decision date and official grid reference only; it is not a surveyed building footprint or curtilage boundary."
    ]
  },
  {
    app_id: "LA04/2023/3144/DCA",
    event_id: "bfs_arch_round464_st_brides_primary_partial_demolition_consent_2024",
    title:
      "St Bride's Primary School partial-demolition consent was approved",
    observed_change:
      "Official planning-statistics row records consent for part demolition of the existing school building and removal of temporary classrooms at St Bride's Primary School.",
    event_type: "planning_decision_demolition_consent",
    category: "architecture_civic_admin",
    limitations: [
      "Consent is not evidence that demolition occurred, classrooms were removed, replacement works started, the school estate changed in operation, or any education outcome followed.",
      "The point is derived from the official easting/northing for the application row and should be treated as an approximate site navigation point."
    ]
  },
  {
    app_id: "LA04/2024/0874/F",
    related_app_ids: ["LA04/2024/0877/LBC"],
    event_id:
      "bfs_arch_round464_hospital_road_admin_building_apartment_change_2024",
    title:
      "1 Hospital Road administration-building apartment-change approval was recorded",
    observed_change:
      "Official planning-statistics rows record full permission and listed-building consent for a lower-ground-floor change of use in the administration building at 1 Hospital Road.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_heritage_admin",
    limitations: [
      "The event records permission and listed-building consent only. It does not confirm conversion works, completion, occupation, residential delivery, or reuse outcome.",
      "The source point comes from the planning-statistics easting/northing and is not a surveyed footprint or listed-building boundary."
    ]
  },
  {
    app_id: "LA04/2024/1486/F",
    event_id:
      "bfs_arch_round464_highfield_community_centre_garden_approval_2024",
    title: "Highfield Community Centre community-garden works were approved",
    observed_change:
      "Official planning-statistics row records approval for a community garden beside Highfield Community Centre, including level changes, fencing, landscaping, planters, polytunnels, storage and seating.",
    event_type: "planning_decision_public_realm_civic",
    category: "architecture_civic_admin",
    limitations: [
      "Approval is not evidence that the garden, storage, polytunnels, fencing, seating, or associated works were built, opened, maintained, or used.",
      "The source point is an approximate navigation point from official planning-statistics easting/northing, not a measured garden boundary."
    ]
  },
  {
    app_id: "LA04/2024/0503/F",
    event_id:
      "bfs_arch_round464_fairholme_assisted_living_refurbishment_approval_2025",
    title:
      "Fairholme assisted-living accommodation refurbishment was approved",
    observed_change:
      "Official planning-statistics row records approval for refurbishment of existing assisted-living accommodation at Fairholme, Annadale Avenue.",
    event_type: "planning_decision_refurbishment",
    category: "architecture_housing_admin",
    limitations: [
      "Approval does not confirm construction, completion, occupation, housing delivery, care provision, affordability, resident outcomes, or service change.",
      "Coordinates are transformed from the official planning-statistics easting/northing and are not a building footprint or red-line site boundary."
    ]
  },
  {
    app_id: "LA04/2024/1720/F",
    event_id:
      "bfs_arch_round464_duncairn_gardens_church_kitchen_extension_2025",
    title:
      "Duncairn Gardens church kitchen extension and boundary wall were approved",
    observed_change:
      "Official planning-statistics row records approval for a rear kitchen extension to a church and a new front boundary wall at 150-156 Duncairn Gardens.",
    event_type: "planning_decision_civic_extension",
    category: "architecture_civic_admin",
    limitations: [
      "Approval is not evidence that the kitchen extension or boundary wall was built, opened, occupied, funded, or associated with any community outcome.",
      "The coordinate is an approximate point derived from official easting/northing; it is not a measured church or wall footprint."
    ]
  },
  {
    app_id: "LA04/2024/1073/F",
    event_id:
      "bfs_arch_round464_lombard_street_office_to_short_lets_approval_2025",
    title:
      "1-3 Lombard Street office-to-short-term-let conversion was approved",
    observed_change:
      "Official planning-statistics row records approval for changing upper floors at 1-3 Lombard Street from office use to short-term let apartments with associated building works.",
    event_type: "planning_decision_change_of_use",
    category: "architecture_commercial_residential_admin",
    limitations: [
      "Approval is not evidence of conversion works, completion, operation, occupancy, tourism demand, housing-market effect, or economic outcome.",
      "The point is derived from official application easting/northing and is not a surveyed footprint or internal layout."
    ]
  },
  {
    app_id: "LA04/2022/0929/F",
    event_id:
      "bfs_arch_round464_andersonstown_social_club_extensions_approval_2025",
    title: "Andersonstown Social Club extension works were approved",
    observed_change:
      "Official planning-statistics row records approval for extensions and alterations to Andersonstown Social Club.",
    event_type: "planning_decision_civic_extension",
    category: "architecture_civic_admin",
    limitations: [
      "Approval is not evidence that the hall, lounge, bar, entrance, patio, smoking area, or boundary-wall works were built, opened, occupied, or linked to any social outcome.",
      "The source point is transformed from official planning-statistics easting/northing and is not a surveyed site boundary."
    ]
  },
  {
    app_id: "LA04/2023/3372/F",
    event_id: "bfs_arch_round464_springbank_road_factory_office_approval_2025",
    title:
      "3 Springbank Road production factory and offices were approved",
    observed_change:
      "Official planning-statistics row records approval for a new production factory with associated offices and parking at 3 Springbank Road.",
    event_type: "planning_decision_industrial_building",
    category: "architecture_industrial_admin",
    limitations: [
      "Approval is not evidence that a factory, offices, parking, production activity, employment, output, or economic impact was delivered.",
      "The coordinate is transformed from the official easting/northing in the planning-statistics row and should be treated as an approximate site point."
    ]
  }
];

const GEOMETRY_REF_ACCEPTED = [
  {
    id: "bfs_arch_round464_ravenhill_avenue_flood_alleviation_complete_2023",
    event_id: "bfs_arch_round464_ravenhill_avenue_flood_alleviation_complete_2023",
    city_id: CITY_ID,
    title: "Ravenhill Avenue flood-alleviation project was reported complete",
    summary:
      "Northern Ireland Water's 13 December 2023 official news page announced completion of a flood-alleviation project in the Ravenhill Avenue area of south Belfast.",
    observed_change:
      "Official source-published completion milestone for a Belfast drainage/flood-alleviation infrastructure project.",
    event_type: "official_infrastructure_completion",
    category: "architecture_utility_infrastructure",
    date: "2023-12-13",
    effective_date: "2023-12-13",
    effective_date_range: null,
    date_precision: "day",
    source_id: SOURCES.niWaterRavenhill.source_id,
    source_name: SOURCES.niWaterRavenhill.source_name,
    publisher: SOURCES.niWaterRavenhill.publisher,
    source_url: SOURCES.niWaterRavenhill.source_url,
    source_type: SOURCES.niWaterRavenhill.source_type,
    source_record_id:
      "NI Water news page, 13 December 2023: Ravenhill Avenue flood-alleviation project complete",
    source_date_field: "official NI Water news page date",
    source_date_value: "2023-12-13",
    license: SOURCES.niWaterRavenhill.license,
    license_url: SOURCES.niWaterRavenhill.license_url,
    terms: SOURCES.niWaterRavenhill.publisher_terms_url,
    publisher_terms_url: SOURCES.niWaterRavenhill.publisher_terms_url,
    attribution: SOURCES.niWaterRavenhill.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official NI Water page gives the project name, Belfast area and publication/completion context.",
      "No reusable source coordinate or works polygon was exposed by the page in this sweep."
    ],
    limitations: [
      "Geometry_ref only; not ready for the current point-only corpus without a source-backed coordinate, route, asset point, or project boundary.",
      "This candidate records source-reported completion of infrastructure works only. It does not carry flooding, water-quality, capacity, environmental, customer, economic, development-support, or causality claims.",
      "The source identifies an area rather than a surveyed asset location; use as a review lead until an official project map or asset coordinate is found."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_project_area",
      label: "Ravenhill Avenue area, south Belfast",
      precision:
        "Area-level official source location only; no source-backed point or works boundary extracted in Round464",
      source_url: NI_WATER_RAVENHILL_URL
    },
    address_ref: "Ravenhill Avenue area, south Belfast",
    point_corpus_ready: false,
    latitude: null,
    longitude: null,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      { rel: "primary_source", href: NI_WATER_RAVENHILL_URL },
      { rel: "terms", href: NIW_TERMS_URL }
    ],
    duplicate_check_terms: [
      "Ravenhill Avenue Flood Alleviation Project Complete",
      "7 Million Ravenhill Avenue Flood Alleviation Project Complete",
      "Northern Ireland Water Ravenhill Avenue"
    ],
    duplicate_review:
      "No accepted live/manual event or prior official sweep candidate was found for this exact NI Water Ravenhill Avenue completion milestone. It remains geometry_ref-only."
  }
];

const REJECTED_LEADS = [
  {
    id: "bfs_arch_round464_reject_sandy_row_arts_digital_hub_duplicate_2026",
    title: "Sandy Row Arts & Digital Hub official opening",
    rejection_category: "duplicate",
    reason:
      "Already present in the live Belfast event corpus and noted as a duplicate in Round442/Round452; not re-emitted.",
    source_url:
      "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    source_record_id: "bcc-news-2026-02-18-sandy-row-arts-digital-hub-opening",
    license:
      "Belfast City Council website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    duplicate_terms: ["Sandy Row Arts and Digital Hub", "Sandy Row Arts & Digital Hub"]
  },
  {
    id: "bfs_arch_round464_reject_qub_reboot_gaming_hub_duplicate_2024",
    title: "Queen's Reboot gaming hub opening",
    rejection_category: "duplicate",
    reason:
      "The Reboot gaming hub already appears in the manual/live Belfast architecture corpus and prior tmp candidate packs.",
    source_url: "https://www.qub.ac.uk/News/Allnews/2024/new-games-hub-launch.html",
    source_name: "Groundbreaking games hub to 'console' geeks at Queen's",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    source_record_id: "qub-news-2024-08-20-new-games-hub-launch",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["Reboot gaming", "new-games-hub"]
  },
  {
    id: "bfs_arch_round464_reject_qub_seamus_heaney_duplicate_2024",
    title: "Seamus Heaney Centre landmark building opening",
    rejection_category: "duplicate",
    reason:
      "Already represented in the manual/live corpus and earlier Belfast public-project packs; no new source-supported point was added here.",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2024/new-chapter-for-seamus-heaney-centre.html",
    source_name:
      "New chapter for the Seamus Heaney Centre at Queen's as it opens landmark building",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    source_record_id: "qub-news-2024-06-18-seamus-heaney-centre-opened",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["Seamus Heaney Centre", "landmark building"]
  },
  {
    id: "bfs_arch_round464_reject_qub_ireach_duplicate_2024",
    title: "iREACH Health construction start / contract award",
    rejection_category: "duplicate",
    reason:
      "iREACH planning approval and construction-start milestones already appear in the live corpus and Round431/Round372/Round353 prior sweep materials.",
    source_url:
      "https://www.qub.ac.uk/about/belfast-region-city-deal/news/significant-progress-made-on-Queens-innovation-centres-in-2024.html",
    source_name: "Significant progress made on Queen's innovation centres in 2024",
    publisher: "Queen's University Belfast",
    source_type: "official university project/news page",
    source_record_id: "qub-brcd-2024-12-18-ireach-progress",
    license:
      "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained.",
    license_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    duplicate_terms: ["iREACH", "GRAHAM", "clinical research innovation centre"]
  },
  {
    id: "bfs_arch_round464_reject_ulster_virtual_production_duplicate_2022",
    title: "Ulster Virtual Production Studio launch",
    rejection_category: "duplicate",
    reason:
      "The Department for the Economy / Ulster University virtual-production studio launch is already present in the live corpus/source registry.",
    source_url:
      "https://www.economy-ni.gov.uk/news/lyons-launches-ps16m-virtual-production-studio-ulster-university",
    source_name:
      "Lyons launches GBP1.6m Virtual Production Studio at Ulster University",
    publisher: "Department for the Economy, Northern Ireland",
    source_type: "official department news page",
    source_record_id: "dfe-news-2022-02-10-ulster-virtual-production-studio-launch",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for the Economy, Northern Ireland",
    duplicate_terms: ["Virtual Production Studio", "Ulster University Belfast campus"]
  },
  {
    id: "bfs_arch_round464_reject_studio_ulster_opening_duplicate_2025",
    title: "Studio Ulster official opening",
    rejection_category: "duplicate",
    reason:
      "Studio Ulster official-opening evidence is already in the live Belfast corpus; this sweep found no newer, distinct point-backed architecture event.",
    source_url:
      "https://www.ulster.ac.uk/news/2026/february/titanic-sinks-tonight-showcases-studio-ulsters-cutting-edge-virtual-production-and-skills-development",
    source_name:
      "Titanic Sinks Tonight showcases Studio Ulster's cutting-edge virtual production and skills development",
    publisher: "Ulster University",
    source_type: "official university news page",
    source_record_id: "ulster-news-2026-02-studio-ulster-opened-june-2025-reference",
    license:
      "Ulster University website copyright/terms; factual citation metadata and source URL retained.",
    license_url: ULSTER_TERMS_URL,
    attribution: "Ulster University",
    duplicate_terms: ["Studio Ulster", "officially opened in June 2025"]
  },
  {
    id: "bfs_arch_round464_reject_grand_central_duplicate_2024",
    title: "Belfast Grand Central Station opening and enabling milestones",
    rejection_category: "duplicate",
    reason:
      "Translink Grand Central / Great Victoria Street / York Street station milestones are already present in the live corpus and source registry.",
    source_url: "https://www.translink.co.uk/about-translink/media/press-releases/bgcsupdates/bgcsworks",
    source_name: "Belfast Grand Central Station - Enabling Work",
    publisher: "Translink",
    source_type: "official transport operator project page",
    source_record_id: "translink-bgcs-enabling-work-gvs-closure-2024",
    license:
      "Translink website terms/copyright; factual citation metadata and source URL retained.",
    license_url: "https://www.translink.co.uk/termsandconditions",
    attribution: "Translink",
    duplicate_terms: ["Belfast Grand Central Station", "Great Victoria Street Station", "York Street station"]
  },
  {
    id: "bfs_arch_round464_reject_belfast_harbour_city_quays_duplicate",
    title: "Belfast Harbour City Quays and Harbour Studios milestones",
    rejection_category: "duplicate",
    reason:
      "City Quays, Harbour Studios and related Belfast Harbour milestones are already extensively represented in the live corpus and earlier official sweep packs.",
    source_url:
      "https://www.belfast-harbour.co.uk/news/approval-granted-for-60m-city-quays-5-development/",
    source_name: "Approval granted for GBP60m City Quays 5 Development",
    publisher: "Belfast Harbour Commissioners",
    source_type: "official harbour news page",
    source_record_id: "belfast-harbour-city-quays-5-approval-round214",
    license:
      "Belfast Harbour website terms/copyright; factual citation metadata and source URL retained.",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    duplicate_terms: ["City Quays", "Belfast Harbour Studios", "Harbour Studios Phase 2"]
  },
  {
    id: "bfs_arch_round464_reject_niwater_kinnegar_out_of_scope_2024",
    title: "Kinnegar wastewater treatment works PFI handover",
    rejection_category: "out_of_scope_location",
    reason:
      "Official NI Water source concerns Kinnegar, Holywood/County Down. It serves parts of East Belfast but the works location is outside the Belfast city corpus boundary for this round.",
    source_url:
      "https://www.niwater.com/about-us/news/2024/lagan-group-completes-wastewater-contract-at-kinnegar-for-ni-water",
    source_name: "Lagan Group Completes Wastewater Contract at Kinnegar for NI Water",
    publisher: "Northern Ireland Water",
    source_type: "official NI Water news page",
    source_record_id: "niwater-news-2024-04-30-kinnegar-contract-handover",
    license:
      "Northern Ireland Water website copyright/terms; factual citation metadata and source URL retained.",
    license_url: NIW_TERMS_URL,
    attribution: "Northern Ireland Water",
    duplicate_terms: ["Kinnegar", "Holywood", "East Belfast"]
  },
  {
    id: "bfs_arch_round464_reject_old_see_house_duplicate_2016",
    title: "Old See House mental health resource centre opening",
    rejection_category: "duplicate",
    reason:
      "The Department of Health opening record is already represented in the live/manual Belfast corpus; no new source coordinate was needed.",
    source_url:
      "https://www.health-ni.gov.uk/news/new-mental-health-services-resource-centre-benefit-belfast-trust-patients-oneill",
    source_name:
      "New mental health services resource centre to benefit Belfast Trust patients",
    publisher: "Department of Health, Northern Ireland",
    source_type: "official department news page",
    source_record_id: "doh-news-2016-11-03-old-see-house-opening",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department of Health, Northern Ireland",
    duplicate_terms: ["Old See House", "mental health resource centre"]
  },
  {
    id: "bfs_arch_round464_reject_doh_ulster_hospital_out_of_scope",
    title: "Ulster Hospital acute/cancer-care openings",
    rejection_category: "out_of_scope_location",
    reason:
      "Official Department of Health records are in Dundonald, outside the Belfast city scope used for this corpus round.",
    source_url:
      "https://www.health-ni.gov.uk/news/minister-swann-opens-ps115m-ulster-hospitals-new-acute-services-block",
    source_name: "Minister Swann Opens GBP115m Ulster Hospital's New Acute Services Block",
    publisher: "Department of Health, Northern Ireland",
    source_type: "official department news page",
    source_record_id: "doh-news-2021-11-04-ulster-hospital-asb-opening",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department of Health, Northern Ireland",
    duplicate_terms: ["Ulster Hospital", "Dundonald"]
  },
  {
    id: "bfs_arch_round464_reject_dfc_harni_no_new_point_rows",
    title: "HARNI / HED heritage spatial status layers",
    rejection_category: "source_exhausted_or_status_only",
    reason:
      "Current HARNI/HED ArcGIS layers provide official point/status rows but prior sweep/manifests already cover Belfast HARNI status gaps; Date_Added/status fields are not physical construction or repair dates.",
    source_url:
      "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer",
    source_name: "Historic Environment Division GIS Data",
    publisher: "Department for Communities Historic Environment Division",
    source_type: "official ArcGIS feature service",
    source_record_id: "HED GIS layers 1/3/4 reviewed in Round464",
    license: "Crown copyright / Open Government Licence v3.0 where applicable.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division",
    duplicate_terms: ["HARNI", "Historic Buildings", "Date_Added", "Date Visited"]
  },
  {
    id: "bfs_arch_round464_reject_lockhouse_strand_prior_candidates",
    title: "Lockhouse and Strand Arts Centre official pages",
    rejection_category: "duplicate_prior_tmp_pack",
    reason:
      "Lockhouse planning/start evidence and Strand Arts Centre restoration-in-progress evidence already appear in earlier Belfast public-project candidate packs; not re-emitted.",
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
    duplicate_terms: ["Lockhouse", "Strand Arts Centre", "River Terrace"]
  }
];

const SEARCH_QUERIES_CHECKED = [
  'site:belfastcity.gov.uk Belfast "opened" "2026" "building" "Belfast City Council"',
  'site:belfastcity.gov.uk "work underway" "Strand Arts Centre" Belfast "2025"',
  'site:communities-ni.gov.uk Belfast "officially opened" "2025" "building"',
  'site:health-ni.gov.uk Belfast "officially opened" "Belfast City Hospital" "new"',
  'site:qub.ac.uk Belfast "officially opened" "2025" "Queen\'s University"',
  'site:ulster.ac.uk Belfast campus "officially opened" "2025"',
  'site:translink.co.uk Belfast "officially opened" "new" "station" "2025"',
  'site:belfast-harbour.co.uk Belfast "opened" "2025" "new" "building"',
  'site:niwater.com Belfast "completed" "2024" "NI Water"',
  "DfI planning-statistics 2024-25 local CSV scan for Belfast APP_ID rows with source Easting/Northing and no accepted live/prior candidate match",
  "local duplicate scan: data/manual_drops, data/derived/2026, web/data/city-atlas/cities/belfast, tmp/subagents through round452"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
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
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseDate(value) {
  const text = cleanText(value);
  const match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return text;
  const months = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };
  const day = match[1].padStart(2, "0");
  const month = months[match[2].toLowerCase()];
  return month ? `${match[3]}-${month}-${day}` : text;
}

function normaliseNumber(value) {
  const number = Number(cleanText(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function niGridToApproxPoint(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const longitude = -5.93 + (easting - 333000) / 65000;
  const latitude = 54.6 + (northing - 374000) / 111000;
  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  };
}

function readPlanningRows() {
  const text = readTextIfExists(PLANNING_CSV_PATH);
  if (!text) {
    throw new Error(`Missing planning CSV: ${PLANNING_CSV_PATH}`);
  }
  const rows = parseCsv(text);
  const header = rows.shift().map(cleanText);
  const index = new Map(header.map((name, idx) => [name, idx]));
  return rows.map((row, zeroIdx) => {
    const get = (name) => cleanText(row[index.get(name)]);
    return {
      file: PLANNING_CSV_PATH,
      source_file_name: PLANNING_DATASET,
      row_number: zeroIdx + 2,
      ID: get("ID"),
      DateReceived: get("DateReceived"),
      DateValid: get("DateValid"),
      Authority: get("Authority"),
      LPA19CD: get("LPA19CD"),
      LPA19NM: get("LPA19NM"),
      AppType: get("AppType"),
      Classification: get("Classification"),
      StatsCategory: get("StatsCategory"),
      Proposal: get("Proposal"),
      SiteAddress: get("SiteAddress"),
      Easting: get("Easting"),
      Northing: get("Northing"),
      StatusAt31Mar: get("Status@31Mar"),
      Decision_Withdrawal: get("Decision_Withdrawal"),
      DecisionIssuedDate: get("DecisionIssuedDate")
    };
  });
}

function collectDuplicateHaystack() {
  const roots = [
    "data/manual_drops",
    "data/derived/2026",
    path.join("web", "data", "city-atlas", "cities", "belfast"),
    path.join("tmp", "subagents")
  ];
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      if (path.normalize(current).startsWith(path.normalize(OUT_DIR))) continue;
      const stat = fs.statSync(current);
      if (stat.isDirectory()) {
        for (const entry of fs.readdirSync(current)) {
          stack.push(path.join(current, entry));
        }
      } else if (/\.(json|js|md)$/i.test(current)) {
        files.push(current);
      }
    }
  }
  const chunks = [];
  let sampledChars = 0;
  const maxSampledChars = 12_000_000;
  const maxSamplePerFile = 240_000;
  const appIds = new Set();
  const urls = new Set();
  for (const file of files) {
    const text = readTextIfExists(file);
    if (!text) continue;
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
    for (const match of text.matchAll(/LA04\/\d{4}\/\d{4}\/[A-Z]+/g)) {
      appIds.add(match[0]);
    }
    for (const match of text.matchAll(/https?:\/\/[^\s"')]+/g)) {
      urls.add(match[0].replace(/[),.;]+$/, "").toLowerCase());
    }
  }
  return {
    files_checked: files.length,
    roots,
    appIds,
    urls,
    text: chunks.join("\n"),
    sampled_chars: sampledChars,
    sample_note:
      "Duplicate APP_ID and URL indexes were built from full file contents; free-text duplicate hints use bounded samples to avoid loading generated Belfast JSONs into one huge string."
  };
}

function duplicateHitsForTerms(haystack, terms, ownId) {
  const hits = [];
  for (const term of terms) {
    const normalized = normalizeText(term);
    if (!normalized) continue;
    const hay = normalizeText(haystack.text);
    if (hay.includes(normalized) && normalizeText(ownId) !== normalized) {
      hits.push(term);
    }
  }
  return [...new Set(hits)];
}

function sourceRecordIdFor(row, relatedRows = []) {
  const bits = [
    `APP_ID:${row.ID}`,
    ...relatedRows.map((r) => `RELATED_APP_ID:${r.ID}`),
    `FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`,
    `ROW:${row.row_number}`
  ];
  for (const related of relatedRows) {
    bits.push(`RELATED_ROW:${related.row_number}`);
  }
  return bits.join("; ");
}

function candidateFromPlanningLead(lead, rowsById, duplicateHaystack) {
  const source = SOURCES.dfiPlanningStats;
  const row = rowsById.get(lead.app_id);
  if (!row) {
    throw new Error(`Planning lead missing source row: ${lead.app_id}`);
  }
  const relatedRows = (lead.related_app_ids || [])
    .map((appId) => rowsById.get(appId))
    .filter(Boolean);
  const decisionDate = parseDate(row.DecisionIssuedDate || row.DateValid);
  const easting = normaliseNumber(row.Easting);
  const northing = normaliseNumber(row.Northing);
  const point = niGridToApproxPoint(easting, northing);
  if (!point) throw new Error(`Planning lead missing point: ${lead.app_id}`);
  const duplicateTerms = [
    lead.event_id,
    row.ID,
    ...relatedRows.map((r) => r.ID),
    row.SiteAddress,
    row.Proposal
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
      "Approximate established Belfast transform: longitude = -5.93 + (easting - 333000) / 65000; latitude = 54.6 + (northing - 374000) / 111000.",
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: null,
    geometry_source:
      "Source-backed planning-statistics Easting/Northing converted to WGS84 for review.",
    geometry_precision:
      "Approximate site/address point from official application row, not a surveyed footprint, legal red-line boundary, curtilage, room, wall or works extent.",
    point_corpus_ready: true,
    source_fields: {
      ID: row.ID,
      related_app_ids: relatedRows.map((r) => r.ID),
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
      source_row_number: row.row_number
    },
    evidence_basis: [
      "Official DfI planning-statistics row supplies application ID, decision status, decision date, site address, proposal text and Easting/Northing.",
      "The candidate is modelled as an observed administrative planning-decision milestone only."
    ],
    limitations: lead.limitations,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      { rel: "primary_source_page", href: DFI_PLANNING_STATS_URL },
      { rel: "license", href: OGL_URL }
    ],
    duplicate_check_terms: duplicateTerms,
    duplicate_review:
      "APP_ID was absent from accepted live/manual records and prior official sweep candidate outputs checked by the Round464 duplicate scan. Earlier round131 rejection-only appearances were treated as non-accepted prior work because the 2024-25 decision row now provides the approved decision milestone.",
    duplicate_scan_hits: duplicateScanHits
  };
}

function rejectedRecord(lead, duplicateHaystack) {
  const duplicateScanHits = duplicateHitsForTerms(
    duplicateHaystack,
    lead.duplicate_terms || [lead.title],
    lead.id
  );
  return {
    id: lead.id,
    city_id: CITY_ID,
    title: lead.title,
    rejection_category: lead.rejection_category,
    reason: lead.reason,
    source_id: lead.id.replace(/^bfs_arch_round464_reject_/, "round464-reject-"),
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
    duplicate_scan_hits: duplicateScanHits,
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
    if (candidate.effective_date < DATE_WINDOW.start || candidate.effective_date > DATE_WINDOW.end) {
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
      if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude)) {
        errors.push(`${candidate.event_id} has point geometry without latitude/longitude`);
      }
    } else {
      geometryRefOnly.push(candidate.event_id);
      if (candidate.point_corpus_ready !== false) {
        errors.push(`${candidate.event_id} geometry_ref-only record must set point_corpus_ready false`);
      }
      warnings.push(`${candidate.event_id} is geometry_ref-only and not point-corpus-ready`);
    }
    const claimText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      ...(candidate.evidence_basis || [])
    ].join(" ");
    if (badClaim.test(claimText)) {
      errors.push(`${candidate.event_id} contains overclaim language`);
    }
  }
  for (const rejectedRecordItem of rejected) {
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
      if (
        rejectedRecordItem[field] === undefined ||
        rejectedRecordItem[field] === null ||
        rejectedRecordItem[field] === ""
      ) {
        errors.push(`${rejectedRecordItem.id} missing rejected field ${field}`);
      }
    }
  }
  return {
    pointBacked,
    geometryRefOnly,
    errors,
    warnings
  };
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

  const planningCandidates = PLANNING_LEADS.map((lead) =>
    candidateFromPlanningLead(lead, rowsById, duplicateHaystack)
  );
  const candidates = [...GEOMETRY_REF_ACCEPTED, ...planningCandidates].sort((a, b) =>
    a.effective_date.localeCompare(b.effective_date) || a.event_id.localeCompare(b.event_id)
  );
  const rejected = REJECTED_LEADS.map((lead) => rejectedRecord(lead, duplicateHaystack));
  const validation = validate(candidates, rejected, duplicateHaystack);
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
        accepted_records: planningCandidates.length,
        disposition:
          "accepted selected residual Belfast application rows with source Easting/Northing after duplicate review"
      },
      {
        ...SOURCES.niWaterRavenhill,
        accepted_records: 1,
        disposition:
          "accepted as geometry_ref-only Belfast infrastructure completion evidence; not point-corpus-ready"
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
      note:
        "Duplicate scan is conservative and text-based. Accepted APP_IDs were absent from accepted live/manual records and prior official sweep candidates; prior rejection-only appearances were not treated as duplicates."
    },
    caveats: [
      "Planning-statistics candidates are administrative decision records only, not construction/completion/opening evidence.",
      "Point coordinates are source-supported by official Easting/Northing fields but WGS84 latitude/longitude uses the repo's established lightweight Belfast transform; points are approximate navigation geometry.",
      "NI Water Ravenhill is geometry_ref-only and should stay out of the point-only corpus until an official source coordinate or boundary is found.",
      "No prediction, simulation, causality, outcome, capacity or impact claim is made."
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
    "- Department for Infrastructure planning statistics 2024-25: selected residual Belfast planning-decision rows with official Easting/Northing.",
    "- Northern Ireland Water Ravenhill Avenue completion page: retained as geometry_ref-only review evidence because no official point or works boundary was exposed.",
    "",
    "## Rejected/Not Re-Emitted",
    "",
    "- Sandy Row Arts & Digital Hub, QUB Reboot, Seamus Heaney Centre, iREACH, Studio Ulster, Translink Grand Central and Belfast Harbour City Quays/Harbour Studios were rejected as duplicates of live/prior corpus records.",
    "- Kinnegar and Ulster Hospital Dundonald records were rejected as outside Belfast city scope for this round.",
    "- HARNI/HED spatial layers were treated as already covered or status-only for this round; status/list dates are not physical works dates.",
    "",
    "## Caveats",
    "",
    "- Planning approvals are administrative milestones only. They do not show construction start, completion, opening, occupation, final built form, or outcomes.",
    "- Source-backed points come from official Easting/Northing fields converted with the repo's lightweight Belfast transform; use as approximate navigation points only.",
    "- The Ravenhill Avenue NI Water record is not ready for the current point-only corpus.",
    "- No causality, prediction, simulation, capacity, service-performance, environmental, health, education or economic impact claim is made.",
    ""
  ].join("\n");

  writeJson(path.join(OUT_DIR, "candidates.json"), candidates);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejected);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);
  writeJson(path.join(OUT_DIR, "validation.json"), validationReport);
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
