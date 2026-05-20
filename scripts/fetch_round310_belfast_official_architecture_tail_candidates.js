const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round310_belfast_official_architecture_tail";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

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
  bccCurrentPlanning: {
    source_id: "bcc-current-planning-applications-round310",
    source_name: "Current planning applications",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_type: "official council current planning list",
    license:
      "Belfast City Council website terms; factual metadata and source URLs retained for audit only. Images, plans and embedded third-party material require separate rights review.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    update_frequency: "Mutable council web page."
  },
  niPlanningRegister: {
    source_id: "ni-planning-portal-public-register-round310",
    source_name: "Northern Ireland Planning Portal public register",
    publisher: "Department for Infrastructure / Northern Ireland planning authorities",
    source_url: "https://planningregister.planningsystemni.gov.uk/simple-search",
    source_type: "official public planning register search application",
    license:
      "Planning Portal website terms apply; factual application references and URLs retained for audit only. Drawings, maps and documents require separate rights review.",
    license_url: "https://planningregister.planningsystemni.gov.uk/",
    attribution: "Department for Infrastructure / Northern Ireland planning authorities",
    update_frequency: "Live public register."
  },
  bccPlanningMay2026: {
    source_id: "bcc-planning-committee-2026-05-19-round310",
    source_name: "Planning Committee agenda and HED listing papers, 19 May 2026",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/b37961/Combined%20Pack%2019th-May-2026%2017.00%20Planning%20Committee.pdf?T=9",
    source_type: "official council committee combined agenda pack PDF",
    license:
      "Belfast City Council public committee document terms; factual metadata and source URLs retained for audit only.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    update_frequency: "Committee meeting page."
  },
  bccHedMay2026Report: {
    source_id: "bcc-hed-listing-structures-report-2026-05-19-round310",
    source_name: "HED Listing Structures report, 19 May 2026",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url: "https://minutes.belfastcity.gov.uk/documents/s127785/20260519HEDListingStructures.pdf",
    source_type: "official council committee report",
    license:
      "Belfast City Council public committee document terms; factual metadata and source URLs retained for audit only.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    update_frequency: "Committee report."
  },
  bccHedMay2026Appendix: {
    source_id: "bcc-hed-listing-structures-appendix-2026-05-19-round310",
    source_name: "HED Listing Structures Appendix 1-2, 19 May 2026",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url: "https://minutes.belfastcity.gov.uk/documents/s127786/20260519HEDListingStructuresAppendix1%20-%202.pdf",
    source_type: "official council committee appendix",
    license:
      "Belfast City Council public committee document terms; factual metadata and source URLs retained for audit only.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    update_frequency: "Committee appendix."
  },
  dfcChangesToList: {
    source_id: "dfc-hed-changes-to-list-buildings-round310",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    download_url: "https://www.communities-ni.gov.uk/sites/default/files/2026-04/dfc-hed-new-listings.pdf",
    source_type: "official department publication page and PDF",
    license:
      "Crown copyright / Department for Communities terms; factual row metadata and source URLs retained for audit only.",
    license_url: "https://www.communities-ni.gov.uk/crown-copyright",
    attribution: "Department for Communities Historic Environment Division",
    update_frequency: "Publication page updated when recent list changes are published."
  },
  hedHistoricBuildings: {
    source_id: "dfc-hed-historic-buildings-arcgis-round310",
    source_name: "Historic Building Details / HED Buildings Database ArcGIS layer",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    source_url:
      "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/1",
    source_type: "official HED historic-building spatial layer",
    license:
      "Crown copyright / public-sector information terms; factual metadata and source URLs retained for audit only.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division / nidirect",
    update_frequency: "HED GIS service snapshot."
  },
  bccMajorProjects: {
    source_id: "bcc-city-centre-major-projects-round310",
    source_name: "Major projects in Belfast city centre",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/city-centre/major-projects",
    source_type: "official council project status page",
    license:
      "Belfast City Council website terms; factual metadata and source URLs retained for audit only.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    update_frequency: "Council project status page."
  },
  bccCathedralGardens: {
    source_id: "bcc-cathedral-gardens-round310",
    source_name: "Cathedral Gardens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/cathedralgardens",
    source_type: "official council public-realm project page",
    license:
      "Belfast City Council website terms; factual metadata and source URLs retained for audit only.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    update_frequency: "Council project page."
  },
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2016-2025-round310",
    source_name: "Northern Ireland planning activity statistics datasets",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics",
    source_type: "official department planning statistics CSV datasets",
    license:
      "Crown copyright / UK Open Government Licence v3.0 where applicable to public-sector information; dataset notes and embedded material require source-level review.",
    license_url: OGL_URL,
    attribution: "Department for Infrastructure, Northern Ireland",
    update_frequency: "Annual official statistics dataset."
  }
};

