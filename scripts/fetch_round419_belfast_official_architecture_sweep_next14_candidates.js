const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROUND_ID = "round419_belfast_official_architecture_sweep_next14";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join("scripts", "fetch_round419_belfast_official_architecture_sweep_next14_candidates.js");
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20",
  note: "Round419 Belfast official architecture/built-environment sweep window."
};

const BELFAST_HARBOUR_TERMS_URL = "https://www.belfast-harbour.co.uk/policies/";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DE_CROWN_COPYRIGHT_URL = "https://www.education-ni.gov.uk/articles/crown-copyright-education";
const DOJ_CROWN_COPYRIGHT_URL = "https://www.justice-ni.gov.uk/articles/crown-copyright";
const DFC_CROWN_COPYRIGHT_URL = "https://www.communities-ni.gov.uk/articles/crown-copyright";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";
const ULSTER_TERMS_URL = "https://www.ulster.ac.uk/terms-and-conditions";

const SEARCH_QUERIES_CHECKED = [
  'site:belfast-harbour.co.uk/news "multi-storey car park" "City Quays" "Belfast Harbour"',
  'site:belfast-harbour.co.uk/news "new cruise terminal" "officially opens" "Belfast Harbour"',
  'site:belfast-harbour.co.uk/news "offshore wind terminal" "completed" "50 acre"',
  'site:qub.ac.uk Belfast "officially opened" "new" "facility"',
  'site:ulster.ac.uk/news Belfast "officially opened" "new" "building"',
  'site:education-ni.gov.uk/news Belfast "officially opened" "new" "school"',
  'site:justice-ni.gov.uk/news Belfast "officially opened" "new" "centre"',
  'live corpus duplicate scan: City Quays car park / ctd1-240 / offshore wind terminal / exact Belfast Harbour URL slugs',
  'live corpus duplicate scan: Deanby / Saint Patrick / Elmgrove / Wellcome-Wolfson / Ulster Belfast campus / InterSim / Allstate Software Studio / Youth Justice Agency / Remote Evidence Centre'
];

