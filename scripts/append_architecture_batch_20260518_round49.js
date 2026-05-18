const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycBroadwaySouthOfUnionSquareRelease =
  "https://www.nyc.gov/site/lpc/about/pr2019/lpc-designates-7-broadway-buildings-south-ofunion-square-as-individual-landmarks.page";
const belfastContractsAwardedMar2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s121134/Appendix%203%20-%20Contracts%20Awarded%20to%20Mar25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_2_12_high_street_stratford_completion_2015",
    date: "2015-01-01",
    bucket: "planning/development/architecture/residential",
    title: "2-12 High Street Stratford was listed as built",
    summary:
      "New London Architecture records 2-12 High Street Stratford in Newham as built, with completion in January 2015.",
    observed_change:
      "A documented High Street Stratford residential project was recorded as reaching built status.",
    area: "High Street Stratford / Newham",
    latitude: 51.531,
    longitude: -0.011,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 2-12 High Street Stratford",
    source_url: "https://nla.london/projects/2-12-high-street-stratford",
    source_record_id: "nla-2-12-high-street-stratford",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Jestico + Whiles",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed on High Street Stratford from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, tenure, sales, management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_west_hendon_phase_one_block_e_completion_2016",
    date: "2016-01-01",
    bucket: "planning/development/architecture/residential",
    title: "West Hendon Phase One Block E was listed as built",
    summary:
      "New London Architecture records West Hendon Phase One - Block E in Barnet as built, with completion recorded for 2016.",
    observed_change:
      "A documented West Hendon residential block was recorded as reaching built status.",
    area: "West Hendon / Barnet",
    latitude: 51.578,
    longitude: -0.24,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: West Hendon Phase One - Block E",
    source_url: "https://nla.london/projects/west-hendon-phase-one-block-e",
    source_record_id: "nla-west-hendon-phase-one-block-e",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 228A West Hendon Broadway from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year only; exact completion day, occupation, tenure mix, sales, management, and later estate changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kew_pavilion_bar_and_grill_completion_2019",
    date: "2019-04-01",
    bucket: "planning/development/architecture/hospitality",
    title: "Kew Pavilion Bar and Grill was listed as built",
    summary:
      "New London Architecture records Kew Pavilion Bar and Grill in Richmond upon Thames as built, with completion in April 2019.",
    observed_change:
      "A documented Kew Gardens hospitality project was recorded as reaching built status.",
    area: "Kew Gardens / Richmond upon Thames",
    latitude: 51.471,
    longitude: -0.294,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kew Pavilion Bar and Grill",
    source_url: "https://nla.london/projects/kew-pavilion-bar-and-grill",
    source_record_id: "nla-kew-pavilion-bar-and-grill",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Ryder Architecture",
    project_type: "hospitality building completion",
    geometry_source: "Approximate point placed at Kew Gardens Lion Gate from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; opening arrangements, operator changes, visitor numbers, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_42_berners_street_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/commercial",
    title: "42 Berners Street was listed as built",
    summary:
      "New London Architecture records 42 Berners Street in Westminster as built, with completion in January 2019.",
    observed_change:
      "A documented Fitzrovia commercial building project was recorded as reaching built status.",
    area: "Fitzrovia / Westminster",
    latitude: 51.518,
    longitude: -0.137,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 42 Berners Street",
    source_url: "https://nla.london/projects/42-berners-street",
    source_record_id: "nla-42-berners-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman",
    project_type: "commercial building completion",
    geometry_source: "Approximate point placed on Berners Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; leasing, occupation, ownership, fit-out, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_monuments_cottage_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/residential",
    title: "Monument's Cottage was listed as built",
    summary:
      "New London Architecture records Monument's Cottage in Ealing as built, with estimated completion in July 2019.",
    observed_change:
      "A documented St Mary's Road infill house project was recorded as reaching built status.",
    area: "Ealing",
    latitude: 51.512,
    longitude: -0.306,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Monument's Cottage",
    source_url: "https://nla.london/projects/monuments-cottage",
    source_record_id: "nla-monuments-cottage",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "CLAD studio",
    project_type: "residential infill completion",
    geometry_source: "Approximate point placed on St Mary's Road, Ealing, from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; exact completion day, occupation, sales, building-control records, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_817_broadway_landmark_designated_2019",
    date: "2019-06-11",
    bucket: "planning/development/architecture/landmark designation",
    title: "817 Broadway was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 817 Broadway as one of seven Broadway south of Union Square individual landmarks on June 11, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 817 Broadway to individual landmark.",
    area: "Broadway south of Union Square / Manhattan",
    latitude: 40.7331313,
    longitude: -73.9912876,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Broadway south of Union Square buildings",
    source_url: nycBroadwaySouthOfUnionSquareRelease,
    source_record_id: "nyc-lpc-2019-06-11-817-broadway",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "George B. Post",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 817 Broadway from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, conversion completion, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_826_broadway_landmark_designated_2019",
    date: "2019-06-11",
    bucket: "planning/development/architecture/landmark designation",
    title: "826 Broadway was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 826 Broadway, also known as the Strand Building, as one of seven Broadway south of Union Square individual landmarks on June 11, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 826 Broadway to individual landmark.",
    area: "Broadway south of Union Square / Manhattan",
    latitude: 40.733322,
    longitude: -73.99098,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Broadway south of Union Square buildings",
    source_url: nycBroadwaySouthOfUnionSquareRelease,
    source_record_id: "nyc-lpc-2019-06-11-826-broadway",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "William H. Birkmire",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 826 Broadway from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm bookstore operations, restoration work, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_830_broadway_landmark_designated_2019",
    date: "2019-06-11",
    bucket: "planning/development/architecture/landmark designation",
    title: "830 Broadway was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 830 Broadway as one of seven Broadway south of Union Square individual landmarks on June 11, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 830 Broadway to individual landmark.",
    area: "Broadway south of Union Square / Manhattan",
    latitude: 40.73336,
    longitude: -73.9907342,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Broadway south of Union Square buildings",
    source_url: nycBroadwaySouthOfUnionSquareRelease,
    source_record_id: "nyc-lpc-2019-06-11-830-broadway",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cleverdon & Putzel",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 830 Broadway from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, residential conversion timing, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_832_834_broadway_landmark_designated_2019",
    date: "2019-06-11",
    bucket: "planning/development/architecture/landmark designation",
    title: "832-834 Broadway was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 832-834 Broadway as one of seven Broadway south of Union Square individual landmarks on June 11, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 832-834 Broadway to individual landmark.",
    area: "Broadway south of Union Square / Manhattan",
    latitude: 40.7334725,
    longitude: -73.9907604,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Broadway south of Union Square buildings",
    source_url: nycBroadwaySouthOfUnionSquareRelease,
    source_record_id: "nyc-lpc-2019-06-11-832-834-broadway",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Ralph S. Townsend",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 832 Broadway from the LPC press-release address range.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, residential conversion timing, building-condition change, tenant status, owner actions, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_836_broadway_landmark_designated_2019",
    date: "2019-06-11",
    bucket: "planning/development/architecture/landmark designation",
    title: "836 Broadway was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 836 Broadway as one of seven Broadway south of Union Square individual landmarks on June 11, 2019.",
    observed_change:
      "A documented LPC action changed the listed preservation status of 836 Broadway to individual landmark.",
    area: "Broadway south of Union Square / Manhattan",
    latitude: 40.7336169,
    longitude: -73.9908117,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Broadway south of Union Square buildings",
    source_url: nycBroadwaySouthOfUnionSquareRelease,
    source_record_id: "nyc-lpc-2019-06-11-836-broadway",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Stephen Decatur Hatch",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 836 Broadway from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, tenant status, owner actions, permits, commercial occupancy, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_floral_hall_asbestos_removal_contract_awarded_2025",
    date: "2025-01-13",
    bucket: "planning/development/building remediation contract award",
    title: "Floral Hall asbestos-removal contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed a Floral Hall asbestos-removal works contract awarded to Keltbray Ltd on January 13, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related asbestos-removal contract for Floral Hall.",
    area: "Floral Hall / Belfast Zoo",
    latitude: 54.657,
    longitude: -5.942,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-floral-hall-asbestos-removal",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Keltbray Ltd was listed as supplier; design team not named in the appendix",
    project_type: "building remediation contract award",
    geometry_source: "Approximate point placed in the Floral Hall/Belfast Zoo context because the appendix does not map the works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records contract award only. It does not confirm remediation start, remediation completion, restoration scope, reopening, final cost, procurement variations, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_stained_glass_artist_contract_awarded_2025",
    date: "2025-01-20",
    bucket: "planning/development/civic heritage contract award",
    title: "City Hall stained-glass artist contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed commissioning of an artist for the design, manufacture, and installation of a new stained-glass window at Belfast City Hall, awarded to Alpha Stained Glass on January 20, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a City Hall stained-glass design, manufacture, and installation contract.",
    area: "Belfast City Hall",
    latitude: 54.596,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-city-hall-stained-glass-alpha",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Alpha Stained Glass was listed as supplier; artist/design authorship details require separate project records",
    project_type: "civic heritage contract award",
    geometry_source: "Approximate point placed at Belfast City Hall from the named contract location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records contract award only. It does not confirm design approval, manufacture completion, installation date, unveiling, conservation assessment, final cost, or later maintenance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_castlereagh_community_hall_contract_awarded_2025",
    date: "2025-02-28",
    bucket: "planning/development/community facility contract award",
    title: "Castlereagh Community Hall contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed BIF_Castlereagh Community Hall awarded to Bradley Construction (MF) Ltd on February 28, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a works-related contract for Castlereagh Community Hall.",
    area: "Castlereagh",
    latitude: 54.575,
    longitude: -5.887,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-castlereagh-community-hall",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Bradley Construction (MF) Ltd was listed as supplier; design team not named in the appendix",
    project_type: "community facility contract award",
    geometry_source: "Approximate point placed in the Castlereagh project area because the appendix does not include a map or street address.",
    geometry_precision: "area approximate",
    limitations:
      "The appendix records contract award only. It does not confirm construction start, construction completion, building scope, opening date, final cost, community-use arrangements, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_wilmont_fernhill_condition_surveys_contract_awarded_2025",
    date: "2025-03-19",
    bucket: "planning/development/heritage estate survey contract award",
    title: "Wilmont House and Fernhill House condition-surveys contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed L1BCC03 Wilmont House and Fernhill House plus stables condition surveys and options appraisals awarded to Doran Consulting on March 19, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a condition-surveys and options-appraisals contract for Wilmont House and Fernhill House plus stables.",
    area: "Wilmont House and Fernhill House",
    latitude: 54.577,
    longitude: -5.982,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-wilmont-fernhill-condition-surveys",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Doran Consulting was listed as supplier; survey authors and later option recommendations require separate records",
    project_type: "heritage estate survey contract award",
    geometry_source: "Multi-site approximate point placed between Wilmont House and Fernhill House because the appendix does not provide mapped survey extents.",
    geometry_precision: "multi-site approximate",
    limitations:
      "The appendix records contract award for surveys and options appraisals only. It does not confirm survey findings, preferred option, works approval, construction, conservation consent, final cost, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_davitts_gac_community_heritage_centre_contract_awarded_2025",
    date: "2025-03-20",
    bucket: "planning/development/community heritage contract award",
    title: "Davitts GAC community and heritage centre contract was awarded",
    summary:
      "Belfast City Council's January-March 2025 contracts-awarded appendix listed NRF_New Build Community and Heritage Centre at Davitts GAC awarded to Piperhill Construction on March 20, 2025.",
    observed_change:
      "A documented council contracts appendix recorded award of a new-build community and heritage centre contract at Davitts GAC.",
    area: "Davitts GAC / West Belfast",
    latitude: 54.589,
    longitude: -5.971,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to March 2025",
    source_url: belfastContractsAwardedMar2025Pdf,
    source_record_id: "bcc-contracts-awarded-2025-q1-davitts-gac-community-heritage-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Piperhill Construction was listed as supplier; design team not named in the appendix",
    project_type: "community and heritage centre contract award",
    geometry_source: "Approximate point placed in the Davitts GAC/West Belfast project context because the appendix does not provide a map or street address.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records contract award only. It does not confirm construction start, construction completion, facility opening, final scope, cost, operating model, or later use."
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
