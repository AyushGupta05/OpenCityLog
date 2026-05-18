const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastOct2025PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_house_of_the_elements_completion_2023",
    date: "2023-07-01",
    bucket: "planning/development/architecture/residential retrofit",
    title: "House of the Elements was listed as built",
    summary:
      "New London Architecture records House of the Elements in Southwark as a built residential project, with estimated completion in July 2023.",
    observed_change:
      "A documented Southwark residential architecture project was recorded as reaching built status.",
    area: "Southwark",
    latitude: 51.5034,
    longitude: -0.091,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: House of the Elements",
    source_url: "https://nla.london/projects/house-of-the-elements",
    source_record_id: "nla-house-of-the-elements",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Neil Dusheiko Architects",
    project_type: "residential architecture project",
    geometry_source: "Approximate borough point because the NLA page identifies Southwark but does not expose a street-level coordinate in the page metadata.",
    geometry_precision: "borough",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; exact site boundary, occupation, sale, and building-performance details require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_the_interlock_completion_2021",
    date: "2021-01-01",
    bucket: "planning/development/architecture/mixed use facade",
    title: "The Interlock was listed as built",
    summary:
      "New London Architecture records The Interlock in Camden as a built mixed-use project, with completion in 2021.",
    observed_change:
      "A documented Camden mixed-use architecture project was recorded as reaching built status.",
    area: "Riding House Street / Fitzrovia",
    latitude: 51.518654,
    longitude: -0.140261,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: The Interlock",
    source_url: "https://nla.london/projects/the-interlock",
    source_record_id: "nla-the-interlock",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion year",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Bureau de Change Architects",
    project_type: "mixed-use building with brick facade",
    geometry_source: "NLA page coordinate for The Interlock project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The date is represented as year-level completion; leasing, occupancy, tenancy, and building-performance details require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_a_house_for_life_completion_2023",
    date: "2023-01-01",
    bucket: "planning/development/architecture/residential",
    title: "A House for Life was listed as built",
    summary:
      "New London Architecture records A House for Life in Barnet as a built residential project, with completion in January 2023.",
    observed_change:
      "A documented Barnet residential architecture project was recorded as reaching built status.",
    area: "Grosvenor Road / Barnet",
    latitude: 51.606423,
    longitude: -0.195939,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: A House for Life",
    source_url: "https://nla.london/projects/a-house-for-life",
    source_record_id: "nla-a-house-for-life",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Iguana Architects",
    project_type: "residential architecture project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, sale, accessibility performance, and long-term adaptability require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_heyford_avenue_completion_2023",
    date: "2023-05-01",
    bucket: "planning/development/architecture/residential",
    title: "Heyford Avenue was listed as built",
    summary:
      "New London Architecture records Heyford Avenue in Lambeth as a built residential project, with completion in May 2023.",
    observed_change:
      "A documented Lambeth residential architecture project was recorded as reaching built status.",
    area: "Heyford Avenue / Lambeth",
    latitude: 51.480507,
    longitude: -0.122688,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Heyford Avenue",
    source_url: "https://nla.london/projects/heyford-avenue",
    source_record_id: "nla-heyford-avenue",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Manuel Urbina Studio",
    project_type: "residential architecture project",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and completion month; occupation, sale, planning-condition discharge, and performance outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_royal_wharf_primary_school_completion_2020",
    date: "2020-08-01",
    bucket: "planning/development/architecture/school",
    title: "Royal Wharf Primary School was listed as built",
    summary:
      "New London Architecture records Royal Wharf Primary School in Newham as a built education project, with estimated completion in August 2020.",
    observed_change:
      "A documented Newham primary-school building project was recorded as reaching built status.",
    area: "Royal Wharf / Newham",
    latitude: 51.500187,
    longitude: 0.027333,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Royal Wharf Primary School",
    source_url: "https://nla.london/projects/royal-wharf-primary-school",
    source_record_id: "nla-royal-wharf-primary-school",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Feilden Clegg Bradley Studios",
    project_type: "primary school building",
    geometry_source: "NLA page coordinate for the project location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; school opening, pupil numbers, catchment, and education outcomes require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_166_kings_highway_mih_text_adopted_2025",
    date: "2025-06-11",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "166 Kings Highway zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 166 Kings Highway, N 230379 ZRK, with an adopted date of June 11, 2025, for zoning text tied to the Kings Highway project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 166 Kings Highway area in Brooklyn.",
    area: "166 Kings Highway / Brooklyn",
    latitude: 40.6052,
    longitude: -73.98,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 166 Kings Highway",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/166-kings-highway-n-230379-zrk",
    source_record_id: "nyc-zr-166-kings-highway-n-230379-zrk",
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
    city_id: "nyc",
    event_id: "nyc_arch_2510_coney_island_avenue_mih_text_adopted_2025",
    date: "2025-05-28",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "2510 Coney Island Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2510 Coney Island Avenue, N 230129 ZRK, with an adopted date of May 28, 2025, for zoning text tied to the Coney Island Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2510 Coney Island Avenue area in Brooklyn.",
    area: "2510 Coney Island Avenue / Brooklyn",
    latitude: 40.5944,
    longitude: -73.9619,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2510 Coney Island Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2510-coney-island-avenue-n-230129-zrk",
    source_record_id: "nyc-zr-2510-coney-island-avenue-n-230129-zrk",
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
    city_id: "nyc",
    event_id: "nyc_arch_2201_2227_neptune_avenue_mih_text_adopted_2025",
    date: "2025-05-28",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "2201-2227 Neptune Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 2201-2227 Neptune Av, N 240295 ZRK, with an adopted date of May 28, 2025, for zoning text tied to the Neptune Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 2201-2227 Neptune Avenue area in Brooklyn.",
    area: "2201-2227 Neptune Avenue / Brooklyn",
    latitude: 40.578,
    longitude: -73.989,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 2201-2227 Neptune Av",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/2201-2227-neptune-av-n-240295-zrk",
    source_record_id: "nyc-zr-2201-2227-neptune-av-n-240295-zrk",
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
    city_id: "nyc",
    event_id: "nyc_arch_19_maspeth_avenue_mih_text_adopted_2025",
    date: "2025-05-28",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "19 Maspeth Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 19 Maspeth Avenue, N 240207 ZRK, with an adopted date of May 28, 2025, for zoning text tied to the Maspeth Avenue project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 19 Maspeth Avenue area in Brooklyn.",
    area: "19 Maspeth Avenue / Williamsburg",
    latitude: 40.7163,
    longitude: -73.9374,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 19 Maspeth Avenue",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/19-maspeth-avenue-n-240207-zrk",
    source_record_id: "nyc-zr-19-maspeth-avenue-n-240207-zrk",
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
    city_id: "nyc",
    event_id: "nyc_arch_102_51_queens_boulevard_text_adopted_2025",
    date: "2025-05-01",
    bucket: "planning/development/zoning/mixed use development",
    title: "102-51 Queens Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 102-51 Queens Boulevard with an adopted date of May 1, 2025, for zoning text tied to the Queens Boulevard project area.",
    observed_change:
      "A documented zoning text milestone was recorded for the 102-51 Queens Boulevard area in Queens.",
    area: "102-51 Queens Boulevard / Forest Hills",
    latitude: 40.7243,
    longitude: -73.8504,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 102-51 Queens Boulevard",
    source_url: "https://zr.planning.nyc.gov/recently-adopted/102-51-queens-boulevard",
    source_record_id: "nyc-zr-102-51-queens-boulevard",
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
    event_id: "bfs_arch_north_foreshore_dev_sites_infrastructure_works_started_2025",
    date: "2025-10-24",
    bucket: "planning/development/site infrastructure",
    title: "North Foreshore development-sites infrastructure works started",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded that North Foreshore Development Sites Infrastructure Works had started on site for the gas extraction system, with further foul pumping station fit-out activity due to follow.",
    observed_change:
      "A documented construction-progress milestone was recorded for infrastructure works at the North Foreshore development sites.",
    area: "North Foreshore",
    latitude: 54.634,
    longitude: -5.918,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-north-foreshore-development-sites-infrastructure-works-started",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and construction-progress report",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and North Foreshore project team; contractor not named in the minutes",
    project_type: "development-sites enabling infrastructure works",
    geometry_source: "Approximate point placed at Belfast North Foreshore because the minutes do not provide works-package coordinates.",
    geometry_precision: "district",
    limitations:
      "The event records a progress update only. It does not confirm full infrastructure completion, handover, plot servicing, planning status for later development, or operational outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_strand_arts_centre_refurbishment_continues_2025",
    date: "2025-10-24",
    bucket: "planning/development/heritage arts venue",
    title: "Strand Arts Centre refurbishment was reported as continuing",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded that work continued on the GBP 6.4m major refurbishment of the Strand Arts Centre art deco cinema building.",
    observed_change:
      "A documented construction-progress milestone was recorded for the Strand Arts Centre refurbishment.",
    area: "Strand Arts Centre / east Belfast",
    latitude: 54.5987,
    longitude: -5.872,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-strand-arts-centre-refurbishment-continues",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and construction-progress report",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Strand Arts Centre, and Belfast Investment Fund project partners; design team not named in the minutes",
    project_type: "heritage cinema refurbishment progress milestone",
    geometry_source: "Approximate point geocoded from Strand Arts Centre.",
    geometry_precision: "site",
    limitations:
      "The event records a progress update only. It does not confirm completion, reopening, final scope, conservation conditions, operating model, or audience outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_orange_hall_works_commenced_2025",
    date: "2025-10-24",
    bucket: "planning/development/heritage community building",
    title: "Belfast Orange Hall works were reported as commenced",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded that work had recently commenced on site for Belfast Orange Hall, including roof repairs and refurbishment of facades, external walls, windows, and external elements.",
    observed_change:
      "A documented construction-start milestone was recorded for Belfast Orange Hall repair and refurbishment works.",
    area: "Belfast Orange Hall",
    latitude: 54.6067,
    longitude: -5.9346,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-belfast-orange-hall-works-commenced",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and construction-progress report",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council and Neighbourhood Regeneration Fund project partners; design team not named in the minutes",
    project_type: "heritage community-building repair and refurbishment progress milestone",
    geometry_source: "Approximate point placed near Clifton Street because the minutes name the building but do not provide a coordinate.",
    geometry_precision: "site approximate",
    limitations:
      "The event records reported commencement only. It does not confirm contract details, full scope, completion, heritage-consent conditions, tenant use, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_abc_trust_hub_phase2_on_site_2025",
    date: "2025-10-24",
    bucket: "planning/development/community leisure hub",
    title: "ABC Trust Health and Leisure Hub Phase 2 was reported as on site",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded that Phase 2 of the ABC Trust Health and Leisure Hub project was on site, comprising facilities including a community cafe and boxing club.",
    observed_change:
      "A documented construction-progress milestone was recorded for Phase 2 of the ABC Trust Health and Leisure Hub.",
    area: "ABC Trust Health and Leisure Hub",
    latitude: 54.606,
    longitude: -5.951,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-abc-trust-health-leisure-hub-phase-2-on-site",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and construction-progress report",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "ABC Trust, Urban Villages, Belfast City Council, and project partners; design team not named in the minutes",
    project_type: "community health and leisure hub construction-progress milestone",
    geometry_source: "Approximate north/west Belfast district point because the minutes do not provide a street address or coordinate.",
    geometry_precision: "district",
    limitations:
      "The event records a progress update only. It does not confirm completion, final facility mix, opening, management arrangements, user numbers, or health/leisure outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sandy_row_arts_digital_hub_progressing_2025",
    date: "2025-10-24",
    bucket: "planning/development/arts digital hub",
    title: "Sandy Row Arts and Digital Hub was reported as progressing",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 24 October 2025 recorded that work was progressing on the new-build Sandy Row Arts and Digital Hub for creative and digital arts entrepreneurs.",
    observed_change:
      "A documented construction-progress milestone was recorded for the Sandy Row Arts and Digital Hub.",
    area: "Sandy Row",
    latitude: 54.5901,
    longitude: -5.935,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 24 October 2025",
    source_url: belfastOct2025PhysicalProgramme,
    source_record_id: "bcc-spr-2025-10-24-sandy-row-arts-digital-hub-progressing",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and construction-progress report",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast Investment Fund, Urban Villages, and Sandy Row project partners; design team not named in the minutes",
    project_type: "new-build arts and digital hub construction-progress milestone",
    geometry_source: "Approximate district point placed in Sandy Row because the minutes do not provide a mapped site boundary.",
    geometry_precision: "district",
    limitations:
      "The event records a progress update only. It does not confirm completion, opening, tenancy, programme delivery, business support, or economic outcomes."
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
