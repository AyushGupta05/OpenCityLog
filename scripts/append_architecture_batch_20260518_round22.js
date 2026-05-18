const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=87109";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_manhattan_loft_gardens_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/hotel residential tower",
    title: "Manhattan Loft Gardens was listed as built",
    summary:
      "New London Architecture records Manhattan Loft Gardens, also known as The Stratford, as a built Newham tower combining residential apartments, hotel use, and sky gardens, with estimated completion in July 2019.",
    observed_change:
      "A documented Stratford high-rise mixed hotel and residential building was recorded as reaching built status.",
    area: "International Way / Stratford",
    latitude: 51.5454,
    longitude: -0.0075,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Manhattan Loft Gardens (The Stratford)",
    source_url: "https://nla.london/projects/manhattan-loft-gardens-the-stratford",
    source_record_id: "nla-manhattan-loft-gardens-the-stratford",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Skidmore Owings & Merrill, Manhattan Loft Corporation, and project team",
    project_type: "mixed residential, hotel, and sky-garden tower",
    geometry_source: "Approximate point geocoded from NLA-stated 22 International Way location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; apartment occupation, hotel operation, sky-garden access, and estate-management details require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_college_road_enclave_completion_2023",
    date: "2023-08-01",
    bucket: "planning/development/architecture/co-living housing",
    title: "College Road Enclave was listed as built",
    summary:
      "New London Architecture records College Road, Enclave, as a built Croydon co-living tower, with estimated completion in August 2023.",
    observed_change:
      "A documented co-living residential tower near East Croydon was recorded as reaching built status.",
    area: "College Road / East Croydon",
    latitude: 51.3739,
    longitude: -0.0949,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: College Road, Enclave",
    source_url: "https://nla.london/projects/college-road-enclave",
    source_record_id: "nla-college-road-enclave",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP and College Road Enclave project team",
    project_type: "co-living residential tower",
    geometry_source: "Approximate point geocoded from NLA-stated 5 College Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, affordability, management model, and occupation rates require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_serin_rosefinch_completion_2022",
    date: "2022-11-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Serin and Rosefinch was listed as built",
    summary:
      "New London Architecture records Serin and Rosefinch in Barnet as a built residential project of 186 homes in a 21-storey tower and lower six-storey building near the Welsh Harp reservoir, with estimated completion in November 2022.",
    observed_change:
      "A documented residential tower and lower block near the Welsh Harp reservoir was recorded as reaching built status.",
    area: "Tyrrel Way / West Hendon",
    latitude: 51.5766,
    longitude: -0.2398,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Serin and Rosefinch",
    source_url: "https://nla.london/projects/serin-and-rosefinch",
    source_record_id: "nla-serin-and-rosefinch",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Serin and Rosefinch project team; architect not named on the NLA project page",
    project_type: "residential tower and lower apartment block",
    geometry_source: "Approximate point geocoded from NLA-stated 100 Tyrrel Way location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; final dwelling mix, tenure, occupation, and estate-wide phasing require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_fontley_way_alton_estate_completion_2024",
    date: "2024-10-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Fontley Way Alton Estate homes were listed as built",
    summary:
      "New London Architecture records Fontley Way on the Alton Estate as a built Wandsworth project delivering 14 affordable family homes around a landscaped garden, with estimated completion in October 2024.",
    observed_change:
      "A documented affordable family-housing project on the Alton Estate was recorded as reaching built status.",
    area: "Fontley Way / Alton Estate",
    latitude: 51.4477,
    longitude: -0.2438,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Fontley Way (Alton Estate)",
    source_url: "https://nla.london/projects/fontley-way-alton-estate",
    source_record_id: "nla-fontley-way-alton-estate",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "TateHindle and Fontley Way project team",
    project_type: "affordable family housing",
    geometry_source: "Approximate point geocoded from NLA-stated 245 Fontley Way location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; allocation, occupation, estate-regeneration sequencing, and long-term management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_brentford_waterside_block_d_completion_2024",
    date: "2024-09-01",
    bucket: "planning/development/architecture/mixed use affordable housing",
    title: "Brentford Waterside Block D was listed as built",
    summary:
      "New London Architecture records Brentford Waterside Block D as a built mixed-use residential building in Hounslow, including 96 affordable homes, retail, podium parking, and a communal garden, with estimated completion in September 2024.",
    observed_change:
      "A documented mixed-use affordable-housing block in Brentford Waterside was recorded as reaching built status.",
    area: "Brentford High Street / Brentford Waterside",
    latitude: 51.4839,
    longitude: -0.3042,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Brentford Waterside Block D",
    source_url: "https://nla.london/projects/brentford-waterside-block-d",
    source_record_id: "nla-brentford-waterside-block-d",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "BDP and Brentford Waterside Block D project team",
    project_type: "mixed-use residential block with affordable homes",
    geometry_source: "Approximate point geocoded from NLA-stated 100 High Street, Brentford location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; tenure allocation, retail opening, parking operation, and wider masterplan phasing require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_allen_street_mall_text_adopted_2026",
    date: "2026-03-26",
    bucket: "planning/development/zoning/public realm",
    title: "Allen Street Mall zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Allen Street Mall, N 250307 ZRM, with an adopted date of March 26, 2026, amending Section 12-10 terminology for wide streets.",
    observed_change:
      "A documented zoning text milestone was recorded for Allen Street Mall public-realm classification.",
    area: "Allen Street / Lower East Side",
    latitude: 40.7195,
    longitude: -73.9905,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Allen Street Mall",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/allen-street-mall-n-250307-zrm",
    source_record_id: "nyc-zr-allen-street-mall-n-250307-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "public-realm-related zoning text amendment",
    geometry_source: "Approximate point placed near Allen Street and Delancey Street rather than a surveyed mall boundary.",
    geometry_precision: "corridor",
    limitations:
      "The event records zoning text adoption only. It does not confirm physical reconstruction, maintenance work, design changes, permits, or public-space programming."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_13_01_11th_street_mih_text_adopted_2026",
    date: "2026-03-10",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "13-01 11th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 13-01 11th Street, N 240335 ZRQ, with an adopted date of March 10, 2026, amending Appendix F for Queens Community District 1 Mandatory Inclusionary Housing area 25.",
    observed_change:
      "A documented zoning text milestone was recorded for the 13-01 11th Street area in Long Island City.",
    area: "13-01 11th Street / Long Island City",
    latitude: 40.7471,
    longitude: -73.9501,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 13-01 11th Street",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/13-01-11th-street-n-240335-zrq",
    source_record_id: "nyc-zr-13-01-11th-street-n-240335-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later built-form change."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_14_10_beach_channel_drive_mih_text_adopted_2026",
    date: "2026-03-10",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "14-10 Beach Channel Drive zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 14-10 Beach Channel Drive, N 240080 ZRQ, with an adopted date of March 10, 2026, amending Appendix F for Queens Community District 14 Mandatory Inclusionary Housing area 7.",
    observed_change:
      "A documented zoning text milestone was recorded for the 14-10 Beach Channel Drive area in Far Rockaway.",
    area: "14-10 Beach Channel Drive / Far Rockaway",
    latitude: 40.6082,
    longitude: -73.7538,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 14-10 Beach Channel Drive",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/14-10-beach-channel-drive-n-240080-zrq",
    source_record_id: "nyc-zr-14-10-beach-channel-drive-n-240080-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, flood-resilience measures, affordable-housing delivery, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_395_flatbush_avenue_extension_text_adopted_2026",
    date: "2026-03-10",
    bucket: "planning/development/zoning/special district",
    title: "395 Flatbush Avenue Extension zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 395 Flatbush Avenue Extension, N 260039 ZRK, with an adopted date of March 10, 2026, amending several Special Downtown Brooklyn District sections and Appendix F for Brooklyn Community District 2.",
    observed_change:
      "A documented zoning text milestone was recorded for 395 Flatbush Avenue Extension in Downtown Brooklyn.",
    area: "395 Flatbush Avenue Extension / Downtown Brooklyn",
    latitude: 40.6892,
    longitude: -73.9807,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 395 Flatbush Avenue Extension",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/395-flatbush-avenue-extension-n-260039-zrk",
    source_record_id: "nyc-zr-395-flatbush-avenue-extension-n-260039-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "special district zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm site redevelopment, public-space delivery, permits, construction, affordable-housing delivery, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1417_avenue_u_mih_text_adopted_2026",
    date: "2026-02-24",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "1417 Avenue U zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1417 Avenue U, N 250333 ZRK, with an adopted date of February 24, 2026, amending Appendix F for Brooklyn Community District 15 Mandatory Inclusionary Housing area 13.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1417 Avenue U area in Brooklyn.",
    area: "1417 Avenue U / Sheepshead Bay",
    latitude: 40.599,
    longitude: -73.9567,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1417 Avenue U",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/1417-avenue-u-n-250333-zrk",
    source_record_id: "nyc-zr-1417-avenue-u-n-250333-zrk",
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
    event_id: "bfs_arch_5_9_north_street_studio_options_report_requested_2026",
    date: "2026-02-20",
    bucket: "planning/development/cultural workspace",
    title: "5-9 North Street studio-space options report was requested",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that a future report be submitted on medium-term studio-space options for the creative sector at 5-9 North Street, with engagement with the Department for Communities and the Arts Council.",
    observed_change:
      "A documented governance milestone was recorded for potential creative-sector studio-space options at 5-9 North Street.",
    area: "5-9 North Street / Cathedral Quarter",
    latitude: 54.6015,
    longitude: -5.9301,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-5-9-north-street-studio-options-report",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and recorded resolution",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Department for Communities, Arts Council, and creative-sector stakeholders; design team not named",
    project_type: "creative workspace options and governance milestone",
    geometry_source: "Approximate point geocoded from North Street location rather than a surveyed building footprint.",
    geometry_precision: "site",
    limitations:
      "The event records a request for a future report and engagement only. It does not confirm ownership, business case, design, funding, statutory approvals, works, occupation, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_depot_charging_scheme_stage3_committed_2026",
    date: "2026-02-20",
    bucket: "planning/development/municipal infrastructure",
    title: "Depot Charging Scheme moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that the Depot Charging Scheme be moved to Stage 3 - Committed, with a maximum Council allocation of up to GBP 76,324 representing 25 percent of project costs.",
    observed_change:
      "A documented capital-programme milestone was recorded for municipal depot charging infrastructure.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-depot-charging-scheme-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and depot project team; site design team not named in the minutes",
    project_type: "municipal depot charging infrastructure capital-programme milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast City Hall point because the minute item does not name a depot site.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not identify the depot, charger specification, procurement, works start, completion, operational use, or fleet outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_corporate_staff_accommodation_stage2_uncommitted_2026",
    date: "2026-02-20",
    bucket: "planning/development/civic accommodation",
    title: "Corporate Staff Accommodation moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that the Corporate Staff Accommodation project be moved to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for options development on Belfast City Council staff accommodation.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-corporate-staff-accommodation-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and accommodation project team; design team not named at this stage",
    project_type: "civic staff-accommodation options milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast City Hall point because the minute item does not name a site.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 2 options status only. It does not confirm a site, design, business case approval, funding, procurement, construction, occupation, or service relocation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_blackstaff_greenway_stage1_added_2026",
    date: "2026-02-20",
    bucket: "planning/development/greenway public realm",
    title: "Blackstaff Greenway was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that Blackstaff Greenway be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on Blackstaff Greenway.",
    area: "Blackstaff corridor / west Belfast",
    latitude: 54.5779,
    longitude: -5.973,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-blackstaff-greenway-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and greenway project team; design team not named at this stage",
    project_type: "greenway business-case milestone",
    geometry_source: "Approximate corridor point placed near Blackstaff Way; the minutes do not provide a mapped greenway boundary.",
    geometry_precision: "corridor",
    limitations:
      "The event records Stage 1 programme status only. It does not confirm route alignment, land access, consultation, design, statutory approvals, procurement, construction, or opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lagmore_youth_project_design_team_2026",
    date: "2026-02-20",
    bucket: "planning/development/youth facility",
    title: "Lagmore Youth Project design delivery consultancy was agreed",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 February 2026 recorded agreement that a Section 76 developer contribution for the Lagmore Youth Project be used to appoint an Integrated Consultancy Team to progress detailed design and delivery of a new facility.",
    observed_change:
      "A documented design-and-delivery milestone was recorded for a new youth facility in Lagmore.",
    area: "Lagmore",
    latitude: 54.5513,
    longitude: -6.0338,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 February 2026",
    source_url: belfastPhysicalProgramme,
    source_record_id: "bcc-spr-2026-02-20-lagmore-youth-project-integrated-consultancy-team",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and Section 76 developer contribution decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Integrated Consultancy Team to be appointed, and Lagmore Youth Project stakeholders",
    project_type: "youth facility detailed-design and delivery milestone",
    geometry_source: "Approximate point placed in Lagmore because the minute item does not provide a site boundary.",
    geometry_precision: "district",
    limitations:
      "The event records agreement to use a developer contribution for consultancy appointment. It does not confirm the final site, design, planning approval, procurement, construction start, completion, or operation of the facility."
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
