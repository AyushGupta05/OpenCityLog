const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningApr2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11670";
const belfastPlanningMay2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11672";
const belfastPlanningJun2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11674";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_10_18_union_street_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/institutional adaptive reuse",
    title: "10-18 Union Street was listed as built",
    summary:
      "New London Architecture records 10-18 Union Street in Southwark as built, with completion in February 2020.",
    observed_change:
      "A documented Southwark institutional and workplace project was recorded as reaching built status.",
    area: "Borough / Southwark",
    latitude: 51.5036662,
    longitude: -0.0922066,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 10-18 Union Street",
    source_url: "https://nla.london/projects/10-18-union-street-london-se1",
    source_record_id: "nla-10-18-union-street-london-se1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bennetts Associates is identified in the NLA project text; the cited project-information block lists CBRE and delivery-team roles rather than a separate architect field.",
    project_type: "institutional adaptive-reuse completion",
    geometry_source: "Nominatim geocoder point for 10-18 Union Street, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, occupation, programme delivery, later refurbishment, or building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_guys_cancer_treatment_centre_completion_2017",
    date: "2017-05-01",
    bucket: "planning/development/architecture/healthcare",
    title: "Guy's Cancer Treatment Centre was listed as built",
    summary:
      "New London Architecture records Guy's Cancer Treatment Centre on Great Maze Pond as built, with completion in May 2017.",
    observed_change:
      "A documented Southwark healthcare project was recorded as reaching built status.",
    area: "London Bridge / Southwark",
    latitude: 51.5041379,
    longitude: -0.0873489,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Guy's Cancer Treatment Centre",
    source_url: "https://nla.london/projects/guys-cancer-treatment-centre",
    source_record_id: "nla-guys-cancer-treatment-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Sonnemann Toon Architects LLP",
    project_type: "healthcare facility completion",
    geometry_source: "Nominatim geocoder point for Great Maze Pond, matching the address listed on the NLA project page.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact clinical commissioning date, patient access, equipment operation, later service changes, or building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hyatt_great_scotland_yard_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/hotel heritage refurbishment",
    title: "Hyatt Hotel at Great Scotland Yard was listed as built",
    summary:
      "New London Architecture records the Hyatt Hotel at Great Scotland Yard in Westminster as built, with estimated completion in December 2019.",
    observed_change:
      "A documented Westminster hotel and heritage refurbishment project was recorded as reaching built status.",
    area: "Whitehall / Westminster",
    latitude: 51.5063788,
    longitude: -0.1263579,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hyatt Hotel at Great Scotland Yard",
    source_url: "https://nla.london/projects/hyatt-hotel-at-great-scotland-yard",
    source_record_id: "nla-hyatt-hotel-at-great-scotland-yard",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR",
    project_type: "hotel heritage-refurbishment completion",
    geometry_source: "Nominatim geocoder point for 3-5 Great Scotland Yard, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, hotel operations, conservation-condition discharge, occupancy, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_st_helens_square_completion_2018",
    date: "2018-02-01",
    bucket: "planning/development/architecture/public realm",
    title: "St Helen's Square was listed as built",
    summary:
      "New London Architecture records St Helen's Square at 1 Undershaft in the City of London as built, with completion in February 2018.",
    observed_change:
      "A documented City of London public-realm project was recorded as reaching built status.",
    area: "City of London",
    latitude: 51.5143043,
    longitude: -0.0816065,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: St Helen's Square",
    source_url: "https://nla.london/projects/st-helens-square",
    source_record_id: "nla-st-helens-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Gillespies is listed as landscape architect; the cited project-information block does not name a building architect.",
    project_type: "public-realm completion",
    geometry_source: "Nominatim geocoder point for 1 Undershaft, matching the location listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact public opening date, adoption or management arrangements, later access changes, or public-realm condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_xwhy_peoples_mission_hall_completion_2019",
    date: "2019-03-01",
    bucket: "planning/development/architecture/workplace adaptive reuse",
    title: "x+why at People's Mission Hall was listed as built",
    summary:
      "New London Architecture records x+why at People's Mission Hall on Whitechapel Road as built, with completion in March 2019.",
    observed_change:
      "A documented Tower Hamlets workplace and adaptive-reuse project was recorded as reaching built status.",
    area: "Whitechapel / Tower Hamlets",
    latitude: 51.5169023,
    longitude: -0.0674162,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: x+why People's Mission Hall",
    source_url: "https://nla.london/projects/xwhy-peoples-mission-hall",
    source_record_id: "nla-xwhy-peoples-mission-hall",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire and Partners is listed as interior designer on the cited page.",
    project_type: "workplace adaptive-reuse completion",
    geometry_source: "Nominatim geocoder point for People's Mission Hall at 20-30 Whitechapel Road, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact tenant opening date, later fit-out changes, occupancy, lease status, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_betances_residence_groundbreaking_2019",
    date: "2019-09-10",
    bucket: "planning/development/architecture/supportive senior housing",
    title: "Betances Residence groundbreaking was announced",
    summary:
      "NYC HPD announced on September 10, 2019 a groundbreaking for Betances Residence, a 152-unit affordable and supportive senior housing project in Mott Haven.",
    observed_change:
      "A documented city housing-agency announcement recorded a construction-start milestone for a supportive senior residence.",
    area: "Mott Haven / Bronx",
    latitude: 40.8089897,
    longitude: -73.9229147,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Betances Residence groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/087-19/city-state-elected-officials-joined-breaking-ground-project-partners-celebrate-the",
    source_record_id: "nyc-hpd-2019-09-10-betances-residence-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release names Breaking Ground and partners but does not name the project architect on the cited page",
    project_type: "supportive senior housing construction-start milestone",
    geometry_source: "Nominatim geocoder point for Mott Haven, the neighborhood named in the HPD release; the cited page did not expose a precise site address.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm construction progress after the announcement, final completion, lease-up, supportive-service delivery, affordability compliance, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_van_dyke_iii_opening_2021",
    date: "2021-11-11",
    bucket: "planning/development/architecture/affordable housing",
    title: "Van Dyke III opening was announced",
    summary:
      "NYC HDC announced on November 11, 2021 a ribbon-cutting milestone for Van Dyke III, a 12-story affordable housing project on NYCHA's Van Dyke campus in Brownsville.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of an affordable housing building on public-housing campus land.",
    area: "Brownsville / Brooklyn",
    latitude: 40.6644422,
    longitude: -73.9064628,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Van Dyke III completion ribbon cutting",
    source_url:
      "https://www.nychdc.com/newsroom/hpd-hdc-and-nycha-celebrate-completion-construction-van-dyke-iii-affordable-housing",
    source_record_id: "nychdc-2021-11-11-van-dyke-iii-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing opening",
    geometry_source: "Nominatim geocoder point for 354 Dumont Avenue, used as an approximate marker for the Van Dyke campus site described in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening and completion announcement only. It does not independently verify lease-up, affordability compliance, clinic operations, supportive-service delivery, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_woodlawn_senior_living_opening_2022",
    date: "2022-12-06",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Woodlawn Senior Living opening was announced",
    summary:
      "NYC HPD announced on December 6, 2022 a ribbon-cutting for Woodlawn Senior Living at 69 East 233rd Street in the Bronx.",
    observed_change:
      "A documented city housing-agency announcement recorded opening of a senior affordable housing development.",
    area: "Woodlawn / Bronx",
    latitude: 40.8952157,
    longitude: -73.879487,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Woodlawn Senior Living opening",
    source_url:
      "https://www.nyc.gov/site/hpd/news/059-22/city-officials-development-partners-celebrate-completion-woodlawn-senior-living",
    source_record_id: "nyc-hpd-2022-12-06-woodlawn-senior-living-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release does not name the project architect on the cited page",
    project_type: "senior affordable housing opening",
    geometry_source: "Nominatim geocoder point for 69 East 233rd Street, matching the address listed in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, affordability compliance, tenant-service delivery, long-term operations, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_tree_of_life_jamaica_completion_2022",
    date: "2022-12-09",
    bucket: "planning/development/architecture/mixed-income affordable housing",
    title: "Tree of Life affordable housing completion was announced",
    summary:
      "NYC HPD announced on December 9, 2022 completion of the Tree of Life mixed-use affordable housing development in Jamaica, Queens.",
    observed_change:
      "A documented city housing-agency announcement recorded completion of a mixed-use affordable housing development.",
    area: "Jamaica / Queens",
    latitude: 40.6987631,
    longitude: -73.8088251,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Tree of Life ribbon cutting",
    source_url:
      "https://www.nyc.gov/site/hpd/news/061-22/new-york-city-housing-preservation-development-new-york-city-housing-development-corporation",
    source_record_id: "nyc-hpd-2022-12-09-tree-of-life-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release does not name the project architect on the cited page",
    project_type: "mixed-use affordable housing completion",
    geometry_source: "Nominatim geocoder point for Jamaica, used as a neighborhood marker because the cited HPD release identifies the Special Downtown Jamaica District rather than a precise address.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, affordability compliance, ground-floor occupancy, long-term operations, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_atrium_at_sumner_completion_2024",
    date: "2024-05-23",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Atrium at Sumner completion was announced",
    summary:
      "NYC HDC announced on May 23, 2024 completion of Atrium at Sumner, an 11-story senior affordable housing project on NYCHA's Sumner Houses campus.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of a senior affordable housing building on public-housing campus land.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.6977255,
    longitude: -73.9408744,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Atrium at Sumner completion",
    source_url:
      "https://www.nychdc.com/newsroom/mayor-adams-and-project-partners-celebrate-completion-atrium-sumner-affordable-housing",
    source_record_id: "nychdc-2024-05-23-atrium-at-sumner-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "senior affordable housing completion",
    geometry_source: "Nominatim geocoder point for 57 Marcus Garvey Boulevard, used as an approximate marker for the Sumner Houses campus context described in the HDC release.",
    geometry_precision: "campus approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify lease-up, affordability compliance, supportive-service delivery, campus-wide changes, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_14_dublin_road_office_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/office planning approval",
    title: "14 Dublin Road office scheme was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record planning permission for a 14-storey office building with ground-floor retail or restaurant use at 14 Dublin Road.",
    observed_change:
      "A documented planning-committee minute recorded an office development approval milestone.",
    area: "Dublin Road / Belfast city centre",
    latitude: 54.5901409,
    longitude: -5.9337808,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2023-4366-14-dublin-road-office",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "office and ground-floor commercial planning approval",
    geometry_source: "Nominatim geocoder point for Dublin Road, used as an approximate marker for 14 Dublin Road because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm Section 76 completion, condition discharge, construction start, completion, leasing, occupation, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_14_dublin_road_pbmsa_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/student accommodation planning approval",
    title: "14 Dublin Road student accommodation was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record planning permission for a 17-storey purpose-built managed student accommodation scheme at 14 Dublin Road.",
    observed_change:
      "A documented planning-committee minute recorded a student accommodation development approval milestone.",
    area: "Dublin Road / Belfast city centre",
    latitude: 54.5901409,
    longitude: -5.9337808,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2023-4373-14-dublin-road-pbmsa",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "student accommodation planning approval",
    geometry_source: "Nominatim geocoder point for Dublin Road, used as an approximate marker for 14 Dublin Road because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm Section 76 completion, condition discharge, construction start, completion, student occupation, use outside term time, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_st_brides_primary_school_extension_permission_2024",
    date: "2024-05-14",
    bucket: "planning/development/architecture/school planning approval",
    title: "St Bride's Primary School extension was approved",
    summary:
      "Belfast City Council Planning Committee minutes for May 14, 2024 record approval of demolition, extension, a new eight-class school building, access, parking, play-area and landscaping works at St Bride's Primary School.",
    observed_change:
      "A documented planning-committee minute recorded a school-building and campus works approval milestone.",
    area: "Derryvolgie Avenue / South Belfast",
    latitude: 54.5801104,
    longitude: -5.9433564,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 14 May 2024",
    source_url: belfastPlanningMay2024,
    source_record_id: "bcc-planning-2024-05-14-la04-2023-3143-st-brides-primary-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "school extension and new classroom building approval",
    geometry_source: "Nominatim geocoder point for St Bride's Primary School, matching the school named in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a planning approval only. It does not confirm condition discharge, procurement, construction start, completion, pupil-capacity changes, or later school operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_michael_davitt_heritage_centre_permission_2024",
    date: "2024-05-14",
    bucket: "planning/development/architecture/community heritage centre approval",
    title: "Michael Davitt Heritage and Community Centre was approved",
    summary:
      "Belfast City Council Planning Committee minutes for May 14, 2024 record approval of the proposed Michael Davitt Heritage and Community Centre, with reception, toilets, car parking and exhibition signage near the former Corpus Christi College.",
    observed_change:
      "A documented planning-committee minute recorded a community heritage centre approval milestone.",
    area: "St Mary's Gardens / West Belfast",
    latitude: 54.5934328,
    longitude: -5.9699972,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 14 May 2024",
    source_url: belfastPlanningMay2024,
    source_record_id: "bcc-planning-2024-05-14-la04-2023-3483-michael-davitt-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "community heritage centre planning approval",
    geometry_source: "Nominatim geocoder point for Corpus Christi College on St Mary's Gardens, used as an approximate marker for the land north of the former college described in the minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a planning approval only. It does not confirm condition discharge, funding, construction start, completion, exhibition fit-out, programming, or later community use."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_nicssa_pavilion_redevelopment_permission_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/sports pavilion approval",
    title: "NICSSA pavilion redevelopment was considered for approval",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record consideration of a redevelopment of the NICSSA pavilion complex within the Stormont Estate, including demolition of the existing pavilion and a new two-storey sports building.",
    observed_change:
      "A documented planning-committee minute recorded a sports pavilion redevelopment planning milestone.",
    area: "Stormont Estate / East Belfast",
    latitude: 54.5967778,
    longitude: -5.8321902,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2023-2459-nicssa-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and agenda minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "sports pavilion redevelopment planning milestone",
    geometry_source: "Nominatim geocoder point for Maynard Sinclair Pavilion, matching the pavilion context named in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a planning-committee agenda and minute milestone. It does not by itself confirm decision notice issue, condition discharge, demolition, construction start, completion, event use, or later building condition."
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