const SOURCES = [
  {
    source_id: "belfast-harbour-offshore-wind-terminal-completed-2013-round419",
    source_name: "GBP50m Offshore Wind Terminal Completed",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/ps50m-offshore-wind-terminal-completed-10/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-ps50m-offshore-wind-terminal-completed-10",
    source_date_field: "source body handover date; article:published_time metadata",
    source_date_value: "2013-02-13 handover; 2013-02-15T11:14:00+00:00 published",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    coverage: "Official hand-over/completion record for Belfast Harbour's D1/offshore-wind terminal on the County Down side of the Port.",
    reliability: "High for the source-published completion/handover milestone, terminal scale, quayside description, contractor and location phrase.",
    caveats: "The record is a source-published handover/completion milestone. It is not evidence of later turbine assembly volumes, energy generation, jobs created, port throughput, or economic outcomes.",
    required_markers: [
      "Offshore Wind Terminal Completed",
      "handed over its new",
      "official hand-over",
      "50-acre terminal",
      "County Down side of the Port",
      "Farrans"
    ]
  },
  {
    source_id: "belfast-harbour-city-quays-car-park-opened-2019-round419",
    source_name: "Belfast Harbour Opens New Multi-Storey Car Park in the Heart of City Quays Development",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/belfast-harbour-opens-new-multi-storey-car-park-in-the-heart-of-230/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-city-quays-mscp-230",
    source_date_field: "article:published_time metadata and source body opening wording",
    source_date_value: "2019-01-24T11:33:22+00:00",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    coverage: "Official opening record for a 907-space multi-storey car park in the City Quays development.",
    reliability: "High for source-published opening status, size, design/build team and site description.",
    caveats: "The page documents the car park opening and site description. It is not evidence of occupancy, car usage, modal shift, waterfront outcomes, or future City Quays phases.",
    required_markers: [
      "Belfast Harbour Opens New Multi-Storey Car Park",
      "officially opened a new 907 space car park",
      "City Quays development",
      "RPP Architects",
      "Felix O",
      "between Donegall Quay, Tomb Street and the Cross-Harbour Bridge",
      "starting 2019"
    ]
  },
  {
    source_id: "belfast-harbour-cruise-terminal-opened-2019-round419",
    source_name: "New Cruise Terminal Opens in Belfast Harbour",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/ctd1-240/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-ctd1-240",
    source_date_field: "source body launch/opening date and article:published_time metadata",
    source_date_value: "2019-07-29T07:17:16+00:00",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    coverage: "Official opening record for Belfast Harbour's dedicated cruise terminal and visitor information centre.",
    reliability: "High for source-published opening status, facility components and launch date.",
    caveats: "The page documents a terminal opening. It is not evidence of cruise visitor totals, induced tourism, transport effects, or later operating performance.",
    required_markers: [
      "NEW CRUISE TERMINAL OPENS IN BELFAST HARBOUR",
      "First Dedicated Cruise Facility on Island",
      "opened the first dedicated cruise terminal",
      "Visitor Information Centre",
      "Monday, 29th July",
      "Crown Princess"
    ]
  },
  {
    source_id: "de-deanby-centre-special-school-opening-2024-duplicate-round419",
    source_name: "Education Minister opens new special school in Belfast",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-opens-new-special-school-belfast",
    source_type: "official government news page",
    source_record_id: "education-minister-opens-new-special-school-belfast",
    source_date_field: "Date published",
    source_date_value: "2024-12-12",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Deanby Centre Special School official opening record.",
    reliability: "High, but already represented in the live/manual Belfast corpus.",
    caveats: "Rejected as a duplicate rather than a Round419 candidate.",
    required_markers: ["Deanby Centre Special School", "Date published", "12 December 2024", "officially opened"]
  },
  {
    source_id: "de-saint-patricks-primary-opening-2022-duplicate-round419",
    source_name: "Saint Patrick's Primary School celebrates official opening",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/saint-patricks-primary-school-celebrates-official-opening",
    source_type: "official government news page",
    source_record_id: "saint-patricks-primary-school-celebrates-official-opening",
    source_date_field: "Date published",
    source_date_value: "2022-10-18",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Saint Patrick's Primary School official-opening source.",
    reliability: "High, but already represented in the live/manual Belfast corpus.",
    caveats: "Rejected as duplicate; Round419 did not add another record for the same school opening.",
    required_markers: ["Saint Patrick", "Date published", "18 October 2022", "officially opened"]
  },
  {
    source_id: "de-elmgrove-primary-opening-2025-duplicate-round419",
    source_name: "Education Minister opens new GBP16.5m Elmgrove Primary School",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-opens-new-ps165m-elmgrove-primary-school",
    source_type: "official government news page",
    source_record_id: "education-minister-opens-new-ps165m-elmgrove-primary-school",
    source_date_field: "Date published",
    source_date_value: "2025-12-03",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Elmgrove Primary School official-opening source.",
    reliability: "High for source-published opening, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate; no outcome claims are carried forward.",
    required_markers: ["Elmgrove Primary School", "Date published", "3 December 2025", "officially opened"]
  },
  {
    source_id: "qub-wellcome-wolfson-opening-2015-duplicate-round419",
    source_name: "Queen officially opens new research facility at Queen's",
    publisher: "Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/News/Allnews/Archive/2015-press-releases/QueenofficiallyopensnewresearchfacilityatQueens.html",
    source_type: "official university news page",
    source_record_id: "qub-2015-queenofficiallyopensnewresearchfacilityatqueens",
    source_date_field: "official university archive page / current page metadata",
    source_date_value: "2015-05-28",
    license: "Queen's University Belfast website copyright/terms; citation only",
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Wellcome-Wolfson Institute for Experimental Medicine opening.",
    reliability: "High, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["Wellcome-Wolfson", "Experimental Medicine", "officially opened"]
  },
  {
    source_id: "ulster-belfast-campus-phase-one-opening-2016-duplicate-round419",
    source_name: "Royal opening for Ulster University's Belfast campus development",
    publisher: "Ulster University",
    source_url: "https://www.ulster.ac.uk/news/2016/april/royal-opening-for-ulster-universitys-belfast-campus-development",
    source_type: "official university news page",
    source_record_id: "ulster-news-2016-april-belfast-campus-development",
    source_date_field: "URL archive path and official page text",
    source_date_value: "2016-04",
    license: "Ulster University website terms; citation only",
    license_url: ULSTER_TERMS_URL,
    publisher_terms_url: ULSTER_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Ulster University Belfast campus Phase One opening.",
    reliability: "High for event identity, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate; current CMS date display can differ from archive path, so no new Round419 record was added.",
    required_markers: ["Belfast campus development", "officially opened", "Phase One"]
  },
  {
    source_id: "qub-intersim-centre-launch-2023-duplicate-round419",
    source_name: "State-of-the-art InterSim Centre launched at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/News/Allnews/2023/State-of-the-artInterSimCentrelaunchedatQueensUniversityBelfast.html",
    source_type: "official university news page",
    source_record_id: "qub-2023-intersim-centre-launched",
    source_date_field: "official university news date",
    source_date_value: "2023-05-30",
    license: "Queen's University Belfast website copyright/terms; citation only",
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "KN Cheung SK Chin InterSim Centre launch record.",
    reliability: "High, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["InterSim Centre", "Queen's University Belfast", "launched"]
  },
  {
    source_id: "qub-allstate-software-studio-opening-2023-duplicate-round419",
    source_name: "Allstate Software Studio",
    publisher: "Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/about/Leadership-and-structure/Faculties-and-Schools/Engineering-and-Physical-Sciences/News/AllstateSoftwareStudio.html",
    source_type: "official university news page",
    source_record_id: "qub-allstate-software-studio-2023",
    source_date_field: "official university page text",
    source_date_value: "2023-12-04",
    license: "Queen's University Belfast website copyright/terms; citation only",
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Allstate Software Studio opening at Queen's University Belfast.",
    reliability: "High, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["Allstate Software Studio", "Queen's University Belfast"]
  },
  {
    source_id: "doj-yja-charles-house-opening-2024-duplicate-round419",
    source_name: "Long officially opens new headquarters for Youth Justice Agency",
    publisher: "Department of Justice, Northern Ireland",
    source_url: "https://www.justice-ni.gov.uk/news/long-officially-opens-new-headquarters-youth-justice-agency",
    source_type: "official government news page",
    source_record_id: "long-officially-opens-new-headquarters-youth-justice-agency",
    source_date_field: "Date published",
    source_date_value: "2024-10-29",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DOJ_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "Youth Justice Agency headquarters opening at Charles House, Donegall Street.",
    reliability: "High, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["Youth Justice Agency", "Charles House", "officially opened"]
  },
  {
    source_id: "doj-belfast-remote-evidence-centre-opening-2023-location-withheld-round419",
    source_name: "Official opening of Belfast Remote Evidence Centre",
    publisher: "Department of Justice, Northern Ireland",
    source_url: "https://www.justice-ni.gov.uk/news/official-opening-belfast-remote-evidence-centre",
    source_type: "official government news page",
    source_record_id: "official-opening-belfast-remote-evidence-centre",
    source_date_field: "Date published",
    source_date_value: "2023-09-28",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DOJ_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_insufficient_public_location",
    coverage: "Remote Evidence Centre official opening source.",
    reliability: "High for opening identity, but not accepted because public location is intentionally not disclosed.",
    caveats: "Rejected because the source says the centre's location should not be disclosed, so Round419 cannot provide a public geometry/address reference.",
    required_markers: ["Remote Evidence Centre", "official opening", "location"]
  },
  {
    source_id: "dfc-city-quays-gardens-opening-2025-duplicate-round419",
    source_name: "Major projects - City Quays Gardens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/City-Centre/Major-projects",
    source_type: "official council project page",
    source_record_id: "bcc-major-projects-city-quays-gardens",
    source_date_field: "current project page text",
    source_date_value: "opened in 2025",
    license: "Belfast City Council website terms; citation only",
    license_url: "https://www.belfastcity.gov.uk/terms-and-conditions",
    publisher_terms_url: "https://www.belfastcity.gov.uk/terms-and-conditions",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "City Quays Gardens opening/project page.",
    reliability: "High for source page, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["City Quays Gardens", "opened in 2025", "Corporation Square"]
  },
  {
    source_id: "dfc-st-comgalls-opening-2023-duplicate-round419",
    source_name: "Ministers officially open St Comgall's regeneration project",
    publisher: "Department for Communities, Northern Ireland",
    source_url: "https://www.communities-ni.gov.uk/news/ministers-officially-open-st-comgalls-regeneration-project",
    source_type: "official government news page",
    source_record_id: "ministers-officially-open-st-comgalls-regeneration-project",
    source_date_field: "Date published",
    source_date_value: "2023-04-27",
    license: "Crown copyright / Open Government Licence v3.0 unless otherwise stated",
    license_url: OGL_URL,
    publisher_terms_url: DFC_CROWN_COPYRIGHT_URL,
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    coverage: "St Comgall's regeneration project official opening.",
    reliability: "High, but already represented in live/manual Belfast records.",
    caveats: "Rejected as duplicate.",
    required_markers: ["St Comgall", "officially open", "Date published"]
  }
];

