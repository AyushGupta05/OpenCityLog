#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round426_nyc_public_design_commission_next6");
const ACCESS_DATE = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const ROUND = "round426";
const TASK = "nyc_public_design_commission_next6_candidates";
const SOURCE_ID = "nyc-pdc-meeting-minutes-certificates-2008-2026";
const SOURCE_NAME = "NYC Public Design Commission meeting minutes and certificates";
const PUBLISHER = "New York City Public Design Commission";
const CURRENT_MEETINGS_PAGE = "https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page";
const PAST_MINUTES_PAGE = "https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page";
const NYC_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";

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

const INPUTS = {
  certificateRecords: path.join(
    ROOT,
    "tmp",
    "subagents",
    "round124_nyc_public_design_commission",
    "pdc_certificate_records.json"
  ),
  extractedTextRoot: path.join(ROOT, "tmp", "subagents", "round124_nyc_public_design_commission"),
  priorCandidateFiles: discoverPriorCandidateFiles(),
  manualCorpus: path.join(
    ROOT,
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  ),
  generatedNycAtlas: path.join(ROOT, "web", "data", "city-atlas", "cities", "nyc", "events.json"),
};

const SELECTED_CERTIFICATES = [
  "30173",
  "30123",
  "30118",
  "30115",
  "30114",
  "30113",
  "30110",
  "30108",
  "30106",
  "30104",
  "30103",
  "30102",
  "30100",
  "30099",
  "30097",
  "30096",
  "30095",
  "30094",
  "30093",
  "30092",
  "30091",
  "30090",
  "30089",
  "30083",
  "30082",
  "30078",
  "30077",
  "30072",
  "30070",
  "30068",
  "30065",
  "30064",
  "30063",
  "30062",
  "30061",
  "30059",
];

const PROJECT_TYPE_RULES = [
  [/library/i, "library"],
  [/detention|juvenile|criminal court|courthouse/i, "justice_or_civic_facility"],
  [/recreation center|community center/i, "community_or_recreation_center"],
  [/firehouse|engine company|garage|building|roof|pavilion|facility|field house|restroom|comfort station/i, "public_facility_architecture"],
  [/wastewater|sewer|stormwater|bulkhead|flood|resilien|pump|conduit|shoreline|canal/i, "water_or_resilience_infrastructure"],
  [/greenway|esplanade|pier|heliport|waterfront|ferry|open space|trailhead|outlook/i, "waterfront_or_transport_public_realm"],
  [/plaza|streetscape|sidewalk|ramp|staircase|elevator|path|retaining wall|bridge|street/i, "streetscape_access_or_plaza"],
  [/park|playground|field|skate|landscape|garden/i, "park_or_playground"],
];

const INCLUDED_SUBJECT_PATTERN =
  /\b(construction|reconstruction|rehabilitation|restoration|renovation|addition|facade|roof|library|community center|health center|criminal court|detention|juvenile|park|playground|plaza|greenway|esplanade|waterfront|shoreline|bridge|building|facility|public realm|streetscape|street|wastewater|sewer|garage|recreation center|public restroom|retaining wall|staircase|elevator|path|pier|bulkhead|resiliency|flood|pavilion|compost|heliport|ferry|trailhead|outlook|classroom)\b/i;
const EXCLUDED_SUBJECT_PATTERN =
  /\b(artwork|artist|mural|sculpture|statue|plaque|banner|wayfinding|signage|signs?|security cameras?|camera|antenna|telecommunications|newsstand|bus shelter|rooftop mechanical|mechanical equipment|hvac|louver|lighting|light poles?|bollards?|electric vehicle charger|ev charger)\b/i;
const OBSERVED_CHANGE_FORBIDDEN_PATTERN =
  /\b(predicts?|forecast|simulat(?:e|ion)|caus(?:e|ed|al)|will increase|will decrease|impact score|opened|occupied|operational|completion|completed|finished)\b/i;

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
  const parsed = readJson(filePath);
  return rowsFromParsedJson(parsed);
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

