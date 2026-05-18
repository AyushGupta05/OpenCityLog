const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycGarmentLandmarksRelease =
  "https://www.nyc.gov/site/lpc/about/pr2025/lpc-designates-five-garment-industry-related-buildings.page";
const belfastCompletedProjectsMar2025Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s121132/Appendix%201%20-%20Completed%20projects%20Mar25.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_walworth_town_hall_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/civic retrofit",
    title: "Walworth Town Hall was listed as built",
    summary:
      "New London Architecture records Walworth Town Hall in Southwark as built, with completion in January 2025.",
    observed_change:
      "A documented civic-building retrofit and reuse project on Walworth Road was recorded as reaching built status.",
    area: "Walworth / Southwark",
    latitude: 51.489,
    longitude: -0.095,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Walworth Town Hall",
    source_url: "https://nla.london/projects/walworth-town-hall-1",
    source_record_id: "nla-walworth-town-hall-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Feix&Merlin Architects",
    project_type: "civic heritage retrofit and reuse",
    geometry_source: "Approximate point placed at 151 Walworth Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenancy, public access, long-term management, and heritage-condition outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_sydenham_hill_completion_2025",
    date: "2025-06-01",
    bucket: "planning/development/architecture/landscape public realm",
    title: "Sydenham Hill was listed as built",
    summary:
      "New London Architecture records Sydenham Hill in Lewisham as built, with estimated completion in June 2025.",
    observed_change:
      "A documented landscape and public-realm project at Sydenham Hill was recorded as reaching built status.",
    area: "Sydenham Hill / Lewisham",
    latitude: 51.431,
    longitude: -0.073,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Sydenham Hill",
    source_url: "https://nla.london/projects/sydenham-hill",
    source_record_id: "nla-sydenham-hill",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown and TO Studio landscape team",
    project_type: "landscape and public-realm project",
    geometry_source: "Approximate point placed on Sydenham Hill from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and labels the completion month as estimated. The event records built status as listed; opening arrangements, maintenance, ecological outcomes, and final handover date require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_cafe_conversion_putney_lodge_completion_2025",
    date: "2025-05-01",
    bucket: "planning/development/architecture/adaptive reuse",
    title: "Cafe Conversion at Putney Lodge was listed as built",
    summary:
      "New London Architecture records Cafe Conversion at Putney Lodge in Wandsworth as built, with completion in May 2025.",
    observed_change:
      "A documented small-scale adaptive-reuse project at Wandsworth Cemetery was recorded as reaching built status.",
    area: "Wandsworth Cemetery / Wandsworth",
    latitude: 51.467,
    longitude: -0.221,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Cafe Conversion at Putney Lodge",
    source_url: "https://nla.london/projects/cafe-conversion-at-putney-lodge",
    source_record_id: "nla-cafe-conversion-at-putney-lodge",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Roger Mears Architects LLP",
    project_type: "adaptive reuse and cafe conversion",
    geometry_source: "Approximate point placed at Wandsworth Cemetery from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; trading start, hours, conservation details, accessibility, and cemetery operations require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_watts_close_completion_2024",
    date: "2024-02-01",
    bucket: "planning/development/architecture/council housing",
    title: "Watts Close was listed as built",
    summary:
      "New London Architecture records Watts Close in Haringey as built, with completion in February 2024.",
    observed_change:
      "A documented council-led housing project at Watts Close was recorded as reaching built status.",
    area: "Watts Close / Haringey",
    latitude: 51.589,
    longitude: -0.086,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Watts Close",
    source_url: "https://nla.london/projects/watts-close",
    source_record_id: "nla-watts-close",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "New Ground",
    project_type: "council housing completion",
    geometry_source: "Approximate point placed on Watts Close from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; allocation, occupation, tenancy mix, cost, and later estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_millbrook_park_completion_2024",
    date: "2024-08-01",
    bucket: "planning/development/architecture/housing",
    title: "Millbrook Park was listed as built",
    summary:
      "New London Architecture records Millbrook Park in Barnet as built, with completion in August 2024.",
    observed_change:
      "A documented housing-led project at Millbrook Park was recorded as reaching built status.",
    area: "Millbrook Park / Barnet",
    latitude: 51.615,
    longitude: -0.187,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Millbrook Park",
    source_url: "https://nla.london/projects/millbrook-park",
    source_record_id: "nla-millbrook-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Broadway Malyan",
    project_type: "housing-led development completion",
    geometry_source: "Approximate point placed at Millbrook Park from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; phasing, occupation, tenure mix, infrastructure delivery, and later estate management require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_barbey_building_landmark_designated_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "Barbey Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Barbey Building at 15 West 38th Street as an individual landmark on August 12, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Barbey Building to individual landmark.",
    area: "Midtown South / Manhattan",
    latitude: 40.751,
    longitude: -73.984,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five garment industry-related landmarks",
    source_url: nycGarmentLandmarksRelease,
    source_record_id: "nyc-lpc-2025-08-12-barbey-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 15 West 38th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_fashion_tower_landmark_designated_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "Fashion Tower was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Fashion Tower at 135 West 36th Street as an individual landmark on August 12, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of Fashion Tower to individual landmark.",
    area: "Garment District / Manhattan",
    latitude: 40.752,
    longitude: -73.988,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five garment industry-related landmarks",
    source_url: nycGarmentLandmarksRelease,
    source_record_id: "nyc-lpc-2025-08-12-fashion-tower",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 135 West 36th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_furcraft_building_landmark_designated_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "Furcraft Building was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Furcraft Building at 242-246 West 30th Street as an individual landmark on August 12, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Furcraft Building to individual landmark.",
    area: "Garment District / Manhattan",
    latitude: 40.749,
    longitude: -73.994,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five garment industry-related landmarks",
    source_url: nycGarmentLandmarksRelease,
    source_record_id: "nyc-lpc-2025-08-12-furcraft-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 242-246 West 30th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_29th_street_towers_landmark_designated_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "29th Street Towers were designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of 29th Street Towers at 214 and 224 West 29th Street as an individual landmark on August 12, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of 29th Street Towers to individual landmark.",
    area: "Garment District / Manhattan",
    latitude: 40.748,
    longitude: -73.992,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five garment industry-related landmarks",
    source_url: nycGarmentLandmarksRelease,
    source_record_id: "nyc-lpc-2025-08-12-29th-street-towers",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 214 and 224 West 29th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_lefcourt_clothing_center_landmark_designated_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/landmark designation",
    title: "Lefcourt Clothing Center was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Lefcourt Clothing Center at 275 Seventh Avenue as an individual landmark on August 12, 2025.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Lefcourt Clothing Center to individual landmark.",
    area: "Garment District / Manhattan",
    latitude: 40.746,
    longitude: -73.994,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: five garment industry-related landmarks",
    source_url: nycGarmentLandmarksRelease,
    source_record_id: "nyc-lpc-2025-08-12-lefcourt-clothing-center",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "LPC-designated historic commercial building; original architect details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 275 Seventh Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or any later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_henry_jones_playing_fields_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/sports infrastructure",
    title: "Henry Jones Playing Fields project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for March 2025 listed Henry Jones Playing Fields among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project at Henry Jones Playing Fields.",
    area: "Henry Jones Playing Fields / Castlereagh",
    latitude: 54.575,
    longitude: -5.866,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-henry-jones-playing-fields",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/open-space project team; design team not named in the appendix",
    project_type: "sports/open-space project completion",
    geometry_source: "Approximate point placed at Henry Jones Playing Fields because the appendix does not map the works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed by the March 2025 reporting point but does not provide an exact completion date, works specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belvoir_activity_centre_muga_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/sports infrastructure",
    title: "Belvoir Activity Centre MUGA was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for March 2025 listed Belvoir Activity Centre MUGA among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed multi-use games area project at Belvoir Activity Centre.",
    area: "Belvoir Activity Centre / South Belfast",
    latitude: 54.548,
    longitude: -5.918,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-belvoir-activity-centre-muga",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and sports/open-space project team; design team not named in the appendix",
    project_type: "multi-use games area completion",
    geometry_source: "Approximate point placed at Belvoir Activity Centre because the appendix does not map the MUGA works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed by the March 2025 reporting point but does not provide an exact completion date, surface specification, contract record, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_duncrue_eurobin_workshop_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/waste infrastructure",
    title: "Duncrue Eurobin Workshop facility was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for March 2025 listed Duncrue Eurobin Workshop facility among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed workshop-facility project at Duncrue.",
    area: "Duncrue",
    latitude: 54.625,
    longitude: -5.913,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-duncrue-eurobin-workshop-facility",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and waste infrastructure project team; contractor not named in the appendix",
    project_type: "waste-service workshop facility completion",
    geometry_source: "Approximate point placed in Duncrue industrial area because the appendix does not map the facility.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed by the March 2025 reporting point but does not provide an exact completion date, facility address, workshop specification, contract record, cost, operational change, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_upsurge_botanic_gardens_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/green infrastructure",
    title: "UPSURGE Botanic Gardens project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for March 2025 listed UPSURGE Botanic Gardens among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed green-infrastructure project associated with Botanic Gardens.",
    area: "Botanic Gardens",
    latitude: 54.582,
    longitude: -5.934,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-upsurge-botanic-gardens",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and UPSURGE project partners; design team not named in the appendix",
    project_type: "green infrastructure/public realm completion",
    geometry_source: "Approximate point placed at Botanic Gardens because the appendix does not map the project boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed by the March 2025 reporting point but does not provide an exact completion date, nature-based intervention details, monitoring data, cost, maintenance plan, or ecological outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_grampian_avenue_playground_completed_2025",
    date: "2025-03-24",
    bucket: "planning/development/playground public realm",
    title: "Grampian Avenue Playground was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for March 2025 listed Grampian Avenue Playground among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed playground project at Grampian Avenue.",
    area: "Grampian Avenue",
    latitude: 54.598,
    longitude: -5.886,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: March 2025",
    source_url: belfastCompletedProjectsMar2025Pdf,
    source_record_id: "bcc-physical-completed-2025-03-grampian-avenue-playground",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/play project team; design team not named in the appendix",
    project_type: "playground completion",
    geometry_source: "Approximate point placed at Grampian Avenue because the appendix does not map the playground works.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed by the March 2025 reporting point but does not provide an exact completion date, play-equipment specification, contract record, cost, accessibility outcome, or maintenance plan."
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