const ACCEPTED = [
  {
    id: "bfs_arch_round419_belfast_harbour_offshore_wind_terminal_handover_2013",
    city_id: CITY_ID,
    title: "Belfast Harbour offshore wind terminal was handed over",
    summary: "Belfast Harbour recorded the hand-over of its new GBP50m offshore wind terminal to DONG Energy and ScottishPower Renewables in February 2013.",
    observed_change: "Official source-published handover/completion of a purpose-built offshore-wind installation and pre-assembly harbour terminal.",
    event_type: "official handover/completion",
    category: "built_environment",
    effective_date: "2013-02-13",
    date_precision: "day",
    source_date_field: "source body handover date; article:published_time metadata",
    source_date_value: "2013-02-13 handover; 2013-02-15T11:14:00+00:00 published",
    geometry: null,
    lat: null,
    lon: null,
    address_ref: "D1/offshore wind terminal area, County Down side of Belfast Harbour; source-stated 50-acre terminal and 480m deep-water quayside.",
    geometry_precision: "source-stated site/address reference only; no official coordinate or footprint extracted in Round419",
    source_name: "GBP50m Offshore Wind Terminal Completed",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/ps50m-offshore-wind-terminal-completed-10/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-ps50m-offshore-wind-terminal-completed-10",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "Records the official handover/completion milestone only. It does not document later turbine assembly, energy generation, employment, port throughput, or other outcomes. Location is retained as a source-stated port-site reference, not a surveyed footprint.",
    transformation_method: `${SCRIPT_PATH}#manualOfficialSourceSweepRound419`,
    duplicate_check_terms: [
      "Offshore Wind Terminal Completed",
      "ps50m-offshore-wind-terminal-completed-10",
      "D1 Offshore Wind Terminal",
      "County Down side of the Port",
      "handed over its new GBP50m offshore wind terminal"
    ],
    duplicate_check_note: "No exact live/manual Belfast event or prior Belfast candidate pack through Round409 was found for the 2013 offshore-wind-terminal handover/completion source."
  },
  {
    id: "bfs_arch_round419_city_quays_multi_storey_car_park_opening_2019",
    city_id: CITY_ID,
    title: "City Quays multi-storey car park opened",
    summary: "Belfast Harbour recorded that it officially opened a 907-space multi-storey car park in the City Quays development in January 2019.",
    observed_change: "Official source-published opening of a custom-built multi-storey car park in the City Quays waterfront development.",
    event_type: "official opening",
    category: "built_environment",
    effective_date: "2019-01-24",
    date_precision: "day",
    source_date_field: "article:published_time metadata and source body opening wording",
    source_date_value: "2019-01-24T11:33:22+00:00",
    geometry: { type: "Point", coordinates: [-5.909308, 54.607748] },
    lat: 54.607748,
    lon: -5.909308,
    address_ref: "Between Donegall Quay, Tomb Street and the Cross-Harbour Bridge, City Quays, Belfast.",
    geometry_precision: "approximate site point reused from live DfI planning-statistics location for the same car-park site; not a measured building footprint",
    source_name: "Belfast Harbour Opens New Multi-Storey Car Park in the Heart of City Quays Development",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/belfast-harbour-opens-new-multi-storey-car-park-in-the-heart-of-230/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-city-quays-mscp-230",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "Records the car-park opening only. It does not document occupancy, parking demand, traffic effects, waterfront regeneration outcomes, or later City Quays phases. The point is an approximate site reference.",
    transformation_method: `${SCRIPT_PATH}#manualOfficialSourceSweepRound419`,
    duplicate_check_terms: [
      "Belfast Harbour Opens New Multi-Storey Car Park",
      "belfast-harbour-opens-new-multi-storey-car-park-in-the-heart-of-230",
      "new 907 space car park",
      "City Quays car park opened",
      "between Donegall Quay, Tomb Street and the Cross-Harbour Bridge"
    ],
    duplicate_check_note: "Live corpus contains a planning-approval milestone for LA04/2016/2656/RM at this site, but no exact opening event or exact Belfast Harbour opening URL was found through Round409."
  },
  {
    id: "bfs_arch_round419_belfast_harbour_cruise_terminal_opening_2019",
    city_id: CITY_ID,
    title: "Belfast Harbour dedicated cruise terminal opened",
    summary: "Belfast Harbour recorded that Cruise Belfast opened the first dedicated cruise terminal on the island of Ireland on 29 July 2019.",
    observed_change: "Official source-published opening of a dedicated cruise terminal and visitor information centre at Belfast Harbour.",
    event_type: "official opening",
    category: "built_environment",
    effective_date: "2019-07-29",
    date_precision: "day",
    source_date_field: "source body launch/opening date and article:published_time metadata",
    source_date_value: "2019-07-29T07:17:16+00:00",
    geometry: null,
    lat: null,
    lon: null,
    address_ref: "Belfast Harbour cruise terminal / quayside facility with visitor information centre; source references the berth and shore-side space for coaches, shuttle buses and taxis.",
    geometry_precision: "source-stated port facility reference only; no official coordinate or footprint extracted in Round419",
    source_name: "New Cruise Terminal Opens in Belfast Harbour",
    publisher: "Belfast Harbour",
    source_url: "https://www.belfast-harbour.co.uk/news/ctd1-240/",
    source_type: "official trust-port news page",
    source_record_id: "belfast-harbour-news-ctd1-240",
    license: "Belfast Harbour website copyright and terms; cited for provenance, not reused as open bulk data",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    limitations: "Records the terminal opening only. It does not document cruise visitor totals, transport changes, tourism outcomes, later terminal use, or future cruise/offshore wind infrastructure. Location is retained as a source-stated port-facility reference.",
    transformation_method: `${SCRIPT_PATH}#manualOfficialSourceSweepRound419`,
    duplicate_check_terms: [
      "NEW CRUISE TERMINAL OPENS IN BELFAST HARBOUR",
      "ctd1-240",
      "first dedicated cruise terminal",
      "Crown Princess",
      "Monday, 29th July"
    ],
    duplicate_check_note: "No exact live/manual Belfast event or prior Belfast candidate pack through Round409 was found for this 2019 dedicated cruise terminal opening."
  }
];

