#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round442_belfast_official_architecture_sweep_next16";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join(
  "scripts",
  "fetch_round442_belfast_official_architecture_sweep_next16_candidates.js"
);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const BELFAST_TRUST_COPYRIGHT_URL = "https://belfasttrust.hscni.net/copyright/";
const BELFAST_CITY_COUNCIL_TERMS_URL =
  "https://www.belfastcity.gov.uk/terms-conditions";
const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFC_CROWN_COPYRIGHT_URL =
  "https://www.communities-ni.gov.uk/articles/crown-copyright";
const QUB_TERMS_URL = "https://www.qub.ac.uk/Legal/";

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#manualOfficialPublicArchitectureSweepRound442`;
const METHOD = [
  "Manual official/public Belfast architecture sweep after Round431.",
  "Accepted only source-published facts from official public bodies or public-estate owners.",
  "Opening, sod-cutting and topping-out records are labelled as source-specific milestones only.",
  "No construction completion, opening, impact, service-performance, employment, health or causality claim is carried unless the official source directly supports that milestone."
].join(" ");

const SEARCH_QUERIES_CHECKED = [
  'site:belfasttrust.hscni.net "Topping Out Ceremony" "Critical Care Centre"',
  'site:belfasttrust.hscni.net "Sod-Cutting Ceremony" "Neurology Unit"',
  'site:belfasttrust.hscni.net "New Macmillan Information Centre Opens"',
  'site:belfasttrust.hscni.net Belfast Trust "opens" "new" "centre"',
  'site:communities-ni.gov.uk/news Belfast "officially opened" "new" "centre"',
  'site:belfastcity.gov.uk/news Belfast "officially opened" "new" "building"',
  "prior local corpus scan: data/manual_drops, data/derived/2026, web/data/city-atlas/cities/belfast, tmp/subagents"
];

const BELFAST_TRUST_LICENSE =
  "Belfast Health and Social Care Trust website copyright/disclaimer; factual citation metadata and source URL retained, no page text or media reproduced.";
const BCC_LICENSE =
  "Belfast City Council website terms/copyright; factual citation metadata and source URL retained, no page text or media reproduced.";
const OGL_LICENSE =
  "Crown copyright; Open Government Licence v3.0 unless otherwise stated.";
const QUB_LICENSE =
  "Queen's University Belfast website copyright/terms; factual citation metadata and source URL retained, no page text or media reproduced.";

