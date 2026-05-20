#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const ROUND_ID = "round390_belfast_official_architecture_sweep_next11";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const SCRIPT_PATH = path.join(
  ROOT,
  "scripts",
  "fetch_round390_belfast_official_architecture_sweep_next11_candidates.js"
);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = { start: "2008-01-01", end: "2026-05-20" };
const MANUAL_CORPUS = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const DFI_CROWN_URL = "https://www.infrastructure-ni.gov.uk/articles/crown-copyright-infrastructure";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const SEARCH_QUERIES_CHECKED = [
  'site:infrastructure-ni.gov.uk/news Hill Street Belfast pedestrianised 4 December 2025',
  'site:infrastructure-ni.gov.uk/consultations Hill Street Gordon Street Belfast Experimental Traffic Control Scheme 2025',
  '"Kimmins announces next stage of Lagan Pedestrian and Cycle Bridge procurement"',
  'site:infrastructure-ni.gov.uk "Lagan Pedestrian and Cycle Bridge" "shortlist of contractors" "17 April 2025"',
  'site:minutes.belfastcity.gov.uk "Planning Committee review of implemented applications 2026" "Loft Lines"',
  'site:minutes.belfastcity.gov.uk "Raphael Street and Cromac Street" "LA04/2021/1672/O"',
  'site:minutes.belfastcity.gov.uk "Bedford Hotel" "LA04/2024/0126/F"',
  'site:belfastcity.gov.uk/news Belfast architecture public realm official 2026',
  'site:communities-ni.gov.uk/publications Belfast development brief built environment 2026',
  'site:infrastructure-ni.gov.uk/news Belfast public realm active travel bridge 2025 2026'
];