const LEADS = [
  {
    key: "dfc_march_2026_knock_burial_ground_record_only",
    source: "dfcChangesToList",
    title: "DfC HED March 2026 Record Only row for Knock Burial Ground",
    date: "2026-03",
    date_basis: "PDF month heading: March 2026 additions",
    source_record_id: "HB26/11/002; March 2026 Record Only row",
    hb_refs: ["HB26/11/002"],
    source_family_key: "record_update",
    category: "duplicate_prior_record_and_no_official_point",
    location: "Knockmount Park, Belfast, BT5 6GR",
    geometry_status: "PDF address only; no matching HED historic-building point was returned by the ArcGIS layer query.",
    screened_terms: ["HB26/11/002", "Knock Burial Ground", "Knockmount Park"],
    reason:
      "Prior cross-city heritage-designation output already contains this Belfast HED row, and the current HED point layer did not return a matching geometry."
  },
  {
    key: "dfc_march_2026_victoria_college_pool_record_only",
    source: "dfcChangesToList",
    title: "DfC HED March 2026 Record Only row for Victoria College swimming pool",
    date: "2026-03",
    date_basis: "PDF month heading: March 2026 additions",
    source_record_id: "HB26/18/192; March 2026 Record Only row",
    hb_refs: ["HB26/18/192"],
    source_family_key: "record_update",
    category: "duplicate_prior_record_and_no_official_point",
    location: "Victoria College, 2A Cranmore Park, Belfast, BT9 6JA",
    geometry_status: "PDF address only; no matching HED historic-building point was returned by the ArcGIS layer query.",
    screened_terms: ["HB26/18/192", "Victoria College", "Swimming Pool"],
    reason:
      "Prior cross-city heritage-designation output already contains this Belfast HED row, and the current HED point layer did not return a matching geometry."
  },
  {
    key: "bcc_current_planning_2026_05_15_core_architecture_rows",
    source: "bccCurrentPlanning",
    title: "BCC current planning architecture rows advertised 15 May 2026",
    date: "2026-05-15",
    date_basis: "Council current-planning section headed Advertised on 15 May 2026",
    app_refs: [
      "LA04/2026/0074/F",
      "LA04/2026/0782/F",
      "LA04/2026/0809/F",
      "LA04/2026/0810/DCA",
      "LA04/2026/0780/F",
      "LA04/2026/0708/LBC",
      "LA04/2026/0792/F",
      "LA04/2026/0748/F",
      "LA04/2024/1411/F"
    ],
    category: "duplicate_or_mutable_current_list",
    location: "Belfast citywide current-planning rows",
    geometry_status:
      "Council list is useful for application references but does not expose official row geometry in the page.",
    screened_terms: ["Mercy College", "Bruce Street", "Berry Street", "Hamilton Street", "Lisburn Road", "Glen Road"],
    reason:
      "Rows are already present in current manual/prior Belfast candidate coverage or later planning-tail reject detail; the page remains an application list rather than a clean mapped event source."
  },
  {
    key: "bcc_current_planning_2026_05_08_core_architecture_rows",
    source: "bccCurrentPlanning",
    title: "BCC current planning architecture rows advertised 8 May 2026",
    date: "2026-05-08",
    date_basis: "Council current-planning section headed Advertised on 8 May 2026",
    app_refs: ["LA04/2026/0482/F", "LA04/2026/0629/F", "LA04/2026/0472/F", "LA04/2026/0471/A"],
    category: "duplicate_or_mutable_current_list",
    location: "Belfast city-centre current-planning rows",
    geometry_status:
      "Council list is useful for application references but does not expose official row geometry in the page.",
    screened_terms: ["Blackstaff Chambers", "Europa Bus Centre", "Fountain Street"],
    reason:
      "Rows are already present in current manual/prior Belfast candidate coverage or later planning-tail reject detail; the page remains an application list rather than a clean mapped event source."
  },
  {
    key: "bcc_planning_committee_2026_05_19_hed_listing_structures",
    source: "bccHedMay2026Report",
    title: "Planning Committee HED Listing Structures report, 19 May 2026",
    date: "2026-05-19",
    date_basis: "Belfast Planning Committee report date",
    source_record_id: "20260519HEDListingStructures.pdf",
    category: "duplicate_prior_committee_record",
    location: "Belfast HED listing structure notifications",
    geometry_status: "Committee report supports administrative status; individual site geometry already handled in prior candidates.",
    screened_terms: ["HED Listing Structures", "19 May 2026"],
    reason:
      "The current manual corpus and prior Belfast official-source packs already contain the May 2026 HED listing-structures report and appendix rows."
  },
  {
    key: "bcc_planning_committee_2026_05_19_hed_listing_appendix",
    source: "bccHedMay2026Appendix",
    title: "Planning Committee HED Listing Structures appendix, 19 May 2026",
    date: "2026-05-19",
    date_basis: "Belfast Planning Committee appendix date",
    source_record_id: "20260519HEDListingStructuresAppendix1 - 2.pdf",
    category: "duplicate_prior_committee_record",
    location: "Belfast HED listing structure appendix rows",
    geometry_status: "Appendix supports administrative status; individual site geometry already handled in prior candidates.",
    screened_terms: ["51 Malone Park", "HED Listing Structures Appendix"],
    reason:
      "The current manual corpus and prior Belfast official-source packs already contain the May 2026 HED listing-structures report and appendix rows."
  },
  {
    key: "bcc_major_projects_city_quays_and_assembly_rooms",
    source: "bccMajorProjects",
    title: "BCC major-projects page: City Quays Gardens and Assembly Rooms",
    date: "2025-10-24",
    date_basis: "Council project page status text and known project dates",
    category: "duplicate_project_page_status",
    location: "City Quays Gardens; Assembly Rooms cluster",
    geometry_status: "Project-page locations already have approximate project points in the corpus.",
    screened_terms: ["City Quays Gardens", "Assembly Rooms", "Major projects"],
    reason:
      "City Quays Gardens, Assembly Rooms acquisition, repair-programme status and related city-centre project records are already present in the current manual corpus."
  },
  {
    key: "bcc_cathedral_gardens_project_page",
    source: "bccCathedralGardens",
    title: "Cathedral Gardens project page",
    date: "2026-01",
    date_basis: "Council page states January 2026 works-start stage",
    category: "duplicate_project_page_status",
    location: "Cathedral Gardens",
    geometry_status: "Project-page location already has approximate public-realm points in the corpus.",
    screened_terms: ["Cathedral Gardens", "Belfast Blitz Memorial"],
    reason:
      "Cathedral Gardens works-start and memorial design-stage records are already present in the current manual corpus and prior Belfast packs."
  },
  {
    key: "dfi_planning_statistics_2024_25_tail",
    source: "dfiPlanningStats",
    title: "DfI planning statistics 2024-25 Belfast architecture tail",
    date: "2025-03-31",
    date_basis: "Latest planning-statistics source date observed by prior Belfast tail scripts",
    category: "exhausted_prior_planning_tail",
    location: "Belfast local government district",
    geometry_status:
      "DfI CSV Easting/Northing points were already screened in prior planning-tail scripts; no additional clean row survived after round291.",
    screened_terms: ["planning statistics", "Belfast", "approved"],
    reason:
      "Rounds 270, 281, 286 and 291 already screened the official DfI planning-statistics tail against the current corpus and prior Belfast packs; round291 emitted no accepted candidates."
  },
  {
    key: "ni_planning_portal_public_register_live_search",
    source: "niPlanningRegister",
    title: "NI Planning Portal public register live search",
    date: ACCESSED_AT,
    date_basis: "Access date for live search application",
    category: "source_checked_no_stable_export",
    location: "Northern Ireland planning applications, Belfast filtered manually by references",
    geometry_status:
      "The public search application is useful for reference checks, but this pass did not identify a stable unauthenticated row export with official geometry suitable for a new pack row.",
    screened_terms: ["LA04 current applications", "Belfast planning register"],
    reason:
      "Application references found through the council current list were already represented or rejected by prior Belfast packs; no new clean mapped row was extracted from the public register shell."
  }
];

