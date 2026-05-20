const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/ayush/dev/Bims-5";
const OUT_DIR = path.join(ROOT, "tmp/subagents/round119_nyc_dob_legacy_bulk");
const ACCESS_DATE = "2026-05-19";
const START_DATE = "2008-01-01";
const END_DATE = ACCESS_DATE;

const DATASETS = {
  permits: {
    dataset_id: "ipu4-2q9a",
    source_id: "nyc-dob-permit-issuance-ipu4-2q9a",
    source_name: "NYC Open Data: DOB Permit Issuance",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Permit-Issuance/ipu4-2q9a",
    api_url: "https://data.cityofnewyork.us/resource/ipu4-2q9a.json"
  },
  filings: {
    dataset_id: "ic3t-wcy2",
    source_id: "nyc-dob-job-application-filings-ic3t-wcy2",
    source_name: "NYC Open Data: DOB Job Application Filings",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2",
    api_url: "https://data.cityofnewyork.us/resource/ic3t-wcy2.json"
  },
  legacyCo: {
    dataset_id: "bs8b-p36w",
    source_id: "nyc-dob-co-bs8b-p36w",
    source_name: "NYC Open Data: DOB Certificate Of Occupancy",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w",
    api_url: "https://data.cityofnewyork.us/resource/bs8b-p36w.json"
  },
  nowPermits: {
    dataset_id: "rbx6-tga4",
    source_id: "nyc-dob-now-build-approved-permits-rbx6-tga4",
    source_name: "NYC Open Data: DOB NOW Build Approved Permits",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4",
    api_url: "https://data.cityofnewyork.us/resource/rbx6-tga4.json"
  },
  historicalPermits: {
    dataset_id: "bty7-2jhb",
    source_id: "nyc-dob-historical-permit-issuance-bty7-2jhb",
    source_name: "NYC Open Data: Historical DOB Permit Issuance",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/Historical-DOB-Permit-Issuance/bty7-2jhb",
    api_url: "https://data.cityofnewyork.us/resource/bty7-2jhb.json"
  },
  stalled: {
    dataset_id: "i296-73x5",
    source_id: "nyc-dob-stalled-construction-sites-i296-73x5",
    source_name: "NYC Open Data: DOB Stalled Construction Sites",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page_url: "https://data.cityofnewyork.us/Housing-Development/DOB-Stalled-Construction-Sites/i296-73x5",
    api_url: "https://data.cityofnewyork.us/resource/i296-73x5.json"
  }
};

const APP_FIELDS = [
  "job__", "doc__", "borough", "house__", "street_name", "block", "lot", "bin__",
  "job_type", "job_status_descrp", "latest_action_date", "building_type",
  "community___board", "landmarked", "city_owned", "applicant_professional_title",
  "pre__filing_date", "approved", "fully_permitted", "initial_cost",
  "proposed_zoning_sqft", "total_construction_floor_area", "existingno_of_stories",
  "proposed_no_of_stories", "existing_height", "proposed_height",
  "existing_dwelling_units", "proposed_dwelling_units", "existing_occupancy",
  "proposed_occupancy", "owner_type", "non_profit", "owner_s_business_name",
  "job_description", "withdrawal_flag", "signoff_date", "building_class",
  "gis_latitude", "gis_longitude", "gis_council_district", "gis_census_tract",
  "gis_nta_name", "gis_bin"
];

