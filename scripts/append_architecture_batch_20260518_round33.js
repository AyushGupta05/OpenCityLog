const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastApr2025PhysicalProgrammePdf =
  "https://minutes.belfastcity.gov.uk/documents/s121131/Physical%20Programme%20Update.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_sands_end_arts_community_centre_completion_2020",
    date: "2020-09-01",
    bucket: "planning/development/architecture/community arts",
    title: "Sands End Arts and Community Centre was listed as built",
    summary:
      "New London Architecture records Sands End Arts and Community Centre in Hammersmith as built, with completion in September 2020.",
    observed_change:
      "A documented community and arts facility was recorded as reaching built status in Sands End.",
    area: "Sands End / Fulham",
    latitude: 51.4731,
    longitude: -0.1962,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Sands End Arts and Community Centre",
    source_url: "https://nla.london/projects/sands-end-arts-and-community-centre",
    source_record_id: "nla-sands-end-arts-and-community-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Mae",
    project_type: "community arts centre",
    geometry_source: "Approximate point placed at the named Sands End project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; programming, public access, operating model, and later community use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_granary_square_pavilion_completion_2019",
    date: "2019-03-01",
    bucket: "planning/development/architecture/public realm amenity",
    title: "Granary Square Pavilion was listed as built",
    summary:
      "New London Architecture records Granary Square Pavilion in Camden as built, with completion in March 2019.",
    observed_change:
      "A documented pavilion and public-amenity building at Granary Square was recorded as reaching built status.",
    area: "King's Cross / Granary Square",
    latitude: 51.535,
    longitude: -0.1255,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Granary Square Pavilion",
    source_url: "https://nla.london/projects/granary-square-pavilion",
    source_record_id: "nla-granary-square-pavilion",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "public-realm pavilion and amenity building",
    geometry_source: "Approximate point placed at Granary Square from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; lease operation, public access, maintenance, and later King's Cross estate changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_development_house_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/workplace public realm",
    title: "Development House was listed as built",
    summary:
      "New London Architecture records Development House in Hackney as built, with completion in 2022.",
    observed_change:
      "A documented workplace-led development replacing an older building was recorded as reaching built status.",
    area: "Shoreditch / Hackney",
    latitude: 51.5252,
    longitude: -0.0833,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Development House",
    source_url: "https://nla.london/projects/development-house",
    source_record_id: "nla-development-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris",
    project_type: "workplace-led development",
    geometry_source: "Approximate point placed in the Shoreditch/Hackney project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; tenancy, employment, public-realm management, and later building operation require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_claremont_park_brent_cross_town_completion_2022",
    date: "2022-05-01",
    bucket: "planning/development/architecture/park landscape",
    title: "Claremont Park at Brent Cross Town was listed as built",
    summary:
      "New London Architecture records Claremont Park at Brent Cross Town in Barnet as built, with completion in May 2022.",
    observed_change:
      "A documented park and landscape project at Brent Cross Town was recorded as reaching built status.",
    area: "Brent Cross Town / Barnet",
    latitude: 51.573,
    longitude: -0.223,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Claremont Park, Brent Cross Town",
    source_url: "https://nla.london/projects/claremont-park-brent-cross-town",
    source_record_id: "nla-claremont-park-brent-cross-town",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "park and landscape public realm",
    geometry_source: "Approximate point placed at Claremont Park in the Brent Cross Town project context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; estate management, park use, maintenance, biodiversity, and later Brent Cross Town phases require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_brunel_building_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/workplace waterside",
    title: "Brunel Building was listed as built",
    summary:
      "New London Architecture records Brunel Building in Westminster as built, with completion in May 2019.",
    observed_change:
      "A documented workplace building at Paddington Basin was recorded as reaching built status.",
    area: "Paddington Basin",
    latitude: 51.5175,
    longitude: -0.1764,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Brunel Building",
    source_url: "https://nla.london/projects/brunel-building",
    source_record_id: "nla-brunel-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "waterside workplace building",
    geometry_source: "Approximate point placed at Paddington Basin from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenancy, waterside access, public-realm operation, and later Paddington Basin changes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_otis_elevator_building_text_adopted_2023",
    date: "2023-03-16",
    bucket: "planning/development/zoning/adaptive reuse",
    title: "Otis Elevator Building zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Otis Elevator Building (260 Eleventh Avenue), N 230045 ZRM, with an adopted date of March 16, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the former Otis Elevator Building site in Manhattan.",
    area: "260 Eleventh Avenue / West Chelsea",
    latitude: 40.7506,
    longitude: -74.0052,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Otis Elevator Building (260 Eleventh Avenue)",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/otis-elevator-building-260-eleventh-avenue-n-230045-zrm",
    source_record_id: "nyc-zr-otis-elevator-building-260-eleventh-avenue-n-230045-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Eleventh Avenue address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, adaptive-reuse construction, occupancy, landmark review, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1289_atlantic_avenue_text_adopted_2024",
    date: "2024-05-16",
    bucket: "planning/development/zoning/housing mixed use",
    title: "1289 Atlantic Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1289 Atlantic Avenue, N 200293 ZRK, with an adopted date of May 16, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1289 Atlantic Avenue project area in Brooklyn.",
    area: "Atlantic Avenue / Brooklyn",
    latitude: 40.678,
    longitude: -73.949,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1289 Atlantic Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/1289-atlantic-avenue-n-200293-zrk",
    source_record_id: "nyc-zr-1289-atlantic-avenue-n-200293-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Atlantic Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, retail occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_east_94th_street_text_adopted_2024",
    date: "2024-03-19",
    bucket: "planning/development/zoning/residential",
    title: "East 94th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records East 94th Street, N 230242 ZRM, with an adopted date of March 19, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the East 94th Street project area in Manhattan.",
    area: "East 94th Street / Manhattan",
    latitude: 40.784,
    longitude: -73.947,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: East 94th Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/east-94th-street-n-230242-zrm",
    source_record_id: "nyc-zr-east-94th-street-n-230242-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point placed on East 94th Street in Manhattan, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jennings_hall_expansion_text_adopted_2024",
    date: "2024-03-19",
    bucket: "planning/development/zoning/institutional housing",
    title: "Jennings Hall Expansion zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Jennings Hall Expansion, N 230256 ZRK, with an adopted date of March 19, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the Jennings Hall Expansion project area in Brooklyn.",
    area: "Williamsburg / Brooklyn",
    latitude: 40.713,
    longitude: -73.942,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Jennings Hall Expansion",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/jennings-hall-expansion-n-230256-zrk",
    source_record_id: "nyc-zr-jennings-hall-expansion-n-230256-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate neighborhood point placed in Williamsburg, not a mapped zoning boundary.",
    geometry_precision: "neighborhood approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, institutional housing expansion, construction, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_23_10_queens_plaza_south_text_adopted_2023",
    date: "2023-05-11",
    bucket: "planning/development/zoning/mixed use",
    title: "23-10 Queens Plaza South zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 23-10 Queens Plaza South, N 210318 ZRQ, with an adopted date of May 11, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 23-10 Queens Plaza South project area in Long Island City.",
    area: "Queens Plaza / Long Island City",
    latitude: 40.751,
    longitude: -73.94,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 23-10 Queens Plaza South",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/23-10-queens-plaza-south-n-210318-zrq",
    source_record_id: "nyc-zr-23-10-queens-plaza-south-n-210318-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Queens Plaza South project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_zoo_hs_works_stage2_uncommitted_2025",
    date: "2025-04-18",
    bucket: "planning/development/civic asset safety",
    title: "Belfast Zoo Health and Safety Works moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 18 April 2025 recorded agreement that Belfast Zoo Health and Safety Works move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for health and safety works at Belfast Zoo.",
    area: "Belfast Zoo",
    latitude: 54.657,
    longitude: -5.943,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 18 April 2025",
    source_url: belfastApr2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-04-18-belfast-zoo-health-safety-works-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and zoo/assets project team; design team not named in the report",
    project_type: "zoo asset health and safety options milestone",
    geometry_source: "Approximate point placed at Belfast Zoo because the report does not map individual works locations.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 2 programme status only. It does not identify final works packages, procurement, construction, completion, operational disruption, animal-care effects, or asset-condition outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_35_39_royal_avenue_hs_works_stage2_uncommitted_2025",
    date: "2025-04-18",
    bucket: "planning/development/civic asset safety",
    title: "35-39 Royal Avenue Health and Safety Works moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 18 April 2025 recorded agreement that 35-39 Royal Avenue Health and Safety Works move to Stage 2 - Uncommitted to allow options to be fully worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for health and safety works at 35-39 Royal Avenue.",
    area: "35-39 Royal Avenue",
    latitude: 54.601,
    longitude: -5.9286,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 18 April 2025",
    source_url: belfastApr2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-04-18-35-39-royal-avenue-health-safety-works-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and city-centre assets project team; design team not named in the report",
    project_type: "city-centre asset health and safety options milestone",
    geometry_source: "Approximate point geocoded from the named Royal Avenue address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final design, statutory approvals, procurement, works start, completion, occupancy, or long-term use model."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_victoria_park_basketball_upgrade_stage1_emerging_2025",
    date: "2025-04-18",
    bucket: "planning/development/sports public realm",
    title: "Victoria Park Basketball upgrade was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 18 April 2025 recorded agreement that Victoria Park Basketball upgrade be added to the Capital Programme at Stage 1 - Emerging to allow business cases and designs to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for a proposed basketball upgrade at Victoria Park.",
    area: "Victoria Park",
    latitude: 54.605,
    longitude: -5.876,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 18 April 2025",
    source_url: belfastApr2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-04-18-victoria-park-basketball-upgrade-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/sports project team; design team not named in the report",
    project_type: "park sports-court business-case milestone",
    geometry_source: "Approximate point placed at Victoria Park because the report does not map the court works.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm final court design, funding approval, procurement, works start, completion, use levels, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_ebikes_stage1_emerging_2025",
    date: "2025-04-18",
    bucket: "planning/development/active travel infrastructure",
    title: "Belfast Bikes eBikes was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 18 April 2025 recorded agreement that Belfast Bikes eBikes be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for the Belfast Bikes eBikes proposal.",
    area: "Belfast Bikes network",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 18 April 2025",
    source_url: belfastApr2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-04-18-belfast-bikes-ebikes-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier or design team not named in the report",
    project_type: "active-travel infrastructure business-case milestone",
    geometry_source: "Citywide network proposal represented by an approximate Belfast City Hall point because the report does not list docking-station or route locations.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm business-case approval, docking-station changes, fleet procurement, charging infrastructure, implementation, ridership, or operational outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_under_the_bridges_stage1_emerging_2025",
    date: "2025-04-18",
    bucket: "planning/development/public realm active travel",
    title: "Under the Bridges was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee Physical Programme reporting for 18 April 2025 recorded agreement that Under the Bridges be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for proposed connectivity, active travel, and public-realm enhancements under the M3 bridges.",
    area: "M3 bridges / Belfast city centre",
    latitude: 54.603,
    longitude: -5.916,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee report: Physical Programme Update, 18 April 2025",
    source_url: belfastApr2025PhysicalProgrammePdf,
    source_record_id: "bcc-spr-2025-04-18-under-the-bridges-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project partners; design team not named in the report",
    project_type: "public realm and active-travel business-case milestone",
    geometry_source: "Approximate corridor point placed near the M3 bridges because the report does not provide a mapped project boundary.",
    geometry_precision: "corridor",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm design option selection, approvals, funding, procurement, construction, completion, or route/public-realm outcomes."
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