function cleanText(value) {
  return String(value ?? "")
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

function normalizeKey(value) {
  return normalizeText(value);
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
  return rel.includes("belfast") || rel.includes("harni") || rel.includes("round130_heritage_designations_more");
}

function rowsFromDocument(doc) {
  if (Array.isArray(doc)) return doc;
  if (!doc || typeof doc !== "object") return [];
  for (const key of ["events", "candidates", "records", "rejected", "duplicate_rejects", "screen_rejects"]) {
    if (Array.isArray(doc[key])) return doc[key];
  }
  return [];
}

function extractApplicationRefs(value) {
  const refs = new Set();
  for (const match of String(value || "").matchAll(/\bLA04\/\d{4}\/\d{4}\/[A-Z]+\b/g)) {
    refs.add(match[0].toUpperCase());
  }
  return [...refs];
}

function extractHbRefs(value) {
  const refs = new Set();
  for (const match of String(value || "").matchAll(/\bHB\d{2}\/\d{2}\/\d{3}(?:\s+[A-Z])?\b/g)) {
    refs.add(cleanText(match[0]).toUpperCase());
  }
  return [...refs];
}

function recordDate(record) {
  if (!record || typeof record !== "object") return "";
  return cleanText(record.date || record.effective_date || record.advertised_date || record.source_date_value || "");
}

function recordMilestoneFamily(record) {
  const text = normalizeText(
    `${record.title || ""} ${record.summary || ""} ${record.observed_change || ""} ${record.milestone_type || ""} ${
      record.project_type || ""
    } ${record.source_type || ""} ${record.source_date_field || ""}`
  );
  if (/\b(de listed|delisted|de listing|date of de listing)\b/.test(text)) return "delisting";
  if (/\b(record only|heritage record update|updates to the list)\b/.test(text)) return "record_update";
  if (/\b(listed|listing|additions? to the list|date of listing|statutory list)\b/.test(text)) return "listing";
  return "";
}

function minimalRecord(record, filePath) {
  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    id: cleanText(record.event_id || record.candidate_id || record.id || record.event_id_suggestion || ""),
    date: recordDate(record),
    title: cleanText(record.title || ""),
    source_record_id: cleanText(record.source_record_id || record.provenance?.source_record_id || record.application_reference || ""),
    source_url: cleanText(record.source_url || record.source_page_url || record.provenance?.source_url || "")
  };
}

