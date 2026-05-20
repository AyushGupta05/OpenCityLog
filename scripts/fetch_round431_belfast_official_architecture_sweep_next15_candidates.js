#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round431_belfast_official_architecture_sweep_next15";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join(
  "scripts",
  "fetch_round431_belfast_official_architecture_sweep_next15_candidates.js"
);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const BELFAST_HARBOUR_TERMS_URL = "https://www.belfast-harbour.co.uk/policies/";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DE_CROWN_COPYRIGHT_URL = "https://www.education-ni.gov.uk/articles/crown-copyright-education";
const DFC_CROWN_COPYRIGHT_URL = "https://www.communities-ni.gov.uk/articles/crown-copyright";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#manualOfficialPublicArchitectureSweepRound431`;
const METHOD = [
  "Manual official/public Belfast architecture sweep after Round419.",
  "Accepted only source-published facts from official public bodies or public-estate owners.",
  "Planning, award, commencement and topping-out records are labelled as administrative or construction milestones.",
  "No construction completion, opening, impact, jobs, GDP or causality claim is carried unless accepted as directly sourced and relevant."
].join(" ");

const SEARCH_QUERIES_CHECKED = [
  'site:belfast-harbour.co.uk/news Belfast Harbour City Quays 3 "contract" "topped out"',
  'site:qub.ac.uk/News/Allnews/2024 "Graham awarded contract" "iREACH Health"',
  'site:education-ni.gov.uk/news Belfast "building work" "school"',
  'site:education-ni.gov.uk/news Belfast "officially opened" "new" "school"',
  'site:communities-ni.gov.uk/news Belfast "public realm" "construction" "Shankill"',
  'prior local corpus scan: data/manual_drops, data/derived/2026, web/data/city-atlas/cities/belfast, tmp/subagents'
];

const SOURCES = [
  {
    source_id: "belfast-harbour-city-quays-3-contract-award-2019-round431",
    source_name: "Belfast Harbour Awards Largest Ever Contract to Local Construction Company",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/cq3-235/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-cq3-235",
    source_date_field: "article:published_time metadata",
    source_date_value: "2019-05-20",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Belfast Harbour Awards Largest Ever Contract",
      "awarded the contract to build City Quays 3",
      "Farrans Construction",
      "Construction work on the 16-storey"
    ]
  },
  {
    source_id: "belfast-harbour-city-quays-3-topping-out-2021-round431",
    source_name: "Belfast Harbour and Farrans Construction Reach Topping Out Milestone on City Quays 3",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/city-quays-3-topping-out-303/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-city-quays-3-topping-out-303",
    source_date_field: "article:published_time metadata",
    source_date_value: "2021-10-05",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Topping Out Milestone on City Quays 3",
      "Farrans Construction has topped out on City Quays 3",
      "completion of the external structure",
      "Construction started on City Quays 3 in 2019"
    ]
  },
  {
    source_id: "qub-ireach-contract-award-2024-round431",
    source_name: "Graham awarded contract for new iREACH Health clinical research innovation centre",
    publisher: "Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/News/Allnews/2024/Graham-awarded-contract-for-new-iREACH-Health-clinical-research-innovation-centre.html",
    source_type: "official university news page",
    source_record_id: "qub-news-3414347",
    source_date_field: "official university news date",
    source_date_value: "2024-12-10",
    license: "Queen's University Belfast website copyright/terms; used here as factual citation metadata.",
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Graham awarded contract for new iREACH Health clinical research innovation centre",
      "Queen's University Belfast has awarded Graham",
      "beside the Belfast City Hospital",
      "planned 8,500"
    ]
  },
  {
    source_id: "de-edenderry-nursery-works-commencement-2016-round431",
    source_name: "O'Dowd marks commencement of GBP1.3million building work at Edenderry Nursery school",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
    source_type: "official government news page",
    source_record_id: "de-odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
    source_date_field: "Date published",
    source_date_value: "2016-03-10",
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    attribution: "Department of Education, Northern Ireland",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Edenderry Nursery School in Belfast as work begins",
      "junction of Lanark Way and Mayo link",
      "Construction work is being taken forward",
      "Date published"
    ]
  },
  {
    source_id: "belfast-harbour-city-quays-2-completion-2017-duplicate-round431",
    source_name: "Belfast Harbour Completes Second Major City Quays Office Building",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/belfast-harbour-completes-second-major-city-quays-office-buildin-177/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-city-quays-office-buildin-177",
    source_date_field: "article:published_time metadata",
    source_date_value: "2017-09-28",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Belfast Harbour Completes Second Major City Quays Office Building",
      "City Quays 2",
      "completed"
    ]
  },
  {
    source_id: "belfast-harbour-ac-hotel-launch-2018-duplicate-round431",
    source_name: "AC Hotel Belfast Flagship Feature of City Quays Development",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/ac-hotel-belfast-flagship-feature-of-city-quays-development-205/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-ac-hotel-belfast-flagship-feature-205",
    source_date_field: "article:published_time metadata",
    source_date_value: "2018-06-22",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "AC Hotel Belfast",
      "officially launched",
      "City Quays"
    ]
  },
  {
    source_id: "de-colaiste-feirste-work-progress-2016-duplicate-round431",
    source_name: "Minister Weir views GBP15.5million work at Colaiste Feirste, Belfast",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/minister-weir-views-ps155million-work-colaiste-feirste-belfast",
    source_type: "official government news page",
    source_record_id: "de-minister-weir-views-ps155million-work-colaiste-feirste-belfast",
    source_date_field: "Date published",
    source_date_value: "2016-06-02",
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    attribution: "Department of Education, Northern Ireland",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Colaiste Feirste",
      "Building work commenced on site on 8 February 2016",
      "Woodvale Construction"
    ]
  },
  {
    source_id: "dfc-shankill-gateway-start-2026-duplicate-round431",
    source_name: "Lyons announces start of construction on the Shankill Gateway Public Realm scheme",
    publisher: "Department for Communities, Northern Ireland",
    source_url: "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    source_type: "official government news page",
    source_record_id: "dfc-lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    source_date_field: "Date published",
    source_date_value: "2026-03-25",
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    license_url: OGL_URL,
    publisher_terms_url: DFC_CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities, Northern Ireland",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Shankill Gateway Public Realm scheme",
      "commencement of construction",
      "Peter",
      "Agnes Street"
    ]
  }
];

