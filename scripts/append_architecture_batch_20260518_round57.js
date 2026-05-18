const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";
const belfastPhysicalProgrammeSep2020 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=56825";
const belfastPhysicalProgrammeDec2024 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=81706";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_dukes_meadow_footbridge_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/transport infrastructure",
    title: "Dukes Meadow Footbridge was listed as built",
    summary:
      "New London Architecture records Dukes Meadow Footbridge in Hounslow as built, with completion in January 2023.",
    observed_change:
      "A documented Thames Path footbridge beneath Barnes Bridge was recorded as reaching built status.",
    area: "Barnes Bridge / Chiswick",
    latitude: 51.472642,
    longitude: -0.252381,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dukes Meadow Footbridge",
    source_url: "https://nla.london/projects/dukes-meadow-footbridge",
    source_record_id: "nla-dukes-meadow-footbridge",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Moxon",
    project_type: "pedestrian and cycle footbridge completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated Barnes Bridge SW13 0NL location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact opening arrangements, maintenance, river-path access hours, heritage constraints, and later route condition require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_lion_green_road_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/housing",
    title: "Lion Green Road was listed as built",
    summary:
      "New London Architecture records Lion Green Road in Croydon as built, with completion in January 2023.",
    observed_change:
      "A documented landscape-led residential development at 16 Lion Green Road was recorded as reaching built status.",
    area: "Coulsdon / Croydon",
    latitude: 51.3191,
    longitude: -0.139652,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Lion Green Road",
    source_url: "https://nla.london/projects/lion-green-road",
    source_record_id: "nla-lion-green-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Mary Duggan Architects with RUFFARCHITECTS",
    project_type: "residential development completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 16 Lion Green Road CR5 2NL location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, tenure delivery, public-landscape management, defects, and later estate operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_city_lights_point_elephant_park_completion_2022",
    date: "2022-11-01",
    bucket: "planning/development/architecture/housing mixed use",
    title: "City Lights Point at Elephant Park was listed as built",
    summary:
      "New London Architecture records City Lights Point, Elephant Park in Southwark as built, with estimated completion in November 2022.",
    observed_change:
      "A documented mixed-tenure residential and street-level amenity building at Elephant Park was recorded as reaching built status.",
    area: "Elephant Park / Southwark",
    latitude: 51.494666,
    longitude: -0.087566,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: City Lights Point, Elephant Park",
    source_url: "https://www.nla.london/projects/city-lights-point-elephant-park",
    source_record_id: "nla-city-lights-point-elephant-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP",
    project_type: "residential-led mixed-use completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated New Kent Road SE1 4AN location context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; unit occupation, retail/leisure opening, tenure compliance, service charges, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_thames_city_phase_one_completion_2023",
    date: "2023-08-01",
    bucket: "planning/development/architecture/housing public realm",
    title: "Thames City Phase One was listed as built",
    summary:
      "New London Architecture records Thames City Phase One in Wandsworth as built, with estimated completion in August 2023.",
    observed_change:
      "A documented Nine Elms residential district phase with public-realm components was recorded as reaching built status.",
    area: "Nine Elms / Wandsworth",
    latitude: 51.483336,
    longitude: -0.128887,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Thames City Phase One",
    source_url: "https://nla.london/projects/thames-city-phase-one",
    source_record_id: "nla-thames-city-phase-one",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Skidmore Owings & Merrill",
    project_type: "residential district phase completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 6 Carnation Way SW8 5GZ location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; phased handovers, occupation, management of public routes, retail opening, and later estate condition require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_brunel_street_works_completion_2022",
    date: "2022-07-01",
    bucket: "planning/development/architecture/housing mixed use",
    title: "Brunel Street Works was listed as built",
    summary:
      "New London Architecture records Brunel Street Works in Newham as built, with estimated completion in July 2022.",
    observed_change:
      "A documented mixed-use urban quarter at Silvertown Way was recorded as reaching built status.",
    area: "Canning Town / Newham",
    latitude: 51.512487,
    longitude: 0.010909,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Brunel Street Works",
    source_url: "https://www.nla.london/index.php/projects/brunel-street-works",
    source_record_id: "nla-brunel-street-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "JTP, GRID Architects, Cartwright Pickard, and Hunters Architect",
    project_type: "mixed-use urban quarter completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated Silvertown Way E16 1EA location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; residential occupation, retail/leisure opening, tenure delivery, station-area operation, and later public-realm management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_stevenson_square_groundbreaking_2024",
    date: "2024-03-01",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Stevenson Square Phase One broke ground",
    summary:
      "NYC HPD announced on March 1, 2024 that city, state, and development partners broke ground on Stevenson Square Phase One in Soundview.",
    observed_change:
      "A documented HPD announcement recorded the start of construction for the first phase of a Bronx affordable-housing and homeownership project.",
    area: "Soundview / Bronx",
    latitude: 40.819232400075,
    longitude: -73.863011420476,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Stevenson Square groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/010-24/city-state-partners-break-ground-stevenson-square-starting-construction-174-affordable",
    source_record_id: "nyc-hpd-2024-03-01-stevenson-square-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Phase One design-team details require later project records",
    project_type: "affordable housing and homeownership construction start",
    geometry_source: "US Census geocoder point for 1841 Seward Avenue, used as an approximate Stevenson Square site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm completion, building openings, co-op sales, senior housing lease-up, public-space delivery, service-provider operation, or later phase delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_river_avenue_supportive_housing_completion_2024",
    date: "2024-03-20",
    bucket: "planning/development/architecture/housing completion",
    title: "River Avenue supportive housing completion was announced",
    summary:
      "NYC HPD announced on March 20, 2024 the completion of River Avenue, a 245-unit affordable and supportive mixed-use housing development at 1169 River Avenue.",
    observed_change:
      "A documented HPD announcement recorded completion of a Bronx affordable and supportive housing building.",
    area: "Concourse / Bronx",
    latitude: 40.835251583711,
    longitude: -73.921653331322,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: River Avenue completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/016-24/tackling-housing-crisis-245-new-homes-open-the-bronx-dedicated-mental-health-support-and",
    source_record_id: "nyc-hpd-2024-03-20-river-avenue-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design-team details require separate project records",
    project_type: "affordable and supportive housing completion",
    geometry_source: "US Census geocoder point for 1169 River Avenue, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion/opening announcement only. It does not confirm full resident move-in, supportive-service caseloads, retail occupancy, long-term affordability compliance, building performance, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_35_commercial_street_opening_2024",
    date: "2024-04-03",
    bucket: "planning/development/architecture/housing opening",
    title: "35 Commercial Street opened at Greenpoint Landing",
    summary:
      "NYC HPD announced on April 3, 2024 that 374 affordable homes opened at 35 Commercial Street within Greenpoint Landing.",
    observed_change:
      "A documented HPD announcement recorded the opening of an affordable housing tower on the Greenpoint waterfront.",
    area: "Greenpoint / Brooklyn",
    latitude: 40.736037737871,
    longitude: -73.959066821696,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 35 Commercial Street opening",
    source_url: "https://www.nyc.gov/site/hpd/news/018-24/374-new-affordable-homes-open-greenpoint-landing",
    source_record_id: "nyc-hpd-2024-04-03-35-commercial-street-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design-team details require separate Greenpoint Landing project records",
    project_type: "affordable housing opening",
    geometry_source: "US Census geocoder point for 35 Commercial Street, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records opening of the 35 Commercial Street affordable-housing building only. It does not confirm full lease-up, resident move-in for every unit, wider Greenpoint Landing phase delivery, open-space completion, social-service outcomes, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_melrose_north_opening_2024",
    date: "2024-10-28",
    bucket: "planning/development/architecture/housing opening",
    title: "Melrose North opened in the South Bronx",
    summary:
      "NYC HPD announced on October 28, 2024 that 171 affordable homes opened at Melrose North on NYCHA's Morrisania Air Rights campus.",
    observed_change:
      "A documented HPD announcement recorded the opening of a supportive and affordable housing development on underused NYCHA land.",
    area: "Morrisania / Bronx",
    latitude: 40.825534317583,
    longitude: -73.914347545026,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Melrose North opening",
    source_url: "https://www.nyc.gov/site/hpd/news/044-24/171-new-100-affordable-homes-arrive-the-south-bronx",
    source_record_id: "nyc-hpd-2024-10-28-melrose-north-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Curtis + Ginsberg Architects",
    project_type: "affordable and supportive housing opening",
    geometry_source: "US Census geocoder point for 925 Courtlandt Avenue, used as an approximate Morrisania Air Rights campus marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening/ribbon-cutting milestone only. It does not confirm full resident move-in, supportive-service outcomes, NYCHA campus operations, long-term affordability compliance, Passive House performance, or later maintenance condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hillside_grove_developer_selection_2024",
    date: "2024-12-30",
    bucket: "planning/development/architecture/housing developer selection",
    title: "Hillside Grove development team was selected",
    summary:
      "NYC HPD announced on December 30, 2024 that a development team had been selected to transform the 539 Jersey Street sanitation garage site into Hillside Grove.",
    observed_change:
      "A documented HPD announcement selected a development team for a mixed-use affordable housing, grocery, community-space, and open-space proposal on Staten Island.",
    area: "North Shore / Staten Island",
    latitude: 40.63638030063,
    longitude: -74.08502874185,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Hillside Grove development-team selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/048-24/new-year-new-homes-staten-island-plan-transform-sanitation-garage-232-affordable",
    source_record_id: "nyc-hpd-2024-12-30-hillside-grove-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Purpose by Design Architects",
    project_type: "public-site affordable housing developer selection",
    geometry_source: "US Census geocoder point for 539 Jersey Street, the site named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm land-use approval, sanitation relocation completion, financing, final design, construction start, housing delivery, grocery opening, open-space completion, or resident move-in."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_westbourne_presbyterian_church_progressing_2025",
    date: "2025-10-24",
    bucket: "planning/development/community building works status",
    title: "Westbourne Presbyterian Church project was reported as progressing",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update reported works at Westbourne Presbyterian Church as progressing, with a planned completion reference in the committee item.",
    observed_change:
      "A documented council physical-programme report recorded progress on a community-building capital project at Westbourne Presbyterian Church.",
    area: "Westbourne Presbyterian Church / Belfast",
    latitude: 54.622,
    longitude: -5.921,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-westbourne-presbyterian-progressing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this summary item",
    project_type: "community building works status",
    geometry_source: "Approximate point placed near Westbourne Presbyterian Church from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records progress status only. It does not specify full scope, contractor details, planning approvals, exact works dates, completion, funding drawdown, community-use arrangements, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_access_hills_black_mountain_whiterock_pathway_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/pathway capital project status",
    title: "Black Mountain and Upper Whiterock pathway was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Access to the Hills - Black Mountain/Upper Whiterock Pathway among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a hills-access pathway capital project as being in development.",
    area: "Black Mountain / Upper Whiterock",
    latitude: 54.591,
    longitude: -6.004,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-access-hills-black-mountain-whiterock-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name landscape designers or contractors for this summary item",
    project_type: "public access pathway development status",
    geometry_source: "Approximate point placed in the Black Mountain/Upper Whiterock project context named by the council report.",
    geometry_precision: "site approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm route alignment, land permissions, environmental assessment, procurement, construction start, completion, access management, final cost, or later path condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_reservoir_safety_programme_stage3_2020",
    date: "2020-09-18",
    bucket: "planning/development/reservoir safety programme status",
    title: "Reservoir Safety Programme moved to Stage 3",
    summary:
      "Belfast City Council's September 18, 2020 Physical Programme Update recorded the Reservoir Safety Programme at Stage 3 - Committed.",
    observed_change:
      "A documented council physical-programme report recorded a reservoir safety capital-programme commitment milestone.",
    area: "Belfast reservoir safety programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 18 September 2020",
    source_url: belfastPhysicalProgrammeSep2020,
    source_record_id: "bcc-physical-programme-2020-09-18-reservoir-safety-stage3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this programme item",
    project_type: "reservoir safety capital-programme commitment",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report describes a programme item without a mapped reservoir boundary.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records a programme-stage commitment only. It does not list reservoir assets, detailed engineering scope, statutory inspection findings, procurement, construction dates, risk ratings, completion, final cost, or later safety condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waste_plan_glass_collection_expansion_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/waste infrastructure programme status",
    title: "Waste Plan glass-collection expansion was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Waste Plan - Expansion of Glass Collection Scheme among corporate projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a waste-infrastructure collection-scheme expansion as being in development.",
    area: "Belfast citywide waste collection programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-waste-plan-glass-collection-expansion-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this programme item",
    project_type: "citywide waste collection infrastructure programme status",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report describes a citywide collection-scheme project rather than one site.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm bin/container locations, depot works, fleet changes, procurement, service start, household coverage, recycling tonnage, final cost, or later operational performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_stained_glass_windows_stage3_2024",
    date: "2024-12-13",
    bucket: "planning/development/heritage building programme status",
    title: "City Hall stained-glass windows project moved to Stage 3",
    summary:
      "Belfast City Council's December 13, 2024 Physical Programme Update recorded City Hall Stained Glass Windows at Stage 3 - Committed.",
    observed_change:
      "A documented council physical-programme report recorded a City Hall heritage-building works commitment milestone.",
    area: "Belfast City Hall",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 13 December 2024",
    source_url: belfastPhysicalProgrammeDec2024,
    source_record_id: "bcc-physical-programme-2024-12-13-city-hall-stained-glass-windows-stage3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name conservation designers or contractors for this summary item",
    project_type: "heritage building works commitment",
    geometry_source: "Approximate point placed at Belfast City Hall from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records programme-stage commitment only. It does not describe individual windows, conservation methods, procurement, installation dates, completion, interpretation materials, final cost, or later condition."
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
