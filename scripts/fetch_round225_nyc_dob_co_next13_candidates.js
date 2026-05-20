const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = ACCESSED_AT;
const LEGACY_PREFERRED_END_DATE = "2021-03-31";
const TARGET_COUNT = 200;
const OUT_DIR = "tmp/subagents/round225_nyc_dob_co_next13";
const CORPUS_PATH = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";

const TERMS_URL = "https://opendata.cityofnewyork.us/overview/#termsofuse";
const NYC_GOV_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";

const DATASETS = {
  dobNowCo: {
    key: "dob_now",
    id: "pkdm-hqz6",
    sourceId: "nyc-dob-now-certificate-of-occupancy-pkdm-hqz6",
    canonicalSourceId: "nyc-dob-certificate-of-occupancy",
    name: "NYC Open Data: DOB NOW: Certificate of Occupancy",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Certificate-of-Occupancy/pkdm-hqz6",
    api: "https://data.cityofnewyork.us/resource/pkdm-hqz6.json",
    metadata: "https://data.cityofnewyork.us/api/views/pkdm-hqz6"
  },
  legacyCo: {
    key: "legacy",
    id: "bs8b-p36w",
    sourceId: "nyc-dob-certificate-of-occupancy-bs8b-p36w",
    canonicalSourceId: "nyc-dob-certificate-of-occupancy",
    name: "NYC Open Data: DOB Certificate Of Occupancy",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w",
    api: "https://data.cityofnewyork.us/resource/bs8b-p36w.json",
    metadata: "https://data.cityofnewyork.us/api/views/bs8b-p36w"
  }
};

const DOB_NOW_SELECT = [
  "job_filing_name",
  "job_type",
  "bin",
  "borough",
  "house_no",
  "street_name",
  "block",
  "lot",
  "zip_code",
  "submitted_date",
  "c_of_o_status",
  "c_of_o_sequence",
  "c_of_o_filing_type",
  "community_board",
  "c_of_o_issuance_date",
  "application_number",
  "number_of_dwelling_units",
  "c_of_o_number",
  "latitude",
  "longitude",
  "citycouncildistrict",
  "bbl",
  "censustract2010",
  "ntaname"
];

const LEGACY_SELECT = [
  "job_number",
  "job_type",
  "c_o_issue_date",
  "bin_number",
  "borough",
  "house_number",
  "street_name",
  "block",
  "lot",
  "postcode",
  "pr_dwelling_unit",
  "ex_dwelling_unit",
  "application_status_raw",
  "filing_status_raw",
  "item_number",
  "issue_type",
  "latitude",
  "longitude",
  "community_board",
  "council_district",
  "census_tract",
  "bin",
  "bbl",
  "nta"
];

const PRIOR_DOB_ROUND_PATTERN = /round(117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219).*nyc.*(dob|co)|nyc.*(dob|co).*round(117|119|133|136|143|149|152|155|160|164|169|175|181|187|193|199|205|211|219)/i;
const PUBLIC_CIVIC_PATTERN = /\b(SCHOOL|HOSPITAL|LIBRARY|MUSEUM|UNIVERSITY|COLLEGE|CUNY|NYCHA|AUTHORITY|DEPARTMENT|CIVIC|COURT|POLICE|FIRE|PARK|HEALTH|TRANSIT|MTA|CULTURAL)\b/i;

