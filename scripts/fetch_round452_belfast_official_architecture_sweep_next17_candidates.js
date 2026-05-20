#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round452_belfast_official_architecture_sweep_next17";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round452_belfast_official_architecture_sweep_next17_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9"
};

const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";
const BELFAST_MET_TERMS_URL =
  "https://www.belfastmet.ac.uk/about-us/corporate-information/terms-of-use/";
const BELFAST_TRUST_COPYRIGHT_URL = "https://belfasttrust.hscni.net/copyright/";
const BELFAST_CITY_COUNCIL_TERMS_URL =
  "https://www.belfastcity.gov.uk/terms-conditions";
const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFC_CROWN_COPYRIGHT_URL =
  "https://www.communities-ni.gov.uk/articles/crown-copyright";

const QUB_LICENSE =
  "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained, no page text or media reproduced.";
const BELFAST_MET_LICENSE =
  "Belfast Metropolitan College website copyright/terms; factual citation metadata and source URL retained, no page text or media reproduced.";
const BELFAST_TRUST_LICENSE =
  "Belfast Health and Social Care Trust website copyright/disclaimer; factual citation metadata and source URL retained, no page text or media reproduced.";
const BCC_LICENSE =
  "Belfast City Council website terms/copyright; factual citation metadata and source URL retained, no page text or media reproduced.";
const OGL_LICENSE =
  "Crown copyright; Open Government Licence v3.0 unless otherwise stated.";

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#manualOfficialPublicArchitectureSweepRound452`;
const METHOD = [
  "Manual official/public Belfast architecture sweep after Round442.",
  "Accepted only source-published facts from official public or public-estate institutional sources.",
  "Lab, training-suite and hospital-unit records are treated as observed facility milestones only.",
  "No construction completion, capacity, service-performance, health, education, economic, causality or impact claim is carried unless directly stated as the narrow source milestone."
].join(" ");

const SEARCH_QUERIES_CHECKED = [
  'site:qub.ac.uk "Keysight" "Millimeter-Wave research lab opened" "Queen"',
  'site:qub.ac.uk "Centre for Plasma in Agri-Food" "officially opened" "Biological Sciences building"',
  'site:belfastmet.ac.uk "Aviation Suite" "Castlereagh campus" "Belfast Met"',
  'site:belfasttrust.hscni.net/download "RVH outpatient pharmacy" "Post-Anaesthetic Care Unit"',
  'site:belfastcity.gov.uk Belfast "Arts & Digital Hub" "opens"',
  'site:communities-ni.gov.uk Belfast "officially opened" "Ionad na Fuiseoige"',
  'local duplicate scan: data/manual_drops, data/derived/2026, web/data/city-atlas/cities/belfast, tmp/subagents including round442'
];

const ACCEPTED_SOURCE_IDS = new Set([
  "qub-keysight-mmwave-lab-opening-2018-round452",
  "qub-agriplas-lab-opening-2019-round452",
  "belfast-met-aviation-suite-launch-2019-round452",
  "belfast-trust-rvh-outpatient-pharmacy-july-2016-round452",
  "belfast-trust-bch-pacu-october-2016-round452"
]);

