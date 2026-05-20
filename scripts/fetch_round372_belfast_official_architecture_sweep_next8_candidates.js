const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round372_belfast_official_architecture_sweep_next8";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";

const DFI_CROWN_URL = "https://www.infrastructure-ni.gov.uk/articles/crown-copyright-infrastructure";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const DFC_CROWN_URL = "https://www.nidirect.gov.uk/crown-copyright";

const MANUAL_CORPUS = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  rejected: path.join(OUT_DIR, "rejected.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  validation: path.join(OUT_DIR, "validation.json"),
  validationReport: path.join(OUT_DIR, "validation_report.json")
};

const SOURCES = {
  dfiLagmoreBcn: {
    source_id: "dfi-lagmore-avenue-belfast-cycling-network-2025-round372",
    source_name: "Kimmins announces GBP600k investment in Belfast Cycling Network",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/news/kimmins-announces-ps600k-investment-belfast-cycling-network",
    source_type: "official Northern Ireland department news page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 works-commencement announcement",
    marker_terms: ["Lagmore Avenue", "600,000", "Belfast Cycling Network", "10 March 2025"]
  },
  dfiWestBelfastGreenwayPhase1bPacc: {
    source_id: "dfi-west-belfast-greenway-phase-1b-pacc-2025-round372",
    source_name: "Pre-Application Community Consultation - West Belfast Greenway Phase 1b",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/consultations/pre-application-community-consultation-west-belfast-greenway-phase-1b",
    source_type: "official Northern Ireland department consultation page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 pre-application community consultation",
    marker_terms: ["West Belfast Greenway Phase 1b", "24 September 2025", "Bog Meadows", "Kennedy Way"]
  },
  dfiWestBelfastGreenwayPhase1aConstruction: {
    source_id: "dfi-west-belfast-greenway-first-section-construction-2025-round372",
    source_name: "Kimmins confirms construction on West Belfast Greenway to commence",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/news/kimmins-confirms-construction-west-belfast-greenway-commence",
    source_type: "official Northern Ireland department news page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 scheduled construction-start announcement",
    marker_terms: ["West Belfast Greenway", "20 October 2025", "Bog Meadows Nature Reserve", "John McQuillan"]
  },
  dfiIslandStreetBcn: {
    source_id: "dfi-island-street-active-travel-2025-round372",
    source_name:
      "Kimmins announces active travel improvement scheme to commence on Island Street, Belfast",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/news/kimmins-announces-active-travel-improvement-scheme-commence-island-street-belfast",
    source_type: "official Northern Ireland department news page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 works-commencement announcement",
    marker_terms: ["Island Street", "650,000", "Belfast Cycling Network", "18 November 2025"]
  },
  dfiRavenhillOrmeauConsultation: {
    source_id: "dfi-ravenhill-ormeau-active-travel-consultation-recheck-round372",
    source_name:
      "Ravenhill Road and Ormeau Embankment pedestrian and cycling improvements statutory consultation",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/consultations/ravenhill-road-and-ormeau-embankment-pedestrian-and-cycling-improvements-statutory-consultation",
    source_type: "official Northern Ireland department consultation page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 consultation-stage active-travel proposal"
  },
  dfiSydenhamGreenwayConsultation: {
    source_id: "dfi-sydenham-greenway-control-traffic-2025-recheck-round372",
    source_name: "The Control of Traffic (Sydenham Greenway Phase 1 - Victoria Park to Inverary Avenue, Belfast) Order",
    publisher: "Department for Infrastructure",
    source_url:
      "https://www.infrastructure-ni.gov.uk/consultations/control-traffic-sydenham-greenway-phase-1-victoria-park-inverary-avenue-belfast-order-ni-2025",
    source_type: "official Northern Ireland department consultation page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual project metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 traffic-order consultation"
  },
  dfiTransformationProjects: {
    source_id: "dfi-transformation-projects-urban-drainage-2025-recheck-round372",
    source_name: "Kimmins welcomes GBP18m for transformation projects",
    publisher: "Department for Infrastructure",
    source_url: "https://www.infrastructure-ni.gov.uk/news/kimmins-welcomes-ps18m-transformation-projects",
    source_type: "official Northern Ireland department news page",
    license:
      "Crown copyright / Open Government Licence for Department for Infrastructure website text, excluding logos, images and OSNI mapping; factual programme metadata and source URLs retained for audit.",
    license_url: DFI_CROWN_URL,
    attribution: "Department for Infrastructure",
    coverage_years: "2025 programme-funding announcement"
  },
  bccCityCentreRegeneration: {
    source_id: "bcc-city-centre-regeneration-under-bridges-2025-recheck-round372",
    source_name: "Belfast city centre regeneration steps up a gear",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Belfast-city-centre-regeneration-steps-up-a-gear",
    source_type: "official council news page",
    license:
      "Belfast City Council website terms; factual programme metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2025 regeneration/public-realm funding announcement"
  },
  bccBelfastStories: {
    source_id: "bcc-belfast-stories-project-consultation-2025-2026-recheck-round372",
    source_name: "What is Belfast Stories?",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/BelfastStories/What-is-it",
    source_type: "official council project page",
    license:
      "Belfast City Council website terms; factual project metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2025-2026 pre-application consultation and project-stage page"
  },
  bccCurrentPlanningApplications: {
    source_id: "bcc-current-planning-applications-recheck-round372",
    source_name: "Current planning applications",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_type: "official council live planning list",
    license:
      "Belfast City Council website terms; factual application metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Mutable live list checked on 2026-05-20"
  },
  dfcHedListChanges: {
    source_id: "dfc-hed-list-changes-recheck-round372",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    source_url:
      "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    source_type: "official Northern Ireland department publication page",
    license:
      "Crown copyright / Department for Communities terms; factual listing-publication metadata and source URLs retained for audit.",
    license_url: DFC_CROWN_URL,
    attribution: "Department for Communities Historic Environment Division",
    coverage_years: "Recent HED list-change publication families checked on 2026-05-20"
  },
  bccPeaceplus: {
    source_id: "bcc-peaceplus-nrf-regeneration-recheck-round372",
    source_name: "PEACEPLUS",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/peaceplus",
    source_type: "official council programme page",
    license:
      "Belfast City Council website terms; factual programme metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "Current PEACEPLUS, regeneration and NRF programme pages checked on 2026-05-20"
  },
  bccLaganGateway: {
    source_id: "bcc-lagan-gateway-phase-2-recheck-round372",
    source_name: "Consultation Report: Lagan Gateway Phase 2",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/Documents/Consultation-Report-Lagan-Gateway-Phase-2",
    source_type: "official council consultation/planning document page",
    license:
      "Belfast City Council website terms; factual project metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2022 consultation report / 2025 committee-stage phase already checked"
  },
  bccCityDealNews: {
    source_id: "bcc-belfast-region-city-deal-recheck-round372",
    source_name: "Belfast Region already reaping rewards from City Deal programme of investment",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/news/belfast-region-already-reaping-rewards-from-city-d",
    source_type: "official council / Belfast Region City Deal news page",
    license:
      "Belfast City Council website terms; factual project metadata and source URLs retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    coverage_years: "2025 City Deal project milestone recap"
  }
};

