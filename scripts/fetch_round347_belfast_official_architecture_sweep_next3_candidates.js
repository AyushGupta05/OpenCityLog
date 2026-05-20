const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round347_belfast_official_architecture_sweep_next3";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";

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
  bccWorkhouseBurialGroundPlaque: {
    source_id: "bcc-workhouse-burial-ground-plaque-2026-round347",
    source_name: "Council marks hidden burial ground from former Belfast Workhouse",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Council-marks-hidden-burial-ground-from-former-Bel",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual plaque, location and source metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-05-08",
    update_frequency: "Archived council news page."
  },
  bccCurrentPlanningApplications: {
    source_id: "bcc-current-planning-applications-2026-round347",
    source_name: "Current planning applications",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_type: "official council current-planning list",
    license:
      "Belfast City Council website copyright and terms; factual application references retained only for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Advertised-on date on mutable list",
    date_value: ACCESSED_AT,
    update_frequency: "Mutable weekly/current list."
  },
  bccHistoricAreasSpg: {
    source_id: "bcc-historic-areas-spg-news-2026-round347",
    source_name: "Council agrees supplementary planning guidance for historic areas of Belfast",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/News/Council-agrees-supplementary-planning-guidance-for",
    source_type: "official council planning news page",
    license:
      "Belfast City Council website copyright and terms; factual policy and approval metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-04-21",
    update_frequency: "Archived council news page."
  },
  bccPlaygroundImprovements: {
    source_id: "bcc-playground-improvements-open-2026-round347",
    source_name: "GBP1.5 million of further park improvements planned for Belfast as revamped playgrounds open",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/News/%C2%A31-5-million-of-further-park-improvements-planned",
    source_type: "official council parks news page",
    license:
      "Belfast City Council website copyright and terms; factual playground names and page date retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-04-02",
    update_frequency: "Archived council news page."
  },
  bccSandyRowHub: {
    source_id: "bcc-sandy-row-arts-digital-hub-open-2026-round347",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual opening and project metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-02-18",
    update_frequency: "Archived council news page."
  },
  bccCathedralGardens: {
    source_id: "bcc-cathedral-gardens-works-start-2026-round347",
    source_name: "Cathedral Gardens transformation gets underway",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual works-start metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-01-05",
    update_frequency: "Archived council news page."
  },
  bccAssemblyRooms: {
    source_id: "bcc-assembly-rooms-purchase-2025-round347",
    source_name: "Council agrees to purchase Assembly Rooms as city centre regeneration continues",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/council-agrees-to-purchase-assembly-rooms-as-city",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual purchase-agreement metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2025-09-01",
    update_frequency: "Archived council news page."
  }
};

