const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round214_belfast_official_deep_tail";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-19";
const ACCESSED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const TARGET_CAP = 20;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json")
};

const CIVIC_POINT = { lat: 54.59639, lon: -5.93018 };

const SOURCE_TEMPLATES = {
  bcc: {
    publisher: "Belfast City Council",
    source_type: "official council news, minutes, planning or regeneration page",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; Belfast City Council website terms, images, maps, logos and embedded third-party material require source-level review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    update_frequency: "Council page or committee/minutes record; may be updated by publisher."
  },
  harbour: {
    publisher: "Belfast Harbour Commissioners",
    source_type: "official Belfast Harbour news or strategy page",
    license: "Belfast Harbour website copyright/terms apply; factual metadata and source URLs are retained for review, while images, maps, logos and third-party content must not be redistributed without rights review.",
    license_url: "https://www.belfast-harbour.co.uk/policies/",
    attribution: "Attribute Belfast Harbour Commissioners.",
    update_frequency: "Official news or strategy page; may be updated by publisher."
  }
};

const SOURCES = {
  partnerSearch: source("bcc", "bcc-development-partner-search-round214", "Council seeks development partner to boost city population through GBP630million housing-led regeneration opportunity", "https://www.belfastcity.gov.uk/news/council-seeks-development-partner-to-boost-city-po", "BCC housing-led regeneration procurement", "official council news page"),
  grahamPartner: source("bcc", "bcc-graham-delivery-partner-round214", "Belfast City Council appoints GRAHAM as delivery partner for GBP630m housing-led regeneration programme", "https://www.belfastcity.gov.uk/News/Belfast-City-Council-appoints-GRAHAM-as-delivery-p", "BCC housing-led regeneration delivery partner", "official council news page"),
  clanmilInnerNorthwest: source("bcc", "bcc-clanmil-inner-northwest-round214", "Belfast city centre car parks and vacant land set to be transformed into new homes", "https://www.belfastcity.gov.uk/news/belfast-city-centre-car-parks-and-vacant-land-set", "BCC inner north west housing-led regeneration", "official council news page"),
  placeGrowth: source("bcc", "bcc-place-based-growth-proposition-round214", "Belfast pushes for fair share of regional regeneration funding ahead of Budget Statement", "https://www.belfastcity.gov.uk/news/belfast-pushes-for-fair-share-of-regional-regenera", "BCC place-based growth proposition", "official council news page"),
  houseMinutes: source("bcc", "bcc-future-city-house-programme-minutes-round214", "Agenda item - Future City Centre Vacancy Programme", "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=86313", "BCC committee minutes", "official council committee minutes page"),
  assemblyAgreed: source("bcc", "bcc-assembly-rooms-purchase-agreed-round214", "Council agrees to purchase Assembly Rooms as city centre regeneration continues", "https://www.belfastcity.gov.uk/News/Council-agrees-to-purchase-Assembly-Rooms-as-city", "BCC strategic heritage acquisition", "official council news page"),
  bridgeDesignTeam: source("bcc", "bcc-sailortown-titanic-bridge-design-team-round214", "Belfast City Council appoints design team to develop Sailortown to Titanic Quarter bridge", "https://www.belfastcity.gov.uk/news/belfast-city-council-appoints-design-team-to-devel", "BCC waterfront active-travel bridge design", "official council news page"),
  spgHistoricAreas: source("bcc", "bcc-historic-areas-spg-planning-news-round214", "Council agrees supplementary planning guidance for historic areas of Belfast", "https://www.belfastcity.gov.uk/News/Council-agrees-supplementary-planning-guidance-for", "BCC planning committee news", "official council planning news page"),
  cityQuaysGardensStart: source("harbour", "belfast-harbour-city-quays-gardens-start-round214", "Belfast Harbour Begins Work on GBP3m First Phase of City Quays Gardens", "https://www.belfast-harbour.co.uk/news/city-quays-gardens-work-commences/", "Belfast Harbour City Quays public realm", "official Belfast Harbour news page"),
  cityQuays5Approval: source("harbour", "belfast-harbour-city-quays-5-approval-round214", "Approval granted for GBP60m City Quays 5 Development", "https://www.belfast-harbour.co.uk/news/approval-granted-for-60m-city-quays-5-development/", "Belfast Harbour City Quays development", "official Belfast Harbour news page"),
  harbourStrategy: source("harbour", "belfast-harbour-advance-regional-prosperity-round214", "Belfast Harbour launches transformative five-year strategy with GBP313m investment programme", "https://www.belfast-harbour.co.uk/news/belfast-harbour-launches-transformative-five-year-strategy-with-313m-investment-programme/", "Belfast Harbour strategy", "official Belfast Harbour news page"),
  d3Works: source("harbour", "belfast-harbour-d3-works-commence-round214", "Work commences on Belfast Harbour's largest ever port investment project", "https://www.belfast-harbour.co.uk/news/work-commences-on-belfast-harbours-largest-ever-port-investment-project-to-create-new-cruise-and-offshore-wind-energy-terminal/", "Belfast Harbour D3 deepwater terminal", "official Belfast Harbour news page"),
  harbourDraftMasterplan: source("harbour", "belfast-harbour-draft-masterplan-consultation-round214", "Belfast Harbour launches consultation on 2050 Draft Masterplan", "https://www.belfast-harbour.co.uk/news/belfast-harbour-launches-consultation-on-groundbreaking-2050-draft-masterplan-that-will-support-nis-economy-for-future-generations/", "Belfast Harbour masterplan", "official Belfast Harbour news page"),
  clarendonMasterplan: source("harbour", "belfast-harbour-clarendon-wharf-masterplan-round214", "Belfast Harbour announces residential masterplan for Clarendon Wharf", "https://www.belfast-harbour.co.uk/news/belfast-harbour-announces-residential-masterplan-for-clarendon-wharf/", "Belfast Harbour Clarendon Wharf", "official Belfast Harbour news page"),
  clarendonApplication: source("harbour", "belfast-harbour-clarendon-wharf-application-round214", "Belfast Harbour submits planning application for Clarendon Wharf residential development", "https://www.belfast-harbour.co.uk/news/belfast-harbour-submits-planning-application-for-clarendon-wharf-residential-development/", "Belfast Harbour Clarendon Wharf", "official Belfast Harbour news page"),
  cityQuays4Application: source("harbour", "belfast-harbour-city-quays-4-application-round214", "Belfast Harbour submits planning application for new residential development at City Quays", "https://www.belfast-harbour.co.uk/news/city-quays-4-residential-development/", "Belfast Harbour City Quays residential", "official Belfast Harbour news page"),
  cityQuaysAffordableApplication: source("harbour", "belfast-harbour-city-quays-affordable-application-round214", "Belfast Harbour submits planning application for new affordable housing scheme at City Quays", "https://www.belfast-harbour.co.uk/news/planning-application-affordable-housing-city-quays/", "Belfast Harbour City Quays affordable housing", "official Belfast Harbour news page"),
  harbourCrane: source("harbour", "belfast-harbour-mobile-crane-arrival-round214", "New GBP4.5m harbour mobile crane arrives in Belfast Harbour", "https://www.belfast-harbour.co.uk/news/new-4-5m-harbour-mobile-crane-arrives-in-belfast-harbour-enhancing-the-ports-cargo-handling-capabilities/", "Belfast Harbour port infrastructure", "official Belfast Harbour news page")
};

