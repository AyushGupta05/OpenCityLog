const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROUND_ID = "round402_belfast_official_architecture_sweep_next12";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join("scripts", "fetch_round402_belfast_official_architecture_sweep_next12_candidates.js");
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20",
  note: "Round402 Belfast official architecture/built-environment sweep window; accepted events must not be after 2026-05-20."
};

const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DE_CROWN_COPYRIGHT_URL = "https://www.education-ni.gov.uk/articles/crown-copyright-education";
const BELFAST_HARBOUR_TERMS_URL = "https://www.belfast-harbour.co.uk/terms-conditions/";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-and-conditions";

const SEARCH_QUERIES_CHECKED = [
  'site:education-ni.gov.uk/news Belfast "cut the first sod" "Primary School"',
  'site:education-ni.gov.uk/news Belfast "officially opened" "new" "school"',
  'site:education-ni.gov.uk/news Belfast "construction" "school"',
  'site:belfast-harbour.co.uk/notice-to-mariners "Belfast Harbour Marina Expansion Works"',
  '"Belfast Harbour Marina Expansion Works" "14 Oct 2025"',
  'site:belfastcity.gov.uk/news Belfast "work begins" "building" "2025"',
  'site:belfastcity.gov.uk/news "Assembly Rooms" "October 2025"',
  'site:minutes.belfastcity.gov.uk "Ulidia Resource Centre" "LA04/2024/0475/F"',
  'live corpus rg: McArthur Hall|Scoil an Droichid|Belfast Harbour Marina|Marina Expansion|Glenwood Primary School|Elmgrove Primary School',
  'live corpus rg: Deanby Centre|Our Lady of Lourdes Primary School Belfast|St Bride\'s Primary School|Greater Ardoyne|Lockhouse|Assembly Rooms'
];

const SOURCES = [
  {
    source_id: "de-elmgrove-primary-first-sod-2021-round402",
    source_name: "Work begins on new GBP12.6 million East Belfast Primary School",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/work-begins-new-ps126-million-east-belfast-primary-school",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2021-04-28",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Department of Education capital-build milestone for Elmgrove Primary School, Belfast.",
    reliability: "High for the source-published construction-start/sod-cut milestone and named project scope.",
    caveats: "The page contains anticipated completion wording and ministerial value statements; Round402 uses only the documented start-stage facts and does not infer outcomes.",
    required_markers: [
      "Work begins on new",
      "East Belfast Primary School",
      "Date published",
      "28 April 2021",
      "Elmgrove Primary School",
      "cut the first sod",
      "construction work"
    ]
  },
  {
    source_id: "de-scoil-an-droichid-next-phase-2025-round402",
    source_name: "Education Minister marks next phase of construction work at Scoil an Droichid Primary School and Nursery Unit",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-marks-next-phase-construction-work-scoil-droichid-primary-school-and-nursery-unit",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2025-10-21",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Department of Education capital-project progress milestone for Scoil an Droichid Primary School and Nursery Unit, Belfast.",
    reliability: "High for the source-published site visit, progress-stage wording, project scope and former Ulidia Resource Centre location.",
    caveats: "The source states anticipated completion in 2026; Round402 records only the 2025 next-phase milestone and does not claim completion, opening or education outcomes.",
    required_markers: [
      "Scoil an Droichid",
      "Date published",
      "21 October 2025",
      "next phase of construction",
      "former Ulidia Resource Centre",
      "Connolly & Fee"
    ]
  },
  {
    source_id: "belfast-harbour-marina-expansion-notice-2025-round402",
    source_name: "No.19 of 2025 - Marina Expansion Works - Belfast Harbour Marina",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/wp-content/uploads/2025/10/No.19-of-2025-%E2%80%93-Marina-Expansion-Belfast-Harbour-Marina.pdf",
    source_type: "official harbour authority notice to mariners PDF",
    source_date_field: "notice date",
    source_date_value: "2025-10-14",
    license: "Belfast Harbour website copyright/terms; official notice cited for provenance, not reused as open data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Notice to Mariners covering Belfast Harbour Marina expansion works, including piling, pontoon installation and associated marine construction activities.",
    reliability: "High for navigation-safety notice date, works window and described marine works.",
    caveats: "A Notice to Mariners records planned works and exclusion arrangements; it is not completion/opening evidence and should be checked against later harbour notices for changes.",
    required_markers: [
      "No.19 of 2025",
      "Marina Expansion Works",
      "Belfast Harbour Marina",
      "pontoon installation",
      "January 2026",
      "14th October 2025"
    ]
  },
  {
    source_id: "de-schools-progress-construction-stage-2026-round402",
    source_name: "Education Minister announces school building projects to progress to construction stage",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-announces-school-building-projects-progress-construction-stage",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-04-29",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Department of Education announcement that named major works and school enhancement projects, including two Belfast primary schools, progress to construction stage.",
    reliability: "High for the source-published administrative release-to-construction-stage milestone and school names.",
    caveats: "This is a programme-stage announcement, not evidence that site works had physically started or that later works were completed.",
    required_markers: [
      "Date published",
      "29 April 2026",
      "progress to construction stage",
      "Our Lady of Lourdes Primary School Belfast",
      "St Bride",
      "school enhancement projects"
    ]
  },
  {
    source_id: "de-glenwood-primary-first-sod-2026-round402",
    source_name: "Education Minister marks start of construction at Glenwood Primary School",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-marks-start-construction-glenwood-primary-school",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-05-13",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Department of Education capital-project sod-cut/start-stage milestone for Glenwood Primary School, Belfast.",
    reliability: "High for the source-published sod-cut, construction-began date and named design/contractor team.",
    caveats: "The source includes anticipated completion in 2028; Round402 records only the 2026 construction-start milestone and does not claim completion/opening or outcomes.",
    required_markers: [
      "Glenwood Primary School",
      "Date published",
      "13 May 2026",
      "cut the first sod",
      "Construction began in February 2026",
      "Bell Contracts Limited"
    ]
  },
  {
    source_id: "de-methodist-college-mcarthur-hall-2016-search-only-round402",
    source_name: "Work begins on GBP4million project at Methodist College",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/work-begins-ps4million-project-methodist-college",
    source_type: "official government news page indexed by web search, currently not fetchable",
    source_date_field: "Date published",
    source_date_value: "2016-12-15",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Indexed Department of Education result for McArthur Hall refurbishment at Methodist College.",
    reliability: "Potentially high if source can be recovered, but Round402 rejected it because the official URL returned HTTP 404 during validation.",
    caveats: "Do not ingest from the search snippet alone; requires a live official archive or another official record.",
    required_markers: []
  },
  {
    source_id: "bcc-lockhouse-work-begins-2024-duplicate-round402",
    source_name: "Work begins on GBP2.9m shared space project in south Belfast",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Work-begins-on-%C2%A32-9m-shared-space-project-in-south",
    source_type: "official council news page",
    source_date_field: "Date",
    source_date_value: "2024-05-01",
    license: "Belfast City Council website terms; cited for audit only",
    license_url: BCC_TERMS_URL,
    publisher_terms_url: BCC_TERMS_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Lockhouse / LORAG shared-space redevelopment works-start source.",
    reliability: "High for source date and project-stage description.",
    caveats: "Rejected as duplicate because Lockhouse garden opening, redevelopment start and planning-stage records are already in the live corpus.",
    required_markers: []
  },
  {
    source_id: "bcc-assembly-rooms-purchase-2025-duplicate-round402",
    source_name: "Council purchases Belfast's historic Assembly Rooms",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Council-purchases-Belfast-s-historic-Assembly-Room",
    source_type: "official council news page",
    source_date_field: "Date",
    source_date_value: "2025-10-24",
    license: "Belfast City Council website terms; cited for audit only",
    license_url: BCC_TERMS_URL,
    publisher_terms_url: BCC_TERMS_URL,
    accessed_at: ACCESSED_AT,
    coverage: "Assembly Rooms acquisition completion source.",
    reliability: "High for source date and acquisition description.",
    caveats: "Rejected as duplicate because Assembly Rooms agreement/completion/repair-stage records are already in the live corpus and prior sweeps.",
    required_markers: []
  }
];