const SOURCES = [
  {
    source_id: "qub-keysight-mmwave-lab-opening-2018-round452",
    source_name:
      "New Keysight Millimeter-Wave research lab opened at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/NewKeysightMillimeter-WaveresearchlabopenedatQueensUniversityBelfast.html",
    source_type: "official university news page",
    source_record_id: "qub-news-2018-04-24-keysight-millimeter-wave-research-lab",
    source_date_field: "official university news date",
    source_date_value: "2018-04-24",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2018",
    geographic_scope: "Queen's University Belfast estate, Belfast",
    granularity: "named research lab and centre",
    reliability: "strong",
    candidate_disposition: "accepted",
    required_markers: [
      "New Keysight Millimeter-Wave research lab opened",
      "24 April, 2018",
      "A new millimetre-wave research lab has been opened",
      "Centre for Wireless Innovation",
      "Institute of Electronics, Communications and Information Technology"
    ]
  },
  {
    source_id: "qub-agriplas-lab-opening-2019-round452",
    source_name:
      "Centre for Plasma in Agri-Food official opening at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/Research/GRI/TheInstituteforGlobalFoodSecurity/institute-for-global-security-news/NewsArchive2019/WondertechnologytotransformfarmingfoodproductionandmitigateAMRpioneeredbyIGFS.html",
    source_type: "official university research news page",
    source_record_id: "qub-research-2019-06-14-agriplas-centre-opening",
    source_date_field: "official university news date and opening text",
    source_date_value: "2019-06-14",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2019",
    geographic_scope: "Queen's University Belfast estate, Belfast",
    granularity: "named research centre/laboratory in named university building",
    reliability: "strong with source-claim caveats",
    candidate_disposition: "accepted",
    required_markers: [
      "Centre for Plasma in Agri-Food",
      "officially opened on 14 June",
      "new Biological Sciences building",
      "AgriPlas"
    ]
  },
  {
    source_id: "belfast-met-aviation-suite-launch-2019-round452",
    source_name: "Belfast Met Launch New Aviation Suite",
    publisher: "Belfast Metropolitan College",
    source_url:
      "https://www.belfastmet.ac.uk/about-us/news/belfast-met-launch-new-aviation-suite/",
    source_type: "official further-education college news page",
    source_record_id: "belfast-met-news-2019-10-14-aviation-suite-launch",
    source_date_field: "official college news date",
    source_date_value: "2019-10-14",
    license: BELFAST_MET_LICENSE,
    license_url: BELFAST_MET_TERMS_URL,
    publisher_terms_url: BELFAST_MET_TERMS_URL,
    attribution: "Belfast Metropolitan College",
    coverage_years: "2019",
    geographic_scope: "Belfast Metropolitan College Castlereagh campus, East Belfast",
    granularity: "named training suite on named campus",
    reliability: "strong",
    candidate_disposition: "accepted",
    required_markers: [
      "Belfast Met Launch New Aviation Suite",
      "14 October 2019",
      "Aviation Suite",
      "Castlereagh campus",
      "aircraft cabin mock up"
    ]
  },
  {
    source_id: "belfast-trust-rvh-outpatient-pharmacy-july-2016-round452",
    source_name: "Belfast Trust Annual Report 2016-17",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf",
    source_type: "official health trust annual report PDF",
    source_record_id:
      "belfast-trust-annual-report-2016-17-rvh-outpatient-pharmacy-july-2016",
    source_date_field: "annual-report text",
    source_date_value: "2016-07",
    marker_check_mode:
      "official_pdf_status_plus_search_indexed_text_checked_during_sweep",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    coverage_years: "2016-2017",
    geographic_scope: "Belfast Health and Social Care Trust estate",
    granularity: "named hospital internal facility; month-level date",
    reliability: "usable with caveats",
    candidate_disposition: "accepted",
    required_markers: [
      "RVH outpatient pharmacy was officially opened in July 2016",
      "Level 2 of the Royal Victoria Hospital",
      "opposite Spoons restaurant"
    ]
  },
  {
    source_id: "belfast-trust-bch-pacu-october-2016-round452",
    source_name: "Belfast Trust Annual Report 2016-17",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf",
    source_type: "official health trust annual report PDF",
    source_record_id:
      "belfast-trust-annual-report-2016-17-bch-post-anaesthetic-care-unit-october-2016",
    source_date_field: "annual-report text",
    source_date_value: "2016-10",
    marker_check_mode:
      "official_pdf_status_plus_search_indexed_text_checked_during_sweep",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    coverage_years: "2016-2017",
    geographic_scope: "Belfast Health and Social Care Trust estate",
    granularity: "named hospital internal facility; month-level date",
    reliability: "usable with caveats",
    candidate_disposition: "accepted",
    required_markers: [
      "In October 2016 a Post-Anaesthetic Care Unit (PACU) was opened in Belfast City Hospital",
      "Post-Anaesthetic Care",
      "Belfast City Hospital"
    ]
  },
  {
    source_id: "qub-nie-networks-lab-opening-2022-duplicate-round452",
    source_name:
      "NIE Networks Sustainable Energy Laboratory officially opens at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2022/NIENetworksSustainableEnergyLaboratoryofficiallyopensatQueens.html",
    source_type: "official university news page",
    source_record_id:
      "qub-news-nie-networks-sustainable-energy-laboratory-2022-11-10",
    source_date_field: "official university news date",
    source_date_value: "2022-11-10",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2022",
    geographic_scope: "Queen's University Belfast estate, Belfast",
    granularity: "named lab and building",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "NIE Networks Sustainable Energy Laboratory officially opens",
      "10 November, 2022",
      "Ashby Building in Stranmillis"
    ]
  },
  {
    source_id: "qub-advanced-manufacturing-facility-2018-duplicate-round452",
    source_name:
      "Queen's University Belfast opens advanced manufacturing technology facility",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/QueensUniversityBelfastopens75millionadvancedmanufacturingtechnology.html",
    source_type: "official university news page",
    source_record_id:
      "qub-news-2018-06-13-advanced-manufacturing-technology-facility",
    source_date_field: "official university news date",
    source_date_value: "2018-06-13",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2018",
    geographic_scope: "Queen's University Belfast estate, Belfast",
    granularity: "named facility at Northern Ireland Technology Centre",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "13 June, 2018",
      "advanced manufacturing technology facility",
      "Northern Ireland Technology Centre"
    ]
  },
  {
    source_id: "qub-wellcome-wolfson-opening-2018-duplicate-round452",
    source_name:
      "Wellcome-Wolfson Institute for Experimental Medicine opens at Queen's",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/32mWellcome-WolfsonInstituteforExperimentalMedicineopensatQueens.html",
    source_type: "official university news page",
    source_record_id:
      "qub-news-2018-09-14-wellcome-wolfson-institute-opening",
    source_date_field: "official university news date",
    source_date_value: "2018-09-14",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2018",
    geographic_scope: "Queen's University Belfast estate, Belfast",
    granularity: "named building",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Wellcome-Wolfson Institute for Experimental Medicine",
      "14 September, 2018",
      "officially opened today"
    ]
  },
  {
    source_id: "belfast-trust-horatios-garden-2024-duplicate-round452",
    source_name: "Horatio's Garden Opens at Musgrave Park Hospital",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2024/06/18/horatios-garden-opens-at-musgrave-park-hospital/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2024-06-18-horatios-garden-opening",
    source_date_field: "page date and official-opening text",
    source_date_value: "2024-06-18",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    coverage_years: "2024",
    geographic_scope: "Musgrave Park Hospital, Belfast",
    granularity: "named hospital garden",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Horatio",
      "Garden Opens at Musgrave Park Hospital",
      "officially opened"
    ]
  },
  {
    source_id: "bcc-sandy-row-arts-digital-hub-opening-2026-duplicate-round452",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    source_record_id: "bcc-news-2026-02-18-sandy-row-arts-digital-hub-opening",
    source_date_field: "official council news date",
    source_date_value: "2026-02-18",
    license: BCC_LICENSE,
    license_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    publisher_terms_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2026",
    geographic_scope: "Sandy Row, Belfast",
    granularity: "named hub",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Sandy Row",
      "Arts & Digital Hub opens",
      "officially opened"
    ]
  },
  {
    source_id: "dfc-ionad-na-fuiseoige-opening-2019-duplicate-round452",
    source_name: "New family centre opens in Twinbrook, Belfast",
    publisher: "Department for Communities, Northern Ireland",
    source_url:
      "https://www.communities-ni.gov.uk/news/new-ps21-million-family-centre-opens-twinbrook-belfast",
    source_type: "official government news page",
    source_record_id:
      "dfc-news-2019-03-05-ionad-na-fuiseoige-family-centre-opening",
    source_date_field: "Date published",
    source_date_value: "2019-03-05",
    license: OGL_LICENSE,
    license_url: OGL_URL,
    publisher_terms_url: DFC_CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities, Northern Ireland",
    coverage_years: "2019",
    geographic_scope: "Twinbrook, Belfast",
    granularity: "named family centre",
    reliability: "strong but duplicate",
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "family centre opens in Twinbrook",
      "Ionad na Fuiseoige",
      "officially opened"
    ]
  },
  {
    source_id: "qub-cyber-security-lab-2018-thin-round452",
    source_name:
      "Queen's University invests in cyber security research lab",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/QueensUniversityinvests500kinstate-of-the-artcybersecurityresearchlab.html",
    source_type: "official university news page",
    source_record_id: "qub-news-2018-06-01-cyber-security-research-lab",
    source_date_field: "official university news date",
    source_date_value: "2018-06-01",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    coverage_years: "2018",
    geographic_scope: "Queen's University Belfast / CSIT, Belfast",
    granularity: "institutional lab label without enough site detail for this pass",
    reliability: "usable source, rejected for this architecture pack",
    candidate_disposition: "rejected_insufficient_spatial_or_opening_evidence",
    required_markers: [
      "1 June, 2018",
      "cyber security research lab",
      "new experimental capabilities"
    ]
  }
];

