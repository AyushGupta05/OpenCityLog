const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const LEGACY_PREFERRED_END_DATE = "2021-03-31";
const TARGET_COUNT = 200;
const ROUND = "round308";
const NEXT_LABEL = "next26";
const OUT_DIR = path.join("tmp", "subagents", "round308_nyc_dob_co_next26");
const CORPUS_PATH = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";

const TERMS_URL = "https://opendata.cityofnewyork.us/overview/#termsofuse";
const NYC_GOV_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";

const LEGACY_CO = {
  key: "legacy",
  id: "bs8b-p36w",
  sourceId: "nyc-dob-certificate-of-occupancy-bs8b-p36w",
  canonicalSourceId: "nyc-dob-certificate-of-occupancy",
  name: "NYC Open Data: DOB Certificate Of Occupancy",
  publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
  page: "https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w",
  api: "https://data.cityofnewyork.us/resource/bs8b-p36w.json",
  metadata: "https://data.cityofnewyork.us/api/views/bs8b-p36w"
};

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

const PUBLIC_CIVIC_PATTERN = /\b(SCHOOL|HOSPITAL|LIBRARY|MUSEUM|UNIVERSITY|COLLEGE|CUNY|NYCHA|AUTHORITY|DEPARTMENT|CIVIC|COURT|POLICE|FIRE|PARK|HEALTH|TRANSIT|MTA|CULTURAL)\b/i;
const BANNED_OUTPUT_TERMS = /\b(proof|prove|proves|proved|predict|predicts|predicted|prediction|forecast|forecasts|forecasted|forecasting|simulate|simulates|simulated|simulation|causal|causation|impact score)\b/i;

const EXPLICIT_DUPLICATE_CANDIDATE_FILES = [
  "tmp/subagents/round117_nyc_dob_co_high_signal/candidates.json",
  "tmp/subagents/round117_nyc_dob_filings_permits/candidates.json",
  "tmp/subagents/round117_nyc_local_dob_bulk/candidates.json",
  "tmp/subagents/round119_nyc_dob_legacy_bulk/candidates.json",
  "tmp/subagents/round133_nyc_official_architecture/candidates.json",
  "tmp/subagents/round136_nyc_dob_now_more/candidates.json",
  "tmp/subagents/round143_nyc_dob_now_even_more_candidates.json",
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
  "tmp/subagents/round219_nyc_dob_co_next12/candidates.json",
  "tmp/subagents/round225_nyc_dob_co_next13/candidates.json",
  "tmp/subagents/round232_nyc_dob_co_next14/candidates.json",
  "tmp/subagents/round242_nyc_dob_co_next15/candidates.json",
  "tmp/subagents/round247_nyc_dob_co_next16/candidates.json",
  "tmp/subagents/round250_nyc_dob_co_next17/candidates.json",
  "tmp/subagents/round256_nyc_dob_co_next18/candidates.json",
  "tmp/subagents/round264_nyc_dob_co_next19/candidates.json",
  "tmp/subagents/round267_nyc_dob_co_next20/candidates.json",
  "tmp/subagents/round273_nyc_dob_co_next21/candidates.json",
  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json",
  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json",
  "tmp/subagents/round300_nyc_dob_co_next24/candidates.json",
  "tmp/subagents/round303_nyc_dob_co_next25/candidates.json"
];

const REQUIRED_SCREENED_FILES = [
  CORPUS_PATH,
  "tmp/subagents/round278_nyc_dob_co_next22/candidates.json",
  "tmp/subagents/round289_nyc_dob_co_next23/candidates.json",
  "tmp/subagents/round300_nyc_dob_co_next24/candidates.json",
  "tmp/subagents/round303_nyc_dob_co_next25/candidates.json"
];

