#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round434_nyc_public_design_commission_next7");
const ACCESS_DATE = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const TARGET_COUNT = 36;
const ROUND = "round434";
const TASK = "nyc_public_design_commission_next7_candidates";
const SOURCE_ID = "nyc-pdc-meeting-minutes-certificates-2008-2026";
const SOURCE_NAME = "NYC Public Design Commission meeting minutes and certificates";
const PUBLISHER = "New York City Public Design Commission";
const CURRENT_MEETINGS_PAGE = "https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page";
const PAST_MINUTES_PAGE =
  "https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page";
const NYC_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";

const INPUTS = {
  certificateRecords: path.join(
    ROOT,
    "tmp",
    "subagents",
    "round124_nyc_public_design_commission",
    "pdc_certificate_records.json"
  ),
  extractedTextRoot: path.join(ROOT, "tmp", "subagents", "round124_nyc_public_design_commission"),
  manualCorpus: path.join(
    ROOT,
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  ),
  generatedNycAtlas: path.join(ROOT, "web", "data", "city-atlas", "cities", "nyc", "events.json"),
};

const PROJECT_TYPE_RULES = [
  [/library/i, "library"],
  [/detention|juvenile|criminal court|courthouse/i, "justice_or_civic_facility"],
  [/recreation center|community center|nature center/i, "community_or_recreation_center"],
  [/firehouse|engine company|garage|building|roof|pavilion|facility|field house|restroom|comfort station/i, "public_facility_architecture"],
  [/wastewater|sewer|stormwater|bulkhead|flood|resilien|pump|conduit|shoreline|substation|chlorination/i, "water_or_resilience_infrastructure"],
  [/greenway|esplanade|pier|heliport|waterfront|ferry|open space|trailhead|outlook|wharf/i, "waterfront_or_transport_public_realm"],
  [/plaza|streetscape|sidewalk|ramp|staircase|elevator|path|retaining wall|bridge|street|median/i, "streetscape_access_or_plaza"],
  [/park|playground|field|landscape|garden|pickleball|spray shower/i, "park_or_playground"],
];

const INCLUDED_SUBJECT_PATTERN =
  /\b(construction|reconstruction|rehabilitation|restoration|renovation|addition|facade|roof|library|community center|health center|criminal court|detention|juvenile|park|playground|plaza|greenway|esplanade|waterfront|shoreline|bridge|building|facility|public realm|streetscape|street|wastewater|sewer|garage|recreation center|public restroom|retaining wall|staircase|elevator|path|pier|bulkhead|resilien|flood|pavilion|compost|heliport|ferry|trailhead|outlook|classroom|comfort station|field house|boathouse|market|museum|theater|station|sidewalk|ramp|median|stormwater|pump station|yard|wharf)\b/i;
const EXCLUDED_SUBJECT_PATTERN =
  /\b(artwork|artist|mural|mosaic|sculpture|statue|plaque|banner|wayfinding|signage|signs?|security cameras?|camera|antenna|telecommunications|newsstand|bus shelter|rooftop mechanical|mechanical equipment|hvac|louvers?|lighting|light poles?|bollards?|electric vehicle chargers?|ev chargers?|charging equipment|photovoltaic panels|donor pavers|fenced-in planted area|electrical cabinet|electrical equipment|generator|rooftop equipment|garage doors|shopping cart area|sidewalk pavers|facade graphics|sword hilt)\b/i;
const PUBLIC_ART_BYLINE_PATTERN =
  /\b(?:installation|conservation|relocation|reinstallation|replication|short-term loan|long-term installation|modifications to the installation)\s+of\b.*\bby\s+[a-z]/i;
const CONSERVATION_OBJECT_PATTERN = /^the\s+conservation\s+of\b/i;
const OBSERVED_CHANGE_FORBIDDEN_PATTERN =
  /\b(predicts?|forecast|simulat(?:e|ion)|caus(?:e|ed|al)|will increase|will decrease|impact score|opened|occupied|operational|completion|completed|finished)\b/i;

function discoverPriorCandidateFiles() {
  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  const files = [];
  if (fs.existsSync(subagentsDir)) {
    for (const entry of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!/^round\d+_nyc_public_design_commission/i.test(entry.name)) continue;
      const dir = path.join(subagentsDir, entry.name);
      if (path.resolve(dir) === path.resolve(OUT_DIR)) continue;
      const file = path.join(dir, "candidates.json");
      if (fs.existsSync(file)) files.push(file);
    }
  }

  const legacyPdcMore = path.join(subagentsDir, "round126_nyc_pdc_more_design_review", "candidates.json");
  if (fs.existsSync(legacyPdcMore)) files.push(legacyPdcMore);

  return [...new Set(files.map((file) => path.resolve(file)))].sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function displayText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, maxLength = 74) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength)
    .replace(/_+$/g, "");
}

function hashText(value, length = 10) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function rowsFromParsedJson(parsed) {
  if (Array.isArray(parsed)) return parsed;
  return parsed.candidates || parsed.events || parsed.items || parsed.records || parsed.features || [];
}

function arrayFromCandidateFile(filePath) {
  return rowsFromParsedJson(readJson(filePath));
}

