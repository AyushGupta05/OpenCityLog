const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCompletedProjectsJun2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s115927/Appendix%201%20-%20PP%20Completed%20projects%20June%202024.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_new_union_wharf_completion_2022",
    date: "2022-06-01",
    bucket: "planning/development/architecture/estate regeneration",
    title: "New Union Wharf was listed as built",
    summary:
      "New London Architecture records New Union Wharf in Tower Hamlets as built, with completion in June 2022.",
    observed_change:
      "A documented Thames-side estate-regeneration project on the Isle of Dogs was recorded as reaching built status.",
    area: "Isle of Dogs / Tower Hamlets",
    latitude: 51.495,
    longitude: -0.012,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: New Union Wharf",
    source_url: "https://nla.london/projects/new-union-wharf",
    source_record_id: "nla-new-union-wharf",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Jestico + Whiles",
    project_type: "estate regeneration",
    geometry_source: "Approximate point placed on the Isle of Dogs Thames-side project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; rehousing, tenure mix, occupancy, riverfront access, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_farm_street_completion_2021",
    date: "2021-01-01",
    bucket: "planning/development/architecture/mixed use housing",
    title: "Farm Street was listed as built",
    summary:
      "New London Architecture records Farm Street in Westminster as built, with completion in 2021.",
    observed_change:
      "A documented Mayfair housing and mixed-use development was recorded as reaching built status.",
    area: "Mayfair / Westminster",
    latitude: 51.51,
    longitude: -0.151,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Farm Street",
    source_url: "https://nla.london/projects/farm-street",
    source_record_id: "nla-farm-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "MSMR Architects",
    project_type: "mixed-use housing development",
    geometry_source: "Approximate point placed on Farm Street in Mayfair from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; tenure mix, occupation, public-realm arrangements, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_repton_gardens_completion_2023",
    date: "2023-02-01",
    bucket: "planning/development/architecture/build to rent",
    title: "Repton Gardens was listed as built",
    summary:
      "New London Architecture records Repton Gardens in Brent as built, with completion in February 2023.",
    observed_change:
      "A documented build-to-rent development at Wembley Park was recorded as reaching built status.",
    area: "Wembley Park / Brent",
    latitude: 51.558,
    longitude: -0.283,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Repton Gardens",
    source_url: "https://nla.london/projects/repton-gardens-1",
    source_record_id: "nla-repton-gardens-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GRID",
    project_type: "build-to-rent residential development",
    geometry_source: "Approximate point placed at Wembley Park from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupancy, rent levels, public-realm management, and later Wembley Park phasing require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_greenwich_housing_completion_2021",
    date: "2021-01-01",
    bucket: "planning/development/architecture/housing",
    title: "Greenwich Housing was listed as built",
    summary:
      "New London Architecture records Greenwich Housing in Greenwich as built, with completion in 2021.",
    observed_change:
      "A documented housing scheme associated with Greenwich's borough housing programme was recorded as reaching built status.",
    area: "Royal Borough of Greenwich",
    latitude: 51.489,
    longitude: 0.065,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Greenwich Housing",
    source_url: "https://nla.london/projects/greenwich-housing",
    source_record_id: "nla-greenwich-housing",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "shedkm",
    project_type: "borough housing scheme",
    geometry_source: "Approximate borough-level point because the source describes a Greenwich housing scheme but does not provide a mapped parcel in the extracted fields.",
    geometry_precision: "borough approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; exact site boundary, allocation, occupancy, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_in2space_housing_completion_2018",
    date: "2018-09-01",
    bucket: "planning/development/architecture/housing",
    title: "in2space housing was listed as built",
    summary:
      "New London Architecture records in2space housing in Sutton as built, with completion in September 2018.",
    observed_change:
      "A documented compact housing project on a constrained backland site in Sutton was recorded as reaching built status.",
    area: "Sutton",
    latitude: 51.361,
    longitude: -0.195,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: in2space housing",
    source_url: "https://nla.london/projects/in2space-housing",
    source_record_id: "nla-in2space-housing",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lloyd Thomas Architects",
    project_type: "compact housing project",
    geometry_source: "Approximate point placed in Sutton from the named project context because the source does not provide a parcel boundary in extracted fields.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact parcel boundary, occupancy, performance, and later management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_paperific_text_adopted_2023",
    date: "2023-05-25",
    bucket: "planning/development/zoning/mixed use",
    title: "Paperific zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Paperific, N 220471 ZRK, with an adopted date of May 25, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the Paperific project area in Brooklyn.",
    area: "Brooklyn",
    latitude: 40.64,
    longitude: -73.95,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Paperific",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/paperific-n-220471-zrk",
    source_record_id: "nyc-zr-paperific-n-220471-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate Brooklyn project point because the zoning page title does not provide a street address in the extracted fields.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_south_richmond_zoning_relief_text_adopted_2023",
    date: "2023-11-02",
    bucket: "planning/development/zoning/contextual relief",
    title: "South Richmond Zoning Relief was adopted",
    summary:
      "The NYC Zoning Resolution records South Richmond Zoning Relief, N 230112 ZRR, with an adopted date of November 2, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the South Richmond area of Staten Island.",
    area: "South Richmond / Staten Island",
    latitude: 40.545,
    longitude: -74.18,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: South Richmond Zoning Relief",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/south-richmond-zoning-relief-n-230112-zrr",
    source_record_id: "nyc-zr-south-richmond-zoning-relief-n-230112-zrr",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "area-related zoning text amendment",
    geometry_source: "Approximate district point placed in South Richmond rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, infrastructure changes, environmental review outcomes, or later site-specific designs."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_23_01_steinway_street_text_adopted_2024",
    date: "2024-04-11",
    bucket: "planning/development/zoning/residential mixed use",
    title: "23-01 Steinway Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 23-01 Steinway Street, N 230308 ZRQ, with an adopted date of April 11, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 23-01 Steinway Street project area in Queens.",
    area: "Astoria / Queens",
    latitude: 40.771,
    longitude: -73.907,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 23-01 Steinway Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/23-01-steinway-street-n-230308-zrq",
    source_record_id: "nyc-zr-23-01-steinway-street-n-230308-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Steinway Street project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_30_11_12th_street_text_adopted_2024",
    date: "2024-04-11",
    bucket: "planning/development/zoning/residential mixed use",
    title: "30-11 12th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 30-11 12th Street, N 230127 ZRQ, with an adopted date of April 11, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 30-11 12th Street project area in Queens.",
    area: "Astoria / Queens",
    latitude: 40.769,
    longitude: -73.935,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 30-11 12th Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/30-11-12th-street-n-230127-zrq",
    source_record_id: "nyc-zr-30-11-12th-street-n-230127-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named 12th Street project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_396_400_avenue_x_text_adopted_2024",
    date: "2024-04-11",
    bucket: "planning/development/zoning/residential mixed use",
    title: "396-400 Avenue X zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 396-400 Avenue X, N 230382 ZRK, with an adopted date of April 11, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 396-400 Avenue X project area in Brooklyn.",
    area: "Avenue X / Brooklyn",
    latitude: 40.59,
    longitude: -73.969,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 396-400 Avenue X",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/396-400-avenue-x-n-230382-zrk",
    source_record_id: "nyc-zr-396-400-avenue-x-n-230382-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Avenue X project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_northlink_playground_improvement_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/playground public realm",
    title: "Northlink playground improvement was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Playground Improvement - Northlink among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed playground-improvement project at Northlink.",
    area: "Northlink",
    latitude: 54.613,
    longitude: -5.931,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-northlink-playground-improvement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/play project team; design team not named in the appendix",
    project_type: "playground improvement completion",
    geometry_source: "Approximate point placed at Northlink because the appendix does not map the playground works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, play-equipment specification, contract record, cost, accessibility outcome, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bredagh_gac_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/sports infrastructure",
    title: "Bredagh GAC project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Bredagh GAC among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project associated with Bredagh GAC.",
    area: "Bredagh GAC / South Belfast",
    latitude: 54.55,
    longitude: -5.92,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-bredagh-gac",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/open-space project team; design team not named in the appendix",
    project_type: "sports facility completion",
    geometry_source: "Approximate South Belfast project point because the appendix names the club but does not map the works location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lorag_community_garden_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/community garden",
    title: "LORAG community garden was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed LORAG - community garden among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed community-garden project associated with LORAG.",
    area: "Lower Ormeau / LORAG",
    latitude: 54.584,
    longitude: -5.922,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-lorag-community-garden",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and community-garden project partners; design team not named in the appendix",
    project_type: "community garden completion",
    geometry_source: "Approximate point placed in the Lower Ormeau/LORAG project context because the appendix does not map the garden.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, garden design, contract record, cost, access arrangements, maintenance plan, or community-use outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_tullycarnet_outdoor_gym_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/outdoor gym public realm",
    title: "Tullycarnet Outdoor Gym was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Tullycarnet Outdoor Gym among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed outdoor-gym project at Tullycarnet.",
    area: "Tullycarnet",
    latitude: 54.589,
    longitude: -5.805,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-tullycarnet-outdoor-gym",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/leisure project team; design team not named in the appendix",
    project_type: "outdoor gym completion",
    geometry_source: "Approximate point placed at Tullycarnet because the appendix does not map the gym equipment.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, equipment specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_somme_cross_community_memorial_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/memorial public realm",
    title: "Somme cross-community memorial was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Somme - cross community memorial among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed cross-community memorial project associated with the Somme.",
    area: "Belfast",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-somme-cross-community-memorial",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and memorial project partners; design team not named in the appendix",
    project_type: "cross-community memorial completion",
    geometry_source: "Approximate Belfast City Hall point because the appendix does not map the memorial location.",
    geometry_precision: "citywide approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, memorial location, design, approvals, cost, maintenance plan, or interpretation details."
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