const SCREENED_ROUNDS = [
  "117",
  "119",
  "133",
  "136",
  "143",
  "149",
  "152",
  "155",
  "160",
  "164",
  "169",
  "175",
  "181",
  "187",
  "193",
  "199",
  "205",
  "211",
  "219",
  "225",
  "232",
  "242",
  "247",
  "250",
  "256",
  "264",
  "267",
  "273",
  "278",
  "289",
  "300",
  "303"
];

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
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

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candidateArray(doc) {
  if (!doc) return [];
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function addToken(tokens, value) {
  const text = normalizeKey(value);
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
  for (const match of text.matchAll(/\brow-[a-z0-9.~_-]+\b/gi)) addToken(tokens, match[0]);
}

function dobNowBaseNumber(value) {
  const text = cleanText(value).toUpperCase();
  const match = text.match(/^([A-Z]\d{8})/);
  return match ? match[1] : text;
}

function collectExistingTokensFromObject(index, value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectExistingTokensFromObject(index, item);
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
    addToken(index.tokens, value[key]);
    addToken(index.tokens, dobNowBaseNumber(value[key]));
    addIdentifierRegexTokens(index.tokens, value[key]);
  }

  if (value.event_id) index.eventIds.add(normalizeKey(value.event_id));
  if (value.candidate_id) index.candidateIds.add(normalizeKey(value.candidate_id));

  const textBlob = [
    value.title,
    value.summary,
    value.observed_change,
    value.area,
    value.address,
    value.source_record_id,
    value.source_url
  ].map(cleanText).join(" ");
  addIdentifierRegexTokens(index.tokens, textBlob);

  const address = normalizeAddress(value.address || value.area || "");
  const date = parseDate(value.date || value.effective_date || "");
  if (address && date) index.addressDateKeys.add(`${address}|${date}`);

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
    index.sourceDateKeys.add(`${sourceDataset}|${sourceRecord}|${date}`.toLowerCase());
    index.sourceDateKeys.add(`*|${sourceRecord}|${date}`.toLowerCase());
  }
  const sourceUrl = cleanText(value.source_url);
  if (sourceUrl && date) index.sourceUrlDateKeys.add(`${sourceUrl}|${date}`.toLowerCase());

  for (const key of ["source_row_ref", "source_fields", "raw_row", "row_fields", "group_key"]) {
    collectExistingTokensFromObject(index, value[key]);
  }
}

function buildExistingIndex() {
  const index = {
    tokens: new Set(),
    addressDateKeys: new Set(),
    sourceDateKeys: new Set(),
    sourceUrlDateKeys: new Set(),
    eventIds: new Set(),
    candidateIds: new Set(),
    files: [],
    missingFiles: [],
    manualEventCount: 0
  };

  const files = Array.from(new Set([CORPUS_PATH, ...EXPLICIT_DUPLICATE_CANDIDATE_FILES]));
  for (const file of files) {
    if (!fs.existsSync(file)) {
      if (REQUIRED_SCREENED_FILES.includes(file)) index.missingFiles.push(file);
      continue;
    }
    try {
      const doc = readJsonIfExists(file);
      const rows = candidateArray(doc);
      if (file === CORPUS_PATH) index.manualEventCount = rows.length;
      collectExistingTokensFromObject(index, rows);
      index.files.push(file.replace(/\\/g, "/"));
    } catch (error) {
      throw new Error(`Could not read duplicate-index file ${file}: ${error.message}`);
    }
  }

  return index;
}

function tokenExists(existing, value) {
  const text = normalizeKey(value);
  return text.length >= 4 && existing.tokens.has(text);
}

function anyTokenExists(existing, values) {
  return values.some((value) => tokenExists(existing, value) || tokenExists(existing, dobNowBaseNumber(value)));
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
    source_record_id: extra.source_record_id || cleanText(row.job_number),
    date: extra.date || parseDate(row.c_o_issue_date),
    address: extra.address || "",
    note: extra.note || ""
  });
}