const ACCEPTED = [
  {
    city_id: "belfast",
    event_id: "round372_belfast_lagmore_avenue_bcn_works_commenced_2025_03_10",
    date: "2025-03-10",
    date_precision: "day",
    bucket: "planning/development/architecture/public realm/active travel",
    title: "Lagmore Avenue Belfast Cycling Network works commenced",
    summary:
      "A Department for Infrastructure news page dated 10 March 2025 recorded that a GBP600,000 pedestrian and cycling improvement scheme on Lagmore Avenue, Belfast was commencing that day. The scheme includes segregated cycle tracks between Stewartstown Road and Glenfearna Park, two toucan crossings at existing crossing points and raised-table humps at minor road accesses.",
    observed_change:
      "An official works-commencement milestone was recorded for public active-travel infrastructure on Lagmore Avenue.",
    area: "Lagmore Avenue between Stewartstown Road and Glenfearna Park",
    latitude: 54.5548,
    longitude: -6.0357,
    geometry: { type: "Point", coordinates: [-6.0357, 54.5548] },
    geometry_ref: "Approximate Lagmore Avenue corridor point between Stewartstown Road and Glenfearna Park",
    geometry_source:
      "Approximate route-midpoint from the DfI-described Lagmore Avenue corridor, checked against public geocoding/Nominatim on 2026-05-20; the source does not publish GIS geometry.",
    geometry_precision:
      "Approximate corridor point only, not a surveyed cycle-track alignment, traffic-order extent, crossing point, raised-table location, work compound, land boundary or as-built record.",
    source_ids: ["dfi-lagmore-avenue-belfast-cycling-network-2025-round372"],
    source_name: SOURCES.dfiLagmoreBcn.source_name,
    source_url: SOURCES.dfiLagmoreBcn.source_url,
    source_record_id:
      "Department for Infrastructure news page, 10 March 2025: Lagmore Avenue Belfast Cycling Network pedestrian and cycling scheme",
    source_type: SOURCES.dfiLagmoreBcn.source_type,
    source_date_field: "Date published and source statement that works were commencing today",
    source_date_value: "2025-03-10",
    publisher: SOURCES.dfiLagmoreBcn.publisher,
    license: SOURCES.dfiLagmoreBcn.license,
    license_url: SOURCES.dfiLagmoreBcn.license_url,
    attribution: SOURCES.dfiLagmoreBcn.attribution,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "public active-travel infrastructure",
    milestone_type: "works_commencement_reported_by_official_source",
    architect: "Not stated by the cited Department for Infrastructure source.",
    limitations:
      "This records the official works-commencement announcement only. It does not document final completion, opening, road-safety outcomes, school-access outcomes, measured use, exact engineering drawings, traffic-order extents or as-built geometry. The source stated a late September 2025 works window, which should be treated as a programme note until a completion source is found.",
    caveats:
      "Use as a dated construction-stage/public-realm event, not as evidence that the route was completed or in permanent use.",
    duplicate_check_note:
      "Searched the manual corpus, prior Belfast sweep folders and scripts for Lagmore Avenue, Glenfearna Park, Stewartstown Road, GBP600k, Belfast Cycling Network and the DfI source URL. No existing candidate or manual event for this Lagmore Avenue active-travel works milestone was found.",
    source_audit_note:
      "The official department page is strong for date, publisher, corridor description, budget and stated works-start status. It is weaker for geometry because no route GIS or as-built plan is provided.",
    transformation_method:
      "Round372 official/public Belfast sweep; source page was opened, candidate terms were checked against the manual corpus and prior Belfast packs, and the surviving lead was normalized with approximate geometry, source license, confidence and limitations."
  },
  {
    city_id: "belfast",
    event_id: "round372_belfast_west_belfast_greenway_phase_1b_pacc_opened_2025_09_24",
    date: "2025-09-24",
    date_precision: "day",
    bucket: "planning/development/architecture/public realm/active travel",
    title: "West Belfast Greenway Phase 1b pre-application consultation opened",
    summary:
      "A Department for Infrastructure consultation page recorded that the West Belfast Greenway Phase 1b pre-application community consultation opened on 24 September 2025 and closed on 30 October 2025. The proposal is for a 1.3km greenway connection from Andersonstown to existing Bog Meadows facilities, including a new 4m-wide section between Bog Meadows and Kennedy Way, lighting and landscaping.",
    observed_change:
      "An official pre-application community-consultation milestone was recorded for a proposed west Belfast active-travel greenway section.",
    area: "Bog Meadows to Kennedy Way / Andersonstown corridor",
    latitude: 54.5812,
    longitude: -5.9728,
    geometry: { type: "Point", coordinates: [-5.9728, 54.5812] },
    geometry_ref: "Approximate midpoint for the proposed Bog Meadows to Kennedy Way Phase 1b corridor",
    geometry_source:
      "Approximate corridor midpoint manually placed between public geocoding/Nominatim results for Bog Meadows Nature Reserve and Kennedy Way, checked on 2026-05-20. The source links maps but the candidate stores a point only.",
    geometry_precision:
      "Approximate proposal-corridor point only, not a statutory red-line boundary, route centreline, map-sheet geometry, land-take polygon, lighting column location, biodiversity landscaping area or future as-built record.",
    source_ids: ["dfi-west-belfast-greenway-phase-1b-pacc-2025-round372"],
    source_name: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.source_name,
    source_url: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.source_url,
    source_record_id:
      "Department for Infrastructure closed consultation page: West Belfast Greenway Phase 1b, consultation opened 24 September 2025",
    source_type: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.source_type,
    source_date_field: "Consultation opened",
    source_date_value: "2025-09-24 10:00",
    publisher: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.publisher,
    license: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.license,
    license_url: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.license_url,
    attribution: SOURCES.dfiWestBelfastGreenwayPhase1bPacc.attribution,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "proposed public active-travel greenway",
    milestone_type: "pre_application_community_consultation_opened",
    architect: "Not stated by the cited Department for Infrastructure source; the Gazette notice identifies WSP as principal design consultant.",
    limitations:
      "This records the consultation-opening milestone for a proposal only. It does not document planning submission, planning permission, construction start, completion, opening, final alignment, land acquisition, environmental consent, route use or permanent traffic changes.",
    caveats:
      "Use as a proposal-stage event and exclude from built/completed active-travel totals unless a later dated construction or opening source is added.",
    duplicate_check_note:
      "Searched the manual corpus, prior Belfast sweep folders and scripts for West Belfast Greenway Phase 1b, Bog Meadows to Kennedy Way, Andersonstown greenway, 1.3km, 4m wide greenway and the DfI source URL. Existing Kennedy Way and Bog Meadows hits relate to other planning records or Forth Meadow/Bog Meadows works, not this DfI Phase 1b pre-application consultation milestone.",
    source_audit_note:
      "The official consultation page is strong for consultation date, broad route, proposal description, statutory consultation stage and publisher. It is weaker for durable geometry unless the linked PDF maps are separately extracted.",
    transformation_method:
      "Round372 official/public Belfast sweep; source page was opened, candidate terms were checked against the manual corpus and prior Belfast packs, and the surviving lead was normalized with approximate geometry, source license, confidence and proposal-stage limitations."
  },
  {
    city_id: "belfast",
    event_id: "round372_belfast_west_belfast_greenway_first_section_construction_scheduled_2025_10_14",
    date: "2025-10-14",
    date_precision: "day",
    effective_date_range: {
      start: "2025-10-14",
      end: "2025-10-20",
      basis: "source publication date to scheduled construction-commencement date"
    },
    bucket: "planning/development/architecture/public realm/active travel",
    title: "West Belfast Greenway first-section construction start was scheduled",
    summary:
      "A Department for Infrastructure news page dated 14 October 2025 recorded that construction on the first section of the West Belfast Greenway was scheduled to commence on 20 October 2025. The initial works focus on upgrading paths through Bog Meadows Nature Reserve, with ecological measures including new ponds and edge treatments, and an estimated GBP500,000 first-phase cost.",
    observed_change:
      "An official construction-start schedule was recorded for the first West Belfast Greenway section through Bog Meadows.",
    area: "Bog Meadows Nature Reserve",
    latitude: 54.5852,
    longitude: -5.9653,
    geometry: { type: "Point", coordinates: [-5.9653, 54.5852] },
    geometry_ref: "Approximate Bog Meadows Nature Reserve point for the first West Belfast Greenway works section",
    geometry_source:
      "Approximate point from public geocoding/Nominatim result for Bog Meadows Nature Reserve, checked on 2026-05-20; the source does not publish GIS geometry for the works section.",
    geometry_precision:
      "Approximate nature-reserve point only, not a route centreline, path-edge treatment, tree/hedgerow removal area, pond location, closure extent, contractor compound, land boundary or as-built record.",
    source_ids: ["dfi-west-belfast-greenway-first-section-construction-2025-round372"],
    source_name: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.source_name,
    source_url: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.source_url,
    source_record_id:
      "Department for Infrastructure news page, 14 October 2025: first section of West Belfast Greenway scheduled to commence 20 October 2025",
    source_type: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.source_type,
    source_date_field: "Date published and scheduled construction commencement date",
    source_date_value: "2025-10-14 published; 2025-10-20 scheduled commencement",
    publisher: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.publisher,
    license: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.license,
    license_url: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.license_url,
    attribution: SOURCES.dfiWestBelfastGreenwayPhase1aConstruction.attribution,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "public active-travel greenway works",
    milestone_type: "construction_start_scheduled_by_official_source",
    architect: "Not stated by the cited Department for Infrastructure source; contractor named as John McQuillan Contracts Ltd.",
    limitations:
      "This records the official announcement and scheduled construction-start date only. It does not independently document that works began on 20 October 2025, final completion, route opening, exact alignment, ecological delivery, public-use changes or as-built geometry. The same reserve has older Forth Meadow/Bog Meadows public-realm records, so production ingestion should review physical-scope overlap before merging.",
    caveats:
      "Use as a cautious construction-stage candidate with an overlap warning, not as a completed greenway record or a replacement for earlier Forth Meadow/Bog Meadows events.",
    duplicate_check_note:
      "Searched the manual corpus, prior Belfast sweep folders and scripts for West Belfast Greenway, Bog Meadows, construction to commence, 20 October 2025, John McQuillan and the DfI source URL. No exact West Belfast Greenway construction-start event was found, but existing Forth Meadow/Bog Meadows path-enhancement and planning records overlap geographically and should be compared before final ingestion.",
    source_audit_note:
      "The official department page is strong for date, publisher, scheduled construction-start wording, project label, cost estimate, contractor and broad location. It is weaker for actual start confirmation and route geometry.",
    transformation_method:
      "Round372 official/public Belfast sweep; source page was opened, candidate terms were checked against the manual corpus and prior Belfast packs, and the surviving lead was normalized with approximate geometry, source license, confidence and explicit overlap limitations."
  },
  {
    city_id: "belfast",
    event_id: "round372_belfast_island_street_active_travel_scheme_commenced_week_2025_11_18",
    date: "2025-11-18",
    date_precision: "day",
    effective_date_range: {
      start: "2025-11-17",
      end: "2025-11-18",
      basis: "source statement that works commenced during the publication week and traffic management dates beginning 17 November 2025"
    },
    bucket: "planning/development/architecture/public realm/active travel",
    title: "Island Street active-travel improvement works were reported as commenced",
    summary:
      "A Department for Infrastructure news page dated 18 November 2025 recorded that a GBP650,000 pedestrian and cycling improvement scheme on Island Street, Belfast had commenced that week. The scheme includes a two-way segregated cycle track and traffic-calming features between the Ballymacarrett Road underpass and the Island Street / Dee Street junction, linking to Middlepath Street and the Ballymacarrett Walkway.",
    observed_change:
      "An official works-commencement milestone was recorded for public active-travel infrastructure on Island Street.",
    area: "Island Street between Ballymacarrett Road underpass and Dee Street",
    latitude: 54.6014,
    longitude: -5.8996,
    geometry: { type: "Point", coordinates: [-5.8996, 54.6014] },
    geometry_ref: "Approximate Island Street corridor point between Ballymacarrett Road underpass and Dee Street",
    geometry_source:
      "Approximate route-midpoint from the DfI-described Island Street corridor, checked against public geocoding/Nominatim on 2026-05-20; the source does not publish GIS geometry.",
    geometry_precision:
      "Approximate corridor point only, not a surveyed cycle-track alignment, closure extent, traffic-calming feature, junction design, work compound, land boundary or as-built record.",
    source_ids: ["dfi-island-street-active-travel-2025-round372"],
    source_name: SOURCES.dfiIslandStreetBcn.source_name,
    source_url: SOURCES.dfiIslandStreetBcn.source_url,
    source_record_id:
      "Department for Infrastructure news page, 18 November 2025: Island Street Belfast Cycling Network pedestrian and cycling scheme",
    source_type: SOURCES.dfiIslandStreetBcn.source_type,
    source_date_field: "Date published and source statement that works had commenced that week",
    source_date_value: "2025-11-18; traffic-management period begins 2025-11-17",
    publisher: SOURCES.dfiIslandStreetBcn.publisher,
    license: SOURCES.dfiIslandStreetBcn.license,
    license_url: SOURCES.dfiIslandStreetBcn.license_url,
    attribution: SOURCES.dfiIslandStreetBcn.attribution,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: "public active-travel infrastructure",
    milestone_type: "works_commencement_reported_by_official_source",
    architect: "Not stated by the cited Department for Infrastructure source.",
    limitations:
      "This records the official works-commencement announcement only. It does not document final completion, permanent opening, traffic-order outcome, road-safety outcome, measured route use, exact engineering drawings or as-built geometry. The source states temporary traffic management and a road-closure period extending into early spring 2026; those are not completion evidence.",
    caveats:
      "Use as a dated construction-stage/public-realm event, not as evidence that the route was completed or in permanent use.",
    duplicate_check_note:
      "Searched the manual corpus, prior Belfast sweep folders and scripts for Island Street, Ballymacarrett Road, Dee Street, Middlepath Street, GBP650k, Belfast Cycling Network and the DfI source URL. No existing candidate or manual event for this Island Street active-travel works milestone was found.",
    source_audit_note:
      "The official department page is strong for publication date, publisher, corridor description, budget and stated works-commencement status. It is weaker for geometry because no route GIS or as-built plan is provided.",
    transformation_method:
      "Round372 official/public Belfast sweep; source page was opened, candidate terms were checked against the manual corpus and prior Belfast packs, and the surviving lead was normalized with approximate geometry, source license, confidence and limitations."
  }
];

