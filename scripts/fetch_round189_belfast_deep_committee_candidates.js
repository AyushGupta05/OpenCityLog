const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round189_belfast_deep_committee");
const GENERATED_AT = "2026-05-19";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-19";
const ROUND = "round189";

const BELFAST_ENVELOPE = {
  latMin: 54.49,
  latMax: 54.70,
  lonMin: -6.08,
  lonMax: -5.76,
};

const OGL = "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party attachments before production import.";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const SOURCES = {
  bccPeaceShared: {
    source_id: "bcc-peace-iv-shared-spaces-round189",
    source_name: "PEACE IV Shared Spaces",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Physical-investment/PEACE-IV-Shared-Spaces",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccShankill: {
    source_id: "bcc-shankill-shared-womens-centre-round189",
    source_name: "£7.8 million shared women's centre at Belfast interface opens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/%C2%A37-8-million-shared-women-s-centre-at-belfast-inte",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccBlackMountainNews: {
    source_id: "bcc-news-black-mountain-shared-space-round189",
    source_name: "£7 million shared community space opens at Belfast interface area",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/%C2%A37-million-shared-community-space-opens-at-Belfast",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccLaganGateway: {
    source_id: "bcc-lagan-gateway-round189",
    source_name: "Lagan Gateway",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Physical-investment/Belfast-Investment-Fund/Lagan-Gateway",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccQueenQuay: {
    source_id: "bcc-news-queens-quay-kiosk-round189",
    source_name: "Local flavours and maritime stories: Queen's Quay Kiosk opens to public on Belfast waterfront",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Local-flavours-and-maritime-stories-Queen-s-Quay-K",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccSugarhouse: {
    source_id: "bcc-news-sugarhouse-entry-round189",
    source_name: "Belfast's historic Sugarhouse Entry reopened after more than half a century",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/belfast-s-historic-sugarhouse-entry-reopened-after",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccLeisureOlympia: {
    source_id: "bcc-olympia-regeneration-round189",
    source_name: "Olympia Leisure Centre regeneration",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Transforming-leisure-services/Olympia-regeneration",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccLeisureLisnasharragh: {
    source_id: "bcc-lisnasharragh-regeneration-round189",
    source_name: "Lisnasharragh Leisure Centre regeneration",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/business-and-investment/transforming-leisure-services/lisnasharragh-leisure-centre-regeneration",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccLeisureBrook: {
    source_id: "bcc-brook-regeneration-round189",
    source_name: "Brook Leisure Centre regeneration",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Transforming-leisure-services/Brook-regeneration",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccLeisureBrookNews: {
    source_id: "bcc-news-brook-opened-round189",
    source_name: "New Brook leisure centre officially opened",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/new-brook-leisure-centre-officially-opened",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccLeisureAvoniel: {
    source_id: "bcc-avoniel-regeneration-round189",
    source_name: "Avoniel Leisure Centre regeneration",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Transforming-leisure-services/Avoniel-regeneration",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccTemplemore: {
    source_id: "bcc-templemore-baths-restoration-round189",
    source_name: "Templemore Baths restoration",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/business-and-investment/transforming-leisure-services/templemore-baths-restoration",
    source_type: "official council project/status page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccSandyRow: {
    source_id: "bcc-news-sandy-row-arts-digital-hub-round189",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC news pages",
  },
  bccPerformanceSelf: {
    source_id: "bcc-performance-self-assessment-2024-2025-round189",
    source_name: "Belfast City Council Performance Improvement Plan self-assessment report 2024-2025 - Self-assessment of improvement objectives",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/documents/performance-improvement-plan-self-assessment-repor/self-assessment-of-improvement-objectives",
    source_type: "official council performance report page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccPerformanceCorporate: {
    source_id: "bcc-corporate-performance-2024-2025-round189",
    source_name: "Belfast City Council Performance Improvement Plan self-assessment report 2024-2025 - Corporate performance 2024-2025",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/documents/performance-improvement-plan-self-assessment-repor/corporate-performance-2024-2025",
    source_type: "official council performance report page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC project/status pages",
  },
  bccSprAssets2024: {
    source_id: "bcc-spr-assets-report-2024-11-22-round189",
    source_name: "Strategic Policy and Resources Committee agenda: 22 November 2024",
    publisher: "Belfast City Council",
    source_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=163&MID=11635",
    source_type: "official council committee minute / report page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC committee/minutes/report pages",
  },
  bccWaterfrontTask: {
    source_id: "bcc-waterfront-task-group-2025-round189",
    source_name: "Belfast Waterfront Task Group Update",
    publisher: "Belfast City Council",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=84934",
    source_type: "official council committee minute / report page",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council.",
    source_family: "BCC committee/minutes/report pages",
  },
  dfcBsa5: {
    source_id: "dfc-belfast-streets-ahead-5-blackstaff-screening-round189",
    source_name: "Belfast Streets Ahead 5 - Phase 1: Blackstaff Square Area - screening",
    publisher: "Department for Communities",
    source_url: "https://www.communities-ni.gov.uk/publications/belfast-streets-ahead-5-phase-1-blackstaff-square-area-screening",
    source_type: "official department public realm screening publication",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities.",
    source_family: "DfC public realm/Streets Ahead pages",
  },
  dfcFiveCs: {
    source_id: "dfc-five-cs-public-realm-accessibility-round189",
    source_name: "Five Cs Public Realm Project - Accessibility & Inclusion Report",
    publisher: "Department for Communities",
    source_url: "https://www.communities-ni.gov.uk/publications/five-cs-public-realm-project-accessibility-inclusion-report",
    source_type: "official department public realm accessibility publication",
    license: OGL,
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities.",
    source_family: "DfC public realm/Streets Ahead pages",
  },
};

const SEEDS = [
  {
    slug: "shankill-shared-womens-centre-opened-2024",
    source: "bccShankill",
    date: "2024-06",
    date_precision: "month",
    title: "Shankill Shared Women's Centre opened near Lanark Way",
    summary: "Belfast City Council's project page records that the purpose-built shared women's centre near Lanark Way opened in June 2024.",
    observed_change: "Official council project page records an opening month for a named shared-space building.",
    area: "Lanark Way, Belfast",
    lat: 54.6045,
    lon: -5.9592,
    milestone_type: "community_facility_opening_reported",
    project_type: "shared community facility",
    source_record_id: "Current status: building opened in June 2024",
    source_date_field: "project page current status",
    confidence: "documented",
  },
  {
    slug: "black-mountain-shared-space-opened-2024",
    source: "bccBlackMountainNews",
    date: "2024-09-18",
    date_precision: "day",
    title: "Black Mountain Shared Space was officially opened",
    summary: "Belfast City Council reported the official opening of a new shared community building at the former Finlay's factory site on Ballygomartin Road.",
    observed_change: "Official council news page records an opening event for a named community facility.",
    area: "Ballygomartin Road, Belfast",
    lat: 54.611,
    lon: -5.985,
    milestone_type: "community_facility_opening_reported",
    project_type: "shared community facility",
    source_record_id: "News date 18 September 2024: £7 million shared community space opens",
    source_date_field: "news publication/opening date",
    confidence: "documented",
  },
  {
    slug: "lagan-gateway-phase-one-complete-2021",
    source: "bccLaganGateway",
    date: "2021-10",
    date_precision: "season",
    title: "Lagan Gateway phase one was recorded complete",
    summary: "Belfast City Council's Lagan Gateway page states that phase one, including the foot and cycle bridge, lock, weir refurbishment, landscaping and path connections, was completed in autumn 2021.",
    observed_change: "Official council project page records completion of phase one physical works. The season date is approximate.",
    area: "Stranmillis and Annadale Embankment, Belfast",
    lat: 54.5629,
    lon: -5.9257,
    milestone_type: "greenway_bridge_phase_completion_reported",
    project_type: "bridge, navigation lock and public realm",
    source_record_id: "Timescales: first phase completed in autumn 2021",
    source_date_field: "project page timescales",
    confidence: "documented",
  },
  {
    slug: "lagan-gateway-phase-two-planning-submitted-2024",
    source: "bccLaganGateway",
    date: "2024-05",
    date_precision: "month",
    title: "Lagan Gateway phase two planning application was recorded as submitted",
    summary: "The Lagan Gateway page records that phase two design was completed and a planning application for the greenway connection to Belvoir Forest Park was submitted in May 2024.",
    observed_change: "Official council project page records an administrative planning milestone, not construction or opening.",
    area: "Lagan Lands East to Belvoir Forest Park, Belfast",
    lat: 54.5485,
    lon: -5.9202,
    milestone_type: "greenway_planning_application_submitted",
    project_type: "greenway connection",
    source_record_id: "Phase two: design completed and planning application submitted in May 2024",
    source_date_field: "project page phase two status",
    confidence: "documented",
  },
  {
    slug: "queens-quay-kiosk-opened-2024",
    source: "bccQueenQuay",
    date: "2024-12-10",
    date_precision: "day",
    title: "Queen's Quay Kiosk opened to the public",
    summary: "Belfast City Council reported the opening of Queen's Quay Kiosk on the waterfront, between the Odyssey Arena and the Lagan Weir pedestrian bridge.",
    observed_change: "Official council news page records an opening event and named public-realm kiosk.",
    area: "Queen's Quay, Belfast waterfront",
    lat: 54.6045,
    lon: -5.9146,
    milestone_type: "public_realm_kiosk_opening_reported",
    project_type: "waterfront public realm kiosk",
    source_record_id: "News date 10 December 2024: Queen's Quay Kiosk opens",
    source_date_field: "news publication/opening date",
    confidence: "documented",
  },
  {
    slug: "sugarhouse-entry-reopened-2024",
    source: "bccSugarhouse",
    date: "2024-08-05",
    date_precision: "day",
    title: "Sugarhouse Entry reopened to the public",
    summary: "Belfast City Council reported that Sugarhouse Entry reopened after cleansing, repair work, repainting, new paving and interpretive signage.",
    observed_change: "Official council news page records a reopening of a named historic city-centre entry.",
    area: "Sugarhouse Entry, Belfast",
    lat: 54.601,
    lon: -5.9252,
    milestone_type: "historic_entry_reopening_reported",
    project_type: "historic entry public realm",
    source_record_id: "News date 5 August 2024: Sugarhouse Entry reopened",
    source_date_field: "news publication/reopening date",
    confidence: "documented",
  },
  {
    slug: "college-street-mews-regenerated-2024",
    source: "bccSugarhouse",
    date: "2024-08-05",
    date_precision: "day",
    title: "College Street Mews was listed among phase two regenerated entries",
    summary: "The Sugarhouse Entry reopening report lists College Street Mews among the phase two entries regenerated through the Entries programme.",
    observed_change: "Official council news page records a named entry in a completed phase two public-realm programme. The date is the report date for the phase list.",
    area: "College Street Mews, Belfast",
    lat: 54.5968,
    lon: -5.9332,
    milestone_type: "historic_entry_regeneration_reported",
    project_type: "historic entry public realm",
    source_record_id: "Phase two of the programme has regenerated: College Street Mews",
    source_date_field: "news report date for phase two list",
    confidence: "documented",
  },
  {
    slug: "high-street-entry-regenerated-2024",
    source: "bccSugarhouse",
    date: "2024-08-05",
    date_precision: "day",
    title: "High Street Entry was listed among phase two regenerated entries",
    summary: "The Sugarhouse Entry reopening report lists High Street Entry among the phase two entries regenerated through the Entries programme.",
    observed_change: "Official council news page records a named entry in a completed phase two public-realm programme. The date is the report date for the phase list.",
    area: "High Street Entry, Belfast",
    lat: 54.6009,
    lon: -5.9259,
    milestone_type: "historic_entry_regeneration_reported",
    project_type: "historic entry public realm",
    source_record_id: "Phase two of the programme has regenerated: High Street Entry",
    source_date_field: "news report date for phase two list",
    confidence: "documented",
  },
  {
    slug: "pattersons-place-regenerated-2024",
    source: "bccSugarhouse",
    date: "2024-08-05",
    date_precision: "day",
    title: "Patterson's Place was listed among phase two regenerated entries",
    summary: "The Sugarhouse Entry reopening report lists Patterson's Place among the phase two entries regenerated through the Entries programme.",
    observed_change: "Official council news page records a named entry in a completed phase two public-realm programme. The date is the report date for the phase list.",
    area: "Patterson's Place, Belfast",
    lat: 54.6012,
    lon: -5.9265,
    milestone_type: "historic_entry_regeneration_reported",
    project_type: "historic entry public realm",
    source_record_id: "Phase two of the programme has regenerated: Patterson's Place",
    source_date_field: "news report date for phase two list",
    confidence: "documented",
  },
  {
    slug: "olympia-leisure-centre-opened-2017",
    source: "bccLeisureOlympia",
    date: "2017-01",
    date_precision: "month",
    title: "Olympia Leisure Centre opened after regeneration",
    summary: "Belfast City Council's Olympia regeneration page records that Olympia Leisure Centre opened in January 2017.",
    observed_change: "Official council project page records an opening month for a leisure facility.",
    area: "Olympia Leisure Centre, Belfast",
    lat: 54.5837,
    lon: -5.9551,
    milestone_type: "leisure_facility_opening_reported",
    project_type: "leisure centre regeneration",
    source_record_id: "Overview: Olympia Leisure Centre opened in January 2017",
    source_date_field: "project page overview",
    confidence: "documented",
  },
  {
    slug: "olympia-external-facilities-completed-2018",
    source: "bccLeisureOlympia",
    date: "2018-06",
    date_precision: "month",
    title: "Olympia external sports and leisure facilities were completed",
    summary: "The Olympia regeneration page records that external sports and leisure facilities followed the centre opening and were completed in June 2018.",
    observed_change: "Official council project page records completion month for external leisure/public-realm facilities.",
    area: "Olympia Leisure Centre, Belfast",
    lat: 54.5833,
    lon: -5.9555,
    milestone_type: "external_leisure_facilities_completion_reported",
    project_type: "external sports, play and public realm",
    source_record_id: "Overview: external sports and leisure facilities completed in June 2018",
    source_date_field: "project page overview",
    confidence: "documented",
  },
  {
    slug: "lisnasharragh-leisure-centre-opened-2019",
    source: "bccLeisureLisnasharragh",
    date: "2019-12",
    date_precision: "month",
    title: "Lisnasharragh Leisure Centre opened",
    summary: "Belfast City Council's Lisnasharragh regeneration page records that the centre opened in December 2019.",
    observed_change: "Official council project page records an opening month for a leisure facility.",
    area: "Lisnasharragh Leisure Centre, Montgomery Road",
    lat: 54.568,
    lon: -5.867,
    milestone_type: "leisure_facility_opening_reported",
    project_type: "leisure centre regeneration",
    source_record_id: "Overview: centre opened in December 2019",
    source_date_field: "project page overview",
    confidence: "documented",
  },
  {
    slug: "brook-leisure-centre-opened-2019",
    source: "bccLeisureBrook",
    date: "2019-12",
    date_precision: "month",
    title: "Brook Leisure Centre opened after regeneration",
    summary: "Belfast City Council's Brook regeneration page records that the new centre opened in December 2019.",
    observed_change: "Official council project page records an opening month for a leisure facility.",
    area: "Brook Leisure Centre, Belfast",
    lat: 54.568,
    lon: -6.002,
    milestone_type: "leisure_facility_opening_reported",
    project_type: "leisure centre regeneration",
    source_record_id: "Overview: new centre opened in December 2019",
    source_date_field: "project page overview",
    confidence: "documented",
  },
  {
    slug: "brook-leisure-centre-officially-opened-2020",
    source: "bccLeisureBrookNews",
    date: "2020-01-17",
    date_precision: "day",
    title: "Brook Leisure Centre was officially opened",
    summary: "Belfast City Council reported the official opening of the new Brook Leisure Centre on 17 January 2020.",
    observed_change: "Official council news page records a ceremonial opening. It may duplicate the project page's December 2019 operational opening.",
    area: "Brook Leisure Centre, Belfast",
    lat: 54.568,
    lon: -6.002,
    milestone_type: "leisure_facility_official_opening_reported",
    project_type: "leisure centre regeneration",
    source_record_id: "News date 17 January 2020: officially opened",
    source_date_field: "news publication/opening date",
    confidence: "documented",
  },
  {
    slug: "avoniel-leisure-centre-opened-2021",
    source: "bccLeisureAvoniel",
    date: "2021-11",
    date_precision: "month",
    title: "Avoniel Leisure Centre opened after redevelopment",
    summary: "Belfast City Council's Avoniel regeneration page records that the new Avoniel opened in November 2021.",
    observed_change: "Official council project page records an opening month for a leisure facility.",
    area: "Avoniel Leisure Centre, Belfast",
    lat: 54.6004,
    lon: -5.8813,
    milestone_type: "leisure_facility_opening_reported",
    project_type: "leisure centre regeneration",
    source_record_id: "Current status: new Avoniel opened in November 2021",
    source_date_field: "project page current status",
    confidence: "documented",
  },
  {
    slug: "templemore-baths-reopened-2023",
    source: "bccTemplemore",
    date: "2023-06",
    date_precision: "month",
    title: "Templemore Baths redevelopment was recorded complete and open",
    summary: "Belfast City Council's Templemore Baths restoration page records the redevelopment and expansion as complete and the centre as open.",
    observed_change: "Official council project page records completion/open status for a restored and extended leisure and heritage facility. The month is from related council reopening material.",
    area: "Templemore Baths, Belfast",
    lat: 54.5993,
    lon: -5.8894,
    milestone_type: "heritage_leisure_facility_reopening_reported",
    project_type: "heritage restoration and leisure extension",
    source_record_id: "Overview: redevelopment and expansion complete and centre open",
    source_date_field: "project page status; associated reopening month",
    confidence: "documented",
  },
  {
    slug: "coffee-culture-sandy-row-work-underway-2026",
    source: "bccSandyRow",
    date: "2026-02-18",
    date_precision: "day",
    title: "Coffee Culture work was reported underway in Sandy Row",
    summary: "Belfast City Council's Sandy Row Arts & Digital Hub news page reported that work was underway on Coffee Culture, a project to transform a vacant building into a cafe and barista training centre.",
    observed_change: "Official council news page records a works-underway milestone, not completion or opening.",
    area: "Sandy Row, Belfast",
    lat: 54.589,
    lon: -5.934,
    milestone_type: "community_facility_works_underway_reported",
    project_type: "vacant building reuse",
    source_record_id: "News date 18 February 2026: work getting underway on Coffee Culture",
    source_date_field: "news publication date and text",
    confidence: "documented",
  },
  {
    slug: "bentham-drive-sensory-play-equipment-plan-2026",
    source: "bccSandyRow",
    date: "2026-02-18",
    date_precision: "day",
    title: "Bentham Drive play park sensory equipment plan was reported",
    summary: "Belfast City Council's Sandy Row Arts & Digital Hub news page reported plans to add new sensory equipment to Bentham Drive play park.",
    observed_change: "Official council news page records a planned play-equipment milestone, not installation completion.",
    area: "Bentham Drive play park, Belfast",
    lat: 54.5908,
    lon: -5.9382,
    milestone_type: "playground_improvement_plan_reported",
    project_type: "playground accessibility improvement",
    source_record_id: "News date 18 February 2026: plans to add new sensory equipment to Bentham Drive play park",
    source_date_field: "news publication date and text",
    confidence: "documented",
  },
  {
    slug: "rory-gallagher-statue-agreement-2024",
    source: "bccSprAssets2024",
    date: "2024-11-22",
    date_precision: "day",
    title: "Ulster Hall Rory Gallagher statue agreement was approved",
    summary: "Belfast City Council Strategic Policy and Resources Committee minutes record approval of an agreement for gifting and installing a Rory Gallagher statue at Ulster Hall.",
    observed_change: "Official committee minute records an administrative approval for a public-art installation, not installation completion.",
    area: "Ulster Hall, Bedford Street",
    lat: 54.5946,
    lon: -5.9313,
    milestone_type: "public_art_installation_agreement_approved",
    project_type: "public art / listed-building setting",
    source_record_id: "SP&R Committee 22 November 2024: Ulster Hall - Agreement for Rory Gallagher Statue",
    source_date_field: "committee meeting date",
    confidence: "documented",
  },
  {
    slug: "upper-ardoyne-youth-centre-agreement-2024",
    source: "bccSprAssets2024",
    date: "2024-11-22",
    date_precision: "day",
    title: "Upper Ardoyne Youth Centre use agreement was approved",
    summary: "Belfast City Council Strategic Policy and Resources Committee minutes record approval of a short-term licence and later lease pathway for Streetbeat Youth Project at Upper Ardoyne Youth Centre.",
    observed_change: "Official committee minute records an administrative property-use milestone, not physical works.",
    area: "Upper Ardoyne Youth Centre, Belfast",
    lat: 54.625,
    lon: -5.958,
    milestone_type: "community_facility_property_agreement_approved",
    project_type: "community facility property agreement",
    source_record_id: "SP&R Committee 22 November 2024: Upper Ardoyne Youth Centre - Agreements",
    source_date_field: "committee meeting date",
    confidence: "documented",
  },
  {
    slug: "belfast-streets-ahead-5-blackstaff-screening-2024",
    source: "dfcBsa5",
    date: "2024-11-06",
    date_precision: "day",
    title: "Belfast Streets Ahead 5 Blackstaff Square screening was published",
    summary: "The Department for Communities published screening material for Belfast Streets Ahead 5 Phase 1 in the Blackstaff Square area.",
    observed_change: "Official department page records a public-realm programme screening publication, not construction.",
    area: "Blackstaff Square, Belfast",
    lat: 54.5962,
    lon: -5.9307,
    milestone_type: "public_realm_screening_publication",
    project_type: "public realm programme",
    source_record_id: "Date published: 6 November 2024",
    source_date_field: "publication date",
    confidence: "documented",
  },
  {
    slug: "five-cs-public-realm-accessibility-report-2024",
    source: "dfcFiveCs",
    date: "2024-10-02",
    date_precision: "day",
    title: "Five Cs Public Realm accessibility report was published",
    summary: "The Department for Communities published an Accessibility and Inclusion Report for the Five Cs Public Realm Project.",
    observed_change: "Official department page records a public-realm report publication, not construction.",
    area: "Five Cs public realm project area, Belfast city centre",
    lat: 54.6007,
    lon: -5.9292,
    milestone_type: "public_realm_accessibility_report_publication",
    project_type: "public realm programme",
    source_record_id: "Date published: 2 October 2024",
    source_date_field: "publication date",
    confidence: "documented",
  },
  {
    slug: "active-travel-covered-cycle-stands-marrowbone-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Covered cycle stands at Marrowbone were listed among delivered physical works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists Active Travel covered cycle stands at Marrowbone among delivered projects.",
    observed_change: "Official performance report records a completed/delivered physical-programme item during 2024-2025. The exact installation date is not stated.",
    area: "Marrowbone, Belfast",
    lat: 54.617,
    lon: -5.954,
    milestone_type: "active_travel_stands_delivery_reported",
    project_type: "active travel facility",
    source_record_id: "Corporate performance 2024-2025: Active Travel covered cycle stands at Marrowbone and Lockkeepers",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "active-travel-covered-cycle-stands-lockkeepers-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Covered cycle stands at Lockkeepers were listed among delivered physical works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists Active Travel covered cycle stands at Lockkeepers among delivered projects.",
    observed_change: "Official performance report records a completed/delivered physical-programme item during 2024-2025. The exact installation date is not stated.",
    area: "Lockkeepers, Belfast",
    lat: 54.543,
    lon: -5.929,
    milestone_type: "active_travel_stands_delivery_reported",
    project_type: "active travel facility",
    source_record_id: "Corporate performance 2024-2025: Active Travel covered cycle stands at Marrowbone and Lockkeepers",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "upsurge-botanic-gardens-research-garden-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "UPSURGE community research garden at Botanic Gardens was listed among delivered works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists a community research garden as part of the UPSURGE project at Botanic Gardens.",
    observed_change: "Official performance report records a delivered physical-programme item during 2024-2025. The exact installation date is not stated.",
    area: "Botanic Gardens, Belfast",
    lat: 54.583,
    lon: -5.934,
    milestone_type: "community_research_garden_delivery_reported",
    project_type: "park/community research garden",
    source_record_id: "Corporate performance 2024-2025: community research garden as part of UPSURGE at Botanic Gardens",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "henry-jones-playing-fields-pitch-investment-2025",
    source: "bccPerformanceSelf",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Henry Jones Playing Fields pitch investment was listed among completed physical projects",
    summary: "Belfast City Council's 2024-2025 self-assessment lists Sporting Pitches Investment at Henry Jones Playing Fields among physical programme projects completed in the year.",
    observed_change: "Official performance report records a completed physical-programme item during 2024-2025. The exact completion date is not stated.",
    area: "Henry Jones Playing Fields, Belfast",
    lat: 54.638,
    lon: -5.936,
    milestone_type: "sports_pitch_investment_completion_reported",
    project_type: "sports pitches",
    source_record_id: "Self-assessment 2024-2025: Sporting Pitches Investment - Henry Jones Playing Fields",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "belvoir-activity-centre-muga-2025",
    source: "bccPerformanceSelf",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Belvoir Activity Centre MUGA was listed among completed physical projects",
    summary: "Belfast City Council's 2024-2025 self-assessment lists Belvoir Activity Centre MUGA among physical programme projects completed in the year.",
    observed_change: "Official performance report records a completed physical-programme item during 2024-2025. The exact completion date is not stated.",
    area: "Belvoir Activity Centre, Belfast",
    lat: 54.542,
    lon: -5.912,
    milestone_type: "muga_completion_reported",
    project_type: "multi-use games area",
    source_record_id: "Self-assessment 2024-2025: Belvoir Activity Centre MUGA",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "hosford-community-homes-inclusion-hub-2025",
    source: "bccPerformanceSelf",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Hosford Community Homes Inclusion Hub was listed among completed physical projects",
    summary: "Belfast City Council's 2024-2025 self-assessment lists Hosford Community Homes Inclusion Hub among physical programme projects completed in the year.",
    observed_change: "Official performance report records a completed physical-programme item during 2024-2025. The exact completion date is not stated.",
    area: "Hosford Community Homes, Belfast",
    lat: 54.5902,
    lon: -5.9143,
    milestone_type: "community_inclusion_hub_completion_reported",
    project_type: "community inclusion hub",
    source_record_id: "Self-assessment 2024-2025: Hosford Community Homes Inclusion Hub",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "customer-hub-cecil-ward-building-improvements-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Cecil Ward Building Customer Hub improvements were listed among delivered works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists improvements to Customer Hub facilities at Cecil Ward Building.",
    observed_change: "Official performance report records a delivered facilities improvement during 2024-2025. The exact completion date is not stated.",
    area: "Cecil Ward Building, Belfast",
    lat: 54.5952,
    lon: -5.9296,
    milestone_type: "public_service_facility_improvement_reported",
    project_type: "customer hub facility improvement",
    source_record_id: "Corporate performance 2024-2025: improvements to Customer Hub facilities at Cecil Ward Building",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "alexandra-park-recycling-facility-improvements-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Alexandra Park recycling facility improvements were listed among delivered works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists improvements at household waste recycling facilities including Alexandra Park.",
    observed_change: "Official performance report records delivered facility improvements during 2024-2025. The exact completion date is not stated.",
    area: "Alexandra Park, Belfast",
    lat: 54.614,
    lon: -5.933,
    milestone_type: "waste_facility_improvement_reported",
    project_type: "household waste recycling facility improvement",
    source_record_id: "Corporate performance 2024-2025: improvements at household waste recycling facilities including Alexandra Park and Ormeau",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "ormeau-recycling-facility-improvements-2025",
    source: "bccPerformanceCorporate",
    date: "2025-03-31",
    date_precision: "year_end",
    title: "Ormeau recycling facility improvements were listed among delivered works",
    summary: "Belfast City Council's 2024-2025 corporate performance page lists improvements at household waste recycling facilities including Ormeau.",
    observed_change: "Official performance report records delivered facility improvements during 2024-2025. The exact completion date is not stated.",
    area: "Ormeau, Belfast",
    lat: 54.579,
    lon: -5.923,
    milestone_type: "waste_facility_improvement_reported",
    project_type: "household waste recycling facility improvement",
    source_record_id: "Corporate performance 2024-2025: improvements at household waste recycling facilities including Alexandra Park and Ormeau",
    source_date_field: "2024-2025 reporting period",
    confidence: "documented",
  },
  {
    slug: "queens-quay-kiosk-waterfront-task-group-2025",
    source: "bccWaterfrontTask",
    date: "2025-10-08",
    date_precision: "day",
    title: "Queen's Quay Kiosk was reported as a recent waterfront addition",
    summary: "The Belfast Waterfront Task Group update records Queen's Quay Kiosk as a recent addition to the Maritime Mile with planting and seating around the kiosk.",
    observed_change: "Official committee report records a status/update milestone. It duplicates the December 2024 opening source and should be treated as a later status note.",
    area: "Queen's Quay, Belfast waterfront",
    lat: 54.6045,
    lon: -5.9146,
    milestone_type: "public_realm_kiosk_status_update",
    project_type: "waterfront public realm kiosk",
    source_record_id: "Waterfront Task Group update: recent addition of Queen's Quay Kiosk",
    source_date_field: "committee report date",
    confidence: "documented",
  },
];

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function idFromSlug(slug) {
  return `${ROUND}_belfast_${slug.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function yearOf(date) {
  const match = String(date).match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function comparableDate(date) {
  const text = String(date || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  return text;
}

function inDateWindow(date) {
  const d = comparableDate(date);
  return d >= DATE_MIN && d <= DATE_MAX;
}

function inBelfast(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= BELFAST_ENVELOPE.latMin &&
    lat <= BELFAST_ENVELOPE.latMax &&
    lon >= BELFAST_ENVELOPE.lonMin &&
    lon <= BELFAST_ENVELOPE.lonMax
  );
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function recordsFromJson(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.candidates)) return json.candidates;
  if (Array.isArray(json.events)) return json.events;
  if (Array.isArray(json.features)) {
    return json.features.map((feature) => ({
      ...(feature.properties || {}),
      geometry: feature.geometry,
    }));
  }
  return [];
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function getRecordDate(record) {
  return record.date || record.effective_date || record.source_date_value || record.year || "";
}

function buildExistingIndex() {
  const files = [];
  const add = (kind, filePath) => {
    if (fs.existsSync(filePath)) files.push({ kind, path: filePath });
  };

  add("corpus", path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json"));
  add("atlas", path.join(ROOT, "web", "data", "city-atlas", "cities", "belfast", "events.json"));
  for (const filePath of walkFiles(path.join(ROOT, "web", "data", "city-atlas", "cities", "belfast"))) {
    if (/events(_\d{4})?\.json$/.test(path.basename(filePath))) add("atlas_chunk", filePath);
  }
  for (const filePath of walkFiles(path.join(ROOT, "tmp", "subagents"))) {
    if (filePath.includes(`round189_belfast_deep_committee${path.sep}`)) continue;
    if (!/belfast/i.test(filePath)) continue;
    if (!/(candidate|candidates|events)\.json$/i.test(path.basename(filePath))) continue;
    add("prior_belfast_pack", filePath);
  }

  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  const sourceRecordKeys = new Set();
  const indexedFiles = [];

  for (const item of files) {
    const json = readJsonIfExists(item.path);
    const records = recordsFromJson(json);
    if (!records.length) continue;
    indexedFiles.push({
      kind: item.kind,
      path: path.relative(ROOT, item.path).replace(/\\/g, "/"),
      record_count: records.length,
    });
    for (const record of records) {
      const city = String(record.city_id || record.city || "").toLowerCase();
      const maybeBelfast = city === "belfast" || /belfast/i.test(record.event_id || record.candidate_id || record.source_url || item.path);
      if (!maybeBelfast) continue;
      if (record.event_id) eventIds.add(String(record.event_id));
      if (record.candidate_id) eventIds.add(String(record.candidate_id));
      const date = getRecordDate(record);
      const sourceUrl = record.source_url || record.url || "";
      const sourceRecordId = record.source_record_id || record.record_id || "";
      if (sourceUrl && date) sourceDateKeys.add(`${norm(sourceUrl)}|${date}`);
      if (sourceRecordId && date) sourceRecordKeys.add(`${norm(sourceRecordId)}|${date}`);
      const title = record.title || record.name || record.summary || "";
      if (title && date) titleDateKeys.add(`${norm(title)}|${date}`);
    }
  }

  return { eventIds, sourceDateKeys, titleDateKeys, sourceRecordKeys, indexedFiles };
}

function duplicateReason(candidate, index, acceptedKeys) {
  if (index.eventIds.has(candidate.event_id)) return "duplicate_event_id_existing";
  if (acceptedKeys.eventIds.has(candidate.event_id)) return "duplicate_event_id_within_round";
  const sourceRecordKey = `${norm(candidate.source_record_id)}|${candidate.date}`;
  if (index.sourceRecordKeys.has(sourceRecordKey)) return "duplicate_source_record_date_existing";
  if (acceptedKeys.sourceRecordKeys.has(sourceRecordKey)) return "duplicate_source_record_date_within_round";
  const titleDateKey = `${norm(candidate.title)}|${candidate.date}`;
  if (index.titleDateKeys.has(titleDateKey)) return "duplicate_title_date_existing";
  if (acceptedKeys.titleDateKeys.has(titleDateKey)) return "duplicate_title_date_within_round";
  return null;
}

function makeCandidate(seed) {
  const source = SOURCES[seed.source];
  const eventId = idFromSlug(seed.slug);
  const limitations = [
    seed.date_precision === "year_end"
      ? "Source gives a 2024-2025 reporting-period completion/delivery statement; exact effective date should be checked before production import."
      : "Date is taken from the source page or source-reported milestone; verify against primary attachments before production import.",
    seed.milestone_type.includes("planning") || seed.milestone_type.includes("agreement") || seed.milestone_type.includes("publication") || seed.milestone_type.includes("plan") || seed.milestone_type.includes("underway")
      ? "Administrative, planned, publication or works-underway milestone only; do not count as a physical completion."
      : "Observed/source-reported built-environment milestone only; no outcome, causation or usage claim is made.",
    "Point geometry is approximate review geometry for the named site or project area, not surveyed asset geometry.",
  ];
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: eventId,
    event_id: eventId,
    event_id_suggestion: `bfs_arch_${eventId}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: seed.date_precision === "year_end" ? { start: "2024-04-01", end: "2025-03-31" } : null,
    date_precision: seed.date_precision,
    bucket: "planning/development/architecture/public-realm/community-facilities",
    event_family: "architecture/official-public-record",
    milestone_type: seed.milestone_type,
    title: seed.title,
    summary: seed.summary,
    observed_change: seed.observed_change,
    area: seed.area,
    lat: seed.lat,
    lon: seed.lon,
    latitude: seed.lat,
    longitude: seed.lon,
    geometry: { type: "Point", coordinates: [seed.lon, seed.lat] },
    geometry_ref: source.source_url,
    source_id: source.source_id,
    source_ids: [source.source_id],
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_record_id: seed.source_record_id,
    source_type: source.source_type,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    accessed_at: GENERATED_AT,
    retrieved_at: GENERATED_AT,
    source_retrieved_at: GENERATED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.date,
    confidence: seed.confidence,
    architect: seed.architect || "Source record does not name a project architect.",
    project_type: seed.project_type,
    geometry_source: "Approximate point manually assigned from named Belfast site/project area for candidate review.",
    geometry_precision: "approximate_site_or_project_area",
    limitations,
    transformation_method: "Round 189 manual source-family review: official/public Belfast pages were converted to candidate event records, required provenance fields were normalized, Belfast envelope/date-window checks were applied, and event_id/source-date/source-record/title-date duplicate keys were compared with the current corpus and prior Belfast candidate packs including rounds 177 and 183.",
    raw_source_hint: seed.source_record_id,
  };
}