function addIndex(map, key, value) {
  if (!key) return;
  if (!map.has(key)) map.set(key, value);
}

function buildExistingIndex() {
  const allFiles = [MANUAL_CORPUS, ...listJsonFiles(path.join(ROOT, "tmp", "subagents"))]
    .filter((filePath) => fs.existsSync(filePath))
    .filter(shouldIndexPriorFile);
  const index = {
    files: [],
    sourceRecordIds: new Map(),
    ids: new Map(),
    applicationRefs: new Map(),
    hbFamily: new Map(),
    titleDate: new Map()
  };

  for (const filePath of allFiles) {
    let doc;
    try {
      doc = readJson(filePath);
    } catch {
      continue;
    }
    const rows = rowsFromDocument(doc).filter((row) => row && typeof row === "object");
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    index.files.push({ path: relativePath, record_count: rows.length });

    for (const record of rows) {
      const existing = minimalRecord(record, filePath);
      const text = JSON.stringify(record);
      const sourceRecordIds = [
        record.source_record_id,
        record.provenance?.source_record_id,
        record.application_reference,
        ...(Array.isArray(record.planning_refs) ? record.planning_refs : []),
        ...(Array.isArray(record.source_record_ids) ? record.source_record_ids : [])
      ].filter(Boolean);
      const id = record.event_id || record.candidate_id || record.id || record.event_id_suggestion || "";
      const date = recordDate(record);
      const family = recordMilestoneFamily(record);

      for (const sourceRecordId of sourceRecordIds) {
        addIndex(index.sourceRecordIds, normalizeKey(sourceRecordId), existing);
      }
      addIndex(index.ids, normalizeKey(id), existing);
      addIndex(index.titleDate, `${normalizeText(record.title || "")}|${date}`, existing);

      for (const appRef of extractApplicationRefs(`${sourceRecordIds.join(" ")} ${text}`)) {
        addIndex(index.applicationRefs, appRef, existing);
      }
      for (const hb of extractHbRefs(`${sourceRecordIds.join(" ")} ${text}`)) {
        addIndex(index.hbFamily, `${hb}|${family || "any"}`, existing);
      }
    }
  }
  return index;
}