const ACCEPTED = [
  {
    id: "bfs_arch_round431_city_quays_3_contract_award_2019",
    city_id: CITY_ID,
    title: "City Quays 3 construction contract was awarded",
    summary: "Belfast Harbour reported that it had awarded Farrans Construction the contract to build City Quays 3 in May 2019.",
    observed_change: "Official source-published contract-award milestone for the City Quays 3 office building.",
    event_type: "contract_award",
    category: "architecture_public_estate",
    date: "2019-05-20",
    effective_date: "2019-05-20",
    effective_date_range: {
      start: "2019-05-20",
      end: "2019-05-20",
      precision: "day",
      basis: "Belfast Harbour article:published_time metadata"
    },
    geometry: null,
    geometry_ref: {
      type: "address_or_site_reference",
      label: "City Quays 3, City Quays waterfront development, Belfast Harbour, Belfast",
      source_url: "https://www.belfast-harbour.co.uk/news/cq3-235/",
      precision: "source-stated project/site reference only; no official coordinate or footprint extracted in Round431"
    },
    address_ref: "City Quays 3, City Quays waterfront development, Belfast Harbour, Belfast",
    source_name: "Belfast Harbour Awards Largest Ever Contract to Local Construction Company",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/cq3-235/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-cq3-235",
    source_date_field: "article:published_time metadata",
    source_date_value: "2019-05-20",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    terms: BELFAST_HARBOUR_TERMS_URL,
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records a contract-award milestone only.",
      "The record does not assert that construction had started or that the building was complete on this date.",
      "No employment, investment impact, occupancy or economic outcome claim is carried into the event."
    ],
    evidence_basis: [
      "Official Belfast Harbour page identifies the contractor award for City Quays 3.",
      "Date taken from page article:published_time metadata."
    ],
    duplicate_check_terms: [
      "bfs_arch_round431_city_quays_3_contract_award_2019",
      "https://www.belfast-harbour.co.uk/news/cq3-235/",
      "belfast-harbour-news-cq3-235",
      "City Quays 3 construction contract",
      "Farrans Construction City Quays 3 2019-05-20"
    ],
    duplicate_review: "No exact id, source URL, source record, or same title/date event found in prior Belfast candidate packs or the live/manual corpus. Existing City Quays 3 planning/completion records are related project stages, not this contract-award source event.",
    provenance_links: [
      {
        rel: "primary_source",
        href: "https://www.belfast-harbour.co.uk/news/cq3-235/"
      },
      {
        rel: "terms",
        href: BELFAST_HARBOUR_TERMS_URL
      }
    ]
  },
  {
    id: "bfs_arch_round431_city_quays_3_topping_out_2021",
    city_id: CITY_ID,
    title: "City Quays 3 topping-out milestone was marked",
    summary: "Belfast Harbour reported that Farrans Construction had topped out on City Quays 3, marking completion of the building's external structure in October 2021.",
    observed_change: "Official source-published topping-out milestone for City Quays 3.",
    event_type: "construction_milestone_topping_out",
    category: "architecture_public_estate",
    date: "2021-10-05",
    effective_date: "2021-10-05",
    effective_date_range: {
      start: "2021-10-05",
      end: "2021-10-05",
      precision: "day",
      basis: "Belfast Harbour article:published_time metadata"
    },
    geometry: null,
    geometry_ref: {
      type: "address_or_site_reference",
      label: "City Quays 3, City Quays waterfront development, Belfast Harbour, Belfast",
      source_url: "https://www.belfast-harbour.co.uk/news/city-quays-3-topping-out-303/",
      precision: "source-stated project/site reference only; no official coordinate or footprint extracted in Round431"
    },
    address_ref: "City Quays 3, City Quays waterfront development, Belfast Harbour, Belfast",
    source_name: "Belfast Harbour and Farrans Construction Reach Topping Out Milestone on City Quays 3",
    publisher: "Belfast Harbour Commissioners",
    source_url: "https://www.belfast-harbour.co.uk/news/city-quays-3-topping-out-303/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-city-quays-3-topping-out-303",
    source_date_field: "article:published_time metadata",
    source_date_value: "2021-10-05",
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    terms: BELFAST_HARBOUR_TERMS_URL,
    license_url: BELFAST_HARBOUR_TERMS_URL,
    publisher_terms_url: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records a topping-out and external-structure milestone only.",
      "It is not treated as building completion, opening, occupation, or delivery of possible future benefits.",
      "No official coordinate or building footprint was extracted in this sweep."
    ],
    evidence_basis: [
      "Official Belfast Harbour page states Farrans Construction topped out on City Quays 3.",
      "Date taken from page article:published_time metadata."
    ],
    duplicate_check_terms: [
      "bfs_arch_round431_city_quays_3_topping_out_2021",
      "https://www.belfast-harbour.co.uk/news/city-quays-3-topping-out-303/",
      "belfast-harbour-news-city-quays-3-topping-out-303",
      "City Quays 3 topping-out",
      "Topping Out Milestone on City Quays 3 2021-10-05"
    ],
    duplicate_review: "No exact id, source URL, source record, or same title/date event found in prior Belfast candidate packs or the live/manual corpus. Existing City Quays 3 planning/completion records are related project stages, not this topping-out source event.",
    provenance_links: [
      {
        rel: "primary_source",
        href: "https://www.belfast-harbour.co.uk/news/city-quays-3-topping-out-303/"
      },
      {
        rel: "terms",
        href: BELFAST_HARBOUR_TERMS_URL
      }
    ]
  },
  {
    id: "bfs_arch_round431_qub_ireach_contract_award_2024",
    city_id: CITY_ID,
    title: "iREACH Health construction contract was awarded",
    summary: "Queen's University Belfast reported that Graham had been awarded the main construction contract for the iREACH Health clinical research innovation centre in December 2024.",
    observed_change: "Official source-published contract-award milestone for the planned iREACH Health buildings beside Belfast City Hospital.",
    event_type: "contract_award",
    category: "architecture_public_estate",
    date: "2024-12-10",
    effective_date: "2024-12-10",
    effective_date_range: {
      start: "2024-12-10",
      end: "2024-12-10",
      precision: "day",
      basis: "Queen's University Belfast news date"
    },
    geometry: null,
    geometry_ref: {
      type: "address_or_campus_reference",
      label: "beside Belfast City Hospital, Belfast",
      source_url: "https://www.qub.ac.uk/News/Allnews/2024/Graham-awarded-contract-for-new-iREACH-Health-clinical-research-innovation-centre.html",
      precision: "source-stated location reference only; no official coordinate or footprint extracted in Round431"
    },
    address_ref: "beside Belfast City Hospital, Belfast",
    source_name: "Graham awarded contract for new iREACH Health clinical research innovation centre",
    publisher: "Queen's University Belfast",
    source_url: "https://www.qub.ac.uk/News/Allnews/2024/Graham-awarded-contract-for-new-iREACH-Health-clinical-research-innovation-centre.html",
    source_type: "official university news page",
    source_record_id: "qub-news-3414347",
    source_date_field: "official university news date",
    source_date_value: "2024-12-10",
    license: "Queen's University Belfast website copyright/terms; used here as factual citation metadata.",
    terms: QUB_TERMS_URL,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records a contract-award milestone only.",
      "The source mentions expected start/operation dates and possible benefits, but this candidate does not treat those as observed outcomes.",
      "No official coordinate or building footprint was extracted in this sweep."
    ],
    evidence_basis: [
      "Official university page identifies the Graham contract award and the location beside Belfast City Hospital.",
      "Date taken from the Queen's University Belfast news date."
    ],
    duplicate_check_terms: [
      "bfs_arch_round431_qub_ireach_contract_award_2024",
      "https://www.qub.ac.uk/News/Allnews/2024/Graham-awarded-contract-for-new-iREACH-Health-clinical-research-innovation-centre.html",
      "qub-news-3414347",
      "iREACH Health construction contract",
      "Graham awarded contract iREACH Health 2024-12-10"
    ],
    duplicate_review: "No exact id, source URL, source record, or same title/date event found in prior Belfast candidate packs or the live/manual corpus. Existing iREACH planning and construction-start records are related project stages, not this contract-award source event.",
    provenance_links: [
      {
        rel: "primary_source",
        href: "https://www.qub.ac.uk/News/Allnews/2024/Graham-awarded-contract-for-new-iREACH-Health-clinical-research-innovation-centre.html"
      },
      {
        rel: "terms",
        href: QUB_TERMS_URL
      }
    ]
  },
  {
    id: "bfs_arch_round431_edenderry_nursery_works_began_2016",
    city_id: CITY_ID,
    title: "Edenderry Nursery School new-build works began",
    summary: "The Department of Education reported that work had begun on the new Edenderry Nursery School in Belfast in March 2016.",
    observed_change: "Official source-published commencement milestone for a new nursery school building.",
    event_type: "construction_commencement",
    category: "architecture_public_estate",
    date: "2016-03-10",
    effective_date: "2016-03-10",
    effective_date_range: {
      start: "2016-03-10",
      end: "2016-03-10",
      precision: "day",
      basis: "Department of Education Date published and article text"
    },
    geometry: null,
    geometry_ref: {
      type: "source_stated_junction",
      label: "junction of Lanark Way and Mayo Link, Belfast",
      source_url: "https://www.education-ni.gov.uk/news/odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
      precision: "source-stated junction reference only; no official coordinate or footprint extracted in Round431"
    },
    address_ref: "junction of Lanark Way and Mayo Link, Belfast",
    source_name: "O'Dowd marks commencement of GBP1.3million building work at Edenderry Nursery school",
    publisher: "Department of Education, Northern Ireland",
    source_url: "https://www.education-ni.gov.uk/news/odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
    source_type: "official government news page",
    source_record_id: "de-odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
    source_date_field: "Date published",
    source_date_value: "2016-03-10",
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    terms: DE_CROWN_COPYRIGHT_URL,
    license_url: OGL_URL,
    publisher_terms_url: DE_CROWN_COPYRIGHT_URL,
    attribution: "Department of Education, Northern Ireland",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records commencement of building work only.",
      "It is not treated as completion, opening, pupil outcome, or wider social impact.",
      "No official coordinate or building footprint was extracted in this sweep."
    ],
    evidence_basis: [
      "Official Department of Education page states work began on the new Edenderry Nursery School site.",
      "Date taken from the Department of Education Date published field."
    ],
    duplicate_check_terms: [
      "bfs_arch_round431_edenderry_nursery_works_began_2016",
      "https://www.education-ni.gov.uk/news/odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
      "de-odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school",
      "Edenderry Nursery School new-build works began",
      "Edenderry Nursery School 2016-03-10"
    ],
    duplicate_review: "No exact id, source URL, source record, or same title/date event found in prior Belfast candidate packs or the live/manual corpus. Raw planning/statistics and OSM references to Edenderry Nursery are location context only, not this source event.",
    provenance_links: [
      {
        rel: "primary_source",
        href: "https://www.education-ni.gov.uk/news/odowd-marks-commencement-ps13million-building-work-edenderry-nursery-school"
      },
      {
        rel: "license",
        href: OGL_URL
      },
      {
        rel: "publisher_terms",
        href: DE_CROWN_COPYRIGHT_URL
      }
    ]
  }
];