const SOURCES = [
  {
    source_id: "dfi-hill-street-pedestrianisation-effective-2025-round390",
    source_name: "Hill Street, Belfast to be pedestrianised from Thursday 4 December",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/news/hill-street-belfast-be-pedestrianised-thursday-4-december",
    source_type: "official department news page",
    license:
      "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "News page dated 2025-12-02; stated effective date 2025-12-04",
    update_frequency: "News page, milestone-specific",
    geographic_scope: "Hill Street between Gordon Street and Waring Street, Cathedral Quarter, Belfast",
    granularity: "Named street segment, effective date, experimental traffic-control status and review period",
    key_fields:
      "Publication date, street name, effective date, street-segment description, experimental scheme wording and review period.",
    reliability: "strong for the source-stated experimental pedestrianisation effective date",
    required_caveats:
      "Experimental traffic-management record only; do not treat as permanent public-realm delivery, streetscape construction, final order, completion, opening, safety, footfall or economic outcome evidence.",
    ingestion_recommendation: "Accept one candidate as a documented experimental pedestrianisation milestone with street-management caveats.",
    emitted_candidates: 1,
    source_check_method: "HTML fetch and marker scan",
    marker_terms: [
      "2 December 2025",
      "Hill Street in Belfast",
      "Thursday 4 December 2025",
      "Experimental Traffic Control Scheme",
      "between Gordon Street and Waring Street",
      "initial 6-month period"
    ]
  },
  {
    source_id: "dfi-lagan-ped-cycle-bridge-procurement-next-stage-2025-round390",
    source_name: "Liz Kimmins announces next stage of Lagan Pedestrian and Cycle Bridge procurement",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/news/liz-kimmins-announces-next-stage-lagan-pedestrian-and-cycle-bridge-procurement",
    source_type: "official department news page",
    license:
      "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "News page dated 2025-04-17",
    update_frequency: "News page, milestone-specific",
    geographic_scope: "River Lagan bridge corridor between the Gasworks site and Ormeau Embankment, Belfast",
    granularity: "Named bridge project, procurement-stage status, bid invitation and broad bridge corridor",
    key_fields:
      "Publication date, project name, procurement-stage wording, shortlist/bid wording, span/location notes and funding context.",
    reliability: "strong for the source-stated procurement-stage milestone; not physical-delivery evidence",
    required_caveats:
      "Procurement-stage record only; do not treat as contract award, detailed design, works start, bridge construction, completion, opening, final alignment, cost outcome, use or active-travel impact evidence.",
    ingestion_recommendation: "Accept one candidate as a documented procurement milestone with proposal/delivery-stage caveats.",
    emitted_candidates: 1,
    source_check_method: "HTML fetch and marker scan",
    marker_terms: [
      "17 April 2025",
      "Lagan Pedestrian and Cycle Bridge",
      "procurement process",
      "shortlist of contractors",
      "invited to bid",
      "Gasworks site and Ormeau Embankment"
    ]
  },
  {
    source_id: "bcc-planning-implemented-applications-review-2026-round390",
    source_name: "Planning Committee review of implemented applications 2026",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    source_type: "official council Planning Committee PDF pack",
    license:
      "Belfast City Council public committee-document terms; factual committee metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Planning Committee pack dated 2026-05-19; implemented-schemes report on extracted PDF pages 161-162",
    update_frequency: "Meeting-specific pack",
    geographic_scope: "Belfast City Council planning authority area; screened for architecture/built-environment milestones",
    granularity: "Committee report, planning application references, named schemes and proposed review/site-visit status",
    key_fields:
      "Committee date, report title, application references, scheme names, site-visit schedule and completed/implemented wording.",
    reliability:
      "usable with caveats for committee-recorded implemented/completed-form status; not a substitute for completion certificates, opening notices or as-built plans",
    required_caveats:
      "Committee review/site-visit record only; do not treat as exact completion date, opening, full occupation, building-control certification, final as-built geometry or outcome evidence.",
    ingestion_recommendation:
      "Accept two cautious candidates: one for Loft Lines completed-form/public-realm status and one for Raphael/Cromac Gasworks implemented-scheme listing. Reject Bedford Hotel as duplicate.",
    emitted_candidates: 2,
    source_check_method: "PDF HTTP fetch and pypdf text marker scan",
    marker_terms: [
      "Planning Committee review of implemented applications 2026",
      "Date: 19th May 2026",
      "Raphael Street and Cromac Street",
      "LA04/2021/1672/O",
      "Loft Lines",
      "completed form",
      "public realm delivered"
    ]
  },
  {
    source_id: "bcc-bedford-hotel-implemented-site-visit-duplicate-round390",
    source_name: "Bedford Hotel implemented-scheme site-visit listing in 19 May 2026 Planning Committee pack",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    source_type: "official council Planning Committee PDF pack",
    license:
      "Belfast City Council public committee-document terms; factual committee metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Planning Committee pack dated 2026-05-19",
    update_frequency: "Meeting-specific pack",
    geographic_scope: "15-16 Donegall Square South and 2-14 Bedford Street, Belfast",
    granularity: "Committee site-visit line item",
    key_fields: "Committee date, application reference, scheme name and prior committee approval date.",
    reliability: "strong for source-stated listing, but duplicate against existing manual Bedford Hotel opening/planning records",
    required_caveats: "Do not double count the Scottish Mutual/Bedford Hotel building family.",
    ingestion_recommendation: "Reject as duplicate.",
    emitted_candidates: 0,
    source_check_method: "PDF HTTP fetch and pypdf text marker scan",
    marker_terms: ["Bedford Hotel", "LA04/2024/0126/F", "18th March 2025"]
  },
  {
    source_id: "dfi-hill-street-experimental-consultation-supporting-round390",
    source_name: "Experimental Traffic Control Scheme (Hill Street and Gordon Street) Belfast 2025",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/experimental-traffic-control-scheme-hill-street-and-gordon-street-belfast-2025",
    source_type: "official department consultation page",
    license:
      "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Consultation opened 2025-10-15 and closed 2025-11-06",
    update_frequency: "Consultation page, status-specific",
    geographic_scope: "Hill Street and Gordon Street, Belfast",
    granularity: "Draft experimental traffic-control scheme documents and consultation dates",
    key_fields: "Consultation title, opening and closing dates, scheme name, street names and documents.",
    reliability: "supporting context for the later DfI effective-date news page",
    required_caveats: "Consultation status alone is not an effective-date, construction, completion or permanent public-realm record.",
    ingestion_recommendation:
      "Do not emit separately; use as supporting context for the stronger 2025-12-04 effective-date candidate.",
    emitted_candidates: 0,
    source_check_method: "HTML fetch and marker scan",
    marker_terms: [
      "Consultation opened 15 October 2025",
      "closed 6 November 2025",
      "Hill Street and Gordon Street",
      "for a period of 6 months"
    ]
  },
  {
    source_id: "dfi-stranmillis-cycle-routes-order-2026-recheck-round390",
    source_name: "The Cycle Routes (Amendment) Order (Northern Ireland) 2026",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/cycle-routes-amendment-order-northern-ireland-2026",
    source_type: "official department roads-legislation consultation page",
    license:
      "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Consultation opened 2026-03-18 and closed 2026-04-10",
    update_frequency: "Consultation page, status-specific",
    geographic_scope: "Stranmillis Embankment, Belfast",
    granularity: "Draft cycle-route order and map",
    key_fields: "Order title, consultation date, road name, route order description and downloadable draft order/map.",
    reliability: "usable with caveats for legal-order consultation status",
    required_caveats: "Traffic-order consultation does not document construction, completion, opening, public-realm delivery or as-built alignment.",
    ingestion_recommendation: "Reject for this architecture/public-realm sweep; already rejected in Round383.",
    emitted_candidates: 0,
    source_check_method: "HTML fetch and marker scan",
    marker_terms: ["Stranmillis Embankment", "two-way cycle shared track", "18 March 2026"]
  },
  {
    source_id: "bcc-city-quays-gardens-opening-duplicate-round390",
    source_name: "City Quays Gardens opening / completion source family",
    publisher: "Belfast City Council / Belfast Harbour public sources",
    url: "https://www.belfastcity.gov.uk/news",
    source_type: "official/civic public source family recheck",
    license: "Mixed public-source terms; factual duplicate-check metadata only.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council and Belfast Harbour where applicable",
    coverage_years: "Prior Belfast sweep coverage through Round383",
    update_frequency: "News pages, milestone-specific",
    geographic_scope: "City Quays Gardens, Belfast",
    granularity: "Named public-realm/open-space milestone",
    key_fields: "Project name, source date, opening/works status and source URL.",
    reliability: "strong in existing corpus; duplicate for Round390",
    required_caveats: "Do not duplicate existing City Quays Gardens records.",
    ingestion_recommendation: "Reject as duplicate/exhausted lead.",
    emitted_candidates: 0,
    source_check_method: "Prior-corpus duplicate scan",
    marker_terms: ["City Quays Gardens", "opening", "public realm"]
  },
  {
    source_id: "bcc-belfast-stories-duplicate-round390",
    source_name: "Belfast Stories official project and committee source family",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/belfaststories",
    source_type: "official council project page / committee source family recheck",
    license: "Belfast City Council website terms; factual duplicate-check metadata only.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Prior Belfast sweep coverage through Round383",
    update_frequency: "Project pages and committee packs update irregularly",
    geographic_scope: "Belfast Stories / North Street, Belfast",
    granularity: "Design-stage and consultation-stage project milestones",
    key_fields: "Project stage, committee date, consultation dates, design-team status and source URL.",
    reliability: "usable with caveats, but already represented in prior rounds",
    required_caveats: "Do not double count existing Belfast Stories design-team, Stage 3, PACC or funding-condition records.",
    ingestion_recommendation: "Reject as duplicate/exhausted lead.",
    emitted_candidates: 0,
    source_check_method: "Prior-corpus duplicate scan",
    marker_terms: ["Belfast Stories", "Stage 3", "PACC", "design team"]
  },
  {
    source_id: "bcc-current-planning-major-duplicates-recheck-round390",
    source_name: "Belfast current/live major planning application rechecks",
    publisher: "Belfast City Council / NI Planning Portal",
    url: "https://www.planningni.gov.uk/",
    source_type: "official planning application source family recheck",
    license: "Planning Portal and council public-record terms; factual duplicate-check metadata only.",
    license_url: "https://www.planningni.gov.uk/",
    attribution: "Belfast City Council and Department for Infrastructure planning-data sources",
    coverage_years: "Current/live application checks through 2026-05-20",
    update_frequency: "Continuously updated planning register / committee snapshots",
    geographic_scope: "Belfast City Council planning authority area",
    granularity: "Application reference, address, proposal and status",
    key_fields: "Application id, site address, proposal, status, committee date and decision date where available.",
    reliability: "usable for planning status only; not works/opening evidence",
    required_caveats:
      "Current/live application rows are not approvals, construction starts, completions, openings or occupation evidence.",
    ingestion_recommendation:
      "No Round390 candidate; Mercy College SEN, Blackstaff Chambers, Studio Ulster and similar major-application leads were already represented or not yet physical-change evidence.",
    emitted_candidates: 0,
    source_check_method: "Prior-corpus duplicate scan",
    marker_terms: ["Mercy College", "Blackstaff Chambers", "Studio Ulster"]
  },
  {
    source_id: "dfi-belfast-tidal-flood-alleviation-completion-duplicate-round390",
    source_name: "Belfast Tidal Flood Alleviation Scheme official completion source family",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/",
    source_type: "official department source family recheck",
    license:
      "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Prior Belfast sweep coverage through Round383",
    update_frequency: "News/project pages update irregularly",
    geographic_scope: "Belfast tidal flood-defence project areas",
    granularity: "Scheme-level status and completion records",
    key_fields: "Project name, status, completion date/source date, source URL and caveats.",
    reliability: "strong in existing corpus; duplicate for Round390",
    required_caveats: "Do not duplicate existing Belfast tidal flood-alleviation completion records.",
    ingestion_recommendation: "Reject as duplicate/exhausted lead.",
    emitted_candidates: 0,
    source_check_method: "Prior-corpus duplicate scan",
    marker_terms: ["Belfast Tidal Flood Alleviation", "completion"]
  }
];

