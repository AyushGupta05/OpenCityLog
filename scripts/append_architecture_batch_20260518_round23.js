const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastMarch2026PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=87438";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_worship_square_completion_2024",
    date: "2024-06-01",
    bucket: "planning/development/architecture/workspace",
    title: "Worship Square was listed as built",
    summary:
      "New London Architecture records Worship Square at 65 Clifton Street as a built Hackney workspace project, with estimated completion in June 2024.",
    observed_change:
      "A documented Shoreditch workspace building was recorded as reaching built status.",
    area: "Clifton Street / Shoreditch",
    latitude: 51.5223,
    longitude: -0.0834,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Worship Square",
    source_url: "https://nla.london/projects/worship-square",
    source_record_id: "nla-worship-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Make and Worship Square project team",
    project_type: "workspace development",
    geometry_source: "Approximate point geocoded from NLA-stated 65 Clifton Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; tenant occupation, public access, amenity operation, and sustainability performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_eden_dock_completion_2024",
    date: "2024-10-01",
    bucket: "planning/development/architecture/public realm",
    title: "Eden Dock was listed as built",
    summary:
      "New London Architecture records Eden Dock at Canary Wharf as a built public-space project with floating pontoons and aquatic islands, with estimated completion in October 2024.",
    observed_change:
      "A documented dock public-realm intervention at Canary Wharf was recorded as reaching built status.",
    area: "Eden Dock / Canary Wharf",
    latitude: 51.5035,
    longitude: -0.0242,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Eden Dock",
    source_url: "https://nla.london/projects/eden-dock",
    source_record_id: "nla-eden-dock",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Howells and Eden Dock project team",
    project_type: "dock public-realm and landscape project",
    geometry_source: "Approximate point geocoded from NLA-stated 5 Bank Street / Canary Wharf location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; biodiversity measures, management, access hours, maintenance, and water-quality effects require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_wembley_link_completion_2024",
    date: "2024-11-01",
    bucket: "planning/development/architecture/affordable housing public realm",
    title: "Wembley Link was listed as built",
    summary:
      "New London Architecture records Wembley Link as a built Brent project of two brick buildings with affordable homes and new public spaces near Wembley High Road, with estimated completion in November 2024.",
    observed_change:
      "A documented affordable-housing and public-space project near Wembley High Road was recorded as reaching built status.",
    area: "High Road / Wembley",
    latitude: 51.5538,
    longitude: -0.2911,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Wembley Link",
    source_url: "https://nla.london/projects/wembley-link-2",
    source_record_id: "nla-wembley-link-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Howells and Wembley Link project team",
    project_type: "affordable housing and public-space development",
    geometry_source: "Approximate point geocoded from NLA-stated 412 High Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; final tenure allocation, occupation, public-space adoption, and rail-embankment boundary changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_urbanest_battersea_completion_2024",
    date: "2024-09-01",
    bucket: "planning/development/architecture/student accommodation",
    title: "urbanest Battersea was listed as built",
    summary:
      "New London Architecture records urbanest Battersea in Nine Elms as a built student-accommodation and commercial-building development, with estimated completion in September 2024.",
    observed_change:
      "A documented Nine Elms student-accommodation development was recorded as reaching built status.",
    area: "Palmerston Way / Nine Elms",
    latitude: 51.4781,
    longitude: -0.1444,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: urbanest Battersea",
    source_url: "https://nla.london/projects/urbanest-battersea",
    source_record_id: "nla-urbanest-battersea",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris and urbanest Battersea project team",
    project_type: "student accommodation and commercial building",
    geometry_source: "Approximate point geocoded from NLA-stated Palmerston Way location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; student occupation, commercial opening, energy performance, and campus operating arrangements require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_dulwich_college_lower_school_completion_2024",
    date: "2024-07-01",
    bucket: "planning/development/architecture/education",
    title: "Dulwich College Lower School was listed as built",
    summary:
      "New London Architecture records Dulwich College Lower School as a built Southwark education project providing a three-storey library hub, with estimated completion in July 2024.",
    observed_change:
      "A documented Lower School education building at Dulwich College was recorded as reaching built status.",
    area: "Dulwich College / Ferrings",
    latitude: 51.4353,
    longitude: -0.0809,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dulwich College Lower School",
    source_url: "https://nla.london/projects/dulwich-college-lower-school",
    source_record_id: "nla-dulwich-college-lower-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "alma-nac and Dulwich College Lower School project team",
    project_type: "school library and education building",
    geometry_source: "Approximate point geocoded from NLA-stated 14 Ferrings location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; teaching start date, pupil use, library operations, and wider campus works require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_63_12_broadway_mih_text_adopted_2026",
    date: "2026-02-24",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "63-12 Broadway zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 63-12 Broadway, N 250269 ZRQ, with an adopted date of February 24, 2026, amending Appendix F for Queens Community District 2 Mandatory Inclusionary Housing area 7.",
    observed_change:
      "A documented zoning text milestone was recorded for the 63-12 Broadway area in Queens.",
    area: "63-12 Broadway / Woodside",
    latitude: 40.7497,
    longitude: -73.8988,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 63-12 Broadway",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/63-12-broadway-n-250269-zrq",
    source_record_id: "nyc-zr-63-12-broadway-n-250269-zrq",
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
    event_id: "nyc_arch_78_08_linden_boulevard_mih_text_adopted_2026",
    date: "2026-02-12",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "78-08 Linden Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 78-08 Linden Boulevard, N 240146 ZRQ, with an adopted date of February 12, 2026, amending Appendix F for Queens Community District 10 Mandatory Inclusionary Housing area 2.",
    observed_change:
      "A documented zoning text milestone was recorded for the 78-08 Linden Boulevard area in Queens.",
    area: "78-08 Linden Boulevard / Ozone Park",
    latitude: 40.674,
    longitude: -73.8404,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 78-08 Linden Boulevard",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/78-08-linden-boulevard-n-240146-zrq",
    source_record_id: "nyc-zr-78-08-linden-boulevard-n-240146-zrq",
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
    event_id: "nyc_arch_mta_125th_lexington_text_adopted_2025",
    date: "2025-12-18",
    bucket: "planning/development/zoning/transit district",
    title: "MTA 125th Street and Lexington Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records MTA 125th Street and Lexington Avenue, N 250301 ZRM, with an adopted date of December 18, 2025, amending East Harlem Corridor and Appendix F provisions for Manhattan Community Districts 9, 10, and 11.",
    observed_change:
      "A documented zoning text milestone was recorded for the 125th Street and Lexington Avenue transit area.",
    area: "125th Street and Lexington Avenue / East Harlem",
    latitude: 40.8047,
    longitude: -73.9378,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: MTA 125th Street and Lexington Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/mta-125th-street-and-lexington-avenue-n-250301-zrm",
    source_record_id: "nyc-zr-mta-125th-street-and-lexington-avenue-n-250301-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Metropolitan Transportation Authority, NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "transit-area zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from 125th Street and Lexington Avenue rather than a mapped zoning boundary.",
    geometry_precision: "intersection",
    limitations:
      "The event records zoning text adoption only. It does not confirm transit construction, station access work, development permits, affordable-housing delivery, or occupancy."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1720_atlantic_avenue_mih_text_adopted_2025",
    date: "2025-12-04",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "1720 Atlantic Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1720 Atlantic Avenue, N 230315 ZRK, with an adopted date of December 4, 2025, amending Appendix F for Brooklyn Community District 8 Mandatory Inclusionary Housing area 10.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1720 Atlantic Avenue area in Brooklyn.",
    area: "1720 Atlantic Avenue / Crown Heights",
    latitude: 40.6771,
    longitude: -73.9334,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1720 Atlantic Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/1720-atlantic-avenue-n-230315-zrk",
    source_record_id: "nyc-zr-1720-atlantic-avenue-n-230315-zrk",
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
    event_id: "nyc_arch_5502_flatlands_avenue_mih_text_adopted_2025",
    date: "2025-11-25",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "5502 Flatlands Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 5502 Flatlands Avenue, N 250122 ZRK, with an adopted date of November 25, 2025, amending Appendix F for Brooklyn Community District 18 Mandatory Inclusionary Housing area 1.",
    observed_change:
      "A documented zoning text milestone was recorded for the 5502 Flatlands Avenue area in Brooklyn.",
    area: "5502 Flatlands Avenue / Flatlands",
    latitude: 40.629,
    longitude: -73.9229,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 5502 Flatlands Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/5502-flatlands-avenue-n-250122-zrk",
    source_record_id: "nyc-zr-5502-flatlands-avenue-n-250122-zrk",
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
    event_id: "bfs_arch_parks_open_space_improvement_stage3_committed_2026",
    date: "2026-03-20",
    bucket: "planning/development/parks public realm",
    title: "Parks and Open Space Improvement Programme moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 March 2026 recorded agreement that the Parks and Open Space Improvement Programme for 2025/2026 and 2026/2027 be moved to Stage 3 - Committed with up to GBP 1.5 million allocated over two years.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast parks and open-space improvements.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 March 2026",
    source_url: belfastMarch2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-03-20-parks-open-space-improvement-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks project teams; individual design teams not named in the minutes",
    project_type: "parks and open-space improvement capital-programme milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast City Hall point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not list all sites, design scopes, procurement outcomes, works starts, completions, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bridges_improvement_programme_stage3_committed_2026",
    date: "2026-03-20",
    bucket: "planning/development/bridge infrastructure",
    title: "Bridges Improvement Programme moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 March 2026 recorded agreement that the Bridges Improvement Programme be moved to Stage 3 - Committed with up to GBP 240,000 for Year 1 and an annual rolling programme thereafter.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast bridge-improvement works.",
    area: "Belfast City Council area",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 March 2026",
    source_url: belfastMarch2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-03-20-bridges-improvement-programme-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and bridge project teams; individual design teams not named in the minutes",
    project_type: "bridge improvement capital-programme milestone",
    geometry_source: "Citywide programme record represented by an approximate Belfast City Hall point rather than individual bridge locations.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not list individual bridges, engineering design, statutory approvals, procurement outcomes, construction, or reopening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_security_improvements_stage2_2026",
    date: "2026-03-20",
    bucket: "planning/development/civic building security",
    title: "City Hall Security Improvements moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 March 2026 recorded agreement that City Hall Security Improvements be moved to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for options development on Belfast City Hall security improvements.",
    area: "Belfast City Hall",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 March 2026",
    source_url: belfastMarch2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-03-20-city-hall-security-improvements-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and City Hall project team; security design team not named at this stage",
    project_type: "civic building security options milestone",
    geometry_source: "Approximate point placed at Belfast City Hall rather than a surveyed works boundary.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 2 options status only. It does not confirm security scope, design, consents, procurement, works start, completion, or operational changes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_artificial_lighting_parks_stage1_added_2026",
    date: "2026-03-20",
    bucket: "planning/development/parks lighting",
    title: "Artificial Lighting in Parks Sites was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 March 2026 recorded agreement that Artificial Lighting in Parks Sites be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for business-case development on artificial lighting in Belfast parks.",
    area: "Belfast City Council parks",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 March 2026",
    source_url: belfastMarch2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-03-20-artificial-lighting-parks-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks lighting project team; design team not named at this stage",
    project_type: "parks lighting business-case milestone",
    geometry_source: "Citywide parks programme record represented by an approximate Belfast City Hall point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme status only. It does not identify sites, lighting design, ecology assessment, consultation, procurement, installation, operation, or maintenance."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_zoo_old_zoo_site_visits_agreed_2026",
    date: "2026-03-20",
    bucket: "planning/development/zoo estate",
    title: "Belfast Zoo and Old Zoo site visits were agreed",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 March 2026 recorded agreement that Member site visits be undertaken to other zoo locations to inform ongoing work in respect of Belfast Zoo and the Old Zoo.",
    observed_change:
      "A documented governance milestone was recorded for estate-planning work concerning Belfast Zoo and the Old Zoo.",
    area: "Belfast Zoo / Cavehill",
    latitude: 54.6532,
    longitude: -5.9439,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 20 March 2026",
    source_url: belfastMarch2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-03-20-belfast-zoo-old-zoo-site-visits",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and recorded decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Belfast Zoo, and estate-planning stakeholders; design team not named",
    project_type: "zoo estate planning governance milestone",
    geometry_source: "Approximate point placed at Belfast Zoo / Cavehill rather than a mapped Old Zoo or estate-planning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records agreement to undertake site visits only. It does not confirm a masterplan, design, funding, statutory approvals, works, animal-facility changes, public access changes, or completion."
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
