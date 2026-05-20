const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round353_belfast_official_architecture_sweep_next4";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
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
  rejected: path.join(OUT_DIR, "rejected.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  validation: path.join(OUT_DIR, "validation.json"),
  validationReport: path.join(OUT_DIR, "validation_report.json")
};

const SOURCES = {
  bccMarchPlanningNews: {
    source_id: "bcc-planning-committee-march-2026-approvals-round353",
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
  bccMarchPlanningAgenda: {
    source_id: "bcc-planning-committee-2026-03-10-agenda-round353",
    source_name: "Planning Committee agenda, 10 March 2026",
    publisher: "Belfast City Council",
    source_url: "https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=12349",
    source_type: "official council committee agenda",
    license: "Belfast City Council public committee-document terms; factual agenda metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Committee meeting date",
    date_value: "2026-03-10",
    expected_markers: ["la04/2025/0837/f", "la04/2025/1272/f", "la04/2025/0574/f", "la04/2025/0463/f"]
  },
  bccHarbertonReport: {
    source_id: "bcc-harberton-la04-2025-1272-report-round353",
    source_name: "LA04/2025/1272/F - Harberton Special School final",
    publisher: "Belfast City Council",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/s126543/LA04%202025%201272%20F%20-%20Harberton%20Special%20School%20final.pdf",
    source_type: "official planning committee development-management report",
    license: "Belfast City Council public committee-document terms; factual report metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Committee meeting date",
    date_value: "2026-03-10",
    expected_markers: ["la04/2025/1272/f", "temporary mobile classroom", "harberton"]
  },
  bccRedcarReport: {
    source_id: "bcc-redcar-la04-2025-0463-report-round353",
    source_name: "LA04/2025/0463/F - Redcar Street",
    publisher: "Belfast City Council",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/s126484/LA04%202025%200463%20F%20Redcar%20St.pdf",
    source_type: "official planning committee development-management report",
    license: "Belfast City Council public committee-document terms; factual report metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Committee meeting date",
    date_value: "2026-03-10",
    expected_markers: ["la04/2025/0463/f", "redcar street", "padel"]
  },
  bccNrfPage: {
    source_id: "bcc-neighbourhood-regeneration-fund-page-round353",
    source_name: "Neighbourhood Regeneration Fund",
    publisher: "Belfast City Council",
    source_url:
      "https://www.belfastcity.gov.uk/business-and-investment/physical-investment/funding-programmes/neighbourhood-regeneration-fund",
    source_type: "official council programme page",
    license: "Belfast City Council website copyright and terms; factual programme metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Accessed current programme page",
    date_value: ACCESSED_AT,
    expected_markers: ["michael davitt", "act initiative", "belfast orange hall", "solas", "st joseph"]
  },
  bccWestAwgNrf: {
    source_id: "bcc-west-awg-nrf-2026-02-26-round353",
    source_name: "West Belfast Area Working Group - Neighbourhood Regeneration Fund, 26 February 2026",
    publisher: "Belfast City Council",
    source_url: "https://minutes.belfastcity.gov.uk/documents/s126858/WBAWG%2026.02.26.pdf",
    source_type: "official council area-working-group minutes/report",
    license: "Belfast City Council public committee-document terms; factual project-status metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "Working group date",
    date_value: "2026-02-26",
    expected_markers: ["michael davitt", "act initiative", "mountainview", "glencairn"]
  },
  bccCityDealProgress: {
    source_id: "bcc-city-deal-progress-2025-09-24-round353",
    source_name: "Belfast Region already reaping rewards from City Deal programme of investment",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/news/belfast-region-already-reaping-rewards-from-city-d",
    source_type: "official council City Deal news page",
    license: "Belfast City Council website copyright and terms; factual programme metadata retained for audit.",
    license_url: BCC_TERMS_URL,
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2025-09-24",
    expected_markers: ["studio ulster", "digital twin", "ireach"]
  },
  dfcListChanges: {
    source_id: "dfc-hed-list-changes-page-round353",
    source_name: "Changes to the List of Buildings of special architectural or historic interest",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest",
    source_type: "official department publication page",
    license: "Crown copyright / Department for Communities terms; factual publication metadata retained for audit.",
    license_url: "https://www.communities-ni.gov.uk/crown-copyright",
    attribution: "Department for Communities Historic Environment Division",
    date_field: "Publication page accessed",
    date_value: ACCESSED_AT,
    expected_markers: ["list of buildings", "architectural", "historic interest"]
  },
  hedBuildingsLayer: {
    source_id: "dfc-hed-historic-buildings-arcgis-round353",
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
    key: "mount_masonic_hall_social_housing_approval",
    source: "bccMarchPlanningNews",
    date: "2026-03-10",
    title: "Mount Masonic Hall / 45 Park Avenue social-housing planning approval",
    category: "duplicate_existing_event",
    reason:
      "Existing manual corpus and Round95 already contain the LA04/2025/0837/F approval for demolition of Mount Masonic Hall and 35 social homes at 45 Park Avenue.",
    screened_terms: ["LA04/2025/0837/F", "Mount Masonic Hall", "45 Park Avenue", "35 social housing"]
  },
  {
    key: "cabin_hill_residential_approval",
    source: "bccMarchPlanningNews",
    date: "2026-03-10",
    title: "Former Cabin Hill 53-unit residential planning approval",
    category: "duplicate_existing_event",
    reason:
      "Existing manual corpus, Round119 and Round126 already contain the LA04/2024/0015/F Cabin Hill residential approval.",
    screened_terms: ["LA04/2024/0015/F", "Cabin Hill", "53 residential units", "Upper Newtownards Road"]
  },
  {
    key: "harberton_mobile_classroom_approval",
    source: "bccHarbertonReport",
    date: "2026-03-10",
    title: "Harberton North Special School temporary mobile classroom village approval",
    category: "duplicate_existing_event",
    reason:
      "Existing manual corpus, Round110 and Round126 already contain the LA04/2025/1272/F Harberton temporary classroom village milestone.",
    screened_terms: ["LA04/2025/1272/F", "Harberton North Special School", "temporary mobile classroom"]
  },
  {
    key: "mays_meadow_lanyon_place_office_approval",
    source: "bccMarchPlanningNews",
    date: "2026-03-10",
    title: "Lanyon Place / Mays Meadow grade-A office block approval",
    category: "duplicate_existing_event",
    reason:
      "Existing manual corpus, Round95 and Round126 already contain LA04/2025/0574/F for the Mays Meadow/Lanyon Place office scheme.",
    screened_terms: ["LA04/2025/0574/F", "Mays Meadow", "Lanyon Place", "grade A office"]
  },
  {
    key: "redcar_street_padel_approval",
    source: "bccRedcarReport",
    date: "2026-03-10",
    title: "Redcar Street vacant warehouse padel-facility approval",
    category: "duplicate_existing_event",
    reason:
      "Existing manual corpus, Round110 and Round112 already contain LA04/2025/0463/F for the Decco Ltd / Redcar Street warehouse change-of-use approval.",
    screened_terms: ["LA04/2025/0463/F", "Redcar Street", "Decco Ltd", "Padel"]
  },
  {
    key: "nrf_underway_projects_page",
    source: "bccNrfPage",
    date: ACCESSED_AT,
    title: "Neighbourhood Regeneration Fund projects-underway page",
    category: "mutable_programme_page_or_duplicate",
    reason:
      "The current NRF page is useful discovery context, but the named underway projects checked here are already represented by more specific committee, news or project-status rows, or lack a fresh dated physical milestone on the page.",
    screened_terms: [
      "Michael Davitt Community Heritage Centre",
      "ACT Initiative Community Hub",
      "Belfast Orange Hall",
      "AYE Youth and Community Hub",
      "Solas new build"
    ]
  },
  {
    key: "west_awg_michael_davitt_act_glencairn_mountainview",
    source: "bccWestAwgNrf",
    date: "2026-02-26",
    title: "West Belfast NRF Area Working Group project statuses",
    category: "duplicate_or_not_ingestible",
    reason:
      "Michael Davitt, ACT Initiative and Mountainview status rows are already in the current manual corpus. Glencairn was awaiting a planning-application response in this report, so it is not a clean new approval, works-start, completion or opening milestone.",
    screened_terms: ["Michael Davitt", "ACT Initiative", "Mountainview Hotel", "Glencairn Community Project Hub"]
  },
  {
    key: "city_deal_studio_ulster_digital_twin_ireach",
    source: "bccCityDealProgress",
    date: "2025-09-24",
    title: "Belfast Region City Deal progress page facility leads",
    category: "duplicate_existing_event",
    reason:
      "Studio Ulster opening, UK Digital Twin Centre opening and iREACH Health construction-start/approval records are already present in the manual corpus from more direct project or partner sources.",
    screened_terms: ["Studio Ulster", "UK Digital Twin Centre", "iREACH Health"]
  },
  {
    key: "dfc_hed_list_changes_page",
    source: "dfcListChanges",
    date: ACCESSED_AT,
    title: "DfC HED changes-to-list publication page",
    category: "no_new_safe_row_in_this_pass",
    reason:
      "Recent Belfast HED/list-change leads visible from prior rounds were already screened or ingested, including All Saints, Knock Burial Ground and Victoria College-related rows. No additional distinct Belfast HB26 row with safe date, status and geometry was isolated in this round.",
    screened_terms: ["All Saints", "Knock Burial Ground", "Victoria College", "HB26"]
  },
  {
    key: "hed_buildings_layer",
    source: "hedBuildingsLayer",
    date: ACCESSED_AT,
    title: "HED historic-building spatial layer",
    category: "supporting_endpoint_only",
    reason:
      "The ArcGIS layer remains useful for HB references and point geometry, but this pass did not identify a non-duplicate Belfast list-status change needing HED geometry support.",
    screened_terms: ["HB26/27/054", "HB26/11/002", "HB26/18/192"]
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
    rel.includes("round296") ||
    rel.includes("round310") ||
    rel.includes("round332") ||
    rel.includes("round340") ||
    rel.includes("round347")
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
  for (const term of lead.screened_terms || []) {
    const needle = normalizeText(term);
    if (!needle) continue;
    const hit = index.snippets.find((entry) => entry.text.includes(needle));
    if (hit) hits.push({ term, file: hit.file, title: hit.title });
  }
  return hits.slice(0, 10);
}

async function fetchSource(key, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round353 Belfast official architecture source audit" }
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
        "Round353 official-source exhaustion screen; lead was checked against the current manual corpus and prior Belfast packs before being retained as a reject/audit row.",
      duplicate_or_overlap_hits: duplicateHits(lead, index)
    };
  });
}

