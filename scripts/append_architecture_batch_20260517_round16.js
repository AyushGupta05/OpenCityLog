const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-17";
const belfastDecemberPack =
  "https://minutes.belfastcity.gov.uk/documents/b37462/Reports%20to%20follow%202c2d3c4a4b4c7a%20and%20Additional%20Items%202e3e5c7c7d.pdf?T=9";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_leaside_lock_completion_2023",
    date: "2023-09-01",
    bucket: "planning/development/architecture/mixed tenure housing",
    title: "Leaside Lock was listed as built",
    summary:
      "NLA records Leaside Lock as a built Tower Hamlets mixed-tenure housing project at 30 Hancock Road, with 500 homes, community facilities, affordable workspace, retail units, and estimated completion in September 2023.",
    observed_change:
      "A Bromley-by-Bow housing, workspace, retail, and community-facility scheme was recorded as completed.",
    area: "Leaside Lock, Bromley-by-Bow",
    latitude: 51.525,
    longitude: -0.0115,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Leaside Lock",
    source_url: "https://nla.london/projects/leaside-lock",
    source_record_id: "nla-leaside-lock",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Assael Architecture, The Guinness Partnership, Danescroft Land, and project team",
    project_type: "mixed-tenure housing with community and workspace uses",
    geometry_source: "Approximate point geocoded from NLA-stated 30 Hancock Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page with an estimated completion month. It documents built status but does not verify occupation dates, individual tenure delivery, or later workspace tenancy."
  },
  {
    city_id: "london",
    event_id: "lon_arch_willow_walk_completion_2022",
    date: "2022-09-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Willow Walk was listed as built",
    summary:
      "NLA records Willow Walk as a built Wandsworth residential-led mixed-use scheme at Osiers Road, providing 100 percent affordable housing, a workspace hub, and estimated completion in September 2022.",
    observed_change:
      "A Wandsworth affordable housing and workspace scheme was recorded as completed on a former workshop site.",
    area: "Willow Walk, Osiers Road",
    latitude: 51.4586,
    longitude: -0.194,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Willow Walk",
    source_url: "https://nla.london/projects/willow-walk",
    source_record_id: "nla-willow-walk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Rolfe Judd, Burwell Architects, Peabody, Hollybrook, and project team",
    project_type: "affordable residential-led mixed-use development",
    geometry_source: "Approximate point geocoded from NLA-stated Osiers Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; affordable-housing allocations, workspace occupancy, and subsequent management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_sunday_mills_completion_2022",
    date: "2022-10-01",
    bucket: "planning/development/architecture/co-living",
    title: "Sunday Mills was listed as built",
    summary:
      "NLA records Sunday Mills as a built Wandsworth co-living project at 23 Trewint Street, with 315 homes, shared amenity spaces, community uses, landscaping, and estimated completion in October 2022.",
    observed_change:
      "A River Wandle co-living building with shared amenities and community-facing uses was recorded as completed.",
    area: "Sunday Mills, Trewint Street",
    latitude: 51.4503,
    longitude: -0.1915,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Sunday Mills",
    source_url: "https://nla.london/projects/sunday-mills",
    source_record_id: "nla-sunday-mills",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Assael Architecture, Halcyon Development Partners, DTZ Investors, and project team",
    project_type: "co-living residential development",
    geometry_source: "Approximate point geocoded from NLA-stated 23 Trewint Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, affordability terms, and long-term community use are outside this record."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hale_wharf_completion_2024",
    date: "2024-08-01",
    bucket: "planning/development/architecture/waterside housing",
    title: "Hale Wharf was listed as built",
    summary:
      "NLA records Hale Wharf as a built Haringey waterside development at Ferry Lane, with a mix of council-let, market, and rental homes arranged around shared space, and estimated completion in August 2024.",
    observed_change:
      "A Tottenham Hale waterside residential development and shared-space scheme was recorded as completed.",
    area: "Hale Wharf, Tottenham Hale",
    latitude: 51.5883,
    longitude: -0.0552,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hale Wharf",
    source_url: "https://www.nla.london/projects/hale-wharf-3",
    source_record_id: "nla-hale-wharf",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison, Muse Developments, Canal and River Trust, Haringey Council, and project team",
    project_type: "waterside residential development",
    geometry_source: "Approximate point geocoded from NLA-stated Ferry Lane / The Paddock pedestrian bridge location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page with an estimated completion month. It does not independently verify handover by block, tenure mix at occupancy, bridge delivery, or later estate management."
  },
  {
    city_id: "london",
    event_id: "lon_arch_upton_gardens_completion_2023",
    date: "2023-06-01",
    bucket: "planning/development/architecture/stadium site reuse",
    title: "Upton Gardens was listed as built",
    summary:
      "NLA records Upton Gardens by Barratt London as a built Newham housing development on the former West Ham Boleyn Ground site, with estimated completion in June 2023.",
    observed_change:
      "A former football ground in Upton Park was recorded as reused for a residential development.",
    area: "Former Boleyn Ground, Upton Park",
    latitude: 51.5319,
    longitude: 0.0394,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Upton Gardens by Barratt London",
    source_url: "https://nla.london/projects/upton-gardens-by-barratt-london",
    source_record_id: "nla-upton-gardens-barratt-london",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "gma, BUJ, Barratt London, and project team",
    project_type: "residential development on former stadium site",
    geometry_source: "Approximate point geocoded from the former Boleyn Ground / Upton Gardens site.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; phased handover, public-realm management, and social outcomes require separate sources."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_atlantic_avenue_mixed_use_plan_adopted_2025",
    date: "2025-05-28",
    bucket: "planning/development/zoning/mixed use district",
    title: "Special Atlantic Avenue Mixed Use Plan was adopted",
    summary:
      "The NYC Zoning Resolution records the Special Atlantic Avenue Mixed Use Plan, N 250015 ZRK, with an adopted date of May 28, 2025, adding Article XIV Chapter 6 and related Brooklyn Mandatory Inclusionary Housing map changes.",
    observed_change:
      "A documented zoning text and mapped district change was recorded for the Atlantic Avenue corridor in Brooklyn.",
    area: "Atlantic Avenue corridor, Brooklyn",
    latitude: 40.6796,
    longitude: -73.9562,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Special Atlantic Av Mixed Use Plan",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/special-atlantic-av-mixed-use-plan-n-250015-zrk",
    source_record_id: "nyc-zr-special-atlantic-av-mixed-use-plan-n-250015-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "zoning text amendment and special mixed-use district",
    geometry_source: "Approximate point placed on the Atlantic Avenue plan corridor rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records adoption of zoning text and maps. It does not confirm individual building permits, construction starts, housing completions, business changes, or streetscape delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jamaica_neighborhood_plan_adopted_2025",
    date: "2025-10-29",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "Jamaica Neighborhood Plan zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records the Jamaica Neighborhood Plan, N 250173 ZRQ, with an adopted date of October 29, 2025, amending Special Downtown Jamaica District text and Queens Mandatory Inclusionary Housing maps.",
    observed_change:
      "A documented zoning text and mapped inclusionary-housing change was recorded for Jamaica, Queens.",
    area: "Jamaica, Queens",
    latitude: 40.7027,
    longitude: -73.7949,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Jamaica Neighborhood Plan",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/jamaica-neighborhood-plan-n-250173-zrq",
    source_record_id: "nyc-zr-jamaica-neighborhood-plan-n-250173-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "zoning text amendment and neighborhood plan",
    geometry_source: "Approximate point placed near Jamaica Center rather than a mapped plan boundary.",
    geometry_precision: "district",
    limitations:
      "The event records adoption of zoning text and maps. It does not confirm later permits, construction starts, infrastructure delivery, affordable-housing agreements, or business openings."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_long_island_city_neighborhood_plan_adopted_2025",
    date: "2025-11-12",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "Long Island City Neighborhood Plan zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records the Long Island City Neighborhood Plan, N 250177 ZRQ, with an adopted date of November 12, 2025, adding and amending Special Long Island City Mixed Use District sections and Queens MIH maps.",
    observed_change:
      "A documented zoning text and mapped district change was recorded for Long Island City, Queens.",
    area: "Long Island City, Queens",
    latitude: 40.7485,
    longitude: -73.941,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Long Island City Neighborhood Plan",
    source_url: "https://zoningresolution.planning.nyc.gov/recently-adopted/long-island-city-neighborhood-plan-n-250177-zrq",
    source_record_id: "nyc-zr-long-island-city-neighborhood-plan-n-250177-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "zoning text amendment and neighborhood plan",
    geometry_source: "Approximate point placed within Long Island City rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records adoption of zoning text and maps. It does not confirm subsequent development applications, construction starts, public-space projects, or housing completions."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_eastchester_east_tremont_corridor_district_adopted_2024",
    date: "2024-08-15",
    bucket: "planning/development/zoning/special district",
    title: "Special Eastchester-East Tremont Corridor District was adopted",
    summary:
      "The NYC Zoning Resolution records the Special Eastchester-East Tremont Corridor District, N 240016 ZRX, with a City Council adoption date of August 15, 2024 and Article XIV Chapter 5 district rules.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for the Eastchester-East Tremont corridor in the Bronx.",
    area: "Eastchester-East Tremont corridor, Bronx",
    latitude: 40.845,
    longitude: -73.856,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Special Eastchester-East Tremont Corridor District",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/special-eastchester-east-tremont-corridor-district-n-240016-zrx",
    source_record_id: "nyc-zr-special-eastchester-east-tremont-corridor-district-n-240016-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed in the corridor rather than a mapped district boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm any single building permit, Metro-North station work, public-realm delivery, or later construction outcome."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_jerome_corridor_district_adopted_2018",
    date: "2018-03-22",
    bucket: "planning/development/zoning/special district",
    title: "Special Jerome Corridor District zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Article XIV Chapter 1, Special Jerome Corridor District, as last amended on March 22, 2018, establishing district rules for the Jerome Avenue corridor in the Bronx.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for the Jerome Avenue corridor.",
    area: "Jerome Avenue corridor, Bronx",
    latitude: 40.849,
    longitude: -73.908,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution: Chapter 1, Special Jerome Corridor District",
    source_url: "https://zoningresolution.planning.nyc.gov/article-xiv/chapter-1",
    source_record_id: "nyc-zr-special-jerome-corridor-district-2018-03-22",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution last amended date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed along the Jerome Avenue corridor rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records adoption of zoning text. It does not confirm later permits, tenant protections, streetscape changes, public facility investments, or construction completions."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_usel_green_growth_procurement_status_2025",
    date: "2025-12-19",
    bucket: "planning/development/community regeneration/circular economy",
    title: "USEL Green Growth project procurement status was recorded",
    summary:
      "Belfast City Council's December 2025 document pack recorded the USEL Green Growth and Circular Economy project as Stage 3 committed, with GBP 518,191 funding and main contractor procurement complete subject to the funding agreement.",
    observed_change:
      "A documented procurement and funding-agreement milestone was recorded for a North Belfast circular-economy regeneration project.",
    area: "North Belfast",
    latitude: 54.6075,
    longitude: -5.957,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee document pack: 19 December 2025",
    source_url: belfastDecemberPack,
    source_record_id: "bcc-spr-2025-12-19-nrf-usel-green-growth-page-208",
    source_retrieved_at: retrievedAt,
    source_date_field: "Document pack date and NRF project status table on page 208",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Ulster Supported Employment Ltd, Belfast City Council, and project team; design team not named in source extract",
    project_type: "community regeneration and circular-economy capital project",
    geometry_source: "Approximate North Belfast project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records procurement and funding-agreement status. It does not confirm contract award, construction start, completion, building footprint, or operational launch."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_cliftonville_community_enterprise_development_status_2025",
    date: "2025-12-19",
    bucket: "planning/development/community regeneration/enterprise",
    title: "Cliftonville Community Enterprise development status was recorded",
    summary:
      "Belfast City Council's December 2025 document pack recorded Cliftonville Community Enterprise as Stage 3 committed, with GBP 1,452,700 funding and a development-stage land-boundary issue being addressed.",
    observed_change:
      "A documented development-stage and funding milestone was recorded for a Cliftonville community enterprise capital project.",
    area: "Cliftonville, North Belfast",
    latitude: 54.6123,
    longitude: -5.946,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee document pack: 19 December 2025",
    source_url: belfastDecemberPack,
    source_record_id: "bcc-spr-2025-12-19-nrf-cliftonville-community-enterprise-page-208",
    source_retrieved_at: retrievedAt,
    source_date_field: "Document pack date and NRF project status table on page 208",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Cliftonville Community Regeneration Forum, Belfast City Council, and project team; design team not named in source extract",
    project_type: "community enterprise regeneration project",
    geometry_source: "Approximate Cliftonville area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records funding and development status. It does not confirm land transfer, planning permission, construction procurement, construction start, or opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ardoyne_youth_hub_tender_status_2025",
    date: "2025-12-19",
    bucket: "planning/development/community regeneration/youth hub",
    title: "Ardoyne Youth Enterprises hub tender status was recorded",
    summary:
      "Belfast City Council's December 2025 document pack recorded Ardoyne Youth Enterprises Community Hub as Stage 3 committed, with Urban Villages and NRF funding references, business-case status, and a main contractor tender issued.",
    observed_change:
      "A documented tender and funding-stage milestone was recorded for the Ardoyne Youth Enterprises Community Hub.",
    area: "Ardoyne, North Belfast",
    latitude: 54.6155,
    longitude: -5.9501,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee document pack: 19 December 2025",
    source_url: belfastDecemberPack,
    source_record_id: "bcc-spr-2025-12-19-nrf-ardoyne-youth-enterprises-page-208",
    source_retrieved_at: retrievedAt,
    source_date_field: "Document pack date and NRF project status table on page 208",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Ardoyne Youth Enterprises, Belfast City Council, Urban Villages, and project team; design team not named in source extract",
    project_type: "youth and community hub regeneration project",
    geometry_source: "Approximate Ardoyne area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records tender and funding-stage status. It does not confirm tender award, planning approval, construction start, completion, or later youth-service programming."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_orange_hall_works_started_2025",
    date: "2025-09-29",
    bucket: "planning/development/heritage/community regeneration",
    title: "Belfast Orange Hall refurbishment works started",
    summary:
      "Belfast City Council's December 2025 document pack recorded Belfast Orange Hall Refurbishment as Stage 3 committed and on ground, noting contractor works started on 29 September 2025 with an estimated December completion week.",
    observed_change:
      "A documented works-start milestone was recorded for the Belfast Orange Hall refurbishment project.",
    area: "Belfast Orange Hall, North Belfast",
    latitude: 54.6083,
    longitude: -5.9325,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee document pack: 19 December 2025",
    source_url: belfastDecemberPack,
    source_record_id: "bcc-spr-2025-12-19-nrf-belfast-orange-hall-page-208",
    source_retrieved_at: retrievedAt,
    source_date_field: "Document pack status table noting contractor start date of 29 September 2025",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast Orange Hall, Belfast City Council, appointed contractor, and project team; architect not named in source extract",
    project_type: "community building refurbishment",
    geometry_source: "Approximate North Belfast hall point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records reported works-start status. It does not confirm practical completion, final scope, conservation approvals, or later community use."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_st_joseph_restoration_procurement_status_2025",
    date: "2025-12-19",
    bucket: "planning/development/heritage/community regeneration",
    title: "St Joseph's Restoration procurement status was recorded",
    summary:
      "Belfast City Council's December 2025 document pack recorded St Joseph's Restoration project as Stage 3 committed, with HED consent for ongoing works, structural survey completion, and contractor tender preparation.",
    observed_change:
      "A documented procurement and survey milestone was recorded for the St Joseph's Sailortown restoration project.",
    area: "St Joseph's, Sailortown",
    latitude: 54.6067,
    longitude: -5.9179,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee document pack: 19 December 2025",
    source_url: belfastDecemberPack,
    source_record_id: "bcc-spr-2025-12-19-nrf-st-joseph-restoration-page-208",
    source_retrieved_at: retrievedAt,
    source_date_field: "Document pack date and NRF project status table on page 208",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Sailortown Regeneration Group, Belfast City Council, ICT, HED, and project team; contractor not named in source extract",
    project_type: "heritage restoration procurement milestone",
    geometry_source: "Approximate point reused from the St Joseph's Sailortown project location already present in the corpus.",
    geometry_precision: "site",
    limitations:
      "The event records consent, survey, and tender-preparation status. It does not confirm planning permission, contractor appointment, works start, restoration completion, or later programming."
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
