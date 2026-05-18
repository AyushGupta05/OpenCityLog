const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";
const belfastPhysicalProgrammeDec2024 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=81706";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_synnovis_hub_completion_2024",
    date: "2024-05-01",
    bucket: "planning/development/architecture/health laboratory",
    title: "The Synnovis Hub was listed as built",
    summary:
      "New London Architecture records The Synnovis Hub in Southwark as built, with completion in May 2024.",
    observed_change:
      "A documented Blackfriars Road office-to-pathology-laboratory retrofit was recorded as reaching built status.",
    area: "Blackfriars Road / Southwark",
    latitude: 51.506247,
    longitude: -0.105224,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Synnovis Hub",
    source_url: "https://nla.london/projects/the-synnovis-hub",
    source_record_id: "nla-the-synnovis-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown Ltd",
    project_type: "health laboratory retrofit completion",
    geometry_source: "Postcode point from postcodes.io for the source-stated Blackfriars Road SE1 context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; NHS operating arrangements, laboratory commissioning, sample volumes, clinical outcomes, and later building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_clockwise_wood_green_greenside_house_completion_2021",
    date: "2021-11-01",
    bucket: "planning/development/architecture/workplace retrofit",
    title: "Clockwise Wood Green at Greenside House was listed as built",
    summary:
      "New London Architecture records Clockwise Wood Green at Greenside House in Haringey as built, with estimated completion in November 2021.",
    observed_change:
      "A documented Wood Green workplace refurbishment was recorded as reaching built status.",
    area: "Wood Green / Haringey",
    latitude: 51.59684,
    longitude: -0.113151,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Clockwise Wood Green at Greenside House",
    source_url: "https://nla.london/projects/clockwise-wood-green-at-greenside-house",
    source_record_id: "nla-clockwise-wood-green-greenside-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown Ltd",
    project_type: "workplace refurbishment completion",
    geometry_source: "Postcode point from postcodes.io near the NLA-stated 50 Station Road N22 7TP location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; coworking occupancy, tenant churn, ground-floor public access, commercial performance, and later retrofit performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bancroft_estate_wickford_street_completion_2024",
    date: "2024-04-01",
    bucket: "planning/development/architecture/housing community",
    title: "Bancroft Estate and Wickford Street were listed as built",
    summary:
      "New London Architecture records Bancroft Estate and Wickford Street in Tower Hamlets as built, with completion in April 2024.",
    observed_change:
      "A documented estate infill housing, office, and community-space project was recorded as reaching built status.",
    area: "Bethnal Green / Tower Hamlets",
    latitude: 51.523281,
    longitude: -0.054278,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bancroft Estate and Wickford Street",
    source_url: "https://nla.london/projects/bancroft-estate-and-wickford-street",
    source_record_id: "nla-bancroft-estate-and-wickford-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Fraser Brown MacKenna",
    project_type: "affordable housing and community-space completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 3 Wickford Street E1 5QN location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocations, occupation, community-space programming, park management, and later estate maintenance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_agar_grove_1c_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/housing estate regeneration",
    title: "Agar Grove 1C was listed as built",
    summary:
      "New London Architecture records Agar Grove 1C in Camden as built, with a 2024 completion year.",
    observed_change:
      "A documented Agar Grove estate-regeneration housing phase was recorded as reaching built status.",
    area: "Agar Grove / Camden",
    latitude: 51.543423,
    longitude: -0.129883,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Agar Grove 1C",
    source_url: "https://nla.london/projects/agar-grove-1c-1",
    source_record_id: "nla-agar-grove-1c",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Mae Architects Ltd and Hawkins Brown Ltd",
    project_type: "housing estate-regeneration phase completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 27a Agar Grove NW1 9UG location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and gives completion at year precision. The event uses January 1 as a sortable year marker; exact completion date, resident moves, phasing, decant, tenure delivery, and later Passivhaus performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_former_nestle_factory_heritage_cluster_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/housing heritage",
    title: "Former Nestle Factory heritage cluster was listed as built",
    summary:
      "New London Architecture records the Former Nestle Factory heritage cluster in Hillingdon as built, with a 2024 completion year.",
    observed_change:
      "A documented Hayes factory-heritage housing cluster within the wider former Nestle Factory masterplan was recorded as reaching built status.",
    area: "Hayes / Hillingdon",
    latitude: 51.49953,
    longitude: -0.415715,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Former Nestle Factory",
    source_url: "https://nla.london/projects/former-nestle-factory",
    source_record_id: "nla-former-nestle-factory",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "dMFK Architects",
    project_type: "heritage housing cluster completion",
    geometry_source: "Approximate point placed at the former Nestle Factory/Hayes Village context from public Hayes postcode evidence; NLA gives borough but no street-location row.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and gives completion at year precision. The event uses January 1 as a sortable year marker; exact block handovers, occupied buildings, wider masterplan phases, public-space opening, commercial floorspace delivery, and later estate operation require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_steps_at_saratoga_developer_selection_2023",
    date: "2023-01-12",
    bucket: "planning/development/architecture/housing developer selection",
    title: "The Steps at Saratoga proposal was selected",
    summary:
      "NYC HPD announced on January 12, 2023 the selection of The Steps at Saratoga proposal for a Bedford-Stuyvesant affordable housing and wellness-focused development.",
    observed_change:
      "A documented HPD announcement selected a development proposal for a public-site affordable housing and community-wellness project.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.678790407475,
    longitude: -73.921283384215,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: The Steps at Saratoga developer selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/001-23/hpd-selects-plans-partners-238-unit-wellness-healing-focused-affordable-housing",
    source_record_id: "nyc-hpd-2023-01-12-steps-at-saratoga-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Marvel Architects",
    project_type: "affordable housing and wellness-focused developer selection",
    geometry_source: "US Census geocoder point for 1940 Fulton Street, used as an approximate Fulton-Saratoga site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records proposal selection only. It does not confirm land-use approval, financing, final design, construction start, housing lottery, food-coop operation, broadband installation, completion, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_542_dean_street_park_edge_developer_selection_2023",
    date: "2023-08-08",
    bucket: "planning/development/architecture/housing developer selection",
    title: "542 Dean Street Park Edge development team was selected",
    summary:
      "NYC HPD announced on August 8, 2023 that an M/WBE-led development team was selected to convert the 542 Dean Street parking lot into Park Edge senior affordable housing.",
    observed_change:
      "A documented HPD announcement selected a development team for a Prospect Heights public-site senior housing proposal.",
    area: "Prospect Heights / Brooklyn",
    latitude: 40.681028417335,
    longitude: -73.972244713517,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: 542 Dean Street Park Edge developer selection",
    source_url:
      "https://www.nyc.gov/site/hpd/news/021-24/hpd-selects-m-wbe-led-development-team-convert-parking-lot-housing-low-income-homeless",
    source_record_id: "nyc-hpd-2023-08-08-542-dean-street-park-edge-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "nArchitects",
    project_type: "senior affordable housing developer selection",
    geometry_source: "US Census geocoder point for 542 Dean Street, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm land-use approval, financing, final design, construction start, park-entry delivery, senior housing lottery, completion, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_stebbins_avenue_community_engagement_started_2023",
    date: "2023-05-17",
    bucket: "planning/development/architecture/public engagement",
    title: "Stebbins Avenue community engagement was announced",
    summary:
      "NYC HPD announced on May 17, 2023 that it was seeking community input for affordable housing and neighborhood amenities on the Stebbins Avenue city-owned site.",
    observed_change:
      "A documented HPD announcement opened predevelopment community engagement for a Crotona Park East public-site housing proposal.",
    area: "Crotona Park East / Bronx",
    latitude: 40.833144981831,
    longitude: -73.894089473487,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Stebbins Avenue community engagement",
    source_url:
      "https://www.nyc.gov/site/hpd/news/019-23/affordable-housing-coming-south-bronx-hpd-seeks-community-input-stebbins-ave-site",
    source_record_id: "nyc-hpd-2023-05-17-stebbins-avenue-community-engagement",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design and development team to be determined through later procurement steps",
    project_type: "public-site housing community engagement",
    geometry_source: "US Census geocoder point for 1388 Stebbins Avenue, used as an approximate marker for the site between East 170th Street and Jennings Street.",
    geometry_precision: "site approximate",
    limitations:
      "The event records community engagement launch only. It does not confirm an RFP release, team selection, public approvals, financing, construction start, final programme, completion, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_388_hudson_street_rfp_released_2025",
    date: "2025-02-14",
    bucket: "planning/development/architecture/housing rfp",
    title: "388 Hudson Street RFP was released",
    summary:
      "NYC HPD's 388 Hudson Street project page records the release of the RFP on February 14, 2025 for affordable housing and a public recreation-center replacement on the city-owned site.",
    observed_change:
      "A documented HPD project page recorded an open request milestone for a West Village public-site housing and recreation-center proposal.",
    area: "West Village / Manhattan",
    latitude: 40.728432558047,
    longitude: -74.007065412832,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD project page: 388 Hudson Street RFP",
    source_url: "https://www.nyc.gov/site/hpd/services-and-information/388-hudson-street-rfp.page",
    source_record_id: "nyc-hpd-2025-02-14-388-hudson-street-rfp-release",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD project-page RFP release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design and development team to be determined through the RFP process",
    project_type: "public-site housing and recreation-center RFP release",
    geometry_source: "US Census geocoder point for 388 Hudson Street, the address named in the HPD project page.",
    geometry_precision: "site approximate",
    limitations:
      "The event records RFP release only. It does not confirm team selection, design approval, public approvals, financing, construction start, recreation-center closure or replacement delivery, completion, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jersey_street_rfp_released_2023",
    date: "2023-11-03",
    bucket: "planning/development/architecture/housing rfp",
    title: "Jersey Street RFP was released",
    summary:
      "NYC HPD's Jersey Street project page records the release of the RFP on November 3, 2023 for the 539 Jersey Street public-site redevelopment process.",
    observed_change:
      "A documented HPD project page recorded an open request milestone for a Staten Island public-site housing and community-space proposal.",
    area: "North Shore / Staten Island",
    latitude: 40.63638030063,
    longitude: -74.08502874185,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD project page: Jersey Street RFP",
    source_url: "https://www.nyc.gov/site/hpd/services-and-information/jersey-street-rfp.page",
    source_record_id: "nyc-hpd-2023-11-03-jersey-street-rfp-release",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD project-page RFP release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design and development team to be determined through the RFP process",
    project_type: "public-site housing and community-space RFP release",
    geometry_source: "US Census geocoder point for 539 Jersey Street, the site named in the HPD project page.",
    geometry_precision: "site approximate",
    limitations:
      "The event records RFP release only. It does not confirm development-team selection, sanitation-site relocation, public approvals, financing, construction start, grocery opening, open-space delivery, completion, or resident move-in."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_lgbt_nhs_stained_glass_window_completion_2025",
    date: "2025-10-24",
    bucket: "planning/development/heritage building works completion",
    title: "City Hall LGBT and NHS stained-glass window completion was reported",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed completion of a City Hall stained-glass window celebrating Belfast's LGBTQ+ community, with the NHS window also part of the programme context.",
    observed_change:
      "A documented council physical-programme report recorded completion of a civic heritage-building stained-glass window project item.",
    area: "Belfast City Hall",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-city-hall-lgbt-nhs-stained-glass-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name stained-glass designers or contractors for this summary item",
    project_type: "civic heritage stained-glass works completion report",
    geometry_source: "Approximate point placed at Belfast City Hall from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records a summary completion item only. It does not provide exact installation date, individual window specifications, conservation method, contractor details, interpretation materials, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_mercy_primary_crumlin_road_playground_equipment_completion_2025",
    date: "2025-10-24",
    bucket: "planning/development/playground completion",
    title: "Mercy Primary Crumlin Road playground equipment was reported completed",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed the purchase and installation of new playground equipment at Mercy Primary, Crumlin Road as completed.",
    observed_change:
      "A documented council physical-programme report recorded completion of a school playground-equipment installation.",
    area: "Mercy Primary / Crumlin Road",
    latitude: 54.617,
    longitude: -5.942,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-mercy-primary-crumlin-road-playground-equipment-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this summary item",
    project_type: "school playground equipment completion report",
    geometry_source: "Approximate point placed near Mercy Primary/Crumlin Road from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records a summary completion item only. It does not specify equipment type, playground boundary, procurement route, installation date, inspection results, accessibility checks, final cost, or later maintenance condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_parklands_knocknagoney_dale_environmental_improvements_completion_2025",
    date: "2025-10-24",
    bucket: "planning/development/environmental improvements completion",
    title: "Parklands Knocknagoney Dale environmental improvements were reported completed",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed environmental improvements to Knocknagoney Park under Section 76 Agreement developer contributions as completed.",
    observed_change:
      "A documented council physical-programme report recorded completion of a park environmental-improvements project.",
    area: "Knocknagoney Park / Knocknagoney Dale",
    latitude: 54.615,
    longitude: -5.823,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-parklands-knocknagoney-dale-environmental-improvements-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name landscape designers or contractors for this summary item",
    project_type: "park environmental improvements completion report",
    geometry_source: "Approximate point placed near Knocknagoney Park from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records a summary completion item only. It does not specify improvement types, boundaries, Section 76 source agreement details, ecological effects, inspection date, final cost, or later maintenance condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_it_programme_ups_completion_2025",
    date: "2025-10-24",
    bucket: "planning/development/building systems completion",
    title: "Council IT Programme UPS project was reported completed",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed an IT Programme uninterruptible power supply project among completed enhancements to council assets.",
    observed_change:
      "A documented council physical-programme report recorded completion of a council-asset building-systems resilience project.",
    area: "Belfast council asset programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-it-programme-ups-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name building-services designers or contractors for this summary item",
    project_type: "council building-systems resilience completion report",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report summarizes a council asset programme without a site address.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records a summary completion item only. It does not identify the buildings served, UPS specifications, installation dates, resilience test results, procurement route, final cost, or later system performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_operator_tender_return_noted_2024",
    date: "2024-12-13",
    bucket: "planning/development/cycle infrastructure programme status",
    title: "Belfast Bikes new operator tender return was noted",
    summary:
      "Belfast City Council's December 13, 2024 Physical Programme Update noted a satisfactory tender return for a new Belfast Bikes operator and described capital-cost arrangements for the scheme.",
    observed_change:
      "A documented council physical-programme report recorded a procurement milestone for the city bike-share infrastructure programme.",
    area: "Belfast Bikes citywide network",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 13 December 2024",
    source_url: belfastPhysicalProgrammeDec2024,
    source_record_id: "bcc-physical-programme-2024-12-13-belfast-bikes-operator-tender-return",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Not applicable; bike-share operator procurement and capital-cost programme item",
    project_type: "citywide bike-share infrastructure procurement milestone",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report describes a citywide bike-share network and operator procurement.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records a tender-return and funding-arrangements milestone only. It does not confirm contract award, operator transition, docking-station changes, bike numbers, capital funding receipt, service launch, final cost, or later network operation."
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
