const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastDec2024PhysicalProgrammePdf =
  "https://minutes.belfastcity.gov.uk/documents/s119192/Physical%20Programme%20Update.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_abbey_place_completion_2023",
    date: "2023-04-01",
    bucket: "planning/development/architecture/residential mixed use",
    title: "Abbey Place was listed as built",
    summary:
      "New London Architecture records Abbey Place in Greenwich as built, with completion in April 2023.",
    observed_change:
      "A documented two-tower residential and amenity development was recorded as reaching built status in Abbey Wood.",
    area: "Abbey Wood / Greenwich",
    latitude: 51.4912,
    longitude: 0.1224,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Abbey Place",
    source_url: "https://nla.london/projects/abbey-place-3",
    source_record_id: "nla-abbey-place-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "residential towers and amenity space",
    geometry_source: "Approximate point placed near Abbey Wood station from the named Greenwich project context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure mix, occupancy, amenity management, and later estate operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_camden_market_canopy_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/market public realm",
    title: "Camden Market Canopy was listed as built",
    summary:
      "New London Architecture records Camden Market Canopy in Camden as built, with completion in January 2022.",
    observed_change:
      "A documented market canopy and hospitality structure beside Camden Market was recorded as reaching built status.",
    area: "Camden Market",
    latitude: 51.5416,
    longitude: -0.1466,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Camden Market Canopy",
    source_url: "https://nla.london/projects/camden-market-canopy",
    source_record_id: "nla-camden-market-canopy",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "vPPR Architects",
    project_type: "market canopy and hospitality structure",
    geometry_source: "Approximate point placed at Camden Market from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; trading operations, heritage consent detail, visitor numbers, and later market management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_jj_mack_building_completion_2022",
    date: "2022-09-01",
    bucket: "planning/development/architecture/workplace public realm",
    title: "The J J Mack Building was listed as built",
    summary:
      "New London Architecture records The J J Mack Building in Islington as built, with completion in September 2022.",
    observed_change:
      "A documented workplace building with ground-floor public-realm elements was recorded as reaching built status.",
    area: "Farringdon / Islington",
    latitude: 51.5204,
    longitude: -0.1019,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The J J Mack Building",
    source_url: "https://nla.london/projects/the-j-j-mack-building",
    source_record_id: "nla-the-j-j-mack-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lifschutz Davidson Sandilands",
    project_type: "workplace building and public-realm frontage",
    geometry_source: "Approximate point placed in the Farringdon/Islington project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenancy, public-realm adoption, building operation, and later workplace use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_barking_riverside_transport_interchange_completion_2022",
    date: "2022-07-01",
    bucket: "planning/development/architecture/transport interchange",
    title: "Barking Riverside Transport Interchange was listed as built",
    summary:
      "New London Architecture records Barking Riverside Transport Interchange in Barking as built, with completion in July 2022.",
    observed_change:
      "A documented Overground station, bus interchange, cycle hub, and public-realm transport project was recorded as reaching built status.",
    area: "Barking Riverside",
    latitude: 51.5191,
    longitude: 0.1145,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Barking Riverside Transport Interchange",
    source_url: "https://nla.london/projects/barking-riverside-transport-interchange",
    source_record_id: "nla-barking-riverside-transport-interchange",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Weston Williamson+Partners",
    project_type: "transport interchange and public realm",
    geometry_source: "Approximate point placed at Barking Riverside station and interchange.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; service start, passenger use, operational changes, and later area development require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_waterloo_international_terminal_integration_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/station infrastructure",
    title: "Waterloo International Terminal integration was listed as built",
    summary:
      "New London Architecture records Waterloo International Terminal in Lambeth as built, with completion in 2019.",
    observed_change:
      "A documented station-infrastructure project integrating former international platforms into domestic railway use was recorded as reaching built status.",
    area: "Waterloo Station",
    latitude: 51.5031,
    longitude: -0.1132,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Waterloo International Terminal (WIT)",
    source_url: "https://nla.london/projects/waterloo-international-terminal-wit",
    source_record_id: "nla-waterloo-international-terminal-wit",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "AECOM",
    project_type: "railway station infrastructure integration",
    geometry_source: "Approximate point placed at Waterloo Station from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; timetable changes, passenger capacity, construction phasing, and operational outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_521_east_tremont_avenue_text_adopted_2023",
    date: "2023-03-16",
    bucket: "planning/development/zoning/housing mixed use",
    title: "521 East Tremont Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 521 East Tremont Avenue, N 220307 ZRX, with an adopted date of March 16, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 521 East Tremont Avenue project area in the Bronx.",
    area: "East Tremont / Bronx",
    latitude: 40.8461,
    longitude: -73.8946,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 521 East Tremont Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/521-east-tremont-avenue-n-220307-zrx",
    source_record_id: "nyc-zr-521-east-tremont-avenue-n-220307-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named East Tremont Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_446_448_park_avenue_text_adopted_2023",
    date: "2023-02-02",
    bucket: "planning/development/zoning/residential mixed use",
    title: "446-448 Park Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 446-448 Park Avenue, N 220333 ZRK, with an adopted date of February 2, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 446-448 Park Avenue project area in Brooklyn.",
    area: "Park Avenue / Brooklyn",
    latitude: 40.6965,
    longitude: -73.9645,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 446-448 Park Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/446-448-park-avenue-n-220333-zrk",
    source_record_id: "nyc-zr-446-448-park-avenue-n-220333-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Park Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_reform_temple_forest_hills_text_adopted_2023",
    date: "2023-02-02",
    bucket: "planning/development/zoning/institutional housing",
    title: "Reform Temple of Forest Hills zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Reform Temple of Forest Hills, N 220275 ZRQ, with an adopted date of February 2, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the Reform Temple of Forest Hills project area in Queens.",
    area: "Forest Hills / Queens",
    latitude: 40.7219,
    longitude: -73.8392,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Reform Temple of Forest Hills",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/reform-temple-forest-hills-n-220275-zrq",
    source_record_id: "nyc-zr-reform-temple-forest-hills-n-220275-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "institutional and housing zoning text amendment",
    geometry_source: "Approximate point placed at the Forest Hills project context, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, institutional facility changes, housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_livonia4_text_adopted_2022",
    date: "2022-12-07",
    bucket: "planning/development/zoning/affordable housing",
    title: "Livonia4 zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Livonia4, N 220430 ZRK, with an adopted date of December 7, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Livonia4 project area in Brooklyn.",
    area: "East New York / Brownsville",
    latitude: 40.6645,
    longitude: -73.899,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Livonia4",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/livonia4-n-220430-zrk",
    source_record_id: "nyc-zr-livonia4-n-220430-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related affordable-housing zoning text amendment",
    geometry_source: "Approximate neighborhood point placed in the Livonia Avenue corridor, not a mapped zoning boundary.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_innovative_urban_village_text_adopted_2022",
    date: "2022-11-22",
    bucket: "planning/development/zoning/neighborhood redevelopment",
    title: "Innovative Urban Village zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Innovative Urban Village, N 200313 ZRK, with an adopted date of November 22, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Innovative Urban Village project area in Brooklyn.",
    area: "East New York / Brooklyn",
    latitude: 40.645,
    longitude: -73.88,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Innovative Urban Village",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/innovative-urban-village-n-200313-zrk",
    source_record_id: "nyc-zr-innovative-urban-village-n-200313-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "neighborhood redevelopment zoning text amendment",
    geometry_source: "Approximate district point placed in the East New York project context, not a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, housing delivery, commercial/community-facility delivery, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_innovation_factory_access_control_stage3_committed_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic asset safety",
    title: "Innovation Factory Access Control moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 13 December 2024 recorded agreement that Innovation Factory Access Control move to Stage 3 - Committed with a maximum allocation of GBP 100,000.",
    observed_change:
      "A documented capital-programme milestone was recorded for access-control works at Innovation Factory.",
    area: "Innovation Factory / Springfield Road",
    latitude: 54.5989,
    longitude: -5.979,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 13 December 2024",
    source_url: belfastDec2024PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2024-12-13-innovation-factory-access-control-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Innovation Factory asset team; contractor not named in the report",
    project_type: "civic asset access-control works milestone",
    geometry_source: "Approximate point placed at Innovation Factory because the report does not map the access-control works.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 3 programme status and maximum allocation only. It does not confirm contract award, installation, completion, operational changes, security outcomes, or later asset condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_floral_hall_hs_works_stage3_committed_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic heritage safety",
    title: "Floral Hall Health and Safety Works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 13 December 2024 recorded agreement that Floral Hall Health and Safety Works move immediately to Stage 3 - Committed, with a maximum allocation of GBP 750,000 for immediate works.",
    observed_change:
      "A documented capital-programme milestone was recorded for immediate health and safety works at Floral Hall.",
    area: "Floral Hall / Belfast Zoo",
    latitude: 54.657,
    longitude: -5.943,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 13 December 2024",
    source_url: belfastDec2024PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2024-12-13-floral-hall-health-safety-works-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and heritage/building asset team; contractor not named in the report",
    project_type: "heritage building health and safety works milestone",
    geometry_source: "Approximate point placed at the Floral Hall/Belfast Zoo site because the report does not map the immediate works.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 3 programme status and maximum allocation only. It does not confirm final conservation design, statutory approvals, contract award, works completion, future reuse, or heritage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_zoo_hs_works_stage1_emerging_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic asset safety",
    title: "Belfast Zoo Health and Safety Works was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 13 December 2024 recorded agreement that Belfast Zoo Health and Safety Works be added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for a health and safety works programme at Belfast Zoo.",
    area: "Belfast Zoo",
    latitude: 54.657,
    longitude: -5.943,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 13 December 2024",
    source_url: belfastDec2024PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2024-12-13-belfast-zoo-health-safety-works-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and zoo/assets project team; design team not named in the report",
    project_type: "zoo asset health and safety programme entry milestone",
    geometry_source: "Approximate point placed at Belfast Zoo because the report does not map individual works locations.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 1 programme entry only. It does not identify final works packages, procurement, construction, completion, operational disruption, animal-care effects, or asset-condition outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_35_39_royal_avenue_hs_works_stage1_emerging_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic asset safety",
    title: "35-39 Royal Avenue Health and Safety Works was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 13 December 2024 recorded agreement that 35-39 Royal Avenue Health and Safety Works be added to the Capital Programme at Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for health and safety works at 35-39 Royal Avenue.",
    area: "35-39 Royal Avenue",
    latitude: 54.601,
    longitude: -5.9286,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 13 December 2024",
    source_url: belfastDec2024PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2024-12-13-35-39-royal-avenue-health-safety-works-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and city-centre assets project team; design team not named in the report",
    project_type: "city-centre asset health and safety programme entry milestone",
    geometry_source: "Approximate point geocoded from the named Royal Avenue address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm final design, statutory approvals, procurement, works start, completion, occupancy, or long-term use model."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_35_39_royal_avenue_long_term_model_stage1_emerging_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic asset reuse",
    title: "35-39 Royal Avenue long-term model was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 13 December 2024 recorded agreement that 35-39 Royal Avenue be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed on the long-term model.",
    observed_change:
      "A documented capital-programme milestone was recorded for developing a long-term model for 35-39 Royal Avenue.",
    area: "35-39 Royal Avenue",
    latitude: 54.601,
    longitude: -5.9286,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 13 December 2024",
    source_url: belfastDec2024PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2024-12-13-35-39-royal-avenue-long-term-model-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and city-centre assets project team; design team not named in the report",
    project_type: "city-centre asset reuse business-case milestone",
    geometry_source: "Approximate point geocoded from the named Royal Avenue address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 1 programme entry for long-term model development only. It does not confirm preferred use, statutory approvals, funding, procurement, works start, completion, occupancy, or public-access arrangements."
  }
];

const existingIds = new Set(doc.events.map((event) => event.event_id));
const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);
}

doc.events.push(...records);
doc.sources = doc.sources.map((source) => {
  if (
    source.source_id === "london-architecture-public-pages" ||
    source.source_id === "nyc-architecture-public-pages" ||
    source.source_id === "belfast-architecture-public-pages"
  ) {
    return {
      ...source,
      retrieved_at: retrievedAt
    };
  }
  return source;
});

fs.writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Appended ${records.length} records to ${path}`);
