const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastAug2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=84408";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_diamond_bridges_olympic_park_completion_2010",
    date: "2010-12-01",
    bucket: "planning/development/architecture/bridge public realm",
    title: "Diamond Bridges at Queen Elizabeth Olympic Park were listed as built",
    summary:
      "New London Architecture records Diamond Bridges at the London Queen Elizabeth Olympic Park in Hackney as built, with estimated completion in December 2010.",
    observed_change:
      "A documented Olympic Park bridge and public-realm project was recorded as reaching built status.",
    area: "Queen Elizabeth Olympic Park / Hackney Wick",
    latitude: 51.541839,
    longitude: -0.016433,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Diamond Bridges at the London Queen Elizabeth Olympic Park",
    source_url: "https://nla.london/projects/diamond-bridges-at-the-london-queen-elizabeth-olympic-park",
    source_record_id: "nla-diamond-bridges-at-the-london-queen-elizabeth-olympic-park",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "heneghan peng architects",
    project_type: "bridge and park public-realm project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; bridge adoption, maintenance, accessibility performance, and later park changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_athletes_village_plot_n14_completion_2011",
    date: "2011-12-01",
    bucket: "planning/development/architecture/residential",
    title: "Athletes' Village Plot N14 was listed as built",
    summary:
      "New London Architecture records Athletes' Village Plot N14 in Newham as built, with estimated completion in December 2011.",
    observed_change:
      "A documented Olympic Village residential plot was recorded as reaching built status.",
    area: "East Village / Stratford",
    latitude: 51.548007,
    longitude: -0.006851,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Athletes' Village Plot N14",
    source_url: "https://nla.london/projects/athletes-village-plot-n14",
    source_record_id: "nla-athletes-village-plot-n14",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lifschutz Davidson Sandilands and Haworth Tompkins",
    project_type: "Olympic Village residential plot",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; occupation, tenure conversion, management, and later East Village changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_three_mills_lock_completion_2009",
    date: "2009-06-01",
    bucket: "planning/development/architecture/waterway infrastructure",
    title: "Three Mills Lock was listed as built",
    summary:
      "New London Architecture records Three Mills Lock in Newham as built, with estimated completion in June 2009.",
    observed_change:
      "A documented waterways infrastructure project was recorded as reaching built status.",
    area: "Three Mills / Bow Back Rivers",
    latitude: 51.52805,
    longitude: -0.004163,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Three Mills Lock",
    source_url: "https://nla.london/projects/three-mills-lock",
    source_record_id: "nla-three-mills-lock",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Farrells",
    project_type: "waterway lock infrastructure",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; navigational operation, flood management, maintenance, and waterway-use changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_duke_of_york_square_completion_2008",
    date: "2008-04-01",
    bucket: "planning/development/architecture/public realm retail",
    title: "Duke of York Square was listed as built",
    summary:
      "New London Architecture records Duke of York Square in Kensington and Chelsea as built, with completion in April 2008.",
    observed_change:
      "A documented public-realm and retail development was recorded as reaching built status.",
    area: "Duke of York Square / Chelsea",
    latitude: 51.508098,
    longitude: -0.136094,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Duke of York Square",
    source_url: "https://nla.london/projects/duke-of-york-square",
    source_record_id: "nla-duke-of-york-square",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Studio PDP and nex",
    project_type: "public square and retail-led development",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; retail tenancy, public-access management, footfall, and public-realm outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_bankside_123_canvey_street_completion_2009",
    date: "2009-01-01",
    bucket: "planning/development/architecture/mixed use public realm",
    title: "Bankside 123 and Canvey Street were listed as built",
    summary:
      "New London Architecture records Bankside 123 and Canvey Street in Southwark as built, with completion in 2009.",
    observed_change:
      "A documented Bankside mixed-use and public-realm project was recorded as reaching built status.",
    area: "Bankside / Southwark",
    latitude: 51.505624,
    longitude: -0.098969,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Bankside 123 & Canvey Street",
    source_url: "https://nla.london/projects/bankside-123-canvey-street",
    source_record_id: "nla-bankside-123-canvey-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allies and Morrison",
    project_type: "mixed-use development and street-space works",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; phasing, tenancy, public-realm adoption, and later site-management changes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_south_jamaica_gateway_text_adopted_2024",
    date: "2024-10-10",
    bucket: "planning/development/zoning/neighborhood gateway",
    title: "South Jamaica Gateway zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records South Jamaica Gateway, N 240329 ZRQ, with an adopted date of October 10, 2024, for zoning text tied to the South Jamaica Gateway project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the South Jamaica Gateway area in Queens.",
    area: "South Jamaica Gateway / Queens",
    latitude: 40.685,
    longitude: -73.793,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: South Jamaica Gateway",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/south-jamaica-gateway-n-240329-zrq",
    source_record_id: "nyc-zr-south-jamaica-gateway-n-240329-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "area-related zoning text amendment",
    geometry_source: "Approximate district point placed in South Jamaica rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, public-realm delivery, occupancy, or later site designs."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_31_17_12th_street_mih_text_adopted_2024",
    date: "2024-10-10",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "31-17 12th Street zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 31-17 12th St, N 230023 ZRQ, with an adopted date of October 10, 2024, for zoning text tied to the 12th Street project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 31-17 12th Street area in Queens.",
    area: "31-17 12th Street / Astoria",
    latitude: 40.7683101874,
    longitude: -73.93377315268,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 31-17 12th St",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/31-17-12th-st-n-230023-zrq",
    source_record_id: "nyc-zr-31-17-12th-st-n-230023-zrq",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from US Census geocoder for the zoning-page address, not a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_msk_pavilion_text_adopted_2024",
    date: "2024-09-26",
    bucket: "planning/development/zoning/institutional campus",
    title: "MSK Pavilion zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records MSK Pavilion, N 240238 ZRM, with an adopted date of September 26, 2024, for zoning text tied to the Memorial Sloan Kettering pavilion project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the MSK Pavilion project area in Manhattan.",
    area: "MSK campus / Upper East Side",
    latitude: 40.763146207697,
    longitude: -73.956539141289,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: MSK Pavilion",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/msk-pavilion-n-240238-zrm",
    source_record_id: "nyc-zr-msk-pavilion-n-240238-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "institutional campus zoning text amendment",
    geometry_source: "Approximate point placed at Memorial Sloan Kettering's York Avenue campus context rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, hospital construction, service changes, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_sparc_kips_bay_mih_text_adopted_2025",
    date: "2025-02-13",
    bucket: "planning/development/zoning/institutional campus",
    title: "SPARC Kips Bay zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records SPARC Kips Bay, N 240371 ZRM, with an adopted date of February 13, 2025, for zoning text tied to the Kips Bay life-sciences and education campus area.",
    observed_change:
      "A documented zoning text milestone was recorded for the SPARC Kips Bay area in Manhattan.",
    area: "Kips Bay / Manhattan",
    latitude: 40.739216938738,
    longitude: -73.976928385437,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: SPARC Kips Bay",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/sparc-kips-bay-n-240371-zrm",
    source_record_id: "nyc-zr-sparc-kips-bay-n-240371-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "institutional campus zoning text amendment",
    geometry_source: "Approximate point placed at the Kips Bay/First Avenue campus context rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, campus delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_455_first_avenue_mih_text_adopted_2025",
    date: "2025-02-13",
    bucket: "planning/development/zoning/institutional campus",
    title: "455 First Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 455 First Avenue, N 240344 ZRM, with an adopted date of February 13, 2025, for zoning text tied to the First Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 455 First Avenue area in Manhattan.",
    area: "455 First Avenue / Kips Bay",
    latitude: 40.739216938738,
    longitude: -73.976928385437,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 455 First Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/455-first-avenue-n-240344-zrm",
    source_record_id: "nyc-zr-455-first-avenue-n-240344-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate point from US Census geocoder for the zoning-page address, not a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, campus delivery, occupancy, public-realm delivery, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_asset_management_iwms_stage3_committed_2025",
    date: "2025-08-22",
    bucket: "planning/development/civic asset management",
    title: "Asset Management Integrated Work Management System moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that the Asset Management System - Integrated Work Management System move to Stage 3 - Committed and be held at Tier 0 - Scheme at Risk pending further development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for Belfast City Council's asset-management system used to support estate planning and asset management.",
    area: "Belfast City Council estate",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-asset-management-iwms-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and IT/asset-management teams; supplier not named in the minutes",
    project_type: "estate asset-management system milestone",
    geometry_source: "Citywide council-estate record represented by an approximate Belfast City Hall point because the minutes do not identify individual asset sites.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm procurement outcome, implementation, data migration, system coverage, asset-condition changes, or estate-management outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_basketball_courts_stage2_uncommitted_2025",
    date: "2025-08-22",
    bucket: "planning/development/sports public realm",
    title: "Basketball Courts moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Basketball Courts move to Stage 2 - Uncommitted to allow options for five Belfast City Council park sites to be worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for planned basketball-court creation and upgrades across Belfast parks.",
    area: "Belfast parks and open spaces",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-basketball-courts-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks/open-spaces project team; design team not named in the minutes",
    project_type: "multi-site sports court options milestone",
    geometry_source: "Multi-site parks programme represented by an approximate Belfast City Hall point because the minutes list several park sites but no mapped works polygons.",
    geometry_precision: "multiple sites",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final court designs, funding approval, procurement, works start, completion, use levels, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_musgrave_park_sensory_garden_stage2_uncommitted_2025",
    date: "2025-08-22",
    bucket: "planning/development/park landscape",
    title: "Musgrave Park Sensory Garden moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Musgrave Park Sensory Garden move to Stage 2 - Uncommitted to allow options for refurbishment to be worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for Musgrave Park Sensory Garden refurbishment options.",
    area: "Musgrave Park",
    latitude: 54.5558,
    longitude: -5.9778,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-musgrave-park-sensory-garden-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks project team; design team not named in the minutes",
    project_type: "park sensory-garden options milestone",
    geometry_source: "Approximate point geocoded from Musgrave Park.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final design, funding, procurement, works start, completion, accessibility performance, or maintenance arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_under_the_bridges_stage2_uncommitted_2025",
    date: "2025-08-22",
    bucket: "planning/development/public realm active travel",
    title: "Under the Bridges moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Under the Bridges move to Stage 2 - Uncommitted to allow options for connectivity, active travel, and public-realm enhancements under the M3 bridges to be worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for proposed public-realm and active-travel enhancements under the M3 bridges.",
    area: "M3 bridges / Belfast city centre",
    latitude: 54.603,
    longitude: -5.916,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-under-the-bridges-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Belfast Harbour Commissioners, Department for Infrastructure, Department for Communities, and project consultants",
    project_type: "public realm and active-travel options milestone",
    geometry_source: "Approximate corridor point placed near the M3 bridges because the minutes do not provide a mapped project boundary.",
    geometry_precision: "corridor",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm design option selection, approvals, funding, procurement, construction, completion, or route/public-realm outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_greening_growing_project_stage1_emerging_2025",
    date: "2025-08-22",
    bucket: "planning/development/urban greening",
    title: "Greening and Growing Project was added at Stage 1",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that the Greening and Growing Project be added to the Capital Programme at Stage 1 - Emerging to allow a business case to be developed.",
    observed_change:
      "A documented capital-programme milestone was recorded for the Greening and Growing Project entering the emerging stage.",
    area: "GROW community garden / Waterworks",
    latitude: 54.6154,
    longitude: -5.9399,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-greening-growing-project-stage-1",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes, Belfast Healthy Cities, and greening project partners; design team not named in the minutes",
    project_type: "urban greening capital-programme entry milestone",
    geometry_source: "Approximate point placed at the Waterworks/GROW garden area referenced in later committee reporting.",
    geometry_precision: "site approximate",
    limitations:
      "The event records Stage 1 programme entry only. It does not confirm final sites, planting designs, business-case approval, delivery funding, procurement, implementation, maintenance, or ecological outcomes."
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
