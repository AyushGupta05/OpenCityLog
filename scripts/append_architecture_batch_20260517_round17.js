const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-17";
const westBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126858/WBAWG%2026.02.26.pdf";
const eastBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126859/EAWG%2005.03.2026.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_italian_building_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/adaptive reuse",
    title: "The Italian Building was listed as built",
    summary:
      "NLA records The Italian Building in Bermondsey as a built adaptive-reuse co-living project at 41 Dockhead, repurposing an Edwardian building with estimated completion in September 2019.",
    observed_change:
      "A Bermondsey Edwardian building was recorded as reused for co-living accommodation.",
    area: "The Italian Building, Dockhead",
    latitude: 51.5001,
    longitude: -0.0741,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Italian Building",
    source_url: "https://nla.london/projects/the-italian-building",
    source_record_id: "nla-the-italian-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Stiff + Trevillion Architects, Mason and Fifth, FORE Partnership, and project team",
    project_type: "adaptive reuse co-living project",
    geometry_source: "Approximate point geocoded from NLA-stated 41 Dockhead location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; later operations, tenancy, and building-performance claims require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_canada_water_plot_k1_completion_2023",
    date: "2023-12-01",
    bucket: "planning/development/architecture/affordable housing",
    title: "Canada Water Plot K1 was listed as built",
    summary:
      "NLA records Canada Water Plot K1 as a built Southwark affordable housing scheme at 2 Roberts Close, forming part of the Canada Water masterplan, with estimated completion in December 2023.",
    observed_change:
      "A Canada Water masterplan residential plot was recorded as completed as local-authority and affordable housing.",
    area: "Canada Water Plot K1, Roberts Close",
    latitude: 51.4987,
    longitude: -0.049,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Canada Water, Plot K1",
    source_url: "https://nla.london/projects/canada-water-plot-k1",
    source_record_id: "nla-canada-water-plot-k1",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Morris+Company, British Land, Southwark Council, and project team",
    project_type: "affordable residential development",
    geometry_source: "Approximate point geocoded from NLA-stated 2 Roberts Close location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; allocation, handover, and wider masterplan phasing require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_porters_edge_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/mixed use retail residential",
    title: "Porters Edge was listed as built",
    summary:
      "NLA records Porters Edge at Canada Water as a built mixed-use urban block with a Decathlon store and build-to-rent flats, with estimated completion in September 2019.",
    observed_change:
      "A Canada Water retail and rental-housing block was recorded as completed beside Canada Water Dock.",
    area: "Porters Edge, Maritime Street",
    latitude: 51.497,
    longitude: -0.047,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Porters Edge",
    source_url: "https://nla.london/projects/porters-edge",
    source_record_id: "nla-porters-edge",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Maccreanor Lavington, Sellar, Notting Hill Genesis, and project team",
    project_type: "mixed-use retail and residential development",
    geometry_source: "Approximate point geocoded from NLA-stated 11 Maritime Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; store opening, rental occupancy, and later management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_notting_hill_ealing_junior_school_completion_2023",
    date: "2023-11-01",
    bucket: "planning/development/architecture/education",
    title: "Notting Hill and Ealing junior school was listed as built",
    summary:
      "NLA records the new junior school for Notting Hill and Ealing High School as a built Ealing education project at 26 St Stephen's Road, with classrooms, specialist teaching spaces, a hall, outdoor learning spaces, and estimated completion in November 2023.",
    observed_change:
      "A new junior-school teaching, assembly, and outdoor-learning facility was recorded as completed in Ealing.",
    area: "Notting Hill and Ealing High School, Ealing",
    latitude: 51.5151,
    longitude: -0.3159,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: New Junior School for Notting Hill and Ealing High School",
    source_url: "https://nla.london/projects/new-junior-school-for-notting-hill-ealing-high-school",
    source_record_id: "nla-notting-hill-ealing-junior-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hawkins Brown, Girls Day School Trust, Neilcott Construction, and project team",
    project_type: "school building",
    geometry_source: "Approximate point geocoded from NLA-stated 26 St Stephen's Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; school enrolment, curriculum use, and operational outcomes are outside this record."
  },
  {
    city_id: "london",
    event_id: "lon_arch_89_895_worship_street_completion_2023",
    date: "2023-10-01",
    bucket: "planning/development/architecture/office retrofit",
    title: "89-89.5 Worship Street was listed as built",
    summary:
      "NLA records 89-89.5 Worship Street as a built Hackney warehouse retrofit and extension, amalgamating three buildings into a flexible office campus with an internal courtyard, and estimated completion in October 2023.",
    observed_change:
      "A Shoreditch warehouse group was recorded as reused and extended for flexible office space.",
    area: "89-89.5 Worship Street",
    latitude: 51.5238,
    longitude: -0.0847,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 89-89.5 Worship Street",
    source_url: "https://nla.london/projects/89-895-worship-street",
    source_record_id: "nla-89-895-worship-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "GPAD, Ward Williams Associates, Perega, Corley and Wooley, and project team",
    project_type: "warehouse retrofit and office extension",
    geometry_source: "Approximate point geocoded from NLA-stated Worship Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenancy, retrofit performance, and later workspace use require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_city_of_yes_carbon_neutrality_adopted_2023",
    date: "2023-12-06",
    bucket: "planning/development/zoning/citywide sustainability",
    title: "City of Yes for Carbon Neutrality zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records City of Yes for Carbon Neutrality, N 230113 ZRY, with an adopted date of December 6, 2023, amending zoning sections related to energy infrastructure, electrified buildings, rooftop greenhouses, parking, and other citywide rules.",
    observed_change:
      "A documented citywide zoning text change was recorded for New York City's building and energy-infrastructure rule framework.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: City of Yes for Carbon Neutrality",
    source_url: "https://zoningresolution.planning.nyc.gov/recently-adopted/city-yes-carbon-neutrality-n-230113-zry",
    source_record_id: "nyc-zr-city-of-yes-carbon-neutrality-n-230113-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of citywide zoning text. It does not confirm individual retrofits, energy installations, permits, emissions changes, or building-compliance outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_city_of_yes_economic_opportunity_adopted_2024",
    date: "2024-06-06",
    bucket: "planning/development/zoning/citywide economic use",
    title: "City of Yes for Economic Opportunity zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records City of Yes: Zoning for Economic Opportunity, N 240010 ZRY, with an adopted date of June 6, 2024, amending multiple citywide commercial, community-facility, and use regulations.",
    observed_change:
      "A documented citywide zoning text change was recorded for New York City's commercial and mixed-use rule framework.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: City of Yes: Zoning for Economic Opportunity",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/city-yes-zoning-economic-opportunity-n-240010-zry",
    source_record_id: "nyc-zr-city-of-yes-economic-opportunity-n-240010-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of citywide zoning text. It does not confirm business openings, construction activity, tenant changes, permits, or neighborhood-level outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_city_of_yes_economic_opportunity_m_districts_adopted_2024",
    date: "2024-06-06",
    bucket: "planning/development/zoning/manufacturing districts",
    title: "City of Yes Economic Opportunity M Districts text was adopted",
    summary:
      "The NYC Zoning Resolution records City of Yes: Zoning for Economic Opportunity - M Districts, N 240011 ZRY, with an adopted date of June 6, 2024, amending zoning rules for manufacturing districts and related waterfront and transit provisions.",
    observed_change:
      "A documented zoning text change was recorded for New York City's manufacturing-district rule framework.",
    area: "New York City manufacturing districts",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: City of Yes: Zoning for Economic Opportunity - M Districts",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/city-yes-zoning-economic-opportunity-m-districts-n-240011-zry-0",
    source_record_id: "nyc-zr-city-of-yes-economic-opportunity-m-districts-n-240011-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "manufacturing-district zoning text amendment",
    geometry_source: "Citywide manufacturing-district policy record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not map individual M districts, confirm permits, document industrial-business changes, or quantify built development."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_coastal_flood_resiliency_zoning_adopted_2021",
    date: "2021-05-12",
    bucket: "planning/development/zoning/coastal flood resiliency",
    title: "Zoning for Coastal Flood Resiliency was adopted",
    summary:
      "The NYC Zoning Resolution records Zoning for Coastal Flood Resiliency, N 210095 ZRY, with an adopted date of May 12, 2021, updating citywide flood-hazard zoning provisions.",
    observed_change:
      "A documented citywide coastal flood-resiliency zoning text change was recorded for buildings in mapped flood-hazard contexts.",
    area: "New York City coastal flood-hazard areas",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Zoning for Coastal Flood Resiliency",
    source_url: "https://zoningresolution.planning.nyc.gov/index.php/recently-adopted/zoning-coastal-flood-resiliency-n-210095-zry",
    source_record_id: "nyc-zr-zoning-coastal-flood-resiliency-n-210095-zry",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "citywide flood-resiliency zoning text amendment",
    geometry_source: "Citywide coastal-flood policy record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records adoption of zoning text. It does not map parcel-level flood exposure, confirm individual retrofits, permits, floodproofing work, or resilience outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_governors_island_zoning_adopted_2021",
    date: "2021-05-27",
    bucket: "planning/development/zoning/special district",
    title: "Governors Island zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Governors Island, N 210126 ZRM, with an adopted date of May 27, 2021, adding and amending Special Governors Island District sections and related appendix maps.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for Governors Island.",
    area: "Governors Island",
    latitude: 40.6895,
    longitude: -74.0168,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Governors Island",
    source_url: "https://zoningresolution.planning.nyc.gov/recently-adopted/governors-island-n-210126-zrm",
    source_record_id: "nyc-zr-governors-island-n-210126-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "Zoning Resolution adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, Trust for Governors Island, and public review participants",
    project_type: "special-purpose zoning district amendment",
    geometry_source: "Approximate point placed on Governors Island rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm later tenant selection, climate-center development, building permits, construction starts, or public-space completions."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_michael_davitts_heritage_centre_construction_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/heritage centre",
    title: "Michael Davitt's Community Heritage Centre construction status was recorded",
    summary:
      "Belfast West Area Working Group papers recorded Michael Davitt's Community Heritage Centre as a Stage 3 project, with construction work having commenced in summer 2025 and heritage fit-out procurement being handled by the club's design team.",
    observed_change:
      "A documented construction-status and fit-out procurement milestone was recorded for the Michael Davitt's Community Heritage Centre project.",
    area: "Beechmount, West Belfast",
    latitude: 54.5886,
    longitude: -5.9706,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-michael-davitts-community-heritage-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Michael Davitt's GAC, Belfast City Council, NRF, and project team; design team not named in source extract",
    project_type: "community heritage centre construction-status milestone",
    geometry_source: "Approximate Beechmount project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records construction and procurement status reported to the Area Working Group. It does not confirm practical completion, final fit-out scope, opening, or long-term heritage programming."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_croi_na_carraige_planning_secured_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/youth hub",
    title: "Croi na Carraige planning-secured status was recorded",
    summary:
      "Belfast West Area Working Group papers recorded Croi na Carraige - The Heart of the Rock Phase 1 as a Stage 3 project, with design team appointed, planning secured, and a funding gap still noted.",
    observed_change:
      "A documented design-team, planning, and funding-status milestone was recorded for the Croi na Carraige community hub project.",
    area: "Upper Springfield, West Belfast",
    latitude: 54.5885,
    longitude: -5.988,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-croi-na-carraige-phase-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Glor na Mona, Belfast City Council, An Ciste, NRF, and project team; design team not named in source extract",
    project_type: "community hub planning and funding-status milestone",
    geometry_source: "Approximate Upper Springfield project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records planning-secured and funding-gap status. It does not confirm full capital funding, tender award, construction start, completion, or later service delivery."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_mountainview_hotel_project_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/hotel",
    title: "Mountainview Hotel project status was recorded",
    summary:
      "Belfast West Area Working Group papers recorded The Mountainview Hotel as a Stage 3 project proposal by Failte Feirste Thiar, with a large funding gap and a need to clarify project status and alternative site location.",
    observed_change:
      "A documented status and funding-gap milestone was recorded for the proposed socially owned Mountainview Hotel project.",
    area: "West Belfast",
    latitude: 54.594,
    longitude: -5.977,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-mountainview-hotel",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Failte Feirste Thiar, Belfast City Council, NRF, and project team; design team not named in source extract",
    project_type: "socially owned hotel project status",
    geometry_source: "Approximate West Belfast area point; the source extract notes alternative site-location clarification rather than a fixed parcel.",
    geometry_precision: "area",
    limitations:
      "The event records project-status and funding-gap information. It does not confirm a final site, planning approval, full funding, construction start, opening, or hotel operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_act_community_hub_visitor_centre_status_2026",
    date: "2026-02-26",
    bucket: "planning/development/community regeneration/visitor centre",
    title: "ACT Community Hub and Visitor Centre status was recorded",
    summary:
      "Belfast West Area Working Group papers recorded the ACT Initiative Community Hub and Visitor Centre as a project underway, with building purchase and heating work complete and NRF funding assigned to the digital exhibition element.",
    observed_change:
      "A documented building-purchase, heating-work, and exhibition-funding milestone was recorded for the ACT Community Hub and Visitor Centre.",
    area: "Greater Shankill, West Belfast",
    latitude: 54.6025,
    longitude: -5.957,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council West Belfast Area Working Group paper: 26 February 2026",
    source_url: westBelfastAwg,
    source_record_id: "bcc-wbawg-2026-02-26-act-community-hub-visitor-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "The ACT Initiative, Belfast City Council, Heritage Fund, NRF, and project team; design team not named in source extract",
    project_type: "community hub and visitor-centre status milestone",
    geometry_source: "Approximate Greater Shankill project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records reported purchase, heating-work, and exhibition-funding status. It does not confirm final fit-out, opening, visitor numbers, or interpretation content."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_eastside_hotel_visitor_centre_design_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/community regeneration/hotel visitor centre",
    title: "EastSide Hotel and Visitor Centre design status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded EastSide Hotel and Visitor Centre as a Stage 3 NRF project, with the design team and promoter working to finalise a design and two East Belfast NRF projects carrying funding shortfalls.",
    observed_change:
      "A documented design and funding-shortfall milestone was recorded for the EastSide Hotel and Visitor Centre project.",
    area: "EastSide / Newtownards Road, East Belfast",
    latitude: 54.599,
    longitude: -5.884,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-eastside-hotel-visitor-centre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and NRF project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "EastSide Partnership, Belfast City Council, SOF, NRF, and project team; design team not named in source extract",
    project_type: "hotel and visitor-centre design-status milestone",
    geometry_source: "Approximate EastSide / Newtownards Road project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records design and funding-status information. It does not confirm final design, full funding, planning approval, construction start, opening, or visitor-centre operation."
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