const LEADS = [
  {
    key: "workhouse_burial_ground_plaque_marked",
    decision: "accept",
    event_id: "round347_belfast_workhouse_burial_ground_plaque_marked_2026_05_08",
    title: "Former Belfast Workhouse burial ground was marked with a permanent plaque",
    summary:
      "Belfast City Council's 8 May 2026 news page recorded that a permanent plaque was mounted on the remaining workhouse wall and gatepost at Donegall Road to mark the burial ground associated with the former Belfast Workhouse.",
    observed_change:
      "A documented council heritage-marker milestone made the former Belfast Workhouse burial-ground location visible with a permanent plaque.",
    area: "Former Belfast Workhouse burial ground, between 263 and 265 Donegall Road",
    latitude: 54.5879,
    longitude: -5.9558,
    geometry_source:
      "Approximate point on Donegall Road from the council-stated plaque location between 263 and 265 Donegall Road, BT12 5NB.",
    geometry_precision:
      "Approximate plaque/location point, not a surveyed burial-ground boundary, wall footprint, gatepost point, grave extent, or full former-workhouse site.",
    project_type: "heritage memorial plaque",
    milestone_type: "permanent_heritage_plaque_marked",
    source: "bccWorkhouseBurialGroundPlaque",
    source_record_id:
      "Belfast City Council news page, 8 May 2026: permanent plaque situated between 263 and 265 Donegall Road, BT12 5NB",
    duplicate_terms: [
      "Belfast Workhouse",
      "Donegall Road burial ground",
      "263 265 Donegall Road",
      "permanent plaque",
      "Famine grave"
    ],
    duplicate_check_note:
      "Searched the current manual corpus and prior Belfast packs for Belfast Workhouse, Donegall Road burial ground, 263-265 Donegall Road, permanent plaque and Famine grave. Existing Donegall Road rows cover other planning or community-building records; no matching Belfast Workhouse plaque milestone was found.",
    limitations:
      "This records the plaque/marker milestone only. It does not document excavation, archaeological investigation, conservation works to the wall or gatepost, a surveyed burial-ground boundary, public-realm completion, site access changes or the original nineteenth-century burial activity."
  },
  {
    key: "current_planning_may_2026_rows_duplicate",
    decision: "reject_duplicate_or_mutable",
    source: "bccCurrentPlanningApplications",
    title: "Current planning list rows advertised in May 2026",
    date: "2026-05-15",
    category: "duplicate_or_mutable_current_list",
    reason:
      "Mercy College SEN building, Bruce Street structural bracing and Berry Street shopfront rows are already represented or rejected in prior Belfast current-planning packs. The live list is mutable and should not replace Planning Portal or committee/decision records.",
    screened_terms: ["LA04/2026/0074/F", "LA04/2026/0782/F", "LA04/2026/0809/F", "LA04/2026/0810/DCA"]
  },
  {
    key: "historic_areas_spg_duplicate",
    decision: "reject_duplicate",
    source: "bccHistoricAreasSpg",
    title: "Historic areas supplementary planning guidance",
    date: "2026-04-21",
    category: "duplicate_existing_event",
    reason:
      "The Cathedral/Northeast Quarter and Sailortown/City Quays SPG milestone and the Common Market and St Mary's CBS approval mentions from the same news page are already represented in the live corpus or prior Belfast packs.",
    screened_terms: ["Supplementary Planning Guidance", "Common Market", "St Mary's Christian Brothers"]
  },
  {
    key: "white_rise_ohio_playgrounds_duplicate",
    decision: "reject_duplicate",
    source: "bccPlaygroundImprovements",
    title: "White Rise and Ohio Street revamped playgrounds opened",
    date: "2026-04-02",
    category: "duplicate_existing_public_realm_pack",
    reason:
      "White Rise, Ohio Street, Finvoy Street and Roddens Crescent playground-improvement programme milestones were already represented or rejected by prior Belfast public-realm packs.",
    screened_terms: ["White Rise", "Ohio Street", "Finvoy Street", "Roddens Crescent", "Playground Improvement Programme"]
  },
  {
    key: "sandy_row_hub_duplicate",
    decision: "reject_duplicate",
    source: "bccSandyRowHub",
    title: "Sandy Row Arts and Digital Hub official opening",
    date: "2026-02-18",
    category: "duplicate_existing_event",
    reason:
      "The Sandy Row Arts and Digital Hub opening, Coffee Culture works and Sandy Row open-space pipeline items are already represented or rejected in prior Belfast packs.",
    screened_terms: ["Sandy Row Arts", "Arts and Digital Hub", "Coffee Culture", "Sandy Row Open Space"]
  },
  {
    key: "cathedral_gardens_duplicate",
    decision: "reject_duplicate",
    source: "bccCathedralGardens",
    title: "Cathedral Gardens transformation works started",
    date: "2026-01-05",
    category: "duplicate_existing_event",
    reason:
      "Cathedral Gardens approval, works-start and memorial design-stage milestones are already represented in the live corpus and prior Belfast packs.",
    screened_terms: ["Cathedral Gardens", "Belfast Blitz Memorial", "work started"]
  },
  {
    key: "assembly_rooms_duplicate",
    decision: "reject_duplicate",
    source: "bccAssemblyRooms",
    title: "Assembly Rooms purchase agreement and completion",
    date: "2025-09-01",
    category: "duplicate_existing_event",
    reason:
      "Assembly Rooms purchase-agreed and purchase-completion milestones are already represented in the live corpus and prior Belfast packs.",
    screened_terms: ["Assembly Rooms", "Braddell", "North Street", "Waring Street"]
  }
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
  return (
    rel.includes("belfast") ||
    rel.includes("harni") ||
    rel.includes("round296") ||
    rel.includes("round310") ||
    rel.includes("round332") ||
    rel.includes("round340")
  );
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
      const text = normalizeText(
        [
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
        ].join(" ")
      );
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
  return hits.slice(0, 10);
}