function extractCertificateIds(value) {
  const text = JSON.stringify(value || {});
  const out = new Set();
  for (const match of text.matchAll(/\b(?:certificate[- #:]*)?(\d{5})\b/gi)) {
    out.add(match[1]);
  }
  return out;
}

function extractSourceRecordIds(row) {
  const ids = new Set();
  for (const value of [row.source_record_id, row.record_id, row.provenance && row.provenance.source_record_id]) {
    if (value) ids.add(String(value).toLowerCase());
  }
  return ids;
}

function sourceRecordId(record) {
  return `certificate-${record.certificate}`;
}

function sourceUrlRecordKey(sourceUrl, sourceRecordIdValue) {
  return `${String(sourceUrl || "").toLowerCase()}|${String(sourceRecordIdValue || "").toLowerCase()}`;
}

function existingKeysFromRows(rows) {
  const keys = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    sourceUrlRecordIds: new Set(),
    certificates: new Set(),
    titleDates: new Set(),
    normalizedTitles: new Set(),
  };

  for (const row of rows) {
    const eventId = row.event_id || row.candidate_id || row.id;
    if (eventId) keys.eventIds.add(String(eventId));

    for (const sourceRecordIdValue of extractSourceRecordIds(row)) {
      keys.sourceRecordIds.add(sourceRecordIdValue);
      if (row.source_url) keys.sourceUrlRecordIds.add(sourceUrlRecordKey(row.source_url, sourceRecordIdValue));
    }

    const date = row.effective_date || row.date || "";
    const title = row.title || "";
    if (title && date) keys.titleDates.add(`${slugify(title, 140)}|${date}`);
    if (title) keys.normalizedTitles.add(slugify(title, 160));

    for (const cert of extractCertificateIds(row)) keys.certificates.add(cert);
  }

  return keys;
}

function isPdcRow(row) {
  const text = JSON.stringify(row || {}).toLowerCase();
  return text.includes("public design commission") || text.includes("nyc_pdc") || /\bcertificate-\d{5}\b/.test(text);
}

function existingKeysFromPdcRows(corpusPath) {
  const parsed = readJson(corpusPath);
  const rows = rowsFromParsedJson(parsed);
  const pdcRows = rows.filter(isPdcRow);
  return { keys: existingKeysFromRows(pdcRows), corpusCount: rows.length, pdcCorpusCount: pdcRows.length };
}

function existingKeysFromGeneratedAtlas(indexPath) {
  if (!fs.existsSync(indexPath)) {
    return { keys: existingKeysFromRows([]), corpusCount: 0, pdcCorpusCount: 0, chunkRowsRead: 0 };
  }

  const parsed = readJson(indexPath);
  const rows = rowsFromParsedJson(parsed);
  const chunkRows = [];

  if (Array.isArray(parsed.chunks)) {
    for (const chunk of parsed.chunks) {
      if (!chunk || chunk.year < 2008 || chunk.year > 2026 || !chunk.json_path) continue;
      const chunkPath = path.resolve(ROOT, chunk.json_path);
      if (!fs.existsSync(chunkPath)) continue;
      chunkRows.push(...rowsFromParsedJson(readJson(chunkPath)));
    }
  }

  const allRows = rows.concat(chunkRows);
  const pdcRows = allRows.filter(isPdcRow);
  return {
    keys: existingKeysFromRows(pdcRows),
    corpusCount: parsed.event_count || allRows.length,
    pdcCorpusCount: pdcRows.length,
    chunkRowsRead: chunkRows.length,
  };
}

function existingKeysFromPrior(files) {
  const mergedRows = [];
  const counts = {};
  for (const file of files) {
    const rows = arrayFromCandidateFile(file);
    counts[path.relative(ROOT, file).replace(/\\/g, "/")] = rows.length;
    mergedRows.push(...rows);
  }
  return { keys: existingKeysFromRows(mergedRows), counts };
}

function mergeKeySets(...sets) {
  const merged = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    sourceUrlRecordIds: new Set(),
    certificates: new Set(),
    titleDates: new Set(),
    normalizedTitles: new Set(),
  };

  for (const set of sets) {
    for (const key of Object.keys(merged)) {
      for (const value of set[key] || []) merged[key].add(value);
    }
  }

  return merged;
}

function cleanSubject(record) {
  const direct = displayText(record.subject);
  if (direct && !/^RESOLVED That/i.test(direct)) return direct;
  const resolution = displayText(record.resolution);
  const match = resolution.match(/considered (?:designs?|a proposal|a final report|final photographs) for (.*?), submitted by/i);
  return displayText(match ? match[1] : direct || resolution);
}

function stripSubjectPrefix(subject) {
  return displayText(subject)
    .replace(/^the\s+/i, "")
    .replace(/^minor modifications to the\s+/i, "minor modifications to ")
    .replace(/^modifications to the\s+/i, "modifications to ");
}

function extractBorough(text) {
  const cleaned = String(text || "").replace(/Brooklyn-Queens Expressway/gi, "BQE");
  return ["Staten Island", "Manhattan", "Brooklyn", "Queens", "Bronx"].find((borough) =>
    new RegExp(`\\b${borough}\\b`, "i").test(cleaned)
  ) || null;
}

function projectType(subject) {
  const normalized = normalizeText(subject);
  for (const [pattern, type] of PROJECT_TYPE_RULES) {
    if (pattern.test(normalized)) return type;
  }
  return "architecture_or_public_realm_design_review";
}

function eventIdFor(record, subject) {
  const datePart = String(record.effective_date).replace(/-/g, "");
  return `nyc_pdc_${ROUND}_${datePart}_${record.certificate}_${slugify(stripSubjectPrefix(subject), 72)}`;
}

function makeTitle(record, subject) {
  return `PDC ${record.approval_type} for ${stripSubjectPrefix(subject)}`;
}

function duplicateReasons(record, eventId, title, existingKeys) {
  const date = record.effective_date || "";
  const cert = String(record.certificate || "");
  const srid = sourceRecordId(record).toLowerCase();
  const titleDate = `${slugify(title, 140)}|${date}`;
  const normalizedTitle = slugify(title, 160);
  const reasons = [];

  if (existingKeys.certificates.has(cert)) reasons.push("certificate already present in live corpus or prior PDC output");
  if (existingKeys.sourceRecordIds.has(srid)) reasons.push("source_record_id already present");
  if (existingKeys.sourceUrlRecordIds.has(sourceUrlRecordKey(record.source_url, srid))) {
    reasons.push("source_url/source_record_id pair already present");
  }
  if (existingKeys.eventIds.has(eventId)) reasons.push("event_id already present");
  if (existingKeys.titleDates.has(titleDate)) reasons.push("same normalized title/date already present");
  if (existingKeys.normalizedTitles.has(normalizedTitle)) reasons.push("same normalized title already present");

  return reasons;
}

function evaluateRecord(record, existingKeys) {
  const subject = cleanSubject(record);
  const normalizedSubject = normalizeText(subject);
  const normalizedRecordText = `${normalizedSubject} ${normalizeText(record.resolution || "")}`;
  const title = makeTitle(record, subject);
  const eventId = eventIdFor(record, subject);
  const borough = extractBorough(normalizedRecordText);
  const reasons = [];

  if (!record.effective_date || record.effective_date < DATE_MIN || record.effective_date > DATE_MAX) {
    reasons.push("date outside scope");
  }
  if (!String(record.source_url || "").startsWith("https://www.nyc.gov/")) {
    reasons.push("source URL is not nyc.gov");
  }
  if (!INCLUDED_SUBJECT_PATTERN.test(normalizedRecordText)) {
    reasons.push("does not match architecture/public-realm scope");
  }
  if (
    EXCLUDED_SUBJECT_PATTERN.test(normalizedSubject) ||
    PUBLIC_ART_BYLINE_PATTERN.test(normalizedSubject) ||
    CONSERVATION_OBJECT_PATTERN.test(normalizedSubject)
  ) {
    reasons.push("appears to be public-art/equipment/signage-only or non-architecture object review");
  }
  if (!borough) reasons.push("no explicit NYC borough in source text");
  reasons.push(...duplicateReasons(record, eventId, title, existingKeys));

  return {
    record,
    subject,
    title,
    eventId,
    borough,
    reasons,
  };
}

function sortEvaluatedDescending(a, b) {
  const byDate = String(b.record.effective_date || "").localeCompare(String(a.record.effective_date || ""));
  if (byDate) return byDate;
  return Number(b.record.certificate || 0) - Number(a.record.certificate || 0);
}

function selectCandidates(records, existingKeys) {
  const rejected = [];
  const eligible = [];

  for (const record of records) {
    const evaluated = evaluateRecord(record, existingKeys);
    if (evaluated.reasons.length) rejected.push(evaluated);
    else eligible.push(evaluated);
  }

  eligible.sort(sortEvaluatedDescending);
  const selected = eligible.slice(0, TARGET_COUNT);
  const unselectedEligible = eligible.slice(TARGET_COUNT);

  return { selected, rejected, eligible, unselectedEligible };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Bims-5 round434 source auditor (citation metadata only)",
      accept: "text/html,application/pdf;q=0.9,*/*;q=0.8",
    },
  });
  const text = await response.text();
  return {
    url,
    ok: response.ok,
    status: response.status,
    content_type: response.headers.get("content-type") || null,
    byte_length: Buffer.byteLength(text),
    text,
  };
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, {
      method: "HEAD",
      headers: { "user-agent": "Bims-5 round434 source auditor (citation metadata only)" },
    });
    if (!response.ok || response.status === 405) {
      response = await fetch(url, {
        headers: {
          "user-agent": "Bims-5 round434 source auditor (citation metadata only)",
          range: "bytes=0-2047",
        },
      });
    }
    return {
      url,
      ok: response.ok,
      status: response.status,
      content_type: response.headers.get("content-type") || null,
      checked_at: ACCESS_DATE,
    };
  } catch (error) {
    return { url, ok: false, error: error.message, checked_at: ACCESS_DATE };
  }
}