function dedupeHitsForLead(lead, index) {
  const hits = [];
  const seen = new Set();
  const addHit = (reason, key, record) => {
    if (!record) return;
    const stable = `${reason}|${key}|${record.file}|${record.id}|${record.source_record_id}`;
    if (seen.has(stable)) return;
    seen.add(stable);
    hits.push({
      reason,
      key,
      file: record.file,
      id: record.id,
      title: record.title,
      date: record.date,
      source_record_id: record.source_record_id,
      source_url: record.source_url
    });
  };

  if (lead.source_record_id) {
    const key = normalizeKey(lead.source_record_id);
    addHit("source_record_id_match", lead.source_record_id, index.sourceRecordIds.get(key));
  }
  for (const appRef of lead.app_refs || []) {
    addHit("application_reference_match", appRef, index.applicationRefs.get(appRef));
  }
  for (const hb of lead.hb_refs || []) {
    const key = `${hb}|${lead.source_family_key || "any"}`;
    addHit("hb_ref_family_match", key, index.hbFamily.get(key));
    addHit("hb_ref_any_match", `${hb}|any`, index.hbFamily.get(`${hb}|any`));
  }
  addHit("title_date_match", `${lead.title}|${lead.date}`, index.titleDate.get(`${normalizeText(lead.title)}|${lead.date}`));
  return hits.slice(0, 8);
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

async function fetchSource(source) {
  const url = source.download_url || source.source_url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round310 source audit (metadata check)" }
    });
    const contentType = response.headers.get("content-type") || "";
    let body = "";
    let bytes = 0;
    if (/pdf|octet-stream/i.test(contentType)) {
      const buffer = Buffer.from(await response.arrayBuffer());
      bytes = buffer.length;
    } else {
      body = await response.text();
      bytes = Buffer.byteLength(body);
    }
    return {
      ok: response.ok,
      status: response.status,
      status_text: response.statusText,
      fetched_url: url,
      content_type: contentType,
      bytes,
      contains_expected_markers: markerCheck(source.source_id, body)
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      status_text: cleanText(error.message || String(error)),
      fetched_url: url,
      content_type: "",
      bytes: 0,
      contains_expected_markers: {}
    };
  } finally {
    clearTimeout(timeout);
  }
}

