const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_linden_court_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/housing",
    title: "Linden Court was listed as built",
    summary:
      "New London Architecture records Linden Court in Lewisham as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Campshill Road housing project was recorded as reaching built status.",
    area: "Lewisham",
    latitude: 51.4552468,
    longitude: -0.0113594,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Linden Court",
    source_url: "https://nla.london/projects/linden-court",
    source_record_id: "nla-linden-court",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "PRP",
    project_type: "housing completion",
    geometry_source: "Approximate point geocoded from the NLA-stated 2 Campshill Road location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, allocation, management, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_dinosaur_swing_bridge_completion_2021",
    date: "2021-03-01",
    bucket: "planning/development/architecture/heritage landscape",
    title: "Dinosaur Swing Bridge was listed as built",
    summary:
      "New London Architecture records Dinosaur Swing Bridge in Bromley as built, with completion in March 2021.",
    observed_change:
      "A documented Crystal Palace Park bridge project was recorded as reaching built status.",
    area: "Crystal Palace Park / Bromley",
    latitude: 51.4196757,
    longitude: -0.0614506,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dinosaur Swing Bridge",
    source_url: "https://nla.london/projects/dinosaur-swing-bridge",
    source_record_id: "nla-dinosaur-swing-bridge",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Tonkin Liu",
    project_type: "heritage landscape bridge completion",
    geometry_source: "Approximate point geocoded near Crystal Palace Park Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; heritage-listing status, park operating arrangements, maintenance, and later access conditions require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_duke_of_york_restaurant_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/restaurant",
    title: "Duke of York Restaurant was listed as built",
    summary:
      "New London Architecture records Duke of York Restaurant in Kensington and Chelsea as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Duke of York Square restaurant project was recorded as reaching built status.",
    area: "Duke of York Square / Chelsea",
    latitude: 51.4908547,
    longitude: -0.1608113,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Duke of York Restaurant",
    source_url: "https://nla.london/projects/duke-of-york-restaurant",
    source_record_id: "nla-duke-of-york-restaurant",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Nex",
    project_type: "restaurant building completion",
    geometry_source: "Approximate point geocoded from the NLA-stated 9 Duke of York Square location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; operator opening, restaurant trading, fit-out changes, and later public-space operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_a_house_for_artists_completion_2021",
    date: "2021-12-01",
    bucket: "planning/development/architecture/housing cultural",
    title: "A House for Artists was listed as built",
    summary:
      "New London Architecture records A House for Artists in Barking as built, with estimated completion in December 2021.",
    observed_change:
      "A documented Barking housing and cultural workspace project was recorded as reaching built status.",
    area: "Barking / Barking and Dagenham",
    latitude: 51.5397555,
    longitude: 0.0778012,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: A House for Artists",
    source_url: "https://nla.london/projects/a-house-for-artists",
    source_record_id: "nla-a-house-for-artists",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "APPARATA",
    project_type: "affordable housing and cultural workspace completion",
    geometry_source: "Approximate point geocoded for A House for Artists in Barking; the parsed NLA detail supplies borough and project metadata but no street address.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; residency selection, cultural programming, occupancy, affordability compliance, and later operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kindred_house_completion_2023",
    date: "2023-03-01",
    bucket: "planning/development/architecture/mixed use",
    title: "Kindred House was listed as built",
    summary:
      "New London Architecture records Kindred House in Croydon as built, with completion in March 2023.",
    observed_change:
      "A documented Scarbrook Road mixed-use tower project was recorded as reaching built status.",
    area: "Croydon",
    latitude: 51.3716759,
    longitude: -0.1010341,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kindred House",
    source_url: "https://nla.london/projects/kindred-house",
    source_record_id: "nla-kindred-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pitman Tozer Architects Ltd",
    project_type: "mixed-use tower completion",
    geometry_source: "Approximate point geocoded near 25 Scarbrook Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; sales, rental occupation, affordability delivery, retail opening, office use, and later management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_fulton_howard_west_public_engagement_started_2026",
    date: "2026-05-07",
    bucket: "planning/development/architecture/public engagement",
    title: "Fulton-Howard West public engagement process began",
    summary:
      "NYC HPD announced on May 7, 2026 the launch of public engagement for Fulton-Howard West, a city-owned Bedford-Stuyvesant site including the Bedford-Stuyvesant Multi-Service Center and adjacent vacant land on Fulton Street.",
    observed_change:
      "A documented HPD action opened public engagement for a future mixed-use affordable-housing and social-services development process.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.678744629066,
    longitude: -73.920402913519,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Fulton-Howard West public engagement",
    source_url:
      "https://www.nyc.gov/site/hpd/news/33-26/mayor-mamdani-hpd-kick-off-public-engagement-process-new-affordable-housing-community",
    source_record_id: "nyc-hpd-2026-05-07-fulton-howard-west-public-engagement",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design and development team to be determined through later engagement and procurement steps",
    project_type: "public-site development engagement",
    geometry_source: "Census geocoder point for 1958 Fulton Street, used as an approximate marker for the Fulton-Howard West site context.",
    geometry_precision: "site approximate",
    limitations:
      "The event records public engagement launch only. It does not confirm an RFP, team selection, final scope, financing, approvals, construction start, completion, social-service space opening, housing lottery, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_timbale_terrace_groundbreaking_2026",
    date: "2026-02-19",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Timbale Terrace broke ground",
    summary:
      "NYC HPD announced on February 19, 2026 that city officials and development partners broke ground on Timbale Terrace, a mixed-use affordable-housing development at East 118th Street and Park Avenue in East Harlem.",
    observed_change:
      "A documented HPD announcement recorded the start of construction for an affordable-housing and community-arts project on underused public land.",
    area: "East Harlem / Manhattan",
    latitude: 40.800609724176,
    longitude: -73.942284066575,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Timbale Terrace groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/010-26/mamdani-administration-breaks-ground-timbale-terrace-affordable-housing-development",
    source_record_id: "nyc-hpd-2026-02-19-timbale-terrace-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Mega Development LLC, Lantern Organization, and Belongo are named project partners; design-team details require separate project records",
    project_type: "affordable housing and community arts groundbreaking",
    geometry_source: "Census geocoder point for East 118th Street and Park Avenue, the location named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm completion, unit lease-up, supportive-service operations, cultural-center opening, replacement parking delivery, affordability compliance, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_100_gold_street_rfp_released_2025",
    date: "2025-03-05",
    bucket: "planning/development/architecture/mixed use rfp",
    title: "100 Gold Street redevelopment RFP was released",
    summary:
      "NYC HPD, NYCEDC, and the Mayor's Office announced on March 5, 2025 the release of a request for proposals for transformation of the city-owned 100 Gold Street site into a mixed-income residential building with an updated older-adult center.",
    observed_change:
      "A documented city announcement opened a development-team selection process for a Lower Manhattan mixed-income housing and community-facility redevelopment.",
    area: "Civic Center / Lower Manhattan",
    latitude: 40.710532104776,
    longitude: -74.003724283399,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 100 Gold Street RFP",
    source_url:
      "https://www.nyc.gov/site/hpd/news/089-25/mayor-adams-nycedc-hpd-next-steps-project-will-provide-1-000-new-units",
    source_record_id: "nyc-hpd-2025-03-05-100-gold-street-rfp",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Development and design team to be selected through the RFP process",
    project_type: "mixed-income housing request for proposals",
    geometry_source: "Census geocoder point for 100 Gold Street.",
    geometry_precision: "site approximate",
    limitations:
      "The event records RFP release only. It does not confirm team selection, demolition, design approval, financing, construction start, older-adult center relocation, completion, housing lottery, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_5_times_square_office_to_housing_announced_2025",
    date: "2025-05-22",
    bucket: "planning/development/architecture/office conversion announcement",
    title: "5 Times Square office-to-housing transformation was announced",
    summary:
      "NYC HPD and partner agencies announced on May 22, 2025 an office-to-housing transformation plan for 5 Times Square, described as reimagining nearly 1 million square feet of office space as mixed-income housing.",
    observed_change:
      "A documented city announcement moved the 5 Times Square office-conversion proposal into a named public redevelopment milestone.",
    area: "Times Square / Midtown Manhattan",
    latitude: 40.756032734466,
    longitude: -73.98695105497,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 5 Times Square office-to-housing transformation",
    source_url:
      "https://www.nyc.gov/site/hpd/news/092-25/mayor-adams-governor-hochul-office-to-housing-transformation-5-times-square-create",
    source_record_id: "nyc-hpd-2025-05-22-5-times-square-office-to-housing-announcement",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Conversion design team requires separate project records",
    project_type: "office-to-housing conversion announcement",
    geometry_source: "Census geocoder point for Seventh Avenue and West 42nd Street, used as an approximate marker for 5 Times Square.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a public announcement only. It does not confirm final approvals, financing, permits, construction start, completion, occupancy, affordable-unit lease-up, retail operation, or later building management."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_logan_fountain_completion_2025",
    date: "2025-05-13",
    bucket: "planning/development/architecture/supportive housing completion",
    title: "Logan Fountain completed in Cypress Hills",
    summary:
      "NYC HPD and New York State announced on May 13, 2025 the completion of Logan Fountain in Cypress Hills, describing 343 affordable, supportive, and transitional housing units with ground-floor retail and shared resident spaces.",
    observed_change:
      "A documented city-state announcement recorded completion of a mixed-use affordable, supportive, and transitional housing development in Brooklyn.",
    area: "Cypress Hills / Brooklyn",
    latitude: 40.679702424172,
    longitude: -73.877282224558,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Logan Fountain completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/091-25/mayor-adams-governor-hochul-completion-mixed-use-affordable-supportive-housing",
    source_record_id: "nyc-hpd-2025-05-13-logan-fountain-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Hudson Companies, Jericho Project, and HELP USA are named project partners; architect requires separate project records",
    project_type: "supportive and transitional housing completion",
    geometry_source: "Census geocoder point for 265 Logan Street, used as an approximate Logan Fountain site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records completion as announced by HPD and state partners. It does not independently verify lease-up, supportive-service delivery, transitional-housing occupancy, retail opening, building performance, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sporting_pitches_investment_2425_completion_reported_2025",
    date: "2025-10-24",
    bucket: "planning/development/sports facility completion report",
    title: "Sporting Pitches Investment 24/25 works were reported completed",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Sporting Pitches Investment 24/25 improvement works at Falls Park, Mallusk Playing Fields, and Strangford Avenue Playing Fields as recently completed.",
    observed_change:
      "A documented council physical-programme report recorded completion of multi-site playing-pitch improvement works.",
    area: "Falls Park / Mallusk Playing Fields / Strangford Avenue Playing Fields",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-sporting-pitches-investment-2425-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name individual pitch designers or contractors for this summary item",
    project_type: "sports facility improvement completion report",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report summarizes works across multiple playing-field sites.",
    geometry_precision: "programme approximate",
    limitations:
      "The report summarizes completion status only. It does not provide individual pitch specifications, site boundaries, construction dates, contractors, inspection results, final cost by site, public-access changes, or later maintenance condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_resources_fleet_portacabin_facilities_completion_reported_2025",
    date: "2025-10-24",
    bucket: "planning/development/council facility completion report",
    title: "Resources and Fleet portacabin facilities were reported completed",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update included Resources and Fleet Portacabin Facilities among recently completed enhancements to council assets.",
    observed_change:
      "A documented council physical-programme report recorded completion of portacabin-facility enhancements within the council asset programme.",
    area: "Belfast City Council assets",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-resources-fleet-portacabin-facilities-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name individual designers or contractors for this summary item",
    project_type: "council facility enhancement completion report",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report does not provide a site address or mapped boundary.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records a summary completion item only. It does not specify the portacabin locations, scope, procurement route, construction dates, final cost, occupancy, compliance checks, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_playground_improvement_2526_underway_2025",
    date: "2025-10-24",
    bucket: "planning/development/playground programme status",
    title: "Playground Improvement Programme 25/26 was reported underway",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update reported that Playground Improvement Programme 25/26 works were underway at White Rise, Ohio Street, Roddens Crescent, Finvoy Street, and Belmont.",
    observed_change:
      "A documented council physical-programme report recorded a multi-site playground-improvement programme as underway.",
    area: "White Rise / Ohio Street / Roddens Crescent / Finvoy Street / Belmont",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-playground-improvement-2526-underway",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name individual designers or contractors for this summary item",
    project_type: "multi-site playground improvement status",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report summarizes several playground sites without coordinates.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records programme status only and includes an anticipated completion window. It does not confirm individual site completion, equipment specifications, accessibility inspection, contractor details, final cost by site, reopening date, or later maintenance condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_alleygating_phase5_progressing_2025",
    date: "2025-10-24",
    bucket: "planning/development/public realm installation status",
    title: "Alleygating Phase 5 was reported as progressing",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update reported Alleygating Phase 5 as progressing, with 115 gates in the installation programme.",
    observed_change:
      "A documented council physical-programme report recorded progress on the fifth alley-gating installation phase.",
    area: "Belfast citywide alley-gating programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-alleygating-phase5-progressing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name individual gate designers or contractors for this summary item",
    project_type: "public realm installation status",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report describes a citywide alley-gating phase without mapped gate locations.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records programme status only. It does not list individual alleys, gate locations, installation dates, access-management arrangements, resident consent records, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_floral_hall_hs_works_underway_2025",
    date: "2025-10-24",
    bucket: "planning/development/heritage building works status",
    title: "Floral Hall health and safety works were reported underway",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update reported Floral Hall Health and Safety Works as underway and nearing completion.",
    observed_change:
      "A documented council physical-programme report recorded active health and safety works at Floral Hall.",
    area: "Floral Hall / Belfast Zoo",
    latitude: 54.651,
    longitude: -5.941,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-floral-hall-hs-works-underway",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name conservation designers or contractors for this status item",
    project_type: "heritage building health and safety works status",
    geometry_source: "Approximate point placed at Floral Hall/Belfast Zoo from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records works as underway and nearing completion only. It does not confirm full completion, heritage scope, contractor details, inspection results, reopening, future reuse, final cost, or later building condition."
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