async function fetchSourceAudit(sourceIds) {
  const keep = new Set(sourceIds);
  const uniqueSources = Object.values(SOURCES).filter((source) => keep.has(source.source_id));
  const audit = [];
  for (const source of uniqueSources) {
    const started = Date.now();
    let status = null;
    let ok = false;
    let finalUrl = source.source_url;
    let error = null;
    let contentHash = null;
    try {
      const response = await fetch(source.source_url, {
        redirect: "follow",
        headers: { "user-agent": "Bims-5 round189 provenance candidate auditor" },
      });
      status = response.status;
      ok = response.ok;
      finalUrl = response.url || finalUrl;
      const text = await response.text();
      contentHash = crypto.createHash("sha256").update(text).digest("hex");
    } catch (err) {
      error = String(err && err.message ? err.message : err);
    }
    audit.push({
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      url: source.source_url,
      final_url: finalUrl,
      source_type: source.source_type,
      source_family: source.source_family,
      license: source.license,
      attribution: source.attribution,
      coverage_years: "Source-specific Belfast project, committee, news, or public realm records within 2008-01-01 to 2026-05-19 where a dated milestone is present.",
      update_frequency: source.source_type.includes("news") || source.source_type.includes("committee") ? "Published record; not continuously updated except corrections." : "Project/status page; may be updated by publisher.",
      geographic_scope: "Belfast named site or city-centre public realm area.",
      key_fields: ["source page title", "publication/status date", "named place/project", "publisher", "source URL", "licence/attribution"],
      reliability_assessment: ok ? "usable with caveats" : "risky",
      required_caveats: [
        "Use source-reported dates as administrative or observed milestone dates only.",
        "Approximate candidate geometry must be reviewed before production import.",
        "Do not infer causation, impacts, usage or construction completion from planning, funding, screening or works-underway records.",
      ],
      ingestion_recommendation: ok ? "Candidate-level ingestion after duplicate and geometry review." : "Hold until source URL can be retrieved and checked.",
      retrieval: {
        retrieved_at: GENERATED_AT,
        http_status: status,
        ok,
        elapsed_ms: Date.now() - started,
        content_sha256: contentHash,
        error,
      },
    });
  }
  return audit;
}

