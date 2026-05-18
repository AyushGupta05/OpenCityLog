const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeNov2022 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=70364";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_officers_house_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/mixed use heritage",
    title: "The Officers' House was listed as built",
    summary:
      "New London Architecture records The Officers' House at Woolwich Arsenal as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Greenwich mixed-use and heritage-adjacent project was recorded as reaching built status.",
    area: "Woolwich Arsenal / Greenwich",
    latitude: 51.4925243,
    longitude: 0.0734459,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Officers' House",
    source_url: "https://nla.london/projects/the-officers-house",
    source_record_id: "nla-the-officers-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris",
    project_type: "mixed-use heritage-adjacent completion",
    geometry_source: "Nominatim geocoder point for 23 Arsenal Way, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover, retail occupation, transport access changes, heritage conditions, or later building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_sports_hall_kings_cross_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/sports facility",
    title: "Sports Hall, King's Cross was listed as built",
    summary:
      "New London Architecture records Sports Hall, King's Cross as built, with completion in March 2020.",
    observed_change:
      "A documented Camden sports-hall project was recorded as reaching built status.",
    area: "King's Cross / Camden",
    latitude: 51.5349626,
    longitude: -0.1217677,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Sports Hall, King's Cross",
    source_url: "https://nla.london/projects/sports-hall-kings-cross",
    source_record_id: "nla-sports-hall-kings-cross",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bennetts Associates",
    project_type: "sports hall completion",
    geometry_source: "Nominatim geocoder point for 90 York Way / Kings Place, the address context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; school or community access, operating timetable, exact handover, and later facility condition require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_old_vic_front_of_house_completion_2019",
    date: "2019-11-01",
    bucket: "planning/development/architecture/theatre refurbishment",
    title: "The Old Vic front-of-house project was listed as built",
    summary:
      "New London Architecture records The Old Vic Theatre front-of-house project in Lambeth as built, with estimated completion in November 2019.",
    observed_change:
      "A documented theatre front-of-house refurbishment project was recorded as reaching built status.",
    area: "Waterloo / Lambeth",
    latitude: 51.5020248,
    longitude: -0.1092736,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Old Vic Theatre, Front of House",
    source_url: "https://nla.london/projects/the-old-vic-theatre-front-of-house",
    source_record_id: "nla-old-vic-front-of-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bennetts Associates listed the project; cited page names Rebecca Richwhite as interior designer",
    project_type: "theatre front-of-house refurbishment completion",
    geometry_source: "Nominatim geocoder point for The Old Vic, matching the theatre context in the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact reopening date, performance schedule, accessibility outcomes, conservation approvals, or later operational condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_southwark_park_pavilion_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/park pavilion",
    title: "Southwark Park Pavilion was listed as built",
    summary:
      "New London Architecture records Southwark Park Pavilion as built, with estimated completion in December 2019.",
    observed_change:
      "A documented park pavilion project was recorded as reaching built status.",
    area: "Southwark Park / Southwark",
    latitude: 51.4938935,
    longitude: -0.0542123,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Southwark Park Pavilion",
    source_url: "https://nla.london/projects/southwark-park-pavilion",
    source_record_id: "nla-southwark-park-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bell Phillips Architects",
    project_type: "park pavilion completion",
    geometry_source: "Nominatim geocoder point for Southwark Park Pavilion Cafe, used as an approximate marker for the pavilion context listed by NLA.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, park operations, cafe tenancy, maintenance arrangements, or later condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_forest_houses_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/infill housing",
    title: "Forest Houses was listed as built",
    summary:
      "New London Architecture records Forest Houses in Newham as built, with completion in January 2022.",
    observed_change:
      "A documented Newham infill housing project was recorded as reaching built status.",
    area: "Forest Gate / Newham",
    latitude: 51.5551533,
    longitude: 0.0247633,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Forest Houses",
    source_url: "https://nla.london/projects/forest-houses",
    source_record_id: "nla-forest-houses",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Dallas Pierce Quintero",
    project_type: "infill housing completion",
    geometry_source: "Nominatim geocoder point for 55A Forest Road, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact occupation, affordability or tenure details, sales, and later building performance require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_flushing_airport_housing_open_space_plan_2025",
    date: "2025-07-28",
    bucket: "planning/development/architecture/public site housing planning",
    title: "Former Flushing Airport housing and open-space plan was unveiled",
    summary:
      "The NYC Mayor's Office announced on July 28, 2025 a proposal for housing and open space on the former Flushing Airport site in College Point.",
    observed_change:
      "A documented city announcement recorded a public-site planning milestone for a large housing and open-space proposal.",
    area: "College Point / Queens",
    latitude: 40.781682724508,
    longitude: -73.845939098602,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: former Flushing Airport housing proposal",
    source_url: "https://www.nyc.gov/mayors-office/news/2025/07/most-pro-housing-administration-in-city-history--mayor-adams--ny",
    source_record_id: "nyc-mayor-2025-07-28-flushing-airport-housing-open-space-plan",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement names Cirrus Workforce Housing and LCOR as development-team firms; no project architect is named at this planning stage",
    project_type: "public-site housing and open-space planning milestone",
    geometry_source: "US Census geocoder point for College Point Boulevard and 20th Avenue, used as an approximate marker for the former Flushing Airport/College Point site context.",
    geometry_precision: "area approximate",
    limitations:
      "The event records a proposal announcement only. It does not confirm land-use approval, environmental review, RFP award, financing, construction start, open-space delivery, housing completion, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_midtown_south_mixed_use_public_review_2025",
    date: "2025-01-21",
    bucket: "planning/development/architecture/neighborhood plan public review",
    title: "Midtown South Mixed-Use Plan entered public review",
    summary:
      "The NYC Mayor's Office announced on January 21, 2025 that public review had begun for the Midtown South Mixed-Use Plan.",
    observed_change:
      "A documented city announcement recorded the start of public review for a neighborhood rezoning and mixed-use planning proposal.",
    area: "Midtown South / Manhattan",
    latitude: 40.748292736024,
    longitude: -73.988175055048,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Midtown South Mixed-Use public review",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/01/mayor-adams-kicks-off-public-review-midtown-south-mixed-use-plan-create-nearly-10-000-new",
    source_record_id: "nyc-mayor-2025-01-21-midtown-south-mixed-use-public-review",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Neighborhood plan announcement does not name project architects",
    project_type: "neighborhood mixed-use plan public-review milestone",
    geometry_source: "US Census geocoder point for Broadway and West 32nd Street, used as an approximate Midtown South plan-area marker.",
    geometry_precision: "plan-area approximate",
    limitations:
      "The event records the start of public review only. It does not confirm plan adoption, site-specific development, building design, permits, construction starts, completions, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_onelic_neighborhood_plan_public_review_2025",
    date: "2025-04-21",
    bucket: "planning/development/architecture/neighborhood plan public review",
    title: "OneLIC Neighborhood Plan entered public review",
    summary:
      "The NYC Mayor's Office announced on April 21, 2025 that public review had begun for the OneLIC Neighborhood Plan in Long Island City.",
    observed_change:
      "A documented city announcement recorded the start of public review for a neighborhood plan covering housing, jobs, and waterfront-access proposals.",
    area: "Long Island City / Queens",
    latitude: 40.7487844,
    longitude: -73.9379881,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: OneLIC Neighborhood Plan public review",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/04/mayor-adams-kicks-off-public-review-onelic-neighborhood-plan-create-nearly-15-000-homes-and",
    source_record_id: "nyc-mayor-2025-04-21-onelic-neighborhood-plan-public-review",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Neighborhood plan announcement does not name project architects",
    project_type: "neighborhood plan public-review milestone",
    geometry_source: "Nominatim geocoder point for Queens Plaza, used as an approximate Long Island City plan-area marker.",
    geometry_precision: "plan-area approximate",
    limitations:
      "The event records the start of public review only. It does not confirm plan adoption, site-specific development, building design, permits, construction starts, completions, waterfront delivery, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jamaica_neighborhood_plan_public_review_2025",
    date: "2025-03-20",
    bucket: "planning/development/architecture/neighborhood plan public review",
    title: "Jamaica Neighborhood Plan entered public review",
    summary:
      "The NYC Mayor's Office announced on March 20, 2025 that public review had begun for the Jamaica Neighborhood Plan.",
    observed_change:
      "A documented city announcement recorded the start of public review for a Jamaica neighborhood planning proposal.",
    area: "Jamaica / Queens",
    latitude: 40.701762738845,
    longitude: -73.807927615601,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Jamaica Neighborhood Plan public review",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/03/mayor-adams-kicks-off-public-review-jamaica-neighborhood-plan-create-nearly-12-000-new-homes",
    source_record_id: "nyc-mayor-2025-03-20-jamaica-neighborhood-plan-public-review",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Neighborhood plan announcement does not name project architects",
    project_type: "neighborhood plan public-review milestone",
    geometry_source: "US Census geocoder point for Jamaica Avenue and Sutphin Boulevard, used as an approximate Jamaica plan-area marker.",
    geometry_precision: "plan-area approximate",
    limitations:
      "The event records the start of public review only. It does not confirm plan adoption, site-specific development, building design, permits, construction starts, completions, infrastructure delivery, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_broadway_junction_public_investments_2023",
    date: "2023-05-02",
    bucket: "planning/development/architecture/public realm investment",
    title: "Broadway Junction public-space investments were announced",
    summary:
      "The NYC Mayor's Office announced on May 2, 2023 new public-space, jobs, affordable-housing, and street-safety investments around Broadway Junction.",
    observed_change:
      "A documented city announcement recorded a public-realm and neighborhood-investment milestone around a major transit hub.",
    area: "Broadway Junction / Brooklyn",
    latitude: 40.6781989,
    longitude: -73.9036343,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Broadway Junction investments",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2023/05/mayor-adams-mta-new-investments-public-space-good-jobs-affordable-housing-around",
    source_record_id: "nyc-mayor-2023-05-02-broadway-junction-public-investments",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement does not name architects for public-space work at this stage",
    project_type: "public-space and neighborhood-investment announcement",
    geometry_source: "Nominatim geocoder point for Broadway Junction, the station-area context named in the Mayor's Office release.",
    geometry_precision: "station-area approximate",
    limitations:
      "The event records an investment announcement only. It does not confirm final public-space design, procurement, construction starts, affordable-housing delivery, private development, completion dates, or later public-space condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_mornington_community_project_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/community facility completion",
    title: "Mornington Community Project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Mornington Community Project among recently completed externally funded schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed community-project milestone.",
    area: "Lower Ormeau / Belfast",
    latitude: 54.5870651,
    longitude: -5.9243577,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-mornington-community-project-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "community project completion",
    geometry_source: "Approximate point placed at 117 Ormeau Road / Lower Ormeau community context because the council report does not provide project coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, site boundary, works specification, contractor, final cost, opening arrangements, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_voypic_include_youth_project_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/youth facility completion",
    title: "VOYPIC / Include Youth project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed VOYPIC / Include Youth on behalf of DfC among recently completed externally funded schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed youth-facility project milestone.",
    area: "Cathedral Quarter / North Belfast",
    latitude: 54.6049093,
    longitude: -5.9280936,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-voypic-include-youth-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "youth facility project completion",
    geometry_source: "Approximate point placed at Great Patrick Street in the VOYPIC / Include Youth area context because the council report does not provide project coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, site boundary, works specification, partner roles, contractor, final cost, opening arrangements, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_network_expansion_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/cycle infrastructure completion",
    title: "Belfast Bikes network expansion was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed expansion of the Belfast Bikes network via DfI Active Travel Enablers Blue and Green Infrastructure Fund among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded a completed bike-share network expansion milestone.",
    area: "Belfast bike-share network",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-belfast-bikes-network-expansion-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "bike-share network expansion completion",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report records a network expansion but does not list individual bike-station coordinates.",
    geometry_precision: "programme approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not list station locations, equipment counts, exact completion dates, operator arrangements, final cost, usage, or later network condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_adelaide_street_upgrade_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/street public realm completion",
    title: "Adelaide Street upgrade was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Adelaide Street upgrade among recently completed DfI and DfC revitalisation projects.",
    observed_change:
      "A documented council physical-programme report recorded a completed street-upgrade milestone.",
    area: "Adelaide Street / Belfast city centre",
    latitude: 54.5936423,
    longitude: -5.9282719,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-adelaide-street-upgrade-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name street-designers or contractors for this completed-project list item",
    project_type: "street and public-realm upgrade completion",
    geometry_source: "Approximate point placed on Adelaide Street from the named council project context and public map context.",
    geometry_precision: "street approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, street segment limits, works specification, contractor, traffic-order details, final cost, or later street condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_entries_phase1_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/city centre public realm completion",
    title: "Entries Phase 1 was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Entries Phase 1 among recently completed DfI and DfC revitalisation projects.",
    observed_change:
      "A documented council physical-programme report recorded a completed city-centre entries public-realm milestone.",
    area: "Belfast city centre entries",
    latitude: 54.6001,
    longitude: -5.927,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-entries-phase1-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name public-realm designers or contractors for this completed-project list item",
    project_type: "city-centre entries public-realm completion",
    geometry_source: "Approximate point placed in Belfast city-centre entries context because the report names Entries Phase 1 but does not list individual entry locations.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, entry-by-entry works scope, contractor, access changes, lighting details, final cost, or later condition."
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
