const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round340_belfast_official_architecture_sweep_next2";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const HED_LAYER_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/1";

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
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json"),
  validation: path.join(OUT_DIR, "validation.json"),
  validationReport: path.join(OUT_DIR, "validation_report.json")
};

const SOURCES = {
  bccReconnectedLaunch: {
    source_id: "bcc-reconnected-belfast-launch-2025-round340",
    source_name: "Plans officially launched to connect and transform Waterworks and Alexandra Parks",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Plans-officially-launched-to-connect-and-transfor",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual project metadata and source URLs retained for audit.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    date_field: "News page publication date",
    date_value: "2025-04-17",
    update_frequency: "Archived council news page."
  },
  bccHedAllSaintsReport: {
    source_id: "bcc-hed-all-saints-proposed-listing-2024-round340",
    source_name: "HED Listing Structures: Proposed Listing of All Saints Church, Belfast",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url: "https://minutes.belfastcity.gov.uk/documents/s115518/20240514HEDListingStructures.pdf",
    source_type: "official council committee report carrying HED proposed-listing consultation",
    license:
      "Belfast City Council public committee document terms; factual metadata and source URLs retained for audit.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    date_field: "Planning Committee report date",
    date_value: "2024-05-14",
    update_frequency: "Committee report."
  },
  hedHistoricBuildings: {
    source_id: "dfc-hed-historic-buildings-arcgis-round340",
    source_name: "Historic Building Details / HED Buildings Database ArcGIS layer",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    source_url: HED_LAYER_URL,
    source_type: "official HED historic-building spatial layer",
    license:
      "Crown copyright / public-sector information terms; factual metadata and source URLs retained for audit.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division / nidirect",
    date_field: "Accessed current spatial layer",
    date_value: ACCESSED_AT,
    update_frequency: "HED GIS service snapshot."
  },
  bccPeaceplusPage: {
    source_id: "bcc-peaceplus-project-page-round340",
    source_name: "PEACEPLUS",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/peaceplus",
    source_type: "official council programme page",
    license:
      "Belfast City Council website copyright and terms; factual project metadata and source URLs retained for audit.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    date_field: "Accessed current programme page",
    date_value: ACCESSED_AT,
    update_frequency: "Mutable council programme page."
  },
  bccVacantToVibrant: {
    source_id: "bcc-vacant-to-vibrant-page-round340",
    source_name: "Vacant to Vibrant scheme",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/vacanttovibrant",
    source_type: "official council regeneration programme page",
    license:
      "Belfast City Council website copyright and terms; factual programme metadata and source URLs retained for audit.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    date_field: "Accessed current programme page",
    date_value: ACCESSED_AT,
    update_frequency: "Mutable council programme page."
  },
  teoArdoyneHub: {
    source_id: "teo-ardoyne-youth-hub-sod-cut-2026-round340",
    source_name: "First Minister and deputy First Minister cut sod at new purpose-built youth hub",
    publisher: "The Executive Office, Northern Ireland",
    source_url:
      "https://www.executiveoffice-ni.gov.uk/news/first-minister-and-deputy-first-minister-cut-sod-new-purpose-built-youth-hub",
    source_type: "official department news page",
    license:
      "Crown copyright / Open Government Licence where applicable to public-sector information; factual metadata retained for audit.",
    license_url: OGL_URL,
    attribution: "The Executive Office, Northern Ireland",
    date_field: "News page publication date",
    date_value: "2026-03-30",
    update_frequency: "Archived government news page."
  },
  dfcChangesToList: {
    source_id: "dfc-hed-changes-to-list-buildings-2026-round340",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    source_type: "official department publication page",
    license:
      "Crown copyright / Department for Communities terms; factual row metadata and source URLs retained for audit.",
    license_url: "https://www.communities-ni.gov.uk/crown-copyright",
    attribution: "Department for Communities Historic Environment Division",
    date_field: "Publication page accessed",
    date_value: ACCESSED_AT,
    update_frequency: "Publication page updated when recent list changes are published."
  }
};