const CANDIDATES = [
  {
    city_id: CITY_ID,
    event_id: "round390_belfast_hill_street_experimental_pedestrianisation_2025_12_04",
    title: "Hill Street experimental pedestrianisation took effect",
    summary:
      "A Department for Infrastructure news page dated 2 December 2025 recorded a 4 December 2025 effective date for an experimental pedestrianisation of Hill Street between Gordon Street and Waring Street.",
    observed_change:
      "DfI recorded the start/effective date for an experimental pedestrianised-zone traffic-control measure on Hill Street.",
    date: "2025-12-04",
    effective_date: "2025-12-04",
    date_precision: "day",
    category: "public realm / street management",
    event_type: "street_management_experimental_pedestrianisation",
    milestone_type: "experimental_pedestrianisation_effective",
    project_type: "street pedestrianisation / traffic-control experiment",
    area: "Cathedral Quarter",
    address_or_location: "Hill Street between Gordon Street and Waring Street, Belfast",
    latitude: 54.6027,
    longitude: -5.9276,
    geometry: { type: "Point", coordinates: [-5.9276, 54.6027] },
    geometry_ref: "Approximate midpoint of Hill Street between Gordon Street and Waring Street.",
    geometry_source:
      "Manual geocoding from the source-described street segment; not a surveyed scheme boundary or traffic-order map.",
    geometry_precision: "approximate_street_segment_midpoint",
    source_ids: ["dfi-hill-street-pedestrianisation-effective-2025-round390"],
    source_name: "Hill Street, Belfast to be pedestrianised from Thursday 4 December",
    source_url:
      "https://www.infrastructure-ni.gov.uk/news/hill-street-belfast-be-pedestrianised-thursday-4-december",
    source_record_id: "DfI news page; date published 2025-12-02; effective date 2025-12-04",
    source_type: "official department news page",
    source_date_field: "DfI news-page publication date and source-stated effective date",
    source_date_value: "Published 2025-12-02; effective 2025-12-04",
    publisher: "Department for Infrastructure",
    license:
      "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Not applicable; Department for Infrastructure street-management scheme",
    limitations:
      "Experimental traffic-management record only. It does not document permanent pedestrianisation, streetscape construction, final public-realm completion, final traffic order, safety, footfall, nighttime-economy, retail or other outcome claims.",
    caveats: [
      "Initial experiment/review status must be displayed inline.",
      "The source includes a notes-to-editors typo that says 2015 in a photo caption; the title/body and page date support 4 December 2025.",
      "Geometry is an approximate point for the named street segment."
    ],
    duplicate_check_terms: [
      "Hill Street, Belfast to be pedestrianised",
      "Hill Street pedestrianised",
      "Experimental Traffic Control Scheme",
      "4 December 2025",
      "Gordon Street and Waring Street"
    ],
    duplicate_check_note:
      "Screened manual corpus, prior Belfast sweep packs through Round383 and scripts. Existing Hill Street rows concern unrelated planning/heritage records; no DfI 2025 experimental pedestrianisation milestone was found.",
    transformation_method:
      "Round390 official-source sweep: source page fetched, effective date and street segment normalized, duplicate terms screened, approximate geometry assigned, and caveats added to avoid permanent/public-realm overclaiming."
  },
  {
    city_id: CITY_ID,
    event_id: "round390_belfast_lagan_ped_cycle_bridge_procurement_next_stage_2025_04_17",
    title: "Lagan pedestrian and cycle bridge procurement moved to next stage",
    summary:
      "A Department for Infrastructure news page dated 17 April 2025 recorded that the procurement process for the proposed Lagan Pedestrian and Cycle Bridge had moved to a next stage, with a shortlist of contractors invited to bid.",
    observed_change:
      "DfI recorded a procurement-stage milestone for the proposed Lagan Pedestrian and Cycle Bridge.",
    date: "2025-04-17",
    effective_date: "2025-04-17",
    date_precision: "day",
    category: "bridge / active travel / procurement",
    event_type: "bridge_procurement_stage",
    milestone_type: "procurement_next_stage",
    project_type: "pedestrian and cycle bridge",
    area: "River Lagan / Gasworks / Ormeau Embankment",
    address_or_location: "River Lagan bridge corridor between the Gasworks site and Ormeau Embankment, Belfast",
    latitude: 54.5906,
    longitude: -5.9123,
    geometry: { type: "Point", coordinates: [-5.9123, 54.5906] },
    geometry_ref:
      "Approximate bridge-corridor midpoint between the Gasworks side of the Lagan Towpath and Ormeau Embankment.",
    geometry_source:
      "Manual point derived from DfI source location description; not a final as-built alignment, pier location or construction footprint.",
    geometry_precision: "approximate_project_corridor_midpoint",
    source_ids: ["dfi-lagan-ped-cycle-bridge-procurement-next-stage-2025-round390"],
    source_name: "Liz Kimmins announces next stage of Lagan Pedestrian and Cycle Bridge procurement",
    source_url:
      "https://www.infrastructure-ni.gov.uk/news/liz-kimmins-announces-next-stage-lagan-pedestrian-and-cycle-bridge-procurement",
    source_record_id: "DfI news page; date published 2025-04-17",
    source_type: "official department news page",
    source_date_field: "DfI news-page publication date",
    source_date_value: "2025-04-17",
    publisher: "Department for Infrastructure",
    license:
      "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Not stated in source; procurement-stage bridge project",
    limitations:
      "Procurement-stage record only. It does not document contract award, detailed design approval, works start, bridge construction, completion, opening, final alignment, cost outcome, usage or active-travel impact.",
    caveats: [
      "Prior corpus records already cover planning approval, BRCD funding and 2024 geotechnical investigation milestones for this bridge.",
      "The 2025 item should be treated as a separate procurement-stage status, not as physical delivery.",
      "Geometry is approximate and project-corridor level."
    ],
    duplicate_check_terms: [
      "Liz Kimmins announces next stage of Lagan Pedestrian and Cycle Bridge procurement",
      "next stage of the procurement process",
      "shortlist of contractors",
      "invited to bid",
      "Lagan Pedestrian and Cycle Bridge"
    ],
    duplicate_check_note:
      "Screened manual corpus, prior Belfast sweep packs through Round383 and scripts. Earlier rows cover planning/funding/geotechnical milestones, but no 17 April 2025 DfI procurement-next-stage record was found.",
    transformation_method:
      "Round390 official-source sweep: DfI news page fetched, procurement milestone normalized as proposal/delivery-stage status, duplicate terms screened and project-corridor point/caveats assigned."
  },
  {
    city_id: CITY_ID,
    event_id: "round390_belfast_loft_lines_completed_form_recorded_2026_05_19",
    title: "Planning Committee report recorded Loft Lines in completed form",
    summary:
      "Belfast City Council's 19 May 2026 Planning Committee pack recorded a recommendation to revisit Loft Lines in Titanic Quarter so members could review the development in completed form, including its open-space and public-realm elements.",
    observed_change:
      "The official committee pack recorded completed-form/public-realm-delivered status for the Loft Lines scheme in the context of a proposed planning-review site visit.",
    date: "2026-05-19",
    effective_date: "2026-05-19",
    date_precision: "day",
    category: "housing / public realm / committee status",
    event_type: "committee_recorded_completed_form",
    milestone_type: "implemented_scheme_review_status",
    project_type: "housing-led mixed-use development / public realm",
    area: "Titanic Quarter / Queen's Island",
    address_or_location: "Loft Lines, Titanic Quarter, Queen's Island, Belfast",
    latitude: 54.6086,
    longitude: -5.9067,
    geometry: { type: "Point", coordinates: [-5.9067, 54.6086] },
    geometry_ref:
      "Approximate Loft Lines / Queen's Island project point reused from existing Bims Loft Lines records.",
    geometry_source:
      "Existing Bims Loft Lines approximate project point; not a surveyed building footprint or public-realm boundary.",
    geometry_precision: "approximate_project_point",
    source_ids: ["bcc-planning-implemented-applications-review-2026-round390"],
    source_name: "Planning Committee review of implemented applications 2026",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    source_record_id: "Planning Committee combined pack 2026-05-19; implemented applications review; LA04/2021/2280/F",
    source_type: "official council Planning Committee PDF pack",
    source_date_field: "Committee pack date",
    source_date_value: "2026-05-19",
    publisher: "Belfast City Council",
    license:
      "Belfast City Council public committee-document terms; factual committee metadata and source URL retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Loft Lines project team; source does not assign design authorship for this milestone",
    limitations:
      "Committee-review/site-visit record only. It does not provide an exact completion date, final occupation status, building-control certification, completion certificate, final as-built boundary, affordability outcome or evidence that every project component was complete by this date.",
    caveats: [
      "Existing records cover Loft Lines planning permission, construction start and Dargan House first residents.",
      "This row should be labelled as committee-recorded completed-form/public-realm status, not a certified completion record.",
      "Geometry remains approximate and project-level."
    ],
    duplicate_check_terms: [
      "Loft Lines",
      "LA04/2021/2280/F",
      "completed form",
      "open space and public realm",
      "Planning Committee review of implemented applications 2026"
    ],
    duplicate_check_note:
      "Screened manual corpus, prior Belfast sweep packs through Round383 and scripts. Existing rows cover planning, construction-start and Dargan House first-residents milestones; no 19 May 2026 committee completed-form/public-realm site-visit record was found.",
    transformation_method:
      "Round390 official-source sweep: BCC committee PDF text extracted with pypdf, implemented-review line normalized as a cautious status event, duplicate terms screened and existing approximate project point reused."
  },
  {
    city_id: CITY_ID,
    event_id: "round390_belfast_gasworks_raphael_cromac_implemented_scheme_recorded_2026_05_19",
    title: "Planning Committee report listed Raphael/Cromac Gasworks scheme as implemented",
    summary:
      "Belfast City Council's 19 May 2026 Planning Committee pack listed the social-housing/mixed-use development on Raphael Street and Cromac Street, Gasworks, as one of the implemented schemes proposed for a June 2026 committee site visit.",
    observed_change:
      "The official committee pack recorded the Raphael Street and Cromac Street Gasworks development in an implemented-schemes review list.",
    date: "2026-05-19",
    effective_date: "2026-05-19",
    date_precision: "day",
    category: "housing / mixed use / committee status",
    event_type: "committee_listed_implemented_scheme",
    milestone_type: "implemented_scheme_review_status",
    project_type: "social housing / mixed-use development",
    area: "Gasworks / Northern Fringe",
    address_or_location: "Raphael Street and Cromac Street, Gasworks, Belfast",
    latitude: 54.5918,
    longitude: -5.9197,
    geometry: { type: "Point", coordinates: [-5.9197, 54.5918] },
    geometry_ref: "Approximate project-area point for Raphael Street / Cromac Street, Gasworks.",
    geometry_source:
      "Manual geocoding from source-described street names and prior planning-statistics location context; not a surveyed application boundary.",
    geometry_precision: "approximate_project_area_point",
    source_ids: ["bcc-planning-implemented-applications-review-2026-round390"],
    source_name: "Planning Committee review of implemented applications 2026",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    source_record_id: "Planning Committee combined pack 2026-05-19; implemented applications review; LA04/2021/1672/O",
    source_type: "official council Planning Committee PDF pack",
    source_date_field: "Committee pack date",
    source_date_value: "2026-05-19",
    publisher: "Belfast City Council",
    license:
      "Belfast City Council public committee-document terms; factual committee metadata and source URL retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Not stated in source; planning application LA04/2021/1672/O",
    limitations:
      "Committee-review/site-visit listing only. It does not provide an exact completion/opening date, occupation status, building-control certification, final tenant mix, final public-realm status, full project build-out or as-built boundary.",
    caveats: [
      "Existing records cover LA04/2021/1672/O planning approval/decision data; this row is a later committee-recorded implemented-scheme status.",
      "The source wording does not document every mixed-use component as completed.",
      "Geometry is approximate and project-area level."
    ],
    duplicate_check_terms: [
      "Raphael Street and Cromac Street",
      "Gasworks",
      "LA04/2021/1672/O",
      "implemented schemes",
      "Planning Committee review of implemented applications 2026"
    ],
    duplicate_check_note:
      "Screened manual corpus, prior Belfast sweep packs through Round383 and scripts. Existing rows cover planning decision/application records for LA04/2021/1672/O, but no 19 May 2026 implemented-schemes site-visit status row was found.",
    transformation_method:
      "Round390 official-source sweep: BCC committee PDF text extracted with pypdf, implemented-scheme review line normalized as a cautious status event, duplicate terms screened and approximate Gasworks project point assigned."
  }
];

