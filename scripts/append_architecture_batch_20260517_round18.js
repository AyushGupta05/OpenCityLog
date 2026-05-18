const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-17";
const eastBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126859/EAWG%2005.03.2026.pdf";
const westBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126858/WBAWG%2026.02.26.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_workstack_completion_2023",
    date: "2023-04-01",
    bucket: "planning/development/architecture/industrial workspace",
    title: "WorkStack was listed as built",
    summary:
      "NLA records WorkStack at 599 Woolwich Road as a built Greenwich industrial and creative-workspace building, with 14 stacked units and estimated completion in April 2023.",
    observed_change:
      "A compact Greenwich industrial workspace building was recorded as completed on a former warehousing site.",
    area: "WorkStack, Woolwich Road",
    latitude: 51.4888,
    longitude: 0.0343,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: WorkStack",
    source_url: "https://nla.london/projects/workstack",
    source_record_id: "nla-workstack",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "dRMM, Greenwich Enterprise Board, Arup, Webb Yates Engineers, F Parkinson, and project team",
    project_type: "stacked industrial and creative workspace",
    geometry_source: "Approximate point geocoded from NLA-stated 599 Woolwich Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenant mix, affordability terms, and occupancy over time require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kensington_building_retrofit_completion_2022",
    date: "2022-04-01",
    bucket: "planning/development/architecture/retail office retrofit",
    title: "The Kensington Building was listed as built",
    summary:
      "NLA records The Kensington Building at 1 Wrights Lane as a built Kensington retrofit, transforming the former Pontings department-store site into workspace, retail, and terrace accommodation with estimated completion in April 2022.",
    observed_change:
      "A former department-store building on Kensington High Street was recorded as reused for workspace, retail, and landscaped terraces.",
    area: "The Kensington Building, Wrights Lane",
    latitude: 51.5013,
    longitude: -0.1925,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Kensington Building",
    source_url: "https://www.nla.london/projects/the-kensington-building",
    source_record_id: "nla-the-kensington-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Pilbrow and Partners, ISG, GBE, and project team",
    project_type: "department-store retrofit to workspace and retail",
    geometry_source: "Approximate point geocoded from NLA-stated 1 Wrights Lane location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; leasing, retail operation, and measured environmental performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_1_7_dace_road_completion_2022",
    date: "2022-04-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "1-7 Dace Road was listed as built",
    summary:
      "NLA records 1-7 Dace Road on Fish Island as a built Hackney residential-led scheme on a former light-industrial site, providing four buildings and 100 percent affordable housing, with estimated completion in April 2022.",
    observed_change:
      "A former Fish Island light-industrial site was recorded as reused for affordable housing and mixed ground-floor activity around a courtyard.",
    area: "1-7 Dace Road, Fish Island",
    latitude: 51.5377,
    longitude: -0.0238,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 1-7 Dace Road",
    source_url: "https://nla.london/projects/1-7-dace-road",
    source_record_id: "nla-1-7-dace-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman, HG Construction, Price and Myers, and project team",
    project_type: "affordable residential-led redevelopment",
    geometry_source: "Approximate point geocoded from NLA-stated 3 Dace Road / Fish Island location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; individual handover dates, tenure management, and courtyard/public-access arrangements require separate sources."
  },
  {
    city_id: "london",
    event_id: "lon_arch_technique_goswell_road_completion_2022",
    date: "2022-03-01",
    bucket: "planning/development/architecture/workplace retrofit",
    title: "Technique was listed as built",
    summary:
      "NLA records Technique at 140 Goswell Road as a built Clerkenwell office retrofit and extension of former gin-distillery and printworks buildings, with estimated completion in March 2022.",
    observed_change:
      "A Goswell Road building group was recorded as reused and extended for office workspace, including SME workspace.",
    area: "Technique, Goswell Road",
    latitude: 51.5244,
    longitude: -0.1002,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Technique",
    source_url: "https://nla.london/projects/technique-2",
    source_record_id: "nla-technique-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman, General Projects, Heyne Tillett Steel, and project team",
    project_type: "adaptive reuse and office retrofit",
    geometry_source: "Approximate point geocoded from NLA-stated 140 Goswell Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; occupier take-up, carbon calculations, and later building performance require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_industria_barking_completion_2023",
    date: "2023-08-01",
    bucket: "planning/development/architecture/industrial workspace",
    title: "Industria was listed as built",
    summary:
      "NLA records Industria at 49-71 River Road in Barking as a built stacked light-industrial workspace project with 45 units and estimated completion in August 2023.",
    observed_change:
      "A Barking industrial site was recorded as completed as a multi-level light-industrial workspace building.",
    area: "Industria, River Road",
    latitude: 51.5327,
    longitude: 0.0802,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Industria",
    source_url: "https://nla.london/projects/industria",
    source_record_id: "nla-industria",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Haworth Tompkins, Be First, London Borough of Barking and Dagenham, Ashton Smith Associates, and project team",
    project_type: "multi-level light-industrial workspace",
    geometry_source: "Approximate point geocoded from NLA-stated Unit 18, The Io Centre, 49-71 River Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; unit occupation, business mix, and employment outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_citywide_health_fitness_zoning_adopted_2021",
    date: "2021-12-09",
    bucket: "planning/development/zoning/citywide health fitness",
    title: "Citywide Health and Fitness zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Citywide Health and Fitness, N 210382 ZRY, with an adopted date of December 9, 2021, amending citywide zoning definitions and sections for health and fitness establishments.",
    observed_change:
      "A documented citywide zoning text change was recorded for health and fitness establishment rules.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Citywide Health and Fitness",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/citywide-health-and-fitness-n-210382-zry",
    source_record_id: "nyc-zr-citywide-health-and-fitness-n-210382-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not confirm individual gym openings, permits, tenant changes, health outcomes, or neighborhood-level business activity."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_citywide_hotels_zoning_adopted_2021",
    date: "2021-12-09",
    bucket: "planning/development/zoning/citywide hotels",
    title: "Citywide Hotels zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Citywide Hotels, N 210406 ZRY, with an adopted date of December 9, 2021, amending citywide zoning text for hotel use and related special-permit sections.",
    observed_change:
      "A documented citywide zoning text change was recorded for hotel-use rules.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Citywide Hotels",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/citywide-hotels-n-210406-zry",
    source_record_id: "nyc-zr-citywide-hotels-n-210406-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not confirm later hotel applications, permits, conversions, openings, closings, or lodging-market effects."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_fresh_ii_zoning_adopted_2021",
    date: "2021-12-15",
    bucket: "planning/development/zoning/food retail",
    title: "FRESH II zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records FRESH II, N 210380 ZRY, with an adopted date of December 15, 2021, amending zoning text and FRESH food-store program maps.",
    observed_change:
      "A documented citywide zoning text and mapped-program change was recorded for the FRESH food-store zoning framework.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: FRESH II",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/fresh-ii-n-210380-zry",
    source_record_id: "nyc-zr-fresh-ii-n-210380-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "food-retail zoning text amendment",
    geometry_source: "Citywide program record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text and maps. It does not confirm individual food-store permits, store openings, grocery access, or retail tenancy outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_special_brooklyn_navy_yard_district_adopted_2021",
    date: "2021-12-15",
    bucket: "planning/development/zoning/special district",
    title: "Special Brooklyn Navy Yard District zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Special Brooklyn Navy Yard District, N 210463(A) ZRK, with an adopted date of December 15, 2021, adding Article XIV Chapter 4 and appendix maps.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for the Brooklyn Navy Yard.",
    area: "Brooklyn Navy Yard",
    latitude: 40.7021,
    longitude: -73.9716,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Special Brooklyn Navy Yard District",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/special-brooklyn-navy-yard-district-n-210463a-zrk",
    source_record_id: "nyc-zr-special-brooklyn-navy-yard-district-n-210463a-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, Brooklyn Navy Yard Development Corporation, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed within Brooklyn Navy Yard rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm individual building projects, leases, jobs, infrastructure works, or industrial development outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_river_ring_zoning_adopted_2021",
    date: "2021-12-15",
    bucket: "planning/development/zoning/waterfront mixed use",
    title: "River Ring zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records River Ring, N 220063 ZRK, with an adopted date of December 15, 2021, amending zoning text for the Williamsburg waterfront project area.",
    observed_change:
      "A documented zoning text change was recorded for a Williamsburg waterfront mixed-use project area.",
    area: "River Street / Williamsburg waterfront, Brooklyn",
    latitude: 40.7152,
    longitude: -73.9662,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: River Ring",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/river-ring-n-220063-zrk",
    source_record_id: "nyc-zr-river-ring-n-220063-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, project applicant, and public review participants",
    project_type: "waterfront mixed-use zoning text amendment",
    geometry_source: "Approximate point placed on the River Street / Williamsburg waterfront project area.",
    geometry_precision: "site",
    limitations:
      "The event records zoning adoption. It does not confirm construction start, waterfront public-space delivery, housing completions, remediation, or final project design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_portview_exchange_design_procurement_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/community regeneration/workspace",
    title: "Portview Exchange design-procurement status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded Portview Exchange as a Stage 3 committed Neighbourhood Regeneration Fund project, with GBP 600,000 funding, a business case at final-draft stage, and design-team procurement prepared.",
    observed_change:
      "A documented design-procurement and business-case milestone was recorded for the Portview Exchange regeneration project.",
    area: "Portview, Newtownards Road",
    latitude: 54.6005,
    longitude: -5.8838,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-portview-exchange",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast Unemployed Resource Centre, Belfast City Council, Urban Villages, and project team; design team not named in source extract",
    project_type: "community regeneration workspace design-procurement milestone",
    geometry_source: "Approximate Portview / Newtownards Road project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records business-case and design-procurement status. It does not confirm letter of offer, procurement issue, planning approval, construction start, completion, or workspace operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_wilgar_park_sporting_hub_planning_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/community regeneration/sporting hub",
    title: "Wilgar Park sporting hub planning status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded Development of a sporting hub at Wilgar Park as a Stage 3 committed NRF project, with GBP 500,000 funding, a live planning application, and a reported funding shortfall.",
    observed_change:
      "A documented planning-application and funding-status milestone was recorded for the Wilgar Park sporting hub project.",
    area: "Wilgar Park, East Belfast",
    latitude: 54.6024,
    longitude: -5.8725,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-wilgar-park-sporting-hub",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Dundela FC, Belfast City Council, and project team; design team not named in source extract",
    project_type: "sporting hub planning and funding-status milestone",
    geometry_source: "Approximate point placed at Wilgar Park project area.",
    geometry_precision: "area",
    limitations:
      "The event records planning-application and funding-shortfall status. It does not confirm permission, full funding, tender award, construction start, or facility opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_glencairn_community_project_planning_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/community hub",
    title: "Glencairn Community Project planning status was recorded",
    summary:
      "Belfast West Area Working Group papers recorded Glencairn Community Project as committed and in due diligence, with a planning application submitted, land-transfer work underway, and BIF plus NRF funding noted.",
    observed_change:
      "A documented planning-application, land-transfer, and due-diligence milestone was recorded for the Glencairn Community Project.",
    area: "Glencairn, West Belfast",
    latitude: 54.626,
    longitude: -5.986,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-glencairn-community-project",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and BIF/NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Glencairn Community Project, Belfast City Council, NIHE, BIF, NRF, and project team; design team not named in source extract",
    project_type: "community hub planning and due-diligence milestone",
    geometry_source: "Approximate Glencairn project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records planning-submission, land-transfer, and due-diligence status. It does not confirm planning approval, land transfer, full funding, construction start, completion, or long-term operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_greater_shankill_rbl_project_stage3_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/community facility",
    title: "Greater Shankill RBL project Stage 3 status was recorded",
    summary:
      "Belfast West Area Working Group papers listed the Greater Shankill Community Council RBL project among Stage 3 Belfast Investment Fund projects, with a GBP 300,000 allocation.",
    observed_change:
      "A documented Stage 3 funding-status milestone was recorded for the Greater Shankill Community Council RBL project.",
    area: "Shankill, West Belfast",
    latitude: 54.6055,
    longitude: -5.957,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-greater-shankill-rbl-project",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and BIF summary table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Greater Shankill Community Council, Belfast City Council, BIF, and project team; design team not named in source extract",
    project_type: "community facility funding-status milestone",
    geometry_source: "Approximate Shankill project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records Stage 3 funding status only. It does not confirm design scope, planning status, procurement, construction start, completion, or facility operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_lower_shankill_the_road_stage3_approved_2024",
    date: "2024-01-19",
    bucket: "planning/development/community regeneration/public realm",
    title: "Lower Shankill The Road project moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 19 January 2024 recorded approval of West Area Working Group recommendations to progress Lower Shankill Community Association's The Road project to Stage 3 Delivery with a GBP 210,759 allocation.",
    observed_change:
      "A documented Stage 3 delivery and funding-allocation milestone was recorded for the Lower Shankill The Road project.",
    area: "Lower Shankill, West Belfast",
    latitude: 54.604,
    longitude: -5.952,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda/minutes: 19 January 2024",
    source_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=163&MeetingId=11627",
    source_record_id: "bcc-spr-2024-01-19-lower-shankill-the-road-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date approving Area Working Group recommendation",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Lower Shankill Community Association, Belfast City Council, NRF, and project team; design team not named in source extract",
    project_type: "community regeneration Stage 3 delivery milestone",
    geometry_source: "Approximate Lower Shankill project-area point; the source does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records committee approval of Stage 3 delivery and funding allocation. It does not confirm final design, procurement, planning approval, construction start, completion, or public use."
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
