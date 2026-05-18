const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastJun2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=83947";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_olympic_energy_centres_completion_2012",
    date: "2012-01-01",
    bucket: "planning/development/architecture/energy infrastructure",
    title: "Olympic Energy Centres were listed as built",
    summary:
      "New London Architecture records the Olympic Energy Centres in Newham as built, with completion in January 2012.",
    observed_change:
      "A documented Olympic Park energy-infrastructure project was recorded as reaching built status.",
    area: "Queen Elizabeth Olympic Park / Stratford",
    latitude: 51.541247,
    longitude: -0.011211,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Olympic Energy Centres",
    source_url: "https://nla.london/projects/olympic-energy-centres",
    source_record_id: "nla-olympic-energy-centres",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "John McAslan + Partners",
    project_type: "district energy infrastructure buildings",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; plant operation, energy output, network connections, and carbon performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_olympic_velodrome_completion_2011",
    date: "2011-02-01",
    bucket: "planning/development/architecture/sports venue",
    title: "London 2012 Olympic Velodrome was listed as built",
    summary:
      "New London Architecture records the London 2012 Olympic Velodrome in Newham as built, with completion in February 2011.",
    observed_change:
      "A documented Olympic Park sports venue was recorded as reaching built status.",
    area: "Queen Elizabeth Olympic Park / Stratford",
    latitude: 51.550498,
    longitude: -0.011746,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: London 2012 Olympic Velodrome",
    source_url: "https://nla.london/projects/london-2012-olympic-velodrome",
    source_record_id: "nla-london-2012-olympic-velodrome",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Hopkins Architects Limited",
    project_type: "sports venue",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; event programming, legacy conversion, public access, and venue-performance outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_london_2012_water_polo_arena_completion_2017",
    date: "2017-07-01",
    bucket: "planning/development/architecture/sports venue",
    title: "London 2012 Water Polo Arena was listed as built",
    summary:
      "New London Architecture records the London 2012 Water Polo Arena in Newham as a built sports-venue project, with estimated completion in July 2017.",
    observed_change:
      "A documented Olympic Park sports-venue project was recorded as reaching built status in the NLA project record.",
    area: "Queen Elizabeth Olympic Park / Stratford",
    latitude: 51.5467883,
    longitude: -0.0136198,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: London 2012 Water Polo Arena",
    source_url: "https://nla.london/projects/london-2012-water-polo-arena",
    source_record_id: "nla-london-2012-water-polo-arena",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "London 2012 Water Polo Arena project team; architect not named in the parsed NLA field",
    project_type: "sports venue project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record follows the NLA estimated completion field and does not confirm current building existence, temporary-venue status, dismantling, reuse, or post-games site condition."
  },
  {
    city_id: "london",
    event_id: "lon_arch_copper_box_completion_2011",
    date: "2011-08-01",
    bucket: "planning/development/architecture/sports venue",
    title: "The Copper Box was listed as built",
    summary:
      "New London Architecture records The Copper Box in Hackney as built, with estimated completion in August 2011.",
    observed_change:
      "A documented Olympic Park indoor sports venue was recorded as reaching built status.",
    area: "Queen Elizabeth Olympic Park / Hackney Wick",
    latitude: 51.544387,
    longitude: -0.019441,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Copper Box",
    source_url: "https://nla.london/projects/the-copper-box",
    source_record_id: "nla-the-copper-box",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Make",
    project_type: "indoor sports venue",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; public opening, event programming, operator arrangements, and legacy use require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_east_village_plots_n03_n04_completion_2011",
    date: "2011-01-01",
    bucket: "planning/development/architecture/residential",
    title: "East Village Plots N03 and N04 were listed as built",
    summary:
      "New London Architecture records East Village Plots N03 and N04 in Newham as built, with completion in 2011.",
    observed_change:
      "A documented Olympic Village residential plot project was recorded as reaching built status.",
    area: "East Village / Stratford",
    latitude: 51.548715,
    longitude: -0.010663,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: East Village Plots N03 & N04",
    source_url: "https://nla.london/projects/east-village-plots-n03-n04",
    source_record_id: "nla-east-village-plots-n03-n04",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Patel Taylor and BVN",
    project_type: "Olympic Village residential plots",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; occupation, tenure conversion, management, and later East Village changes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_438_concord_avenue_mih_text_adopted_2025",
    date: "2025-02-13",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "438 Concord Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 438 Concord Avenue, N 240105 ZRX, with an adopted date of February 13, 2025, for zoning text tied to the Concord Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 438 Concord Avenue area in the Bronx.",
    area: "438 Concord Avenue / Mott Haven",
    latitude: 40.810221383796,
    longitude: -73.909092714834,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 438 Concord Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/438-concord-avenue-n-240105-zrx",
    source_record_id: "nyc-zr-438-concord-avenue-n-240105-zrx",
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
    event_id: "nyc_arch_122_03_14th_ave_mih_text_adopted_2025",
    date: "2025-02-13",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "122-03 14th Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 122-03 14th Ave, N 240312 ZRQ, with an adopted date of February 13, 2025, for zoning text tied to the 14th Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 122-03 14th Avenue area in Queens.",
    area: "122-03 14th Avenue / College Point",
    latitude: 40.785454365544,
    longitude: -73.845664349064,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 122-03 14th Ave",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/122-03-14th-ave-n-240312-zrq",
    source_record_id: "nyc-zr-122-03-14th-ave-n-240312-zrq",
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
    event_id: "nyc_arch_brooklyn_yards_text_adopted_2024",
    date: "2024-11-21",
    bucket: "planning/development/zoning/mixed use development",
    title: "Brooklyn Yards zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records Brooklyn Yards, N 230183 ZRK, with an adopted date of November 21, 2024, for zoning text tied to the Brooklyn Yards project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the Brooklyn Yards project area.",
    area: "Brooklyn Yards project area / Brooklyn",
    latitude: 40.678,
    longitude: -73.987,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: Brooklyn Yards",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/brooklyn-yards-n-230183-zrk",
    source_record_id: "nyc-zr-brooklyn-yards-n-230183-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate Brooklyn project-area point because the zoning page title does not expose a street address in the parsed page metadata.",
    geometry_precision: "district",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, public-realm delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_962_972_franklin_avenue_mih_text_adopted_2024",
    date: "2024-11-21",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "962-972 Franklin Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 962-972 Franklin Avenue, N 230357(A) ZRK, with an adopted date of November 21, 2024, for zoning text tied to the Franklin Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 962-972 Franklin Avenue area in Brooklyn.",
    area: "962-972 Franklin Avenue / Crown Heights",
    latitude: 40.66482,
    longitude: -73.96016,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 962-972 Franklin Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/962-972-franklin-avenue-n-230357a-zrk",
    source_record_id: "nyc-zr-962-972-franklin-avenue-n-230357a-zrk",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related zoning text amendment",
    geometry_source: "Approximate midpoint of US Census geocoder points for 962 and 972 Franklin Avenue, not a mapped zoning boundary.",
    geometry_precision: "site approximate",
    limitations:
      "The event records zoning text adoption only. It does not confirm permits, construction, affordable-housing delivery, occupancy, or later site design."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_2390_mcdonald_avenue_mih_text_adopted_2024",
    date: "2024-09-26",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "2390 McDonald Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2390 McDonald Avenue, N210341 ZRK, with an adopted date of September 26, 2024, for zoning text tied to the McDonald Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2390 McDonald Avenue area in Brooklyn.",
    area: "2390 McDonald Avenue / Brooklyn",
    latitude: 40.594113744126,
    longitude: -73.973712265216,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2390 McDonald Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2390-mcdonald-avenue-n210341-zrk",
    source_record_id: "nyc-zr-2390-mcdonald-avenue-n210341-zrk",
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
    city_id: "belfast",
    event_id: "bfs_arch_clifton_st_cemetery_hs_works_stage3_committed_2025",
    date: "2025-06-20",
    bucket: "planning/development/historic cemetery",
    title: "Clifton Street Cemetery health and safety works moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 June 2025 recorded that Historic Cemeteries - Clifton St Cemetery immediate health and safety works moved to Stage 3 - Committed, with a satisfactory tender return and up to GBP 231,000 allocated.",
    observed_change:
      "A documented capital-programme milestone was recorded for immediate health and safety works at Clifton Street Cemetery.",
    area: "Clifton Street Cemetery",
    latitude: 54.6071,
    longitude: -5.9349,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme, 20 June 2025",
    source_url: belfastJun2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-06-20-clifton-st-cemetery-hs-works-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and historic cemeteries project team; contractor not named in the minutes",
    project_type: "historic cemetery health-and-safety works milestone",
    geometry_source: "Approximate point geocoded from Clifton Street Cemetery.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm contract award, works start, completion, conservation approvals, visitor access, or heritage outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_beacon_programme_stage3_committed_2025",
    date: "2025-06-20",
    bucket: "planning/development/community safety infrastructure",
    title: "Beacon Programme moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 June 2025 recorded agreement that the Beacon Programme move to Stage 3 - Committed with a maximum allocation of up to GBP 103,250.",
    observed_change:
      "A documented capital-programme milestone was recorded for the Beacon Programme, described in the minutes as a managed alternative to traditional bonfires.",
    area: "Belfast citywide",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme, 20 June 2025",
    source_url: belfastJun2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-06-20-beacon-programme-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Beacon Programme team; supplier not named in the minutes",
    project_type: "community safety capital-programme milestone",
    geometry_source: "Citywide programme represented by an approximate Belfast City Hall point because the minutes do not list installation sites.",
    geometry_precision: "citywide",
    limitations:
      "The event records Stage 3 programme status and allocation only. It does not confirm sites, procurement, installation, operation, community uptake, safety outcomes, or environmental outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_forth_meadow_greenway_dual_language_signage_design_team_2025",
    date: "2025-06-20",
    bucket: "planning/development/greenway signage",
    title: "Forth Meadow Greenway signage design-team appointment commenced",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 June 2025 recorded that design-team appointment for dual-language signage at Forth Meadow Community Greenway had commenced.",
    observed_change:
      "A documented signage-delivery milestone was recorded for Forth Meadow Community Greenway.",
    area: "Forth Meadow Community Greenway",
    latitude: 54.603,
    longitude: -5.992,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme, 20 June 2025",
    source_url: belfastJun2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-06-20-forth-meadow-greenway-dual-language-signage-design-team",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and signage progress update",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and signage project team; design team not named in the minutes",
    project_type: "greenway signage delivery milestone",
    geometry_source: "Approximate corridor point placed on Forth Meadow Community Greenway.",
    geometry_precision: "corridor",
    limitations:
      "The event records design-team appointment progress only. It does not confirm final sign locations, designs, procurement, installation, completion, maintenance, or user comprehension."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_olympia_leisure_centre_dual_language_signage_underway_2025",
    date: "2025-06-20",
    bucket: "planning/development/leisure centre signage",
    title: "Olympia Leisure Centre signage works were underway",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 June 2025 recorded that dual-language signage work at Olympia Leisure Centre was underway, with signs expected to be installed by the end of September 2025.",
    observed_change:
      "A documented signage works-progress milestone was recorded for Olympia Leisure Centre.",
    area: "Olympia Leisure Centre",
    latitude: 54.5839,
    longitude: -5.9551,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme, 20 June 2025",
    source_url: belfastJun2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-06-20-olympia-leisure-centre-dual-language-signage-underway",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and signage progress update",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Olympia Leisure Centre signage project team; supplier not named in the minutes",
    project_type: "leisure centre signage works milestone",
    geometry_source: "Approximate point geocoded from Olympia Leisure Centre.",
    geometry_precision: "site",
    limitations:
      "The event records works-progress status only. It does not confirm final sign locations, installation completion, maintenance, user comprehension, or later signage changes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_strangford_playing_fields_enabling_works_stage2_uncommitted_2025",
    date: "2025-06-20",
    bucket: "planning/development/sports community facility",
    title: "Strangford Playing Fields enabling works moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 20 June 2025 recorded agreement that Strangford Avenue Playing Fields Enabling Works move to Stage 2 - Uncommitted to allow options to be worked up.",
    observed_change:
      "A documented capital-programme milestone was recorded for enabling works at Strangford Playing Fields.",
    area: "Strangford Playing Fields",
    latitude: 54.5715,
    longitude: -5.8855,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme, 20 June 2025",
    source_url: belfastJun2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-06-20-strangford-playing-fields-enabling-works-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and playing-fields project team; design team not named in the minutes",
    project_type: "sports-field enabling works options milestone",
    geometry_source: "Approximate point geocoded from Strangford Playing Fields.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 2 programme status only. It does not confirm options selection, funding, contractor appointment, works start, completion, facility opening, or operating arrangements."
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