function existingKeysFromRows(rows) {
  const keys = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set(),
    certificates: new Set(),
    normalizedTitles: new Set(),
    sourceUrls: new Set(),
  };

  for (const row of rows) {
    const eventId = row.event_id || row.candidate_id || row.id;
    if (eventId) keys.eventIds.add(String(eventId));
    for (const sourceRecordId of extractSourceRecordIds(row)) keys.sourceRecordIds.add(sourceRecordId);
    if (row.source_url) keys.sourceUrls.add(String(row.source_url));
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
  const parsed = readJson(indexPath);
  const rows = rowsFromParsedJson(parsed);
  const chunkRows = [];
  if (Array.isArray(parsed.chunks)) {
    for (const chunk of parsed.chunks) {
      if (!chunk || chunk.year < 2008 || chunk.year > 2026 || !chunk.json_path) continue;
      const chunkPath = path.resolve(ROOT, chunk.json_path);
      if (!fs.existsSync(chunkPath)) continue;
      const chunkParsed = readJson(chunkPath);
      chunkRows.push(...rowsFromParsedJson(chunkParsed));
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
    titleDates: new Set(),
    certificates: new Set(),
    normalizedTitles: new Set(),
    sourceUrls: new Set(),
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
  for (const [pattern, type] of PROJECT_TYPE_RULES) {
    if (pattern.test(normalizeText(subject))) return type;
  }
  return "architecture_or_public_realm_design_review";
}

function sourceRecordId(record) {
  return `certificate-${record.certificate}`;
}

function eventIdFor(record, subject) {
  const datePart = String(record.effective_date).replace(/-/g, "");
  return `nyc_pdc_round426_${datePart}_${record.certificate}_${slugify(stripSubjectPrefix(subject), 72)}`;
}

function makeTitle(record, subject) {
  return `PDC ${record.approval_type} for ${stripSubjectPrefix(subject)}`;
}

function isDuplicate(record, eventId, title, existingKeys) {
  const date = record.effective_date || "";
  const cert = String(record.certificate || "");
  const srid = sourceRecordId(record).toLowerCase();
  const titleDate = `${slugify(title, 140)}|${date}`;
  const normalizedTitle = slugify(title, 160);
  const reasons = [];

  if (existingKeys.certificates.has(cert)) reasons.push("certificate already present in live corpus or prior PDC output");
  if (existingKeys.sourceRecordIds.has(srid)) reasons.push("source_record_id already present");
  if (existingKeys.eventIds.has(eventId)) reasons.push("event_id already present");
  if (existingKeys.titleDates.has(titleDate)) reasons.push("same normalized title/date already present");
  if (existingKeys.normalizedTitles.has(normalizedTitle)) reasons.push("same normalized title already present");

  return reasons;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Bims-5 round426 source auditor (citation metadata only)",
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
      headers: { "user-agent": "Bims-5 round426 source auditor (citation metadata only)" },
    });
    if (!response.ok || response.status === 405) {
      response = await fetch(url, {
        headers: {
          "user-agent": "Bims-5 round426 source auditor (citation metadata only)",
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

function makeCandidate(record, subject, sourceStatus, pageExcerpt) {
  const title = makeTitle(record, subject);
  const eventId = eventIdFor(record, subject);
  const borough = extractBorough(`${subject} ${record.resolution || ""}`);
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
      "scripts/fetch_round426_nyc_public_design_commission_next6_candidates.js filtered parsed official PDC certificate records, screened the live manual corpus, generated NYC atlas events, and prior PDC candidate packs through Round420 for duplicates, rechecked official NYC.gov URLs, and retained PDC location text as geometry_ref without third-party geocoding.",
    provenance: {
      source_id: SOURCE_ID,
      source_name: SOURCE_NAME,
      publisher: PUBLISHER,
      source_type: "official_design_review_certificate_pdf",
      source_url: record.source_url,
      source_record_id: sourceRecordId(record),
      certificate_number: String(record.certificate),
      meeting_date: record.effective_date,
      meeting_item_id: sourceRecordId(record),
      meeting_material_id: record.txt_file || null,
      source_page: record.page || null,
      source_path: pageExcerpt ? pageExcerpt.source_path : null,
      source_page_text_found: Boolean(pageExcerpt && pageExcerpt.found),
      source_artifact_note:
        "Source row read from Round124 parsed PDC certificate artifact created from official NYC.gov PDFs with PDF text extraction; official NYC.gov PDF URL was rechecked for Round426.",
      source_date_field: "PDC certificate adoption date",
      source_pdf_status: sourceStatus || null,
      accessed_at: ACCESS_DATE,
      license: "NYC.gov public record; explicit reuse license not stated in PDF.",
      license_url: NYC_TERMS_URL,
      attribution_text: `Source: ${PUBLISHER}.`,
      transformation_script: "scripts/fetch_round426_nyc_public_design_commission_next6_candidates.js",
      geometry_ref: {
        label: subject,
        borough,
        source: "PDC certificate location text",
      },
      geometry_source: "PDC certificate location text only",
      geometry_precision: "descriptive location text; no coordinates supplied",
      geometry_method: "official_pdc_location_text_no_geocoding",
      confidence: "documented",
      limitation_summary: "Design-review approval/certificate record only; no construction completion or project outcome is claimed.",
      source_fingerprint: hashText(`${record.source_url}|${record.certificate}|${record.effective_date}|${record.resolution}`),
    },
  };
}

function validateCandidates(candidates) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sourceRecordIds = new Set();
  const certs = new Set();
  const requiredFields = [
    "city_id",
    "id",
    "candidate_id",
    "event_id",
    "title",
    "effective_date",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_record_id",
    "license",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method",
  ];

  for (const [index, candidate] of candidates.entries()) {
    const prefix = `${candidate.certificate_number || `candidate[${index}]`}`;
    for (const field of requiredFields) {
      if (!candidate[field]) errors.push(`${prefix}: missing ${field}`);
    }
    if (candidate.city_id !== "nyc") errors.push(`${prefix}: city_id must be nyc`);
    if (candidate.accessed_at !== ACCESS_DATE) errors.push(`${prefix}: accessed_at must be ${ACCESS_DATE}`);
    if (!candidate.effective_date || candidate.effective_date < DATE_MIN || candidate.effective_date > DATE_MAX) {
      errors.push(`${prefix}: effective_date outside ${DATE_MIN} to ${DATE_MAX}`);
    }
    if (!String(candidate.source_url || "").startsWith("https://www.nyc.gov/")) {
      errors.push(`${prefix}: source_url is not an official nyc.gov URL`);
    }
    if (candidate.geometry) {
      if (candidate.geometry.type !== "Point") errors.push(`${prefix}: geometry must be a Point when present`);
      const [lon, lat] = candidate.geometry.coordinates || [];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) errors.push(`${prefix}: invalid coordinates`);
      if (lon < -74.3 || lon > -73.65 || lat < 40.45 || lat > 40.95) {
        errors.push(`${prefix}: coordinates outside broad NYC envelope`);
      }
    } else if (!candidate.geometry_ref || !candidate.geometry_ref.label) {
      errors.push(`${prefix}: missing geometry_ref when geometry is absent`);
    }
    if (!["documented", "corroborated", "inferred", "disputed"].includes(candidate.confidence)) {
      errors.push(`${prefix}: invalid confidence ${candidate.confidence}`);
    }
    if (!Array.isArray(candidate.limitations) || candidate.limitations.length < 2) {
      errors.push(`${prefix}: limitations must include source/geometry caveats`);
    }
    if (!Array.isArray(candidate.evidence) || !candidate.evidence.some((item) => item.record_id === candidate.source_record_id)) {
      errors.push(`${prefix}: evidence must include matching source_record_id`);
    }
    if (OBSERVED_CHANGE_FORBIDDEN_PATTERN.test(candidate.observed_change || "")) {
      errors.push(`${prefix}: observed_change contains overclaiming language`);
    }
    if (!candidate.source_page_text_found) warnings.push(`${prefix}: source page text excerpt was not found`);
    if (candidate.source_access && candidate.source_access.pdf_ok === false) {
      warnings.push(`${prefix}: source PDF check did not return ok`);
    }
    if (ids.has(candidate.event_id)) errors.push(`${prefix}: duplicate event_id`);
    ids.add(candidate.event_id);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${prefix}: duplicate source_record_id`);
    sourceRecordIds.add(candidate.source_record_id);
    if (certs.has(candidate.certificate_number)) errors.push(`${prefix}: duplicate certificate_number`);
    certs.add(candidate.certificate_number);
  }

  if (candidates.length !== SELECTED_CERTIFICATES.length) {
    errors.push(`candidate count ${candidates.length} does not match selected certificate count ${SELECTED_CERTIFICATES.length}`);
  }

  return {
    ok: errors.length === 0,
    error_count: errors.length,
    warning_count: warnings.length,
    errors,
    warnings,
  };
}

function dateRange(candidates) {
  if (!candidates.length) return { start: null, end: null };
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

function mixBy(candidates, key) {
  const out = {};
  for (const candidate of candidates) out[candidate[key]] = (out[candidate[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

function auditRecordPool(records, existingKeys) {
  const counts = {
    total_certificate_records: records.length,
    in_date_scope: 0,
    outside_date_scope: 0,
    duplicate_certificate_or_source_record: 0,
    not_architecture_or_public_realm: 0,
    art_equipment_or_signage_only: 0,
    missing_nyc_location_text: 0,
    available_after_basic_filters: 0,
    not_selected_for_round426: 0,
  };
  const sampleRejected = [];
  const selectedSet = new Set(SELECTED_CERTIFICATES);

  for (const record of records) {
    const subject = cleanSubject(record);
    const text = `${normalizeText(subject)} ${normalizeText(record.resolution || "")}`;
    const cert = String(record.certificate || "");
    const reasons = [];
    if (!record.effective_date || record.effective_date < DATE_MIN || record.effective_date > DATE_MAX) {
      counts.outside_date_scope += 1;
      reasons.push("outside date scope");
    } else {
      counts.in_date_scope += 1;
    }
    if (existingKeys.certificates.has(cert) || existingKeys.sourceRecordIds.has(sourceRecordId(record).toLowerCase())) {
      counts.duplicate_certificate_or_source_record += 1;
      reasons.push("duplicate certificate/source_record_id");
    }
    if (!INCLUDED_SUBJECT_PATTERN.test(text)) {
      counts.not_architecture_or_public_realm += 1;
      reasons.push("not architecture/public realm review language");
    }
    if (EXCLUDED_SUBJECT_PATTERN.test(subject)) {
      counts.art_equipment_or_signage_only += 1;
      reasons.push("art/signage/equipment-only pattern");
    }
    if (!extractBorough(text)) {
      counts.missing_nyc_location_text += 1;
      reasons.push("missing explicit NYC borough text");
    }
    if (reasons.length === 0) {
      counts.available_after_basic_filters += 1;
      if (!selectedSet.has(cert)) {
        counts.not_selected_for_round426 += 1;
        reasons.push("available but not selected for clean round426 pack");
      }
    }
    if (reasons.length && sampleRejected.length < 90) {
      sampleRejected.push({
        certificate_number: cert,
        effective_date: record.effective_date || null,
        subject: subject.slice(0, 260),
        reasons,
      });
    }
  }

  return { counts, sampleRejected };
}

function writeNotes({ candidates, rejected, summary, validation }) {
  const range = dateRange(candidates);
  const lines = [
    "# Round426 NYC Public Design Commission next6 candidates",
    "",
    `Created/accessed: ${ACCESS_DATE}`,
    "",
    "## Scope",
    "",
    "Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.",
    "",
    "## Outputs",
    "",
    `- candidates.json: ${candidates.length} candidate events.`,
    "- source_audit.json: source, terms, coverage, and geometry-ref caveat audit.",
    "- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.",
    "- rejected.json: selected-record rejections plus pool screening counts and sampled rejects.",
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
    `- Selected rejections: ${rejected.selected_rejections.length}.`,
    "",
    "## Method",
    "",
    "1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.",
    "2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round420.",
    "3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.",
    "4. Selected a fresh next6 set of public-realm, park/playground, waterfront, civic building, plaza, bridge, and facility design-review actions.",
    "5. Preserved PDC certificate location text as geometry_ref and did not add third-party geocoded coordinates.",
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
      ok: validation.errors.every((error) => !/duplicate/.test(error)),
      detail: "Certificate/source/event keys are unique in this pack after live and prior-pack screening.",
    },
    {
      name: "overclaim_guard",
      ok: validation.errors.every((error) => !/overclaiming/.test(error)),
      detail: "Observed-change statements avoid prediction, causation, opening, operation, completion, and outcome claims.",
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
  if (candidateRows.length !== summary.candidate_count) {
    errors.push("candidate count mismatch between candidates.json and summary.json");
  }
  if (candidateRows.length !== candidates.count) {
    errors.push("candidate count mismatch inside candidates.json");
  }
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const records = readJson(INPUTS.certificateRecords);
  const { keys: manualKeys, corpusCount, pdcCorpusCount } = existingKeysFromPdcRows(INPUTS.manualCorpus);
  const {
    keys: generatedKeys,
    corpusCount: generatedAtlasCount,
    pdcCorpusCount: generatedPdcCount,
    chunkRowsRead: generatedChunkRowsRead,
  } = existingKeysFromGeneratedAtlas(INPUTS.generatedNycAtlas);
  const { keys: priorKeys, counts: priorCandidateCounts } = existingKeysFromPrior(INPUTS.priorCandidateFiles);
  const existingKeys = mergeKeySets(manualKeys, generatedKeys, priorKeys);
  const recordByCert = new Map(records.map((record) => [String(record.certificate), record]));
  const recordPoolAudit = auditRecordPool(records, existingKeys);

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

  const selectedUrls = new Set();
  for (const cert of SELECTED_CERTIFICATES) {
    const record = recordByCert.get(cert);
    if (record && record.source_url) selectedUrls.add(record.source_url);
  }
  const sourceStatusByUrl = new Map();
  for (const url of [...selectedUrls].sort()) {
    sourceStatusByUrl.set(url, await checkUrl(url));
  }

  const candidates = [];
  const selectedRejections = [];

  for (const cert of SELECTED_CERTIFICATES) {
    const record = recordByCert.get(cert);
    if (!record) {
      selectedRejections.push({ certificate_number: cert, reasons: ["certificate not found in parsed record artifact"] });
      continue;
    }

    const subject = cleanSubject(record);
    const text = `${normalizeText(subject)} ${normalizeText(record.resolution || "")}`;
    const title = makeTitle(record, subject);
    const eventId = eventIdFor(record, subject);
    const borough = extractBorough(text);
    const reasons = [];

    if (!record.effective_date || record.effective_date < DATE_MIN || record.effective_date > DATE_MAX) {
      reasons.push("date outside scope");
    }
    if (!String(record.source_url || "").startsWith("https://www.nyc.gov/")) reasons.push("source URL is not nyc.gov");
    if (!INCLUDED_SUBJECT_PATTERN.test(text)) reasons.push("does not match architecture/public-realm scope");
    if (EXCLUDED_SUBJECT_PATTERN.test(subject)) reasons.push("appears to be art/equipment/signage-only");
    if (!borough) reasons.push("no explicit NYC borough in source text");
    reasons.push(...isDuplicate(record, eventId, title, existingKeys));

    if (reasons.length) {
      selectedRejections.push({
        certificate_number: cert,
        effective_date: record.effective_date || null,
        source_url: record.source_url || null,
        subject,
        reasons,
      });
      continue;
    }

    candidates.push(
      makeCandidate(record, subject, sourceStatusByUrl.get(record.source_url) || null, getPageExcerpt(record))
    );
  }

  candidates.sort((a, b) => {
    const byDate = a.effective_date.localeCompare(b.effective_date);
    if (byDate) return byDate;
    return Number(a.certificate_number) - Number(b.certificate_number);
  });

  const validation = validateCandidates(candidates);
  validation.generated_at = ACCESS_DATE;
  validation.script = path.relative(ROOT, __filename).replace(/\\/g, "/");
  validation.input_files = {
    certificate_records: path.relative(ROOT, INPUTS.certificateRecords).replace(/\\/g, "/"),
    manual_corpus: path.relative(ROOT, INPUTS.manualCorpus).replace(/\\/g, "/"),
    generated_nyc_atlas: path.relative(ROOT, INPUTS.generatedNycAtlas).replace(/\\/g, "/"),
    prior_candidate_files: INPUTS.priorCandidateFiles.map((file) => path.relative(ROOT, file).replace(/\\/g, "/")),
  };

  const range = dateRange(candidates);
  const sourceUrlsUsed = [...new Set(candidates.map((candidate) => candidate.source_url))].sort();
  const summary = {
    schema_version: "bims-round-summary/v0.1",
    round: ROUND,
    task: TASK,
    generated_at: ACCESS_DATE,
    date_scope: { start: DATE_MIN, end: DATE_MAX },
    candidate_count: candidates.length,
    date_range: range,
    certificate_numbers: candidates.map((candidate) => candidate.certificate_number),
    source_record_ids: candidates.map((candidate) => candidate.source_record_id),
    source_ids: [SOURCE_ID],
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
    selected_certificate_count: SELECTED_CERTIFICATES.length,
    selected_rejection_count: selectedRejections.length,
    record_pool_audit_counts: recordPoolAudit.counts,
    validation_ok: validation.ok,
    validation_error_count: validation.error_count,
    validation_warning_count: validation.warning_count,
    source_page_status: sourcePages,
  };

  const rejected = {
    schema_version: "bims-rejected-records/v0.1",
    generated_at: ACCESS_DATE,
    selected_rejections: selectedRejections,
    screening_summary: recordPoolAudit.counts,
    sampled_screening_rejections: recordPoolAudit.sampleRejected,
    note:
      "The full PDC certificate pool is much larger than this clean next6 pack; sampled screening rejections are representative, while selected_rejections lists every selected record dropped from Round426.",
  };

  const sourceAudit = {
    schema_version: "bims-source-audit/v0.1",
    city_id: "nyc",
    created_at: ACCESS_DATE,
    accessed_at: ACCESS_DATE,
    auditor: "Codex worker Round426",
    task_scope:
      "Continue NYC Public Design Commission official design-review source ingestion after accepted/candidate rounds through Round420; select fresh non-duplicate design-review/certificate/minutes records through the 2026-05-20 access date.",
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
        selected_rejections: selectedRejections.length,
        validation_ok: validation.ok,
        validation_errors: validation.error_count,
        validation_warnings: validation.warning_count,
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
