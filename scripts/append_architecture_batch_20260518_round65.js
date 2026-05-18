const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeFeb2024 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=76904";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_oak_cancer_centre_completion_2022",
    date: "2022-11-01",
    bucket: "planning/development/architecture/healthcare",
    title: "Oak Cancer Centre was listed as built",
    summary:
      "New London Architecture records the Oak Cancer Centre at the Royal Marsden Hospital in Sutton as built, with estimated completion in November 2022.",
    observed_change:
      "A documented Sutton healthcare project was recorded as reaching built status.",
    area: "Sutton / London",
    latitude: 51.3425142,
    longitude: -0.1925159,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Oak Cancer Centre",
    source_url: "https://nla.london/projects/oak-cancer-centre",
    source_record_id: "nla-oak-cancer-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "BDP",
    project_type: "healthcare building completion",
    geometry_source: "Nominatim geocoder point for Royal Marsden Hospital / Downs Road, matching the NLA location context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact clinical opening date, service capacity, fit-out completion, patient outcomes, or later building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ucl_pearl_completion_2021",
    date: "2021-06-01",
    bucket: "planning/development/architecture/research facility",
    title: "UCL PEARL was listed as built",
    summary:
      "New London Architecture records UCL PEARL in Dagenham as built, with estimated completion in June 2021.",
    observed_change:
      "A documented Barking and Dagenham research-facility project was recorded as reaching built status.",
    area: "Dagenham / Barking and Dagenham",
    latitude: 51.5475141,
    longitude: 0.1706405,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: UCL PEARL",
    source_url: "https://nla.london/projects/ucl-pearl",
    source_record_id: "nla-ucl-pearl",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Penoyre & Prasad",
    project_type: "research facility completion",
    geometry_source: "Nominatim geocoder point for UCL PEARL at LondonEast-UK, used because the NLA address resolves to the wider campus context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact laboratory commissioning date, research programme start, access arrangements, or later facility condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ucl_faculty_laws_completion_2018",
    date: "2018-03-01",
    bucket: "planning/development/architecture/education refurbishment",
    title: "UCL Faculty of Laws was listed as built",
    summary:
      "New London Architecture records UCL Faculty of Laws at Endsleigh Gardens as built, with completion in March 2018.",
    observed_change:
      "A documented Camden university building project was recorded as reaching built status.",
    area: "Bloomsbury / Camden",
    latitude: 51.5262594,
    longitude: -0.131523,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: UCL Faculty of Laws",
    source_url: "https://nla.london/projects/ucl-faculty-of-laws",
    source_record_id: "nla-ucl-faculty-of-laws",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Levitt Bernstein",
    project_type: "university building refurbishment completion",
    geometry_source: "Nominatim geocoder point for 9-11 Endsleigh Gardens, matching the address context listed on the NLA page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact occupation date, teaching-space use, access changes, conservation conditions, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_lincolns_inn_great_hall_library_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/heritage refurbishment",
    title: "Lincoln's Inn Great Hall and Library was listed as built",
    summary:
      "New London Architecture records Lincoln's Inn Great Hall and Library as built, with estimated completion in December 2019.",
    observed_change:
      "A documented Holborn heritage and institutional refurbishment project was recorded as reaching built status.",
    area: "Holborn / Camden",
    latitude: 51.5155784,
    longitude: -0.1160849,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Lincoln's Inn Great Hall and Library",
    source_url: "https://nla.london/projects/lincolns-inn-great-hall-and-library-1",
    source_record_id: "nla-lincolns-inn-great-hall-and-library-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "MICA",
    project_type: "heritage hall and library refurbishment completion",
    geometry_source: "Nominatim geocoder point for Lincoln's Inn Fields, used as an approximate marker for the address context listed on the NLA page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact reopening date, conservation-condition discharge, user access, event programming, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_holland_park_playground_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/playground",
    title: "Holland Park Playground was listed as built",
    summary:
      "New London Architecture records Holland Park Playground as built, with estimated completion in July 2019.",
    observed_change:
      "A documented Kensington playground and landscape project was recorded as reaching built status.",
    area: "Holland Park / Kensington and Chelsea",
    latitude: 51.5018243,
    longitude: -0.2066489,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Holland Park Playground",
    source_url: "https://nla.london/projects/holland-park-playground",
    source_record_id: "nla-holland-park-playground",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Erect Architecture listed as lead consultant for landscape and play design",
    project_type: "playground and landscape completion",
    geometry_source: "Nominatim geocoder point for 55 Abbotsbury Road, the address context listed on the NLA page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public reopening date, play-equipment certification, maintenance arrangements, visitor counts, or later condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_caton_flats_flatbush_central_opening_2022",
    date: "2022-05-13",
    bucket: "planning/development/architecture/mixed use affordable housing",
    title: "Caton Flats and Flatbush Central opening was announced",
    summary:
      "The NYC Mayor's Office announced on May 13, 2022 the opening of affordable homes at Caton Flats and the Flatbush Central Caribbean Marketplace.",
    observed_change:
      "A documented city announcement recorded an opening milestone for a mixed-use affordable-housing and marketplace redevelopment.",
    area: "Flatbush / Brooklyn",
    latitude: 40.652862465888,
    longitude: -73.959391492696,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Caton Flats and Flatbush Central opening",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2022/05/mayor-adams-opens-250-affordable-homes-caton-flats-revitalized-flatbush-central-caribbean",
    source_record_id: "nyc-mayor-2022-05-13-caton-flats-flatbush-central-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Mayor's Office release does not name the project architect on the cited page",
    project_type: "mixed-use affordable housing and marketplace opening",
    geometry_source: "US Census geocoder point for 800 Flatbush Avenue, the Caton Flats/Flatbush Central site address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening announcement only. It does not independently verify lease-up, all retail tenant openings, affordability compliance, long-term operations, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_spofford_site_affordable_homes_opening_2022",
    date: "2022-06-22",
    bucket: "planning/development/architecture/adaptive reuse housing",
    title: "Former Spofford site affordable homes opening was announced",
    summary:
      "The NYC Mayor's Office announced on June 22, 2022 the opening of affordable homes on the former Spofford Juvenile Detention Center site in Hunts Point.",
    observed_change:
      "A documented city announcement recorded an opening milestone for the redevelopment of a former detention-center site.",
    area: "Hunts Point / Bronx",
    latitude: 40.814874657636,
    longitude: -73.891331602464,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Former Spofford site affordable homes opening",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2022/06/mayor-adams-opens-affordable-homes-former-site-spofford-juvenile-detention-center-where-he",
    source_record_id: "nyc-mayor-2022-06-22-spofford-site-affordable-homes-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Mayor's Office release does not name the project architect on the cited page",
    project_type: "former institutional site redevelopment opening",
    geometry_source: "US Census geocoder point for 720 Tiffany Street, the commonly cited former Spofford/The Peninsula site address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening announcement only. It does not verify full phase completion, all commercial/community-space openings, lease-up, affordability compliance, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brooklyn_army_terminal_climate_hub_operator_2025",
    date: "2025-05-22",
    bucket: "planning/development/architecture/adaptive reuse innovation hub",
    title: "Brooklyn Army Terminal climate innovation hub operator was announced",
    summary:
      "The NYC Mayor's Office announced on May 22, 2025 a consortium to design and operate a climate innovation hub at Brooklyn Army Terminal.",
    observed_change:
      "A documented city announcement recorded a design-and-operations milestone for an adaptive-reuse innovation hub.",
    area: "Sunset Park / Brooklyn",
    latitude: 40.6445674,
    longitude: -74.0261648,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Brooklyn Army Terminal climate innovation hub",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/05/mayor-adams-nycedc-consortium-design-operate-cutting-edge-climate-innovation-hub",
    source_record_id: "nyc-mayor-2025-05-22-brooklyn-army-terminal-climate-hub-operator",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement names a consortium but does not document a final building architect for constructed work",
    project_type: "adaptive reuse innovation hub planning milestone",
    geometry_source: "Nominatim geocoder point for Brooklyn Army Terminal Building A, used as the site context named in the announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a design-and-operations announcement only. It does not confirm final design approval, permits, construction start, tenant fit-out, opening date, or later hub operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_south_brooklyn_marine_terminal_construction_start_2024",
    date: "2024-06-10",
    bucket: "planning/development/architecture/port infrastructure",
    title: "South Brooklyn Marine Terminal construction start was announced",
    summary:
      "The NYC Mayor's Office announced on June 10, 2024 the start of construction to transform South Brooklyn Marine Terminal into an offshore wind port.",
    observed_change:
      "A documented city announcement recorded a construction-start milestone for a major waterfront port-infrastructure project.",
    area: "Sunset Park / Brooklyn",
    latitude: 40.658571,
    longitude: -74.0077872,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: South Brooklyn Marine Terminal construction start",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2024/06/mayor-adams-governor-hochul-nycedc-equinor-ssbmt-start-construction-transform",
    source_record_id: "nyc-mayor-2024-06-10-south-brooklyn-marine-terminal-construction-start",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Construction-start announcement does not name the full design team on the cited page",
    project_type: "port infrastructure construction-start milestone",
    geometry_source: "Nominatim geocoder point for South Brooklyn Marine Terminal, the waterfront site named in the announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a construction-start announcement only. It does not confirm later construction progress, operational opening, environmental performance, port throughput, or final public-realm condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hunts_point_marine_terminal_vision_2025",
    date: "2025-06-09",
    bucket: "planning/development/architecture/marine terminal planning",
    title: "Hunts Point Marine Terminal vision was announced",
    summary:
      "The NYC Mayor's Office announced on June 9, 2025 a plan to remove the decommissioned jail barge from Hunts Point and pursue a new marine terminal vision.",
    observed_change:
      "A documented city announcement recorded a waterfront site-planning milestone for a proposed marine terminal.",
    area: "Hunts Point / Bronx",
    latitude: 40.809759,
    longitude: -73.877941,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Hunts Point Marine Terminal vision",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/06/mayor-adams-nycedc-doc-plan-remove-decommissioned-jail-barge-hunts-point-unveil",
    source_record_id: "nyc-mayor-2025-06-09-hunts-point-marine-terminal-vision",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Vision-stage announcement does not name project architects",
    project_type: "marine terminal planning milestone",
    geometry_source: "Nominatim geocoder point for Food Center Drive, used as an approximate Hunts Point waterfront/industrial area marker because the announcement does not provide coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The event records a planning and site-clearance vision announcement only. It does not confirm barge removal completion, environmental review, design approval, permits, construction start, terminal opening, or operating outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_zoo_large_cats_sea_lion_pool_completed_2024",
    date: "2024-02-23",
    bucket: "planning/development/architecture/zoo infrastructure completion",
    title: "Belfast Zoo large-cats and sea-lion works were reported completed",
    summary:
      "Belfast City Council's February 23, 2024 Physical Programme report listed large-cats enclosure and sea-lion pool works at Belfast Zoo among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of zoo enclosure, pool, viewing-area, trail, greening, and art works.",
    area: "Belfast Zoo / North Belfast",
    latitude: 54.6572656,
    longitude: -5.942125,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 23 February 2024",
    source_url: belfastPhysicalProgrammeFeb2024,
    source_record_id: "bcc-physical-programme-2024-02-23-belfast-zoo-large-cats-sea-lion-pool-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "zoo enclosure and pool infrastructure completion",
    geometry_source: "Nominatim geocoder point for Belfast Zoo, matching the council project location.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the zoo works among recently completed projects but does not give exact completion date, enclosure-by-enclosure scope, contractor, final cost, animal-management details, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_loughside_park_trim_trail_completed_2024",
    date: "2024-02-23",
    bucket: "planning/development/architecture/park fitness infrastructure",
    title: "Loughside Park trim trail was reported completed",
    summary:
      "Belfast City Council's February 23, 2024 Physical Programme report listed Loughside Park Trim Trail among projects completed in the previous six months.",
    observed_change:
      "A documented council physical-programme report recorded completion of a park fitness-infrastructure milestone.",
    area: "Loughside Park / North Belfast",
    latitude: 54.6374235,
    longitude: -5.9220764,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 23 February 2024",
    source_url: belfastPhysicalProgrammeFeb2024,
    source_record_id: "bcc-physical-programme-2024-02-23-loughside-park-trim-trail-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "park trim trail completion",
    geometry_source: "Nominatim geocoder point for Loughside Park, matching the park named in the council report.",
    geometry_precision: "park approximate",
    limitations:
      "The report lists the trim trail among recently completed projects but does not give exact completion date, equipment schedule, safety certification, contractor, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_avoniel_lisnasharragh_cycle_stands_completed_2024",
    date: "2024-02-23",
    bucket: "planning/development/architecture/cycle infrastructure completion",
    title: "Avoniel and Lisnasharragh covered cycle stands were reported completed",
    summary:
      "Belfast City Council's February 23, 2024 Physical Programme report listed new covered cycle stands at Avoniel and Lisnasharragh Leisure Centres among projects completed in the previous six months.",
    observed_change:
      "A documented council physical-programme report recorded completion of a two-site leisure-centre cycle-stand milestone.",
    area: "Avoniel and Lisnasharragh / Belfast",
    latitude: 54.5947614,
    longitude: -5.8961848,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 23 February 2024",
    source_url: belfastPhysicalProgrammeFeb2024,
    source_record_id: "bcc-physical-programme-2024-02-23-avoniel-lisnasharragh-cycle-stands-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "covered cycle-stand completion",
    geometry_source: "Nominatim geocoder point for Avoniel Leisure Centre, used as one marker for a two-site cycle-stand programme that also names Lisnasharragh Leisure Centre.",
    geometry_precision: "multi-site programme approximate",
    limitations:
      "The report lists the cycle stands among recently completed projects but does not give exact completion dates, stand counts, contractor, final cost, usage, or later condition at either site."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_shankill_graveyard_boundary_wall_completed_2024",
    date: "2024-02-23",
    bucket: "planning/development/architecture/heritage boundary works",
    title: "Shankill Graveyard boundary wall works were reported completed",
    summary:
      "Belfast City Council's February 23, 2024 Physical Programme report listed boundary wall works at Shankill Graveyard among projects completed in the previous six months.",
    observed_change:
      "A documented council physical-programme report recorded completion of a graveyard boundary-wall works milestone.",
    area: "Shankill Graveyard / Belfast",
    latitude: 54.6061335,
    longitude: -5.9582991,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 23 February 2024",
    source_url: belfastPhysicalProgrammeFeb2024,
    source_record_id: "bcc-physical-programme-2024-02-23-shankill-graveyard-boundary-wall-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name conservation specialists, designers, or contractors for this completed-project list item",
    project_type: "heritage boundary-wall works completion",
    geometry_source: "Nominatim geocoder point for Shankill Graveyard, matching the location named in the council report.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the boundary wall works among recently completed projects but does not give exact completion date, wall segment, conservation method, contractor, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cavehill_playground_embankment_slide_completed_2024",
    date: "2024-02-23",
    bucket: "planning/development/architecture/playground improvement",
    title: "Cavehill Country Park playground embankment slide was reported completed",
    summary:
      "Belfast City Council's February 23, 2024 Physical Programme report listed the Cavehill Country Park playground embankment slide among projects completed in the previous six months.",
    observed_change:
      "A documented council physical-programme report recorded completion of a playground-improvement milestone.",
    area: "Cave Hill Country Park / North Belfast",
    latitude: 54.644329,
    longitude: -5.939876,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 23 February 2024",
    source_url: belfastPhysicalProgrammeFeb2024,
    source_record_id: "bcc-physical-programme-2024-02-23-cavehill-playground-embankment-slide-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this completed-project list item",
    project_type: "playground embankment-slide completion",
    geometry_source: "OpenStreetMap/Overpass point for Cavehill Adventurous Playground, used as the approximate playground marker for the council report item.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the embankment slide among recently completed projects but does not give exact completion date, equipment specification, safety certification, contractor, final cost, or later playground condition."
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
