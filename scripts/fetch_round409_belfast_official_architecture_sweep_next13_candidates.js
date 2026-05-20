const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROUND_ID = "round409_belfast_official_architecture_sweep_next13";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join("scripts", "fetch_round409_belfast_official_architecture_sweep_next13_candidates.js");
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20",
  note: "Round409 Belfast official architecture/built-environment sweep window."
};

const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DE_CROWN_COPYRIGHT_URL = "https://www.education-ni.gov.uk/articles/crown-copyright-education";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-and-conditions";
const DFC_CROWN_COPYRIGHT_URL = "https://www.communities-ni.gov.uk/articles/crown-copyright";

const SEARCH_QUERIES_CHECKED = [
  'site:education-ni.gov.uk/news Belfast "officially opened" "new" "school"',
  'site:education-ni.gov.uk/news Belfast "work begins" "project" "school"',
  'site:education-ni.gov.uk/news Belfast "School Enhancement Programme" "proceed to construction"',
  'site:belfastcity.gov.uk/news "Restoration work has begun" "Belfast" "building"',
  'site:belfastcity.gov.uk/news "officially opened" "Belfast" "new" "building"',
  'site:communities-ni.gov.uk/news Belfast "construction" "public realm" "Shankill Gateway"',
  'site:belfastcity.gov.uk "City Quays Gardens" "opened in 2025"',
  'site:education-ni.gov.uk/news "St Patrick" "North Belfast" "works begin"',
  'live corpus rg: St Patrick Primary Pim Street / LA04/2016/2196/F',
  'live corpus rg: McArthur Hall official URL still returns 404 under direct fetch',
  'live corpus rg: Belfast Royal Academy + Felix OHare / new two-storey building',
  'live corpus rg: Strand Arts Centre / Belvoir Sure Start / Victoria College / Shankill Gateway / City Quays Gardens'
];

