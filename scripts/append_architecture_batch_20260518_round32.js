const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastMay2025PhysicalProgrammePdf =
  "https://minutes.belfastcity.gov.uk/documents/s121643/Physical%20Programme%20Update.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_hackney_marshes_centre_completion_2011",
    date: "2011-01-01",
    bucket: "planning/development/architecture/sports community facility",
    title: "Hackney Marshes Centre was listed as built",
    summary:
      "New London Architecture records Hackney Marshes Centre in Hackney as built, with completion in 2011.",
    observed_change:
      "A documented sports and community facility at Hackney Marshes was recorded as reaching built status.",
    area: "Hackney Marshes",
    latitude: 51.5548,
    longitude: -0.0354,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hackney Marshes Centre",
    source_url: "https://nla.london/projects/hackney-marshes-centre",
    source_record_id: "nla-hackney-marshes-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stanton Williams",
    project_type: "sports and community building",
    geometry_source: "Approximate point placed at Hackney Marshes Centre from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; opening programme, sports participation, maintenance, and later park changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hackney_town_hall_restoration_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/civic heritage",
    title: "Hackney Town Hall restoration was listed as built",
    summary:
      "New London Architecture records Hackney Town Hall in Hackney as built after restoration, with completion in January 2017.",
    observed_change:
      "A documented civic heritage restoration project was recorded as reaching built status.",
    area: "Hackney Central",
    latitude: 51.545,
    longitude: -0.0556,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hackney Town Hall",
    source_url: "https://nla.london/projects/hackney-town-hall",
    source_record_id: "nla-hackney-town-hall",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins\\Brown Ltd",
    project_type: "civic building restoration",
    geometry_source: "Approximate point placed at Hackney Town Hall from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records restoration completion month; listed-building consent detail, public-service changes, accessibility outcomes, and later maintenance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_amory_tower_completion_2021",
    date: "2021-10-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Amory Tower was listed as built",
    summary:
      "New London Architecture records Amory Tower in Tower Hamlets as built, with completion in October 2021.",
    observed_change:
      "A documented 53-storey residential tower milestone was recorded on the Isle of Dogs.",
    area: "Isle of Dogs / Tower Hamlets",
    latitude: 51.5015,
    longitude: -0.0167,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Amory Tower",
    source_url: "https://nla.london/projects/amory-tower",
    source_record_id: "nla-amory-tower",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "residential tower",
    geometry_source: "Approximate point placed in the Isle of Dogs project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure mix, occupancy, ground-floor public-realm management, and later building operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_esperance_bridge_completion_2021",
    date: "2021-07-01",
    bucket: "planning/development/architecture/bridge public realm",
    title: "Esperance Bridge was listed as built",
    summary:
      "New London Architecture records Esperance Bridge in Camden as built, with completion in July 2021.",
    observed_change:
      "A documented pedestrian bridge and public-realm connection at King's Cross was recorded as reaching built status.",
    area: "King's Cross / Camden",
    latitude: 51.5352,
    longitude: -0.1244,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Esperance Bridge",
    source_url: "https://nla.london/projects/esperance-bridge",
    source_record_id: "nla-esperance-bridge",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Moxon",
    project_type: "pedestrian bridge and public-realm connection",
    geometry_source: "Approximate point placed at the King's Cross bridge context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; route adoption, bridge operations, accessibility performance, and footfall require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_canal_park_here_east_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/park public realm",
    title: "Canal Park at Here East was listed as built",
    summary:
      "New London Architecture records Canal Park at Here East in Newham as built, with completion in 2017.",
    observed_change:
      "A documented canal-side park and public-realm project at Here East was recorded as reaching built status.",
    area: "Here East / Queen Elizabeth Olympic Park",
    latitude: 51.5472,
    longitude: -0.022,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Canal Park, (Here East) London",
    source_url: "https://nla.london/projects/canal-park-here-east-london",
    source_record_id: "nla-canal-park-here-east-london",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "muf",
    project_type: "canal-side park and public realm",
    geometry_source: "Approximate point placed at the Here East canal-side project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; public-access management, landscape maintenance, ecological outcomes, and later Olympic Park changes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_innovation_queens_text_adopted_2022",
    date: "2022-11-22",
    bucket: "planning/development/zoning/mixed use district",
    title: "Innovation Queens zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Innovation Queens, N 220367 ZRQ, with an adopted date of November 22, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Innovation Queens area in Astoria.",
    area: "Astoria / Queens",
    latitude: 40.756,
    longitude: -73.925,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Innovation Queens",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/innovation-queens-n-220367-zrq",
    source_record_id: "nyc-zr-innovation-queens-n-220367-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "area-related zoning text amendment",
    geometry_source: "Approximate district point placed in Astoria rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, public-realm delivery, occupancy, or later site designs."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_willets_point_phase_ii_text_adopted_2024",
    date: "2024-04-11",
    bucket: "planning/development/zoning/mixed use district",
    title: "Willets Point Phase II zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Willets Point Phase II, N 240093 ZRQ, with an adopted date of April 11, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the Willets Point Phase II area in Queens.",
    area: "Willets Point / Queens",
    latitude: 40.755,
    longitude: -73.845,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Willets Point Phase II",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/willets-point-phase-ii-n-240093-zrq",
    source_record_id: "nyc-zr-willets-point-phase-ii-n-240093-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "area-related zoning text amendment",
    geometry_source: "Approximate district point placed in Willets Point rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, stadium or housing delivery, public-realm delivery, occupancy, or later site designs."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brownsville_arts_center_apartments_map_adopted_2024",
    date: "2024-03-19",
    bucket: "planning/development/zoning/arts housing",
    title: "Brownsville Arts Center and Apartments zoning map change was adopted",
    summary:
      "The NYC Zoning Resolution records Brownsville Arts Center and Apartments, N 240031 ZRK, with an adopted date of March 19, 2024.",
    observed_change:
      "A documented zoning map milestone was recorded for the Brownsville Arts Center and Apartments project area in Brooklyn.",
    area: "Brownsville / Brooklyn",
    latitude: 40.666,
    longitude: -73.908,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Brownsville Arts Center and Apartments",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/brownsville-arts-center-and-apartments-n-240031-zrk",
    source_record_id: "nyc-zr-brownsville-arts-center-and-apartments-n-240031-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning map amendment",
    geometry_source: "Approximate neighborhood point placed in Brownsville rather than a mapped zoning boundary.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records zoning map adoption only. It does not confirm permits, construction, cultural-facility delivery, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_msg_arena_text_adopted_2023",
    date: "2023-09-14",
    bucket: "planning/development/zoning/arena special permit",
    title: "MSG Arena zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records MSG Arena, N 230240 ZRM, with an adopted date of September 14, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for Madison Square Garden's arena site in Manhattan.",
    area: "Madison Square Garden / Midtown Manhattan",
    latitude: 40.7505,
    longitude: -73.9934,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: MSG Arena",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/msg-arena-n-230240-zrm",
    source_record_id: "nyc-zr-msg-arena-n-230240-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "arena zoning text amendment",
    geometry_source: "Approximate point placed at Madison Square Garden rather than a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm arena renovation, station-area construction, permit compliance, operations, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_halletts_north_text_adopted_2022",
    date: "2022-09-29",
    bucket: "planning/development/zoning/waterfront mixed use",
    title: "Halletts North zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Halletts North, N 220197 ZRQ, with an adopted date of September 29, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the Halletts North waterfront project area in Astoria.",
    area: "Halletts Point / Queens",
    latitude: 40.776,
    longitude: -73.934,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Halletts North",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/halletts-north-n-220197-zrq",
    source_record_id: "nyc-zr-halletts-north-n-220197-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "waterfront mixed-use zoning text amendment",
    geometry_source: "Approximate district point placed at Halletts Point rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, waterfront public access delivery, construction, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_historic_tiled_street_signs_stage2_uncommitted_2025",
    date: "2025-05-23",
    bucket: "planning/development/heritage public realm",
    title: "Historic Tiled Street Signs moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 23 May 2025 recorded agreement that Historic Tiled Street Signs move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast's historic tiled street-sign project.",
    area: "Belfast citywide",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme, 23 May 2025",
    source_url: belfastMay2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-05-23-historic-tiled-street-signs-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and heritage/public-realm project team; design team not named in the report",
    project_type: "heritage public-realm options milestone",
    geometry_source: "Citywide programme represented by an approximate Belfast City Hall point because the report does not list individual sign locations.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm surveyed sign locations, final conservation design, procurement, works start, completion, maintenance, or heritage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_historic_cemeteries_phase1_stage2_uncommitted_2025",
    date: "2025-05-23",
    bucket: "planning/development/heritage landscape",
    title: "Historic Cemeteries Phase 1 moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 23 May 2025 recorded agreement that a first phase of Historic Cemeteries move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for the first phase of Belfast's historic cemeteries programme.",
    area: "Belfast historic cemeteries",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme, 23 May 2025",
    source_url: belfastMay2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-05-23-historic-cemeteries-phase-1-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and heritage/open-space project team; design team not named in the report",
    project_type: "historic cemetery options milestone",
    geometry_source: "Multi-site heritage programme represented by an approximate Belfast City Hall point because the report does not list mapped cemetery sites for this phase.",
    geometry_precision: "multiple sites",
    limitations:
      "The event records Stage 2 programme status only. It does not identify final cemetery sites, conservation designs, funding, procurement, works start, completion, access changes, or heritage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_bridges_improvement_phase1_stage2_uncommitted_2025",
    date: "2025-05-23",
    bucket: "planning/development/bridge infrastructure",
    title: "Bridges Improvement Programme Phase 1 moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 23 May 2025 recorded agreement that the first phase of the Bridges Improvement Programme move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for the first phase of Belfast's bridge-improvement programme.",
    area: "Belfast citywide bridge assets",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme, 23 May 2025",
    source_url: belfastMay2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-05-23-bridges-improvement-programme-phase-1-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and bridges/assets project team; design team not named in the report",
    project_type: "bridge asset options milestone",
    geometry_source: "Citywide bridge-assets programme represented by an approximate Belfast City Hall point because the report does not list individual bridge locations.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 2 programme status only. It does not identify bridge sites, structural condition, design options, funding approval, procurement, works start, completion, or asset-condition outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_communications_boards_stage2_uncommitted_2025",
    date: "2025-05-23",
    bucket: "planning/development/accessibility public realm",
    title: "Communications Boards moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 23 May 2025 recorded agreement that Communications Boards move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast's communications-board accessibility project.",
    area: "Belfast parks and public spaces",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme, 23 May 2025",
    source_url: belfastMay2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-05-23-communications-boards-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and accessibility/open-space project team; design team not named in the report",
    project_type: "accessibility signage options milestone",
    geometry_source: "Multi-site accessibility programme represented by an approximate Belfast City Hall point because the report does not list individual board locations.",
    geometry_precision: "multiple sites",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final sites, board designs, procurement, installation, maintenance, user testing, or accessibility outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ulster_hall_lighting_stage2_uncommitted_2025",
    date: "2025-05-23",
    bucket: "planning/development/civic heritage lighting",
    title: "Ulster Hall Lighting Scheme moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 23 May 2025 recorded agreement that the Ulster Hall Lighting Scheme move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for proposed facade lighting at Ulster Hall.",
    area: "Ulster Hall / Bedford Street",
    latitude: 54.5952,
    longitude: -5.9324,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme, 23 May 2025",
    source_url: belfastMay2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-05-23-ulster-hall-lighting-scheme-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Linen Quarter BID; lighting design team not named in the report",
    project_type: "listed civic-building lighting options milestone",
    geometry_source: "Approximate point geocoded from Ulster Hall on Bedford Street.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final lighting design, listed-building approvals, funding agreement, procurement, installation, operation, or public-realm outcomes."
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
