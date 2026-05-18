const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycTinPanAlleyRelease =
  "https://www.nyc.gov/site/lpc/about/pr2019/lpc-designates-five-historic-buildings-associated-with-tin-pan-alley.page";
const belfastContractsAwardedSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123925/Item%205%20a%20Physical%20Prog%20Appendix%203%20-%20Contracts%20Awarded%20to%20Sept25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_blackfriars_circus_completion_2018",
    date: "2018-11-01",
    bucket: "planning/development/architecture/residential",
    title: "Blackfriars Circus was listed as built",
    summary:
      "New London Architecture records Blackfriars Circus in Southwark as built, with estimated completion in November 2018.",
    observed_change:
      "A documented Blackfriars Road residential project was recorded as reaching built status.",
    area: "Blackfriars / Southwark",
    latitude: 51.503,
    longitude: -0.105,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Blackfriars Circus",
    source_url: "https://nla.london/projects/blackfriars-circus-1",
    source_record_id: "nla-blackfriars-circus-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Maccreanor Lavington",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 75 Blackfriars Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, public-realm delivery, building management, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_aldgate_place_phase_one_completion_2016",
    date: "2016-01-01",
    bucket: "planning/development/architecture/mixed use",
    title: "Aldgate Place Phase One was listed as built",
    summary:
      "New London Architecture records Aldgate Place Phase One in Tower Hamlets as built, with completion in 2016.",
    observed_change:
      "A documented Leman Street mixed-use project phase was recorded as reaching built status.",
    area: "Aldgate / Tower Hamlets",
    latitude: 51.515,
    longitude: -0.071,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Aldgate Place Phase One",
    source_url: "https://nla.london/projects/aldgate-place-phase-one",
    source_record_id: "nla-aldgate-place-phase-one",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "mixed-use development phase completion",
    geometry_source: "Approximate point placed at 7 Leman Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year for Phase One; later phases, occupation, tenure, commercial fit-out, and public-realm delivery require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_glasshouse_gardens_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Glasshouse Gardens was listed as built",
    summary:
      "New London Architecture records Glasshouse Gardens in Newham as built, with completion in 2017.",
    observed_change:
      "A documented Stratford residential project was recorded as reaching built status.",
    area: "Stratford / Newham",
    latitude: 51.541,
    longitude: -0.011,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Glasshouse Gardens",
    source_url: "https://nla.london/projects/glasshouse-gardens",
    source_record_id: "nla-glasshouse-gardens",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at Stratford Walk from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, estate management, public-realm arrangements, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ten_degrees_completion_2020",
    date: "2020-05-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Ten Degrees was listed as built",
    summary:
      "New London Architecture records Ten Degrees in Croydon as built, with completion in May 2020.",
    observed_change:
      "A documented East Croydon residential tower project was recorded as reaching built status.",
    area: "East Croydon / Croydon",
    latitude: 51.375,
    longitude: -0.092,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Ten Degrees",
    source_url: "https://nla.london/projects/ten-degrees",
    source_record_id: "nla-ten-degrees",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP",
    project_type: "residential tower completion",
    geometry_source: "Approximate point placed near East Croydon Station from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, rent levels, modular-construction performance, public-realm effects, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hylo_completion_2021",
    date: "2021-11-01",
    bucket: "planning/development/architecture/office",
    title: "HYLO was listed as built",
    summary:
      "New London Architecture records HYLO in Islington as built, with estimated completion in November 2021.",
    observed_change:
      "A documented Bunhill Row office project was recorded as reaching built status.",
    area: "Bunhill Row / Islington",
    latitude: 51.523,
    longitude: -0.09,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: HYLO",
    source_url: "https://nla.london/projects/hylo",
    source_record_id: "nla-hylo",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Horden Cherry Lee",
    project_type: "office project completion",
    geometry_source: "Approximate point placed at 33 Bunhill Row from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, workplace occupation, operational performance, access arrangements, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_47_west_28th_street_landmark_designated_2019",
    date: "2019-12-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "47 West 28th Street was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 47 West 28th Street as one of five Tin Pan Alley-associated individual landmarks on December 10, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 47 West 28th Street to individual landmark.",
    area: "Tin Pan Alley / Manhattan",
    latitude: 40.746,
    longitude: -73.99,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tin Pan Alley buildings",
    source_url: nycTinPanAlleyRelease,
    source_record_id: "nyc-lpc-2019-12-10-47-west-28th-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "19th-century row-house/commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 47 West 28th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_49_west_28th_street_landmark_designated_2019",
    date: "2019-12-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "49 West 28th Street was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 49 West 28th Street as one of five Tin Pan Alley-associated individual landmarks on December 10, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 49 West 28th Street to individual landmark.",
    area: "Tin Pan Alley / Manhattan",
    latitude: 40.746,
    longitude: -73.99,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tin Pan Alley buildings",
    source_url: nycTinPanAlleyRelease,
    source_record_id: "nyc-lpc-2019-12-10-49-west-28th-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "19th-century row-house/commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 49 West 28th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_51_west_28th_street_landmark_designated_2019",
    date: "2019-12-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "51 West 28th Street was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 51 West 28th Street as one of five Tin Pan Alley-associated individual landmarks on December 10, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 51 West 28th Street to individual landmark.",
    area: "Tin Pan Alley / Manhattan",
    latitude: 40.746,
    longitude: -73.99,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tin Pan Alley buildings",
    source_url: nycTinPanAlleyRelease,
    source_record_id: "nyc-lpc-2019-12-10-51-west-28th-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "19th-century row-house/commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 51 West 28th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_53_west_28th_street_landmark_designated_2019",
    date: "2019-12-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "53 West 28th Street was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 53 West 28th Street as one of five Tin Pan Alley-associated individual landmarks on December 10, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 53 West 28th Street to individual landmark.",
    area: "Tin Pan Alley / Manhattan",
    latitude: 40.746,
    longitude: -73.99,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tin Pan Alley buildings",
    source_url: nycTinPanAlleyRelease,
    source_record_id: "nyc-lpc-2019-12-10-53-west-28th-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "19th-century row-house/commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 53 West 28th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_55_west_28th_street_landmark_designated_2019",
    date: "2019-12-10",
    bucket: "planning/development/architecture/landmark designation",
    title: "55 West 28th Street was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 55 West 28th Street as one of five Tin Pan Alley-associated individual landmarks on December 10, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 55 West 28th Street to individual landmark.",
    area: "Tin Pan Alley / Manhattan",
    latitude: 40.746,
    longitude: -73.99,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tin Pan Alley buildings",
    source_url: nycTinPanAlleyRelease,
    source_record_id: "nyc-lpc-2019-12-10-55-west-28th-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "19th-century row-house/commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 55 West 28th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_high_level_lighting_minor_works_contract_awarded_2025",
    date: "2025-08-06",
    bucket: "planning/development/civic building maintenance procurement",
    title: "High-level lighting minor-works contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a measured-term contract for high-level lighting installations at council properties and locations, awarded to Braham Electrical on August 6, 2025.",
    observed_change:
      "A documented contracts appendix recorded a maintenance/minor-works contract award for high-level lighting installations at Belfast City Council properties and locations.",
    area: "Belfast City Council properties",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-06-high-level-lighting-minor-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Braham Electrical",
    project_type: "civic building lighting maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast city centre because the appendix names multiple council properties and locations but does not map them.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a measured-term contract award, not completed installations. It does not list every property, lighting scope, start date, completion date, cost, or asset-condition result."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_swimming_pools_filtration_ozone_minor_works_contract_awarded_2025",
    date: "2025-09-03",
    bucket: "planning/development/leisure facility maintenance procurement",
    title: "Swimming-pool filtration and ozone minor-works contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a measured-term contract for repair, maintenance, and minor works for swimming-pool filtration and ozone installations, awarded to WJM Building Services Ltd on September 3, 2025.",
    observed_change:
      "A documented contracts appendix recorded a leisure-facility plant maintenance/minor-works contract award for Belfast City Council properties and locations.",
    area: "Belfast leisure facilities",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-03-swimming-pools-filtration-ozone-minor-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "WJM Building Services Ltd",
    project_type: "leisure facility plant maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast city centre because the appendix names multiple council properties and locations but does not map them.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a measured-term contract award, not completed works. It does not list each pool, plant item, start date, completion date, maintenance result, or operational impact."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_north_foreshore_gas_ring_main_project_management_contract_awarded_2025",
    date: "2025-09-24",
    bucket: "planning/development/utilities procurement",
    title: "North Foreshore gas ring main project-management contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed L1BCC08 North Foreshore Gas Ring Main project-management services, awarded to Doran Consulting on September 24, 2025.",
    observed_change:
      "A documented contracts appendix recorded a project-management services award for North Foreshore gas ring main works.",
    area: "North Foreshore",
    latitude: 54.626,
    longitude: -5.912,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-24-north-foreshore-gas-ring-main-project-management",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Doran Consulting project-management services",
    project_type: "utilities project-management contract award",
    geometry_source: "Approximate point placed in the North Foreshore infrastructure context because the appendix does not map the gas ring main.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a project-management services award, not installation completion or commissioning. It does not provide final alignment, construction start date, completion date, capacity, or operational status."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_north_foreshore_fps_meica_fitout_project_management_contract_awarded_2025",
    date: "2025-09-24",
    bucket: "planning/development/utilities procurement",
    title: "North Foreshore FPS MEICA fit-out project-management contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed L1BCC09 North Foreshore FPS MEICA Fit Out project-management services, awarded to Doran Consulting on September 24, 2025.",
    observed_change:
      "A documented contracts appendix recorded a project-management services award for North Foreshore FPS MEICA fit-out works.",
    area: "North Foreshore",
    latitude: 54.626,
    longitude: -5.912,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-24-north-foreshore-fps-meica-fitout-project-management",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Doran Consulting project-management services",
    project_type: "utilities project-management contract award",
    geometry_source: "Approximate point placed in the North Foreshore infrastructure context because the appendix does not map the pumping-station fit-out scope.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a project-management services award, not installation completion or commissioning. It is a distinct procurement milestone from the works contract and does not provide final design, station locations, construction dates, or operational capacity."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_strangford_playing_fields_enabling_works_contract_awarded_2025",
    date: "2025-08-21",
    bucket: "planning/development/sports facility procurement",
    title: "Strangford Playing Fields enabling-works contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed Strangford Playing Fields enabling works, awarded to CivCo Ltd on August 21, 2025.",
    observed_change:
      "A documented contracts appendix recorded an enabling-works contract award for Strangford Playing Fields.",
    area: "Strangford Playing Fields",
    latitude: 54.572,
    longitude: -5.886,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-21-strangford-playing-fields-enabling-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "CivCo Ltd",
    project_type: "sports facility enabling-works contract award",
    geometry_source: "Approximate point placed at Strangford Playing Fields from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not works start or completion. It is a later procurement milestone than prior programme-stage records and does not confirm final scope, handover, facility opening, or operating arrangements."
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