const REJECTED = [
  {
    id: "round419_reject_deanby_centre_duplicate",
    title: "Deanby Centre Special School official opening",
    observed_or_candidate_date: "2024-12-12",
    publisher: "Department of Education, Northern Ireland",
    source_name: "Education Minister opens new special school in Belfast",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-opens-new-special-school-belfast",
    source_type: "official government news page",
    source_record_id: "education-minister-opens-new-special-school-belfast",
    reason: "Rejected as duplicate: live/manual corpus already contains the Deanby Centre Special School opening.",
    duplicate_check_terms: ["Deanby Centre Special School", "education-minister-opens-new-special-school-belfast"]
  },
  {
    id: "round419_reject_saint_patricks_primary_duplicate",
    title: "Saint Patrick's Primary School official opening",
    observed_or_candidate_date: "2022-10-18",
    publisher: "Department of Education, Northern Ireland",
    source_name: "Saint Patrick's Primary School celebrates official opening",
    source_url: "https://www.education-ni.gov.uk/news/saint-patricks-primary-school-celebrates-official-opening",
    source_type: "official government news page",
    source_record_id: "saint-patricks-primary-school-celebrates-official-opening",
    reason: "Rejected as duplicate: live/manual corpus already contains the Saint Patrick's Primary School opening.",
    duplicate_check_terms: ["Saint Patrick's Primary School celebrates official opening", "saint-patricks-primary-school-celebrates-official-opening"]
  },
  {
    id: "round419_reject_elmgrove_primary_duplicate",
    title: "Elmgrove Primary School official opening",
    observed_or_candidate_date: "2025-12-03",
    publisher: "Department of Education, Northern Ireland",
    source_name: "Education Minister opens new GBP16.5m Elmgrove Primary School",
    source_url: "https://www.education-ni.gov.uk/news/education-minister-opens-new-ps165m-elmgrove-primary-school",
    source_type: "official government news page",
    source_record_id: "education-minister-opens-new-ps165m-elmgrove-primary-school",
    reason: "Rejected as duplicate: live/manual corpus already contains the Elmgrove Primary School opening/building milestone.",
    duplicate_check_terms: ["Elmgrove Primary School", "education-minister-opens-new-ps165m-elmgrove-primary-school"]
  },
  {
    id: "round419_reject_qub_wellcome_wolfson_duplicate",
    title: "Wellcome-Wolfson Institute for Experimental Medicine opening",
    observed_or_candidate_date: "2015-05-28",
    publisher: "Queen's University Belfast",
    source_name: "Queen officially opens new research facility at Queen's",
    source_url: "https://www.qub.ac.uk/News/Allnews/Archive/2015-press-releases/QueenofficiallyopensnewresearchfacilityatQueens.html",
    source_type: "official university news page",
    source_record_id: "qub-2015-queenofficiallyopensnewresearchfacilityatqueens",
    reason: "Rejected as duplicate: live/manual corpus already contains the Wellcome-Wolfson Institute opening.",
    duplicate_check_terms: ["Wellcome-Wolfson", "Experimental Medicine", "QueenofficiallyopensnewresearchfacilityatQueens"]
  },
  {
    id: "round419_reject_ulster_belfast_campus_phase_one_duplicate",
    title: "Ulster University Belfast campus Phase One official opening",
    observed_or_candidate_date: "2016-04",
    publisher: "Ulster University",
    source_name: "Royal opening for Ulster University's Belfast campus development",
    source_url: "https://www.ulster.ac.uk/news/2016/april/royal-opening-for-ulster-universitys-belfast-campus-development",
    source_type: "official university news page",
    source_record_id: "ulster-news-2016-april-belfast-campus-development",
    reason: "Rejected as duplicate: live/manual corpus already contains the Phase One opening.",
    duplicate_check_terms: ["Ulster University Belfast campus Phase One", "royal-opening-for-ulster-universitys-belfast-campus-development"]
  },
  {
    id: "round419_reject_qub_intersim_duplicate",
    title: "KN Cheung SK Chin InterSim Centre launch",
    observed_or_candidate_date: "2023-05-30",
    publisher: "Queen's University Belfast",
    source_name: "State-of-the-art InterSim Centre launched at Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/News/Allnews/2023/State-of-the-artInterSimCentrelaunchedatQueensUniversityBelfast.html",
    source_type: "official university news page",
    source_record_id: "qub-2023-intersim-centre-launched",
    reason: "Rejected as duplicate: live/manual corpus already contains both completion/launch InterSim records.",
    duplicate_check_terms: ["InterSim Centre", "State-of-the-artInterSimCentrelaunchedatQueensUniversityBelfast"]
  },
  {
    id: "round419_reject_qub_allstate_software_studio_duplicate",
    title: "Allstate Software Studio opening at Queen's University Belfast",
    observed_or_candidate_date: "2023-12-04",
    publisher: "Queen's University Belfast",
    source_name: "Allstate Software Studio",
    source_url: "https://www.qub.ac.uk/about/Leadership-and-structure/Faculties-and-Schools/Engineering-and-Physical-Sciences/News/AllstateSoftwareStudio.html",
    source_type: "official university news page",
    source_record_id: "qub-allstate-software-studio-2023",
    reason: "Rejected as duplicate: live/manual corpus already contains the Allstate Software Studio opening.",
    duplicate_check_terms: ["Allstate Software Studio", "AllstateSoftwareStudio.html"]
  },
  {
    id: "round419_reject_doj_yja_charles_house_duplicate",
    title: "Youth Justice Agency headquarters opening at Charles House",
    observed_or_candidate_date: "2024-10-29",
    publisher: "Department of Justice, Northern Ireland",
    source_name: "Long officially opens new headquarters for Youth Justice Agency",
    source_url: "https://www.justice-ni.gov.uk/news/long-officially-opens-new-headquarters-youth-justice-agency",
    source_type: "official government news page",
    source_record_id: "long-officially-opens-new-headquarters-youth-justice-agency",
    reason: "Rejected as duplicate: live/manual corpus already contains the Youth Justice Agency Charles House headquarters opening.",
    duplicate_check_terms: ["Youth Justice Agency", "Charles House", "long-officially-opens-new-headquarters-youth-justice-agency"]
  },
  {
    id: "round419_reject_remote_evidence_centre_location_withheld",
    title: "Belfast Remote Evidence Centre official opening",
    observed_or_candidate_date: "2023-09-28",
    publisher: "Department of Justice, Northern Ireland",
    source_name: "Official opening of Belfast Remote Evidence Centre",
    source_url: "https://www.justice-ni.gov.uk/news/official-opening-belfast-remote-evidence-centre",
    source_type: "official government news page",
    source_record_id: "official-opening-belfast-remote-evidence-centre",
    reason: "Rejected because the official source intentionally withholds the public location, so Round419 cannot provide a public geometry/address reference.",
    duplicate_check_terms: ["Remote Evidence Centre", "official-opening-belfast-remote-evidence-centre"]
  },
  {
    id: "round419_reject_city_quays_gardens_duplicate",
    title: "City Quays Gardens opening",
    observed_or_candidate_date: "2025",
    publisher: "Belfast City Council",
    source_name: "Major projects - City Quays Gardens",
    source_url: "https://www.belfastcity.gov.uk/City-Centre/Major-projects",
    source_type: "official council project page",
    source_record_id: "bcc-major-projects-city-quays-gardens",
    reason: "Rejected as duplicate: live/manual corpus already contains City Quays Gardens milestones.",
    duplicate_check_terms: ["City Quays Gardens", "opened in 2025"]
  },
  {
    id: "round419_reject_st_comgalls_duplicate",
    title: "St Comgall's regeneration project official opening",
    observed_or_candidate_date: "2023-04-27",
    publisher: "Department for Communities, Northern Ireland",
    source_name: "Ministers officially open St Comgall's regeneration project",
    source_url: "https://www.communities-ni.gov.uk/news/ministers-officially-open-st-comgalls-regeneration-project",
    source_type: "official government news page",
    source_record_id: "ministers-officially-open-st-comgalls-regeneration-project",
    reason: "Rejected as duplicate: live/manual corpus already contains the St Comgall's official-opening event.",
    duplicate_check_terms: ["St Comgall", "ministers-officially-open-st-comgalls-regeneration-project"]
  }
];

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function stableStringify(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function writeJson(name, value) {
  const target = path.join(OUT_DIR, name);
  fs.writeFileSync(target, stableStringify(value), "utf8");
}

function writeText(name, value) {
  const target = path.join(OUT_DIR, name);
  fs.writeFileSync(target, value.endsWith("\n") ? value : value + "\n", "utf8");
}

function normalizeText(text) {
  return String(text)
    .replace(/&pound;/g, "GBP")
    .replace(/&#163;/g, "GBP")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;|&#8217;|&#x2019;/g, "'")
    .replace(/&lsquo;|&#8216;|&#x2018;/g, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;|&#x201C;|&#x201D;/g, '"')
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      redirect: "follow",
      headers: {
        "user-agent": "Bims-5 Round419 provenance audit (official source fetch)"
      },
      signal: controller.signal
    });
    const text = await response.text();
    const normalized = normalizeText(text);
    const markerResults = (source.required_markers || []).map((marker) => ({
      marker,
      present: normalized.includes(normalizeText(marker))
    }));
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      final_url: response.url,
      ok: response.ok,
      status: response.status,
      status_text: response.statusText,
      content_type: response.headers.get("content-type"),
      byte_length: Buffer.byteLength(text, "utf8"),
      fetched_at: ACCESSED_AT,
      text_sha256: sha256Text(text),
      marker_ok: markerResults.every((item) => item.present),
      marker_results: markerResults
    };
  } catch (error) {
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      ok: false,
      status: null,
      status_text: error.name || "FetchError",
      content_type: null,
      byte_length: 0,
      fetched_at: ACCESSED_AT,
      text_sha256: null,
      marker_ok: false,
      marker_results: (source.required_markers || []).map((marker) => ({ marker, present: false })),
      error: String(error.message || error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function listDuplicateScanFiles() {
  const files = [];
  const manual = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
  if (fs.existsSync(manual)) files.push(manual);

  const atlasDir = path.join("web", "data", "city-atlas", "cities", "belfast");
  if (fs.existsSync(atlasDir)) {
    for (const file of fs.readdirSync(atlasDir)) {
      if (/^events_\d{4}\.json$/.test(file)) files.push(path.join(atlasDir, file));
    }
  }

  const tmpDir = path.join("tmp", "subagents");
  if (fs.existsSync(tmpDir)) {
    for (const entry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
      const fullPath = path.join(tmpDir, entry.name);
      if (entry.isDirectory()) {
        if (!/belfast/i.test(entry.name) || entry.name === ROUND_ID) continue;
        for (const fileName of ["candidates.json", "rejected.json", "rejections.json", "summary.json"]) {
          const candidateFile = path.join(fullPath, fileName);
          if (fs.existsSync(candidateFile)) files.push(candidateFile);
        }
      } else if (entry.isFile() && /belfast.*\.json$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function extractItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.events)) return raw.events;
  if (Array.isArray(raw.candidates)) return raw.candidates;
  if (Array.isArray(raw.rejected)) return raw.rejected;
  if (Array.isArray(raw.rejections)) return raw.rejections;
  if (Array.isArray(raw.records)) return raw.records;
  return [];
}

function duplicateScan(id, terms) {
  const files = listDuplicateScanFiles();
  const duplicateHits = terms.map((term) => ({ term, hit_count: 0, hits: [], truncated: false }));
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    const items = extractItems(parsed);
    for (const item of items) {
      const city = String(item.city_id || item.city || "").toLowerCase();
      if (city && city !== CITY_ID) continue;
      const text = JSON.stringify(item).toLowerCase();
      for (const bucket of duplicateHits) {
        if (!text.includes(bucket.term.toLowerCase())) continue;
        bucket.hit_count += 1;
        if (bucket.hits.length < 12) {
          bucket.hits.push({
            file,
            id: item.id || item.event_id || item.source_record_id || item.source_id || null,
            title: item.title || item.lead_title || item.source_name || null,
            date: item.effective_date || item.date || item.observed_or_candidate_date || item.source_date_value || null,
            url: item.source_url || item.access_url || (item.provenance && item.provenance.source_url) || null
          });
        } else {
          bucket.truncated = true;
        }
      }
    }
  }
  return { id, duplicate_check_terms: terms, duplicate_hits: duplicateHits };
}

function dateForCompare(dateValue) {
  const value = String(dateValue || "");
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value.slice(0, 10);
}

function inWindow(dateValue) {
  const date = dateForCompare(dateValue);
  return date >= DATE_WINDOW.start && date <= DATE_WINDOW.end;
}

function hasBelfastCoordinate(candidate) {
  if (!candidate.geometry) return true;
  const coords = candidate.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lon, lat] = coords;
  return lon >= -6.2 && lon <= -5.65 && lat >= 54.45 && lat <= 54.75;
}

function validate(candidates, rejected, sourceFetchChecks, duplicateScans, rejectedDuplicateScans) {
  const errors = [];
  const warnings = [];
  const requiredFields = [
    "id",
    "city_id",
    "title",
    "effective_date",
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

  const ids = new Set();
  const titleDateKeys = new Set();
  const sourceRecordKeys = new Set();

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.id || "candidate"} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) errors.push(`${candidate.id} has city_id ${candidate.city_id}`);
    if (ids.has(candidate.id)) errors.push(`duplicate candidate id ${candidate.id}`);
    ids.add(candidate.id);
    const titleDate = `${candidate.title}|${candidate.effective_date}`;
    if (titleDateKeys.has(titleDate)) errors.push(`duplicate title/date key ${titleDate}`);
    titleDateKeys.add(titleDate);
    const sourceRecord = `${candidate.publisher}|${candidate.source_record_id}`;
    if (sourceRecordKeys.has(sourceRecord)) errors.push(`duplicate source record key ${sourceRecord}`);
    sourceRecordKeys.add(sourceRecord);
    if (!inWindow(candidate.effective_date)) errors.push(`${candidate.id} effective_date outside date window`);
    if (!candidate.geometry && !candidate.address_ref) errors.push(`${candidate.id} needs geometry or address_ref`);
    if (!hasBelfastCoordinate(candidate)) errors.push(`${candidate.id} has coordinates outside Belfast sanity bounds`);
  }

  const acceptedSourceIds = new Set(candidates.map((candidate) => {
    const source = SOURCES.find((item) => item.source_url === candidate.source_url);
    return source && source.source_id;
  }).filter(Boolean));
  for (const fetchCheck of sourceFetchChecks.filter((check) => acceptedSourceIds.has(check.source_id))) {
    if (!fetchCheck.ok) errors.push(`${fetchCheck.source_id} source fetch failed`);
    if (!fetchCheck.marker_ok) errors.push(`${fetchCheck.source_id} marker validation failed`);
  }

  const forbidden = /\b(predicts?|forecast|simulate|simulation|caused|causal|impact score|proves?)\b/i;
  for (const candidate of candidates) {
    const text = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.duplicate_check_note
    ].join(" ");
    if (forbidden.test(text)) errors.push(`${candidate.id} contains overclaiming/simulation language`);
  }

  if (duplicateScans.length !== candidates.length) errors.push("missing accepted duplicate scans");
  if (rejectedDuplicateScans.length !== rejected.length) errors.push("missing rejected duplicate scans");

  const contextualHitCount = duplicateScans.reduce(
    (sum, scan) => sum + scan.duplicate_hits.reduce((inner, hit) => inner + hit.hit_count, 0),
    0
  );
  if (contextualHitCount > 0) {
    warnings.push("Accepted duplicate scans include contextual hits; candidate duplicate_check_note fields distinguish planning/context records from opening/handover records.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_provenance: true,
      unique_candidate_ids: true,
      unique_source_record_keys: true,
      unique_title_date_keys: true,
      date_window: `${DATE_WINDOW.start}..${DATE_WINDOW.end}`,
      belfast_coordinate_or_address_ref: true,
      source_fetch_and_markers_for_accepted: true,
      overclaim_scan: true,
      duplicate_scans_recorded: true
    }
  };
}

