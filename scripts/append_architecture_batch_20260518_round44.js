const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycJosephRodmanDrakeRelease =
  "https://www.nyc.gov/site/lpc/about/pr2023/LPC-Designates-Joseph-Rodman-Drake-Park-and-Enslaved-People-Burial-Ground.page";
const nycJazzLandmarksRelease =
  "https://www.nyc.gov/site/lpc/about/pr2023/lpc-designates-three-sites-with-ties-to-jazz-history.page";
const nycLindenStreetRelease =
  "https://www.nyc.gov/site/lpc/about/pr2023/lpc-designates-the-linden-street-historic-district-in-bushwick-brooklyn.page";
const belfastCapitalLoosSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123924/Item%205%20a%20Physical%20Prog%20Appendix%202%20-%20Capital%20LOOs%20to%20Sept25.pdf";
const belfastContractsAwardedSept2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s123925/Item%205%20a%20Physical%20Prog%20Appendix%203%20-%20Contracts%20Awarded%20to%20Sept25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_38_finsbury_square_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/office",
    title: "38 Finsbury Square was listed as built",
    summary:
      "New London Architecture records 38 Finsbury Square in Islington as built, with completion in 2025.",
    observed_change:
      "A documented office project at Finsbury Square was recorded as reaching built status.",
    area: "Finsbury Square / Islington",
    latitude: 51.522,
    longitude: -0.086,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 38 Finsbury Square",
    source_url: "https://nla.london/projects/38-finsbury-square",
    source_record_id: "nla-38-finsbury-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "AFK Studios",
    project_type: "office project completion",
    geometry_source: "Approximate point placed at 38 Finsbury Square from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupancy, lease-up, energy performance, access arrangements, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_chelsea_island_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Chelsea Island was listed as built",
    summary:
      "New London Architecture records Chelsea Island in Kensington and Chelsea as built, with completion in 2017.",
    observed_change:
      "A documented residential development near Chelsea Harbour was recorded as reaching built status.",
    area: "Chelsea Harbour / Kensington and Chelsea",
    latitude: 51.476,
    longitude: -0.181,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Chelsea Island",
    source_url: "https://nla.london/projects/chelsea-island",
    source_record_id: "nla-chelsea-island",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "AFK Studios",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 1 Harbour Avenue from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure, sales, public-realm arrangements, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_mayfair_park_residences_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Mayfair Park Residences was listed as built",
    summary:
      "New London Architecture records Mayfair Park Residences in Westminster as built, with completion in 2020.",
    observed_change:
      "A documented Mayfair residential project was recorded as reaching built status.",
    area: "Mayfair / Westminster",
    latitude: 51.506,
    longitude: -0.149,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Mayfair Park Residences",
    source_url: "https://nla.london/projects/mayfair-park-residences",
    source_record_id: "nla-mayfair-park-residences",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "PLP Architecture and AFK Studios",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 4 Stanhope Gate from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, sales, tenure, management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_park_sayer_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Park & Sayer was listed as built",
    summary:
      "New London Architecture records Park & Sayer in Southwark as built, with completion in 2024.",
    observed_change:
      "A documented residential project at Elephant Park was recorded as reaching built status.",
    area: "Elephant Park / Southwark",
    latitude: 51.494,
    longitude: -0.098,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Park & Sayer",
    source_url: "https://nla.london/projects/park-sayer",
    source_record_id: "nla-park-sayer",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown and AFK Studios",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at Hewson Way from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, tenure mix, estate phasing, public-realm delivery, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_10_george_street_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/build to rent",
    title: "10 George Street was listed as built",
    summary:
      "New London Architecture records 10 George Street in Tower Hamlets as built, with completion in 2019.",
    observed_change:
      "A documented Canary Wharf residential project was recorded as reaching built status.",
    area: "Canary Wharf / Tower Hamlets",
    latitude: 51.506,
    longitude: -0.019,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 10 George Street",
    source_url: "https://nla.london/projects/10-george-street",
    source_record_id: "nla-10-george-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GRID Architects",
    project_type: "build-to-rent residential completion",
    geometry_source: "Approximate point placed at 10 George Street in Canary Wharf from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, rent levels, management, and later estate operations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_joseph_rodman_drake_park_landmark_designated_2023",
    date: "2023-12-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "Joseph Rodman Drake Park and Enslaved People's Burial Ground was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Joseph Rodman Drake Park and Enslaved People's Burial Ground in Hunts Point as an individual landmark on December 12, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of Joseph Rodman Drake Park and Enslaved People's Burial Ground to individual landmark.",
    area: "Hunts Point / Bronx",
    latitude: 40.812,
    longitude: -73.884,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Joseph Rodman Drake Park and Enslaved People's Burial Ground",
    source_url: nycJosephRodmanDrakeRelease,
    source_record_id: "nyc-lpc-2023-12-12-joseph-rodman-drake-park-enslaved-peoples-burial-ground",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Historic park and burial ground; designer details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed in the Hunts Point park/burial-ground context from the LPC press-release location.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm park reconstruction, archaeological findings beyond those cited, maintenance funding, access changes, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_935_st_nicholas_avenue_landmark_designated_2023",
    date: "2023-06-27",
    bucket: "planning/development/architecture/landmark designation",
    title: "935 St. Nicholas Avenue Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the 935 St. Nicholas Avenue Building in Washington Heights as an individual landmark on June 27, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of 935 St. Nicholas Avenue Building to individual landmark.",
    area: "Washington Heights / Manhattan",
    latitude: 40.833,
    longitude: -73.942,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three sites with ties to jazz history",
    source_url: nycJazzLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-27-935-st-nicholas-avenue-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Residential building with jazz-history association; architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 935 St. Nicholas Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_dizzy_gillespie_residence_landmark_designated_2023",
    date: "2023-06-27",
    bucket: "planning/development/architecture/landmark designation",
    title: "Dizzy Gillespie Residence was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the John Birks 'Dizzy' Gillespie Residence at 105-19 37th Avenue in Corona as an individual landmark on June 27, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Dizzy Gillespie Residence to individual landmark.",
    area: "Corona / Queens",
    latitude: 40.752,
    longitude: -73.861,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three sites with ties to jazz history",
    source_url: nycJazzLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-27-dizzy-gillespie-residence",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Residential building with jazz-history association; architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 105-19 37th Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hotel_cecil_mintons_playhouse_landmark_designated_2023",
    date: "2023-06-27",
    bucket: "planning/development/architecture/landmark designation",
    title: "Hotel Cecil & Minton's Playhouse Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Harlem's Hotel Cecil & Minton's Playhouse Building as an individual landmark on June 27, 2023.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of Hotel Cecil & Minton's Playhouse Building to individual landmark.",
    area: "Harlem / Manhattan",
    latitude: 40.805,
    longitude: -73.953,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: three sites with ties to jazz history",
    source_url: nycJazzLandmarksRelease,
    source_record_id: "nyc-lpc-2023-06-27-hotel-cecil-mintons-playhouse-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Julius F. Munckwicz",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at the southeast corner of St. Nicholas Avenue and West 118th Street from the LPC press-release description.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, nightclub operations, building-condition change, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_linden_street_historic_district_designated_2023",
    date: "2023-05-09",
    bucket: "planning/development/architecture/historic district designation",
    title: "Linden Street Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Linden Street Historic District in Bushwick on May 9, 2023.",
    observed_change:
      "A documented LPC action changed the listed preservation status of a collection of Linden Street row houses to historic district.",
    area: "Bushwick / Brooklyn",
    latitude: 40.694,
    longitude: -73.92,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Linden Street Historic District",
    source_url: nycLindenStreetRelease,
    source_record_id: "nyc-lpc-2023-05-09-linden-street-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Multiple late-19th century Brooklyn row-house architects; individual architects require the designation report",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed on Linden Street in Bushwick because the press release describes the district but does not provide GIS boundaries in extracted fields.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, individual owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lower_ormeau_youth_hub_loo_2025",
    date: "2025-09-30",
    bucket: "planning/development/community facility funding",
    title: "Lower Ormeau Youth Hub capital letter of offer was recorded",
    summary:
      "Belfast City Council's Capital Letters of Offer appendix for July-September 2025 listed Lower Ormeau Youth Hub - St John Vianney with a 200,000 GBP DfC letter of offer.",
    observed_change:
      "A documented capital-funding appendix recorded a letter of offer for the Lower Ormeau Youth Hub project.",
    area: "Lower Ormeau / St John Vianney",
    latitude: 54.584,
    longitude: -5.922,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 2: Capital Letters of Offer to September 2025",
    source_url: belfastCapitalLoosSept2025Pdf,
    source_record_id: "bcc-capital-loo-2025-q2-lower-ormeau-youth-hub-st-john-vianney",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital Letters of Offer appendix reporting quarter",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, DfC, and project partners; design team not named in the appendix",
    project_type: "community facility funding milestone",
    geometry_source: "Approximate point placed in the Lower Ormeau/St John Vianney project context because the appendix does not map the site.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a capital letter of offer, not construction or completion. It does not provide final scope, procurement status, start date, completion date, costs beyond the listed offer, or operating outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waterworks_grow_ni_loo_2025",
    date: "2025-09-30",
    bucket: "planning/development/green infrastructure funding",
    title: "Waterworks GROW NI Growing and Greening letter of offer was recorded",
    summary:
      "Belfast City Council's Capital Letters of Offer appendix for July-September 2025 listed Waterworks - GROW NI Growing and Greening Project with a 30,000 EUR CCAF letter of offer.",
    observed_change:
      "A documented capital-funding appendix recorded a letter of offer for a Waterworks growing and greening project.",
    area: "Waterworks",
    latitude: 54.618,
    longitude: -5.943,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 2: Capital Letters of Offer to September 2025",
    source_url: belfastCapitalLoosSept2025Pdf,
    source_record_id: "bcc-capital-loo-2025-q2-waterworks-grow-ni-growing-greening",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital Letters of Offer appendix reporting quarter",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, CCAF, and project partners; design team not named in the appendix",
    project_type: "green infrastructure funding milestone",
    geometry_source: "Approximate point placed at Waterworks because the appendix does not map the project boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a capital letter of offer, not construction or completion. It does not provide design details, planting scope, procurement status, start date, completion date, maintenance plan, or measured environmental outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_black_mountain_finlays_site_loo_amendment_2025",
    date: "2025-09-30",
    bucket: "planning/development/shared space funding",
    title: "Black Mountain Shared Spaces Finlay's Site letter-of-offer amendment was recorded",
    summary:
      "Belfast City Council's Capital Letters of Offer appendix for July-September 2025 listed Black Mountain Shared Spaces Project - Phase 2 - Finlay's Site (Amendment) with a 667,000 GBP IFI letter of offer.",
    observed_change:
      "A documented capital-funding appendix recorded an amended letter of offer for the Black Mountain Shared Spaces Finlay's Site project.",
    area: "Black Mountain / Finlay's Site",
    latitude: 54.594,
    longitude: -5.99,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 2: Capital Letters of Offer to September 2025",
    source_url: belfastCapitalLoosSept2025Pdf,
    source_record_id: "bcc-capital-loo-2025-q2-black-mountain-finlays-site-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital Letters of Offer appendix reporting quarter",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, IFI, and project partners; design team not named in the appendix",
    project_type: "shared-space funding amendment",
    geometry_source: "Approximate point placed in the Black Mountain/Finlay's Site context because the appendix does not map the project boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records an amended capital letter of offer, not construction or completion. It does not provide final design, procurement status, start date, completion date, contract record, or community-use outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_black_mountain_community_office_units_loo_amendment_2025",
    date: "2025-09-30",
    bucket: "planning/development/community workspace funding",
    title: "Black Mountain Shared Spaces community office units letter-of-offer amendment was recorded",
    summary:
      "Belfast City Council's Capital Letters of Offer appendix for July-September 2025 listed Black Mountain Shared Spaces Project - Community Office Units (Amendment) with a 520,200 GBP DfC letter of offer.",
    observed_change:
      "A documented capital-funding appendix recorded an amended letter of offer for Black Mountain Shared Spaces community office units.",
    area: "Black Mountain",
    latitude: 54.596,
    longitude: -5.991,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 2: Capital Letters of Offer to September 2025",
    source_url: belfastCapitalLoosSept2025Pdf,
    source_record_id: "bcc-capital-loo-2025-q2-black-mountain-community-office-units-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital Letters of Offer appendix reporting quarter",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, DfC, and project partners; design team not named in the appendix",
    project_type: "community workspace funding amendment",
    geometry_source: "Approximate point placed in the Black Mountain shared-spaces context because the appendix does not map the office units.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records an amended capital letter of offer, not construction or completion. It does not provide final design, office-unit schedule, procurement status, start date, completion date, or operating outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_golden_thread_wilmont_house_feasibility_contract_awarded_2025",
    date: "2025-08-12",
    bucket: "planning/development/cultural facility procurement",
    title: "Golden Thread Art Gallery at Wilmont House feasibility contract was awarded",
    summary:
      "Belfast City Council's contracts-awarded appendix for July-September 2025 listed a feasibility-study consultancy contract for Golden Thread Art Gallery in Wilmont House, awarded to Hall Black Douglas on August 12, 2025.",
    observed_change:
      "A documented contracts appendix recorded a feasibility-study consultancy award for cultural-facility work at Wilmont House.",
    area: "Wilmont House / Sir Thomas and Lady Dixon Park",
    latitude: 54.529,
    longitude: -5.994,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Appendix 3: Contracts Awarded to September 2025",
    source_url: belfastContractsAwardedSept2025Pdf,
    source_record_id: "bcc-contract-awarded-2025-08-12-golden-thread-art-gallery-wilmont-house-feasibility",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contracts awarded appendix award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Hall Black Douglas feasibility-study consultancy; future design team not established by the appendix",
    project_type: "cultural facility feasibility contract award",
    geometry_source: "Approximate point placed at Wilmont House/Sir Thomas and Lady Dixon Park because the appendix does not map the feasibility-study boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a feasibility-study contract award, not design approval, construction, or completion. It does not provide study findings, planning status, funding commitment, construction timeline, or operating outcomes."
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