const CANDIDATES = [
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_elmgrove_primary_first_sod_2021",
    title: "Elmgrove Primary School construction-start milestone was marked",
    summary: "The Department of Education recorded on 28 April 2021 that the minister cut the first sod for a new Elmgrove Primary School build in East Belfast.",
    observed_change: "A documented sod-cut milestone placed the Elmgrove Primary School capital project in a construction-start stage.",
    date: "2021-04-28",
    effective_date: "2021-04-28",
    date_precision: "day",
    category: "education building / school capital works",
    event_type: "construction_start_marked",
    milestone_type: "first_sod",
    area: "Elmgrove Primary School / East Belfast",
    address_or_location: "Elmgrove Primary School, Avoniel Road / Beersbridge Road area, Belfast BT5",
    latitude: 54.597883,
    longitude: -5.882138,
    geometry: { type: "Point", coordinates: [-5.882138, 54.597883] },
    geometry_ref: "Manual corpus/prior DfI planning-statistics geocode for Elmgrove Primary School and Nursery Unit, Avoniel Road, Belfast BT5 4SF.",
    geometry_source: "Reused approximate school-site point from prior Belfast planning-statistics/manual-corpus records; source news page does not publish a geometry.",
    geometry_precision: "Approximate school-site point, not a measured works footprint, listed-building footprint or construction boundary.",
    source_ids: ["de-elmgrove-primary-first-sod-2021-round402"],
    source_name: "Work begins on new GBP12.6 million East Belfast Primary School",
    source_url: "https://www.education-ni.gov.uk/news/work-begins-new-ps126-million-east-belfast-primary-school",
    source_record_id: "Department of Education news page, Date published 28 April 2021",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2021-04-28",
    publisher: "Department of Education, Northern Ireland",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This records the source-published sod-cut/construction-start stage only. It is not evidence of completion, opening, occupancy, educational outcomes, regeneration effects or final as-built condition; later Elmgrove opening records are separate lifecycle evidence.",
    duplicate_check_terms: [
      "Work begins on new GBP12.6 million East Belfast Primary School",
      "Elmgrove Primary School construction-start",
      "cut the first sod Elmgrove Primary School",
      "28 April 2021 Elmgrove Primary School",
      "Woodvale Elmgrove Primary School"
    ],
    duplicate_check_note: "Live corpus already includes Elmgrove planning approvals and a later official-opening event, but no matched 2021 Department of Education first-sod/construction-start event was found.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, duplicate screen against manual corpus and prior sweep packs, source marker validation, approximate point reuse from prior official geocode.`
  },
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_belfast_harbour_marina_expansion_notice_2025",
    title: "Belfast Harbour Marina expansion works notice was issued",
    summary: "Belfast Harbour Notice to Mariners No.19 of 2025, dated 14 October 2025, recorded marina expansion works at Belfast Harbour Marina with a November 2025 to January 2026 works window.",
    observed_change: "An official harbour notice documented a marina expansion works window, including piling, pontoon installation and associated marine construction activities.",
    date: "2025-10-14",
    effective_date: "2025-10-14",
    effective_date_range: {
      start: "2025-11",
      end: "2026-01",
      precision: "month",
      basis: "Notice to Mariners works window"
    },
    date_precision: "day",
    category: "harbour / marina infrastructure",
    event_type: "works_notice_issued",
    milestone_type: "notice_to_mariners",
    area: "Belfast Harbour Marina / Queen's Island waterfront",
    address_or_location: "Belfast Harbour Marina, near Abercorn Basin and Queen's Quay, Belfast",
    latitude: 54.6092,
    longitude: -5.9126,
    geometry: { type: "Point", coordinates: [-5.9126, 54.6092] },
    geometry_ref: "Curated approximate marina point near Belfast Harbour Marina / Abercorn Basin.",
    geometry_source: "Approximate point from named marina location because the Notice to Mariners does not publish a coordinate or mapped works polygon.",
    geometry_precision: "Approximate marina point, not a measured pontoon, piling, exclusion-zone or harbour-estate boundary.",
    source_ids: ["belfast-harbour-marina-expansion-notice-2025-round402"],
    source_name: "No.19 of 2025 - Marina Expansion Works - Belfast Harbour Marina",
    source_url: "https://www.belfast-harbour.co.uk/wp-content/uploads/2025/10/No.19-of-2025-%E2%80%93-Marina-Expansion-Belfast-Harbour-Marina.pdf",
    source_record_id: "Belfast Harbour Notice to Mariners No.19 of 2025, dated 14 October 2025",
    source_type: "official harbour authority notice to mariners PDF",
    source_date_field: "notice date",
    source_date_value: "2025-10-14",
    publisher: "Belfast Harbour",
    license: "Belfast Harbour website copyright/terms; official notice cited for provenance, not reused as open data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Notice to Mariners No.19 of 2025 cited as the official source for the works notice.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This records an official navigation notice and scheduled works window only. It is not evidence that the works were completed, opened, occupied, altered harbour capacity, or remained unchanged after later notices.",
    duplicate_check_terms: [
      "Belfast Harbour Marina Expansion Works",
      "No.19 of 2025 Marina Expansion Works",
      "Belfast Harbour Marina pontoon installation",
      "Marina Expansion Works Belfast Harbour Marina",
      "14th October 2025 Belfast Harbour Marina"
    ],
    duplicate_check_note: "No live-corpus or earlier Belfast sweep hit was found for Belfast Harbour Marina expansion, pontoon installation or Notice to Mariners No.19 of 2025.",
    transformation_method: `${SCRIPT_PATH}: official PDF notice extraction with pypdf, marker validation, duplicate screen against manual corpus and prior sweep packs, approximate marina point.`
  },
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_scoil_an_droichid_next_phase_2025",
    title: "Scoil an Droichid construction next-phase milestone was marked",
    summary: "The Department of Education recorded on 21 October 2025 that the minister visited the Scoil an Droichid school site and formally marked the next phase of its capital construction project.",
    observed_change: "A documented ministerial site visit placed the Scoil an Droichid Primary School and Nursery Unit project in a next-phase construction stage.",
    date: "2025-10-21",
    effective_date: "2025-10-21",
    date_precision: "day",
    category: "education building / school capital works",
    event_type: "construction_phase_marked",
    milestone_type: "next_phase",
    area: "Former Ulidia Resource Centre / Somerset Street and Cross Parade",
    address_or_location: "Former Ulidia Resource Centre, Somerset Street, Ballynafoy, Belfast BT7 2GS",
    latitude: 54.581622,
    longitude: -5.902292,
    geometry: { type: "Point", coordinates: [-5.902292, 54.581622] },
    geometry_ref: "Prior DfI planning-statistics geocode for LA04/2024/0475/F at Ulidia Resource Centre, Somerset Street, Ballynafoy, Belfast BT7 2GS.",
    geometry_source: "Reused approximate source-derived planning-statistics point for the former Ulidia Resource Centre site; source news page does not publish a coordinate.",
    geometry_precision: "Approximate site point, not a measured school building, nursery, hard-play, access or construction boundary.",
    source_ids: ["de-scoil-an-droichid-next-phase-2025-round402"],
    source_name: "Education Minister marks next phase of construction work at Scoil an Droichid Primary School and Nursery Unit",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-marks-next-phase-construction-work-scoil-droichid-primary-school-and-nursery-unit",
    source_record_id: "Department of Education news page, Date published 21 October 2025",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2025-10-21",
    publisher: "Department of Education, Northern Ireland",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This records a next-phase construction milestone only. Prior Ulidia/Scoil an Droichid planning approvals exist as separate records; this event does not evidence completion, opening, occupancy, educational outcomes or final as-built condition.",
    duplicate_check_terms: [
      "Scoil an Droichid next phase of construction",
      "Education Minister marks next phase of construction work at Scoil an Droichid",
      "former Ulidia Resource Centre 21 October 2025",
      "Connolly & Fee Scoil an Droichid",
      "Scoil an Droichid Primary School and Nursery Unit"
    ],
    duplicate_check_note: "Live corpus includes Ulidia/Scoil an Droichid planning approval and renewal records, but no matched 2025 Department of Education next-phase construction milestone was found.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, duplicate screen against manual corpus and prior sweep packs, source marker validation, approximate official planning geocode reuse.`
  },
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_our_lady_of_lourdes_construction_stage_release_2026",
    title: "Our Lady of Lourdes Primary School was named for construction-stage progression",
    summary: "The Department of Education recorded on 29 April 2026 that Our Lady of Lourdes Primary School Belfast was among school enhancement projects moving to construction stage.",
    observed_change: "A documented Department of Education programme-stage announcement named Our Lady of Lourdes Primary School Belfast for construction-stage progression.",
    date: "2026-04-29",
    effective_date: "2026-04-29",
    date_precision: "day",
    category: "education building / school enhancement programme",
    event_type: "construction_stage_release",
    milestone_type: "programme_stage",
    area: "Our Lady of Lourdes Primary School / Antrim Road",
    address_or_location: "Our Lady of Lourdes Primary School, Park Lodge, 700 Antrim Road, Belfast BT15 5GQ",
    latitude: 54.645092,
    longitude: -5.936437,
    geometry: { type: "Point", coordinates: [-5.936437, 54.645092] },
    geometry_ref: "Education Authority school directory point for Our Lady of Lourdes PS [Belfast], 700 Antrim Road.",
    geometry_source: "Approximate school-location point from Education Authority directory; the Department of Education announcement does not publish a project geometry.",
    geometry_precision: "Approximate school point, not a measured enhancement-works footprint, block, classroom, access, or site boundary.",
    source_ids: ["de-schools-progress-construction-stage-2026-round402"],
    source_name: "Education Minister announces school building projects to progress to construction stage",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-announces-school-building-projects-progress-construction-stage",
    source_record_id: "Department of Education news page, Date published 29 April 2026; named school enhancement project",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-04-29",
    publisher: "Department of Education, Northern Ireland",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This is a programme-stage announcement naming the school for construction-stage progression. It does not document physical site works starting, specify the built scope for this school, document completion, or state final as-built condition.",
    duplicate_check_terms: [
      "Our Lady of Lourdes Primary School Belfast construction stage",
      "Our Lady of Lourdes Primary School Belfast school enhancement",
      "29 April 2026 Our Lady of Lourdes Primary School Belfast",
      "Our Lady of Lourdes Primary School progress to construction stage",
      "Park Lodge 700 Antrim Road construction stage"
    ],
    duplicate_check_note: "No live-corpus or prior Belfast sweep hit was found for a 2026 Our Lady of Lourdes Belfast construction-stage progression milestone.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, duplicate screen against manual corpus and prior sweep packs, source marker validation, approximate Education Authority school point.`
  },
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_st_brides_construction_stage_release_2026",
    title: "St Bride's Primary School was named for construction-stage progression",
    summary: "The Department of Education recorded on 29 April 2026 that St Bride's Primary School, Belfast was among school enhancement projects moving to construction stage.",
    observed_change: "A documented Department of Education programme-stage announcement named St Bride's Primary School, Belfast for construction-stage progression.",
    date: "2026-04-29",
    effective_date: "2026-04-29",
    date_precision: "day",
    category: "education building / school enhancement programme",
    event_type: "construction_stage_release",
    milestone_type: "programme_stage",
    area: "St Bride's Primary School / Derryvolgie Avenue",
    address_or_location: "St Bride's Primary School, 36 Derryvolgie Avenue, Belfast BT9 6FP",
    latitude: 54.579096,
    longitude: -5.943729,
    geometry: { type: "Point", coordinates: [-5.943729, 54.579096] },
    geometry_ref: "Education Authority school directory point for St Bride's PS NU [Belfast], 36 Derryvolgie Avenue.",
    geometry_source: "Approximate school-location point from Education Authority directory; the Department of Education announcement does not publish a project geometry.",
    geometry_precision: "Approximate school point, not a measured enhancement-works footprint, extension, classroom block, access, or site boundary.",
    source_ids: ["de-schools-progress-construction-stage-2026-round402"],
    source_name: "Education Minister announces school building projects to progress to construction stage",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-announces-school-building-projects-progress-construction-stage",
    source_record_id: "Department of Education news page, Date published 29 April 2026; named school enhancement project",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-04-29",
    publisher: "Department of Education, Northern Ireland",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This is a programme-stage announcement naming the school for construction-stage progression. Existing corpus records cover St Bride's planning approval; this event does not document physical site works starting, document completion, or state final as-built condition.",
    duplicate_check_terms: [
      "St Bride's Primary School construction stage",
      "St Bride's Primary School Belfast school enhancement",
      "29 April 2026 St Bride's Primary School Belfast",
      "St Bride's Primary School progress to construction stage",
      "36 Derryvolgie Avenue construction stage"
    ],
    duplicate_check_note: "Live corpus includes St Bride's planning approvals from 2024, but no matched 2026 Department of Education construction-stage progression milestone was found.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, duplicate screen against manual corpus and prior sweep packs, source marker validation, approximate Education Authority school point.`
  },
  {
    city_id: CITY_ID,
    event_id: "bfs_arch_round402_glenwood_primary_construction_start_2026",
    title: "Glenwood Primary School construction-start milestone was marked",
    summary: "The Department of Education recorded on 13 May 2026 that the minister cut the first sod for a Glenwood Primary School capital construction project, and stated that construction began in February 2026.",
    observed_change: "A documented sod-cut milestone placed the Glenwood Primary School refurbishment-and-new-block project in a construction-start stage.",
    date: "2026-05-13",
    effective_date: "2026-05-13",
    effective_date_range: {
      start: "2026-02",
      end: "2026-05-13",
      precision: "month_to_day",
      basis: "Source says construction began in February 2026 and page was published on 13 May 2026."
    },
    date_precision: "day",
    category: "education building / school capital works",
    event_type: "construction_start_marked",
    milestone_type: "first_sod",
    area: "Glenwood Primary School / Upper Riga Street",
    address_or_location: "Glenwood Primary School, 4-22 Upper Riga Street, Belfast BT13 3GW",
    latitude: 54.60544,
    longitude: -5.95646,
    geometry: { type: "Point", coordinates: [-5.95646, 54.60544] },
    geometry_ref: "Manual corpus/prior Belfast Planning Committee geocode for Glenwood Primary School, 4-22 Upper Riga Street.",
    geometry_source: "Reused approximate school-site point from prior Belfast Planning Committee/manual-corpus record; source news page does not publish a geometry.",
    geometry_precision: "Approximate school-site point, not a measured listed-building, new-block, contractor compound or works boundary.",
    source_ids: ["de-glenwood-primary-first-sod-2026-round402"],
    source_name: "Education Minister marks start of construction at Glenwood Primary School",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-marks-start-construction-glenwood-primary-school",
    source_record_id: "Department of Education news page, Date published 13 May 2026",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-05-13",
    publisher: "Department of Education, Northern Ireland",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "This records the source-published construction-start/sod-cut stage only. Existing corpus records cover Glenwood planning approvals; this event does not evidence completion, opening, occupancy, educational outcomes or final as-built condition.",
    duplicate_check_terms: [
      "Education Minister marks start of construction at Glenwood Primary School",
      "Glenwood Primary School construction began in February 2026",
      "13 May 2026 Glenwood Primary School",
      "Bell Contracts Limited Glenwood Primary School",
      "Hamilton Architects Glenwood Primary School"
    ],
    duplicate_check_note: "Live corpus includes Glenwood planning approval records, but no matched 2026 Department of Education construction-start/sod-cut milestone was found.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, duplicate screen against manual corpus and prior sweep packs, source marker validation, approximate official planning geocode reuse.`
  }
];

