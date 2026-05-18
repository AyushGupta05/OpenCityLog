const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const nycJacobDayRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-the-jacob-day-residence.page";
const nycWilloughbyHartRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-willoughby-hart-historic-district-20240625.page";
const nycFrederickDouglassRelease =
  "https://www.nyc.gov/office-of-the-mayor/news/483-24/mayor-adams-landmarks-preservation-commission-designate-staten-island-s-frederick-douglass";
const nycOldCrotonRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-celebrates-50-years-of-scenic-landmarks-20240416.page";
const nycTremontBranchRelease =
  "https://www.nyc.gov/site/lpc/about/pr2024/lpc-designates-the-tremont-branch-of-the-new-york-public-library-in-the.page";
const belfastPhysicalProgrammeOct2025 =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_hoxton_shepherds_bush_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/hotel",
    title: "The Hoxton, Shepherd's Bush was listed as built",
    summary:
      "New London Architecture records The Hoxton, Shepherd's Bush in Hammersmith as built, with completion in January 2023.",
    observed_change:
      "A documented hotel project on Shepherd's Bush Green was recorded as reaching built status.",
    area: "Shepherd's Bush / Hammersmith",
    latitude: 51.504,
    longitude: -0.224,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Hoxton, Shepherd's Bush",
    source_url: "https://nla.london/projects/the-hoxton-shepherds-bush",
    source_record_id: "nla-the-hoxton-shepherds-bush",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "hotel completion",
    geometry_source: "Approximate point placed at 65 Shepherd's Bush Green from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; hotel opening operations, employment, public-realm effects, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bankside_yards_marketing_suite_completion_2025",
    date: "2025-05-01",
    bucket: "planning/development/architecture/marketing suite",
    title: "Bankside Yards Marketing Suite was listed as built",
    summary:
      "New London Architecture records Bankside Yards Marketing Suite in Southwark as built, with completion in May 2025.",
    observed_change:
      "A documented marketing-suite and show-apartment fit-out at Bankside Yards was recorded as reaching built status.",
    area: "Bankside / Southwark",
    latitude: 51.506,
    longitude: -0.104,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bankside Yards Marketing Suite",
    source_url: "https://nla.london/projects/bankside-yards-marketing-suite",
    source_record_id: "nla-bankside-yards-marketing-suite",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GRID Architects and GRID Interiors",
    project_type: "marketing suite and show-apartment completion",
    geometry_source: "Approximate point placed at 250 Blackfriars Road from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records a marketing-suite completion, not completion of the whole Bankside Yards masterplan; sales, occupation, public realm, and later phases require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_50_60_charter_street_wood_wharf_completion_2026",
    date: "2026-01-01",
    bucket: "planning/development/architecture/build to rent",
    title: "50-60 Charter Street, Wood Wharf was listed as built",
    summary:
      "New London Architecture records 50-60 Charter Street, Wood Wharf in Tower Hamlets as built, with completion in 2026.",
    observed_change:
      "A documented Wood Wharf residential project on Charter Street was recorded as reaching built status.",
    area: "Wood Wharf / Tower Hamlets",
    latitude: 51.507,
    longitude: -0.018,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 50-60 Charter Street, Wood Wharf",
    source_url: "https://nla.london/projects/50-60-charter-street-wood-wharf",
    source_record_id: "nla-50-60-charter-street-wood-wharf",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GRID Architects",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 50-60 Charter Street in Wood Wharf from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; occupation, rent levels, phasing, affordable-housing delivery, and estate management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_dacre_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/residential",
    title: "The Dacre was listed as built",
    summary:
      "New London Architecture records The Dacre in Westminster as built, with completion in 2023.",
    observed_change:
      "A documented central Westminster residential project was recorded as reaching built status.",
    area: "Westminster",
    latitude: 51.499,
    longitude: -0.133,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Dacre",
    source_url: "https://nla.london/projects/the-dacre",
    source_record_id: "nla-the-dacre",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Darling Associates",
    project_type: "residential development completion",
    geometry_source: "Approximate point placed at 19 Dacre Street from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; exact occupation, tenure, sales, management, and public-access arrangements require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_union_chapel_completion_2025",
    date: "2025-01-01",
    bucket: "planning/development/architecture/cultural heritage",
    title: "Union Chapel project was listed as built",
    summary:
      "New London Architecture records Union Chapel in Islington as built, with completion in 2025.",
    observed_change:
      "A documented cultural and heritage project at Union Chapel was recorded as reaching built status.",
    area: "Islington",
    latitude: 51.544,
    longitude: -0.102,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Union Chapel",
    source_url: "https://nla.london/projects/union-chapel",
    source_record_id: "nla-union-chapel",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Burrell Foley Fischer Architects",
    project_type: "cultural heritage project completion",
    geometry_source: "Approximate point placed at 19 Compton Terrace from the named NLA project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; full conservation scope, operational changes, access arrangements, and long-term maintenance require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jacob_day_residence_landmark_designated_2024",
    date: "2024-10-22",
    bucket: "planning/development/architecture/landmark designation",
    title: "Jacob Day Residence was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Jacob Day Residence at 50 West 13th Street as an individual landmark on October 22, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Jacob Day Residence to individual landmark.",
    area: "Greenwich Village / Manhattan",
    latitude: 40.736,
    longitude: -73.996,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Jacob Day Residence",
    source_url: nycJacobDayRelease,
    source_record_id: "nyc-lpc-2024-10-22-jacob-day-residence",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Greek Revival row house; original architect not identified in the press release",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 50 West 13th Street from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm restoration work, building-condition change, occupancy, owner consent, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_willoughby_hart_historic_district_designated_2024",
    date: "2024-06-25",
    bucket: "planning/development/architecture/historic district designation",
    title: "Willoughby-Hart Historic District was designated",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Willoughby-Hart Historic District in Bedford-Stuyvesant on June 25, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of two blocks of Willoughby Avenue and Hart Street to historic district.",
    area: "Bedford-Stuyvesant / Brooklyn",
    latitude: 40.694,
    longitude: -73.948,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Willoughby-Hart Historic District",
    source_url: nycWilloughbyHartRelease,
    source_record_id: "nyc-lpc-2024-06-25-willoughby-hart-historic-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Multiple late-19th century row houses; individual architects require the designation report",
    project_type: "historic district designation",
    geometry_source: "District-approximate point placed near Willoughby Avenue and Hart Street between Nostrand and Marcy Avenues from the LPC press-release description.",
    geometry_precision: "district approximate",
    limitations:
      "The event records historic-district designation only. It does not confirm building-condition changes, individual owner actions, restoration work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_frederick_douglass_memorial_park_landmark_designated_2024",
    date: "2024-06-18",
    bucket: "planning/development/architecture/landmark designation",
    title: "Frederick Douglass Memorial Park was designated an individual landmark",
    summary:
      "The NYC Mayor's Office and Landmarks Preservation Commission announced designation of Staten Island's Frederick Douglass Memorial Park as an individual landmark on June 18, 2024.",
    observed_change:
      "A documented city announcement changed the listed preservation status of Frederick Douglass Memorial Park to individual landmark.",
    area: "Oakwood / Staten Island",
    latitude: 40.56,
    longitude: -74.14,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: Frederick Douglass Memorial Park landmark designation",
    source_url: nycFrederickDouglassRelease,
    source_record_id: "nyc-lpc-2024-06-18-frederick-douglass-memorial-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office publication and designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Memorial park/cemetery landscape; designer details require the designation report",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed in the Staten Island Frederick Douglass Memorial Park context from the official release.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm landscape restoration, burial records, ownership changes, maintenance work, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_old_croton_aqueduct_walk_scenic_landmark_designated_2024",
    date: "2024-04-16",
    bucket: "planning/development/architecture/scenic landmark designation",
    title: "Old Croton Aqueduct Walk was designated a scenic landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of Old Croton Aqueduct Walk as the Bronx's first scenic landmark on April 16, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of Old Croton Aqueduct Walk to scenic landmark.",
    area: "Aqueduct Avenue / Bronx",
    latitude: 40.857,
    longitude: -73.908,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Old Croton Aqueduct Walk scenic landmark",
    source_url: nycOldCrotonRelease,
    source_record_id: "nyc-lpc-2024-04-16-old-croton-aqueduct-walk",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Historic water-supply infrastructure landscape; designer details require the designation report",
    project_type: "scenic landmark designation",
    geometry_source: "Linear-landscape designation represented by an approximate point along Aqueduct Avenue between West Kingsbridge Road and West Burnside Avenue.",
    geometry_precision: "corridor approximate",
    limitations:
      "The event records scenic landmark designation only. It does not confirm park improvements, infrastructure repair, maintenance funding, access changes, permits, or later alterations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_tremont_branch_nypl_landmark_designated_2024",
    date: "2024-03-05",
    bucket: "planning/development/architecture/landmark designation",
    title: "Tremont Branch of The New York Public Library was designated an individual landmark",
    summary:
      "NYC Landmarks Preservation Commission announced designation of the Tremont Branch of The New York Public Library at 1866 Washington Avenue as an individual landmark on March 5, 2024.",
    observed_change:
      "A documented LPC vote changed the listed preservation status of the Tremont Branch of The New York Public Library to individual landmark.",
    area: "Tremont / Bronx",
    latitude: 40.846,
    longitude: -73.899,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Landmarks Preservation Commission press release: Tremont Branch NYPL",
    source_url: nycTremontBranchRelease,
    source_record_id: "nyc-lpc-2024-03-05-tremont-branch-nypl",
    source_retrieved_at: retrievedAt,
    source_date_field: "LPC press-release designation date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Carrere and Hastings",
    project_type: "individual landmark designation",
    geometry_source: "Approximate point placed at 1866 Washington Avenue from the LPC press-release address.",
    geometry_precision: "site approximate",
    limitations:
      "The event records landmark designation only. It does not confirm library renovation work, service changes, building-condition change, permits, or later alterations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bike_station_queens_island_s76_agreed_2025",
    date: "2025-10-24",
    bucket: "planning/development/active travel infrastructure",
    title: "Belfast Bike Station at Queen's Island developer contribution was agreed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update agreed that a Section 76 developer contribution be used for a Belfast Bike station in the Queen's Island area.",
    observed_change:
      "A documented committee item recorded approval to use developer-contribution funding for a Belfast Bike station at Queen's Island.",
    area: "Queen's Island",
    latitude: 54.604,
    longitude: -5.903,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-programme-2025-10-belfast-bike-station-queens-island-s76",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee decision date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the agenda item",
    project_type: "cycle-share infrastructure funding approval",
    geometry_source: "Approximate point placed in the Queen's Island area because the agenda item does not map the proposed station.",
    geometry_precision: "district approximate",
    limitations:
      "The agenda item records funding-use approval, not station installation. It does not provide exact station location, installation date, capacity, procurement record, operational start, or ridership outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ballysillan_playing_fields_underway_2025",
    date: "2025-10-24",
    bucket: "planning/development/sports infrastructure",
    title: "Ballysillan Playing Fields project was reported underway",
    summary:
      "Belfast City Council's October 2025 Physical Programme update reported work continuing on site at the Ballysillan Playing Fields partnership project.",
    observed_change:
      "A documented Physical Programme update recorded on-site progress for the Ballysillan Playing Fields project.",
    area: "Ballysillan Playing Fields",
    latitude: 54.625,
    longitude: -5.956,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-underway-2025-10-ballysillan-playing-fields",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and physical projects underway section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and project partners; design team not named in the agenda item",
    project_type: "sports/open-space construction underway",
    geometry_source: "Approximate point placed at Ballysillan Playing Fields because the agenda item does not map the works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The agenda item records work continuing on site and an anticipated completion season. It does not provide exact works package, construction percentage, contract record, cost breakdown, or final completion evidence."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lagan_gateway_greenway_phase2_procurement_2025",
    date: "2025-10-24",
    bucket: "planning/development/greenway infrastructure",
    title: "Lagan Gateway Greenway phase 2 procurement was reported nearing completion",
    summary:
      "Belfast City Council's October 2025 Physical Programme update reported that the Lagan Gateway Greenway phase 2 procurement exercise was nearing completion for works on the Annadale side.",
    observed_change:
      "A documented Physical Programme update recorded procurement progress for the next phase of Lagan Gateway Greenway works.",
    area: "Annadale / Lagan Gateway",
    latitude: 54.566,
    longitude: -5.914,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-underway-2025-10-lagan-gateway-greenway-phase2-procurement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and physical projects underway section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and greenway project team; design team not named in the agenda item",
    project_type: "greenway procurement milestone",
    geometry_source: "Approximate point placed on the Annadale side of the Lagan Gateway context because the agenda item does not map the phase 2 works.",
    geometry_precision: "corridor approximate",
    limitations:
      "The agenda item records procurement progress, not completion of works. It does not provide tender outcome, final route alignment, construction start date, cost, opening date, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_grazing_lands_fencing_replacement_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/parks infrastructure",
    title: "Grazing Lands fencing replacement was reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed Grazing Lands fencing replacement among recently completed enhancements to Council assets.",
    observed_change:
      "A documented Physical Programme update recorded completed fencing-replacement works at Grazing Lands.",
    area: "Grazing Lands",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-grazing-lands-fencing-replacement",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/open-space project team; contractor not named in the agenda item",
    project_type: "open-space fencing replacement completion",
    geometry_source: "Approximate Belfast point because the agenda item does not identify or map the Grazing Lands site.",
    geometry_precision: "citywide approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact site boundary, completion date, fencing specification, contract record, cost, access effect, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_resources_fleet_portacabin_facilities_completed_2025",
    date: "2025-10-24",
    bucket: "planning/development/operational facilities",
    title: "Resources and Fleet portacabin facilities were reported completed",
    summary:
      "Belfast City Council's October 2025 Physical Programme update listed Resources and Fleet Portacabin Facilities among recently completed enhancements to Council assets.",
    observed_change:
      "A documented Physical Programme update recorded completed portacabin-facility works for Resources and Fleet.",
    area: "Belfast",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme Update: October 2025",
    source_url: belfastPhysicalProgrammeOct2025,
    source_record_id: "bcc-physical-completed-2025-10-resources-fleet-portacabin-facilities",
    source_retrieved_at: retrievedAt,
    source_date_field: "Strategic Policy and Resources Committee report date and recently completed section",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and operational facilities project team; contractor not named in the agenda item",
    project_type: "operational portacabin facility completion",
    geometry_source: "Approximate Belfast City Hall point because the agenda item does not identify or map the portacabin facilities.",
    geometry_precision: "citywide approximate",
    limitations:
      "The agenda item records recent completion but does not provide exact facility locations, completion dates, specifications, contract records, cost, operational changes, or maintenance plan."
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