function buildNotes(summary, validation) {
  const acceptedLines = ACCEPTED.map((candidate) => {
    return `- ${candidate.id}: ${candidate.title} (${candidate.effective_date}) from ${candidate.publisher}`;
  }).join("\n");
  const rejectedLines = REJECTED.map((lead) => {
    return `- ${lead.id}: ${lead.title} - ${lead.reason}`;
  }).join("\n");
  return [
    `# ${ROUND_ID}`,
    "",
    "Round419 continued the Belfast official-source architecture/built-environment sweep after Round409.",
    "The pack keeps only source-backed observed milestones and excludes prediction, causation, simulation, and outcome claims.",
    "",
    "## Method",
    "",
    "- Queried official/public sources only: Belfast Harbour, Belfast City Council, Department of Education, Department for Communities, Department of Justice, Queen's University Belfast and Ulster University.",
    "- Fetched all audited source URLs live on 2026-05-20 and checked required markers on accepted pages.",
    "- Screened candidates against the live manual corpus, generated Belfast atlas event JSON files, and prior Belfast tmp packs through Round409.",
    "- Used conservative date and location precision where official pages gave a source-stated site reference rather than a coordinate.",
    "",
    "## Accepted",
    "",
    acceptedLines,
    "",
    "## Rejected",
    "",
    rejectedLines,
    "",
    "## Validation",
    "",
    `- ok: ${validation.ok}`,
    `- accepted_count: ${summary.accepted_count}`,
    `- rejected_count: ${summary.rejected_count}`,
    `- accepted_date_range: ${summary.accepted_date_range.start} to ${summary.accepted_date_range.end}`,
    `- warnings: ${validation.warnings.length ? validation.warnings.join("; ") : "none"}`,
    `- errors: ${validation.errors.length ? validation.errors.join("; ") : "none"}`
  ].join("\n") + "\n";
}

