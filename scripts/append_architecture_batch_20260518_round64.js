const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPhysicalProgrammeJun2023 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=73377";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_kingston_school_of_art_completion_2019",
    date: "2019-12-01",
    bucket: "planning/development/architecture/education refurbishment",
    title: "Kingston School of Art was listed as built",
    summary:
      "New London Architecture records Kingston School of Art at Knight's Park as built, with estimated completion in December 2019.",
    observed_change:
      "A documented Kingston education and art-school project was recorded as reaching built status.",
    area: "Kingston upon Thames / London",
    latitude: 51.4070025,
    longitude: -0.3002792,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kingston School of Art",
    source_url: "https://nla.london/projects/kingston-school-of-art",
    source_record_id: "nla-kingston-school-of-art",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Haworth Tompkins listed the project; page names Overbury as contractor",
    project_type: "education building refurbishment completion",
    geometry_source: "Nominatim geocoder point for 9 Knight's Park, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover, academic occupation date, fit-out details, planning-condition discharge, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_croydon_urban_room_completion_2019",
    date: "2019-11-01",
    bucket: "planning/development/architecture/civic exhibition space",
    title: "Croydon Urban Room was listed as built",
    summary:
      "New London Architecture records Croydon Urban Room at Bernard Weatherill House as built, with estimated completion in November 2019.",
    observed_change:
      "A documented Croydon civic urban-room project was recorded as reaching built status.",
    area: "Croydon town centre / Croydon",
    latitude: 51.3712255,
    longitude: -0.0988263,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Croydon Urban Room",
    source_url: "https://nla.london/projects/croydon-urban-room",
    source_record_id: "nla-croydon-urban-room",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Spatial Planning, LB Croydon",
    project_type: "civic exhibition and planning engagement space completion",
    geometry_source: "Nominatim geocoder point for Croydon Council, 8 Mint Walk / Bernard Weatherill House, the address context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public opening date, exhibition programme, visitor numbers, planning engagement outcomes, or later operational condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_southbank_undercroft_skate_space_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/public realm skate space",
    title: "Southbank Undercroft Skate Space was listed as built",
    summary:
      "New London Architecture records Southbank Undercroft Skate Space as built, with estimated completion in June 2019.",
    observed_change:
      "A documented Lambeth public-realm skate-space project was recorded as reaching built status.",
    area: "South Bank / Lambeth",
    latitude: 51.5066598,
    longitude: -0.1165716,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Southbank Undercroft Skate Space",
    source_url: "https://nla.london/projects/southbank-undercroft-skate-space",
    source_record_id: "nla-southbank-undercroft-skate-space",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Feilden Clegg Bradley Studios listed the project; page names Arup and Max Fordham in the project team",
    project_type: "public realm skate-space completion",
    geometry_source: "Nominatim geocoder point for Southbank Skatepark, matching the undercroft context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public reopening date, stewardship arrangements, access hours, maintenance, or later condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_build_up_hackney_completion_2019",
    date: "2019-10-01",
    bucket: "planning/development/architecture/youth construction project",
    title: "Build Up Hackney was listed as built",
    summary:
      "New London Architecture records Build Up Hackney at 250 Morning Lane as built, with estimated completion in October 2019.",
    observed_change:
      "A documented Hackney youth construction and built-environment project was recorded as reaching built status.",
    area: "Hackney Central / Hackney",
    latitude: 51.5450994,
    longitude: -0.0463225,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Build Up Hackney",
    source_url: "https://nla.london/projects/build-up-hackney",
    source_record_id: "nla-build-up-hackney",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Build Up Foundation",
    project_type: "youth-led construction project completion",
    geometry_source: "Nominatim geocoder point for 250 Morning Lane, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact installation date, participant outcomes, access arrangements, maintenance responsibility, or later site condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_jonathan_tuckey_design_studio_completion_2017",
    date: "2017-06-01",
    bucket: "planning/development/architecture/workspace refurbishment",
    title: "Jonathan Tuckey Design architectural studio was listed as built",
    summary:
      "New London Architecture records the Jonathan Tuckey Design architectural studio at 58 Milson Road as built, with estimated completion in June 2017.",
    observed_change:
      "A documented Hammersmith workspace project was recorded as reaching built status.",
    area: "Brook Green / Hammersmith",
    latitude: 51.4987058,
    longitude: -0.2141937,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Jonathan Tuckey Design Architectural Studio",
    source_url: "https://nla.london/projects/jonathan-tuckey-design-architectural-studio-2",
    source_record_id: "nla-jonathan-tuckey-design-architectural-studio-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Jonathan Tuckey Design",
    project_type: "architectural studio workspace completion",
    geometry_source: "Nominatim geocoder point for 58 Milson Road, the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact occupation date, construction cost, planning-condition discharge, tenancy, or later workspace condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gansevoort_square_rfp_released_2025",
    date: "2025-01-29",
    bucket: "planning/development/architecture/public site mixed use planning",
    title: "Gansevoort Square redevelopment RFP was announced",
    summary:
      "The NYC Mayor's Office announced next steps for Gansevoort Square on January 29, 2025, including release of a request for proposals for the Little West 12th Street site.",
    observed_change:
      "A documented city announcement recorded a public-site mixed-use redevelopment procurement milestone.",
    area: "Meatpacking District / Manhattan",
    latitude: 40.739917474354,
    longitude: -74.007172096854,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Gansevoort Square next steps",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/01/mayor-adams-nycedc-next-steps-reimagining-gansevoort-square-build-mixed-income",
    source_record_id: "nyc-mayor-2025-01-29-gansevoort-square-rfp",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Procurement-stage announcement does not name a project architect",
    project_type: "public-site mixed-use redevelopment RFP",
    geometry_source: "US Census geocoder point for 22 Little West 12th Street, near the Little West 12th Street site context named in the announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an RFP and planning milestone only. It does not confirm developer selection, land-use approval, building design, permits, construction start, completion, affordability mix, or occupation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_coney_island_west_vision_announced_2025",
    date: "2025-02-20",
    bucket: "planning/development/architecture/public site housing planning",
    title: "Coney Island West housing and public-realm vision was announced",
    summary:
      "The NYC Mayor's Office announced a Coney Island West vision on February 20, 2025 covering mixed-income housing, public-realm investment, and community amenities.",
    observed_change:
      "A documented city announcement recorded a public-site housing and public-realm planning milestone.",
    area: "Coney Island / Brooklyn",
    latitude: 40.57459277009,
    longitude: -73.987635065709,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Coney Island West vision",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/02/mayor-adams-bold-new-vision-coney-island-including-1-500-new-units-mixed-income",
    source_record_id: "nyc-mayor-2025-02-20-coney-island-west-vision",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Vision-stage announcement does not name project architects",
    project_type: "public-site housing and public-realm planning milestone",
    geometry_source: "US Census geocoder point for Surf Avenue and West 21st Street, the site-area context named in the announcement.",
    geometry_precision: "area approximate",
    limitations:
      "The event records a public vision announcement only. It does not confirm site-specific land-use approval, final design, permits, construction start, public-realm delivery, completion, or occupation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_new_stapleton_waterfront_developer_selection_2025",
    date: "2025-05-12",
    bucket: "planning/development/architecture/waterfront housing planning",
    title: "New Stapleton Waterfront developers were announced",
    summary:
      "The NYC Mayor's Office announced selected developers on May 12, 2025 for a housing milestone at the New Stapleton Waterfront on Staten Island.",
    observed_change:
      "A documented city announcement recorded a developer-selection milestone for a waterfront housing site.",
    area: "Stapleton / Staten Island",
    latitude: 40.626819762858,
    longitude: -74.074152034887,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: New Stapleton Waterfront developers",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/05/mayor-adams-nycedc-developers-over-500-new-housing-units-stapleton-advancing",
    source_record_id: "nyc-mayor-2025-05-12-new-stapleton-waterfront-developer-selection",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Developer-selection announcement does not name project architects",
    project_type: "waterfront housing developer-selection milestone",
    geometry_source: "US Census geocoder point for Front Street and Canal Street, the site-corner context named in the announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records developer selection only. It does not confirm land-use approval, final building design, financing close, permits, construction start, completion, affordability delivery, or occupation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brooklyn_marine_terminal_vision_passage_2025",
    date: "2025-09-22",
    bucket: "planning/development/architecture/waterfront mixed use planning",
    title: "Brooklyn Marine Terminal vision plan passage was announced",
    summary:
      "The NYC Mayor's Office announced passage of the Brooklyn Marine Terminal vision plan on September 22, 2025, covering port modernization and mixed-use waterfront planning.",
    observed_change:
      "A documented city announcement recorded a vision-plan passage milestone for a major waterfront site.",
    area: "Red Hook / Brooklyn",
    latitude: 40.6831586,
    longitude: -74.010973,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Brooklyn Marine Terminal vision plan",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/09/mayor-adams--governor-hochul--representative-goldman--senator-go",
    source_record_id: "nyc-mayor-2025-09-22-brooklyn-marine-terminal-vision-plan-passage",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Vision-plan announcement does not name project architects",
    project_type: "waterfront port and mixed-use vision-plan milestone",
    geometry_source: "Nominatim geocoder point for Atlantic Basin, used as an approximate marker for the Brooklyn Marine Terminal waterfront context.",
    geometry_precision: "area approximate",
    limitations:
      "The event records a vision-plan passage announcement only. It does not confirm environmental review completion, land-use approvals, final site design, procurement, construction start, public-space delivery, or occupation."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_sparc_kips_bay_groundbreaking_2025",
    date: "2025-12-23",
    bucket: "planning/development/architecture/science education campus",
    title: "SPARC Kips Bay groundbreaking was announced",
    summary:
      "The NYC Mayor's Office announced a December 23, 2025 groundbreaking milestone for the SPARC Kips Bay jobs and education hub at 455 First Avenue.",
    observed_change:
      "A documented city announcement recorded a groundbreaking milestone for a science and education campus site.",
    area: "Kips Bay / Manhattan",
    latitude: 40.739216938738,
    longitude: -73.976928385437,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: SPARC Kips Bay groundbreaking",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2025/12/mayor-adams--governor-hochul-announce-groundbreaking-for-first-o",
    source_record_id: "nyc-mayor-2025-12-23-sparc-kips-bay-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Groundbreaking announcement does not name the full design team on the cited page",
    project_type: "science and education campus groundbreaking",
    geometry_source: "US Census geocoder point for 455 First Avenue, the address named in the announcement.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm final construction sequencing, later permits, completion, tenant fit-out, opening date, programme delivery, or campus operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_walkway_community_centre_completed_2023",
    date: "2023-06-26",
    bucket: "planning/development/architecture/community centre completion",
    title: "Walkway Community Centre was reported completed",
    summary:
      "Belfast City Council's June 26, 2023 Physical Programme report listed Walkway Community Centre at Bloomfield among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of a community-centre building milestone.",
    area: "Bloomfield / East Belfast",
    latitude: 54.5973581,
    longitude: -5.8872189,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 26 June 2023",
    source_url: belfastPhysicalProgrammeJun2023,
    source_record_id: "bcc-physical-programme-2023-06-26-walkway-community-centre-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "community centre building completion",
    geometry_source: "Nominatim geocoder point for Bloomfield Walkway, used as an approximate Bloomfield area marker because the council report does not provide project coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the scheme among recently completed projects and describes the new building, but does not give exact completion date, address, site boundary, contractor, final cost, opening hours, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sally_gardens_westlands_playgrounds_completed_2023",
    date: "2023-06-26",
    bucket: "planning/development/architecture/playground refurbishment",
    title: "Sally Gardens and Westlands playground refurbishments were reported completed",
    summary:
      "Belfast City Council's June 26, 2023 Physical Programme report listed major refurbishments at Sally Gardens play park and Westlands playground at Waterworks Park among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of a two-site playground refurbishment milestone.",
    area: "Poleglass and Waterworks Park / Belfast",
    latitude: 54.562707,
    longitude: -6.030265,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 26 June 2023",
    source_url: belfastPhysicalProgrammeJun2023,
    source_record_id: "bcc-physical-programme-2023-06-26-sally-gardens-westlands-playgrounds-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name playground designers or contractors for this completed-project list item",
    project_type: "playground refurbishment completion",
    geometry_source: "Nominatim geocoder point for Sally Gardens Community Centre, used as one marker for a two-site playground programme that also names Westlands at Waterworks Park.",
    geometry_precision: "multi-site programme approximate",
    limitations:
      "The report lists the two playground refurbishments among recently completed projects but does not give exact completion dates, equipment schedules, safety certification, contractor, final cost, or later playground condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_willowbank_3g_pitch_completed_2023",
    date: "2023-06-26",
    bucket: "planning/development/architecture/sports pitch improvement",
    title: "Willowbank 3G pitch improvements were reported completed",
    summary:
      "Belfast City Council's June 26, 2023 Physical Programme report listed improvements to the 3G pitch and fencing alterations at Willowbank Youth Club among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of a sports-pitch improvement milestone.",
    area: "Willowbank / West Belfast",
    latitude: 54.5904079,
    longitude: -5.9636347,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 26 June 2023",
    source_url: belfastPhysicalProgrammeJun2023,
    source_record_id: "bcc-physical-programme-2023-06-26-willowbank-3g-pitch-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name sports-pitch designers or contractors for this completed-project list item",
    project_type: "3G sports-pitch improvement completion",
    geometry_source: "Nominatim geocoder point for Willowbank Park, used as an approximate marker for the Willowbank Youth Club project context because the report does not provide coordinates.",
    geometry_precision: "area approximate",
    limitations:
      "The report lists the pitch and fencing works among recently completed projects but does not give exact completion date, pitch specification, certification, contractor, final cost, booking arrangements, or later condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_braniel_church_extension_completed_2023",
    date: "2023-06-26",
    bucket: "planning/development/architecture/community facility refurbishment",
    title: "Braniel Church extension and refurbishment were reported completed",
    summary:
      "Belfast City Council's June 26, 2023 Physical Programme report listed the Braniel Church extension and refurbishment for community use among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of a church-based community facility extension and refurbishment milestone.",
    area: "Braniel / East Belfast",
    latitude: 54.5782424,
    longitude: -5.8506211,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 26 June 2023",
    source_url: belfastPhysicalProgrammeJun2023,
    source_record_id: "bcc-physical-programme-2023-06-26-braniel-church-extension-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name designers or contractors for this completed-project list item",
    project_type: "community facility extension and refurbishment completion",
    geometry_source: "Nominatim geocoder point for Braniel Church, matching the project named in the council report.",
    geometry_precision: "site approximate",
    limitations:
      "The report lists the extension and refurbishment among recently completed projects but does not give exact completion date, design drawings, contractor, final cost, operating model, community-use schedule, or later facility condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sandy_row_tourism_signage_completed_2023",
    date: "2023-06-26",
    bucket: "planning/development/architecture/tourism trail public realm",
    title: "Sandy Row tourism signage was reported completed",
    summary:
      "Belfast City Council's June 26, 2023 Physical Programme report listed Belfast South Community Resources' Sandy Row tourism signage and tourism trail development among recently completed projects.",
    observed_change:
      "A documented council physical-programme report recorded completion of a tourism-trail signage and public-realm interpretation milestone.",
    area: "Sandy Row / Belfast",
    latitude: 54.588297,
    longitude: -5.935745,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council agenda item: Update on Physical Programme, 26 June 2023",
    source_url: belfastPhysicalProgrammeJun2023,
    source_record_id: "bcc-physical-programme-2023-06-26-sandy-row-tourism-signage-completed",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee agenda-item date and completed-project overview",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Council physical-programme report does not name signage designers or contractors for this completed-project list item",
    project_type: "tourism trail signage completion",
    geometry_source: "OpenStreetMap/Nominatim point for a Sandy Row information board, used as an approximate marker for the tourism-signage trail context.",
    geometry_precision: "trail approximate",
    limitations:
      "The report lists the tourism trail development among recently completed projects but does not give exact installation date, sign-by-sign locations, interpretation content, contractor, final cost, maintenance plan, or later condition."
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
