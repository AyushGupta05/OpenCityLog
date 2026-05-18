const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastAug2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=84408";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_chobham_academy_completion_2013",
    date: "2013-08-01",
    bucket: "planning/development/architecture/school campus",
    title: "Chobham Academy was listed as built",
    summary:
      "New London Architecture records Chobham Academy in Newham as a built education project, with estimated completion in August 2013.",
    observed_change:
      "A documented Newham academy building project was recorded as reaching built status.",
    area: "Chobham Academy / Stratford",
    latitude: 51.548473,
    longitude: -0.006858,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Chobham Academy",
    source_url: "https://nla.london/projects/chobham-academy",
    source_record_id: "nla-chobham-academy",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Allford Hall Monaghan Morris",
    project_type: "academy school campus",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; school opening, pupil numbers, catchment, and education outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_hale_village_completion_2016",
    date: "2016-01-01",
    bucket: "planning/development/architecture/mixed use regeneration",
    title: "Hale Village was listed as built",
    summary:
      "New London Architecture records Hale Village in Haringey as a built mixed-use regeneration project, with completion in 2016.",
    observed_change:
      "A documented Haringey mixed-use regeneration project was recorded as reaching built status.",
    area: "Hale Village / Tottenham Hale",
    latitude: 51.588527,
    longitude: -0.058805,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Hale Village",
    source_url: "https://nla.london/projects/hale-village",
    source_record_id: "nla-hale-village",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hale Village project team; architect not named in the NLA field parsed for this record",
    project_type: "mixed-use regeneration development",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; phasing, occupancy, affordable-housing terms, commercial tenancy, and estate-management outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_ely_court_completion_2015",
    date: "2015-01-01",
    bucket: "planning/development/architecture/estate infill housing",
    title: "Ely Court was listed as built",
    summary:
      "New London Architecture records Ely Court in Brent as a built housing project, with completion in 2015.",
    observed_change:
      "A documented Brent housing project was recorded as reaching built status.",
    area: "South Kilburn / Brent",
    latitude: 51.5344478,
    longitude: -0.1941949,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Ely Court",
    source_url: "https://nla.london/projects/ely-court",
    source_record_id: "nla-ely-court",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Ely Court project team; architect not named in the NLA field parsed for this record",
    project_type: "housing and estate regeneration project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; tenancy mix, rehousing, public-realm adoption, and resident outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_yardhouse_completion_2014",
    date: "2014-01-01",
    bucket: "planning/development/architecture/workspace",
    title: "Yardhouse was listed as built",
    summary:
      "New London Architecture records Yardhouse in Hackney as a built workspace project, with completion in 2014.",
    observed_change:
      "A documented Hackney workspace architecture project was recorded as reaching built status.",
    area: "Hackney Wick",
    latitude: 51.5313156,
    longitude: -0.0095091,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Yardhouse",
    source_url: "https://nla.london/projects/yardhouse",
    source_record_id: "nla-yardhouse",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Assemble Project",
    project_type: "workspace and maker-space project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; tenancy, operational model, affordability of workspace, and later site changes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_podium_stratford_completion_2014",
    date: "2014-04-01",
    bucket: "planning/development/architecture/public realm building",
    title: "The Podium Stratford was listed as built",
    summary:
      "New London Architecture records The Podium in Newham as a built project, with completion in April 2014.",
    observed_change:
      "A documented Stratford built-environment project was recorded as reaching built status.",
    area: "Queen Elizabeth Olympic Park / Stratford",
    latitude: 51.538321,
    longitude: -0.012951,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Podium",
    source_url: "https://nla.london/projects/the-podium",
    source_record_id: "nla-the-podium",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Make",
    project_type: "public-realm building and park facility",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; public access, operator arrangements, park-use patterns, and maintenance require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_brownsville_ncp_text_adopted_2025",
    date: "2025-04-24",
    bucket: "planning/development/zoning/neighborhood plan",
    title: "Brownsville NCP zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Brownsville NCP, N 250038 ZRK, with an adopted date of April 24, 2025, for zoning text tied to the Brownsville neighborhood plan area.",
    observed_change:
      "A documented zoning text milestone was recorded for the Brownsville neighborhood plan area in Brooklyn.",
    area: "Brownsville / Brooklyn",
    latitude: 40.665,
    longitude: -73.91,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Brownsville NCP",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/brownsville-ncp-n-250038-zrk",
    source_record_id: "nyc-zr-brownsville-ncp-n-250038-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicants; architect not identified in the zoning page",
    project_type: "neighborhood-plan zoning text amendment",
    geometry_source: "Approximate district point placed in Brownsville rather than a mapped zoning boundary.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, public-realm delivery, occupancy, or later site designs."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_581_grant_avenue_mih_text_adopted_2025",
    date: "2025-03-26",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "581 Grant Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 581 Grant Ave, N 240404 ZRK, with an adopted date of March 26, 2025, for zoning text tied to the Grant Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 581 Grant Avenue area in Brooklyn.",
    area: "581 Grant Avenue / Brooklyn",
    latitude: 40.676723484343,
    longitude: -73.865481888221,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 581 Grant Ave",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/581-grant-ave-n-240404-zrk",
    source_record_id: "nyc-zr-581-grant-ave-n-240404-zrk",
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
    event_id: "nyc_arch_123_12_sutphin_boulevard_mih_text_adopted_2025",
    date: "2025-03-26",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "123-12 Sutphin Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 123-12 Sutphin Blvd, N 240187 ZRQ, with an adopted date of March 26, 2025, for zoning text tied to the Sutphin Boulevard project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 123-12 Sutphin Boulevard area in Queens.",
    area: "123-12 Sutphin Boulevard / Jamaica",
    latitude: 40.675876431062,
    longitude: -73.790338602417,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 123-12 Sutphin Blvd",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/123-12-sutphin-blvd-n-240187-zrq",
    source_record_id: "nyc-zr-123-12-sutphin-blvd-n-240187-zrq",
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
    event_id: "nyc_arch_beacon_text_adopted_2025",
    date: "2025-03-12",
    bucket: "planning/development/zoning/mixed use development",
    title: "The Beacon zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records The Beacon, N 240388 ZRM, with an adopted date of March 12, 2025, for zoning text tied to the Beacon project area.",
    observed_change:
      "A documented zoning text milestone was recorded for The Beacon project area in Manhattan.",
    area: "The Beacon project area / Manhattan",
    latitude: 40.759,
    longitude: -73.9845,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: The Beacon",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/beacon-n-240388-zrm",
    source_record_id: "nyc-zr-beacon-n-240388-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate Manhattan project-area point because the zoning page title does not expose a street address in the parsed page metadata.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_441_467_prospect_avenue_arrow_linen_text_adopted_2025",
    date: "2025-02-27",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "441 and 467 Prospect Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 441 and 467 Prospect Ave, also known as Arrow Linen, N 240281 ZRK, with an adopted date of February 27, 2025, for zoning text tied to the Prospect Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 441 and 467 Prospect Avenue area in Brooklyn.",
    area: "441 and 467 Prospect Avenue / Brooklyn",
    latitude: 40.6597,
    longitude: -73.983,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 441 and 467 Prospect Ave (a.k.a. Arrow Linen)",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/441-and-467-prospect-ave-aka-arrow-linen-n-240281-zrk",
    source_record_id: "nyc-zr-441-and-467-prospect-ave-aka-arrow-linen-n-240281-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate midpoint between US Census geocoder points for 441 and 467 Prospect Avenue, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_stories_stage3_committed_2025",
    date: "2025-08-22",
    bucket: "planning/development/cultural venue",
    title: "Belfast Stories moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Belfast Stories move to Stage 3 - Committed and Tier 0 - Scheme at Risk, pending further project development and a funding-position update.",
    observed_change:
      "A documented capital-programme milestone was recorded for the Belfast Stories cultural venue project.",
    area: "Belfast Stories / city centre",
    latitude: 54.5996,
    longitude: -5.9281,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-belfast-stories-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Belfast Region City Deal, and Belfast Stories project team; design team not named in the minutes",
    project_type: "cultural venue capital-programme milestone",
    geometry_source: "Approximate point in Belfast city centre because the committee item records the programme milestone rather than a mapped site boundary.",
    geometry_precision: "district",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm full funding, final design, procurement, construction start, completion, opening, visitor numbers, or wider regeneration outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_communication_boards_playgrounds_stage3_committed_2025",
    date: "2025-08-22",
    bucket: "planning/development/playground accessibility",
    title: "Communication Boards in Playgrounds moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Communication Boards in Playgrounds move to Stage 3 - Committed with a maximum allocation of up to GBP 170,000.",
    observed_change:
      "A documented capital-programme milestone was recorded for inclusive communication boards in Belfast playgrounds.",
    area: "Belfast playground estate",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-communication-boards-playgrounds-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and playground project team; supplier not named in the minutes",
    project_type: "playground accessibility capital-programme milestone",
    geometry_source: "Citywide playground-estate record represented by an approximate Belfast City Hall point because the minutes do not list individual playground coordinates.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm individual playground sites, procurement outcome, installation dates, completion, user uptake, or accessibility outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_strangford_playing_fields_enabling_works_stage3_committed_2025",
    date: "2025-08-22",
    bucket: "planning/development/sports community facility",
    title: "Strangford Playing Fields enabling works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Strangford Playing Fields Enabling Works move to Stage 3 - Committed with a maximum allocation of up to GBP 60,000 to allow contractor appointment and enabling works to commence.",
    observed_change:
      "A documented capital-programme milestone was recorded for enabling works at Strangford Playing Fields.",
    area: "Strangford Playing Fields",
    latitude: 54.5715,
    longitude: -5.8855,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-strangford-playing-fields-enabling-works-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and playing-fields project team; contractor not named in the minutes",
    project_type: "sports-field enabling works capital-programme milestone",
    geometry_source: "Approximate point geocoded from Strangford Playing Fields.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm contractor appointment, works start, container delivery, completion, facility opening, or operating arrangements."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_city_hall_external_christmas_tree_stage3_committed_2025",
    date: "2025-08-22",
    bucket: "planning/development/civic public realm",
    title: "City Hall External Christmas Tree moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that City Hall External Christmas Tree move to Stage 3 - Committed and Tier 0 - Scheme at Risk, pending further project development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for a civic public-realm installation at Belfast City Hall.",
    area: "Belfast City Hall",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-city-hall-external-christmas-tree-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and civic-events project team; supplier not named in the minutes",
    project_type: "civic public-realm installation capital-programme milestone",
    geometry_source: "Approximate point geocoded from Belfast City Hall.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm tender result, procurement, installation, completion, seasonal operation, visitor numbers, or public-realm outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_woodvale_park_sensory_garden_stage2_uncommitted_2025",
    date: "2025-08-22",
    bucket: "planning/development/park landscape",
    title: "Woodvale Park Sensory Garden moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 22 August 2025 recorded agreement that Woodvale Park Sensory Garden move to Stage 2 - Uncommitted to allow options to be worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for a proposed sensory garden at Woodvale Park.",
    area: "Woodvale Park",
    latitude: 54.6092,
    longitude: -5.9692,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 22 August 2025",
    source_url: belfastAug2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-08-22-woodvale-park-sensory-garden-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and parks project team; design team not named in the minutes",
    project_type: "park sensory-garden options milestone",
    geometry_source: "Approximate point geocoded from Woodvale Park.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm final design, funding, planning consent, procurement, construction, completion, accessibility performance, or maintenance."
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
