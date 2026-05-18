const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCompletedProjectsJun2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s115927/Appendix%201%20-%20PP%20Completed%20projects%20June%202024.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_kingston_riverside_affordable_workspace_completion_2025",
    date: "2025-07-01",
    bucket: "planning/development/architecture/affordable workspace creative hub",
    title: "Kingston Riverside affordable workspace and creative hub was listed as built",
    summary:
      "New London Architecture records Kingston Riverside Affordable Workspace and Creative Hub in Kingston upon Thames as built, with completion in July 2025.",
    observed_change:
      "A documented riverside affordable workspace and creative-hub project was recorded as reaching built status.",
    area: "Kingston Riverside",
    latitude: 51.412,
    longitude: -0.306,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kingston Riverside Affordable Workspace and Creative Hub",
    source_url: "https://nla.london/projects/kingston-riverside-affordable-workspace-and-creative-hub",
    source_record_id: "nla-kingston-riverside-affordable-workspace-and-creative-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "affordable workspace and creative hub",
    geometry_source: "Approximate point placed on Kingston Riverside from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; workspace allocation, cultural programming, tenancy, and later riverside management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_imperial_college_school_public_health_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/education research",
    title: "Imperial College School of Public Health was listed as built",
    summary:
      "New London Architecture records Imperial College School of Public Health in Hammersmith as built, with completion in January 2023.",
    observed_change:
      "A documented university public-health research and teaching building was recorded as reaching built status.",
    area: "White City / Hammersmith",
    latitude: 51.517,
    longitude: -0.226,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Imperial College School of Public Health",
    source_url: "https://nla.london/projects/imperial-college-school-of-public-health",
    source_record_id: "nla-imperial-college-school-of-public-health",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "university research and teaching building",
    geometry_source: "Approximate point placed at Imperial College London's White City/Hammersmith campus context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, research programme changes, public access, and campus operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bulrush_court_affordable_homes_completion_2024",
    date: "2024-05-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Bulrush Court affordable homes were listed as built",
    summary:
      "New London Architecture records Bulrush Court in Tower Hamlets as built, with completion in May 2024.",
    observed_change:
      "A documented affordable-housing project arranged around a communal courtyard was recorded as reaching built status.",
    area: "Tower Hamlets",
    latitude: 51.514,
    longitude: -0.039,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bulrush Court",
    source_url: "https://nla.london/projects/bulrush-court",
    source_record_id: "nla-bulrush-court",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pitman Tozer Architects Ltd",
    project_type: "affordable housing courtyard block",
    geometry_source: "Approximate point placed in the Tower Hamlets project context because the NLA page does not provide a parcel boundary.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocation, occupancy, courtyard management, and long-term estate operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_jazz_yard_completion_2023",
    date: "2023-02-01",
    bucket: "planning/development/architecture/mixed use housing",
    title: "The Jazz Yard was listed as built",
    summary:
      "New London Architecture records The Jazz Yard in Waltham Forest as built, with completion in February 2023.",
    observed_change:
      "A documented mixed-use residential-led development in Waltham Forest was recorded as reaching built status.",
    area: "Walthamstow / Waltham Forest",
    latitude: 51.586,
    longitude: -0.021,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Jazz Yard",
    source_url: "https://nla.london/projects/the-jazz-yard",
    source_record_id: "nla-the-jazz-yard",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "mixed-use residential-led development",
    geometry_source: "Approximate point placed in Walthamstow/Waltham Forest from the named project context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure, occupation, commercial use, and later masterplan phases require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_greenwich_square_completion_2020",
    date: "2020-08-01",
    bucket: "planning/development/architecture/regeneration public realm",
    title: "Greenwich Square was listed as built",
    summary:
      "New London Architecture records Greenwich Square in Greenwich as built, with completion in August 2020.",
    observed_change:
      "A documented regeneration project with a public piazza and community facilities was recorded as reaching built status.",
    area: "East Greenwich / Greenwich Square",
    latitude: 51.482,
    longitude: 0.004,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Greenwich Square",
    source_url: "https://nla.london/projects/greenwich-square",
    source_record_id: "nla-greenwich-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Make and KDS",
    project_type: "mixed-use regeneration and public realm",
    geometry_source: "Approximate point placed at Greenwich Square from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; phasing, public-realm management, community-facility operation, and later estate changes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1460_1480_sheridan_boulevard_text_adopted_2023",
    date: "2023-09-28",
    bucket: "planning/development/zoning/residential mixed use",
    title: "1460-1480 Sheridan Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1460-1480 Sheridan Boulevard, N 230292 ZRX, with an adopted date of September 28, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1460-1480 Sheridan Boulevard project area in the Bronx.",
    area: "Sheridan Boulevard / Bronx",
    latitude: 40.83,
    longitude: -73.89,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1460-1480 Sheridan Boulevard",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/1460-1480-sheridan-boulevard-n-230292-zrx",
    source_record_id: "nyc-zr-1460-1480-sheridan-boulevard-n-230292-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Sheridan Boulevard project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_893_eagle_avenue_text_adopted_2023",
    date: "2023-09-14",
    bucket: "planning/development/zoning/residential mixed use",
    title: "893 Eagle Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 893 Eagle Avenue, N 220335 ZRX, with an adopted date of September 14, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 893 Eagle Avenue project area in the Bronx.",
    area: "Eagle Avenue / Bronx",
    latitude: 40.819,
    longitude: -73.909,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 893 Eagle Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/893-eagle-avenue-n-220335-zrx",
    source_record_id: "nyc-zr-893-eagle-avenue-n-220335-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Eagle Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_ocean_crest_text_adopted_2023",
    date: "2023-08-03",
    bucket: "planning/development/zoning/residential mixed use",
    title: "Ocean Crest zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Ocean Crest, N 230042 ZRQ, with an adopted date of August 3, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the Ocean Crest project area in Queens.",
    area: "Far Rockaway / Queens",
    latitude: 40.598,
    longitude: -73.753,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Ocean Crest",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/ocean-crest-n-230042-zrq",
    source_record_id: "nyc-zr-ocean-crest-n-230042-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate district point placed in the Far Rockaway/Ocean Crest project context, not a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, coastal resilience works, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_7120_new_utrecht_avenue_text_adopted_2023",
    date: "2023-08-03",
    bucket: "planning/development/zoning/residential mixed use",
    title: "7120 New Utrecht Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 7120 New Utrecht Avenue, N 230002 ZRK, with an adopted date of August 3, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 7120 New Utrecht Avenue project area in Brooklyn.",
    area: "New Utrecht Avenue / Brooklyn",
    latitude: 40.616,
    longitude: -73.998,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 7120 New Utrecht Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/7120-new-utrecht-avenue-n-230002-zrk",
    source_record_id: "nyc-zr-7120-new-utrecht-avenue-n-230002-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named New Utrecht Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1656_west_10th_street_text_adopted_2023",
    date: "2023-07-13",
    bucket: "planning/development/zoning/residential mixed use",
    title: "1656 West 10th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1656 West 10th Street, N 220286 ZRK, with an adopted date of July 13, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1656 West 10th Street project area in Brooklyn.",
    area: "West 10th Street / Brooklyn",
    latitude: 40.604,
    longitude: -73.986,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1656 West 10th Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/1656-west-10th-street-n-220286-zrk",
    source_record_id: "nyc-zr-1656-west-10th-street-n-220286-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named West 10th Street project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_statues_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/civic heritage public realm",
    title: "City Hall Statues project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed City Hall Statues among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed civic-heritage public-realm project at City Hall.",
    area: "Belfast City Hall",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-city-hall-statues",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and civic heritage project team; design team not named in the appendix",
    project_type: "civic heritage public-realm completion",
    geometry_source: "Approximate point placed at Belfast City Hall because the appendix does not map the statue works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, statue specification, approvals, cost, maintenance plan, or interpretive outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_pitt_park_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/park public realm",
    title: "Pitt Park project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Pitt Park among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project at Pitt Park.",
    area: "Pitt Park",
    latitude: 54.606,
    longitude: -5.916,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-pitt-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/open-space project team; design team not named in the appendix",
    project_type: "park public-realm completion",
    geometry_source: "Approximate point placed at Pitt Park because the appendix does not map the works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or use outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_sandown_road_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/active travel infrastructure",
    title: "Belfast Bikes Expansion at Sandown Road was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Belfast Bikes Expansion - Sandown Rd among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed Belfast Bikes expansion project at Sandown Road.",
    area: "Sandown Road",
    latitude: 54.596,
    longitude: -5.871,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-belfast-bikes-sandown-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "cycle-share infrastructure completion",
    geometry_source: "Approximate point placed on Sandown Road because the appendix does not map the docking station or works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, docking-station specification, cost, operational start, ridership, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_drumglass_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/active travel infrastructure",
    title: "Belfast Bikes Expansion at Drumglass was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Belfast Bikes Expansion - Drumglass among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed Belfast Bikes expansion project at Drumglass.",
    area: "Drumglass",
    latitude: 54.58,
    longitude: -5.94,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-belfast-bikes-drumglass",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "cycle-share infrastructure completion",
    geometry_source: "Approximate point placed in the Drumglass area because the appendix does not map the docking station or works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, docking-station specification, cost, operational start, ridership, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_loughside_playground_improvement_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/playground public realm",
    title: "Loughside playground improvement was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Playground Improvement - Loughside among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed playground-improvement project at Loughside.",
    area: "Loughside",
    latitude: 54.621,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-loughside-playground-improvement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/play project team; design team not named in the appendix",
    project_type: "playground improvement completion",
    geometry_source: "Approximate point placed in the Loughside area because the appendix does not map the playground works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, play-equipment specification, contract record, cost, accessibility outcome, or maintenance plan."
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