const ACCEPTED = [
  {
    id: "bfs_arch_round452_rvh_outpatient_pharmacy_opening_2016",
    event_id: "bfs_arch_round452_rvh_outpatient_pharmacy_opening_2016",
    city_id: CITY_ID,
    title: "Royal Victoria Hospital outpatient pharmacy opened during July 2016",
    summary:
      "Belfast Health and Social Care Trust's 2016-17 annual report records that the RVH outpatient pharmacy was officially opened in July 2016 and was located on Level 2 of the Royal Victoria Hospital.",
    observed_change:
      "Official source-published month-level opening milestone for an outpatient pharmacy inside the Royal Victoria Hospital.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2016-07-31",
    effective_date: "2016-07-31",
    effective_date_range: {
      start: "2016-07-01",
      end: "2016-07-31",
      precision: "month",
      basis:
        "Belfast Trust annual report says the pharmacy was officially opened in July 2016; exact day not stated."
    },
    source_id: "belfast-trust-rvh-outpatient-pharmacy-july-2016-round452",
    source_name: "Belfast Trust Annual Report 2016-17",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf",
    source_type: "official health trust annual report PDF",
    source_record_id:
      "belfast-trust-annual-report-2016-17-rvh-outpatient-pharmacy-july-2016",
    source_date_field: "annual-report text",
    source_date_value: "2016-07",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official Trust annual report identifies the RVH outpatient pharmacy and month of opening.",
      "Official PDF URL was reachable during this sweep; PDF text evidence was checked from the search-indexed official document snippet because this script does not extract compressed PDF text."
    ],
    limitations: [
      "Exact opening day is not stated in the annual report; this candidate uses the month end for sortable effective_date and carries the full month range.",
      "This records an internal hospital facility opening only, not construction completion, pharmacy performance, patient outcome, capacity, cost, or wider estate-change evidence.",
      "No official coordinate, room footprint or floorplan was extracted; geometry_ref only, not ready for the current point-only corpus."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_internal_hospital_location",
      label:
        "Level 2, Royal Victoria Hospital outpatient pharmacy, Belfast",
      precision:
        "source-stated internal hospital location only; no official coordinate or footprint extracted in Round452",
      source_url:
        "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf"
    },
    address_ref: "Level 2, Royal Victoria Hospital, Belfast",
    point_corpus_ready: false,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf"
      },
      {
        rel: "terms",
        href: BELFAST_TRUST_COPYRIGHT_URL
      }
    ],
    duplicate_check_terms: [
      "bfs_arch_round452_rvh_outpatient_pharmacy_opening_2016",
      "belfast-trust-annual-report-2016-17-rvh-outpatient-pharmacy-july-2016",
      "RVH outpatient pharmacy",
      "outpatient pharmacy was officially opened in July 2016"
    ],
    duplicate_review:
      "No accepted live/manual event or prior official sweep candidate matched this RVH outpatient pharmacy opening. A broad annual-report-only rejection note in an older tmp pack was reviewed and treated as non-accepted prior work."
  },
  {
    id: "bfs_arch_round452_bch_post_anaesthetic_care_unit_opening_2016",
    event_id: "bfs_arch_round452_bch_post_anaesthetic_care_unit_opening_2016",
    city_id: CITY_ID,
    title:
      "Belfast City Hospital Post-Anaesthetic Care Unit opened during October 2016",
    summary:
      "Belfast Health and Social Care Trust's 2016-17 annual report records that a Post-Anaesthetic Care Unit (PACU) was opened in Belfast City Hospital in October 2016.",
    observed_change:
      "Official source-published month-level opening milestone for a Post-Anaesthetic Care Unit inside Belfast City Hospital.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2016-10-31",
    effective_date: "2016-10-31",
    effective_date_range: {
      start: "2016-10-01",
      end: "2016-10-31",
      precision: "month",
      basis:
        "Belfast Trust annual report says the unit was opened in October 2016; exact day not stated."
    },
    source_id: "belfast-trust-bch-pacu-october-2016-round452",
    source_name: "Belfast Trust Annual Report 2016-17",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf",
    source_type: "official health trust annual report PDF",
    source_record_id:
      "belfast-trust-annual-report-2016-17-bch-post-anaesthetic-care-unit-october-2016",
    source_date_field: "annual-report text",
    source_date_value: "2016-10",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official Trust annual report identifies the PACU and month of opening.",
      "Official PDF URL was reachable during this sweep; PDF text evidence was checked from the search-indexed official document snippet because this script does not extract compressed PDF text."
    ],
    limitations: [
      "Exact opening day is not stated in the annual report; this candidate uses the month end for sortable effective_date and carries the full month range.",
      "This records an internal hospital unit opening only, not construction completion, clinical performance, patient outcome, capacity, cost, or wider estate-change evidence.",
      "No official coordinate, room footprint or floorplan was extracted; geometry_ref only, not ready for the current point-only corpus."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_internal_hospital_location",
      label:
        "Post-Anaesthetic Care Unit, Belfast City Hospital, Belfast",
      precision:
        "source-stated hospital location only; no official coordinate or footprint extracted in Round452",
      source_url:
        "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf"
    },
    address_ref: "Belfast City Hospital, Belfast",
    point_corpus_ready: false,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://belfasttrust.hscni.net/download/27/annual-reports/849/belfast-trust-annual-report-16-17.pdf"
      },
      {
        rel: "terms",
        href: BELFAST_TRUST_COPYRIGHT_URL
      }
    ],
    duplicate_check_terms: [
      "bfs_arch_round452_bch_post_anaesthetic_care_unit_opening_2016",
      "belfast-trust-annual-report-2016-17-bch-post-anaesthetic-care-unit-october-2016",
      "Post-Anaesthetic Care Unit",
      "PACU was opened in Belfast City Hospital"
    ],
    duplicate_review:
      "No accepted live/manual event or prior official sweep candidate matched this BCH PACU opening. A broad annual-report-only rejection note in an older tmp pack was reviewed and treated as non-accepted prior work."
  },
  {
    id: "bfs_arch_round452_qub_keysight_mmwave_lab_opening_2018",
    event_id: "bfs_arch_round452_qub_keysight_mmwave_lab_opening_2018",
    city_id: CITY_ID,
    title:
      "Queen's University Belfast Keysight millimetre-wave research lab opened",
    summary:
      "Queen's University Belfast reported on 24 April 2018 that a Keysight millimetre-wave research lab had opened in collaboration with Queen's and was located in the Centre for Wireless Innovation at ECIT.",
    observed_change:
      "Official source-published opening milestone for a named university research laboratory.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2018-04-24",
    effective_date: "2018-04-24",
    effective_date_range: {
      start: "2018-04-24",
      end: "2018-04-24",
      precision: "day",
      basis: "Official university news page date."
    },
    source_id: "qub-keysight-mmwave-lab-opening-2018-round452",
    source_name:
      "New Keysight Millimeter-Wave research lab opened at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/NewKeysightMillimeter-WaveresearchlabopenedatQueensUniversityBelfast.html",
    source_type: "official university news page",
    source_record_id: "qub-news-2018-04-24-keysight-millimeter-wave-research-lab",
    source_date_field: "official university news date",
    source_date_value: "2018-04-24",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    terms: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official QUB page identifies the lab opening date and the Centre for Wireless Innovation/ECIT location.",
      "The page was fetched and source markers were verified by this script."
    ],
    limitations: [
      "This records the opening of a research lab only, not building completion, public access, research output, economic benefit or broader estate impact.",
      "No official coordinate or building footprint was extracted; geometry_ref only, not ready for the current point-only corpus."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_university_lab_reference",
      label:
        "Keysight millimetre-wave research lab, Centre for Wireless Innovation, ECIT, Queen's University Belfast",
      precision:
        "source-stated centre/lab reference only; no official coordinate or footprint extracted in Round452",
      source_url:
        "https://www.qub.ac.uk/News/Allnews/2018/NewKeysightMillimeter-WaveresearchlabopenedatQueensUniversityBelfast.html"
    },
    address_ref:
      "Centre for Wireless Innovation, ECIT, Queen's University Belfast",
    point_corpus_ready: false,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://www.qub.ac.uk/News/Allnews/2018/NewKeysightMillimeter-WaveresearchlabopenedatQueensUniversityBelfast.html"
      },
      {
        rel: "terms",
        href: QUB_TERMS_URL
      }
    ],
    duplicate_check_terms: [
      "bfs_arch_round452_qub_keysight_mmwave_lab_opening_2018",
      "qub-news-2018-04-24-keysight-millimeter-wave-research-lab",
      "Keysight Millimeter-Wave research lab",
      "Keysight millimetre-wave research lab",
      "Centre for Wireless Innovation"
    ],
    duplicate_review:
      "No accepted live/manual event, source URL, source record, or prior Belfast official sweep candidate matched this Keysight lab opening."
  },
  {
    id: "bfs_arch_round452_qub_agriplas_lab_opening_2019",
    event_id: "bfs_arch_round452_qub_agriplas_lab_opening_2019",
    city_id: CITY_ID,
    title:
      "Queen's University Belfast Centre for Plasma in Agri-Food opened",
    summary:
      "Queen's University Belfast reported on 14 June 2019 that the Centre for Plasma in Agri-Food, also called AgriPlas, was officially opened in the new Biological Sciences building.",
    observed_change:
      "Official source-published opening milestone for a named university research centre/laboratory.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2019-06-14",
    effective_date: "2019-06-14",
    effective_date_range: {
      start: "2019-06-14",
      end: "2019-06-14",
      precision: "day",
      basis: "Official university news page date and opening text."
    },
    source_id: "qub-agriplas-lab-opening-2019-round452",
    source_name:
      "Centre for Plasma in Agri-Food official opening at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/Research/GRI/TheInstituteforGlobalFoodSecurity/institute-for-global-security-news/NewsArchive2019/WondertechnologytotransformfarmingfoodproductionandmitigateAMRpioneeredbyIGFS.html",
    source_type: "official university research news page",
    source_record_id: "qub-research-2019-06-14-agriplas-centre-opening",
    source_date_field: "official university news date and opening text",
    source_date_value: "2019-06-14",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    terms: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official QUB page identifies the centre/lab, official opening date and new Biological Sciences building location.",
      "The page was fetched and source markers were verified by this script."
    ],
    limitations: [
      "This records the official opening of a university research centre/lab only.",
      "The source includes research and technology claims; this candidate does not carry those future-facing or outcome claims.",
      "No official coordinate or building footprint was extracted; geometry_ref only, not ready for the current point-only corpus."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_university_lab_reference",
      label:
        "Centre for Plasma in Agri-Food (AgriPlas), new Biological Sciences building, Queen's University Belfast",
      precision:
        "source-stated building/lab reference only; no official coordinate or footprint extracted in Round452",
      source_url:
        "https://www.qub.ac.uk/Research/GRI/TheInstituteforGlobalFoodSecurity/institute-for-global-security-news/NewsArchive2019/WondertechnologytotransformfarmingfoodproductionandmitigateAMRpioneeredbyIGFS.html"
    },
    address_ref:
      "new Biological Sciences building, Queen's University Belfast",
    point_corpus_ready: false,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://www.qub.ac.uk/Research/GRI/TheInstituteforGlobalFoodSecurity/institute-for-global-security-news/NewsArchive2019/WondertechnologytotransformfarmingfoodproductionandmitigateAMRpioneeredbyIGFS.html"
      },
      {
        rel: "terms",
        href: QUB_TERMS_URL
      }
    ],
    duplicate_check_terms: [
      "bfs_arch_round452_qub_agriplas_lab_opening_2019",
      "qub-research-2019-06-14-agriplas-centre-opening",
      "AgriPlas",
      "Centre for Plasma in Agri-Food"
    ],
    duplicate_review:
      "No accepted live/manual event, source URL, source record, or prior Belfast official sweep candidate matched this AgriPlas opening."
  },
  {
    id: "bfs_arch_round452_belfast_met_aviation_suite_launch_2019",
    event_id: "bfs_arch_round452_belfast_met_aviation_suite_launch_2019",
    city_id: CITY_ID,
    title: "Belfast Met Aviation Suite launched at Castlereagh campus",
    summary:
      "Belfast Metropolitan College reported on 14 October 2019 that it had launched an Aviation Suite at the college's Castlereagh campus in East Belfast.",
    observed_change:
      "Official source-published launch milestone for a named training suite on a public college campus.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2019-10-14",
    effective_date: "2019-10-14",
    effective_date_range: {
      start: "2019-10-14",
      end: "2019-10-14",
      precision: "day",
      basis: "Official college news page date."
    },
    source_id: "belfast-met-aviation-suite-launch-2019-round452",
    source_name: "Belfast Met Launch New Aviation Suite",
    publisher: "Belfast Metropolitan College",
    source_url:
      "https://www.belfastmet.ac.uk/about-us/news/belfast-met-launch-new-aviation-suite/",
    source_type: "official further-education college news page",
    source_record_id: "belfast-met-news-2019-10-14-aviation-suite-launch",
    source_date_field: "official college news date",
    source_date_value: "2019-10-14",
    license: BELFAST_MET_LICENSE,
    license_url: BELFAST_MET_TERMS_URL,
    terms: BELFAST_MET_TERMS_URL,
    publisher_terms_url: BELFAST_MET_TERMS_URL,
    attribution: "Belfast Metropolitan College",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    evidence_basis: [
      "Official Belfast Met page identifies the suite launch date and Castlereagh campus location.",
      "The page was fetched and source markers were verified by this script."
    ],
    limitations: [
      "This records a training-suite launch only, not campus-wide renewal, course outcomes, learner outcomes or economic impact.",
      "No official coordinate or room/building footprint was extracted; geometry_ref only, not ready for the current point-only corpus."
    ],
    geometry: null,
    geometry_ref: {
      type: "source_stated_college_campus_facility_reference",
      label:
        "Aviation Suite, Belfast Met Castlereagh campus, East Belfast",
      precision:
        "source-stated campus/facility reference only; no official coordinate or footprint extracted in Round452",
      source_url:
        "https://www.belfastmet.ac.uk/about-us/news/belfast-met-launch-new-aviation-suite/"
    },
    address_ref: "Belfast Met Castlereagh campus, East Belfast",
    point_corpus_ready: false,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://www.belfastmet.ac.uk/about-us/news/belfast-met-launch-new-aviation-suite/"
      },
      {
        rel: "terms",
        href: BELFAST_MET_TERMS_URL
      }
    ],
    duplicate_check_terms: [
      "bfs_arch_round452_belfast_met_aviation_suite_launch_2019",
      "belfast-met-news-2019-10-14-aviation-suite-launch",
      "Belfast Met Launch New Aviation Suite",
      "Aviation Suite",
      "belfast-met-launch-new-aviation-suite"
    ],
    duplicate_review:
      "No accepted live/manual event, source URL, source record, or prior Belfast official sweep candidate matched this Belfast Met Aviation Suite launch."
  }
];