const SOURCES = [
  {
    source_id: "de-st-patricks-primary-north-belfast-works-begin-2020-round409",
    source_name: "GBP11.4 million works begin on St Patrick's Primary School, North Belfast",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/ps114-million-works-begin-st-patricks-primary-school-north-belfast",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2020-01-23",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    coverage: "Department of Education first-sod/construction-start milestone for St Patrick's Primary School, North Belfast.",
    reliability: "High for the source-published first-sod, construction-start, new-school-build scope, outdoor play/parking scope and contractor note.",
    caveats: "The source includes ministerial outcome language and a planned completion note. This pack records only the source-published construction-start milestone and does not treat the projected completion date as observed completion.",
    required_markers: [
      "GBP11.4 million works begin on St Patrick's Primary School, North Belfast",
      "Date published",
      "23 January 2020",
      "first sod has been cut",
      "start of construction work",
      "new school building",
      "Woodvale Construction Ltd"
    ]
  },
  {
    source_id: "de-belfast-royal-academy-sep-site-contract-2015-round409",
    source_name: "O'Dowd visits the site of GBP4.2million project at Belfast Royal Academy",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-visits-site-ps42million-project-belfast-royal-academy",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2015-06-25",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    coverage: "Department of Education School Enhancement Programme site/contract milestone for Belfast Royal Academy.",
    reliability: "High for the source-published site visit, project scope, approval-to-proceed wording and construction-contract award.",
    caveats: "The source documents a site/contract-stage milestone, not a completion/opening or measured construction-start date. Candidate language must not import ministerial outcome claims.",
    required_markers: [
      "Belfast Royal Academy",
      "Date published",
      "25 June 2015",
      "new two-storey building",
      "construction contract has been awarded",
      "Felix O'Hare",
      "approval has been given to proceed"
    ]
  },
  {
    source_id: "de-methodist-college-mcarthur-hall-work-start-2016-round409",
    source_name: "Work begins on GBP4million project at Methodist College",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/work-begins-ps4million-project-methodist-college",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2016-12-15",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_unavailable",
    coverage: "Department of Education capital-project works-start lead for McArthur Hall at Methodist College, Belfast.",
    reliability: "Not accepted in Round409 because the direct live fetch returned HTTP 404.",
    caveats: "Search snippets still expose older page text, but snippets are not accepted as source evidence. Round409 records this as an inaccessible official lead rather than a candidate.",
    required_markers: [
      "Work begins on GBP4million project at Methodist College",
      "Date published",
      "15 December 2016",
      "Methodist College",
      "work has started",
      "McArthur Hall",
      "Woodvale Construction Company Ltd"
    ]
  },
  {
    source_id: "bcc-strand-arts-restoration-start-2025-duplicate-round409",
    source_name: "Work underway to redevelop Strand Arts Centre in its 90th anniversary year",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Work-underway-to-redevelop-Strand-Arts-Centre-in-i",
    source_type: "official council news page",
    source_date_field: "Date",
    source_date_value: "2025-01-14",
    license: "Belfast City Council website terms; official page cited for provenance audit, not reused as open bulk data",
    license_url: BCC_TERMS_URL,
    publisher_terms_url: BCC_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_unavailable_duplicate",
    coverage: "Belfast City Council restoration-start page for Strand Arts Centre, Holywood Road.",
    reliability: "Not accepted in Round409 because the URL redirects to the council news index and live markers for the project page are absent.",
    caveats: "Rejected because the current URL is not a usable project-specific source and because Strand Arts Centre restoration-start/progress rows were already screened in prior Belfast packs and are visible in the live generated corpus.",
    required_markers: [
      "Work underway to redevelop Strand Arts Centre",
      "Date: 14 January 2025",
      "Restoration work has begun",
      "Strand Arts Centre",
      "GBP6.5 million"
    ]
  },
  {
    source_id: "de-belvoir-sure-start-opening-2015-duplicate-round409",
    source_name: "O'Dowd opens new GBP360,000 Sure Start Centre at Belvoir",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-opens-new-ps360000-sure-start-centre-belvoir",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2015-11-11",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Department of Education official-opening source for the Belvoir Sure Start Centre.",
    reliability: "High for the source-published opening date and refurbished-building description.",
    caveats: "Rejected because this exact event is already present in earlier Belfast candidate packs and the live generated corpus.",
    required_markers: [
      "Sure Start Centre at Belvoir",
      "Date published",
      "11 November 2015",
      "officially opened",
      "newly refurbished multipurpose building"
    ]
  },
  {
    source_id: "de-victoria-college-sep-proceed-2015-rejected-round409",
    source_name: "GBP14million to progress six more School Enhancement Projects",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/ps14million-progress-six-more-school-enhancement-projects",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2015-09-23",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_insufficient_specificity",
    coverage: "Department of Education aggregate SEP proceed-to-construction announcement including Victoria College, Belfast.",
    reliability: "High for the list-stage programme announcement, but weak for a standalone Belfast built-environment candidate because the page does not give project scope, address or geometry for Victoria College.",
    caveats: "Rejected pending a Victoria College project-specific official source that gives scope and location without relying on a broad programme list.",
    required_markers: [
      "Date published",
      "23 September 2015",
      "proceed to construction",
      "Victoria College, Belfast",
      "six schools"
    ]
  },
  {
    source_id: "dfc-shankill-gateway-public-realm-start-2026-duplicate-round409",
    source_name: "Lyons announces start of construction on the Shankill Gateway Public Realm scheme",
    publisher: "Department for Communities, Northern Ireland",
    source_url: "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    source_type: "official government news page",
    source_date_field: "Date published",
    source_date_value: "2026-03-25",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DFC_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Department for Communities public-realm construction-start page for Shankill Gateway.",
    reliability: "High for source-published construction-start and route description.",
    caveats: "Rejected as duplicate because the live corpus/manual corpus and Round235 already represent the Shankill Gateway Phase 1 construction-start event.",
    required_markers: [
      "Shankill Gateway Public Realm scheme",
      "Date published",
      "25 March 2026",
      "commencement of construction",
      "Peter's Hill",
      "Lower Shankill Road"
    ]
  },
  {
    source_id: "bcc-city-quays-gardens-opened-2025-duplicate-round409",
    source_name: "Major projects - City Quays Gardens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/City-Centre/Major-projects",
    source_type: "official council project page",
    source_date_field: "current project page text",
    source_date_value: "2025",
    license: "Belfast City Council website terms; official page cited for provenance audit, not reused as open bulk data",
    license_url: BCC_TERMS_URL,
    publisher_terms_url: BCC_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Belfast City Council current major-projects page noting City Quays Gardens opened in 2025.",
    reliability: "Usable for current-status discovery; weaker than a dated project-specific opening page.",
    caveats: "Rejected because City Quays Gardens is already represented via Belfast Harbour/source registry material and the page is a current summary rather than a dated primary opening record.",
    required_markers: [
      "City Quays Gardens",
      "opened in 2025",
      "two-acre green public space",
      "Corporation Square",
      "River Lagan waterfront"
    ]
  }
];

