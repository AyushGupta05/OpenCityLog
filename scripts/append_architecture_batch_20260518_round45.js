const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycMelroseParksideRelease =
  "https://www.nyc.gov/site/lpc/about/pr2022/lpc-designates-the-melrose-parkside-historic-district-in-flatbush-brooklyn.page";
const nycGompersRelease =
  "https://www.nyc.gov/site/lpc/about/pr2022/lpc-designates-gompers-industrial-hs-as-individual-landmark.page";
const nycLesbianHerstoryArchivesRelease =
  "https://www.nyc.gov/site/lpc/about/pr2022/lpc-designates-lesbian-herstory-archives-as-landmark.page";
const nycCambriaHeightsRelease =
  "https://www.nyc.gov/site/lpc/about/pr2022/lpc-designates-two-historic-districts-in-cambria-heights-queens.page";
const belfastContractsAwardedSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123925/Item%205%20a%20Physical%20Prog%20Appendix%203%20-%20Contracts%20Awarded%20to%20Sept25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_landmark_pinnacle_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Landmark Pinnacle was listed as built",
    summary:
      "New London Architecture records Landmark Pinnacle in Tower Hamlets as built, with completion in 2022.",
    observed_change:
      "A documented Canary Wharf residential tower project was recorded as reaching built status.",
    area: "Canary Wharf / Tower Hamlets",
    latitude: 51.503,
    longitude: -0.025,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Landmark Pinnacle",
    source_url: "https://nla.london/projects/landmark-pinnacle",
    source_record_id: "nla-landmark-pinnacle",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire & Partners",
    project_type: "residential tower completion",
    geometry_source: "Approximate point placed at Landmark Pinnacle from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, sales, building management, and later public-realm arrangements require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_one_crown_place_completion_2021",
    date: "2021-01-01",
    bucket: "planning/development/architecture/mixed use",
    title: "One Crown Place was listed as built",
    summary:
      "New London Architecture records One Crown Place in Hackney as built, with completion in 2021.",
    observed_change:
      "A documented mixed-use project near Wilson Street was recorded as reaching built status.",
    area: "Shoreditch / Hackney",
    latitude: 51.521,
    longitude: -0.085,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: One Crown Place",
    source_url: "https://nla.london/projects/one-crown-place",
    source_record_id: "nla-one-crown-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Kohn Pedersen Fox Associates",
    project_type: "mixed-use development completion",
    geometry_source: "Approximate point placed at 54 Wilson Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; tenant mix, hotel or residential occupation, heritage scope, and later operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_damac_tower_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/residential tower",
    title: "DAMAC Tower was listed as built",
    summary:
      "New London Architecture records DAMAC Tower in Lambeth as built, with completion in 2022.",
    observed_change:
      "A documented Nine Elms residential tower project was recorded as reaching built status.",
    area: "Nine Elms / Lambeth",
    latitude: 51.484,
    longitude: -0.125,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: DAMAC Tower",
    source_url: "https://nla.london/projects/damac-tower",
    source_record_id: "nla-damac-tower",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Kohn Pedersen Fox Associates",
    project_type: "residential tower completion",
    geometry_source: "Approximate point placed near Bondway/Nine Elms from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; sales, occupation, transport effects, public access, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_one_nine_elms_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/mixed use towers",
    title: "One Nine Elms was listed as built",
    summary:
      "New London Architecture records One Nine Elms in Wandsworth as built, with completion in 2024.",
    observed_change:
      "A documented Nine Elms mixed-use tower project was recorded as reaching built status.",
    area: "Nine Elms / Wandsworth",
    latitude: 51.484,
    longitude: -0.127,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: One Nine Elms",
    source_url: "https://nla.london/projects/one-nine-elms",
    source_record_id: "nla-one-nine-elms",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Kohn Pedersen Fox Associates and LDA Design",
    project_type: "mixed-use tower completion",
    geometry_source: "Approximate point placed at One Nine Elms from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; hotel operation, residential occupation, public-realm completion, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_70_st_mary_axe_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/office",
    title: "70 St Mary Axe was listed as built",
    summary:
      "New London Architecture records 70 St Mary Axe in the City of London as built, with completion in 2019.",
    observed_change:
      "A documented City office project on St Mary Axe was recorded as reaching built status.",
    area: "City of London",
    latitude: 51.515,
    longitude: -0.079,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 70 St Mary Axe",
    source_url: "https://nla.london/projects/70-st-mary-axe",
    source_record_id: "nla-70-st-mary-axe",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Foggo Associates",
    project_type: "office completion",
    geometry_source: "Approximate point placed at 70 St Mary Axe from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; tenancy, operational performance, access arrangements, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_melrose_parkside_historic_district_designated_2022",
    date: "2022-12-13",
    bucket: "planning/development/architecture/historic district designation",
    title: "Melrose Parkside Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission records designation of the Melrose Parkside Historic District in Flatbush on December 13, 2022.",
    observed_change:
      "A documented LPC action changed the listed preservation status of a block of Parkside Avenue row houses to historic district.",
    area: "Flatbush / Brooklyn",
    latitude: 40.656,
    longitude: -73.959,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Melrose Parkside Historic District",
    source_url: nycMelroseParksideRelease,
    source_record_id: "nyc-lpc-2022-12-13-melrose-parkside-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC 2022 press-release archive date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Benjamin Driesler and Axel S. Hedman",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on Parkside Avenue between Flatbush and Bedford avenues from the LPC press-release description.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gompers_industrial_high_school_landmark_designated_2022",
    date: "2022-12-06",
    bucket: "planning/development/architecture/landmark designation",
    title: "Gompers Industrial High School was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission records designation of Samuel Gompers Industrial High School at 455 Southern Boulevard as an individual landmark on December 6, 2022.",
    observed_change:
      "A documented LPC action changed the listed preservation status of Samuel Gompers Industrial High School to individual landmark.",
    area: "Mott Haven / Bronx",
    latitude: 40.812,
    longitude: -73.903,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Gompers Industrial High School",
    source_url: nycGompersRelease,
    source_record_id: "nyc-lpc-2022-12-06-gompers-industrial-high-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC 2022 press-release archive date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Walter C. Martin",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 455 Southern Boulevard from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm school operations, renovation work, building-condition change, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_lesbian_herstory_archives_landmark_designated_2022",
    date: "2022-11-22",
    bucket: "planning/development/architecture/landmark designation",
    title: "Lesbian Herstory Archives was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission records designation of the Lesbian Herstory Archives at 484 14th Street as an individual landmark on November 22, 2022.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Lesbian Herstory Archives home to individual landmark.",
    area: "Park Slope / Brooklyn",
    latitude: 40.662,
    longitude: -73.98,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Lesbian Herstory Archives",
    source_url: nycLesbianHerstoryArchivesRelease,
    source_record_id: "nyc-lpc-2022-11-22-lesbian-herstory-archives",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC 2022 press-release archive date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Late-19th-century row house; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 484 14th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm archival operations, restoration work, building-condition change, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_cambria_heights_222nd_street_historic_district_designated_2022",
    date: "2022-06-28",
    bucket: "planning/development/architecture/historic district designation",
    title: "Cambria Heights-222nd Street Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission records designation of the Cambria Heights-222nd Street Historic District in Queens on June 28, 2022.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Cambria Heights-222nd Street row-house district.",
    area: "Cambria Heights / Queens",
    latitude: 40.696,
    longitude: -73.738,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Cambria Heights historic districts",
    source_url: nycCambriaHeightsRelease,
    source_record_id: "nyc-lpc-2022-06-28-cambria-heights-222nd-street-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cambria Homes, Inc. development; individual design details require the designation report",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on 222nd Street in Cambria Heights from the LPC press-release district name.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_cambria_heights_227th_street_historic_district_designated_2022",
    date: "2022-06-28",
    bucket: "planning/development/architecture/historic district designation",
    title: "Cambria Heights-227th Street Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission records designation of the Cambria Heights-227th Historic District in Queens on June 28, 2022.",
    observed_change:
      "A documented LPC action changed the listed preservation status of the Cambria Heights-227th Street row-house district.",
    area: "Cambria Heights / Queens",
    latitude: 40.694,
    longitude: -73.734,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Cambria Heights historic districts",
    source_url: nycCambriaHeightsRelease,
    source_record_id: "nyc-lpc-2022-06-28-cambria-heights-227th-street-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cambria Homes, Inc. development; individual design details require the designation report",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on 227th Street in Cambria Heights from the LPC press-release district name.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dargan_road_waste_transfer_traffic_works_contract_awarded_2025",
    date: "2025-08-15",
    bucket: "planning/development/civic infrastructure procurement",
    title: "Dargan Road Waste Transfer Station traffic-improvement works contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed Dargan Road Waste Transfer Station traffic improvement works, awarded to McQuillan Contracts on August 15, 2025.",
    observed_change:
      "A documented contracts appendix recorded a works contract award for traffic improvements at Dargan Road Waste Transfer Station.",
    area: "Dargan Road / North Foreshore",
    latitude: 54.624,
    longitude: -5.895,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-15-dargan-road-waste-transfer-traffic-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "McQuillan Contracts works contractor; design team not named in the appendix",
    project_type: "civic infrastructure works contract award",
    geometry_source: "Approximate point placed in the Dargan Road Waste Transfer Station context because the appendix does not map the works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not construction completion. It does not provide final design, start date, completion date, traffic-operation outcomes, or later asset condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bloomfield_community_hub_new_build_contract_awarded_2025",
    date: "2025-09-12",
    bucket: "planning/development/community facility procurement",
    title: "Bloomfield Community Association new-build hub design contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed L1BCC04 New Build Community Hub for Bloomfield Community Association, awarded to Collins Rolston Architects on September 12, 2025.",
    observed_change:
      "A documented contracts appendix recorded an architecture-related award for a new-build community hub for Bloomfield Community Association.",
    area: "Bloomfield",
    latitude: 54.593,
    longitude: -5.876,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-12-bloomfield-community-association-new-build-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Collins Rolston Architects",
    project_type: "community facility design/procurement milestone",
    geometry_source: "Approximate point placed in the Bloomfield project context because the appendix does not map the site.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not planning approval, construction, or completion. It does not provide final site boundary, design scope, funding status, start date, completion date, or operating model."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_reconnected_belfast_design_services_contract_awarded_2025",
    date: "2025-09-23",
    bucket: "planning/development/public realm procurement",
    title: "Reconnected Belfast design-services contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed PEACEPLUS Integrated Consultant Team for Design Services (Stages 3-7) for Reconnected Belfast, awarded to AECOM on September 23, 2025.",
    observed_change:
      "A documented contracts appendix recorded a design-services award for the Reconnected Belfast public-realm programme.",
    area: "Belfast city centre",
    latitude: 54.598,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-23-reconnected-belfast-design-services",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "AECOM integrated consultant team",
    project_type: "public-realm design-services contract award",
    geometry_source: "Approximate point placed in Belfast city centre because the appendix names the programme but does not map the design-services area.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a design-services contract award, not final design approval, works start, completion, or public-realm outcome. Programme geography and scope require separate project documents."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_titanic_people_sculpture_contract_awarded_2025",
    date: "2025-09-02",
    bucket: "planning/development/public art procurement",
    title: "Titanic People Sculpture contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed UV_Titanic People Sculpture, awarded to Hector Guest Sculptor on September 2, 2025.",
    observed_change:
      "A documented contracts appendix recorded a public-art/sculpture contract award for the Titanic People Sculpture.",
    area: "Titanic Quarter",
    latitude: 54.607,
    longitude: -5.909,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-02-titanic-people-sculpture",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Hector Guest Sculptor",
    project_type: "public-art contract award",
    geometry_source: "Approximate point placed in the Titanic Quarter context because the appendix does not provide the sculpture site.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not installation or completion. It does not provide final location, design drawings, installation date, maintenance plan, or public-access arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_north_foreshore_foul_pumping_meica_fitout_contract_awarded_2025",
    date: "2025-09-10",
    bucket: "planning/development/utilities procurement",
    title: "North Foreshore Foul Pumping Stations MEICA fitout contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed North Foreshore Foul Pumping Stations MEICA Fitout, awarded to Lagan MEICA Ltd on September 10, 2025.",
    observed_change:
      "A documented contracts appendix recorded a MEICA fitout contract award for North Foreshore foul pumping stations.",
    area: "North Foreshore",
    latitude: 54.626,
    longitude: -5.912,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-09-10-north-foreshore-foul-pumping-stations-meica-fitout",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Lagan MEICA Ltd fitout contractor; design team not named in the appendix",
    project_type: "utilities fitout contract award",
    geometry_source: "Approximate point placed in the North Foreshore infrastructure context because the appendix does not map the pumping stations.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a contract award, not installation completion or commissioning. It does not provide final design, station locations, start date, completion date, operational capacity, or later asset condition."
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