const REJECTED = [
  {
    id: "methodist_college_mcarthur_hall_official_url_404_round402",
    title: "Methodist College McArthur Hall refurbishment work-start",
    status: "rejected",
    reason_code: "official_source_not_live",
    reason: "The indexed Department of Education result looked like a useful 15 December 2016 official source for McArthur Hall refurbishment, but the official URL returned HTTP 404 during Round402 validation. It should not be ingested from a search snippet alone.",
    source_ids: ["de-methodist-college-mcarthur-hall-2016-search-only-round402"],
    source_url: "https://www.education-ni.gov.uk/news/work-begins-ps4million-project-methodist-college",
    screened_terms: ["McArthur Hall", "Methodist College", "Work begins on GBP4million project at Methodist College"]
  },
  {
    id: "deanby_centre_special_school_duplicate_round402",
    title: "Deanby Centre Special School officially opened",
    status: "rejected",
    reason_code: "duplicate_existing_event",
    reason: "The Department of Education official-opening page is already represented in the live manual corpus as bfs_arch_deanby_centre_special_school_opening_2024.",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-opens-new-special-school-belfast",
    screened_terms: ["Deanby Centre", "Education Minister opens new special school in Belfast", "12 December 2024"]
  },
  {
    id: "lockhouse_redevelopment_work_start_duplicate_round402",
    title: "Lockhouse redevelopment work started on the Lagan Towpath",
    status: "rejected",
    reason_code: "duplicate_existing_event",
    reason: "Lockhouse community garden opening, redevelopment-start and later planning records are already in the live manual corpus and earlier Belfast public-facility packs.",
    source_ids: ["bcc-lockhouse-work-begins-2024-duplicate-round402"],
    source_url: "https://www.belfastcity.gov.uk/News/Work-begins-on-%C2%A32-9m-shared-space-project-in-south",
    screened_terms: ["Lockhouse", "LORAG", "shared space project in south Belfast", "13 River Terrace"]
  },
  {
    id: "assembly_rooms_purchase_completion_duplicate_round402",
    title: "Belfast City Council completed purchase of the historic Assembly Rooms",
    status: "rejected",
    reason_code: "duplicate_existing_event",
    reason: "Assembly Rooms purchase agreement, purchase completion and repair-stage milestones are already represented in the live manual corpus and prior Belfast official sweeps.",
    source_ids: ["bcc-assembly-rooms-purchase-2025-duplicate-round402"],
    source_url: "https://www.belfastcity.gov.uk/News/Council-purchases-Belfast-s-historic-Assembly-Room",
    screened_terms: ["Assembly Rooms", "Braddell", "5-9 North Street", "24 October 2025"]
  },
  {
    id: "ardoyne_youth_hub_work_start_duplicate_round402",
    title: "Greater Ardoyne youth hub works-start milestone",
    status: "rejected",
    reason_code: "duplicate_existing_event",
    reason: "The March 2026 sod-cut/works-start milestone for the Ardoyne Youth Enterprises hub is already present in the live corpus and earlier Belfast sweep packs.",
    source_url: "https://www.executiveoffice-ni.gov.uk/news/first-minister-and-deputy-first-minister-cut-sod-new-purpose-built-youth-hub",
    screened_terms: ["Ardoyne Youth", "purpose-built youth hub", "Crumlin Road", "sod"]
  },
  {
    id: "st_brides_planning_approval_duplicate_not_stage_release_round402",
    title: "St Bride's Primary School campus works were approved",
    status: "rejected",
    reason_code: "duplicate_existing_event",
    reason: "The 2024 planning approval for St Bride's Primary School campus works is already in the live manual corpus. Round402 kept only the separate 2026 Department of Education construction-stage programme milestone.",
    source_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=11672",
    screened_terms: ["St Bride's Primary School campus works were approved", "LA04/2023/3143/F", "Derryvolgie Avenue"]
  },
  {
    id: "holy_family_nursery_development_proposal_rejected_round402",
    title: "Holy Family Primary School nursery unit development proposal approval",
    status: "rejected",
    reason_code: "weak_or_superseded_milestone",
    reason: "The Department of Education development-proposal page records an education-management approval/intent and a proposed opening date, not a later built-environment works, completion or opening milestone. Related planning evidence is already available elsewhere in the corpus.",
    source_url: "https://www.education-ni.gov.uk/news/new-nursery-unit-holy-family-primary-school-belfast-approved",
    screened_terms: ["Holy Family Primary School", "new nursery unit", "development proposal"]
  },
  {
    id: "belfast_harbour_deepwater_cruise_quay_held_round402",
    title: "Belfast Harbour deepwater cruise quay current-status mention",
    status: "rejected",
    reason_code: "insufficient_event_date_or_specificity",
    reason: "A Belfast Harbour cruise-call page mentioned continuing construction, but the page was not a clean construction-start/completion record for the quay and had weaker event dating than the Notice to Mariners marina source.",
    source_url: "https://www.belfast-harbour.co.uk/news/belfast-harbour-welcomes-first-major-cruise-call-of-2026-as-majestic-princess-makes-inaugural-visit/",
    screened_terms: ["deepwater cruise quay", "D3 site", "construction continues"]
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stableJson(value) {
  const sortValue = (item) => {
    if (Array.isArray(item)) return item.map(sortValue);
    if (item && typeof item === "object") {
      return Object.fromEntries(Object.keys(item).sort().map((key) => [key, sortValue(item[key])]));
    }
    return item;
  };
  return JSON.stringify(sortValue(value), null, 2);
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${stableJson(value)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&pound;/g, "GBP")
    .replace(/\u00a3/g, "GBP")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function toPosixRelative(filePath) {
  return filePath.split(path.sep).join("/");
}

function sourceById(sourceId) {
  return SOURCES.find((source) => source.source_id === sourceId);
}

function getPriorFiles() {
  const roots = ["data/manual_drops", "tmp/subagents", "scripts"];
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const rg = spawnSync("rg", ["--files", root], { encoding: "utf8", maxBuffer: 1024 * 1024 * 20 });
    if (rg.status === 0) {
      for (const line of rg.stdout.split(/\r?\n/).filter(Boolean)) {
        const normalized = toPosixRelative(line);
        if (normalized.includes(ROUND_ID)) continue;
        if (normalized === SCRIPT_PATH) continue;
        if (/\.(json|jsonl|ndjson|md|js|csv|txt)$/i.test(normalized)) files.push(normalized);
      }
    }
  }
  return files;
}

function scanDuplicateTerms(terms) {
  const hits = [];
  for (const term of terms) {
    const rg = spawnSync(
      "rg",
      [
        "-n",
        "--fixed-strings",
        "--glob",
        `!${OUT_DIR.replace(/\\/g, "/")}/**`,
        "--glob",
        `!${SCRIPT_PATH}`,
        term,
        "data/manual_drops",
        "tmp/subagents",
        "scripts"
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 }
    );
    if (rg.status === 0) {
      const lines = rg.stdout.split(/\r?\n/).filter(Boolean).slice(0, 20);
      hits.push({ term, count_shown: lines.length, lines });
    }
  }
  return hits;
}

function extractPdfTextWithPythonFromBytes(buffer) {
  const py = [
    "import io, sys",
    "from pypdf import PdfReader",
    "data = sys.stdin.buffer.read()",
    "reader = PdfReader(io.BytesIO(data))",
    "parts = []",
    "for page in reader.pages:",
    "    try:",
    "        parts.append(page.extract_text() or '')",
    "    except Exception as exc:",
    "        parts.append('')",
    "sys.stdout.write('\\n'.join(parts))"
  ].join("\n");
  const run = spawnSync("python", ["-c", py], {
    input: buffer,
    encoding: "buffer",
    maxBuffer: 1024 * 1024 * 20
  });
  if (run.status !== 0) {
    return { ok: false, text: "", error: String(run.stderr || run.stdout || "pypdf extraction failed") };
  }
  return { ok: true, text: run.stdout.toString("utf8"), error: null };
}

async function fetchTextSource(source) {
  try {
    const response = await fetch(source.source_url, {
      headers: {
        "user-agent": "Bims-5 Round402 provenance source audit (official-source citation validation)"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    let text = "";
    let extraction = "html_or_text";
    let extraction_error = null;
    if (/pdf/i.test(contentType) || /\.pdf($|\?)/i.test(source.source_url)) {
      extraction = "pypdf";
      const pdf = extractPdfTextWithPythonFromBytes(buffer);
      text = pdf.text;
      extraction_error = pdf.error;
    } else {
      text = buffer.toString("utf8");
    }
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      ok: response.ok,
      status: response.status,
      content_type: contentType,
      byte_length: buffer.length,
      extraction,
      extraction_error,
      text: normalizeText(text)
    };
  } catch (error) {
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      ok: false,
      status: null,
      content_type: null,
      byte_length: 0,
      extraction: "fetch_failed",
      extraction_error: String(error && error.message ? error.message : error),
      text: ""
    };
  }
}

function buildSourceAudit(fetchResults) {
  const fetchById = new Map(fetchResults.map((result) => [result.source_id, result]));
  return SOURCES.map((source) => {
    const linkedCandidateIds = CANDIDATES
      .filter((candidate) => candidate.source_ids.includes(source.source_id))
      .map((candidate) => candidate.event_id);
    const fetchResult = fetchById.get(source.source_id);
    return {
      round_id: ROUND_ID,
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      license: source.license,
      license_url: source.license_url,
      accessed_at: source.accessed_at,
      temporal_coverage: source.source_date_value,
      geographic_scope: source.coverage,
      key_fields_used: [
        source.source_date_field,
        "project/site name",
        "publisher",
        "source URL",
        "project-stage wording",
        "location text"
      ],
      reliability: source.reliability,
      caveats: source.caveats,
      recommendation: linkedCandidateIds.length
        ? "accept_for_candidate_pack_with_limitations"
        : "audit_or_reject_only_do_not_ingest_as_candidate",
      linked_candidate_ids: linkedCandidateIds,
      fetch_ok: fetchResult ? fetchResult.ok : null,
      fetch_status: fetchResult ? fetchResult.status : null,
      content_type: fetchResult ? fetchResult.content_type : null,
      marker_terms_checked: source.required_markers
    };
  });
}

function validateCandidates(fetchResults) {
  const errors = [];
  const warnings = [];
  const sourceIds = new Set(SOURCES.map((source) => source.source_id));
  const candidateIds = new Set();
  const fetchById = new Map(fetchResults.map((result) => [result.source_id, result]));
  const requiredFields = [
    "city_id",
    "event_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "effective_date",
    "date_precision",
    "category",
    "area",
    "address_or_location",
    "latitude",
    "longitude",
    "geometry",
    "geometry_ref",
    "geometry_source",
    "geometry_precision",
    "source_ids",
    "source_name",
    "source_url",
    "source_record_id",
    "source_type",
    "source_date_field",
    "source_date_value",
    "publisher",
    "license",
    "license_url",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "duplicate_check_terms",
    "duplicate_check_note",
    "transformation_method"
  ];
  const overclaimPatterns = [
    /\bpredict(s|ed|ion|ive)?\b/i,
    /\bforecast(s|ed|ing)?\b/i,
    /\bsimulation\b/i,
    /\bcaused?\b/i,
    /\bprove(s|d)?\b/i,
    /\bwill (increase|decrease|reduce|improve|boost|transform|revitalise|deliver|unlock|guarantee)/i,
    /\bimpact score\b/i
  ];

  for (const candidate of CANDIDATES) {
    if (candidateIds.has(candidate.event_id)) errors.push(`Duplicate event_id: ${candidate.event_id}`);
    candidateIds.add(candidate.event_id);

    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.event_id}: missing required field ${field}`);
      }
    }

    if (candidate.city_id !== CITY_ID) errors.push(`${candidate.event_id}: city_id must be ${CITY_ID}`);
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(candidate.date)) errors.push(`${candidate.event_id}: date should be ISO day/month precision`);
    if (candidate.date < DATE_WINDOW.start || candidate.date > DATE_WINDOW.end) {
      errors.push(`${candidate.event_id}: date ${candidate.date} outside ${DATE_WINDOW.start}..${DATE_WINDOW.end}`);
    }
    if (!(candidate.latitude > 54.45 && candidate.latitude < 54.75 && candidate.longitude > -6.1 && candidate.longitude < -5.65)) {
      errors.push(`${candidate.event_id}: coordinates outside broad Belfast bounds`);
    }
    if (!candidate.geometry || candidate.geometry.type !== "Point") errors.push(`${candidate.event_id}: geometry must be a Point`);
    if (candidate.geometry && Array.isArray(candidate.geometry.coordinates)) {
      const [lon, lat] = candidate.geometry.coordinates;
      if (lon !== candidate.longitude || lat !== candidate.latitude) {
        errors.push(`${candidate.event_id}: geometry coordinates do not match longitude/latitude`);
      }
    }
    for (const sourceId of candidate.source_ids || []) {
      if (!sourceIds.has(sourceId)) errors.push(`${candidate.event_id}: unknown source_id ${sourceId}`);
    }
    const checkedText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.duplicate_check_note
    ].join(" ");
    for (const pattern of overclaimPatterns) {
      if (pattern.test(checkedText)) errors.push(`${candidate.event_id}: possible overclaim matched ${pattern}`);
    }
  }

  for (const source of SOURCES.filter((item) => CANDIDATES.some((candidate) => candidate.source_ids.includes(item.source_id)))) {
    const fetchResult = fetchById.get(source.source_id);
    if (!fetchResult || !fetchResult.ok) {
      errors.push(`${source.source_id}: accepted source failed fetch (${fetchResult ? fetchResult.status : "not fetched"})`);
      continue;
    }
    if (/pdf/i.test(source.source_type) && fetchResult.extraction_error) {
      errors.push(`${source.source_id}: PDF extraction failed: ${fetchResult.extraction_error}`);
    }
    for (const marker of source.required_markers || []) {
      if (!fetchResult.text.includes(normalizeText(marker))) {
        errors.push(`${source.source_id}: required marker not found: ${marker}`);
      }
    }
  }

  for (const source of SOURCES.filter((item) => !CANDIDATES.some((candidate) => candidate.source_ids.includes(item.source_id)))) {
    const fetchResult = fetchById.get(source.source_id);
    if (fetchResult && !fetchResult.ok) {
      warnings.push(`${source.source_id}: rejected/audit-only source fetch not OK (${fetchResult.status})`);
    }
  }

  const duplicate_scans = CANDIDATES.map((candidate) => ({
    event_id: candidate.event_id,
    duplicate_check_terms: candidate.duplicate_check_terms,
    duplicate_hits: scanDuplicateTerms(candidate.duplicate_check_terms)
  }));

  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    validation_ok: errors.length === 0,
    candidate_count: CANDIDATES.length,
    source_count: SOURCES.length,
    rejected_count: REJECTED.length,
    errors,
    warnings,
    duplicate_scans,
    source_fetches: fetchResults.map((result) => ({
      source_id: result.source_id,
      ok: result.ok,
      status: result.status,
      content_type: result.content_type,
      byte_length: result.byte_length,
      extraction: result.extraction,
      extraction_error: result.extraction_error,
      text_length: result.text.length
    }))
  };
}

function buildSummary(validation, priorFiles) {
  const dates = CANDIDATES.map((candidate) => candidate.date).sort();
  const sourceNames = [...new Set(CANDIDATES.map((candidate) => candidate.publisher))].sort();
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    candidate_count: CANDIDATES.length,
    rejected_count: REJECTED.length,
    accepted_date_range: { start: dates[0], end: dates[dates.length - 1] },
    requested_window: DATE_WINDOW,
    source_publishers_used: sourceNames,
    source_urls_used: CANDIDATES.map((candidate) => candidate.source_url),
    validation_ok: validation.validation_ok,
    validation_error_count: validation.errors.length,
    validation_warning_count: validation.warnings.length,
    prior_file_count_screened: priorFiles.length,
    duplicate_screen_scope: [
      "data/manual_drops",
      "tmp/subagents through prior Belfast sweep packs including Round390",
      "scripts except this Round402 script"
    ],
    product_guardrails: [
      "official-source-only accepted candidates",
      "no news-only/private source accepted as sole evidence",
      "no prediction, causality, regeneration outcome, completion or approval overclaim unless directly documented",
      "geometry stored as approximate point unless source supplies a measured geometry"
    ],
    caveat: "Candidates are ETL-ready candidate records, not appended manual-corpus records."
  };
}

function buildNotes(summary, validation) {
  const lines = [];
  lines.push(`# ${ROUND_ID}`);
  lines.push("");
  lines.push(`Generated: ${GENERATED_AT}`);
  lines.push(`Accessed: ${ACCESSED_AT}`);
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push("Round402 continued the Belfast official architecture/built-environment sweep after Round390. It used official Department of Education and Belfast Harbour sources and screened against the live manual corpus, prior Belfast sweep packs and scripts.");
  lines.push("");
  lines.push("## Accepted candidates");
  lines.push("");
  for (const candidate of CANDIDATES) {
    lines.push(`- ${candidate.date}: ${candidate.title} (${candidate.source_name})`);
  }
  lines.push("");
  lines.push("## Rejected or held leads");
  lines.push("");
  for (const rejected of REJECTED) {
    lines.push(`- ${rejected.id}: ${rejected.reason_code} - ${rejected.reason}`);
  }
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push(`- validation_ok: ${validation.validation_ok}`);
  lines.push(`- candidates: ${summary.candidate_count}`);
  lines.push(`- rejected: ${summary.rejected_count}`);
  lines.push(`- source fetch warnings: ${validation.warnings.length}`);
  if (validation.errors.length) {
    lines.push("- errors:");
    for (const error of validation.errors) lines.push(`  - ${error}`);
  }
  lines.push("");
  lines.push("## Caveats");
  lines.push("");
  lines.push("- Accepted records document source-stated milestones only: sod-cut, construction-stage progression, next-phase construction, or notice-to-mariners works window.");
  lines.push("- Existing project records such as planning approvals, later openings and duplicate source pages remain separate lifecycle evidence.");
  lines.push("- Approximate points are not building footprints, construction boundaries, exclusion zones or final as-built evidence.");
  return `${lines.join("\n")}\n`;
}

function buildReadback(files, validation) {
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    files: files.map((file) => ({
      path: toPosixRelative(path.join(OUT_DIR, file)),
      sha256: sha256File(path.join(OUT_DIR, file))
    })),
    validation_ok: validation.validation_ok,
    candidate_ids: CANDIDATES.map((candidate) => candidate.event_id),
    rejected_ids: REJECTED.map((rejected) => rejected.id)
  };
}

async function main() {
  ensureDir(OUT_DIR);
  const priorFiles = getPriorFiles();
  const fetchResults = [];
  for (const source of SOURCES) {
    fetchResults.push(await fetchTextSource(source));
  }
  const validation = validateCandidates(fetchResults);
  const sourceAudit = buildSourceAudit(fetchResults);
  const summary = buildSummary(validation, priorFiles);

  writeJson("candidates.json", {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    candidates: CANDIDATES
  });
  writeJson("source_audit.json", {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    sources: sourceAudit
  });
  writeJson("summary.json", summary);
  writeJson("rejected.json", {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    rejected: REJECTED
  });
  writeJson("validation.json", validation);
  writeJson("validation_report.json", {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    validation_ok: validation.validation_ok,
    errors: validation.errors,
    warnings: validation.warnings,
    source_fetches: validation.source_fetches
  });
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), buildNotes(summary, validation), "utf8");

  const filesBeforeReadback = [
    "candidates.json",
    "source_audit.json",
    "summary.json",
    "rejected.json",
    "validation.json",
    "validation_report.json",
    "notes.md"
  ];
  writeJson("readback.json", buildReadback(filesBeforeReadback, validation));

  const result = {
    round_id: ROUND_ID,
    out_dir: toPosixRelative(OUT_DIR),
    candidate_count: CANDIDATES.length,
    rejected_count: REJECTED.length,
    validation_ok: validation.validation_ok,
    errors: validation.errors,
    warnings: validation.warnings
  };
  console.log(JSON.stringify(result, null, 2));
  if (!validation.validation_ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
