const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCompletedProjectsDec2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s119193/Appendix%201%20-%20Physical%20Programme%20Completed%20projects%20Dec%2024.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_baylis_road_pocket_park_completion_2020",
    date: "2020-08-01",
    bucket: "planning/development/architecture/pocket park public realm",
    title: "Baylis Road Pocket Park was listed as built",
    summary:
      "New London Architecture records Baylis Road Pocket Park in Lambeth as built, with completion in August 2020.",
    observed_change:
      "A documented pocket-park and public-realm project in Waterloo was recorded as reaching built status.",
    area: "Waterloo / Baylis Road",
    latitude: 51.5005,
    longitude: -0.1117,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Baylis Road Pocket Park",
    source_url: "https://nla.london/projects/baylis-road-pocket-park",
    source_record_id: "nla-baylis-road-pocket-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Weston Williamson+Partners",
    project_type: "pocket park and public realm",
    geometry_source: "Approximate point placed on Baylis Road in Waterloo from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; adoption, maintenance, footfall, and public-realm performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_arbour_brent_cross_west_station_completion_2023",
    date: "2023-12-01",
    bucket: "planning/development/architecture/station public realm",
    title: "The Arbour at Brent Cross West station was listed as built",
    summary:
      "New London Architecture records The Arbour at Brent Cross West station in Barnet as built, with completion in December 2023.",
    observed_change:
      "A documented station canopy and arrival-space project at Brent Cross West was recorded as reaching built status.",
    area: "Brent Cross West station",
    latitude: 51.568,
    longitude: -0.226,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Arbour at Brent Cross West station",
    source_url: "https://nla.london/projects/the-arbour-at-brent-cross-west-station",
    source_record_id: "nla-the-arbour-at-brent-cross-west-station",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "shedkm",
    project_type: "station canopy and public-realm arrival space",
    geometry_source: "Approximate point placed at Brent Cross West station from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; railway service start, passenger use, maintenance, and wider Brent Cross Town phasing require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_your_new_town_hall_brixton_completion_2023",
    date: "2023-10-01",
    bucket: "planning/development/architecture/civic workplace",
    title: "Your New Town Hall, Brixton was listed as built",
    summary:
      "New London Architecture records Your New Town Hall, Brixton in Lambeth as built, with completion in October 2023.",
    observed_change:
      "A documented civic accommodation and town-hall estate project in Brixton was recorded as reaching built status.",
    area: "Brixton / Lambeth Town Hall",
    latitude: 51.4613,
    longitude: -0.1164,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Your New Town Hall, Brixton",
    source_url: "https://nla.london/projects/your-new-town-hall-brixton",
    source_record_id: "nla-your-new-town-hall-brixton",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Cartwright Pickard",
    project_type: "civic estate and workplace project",
    geometry_source: "Approximate point placed at Lambeth Town Hall/Brixton civic centre from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; public-service changes, office occupation, estate rationalisation, and civic access require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_rathbone_market_canning_town_completion_2017",
    date: "2017-11-01",
    bucket: "planning/development/architecture/market housing public realm",
    title: "Rathbone Market, Canning Town was listed as built",
    summary:
      "New London Architecture records Rathbone Market, Canning Town in Newham as built, with completion in November 2017.",
    observed_change:
      "A documented market-centred neighbourhood and public-realm project in Canning Town was recorded as reaching built status.",
    area: "Canning Town / Rathbone Market",
    latitude: 51.5145,
    longitude: 0.0082,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Rathbone Market, Canning Town",
    source_url: "https://nla.london/projects/rathbone-market-canning-town",
    source_record_id: "nla-rathbone-market-canning-town",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Project Orange",
    project_type: "market-centred housing and public-realm neighbourhood project",
    geometry_source: "Approximate point placed at Rathbone Market in Canning Town from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; market operation, tenancy, public-realm management, and later regeneration phases require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_daventry_house_lisson_arches_completion_2023",
    date: "2023-09-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Daventry House, Lisson Arches was listed as built",
    summary:
      "New London Architecture records Daventry House, Lisson Arches in Westminster as built, with completion in September 2023.",
    observed_change:
      "A documented community-supported affordable housing scheme was recorded as reaching built status in Lisson Arches.",
    area: "Lisson Arches / Westminster",
    latitude: 51.522,
    longitude: -0.168,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Daventry House, Lisson Arches",
    source_url: "https://nla.london/projects/daventry-house-lisson-arches",
    source_record_id: "nla-daventry-house-lisson-arches",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Mae Architects Ltd",
    project_type: "affordable housing scheme",
    geometry_source: "Approximate point placed at the Lisson Arches project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocation, occupancy, support services, and long-term management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_280_bergen_street_text_adopted_2022",
    date: "2022-12-07",
    bucket: "planning/development/zoning/residential mixed use",
    title: "280 Bergen Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 280 Bergen Street, N 220189 ZRK, with an adopted date of December 7, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the 280 Bergen Street project area in Brooklyn.",
    area: "Boerum Hill / Brooklyn",
    latitude: 40.6855,
    longitude: -73.9823,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 280 Bergen Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/280-bergen-street-n-220189-zrk",
    source_record_id: "nyc-zr-280-bergen-street-n-220189-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Bergen Street project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_ninth_street_rezoning_text_adopted_2022",
    date: "2022-10-27",
    bucket: "planning/development/zoning/mixed use",
    title: "Ninth Street Rezoning zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Ninth Street Rezoning, N 210349 ZRK, with an adopted date of October 27, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Ninth Street Rezoning project area in Brooklyn.",
    area: "Gowanus / Brooklyn",
    latitude: 40.673,
    longitude: -73.994,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Ninth Street Rezoning",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/ninth-street-rezoning-n-210349-zrk",
    source_record_id: "nyc-zr-ninth-street-rezoning-n-210349-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "area-related zoning text amendment",
    geometry_source: "Approximate district point placed in the Ninth Street/Gowanus project context, not a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, infrastructure delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bruckner_boulevard_sites_text_adopted_2022",
    date: "2022-10-12",
    bucket: "planning/development/zoning/residential mixed use",
    title: "Bruckner Boulevard Sites zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Bruckner Boulevard Sites, N 220008 ZRX, with an adopted date of October 12, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Bruckner Boulevard Sites project area in the Bronx.",
    area: "Bruckner Boulevard / Bronx",
    latitude: 40.809,
    longitude: -73.85,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Bruckner Boulevard Sites",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/bruckner-boulevard-sites-n-220008-zrx",
    source_record_id: "nyc-zr-bruckner-boulevard-sites-n-220008-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "multi-site zoning text amendment",
    geometry_source: "Approximate corridor point placed on Bruckner Boulevard in the Bronx, not mapped zoning boundaries.",
    geometry_precision: "corridor approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_2080_mcdonald_avenue_text_adopted_2022",
    date: "2022-10-12",
    bucket: "planning/development/zoning/residential mixed use",
    title: "2080 McDonald Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2080 McDonald Avenue, N 210175 ZRK, with an adopted date of October 12, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2080 McDonald Avenue project area in Brooklyn.",
    area: "McDonald Avenue / Brooklyn",
    latitude: 40.6028,
    longitude: -73.9724,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2080 McDonald Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2080-mcdonald-avenue-n-210175-zrk",
    source_record_id: "nyc-zr-2080-mcdonald-avenue-n-210175-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named McDonald Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_40_25_crescent_street_text_adopted_2022",
    date: "2022-10-12",
    bucket: "planning/development/zoning/residential mixed use",
    title: "40-25 Crescent Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 40-25 Crescent Street, N 220170 ZRQ, with an adopted date of October 12, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the 40-25 Crescent Street project area in Long Island City.",
    area: "Long Island City / Queens",
    latitude: 40.7555,
    longitude: -73.9362,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 40-25 Crescent Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/40-25-crescent-street-n-220170-zrq",
    source_record_id: "nyc-zr-40-25-crescent-street-n-220170-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Crescent Street project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cherryvale_pitch_1_improvements_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports infrastructure",
    title: "Cherryvale Pitch 1 improvements were reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Pitch improvements - Cherryvale Pitch 1 among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded pitch-improvement works at Cherryvale Pitch 1.",
    area: "Cherryvale Playing Fields",
    latitude: 54.576,
    longitude: -5.904,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-cherryvale-pitch-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/sports project team; design team not named in the appendix",
    project_type: "sports pitch improvement completion",
    geometry_source: "Approximate point placed at Cherryvale Playing Fields because the appendix does not map the pitch works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cavehill_tennis_club_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports infrastructure",
    title: "Cavehill Tennis Club project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Cavehill Tennis Club among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project at Cavehill Tennis Club.",
    area: "Cavehill Tennis Club",
    latitude: 54.632,
    longitude: -5.947,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-cavehill-tennis-club",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/open-space project team; design team not named in the appendix",
    project_type: "sports facility completion",
    geometry_source: "Approximate point placed at Cavehill Tennis Club from the named facility.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_brook_changing_pavilion_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports pavilion",
    title: "Brook Changing Pavilion was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Brook Changing Pavilion among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed changing-pavilion project at Brook.",
    area: "Brook Leisure Centre / Twinbrook area",
    latitude: 54.547,
    longitude: -6.001,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-brook-changing-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/leisure project team; design team not named in the appendix",
    project_type: "sports changing pavilion completion",
    geometry_source: "Approximate point placed near the Brook leisure/sports facility context because the appendix does not map the pavilion.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, pavilion specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_woodvale_park_muga_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports public realm",
    title: "Woodvale Park MUGA was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Woodvale Park (MUGA) among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed multi-use games area project at Woodvale Park.",
    area: "Woodvale Park",
    latitude: 54.608,
    longitude: -5.961,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-woodvale-park-muga",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/sports project team; design team not named in the appendix",
    project_type: "multi-use games area completion",
    geometry_source: "Approximate point placed at Woodvale Park because the appendix does not map the MUGA.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, court specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waterfront_hall_wc_refurbishment_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/civic venue refurbishment",
    title: "Waterfront Hall WC refurbishment was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Waterfront Hall - WC Refurbishment Project among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed WC refurbishment project at Waterfront Hall.",
    area: "Waterfront Hall",
    latitude: 54.5962,
    longitude: -5.9162,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-waterfront-hall-wc-refurbishment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and civic venue project team; design team not named in the appendix",
    project_type: "civic venue refurbishment completion",
    geometry_source: "Approximate point placed at Waterfront Hall because the appendix does not map the internal refurbishment area.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, refurbishment specification, contract record, cost, accessibility outcome, or maintenance plan."
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
