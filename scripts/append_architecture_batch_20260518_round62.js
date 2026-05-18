const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeNov2022 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=70364";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_greenford_quay_masterplan_completion_2023",
    date: "2023-04-01",
    bucket: "planning/development/architecture/masterplan housing",
    title: "Greenford Quay Masterplan was listed as built",
    summary:
      "New London Architecture records Greenford Quay Masterplan in Ealing as built, with completion in April 2023.",
    observed_change:
      "A documented Ealing masterplan and housing project was recorded as reaching built status.",
    area: "Greenford / Ealing",
    latitude: 51.5475193,
    longitude: -0.3449598,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Greenford Quay Masterplan",
    source_url: "https://nla.london/projects/greenford-quay-masterplan",
    source_record_id: "nla-greenford-quay-masterplan",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP; SLCE, Hawkins Brown, Mae, and Flanagan Lawrence listed in team credits",
    project_type: "masterplan and housing completion",
    geometry_source: "Nominatim geocoder point for 425 Oldfield Lane North, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; phase-by-phase handover, resident occupation, commercial tenancy, public-realm maintenance, and later estate performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_paintworks_apartments_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/housing retrofit",
    title: "Paintworks Apartments was listed as built",
    summary:
      "New London Architecture records Paintworks Apartments in Hackney as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Hackney apartment project was recorded as reaching built status.",
    area: "Kingsland Road / Hackney",
    latitude: 51.53031,
    longitude: -0.0772566,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Paintworks Apartments",
    source_url: "https://nla.london/projects/paintworks-apartments",
    source_record_id: "nla-paintworks-apartments",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "DROO - Da Costa Mahindroo Architects",
    project_type: "apartment retrofit and extension completion",
    geometry_source: "Nominatim geocoder point for Kingsland Road near the 99-101 Kingsland Road address listed on the NLA project page.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover, occupation, sales, building-control signoff, or later building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_yellow_completion_2018",
    date: "2018-10-01",
    bucket: "planning/development/architecture/community facility",
    title: "The Yellow was listed as built",
    summary:
      "New London Architecture records The Yellow in Wembley Park as built, with estimated completion in October 2018.",
    observed_change:
      "A documented Brent community-centre project was recorded as reaching built status.",
    area: "Wembley Park / Brent",
    latitude: 51.5597003,
    longitude: -0.2810174,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Yellow",
    source_url: "https://nla.london/projects/the-yellow",
    source_record_id: "nla-the-yellow",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Flanagan Lawrence",
    project_type: "community centre completion",
    geometry_source: "Nominatim geocoder point for 10 Elvin Gardens, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact opening date, programme delivery, management arrangements, user numbers, or later facility condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_uclh_phase_5_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/healthcare facility",
    title: "UCLH Phase 5 was listed as built",
    summary:
      "New London Architecture records UCLH Phase 5 in Camden as built, with estimated completion in September 2019.",
    observed_change:
      "A documented healthcare facility project was recorded as reaching built status.",
    area: "Bloomsbury / Camden",
    latitude: 51.5227441,
    longitude: -0.1342233,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: UCLH Phase 5",
    source_url: "https://nla.london/projects/uclh-phase-5",
    source_record_id: "nla-uclh-phase-5",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pilbrow and Partners",
    project_type: "healthcare facility completion",
    geometry_source: "Nominatim geocoder point for 58 Huntley Street, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm clinical commissioning, patient-service start dates, NHS operational changes, equipment installation, or later building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kingsgate_primary_school_completion_2018",
    date: "2018-07-01",
    bucket: "planning/development/architecture/school facility",
    title: "Kingsgate Primary School project was listed as built",
    summary:
      "New London Architecture records the Kingsgate Primary School project in Camden as built, with estimated completion in July 2018.",
    observed_change:
      "A documented school-block project was recorded as reaching built status.",
    area: "West Hampstead / Camden",
    latitude: 51.5437278,
    longitude: -0.1964351,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kingsgate Primary School",
    source_url: "https://nla.london/projects/kingsgate-primary-school",
    source_record_id: "nla-kingsgate-primary-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Sarah Wigglesworth Architects",
    project_type: "school hall and classroom-block completion",
    geometry_source: "Nominatim geocoder point for 96 Kingsgate Road, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm school occupation, curriculum use, pupil numbers, exact handover, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_ridge_street_apartments_financing_2025",
    date: "2025-07-16",
    bucket: "planning/development/architecture/senior housing financing",
    title: "Ridge Street Apartments senior-housing financing was announced",
    summary:
      "The NYC Mayor's Office announced on July 16, 2025 that Grand Street Guild and Catholic Homes of New York had advanced Ridge Street Apartments at 145 Broome Street.",
    observed_change:
      "A documented city announcement recorded a financing/advancement milestone for a senior affordable-housing project.",
    area: "Lower East Side / Manhattan",
    latitude: 40.716364311521,
    longitude: -73.984632527193,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Ridge Street Apartments advancement",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/07/most-pro-housing-administration-in-city-history--mayor-adams--gr",
    source_record_id: "nyc-mayor-2025-07-16-ridge-street-apartments-financing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Cited Mayor's Office page does not name the project architect",
    project_type: "senior affordable housing financing and advancement",
    geometry_source: "US Census geocoder point for 145 Broome Street, the address named in the Mayor's Office release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a financing/advancement announcement only. It does not confirm construction start, completion, resident move-in, social-service delivery, affordability compliance, or later building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_new_utrecht_library_redevelopment_plans_2025",
    date: "2025-09-24",
    bucket: "planning/development/architecture/library housing planning",
    title: "New Utrecht Library redevelopment plans were announced",
    summary:
      "The NYC Mayor's Office announced on September 24, 2025 that HPD and Brooklyn Public Library planned to transform New Utrecht Library and build new affordable housing.",
    observed_change:
      "A documented city announcement recorded the start of public engagement for a library redevelopment and affordable-housing project.",
    area: "Bensonhurst / Brooklyn",
    latitude: 40.607876467139,
    longitude: -74.003551705348,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: New Utrecht Library redevelopment plans",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/09/most-pro-housing-administration-in-city-history--mayor-adams--hp",
    source_record_id: "nyc-mayor-2025-09-24-new-utrecht-library-redevelopment-plans",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement does not name a project architect at this public-engagement stage",
    project_type: "library redevelopment and affordable housing public-engagement milestone",
    geometry_source: "US Census geocoder point for 1743 86th Street, the New Utrecht Library address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a public-engagement/planning milestone only. It does not confirm RFP award, final design, library closure dates, land-use approvals, financing, construction start, completion, or library reopening."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_390_kent_avenue_public_site_engagement_2025",
    date: "2025-09-25",
    bucket: "planning/development/architecture/public site housing planning",
    title: "390 Kent Avenue public-site housing engagement was announced",
    summary:
      "The NYC Mayor's Office announced on September 25, 2025 that public engagement and RFP work would begin for a city-owned site at 390 Kent Avenue in Brooklyn.",
    observed_change:
      "A documented city announcement recorded an early public-site housing planning milestone.",
    area: "Williamsburg / Brooklyn",
    latitude: 40.710970798478,
    longitude: -73.968535040545,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: progress creating homes on city-owned sites",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/09/most-pro-housing-administration-in-city-history--mayor-adams-ann",
    source_record_id: "nyc-mayor-2025-09-25-390-kent-avenue-public-site-engagement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement does not name a project architect at this public-engagement/RFP stage",
    project_type: "public-site housing public-engagement milestone",
    geometry_source: "US Census geocoder point for 390 Kent Avenue, the address named in the Mayor's Office release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records public engagement and RFP work only. It does not confirm an RFP award, land-use approvals, final design, financing, construction start, completion, affordable-unit count, or later building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1880_first_avenue_public_site_engagement_2025",
    date: "2025-09-25",
    bucket: "planning/development/architecture/public site housing planning",
    title: "1880 First Avenue public-site housing engagement was announced",
    summary:
      "The NYC Mayor's Office announced on September 25, 2025 that public engagement and RFP work would begin for a city-owned site at 1880 First Avenue in Manhattan.",
    observed_change:
      "A documented city announcement recorded an early public-site housing planning milestone.",
    area: "East Harlem / Manhattan",
    latitude: 40.782972007467,
    longitude: -73.944837783546,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: progress creating homes on city-owned sites",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/09/most-pro-housing-administration-in-city-history--mayor-adams-ann",
    source_record_id: "nyc-mayor-2025-09-25-1880-first-avenue-public-site-engagement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Announcement does not name a project architect at this public-engagement/RFP stage",
    project_type: "public-site housing public-engagement milestone",
    geometry_source: "US Census geocoder point for 1880 First Avenue, the address named in the Mayor's Office release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records public engagement and RFP work only. It does not confirm an RFP award, land-use approvals, final design, financing, construction start, completion, affordable-unit count, or later building operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_baisley_pond_park_residences_opening_2025",
    date: "2025-12-18",
    bucket: "planning/development/architecture/hotel conversion housing opening",
    title: "Baisley Pond Park Residences opened after hotel conversion",
    summary:
      "NYC HDC recorded on December 18, 2025 the opening of Baisley Pond Park Residences, a former JFK Hilton hotel converted into affordable housing in South Jamaica.",
    observed_change:
      "A documented public housing-finance-agency announcement recorded the opening of a hotel-to-affordable-housing conversion project.",
    area: "South Jamaica / Queens",
    latitude: 40.667880791453,
    longitude: -73.794835674543,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HDC press release: Baisley Pond Park Residences opening",
    source_url:
      "https://www.nychdc.com/newsroom/adams-administration-slate-property-group-and-riseboro-celebrate-opening-baisley-pond-park",
    source_record_id: "nychdc-2025-12-18-baisley-pond-park-residences-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HDC press-release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Aufgang Architects",
    project_type: "hotel conversion to affordable housing opening",
    geometry_source: "US Census geocoder point for 144-02 135th Avenue, used as an approximate marker for the former JFK Hilton/Baisley Pond Park Residences site context named by HDC.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening announcement. It does not confirm every resident move-in, long-term support services, affordability compliance, conversion performance, solar operation, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_covered_cycle_stands_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/cycle parking completion",
    title: "Covered cycle stands were reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed covered cycle stands at Belmont Park, Inverary Community Centre, and Belvoir Activity Centre among recently completed capital programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded completed covered cycle-stand works across three named facility contexts.",
    area: "Belmont Park / Inverary Community Centre / Belvoir Activity Centre",
    latitude: 54.5964356,
    longitude: -5.9295068,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-covered-cycle-stands-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "covered cycle parking completion",
    geometry_source: "Programme-approximate point placed at Belfast City Hall because the report lists three cycle-stand locations without individual completion dates or coordinates.",
    geometry_precision: "programme approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, stand counts, location coordinates, contractor, access arrangements, final cost, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_castle_suds_pilot_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/drainage public realm completion",
    title: "Belfast Castle SUDS pilot was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed the Belfast Castle SUDS pilot project among recently completed Living with Water Programme schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed sustainable-drainage pilot project.",
    area: "Belfast Castle / Cave Hill",
    latitude: 54.6427769,
    longitude: -5.9421566,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-belfast-castle-suds-pilot-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "sustainable drainage pilot completion",
    geometry_source: "Approximate point placed at Belfast Castle from the named council project context and public map context.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, drainage design, monitoring data, contractor, maintenance responsibility, final cost, or later performance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_hw_welders_blanchflower_playing_fields_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/sports facility completion",
    title: "H&W Welders FC / Blanchflower Playing Fields project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed H&W Welders FC / Blanchflower Playing Fields among recently completed Belfast Investment Fund schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed sports-facility project milestone.",
    area: "Holywood Road / East Belfast",
    latitude: 54.5980637,
    longitude: -5.888668,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-hw-welders-blanchflower-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "sports facility and playing-fields completion",
    geometry_source: "Approximate point placed in the Holywood Road / Blanchflower sports-facility context from public map context because the report does not provide coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, works scope, pitch or building specification, contractor, final cost, opening arrangements, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_tagit_boxing_club_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/sports facility completion",
    title: "TAGIT Boxing Club project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed TAGIT Boxing Club among recently completed Belfast Investment Fund schemes.",
    observed_change:
      "A documented council physical-programme report recorded a completed boxing-club capital project milestone.",
    area: "Tullycarnet / East Belfast",
    latitude: 54.5849118,
    longitude: -5.8363062,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-tagit-boxing-club-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "boxing club capital works completion",
    geometry_source: "Approximate point placed at Tullycarnet Park from the boxing-club project context and public map context.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, site address, works specification, contractor, final cost, opening arrangements, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_prokick_gym_completed_2022",
    date: "2022-11-18",
    bucket: "planning/development/architecture/sports facility completion",
    title: "ProKick Gym project was reported completed",
    summary:
      "Belfast City Council's November 18, 2022 Physical Programme report listed ProKick Gym on behalf of Urban Villages among recently completed externally funded projects.",
    observed_change:
      "A documented council physical-programme report recorded a completed sports-gym project milestone.",
    area: "Sydenham / East Belfast",
    latitude: 54.5970989,
    longitude: -5.8883244,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 18 November 2022",
    source_url: belfastPhysicalProgrammeNov2022,
    source_record_id: "bcc-physical-programme-2022-11-18-prokick-gym-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "sports gym project completion",
    geometry_source: "Approximate point placed at Laburnum Court / Sydenham from public map context for the ProKick Gym area.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects but does not give exact completion date, site address, works scope, contractor, final cost, opening arrangements, or later facility condition."
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
