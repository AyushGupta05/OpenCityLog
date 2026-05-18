const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastContractsAwardedMar2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s121134/Appendix%203%20-%20Contracts%20Awarded%20to%20Mar25.pdf";
const belfastContractsAwardedSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123925/Item%205%20a%20Physical%20Prog%20Appendix%203%20-%20Contracts%20Awarded%20to%20Sept25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_makers_building_nile_street_completion_2020",
    date: "2020-02-01",
    bucket: "planning/development/architecture/residential",
    title: "The Makers Building, Nile Street was listed as built",
    summary:
      "New London Architecture records The Makers Building, Nile Street in Hackney as built, with completion in February 2020.",
    observed_change:
      "A documented Nile Street residential project was recorded as reaching built status.",
    area: "Hoxton / Hackney",
    latitude: 51.5292415,
    longitude: -0.0906355,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Makers Building, Nile Street",
    source_url: "https://nla.london/projects/the-makers-building-nile-street",
    source_record_id: "nla-the-makers-building-nile-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Avanti Architects",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed on Nile Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, tenure, sales, management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_illuminated_river_completion_2021",
    date: "2021-03-01",
    bucket: "planning/development/architecture/public realm",
    title: "Illuminated River was listed as built",
    summary:
      "New London Architecture records Illuminated River as built, with completion in March 2021 and London Bridge listed as the project location.",
    observed_change:
      "A documented Thames bridge-lighting and public-realm project was recorded as reaching built status.",
    area: "London Bridge / Thames",
    latitude: 51.508049,
    longitude: -0.0876715,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Illuminated River",
    source_url: "https://nla.london/projects/illuminated-river",
    source_record_id: "nla-illuminated-river",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lifschutz Davidson Sandilands",
    project_type: "bridge-lighting and public-realm completion",
    geometry_source: "Representative point placed at London Bridge from the named NLA project location; the project is multi-bridge rather than a single surveyed feature.",
    geometry_precision: "representative point",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact bridge-by-bridge commissioning dates, lighting operations, maintenance, public access, and later changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_21_soho_square_completion_2018",
    date: "2018-12-01",
    bucket: "planning/development/architecture/commercial",
    title: "21 Soho Square was listed as built",
    summary:
      "New London Architecture records 21 Soho Square in Westminster as built, with estimated completion in December 2018.",
    observed_change:
      "A documented Soho office and refurbishment project was recorded as reaching built status.",
    area: "Soho / Westminster",
    latitude: 51.5151384,
    longitude: -0.1327612,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 21 Soho Square",
    source_url: "https://nla.london/projects/21-soho-square",
    source_record_id: "nla-21-soho-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman listed the project; NLA page does not name a separate architect credit in the parsed project information",
    project_type: "office refurbishment completion",
    geometry_source: "Approximate point placed at Carlisle Street/Soho Square from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; leasing, occupation, detailed scope, fit-out, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_central_cross_completion_2017",
    date: "2017-06-01",
    bucket: "planning/development/architecture/mixed use",
    title: "Central Cross was listed as built",
    summary:
      "New London Architecture records Central Cross in Westminster as built, with estimated completion in June 2017.",
    observed_change:
      "A documented Newport Court mixed-use and public-realm project was recorded as reaching built status.",
    area: "Chinatown / Westminster",
    latitude: 51.5118,
    longitude: -0.1306,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Central Cross",
    source_url: "https://nla.london/projects/central-cross",
    source_record_id: "nla-central-cross",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman",
    project_type: "mixed-use and public-realm completion",
    geometry_source: "Approximate point placed at Newport Court/Chinatown from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, public-access arrangements, management, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_belle_vue_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/residential",
    title: "Belle Vue was listed as built",
    summary:
      "New London Architecture records Belle Vue in Camden as built, with completion in May 2019.",
    observed_change:
      "A documented Rowland Hill Street residential project was recorded as reaching built status.",
    area: "Hampstead / Camden",
    latitude: 51.551,
    longitude: -0.169,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Belle Vue",
    source_url: "https://nla.london/projects/belle-vue",
    source_record_id: "nla-belle-vue",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Morris+Company",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed on Rowland Hill Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, sales, tenure, management, and later building operations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_throop_corners_groundbreaking_2022",
    date: "2022-09-14",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Throop Corners broke ground",
    summary:
      "NYC Housing Preservation and Development announced that the first phase of the 100-percent-affordable Broadway Triangle housing development, Throop Corners, broke ground in Brooklyn on September 14, 2022.",
    observed_change:
      "A documented HPD/HDC announcement recorded the start of construction for Throop Corners at the Broadway Triangle sites.",
    area: "Broadway Triangle / Brooklyn",
    latitude: 40.7023237,
    longitude: -73.946534,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Throop Corners groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/039-22/first-phase-100-affordable-broadway-triangle-housing-development-breaks-ground-brooklyn",
    source_record_id: "nyc-hpd-2022-09-14-throop-corners-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD/HDC and Unified Neighborhood Partners project; design team not named in the cited press-release header",
    project_type: "affordable housing groundbreaking",
    geometry_source: "Approximate point placed at 88 Throop Avenue from the HPD press release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking/start-of-construction milestone only. It does not confirm completion, certificate of occupancy, leasing, affordability compliance, resident move-in, later phases, or operational outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_etihad_park_groundbreaking_2024",
    date: "2024-12-04",
    bucket: "planning/development/architecture/sports venue groundbreaking",
    title: "Etihad Park broke ground at Willets Point",
    summary:
      "The NYC Mayor's Office announced that city officials and New York City Football Club broke ground on Etihad Park, a new soccer stadium at Willets Point, on December 4, 2024.",
    observed_change:
      "A documented mayoral announcement recorded the groundbreaking for a new stadium project at Willets Point.",
    area: "Willets Point / Queens",
    latitude: 40.756,
    longitude: -73.844,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Etihad Park groundbreaking",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2024/12/mayor-adams-councilmember-moya-new-york-city-football-club-break-ground-new-soccer-stadium",
    source_record_id: "nyc-mayor-2024-12-04-etihad-park-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "New York City Football Club stadium project; detailed design team requires separate project records",
    project_type: "sports venue groundbreaking",
    geometry_source: "Approximate point placed at the Willets Point stadium site near Citi Field from the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm stadium completion, opening, final design, construction progress, financing close, surrounding housing delivery, public-realm delivery, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_innovative_urban_village_phase1a_groundbreaking_2025",
    date: "2025-07-15",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Innovative Urban Village Phase 1A broke ground",
    summary:
      "The NYC Mayor's Office announced the groundbreaking of Phase 1A of the Innovative Urban Village project on the Christian Cultural Center campus in East New York on July 15, 2025.",
    observed_change:
      "A documented mayoral announcement recorded the start of construction for the first phase of the Innovative Urban Village redevelopment.",
    area: "East New York / Brooklyn",
    latitude: 40.6513743,
    longitude: -73.8892862,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Innovative Urban Village Phase 1A groundbreaking",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/525-25/most-pro-housing-administration-city-history-mayor-adams-breaks-ground-385-affordable-and",
    source_record_id: "nyc-mayor-2025-07-15-innovative-urban-village-phase-1a-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Christian Cultural Center campus redevelopment; detailed design team requires separate project records",
    project_type: "affordable and supportive housing groundbreaking",
    geometry_source: "Approximate point placed at 12020 Flatlands Avenue for the Christian Cultural Center campus referenced by the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm completion, occupancy, unit delivery, service opening, later phases, financing changes, or long-term operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_324_east_5th_street_affordable_housing_rfp_2025",
    date: "2025-05-29",
    bucket: "planning/development/architecture/housing procurement",
    title: "324 East 5th Street affordable-housing RFP was released",
    summary:
      "NYC Housing Preservation and Development announced on May 29, 2025 that it released a Request for Proposals for affordable housing on an NYPD parking lot at 324 East 5th Street in the East Village.",
    observed_change:
      "A documented HPD action moved a public site into an affordable-housing procurement process.",
    area: "East Village / Manhattan",
    latitude: 40.7262979,
    longitude: -73.9878006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 324 East 5th Street affordable-housing RFP",
    source_url: "https://www.nyc.gov/site/hpd/news/034-25/nypd-parking-lot-east-village-set-become-affordable-new-homes-new-yorkers",
    source_record_id: "nyc-hpd-2025-05-29-324-east-5th-street-rfp",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD procurement stage; developer and design team not selected in the cited release",
    project_type: "affordable housing procurement milestone",
    geometry_source: "Approximate point placed at 324 East 5th Street from the HPD press release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records RFP release only. It does not confirm developer selection, land disposition, design approval, construction start, completion, unit count, affordability mix, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_5_times_square_conversion_gpp_amendment_2025",
    date: "2025-05-22",
    bucket: "planning/development/architecture/adaptive reuse approval",
    title: "5 Times Square conversion plan amendment was approved",
    summary:
      "The NYC Mayor's Office announced on May 22, 2025 that Empire State Development's board approved a 42nd Street Development General Project Plan amendment related to the proposed office-to-housing conversion of 5 Times Square.",
    observed_change:
      "A documented state/city planning action changed the approval context for a proposed office-to-housing conversion at 5 Times Square.",
    area: "Times Square / Manhattan",
    latitude: 40.7558414,
    longitude: -73.9875649,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: 5 Times Square office-to-housing transformation",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/344-25/mayor-adams-governor-hochul-office-to-housing-transformation-5-times-square-create",
    source_record_id: "nyc-mayor-2025-05-22-5-times-square-gpp-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Empire State Development and project sponsors; conversion design team requires separate project records",
    project_type: "office-to-housing planning approval milestone",
    geometry_source: "Approximate point placed at 5 Times Square from the mayoral announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a General Project Plan amendment announcement only. It does not confirm construction start, completion, final unit count, affordability compliance, building permits, occupancy, or later operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_high_level_lighting_contract_awarded_2025",
    date: "2025-08-06",
    bucket: "planning/development/civic asset contract award",
    title: "Council-properties high-level lighting contract was awarded",
    summary:
      "Belfast City Council's July-September 2025 contracts-awarded appendix listed a measured-term contract for repair, maintenance, and minor works for high-level lighting installations at council properties and locations, awarded to Braham Electrical on August 6, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related high-level lighting maintenance contract across council properties and locations.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q3-high-level-lighting",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Braham Electrical was listed as supplier; individual design teams and sites are not named in the appendix",
    project_type: "civic lighting maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes multiple council properties and locations.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each site, lighting specification, works orders, completion dates, final cost, or later maintenance outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_glazing_services_contract_awarded_2025",
    date: "2025-03-24",
    bucket: "planning/development/building fabric contract award",
    title: "Council-properties glazing services contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed a measured-term contract for glazing services at all council properties, awarded to John Hunter Glazing Ltd on March 24, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related glazing services contract across council properties.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-glazing-services-council-properties",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "John Hunter Glazing Ltd was listed as supplier; individual design teams and sites are not named in the appendix",
    project_type: "glazing services contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes all council properties.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each property, work order, glazing scope, completion date, final cost, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_roller_shutter_services_contract_awarded_2025",
    date: "2025-03-24",
    bucket: "planning/development/building fabric contract award",
    title: "Council-properties roller-shutter services contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed a measured-term contract for roller-shutter services at various council properties, awarded to D W Industrial Doors on March 24, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related roller-shutter services contract across council properties.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-roller-shutter-services-council-properties",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "D W Industrial Doors was listed as supplier; individual design teams and sites are not named in the appendix",
    project_type: "roller-shutter services contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes various council properties.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each property, work order, shutter scope, completion date, final cost, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sydenham_greenway_cost_consultancy_contract_awarded_2025",
    date: "2025-09-16",
    bucket: "planning/development/greenway consultancy contract award",
    title: "Sydenham Greenway cost-consultancy contract was awarded",
    summary:
      "Belfast City Council's July-September 2025 contracts-awarded appendix listed L3BCC02 Sydenham Greenway cost consultancy, awarded to Hood McGowan Kirk on September 16, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a cost-consultancy contract for the Sydenham Greenway project.",
    area: "Sydenham Greenway / East Belfast",
    latitude: 54.604,
    longitude: -5.872,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q3-sydenham-greenway-cost-consultancy",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Hood McGowan Kirk was listed as supplier; greenway design team and route extents require separate project records",
    project_type: "greenway consultancy contract award",
    geometry_source: "Approximate point placed in the Sydenham Greenway project area because the appendix does not map the route or consultancy scope.",
    geometry_precision: "area approximate",
    limitations:
      "The appendix records cost-consultancy contract award only. It does not confirm design approval, route alignment, construction start, completion, cost estimate outcome, funding approval, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_swimming_pools_filtration_ozone_contract_awarded_2025",
    date: "2025-09-03",
    bucket: "planning/development/leisure asset contract award",
    title: "Council swimming-pools filtration and ozone contract was awarded",
    summary:
      "Belfast City Council's July-September 2025 contracts-awarded appendix listed a measured-term contract for repair, maintenance, and minor works for swimming-pools filtration and ozone installations at council properties and locations, awarded to WJM Building Services Ltd on September 3, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related contract for swimming-pool filtration and ozone installations across council properties and locations.",
    area: "Belfast City Council leisure properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q3-swimming-pools-filtration-ozone",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "WJM Building Services Ltd was listed as supplier; individual design teams and leisure sites are not named in the appendix",
    project_type: "leisure building systems contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes multiple council properties and locations.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each pool, filtration or ozone system, work order, completion date, final cost, service interruption, or later operating status."
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
