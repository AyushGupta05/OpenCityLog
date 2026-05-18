const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCapitalLoosJun2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s122834/Appendix%201%20-%20Capital%20LOOs%20to%20Jun25.pdf";
const belfastPhysicalProgrammeAug2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s122833/Physical%20Programme%20Update.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_export_building_republic_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/commercial adaptive reuse",
    title: "The Export Building, Republic was listed as built",
    summary:
      "New London Architecture records The Export Building, Republic in Tower Hamlets as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Poplar commercial adaptive-reuse project was recorded as reaching built status.",
    area: "Poplar / Tower Hamlets",
    latitude: 51.512,
    longitude: -0.007,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Export Building, Republic",
    source_url: "https://nla.london/projects/the-export-building-republic",
    source_record_id: "nla-the-export-building-republic",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Studio RHE",
    project_type: "commercial adaptive-reuse completion",
    geometry_source: "Approximate point placed at 5 Clove Crescent from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenancy, fit-out, public access, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_belvedere_gardens_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/residential mixed use",
    title: "Belvedere Gardens was listed as built",
    summary:
      "New London Architecture records Belvedere Gardens in Lambeth as built, with estimated completion in December 2019.",
    observed_change:
      "A documented Waterloo mixed-use residential project was recorded as reaching built status.",
    area: "Waterloo / Lambeth",
    latitude: 51.506,
    longitude: -0.117,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Belvedere Gardens",
    source_url: "https://nla.london/projects/belvedere-gardens",
    source_record_id: "nla-belvedere-gardens",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GRID architects",
    project_type: "mixed-use residential completion",
    geometry_source: "Approximate point placed at 6 Belvedere Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; individual apartment occupation, amenity operation, management arrangements, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bunhill_2_energy_centre_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/energy infrastructure",
    title: "Bunhill 2 Energy Centre was listed as built",
    summary:
      "New London Architecture records Bunhill 2 Energy Centre in Islington as built, with completion in 2020.",
    observed_change:
      "A documented Moreland Street energy-centre project was recorded as reaching built status.",
    area: "Bunhill / Islington",
    latitude: 51.527,
    longitude: -0.097,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bunhill 2 Energy Centre",
    source_url: "https://nla.london/projects/bunhill-2-energy-centre-1",
    source_record_id: "nla-bunhill-2-energy-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Cullinan Studio; McGurk Chartered Architects listed as delivery architect",
    project_type: "energy infrastructure completion",
    geometry_source: "Approximate point placed at 9 Moreland Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; commissioning details, heat-network performance, household connections, operating costs, and later technical changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_monier_road_completion_2018",
    date: "2018-07-01",
    bucket: "planning/development/architecture/housing mixed use",
    title: "Monier Road was listed as built",
    summary:
      "New London Architecture records Monier Road on Fish Island in Tower Hamlets as built, with estimated completion in July 2018.",
    observed_change:
      "A documented Fish Island mixed-use housing project was recorded as reaching built status.",
    area: "Fish Island / Tower Hamlets",
    latitude: 51.541,
    longitude: -0.023,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Monier Road",
    source_url: "https://nla.london/projects/monier-road",
    source_record_id: "nla-monier-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pitman Tozer Architects listed the project; NLA parsed credits list client and contractor without a separate architect field",
    project_type: "mixed-use housing completion",
    geometry_source: "Approximate point placed at 90 Monier Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenure mix, workspace operation, resident occupation, management, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_95_peckham_road_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/housing",
    title: "95 Peckham Road was listed as built",
    summary:
      "New London Architecture records 95 Peckham Road in Southwark as built, with estimated completion in June 2019.",
    observed_change:
      "A documented Peckham Road residential project was recorded as reaching built status.",
    area: "Peckham / Southwark",
    latitude: 51.473,
    longitude: -0.08,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 95 Peckham Road",
    source_url: "https://nla.london/projects/95-peckham-road",
    source_record_id: "nla-95-peckham-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Peter Barber Architects",
    project_type: "residential building completion",
    geometry_source: "Approximate point placed at 95 Peckham Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupancy, tenure, affordability, courtyard management, and later alterations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hudson_mosaic_developer_selection_2025",
    date: "2025-12-18",
    bucket: "planning/development/architecture/mixed use developer selection",
    title: "Hudson Mosaic development team was selected",
    summary:
      "NYC HPD, Parks, and DEP announced on December 18, 2025 that Camber Property Group, Services for the UnderServed, and Essence Development were selected to develop Hudson Mosaic at 388 Hudson Street, described as a Herzog & de Meuron-designed mixed-use building with nearly 280 affordable and supportive homes and a public recreation center.",
    observed_change:
      "A documented city announcement selected a development team for the 388 Hudson Street mixed-use affordable-housing and recreation-center process.",
    area: "Hudson Square / West Village / Manhattan",
    latitude: 40.728432558047,
    longitude: -74.007065412832,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Hudson Mosaic development team selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/086-25/dep-owned-lot-become-first-its-kind-development-combining-affordable-housing-public",
    source_record_id: "nyc-hpd-2025-12-18-hudson-mosaic-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Herzog & de Meuron in collaboration with Curtis + Ginsberg Architects, as described by HPD",
    project_type: "mixed-use affordable housing and recreation-center developer selection",
    geometry_source: "Census geocoder point for 388 Hudson Street, used as an approximate site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer selection only. It does not confirm financing close, land-use approvals, permit issuance, construction start, completion, unit lease-up, recreation-center opening, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_grand_concourse_library_heartwood_team_selected_2025",
    date: "2025-11-20",
    bucket: "planning/development/architecture/library housing developer selection",
    title: "The Heartwood team was selected for Grand Concourse Library",
    summary:
      "NYC HPD and The New York Public Library announced on November 20, 2025 that Settlement Housing Fund and Kalel Companies would redevelop the Grand Concourse Library at 155 East 173rd Street as The Heartwood, a new library with approximately 113 affordable rent-stabilized homes above it.",
    observed_change:
      "A documented city and library announcement selected a team for a library-and-affordable-housing redevelopment in the West Bronx.",
    area: "Mount Eden / Bronx",
    latitude: 40.84386047451,
    longitude: -73.90986991789,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: The Heartwood at Grand Concourse Library",
    source_url:
      "https://www.nyc.gov/site/hpd/news/078-25/extra-extra-read-all-it-new-library-affordable-homes-coming-the-bronx",
    source_record_id: "nyc-hpd-2025-11-20-grand-concourse-library-heartwood-team-selected",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Bernheimer Architecture and Levenbetts Architects are named in the HPD release",
    project_type: "library and affordable housing developer selection",
    geometry_source: "Census geocoder point for 155 East 173rd Street, used as an approximate site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records team selection and announced redevelopment scope only. It does not confirm final design approval, temporary-library arrangements, construction start, completion, affordable-housing lottery, resident move-in, or library reopening."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_153_nevins_street_developer_selection_2025",
    date: "2025-08-14",
    bucket: "planning/development/architecture/affordable housing developer selection",
    title: "153 Nevins Street development team was selected",
    summary:
      "NYC HPD announced on August 14, 2025 that Fifth Avenue Committee was selected to convert the city-owned parking lot at 153 Nevins Street into approximately 70 affordable rent-stabilized homes with community facility space for Brooklyn Workforce Innovations.",
    observed_change:
      "A documented HPD announcement selected a development team for a Boerum Hill affordable-housing and workforce-development project.",
    area: "Boerum Hill / Brooklyn",
    latitude: 40.682769391039,
    longitude: -73.984806073013,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 153 Nevins Street developer selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/56-25/second-boerum-hill-parking-lot-become-new-community-asset-new-affordable-housing-workforce",
    source_record_id: "nyc-hpd-2025-08-14-153-nevins-street-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Magnusson Architecture and Planning is named in the HPD release",
    project_type: "affordable housing developer selection",
    geometry_source: "Census geocoder point for 153 Nevins Street, used as an approximate site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer selection only. It does not confirm financing close, design approval, permit issuance, construction start, completion, workforce-space opening, unit lease-up, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_hunters_point_south_parcel_e_rfp_released_2025",
    date: "2025-06-13",
    bucket: "planning/development/architecture/mixed use rfp",
    title: "Hunter's Point South Parcel E RFP was released",
    summary:
      "NYC HPD announced on June 13, 2025 the release of a competitive request for proposals for Hunter's Point South Parcel E, described as a planned multi-building mixed-use development with affordable homes, market-rate homes, commercial space, community facility space, and public open space.",
    observed_change:
      "A documented HPD procurement milestone opened a development-team selection process for Parcel E at Hunter's Point South.",
    area: "Hunter's Point South / Queens",
    latitude: 40.7429,
    longitude: -73.9609,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Hunter's Point South Parcel E RFP",
    source_url:
      "https://www.nyc.gov/site/hpd/news/041-25/hunter-s-point-south--key-unlocking-more-affordable-housing-queens",
    source_record_id: "nyc-hpd-2025-06-13-hunters-point-south-parcel-e-rfp-released",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Development and design team to be selected through the RFP process",
    project_type: "mixed-use development request for proposals",
    geometry_source: "Approximate point placed within Hunter's Point South because the HPD release names Parcel E without a street address.",
    geometry_precision: "district approximate",
    limitations:
      "The event records RFP release only. It does not confirm team selection, design approval, financing close, construction start, completion, open-space delivery, occupancy, or later building operation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_third_act_apartments_developer_selection_2025",
    date: "2025-04-24",
    bucket: "planning/development/architecture/senior housing developer selection",
    title: "Third Act Apartments development team was selected",
    summary:
      "NYC HPD announced on April 24, 2025 that Cornerstone Construction Group, St. Nicks Alliance, and Stanton Street Development Partners were selected for Third Act Apartments, a planned mixed-use senior affordable-housing project on Third Avenue between Bergen and Wyckoff Streets in Boerum Hill.",
    observed_change:
      "A documented HPD announcement selected a development team for a Boerum Hill senior affordable-housing project.",
    area: "Boerum Hill / Brooklyn",
    latitude: 40.682978212902,
    longitude: -73.982376146209,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Third Act Apartments developer selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/016-25/from-parking-lot-new-affordable-housing-plans-announced-transform-boerum-hill-neighborhood",
    source_record_id: "nyc-hpd-2025-04-24-third-act-apartments-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "David Cunningham Architecture Planning PLLC is named in the HPD release",
    project_type: "senior affordable housing developer selection",
    geometry_source: "Census geocoder point for 114 Third Avenue, used as an approximate marker for the Third Avenue site between Bergen and Wyckoff Streets.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer selection only. It does not confirm financing close, design approval, permit issuance, construction start, completion, resident move-in, commercial/community-space opening, or later building operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sandy_row_arts_digital_hub_loo_amendment_2025",
    date: "2025-06-30",
    bucket: "planning/development/capital letter of offer",
    title: "Sandy Row Arts and Digital Hub letter-of-offer amendment was recorded",
    summary:
      "Belfast City Council's Q1 2025/26 capital letters-of-offer appendix listed a Sandy Row Arts and Digital Hub amendment from The Executive Office with an amount of GBP 871,988.",
    observed_change:
      "A documented council appendix recorded an amended external-funding offer for the Sandy Row Arts and Digital Hub project.",
    area: "Sandy Row / South Belfast",
    latitude: 54.5901,
    longitude: -5.935,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 1: Capital Letters of Offer to June 2025",
    source_url: belfastCapitalLoosJun2025Pdf,
    source_record_id: "bcc-capital-loos-2025-q1-sandy-row-arts-digital-hub-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital letters-of-offer reporting period ending 30 June 2025",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Funder listed as The Executive Office; design and delivery teams require separate project records",
    project_type: "capital funding offer amendment",
    geometry_source: "Approximate district point placed in Sandy Row because the appendix does not provide a street address or mapped boundary.",
    geometry_precision: "district approximate",
    limitations:
      "The appendix records a funding-offer amendment only. It does not confirm works scope, procurement, planning consent, construction start, completion, opening, final cost, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_public_services_hub_cwb_5gir_loo_2025",
    date: "2025-06-30",
    bucket: "planning/development/capital letter of offer",
    title: "Public Services Hub in CWB 5GIR letter of offer was recorded",
    summary:
      "Belfast City Council's Q1 2025/26 capital letters-of-offer appendix listed IT Prog - 5GIR - Public Services Hub in CWB from DSIT with an amount of GBP 1,300,000.",
    observed_change:
      "A documented council appendix recorded an external-funding offer for a public-services hub item within the 5GIR programme.",
    area: "Belfast city centre / citywide programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 1: Capital Letters of Offer to June 2025",
    source_url: belfastCapitalLoosJun2025Pdf,
    source_record_id: "bcc-capital-loos-2025-q1-5gir-public-services-hub-cwb",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital letters-of-offer reporting period ending 30 June 2025",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Funder listed as DSIT; delivery, design, and host-site teams require separate project records",
    project_type: "capital funding offer",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix does not provide a street address or mapped boundary.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records a funding offer only and gives a sparse project title. It does not define CWB, list the hub address, specify building works, confirm procurement, installation, completion, public access, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ulster_hall_lighting_design_loo_amendment_2025",
    date: "2025-06-30",
    bucket: "planning/development/capital letter of offer",
    title: "Ulster Hall lighting-design letter-of-offer amendment was recorded",
    summary:
      "Belfast City Council's Q1 2025/26 capital letters-of-offer appendix listed Ulster Hall: Production of Lighting Design (Amendment) from LQBID with an amount of GBP 15,000.",
    observed_change:
      "A documented council appendix recorded an amended funding offer for lighting-design work associated with Ulster Hall.",
    area: "Ulster Hall / Belfast city centre",
    latitude: 54.594,
    longitude: -5.93,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 1: Capital Letters of Offer to June 2025",
    source_url: belfastCapitalLoosJun2025Pdf,
    source_record_id: "bcc-capital-loos-2025-q1-ulster-hall-lighting-design-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital letters-of-offer reporting period ending 30 June 2025",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Funder listed as LQBID; lighting designer, conservation adviser, and delivery team require separate project records",
    project_type: "capital funding offer amendment",
    geometry_source: "Approximate point placed at Ulster Hall from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a funding-offer amendment only. It does not confirm lighting-design scope, heritage approvals, procurement, installation, completion, final cost, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_abc_trust_health_leisure_hub_loo_amendment_2025",
    date: "2025-06-30",
    bucket: "planning/development/capital letter of offer",
    title: "ABC Trust Health and Leisure Hub letter-of-offer amendment was recorded",
    summary:
      "Belfast City Council's Q1 2025/26 capital letters-of-offer appendix listed an ABC Trust Health and Leisure Hub amendment from The Executive Office with an amount of GBP 150,000.",
    observed_change:
      "A documented council appendix recorded an amended external-funding offer for the ABC Trust Health and Leisure Hub.",
    area: "Ardoyne / North Belfast",
    latitude: 54.6187,
    longitude: -5.9617,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 1: Capital Letters of Offer to June 2025",
    source_url: belfastCapitalLoosJun2025Pdf,
    source_record_id: "bcc-capital-loos-2025-q1-abc-trust-health-leisure-hub-amendment",
    source_retrieved_at: retrievedAt,
    source_date_field: "Capital letters-of-offer reporting period ending 30 June 2025",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Funder listed as The Executive Office; design and delivery teams require separate project records",
    project_type: "capital funding offer amendment",
    geometry_source: "Approximate point reused from existing curated ABC Trust Health and Leisure Hub records near the former St Gemma's High School / Ardilea Street area.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records a funding-offer amendment only. It does not confirm phase scope, procurement, planning consent, construction progress, completion, opening, final cost, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_new_crematorium_workshop_date_noted_2025",
    date: "2025-08-22",
    bucket: "planning/development/architecture/options appraisal",
    title: "New crematorium workshop date was noted",
    summary:
      "Belfast City Council's Physical Programme Update report dated August 22, 2025 asked members to note a dedicated workshop on September 18, 2025 for the proposed new crematorium at Roselawn.",
    observed_change:
      "A documented council report recorded the next engagement step for the proposed new crematorium options-appraisal process.",
    area: "Roselawn Crematorium",
    latitude: 54.562,
    longitude: -5.803,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update",
    source_url: belfastPhysicalProgrammeAug2025Pdf,
    source_record_id: "bcc-physical-programme-2025-08-22-new-crematorium-workshop-date",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee report date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Consultants are referenced for the workshop; design team and preferred option require separate project records",
    project_type: "options-appraisal engagement milestone",
    geometry_source: "Approximate point placed at Roselawn Crematorium from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records a scheduled workshop and options-appraisal step only. It does not confirm a preferred option, capital approval, planning consent, procurement, construction start, completion, opening, final cost, or later operation."
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