const SEEDS = [
  candidate({
    key: "housing_led_partner_search_2023",
    source: "partnerSearch",
    date: "2023-10-31",
    date_precision: "day",
    title: "Council began search for housing-led regeneration development partner",
    summary: "Belfast City Council announced the start of a partner search for a multi-site residential-led mixed-use regeneration opportunity with four city-centre seed sites.",
    observed_change: "Official council news records the procurement launch for a housing-led mixed-use regeneration delivery partner.",
    milestone_type: "housing_led_regeneration_partner_procurement_launch",
    area: "Belfast city centre seed sites",
    lat: 54.5988,
    lon: -5.9288,
    source_record_id: "Council seeks development partner news page, Date 31 October 2023",
    source_date_field: "news publication date",
    source_date_value: "31 October 2023",
    project_type: "housing-led mixed-use regeneration procurement",
    raw_source_hint: "Date 31 October 2023; concept plans for four city centre seed sites",
    geometry_source: "Representative point for the city-centre seed-site programme, not a parcel boundary.",
    geometry_precision: "representative multi-site programme point"
  }),
  candidate({
    key: "graham_delivery_partner_2024",
    source: "grahamPartner",
    date: "2024-12-16",
    date_precision: "day",
    title: "GRAHAM appointed housing-led regeneration delivery partner",
    summary: "Belfast City Council selected GRAHAM as long-term private-sector delivery partner for residential-led mixed-use development across multiple council-owned sites.",
    observed_change: "Official council news records a delivery-partner appointment for a multi-site regeneration programme.",
    milestone_type: "housing_led_regeneration_delivery_partner_appointment",
    area: "Belfast city centre seed sites",
    lat: 54.5988,
    lon: -5.9288,
    source_record_id: "GRAHAM delivery partner news page, Date 16 December 2024",
    source_date_field: "news publication date",
    source_date_value: "16 December 2024",
    project_type: "housing-led mixed-use regeneration partnership",
    raw_source_hint: "Date 16 December 2024; delivery partner appointment",
    geometry_source: "Representative point for the multi-site city-centre programme, not a parcel boundary.",
    geometry_precision: "representative multi-site programme point"
  }),
  candidate({
    key: "inner_northwest_clanmil_appointment_2025",
    source: "clanmilInnerNorthwest",
    date: "2025-03-10",
    date_precision: "day",
    title: "Clanmil appointed for inner northwest mixed-use residential scheme",
    summary: "Belfast City Council reported that public-sector partners appointed Clanmil Housing Association to develop a residential-led mixed-use scheme at Little Donegall Street, Library Street and Kent Street.",
    observed_change: "Official council news records appointment of a delivery body for a named city-centre housing-led regeneration site.",
    milestone_type: "housing_led_regeneration_delivery_body_appointment",
    area: "Little Donegall Street / Library Street / Kent Street",
    lat: 54.60325,
    lon: -5.93025,
    source_record_id: "Inner northwest Clanmil appointment news page, Date 10 March 2025",
    source_date_field: "news publication date",
    source_date_value: "10 March 2025",
    project_type: "residential-led mixed-use regeneration",
    raw_source_hint: "Date 10 March 2025; Little Donegall Street, Library Street and Kent Street",
    geometry_source: "Approximate point within the named Little Donegall Street, Library Street and Kent Street inner northwest area.",
    geometry_precision: "approximate named-area point"
  }),
  candidate({
    key: "city_quays_gardens_work_commenced_2023",
    source: "cityQuaysGardensStart",
    date: "2023-11-29",
    date_precision: "day",
    title: "City Quays Gardens first-phase works commenced",
    summary: "Belfast Harbour announced that work had commenced on City Quays Gardens, a public-realm project on land between City Quays and the historic Harbour Office.",
    observed_change: "Official Belfast Harbour news records construction/work commencement for a named public-realm garden project.",
    milestone_type: "public_realm_works_commencement",
    area: "City Quays Gardens / Belfast Harbour Office",
    lat: 54.60455,
    lon: -5.91825,
    source_record_id: "City Quays Gardens work commences news page, datePublished 2023-11-29",
    source_date_field: "article datePublished",
    source_date_value: "2023-11-29T14:19:26+00:00",
    project_type: "public realm urban garden",
    raw_source_hint: "Article datePublished 2023-11-29; work commenced",
    geometry_source: "Approximate point for City Quays Gardens between City Quays and the Harbour Office.",
    geometry_precision: "approximate project point"
  }),
  candidate({
    key: "city_quays_5_approval_2024",
    source: "cityQuays5Approval",
    date: "2024-06-27",
    date_precision: "day",
    title: "City Quays 5 planning approval was welcomed by Belfast Harbour",
    summary: "Belfast Harbour reported Belfast City Council planning approval for City Quays 5, a nine-storey mixed-use waterfront building opposite the Harbour Office.",
    observed_change: "Official Belfast Harbour news records a planning-approval milestone for a named mixed-use City Quays phase.",
    milestone_type: "mixed_use_development_planning_approval_reported",
    area: "City Quays / Belfast Harbour Office",
    lat: 54.60405,
    lon: -5.9189,
    source_record_id: "City Quays 5 approval news page, datePublished 2024-06-27",
    source_date_field: "article datePublished",
    source_date_value: "2024-06-27T16:35:34+00:00",
    project_type: "mixed-use office, retail, exhibition and rooftop hospitality development",
    raw_source_hint: "Article datePublished 2024-06-27; approval granted for City Quays 5",
    geometry_source: "Approximate point for City Quays 5 opposite the Belfast Harbour Office.",
    geometry_precision: "approximate project point"
  }),
  candidate({
    key: "harbour_strategy_launched_2025",
    source: "harbourStrategy",
    date: "2025-01-21",
    date_precision: "day",
    title: "Belfast Harbour launched 2025-2029 investment strategy",
    summary: "Belfast Harbour launched its Advance Regional Prosperity 2025-2029 strategy, including port and estate capital investment and waterfront regeneration priorities.",
    observed_change: "Official Belfast Harbour news records publication of a strategic capital-investment and regeneration programme.",
    milestone_type: "harbour_estate_strategy_publication",
    area: "Belfast Harbour Estate",
    lat: 54.60435,
    lon: -5.91735,
    source_record_id: "Advance Regional Prosperity strategy launch news page, datePublished 2025-01-21",
    source_date_field: "article datePublished",
    source_date_value: "2025-01-21T00:01:41+00:00",
    project_type: "harbour estate strategy and capital programme",
    raw_source_hint: "Article datePublished 2025-01-21; strategy launch",
    geometry_source: "Representative point at Belfast Harbour Office for an estate-wide strategy.",
    geometry_precision: "representative estate-wide administrative point"
  }),
  candidate({
    key: "d3_deepwater_terminal_works_commenced_2025",
    source: "d3Works",
    date: "2025-04-28",
    date_precision: "day",
    title: "D3 deepwater terminal marine works commenced",
    summary: "Belfast Harbour announced marine works due to begin that week on the D3 deepwater terminal for cruise and offshore-wind-energy use.",
    observed_change: "Official Belfast Harbour news records work commencement for a named deepwater terminal capital project.",
    milestone_type: "port_terminal_works_commencement",
    area: "D3 / Airport Road West / Belfast Harbour Estate",
    lat: 54.6261,
    lon: -5.8368,
    source_record_id: "D3 works commence news page, datePublished 2025-04-28",
    source_date_field: "article datePublished",
    source_date_value: "2025-04-28T15:27:32+00:00",
    project_type: "deepwater quay and terminal infrastructure",
    raw_source_hint: "Article datePublished 2025-04-28; marine works due to begin this week",
    geometry_source: "Approximate point for the D3/Airport Road West harbour-estate project area.",
    geometry_precision: "approximate project-area point"
  }),
  candidate({
    key: "assembly_rooms_purchase_agreed_2025",
    source: "assemblyAgreed",
    date: "2025-09-01",
    date_precision: "day",
    title: "Council agreed purchase of Assembly Rooms cluster",
    summary: "Belfast City Council announced agreement to purchase the historic Assembly Rooms and associated adjoining lands and buildings from Castlebrooke Investments.",
    observed_change: "Official council news records an acquisition-agreement milestone for a named listed heritage building cluster.",
    milestone_type: "heritage_asset_acquisition_agreed",
    area: "Assembly Rooms, North Street / Waring Street",
    lat: 54.60135,
    lon: -5.92745,
    source_record_id: "Assembly Rooms purchase-agreed news page, Date 1 September 2025",
    source_date_field: "news publication date",
    source_date_value: "1 September 2025",
    project_type: "heritage acquisition and adaptive reuse planning",
    raw_source_hint: "Date 1 September 2025; council agreed purchase",
    geometry_source: "Approximate point for Assembly Rooms at North Street and Waring Street.",
    geometry_precision: "approximate listed-building cluster point"
  }),
  candidate({
    key: "clarendon_wharf_masterplan_announced_2025",
    source: "clarendonMasterplan",
    date: "2025-09-22",
    date_precision: "day",
    title: "Clarendon Wharf residential masterplan was announced",
    summary: "Belfast Harbour announced a residential masterplan for Clarendon Wharf, including homes, commercial and community uses, dry-dock restoration and public realm.",
    observed_change: "Official Belfast Harbour news records announcement of a named waterfront masterplan and pre-application/planning route.",
    milestone_type: "waterfront_masterplan_announcement",
    area: "Clarendon Wharf / Belfast Harbour Estate",
    lat: 54.60625,
    lon: -5.91735,
    source_record_id: "Clarendon Wharf masterplan announcement news page, datePublished 2025-09-22",
    source_date_field: "article datePublished",
    source_date_value: "2025-09-22T15:13:52+00:00",
    project_type: "residential-led waterfront masterplan",
    raw_source_hint: "Article datePublished 2025-09-22; residential masterplan announced",
    geometry_source: "Approximate point for Clarendon Wharf / Clarendon Dock.",
    geometry_precision: "approximate project-area point"
  }),
  candidate({
    key: "draft_harbour_masterplan_consultation_launched_2025",
    source: "harbourDraftMasterplan",
    date: "2025-11-18",
    date_precision: "day",
    title: "Belfast Harbour launched 2025-50 Draft Masterplan consultation",
    summary: "Belfast Harbour announced consultation on a 2025-50 Draft Masterplan covering port, harbour-estate and waterfront change across land and water holdings.",
    observed_change: "Official Belfast Harbour news records publication/consultation launch for a long-range harbour-estate masterplan.",
    milestone_type: "harbour_estate_masterplan_consultation_launch",
    area: "Belfast Harbour Estate",
    lat: 54.60435,
    lon: -5.91735,
    source_record_id: "Draft Masterplan consultation launch news page, datePublished 2025-11-18",
    source_date_field: "article datePublished",
    source_date_value: "2025-11-18T09:18:05+00:00",
    project_type: "harbour estate masterplan consultation",
    raw_source_hint: "Article datePublished 2025-11-18; Draft Masterplan consultation launched",
    geometry_source: "Representative point at Belfast Harbour Office for an estate-wide masterplan.",
    geometry_precision: "representative estate-wide administrative point"
  }),
  candidate({
    key: "place_based_growth_proposition_2025",
    source: "placeGrowth",
    date: "2025-11-21",
    date_precision: "day",
    title: "Belfast Place Based Growth Proposition was advanced before UK Budget",
    summary: "Belfast City Council announced that it had made the case for a City-Wide Regeneration Fund through the Belfast Place Based Growth Proposition.",
    observed_change: "Official council news records an administrative funding-proposition milestone for city regeneration priorities.",
    milestone_type: "city_regeneration_funding_proposition",
    area: "Belfast city centre and wider city regeneration areas",
    ...CIVIC_POINT,
    source_record_id: "Place Based Growth Proposition news page, Date 21 November 2025",
    source_date_field: "news publication date",
    source_date_value: "21 November 2025",
    project_type: "city regeneration funding proposition",
    raw_source_hint: "Date 21 November 2025; City-Wide Regeneration Fund proposition",
    geometry_source: "Representative point at Belfast City Hall for citywide regeneration funding proposition.",
    geometry_precision: "representative citywide administrative point"
  }),
  candidate({
    key: "sailortown_titanic_bridge_design_team_2025",
    source: "bridgeDesignTeam",
    date: "2025-12-18",
    date_precision: "day",
    title: "Sailortown to Titanic Quarter bridge design team appointed",
    summary: "Belfast City Council announced appointment of an integrated design team to develop feasibility and concept design for a moveable active-travel bridge across the River Lagan.",
    observed_change: "Official council news records design-team appointment for a named waterfront active-travel bridge project.",
    milestone_type: "bridge_design_team_appointment",
    area: "Sailortown to Titanic Quarter / River Lagan",
    lat: 54.6062,
    lon: -5.9118,
    source_record_id: "Sailortown to Titanic Quarter bridge design team news page, Date 18 December 2025",
    source_date_field: "news publication date",
    source_date_value: "18 December 2025",
    project_type: "active-travel pedestrian and cycle bridge design",
    raw_source_hint: "Date 18 December 2025; Arup and Knight Architects appointed for RIBA Stages 0-2",
    geometry_source: "Approximate representative point on the River Lagan between Sailortown and Titanic Quarter.",
    geometry_precision: "approximate corridor point, not final bridge alignment"
  }),
  candidate({
    key: "clarendon_wharf_planning_application_submitted_2026",
    source: "clarendonApplication",
    date: "2026-01-06",
    date_precision: "day",
    title: "Clarendon Wharf residential planning application was submitted",
    summary: "Belfast Harbour announced formal submission of a planning application to Belfast City Council for the Clarendon Wharf residential development.",
    observed_change: "Official Belfast Harbour news records a planning-application submission milestone for a named waterfront project.",
    milestone_type: "waterfront_development_planning_application_submission",
    area: "Clarendon Wharf / Belfast Harbour Estate",
    lat: 54.60625,
    lon: -5.91735,
    source_record_id: "Clarendon Wharf planning application submission news page, datePublished 2026-01-06",
    source_date_field: "article datePublished",
    source_date_value: "2026-01-06T10:08:00+00:00",
    project_type: "residential-led waterfront planning application",
    raw_source_hint: "Article datePublished 2026-01-06; planning application submitted",
    geometry_source: "Approximate point for Clarendon Wharf / Clarendon Dock.",
    geometry_precision: "approximate project-area point"
  }),
  candidate({
    key: "house_programme_progression_agreed_2026",
    source: "houseMinutes",
    date: "2026-01-14",
    date_precision: "day",
    title: "HOUSE programme progression was agreed by City Growth Committee",
    summary: "Belfast City Council committee minutes record agreement to progress the Homes On Upper Spaces for Everyone programme as a workstream of the Vacant to Vibrant Toolkit.",
    observed_change: "Official committee minutes record an administrative programme-progression milestone for reuse of vacant upper-floor space.",
    milestone_type: "vacant_upper_floor_reuse_programme_progression",
    area: "Belfast city centre",
    ...CIVIC_POINT,
    source_record_id: "Future City Centre Vacancy Programme item 2a, City Growth and Regeneration Committee, 14 January 2026",
    source_date_field: "committee meeting date",
    source_date_value: "14 January 2026",
    project_type: "vacancy and dereliction reuse programme",
    raw_source_hint: "Minutes item 2a; committee agreed parameters and progression of HOUSE programme",
    geometry_source: "Representative point at Belfast City Hall for a city-centre programme record.",
    geometry_precision: "representative administrative point"
  }),
  candidate({
    key: "common_market_permanent_use_approved_2026",
    source: "spgHistoricAreas",
    date: "2026-04-21",
    date_precision: "day",
    title: "Common Market permanent change of use was approved",
    summary: "Belfast City Council news records that Planning Committee approved permanent change of use for Common Market in Cathedral Quarter from warehouse/offices to public house and entertainment/events space with street-food market.",
    observed_change: "Official council planning news records a planning-approval milestone for permanent use of a named adaptive-reuse venue.",
    milestone_type: "adaptive_reuse_permanent_change_of_use_approval",
    area: "Common Market, Cathedral Quarter",
    lat: 54.60295,
    lon: -5.92945,
    source_record_id: "Council agrees SPG news page: Common Market permanent change of use approval, Date 21 April 2026",
    source_date_field: "news publication / planning committee date",
    source_date_value: "21 April 2026",
    project_type: "adaptive reuse planning approval",
    raw_source_hint: "News page line records Planning Committee approved permanent change of use for Common Market",
    geometry_source: "Approximate point for Common Market in Cathedral Quarter.",
    geometry_precision: "approximate venue point"
  }),
  candidate({
    key: "city_quays_4_application_submitted_2022",
    source: "cityQuays4Application",
    date: "2022-12-20",
    date_precision: "day",
    title: "City Quays 4 residential planning application was submitted",
    summary: "Belfast Harbour announced formal submission of a planning application for City Quays 4, a residential waterfront development beside the River Lagan.",
    observed_change: "Official Belfast Harbour news records a planning-application submission milestone for a named City Quays residential phase.",
    milestone_type: "residential_development_planning_application_submission",
    area: "City Quays 4 / Donegall Quay",
    lat: 54.60465,
    lon: -5.92015,
    source_record_id: "City Quays 4 residential application news page, datePublished 2022-12-20",
    source_date_field: "article datePublished",
    source_date_value: "2022-12-20T09:36:54+00:00",
    project_type: "waterfront residential planning application",
    raw_source_hint: "Article datePublished 2022-12-20; formal planning application submitted",
    geometry_source: "Approximate point for the City Quays 4 site beside the River Lagan and AC Hotel.",
    geometry_precision: "approximate project point"
  }),
  candidate({
    key: "city_quays_affordable_application_submitted_2023",
    source: "cityQuaysAffordableApplication",
    date: "2023-02-10",
    date_precision: "day",
    title: "City Quays affordable-housing planning application was submitted",
    summary: "Belfast Harbour announced formal submission of a planning application for affordable homes across Pilot Street and Corporation Street sites near Clarendon Dock and City Quays.",
    observed_change: "Official Belfast Harbour news records a planning-application submission milestone for named affordable-housing sites.",
    milestone_type: "affordable_housing_planning_application_submission",
    area: "Pilot Street / Corporation Street / Clarendon Dock",
    lat: 54.60575,
    lon: -5.92105,
    source_record_id: "City Quays affordable housing application news page, datePublished 2023-02-10",
    source_date_field: "article datePublished",
    source_date_value: "2023-02-10T14:27:52+00:00",
    project_type: "affordable housing planning application",
    raw_source_hint: "Article datePublished 2023-02-10; formal planning application submitted",
    geometry_source: "Approximate point between Pilot Street, Corporation Street and Clarendon Dock.",
    geometry_precision: "approximate multi-site project point"
  }),
  candidate({
    key: "harbour_mobile_crane_arrival_2026",
    source: "harbourCrane",
    date: "2026-05-07",
    date_precision: "day",
    title: "Harbour mobile crane arrived for Stormont Wharf operations",
    summary: "Belfast Harbour announced arrival of a new mobile bulk crane to operate on Stormont Wharf as part of port development and improvement investment.",
    observed_change: "Official Belfast Harbour news records arrival of port infrastructure equipment at a named wharf.",
    milestone_type: "port_infrastructure_equipment_arrival",
    area: "Stormont Wharf / Belfast Harbour Estate",
    lat: 54.6245,
    lon: -5.8765,
    source_record_id: "Harbour mobile crane arrival news page, datePublished 2026-05-07",
    source_date_field: "article datePublished",
    source_date_value: "2026-05-07T11:19:45+00:00",
    project_type: "port operational infrastructure equipment",
    raw_source_hint: "Article datePublished 2026-05-07; new harbour mobile crane arrived",
    geometry_source: "Approximate point for Stormont Wharf in Belfast Harbour Estate.",
    geometry_precision: "approximate wharf point"
  })
];