const REJECTED = [
  {
    id: "bfs_arch_round452_reject_qub_nie_networks_lab_duplicate_2022",
    city_id: CITY_ID,
    title:
      "NIE Networks Sustainable Energy Laboratory official opening at Queen's",
    rejection_category: "duplicate",
    reason:
      "Rejected as already covered in the live/manual corpus and Round442 duplicate review; not a new Round452 candidate.",
    duplicate_reference: [
      "tmp/subagents/round442_belfast_official_architecture_sweep_next16/rejected.json",
      "prior accepted/manual Belfast architecture corpus"
    ],
    source_id: "qub-nie-networks-lab-opening-2022-duplicate-round452",
    source_record_id:
      "qub-news-nie-networks-sustainable-energy-laboratory-2022-11-10",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2022/NIENetworksSustainableEnergyLaboratoryofficiallyopensatQueens.html",
    source_name:
      "NIE Networks Sustainable Energy Laboratory officially opens at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    license: QUB_LICENSE,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_qub_advanced_manufacturing_duplicate_2018",
    city_id: CITY_ID,
    title:
      "Queen's advanced manufacturing technology facility opening",
    rejection_category: "duplicate",
    reason:
      "Rejected as a duplicate of an existing Queen's advanced manufacturing technology facility event in the live/manual corpus.",
    duplicate_reference: [
      "data/derived/2026/belfast_infrastructure_events_2016_2026.json",
      "tmp/subagents/belfast_arch_candidates_round84.json"
    ],
    source_id: "qub-advanced-manufacturing-facility-2018-duplicate-round452",
    source_record_id:
      "qub-news-2018-06-13-advanced-manufacturing-technology-facility",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/QueensUniversityBelfastopens75millionadvancedmanufacturingtechnology.html",
    source_name:
      "Queen's University Belfast opens advanced manufacturing technology facility",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    license: QUB_LICENSE,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_qub_wellcome_wolfson_duplicate_2018",
    city_id: CITY_ID,
    title:
      "Wellcome-Wolfson Institute for Experimental Medicine official opening",
    rejection_category: "duplicate",
    reason:
      "Rejected as already present in earlier Belfast architecture/infrastructure corpus records; not a new Round452 candidate.",
    duplicate_reference: [
      "prior Belfast manual/live architecture corpus"
    ],
    source_id: "qub-wellcome-wolfson-opening-2018-duplicate-round452",
    source_record_id:
      "qub-news-2018-09-14-wellcome-wolfson-institute-opening",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/32mWellcome-WolfsonInstituteforExperimentalMedicineopensatQueens.html",
    source_name:
      "Wellcome-Wolfson Institute for Experimental Medicine opens at Queen's",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    license: QUB_LICENSE,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_belfast_trust_horatios_garden_duplicate_2024",
    city_id: CITY_ID,
    title: "Horatio's Garden official opening at Musgrave Park Hospital",
    rejection_category: "duplicate",
    reason:
      "Rejected as already identified as a duplicate in Round442 and present in earlier Belfast architecture packs.",
    duplicate_reference: [
      "tmp/subagents/round442_belfast_official_architecture_sweep_next16/rejected.json"
    ],
    source_id: "belfast-trust-horatios-garden-2024-duplicate-round452",
    source_record_id: "belfast-trust-2024-06-18-horatios-garden-opening",
    source_url:
      "https://belfasttrust.hscni.net/2024/06/18/horatios-garden-opens-at-musgrave-park-hospital/",
    source_name: "Horatio's Garden Opens at Musgrave Park Hospital",
    publisher: "Belfast Health and Social Care Trust",
    source_type: "official health trust news page",
    license: BELFAST_TRUST_LICENSE,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_bcc_sandy_row_hub_duplicate_2026",
    city_id: CITY_ID,
    title: "Sandy Row Arts & Digital Hub official opening",
    rejection_category: "duplicate",
    reason:
      "Rejected as already identified as a duplicate in Round442 and present in earlier Belfast architecture packs.",
    duplicate_reference: [
      "tmp/subagents/round442_belfast_official_architecture_sweep_next16/rejected.json"
    ],
    source_id: "bcc-sandy-row-arts-digital-hub-opening-2026-duplicate-round452",
    source_record_id: "bcc-news-2026-02-18-sandy-row-arts-digital-hub-opening",
    source_url:
      "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_type: "official council news page",
    license: BCC_LICENSE,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_dfc_ionad_na_fuiseoige_duplicate_2019",
    city_id: CITY_ID,
    title: "Ionad na Fuiseoige family centre official opening",
    rejection_category: "duplicate",
    reason:
      "Rejected as already identified as a duplicate in Round442 and present in earlier Belfast architecture packs.",
    duplicate_reference: [
      "tmp/subagents/round442_belfast_official_architecture_sweep_next16/rejected.json"
    ],
    source_id: "dfc-ionad-na-fuiseoige-opening-2019-duplicate-round452",
    source_record_id:
      "dfc-news-2019-03-05-ionad-na-fuiseoige-family-centre-opening",
    source_url:
      "https://www.communities-ni.gov.uk/news/new-ps21-million-family-centre-opens-twinbrook-belfast",
    source_name: "New family centre opens in Twinbrook, Belfast",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official government news page",
    license: OGL_LICENSE,
    attribution: "Department for Communities, Northern Ireland",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  },
  {
    id: "bfs_arch_round452_reject_qub_cyber_security_lab_thin_2018",
    city_id: CITY_ID,
    title: "Queen's cyber security research lab investment page",
    rejection_category: "insufficient_spatial_or_opening_evidence",
    reason:
      "Rejected for this architecture pack because the source page supports an institutional lab investment/capability record but does not provide enough site-level built-change detail for a conservative architecture-change candidate.",
    duplicate_reference: [],
    source_id: "qub-cyber-security-lab-2018-thin-round452",
    source_record_id: "qub-news-2018-06-01-cyber-security-research-lab",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2018/QueensUniversityinvests500kinstate-of-the-artcybersecurityresearchlab.html",
    source_name:
      "Queen's University invests in cyber security research lab",
    publisher: "Queen's University Belfast",
    source_type: "official university news page",
    license: QUB_LICENSE,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT
  }
];

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeJson(fileName, value) {
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(fileName, value) {
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, value);
}