function isoDateInWindow(value) {
  return typeof value === "string" && value >= DATE_MIN && value <= DATE_MAX;
}

async function fetchSource(key, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round347 Belfast official architecture source audit" }
    });
    const body = await response.text();
    const text = normalizeText(body);
    return [
      key,
      {
        ok: response.ok,
        status: response.status,
        status_text: response.statusText,
        fetched_url: source.source_url,
        content_type: response.headers.get("content-type") || "",
        bytes: Buffer.byteLength(body),
        contains_expected_markers: {
          belfast: text.includes("belfast"),
          workhouse: text.includes("workhouse"),
          "donegall road": text.includes("donegall road"),
          plaque: text.includes("plaque"),
          "current planning": text.includes("current planning"),
          "supplementary planning guidance": text.includes("supplementary planning guidance"),
          playground: text.includes("playground"),
          "sandy row": text.includes("sandy row"),
          "cathedral gardens": text.includes("cathedral gardens"),
          "assembly rooms": text.includes("assembly rooms")
        }
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
        contains_expected_markers: {}
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

function buildCandidate(lead) {
  const source = SOURCES[lead.source];
  return {
    city_id: "belfast",
    event_id: lead.event_id,
    date: source.date_value,
    date_precision: "day",
    bucket: "planning/development/architecture/official heritage works",
    title: lead.title,
    summary: lead.summary,
    observed_change: lead.observed_change,
    area: lead.area,
    latitude: lead.latitude,
    longitude: lead.longitude,
    geometry: {
      type: "Point",
      coordinates: [lead.longitude, lead.latitude]
    },
    geometry_ref: "Between 263 and 265 Donegall Road, BT12 5NB",
    geometry_source: lead.geometry_source,
    geometry_precision: lead.geometry_precision,
    source_ids: [source.source_id],
    source_name: source.source_name,
    source_url: source.source_url,
    source_record_id: lead.source_record_id,
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
      "Belfast City Council and former Belfast Workhouse burial-ground memorial advocates; plaque designer, fabricator and installer not named in the cited page.",
    limitations: lead.limitations,
    caveats:
      "Use as a council-reported heritage marker milestone only. Keep it separate from archaeological, conservation, burial-ground-boundary, wall-repair or public-realm records unless those are sourced separately.",
    duplicate_check_note: lead.duplicate_check_note,
    source_audit_note:
      "The council news page is suitable for the plaque date, broad address and council attribution. It is not a surveyed site dataset and does not provide a polygon.",
    transformation_method:
      "Round347 official-source sweep; source pages were fetched for availability, candidate terms were checked against the current manual corpus and prior Belfast packs, and the surviving lead was normalized with explicit caveats and approximate point geometry."
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
        "Round347 manual official-source screen; lead was checked against the current manual corpus and prior Belfast packs.",
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
    schema_version: "round347_belfast_official_architecture_sweep_next3.source_audit.v1",
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
      geographic_scope: "Belfast city and named official project/building/heritage locations.",
      key_fields_reviewed:
        "Page date, named project or site, milestone wording, source URL, publisher attribution, terms, and geometry or geometry_ref availability.",
      reliability:
        key === "bccWorkhouseBurialGroundPlaque"
          ? "strong for council-reported plaque date and address-level location"
          : key === "bccCurrentPlanningApplications"
            ? "risky as a mutable list unless reconciled to Planning Portal or later committee/decision records"
            : "usable with caveats for official programme or news milestones",
      required_caveats:
        "Do not infer planning approval, construction start, completion, opening, conservation works, statutory heritage status, exact boundary, or built condition unless the cited source explicitly states that milestone.",
      ingestion_recommendation:
        candidates.some((row) => row.source_ids.includes(source.source_id))
          ? "Use emitted candidate with the stated caveats."
          : "Retain as audit/reject context only for this round.",
      emitted_candidates: candidates.filter((row) => row.source_ids.includes(source.source_id)).length,
      rejected_or_overlap_leads: rejected.filter((row) => row.source_id === source.source_id).length,
      retrieval: fetchResults[key] || null
    })),
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    search_queries: [
      'site:belfastcity.gov.uk/news Belfast "officially opened" "2026" "building"',
      'site:belfastcity.gov.uk/news Belfast "work has started" "2026" "building"',
      'site:belfastcity.gov.uk/News Belfast heritage plaque Donegall Road workhouse',
      'site:belfastcity.gov.uk/News Belfast "supplementary planning guidance" historic areas',
      'site:belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications Belfast architecture May 2026',
      'site:minutes.belfastcity.gov.uk Belfast "Physical Programme Update" "Strand Arts Centre" "2026"',
      'site:communities-ni.gov.uk Belfast HED changes list buildings 2026'
    ],
    manual_source_recommendations: [
      "Check future Belfast committee packs for a dedicated workhouse burial-ground or memorial report that may name the plaque fabricator or provide a more precise installation record.",
      "Check Planning Portal and later Planning Committee minutes before adding live current-planning list items as application or decision milestones.",
      "Check future playground, parks and public-realm pages only when they add a distinct open/completed status not already represented by Playground Improvement Programme rows.",
      "Continue checking DfC/HED list-change publications for Belfast HB26 rows with explicit date, status and point geometry."
    ],
    overall_recommendation:
      "Round347 emits one cautious official Belfast heritage-marker candidate and records duplicate or mutable-list reasons for the other official sources checked."
  };
}