const REJECTED = [
  {
    source_id: "bcc-bedford-hotel-implemented-site-visit-duplicate-round390",
    title: "Bedford Hotel implemented-scheme site-visit listing",
    status: "rejected",
    reason:
      "Duplicate building-family milestone. The manual corpus already contains the Bedford Hotel opening/restored Scottish Mutual Building record and older planning/listing records.",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    duplicate_check_terms: ["Bedford Hotel", "Scottish Mutual Building", "LA04/2024/0126/F"],
    caveat: "Do not double count the site-visit listing as a new opening/completion record."
  },
  {
    source_id: "dfi-hill-street-experimental-consultation-supporting-round390",
    title: "Hill Street and Gordon Street experimental traffic-control consultation",
    status: "supporting_context_only",
    reason:
      "The consultation is superseded for event purposes by the stronger DfI news page documenting the 4 December 2025 effective date.",
    source_url:
      "https://www.infrastructure-ni.gov.uk/consultations/experimental-traffic-control-scheme-hill-street-and-gordon-street-belfast-2025",
    duplicate_check_terms: ["Hill Street", "Gordon Street", "Experimental Traffic Control Scheme"],
    caveat: "Consultation status alone is not an effective-date, construction, completion or permanent public-realm record."
  },
  {
    source_id: "dfi-stranmillis-cycle-routes-order-2026-recheck-round390",
    title: "Stranmillis Embankment cycle-route order consultation",
    status: "rejected",
    reason:
      "Traffic-order consultation only and already rejected in Round383; not architecture/public-realm delivery evidence.",
    source_url: "https://www.infrastructure-ni.gov.uk/consultations/cycle-routes-amendment-order-northern-ireland-2026",
    duplicate_check_terms: ["Stranmillis Embankment", "Cycle Routes Amendment Order", "2026"],
    caveat: "Await works-start/opening/completion source if it exists."
  },
  {
    source_id: "bcc-city-quays-gardens-opening-duplicate-round390",
    title: "City Quays Gardens opening / public-realm source family",
    status: "rejected",
    reason: "Existing manual/prior Belfast records already represent City Quays Gardens opening and works-phase milestones.",
    source_url: "https://www.belfastcity.gov.uk/news",
    duplicate_check_terms: ["City Quays Gardens", "opening", "public realm"],
    caveat: "Do not emit another City Quays Gardens row without a distinct later official change."
  },
  {
    source_id: "bcc-belfast-stories-duplicate-round390",
    title: "Belfast Stories design/project-stage source family",
    status: "rejected",
    reason:
      "Prior Belfast packs already cover Belfast Stories design-team, Stage 3, PACC and funding-condition milestones.",
    source_url: "https://www.belfastcity.gov.uk/belfaststories",
    duplicate_check_terms: ["Belfast Stories", "Stage 3", "PACC", "design team"],
    caveat: "Future rows need a clearly new official approval, works-start, completion/opening or other dated milestone."
  },
  {
    source_id: "bcc-current-planning-major-duplicates-recheck-round390",
    title: "Current/live major planning application rechecks",
    status: "rejected",
    reason:
      "Current/live application rows screened in this pass were duplicates, proposal-stage only, or not physical-change evidence.",
    source_url: "https://www.planningni.gov.uk/",
    duplicate_check_terms: ["Mercy College", "Blackstaff Chambers", "Studio Ulster", "Live Major Applications"],
    caveat: "Planning-application status must remain separate from approval, construction, opening or completion evidence."
  },
  {
    source_id: "dfi-belfast-tidal-flood-alleviation-completion-duplicate-round390",
    title: "Belfast Tidal Flood Alleviation completion source family",
    status: "rejected",
    reason: "Existing corpus/prior packs already include the Belfast tidal flood-alleviation completion milestone.",
    source_url: "https://www.infrastructure-ni.gov.uk/",
    duplicate_check_terms: ["Belfast Tidal Flood Alleviation", "completion"],
    caveat: "Do not duplicate unless a distinct later phase or official correction is documented."
  }
];

