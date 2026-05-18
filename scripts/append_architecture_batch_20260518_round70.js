const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningOct2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11881&Ver=4";
const belfastPlanningNov2024 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?MId=11883";
const belfastPlanningDec2024 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?MId=11931";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_park_walk_primary_school_playground_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/playground",
    title: "Park Walk Primary School playground was listed as built",
    summary:
      "New London Architecture records Park Walk Primary School Playground at 1 Camera Place in Kensington and Chelsea as built, with estimated completion in December 2019.",
    observed_change:
      "A documented west London school-playground project was recorded as reaching built status.",
    area: "Chelsea / Kensington and Chelsea",
    latitude: 51.4845825,
    longitude: -0.1789574,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Park Walk Primary School Playground",
    source_url: "https://nla.london/projects/park-walk-primary-school-playground",
    source_record_id: "nla-park-walk-primary-school-playground",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Foster + Partners",
    project_type: "school playground completion",
    geometry_source:
      "Nominatim geocoder point for 1 Camera Place, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, school timetable changes, pupil-capacity changes, later maintenance, or site condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_cator_park_kidbrooke_village_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/public realm",
    title: "Cator Park, Kidbrooke Village was listed as built",
    summary:
      "New London Architecture records Cator Park, Kidbrooke Village in Greenwich as built, with estimated completion in June 2019.",
    observed_change:
      "A documented Greenwich park and public-realm landscape project was recorded as reaching built status.",
    area: "Kidbrooke / Greenwich",
    latitude: 51.4635579,
    longitude: 0.0247086,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Cator Park, Kidbrooke Village",
    source_url: "https://nla.london/projects/cator-park-kidbrooke-village",
    source_record_id: "nla-cator-park-kidbrooke-village",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP is listed as landscape architect; Lifschutz Davidson Sandilands is listed as architect.",
    project_type: "park and public-realm completion",
    geometry_source:
      "Nominatim geocoder point for 1 Old Post Office Lane, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, landscape establishment, maintenance regime, ecological outcomes, or later site condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_chapter_london_bridge_under_construction_2025",
    date: "2025-01-13",
    bucket: "planning/development/architecture/student accommodation construction status",
    title: "Chapter London Bridge was listed as under construction",
    summary:
      "New London Architecture records Chapter London Bridge at 48-50 Weston Street in Southwark as under construction, with estimated completion in August 2025.",
    observed_change:
      "A documented Southwark student-accommodation project was recorded with under-construction status.",
    area: "London Bridge / Southwark",
    latitude: 51.5026475,
    longitude: -0.0855162,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Chapter London Bridge",
    source_url: "https://nla.london/projects/chapter-london-bridge-4",
    source_record_id: "nla-chapter-london-bridge-4",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA last-updated date and under-construction status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Kohn Pedersen Fox (KPF)",
    project_type: "student accommodation construction status",
    geometry_source:
      "Nominatim geocoder point for 48-50 Weston Street, matching the address listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records an NLA status snapshot only. It does not confirm practical completion, occupation, room availability, final height, later design changes, or post-completion condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_99_city_road_planning_granted_2025",
    date: "2025-03-05",
    bucket: "planning/development/architecture/office planning status",
    title: "99 City Road was listed as planning granted",
    summary:
      "New London Architecture records 99 City Road in Islington as Planning Granted, with the project page last updated on March 5, 2025.",
    observed_change:
      "A documented Islington office-tower and public-realm project was recorded with planning-granted status.",
    area: "Old Street / Islington",
    latitude: 51.5256789,
    longitude: -0.0863126,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 99 City Road",
    source_url: "https://nla.london/projects/99-city-road-3",
    source_record_id: "nla-99-city-road-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA last-updated date and planning-granted status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "New London Architecture lists Kohn Pedersen Fox (KPF) as the submitting practice for this project page.",
    project_type: "office redevelopment planning status",
    geometry_source:
      "Nominatim geocoder point for 99 City Road, matching the location listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a curated planning-status snapshot only. It does not confirm committee date, consent issue date, condition discharge, construction start, future completion, occupancy, or building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_cuba_street_planning_granted_2025",
    date: "2025-01-13",
    bucket: "planning/development/architecture/residential tower planning status",
    title: "Cuba Street was listed as planning granted",
    summary:
      "New London Architecture records Cuba Street at 26 Cuba Street in Tower Hamlets as Planning Granted, with the project page last updated on January 13, 2025.",
    observed_change:
      "A documented Isle of Dogs residential-tower project was recorded with planning-granted status.",
    area: "Isle of Dogs / Tower Hamlets",
    latitude: 51.5016201,
    longitude: -0.026623,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Cuba Street",
    source_url: "https://nla.london/projects/cuba-street-2",
    source_record_id: "nla-cuba-street-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA last-updated date and planning-granted status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Morris+Company",
    project_type: "residential tower planning status",
    geometry_source:
      "Nominatim geocoder point for Cuba Street, used as an approximate marker for 26 Cuba Street listed on the NLA project page.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a curated planning-status snapshot only. It does not confirm committee date, consent issue date, condition discharge, construction start, future completion, sales, occupation, or final public-realm delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_compass_residences_first_buildings_completion_2016",
    date: "2016-11-17",
    bucket: "planning/development/architecture/affordable housing",
    title: "Compass Residences first two buildings were completed",
    summary:
      "NYC HDC announced on November 17, 2016 a ribbon-cutting completion milestone for Compass Residences buildings 1A and 1B at 1490 and 1500 Boone Avenue in the Bronx.",
    observed_change:
      "A documented city and state housing-agency release recorded completion of the first two buildings in a multi-phase residential development.",
    area: "Crotona Park East / West Farms, Bronx",
    latitude: 40.831824,
    longitude: -73.885543,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Compass Residences first two buildings completion",
    source_url:
      "https://www.nychdc.com/newsroom/city-and-state-housing-agencies-join-project-partners-celebrate-completion-first-two",
    source_record_id: "nychdc-2016-11-17-compass-residences-first-buildings",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Dattner Architects is named in the HDC release as a project partner.",
    project_type: "affordable housing completion",
    geometry_source:
      "Midpoint of Nominatim geocoder points for 1490 and 1500 Boone Avenue, matching the addresses listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records the ribbon-cutting completion of the first two buildings only. It does not confirm completion of the full multi-phase development, full lease-up, affordability compliance, later retail occupancy, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_harlem_dowling_completion_2017",
    date: "2017-05-15",
    bucket: "planning/development/architecture/affordable housing",
    title: "Harlem Dowling completion was announced",
    summary:
      "NYC HDC announced on May 15, 2017 a completion milestone for Harlem Dowling, a 60-unit affordable housing and community-facility development at 2139 Adam Clayton Powell Jr. Boulevard.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of a new affordable housing and community-facility building.",
    area: "Central Harlem / Manhattan",
    latitude: 40.8099882,
    longitude: -73.9471209,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Harlem Dowling completion",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-and-hdc-join-harlem-dowling-childrens-village-alembic-community-development-and",
    source_record_id: "nychdc-2017-05-15-harlem-dowling-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing and community-facility completion",
    geometry_source:
      "Nominatim geocoder point for 2139 Adam Clayton Powell Jr. Boulevard, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, resident services, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1755_watson_groundbreaking_2018",
    date: "2018-12-13",
    bucket: "planning/development/architecture/affordable housing construction start",
    title: "1755 Watson groundbreaking was announced",
    summary:
      "NYC HDC announced on December 13, 2018 a start-of-construction milestone for 1755 Watson, a 326-unit mixed-income, mixed-use affordable housing development in Soundview.",
    observed_change:
      "A documented city housing-finance announcement recorded the start of construction for a Bronx affordable housing development.",
    area: "Soundview / Bronx",
    latitude: 40.8279569,
    longitude: -73.867822,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: 1755 Watson groundbreaking",
    source_url:
      "https://www.nychdc.com/newsroom/hdc-and-hpd-join-project-partners-break-ground-new-mixed-income-mixed-use-326-unit",
    source_record_id: "nychdc-2018-12-13-1755-watson-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing construction start",
    geometry_source:
      "Nominatim geocoder point for 1755 Watson Avenue, matching the project name and location stated in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm construction completion, final unit delivery, retail occupancy, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_park_avenue_green_completion_2019",
    date: "2019-02-14",
    bucket: "planning/development/architecture/affordable housing",
    title: "Park Avenue Green completion was announced",
    summary:
      "NYC HDC announced on February 14, 2019 a completion milestone for Park Avenue Green, a 154-unit affordable passive-house development at 2980 Park Avenue in the Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of a Bronx affordable housing passive-house building.",
    area: "Melrose / Bronx",
    latitude: 40.8201593,
    longitude: -73.9228892,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Park Avenue Green completion",
    source_url:
      "https://www.nychdc.com/newsroom/hdc-and-hpd-join-omni-new-york-celebrate-completion-new-154-unit-affordable-housing",
    source_record_id: "nychdc-2019-02-14-park-avenue-green-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing completion",
    geometry_source:
      "Nominatim geocoder point for 2980 Park Avenue, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, energy performance, affordability compliance, resident services, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_one_flushing_completion_2019",
    date: "2019-02-21",
    bucket: "planning/development/architecture/affordable housing",
    title: "One Flushing completion was announced",
    summary:
      "NYC HDC announced on February 21, 2019 a completion milestone for One Flushing, a 231-unit multifamily affordable housing development at 133-45 41st Avenue.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of a mixed-use affordable housing development in Downtown Flushing.",
    area: "Downtown Flushing / Queens",
    latitude: 40.7578859,
    longitude: -73.8307279,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: One Flushing completion",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-aafe-hanac-and-monadnock-development-celebrate-completion-new-231-unit",
    source_record_id: "nychdc-2019-02-21-one-flushing-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Bernheimer Architecture is listed as designer, with SLCE Architects serving as executive architect.",
    project_type: "affordable mixed-use housing completion",
    geometry_source:
      "Nominatim geocoder point for One Flushing at 133-45 41st Avenue, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, supportive-service delivery, retail occupancy, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_1_millennium_way_factory_condition_variation_2024",
    date: "2024-10-15",
    bucket: "planning/development/architecture/factory planning approval",
    title: "1 Millennium Way factory-extension condition variation was approved",
    summary:
      "Belfast City Council Planning Committee minutes for October 15, 2024 record approval to vary the condition for a Class B3 factory extension with associated access, servicing, parking and landscaping at 1 Millennium Way.",
    observed_change:
      "A documented planning-committee minute recorded a condition-variation approval milestone for a factory-extension proposal.",
    area: "Springfield / Belfast",
    latitude: 54.5986426,
    longitude: -5.963339,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 15 October 2024",
    source_url: belfastPlanningOct2024,
    source_record_id: "bcc-planning-2024-10-15-la04-2023-2861-1-millennium-way",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and condition-variation minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "factory extension condition variation",
    geometry_source:
      "Nominatim geocoder point for Millennium Way, used as an approximate marker for the 1 Millennium Way site listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a condition-variation approval only. It does not confirm condition discharge, construction start, completion, operational capacity, employment outcomes, later alterations, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_fanum_norwood_pbmsa_permission_2024",
    date: "2024-11-12",
    bucket: "planning/development/architecture/student accommodation planning approval",
    title: "Fanum House and Norwood House student-accommodation scheme was approved",
    summary:
      "Belfast City Council Planning Committee minutes for November 12, 2024 record planning permission for demolition of existing Fanum House and Norwood House buildings and construction of a 560-room Purpose Built Managed Student Accommodation scheme at 96-110 Great Victoria Street.",
    observed_change:
      "A documented planning-committee minute recorded a student-accommodation approval milestone on Great Victoria Street.",
    area: "Great Victoria Street / Belfast city centre",
    latitude: 54.5941001,
    longitude: -5.9343399,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 12 November 2024",
    source_url: belfastPlanningNov2024,
    source_record_id: "bcc-planning-2024-11-12-la04-2024-0664-fanum-norwood",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "student accommodation planning approval",
    geometry_source:
      "Nominatim geocoder point for Great Victoria Street, used as an approximate marker for 96-110 Great Victoria Street listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a planning approval only. It does not confirm condition discharge, demolition timing, construction start, completion, student occupancy, public-realm delivery, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dargan_road_film_studio_extension_permission_2024",
    date: "2024-11-12",
    bucket: "planning/development/architecture/film studio planning approval",
    title: "Dargan Road film-studio extension was approved",
    summary:
      "Belfast City Council Planning Committee minutes for November 12, 2024 record planning permission for a retrospective extension to film studios north of Dargan Road at North Foreshore/Giants Park.",
    observed_change:
      "A documented planning-committee minute recorded a film-studio extension approval milestone at the North Foreshore site.",
    area: "North Foreshore / Belfast Harbour",
    latitude: 54.6338945,
    longitude: -5.908678,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 12 November 2024",
    source_url: belfastPlanningNov2024,
    source_record_id: "bcc-planning-2024-11-12-la04-2024-0755-dargan-road-film-studio",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "film studio extension planning approval",
    geometry_source:
      "Nominatim geocoder point for Belfast Harbour Studios on Dargan Road, matching the site context listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a retrospective planning approval only. It does not confirm original construction date, studio operations, production activity, electrical capacity, later alterations, or site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_castle_fountain_pbmsa_permission_2024",
    date: "2024-12-10",
    bucket: "planning/development/architecture/student accommodation planning approval",
    title: "Castle Street and Fountain Street student-accommodation scheme was approved",
    summary:
      "Belfast City Council Planning Committee minutes for December 10, 2024 record planning permission for demolition of existing buildings and construction of an 821-room Purpose Built Multi Storey Managed Student Accommodation scheme across Castle Street, Queen Street and Fountain Street.",
    observed_change:
      "A documented planning-committee minute recorded a major student-accommodation approval milestone in Belfast city centre.",
    area: "Castle Street / Belfast city centre",
    latitude: 54.5993608,
    longitude: -5.9348713,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 10 December 2024",
    source_url: belfastPlanningDec2024,
    source_record_id: "bcc-planning-2024-12-10-la04-2024-1138-castle-fountain-pbmsa",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "student accommodation planning approval",
    geometry_source:
      "Nominatim geocoder point for Castle Street, used as an approximate marker for the Castle Street, Queen Street and Fountain Street site listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a planning approval only. It does not confirm demolition timing, condition discharge, construction start, completion, student occupancy, short-term-use operation, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_westland_house_laboratories_permission_2024",
    date: "2024-12-10",
    bucket: "planning/development/architecture/laboratory planning approval",
    title: "Westland House analytical-services laboratories were approved",
    summary:
      "Belfast City Council Planning Committee minutes for December 10, 2024 record planning permission for redevelopment of storage sheds, temporary office structures and yard area to provide replacement Analytical Services Laboratories at Westland House, 40 Old Westland Road.",
    observed_change:
      "A documented planning-committee minute recorded a laboratory redevelopment approval milestone at Westland House.",
    area: "Westland / North Belfast",
    latitude: 54.6265711,
    longitude: -5.9468964,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 10 December 2024",
    source_url: belfastPlanningDec2024,
    source_record_id: "bcc-planning-2024-12-10-la04-2023-4405-westland-house-labs",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "laboratory redevelopment planning approval",
    geometry_source:
      "Nominatim geocoder point for Old Westland Road, used as an approximate marker for Westland House at 40 Old Westland Road listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a planning approval only. It does not confirm condition discharge, demolition or removal timing, construction start, laboratory commissioning, occupancy, later alterations, or site condition."
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