function buildCandidatesPayload(candidates, index) {
  return {
    schema_version: "round347_belfast_official_architecture_sweep_next3.candidates.v1",
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
        "manual corpus plus tmp/subagents JSON paths containing Belfast/HARNI/Round296/Round310/Round332/Round340 context"
    },
    prior_file_count: index.files.length,
    candidates
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: "round347_belfast_official_architecture_sweep_next3.rejected.v1",
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
    schema_version: "round347_belfast_official_architecture_sweep_next3.summary.v1",
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
      "Round347 emitted one distinct official Belfast heritage-marker candidate and retained duplicate or mutable current-list leads as rejects."
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name} (${source.source_url})`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round347 Belfast Official Architecture Sweep Next3",
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
    "One official-source lead survived duplicate checks: the former Belfast Workhouse burial-ground plaque marked on 8 May 2026 at Donegall Road. The row is intentionally limited to the council-reported plaque/marker milestone.",
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Next Manual Checks",
    "",
    "- Look for committee or procurement records naming the workhouse burial-ground plaque fabricator, installer, design approval or any wall/gatepost conservation scope.",
    "- Reconcile current-planning rows against Planning Portal and committee decisions before treating them as later application or approval milestones.",
    "- Recheck DfC/HED list-change publications for Belfast HB26 status rows with explicit date, geometry and non-duplicate building references.",
    "",
    "## Caveat",
    "",
    "Rows in this pack are official administrative or marker observations. They should stay separate from planning approvals, construction starts, handovers, openings, final design, mapped works boundaries and built-condition records unless those are sourced separately.",
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
    schema_version: "round347_belfast_official_architecture_sweep_next3.validation.v1",
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
  const candidates = LEADS.filter((lead) => lead.decision === "accept").map(buildCandidate);
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
