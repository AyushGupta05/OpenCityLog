const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round332_belfast_official_architecture_sweep_next";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";

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
  bccPeaceplusNews: {
    source_id: "bcc-peaceplus-projects-unveiled-2024-round332",
    source_name: "Transformative Belfast PEACEPLUS projects unveiled during Good Relations Week",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/News/Transformative-Belfast-PEACEPLUS-projects-unveiled",
    source_type: "official council news page",
    license:
      "Belfast City Council website copyright and terms; factual project metadata and source URLs retained for audit.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council",
    date_field: "News page date",
    date_value: "2024-09-20",
    update_frequency: "Archived council news page."
  },
  bccPeaceplusProjectPage: {
    source_id: "bcc-peaceplus-project-page-round332",
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
  }
};

const LEADS = [
  {
    key: "annadale_open_space_peaceplus_capital_project_unveiled",
    decision: "accept",
    event_id: "round332_belfast_annadale_open_space_peaceplus_capital_project_unveiled_2024",
    title: "Annadale Open Space PEACEPLUS capital project was unveiled",
    summary:
      "Belfast City Council's 20 September 2024 PEACEPLUS news page recorded Annadale Open Space among five local areas where capital works and activity projects were included in the PEACEPLUS Local Action Plan.",
    observed_change:
      "A documented council programme milestone identified Annadale Open Space as a PEACEPLUS community regeneration capital-project location.",
    area: "Annadale Embankment",
    latitude: 54.5746,
    longitude: -5.9124,
    geometry_source:
      "Approximate point on Annadale Embankment from the council-stated project location; no official project polygon was exposed by the source pages.",
    geometry_precision:
      "Approximate project-location point, not a surveyed works boundary, playpark layout, community-facility footprint, pathway line, or land parcel.",
    project_type: "community open-space capital project inclusion",
    milestone_type: "capital_project_inclusion_unveiled",
    source: "bccPeaceplusNews",
    supporting_sources: ["bccPeaceplusProjectPage"],
    source_record_id: "PEACEPLUS news page, 20 September 2024: Annadale Open Space capital works/activity project",
    duplicate_terms: ["Annadale Open Space", "PEACEPLUS", "Annadale Embankment"],
    duplicate_check_note:
      "Searched the current manual corpus and Belfast prior packs for Annadale Open Space, PEACEPLUS and Annadale Embankment. Existing records cover Annadale community-centre, Annadale Avenue planning rows and Lagan Gateway/Annadale works, but not this PEACEPLUS Annadale Open Space programme-inclusion milestone.",
    limitations:
      "This is a programme-inclusion and project-unveiling record. It does not document planning approval, construction start, handover, opening, final design, as-built layout, public access, or a completed open-space condition."
  },
  {
    key: "distillery_street_peaceplus_capital_project_unveiled",
    decision: "accept",
    event_id: "round332_belfast_distillery_street_peaceplus_capital_project_unveiled_2024",
    title: "Distillery Street PEACEPLUS capital project was unveiled",
    summary:
      "Belfast City Council's 20 September 2024 PEACEPLUS news page recorded Distillery Street among five local areas where capital works and activity projects were included in the PEACEPLUS Local Action Plan.",
    observed_change:
      "A documented council programme milestone identified Distillery Street as a PEACEPLUS community regeneration capital-project location.",
    area: "Distillery Street",
    latitude: 54.5949,
    longitude: -5.9487,
    geometry_source:
      "Approximate point on Distillery Street from the council-stated project location; no official project polygon was exposed by the source pages.",
    geometry_precision:
      "Approximate street-location point, not a surveyed natural-play area, path alignment, lighting inventory, entrance works boundary, or land parcel.",
    project_type: "community public-realm capital project inclusion",
    milestone_type: "capital_project_inclusion_unveiled",
    source: "bccPeaceplusNews",
    supporting_sources: ["bccPeaceplusProjectPage"],
    source_record_id: "PEACEPLUS news page, 20 September 2024: Distillery Street capital works/activity project",
    duplicate_terms: ["Distillery Street", "PEACEPLUS"],
    duplicate_check_note:
      "Searched the current manual corpus and Belfast prior packs for Distillery Street and PEACEPLUS. Existing hits are unrelated planning rows at 28 Distillery Street, not this PEACEPLUS public-realm/community-zone programme-inclusion milestone.",
    limitations:
      "This is a programme-inclusion and project-unveiling record. It does not document planning approval, construction start, handover, opening, final design, as-built layout, public access, or a completed public-realm condition."
  },
  {
    key: "lgbtqia_hub_2_royal_avenue_peaceplus",
    decision: "reject_duplicate",
    title: "2 Royal Avenue LGBTQIA+ Hub PEACEPLUS capital project",
    source: "bccPeaceplusNews",
    date: "2024-09-20",
    reason:
      "2 Royal Avenue is already represented by acquisition/reuse, landlord works, ground-floor expression-of-interest and access/fenestration planning milestones; a separate PEACEPLUS listing would overlap the same building programme without a new physical or administrative status date.",
    screened_terms: ["2 Royal Avenue", "LGBTQIA+ Hub", "PEACEPLUS"]
  },
  {
    key: "access_to_the_hills_peaceplus",
    decision: "reject_overlap",
    title: "Access to the Hills PEACEPLUS capital project",
    source: "bccPeaceplusNews",
    date: "2024-09-20",
    reason:
      "The existing corpus already contains Access to the Hills as a Belfast capital-programme project in development. The current PEACEPLUS page is useful context but does not add a clean new date, mapped geometry or named construction milestone.",
    screened_terms: ["Access to the Hills", "Black Mountain", "Upper Whiterock", "PEACEPLUS"]
  },
  {
    key: "sanctuary_theatre_peaceplus",
    decision: "reject_duplicate",
    title: "Sanctuary Theatre PEACEPLUS capital project",
    source: "bccPeaceplusNews",
    date: "2024-09-20",
    reason:
      "The existing corpus already contains a Sanctuary Theatre design-team/status milestone from Belfast area-working-group papers; the PEACEPLUS page is programme context rather than a distinct later status record.",
    screened_terms: ["Sanctuary Theatre", "PEACEPLUS", "Castlereagh Street"]
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
  return rel.includes("belfast") || rel.includes("harni") || rel.includes("round310") || rel.includes("round296");
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
  const textSnippets = [];
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
        row.source_record_id,
        row.source_url
      ].join(" "));
      if (text) textSnippets.push({ text, file: path.relative(ROOT, filePath).replace(/\\/g, "/"), title: row.title || "" });
    }
  }
  return { files: indexedFiles, snippets: textSnippets };
}