const REJECTED = [
  {
    id: "round431_reject_city_quays_2_completion_duplicate",
    title: "City Quays 2 office building completion",
    observed_or_candidate_date: "2017-09-28",
    city_id: CITY_ID,
    publisher: "Belfast Harbour Commissioners",
    source_name: "Belfast Harbour Completes Second Major City Quays Office Building",
    source_url: "https://www.belfast-harbour.co.uk/news/belfast-harbour-completes-second-major-city-quays-office-buildin-177/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-city-quays-office-buildin-177",
    reason: "Rejected as duplicate: the live/manual corpus already contains a City Quays 2 completion event on the same project/date class, even though this official source URL itself was not yet used.",
    duplicate_check_terms: [
      "City Quays 2 completed",
      "City Quays 2 completion",
      "belfast-harbour-completes-second-major-city-quays-office-buildin-177",
      "2017-09-28"
    ],
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    terms: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round431_reject_ac_hotel_city_quays_launch_duplicate",
    title: "AC Hotel Belfast launch at City Quays",
    observed_or_candidate_date: "2018-06-22",
    city_id: CITY_ID,
    publisher: "Belfast Harbour Commissioners",
    source_name: "AC Hotel Belfast Flagship Feature of City Quays Development",
    source_url: "https://www.belfast-harbour.co.uk/news/ac-hotel-belfast-flagship-feature-of-city-quays-development-205/",
    source_type: "official public-estate owner news page",
    source_record_id: "belfast-harbour-news-ac-hotel-belfast-flagship-feature-205",
    reason: "Rejected as duplicate: this exact source URL and AC Hotel/City Quays launch already appear in the live/manual corpus.",
    duplicate_check_terms: [
      "AC Hotel Belfast",
      "ac-hotel-belfast-flagship-feature-of-city-quays-development-205",
      "City Quays hotel",
      "2018-06-22"
    ],
    license: "Belfast Harbour Commissioners website copyright/terms; used here as factual citation metadata.",
    terms: BELFAST_HARBOUR_TERMS_URL,
    attribution: "Belfast Harbour Commissioners",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round431_reject_colaiste_feirste_works_duplicate",
    title: "Colaiste Feirste capital works progress/start",
    observed_or_candidate_date: "2016-06-02",
    city_id: CITY_ID,
    publisher: "Department of Education, Northern Ireland",
    source_name: "Minister Weir views GBP15.5million work at Colaiste Feirste, Belfast",
    source_url: "https://www.education-ni.gov.uk/news/minister-weir-views-ps155million-work-colaiste-feirste-belfast",
    source_type: "official government news page",
    source_record_id: "de-minister-weir-views-ps155million-work-colaiste-feirste-belfast",
    reason: "Rejected as duplicate: the live/manual corpus and prior candidate packs already contain the Colaiste Feirste works record/source.",
    duplicate_check_terms: [
      "Colaiste Feirste",
      "ps155million-work-colaiste-feirste-belfast",
      "Building work commenced on site on 8 February 2016"
    ],
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    terms: DE_CROWN_COPYRIGHT_URL,
    attribution: "Department of Education, Northern Ireland",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round431_reject_shankill_gateway_public_realm_duplicate",
    title: "Shankill Gateway Public Realm construction start",
    observed_or_candidate_date: "2026-03-25",
    city_id: CITY_ID,
    publisher: "Department for Communities, Northern Ireland",
    source_name: "Lyons announces start of construction on the Shankill Gateway Public Realm scheme",
    source_url: "https://www.communities-ni.gov.uk/news/lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    source_type: "official government news page",
    source_record_id: "dfc-lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
    reason: "Rejected as duplicate: prior Belfast candidate output already captured the same DfC Shankill Gateway public realm construction-start milestone.",
    duplicate_check_terms: [
      "Shankill Gateway Public Realm scheme",
      "lyons-announces-start-construction-shankill-gateway-public-realm-scheme",
      "Peter's Hill",
      "Agnes Street",
      "2026-03-25"
    ],
    license: "Crown copyright; Open Government Licence v3.0 unless otherwise stated.",
    terms: DFC_CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities, Northern Ireland",
    accessed_at: ACCESSED_AT
  }
];

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function writeJson(fileName, value) {
  fs.writeFileSync(
    path.join(OUT_DIR, fileName),
    `${JSON.stringify(sortObject(value), null, 2)}\n`,
    "utf8"
  );
}