const SOURCES = [
  {
    source_id: "belfast-trust-critical-care-topping-out-2011-round442",
    source_name: "Topping Out Ceremony at Critical Care Centre",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2011/12/15/topping-out-ceremony-at-critical-care-centre/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2011-12-15-critical-care-centre-topping-out",
    source_date_field: "page date and URL slug",
    source_date_value: "2011-12-15",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Topping Out Ceremony at Critical Care Centre",
      "15th December 2011",
      "performed the Topping Out ceremony at Phase 2B",
      "Critical Care Centre, Royal Victoria Hospital",
      "Construction of the Critical Care Building is due to be completed in 2012"
    ]
  },
  {
    source_id: "belfast-trust-neurology-unit-sod-cutting-2010-round442",
    source_name: "Sod-Cutting Ceremony At New Neurology Unit",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2010/12/13/sod-cutting-ceremony-at-new-neurology-unit/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2010-12-13-neurology-unit-sod-cutting",
    source_date_field: "page date and URL slug",
    source_date_value: "2010-12-13",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "Sod-Cutting Ceremony At New Neurology Unit",
      "13th December 2010",
      "cut the first sod at a new GBP4.9m purpose built Neurology Unit",
      "Musgrave Park Hospital",
      "adjacent and attached to the Regional Acquired Brain Injury Unit"
    ]
  },
  {
    source_id: "belfast-trust-macmillan-rvh-opening-2010-round442",
    source_name: "New Macmillan Information Centre Opens",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2010/11/01/new-macmillan-information-centre-opens/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2010-11-01-macmillan-rvh-information-centre-opening",
    source_date_field: "page date and URL slug",
    source_date_value: "2010-11-01",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "accepted",
    required_markers: [
      "New Macmillan Information Centre Opens",
      "1st November 2010",
      "performed the official opening of the Macmillan Drop-in Information Service",
      "Royal Victoria Hospital",
      "Located on the second floor of the main mall"
    ]
  },
  {
    source_id: "belfast-trust-horatios-garden-official-opening-2024-duplicate-round442",
    source_name: "Horatio's Garden Opens at Musgrave Park Hospital",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2024/06/18/horatios-garden-opens-at-musgrave-park-hospital/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2024-06-18-horatios-garden-official-opening",
    source_date_field: "page date and official-opening text",
    source_date_value: "2024-06-18",
    license: BELFAST_TRUST_LICENSE,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Horatio's Garden Opens at Musgrave Park Hospital",
      "officially opened in the Spinal Cord Injuries Unit",
      "It was completed at Christmas last year"
    ]
  },
  {
    source_id: "bcc-sandy-row-arts-digital-hub-opening-2026-duplicate-round442",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    source_record_id: "bcc-news-sandy-row-arts-digital-hub-2026-02-18",
    source_date_field: "Date",
    source_date_value: "2026-02-18",
    license: BCC_LICENSE,
    license_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    publisher_terms_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "Boost for Sandy Row as new Arts & Digital Hub opens",
      "officially opened by the Lord Mayor",
      "Sandy Row Arts & Digital Hub"
    ]
  },
  {
    source_id: "bcc-black-mountain-shared-space-opening-2024-duplicate-round442",
    source_name: "GBP7 million shared community space opens at Belfast interface area",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/News/%C2%A37-million-shared-community-space-opens-at-Belfast",
    source_type: "official council news page",
    source_record_id: "bcc-news-black-mountain-shared-space-opening-2024-09-18",
    source_date_field: "Date",
    source_date_value: "2024-09-18",
    license: BCC_LICENSE,
    license_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    publisher_terms_url: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "shared community building has been officially opened",
      "Black Mountain Shared Space",
      "former Finlay"
    ]
  },
  {
    source_id: "dfc-ionad-na-fuiseoige-opening-2019-duplicate-round442",
    source_name: "New GBP2.1 million family centre opens in Twinbrook, Belfast",
    publisher: "Department for Communities, Northern Ireland",
    source_url:
      "https://www.communities-ni.gov.uk/news/new-ps21-million-family-centre-opens-twinbrook-belfast",
    source_type: "official government news page",
    source_record_id: "dfc-new-ps21-million-family-centre-opens-twinbrook-belfast",
    source_date_field: "Date published",
    source_date_value: "2019-03-05",
    license: OGL_LICENSE,
    license_url: OGL_URL,
    publisher_terms_url: DFC_CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities, Northern Ireland",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "New GBP2.1 million family centre opens in Twinbrook",
      "officially opened",
      "Ionad na Fuiseoige"
    ]
  },
  {
    source_id: "qub-nie-networks-lab-opening-2022-duplicate-round442",
    source_name:
      "NIE Networks Sustainable Energy Laboratory officially opens at Queen's University Belfast",
    publisher: "Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2022/NIENetworksSustainableEnergyLaboratoryofficiallyopensatQueens.html",
    source_type: "official university news page",
    source_record_id: "qub-news-nie-networks-sustainable-energy-laboratory-2022-11-10",
    source_date_field: "official university news date",
    source_date_value: "2022-11-10",
    license: QUB_LICENSE,
    license_url: QUB_TERMS_URL,
    publisher_terms_url: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT,
    candidate_disposition: "rejected_duplicate",
    required_markers: [
      "NIE Networks Sustainable Energy Laboratory officially opens",
      "Queen's University Belfast",
      "10 November, 2022",
      "Ashby Building in Stranmillis"
    ]
  }
];

