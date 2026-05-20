#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROUND_ID = "round376_belfast_official_architecture_sweep_next9";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const DATE_WINDOW = { start: "2008-01-01", end: "2026-05-20" };
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const MANUAL_CORPUS = path.join(
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const CROWN_COPYRIGHT_URL = "https://www.nidirect.gov.uk/crown-copyright";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const SEARCH_QUERIES_CHECKED = [
  'Clanmil "First Residents Move Into Dargan House" Titanic Quarter Belfast 2026',
  'site:belfastcity.gov.uk/news "Major new adventure park" "Giant\'s Park"',
  'site:belfastcity.gov.uk/news "Giant\'s Park" "development agreement" "adventure park"',
  'site:belfastcity.gov.uk "Belfast Agenda Statement of Progress 2023-2025" "Dargan House"',
  'site:minutes.belfastcity.gov.uk "Physical Programme Update" "Floral Hall" "Ballysillan" 2025',
  'site:communities-ni.gov.uk/publications Belfast "development brief" 2026',
  'site:infrastructure-ni.gov.uk/news Belfast active travel scheme commence 2024 DfI Belfast',
  'site:belfastcity.gov.uk/news Belfast "construction is underway" "plans officially launched" architecture'
];

const SOURCE_FAMILIES = [
  {
    source_id: "clanmil-loftlines-dargan-house-first-residents-2026-round376",
    source_name: "First Residents Move into Historic Loftlines Development",
    publisher: "Clanmil Housing Association",
    url: "https://www.clanmil.org.uk/media-hub/news/first-residents-move-historic-loftlines-development-2026-05-11",
    source_type: "public housing-association news page / project-owner milestone page",
    license:
      "No open reuse licence was located during Round376; Clanmil website copyright/terms apply. Candidate stores factual milestone metadata and source URL only pending rights review.",
    license_url: "https://www.clanmil.org.uk/",
    attribution: "Clanmil Housing Association",
    coverage_years: "News page dated 2026-05-11",
    update_frequency: "News page, status-specific",
    geographic_scope: "Dargan House / Loftlines, Titanic Quarter, Belfast",
    granularity: "Project-owner news page naming first residents, building name, apartment count and partners",
    key_fields:
      "Publication date, first-residents wording, Dargan House name, 81 apartments, ownership/management, location and partner context.",
    reliability: "strong for the reported first-residents milestone, with rights and geometry caveats",
    required_caveats:
      "Do not treat as completion of the whole Loftlines scheme, full occupation, public-realm opening, final certification or affordability outcome evidence.",
    ingestion_recommendation: "Accept as a documented Dargan House occupation/first-residents milestone.",
    emitted_candidates: 1,
    marker_terms: ["Dargan House", "81 apartments", "first residents", "11 May 2026", "Titanic Quarter"]
  },
  {
    source_id: "bcc-giants-park-development-agreement-2025-round376",
    source_name: "Major new adventure park moves a step closer as part of GBP100 million Giant's Park development",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/news/major-new-adventure-park-moves-a-step-closer-as-pa",
    source_type: "official council news page",
    license: "Belfast City Council website terms; factual project metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "News page dated 2025-01-15",
    update_frequency: "News page, status-specific",
    geographic_scope: "Giant's Park / North Foreshore, Dargan Road, Belfast",
    granularity: "Council landowner news page naming development agreement, developer, site scale and planning caveat",
    key_fields:
      "Publication date, development-agreement wording, Belfast City Council landowner role, Giant's Park Belfast Limited developer, site and planning caveat.",
    reliability: "strong for the announcement/development-agreement milestone; not evidence of permission or works",
    required_caveats:
      "Do not treat as planning permission, construction start, opening, public access, final design or as-built boundary evidence.",
    ingestion_recommendation: "Accept as a documented proposal-stage landowner/development-agreement milestone.",
    emitted_candidates: 1,
    marker_terms: ["development agreement", "Giant's Park", "160-acre", "15 January 2025", "planning permission"]
  },
  {
    source_id: "bcc-belfast-agenda-progress-dargan-house-recheck-round376",
    source_name: "The Belfast Agenda Statement of Progress 2023-2025 - Theme three: Our place",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/documents/the-belfast-agenda-statement-of-progress-2023-2025/theme-three-our-place",
    source_type: "official council progress statement page",
    license: "Belfast City Council website terms; factual programme metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Progress statement published 2025-11-28",
    update_frequency: "Progress statement, period-specific",
    geographic_scope: "Belfast city, with Dargan House / Loftlines line item",
    granularity: "Programme progress line item",
    key_fields: "Publication date, Dargan House under-construction line, housing-led regeneration context.",
    reliability: "supporting context only for Dargan House construction status",
    required_caveats:
      "This source does not record the 2026 first-residents milestone and should not replace the Clanmil source for that event.",
    ingestion_recommendation:
      "Do not emit separately in Round376; retained as supporting source checked for Dargan House status.",
    emitted_candidates: 0,
    marker_terms: ["Dargan House", "Construction is underway", "151 affordable", "Loftlines"]
  },
  {
    source_id: "bcc-physical-programme-update-2025-recheck-round376",
    source_name: "Physical Programme Update, Strategic Policy and Resources Committee, 24 October 2025",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327",
    source_type: "official council committee agenda item",
    license: "Belfast City Council public committee-document terms; factual project-status metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Committee report dated 2025-10-24",
    update_frequency: "Committee report, meeting-specific",
    geographic_scope: "Belfast physical programme projects",
    granularity: "Completed, underway and stage-movement line items",
    key_fields:
      "Committee date, project names, completed/underway/stage wording, funding programme and rough status.",
    reliability: "usable with caveats for dated programme-stage status",
    required_caveats:
      "Line items need dedupe against existing project-stage records and do not prove final designs, starts or completions unless stated.",
    ingestion_recommendation:
      "No additional Round376 candidate; relevant line items were already represented, too minor for this sweep, or better handled by future dedicated records.",
    emitted_candidates: 0,
    marker_terms: ["Dargan House", "Strand Arts Centre", "Ballysillan", "City Cemetery", "2 Royal Avenue"]
  },
  {
    source_id: "bcc-live-major-applications-2025-05-06-recheck-round376",
    source_name: "Live Major Applications not previously considered by Committee @ 06.05.25",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/%28S%281w3lda453fhw0f55xyxindbs%29%29/documents/s121414/Live%20Major%20Applications%20not%20previously%20considered%20by%20Committee%2006.05.25.pdf",
    source_type: "official current/live major applications PDF",
    license: "Belfast City Council public committee-document terms; factual planning metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "PDF list generated 2025-05-06",
    update_frequency: "Meeting/list-specific snapshot",
    geographic_scope: "Belfast City Council planning authority area",
    granularity: "Application reference, date valid, location, description and status",
    key_fields: "Application reference, date valid, proposal text, application status and location.",
    reliability: "usable with caveats for application-status discovery",
    required_caveats:
      "Current/live application rows are not approvals, works starts, openings or completion evidence.",
    ingestion_recommendation:
      "Do not emit separately in Round376; North Foreshore/Giant's Park application row already exists in the manual corpus.",
    emitted_candidates: 0,
    marker_terms: ["LA04/2024/2145/F", "North Foreshore", "Giant's Park", "adventure park"]
  },
  {
    source_id: "dfc-belfast-development-briefs-recheck-round376",
    source_name: "Belfast Department for Communities development-brief publication family",
    publisher: "Department for Communities",
    url: "https://www.communities-ni.gov.uk/publications/269-283-albertbridge-road-and-2-carnforth-street-belfast-development-brief",
    source_type: "official department publication page family",
    license: "Crown copyright / public-sector information terms; factual publication metadata retained for audit.",
    license_url: CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities",
    coverage_years: "Development-brief publication pages checked through 2026-05-20",
    update_frequency: "Publication-page family, status-specific",
    geographic_scope: "Belfast DfC disposal/development-brief sites",
    granularity: "Site name/address, publication date and brief status",
    key_fields: "Publication title, site address, publication/update date and brief status.",
    reliability: "usable for dated pre-development/disposal milestones with clear caveats",
    required_caveats:
      "Development briefs are not planning permission, construction starts, completions, public access changes or final use evidence.",
    ingestion_recommendation:
      "No Round376 candidate; Albertbridge/Carnforth, Crumlin Road and Shankill Road brief leads were already emitted or rejected in prior rounds.",
    emitted_candidates: 0,
    marker_terms: ["development brief", "269-283 Albertbridge Road", "2 Carnforth Street", "Belfast"]
  },
  {
    source_id: "dfi-active-travel-public-realm-recheck-round376",
    source_name: "DfI Belfast active-travel, public-realm and road-works news/publication pages",
    publisher: "Department for Infrastructure",
    url: "https://www.infrastructure-ni.gov.uk/news",
    source_type: "official department news/publication source family",
    license: "Crown copyright / Department for Infrastructure terms; factual programme metadata retained for audit.",
    license_url: CROWN_COPYRIGHT_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "DfI Belfast search results checked on 2026-05-20",
    update_frequency: "News/project pages update irregularly",
    geographic_scope: "Belfast DfI active-travel, public-realm and transport-infrastructure items",
    granularity: "Scheme news page, publication page or consultation record",
    key_fields: "Publication date, corridor/site name, consultation or works-stage wording, publisher and source URL.",
    reliability: "usable with caveats where a named built-environment scheme and milestone are explicit",
    required_caveats:
      "Do not ingest resurfacing-only, traffic-order-only or broad strategy items as architecture/public-realm changes without a distinct site milestone.",
    ingestion_recommendation:
      "No additional Round376 candidate; Lagmore, West Belfast Greenway and Island Street were already emitted by Round372, while remaining hits were duplicates, transport-only or too minor for this sweep.",
    emitted_candidates: 0,
    marker_terms: ["active travel", "Belfast", "greenway", "public realm"]
  },
  {
    source_id: "dfc-hed-list-changes-recheck-round376",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    source_type: "official Northern Ireland department publication page",
    license: "Crown copyright / Department for Communities terms; factual listing-publication metadata and source URLs retained for audit.",
    license_url: CROWN_COPYRIGHT_URL,
    attribution: "Department for Communities Historic Environment Division",
    coverage_years: "HED list-change publication family checked on 2026-05-20",
    update_frequency: "Updated when HED publishes list-change material",
    geographic_scope: "Northern Ireland, screened for Belfast HB26/site records",
    granularity: "List-change publication/update, HB reference and site/building name where available",
    key_fields: "Publication update date, structure name, HB reference, listing status and source URL.",
    reliability: "strong for HED publication status; caveated for record-only or proposal-stage rows",
    required_caveats:
      "Listing publication dates are statutory/admin dates, not construction, repair, opening or physical-change dates.",
    ingestion_recommendation:
      "No Round376 candidate; recent Belfast HED/listing rows were already handled by prior HED/listing rounds.",
    emitted_candidates: 0,
    marker_terms: ["List of Buildings", "architectural", "historic interest", "Belfast"]
  },
  {
    source_id: "bcc-regeneration-peaceplus-nrf-recheck-round376",
    source_name: "Belfast City Council regeneration, PEACEPLUS and Neighbourhood Regeneration Fund pages",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/peaceplus",
    source_type: "official council programme page family",
    license: "Belfast City Council website terms; factual programme metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Current pages and recent committee/news leads checked through 2026-05-20",
    update_frequency: "Programme pages and news pages update irregularly",
    geographic_scope: "Belfast public realm, community, regeneration and civic-estate project locations",
    granularity: "Programme/project page, named site, status note or news milestone",
    key_fields: "Project name, site, funding/programme, status and page date where present.",
    reliability: "usable with caveats; mutable pages should be backed by dated committee/news/decision records",
    required_caveats:
      "Do not ingest mutable programme text as completion, opening or works evidence without a dated milestone.",
    ingestion_recommendation:
      "No Round376 candidate; recent PEACEPLUS/NRF/Sandy Row/Cathedral Gardens/Ardoyne/Annadale/Distillery leads were already represented or rejected.",
    emitted_candidates: 0,
    marker_terms: ["PEACEPLUS", "community regeneration", "Belfast"]
  },
  {
    source_id: "bcc-strand-arts-centre-recheck-round376",
    source_name: "Strand Arts Centre restoration / Physical Programme Update recheck",
    publisher: "Belfast City Council",
    url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=85327",
    source_type: "official council committee/project-status recheck",
    license: "Belfast City Council website terms; factual source-family metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2025 official news/committee recheck",
    update_frequency: "News and committee pages",
    geographic_scope: "Strand Arts Centre, Holywood Road, Belfast",
    granularity: "Project news and committee-stage status",
    key_fields: "Project name, contractor/status wording, date and source URL.",
    reliability: "usable with caveats but exhausted for this round",
    required_caveats:
      "Do not emit another start/progress row unless a later dated completion, reopening or statutory milestone is published.",
    ingestion_recommendation:
      "No Round376 candidate; restoration start, contractor award and October 2025 progress rows already exist.",
    emitted_candidates: 0,
    marker_terms: ["Strand Arts Centre", "redevelop", "Belfast"]
  },
  {
    source_id: "bcc-housing-led-regeneration-recheck-round376",
    source_name: "Belfast housing-led regeneration council news pages",
    publisher: "Belfast City Council",
    url: "https://www.belfastcity.gov.uk/News/Belfast-City-Council-appoints-GRAHAM-as-delivery-p",
    source_type: "official council news/source-family recheck",
    license: "Belfast City Council website terms; factual source-family metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2024-2026 housing-led regeneration news recheck",
    update_frequency: "News pages",
    geographic_scope: "Belfast city centre housing-led regeneration sites",
    granularity: "Council news page, partner appointment or site announcement",
    key_fields: "Publication date, partner/site name, programme stage and source URL.",
    reliability: "usable with caveats but duplicate in this round",
    required_caveats:
      "Partner appointments and site announcements are not planning permission, works starts, openings or occupation evidence.",
    ingestion_recommendation:
      "No Round376 candidate; GRAHAM delivery-partner and city-centre car-park housing items were already emitted in Round214.",
    emitted_candidates: 0,
    related_urls: ["https://www.belfastcity.gov.uk/news/belfast-city-centre-car-parks-and-vacant-land-set"],
    marker_terms: ["GRAHAM", "delivery partner", "housing-led regeneration", "Belfast"]
  }
];

const CANDIDATES = [
  {
    city_id: CITY_ID,
    event_id: "round376_belfast_dargan_house_first_residents_2026_05_11",
    date: "2026-05-11",
    date_precision: "day",
    bucket: "planning/development/architecture/housing",
    title: "Dargan House welcomed first residents at Loftlines",
    summary:
      "Clanmil Housing Association recorded on 11 May 2026 that the first residents had moved into Dargan House at the Loftlines development in Belfast's Titanic Quarter. The source identifies Dargan House as 81 apartments owned and managed by Clanmil and as the first finished social-housing element of the wider Loftlines scheme.",
    observed_change:
      "A project-owner/public housing source recorded a first-residents occupation milestone for the Dargan House building within Loftlines.",
    area: "Dargan House, Loftlines, Queen's Island / Titanic Quarter",
    latitude: 54.6086,
    longitude: -5.9067,
    geometry: {
      type: "Point",
      coordinates: [-5.9067, 54.6086]
    },
    geometry_ref: "Approximate Loftlines / Queen's Island project point reused from existing Bims Loft Lines construction-start record.",
    geometry_source:
      "Existing Bims Loft Lines / Queen's Island approximate project point; not a surveyed Dargan House footprint.",
    geometry_precision: "approximate_multi_block_project_point",
    source_ids: ["clanmil-loftlines-dargan-house-first-residents-2026-round376"],
    source_name: "First Residents Move into Historic Loftlines Development",
    source_url:
      "https://www.clanmil.org.uk/media-hub/news/first-residents-move-historic-loftlines-development-2026-05-11",
    source_record_id: "Clanmil news page, posted 2026-05-11, Dargan House first-residents milestone",
    source_type: "public housing-association news page / project-owner milestone page",
    source_date_field: "News publication date and first-residents milestone reported by project owner",
    source_date_value: "2026-05-11",
    publisher: "Clanmil Housing Association",
    license:
      "No open reuse licence was located during Round376; Clanmil website copyright/terms apply. Candidate stores factual milestone metadata and source URL only pending rights review.",
    license_url: "https://www.clanmil.org.uk/",
    attribution: "Clanmil Housing Association",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "social housing / affordable-housing building within wider mixed-tenure waterfront development",
    milestone_type: "first_residents_reported_by_project_owner",
    architect:
      "The cited Clanmil page does not name an architect for this milestone; existing Loftlines records identify the wider project team separately.",
    limitations:
      "This records a first-residents milestone for Dargan House only. It does not confirm completion or occupation of the whole Loftlines development, full occupation of all Dargan House apartments, final certification, public-realm delivery, affordability outcomes or as-built geometry.",
    caveats:
      "Use as a building/phase occupation milestone with the source's project-owner attribution. Existing Bims records already cover the wider Loftlines planning permission and 2023 construction-start milestone.",
    duplicate_check_note:
      "Searched manual corpus, prior Belfast subagent packs and scripts for Dargan House, Clanmil, First Residents Move, first residents and Loftlines/Loft Lines. Existing records cover Loft Lines planning permission and construction start, but no Dargan House first-residents/Clanmil occupation row was found.",
    source_audit_note:
      "Primary source is public/project-owner rather than council. Rights review remains necessary because no open reuse licence was located, so the candidate retains factual metadata and citation only.",
    transformation_method:
      "Round376 manual official/public sweep: source page read, existing Loft Lines point reused as approximate project geometry, duplicate terms screened against manual corpus, tmp/subagents and scripts, then normalized to Bims candidate fields with caveats.",
    duplicate_seed_terms: [
      "Loft Lines construction started in Titanic Quarter",
      "Loft Lines",
      "LA04/2021/2280/F",
      "Queen's Island / Titanic Quarter",
      "Titanic Quarter Belfast"
    ],
    duplicate_or_overlap_hits: []
  },
  {
    city_id: CITY_ID,
    event_id: "round376_belfast_giants_park_development_agreement_2025_01_15",
    date: "2025-01-15",
    date_precision: "day",
    bucket: "planning/development/architecture/public-realm/regeneration",
    title: "Giant's Park adventure-park development agreement was announced",
    summary:
      "Belfast City Council recorded on 15 January 2025 that adventure-park and nature-sanctuary plans at Giant's Park had been announced after a development agreement between the council, as landowner, and Giant's Park Belfast Limited. The source describes a proposed 160-acre initial adventure-park phase within a 250-acre former landfill site and explicitly states that construction depended on planning permission.",
    observed_change:
      "An official council source recorded a proposal-stage landowner/development-agreement milestone for the Giant's Park / North Foreshore adventure-park site.",
    area: "Giant's Park / North Foreshore, Dargan Road",
    latitude: 54.646,
    longitude: -5.9225,
    geometry: {
      type: "Point",
      coordinates: [-5.9225, 54.646]
    },
    geometry_ref:
      "Approximate North Foreshore / Giant's Park point reused from existing Bims live-major-application record for LA04/2024/2145/F.",
    geometry_source:
      "Existing Bims manual approximate point from North Foreshore / Giant's Park / Dargan Road context; not a surveyed park boundary or building footprint.",
    geometry_precision: "approximate_large_site_point",
    source_ids: ["bcc-giants-park-development-agreement-2025-round376"],
    source_name: "Major new adventure park moves a step closer as part of GBP100 million Giant's Park development",
    source_url: "https://www.belfastcity.gov.uk/news/major-new-adventure-park-moves-a-step-closer-as-pa",
    source_record_id: "Belfast City Council news page, date 2025-01-15, development-agreement announcement",
    source_type: "official council news page",
    source_date_field: "News publication date and council statement that a development agreement had been signed",
    source_date_value: "2025-01-15",
    publisher: "Belfast City Council",
    license: "Belfast City Council website terms; factual project metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "proposal-stage leisure / public-realm regeneration on former landfill site",
    milestone_type: "development_agreement_announced_by_landowner",
    architect:
      "The cited council source names Belfast City Council and Giant's Park Belfast Limited but does not name a project architect.",
    limitations:
      "This is a proposal-stage administrative milestone. It does not confirm planning permission, construction start, opening, public access, final design, ecological management, traffic arrangements, job numbers, visitor numbers, exact route/building locations or as-built boundaries.",
    caveats:
      "Exclude from built/completed totals. A separate existing Bims row records the later live-major-application status for LA04/2024/2145/F, so this candidate should be used only for the development-agreement announcement.",
    duplicate_check_note:
      "Searched manual corpus, prior Belfast subagent packs and scripts for Major new adventure park moves, development agreement, Giant's Park Belfast Limited, The Jungle NI, 160-acre and LA04/2024/2145/F. Existing records cover the current major application and North Foreshore/studio context, but no council development-agreement announcement row was found.",
    source_audit_note:
      "Official council source is strong for the dated agreement/announcement, but the page itself flags that it is older and planning permission was still required.",
    transformation_method:
      "Round376 manual official/public sweep: source page read, existing North Foreshore/Giant's Park point reused as approximate geometry, duplicate terms screened against manual corpus, tmp/subagents and scripts, then normalized to Bims candidate fields with caveats.",
    duplicate_seed_terms: [
      "North Foreshore/Giant's Park adventure park application was current",
      "LA04/2024/2145/F",
      "North Foreshore",
      "Giant's Park",
      "Dargan Road"
    ],
    duplicate_or_overlap_hits: []
  }
];

const REJECTED = [
  {
    source_id: "bcc-belfast-agenda-progress-dargan-house-recheck-round376",
    status: "supporting_context_only",
    reason:
      "The Belfast Agenda progress page documents Dargan House construction status but does not provide the 2026 first-residents milestone; Clanmil is the stronger primary source for the accepted Dargan House candidate.",
    duplicate_or_overlap_note:
      "Existing Loft Lines construction-start row remains the construction-phase record; this source was not emitted separately."
  },
  {
    source_id: "bcc-physical-programme-update-2025-recheck-round376",
    status: "duplicates_or_too_broad",
    reason:
      "October 2025 physical-programme line items for Strand Arts Centre, Ballysillan, Lagan Gateway, North Foreshore infrastructure, Sandy Row, Titanic People, ABC Trust, Belfast Orange Hall, City Cemetery and pitches were already represented, too minor, or still programme-stage context.",
    duplicate_or_overlap_note:
      "Round376 retained the source-family check but did not add another programme-progress row."
  },
  {
    source_id: "bcc-live-major-applications-2025-05-06-recheck-round376",
    status: "duplicate",
    reason:
      "The live major applications list already produced an existing Bims row for the North Foreshore/Giant's Park adventure-park application LA04/2024/2145/F.",
    duplicate_or_overlap_note:
      "Accepted Giant's Park candidate is narrower: the Belfast City Council development-agreement announcement, not the application-status row."
  },
  {
    source_id: "dfc-belfast-development-briefs-recheck-round376",
    status: "exhausted_duplicates",
    reason:
      "DfC Belfast development-brief leads for Albertbridge/Carnforth, Crumlin Road and Shankill Road were already emitted or rejected in prior official Belfast sweeps.",
    duplicate_or_overlap_note:
      "No new distinct dated built-environment milestone found in this continuation sweep."
  },
  {
    source_id: "dfi-active-travel-public-realm-recheck-round376",
    status: "exhausted_or_not_architecture_fit",
    reason:
      "Remaining DfI hits after Round372 were resurfacing-only, traffic-order-only, broad transport-proposal context, or duplicates of Lagmore Avenue, West Belfast Greenway and Island Street active-travel records.",
    duplicate_or_overlap_note:
      "Round372 remains the owner of the accepted late-2025 DfI active-travel/public-realm candidates."
  },
  {
    source_id: "dfc-hed-list-changes-recheck-round376",
    status: "exhausted_duplicates",
    reason:
      "Recent Belfast HED/listing rows were already screened by prior HED/listing rounds; no new row was safe to add as a non-duplicate built-environment event.",
    duplicate_or_overlap_note:
      "Listing/publication dates should remain statutory/admin dates, not physical-change dates."
  },
  {
    source_id: "bcc-regeneration-peaceplus-nrf-recheck-round376",
    status: "exhausted_duplicates",
    reason:
      "Recent PEACEPLUS/NRF/council regeneration leads overlapped with Sandy Row, Cathedral Gardens, Ardoyne, Annadale Open Space, Distillery Street and related prior records or lacked a dated distinct milestone.",
    duplicate_or_overlap_note:
      "Mutable programme pages should be revisited only when a dated award, works-start, completion, opening or statutory decision is published."
  },
  {
    source_id: "bcc-strand-arts-centre-recheck-round376",
    status: "duplicate",
    reason:
      "Strand Arts Centre contractor-award, restoration-start and October 2025 progress rows already exist in the manual corpus and derived data.",
    duplicate_or_overlap_note:
      "Future candidate should wait for a dated reopening/completion or other distinct milestone."
  },
  {
    source_id: "bcc-housing-led-regeneration-recheck-round376",
    status: "duplicate",
    reason:
      "GRAHAM delivery-partner and Belfast city-centre car-park/new-homes announcements were already captured in Round214 and the manual corpus.",
    duplicate_or_overlap_note:
      "No additional housing-led regeneration administrative milestone was emitted."
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text.replace(/\r\n/g, "\n"), "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDedupeTerm(value) {
  return normalizeText(value).replace(/[^\w\s'/.-]+/g, " ").replace(/\s+/g, " ").trim();
}

function listFiles(root, predicate, output = []) {
  if (!fs.existsSync(root)) {
    return output;
  }
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    if (!predicate || predicate(root)) output.push(root);
    return output;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (fullPath.includes(path.join("tmp", "subagents", ROUND_ID))) continue;
      listFiles(fullPath, predicate, output);
    } else if (!predicate || predicate(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function shouldScanPriorFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/node_modules/")) return false;
  if (normalized.includes(`/tmp/subagents/${ROUND_ID}/`)) return false;
  if (normalized === `scripts/fetch_${ROUND_ID}_candidates.js`) return false;
  const ext = path.extname(filePath).toLowerCase();
  if (![".json", ".jsonl", ".ndjson", ".md", ".txt", ".js", ".ts", ".csv"].includes(ext)) return false;
  const base = path.basename(filePath).toLowerCase();
  if (normalized === MANUAL_CORPUS.replace(/\\/g, "/")) return true;
  if (normalized.startsWith("tmp/subagents/")) return normalized.toLowerCase().includes("belfast");
  if (normalized.startsWith("scripts/")) return base.includes("belfast") || base.includes("round");
  return false;
}

function getPriorFiles() {
  const files = [];
  if (fs.existsSync(MANUAL_CORPUS)) files.push(MANUAL_CORPUS);
  listFiles("tmp/subagents", shouldScanPriorFile, files);
  listFiles("scripts", shouldScanPriorFile, files);
  return Array.from(new Set(files)).sort();
}

const STOP_TERMS = new Set([
  "belfast",
  "architecture",
  "development",
  "planning",
  "source",
  "round376",
  "documented",
  "project",
  "city",
  "public",
  "candidate",
  "regeneration",
  "housing",
  "agreement"
]);

function dedupeTermsFor(candidate) {
  const rawTerms = [
    candidate.event_id,
    candidate.title,
    candidate.source_record_id,
    candidate.area,
    candidate.source_name,
    ...(candidate.source_ids || []),
    ...(candidate.duplicate_seed_terms || [])
  ];
  return Array.from(
    new Set(
      rawTerms
        .map(cleanDedupeTerm)
        .flatMap((term) => {
          const terms = [term];
          if (term.includes("/")) terms.push(term.replace(/\//g, " "));
          if (term.includes("-")) terms.push(term.replace(/-/g, " "));
          return terms;
        })
        .filter((term) => term.length >= 8)
        .filter((term) => !STOP_TERMS.has(term))
    )
  );
}

function buildDedupeIndex(candidates) {
  const priorFiles = getPriorFiles();
  const terms = Array.from(new Set(candidates.flatMap(dedupeTermsFor))).sort((a, b) => b.length - a.length);
  const hitsByTerm = Object.fromEntries(terms.map((term) => [term, []]));

  for (const filePath of priorFiles) {
    let text = "";
    try {
      text = normalizeText(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      continue;
    }
    for (const term of terms) {
      if (text.includes(term)) {
        hitsByTerm[term].push(filePath.replace(/\\/g, "/"));
      }
    }
  }

  return {
    priorFiles,
    priorFileCount: priorFiles.length,
    priorFilesSample: priorFiles.slice(0, 90).map((filePath) => ({
      path: filePath.replace(/\\/g, "/"),
      bytes: fs.statSync(filePath).size
    })),
    hitsByTerm
  };
}

function attachDedupeHits(candidates, dedupeIndex) {
  return candidates.map((candidate) => {
    const terms = dedupeTermsFor(candidate);
    const hits = [];
    for (const term of terms) {
      const paths = dedupeIndex.hitsByTerm[term] || [];
      if (!paths.length) continue;
      hits.push({
        term,
        hit_count: paths.length,
        sample_paths: paths.slice(0, 10)
      });
    }
    const clone = { ...candidate };
    delete clone.duplicate_seed_terms;
    clone.duplicate_or_overlap_hits = hits.slice(0, 25);
    return clone;
  });
}

function candidateDateRange(candidates) {
  if (!candidates.length) return { min: null, max: null };
  const dates = candidates.map((candidate) => candidate.date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

async function fetchSource(source) {
  if (typeof fetch !== "function") {
    return {
      ok: false,
      skipped: true,
      error: "global fetch unavailable in this Node runtime",
      marker_results: {}
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Bims-5 Round376 source-audit verifier (contact: local research script)",
        Accept: "text/html,application/pdf,text/plain,*/*"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = buffer.slice(0, 240000).toString("utf8");
    const normalized = normalizeText(text);
    const markerResults = {};
    for (const marker of source.marker_terms || []) {
      markerResults[marker] = normalized.includes(normalizeText(marker));
    }
    return {
      ok: response.ok,
      status: response.status,
      fetched_url: response.url,
      content_type: response.headers.get("content-type"),
      bytes: buffer.length,
      marker_results: markerResults
    };
  } catch (error) {
    return {
      ok: false,
      error: String(error && error.message ? error.message : error),
      marker_results: {}
    };
  } finally {
    clearTimeout(timer);
  }
}

async function buildSourceAudit(candidates) {
  const emittedCounts = countBy(candidates.flatMap((candidate) => candidate.source_ids), (id) => id);
  const sourceRows = [];
  for (const source of SOURCE_FAMILIES) {
    const fetch_check = await fetchSource(source);
    sourceRows.push({
      ...source,
      accessed_at: ACCESSED_AT,
      emitted_candidates: emittedCounts[source.source_id] || source.emitted_candidates || 0,
      fetch_check
    });
  }

  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    sources_checked: sourceRows.length,
    accepted_source_count: sourceRows.filter((row) => row.emitted_candidates > 0).length,
    rejected_or_context_source_count: sourceRows.filter((row) => row.emitted_candidates === 0).length,
    sources: sourceRows,
    checked_urls: Array.from(new Set(sourceRows.flatMap((row) => [row.url, ...(row.related_urls || [])]))),
    related_urls_checked: sourceRows.flatMap((row) => row.related_urls || []),
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    rejected_summary: REJECTED,
    overall_recommendation:
      "Round376 emits two cautious official/public Belfast built-environment candidates and records duplicate/exhausted source-family reasons for the remaining Belfast official/public architecture sweep."
  };
}

function buildCandidatesPayload(candidates, dedupeIndex) {
  const emittedDateRange = candidateDateRange(candidates);
  return {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    date_window: DATE_WINDOW,
    emitted_date_range: emittedDateRange,
    source_ids: Array.from(new Set(candidates.flatMap((candidate) => candidate.source_ids))).sort(),
    deduped_against: [
      MANUAL_CORPUS.replace(/\\/g, "/"),
      "tmp/subagents/**/belfast*",
      "scripts/*belfast*"
    ],
    prior_file_count: dedupeIndex.priorFileCount,
    candidates
  };
}

function buildRejectedPayload() {
  return {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    rejected_count: REJECTED.length,
    rejected: REJECTED
  };
}

function buildSummary(candidates, sourceAudit, dedupeIndex, validation) {
  const dateRange = candidateDateRange(candidates);
  return {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: CITY_ID,
    round_id: ROUND_ID,
    accepted_candidates: candidates.length,
    candidate_count: candidates.length,
    rejected_detail_count: REJECTED.length,
    emitted_date_range: dateRange,
    date_window: DATE_WINDOW,
    counts_by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    counts_by_source_id: countBy(candidates.flatMap((candidate) => candidate.source_ids), (id) => id),
    counts_by_milestone_type: countBy(candidates, (candidate) => candidate.milestone_type),
    sources_checked: sourceAudit.sources_checked,
    source_ids_checked: sourceAudit.sources.map((source) => source.source_id),
    dedupe: {
      manual_corpus: MANUAL_CORPUS.replace(/\\/g, "/"),
      prior_file_count: dedupeIndex.priorFileCount,
      prior_files_sample: dedupeIndex.priorFilesSample,
      candidate_overlap_terms_with_hits: candidates
        .flatMap((candidate) => candidate.duplicate_or_overlap_hits.map((hit) => hit.term))
        .filter((term, index, all) => all.indexOf(term) === index)
        .slice(0, 40)
    },
    validation,
    output_files: {
      candidates: path.join(OUT_DIR, "candidates.json").replace(/\\/g, "/"),
      sourceAudit: path.join(OUT_DIR, "source_audit.json").replace(/\\/g, "/"),
      rejected: path.join(OUT_DIR, "rejected.json").replace(/\\/g, "/"),
      summary: path.join(OUT_DIR, "summary.json").replace(/\\/g, "/"),
      notes: path.join(OUT_DIR, "notes.md").replace(/\\/g, "/"),
      validation: path.join(OUT_DIR, "validation.json").replace(/\\/g, "/"),
      validationReport: path.join(OUT_DIR, "validation_report.json").replace(/\\/g, "/")
    },
    conclusion:
      "Round376 added two cautious, provenance-rich Belfast built-environment candidates: Dargan House first residents and Giant's Park development-agreement announcement."
  };
}

function buildNotes(candidates, sourceAudit, dedupeIndex, validation) {
  const acceptedLines = candidates.length
    ? candidates
        .map((candidate, index) => {
          return `${index + 1}. ${candidate.title} (${candidate.date}) - ${candidate.source_name}. Caveat: ${candidate.limitations}`;
        })
        .join("\n")
    : "No accepted candidates.";

  const rejectedLines = REJECTED.map((item, index) => {
    const source = SOURCE_FAMILIES.find((row) => row.source_id === item.source_id);
    return `${index + 1}. ${source ? source.source_name : item.source_id}: ${item.reason}`;
  }).join("\n");

  return `# ${ROUND_ID}

## Result

Accepted candidates: ${candidates.length}
Rejected/context source checks: ${REJECTED.length}
Sources checked: ${sourceAudit.sources_checked}
Validation: ${validation.status}

## Accepted candidates

${acceptedLines}

## Sources checked and rejected/context notes

${rejectedLines}

## Dedupe notes

- Screened against ${MANUAL_CORPUS.replace(/\\/g, "/")}, prior Belfast tmp/subagents packs and Belfast-related scripts.
- Prior files scanned: ${dedupeIndex.priorFileCount}.
- Dargan House overlap: existing Bims records cover the wider Loft Lines planning permission and June 2023 construction start, but no Dargan House first-residents/Clanmil occupation milestone was found.
- Giant's Park overlap: existing Bims records cover the live major application LA04/2024/2145/F and other North Foreshore context, but no Belfast City Council development-agreement announcement row was found.

## Caveats

- Dargan House is a first-residents/source-reported occupation milestone for the Clanmil-managed building only; do not use it as completion or occupation evidence for all Loftlines.
- Giant's Park is a proposal-stage landowner/development-agreement milestone; do not use it as planning permission, construction start, opening or public-access evidence.
- Clanmil source reuse rights remain to be checked before production import; the candidate retains factual citation metadata only.
- Approximate point geometries were reused from existing Bims project context and are not surveyed footprints or statutory boundaries.

## Verification

- Ran this script to regenerate all Round376 output files.
- Validation checks covered required provenance fields, date window, Belfast coordinate sanity, allowed confidence values, source-audit presence, duplicate-screening file count, candidate cap and overclaim wording scan.
`;
}

function validate(candidates, sourceAudit, dedupeIndex) {
  const errors = [];
  const warnings = [];
  const requiredFields = [
    "city_id",
    "event_id",
    "date",
    "date_precision",
    "title",
    "summary",
    "observed_change",
    "area",
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
    "source_retrieved_at",
    "confidence",
    "project_type",
    "milestone_type",
    "limitations",
    "caveats",
    "duplicate_check_note",
    "transformation_method"
  ];
  const allowedConfidence = new Set(["documented", "corroborated", "inferred", "disputed"]);
  const sourceIds = new Set(SOURCE_FAMILIES.map((source) => source.source_id));
  const overclaimPatterns = [
    /\bwill (increase|decrease|reduce|improve|boost|transform)\b/i,
    /\bcaused?\b/i,
    /\bproves?\b/i,
    /\bsimulat(?:e|es|ed|ion)\b/i,
    /\bforecast(?:s|ed|ing)?\b/i,
    /\bpredict(?:s|ed|ion|ive)?\b/i,
    /\bimpact score\b/i,
    /\b10-year\b/i
  ];

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.event_id || "unknown"} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) errors.push(`${candidate.event_id} city_id is not ${CITY_ID}`);
    if (candidate.date < DATE_WINDOW.start || candidate.date > DATE_WINDOW.end) {
      errors.push(`${candidate.event_id} date ${candidate.date} outside ${DATE_WINDOW.start}..${DATE_WINDOW.end}`);
    }
    if (!allowedConfidence.has(candidate.confidence)) {
      errors.push(`${candidate.event_id} invalid confidence ${candidate.confidence}`);
    }
    if (
      typeof candidate.latitude !== "number" ||
      typeof candidate.longitude !== "number" ||
      candidate.latitude < 54.45 ||
      candidate.latitude > 54.75 ||
      candidate.longitude < -6.2 ||
      candidate.longitude > -5.7
    ) {
      errors.push(`${candidate.event_id} coordinates outside Belfast sanity envelope`);
    }
    if (!candidate.geometry || candidate.geometry.type !== "Point") {
      errors.push(`${candidate.event_id} geometry must be a Point`);
    }
    for (const sourceId of candidate.source_ids || []) {
      if (!sourceIds.has(sourceId)) errors.push(`${candidate.event_id} references unknown source_id ${sourceId}`);
    }
    const text = JSON.stringify(candidate);
    for (const pattern of overclaimPatterns) {
      if (pattern.test(text)) errors.push(`${candidate.event_id} matched overclaim pattern ${pattern}`);
    }
  }

  for (const source of sourceAudit.sources || []) {
    if (source.emitted_candidates > 0 && source.fetch_check && source.fetch_check.ok === false) {
      warnings.push(`${source.source_id} fetch check did not return ok; retain manual browser verification note`);
    }
  }

  const status = errors.length ? "failed" : "passed";
  return {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    status,
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      json_payloads_constructed: true,
      required_candidate_fields: { status: errors.some((e) => e.includes("missing required field")) ? "failed" : "passed" },
      date_window_scan: { status: errors.some((e) => e.includes("outside")) ? "failed" : "passed", ...DATE_WINDOW },
      belfast_coordinate_sanity: {
        status: errors.some((e) => e.includes("coordinates outside")) ? "failed" : "passed"
      },
      confidence_values: { status: errors.some((e) => e.includes("invalid confidence")) ? "failed" : "passed" },
      source_audit_present: { status: sourceAudit.sources && sourceAudit.sources.length ? "passed" : "failed" },
      dedupe_against_manual_and_prior_belfast_packs: {
        status: dedupeIndex.priorFileCount > 0 ? "passed" : "failed",
        prior_file_count: dedupeIndex.priorFileCount
      },
      overclaim_scan: {
        status: errors.some((e) => e.includes("overclaim pattern")) ? "failed" : "passed"
      },
      candidate_cap_50: { status: candidates.length <= 50 ? "passed" : "failed", candidate_count: candidates.length }
    }
  };
}

async function main() {
  ensureDir(OUT_DIR);

  const dedupeIndex = buildDedupeIndex(CANDIDATES);
  const candidates = attachDedupeHits(CANDIDATES, dedupeIndex);
  const sourceAudit = await buildSourceAudit(candidates);
  const validation = validate(candidates, sourceAudit, dedupeIndex);
  const candidatesPayload = buildCandidatesPayload(candidates, dedupeIndex);
  const rejectedPayload = buildRejectedPayload();
  const summary = buildSummary(candidates, sourceAudit, dedupeIndex, validation);
  const notes = buildNotes(candidates, sourceAudit, dedupeIndex, validation);

  writeJson(path.join(OUT_DIR, "candidates.json"), candidatesPayload);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedPayload);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), {
    schema_version: `${ROUND_ID}.validation_report.v1`,
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    validation
  });
  writeText(path.join(OUT_DIR, "notes.md"), notes);

  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        output_dir: OUT_DIR.replace(/\\/g, "/"),
        candidates: candidates.length,
        rejected: REJECTED.length,
        sources_checked: sourceAudit.sources_checked,
        validation: validation.status
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