function writeText(fileName, value) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), value, "utf8");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a3/g, "GBP")
    .replace(/\u00b2/g, "2")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&pound;/g, "GBP")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&ldquo;|&#8220;/g, '"')
    .replace(/&rdquo;|&#8221;/g, '"')
    .replace(/&ndash;|&#8211;/g, "-")
    .replace(/&mdash;|&#8212;/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function fetchSource(source) {
  const startedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(source.source_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9"
      }
    });
    clearTimeout(timer);

    const body = await response.text();
    const normalized = normalizeText(body);
    const marker_results = source.required_markers.map((marker) => ({
      marker,
      found: normalized.includes(normalizeText(marker))
    }));
    const marker_ok = marker_results.every((item) => item.found);
    const published_time =
      body.match(/article:published_time["'][^>]*content=["']([^"']+)/i)?.[1] ||
      body.match(/datePublished":"([^"]+)/i)?.[1] ||
      null;
    const modified_time =
      body.match(/article:modified_time["'][^>]*content=["']([^"']+)/i)?.[1] ||
      body.match(/dateModified":"([^"]+)/i)?.[1] ||
      null;

    return {
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      source_record_id: source.source_record_id,
      source_date_field: source.source_date_field,
      source_date_value: source.source_date_value,
      candidate_disposition: source.candidate_disposition,
      license: source.license,
      license_url: source.license_url,
      publisher_terms_url: source.publisher_terms_url,
      attribution: source.attribution,
      accessed_at: source.accessed_at,
      fetched_at: startedAt,
      fetch_ok: response.ok,
      http_status: response.status,
      final_url: response.url,
      content_sha256: sha256Text(body),
      content_length: body.length,
      marker_ok,
      marker_results,
      published_time,
      modified_time
    };
  } catch (error) {
    return {
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      source_record_id: source.source_record_id,
      source_date_field: source.source_date_field,
      source_date_value: source.source_date_value,
      candidate_disposition: source.candidate_disposition,
      license: source.license,
      license_url: source.license_url,
      publisher_terms_url: source.publisher_terms_url,
      attribution: source.attribution,
      accessed_at: source.accessed_at,
      fetched_at: startedAt,
      fetch_ok: false,
      http_status: null,
      final_url: null,
      content_sha256: null,
      content_length: 0,
      marker_ok: false,
      marker_results: source.required_markers.map((marker) => ({ marker, found: false })),
      error: `${error.name}: ${error.message}`
    };
  }
}

function walkFiles(root, files = []) {
  if (!fs.existsSync(root)) {
    return files;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      walkFiles(fullPath, files);
    } else if (/\.(json|ndjson|md|csv|js)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

let duplicateScanFilesCache = null;
const duplicateScanTextCache = new Map();

function listDuplicateScanFiles() {
  if (duplicateScanFilesCache) {
    return duplicateScanFilesCache;
  }
  const files = [];
  const roots = [
    path.join("data", "manual_drops", "architecture_milestones"),
    path.join("data", "derived", "2026"),
    path.join("web", "data", "city-atlas", "cities", "belfast"),
    path.join("tmp", "subagents")
  ];
  for (const root of roots) {
    walkFiles(root, files);
  }
  duplicateScanFilesCache = [...new Set(files)]
    .filter((file) => !file.includes(ROUND_ID))
    .filter((file) => {
      try {
        return fs.statSync(file).size <= 8 * 1024 * 1024;
      } catch {
        return false;
      }
    })
    .sort();
  return duplicateScanFilesCache;
}

function readDuplicateScanText(file) {
  if (!duplicateScanTextCache.has(file)) {
    duplicateScanTextCache.set(file, fs.readFileSync(file, "utf8"));
  }
  return duplicateScanTextCache.get(file);
}

function findTermHitsInFile(file, term) {
  const hits = [];
  const text = readDuplicateScanText(file);
  const lower = text.toLowerCase();
  const needle = String(term).toLowerCase();
  let index = lower.indexOf(needle);
  while (index >= 0 && hits.length < 3) {
    const start = Math.max(0, index - 90);
    const end = Math.min(text.length, index + term.length + 90);
    hits.push({
      path: file,
      context: text.slice(start, end).replace(/\s+/g, " ").trim()
    });
    index = lower.indexOf(needle, index + needle.length);
  }
  return hits;
}

function duplicateScanForItem(item) {
  const scanFiles = listDuplicateScanFiles();
  const terms = [
    ...(item.duplicate_check_terms || []),
    item.id,
    item.source_url,
    item.source_record_id,
    item.title,
    item.effective_date || item.observed_or_candidate_date
  ].filter(Boolean);
  const termResults = [];

  for (const term of [...new Set(terms)]) {
    const hits = [];
    for (const file of scanFiles) {
      const found = findTermHitsInFile(file, term);
      if (found.length) {
        hits.push(...found);
      }
      if (hits.length >= 10) {
        break;
      }
    }
    termResults.push({
      term,
      hit_count: hits.length,
      hits: hits.slice(0, 10)
    });
  }

  return {
    scanned_file_count: scanFiles.length,
    scanned_roots: [
      "data/manual_drops/architecture_milestones",
      "data/derived/2026",
      "web/data/city-atlas/cities/belfast",
      "tmp/subagents"
    ],
    terms: termResults,
    scanned_at: GENERATED_AT
  };
}

function dateForCompare(value) {
  if (!value) {
    return null;
  }
  const match = String(value).match(/\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\d{4}/);
  if (!match) {
    return null;
  }
  if (match[0].length === 4) {
    return `${match[0]}-01-01`;
  }
  if (match[0].length === 7) {
    return `${match[0]}-01`;
  }
  return match[0];
}

function inWindow(value) {
  const date = dateForCompare(value);
  return date && date >= DATE_WINDOW.start && date <= DATE_WINDOW.end;
}

function hasGeometryOrRef(candidate) {
  if (candidate.geometry) {
    return true;
  }
  if (candidate.geometry_ref && candidate.geometry_ref.label) {
    return true;
  }
  return Boolean(candidate.address_ref);
}

function validateCandidateRequiredFields(candidate) {
  const required = [
    "id",
    "city_id",
    "title",
    "summary",
    "date",
    "effective_date",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "terms",
    "attribution",
    "accessed_at",
    "method",
    "transformation_method",
    "confidence",
    "limitations"
  ];
  return required.filter((field) => {
    const value = candidate[field];
    return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  });
}

function validate(sourceAudit, duplicateScans) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sourceKeys = new Set();
  const titleDates = new Set();

  for (const candidate of ACCEPTED) {
    const missing = validateCandidateRequiredFields(candidate);
    if (missing.length) {
      errors.push({
        id: candidate.id,
        type: "missing_required_fields",
        fields: missing
      });
    }
    if (candidate.city_id !== CITY_ID) {
      errors.push({ id: candidate.id, type: "wrong_city_id", city_id: candidate.city_id });
    }
    if (ids.has(candidate.id)) {
      errors.push({ id: candidate.id, type: "duplicate_candidate_id" });
    }
    ids.add(candidate.id);

    const sourceKey = `${candidate.source_url}::${candidate.source_record_id}`;
    if (sourceKeys.has(sourceKey)) {
      errors.push({ id: candidate.id, type: "duplicate_source_url_record", sourceKey });
    }
    sourceKeys.add(sourceKey);

    const titleDate = `${normalizeText(candidate.title)}::${candidate.effective_date}`;
    if (titleDates.has(titleDate)) {
      errors.push({ id: candidate.id, type: "duplicate_title_date", titleDate });
    }
    titleDates.add(titleDate);

    if (!inWindow(candidate.effective_date)) {
      errors.push({
        id: candidate.id,
        type: "date_outside_window",
        effective_date: candidate.effective_date
      });
    }
    if (!hasGeometryOrRef(candidate)) {
      errors.push({ id: candidate.id, type: "missing_geometry_or_geometry_ref" });
    }

    const text = normalizeText(
      [
        candidate.title,
        candidate.summary,
        candidate.observed_change,
        candidate.event_type,
        ...(candidate.limitations || [])
      ].join(" ")
    );
    const forbidden = [
      "predict",
      "forecast",
      "simulate",
      "simulation",
      "will increase",
      "will decrease",
      "caused",
      "proves",
      "impact score",
      "10-year"
    ];
    const foundForbidden = forbidden.filter((term) => text.includes(term));
    if (foundForbidden.length) {
      errors.push({
        id: candidate.id,
        type: "overclaim_language",
        terms: foundForbidden
      });
    }

    if (!duplicateScans.accepted[candidate.id]) {
      errors.push({ id: candidate.id, type: "missing_duplicate_scan" });
    }
  }

  for (const source of SOURCES.filter((item) => item.candidate_disposition === "accepted")) {
    const audit = sourceAudit.sources.find((item) => item.source_id === source.source_id);
    if (!audit) {
      errors.push({ source_id: source.source_id, type: "missing_source_audit" });
      continue;
    }
    if (!audit.fetch_ok) {
      errors.push({ source_id: source.source_id, type: "source_fetch_failed", status: audit.http_status });
    }
    if (!audit.marker_ok) {
      errors.push({
        source_id: source.source_id,
        type: "source_marker_check_failed",
        missing_markers: audit.marker_results.filter((item) => !item.found).map((item) => item.marker)
      });
    }
  }

  for (const rejected of REJECTED) {
    if (!duplicateScans.rejected[rejected.id]) {
      errors.push({ id: rejected.id, type: "missing_rejected_duplicate_scan" });
    }
    if (!rejected.reason || !/duplicate|insufficient|rejected/i.test(rejected.reason)) {
      warnings.push({ id: rejected.id, type: "weak_rejection_reason" });
    }
  }

  return {
    ok: errors.length === 0,
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    candidate_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    date_window: DATE_WINDOW,
    errors,
    warnings,
    required_field_policy: {
      required_candidate_fields: [
        "stable id",
        "city_id",
        "title",
        "summary",
        "date/effective_date",
        "geometry or geometry_ref/address_ref",
        "source_name",
        "publisher",
        "source_url",
        "source_type",
        "source_record_id",
        "license/terms/attribution",
        "accessed_at",
        "method/transformation_method",
        "confidence",
        "limitations"
      ],
      confidence_values_used: [...new Set(ACCEPTED.map((item) => item.confidence))]
    },
    source_fetch_summary: {
      total_sources: sourceAudit.sources.length,
      accepted_sources: sourceAudit.sources.filter((item) => item.candidate_disposition === "accepted").length,
      fetch_ok: sourceAudit.sources.filter((item) => item.fetch_ok).length,
      marker_ok: sourceAudit.sources.filter((item) => item.marker_ok).length,
      accepted_fetch_ok: sourceAudit.sources
        .filter((item) => item.candidate_disposition === "accepted")
        .every((item) => item.fetch_ok),
      accepted_marker_ok: sourceAudit.sources
        .filter((item) => item.candidate_disposition === "accepted")
        .every((item) => item.marker_ok)
    }
  };
}

function buildSummary(validationReport, duplicateScans) {
  const candidateDates = ACCEPTED.map((item) => item.effective_date).sort();
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    date_window: DATE_WINDOW,
    candidate_count: ACCEPTED.length,
    rejected_count: REJECTED.length,
    candidate_date_range: {
      start: candidateDates[0] || null,
      end: candidateDates[candidateDates.length - 1] || null
    },
    source_publishers: [...new Set(ACCEPTED.map((item) => item.publisher))].sort(),
    rejected_publishers: [...new Set(REJECTED.map((item) => item.publisher))].sort(),
    accepted_ids: ACCEPTED.map((item) => item.id),
    rejected_ids: REJECTED.map((item) => item.id),
    source_urls: ACCEPTED.map((item) => item.source_url),
    validation_ok: validationReport.ok,
    duplicate_scan_file_count: Object.values(duplicateScans.accepted)[0]?.scanned_file_count || 0,
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    caveats: [
      "Administrative milestones are labelled as administrative/construction milestones, not completion or outcome claims.",
      "No unsourced coordinates were introduced; candidates use source-stated site/address references where official geometry was not extracted.",
      "The batch is intentionally conservative and excludes same-event official pages already represented in the live/manual corpus or prior Belfast packs."
    ]
  };
}

function buildNotes(summary, validationReport, sourceAudit, duplicateScans) {
  const lines = [];
  lines.push(`# ${ROUND_ID}`);
  lines.push("");
  lines.push(`Generated: ${GENERATED_AT}`);
  lines.push(`Accessed at: ${ACCESSED_AT}`);
  lines.push("");
  lines.push("## Scope");
  lines.push("");
  lines.push(
    `Official/public Belfast architecture-related sweep for ${DATE_WINDOW.start} through ${DATE_WINDOW.end}.`
  );
  lines.push(
    "Accepted records are conservative event milestones with provenance; rejected records document useful official pages that were already represented."
  );
  lines.push("");
  lines.push("## Accepted Candidates");
  lines.push("");
  for (const candidate of ACCEPTED) {
    lines.push(`- ${candidate.id}: ${candidate.title} (${candidate.effective_date})`);
    lines.push(`  - Publisher: ${candidate.publisher}`);
    lines.push(`  - Source: ${candidate.source_url}`);
    lines.push(`  - Caveat: ${candidate.limitations[0]}`);
    const scan = duplicateScans.accepted[candidate.id];
    const hitTerms = scan.terms.filter((term) => term.hit_count > 0).map((term) => term.term);
    lines.push(`  - Duplicate scan terms with hits: ${hitTerms.length ? hitTerms.join("; ") : "none"}`);
  }
  lines.push("");
  lines.push("## Rejected Official/Public Leads");
  lines.push("");
  for (const rejected of REJECTED) {
    lines.push(`- ${rejected.id}: ${rejected.title}`);
    lines.push(`  - Reason: ${rejected.reason}`);
    lines.push(`  - Source: ${rejected.source_url}`);
  }
  lines.push("");
  lines.push("## Source Audit");
  lines.push("");
  for (const source of sourceAudit.sources) {
    lines.push(
      `- ${source.source_id}: fetch_ok=${source.fetch_ok}, marker_ok=${source.marker_ok}, status=${source.http_status}, sha256=${source.content_sha256 || "n/a"}`
    );
  }
  lines.push("");
  lines.push("## Validation");
  lines.push("");
  lines.push(`Validation OK: ${validationReport.ok}`);
  if (validationReport.errors.length) {
    lines.push("");
    lines.push("Errors:");
    for (const error of validationReport.errors) {
      lines.push(`- ${JSON.stringify(error)}`);
    }
  }
  if (validationReport.warnings.length) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of validationReport.warnings) {
      lines.push(`- ${JSON.stringify(warning)}`);
    }
  }
  lines.push("");
  lines.push("## Caveats");
  lines.push("");
  for (const caveat of summary.caveats) {
    lines.push(`- ${caveat}`);
  }
  return `${lines.join("\n")}\n`;
}

function readbackFiles() {
  const files = [
    "candidates.json",
    "rejected.json",
    "source_audit.json",
    "summary.json",
    "validation.json",
    "validation_report.json",
    "notes.md"
  ];
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    files: files.map((fileName) => {
      const fullPath = path.join(OUT_DIR, fileName);
      const text = fs.readFileSync(fullPath, "utf8");
      let parsed_count = null;
      if (fileName.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsed_count = parsed.length;
        } else if (Array.isArray(parsed.sources)) {
          parsed_count = parsed.sources.length;
        }
      }
      return {
        file: fullPath,
        bytes: Buffer.byteLength(text),
        sha256: sha256Text(text),
        parsed_count
      };
    })
  };
}