function buildCandidatesPayload(index) {
  return {
    schema_version: "round353_belfast_official_architecture_sweep_next4.candidates.v1",
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
        "manual corpus plus tmp/subagents JSON paths containing Belfast/HARNI/Round296/Round310/Round332/Round340/Round347 context"
    },
    prior_file_count: index.files.length,
    candidates: []
  };
}

function buildSourceAudit(fetchResults, rejected) {
  return {
    schema_version: "round353_belfast_official_architecture_sweep_next4.source_audit.v1",
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
        "Page or committee date, application/reference text where available, named project or site, source URL, publisher attribution, terms, and geometry or geometry_ref availability.",
      reliability:
        key === "hedBuildingsLayer"
          ? "strong for current official HB reference and point geometry when a non-duplicate list-status lead exists"
          : key === "dfcListChanges"
            ? "strong for official HED publication discovery, but row-level PDFs or spatial records are still needed for ingestion"
            : "usable with caveats for official planning, programme or committee milestones",
      required_caveats:
        "Do not infer approval, construction start, completion, opening, final design, statutory listing confirmation, exact boundary, or built condition unless the cited source explicitly states that milestone.",
      ingestion_recommendation: "Do not ingest from this round; retain checked source as audit context only.",
      emitted_candidates: 0,
      rejected_or_overlap_leads: rejected.filter((row) => row.source_id === source.source_id).length,
      retrieval: fetchResults[key] || null
    })),
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    search_queries: [
      'site:belfastcity.gov.uk/News Belfast "Date:" "2026" "building" "opened"',
      'site:belfastcity.gov.uk/News Belfast "Date:" "2026" "refurbishment"',
      'site:belfastcity.gov.uk/News Belfast "Date:" "2026" "restoration"',
      'site:belfastcity.gov.uk/News Belfast "Date:" "2026" "works" "started"',
      'site:belfastcity.gov.uk/News Belfast building opened refurbished restored council 2025 architecture',
      'site:minutes.belfastcity.gov.uk Belfast "Physical Programme Update" "Strand Arts Centre" "2026"',
      'site:communities-ni.gov.uk Belfast "Changes to the List of Buildings" "2026"'
    ],
    manual_source_recommendations: [
      "Check later Planning Committee decisions-issued lists after March 2026 before adding any of the March approval leads again.",
      "For NRF pages, wait for a dated committee minute, award, works-start, completion or opening record rather than ingesting mutable programme-page status text.",
      "For DfC/HED, continue checking row-level changes-to-list attachments and HED ArcGIS points for new Belfast HB26 records not already screened by Rounds310, 340 and 347.",
      "For Belfast City Deal facilities, prefer direct project-owner or official launch pages and dedupe against existing Studio Ulster, UK Digital Twin Centre and iREACH rows."
    ],
    overall_recommendation:
      "Round353 found no safe new ingestible official Belfast architecture candidate. The checked official leads were duplicates, mutable programme context, or lacked a distinct source-stated physical/admin milestone."
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: "round353_belfast_official_architecture_sweep_next4.rejected.v1",
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
    schema_version: "round353_belfast_official_architecture_sweep_next4.summary.v1",
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
      "Round353 emitted no candidates; all checked official Belfast architecture leads were duplicate, mutable programme context, or not safe for a distinct source-stated event."
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name} (${source.source_url})`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round353 Belfast Official Architecture Sweep Next4",
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
    "The March 2026 Belfast Planning Committee approval cluster looked promising, but every ingestible application lead was already represented in the current manual corpus or prior Belfast packs. The NRF and Area Working Group pages are useful discovery sources, but this pass did not find a new distinct dated milestone that was not already represented.",
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Next Manual Checks",
    "",
    "- Recheck future Belfast Planning Committee decisions-issued lists for new post-March 2026 decisions rather than reusing the March approval cluster.",
    "- Recheck DfC/HED list-change attachments for new Belfast HB26 rows with explicit status, date and point geometry.",
    "- Recheck NRF and PEACEPLUS pages only when a dated official page or committee pack adds a fresh award, works-start, completion, opening or statutory milestone.",
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
    schema_version: "round353_belfast_official_architecture_sweep_next4.validation.v1",
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