const SOURCE_TEXT_CACHE = new Map();

function debug(message) {
  if (process.env.ROUND390_DEBUG) {
    console.error(`[round390] ${message}`);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), stableJson(value), "utf8");
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function toPosixRelative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function getPriorFiles() {
  let output = "";
  try {
    output = execFileSync("rg", ["--files", "data/manual_drops", "tmp/subagents", "scripts"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch (error) {
    const fallback = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else fallback.push(toPosixRelative(p));
      }
    }
    walk(path.join(ROOT, "data", "manual_drops"));
    walk(path.join(ROOT, "tmp", "subagents"));
    walk(path.join(ROOT, "scripts"));
    output = fallback.join("\n");
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((relativePath) => path.resolve(ROOT, relativePath))
    .filter((filePath) => !filePath.includes(`${path.sep}${ROUND_ID}${path.sep}`))
    .filter((filePath) => path.resolve(filePath) !== path.resolve(SCRIPT_PATH))
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) => /\.(json|ndjson|md|js|py|txt|csv|geojson)$/i.test(filePath));
}

function scanDuplicateTerms(files, terms) {
  void files;
  return terms
    .map((term) => String(term || "").trim())
    .filter(Boolean)
    .map((term) => {
    const hits = [];
      try {
        const output = execFileSync(
          "rg",
          [
            "-i",
            "-l",
            "--fixed-strings",
            "--glob",
            `!tmp/subagents/${ROUND_ID}/**`,
            "--glob",
            "!scripts/fetch_round390_belfast_official_architecture_sweep_next11_candidates.js",
            term,
            "data/manual_drops",
            "tmp/subagents",
            "scripts"
          ],
          {
            cwd: ROOT,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 20000
          }
        );
        hits.push(
          ...output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        );
      } catch (error) {
        if (error.status !== 1) {
          return {
            term,
            hit_count: 0,
            sample_paths: [],
            warning: error.killed ? "rg duplicate scan timed out" : "rg duplicate scan failed"
          };
        }
      }
      return {
        term,
        hit_count: hits.length,
        sample_paths: hits.slice(0, 8)
      };
    });
}