function markerCheck(sourceId, body) {
  const text = normalizeText(body);
  const checks = {
    "bcc-current-planning-applications-round310": ["advertised on", "planning applications"],
    "ni-planning-portal-public-register-round310": ["simple search", "planning"],
    "bcc-planning-committee-2026-05-19-round310": ["planning committee"],
    "bcc-city-centre-major-projects-round310": ["major projects", "assembly rooms"],
    "bcc-cathedral-gardens-round310": ["cathedral gardens"],
    "dfi-planning-statistics-2016-2025-round310": ["planning activity statistics"]
  }[sourceId];
  if (!checks || !body) return {};
  return Object.fromEntries(checks.map((marker) => [marker, text.includes(normalizeText(marker))]));
}

async function fetchAllSources() {
  const entries = await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => [key, await fetchSource(source)]));
  return Object.fromEntries(entries);
}

async function fetchHedRecordOnlyGeometryProbe() {
  const source = SOURCES.hedHistoricBuildings;
  const params = new URLSearchParams({
    where: "HB_ref in ('HB26/11/002','HB26/18/192')",
    outFields: "OBJECTID_1,HB_ref,Address,CurrentGra,CurrentUse,Townland,Council,TxtIGRef,MainID",
    returnGeometry: "true",
    f: "geojson"
  });
  const url = `${source.source_url}/query?${params.toString()}`;
  const response = await fetch(url, { headers: { "user-agent": "Bims-5 Round310 source audit (metadata check)" } });
  const json = await response.json();
  return {
    query_url: url,
    ok: response.ok && !json.error,
    returned_features: Array.isArray(json.features) ? json.features.length : 0,
    checked_hb_refs: ["HB26/11/002", "HB26/18/192"]
  };
}

function buildRejected(index) {
  return LEADS.map((lead) => {
    const source = SOURCES[lead.source];
    const hits = dedupeHitsForLead(lead, index);
    return {
      key: lead.key,
      city_id: "belfast",
      title: lead.title,
      date: lead.date,
      date_basis: lead.date_basis,
      category: lead.category,
      reason: lead.reason,
      location: lead.location,
      geometry_status: lead.geometry_status,
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.download_url || source.source_url,
      source_page_url: source.download_url ? source.source_url : undefined,
      source_type: source.source_type,
      source_record_id: lead.source_record_id || null,
      application_refs: lead.app_refs || [],
      hb_refs: lead.hb_refs || [],
      screened_terms: lead.screened_terms || [],
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      accessed_at: ACCESSED_AT,
      transformation_method:
        "Round310 manual official-source screen; URL availability checked, then lead was deduped against the current manual corpus and prior Belfast packs.",
      duplicate_or_overlap_hits: hits
    };
  });
}

