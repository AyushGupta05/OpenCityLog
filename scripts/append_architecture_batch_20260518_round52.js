const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastContractsAwardedJun2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s122835/Appendix%202%20-%20Contracts%20Awarded%20to%20Jun25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_camden_gardens_pocket_park_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/public realm",
    title: "Camden Gardens Pocket Park was listed as built",
    summary:
      "New London Architecture records Camden Gardens Pocket Park in Camden as built, with completion in February 2020.",
    observed_change:
      "A documented Camden pocket-park and public-realm project was recorded as reaching built status.",
    area: "Camden Gardens / Camden",
    latitude: 51.5419315,
    longitude: -0.1409766,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Camden Gardens Pocket Park",
    source_url: "https://nla.london/projects/camden-gardens-pocket-park",
    source_record_id: "nla-camden-gardens-pocket-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Studio MUTT",
    project_type: "public-realm completion",
    geometry_source: "Approximate point placed at Camden Gardens from the named NLA project title and borough context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; maintenance arrangements, planting survival, public-use patterns, and later public-realm changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_fleet_house_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/residential",
    title: "Fleet House was listed as built",
    summary:
      "New London Architecture records Fleet House in Camden as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Admiral's Walk residential project was recorded as reaching built status.",
    area: "Hampstead / Camden",
    latitude: 51.557,
    longitude: -0.18,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Fleet House",
    source_url: "https://nla.london/projects/fleet-house",
    source_record_id: "nla-fleet-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stanton Williams",
    project_type: "residential completion",
    geometry_source: "Approximate point placed in the Admiral's Walk/Hampstead context from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; exact completion day, occupation, ownership, sales, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_elephant_west_completion_2018",
    date: "2018-10-01",
    bucket: "planning/development/architecture/cultural",
    title: "Elephant West was listed as built",
    summary:
      "New London Architecture records Elephant West in Hammersmith as built, with estimated completion in October 2018.",
    observed_change:
      "A documented Wood Lane cultural and temporary-use project was recorded as reaching built status.",
    area: "Wood Lane / Hammersmith",
    latitude: 51.511,
    longitude: -0.224,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Elephant West",
    source_url: "https://nla.london/projects/elephant-west",
    source_record_id: "nla-elephant-west",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Liddicoat & Goldhill",
    project_type: "cultural facility completion",
    geometry_source: "Approximate point placed on Wood Lane from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; programme operations, lease terms, visitor numbers, temporary-use duration, and later site changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_wallace_collection_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/cultural",
    title: "The Wallace Collection project was listed as built",
    summary:
      "New London Architecture records The Wallace Collection in Westminster as built, with completion in February 2020.",
    observed_change:
      "A documented Hertford House cultural-building project was recorded as reaching built status.",
    area: "Manchester Square / Westminster",
    latitude: 51.5178,
    longitude: -0.153,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Wallace Collection",
    source_url: "https://nla.london/projects/the-wallace-collection",
    source_record_id: "nla-the-wallace-collection",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Purcell",
    project_type: "cultural building completion",
    geometry_source: "Approximate point placed at Hertford House/Manchester Square from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exhibition programme, visitor access, conservation outcomes, operations, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_stow_away_hotel_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/hospitality",
    title: "Stow-Away Hotel was listed as built",
    summary:
      "New London Architecture records Stow-Away Hotel in Lambeth as built, with completion in January 2019.",
    observed_change:
      "A documented Lower Marsh hotel project was recorded as reaching built status.",
    area: "Lower Marsh / Lambeth",
    latitude: 51.501,
    longitude: -0.113,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Stow-Away Hotel",
    source_url: "https://nla.london/projects/stow-away-hotel-1",
    source_record_id: "nla-stow-away-hotel-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Doone Silver Kerr",
    project_type: "hotel completion",
    geometry_source: "Approximate point placed at 111 Lower Marsh from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; hotel opening, occupancy, operator changes, performance, and later building operations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_coney_landing_groundbreaking_2025",
    date: "2025-09-16",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Coney Landing construction was celebrated",
    summary:
      "NYC Housing Preservation and Development announced a September 2025 groundbreaking event for Coney Landing, describing construction of 178 planned affordable and supportive apartments in Coney Island.",
    observed_change:
      "A documented HPD announcement recorded a construction-start milestone for Coney Landing.",
    area: "Coney Island / Brooklyn",
    latitude: 40.5765081,
    longitude: -73.9929419,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Coney Landing groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/063-25/coney-landing-groundbreaking-celebrates-construction-new-affordable-supportive-permanent",
    source_record_id: "nyc-hpd-2025-09-16-coney-landing-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Settlement Housing Fund and project partners; design team requires separate project records",
    project_type: "affordable and supportive housing groundbreaking",
    geometry_source: "Neighborhood-approximate point placed in Coney Island because the HPD release describes the site as replacing a surface parking lot but the extracted text does not provide a street address.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records a construction-start celebration only. It does not confirm completion, certificate of occupancy, lease-up, supportive-service operations, affordability compliance, opening date, or later building management."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_barbara_kleiman_shelter_groundbreaking_2023",
    date: "2023-04-26",
    bucket: "planning/development/architecture/shelter groundbreaking",
    title: "Barbara Kleiman Men's Shelter broke ground",
    summary:
      "NYC Housing Preservation and Development announced groundbreaking for the Barbara Kleiman Men's Shelter, part of the Kingsland Commons redevelopment of the former Greenpoint Hospital campus, on April 26, 2023.",
    observed_change:
      "A documented HPD announcement recorded the start of construction for a shelter phase within the Kingsland Commons redevelopment.",
    area: "East Williamsburg / Brooklyn",
    latitude: 40.7169035,
    longitude: -73.939516,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Barbara Kleiman Men's Shelter groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/013-23/st-nicks-alliance-project-renewal-hudson-companies-break-ground-barbara-kleiman-men-s",
    source_record_id: "nyc-hpd-2023-04-26-barbara-kleiman-shelter-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "St. Nicks Alliance, Project Renewal, Hudson Companies, and city partners; design team requires separate project records",
    project_type: "shelter and mixed-use redevelopment groundbreaking",
    geometry_source: "Approximate point placed at the former Greenpoint Hospital campus from the HPD release context.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a shelter groundbreaking only. It does not confirm shelter completion, residential phases, service operations, public-open-space delivery, later campus phases, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brownsville_arts_center_apartments_groundbreaking_2025",
    date: "2025-09-09",
    bucket: "planning/development/architecture/mixed-use groundbreaking",
    title: "Brownsville Arts Center and Apartments broke ground",
    summary:
      "The NYC Mayor's Office announced that city officials and project partners broke ground on the Brownsville Arts Center and Apartments project at 366 Rockaway Avenue on September 9, 2025.",
    observed_change:
      "A documented mayoral announcement recorded the construction-start milestone for a mixed-use affordable-housing and cultural-arts project.",
    area: "Brownsville / Brooklyn",
    latitude: 40.6714527,
    longitude: -73.9112958,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Brownsville Arts Center and Apartments groundbreaking",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/09/most-pro-housing-administration-in-city-history--mayor-adams--gi",
    source_record_id: "nyc-mayor-2025-09-09-brownsville-arts-center-apartments-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Gilbane Development, Blue Sea Development, Artspace, and city partners; design team requires separate project records",
    project_type: "mixed-use housing and arts-center groundbreaking",
    geometry_source: "Approximate point placed at 366 Rockaway Avenue from the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm construction completion, cultural-center opening, unit delivery, lease-up, affordability compliance, arts programming, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_woodhull_ii_residence_opening_2025",
    date: "2025-03-13",
    bucket: "planning/development/architecture/supportive housing opening",
    title: "Woodhull II Residence opening was announced",
    summary:
      "The NYC Mayor's Office announced the opening of Woodhull II Residence, a 93-unit affordable and supportive housing building at Woodhull Hospital, on March 13, 2025.",
    observed_change:
      "A documented mayoral announcement recorded the opening of a supportive and affordable housing building associated with Woodhull Hospital.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.6993356,
    longitude: -73.9427471,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Woodhull II Residence opening",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/138-25/mayor-adams-nyc-health-hospitals-hpd-opening-93-units-affordable-and",
    source_record_id: "nyc-mayor-2025-03-13-woodhull-ii-residence-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Comunilife, NYC Health + Hospitals, HPD, and project partners; design team requires separate project records",
    project_type: "supportive and affordable housing opening",
    geometry_source: "Approximate point placed at NYC Health + Hospitals/Woodhull from the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a public opening announcement only. It does not confirm every unit lease-up, resident move-in, service delivery, affordability compliance, long-term operations, or later building management."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_willets_point_affordable_housing_frames_completion_2025",
    date: "2025-05-02",
    bucket: "planning/development/architecture/housing construction milestone",
    title: "Willets Point affordable-housing building frames were announced complete",
    summary:
      "The NYC Mayor's Office announced on May 2, 2025 that the frames of Buildings 1 and 2 in the first phase of the Willets Point affordable-housing project were complete.",
    observed_change:
      "A documented mayoral announcement recorded a mid-construction structural milestone for the first Willets Point housing phase.",
    area: "Willets Point / Queens",
    latitude: 40.756,
    longitude: -73.844,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Willets Point affordable housing construction milestone",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/05/mayor-adams-celebrates-significant-construction-milestone-880-new-affordable-homes-willets",
    source_record_id: "nyc-mayor-2025-05-02-willets-point-buildings-1-2-frames-complete",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Queens Development Group and project partners; design team requires separate project records",
    project_type: "affordable housing construction milestone",
    geometry_source: "Approximate point placed at the Willets Point redevelopment area near Citi Field from the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a construction milestone only. It does not confirm building completion, certificate of occupancy, lease-up, senior-housing building start, later phases, stadium delivery, or public-realm completion."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_under_the_bridge_public_realm_consultant_contract_awarded_2025",
    date: "2025-04-10",
    bucket: "planning/development/public realm consultancy contract award",
    title: "Under the Bridge public-realm consultant-team contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed an integrated consultancy team for Under the Bridge Public Realm, awarded to AtkinsRealis UK Limited on April 10, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a public-realm consultancy-team contract for Under the Bridge.",
    area: "Under the Bridge / Belfast",
    latitude: 54.6,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-under-the-bridge-public-realm-consultant-team",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "AtkinsRealis UK Limited was listed as supplier; detailed design team roles require separate project records",
    project_type: "public-realm consultancy contract award",
    geometry_source: "Approximate point placed in central Belfast because the appendix does not provide a mapped Under the Bridge project extent.",
    geometry_precision: "area approximate",
    limitations:
      "The appendix records consultancy contract award only. It does not confirm design approval, works start, public-realm scope, construction completion, access changes, final cost, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_eastside_visitor_centre_hotel_extension_design_contract_awarded_2025",
    date: "2025-04-28",
    bucket: "planning/development/tourism facility design contract award",
    title: "EastSide Visitor Centre hotel and extension design contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed an integrated consultant team for design of a new-build hotel and extension to the EastSide Visitor Centre, awarded to Hall Black Douglas on April 28, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a design-stage consultant-team contract for a hotel and visitor-centre extension project.",
    area: "EastSide Visitor Centre / East Belfast",
    latitude: 54.5980886,
    longitude: -5.8911674,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-eastside-visitor-centre-hotel-extension-design",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Hall Black Douglas was listed as supplier",
    project_type: "tourism facility design contract award",
    geometry_source: "Approximate point placed at EastSide Visitor Centre from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records design contract award only. It does not confirm planning consent, hotel operator, construction start, completion, final design, funding approval, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_upper_crumlin_road_cultural_hub_main_contractor_awarded_2025",
    date: "2025-05-15",
    bucket: "planning/development/cultural facility contract award",
    title: "Upper Crumlin Road Cultural Hub main-contractor contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed BIF_Upper Crumlin Road Cultural Hub main contractor, awarded to CivCo Ltd on May 15, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a main-contractor contract for Upper Crumlin Road Cultural Hub.",
    area: "Upper Crumlin Road / Belfast",
    latitude: 54.625,
    longitude: -5.98,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-upper-crumlin-road-cultural-hub-main-contractor",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "CivCo Ltd was listed as supplier; design team requires separate project records",
    project_type: "cultural facility main-contractor award",
    geometry_source: "Approximate point placed in the Upper Crumlin Road project area because the appendix does not provide a street address.",
    geometry_precision: "area approximate",
    limitations:
      "The appendix records main-contractor award only. It does not confirm construction start, final cultural hub scope, completion, opening, final cost, grant conditions, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_roselawn_crematorium_section_z_feasibility_contract_awarded_2025",
    date: "2025-05-16",
    bucket: "planning/development/civic estate feasibility contract award",
    title: "Roselawn Crematorium Section Z feasibility contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed L1BCC05 Roselawn Crematorium Section Z feasibility, awarded to Doran Consulting on May 16, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a feasibility contract for Section Z at Roselawn Crematorium.",
    area: "Roselawn Crematorium",
    latitude: 54.562,
    longitude: -5.803,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-roselawn-crematorium-section-z-feasibility",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Doran Consulting was listed as supplier; feasibility authors and later recommendations require separate records",
    project_type: "civic estate feasibility contract award",
    geometry_source: "Approximate point placed at Roselawn Crematorium from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records feasibility contract award only. It does not confirm feasibility findings, preferred option, planning consent, works approval, construction start, completion, or later operational change."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cromac_street_condition_survey_pra_contract_awarded_2025",
    date: "2025-06-02",
    bucket: "planning/development/building survey contract award",
    title: "Cromac Street condition-survey and PRA contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed L1BCC06 condition survey and PRA report for three properties on Cromac Street, awarded to Knox & Clayton on June 2, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a condition-survey and PRA-report contract for three Cromac Street properties.",
    area: "Cromac Street / Belfast",
    latitude: 54.5954161,
    longitude: -5.9237888,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-cromac-street-condition-survey-pra",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Knox & Clayton was listed as supplier; individual property survey authors require separate records",
    project_type: "building condition survey contract award",
    geometry_source: "Approximate point placed on Cromac Street because the appendix does not list the three property addresses.",
    geometry_precision: "street approximate",
    limitations:
      "The appendix records condition-survey and PRA-report contract award only. It does not identify the three properties, survey findings, recommended works, planning decisions, construction, final cost, or later building condition."
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