async function fetchTextSource(source) {
  const result = {
    source_id: source.source_id,
    url: source.url,
    ok: false,
    status: null,
    content_type: null,
    fetched_at: ACCESSED_AT,
    method: source.source_check_method,
    marker_results: [],
    error: null
  };

  if (source.source_check_method === "Prior-corpus duplicate scan") {
    result.ok = true;
    result.status = "not_fetched";
    result.content_type = "not_applicable";
    result.marker_results = source.marker_terms.map((term) => ({
      term,
      found: "not_applicable"
    }));
    return result;
  }

  try {
    let cached = SOURCE_TEXT_CACHE.get(source.url);
    let text = "";
    if (!cached) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        debug(`fetch ${source.source_id}`);
        response = await fetch(source.url, {
          signal: controller.signal,
          headers: {
            "user-agent": "Bims-5 provenance source audit (contact: local development sweep)"
          }
        });
      } finally {
        clearTimeout(timeout);
      }
      const contentType = response.headers.get("content-type") || "";
      const bytes = Buffer.from(await response.arrayBuffer());
      text =
        contentType.includes("application/pdf") || source.url.toLowerCase().includes(".pdf")
          ? extractPdfTextWithPythonFromBytes(bytes)
          : bytes.toString("utf8");
      cached = {
        ok: response.ok,
        status: response.status,
        content_type: contentType,
        byte_length: bytes.length,
        text
      };
      SOURCE_TEXT_CACHE.set(source.url, cached);
    }

    result.status = cached.status;
    result.content_type = cached.content_type;
    result.byte_length = cached.byte_length;
    result.ok = cached.ok;
    text = cached.text;

    const normalized = normalizeText(text);
    result.marker_results = source.marker_terms.map((term) => ({
      term,
      found: normalized.includes(normalizeText(term))
    }));
    result.marker_match_count = result.marker_results.filter((marker) => marker.found === true).length;
  } catch (error) {
    result.error = error.message;
    result.ok = false;
    result.marker_results = source.marker_terms.map((term) => ({ term, found: false }));
  }

  return result;
}