const CANDIDATES = [
  {
    id: "bfs_arch_round409_st_patricks_primary_north_belfast_works_start_2020",
    event_id: "bfs_arch_round409_st_patricks_primary_north_belfast_works_start_2020",
    city_id: CITY_ID,
    title: "St Patrick's Primary School new-build works started",
    summary: "The Department of Education recorded on 23 January 2020 that the first sod had been cut and construction work had started for a new-build St Patrick's Primary School in North Belfast.",
    observed_change: "An official Department of Education source documents a construction-start milestone for a new school building with outdoor play and parking provision.",
    date: "2020-01-23",
    effective_date: "2020-01-23",
    date_precision: "day",
    event_type: "works_start_recorded",
    milestone_type: "works_start",
    category: "education building / new school build",
    area: "St Patrick's Primary School / Pim Street",
    address_or_location: "St Patrick's Primary School, 9-25 Pim Street, Belfast BT15 2BN",
    geometry: {
      type: "Point",
      coordinates: [-5.922723, 54.612937]
    },
    latitude: 54.612937,
    longitude: -5.922723,
    geometry_precision: "Approximate school-site point, not a surveyed building footprint, planning red-line boundary, post-completion as-built outline or site-works boundary.",
    geometry_ref: "Source CSV Easting/Northing in DfI planning-statistics application LA04/2016/2196/F for St Patricks Primary School 9-25 Pim Street Belfast BT15 2BN; reused from prior official planning-statistics geocode.",
    geometry_source: "Department for Infrastructure Northern Ireland planning activity statistics, application LA04/2016/2196/F, planning-statistics-2018-19-dataset.csv row 627.",
    location_source_name: "Northern Ireland planning activity statistics",
    location_source_publisher: "Department for Infrastructure, Northern Ireland",
    location_source_url: "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics",
    location_source_record_id: "LA04/2016/2196/F; planning-statistics-2018-19-dataset.csv row 627",
    source_ids: ["de-st-patricks-primary-north-belfast-works-begin-2020-round409"],
    source_name: "GBP11.4 million works begin on St Patrick's Primary School, North Belfast",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/ps114-million-works-begin-st-patricks-primary-school-north-belfast",
    source_type: "official government news page",
    source_record_id: "Department of Education news page, Date published 23 January 2020",
    source_date_field: "Date published",
    source_date_value: "2020-01-23",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    duplicate_check_terms: [
      "St Patrick's Primary School North Belfast first sod",
      "GBP11.4 million works begin on St Patrick's Primary School, North Belfast",
      "ps114-million-works-begin-st-patricks-primary-school-north-belfast",
      "start of construction work on a brand new school",
      "LA04/2016/2196/F"
    ],
    duplicate_check_note: "Earlier planning-statistics rounds include the 2018 planning approval for application LA04/2016/2196/F at 9-25 Pim Street. Round409 keeps this as a distinct 2020 Department of Education construction-start/first-sod milestone, not as another planning approval.",
    limitations: "This records only the source-published first-sod/construction-start milestone. It is not evidence of completion, opening, occupation, educational outcomes, public benefit, final as-built condition, exact construction boundary or the projected completion date being met.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, live source marker validation, duplicate screen against manual corpus, live Belfast atlas files and prior Belfast packs through Round402, approximate school-site point reuse from prior official DfI planning-statistics geocode.`
  },
  {
    id: "bfs_arch_round409_belfast_royal_academy_sep_site_contract_2015",
    event_id: "bfs_arch_round409_belfast_royal_academy_sep_site_contract_2015",
    city_id: CITY_ID,
    title: "Belfast Royal Academy improvement project site and contract milestone was recorded",
    summary: "The Department of Education recorded on 25 June 2015 that the minister visited the Belfast Royal Academy improvement-project site and that the construction contract had been awarded.",
    observed_change: "An official Department of Education source documents a School Enhancement Programme site/contract-stage milestone for a new two-storey music and Home Economics block, dining facilities and a rear extension.",
    date: "2015-06-25",
    effective_date: "2015-06-25",
    date_precision: "day",
    event_type: "contract_award_site_visit",
    milestone_type: "site_visit_contract_award",
    category: "education building / school enhancement",
    area: "Belfast Royal Academy / Cliftonville Road",
    address_or_location: "Belfast Royal Academy, Cliftonville Road, Belfast BT14 6JL",
    geometry: {
      type: "Point",
      coordinates: [-5.927077, 54.617081]
    },
    latitude: 54.617081,
    longitude: -5.927077,
    geometry_precision: "Approximate school-site point, not a measured two-storey block footprint, Jackson building extension boundary or planning red line.",
    geometry_ref: "Approximate point reused from existing DfI planning-statistics/manual-corpus record for Belfast Royal Academy, Cliftonville Road.",
    geometry_source: "Prior source-derived planning-statistics point for Belfast Royal Academy, used because the Department of Education news page does not publish a coordinate.",
    source_ids: ["de-belfast-royal-academy-sep-site-contract-2015-round409"],
    source_name: "O'Dowd visits the site of GBP4.2million project at Belfast Royal Academy",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-visits-site-ps42million-project-belfast-royal-academy",
    source_type: "official government news page",
    source_record_id: "Department of Education news page, Date published 25 June 2015",
    source_date_field: "Date published",
    source_date_value: "2015-06-25",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department of Education, Northern Ireland, licensed under the Open Government Licence v3.0 unless otherwise stated.",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    duplicate_check_terms: [
      "O'Dowd visits the site of GBP4.2million project at Belfast Royal Academy",
      "new two-storey building to provide a music and HE block",
      "Felix O'Hare Belfast Royal Academy",
      "approval has been given to proceed with the SEP project"
    ],
    duplicate_check_note: "Existing live/manual records include a separate 2016 sports-hall planning approval at Belfast Royal Academy. No matched 2015 Department of Education site/contract-stage event for the music/Home Economics/dining project was found.",
    limitations: "This records a source-published site visit, approval-to-proceed and contract-award milestone. It is not evidence that construction started on that day, that works were completed, that facilities opened, that outcomes changed, or that the final built form matched the source description.",
    transformation_method: `${SCRIPT_PATH}: manual official-source extraction, live source marker validation, duplicate screen against manual corpus, live Belfast atlas files and prior Belfast packs through Round402, approximate school-site point reuse from prior official geocode.`
  }
];