const MANUAL_REJECTS = [
  reject("city_quays_gardens_opening_duplicate", "City Quays Gardens official opening was already represented in the corpus as bfs_arch_city_quays_gardens_launch_2025; the official Harbour page was retained only as a discovered corroborating source lead.", "duplicate_existing_event", "https://www.belfast-harbour.co.uk/news/park-life-arrives-at-belfast-harbour-as-official-opening-of-city-quays-gardens-signals-start-of-summer/"),
  reject("under_bridges_funding_duplicate", "Under the Bridges and Sailortown Bridge DfI investment were already represented in round183/corpus records.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/Belfast-city-centre-regeneration-steps-up-a-gear"),
  reject("five_cs_consultation_duplicate", "Five Cs consultation, screening, accessibility report and revitalisation milestones were already represented in prior Belfast packs and corpus records.", "duplicate_existing_event", "https://www.communities-ni.gov.uk/news/minister-ni-chuilin-launches-consultation-belfast-public-realm-scheme"),
  reject("belfast_stories_design_and_consultation_duplicate", "Belfast Stories design-team, Stage 3, design-development and pre-application consultation milestones were already represented in the corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/BelfastStories/What-is-it"),
  reject("cathedral_gardens_duplicate", "Cathedral Gardens approval, works-start and Belfast Blitz Memorial design milestones were already represented in the corpus and prior packs.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway"),
  reject("spg_masterplans_duplicate", "Supplementary Planning Guidance masterplans for Cathedral/Northeast Quarter and Sailortown/City Quays were already represented by an existing 2026 corpus event; the same news page was used only for the distinct Common Market planning-approval item.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/Council-agrees-supplementary-planning-guidance-for"),
  reject("st_marys_sports_hall_duplicate", "St Mary's Christian Brothers' Grammar School sports hall approval was already present in the corpus.", "duplicate_existing_event", "https://www.belfastcity.gov.uk/News/Council-agrees-supplementary-planning-guidance-for"),
  reject("westbank_logistics_duplicate", "Belfast Harbour's Westbank Road logistics warehouse approval appears to duplicate an existing committee/planning-statistics warehouse distribution facility approval record.", "duplicate_existing_event", "https://www.belfast-harbour.co.uk/news/belfast-harbour-logistics-warehouse/"),
  reject("d3_planning_amendment_page_rejected", "The D3 planning amendment lead returned a non-indexed/not-found response during retrieval; the stronger official D3 work-commencement news page was retained instead.", "retrieval_or_date_quality", "https://www.belfast-harbour.co.uk/port/amendments-d3-planning-consent/")
];

