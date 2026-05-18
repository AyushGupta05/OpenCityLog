const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningMar2025 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=12040";
const belfastPlanningDec2025 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?MId=12340";
const belfastPlanningFeb2026 = "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?MId=12348";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_moderne_retrofit_completion_2022",
    date: "2022-09-01",
    bucket: "planning/development/architecture/residential retrofit",
    title: "The Moderne Retrofit was listed as built",
    summary:
      "New London Architecture records The Moderne Retrofit on Thurleigh Road in Lambeth as built, with estimated completion in September 2022.",
    observed_change:
      "A documented Lambeth residential retrofit project was recorded as reaching built status.",
    area: "Clapham / Lambeth",
    latitude: 51.451377,
    longitude: -0.1605565,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Moderne Retrofit",
    source_url: "https://nla.london/projects/the-moderne-retrofit",
    source_record_id: "nla-the-moderne-retrofit",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "YARD Architects",
    project_type: "residential retrofit completion",
    geometry_source:
      "Nominatim geocoder point for Thurleigh Road in Clapham, matching the location listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, household occupation, energy performance, later alterations, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_south_hampstead_high_school_performing_arts_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/school performing arts centre",
    title: "South Hampstead High School Performing Arts Centre was listed as built",
    summary:
      "New London Architecture records South Hampstead High School Performing Arts Centre at 5 Maresfield Gardens in Camden as built, with completion in 2020.",
    observed_change:
      "A documented Camden school performing-arts project was recorded as reaching built status.",
    area: "Belsize Park / Camden",
    latitude: 51.5464392,
    longitude: -0.1779674,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: South Hampstead High School Performing Arts Centre",
    source_url: "https://nla.london/projects/south-hampstead-high-school-performing-arts-centre",
    source_record_id: "nla-south-hampstead-high-school-performing-arts-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "NLA lists Broadway Malyan as the submitting practice for this project page.",
    project_type: "school performing-arts centre completion",
    geometry_source:
      "Nominatim geocoder point for 5 Maresfield Gardens, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion year. It does not confirm exact handover date, school programming, event use, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_lea_bridge_library_completion_2021",
    date: "2021-10-01",
    bucket: "planning/development/architecture/library",
    title: "Lea Bridge Library was listed as built",
    summary:
      "New London Architecture records Lea Bridge Library at 372a Lea Bridge Road in Waltham Forest as built, with estimated completion in October 2021.",
    observed_change:
      "A documented Waltham Forest library project was recorded as reaching built status.",
    area: "Leyton / Waltham Forest",
    latitude: 51.570795,
    longitude: -0.0239004,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Lea Bridge Library",
    source_url: "https://nla.london/projects/lea-bridge-library",
    source_record_id: "nla-lea-bridge-library",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Studio Weave",
    project_type: "library completion",
    geometry_source:
      "Nominatim geocoder point for Lea Bridge Road in the E10 7HU postcode area, matching the address listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public opening date, library service changes, usage, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_southwark_heritage_centre_walworth_library_completion_2021",
    date: "2021-04-01",
    bucket: "planning/development/architecture/library and heritage centre",
    title: "Southwark Heritage Centre and Walworth Library was listed as built",
    summary:
      "New London Architecture records Southwark Heritage Centre and Walworth Library at 143 Walworth Road as built, with completion in April 2021.",
    observed_change:
      "A documented Southwark library and heritage-centre project was recorded as reaching built status.",
    area: "Walworth / Southwark",
    latitude: 51.4912148,
    longitude: -0.097571,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Southwark Heritage Centre and Walworth Library",
    source_url: "https://nla.london/projects/southwark-heritage-centre-walworth-library",
    source_record_id: "nla-southwark-heritage-centre-walworth-library",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "AOC Architecture Ltd",
    project_type: "library and heritage centre completion",
    geometry_source:
      "Nominatim geocoder point for Walworth Road in the SE17 1FZ area, matching the address listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact public opening date, service changes, exhibition programming, later fit-out, or building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_christ_church_community_centre_completion_2022",
    date: "2022-04-01",
    bucket: "planning/development/architecture/community centre",
    title: "Christ Church Community Centre was listed as built",
    summary:
      "New London Architecture records Christ Church Community Centre on Highbury Grove in Islington as built, with completion in April 2022.",
    observed_change:
      "A documented Islington community-centre project was recorded as reaching built status.",
    area: "Highbury / Islington",
    latitude: 51.5469004,
    longitude: -0.0985125,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Christ Church Community Centre",
    source_url: "https://nla.london/projects/christ-church-community-centre",
    source_record_id: "nla-christ-church-community-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month and built-status field",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Matthew Lloyd Architects",
    project_type: "community centre completion",
    geometry_source:
      "Nominatim geocoder point for Highbury Grove, matching the location listed on the NLA project page.",
    geometry_precision: "street/site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact opening date, community programming, operator arrangements, later fit-out, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gateway_elton_phase2_completion_2016",
    date: "2016-01-27",
    bucket: "planning/development/architecture/affordable housing",
    title: "Gateway Elton Street Phase II completion was announced",
    summary:
      "NYC HDC announced on January 27, 2016 the completion of Gateway Elton Street Phase II, a mixed-use affordable housing development with buildings at 516 and 524 Vandalia Avenue and 526 Schroeders Avenue in Spring Creek.",
    observed_change:
      "A documented city and state housing-agency release recorded completion of a mixed-use affordable housing phase.",
    area: "Spring Creek / Brooklyn",
    latitude: 40.6552914,
    longitude: -73.8731435,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Gateway Elton Street Phase II completion",
    source_url:
      "https://www.nychdc.com/newsroom/elected-officials-city-and-state-agencies-partners-and-community-residents-celebrate",
    source_record_id: "nychdc-2016-01-27-gateway-elton-street-phase-ii",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "mixed-use affordable housing completion",
    geometry_source:
      "Midpoint of Nominatim geocoder points for 516 and 524 Vandalia Avenue and 526 Schroeders Avenue, matching the addresses listed in the HDC release.",
    geometry_precision: "address-cluster approximate",
    limitations:
      "The event records a completion announcement only. It does not independently verify full lease-up, supportive-service delivery, solar-system performance, retail occupancy, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bedford_green_house_groundbreaking_2017",
    date: "2017-11-16",
    bucket: "planning/development/architecture/supportive affordable housing construction start",
    title: "Bedford Green House groundbreaking was announced",
    summary:
      "NYC HDC announced on November 16, 2017 a groundbreaking milestone for Bedford Green House, a supportive and affordable housing development at 2865 Creston Avenue in the Bronx.",
    observed_change:
      "A documented public housing-finance announcement recorded the start of construction for a supportive and affordable housing building.",
    area: "Bedford Park / Bronx",
    latitude: 40.8692145,
    longitude: -73.8933925,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Bedford Green House groundbreaking",
    source_url:
      "https://www.nychdc.com/newsroom/federal-state-and-city-officials-join-project-renewal-break-ground-bronx-supportive-and",
    source_record_id: "nychdc-2017-11-16-bedford-green-house-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Edelman Sultan Knox Wood Architects",
    project_type: "supportive affordable housing construction start",
    geometry_source:
      "Nominatim geocoder point for Creston Avenue near the 2865 address listed in the HDC release.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm construction completion, occupancy, supportive-service delivery, LEED certification closeout, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_lambert_houses_phase1_completion_2019",
    date: "2019-11-22",
    bucket: "planning/development/architecture/affordable housing",
    title: "Lambert Houses first redevelopment phase was completed",
    summary:
      "NYC HDC announced on November 22, 2019 the completion and opening of the first residential building in the Lambert Houses redevelopment at 988 East 180th Street.",
    observed_change:
      "A documented city housing-finance announcement recorded completion of the first residential building in a redevelopment project.",
    area: "West Farms / Bronx",
    latitude: 40.8431102,
    longitude: -73.8795925,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Lambert Houses first phase completion",
    source_url:
      "https://www.nychdc.com/newsroom/city-joins-phipps-houses-celebrate-completion-first-phase-lambert-houses-redevelopment",
    source_record_id: "nychdc-2019-11-22-lambert-houses-first-phase",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "affordable housing redevelopment phase completion",
    geometry_source:
      "Nominatim geocoder point for 988 East 180th Street, matching the address listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records the first completed building only. It does not confirm completion of later Lambert Houses phases, full lease-up, tenant relocation outcomes, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_story_avenue_opening_2019",
    date: "2019-11-22",
    bucket: "planning/development/architecture/affordable housing",
    title: "Story Avenue affordable housing opening was announced",
    summary:
      "NYC HDC announced on November 22, 2019 a ribbon-cutting opening milestone for the Story Avenue affordable housing development at 1520 and 1530 Story Avenue in Soundview.",
    observed_change:
      "A documented city housing-finance announcement recorded opening of a mixed-use affordable housing development.",
    area: "Soundview / Bronx",
    latitude: 40.8209959,
    longitude: -73.878489,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Story Avenue opening",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-lm-development-partners-and-project-partners-open-story-avenue",
    source_record_id: "nychdc-2019-11-22-story-avenue-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Curtis+Ginsberg Architects",
    project_type: "mixed-use affordable housing opening",
    geometry_source:
      "Midpoint of Nominatim geocoder points for 1520 and 1530 Story Avenue, matching the addresses listed in the HDC release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, retail occupancy, affordability compliance, later operations, or building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_northeastern_towers_annex_ribbon_cutting_2021",
    date: "2021-07-21",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Northeastern Towers Annex ribbon cutting was announced",
    summary:
      "NYC HDC announced on July 21, 2021 a ribbon-cutting milestone for Northeastern Towers Annex, a 159-unit senior affordable housing development in Queens.",
    observed_change:
      "A documented city housing-finance announcement recorded a ribbon-cutting milestone for a senior affordable housing building.",
    area: "Rochdale / Queens",
    latitude: 40.6755694,
    longitude: -73.777996,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC release: Northeastern Towers Annex ribbon cutting",
    source_url:
      "https://www.nychdc.com/newsroom/city-officials-join-project-development-partners-ribbon-cutting-northeastern-towers-annex",
    source_record_id: "nychdc-2021-07-21-northeastern-towers-annex",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HDC release does not name the project architect on the cited page",
    project_type: "senior affordable housing ribbon cutting",
    geometry_source:
      "Nominatim geocoder point for 131-10 Guy R. Brewer Boulevard, matching the project-site address stated in NYC Planning environmental-review materials for Northeastern Towers Annex.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a ribbon-cutting announcement only. It does not independently verify full lease-up, project-based Section 8 administration, service delivery, later operations, or building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_scottish_provident_hotel_lbc_permission_2025",
    date: "2025-03-18",
    bucket: "planning/development/architecture/hotel listed-building consent",
    title: "Donegall Square South hotel development received planning permission and listed-building consent",
    summary:
      "Belfast City Council Planning Committee minutes for March 18, 2025 record planning permission and Listed Building Consent for converting 15-16 Donegall Square South, 2-14 Bedford Street and 7 James Street South to a 102-bedroom hotel with public bars and restaurants.",
    observed_change:
      "A documented planning-committee minute recorded a hotel conversion and listed-building-consent milestone for a prominent city-centre building group.",
    area: "Donegall Square South / Belfast city centre",
    latitude: 54.5955067,
    longitude: -5.9310529,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 March 2025",
    source_url: belfastPlanningMar2025,
    source_record_id: "bcc-planning-2025-03-18-la04-2024-1862-donegall-square-south-hotel",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and planning/listed-building-consent minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "hotel conversion planning permission and listed-building consent",
    geometry_source:
      "Nominatim geocoder point for 7 James Street South, one of the addresses listed in the Planning Committee minute.",
    geometry_precision: "site/address-cluster approximate",
    limitations:
      "The event records planning permission and listed-building consent only. It does not confirm condition discharge, construction start, completion, hotel opening, operator arrangements, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_the_edge_york_street_short_term_let_permission_2025",
    date: "2025-03-18",
    bucket: "planning/development/architecture/student accommodation temporary use",
    title: "The Edge York Street temporary short-term-let use was approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 18, 2025 record approval for temporary change of use of 92 student bedrooms at The Edge, 48-52 York Street, to short-term-let accommodation.",
    observed_change:
      "A documented planning-committee minute recorded a temporary use approval for part of an existing student accommodation building.",
    area: "York Street / Belfast city centre",
    latitude: 54.611681,
    longitude: -5.9233976,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 March 2025",
    source_url: belfastPlanningMar2025,
    source_record_id: "bcc-planning-2025-03-18-la04-2024-1869-the-edge-york-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and temporary-use approval minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "student accommodation temporary-use planning approval",
    geometry_source:
      "Nominatim geocoder point for York Street, used as an approximate marker for The Edge at 48-52 York Street listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records temporary change-of-use approval only. It does not confirm short-term-let operation, duration beyond the permission, student occupancy, building completion, or later management."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_university_street_wellington_park_listing_supported_2025",
    date: "2025-03-18",
    bucket: "planning/development/architecture/heritage listing",
    title: "University Street and Wellington Park proposed listings were supported",
    summary:
      "Belfast City Council Planning Committee minutes for March 18, 2025 record that the Committee noted and supported Historic Environment Division proposed listings for 119 University Street, 121 University Street and 21 Wellington Park.",
    observed_change:
      "A documented planning-committee minute recorded support for proposed heritage listing of three Belfast buildings.",
    area: "University Street / Wellington Park",
    latitude: 54.5861935,
    longitude: -5.9282063,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 18 March 2025",
    source_url: belfastPlanningMar2025,
    source_record_id: "bcc-planning-2025-03-18-university-street-wellington-park-listing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and proposed-listing minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name original designers in the cited agenda text",
    project_type: "heritage listing support",
    geometry_source:
      "Nominatim geocoder point for University Street, used as a representative marker for two of the three proposed listings noted in the Planning Committee minute.",
    geometry_precision: "representative street approximate",
    limitations:
      "The event records committee support for proposed listings only. It does not confirm final listing, statutory designation date, building condition, ownership, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_38_boucher_road_contamination_conditions_removed_2026",
    date: "2026-02-17",
    bucket: "planning/development/architecture/medical facility planning condition",
    title: "38 Boucher Road contamination conditions were removed",
    summary:
      "Belfast City Council Planning Committee minutes for February 17, 2026 record approval to remove Conditions 14 and 15 from permission LA04/2024/0714/F for Units 2a and 2b, 38 Boucher Road.",
    observed_change:
      "A documented planning-committee minute recorded a condition-removal milestone for a previously approved Boucher Road development.",
    area: "Boucher Road / Belfast",
    latitude: 54.5772491,
    longitude: -5.9623421,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 17 February 2026",
    source_url: belfastPlanningFeb2026,
    source_record_id: "bcc-planning-2026-02-17-la04-2025-2183-38-boucher-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and condition-removal minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "planning condition removal",
    geometry_source:
      "Nominatim geocoder point for 36-38 Boucher Road, matching the 38 Boucher Road site context listed in the Planning Committee minute.",
    geometry_precision: "site approximate",
    limitations:
      "The event records removal of contamination-related conditions only. It does not confirm construction start, completion, healthcare operation, remediation details beyond the committee minute, or later site condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lockhouse_wellbeing_centre_extension_approved_2025",
    date: "2025-12-09",
    bucket: "planning/development/architecture/community wellbeing centre",
    title: "The Lockhouse wellbeing centre and cafe extension was approved",
    summary:
      "Belfast City Council Planning Committee minutes for December 9, 2025 record approval for a new community wellbeing centre and cafe extension to the existing Lockhouse building at 13 River Terrace.",
    observed_change:
      "A documented planning-committee minute recorded approval of a community wellbeing centre and cafe extension at the Lockhouse.",
    area: "River Terrace / Lagan Towpath",
    latitude: 54.588961,
    longitude: -5.9212156,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 9 December 2025",
    source_url: belfastPlanningDec2025,
    source_record_id: "bcc-planning-2025-12-09-la04-2025-1454-lockhouse",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and approval minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "community wellbeing centre and cafe extension approval",
    geometry_source:
      "Nominatim geocoder point for River Terrace, used as an approximate marker for The Lockhouse at 13 River Terrace listed in the Planning Committee minute.",
    geometry_precision: "street/site approximate",
    limitations:
      "The event records planning approval only. It does not confirm condition discharge, construction start, completion, cafe operation, community programming, or later building condition."
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