const ACCEPTED = [
  {
    id: "bfs_arch_round442_rvh_critical_care_centre_topping_out_2011",
    city_id: CITY_ID,
    title: "Royal Victoria Hospital Critical Care Centre topping-out ceremony was held",
    summary:
      "Belfast Health and Social Care Trust recorded that Health Minister Edwin Poots performed the topping-out ceremony at Phase 2B, Critical Care Centre, Royal Victoria Hospital, on 15 December 2011.",
    observed_change:
      "Official source-published topping-out milestone for Phase 2B of the Critical Care Centre at Royal Victoria Hospital.",
    event_type: "construction_milestone_topping_out",
    category: "architecture_public_estate",
    date: "2011-12-15",
    effective_date: "2011-12-15",
    effective_date_range: {
      start: "2011-12-15",
      end: "2011-12-15",
      precision: "day",
      basis: "Belfast Trust page date and URL slug"
    },
    geometry: null,
    geometry_ref: {
      type: "source_stated_hospital_project_reference",
      label: "Phase 2B, Critical Care Centre, Royal Victoria Hospital, Belfast",
      source_url:
        "https://belfasttrust.hscni.net/2011/12/15/topping-out-ceremony-at-critical-care-centre/",
      precision:
        "source-stated hospital/project reference only; no official coordinate or footprint extracted in Round442"
    },
    address_ref: "Phase 2B, Critical Care Centre, Royal Victoria Hospital, Belfast",
    source_name: "Topping Out Ceremony at Critical Care Centre",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2011/12/15/topping-out-ceremony-at-critical-care-centre/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2011-12-15-critical-care-centre-topping-out",
    source_date_field: "page date and URL slug",
    source_date_value: "2011-12-15",
    license: BELFAST_TRUST_LICENSE,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records a topping-out ceremony only.",
      "The source refers to expected future completion, but this candidate does not assert completion, opening, occupation, service availability or health outcomes.",
      "No official coordinate or building footprint was extracted in this sweep."
    ],
    evidence_basis: [
      "Official Belfast Trust page identifies the topping-out ceremony and the Critical Care Centre/Royal Victoria Hospital site.",
      "Effective date is taken from the page date and URL slug."
    ],
    duplicate_check_terms: [
      "bfs_arch_round442_rvh_critical_care_centre_topping_out_2011",
      "https://belfasttrust.hscni.net/2011/12/15/topping-out-ceremony-at-critical-care-centre/",
      "belfast-trust-2011-12-15-critical-care-centre-topping-out",
      "Topping Out Ceremony at Critical Care Centre",
      "Royal Victoria Hospital Critical Care Centre topping-out 2011-12-15"
    ],
    duplicate_review:
      "No exact id, source URL, source record, or same title/date event found in the live/manual corpus or prior Belfast packs. The 2020 helipad event at the Critical Care Building is a different later facility milestone.",
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://belfasttrust.hscni.net/2011/12/15/topping-out-ceremony-at-critical-care-centre/"
      },
      {
        rel: "terms",
        href: BELFAST_TRUST_COPYRIGHT_URL
      }
    ]
  },
  {
    id: "bfs_arch_round442_musgrave_neurology_unit_sod_cutting_2010",
    city_id: CITY_ID,
    title: "Musgrave Park Hospital neurology unit sod-cutting ceremony was held",
    summary:
      "Belfast Health and Social Care Trust recorded that Health Minister Michael McGimpsey cut the first sod for a new purpose-built Neurology Unit at Musgrave Park Hospital on 13 December 2010.",
    observed_change:
      "Official source-published sod-cutting milestone for a planned Neurology Unit at Musgrave Park Hospital.",
    event_type: "construction_commencement_ceremony",
    category: "architecture_public_estate",
    date: "2010-12-13",
    effective_date: "2010-12-13",
    effective_date_range: {
      start: "2010-12-13",
      end: "2010-12-13",
      precision: "day",
      basis: "Belfast Trust page date and URL slug"
    },
    geometry: null,
    geometry_ref: {
      type: "source_stated_hospital_project_reference",
      label:
        "New Neurology Unit adjacent and attached to the Regional Acquired Brain Injury Unit, Musgrave Park Hospital, Belfast",
      source_url:
        "https://belfasttrust.hscni.net/2010/12/13/sod-cutting-ceremony-at-new-neurology-unit/",
      precision:
        "source-stated hospital/project reference only; no official coordinate or footprint extracted in Round442"
    },
    address_ref:
      "New Neurology Unit adjacent and attached to the Regional Acquired Brain Injury Unit, Musgrave Park Hospital, Belfast",
    source_name: "Sod-Cutting Ceremony At New Neurology Unit",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2010/12/13/sod-cutting-ceremony-at-new-neurology-unit/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2010-12-13-neurology-unit-sod-cutting",
    source_date_field: "page date and URL slug",
    source_date_value: "2010-12-13",
    license: BELFAST_TRUST_LICENSE,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records a sod-cutting/commencement ceremony only.",
      "It is not treated as completion, opening, occupation, service capacity, patient benefit or health outcome evidence.",
      "No official coordinate or building footprint was extracted in this sweep."
    ],
    evidence_basis: [
      "Official Belfast Trust page identifies the sod-cutting for the Neurology Unit at Musgrave Park Hospital.",
      "Effective date is taken from the page date and URL slug."
    ],
    duplicate_check_terms: [
      "bfs_arch_round442_musgrave_neurology_unit_sod_cutting_2010",
      "https://belfasttrust.hscni.net/2010/12/13/sod-cutting-ceremony-at-new-neurology-unit/",
      "belfast-trust-2010-12-13-neurology-unit-sod-cutting",
      "Sod-Cutting Ceremony At New Neurology Unit",
      "Musgrave Park Hospital neurology unit sod-cutting 2010-12-13"
    ],
    duplicate_review:
      "No exact id, source URL, source record, or same title/date event found in the live/manual corpus or prior Belfast packs. Other Musgrave Park events are separate facilities or later milestones.",
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://belfasttrust.hscni.net/2010/12/13/sod-cutting-ceremony-at-new-neurology-unit/"
      },
      {
        rel: "terms",
        href: BELFAST_TRUST_COPYRIGHT_URL
      }
    ]
  },
  {
    id: "bfs_arch_round442_rvh_macmillan_information_centre_opening_2010",
    city_id: CITY_ID,
    title: "Macmillan Drop-in Information Service opened at Royal Victoria Hospital",
    summary:
      "Belfast Health and Social Care Trust recorded that Trust Chairman Pat McCartan performed the official opening of the Macmillan Drop-in Information Service at Royal Victoria Hospital on 1 November 2010.",
    observed_change:
      "Official source-published opening milestone for the Macmillan Drop-in Information Service in Royal Victoria Hospital.",
    event_type: "facility_opening_official",
    category: "architecture_public_estate",
    date: "2010-11-01",
    effective_date: "2010-11-01",
    effective_date_range: {
      start: "2010-11-01",
      end: "2010-11-01",
      precision: "day",
      basis: "Belfast Trust page date and URL slug"
    },
    geometry: null,
    geometry_ref: {
      type: "source_stated_hospital_location_reference",
      label:
        "second floor of the main mall, Royal Victoria Hospital, Belfast",
      source_url:
        "https://belfasttrust.hscni.net/2010/11/01/new-macmillan-information-centre-opens/",
      precision:
        "source-stated internal hospital location only; no official coordinate or footprint extracted in Round442"
    },
    address_ref: "second floor of the main mall, Royal Victoria Hospital, Belfast",
    source_name: "New Macmillan Information Centre Opens",
    publisher: "Belfast Health and Social Care Trust",
    source_url:
      "https://belfasttrust.hscni.net/2010/11/01/new-macmillan-information-centre-opens/",
    source_type: "official health trust news page",
    source_record_id:
      "belfast-trust-2010-11-01-macmillan-rvh-information-centre-opening",
    source_date_field: "page date and URL slug",
    source_date_value: "2010-11-01",
    license: BELFAST_TRUST_LICENSE,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    license_url: BELFAST_TRUST_COPYRIGHT_URL,
    publisher_terms_url: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT,
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    confidence: "documented",
    limitations: [
      "This records the official opening of an internal hospital information-service centre only.",
      "It is not treated as evidence of wider hospital estate renewal, clinical capacity, service usage or patient outcome.",
      "No official coordinate, room footprint or floorplan was extracted in this sweep."
    ],
    evidence_basis: [
      "Official Belfast Trust page identifies the Macmillan Drop-in Information Service opening and its Royal Victoria Hospital internal location.",
      "Effective date is taken from the page date and URL slug."
    ],
    duplicate_check_terms: [
      "bfs_arch_round442_rvh_macmillan_information_centre_opening_2010",
      "https://belfasttrust.hscni.net/2010/11/01/new-macmillan-information-centre-opens/",
      "belfast-trust-2010-11-01-macmillan-rvh-information-centre-opening",
      "New Macmillan Information Centre Opens",
      "Macmillan Drop-in Information Service Royal Victoria Hospital 2010-11-01"
    ],
    duplicate_review:
      "No exact id, source URL, source record, or same title/date event found in the live/manual corpus or prior Belfast packs. Existing cancer-centre records are separate facilities or source paths.",
    provenance_links: [
      {
        rel: "primary_source",
        href:
          "https://belfasttrust.hscni.net/2010/11/01/new-macmillan-information-centre-opens/"
      },
      {
        rel: "terms",
        href: BELFAST_TRUST_COPYRIGHT_URL
      }
    ]
  }
];