function source(templateName, source_id, source_name, source_url, source_family, source_type) {
  const template = SOURCE_TEMPLATES[templateName];
  return {
    source_id,
    source_name,
    publisher: template.publisher,
    source_type: source_type || template.source_type,
    source_family,
    source_url,
    license: template.license,
    license_url: template.license_url,
    attribution: template.attribution,
    update_frequency: template.update_frequency,
    geographic_scope: "Belfast city, Belfast city centre, Belfast Harbour Estate, or named Belfast project area.",
    granularity: "Source page, committee item, news item, named development phase, planning-application milestone, design-team milestone, or strategy/masterplan milestone.",
    reliability_assessment: "usable with caveats"
  };
}

function candidate(seed) {
  return seed;
}

function reject(key, reason, category, source_url) {
  return {
    key,
    city_id: "belfast",
    reason,
    category,
    source_url,
    rejected_at: GENERATED_AT
  };
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function rowsFromJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.events)) return value.events;
  if (Array.isArray(value.candidates)) return value.candidates;
  if (Array.isArray(value.features)) {
    return value.features.map((feature) => ({
      ...(feature.properties || {}),
      geometry: feature.geometry || null
    }));
  }
  return [];
}

function collectPriorFiles() {
  const files = [];
  const corpus = path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
  if (fs.existsSync(corpus)) files.push({ kind: "corpus", path: corpus });

  const atlasDir = path.join(ROOT, "web", "data", "city-atlas", "cities", "belfast");
  if (fs.existsSync(atlasDir)) {
    for (const entry of fs.readdirSync(atlasDir)) {
      if (/^events_\d{4}\.(json|geojson)$/.test(entry)) files.push({ kind: "atlas", path: path.join(atlasDir, entry) });
    }
  }

  const tmpDir = path.join(ROOT, "tmp", "subagents");
  if (fs.existsSync(tmpDir)) {
    for (const entry of fs.readdirSync(tmpDir)) {
      if (!/belfast/i.test(entry) || entry === ROUND_ID) continue;
      const candidatePath = path.join(tmpDir, entry, "candidates.json");
      if (fs.existsSync(candidatePath)) files.push({ kind: "prior_belfast_pack", path: candidatePath });
    }
    const legacyRound113 = path.join(tmpDir, "round113_belfast_official_candidates.json");
    if (fs.existsSync(legacyRound113)) files.push({ kind: "prior_belfast_pack", path: legacyRound113 });
  }

  return files;
}