function sourceById(sourceId) {
  const source = SOURCES.find((item) => item.source_id === sourceId);
  if (!source) {
    throw new Error(`Missing source metadata for ${sourceId}`);
  }
  return source;
}

async function fetchSource(source) {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await fetch(source.source_url, {
      headers: FETCH_HEADERS,
      redirect: "follow"
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "";
    const base = {
      ...source,
      accessed_at: ACCESSED_AT,
      fetched_at: fetchedAt,
      final_url: response.url,
      http_status: response.status,
      fetch_ok: response.ok,
      content_type: contentType,
      content_length: buffer.length,
      content_sha256: sha256(buffer),
      modified_time: response.headers.get("last-modified"),
      published_time: null
    };

    if (
      source.marker_check_mode ===
      "official_pdf_status_plus_search_indexed_text_checked_during_sweep"
    ) {
      return {
        ...base,
        marker_ok: response.ok && contentType.toLowerCase().includes("pdf"),
        marker_results: source.required_markers.map((marker) => ({
          marker,
          found: true,
          checked_by:
            "manual review of search-indexed text from the fetched official PDF"
        })),
        marker_check_mode: source.marker_check_mode,
        marker_check_note:
          "The official PDF URL and checksum were fetched by this script. The PDF text is compressed and was not machine-extracted here; the named annual-report facts were checked from the search-indexed text of the same official PDF during the sweep."
      };
    }

    const text = buffer.toString("utf8");
    const haystack = normalizeText(text);
    const markerResults = source.required_markers.map((marker) => ({
      marker,
      found: haystack.includes(normalizeText(marker))
    }));
    return {
      ...base,
      marker_ok:
        response.ok && markerResults.every((result) => result.found === true),
      marker_results: markerResults,
      marker_check_mode: "html_text_contains_required_markers"
    };
  } catch (error) {
    return {
      ...source,
      accessed_at: ACCESSED_AT,
      fetched_at: fetchedAt,
      fetch_ok: false,
      marker_ok: false,
      error: error.message
    };
  }
}

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  const skippedRoundPath = path.normalize(OUT_DIR);
  while (stack.length) {
    const current = stack.pop();
    if (path.normalize(current).includes(skippedRoundPath)) continue;
    let stat;
    try {
      stat = fs.statSync(current);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(current)) {
        stack.push(path.join(current, child));
      }
      continue;
    }
    const ext = path.extname(current).toLowerCase();
    if (
      [".json", ".geojson", ".ndjson", ".md", ".csv", ".txt"].includes(ext)
    ) {
      files.push(current);
    }
  }
  return files;
}

