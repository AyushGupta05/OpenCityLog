const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ROUND_ID = "round183_belfast_deep_public_realm";
const OUT_DIR = path.join(ROOT_DIR, "tmp", "subagents", ROUND_ID);
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");
const CORPUS_PATH = path.join(
  ROOT_DIR,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const RETRIEVED_AT = "2026-05-19";
const DATE_START = "2008-01-01";
const DATE_END = "2026-05-19";
const TARGET_CAP = 60;
const BELFAST_BBOX = {
  minLat: 54.52,
  maxLat: 54.70,
  minLon: -6.08,
  maxLon: -5.78
};
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const SOURCES = {
  bccMinutesPip2014: {
    source_id: "bcc-minutes-pip-2014-2015-round183",
    source_name: "Belfast City Council Parks and Leisure Committee minutes: Playground Improvement Programme 2014-2015",
    publisher: "Belfast City Council",
    source_type: "official council committee minute / report page",
    source_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=299&MId=1580",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccMinutesPip2024: {
    source_id: "bcc-minutes-pip-2024-2025-round183",
    source_name: "Belfast City Council People and Communities Committee minutes: Playground Improvement Programme 2024/25",
    publisher: "Belfast City Council",
    source_type: "official council committee minute / report page",
    source_url: "https://minutes.belfastcity.gov.uk/mgAi.aspx?ID=79246",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccMinutesPip2025: {
    source_id: "bcc-minutes-pip-2025-2026-round183",
    source_name: "Belfast City Council People and Communities Committee report: Playground Improvement Programme 2025-2026",
    publisher: "Belfast City Council",
    source_type: "official council committee report PDF",
    source_url: "https://minutes.belfastcity.gov.uk/documents/s121294/Playground%20Improvement%20Programme%202025-26.pdf",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccForthMeadow: {
    source_id: "bcc-forth-meadow-community-greenway-round183",
    source_name: "Forth Meadow Community Greenway - PEACE IV Shared Spaces",
    publisher: "Belfast City Council",
    source_type: "official council project page",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Physical-investment/Projects-delivered-in-partnership/SEUPB-PEACE-programme/PEACE-IV-Shared-Spaces/Forth-Meadow-Community-Greenway-project",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccSandyRowNews: {
    source_id: "bcc-news-sandy-row-arts-digital-hub-round183",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_type: "official council news release",
    source_url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccCityCentreNews: {
    source_id: "bcc-news-city-centre-regeneration-2025-round183",
    source_name: "Belfast city centre regeneration steps up a gear",
    publisher: "Belfast City Council",
    source_type: "official council news release",
    source_url: "https://www.belfastcity.gov.uk/News/Belfast-city-centre-regeneration-steps-up-a-gear",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccFernhill: {
    source_id: "bcc-fernhill-house-current-status-round183",
    source_name: "Fernhill House",
    publisher: "Belfast City Council",
    source_type: "official council project/status page",
    source_url: "https://www.belfastcity.gov.uk/business-and-investment/physical-investment/capital-programme/heritage-restoration-projects/fernhill-house",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  bccWilmont: {
    source_id: "bcc-wilmont-house-current-status-round183",
    source_name: "Wilmont House",
    publisher: "Belfast City Council",
    source_type: "official council project/status page",
    source_url: "https://www.belfastcity.gov.uk/business-and-investment/physical-investment/capital-programme/heritage-restoration-projects/wilmont-house",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  dfcStreetsAheadPhase3: {
    source_id: "dfc-belfast-streets-ahead-phase-3-round183",
    source_name: "Belfast: Streets Ahead - phase 3 public realm",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department publication / project page",
    source_url: "https://www.communities-ni.gov.uk/publications/belfast-streets-ahead-phase-3-public-realm",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  },
  dfcPhase3News: {
    source_id: "dfc-belfast-streets-ahead-phase-3-news-round183",
    source_name: "Givan announces multi-million pound investment for Belfast Streets Ahead",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department news release",
    source_url: "https://www.communities-ni.gov.uk/news/givan-announces-multi-million-pound-investment-belfast-streets-ahead",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  }
};

const SEEDS = [
  {
    key: "sir_thomas_lady_dixon_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "Sir Thomas and Lady Dixon Park playground was reported transformed",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including Sir Thomas and Lady Dixon Park.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "Sir Thomas and Lady Dixon Park playground",
    lat: 54.5425,
    lon: -5.9988,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - Sir Thomas and Lady Dixon Park",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for the named playground within Sir Thomas and Lady Dixon Park.",
    geometry_precision: "approximate playground/site point, not a surveyed play-area boundary",
    limitations: "Month-level reported completion only. Do not infer equipment condition after March 2014, use levels, accessibility outcomes or park-wide works."
  },
  {
    key: "new_lodge_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "New Lodge playground was reported transformed in the 2013/2014 programme",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including New Lodge.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "New Lodge playground",
    lat: 54.6075,
    lon: -5.9355,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - New Lodge",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for New Lodge playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Separate from later New Lodge playground improvement records. Do not infer equipment condition after March 2014 or later refurbishment scope."
  },
  {
    key: "clara_street_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "Clara Street playground was reported transformed",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including Clara Street.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "Clara Street playground",
    lat: 54.5950,
    lon: -5.8878,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - Clara Street",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for Clara Street playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Month-level reported completion only. Do not infer equipment condition after March 2014, use levels or accessibility outcomes."
  },
  {
    key: "dover_street_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "Dover Street playground was reported transformed",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including Dover Street.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "Dover Street playground",
    lat: 54.6029,
    lon: -5.9495,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - Dover Street",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for Dover Street playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "This component candidate is split from a programme-level minute. Do not infer exact handover day, later condition or wider neighbourhood effects."
  },
  {
    key: "taughmonagh_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "Taughmonagh playground was reported transformed",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including Taughmonagh.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "Taughmonagh playground",
    lat: 54.5557,
    lon: -5.9683,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - Taughmonagh",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for Taughmonagh playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Month-level reported completion only. Do not infer equipment condition after March 2014, use levels or accessibility outcomes."
  },
  {
    key: "michelle_baird_playground_transformed_2014",
    source: "bccMinutesPip2014",
    date: "2014-03",
    date_precision: "month",
    milestone_type: "playground_refurbishment_completion_reported",
    title: "Michelle Baird Memorial playground was reported transformed in the 2013/2014 programme",
    summary: "Belfast City Council minutes reported that 2013/2014 playground improvement works were complete by the end of March 2014, including Michelle Baird Memorial.",
    observed_change: "Official council minutes record a playground refurbishment completion status for the named site.",
    area: "Michelle Baird Memorial Park playground",
    lat: 54.6118,
    lon: -5.9770,
    source_record_id: "BCC Parks and Leisure Committee item 7, 14 August 2014: 2013/2014 improvement works complete by end March 2014 - Michelle Baird Memorial",
    source_date_field: "minute text: complete by the end of March 2014",
    geometry_source: "Approximate point for Michelle Baird Memorial Park playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Separate from later 2024/2025 programme status. Do not infer equipment condition after March 2014 or later refurbishment scope."
  },
  {
    key: "balfour_avenue_pip_2024_approval",
    source: "bccMinutesPip2024",
    date: "2024-08-06",
    date_precision: "day",
    milestone_type: "playground_refurbishment_programme_approval",
    title: "Balfour Avenue playground refurbishment was agreed for the 2024/2025 programme",
    summary: "Belfast City Council's People and Communities Committee agreed refurbishment works at Balfour Avenue playground under the 2024/2025 Playground Improvement Programme.",
    observed_change: "Official council minutes record an administrative approval for playground refurbishment works at the named site.",
    area: "Balfour Avenue playground",
    lat: 54.5762,
    lon: -5.9198,
    source_record_id: "BCC People and Communities Committee item 5b, 6 August 2024: PIP 2024/2025 agreed - Balfour Avenue playground",
    source_date_field: "committee date and adopted recommendation",
    geometry_source: "Approximate point for Balfour Avenue playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Administrative programme approval only. It is not evidence that works started, completed or delivered a particular final design."
  },
  {
    key: "white_rise_pip_2025_approval",
    source: "bccMinutesPip2025",
    date: "2025-05-06",
    date_precision: "day",
    milestone_type: "playground_refurbishment_programme_approval",
    title: "White Rise playground refurbishment was proposed for the 2025/2026 programme",
    summary: "Belfast City Council's Playground Improvement Programme 2025/2026 report asked committee to agree refurbishment works at White Rise.",
    observed_change: "Official council report records an administrative programme-selection milestone for the named playground.",
    area: "White Rise playground, Lagmore",
    lat: 54.5582,
    lon: -6.0127,
    source_record_id: "BCC PIP Committee Report 2025/2026, 6 May 2025: proposed refurbishment works - White Rise",
    source_date_field: "committee report date and recommendation list",
    geometry_source: "Approximate point for White Rise playground at Lagmore.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Programme-selection record only. Separate evidence is required for construction start, completion, final equipment and later condition."
  },
  {
    key: "ohio_street_pip_2025_approval",
    source: "bccMinutesPip2025",
    date: "2025-05-06",
    date_precision: "day",
    milestone_type: "playground_refurbishment_programme_approval",
    title: "Ohio Street playground refurbishment was proposed for the 2025/2026 programme",
    summary: "Belfast City Council's Playground Improvement Programme 2025/2026 report asked committee to agree refurbishment works at Ohio Street.",
    observed_change: "Official council report records an administrative programme-selection milestone for the named playground.",
    area: "Ohio Street playground",
    lat: 54.5960,
    lon: -5.8910,
    source_record_id: "BCC PIP Committee Report 2025/2026, 6 May 2025: proposed refurbishment works - Ohio Street",
    source_date_field: "committee report date and recommendation list",
    geometry_source: "Approximate point for Ohio Street playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Programme-selection record only. Separate evidence is required for construction start, completion, final equipment and later condition."
  },
  {
    key: "roddens_crescent_pip_2025_approval",
    source: "bccMinutesPip2025",
    date: "2025-05-06",
    date_precision: "day",
    milestone_type: "playground_refurbishment_programme_approval",
    title: "Roddens Crescent playground refurbishment was proposed for the 2025/2026 programme",
    summary: "Belfast City Council's Playground Improvement Programme 2025/2026 report asked committee to agree refurbishment works at Roddens Crescent.",
    observed_change: "Official council report records an administrative programme-selection milestone for the named playground.",
    area: "Roddens Crescent playground",
    lat: 54.5930,
    lon: -5.8180,
    source_record_id: "BCC PIP Committee Report 2025/2026, 6 May 2025: proposed refurbishment works - Roddens Crescent",
    source_date_field: "committee report date and recommendation list",
    geometry_source: "Approximate point for Roddens Crescent playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Programme-selection record only. Separate evidence is required for construction start, completion, final equipment and later condition."
  },
  {
    key: "finvoy_street_pip_2025_approval",
    source: "bccMinutesPip2025",
    date: "2025-05-06",
    date_precision: "day",
    milestone_type: "playground_refurbishment_programme_approval",
    title: "Finvoy Street playground refurbishment was proposed for the 2025/2026 programme",
    summary: "Belfast City Council's Playground Improvement Programme 2025/2026 report asked committee to agree refurbishment works at Finvoy Street.",
    observed_change: "Official council report records an administrative programme-selection milestone for the named playground.",
    area: "Finvoy Street playground",
    lat: 54.6008,
    lon: -5.8818,
    source_record_id: "BCC PIP Committee Report 2025/2026, 6 May 2025: proposed refurbishment works - Finvoy Street",
    source_date_field: "committee report date and recommendation list",
    geometry_source: "Approximate point for Finvoy Street playground.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Programme-selection record only. Separate evidence is required for construction start, completion, final equipment and later condition."
  },
  {
    key: "forth_meadow_glencairn_forthriver_section_completed_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_section_completion_reported",
    title: "Forth Meadow Glencairn Park to Forthriver Linear Park section was reported completed",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that the completed 2025 capital project included new paths, lighting and seating in Glencairn and Forthriver Parks, a new entrance at Glencairn Park, an upgraded Forthriver Linear Park path and a refurbished footbridge at Forthriver Way.",
    observed_change: "Official council project page records a completed greenway section and associated path/lighting/seating works.",
    area: "Glencairn Park to Forthriver Linear Park",
    lat: 54.6120,
    lon: -5.9775,
    source_record_id: "BCC Forth Meadow Community Greenway project page: greenway section Glencairn Park to Forthriver Linear Park",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate midpoint for the source-described Glencairn Park to Forthriver Linear Park greenway section.",
    geometry_precision: "approximate corridor midpoint, not a surveyed route alignment",
    limitations: "Year-level completion and section-level description. Do not treat point as the route alignment or infer usage, safety, health or community outcomes."
  },
  {
    key: "forth_meadow_forthriver_way_footbridge_refurbished_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_bridge_refurbishment_reported",
    title: "Forthriver Way footbridge refurbishment was included in Forth Meadow works",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that the Forthriver Way footbridge was refurbished as part of the completed 2025 capital project.",
    observed_change: "Official council project page records a bridge-refurbishment component within the greenway capital works.",
    area: "Forthriver Way footbridge",
    lat: 54.6129,
    lon: -5.9835,
    source_record_id: "BCC Forth Meadow Community Greenway project page: Forthriver Way footbridge refurbished",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate point for the Forthriver Way footbridge named in the source.",
    geometry_precision: "approximate bridge point, not surveyed bridge geometry",
    limitations: "Year-level completion only. Do not infer structural specification, condition after 2025, accessibility outcomes or route usage."
  },
  {
    key: "forth_meadow_carry_each_other_sculpture_installed_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "public_art_installation_reported",
    title: "Carry Each Other sculpture was reported installed on Springfield Road",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that a seven-metre-tall sculpture named Carry Each Other was installed on Springfield Road close to the Innovation Factory.",
    observed_change: "Official council project page records a public-art installation associated with the greenway.",
    area: "Springfield Road near Innovation Factory",
    lat: 54.6080,
    lon: -5.9760,
    source_record_id: "BCC Forth Meadow Community Greenway project page: Carry Each Other sculpture installed on Springfield Road",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate point on Springfield Road close to Innovation Factory as described by the source.",
    geometry_precision: "approximate public-art point, not a surveyed sculpture coordinate",
    limitations: "Year-level installation within a wider project. Do not infer public-art condition, reception, maintenance or wider regeneration effects."
  },
  {
    key: "forth_meadow_springfield_falls_connection_completed_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_connection_completion_reported",
    title: "Forth Meadow Springfield Park to Falls Park connection was reported completed",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that the completed route connects Springfield Road with the Whiterock Community Corridor and Falls Park.",
    observed_change: "Official council project page records a completed greenway connection between named public spaces.",
    area: "Springfield Park to Falls Park via Whiterock Community Corridor",
    lat: 54.5950,
    lon: -5.9630,
    source_record_id: "BCC Forth Meadow Community Greenway project page: Springfield Park to Falls Park section",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate midpoint for the source-described Springfield Park to Falls Park greenway connection.",
    geometry_precision: "approximate corridor midpoint, not a surveyed route alignment",
    limitations: "Year-level section record. Do not infer exact route geometry, opening day, usage, safety or community outcomes."
  },
  {
    key: "forth_meadow_bog_meadows_pathway_enhancements_completed_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_pathway_enhancement_reported",
    title: "Bog Meadows greenway pathway enhancements were reported completed",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records enhancements to pathways within and connecting to Bog Meadows Nature Reserve, plus additional planting and lighting.",
    observed_change: "Official council project page records pathway, planting and lighting enhancements at Bog Meadows.",
    area: "Bog Meadows Nature Reserve greenway section",
    lat: 54.5810,
    lon: -5.9600,
    source_record_id: "BCC Forth Meadow Community Greenway project page: Bog Meadows pathway, planting and lighting enhancements",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate point for Bog Meadows Nature Reserve section.",
    geometry_precision: "approximate nature-reserve section point, not a surveyed path alignment",
    limitations: "Year-level section record. Do not infer ecological outcome, visitor usage, maintenance condition or exact alignment."
  },
  {
    key: "forth_meadow_broadway_entrance_added_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_entrance_completion_reported",
    title: "Broadway entrance was added for the Forth Meadow route",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that the Bog Meadows section connects to Broadway, where a new entrance was added.",
    observed_change: "Official council project page records a new greenway entrance at Broadway.",
    area: "Broadway entrance to Bog Meadows / Forth Meadow Community Greenway",
    lat: 54.5880,
    lon: -5.9580,
    source_record_id: "BCC Forth Meadow Community Greenway project page: new entrance added at Broadway",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate point at Broadway entrance to the source-described route.",
    geometry_precision: "approximate entrance point, not a surveyed gate or path geometry",
    limitations: "Year-level entrance record. Do not infer detailed access design, accessibility compliance or later operating condition."
  },
  {
    key: "forth_meadow_westlink_city_centre_signage_completed_2025",
    source: "bccForthMeadow",
    date: "2025",
    date_precision: "year",
    milestone_type: "greenway_wayfinding_completion_reported",
    title: "Westlink to city centre Forth Meadow signage was reported installed",
    summary: "Belfast City Council's Forth Meadow Community Greenway page records that the Westlink to city centre section, from Broadway Roundabout to Belfast Grand Central Station, saw new signage installed.",
    observed_change: "Official council project page records wayfinding/signage works on the city-centre section of the greenway.",
    area: "Broadway Roundabout to Belfast Grand Central Station",
    lat: 54.5940,
    lon: -5.9360,
    source_record_id: "BCC Forth Meadow Community Greenway project page: Westlink to city centre section signage installed",
    source_date_field: "project page states greenway completed in 2025",
    geometry_source: "Approximate midpoint for the source-described Broadway Roundabout to Belfast Grand Central Station signage section.",
    geometry_precision: "approximate corridor midpoint, not individual sign coordinates",
    limitations: "Year-level section record. Do not infer exact sign locations, route alignment, usage, safety or city-centre access outcomes."
  },
  {
    key: "coffee_culture_work_underway_sandy_row_2026",
    source: "bccSandyRowNews",
    date: "2026-02-18",
    date_precision: "day",
    milestone_type: "community_facility_works_underway_reported",
    title: "Coffee Culture building works were reported underway in Sandy Row",
    summary: "Belfast City Council news reported that work was getting underway on Coffee Culture, a project to transform a vacant building into a cafe and barista training centre.",
    observed_change: "Official council news records a works-underway status for a community/economic facility project.",
    area: "Sandy Row",
    lat: 54.5899,
    lon: -5.9335,
    source_record_id: "BCC news, 18 February 2026: Coffee Culture work getting underway",
    source_date_field: "news date and source text: work getting underway this week",
    geometry_source: "Approximate point on Sandy Row; the source does not publish a building coordinate.",
    geometry_precision: "approximate street/project-area point, not a building footprint",
    limitations: "Works-underway status only. Do not infer completion, opening, training delivery, jobs, footfall or regeneration outcomes."
  },
  {
    key: "sandy_row_open_space_project_pipeline_2026",
    source: "bccSandyRowNews",
    date: "2026-02-18",
    date_precision: "day",
    milestone_type: "open_space_project_pipeline_reported",
    title: "Sandy Row Open Space Project was reported in the 2026 project pipeline",
    summary: "Belfast City Council news reported that the council was working with partners on the Sandy Row Open Space Project, intended to bring Blythefield Park back into public use with additional green space, new paths and a dog park once completed.",
    observed_change: "Official council news records a project-pipeline status for open-space works.",
    area: "Blythefield Park / Sandy Row open space",
    lat: 54.5890,
    lon: -5.9340,
    source_record_id: "BCC news, 18 February 2026: Sandy Row Open Space Project pipeline status",
    source_date_field: "news date and source text: working closely with partners; once completed later this year",
    geometry_source: "Approximate point for Blythefield Park / Sandy Row open-space area.",
    geometry_precision: "approximate open-space point, not a surveyed project boundary",
    limitations: "Pipeline/status record only. It is not evidence of completion, opening, final design or realised public use."
  },
  {
    key: "bentham_drive_play_park_sensory_equipment_plans_2026",
    source: "bccSandyRowNews",
    date: "2026-02-18",
    date_precision: "day",
    milestone_type: "playground_improvement_plan_reported",
    title: "Bentham Drive play park sensory-equipment plans were reported",
    summary: "Belfast City Council news reported plans to add new sensory equipment to the play park at Bentham Drive.",
    observed_change: "Official council news records a planned playground improvement at a named site.",
    area: "Bentham Drive play park",
    lat: 54.5870,
    lon: -5.9360,
    source_record_id: "BCC news, 18 February 2026: plans to add new sensory equipment to Bentham Drive play park",
    source_date_field: "news date and source text: working on plans",
    geometry_source: "Approximate point for Bentham Drive play park.",
    geometry_precision: "approximate playground point, not a surveyed play-area boundary",
    limitations: "Planned works only. Do not infer procurement, construction start, completion, final equipment or accessibility outcomes."
  },
  {
    key: "under_the_bridges_dfi_investment_reported_2025",
    source: "bccCityCentreNews",
    date: "2025-06-04",
    date_precision: "day",
    milestone_type: "public_realm_active_travel_funding_reported",
    title: "DfI investment was reported for Under the Bridges public-realm project",
    summary: "Belfast City Council news reported that the Department for Infrastructure invested £600,000 in the council's Under the Bridges project and Sailortown Bridge.",
    observed_change: "Official council news records a funding/investment milestone for a public-realm and active-travel project.",
    area: "M3 bridges / Sailortown / City Quays area",
    lat: 54.6050,
    lon: -5.9160,
    source_record_id: "BCC news, 4 June 2025: DfI investment in Under the Bridges project",
    source_date_field: "news date and source text: DfI has invested £600k",
    geometry_source: "Approximate point under/near the M3 bridges between the city centre and Sailortown/City Quays.",
    geometry_precision: "approximate project-area point, not a surveyed works boundary",
    limitations: "Funding/status record only. Do not infer construction start, completion, final design, use, safety, traffic or regeneration outcomes."
  },
  {
    key: "sailortown_bridge_dfi_investment_reported_2025",
    source: "bccCityCentreNews",
    date: "2025-06-04",
    date_precision: "day",
    milestone_type: "bridge_active_travel_funding_reported",
    title: "DfI investment was reported for Sailortown Bridge",
    summary: "Belfast City Council news reported Department for Infrastructure investment in Sailortown Bridge alongside the Under the Bridges project.",
    observed_change: "Official council news records a funding/investment milestone for a bridge/active-travel project.",
    area: "Sailortown / City Quays bridge area",
    lat: 54.6060,
    lon: -5.9120,
    source_record_id: "BCC news, 4 June 2025: DfI investment in Sailortown Bridge",
    source_date_field: "news date and source text: DfI has invested £600k in Under the Bridges project and Sailortown Bridge",
    geometry_source: "Approximate point for the source-described Sailortown / City Quays bridge area.",
    geometry_precision: "approximate bridge-project point, not surveyed bridge geometry",
    limitations: "Funding/status record only. Do not infer planning approval, construction start, completion, final design, use or connectivity outcomes."
  },
  {
    key: "fernhill_house_initial_investment_agreed_2025",
    source: "bccFernhill",
    date: "2025-09",
    date_precision: "month",
    milestone_type: "heritage_asset_stabilisation_investment_reported",
    title: "Fernhill House initial stabilisation investment was reported agreed",
    summary: "Belfast City Council's Fernhill House status page records that councillors agreed an initial £950,000 investment in September 2025 to secure the structure of Fernhill House and stables.",
    observed_change: "Official council project page records an administrative investment decision for heritage-asset stabilisation.",
    area: "Fernhill House and stables, Glencairn Park",
    lat: 54.6070,
    lon: -5.9910,
    source_record_id: "BCC Fernhill House page: September 2025 initial investment to secure the structure of the building and stables",
    source_date_field: "project page text: Following this, in September 2025 councillors agreed an initial investment",
    geometry_source: "Approximate point for Fernhill House and stables in Glencairn Park.",
    geometry_precision: "approximate heritage-building point, not a surveyed footprint",
    limitations: "Investment decision/status only. Do not infer works completion, restoration, reopening, final use or removal from at-risk status."
  },
  {
    key: "wilmont_house_public_consultation_reported_2025",
    source: "bccWilmont",
    date: "2025",
    date_precision: "year",
    milestone_type: "heritage_asset_future_use_consultation_reported",
    title: "Wilmont House future-use consultation was reported carried out",
    summary: "Belfast City Council's Wilmont House status page records that an initial public consultation exercise with park users and community groups was carried out in summer 2025 as part of feasibility work on a possible community and arts-space use.",
    observed_change: "Official council project page records a consultation/status milestone for a heritage-asset future-use study.",
    area: "Wilmont House, Sir Thomas and Lady Dixon Park",
    lat: 54.5460,
    lon: -5.9960,
    source_record_id: "BCC Wilmont House page: initial public consultation with park users and community groups carried out in summer 2025",
    source_date_field: "project page text: initial public consultation exercise carried out in summer 2025",
    geometry_source: "Approximate point for Wilmont House in Sir Thomas and Lady Dixon Park.",
    geometry_precision: "approximate heritage-building point, not a surveyed footprint",
    limitations: "Consultation/status record only. Do not infer works start, restoration, reopening, funding certainty or final use."
  },
  {
    key: "streets_ahead_phase3_design_publication_2015",
    source: "dfcStreetsAheadPhase3",
    date: "2015-02-27",
    date_precision: "day",
    milestone_type: "public_realm_design_publication",
    title: "Belfast Streets Ahead Phase 3 public-realm design publication was issued",
    summary: "The Department for Communities published the Belfast Streets Ahead Phase 3 public realm material on 27 February 2015.",
    observed_change: "Official department publication records a design/publication milestone for a public-realm scheme.",
    area: "Royal Avenue / York Street / Cathedral Quarter Phase 3 area",
    lat: 54.6020,
    lon: -5.9280,
    source_record_id: "DfC publication page, 27 February 2015: Belfast Streets Ahead - phase 3 public realm",
    source_date_field: "publication date on source page",
    geometry_source: "Approximate city-centre corridor point for the source-described Phase 3 public realm area.",
    geometry_precision: "approximate corridor point, not a design boundary or works extent",
    limitations: "Publication/design milestone only. Do not infer planning approval, procurement, construction start, completion or public-realm quality change."
  },
  {
    key: "streets_ahead_phase3_planning_permission_reported_2015",
    source: "dfcPhase3News",
    date: "2015-11-17",
    date_precision: "day",
    milestone_type: "public_realm_planning_permission_reported",
    title: "Belfast Streets Ahead Phase 3 planning permission was reported granted",
    summary: "Department for Communities notes for the Belfast Streets Ahead Phase 3 investment announcement record that planning permission for the scheme was granted by Belfast Planning Service on 17 November 2015.",
    observed_change: "Official department news release records an administrative planning-permission milestone for the public-realm scheme.",
    area: "Royal Avenue / York Street / Cathedral Quarter Phase 3 area",
    lat: 54.6020,
    lon: -5.9280,
    source_record_id: "DfC news, 9 August 2016 notes to editors: Phase 3 planning permission granted by Belfast Planning Service on 17 November 2015",
    source_date_field: "notes to editors date statement",
    geometry_source: "Approximate city-centre corridor point for the source-described Phase 3 public realm area.",
    geometry_precision: "approximate corridor point, not a planning boundary or works extent",
    limitations: "Planning-permission record only. It is not evidence that works started, completed, matched approved plans or changed later public-realm condition."
  }
];

const MANUAL_REJECTIONS = [
  {
    seed_key: "marrowbone_millennium_park_reopening_2023",
    title: "Marrowbone Millennium Park reopened after redevelopment",
    date: "2023-10-27",
    source_url: "https://www.belfastcity.gov.uk/News/Marrowbone-Millennium-Park-reopens-following-multi",
    reasons: ["already_present_in_current_corpus_as_marrowbone_millennium_park_reopening_2023"]
  },
  {
    seed_key: "dr_pitt_memorial_park_reopening_2024",
    title: "Dr Pitt Memorial Park reopened after redevelopment",
    date: "2024-06-04",
    source_url: "https://www.belfastcity.gov.uk/News/East-Belfast-park-reopens-following-%C2%A31-7-million-r",
    reasons: ["already_present_in_current_corpus_as_dr_pitt_memorial_park_reopening_2024"]
  },
  {
    seed_key: "black_mountain_shared_space_opening_2024",
    title: "Black Mountain Shared Space officially opened",
    date: "2024-09-18",
    source_url: "https://www.belfastcity.gov.uk/News/%C2%A37-million-shared-community-space-opens-at-Belfast",
    reasons: ["already_present_in_current_corpus_as_black_mountain_shared_space_opening_2024"]
  },
  {
    seed_key: "templemore_baths_restoration_opening_2023",
    title: "Templemore Baths restoration and expansion completed",
    date: "2023",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Transforming-leisure-services/Templemore-Baths-restoration",
    reasons: ["already_present_in_current_corpus_as_templemore_baths_restoration_opening_2023"]
  },
  {
    seed_key: "city_quays_gardens_launch_2025",
    title: "City Quays Gardens opened",
    date: "2025",
    source_url: "https://www.belfastcity.gov.uk/city-centre/major-projects",
    reasons: ["already_present_in_current_corpus_as_city_quays_gardens_launch_2025"]
  },
  {
    seed_key: "springvale_park_opening_2023",
    title: "Springvale Park opened in west Belfast",
    date: "2023-08-23",
    source_url: "https://www.belfastcity.gov.uk/Business-and-investment/Physical-investment/Projects-delivered-in-partnership/SEUPB-PEACE-programme/PEACE-IV-Shared-Spaces/Forth-Meadow-Community-Greenway-project",
    reasons: ["already_present_in_current_corpus_as_springvale_park_opening_2023"]
  }
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 110) || "record";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizedDateForWindow(date) {
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
  return date;
}

function inDateWindow(date) {
  const normalized = normalizedDateForWindow(date);
  return normalized >= DATE_START && normalized <= DATE_END;
}

function inBelfastEnvelope(lat, lon) {
  return lat >= BELFAST_BBOX.minLat &&
    lat <= BELFAST_BBOX.maxLat &&
    lon >= BELFAST_BBOX.minLon &&
    lon <= BELFAST_BBOX.maxLon;
}

function extractRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.candidates)) return payload.candidates;
  return [];
}

function eventIdsFromRecord(record) {
  return [
    record.event_id,
    record.event_id_suggestion,
    record.candidate_id
  ].filter(Boolean).map((value) => cleanText(value).toLowerCase());
}

function sourceDateKey(record) {
  return [
    cleanText(record.source_record_id).toLowerCase(),
    cleanText(record.date || record.effective_date).toLowerCase()
  ].join("|");
}

function titleDateKey(record) {
  return [
    cleanText(record.title).toLowerCase(),
    cleanText(record.date || record.effective_date).toLowerCase()
  ].join("|");
}

function loadCorpusAndPriorKeys() {
  const indexed = [];
  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  let corpusEvents = 0;
  let priorCandidates = 0;

  function indexFile(file, kind) {
    if (!fs.existsSync(file)) return;
    const records = extractRecords(readJson(file));
    indexed.push({
      kind,
      path: path.relative(ROOT_DIR, file).replace(/\\/g, "/"),
      record_count: records.length
    });
    if (kind === "corpus") corpusEvents += records.length;
    if (kind === "prior_pack") priorCandidates += records.length;

    for (const record of records) {
      if (record.city_id && record.city_id !== "belfast") continue;
      for (const id of eventIdsFromRecord(record)) eventIds.add(id);
      if (record.source_record_id && (record.date || record.effective_date)) {
        sourceDateKeys.add(sourceDateKey(record));
      }
      if (record.title && (record.date || record.effective_date)) {
        titleDateKeys.add(titleDateKey(record));
      }
    }
  }

  indexFile(CORPUS_PATH, "corpus");

  const subagentsDir = path.join(ROOT_DIR, "tmp", "subagents");
  if (fs.existsSync(subagentsDir)) {
    for (const dirent of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      if (dirent.name === ROUND_ID) continue;
      if (!/belfast/i.test(dirent.name)) continue;
      const candidatePath = path.join(subagentsDir, dirent.name, "candidates.json");
      if (fs.existsSync(candidatePath)) indexFile(candidatePath, "prior_pack");
    }
  }

  return {
    eventIds,
    sourceDateKeys,
    titleDateKeys,
    indexed,
    corpusEvents,
    priorCandidates
  };
}

function candidateFor(seed) {
  const source = SOURCES[seed.source];
  if (!source) throw new Error(`Unknown source ${seed.source}`);
  const eventId = `round183_belfast_${slugify(seed.key)}`;
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: eventId,
    event_id: eventId,
    event_id_suggestion: `bfs_arch_${eventId}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: null,
    date_precision: seed.date_precision,
    bucket: seed.milestone_type.includes("playground")
      ? "planning/development/architecture/playground public realm"
      : "planning/development/architecture/public realm",
    event_family: "architecture/official-public-realm-record",
    milestone_type: seed.milestone_type,
    title: seed.title,
    summary: seed.summary,
    observed_change: seed.observed_change,
    area: seed.area,
    lat: seed.lat,
    lon: seed.lon,
    latitude: seed.lat,
    longitude: seed.lon,
    geometry: {
      type: "Point",
      coordinates: [seed.lon, seed.lat]
    },
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
    accessed_at: RETRIEVED_AT,
    retrieved_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.date,
    confidence: seed.milestone_type.includes("planned") ||
      seed.milestone_type.includes("pipeline") ||
      seed.milestone_type.includes("approval") ||
      seed.milestone_type.includes("funding")
      ? "documented"
      : "documented",
    architect: "Source record does not name a project architect.",
    project_type: seed.milestone_type.replace(/_/g, " "),
    geometry_source: seed.geometry_source,
    geometry_precision: seed.geometry_precision,
    limitations: seed.limitations,
    transformation_method: `Curated from official Belfast public-realm, playground, greenway, committee, news and DfC project pages in ${path.basename(__filename)}; dates are source-stated report/publication/approval/completion/status dates, with administrative and planned records labelled as such; coordinates are approximate review points and not authoritative geometries.`,
    raw_source_hint: {
      seed_key: seed.key,
      source_key: seed.source,
      source_record_id: seed.source_record_id
    }
  };
}

function validateCandidate(candidate) {
  const required = [
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
    "transformation_method"
  ];
  const missing = required.filter((field) => {
    const value = candidate[field];
    return value === undefined || value === null || value === "" ||
      (Array.isArray(value) && value.length === 0);
  });
  if (missing.length) return [`missing_required_fields:${missing.join(",")}`];
  const reasons = [];
  if (candidate.city_id !== "belfast") reasons.push("city_id_not_belfast");
  if (!inDateWindow(candidate.date)) reasons.push("outside_date_window");
  if (!inBelfastEnvelope(candidate.lat, candidate.lon)) reasons.push("outside_belfast_envelope");
  if (!candidate.summary.match(/\b(reported|records|record|published|agreed|asked|news|page)\b/i)) {
    reasons.push("summary_not_source_reported");
  }
  return reasons;
}

function sourceAudits() {
  return [
    {
      source_id: SOURCES.bccMinutesPip2014.source_id,
      source_name: SOURCES.bccMinutesPip2014.source_name,
      publisher: SOURCES.bccMinutesPip2014.publisher,
      url: SOURCES.bccMinutesPip2014.source_url,
      license: SOURCES.bccMinutesPip2014.license,
      coverage_years_checked: "Committee minute/report page for 14 August 2014; used only for 2013/2014 programme completion by end March 2014.",
      update_frequency: "Meeting-by-meeting publication; historical pages can be republished or attachments moved.",
      geographic_scope: "Belfast council-maintained playgrounds and parks.",
      granularity: "Committee item and named playground list; no surveyed geometry.",
      key_fields_used: "Committee date, minute text, named playgrounds, completion month statement, source URL and item context.",
      reliability: "usable with caveats",
      required_caveats: "Strong evidence that named sites were reported complete under the programme; not proof of exact handover day, equipment inventory, later condition, usage or outcomes.",
      ingestion_recommendation: "Use for component-level playground completion candidates only with approximate geometry and no outcome claims.",
      next_checks: "For production, resolve archival report PDF and any appendix photos; replace approximate points with authoritative park/playground geometries where available."
    },
    {
      source_id: SOURCES.bccMinutesPip2024.source_id,
      source_name: SOURCES.bccMinutesPip2024.source_name,
      publisher: SOURCES.bccMinutesPip2024.publisher,
      url: SOURCES.bccMinutesPip2024.source_url,
      license: SOURCES.bccMinutesPip2024.license,
      coverage_years_checked: "People and Communities Committee item for 6 August 2024.",
      update_frequency: "Meeting-by-meeting publication.",
      geographic_scope: "Belfast council-maintained playgrounds.",
      granularity: "Committee item and named playground programme selections.",
      key_fields_used: "Committee date, adopted recommendation, playground names, item ID.",
      reliability: "strong for administrative approval; not a completion source",
      required_caveats: "Use as programme approval only. Do not state that physical works were delivered from this source.",
      ingestion_recommendation: "Use sparingly for gaps where later completion evidence is not yet available."
    },
    {
      source_id: SOURCES.bccMinutesPip2025.source_id,
      source_name: SOURCES.bccMinutesPip2025.source_name,
      publisher: SOURCES.bccMinutesPip2025.publisher,
      url: SOURCES.bccMinutesPip2025.source_url,
      license: SOURCES.bccMinutesPip2025.license,
      coverage_years_checked: "Committee report dated 6 May 2025 for PIP 2025/2026 selections.",
      update_frequency: "Meeting-by-meeting publication.",
      geographic_scope: "Belfast council-maintained playgrounds.",
      granularity: "Committee report PDF and named playground list.",
      key_fields_used: "Report date, recommendation list, site names.",
      reliability: "strong for administrative programme selection; not a completion source",
      required_caveats: "Use as programme-selection evidence only; later news/minutes required for completion.",
      ingestion_recommendation: "Use for candidate backlog and evidence drawer context, not headline completed-project totals."
    },
    {
      source_id: SOURCES.bccForthMeadow.source_id,
      source_name: SOURCES.bccForthMeadow.source_name,
      publisher: SOURCES.bccForthMeadow.publisher,
      url: SOURCES.bccForthMeadow.source_url,
      license: SOURCES.bccForthMeadow.license,
      coverage_years_checked: "Current official project page retrieved 2026-05-19; page states greenway completed in 2025.",
      update_frequency: "Project page updated irregularly.",
      geographic_scope: "Forth Meadow Community Greenway route from Clarendon Playing Fields to Belfast Grand Central Station.",
      granularity: "Route section / component description; no GIS linework in the source text used here.",
      key_fields_used: "Completion year, section headings, named works, named places.",
      reliability: "usable with caveats",
      required_caveats: "Use as section/component completion evidence. Approximate points are not route alignments and cannot support usage, safety, health, reconciliation or regeneration outcomes.",
      ingestion_recommendation: "Recommended for component-level greenway candidates if the frontend labels year-level dates and approximate corridor geometry."
    },
    {
      source_id: SOURCES.bccSandyRowNews.source_id,
      source_name: SOURCES.bccSandyRowNews.source_name,
      publisher: SOURCES.bccSandyRowNews.publisher,
      url: SOURCES.bccSandyRowNews.source_url,
      license: SOURCES.bccSandyRowNews.license,
      coverage_years_checked: "Official news release dated 18 February 2026.",
      update_frequency: "Page-specific publication.",
      geographic_scope: "Sandy Row projects and facilities.",
      granularity: "News-release paragraph; several forward-looking statuses.",
      key_fields_used: "News date, project names, reported status wording.",
      reliability: "strong for reported status; weak for future completion",
      required_caveats: "Pipeline and planned records must not be counted as completed works.",
      ingestion_recommendation: "Use only with status labels such as works-underway, pipeline or planned."
    },
    {
      source_id: SOURCES.bccCityCentreNews.source_id,
      source_name: SOURCES.bccCityCentreNews.source_name,
      publisher: SOURCES.bccCityCentreNews.publisher,
      url: SOURCES.bccCityCentreNews.source_url,
      license: SOURCES.bccCityCentreNews.license,
      coverage_years_checked: "Official news release dated 4 June 2025.",
      update_frequency: "Page-specific publication.",
      geographic_scope: "Belfast city centre, Sailortown, City Quays and active-travel/public-realm projects.",
      granularity: "News-release paragraph; funding/status milestone.",
      key_fields_used: "News date, source-stated funding, named projects.",
      reliability: "strong for funding/status announcement; not delivery evidence",
      required_caveats: "Funding announcements are not construction, completion or outcome evidence.",
      ingestion_recommendation: "Use as administrative/funding candidates only."
    },
    {
      source_id: SOURCES.bccFernhill.source_id,
      source_name: SOURCES.bccFernhill.source_name,
      publisher: SOURCES.bccFernhill.publisher,
      url: SOURCES.bccFernhill.source_url,
      license: SOURCES.bccFernhill.license,
      coverage_years_checked: "Current official project page retrieved 2026-05-19; used for September 2025 investment decision.",
      update_frequency: "Project/status page updated irregularly.",
      geographic_scope: "Fernhill House and stables, Glencairn Park.",
      granularity: "Project status paragraph.",
      key_fields_used: "Named asset, month/year investment decision, status wording.",
      reliability: "usable with caveats",
      required_caveats: "Investment/stabilisation decision is not restoration or reopening evidence.",
      ingestion_recommendation: "Use as a heritage-asset status candidate with explicit limitations."
    },
    {
      source_id: SOURCES.bccWilmont.source_id,
      source_name: SOURCES.bccWilmont.source_name,
      publisher: SOURCES.bccWilmont.publisher,
      url: SOURCES.bccWilmont.source_url,
      license: SOURCES.bccWilmont.license,
      coverage_years_checked: "Current official project page retrieved 2026-05-19; used for summer 2025 consultation status.",
      update_frequency: "Project/status page updated irregularly.",
      geographic_scope: "Wilmont House, Sir Thomas and Lady Dixon Park.",
      granularity: "Project status paragraph.",
      key_fields_used: "Named asset, consultation timing, feasibility-status wording.",
      reliability: "usable with caveats",
      required_caveats: "Consultation does not evidence physical works, funding certainty, restoration or reopening.",
      ingestion_recommendation: "Use as future-use/status evidence only."
    },
    {
      source_id: SOURCES.dfcStreetsAheadPhase3.source_id,
      source_name: SOURCES.dfcStreetsAheadPhase3.source_name,
      publisher: SOURCES.dfcStreetsAheadPhase3.publisher,
      url: SOURCES.dfcStreetsAheadPhase3.source_url,
      license: SOURCES.dfcStreetsAheadPhase3.license,
      coverage_years_checked: "DfC publication page dated 27 February 2015.",
      update_frequency: "Static publication page.",
      geographic_scope: "Belfast city-centre Phase 3 public-realm area.",
      granularity: "Publication/page-level design milestone.",
      key_fields_used: "Publication date, project name, project description.",
      reliability: "strong for publication date; not delivery evidence",
      required_caveats: "Design publication does not prove planning approval, procurement, start on site or completion.",
      ingestion_recommendation: "Use as early public-realm scheme evidence with administrative status."
    },
    {
      source_id: SOURCES.dfcPhase3News.source_id,
      source_name: SOURCES.dfcPhase3News.source_name,
      publisher: SOURCES.dfcPhase3News.publisher,
      url: SOURCES.dfcPhase3News.source_url,
      license: SOURCES.dfcPhase3News.license,
      coverage_years_checked: "DfC news release dated 9 August 2016; used for notes-to-editors planning-permission date.",
      update_frequency: "Page-specific publication.",
      geographic_scope: "Belfast city-centre Phase 3 public-realm area.",
      granularity: "News release and notes-to-editors fact.",
      key_fields_used: "Planning permission date, project area description, publisher.",
      reliability: "usable with caveats",
      required_caveats: "Planning permission is administrative evidence, not construction or completion evidence.",
      ingestion_recommendation: "Use where the corpus lacks this specific administrative milestone."
    }
  ];
}

function writeNotes(summary) {
  const notes = `# Round 183 Belfast Deep Public Realm Candidates

## Scope

Scratch-only candidate pack for additional Belfast architecture-adjacent public-realm evidence from official/public source families beyond NI Planning Statistics. This pass emphasises Belfast City Council minutes, BCC project/news pages, DfC Belfast Streets Ahead pages, greenway components, playground/public-space records and rejected-but-tempting candidates that are now either completed with geometry or explicitly rejected as duplicates.

## Method

- Indexed the current manual architecture corpus and all prior Belfast subagent candidate packs, including round177.
- Built duplicate checks for event IDs, source-record/date keys and title/date keys.
- Emitted only records dated ${DATE_START} through ${DATE_END}, inside the Belfast coordinate envelope.
- Kept component-level records when the official source names distinct sections or sites.
- Labelled administrative, funding, planned and pipeline records as such; no candidate claims causation, forecast impact, usage, health, safety, economic or community outcomes.

## Caveats

Coordinates are approximate review points for named sites, corridors or project areas. They are not surveyed boundaries, playground extents, route alignments, bridge geometry, construction boundaries or proof of final design.

## Headroom

There is still headroom in deeper committee packs and PDF appendices, especially DfC public-realm schemes, BCC area working group reports, and post-2025 capital-programme updates. Many attractive candidates were already present in the corpus, so this pack prefers smaller component records over duplicate headline openings.

## Output

- Candidates: ${summary.output_files.candidates}
- Source audit: ${summary.output_files.source_audit}
- Summary: ${summary.output_files.summary}
- Rejected: ${summary.output_files.rejected}
`;
  fs.writeFileSync(NOTES_PATH, notes);
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dedupe = loadCorpusAndPriorKeys();
  const accepted = [];
  const rejected = MANUAL_REJECTIONS.map((item) => ({
    ...item,
    rejected_stage: "manual_source_audit"
  }));

  for (const seed of SEEDS) {
    let candidate;
    try {
      candidate = candidateFor(seed);
      const reasons = validateCandidate(candidate);
      const duplicateEventId = eventIdsFromRecord(candidate).find((id) => dedupe.eventIds.has(id));
      if (duplicateEventId) reasons.push(`duplicate_event_id:${duplicateEventId}`);
      if (dedupe.sourceDateKeys.has(sourceDateKey(candidate))) reasons.push("duplicate_source_record_date_key");
      if (dedupe.titleDateKeys.has(titleDateKey(candidate))) reasons.push("duplicate_title_date_key");
      if (accepted.length >= TARGET_CAP) reasons.push("target_cap_reached");

      if (reasons.length) {
        rejected.push({
          seed_key: seed.key,
          title: seed.title,
          source_url: SOURCES[seed.source]?.source_url || null,
          source_record_id: seed.source_record_id,
          date: seed.date,
          rejected_stage: "validation_or_dedupe",
          reasons
        });
        continue;
      }

      accepted.push(candidate);
      for (const id of eventIdsFromRecord(candidate)) dedupe.eventIds.add(id);
      dedupe.sourceDateKeys.add(sourceDateKey(candidate));
      dedupe.titleDateKeys.add(titleDateKey(candidate));
    } catch (error) {
      rejected.push({
        seed_key: seed.key,
        title: seed.title,
        date: seed.date,
        rejected_stage: "candidate_build_failed",
        reasons: ["candidate_build_failed"],
        error: error.message
      });
    }
  }

  accepted.sort((a, b) => {
    const dateCompare = normalizedDateForWindow(a.date).localeCompare(normalizedDateForWindow(b.date));
    if (dateCompare) return dateCompare;
    return a.event_id.localeCompare(b.event_id);
  });

  const countsByYear = {};
  const countsBySource = {};
  const countsBySourceName = {};
  const countsByMilestone = {};
  for (const candidate of accepted) {
    const year = candidate.date.slice(0, 4);
    countsByYear[year] = (countsByYear[year] || 0) + 1;
    countsBySource[candidate.source_id] = (countsBySource[candidate.source_id] || 0) + 1;
    countsBySourceName[candidate.source_name] = (countsBySourceName[candidate.source_name] || 0) + 1;
    countsByMilestone[candidate.milestone_type] = (countsByMilestone[candidate.milestone_type] || 0) + 1;
  }

  const sourceUrls = [...new Set(accepted.map((candidate) => candidate.source_url))].sort();
  const candidatePayload = {
    schema_version: "round183.belfast_deep_public_realm.candidates.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    candidate_count: accepted.length,
    source_ids: [...new Set(accepted.flatMap((candidate) => candidate.source_ids))].sort(),
    source_urls: sourceUrls,
    deduped_against: dedupe.indexed.map((item) => item.path),
    scope_note: "Official/public Belfast public-realm, greenway, playground, heritage-status and Streets Ahead source-record candidates. Administrative, funding and planned records are labelled and not treated as physical completion.",
    candidates: accepted
  };

  const summary = {
    schema_version: "round183.belfast_deep_public_realm.summary.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    date_window: {
      start: DATE_START,
      end: DATE_END
    },
    emitted_date_range: accepted.length ? {
      min: accepted[0].date,
      max: accepted[accepted.length - 1].date
    } : null,
    counts_by_year: countsByYear,
    counts_by_source_id: countsBySource,
    counts_by_source_name: countsBySourceName,
    counts_by_milestone_type: countsByMilestone,
    source_mix: {
      "BCC committee/minutes/report pages": accepted.filter((candidate) => candidate.source_type.includes("committee")).length,
      "BCC news pages": accepted.filter((candidate) => candidate.source_type.includes("news")).length,
      "BCC project/status pages": accepted.filter((candidate) => candidate.source_type.includes("project") || candidate.source_type.includes("status")).length,
      "DfC public realm/Streets Ahead pages": accepted.filter((candidate) => candidate.publisher.includes("Department for Communities")).length
    },
    dedupe: {
      corpus_path: path.relative(ROOT_DIR, CORPUS_PATH).replace(/\\/g, "/"),
      corpus_events_seen: dedupe.corpusEvents,
      prior_belfast_candidate_records_seen: dedupe.priorCandidates,
      indexed_files: dedupe.indexed,
      duplicate_rejects: rejected.filter((item) => item.reasons?.some((reason) => reason.includes("duplicate") || reason.includes("already_present"))).length
    },
    output_files: {
      candidates: path.relative(ROOT_DIR, CANDIDATES_PATH).replace(/\\/g, "/"),
      source_audit: path.relative(ROOT_DIR, SOURCE_AUDIT_PATH).replace(/\\/g, "/"),
      summary: path.relative(ROOT_DIR, SUMMARY_PATH).replace(/\\/g, "/"),
      notes: path.relative(ROOT_DIR, NOTES_PATH).replace(/\\/g, "/"),
      rejected: path.relative(ROOT_DIR, REJECTED_PATH).replace(/\\/g, "/")
    },
    caveat: "This pack is source-backed candidate evidence only. Approximate points are review geometry. Administrative, funding, planned and pipeline records must not be counted as physical completion or outcome evidence."
  };

  writeJson(CANDIDATES_PATH, candidatePayload);
  writeJson(SOURCE_AUDIT_PATH, {
    schema_version: "round183.belfast_deep_public_realm.source_audit.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    audits: sourceAudits()
  });
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTED_PATH, {
    schema_version: "round183.belfast_deep_public_realm.rejected.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    rejected_count: rejected.length,
    rejected
  });
  writeNotes(summary);

  console.log(JSON.stringify({
    accepted: accepted.length,
    rejected: rejected.length,
    output_dir: path.relative(ROOT_DIR, OUT_DIR).replace(/\\/g, "/"),
    date_range: summary.emitted_date_range,
    source_mix: summary.source_mix
  }, null, 2));
}

main();