function buildIndex(files) {
  const index = {
    eventIds: new Set(),
    sourceRecordDateKeys: new Set(),
    titleDateKeys: new Set(),
    files: []
  };

  for (const fileInfo of files) {
    const rel = path.relative(ROOT, fileInfo.path).replace(/\\/g, "/");
    const rows = rowsFromJson(readJsonIfExists(fileInfo.path));
    index.files.push({ kind: fileInfo.kind, path: rel, record_count: rows.length });
    for (const row of rows) {
      const props = row.properties || row;
      const city = props.city_id || props.city || "belfast";
      const id = props.event_id || props.candidate_id || props.id;
      const date = props.date || props.effective_date || props.event_date || props.decision_date || "";
      const sourceUrl = props.source_url || props.access_url || props.url || "";
      const sourceRecordId = props.source_record_id || props.source_id || props.application_id || props.regulation_number || props.job_number || id || "";
      const sourceDateField = props.source_date_field || "";
      const title = props.title || "";
      if (id) index.eventIds.add(id);
      if (id) index.eventIds.add(String(id).replace(/^bfs_arch_/, ""));
      if (sourceUrl || sourceRecordId) {
        index.sourceRecordDateKeys.add([city, sourceUrl, sourceRecordId, sourceDateField, date].map(normalizeText).join("|"));
      }
      if (title && date) index.titleDateKeys.add([city, title, date].map(normalizeText).join("|"));
    }
  }
  return index;
}