const REJECTED_LEADS = [
  {
    key: "methodist_college_mcarthur_hall_official_page_unavailable",
    city_id: CITY_ID,
    title: "Methodist College McArthur Hall refurbishment works-start page",
    reason: "The Department of Education page appeared in search results and was already screened by Round402, but the direct live fetch returned HTTP 404 in Round409. Search-result snippets are not accepted as source evidence, so this remains rejected.",
    category: "source_unavailable",
    source_id: "de-methodist-college-mcarthur-hall-work-start-2016-round409",
    source_name: "Work begins on GBP4million project at Methodist College",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/work-begins-ps4million-project-methodist-college",
    source_type: "official government news page",
    source_record_id: "Department of Education news page, Date published 15 December 2016; direct fetch returned 404 on 2026-05-20",
    date_basis: "2016-12-15",
    screened_terms: ["McArthur Hall", "Work begins on GBP4million project at Methodist College", "Methodist College McArthur Hall refurbishment"]
  },
  {
    key: "strand_arts_centre_restoration_start_duplicate",
    city_id: CITY_ID,
    title: "Strand Arts Centre restoration-start page",
    reason: "The Belfast City Council URL redirects to the council news index and project markers were absent under live fetch. The Strand Arts Centre contractor/restoration/progress rows were also already screened in Round376 and are visible in the live Belfast generated corpus.",
    category: "source_unavailable_duplicate",
    source_id: "bcc-strand-arts-restoration-start-2025-duplicate-round409",
    source_name: "Work underway to redevelop Strand Arts Centre in its 90th anniversary year",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Work-underway-to-redevelop-Strand-Arts-Centre-in-i",
    source_type: "official council news page",
    source_record_id: "Belfast City Council news page, Date 14 January 2025",
    date_basis: "2025-01-14",
    screened_terms: ["Strand Arts Centre", "Work underway to redevelop Strand Arts Centre", "Strand Arts Centre contractor-award"]
  },
  {
    key: "belvoir_sure_start_opening_duplicate",
    city_id: CITY_ID,
    title: "Belvoir Sure Start Centre official opening",
    reason: "The Department of Education source is live, but the same Belvoir Sure Start Centre opening is already represented in round80 and in the live Belfast 2015 atlas event files.",
    category: "duplicate_existing_event",
    source_id: "de-belvoir-sure-start-opening-2015-duplicate-round409",
    source_name: "O'Dowd opens new GBP360,000 Sure Start Centre at Belvoir",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-opens-new-ps360000-sure-start-centre-belvoir",
    source_type: "official government news page",
    source_record_id: "Department of Education news page, Date published 11 November 2015",
    date_basis: "2015-11-11",
    screened_terms: ["Belvoir Sure Start Centre officially opened", "Sure Start Centre at Belvoir", "Belvoir Clinic and Library"]
  },
  {
    key: "victoria_college_sep_2015_insufficient_specificity",
    city_id: CITY_ID,
    title: "Victoria College School Enhancement Programme proceed-to-construction listing",
    reason: "The Department of Education aggregate page lists Victoria College, Belfast among six schools proceeding to construction, but it does not provide a Belfast-specific project scope, address or geometry. Prior rounds also screened Victoria College-related HED rows. Kept as a lead rather than a candidate until a project-specific official source is found.",
    category: "insufficient_specificity",
    source_id: "de-victoria-college-sep-proceed-2015-rejected-round409",
    source_name: "GBP14million to progress six more School Enhancement Projects",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/ps14million-progress-six-more-school-enhancement-projects",
    source_type: "official government news page",
    source_record_id: "Department of Education news page, Date published 23 September 2015",
    date_basis: "2015-09-23",
    screened_terms: ["Victoria College, Belfast", "School Enhancement Projects", "proceed to construction"]
  },
  {
    key: "shankill_gateway_public_realm_duplicate",
    city_id: CITY_ID,
    title: "Shankill Gateway public realm construction start",
    reason: "The Department for Communities source is live and high-confidence, but this exact Shankill Gateway Phase 1 construction-start event is already in the manual/live corpus and was rejected as duplicate in Round235.",
    category: "duplicate_existing_event",
    source_id: "dfc-shankill-gateway-public-realm-start-2026-duplicate-round409",
    source_name: "Lyons announces start of construction on the Shankill Gateway Public Realm scheme",
    publisher: "Department for Communities, Northern Ireland",
    source_url: "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    source_type: "official government news page",
    source_record_id: "Department for Communities news page, Date published 25 March 2026",
    date_basis: "2026-03-25",
    screened_terms: ["Shankill Gateway", "Shankill Gateway Public Realm scheme", "construction on the Shankill Gateway"]
  },
  {
    key: "city_quays_gardens_duplicate_or_weak_date",
    city_id: CITY_ID,
    title: "City Quays Gardens 2025 opening status",
    reason: "The Belfast City Council major-projects page states that City Quays Gardens opened in 2025, but City Quays Gardens is already represented through Belfast Harbour/source-registry material and the council page is a current summary rather than a dated primary opening page.",
    category: "duplicate_existing_event",
    source_id: "bcc-city-quays-gardens-opened-2025-duplicate-round409",
    source_name: "Major projects - City Quays Gardens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/City-Centre/Major-projects",
    source_type: "official council project page",
    source_record_id: "Belfast City Council major-projects page, City Quays Gardens section",
    date_basis: "2025",
    screened_terms: ["City Quays Gardens", "Belfast Harbour Begins Work on GBP3m First Phase of City Quays Gardens", "City Quays Gardens opened in 2025"]
  }
];

