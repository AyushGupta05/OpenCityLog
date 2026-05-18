const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeNov2022 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=70364";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_lyons_place_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/housing mixed use",
    title: "Lyons Place was listed as built",
    summary:
      "New London Architecture records Lyons Place at Edgware Road in Westminster as built, with completion in February 2020.",
    observed_change:
      "A documented Westminster mixed-use housing scheme was recorded as reaching built status.",
    area: "Edgware Road / Westminster",
    latitude: 51.5187055,
    longitude: -0.1681802,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Lyons Place",
    source_url: "https://nla.london/projects/lyons-place",
    source_record_id: "nla-lyons-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Farrells",
    project_type: "mixed-use housing completion",
    geometry_source: "Nominatim geocoder point for the Edgware Road address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact handover, tenure mix, resident occupation, retail occupancy, and later building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_reach_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/housing completion",
    title: "The Reach was listed as built",
    summary:
      "New London Architecture records The Reach in Greenwich as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Greenwich housing project was recorded as reaching built status.",
    area: "Thamesmead / Greenwich",
    latitude: 51.4986201,
    longitude: 0.090356,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Reach",
    source_url: "https://nla.london/projects/the-reach",
    source_record_id: "nla-the-reach",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pitman Tozer Architects",
    project_type: "housing completion",
    geometry_source: "Nominatim geocoder point for Thames Reach SE28, used as an approximate marker for the address listed on the NLA project page.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover, resident move-in, tenure allocation, landscape completion, or later estate management."
  },
  {
    city_id: "london",
    event_id: "lon_arch_wolsey_mews_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/infill housing",
    title: "Wolsey Mews was listed as built",
    summary:
      "New London Architecture records Wolsey Mews in Kentish Town as built, with estimated completion in June 2019.",
    observed_change:
      "A documented Camden infill housing project was recorded as reaching built status.",
    area: "Kentish Town / Camden",
    latitude: 51.5485543,
    longitude: -0.1407074,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Wolsey Mews",
    source_url: "https://nla.london/projects/wolsey-mews",
    source_record_id: "nla-wolsey-mews",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Burd Haward Architects",
    project_type: "urban infill housing completion",
    geometry_source: "Nominatim geocoder point for 10 Wolsey Mews, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover, occupation, sales, energy performance, conservation-area approvals, or later alterations."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hogarth_court_completion_2020",
    date: "2020-04-01",
    bucket: "planning/development/architecture/sheltered housing retrofit",
    title: "Hogarth Court was listed as built",
    summary:
      "New London Architecture records Hogarth Court in Whitechapel as built, with completion in April 2020.",
    observed_change:
      "A documented Tower Hamlets sheltered-housing transformation project was recorded as reaching built status.",
    area: "Whitechapel / Tower Hamlets",
    latitude: 51.5140314,
    longitude: -0.0649653,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hogarth Court",
    source_url: "https://nla.london/projects/hogarth-court-1",
    source_record_id: "nla-hogarth-court",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "what if: projects",
    project_type: "sheltered housing refurbishment and public-realm completion",
    geometry_source: "Nominatim geocoder point for 20 Batty Street, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; resident occupation, housing-management outcomes, landscape maintenance, and later building condition require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_tailoring_academy_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/training workplace",
    title: "Tailoring Academy was listed as built",
    summary:
      "New London Architecture records the Tailoring Academy at Crusader Industrial Estate in Haringey as built, with estimated completion in October 2019.",
    observed_change:
      "A documented training and manufacturing workspace project was recorded as reaching built status.",
    area: "Haringey Warehouse District / Haringey",
    latitude: 51.5767361,
    longitude: -0.0913135,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Tailoring Academy",
    source_url: "https://nla.london/projects/tailoring-academy",
    source_record_id: "nla-tailoring-academy",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Jan Kattein Architects",
    project_type: "training and manufacturing workspace completion",
    geometry_source: "Nominatim geocoder point for 167 Hermitage Road, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm training enrolment, employment outcomes, tenancy terms, operating model, or later building performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_201_207_7th_avenue_groundbreaking_2022",
    date: "2022-07-26",
    bucket: "planning/development/architecture/homeownership groundbreaking",
    title: "201-207 7th Avenue affordable homeownership project broke ground",
    summary:
      "NYC HPD recorded on July 26, 2022 that community leaders, city officials, and residents broke ground on the 201-207 7th Avenue affordable homeownership project in Chelsea.",
    observed_change:
      "A documented HPD announcement recorded the construction-start milestone for an affordable homeownership project.",
    area: "Chelsea / Manhattan",
    latitude: 40.743354938949,
    longitude: -73.996101157404,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 201-207 7th Avenue groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/031-22/community-leaders-city-officials-residents-break-ground-affordable-homeownership-project",
    source_record_id: "nyc-hpd-2022-07-26-201-207-7th-avenue-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Amie Gross Architects",
    project_type: "affordable homeownership groundbreaking",
    geometry_source: "US Census geocoder point for 207 7th Avenue, within the 201-207 7th Avenue project address range named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone. It does not confirm demolition completion, construction completion, co-op sales, resident return, retail leasing, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_powerhouse_apartments_selection_2024",
    date: "2024-02-16",
    bucket: "planning/development/architecture/housing development selection",
    title: "Powerhouse Apartments plans were selected for a Bronx public site",
    summary:
      "NYC HPD announced on February 16, 2024 the selection of plans for Powerhouse Apartments at 351 Powers Avenue in Mott Haven.",
    observed_change:
      "A documented HPD announcement selected plans to convert a city-owned parking lot into affordable housing with community programming.",
    area: "Mott Haven / Bronx",
    latitude: 40.808710833864,
    longitude: -73.911842994297,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Powerhouse Apartments selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/008-24/from-parking-powerhouse-fully-affordable-fully-electric-apartments-replace-bronx-lot-in",
    source_record_id: "nyc-hpd-2024-02-16-powerhouse-apartments-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "STAT Architecture PC",
    project_type: "affordable housing plan selection",
    geometry_source: "US Census geocoder point for 351 Powers Avenue, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records plan selection only. It does not confirm financing close, public approvals, construction start, completion, community-theatre operation, resident move-in, or building performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_betances_family_apartments_completion_2024",
    date: "2024-07-15",
    bucket: "planning/development/architecture/housing completion",
    title: "Betances Family Apartments completion was celebrated",
    summary:
      "NYC HPD and NYCHA recorded on July 15, 2024 the completion of Betances Family Apartments on NYCHA's Betances campus in Mott Haven.",
    observed_change:
      "A documented public-housing and housing-agency announcement recorded completion of an affordable-housing building.",
    area: "Mott Haven / Bronx",
    latitude: 40.81414572072,
    longitude: -73.919199073152,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Betances Family Apartments completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/024-24/101-new-affordable-homes-open-mott-haven-hpd-nycha-partners-celebrate-completion-of",
    source_record_id: "nyc-hpd-2024-07-15-betances-family-apartments-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Think! Architecture and Design",
    project_type: "affordable housing completion",
    geometry_source: "US Census geocoder point for East 146th Street and Willis Avenue, used as an approximate marker for the Betances campus context named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion celebration. It does not confirm every resident move-in, social-service delivery, NYCHA resident preference outcomes, final building performance, or long-term affordability compliance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_811_lexington_senior_residences_opening_2024",
    date: "2024-07-03",
    bucket: "planning/development/architecture/senior housing opening",
    title: "811 Lexington Avenue Senior Residences opened",
    summary:
      "NYC HPD recorded on July 3, 2024 that city leaders and IMPACCT Brooklyn cut the ribbon on 811 Lexington Avenue Senior Residences in Bedford-Stuyvesant.",
    observed_change:
      "A documented HPD announcement recorded the opening of a senior affordable-housing project.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.690373368426,
    longitude: -73.928002859662,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 811 Lexington Avenue Senior Residences opening",
    source_url: "https://www.nyc.gov/site/hpd/news/221-24/the-city-welcomes-64-new-yorkers-811-lexington",
    source_record_id: "nyc-hpd-2024-07-03-811-lexington-senior-residences-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cited HPD page does not name the project architect",
    project_type: "senior affordable housing opening",
    geometry_source: "US Census geocoder point for 811 Lexington Avenue, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting/opening announcement. It does not confirm every resident move-in, supportive-service delivery, final operating model, affordability compliance, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_beach_21st_completion_2022",
    date: "2022-08-04",
    bucket: "planning/development/architecture/housing infrastructure completion",
    title: "Beach 21st and related Far Rockaway improvements were completed",
    summary:
      "NYC HPD recorded on August 4, 2022 that the Beach 21st affordable-housing project and associated Downtown Far Rockaway public improvements had been completed.",
    observed_change:
      "A documented city announcement recorded completion of a mixed-use affordable-housing project with nearby public-realm and infrastructure work.",
    area: "Downtown Far Rockaway / Queens",
    latitude: 40.604571756051,
    longitude: -73.753536138841,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Beach 21st and Downtown Far Rockaway improvements completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/034-22/mayor-adams-significant-quality-of-life-infrastructure-improvements-new-affordable",
    source_record_id: "nyc-hpd-2022-08-04-beach-21st-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cited HPD page does not name the project architect",
    project_type: "affordable housing and public-realm completion",
    geometry_source: "US Census geocoder point for Beach 21st Street and Mott Avenue, used as an approximate marker for the Beach 21st and Downtown Far Rockaway project context named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion announcement. It does not confirm every lease-up, retail tenancy, daycare opening, flood-resilience performance, street-maintenance status, or long-term building operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waste_transfer_station_weighbridges_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/waste infrastructure completion",
    title: "Waste Transfer Station weighbridges were reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Waste Transfer Station weighbridges among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded completed weighbridge works for waste-transfer infrastructure.",
    area: "Waste-transfer infrastructure / Belfast",
    latitude: 54.6293656,
    longitude: -5.897175,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-waste-transfer-station-weighbridges-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "waste-transfer weighbridge works completion",
    geometry_source: "Approximate point placed on Dargan Road in Belfast Harbour/Duncrue waste-infrastructure context because the council report names the Waste Transfer Station but does not provide a street address.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, station address, weighbridge specification, contractor, commissioning evidence, final cost, or later operational performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ballysillan_whiterock_3g_pitches_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/sports pitch completion",
    title: "Ballysillan and Whiterock 3G pitches were reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Ballysillan and Whiterock 3G pitches with DfC among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded completed sports-pitch works across the Ballysillan and Whiterock project contexts.",
    area: "Ballysillan and Whiterock / Belfast",
    latitude: 54.60682545,
    longitude: -5.9778766,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-ballysillan-whiterock-3g-pitches-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name sports-pitch designers or contractors for this completed-project list item",
    project_type: "3G sports pitch completion",
    geometry_source: "Programme-approximate point placed between Ballysillan and Whiterock public sports-facility contexts because the council report names a two-site project but does not provide pitch addresses.",
    geometry_precision: "programme approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, pitch boundaries, specification, contractor, access arrangements, final cost, opening event, or later pitch condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_balmoral_bowling_club_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/sports facility completion",
    title: "Balmoral Bowling Club project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Balmoral Bowling Club among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed bowling-club capital project.",
    area: "Balmoral / South Belfast",
    latitude: 54.5520244,
    longitude: -5.9327498,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-balmoral-bowling-club-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "bowling club capital works completion",
    geometry_source: "Approximate point placed at Balmoral Bowling Club from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, works scope, contractor, access changes, final cost, reopening event, or later club condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lisnasharragh_community_schools_project_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/community schools completion",
    title: "Lisnasharragh Community Schools Project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Lisnasharragh Community Schools Project among recently completed Belfast Investment Fund schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed community-schools project milestone.",
    area: "Lisnasharragh / East Belfast",
    latitude: 54.577129,
    longitude: -5.8819518,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-lisnasharragh-community-schools-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "community schools project completion",
    geometry_source: "Approximate point placed at Lisnasharragh public facility context because the council report names the project but does not provide a street address.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, site boundary, partner-school scope, contractor, final cost, opening arrangements, or later use."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_wishing_well_family_centre_play_space_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/play space completion",
    title: "Wishing Well Family Centre play space was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed Wishing Well Family Centre play space among recently completed Local Investment Fund schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed family-centre play-space project.",
    area: "Oldpark / North Belfast",
    latitude: 54.6200904,
    longitude: -5.9587359,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-wishing-well-family-centre-play-space-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name play-space designers or contractors for this completed-project list item",
    project_type: "family centre play-space completion",
    geometry_source: "Approximate point placed at Wishing Well Family Centre from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, play-space specification, accessibility audit, contractor, final cost, opening arrangements, or later condition."
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
