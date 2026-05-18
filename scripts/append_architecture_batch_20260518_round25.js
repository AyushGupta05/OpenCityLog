const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastNov2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85801";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_gaslight_building_completion_2019",
    date: "2019-09-01",
    bucket: "planning/development/architecture/adaptive reuse office",
    title: "The Gaslight Building was listed as built",
    summary:
      "New London Architecture records The Gaslight Building in Fitzrovia as a built mixed-use commercial development created within the shell of an Art Deco building, with estimated completion in September 2019.",
    observed_change:
      "A documented Fitzrovia commercial adaptive-reuse project was recorded as reaching built status.",
    area: "Rathbone Street / Fitzrovia",
    latitude: 51.5183,
    longitude: -0.1356,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Gaslight Building",
    source_url: "https://nla.london/projects/the-gaslight-building",
    source_record_id: "nla-the-gaslight-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "dMFK Architects and The Gaslight Building project team",
    project_type: "commercial adaptive reuse within Art Deco building shell",
    geometry_source: "Approximate point geocoded from NLA-stated 29 Rathbone Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; leasing, fit-out, heritage approvals, and building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_old_admiralty_building_completion_2020",
    date: "2020-09-01",
    bucket: "planning/development/architecture/heritage adaptation",
    title: "Old Admiralty Building adaptation was listed as built",
    summary:
      "New London Architecture records the Old Admiralty Building adaptation in Westminster as built, with estimated completion in September 2020 after restoration of historic fabric and services upgrades.",
    observed_change:
      "A documented Whitehall heritage-building adaptation was recorded as reaching built status.",
    area: "Old Admiralty Building / Whitehall",
    latitude: 51.5059,
    longitude: -0.1288,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Old Admiralty Building",
    source_url: "https://nla.london/projects/old-admiralty-building",
    source_record_id: "nla-old-admiralty-building",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "BDP and Old Admiralty Building project team",
    project_type: "heritage building adaptation and services upgrade",
    geometry_source: "Approximate point geocoded from Old Admiralty Building / Whitehall location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; internal occupation, public access, conservation-condition details, and departmental use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hyde_london_city_completion_2024",
    date: "2024-09-01",
    bucket: "planning/development/architecture/hotel reuse",
    title: "Hyde London City was listed as built",
    summary:
      "New London Architecture records Hyde London City at 15 Old Bailey as a built restoration returning a Victorian building to hotel use, with estimated completion in September 2024.",
    observed_change:
      "A documented Old Bailey building restoration and hotel reuse project was recorded as reaching built status.",
    area: "Old Bailey / City of London",
    latitude: 51.5162,
    longitude: -0.1024,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hyde London City",
    source_url: "https://nla.london/projects/hyde-london-city",
    source_record_id: "nla-hyde-london-city",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "studio moren and Hyde London City project team",
    project_type: "hotel restoration and reuse",
    geometry_source: "Approximate point geocoded from NLA-stated 15 Old Bailey location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; hotel opening, room count, operational use, and conservation details require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_finsbury_circus_gardens_completion_2025",
    date: "2025-06-01",
    bucket: "planning/development/architecture/parks public realm",
    title: "Finsbury Circus Gardens was listed as built",
    summary:
      "New London Architecture records Finsbury Circus Gardens in the City of London as built, with estimated completion in June 2025 for the public-garden project.",
    observed_change:
      "A documented public-garden and open-space project at Finsbury Circus was recorded as reaching built status.",
    area: "Finsbury Circus / City of London",
    latitude: 51.5176,
    longitude: -0.0851,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Finsbury Circus Gardens, City of London",
    source_url: "https://nla.london/projects/finsbury-circus-gardens-city-of-london",
    source_record_id: "nla-finsbury-circus-gardens-city-of-london",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Architecture 00 / Studio Weave and Finsbury Circus Gardens project team",
    project_type: "public garden and open-space works",
    geometry_source: "Approximate point geocoded from Finsbury Circus location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; public reopening date, maintenance arrangements, planting establishment, and long-term access require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_west_end_project_completion_2023",
    date: "2023-07-01",
    bucket: "planning/development/architecture/public realm",
    title: "West End Project was listed as built",
    summary:
      "New London Architecture records Camden Council's West End Project around Tottenham Court Road as built, with estimated completion in July 2023.",
    observed_change:
      "A documented Tottenham Court Road public-realm project was recorded as reaching built status.",
    area: "Tottenham Court Road / West End",
    latitude: 51.5216,
    longitude: -0.1353,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: West End Project",
    source_url: "https://nla.london/projects/west-end-project",
    source_record_id: "nla-west-end-project",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Camden Council and West End Project team; architect not named on the NLA page",
    project_type: "public-realm and street-space transformation",
    geometry_source: "Approximate point geocoded from NLA-stated Tottenham Court Road / Goodge Street location.",
    geometry_precision: "corridor",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; traffic changes, air-quality outcomes, maintenance, and full corridor extents require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_kingsbridge_armory_redevelopment_text_adopted_2025",
    date: "2025-10-29",
    bucket: "planning/development/zoning/special mixed use district",
    title: "Kingsbridge Armory Redevelopment zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Kingsbridge Armory Redevelopment, N 250296 ZRX, with an adopted date of October 29, 2025, adding zoning text for sections 74-182 and 123-90, including new MX-30.",
    observed_change:
      "A documented zoning text milestone was recorded for the Kingsbridge Armory redevelopment area in the Bronx.",
    area: "Kingsbridge Armory / Bronx Community District 7",
    latitude: 40.867,
    longitude: -73.8974,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Kingsbridge Armory Redevelopment",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/kingsbridge-armory-redevelopment-n-250296-zrx",
    source_record_id: "nyc-zr-kingsbridge-armory-redevelopment-n-250296-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related special mixed-use district zoning text amendment",
    geometry_source: "Approximate point geocoded from the Kingsbridge Armory location rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, tenanting, public access, adaptive-reuse work, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_clermont_house_1640_anthony_mih_text_adopted_2025",
    date: "2025-10-09",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "Clermont House: 1640 Anthony Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Clermont House: 1640 Anthony Avenue, N 250222 ZRX, with an adopted date of October 9, 2025, amending Appendix F for Bronx Community District 4 Mandatory Inclusionary Housing area 4.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1640 Anthony Avenue area in the Bronx.",
    area: "1640 Anthony Avenue / Bronx Community District 4",
    latitude: 40.845,
    longitude: -73.9056,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Clermont House: 1640 Anthony Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/clermont-house-1640-anthony-avenue-n-250222-zrx",
    source_record_id: "nyc-zr-clermont-house-1640-anthony-avenue-n-250222-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_1946_east_7th_street_mih_text_adopted_2025",
    date: "2025-09-25",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "1946 East 7th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1946 East 7th Street, N 240253 ZRK, with an adopted date of September 25, 2025, amending Appendix F for Brooklyn Community District 15 Mandatory Inclusionary Housing area 12.",
    observed_change:
      "A documented zoning text milestone was recorded for the 1946 East 7th Street area in Brooklyn.",
    area: "1946 East 7th Street / Brooklyn Community District 15",
    latitude: 40.6046,
    longitude: -73.9665,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1946 East 7th Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/1946-east-7th-street-n-240253-zrk",
    source_record_id: "nyc-zr-1946-east-7th-street-n-240253-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_5602_5604_broadway_mih_text_adopted_2025",
    date: "2025-09-10",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "5602-5604 Broadway zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 5602-5604 Broadway, N 240407 ZRX, with an adopted date of September 10, 2025, amending Appendix F for Bronx Community District 8 Mandatory Inclusionary Housing area 1.",
    observed_change:
      "A documented zoning text milestone was recorded for the 5602-5604 Broadway area in the Bronx.",
    area: "5602-5604 Broadway / Bronx Community District 8",
    latitude: 40.8814,
    longitude: -73.9042,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 5602-5604 Broadway",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/5602-5604-broadway-n-240407-zrx",
    source_record_id: "nyc-zr-5602-5604-broadway-n-240407-zrx",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_236_gold_street_mih_text_adopted_2025",
    date: "2025-08-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "236 Gold Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 236 Gold Street, N 250032 ZRK, with an adopted date of August 14, 2025, amending Appendix F for Brooklyn Community District 2 Mandatory Inclusionary Housing area 13.",
    observed_change:
      "A documented zoning text milestone was recorded for the 236 Gold Street area in Brooklyn.",
    area: "236 Gold Street / Downtown Brooklyn",
    latitude: 40.6966,
    longitude: -73.9827,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 236 Gold Street",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/236-gold-street-n-250032-zrk",
    source_record_id: "nyc-zr-236-gold-street-n-250032-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment and MIH map update",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_st_georges_market_new_stalls_budget_2025",
    date: "2025-11-21",
    bucket: "planning/development/market heritage facility",
    title: "St George's Market new-stalls budget was agreed",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 21 November 2025 recorded a satisfactory tender return for St George's Market New Stalls and agreed a maximum allocation of GBP 433,840.",
    observed_change:
      "A documented capital-programme milestone was recorded for replacement market stalls at St George's Market.",
    area: "St George's Market",
    latitude: 54.5959,
    longitude: -5.922,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 21 November 2025",
    source_url: belfastNov2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-11-21-st-georges-market-new-stalls-budget",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and St George's Market project team; stall supplier not named in the minutes",
    project_type: "market-stall replacement capital-programme milestone",
    geometry_source: "Approximate point geocoded from St George's Market location.",
    geometry_precision: "site",
    limitations:
      "The event records tender and budget approval only. It does not confirm contract award, installation start, completion, stall design, trader impacts, or market-operation changes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_wilmont_house_hs_works_stage3_2025",
    date: "2025-11-21",
    bucket: "planning/development/heritage conservation",
    title: "Wilmont House health and safety works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 21 November 2025 recorded agreement that Wilmont House Health and Safety Works be moved immediately to Stage 3 - Committed due to the condition of the building, pending further development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for making Wilmont House safe for further survey and renovation work.",
    area: "Wilmont House / Sir Thomas and Lady Dixon Park",
    latitude: 54.54,
    longitude: -5.9827,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 21 November 2025",
    source_url: belfastNov2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-11-21-wilmont-house-hs-works-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Wilmont House heritage project team; design team not named in the minutes",
    project_type: "heritage building health-and-safety works milestone",
    geometry_source: "Approximate point geocoded from Wilmont House location.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm tender result, contract award, works start, completion, full restoration, future use, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_fernhill_house_hs_works_deferred_2025",
    date: "2025-11-21",
    bucket: "planning/development/heritage conservation",
    title: "Fernhill House health and safety works decision was deferred",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 21 November 2025 recorded deferral of the recommendation to move Fernhill House Health and Safety Works to Stage 3 until the Irish Language Policy call-in had been resolved.",
    observed_change:
      "A documented capital-programme governance milestone was recorded for Fernhill House health and safety works.",
    area: "Fernhill House / Glencairn",
    latitude: 54.6133,
    longitude: -5.9817,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 21 November 2025",
    source_url: belfastNov2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-11-21-fernhill-house-hs-works-deferred",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and recorded deferral",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Fernhill House heritage project team; design team not named in the minutes",
    project_type: "heritage building health-and-safety works governance milestone",
    geometry_source: "Approximate point geocoded from Fernhill House location.",
    geometry_precision: "site",
    limitations:
      "The event records a deferral, not approval of works. It does not confirm Stage 3 status, tendering, contract award, works start, completion, restoration, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_colin_active_travel_stage3_2025",
    date: "2025-11-21",
    bucket: "planning/development/active travel greenway",
    title: "Colin Active Travel Phase 1 moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 21 November 2025 recorded agreement that Colin Active Travel Phase 1, formerly Colin Greenway, be moved to Stage 3 - Committed and held at Tier 0 - Scheme at Risk pending further development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for active-travel route development in the Colin area.",
    area: "Colin area / west Belfast",
    latitude: 54.5727,
    longitude: -6.0288,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 21 November 2025",
    source_url: belfastNov2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-11-21-colin-active-travel-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Department for Infrastructure, Colin Neighbourhood Partnership, and active-travel project partners",
    project_type: "active-travel route capital-programme milestone",
    geometry_source: "Approximate district point placed in Colin Glen rather than a mapped route alignment.",
    geometry_precision: "district",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm route alignment, designs, tender result, contract award, construction, completion, or route opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_workshop_plant_replacement_stage3_2025",
    date: "2025-11-21",
    bucket: "planning/development/municipal workshop infrastructure",
    title: "Workshop Plant Replacement moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 21 November 2025 recorded agreement that Workshop Plant Replacement be moved to Stage 3 - Committed with up to GBP 120,000 allocated.",
    observed_change:
      "A documented capital-programme milestone was recorded for replacing workshop plant in Belfast City Council facilities.",
    area: "Belfast City Council workshop facilities",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 21 November 2025",
    source_url: belfastNov2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-11-21-workshop-plant-replacement-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and workshop service team; equipment suppliers not named in the minutes",
    project_type: "municipal workshop plant replacement capital-programme milestone",
    geometry_source: "Council workshop-facility programme represented by an approximate Belfast City Hall point because the minutes do not name a depot address.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm procurement outcome, delivery dates, workshop location, installation, commissioning, or operational changes."
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
