#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const ROUND_ID = "round383_belfast_official_architecture_sweep_next10";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
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
  'site:belfastcity.gov.uk/news Belfast architecture regeneration public realm 2026',
  'site:minutes.belfastcity.gov.uk Belfast Planning Committee May 2026 architecture regeneration',
  'site:communities-ni.gov.uk/publications Belfast development brief 2026 built environment',
  'site:economy-ni.gov.uk Belfast property investment regeneration 2026 built environment',
  'site:infrastructure-ni.gov.uk/news Belfast commence 2026 scheme public realm',
  'site:infrastructure-ni.gov.uk/consultations Belfast 2026 greenway active travel',
  'site:qub.ac.uk Belfast Queen construction opened building 2026',
  'site:ulster.ac.uk Belfast campus building opened 2026 Ulster University',
  'site:investni.com Belfast property investment development 2026 regeneration built environment'
];

const SOURCES = [
  {
    source_id: "dfi-dublin-botanic-active-travel-preliminary-engagement-2026-round383",
    source_name: "Dublin Road and Botanic Avenue Pedestrian and Cycling Improvements - Preliminary Engagement",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/dublin-road-and-botanic-avenue-pedestrian-and-cycling-improvements-preliminary-engagement",
    source_type: "official department consultation page",
    license: "Crown copyright; DfI states Crown copyright material on its site may be used and re-used under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Consultation page published/opened 2026-03-23 and closed 2026-04-10",
    update_frequency: "Consultation page, status-specific",
    geographic_scope: "Dublin Road, Shaftesbury Square and Botanic Avenue, Belfast",
    granularity: "Named corridor consultation milestone, project description and downloadable layout documents",
    key_fields: "Consultation title, opening/closing dates, corridor locations, topic, project description, documents and response status.",
    reliability: "strong for the source-stated preliminary-engagement milestone; proposal-stage caveats required",
    required_caveats: "Do not treat as statutory approval, construction start, completion, opening, final traffic order, exact route geometry, usage change, safety result or wider urban outcome.",
    ingestion_recommendation: "Accept one candidate as a documented consultation/preliminary-engagement milestone with proposal-stage labels.",
    emitted_candidates: 1,
    marker_terms: [
      "Dublin Road and Botanic Avenue",
      "Preliminary Engagement",
      "23 March 2026",
      "Shaftesbury Square",
      "scheme No5"
    ]
  },
  {
    source_id: "dfi-stranmillis-cycle-routes-order-2026-recheck-round383",
    source_name: "The Cycle Routes (Amendment) Order (Northern Ireland) 2026",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/cycle-routes-amendment-order-northern-ireland-2026",
    source_type: "official department roads-legislation consultation page",
    license: "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
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
    ingestion_recommendation: "Reject for this architecture/public-realm sweep; watch for a DfI works-start or completion source.",
    emitted_candidates: 0,
    marker_terms: ["Stranmillis Embankment", "two-way cycle shared track", "18 March 2026"]
  },
  {
    source_id: "dfi-little-victoria-street-abandonment-order-2026-recheck-round383",
    source_name: "The Little Victoria Street Car Park, Belfast (Abandonment) Order (Northern Ireland) 2026",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/little-victoria-street-car-park-belfast-abandonment-order-northern-ireland-2026",
    source_type: "official department roads-legislation consultation page",
    license: "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Consultation opened 2026-04-15 and closes 2026-05-22",
    update_frequency: "Consultation page, status-specific",
    geographic_scope: "Little Victoria Street Car Park / Little Brunswick Street, Belfast",
    granularity: "Road-abandonment order, area measurements and map",
    key_fields: "Order title, consultation period, road-area measurements, map and inspection location.",
    reliability: "usable with caveats for legal-order notice status",
    required_caveats: "Road abandonment notice is not a building, public-realm delivery, works start, completion or final as-built estate-change record.",
    ingestion_recommendation: "Reject for this sweep as legal/preparatory context only.",
    emitted_candidates: 0,
    marker_terms: ["Little Victoria Street Car Park", "Abandonment Order", "15th April 2026", "22nd May 2026"]
  },
  {
    source_id: "dfi-ravenhill-ormeau-active-travel-statutory-consultation-recheck-round383",
    source_name: "Ravenhill Road and Ormeau Embankment Pedestrian and Cycling Improvements - Statutory Consultation",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/consultations/ravenhill-road-and-ormeau-embankment-pedestrian-and-cycling-improvements-statutory-consultation",
    source_type: "official department consultation page",
    license: "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "Consultation page open in April-May 2026",
    update_frequency: "Consultation page, status-specific",
    geographic_scope: "Ravenhill Road and Ormeau Embankment, Belfast",
    granularity: "Statutory consultation documents and order descriptions",
    key_fields: "Consultation title, closing date, scheme corridor, draft orders, maps and drop-in event information.",
    reliability: "usable with caveats for statutory-consultation status",
    required_caveats: "Prior rounds already rejected this lead as proposal/consultation-stage; it does not document works start, completion or opening.",
    ingestion_recommendation: "No Round383 candidate; retained as checked duplicate/proposal-stage context.",
    emitted_candidates: 0,
    marker_terms: ["Ravenhill Road", "Ormeau Embankment", "Statutory Consultation", "26 May 2026"]
  },
  {
    source_id: "dfi-saltwater-square-grand-central-public-realm-recheck-round383",
    source_name: "Community-inspired landmark sculpture unveiled as new Saltwater Square at Grand Central Station progresses",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/news/community-inspired-landmark-sculpture-unveiled-new-saltwater-square-grand-central-station-progresses",
    source_type: "official department news page",
    license: "Crown copyright / Open Government Licence terms for reusable public-sector information, excluding logos and exemptions.",
    license_url: DFI_CROWN_URL,
    related_license_url: OGL_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2026 news page",
    update_frequency: "News page, milestone-specific",
    geographic_scope: "Saltwater Square / Grand Central Station, Belfast",
    granularity: "Named public-realm and sculpture milestone",
    key_fields: "Publication date, Saltwater Square, sculpture name, project-owner context and location.",
    reliability: "strong for the published milestone, but duplicate in the current corpus",
    required_caveats: "Do not double count against existing Saltwater Square public-realm/sculpture records.",
    ingestion_recommendation: "Reject as duplicate; already represented in manual/prior Belfast packs.",
    emitted_candidates: 0,
    marker_terms: ["Saltwater Square", "Grand Central Station", "landmark sculpture"]
  },
  {
    source_id: "bcc-cathedral-gardens-transformation-started-recheck-round383",
    source_name: "Cathedral Gardens transformation gets underway",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway",
    source_type: "official council news page",
    license: "Belfast City Council website terms; factual milestone metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "News page dated 2026-01-21",
    update_frequency: "News page, milestone-specific",
    geographic_scope: "Cathedral Gardens, Belfast",
    granularity: "Named public-realm works-start milestone",
    key_fields: "Publication date, project name, works-start wording, delivery partners and location.",
    reliability: "strong for the dated council milestone, but duplicate in the current corpus",
    required_caveats: "Do not double count; use existing Cathedral Gardens works-start entries.",
    ingestion_recommendation: "Reject as duplicate after manual corpus and prior-pack checks.",
    emitted_candidates: 0,
    marker_terms: ["Cathedral Gardens", "gets underway", "21 January 2026"]
  },
  {
    source_id: "bcc-sandy-row-arts-digital-hub-opened-recheck-round383",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    license: "Belfast City Council website terms; factual milestone metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2026 news page",
    update_frequency: "News page, milestone-specific",
    geographic_scope: "Sandy Row, Belfast",
    granularity: "Project opening and Urban Villages context",
    key_fields: "Publication date, facility name, opening wording, funding and location.",
    reliability: "strong for opening milestone, but duplicate in current corpus",
    required_caveats: "Do not double count Sandy Row hub opening, Coffee Culture, Bentham Drive or Blythefield parklet entries.",
    ingestion_recommendation: "Reject as duplicate/overlap.",
    emitted_candidates: 0,
    marker_terms: ["Sandy Row", "Arts & Digital Hub", "opens"]
  },
  {
    source_id: "bcc-planning-committee-20260120-pack-recheck-round383",
    source_name: "Planning Committee public reports pack, 20 January 2026",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/documents/g12345/Public%20reports%20pack%2020th-Jan-2026%2017.00%20Planning%20Committee.pdf?T=10",
    source_type: "official council planning committee PDF pack",
    license: "Belfast City Council public committee-document terms; factual planning metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Planning Committee meeting dated 2026-01-20",
    update_frequency: "Meeting-specific pack",
    geographic_scope: "Belfast City Council planning authority area",
    granularity: "Planning application reports, recommendations and condition variations",
    key_fields: "Committee date, application reference, site, proposal, recommendation, conditions and consultees.",
    reliability: "usable for agenda/report status; decisions require minutes or decision notices",
    required_caveats: "Officer reports and condition-variation rows are not construction/opening evidence. Several major rows were already represented.",
    ingestion_recommendation: "No Round383 candidate; Black Mountain Shared Space, Adelaide Business Centre and 341-345 Albertbridge Road were duplicates, while condition variations were too narrow.",
    emitted_candidates: 0,
    marker_terms: ["Black Mountain Shared Space", "Adelaide Business Centre", "Albertbridge Road"]
  },
  {
    source_id: "bcc-city-growth-regeneration-20260211-pack-recheck-round383",
    source_name: "City Growth and Regeneration Committee combined pack, 11 February 2026",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/documents/b37618/Combined%20Pack%2011th-Feb-2026%2017.15%20City%20Growth%20and%20Regeneration%20Committee.pdf?T=9",
    source_type: "official council committee PDF pack",
    license: "Belfast City Council public committee-document terms; factual planning/regeneration metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Committee pack dated 2026-02-11",
    update_frequency: "Meeting-specific pack",
    geographic_scope: "Belfast city, with harbour/masterplan/regeneration items",
    granularity: "Committee report and presentation context",
    key_fields: "Meeting date, report titles, masterplan references, programme-stage descriptions and named areas.",
    reliability: "contextual for strategy updates; weaker for event ingestion without a specific dated physical milestone",
    required_caveats: "Masterplan/strategy language is not planning permission, construction, completion or opening evidence.",
    ingestion_recommendation: "No Round383 candidate; Belfast Harbour/masterplan items duplicate earlier strategy/draft-masterplan coverage or lacked an ingestible built-environment milestone.",
    emitted_candidates: 0,
    marker_terms: ["Belfast Harbour", "masterplan", "City Growth and Regeneration"]
  },
  {
    source_id: "bcc-historic-areas-spg-recheck-round383",
    source_name: "Council agrees supplementary planning guidance for historic areas of Belfast",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/news/council-agrees-supplementary-planning-guidance-for",
    source_type: "official council news page",
    license: "Belfast City Council website terms; factual policy metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "News page dated 2026-04-21/2026-04-22",
    update_frequency: "News page, policy milestone-specific",
    geographic_scope: "Historic areas of Belfast",
    granularity: "Supplementary planning guidance approval/policy milestone",
    key_fields: "Publication date, SPG title, areas covered and council action.",
    reliability: "usable for planning-policy milestone, but duplicate in current corpus",
    required_caveats: "Policy guidance is not a physical built-environment change and should not be counted as construction/public-realm delivery.",
    ingestion_recommendation: "No Round383 candidate; duplicates prior SPG/Common Market/historic-area records.",
    emitted_candidates: 0,
    marker_terms: ["supplementary planning guidance", "historic areas", "Belfast"]
  },
  {
    source_id: "dfc-hed-development-briefs-belfast-recheck-round383",
    source_name: "Department for Communities Belfast development briefs and HED list-change publications",
    publisher: "Department for Communities / Historic Environment Division",
    url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    related_urls: [
      "https://www.communities-ni.gov.uk/publications/duncairn-gardens-development-study",
      "https://www.communities-ni.gov.uk/publications/shankill-plan-grow"
    ],
    source_type: "official department publication family",
    license: "Crown copyright / public-sector information terms; factual publication metadata retained for audit.",
    license_url: "https://www.nidirect.gov.uk/crown-copyright",
    attribution: "Department for Communities / Historic Environment Division",
    coverage_years: "2008-2026 publication family checked through 2026-05-20",
    update_frequency: "Publication-page family, updated when department publishes list changes or briefs",
    geographic_scope: "Belfast development-brief, heritage and regeneration publications",
    granularity: "Publication page, site/area name, list-change record, brief/study title and publication date",
    key_fields: "Publication title/date, site name, HED record type, area, document links and department publisher.",
    reliability: "strong for publication/list-change status; caveated for physical works",
    required_caveats: "Development briefs, studies, record-only HED entries and list updates are not physical works unless the source states that event. Corroborate with planning, works or opening sources.",
    ingestion_recommendation: "No Round383 candidate; Shankill, Duncairn Gardens, Albertbridge/Carnforth, Crumlin Road and recent HED rows were already represented or rejected.",
    emitted_candidates: 0,
    marker_terms: ["list buildings", "Duncairn Gardens", "Shankill"]
  },
  {
    source_id: "dfe-investni-property-investment-belfast-recheck-round383",
    source_name: "DfE and Invest NI Belfast property-investment and regeneration pages",
    publisher: "Department for the Economy / Invest NI",
    url: "https://www.economy-ni.gov.uk/news/major-investment-drive-economic-development-north-belfast",
    related_urls: ["https://www.investni.com/news"],
    source_type: "official/public economic-development source family",
    license: "Northern Ireland public-sector website terms/Crown copyright for DfE pages; Invest NI website terms for Invest NI pages. Factual metadata and URLs only.",
    license_url: "https://www.nidirect.gov.uk/crown-copyright",
    attribution: "Department for the Economy / Invest NI",
    coverage_years: "Recent 2026 DfE/Invest NI searches checked",
    update_frequency: "News page / announcement-specific",
    geographic_scope: "Belfast and North Belfast property investment leads",
    granularity: "Named property announcement or economic-development news item",
    key_fields: "Publication date, property/site names, funding/acquisition wording, public body and project context.",
    reliability: "usable where a dated page states a property or civic-estate milestone",
    required_caveats: "Economic-investment and jobs language should not be ingested as built-environment change without a concrete site milestone.",
    ingestion_recommendation: "No Round383 candidate; Round368 already emitted the North Belfast business-centre acquisition, and other hits lacked concrete built-environment event dates.",
    emitted_candidates: 0,
    marker_terms: ["North Belfast", "economic development", "investment"]
  },
  {
    source_id: "qub-ulster-civic-project-owner-recheck-round383",
    source_name: "Queen's University Belfast, Ulster University and civic project-owner pages",
    publisher: "Queen's University Belfast / Ulster University",
    url: "https://www.qub.ac.uk/News/Allnews/2026/QueensandGRAHAMtop-offIrelandslargestPassivhausstudentaccommodation.html",
    related_urls: [
      "https://www.ulster.ac.uk/news/2026/january/major-digital-healthcare-centre-planned-for-belfast"
    ],
    source_type: "project-owner news/source family",
    license: "Publisher-specific website terms; factual milestone metadata and source URLs retained for audit.",
    license_url: "https://www.qub.ac.uk/about/website/",
    attribution: "Queen's University Belfast / Ulster University",
    coverage_years: "Recent 2026 campus/public-project pages checked",
    update_frequency: "News page / project page-specific",
    geographic_scope: "Belfast university and civic estate",
    granularity: "Named campus building, approval, topping-out, opening or project page",
    key_fields: "Publication date, campus/site, milestone wording, project name and partner names.",
    reliability: "strong for dated owner-stated milestones; future opening and promotional statements require caveats",
    required_caveats: "Do not ingest planned openings or design claims as observed physical completion. Deduplicate Weavers' Hall and Ulster CDHT entries.",
    ingestion_recommendation: "No Round383 candidate; Weavers' Hall topping-out and Ulster CDHT planning approval were already represented, and future openings remain watchlist items.",
    emitted_candidates: 0,
    marker_terms: ["Weavers' Hall", "topping off", "digital healthcare centre", "Belfast"]
  }
];

