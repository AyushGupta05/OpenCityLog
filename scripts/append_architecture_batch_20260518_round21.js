const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=87109";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_stonecutter_completion_2025",
    date: "2025-06-01",
    bucket: "planning/development/architecture/office redevelopment",
    title: "Stonecutter was listed as built",
    summary:
      "New London Architecture records Stonecutter at 1 Stonecutter Street as a built City of London redevelopment, with estimated completion in June 2025.",
    observed_change:
      "A documented office redevelopment on Stonecutter Street was recorded as reaching built status.",
    area: "Stonecutter Street / City of London",
    latitude: 51.5157,
    longitude: -0.1056,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Stonecutter",
    source_url: "https://nla.london/projects/stonecutter",
    source_record_id: "nla-stonecutter",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "TP Bennett and Stonecutter project team",
    project_type: "office redevelopment",
    geometry_source: "Approximate point geocoded from NLA-stated 1 Stonecutter Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; tenant occupation, public-realm operation, sustainability performance, and long-term building use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_eades_walthamstow_completion_2025",
    date: "2025-09-01",
    bucket: "planning/development/architecture/build-to-rent housing",
    title: "The Eades Walthamstow was listed as built",
    summary:
      "New London Architecture records The Eades, Walthamstow, as a built regeneration project associated with Walthamstow Mall, delivering 495 build-to-rent homes, with estimated completion in September 2025.",
    observed_change:
      "A documented residential-led regeneration project at Walthamstow Mall was recorded as reaching built status.",
    area: "Selborne Road / Walthamstow Mall",
    latitude: 51.5827,
    longitude: -0.0231,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Eades, Walthamstow",
    source_url: "https://nla.london/projects/the-eades-walthamstow",
    source_record_id: "nla-the-eades-walthamstow",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Walthamstow Mall regeneration project team; architect not named on the NLA project page",
    project_type: "build-to-rent residential-led regeneration",
    geometry_source: "Approximate point geocoded from NLA-stated Selborne Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, affordability, mall phasing, public-space management, and wider regeneration outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ebbisham_drive_ashmole_estate_completion_2025",
    date: "2025-11-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Ebbisham Drive Ashmole Estate was listed as built",
    summary:
      "New London Architecture records Ebbisham Drive, Ashmole Estate, as a built Lambeth project transforming a former garage site into 15 affordable rented homes, with estimated completion in November 2025.",
    observed_change:
      "A documented Lambeth garage-site housing project was recorded as reaching built status.",
    area: "Ebbisham Drive / Ashmole Estate",
    latitude: 51.4836,
    longitude: -0.1188,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Ebbisham Drive, Ashmole Estate",
    source_url: "https://nla.london/projects/ebbisham-drive-ashmole-estate",
    source_record_id: "nla-ebbisham-drive-ashmole-estate",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Fraser Brown MacKenna and Ebbisham Drive project team",
    project_type: "affordable rented housing on former garage site",
    geometry_source: "Approximate point geocoded from NLA-stated Ebbisham Drive location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; allocation, occupation, estate management, and detailed accessibility outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_20_24_carlton_house_terrace_completion_2025",
    date: "2025-07-01",
    bucket: "planning/development/architecture/office refurbishment",
    title: "20-24 Carlton House Terrace was listed as built",
    summary:
      "New London Architecture records 20-24 Carlton House Terrace as a built Westminster cut-and-carve refurbishment of a 1960s office building, with estimated completion in July 2025.",
    observed_change:
      "A documented Carlton House Terrace office refurbishment was recorded as reaching built status.",
    area: "Carlton House Terrace / St James's",
    latitude: 51.5064,
    longitude: -0.1318,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 20-24 Carlton House Terrace",
    source_url: "https://nla.london/projects/20-24-carlton-house-terrace",
    source_record_id: "nla-20-24-carlton-house-terrace",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects and 20-24 Carlton House Terrace project team",
    project_type: "office refurbishment and cut-and-carve retrofit",
    geometry_source: "Approximate point geocoded from NLA-stated Carlton House Terrace location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; lease-up, heritage approvals, embodied-carbon performance, and occupancy patterns require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hayes_village_completion_2025",
    date: "2025-08-01",
    bucket: "planning/development/architecture/residential regeneration",
    title: "Hayes Village was listed as built",
    summary:
      "New London Architecture records Hayes Village on the former Nestle site as a built Hillingdon residential-led redevelopment with restored facades and new green spaces, with estimated completion in August 2025.",
    observed_change:
      "A documented residential-led redevelopment of the former Nestle site was recorded as reaching built status.",
    area: "Nestles Avenue / Hayes",
    latitude: 51.5021,
    longitude: -0.4213,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hayes Village",
    source_url: "https://nla.london/projects/hayes-village",
    source_record_id: "nla-hayes-village",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Chapman Taylor and Hayes Village project team",
    project_type: "former industrial site residential-led regeneration",
    geometry_source: "Approximate point geocoded from NLA-stated Nestles Avenue location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; phased occupation, final housing mix, heritage-facade condition, public-space access, and transport outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_46_nelson_street_mih_text_adopted_2026",
    date: "2026-05-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "46 Nelson Street II zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 46 Nelson Street II, N 250095 ZRK, with an adopted date of May 14, 2026, amending Appendix F for Brooklyn Community District 6 Mandatory Inclusionary Housing area 7.",
    observed_change:
      "A documented zoning text milestone was recorded for the 46 Nelson Street II area in Brooklyn.",
    area: "46 Nelson Street / Red Hook",
    latitude: 40.6783,
    longitude: -74.005,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 46 Nelson Street II",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/46-nelson-street-ii-n-250095-zrk",
    source_record_id: "nyc-zr-46-nelson-street-ii-n-250095-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or neighborhood outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_9201_4th_avenue_mih_text_adopted_2026",
    date: "2026-05-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "9201 4th Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 9201 4th Ave, N 260049 ZRK, with an adopted date of May 14, 2026, amending Appendix F for Brooklyn Community District 10 Mandatory Inclusionary Housing area 3.",
    observed_change:
      "A documented zoning text milestone was recorded for the 9201 4th Avenue area in Brooklyn.",
    area: "9201 4th Avenue / Bay Ridge",
    latitude: 40.6181,
    longitude: -74.03,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 9201 4th Ave",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/9201-4th-ave-n-260049-zrk",
    source_record_id: "nyc-zr-9201-4th-ave-n-260049-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later building design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_37_59_hamilton_avenue_zoning_adopted_2026",
    date: "2026-04-16",
    bucket: "planning/development/zoning/special district",
    title: "37-59 Hamilton Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 37-59 Hamilton Avenue, N 250320 ZRR, with an adopted date of April 16, 2026, amending Special St. George District maps and Appendix F for Staten Island Community District 1.",
    observed_change:
      "A documented zoning text milestone was recorded for the 37-59 Hamilton Avenue area in St. George.",
    area: "37-59 Hamilton Avenue / St. George",
    latitude: 40.6451,
    longitude: -74.0791,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 37-59 Hamilton Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/37-59-hamilton-avenue-n-250320-zrr",
    source_record_id: "nyc-zr-37-59-hamilton-avenue-n-250320-zrr",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "special district zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm site redevelopment, permits, construction, housing delivery, or public-realm changes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1325_avenue_americas_midtown_text_adopted_2026",
    date: "2026-03-26",
    bucket: "planning/development/zoning/midtown office district",
    title: "1325 Avenue of the Americas zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1325 Avenue of the Americas, N 240303 ZRM, with an adopted date of March 26, 2026, amending Section 81-231 in the Midtown zoning rules.",
    observed_change:
      "A documented zoning text milestone was recorded for 1325 Avenue of the Americas in Midtown Manhattan.",
    area: "1325 Avenue of the Americas / Midtown",
    latitude: 40.7629,
    longitude: -73.9808,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1325 Avenue of the Americas",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/1325-avenue-americas-n-240303-zrm",
    source_record_id: "nyc-zr-1325-avenue-americas-n-240303-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related Midtown zoning text amendment",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm building alteration, permits, public-space delivery, tenancy, or construction completion."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_20_berry_street_zoning_text_adopted_2026",
    date: "2026-03-26",
    bucket: "planning/development/zoning/special permit map",
    title: "20 Berry Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 20 Berry St, N 240272 ZRK, with an adopted date of March 26, 2026, amending Section 74-948 map provisions.",
    observed_change:
      "A documented zoning text milestone was recorded for 20 Berry Street in Brooklyn.",
    area: "20 Berry Street / Williamsburg",
    latitude: 40.7219,
    longitude: -73.9557,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 20 Berry St",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/20-berry-st-n-240272-zrk",
    source_record_id: "nyc-zr-20-berry-st-n-240272-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm site redevelopment, permits, construction, tenancy, or built-form change."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_historic_tiled_street_signs_stage3_committed_2026",
    date: "2026-02-20",
    bucket: "planning/development/heritage conservation",
    title: "Historic Tiled Street Signs moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that Historic Tiled Street Signs be moved to Stage 3 - Committed on the Capital Programme, with a future repair and maintenance process to be investigated.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast historic tiled street-sign repair and maintenance work.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-historic-tiled-street-signs-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and conservation project team; specialist contractor not named in the minutes",
    project_type: "heritage street-sign repair and maintenance capital-programme milestone",
    geometry_source: "Citywide heritage-sign programme represented by an approximate Belfast City Hall point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status only. It does not list individual signs, conservation methods, statutory consents, procurement outcome, work start, or completed repairs."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_braniel_community_centre_stage1_added_2026",
    date: "2026-02-20",
    bucket: "planning/development/community facility",
    title: "Braniel Community Centre and outdoor space was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that Braniel Community Centre and outdoor space be added as a Stage 1 - Emerging project on the Capital Programme.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on Braniel Community Centre and outdoor space.",
    area: "Braniel Community Centre",
    latitude: 54.5794,
    longitude: -5.8515,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-braniel-community-centre-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and community-centre project team; design team not named at this stage",
    project_type: "community-centre and outdoor-space business-case milestone",
    geometry_source: "Approximate point geocoded from Braniel Community Centre location rather than a defined project boundary.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 1 programme status only. It does not confirm scope, consultation, design, statutory approvals, procurement, construction start, or completion."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waterfront_hall_chiller_units_stage3_committed_2026",
    date: "2026-02-20",
    bucket: "planning/development/cultural venue building services",
    title: "Waterfront Hall chiller-units project moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that the Waterfront Hall Chiller Units project be moved to Stage 3 - Committed and held at Tier 0 - Scheme at Risk pending further project development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for building-services renewal at Waterfront Hall.",
    area: "Waterfront Hall / Lanyon Place",
    latitude: 54.5967,
    longitude: -5.9196,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-waterfront-hall-chiller-units-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Waterfront Hall project team; building-services design team not named in the minutes",
    project_type: "cultural venue building-services capital works",
    geometry_source: "Approximate point geocoded from Waterfront Hall location.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status and risk tier only. It does not confirm tender result, contract award, works start, chiller-unit specification, building performance, or completion."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_assembly_rooms_cluster_repairs_stage3_committed_2026",
    date: "2026-02-20",
    bucket: "planning/development/heritage conservation",
    title: "Assembly Rooms cluster repair works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that Assembly Rooms Cluster Health and Safety Works and Essential Repairs be moved to Stage 3 - Committed, pending a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for essential repair and health-and-safety works at the Assembly Rooms cluster.",
    area: "Assembly Rooms / North Street and Waring Street",
    latitude: 54.6006,
    longitude: -5.9278,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-assembly-rooms-cluster-repairs-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, World Monuments Fund, and Assembly Rooms conservation project team; works contractor not named in the minutes",
    project_type: "heritage building essential repairs and health-and-safety works",
    geometry_source: "Approximate point reused from the Assembly Rooms / North Street and Waring Street site location.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm tender result, contract award, conservation scope, statutory consents, works start, completion, or future use of the building cluster."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_girdwood_indoor_sports_facility_stage3_committed_2026",
    date: "2026-02-20",
    bucket: "planning/development/sports facility",
    title: "Girdwood Indoor Sports Facility moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 noted movement of Girdwood Indoor Sports Facility to Stage 3 - Committed on the Capital Programme as part of the Leisure Programme.",
    observed_change:
      "A documented capital-programme milestone was recorded for the Girdwood Indoor Sports Facility.",
    area: "Girdwood Community Hub / Girdwood Avenue",
    latitude: 54.6117,
    longitude: -5.9409,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-girdwood-indoor-sports-facility-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Leisure Programme project team; sports-facility design team not named in the minutes",
    project_type: "indoor sports facility capital-programme milestone",
    geometry_source: "Approximate point geocoded from Girdwood Community Hub location rather than a defined indoor-sports-facility footprint.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm final facility design, procurement, statutory approvals, construction start, completion, opening, or operational programming."
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