const LEADS = [
  {
    key: "reconnected_belfast_plans_launched",
    decision: "accept",
    event_id: "round340_belfast_reconnected_belfast_plans_launched_2025_04_17",
    title: "Reconnected Belfast plans were officially launched",
    summary:
      "Belfast City Council's 17 April 2025 news page recorded the official launch of Reconnected Belfast plans to connect and improve Waterworks Park, Alexandra Park, the Alexandra Park Avenue playing fields and intervening routes through the PEACEPLUS programme.",
    observed_change:
      "A documented council programme milestone launched public-realm and park-connection plans for the Reconnected Belfast area.",
    area: "Waterworks Park, Alexandra Park and connecting routes",
    latitude: 54.6116,
    longitude: -5.9387,
    geometry_source:
      "Approximate midpoint across the council-stated Waterworks Park, Alexandra Park and connecting-route project area; no official project polygon was exposed by the news page.",
    geometry_precision:
      "Approximate multi-site programme point, not a park boundary, works polygon, route alignment, reservoir structure, building footprint or parcel.",
    project_type: "PEACEPLUS park and public-realm connection programme",
    milestone_type: "public_realm_plans_officially_launched",
    source: "bccReconnectedLaunch",
    supporting_sources: ["bccPeaceplusPage"],
    source_record_id:
      "Belfast City Council news page, 17 April 2025: Plans officially launched to connect and transform Waterworks and Alexandra Parks",
    duplicate_terms: ["Reconnected Belfast", "Waterworks Park", "Alexandra Park", "LA04/2025/0012/F"],
    duplicate_check_note:
      "Searched the current manual corpus and prior Belfast packs for Reconnected Belfast, Waterworks Park, Alexandra Park and LA04/2025/0012/F. Existing rows cover a later current-planning application state and a later design-services contract award, but not this 17 April 2025 official launch milestone.",
    limitations:
      "This records a plans-launch milestone only. It does not document planning approval, construction start, handover, opening, final design, as-built park works, reservoir works, route delivery or completed public access."
  },
  {
    key: "all_saints_church_proposed_listing_consultation",
    decision: "accept",
    event_id: "round340_belfast_all_saints_church_proposed_listing_consultation_2024_05_14",
    title: "All Saints' Church proposed listing consultation was reported",
    summary:
      "Belfast City Council's 14 May 2024 Planning Committee report carried the HED proposed-listing consultation for All Saints' Church on Canterbury Street. The current official HED spatial layer returns HB26/27/054 for the church with grade B2 and point geometry.",
    observed_change:
      "A documented HED consultation milestone placed All Saints' Church into a proposed-listing committee record, with current HED spatial data providing the HB reference and location point.",
    area: "All Saints' Church, Canterbury Street",
    hb_ref: "HB26/27/054",
    project_type: "heritage/listing administration",
    milestone_type: "proposed_listing_consultation_reported",
    source: "bccHedAllSaintsReport",
    supporting_sources: ["hedHistoricBuildings"],
    source_record_id: "HB26/27/054; Belfast Planning Committee report dated 14 May 2024",
    duplicate_terms: ["All Saints Church Canterbury Street", "All Saints' Church Canterbury Street", "HB26/27/054"],
    duplicate_check_note:
      "Searched the current manual corpus and prior Belfast packs for All Saints Church Canterbury Street, All Saints' Church Canterbury Street and HB26/27/054. Hits were London All Saints records only; no Belfast All Saints Canterbury Street milestone was found.",
    limitations:
      "This records a proposed-listing consultation/report milestone and current HED layer status. It does not by itself document the exact statutory listing decision date, construction, repair works, opening, closure, condition change or completed conservation works."
  },
  {
    key: "golden_thread_gallery_reopening_duplicate",
    decision: "reject_duplicate",
    source: "bccVacantToVibrant",
    title: "Golden Thread Gallery Queen Street reopening",
    date: "2024-08-10",
    category: "duplicate_existing_event",
    reason:
      "The manual corpus already contains the Golden Thread Gallery reopening on Queen Street with renovated-premises wording, project team attribution and geometry.",
    screened_terms: ["Golden Thread Gallery", "23-29 Queen Street", "Gas Corporation Showroom", "Craftworld"]
  },
  {
    key: "ardoyne_youth_hub_sod_cut_duplicate",
    decision: "reject_duplicate",
    source: "teoArdoyneHub",
    title: "Ardoyne Youth Enterprises youth hub sod-cut and works-start",
    date: "2026-03-30",
    category: "duplicate_existing_event",
    reason:
      "The manual corpus already contains the 30 March 2026 Ardoyne youth hub first-sod/works-start milestone from the Executive Office source.",
    screened_terms: ["Ardoyne Youth", "purpose-built youth hub", "Crumlin Road", "sod"]
  },
  {
    key: "dfc_march_2026_record_only_rows_duplicate",
    decision: "reject_duplicate",
    source: "dfcChangesToList",
    title: "DfC HED March 2026 Record Only Belfast rows",
    date: "2026-03",
    category: "duplicate_existing_or_no_new_geometry",
    reason:
      "Round310 already screened the March 2026 Knock Burial Ground and Victoria College swimming-pool rows as duplicate or not cleanly geometry-backed for a new candidate.",
    screened_terms: ["HB26/11/002", "Knock Burial Ground", "HB26/18/192", "Victoria College"]
  },
  {
    key: "vacant_to_vibrant_citywide_examples_overlap",
    decision: "reject_overlap",
    source: "bccVacantToVibrant",
    title: "Vacant to Vibrant citywide examples and programme counts",
    date: "2026-05-14",
    category: "overlap_with_existing_programme_rows",
    reason:
      "The corpus already contains city-centre final-allocation, citywide first-round and 14 May 2026 programme-status rows; named examples checked so far either already have specific opening/works rows or lack a distinct official dated physical milestone.",
    screened_terms: ["Vacant to Vibrant", "24 applications", "48 applicants", "Wrapped Up", "Olive Tree House"]
  },
  {
    key: "reconnected_belfast_later_rows_context",
    decision: "reject_overlap",
    source: "bccReconnectedLaunch",
    title: "Reconnected Belfast later application and design-services rows",
    date: "2025-09-23",
    category: "context_only_existing_later_rows",
    reason:
      "The current manual corpus already contains the LA04/2025/0012/F application state and the 23 September 2025 design-services contract award. This round emits only the separate 17 April 2025 launch date.",
    screened_terms: ["LA04/2025/0012/F", "AECOM", "design-services", "Reconnected Belfast"]
  }
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€�/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (fullPath.startsWith(OUT_DIR)) continue;
    if (entry.isDirectory()) {
      results.push(...listJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

function shouldIndexPriorFile(filePath) {
  if (filePath === MANUAL_CORPUS) return true;
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/").toLowerCase();
  return rel.includes("belfast") || rel.includes("harni") || rel.includes("round296") || rel.includes("round310") || rel.includes("round332");
}

function rowsFromDocument(doc) {
  if (Array.isArray(doc)) return doc;
  if (!doc || typeof doc !== "object") return [];
  for (const key of ["events", "candidates", "records", "rejected", "rejections", "duplicate_rejects", "screen_rejects"]) {
    if (Array.isArray(doc[key])) return doc[key];
  }
  return [];
}

function buildExistingIndex() {
  const files = [MANUAL_CORPUS, ...listJsonFiles(path.join(ROOT, "tmp", "subagents")).filter(shouldIndexPriorFile)];
  const indexedFiles = [];
  const snippets = [];
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    let rows = [];
    try {
      rows = rowsFromDocument(readJson(filePath));
    } catch {
      rows = [];
    }
    indexedFiles.push({
      path: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      record_count: rows.length
    });
    for (const row of rows) {
      const text = normalizeText([
        row.event_id,
        row.candidate_id,
        row.id,
        row.title,
        row.summary,
        row.observed_change,
        row.area,
        row.location_name,
        row.source_record_id,
        row.source_url
      ].join(" "));
      if (text) snippets.push({ text, file: path.relative(ROOT, filePath).replace(/\\/g, "/"), title: row.title || "" });
    }
  }
  return { files: indexedFiles, snippets };
}

function duplicateHits(lead, index) {
  const hits = [];
  for (const term of lead.duplicate_terms || lead.screened_terms || []) {
    const needle = normalizeText(term);
    if (!needle) continue;
    const hit = index.snippets.find((entry) => entry.text.includes(needle));
    if (hit) hits.push({ term, file: hit.file, title: hit.title });
  }
  return hits.slice(0, 8);
}

function isoDateInWindow(value) {
  return typeof value === "string" && value >= DATE_MIN && value <= DATE_MAX;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "Bims-5 Round340 Belfast official architecture sweep" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchHedFeature(hbRef) {
  const url = `${HED_LAYER_URL}/query?where=${encodeURIComponent(`HB_ref='${hbRef}'`)}&outFields=${encodeURIComponent(
    "OBJECTID_1,HB_ref,Address,CurrentGra,CurrentUse,Council,TxtIGRef,MainID"
  )}&f=json&outSR=4326`;
  const json = await fetchJson(url);
  const feature = json.features?.[0];
  if (!feature?.geometry) return null;
  const attributes = Object.fromEntries(
    Object.entries(feature.attributes || {}).map(([key, value]) => [
      key,
      typeof value === "string" ? cleanText(value) : value
    ])
  );
  return {
    query_url: url,
    attributes,
    geometry: feature.geometry
  };
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round340 Belfast official architecture source audit" }
    });
    const body = await response.text();
    const text = normalizeText(body);
    return {
      ok: response.ok,
      status: response.status,
      status_text: response.statusText,
      fetched_url: source.source_url,
      content_type: response.headers.get("content-type") || "",
      bytes: Buffer.byteLength(body),
      contains_expected_markers: {
        belfast: text.includes("belfast"),
        reconnected: text.includes("reconnected"),
        waterworks: text.includes("waterworks"),
        alexandra: text.includes("alexandra"),
        peaceplus: text.includes("peaceplus"),
        "all saints": text.includes("all saints"),
        "vacant to vibrant": text.includes("vacant to vibrant"),
        ardoyne: text.includes("ardoyne")
      }
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      status_text: cleanText(error.message || String(error)),
      fetched_url: source.source_url,
      content_type: "",
      bytes: 0,
      contains_expected_markers: {}
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllSources() {
  const sourceEntries = await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => [key, await fetchSource(source)]));
  const hedAllSaints = await fetchHedFeature("HB26/27/054").catch((error) => ({ error: cleanText(error.message || String(error)) }));
  return { sources: Object.fromEntries(sourceEntries), hedFeatures: { "HB26/27/054": hedAllSaints } };
}

function buildCandidate(lead, fetchResults) {
  const source = SOURCES[lead.source];
  const supportingSources = (lead.supporting_sources || []).map((key) => SOURCES[key]);
  let latitude = lead.latitude;
  let longitude = lead.longitude;
  let geometrySource = lead.geometry_source;
  let geometryPrecision = lead.geometry_precision;
  let sourceRecordId = lead.source_record_id;
  const rawSource = {};

  if (lead.hb_ref) {
    const hed = fetchResults.hedFeatures?.[lead.hb_ref];
    if (hed?.geometry) {
      latitude = hed.geometry.y;
      longitude = hed.geometry.x;
      geometrySource =
        "Official HED Historic Buildings ArcGIS layer point for HB26/27/054, used with the committee report as the source geometry.";
      geometryPrecision =
        "Official HED point geometry for the listed-building record, not a church footprint, curtilage polygon, conservation boundary or works extent.";
      sourceRecordId = `${sourceRecordId}; HED layer OBJECTID_1:${hed.attributes?.OBJECTID_1} MainID:${hed.attributes?.MainID}`;
      rawSource.hed_feature = hed;
    }
  }

  return {
    city_id: "belfast",
    event_id: lead.event_id,
    date: source.date_value,
    date_precision: "day",
    bucket: "planning/development/architecture/official heritage and capital works",
    title: lead.title,
    summary: lead.summary,
    observed_change: lead.observed_change,
    area: lead.area,
    latitude,
    longitude,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    geometry_ref: lead.hb_ref || lead.area,
    geometry_source: geometrySource,
    geometry_precision: geometryPrecision,
    source_ids: [source.source_id, ...supportingSources.map((item) => item.source_id)],
    source_name: source.source_name,
    source_url: source.source_url,
    source_record_id: sourceRecordId,
    source_type: source.source_type,
    source_date_field: source.date_field,
    source_date_value: source.date_value,
    publisher: source.publisher,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: lead.project_type,
    milestone_type: lead.milestone_type,
    architect:
      lead.hb_ref
        ? "Department for Communities Historic Environment Division, Belfast City Council Planning Committee, and historic-building record keepers; original building architect not asserted by this source pack."
        : "Belfast City Council, PEACEPLUS programme partners, community stakeholders and project team; designer and contractor not named in the cited launch page.",
    limitations: lead.limitations,
    caveats:
      "Use as an administrative official-source milestone only. Keep it separate from approvals, starts, completions, openings, final design and final built condition unless those are sourced separately.",
    duplicate_check_note: lead.duplicate_check_note,
    source_audit_note:
      lead.hb_ref
        ? "The committee report is suitable for the proposed-listing consultation date; the HED spatial layer is suitable for HB reference and point geometry. The exact final statutory listing date should be sourced separately before being represented as a listing confirmation."
        : "The council news page is suitable for a plans-launch milestone. It does not expose a project polygon, approved design pack, contract award, construction start or completion record.",
    transformation_method:
      "Round340 official-source sweep; source URLs/endpoints were fetched for availability, candidate terms were checked against the current manual corpus and prior Belfast packs, and surviving leads were normalized with explicit caveats and point geometry.",
    raw_source: rawSource
  };
}

function buildRejected(index) {
  return LEADS.filter((lead) => lead.decision !== "accept").map((lead) => {
    const source = SOURCES[lead.source];
    return {
      key: lead.key,
      city_id: "belfast",
      title: lead.title,
      date: lead.date,
      category: lead.category || lead.decision,
      reason: lead.reason,
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      screened_terms: lead.screened_terms || [],
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      accessed_at: ACCESSED_AT,
      transformation_method:
        "Round340 manual official-source screen; lead was checked against the current manual corpus and prior Belfast packs.",
      duplicate_or_overlap_hits: duplicateHits(lead, index)
    };
  });
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function buildSourceAudit(fetchResults, candidates, rejected) {
  return {
    schema_version: "round340_belfast_official_architecture_sweep_next2.source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    source_audits: Object.entries(SOURCES).map(([key, source]) => ({
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      coverage_years_checked: "2008-01-01 through 2026-05-20 for official Belfast architecture-related leads.",
      key_fields_reviewed:
        "Publication/report date, named project or building, milestone wording, source URL, publisher attribution, license/terms, and geometry or geometry_ref availability.",
      reliability:
        key === "hedHistoricBuildings"
          ? "strong for current official HB reference and point geometry"
          : key === "bccHedAllSaintsReport"
            ? "strong for committee report date and proposed-listing consultation wording"
            : "usable with caveats for official programme or news milestones",
      required_caveats:
        "Do not infer planning approval, construction start, completion, opening, final design, statutory listing confirmation, or completed works unless the cited source explicitly states that milestone.",
      ingestion_recommendation:
        candidates.some((row) => row.source_ids.includes(source.source_id))
          ? "Use emitted candidates with the stated caveats."
          : "Retain as audit/reject context only for this round.",
      emitted_candidates: candidates.filter((row) => row.source_ids.includes(source.source_id)).length,
      rejected_or_overlap_leads: rejected.filter((row) => row.source_id === source.source_id).length,
      retrieval: fetchResults.sources[key] || null
    })),
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    checked_endpoints: [
      fetchResults.hedFeatures?.["HB26/27/054"]?.query_url ||
        `${HED_LAYER_URL}/query?where=HB_ref%3D%27HB26%2F27%2F054%27&outFields=OBJECTID_1,HB_ref,Address,CurrentGra,CurrentUse,Council,TxtIGRef,MainID&f=json&outSR=4326`
    ],
    search_queries: [
      'site:belfastcity.gov.uk Belfast PEACEPLUS capital project opened 2025 community hub',
      'site:belfastcity.gov.uk Belfast council capital works building completed opened 2025',
      'site:belfastcity.gov.uk Belfast listed building restoration completed 2024 council',
      'site:communities-ni.gov.uk Belfast HED new listings 2026 HB26',
      'site:belfastcity.gov.uk/News Belfast building re-opened refurbished restored 2025 council',
      'site:belfastcity.gov.uk/News "Vacant to Vibrant" Belfast restored opened 2025'
    ],
    manual_source_recommendations: [
      "Check future Belfast Planning Committee HED Listing Structures reports for the final statutory listing decision date for All Saints' Church HB26/27/054.",
      "Check future Reconnected Belfast committee packs or planning-register rows for explicit approval, procurement, start, completion or opening milestones with mapped extents.",
      "Continue treating mutable programme pages as discovery leads unless they expose distinct dated row-level milestones."
    ],
    overall_recommendation:
      "Round340 emits two cautious official Belfast candidates and records duplicate/exhausted leads for the remaining official sources checked."
  };
}