function validateCandidate(candidate) {
  const missing = [];
  for (const field of [
    "event_id",
    "title",
    "summary",
    "date",
    "date_precision",
    "city_id",
    "lat",
    "lon",
    "source_url",
    "source_record_id",
    "source_ids",
    "source_name",
    "publisher",
    "source_type",
    "license",
    "attribution",
    "retrieved_at",
    "confidence",
    "limitations",
    "transformation_method",
  ]) {
    if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "" || (Array.isArray(candidate[field]) && !candidate[field].length)) missing.push(field);
  }
  if (candidate.city_id !== "belfast") missing.push("city_id=belfast");
  if (!inDateWindow(candidate.date)) missing.push("date_window");
  if (!inBelfast(candidate.lat, candidate.lon)) missing.push("belfast_envelope");
  if (!["documented", "corroborated", "inferred", "disputed"].includes(candidate.confidence)) missing.push("confidence_vocab");
  return missing;
}

function summarize(candidates, rejected, audit, dedupe) {
  const by = (fn) =>
    candidates.reduce((acc, item) => {
      const key = fn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  const dates = candidates.map((candidate) => candidate.date).sort();
  return {
    schema_version: "round189.belfast_deep_committee.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: 50,
    seed_count: SEEDS.length,
    accepted_candidates: candidates.length,
    rejected_candidates: rejected.length,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: dates.length ? { min: dates[0], max: dates[dates.length - 1] } : null,
    counts_by_year: by((candidate) => String(yearOf(candidate.date))),
    counts_by_source_id: by((candidate) => candidate.source_id),
    counts_by_source_name: by((candidate) => candidate.source_name),
    counts_by_milestone_type: by((candidate) => candidate.milestone_type),
    source_mix: by((candidate) => SOURCES[SEEDS.find((seed) => idFromSlug(seed.slug) === candidate.event_id).source].source_family),
    source_audit: {
      audited_sources: audit.length,
      retrieved_ok: audit.filter((item) => item.retrieval.ok).length,
      retrieval_failures: audit.filter((item) => !item.retrieval.ok).map((item) => ({ source_id: item.source_id, status: item.retrieval.http_status, error: item.retrieval.error })),
    },
    dedupe,
    output_files: {
      candidates: "tmp/subagents/round189_belfast_deep_committee/candidates.json",
      source_audit: "tmp/subagents/round189_belfast_deep_committee/source_audit.json",
      summary: "tmp/subagents/round189_belfast_deep_committee/summary.json",
      notes: "tmp/subagents/round189_belfast_deep_committee/notes.md",
      rejected: "tmp/subagents/round189_belfast_deep_committee/rejected.json",
    },
    caveat: "This pack is source-backed candidate evidence only. Approximate points are review geometry. Administrative, screening, planning, agreement, works-underway and reporting-period records must not be counted as physical completions or outcome evidence.",
  };
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeNotes(candidates, rejected, audit, summary) {
  const sourceMix = Object.entries(summary.source_mix)
    .map(([name, count]) => `- ${name}: ${count}`)
    .join("\n");
  const caveats = [
    "All records are candidates for review, not production imports.",
    "Dates are source-reported milestone or publication/status dates. Year-end records use 2025-03-31 as the end of the 2024-2025 reporting period.",
    "Approximate point geometry was assigned to named sites or project areas and should be replaced with reviewed asset geometry before appending.",
    "Administrative, planning, agreement, screening, publication and works-underway records are intentionally labelled and must not be treated as completed works.",
    "Duplicate checks included the current Belfast atlas/corpus and prior Belfast subagent candidate packs, including rounds 177 and 183.",
  ];
  const lines = [
    "# Round 189 Belfast Deep Committee/Public Realm Candidates",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    `Accepted candidates: ${candidates.length}`,
    `Rejected seeds: ${rejected.length}`,
    `Date range: ${summary.emitted_date_range ? `${summary.emitted_date_range.min} to ${summary.emitted_date_range.max}` : "n/a"}`,
    "",
    "## Source Mix",
    "",
    sourceMix || "- none",
    "",
    "## Caveats",
    "",
    ...caveats.map((item) => `- ${item}`),
    "",
    "## Retrieval Notes",
    "",
    `Audited sources: ${audit.length}`,
    `Retrieved OK: ${summary.source_audit.retrieved_ok}`,
    `Retrieval failures: ${summary.source_audit.retrieval_failures.length}`,
    "",
    "## Rejection Reasons",
    "",
    ...Object.entries(
      rejected.reduce((acc, item) => {
        acc[item.reason] = (acc[item.reason] || 0) + 1;
        return acc;
      }, {})
    ).map(([reason, count]) => `- ${reason}: ${count}`),
    "",
  ];
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${lines.join("\n")}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildExistingIndex();
  const acceptedKeys = {
    eventIds: new Set(),
    sourceDateKeys: new Set(),
    sourceRecordKeys: new Set(),
    titleDateKeys: new Set(),
  };
  const candidates = [];
  const rejected = [];

  for (const seed of SEEDS) {
    const candidate = makeCandidate(seed);
    const validationMissing = validateCandidate(candidate);
    if (validationMissing.length) {
      rejected.push({ seed_slug: seed.slug, reason: "validation_failed", validation_missing: validationMissing, candidate });
      continue;
    }
    const reason = duplicateReason(candidate, index, acceptedKeys);
    if (reason) {
      rejected.push({ seed_slug: seed.slug, reason, candidate });
      continue;
    }
    candidates.push(candidate);
    acceptedKeys.eventIds.add(candidate.event_id);
    acceptedKeys.sourceDateKeys.add(`${norm(candidate.source_url)}|${candidate.date}`);
    acceptedKeys.sourceRecordKeys.add(`${norm(candidate.source_record_id)}|${candidate.date}`);
    acceptedKeys.titleDateKeys.add(`${norm(candidate.title)}|${candidate.date}`);
    if (candidates.length >= 50) break;
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.event_id.localeCompare(b.event_id));
  const audit = await fetchSourceAudit([...new Set(candidates.map((candidate) => candidate.source_id))]);
  const dedupe = {
    corpus_and_atlas_events_seen: index.eventIds.size,
    prior_belfast_candidate_records_seen: index.indexedFiles
      .filter((item) => item.kind === "prior_belfast_pack")
      .reduce((sum, item) => sum + item.record_count, 0),
    indexed_files: index.indexedFiles,
    duplicate_rejects: rejected.filter((item) => item.reason.includes("duplicate")).length,
    explicitly_included_rounds: [
      "tmp/subagents/round177_belfast_official_architecture_expansion/candidates.json",
      "tmp/subagents/round183_belfast_deep_public_realm/candidates.json",
    ],
  };
  const summary = summarize(candidates, rejected, audit, dedupe);

  writeJson("candidates.json", {
    schema_version: "round189.belfast_deep_committee.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: GENERATED_AT,
    city_id: "belfast",
    target_candidate_cap: 50,
    candidate_count: candidates.length,
    source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids))].sort(),
    source_urls: [...new Set(candidates.map((candidate) => candidate.source_url))].sort(),
    deduped_against: index.indexedFiles.map((item) => item.path),
    scope_note: "Official/public Belfast project, committee, news, DfC public realm, community greenway/bridge/facility and previous-gap style records beyond NI Planning Statistics. Wording is source-backed and administrative/observed only.",
    candidates,
  });
  writeJson("source_audit.json", {
    schema_version: "round189.belfast_deep_committee.source_audit.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    audit,
  });
  writeJson("summary.json", summary);
  writeJson("rejected.json", {
    schema_version: "round189.belfast_deep_committee.rejected.v1",
    generated_at: GENERATED_AT,
    city_id: "belfast",
    rejected_count: rejected.length,
    rejected,
  });
  writeNotes(candidates, rejected, audit, summary);

  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
    accepted: candidates.length,
    rejected: rejected.length,
    date_range: summary.emitted_date_range,
    retrieval_ok: summary.source_audit.retrieved_ok,
    retrieval_failures: summary.source_audit.retrieval_failures.length,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