const PERMIT_FIELDS = [
  "borough", "bin__", "house__", "street_name", "job__", "job_doc___", "job_type",
  "self_cert", "block", "lot", "community_board", "zip_code", "bldg_type",
  "residential", "special_district_1", "special_district_2", "work_type",
  "permit_status", "filing_status", "permit_type", "permit_sequence__",
  "permit_subtype", "site_fill", "filing_date", "issuance_date",
  "expiration_date", "job_start_date", "permittee_s_business_name",
  "permittee_s_license_type", "owner_s_business_type", "non_profit",
  "owner_s_business_name", "dobrundate", "permit_si_no", "gis_latitude",
  "gis_longitude", "gis_council_district", "gis_census_tract", "gis_nta_name"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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
  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= 40.4774 && latitude <= 40.9176 &&
    longitude >= -74.2591 && longitude <= -73.7004;
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

async function fetchRows(datasetId, params, label, pageSize = 50000, maxRows = 500000) {
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const page = await fetchJson(queryUrl(datasetId, {
      ...params,
      $limit: String(pageSize),
      $offset: String(offset)
    }), `${label} offset ${offset}`);
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

function extractQueryParam(urlText, key) {
  try {
    const parsed = new URL(String(urlText));
    return parsed.searchParams.get(key);
  } catch {
    return null;
  }
}

function buildExistingIndex() {
  const index = {
    permitSiNos: new Set(),
    jobNumbers: new Set(),
    sourceUrls: new Set(),
    eventIds: new Set()
  };

  const scanRecord = (record) => {
    if (!record || typeof record !== "object") return;
    const url = record.source_url || record.supporting_source_url || "";
    if (url) addToken(index.sourceUrls, url);
    addToken(index.eventIds, record.event_id || record.candidate_id);
    const urlText = String(url);
    if (/ipu4-2q9a/.test(urlText)) addToken(index.permitSiNos, extractQueryParam(url, "permit_si_no"));
    if (/ic3t-wcy2/.test(urlText)) addToken(index.jobNumbers, extractQueryParam(url, "job__"));
    if (/bs8b-p36w/.test(urlText)) addToken(index.jobNumbers, extractQueryParam(url, "job_number"));

    const sourceRecord = String(record.source_record_id || "");
    const explicitPermit = sourceRecord.match(/(?:permit_si_no|permit\s*si\s*no|ipu4-2q9a\s*permit_si_no)\s*[:#]?\s*(\d{4,10})/i);
    const explicitJob = sourceRecord.match(/(?:job__|job_number|job\s*number|ic3t-wcy2\s*job__|job)\s*[:#]?\s*(\d{7,10})/i);
    if (explicitPermit) addToken(index.permitSiNos, explicitPermit[1]);
    if (explicitJob) addToken(index.jobNumbers, explicitJob[1]);

    const row = record.row_fields || record.raw_row || {};
    if (row.permit_si_no) addToken(index.permitSiNos, row.permit_si_no);
    if (row.job__) addToken(index.jobNumbers, row.job__);
    if (row.job_number) addToken(index.jobNumbers, row.job_number);
    if (row.permit_issuance?.permit_si_no) addToken(index.permitSiNos, row.permit_issuance.permit_si_no);
    if (row.permit_issuance?.job__) addToken(index.jobNumbers, row.permit_issuance.job__);
    if (row.job_application?.job__) addToken(index.jobNumbers, row.job_application.job__);
  };

  const corpusPath = path.join(ROOT, "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json");
  if (fs.existsSync(corpusPath)) {
    const corpus = readJson(corpusPath);
    for (const event of corpus.events || []) scanRecord(event);
  }

  const subagentsDir = path.join(ROOT, "tmp/subagents");
  const stack = [subagentsDir];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (full.startsWith(OUT_DIR)) continue;
      if (item.isDirectory()) {
        stack.push(full);
      } else if (/candidates.*\.json$/i.test(item.name) && /nyc|dob/i.test(full)) {
        try {
          const payload = readJson(full);
          for (const candidate of payload.candidates || []) scanRecord(candidate);
        } catch (error) {
          console.warn(`Skipped existing candidate scan for ${full}: ${error.message}`);
        }
      }
    }
  }

  return index;
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

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
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

function rejectionCollector() {
  const byReason = new Map();
  return {
    add(reason, example) {
      if (!byReason.has(reason)) byReason.set(reason, { reason, count: 0, examples: [] });
      const bucket = byReason.get(reason);
      bucket.count += 1;
      if (example && bucket.examples.length < 8) bucket.examples.push(example);
    },
    list() {
      return [...byReason.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
    }
  };
}

function choosePermitForJob(permits, appRow) {
  const expectedPermitType = /^NB$/i.test(appRow.job_type || "") ? "NB" : "AL";
  const usable = permits
    .filter((row) => row.permit_status === "ISSUED")
    .filter((row) => row.filing_status === "INITIAL")
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

function makeCandidate(appRow, permitRow, permitDate, scale) {
  const permitDataset = DATASETS.permits;
  const filingDataset = DATASETS.filings;
  const borough = titleCaseBorough(permitRow.borough || appRow.borough);
  const address = cleanAddress([permitRow.house__ || appRow.house__, permitRow.street_name || appRow.street_name]);
  const latitude = parseNumber(permitRow.gis_latitude) || parseNumber(appRow.gis_latitude);
  const longitude = parseNumber(permitRow.gis_longitude) || parseNumber(appRow.gis_longitude);
  const permitId = String(permitRow.permit_si_no || "").trim();
  const jobNumber = String(appRow.job__ || permitRow.job__ || "").trim();
  const projectType = /^NB$/i.test(appRow.job_type || permitRow.job_type || "")
    ? "legacy DOB new-building permit"
    : "legacy DOB major alteration permit";
  const titleVerb = /^NB$/i.test(appRow.job_type || permitRow.job_type || "")
    ? "new-building permit issued"
    : "major-alteration permit issued";
  const candidateId = slugify(`nyc_arch_dob_legacy_permit_${permitId}_${permitDate}`);
  const sourceUrl = rowUrl(permitDataset.dataset_id, "permit_si_no", permitId);
  const supportingSourceUrl = rowUrl(filingDataset.dataset_id, "job__", jobNumber);
  const appDateValue = appDate(appRow);
  const dateContext = appDateValue ? ` The linked job-application row has application/status date context ${appDateValue}.` : "";
  const { _scale, ...cleanAppRow } = appRow;

  return {
    city_id: "nyc",
    candidate_id: candidateId,
    title: `DOB ${titleVerb} for ${address}`,
    summary: `${permitDataset.publisher} records an initial ${permitRow.permit_type || "permit"} issuance for legacy job ${jobNumber} at ${address}, ${borough}. The linked DOB Job Application Filings row reports ${scale.note}.${dateContext}`,
    observed_change: `NYC DOB recorded issuance of an initial ${permitRow.permit_type || "permit"} permit for the cited legacy ${appRow.job_type || permitRow.job_type || "DOB"} job.`,
    date: permitDate,
    effective_date: permitDate,
    date_precision: "day",
    source_id: permitDataset.source_id,
    source_ids: [permitDataset.source_id, filingDataset.source_id],
    source_name: permitDataset.source_name,
    publisher: permitDataset.publisher,
    source_url: sourceUrl,
    supporting_source_url: supportingSourceUrl,
    source_record_id: `ipu4-2q9a permit_si_no ${permitId}; ic3t-wcy2 job__ ${jobNumber}`,
    source_type: "official NYC Open Data Socrata API rows",
    accessed_at: ACCESS_DATE,
    source_date_field: "issuance_date from DOB Permit Issuance; DOB Job Application Filings fields used only for linked scale/status context",
    latitude,
    longitude,
    geometry_source: "DOB Permit Issuance GIS latitude/longitude geocoded address point, with DOB Job Application Filings GIS point retained for cross-reference.",
    geometry_precision: "official geocoded building/address point; not a surveyed lot boundary, building footprint, or work-area polygon",
    confidence: "documented",
    project_type: projectType,
    license_or_terms_note: "NYC Open Data / NYC.gov terms. NYC Open Data FAQ states there are no restrictions on use; keep DOB and NYC Open Data attribution and re-check dataset-specific metadata before bulk redistribution.",
    attribution: "NYC Department of Buildings (DOB), via NYC Open Data",
    limitations: "This is an administrative permit-issuance record. It is not evidence of construction start, construction completion, opening, legal occupancy, actual occupancy, design quality, safety condition, affordability, neighborhood outcome, or causal effect. Linked job-application scale fields are source-reported proposed/application attributes and may be amended; legacy DOB rows can contain data-entry anomalies, so extreme scale values were screened and raw fields are retained for review.",
    transformation_method: "Round119 fetched official NYC Open Data DOB Job Application Filings rows with high-signal scale/context fields, joined them by job number to official DOB Permit Issuance rows, kept only initial issued NB/AL permits within 2008-01-01 through 2026-05-19, screened against existing architecture milestone events and prior NYC DOB candidate packs by permit SI number and job number, and selected for year/borough spread without inferring completion or occupancy.",
    area: `${address}, ${borough}, New York City`,
    borough,
    source_row_ids: {
      "ipu4-2q9a": permitId,
      "ic3t-wcy2": jobNumber
    },
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
    row_fields: {
      permit_issuance: permitRow,
      job_application: cleanAppRow
    }
  };
}

function selectSpread(candidates, maxCount) {
  const selected = [];
  const selectedIds = new Set();
  const byBucket = new Map();
  const boroughCounts = new Map();
  const yearCounts = new Map();

  candidates.sort((a, b) => {
    return b._score - a._score ||
      String(a.date).localeCompare(String(b.date)) ||
      a.candidate_id.localeCompare(b.candidate_id);
  });

  const add = (candidate, perBucketLimit, perBoroughLimit, perYearLimit) => {
    if (selected.length >= maxCount || selectedIds.has(candidate.candidate_id)) return false;
    const bucket = `${dateYear(candidate.date)}|${candidate.borough}`;
    if ((byBucket.get(bucket) || 0) >= perBucketLimit) return false;
    if ((boroughCounts.get(candidate.borough) || 0) >= perBoroughLimit) return false;
    if ((yearCounts.get(dateYear(candidate.date)) || 0) >= perYearLimit) return false;
    selected.push(candidate);
    selectedIds.add(candidate.candidate_id);
    byBucket.set(bucket, (byBucket.get(bucket) || 0) + 1);
    boroughCounts.set(candidate.borough, (boroughCounts.get(candidate.borough) || 0) + 1);
    yearCounts.set(dateYear(candidate.date), (yearCounts.get(dateYear(candidate.date)) || 0) + 1);
    return true;
  };

  for (const candidate of candidates) add(candidate, 2, 45, 14);
  for (const candidate of candidates) add(candidate, 4, 50, 18);
  for (const candidate of candidates) add(candidate, 8, 60, 24);
  for (const candidate of candidates) add(candidate, 15, 65, 36);
  for (const candidate of candidates) add(candidate, 25, 75, 50);

  return selected
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.borough.localeCompare(b.borough) || a.candidate_id.localeCompare(b.candidate_id))
    .map((candidate) => {
      const copy = { ...candidate };
      delete copy._score;
      return copy;
    });
}

function sourceAuditFromMetadata(dataset, metadata, extras = {}) {
  return {
    source_id: dataset.source_id,
    source_name: dataset.source_name,
    publisher: dataset.publisher,
    url: dataset.page_url,
    api_endpoint: dataset.api_url,
    nyc_open_data_dataset_id: dataset.dataset_id,
    metadata_name: metadata?.name || dataset.source_name,
    metadata_description: metadata?.description || null,
    metadata_rows_updated_at: toIsoDateFromEpoch(metadata?.rowsUpdatedAt),
    metadata_view_last_modified: toIsoDateFromEpoch(metadata?.viewLastModified),
    license_and_attribution: "NYC Open Data / NYC.gov terms; attribute NYC Department of Buildings and NYC Open Data.",
    license_url: "https://opendata.cityofnewyork.us/faq/",
    coverage_years: extras.coverage_years,
    update_frequency: extras.update_frequency,
    geographic_scope_and_granularity: extras.geography,
    key_fields: extras.key_fields,
    reliability: extras.reliability,
    required_caveats: extras.caveats,
    ingestion_recommendation: extras.recommendation,
    round119_use: extras.round119_use
  };
}

function summarizeSelected(candidates) {
  const byBorough = {};
  const byYear = {};
  const byProjectType = {};
  for (const candidate of candidates) {
    byBorough[candidate.borough] = (byBorough[candidate.borough] || 0) + 1;
    byYear[dateYear(candidate.date)] = (byYear[dateYear(candidate.date)] || 0) + 1;
    byProjectType[candidate.project_type] = (byProjectType[candidate.project_type] || 0) + 1;
  }
  return { by_borough: byBorough, by_year: byYear, by_project_type: byProjectType };
}

async function main() {
  ensureDir(OUT_DIR);
  const rejected = rejectionCollector();
  const existing = buildExistingIndex();

  const metadataEntries = {};
  for (const dataset of Object.values(DATASETS)) {
    metadataEntries[dataset.dataset_id] = await fetchMetadata(dataset.dataset_id);
  }

  const highScaleApps = await fetchRows(DATASETS.filings.dataset_id, {
    $select: APP_FIELDS.join(","),
    $where: "doc__='01' AND proposed_zoning_sqft > 50000 AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL"
  }, "high-scale DOB Job Application Filings");

  const civicApps = await fetchRows(DATASETS.filings.dataset_id, {
    $select: APP_FIELDS.join(","),
    $where: "doc__='01' AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL AND (city_owned='Y' OR non_profit='Y')"
  }, "civic/nonprofit DOB Job Application Filings", 50000, 100000);

  const appByJob = new Map();
  for (const row of [...highScaleApps, ...civicApps]) {
    const job = String(row.job__ || "").trim();
    if (!job || existing.jobNumbers.has(job)) {
      rejected.add("existing_duplicate_job_or_missing_job_number", { job_number: job, dataset: DATASETS.filings.dataset_id });
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
    if (!highSignal(scale)) {
      rejected.add("job_application_below_high_signal_threshold", { job_number: job, scale_note: scale.note });
      continue;
    }
    if (scale.score <= 0) {
      rejected.add("job_application_implausible_or_unusable_scale", { job_number: job, raw_scale: scale.raw });
      continue;
    }
    const existingRow = appByJob.get(job);
    if (!existingRow || scale.score > existingRow._scale.score) {
      row._scale = scale;
      appByJob.set(job, row);
    }
  }

  console.log(`job applications after screening: ${appByJob.size}`);

  const jobNumbers = [...appByJob.keys()];
  const permitsByJob = new Map();
  const chunkSize = 45;
  for (let i = 0; i < jobNumbers.length; i += chunkSize) {
    const chunk = jobNumbers.slice(i, i + chunkSize);
    const quotedJobs = chunk.map((job) => `'${job.replace(/'/g, "''")}'`).join(",");
    const rows = await fetchRows(DATASETS.permits.dataset_id, {
      $select: PERMIT_FIELDS.join(","),
      $where: `job__ in(${quotedJobs}) AND permit_status='ISSUED' AND filing_status='INITIAL' AND permit_type in('NB','AL') AND job_type in('NB','A1') AND gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL`
    }, `DOB Permit Issuance jobs ${i + 1}-${Math.min(i + chunkSize, jobNumbers.length)}`, 5000, 10000);
    for (const permit of rows) {
      const job = String(permit.job__ || "").trim();
      if (!permitsByJob.has(job)) permitsByJob.set(job, []);
      permitsByJob.get(job).push(permit);
    }
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
    if (!permitId || existing.permitSiNos.has(permitId)) {
      rejected.add("existing_duplicate_or_missing_permit_si_no", { permit_si_no: permitId, job_number: job });
      continue;
    }
    const lat = parseNumber(permit.gis_latitude) || parseNumber(appRow.gis_latitude);
    const lon = parseNumber(permit.gis_longitude) || parseNumber(appRow.gis_longitude);
    if (!isNycPoint(lat, lon)) {
      rejected.add("permit_missing_or_outside_nyc_coordinates", { permit_si_no: permitId, job_number: job });
      continue;
    }
    const candidate = makeCandidate(appRow, permit, permitChoice.date, appRow._scale);
    if (existing.sourceUrls.has(candidate.source_url)) {
      rejected.add("existing_duplicate_source_url", { source_url: candidate.source_url, job_number: job });
      continue;
    }
    candidate._score = appRow._scale.score;
    pool.push(candidate);
  }

  const selected = selectSpread(pool, 200);
  const selectedKeys = new Set(selected.map((candidate) => candidate.candidate_id));
  for (const candidate of pool) {
    if (!selectedKeys.has(candidate.candidate_id)) {
      rejected.add("eligible_not_selected_due_to_200_record_spread_cap", {
        candidate_id: candidate.candidate_id,
        date: candidate.date,
        borough: candidate.borough
      });
    }
  }

  const sourceAudits = [
    sourceAuditFromMetadata(DATASETS.permits, metadataEntries[DATASETS.permits.dataset_id], {
      coverage_years: "DOB permit issuance records in and around the 2008-01-01 through 2026-05-19 extraction window; DOB also lists this as the permit-issued Open Data feed.",
      update_frequency: "Operational NYC Open Data dataset; metadata timestamp retained above.",
      geography: "NYC address/building geocoded point fields (gis_latitude/gis_longitude), plus borough, BIN, block/lot, community board, council district, census tract, and NTA fields.",
      key_fields: ["permit_si_no", "job__", "issuance_date", "permit_status", "filing_status", "permit_type", "job_type", "borough", "house__", "street_name", "gis_latitude", "gis_longitude"],
      reliability: "strong for administrative permit issuance; usable with caveats for city-change atlas events",
      caveats: "A permit issuance is an administrative event, not evidence of construction start, completion, opening, occupancy, design quality, or outcome. Coordinates are geocoded points.",
      recommendation: "Use selected initial NB/AL issued permits, keep permit_si_no row URL, and display linked job application scale fields only as source-reported context.",
      round119_use: `Primary candidate source; ${selected.length} selected permit rows after duplicate and spread screening.`
    }),
    sourceAuditFromMetadata(DATASETS.filings, metadataEntries[DATASETS.filings.dataset_id], {
      coverage_years: "Legacy BIS job application filings with dates parsed locally; used here only when linked to an in-window permit issuance.",
      update_frequency: "Operational/legacy NYC Open Data dataset; metadata timestamp retained above.",
      geography: "NYC geocoded job address point fields (gis_latitude/gis_longitude), borough, BIN, block/lot, council district, census tract, and NTA fields.",
      key_fields: ["job__", "doc__", "job_type", "job_status_descrp", "approved", "fully_permitted", "latest_action_date", "signoff_date", "proposed_dwelling_units", "total_construction_floor_area", "proposed_zoning_sqft", "proposed_height", "proposed_no_of_stories", "initial_cost"],
      reliability: "usable with caveats as linked scale/status context",
      caveats: "Application fields are proposed/source-reported and may be amended; legacy fields can include inconsistent or extreme values. The job filing itself is not completion or occupancy evidence.",
      recommendation: "Use as supporting provenance for selected permit rows, not as a standalone completion claim.",
      round119_use: `${appByJob.size} high-signal non-duplicate job rows survived initial screening before permit join.`
    }),
    sourceAuditFromMetadata(DATASETS.legacyCo, metadataEntries[DATASETS.legacyCo.dataset_id], {
      coverage_years: "Legacy certificate of occupancy rows, especially pre-DOB NOW transition; prior Bims rounds already include many high-signal CO rows.",
      update_frequency: "Legacy dataset; metadata timestamp retained above.",
      geography: "NYC geocoded point fields (latitude/longitude), BIN/BBL, borough/address, community board, council district, census tract, and NTA fields.",
      key_fields: ["job_number", "c_o_issue_date", "issue_type", "application_status_raw", "pr_dwelling_unit", "ex_dwelling_unit", "latitude", "longitude"],
      reliability: "strong for administrative CO issuance when issue/status fields are explicit",
      caveats: "CO issuance is an administrative/legal occupancy record and still should not be converted into construction completion, opening, or actual occupancy.",
      recommendation: "Do not prioritize in Round119 because existing corpus and prior scratch rounds already represent this source more heavily than permit issuance.",
      round119_use: "Audited but not selected; rejected as already represented relative to the lighter ipu4-2q9a permit coverage."
    }),
    sourceAuditFromMetadata(DATASETS.nowPermits, metadataEntries[DATASETS.nowPermits.dataset_id], {
      coverage_years: "DOB NOW approved permit rows, mainly current DOB NOW era.",
      update_frequency: "Operational NYC Open Data dataset; metadata timestamp retained above.",
      geography: "NYC geocoded point fields (latitude/longitude), BBL/BIN, borough/address, community board, council district, census tract, and NTA fields.",
      key_fields: ["work_permit", "job_filing_number", "issued_date", "approved_date", "permit_status", "work_type", "estimated_job_costs", "latitude", "longitude"],
      reliability: "strong for DOB NOW administrative permits; usable with caveats",
      caveats: "Approved/issued permits are administrative records and are not completion, opening, or occupancy evidence.",
      recommendation: "Leave for current-DOB-NOW passes; Round119 focuses legacy underrepresented permit issuance.",
      round119_use: "Audited but not selected because prior rounds and corpus already include DOB NOW filing/permit candidates."
    }),
    sourceAuditFromMetadata(DATASETS.historicalPermits, metadataEntries[DATASETS.historicalPermits.dataset_id], {
      coverage_years: "1989-2013 historical permit issuance table.",
      update_frequency: "Redundant/archival according to dataset metadata.",
      geography: "Legacy address/BIN/block/lot fields; geometry fields may differ from current ipu4 schema.",
      key_fields: ["job", "permit_si_no", "issuance_date", "permit_type", "job_type", "borough", "house", "street_name"],
      reliability: "reject for this round",
      caveats: "Dataset metadata says this historical table is now redundant because DOB Permit Issuance incorporates the same date range.",
      recommendation: "Use ipu4-2q9a instead for the 2008-2013 overlap to avoid duplicate historical rows.",
      round119_use: "Audited and rejected as redundant with the selected ipu4-2q9a source."
    }),
    sourceAuditFromMetadata(DATASETS.stalled, metadataEntries[DATASETS.stalled.dataset_id], {
      coverage_years: "Active stalled-site complaint/status snapshot rather than a complete 2008-2026 event history.",
      update_frequency: "Daily according to metadata description.",
      geography: "Borough/community board/BIN/address fields; no latitude/longitude in the metadata columns inspected for this round.",
      key_fields: ["complaint_number", "date_complaint_received", "borough_name", "bin", "house_number", "street_name", "dobrundate"],
      reliability: "risky for this extraction",
      caveats: "Stalled-site rows are active complaint/status records and do not by themselves document architectural completion, occupancy, or a stable historical event series.",
      recommendation: "Do not use for this candidate pack unless later joined to BIN geocoding and framed as an active administrative stalled-status observation.",
      round119_use: "Audited and rejected due to snapshot nature and missing source lat/lon."
    })
  ];

  const payload = {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    task_scope: "Additional official NYC DOB architecture/city-change records from NYC Open Data for 2008-01-01 through 2026-05-19, biased toward legacy DOB Permit Issuance rows underrepresented in the corpus.",
    source_audits: sourceAudits,
    candidates: selected,
    rejected: rejected.list(),
    selection_summary: {
      fetched_high_scale_job_application_rows: highScaleApps.length,
      fetched_civic_job_application_rows: civicApps.length,
      screened_high_signal_job_applications: appByJob.size,
      eligible_joined_permit_candidates: pool.length,
      selected_candidates: selected.length,
      existing_duplicate_job_tokens_loaded: existing.jobNumbers.size,
      existing_duplicate_permit_tokens_loaded: existing.permitSiNos.size,
      ...summarizeSelected(selected)
    }
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), payload);

  const summary = summarizeSelected(selected);
  const notes = [
    "# Round119 NYC DOB legacy permit bulk extraction",
    "",
    `Accessed: ${ACCESS_DATE}`,
    "",
    "## Scope",
    "",
    "This pack focuses on official NYC Department of Buildings rows from NYC Open Data for 2008-01-01 through 2026-05-19. It intentionally prioritizes legacy `DOB Permit Issuance` (`ipu4-2q9a`) because the current Bims corpus already has much heavier DOB NOW and certificate-of-occupancy coverage.",
    "",
    "The selected records are administrative permit-issuance events linked to high-signal legacy `DOB Job Application Filings` (`ic3t-wcy2`) rows for scale/context. They are not construction-completion, opening, occupancy, or outcome claims.",
    "",
    "## Method",
    "",
    "- Queried `ic3t-wcy2` for doc 01 NB/A1 job applications with official GIS coordinates and either large proposed zoning square footage or city-owned/nonprofit flags.",
    "- Screened out existing corpus/prior-candidate DOB job numbers and permit SI numbers before selection.",
    "- Joined surviving jobs to `ipu4-2q9a` by `job__` and retained only initial, issued NB/AL permit rows with `issuance_date` in the requested window.",
    "- Scored candidates using source-reported proposed dwelling units, construction floor area, plausible zoning square footage, height, stories, initial cost, and public/civic owner flags.",
    "- Selected at most 200 records with year and borough spread.",
    "",
    "## Output",
    "",
    `- candidates.json: ${selected.length} candidates, ${payload.rejected.length} aggregate rejection buckets, ${sourceAudits.length} source audits.`,
    `- Eligible joined permit candidates before spread cap: ${pool.length}.`,
    "",
    "## Selected by borough",
    "",
    ...Object.entries(summary.by_borough).sort((a, b) => a[0].localeCompare(b[0])).map(([borough, count]) => `- ${borough}: ${count}`),
    "",
    "## Selected by year",
    "",
    ...Object.entries(summary.by_year).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => `- ${year}: ${count}`),
    "",
    "## Source Audits",
    "",
    "- `ipu4-2q9a` DOB Permit Issuance: selected source. Strong for permit issuance dates and permit SI row IDs; administrative only.",
    "- `ic3t-wcy2` DOB Job Application Filings: supporting source for scale/context; proposed/application fields can be amended and can contain legacy anomalies.",
    "- `bs8b-p36w` legacy CO and `rbx6-tga4` DOB NOW approved permits: audited but not prioritized because prior rounds already cover them more heavily.",
    "- `bty7-2jhb` Historical DOB Permit Issuance: rejected because NYC Open Data metadata says it is redundant with `ipu4-2q9a`.",
    "- `i296-73x5` DOB Stalled Construction Sites: rejected for this pack because it is an active stalled-status snapshot and lacks lat/lon fields in inspected metadata.",
    "",
    "## Caveats",
    "",
    "- Permit issuance is an administrative milestone. Do not display it as construction start, completion, opening, certificate of occupancy, or actual occupancy.",
    "- Coordinates are DOB/Open Data geocoded points, not building footprints or work-area polygons.",
    "- Job-application scale fields are proposed/source-reported context and may change through amendments.",
    "- Extreme legacy scale values were screened from scoring, but raw source rows are retained in each candidate for review.",
    "- NYC Open Data terms and DOB attribution should remain attached to derived records."
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notes}\n`);

  console.log(JSON.stringify({
    selected: selected.length,
    rejected_buckets: payload.rejected.length,
    pool: pool.length,
    by_borough: summary.by_borough,
    by_year: summary.by_year
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
