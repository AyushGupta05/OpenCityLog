const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const doc = JSON.parse(fs.readFileSync(path, "utf8"));

const retrievedAt = "2026-05-18";
const belfastJan2026PhysicalProgramme =
  "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=86588";

const records = [
  {
    city_id: "london",
    event_id: "lon_arch_new_avenue_enfield_completion_2025",
    date: "2025-07-01",
    bucket: "planning/development/architecture/housing regeneration",
    title: "New Avenue Enfield was listed as built",
    summary:
      "New London Architecture records New Avenue in Enfield as a built regeneration of Coverack Close into 502 homes, with estimated completion in July 2025.",
    observed_change:
      "A documented Enfield estate-regeneration housing project was recorded as reaching built status.",
    area: "Coverack Close / New Avenue, Enfield",
    latitude: 51.6397,
    longitude: -0.1366,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: New Avenue",
    source_url: "https://nla.london/projects/new-avenue",
    source_record_id: "nla-new-avenue",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "HTA Design LLP and New Avenue project team",
    project_type: "estate-regeneration housing project",
    geometry_source: "Approximate point geocoded from Coverack Close / Avenue Road project area.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; phased occupation, final tenure mix, resident rehousing, and estate-management arrangements require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_6_st_andrew_street_completion_2024",
    date: "2024-10-01",
    bucket: "planning/development/architecture/office retrofit",
    title: "6 St Andrew Street was listed as built",
    summary:
      "New London Architecture records 6 St Andrew Street as a built City of London retrofit and managed-workspace project, with estimated completion in October 2024.",
    observed_change:
      "A documented City of London office retrofit was recorded as reaching built status.",
    area: "St Andrew Street / City of London",
    latitude: 51.5169,
    longitude: -0.1072,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: 6 St Andrew Street",
    source_url: "https://nla.london/projects/6-st-andrew-street",
    source_record_id: "nla-6-st-andrew-street",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "6 St Andrew Street project team; architect not named on the NLA project page",
    project_type: "office retrofit and managed workspace",
    geometry_source: "Approximate point geocoded from NLA-stated 6 St Andrew Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; tenant occupation, retrofit specification, heritage-setting impacts, and operational performance require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_tollgate_gardens_regeneration_completion_2019",
    date: "2019-06-01",
    bucket: "planning/development/architecture/estate regeneration",
    title: "Tollgate Gardens Regeneration was listed as built",
    summary:
      "New London Architecture records Tollgate Gardens Regeneration in Westminster as a built estate project replacing a late-1960s estate with 190 new homes and refurbishing 58 more, with estimated completion in June 2019.",
    observed_change:
      "A documented Maida Vale estate-regeneration housing project was recorded as reaching built status.",
    area: "Tollgate Gardens / Maida Vale",
    latitude: 51.5355,
    longitude: -0.1916,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Tollgate Gardens Regeneration",
    source_url: "https://nla.london/projects/tollgate-gardens-regeneration",
    source_record_id: "nla-tollgate-gardens-regeneration",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Tollgate Gardens project team; architect not named on the NLA project page",
    project_type: "estate-regeneration housing and refurbishment",
    geometry_source: "Approximate point geocoded from Tollgate Gardens estate location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; rehousing, tenure, final resident occupation, and estate-service outcomes require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_kilburn_quarter_completion_2017",
    date: "2017-12-01",
    bucket: "planning/development/architecture/estate regeneration",
    title: "Kilburn Quarter was listed as built",
    summary:
      "New London Architecture records Kilburn Quarter as a built phase of South Kilburn Estate regeneration in Brent, with estimated completion in December 2017.",
    observed_change:
      "A documented South Kilburn estate-regeneration phase was recorded as reaching built status.",
    area: "Hansel Road / South Kilburn",
    latitude: 51.5312,
    longitude: -0.1943,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Kilburn Quarter",
    source_url: "https://nla.london/projects/kilburn-quarter",
    source_record_id: "nla-kilburn-quarter",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "Lifschutz Davidson Sandilands and Kilburn Quarter project team",
    project_type: "estate-regeneration housing phase",
    geometry_source: "Approximate point geocoded from NLA-stated 15 Hansel Road location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The event records built status and estimated completion month; wider South Kilburn phasing, resident rehousing, tenure, and public-realm adoption require separate evidence."
  },
  {
    city_id: "london",
    event_id: "lon_arch_spring_mews_completion_2014",
    date: "2014-09-01",
    bucket: "planning/development/architecture/mixed use student hotel",
    title: "Spring Mews was listed as built",
    summary:
      "New London Architecture records Spring Mews in Lambeth as a built mixed-use redevelopment with student accommodation, hotel, and workspace elements, with estimated completion in September 2014.",
    observed_change:
      "A documented Vauxhall mixed-use redevelopment on Tinworth Street was recorded as reaching built status.",
    area: "Tinworth Street / Vauxhall",
    latitude: 51.4895,
    longitude: -0.1213,
    source_ids: ["london-architecture-public-pages"],
    source_name: "New London Architecture project page: Spring Mews",
    source_url: "https://nla.london/projects/spring-mews",
    source_record_id: "nla-spring-mews",
    source_retrieved_at: retrievedAt,
    source_date_field: "NLA estimated completion month",
    source_dataset_id: "london-architecture-public-pages",
    confidence: "documented",
    architect: "The Manser Practice and Spring Mews project team",
    project_type: "student accommodation, hotel, workspace, and mixed-use redevelopment",
    geometry_source: "Approximate point geocoded from NLA-stated 10 Tinworth Street location.",
    geometry_precision: "site",
    limitations:
      "Source is a curated project page. The record captures built status and estimated completion month; student occupation, hotel opening, workspace tenancy, and conservation-area impacts require separate evidence."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_699_703_lexington_avenue_mih_text_adopted_2025",
    date: "2025-11-25",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "699-703 Lexington Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 699-703 Lexington Avenue, N 250195 ZRK, with an adopted date of November 25, 2025, amending Appendix F for Brooklyn Community District 3 Mandatory Inclusionary Housing area 12.",
    observed_change:
      "A documented zoning text milestone was recorded for the 699-703 Lexington Avenue area in Brooklyn.",
    area: "699-703 Lexington Avenue / Bedford-Stuyvesant",
    latitude: 40.6899,
    longitude: -73.933,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 699-703 Lexington Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/699-703-lexington-avenue-n-250195-zrk",
    source_record_id: "nyc-zr-699-703-lexington-avenue-n-250195-zrk",
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
    event_id: "nyc_arch_1551_broadway_midtown_text_adopted_2025",
    date: "2025-11-25",
    bucket: "planning/development/zoning/midtown commercial district",
    title: "1551 Broadway zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 1551 Broadway, N 250189 ZRM, with an adopted date of November 25, 2025, adding Section 81-734 in the Midtown zoning rules.",
    observed_change:
      "A documented zoning text milestone was recorded for 1551 Broadway in the Times Square area.",
    area: "1551 Broadway / Times Square",
    latitude: 40.7589,
    longitude: -73.9855,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 1551 Broadway",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/1551-broadway-n-250189-zrm",
    source_record_id: "nyc-zr-1551-broadway-n-250189-zrm",
    source_retrieved_at: retrievedAt,
    source_date_field: "NYC Zoning Resolution recently adopted date",
    source_dataset_id: "nyc-architecture-public-pages",
    confidence: "documented",
    architect: "NYC Department of City Planning, City Planning Commission, City Council, and project applicant; architect not identified in the zoning page",
    project_type: "site-related Midtown zoning text amendment",
    geometry_source: "Approximate point geocoded from the zoning-page address rather than a mapped zoning boundary.",
    geometry_precision: "site",
    limitations:
      "The event records zoning text adoption only. It does not confirm building alteration, signage work, tenancy, public-space delivery, permits, or construction completion."
  },
  {
    city_id: "nyc",
    event_id: "nyc_arch_58_nixon_court_mih_text_adopted_2025",
    date: "2025-11-12",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "58 Nixon Court II zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 58 Nixon Court II, N 240376 ZRK, with an adopted date of November 12, 2025, amending Appendix F for Brooklyn Community District 13 Mandatory Inclusionary Housing area 3.",
    observed_change:
      "A documented zoning text milestone was recorded for the 58 Nixon Court area in Brooklyn.",
    area: "58 Nixon Court / Gravesend",
    latitude: 40.5849,
    longitude: -73.9678,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 58 Nixon Court II",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/58-nixon-court-ii-n-240376-zrk",
    source_record_id: "nyc-zr-58-nixon-court-ii-n-240376-zrk",
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
    event_id: "nyc_arch_464_ovington_avenue_mih_text_adopted_2025",
    date: "2025-11-12",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "464 Ovington Avenue zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 464 Ovington Avenue, N 250057 ZRK, with an adopted date of November 12, 2025, amending Appendix F for Brooklyn Community District 10 Mandatory Inclusionary Housing area 2.",
    observed_change:
      "A documented zoning text milestone was recorded for the 464 Ovington Avenue area in Brooklyn.",
    area: "464 Ovington Avenue / Bay Ridge",
    latitude: 40.6326,
    longitude: -74.0221,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 464 Ovington Avenue",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/464-ovington-avenue-n-250057-zrk",
    source_record_id: "nyc-zr-464-ovington-avenue-n-250057-zrk",
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
    event_id: "nyc_arch_78_01_queens_boulevard_mih_text_adopted_2025",
    date: "2025-11-12",
    bucket: "planning/development/zoning/mandatory inclusionary housing",
    title: "78-01 Queens Boulevard zoning text was adopted",
    summary:
      "The NYC Zoning Resolution records 78-01 Queens Boulevard, N 250045 ZRQ, with an adopted date of November 12, 2025, amending Appendix F for Queens Community District 4 Mandatory Inclusionary Housing area 3.",
    observed_change:
      "A documented zoning text milestone was recorded for the 78-01 Queens Boulevard area in Queens.",
    area: "78-01 Queens Boulevard / Elmhurst",
    latitude: 40.7337,
    longitude: -73.8711,
    source_ids: ["nyc-architecture-public-pages"],
    source_name: "NYC Zoning Resolution recently adopted page: 78-01 Queens Boulevard",
    source_url: "https://zr.planning.nyc.gov/index.php/recently-adopted/78-01-queens-boulevard-n-250045-zrq",
    source_record_id: "nyc-zr-78-01-queens-boulevard-n-250045-zrq",
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
    event_id: "bfs_arch_council_chamber_av_stage3_committed_2026",
    date: "2026-01-23",
    bucket: "planning/development/civic building technology",
    title: "Council Chamber AV upgrade moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 23 January 2026 recorded agreement that the IT Programme Digitising Audio-Visual Technology project in the Council Chamber be moved to Stage 3 - Committed and held at Tier 0 - Scheme at Risk pending further development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for digital audio-visual upgrades in Belfast City Hall's Council Chamber.",
    area: "Belfast City Hall / Council Chamber",
    latitude: 54.5964,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 23 January 2026",
    source_url: belfastJan2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-01-23-council-chamber-av-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council IT Programme, Physical Programmes, and Council Chamber project team; AV design team not named in the minutes",
    project_type: "civic chamber audio-visual upgrade milestone",
    geometry_source: "Approximate point placed at Belfast City Hall rather than a surveyed Council Chamber works area.",
    geometry_precision: "site",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm tender outcome, contract award, installation start, completion, system specification, or meeting-operation changes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_sydenham_greenway_stage3_committed_2026",
    date: "2026-01-23",
    bucket: "planning/development/greenway public realm",
    title: "Sydenham Greenway feeder path moved to Stage 3",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 23 January 2026 recorded agreement that the Sydenham Greenway feeder path through Alderman Tommy Patton Memorial Park be moved to Stage 3 - Committed and held at Tier 0 - Scheme at Risk pending further development and a satisfactory tender return.",
    observed_change:
      "A documented capital-programme milestone was recorded for a greenway feeder path through Alderman Tommy Patton Memorial Park.",
    area: "Alderman Tommy Patton Memorial Park / Sydenham Greenway",
    latitude: 54.611,
    longitude: -5.8697,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 23 January 2026",
    source_url: belfastJan2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-01-23-sydenham-greenway-stage-3",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Department for Infrastructure, and greenway project team; design team not named in the minutes",
    project_type: "greenway feeder path capital-programme milestone",
    geometry_source: "Approximate point geocoded from Alderman Tommy Patton Memorial Park rather than a mapped feeder-path alignment.",
    geometry_precision: "corridor",
    limitations:
      "The event records Stage 3 programme status only. It does not confirm final route alignment, tender result, contract award, statutory approvals, construction, completion, or opening."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_staff_cycle_racks_stage2_2026",
    date: "2026-01-23",
    bucket: "planning/development/civic active travel",
    title: "Staff Cycle Racks Installation moved to Stage 2",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 23 January 2026 recorded agreement that Staff Cycle Racks Installation be moved to Stage 2 - Uncommitted to work up options for City Hall, Cecil Ward Building, 9 Adelaide, Duncrue, and other premises.",
    observed_change:
      "A documented capital-programme milestone was recorded for options development on staff cycle-parking facilities across Belfast City Council premises.",
    area: "Belfast City Hall / Cecil Ward Building / council premises",
    latitude: 54.5953,
    longitude: -5.9295,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 23 January 2026",
    source_url: belfastJan2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-01-23-staff-cycle-racks-stage-2",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and facilities project team; design team not named at this stage",
    project_type: "staff cycle-parking options milestone",
    geometry_source: "Representative point placed at Cecil Ward Building because the minutes describe multiple council premises.",
    geometry_precision: "multi-site",
    limitations:
      "The event records Stage 2 options status only. It does not confirm final sites, rack numbers, design, procurement, installation, completion, use, or transport outcomes."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_floral_hall_phase2_roof_budget_2026",
    date: "2026-01-23",
    bucket: "planning/development/heritage conservation",
    title: "Floral Hall Phase 2 roof works budget was agreed",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 23 January 2026 recorded agreement that Phase 2 health and safety roof works at Floral Hall proceed with a GBP 565,000 budget after a tender was received.",
    observed_change:
      "A documented capital-programme milestone was recorded for making Floral Hall watertight through roof works.",
    area: "Floral Hall / Belfast Zoo",
    latitude: 54.6561,
    longitude: -5.9425,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 23 January 2026",
    source_url: belfastJan2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-01-23-floral-hall-phase-2-roof-budget",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and capital-programme decision",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council Physical Programmes and Floral Hall project team; works contractor not named in the minutes",
    project_type: "heritage building health-and-safety roof works milestone",
    geometry_source: "Approximate point geocoded from Floral Hall / Antrim Road location.",
    geometry_precision: "site",
    limitations:
      "The event records agreement of Phase 2 roof-works budget only. It does not confirm contract award, works start, completion, full restoration, future use, or public access."
  },
  {
    city_id: "belfast",
    event_id: "bfs_arch_belfast_stories_funding_contract_conditions_noted_2026",
    date: "2026-01-23",
    bucket: "planning/development/cultural facility",
    title: "Belfast Stories funding-contract conditions were noted",
    summary:
      "Belfast Strategic Policy and Resources Committee minutes for 23 January 2026 recorded key conditions in the Department for the Economy Contract for Funding for Belfast Stories, including the assistance period from 13 January 2026 to 31 May 2032.",
    observed_change:
      "A documented funding-governance milestone was recorded for the Belfast Stories cultural and visitor-destination project.",
    area: "Royal Avenue, North Street, Union Street and Kent Street",
    latitude: 54.6022,
    longitude: -5.9298,
    source_ids: ["belfast-architecture-public-pages"],
    source_name: "Belfast City Council Strategic Policy and Resources Committee agenda item: Physical Programme Update, 23 January 2026",
    source_url: belfastJan2026PhysicalProgramme,
    source_record_id: "bcc-spr-2026-01-23-belfast-stories-funding-contract-conditions",
    source_retrieved_at: retrievedAt,
    source_date_field: "Committee meeting date and funding-contract conditions recorded",
    source_dataset_id: "belfast-architecture-public-pages",
    confidence: "documented",
    architect: "Belfast City Council, Department for the Economy, Belfast Region City Deal partners, and Belfast Stories project team",
    project_type: "cultural facility funding-governance milestone",
    geometry_source: "Approximate point reused from Belfast Stories site area bounded by Royal Avenue, North Street, Union Street, and Kent Street.",
    geometry_precision: "site",
    limitations:
      "The event records funding-contract conditions noted in committee minutes. It does not confirm design approval, planning permission, procurement, construction start, completion, opening, visitor numbers, or economic outcomes."
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