function enrichSeed(seed) {
  const src = SOURCES[seed.source];
  if (!src) throw new Error(`Unknown source ${seed.source}`);
  const id = `round214_belfast_${toSlug(seed.key)}`;
  const eventIdSuggestion = `bfs_arch_${id}`;
  const lat = seed.lat;
  const lon = seed.lon;
  const sourceUrl = seed.source_url || src.source_url;
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    id,
    candidate_id: id,
    event_id: id,
    event_id_suggestion: eventIdSuggestion,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: null,
    date_precision: seed.date_precision,
    bucket: "architecture/development/public-realm/official-record",
    event_family: "architecture/official-public-record",
    milestone_type: seed.milestone_type,
    title: seed.title,
    summary: seed.summary,
    observed_change: seed.observed_change,
    area: seed.area,
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    geometry: { type: "Point", coordinates: [lon, lat] },
    geometry_ref: sourceUrl,
    source_id: src.source_id,
    source_ids: [src.source_id],
    source_name: src.source_name,
    source_family: src.source_family,
    publisher: src.publisher,
    source_url: sourceUrl,
    source_record_id: seed.source_record_id,
    source_type: src.source_type,
    license: src.license,
    license_url: src.license_url,
    attribution: src.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.source_date_value,
    confidence: "documented",
    architect: seed.architect || "Source record does not name a project architect.",
    project_type: seed.project_type,
    geometry_source: seed.geometry_source,
    geometry_precision: seed.geometry_precision,
    limitations: [
      seed.milestone_type.includes("commencement") || seed.milestone_type.includes("arrival")
        ? "Source-reported physical or operational milestone only; do not infer completion, final design, occupancy, economic impact, usage, environmental outcome or causation."
        : "Administrative/source-reported milestone only; do not treat as construction start, completion, opening, occupation, delivery outcome, impact evidence or causal evidence.",
      "Point geometry is for atlas navigation and review only; it is not a surveyed boundary, parcel, building footprint, bridge alignment, works extent or legal planning red line.",
      "License and website terms, images, maps, logos and any embedded third-party material should be reviewed before production import."
    ],
    transformation_method: "Round 214 manual official-source deep-tail ETL: official Belfast City Council, committee/minutes and Belfast Harbour pages were searched on the web, screened for Belfast architecture/development/public-realm records from 2008-01-01 through 2026-05-19, weak or duplicate leads were rejected, required provenance fields were normalized, and event_id/source-record-date/title-date duplicate keys were compared with the current corpus, atlas exports and prior Belfast candidate packs.",
    raw_source_hint: seed.raw_source_hint
  };
}