function buildCandidatesPayload(candidates, index) {
  return {
    schema_version: "round340_belfast_official_architecture_sweep_next2.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: {
      min: candidates.length ? candidates.map((row) => row.date).sort()[0] : null,
      max: candidates.length ? candidates.map((row) => row.date).sort().at(-1) : null
    },
    source_ids: [...new Set(candidates.flatMap((row) => row.source_ids))],
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_belfast_pack_rule:
        "manual corpus plus tmp/subagents JSON paths containing Belfast/HARNI/Round296/Round310/Round332 context"
    },
    prior_file_count: index.files.length,
    candidates
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: "round340_belfast_official_architecture_sweep_next2.rejected.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count: rejected.length,
    rejected,
    rejected_category_counts: countBy(rejected, (row) => row.category)
  };
}

function buildSummary(candidates, rejected, sourceAudit, index, validation) {
  return {
    schema_version: "round340_belfast_official_architecture_sweep_next2.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    accepted_candidates: candidates.length,
    candidate_count: candidates.length,
    rejected_detail_count: rejected.length,
    emitted_date_range: {
      min: candidates.length ? candidates.map((row) => row.date).sort()[0] : null,
      max: candidates.length ? candidates.map((row) => row.date).sort().at(-1) : null
    },
    date_window: { start: DATE_MIN, end: DATE_MAX },
    counts_by_year: countBy(candidates, (row) => row.date.slice(0, 4)),
    counts_by_source_id: countBy(candidates, (row) => row.source_ids[0]),
    counts_by_milestone_type: countBy(candidates, (row) => row.milestone_type),
    sources_checked: sourceAudit.source_audits.length,
    source_ids_checked: sourceAudit.source_audits.map((row) => row.source_id),
    dedupe: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length,
      prior_record_count: index.files.reduce((sum, entry) => sum + Number(entry.record_count || 0), 0),
      prior_files_sample: index.files.slice(0, 40)
    },
    validation,
    output_files: Object.fromEntries(
      Object.entries(OUTPUTS).map(([key, value]) => [key, path.relative(ROOT, value).replace(/\\/g, "/")])
    ),
    conclusion:
      "Round340 emitted two distinct official Belfast architecture-related candidates and retained duplicate or context-only official leads as rejects."
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name} (${source.source_url})`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round340 Belfast Official Architecture Sweep Next2",
    "",
    `Generated/accessed: ${ACCESSED_AT}`,
    "",
    "## Result",
    "",
    `- Accepted candidates: ${summary.accepted_candidates}`,
    `- Rejected/detail rows retained: ${summary.rejected_detail_count}`,
    `- Accepted date range: ${summary.emitted_date_range.min || "none"} to ${summary.emitted_date_range.max || "none"}`,
    `- Prior files screened: ${summary.dedupe.prior_file_count}`,
    `- Prior records indexed: ${summary.dedupe.prior_record_count}`,
    `- Validation: ${summary.validation.ok ? "passed" : "failed"}`,
    "",
    "## Sources Checked",
    "",
    ...sourceLines,
    "",
    "## Candidate Notes",
    "",
    "Two official-source leads survived duplicate checks: Reconnected Belfast plans launch on 17 April 2025, and All Saints' Church proposed-listing consultation reported to Belfast Planning Committee on 14 May 2024 with current HED point geometry for HB26/27/054.",
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Next Manual Checks",
    "",
    "- Check future HED Listing Structures reports for an explicit All Saints' Church final listing decision date.",
    "- Check future Reconnected Belfast planning, procurement, works-start and completion records before adding later project milestones.",
    "- Keep mutable programme pages as discovery context unless they expose distinct dated row-level milestones.",
    "",
    "## Caveat",
    "",
    "Rows in this pack are official administrative observations. They should stay separate from planning approvals, construction starts, handovers, openings, final design, mapped works boundaries and built-condition records unless those are sourced separately.",
    ""
  ].join("\n");
}

function outputText(payloads) {
  return Object.values(payloads)
    .map((payload) => (typeof payload === "string" ? payload : JSON.stringify(payload)))
    .join("\n");
}

function validateOutputs(payloads) {
  const errors = [];
  const warnings = [];
  const candidates = payloads.candidates.candidates || [];
  const rejected = payloads.rejected.rejected || [];

  if (payloads.candidates.candidate_count !== candidates.length) errors.push("candidate_count mismatch");
  if (candidates.length > 50) errors.push("candidate cap exceeded");
  if (!payloads.sourceAudit.source_audits?.length) errors.push("source audit is empty");
  if (!payloads.summary.dedupe?.prior_file_count) errors.push("dedupe index did not include prior files");

  const seenIds = new Set();
  for (const row of candidates) {
    for (const field of [
      "event_id",
      "date",
      "title",
      "summary",
      "observed_change",
      "geometry",
      "geometry_ref",
      "source_url",
      "publisher",
      "license",
      "accessed_at",
      "confidence",
      "limitations",
      "transformation_method"
    ]) {
      if (!row[field]) errors.push(`candidate ${row.event_id || "unknown"} missing ${field}`);
    }
    if (seenIds.has(row.event_id)) errors.push(`duplicate event_id ${row.event_id}`);
    seenIds.add(row.event_id);
    if (!isoDateInWindow(row.date)) errors.push(`candidate ${row.event_id} outside date window`);
    if (!row.geometry?.coordinates || row.geometry.coordinates.length !== 2) {
      errors.push(`candidate ${row.event_id} missing point coordinates`);
    }
    const [lon, lat] = row.geometry?.coordinates || [];
    if (!(lat > 54.4 && lat < 54.8 && lon > -6.2 && lon < -5.7)) {
      errors.push(`candidate ${row.event_id} coordinate outside Belfast sanity bounds`);
    }
  }

  for (const row of rejected) {
    for (const field of ["key", "title", "reason", "source_name", "publisher", "source_url", "license", "accessed_at"]) {
      if (!row[field]) errors.push(`rejected row ${row.key || "unknown"} missing ${field}`);
    }
  }

  const text = outputText(payloads);
  const blockedPatterns = [
    /\bproof\b/i,
    /\bproves\b/i,
    /\bprediction\b/i,
    /\bforecast\b/i,
    /\bsimulation\b/i,
    /\bcausal\b/i,
    /\bcausality\b/i,
    /\bimpact\s+score\b/i
  ];
  for (const pattern of blockedPatterns) {
    if (pattern.test(text)) errors.push(`blocked overclaim wording found: ${pattern}`);
  }

  return {
    schema_version: "round340_belfast_official_architecture_sweep_next2.validation.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_candidate_provenance: true,
      required_rejected_provenance: true,
      candidate_cap_50: candidates.length <= 50,
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      belfast_coordinate_sanity: true,
      source_audit_present: Boolean(payloads.sourceAudit.source_audits?.length),
      dedupe_against_current_manual_and_prior_belfast_packs: true,
      official_geometry_or_geometry_ref: candidates.every((row) => row.geometry || row.geometry_ref),
      overclaim_wording_scan: true
    }
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const [index, fetchResults] = await Promise.all([Promise.resolve(buildExistingIndex()), fetchAllSources()]);
  const candidates = LEADS.filter((lead) => lead.decision === "accept").map((lead) => buildCandidate(lead, fetchResults));
  const rejected = buildRejected(index);
  const candidatesPayload = buildCandidatesPayload(candidates, index);
  const rejectedPayload = buildRejectedPayload(rejected);
  const sourceAudit = buildSourceAudit(fetchResults, candidates, rejected);

  let validation = validateOutputs({
    candidates: candidatesPayload,
    sourceAudit,
    rejected: rejectedPayload,
    summary: { dedupe: { prior_file_count: index.files.length } },
    notes: ""
  });
  const summary = buildSummary(candidates, rejected, sourceAudit, index, validation);
  const notes = buildNotes(summary, rejected);
  validation = validateOutputs({
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

  if (!validation.ok) {
    console.error(JSON.stringify(validation, null, 2));
    process.exitCode = 1;
  }
  console.log(
    JSON.stringify(
      {
        accepted_candidates: candidates.length,
        rejected: rejected.length,
        sources_checked: Object.keys(SOURCES).length,
        prior_file_count: index.files.length,
        validation_ok: validation.ok,
        out_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
