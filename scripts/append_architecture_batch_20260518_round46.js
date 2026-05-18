const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycEastFlatbushRelease =
  "https://www.nyc.gov/site/lpc/about/pr2020/lpc-designates-its-first-historic-district-in-east-flatbush.page";
const nycAngelGuardianRelease =
  "https://www.nyc.gov/site/lpc/about/pr2020/lpc-designates-the-angel-guardian-home.page";
const nycPublicSchool48Release =
  "https://www.nyc.gov/site/lpc/about/pr2020/lpc-designates-public-school-48-in-south-jamaica-queens.page";
const nycManidaStreetRelease =
  "https://www.nyc.gov/site/lpc/about/pr2020/lpc-designates-manida-street-historic-district-in-hunts-point-bronx.page";
const nyc200MadisonRelease =
  "https://www.nyc.gov/site/lpc/about/pr2021/lpc-designates-the-lobby-of-200-madison-avenue-an-interior-landmark.page";
const belfastContractsAwardedSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123925/Item%205%20a%20Physical%20Prog%20Appendix%203%20-%20Contracts%20Awarded%20to%20Sept25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_highwood_west_grove_north_completion_2019",
    date: "2019-08-01",
    bucket: "planning/development/architecture/residential",
    title: "The Highwood, West Grove North was listed as built",
    summary:
      "New London Architecture records The Highwood, West Grove North in Southwark as built, with estimated completion in August 2019.",
    observed_change:
      "A documented Elephant Park residential project was recorded as reaching built status.",
    area: "Elephant Park / Southwark",
    latitude: 51.492,
    longitude: -0.097,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Highwood, West Grove North",
    source_url: "https://nla.london/projects/the-highwood-west-grove-north",
    source_record_id: "nla-the-highwood-west-grove-north",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 35 Heygate Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, later estate phasing, public-realm delivery, and management arrangements require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_victory_plaza_east_village_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/residential",
    title: "Victory Plaza, East Village was listed as built",
    summary:
      "New London Architecture records Victory Plaza, East Village in Newham as built, with completion in May 2019.",
    observed_change:
      "A documented East Village residential project was recorded as reaching built status.",
    area: "East Village / Newham",
    latitude: 51.548,
    longitude: -0.008,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Victory Plaza, East Village",
    source_url: "https://nla.london/projects/victory-plaza-east-village",
    source_record_id: "nla-victory-plaza-east-village",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lifschutz Davidson Sandilands",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 74 Celebration Avenue from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, tenure, estate management, public-realm delivery, and later operational changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_canada_gardens_completion_2020",
    date: "2020-09-01",
    bucket: "planning/development/architecture/residential",
    title: "Canada Gardens was listed as built",
    summary:
      "New London Architecture records Canada Gardens in Brent as built, with estimated completion in September 2020.",
    observed_change:
      "A documented Wembley Park residential project was recorded as reaching built status.",
    area: "Wembley Park / Brent",
    latitude: 51.557,
    longitude: -0.276,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Canada Gardens",
    source_url: "https://nla.london/projects/canada-gardens",
    source_record_id: "nla-canada-gardens",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "PRP Architects",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at Engineers Way/Wembley Park from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, landscape management, public access, and later estate operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_two_fifty_one_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Two Fifty One was listed as built",
    summary:
      "New London Architecture records Two Fifty One in Southwark as built, with completion in 2017.",
    observed_change:
      "A documented Newington Causeway residential tower project was recorded as reaching built status.",
    area: "Elephant and Castle / Southwark",
    latitude: 51.498,
    longitude: -0.098,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Two Fifty One",
    source_url: "https://nla.london/projects/two-fifty-one",
    source_record_id: "nla-two-fifty-one",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "residential tower completion",
    geometry_source: "Approximate point placed at 28 Newington Causeway from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, sales, access arrangements, and later building management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_goodluck_hope_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Goodluck Hope was listed as built",
    summary:
      "New London Architecture records Goodluck Hope on the Leamouth Peninsula in Tower Hamlets as built, with completion in 2020.",
    observed_change:
      "A documented Leamouth Peninsula residential project was recorded as reaching built status.",
    area: "Leamouth Peninsula / Tower Hamlets",
    latitude: 51.51,
    longitude: 0.006,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Goodluck Hope",
    source_url: "https://nla.london/projects/goodluck-hope",
    source_record_id: "nla-goodluck-hope",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at Goodluck Hope/Orchard Place from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, public access, riverside management, and later estate operations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_east_25th_street_historic_district_designated_2020",
    date: "2020-11-17",
    bucket: "planning/development/architecture/historic district designation",
    title: "East 25th Street Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the East 25th Street Historic District in East Flatbush on November 17, 2020.",
    observed_change:
      "A documented LPC action changed the listed preservation status of both sides of East 25th Street between Clarendon Road and Avenue D to historic district.",
    area: "East Flatbush / Brooklyn",
    latitude: 40.642,
    longitude: -73.953,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: East 25th Street Historic District",
    source_url: nycEastFlatbushRelease,
    source_record_id: "nyc-lpc-2020-11-17-east-25th-street-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Glucroft & Glucroft",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on East 25th Street between Clarendon Road and Avenue D from the LPC press-release description.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_angel_guardian_home_landmark_designated_2020",
    date: "2020-11-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "Angel Guardian Home was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Angel Guardian Home at 6301 12th Avenue in Dyker Heights as an individual landmark on November 10, 2020.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Angel Guardian Home to individual landmark.",
    area: "Dyker Heights / Brooklyn",
    latitude: 40.628,
    longitude: -74.002,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Angel Guardian Home",
    source_url: nycAngelGuardianRelease,
    source_record_id: "nyc-lpc-2020-11-10-angel-guardian-home",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "George H. Streeton",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 6301 12th Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm redevelopment work, building-condition change, owner actions, permits, social-service operations, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_public_school_48_landmark_designated_2020",
    date: "2020-09-22",
    bucket: "planning/development/architecture/landmark designation",
    title: "Public School 48 was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Public School 48 at 155-02 108th Avenue in South Jamaica, Queens as an individual landmark on September 22, 2020.",
    observed_change:
      "A documented LPC action changed the listed preservation status of Public School 48 to individual landmark.",
    area: "South Jamaica / Queens",
    latitude: 40.698,
    longitude: -73.789,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Public School 48",
    source_url: nycPublicSchool48Release,
    source_record_id: "nyc-lpc-2020-09-22-public-school-48",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Walter C. Martin",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 155-02 108th Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm school operations, renovation work, building-condition change, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_manida_street_historic_district_designated_2020",
    date: "2020-06-23",
    bucket: "planning/development/architecture/historic district designation",
    title: "Manida Street Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Manida Street Historic District in Hunts Point on June 23, 2020.",
    observed_change:
      "A documented LPC action changed the listed preservation status of Manida Street between Lafayette Avenue and Garrison Avenue to historic district.",
    area: "Hunts Point / Bronx",
    latitude: 40.812,
    longitude: -73.889,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Manida Street Historic District",
    source_url: nycManidaStreetRelease,
    source_record_id: "nyc-lpc-2020-06-23-manida-street-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "James F. Meehan and Daube & Kreymborg",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on Manida Street between Lafayette Avenue and Garrison Avenue from the LPC press-release description.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_200_madison_avenue_lobby_interior_landmark_designated_2021",
    date: "2021-11-09",
    bucket: "planning/development/architecture/interior landmark designation",
    title: "200 Madison Avenue first-floor lobby was designated an interior landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the 200 Madison Avenue First Floor Lobby as an interior landmark on November 9, 2021.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the 200 Madison Avenue first-floor lobby to interior landmark.",
    area: "Midtown South / Manhattan",
    latitude: 40.749,
    longitude: -73.983,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: 200 Madison Avenue lobby",
    source_url: nyc200MadisonRelease,
    source_record_id: "nyc-lpc-2021-11-09-200-madison-avenue-lobby",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Warren & Wetmore",
    project_type: "interior landmark designation",
    geometry_source: "Approximate point placed at 200 Madison Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records interior landmark designation only. It does not confirm restoration work, tenant changes, public access, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cemeteries_stonemasonry_repairs_contract_awarded_2025",
    date: "2025-07-08",
    bucket: "planning/development/heritage maintenance procurement",
    title: "Cemeteries and graveyards stonemasonry repairs contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a service contract for stonemasons to carry out urgent and non-urgent health-and-safety repairs to stoneworks and monuments in cemeteries and graveyards, awarded to The Rock Stone Masonry on July 8, 2025.",
    observed_change:
      "A documented contracts appendix recorded a heritage-maintenance contract award for stoneworks and monuments in Belfast cemeteries and graveyards.",
    area: "Belfast cemeteries and graveyards",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-07-08-cemeteries-graveyards-stonemasonry-repairs",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "The Rock Stone Masonry",
    project_type: "heritage maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast city centre because the appendix names multiple cemeteries and graveyards but does not list individual sites.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a service-contract award, not completed repairs. It does not identify every monument, cemetery, repair scope, work dates, conservation method, or final condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_building_repairs_maintenance_contract_awarded_2025",
    date: "2025-08-06",
    bucket: "planning/development/building maintenance procurement",
    title: "Council properties building repairs and maintenance contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a measured-term contract for building repairs, maintenance, and minor works at various council properties, awarded to WJM Building Services on August 6, 2025.",
    observed_change:
      "A documented contracts appendix recorded a building-repairs and maintenance contract award for various Belfast City Council properties.",
    area: "Belfast City Council properties",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-06-council-properties-building-repairs-maintenance",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "WJM Building Services",
    project_type: "building maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast city centre because the appendix names various council properties but does not map them.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a maintenance contract award, not a specific building alteration or completion. It does not list every property, work package, start date, completion date, cost, or asset-condition result."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_zoo_fencing_enclosures_building_works_contract_awarded_2025",
    date: "2025-08-29",
    bucket: "planning/development/civic facility maintenance procurement",
    title: "Belfast Zoo fencing, enclosures, and building works contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a measured-term contract for Belfast Zoo fencing, enclosures, and building works, awarded to WJM Building Services on August 29, 2025.",
    observed_change:
      "A documented contracts appendix recorded a works contract award for fencing, enclosures, and building works at Belfast Zoo.",
    area: "Belfast Zoo",
    latitude: 54.657,
    longitude: -5.942,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-29-belfast-zoo-fencing-enclosures-building-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "WJM Building Services",
    project_type: "civic facility works contract award",
    geometry_source: "Approximate point placed at Belfast Zoo from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a measured-term contract award, not completed works. It does not identify each enclosure, design scope, start date, completion date, animal-management changes, or final asset condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_automatic_doors_contract_awarded_2025",
    date: "2025-09-01",
    bucket: "planning/development/civic building maintenance procurement",
    title: "Belfast City Hall automatic-doors repair and replacement contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed contractor for automatic doors repairs and replacements at Belfast City Hall, awarded to MB Architectural T/A Doorways on September 1, 2025.",
    observed_change:
      "A documented contracts appendix recorded a civic-building access/maintenance contract award at Belfast City Hall.",
    area: "Belfast City Hall",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-01-belfast-city-hall-automatic-doors",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "MB Architectural T/A Doorways",
    project_type: "civic building maintenance contract award",
    geometry_source: "Approximate point placed at Belfast City Hall from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not repair or replacement completion. It does not provide door locations, detailed accessibility scope, start date, completion date, cost, or later operational performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dargan_road_temporary_office_accommodation_contract_awarded_2025",
    date: "2025-09-10",
    bucket: "planning/development/civic infrastructure procurement",
    title: "Dargan Road Waste Transfer Station temporary-office accommodation contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed hire of temporary office accommodation for Dargan Road Waste Transfer Station, awarded to P McVey Building Systems Ltd on September 10, 2025.",
    observed_change:
      "A documented contracts appendix recorded a temporary accommodation contract award for Dargan Road Waste Transfer Station.",
    area: "Dargan Road / North Foreshore",
    latitude: 54.624,
    longitude: -5.895,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-10-dargan-road-temporary-office-accommodation",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "P McVey Building Systems Ltd",
    project_type: "temporary accommodation contract award",
    geometry_source: "Approximate point placed in the Dargan Road Waste Transfer Station context because the appendix does not map the accommodation location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a temporary-accommodation contract award, not installation or completion. It does not provide final layout, duration, planning status, start date, completion date, or operational effect."
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