function readbackFiles(fileNames) {
  return fileNames.map((fileName) => {
    const filePath = path.join(OUT_DIR, fileName);
    const text = fs.readFileSync(filePath, "utf8");
    let parsed = null;
    let parse_ok = true;
    if (fileName.endsWith(".json")) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parse_ok = false;
      }
    }
    return {
      file: filePath,
      bytes: Buffer.byteLength(text, "utf8"),
      sha256: sha256Text(text),
      parse_ok,
      schema_version: parsed && parsed.schema_version ? parsed.schema_version : null,
      count: parsed && Array.isArray(parsed.candidates)
        ? parsed.candidates.length
        : parsed && Array.isArray(parsed.rejected)
          ? parsed.rejected.length
          : parsed && Array.isArray(parsed.sources)
            ? parsed.sources.length
            : null
    };
  });
}

async function main() {
  ensureOutDir();

  const sourceFetchChecks = [];
  for (const source of SOURCES) {
    sourceFetchChecks.push(await fetchSource(source));
  }

  const fetchBySourceId = new Map(sourceFetchChecks.map((check) => [check.source_id, check]));
  const sourceAudit = {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    sources: SOURCES.map((source) => ({
      ...source,
      fetch_check: fetchBySourceId.get(source.source_id) || null
    }))
  };

  const duplicateScans = ACCEPTED.map((candidate) => duplicateScan(candidate.id, candidate.duplicate_check_terms));
  const rejectedDuplicateScans = REJECTED.map((lead) => duplicateScan(lead.id, lead.duplicate_check_terms));

  const rejectedWithAudit = REJECTED.map((lead) => {
    const source = SOURCES.find((item) => item.source_url === lead.source_url);
    const scan = rejectedDuplicateScans.find((item) => item.id === lead.id);
    return {
      ...lead,
      city_id: CITY_ID,
      accessed_at: ACCESSED_AT,
      confidence: "not_accepted",
      source_fetch_check: source ? fetchBySourceId.get(source.source_id) || null : null,
      duplicate_scan: scan || null,
      screened_against: "live manual corpus, generated Belfast atlas event JSON, and prior Belfast tmp packs through Round409"
    };
  });

  const candidatesPayload = {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    candidates: ACCEPTED.map((candidate) => ({
      ...candidate,
      source_fetch_check: fetchBySourceId.get(SOURCES.find((source) => source.source_url === candidate.source_url).source_id),
      duplicate_scan: duplicateScans.find((scan) => scan.id === candidate.id)
    }))
  };

  const acceptedDates = ACCEPTED.map((candidate) => dateForCompare(candidate.effective_date)).sort();
  const summary = {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    accepted_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    source_audit_count: SOURCES.length,
    accepted_date_range: {
      start: acceptedDates[0] || null,
      end: acceptedDates[acceptedDates.length - 1] || null
    },
    date_window: DATE_WINDOW,
    accepted_official_sources: ACCEPTED.map((candidate) => ({
      source_name: candidate.source_name,
      publisher: candidate.publisher,
      source_url: candidate.source_url,
      source_record_id: candidate.source_record_id,
      source_date_value: candidate.source_date_value
    })),
    accepted_source_mix: ACCEPTED.reduce((memo, candidate) => {
      memo[candidate.publisher] = (memo[candidate.publisher] || 0) + 1;
      return memo;
    }, {}),
    audited_source_mix: SOURCES.reduce((memo, source) => {
      memo[source.publisher] = (memo[source.publisher] || 0) + 1;
      return memo;
    }, {}),
    retrieval: {
      ok: sourceFetchChecks.filter((check) => check.ok).length,
      failed: sourceFetchChecks.filter((check) => !check.ok).length,
      marker_ok: sourceFetchChecks.filter((check) => check.marker_ok).length,
      marker_failed: sourceFetchChecks.filter((check) => !check.marker_ok).length
    },
    notes: "Round419 keeps a small high-confidence official Belfast Harbour pack and rejects official leads that duplicate live/prior Belfast records or lack public location specificity."
  };

  const validationResult = validate(ACCEPTED, REJECTED, sourceFetchChecks, duplicateScans, rejectedDuplicateScans);
  const validation = {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    source_fetch_checks: sourceFetchChecks,
    duplicate_scans: duplicateScans,
    rejected_duplicate_scans: rejectedDuplicateScans,
    validation: validationResult
  };
  summary.validation = {
    ok: validationResult.ok,
    errors: validationResult.errors,
    warnings: validationResult.warnings
  };

  const validationReport = {
    schema_version: `${ROUND_ID}.validation_report.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    ok: validationResult.ok,
    candidate_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    accepted_ids: ACCEPTED.map((candidate) => candidate.id),
    rejected_ids: REJECTED.map((lead) => lead.id),
    checks: validationResult.checked,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    source_fetch_summary: summary.retrieval,
    duplicate_scan_summary: {
      accepted_scans: duplicateScans.length,
      rejected_scans: rejectedDuplicateScans.length
    }
  };

  writeJson("candidates.json", candidatesPayload);
  writeJson("source_audit.json", sourceAudit);
  writeJson("summary.json", summary);
  writeJson("rejected.json", {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    rejected: rejectedWithAudit
  });
  writeJson("validation.json", validation);
  writeJson("validation_report.json", validationReport);
  writeText("notes.md", buildNotes(summary, validationResult));

  const outputFiles = [
    "candidates.json",
    "source_audit.json",
    "summary.json",
    "rejected.json",
    "validation.json",
    "validation_report.json",
    "notes.md"
  ];
  const readback = {
    schema_version: `${ROUND_ID}.readback.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    ok: true,
    output_files: readbackFiles(outputFiles),
    parsed_counts: {
      candidates: candidatesPayload.candidates.length,
      rejected: rejectedWithAudit.length,
      source_audit_sources: sourceAudit.sources.length,
      validation_ok: validationResult.ok
    }
  };
  writeJson("readback.json", readback);

  const finalReadback = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "readback.json"), "utf8"));
  const allJsonReadbackOk = finalReadback.output_files.every((file) => file.parse_ok);
  if (!validationResult.ok || !allJsonReadbackOk) {
    process.exitCode = 1;
  }
  console.log(JSON.stringify({
    round_id: ROUND_ID,
    out_dir: OUT_DIR,
    accepted_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    validation_ok: validationResult.ok,
    json_readback_ok: allJsonReadbackOk,
    source_fetch_ok: summary.retrieval.ok,
    source_fetch_failed: summary.retrieval.failed
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
