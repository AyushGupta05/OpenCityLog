const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND = 502;
const SLUG = "round502_nyc_dob_legacy_permit_next4";
const DEDUPE_BOUNDARY_ROUND = 495;
const OUT_DIR = path.join(ROOT, "tmp", "subagents", SLUG);
const START_DATE = "2008-01-01";
const END_DATE = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const GENERATED_AT = "2026-05-20T00:00:00Z";
const TARGET_COUNT = 200;
const PAGE_SIZE = 50000;

const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const SUPPLEMENTAL_EXISTING_FILES = [
  path.join(ROOT, "data-discovery", "new_york", "events_seed.json"),
  path.join(ROOT, "web", "data", "city-atlas", "cities", "nyc", "events.json")
];

const DATASETS = {
  permits: {
    dataset_id: "ipu4-2q9a",
    source_id: "nyc-dob-permit-issuance-ipu4-2q9a",
    canonical_source_id: "nyc-dob-legacy-permit-issuance",
    source_name: "NYC Open Data: DOB Permit Issuance",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Permit-Issuance/ipu4-2q9a",
    api_url: "https://data.cityofnewyork.us/resource/ipu4-2q9a.json",
    metadata_url: "https://data.cityofnewyork.us/api/views/ipu4-2q9a"
  },
  filings: {
    dataset_id: "ic3t-wcy2",
    source_id: "nyc-dob-job-application-filings-ic3t-wcy2",
    canonical_source_id: "nyc-dob-legacy-job-application-filings",
    source_name: "NYC Open Data: DOB Job Application Filings",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2",
    api_url: "https://data.cityofnewyork.us/resource/ic3t-wcy2.json",
    metadata_url: "https://data.cityofnewyork.us/api/views/ic3t-wcy2"
  }
};

const APP_FIELDS = [
  "job__",
  "doc__",
  "borough",
  "house__",
  "street_name",
  "block",
  "lot",
  "bin__",
  "job_type",
  "job_status_descrp",
  "latest_action_date",
  "building_type",
  "community___board",
  "landmarked",
  "city_owned",
  "applicant_professional_title",
  "pre__filing_date",
  "approved",
  "fully_permitted",
  "initial_cost",
  "proposed_zoning_sqft",
  "total_construction_floor_area",
  "existingno_of_stories",
  "proposed_no_of_stories",
  "existing_height",
  "proposed_height",
  "existing_dwelling_units",
  "proposed_dwelling_units",
  "existing_occupancy",
  "proposed_occupancy",
  "owner_type",
  "non_profit",
  "owner_s_business_name",
  "job_description",
  "withdrawal_flag",
  "signoff_date",
  "building_class",
  "gis_latitude",
  "gis_longitude",
  "gis_council_district",
  "gis_census_tract",
  "gis_nta_name",
  "gis_bin"
];

const PERMIT_FIELDS = [
  "borough",
  "bin__",
  "house__",
  "street_name",
  "job__",
  "job_doc___",
  "job_type",
  "self_cert",
  "block",
  "lot",
  "community_board",
  "zip_code",
  "bldg_type",
  "residential",
  "special_district_1",
  "special_district_2",
  "work_type",
  "permit_status",
  "filing_status",
  "permit_type",
  "permit_sequence__",
  "permit_subtype",
  "site_fill",
  "filing_date",
  "issuance_date",
  "expiration_date",
  "job_start_date",
  "permittee_s_business_name",
  "permittee_s_license_type",
  "owner_s_business_type",
  "non_profit",
  "owner_s_business_name",
  "dobrundate",
  "permit_si_no",
  "gis_latitude",
  "gis_longitude",
  "gis_council_district",
  "gis_census_tract",
  "gis_nta_name"
];

const OUTPUT_FILES = [
  "candidates.json",
  "source_audit.json",
  "summary.json",
  "rejected.json",
  "validation.json",
  "validation_report.json",
  "readback.json",
  "notes.md",
  "duplicate_audit.json"
];

const REQUIRED_CANDIDATE_FIELDS = [
  "city_id",
  "event_id",
  "candidate_id",
  "title",
  "summary",
  "date",
  "effective_date",
  "latitude",
  "longitude",
  "geometry",
  "source_name",
  "publisher",
  "source_url",
  "source_type",
  "license",
  "attribution",
  "accessed_at",
  "transformation_method",
  "confidence",
  "limitations",
  "source_record_id"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function toIsoDateFromEpoch(value) {
  if (!value) return null;
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function inWindow(date) {
  return Boolean(date && date >= START_DATE && date <= END_DATE);
}

function dateYear(date) {
  return String(date || "").slice(0, 4);
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 112)
    .replace(/_+$/g, "");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(value) {
  return normalizeKey(value)
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\broad\b/g, "rd")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bplace\b/g, "pl");
}

function titleCaseBorough(value) {
  const text = String(value || "").trim().toLowerCase();
  return {
    manhattan: "Manhattan",
    brooklyn: "Brooklyn",
    queens: "Queens",
    bronx: "Bronx",
    "staten island": "Staten Island"
  }[text] || String(value || "").trim();
}

function cleanAddress(parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function rowUrl(datasetId, key, value) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  url.searchParams.set(key, value);
  return url.toString();
}

function queryUrl(datasetId, params) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fetchJson(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      const waitMs = 750 * attempt * attempt;
      console.warn(`${label}: attempt ${attempt} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function fetchMetadata(datasetId) {
  return fetchJson(`https://data.cityofnewyork.us/api/views/${datasetId}.json`, `metadata ${datasetId}`);
}

async function fetchRows(datasetId, params, label, pageSize = PAGE_SIZE, maxRows = 500000) {
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const page = await fetchJson(
      queryUrl(datasetId, {
        ...params,
        $limit: String(pageSize),
        $offset: String(offset)
      }),
      `${label} offset ${offset}`
    );
    rows.push(...page);
    console.log(`${label}: fetched ${rows.length}`);
    if (page.length < pageSize) break;
  }
  return rows;
}

function addToken(set, value) {
  const text = String(value || "").trim();
  if (text) set.add(text);
}

function addLowerToken(set, value) {
  const text = String(value || "").trim().toLowerCase();
  if (text) set.add(text);
}

function extractQueryParam(urlText, key) {
  try {
    const parsed = new URL(String(urlText));
    return parsed.searchParams.get(key);
  } catch {
    return null;
  }
}

function sourceIdList(record) {
  const values = [];
  for (const key of ["source_id", "source_dataset_id", "source_name", "source_record_id"]) {
    if (record?.[key]) values.push(String(record[key]));
  }
  if (Array.isArray(record?.source_ids)) values.push(...record.source_ids.map(String));
  return values.join(" | ");
}

function looksLikeDobRecord(record, file) {
  const fileText = rel(file).toLowerCase();
  const sourceText = sourceIdList(record).toLowerCase();
  const urlText = `${record?.source_url || ""} ${record?.supporting_source_url || ""}`.toLowerCase();
  return /dob|ipu4-2q9a|ic3t-wcy2|bty7-2jhb|rbx6-tga4|w9ak-ipjd/.test(`${fileText} ${sourceText} ${urlText}`);
}

function candidateRoundNumber(file) {
  const match = rel(file).match(/(?:^|[/_\\-])round(\d+)/i);
  return match ? Number(match[1]) : null;
}

function shouldScanExistingCandidateFile(file) {
  if (!/candidates.*\.json$/i.test(path.basename(file))) return false;
  if (!/nyc|dob|permit/i.test(file)) return false;
  const roundNumber = candidateRoundNumber(file);
  return roundNumber === null || roundNumber <= DEDUPE_BOUNDARY_ROUND;
}