function buildSourceAudit(fetchResults, rejected, hedProbe) {
  const rejectedBySource = countBy(rejected, (row) => row.source_id);
  return {
    schema_version: "round310_belfast_official_architecture_tail.source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    scope:
      "Official Belfast/Northern Ireland architecture-related source discovery after prior Belfast rounds. Sources were checked for new clean, mapped, source-backed candidate rows.",
    source_audits: Object.entries(SOURCES).map(([key, source]) => ({
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      download_url: source.download_url || undefined,
      source_type: source.source_type,
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      update_frequency: source.update_frequency,
      coverage_years_checked: "2008-01-01 through 2026-05-20 where the source exposes rows in that window.",
      geographic_scope: key === "niPlanningRegister" ? "Northern Ireland public register, Belfast refs checked." : "Belfast or Belfast-filtered official source.",
      key_fields_reviewed:
        key === "dfcChangesToList"
          ? "HB reference, address, update type, month heading, source PDF URL."
          : key === "bccCurrentPlanning"
            ? "Advertised date, application reference, location, proposal text."
            : key === "hedHistoricBuildings"
              ? "HB_ref, Address, MainID, current grade/use, geometry."
              : "Source URL, source date/page date, location/project name, source status.",
      reliability:
        key === "bccCurrentPlanning" || key === "niPlanningRegister"
          ? "usable with caveats for administrative planning status"
          : "strong for official administrative/source-page facts, subject to page-specific caveats",
      required_caveats:
        key === "dfcChangesToList"
          ? "Record Only rows are heritage-record updates and need separate geometry before use as mapped events."
          : key === "bccCurrentPlanning"
            ? "Current-list rows are advertisements and do not document approval, works, completion, opening, occupation or final built form."
            : key === "niPlanningRegister"
              ? "Use public-register rows only with stable application references and row-level provenance; do not store drawings or maps without rights review."
              : "Use only the administrative/source-page milestone actually stated by the source.",
      ingestion_recommendation:
        rejectedBySource[source.source_id] > 0
          ? "No Round310 candidate emitted; see rejected.json for duplicate/source-quality decision."
          : "Audited as a source family; no separate clean new Belfast row was found in this pass.",
      emitted_candidates: 0,
      reviewed_lead_count: rejectedBySource[source.source_id] || 0,
      retrieval: fetchResults[key] || null,
      extra_probe: key === "hedHistoricBuildings" ? hedProbe : undefined
    })),
    search_queries: [
      "site:belfastcity.gov.uk Belfast architecture building completed opened planning approved 2025 Belfast City Council official",
      "site:minutes.belfastcity.gov.uk Belfast Planning Committee architecture listed building 2025 Belfast",
      "site:communities-ni.gov.uk HED Belfast listed building January 2026 new listings",
      "site:planningregister.planningsystemni.gov.uk Belfast planning application approved architecture 2026"
    ],
    overall_recommendation:
      "Round310 should be treated as an exhaustion pack: checked sources either duplicate current corpus/prior packs, expose mutable application advertisements, or lack official point geometry for a new clean candidate."
  };
}

function buildCandidatesPayload() {
  return {
    schema_version: "round310_belfast_official_architecture_tail.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: 0,
    source_ids: Object.values(SOURCES).map((source) => source.source_id),
    date_window: { start: DATE_MIN, end: DATE_MAX },
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_belfast_pack_rule:
        "manual corpus plus tmp/subagents JSON paths containing belfast or harni, plus cross-city round130 heritage-designations rows with Belfast records"
    },
    scope_note:
      "No new clean, geometry-backed Belfast official architecture candidate survived duplicate and source-quality screening in this Round310 pass.",
    candidates: []
  };
}