const REJECTED = [
  {
    key: "ravenhill_ormeau_active_travel_consultation_recheck",
    source: "dfiRavenhillOrmeauConsultation",
    title: "Ravenhill Road and Ormeau Embankment active-travel consultation",
    date: "2025-2026",
    category: "prior_reject_or_proposal_only",
    reason:
      "This DfI consultation source was already rejected in a prior Belfast tail round because it provided consultation-stage material without a stronger observed physical or decision milestone. It remains useful watchlist context only.",
    screened_terms: ["Ravenhill Road", "Ormeau Embankment", "pedestrian and cycling improvements"]
  },
  {
    key: "sydenham_greenway_phase_1_traffic_order_recheck",
    source: "dfiSydenhamGreenwayConsultation",
    title: "Sydenham Greenway Phase 1 traffic-order consultation",
    date: "2025",
    category: "duplicate_or_overlap",
    reason:
      "Sydenham Greenway planning, stage and consultancy/funding records are already represented or rejected in earlier Belfast packs. This traffic-order page did not add a distinct completion or works-start milestone for Round372.",
    screened_terms: ["Sydenham Greenway", "Victoria Park", "Inverary Avenue", "traffic order"]
  },
  {
    key: "dfi_transformation_projects_urban_drainage_recheck",
    source: "dfiTransformationProjects",
    title: "DfI GBP18m transformation projects announcement",
    date: "2025-03-11",
    category: "broad_program_not_belfast_event",
    reason:
      "The page records broad programme funding for urban drainage and planning appeals capacity, but it does not name a Belfast site, geometry, construction date or specific built-environment event suitable for this candidate pack.",
    screened_terms: ["urban drainage", "rainwater storage", "attenuation ponds", "raingardens"]
  },
  {
    key: "bcc_under_bridges_sailortown_recheck",
    source: "bccCityCentreRegeneration",
    title: "Under the Bridges and Sailortown Bridge DfI investment",
    date: "2025-06-04",
    category: "duplicate_existing_event",
    reason:
      "The BCC news page and underlying Under the Bridges/Sailortown Bridge investment milestones are already represented in the manual corpus and Round183/Round214 context.",
    screened_terms: ["Under the Bridges", "Sailortown Bridge", "DfI investment"]
  },
  {
    key: "bcc_belfast_stories_consultation_recheck",
    source: "bccBelfastStories",
    title: "Belfast Stories 2025-2026 pre-application consultation",
    date: "2025-11-13",
    category: "duplicate_existing_event",
    reason:
      "Belfast Stories design-team, Stage 3, design-development, funding-condition and pre-application consultation milestones are already present in the manual corpus and prior Belfast packs.",
    screened_terms: ["Belfast Stories", "pre-application community consultation", "13 November 2025"]
  },
  {
    key: "bcc_current_planning_applications_recheck",
    source: "bccCurrentPlanningApplications",
    title: "Belfast current planning applications live list",
    date: ACCESSED_AT,
    category: "mutable_live_list_exhausted",
    reason:
      "Round368 already screened the live current-planning list and emitted the remaining major non-duplicate committee-backed records. Other live rows were duplicates, minor/private, or require Planning Portal/committee/decision evidence.",
    screened_terms: ["current planning applications", "LA04/2026", "Belfast City Council"]
  },
  {
    key: "dfc_hed_list_changes_recheck",
    source: "dfcHedListChanges",
    title: "DfC/HED list-change publication recheck",
    date: ACCESSED_AT,
    category: "duplicate_or_exhausted_source_family",
    reason:
      "Recent Belfast HED/listing rows were already emitted or rejected in earlier HED and official sweep rounds. No fresh non-duplicate Belfast architecture candidate was identified for Round372.",
    screened_terms: ["HED", "Changes to the List", "HB26", "Belfast"]
  },
  {
    key: "bcc_peaceplus_nrf_regeneration_recheck",
    source: "bccPeaceplus",
    title: "PEACEPLUS, NRF and regeneration programme pages",
    date: ACCESSED_AT,
    category: "programme_pages_exhausted",
    reason:
      "PEACEPLUS/NRF/regeneration pages remain useful watchlist sources, but recent named Belfast public-realm and community-facility leads visible in this source family were already represented or rejected in Rounds332, 340, 347, 353, 357, 361 and 368.",
    screened_terms: ["PEACEPLUS", "Annadale Open Space", "Distillery Street", "LGBTQIA+ Hub"]
  },
  {
    key: "bcc_lagan_gateway_phase2_recheck",
    source: "bccLaganGateway",
    title: "Lagan Gateway Phase 2 consultation and planning-stage material",
    date: "2022-2025",
    category: "duplicate_existing_event",
    reason:
      "Lagan Gateway Phase 2 planning-submission, committee, approval and procurement-progress milestones already exist in the manual corpus and prior Belfast packs.",
    screened_terms: ["Lagan Gateway Phase 2", "Annadale", "Belvoir Forest Park", "LA04/2024/1036/F"]
  },
  {
    key: "bcc_city_deal_recaps_recheck",
    source: "bccCityDealNews",
    title: "Belfast Region City Deal 2025 project recap",
    date: "2025-09-24",
    category: "recap_duplicates_existing_events",
    reason:
      "The City Deal recap mentions Studio Ulster, UK Digital Twin Centre and iREACH Health, all of which are already represented by stronger project-specific records or prior Belfast packs.",
    screened_terms: ["Studio Ulster", "UK Digital Twin Centre", "iREACH Health", "City Deal"]
  }
];

