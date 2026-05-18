const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastPlanningMar2024 =
  "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11668";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_60_london_wall_completion_2020",
    date: "2020-11-01",
    bucket: "planning/development/architecture/office refurbishment",
    title: "60 London Wall was listed as built",
    summary:
      "New London Architecture records 60 London Wall in the City of London as built, with estimated completion in November 2020.",
    observed_change:
      "A documented City of London office project was recorded as reaching built status.",
    area: "City of London",
    latitude: 51.5165823,
    longitude: -0.0871707,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 60 London Wall",
    source_url: "https://nla.london/projects/60-london-wall",
    source_record_id: "nla-60-london-wall",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "office refurbishment completion",
    geometry_source: "Nominatim geocoder point for 60 London Wall, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact handover date, tenant occupation, lease status, construction cost, or later building performance."
  },
  {
    city_id: "london",
    event_id: "lon_arch_grand_junction_st_mary_magdalene_completion_2019",
    date: "2019-07-01",
    bucket: "planning/development/architecture/heritage community venue",
    title: "Grand Junction at St Mary Magdalene's was listed as built",
    summary:
      "New London Architecture records Grand Junction at St Mary Magdalene's in Westminster as built, with estimated completion in July 2019.",
    observed_change:
      "A documented Westminster heritage and community-venue project was recorded as reaching built status.",
    area: "Paddington / Westminster",
    latitude: 51.5222959,
    longitude: -0.1890764,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Grand Junction at St Mary Magdalene's",
    source_url: "https://nla.london/projects/grand-junction-at-st-mary-magdalenes",
    source_record_id: "nla-grand-junction-at-st-mary-magdalenes",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Dow Jones Architects",
    project_type: "heritage community venue completion",
    geometry_source: "Nominatim geocoder point for Rowington Close, the address context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact public opening date, programming, conservation-condition discharge, attendance, or later venue condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_33_king_street_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/commercial refurbishment",
    title: "33 King Street was listed as built",
    summary:
      "New London Architecture records 33 King Street in St James's as built, with completion in May 2019.",
    observed_change:
      "A documented Westminster commercial building project was recorded as reaching built status.",
    area: "St James's / Westminster",
    latitude: 51.5066616,
    longitude: -0.1366299,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 33 King Street",
    source_url: "https://nla.london/projects/33-king-street",
    source_record_id: "nla-33-king-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "commercial building completion",
    geometry_source: "Nominatim geocoder point for 33 King Street, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm exact handover date, occupancy, conservation conditions, retail or office leasing, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kimpton_fitzroy_completion_2018",
    date: "2018-10-01",
    bucket: "planning/development/architecture/hotel refurbishment",
    title: "Kimpton Fitzroy was listed as built",
    summary:
      "New London Architecture records the Kimpton Fitzroy hotel at Russell Square as built, with estimated completion in October 2018.",
    observed_change:
      "A documented Camden hotel refurbishment project was recorded as reaching built status.",
    area: "Bloomsbury / Camden",
    latitude: 51.5224194,
    longitude: -0.1249745,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kimpton Fitzroy",
    source_url: "https://nla.london/projects/kimpton-fitzroy",
    source_record_id: "nla-kimpton-fitzroy",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "EPR Architects",
    project_type: "hotel refurbishment completion",
    geometry_source: "Nominatim geocoder point for Kimpton Fitzroy / Russell Square, matching the hotel context listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records an estimated completion month. It does not confirm exact reopening date, hotel operations, heritage-condition discharge, guest capacity, or later building condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_harley_street_proton_beam_completion_2019",
    date: "2019-05-01",
    bucket: "planning/development/architecture/healthcare",
    title: "Harley Street Proton Beam Therapy was listed as built",
    summary:
      "New London Architecture records Harley Street Proton Beam Therapy at 141 Harley Street as built, with completion in May 2019.",
    observed_change:
      "A documented Westminster healthcare project was recorded as reaching built status.",
    area: "Marylebone / Westminster",
    latitude: 51.5225906,
    longitude: -0.1489452,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Harley Street Proton Beam Therapy",
    source_url: "https://nla.london/projects/harley-street-proton-beam-therapy",
    source_record_id: "nla-harley-street-proton-beam-therapy",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Sonnemann Toon Architects LLP",
    project_type: "healthcare facility completion",
    geometry_source: "Nominatim geocoder point for 141 Harley Street, matching the address listed on the NLA project page.",
    geometry_precision: "site approximate",
    limitations:
      "Source is a curated project page and records a completion month. It does not confirm clinical commissioning, service start, patient access, equipment operation, or later facility performance."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_new_york_climate_exchange_vision_unveiled_2023",
    date: "2023-04-24",
    bucket: "planning/development/architecture/climate research campus",
    title: "New York Climate Exchange vision was unveiled",
    summary:
      "The NYC Mayor's Office announced on April 24, 2023 a vision with Stony Brook University for a climate research and jobs hub on Governors Island.",
    observed_change:
      "A documented city announcement recorded a planning milestone for a Governors Island climate research campus.",
    area: "Governors Island / Manhattan",
    latitude: 40.6886536,
    longitude: -74.018276,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Mayor's Office release: New York Climate Exchange vision",
    source_url:
      "https://www.nyc.gov/mayors-office/news/2023/04/mayor-adams-trust-governors-island-stony-brook-university-transformational-vision-for",
    source_record_id: "nyc-mayor-2023-04-24-new-york-climate-exchange-vision",
    source_retrieved_at: retrievedAt,
    source_date_field: "Mayor's Office release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Vision-stage announcement names a project team but does not document final constructed building delivery",
    project_type: "climate research campus planning milestone",
    geometry_source: "Nominatim geocoder point for Governors Island, the island context named in the announcement.",
    geometry_precision: "island approximate",
    limitations:
      "The event records a vision announcement only. It does not confirm final design approval, environmental review completion, permits, construction start, campus opening, or later operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_gotham_point_completion_opening_2022",
    date: "2022-11-15",
    bucket: "planning/development/architecture/mixed income housing",
    title: "Gotham Point completion and opening was announced",
    summary:
      "NYC HPD announced on November 15, 2022 the completion and opening of Gotham Point in Long Island City.",
    observed_change:
      "A documented city housing-agency announcement recorded completion and opening of a mixed-income residential development.",
    area: "Long Island City / Queens",
    latitude: 40.7385821,
    longitude: -73.9605658,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Gotham Point ribbon cutting",
    source_url:
      "https://www.nyc.gov/site/hpd/news/057-22/the-gotham-organization-riseboro-community-partnership-celebrate-completion-opening-of",
    source_record_id: "nyc-hpd-2022-11-15-gotham-point-completion-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release does not name the project architect on the cited page",
    project_type: "mixed-income residential completion and opening",
    geometry_source: "Nominatim geocoder point for Gotham Point South Tower in Long Island City.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a completion/opening announcement only. It does not independently verify lease-up, affordability compliance, commercial occupancy, long-term operations, or later building condition."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_made_bush_terminal_building_unveiled_2024",
    date: "2024-11-01",
    bucket: "planning/development/architecture/industrial campus adaptive reuse",
    title: "MADE Bush Terminal building was unveiled",
    summary:
      "NYCEDC's MADE Bush Terminal project site announced on November 1, 2024 the unveiling of a new building and upcoming redevelopment milestones for the Sunset Park campus.",
    observed_change:
      "A documented NYCEDC-linked project-site announcement recorded an adaptive-reuse campus milestone.",
    area: "Sunset Park / Brooklyn",
    latitude: 40.6550588,
    longitude: -74.0165668,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "MADE Bush Terminal / NYCEDC release: new building at Bush Terminal",
    source_url:
      "https://madebushterminal.nyc/press-release/nycedc-unveils-new-building-bush-terminal",
    source_record_id: "made-bush-terminal-2024-11-01-new-building-unveiled",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYCEDC-linked project-site release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Release credits nARCHITECTS renderings but does not by itself verify final construction scope for all campus elements",
    project_type: "industrial campus adaptive-reuse milestone",
    geometry_source: "Nominatim geocoder point for Bush Terminal in Sunset Park, used as the campus marker for the release.",
    geometry_precision: "campus approximate",
    limitations:
      "The event records an unveiling and campus milestone announcement only. It does not confirm all tenant fit-outs, leasing, later construction phases, public-space completion, or long-term operations."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_made_bush_terminal_pier6_groundbreaking_2025",
    date: "2025-08-12",
    bucket: "planning/development/architecture/waterfront public space",
    title: "Pier 6 at MADE Bush Terminal broke ground",
    summary:
      "NYCEDC's MADE Bush Terminal project site announced on August 12, 2025 the groundbreaking for Pier 6 and five acres of waterfront community space.",
    observed_change:
      "A documented NYCEDC-linked project-site announcement recorded a waterfront public-space construction-start milestone.",
    area: "Sunset Park / Brooklyn",
    latitude: 40.6550588,
    longitude: -74.0165668,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "MADE Bush Terminal / NYCEDC release: Pier 6 groundbreaking",
    source_url:
      "https://madebushterminal.nyc/press-release/nycedc-breaks-ground-pier-6-releases-inaugural-sunset-park-report",
    source_record_id: "made-bush-terminal-2025-08-12-pier6-groundbreaking",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYCEDC-linked project-site release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "Groundbreaking release does not name a final built-design architect for all public-space elements",
    project_type: "waterfront public-space construction-start milestone",
    geometry_source: "Nominatim geocoder point for Bush Terminal in Sunset Park, used as an approximate marker for Pier 6 within the campus.",
    geometry_precision: "campus approximate",
    limitations:
      "The event records a groundbreaking announcement only. It does not confirm later construction progress, opening date, final public-space condition, maintenance arrangements, or usage."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_casa_celina_opening_2024",
    date: "2024-06-12",
    bucket: "planning/development/architecture/senior affordable housing",
    title: "Casa Celina opening was announced",
    summary:
      "NYC HPD announced on June 12, 2024 a ribbon-cutting milestone for Casa Celina and more than 200 affordable homes in Soundview.",
    observed_change:
      "A documented city housing-agency announcement recorded opening of a senior affordable-housing development.",
    area: "Soundview / Bronx",
    latitude: 40.827620054586,
    longitude: -73.863545435219,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC HPD release: Casa Celina ribbon cutting",
    source_url:
      "https://www.nyc.gov/site/hpd/news/020-24/hpd-nycha-hdc-partners-celebrate-200-new-affordable-homes-soundview",
    source_record_id: "nyc-hpd-2024-06-12-casa-celina-opening",
    source_retrieved_at: retrievedAt,
    source_date_field: "HPD release date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "HPD release does not name the project architect on the cited page",
    project_type: "senior affordable-housing opening",
    geometry_source: "US Census geocoder point for 1001 Thieriot Avenue, used as the Casa Celina / Soundview site marker.",
    geometry_precision: "site approximate",
    limitations:
      "The event records an opening announcement only. It does not independently verify full lease-up, affordability compliance, service delivery, tenant outcomes, or later building condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_21_queen_street_hotel_permission_granted_2024",
    date: "2024-11-12",
    bucket: "planning/development/architecture/hotel planning approval",
    title: "21 Queen Street hotel permission and listed-building consent were granted",
    summary:
      "Belfast City Council Planning Committee minutes for November 12, 2024 record planning permission and Listed Building Consent for a 74-bedroom hotel at the former police station at 21 Queen Street.",
    observed_change:
      "A documented planning-committee minute recorded a hotel conversion, refurbishment, extension, and listed-building consent milestone.",
    area: "Queen Street / Belfast city centre",
    latitude: 54.5977078,
    longitude: -5.9333374,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda item: 21 Queen Street hotel",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=80705",
    source_record_id: "bcc-planning-2024-11-12-la04-2020-0568-0569-21-queen-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee agenda-item date and decision minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited text",
    project_type: "hotel conversion and listed-building-consent milestone",
    geometry_source: "Nominatim geocoder point for Queen Street, used as an approximate marker for 21 Queen Street because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning and listed-building consent decision. The minute also notes earlier decisions had been quashed before reconsideration. It does not confirm discharge of conditions, construction start, completion, opening, or hotel operations."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_272_limestone_road_hmo_permission_2024",
    date: "2024-03-19",
    bucket: "planning/development/architecture/change of use approval",
    title: "272 Limestone Road HMO change of use was approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 19, 2024 record approval of a change of use from dwelling to a six-bed HMO at 272 Limestone Road.",
    observed_change:
      "A documented planning-committee minute recorded a residential change-of-use approval milestone.",
    area: "Limestone Road / North Belfast",
    latitude: 54.6159542,
    longitude: -5.9314009,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 19 March 2024",
    source_url: belfastPlanningMar2024,
    source_record_id: "bcc-planning-2024-03-19-ai77386-la04-2023-3481-272-limestone-road",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name designers for this change-of-use item",
    project_type: "residential HMO change-of-use approval",
    geometry_source: "Nominatim geocoder point for Limestone Road, used as an approximate street marker because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm building-control approval, works start, completion, licensing, occupation, or later residential condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_27_ponsonby_avenue_hmo_permission_2024",
    date: "2024-03-19",
    bucket: "planning/development/architecture/change of use approval",
    title: "27 Ponsonby Avenue HMO change of use was approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 19, 2024 record approval of a change of use from dwelling to a six-bed House in Multiple Occupation at 27 Ponsonby Avenue.",
    observed_change:
      "A documented planning-committee minute recorded a residential change-of-use approval milestone.",
    area: "Ponsonby Avenue / North Belfast",
    latitude: 54.6153785,
    longitude: -5.935987,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 19 March 2024",
    source_url: belfastPlanningMar2024,
    source_record_id: "bcc-planning-2024-03-19-ai77387-la04-2023-3319-27-ponsonby-avenue",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name designers for this change-of-use item",
    project_type: "residential HMO change-of-use approval",
    geometry_source: "Nominatim geocoder point for Ponsonby Avenue, used as an approximate street marker because the exact address point was not returned.",
    geometry_precision: "street approximate",
    limitations:
      "The event records a planning approval only. It does not confirm building-control approval, works start, completion, licensing, occupation, or later residential condition."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belvoir_park_hospital_dwellings_permission_2024",
    date: "2024-03-19",
    bucket: "planning/development/architecture/residential heritage enabling approval",
    title: "Former Belvoir Park Hospital dwellings and pavilion-enabling works were approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 19, 2024 record approval of 33 dwellings, public open space, a play area, and enabling works for three listed pavilions at the former Belvoir Park Hospital site.",
    observed_change:
      "A documented planning-committee minute recorded a residential and heritage-enabling development approval milestone.",
    area: "Belvoir Park / Belfast",
    latitude: 54.5446336,
    longitude: -5.9306928,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 19 March 2024",
    source_url: belfastPlanningMar2024,
    source_record_id: "bcc-planning-2024-03-19-ai77389-la04-2020-2607-belvoir-park-hospital",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the full design team in the cited agenda text",
    project_type: "residential and listed-pavilion enabling development approval",
    geometry_source: "Nominatim geocoder point for Hospital Road, used as an approximate marker for the former Belvoir Park Hospital site.",
    geometry_precision: "area approximate",
    limitations:
      "The event records a planning approval only. It does not confirm conditions, Section 76 delivery, listed-pavilion refurbishment, construction start, completion, occupation, or public-space opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_former_print_hall_conference_events_permission_2024",
    date: "2024-03-19",
    bucket: "planning/development/architecture/adaptive reuse approval",
    title: "Former Print Hall conference and events use was approved",
    summary:
      "Belfast City Council Planning Committee minutes for March 19, 2024 record a change-of-use application for conference and events/entertainment use at the Former Print Hall, 124-144 Royal Avenue.",
    observed_change:
      "A documented planning-committee minute recorded an adaptive-reuse planning milestone for a city-centre building.",
    area: "Royal Avenue / Belfast city centre",
    latitude: 54.6034947,
    longitude: -5.930669,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Planning Committee agenda: 19 March 2024",
    source_url: belfastPlanningMar2024,
    source_record_id: "bcc-planning-2024-03-19-ai77396-la04-2024-0054-former-print-hall",
    source_retrieved_at: retrievedAt,
    source_date_field: "Planning Committee meeting date and minute",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Planning Committee minute does not name the architect in the cited agenda text",
    project_type: "conference and events adaptive-reuse approval",
    geometry_source: "Nominatim geocoder point for the Telegraph Building at 124-144 Royal Avenue, matching the Former Print Hall address in the agenda.",
    geometry_precision: "site approximate",
    limitations:
      "The event records a planning-committee agenda and minute milestone. It does not confirm condition discharge, fit-out start, completion, licensing, event operations, or later building condition."
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
