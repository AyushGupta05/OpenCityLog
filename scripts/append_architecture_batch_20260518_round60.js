const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeNov2022 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=70364";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_plumstead_library_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/library leisure facility",
    title: "Plumstead Library was listed as built",
    summary:
      "New London Architecture records Plumstead Library in Greenwich as built, with completion in February 2020.",
    observed_change:
      "A documented library, leisure, and cultural facility project was recorded as reaching built status.",
    area: "Plumstead / Greenwich",
    latitude: 51.486338,
    longitude: 0.096641,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Plumstead Library",
    source_url: "https://nla.london/projects/plumstead-library",
    source_record_id: "nla-plumstead-library",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown",
    project_type: "library, leisure, and cultural facility completion",
    geometry_source: "NLA project-page map point for 232 Plumstead High Street.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; precise handover, public-service programming, later operating hours, and building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_mandarin_oriental_hotel_completion_2019",
    date: "2019-03-01",
    bucket: "planning/development/architecture/hotel refurbishment",
    title: "Mandarin Oriental Hotel was listed as built",
    summary:
      "New London Architecture records the Mandarin Oriental Hotel project in Westminster as built, with completion in March 2019.",
    observed_change:
      "A documented Knightsbridge hotel refurbishment project was recorded as reaching built status.",
    area: "Knightsbridge / Westminster",
    latitude: 51.5010542,
    longitude: -0.1623136,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Mandarin Oriental Hotel",
    source_url: "https://nla.london/projects/mandarin-oriental-hotel",
    source_record_id: "nla-mandarin-oriental-hotel",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Purcell",
    project_type: "hotel refurbishment completion",
    geometry_source: "NLA project-page map point for 66 Knightsbridge.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; hotel opening sequence, internal fit-out, heritage consents, guest operations, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_115_119_camden_high_street_completion_2021",
    date: "2021-12-01",
    bucket: "planning/development/architecture/hotel mixed use",
    title: "115-119 Camden High Street was listed as built",
    summary:
      "New London Architecture records 115-119 Camden High Street as built, with estimated completion in December 2021.",
    observed_change:
      "A documented Camden High Street hotel-led mixed-use project was recorded as reaching built status.",
    area: "Camden High Street / Camden",
    latitude: 51.538929,
    longitude: -0.142622,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 115-119 Camden High Street",
    source_url: "https://nla.london/projects/115-119-camden-high-street",
    source_record_id: "nla-115-119-camden-high-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Morris+Company",
    project_type: "hotel-led mixed-use completion",
    geometry_source: "NLA project-page map point for the Camden High Street site.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm hotel opening, tenant occupation, final planning conditions, detailed floor areas, or later operational performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_27_29_whitfield_street_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/office refurbishment",
    title: "27-29 Whitfield Street was listed as built",
    summary:
      "New London Architecture records 27-29 Whitfield Street in Camden as built, with completion in March 2020.",
    observed_change:
      "A documented office refurbishment and roof-extension project was recorded as reaching built status.",
    area: "Whitfield Street / Camden",
    latitude: 51.519589,
    longitude: -0.134483,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 27-29 Whitfield Street",
    source_url: "https://nla.london/projects/27-29-whitfield-street",
    source_record_id: "nla-27-29-whitfield-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stagg Architects",
    project_type: "office refurbishment and roof-extension completion",
    geometry_source: "NLA project-page map point for Cyclone House, 27-29 Whitfield Street.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact certificate date, tenant fit-out, occupancy, conservation details, and later use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_collective_auction_rooms_completion_2017",
    date: "2017-11-01",
    bucket: "planning/development/architecture/workspace creative facility",
    title: "Collective Auction Rooms was listed as built",
    summary:
      "New London Architecture records Collective Auction Rooms in Camden as built, with estimated completion in November 2017.",
    observed_change:
      "A documented Camden workspace and creative-startup facility was recorded as reaching built status.",
    area: "Camden Town / Camden",
    latitude: 51.540698,
    longitude: -0.142993,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Collective Auction Rooms",
    source_url: "https://nla.london/projects/collective-auction-rooms",
    source_record_id: "nla-collective-auction-rooms",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "CoDB",
    project_type: "workspace and creative-startup facility completion",
    geometry_source: "NLA project-page map point for 5-7 Buck Street.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm operator launch, tenant mix, public access, later redevelopment, or business outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_astoria_senior_housing_developer_selection_2021",
    date: "2021-01-13",
    bucket: "planning/development/architecture/housing developer selection",
    title: "Astoria senior-housing development team was selected",
    summary:
      "NYC HPD announced on January 13, 2021 that HANAC and Mega Development LLC had been selected for the city-owned senior-housing site at 31-07 31st Street in Astoria.",
    observed_change:
      "A documented HPD announcement selected a development team for a mixed-use affordable senior-housing project.",
    area: "Astoria / Queens",
    latitude: 40.764130435146,
    longitude: -73.923544259516,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Astoria senior-housing development-team selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/001-21/city-selects-development-partners-build-affordable-senior-housing-city-owned-site-queens",
    source_record_id: "nyc-hpd-2021-01-13-astoria-senior-housing-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "SLCE Architects",
    project_type: "mixed-use affordable senior housing developer selection",
    geometry_source: "US Census geocoder point for 31-07 31st Street, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm financing, land-use approval, construction start, completion, lease-up, community-center opening, commercial tenancy, or later building performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_beach_green_dunes_ii_groundbreaking_2018",
    date: "2018-06-01",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Beach Green Dunes II broke ground",
    summary:
      "NYC HDC recorded on June 1, 2018 that HPD, HDC, and development partners broke ground on Beach Green Dunes II in Far Rockaway.",
    observed_change:
      "A documented public housing-agency announcement recorded the construction-start milestone for a resilient affordable-housing development.",
    area: "Far Rockaway / Queens",
    latitude: 40.593545709626,
    longitude: -73.776497501421,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC press release: Beach Green Dunes II groundbreaking",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-and-hdc-join-development-partners-break-ground-new-resilient-queens-development",
    source_record_id: "nyc-hdc-2018-06-01-beach-green-dunes-ii-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Curtis + Ginsberg Architects LLP",
    project_type: "resilient affordable housing groundbreaking",
    geometry_source: "US Census geocoder point for 45-17 Rockaway Beach Boulevard, used as an approximate Beach Green Dunes II site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone. It does not confirm construction progress after June 2018, final completion, lease-up, resident move-in, flood-resilience performance, or long-term building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_90_sands_opening_2022",
    date: "2022-11-03",
    bucket: "planning/development/architecture/hotel conversion housing opening",
    title: "90 Sands opened as affordable and supportive housing",
    summary:
      "NYC HPD recorded on November 3, 2022 the opening of 90 Sands, a former hotel converted into affordable and supportive housing in Brooklyn.",
    observed_change:
      "A documented city announcement recorded the opening of a hotel-conversion affordable and supportive housing project.",
    area: "DUMBO / Brooklyn",
    latitude: 40.699921399634,
    longitude: -73.9877152882,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 90 Sands opening",
    source_url:
      "https://www.nyc.gov/site/hpd/news/056-22/mayor-adams-celebrates-opening-90-sands-former-hotel-reimagined-affordable-supportive",
    source_record_id: "nyc-hpd-2022-11-03-90-sands-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Beyer Blinder Belle; W Architecture and Planning for public plaza",
    project_type: "hotel conversion to affordable and supportive housing opening",
    geometry_source: "US Census geocoder point for 90 Sands Street, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening announcement. It does not confirm every resident move-in, service delivery, supportive-housing outcomes, long-term operations, plaza programming, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_stonewall_house_opening_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/senior housing opening",
    title: "Stonewall House opened in Fort Greene",
    summary:
      "SAGE records that Stonewall House, an LGBTQ-friendly housing development for older adults in Fort Greene, opened in December 2019.",
    observed_change:
      "A documented service-organization source recorded the opening month for a senior affordable-housing development.",
    area: "Fort Greene / Brooklyn",
    latitude: 40.693871172594,
    longitude: -73.977987521406,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "SAGE article: Stonewall House opening context",
    source_url: "https://www.sageusa.org/news/inside-a-home-for-l-g-b-t-q-seniors-i-made-friends-here/",
    source_record_id: "sage-stonewall-house-opened-december-2019",
    source_retrieved_at: retrievedAt,
    source_date_field: "SAGE article opening month",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cited SAGE page does not name the project architect",
    project_type: "LGBTQ-friendly affordable senior housing opening",
    geometry_source: "US Census geocoder point for 112 Saint Edwards Street, used as an approximate Stonewall House site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening month from a public article. It does not confirm exact ribbon-cutting date, every resident move-in, service delivery, affordability compliance, or later building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gowanus_green_affordable_housing_announcement_2020",
    date: "2020-11-19",
    bucket: "planning/development/architecture/housing public realm announcement",
    title: "Gowanus Green affordable-housing project was announced",
    summary:
      "NYC HPD announced on November 19, 2020 that Gowanus Green would be a 100 percent affordable-housing project with resilient public spaces.",
    observed_change:
      "A documented HPD announcement recorded the project scope and affordable-housing commitment for the city-owned Gowanus Green site.",
    area: "Gowanus / Brooklyn",
    latitude: 40.677435750201,
    longitude: -73.996473056682,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Gowanus Green affordable-housing project",
    source_url: "https://www.nyc.gov/site/hpd/news/051-20/hpd-100-percent-affordable-housing-project-gowanus",
    source_record_id: "nyc-hpd-2020-11-19-gowanus-green-announcement",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Marvel Architects / SCAPE Landscape Architects",
    project_type: "affordable housing and resilient public-space project announcement",
    geometry_source: "US Census geocoder point for Smith Street and 5th Street, used as an approximate marker for the Gowanus Green site context named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a project announcement and affordability commitment. It does not confirm rezoning approval, financing close, construction start, completion, public-space delivery, school delivery, or later building performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_boodles_dam_works_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/environmental works completion",
    title: "Boodles Dam works were reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Boodles Dam works to the dam and environmental improvements among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded completed dam and environmental improvement works.",
    area: "Boodles Dam / Ligoniel",
    latitude: 54.6292249,
    longitude: -5.9816007,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-boodles-dam-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "dam and environmental improvement works completion",
    geometry_source: "Approximate point placed at Boodles Dam from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, works package, contractor, ecological monitoring, maintenance responsibilities, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_clarawood_playground_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/playground completion",
    title: "Clarawood Playground was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Clarawood Playground among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed playground capital project.",
    area: "Clarawood / East Belfast",
    latitude: 54.5875016,
    longitude: -5.8670215,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-clarawood-playground-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this completed-project list item",
    project_type: "playground completion",
    geometry_source: "Approximate point placed at Clarawood Millennium Park from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, playground specification, accessibility audit, contractor, final cost, opening event, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cavehill_adventurous_playground_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/playground completion",
    title: "Cavehill Adventurous Playground was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Cavehill Adventurous Playground among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed adventurous-playground capital project.",
    area: "Cavehill / North Belfast",
    latitude: 54.644329,
    longitude: -5.939876,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-cavehill-adventurous-playground-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this completed-project list item",
    project_type: "adventurous playground completion",
    geometry_source: "Approximate point placed at Cavehill Adventurous Playground from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, equipment schedule, accessibility audit, contractor, final cost, opening event, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ormeau_park_park_road_playground_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/playground completion",
    title: "Ormeau Park Park Road Playground was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Ormeau Park (Park Road) Playground among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed playground capital project at Ormeau Park.",
    area: "Ormeau Park / South Belfast",
    latitude: 54.5854569,
    longitude: -5.9156597,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-ormeau-park-park-road-playground-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this completed-project list item",
    project_type: "playground completion",
    geometry_source: "Approximate point placed at Ormeau Park from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, equipment schedule, Park Road boundary detail, contractor, final cost, opening event, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waterfront_icc_escalators_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/venue accessibility completion",
    title: "Waterfront and ICC escalators were reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Waterfront / ICC escalators among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded completed escalator works at the Waterfront / ICC venue complex.",
    area: "Waterfront Hall / ICC Belfast",
    latitude: 54.5967498,
    longitude: -5.9196473,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-waterfront-icc-escalators-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "venue escalator works completion",
    geometry_source: "Approximate point placed at Waterfront Hall / ICC Belfast from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, escalator specification, access certification, contractor, final cost, downtime, or later maintenance condition."
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