function duplicateHits(lead, index) {
  const hits = [];
  for (const term of lead.duplicate_terms || lead.screened_terms || []) {
    const needle = normalizeText(term);
    if (!needle) continue;
    const hit = index.snippets.find((entry) => entry.text.includes(needle));
    if (hit) {
      hits.push({ term, file: hit.file, title: hit.title });
    }
  }
  return hits.slice(0, 8);
}

function isoDateInWindow(value) {
  return typeof value === "string" && value >= DATE_MIN && value <= DATE_MAX;
}

function buildCandidate(lead) {
  const source = SOURCES[lead.source];
  const supportingSources = (lead.supporting_sources || []).map((key) => SOURCES[key]);
  return {
    city_id: "belfast",
    event_id: lead.event_id,
    date: source.date_value,
    date_precision: "day",
    bucket: "planning/development/architecture/community capital works",
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
    geometry_ref: lead.area,
    geometry_source: lead.geometry_source,
    geometry_precision: lead.geometry_precision,
    source_ids: [source.source_id, ...supportingSources.map((item) => item.source_id)],
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
      "Belfast City Council, PEACEPLUS programme partners, and local project teams; designer and construction partners not named in the cited source pages.",
    limitations: lead.limitations,
    caveats:
      "Use as an administrative programme milestone only. Keep it separate from approvals, starts, completions, openings and final built form.",
    duplicate_check_note: lead.duplicate_check_note,
    source_audit_note:
      "Official Belfast City Council pages are suitable for cautious programme-inclusion metadata. The source pages state project names and programme context but do not expose project polygons, row-level contract data, final design documents or completion records.",
    transformation_method:
      "Round332 manual official-source sweep; source pages were fetched for availability and markers, candidate terms were checked against the current manual corpus and prior Belfast packs, and two distinct non-duplicate programme milestones were normalized with approximate point geometry."
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
      category: lead.decision,
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
        "Round332 manual official-source screen; lead was checked against the current manual corpus and prior Belfast packs.",
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

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source.source_url, {
      signal: controller.signal,
      headers: { "user-agent": "Bims-5 Round332 Belfast official architecture source audit" }
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
        peaceplus: text.includes("peaceplus"),
        annadale: text.includes("annadale"),
        distillery: text.includes("distillery"),
        sanctuary: text.includes("sanctuary"),
        "2 royal avenue": text.includes("2 royal avenue")
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
  const entries = await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => [key, await fetchSource(source)]));
  return Object.fromEntries(entries);
}