function getPageExcerpt(record) {
  const relTextFile = record.txt_file || "";
  const textPath = path.join(INPUTS.extractedTextRoot, relTextFile);
  const out = {
    source_path: path.relative(ROOT, textPath).replace(/\\/g, "/"),
    found: false,
    page_index: record.page || null,
    excerpt: null,
  };
  if (!relTextFile || !fs.existsSync(textPath)) return out;

  const text = fs.readFileSync(textPath, "utf8");
  const pages = text.split(/\n---PAGE---\n/g);
  const pageText = pages[Math.max(0, Number(record.page || 1) - 1)] || text;
  const certPattern = new RegExp(`CERTIFICATE\\s+${record.certificate}`);
  const match = certPattern.exec(pageText) || certPattern.exec(text);
  const source = match ? match.input : pageText;
  const start = match ? Math.max(0, match.index - 120) : 0;
  const excerpt = displayText(source.slice(start, start + 1100));
  out.found = Boolean(excerpt);
  out.excerpt = excerpt;
  return out;
}

function makeCandidate(evaluated, sourceStatus, pageExcerpt) {
  const { record, subject, title, eventId, borough } = evaluated;
  const indexUrl = Number(record.year) >= 2025 ? CURRENT_MEETINGS_PAGE : PAST_MINUTES_PAGE;
  const indexLabel = Number(record.year) >= 2025 ? "PDC current meetings page" : "PDC past meeting minutes archive";
  const sourceAccess = {
    checked_at: ACCESS_DATE,
    pdf_ok: sourceStatus ? Boolean(sourceStatus.ok) : null,
    pdf_status: sourceStatus ? sourceStatus.status || null : null,
    pdf_content_type: sourceStatus ? sourceStatus.content_type || null : null,
  };

  return {
    schema_version: "bims-event-candidate/v0.1",
    city_id: "nyc",
    id: eventId,
    candidate_id: eventId,
    event_id: eventId,
    title,
    summary: `Official NYC Public Design Commission certificate ${record.certificate} records ${record.approval_type} for ${subject}.`,
    short_description: `Official NYC Public Design Commission certificate ${record.certificate} records ${record.approval_type} for ${subject}.`,
    observed_change: `NYC Public Design Commission recorded ${record.approval_type} for ${subject}.`,
    year: Number(record.year),
    effective_date: record.effective_date,
    date: record.effective_date,
    effective_date_range: null,
    date_precision: "day",
    source_date_field: "PDC certificate adoption date",
    meeting_date: record.effective_date,
    category: "design_review_approval",
    lens: "public_design_commission",
    milestone_type: record.approval_type,
    project_type: projectType(subject),
    approval_body: PUBLISHER,
    certificate: String(record.certificate),
    certificate_number: String(record.certificate),
    source_record_id: sourceRecordId(record),
    meeting_item_id: sourceRecordId(record),
    meeting_material_id: record.txt_file || null,
    source_file: record.txt_file || null,
    source_page: record.page || null,
    source_page_text_found: Boolean(pageExcerpt && pageExcerpt.found),
    source_record_text_excerpt: pageExcerpt ? pageExcerpt.excerpt : null,
    geometry: null,
    geometry_ref: {
      label: subject,
      borough,
      source: "PDC certificate location text",
      geometry_note: "The PDC certificate provides descriptive location text but no authoritative GIS geometry.",
    },
    address_ref: {
      label: subject,
      borough,
      source: "PDC certificate location text",
      geometry_note: "The PDC certificate provides descriptive location text but no authoritative GIS geometry.",
    },
    affected_area: {
      label: subject,
      borough,
    },
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: record.source_url,
    source_type: "official_design_review_certificate_pdf",
    license:
      "Official NYC.gov public record; explicit reuse license not stated in the PDF. Treat as citation evidence subject to NYC.gov terms.",
    license_url: NYC_TERMS_URL,
    terms_note: "NYC.gov terms of use apply; source used as citation evidence, not as an open-data license grant.",
    attribution: `Source: ${PUBLISHER}.`,
    attribution_text: `Source: ${PUBLISHER}.`,
    accessed_at: ACCESS_DATE,
    source_access: sourceAccess,
    confidence: "documented",
    geometry_source: "PDC certificate location text only",
    geometry_precision: "descriptive location text; no coordinates supplied",
    limitations: [
      "This is an administrative PDC design-review approval/certificate record, not evidence of construction start, completion, opening, occupancy, operation, or urban outcome.",
      "PDC certificates provide location text rather than authoritative GIS geometry; this candidate preserves geometry_ref text and does not add third-party coordinates.",
      "Approval conditions and later revisions may alter project scope after this certificate date.",
    ],
    evidence: [
      {
        source_id: SOURCE_ID,
        label: `Certificate ${record.certificate}, adopted ${record.effective_date}`,
        kind: "source_record",
        url: record.source_url,
        record_id: sourceRecordId(record),
        page: record.page || null,
        file_path: pageExcerpt ? pageExcerpt.source_path : null,
      },
      {
        source_id: Number(record.year) >= 2025 ? "nyc-pdc-current-meetings-page" : "nyc-pdc-past-minutes-page",
        label: indexLabel,
        kind: "source_index",
        url: indexUrl,
      },
    ],
    method: "parsed_official_pdc_certificate_pdf_duplicate_screened",
    transformation_method:
      "scripts/fetch_round434_nyc_public_design_commission_next7_candidates.js filtered parsed official PDC certificate records, screened the live manual corpus, generated NYC atlas events, and prior PDC candidate packs through Round426 for duplicate certificate/source/title/date keys, rechecked official NYC.gov URLs, and retained PDC location text as geometry_ref without third-party geocoding.",
    provenance: {
      source_id: SOURCE_ID,
      source_name: SOURCE_NAME,
      publisher: PUBLISHER,
      source_type: "official_design_review_certificate_pdf",
      source_url: record.source_url,
      source_record_id: sourceRecordId(record),
      source_url_record_id: sourceUrlRecordKey(record.source_url, sourceRecordId(record)),
      certificate_number: String(record.certificate),
      meeting_date: record.effective_date,
      meeting_item_id: sourceRecordId(record),
      meeting_material_id: record.txt_file || null,
      source_page: record.page || null,
      accessed_at: ACCESS_DATE,
      license:
        "Official NYC.gov public record; explicit reuse license not stated in the PDF. Treat as citation evidence subject to NYC.gov terms.",
      license_url: NYC_TERMS_URL,
      attribution: `Source: ${PUBLISHER}.`,
      method: "parsed_official_pdc_certificate_pdf_duplicate_screened",
      transformation_method:
        "Candidate generated from the parsed PDC certificate record artifact created from official NYC.gov PDC meeting-minutes/certificates PDFs; public-art/equipment-only records and prior duplicate certificate/source/title/date keys were excluded.",
      source_excerpt_sha1: pageExcerpt && pageExcerpt.excerpt ? hashText(pageExcerpt.excerpt, 16) : null,
    },
  };
}

function mixBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function dateRange(rows) {
  const dates = rows.map((row) => row.effective_date || row.date).filter(Boolean).sort();
  return { start: dates[0] || null, end: dates[dates.length - 1] || null };
}

function auditRecordPool(records, selected, rejected, unselectedEligible) {
  const counts = {
    total_certificate_records: records.length,
    selected_for_round434: selected.length,
    unselected_eligible_after_target: unselectedEligible.length,
    rejected_total: rejected.length,
    in_date_scope: 0,
    outside_date_scope: 0,
    duplicate_certificate_or_source_record: 0,
    duplicate_source_url_record_id: 0,
    duplicate_title_or_title_date: 0,
    not_architecture_or_public_realm: 0,
    public_art_equipment_or_signage_only: 0,
    missing_nyc_location_text: 0,
  };

  for (const record of records) {
    if (record.effective_date && record.effective_date >= DATE_MIN && record.effective_date <= DATE_MAX) counts.in_date_scope += 1;
    else counts.outside_date_scope += 1;
  }

  for (const item of rejected) {
    const text = item.reasons.join("; ");
    if (/certificate already|source_record_id already/.test(text)) counts.duplicate_certificate_or_source_record += 1;
    if (/source_url\/source_record_id/.test(text)) counts.duplicate_source_url_record_id += 1;
    if (/title/.test(text)) counts.duplicate_title_or_title_date += 1;
    if (/does not match architecture/.test(text)) counts.not_architecture_or_public_realm += 1;
    if (/public-art|equipment|signage/.test(text)) counts.public_art_equipment_or_signage_only += 1;
    if (/no explicit NYC borough/.test(text)) counts.missing_nyc_location_text += 1;
  }

  return counts;
}