function duplicateScan(candidates) {
  const roots = [
    path.join("data", "manual_drops"),
    path.join("data", "derived", "2026"),
    path.join("web", "data", "city-atlas", "cities", "belfast"),
    path.join("tmp", "subagents")
  ];
  const files = roots.flatMap(walkFiles);
  const scans = new Map();
  for (const candidate of candidates) {
    scans.set(candidate.id, []);
  }

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const haystack = normalizeText(text);
    for (const candidate of candidates) {
      const terms = candidate.duplicate_check_terms || [];
      for (const term of terms) {
        if (!term || String(term).length < 6) continue;
        if (haystack.includes(normalizeText(term))) {
          scans.get(candidate.id).push({
            file,
            term
          });
        }
      }
    }
  }
  return scans;
}

function candidateTextForOverclaims(candidate) {
  return normalizeText([
    candidate.title,
    candidate.summary,
    candidate.observed_change,
    ...(candidate.limitations || [])
  ].join(" "));
}

function validateCandidates(candidates, sourceAudit) {
  const errors = [];
  const warnings = [];
  const requiredFields = [
    "id",
    "event_id",
    "city_id",
    "date",
    "effective_date",
    "title",
    "summary",
    "source_record_id",
    "source_url",
    "source_name",
    "publisher",
    "source_type",
    "license",
    "attribution",
    "accessed_at",
    "retrieved_at",
    "confidence",
    "limitations",
    "method",
    "transformation_method"
  ];
  const ids = new Set();
  const overclaimPatterns = [
    /\bpredicts?\b/,
    /\bforecast(s|ed|ing)?\b/,
    /\bsimulat(e|es|ed|ion|or)\b/,
    /\bcaused?\b/,
    /\bwill increase\b/,
    /\bwill decrease\b/,
    /\bimpact score\b/,
    /\b10-year\b/
  ];

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (
        candidate[field] === undefined ||
        candidate[field] === null ||
        candidate[field] === ""
      ) {
        errors.push(`${candidate.id || "unknown"} missing ${field}`);
      }
    }
    if (candidate.event_id !== candidate.id) {
      errors.push(`${candidate.id} event_id must match id`);
    }
    if (ids.has(candidate.id)) {
      errors.push(`duplicate candidate id ${candidate.id}`);
    }
    ids.add(candidate.id);
    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.id} city_id must be ${CITY_ID}`);
    }
    if (
      candidate.effective_date < DATE_WINDOW.start ||
      candidate.effective_date > DATE_WINDOW.end
    ) {
      errors.push(`${candidate.id} effective_date outside requested window`);
    }
    if (!candidate.geometry && !candidate.geometry_ref) {
      errors.push(`${candidate.id} missing geometry or geometry_ref`);
    }
    if (!candidate.geometry && candidate.point_corpus_ready !== false) {
      errors.push(`${candidate.id} geometry_ref-only records must set point_corpus_ready false`);
    }
    if (!Array.isArray(candidate.limitations) || !candidate.limitations.length) {
      errors.push(`${candidate.id} limitations must be a non-empty array`);
    }
    const overclaimText = candidateTextForOverclaims(candidate);
    for (const pattern of overclaimPatterns) {
      if (pattern.test(overclaimText)) {
        errors.push(`${candidate.id} contains overclaim pattern ${pattern}`);
      }
    }
    const source = sourceAudit.find((item) => item.source_id === candidate.source_id);
    if (!source) {
      errors.push(`${candidate.id} missing source audit row`);
    } else if (!source.fetch_ok || !source.marker_ok) {
      errors.push(`${candidate.id} source audit failed fetch/marker check`);
    }
    if (!candidate.geometry) {
      warnings.push(`${candidate.id} is geometry_ref-only and not point-corpus-ready`);
    }
    if (candidate.effective_date_range?.precision === "month") {
      warnings.push(`${candidate.id} has month-level effective date precision`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

function buildSourceAuditSummary(sourceAudit) {
  return sourceAudit.map((source) => ({
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_type: source.source_type,
    license: source.license,
    license_url: source.license_url,
    coverage_years: source.coverage_years,
    geographic_scope: source.geographic_scope,
    granularity: source.granularity,
    reliability: source.reliability,
    candidate_disposition: source.candidate_disposition,
    fetch_ok: source.fetch_ok,
    marker_ok: source.marker_ok,
    marker_check_mode: source.marker_check_mode,
    caveats:
      source.marker_check_mode ===
      "official_pdf_status_plus_search_indexed_text_checked_during_sweep"
        ? [
            "Official PDF was fetched and checksummed, but compressed PDF text was not machine-extracted by this script.",
            "Annual-report facts are month-level and internal-facility references without coordinates."
          ]
        : []
  }));
}

function sortCandidates(candidates) {
  return [...candidates].sort((a, b) => {
    const dateCompare = a.effective_date.localeCompare(b.effective_date);
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });
}

async function main() {
  ensureOutDir();

  const sourceAudit = [];
  for (const source of SOURCES) {
    sourceAudit.push(await fetchSource(source));
  }

  const duplicateScans = duplicateScan(ACCEPTED);
  const candidates = sortCandidates(
    ACCEPTED.map((candidate) => ({
      ...candidate,
      duplicate_scan_hits: duplicateScans.get(candidate.id) || []
    }))
  );
  const rejected = [...REJECTED].sort((a, b) => a.id.localeCompare(b.id));

  const acceptedSourceAudit = sourceAudit.filter((source) =>
    ACCEPTED_SOURCE_IDS.has(source.source_id)
  );
  const rejectedSourceAudit = sourceAudit.filter(
    (source) => !ACCEPTED_SOURCE_IDS.has(source.source_id)
  );
  const validation = validateCandidates(candidates, acceptedSourceAudit);
  const pointBackedCount = candidates.filter((candidate) => candidate.geometry).length;
  const geometryRefOnlyCount = candidates.length - pointBackedCount;
  const publishers = [...new Set(candidates.map((candidate) => candidate.publisher))].sort();
  const dateRange = {
    start: candidates[0]?.effective_date || null,
    end: candidates[candidates.length - 1]?.effective_date || null
  };

  const sourceAuditOutput = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    accepted_source_audit: acceptedSourceAudit,
    rejected_source_audit: rejectedSourceAudit,
    source_audit_summary: buildSourceAuditSummary(sourceAudit)
  };

  const validationReport = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    ok: validation.ok,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    publishers,
    source_count: new Set(candidates.map((candidate) => candidate.source_url)).size,
    warnings: validation.warnings,
    errors: validation.errors,
    duplicate_scan_roots: [
      "data/manual_drops",
      "data/derived/2026",
      "web/data/city-atlas/cities/belfast",
      "tmp/subagents"
    ],
    searched_queries: SEARCH_QUERIES_CHECKED
  };

  const summary = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    sources: publishers,
    caveats: [
      "All accepted records are geometry_ref-only; none is ready for the current point-only corpus without source-supported coordinates or footprints.",
      "Two Belfast Trust annual-report records have month-level effective date precision because the official PDF gives only July 2016 and October 2016.",
      "No causality, prediction, simulation, service-performance, health, education or economic outcome claim is made."
    ],
    outputs: [
      path.join(OUT_DIR, "candidates.json"),
      path.join(OUT_DIR, "rejected.json"),
      path.join(OUT_DIR, "validation_report.json"),
      path.join(OUT_DIR, "source_audit.json"),
      path.join(OUT_DIR, "summary.json"),
      path.join(OUT_DIR, "readback.json"),
      path.join(OUT_DIR, "notes.md")
    ]
  };

  const readback = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    accepted_event_ids: candidates.map((candidate) => candidate.id),
    rejected_event_ids: rejected.map((candidate) => candidate.id),
    point_backed_event_ids: candidates
      .filter((candidate) => candidate.geometry)
      .map((candidate) => candidate.id),
    geometry_ref_only_event_ids: candidates
      .filter((candidate) => !candidate.geometry)
      .map((candidate) => candidate.id),
    source_urls: candidates.map((candidate) => candidate.source_url),
    validation_ok: validation.ok,
    validation_errors: validation.errors,
    caveats: summary.caveats
  };

  const notes = `# ${ROUND_ID}\n\n` +
    `Generated: ${GENERATED_AT}\n\n` +
    `Accepted candidates: ${candidates.length}\n\n` +
    `Rejected records: ${rejected.length}\n\n` +
    `Point-backed candidates: ${pointBackedCount}\n\n` +
    `Geometry-ref-only candidates: ${geometryRefOnlyCount}\n\n` +
    `Effective date range: ${dateRange.start} to ${dateRange.end}\n\n` +
    `Sources accepted: ${publishers.join("; ")}\n\n` +
    `## Caveats\n\n` +
    `- All accepted records are geometry_ref-only and are not ready for the current point-only corpus.\n` +
    `- The RVH outpatient pharmacy and BCH PACU records use month-level annual-report dates; exact opening days were not stated by the source.\n` +
    `- No prediction, simulation, causality, impact, service-performance, health, education, economic-outcome or capacity claim is made.\n` +
    `- The Belfast Trust PDF was fetched and checksummed. Its compressed PDF text was not machine-extracted by this script; the annual-report facts were checked from search-indexed text of the same official PDF during the sweep.\n\n` +
    `## Search Notes\n\n` +
    SEARCH_QUERIES_CHECKED.map((query) => `- ${query}`).join("\n") +
    `\n`;

  writeJson("candidates.json", candidates);
  writeJson("rejected.json", rejected);
  writeJson("source_audit.json", sourceAuditOutput);
  writeJson("validation_report.json", validationReport);
  writeJson("validation.json", validationReport);
  writeJson("summary.json", summary);
  writeJson("readback.json", readback);
  writeText("notes.md", notes);

  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        ok: validation.ok,
        accepted_count: candidates.length,
        rejected_count: rejected.length,
        point_backed_count: pointBackedCount,
        geometry_ref_only_count: geometryRefOnlyCount,
        date_range: dateRange,
        errors: validation.errors
      },
      null,
      2
    )
  );

  if (!validation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
