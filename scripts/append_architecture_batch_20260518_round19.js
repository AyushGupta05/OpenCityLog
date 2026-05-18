const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const eastBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126859/EAWG%2005.03.2026.pdf";
const southBelfastAwg =
  "https://minutes.belfastcity.gov.uk/documents/s126856/SBAWG%2023.02.26.pdf";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_the_rowe_completion_2022",
    date: "2022-11-01",
    bucket: "planning/development/architecture/office retrofit",
    title: "The Rowe was listed as built",
    summary:
      "NLA records The Rowe at 88 Whitechapel High Street as a built Tower Hamlets adaptation and extension of the former London Metropolitan School of Art, Architecture and Design, with estimated completion in November 2022.",
    observed_change:
      "A former education building opposite Whitechapel Gallery was recorded as adapted and extended for office, cafe, terrace, and cycle-facility use.",
    area: "The Rowe, Whitechapel",
    latitude: 51.5156,
    longitude: -0.0714,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Rowe",
    source_url: "https://nla.london/projects/the-rowe",
    source_record_id: "nla-the-rowe",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris, Frasers Property, BAM, Robert Bird Group, Grants Associates, and project team",
    project_type: "office retrofit and extension",
    geometry_source: "Approximate point geocoded from NLA-stated 88 Whitechapel High Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; tenant occupation, public cafe operation, and later building performance require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_150_holborn_completion_2022",
    date: "2022-12-01",
    bucket: "planning/development/architecture/workplace",
    title: "150 Holborn was listed as built",
    summary:
      "NLA records 150 Holborn as a built Camden workplace and headquarters building for Dar Group, with collaborative workspace and estimated completion in December 2022.",
    observed_change:
      "A Holborn headquarters and collaborative workplace building was recorded as completed.",
    area: "150 Holborn",
    latitude: 51.5184,
    longitude: -0.1097,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 150 Holborn",
    source_url: "https://nla.london/projects/150-holborn",
    source_record_id: "nla-150-holborn",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Perkins and Will, Dar UK, Maffeis Engineering, Introba, McLaren Construction, and project team",
    project_type: "office headquarters and collaborative workspace",
    geometry_source: "Approximate point geocoded from NLA-stated 150 Holborn location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupier move-in, workspace utilisation, and post-occupancy performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_shoreditch_arts_club_completion_2022",
    date: "2022-12-01",
    bucket: "planning/development/architecture/hospitality culture",
    title: "Shoreditch Arts Club was listed as built",
    summary:
      "NLA records Shoreditch Arts Club as a built Hackney private members club within the TEA building at 54A Redchurch Street, with estimated completion in December 2022.",
    observed_change:
      "A Redchurch Street interior and hospitality project was recorded as completed within the TEA building.",
    area: "54A Redchurch Street",
    latitude: 51.5241,
    longitude: -0.0732,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Shoreditch Arts Club",
    source_url: "https://nla.london/projects/shoreditch-arts-club",
    source_record_id: "nla-shoreditch-arts-club",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman, BGY ID, Che Zara Blomfield, and project team",
    project_type: "hospitality and arts club fit-out",
    geometry_source: "Approximate point geocoded from NLA-stated 54A Redchurch Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; membership, cultural programming, and operating status require separate source records."
  },
  {
    city_id: "london",
    event_id: "lon_arch_70_72_broadwick_street_completion_2022",
    date: "2022-11-01",
    bucket: "planning/development/architecture/workplace retrofit",
    title: "70-72 Broadwick Street was listed as built",
    summary:
      "NLA records 70-72 Broadwick Street as a built Westminster workplace project linked to 43 Carnaby Street, with entertainment, hospitality, co-working, and estimated completion in November 2022.",
    observed_change:
      "A Carnaby-area workplace, hospitality, and co-working project was recorded as completed.",
    area: "70-72 Broadwick Street / 43 Carnaby Street",
    latitude: 51.5129,
    longitude: -0.1397,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 70-72 Broadwick Street",
    source_url: "https://nla.london/projects/70-72-broadwick-street",
    source_record_id: "nla-70-72-broadwick-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Buckley Gray Yeoman, Shaftesbury Capital PLC, Open Contracts, and project team",
    project_type: "workplace and hospitality retrofit",
    geometry_source: "Approximate point geocoded from NLA-stated 43 Carnaby Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupier activity, hospitality operation, and long-term workspace performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_st_marys_walthamstow_completion_2022",
    date: "2022-12-01",
    bucket: "planning/development/architecture/heritage community",
    title: "St Mary's Church Walthamstow was listed as built",
    summary:
      "NLA records St Mary's Church, Walthamstow as a built Waltham Forest heritage project at 6 Church End, preserving and adapting the historic church for community, arts, cafe, and worship uses, with estimated completion in December 2022.",
    observed_change:
      "A Walthamstow church heritage project was recorded as completed with community, arts, cafe, and worship use.",
    area: "St Mary's Church, Walthamstow",
    latitude: 51.5838,
    longitude: -0.0114,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: St Mary's Church, Walthamstow",
    source_url: "https://nla.london/projects/st-marys-church-walthamstow",
    source_record_id: "nla-st-marys-church-walthamstow",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Matthew Lloyd Architects, PCC of St Mary's and the Parish of Walthamstow, Borras Construction, and project team",
    project_type: "heritage church repair and community adaptation",
    geometry_source: "Approximate point geocoded from NLA-stated 6 Church End location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; worship attendance, cafe operations, arts programming, and heritage maintenance require separate source records."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_zoning_for_accessibility_adopted_2021",
    date: "2021-10-07",
    bucket: "planning/development/zoning/transit accessibility",
    title: "Zoning for Accessibility resolution was adopted",
    summary:
      "NYC Council records Resolution 1761-2021 for Elevate Transit: Zoning for Accessibility, N 210270 ZRY, as passed by the Council on October 7, 2021.",
    observed_change:
      "A documented citywide zoning text milestone was recorded for transit-station accessibility and easement rules.",
    area: "New York City",
    latitude: 40.7128,
    longitude: -74.006,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 1761-2021, Elevate Transit: Zoning for Accessibility",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=5C916C0D-91C7-4DB4-BE58-885E2BA8380B&ID=5153319&Options=ID%7C&Search=",
    source_record_id: "nyc-council-res-1761-2021-zoning-for-accessibility",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, Metropolitan Transportation Authority, City Planning Commission, City Council, and public review participants",
    project_type: "citywide zoning text amendment",
    geometry_source: "Citywide zoning record represented by an approximate New York City civic-center point.",
    geometry_precision: "citywide",
    limitations:
      "The event records Council adoption of a zoning text milestone. It does not confirm installation of elevators, station construction, individual development easements, or accessibility outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_special_flushing_waterfront_district_adopted_2020",
    date: "2020-12-10",
    bucket: "planning/development/zoning/waterfront mixed use",
    title: "Special Flushing Waterfront District zoning was adopted",
    summary:
      "NYC Council and Zoning Resolution records show N 200034 ZRQ establishing the Special Flushing Waterfront District, with Council approval on December 10, 2020.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for the Downtown Flushing waterfront.",
    area: "Downtown Flushing waterfront, Queens",
    latitude: 40.759,
    longitude: -73.833,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Special Flushing Waterfront District",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/special-flushing-waterfront-district-n-200034-zrq",
    source_record_id: "nyc-zr-special-flushing-waterfront-district-n-200034-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council adoption date for related zoning text amendment",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, project applicant, and public review participants",
    project_type: "special-purpose waterfront zoning district",
    geometry_source: "Approximate point placed on the Flushing Creek waterfront rather than a mapped district boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm later waterfront public-access delivery, remediation, construction starts, housing completions, or final built form."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_bay_street_corridor_district_adopted_2019",
    date: "2019-06-26",
    bucket: "planning/development/zoning/mixed use district",
    title: "Special Bay Street Corridor District zoning was adopted",
    summary:
      "NYC Zoning Resolution Appendix B records the Special Bay Street Corridor District, 190114(A) ZRR, with BOE/Council adoption on June 26, 2019.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for the Bay Street corridor in Staten Island.",
    area: "Bay Street corridor, Staten Island",
    latitude: 40.633,
    longitude: -74.076,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution Appendix B: Index of Special Purpose Districts",
    source_url: "https://zr.planning.nyc.gov/appendix-b-index-special-purpose-districts",
    source_record_id: "nyc-zr-appendix-b-special-bay-street-corridor-district-190114a-zrr",
    source_retrieved_at: retrievedAt,
    source_date_field: "Appendix B BOE/Council adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed on the Bay Street corridor rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm subsequent permits, public-realm projects, housing completions, business changes, or infrastructure delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_east_harlem_corridors_district_adopted_2017",
    date: "2017-11-30",
    bucket: "planning/development/zoning/mixed use district",
    title: "Special East Harlem Corridors District zoning was adopted",
    summary:
      "NYC Council records Resolution 1742-2017 approving N 170359 ZRM on November 30, 2017, establishing the Special East Harlem Corridors District and modifying Appendix F.",
    observed_change:
      "A documented special-purpose zoning district change was recorded for East Harlem corridors.",
    area: "East Harlem, Manhattan",
    latitude: 40.796,
    longitude: -73.941,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Res 1742-2017, East Harlem Neighborhood Rezoning",
    source_url: "https://legistar.council.nyc.gov/LegislationDetail.aspx?GUID=79EAC7A0-3BBA-45DF-AA14-08A5B410A668&ID=3217088&Options=&Search=",
    source_record_id: "nyc-council-res-1742-2017-special-east-harlem-corridors-district",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council resolution adoption date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district",
    geometry_source: "Approximate point placed within East Harlem rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning adoption. It does not confirm subsequent affordable-housing agreements, permits, construction starts, public-realm work, or anti-displacement outcomes."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_downtown_far_rockaway_district_adopted_2017",
    date: "2017-09-07",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "Special Downtown Far Rockaway District zoning was adopted",
    summary:
      "NYC Council records Resolution 1651-2017 for N 170244(A) ZRQ as approved on September 7, 2017, establishing the Special Downtown Far Rockaway District and related Mandatory Inclusionary Housing area.",
    observed_change:
      "A documented zoning text and map milestone was recorded for the Downtown Far Rockaway development-plan area.",
    area: "Downtown Far Rockaway, Queens",
    latitude: 40.603,
    longitude: -73.753,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Council Legistar: Downtown Far Rockaway Development Plan meeting records",
    source_url: "https://legistar.council.nyc.gov/MeetingDetail.aspx?GUID=26A3BD82-86F3-47FE-A13E-AAC05219B54E&ID=563540",
    source_record_id: "nyc-council-2017-09-07-downtown-far-rockaway-n-170244a-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "City Council meeting approval date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Economic Development Corporation, NYC Department of City Planning, City Planning Commission, City Council, and public review participants",
    project_type: "special-purpose zoning district and neighborhood development plan",
    geometry_source: "Approximate point placed in Downtown Far Rockaway rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records Council approval of zoning and related land-use actions. It does not confirm later infrastructure phases, building permits, housing completions, or business outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sanctuary_theatre_design_team_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/community regeneration/theatre",
    title: "Sanctuary Theatre design-team status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded the Sanctuary Theatre refurbishment at Castlereagh Street as a PEACEPLUS Local Action Plan capital project, with design team appointed and a steering group/design team meeting held.",
    observed_change:
      "A documented design-team appointment and project-progress milestone was recorded for the Sanctuary Theatre refurbishment.",
    area: "Sanctuary Theatre, Castlereagh Street",
    latitude: 54.597,
    longitude: -5.897,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-sanctuary-theatre",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and PEACEPLUS project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Sanctuary Theatre, Belfast City Council, PEACEPLUS programme, and project team; design team not named in source extract",
    project_type: "theatre refurbishment design-team milestone",
    geometry_source: "Approximate Castlereagh Street project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records design-team and steering-group status. It does not confirm planning approval, procurement, construction start, completion, or theatre reopening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sailortown_titanic_quarter_bridge_stage1_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/public realm/bridge",
    title: "Sailortown-Titanic Quarter bridge Stage 1 status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded consultants appointed for RIBA Stage 1 and 2 design services for a proposed cross-harbour pedestrian and cycle bridge between Sailortown and Titanic Quarter, with Stage 1 report complete.",
    observed_change:
      "A documented early-design milestone was recorded for a proposed Sailortown to Titanic Quarter pedestrian and cycle bridge.",
    area: "Sailortown / Titanic Quarter",
    latitude: 54.6085,
    longitude: -5.909,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-sailortown-titanic-quarter-bridge",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and DfI project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Department for Infrastructure, appointed consultants, and project team; consultant team not named in source extract",
    project_type: "pedestrian and cycle bridge early-design milestone",
    geometry_source: "Approximate point placed between Sailortown and Titanic Quarter rather than a surveyed bridge alignment.",
    geometry_precision: "area",
    limitations:
      "The event records consultant appointment and Stage 1 report status. It does not confirm planning approval, marine consents, funding, procurement, construction start, bridge alignment, or opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_titanic_people_exhibition_handover_status_2026",
    date: "2026-03-05",
    bucket: "planning/development/culture/exhibition",
    title: "Titanic People Exhibition handover status was recorded",
    summary:
      "Belfast East Area Working Group papers recorded the Titanic People Exhibition as an Urban Villages project underway, with handover expected in Spring 2026 after delays.",
    observed_change:
      "A documented handover-status milestone was recorded for the Titanic People Exhibition project.",
    area: "Titanic Quarter, East Belfast",
    latitude: 54.608,
    longitude: -5.908,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council East Belfast Area Working Group paper: 5 March 2026",
    source_url: eastBelfastAwg,
    source_record_id: "bcc-eawg-2026-03-05-titanic-people-exhibition",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group meeting date and Urban Villages project status table",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Urban Villages, Belfast City Council, Titanic People Exhibition project team; design team not named in source extract",
    project_type: "cultural exhibition delivery-status milestone",
    geometry_source: "Approximate Titanic Quarter project-area point; the source extract does not provide a room, building, or exhibit boundary.",
    geometry_precision: "area",
    limitations:
      "The event records handover-status reporting. It does not confirm final handover, public opening, exhibition content, visitor access, or long-term operation."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_coffee_culture_works_commencement_status_2026",
    date: "2026-02-18",
    bucket: "planning/development/community regeneration/cafe culture",
    title: "Coffee Culture works-commencement status was recorded",
    summary:
      "Belfast South Area Working Group papers recorded Coffee Culture as a Social Outcomes Fund project with contractor appointed and works due to commence in February 2026, including a sod-cutting photo call on 18 February.",
    observed_change:
      "A documented contractor-appointment and works-commencement milestone was recorded for the Coffee Culture capital project.",
    area: "Sandy Row / South Belfast",
    latitude: 54.591,
    longitude: -5.937,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council South Belfast Area Working Group paper: 23 February 2026",
    source_url: southBelfastAwg,
    source_record_id: "bcc-sbawg-2026-02-23-coffee-culture",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group paper noting 18 February 2026 sod-cutting date",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Coffee Culture project promoter, Belfast City Council, SOF, BIF, Urban Villages, Department for Communities, and project team; design team not named in source extract",
    project_type: "community tourism and cafe-culture capital project",
    geometry_source: "Approximate Sandy Row / South Belfast project-area point; the source extract does not provide a parcel boundary.",
    geometry_precision: "area",
    limitations:
      "The event records contractor appointment and works-commencement status. It does not confirm completion, opening, final fit-out, operating model, or visitor activity."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_met_small_sided_pitches_completed_2025",
    date: "2025-09-01",
    bucket: "planning/development/sports infrastructure",
    title: "Belfast Met Campus small-sided games pitches were recorded as completed",
    summary:
      "Belfast South Area Working Group papers recorded Belfast Met Campus small-sided games pitches as completed in September 2025 within the Sporting Pitches Investment 2025/26 update.",
    observed_change:
      "A documented completion milestone was recorded for small-sided games pitches at Belfast Met Campus.",
    area: "Belfast Met Campus",
    latitude: 54.616,
    longitude: -5.911,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council South Belfast Area Working Group paper: 23 February 2026",
    source_url: southBelfastAwg,
    source_record_id: "bcc-sbawg-2026-02-23-belfast-met-campus-small-sided-games-pitches",
    source_retrieved_at: retrievedAt,
    source_date_field: "Area Working Group sports-pitches update noting September 2025 completion",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Belfast Met, Sporting Pitches Investment Programme, and project team; design team not named in source extract",
    project_type: "sports pitch completion milestone",
    geometry_source: "Approximate Belfast Met Campus point; the source extract does not provide a surveyed pitch boundary.",
    geometry_precision: "area",
    limitations:
      "The event records reported completion of small-sided games pitches. It does not confirm exact pitch layout, booking availability, maintenance arrangements, or measured sports participation."
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