const EXPLICIT_DUPLICATE_CANDIDATE_FILES = [
  "tmp/subagents/round117_nyc_dob_co_high_signal/candidates.json",
  "tmp/subagents/round117_nyc_dob_filings_permits/candidates.json",
  "tmp/subagents/round117_nyc_local_dob_bulk/candidates.json",
  "tmp/subagents/round119_nyc_dob_legacy_bulk/candidates.json",
  "tmp/subagents/round133_nyc_official_architecture/candidates.json",
  "tmp/subagents/round136_nyc_dob_now_more/candidates.json",
  "tmp/subagents/round143_nyc_dob_now_even_more/candidates.json",
  "tmp/subagents/round149_nyc_dob_now_next/candidates.json",
  "tmp/subagents/round152_nyc_dob_now_next2/candidates.json",
  "tmp/subagents/round155_nyc_dob_co_next/candidates.json",
  "tmp/subagents/round160_nyc_dob_co_next2/candidates.json",
  "tmp/subagents/round164_nyc_dob_co_next3/candidates.json",
  "tmp/subagents/round169_nyc_dob_co_next4/candidates.json",
  "tmp/subagents/round175_nyc_dob_co_next5/candidates.json",
  "tmp/subagents/round181_nyc_dob_co_next6/candidates.json",
  "tmp/subagents/round187_nyc_dob_co_next7/candidates.json",
  "tmp/subagents/round193_nyc_dob_co_next8/candidates.json",
  "tmp/subagents/round199_nyc_dob_co_next9/candidates.json",
  "tmp/subagents/round205_nyc_dob_co_next10/candidates.json",
  "tmp/subagents/round211_nyc_dob_co_next11/candidates.json",
  "tmp/subagents/round219_nyc_dob_co_next12/candidates.json"
];

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, maxLength = 120) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/_+$/g, "") || "record";
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+|$)/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function inDateWindow(date) {
  return date >= START_DATE && date <= END_DATE;
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function titleCaseBorough(value) {
  const text = cleanText(value).toLowerCase();
  const map = {
    manhattan: "Manhattan",
    bronx: "Bronx",
    brooklyn: "Brooklyn",
    queens: "Queens",
    "staten island": "Staten Island"
  };
  return map[text] || cleanText(value);
}

function cleanAddress(parts) {
  return parts
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function normalizeAddress(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function socrataUrl(datasetId, params = {}) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function rowUrl(datasetId, rowId) {
  if (!rowId) return socrataUrl(datasetId);
  return `https://data.cityofnewyork.us/resource/${datasetId}/${encodeURIComponent(rowId).replace(/%7E/gi, "~")}.json`;
}

async function fetchJson(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      const waitMs = attempt * attempt * 700;
      console.warn(`${label}: attempt ${attempt} failed (${error.message}); retrying in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function fetchAllRows(datasetId, params, label, pageSize = 50000) {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = socrataUrl(datasetId, { ...params, $limit: pageSize, $offset: offset });
    const batch = await fetchJson(url, `${label} offset ${offset}`);
    if (!Array.isArray(batch)) throw new Error(`${label} returned a non-array payload`);
    rows.push(...batch);
    console.log(`${label}: fetched ${rows.length}`);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function candidateArray(doc) {
  if (!doc) return [];
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function candidateFilesToScreen(root) {
  if (!fs.existsSync(root)) return [];
  const files = new Set(
    EXPLICIT_DUPLICATE_CANDIDATE_FILES
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => fs.existsSync(file))
  );
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.name === "candidates.json" && (PRIOR_DOB_ROUND_PATTERN.test(normalized) || /round(160|164|169|175|181|187|193|199|205|211|219)_nyc_dob_co_next(2|3|4|5|6|7|8|9|10|11|12)/i.test(normalized))) {
        files.add(normalized);
      }
    }
  }
  return [...files].sort();
}

function addToken(tokens, value) {
  const text = cleanText(value).toLowerCase();
  if (text.length >= 4) tokens.add(text);
}

function addIdentifierRegexTokens(tokens, value) {
  const text = cleanText(value);
  if (!text) return;
  for (const match of text.matchAll(/\bCO-\d{5,}\b/gi)) addToken(tokens, match[0]);
  for (const match of text.matchAll(/\b[12345]\d{8}\b/g)) addToken(tokens, match[0]);
  for (const match of text.matchAll(/\b[A-Z]\d{8}(?:-[A-Z0-9]+)?\b/gi)) {
    addToken(tokens, match[0]);
    addToken(tokens, dobNowBaseNumber(match[0]));
  }
  for (const match of text.matchAll(/\b\d{7,12}\b/g)) addToken(tokens, match[0]);
}

function collectExistingTokensFromObject(tokens, addressDateKeys, sourceDateKeys, value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectExistingTokensFromObject(tokens, addressDateKeys, sourceDateKeys, item);
    return;
  }

  for (const key of [
    "source_record_id",
    "source_url",
    "candidate_id",
    "event_id",
    "id",
    "job_filing_number",
    "base_job_filing_number",
    "application_source_record_id",
    "application_number",
    "c_of_o_number",
    "job_number",
    "work_permit",
    "tracking_number"
  ]) {
    addToken(tokens, value[key]);
    addToken(tokens, dobNowBaseNumber(value[key]));
    addIdentifierRegexTokens(tokens, value[key]);
  }

  const textBlob = [
    value.title,
    value.summary,
    value.observed_change,
    value.area,
    value.address,
    value.source_record_id,
    value.source_url
  ].map(cleanText).join(" ");
  addIdentifierRegexTokens(tokens, textBlob);

  const address = normalizeAddress(value.address || value.area || "");
  const date = parseDate(value.date || value.effective_date || "");
  if (address && date) addressDateKeys.add(`${address}|${date}`);

  const sourceRecord = cleanText(
    value.source_record_id ||
    value.application_number ||
    value.c_of_o_number ||
    value.job_number ||
    value.job_filing_name ||
    ""
  );
  const sourceDataset = cleanText(value.source_dataset_id || value.source_id || "*");
  if (sourceRecord && date) {
    sourceDateKeys.add(`${sourceDataset}|${sourceRecord}|${date}`.toLowerCase());
    sourceDateKeys.add(`*|${sourceRecord}|${date}`.toLowerCase());
  }

  for (const key of ["source_row_ref", "source_fields", "raw_row", "row_fields", "group_key"]) {
    collectExistingTokensFromObject(tokens, addressDateKeys, sourceDateKeys, value[key]);
  }
}

function buildExistingIndex() {
  const tokens = new Set();
  const addressDateKeys = new Set();
  const sourceDateKeys = new Set();
  const files = [];
  let manualEventCount = 0;

  const corpus = readJsonIfExists(CORPUS_PATH);
  if (corpus) {
    const rows = candidateArray(corpus);
    manualEventCount = rows.length;
    collectExistingTokensFromObject(tokens, addressDateKeys, sourceDateKeys, rows);
    files.push(CORPUS_PATH);
  }

  for (const file of candidateFilesToScreen("tmp/subagents")) {
    try {
      const doc = readJsonIfExists(file);
      collectExistingTokensFromObject(tokens, addressDateKeys, sourceDateKeys, candidateArray(doc));
      files.push(file.replace(/\\/g, "/"));
    } catch (error) {
      console.warn(`Skipping duplicate-index file ${file}: ${error.message}`);
    }
  }

  return { tokens, addressDateKeys, sourceDateKeys, files, manualEventCount };
}

function tokenExists(existing, value) {
  const text = cleanText(value).toLowerCase();
  return text.length >= 4 && existing.tokens.has(text);
}

function anyTokenExists(existing, values) {
  return values.some((value) => tokenExists(existing, value) || tokenExists(existing, dobNowBaseNumber(value)));
}

function dobNowBaseNumber(value) {
  const text = cleanText(value).toUpperCase();
  const match = text.match(/^([A-Z]\d{8})/);
  return match ? match[1] : text;
}

function compactFields(row, fields) {
  const output = {};
  for (const field of fields) {
    const value = row[field];
    if (value !== undefined && value !== null && cleanText(value) !== "") output[field] = value;
  }
  if (row[":id"]) output.socrata_row_id = row[":id"];
  return output;
}

function reject(rejections, row, dataset, reason, extra = {}) {
  rejections.push({
    reason,
    source_dataset_id: dataset.id,
    source_id: dataset.sourceId,
    source_record_id: extra.source_record_id || cleanText(row.application_number || row.job_number || row.job_filing_name || row.c_of_o_number),
    date: extra.date || parseDate(row.c_of_o_issuance_date || row.c_o_issue_date || row.submitted_date),
    address: extra.address || "",
    note: extra.note || ""
  });
}

function rejectionCounter(rejections) {
  const counts = {};
  for (const item of rejections) counts[item.reason] = (counts[item.reason] || 0) + 1;
  return counts;
}

function dobNowAddress(row) {
  return cleanAddress([row.house_no, row.street_name]);
}

function legacyAddress(row) {
  return cleanAddress([row.house_number, row.street_name]);
}

function dobNowGroupKey(row) {
  return [
    DATASETS.dobNowCo.id,
    dobNowBaseNumber(row.job_filing_name),
    cleanText(row.bin),
    normalizeAddress(`${dobNowAddress(row)} ${row.borough}`)
  ].join("|");
}

function legacyGroupKey(row) {
  return [
    DATASETS.legacyCo.id,
    cleanText(row.job_number),
    cleanText(row.bin_number || row.bin),
    normalizeAddress(`${legacyAddress(row)} ${row.borough}`)
  ].join("|");
}

function coTypeRank(value) {
  const text = cleanText(value).toLowerCase();
  if (text === "final") return 5;
  if (text === "initial") return 4;
  if (text === "temporary") return 3;
  if (text.includes("renewal with change")) return 1;
  return 0;
}

function jobTypeRank(value) {
  const text = cleanText(value).toUpperCase();
  if (text === "NEW BUILDING" || text === "NB") return 5;
  if (text.includes("ALT-CO") || text.includes("ALTERATION CO") || text === "A1") return 4;
  return 0;
}

function civicSignalFor(row, address, borough) {
  const haystack = [
    address,
    borough,
    row.street_name,
    row.ntaname,
    row.nta,
    row.job_type,
    row.filing_status_raw
  ].map(cleanText).join(" ");
  return PUBLIC_CIVIC_PATTERN.test(haystack);
}

function sourceRecordKey(candidate) {
  return `${candidate.source_dataset_id}|${candidate.source_record_id}`;
}

function sourceDateKey(candidate) {
  return `${candidate.source_dataset_id || "*"}|${candidate.source_record_id}|${candidate.date || candidate.effective_date}`.toLowerCase();
}

function sourceDateWildcardKey(candidate) {
  return `*|${candidate.source_record_id}|${candidate.date || candidate.effective_date}`.toLowerCase();
}

function scoreDobNow(row) {
  const units = parseNumber(row.number_of_dwelling_units);
  const filingType = cleanText(row.c_of_o_filing_type);
  const jobType = cleanText(row.job_type);
  const address = dobNowAddress(row);
  const civicLike = civicSignalFor(row, address, row.borough);
  let score = 0;
  score += Math.min(units * 4, 900);
  score += coTypeRank(filingType) * 140;
  score += jobTypeRank(jobType) * 65;
  if (units >= 100) score += 250;
  else if (units >= 50) score += 160;
  else if (units >= 25) score += 80;
  if (civicLike) score += 120;
  if (/renewal/i.test(filingType)) score -= 320;
  return score;
}

function scoreLegacy(row) {
  const units = Math.max(parseNumber(row.pr_dwelling_unit), parseNumber(row.ex_dwelling_unit));
  const issueType = cleanText(row.issue_type);
  const jobType = cleanText(row.job_type);
  const address = legacyAddress(row);
  const civicLike = civicSignalFor(row, address, row.borough);
  let score = 0;
  score += Math.min(units * 4, 900);
  score += coTypeRank(issueType) * 150;
  score += jobTypeRank(jobType) * 65;
  if (units >= 100) score += 250;
  else if (units >= 50) score += 160;
  else if (units >= 25) score += 80;
  if (civicLike) score += 120;
  return score;
}

function isHighSignalDobNow(row) {
  const units = parseNumber(row.number_of_dwelling_units);
  const filingType = cleanText(row.c_of_o_filing_type);
  const jobType = cleanText(row.job_type).toUpperCase();
  const address = dobNowAddress(row);
  const civicLike = civicSignalFor(row, address, row.borough);
  const targetJobType = jobType === "NEW BUILDING" || jobType.includes("ALTERATION CO") || jobType.includes("ALT-CO");
  const targetCoType = filingType === "Final" || filingType === "Initial";
  return targetCoType && targetJobType && (units >= 25 || civicLike);
}

function isHighSignalLegacy(row) {
  const units = Math.max(parseNumber(row.pr_dwelling_unit), parseNumber(row.ex_dwelling_unit));
  const issueType = cleanText(row.issue_type);
  const jobType = cleanText(row.job_type).toUpperCase();
  const address = legacyAddress(row);
  const civicLike = civicSignalFor(row, address, row.borough);
  const targetJobType = jobType === "NB" || jobType === "A1";
  const targetCoType = issueType === "Final" || issueType === "Temporary";
  return targetCoType && targetJobType && (units >= 25 || civicLike);
}

function chooseBestByGroup(rows, groupKeyFn, scoreFn) {
  const best = new Map();
  for (const row of rows) {
    const key = groupKeyFn(row);
    const current = best.get(key);
    const score = scoreFn(row);
    const date = parseDate(row.c_of_o_issuance_date || row.c_o_issue_date);
    if (!current || score > current.score || (score === current.score && date > current.date)) {
      best.set(key, { row, score, date });
    }
  }
  return [...best.values()].map((item) => ({ ...item.row, __selection_score: item.score }));
}

function duplicateReasonDobNow(row, existing) {
  const address = dobNowAddress(row);
  const date = parseDate(row.c_of_o_issuance_date);
  const addressDateKey = `${normalizeAddress(`${address} ${row.borough}`)}|${date}`;
  const values = [
    row.application_number,
    row.c_of_o_number,
    row.job_filing_name,
    dobNowBaseNumber(row.job_filing_name),
    row[":id"],
    rowUrl(DATASETS.dobNowCo.id, row[":id"]),
    socrataUrl(DATASETS.dobNowCo.id, { application_number: row.application_number })
  ];
  if (anyTokenExists(existing, values)) return "existing_dob_now_co_or_job_identifier";
  if (existing.addressDateKeys.has(addressDateKey)) return "existing_same_address_and_date";
  return "";
}

function duplicateReasonLegacy(row, existing) {
  const address = legacyAddress(row);
  const date = parseDate(row.c_o_issue_date);
  const addressDateKey = `${normalizeAddress(`${address} ${row.borough}`)}|${date}`;
  const values = [
    row.job_number,
    row.bin_number,
    row.bin,
    row[":id"],
    rowUrl(DATASETS.legacyCo.id, row[":id"]),
    socrataUrl(DATASETS.legacyCo.id, { job_number: row.job_number })
  ];
  if (anyTokenExists(existing, values)) return "existing_legacy_co_or_job_identifier";
  if (existing.addressDateKeys.has(addressDateKey)) return "existing_same_address_and_date";
  return "";
}

function scaleLabel(scale) {
  const parts = [];
  if (scale.dwelling_units) parts.push(`${Math.round(scale.dwelling_units).toLocaleString("en-US")} dwelling units`);
  if (scale.existing_dwelling_units) parts.push(`${Math.round(scale.existing_dwelling_units).toLocaleString("en-US")} existing dwelling units`);
  if (scale.civic_or_public_address_signal) parts.push("possible civic/public address text signal");
  return parts.length ? parts.join("; ") : "source CO row does not expose large scale fields";
}

function sharedCandidateFields(dataset, row, details) {
  const limitations = [
    "This certificate-of-occupancy row is a legal and administrative DOB record.",
    "It is not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal effect.",
    "Source dwelling-unit, job-type, CO-type, address, BIN, BBL, and status fields can be corrected or superseded by later DOB records.",
    "Coordinates are NYC Open Data/DOB geocoded address points and not surveyed parcels, unit boundaries, building footprints, entrances, or work limits."
  ].join(" ");

  return {
    city: "nyc",
    city_id: "nyc",
    candidate_id: details.candidateId,
    event_id: details.candidateId,
    date: details.date,
    effective_date: details.date,
    issuance_date: details.date,
    date_precision: "day",
    effective_date_precision: "day",
    bucket: "planning/development/architecture/certificate_of_occupancy",
    title: details.title,
    summary: details.summary,
    observed_change: details.observedChange,
    area: details.area,
    address: details.address,
    borough: details.borough,
    latitude: details.lat,
    longitude: details.lon,
    geocoded_point: {
      latitude: details.lat,
      longitude: details.lon,
      source: "DOB/Open Data latitude and longitude fields"
    },
    geometry: {
      type: "Point",
      coordinates: [details.lon, details.lat]
    },
    source_id: dataset.sourceId,
    source_ids: [dataset.canonicalSourceId, dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: details.sourceUrl,
    source_page_url: dataset.page,
    source_api_url: dataset.api,
    source_record_id: details.sourceRecordId,
    source_type: "official NYC Open Data Socrata API certificate-of-occupancy row",
    source_dataset_id: dataset.id,
    canonical_source_id: dataset.canonicalSourceId,
    source_date_field: details.sourceDateField,
    source_date_raw: details.sourceDateRaw,
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use; Socrata metadata checked during this run did not expose a dataset-specific license field.",
    license_url: TERMS_URL,
    license_or_terms_note: "Factual DOB row metadata and source URLs are retained with DOB/NYC Open Data attribution. Check NYC Open Data and NYC.gov terms before bulk redistribution beyond candidate metadata.",
    terms_urls: [TERMS_URL, NYC_GOV_TERMS_URL],
    attribution: "NYC Department of Buildings (DOB), via NYC Open Data",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    project_type: details.projectType,
    geometry_source: `${dataset.name} latitude and longitude fields.`,
    geometry_precision: "DOB/Open Data geocoded address-level point; not a surveyed building footprint, parcel polygon, unit boundary, entrance, or work-area polygon",
    limitations,
    transformation_method: details.transformationMethod,
    duplicate_check_note: "Screened exact CO application numbers, CO numbers, DOB job numbers, DOB NOW job filing/base numbers, Socrata row IDs, source URLs, source_record_id text, candidate/event IDs, and same-address/same-date keys against the live manual architecture corpus and prior DOB/CO tmp candidate packs including rounds 117, 119, 133, 136, 143, 149, 152, 155, 160, 164, 169, 175, 181, 187, 193, 199, 205, 211, and 219.",
    duplicate_screen: {
      duplicate_identifier_found: false,
      screened_manual_corpus_and_prior_rounds: true,
      screened_rounds: ["117", "119", "133", "136", "143", "149", "152", "155", "160", "164", "169", "175", "181", "187", "193", "199", "205", "211", "219"]
    }
  };
}

function candidateFromDobNow(row) {
  const dataset = DATASETS.dobNowCo;
  const date = parseDate(row.c_of_o_issuance_date);
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const address = dobNowAddress(row);
  const borough = titleCaseBorough(row.borough);
  const units = parseNumber(row.number_of_dwelling_units);
  const filingType = cleanText(row.c_of_o_filing_type);
  const jobType = cleanText(row.job_type);
  const sourceUrl = rowUrl(dataset.id, row[":id"]);
  const sourceRecordId = [
    cleanText(row.application_number),
    `Socrata row ${cleanText(row[":id"])}`,
    `job filing ${cleanText(row.job_filing_name)}`,
    cleanText(row.c_of_o_number) ? `CO number ${cleanText(row.c_of_o_number)}` : ""
  ].filter(Boolean).join(" / ");
  const scale = {
    dwelling_units: units,
    civic_or_public_address_signal: civicSignalFor(row, address, borough)
  };
  const scaleText = scaleLabel(scale);
  const candidateId = `nyc_dob_co_round225_dob_now_${slugify(row.application_number || row.c_of_o_number || row.job_filing_name, 72)}_${date.replace(/-/g, "_")}`;
  const title = `DOB NOW ${filingType.toLowerCase()} certificate of occupancy issued for ${address}`;
  const summary = [
    `${dataset.publisher} records ${cleanText(row.c_of_o_status)} for CO application ${cleanText(row.application_number)} at ${address}, ${borough} with c_of_o_issuance_date ${cleanText(row.c_of_o_issuance_date)}.`,
    `The CO row lists job_type '${jobType}', c_of_o_filing_type '${filingType}', job filing ${cleanText(row.job_filing_name)}, CO number ${cleanText(row.c_of_o_number) || "not supplied"}, and scale fields: ${scaleText}.`
  ].join(" ");
  const observedChange = `DOB recorded a ${filingType.toLowerCase()} certificate-of-occupancy administrative issuance for ${jobType} filing ${cleanText(row.job_filing_name)} at ${address}.`;

  return {
    ...sharedCandidateFields(dataset, row, {
      candidateId,
      date,
      title,
      summary,
      observedChange,
      address,
      borough,
      area: `${address}, ${borough}, NY ${cleanText(row.zip_code)}`,
      lat,
      lon,
      sourceUrl,
      sourceRecordId,
      sourceDateField: "c_of_o_issuance_date",
      sourceDateRaw: cleanText(row.c_of_o_issuance_date),
      projectType: `DOB NOW ${jobType} ${filingType} certificate of occupancy`,
      transformationMethod: `Round225 queried official DOB NOW Certificate of Occupancy rows (${dataset.id}) with CO Issued status, parsed c_of_o_issuance_date locally for ${START_DATE} through ${END_DATE}, rejected renewal-only/noisy rows, grouped repeated rows by DOB NOW base job, BIN, and address, retained nonduplicate high-signal final/initial rows with at least 25 dwelling units or a source-row civic/public text signal, and preserved row-level provenance.`
    }),
    application_number: cleanText(row.application_number),
    c_of_o_number: cleanText(row.c_of_o_number),
    c_of_o_status: cleanText(row.c_of_o_status),
    c_of_o_filing_type: filingType,
    c_of_o_sequence: cleanText(row.c_of_o_sequence),
    job_filing_name: cleanText(row.job_filing_name),
    base_job_filing_number: dobNowBaseNumber(row.job_filing_name),
    job_type: jobType,
    bin: cleanText(row.bin),
    bbl: cleanText(row.bbl),
    block: cleanText(row.block),
    lot: cleanText(row.lot),
    zip_code: cleanText(row.zip_code),
    community_board: cleanText(row.community_board),
    council_district: cleanText(row.citycouncildistrict),
    census_tract: cleanText(row.censustract2010),
    nta: cleanText(row.ntaname),
    scale_fields: scale,
    source_row_ref: {
      dataset_id: dataset.id,
      source_id: dataset.sourceId,
      socrata_row_id: cleanText(row[":id"]),
      application_number: cleanText(row.application_number),
      c_of_o_number: cleanText(row.c_of_o_number),
      job_filing_name: cleanText(row.job_filing_name),
      c_of_o_issuance_date: date,
      accessed_at: ACCESSED_AT
    },
    source_fields: compactFields(row, DOB_NOW_SELECT),
    _score: row.__selection_score || scoreDobNow(row)
  };
}

function candidateFromLegacy(row) {
  const dataset = DATASETS.legacyCo;
  const date = parseDate(row.c_o_issue_date);
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const address = legacyAddress(row);
  const borough = titleCaseBorough(row.borough);
  const proposedUnits = parseNumber(row.pr_dwelling_unit);
  const existingUnits = parseNumber(row.ex_dwelling_unit);
  const units = Math.max(proposedUnits, existingUnits);
  const issueType = cleanText(row.issue_type);
  const jobType = cleanText(row.job_type);
  const sourceUrl = rowUrl(dataset.id, row[":id"]);
  const sourceRecordId = [
    `job ${cleanText(row.job_number)}`,
    `Socrata row ${cleanText(row[":id"])}`,
    cleanText(row.item_number) ? `item ${cleanText(row.item_number)}` : "",
    issueType ? `issue ${issueType}` : ""
  ].filter(Boolean).join(" / ");
  const scale = {
    dwelling_units: units,
    proposed_dwelling_units: proposedUnits,
    existing_dwelling_units: existingUnits,
    civic_or_public_address_signal: civicSignalFor(row, address, borough)
  };
  const scaleText = scaleLabel(scale);
  const candidateId = `nyc_dob_co_round225_legacy_${slugify(row.job_number, 48)}_${slugify(issueType, 24)}_${date.replace(/-/g, "_")}`;
  const title = `DOB ${issueType.toLowerCase()} certificate of occupancy issued for ${address}`;
  const summary = [
    `${dataset.publisher} records an issued ${issueType} certificate of occupancy for legacy job ${cleanText(row.job_number)} at ${address}, ${borough} with c_o_issue_date ${cleanText(row.c_o_issue_date)}.`,
    `The CO row lists job_type '${jobType}', application_status_raw '${cleanText(row.application_status_raw)}', filing_status_raw '${cleanText(row.filing_status_raw)}', and scale fields: ${scaleText}.`
  ].join(" ");
  const observedChange = `DOB recorded a ${issueType.toLowerCase()} certificate-of-occupancy administrative issuance for ${jobType} job ${cleanText(row.job_number)} at ${address}.`;

  return {
    ...sharedCandidateFields(dataset, row, {
      candidateId,
      date,
      title,
      summary,
      observedChange,
      address,
      borough,
      area: `${address}, ${borough}, NY ${cleanText(row.postcode)}`,
      lat,
      lon,
      sourceUrl,
      sourceRecordId,
      sourceDateField: "c_o_issue_date",
      sourceDateRaw: cleanText(row.c_o_issue_date),
      projectType: `legacy DOB ${jobType} ${issueType} certificate of occupancy`,
      transformationMethod: `Round225 queried official legacy DOB Certificate Of Occupancy rows (${dataset.id}) with issued status and c_o_issue_date in ${START_DATE} through ${END_DATE}, retained rows within the dataset's stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}, grouped repeated rows by DOB job, BIN, and address, preferred final rows over temporary rows, retained nonduplicate high-signal NB/A1 rows with at least 25 dwelling units or a source-row civic/public text signal, and preserved row-level provenance.`
    }),
    job_number: cleanText(row.job_number),
    job_type: jobType,
    issue_type: issueType,
    application_status_raw: cleanText(row.application_status_raw),
    filing_status_raw: cleanText(row.filing_status_raw),
    item_number: cleanText(row.item_number),
    bin: cleanText(row.bin || row.bin_number),
    bin_number: cleanText(row.bin_number),
    bbl: cleanText(row.bbl),
    block: cleanText(row.block),
    lot: cleanText(row.lot),
    postcode: cleanText(row.postcode),
    community_board: cleanText(row.community_board),
    council_district: cleanText(row.council_district),
    census_tract: cleanText(row.census_tract),
    nta: cleanText(row.nta),
    scale_fields: scale,
    source_row_ref: {
      dataset_id: dataset.id,
      source_id: dataset.sourceId,
      socrata_row_id: cleanText(row[":id"]),
      job_number: cleanText(row.job_number),
      issue_type: issueType,
      item_number: cleanText(row.item_number),
      c_o_issue_date: date,
      accessed_at: ACCESSED_AT
    },
    source_fields: compactFields(row, LEGACY_SELECT),
    _score: row.__selection_score || scoreLegacy(row)
  };
}

function selectBalanced(candidates, target) {
  const sorted = candidates.slice().sort((a, b) => {
    const scoreDelta = (b._score || 0) - (a._score || 0);
    if (scoreDelta) return scoreDelta;
    const dateDelta = cleanText(b.date).localeCompare(cleanText(a.date));
    if (dateDelta) return dateDelta;
    return cleanText(a.candidate_id).localeCompare(cleanText(b.candidate_id));
  });

  const selected = [];
  const ids = new Set();
  const perDatasetLimit = Math.ceil(target / 2);
  for (const datasetId of [DATASETS.dobNowCo.id, DATASETS.legacyCo.id]) {
    let count = 0;
    for (const candidate of sorted) {
      if (candidate.source_dataset_id !== datasetId || ids.has(candidate.candidate_id)) continue;
      selected.push(candidate);
      ids.add(candidate.candidate_id);
      count += 1;
      if (count >= perDatasetLimit || selected.length >= target) break;
    }
  }

  if (selected.length < target) {
    for (const candidate of sorted) {
      if (ids.has(candidate.candidate_id)) continue;
      selected.push(candidate);
      ids.add(candidate.candidate_id);
      if (selected.length >= target) break;
    }
  }

  return selected
    .map((candidate) => {
      const copy = { ...candidate };
      delete copy._score;
      return copy;
    })
    .sort((a, b) => {
      const dateDelta = cleanText(a.date).localeCompare(cleanText(b.date));
      if (dateDelta) return dateDelta;
      return cleanText(a.candidate_id).localeCompare(cleanText(b.candidate_id));
    });
}

function metadataSummary(dataset, metadata) {
  return {
    source_id: dataset.sourceId,
    canonical_source_id: dataset.canonicalSourceId,
    dataset_id: dataset.id,
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: dataset.page,
    api_endpoint: dataset.api,
    metadata_url: dataset.metadata,
    source_type: "official NYC Open Data Socrata dataset",
    description: cleanText(metadata.description),
    attribution: metadata.attribution || dataset.publisher,
    provenance: metadata.provenance || "",
    rows_updated_at_utc: metadata.rowsUpdatedAt ? new Date(metadata.rowsUpdatedAt * 1000).toISOString() : null,
    publication_date_utc: metadata.publicationDate ? new Date(metadata.publicationDate * 1000).toISOString() : null,
    update_frequency: metadata.metadata?.custom_fields?.Update?.["Update Frequency"] || metadata.metadata?.custom_fields?.Dataset?.["Update Frequency"] || null,
    license: metadata.license || metadata.licenseId || "No dataset-specific license field exposed in Socrata metadata checked during this run; NYC Open Data Terms of Use / NYC.gov Terms of Use apply.",
    license_url: TERMS_URL
  };
}

async function fetchMetadata() {
  const [dobNowMetadata, legacyMetadata] = await Promise.all([
    fetchJson(DATASETS.dobNowCo.metadata, "DOB NOW CO metadata"),
    fetchJson(DATASETS.legacyCo.metadata, "legacy DOB CO metadata")
  ]);
  return {
    dobNow: metadataSummary(DATASETS.dobNowCo, dobNowMetadata),
    legacy: metadataSummary(DATASETS.legacyCo, legacyMetadata)
  };
}

async function fetchDobNowRows() {
  return fetchAllRows(DATASETS.dobNowCo.id, {
    $select: `${DOB_NOW_SELECT.join(",")},:id`,
    $where: [
      "c_of_o_status='CO Issued'",
      "c_of_o_issuance_date IS NOT NULL",
      "latitude IS NOT NULL",
      "longitude IS NOT NULL"
    ].join(" AND "),
    $order: "application_number"
  }, "DOB NOW Certificate of Occupancy rows");
}

async function fetchLegacyRows() {
  return fetchAllRows(DATASETS.legacyCo.id, {
    $select: `${LEGACY_SELECT.join(",")},:id`,
    $where: [
      `c_o_issue_date between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      "application_status_raw='Issued'",
      "issue_type in('Final','Temporary')",
      "job_type in('NB','A1')"
    ].join(" AND "),
    $order: "c_o_issue_date,job_number"
  }, "legacy DOB Certificate Of Occupancy rows");
}

function summarizeCandidates(candidates) {
  const bySource = {};
  const byYear = {};
  const byBorough = {};
  const byCoType = {};
  const byJobType = {};
  const units = [];
  for (const candidate of candidates) {
    bySource[candidate.source_dataset_id] = (bySource[candidate.source_dataset_id] || 0) + 1;
    byYear[candidate.date.slice(0, 4)] = (byYear[candidate.date.slice(0, 4)] || 0) + 1;
    byBorough[candidate.borough] = (byBorough[candidate.borough] || 0) + 1;
    const coType = candidate.c_of_o_filing_type || candidate.issue_type || "unknown";
    byCoType[coType] = (byCoType[coType] || 0) + 1;
    byJobType[candidate.job_type] = (byJobType[candidate.job_type] || 0) + 1;
    if (candidate.scale_fields?.dwelling_units) units.push(candidate.scale_fields.dwelling_units);
  }
  const sortedDates = candidates.map((candidate) => candidate.date).sort();
  units.sort((a, b) => a - b);
  return {
    by_source_dataset_id: bySource,
    by_year: byYear,
    by_borough: byBorough,
    by_co_type: byCoType,
    by_job_type: byJobType,
    date_range: candidates.length ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] } : null,
    dwelling_units: units.length ? {
      min: units[0],
      median: units[Math.floor(units.length / 2)],
      max: units[units.length - 1]
    } : null
  };
}

function validateCandidates(candidates, duplicateIndex) {
  const ids = new Set();
  const sourceKeys = new Set();
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const required = [
    "city_id",
    "candidate_id",
    "event_id",
    "date",
    "effective_date",
    "title",
    "summary",
    "observed_change",
    "address",
    "borough",
    "latitude",
    "longitude",
    "geometry",
    "source_id",
    "source_ids",
    "source_name",
    "publisher",
    "source_url",
    "source_api_url",
    "source_record_id",
    "source_type",
    "source_dataset_id",
    "source_date_field",
    "license",
    "license_url",
    "license_or_terms_note",
    "accessed_at",
    "confidence",
    "geometry_source",
    "geometry_precision",
    "attribution",
    "limitations",
    "transformation_method",
    "source_row_ref",
    "source_fields"
  ];
  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (!inDateWindow(candidate.date)) throw new Error(`Out-of-window date for ${candidate.candidate_id}: ${candidate.date}`);
    if (!isNycPoint(Number(candidate.latitude), Number(candidate.longitude))) {
      throw new Error(`Invalid NYC point for ${candidate.candidate_id}`);
    }
    if (candidate.geometry.type !== "Point" || candidate.geometry.coordinates[0] !== candidate.longitude || candidate.geometry.coordinates[1] !== candidate.latitude) {
      throw new Error(`Invalid GeoJSON point for ${candidate.candidate_id}`);
    }
    if (!["pkdm-hqz6", "bs8b-p36w"].includes(candidate.source_dataset_id)) {
      throw new Error(`Unexpected source dataset for ${candidate.candidate_id}: ${candidate.source_dataset_id}`);
    }
    const caveatText = cleanText(candidate.limitations).toLowerCase();
    for (const phrase of ["not actual occupancy", "public opening", "project completion", "safety outcome", "affordability outcome", "causal effect"]) {
      if (!caveatText.includes(phrase)) throw new Error(`Missing CO caveat phrase '${phrase}' for ${candidate.candidate_id}`);
    }
    if (banned.test([candidate.title, candidate.summary, candidate.observed_change, candidate.transformation_method].join(" "))) {
      throw new Error(`Overclaim wording detected for ${candidate.candidate_id}`);
    }
    if (ids.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    const sourceKey = sourceRecordKey(candidate);
    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source record ${sourceKey}`);
    sourceKeys.add(sourceKey);
    if (duplicateIndex.sourceDateKeys.has(sourceDateKey(candidate)) || duplicateIndex.sourceDateKeys.has(sourceDateWildcardKey(candidate))) {
      throw new Error(`Existing source-date key for ${candidate.candidate_id}: ${sourceDateKey(candidate)}`);
    }
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function notesMarkdown(candidates, summary, duplicateIndex, fetchedCounts, rejectionCounts) {
  const sourceCounts = summary.selected_summary.by_source_dataset_id;
  return [
    "# Round225 NYC DOB CO Next13 Candidate Pack",
    "",
    `Generated ${candidates.length} certificate-of-occupancy candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "- Official NYC Open Data DOB NOW Certificate of Occupancy (`pkdm-hqz6`) rows.",
    "- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.",
    `- Date window: ${START_DATE} through ${END_DATE}. Legacy candidates were limited to the dataset's stated pre-DOB-NOW period through ${LEGACY_PREFERRED_END_DATE}.`,
    "",
    "## Counts",
    "",
    `- Candidates retained: ${candidates.length}`,
    `- DOB NOW retained: ${sourceCounts["pkdm-hqz6"] || 0}`,
    `- Legacy retained: ${sourceCounts["bs8b-p36w"] || 0}`,
    `- DOB NOW rows fetched: ${fetchedCounts.dob_now_rows_fetched}`,
    `- Legacy rows fetched: ${fetchedCounts.legacy_rows_fetched}`,
    `- Duplicate/reject samples recorded: ${Object.values(rejectionCounts).reduce((sum, count) => sum + count, 0)}`,
    "",
    "## Selection",
    "",
    "- Required CO issued status, row-level date, in-city coordinates, source row identifiers, and DOB/NYC Open Data provenance.",
    "- Preferred final or initial DOB NOW CO rows and final legacy CO rows; renewal-only DOB NOW rows were rejected as noisy repeat signals.",
    "- Retained NB/New Building and Alteration CO/A1 rows with at least 25 source-reported dwelling units or a source-row civic/public text signal.",
    "- Grouped repeated rows by DOB job/base job, BIN, and normalized address before selecting the best CO milestone for that group.",
    "",
    "## Duplicate Screening",
    "",
    `Screened ${duplicateIndex.files.length} files, ${duplicateIndex.tokens.size} identifier tokens, and ${duplicateIndex.sourceDateKeys.size} source-date keys, including the live manual corpus and prior DOB/CO candidate packs for rounds 117, 119, 133, 136, 143, 149, 152, 155, 160, 164, 169, 175, 181, 187, 193, 199, 205, 211, and 219.`,
    "",
    "## Caveats",
    "",
    "- A CO row is a legal/admin DOB record. It is not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.",
    "- Dwelling-unit counts and job/CO type labels are source row values and may be corrected or superseded.",
    "- Coordinates are DOB/Open Data geocoded points, not surveyed footprints or parcel boundaries.",
    "- Keep DOB and NYC Open Data attribution with row-level Socrata URLs."
  ].join("\n");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const duplicateIndex = buildExistingIndex();
  console.log(`Duplicate index: ${duplicateIndex.tokens.size} tokens from ${duplicateIndex.files.length} files`);

  const [metadata, dobNowRows, legacyRows] = await Promise.all([
    fetchMetadata(),
    fetchDobNowRows(),
    fetchLegacyRows()
  ]);

  const rejections = [];
  const candidatePool = [];

  const groupedDobNow = chooseBestByGroup(dobNowRows, dobNowGroupKey, scoreDobNow);
  for (const row of groupedDobNow) {
    const dataset = DATASETS.dobNowCo;
    const date = parseDate(row.c_of_o_issuance_date);
    const address = dobNowAddress(row);
    const lat = parseNumber(row.latitude);
    const lon = parseNumber(row.longitude);
    if (!date || !inDateWindow(date)) {
      reject(rejections, row, dataset, "dob_now_issue_date_missing_or_outside_window", { date, address });
      continue;
    }
    if (!isNycPoint(lat, lon)) {
      reject(rejections, row, dataset, "dob_now_invalid_or_outside_nyc_geometry", { date, address });
      continue;
    }
    if (!isHighSignalDobNow(row)) {
      reject(rejections, row, dataset, "dob_now_below_high_signal_threshold_or_renewal", { date, address });
      continue;
    }
    const duplicateReason = duplicateReasonDobNow(row, duplicateIndex);
    if (duplicateReason) {
      reject(rejections, row, dataset, duplicateReason, { date, address });
      continue;
    }
    candidatePool.push(candidateFromDobNow(row));
  }

  const groupedLegacy = chooseBestByGroup(legacyRows, legacyGroupKey, scoreLegacy);
  for (const row of groupedLegacy) {
    const dataset = DATASETS.legacyCo;
    const date = parseDate(row.c_o_issue_date);
    const address = legacyAddress(row);
    const lat = parseNumber(row.latitude);
    const lon = parseNumber(row.longitude);
    if (!date || !inDateWindow(date)) {
      reject(rejections, row, dataset, "legacy_issue_date_missing_or_outside_window", { date, address });
      continue;
    }
    if (date > LEGACY_PREFERRED_END_DATE) {
      reject(rejections, row, dataset, "legacy_post_dob_now_coverage_period", { date, address });
      continue;
    }
    if (!isNycPoint(lat, lon)) {
      reject(rejections, row, dataset, "legacy_invalid_or_outside_nyc_geometry", { date, address });
      continue;
    }
    if (!isHighSignalLegacy(row)) {
      reject(rejections, row, dataset, "legacy_below_high_signal_threshold", { date, address });
      continue;
    }
    const duplicateReason = duplicateReasonLegacy(row, duplicateIndex);
    if (duplicateReason) {
      reject(rejections, row, dataset, duplicateReason, { date, address });
      continue;
    }
    candidatePool.push(candidateFromLegacy(row));
  }

  const candidates = selectBalanced(candidatePool, TARGET_COUNT);
  validateCandidates(candidates, duplicateIndex);

  const selectedSummary = summarizeCandidates(candidates);
  const rejectedCounts = rejectionCounter(rejections);
  const selectionSummary = {
    date_window: { start: START_DATE, end: END_DATE },
    legacy_preferred_end_date: LEGACY_PREFERRED_END_DATE,
    target_count: TARGET_COUNT,
    candidate_pool_before_balancing: candidatePool.length,
    candidate_count: candidates.length,
    eligible_headroom_after_retained_candidates: Math.max(candidatePool.length - candidates.length, 0),
    retained_less_than_target_reason: candidates.length < TARGET_COUNT ? "Source/dedupe/high-signal filters yielded fewer nonduplicate candidates than target." : null,
    duplicate_screening: {
      files_read: duplicateIndex.files.length,
      tokens: duplicateIndex.tokens.size,
      source_date_keys: duplicateIndex.sourceDateKeys.size,
      screened_files: duplicateIndex.files,
      manual_event_count: duplicateIndex.manualEventCount
    },
    fetched_counts: {
      dob_now_rows_fetched: dobNowRows.length,
      dob_now_grouped_rows: groupedDobNow.length,
      legacy_rows_fetched: legacyRows.length,
      legacy_grouped_rows: groupedLegacy.length
    },
    rejected_counts: rejectedCounts,
    selected_summary: selectedSummary
  };

  const sourceAudits = [
    {
      ...metadata.dobNow,
      reliability: "strong for DOB-issued CO administrative status; usable with caveats for city-change milestones",
      coverage_years_checked: `${START_DATE} through ${END_DATE}`,
      published_coverage_note: "DOB NOW CO module was released in March 2021; the dataset description directs users to this view from that point onward.",
      geographic_scope: "New York City DOB NOW certificate-of-occupancy records with address, BIN, BBL, and latitude/longitude fields when geocoded.",
      granularity: "One certificate-of-occupancy application/sequence row; repeated rows can occur for renewal, sequence, status, or later corrections.",
      key_fields_for_events: DOB_NOW_SELECT,
      source_date_fields: ["c_of_o_issuance_date", "submitted_date"],
      geometry_fields: ["latitude", "longitude", "bbl", "bin"],
      accepted_candidate_count: selectedSummary.by_source_dataset_id?.["pkdm-hqz6"] || 0,
      required_caveats: [
        "CO issuance is an administrative/legal record, not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.",
        "DOB NOW c_of_o_issuance_date is a text field and must be parsed carefully.",
        "Renewal rows can duplicate earlier CO milestones and were excluded from accepted candidates in this pass.",
        "Dwelling-unit counts are DOB row values and may be corrected by later records."
      ],
      ingestion_recommendation: "Append only with row-level source URL, application number, job filing name, CO number, date field, coordinates, terms note, and limitations."
    },
    {
      ...metadata.legacy,
      reliability: "strong for issued legacy CO administrative status; usable with caveats for city-change milestones",
      coverage_years_checked: `${START_DATE} through ${END_DATE}`,
      published_coverage_note: "Dataset description says legacy CO coverage is primarily 2012-07-12 through March 2021; this pass retained legacy candidates only through 2021-03-31.",
      geographic_scope: "New York City legacy DOB certificate-of-occupancy records with address, BIN, BBL, and latitude/longitude fields when geocoded.",
      granularity: "One legacy DOB certificate-of-occupancy job/item row; repeated temporary CO rows can occur for one job and address.",
      key_fields_for_events: LEGACY_SELECT,
      source_date_fields: ["c_o_issue_date"],
      geometry_fields: ["latitude", "longitude", "location", "bbl", "bin", "bin_number"],
      accepted_candidate_count: selectedSummary.by_source_dataset_id?.["bs8b-p36w"] || 0,
      required_caveats: [
        "Legacy CO issuance is an administrative/legal record, not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.",
        "Legacy coverage does not support pre-2012 CO discovery even though the requested scan window begins in 2008.",
        "For records after March 2021, DOB NOW CO is the preferred source.",
        "Temporary CO rows can recur for the same project and were grouped before candidate selection."
      ],
      ingestion_recommendation: "Append only with row-level source URL, DOB job number, item/issue type, date field, coordinates, terms note, and limitations."
    }
  ];

  const output = {
    schema_version: "round225.nyc_dob_co_next13_candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    worker: "Round225 NYC DOB CO next13 candidates",
    scope: "Official NYC DOB Certificate of Occupancy and DOB NOW Certificate of Occupancy candidate pack. Records are legal/admin CO milestones and must not be presented as actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.",
    candidate_count: candidates.length,
    source_audits: sourceAudits,
    selection_summary: selectionSummary,
    candidates
  };

  const sourceAudit = {
    schema_version: "round225.nyc_dob_co_next13_source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Official NYC Open Data DOB NOW Certificate of Occupancy and legacy DOB Certificate Of Occupancy source audit for Bims-5 candidate ingestion.",
    sources: sourceAudits,
    selection_summary: selectionSummary,
    caveat: "CO rows are legal/admin records. Do not present them as actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence."
  };

  const summary = {
    schema_version: "round225.nyc_dob_co_next13_summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    output_files: [
      path.join(OUT_DIR, "candidates.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "source_audit.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "summary.json").replace(/\\/g, "/"),
      path.join(OUT_DIR, "notes.md").replace(/\\/g, "/"),
      path.join(OUT_DIR, "rejected.json").replace(/\\/g, "/")
    ],
    candidate_count: candidates.length,
    selected_summary: selectedSummary,
    source_ids: [DATASETS.dobNowCo.sourceId, DATASETS.legacyCo.sourceId, DATASETS.dobNowCo.canonicalSourceId],
    date_window: selectionSummary.date_window,
    legacy_preferred_end_date: LEGACY_PREFERRED_END_DATE,
    legacy_vs_dob_now_mix: {
      dob_now: selectedSummary.by_source_dataset_id?.["pkdm-hqz6"] || 0,
      legacy: selectedSummary.by_source_dataset_id?.["bs8b-p36w"] || 0
    },
    selection_summary: selectionSummary,
    caveats: [
      "Certificate of occupancy legal/admin milestone only.",
      "Not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.",
      "Coordinates are DOB/Open Data geocoded address points.",
      "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
    ],
    sample_candidates: candidates.slice(0, 12).map((candidate) => ({
      candidate_id: candidate.candidate_id,
      date: candidate.date,
      address: candidate.address,
      borough: candidate.borough,
      source_dataset_id: candidate.source_dataset_id,
      source_record_id: candidate.source_record_id,
      job_number: candidate.job_number,
      job_filing_name: candidate.job_filing_name,
      application_number: candidate.application_number,
      c_of_o_number: candidate.c_of_o_number
    }))
  };

  const rejectedOutput = {
    schema_version: "round225.nyc_dob_co_next13_rejections.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_counts: rejectedCounts,
    rejected_sample_limit: 5000,
    sample_rejections: rejections.slice(0, 5000)
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), output);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedOutput);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notesMarkdown(candidates, summary, duplicateIndex, selectionSummary.fetched_counts, rejectedCounts)}\n`);

  console.log(JSON.stringify({
    candidate_count: candidates.length,
    date_range: selectedSummary.date_range,
    legacy_vs_dob_now_mix: summary.legacy_vs_dob_now_mix,
    fetched_counts: selectionSummary.fetched_counts,
    rejected_counts: rejectedCounts
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