function extractPdfTextWithPythonFromBytes(bytes) {
  const code = [
    "from io import BytesIO",
    "import sys",
    "from pypdf import PdfReader",
    "data = sys.stdin.buffer.read()",
    "reader = PdfReader(BytesIO(data))",
    "parts = []",
    "for page in reader.pages:",
    "    parts.append(page.extract_text() or '')",
    "sys.stdout.buffer.write('\\n'.join(parts).encode('utf-8', 'replace'))"
  ].join("\n");
  return execFileSync("python", ["-c", code], {
    cwd: ROOT,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    input: bytes,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024
  });
}

function validateCandidates(candidates, sourceIds, sourceFetches) {
  const errors = [];
  const warnings = [];
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

  const allowedConfidence = new Set(["documented", "corroborated", "inferred", "disputed"]);
  const overclaimPatterns = [
    /\b(predicts?|forecasts?|simulates?|simulation|caused|causally|proves?)\b/i,
    /\bwill (increase|decrease|reduce|improve|boost|transform|revitalise|revitalize|deliver|unlock)\b/i,
    /\bguarantees?\b/i,
    /\bimpact score\b/i
  ];

  if (candidates.length > 10) {
    errors.push(`Candidate count ${candidates.length} exceeds limit of 10.`);
  }

  const seenIds = new Set();
  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.event_id || "unknown"} missing required field: ${field}`);
      }
    }

    if (seenIds.has(candidate.event_id)) {
      errors.push(`Duplicate event_id: ${candidate.event_id}`);
    }
    seenIds.add(candidate.event_id);

    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.event_id} has unexpected city_id ${candidate.city_id}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.date)) {
      errors.push(`${candidate.event_id} date is not YYYY-MM-DD: ${candidate.date}`);
    }
    if (candidate.date < DATE_WINDOW.start || candidate.date > DATE_WINDOW.end) {
      errors.push(`${candidate.event_id} date ${candidate.date} outside ${DATE_WINDOW.start}..${DATE_WINDOW.end}`);
    }

    if (typeof candidate.latitude !== "number" || candidate.latitude < 54.45 || candidate.latitude > 54.75) {
      errors.push(`${candidate.event_id} latitude outside Belfast sanity bounds: ${candidate.latitude}`);
    }
    if (typeof candidate.longitude !== "number" || candidate.longitude < -6.15 || candidate.longitude > -5.75) {
      errors.push(`${candidate.event_id} longitude outside Belfast sanity bounds: ${candidate.longitude}`);
    }
    if (
      !candidate.geometry ||
      candidate.geometry.type !== "Point" ||
      !Array.isArray(candidate.geometry.coordinates) ||
      candidate.geometry.coordinates[0] !== candidate.longitude ||
      candidate.geometry.coordinates[1] !== candidate.latitude
    ) {
      errors.push(`${candidate.event_id} geometry point does not match longitude/latitude.`);
    }

    if (!allowedConfidence.has(candidate.confidence)) {
      errors.push(`${candidate.event_id} has unsupported confidence value: ${candidate.confidence}`);
    }

    for (const sourceId of candidate.source_ids || []) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`${candidate.event_id} references unknown source_id ${sourceId}`);
      }
    }

    const candidateText = normalizeText([
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      ...(candidate.caveats || [])
    ].join(" "));
    for (const pattern of overclaimPatterns) {
      if (pattern.test(candidateText)) {
        errors.push(`${candidate.event_id} failed overclaim scan: ${pattern}`);
      }
    }
  }

  const acceptedSourceIds = new Set(candidates.flatMap((candidate) => candidate.source_ids || []));
  for (const sourceId of acceptedSourceIds) {
    const fetchResult = sourceFetches.find((result) => result.source_id === sourceId);
    if (!fetchResult || !fetchResult.ok) {
      errors.push(`Accepted source ${sourceId} did not fetch successfully.`);
      continue;
    }
    const markerFailures = (fetchResult.marker_results || []).filter((marker) => marker.found === false);
    if (markerFailures.length) {
      errors.push(`Accepted source ${sourceId} missed marker terms: ${markerFailures.map((m) => m.term).join("; ")}`);
    }
  }

  for (const fetchResult of sourceFetches) {
    if (!fetchResult.ok && acceptedSourceIds.has(fetchResult.source_id)) continue;
    if (!fetchResult.ok) {
      warnings.push(`Source fetch warning for ${fetchResult.source_id}: ${fetchResult.error || fetchResult.status}`);
    }
  }

  return { errors, warnings };
}

function buildNotes({ candidates, rejected, sourceFetches, priorFileCount, validation }) {
  const lines = [
    "# Round390 Belfast official architecture sweep next11",
    "",
    `Generated: ${GENERATED_AT}`,
    `Accessed: ${ACCESSED_AT}`,
    "",
    "## Scope",
    "",
    "Continues the Belfast official architecture/built-environment sweep after Round383. The pass prioritised public official sources from DfI and Belfast City Council, retained cautious status language, and avoided news-only/private evidence as sole support.",
    "",
    "## Accepted candidates",
    ""
  ];

  if (!candidates.length) {
    lines.push("- None passed provenance and duplicate screening.");
  } else {
    for (const candidate of candidates) {
      lines.push(
        `- ${candidate.date}: ${candidate.title} (${candidate.confidence}) -- source: ${candidate.source_name}. Caveat: ${candidate.limitations}`
      );
    }
  }

  lines.push(
    "",
    "## Duplicate and provenance screening",
    "",
    `- Prior file scan covered ${priorFileCount} manual/prior/script files under data/manual_drops, tmp/subagents and scripts, excluding this Round390 output folder and script.`,
    "- Accepted rows are not approvals, completions, construction starts or outcome claims unless the source directly says so.",
    "- The BCC Planning Committee pack was read as a committee-review/status source; it does not replace completion certificates, opening notices or final as-built plans.",
    "- DfI Hill Street is labelled as an experimental traffic-control/pedestrianisation measure, not a permanent public-realm completion.",
    "- DfI Lagan bridge is labelled as procurement-stage only, distinct from prior planning, funding and geotechnical investigation records.",
    "",
    "## Rejected or held leads",
    ""
  );

  for (const reject of rejected) {
    lines.push(`- ${reject.title}: ${reject.reason}`);
  }

  lines.push(
    "",
    "## Source fetch/readback",
    "",
    ...sourceFetches.map((result) => {
      const markers =
        result.marker_results && result.marker_results.length
          ? `${result.marker_results.filter((m) => m.found === true).length}/${result.marker_results.length} markers`
          : "no markers";
      return `- ${result.source_id}: ${result.ok ? "ok" : "warning"} (${result.status}; ${markers})`;
    }),
    "",
    "## Validation",
    "",
    validation.errors.length ? `Errors: ${validation.errors.join("; ")}` : "Errors: none",
    validation.warnings.length ? `Warnings: ${validation.warnings.join("; ")}` : "Warnings: none"
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  ensureDir(OUT_DIR);

  const priorFiles = getPriorFiles();
  const sourceIds = new Set(SOURCES.map((source) => source.source_id));
  const candidates = CANDIDATES.map((candidate) => ({
    ...candidate,
    duplicate_or_overlap_hits: scanDuplicateTerms(priorFiles, candidate.duplicate_check_terms)
  })).sort((a, b) => (a.date === b.date ? a.event_id.localeCompare(b.event_id) : a.date.localeCompare(b.date)));

  const rejected = REJECTED.map((reject) => ({
    ...reject,
    duplicate_or_overlap_hits: scanDuplicateTerms(priorFiles, reject.duplicate_check_terms || [])
  }));

  const sourceFetches = [];
  for (const source of SOURCES) {
    sourceFetches.push(await fetchTextSource(source));
  }

  const validation = validateCandidates(candidates, sourceIds, sourceFetches);
  const validationObject = {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: validation.errors.length === 0,
    errors: validation.errors,
    warnings: validation.warnings,
    checks: {
      required_fields: validation.errors.every((error) => !error.includes("missing required field")),
      belfast_coordinate_bounds: validation.errors.every((error) => !error.includes("outside Belfast sanity bounds")),
      date_window: DATE_WINDOW,
      confidence_values: ["documented", "corroborated", "inferred", "disputed"],
      source_references_known: validation.errors.every((error) => !error.includes("unknown source_id")),
      overclaim_scan: validation.errors.every((error) => !error.includes("overclaim scan")),
      accepted_source_fetches: candidates.flatMap((candidate) => candidate.source_ids).length,
      source_fetches_attempted: sourceFetches.length,
      prior_file_count: priorFiles.length
    }
  };

  const sourceAudit = {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    source_count: SOURCES.length,
    sources: SOURCES.map((source) => ({
      ...source,
      fetch_check: sourceFetches.find((result) => result.source_id === source.source_id) || null
    }))
  };

  const summary = {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    candidate_count: candidates.length,
    date_range: candidates.length
      ? {
          start: candidates.map((candidate) => candidate.date).sort()[0],
          end: candidates.map((candidate) => candidate.date).sort().at(-1)
        }
      : null,
    candidates: candidates.map((candidate) => ({
      event_id: candidate.event_id,
      date: candidate.date,
      title: candidate.title,
      source_ids: candidate.source_ids,
      confidence: candidate.confidence,
      major_caveat: candidate.limitations
    })),
    sources_checked: SOURCES.length,
    rejected_count: rejected.length,
    prior_file_count: priorFiles.length,
    validation_ok: validationObject.ok
  };

  const validationReport = {
    schema_version: `${ROUND_ID}.validation_report.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: validationObject.ok,
    candidate_count: candidates.length,
    rejected_count: rejected.length,
    accepted_source_ids: candidates.flatMap((candidate) => candidate.source_ids),
    source_fetch_summary: sourceFetches.map((result) => ({
      source_id: result.source_id,
      ok: result.ok,
      status: result.status,
      content_type: result.content_type,
      marker_match_count: result.marker_match_count ?? null,
      marker_count: result.marker_results ? result.marker_results.length : 0,
      error: result.error
    })),
    errors: validation.errors,
    warnings: validation.warnings
  };

  writeJson("candidates.json", {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    candidates
  });
  writeJson("source_audit.json", sourceAudit);
  writeJson("summary.json", summary);
  writeJson("rejected.json", {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    rejected_count: rejected.length,
    rejected
  });
  writeJson("validation.json", validationObject);
  writeJson("validation_report.json", validationReport);

  const notes = buildNotes({
    candidates,
    rejected,
    sourceFetches,
    priorFileCount: priorFiles.length,
    validation
  });
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), notes, "utf8");

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
    ok: validationObject.ok,
    output_dir: toPosixRelative(OUT_DIR),
    script_path: toPosixRelative(SCRIPT_PATH),
    files: outputFiles.map((fileName) => {
      const filePath = path.join(OUT_DIR, fileName);
      return {
        file: toPosixRelative(filePath),
        bytes: fs.statSync(filePath).size,
        sha256: sha256File(filePath)
      };
    }),
    parsed_counts: {
      candidates: JSON.parse(fs.readFileSync(path.join(OUT_DIR, "candidates.json"), "utf8")).candidate_count,
      sources: JSON.parse(fs.readFileSync(path.join(OUT_DIR, "source_audit.json"), "utf8")).source_count,
      rejected: JSON.parse(fs.readFileSync(path.join(OUT_DIR, "rejected.json"), "utf8")).rejected_count
    },
    candidate_ids: candidates.map((candidate) => candidate.event_id),
    validation_errors: validation.errors,
    validation_warnings: validation.warnings
  };
  writeJson("readback.json", readback);

  if (!validationObject.ok) {
    console.error(`Round390 validation failed with ${validation.errors.length} error(s).`);
    for (const error of validation.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        round_id: ROUND_ID,
        candidate_count: candidates.length,
        rejected_count: rejected.length,
        source_count: SOURCES.length,
        output_dir: toPosixRelative(OUT_DIR)
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