function rejectionCounter(rejections) {
  const counts = {};
  for (const item of rejections) counts[item.reason] = (counts[item.reason] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function legacyAddress(row) {
  return cleanAddress([row.house_number, row.street_name]);
}

function legacyGroupKey(row) {
  return [
    LEGACY_CO.id,
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
  if (text === "NB") return 5;
  if (text === "A1") return 4;
  return 0;
}

function civicSignalFor(row, address, borough) {
  const haystack = [
    address,
    borough,
    row.street_name,
    row.nta,
    row.job_type,
    row.filing_status_raw
  ].map(cleanText).join(" ");
  return PUBLIC_CIVIC_PATTERN.test(haystack);
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
    const date = parseDate(row.c_o_issue_date);
    if (!current || score > current.score || (score === current.score && date > current.date)) {
      best.set(key, { row, score, date });
    }
  }
  return [...best.values()].map((item) => ({ ...item.row, __selection_score: item.score }));
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
    rowUrl(LEGACY_CO.id, row[":id"]),
    socrataUrl(LEGACY_CO.id, { job_number: row.job_number })
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
    "It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
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
    duplicate_check_note: `Screened exact DOB job numbers, Socrata row IDs, source URLs, source_record_id text, candidate/event IDs, and same-address/same-date keys against the live manual architecture corpus and prior DOB/CO tmp candidate packs including rounds ${SCREENED_ROUNDS.join(", ")}.`,
    duplicate_screen: {
      duplicate_identifier_found: false,
      screened_manual_corpus_and_prior_rounds: true,
      screened_rounds: SCREENED_ROUNDS
    }
  };
}

function candidateFromLegacy(row) {
  const dataset = LEGACY_CO;
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
  const candidateId = `nyc_dob_co_round308_legacy_${slugify(row.job_number, 48)}_${slugify(issueType, 24)}_${date.replace(/-/g, "_")}`;
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
      transformationMethod: `Round308 queried official legacy DOB Certificate Of Occupancy rows (${dataset.id}) with issued status and c_o_issue_date in ${START_DATE} through ${END_DATE}, retained rows within the dataset's stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}, grouped repeated rows by DOB job, BIN, and address, preferred final rows over temporary rows, retained nonduplicate high-signal NB/A1 rows with at least 25 dwelling units or a source-row civic/public text signal after screening prior CO packs through round303, and preserved row-level provenance.`
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

function sourceRecordKey(candidate) {
  return `${candidate.source_dataset_id}|${candidate.source_record_id}`;
}

function sourceDateKey(candidate) {
  return `${candidate.source_dataset_id || "*"}|${candidate.source_record_id}|${candidate.date || candidate.effective_date}`.toLowerCase();
}

function sourceDateWildcardKey(candidate) {
  return `*|${candidate.source_record_id}|${candidate.date || candidate.effective_date}`.toLowerCase();
}

function sourceUrlDateKey(candidate) {
  const sourceUrl = cleanText(candidate.source_url);
  const date = parseDate(candidate.date || candidate.effective_date || "");
  return sourceUrl && date ? `${sourceUrl}|${date}`.toLowerCase() : "";
}

function candidateAddressDateKey(candidate) {
  return `${normalizeAddress(`${candidate.address || ""} ${candidate.borough || ""}`)}|${candidate.date || candidate.effective_date || ""}`;
}

function selectCandidates(candidates, target) {
  const sorted = candidates.slice().sort((a, b) => {
    const scoreDelta = (b._score || 0) - (a._score || 0);
    if (scoreDelta) return scoreDelta;
    const dateDelta = cleanText(b.date).localeCompare(cleanText(a.date));
    if (dateDelta) return dateDelta;
    return cleanText(a.candidate_id).localeCompare(cleanText(b.candidate_id));
  });

  const selected = [];
  const ids = new Set();
  const addressDateKeys = new Set();
  for (const candidate of sorted) {
    const addressDateKey = candidateAddressDateKey(candidate);
    if (ids.has(candidate.candidate_id) || addressDateKeys.has(addressDateKey)) continue;
    const copy = { ...candidate };
    delete copy._score;
    selected.push(copy);
    ids.add(candidate.candidate_id);
    addressDateKeys.add(addressDateKey);
    if (selected.length >= target) break;
  }

  return selected.sort((a, b) => {
    const dateDelta = cleanText(a.date).localeCompare(cleanText(b.date));
    if (dateDelta) return dateDelta;
    return cleanText(a.candidate_id).localeCompare(cleanText(b.candidate_id));
  });
}

function countBy(rows, fn) {
  const counts = {};
  for (const row of rows) {
    const key = cleanText(fn(row)) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function summarizeCandidates(candidates) {
  const units = [];
  for (const candidate of candidates) {
    if (candidate.scale_fields?.dwelling_units) units.push(candidate.scale_fields.dwelling_units);
  }
  const sortedDates = candidates.map((candidate) => candidate.date).sort();
  units.sort((a, b) => a - b);
  return {
    by_source_dataset_id: countBy(candidates, (candidate) => candidate.source_dataset_id),
    by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    by_borough: countBy(candidates, (candidate) => candidate.borough),
    by_co_type: countBy(candidates, (candidate) => candidate.issue_type || "unknown"),
    by_job_type: countBy(candidates, (candidate) => candidate.job_type),
    date_range: candidates.length ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] } : null,
    dwelling_units: units.length ? {
      min: units[0],
      median: units[Math.floor(units.length / 2)],
      max: units[units.length - 1]
    } : null,
    by_status: countBy(candidates, (candidate) => candidate.application_status_raw),
    by_source_status: countBy(candidates, (candidate) => `${candidate.source_dataset_id}|${candidate.application_status_raw}`),
    by_source_date_field: countBy(candidates, (candidate) => `${candidate.source_dataset_id}|${candidate.source_date_field}`)
  };
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
  const legacyMetadata = await fetchJson(LEGACY_CO.metadata, "legacy DOB CO metadata");
  return metadataSummary(LEGACY_CO, legacyMetadata);
}

async function fetchLegacyRows() {
  return fetchAllRows(LEGACY_CO.id, {
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

function validateCandidates(candidates, duplicateIndex, summary, sourceAudit) {
  const errors = [];
  const requiredFields = [
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
  const confidenceValues = new Set(["documented", "corroborated", "inferred", "disputed"]);
  const eventIds = new Set();
  const candidateIds = new Set();
  const sourceRecordKeys = new Set();
  const sourceDateKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const addressDateKeys = new Set();

  if (summary.candidate_count !== TARGET_COUNT || candidates.length !== TARGET_COUNT) {
    errors.push(`Expected ${TARGET_COUNT} candidates, found summary=${summary.candidate_count} candidates=${candidates.length}`);
  }
  for (const requiredFile of REQUIRED_SCREENED_FILES) {
    if (!duplicateIndex.files.includes(requiredFile)) errors.push(`Required screened file missing from duplicate index: ${requiredFile}`);
  }
  for (const missingFile of duplicateIndex.missingFiles) {
    errors.push(`Required duplicate-screen file not found: ${missingFile}`);
  }
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length !== 1 || sourceAudit.sources[0].dataset_id !== LEGACY_CO.id) {
    errors.push("Source audit must contain exactly the legacy DOB CO source.");
  }

  for (const candidate of candidates) {
    const label = candidate.candidate_id || candidate.event_id || "(unknown candidate)";
    for (const field of requiredFields) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Missing ${field} for ${label}`);
      }
    }
    if (candidate.accessed_at !== ACCESSED_AT) errors.push(`Unexpected accessed_at for ${label}: ${candidate.accessed_at}`);
    if (!confidenceValues.has(candidate.confidence)) errors.push(`Invalid confidence for ${label}: ${candidate.confidence}`);
    if (candidate.source_dataset_id !== LEGACY_CO.id) errors.push(`Unexpected source dataset for ${label}: ${candidate.source_dataset_id}`);
    if (candidate.source_id !== LEGACY_CO.sourceId) errors.push(`Unexpected source_id for ${label}: ${candidate.source_id}`);

    const date = parseDate(candidate.date);
    if (!date || !inDateWindow(date) || candidate.effective_date !== date) {
      errors.push(`Out-of-window or mismatched date for ${label}: ${candidate.date}`);
    }

    const latitude = Number(candidate.latitude);
    const longitude = Number(candidate.longitude);
    if (!isNycPoint(latitude, longitude)) errors.push(`Outside NYC coordinate bounds for ${label}`);
    if (candidate.geometry?.type !== "Point" ||
      candidate.geometry.coordinates?.[0] !== longitude ||
      candidate.geometry.coordinates?.[1] !== latitude) {
      errors.push(`Invalid GeoJSON point for ${label}`);
    }

    const textForOutput = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method
    ].join(" ");
    if (BANNED_OUTPUT_TERMS.test(textForOutput)) errors.push(`Overclaim wording detected for ${label}`);
    const caveatText = normalizeKey(candidate.limitations);
    for (const phrase of ["not actual occupancy", "public opening", "completion for all spaces", "safety outcome", "affordability outcome"]) {
      if (!caveatText.includes(phrase)) errors.push(`Missing CO caveat phrase '${phrase}' for ${label}`);
    }

    const eventKey = normalizeKey(candidate.event_id);
    const candidateKey = normalizeKey(candidate.candidate_id);
    if (eventIds.has(eventKey)) errors.push(`Duplicate event_id in pack: ${candidate.event_id}`);
    if (candidateIds.has(candidateKey)) errors.push(`Duplicate candidate_id in pack: ${candidate.candidate_id}`);
    eventIds.add(eventKey);
    candidateIds.add(candidateKey);
    if (duplicateIndex.eventIds.has(eventKey) || duplicateIndex.candidateIds.has(eventKey)) {
      errors.push(`Existing event/candidate id overlap for ${label}`);
    }

    const recordKey = sourceRecordKey(candidate);
    if (sourceRecordKeys.has(recordKey)) errors.push(`Duplicate source record key in pack: ${recordKey}`);
    sourceRecordKeys.add(recordKey);

    const addressDateKey = candidateAddressDateKey(candidate);
    if (addressDateKeys.has(addressDateKey)) errors.push(`Duplicate address/date key in pack: ${addressDateKey}`);
    addressDateKeys.add(addressDateKey);
    if (duplicateIndex.addressDateKeys.has(addressDateKey)) errors.push(`Existing address/date overlap for ${label}: ${addressDateKey}`);

    const sourceDate = sourceDateKey(candidate);
    const wildcard = sourceDateWildcardKey(candidate);
    if (!sourceDate) errors.push(`Missing source/date key for ${label}`);
    if (sourceDateKeys.has(sourceDate)) errors.push(`Duplicate source/date key in pack: ${sourceDate}`);
    sourceDateKeys.add(sourceDate);
    if (duplicateIndex.sourceDateKeys.has(sourceDate) || duplicateIndex.sourceDateKeys.has(wildcard)) {
      errors.push(`Existing source/date overlap for ${label}: ${sourceDate}`);
    }

    const urlDate = sourceUrlDateKey(candidate);
    if (urlDate) {
      if (sourceUrlDateKeys.has(urlDate)) errors.push(`Duplicate source URL/date key in pack: ${urlDate}`);
      sourceUrlDateKeys.add(urlDate);
      if (duplicateIndex.sourceUrlDateKeys.has(urlDate)) errors.push(`Existing source URL/date overlap for ${label}: ${urlDate}`);
    }

    const candidateTokens = {
      tokens: new Set(),
      addressDateKeys: new Set(),
      sourceDateKeys: new Set(),
      sourceUrlDateKeys: new Set(),
      eventIds: new Set(),
      candidateIds: new Set()
    };
    collectExistingTokensFromObject(candidateTokens, candidate);
    for (const token of candidateTokens.tokens) {
      if (duplicateIndex.tokens.has(token)) {
        errors.push(`Existing identifier token overlap for ${label}: ${token}`);
        break;
      }
    }
  }

  const validation = {
    schema_version: "round308.nyc_dob_co_next26_validation.v1",
    ok: errors.length === 0,
    checked_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: "scripts/fetch_round308_nyc_dob_co_next26_candidates.js standalone validation artifact",
    errors,
    checks: {
      candidate_count: candidates.length,
      summary_candidate_count: summary.candidate_count,
      required_provenance_fields: requiredFields,
      date_window: { start: START_DATE, end: END_DATE },
      legacy_preferred_end_date: LEGACY_PREFERRED_END_DATE,
      date_range: summary.selected_summary.date_range,
      unique_event_ids: eventIds.size,
      unique_candidate_ids: candidateIds.size,
      unique_source_record_keys: sourceRecordKeys.size,
      unique_source_date_keys: sourceDateKeys.size,
      unique_source_url_date_keys: sourceUrlDateKeys.size,
      unique_address_date_keys: addressDateKeys.size,
      nyc_coordinate_bounds_valid: errors.every((error) => !error.includes("coordinate bounds")),
      screened_files_count: duplicateIndex.files.length,
      screened_files_read: duplicateIndex.files.length,
      screened_files_missing: duplicateIndex.missingFiles,
      required_round278_screened: duplicateIndex.files.includes("tmp/subagents/round278_nyc_dob_co_next22/candidates.json"),
      required_round289_screened: duplicateIndex.files.includes("tmp/subagents/round289_nyc_dob_co_next23/candidates.json"),
      required_round300_screened: duplicateIndex.files.includes("tmp/subagents/round300_nyc_dob_co_next24/candidates.json"),
      required_round303_screened: duplicateIndex.files.includes("tmp/subagents/round303_nyc_dob_co_next25/candidates.json"),
      manual_corpus_screened: duplicateIndex.files.includes(CORPUS_PATH),
      prior_source_date_keys_checked: duplicateIndex.sourceDateKeys.size,
      prior_identifier_tokens_checked: duplicateIndex.tokens.size,
      no_overlap_with_screened_corpus_and_prior_packs: errors.every((error) => !error.includes("overlap")),
      by_source_dataset_id: summary.selected_summary.by_source_dataset_id,
      by_borough: summary.selected_summary.by_borough,
      by_source_date_field: summary.selected_summary.by_source_date_field,
      source_audit_count: sourceAudit.sources.length
    }
  };

  return validation;
}

function buildNotes(candidates, summary, duplicateIndex, fetchedCounts, rejectionCounts, validation) {
  const rejectedTotal = Object.values(rejectionCounts).reduce((sum, count) => sum + count, 0);
  return [
    "# Round308 NYC DOB CO Next26 Candidate Pack",
    "",
    `Generated ${candidates.length} certificate-of-occupancy candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.",
    `- Date window: ${START_DATE} through ${END_DATE}. Accepted candidates were limited to the dataset's stated pre-DOB-NOW coverage period through ${LEGACY_PREFERRED_END_DATE}.`,
    "",
    "## Counts",
    "",
    `- Candidates retained: ${candidates.length}`,
    `- Legacy rows fetched: ${fetchedCounts.legacy_rows_fetched}`,
    `- Legacy grouped rows: ${fetchedCounts.legacy_grouped_rows}`,
    `- Duplicate/reject samples recorded: ${rejectedTotal}`,
    "",
    "## Selection",
    "",
    "- Required issued status, row-level date, in-city coordinates, source row identifiers, and DOB/NYC Open Data provenance.",
    "- Preferred final rows over temporary rows.",
    "- Retained NB/A1 rows with at least 25 source-reported dwelling units or a source-row civic/public text signal.",
    "- Grouped repeated rows by DOB job, BIN, and normalized address before selecting the best CO milestone for that group.",
    "",
    "## Duplicate Screening",
    "",
    `Screened ${duplicateIndex.files.length} files, ${duplicateIndex.tokens.size} identifier tokens, and ${duplicateIndex.sourceDateKeys.size} source-date keys, including the live manual corpus and prior DOB/CO candidate packs through round303.`,
    "",
    "## Caveats",
    "",
    "- A CO row is a legal/admin DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
    "- Dwelling-unit counts and job/CO type labels are source row values and may be corrected or superseded.",
    "- Coordinates are DOB/Open Data geocoded points, not surveyed footprints or parcel boundaries.",
    "- Keep DOB and NYC Open Data attribution with row-level Socrata URLs.",
    "",
    "## Independent Validation",
    "",
    `- Required provenance fields present: ${validation.ok}.`,
    `- Unique event IDs: ${validation.checks.unique_event_ids}.`,
    `- Unique source/date keys: ${validation.checks.unique_source_date_keys}.`,
    `- Date window valid: ${validation.errors.every((error) => !error.includes("Out-of-window"))} (${START_DATE} through ${END_DATE}).`,
    `- NYC coordinate bounds valid: ${validation.checks.nyc_coordinate_bounds_valid}.`,
    `- No exact event/source/date/source-URL/identifier overlap with the screened corpus and prior CO packs through round303: ${validation.checks.no_overlap_with_screened_corpus_and_prior_packs}.`,
    `- Status mix: ${Object.entries(summary.selected_summary.by_source_status).map(([key, count]) => `${key}=${count}`).join(", ")}.`
  ].join("\n");
}

function validationReport(validation) {
  return [
    "# Round308 NYC DOB CO Next26 Validation",
    "",
    `- Validation ok: ${validation.ok}`,
    `- Checked at: ${validation.checked_at}`,
    `- Candidate count: ${validation.checks.candidate_count}`,
    `- Date range: ${validation.checks.date_range.start} through ${validation.checks.date_range.end}`,
    `- Source mix: ${Object.entries(validation.checks.by_source_dataset_id).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Borough mix: ${Object.entries(validation.checks.by_borough).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Source date field mix: ${Object.entries(validation.checks.by_source_date_field).map(([key, count]) => `${key}=${count}`).join(", ")}`,
    `- Screened files read: ${validation.checks.screened_files_read}`,
    `- Prior source/date keys checked: ${validation.checks.prior_source_date_keys_checked}`,
    `- Prior identifier tokens checked: ${validation.checks.prior_identifier_tokens_checked}`,
    `- Manual corpus screened: ${validation.checks.manual_corpus_screened}`,
    `- Round278 screened: ${validation.checks.required_round278_screened}`,
    `- Round289 screened: ${validation.checks.required_round289_screened}`,
    `- Round300 screened: ${validation.checks.required_round300_screened}`,
    `- Round303 screened: ${validation.checks.required_round303_screened}`,
    `- No overlap with screened corpus and prior packs: ${validation.checks.no_overlap_with_screened_corpus_and_prior_packs}`,
    "",
    "The validation checks required provenance fields, the requested date window, NYC point bounds, source/date uniqueness, source URL/date uniqueness, and event/source identifier overlap against the screened manual corpus and prior NYC DOB/CO packs."
  ].join("\n");
}

function outputPath(name) {
  return path.join(OUT_DIR, name).replace(/\\/g, "/");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const duplicateIndex = buildExistingIndex();
  console.log(`Duplicate index: ${duplicateIndex.tokens.size} tokens from ${duplicateIndex.files.length} files`);

  const [metadata, legacyRows] = await Promise.all([
    fetchMetadata(),
    fetchLegacyRows()
  ]);

  const rejections = [];
  const candidatePool = [];
  const groupedLegacy = chooseBestByGroup(legacyRows, legacyGroupKey, scoreLegacy);

  for (const row of groupedLegacy) {
    const dataset = LEGACY_CO;
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

  const candidates = selectCandidates(candidatePool, TARGET_COUNT);
  const selectedSummary = summarizeCandidates(candidates);
  const rejectedCounts = rejectionCounter(rejections);
  const selectionSummary = {
    date_window: { start: START_DATE, end: END_DATE },
    legacy_preferred_end_date: LEGACY_PREFERRED_END_DATE,
    target_count: TARGET_COUNT,
    candidate_pool_before_selection: candidatePool.length,
    candidate_count: candidates.length,
    eligible_headroom_after_retained_candidates: Math.max(candidatePool.length - candidates.length, 0),
    retained_less_than_target_reason: candidates.length < TARGET_COUNT ? "Source/dedupe/high-signal filters yielded fewer nonduplicate candidates than target." : null,
    duplicate_screening: {
      files_read: duplicateIndex.files.length,
      tokens: duplicateIndex.tokens.size,
      source_date_keys: duplicateIndex.sourceDateKeys.size,
      screened_files: duplicateIndex.files,
      missing_required_files: duplicateIndex.missingFiles,
      manual_event_count: duplicateIndex.manualEventCount
    },
    fetched_counts: {
      legacy_rows_fetched: legacyRows.length,
      legacy_grouped_rows: groupedLegacy.length
    },
    rejected_counts: rejectedCounts,
    selected_summary: selectedSummary
  };

  const sourceAuditEntry = {
    ...metadata,
    reliability: "strong for issued legacy CO administrative status; usable with caveats for city-change milestones",
    coverage_years_checked: `${START_DATE} through ${END_DATE}`,
    published_coverage_note: "Dataset description says legacy CO coverage is primarily 2012-07-12 through March 2021; this pass retained legacy candidates only through 2021-03-31.",
    geographic_scope: "New York City legacy DOB certificate-of-occupancy records with address, BIN, BBL, and latitude/longitude fields when geocoded.",
    granularity: "One legacy DOB certificate-of-occupancy job/item row; repeated temporary CO rows can occur for one job and address.",
    key_fields_for_events: LEGACY_SELECT,
    source_date_fields: ["c_o_issue_date"],
    geometry_fields: ["latitude", "longitude", "location", "bbl", "bin", "bin_number"],
    accepted_candidate_count: selectedSummary.by_source_dataset_id?.[LEGACY_CO.id] || 0,
    required_caveats: [
      "Legacy CO issuance is an administrative/legal record, not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
      "Legacy coverage does not support pre-2012 CO discovery even though the requested scan window begins in 2008.",
      "For records after March 2021, DOB NOW CO is the preferred source.",
      "Temporary CO rows can recur for the same project and were grouped before candidate selection."
    ],
    ingestion_recommendation: "Append only with row-level source URL, DOB job number, item/issue type, date field, coordinates, terms note, and limitations."
  };

  const candidatesOutput = {
    schema_version: "round308.nyc_dob_co_next26_candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    worker: "Round308 NYC DOB CO next26 candidates",
    scope: "Official NYC legacy DOB Certificate Of Occupancy candidate pack. Records are legal/admin CO milestones and must not be presented as actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.",
    candidate_count: candidates.length,
    source_audits: [sourceAuditEntry],
    selection_summary: selectionSummary,
    candidates
  };

  const sourceAudit = {
    schema_version: "round308.nyc_dob_co_next26_source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Official NYC Open Data legacy DOB Certificate Of Occupancy source audit for Bims-5 candidate ingestion.",
    sources: [sourceAuditEntry],
    selection_summary: selectionSummary,
    caveat: "CO rows are legal/admin records. Do not present them as actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome."
  };

  const summary = {
    schema_version: "round308.nyc_dob_co_next26_summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    output_files: [
      outputPath("candidates.json"),
      outputPath("source_audit.json"),
      outputPath("summary.json"),
      outputPath("notes.md"),
      outputPath("rejected.json"),
      outputPath("validation.json"),
      outputPath("validation_report.md")
    ],
    candidate_count: candidates.length,
    selected_summary: selectedSummary,
    source_ids: [LEGACY_CO.sourceId, LEGACY_CO.canonicalSourceId],
    date_window: selectionSummary.date_window,
    legacy_preferred_end_date: LEGACY_PREFERRED_END_DATE,
    source_mix: selectedSummary.by_source_dataset_id,
    selection_summary: selectionSummary,
    caveats: [
      "CO issuance date is an administrative date from the DOB row.",
      "Coordinates are source geocoded points, not parcel or footprint geometry.",
      "License/terms notes are NYC Open Data / NYC.gov terms with DOB attribution; verify terms before broader redistribution."
    ],
    sample_candidates: candidates.slice(0, 12).map((candidate) => ({
      candidate_id: candidate.candidate_id,
      date: candidate.date,
      borough: candidate.borough,
      address: candidate.address,
      job_number: candidate.job_number,
      issue_type: candidate.issue_type,
      source_url: candidate.source_url
    }))
  };

  const validation = validateCandidates(candidates, duplicateIndex, summary, sourceAudit);
  summary.independent_validation = validation;
  sourceAudit.selection_summary.independent_validation = validation;
  candidatesOutput.selection_summary.independent_validation = validation;

  const rejectedOutput = {
    schema_version: "round308.nyc_dob_co_next26_rejected.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_counts: rejectedCounts,
    rejected_sample_limit: 5000,
    sample_rejections: rejections.slice(0, 5000)
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), candidatesOutput);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedOutput);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  fs.writeFileSync(
    path.join(OUT_DIR, "notes.md"),
    `${buildNotes(candidates, summary, duplicateIndex, selectionSummary.fetched_counts, rejectedCounts, validation)}\n`
  );
  fs.writeFileSync(path.join(OUT_DIR, "validation_report.md"), `${validationReport(validation)}\n`);

  if (!validation.ok) {
    const preview = validation.errors.slice(0, 20).join("\n");
    throw new Error(`Round308 validation failed with ${validation.errors.length} error(s):\n${preview}`);
  }

  console.log(JSON.stringify({
    round: "round308_nyc_dob_co_next26",
    candidate_count: candidates.length,
    date_range: selectedSummary.date_range,
    source_mix: selectedSummary.by_source_dataset_id,
    borough_mix: selectedSummary.by_borough,
    screened_files_read: duplicateIndex.files.length,
    validation_ok: validation.ok
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