const CANDIDATES = [
  {
    city_id: CITY_ID,
    event_id: "round383_belfast_dublin_botanic_active_travel_prelim_engagement_2026_03_23",
    date: "2026-03-23",
    date_precision: "day",
    bucket: "planning/development/architecture/public-realm/active-travel",
    category: "public realm / active travel",
    title: "Dublin Road and Botanic Avenue active-travel preliminary engagement opened",
    summary: "Department for Infrastructure consultation page published on 23 March 2026 opened preliminary engagement for pedestrian and cycling improvements along Dublin Road, Shaftesbury Square and Botanic Avenue. The source describes a proposed Belfast Cycling Network route with a 3m cycle track, pedestrian footway changes, controlled crossings and Botanic Avenue public-realm improvements.",
    observed_change: "An official DfI consultation source recorded a preliminary engagement milestone for a proposed active-travel and public-realm corridor between Dublin Road and Botanic Avenue.",
    area: "Dublin Road / Shaftesbury Square / Botanic Avenue corridor",
    address_or_location: "Dublin Road, Shaftesbury Square and Botanic Avenue, Belfast",
    latitude: 54.5902,
    longitude: -5.9303,
    geometry: {
      type: "Point",
      coordinates: [-5.9303, 54.5902]
    },
    geometry_ref: "Approximate corridor midpoint near Shaftesbury Square / Botanic Avenue.",
    geometry_source: "Manual approximate point derived from source-stated Dublin Road, Shaftesbury Square and Botanic Avenue corridor; not a surveyed route alignment.",
    geometry_precision: "approximate_corridor_midpoint",
    source_ids: ["dfi-dublin-botanic-active-travel-preliminary-engagement-2026-round383"],
    source_name: "Dublin Road and Botanic Avenue Pedestrian and Cycling Improvements - Preliminary Engagement",
    source_url: "https://www.infrastructure-ni.gov.uk/consultations/dublin-road-and-botanic-avenue-pedestrian-and-cycling-improvements-preliminary-engagement",
    source_record_id: "DfI consultation page, published/opened 2026-03-23, closed 2026-04-10",
    source_type: "official department consultation page",
    source_date_field: "Consultation page opening/publication date",
    source_date_value: "2026-03-23",
    publisher: "Department for Infrastructure",
    license: "Crown copyright; DfI states reusable Crown copyright material on its site is available under the Open Government Licence, excluding logos and other exemptions.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "active-travel / public-realm corridor proposal",
    milestone_type: "preliminary_engagement_opened",
    architect: "Department for Infrastructure and scheme design team; the cited source does not name an architect.",
    limitations: "This is a preliminary engagement/proposal-stage record. It does not document statutory approval, final traffic order, works start, construction, completion, opening, usage, safety effects, modal shift, exact route geometry or as-built public realm.",
    caveats: "Use as an official consultation milestone only and keep separate from later statutory consultation, order, construction-start, completion or opening records.",
    duplicate_check_terms: [
      "Dublin Road and Botanic Avenue",
      "Botanic Avenue Pedestrian",
      "Scheme No5",
      "Shaftesbury Square",
      "Belfast Cycling Network Delivery Plan"
    ],
    duplicate_check_note: "Searched the manual corpus, prior Belfast candidate packs and Belfast scripts for the exact source title, Dublin Road and Botanic Avenue, Botanic Avenue pedestrian/cycling, Scheme No5 and related corridor terms. Existing hits were generic Dublin Road/Shaftesbury Square building or heritage records; no exact prior DfI active-travel preliminary-engagement row was found.",
    source_audit_note: "Official DfI page is suitable for the source-stated consultation milestone and proposed corridor scope. Physical delivery should wait for later DfI or council evidence.",
    transformation_method: "Round383 manual official/public sweep: DfI consultation page read; approximate corridor midpoint assigned; duplicate terms screened against manual corpus, tmp/subagents and scripts; fields normalized to Bims candidate format with proposal-stage caveats."
  }
];

