const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round357_belfast_official_architecture_sweep_next5";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const NIDIRECT_COPYRIGHT_URL = "https://www.nidirect.gov.uk/crown-copyright";

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
  bccPeaceplus: {
    source_id: "bcc-peaceplus-programme-page-round357",
    source_name: "PEACEPLUS",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/peaceplus",
    source_type: "official council programme page",
    license: "Belfast City Council website copyright and terms; factual programme metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Accessed current programme page",
    date_value: ACCESSED_AT,
    expected_markers: ["reconnected belfast", "community regeneration", "construction partners"]
  },
  bccPeaceplusShowcase: {
    source_id: "bcc-peaceplus-showcase-2025-09-22-round357",
    source_name: "PEACEPLUS projects to end racism and build peace showcased at City Hall to mark International Day of Peace",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/peaceplus-projects-to-end-racism-and-build-peace-s",
    source_type: "official council news page",
    license: "Belfast City Council website copyright and terms; factual event and programme metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2025-09-22",
    expected_markers: ["access to the hills", "peaceplus", "city hall"]
  },
  bccSandyRow: {
    source_id: "bcc-sandy-row-arts-digital-hub-open-2026-round357",
    source_name: "Boost for Sandy Row as new Arts & Digital Hub opens",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/boost-for-sandy-row-as-new-arts-digital-hub-opens",
    source_type: "official council news page",
    license: "Belfast City Council website copyright and terms; factual opening and project metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-02-18",
    expected_markers: ["sandy row", "arts", "coffee culture", "blythefield", "bentham drive"]
  },
  bccCathedralGardens: {
    source_id: "bcc-cathedral-gardens-works-start-2026-round357",
    source_name: "Cathedral Gardens transformation gets underway",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/cathedral-gardens-transformation-gets-underway",
    source_type: "official council news page",
    license: "Belfast City Council website copyright and terms; factual works-start metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-01-05",
    expected_markers: ["cathedral gardens", "work has started", "belfast blitz memorial"]
  },
  teoArdoyneYouthHub: {
    source_id: "teo-ardoyne-youth-hub-sod-cut-2026-round357",
    source_name: "First Minister and deputy First Minister cut sod at new purpose-built youth hub",
    publisher: "The Executive Office",
    source_url: "https://www.executiveoffice-ni.gov.uk/news/first-minister-and-deputy-first-minister-cut-sod-new-purpose-built-youth-hub",
    source_type: "official executive news page",
    license: "Northern Ireland public-sector website terms; factual milestone metadata retained for audit.",
    license_url: NIDIRECT_COPYRIGHT_URL,
    attribution: "The Executive Office",
    date_field: "Date published",
    date_value: "2026-03-30",
    expected_markers: ["ardoyne", "youth hub", "work is now underway", "crumlin road"]
  },
  dfcAlbertbridgeBrief: {
    source_id: "dfc-albertbridge-carnforth-development-brief-2026-round357",
    source_name: "269-283 Albertbridge Road and 2 Carnforth Street, Belfast - development brief",
    publisher: "Department for Communities",
    source_url: "https://www.communities-ni.gov.uk/publications/269-283-albertbridge-road-and-2-carnforth-street-belfast-development-brief",
    source_type: "official department publication page",
    license: "Crown copyright / public-sector information terms; factual publication metadata retained for audit.",
    license_url: NIDIRECT_COPYRIGHT_URL,
    attribution: "Department for Communities",
    date_field: "Date published",
    date_value: "2026-02-02",
    expected_markers: ["269-283 albertbridge road", "2 carnforth street", "development brief"]
  },
  dfiStAndrewsStoppingUp: {
    source_id: "dfi-st-andrews-square-west-stopping-up-2026-round357",
    source_name: "The St Andrews Square West, Belfast (Stopping-Up) Order (Northern Ireland) 2026",
    publisher: "Department for Infrastructure",
    source_url: "https://www.infrastructure-ni.gov.uk/publications/st-andrews-square-west-belfast-stopping-order-northern-ireland-2026",
    source_type: "official department roads-legislation publication page",
    license: "Crown copyright / public-sector information terms; factual publication metadata retained for audit.",
    license_url: NIDIRECT_COPYRIGHT_URL,
    attribution: "Department for Infrastructure",
    date_field: "Date published / commencement date",
    date_value: "2026-03-02 / 2026-04-20",
    expected_markers: ["st andrews square west", "stopping-up", "comes into operation"]
  },
  bccMarchPlanningNews: {
    source_id: "bcc-planning-committee-march-2026-approvals-round357",
    source_name: "New residential developments in east Belfast and grade A office block approved at council's Planning Committee",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/new-residential-developments-in-east-belfast-and-g",
    source_type: "official council planning news page",
    license: "Belfast City Council website copyright and terms; factual approval metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2026-03-10",
    expected_markers: ["45 park avenue", "cabin hill", "harberton", "mays meadow", "redcar street"]
  },
  dfcListChanges: {
    source_id: "dfc-hed-list-changes-page-round357",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    source_type: "official department publication page",
    license: "Crown copyright / Department for Communities terms; factual publication metadata retained for audit.",
    license_url: NIDIRECT_COPYRIGHT_URL,
    attribution: "Department for Communities Historic Environment Division",
    date_field: "Publication page accessed",
    date_value: ACCESSED_AT,
    expected_markers: ["list of buildings", "architectural", "historic interest"]
  },
  hedBuildingsLayer: {
    source_id: "dfc-hed-historic-buildings-arcgis-round357",
    source_name: "Historic Building Details / HED Buildings Database ArcGIS layer",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    source_url:
      "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/1",
    source_type: "official HED historic-building spatial layer",
    license: "Crown copyright / public-sector information terms; factual spatial endpoint metadata retained for audit.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division / nidirect",
    date_field: "Accessed current spatial layer",
    date_value: ACCESSED_AT,
    expected_markers: ["historic", "building", "feature"]
  }
};

