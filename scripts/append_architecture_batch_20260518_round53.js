const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastContractsAwardedJun2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s122835/Appendix%202%20-%20Contracts%20Awarded%20to%20Jun25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_51_moorgate_completion_2020",
    date: "2020-03-01",
    bucket: "planning/development/architecture/commercial",
    title: "51 Moorgate was listed as built",
    summary:
      "New London Architecture records 51 Moorgate in the City of London as built, with completion in March 2020.",
    observed_change:
      "A documented Moorgate commercial building project was recorded as reaching built status.",
    area: "Moorgate / City of London",
    latitude: 51.516813,
    longitude: -0.0889033,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 51 Moorgate",
    source_url: "https://nla.london/projects/51-moorgate",
    source_record_id: "nla-51-moorgate",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "John Robertson Architects",
    project_type: "commercial building completion",
    geometry_source: "Approximate point placed at Moorgate from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; leasing, occupation, fit-out, ownership, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bracken_house_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/commercial",
    title: "Bracken House was listed as built",
    summary:
      "New London Architecture records Bracken House in the City of London as built, with completion in January 2019.",
    observed_change:
      "A documented Friday Street commercial building project was recorded as reaching built status.",
    area: "St Paul's / City of London",
    latitude: 51.5124403,
    longitude: -0.0962287,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bracken House",
    source_url: "https://nla.london/projects/bracken-house",
    source_record_id: "nla-bracken-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "John Robertson Architects",
    project_type: "commercial building completion",
    geometry_source: "Approximate point placed at 1 Friday Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenant occupation, heritage constraints, fit-out, management, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_1_finsbury_avenue_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/commercial",
    title: "1 Finsbury Avenue was listed as built",
    summary:
      "New London Architecture records 1 Finsbury Avenue in the City of London as built, with estimated completion in July 2019.",
    observed_change:
      "A documented Broadgate commercial building project was recorded as reaching built status.",
    area: "Broadgate / City of London",
    latitude: 51.5195135,
    longitude: -0.0851116,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 1 Finsbury Avenue",
    source_url: "https://nla.london/projects/1-finsbury-avenue",
    source_record_id: "nla-1-finsbury-avenue",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris",
    project_type: "commercial building completion",
    geometry_source: "Approximate point placed at 1 Finsbury Avenue from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; leasing, occupation, public-access arrangements, fit-out, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_seven_dials_market_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/market hall",
    title: "Seven Dials Market was listed as built",
    summary:
      "New London Architecture records Seven Dials Market in Westminster as built, with estimated completion in September 2019.",
    observed_change:
      "A documented Earlham Street market-hall project was recorded as reaching built status.",
    area: "Seven Dials / Westminster",
    latitude: 51.5138327,
    longitude: -0.1261367,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Seven Dials Market",
    source_url: "https://nla.london/projects/seven-dials-market",
    source_record_id: "nla-seven-dials-market",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stiff + Trevillion",
    project_type: "market hall completion",
    geometry_source: "Approximate point placed at Earlham Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; operator arrangements, individual vendor openings, visitor numbers, public-access rules, and later fit-out changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_47_69_notting_hill_gate_completion_2019",
    date: "2019-08-01",
    bucket: "planning/development/architecture/mixed use",
    title: "47-69 Notting Hill Gate was listed as built",
    summary:
      "New London Architecture records 47-69 Notting Hill Gate in Kensington and Chelsea as built, with estimated completion in August 2019.",
    observed_change:
      "A documented Notting Hill Gate mixed-use project was recorded as reaching built status.",
    area: "Notting Hill Gate / Kensington and Chelsea",
    latitude: 51.5088781,
    longitude: -0.1964132,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 47-69 Notting Hill Gate",
    source_url: "https://nla.london/projects/47-69-notting-hill-gate",
    source_record_id: "nla-47-69-notting-hill-gate",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire and Partners",
    project_type: "mixed-use building completion",
    geometry_source: "Approximate point placed at 59 Notting Hill Gate from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; individual uses, leasing, occupation, public-realm operation, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bed_stuy_fantastic_four_phase2_groundbreaking_2025",
    date: "2025-11-13",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "Bed-Stuy Fantastic Four Phase II broke ground",
    summary:
      "NYC Housing Preservation and Development announced the groundbreaking of Phase II of Bed-Stuy Fantastic Four on November 13, 2025, describing 45 planned affordable homeownership units across eight city-owned vacant lots.",
    observed_change:
      "A documented HPD announcement recorded the start of construction for a multi-site affordable homeownership phase in Bedford-Stuyvesant.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.6963377,
    longitude: -73.943515,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Bed-Stuy Fantastic Four Phase II groundbreaking",
    source_url:
      "https://www.nyc.gov/site/hpd/news/076-26/nyc-housing-preservation-development-shelter-rock-builders-ponce-bank-local-elected",
    source_record_id: "nyc-hpd-2025-11-13-bed-stuy-fantastic-four-phase-2-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Shelter Rock Builders and partners; design teams and individual lot architects require separate project records",
    project_type: "affordable homeownership groundbreaking",
    geometry_source: "Multi-site approximate point placed near Myrtle Avenue in Bedford-Stuyvesant because the HPD release describes four Brooklyn sites on Myrtle Avenue, Vernon Avenue, and Chauncey Street.",
    geometry_precision: "multi-site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not map each lot, confirm completion, sales, homebuyer occupancy, affordability compliance, financing close, or later maintenance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1605_nelson_avenue_supportive_housing_designation_2025",
    date: "2025-04-24",
    bucket: "planning/development/architecture/supportive housing designation",
    title: "1605 Nelson Avenue supportive-housing team was designated",
    summary:
      "NYC Housing Preservation and Development announced on April 24, 2025 that BronxWorks and Slate Property Group were selected to rehabilitate 1605 Nelson Avenue into permanent supportive housing.",
    observed_change:
      "A documented HPD action moved the former shelter site at 1605 Nelson Avenue into a supportive-housing rehabilitation process.",
    area: "Morris Heights / Bronx",
    latitude: 40.846306,
    longitude: -73.919603,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 1605 Nelson Avenue supportive housing designation",
    source_url:
      "https://www.nyc.gov/site/hpd/news/017-25/from-shelter-permanent-homes-nyc-turning-homeless-shelter-affordable-housing",
    source_record_id: "nyc-hpd-2025-04-24-1605-nelson-avenue-supportive-housing-designation",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "BronxWorks, Slate Property Group, and city partners; rehabilitation design team requires separate project records",
    project_type: "supportive housing rehabilitation designation",
    geometry_source: "Approximate point placed at 1605 Nelson Avenue from the HPD press release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer/team designation only. It does not confirm financing close, permits, construction start, completion, resident move-in, supportive-service delivery, or long-term operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_913_kent_avenue_supportive_housing_designation_2025",
    date: "2025-12-17",
    bucket: "planning/development/architecture/supportive housing designation",
    title: "913 Kent Avenue affordable-housing developer was designated",
    summary:
      "NYC Housing Preservation and Development announced on December 17, 2025 that IMPACCT Brooklyn was designated to develop affordable and supportive housing on part of the city-owned lot at 913 Kent Avenue in Bedford-Stuyvesant.",
    observed_change:
      "A documented HPD designation moved a Kent Avenue site into an affordable and supportive housing development process.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.6928963,
    longitude: -73.9589379,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 913 Kent Avenue affordable housing designation",
    source_url: "https://www.nyc.gov/site/hpd/news/085-25/over-70-units-affordable-housing-coming-bed-stuy",
    source_record_id: "nyc-hpd-2025-12-17-913-kent-avenue-designation",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "IMPACCT Brooklyn and city partners; design team requires separate project records",
    project_type: "affordable and supportive housing designation",
    geometry_source: "Approximate point placed at 913 Kent Avenue from the HPD press release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer designation only. It does not confirm financing close, design approval, construction start, completion, community-facility delivery, unit lease-up, or later building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_stemma_crotona_park_east_developer_selection_2025",
    date: "2025-03-21",
    bucket: "planning/development/architecture/housing developer selection",
    title: "The Stemma development team was selected for Crotona Park East",
    summary:
      "NYC Housing Preservation and Development announced on March 21, 2025 the selection of a development team for The Stemma, a planned affordable housing project at Stebbins Avenue and East 170th Street in Crotona Park East.",
    observed_change:
      "A documented HPD action moved a vacant Crotona Park East site into a named affordable-housing development process.",
    area: "Crotona Park East / Bronx",
    latitude: 40.8366165,
    longitude: -73.8927012,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: The Stemma development team selection",
    source_url: "https://www.nyc.gov/site/hpd/news/008-25/transformation-vacant-land-crotona-park-east-149-affordable-homes-begins",
    source_record_id: "nyc-hpd-2025-03-21-stemma-crotona-park-east-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "The Doe Fund, Xenolith Partners, Ametrine Group, and city partners; design team requires separate project records",
    project_type: "affordable housing developer selection",
    geometry_source: "Approximate point placed in Crotona Park East from the HPD release's Stebbins Avenue and East 170th Street site description.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm financing close, permits, construction start, recreation-center delivery, completion, lease-up, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_la_central_phase2_groundbreaking_2025",
    date: "2025-06-20",
    bucket: "planning/development/architecture/housing groundbreaking",
    title: "La Central Phase II broke ground",
    summary:
      "The NYC Mayor's Office announced on June 20, 2025 that city officials and project partners broke ground on Phase II of La Central in Melrose, describing two planned buildings and 420 planned affordable homes.",
    observed_change:
      "A documented mayoral announcement recorded a construction-start milestone for the final La Central housing phase.",
    area: "Melrose / Bronx",
    latitude: 40.8158334,
    longitude: -73.9163627,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: La Central Phase II groundbreaking",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/437-25/mayor-adams-brp-companies-hudson-companies-break-ground-420-new-affordable-homes-in",
    source_record_id: "nyc-mayor-2025-06-20-la-central-phase-2-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "BRP Companies, Hudson Companies, ELH-TKC, Breaking Ground, Comunilife, and city partners; design team requires separate project records",
    project_type: "affordable housing groundbreaking",
    geometry_source: "Approximate point placed at 556 Bergen Avenue/Melrose context for La Central Phase II.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking milestone only. It does not confirm completion, unit lease-up, supportive-service operations, retail/community-space delivery, public-garden delivery, affordability compliance, or later operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_air_conditioning_maintenance_contract_awarded_2025",
    date: "2025-05-15",
    bucket: "planning/development/building systems contract award",
    title: "Council-properties air-conditioning maintenance contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed a measured-term contract for callout, repairs, and maintenance to air-conditioning systems at various council properties, awarded to BL Refrigeration on May 15, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a building-systems maintenance contract across council properties.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-air-conditioning-maintenance-council-properties",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "BL Refrigeration was listed as supplier; individual properties and design teams are not named in the appendix",
    project_type: "building systems maintenance contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes various council properties.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each property, system, work order, completion date, final cost, service interruptions, or later building-system condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_35_39_royal_avenue_cost_estimation_contract_awarded_2025",
    date: "2025-05-30",
    bucket: "planning/development/cost consultancy contract award",
    title: "35-39 Royal Avenue cost-estimation services contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed L3BCC01 cost-estimation services for 35-39 Royal Avenue, awarded to Skope Projects LLP on May 30, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a cost-estimation services contract for 35-39 Royal Avenue.",
    area: "35-39 Royal Avenue / Belfast",
    latitude: 54.6027983,
    longitude: -5.9309216,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-35-39-royal-avenue-cost-estimation",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Skope Projects LLP was listed as supplier; design team and later option recommendations require separate records",
    project_type: "cost consultancy contract award",
    geometry_source: "Approximate point placed at Royal Avenue from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records cost-estimation contract award only. It does not confirm preferred option, works approval, planning consent, construction, final cost, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_fire_intruder_alarms_contract_awarded_2025",
    date: "2025-06-03",
    bucket: "planning/development/building safety systems contract award",
    title: "Council-properties fire and intruder alarms contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed a measured-term contract for fire and intruder alarms at various council properties, awarded to Radiocontact Ltd on June 3, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a building-safety systems contract across council properties.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-fire-intruder-alarms-council-properties",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Radiocontact Ltd was listed as supplier; individual properties and design teams are not named in the appendix",
    project_type: "building safety systems contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes various council properties.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each property, alarm system, work order, certification result, completion date, final cost, or later compliance status."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_north_foreshore_lfg_gas_ring_main_installation_contract_awarded_2025",
    date: "2025-06-09",
    bucket: "planning/development/utilities contract award",
    title: "North Foreshore LFG gas ring-main installation contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed North Foreshore LFG Gas Ring Main Installation, awarded to CivCo Ltd on June 9, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of an installation contract for North Foreshore landfill-gas ring-main infrastructure.",
    area: "North Foreshore",
    latitude: 54.6299666,
    longitude: -5.9159415,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-north-foreshore-lfg-gas-ring-main-installation",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "CivCo Ltd was listed as supplier; engineering designers require separate project records",
    project_type: "utilities installation contract award",
    geometry_source: "Approximate point placed at North Foreshore from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records installation contract award only. It does not confirm route alignment, works start, completion, commissioning, gas-management performance, final cost, or later operating status."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_clifton_street_graveyard_refurbishment_contract_awarded_2025",
    date: "2025-06-16",
    bucket: "planning/development/heritage landscape contract award",
    title: "Clifton Street Graveyard refurbishment contract was awarded",
    summary:
      "Belfast City Council's April-June 2025 contracts-awarded appendix listed Clifton Street Graveyard refurbishment works, awarded to William Rogers Construction on June 16, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a refurbishment-works contract for Clifton Street Graveyard.",
    area: "Clifton Street Graveyard / Belfast",
    latitude: 54.604,
    longitude: -5.932,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 2: Contracts Awarded to June 2025",
    source_url: belfastContractsAwardedJun2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q2-clifton-street-graveyard-refurbishment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "William Rogers Construction was listed as supplier; conservation team requires separate project records",
    project_type: "heritage landscape refurbishment contract award",
    geometry_source: "Approximate point placed at Clifton Street Graveyard from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records refurbishment contract award only. It does not confirm conservation scope, works start, completion, public-access changes, final cost, or later landscape/monument condition."
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
