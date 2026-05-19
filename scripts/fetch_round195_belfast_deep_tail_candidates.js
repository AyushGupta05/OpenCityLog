const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.resolve(__dirname, "..");
const ROUND_ID = "round195_belfast_deep_tail";
const OUT_DIR = path.join(ROOT_DIR, "tmp", "subagents", ROUND_ID);
const RETRIEVED_AT = "2026-05-19";
const DATE_START = "2008-01-01";
const DATE_END = "2026-05-19";
const TARGET_CAP = 35;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const BELFAST_BBOX = { minLat: 54.52, maxLat: 54.7, minLon: -6.08, maxLon: -5.78 };

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json")
};

const DEDUPE_FILES = [
  "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
  "web/data/city-atlas/cities/belfast/events.json",
  ...Array.from({ length: 20 }, (_, index) => {
    const year = 2007 + index;
    return `web/data/city-atlas/cities/belfast/events_${year}.json`;
  }),
  ...[
    "round115_belfast_public_projects_codex",
    "round116_belfast_heritage_projects",
    "round116_belfast_planning_official",
    "round117_belfast_official_deep",
    "round118_belfast_planning_committees_deep",
    "round118_belfast_public_heritage_projects",
    "round119_belfast_planning_portal_more",
    "round119_belfast_public_facilities_more",
    "round120_belfast_heritage_harni_more",
    "round121_belfast_decisions_committee_more",
    "round122_belfast_major_planning_decisions",
    "round123_belfast_planning_portal_committee_more",
    "round123_belfast_public_facilities_universities_health",
    "round124_belfast_planning_appeals_dfc_public_realm",
    "round125_belfast_civic_public_realm_geocoded",
    "round125_belfast_geocode_previous_rejects",
    "round126_belfast_planning_portal_official_more",
    "round128_belfast_harni_spatial",
    "round130_belfast_official_more",
    "round131_belfast_planning_statistics",
    "round134_belfast_planning_statistics_deep",
    "round137_belfast_planning_statistics_more",
    "round141_belfast_harni_gaps",
    "round145_belfast_planning_statistics_next",
    "round151_belfast_planning_statistics_next2",
    "round156_belfast_official_heritage_tail",
    "round165_belfast_planning_statistics_next3",
    "round171_belfast_planning_statistics_next4",
    "round177_belfast_official_architecture_expansion",
    "round183_belfast_deep_public_realm",
    "round189_belfast_deep_committee"
  ].map((name) => `tmp/subagents/${name}/candidates.json`)
];

