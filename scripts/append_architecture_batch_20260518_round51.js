const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastContractsAwardedDec2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s119683/Appendix%203%20-%20Contracts%20Awarded%20to%20Dec24.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_ferrum_completion_2019",
    date: "2019-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Ferrum was listed as built",
    summary:
      "New London Architecture records Ferrum in Brent as built, with completion recorded for 2019.",
    observed_change:
      "A documented Wembley residential project was recorded as reaching built status.",
    area: "Wembley / Brent",
    latitude: 51.5547215,
    longitude: -0.2813017,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Ferrum",
    source_url: "https://nla.london/projects/ferrum",
    source_record_id: "nla-ferrum",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "JTP masterplan; project page lists developer Quintain and contractor McAleer & Rushe",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at South Way, Wembley from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; exact completion day, occupation, tenure, sales, management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_dept_w_completion_2018",
    date: "2018-12-01",
    bucket: "planning/development/architecture/commercial",
    title: "Dept W was listed as built",
    summary:
      "New London Architecture records Dept W in Tower Hamlets as built, with estimated completion in December 2018.",
    observed_change:
      "A documented Whitechapel commercial project was recorded as reaching built status.",
    area: "Whitechapel / Tower Hamlets",
    latitude: 51.5199905,
    longitude: -0.0558972,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dept W",
    source_url: "https://nla.london/projects/dept-w",
    source_record_id: "nla-dept-w",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "BuckleyGrayYeoman",
    project_type: "commercial building completion",
    geometry_source: "Approximate point placed on Whitechapel Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; leasing, occupation, ownership, fit-out, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_viewpoint_98_york_road_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/residential",
    title: "Viewpoint, 98 York Road was listed as built",
    summary:
      "New London Architecture records Viewpoint, 98 York Road in Wandsworth as built, with estimated completion in June 2019.",
    observed_change:
      "A documented York Road residential project was recorded as reaching built status.",
    area: "York Road / Wandsworth",
    latitude: 51.4679402,
    longitude: -0.1778888,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Viewpoint, 98 York Road",
    source_url: "https://nla.london/projects/viewpoint-98-york-road",
    source_record_id: "nla-viewpoint-98-york-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "KSS Group",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 98 York Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure, sales, management, and later building operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_deans_mews_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/residential",
    title: "Deans' Mews was listed as built",
    summary:
      "New London Architecture records Deans' Mews in Westminster as built, with estimated completion in July 2019.",
    observed_change:
      "A documented Marylebone mews project was recorded as reaching built status.",
    area: "Marylebone / Westminster",
    latitude: 51.5170515,
    longitude: -0.1452583,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Deans' Mews",
    source_url: "https://nla.london/projects/deans-mews",
    source_record_id: "nla-deans-mews",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "ADAM Architecture",
    project_type: "mews residential completion",
    geometry_source: "Approximate point placed on Dean's Mews from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; exact completion day, occupation, sales, tenure, and later alterations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_union_wharf_greenwich_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/residential",
    title: "Union Wharf, Greenwich was listed as built",
    summary:
      "New London Architecture records Union Wharf, Greenwich as built, with completion in May 2019.",
    observed_change:
      "A documented Laban Walk residential project was recorded as reaching built status.",
    area: "Greenwich",
    latitude: 51.480998,
    longitude: -0.0182632,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Union Wharf, Greenwich",
    source_url: "https://nla.london/projects/union-wharf-greenwich",
    source_record_id: "nla-union-wharf-greenwich",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Assael Architecture and HTA Design",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 3 Laban Walk from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, tenure, rent levels, management, and later building operations require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_weeksville_hunterfly_houses_restoration_groundbreaking_2024",
    date: "2024-10-03",
    bucket: "planning/development/architecture/heritage restoration",
    title: "Weeksville Hunterfly Road Houses restoration project broke ground",
    summary:
      "NYC Department of Design and Construction announced the start of a restoration project for the historic Hunterfly Road Houses at Weeksville Heritage Center on October 3, 2024.",
    observed_change:
      "A documented DDC/DCLA announcement recorded the start of restoration work for landmark houses at Weeksville Heritage Center.",
    area: "Weeksville / Brooklyn",
    latitude: 40.6742273,
    longitude: -73.9252335,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC DDC press release: Weeksville Hunterfly Road Houses restoration",
    source_url: "https://www.nyc.gov/site/ddc/about/press-releases/2024/pr-100324-Weeksville.page",
    source_record_id: "nyc-ddc-2024-10-03-weeksville-hunterfly-road-houses-restoration-start",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC DDC/DCLA restoration project; detailed preservation design team requires separate project records",
    project_type: "heritage restoration groundbreaking",
    geometry_source: "Approximate point placed at Weeksville Heritage Center from the DDC press-release project location.",
    geometry_precision: "site approximate",
    limitations:
      "The event records start of restoration work only. It does not confirm restoration completion, conservation findings, final scope, public reopening, interpretation changes, final cost, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_logan_fountain_housing_completion_2025",
    date: "2025-05-13",
    bucket: "planning/development/architecture/housing completion",
    title: "Logan Fountain housing development was announced complete",
    summary:
      "The NYC Mayor's Office announced completion of Logan Fountain, a mixed-use affordable, supportive, and transitional housing development in Cypress Hills, on May 13, 2025.",
    observed_change:
      "A documented mayoral announcement recorded completion of a mixed-use housing development in Cypress Hills.",
    area: "Cypress Hills / Brooklyn",
    latitude: 40.6797066,
    longitude: -73.8772289,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Logan Fountain completion",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/306-25/mayor-adams-governor-hochul-completion-mixed-use-affordable-supportive-housing",
    source_record_id: "nyc-mayor-2025-05-13-logan-fountain-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "City-state housing project; project design team requires separate project records",
    project_type: "affordable and supportive housing completion",
    geometry_source: "Approximate point placed on Logan Street in Cypress Hills from project-name and neighborhood context.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a public completion announcement only. It does not confirm every unit lease-up, resident move-in, supportive-service operations, retail occupancy, affordability compliance, or later building management."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_yp_senior_residence_completion_2025",
    date: "2025-06-03",
    bucket: "planning/development/architecture/senior housing completion",
    title: "YP Senior Residence was announced complete",
    summary:
      "The NYC Mayor's Office announced completion of YP Senior Residence, a 117-unit affordable senior housing development in Morris Heights, on June 3, 2025.",
    observed_change:
      "A documented mayoral announcement recorded completion of an affordable senior housing development in Morris Heights.",
    area: "Morris Heights / Bronx",
    latitude: 40.8523,
    longitude: -73.903,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: YP Senior Residence completion",
    source_url:
      "https://www.nyc.gov/office-of-the-mayor/news/381-25/mayor-adams-governor-hochul-completion-117-unit-senior-housing-development-the-bronx",
    source_record_id: "nyc-mayor-2025-06-03-yp-senior-residence-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayoral press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Affordable senior housing project; design team requires separate project records",
    project_type: "senior housing completion",
    geometry_source: "Neighborhood-approximate point placed in Morris Heights because the cited mayoral release identifies the neighborhood but not a surveyed parcel in the extracted text.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records a public completion announcement only. It does not confirm every unit lease-up, resident move-in, supportive-service delivery, affordability compliance, long-term operations, or later building management."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bed_stuy_north_central_phase1_completion_2025",
    date: "2025-08-29",
    bucket: "planning/development/architecture/housing completion",
    title: "Bedford-Stuyvesant North and Central Phase I was announced complete",
    summary:
      "NYC Housing Preservation and Development announced completion of Phase I of the Bedford-Stuyvesant North and Central development on August 29, 2025, describing 31 affordable homes across 11 lots.",
    observed_change:
      "A documented HPD announcement recorded completion of a scattered-site affordable housing phase in Bedford-Stuyvesant.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.687,
    longitude: -73.944,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD press release: Bedford-Stuyvesant North and Central Phase I completion",
    source_url: "https://www.nyc.gov/site/hpd/news/059-25/nyc-housing-preservation-development-shelter-rock-builders-community-preservation",
    source_record_id: "nyc-hpd-2025-08-29-bed-stuy-north-central-phase-1-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Shelter Rock Builders and partners; design teams and individual lot architects require separate project records",
    project_type: "affordable housing completion",
    geometry_source: "Neighborhood-approximate point placed in Bedford-Stuyvesant because the HPD release describes 11 lots rather than one mapped parcel.",
    geometry_precision: "multi-site approximate",
    limitations:
      "The event records a public completion announcement for Phase I only. It does not map every lot, confirm every sale or rental lease-up, document individual building permits, affordability compliance, future phases, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_city_island_drinking_water_connection_completion_2022",
    date: "2022-07-20",
    bucket: "planning/development/utilities completion",
    title: "City Island drinking-water connection was announced complete",
    summary:
      "NYC Department of Design and Construction announced completion of a drinking-water connection upgrade for City Island on July 20, 2022, including two new subaqueous water mains under Eastchester Bay.",
    observed_change:
      "A documented DDC/DEP announcement recorded completion of new water-main infrastructure serving City Island.",
    area: "City Island / Bronx",
    latitude: 40.847,
    longitude: -73.786,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC DDC press release: City Island drinking-water connection completion",
    source_url: "https://www.nyc.gov/site/ddc/about/press-releases/2022/pr-072022-CityIsland.page",
    source_record_id: "nyc-ddc-2022-07-20-city-island-drinking-water-connection-completion",
    source_retrieved_at: retrievedAt,
    source_date_field: "DDC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC DEP/DDC utility infrastructure project; engineering team requires separate project records",
    project_type: "water infrastructure completion",
    geometry_source: "Representative point placed at City Island/Eastchester Bay because the DDC release describes subaqueous water mains rather than a single building parcel.",
    geometry_precision: "representative point",
    limitations:
      "The event records completion announcement for utility infrastructure only. It does not map the full water-main alignment, provide as-built engineering drawings, quantify service reliability outcomes, list later repairs, or describe building-level connections."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_planning_viability_qs_reviews_contract_awarded_2024",
    date: "2024-10-07",
    bucket: "planning/development/planning consultancy contract award",
    title: "Planning-viability quantity-surveying reviews contract was awarded",
    summary:
      "Belfast City Council's October-December 2024 contracts-awarded appendix listed a contract for independent quantity-surveying reviews of planning viability appraisals, awarded to Naylor & Devlin on October 7, 2024.",
    observed_change:
      "A documented council contracts appendix recorded award of a planning-viability review services contract.",
    area: "Belfast citywide planning viability reviews",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to December 2024",
    source_url: belfastContractsAwardedDec2024Pdf,
    source_record_id: "bcc-contracts-awarded-2024-q4-planning-viability-qs-reviews",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Naylor & Devlin was listed as supplier; individual planning applications are not named in the appendix",
    project_type: "planning viability consultancy contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes citywide planning-review services.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not identify individual planning applications, review findings, viability conclusions, planning decisions, development outcomes, costs, or later implementation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_act_initiative_interpretive_fitout_contract_awarded_2024",
    date: "2024-10-10",
    bucket: "planning/development/community fit-out contract award",
    title: "ACT Initiative interpretive fit-out contract was awarded",
    summary:
      "Belfast City Council's October-December 2024 contracts-awarded appendix listed NRF_ACT Initiative interpretive fit-out design and installation, awarded to Redhead Conference & Exhibition Ltd on October 10, 2024.",
    observed_change:
      "A documented council contracts appendix recorded award of a design-and-installation contract for an ACT Initiative interpretive fit-out.",
    area: "ACT Initiative / Belfast",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to December 2024",
    source_url: belfastContractsAwardedDec2024Pdf,
    source_record_id: "bcc-contracts-awarded-2024-q4-act-initiative-interpretive-fitout",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Redhead Conference & Exhibition Ltd was listed as supplier; site address and design team are not named in the appendix",
    project_type: "community interpretive fit-out contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix does not provide an address for the ACT Initiative fit-out.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not provide site address, final interpretive scope, installation date, completion, opening arrangements, final cost, or later operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dundela_fc_replacement_pitch_consultant_contract_awarded_2024",
    date: "2024-10-17",
    bucket: "planning/development/sports facility consultancy contract award",
    title: "Dundela FC replacement-pitch consultant-team contract was awarded",
    summary:
      "Belfast City Council's October-December 2024 contracts-awarded appendix listed an integrated consultant team for Dundela FC Community replacement pitch, awarded to Michael Herron Architects on October 17, 2024.",
    observed_change:
      "A documented council contracts appendix recorded award of a consultant-team contract for a community replacement-pitch project at Dundela FC.",
    area: "Dundela FC / East Belfast",
    latitude: 54.5993606,
    longitude: -5.8750067,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to December 2024",
    source_url: belfastContractsAwardedDec2024Pdf,
    source_record_id: "bcc-contracts-awarded-2024-q4-dundela-fc-replacement-pitch-consultant-team",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Michael Herron Architects was listed as supplier",
    project_type: "sports facility consultancy contract award",
    geometry_source: "Approximate point placed in the Dundela FC context from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records consultant-team contract award only. It does not confirm design approval, planning consent, pitch specification, construction start, completion, final cost, or later usage."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_council_properties_pat_testing_contract_awarded_2024",
    date: "2024-11-11",
    bucket: "planning/development/civic asset contract award",
    title: "Council-properties PAT-testing contract was awarded",
    summary:
      "Belfast City Council's October-December 2024 contracts-awarded appendix listed a term contract for PAT testing at all council properties, awarded to ICSS Ltd on November 11, 2024.",
    observed_change:
      "A documented council contracts appendix recorded award of an electrical testing contract across council properties.",
    area: "Belfast City Council properties",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to December 2024",
    source_url: belfastContractsAwardedDec2024Pdf,
    source_record_id: "bcc-contracts-awarded-2024-q4-pat-testing-council-properties",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "ICSS Ltd was listed as supplier; individual sites are not named in the appendix",
    project_type: "civic asset testing contract award",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the appendix describes all council properties.",
    geometry_precision: "programme approximate",
    limitations:
      "The appendix records contract award only. It does not list each property, equipment schedule, test results, remedial works, completion dates, final cost, or later compliance status."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_strand_arts_centre_main_contractor_awarded_2024",
    date: "2024-11-22",
    bucket: "planning/development/arts facility contract award",
    title: "Strand Arts Centre main-contractor contract was awarded",
    summary:
      "Belfast City Council's October-December 2024 contracts-awarded appendix listed main contractor for Strand Arts Centre, awarded to Martin & Hamilton on November 22, 2024.",
    observed_change:
      "A documented council contracts appendix recorded award of a main-contractor contract for Strand Arts Centre.",
    area: "Strand Arts Centre / East Belfast",
    latitude: 54.601,
    longitude: -5.876,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Appendix 3: Contracts Awarded to December 2024",
    source_url: belfastContractsAwardedDec2024Pdf,
    source_record_id: "bcc-contracts-awarded-2024-q4-strand-arts-centre-main-contractor",
    source_retrieved_at: retrievedAt,
    source_date_field: "Contract award date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Martin & Hamilton was listed as supplier; design team and conservation specialists require separate project records",
    project_type: "arts facility main-contractor award",
    geometry_source: "Approximate point placed at Strand Arts Centre in East Belfast from the named appendix project.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix records main-contractor award only. It does not confirm construction start, conservation scope, completion, reopening, final cost, grant conditions, or later operations."
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