function dedupeCandidates(candidates, index) {
  const accepted = [];
  const rejected = [...MANUAL_REJECTS];
  const seenIds = new Set();
  const seenRecordKeys = new Set();
  const seenTitleKeys = new Set();

  for (const row of candidates) {
    const idKey = row.event_id;
    const sourceRecordKey = [row.city_id, row.source_url, row.source_record_id, row.source_date_field, row.date].map(normalizeText).join("|");
    const titleDateKey = [row.city_id, row.title, row.date].map(normalizeText).join("|");

    let reason = null;
    let category = null;
    if (index.eventIds.has(idKey) || index.eventIds.has(row.event_id_suggestion)) {
      reason = `Event id already indexed: ${idKey}`;
      category = "duplicate_event_id";
    } else if (index.sourceRecordDateKeys.has(sourceRecordKey)) {
      reason = `Source-record/date key already indexed: ${row.source_record_id}`;
      category = "duplicate_source_record_date";
    } else if (index.titleDateKeys.has(titleDateKey)) {
      reason = `Title/date key already indexed: ${row.title}`;
      category = "duplicate_title_date";
    } else if (seenIds.has(idKey) || seenRecordKeys.has(sourceRecordKey) || seenTitleKeys.has(titleDateKey)) {
      reason = "Duplicate within Round214 seed set.";
      category = "duplicate_within_round";
    }

    if (reason) {
      rejected.push({
        key: row.id,
        event_id: row.event_id,
        city_id: row.city_id,
        title: row.title,
        date: row.date,
        source_url: row.source_url,
        source_record_id: row.source_record_id,
        category,
        reason,
        rejected_at: GENERATED_AT
      });
      continue;
    }

    seenIds.add(idKey);
    seenRecordKeys.add(sourceRecordKey);
    seenTitleKeys.add(titleDateKey);
    accepted.push(row);
  }
  return { accepted, rejected };
}

async function fetchSourceAudit(sources) {
  const audit = [];
  for (const src of sources) {
    const started = Date.now();
    let status = null;
    let ok = false;
    let finalUrl = src.source_url;
    let body = "";
    let error = null;
    try {
      const response = await fetch(src.source_url, {
        headers: {
          "user-agent": "Bims-5 Round214 provenance audit (source URL verification; contact via repository)"
        },
        redirect: "follow"
      });
      status = response.status;
      ok = response.ok;
      finalUrl = response.url || src.source_url;
      body = await response.text();
    } catch (err) {
      error = err && err.message ? err.message : String(err);
    }
    audit.push({
      source_id: src.source_id,
      source_name: src.source_name,
      publisher: src.publisher,
      url: src.source_url,
      final_url: finalUrl,
      source_type: src.source_type,
      source_family: src.source_family,
      license: src.license,
      license_url: src.license_url,
      attribution: src.attribution,
      coverage_years: `Selected official Belfast records dated between ${DATE_MIN} and ${DATE_MAX}.`,
      update_frequency: src.update_frequency,
      geographic_scope: src.geographic_scope,
      granularity: src.granularity,
      key_fields: [
        "title",
        "publication, meeting, article or source-reported milestone date",
        "publisher",
        "source URL",
        "source record text",
        "license/attribution"
      ],
      reliability_assessment: src.reliability_assessment,
      required_caveats: [
        "Use as administrative/source-reported evidence only unless the source explicitly documents a physical works or equipment-arrival milestone.",
        "Do not infer completion, occupation, final design, legal planning outcome, usage, regeneration impact, environmental outcome, affordability outcome or causation.",
        "Representative points are not surveyed boundaries, parcels, footprints, routes, bridge alignments or works extents."
      ],
      ingestion_recommendation: ok ? "Candidate-level ingestion after taxonomy and source-family review." : "Review retrieval before ingestion.",
      retrieval: {
        retrieved_at: ACCESSED_AT,
        http_status: status,
        ok,
        elapsed_ms: Date.now() - started,
        content_sha256: body ? sha256(body) : null,
        bytes: body ? Buffer.byteLength(body, "utf8") : 0,
        error
      }
    });
  }
  return audit;
}