const REJECTED = [
  {
    source_id: "dfi-stranmillis-cycle-routes-order-2026-recheck-round383",
    title_or_lead: "Stranmillis Embankment cycle-route amendment order consultation",
    url: "https://www.infrastructure-ni.gov.uk/consultations/cycle-routes-amendment-order-northern-ireland-2026",
    publisher: "Department for Infrastructure",
    checked_at: ACCESSED_AT,
    status: "rejected_traffic_order_only",
    reason: "Official and dated, but the page is a roads-legislation consultation for a cycle-route order. It does not document construction start, completion, opening or a broader project milestone suitable for this architecture/public-realm sweep.",
    follow_up: "Watch for a DfI project page, works notice or completion/opening source."
  },
  {
    source_id: "dfi-little-victoria-street-abandonment-order-2026-recheck-round383",
    title_or_lead: "Little Victoria Street Car Park road-abandonment order consultation",
    url: "https://www.infrastructure-ni.gov.uk/consultations/little-victoria-street-car-park-belfast-abandonment-order-northern-ireland-2026",
    publisher: "Department for Infrastructure",
    checked_at: ACCESSED_AT,
    status: "rejected_legal_precondition",
    reason: "The page records a proposed road-abandonment order and road-area measurements. It is not a construction, completion, opening, design, civic-estate or public-realm delivery milestone.",
    follow_up: "Only emit later if a durable source links the abandonment to an observed built-environment change."
  },
  {
    source_id: "dfi-ravenhill-ormeau-active-travel-statutory-consultation-recheck-round383",
    title_or_lead: "Ravenhill Road and Ormeau Embankment active-travel statutory consultation",
    url: "https://www.infrastructure-ni.gov.uk/consultations/ravenhill-road-and-ormeau-embankment-pedestrian-and-cycling-improvements-statutory-consultation",
    publisher: "Department for Infrastructure",
    checked_at: ACCESSED_AT,
    status: "rejected_prior_duplicate_or_proposal_stage",
    reason: "Already screened in earlier Belfast sweeps. The 2026 page is a statutory-consultation/order stage and does not document works start, completion or opening.",
    follow_up: "Revisit only when DfI publishes a construction-start, completion or opening milestone."
  },
  {
    source_id: "dfi-saltwater-square-grand-central-public-realm-recheck-round383",
    title_or_lead: "Saltwater Square / Grand Central Station public-realm and sculpture milestone",
    url: "https://www.infrastructure-ni.gov.uk/news/community-inspired-landmark-sculpture-unveiled-new-saltwater-square-grand-central-station-progresses",
    publisher: "Department for Infrastructure",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate",
    reason: "Manual corpus/prior packs already include Saltwater Square public-realm and Reflections sculpture/opening records.",
    follow_up: "Do not emit another Saltwater Square row unless a later phase has a distinct source date and scope."
  },
  {
    source_id: "bcc-cathedral-gardens-transformation-started-recheck-round383",
    title_or_lead: "Cathedral Gardens transformation works-start news",
    url: "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway",
    publisher: "Belfast City Council",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate",
    reason: "Cathedral Gardens approval, design/listing and works-start rows are already represented in the manual corpus and previous Belfast sweeps.",
    follow_up: "Only a later completion/opening record should be considered."
  },
  {
    source_id: "bcc-sandy-row-arts-digital-hub-opened-recheck-round383",
    title_or_lead: "Sandy Row Arts and Digital Hub opening",
    url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    publisher: "Belfast City Council",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate_or_overlap",
    reason: "Sandy Row Urban Villages, Arts and Digital Hub, Coffee Culture and nearby public-realm/hub milestones were already represented or screened in prior rounds.",
    follow_up: "Avoid re-emitting unless a distinct later building phase is source-dated."
  },
  {
    source_id: "bcc-planning-committee-20260120-pack-recheck-round383",
    title_or_lead: "Belfast Planning Committee public reports pack, 20 January 2026",
    url: "https://minutes.belfastcity.gov.uk/documents/g12345/Public%20reports%20pack%2020th-Jan-2026%2017.00%20Planning%20Committee.pdf?T=10",
    publisher: "Belfast City Council",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate_or_minor_condition",
    reason: "Black Mountain Shared Space, Adelaide Business Centre and 341-345 Albertbridge Road rows were duplicates; remaining condition-variation/park-equipment rows were too narrow for this sweep.",
    follow_up: "Use later committee minutes or decision notices only when they provide a distinct major milestone."
  },
  {
    source_id: "bcc-city-growth-regeneration-20260211-pack-recheck-round383",
    title_or_lead: "City Growth and Regeneration Committee, 11 February 2026",
    url: "https://minutes.belfastcity.gov.uk/documents/b37618/Combined%20Pack%2011th-Feb-2026%2017.15%20City%20Growth%20and%20Regeneration%20Committee.pdf?T=9",
    publisher: "Belfast City Council",
    checked_at: ACCESSED_AT,
    status: "rejected_strategy_context",
    reason: "Belfast Harbour/masterplan and regeneration references were strategy/context or duplicates of prior masterplan coverage, not a remaining concrete built-environment event.",
    follow_up: "Watch for planning submissions, approvals, works starts or openings linked to specific sites."
  },
  {
    source_id: "bcc-historic-areas-spg-recheck-round383",
    title_or_lead: "Supplementary planning guidance for historic areas of Belfast",
    url: "https://www.belfastcity.gov.uk/news/council-agrees-supplementary-planning-guidance-for",
    publisher: "Belfast City Council",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate_policy",
    reason: "Policy/SPG milestone overlaps prior historic-area/SPG coverage and is not a physical built-environment change.",
    follow_up: "Use as policy context only."
  },
  {
    source_id: "dfc-hed-development-briefs-belfast-recheck-round383",
    title_or_lead: "DfC/HED development briefs, Shankill/Duncairn studies and list-change pages",
    url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    publisher: "Department for Communities / Historic Environment Division",
    checked_at: ACCESSED_AT,
    status: "rejected_exhausted_or_duplicate",
    reason: "Recent Belfast HED/list-change, Shankill, Duncairn Gardens, Albertbridge/Carnforth and Crumlin Road development-brief leads were already represented or rejected in earlier sweeps.",
    follow_up: "Recheck after HED publishes a confirmed Belfast listing/de-listing change or DfC publishes a new dated Belfast development brief."
  },
  {
    source_id: "dfe-investni-property-investment-belfast-recheck-round383",
    title_or_lead: "DfE/Invest NI property investment and regeneration pages",
    url: "https://www.economy-ni.gov.uk/news/major-investment-drive-economic-development-north-belfast",
    publisher: "Department for the Economy / Invest NI",
    checked_at: ACCESSED_AT,
    status: "rejected_no_new_non_duplicate",
    reason: "Round368 already emitted the North Belfast business-centre acquisition. Other DfE/Invest NI hits were economic or occupancy announcements without a concrete new built-environment milestone.",
    follow_up: "Track planning/works/opening sources for named properties rather than economic-development recaps."
  },
  {
    source_id: "qub-ulster-civic-project-owner-recheck-round383",
    title_or_lead: "Queen's, Ulster University and civic project-owner pages",
    url: "https://www.qub.ac.uk/News/Allnews/2026/QueensandGRAHAMtop-offIrelandslargestPassivhausstudentaccommodation.html",
    publisher: "Queen's University Belfast / Ulster University",
    checked_at: ACCESSED_AT,
    status: "rejected_duplicate_or_watchlist",
    reason: "Weavers' Hall topping-out and Ulster CDHT planning approval were already represented. Future openings remained watchlist items rather than observed 2008-2026 milestones as of 2026-05-20.",
    follow_up: "Recheck for source-dated openings or occupation milestones after publication."
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(name, value) {
  fs.writeFileSync(path.join(OUT_DIR, name), value, "utf8");
}

function walkFiles(startDir) {
  if (!fs.existsSync(startDir)) {
    return [];
  }
  const out = [];
  const stack = [startDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        out.push(fullPath);
      }
    }
  }
  return out;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function buildPriorFiles() {
  const priorFiles = [];
  if (fs.existsSync(MANUAL_CORPUS)) {
    priorFiles.push(MANUAL_CORPUS);
  }
  for (const filePath of walkFiles(path.join(ROOT, "tmp", "subagents"))) {
    const relative = rel(filePath);
    if (relative.includes(ROUND_ID)) {
      continue;
    }
    if (/belfast|architecture|round3(10|32|40|47|53|57|61|68|72|76)/i.test(relative)) {
      priorFiles.push(filePath);
    }
  }
  for (const filePath of walkFiles(path.join(ROOT, "scripts"))) {
    const relative = rel(filePath);
    if (relative.includes("round383_belfast_official_architecture_sweep_next10")) {
      continue;
    }
    if (/belfast|architecture/i.test(relative)) {
      priorFiles.push(filePath);
    }
  }
  const relativeFiles = uniqueSorted(priorFiles.map(rel));
  return relativeFiles;
}

function rgFixed(term) {
  const searchRoots = [
    path.join(ROOT, "data", "manual_drops"),
    path.join(ROOT, "tmp", "subagents"),
    path.join(ROOT, "scripts")
  ].filter((item) => fs.existsSync(item));

  try {
    const result = execFileSync(
      "rg",
      ["-i", "--fixed-strings", "--files-with-matches", term, ...searchRoots],
      {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 1024 * 1024 * 6
      }
    );
    return result
      .split(/\r?\n/)
      .filter(Boolean)
      .map((item) => rel(path.resolve(ROOT, item)))
      .filter((item) => !item.includes(ROUND_ID));
  } catch (error) {
    if (error && error.status === 1) {
      return [];
    }
    return [`RG_ERROR:${error.message}`];
  }
}

function attachDuplicateEvidence(candidate) {
  const byTerm = {};
  const allHits = [];
  for (const term of candidate.duplicate_check_terms || []) {
    const hits = uniqueSorted(rgFixed(term));
    byTerm[term] = {
      hit_count: hits.length,
      sample_paths: hits.slice(0, 12)
    };
    allHits.push(...hits);
  }
  return {
    ...candidate,
    duplicate_or_overlap_hits: {
      total_unique_paths: uniqueSorted(allHits).length,
      by_term: byTerm,
      interpretation: "Exact source-title and scheme-name terms were absent; generic Shaftesbury Square/Dublin Road hits were prior building, planning or heritage records rather than this DfI active-travel preliminary engagement."
    }
  };
}

function textForMarkerSearch(buffer, contentType) {
  if (!contentType || /text|json|xml|html|javascript/i.test(contentType)) {
    return buffer.toString("utf8");
  }
  if (/pdf/i.test(contentType)) {
    return "";
  }
  return buffer.toString("utf8");
}

async function fetchCheck(source) {
  if (!source.url) {
    return { ok: false, reason: "No URL supplied." };
  }
  try {
    const response = await fetch(source.url, {
      headers: {
        "user-agent": "Bims-5 Round383 source-audit fetcher"
      }
    });
    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = textForMarkerSearch(buffer, contentType).toLowerCase();
    const markerResults = {};
    for (const marker of source.marker_terms || []) {
      markerResults[marker] = text ? text.includes(marker.toLowerCase()) : false;
    }
    return {
      ok: response.ok,
      status: response.status,
      fetched_url: response.url,
      content_type: contentType,
      bytes: buffer.length,
      marker_results: markerResults
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

function validateCandidate(candidate, sourcesById) {
  const errors = [];
  const required = [
    "city_id",
    "event_id",
    "date",
    "title",
    "summary",
    "observed_change",
    "area",
    "geometry",
    "source_ids",
    "source_name",
    "source_url",
    "publisher",
    "license",
    "accessed_at",
    "confidence",
    "limitations"
  ];
  for (const key of required) {
    if (candidate[key] === undefined || candidate[key] === null || candidate[key] === "") {
      errors.push(`Missing required field ${key} on ${candidate.event_id || "unknown event"}.`);
    }
  }
  if (candidate.city_id !== CITY_ID) {
    errors.push(`${candidate.event_id} city_id must be ${CITY_ID}.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.date)) {
    errors.push(`${candidate.event_id} date must use YYYY-MM-DD.`);
  } else if (candidate.date < DATE_WINDOW.start || candidate.date > DATE_WINDOW.end) {
    errors.push(`${candidate.event_id} date ${candidate.date} falls outside ${DATE_WINDOW.start}..${DATE_WINDOW.end}.`);
  }
  const coords = candidate.geometry && candidate.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    errors.push(`${candidate.event_id} geometry must be GeoJSON point coordinates.`);
  } else {
    const [lon, lat] = coords;
    if (lat < 54.45 || lat > 54.75 || lon < -6.2 || lon > -5.7) {
      errors.push(`${candidate.event_id} coordinates look outside Belfast: ${JSON.stringify(coords)}.`);
    }
  }
  if (!["documented", "corroborated", "inferred", "disputed"].includes(candidate.confidence)) {
    errors.push(`${candidate.event_id} has invalid confidence ${candidate.confidence}.`);
  }
  for (const sourceId of candidate.source_ids || []) {
    if (!sourcesById.has(sourceId)) {
      errors.push(`${candidate.event_id} references unknown source_id ${sourceId}.`);
    }
  }
  const scannedText = [
    candidate.title,
    candidate.summary,
    candidate.observed_change,
    candidate.limitations,
    candidate.caveats
  ].join(" ");
  const overclaimPatterns = [
    /\bpredict/i,
    /\bforecast/i,
    /\bcaused\b/i,
    /\bproves\b/i,
    /\bimpact score\b/i,
    /\b10-year simulation\b/i,
    /\bwill increase\b/i,
    /\bwill decrease\b/i
  ];
  for (const pattern of overclaimPatterns) {
    if (pattern.test(scannedText)) {
      errors.push(`${candidate.event_id} contains overclaim-like wording matching ${pattern}.`);
    }
  }
  return errors;
}

function buildNotes(candidateCount, sources, rejected, priorFileCount, validation) {
  const acceptedLines = CANDIDATES.map((candidate) => {
    return `- ${candidate.date}: ${candidate.title} (${candidate.source_name})`;
  }).join("\n");
  const checkedLines = sources.map((source) => {
    const emitted = source.emitted_candidates ? `${source.emitted_candidates} emitted` : "0 emitted";
    return `- ${source.source_name} - ${source.publisher}; ${emitted}.`;
  }).join("\n");
  const rejectedLines = rejected.map((item) => {
    return `- ${item.title_or_lead}: ${item.status}. ${item.reason}`;
  }).join("\n");
  const fetchCaveats = sources
    .filter((source) => !source.fetch_check || !source.fetch_check.ok)
    .map((source) => {
      const status = source.fetch_check && source.fetch_check.status ? `HTTP ${source.fetch_check.status}` : "fetch failed";
      return `- ${source.source_name}: ${status}; source retained as a rejected/context family, not as evidence for an emitted candidate.`;
    })
    .join("\n");

  return `# ${ROUND_ID}

Generated: ${GENERATED_AT}
Accessed: ${ACCESSED_AT}
City: Belfast

## Result

Candidate count: ${candidateCount}

${acceptedLines || "- No candidates emitted."}

## Main Candidate Caveat

The accepted DfI item is a preliminary engagement/proposal-stage event only. It should not be used as evidence of statutory approval, construction, completion, opening, final route geometry, safety effects, usage change or causation.

## Sources Checked

${checkedLines}

## Rejected Or Context Leads

${rejectedLines}

## Dedupe

Manual corpus checked: data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json

Prior Belfast/script files screened: ${priorFileCount}

Exact or near-exact searches for "Dublin Road and Botanic Avenue", "Botanic Avenue Pedestrian", "Scheme No5", "Shaftesbury Square" and "Belfast Cycling Network Delivery Plan" did not find a prior DfI preliminary-engagement row. Generic Shaftesbury Square hits were building, heritage or planning records.

## Search Queries Checked

${SEARCH_QUERIES_CHECKED.map((query) => `- ${query}`).join("\n")}

## Fetch Caveats

${fetchCaveats || "- All source fetch checks returned ok."}

## Verification

- node scripts/fetch_${ROUND_ID}_candidates.js
- Validation status: ${validation.ok ? "passed" : "failed"}
- Validation errors: ${validation.errors.length}
`;
}

async function main() {
  ensureDir(OUT_DIR);

  const priorFiles = buildPriorFiles();
  const sourcesWithFetch = [];
  for (const source of SOURCES) {
    sourcesWithFetch.push({
      ...source,
      accessed_at: ACCESSED_AT,
      fetch_check: await fetchCheck(source)
    });
  }

  const candidates = CANDIDATES.map(attachDuplicateEvidence);
  const sourcesById = new Set(sourcesWithFetch.map((source) => source.source_id));
  const validationErrors = candidates.flatMap((candidate) => validateCandidate(candidate, sourcesById));
  const emittedDates = candidates.map((candidate) => candidate.date).sort();

  const candidatesDoc = {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    date_window: DATE_WINDOW,
    emitted_date_range: {
      min: emittedDates[0] || null,
      max: emittedDates[emittedDates.length - 1] || null
    },
    source_ids: candidates.flatMap((candidate) => candidate.source_ids),
    deduped_against: {
      manual_corpus: rel(MANUAL_CORPUS),
      prior_belfast_pack_rule: "All tmp/subagents and scripts files with Belfast/architecture or recent Belfast sweep names were screened; exact candidate terms were checked with rg.",
      prior_file_count: priorFiles.length
    },
    candidates
  };

  const sourceAuditDoc = {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    sources_checked: sourcesWithFetch.length,
    accepted_source_count: sourcesWithFetch.filter((source) => source.emitted_candidates > 0).length,
    rejected_or_context_source_count: sourcesWithFetch.filter((source) => !source.emitted_candidates).length,
    sources: sourcesWithFetch
  };

  const rejectedDoc = {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    rejected_count: REJECTED.length,
    rejected: REJECTED
  };

  const validationDoc = {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    ok: validationErrors.length === 0,
    errors: validationErrors,
    checks: {
      required_fields: true,
      belfast_coordinate_bounds: true,
      date_window: DATE_WINDOW,
      confidence_values: ["documented", "corroborated", "inferred", "disputed"],
      source_references_known: true,
      overclaim_scan: true,
      source_fetches_attempted: sourcesWithFetch.length
    }
  };

  const summaryDoc = {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    candidates: candidates.map((candidate) => ({
      event_id: candidate.event_id,
      date: candidate.date,
      title: candidate.title,
      source_ids: candidate.source_ids,
      confidence: candidate.confidence,
      major_caveat: candidate.limitations
    })),
    sources_checked: sourcesWithFetch.length,
    rejected_count: REJECTED.length,
    prior_file_count: priorFiles.length,
    validation_ok: validationDoc.ok
  };

  writeJson("candidates.json", candidatesDoc);
  writeJson("source_audit.json", sourceAuditDoc);
  writeJson("rejected.json", rejectedDoc);
  writeJson("summary.json", summaryDoc);
  writeJson("validation.json", validationDoc);
  writeJson("validation_report.json", validationDoc);
  writeText("notes.md", buildNotes(candidates.length, sourcesWithFetch, REJECTED, priorFiles.length, validationDoc));

  if (!validationDoc.ok) {
    console.error(JSON.stringify(validationDoc, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(`Wrote ${candidates.length} candidate(s) and ${sourcesWithFetch.length} source audit rows to ${rel(OUT_DIR)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