function validateCandidates(candidates, existingKeys) {
  const errors = [];
  const warnings = [];
  const seenEventIds = new Set();
  const seenSourceRecordIds = new Set();
  const seenSourceUrlRecordIds = new Set();
  const seenTitleDates = new Set();
  const requiredFields = [
    "city_id",
    "candidate_id",
    "event_id",
    "title",
    "summary",
    "date",
    "effective_date",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "attribution",
    "accessed_at",
    "method",
    "transformation_method",
    "confidence",
  ];

  if (candidates.length < TARGET_COUNT) {
    warnings.push(`selected ${candidates.length}; target was ${TARGET_COUNT}`);
  }

  for (const candidate of candidates) {
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.event_id || "unknown"} missing ${field}`);
      }
    }

    if (!Array.isArray(candidate.limitations) || candidate.limitations.length === 0) {
      errors.push(`${candidate.event_id} missing limitations`);
    }
    if (!candidate.geometry_ref || !candidate.geometry_ref.label) {
      errors.push(`${candidate.event_id} missing geometry_ref location text`);
    }
    if (candidate.effective_date < DATE_MIN || candidate.effective_date > DATE_MAX) {
      errors.push(`${candidate.event_id} effective_date outside scope`);
    }
    if (!String(candidate.source_url || "").startsWith("https://www.nyc.gov/")) {
      errors.push(`${candidate.event_id} source_url is not an official nyc.gov URL`);
    }
    if (candidate.confidence !== "documented") {
      errors.push(`${candidate.event_id} confidence must be documented`);
    }

    const titleDate = `${slugify(candidate.title, 140)}|${candidate.effective_date}`;
    const pair = sourceUrlRecordKey(candidate.source_url, candidate.source_record_id);
    if (seenEventIds.has(candidate.event_id)) errors.push(`${candidate.event_id} duplicate event_id in output`);
    if (seenSourceRecordIds.has(String(candidate.source_record_id).toLowerCase())) {
      errors.push(`${candidate.event_id} duplicate source_record_id in output`);
    }
    if (seenSourceUrlRecordIds.has(pair)) errors.push(`${candidate.event_id} duplicate source_url/source_record_id in output`);
    if (seenTitleDates.has(titleDate)) errors.push(`${candidate.event_id} duplicate title/date in output`);
    seenEventIds.add(candidate.event_id);
    seenSourceRecordIds.add(String(candidate.source_record_id).toLowerCase());
    seenSourceUrlRecordIds.add(pair);
    seenTitleDates.add(titleDate);

    if (existingKeys.sourceRecordIds.has(String(candidate.source_record_id).toLowerCase())) {
      errors.push(`${candidate.event_id} source_record_id already present before Round434`);
    }
    if (existingKeys.sourceUrlRecordIds.has(pair)) {
      errors.push(`${candidate.event_id} source_url/source_record_id already present before Round434`);
    }
    if (existingKeys.titleDates.has(titleDate)) {
      errors.push(`${candidate.event_id} title/date already present before Round434`);
    }

    const claimText = [candidate.title, candidate.summary, candidate.short_description, candidate.observed_change].join(" ");
    if (OBSERVED_CHANGE_FORBIDDEN_PATTERN.test(claimText)) {
      errors.push(`${candidate.event_id} contains overclaiming wording in candidate-authored fields`);
    }
  }

  return {
    ok: errors.length === 0,
    error_count: errors.length,
    warning_count: warnings.length,
    errors,
    warnings,
  };
}

function makeValidationReport(validation, summary, sourcePages) {
  const checks = [
    {
      name: "required_candidate_fields",
      ok: validation.errors.every((error) => !/missing /.test(error)),
      detail: "Required provenance, source, date, confidence, and transformation fields are present.",
    },
    {
      name: "date_scope",
      ok: validation.errors.every((error) => !/effective_date outside/.test(error)),
      detail: `${DATE_MIN} through ${DATE_MAX}`,
    },
    {
      name: "official_pdc_urls",
      ok: validation.errors.every((error) => !/not an official nyc\.gov URL/.test(error)),
      detail: "Selected source URLs are nyc.gov PDC PDF links.",
    },
    {
      name: "duplicate_screening",
      ok: validation.errors.every((error) => !/duplicate|already present/.test(error)),
      detail: "Certificate/source/title/date keys are unique in this pack after live and prior-pack screening.",
    },
    {
      name: "overclaim_guard",
      ok: validation.errors.every((error) => !/overclaiming/.test(error)),
      detail: "Candidate-authored fields avoid prediction, causation, opening, operation, completion, and outcome claims.",
    },
    {
      name: "source_page_checks",
      ok: Object.values(sourcePages).every((page) => page && page.ok),
      detail: "Official index/terms pages were fetched for citation metadata.",
    },
  ];

  return {
    schema_version: "bims-validation-report/v0.1",
    round: ROUND,
    task: TASK,
    generated_at: ACCESS_DATE,
    status: validation.ok ? "PASS" : "FAIL",
    candidate_count: summary.candidate_count,
    date_range: summary.date_range,
    certificate_numbers: summary.certificate_numbers,
    checks,
    errors: validation.errors,
    warnings: validation.warnings,
    caveats: [
      "Administrative PDC design-review records only; no construction, opening, completion, operation, impact, or causation claim is made.",
      "PDC certificates provide location text rather than official GIS geometry; this pack preserves geometry_ref and does not add coordinates.",
      "Explicit PDF reuse license was not found; NYC.gov terms are carried as the applicable terms reference.",
    ],
  };
}

function makeReadback() {
  const jsonFiles = [
    "candidates.json",
    "source_audit.json",
    "summary.json",
    "rejected.json",
    "validation.json",
    "validation_report.json",
  ];
  const files = {};
  const errors = [];
  for (const name of jsonFiles) {
    const filePath = path.join(OUT_DIR, name);
    try {
      const parsed = readJson(filePath);
      files[name] = {
        parse_ok: true,
        byte_length: fs.statSync(filePath).size,
        top_level_keys: Object.keys(parsed).slice(0, 20),
      };
    } catch (error) {
      files[name] = { parse_ok: false, error: error.message };
      errors.push(`${name}: ${error.message}`);
    }
  }

  const candidates = readJson(path.join(OUT_DIR, "candidates.json"));
  const summary = readJson(path.join(OUT_DIR, "summary.json"));
  const validation = readJson(path.join(OUT_DIR, "validation.json"));
  const candidateRows = candidates.candidates || [];
  if (candidateRows.length !== summary.candidate_count) errors.push("candidate count mismatch between candidates.json and summary.json");
  if (candidateRows.length !== candidates.count) errors.push("candidate count mismatch inside candidates.json");
  if (!validation.ok) errors.push("validation.json is not ok");

  return {
    schema_version: "bims-json-readback/v0.1",
    generated_at: ACCESS_DATE,
    ok: errors.length === 0,
    error_count: errors.length,
    errors,
    files,
    candidate_count: candidateRows.length,
    date_range: summary.date_range,
    source_record_ids: candidateRows.map((candidate) => candidate.source_record_id),
    certificate_numbers: candidateRows.map((candidate) => candidate.certificate_number),
    validation_ok: validation.ok,
  };
}

function sampledRejected(rejected, limit = 80) {
  return rejected.slice(0, limit).map((item) => ({
    certificate_number: String(item.record.certificate || ""),
    effective_date: item.record.effective_date || null,
    source_url: item.record.source_url || null,
    subject: item.subject.slice(0, 260),
    reasons: item.reasons,
  }));
}

function sampledEligible(unselectedEligible, limit = 30) {
  return unselectedEligible.slice(0, limit).map((item) => ({
    certificate_number: String(item.record.certificate || ""),
    effective_date: item.record.effective_date || null,
    source_url: item.record.source_url || null,
    subject: item.subject.slice(0, 260),
    reason_not_selected: `eligible but beyond target count ${TARGET_COUNT}`,
  }));
}

function writeNotes({ candidates, rejected, summary, validation }) {
  const range = dateRange(candidates);
  const lines = [
    "# Round434 NYC Public Design Commission next7 candidates",
    "",
    `Created/accessed: ${ACCESS_DATE}`,
    "",
    "## Scope",
    "",
    "Official NYC Public Design Commission design-review certificate records only. These are administrative public-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.",
    "",
    "## Outputs",
    "",
    `- candidates.json: ${candidates.length} candidate events.`,
    "- source_audit.json: source, terms, coverage, and geometry-ref caveat audit.",
    "- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.",
    "- rejected.json: sampled screening rejections and eligible records left after the target batch.",
    "- validation.json and validation_report.json: machine-readable validation results.",
    "- readback.json: post-write JSON parse/readback validation.",
    "",
    "## Result",
    "",
    `- Date range: ${range.start || "n/a"} through ${range.end || "n/a"}.`,
    `- Candidate count: ${candidates.length}.`,
    `- Certificate IDs: ${candidates.map((candidate) => candidate.certificate_number).join(", ") || "none"}.`,
    `- Milestone mix: ${Object.entries(mixBy(candidates, "milestone_type"))
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ") || "none"}.`,
    `- Validation: ${validation.ok ? "passed" : "failed"} with ${validation.error_count} errors and ${validation.warning_count} warnings.`,
    `- Sampled rejections: ${rejected.sampled_screening_rejections.length}.`,
    "",
    "## Method",
    "",
    "1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.",
    "2. Screened certificate IDs, source record IDs, source_url/source_record_id pairs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round426.",
    "3. Filtered to architecture, public facility, park/playground, waterfront, infrastructure, access, and public-realm review records; excluded public-art, equipment-only, signage-only, and object-conservation records.",
    "4. Selected the next deterministic batch by newest certificate adoption date, then certificate number, after duplicate screening.",
    "5. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.",
    "6. Preserved PDC certificate location text as geometry_ref and did not add third-party geocoded coordinates.",
    "",
    "## Caveats",
    "",
    "- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.",
    "- PDC certificates provide descriptive location text rather than authoritative GIS geometry; candidates carry geometry_ref text only.",
    "- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.",
    "- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April 20, 2026 and earlier official PDF records.",
    "",
    "## Source URLs",
    "",
    `- Current meetings page: ${CURRENT_MEETINGS_PAGE}`,
    `- Past minutes archive: ${PAST_MINUTES_PAGE}`,
    `- NYC.gov terms: ${NYC_TERMS_URL}`,
  ];

  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${lines.join("\n")}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const records = readJson(INPUTS.certificateRecords);
  const priorCandidateFiles = discoverPriorCandidateFiles();
  const { keys: manualKeys, corpusCount, pdcCorpusCount } = existingKeysFromPdcRows(INPUTS.manualCorpus);
  const {
    keys: generatedKeys,
    corpusCount: generatedAtlasCount,
    pdcCorpusCount: generatedPdcCount,
    chunkRowsRead: generatedChunkRowsRead,
  } = existingKeysFromGeneratedAtlas(INPUTS.generatedNycAtlas);
  const { keys: priorKeys, counts: priorCandidateCounts } = existingKeysFromPrior(priorCandidateFiles);
  const existingKeys = mergeKeySets(manualKeys, generatedKeys, priorKeys);

  const selection = selectCandidates(records, existingKeys);
  const sourcePages = {};
  for (const [name, url] of [
    ["current_meetings_page", CURRENT_MEETINGS_PAGE],
    ["past_minutes_page", PAST_MINUTES_PAGE],
    ["nyc_terms", NYC_TERMS_URL],
  ]) {
    try {
      const result = await fetchText(url);
      sourcePages[name] = {
        url,
        ok: result.ok,
        status: result.status,
        content_type: result.content_type,
        byte_length: result.byte_length,
        checked_at: ACCESS_DATE,
      };
      if (name === "current_meetings_page") {
        sourcePages[name].mentions_may_18_2026 = /May\s+18|5\/18\/26/i.test(result.text);
        sourcePages[name].may_18_2026_minutes_link_present =
          /href=["'][^"']*(?:5-18-26|05-18-26)[^"']*(?:minutes|certificates)[^"']*\.pdf["']/i.test(result.text);
      }
    } catch (error) {
      sourcePages[name] = { url, ok: false, error: error.message, checked_at: ACCESS_DATE };
    }
  }

  const selectedUrls = [...new Set(selection.selected.map((item) => item.record.source_url).filter(Boolean))].sort();
  const sourceStatusByUrl = new Map();
  for (const url of selectedUrls) {
    sourceStatusByUrl.set(url, await checkUrl(url));
  }

  const candidates = selection.selected
    .map((item) => makeCandidate(item, sourceStatusByUrl.get(item.record.source_url) || null, getPageExcerpt(item.record)))
    .sort((a, b) => {
      const byDate = a.effective_date.localeCompare(b.effective_date);
      if (byDate) return byDate;
      return Number(a.certificate_number) - Number(b.certificate_number);
    });

  const validation = validateCandidates(candidates, existingKeys);
  validation.generated_at = ACCESS_DATE;
  validation.script = path.relative(ROOT, __filename).replace(/\\/g, "/");
  validation.input_files = {
    certificate_records: path.relative(ROOT, INPUTS.certificateRecords).replace(/\\/g, "/"),
    manual_corpus: path.relative(ROOT, INPUTS.manualCorpus).replace(/\\/g, "/"),
    generated_nyc_atlas: path.relative(ROOT, INPUTS.generatedNycAtlas).replace(/\\/g, "/"),
    prior_candidate_files: priorCandidateFiles.map((file) => path.relative(ROOT, file).replace(/\\/g, "/")),
  };

  const range = dateRange(candidates);
  const sourceUrlsUsed = [...new Set(candidates.map((candidate) => candidate.source_url))].sort();
  const recordPoolAuditCounts = auditRecordPool(records, selection.selected, selection.rejected, selection.unselectedEligible);
  const summary = {
    schema_version: "bims-round-summary/v0.1",
    round: ROUND,
    task: TASK,
    generated_at: ACCESS_DATE,
    date_scope: { start: DATE_MIN, end: DATE_MAX },
    target_candidate_count: TARGET_COUNT,
    candidate_count: candidates.length,
    selection_strategy:
      "Newest eligible official PDC certificate records after duplicate screening, sorted by certificate adoption date then certificate number; public-art/equipment/signage-only records excluded.",
    date_range: range,
    certificate_numbers: candidates.map((candidate) => candidate.certificate_number),
    source_record_ids: candidates.map((candidate) => candidate.source_record_id),
    source_ids: [SOURCE_ID],
    source_type_mix: mixBy(candidates, "source_type"),
    milestone_mix: mixBy(candidates, "milestone_type"),
    project_type_mix: mixBy(candidates, "project_type"),
    source_url_count: sourceUrlsUsed.length,
    source_urls_used: sourceUrlsUsed,
    manual_corpus_count: corpusCount,
    manual_pdc_corpus_count: pdcCorpusCount,
    generated_nyc_atlas_count: generatedAtlasCount,
    generated_nyc_pdc_count: generatedPdcCount,
    generated_nyc_chunk_rows_read: generatedChunkRowsRead,
    prior_candidate_counts: priorCandidateCounts,
    eligible_after_screening_count: selection.eligible.length,
    selected_rejection_count: 0,
    record_pool_audit_counts: recordPoolAuditCounts,
    validation_ok: validation.ok,
    validation_error_count: validation.error_count,
    validation_warning_count: validation.warning_count,
    source_page_status: sourcePages,
  };

  const rejected = {
    schema_version: "bims-rejected-records/v0.1",
    generated_at: ACCESS_DATE,
    selected_rejections: [],
    screening_summary: recordPoolAuditCounts,
    sampled_screening_rejections: sampledRejected(selection.rejected),
    unselected_eligible_sample: sampledEligible(selection.unselectedEligible),
    note:
      "Round434 is selected automatically from the official parsed PDC certificate pool after duplicate and scope screening. Sampled screening rejections are representative; unselected_eligible_sample lists records that passed filters but were beyond the target next batch.",
  };

  const sourceAudit = {
    schema_version: "bims-source-audit/v0.1",
    city_id: "nyc",
    created_at: ACCESS_DATE,
    accessed_at: ACCESS_DATE,
    auditor: "Codex worker Round434",
    task_scope:
      "Continue NYC Public Design Commission official design-review source ingestion after Round426/PDC next6; select fresh non-duplicate architecture/public-realm certificate records through the 2026-05-20 access date.",
    official_source_only: true,
    sources: [
      {
        source_id: "nyc-pdc-current-meetings-page",
        source_name: "Public Design Commission meetings page",
        publisher: PUBLISHER,
        url: CURRENT_MEETINGS_PAGE,
        source_type: "official_index_page",
        license:
          "No explicit data license found on the page or PDFs during this pass; treat as official NYC.gov public records subject to NYC.gov terms.",
        license_url: NYC_TERMS_URL,
        terms_note: "NYC.gov terms of use apply.",
        coverage_years: { start: 2025, end: 2026 },
        update_frequency:
          "Meeting-driven; agendas are posted before meetings and minutes/certificates are generally posted after meetings.",
        geographic_scope:
          "New York City public projects reviewed by the Public Design Commission, with occasional city-owned/city-agency projects outside the five boroughs.",
        granularity: "Meeting PDF and certificate-level design-review action.",
        key_fields: [
          "meeting/adoption date",
          "certificate number",
          "approval type",
          "project/location text",
          "submitting agency",
          "conditions or understandings",
        ],
        reliability: "strong",
        source_confidence: "documented",
        required_caveats: [
          "PDC records document design review actions, not construction, completion, opening, operation, or urban outcome claims.",
          "PDC PDFs generally provide location descriptions rather than machine-readable geometry.",
          "The May 18, 2026 row was present but did not expose a linked minutes/certificates PDF at access time.",
        ],
        ingestion_recommendation:
          "Use for administrative design-review milestones. Pair with separate official construction/opening sources only if emitting built-outcome events.",
        access_status: sourcePages.current_meetings_page,
      },
      {
        source_id: "nyc-pdc-past-minutes-page",
        source_name: "Public Design Commission past meeting minutes archive",
        publisher: PUBLISHER,
        url: PAST_MINUTES_PAGE,
        source_type: "official_archive_page",
        license:
          "No explicit data license found on archived PDFs during this pass; treat as official NYC.gov public records subject to NYC.gov terms.",
        license_url: NYC_TERMS_URL,
        terms_note: "NYC.gov terms of use apply.",
        coverage_years: { start: 2008, end: 2024 },
        update_frequency: "Archived/static with occasional file revisions.",
        geographic_scope: "NYC civic buildings, parks, public realm, waterfronts, infrastructure, and public art subject to PDC review.",
        granularity: "Meeting PDF and certificate-level design-review action.",
        key_fields: [
          "meeting/adoption date",
          "certificate number",
          "approval type",
          "project/location text",
          "agency submitter",
          "conditions",
        ],
        reliability: "strong",
        source_confidence: "documented",
        required_caveats: [
          "Older archive PDFs use former Art Commission/PDC naming and may have OCR extraction defects.",
          "Approval dates are certificate adoption dates and must not be relabelled as physical change dates.",
        ],
        ingestion_recommendation:
          "Use for documented design-review approval events with explicit provenance and geometry_ref caveats.",
        access_status: sourcePages.past_minutes_page,
      },
      {
        source_id: SOURCE_ID,
        source_name: SOURCE_NAME,
        publisher: PUBLISHER,
        url: PAST_MINUTES_PAGE,
        source_type: "official_design_review_certificate_pdf_collection",
        license:
          "No explicit data license found in selected PDFs during this pass; treat as official NYC.gov public records subject to NYC.gov terms.",
        license_url: NYC_TERMS_URL,
        coverage_years: { start: 2008, end: 2026 },
        geographic_scope: "New York City projects reviewed by PDC.",
        granularity: "Certificate-level administrative review action.",
        reliability: "strong",
        source_confidence: "documented",
        required_caveats: [
          "Certificate text is administrative review evidence only.",
          "Selected candidates use PDC location descriptions as geometry_ref, not coordinates.",
          "Public-art and equipment-only records were excluded for this architecture/public-realm batch.",
        ],
        ingestion_recommendation: "Use with provenance fields and overclaim caveats.",
      },
    ],
    selected_pdf_status: [...sourceStatusByUrl.values()],
  };

  const candidateEnvelope = {
    schema_version: "bims-pdc-candidates/v0.1",
    generated_at: ACCESS_DATE,
    source_id: SOURCE_ID,
    count: candidates.length,
    candidates,
  };

  const validationReport = makeValidationReport(validation, summary, sourcePages);

  writeJson(path.join(OUT_DIR, "candidates.json"), candidateEnvelope);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejected);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);
  writeNotes({ candidates, rejected, summary, validation });
  writeJson(path.join(OUT_DIR, "readback.json"), makeReadback());

  if (!validation.ok) {
    console.error(`Validation failed with ${validation.error_count} errors.`);
    process.exitCode = 1;
  }

  console.log(
    JSON.stringify(
      {
        output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        candidate_count: candidates.length,
        date_range: range,
        certificates: candidates.map((candidate) => candidate.certificate_number),
        validation_ok: validation.ok,
        validation_errors: validation.error_count,
        validation_warnings: validation.warning_count,
        source_url_count: sourceUrlsUsed.length,
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
