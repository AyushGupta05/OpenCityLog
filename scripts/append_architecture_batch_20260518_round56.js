const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const duplicateCleanupIds = new Set(["nyc_arch_logan_fountain_completion_2025"]);
const beforeCleanupCount = doc.events.length;
doc.events = doc.events.filter((event) => !duplicateCleanupIds.has(event.event_id));
const removedCount = beforeCleanupCount - doc.events.length;

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_blackhorse_mills_completion_2020",
    date: "2020-09-01",
    bucket: "planning/development/architecture/housing",
    title: "Blackhorse Mills was listed as built",
    summary:
      "New London Architecture records Blackhorse Mills in Waltham Forest as built, with estimated completion in September 2020.",
    observed_change:
      "A documented build-to-rent housing project on the former Ferry Lane Industrial Estate was recorded as reaching built status.",
    area: "Blackhorse Lane / Waltham Forest",
    latitude: 51.588035,
    longitude: -0.043891,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Blackhorse Mills",
    source_url: "https://nla.london/projects/blackhorse-mills",
    source_record_id: "nla-blackhorse-mills",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Assael Architecture",
    project_type: "build-to-rent housing completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 3 Green Ferry Way E17 6ZH location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, occupation, estate-management arrangements, affordability, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hackney_new_primary_school_333_kingsland_completion_2020",
    date: "2020-06-01",
    bucket: "planning/development/architecture/mixed use school housing",
    title: "Hackney New Primary School and 333 Kingsland Road were listed as built",
    summary:
      "New London Architecture records Hackney New Primary School and 333 Kingsland Road as a built Hackney mixed-use school, housing, and retail project with estimated completion in June 2020.",
    observed_change:
      "A documented combined primary-school, housing, and retail building at 333 Kingsland Road was recorded as reaching built status.",
    area: "Kingsland Road / Hackney",
    latitude: 51.539282,
    longitude: -0.07736,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hackney New Primary School and 333 Kingsland Road",
    source_url: "https://nla.london/projects/hackney-new-primary-school-333-kingsland-road",
    source_record_id: "nla-hackney-new-primary-school-333-kingsland-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Henley Halebrown",
    project_type: "school, housing, and retail mixed-use completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 333 Kingsland Road E8 4FD location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; school opening, housing occupation, retail trading, tenure compliance, and later building operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_peckham_place_completion_2021",
    date: "2021-01-01",
    bucket: "planning/development/architecture/housing mixed use",
    title: "Peckham Place was listed as built",
    summary:
      "New London Architecture records Peckham Place in Southwark as built, with completion in January 2021.",
    observed_change:
      "A documented residential-led mixed-use development at Queen's Road, Peckham was recorded as reaching built status.",
    area: "Queen's Road / Peckham",
    latitude: 51.473696,
    longitude: -0.057038,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Peckham Place",
    source_url: "https://nla.london/projects/peckham-place",
    source_record_id: "nla-peckham-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Jestico + Whiles",
    project_type: "residential-led mixed-use completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 151A Queen's Road SE15 2ND location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; individual phase handovers, resident occupation, tenure delivery, courtyard access, management, and later public-realm condition require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_new_barlby_kensington_queensmill_schools_completion_2021",
    date: "2021-09-01",
    bucket: "planning/development/architecture/schools",
    title: "New Barlby and Kensington Queensmill Schools were listed as built",
    summary:
      "New London Architecture records New Barlby and Kensington Queensmill Schools in Kensington and Chelsea as built, with estimated completion in September 2021.",
    observed_change:
      "A documented two-school building at 174 Barlby Road was recorded as reaching built status.",
    area: "Barlby Road / Kensington and Chelsea",
    latitude: 51.524324,
    longitude: -0.214811,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: New Barlby and Kensington Queensmill Schools",
    source_url: "https://nla.london/projects/new-barlby-kensington-queensmill-schools",
    source_record_id: "nla-new-barlby-kensington-queensmill-schools",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Penoyre & Prasad",
    project_type: "co-located schools completion",
    geometry_source: "Postcode point from postcodes.io for the NLA-stated 174 Barlby Road W10 5LN location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; school admissions, special-education service delivery, shared-facility operation, safeguarding arrangements, and later adaptations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bloom_clerkenwell_completion_2021",
    date: "2021-08-01",
    bucket: "planning/development/architecture/workplace",
    title: "Bloom Clerkenwell was listed as built",
    summary:
      "New London Architecture records Bloom Clerkenwell in Islington as built, with estimated completion in August 2021.",
    observed_change:
      "A documented office and retail building over the Farringdon West Crossrail station context was recorded as reaching built status.",
    area: "Cowcross Street / Farringdon",
    latitude: 51.519774,
    longitude: -0.105339,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bloom Clerkenwell",
    source_url: "https://nla.london/projects/bloom-clerkenwell",
    source_record_id: "nla-bloom-clerkenwell",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "John Robertson Architects",
    project_type: "over-station workplace completion",
    geometry_source: "Approximate point placed near the source-stated 50 Cowcross Street/Farringdon West location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenant fit-out, office occupation, retail opening, certification, and later building performance require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_rego_park_library_replacement_groundbreaking_2025",
    date: "2025-12-09",
    bucket: "planning/development/architecture/library groundbreaking",
    title: "Rego Park Library replacement broke ground",
    summary:
      "NYC DDC announced on December 9, 2025 that Queens Public Library and city officials held a groundbreaking for the Rego Park Library replacement at 91-41 63rd Drive.",
    observed_change:
      "A documented city announcement recorded the start of a public-library replacement project in Rego Park.",
    area: "Rego Park / Queens",
    latitude: 40.726896495357,
    longitude: -73.864507058465,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC DDC press release: Rego Park Library replacement groundbreaking",
    source_url: "https://www.nyc.gov/site/ddc/about/press-releases/2025/pr-120925-RegoParkLibrary.page",
    source_record_id: "nyc-ddc-2025-12-09-rego-park-library-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "WEISS/MANFREDI",
    project_type: "public library replacement groundbreaking",
    geometry_source: "US Census geocoder point for 91-41 63rd Drive, the site named in the DDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ceremonial groundbreaking and project-start milestone only. It does not confirm demolition completion, construction progress, final cost, LEED certification, library opening, art installation completion, or later branch operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_la_ostra_inwood_developer_selection_2025",
    date: "2025-12-10",
    bucket: "planning/development/architecture/housing developer selection",
    title: "La Ostra Inwood development team was selected",
    summary:
      "NYC HPD announced on December 10, 2025 that Slate Property Group, Xenolith Partners, and Comunilife Inc. were chosen for La Ostra, a proposal for affordable housing, community space, STEM education, and waterfront open space in Inwood.",
    observed_change:
      "A documented HPD announcement selected a development team for a public-site housing and community-space project in Inwood.",
    area: "Inwood / Manhattan",
    latitude: 40.871056769537,
    longitude: -73.911580965439,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: La Ostra Inwood developer selection",
    source_url: "https://www.nyc.gov/site/hpd/news/084-25/vacant-site-become-housing-community-space-science-hub-inwood",
    source_record_id: "nyc-hpd-2025-12-10-la-ostra-inwood-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Development team selected; final design-team scope requires later project evidence",
    project_type: "affordable housing and waterfront community-space developer selection",
    geometry_source: "US Census geocoder point for 4095 9th Avenue, used as the approximate Inwood site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records development-team selection only. It does not confirm land-use approval, financing, final design, construction start, unit counts at closing, open-space delivery, science-center operation, housing lottery, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_351_powers_avenue_elurp_review_started_2026",
    date: "2026-02-20",
    bucket: "planning/development/architecture/land use review",
    title: "351 Powers Avenue ELURP review began",
    summary:
      "NYC HPD announced on February 20, 2026 that the city launched its first Expedited Land Use Review Procedure for 351 Powers Avenue, a city-owned land disposition expected to support approximately 84 affordable homes.",
    observed_change:
      "A documented city announcement opened an expedited land-use review path for a Bronx public-site affordable-housing proposal.",
    area: "Mott Haven / Bronx",
    latitude: 40.808710833864,
    longitude: -73.911842994297,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: first ELURP review for 351 Powers Avenue",
    source_url:
      "https://www.nyc.gov/site/hpd/news/011-26/mamdani-administration-begins-first-ever-expedited-review-affordable-housing-resiliency",
    source_record_id: "nyc-hpd-2026-02-20-351-powers-avenue-elurp-review",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Design and development team details require later land-use or project records",
    project_type: "affordable housing expedited land-use review start",
    geometry_source: "US Census geocoder point for 351 Powers Avenue, the address named in the HPD release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records the start of a review procedure only. It does not confirm approval, disposition closing, final design, financing, construction start, unit delivery, community-facility operation, or resident move-in."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_plus_one_adu_tools_program_reopened_2026",
    date: "2026-03-18",
    bucket: "planning/development/architecture/housing program",
    title: "ADU for You tools and Plus One ADU reopening were announced",
    summary:
      "NYC HPD and DOB announced on March 18, 2026 a new ADU for You toolkit and the reopening of the Plus One ADU program for homeowners planning ancillary dwelling units.",
    observed_change:
      "A documented city announcement recorded new citywide tools and financing support for ancillary dwelling unit planning and construction.",
    area: "New York City citywide",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: ADU for You and Plus One ADU tools",
    source_url:
      "https://www.nyc.gov/site/hpd/news/017-26/housing-preservation-development-the-department-buildings-launch-new-tools-help-turn",
    source_record_id: "nyc-hpd-2026-03-18-adu-for-you-plus-one-reopening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Not applicable; citywide homeowner ADU program and pre-approved plan toolkit",
    project_type: "citywide ancillary dwelling unit program/toolkit announcement",
    geometry_source: "Programme-approximate point placed at New York City Hall because the source describes a five-borough housing program rather than one site.",
    geometry_precision: "programme approximate",
    limitations:
      "The event records a citywide program and toolkit announcement only. It does not confirm individual ADU permits, construction starts, completed units, inspections, financing approvals, neighborhood distribution, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_local_law_151_radiator_inspections_enforcement_2026",
    date: "2026-05-08",
    bucket: "planning/development/building safety enforcement",
    title: "Local Law 151 steam-radiator inspection enforcement was announced",
    summary:
      "NYC HPD announced on May 8, 2026 that it would begin enforcement of Local Law 151 requirements for steam-radiator inspection records in covered residential buildings.",
    observed_change:
      "A documented HPD announcement recorded a citywide building-safety enforcement milestone for steam-heated residential buildings.",
    area: "New York City citywide",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Local Law 151 steam radiator inspections",
    source_url:
      "https://www.nyc.gov/site/hpd/news/034-26/hpd-begins-enforcement-local-law-151-requiring-annual-steam-radiator-inspections-buildings",
    source_record_id: "nyc-hpd-2026-05-08-local-law-151-radiator-inspections",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Not applicable; citywide building-safety inspection requirement",
    project_type: "citywide residential building-systems safety enforcement",
    geometry_source: "Programme-approximate point placed at New York City Hall because the source describes a citywide building-safety requirement.",
    geometry_precision: "programme approximate",
    limitations:
      "The event records enforcement announcement only. It does not identify affected buildings, completed inspections, violations, repairs, accident outcomes, owner compliance, or later enforcement totals."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_j51r_rehab_tax_abatement_applications_opened_2025",
    date: "2025-02-12",
    bucket: "planning/development/building rehabilitation program",
    title: "J-51 R rehabilitation tax-abatement applications opened",
    summary:
      "NYC HPD announced on February 12, 2025 that application materials were available for the reformed J-51 R program supporting eligible building rehabilitation and energy-upgrade work.",
    observed_change:
      "A documented HPD announcement opened a citywide application pathway for building rehabilitation tax-abatement support.",
    area: "New York City citywide",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: J-51 R rehabilitation tax abatement relaunch",
    source_url:
      "https://www.nyc.gov/site/hpd/news/007-25/nyc-relaunches-j-51-new-tax-breaks-fix-aging-buildings-keep-rents-low",
    source_record_id: "nyc-hpd-2025-02-12-j51r-rehab-tax-abatement-applications",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Not applicable; citywide building rehabilitation tax-abatement program",
    project_type: "citywide building rehabilitation program application opening",
    geometry_source: "Programme-approximate point placed at New York City Hall because the source describes a citywide rehabilitation incentive rather than one site.",
    geometry_precision: "programme approximate",
    limitations:
      "The event records application-material availability only. It does not confirm individual building eligibility, approved abatements, construction starts, completed repairs, energy performance, rent-regulation compliance, or later program outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_st_georges_market_new_stalls_in_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/market capital project status",
    title: "St George's Market new stalls project was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed St George's Market - New Stalls among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a market-stall capital project as being in development.",
    area: "St George's Market / Belfast city centre",
    latitude: 54.5968,
    longitude: -5.9244,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-st-georges-market-new-stalls-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name stall designers or contractors for this summary item",
    project_type: "market-stall capital project development status",
    geometry_source: "Approximate point placed at St George's Market from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm procurement, final design, stall numbers, installation date, completion, trader allocation, final cost, or later market operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waterfront_hall_chiller_units_in_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/building systems capital project status",
    title: "Waterfront Hall chiller-units project was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Waterfront Hall - Chiller Units among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a venue building-systems capital project as being in development.",
    area: "Waterfront Hall / Belfast city centre",
    latitude: 54.596,
    longitude: -5.916,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-waterfront-hall-chiller-units-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name building-services designers or contractors for this summary item",
    project_type: "venue building-systems capital project development status",
    geometry_source: "Approximate point placed at Waterfront Hall from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm design, procurement, installation, commissioning, energy performance, event-disruption management, final cost, or later equipment condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dunbar_link_cleansing_depot_relocation_in_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/council facility relocation status",
    title: "Dunbar Link Cleansing Depot relocation was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Relocation of Dunbar Link Cleansing Depot among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a cleansing-depot relocation project as being in development.",
    area: "Dunbar Link / Belfast",
    latitude: 54.603,
    longitude: -5.923,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-dunbar-link-cleansing-depot-relocation-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this summary item",
    project_type: "council cleansing depot relocation development status",
    geometry_source: "Approximate point placed near Dunbar Link from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm the receiving site, design, planning approvals, staff relocation, depot opening, operational changes, final cost, or later land-use change at the former depot."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_new_cemetery_in_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/cemetery capital project status",
    title: "New Cemetery project was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed New Cemetery among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a new cemetery capital project as being in development.",
    area: "Belfast citywide cemetery programme",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-new-cemetery-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name cemetery designers or contractors for this summary item",
    project_type: "cemetery capital project development status",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report names a new cemetery programme item without a site address or mapped boundary.",
    geometry_precision: "programme approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm site selection, land acquisition, planning approval, design, ecological assessment, construction start, burial availability, opening date, final cost, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_glencairn_ligoniel_greenway_in_development_2025",
    date: "2025-10-24",
    bucket: "planning/development/greenway capital project status",
    title: "Glencairn Park and Ligoniel Park Greenway was reported in development",
    summary:
      "Belfast City Council's October 24, 2025 Physical Programme Update listed Glencairn Park/Ligoniel Park Greenway among capital programme projects in development.",
    observed_change:
      "A documented council physical-programme report recorded a park greenway capital project as being in development.",
    area: "Glencairn Park / Ligoniel Park",
    latitude: 54.638,
    longitude: -5.985,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-24-glencairn-ligoniel-greenway-development",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name landscape designers or contractors for this summary item",
    project_type: "park greenway capital project development status",
    geometry_source: "Approximate point placed between Glencairn Park and Ligoniel Park from the named council project context.",
    geometry_precision: "site approximate",
    limitations:
      "The report records development-pipeline status only. It does not confirm route alignment, land permissions, design, procurement, construction start, path opening, accessibility checks, final cost, or later maintenance condition."
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
console.log(`Removed ${removedCount} duplicate cleanup records from ${path}`);
console.log(`Appended ${records.length} records to ${path}`);