const REJECTED = [
  {
    id: "round442_reject_horatios_garden_official_opening_near_duplicate",
    title: "Horatio's Garden official opening at Musgrave Park Hospital",
    observed_or_candidate_date: "2024-06-18",
    city_id: CITY_ID,
    publisher: "Belfast Health and Social Care Trust",
    source_name: "Horatio's Garden Opens at Musgrave Park Hospital",
    source_url:
      "https://belfasttrust.hscni.net/2024/06/18/horatios-garden-opens-at-musgrave-park-hospital/",
    source_type: "official health trust news page",
    source_record_id: "belfast-trust-2024-06-18-horatios-garden-official-opening",
    reason:
      "Rejected as a near-duplicate delivered-stage milestone: the live/manual corpus already contains Horatio's Garden Northern Ireland opening at Musgrave Park Hospital, and the Trust page states the garden was completed at Christmas 2023 before the 2024 ceremony.",
    duplicate_check_terms: [
      "Horatio's Garden Northern Ireland opened at Musgrave Park Hospital",
      "bfs_arch_horatios_garden_northern_ireland_opening_2023",
      "horatios-garden-northern-ireland-first-opening-2023-12-21"
    ],
    license: BELFAST_TRUST_LICENSE,
    terms: BELFAST_TRUST_COPYRIGHT_URL,
    attribution: "Belfast Health and Social Care Trust",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round442_reject_sandy_row_arts_digital_hub_duplicate",
    title: "Sandy Row Arts and Digital Hub official opening",
    observed_or_candidate_date: "2026-02-18",
    city_id: CITY_ID,
    publisher: "Belfast City Council",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    source_url:
      "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    source_record_id: "bcc-news-sandy-row-arts-digital-hub-2026-02-18",
    reason:
      "Rejected as duplicate: prior Belfast packs and the live/manual corpus already represent Sandy Row Arts and Digital Hub opening/progress milestones.",
    duplicate_check_terms: [
      "Sandy Row Arts and Digital Hub",
      "sandy_row_arts_digital_hub",
      "boost-for-sandy-row-as-new-arts-digital-hub-opens"
    ],
    license: BCC_LICENSE,
    terms: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round442_reject_black_mountain_shared_space_duplicate",
    title: "Black Mountain Shared Space official opening",
    observed_or_candidate_date: "2024-09-18",
    city_id: CITY_ID,
    publisher: "Belfast City Council",
    source_name: "GBP7 million shared community space opens at Belfast interface area",
    source_url:
      "https://www.belfastcity.gov.uk/News/%C2%A37-million-shared-community-space-opens-at-Belfast",
    source_type: "official council news page",
    source_record_id: "bcc-news-black-mountain-shared-space-opening-2024-09-18",
    reason:
      "Rejected as duplicate: Black Mountain Shared Space approval/opening records are already present in the live corpus and prior Belfast packs.",
    duplicate_check_terms: [
      "Black Mountain Shared Space officially opened",
      "bfs_arch_black_mountain_shared_space_opening_2024",
      "7-million-shared-community-space-opens-at-Belfast"
    ],
    license: BCC_LICENSE,
    terms: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round442_reject_ionad_na_fuiseoige_duplicate",
    title: "Ionad na Fuiseoige family centre opened in Twinbrook",
    observed_or_candidate_date: "2019-03-05",
    city_id: CITY_ID,
    publisher: "Department for Communities, Northern Ireland",
    source_name: "New GBP2.1 million family centre opens in Twinbrook, Belfast",
    source_url:
      "https://www.communities-ni.gov.uk/news/new-ps21-million-family-centre-opens-twinbrook-belfast",
    source_type: "official government news page",
    source_record_id: "dfc-new-ps21-million-family-centre-opens-twinbrook-belfast",
    reason:
      "Rejected as duplicate: the live/manual corpus already contains the Ionad na Fuiseoige family-centre opening using the Department for Communities source.",
    duplicate_check_terms: [
      "Ionad na Fuiseoige family centre opened in Twinbrook",
      "bfs_arch_ionad_na_fuiseoige_family_centre_opening_2019",
      "new-ps21-million-family-centre-opens-twinbrook-belfast"
    ],
    license: OGL_LICENSE,
    terms: DFC_CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities, Northern Ireland",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round442_reject_nie_networks_sustainable_energy_lab_duplicate",
    title: "NIE Networks Sustainable Energy Laboratory opened at Queen's University Belfast",
    observed_or_candidate_date: "2022-11-10",
    city_id: CITY_ID,
    publisher: "Queen's University Belfast",
    source_name:
      "NIE Networks Sustainable Energy Laboratory officially opens at Queen's University Belfast",
    source_url:
      "https://www.qub.ac.uk/News/Allnews/2022/NIENetworksSustainableEnergyLaboratoryofficiallyopensatQueens.html",
    source_type: "official university news page",
    source_record_id: "qub-news-nie-networks-sustainable-energy-laboratory-2022-11-10",
    reason:
      "Rejected as duplicate: the live 2022 Belfast corpus already contains the NIE Networks Sustainable Energy Laboratory opening event.",
    duplicate_check_terms: [
      "NIE Networks Sustainable Energy Laboratory opened at Queen's University Belfast",
      "bfs_arch_nie_networks_sustainable_energy_lab_opening_2022",
      "NIENetworksSustainableEnergyLaboratoryofficiallyopensatQueens"
    ],
    license: QUB_LICENSE,
    terms: QUB_TERMS_URL,
    attribution: "Queen's University Belfast",
    accessed_at: ACCESSED_AT
  },
  {
    id: "round442_reject_belfast_zoo_visitor_centre_insufficient_actual_date",
    title: "Belfast Zoo visitor centre and entrance opening",
    observed_or_candidate_date: "2009-04",
    city_id: CITY_ID,
    publisher: "Belfast City Council",
    source_name: "Belfast Zoological Gardens - Opening of Visitor Centre",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/s25383/Belfast%20Zoological%20Gardens%20-%20Opening%20of%20Visitor%20Centre.pdf",
    source_type: "official council committee report PDF",
    source_record_id: "bcc-zoo-visitor-centre-opening-report-2009",
    reason:
      "Rejected for this batch: the official report proposed a mid-April 2009 opening and later committee material says the visitor centre and entrance opened in 2009, but this sweep did not find a source-backed actual day-level opening record.",
    duplicate_check_terms: [
      "Belfast Zoo visitor centre",
      "new visitor centre and entrance",
      "Belfast Zoological Gardens Opening of Visitor Centre"
    ],
    license: BCC_LICENSE,
    terms: BELFAST_CITY_COUNCIL_TERMS_URL,
    attribution: "Belfast City Council",
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
    .replace(/\u00a0/g, " ")
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
  const fetchedAt = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(source.source_url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8",
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
      fetched_at: fetchedAt,
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
      fetched_at: fetchedAt,
      fetch_ok: false,
      http_status: null,
      final_url: null,
      content_sha256: null,
      content_length: 0,
      marker_ok: false,
      marker_results: source.required_markers.map((marker) => ({
        marker,
        found: false
      })),
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
      continue;
    }
    if (/\.(json|ndjson|md|csv|js)$/i.test(entry.name)) {
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
  const roots = [
    path.join("data", "manual_drops", "architecture_milestones"),
    path.join("data", "derived", "2026"),
    path.join("web", "data", "city-atlas", "cities", "belfast"),
    path.join("tmp", "subagents")
  ];
  const files = [];
  for (const root of roots) {
    walkFiles(root, files);
  }
  duplicateScanFilesCache = [...new Set(files)]
    .filter((file) => !file.includes(ROUND_ID))
    .filter((file) => {
      try {
        return fs.statSync(file).size <= 10 * 1024 * 1024;
      } catch {
        return false;
      }
    });
  return duplicateScanFilesCache;
}

function readScanFile(file) {
  if (!duplicateScanTextCache.has(file)) {
    duplicateScanTextCache.set(file, normalizeText(fs.readFileSync(file, "utf8")));
  }
  return duplicateScanTextCache.get(file);
}

function findLocalHits(terms) {
  const hits = [];
  const normalizedTerms = terms
    .map((term) => normalizeText(term))
    .filter((term) => term.length >= 12);
  for (const file of listDuplicateScanFiles()) {
    const text = readScanFile(file);
    for (const term of normalizedTerms) {
      const index = text.indexOf(term);
      if (index !== -1) {
        hits.push({
          term,
          file,
          index
        });
        break;
      }
    }
    if (hits.length >= 25) {
      break;
    }
  }
  return hits;
}

function enrichDuplicateInfo(record) {
  return {
    ...record,
    duplicate_scan_hits: findLocalHits(record.duplicate_check_terms || [])
  };
}

function dateInWindow(date) {
  return date >= DATE_WINDOW.start && date <= DATE_WINDOW.end;
}

function validate(candidates, rejected, sourceAudit) {
  const errors = [];
  const warnings = [];
  const candidateIds = new Set();
  const sourceUrls = new Set();
  const sourceRecords = new Set();
  const titleDates = new Set();
  const requiredFields = [
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
  const forbiddenPatterns = [
    /\bwill increase\b/i,
    /\bwill decrease\b/i,
    /\bcaused\b/i,
    /\bproves\b/i,
    /\bpredict/i,
    /\bsimulation\b/i,
    /\bimpact score\b/i
  ];

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.id || "(unknown)"} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.id} city_id must be ${CITY_ID}`);
    }
    if (!dateInWindow(candidate.effective_date)) {
      errors.push(`${candidate.id} effective_date outside requested window`);
    }
    if (!candidate.geometry && !candidate.geometry_ref) {
      errors.push(`${candidate.id} must include geometry or geometry_ref`);
    }
    if (candidate.geometry) {
      const coords = candidate.geometry.coordinates || [];
      if (
        candidate.geometry.type !== "Point" ||
        coords.length !== 2 ||
        coords[0] < -6.4 ||
        coords[0] > -5.4 ||
        coords[1] < 54.2 ||
        coords[1] > 54.9
      ) {
        errors.push(`${candidate.id} has invalid Belfast point geometry`);
      }
    }
    for (const pattern of forbiddenPatterns) {
      if (
        pattern.test(candidate.title) ||
        pattern.test(candidate.summary) ||
        pattern.test(candidate.observed_change || "") ||
        (candidate.limitations || []).some((item) => pattern.test(item))
      ) {
        errors.push(`${candidate.id} contains overclaim wording matching ${pattern}`);
      }
    }
    const titleDateKey = `${normalizeText(candidate.title)}|${candidate.effective_date}`;
    if (candidateIds.has(candidate.id)) {
      errors.push(`duplicate candidate id ${candidate.id}`);
    }
    if (sourceUrls.has(candidate.source_url)) {
      errors.push(`duplicate candidate source_url ${candidate.source_url}`);
    }
    if (sourceRecords.has(candidate.source_record_id)) {
      errors.push(`duplicate candidate source_record_id ${candidate.source_record_id}`);
    }
    if (titleDates.has(titleDateKey)) {
      errors.push(`duplicate candidate title/date ${candidate.title}`);
    }
    candidateIds.add(candidate.id);
    sourceUrls.add(candidate.source_url);
    sourceRecords.add(candidate.source_record_id);
    titleDates.add(titleDateKey);

    if ((candidate.duplicate_scan_hits || []).length > 0) {
      warnings.push(
        `${candidate.id} has local duplicate-scan hits; reviewed as non-duplicate in duplicate_review`
      );
    }
  }

  for (const source of sourceAudit.filter((item) => item.candidate_disposition === "accepted")) {
    if (!source.fetch_ok) {
      errors.push(`${source.source_id} accepted source did not fetch successfully`);
    }
    if (!source.marker_ok) {
      errors.push(`${source.source_id} accepted source missing required markers`);
    }
  }
  for (const source of sourceAudit.filter((item) => item.candidate_disposition !== "accepted")) {
    if (!source.fetch_ok || !source.marker_ok) {
      warnings.push(
        `${source.source_id} rejected source fetch/marker check incomplete; retained only as rejection audit`
      );
    }
  }
  for (const item of rejected) {
    if (!item.reason || !item.source_url || !item.publisher || !item.accessed_at) {
      errors.push(`${item.id || "(unknown rejected)"} missing rejection provenance`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: candidates.filter((candidate) => Boolean(candidate.geometry)).length,
    duplicate_scan_file_count: listDuplicateScanFiles().length
  };
}

function buildSummary(candidates, rejected, validation) {
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  const sourcePublishers = [
    ...new Set(candidates.map((candidate) => candidate.publisher))
  ].sort();
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    date_window: DATE_WINDOW,
    candidate_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: candidates.filter((candidate) => Boolean(candidate.geometry)).length,
    candidate_date_range: dates.length
      ? {
          start: dates[0],
          end: dates[dates.length - 1]
        }
      : null,
    accepted_ids: candidates.map((candidate) => candidate.id).sort(),
    rejected_ids: rejected.map((item) => item.id).sort(),
    source_publishers: sourcePublishers,
    rejected_publishers: [...new Set(rejected.map((item) => item.publisher))].sort(),
    source_urls: candidates.map((candidate) => candidate.source_url).sort(),
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    duplicate_scan_file_count: validation.duplicate_scan_file_count,
    validation_ok: validation.ok,
    caveats: [
      "Accepted records are source-specific administrative/opening/construction milestones only.",
      "No unsourced coordinates were introduced; all accepted records use source-stated hospital/site references instead of invented points.",
      "Official pages that duplicated existing delivered-stage events were retained in rejected.json, not as new events."
    ]
  };
}

function buildReadback(candidates, rejected, sourceAudit, validation, summary) {
  return {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    readback_checks: {
      candidates_written: candidates.length,
      rejected_written: rejected.length,
      sources_audited: sourceAudit.length,
      validation_ok: validation.ok,
      candidate_ids_unique: new Set(candidates.map((candidate) => candidate.id)).size === candidates.length,
      accepted_sources_marker_ok: sourceAudit
        .filter((item) => item.candidate_disposition === "accepted")
        .every((item) => item.fetch_ok && item.marker_ok),
      point_backed_count_matches_summary:
        summary.point_backed_count ===
        candidates.filter((candidate) => Boolean(candidate.geometry)).length
    },
    accepted_titles: candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      effective_date: candidate.effective_date,
      source_url: candidate.source_url,
      geometry_kind: candidate.geometry ? "Point" : "geometry_ref"
    })),
    rejected_titles: rejected.map((item) => ({
      id: item.id,
      title: item.title,
      reason: item.reason
    })),
    validation_errors: validation.errors,
    validation_warnings: validation.warnings
  };
}

function buildNotes(candidates, rejected, sourceAudit, validation, summary) {
  const acceptedLines = candidates
    .map(
      (candidate) =>
        `- ${candidate.effective_date}: ${candidate.title} (${candidate.publisher}) - ${candidate.source_url}`
    )
    .join("\n");
  const rejectedLines = rejected
    .map((item) => `- ${item.title}: ${item.reason}`)
    .join("\n");
  const auditLines = sourceAudit
    .map(
      (source) =>
        `- ${source.source_id}: fetch_ok=${source.fetch_ok}; marker_ok=${source.marker_ok}; status=${source.http_status}; disposition=${source.candidate_disposition}`
    )
    .join("\n");

  return `# ${ROUND_ID}

Generated: ${GENERATED_AT}
Accessed: ${ACCESSED_AT}

## Accepted

${acceptedLines || "- None"}

## Rejected

${rejectedLines || "- None"}

## Source Audit

${auditLines}

## Validation

- ok: ${validation.ok}
- accepted: ${summary.candidate_count}
- point-backed accepted: ${summary.point_backed_count}
- rejected: ${summary.rejected_count}
- date range: ${
    summary.candidate_date_range
      ? `${summary.candidate_date_range.start} to ${summary.candidate_date_range.end}`
      : "n/a"
  }

## Caveats

- Accepted records do not claim completion, opening, occupation, service performance or impact beyond the exact milestone directly stated by the source.
- No coordinates were invented. The accepted Trust records preserve source-stated hospital/site references as geometry_ref.
- Rejections include official pages that are useful corroboration but would duplicate existing Belfast events or lacked an actual source-backed effective date.
`;
}

async function main() {
  ensureOutDir();

  const sourceAudit = [];
  for (const source of SOURCES) {
    sourceAudit.push(await fetchSource(source));
  }

  const candidates = ACCEPTED.map(enrichDuplicateInfo).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const rejected = REJECTED.map(enrichDuplicateInfo).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const validation = validate(candidates, rejected, sourceAudit);
  const summary = buildSummary(candidates, rejected, validation);
  const readback = buildReadback(candidates, rejected, sourceAudit, validation, summary);

  writeJson("candidates.json", candidates);
  writeJson("rejected.json", rejected);
  writeJson("source_audit.json", sourceAudit);
  writeJson("summary.json", summary);
  writeJson("validation.json", validation);
  writeJson("validation_report.json", {
    round_id: ROUND_ID,
    generated_at: GENERATED_AT,
    validation,
    accepted_source_audit: sourceAudit.filter(
      (source) => source.candidate_disposition === "accepted"
    ),
    rejected_source_audit: sourceAudit.filter(
      (source) => source.candidate_disposition !== "accepted"
    )
  });
  writeJson("readback.json", readback);
  writeText(
    "notes.md",
    buildNotes(candidates, rejected, sourceAudit, validation, summary)
  );

  if (!validation.ok) {
    console.error(JSON.stringify(validation, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: validation.ok,
        candidate_count: summary.candidate_count,
        rejected_count: summary.rejected_count,
        point_backed_count: summary.point_backed_count,
        candidate_date_range: summary.candidate_date_range,
        out_dir: OUT_DIR
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
