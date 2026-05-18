const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastOct2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_glassworks_ealing_completion_2024",
    date: "2024-11-01",
    bucket: "planning/development/architecture/housing led development",
    title: "Glassworks Ealing was listed as built",
    summary:
      "New London Architecture records Glassworks in Ealing as a built residential-led project, with completion in November 2024.",
    observed_change:
      "A documented Ealing residential-led development was recorded as reaching built status.",
    area: "Ealing Broadway / Ealing",
    latitude: 51.5144,
    longitude: -0.3016,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Glassworks",
    source_url: "https://nla.london/projects/glassworks",
    source_record_id: "nla-glassworks",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire and Partners",
    project_type: "residential-led development",
    geometry_source: "Approximate point geocoded from the NLA-stated Ealing site context.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; tenure mix, occupation, public-realm delivery, and long-term management require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_wme8_hackney_completion_2020",
    date: "2020-12-01",
    bucket: "planning/development/architecture/housing",
    title: "WME8 Hackney was listed as built",
    summary:
      "New London Architecture records WME8 in Hackney as a built housing project, with estimated completion in December 2020.",
    observed_change:
      "A documented Hackney housing project was recorded as reaching built status.",
    area: "Westgate Street / London Fields",
    latitude: 51.5361,
    longitude: -0.0618,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: WME8",
    source_url: "https://nla.london/projects/wme8",
    source_record_id: "nla-wme8",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Squire and Partners",
    project_type: "residential development",
    geometry_source: "Approximate point geocoded from the NLA-stated Westgate Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupancy, affordability mix, sales, and resident outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_broadwalk_house_completion_2020",
    date: "2020-06-01",
    bucket: "planning/development/architecture/office retrofit",
    title: "Broadwalk House was listed as built",
    summary:
      "New London Architecture records Broadwalk House in the City of London as a built office retrofit and extension, with completion in June 2020.",
    observed_change:
      "A documented City of London office retrofit was recorded as reaching built status.",
    area: "Appold Street / City of London",
    latitude: 51.5202,
    longitude: -0.084,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Broadwalk House",
    source_url: "https://nla.london/projects/broadwalk-house",
    source_record_id: "nla-broadwalk-house",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Piercy&Company",
    project_type: "office retrofit and extension",
    geometry_source: "Approximate point geocoded from Broadwalk House / Appold Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; leasing, embodied-carbon calculations, tenant fit-out, and operational performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_gate_islington_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/mixed use retrofit",
    title: "The Gate Islington was listed as built",
    summary:
      "New London Architecture records The Gate in Islington as a built mixed-use project, with completion in 2020.",
    observed_change:
      "A documented Islington mixed-use building project was recorded as reaching built status.",
    area: "Islington High Street / Angel",
    latitude: 51.5331,
    longitude: -0.1065,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Gate",
    source_url: "https://nla.london/projects/the-gate",
    source_record_id: "nla-the-gate",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Morrow + Lorraine",
    project_type: "mixed-use retrofit and redevelopment",
    geometry_source: "Approximate point geocoded from The Gate / Islington High Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; retail occupancy, public access, tenant mix, and building performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kiln_place_estate_completion_2020",
    date: "2020-01-01",
    bucket: "planning/development/architecture/estate infill housing",
    title: "Kiln Place estate infill homes were listed as built",
    summary:
      "New London Architecture records Kiln Place in Camden as a built estate infill and regeneration project, with completion in 2020.",
    observed_change:
      "A documented Camden estate infill housing project was recorded as reaching built status.",
    area: "Kiln Place Estate / Gospel Oak",
    latitude: 51.555,
    longitude: -0.151,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kiln Place",
    source_url: "https://nla.london/projects/kiln-place",
    source_record_id: "nla-kiln-place",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Peter Barber Architects",
    project_type: "estate infill housing and public-realm works",
    geometry_source: "Approximate point geocoded from Kiln Place Estate / Gospel Oak location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; resident rehousing, affordability terms, maintenance, and estate-management outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_one45_harlem_mih_text_adopted_2025",
    date: "2025-07-14",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "One45 Harlem zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records One45 Harlem, N 250116 ZRM, with an adopted date of July 14, 2025, for zoning text tied to the Harlem project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the One45 Harlem area in Manhattan.",
    area: "West 145th Street / Harlem",
    latitude: 40.8218,
    longitude: -73.9416,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: One45 Harlem",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/one45-harlem-n-250116-zrm",
    source_record_id: "nyc-zr-one45-harlem-n-250116-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point geocoded from the One45 Harlem project area rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, financing, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_carmen_villegas_senior_housing_mih_text_adopted_2025",
    date: "2025-07-14",
    bucket: "planning/development/zoning/senior housing",
    title: "Carmen Villegas Apartments Senior Housing zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Carmen Villegas Apartments Senior Housing, N 250147 ZRM, with an adopted date of July 14, 2025, for zoning text tied to the senior-housing project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the Carmen Villegas Apartments Senior Housing area in Manhattan.",
    area: "East Harlem / Manhattan",
    latitude: 40.7947,
    longitude: -73.9389,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Carmen Villegas Apartments Senior Housing",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/carmen-villegas-apartments-senior-housing-n-250147-zrm",
    source_record_id: "nyc-zr-carmen-villegas-apartments-senior-housing-n-250147-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related senior-housing zoning text amendment",
    geometry_source: "Approximate point placed in East Harlem from the project title rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, senior-housing delivery, occupancy, financing, services, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_grace_houses_mih_text_adopted_2025",
    date: "2025-06-30",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "Grace Houses zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Grace Houses, N 240185 ZRK, with an adopted date of June 30, 2025, for zoning text tied to the Grace Houses project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the Grace Houses area in Brooklyn.",
    area: "Grace Houses / Brooklyn",
    latitude: 40.6839,
    longitude: -73.9795,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Grace Houses",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/grace-houses-n-240185-zrk",
    source_record_id: "nyc-zr-grace-houses-n-240185-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point placed in the Grace Houses area rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, NYCHA campus changes, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_western_rail_yards_modifications_text_adopted_2025",
    date: "2025-06-11",
    bucket: "planning/development/zoning/rail yard redevelopment",
    title: "Western Rail Yards Modifications zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Western Rail Yards Modifications, N 250098 ZRM, with an adopted date of June 11, 2025, for zoning text tied to the Hudson Yards rail-yard redevelopment area.",
    observed_change:
      "A documented zoning text milestone was recorded for the Western Rail Yards area in Manhattan.",
    area: "Western Rail Yards / Hudson Yards",
    latitude: 40.7579,
    longitude: -74.0023,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Western Rail Yards Modifications",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/western-rail-yards-modifications-n-250098-zrm",
    source_record_id: "nyc-zr-western-rail-yards-modifications-n-250098-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "rail-yard redevelopment zoning text amendment",
    geometry_source: "Approximate point placed at the Western Rail Yards rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm design changes, permits, platform work, construction, completion, occupancy, or public-space delivery."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_73_99_empire_boulevard_mih_text_adopted_2025",
    date: "2025-06-11",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "73-99 Empire Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 73-99 Empire Boulevard, N 230310 ZRK, with an adopted date of June 11, 2025, for zoning text tied to the Empire Boulevard project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 73-99 Empire Boulevard area in Brooklyn.",
    area: "73-99 Empire Boulevard / Crown Heights",
    latitude: 40.6633,
    longitude: -73.9603,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 73-99 Empire Boulevard",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/73-99-empire-boulevard-n-230310-zrk",
    source_record_id: "nyc-zr-73-99-empire-boulevard-n-230310-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_basketball_courts_stage3_committed_2025",
    date: "2025-10-24",
    bucket: "planning/development/sports public realm",
    title: "Basketball Courts moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Basketball Courts move to Stage 3 - Committed with up to GBP 550,000 allocated for creation or upgrades at Victoria Park, Alderman Tommy Patton Memorial Park, Ormeau Park, Blacks Road Park, and Pairc Nua Chollann.",
    observed_change:
      "A documented capital-programme milestone was recorded for five-site basketball-court works in Belfast parks and open spaces.",
    area: "Belfast parks and open spaces",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-basketball-courts-stage-3-gbp-550000",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/open-spaces project team; design team not named in the minutes",
    project_type: "multi-site sports court capital-programme milestone",
    geometry_source: "Multi-site parks programme represented by an approximate Belfast City Hall point because the minutes list several sites without mapped works polygons.",
    geometry_precision: "multiple sites",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm final court designs, procurement outcome, works start, completion, use levels, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_musgrave_park_sensory_garden_stage3_committed_2025",
    date: "2025-10-24",
    bucket: "planning/development/park landscape",
    title: "Musgrave Park Sensory Garden moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Musgrave Park Sensory Garden move to Stage 3 - Committed with up to GBP 100,000 allocated to provide a greater range of equipment and improve play value and accessibility.",
    observed_change:
      "A documented capital-programme milestone was recorded for a sensory-garden project in Musgrave Park.",
    area: "Musgrave Park",
    latitude: 54.5558,
    longitude: -5.9778,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-musgrave-park-sensory-garden-stage-3-gbp-100000",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks project team; design team not named in the minutes",
    project_type: "park sensory-garden capital-programme milestone",
    geometry_source: "Approximate point geocoded from Musgrave Park.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm final garden design, procurement outcome, works start, completion, accessibility performance, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_girdwood_hub_hs_works_stage3_committed_2025",
    date: "2025-10-24",
    bucket: "planning/development/community facility",
    title: "Girdwood Hub health and safety works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that Girdwood Hub Health and Safety Works move to Stage 3 - Committed with up to GBP 310,000 allocated.",
    observed_change:
      "A documented capital-programme milestone was recorded for health and safety works at Girdwood Hub.",
    area: "Girdwood Community Hub",
    latitude: 54.6105,
    longitude: -5.9433,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-girdwood-hub-hs-works-stage-3-gbp-310000",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Girdwood Hub facilities team; design team not named in the minutes",
    project_type: "community facility health-and-safety works milestone",
    geometry_source: "Approximate point geocoded from Girdwood Community Hub.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm works package details, procurement outcome, works start, completion, operating changes, or public access changes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_ev_charging_network_phase1_stage3_committed_2025",
    date: "2025-10-24",
    bucket: "planning/development/ev charging infrastructure",
    title: "EV Charging Network Phase 1 moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that EV Charging Network Phase 1 move to Stage 3 - Committed and Tier 0 - Scheme at Risk pending a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for Phase 1 of Belfast City Council's EV charging network.",
    area: "Belfast City Council EV charging network",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-ev-charging-network-phase-1-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and fleet/estate teams; charging supplier not named in the minutes",
    project_type: "EV charging infrastructure capital-programme milestone",
    geometry_source: "Network programme represented by an approximate Belfast City Hall point because the minutes do not provide charger-site coordinates.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm charger locations, tender result, installation start, energisation, public availability, pricing, or usage."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_2_royal_avenue_landlord_works_stage1_2025",
    date: "2025-10-24",
    bucket: "planning/development/civic building",
    title: "2 Royal Avenue landlord capital works moved to Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded agreement that 2 Royal Avenue Landlord Capital Works move to Stage 1 - Emerging.",
    observed_change:
      "A documented capital-programme milestone was recorded for landlord capital works at 2 Royal Avenue.",
    area: "2 Royal Avenue",
    latitude: 54.5991,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-2-royal-avenue-landlord-works-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and 2 Royal Avenue building team; design team not named in the minutes",
    project_type: "civic building landlord-works capital-programme entry milestone",
    geometry_source: "Approximate point geocoded from 2 Royal Avenue.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm works scope, design, approvals, procurement, works start, completion, tenant impacts, or public access changes."
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