const EXPECTED_OUTPUTS = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "notes.md",
  "readback.json"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeForMatch(value) {
  return String(value || "")
    .replace(/\u00a3/g, "GBP")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014|\u2011/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/&pound;/gi, "GBP")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Bims-5 Round409 provenance audit"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const rawText = buffer.toString("utf8");
    const normalizedText = normalizeForMatch(rawText);
    const marker_results = source.required_markers.map((marker) => {
      const normalizedMarker = normalizeForMatch(marker);
      return {
        marker,
        present: normalizedText.toLowerCase().includes(normalizedMarker.toLowerCase())
      };
    });
    const marker_ok = marker_results.every((item) => item.present);
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      final_url: response.url,
      ok: response.ok,
      status: response.status,
      status_text: response.statusText,
      content_type: response.headers.get("content-type"),
      byte_length: buffer.length,
      fetched_at: ACCESSED_AT,
      text_sha256: sha256(normalizedText),
      marker_ok,
      marker_results
    };
  } catch (error) {
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      ok: false,
      status: null,
      status_text: null,
      content_type: null,
      byte_length: 0,
      fetched_at: ACCESSED_AT,
      marker_ok: false,
      marker_results: source.required_markers.map((marker) => ({ marker, present: false })),
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function runRgFiles(term) {
  const paths = [
    "data/manual_drops",
    "tmp/subagents",
    "web/data/city-atlas/cities/belfast",
    "scripts",
    "config/source_registry.json"
  ];
  const args = [
    "-l",
    "-i",
    "--fixed-strings",
    "--glob",
    "!web/data/city-atlas/cities/belfast/lens_detail_*.geojson",
    "--glob",
    "!web/data/city-atlas/cities/belfast/detail_layers.geojson",
    term,
    ...paths
  ];
  const result = spawnSync("rg", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const files = (result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => !file.includes(ROUND_ID))
    .filter((file) => path.normalize(file) !== path.normalize(SCRIPT_PATH));
  return {
    term,
    hit_count: files.length,
    files: files.slice(0, 20),
    truncated: files.length > 20,
    rg_status: result.status
  };
}

function buildDuplicateScans(records) {
  return records.map((record) => ({
    id: record.event_id || record.key,
    duplicate_check_terms: record.duplicate_check_terms || record.screened_terms || [],
    duplicate_hits: (record.duplicate_check_terms || record.screened_terms || []).map(runRgFiles)
  }));
}

function validateCandidates(candidates, sourcesById, fetchById, duplicateScans) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  const required = [
    "id",
    "event_id",
    "city_id",
    "title",
    "effective_date",
    "latitude",
    "longitude",
    "geometry",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method"
  ];
  const overclaimPatterns = [
    /\bpredict/i,
    /\bforecast/i,
    /\bsimulation/i,
    /\bcaused?\b/i,
    /\bimpact score\b/i,
    /\bwill (increase|decrease|improve|boost|transform|deliver|unlock|lead to|result in)\b/i
  ];

  for (const candidate of candidates) {
    for (const field of required) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.event_id || "candidate"} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.event_id} city_id must be ${CITY_ID}`);
    }
    if (ids.has(candidate.event_id)) {
      errors.push(`Duplicate event_id ${candidate.event_id}`);
    }
    ids.add(candidate.event_id);
    if (candidate.id !== candidate.event_id) {
      errors.push(`${candidate.event_id} id must match event_id for stable candidate identity`);
    }
    if (candidate.effective_date < DATE_WINDOW.start || candidate.effective_date > DATE_WINDOW.end) {
      errors.push(`${candidate.event_id} effective_date outside window ${DATE_WINDOW.start}..${DATE_WINDOW.end}`);
    }
    if (!(candidate.latitude > 54.45 && candidate.latitude < 54.75 && candidate.longitude > -6.15 && candidate.longitude < -5.7)) {
      errors.push(`${candidate.event_id} coordinate outside broad Belfast sanity envelope`);
    }
    if (!candidate.geometry || candidate.geometry.type !== "Point" || !Array.isArray(candidate.geometry.coordinates)) {
      errors.push(`${candidate.event_id} geometry must be a GeoJSON Point`);
    } else if (candidate.geometry.coordinates[0] !== candidate.longitude || candidate.geometry.coordinates[1] !== candidate.latitude) {
      errors.push(`${candidate.event_id} geometry coordinates do not match longitude/latitude`);
    }
    const sourceId = candidate.source_ids && candidate.source_ids[0];
    const source = sourcesById.get(sourceId);
    if (!source) {
      errors.push(`${candidate.event_id} source_id ${sourceId} not present in source audit`);
    } else {
      const fetchCheck = fetchById.get(sourceId);
      if (!fetchCheck || !fetchCheck.ok || !fetchCheck.marker_ok) {
        errors.push(`${candidate.event_id} accepted source ${sourceId} failed live fetch or marker validation`);
      }
      const sourceDateKey = `${source.source_url}|${candidate.effective_date}`;
      if (sourceDateKeys.has(sourceDateKey)) {
        errors.push(`${candidate.event_id} duplicates another candidate source/date key`);
      }
      sourceDateKeys.add(sourceDateKey);
    }
    const titleDateKey = `${candidate.title.toLowerCase()}|${candidate.effective_date}`;
    if (titleDateKeys.has(titleDateKey)) {
      errors.push(`${candidate.event_id} duplicates another candidate title/date key`);
    }
    titleDateKeys.add(titleDateKey);

    const candidateText = JSON.stringify({
      title: candidate.title,
      summary: candidate.summary,
      observed_change: candidate.observed_change,
      limitations: candidate.limitations
    });
    for (const pattern of overclaimPatterns) {
      if (pattern.test(candidateText)) {
        errors.push(`${candidate.event_id} contains overclaim wording matching ${pattern}`);
      }
    }
  }

  const duplicateHitSummary = duplicateScans.flatMap((scan) =>
    scan.duplicate_hits.filter((hit) => hit.hit_count > 0).map((hit) => ({ id: scan.id, term: hit.term, hit_count: hit.hit_count }))
  );
  if (duplicateHitSummary.length) {
    warnings.push("Duplicate scans returned contextual hits; candidate duplicate_check_note fields explain why accepted records are distinct.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_provenance: true,
      unique_candidate_ids: ids.size === candidates.length,
      unique_source_date_keys: sourceDateKeys.size === candidates.length,
      unique_title_date_keys: titleDateKeys.size === candidates.length,
      date_window: `${DATE_WINDOW.start}..${DATE_WINDOW.end}`,
      belfast_coordinate_sanity: true,
      source_fetch_and_markers: true,
      overclaim_scan: true,
      duplicate_scans_recorded: true
    }
  };
}

function buildSourceAudit(fetchById) {
  const audited_sources = SOURCES.map((source) => ({
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_type: source.source_type,
    source_date_field: source.source_date_field,
    source_date_value: source.source_date_value,
    license: source.license,
    license_url: source.license_url,
    publisher_terms_url: source.publisher_terms_url,
    accessed_at: source.accessed_at,
    candidate_disposition: source.candidate_disposition,
    geographic_scope: source.coverage,
    reliability: source.reliability,
    caveats: source.caveats,
    required_markers: source.required_markers,
    fetch_check: fetchById.get(source.source_id)
  }));
  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    audited_source_count: audited_sources.length,
    audited_sources
  };
}

function buildCandidates(duplicateScans) {
  const scansById = new Map(duplicateScans.map((scan) => [scan.id, scan]));
  return {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    candidate_count: CANDIDATES.length,
    accepted_count: CANDIDATES.length,
    candidates: CANDIDATES.map((candidate) => ({
      ...candidate,
      duplicate_scan: scansById.get(candidate.event_id)
    }))
  };
}

function buildRejected(rejectedScans, fetchById) {
  const scansById = new Map(rejectedScans.map((scan) => [scan.id, scan]));
  return {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    rejected_count: REJECTED_LEADS.length,
    rejected: REJECTED_LEADS.map((lead) => ({
      ...lead,
      accessed_at: ACCESSED_AT,
      license: SOURCES.find((source) => source.source_id === lead.source_id)?.license || null,
      license_url: SOURCES.find((source) => source.source_id === lead.source_id)?.license_url || null,
      fetch_check: fetchById.get(lead.source_id),
      duplicate_or_overlap_scan: scansById.get(lead.key)
    }))
  };
}

function acceptedDateRange(candidates) {
  if (!candidates.length) return null;
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildSummary(fetchById, validation) {
  const acceptedSources = SOURCES.filter((source) => source.candidate_disposition === "accepted").map((source) => ({
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_date_value: source.source_date_value
  }));
  const fetchChecks = Array.from(fetchById.values());
  return {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    accepted_count: CANDIDATES.length,
    rejected_count: REJECTED_LEADS.length,
    source_audit_count: SOURCES.length,
    accepted_date_range: acceptedDateRange(CANDIDATES),
    date_window: DATE_WINDOW,
    accepted_official_sources: acceptedSources,
    accepted_source_mix: countBy(acceptedSources, (source) => source.publisher),
    audited_source_mix: countBy(SOURCES, (source) => source.publisher),
    retrieval: {
      ok: fetchChecks.filter((check) => check.ok).length,
      failed: fetchChecks.filter((check) => !check.ok).length,
      marker_ok: fetchChecks.filter((check) => check.marker_ok).length,
      marker_failed: fetchChecks.filter((check) => !check.marker_ok).length
    },
    validation: {
      ok: validation.ok,
      errors: validation.errors,
      warnings: validation.warnings
    },
    notes: "Round409 keeps a small high-confidence accepted pack and rejects official leads that duplicate live/prior Belfast records or lack enough project-specific detail."
  };
}

function buildValidationReport(validation, fetchById, duplicateScans, rejectedScans) {
  return {
    schema_version: `${ROUND_ID}.validation_report.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    ok: validation.ok,
    accepted_ids: CANDIDATES.map((candidate) => candidate.event_id),
    rejected_keys: REJECTED_LEADS.map((lead) => lead.key),
    source_fetch_checks: Array.from(fetchById.values()).map((check) => ({
      source_id: check.source_id,
      ok: check.ok,
      status: check.status,
      marker_ok: check.marker_ok,
      byte_length: check.byte_length
    })),
    duplicate_scan_counts: duplicateScans.concat(rejectedScans).map((scan) => ({
      id: scan.id,
      terms: scan.duplicate_check_terms.length,
      terms_with_hits: scan.duplicate_hits.filter((hit) => hit.hit_count > 0).length
    })),
    validation,
    output_files_expected: EXPECTED_OUTPUTS,
    no_shared_files_edited_by_script: true,
    overclaim_guard: "Candidate language records observed/source-published milestones only and avoids prediction, causation and outcome claims."
  };
}