const SOURCES = {
  cathedralGardens: {
    source_id: "bcc-cathedral-gardens-round195",
    source_name: "Cathedral Gardens",
    publisher: "Belfast City Council",
    source_type: "official council project/status page",
    source_family: "BCC physical investment project pages",
    source_url: "https://www.belfastcity.gov.uk/cathedralgardens",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  giantsPark: {
    source_id: "bcc-giants-park-round195",
    source_name: "Giant's Park - North Foreshore",
    publisher: "Belfast City Council",
    source_type: "official council project/status page",
    source_family: "BCC physical investment project pages",
    source_url: "https://www.belfastcity.gov.uk/giantspark",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  futureCity: {
    source_id: "bcc-future-city-centre-programme-round195",
    source_name: "Future City Centre Programme",
    publisher: "Belfast City Council",
    source_type: "official council regeneration/status page",
    source_family: "BCC regeneration pages",
    source_url: "https://www.belfastcity.gov.uk/futurecity",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  vacantToVibrant: {
    source_id: "bcc-vacant-to-vibrant-round195",
    source_name: "Vacant to Vibrant scheme",
    publisher: "Belfast City Council",
    source_type: "official council grant/status page",
    source_family: "BCC regeneration/grant pages",
    source_url: "https://www.belfastcity.gov.uk/vacanttovibrant",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  belfastWifi: {
    source_id: "bcc-belfastwifi-round195",
    source_name: "BelfastWiFi",
    publisher: "Belfast City Council",
    source_type: "official council digital infrastructure/status page",
    source_family: "BCC regeneration/digital infrastructure pages",
    source_url: "https://www.belfastcity.gov.uk/belfastwifi",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and third-party media before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  openData: {
    source_id: "bcc-open-linked-data-round195",
    source_name: "Open and linked data",
    publisher: "Belfast City Council",
    source_type: "official council open data page",
    source_family: "BCC open data pages",
    source_url: "https://www.belfastcity.gov.uk/Open-and-linked-data",
    license: "UK Open Government Licence v3.0 for listed open datasets where the page states OGL terms; verify dataset-specific metadata before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  dfcFiveCsScreening: {
    source_id: "dfc-five-cs-screening-round195",
    source_name: "The Five Cs Public Realm Project - screening",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department screening publication page",
    source_family: "DfC public realm/screening pages",
    source_url: "https://www.communities-ni.gov.uk/publications/five-cs-public-realm-project-screening",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify page-specific copyright and attachments before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  },
  dfcMagLivingHighStreets: {
    source_id: "dfc-mag-living-high-streets-round195",
    source_name: "Launch of the MAG Living High Streets initiative - in pictures",
    publisher: "Department for Communities, Northern Ireland",
    source_type: "official department gallery/news page",
    source_family: "DfC architecture and built environment pages",
    source_url: "https://www.communities-ni.gov.uk/galleries/launch-mag-living-high-streets-initiative-pictures",
    license: "UK Open Government Licence v3.0 where applicable to public-sector information; verify image-specific rights before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from the Department for Communities."
  }
};

const SEEDS = [
  {
    key: "cathedral_gardens_works_started_2026",
    source: "cathedralGardens",
    date: "2026-01",
    date_precision: "month",
    milestone_type: "public_realm_works_start_reported",
    title: "Cathedral Gardens transformation works started",
    summary: "Belfast City Council's Cathedral Gardens project page states that work started in January 2026 to transform the public space.",
    observed_change: "Official council project page records a works-start milestone for a public-space redevelopment; it does not record completion.",
    area: "Cathedral Gardens, Belfast",
    lat: 54.6032,
    lon: -5.9292,
    source_record_id: "Cathedral Gardens page: work started on the project in January 2026",
    source_date_field: "project page works-start statement",
    source_date_value: "2026-01",
    raw_source_hint: "Work started on the project in January 2026.",
    geometry_source: "Approximate point for Cathedral Gardens beside St Anne's Cathedral and Ulster University.",
    geometry_precision: "approximate public-space point, not a surveyed works boundary",
    limitations: "Works-start status only. The page anticipates reopening after this round's date window; do not infer completion, final layout, visitor use, memorial unveiling or public-realm outcomes."
  },
  {
    key: "cathedral_gardens_memorial_design_reported_2026",
    source: "cathedralGardens",
    date: "2026-01",
    date_precision: "month",
    milestone_type: "memorial_design_in_project_scope_reported",
    title: "Belfast Blitz Memorial was listed within Cathedral Gardens redevelopment scope",
    summary: "Belfast City Council's Cathedral Gardens page states that a dedicated Belfast Blitz Memorial will be installed as part of the redevelopment and names the artists working on designs.",
    observed_change: "Official council project page records a memorial-design/project-scope milestone. It is not evidence that the memorial has been installed.",
    area: "Cathedral Gardens / Belfast Blitz Memorial site",
    lat: 54.60325,
    lon: -5.92935,
    source_record_id: "Cathedral Gardens page: Belfast Blitz Memorial to be installed as part of redevelopment; artists named",
    source_date_field: "page current during January 2026 works-start stage",
    source_date_value: "2026-01",
    raw_source_hint: "A new dedicated memorial ... will be installed as part of the redevelopment of Cathedral Gardens.",
    geometry_source: "Approximate point inside Cathedral Gardens for candidate review.",
    geometry_precision: "approximate public-space point, not a memorial footprint",
    limitations: "Design/scope record only. Installation is anticipated after this round's date window and is not claimed here."
  },
  {
    key: "belfast_harbour_studios_opened_2017",
    source: "giantsPark",
    date: "2017",
    date_precision: "year",
    milestone_type: "film_studio_complex_opening_reported",
    title: "Belfast Harbour Studios opened at Giant's Park",
    summary: "Belfast City Council's Giant's Park page records that Belfast Harbour Commissioners opened a film studio complex on the North Foreshore site in 2017.",
    observed_change: "Official council project page records an opening year for a film studio complex at Giant's Park.",
    area: "Belfast Harbour Studios, Giant's Park / North Foreshore",
    lat: 54.6297,
    lon: -5.9043,
    source_record_id: "Giant's Park page: BHC opened a film studio complex on the site in 2017",
    source_date_field: "project page opening year",
    source_date_value: "2017",
    raw_source_hint: "Belfast Harbour Commissioners opened a film studio complex on the site in 2017.",
    geometry_source: "Approximate point for Belfast Harbour Studios within the Giant's Park / North Foreshore area.",
    geometry_precision: "approximate studio-site point, not a surveyed studio footprint",
    limitations: "Year-level opening status only. Do not infer occupancy, production activity, employment, economic effects or later extension dates."
  },
  {
    key: "belfast_harbour_studios_extension_current_status_2026",
    source: "giantsPark",
    date: "2026-05-19",
    date_precision: "retrieval_day_current_status",
    milestone_type: "film_studio_extension_current_status_reported",
    title: "Belfast Harbour Studios extension was reported complete on Giant's Park page",
    summary: "Belfast City Council's Giant's Park page, retrieved on 19 May 2026, states that Belfast Harbour Commissioners had recently completed a further extension to Belfast Harbour Studios.",
    observed_change: "Official council project page records a current-status completion statement for an extension. The exact completion date is not stated.",
    area: "Belfast Harbour Studios extension, Giant's Park / North Foreshore",
    lat: 54.6299,
    lon: -5.9032,
    source_record_id: "Giant's Park page: BHC has recently completed a further extension to the site",
    source_date_field: "retrieved current-status statement; exact completion date not on page",
    source_date_value: "2026-05-19",
    raw_source_hint: "BHC have recently completed a further extension to the site.",
    geometry_source: "Approximate point for the Belfast Harbour Studios extension area within Giant's Park.",
    geometry_precision: "approximate studio-site point, not a surveyed extension footprint",
    limitations: "Current-status record only. The source page does not give a completion day or month; production import should corroborate timing from BHC, planning, or construction records."
  },
  {
    key: "future_city_five_cs_revitalisation_started_2023",
    source: "futureCity",
    date: "2023-02",
    date_precision: "month",
    milestone_type: "city_centre_public_realm_revitalisation_started",
    title: "Five Cs city-centre revitalisation work started",
    summary: "Belfast City Council's Future City Centre Programme page states that work started in February 2023 to improve several city-centre streets with painting, lighting, greenery, artwork and streetscape repairs.",
    observed_change: "Official council regeneration page records a works-start milestone for a city-centre public-realm revitalisation project.",
    area: "Callender Street, College Court, College Street, Upper Arthur Street and Patterson's Place",
    lat: 54.5967,
    lon: -5.9282,
    source_record_id: "Future City Centre Programme page: Five Cs city centre revitalisation project work started in February 2023",
    source_date_field: "project page works-start statement",
    source_date_value: "2023-02",
    raw_source_hint: "We started work in February 2023 to improve the appearance of several Belfast city centre streets.",
    geometry_source: "Approximate centre point for the named Five Cs revitalisation street cluster.",
    geometry_precision: "approximate multi-street project point, not surveyed streetscape geometry",
    limitations: "Works-start record only. The source lists project streets but does not provide as-built geometry, exact completion date or measured public-realm changes."
  },
  {
    key: "future_city_five_cs_project_scope_reported_2026",
    source: "futureCity",
    date: "2026-05-19",
    date_precision: "retrieval_day_current_status",
    milestone_type: "public_realm_project_scope_current_status",
    title: "Future City Centre page listed Five Cs public realm scheme streets",
    summary: "Belfast City Council's Future City Centre Programme page, retrieved on 19 May 2026, lists the Five Cs public realm scheme streets: Chichester Street, Callender Street, College Avenue, College Court and College Street.",
    observed_change: "Official council regeneration page records the current scope of a public-realm scheme. It is not a construction or completion claim.",
    area: "Five Cs public realm project area, Belfast city centre",
    lat: 54.5969,
    lon: -5.9278,
    source_record_id: "Future City Centre Programme page: Five Cs project includes Chichester Street, Callender Street, College Avenue, College Court, College Street",
    source_date_field: "retrieved current-status project scope",
    source_date_value: "2026-05-19",
    raw_source_hint: "The project includes Chichester Street, Callender Street, College Avenue, College Court, College Street.",
    geometry_source: "Approximate centre point for the source-described Five Cs street cluster.",
    geometry_precision: "approximate multi-street project point, not surveyed project geometry",
    limitations: "Scope/current-status record only. Do not infer delivery, completion, construction timing, private investment or access outcomes."
  },
  {
    key: "dfc_five_cs_screening_published_2024",
    source: "dfcFiveCsScreening",
    date: "2024-11-13",
    date_precision: "day",
    milestone_type: "public_realm_screening_publication",
    title: "Five Cs Public Realm Project screening was published",
    summary: "The Department for Communities published screening for the Five Cs Public Realm Project on 13 November 2024, with the screening date recorded as 12 November 2024.",
    observed_change: "Official department publication page records an administrative screening milestone for a public-realm scheme.",
    area: "Five Cs public realm project area, Belfast city centre",
    lat: 54.5969,
    lon: -5.9278,
    source_record_id: "DfC publication page: Five Cs Public Realm Project screening; Date published 13 November 2024; Date of Screening 12/11/2024",
    source_date_field: "date published",
    source_date_value: "2024-11-13",
    raw_source_hint: "Date published: 13 November 2024; Date of Screening: 12/11/2024.",
    geometry_source: "Approximate centre point for College Court, College Street, Callender Street, Upper Arthur Street and Montgomery Street sections described on the DfC page.",
    geometry_precision: "approximate multi-street project point, not surveyed scheme boundary",
    limitations: "Screening/publication record only. Do not infer construction, completion, final design, access changes or surrounding private-sector investment effects."
  },
  {
    key: "vacant_to_vibrant_citywide_update_2026",
    source: "vacantToVibrant",
    date: "2026-05-14",
    date_precision: "day",
    milestone_type: "vacant_property_grant_scheme_status_update",
    title: "Vacant to Vibrant citywide scheme status was updated",
    summary: "Belfast City Council's Vacant to Vibrant page records a 14 May 2026 update that citywide funding beyond the city-centre boundary was open for applications.",
    observed_change: "Official council grant page records an administrative funding/status milestone for a citywide vacant-property reuse programme.",
    area: "Belfast citywide Vacant to Vibrant scheme",
    lat: 54.5964,
    lon: -5.9302,
    source_record_id: "Vacant to Vibrant scheme update on 14 May 2026: citywide funding open for applications",
    source_date_field: "page update date",
    source_date_value: "2026-05-14",
    raw_source_hint: "Vacant to Vibrant scheme update on 14 May 2026 ... citywide funding ... open for applications.",
    geometry_source: "Representative point at Belfast City Hall for a citywide programme-level record.",
    geometry_precision: "representative programme point, not a premises or grant-site coordinate",
    limitations: "Programme status only. This candidate does not identify individual buildings, approvals, works, openings, vacancy reduction or economic outcomes."
  },
  {
    key: "vacant_to_vibrant_citywide_first_round_24_applications_2026",
    source: "vacantToVibrant",
    date: "2026-05-14",
    date_precision: "day",
    milestone_type: "vacant_property_grant_first_round_reported",
    title: "Vacant to Vibrant citywide first round approvals were reported",
    summary: "Belfast City Council's Vacant to Vibrant page states that 24 applications were approved in the first citywide funding round for properties outside the city-centre boundary.",
    observed_change: "Official council grant page records a programme-level approval count. It is not evidence that every premises has completed works or reopened.",
    area: "Belfast citywide Vacant to Vibrant scheme",
    lat: 54.5964,
    lon: -5.9302,
    source_record_id: "Vacant to Vibrant page: approved 24 applications to the first round of citywide funding",
    source_date_field: "page update date used for current programme status",
    source_date_value: "2026-05-14",
    raw_source_hint: "We approved 24 applications to the first round of Vacant to Vibrant Citywide funding.",
    geometry_source: "Representative point at Belfast City Hall for a citywide programme-level record.",
    geometry_precision: "representative programme point, not a premises or grant-site coordinate",
    limitations: "Aggregated programme record only. Individual premises, exact approval dates, works completion and reuse status require grant-level evidence."
  },
  {
    key: "vacant_to_vibrant_city_centre_48_applicants_reported_2026",
    source: "vacantToVibrant",
    date: "2026-05-14",
    date_precision: "day",
    milestone_type: "vacant_property_grant_city_centre_reported",
    title: "Vacant to Vibrant city-centre grant approvals were reported",
    summary: "Belfast City Council's Vacant to Vibrant page states that 48 applicants were approved for city-centre grants and that the city-centre pot had been fully allocated.",
    observed_change: "Official council grant page records a programme-level approval/allocation status for city-centre vacant-property reuse grants.",
    area: "Belfast city centre Vacant to Vibrant scheme",
    lat: 54.5967,
    lon: -5.929,
    source_record_id: "Vacant to Vibrant page: approved 48 applicants for a city-centre grant; city-centre pot fully allocated",
    source_date_field: "page update date used for current programme status",
    source_date_value: "2026-05-14",
    raw_source_hint: "We approved 48 applicants for a Vacant to Vibrant grant in Belfast city centre.",
    geometry_source: "Representative point at Belfast City Hall for a city-centre programme-level record.",
    geometry_precision: "representative programme point, not a premises or grant-site coordinate",
    limitations: "Aggregated grant status only. It does not identify the 48 premises, works dates, completion, tenancy, jobs, vacancy outcomes or heritage condition."
  },
  {
    key: "belfastwifi_109_hotspots_current_status_2026",
    source: "belfastWifi",
    date: "2026-05-19",
    date_precision: "retrieval_day_current_status",
    milestone_type: "public_wifi_network_current_status",
    title: "BelfastWiFi page reported 109 public hotspots",
    summary: "Belfast City Council's BelfastWiFi page, retrieved on 19 May 2026, states that the free public Wi-Fi network is available at 109 hotspots including visitor attractions, community and leisure centres and other public buildings.",
    observed_change: "Official council page records a current-status count for public digital infrastructure.",
    area: "BelfastWiFi network",
    lat: 54.5964,
    lon: -5.9302,
    source_record_id: "BelfastWiFi page: network available at 109 hotspots",
    source_date_field: "retrieved current-status statement",
    source_date_value: "2026-05-19",
    raw_source_hint: "The network is available at 109 hotspots.",
    geometry_source: "Representative point at Belfast City Hall for a distributed city network.",
    geometry_precision: "representative network point, not hotspot coordinates",
    limitations: "Current-status network count only. The page does not provide launch dates, hotspot list geometry, uptime, bandwidth, usage or coverage quality."
  },
  {
    key: "open_linked_data_page_updated_2026",
    source: "openData",
    date: "2026-02-24",
    date_precision: "day",
    milestone_type: "open_data_portal_update",
    title: "Belfast open and linked data page was updated",
    summary: "Belfast City Council's Open and linked data page is marked last updated 24 February 2026 and states that listed open data is free to use under the Open Government Licence.",
    observed_change: "Official council page records a data-publication/governance update relevant to source provenance and reuse.",
    area: "Belfast City Council open data",
    lat: 54.5964,
    lon: -5.9302,
    source_record_id: "Open and linked data page: Last updated 24 February 2026; OGL statement for listed open data",
    source_date_field: "last updated date",
    source_date_value: "2026-02-24",
    raw_source_hint: "Last updated: 24 February 2026; free to use for any legal purpose under the Open Government Licence.",
    geometry_source: "Representative point at Belfast City Hall for a council open-data governance record.",
    geometry_precision: "representative civic data point, not a physical asset location",
    limitations: "Data governance/source-availability record only. It is not a physical built-environment change and should be kept out of headline built totals unless explicitly included as provenance infrastructure."
  },
  {
    key: "mag_living_high_streets_launch_belfast_2024",
    source: "dfcMagLivingHighStreets",
    date: "2024-02-28",
    date_precision: "day",
    milestone_type: "architecture_built_environment_initiative_launch",
    title: "MAG Living High Streets initiative launch was held at Crumlin Road Gaol",
    summary: "The Department for Communities gallery records that the MAG Living High Streets initiative launch was held on 28 February 2024 at Crumlin Road Gaol, Belfast.",
    observed_change: "Official department page records an architecture and built-environment initiative launch event. It does not record physical works.",
    area: "Crumlin Road Gaol, Belfast",
    lat: 54.6076,
    lon: -5.9428,
    source_record_id: "DfC gallery: launch on 28 February 2024 at Crumlin Road Gaol, Belfast",
    source_date_field: "event date stated on page",
    source_date_value: "2024-02-28",
    raw_source_hint: "Over eighty attended the launch on 28 February 2024 at Crumlin Road Gaol, Belfast.",
    geometry_source: "Approximate point for Crumlin Road Gaol.",
    geometry_precision: "approximate venue point, not a project boundary",
    limitations: "Initiative/event record only. Do not infer high-street physical changes, funding awards, design adoption or later regeneration outcomes."
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "_").slice(0, 90);
}

function readJsonIfExists(filePath) {
  const absolute = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(absolute)) return null;
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    return { __read_error: error.message };
  }
}

function collectRecords(node, records = []) {
  if (!node || typeof node !== "object") return records;
  if (Array.isArray(node)) {
    for (const item of node) collectRecords(item, records);
    return records;
  }
  if (node.event_id || node.candidate_id || node.source_record_id || node.title) {
    records.push(node);
  }
  for (const key of ["events", "candidates", "features", "rejected"]) {
    if (node[key]) collectRecords(node[key], records);
  }
  if (node.properties) {
    records.push({ ...node.properties, geometry: node.geometry });
  }
  return records;
}

function dateOf(record) {
  return record.date || record.effective_date || record.source_date_value || record.year || "";
}

function makeDedupeIndex() {
  const index = {
    eventIds: new Map(),
    sourceDate: new Map(),
    titleDate: new Map(),
    files: []
  };
  for (const relPath of DEDUPE_FILES) {
    const json = readJsonIfExists(relPath);
    if (!json || json.__read_error) continue;
    const records = collectRecords(json);
    index.files.push({ path: relPath, record_count: records.length });
    for (const record of records) {
      const id = record.event_id || record.candidate_id || record.id;
      const title = record.title || record.properties?.title;
      const sourceRecord = record.source_record_id || record.provenance?.source_record_id;
      const sourceUrl = record.source_url || record.provenance?.source_url;
      const date = dateOf(record);
      if (id) index.eventIds.set(normalize(id), { path: relPath, id });
      if (title && date) index.titleDate.set(`${normalize(title)}|${date}`, { path: relPath, title, date });
      if ((sourceRecord || sourceUrl) && date) {
        index.sourceDate.set(`${normalize(sourceRecord || sourceUrl)}|${date}`, {
          path: relPath,
          source_record_id: sourceRecord,
          source_url: sourceUrl,
          date
        });
      }
    }
  }
  return index;
}

function inDateWindow(date) {
  const value = String(date);
  return value >= DATE_START && value <= DATE_END;
}

function inBelfast(seed) {
  return (
    seed.lat >= BELFAST_BBOX.minLat &&
    seed.lat <= BELFAST_BBOX.maxLat &&
    seed.lon >= BELFAST_BBOX.minLon &&
    seed.lon <= BELFAST_BBOX.maxLon
  );
}

function candidateFromSeed(seed) {
  const source = SOURCES[seed.source];
  const id = `${ROUND_ID}_${slugify(seed.key)}`;
  const limitations = Array.isArray(seed.limitations)
    ? seed.limitations
    : [
        seed.limitations,
        "Observed/source-reported or administrative milestone only; no causation, forecast, usage, economic, environmental or social outcome is claimed.",
        "Point geometry is approximate review geometry for the named site, street cluster, venue or programme area, not surveyed asset geometry."
      ];
  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: id,
    event_id: id,
    event_id_suggestion: `bfs_arch_${id}`,
    date: seed.date,
    effective_date: seed.date,
    effective_date_range: seed.effective_date_range || null,
    date_precision: seed.date_precision,
    bucket: "planning/development/architecture/public-realm/facility/admin-tail",
    event_family: "architecture/official-public-tail-record",
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
    source_family: source.source_family,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    accessed_at: RETRIEVED_AT,
    retrieved_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: seed.source_date_field,
    source_date_value: seed.source_date_value,
    confidence: seed.confidence || "documented",
    architect: seed.architect || "Source record does not name a project architect.",
    project_type: seed.project_type || seed.milestone_type.replace(/_/g, " "),
    geometry_source: seed.geometry_source,
    geometry_precision: seed.geometry_precision,
    limitations,
    transformation_method:
      "Round 195 conservative Belfast deep-tail ETL: official/public BCC and DfC source-family records were manually seeded, normalized into candidate event records, checked against Belfast/date/provenance requirements, and de-duplicated against the current corpus, atlas chunks, prior Belfast packs, and rounds 177/183/189 by event_id, source-record/date and title/date keys.",
    raw_source_hint: seed.raw_source_hint,
    audit: {
      seed_key: seed.key,
      source_record_id: seed.source_record_id
    }
  };
}

async function fetchAudit(source) {
  const started = Date.now();
  try {
    const response = await fetch(source.source_url, {
      headers: { "user-agent": "Bims-5 round195 source auditor (public source check)" }
    });
    const body = await response.text();
    return {
      ...baseAudit(source),
      final_url: response.url,
      retrieval: {
        retrieved_at: RETRIEVED_AT,
        http_status: response.status,
        ok: response.ok,
        elapsed_ms: Date.now() - started,
        content_sha256: crypto.createHash("sha256").update(body).digest("hex"),
        error: null
      }
    };
  } catch (error) {
    return {
      ...baseAudit(source),
      final_url: source.source_url,
      retrieval: {
        retrieved_at: RETRIEVED_AT,
        http_status: null,
        ok: false,
        elapsed_ms: Date.now() - started,
        content_sha256: null,
        error: error.message
      }
    };
  }
}

function baseAudit(source) {
  return {
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    url: source.source_url,
    source_type: source.source_type,
    source_family: source.source_family,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    coverage_years: "Source-specific Belfast project, status, screening, programme or initiative records within 2008-01-01 to 2026-05-19 where a source-stated date or current-status retrieval date is present.",
    update_frequency: source.source_type.includes("status") || source.source_type.includes("page")
      ? "Project/status page; may be updated by publisher."
      : "Published record; not continuously updated except corrections.",
    geographic_scope: "Belfast named site, street cluster, city-centre area, venue, or distributed council programme.",
    granularity: "Site, street cluster, project page, programme-level status, or administrative publication record.",
    key_fields: [
      "source page title",
      "publication/status/date field",
      "named place/project/programme",
      "publisher",
      "source URL",
      "licence/attribution"
    ],
    reliability_assessment: "usable with caveats",
    required_caveats: [
      "Use source-reported dates as administrative, observed, works-start, publication, or current-status dates only.",
      "Approximate candidate geometry must be reviewed before production import.",
      "Do not infer causation, impacts, usage, vacancy outcomes, access quality, construction completion, or final design from status/screening/programme records."
    ],
    ingestion_recommendation: "Candidate-level ingestion after duplicate, timing, and geometry review."
  };
}

function duplicateReason(candidate, index, acceptedKeys) {
  const eventKey = normalize(candidate.event_id);
  const sourceKey = `${normalize(candidate.source_record_id || candidate.source_url)}|${candidate.date}`;
  const titleKey = `${normalize(candidate.title)}|${candidate.date}`;
  if (index.eventIds.has(eventKey)) return { reason: "duplicate_event_id_existing", match: index.eventIds.get(eventKey) };
  if (index.sourceDate.has(sourceKey)) return { reason: "duplicate_source_record_date_existing", match: index.sourceDate.get(sourceKey) };
  if (index.titleDate.has(titleKey)) return { reason: "duplicate_title_date_existing", match: index.titleDate.get(titleKey) };
  if (acceptedKeys.sourceDate.has(sourceKey)) return { reason: "duplicate_source_record_date_within_round", match: acceptedKeys.sourceDate.get(sourceKey) };
  if (acceptedKeys.titleDate.has(titleKey)) return { reason: "duplicate_title_date_within_round", match: acceptedKeys.titleDate.get(titleKey) };
  return null;
}

function countBy(records, field) {
  return records.reduce((counts, record) => {
    const value = record[field] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function yearOf(date) {
  return String(date).slice(0, 4);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dedupeIndex = makeDedupeIndex();
  const acceptedKeys = { sourceDate: new Map(), titleDate: new Map() };
  const accepted = [];
  const rejected = [];

  for (const seed of SEEDS) {
    const candidate = candidateFromSeed(seed);
    const reasons = [];
    if (!SOURCES[seed.source]) reasons.push("missing_source_definition");
    if (!inDateWindow(candidate.date)) reasons.push("outside_date_window");
    if (!inBelfast(seed)) reasons.push("outside_belfast_bbox");
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
      "transformation_method"
    ]) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        reasons.push(`missing_required_${field}`);
      }
    }
    const duplicate = duplicateReason(candidate, dedupeIndex, acceptedKeys);
    if (duplicate) reasons.push(duplicate.reason);

    if (reasons.length || accepted.length >= TARGET_CAP) {
      rejected.push({
        seed_key: seed.key,
        title: candidate.title,
        date: candidate.date,
        source_url: candidate.source_url,
        reasons,
        duplicate_match: duplicate?.match || null,
        rejected_stage: reasons.length ? "validation_or_dedupe" : "target_cap"
      });
      continue;
    }
    accepted.push(candidate);
    acceptedKeys.sourceDate.set(`${normalize(candidate.source_record_id || candidate.source_url)}|${candidate.date}`, candidate.event_id);
    acceptedKeys.titleDate.set(`${normalize(candidate.title)}|${candidate.date}`, candidate.event_id);
  }

  accepted.sort((a, b) => `${a.date}|${a.event_id}`.localeCompare(`${b.date}|${b.event_id}`));

  const sourceIds = [...new Set(accepted.map((candidate) => candidate.source_id))].sort();
  const sourceUrls = [...new Set(accepted.map((candidate) => candidate.source_url))].sort();
  const audits = await Promise.all(sourceIds.map((id) => fetchAudit(Object.values(SOURCES).find((source) => source.source_id === id))));
  const dateValues = accepted.map((candidate) => candidate.date).sort();
  const summary = {
    schema_version: "round195.belfast_deep_tail.summary.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    target_candidate_cap: TARGET_CAP,
    seed_count: SEEDS.length,
    accepted_candidates: accepted.length,
    rejected_candidates: rejected.length,
    date_window: { start: DATE_START, end: DATE_END },
    emitted_date_range: {
      min: dateValues[0] || null,
      max: dateValues[dateValues.length - 1] || null
    },
    counts_by_year: accepted.reduce((counts, candidate) => {
      const year = yearOf(candidate.date);
      counts[year] = (counts[year] || 0) + 1;
      return counts;
    }, {}),
    counts_by_source_id: countBy(accepted, "source_id"),
    counts_by_source_name: countBy(accepted, "source_name"),
    counts_by_milestone_type: countBy(accepted, "milestone_type"),
    source_mix: countBy(accepted, "source_family"),
    source_audit: {
      audited_sources: audits.length,
      retrieved_ok: audits.filter((audit) => audit.retrieval.ok).length,
      retrieval_failures: audits.filter((audit) => !audit.retrieval.ok).map((audit) => ({
        source_id: audit.source_id,
        url: audit.url,
        error: audit.retrieval.error,
        http_status: audit.retrieval.http_status
      }))
    },
    dedupe: {
      indexed_files: dedupeIndex.files,
      indexed_event_ids: dedupeIndex.eventIds.size,
      indexed_source_date_keys: dedupeIndex.sourceDate.size,
      indexed_title_date_keys: dedupeIndex.titleDate.size,
      explicit_duplicate_exclusion_rounds: [
        "round177_belfast_official_architecture_expansion",
        "round183_belfast_deep_public_realm",
        "round189_belfast_deep_committee"
      ]
    },
    outputs: {
      candidates: "tmp/subagents/round195_belfast_deep_tail/candidates.json",
      source_audit: "tmp/subagents/round195_belfast_deep_tail/source_audit.json",
      summary: "tmp/subagents/round195_belfast_deep_tail/summary.json",
      notes: "tmp/subagents/round195_belfast_deep_tail/notes.md",
      rejected: "tmp/subagents/round195_belfast_deep_tail/rejected.json"
    }
  };

  fs.writeFileSync(
    OUTPUTS.candidates,
    JSON.stringify(
      {
        schema_version: "round195.belfast_deep_tail.candidates.v1",
        generated_at: RETRIEVED_AT,
        accessed_at: RETRIEVED_AT,
        city_id: "belfast",
        target_candidate_cap: TARGET_CAP,
        candidate_count: accepted.length,
        source_ids: sourceIds,
        source_urls: sourceUrls,
        deduped_against: DEDUPE_FILES,
        scope_note:
          "Conservative Belfast deep-tail candidates from official/public BCC and DfC project, status, regeneration, public realm, digital infrastructure, open-data and architecture initiative source families. Records use source-backed observed/admin wording only.",
        candidates: accepted
      },
      null,
      2
    ) + "\n"
  );
  fs.writeFileSync(
    OUTPUTS.sourceAudit,
    JSON.stringify(
      {
        schema_version: "round195.belfast_deep_tail.source_audit.v1",
        generated_at: RETRIEVED_AT,
        city_id: "belfast",
        audit: audits
      },
      null,
      2
    ) + "\n"
  );
  fs.writeFileSync(OUTPUTS.summary, JSON.stringify(summary, null, 2) + "\n");
  fs.writeFileSync(
    OUTPUTS.rejected,
    JSON.stringify(
      {
        schema_version: "round195.belfast_deep_tail.rejected.v1",
        generated_at: RETRIEVED_AT,
        city_id: "belfast",
        rejected_count: rejected.length,
        rejected
      },
      null,
      2
    ) + "\n"
  );
  fs.writeFileSync(
    OUTPUTS.notes,
    [
      "# Round 195 Belfast Deep Tail Notes",
      "",
      "Created a scratch-only conservative candidate pack from official/public Belfast City Council and Department for Communities source families.",
      "",
      "## Included source families",
      "",
      "- BCC physical investment project/status pages: Cathedral Gardens and Giant's Park.",
      "- BCC regeneration/status pages: Future City Centre Programme, Vacant to Vibrant, BelfastWiFi, and Open and linked data.",
      "- DfC public realm / architecture pages: Five Cs screening and MAG Living High Streets launch.",
      "",
      "## Dedupe",
      "",
      "The generator indexes the current architecture milestone corpus, Belfast atlas event chunks, prior Belfast candidate packs, and explicitly rounds 177, 183, and 189. It rejects duplicate event_id, source-record/date, and title/date keys.",
      "",
      "## Caveats",
      "",
      "- Several records are programme, current-status, publication, screening, works-start, or initiative-launch milestones rather than completed physical works.",
      "- Point geometries are review coordinates only; they are not surveyed boundaries, parcels, asset footprints, hotspot locations, or street alignments.",
      "- Current-status records use the retrieval date because the source page did not state an exact effective date. They should be corroborated before production import.",
      "- No candidate claims causation, impact, usage, vacancy reduction, access quality, economic effect, or forecast outcome.",
      "",
      `Accepted candidates: ${accepted.length}`,
      `Rejected seeds: ${rejected.length}`,
      ""
    ].join("\n")
  );

  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        accepted_candidates: accepted.length,
        rejected_candidates: rejected.length,
        out_dir: path.relative(ROOT_DIR, OUT_DIR)
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