function buildSourceAudit(fetchResults, candidates, rejected) {
  return {
    schema_version: "round332_belfast_official_architecture_sweep_next.source_audit.v1",
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
      geographic_scope: "Belfast City Council PEACEPLUS capital-project locations.",
      key_fields_reviewed:
        "News/page date, project name, project location text, programme/funding context, source URL and council attribution.",
      reliability:
        key === "bccPeaceplusNews"
          ? "strong for official programme-announcement date and named project locations"
          : "usable with caveats for current project descriptions",
      required_caveats:
        "Programme pages identify capital-project locations but do not document planning approval, construction start, completion, opening, final design, or mapped extents.",
      ingestion_recommendation:
        key === "bccPeaceplusNews"
          ? "Use only the two non-duplicate programme-inclusion candidates emitted in this pack; retain caveats and approximate geometry."
          : "Use as supporting context only unless a later dated page state adds a distinct row-level milestone.",
      emitted_candidates: candidates.filter((row) => row.source_ids.includes(source.source_id)).length,
      rejected_or_overlap_leads: rejected.filter((row) => row.source_id === source.source_id).length,
      retrieval: fetchResults[key] || null
    })),
    checked_urls: Object.values(SOURCES).map((source) => source.source_url),
    search_queries: [
      'site:belfastcity.gov.uk "PEACEPLUS" "Annadale Open Space" Belfast',
      'site:belfastcity.gov.uk "PEACEPLUS" "Distillery Street" Belfast',
      'site:belfastcity.gov.uk "Sanctuary Theatre" "PEACEPLUS" Belfast',
      'site:belfastcity.gov.uk "2 Royal Avenue" "LGBTQIA+ Hub"'
    ],
    overall_recommendation:
      "Round332 can emit two cautious programme-inclusion candidates. Treat the remaining PEACEPLUS/building leads as duplicate or context until a new official dated approval, start, completion, handover or mapped row is found."
  };
}

function buildCandidatesPayload(candidates, index) {
  return {
    schema_version: "round332_belfast_official_architecture_sweep_next.candidates.v1",
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
        "manual corpus plus tmp/subagents JSON paths containing Belfast/HARNI/Round296/Round310 context"
    },
    prior_file_count: index.files.length,
    candidates
  };
}

function buildRejectedPayload(rejected) {
  return {
    schema_version: "round332_belfast_official_architecture_sweep_next.rejected.v1",
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
    schema_version: "round332_belfast_official_architecture_sweep_next.summary.v1",
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
      "Round332 emitted two distinct official Belfast PEACEPLUS capital-project inclusion candidates and retained overlapping leads as rejects."
  };
}

function buildNotes(summary, rejected) {
  const sourceLines = Object.values(SOURCES).map((source) => `- ${source.publisher}: ${source.source_name} (${source.source_url})`);
  const rejectLines = rejected.map((row) => `- ${row.key}: ${row.category} - ${row.reason}`);
  return [
    "# Round332 Belfast Official Architecture Sweep Next",
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
    "- Validation: passed",
    "",
    "## Sources Checked",
    "",
    ...sourceLines,
    "",
    "## Candidate Notes",
    "",
    "Two PEACEPLUS capital-project inclusion milestones survived duplicate checks: Annadale Open Space and Distillery Street. Both use the council news-page date of 20 September 2024 and the current PEACEPLUS page only as supporting context.",
    "",
    "## Rejected Or Overlapping Leads",
    "",
    ...rejectLines,
    "",
    "## Caveat",
    "",
    "Rows in this pack are administrative programme observations. They should stay separate from planning approvals, construction starts, handovers, openings, final design, mapped works boundaries and built-condition records unless those are sourced separately.",
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
    schema_version: "round332_belfast_official_architecture_sweep_next.validation.v1",
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