function countBy(rows, getKey) {
  return rows.reduce((acc, row) => {
    const key = getKey(row) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function dateRange(rows) {
  if (!rows.length) return { min: null, max: null };
  const dates = rows.map((row) => row.date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildNotes(accepted, rejected, audit) {
  const range = dateRange(accepted);
  const sourceMix = countBy(accepted, (row) => row.source_family);
  const lines = [
    "# Round214 Belfast official deep tail",
    "",
    `Generated: ${GENERATED_AT}`,
    `Accessed: ${ACCESSED_AT}`,
    "",
    "## Accepted",
    "",
    `Accepted candidates: ${accepted.length}`,
    `Date range: ${range.min || "n/a"} to ${range.max || "n/a"}`,
    "",
    "Source mix:",
    ...Object.entries(sourceMix).sort().map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Rejected",
    "",
    `Rejected candidates/leads: ${rejected.length}`,
    ...rejected.map((row) => `- ${row.key || row.event_id}: ${row.category} - ${row.reason}`),
    "",
    "## Caveats",
    "",
    "- Planning approvals, application submissions, committee decisions, acquisition decisions, design-team appointments, strategies, masterplans and funding propositions are administrative records unless the cited source explicitly documents physical work or equipment arrival.",
    "- Physical works-start and equipment-arrival records do not establish completion, final design, operational performance, occupancy, usage, economic impact, environmental outcome or causation.",
    "- Point geometry is approximate or representative review geometry only.",
    "- Belfast Harbour web pages are official publisher evidence, but licensing/terms need production review before redistributing any non-factual content.",
    "",
    "## Retrieval",
    "",
    ...audit.map((row) => `- ${row.source_id}: HTTP ${row.retrieval.http_status || "n/a"} ok=${row.retrieval.ok} bytes=${row.retrieval.bytes}`)
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const indexFiles = collectPriorFiles();
  const index = buildIndex(indexFiles);
  const enriched = SEEDS.map(enrichSeed).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  if (enriched.length > TARGET_CAP) {
    throw new Error(`Seed count ${enriched.length} exceeds target cap ${TARGET_CAP}`);
  }
  const { accepted, rejected } = dedupeCandidates(enriched, index);
  const usedSources = Object.values(SOURCES)
    .filter((src) => accepted.some((row) => row.source_id === src.source_id) || rejected.some((row) => row.source_url === src.source_url))
    .sort((a, b) => a.source_id.localeCompare(b.source_id));
  const audit = await fetchSourceAudit(usedSources);

  const candidateDoc = {
    schema_version: "round214.belfast_official_deep_tail.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    candidate_count: accepted.length,
    source_ids: [...new Set(accepted.map((row) => row.source_id))].sort(),
    source_urls: [...new Set(accepted.map((row) => row.source_url))].sort(),
    deduped_against: index.files.map((row) => row.path),
    scope_note: "Conservative Belfast official deep-tail candidates from Belfast City Council, committee/minutes, and Belfast Harbour sources not already represented by the current corpus or prior Belfast packs.",
    candidates: accepted
  };

  const sourceAuditDoc = {
    schema_version: "round214.belfast_official_deep_tail.source_audit.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    audit
  };

  const summaryDoc = {
    schema_version: "round214.belfast_official_deep_tail.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
    manual_reject_count: MANUAL_REJECTS.length,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: dateRange(accepted),
    counts_by_year: countBy(accepted, (row) => String(row.date).slice(0, 4)),
    counts_by_source_id: countBy(accepted, (row) => row.source_id),
    counts_by_source_name: countBy(accepted, (row) => row.source_name),
    counts_by_source_family: countBy(accepted, (row) => row.source_family),
    counts_by_milestone_type: countBy(accepted, (row) => row.milestone_type),
    source_mix: countBy(accepted, (row) => row.source_family),
    source_audit: {
      audited_source_urls: audit.length,
      retrieved_ok: audit.filter((row) => row.retrieval.ok).length,
      retrieval_failures: audit.filter((row) => !row.retrieval.ok).map((row) => ({
        source_id: row.source_id,
        url: row.url,
        status: row.retrieval.http_status,
        error: row.retrieval.error
      }))
    },
    dedupe: {
      indexed_files: index.files,
      indexed_event_ids: index.eventIds.size,
      indexed_source_record_date_keys: index.sourceRecordDateKeys.size,
      indexed_title_date_keys: index.titleDateKeys.size,
      duplicate_rejects: rejected.filter((row) => String(row.category || "").startsWith("duplicate")).length,
      explicit_duplicate_exclusion_rounds: [
        "tmp/subagents/round177_belfast_official_architecture_expansion/candidates.json",
        "tmp/subagents/round183_belfast_deep_public_realm/candidates.json",
        "tmp/subagents/round189_belfast_deep_committee/candidates.json",
        "tmp/subagents/round195_belfast_deep_tail/candidates.json",
        "tmp/subagents/round201_belfast_final_deep_tail/candidates.json",
        "tmp/subagents/round207_belfast_official_tail_or_discovery/candidates.json"
      ]
    },
    output_files: {
      candidates: path.relative(ROOT, OUTPUTS.candidates).replace(/\\/g, "/"),
      source_audit: path.relative(ROOT, OUTPUTS.sourceAudit).replace(/\\/g, "/"),
      summary: path.relative(ROOT, OUTPUTS.summary).replace(/\\/g, "/"),
      notes: path.relative(ROOT, OUTPUTS.notes).replace(/\\/g, "/"),
      rejected: path.relative(ROOT, OUTPUTS.rejected).replace(/\\/g, "/")
    },
    caveat: "This is a conservative official-source Belfast deep-tail pack. Records are source-backed candidates only and must not be counted as physical completions, construction starts, delivery outcomes, causation, forecasts or impact evidence unless the individual event limitation explicitly supports a narrower physical milestone."
  };

  const rejectedDoc = {
    schema_version: "round214.belfast_official_deep_tail.rejected.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    rejected_count: rejected.length,
    rejected
  };

  writeJson(OUTPUTS.candidates, candidateDoc);
  writeJson(OUTPUTS.sourceAudit, sourceAuditDoc);
  writeJson(OUTPUTS.summary, summaryDoc);
  fs.writeFileSync(OUTPUTS.notes, buildNotes(accepted, rejected, audit), "utf8");
  writeJson(OUTPUTS.rejected, rejectedDoc);

  console.log(JSON.stringify({
    round_id: ROUND_ID,
    accepted: accepted.length,
    rejected: rejected.length,
    date_range: summaryDoc.emitted_date_range,
    source_mix: summaryDoc.source_mix,
    retrieval_ok: summaryDoc.source_audit.retrieved_ok,
    retrieval_count: summaryDoc.source_audit.audited_source_urls,
    output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