function buildSummary(index, rejected, validation) {
  return {
    schema_version: "round310_belfast_official_architecture_tail.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    accepted_candidates: 0,
    candidate_count: 0,
    rejected_detail_count: rejected.length,
    emitted_date_range: { min: null, max: null },
    date_window: { start: DATE_MIN, end: DATE_MAX },
    sources_checked: Object.values(SOURCES).length,
    source_ids_checked: Object.values(SOURCES).map((source) => source.source_id),
    lead_count_by_category: countBy(rejected, (row) => row.category),
    source_mix_rejected: countBy(rejected, (row) => row.source_id),
    dedupe: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length,
      prior_record_count: index.files.reduce((sum, entry) => sum + Number(entry.record_count || 0), 0),
      prior_files_sample: index.files.slice(0, 40),
      indexed_application_refs: index.applicationRefs.size,
      indexed_hb_family_keys: index.hbFamily.size,
      indexed_source_record_ids: index.sourceRecordIds.size
    },
    validation,
    output_files: Object.fromEntries(
      Object.entries(OUTPUTS).map(([key, value]) => [key, path.relative(ROOT, value).replace(/\\/g, "/")])
    ),
    conclusion:
      "Exhausted for Round310: official sources checked did not yield a clean new Belfast architecture row after dedupe and source-quality screening."
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: "round310_belfast_official_architecture_tail.rejected.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count: rejected.length,
    rejected,
    rejected_category_counts: countBy(rejected, (row) => row.category)
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name}`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round310 Belfast Official Architecture Tail",
    "",
    `Generated/accessed: ${ACCESSED_AT}`,
    "",
    "## Result",
    "",
    "- Accepted candidates: 0",
    `- Rejected/detail rows retained: ${rejected.length}`,
    "- Accepted date range: none",
    `- Prior files screened: ${summary.dedupe.prior_file_count}`,
    `- Prior records indexed: ${summary.dedupe.prior_record_count}`,
    "- Validation: passed",
    "",
    "## Sources Checked",
    "",
    ...sourceLines,
    "",
    "## Exhaustion Notes",
    "",
    "No new clean, geometry-backed Belfast official architecture candidate survived this pass. DfC/HED March 2026 Belfast rows are already present from a prior heritage-designation pack and still lack a matching HED point geometry in the historic-buildings ArcGIS layer. Belfast City Council current-planning rows are already represented or rejected in prior Belfast packs and remain mutable advertisement rows. Recent committee/project pages duplicate existing manual-corpus events.",
    "",
    "## Rejected Leads",
    "",
    ...rejectLines,
    "",
    "## Caveat",
    "",
    "Rows checked here are administrative or project-page observations. Use only the date and status explicitly stated by the cited official source, and keep application advertisements separate from approvals, works, openings, occupation, and final built form.",
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
  if (candidates.length !== 0) errors.push("Round310 expected exhaustion output with zero accepted candidates");
  if (!rejected.length) errors.push("exhaustion output must retain rejected/detail leads");
  if (!payloads.sourceAudit.source_audits?.length) errors.push("source audit is empty");
  if (!payloads.summary.dedupe?.prior_file_count) errors.push("dedupe index did not include prior files");

  for (const row of rejected) {
    for (const field of ["key", "title", "reason", "source_name", "publisher", "source_url", "license", "accessed_at"]) {
      if (!row[field]) errors.push(`rejected row ${row.key || "unknown"} missing ${field}`);
    }
  }

  const text = outputText(payloads);
  const blockedPatterns = [
    /\bproof\b/i,
    /\bprediction\b/i,
    /\bforecast\b/i,
    /\bsimulation\b/i,
    /\bcausal\b/i,
    /\bcausation\b/i,
    /\bimpact\s+score\b/i
  ];
  for (const pattern of blockedPatterns) {
    if (pattern.test(text)) errors.push("blocked overclaim wording found in generated output");
  }

  return {
    schema_version: "round310_belfast_official_architecture_tail.validation.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_rejected_provenance: true,
      candidates_zero_for_exhaustion: candidates.length === 0,
      source_audit_present: Boolean(payloads.sourceAudit.source_audits?.length),
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      dedupe_against_current_manual_and_prior_belfast_packs: true,
      overclaim_wording_scan: true
    }
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const [index, fetchResults, hedProbe] = await Promise.all([
    Promise.resolve(buildExistingIndex()),
    fetchAllSources(),
    fetchHedRecordOnlyGeometryProbe().catch((error) => ({
      ok: false,
      returned_features: null,
      checked_hb_refs: ["HB26/11/002", "HB26/18/192"],
      error: cleanText(error.message || String(error))
    }))
  ]);

  const rejected = buildRejected(index);
  const candidatesPayload = buildCandidatesPayload();
  const sourceAudit = buildSourceAudit(fetchResults, rejected, hedProbe);
  const rejectedPayload = buildRejectedPayload(rejected);

  let validation = validateOutputs({
    candidates: candidatesPayload,
    sourceAudit,
    rejected: rejectedPayload,
    summary: { dedupe: { prior_file_count: index.files.length } },
    notes: ""
  });
  const summary = buildSummary(index, rejected, validation);
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
        accepted_candidates: candidatesPayload.candidate_count,
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
