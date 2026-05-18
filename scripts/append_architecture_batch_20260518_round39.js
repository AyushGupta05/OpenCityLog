const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastCompletedProjectsJun2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s115927/Appendix%201%20-%20PP%20Completed%20projects%20June%202024.pdf";
const belfastCompletedProjectsDec2024Pdf =
  "https://minutes.belfastcity.gov.uk/documents/s119193/Appendix%201%20-%20Physical%20Programme%20Completed%20projects%20Dec%2024.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_mapleton_crescent_completion_2018",
    date: "2018-05-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Mapleton Crescent was listed as built",
    summary:
      "New London Architecture records Mapleton Crescent in Wandsworth as built, with completion in May 2018.",
    observed_change:
      "A documented modular residential tower project in Wandsworth was recorded as reaching built status.",
    area: "Wandsworth",
    latitude: 51.457,
    longitude: -0.193,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Mapleton Crescent",
    source_url: "https://nla.london/projects/mapleton-crescent",
    source_record_id: "nla-mapleton-crescent",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Metropolitan Workshop",
    project_type: "modular residential tower",
    geometry_source: "Approximate point placed in the Wandsworth project context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure, occupancy, modular-performance evidence, and later building management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_dollar_bay_completion_2017",
    date: "2017-01-01",
    bucket: "planning/development/architecture/residential tower",
    title: "Dollar Bay was listed as built",
    summary:
      "New London Architecture records Dollar Bay in Tower Hamlets as built, with completion in 2017.",
    observed_change:
      "A documented residential tower at South Dock on the Isle of Dogs was recorded as reaching built status.",
    area: "South Dock / Isle of Dogs",
    latitude: 51.5002,
    longitude: -0.019,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Dollar Bay",
    source_url: "https://nla.london/projects/dollar-bay",
    source_record_id: "nla-dollar-bay",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "SimpsonHaugh Architects",
    project_type: "residential tower",
    geometry_source: "Approximate point placed at South Dock on the Isle of Dogs from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion year; sales, occupancy, dockside public-realm operation, and later building management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_reimagining_totterdown_street_completion_2024",
    date: "2024-07-01",
    bucket: "planning/development/architecture/public realm",
    title: "Reimagining Totterdown Street was listed as built",
    summary:
      "New London Architecture records Reimagining Totterdown Street in Wandsworth as built, with completion in July 2024.",
    observed_change:
      "A documented street and public-realm project in Tooting was recorded as reaching built status.",
    area: "Totterdown Street / Tooting",
    latitude: 51.427,
    longitude: -0.168,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Reimagining Totterdown Street",
    source_url: "https://nla.london/projects/reimagining-totterdown-street",
    source_record_id: "nla-reimagining-totterdown-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Design team not identified in the NLA project-information fields reviewed for this record",
    project_type: "street and public-realm project",
    geometry_source: "Approximate point placed on Totterdown Street in Tooting from the named project location.",
    geometry_precision: "street approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; highway adoption, maintenance, traffic changes, and public-realm use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_connected_house_retrofit_completion_2024",
    date: "2024-07-01",
    bucket: "planning/development/architecture/residential retrofit",
    title: "Connected House retrofit was listed as built",
    summary:
      "New London Architecture records Connected House in Southwark as built, with completion in July 2024.",
    observed_change:
      "A documented mid-century home retrofit in Southwark was recorded as reaching built status.",
    area: "Woodhall Drive Estate / Southwark",
    latitude: 51.438,
    longitude: -0.067,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Connected House",
    source_url: "https://nla.london/projects/connected-house",
    source_record_id: "nla-connected-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "RDA Architecture & Interiors",
    project_type: "residential retrofit",
    geometry_source: "Approximate point placed at the Woodhall Drive Estate context from the named project location.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; energy performance, occupation, maintenance, and replicability require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_taper_house_completion_2023",
    date: "2023-04-01",
    bucket: "planning/development/architecture/residential retrofit",
    title: "Taper House was listed as built",
    summary:
      "New London Architecture records Taper House in Hackney as built, with completion in April 2023.",
    observed_change:
      "A documented residential retrofit and extension in Hackney was recorded as reaching built status.",
    area: "Hackney",
    latitude: 51.545,
    longitude: -0.055,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Taper House",
    source_url: "https://nla.london/projects/taper-house",
    source_record_id: "nla-taper-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Merrett Houmoller Architects",
    project_type: "residential retrofit and extension",
    geometry_source: "Approximate point placed in Hackney from the named project context because the source does not provide a parcel boundary in extracted fields.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page. The event records built status and completion month; exact parcel boundary, occupation, performance, and later adaptation require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_817_avenue_h_text_adopted_2024",
    date: "2024-05-16",
    bucket: "planning/development/zoning/residential mixed use",
    title: "817 Avenue H zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 817 Avenue H, N 230324 ZRK, with an adopted date of May 16, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 817 Avenue H project area in Brooklyn.",
    area: "Avenue H / Brooklyn",
    latitude: 40.63,
    longitude: -73.967,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 817 Avenue H",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/817-avenue-h-n-230324-zrk",
    source_record_id: "nyc-zr-817-avenue-h-n-230324-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Avenue H project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_281_311_marcus_garvey_boulevard_text_adopted_2024",
    date: "2024-05-16",
    bucket: "planning/development/zoning/residential mixed use",
    title: "281 and 311 Marcus Garvey Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 281 and 311 Marcus Garvey Boulevard, N 230147 ZRK, with an adopted date of May 16, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the Marcus Garvey Boulevard project area in Brooklyn.",
    area: "Marcus Garvey Boulevard / Brooklyn",
    latitude: 40.686,
    longitude: -73.938,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 281 and 311 Marcus Garvey Boulevard",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/281-and-311-marcus-garvey-boulevard-n-230147-zrk",
    source_record_id: "nyc-zr-281-and-311-marcus-garvey-boulevard-n-230147-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "multi-site zoning text amendment",
    geometry_source: "Approximate point on Marcus Garvey Boulevard in Brooklyn, not mapped zoning boundaries.",
    geometry_precision: "corridor approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_712_myrtle_avenue_text_adopted_2024",
    date: "2024-08-15",
    bucket: "planning/development/zoning/residential mixed use",
    title: "712 Myrtle Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 712 Myrtle Avenue, N 230259 ZRK, with an adopted date of August 15, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 712 Myrtle Avenue project area in Brooklyn.",
    area: "Myrtle Avenue / Brooklyn",
    latitude: 40.694,
    longitude: -73.951,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 712 Myrtle Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/712-myrtle-avenue-n-230259-zrk",
    source_record_id: "nyc-zr-712-myrtle-avenue-n-230259-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Myrtle Avenue project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_3033_avenue_v_text_adopted_2024",
    date: "2024-08-15",
    bucket: "planning/development/zoning/residential mixed use",
    title: "3033 Avenue V zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 3033 Avenue V, N 240132 ZRK, with an adopted date of August 15, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 3033 Avenue V project area in Brooklyn.",
    area: "Avenue V / Brooklyn",
    latitude: 40.599,
    longitude: -73.935,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 3033 Avenue V",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/3033-avenue-v-n-240132-zrk",
    source_record_id: "nyc-zr-3033-avenue-v-n-240132-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Avenue V project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_2118_avenue_u_text_adopted_2024",
    date: "2024-07-18",
    bucket: "planning/development/zoning/residential mixed use",
    title: "2118 Avenue U zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2118 Avenue U, N 230352 ZRK, with an adopted date of July 18, 2024.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2118 Avenue U project area in Brooklyn.",
    area: "Avenue U / Brooklyn",
    latitude: 40.599,
    longitude: -73.949,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2118 Avenue U",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2118-avenue-u-n-230352-zrk",
    source_record_id: "nyc-zr-2118-avenue-u-n-230352-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from the named Avenue U project address, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_bikes_york_street_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/active travel infrastructure",
    title: "Belfast Bikes Expansion at York Street was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Belfast Bikes Expansion - York Street among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed Belfast Bikes expansion project at York Street.",
    area: "York Street",
    latitude: 54.607,
    longitude: -5.927,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-belfast-bikes-york-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and active-travel project team; supplier not named in the appendix",
    project_type: "cycle-share infrastructure completion",
    geometry_source: "Approximate point placed on York Street because the appendix does not map the docking station or works boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, docking-station specification, cost, operational start, ridership, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_dual_language_street_signs_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/street signs public realm",
    title: "Dual Language Street Signs project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Dual Language Street Signs among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed street-signage project for dual-language signs.",
    area: "Belfast citywide",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-dual-language-street-signs",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and street-signage project team; supplier not named in the appendix",
    project_type: "street-signage public-realm completion",
    geometry_source: "Citywide signage programme represented by an approximate Belfast City Hall point because the appendix does not list individual street signs.",
    geometry_precision: "citywide",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, sign locations, quantities, cost, maintenance plan, or consultation details."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_water_refill_stations_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/public realm amenity",
    title: "Water Refill Stations project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Water Refill Stations among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed public-realm water refill station works.",
    area: "Belfast citywide",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-water-refill-stations",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and public-realm project team; supplier not named in the appendix",
    project_type: "public-realm water refill infrastructure completion",
    geometry_source: "Citywide amenity programme represented by an approximate Belfast City Hall point because the appendix does not list station locations.",
    geometry_precision: "citywide",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, station locations, quantities, cost, maintenance plan, or usage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_waste_transfer_station_floor_completed_2024",
    date: "2024-12-13",
    bucket: "planning/development/waste infrastructure",
    title: "Waste Transfer Station floor project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for June-December 2024 listed Waste Transfer Station Floor among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded completed floor works at a waste transfer station.",
    area: "Belfast waste transfer station",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: June-December 2024",
    source_url: belfastCompletedProjectsDec2024Pdf,
    source_record_id: "bcc-physical-completed-2024-12-waste-transfer-station-floor",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and waste infrastructure project team; contractor not named in the appendix",
    project_type: "waste infrastructure floor works completion",
    geometry_source: "Approximate Belfast point because the appendix does not identify or map the waste transfer station.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during June-December 2024 but does not provide an exact completion date, facility address, works specification, cost, operational impact, or maintenance plan."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_greater_shankill_community_council_completed_2024",
    date: "2024-06-21",
    bucket: "planning/development/community facility",
    title: "Greater Shankill Community Council project was reported completed",
    summary:
      "Belfast City Council's Physical Programme completed-projects appendix for February-June 2024 listed Greater Shankill Community Council among completed projects.",
    observed_change:
      "A documented completed-projects appendix recorded a completed physical-programme project associated with Greater Shankill Community Council.",
    area: "Greater Shankill",
    latitude: 54.605,
    longitude: -5.959,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Physical Programme completed-projects appendix: February-June 2024",
    source_url: belfastCompletedProjectsJun2024Pdf,
    source_record_id: "bcc-physical-completed-2024-06-greater-shankill-community-council",
    source_retrieved_at: retrievedAt,
    source_date_field: "Completed-projects appendix reporting period and committee publication date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and community project partners; design team not named in the appendix",
    project_type: "community facility completion",
    geometry_source: "Approximate point placed in the Greater Shankill area because the appendix does not map the works location.",
    geometry_precision: "site approximate",
    limitations:
      "The appendix lists the project as completed during February-June 2024 but does not provide an exact completion date, works specification, facility address, contract record, cost, maintenance plan, or community-use outcomes."
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