function buildNotes(validation, summary) {
  const lines = [];
  lines.push(`# ${ROUND_ID}`);
  lines.push("");
  lines.push(`Generated: ${GENERATED_AT}`);
  lines.push(`Accessed at: ${ACCESSED_AT}`);
  lines.push("");
  lines.push("## Accepted candidates");
  for (const candidate of CANDIDATES) {
    lines.push(`- ${candidate.event_id}: ${candidate.title} (${candidate.effective_date})`);
    lines.push(`  Source: ${candidate.publisher} - ${candidate.source_name}`);
    lines.push(`  Limits: ${candidate.limitations}`);
  }
  lines.push("");
  lines.push("## Rejected leads");
  for (const lead of REJECTED_LEADS) {
    lines.push(`- ${lead.key}: ${lead.category} - ${lead.reason}`);
  }
  lines.push("");
  lines.push("## Validation");
  lines.push(`- ok: ${validation.ok}`);
  lines.push(`- errors: ${validation.errors.length}`);
  lines.push(`- warnings: ${validation.warnings.length}`);
  for (const warning of validation.warnings) {
    lines.push(`  - ${warning}`);
  }
  lines.push("");
  lines.push("## Search notes");
  for (const query of SEARCH_QUERIES_CHECKED) {
    lines.push(`- ${query}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- accepted_count: ${summary.accepted_count}`);
  lines.push(`- rejected_count: ${summary.rejected_count}`);
  lines.push(`- accepted_date_range: ${summary.accepted_date_range.start} to ${summary.accepted_date_range.end}`);
  lines.push("- This pack makes no prediction, causation, simulation or outcome claims.");
  lines.push("");
  return lines.join("\n");
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildReadback(files) {
  const output_files = files.map((name) => {
    const filePath = path.join(OUT_DIR, name);
    const stat = fs.statSync(filePath);
    const entry = {
      name,
      path: filePath,
      bytes: stat.size,
      sha256: sha256File(filePath)
    };
    if (name.endsWith(".json")) {
      JSON.parse(fs.readFileSync(filePath, "utf8"));
      entry.json_parse_ok = true;
    }
    return entry;
  });
  return {
    schema_version: `${ROUND_ID}.readback.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    required_output_file_count: EXPECTED_OUTPUTS.length,
    listed_output_file_count: output_files.length,
    output_file_count: output_files.length + 1,
    output_files,
    self_file: {
      name: "readback.json",
      path: path.join(OUT_DIR, "readback.json"),
      included_in_output_file_count: true,
      sha256_excluded_reason: "Self-hashing would change the file content; external validation parses readback.json after generation."
    }
  };
}

async function main() {
  ensureDir(OUT_DIR);

  const fetchChecks = await Promise.all(SOURCES.map(fetchSource));
  const fetchById = new Map(fetchChecks.map((check) => [check.source_id, check]));
  const sourcesById = new Map(SOURCES.map((source) => [source.source_id, source]));
  const candidateDuplicateScans = buildDuplicateScans(CANDIDATES);
  const rejectedDuplicateScans = buildDuplicateScans(REJECTED_LEADS);
  const validation = validateCandidates(CANDIDATES, sourcesById, fetchById, candidateDuplicateScans);
  const sourceAudit = buildSourceAudit(fetchById);
  const candidates = buildCandidates(candidateDuplicateScans);
  const rejected = buildRejected(rejectedDuplicateScans, fetchById);
  const summary = buildSummary(fetchById, validation);
  const validationReport = buildValidationReport(validation, fetchById, candidateDuplicateScans, rejectedDuplicateScans);
  const notes = buildNotes(validation, summary);

  writeJson("candidates.json", candidates);
  writeJson("source_audit.json", sourceAudit);
  writeJson("summary.json", summary);
  writeJson("rejected.json", rejected);
  writeJson("validation.json", {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: CANDIDATES.length,
    rejected_count: REJECTED_LEADS.length,
    source_fetch_checks: fetchChecks,
    duplicate_scans: candidateDuplicateScans,
    rejected_duplicate_scans: rejectedDuplicateScans,
    validation
  });
  writeJson("validation_report.json", validationReport);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), notes, "utf8");

  const readback = buildReadback(EXPECTED_OUTPUTS.filter((name) => name !== "readback.json"));
  writeJson("readback.json", readback);

  const consoleSummary = {
    round_id: ROUND_ID,
    ok: validation.ok,
    accepted_count: CANDIDATES.length,
    rejected_count: REJECTED_LEADS.length,
    accepted_date_range: summary.accepted_date_range,
    source_fetch_ok: fetchChecks.filter((check) => check.ok && check.marker_ok).length,
    output_dir: OUT_DIR
  };
  console.log(JSON.stringify(consoleSummary, null, 2));

  if (!validation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