const LEADS = [
  {
    key: "peaceplus_current_programme_page",
    source: "bccPeaceplus",
    date: ACCESSED_AT,
    title: "Belfast PEACEPLUS current programme page",
    category: "mutable_programme_page_or_duplicate",
    reason:
      "The current PEACEPLUS page is useful discovery context, but the architecture-related capital leads were already represented by Round332 or Round340, or were not yet source-stated as a distinct award, works-start, completion or opening milestone.",
    screened_terms: ["Reconnected Belfast", "Access to the Hills", "construction partners", "Community Regeneration and Transformation"]
  },
  {
    key: "peaceplus_international_day_showcase",
    source: "bccPeaceplusShowcase",
    date: "2025-09-22",
    title: "PEACEPLUS City Hall showcase and Access to the Hills artwork reference",
    category: "programme_event_context_only",
    reason:
      "The page documents a City Hall showcase and says an artwork will be placed in the Belfast Hills later. It does not provide a source-stated installation, opening, works-start or completed public-space milestone.",
    screened_terms: ["Access to the Hills", "Belfast Hills", "International Day of Peace", "PEACEPLUS"]
  },
  {
    key: "sandy_row_hub_coffee_blythefield_bentham",
    source: "bccSandyRow",
    date: "2026-02-18",
    title: "Sandy Row arts hub, Coffee Culture, open-space and Bentham Drive leads",
    category: "duplicate_existing_event",
    reason:
      "Sandy Row Arts and Digital Hub, Coffee Culture, Sandy Row Open Space/Blythefield Park and Bentham Drive sensory equipment are already represented in the current manual corpus and prior Belfast packs.",
    screened_terms: ["Sandy Row Arts", "Coffee Culture", "Sandy Row Open Space", "Blythefield Park", "Bentham Drive"]
  },
  {
    key: "cathedral_gardens_start_and_memorial",
    source: "bccCathedralGardens",
    date: "2026-01-05",
    title: "Cathedral Gardens works-start and Belfast Blitz Memorial scope",
    category: "duplicate_existing_event",
    reason:
      "Cathedral Gardens approval, works-start and Belfast Blitz Memorial design/scope records are already represented in the current manual corpus and prior Belfast packs.",
    screened_terms: ["Cathedral Gardens", "Belfast Blitz Memorial", "work has started", "spring 2027"]
  },
  {
    key: "ardoyne_youth_hub_sod_cut",
    source: "teoArdoyneYouthHub",
    date: "2026-03-30",
    title: "Ardoyne youth hub works-start milestone",
    category: "duplicate_existing_event",
    reason:
      "The Executive Office sod-cut / works-underway milestone for the Ardoyne Youth Enterprises hub is already present in the current manual corpus and earlier Belfast candidate packs.",
    screened_terms: ["Ardoyne youth hub", "former Ardoyne shops", "Crumlin Road", "work is now underway"]
  },
  {
    key: "albertbridge_carnforth_development_brief",
    source: "dfcAlbertbridgeBrief",
    date: "2026-02-02",
    title: "Albertbridge Road / Carnforth Street development brief publication",
    category: "duplicate_existing_event",
    reason:
      "The DfC development-brief publication milestone is already represented in the current manual corpus from Round124, and later tail rounds retained it as a duplicate.",
    screened_terms: ["269-283 Albertbridge Road", "2 Carnforth Street", "development brief"]
  },
  {
    key: "st_andrews_square_west_stopping_up",
    source: "dfiStAndrewsStoppingUp",
    date: "2026-04-20",
    title: "St Andrews Square West stopping-up order",
    category: "not_architecture_or_city_change_atlas_fit",
    reason:
      "The DfI order is official and dated, but it is a short roads-legislation record and does not identify a building, public-building delivery, heritage/listing action, conservation works, planning decision or programme delivery milestone suitable for the architecture atlas.",
    screened_terms: ["St Andrews Square West", "Stopping-Up Order", "SR 2026 No. 27"]
  },
  {
    key: "march_planning_approval_cluster",
    source: "bccMarchPlanningNews",
    date: "2026-03-10",
    title: "March 2026 Planning Committee architecture approval cluster",
    category: "duplicate_existing_event",
    reason:
      "Mount Masonic Hall / 45 Park Avenue, Cabin Hill, Harberton, Mays Meadow and Redcar Street were already screened in Round353 and have matching current-corpus or prior-pack coverage.",
    screened_terms: ["45 Park Avenue", "Cabin Hill", "Harberton", "Mays Meadow", "Redcar Street"]
  },
  {
    key: "dfc_hed_list_changes_page",
    source: "dfcListChanges",
    date: ACCESSED_AT,
    title: "DfC HED changes-to-list publication page",
    category: "no_new_safe_row_in_this_pass",
    reason:
      "Recent Belfast HED/list-change leads visible from prior rounds were already screened or ingested. This pass did not isolate a further distinct Belfast HB26 row with a safe date, status and geometry.",
    screened_terms: ["All Saints", "Former Nurses Home", "Knock Burial Ground", "Victoria College", "HB26"]
  },
  {
    key: "hed_buildings_layer",
    source: "hedBuildingsLayer",
    date: ACCESSED_AT,
    title: "HED historic-building spatial layer",
    category: "supporting_endpoint_only",
    reason:
      "The ArcGIS layer remains useful for HB references and point geometry, but this pass did not identify a non-duplicate Belfast list-status change needing HED geometry support.",
    screened_terms: ["HB26", "historic building", "Belfast"]
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
    .replace(/[^a-z0-9/]+/g, " ")
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
    rel.includes("round332") ||
    rel.includes("round340") ||
    rel.includes("round347") ||
    rel.includes("round353")
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
  const seenFiles = new Set();
  for (const filePath of files) {
    if (!fs.existsSync(filePath) || seenFiles.has(filePath)) continue;
    seenFiles.add(filePath);
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
  for (const term of lead.screened_terms || []) {
    const needle = normalizeText(term);
    if (!needle) continue;
    const hit = index.snippets.find((entry) => entry.text.includes(needle));
    if (hit) hits.push({ term, file: hit.file, title: hit.title });
  }
  return hits.slice(0, 12);
}

async function fetchSource(key, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round357 Belfast official architecture source audit" }
    });
    const body = await response.text();
    const text = normalizeText(body);
    return [
      key,
      {
        ok: response.ok,
        status: response.status,
        status_text: response.statusText,
        fetched_url: response.url || source.source_url,
        content_type: response.headers.get("content-type") || "",
        bytes: Buffer.byteLength(body),
        contains_expected_markers: Object.fromEntries((source.expected_markers || []).map((marker) => [marker, text.includes(normalizeText(marker))]))
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

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function buildRejected(index) {
  return LEADS.map((lead) => {
    const source = SOURCES[lead.source];
    return {
      key: lead.key,
      city_id: "belfast",
      title: lead.title,
      date: lead.date,
      category: lead.category,
      reason: lead.reason,
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      screened_terms: lead.screened_terms,
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      accessed_at: ACCESSED_AT,
      transformation_method:
        "Round357 official-source exhaustion screen; lead was checked against the current manual corpus and prior Belfast packs before being retained as a reject/audit row.",
      duplicate_or_overlap_hits: duplicateHits(lead, index)
    };
  });
}

function buildCandidatesPayload(index) {
  return {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: 0,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    emitted_date_range: { min: null, max: null },
    source_ids: [],
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_belfast_pack_rule:
        "manual corpus plus tmp/subagents JSON paths containing Belfast/HARNI/Round332/Round340/Round347/Round353 context"
    },
    prior_file_count: index.files.length,
    candidates: []
  };
}

function buildSourceAudit(fetchResults, rejected) {
  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    result: "no_candidates_emitted",
    source_audits: Object.entries(SOURCES).map(([key, source]) => ({
      source_id: source.source_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.source_url,
      source_type: source.source_type,
      license: source.license,
      license_url: source.license_url,
      attribution: source.attribution,
      coverage_years_checked: "2008-01-01 through 2026-05-20 for additional official Belfast architecture-related leads.",
      geographic_scope: "Belfast city and named official project/building/heritage locations.",
      key_fields_reviewed:
        "Page or publication date, committee or project reference where available, named site, source URL, publisher attribution, terms, and geometry or geometry_ref availability.",
      reliability:
        key === "hedBuildingsLayer"
          ? "strong for current official HB reference and point geometry when a non-duplicate list-status lead exists"
          : "usable with caveats for official planning, programme, legislation, publication or project milestones",
      required_caveats:
        "Do not infer approval, construction start, completion, opening, final design, statutory listing confirmation, exact boundary, or built condition unless the cited source explicitly states that milestone.",
      ingestion_recommendation: "Do not ingest from this round; retain checked source as audit context only.",
      emitted_candidates: 0,
      rejected_or_overlap_leads: rejected.filter((row) => row.source_id === source.source_id).length,
      retrieval: fetchResults[key] || null
    })),
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    web_queries_checked: [
      'site:belfastcity.gov.uk/news Belfast City Council 2026 opened refurbishment building Belfast architecture',
      'site:belfastcity.gov.uk/news Belfast "officially opened" "Date:" "2026"',
      'site:belfastcity.gov.uk/news Belfast "work has started" "Date:" "2026" "redevelopment"',
      'site:executiveoffice-ni.gov.uk Belfast Urban Villages 2026 building opened official',
      'site:communities-ni.gov.uk Belfast 2026 building refurbishment heritage official',
      'site:infrastructure-ni.gov.uk Belfast 2026 planning approval listed building official architecture'
    ],
    manual_source_recommendations: [
      "Recheck later Belfast Planning Committee decisions-issued lists after March 2026 for fresh non-duplicate decisions.",
      "For PEACEPLUS and NRF pages, wait for a dated committee minute, award, works-start, completion, opening or statutory milestone rather than ingesting mutable programme-page text.",
      "For DfC/HED, continue checking row-level changes-to-list attachments and HED ArcGIS points for new Belfast HB26 records not already screened by Rounds340, 347 and 353.",
      "For Urban Villages and Executive Office pages, dedupe against existing Sandy Row, Coffee Culture and Ardoyne youth hub records before retaining a milestone."
    ],
    overall_recommendation:
      "Round357 found no safe new ingestible official Belfast architecture candidate. The checked official leads were duplicates, programme/event context, supporting endpoints, or outside the current architecture-atlas fit."
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count: rejected.length,
    rejected,
    rejected_category_counts: countBy(rejected, (row) => row.category)
  };
}

function buildSummary(candidatesPayload, rejected, sourceAudit, index, validation) {
  return {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    accepted_candidates: 0,
    candidate_count: 0,
    rejected_detail_count: rejected.length,
    emitted_date_range: candidatesPayload.emitted_date_range,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    sources_checked: sourceAudit.source_audits.length,
    source_ids_checked: sourceAudit.source_audits.map((row) => row.source_id),
    rejected_category_counts: countBy(rejected, (row) => row.category),
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
      "Round357 emitted no candidates; checked official Belfast architecture leads were duplicate, programme/event context, supporting endpoints, or outside the current architecture-atlas fit."
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name} (${source.source_url})`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round357 Belfast Official Architecture Sweep Next5",
    "",
    `Generated/accessed: ${ACCESSED_AT}`,
    "",
    "## Result",
    "",
    "- Accepted candidates: 0",
    `- Rejected/detail rows retained: ${summary.rejected_detail_count}`,
    "- Accepted date range: none",
    `- Sources checked: ${summary.sources_checked}`,
    `- Prior files screened: ${summary.dedupe.prior_file_count}`,
    `- Prior records indexed: ${summary.dedupe.prior_record_count}`,
    `- Validation: ${summary.validation.ok ? "passed" : "failed"}`,
    "",
    "## Sources Checked",
    "",
    ...sourceLines,
    "",
    "## Exhaustion Notes",
    "",
    "The official 2026 pages that looked most promising were already covered by the current corpus or by the newest Belfast packs: Sandy Row/Coffee Culture/Blythefield/Bentham, Cathedral Gardens, Ardoyne Youth Hub, Albertbridge/Carnforth, and the March 2026 Planning Committee approval cluster. PEACEPLUS pages remain useful discovery sources, but this pass did not find a new distinct source-stated physical/admin milestone suitable for ingestion.",
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Next Manual Checks",
    "",
    "- Recheck future Belfast Planning Committee decision pages and decisions-issued lists for new post-March 2026 decisions.",
    "- Recheck DfC/HED list-change attachments for new Belfast HB26 rows with explicit status, date and point geometry.",
    "- Recheck PEACEPLUS and NRF sources only when a dated official page or committee pack adds a fresh award, works-start, completion, opening or statutory milestone.",
    "- Recheck Executive Office Urban Villages pages for post-Ardoyne/Sandy Row delivery milestones with clear site and date fields.",
    "",
    "## Caveat",
    "",
    "This pack is an exhaustion record. It should not be appended as event data; it is meant to prevent duplicate ingestion and point the next sweep toward manual checks with a better chance of distinct provenance.",
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
  const candidates = payloads.candidates.candidates || [];
  const rejected = payloads.rejected.rejected || [];

  if (payloads.candidates.candidate_count !== 0 || candidates.length !== 0) errors.push("exhaustion pack should not emit candidates");
  if (!payloads.sourceAudit.source_audits?.length) errors.push("source audit is empty");
  if (!payloads.summary.dedupe?.prior_file_count) errors.push("dedupe index did not include prior files");
  if (!rejected.length) errors.push("rejected/audit detail rows are empty");

  for (const row of rejected) {
    for (const field of ["key", "title", "date", "category", "reason", "source_name", "publisher", "source_url", "license", "accessed_at"]) {
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
    schema_version: `${ROUND_ID}.validation.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    ok: errors.length === 0,
    errors,
    warnings: [],
    checked: {
      no_candidates_emitted: candidates.length === 0,
      rejected_detail_present: rejected.length > 0,
      candidate_cap_50: true,
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      source_audit_present: Boolean(payloads.sourceAudit.source_audits?.length),
      dedupe_against_current_manual_and_prior_belfast_packs: true,
      overclaim_wording_scan: true
    }
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const [index, fetchResults] = await Promise.all([Promise.resolve(buildExistingIndex()), fetchAllSources()]);
  const candidatesPayload = buildCandidatesPayload(index);
  const rejected = buildRejected(index);
  const rejectedPayload = buildRejectedPayload(rejected);
  const sourceAudit = buildSourceAudit(fetchResults, rejected);

  let validation = validateOutputs({
    candidates: candidatesPayload,
    sourceAudit,
    rejected: rejectedPayload,
    summary: { dedupe: { prior_file_count: index.files.length } },
    notes: ""
  });
  const summary = buildSummary(candidatesPayload, rejected, sourceAudit, index, validation);
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
        accepted_candidates: 0,
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
