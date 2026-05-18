const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCompletedProjectsDec2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s119193/Appendix%201%20-%20Physical%20Programme%20Completed%20projects%20Dec%2024.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_central_middlesex_hospital_affordable_homes_completion_2025",
    date: "2025-05-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Central Middlesex Hospital affordable homes were listed as built",
    summary:
      "New London Architecture records Central Middlesex Hospital in Brent as built, with completion in May 2025 for 158 affordable homes near the hospital.",
    observed_change:
      "A documented affordable-housing project near Central Middlesex Hospital was recorded as reaching built status.",
    area: "Park Royal / Central Middlesex Hospital",
    latitude: 51.5315,
    longitude: -0.2728,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Central Middlesex Hospital",
    source_url: "https://nla.london/projects/central-middlesex-hospital",
    source_record_id: "nla-central-middlesex-hospital",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Haworth Tompkins",
    project_type: "affordable housing near hospital campus",
    geometry_source: "Approximate point placed at the Central Middlesex Hospital/Park Royal project context.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocation, occupancy, estate management, and health-campus integration require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_fore_street_library_retrofit_completion_2022",
    date: "2022-01-01",
    bucket: "planning/development/architecture/library retrofit",
    title: "Fore Street Library retrofit was listed as built",
    summary:
      "New London Architecture records Fore Street Library in Enfield as built, with completion in 2022.",
    observed_change:
      "A documented library retrofit project in Enfield was recorded as reaching built status.",
    area: "Fore Street / Edmonton",
    latitude: 51.613,
    longitude: -0.066,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Fore Street Library",
    source_url: "https://nla.london/projects/fore-street-library",
    source_record_id: "nla-fore-street-library",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "public library retrofit",
    geometry_source: "Approximate point placed on Fore Street in Edmonton from the named library location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; library service changes, access, programme use, and later operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_plashet_road_housing_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/residential",
    title: "Plashet Road housing was listed as built",
    summary:
      "New London Architecture records Plashet Road in Newham as built, with completion in January 2024.",
    observed_change:
      "A documented residential development on Plashet Road was recorded as reaching built status.",
    area: "Plashet / East Ham",
    latitude: 51.538,
    longitude: 0.046,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Plashet Road",
    source_url: "https://nla.london/projects/plashet-road",
    source_record_id: "nla-plashet-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Levitt Bernstein",
    project_type: "residential development",
    geometry_source: "Approximate point placed on Plashet Road in Newham from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure mix, occupancy, maintenance, and later residential management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_300_harrow_road_housing_completion_2024",
    date: "2024-01-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "300 Harrow Road housing was listed as built",
    summary:
      "New London Architecture records 300 Harrow Road in Westminster as built, with completion in January 2024.",
    observed_change:
      "A documented housing development on Harrow Road was recorded as reaching built status.",
    area: "Harrow Road / Westminster",
    latitude: 51.522,
    longitude: -0.194,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 300 Harrow Road",
    source_url: "https://nla.london/projects/300-harrow-road",
    source_record_id: "nla-300-harrow-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Child Graddon Lewis",
    project_type: "housing development",
    geometry_source: "Approximate point placed on Harrow Road in Westminster from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure mix, allocations, occupancy, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_burridge_gardens_social_rent_completion_2023",
    date: "2023-10-01",
    bucket: "planning/development/architecture/social rent housing",
    title: "Burridge Gardens social-rent apartments were listed as built",
    summary:
      "New London Architecture records Burridge Gardens in Wandsworth as built, with completion in October 2023.",
    observed_change:
      "A documented social-rent apartment project above a community centre was recorded as reaching built status.",
    area: "Burridge Gardens / Wandsworth",
    latitude: 51.462,
    longitude: -0.183,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Burridge Gardens",
    source_url: "https://nla.london/projects/burridge-gardens",
    source_record_id: "nla-burridge-gardens",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins\\Brown Ltd",
    project_type: "social-rent apartments above community centre",
    geometry_source: "Approximate point placed at the Burridge Gardens project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocations, accessibility performance, community-centre operation, and later management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1810_randall_avenue_text_adopted_2022",
    date: "2022-08-11",
    bucket: "planning/development/zoning/residential mixed use",
    title: "1810 Randall Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1810 Randall Ave, N 220204 ZRX, with an adopted date of August 11, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1810 Randall Avenue project area in the Bronx.",
    area: "Randall Avenue / Bronx",
    latitude: 40.817,
    longitude: -73.86,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1810 Randall Ave",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/1810-randall-ave-n-220204-zrx",
    source_record_id: "nyc-zr-1810-randall-ave-n-220204-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Randall Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_lirio_mta_site_806_9th_avenue_text_adopted_2022",
    date: "2022-08-11",
    bucket: "planning/development/zoning/affordable housing mixed use",
    title: "The Lirio/MTA site - 806 9th Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records The Lirio/MTA site - 806 9th Avenue, N 220219 ZRM, with an adopted date of August 11, 2022.",
    observed_change:
      "A documented zoning text milestone was recorded for the 806 9th Avenue project area in Manhattan.",
    area: "806 9th Avenue / Hell's Kitchen",
    latitude: 40.766,
    longitude: -73.987,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: The Lirio/MTA site - 806 9th Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/liriomta-site-806-9th-avenue-n-220219-zrm",
    source_record_id: "nyc-zr-liriomta-site-806-9th-avenue-n-220219-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named 9th Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, MTA-site disposition, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_104_05_109th_avenue_text_adopted_2023",
    date: "2023-05-25",
    bucket: "planning/development/zoning/residential mixed use",
    title: "104-05 109th Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 104-05 109th Avenue, N 220268 ZRQ, with an adopted date of May 25, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 104-05 109th Avenue project area in Queens.",
    area: "South Richmond Hill / Queens",
    latitude: 40.684,
    longitude: -73.837,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 104-05 109th Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/104-05-109th-avenue-n-220268-zrq",
    source_record_id: "nyc-zr-104-05-109th-avenue-n-220268-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named 109th Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_2560_boston_road_text_adopted_2023",
    date: "2023-05-11",
    bucket: "planning/development/zoning/residential mixed use",
    title: "2560 Boston Road zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2560 Boston Road, N 220284 ZRX, with an adopted date of May 11, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2560 Boston Road project area in the Bronx.",
    area: "Boston Road / Bronx",
    latitude: 40.866,
    longitude: -73.857,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2560 Boston Road",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2560-boston-road-n-220284-zrx",
    source_record_id: "nyc-zr-2560-boston-road-n-220284-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Boston Road project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_42_18_31st_avenue_text_adopted_2023",
    date: "2023-10-05",
    bucket: "planning/development/zoning/residential mixed use",
    title: "42-18 31st Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 42-18 31st Avenue, N 230013 ZRQ, with an adopted date of October 5, 2023.",
    observed_change:
      "A documented zoning text milestone was recorded for the 42-18 31st Avenue project area in Queens.",
    area: "Astoria / Queens",
    latitude: 40.761,
    longitude: -73.916,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 42-18 31st Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/42-18-31st-avenue-n-230013-zrq",
    source_record_id: "nyc-zr-42-18-31st-avenue-n-230013-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named 31st Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_berlin_swifts_fc_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports infrastructure",
    title: "Berlin Swifts FC project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Berlin Swifts FC among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project associated with Berlin Swifts FC.",
    area: "Berlin Swifts FC / Belfast",
    latitude: 54.61,
    longitude: -5.97,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-berlin-swifts-fc",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/open-space project team; design team not named in the appendix",
    project_type: "sports facility completion",
    geometry_source: "Approximate Belfast project point because the appendix names the club but does not map the works location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_the_mount_muga_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/sports public realm",
    title: "The Mount MUGA was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed The Mount MUGA among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed multi-use games area project at The Mount.",
    area: "The Mount",
    latitude: 54.593,
    longitude: -5.895,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-the-mount-muga",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/sports project team; design team not named in the appendix",
    project_type: "multi-use games area completion",
    geometry_source: "Approximate point placed at The Mount because the appendix does not map the MUGA.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, court specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_flora_street_play_park_resurfacing_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/playground public realm",
    title: "Flora Street Play Park resurfacing was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Flora Street Play Park Resurfacing among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed resurfacing works at Flora Street Play Park.",
    area: "Flora Street Play Park",
    latitude: 54.602,
    longitude: -5.951,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-flora-street-play-park-resurfacing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/play project team; design team not named in the appendix",
    project_type: "play park resurfacing completion",
    geometry_source: "Approximate point placed at Flora Street because the appendix does not map the resurfacing works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, resurfacing specification, contract record, cost, accessibility outcome, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_alexandra_park_hrwc_pedestrian_access_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/pedestrian access public realm",
    title: "Pedestrian access at Alexandra Park HRWC was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Pedestrian Access at Alexandra Park HRWC among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed pedestrian-access works at Alexandra Park HRWC.",
    area: "Alexandra Park / Household Recycling Waste Centre",
    latitude: 54.621,
    longitude: -5.925,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-alexandra-park-hrwc-pedestrian-access",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and waste/parks access project team; design team not named in the appendix",
    project_type: "pedestrian access completion",
    geometry_source: "Approximate point placed near Alexandra Park and the household recycling/waste centre context because the appendix does not map the access works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, access design, contract record, cost, safety audit, or usage outcome."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_napier_park_boundary_works_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/boundary public realm",
    title: "Napier Park Boundary Works were reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Napier Park Boundary Works among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed boundary works at Napier Park.",
    area: "Napier Park",
    latitude: 54.562,
    longitude: -5.962,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-napier-park-boundary-works",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/assets project team; design team not named in the appendix",
    project_type: "park boundary works completion",
    geometry_source: "Approximate point placed at Napier Park because the appendix does not map the boundary works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, boundary specification, contract record, cost, maintenance plan, or public-access outcome."
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