function scanKnownNestedIds(value, index) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) scanKnownNestedIds(item, index);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const keyLower = key.toLowerCase();
    if (keyLower === "permit_si_no") addToken(index.permitSiNos, child);
    if (keyLower === "job__" || keyLower === "job_number") addToken(index.jobNumbers, child);
    if (keyLower === "work_permit") addToken(index.dobNowPermitIds, child);
    if (keyLower === "job_filing_number") addToken(index.dobNowJobIds, child);
    if (child && typeof child === "object") scanKnownNestedIds(child, index);
  }
}

function eachPayloadRecord(payload, visitor) {
  if (Array.isArray(payload)) {
    for (const record of payload) visitor(record);
    return;
  }
  if (payload && typeof payload === "object") {
    for (const key of ["events", "candidates", "features"]) {
      const records = payload[key];
      if (!Array.isArray(records)) continue;
      for (const record of records) {
        visitor(key === "features" ? { ...record.properties, geometry: record.geometry } : record);
      }
    }
  }
}

function buildExistingIndex() {
  const index = {
    permitSiNos: new Set(),
    jobNumbers: new Set(),
    dobNowPermitIds: new Set(),
    dobNowJobIds: new Set(),
    sourceRecordIds: new Set(),
    sourceUrls: new Set(),
    sourceUrlDateKeys: new Set(),
    sourceDateKeys: new Set(),
    titleDateKeys: new Set(),
    addressDateKeys: new Set(),
    eventIds: new Set(),
    filesRead: [],
    filesSkipped: [],
    manualEventCount: 0,
    scannedDobRecordCount: 0
  };

  const scanRecord = (record, file) => {
    if (!record || typeof record !== "object") return;
    if (!looksLikeDobRecord(record, file)) return;
    index.scannedDobRecordCount += 1;
    const date = parseDate(record.date || record.effective_date || record.issue_date || record.issuance_date);
    addToken(index.eventIds, record.event_id || record.candidate_id);
    addLowerToken(index.sourceRecordIds, record.source_record_id);

    for (const urlKey of ["source_url", "supporting_source_url"]) {
      const url = String(record[urlKey] || "").trim();
      if (!url) continue;
      addLowerToken(index.sourceUrls, url);
      if (date) addLowerToken(index.sourceUrlDateKeys, `${url}|${date}`);
      if (/ipu4-2q9a/i.test(url)) addToken(index.permitSiNos, extractQueryParam(url, "permit_si_no"));
      if (/ic3t-wcy2/i.test(url)) addToken(index.jobNumbers, extractQueryParam(url, "job__"));
    }

    const sourceRecord = String(record.source_record_id || "");
    const explicitPermit = sourceRecord.match(/(?:permit_si_no|permit\s*si\s*no|ipu4-2q9a)\s*[:#]?\s*(\d{4,12})/i);
    const explicitJob = sourceRecord.match(/(?:job__|job_number|job\s*number|ic3t-wcy2)\s*[:#]?\s*(\d{7,12})/i);
    if (explicitPermit) addToken(index.permitSiNos, explicitPermit[1]);
    if (explicitJob) addToken(index.jobNumbers, explicitJob[1]);

    const rowIds = record.source_row_ids || {};
    addToken(index.permitSiNos, rowIds["ipu4-2q9a"]);
    addToken(index.jobNumbers, rowIds["ic3t-wcy2"]);
    scanKnownNestedIds(record.row_fields || record.raw_row || record.source_fields || {}, index);

    if (record.source_record_id && date) {
      addLowerToken(index.sourceDateKeys, `${record.source_record_id}|${date}`);
    }
    const permitId = explicitPermit?.[1] || rowIds["ipu4-2q9a"] || extractQueryParam(record.source_url || "", "permit_si_no");
    if (permitId && date) addLowerToken(index.sourceDateKeys, `ipu4-2q9a|${permitId}|${date}`);

    const title = normalizeKey(record.title || "");
    if (title && date) index.titleDateKeys.add(`${title}|${date}`);
    const address = normalizeAddress(record.address || record.area || record.title || "");
    if (address && date) index.addressDateKeys.add(`${address}|${date}`);
  };

  const candidateFiles = [];
  if (fs.existsSync(CORPUS_PATH)) candidateFiles.push(CORPUS_PATH);
  for (const file of SUPPLEMENTAL_EXISTING_FILES) {
    if (fs.existsSync(file)) candidateFiles.push(file);
  }

  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  const stack = [subagentsDir];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (path.resolve(full).startsWith(path.resolve(OUT_DIR))) continue;
      if (item.isDirectory()) {
        stack.push(full);
      } else if (shouldScanExistingCandidateFile(full)) {
        candidateFiles.push(full);
      }
    }
  }

  const uniqueFiles = [...new Set(candidateFiles.map((file) => path.resolve(file)))].sort();
  for (const file of uniqueFiles) {
    try {
      const payload = readJson(file);
      index.filesRead.push(rel(file));
      if (path.resolve(file) === path.resolve(CORPUS_PATH)) {
        index.manualEventCount = Array.isArray(payload.events) ? payload.events.length : 0;
      }
      eachPayloadRecord(payload, (record) => scanRecord(record, file));
    } catch (error) {
      index.filesSkipped.push({ path: rel(file), reason: error.message });
    }
  }

  return index;
}

function rejectionCollector() {
  const buckets = new Map();
  return {
    add(reason, detail = {}) {
      const bucket = buckets.get(reason) || { reason, count: 0, samples: [] };
      bucket.count += 1;
      if (bucket.samples.length < 25) bucket.samples.push(detail);
      buckets.set(reason, bucket);
    },
    addMany(reason, count, detail = {}) {
      if (!count) return;
      const bucket = buckets.get(reason) || { reason, count: 0, samples: [] };
      bucket.count += count;
      if (bucket.samples.length < 25) bucket.samples.push(detail);
      buckets.set(reason, bucket);
    },
    list() {
      return [...buckets.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
    },
    counts() {
      return Object.fromEntries([...buckets.entries()].map(([reason, bucket]) => [reason, bucket.count]).sort());
    }
  };
}

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function summarizeScale(row) {
  const units = parseNumber(row.proposed_dwelling_units);
  const zoningSqft = parseNumber(row.proposed_zoning_sqft);
  const floorArea = parseNumber(row.total_construction_floor_area);
  const cost = parseNumber(row.initial_cost);
  const height = parseNumber(row.proposed_height);
  const stories = parseNumber(row.proposed_no_of_stories);
  const publicLike = /^(Y|YES)$/i.test(row.city_owned || "") ||
    /^(Y|YES)$/i.test(row.non_profit || "") ||
    /city|nyc|school|library|hospital|authority|department|university|mta|housing preservation|hpd|suny|cuny/i.test(row.owner_s_business_name || "");

  const plausibleZoningSqft = zoningSqft > 0 && zoningSqft <= 5000000 ? zoningSqft : 0;
  const plausibleFloorArea = floorArea > 0 && floorArea <= 5000000 ? floorArea : 0;
  const plausibleHeight = height > 0 && height <= 2000 ? height : 0;
  const plausibleStories = stories > 0 && stories <= 150 ? stories : 0;
  const plausibleUnits = units > 0 && units <= 10000 ? units : 0;
  const plausibleCost = cost > 0 && cost <= 5000000000 ? cost : 0;

  let score = 0;
  if (plausibleUnits >= 50) score += 100 + Math.min(plausibleUnits, 700);
  if (plausibleFloorArea >= 50000) score += 120 + Math.min(plausibleFloorArea / 1000, 700);
  if (plausibleZoningSqft >= 50000) score += 70 + Math.min(plausibleZoningSqft / 2000, 350);
  if (plausibleHeight >= 75) score += 60 + Math.min(plausibleHeight / 3, 150);
  if (plausibleStories >= 8) score += 45 + Math.min(plausibleStories * 3, 120);
  if (plausibleCost >= 10000000) score += 60 + Math.min(plausibleCost / 1000000, 160);
  if (publicLike) score += 120;
  if (/^NB$/i.test(row.job_type || "")) score += 50;
  if (/SIGNED OFF|PERMIT ISSUED|PLAN EXAM - APPROVED/i.test(row.job_status_descrp || "")) score += 20;

  const pieces = [];
  if (plausibleUnits) pieces.push(`${plausibleUnits.toLocaleString("en-US")} proposed dwelling units`);
  if (plausibleFloorArea) pieces.push(`${Math.round(plausibleFloorArea).toLocaleString("en-US")} sq ft total construction floor area`);
  if (plausibleZoningSqft) pieces.push(`${Math.round(plausibleZoningSqft).toLocaleString("en-US")} proposed zoning sq ft`);
  if (plausibleHeight) pieces.push(`${plausibleHeight.toLocaleString("en-US")} ft proposed height`);
  if (plausibleStories) pieces.push(`${plausibleStories.toLocaleString("en-US")} proposed stories`);
  if (plausibleCost) pieces.push(`initial cost ${formatMoney(plausibleCost)}`);
  if (publicLike) pieces.push("public/nonprofit/civic owner flag or name");

  return {
    units: plausibleUnits,
    floorArea: plausibleFloorArea,
    zoningSqft: plausibleZoningSqft,
    height: plausibleHeight,
    stories: plausibleStories,
    cost: plausibleCost,
    publicLike,
    score,
    note: pieces.length ? pieces.join("; ") : "no accepted scale field",
    raw: { units, zoningSqft, floorArea, cost, height, stories }
  };
}

function highSignal(scale) {
  const publicCivicWithScale = scale.publicLike && (
    scale.units >= 10 ||
    scale.floorArea >= 10000 ||
    scale.zoningSqft >= 10000 ||
    scale.height >= 50 ||
    scale.stories >= 4 ||
    scale.cost >= 1000000
  );
  return scale.units >= 50 ||
    scale.floorArea >= 50000 ||
    scale.zoningSqft >= 50000 ||
    scale.height >= 75 ||
    scale.stories >= 8 ||
    scale.cost >= 10000000 ||
    publicCivicWithScale;
}

function appDate(row) {
  return parseDate(row.signoff_date) ||
    parseDate(row.fully_permitted) ||
    parseDate(row.approved) ||
    parseDate(row.latest_action_date) ||
    parseDate(row.pre__filing_date);
}

function choosePermitForJob(permits, appRow) {
  const expectedPermitType = /^NB$/i.test(appRow.job_type || "") ? "NB" : "AL";
  const usable = permits
    .filter((row) => String(row.permit_status || "").trim() === "ISSUED")
    .filter((row) => String(row.filing_status || "").trim() === "INITIAL")
    .filter((row) => row.permit_type === expectedPermitType || row.permit_type === "NB" || row.permit_type === "AL")
    .map((row) => ({ row, date: parseDate(row.issuance_date) }))
    .filter((item) => inWindow(item.date));

  usable.sort((a, b) => {
    const typeA = a.row.permit_type === expectedPermitType ? 0 : 1;
    const typeB = b.row.permit_type === expectedPermitType ? 0 : 1;
    return typeA - typeB ||
      a.date.localeCompare(b.date) ||
      String(a.row.permit_sequence__ || "").localeCompare(String(b.row.permit_sequence__ || "")) ||
      String(a.row.permit_si_no || "").localeCompare(String(b.row.permit_si_no || ""));
  });
  return usable[0] || null;
}

function canonicalSourceDateKey(candidate) {
  const permitId = candidate.source_row_ids?.["ipu4-2q9a"] || "";
  return `${DATASETS.permits.dataset_id}|${permitId}|${candidate.date}`.toLowerCase();
}

function sourceUrlDateKey(candidate) {
  return `${candidate.source_url}|${candidate.date}`.toLowerCase();
}

function titleDateKey(candidate) {
  return `${normalizeKey(candidate.title || "")}|${candidate.date}`;
}

function addressDateKey(candidate) {
  return `${normalizeAddress(`${candidate.address || ""} ${candidate.borough || ""}`)}|${candidate.date}`;
}

function makeCandidate(appRow, permitRow, permitDate, scale) {
  const permitDataset = DATASETS.permits;
  const filingDataset = DATASETS.filings;
  const borough = titleCaseBorough(permitRow.borough || appRow.borough);
  const address = cleanAddress([permitRow.house__ || appRow.house__, permitRow.street_name || appRow.street_name]);
  const latitude = parseNumber(permitRow.gis_latitude) || parseNumber(appRow.gis_latitude);
  const longitude = parseNumber(permitRow.gis_longitude) || parseNumber(appRow.gis_longitude);
  const permitId = String(permitRow.permit_si_no || "").trim();
  const jobNumber = String(permitRow.job__ || appRow.job__ || "").trim();
  const dateSlug = permitDate.replace(/-/g, "_");
  const candidateId = `nyc_arch_dob_legacy_permit_${slugify(permitId)}_${dateSlug}`;
  const isNewBuilding = permitRow.permit_type === "NB" || appRow.job_type === "NB";
  const titleVerb = isNewBuilding ? "new-building permit issued" : "major-alteration permit issued";
  const projectType = isNewBuilding ? "administrative_dob_new_building_permit" : "administrative_dob_major_alteration_permit";
  const sourceUrl = rowUrl(permitDataset.dataset_id, "permit_si_no", permitId);
  const supportingSourceUrl = rowUrl(filingDataset.dataset_id, "job__", jobNumber);
  const appContextDate = appDate(appRow);
  const dateContext = appContextDate ? ` The linked job-application row has application/status date context ${appContextDate}.` : "";
  const cleanAppRow = { ...appRow };
  delete cleanAppRow._scale;
  const permitLabel = permitRow.permit_type || "permit";

  return {
    city_id: "nyc",
    candidate_id: candidateId,
    event_id: candidateId,
    title: `DOB ${titleVerb} for ${address}`,
    summary: `${permitDataset.publisher} records an initial ${permitLabel} permit issuance on ${permitDate} for legacy job ${jobNumber} at ${address}, ${borough}. The linked DOB Job Application Filings row reports ${scale.note} as source-reported application context.${dateContext}`,
    observed_change: `NYC DOB recorded issuance of an initial ${permitLabel} permit for the cited legacy ${appRow.job_type || permitRow.job_type || "DOB"} job.`,
    date: permitDate,
    effective_date: permitDate,
    date_precision: "day",
    source_id: permitDataset.source_id,
    source_ids: [permitDataset.source_id, filingDataset.source_id],
    source_dataset_id: permitDataset.dataset_id,
    source_name: permitDataset.source_name,
    publisher: permitDataset.publisher,
    source_url: sourceUrl,
    source_api_url: permitDataset.api_url,
    supporting_source_name: filingDataset.source_name,
    supporting_source_url: supportingSourceUrl,
    supporting_source_api_url: filingDataset.api_url,
    source_record_id: `ipu4-2q9a permit_si_no ${permitId}`,
    supporting_source_record_id: `ic3t-wcy2 job__ ${jobNumber}`,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    source_date_field: "issuance_date from DOB Permit Issuance",
    latitude,
    longitude,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    geometry_source: "DOB Permit Issuance GIS latitude/longitude geocoded address point, with DOB Job Application Filings GIS point retained for context.",
    geometry_precision: "official geocoded building/address point; not a surveyed lot boundary, building footprint, or work-area polygon",
    confidence: "documented",
    project_type: projectType,
    permit_milestone_type: "administrative_dob_permit_issuance",
    permit_status: permitRow.permit_status || null,
    filing_status: permitRow.filing_status || null,
    permit_type: permitRow.permit_type || null,
    job_type: permitRow.job_type || appRow.job_type || null,
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use",
    license_url: "https://opendata.cityofnewyork.us/overview/#termsofuse",
    license_or_terms_note: "NYC Open Data / NYC.gov terms. Keep NYC Department of Buildings and NYC Open Data attribution and re-check dataset-specific metadata before bulk redistribution.",
    attribution: "NYC Department of Buildings (DOB), via NYC Open Data",
    limitations: "This is an administrative permit-issuance record. It is not evidence of construction start, construction completion, opening, legal occupancy, actual occupancy, design quality, safety condition, affordability, neighborhood outcome, or causal effect. Linked job-application scale fields are source-reported proposed/application attributes and may be amended; legacy DOB rows can contain data-entry anomalies, so extreme scale values were screened and raw fields are retained for review.",
    transformation_method: "scripts/fetch_round502_nyc_dob_legacy_permit_next4_candidates.js queried official NYC Open Data DOB Job Application Filings high-signal rows, joined them by legacy job number to official DOB Permit Issuance rows, retained initial issued NB/AL permits within 2008-01-01 through 2026-05-20, and screened against the manual corpus plus prior NYC DOB/DOB legacy candidate packs through Round495 by permit SI number, job number, source/date key, source URL, title/date key, and address/date key.",
    address,
    area: `${address}, ${borough}, New York City`,
    borough,
    source_row_ref: `ipu4-2q9a permit_si_no ${permitId}; ic3t-wcy2 job__ ${jobNumber}`,
    source_row_ids: {
      "ipu4-2q9a": permitId,
      "ic3t-wcy2": jobNumber
    },
    canonical_source_date_key: `${permitDataset.dataset_id}|${permitId}|${permitDate}`,
    scale_context: {
      note: scale.note,
      proposed_dwelling_units: scale.units || null,
      total_construction_floor_area: scale.floorArea || null,
      proposed_zoning_sqft: scale.zoningSqft || null,
      proposed_height: scale.height || null,
      proposed_no_of_stories: scale.stories || null,
      initial_cost: scale.cost || null,
      public_or_civic_owner_flag: scale.publicLike
    },
    source_fields: {
      permit_si_no: permitId,
      job__: jobNumber,
      issuance_date: permitRow.issuance_date || null,
      permit_status: permitRow.permit_status || null,
      filing_status: permitRow.filing_status || null,
      permit_type: permitRow.permit_type || null,
      job_type: permitRow.job_type || appRow.job_type || null,
      gis_latitude: permitRow.gis_latitude || null,
      gis_longitude: permitRow.gis_longitude || null,
      supporting_job_status_descrp: appRow.job_status_descrp || null,
      supporting_latest_action_date: appRow.latest_action_date || null
    },
    row_fields: {
      permit_issuance: permitRow,
      job_application: cleanAppRow
    }
  };
}

function selectSpread(candidates, maxCount) {
  const sorted = [...candidates].sort((a, b) =>
    (b._score || 0) - (a._score || 0) ||
    a.date.localeCompare(b.date) ||
    a.borough.localeCompare(b.borough) ||
    a.candidate_id.localeCompare(b.candidate_id)
  );
  const selected = [];
  const selectedIds = new Set();
  const yearCounts = new Map();
  const boroughCounts = new Map();
  const yearBoroughCounts = new Map();
  const yearCap = Math.max(8, Math.ceil(maxCount / 18) + 4);
  const boroughCap = Math.ceil(maxCount / 5) + 12;

  const take = (candidate) => {
    selected.push(candidate);
    selectedIds.add(candidate.candidate_id);
    yearCounts.set(dateYear(candidate.date), (yearCounts.get(dateYear(candidate.date)) || 0) + 1);
    boroughCounts.set(candidate.borough, (boroughCounts.get(candidate.borough) || 0) + 1);
    const yb = `${dateYear(candidate.date)}|${candidate.borough}`;
    yearBoroughCounts.set(yb, (yearBoroughCounts.get(yb) || 0) + 1);
  };

  for (const candidate of sorted) {
    if (selected.length >= maxCount) break;
    const year = dateYear(candidate.date);
    const yb = `${year}|${candidate.borough}`;
    if ((yearCounts.get(year) || 0) >= yearCap) continue;
    if ((boroughCounts.get(candidate.borough) || 0) >= boroughCap) continue;
    if ((yearBoroughCounts.get(yb) || 0) >= 5) continue;
    take(candidate);
  }

  for (const candidate of sorted) {
    if (selected.length >= maxCount) break;
    if (!selectedIds.has(candidate.candidate_id)) take(candidate);
  }

  return selected.map((candidate) => {
    const copy = { ...candidate };
    delete copy._score;
    return copy;
  });
}

function summarizeCandidates(candidates) {
  const byYear = {};
  const byBorough = {};
  const byPermitType = {};
  const byProjectType = {};
  const bySourceDateField = {};
  let minDate = null;
  let maxDate = null;
  for (const candidate of candidates) {
    const year = dateYear(candidate.date);
    byYear[year] = (byYear[year] || 0) + 1;
    byBorough[candidate.borough] = (byBorough[candidate.borough] || 0) + 1;
    byPermitType[candidate.permit_type || "unknown"] = (byPermitType[candidate.permit_type || "unknown"] || 0) + 1;
    byProjectType[candidate.project_type] = (byProjectType[candidate.project_type] || 0) + 1;
    bySourceDateField[candidate.source_date_field] = (bySourceDateField[candidate.source_date_field] || 0) + 1;
    if (!minDate || candidate.date < minDate) minDate = candidate.date;
    if (!maxDate || candidate.date > maxDate) maxDate = candidate.date;
  }
  return {
    by_year: byYear,
    by_borough: byBorough,
    by_permit_type: byPermitType,
    by_project_type: byProjectType,
    by_source_date_field: bySourceDateField,
    date_range: candidates.length ? { start: minDate, end: maxDate } : null
  };
}

function sourceAuditFromMetadata(dataset, metadata, extras) {
  return {
    source_id: dataset.source_id,
    canonical_source_id: dataset.canonical_source_id,
    dataset_id: dataset.dataset_id,
    source_name: dataset.source_name,
    publisher: dataset.publisher,
    source_url: dataset.page_url,
    api_endpoint: dataset.api_url,
    metadata_url: dataset.metadata_url,
    source_type: "official NYC Open Data Socrata dataset",
    description: metadata?.description || null,
    attribution: metadata?.attribution || dataset.publisher,
    provenance: metadata?.provenance || "official",
    rows_updated_at_utc: toIsoDateFromEpoch(metadata?.rowsUpdatedAt),
    publication_date_utc: toIsoDateFromEpoch(metadata?.publicationDate),
    view_last_modified_utc: toIsoDateFromEpoch(metadata?.viewLastModified),
    update_frequency: extras.update_frequency,
    license: "No dataset-specific license field exposed in Socrata metadata checked during this run; NYC Open Data Terms of Use / NYC.gov Terms of Use apply.",
    license_url: "https://opendata.cityofnewyork.us/overview/#termsofuse",
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    method: extras.method,
    transformation_method: extras.method,
    limitations: extras.limitations,
    reliability: extras.reliability,
    coverage_years_checked: `${START_DATE} through ${END_DATE}`,
    published_coverage_note: extras.published_coverage_note,
    geographic_scope: extras.geographic_scope,
    granularity: extras.granularity,
    key_fields_for_events: extras.key_fields_for_events,
    source_date_fields: extras.source_date_fields,
    geometry_fields: extras.geometry_fields,
    accepted_candidate_count: extras.accepted_candidate_count,
    required_caveats: extras.required_caveats,
    ingestion_recommendation: extras.ingestion_recommendation
  };
}

function validateCandidates(candidates, duplicateIndex, sourceAudits, summaryCandidateCount) {
  const errors = [];
  const eventIds = new Set();
  const candidateIds = new Set();
  const sourceRecordIds = new Set();
  const permitIds = new Set();
  const jobNumbers = new Set();
  const canonicalSourceDateKeys = new Set();
  const sourceUrlDateKeys = new Set();
  const titleDateKeys = new Set();
  const addressDateKeys = new Set();
  const overclaimRegex = /\b(predicted?|forecast|simulation|caused|causes|impact score|will increase|will decrease|construction started|started construction|construction completed|completed construction|opened|actual occupancy|occupied)\b/i;

  if (summaryCandidateCount !== candidates.length) {
    errors.push(`Summary candidate_count ${summaryCandidateCount} does not match candidates length ${candidates.length}.`);
  }

  for (const candidate of candidates) {
    const label = candidate.event_id || candidate.candidate_id || candidate.source_record_id || "unknown";
    for (const field of REQUIRED_CANDIDATE_FIELDS) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${label} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`${label} has non-nyc city_id`);
    if (candidate.date !== candidate.effective_date) errors.push(`${label} date/effective_date mismatch`);
    if (!inWindow(candidate.date)) errors.push(`${label} date outside window: ${candidate.date}`);
    if (!isNycPoint(candidate.latitude, candidate.longitude)) errors.push(`${label} missing/outside NYC point`);
    if (candidate.geometry?.type !== "Point") errors.push(`${label} geometry is not Point`);
    if (candidate.geometry?.coordinates?.[0] !== candidate.longitude || candidate.geometry?.coordinates?.[1] !== candidate.latitude) {
      errors.push(`${label} geometry coordinates do not match longitude/latitude`);
    }
    const textForOverclaim = `${candidate.title || ""} ${candidate.summary || ""} ${candidate.observed_change || ""}`;
    if (overclaimRegex.test(textForOverclaim)) errors.push(`${label} contains prohibited overclaim wording`);
    if (!/permit issuance|permit issued|recorded issuance/i.test(textForOverclaim)) errors.push(`${label} does not use administrative permit wording`);

    if (eventIds.has(candidate.event_id)) errors.push(`Duplicate event_id in pack: ${candidate.event_id}`);
    eventIds.add(candidate.event_id);
    if (candidateIds.has(candidate.candidate_id)) errors.push(`Duplicate candidate_id in pack: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    addLowerToken(sourceRecordIds, candidate.source_record_id);

    const permitId = candidate.source_row_ids?.["ipu4-2q9a"];
    const jobNumber = candidate.source_row_ids?.["ic3t-wcy2"];
    if (!permitId) errors.push(`${label} missing source_row_ids ipu4-2q9a permit id`);
    if (!jobNumber) errors.push(`${label} missing supporting ic3t-wcy2 job id`);
    if (permitIds.has(permitId)) errors.push(`Duplicate permit_si_no in pack: ${permitId}`);
    permitIds.add(permitId);
    if (jobNumbers.has(jobNumber)) errors.push(`Duplicate DOB job number in pack: ${jobNumber}`);
    jobNumbers.add(jobNumber);

    const canonicalKey = canonicalSourceDateKey(candidate);
    const urlDateKey = sourceUrlDateKey(candidate);
    const candidateTitleDateKey = titleDateKey(candidate);
    const candidateAddressDateKey = addressDateKey(candidate);
    for (const [name, value, set] of [
      ["canonical source/date", canonicalKey, canonicalSourceDateKeys],
      ["source URL/date", urlDateKey, sourceUrlDateKeys],
      ["title/date", candidateTitleDateKey, titleDateKeys],
      ["address/date", candidateAddressDateKey, addressDateKeys]
    ]) {
      if (set.has(value)) errors.push(`Duplicate ${name} key in pack: ${value}`);
      set.add(value);
    }

    if (duplicateIndex.eventIds.has(candidate.event_id)) errors.push(`Existing event_id overlap for ${label}`);
    if (duplicateIndex.permitSiNos.has(String(permitId))) errors.push(`Existing permit_si_no overlap for ${label}: ${permitId}`);
    if (duplicateIndex.jobNumbers.has(String(jobNumber))) errors.push(`Existing job__ overlap for ${label}: ${jobNumber}`);
    if (duplicateIndex.sourceUrls.has(String(candidate.source_url || "").toLowerCase())) errors.push(`Existing source_url overlap for ${label}`);
    if (duplicateIndex.sourceRecordIds.has(String(candidate.source_record_id || "").toLowerCase())) errors.push(`Existing source_record_id overlap for ${label}`);
    if (duplicateIndex.sourceDateKeys.has(canonicalKey)) errors.push(`Existing canonical source/date overlap for ${label}: ${canonicalKey}`);
    if (duplicateIndex.sourceUrlDateKeys.has(urlDateKey)) errors.push(`Existing source URL/date overlap for ${label}: ${urlDateKey}`);
    if (duplicateIndex.titleDateKeys.has(candidateTitleDateKey)) errors.push(`Existing title/date overlap for ${label}: ${candidateTitleDateKey}`);
    if (duplicateIndex.addressDateKeys.has(candidateAddressDateKey)) errors.push(`Existing address/date overlap for ${label}: ${candidateAddressDateKey}`);
  }

  return {
    schema_version: `${SLUG}_validation.v1`,
    ok: errors.length === 0,
    passed: errors.length === 0,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: "scripts/fetch_round502_nyc_dob_legacy_permit_next4_candidates.js standalone validation artifact",
    errors,
    checks: {
      candidate_count: candidates.length,
      summary_candidate_count: summaryCandidateCount,
      required_provenance_fields: REQUIRED_CANDIDATE_FIELDS,
      date_window: { start: START_DATE, end: END_DATE },
      dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND,
      date_range: summarizeCandidates(candidates).date_range,
      unique_event_ids: eventIds.size,
      unique_candidate_ids: candidateIds.size,
      unique_source_record_ids: sourceRecordIds.size,
      unique_permit_si_nos: permitIds.size,
      unique_job_numbers: jobNumbers.size,
      unique_canonical_source_date_keys: canonicalSourceDateKeys.size,
      unique_source_url_date_keys: sourceUrlDateKeys.size,
      unique_title_date_keys: titleDateKeys.size,
      unique_address_date_keys: addressDateKeys.size,
      nyc_coordinate_bounds_valid: candidates.every((candidate) => isNycPoint(candidate.latitude, candidate.longitude)),
      manual_corpus_screened: duplicateIndex.filesRead.includes(rel(CORPUS_PATH)),
      screened_files_count: duplicateIndex.filesRead.length,
      screened_files_skipped: duplicateIndex.filesSkipped,
      prior_identifier_tokens_checked: duplicateIndex.permitSiNos.size + duplicateIndex.jobNumbers.size + duplicateIndex.sourceRecordIds.size,
      prior_permit_si_nos_checked: duplicateIndex.permitSiNos.size,
      prior_job_numbers_checked: duplicateIndex.jobNumbers.size,
      prior_source_date_keys_checked: duplicateIndex.sourceDateKeys.size,
      prior_title_date_keys_checked: duplicateIndex.titleDateKeys.size,
      prior_address_date_keys_checked: duplicateIndex.addressDateKeys.size,
      no_overlap_with_screened_corpus_and_prior_packs: errors.every((error) => !/Existing .* overlap/.test(error)),
      source_audit_count: sourceAudits.length,
      source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids || []))].sort(),
      selected_summary: summarizeCandidates(candidates)
    }
  };
}

function duplicateAudit(candidates, duplicateIndex, validation) {
  return {
    schema_version: `${SLUG}_duplicate_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Round502 duplicate audit for NYC DOB Permit Issuance legacy permit next4 candidates, treating Round495 as the latest DOB legacy permit boundary.",
    dedupe_boundary: {
      latest_round_scanned: DEDUPE_BOUNDARY_ROUND,
      manual_corpus: rel(CORPUS_PATH),
      supplemental_existing_files: SUPPLEMENTAL_EXISTING_FILES.filter(fs.existsSync).map(rel),
      tmp_candidate_files_scanned: duplicateIndex.filesRead.filter((file) => file.startsWith("tmp/subagents/")),
      files_read_count: duplicateIndex.filesRead.length,
      files_skipped: duplicateIndex.filesSkipped
    },
    existing_index_counts: {
      manual_event_count: duplicateIndex.manualEventCount,
      scanned_dob_records: duplicateIndex.scannedDobRecordCount,
      permit_si_nos: duplicateIndex.permitSiNos.size,
      job_numbers: duplicateIndex.jobNumbers.size,
      source_record_ids: duplicateIndex.sourceRecordIds.size,
      source_urls: duplicateIndex.sourceUrls.size,
      source_date_keys: duplicateIndex.sourceDateKeys.size,
      source_url_date_keys: duplicateIndex.sourceUrlDateKeys.size,
      title_date_keys: duplicateIndex.titleDateKeys.size,
      address_date_keys: duplicateIndex.addressDateKeys.size,
      event_ids: duplicateIndex.eventIds.size
    },
    selected_candidate_count: candidates.length,
    selected_unique_counts: {
      event_ids: new Set(candidates.map((candidate) => candidate.event_id)).size,
      candidate_ids: new Set(candidates.map((candidate) => candidate.candidate_id)).size,
      permit_si_nos: new Set(candidates.map((candidate) => candidate.source_row_ids?.["ipu4-2q9a"])).size,
      job_numbers: new Set(candidates.map((candidate) => candidate.source_row_ids?.["ic3t-wcy2"])).size,
      source_record_ids: new Set(candidates.map((candidate) => candidate.source_record_id)).size,
      canonical_source_date_keys: new Set(candidates.map(canonicalSourceDateKey)).size,
      source_url_date_keys: new Set(candidates.map(sourceUrlDateKey)).size,
      title_date_keys: new Set(candidates.map(titleDateKey)).size,
      address_date_keys: new Set(candidates.map(addressDateKey)).size
    },
    selected_source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    selected_permit_si_nos: candidates.map((candidate) => candidate.source_row_ids?.["ipu4-2q9a"]).sort(),
    validation_overlap_checks: {
      validation_passed: validation.ok === true,
      validation_error_count: validation.errors.length,
      no_overlap_with_screened_corpus_and_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs
    },
    passed: validation.ok === true && validation.checks.no_overlap_with_screened_corpus_and_prior_packs === true
  };
}

function buildReadback(summary, validation) {
  const fileChecks = OUTPUT_FILES.map((name) => {
    const file = path.join(OUT_DIR, name);
    const check = {
      path: rel(file),
      exists: fs.existsSync(file),
      parse_ok: null,
      size_bytes: fs.existsSync(file) ? fs.statSync(file).size : 0
    };
    if (name.endsWith(".json") && check.exists) {
      try {
        readJson(file);
        check.parse_ok = true;
      } catch {
        check.parse_ok = false;
      }
    }
    return check;
  });
  const allExpectedFilesPresent = fileChecks.every((check) => check.exists);
  const jsonFilesParse = fileChecks.every((check) => check.parse_ok !== false);
  const candidatesPayload = readJson(path.join(OUT_DIR, "candidates.json"));
  const duplicateAuditPayload = readJson(path.join(OUT_DIR, "duplicate_audit.json"));
  const candidates = candidatesPayload.candidates || [];
  return {
    schema_version: `${SLUG}_readback.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    readback_at: GENERATED_AT,
    ok: allExpectedFilesPresent && jsonFilesParse && validation.ok === true && duplicateAuditPayload.passed === true,
    candidate_count: candidates.length,
    date_range: summary.selected_summary.date_range,
    source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids || []))].sort(),
    source_record_id_sample: candidates.slice(0, 10).map((candidate) => candidate.source_record_id),
    source_url_sample: candidates.slice(0, 5).map((candidate) => candidate.source_url),
    checks: {
      all_expected_files_present: allExpectedFilesPresent,
      json_files_parse: jsonFilesParse,
      candidate_count_matches: candidates.length === summary.candidate_count,
      candidate_count_within_target: candidates.length <= TARGET_COUNT,
      validation_ok: validation.ok === true,
      no_validation_errors: validation.errors.length === 0,
      source_dataset_only_ipu4_2q9a: candidates.every((candidate) => candidate.source_dataset_id === DATASETS.permits.dataset_id),
      accessed_at_2026_05_20: candidates.every((candidate) => candidate.accessed_at === ACCESSED_AT),
      no_overlap_with_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs === true,
      source_audit_present: fileChecks.some((check) => check.path.endsWith("source_audit.json") && check.exists),
      rejected_report_present: fileChecks.some((check) => check.path.endsWith("rejected.json") && check.exists),
      duplicate_audit_present: fileChecks.some((check) => check.path.endsWith("duplicate_audit.json") && check.exists),
      no_candidate_overclaim_terms: validation.errors.every((error) => !/overclaim/.test(error)),
      retrieved_at_present: candidates.every((candidate) => candidate.retrieved_at === ACCESSED_AT),
      no_duplicate_permit_ids: validation.checks.unique_permit_si_nos === candidates.length,
      no_duplicate_job_numbers: validation.checks.unique_job_numbers === candidates.length
    },
    file_checks: fileChecks,
    validation_error_count: validation.errors.length,
    duplicate_audit: rel(path.join(OUT_DIR, "duplicate_audit.json")),
    caveats: [
      "Readback confirms this pack contains administrative DOB permit issuance records only.",
      "The pack does not infer construction start, completion, opening, actual occupancy, outcomes, impacts, or causation."
    ],
    retrieved_at: ACCESSED_AT
  };
}

function buildNotes(summary, sourceAudits) {
  const selectedSummary = summary.selected_summary;
  const lines = [
    "# Round502 NYC DOB legacy permit next4",
    "",
    `Accessed: ${ACCESSED_AT}`,
    "",
    "## Scope",
    "",
    "This pack uses official NYC Open Data DOB Permit Issuance (`ipu4-2q9a`) rows from 2008-01-01 through 2026-05-20, with DOB Job Application Filings (`ic3t-wcy2`) used only as linked scale/status context.",
    "",
    "The records are administrative permit issuance milestones. They are not construction-start, construction-completion, opening, occupancy, outcome, or causation evidence.",
    "",
    "## Method",
    "",
    "- Queried high-signal legacy DOB Job Application Filings rows with official GIS coordinates.",
    "- Queried official DOB Permit Issuance rows for initial issued NB/AL permits with source GIS coordinates.",
    "- Joined by legacy DOB job number and retained one permit row per non-duplicate job.",
    "- Screened against the manual architecture milestone corpus, NYC generated events, and prior NYC DOB/DOB legacy candidate packs by permit SI number, job number, source URL, source/date, title/date, and address/date.",
    "- Selected up to 200 candidates with score, year, and borough spread.",
    "",
    "## Outputs",
    "",
    ...OUTPUT_FILES.map((name) => `- ${name}`),
    "",
    "## Selected counts",
    "",
    `- Candidates: ${summary.candidate_count}`,
    `- Date range: ${selectedSummary.date_range ? `${selectedSummary.date_range.start} to ${selectedSummary.date_range.end}` : "none"}`,
    `- Source audit rows: ${sourceAudits.length}`,
    "",
    "## By borough",
    "",
    ...Object.entries(selectedSummary.by_borough).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## By year",
    "",
    ...Object.entries(selectedSummary.by_year).sort((a, b) => a[0].localeCompare(b[0])).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Caveats",
    "",
    "- Permit issuance is an administrative DOB milestone and must not be displayed as construction start, completion, opening, occupancy, design quality, safety condition, affordability, or neighborhood outcome.",
    "- Coordinates are DOB/Open Data geocoded points, not surveyed footprints, parcels, entrances, or work limits.",
    "- Linked job-application scale fields are proposed/source-reported context and can be amended or corrected.",
    "- NYC Open Data / NYC.gov terms and DOB attribution remain attached to every candidate."
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  ensureDir(OUT_DIR);
  const rejected = rejectionCollector();
  const duplicateIndex = buildExistingIndex();

  const metadata = {
    [DATASETS.permits.dataset_id]: await fetchMetadata(DATASETS.permits.dataset_id),
    [DATASETS.filings.dataset_id]: await fetchMetadata(DATASETS.filings.dataset_id)
  };

  const highScaleApps = await fetchRows(DATASETS.filings.dataset_id, {
    $select: APP_FIELDS.join(","),
    $where: "doc__='01' AND proposed_zoning_sqft > 50000 AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL"
  }, "high-scale DOB Job Application Filings");

  const civicApps = await fetchRows(DATASETS.filings.dataset_id, {
    $select: APP_FIELDS.join(","),
    $where: "doc__='01' AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL AND (city_owned='Y' OR non_profit='Y')"
  }, "civic/nonprofit DOB Job Application Filings", PAGE_SIZE, 150000);

  const appByJob = new Map();
  for (const row of [...highScaleApps, ...civicApps]) {
    const job = String(row.job__ || "").trim();
    if (!job) {
      rejected.add("missing_job_number", { dataset: DATASETS.filings.dataset_id });
      continue;
    }
    if (duplicateIndex.jobNumbers.has(job)) {
      rejected.add("existing_job_number_overlap", { job_number: job });
      continue;
    }
    if (/^(1|Y|YES|TRUE|T|WITHDRAWN)$/i.test(String(row.withdrawal_flag || "").trim())) {
      rejected.add("withdrawn_job_application", { job_number: job, withdrawal_flag: row.withdrawal_flag });
      continue;
    }
    const lat = parseNumber(row.gis_latitude);
    const lon = parseNumber(row.gis_longitude);
    if (!isNycPoint(lat, lon)) {
      rejected.add("job_application_missing_or_outside_nyc_coordinates", { job_number: job, latitude: row.gis_latitude, longitude: row.gis_longitude });
      continue;
    }
    const scale = summarizeScale(row);
    if (!highSignal(scale) || scale.score <= 0) {
      rejected.add("job_application_below_high_signal_threshold", { job_number: job, scale_note: scale.note });
      continue;
    }
    const existingRow = appByJob.get(job);
    if (!existingRow || scale.score > existingRow._scale.score) {
      row._scale = scale;
      appByJob.set(job, row);
    }
  }

  console.log(`job applications after duplicate/high-signal screening: ${appByJob.size}`);

  const permitRows = await fetchRows(DATASETS.permits.dataset_id, {
    $select: PERMIT_FIELDS.join(","),
    $where: "permit_status='ISSUED' AND filing_status='INITIAL' AND permit_type in('NB','AL') AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL",
    $order: "issuance_date, permit_si_no"
  }, "DOB Permit Issuance initial issued NB/AL rows", PAGE_SIZE, 500000);

  const permitsByJob = new Map();
  for (const permit of permitRows) {
    const job = String(permit.job__ || "").trim();
    if (!job || !appByJob.has(job)) continue;
    if (!permitsByJob.has(job)) permitsByJob.set(job, []);
    permitsByJob.get(job).push(permit);
  }

  const pool = [];
  for (const [job, appRow] of appByJob) {
    const permitChoice = choosePermitForJob(permitsByJob.get(job) || [], appRow);
    if (!permitChoice) {
      rejected.add("no_initial_issued_nb_or_al_permit_in_window", { job_number: job, job_type: appRow.job_type });
      continue;
    }
    const permit = permitChoice.row;
    const permitId = String(permit.permit_si_no || "").trim();
    if (!permitId) {
      rejected.add("missing_permit_si_no", { job_number: job });
      continue;
    }
    if (duplicateIndex.permitSiNos.has(permitId)) {
      rejected.add("existing_permit_si_no_overlap", { permit_si_no: permitId, job_number: job });
      continue;
    }
    const lat = parseNumber(permit.gis_latitude) || parseNumber(appRow.gis_latitude);
    const lon = parseNumber(permit.gis_longitude) || parseNumber(appRow.gis_longitude);
    if (!isNycPoint(lat, lon)) {
      rejected.add("permit_missing_or_outside_nyc_coordinates", { permit_si_no: permitId, job_number: job });
      continue;
    }
    const candidate = makeCandidate(appRow, permit, permitChoice.date, appRow._scale);
    if (duplicateIndex.sourceUrls.has(candidate.source_url.toLowerCase())) {
      rejected.add("existing_source_url_overlap", { source_url: candidate.source_url, job_number: job });
      continue;
    }
    if (duplicateIndex.sourceDateKeys.has(canonicalSourceDateKey(candidate))) {
      rejected.add("existing_canonical_source_date_overlap", { canonical_source_date_key: canonicalSourceDateKey(candidate) });
      continue;
    }
    if (duplicateIndex.titleDateKeys.has(titleDateKey(candidate))) {
      rejected.add("existing_title_date_overlap", { title_date_key: titleDateKey(candidate) });
      continue;
    }
    if (duplicateIndex.addressDateKeys.has(addressDateKey(candidate))) {
      rejected.add("existing_address_date_overlap", { address_date_key: addressDateKey(candidate) });
      continue;
    }
    candidate._score = appRow._scale.score;
    pool.push(candidate);
  }

  const selected = selectSpread(pool, TARGET_COUNT);
  const selectedIds = new Set(selected.map((candidate) => candidate.candidate_id));
  rejected.addMany("eligible_not_selected_due_to_target_cap", pool.length - selected.length, {
    eligible_pool_after_duplicate_screening: pool.length,
    target_count: TARGET_COUNT
  });

  const selectedSummary = summarizeCandidates(selected);
  const sourceAudits = [
    sourceAuditFromMetadata(DATASETS.permits, metadata[DATASETS.permits.dataset_id], {
      update_frequency: "Operational NYC Open Data dataset; metadata timestamp retained in this audit.",
      method: "Round502 queried official NYC Open Data DOB Permit Issuance rows and retained initial issued NB/AL permit rows joined to high-signal legacy DOB job application rows, with duplicate screening against the manual corpus and prior DOB/DOB legacy packs through Round495.",
      limitations: "A permit issuance is an administrative event, not evidence of construction start, completion, opening, occupancy, design quality, safety condition, affordability, neighborhood outcome, or causal effect. Coordinates are geocoded address/building points.",
      reliability: "strong for administrative permit issuance; usable with caveats for city-change atlas milestones",
      published_coverage_note: "NYC Open Data metadata describes DOB Permit Issuance as BIS permits; most current permits are now issued in DOB NOW, so this pass treats it as legacy/BIS coverage.",
      geographic_scope: "New York City DOB BIS permit rows with borough/address, BIN, block/lot, community board, council district, census tract, NTA, and GIS latitude/longitude fields when geocoded.",
      granularity: "One DOB permit life-cycle row for one work type; repeated permits can occur for the same legacy DOB job.",
      key_fields_for_events: ["permit_si_no", "job__", "issuance_date", "permit_status", "filing_status", "permit_type", "job_type", "borough", "house__", "street_name", "gis_latitude", "gis_longitude"],
      source_date_fields: ["issuance_date"],
      geometry_fields: ["gis_latitude", "gis_longitude", "bin__", "block", "lot"],
      accepted_candidate_count: selected.length,
      required_caveats: [
        "Permit issuance is administrative only and is not evidence of construction start, construction completion, public opening, legal occupancy, actual occupancy, design quality, safety condition, affordability, outcome, or causation.",
        "Coordinates are DOB/Open Data geocoded points, not surveyed parcels, footprints, entrances, or work limits.",
        "BIS/legacy records can be updated or corrected after the access date."
      ],
      ingestion_recommendation: "Append only with permit_si_no row URL, issuance_date, point geometry, DOB attribution, terms note, and explicit administrative-only limitations."
    }),
    sourceAuditFromMetadata(DATASETS.filings, metadata[DATASETS.filings.dataset_id], {
      update_frequency: "Operational/legacy NYC Open Data dataset; metadata timestamp retained in this audit.",
      method: "Round502 used DOB Job Application Filings only as supporting context for selected DOB Permit Issuance rows, joining by legacy job number and retaining source-reported scale/status fields.",
      limitations: "Application fields are proposed/source-reported and may be amended; legacy fields can include inconsistent or extreme values. The job filing row is not itself used as construction, completion, opening, or occupancy evidence.",
      reliability: "usable with caveats as linked administrative scale/status context",
      published_coverage_note: "Dataset metadata describes legacy DOB job applications with latest action dates since January 1, 2000 and excludes DOB NOW jobs.",
      geographic_scope: "New York City legacy DOB job application rows with address, BIN, block/lot, community board, census/council fields, and GIS latitude/longitude fields when geocoded.",
      granularity: "One DOB legacy job application document row; this pass retains doc 01 rows and one preferred scale row per job number.",
      key_fields_for_events: ["job__", "doc__", "job_type", "job_status_descrp", "latest_action_date", "approved", "fully_permitted", "proposed_dwelling_units", "total_construction_floor_area", "proposed_zoning_sqft", "proposed_height", "proposed_no_of_stories", "initial_cost", "gis_latitude", "gis_longitude"],
      source_date_fields: ["latest_action_date", "approved", "fully_permitted", "signoff_date", "pre__filing_date"],
      geometry_fields: ["gis_latitude", "gis_longitude", "gis_bin"],
      accepted_candidate_count: selected.length,
      required_caveats: [
        "Scale and status fields are linked context only and may be amended or corrected.",
        "Application filings are not construction start, completion, opening, occupancy, outcome, or causal evidence.",
        "Extreme legacy scale values were screened before scoring, with raw fields retained for review."
      ],
      ingestion_recommendation: "Use only as supporting row-level context for selected ipu4-2q9a permit issuance records."
    })
  ];

  const outputPaths = Object.fromEntries(OUTPUT_FILES.map((name) => [name, rel(path.join(OUT_DIR, name))]));
  const summary = {
    schema_version: `${SLUG}_summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    output_files: OUTPUT_FILES.map((name) => rel(path.join(OUT_DIR, name))),
    task: "Round502 NYC DOB Permit Issuance legacy permit next4 candidate pack",
    candidate_count: selected.length,
    target_count: TARGET_COUNT,
    dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND,
    date_window: { start: START_DATE, end: END_DATE },
    selected_summary: selectedSummary,
    source_ids: [DATASETS.permits.source_id, DATASETS.filings.source_id],
    source_datasets: [DATASETS.permits.dataset_id, DATASETS.filings.dataset_id],
    source_fields: {
      primary_source_record_id: "ipu4-2q9a permit_si_no",
      supporting_source_record_id: "ic3t-wcy2 job__",
      primary_date_field: "issuance_date",
      primary_geometry_fields: ["gis_latitude", "gis_longitude"]
    },
    selection_summary: {
      fetched_high_scale_job_application_rows: highScaleApps.length,
      fetched_civic_job_application_rows: civicApps.length,
      screened_high_signal_job_applications: appByJob.size,
      fetched_initial_issued_nb_al_permit_rows: permitRows.length,
      joined_jobs_with_candidate_permit_rows: permitsByJob.size,
      eligible_pool_after_duplicate_screening: pool.length,
      selected_candidates: selected.length,
      retained_less_than_target_reason: selected.length < TARGET_COUNT ? "Source/dedupe/high-signal filters yielded fewer nonduplicate candidates than target." : null,
      duplicate_screening: {
        latest_round_scanned: DEDUPE_BOUNDARY_ROUND,
        files_read: duplicateIndex.filesRead.length,
        files_skipped: duplicateIndex.filesSkipped,
        manual_event_count: duplicateIndex.manualEventCount,
        scanned_dob_records: duplicateIndex.scannedDobRecordCount,
        permit_si_nos_checked: duplicateIndex.permitSiNos.size,
        job_numbers_checked: duplicateIndex.jobNumbers.size,
        source_date_keys_checked: duplicateIndex.sourceDateKeys.size,
        title_date_keys_checked: duplicateIndex.titleDateKeys.size,
        address_date_keys_checked: duplicateIndex.addressDateKeys.size,
        screened_files: duplicateIndex.filesRead
      },
      rejected_counts: rejected.counts()
    },
    caveats: [
      "Permit issuance is an administrative DOB milestone only.",
      "No construction start, completion, opening, occupancy, outcome, impact, or causation claim is made.",
      "Coordinates are DOB/Open Data geocoded points, not surveyed footprints or work limits.",
      "Linked job-application scale/status fields are source-reported context and may change."
    ],
    output_paths: outputPaths,
    retrieved_at: ACCESSED_AT
  };

  const validation = validateCandidates(selected, duplicateIndex, sourceAudits, summary.candidate_count);
  const audit = duplicateAudit(selected, duplicateIndex, validation);
  const validationReport = {
    schema_version: `${SLUG}_validation_report.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    report_type: "json_readable_validation_summary",
    validation_ok: validation.ok,
    candidate_count: selected.length,
    date_range: selectedSummary.date_range,
    source_ids: summary.source_ids,
    source_mix: { [DATASETS.permits.dataset_id]: selected.length },
    borough_mix: selectedSummary.by_borough,
    permit_type_mix: selectedSummary.by_permit_type,
    screened_files_read: duplicateIndex.filesRead.length,
    prior_permit_si_nos_checked: duplicateIndex.permitSiNos.size,
    prior_job_numbers_checked: duplicateIndex.jobNumbers.size,
    prior_source_date_keys_checked: duplicateIndex.sourceDateKeys.size,
    prior_title_date_keys_checked: duplicateIndex.titleDateKeys.size,
    manual_corpus_screened: validation.checks.manual_corpus_screened,
    no_overlap_with_screened_corpus_and_prior_packs: validation.checks.no_overlap_with_screened_corpus_and_prior_packs,
    source_audit_count: sourceAudits.length,
    caveats: summary.caveats,
    errors: validation.errors,
    retrieved_at: ACCESSED_AT,
    candidate_count_within_target: selected.length <= TARGET_COUNT,
    no_duplicate_permit_ids: validation.checks.unique_permit_si_nos === selected.length,
    no_duplicate_job_numbers: validation.checks.unique_job_numbers === selected.length
  };

  const candidatesPayload = {
    schema_version: `${SLUG}_candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    source_name: DATASETS.permits.source_name,
    source_dataset_id: DATASETS.permits.dataset_id,
    candidate_count: selected.length,
    candidates: selected
  };

  const sourceAuditPayload = {
    schema_version: `${SLUG}_source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Official NYC Open Data DOB Permit Issuance and DOB Job Application Filings source audit for Bims-5 candidate ingestion.",
    sources: sourceAudits,
    selection_summary: summary.selection_summary,
    retrieved_at: ACCESSED_AT
  };

  const rejectedPayload = {
    schema_version: `${SLUG}_rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected: rejected.list(),
    counts: rejected.counts(),
    retrieved_at: ACCESSED_AT
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), candidatesPayload);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAuditPayload);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedPayload);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);
  writeJson(path.join(OUT_DIR, "duplicate_audit.json"), audit);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), buildNotes(summary, sourceAudits), "utf8");

  writeJson(path.join(OUT_DIR, "readback.json"), {
    schema_version: `${SLUG}_readback.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    pending_final_readback: true
  });
  let readback = buildReadback(summary, validation);
  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  readback = buildReadback(summary, validation);
  writeJson(path.join(OUT_DIR, "readback.json"), readback);

  console.log(JSON.stringify({
    round: ROUND,
    candidate_count: selected.length,
    pool: pool.length,
    date_range: selectedSummary.date_range,
    validation_ok: validation.ok,
    readback_ok: readback.ok,
    output_dir: rel(OUT_DIR)
  }, null, 2));

  if (!validation.ok || !readback.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
