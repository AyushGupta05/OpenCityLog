const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastSep2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=84888";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_burgess_park_sports_pavilion_completion_2024",
    date: "2024-05-01",
    bucket: "planning/development/architecture/community sports facility",
    title: "Burgess Park Sports Pavilion was listed as built",
    summary:
      "New London Architecture records Burgess Park Sports Pavilion in Southwark as built, with completion in May 2024 for a public park facility with clubroom, changing rooms, public amenities, and park-staff offices.",
    observed_change:
      "A documented Burgess Park sports and community pavilion project was recorded as reaching built status.",
    area: "Burgess Park / Southwark",
    latitude: 51.4819,
    longitude: -0.0828,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Burgess Park Sports Pavilion",
    source_url: "https://nla.london/projects/burgess-park-sports-pavilion",
    source_record_id: "nla-burgess-park-sports-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bell Phillips Architects",
    project_type: "public park sports pavilion",
    geometry_source: "Approximate point geocoded from NLA-stated Chumleigh Street / Burgess Park location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; booking use, maintenance, park-footfall changes, and operational performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_osmo_nine_elms_completion_2024",
    date: "2024-04-01",
    bucket: "planning/development/architecture/workspace",
    title: "OSMO in Nine Elms was listed as built",
    summary:
      "New London Architecture records OSMO at 65 Nine Elms Lane as a built workspace project, with completion in April 2024.",
    observed_change:
      "A documented Nine Elms workspace project was recorded as reaching built status.",
    area: "Nine Elms Linear Park / Wandsworth",
    latitude: 51.482,
    longitude: -0.139,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: OSMO",
    source_url: "https://nla.london/projects/osmo",
    source_record_id: "nla-osmo",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "workspace and retail building",
    geometry_source: "Approximate point geocoded from NLA-stated 65 Nine Elms Lane location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupancy, tenant mix, operational carbon performance, and public-realm use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_southwark_urban_logistics_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/logistics",
    title: "Southwark Urban Logistics was listed as built",
    summary:
      "New London Architecture records Southwark Urban Logistics at 25 Mandela Way as a built multi-storey industrial and logistics project, with completion in 2025.",
    observed_change:
      "A documented Mandela Way urban-logistics building was recorded as reaching built status.",
    area: "Mandela Way Industrial Estate / Southwark",
    latitude: 51.4893,
    longitude: -0.0736,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Southwark Urban Logistics",
    source_url: "https://nla.london/projects/southwark-urban-logistics",
    source_record_id: "nla-southwark-urban-logistics",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Harris Partnership",
    project_type: "multi-storey urban logistics hub",
    geometry_source: "Approximate point geocoded from NLA-stated 25 Mandela Way location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; logistics operations, servicing patterns, jobs, and transport outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_scoop_union_street_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/office retrofit",
    title: "The Scoop on Union Street was listed as built",
    summary:
      "New London Architecture records The Scoop at 50-52 Union Street as a built Southwark office redevelopment, with completion in 2025.",
    observed_change:
      "A documented Union Street office retrofit and extension was recorded as reaching built status.",
    area: "Union Street / Southwark",
    latitude: 51.5036,
    longitude: -0.0991,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Scoop",
    source_url: "https://nla.london/projects/the-scoop",
    source_record_id: "nla-the-scoop",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Corstorphine & Wright",
    project_type: "office retrofit and extension",
    geometry_source: "Approximate point geocoded from NLA-stated 50-52 Union Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; occupation, leasing, conservation-area approvals, and building-performance claims require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_woodside_park_affordable_homes_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Woodside Park affordable homes were listed as built",
    summary:
      "New London Architecture records Woodside Park in Barnet as a built affordable-housing project, with completion in 2025 on disused Transport for London land beside Woodside Park station.",
    observed_change:
      "A documented Barnet affordable-housing project was recorded as reaching built status.",
    area: "Woodside Park station / Barnet",
    latitude: 51.6183,
    longitude: -0.1854,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Woodside Park",
    source_url: "https://nla.london/projects/woodside-park",
    source_record_id: "nla-woodside-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design",
    project_type: "affordable housing on brownfield land",
    geometry_source: "Approximate point placed beside Woodside Park station from the NLA-stated site context.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; sales, eligibility checks, occupancy, affordability duration, and resident outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_47_hall_street_mih_text_adopted_2025",
    date: "2025-08-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "47 Hall Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 47 Hall Street, N 250051 ZRK, with an adopted date of August 14, 2025, adding special mixed-use district text for new MX-27 and amending Appendix F for Brooklyn Community District 2 Mandatory Inclusionary Housing area 14.",
    observed_change:
      "A documented zoning text milestone was recorded for the 47 Hall Street area in Brooklyn.",
    area: "47 Hall Street / Brooklyn Community District 2",
    latitude: 40.6975,
    longitude: -73.9662,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 47 Hall Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/47-hall-street-n-250051-zrk",
    source_record_id: "nyc-zr-47-hall-street-n-250051-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_lenox_hill_hospital_mih_text_adopted_2025",
    date: "2025-08-14",
    bucket: "planning/development/zoning/institutional campus",
    title: "Lenox Hill Hospital zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Lenox Hill Hospital, N 250152 ZRM, with an adopted date of August 14, 2025, amending Appendix F for Manhattan Community District 8 Mandatory Inclusionary Housing area 3.",
    observed_change:
      "A documented zoning text milestone was recorded for the Lenox Hill Hospital area in Manhattan.",
    area: "Lenox Hill Hospital / Upper East Side",
    latitude: 40.7738,
    longitude: -73.9604,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Lenox Hill Hospital",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/lenox-hill-hospital-n-250152-zrm",
    source_record_id: "nyc-zr-lenox-hill-hospital-n-250152-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "institutional-area zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from Lenox Hill Hospital rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, hospital construction, service changes, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_347_flushing_avenue_mih_text_adopted_2025",
    date: "2025-08-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "347 Flushing Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 347 Flushing Avenue, N 240276 ZRK, with an adopted date of August 14, 2025, amending Appendix F for Brooklyn Community District 1 Mandatory Inclusionary Housing area 13.",
    observed_change:
      "A documented zoning text milestone was recorded for the 347 Flushing Avenue area in Brooklyn.",
    area: "347 Flushing Avenue / Brooklyn Community District 1",
    latitude: 40.6988,
    longitude: -73.9583,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 347 Flushing Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/347-flushing-avenue-n-240276-zrk",
    source_record_id: "nyc-zr-347-flushing-avenue-n-240276-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_42_11_30th_avenue_mih_text_adopted_2025",
    date: "2025-08-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "42-11 30th Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 42-11 30th Avenue, N 240224 ZRQ, with an adopted date of August 14, 2025, amending Appendix F for Queens Community District 1 Mandatory Inclusionary Housing area 23.",
    observed_change:
      "A documented zoning text milestone was recorded for the 42-11 30th Avenue area in Queens.",
    area: "42-11 30th Avenue / Astoria",
    latitude: 40.7624,
    longitude: -73.9142,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 42-11 30th Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/42-11-30th-avenue-n-240224-zrq",
    source_record_id: "nyc-zr-42-11-30th-avenue-n-240224-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_109_marcus_garvey_boulevard_mih_text_adopted_2025",
    date: "2025-07-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "109 Marcus Garvey Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 109 Marcus Garvey Boulevard, N 240398 ZRK, with an adopted date of July 14, 2025, amending Appendix F for Brooklyn Community District 3 Mandatory Inclusionary Housing area 15.",
    observed_change:
      "A documented zoning text milestone was recorded for the 109 Marcus Garvey Boulevard area in Brooklyn.",
    area: "109 Marcus Garvey Boulevard / Bedford-Stuyvesant",
    latitude: 40.6999,
    longitude: -73.9416,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 109 Marcus Garvey Boulevard",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/109-marcus-garvey-boulevard-n-240398-zrk",
    source_record_id: "nyc-zr-109-marcus-garvey-boulevard-n-240398-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cremated_remains_burial_plots_stage2_2025",
    date: "2025-09-19",
    bucket: "planning/development/cemetery infrastructure",
    title: "Cremated Remains Burial Plots moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Cremated Remains Burial Plots be moved to Stage 2 - Uncommitted with a GBP 10,000 allocation for an outline business case.",
    observed_change:
      "A documented capital-programme milestone was recorded for cemetery burial-plot infrastructure planning.",
    area: "Belfast City Council cemetery estate",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 19 September 2025",
    source_url: belfastSep2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-09-19-cremated-remains-burial-plots-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and cemetery services; design team not named in the minutes",
    project_type: "cemetery infrastructure outline-business-case milestone",
    geometry_source: "Citywide cemetery-estate record represented by an approximate Belfast City Hall point because the minutes do not name a cemetery site.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm site selection, design, planning approval, procurement, construction, completion, or plot availability."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_zoo_improvement_works_phase2_stage2_2025",
    date: "2025-09-19",
    bucket: "planning/development/zoo estate",
    title: "Belfast Zoo Improvement Works Phase 2 moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Belfast Zoo Improvement Works Phase 2 be moved to Stage 2 - Uncommitted with a GBP 10,000 allocation for an outline business case.",
    observed_change:
      "A documented capital-programme milestone was recorded for further Belfast Zoo estate-improvement planning.",
    area: "Belfast Zoo / Cave Hill",
    latitude: 54.6545,
    longitude: -5.9438,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 19 September 2025",
    source_url: belfastSep2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-09-19-zoo-improvement-works-phase-2-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Belfast Zoo team; design team not named in the minutes",
    project_type: "zoo estate improvement outline-business-case milestone",
    geometry_source: "Approximate point geocoded from Belfast Zoo location.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm the scope of zoo works, design, planning approval, procurement, construction, completion, animal-facility changes, or visitor impacts."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_greening_growing_project_stage1_2025",
    date: "2025-09-19",
    bucket: "planning/development/urban greening",
    title: "Greening and Growing Project was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that the Greening and Growing Project be moved to Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for a city greening and growing project entering the emerging stage.",
    area: "Belfast citywide greening programme",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 19 September 2025",
    source_url: belfastSep2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-09-19-greening-growing-project-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and greening project team; design team not named in the minutes",
    project_type: "urban greening capital-programme entry milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast City Hall point because the minutes do not name project sites.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm project sites, planting designs, delivery funding, procurement, implementation, maintenance, or ecological outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_fernhill_house_courtyard_stage1_2025",
    date: "2025-09-19",
    bucket: "planning/development/heritage conservation",
    title: "Fernhill House and Courtyard was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Fernhill House and Courtyard be moved to Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for Fernhill House and Courtyard entering the emerging stage.",
    area: "Fernhill House / Glencairn",
    latitude: 54.6133,
    longitude: -5.9817,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 19 September 2025",
    source_url: belfastSep2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-09-19-fernhill-house-courtyard-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Fernhill House project team; design team not named in the minutes",
    project_type: "heritage building and courtyard capital-programme entry milestone",
    geometry_source: "Approximate point geocoded from Fernhill House location.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm design, scope, planning approval, procurement, works start, completion, restoration, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lenadoon_greenway_stage1_2025",
    date: "2025-09-19",
    bucket: "planning/development/active travel greenway",
    title: "Lenadoon Greenway was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 September 2025 recorded agreement that Lenadoon Greenway be moved to Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for Lenadoon Greenway entering the emerging stage.",
    area: "Lenadoon / west Belfast",
    latitude: 54.5758,
    longitude: -6.0188,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 19 September 2025",
    source_url: belfastSep2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-09-19-lenadoon-greenway-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; design team not named in the minutes",
    project_type: "active travel greenway capital-programme entry milestone",
    geometry_source: "Approximate district point placed in Lenadoon because the minutes do not provide a mapped greenway alignment.",
    geometry_precision: "district",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm route alignment, design, land agreements, planning approval, procurement, construction, completion, or opening."
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
