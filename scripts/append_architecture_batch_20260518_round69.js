const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningApr2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11670";
const belfastPlanningJun2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11674";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_observatory_block_graveney_school_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/school",
    title: "The Observatory Block at Graveney School was listed as built",
    summary:
      "New London Architecture records The Observatory Block at Graveney School in Wandsworth as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Wandsworth school-building project was recorded as reaching built status.",
    area: "Furzedown / Wandsworth",
    latitude: 51.4238879,
    longitude: -0.1511743,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Observatory Block at Graveney School",
    source_url: "https://nla.london/projects/the-observatory-block-graveney-school",
    source_record_id: "nla-the-observatory-block-graveney-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Urban Projects Bureau Ltd",
    project_type: "school building completion",
    geometry_source: "Nominatim geocoder point for Graveney School on Welham Road, matching the school-site context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, school timetable changes, pupil-capacity changes, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_arabica_kings_cross_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/restaurant fit-out",
    title: "Arabica King's Cross was listed as built",
    summary:
      "New London Architecture records Arabica King's Cross at 7 Lewis Cubitt Walk as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Camden restaurant fit-out project was recorded as reaching built status.",
    area: "King's Cross / Camden",
    latitude: 51.537718,
    longitude: -0.1249874,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Arabica King's Cross",
    source_url: "https://nla.london/projects/arabica-kings-cross",
    source_record_id: "nla-arabica-kings-cross",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Gundry + Ducker",
    project_type: "restaurant fit-out completion",
    geometry_source: "Nominatim geocoder point for Arabica at 7 Lewis Cubitt Walk, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, licensing, tenant operations, later fit-out changes, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_elsley_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/office refurbishment",
    title: "Elsley was listed as built",
    summary:
      "New London Architecture records Elsley at 20 Great Titchfield Street in Westminster as built, with estimated completion in July 2019.",
    observed_change:
      "A documented Westminster office refurbishment project was recorded as reaching built status.",
    area: "Fitzrovia / Westminster",
    latitude: 51.517413,
    longitude: -0.1396562,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Elsley",
    source_url: "https://nla.london/projects/elsley",
    source_record_id: "nla-elsley",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Burwell Architects",
    project_type: "office refurbishment completion",
    geometry_source: "Nominatim geocoder point for Elsley House and Elsley Court at 20-30 Great Titchfield Street, matching the address context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, occupancy, lease status, later refurbishment, or operational performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bute_house_preparatory_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/school refurbishment",
    title: "Bute House Preparatory School was listed as built",
    summary:
      "New London Architecture records Bute House Preparatory School in Hammersmith as built, with completion in January 2020.",
    observed_change:
      "A documented Hammersmith school specialist-teaching-space project was recorded as reaching built status.",
    area: "Hammersmith / Hammersmith and Fulham",
    latitude: 51.4953658,
    longitude: -0.2213276,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bute House Preparatory School",
    source_url: "https://nla.london/projects/bute-house-preparatory-school",
    source_record_id: "nla-bute-house-preparatory-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Mackenzie Wheeler Architects",
    project_type: "school refurbishment completion",
    geometry_source: "Nominatim geocoder point for 12 Luxemburg Gardens, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact school opening date, curriculum changes, pupil-capacity changes, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_no1_grosvenor_square_completion_2021",
    date: "2021-04-01",
    bucket: "planning/development/architecture/residential conversion",
    title: "No.1 Grosvenor Square was listed as built",
    summary:
      "New London Architecture records No.1 Grosvenor Square in Westminster as built, with completion in April 2021.",
    observed_change:
      "A documented Westminster former-embassy residential conversion project was recorded as reaching built status.",
    area: "Mayfair / Westminster",
    latitude: 51.5116367,
    longitude: -0.1498069,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: No.1 Grosvenor Square",
    source_url: "https://nla.london/projects/no1-grosvenor-square",
    source_record_id: "nla-no1-grosvenor-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects is listed as executive architect; Eric Parry Architects is listed as planning architect.",
    project_type: "residential conversion completion",
    geometry_source: "Nominatim geocoder point for 3 Grosvenor Square, matching the location listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, sales, occupation, listed-building condition discharge, later fit-out, or building performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hemlock_opening_2019",
    date: "2019-05-10",
    bucket: "planning/development/architecture/affordable housing",
    title: "The Hemlock opening was announced",
    summary:
      "NYC HDC announced on May 10, 2019 an opening milestone for The Hemlock at 1000 Fox Street in the South Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of an affordable housing building.",
    area: "South Bronx / Bronx",
    latitude: 40.82352,
    longitude: -73.893791,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: The Hemlock and The Mulberry opening",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-and-hdc-join-property-resources-corporation-and-camber-property-group-celebrate",
    source_record_id: "nychdc-2019-05-10-hemlock-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing opening",
    geometry_source: "Nominatim geocoder point for 1000 Fox Street, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, affordability compliance, resident services, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_mulberry_opening_2019",
    date: "2019-05-10",
    bucket: "planning/development/architecture/affordable housing",
    title: "The Mulberry opening was announced",
    summary:
      "NYC HDC announced on May 10, 2019 an opening milestone for The Mulberry at 960 Simpson Street in the South Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of an affordable housing building.",
    area: "South Bronx / Bronx",
    latitude: 40.8216837,
    longitude: -73.892757,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: The Hemlock and The Mulberry opening",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-and-hdc-join-property-resources-corporation-and-camber-property-group-celebrate",
    source_record_id: "nychdc-2019-05-10-mulberry-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing opening",
    geometry_source: "Nominatim geocoder point for 960 Simpson Street, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, affordability compliance, resident services, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_603_mother_gaston_opening_2018",
    date: "2018-05-03",
    bucket: "planning/development/architecture/supportive affordable housing",
    title: "603 Mother Gaston Boulevard opening was announced",
    summary:
      "NYC HDC announced on May 3, 2018 a grand-opening milestone for 603 Mother Gaston Boulevard, a supportive and affordable housing development in Brownsville.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of a supportive and affordable housing building.",
    area: "Brownsville / Brooklyn",
    latitude: 40.6641661,
    longitude: -73.905086,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: 603 Mother Gaston Boulevard grand opening",
    source_url:
      "https://www.nychdc.com/newsroom/federal-state-and-city-officials-join-camba-housing-ventures-and-camba-celebrate-grand",
    source_record_id: "nychdc-2018-05-03-603-mother-gaston-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "supportive affordable-housing opening",
    geometry_source: "Nominatim geocoder point for 603 Mother Gaston Boulevard, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a grand-opening announcement only. It does not independently verify full lease-up, supportive-service delivery, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_la_central_ab_ribbon_cutting_2021",
    date: "2021-06-16",
    bucket: "planning/development/architecture/affordable housing mixed-use",
    title: "La Central A and B ribbon cutting was announced",
    summary:
      "NYC HDC announced on June 16, 2021 a ribbon-cutting milestone for buildings A and B of the La Central development at 556 and 600 Bergen Avenue in the Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of two affordable mixed-use housing buildings.",
    area: "The Hub / Bronx",
    latitude: 40.8165002,
    longitude: -73.9155134,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: La Central A and B ribbon cutting",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-development-partners-la-central-b-ribbon-cutting",
    source_record_id: "nychdc-2021-06-16-la-central-a-b-ribbon-cutting",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable mixed-use housing opening",
    geometry_source: "Midpoint of Nominatim geocoder points for 556 and 600 Bergen Avenue, the two addresses listed in the HDC release.",
    geometry_precision: "multi-building approximate",
    limitations:
      "The event records a ribbon-cutting announcement for buildings A and B only. It does not confirm final phase delivery, full lease-up, community-facility operations, retail occupancy, affordability compliance, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_425_grand_concourse_opening_2022",
    date: "2022-11-02",
    bucket: "planning/development/architecture/affordable housing mixed-use",
    title: "425 Grand Concourse opening was announced",
    summary:
      "NYC HDC announced on November 2, 2022 a ribbon-cutting and official-opening milestone for 425 Grand Concourse, a 26-story affordable apartment building with community amenities in the Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of a mixed-use affordable housing high-rise.",
    area: "Mott Haven / Bronx",
    latitude: 40.8171169,
    longitude: -73.9280721,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: 425 Grand Concourse ribbon cutting",
    source_url:
      "https://www.nychdc.com/newsroom/cutting-edge-425-grand-concourse-building-brings-277-affordable-apartments-and-holistic",
    source_record_id: "nychdc-2022-11-02-425-grand-concourse-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "mixed-use affordable housing opening",
    geometry_source: "Nominatim geocoder point for 425 Grand Concourse, matching the address named in the HDC release title and text.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting and opening announcement only. It does not independently verify full lease-up, certification status, facility operations, affordability compliance, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_connswater_community_centre_container_renewal_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/temporary structure approval",
    title: "Connswater Community Centre bike container renewal was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record temporary two-year planning permission for a shipping container for bikes and equipment on land adjacent to Connswater Community Centre.",
    observed_change:
      "A documented planning-committee minute recorded renewal of temporary permission for a small community-equipment structure.",
    area: "Connswater / East Belfast",
    latitude: 54.5995067,
    longitude: -5.8912478,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2024-0334-connswater-community-centre-container",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name designers for this temporary-structure item",
    project_type: "temporary shipping-container planning renewal",
    geometry_source: "Nominatim geocoder point for Connswater Community Centre, used as an approximate marker for adjacent land described in the minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records temporary planning permission only. It does not confirm installation status, storage use, operational arrangements, later renewal, removal, or structure condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_402_newtownards_road_timber_structure_renewal_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/temporary structure approval",
    title: "402 Newtownards Road timber structure renewal was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record renewal of planning permission for a temporary single-storey timber structure at 402 Newtownards Road.",
    observed_change:
      "A documented planning-committee minute recorded renewal of permission for a temporary public-space timber structure.",
    area: "C.S. Lewis Square / East Belfast",
    latitude: 54.5981405,
    longitude: -5.8911324,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2023-2849-402-newtownards-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "temporary timber-structure planning renewal",
    geometry_source: "Nominatim geocoder point for 402 Newtownards Road, matching the address listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records renewal of planning permission only. It does not confirm structure condition, public use levels, maintenance, later renewal, removal, or wider public-realm outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_nicos_lisburn_road_glazed_box_permission_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/restaurant extension approval",
    title: "Nicos Lisburn Road glazed-box seating enclosure was approved",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record temporary three-year planning permission for a glazed box enclosing existing external seating at Nicos, 54 Lisburn Road.",
    observed_change:
      "A documented planning-committee minute recorded temporary permission for a restaurant seating enclosure.",
    area: "Lisburn Road / South Belfast",
    latitude: 54.5864215,
    longitude: -5.9393394,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2023-4616-nicos-54-lisburn-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "restaurant seating enclosure planning approval",
    geometry_source: "Nominatim geocoder point for 54-66 Lisburn Road, matching the address context listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records temporary planning permission only. It does not confirm construction, licensing, operating hours, later renewal, removal, or restaurant performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_cycle_racks_lbc_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/listed building consent",
    title: "Belfast City Hall cycle-rack replacement received listed-building consent",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record Listed Building Consent for replacing wall-mounted cycle racks with semi-vertical cycle racks at 2 Belfast City Hall.",
    observed_change:
      "A documented planning-committee minute recorded a listed-building-consent milestone for cycle-rack changes at City Hall.",
    area: "Donegall Square / Belfast city centre",
    latitude: 54.5967611,
    longitude: -5.9300722,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2024-0778-belfast-city-hall-cycle-racks",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and listed-building-consent minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name designers for this listed-building-consent item",
    project_type: "cycle-rack listed-building consent",
    geometry_source: "Nominatim geocoder point for Belfast City Hall, matching the location listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records listed-building consent only. It does not confirm installation, cycle-parking capacity, maintenance, later alterations, or access outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dorchester_house_aparthotel_permission_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/aparthotel planning approval",
    title: "Dorchester House aparthotel conversion was approved",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record planning permission for change of use from offices to aparthotel, additional upper floors, elevational alterations, and associated development at Dorchester House, 52-58 Great Victoria Street.",
    observed_change:
      "A documented planning-committee minute recorded an aparthotel conversion and extension approval milestone.",
    area: "Great Victoria Street / Belfast city centre",
    latitude: 54.5941001,
    longitude: -5.9343399,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2023-3821-dorchester-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "office-to-aparthotel conversion approval",
    geometry_source: "Nominatim geocoder point for Great Victoria Street, used as an approximate marker for Dorchester House at 52-58 Great Victoria Street because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm condition discharge, construction start, completion, licensing, aparthotel operations, or later building condition."
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
