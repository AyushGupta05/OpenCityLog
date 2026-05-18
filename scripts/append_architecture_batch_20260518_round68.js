const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningApr2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11670";
const belfastPlanningJun2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11674";
const belfastPlanningJunSpecial2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11809";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_battersea_exchange_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/mixed-use housing",
    title: "Battersea Exchange was listed as built",
    summary:
      "New London Architecture records Battersea Exchange in Wandsworth as built, with completion in March 2020.",
    observed_change:
      "A documented Wandsworth mixed-use development was recorded as reaching built status.",
    area: "Battersea / Wandsworth",
    latitude: 51.4746712,
    longitude: -0.1548113,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Battersea Exchange",
    source_url: "https://nla.london/projects/battersea-exchange",
    source_record_id: "nla-battersea-exchange",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "NLA page lists Feilden Clegg Bradley Studios as the listing organization; the project-information block does not expose a separate architect field in the cited text.",
    project_type: "mixed-use development completion",
    geometry_source: "Nominatim geocoder point for 118 Battersea Park Road, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, all phase completions, residential occupation, retail leasing, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_forbury_blackheath_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/mixed-use housing",
    title: "Forbury in Blackheath was listed as built",
    summary:
      "New London Architecture records Forbury on Lee Terrace in Blackheath as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Lewisham mixed-use housing and retail project was recorded as reaching built status.",
    area: "Blackheath / Lewisham",
    latitude: 51.4631187,
    longitude: 0.0006471,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Forbury",
    source_url: "https://nla.london/projects/forbury",
    source_record_id: "nla-forbury",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "mixed-use housing and retail completion",
    geometry_source: "Nominatim geocoder point for Lee Terrace, matching the location listed on the NLA project page.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, occupation, retail opening, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_160_old_street_completion_2018",
    date: "2018-04-01",
    bucket: "planning/development/architecture/office mixed-use",
    title: "160 Old Street was listed as built",
    summary:
      "New London Architecture records 160 Old Street in Islington as built, with completion in April 2018.",
    observed_change:
      "A documented Islington office, retail, and restaurant project was recorded as reaching built status.",
    area: "Old Street / Islington",
    latitude: 51.5248249,
    longitude: -0.0910018,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 160 Old Street",
    source_url: "https://nla.london/projects/160-old-street",
    source_record_id: "nla-160-old-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Orms",
    project_type: "office mixed-use completion",
    geometry_source: "Nominatim geocoder point for 160 Old Street, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, tenancy, restaurant opening, later refurbishment, or operational performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_200_becontree_avenue_completion_2022",
    date: "2022-04-01",
    bucket: "planning/development/architecture/residential infill",
    title: "200 Becontree Avenue was listed as built",
    summary:
      "New London Architecture records 200 Becontree Avenue in Barking and Dagenham as built, with completion in April 2022.",
    observed_change:
      "A documented Barking and Dagenham residential infill project was recorded as reaching built status.",
    area: "Becontree / Barking and Dagenham",
    latitude: 51.5567529,
    longitude: 0.1207967,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 200 Becontree Avenue",
    source_url: "https://nla.london/projects/200-becontree-avenue",
    source_record_id: "nla-200-becontree-avenue",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Archio",
    project_type: "residential infill completion",
    geometry_source: "Nominatim geocoder point for Becontree Avenue, used as an approximate marker for 200 Becontree Avenue because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, allocation, occupation, maintenance arrangements, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_twickenham_station_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/transport station",
    title: "Twickenham Station was listed as built",
    summary:
      "New London Architecture records the Twickenham Station entrance and public-realm project as built, with completion in February 2020.",
    observed_change:
      "A documented Richmond upon Thames transport-station and public-realm project was recorded as reaching built status.",
    area: "Twickenham / Richmond upon Thames",
    latitude: 51.4501953,
    longitude: -0.3308884,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Twickenham Station",
    source_url: "https://nla.london/projects/twickenham-station",
    source_record_id: "nla-twickenham-station",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Landolt + Brown",
    project_type: "station entrance and public-realm completion",
    geometry_source: "Nominatim geocoder point for Twickenham Station, matching the location listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact public opening date, rail-service changes, operational performance, station access changes after completion, or later condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jerome_court_completion_2023",
    date: "2023-05-24",
    bucket: "planning/development/architecture/supportive affordable housing",
    title: "Jerome Court completion was announced",
    summary:
      "NYC HDC announced on May 24, 2023 completion of Jerome Court, a supportive and affordable housing complex at 1769 Jerome Avenue in the Bronx.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of a supportive and affordable housing complex.",
    area: "Tremont / Bronx",
    latitude: 40.8484851,
    longitude: -73.9120169,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Jerome Court completion",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-sus-and-bronx-pro-group-celebrate-completion-new-supportive-affordable",
    source_record_id: "nychdc-2023-05-24-jerome-court-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "supportive affordable-housing completion",
    geometry_source: "Nominatim geocoder point for 1769 Jerome Avenue, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion and housewarming announcement only. It does not independently verify full lease-up, supportive-service delivery, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_nevins_street_apartments_completion_2022",
    date: "2022-05-09",
    bucket: "planning/development/architecture/supportive affordable housing",
    title: "Nevins Street Apartments completion was announced",
    summary:
      "NYC HPD announced on May 9, 2022 completion of Nevins Street Apartments, a mixed-use supportive and affordable housing development in Downtown Brooklyn.",
    observed_change:
      "A documented city housing-agency announcement recorded completion of a supportive affordable-housing development and adjacent new construction.",
    area: "Downtown Brooklyn / Brooklyn",
    latitude: 40.6870646,
    longitude: -73.9821124,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Nevins Street Apartments completion",
    source_url:
      "https://www.nyc.gov/site/hpd/news/019-22/governor-hochul-mayor-adams-completion-72-million-mixed-use-supportive-affordable",
    source_record_id: "nyc-hpd-2022-05-09-nevins-street-apartments-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release quotes Mega Contracting Group identifying Dattner among project partners; the cited page does not expose a formal architect field.",
    project_type: "supportive affordable-housing completion",
    geometry_source: "Nominatim geocoder point for 50 Nevins Street, matching the address context named in the HPD release text.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, retail occupancy, supportive-service delivery, affordability compliance, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_the_corden_completion_2021",
    date: "2021-11-19",
    bucket: "planning/development/architecture/supportive housing",
    title: "The Corden completion was announced",
    summary:
      "NYC HPD announced on November 19, 2021 completion of The Corden, a 62-unit supportive housing development in the Longwood neighborhood of the Bronx.",
    observed_change:
      "A documented city housing-agency announcement recorded completion of a supportive housing development.",
    area: "Longwood / Bronx",
    latitude: 40.8162916,
    longitude: -73.8962205,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: This Week in Housing, 19 November 2021",
    source_url:
      "https://www.nyc.gov/site/hpd/news/065-21/this-week-housing-hpd-celebrates-more-900-affordable-homes-bronx-brooklyn",
    source_record_id: "nyc-hpd-2021-11-19-the-corden-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release names New Destiny Housing as developer and service provider but does not name the project architect on the cited page",
    project_type: "supportive housing completion",
    geometry_source: "Nominatim geocoder point for Longwood, the neighborhood named in the HPD release; the cited page did not expose a precise address.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full occupancy, resident services, affordability compliance, exact parcel geometry, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_rheingold_senior_residences_groundbreaking_2021",
    date: "2021-11-19",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Rheingold Senior Residences construction start was announced",
    summary:
      "NYC HPD announced on November 19, 2021 the start of construction for Rheingold Senior Residences in Brooklyn's Broadway Triangle neighborhood.",
    observed_change:
      "A documented city housing-agency announcement recorded a construction-start milestone for a senior affordable-housing development.",
    area: "Broadway Triangle / Brooklyn",
    latitude: 40.701474,
    longitude: -73.9364223,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: This Week in Housing, 19 November 2021",
    source_url:
      "https://www.nyc.gov/site/hpd/news/065-21/this-week-housing-hpd-celebrates-more-900-affordable-homes-bronx-brooklyn",
    source_record_id: "nyc-hpd-2021-11-19-rheingold-senior-residences-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release names Southside United HDFC and Churches United for Fair Housing as project partners but does not name the architect on the cited page",
    project_type: "senior affordable-housing construction-start milestone",
    geometry_source: "Nominatim geocoder point for 15 Montieth Street, used as an approximate Broadway Triangle / old Rheingold Brewery site marker for the project named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a construction-start announcement only. It does not confirm later construction progress, completion, lease-up, Passive House certification, affordability compliance, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_river_crest_phase2_groundbreaking_2021",
    date: "2021-11-19",
    bucket: "planning/development/architecture/affordable housing",
    title: "River Crest phase two construction start was announced",
    summary:
      "NYC HPD announced on November 19, 2021 that phase two of River Crest had broken ground in the Jerome Avenue rezoning area.",
    observed_change:
      "A documented city housing-agency announcement recorded a construction-start milestone for an affordable-housing phase.",
    area: "Jerome Avenue / Bronx",
    latitude: 40.8353005,
    longitude: -73.9214186,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: This Week in Housing, 19 November 2021",
    source_url:
      "https://www.nyc.gov/site/hpd/news/065-21/this-week-housing-hpd-celebrates-more-900-affordable-homes-bronx-brooklyn",
    source_record_id: "nyc-hpd-2021-11-19-river-crest-phase-two-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release names Maddd Equities as developer but does not name the architect on the cited page",
    project_type: "affordable-housing construction-start milestone",
    geometry_source: "Nominatim geocoder point for 1184 River Avenue, used as an approximate Jerome Avenue area marker for the River Crest project named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a construction-start announcement only. It does not confirm later construction progress, completion, lease-up, community facility occupancy, affordability compliance, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_47_ravenhill_road_gym_change_use_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/change of use approval",
    title: "47 Ravenhill Road gym change of use was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record planning permission for a retrospective ground-floor change of use to gymnasium at 47 Ravenhill Road.",
    observed_change:
      "A documented planning-committee minute recorded a ground-floor change-of-use approval milestone.",
    area: "Ravenhill Road / East Belfast",
    latitude: 54.5932212,
    longitude: -5.9115274,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2022-0930-47-ravenhill-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name designers for this change-of-use item",
    project_type: "gym change-of-use planning approval",
    geometry_source: "Nominatim geocoder point for 45-47 Ravenhill Road, matching the address context listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a retrospective planning approval only. It does not confirm building-control approval, fit-out details, licensing, operational hours, occupancy, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_46_montgomery_road_condition_variation_permission_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/condition variation approval",
    title: "46 Montgomery Road mixed-use condition variation was approved",
    summary:
      "Belfast City Council Planning Committee minutes for April 16, 2024 record planning permission for a variation of Condition 3 relating to a verification report for Phase 4 of an approved mixed-use regeneration scheme at and around 46 Montgomery Road.",
    observed_change:
      "A documented planning-committee minute recorded a condition-variation approval for an approved mixed-use regeneration scheme.",
    area: "Montgomery Road / East Belfast",
    latitude: 54.5773481,
    longitude: -5.8877864,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 16 April 2024",
    source_url: belfastPlanningApr2024,
    source_record_id: "bcc-planning-2024-04-16-la04-2023-4397-46-montgomery-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the design team in the cited agenda text",
    project_type: "mixed-use regeneration condition-variation approval",
    geometry_source: "Nominatim geocoder point for Montgomery Road, used as an approximate marker for the 44-46 Montgomery Road site context.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a condition-variation planning approval only. It does not confirm remediation completion, phase operation, construction progress, occupation, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_shankill_lanark_caledon_housing_permission_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/residential planning approval",
    title: "Shankill Road, Lanark Way and Caledon Street housing was approved",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record approval of a residential scheme of 53 dwellings on lands at the junction of Shankill Road and Lanark Way, bound by Caledon Street.",
    observed_change:
      "A documented planning-committee minute recorded a residential development approval milestone.",
    area: "Shankill Road / West Belfast",
    latitude: 54.6044593,
    longitude: -5.9604599,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2022-0612-shankill-lanark-caledon",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "residential development planning approval",
    geometry_source: "Nominatim geocoder point for Caledon Street, used as an approximate marker for the lands bound by Shankill Road, Lanark Way, and Caledon Street.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm Section 76 completion, condition discharge, construction start, completion, allocation, occupation, or later residential condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_qub_experimental_physics_listing_confirmed_2024",
    date: "2024-06-27",
    bucket: "planning/development/architecture/listed building confirmation",
    title: "QUB International Research Centre listing was confirmed",
    summary:
      "Belfast City Council Planning Committee minutes for June 27, 2024 record confirmation of listed-building status for the International Research Centre for Experimental Physics, including railings and retaining walls, at Queen's University Belfast.",
    observed_change:
      "A documented planning-committee minute recorded a heritage listing confirmation milestone for a university building.",
    area: "Queen's University / South Belfast",
    latitude: 54.5842881,
    longitude: -5.9336562,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 27 June 2024",
    source_url: belfastPlanningJunSpecial2024,
    source_record_id: "bcc-planning-2024-06-27-hb26-27-077-qub-experimental-physics-listing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and listed-building confirmation minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the original architect in the cited agenda text",
    project_type: "listed-building confirmation",
    geometry_source: "Nominatim geocoder point for Queen's University Belfast on University Road, used as an approximate marker for the named research-centre building.",
    geometry_precision: "campus approximate",
    limitations:
      "The event records a listed-building confirmation only. It does not confirm any physical works, conservation repair, change of use, access arrangements, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_89a_upper_springfield_replacement_dwelling_refused_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/planning refusal",
    title: "89a Upper Springfield Road replacement dwelling was refused",
    summary:
      "Belfast City Council Planning Committee minutes for June 18, 2024 record refusal of outline planning permission for a proposed replacement dwelling and associated site works at 89a Upper Springfield Road.",
    observed_change:
      "A documented planning-committee minute recorded a refusal milestone for a proposed replacement dwelling.",
    area: "Upper Springfield Road / West Belfast",
    latitude: 54.5915096,
    longitude: -6.0389515,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 June 2024",
    source_url: belfastPlanningJun2024,
    source_record_id: "bcc-planning-2024-06-18-la04-2023-3936-89a-upper-springfield-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "replacement dwelling refusal",
    geometry_source: "Nominatim geocoder point for Upper Springfield Road, used as an approximate marker because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning refusal only. It does not confirm appeal status, later revised applications, physical works, demolition, construction, occupation, or site condition."
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