async function main() {
  ensureOutDir();

  const duplicateScans = {
    accepted: Object.fromEntries(ACCEPTED.map((item) => [item.id, duplicateScanForItem(item)])),
    rejected: Object.fromEntries(REJECTED.map((item) => [item.id, duplicateScanForItem(item)]))
  };
  const sourceAudit = {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    source_count: SOURCES.length,
    accepted_source_count: SOURCES.filter((item) => item.candidate_disposition === "accepted").length,
    rejected_source_count: SOURCES.filter((item) => item.candidate_disposition !== "accepted").length,
    sources: await Promise.all(SOURCES.map(fetchSource))
  };

  const candidatesWithScans = ACCEPTED.map((candidate) => ({
    ...candidate,
    duplicate_scan: duplicateScans.accepted[candidate.id]
  }));
  const rejectedWithScans = REJECTED.map((rejected) => ({
    ...rejected,
    duplicate_scan: duplicateScans.rejected[rejected.id]
  }));

  const validationReport = validate(sourceAudit, duplicateScans);
  const summary = buildSummary(validationReport, duplicateScans);

  writeJson("candidates.json", candidatesWithScans);
  writeJson("rejected.json", rejectedWithScans);
  writeJson("source_audit.json", sourceAudit);
  writeJson("summary.json", summary);
  writeJson("validation.json", validationReport);
  writeJson("validation_report.json", validationReport);
  writeText("notes.md", buildNotes(summary, validationReport, sourceAudit, duplicateScans));
  writeJson("readback.json", readbackFiles());

  const readback = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "readback.json"), "utf8"));
  console.log(
    JSON.stringify(
      {
        ok: validationReport.ok,
        round_id: ROUND_ID,
        candidate_count: ACCEPTED.length,
        rejected_count: REJECTED.length,
        source_count: SOURCES.length,
        files: readback.files.map((item) => item.file)
      },
      null,
      2
    )
  );

  if (!validationReport.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