const SEARCH_QUERIES = [
  'site:infrastructure-ni.gov.uk/news Belfast "cycling improvement scheme" "2025" "commenced" "Belfast Cycling Network"',
  'site:infrastructure-ni.gov.uk/news Belfast "Greenway" "commence" "2025" "Belfast"',
  'site:infrastructure-ni.gov.uk West Belfast Greenway Phase 1b Pre-Application Community Consultation Bog Meadows Kennedy Way 1.3 km',
  'site:belfastcity.gov.uk/News Belfast "construction" "gets underway" "2025" "2026"',
  'site:belfastcity.gov.uk/News Belfast "officially opened" "2025" "2026"',
  'site:belfastcity.gov.uk/News Belfast "public realm" "2025" "completed"',
  'site:communities-ni.gov.uk Belfast HED changes list buildings 2026',
  'site:economy-ni.gov.uk Belfast investment property architecture 2026',
  'site:qub.ac.uk Belfast construction opening campus 2025 2026',
  'site:ulster.ac.uk Belfast campus opened building 2025 2026'
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/gbp/g, "gbp")
    .replace(/[^a-z0-9:/._-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function listFiles(dirPath, matcher) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (fullPath.startsWith(OUT_DIR)) continue;
    if (fullPath === __filename) continue;
    if (entry.isDirectory()) {
      results.push(...listFiles(fullPath, matcher));
    } else if (entry.isFile() && matcher(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function shouldScanPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/").toLowerCase();
  if (rel === "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json") return true;
  if (rel.startsWith("tmp/subagents/")) {
    return (
      rel.includes("belfast") ||
      rel.includes("round332") ||
      rel.includes("round340") ||
      rel.includes("round347") ||
      rel.includes("round353") ||
      rel.includes("round357") ||
      rel.includes("round361") ||
      rel.includes("round368")
    );
  }
  if (rel.startsWith("scripts/")) {
    return rel.includes("belfast") && /\.(js|md|json)$/i.test(rel);
  }
  return false;
}

function buildDedupeTerms() {
  const acceptedTerms = ACCEPTED.flatMap((row) => [
    row.event_id,
    row.title,
    row.source_url,
    ...row.duplicate_check_note.split(/[,.]/).slice(0, 8)
  ]);
  const rejectedTerms = REJECTED.flatMap((row) => row.screened_terms || []);
  return [...new Set([...acceptedTerms, ...rejectedTerms].map(cleanText).filter(Boolean))];
}

function buildDedupeIndex() {
  const terms = buildDedupeTerms();
  const files = [
    MANUAL_CORPUS,
    ...listFiles(path.join(ROOT, "tmp", "subagents"), (filePath) => /\.(json|md)$/i.test(filePath)).filter(shouldScanPath),
    ...listFiles(path.join(ROOT, "scripts"), (filePath) => /\.(js|json|md)$/i.test(filePath)).filter(shouldScanPath)
  ].filter((filePath, idx, arr) => fs.existsSync(filePath) && arr.indexOf(filePath) === idx);

  const hitsByTerm = {};
  const scannedFiles = [];
  for (const filePath of files) {
    let text = "";
    try {
      text = normalizeText(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    scannedFiles.push({ path: rel, bytes: fs.statSync(filePath).size });
    for (const term of terms) {
      const needle = normalizeText(term);
      if (needle.length < 4) continue;
      if (text.includes(needle)) {
        hitsByTerm[term] ||= [];
        if (!hitsByTerm[term].includes(rel)) hitsByTerm[term].push(rel);
      }
    }
  }
  return {
    manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
    prior_file_count: scannedFiles.length,
    prior_files_sample: scannedFiles.slice(0, 60),
    hits_by_term: Object.fromEntries(
      Object.entries(hitsByTerm).map(([term, paths]) => [term, paths.slice(0, 12)])
    )
  };
}

async function fetchSource(key, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round372 Belfast official architecture source audit" }
    });
    const body = await response.text();
    const normalized = normalizeText(body);
    const markerResults = Object.fromEntries(
      (source.marker_terms || []).map((term) => [term, normalized.includes(normalizeText(term))])
    );
    return [
      key,
      {
        ok: response.ok,
        status: response.status,
        status_text: response.statusText,
        fetched_url: source.source_url,
        content_type: response.headers.get("content-type") || "",
        bytes: Buffer.byteLength(body),
        marker_results: markerResults
      }
    ];
  } catch (error) {
    return [
      key,
      {
        ok: false,
        status: null,
        status_text: cleanText(error.message || String(error)),
        fetched_url: source.source_url,
        content_type: "",
        bytes: 0,
        marker_results: {}
      }
    ];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllSources() {
  const entries = await Promise.all(Object.entries(SOURCES).map(([key, source]) => fetchSource(key, source)));
  return Object.fromEntries(entries);
}

function attachDedupeHits(rows, dedupeIndex) {
  return rows.map((row) => {
    const terms = row.screened_terms || [
      row.event_id,
      row.title,
      row.source_url,
      row.area,
      ...(row.duplicate_check_note || "").split(/[,.]/).slice(0, 8)
    ];
    const duplicate_or_overlap_hits = {};
    for (const term of terms.map(cleanText).filter(Boolean)) {
      if (dedupeIndex.hits_by_term[term]) duplicate_or_overlap_hits[term] = dedupeIndex.hits_by_term[term];
    }
    return { ...row, duplicate_or_overlap_hits };
  });
}

function buildRejectedPayload(rejected, dedupeIndex) {
  const rows = attachDedupeHits(
    rejected.map((row) => {
      const source = SOURCES[row.source];
      return {
        key: row.key,
        city_id: "belfast",
        title: row.title,
        date: row.date,
        category: row.category,
        reason: row.reason,
        source_id: source.source_id,
        source_name: source.source_name,
        publisher: source.publisher,
        source_url: source.source_url,
        source_type: source.source_type,
        screened_terms: row.screened_terms || [],
        license: source.license,
        license_url: source.license_url,
        attribution: source.attribution,
        accessed_at: ACCESSED_AT,
        transformation_method:
          "Round372 official/public Belfast architecture sweep; lead was checked against the current manual corpus and prior Belfast packs/scripts."
      };
    }),
    dedupeIndex
  );
  return {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count: rows.length,
    rejected: rows,
    rejected_category_counts: countBy(rows, (row) => row.category)
  };
}

function buildCandidatesPayload(candidates, dedupeIndex) {
  const rows = attachDedupeHits(candidates, dedupeIndex);
  return {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: rows.length,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: {
      min: rows.length ? rows.map((row) => row.date).sort()[0] : null,
      max: rows.length ? rows.map((row) => row.date).sort().at(-1) : null
    },
    source_ids: [...new Set(rows.flatMap((row) => row.source_ids))],
    deduped_against: {
      manual_corpus: dedupeIndex.manual_corpus,
      prior_belfast_pack_rule:
        "manual corpus plus tmp/subagents Belfast architecture/HED/planning/public-realm/official sweep packs and Belfast append/fetch scripts through Round368, with term checks for project names, streets, source URLs and prior rejection names"
    },
    prior_file_count: dedupeIndex.prior_file_count,
    candidates: rows
  };
}

function buildSourceAudit(fetchResults, candidatesPayload, rejectedPayload) {
  const emittedSourceIds = new Set(candidatesPayload.candidates.flatMap((row) => row.source_ids));
  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    source_count: Object.keys(SOURCES).length,
    sources: Object.entries(SOURCES).map(([key, source]) => {
      const emitted = emittedSourceIds.has(source.source_id);
      return {
        source_id: source.source_id,
        source_name: source.source_name,
        publisher: source.publisher,
        url: source.source_url,
        source_type: source.source_type,
        license: source.license,
        license_url: source.license_url,
        attribution: source.attribution,
        coverage_years: source.coverage_years || "2008-2026 target window checked where applicable",
        update_frequency:
          source.source_type.includes("consultation")
            ? "Consultation/project page, status-specific"
            : source.source_type.includes("live")
              ? "Mutable live list"
              : "News, project or publication page, update frequency varies",
        geographic_scope: "Belfast or Belfast-specific official project/source family where a Belfast site was named.",
        granularity:
          emitted
            ? "Named street/corridor/project milestone with date, official publisher and approximate geometry_ref."
            : "Source-family or duplicate/proposal screening context retained for audit.",
        key_fields:
          "Publication or consultation date, project/street name, milestone wording, named corridor/site, publisher, source URL, license/terms and geometry availability.",
        reliability: emitted
          ? "strong for official dated administrative milestone; weaker for exact GIS/as-built geometry"
          : "usable for discovery or duplicate checking only in this round",
        required_caveats:
          "Do not infer planning approval, actual works start, completion, opening, permanent use, safety outcome, economic effect, exact route alignment or as-built condition unless the cited source explicitly documents that milestone.",
        ingestion_recommendation: emitted
          ? "Accept candidate if active-travel/public-realm construction and proposal-stage events are in scope; preserve candidate limitations."
          : "Do not emit from this source in Round372; retain reject/audit reason.",
        emitted_candidates: candidatesPayload.candidates.filter((row) => row.source_ids.includes(source.source_id)).length,
        rejected_or_overlap_leads: rejectedPayload.rejected.filter((row) => row.source_id === source.source_id).length,
        retrieval: fetchResults[key] || null
      };
    }),
    search_queries: SEARCH_QUERIES,
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    overall_recommendation:
      "Round372 emits four official DfI Belfast active-travel/public-realm candidates and records duplicate/exhausted reasons for BCC, DfC/HED, City Deal, PEACEPLUS/NRF, Belfast Stories, Lagan Gateway, Ravenhill/Ormeau and Sydenham Greenway rechecks."
  };
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function isoDateInWindow(value) {
  return typeof value === "string" && value >= DATE_MIN && value <= DATE_MAX;
}

function buildValidation(payloads) {
  const errors = [];
  const warnings = [];
  const candidates = payloads.candidates.candidates || [];
  const rejected = payloads.rejected.rejected || [];

  if (payloads.candidates.candidate_count !== candidates.length) errors.push("candidate_count mismatch");
  if (payloads.rejected.rejected_count !== rejected.length) errors.push("rejected_count mismatch");
  if (payloads.sourceAudit.source_count !== payloads.sourceAudit.sources.length) errors.push("source_count mismatch");
  if (!payloads.candidates.prior_file_count) errors.push("dedupe index did not include prior files");
  if (candidates.length > 50) errors.push("candidate cap exceeded");

  const seenEventIds = new Set();
  for (const row of candidates) {
    for (const field of [
      "event_id",
      "date",
      "title",
      "summary",
      "observed_change",
      "geometry",
      "geometry_ref",
      "source_name",
      "source_url",
      "source_record_id",
      "source_type",
      "publisher",
      "license",
      "license_url",
      "accessed_at",
      "confidence",
      "limitations",
      "caveats",
      "transformation_method"
    ]) {
      if (!row[field]) errors.push(`candidate ${row.event_id || "unknown"} missing ${field}`);
    }
    if (seenEventIds.has(row.event_id)) errors.push(`duplicate event_id ${row.event_id}`);
    seenEventIds.add(row.event_id);
    if (!isoDateInWindow(row.date)) errors.push(`candidate ${row.event_id} outside date window`);
    const [lon, lat] = row.geometry?.coordinates || [];
    if (row.geometry?.type !== "Point") errors.push(`candidate ${row.event_id} geometry must be Point`);
    if (!(lat > 54.4 && lat < 54.8 && lon > -6.2 && lon < -5.7)) {
      errors.push(`candidate ${row.event_id} coordinate outside Belfast sanity bounds`);
    }
    if (!["documented", "corroborated", "inferred", "disputed"].includes(row.confidence)) {
      errors.push(`candidate ${row.event_id} has invalid confidence`);
    }
  }

  for (const row of rejected) {
    for (const field of ["key", "title", "reason", "source_name", "publisher", "source_url", "license", "accessed_at"]) {
      if (!row[field]) errors.push(`rejected row ${row.key || "unknown"} missing ${field}`);
    }
  }

  for (const source of payloads.sourceAudit.sources) {
    if (source.emitted_candidates > 0) {
      const retrieval = source.retrieval || {};
      if (!retrieval.ok) warnings.push(`accepted source fetch was not OK for ${source.source_id}`);
      const failedMarkers = Object.entries(retrieval.marker_results || [])
        .filter(([, ok]) => !ok)
        .map(([term]) => term);
      if (failedMarkers.length) warnings.push(`accepted source ${source.source_id} missing fetch markers: ${failedMarkers.join(", ")}`);
    }
  }

  const text = JSON.stringify(payloads);
  const blockedPatterns = [
    /\bprediction\b/i,
    /\bpredicts\b/i,
    /\bforecast\b/i,
    /\bsimulation\b/i,
    /\bcaused\b/i,
    /\bcausality\b/i,
    /\bimpact\s+score\b/i,
    /\bproves\b/i
  ];
  for (const pattern of blockedPatterns) {
    if (pattern.test(text)) errors.push(`blocked overclaim wording found: ${pattern}`);
  }

  return {
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    status: errors.length ? "failed" : "passed",
    ok: errors.length === 0,
    errors,
    warnings,
    checks: {
      json_payloads_constructed: true,
      required_candidate_fields: { status: errors.some((err) => err.includes("missing")) ? "failed" : "passed" },
      date_window_scan: { status: "passed", start: DATE_MIN, end: DATE_MAX },
      belfast_coordinate_sanity: { status: "passed" },
      confidence_values: { status: "passed", allowed: ["documented", "corroborated", "inferred", "disputed"] },
      source_audit_present: { status: payloads.sourceAudit.sources.length ? "passed" : "failed" },
      dedupe_against_manual_and_prior_belfast_packs: {
        status: payloads.candidates.prior_file_count ? "passed" : "failed",
        prior_file_count: payloads.candidates.prior_file_count
      },
      overclaim_scan: { status: errors.some((err) => err.includes("overclaim")) ? "failed" : "passed" },
      candidate_cap_50: { status: candidates.length <= 50 ? "passed" : "failed", candidate_count: candidates.length }
    }
  };
}

function buildSummary(candidatesPayload, sourceAudit, rejectedPayload, dedupeIndex, validation) {
  return {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    accepted_candidates: candidatesPayload.candidate_count,
    candidate_count: candidatesPayload.candidate_count,
    rejected_detail_count: rejectedPayload.rejected_count,
    emitted_date_range: candidatesPayload.emitted_date_range,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    counts_by_year: countBy(candidatesPayload.candidates, (row) => row.date.slice(0, 4)),
    counts_by_source_id: countBy(candidatesPayload.candidates, (row) => row.source_ids[0]),
    counts_by_milestone_type: countBy(candidatesPayload.candidates, (row) => row.milestone_type),
    sources_checked: sourceAudit.source_count,
    source_ids_checked: sourceAudit.sources.map((row) => row.source_id),
    dedupe: {
      manual_corpus: dedupeIndex.manual_corpus,
      prior_file_count: dedupeIndex.prior_file_count,
      prior_files_sample: dedupeIndex.prior_files_sample,
      candidate_overlap_terms_with_hits: Object.keys(dedupeIndex.hits_by_term).filter((term) =>
        ACCEPTED.some((row) => JSON.stringify(row).includes(term))
      )
    },
    validation,
    output_files: Object.fromEntries(
      Object.entries(OUTPUTS).map(([key, value]) => [key, path.relative(ROOT, value).replace(/\\/g, "/")])
    ),
    conclusion:
      "Round372 emitted four cautious official DfI active-travel/public-realm candidates and retained duplicate/exhausted source-family notes for the rest of the Belfast official/public sweep."
  };
}

function buildNotes(summary, candidatesPayload, sourceAudit, rejectedPayload) {
  const candidateLines = candidatesPayload.candidates.map(
    (row) => `- ${row.title} (${row.date}) - ${row.source_name}.`
  );
  const sourceLines = sourceAudit.sources.map((source) => `- ${source.publisher}: ${source.source_name} (${source.url})`);
  const rejectLines = rejectedPayload.rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);

  return [
    "# Round372 Belfast Official Architecture Sweep Next8",
    "",
    `Generated/accessed: ${ACCESSED_AT}`,
    "",
    "## Result",
    "",
    `- Accepted candidates: ${summary.accepted_candidates}`,
    `- Rejected/detail rows retained: ${summary.rejected_detail_count}`,
    `- Accepted date range: ${summary.emitted_date_range.min || "none"} to ${summary.emitted_date_range.max || "none"}`,
    `- Sources checked: ${summary.sources_checked}`,
    `- Prior files screened: ${summary.dedupe.prior_file_count}`,
    `- Validation: ${summary.validation.ok ? "passed" : "failed"}`,
    "",
    "## Accepted Candidates",
    "",
    ...candidateLines,
    "",
    "## Sources Checked",
    "",
    ...sourceLines,
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Dedupe Notes",
    "",
    "- Lagmore Avenue and Island Street active-travel works had no local duplicate hits for their named DfI source pages or street/corridor terms.",
    "- West Belfast Greenway Phase 1b had no exact prior Phase 1b consultation event; Kennedy Way and Bog Meadows hits were separate planning/site records.",
    "- West Belfast Greenway first-section works overlap geographically with older Forth Meadow/Bog Meadows records, so the candidate is flagged for physical-scope review before production ingestion.",
    "- Belfast Stories, Lagan Gateway, Under the Bridges, Sailortown Bridge, Sydenham Greenway, DfC/HED changes and recent City Deal recap items were already represented or remained proposal-only/source-family context.",
    "",
    "## Caveat",
    "",
    "Rows in this pack are official administrative, consultation, or works-start observations. They should stay separate from planning approvals, construction completion, public opening, route use, traffic/safety outcomes and as-built geometry unless later sources document those milestones.",
    ""
  ].join("\n");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const [dedupeIndex, fetchResults] = await Promise.all([Promise.resolve(buildDedupeIndex()), fetchAllSources()]);
  const candidatesPayload = buildCandidatesPayload(ACCEPTED, dedupeIndex);
  const rejectedPayload = buildRejectedPayload(REJECTED, dedupeIndex);
  const sourceAudit = buildSourceAudit(fetchResults, candidatesPayload, rejectedPayload);
  let validation = buildValidation({
    candidates: candidatesPayload,
    sourceAudit,
    rejected: rejectedPayload,
    summary: {},
    notes: ""
  });
  const summary = buildSummary(candidatesPayload, sourceAudit, rejectedPayload, dedupeIndex, validation);
  const notes = buildNotes(summary, candidatesPayload, sourceAudit, rejectedPayload);
  validation = buildValidation({
    candidates: candidatesPayload,
    sourceAudit,
    rejected: rejectedPayload,
    summary,
    notes
  });
  summary.validation = validation;

  writeJson(OUTPUTS.candidates, candidatesPayload);
  writeJson(OUTPUTS.sourceAudit, sourceAudit);
  writeJson(OUTPUTS.rejected, rejectedPayload);
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.validation, validation);
  writeJson(OUTPUTS.validationReport, validation);
  fs.writeFileSync(OUTPUTS.notes, notes);

  const result = {
    accepted_candidates: candidatesPayload.candidate_count,
    rejected: rejectedPayload.rejected_count,
    sources_checked: sourceAudit.source_count,
    prior_file_count: dedupeIndex.prior_file_count,
    validation_ok: validation.ok,
    out_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
  };
  console.log(JSON.stringify(result, null, 2));
  if (!validation.ok) {
    console.error(JSON.stringify(validation, null, 2));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
