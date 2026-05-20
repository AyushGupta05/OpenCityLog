const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2024-01-01";
const END_DATE = ACCESSED_AT;
const TARGET_COUNT = 60;
const PERMIT_LOOKUP_LIMIT = 900;
const OUT_DIR = "tmp/subagents/round133_nyc_official_architecture";
const CORPUS_PATH = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";

const DATASETS = {
  applications: {
    id: "w9ak-ipjd",
    sourceId: "nyc-dob-now-build-job-application-filings-w9ak-ipjd",
    canonicalSourceId: "nyc-dob-filings-permits",
    name: "NYC Open Data: DOB NOW: Build - Job Application Filings",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd",
    api: "https://data.cityofnewyork.us/resource/w9ak-ipjd.json",
    metadata: "https://data.cityofnewyork.us/api/views/w9ak-ipjd"
  },
  permits: {
    id: "rbx6-tga4",
    sourceId: "nyc-dob-now-build-approved-permits-rbx6-tga4",
    canonicalSourceId: "nyc-dob-filings-permits",
    name: "NYC Open Data: DOB NOW: Build - Approved Permits",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4",
    api: "https://data.cityofnewyork.us/resource/rbx6-tga4.json",
    metadata: "https://data.cityofnewyork.us/api/views/rbx6-tga4"
  }
};

const APPLICATION_SELECT = [
  "job_filing_number",
  "filing_status",
  "house_no",
  "street_name",
  "borough",
  "block",
  "lot",
  "bin",
  "commmunity_board",
  "work_on_floor",
  "owner_s_business_name",
  "filing_representative_business_name",
  "initial_cost",
  "total_construction_floor_area",
  "review_building_code",
  "building_type",
  "existing_stories",
  "existing_height",
  "existing_dwelling_units",
  "proposed_no_of_stories",
  "proposed_height",
  "proposed_dwelling_units",
  "postcode",
  "latitude",
  "longitude",
  "council_district",
  "census_tract",
  "bbl",
  "nta",
  "filing_date",
  "current_status_date",
  "first_permit_date",
  "job_type",
  "signoff_date",
  "earth_work_work_type_",
  "foundation_work_type_",
  "general_construction_work_type_",
  "structural_work_type_",
  "support_of_excavation_work_type_"
];

const PERMIT_SELECT = [
  "job_filing_number",
  "work_permit",
  "sequence_number",
  "filing_reason",
  "house_no",
  "street_name",
  "borough",
  "lot",
  "bin",
  "block",
  "c_b_no",
  "work_on_floor",
  "work_type",
  "approved_date",
  "issued_date",
  "expired_date",
  "job_description",
  "estimated_job_costs",
  "owner_business_name",
  "permit_status",
  "tracking_number",
  "zip_code",
  "latitude",
  "longitude",
  "community_board",
  "council_district",
  "bbl",
  "census_tract",
  "nta"
];

const APPLICATION_JOB_TYPES = [
  "New Building",
  "Alteration CO",
  "ALT-CO - New Building with Existing Elements to Remain"
];

const PERMIT_WORK_TYPES = [
  "General Construction",
  "Foundation",
  "Structural",
  "Earthwork",
  "Support of Excavation"
];

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
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
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
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

function cleanAddress(row) {
  return [row.house_no, row.street_name]
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
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

function yesFlag(value) {
  const text = cleanText(value).toLowerCase();
  return text === "1" || text === "yes" || text === "true";
}

function socrataUrl(datasetId, params = {}) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function fetchJson(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
      }
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

function walkJsonCandidateFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (fullPath.replace(/\\/g, "/") === OUT_DIR) continue;
        stack.push(fullPath);
      } else if (
        entry.name === "candidates.json" ||
        /^nyc_arch_candidates.*\.json$/i.test(entry.name) ||
        /^round\d+_nyc_.*candidates.*\.json$/i.test(entry.name)
      ) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function addToken(tokens, value) {
  const text = cleanText(value).toLowerCase();
  if (text.length >= 4) tokens.add(text);
}

function dobNowBaseNumber(value) {
  const text = cleanText(value).toUpperCase();
  const match = text.match(/^([A-Z]\d{8})/);
  return match ? match[1] : text;
}

function collectExistingTokensFromObject(tokens, value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectExistingTokensFromObject(tokens, item);
    return;
  }
  for (const key of [
    "source_record_id",
    "source_url",
    "job_filing_number",
    "work_permit",
    "tracking_number",
    "job_number",
    "application_source_record_id",
    "candidate_id",
    "event_id",
    "id"
  ]) {
    addToken(tokens, value[key]);
    addToken(tokens, dobNowBaseNumber(value[key]));
  }
  if (value.source_row_ref) collectExistingTokensFromObject(tokens, value.source_row_ref);
  if (value.source_fields) collectExistingTokensFromObject(tokens, value.source_fields);
}

function buildExistingIndex() {
  const tokens = new Set();
  let filesRead = 0;
  const corpus = readJsonIfExists(CORPUS_PATH);
  if (corpus) {
    collectExistingTokensFromObject(tokens, corpus.events || []);
    collectExistingTokensFromObject(tokens, corpus.candidates || []);
    filesRead += 1;
  }
  for (const file of walkJsonCandidateFiles("tmp/subagents")) {
    try {
      const doc = readJsonIfExists(file);
      collectExistingTokensFromObject(tokens, Array.isArray(doc) ? doc : doc?.events || doc?.candidates || doc);
      filesRead += 1;
    } catch (error) {
      console.warn(`Skipping duplicate-index file ${file}: ${error.message}`);
    }
  }
  return { tokens, filesRead };
}

function tokenExists(existing, value) {
  const text = cleanText(value).toLowerCase();
  return text.length >= 4 && existing.tokens.has(text);
}

function sourceRecordIdForPermit(row) {
  return [
    cleanText(row.work_permit),
    cleanText(row.sequence_number) || "no_sequence",
    cleanText(row.tracking_number) || "no_tracking"
  ].join(":");
}

function permitSourceUrl(row) {
  const url = new URL(DATASETS.permits.api);
  if (cleanText(row.tracking_number)) {
    url.searchParams.set("tracking_number", cleanText(row.tracking_number));
  } else {
    url.searchParams.set("work_permit", cleanText(row.work_permit));
    if (cleanText(row.sequence_number)) url.searchParams.set("sequence_number", cleanText(row.sequence_number));
  }
  return url.toString();
}

function applicationSourceUrl(row) {
  const url = new URL(DATASETS.applications.api);
  url.searchParams.set("job_filing_number", cleanText(row.job_filing_number));
  return url.toString();
}

function scaleForApplication(row) {
  return {
    cost: parseNumber(row.initial_cost),
    floorArea: parseNumber(row.total_construction_floor_area),
    units: parseNumber(row.proposed_dwelling_units),
    height: parseNumber(row.proposed_height),
    stories: parseNumber(row.proposed_no_of_stories),
    existingUnits: parseNumber(row.existing_dwelling_units),
    existingHeight: parseNumber(row.existing_height),
    existingStories: parseNumber(row.existing_stories),
    publicLike: /NYCHA|SCHOOL CONSTRUCTION AUTHORITY|NYC|HOSPITAL|LIBRARY|PARKS|DORMITORY AUTHORITY|MTA|CUNY|HHC|HEALTH/i.test(cleanText(row.owner_s_business_name))
  };
}

function scaleLabel(scale) {
  const parts = [];
  if (scale.floorArea) parts.push(`${Math.round(scale.floorArea).toLocaleString("en-US")} sq ft total construction floor area`);
  if (scale.units) parts.push(`${Math.round(scale.units).toLocaleString("en-US")} proposed dwelling units`);
  if (scale.stories) parts.push(`${Math.round(scale.stories).toLocaleString("en-US")} proposed stories`);
  if (scale.height) parts.push(`${Math.round(scale.height).toLocaleString("en-US")} ft proposed height`);
  if (scale.cost) parts.push(`initial cost $${Math.round(scale.cost).toLocaleString("en-US")}`);
  return parts.length ? parts.join("; ") : "no large scale fields retained";
}

function applicationScore(row, scale) {
  let score = 0;
  score += Math.min(scale.floorArea / 1000, 900);
  score += Math.min(scale.units * 2, 700);
  score += Math.min(scale.height, 350);
  score += Math.min(scale.stories * 8, 250);
  score += Math.min(scale.cost / 100000, 250);
  if (cleanText(row.job_type) === "New Building") score += 180;
  if (cleanText(row.job_type).includes("ALT-CO")) score += 120;
  if (scale.publicLike) score += 140;
  if (yesFlag(row.general_construction_work_type_)) score += 40;
  if (yesFlag(row.foundation_work_type_)) score += 35;
  if (yesFlag(row.structural_work_type_)) score += 30;
  return score;
}

function isHighSignal(scale) {
  return scale.floorArea >= 75000 ||
    scale.units >= 50 ||
    scale.height >= 75 ||
    scale.stories >= 8 ||
    scale.cost >= 10000000 ||
    scale.publicLike;
}

function rejectionCounter(rejections) {
  const counts = {};
  for (const item of rejections) counts[item.reason] = (counts[item.reason] || 0) + 1;
  return counts;
}

function reject(rejections, row, reason, extra = {}) {
  if (rejections.length < 2000) {
    rejections.push({
      reason,
      source_dataset_id: extra.source_dataset_id || DATASETS.applications.id,
      job_filing_number: cleanText(row.job_filing_number),
      work_permit: cleanText(row.work_permit),
      source_record_id: extra.source_record_id || "",
      note: extra.note || ""
    });
  } else {
    rejections.push({ reason });
  }
}

function rankPermit(row, appDate) {
  const workType = cleanText(row.work_type);
  const typeRank = {
    "General Construction": 80,
    Foundation: 70,
    Structural: 60,
    Earthwork: 50,
    "Support of Excavation": 40
  }[workType] || 0;
  const date = parseDate(row.issued_date);
  const dateRank = date === appDate ? 10 : 0;
  const statusRank = cleanText(row.permit_status) === "Permit Issued" ? 6 : 4;
  return typeRank + dateRank + statusRank;
}

function choosePermit(rows, appDate) {
  return rows
    .slice()
    .sort((a, b) => {
      const rankDelta = rankPermit(b, appDate) - rankPermit(a, appDate);
      if (rankDelta) return rankDelta;
      const dateDelta = parseDate(a.issued_date).localeCompare(parseDate(b.issued_date));
      if (dateDelta) return dateDelta;
      return cleanText(a.work_permit).localeCompare(cleanText(b.work_permit));
    })[0];
}

function compactFields(row, fields) {
  const output = {};
  for (const field of fields) {
    const value = row[field];
    if (value !== undefined && value !== null && cleanText(value) !== "") output[field] = value;
  }
  return output;
}

function buildCandidate(app, permit, metadataContext) {
  const date = parseDate(permit.issued_date);
  const lat = Number(permit.latitude || app.latitude);
  const lon = Number(permit.longitude || app.longitude);
  const address = cleanAddress(permit) || cleanAddress(app);
  const borough = titleCaseBorough(permit.borough || app.borough);
  const jobType = cleanText(app.job_type);
  const workType = cleanText(permit.work_type);
  const scale = scaleForApplication(app);
  const sourceRecordId = sourceRecordIdForPermit(permit);
  const candidateId = `nyc_dob_now_rbx6_${slugify(cleanText(permit.work_permit), 64)}_${slugify(cleanText(permit.sequence_number) || "seq", 20)}_${slugify(cleanText(permit.tracking_number) || "tracking", 36)}_${date.replace(/-/g, "_")}`;
  const sourceUrl = permitSourceUrl(permit);
  const appUrl = applicationSourceUrl(app);
  const title = `NYC DOB NOW Build issued a ${workType} permit for a ${jobType} filing at ${address}`;
  const summary = [
    `NYC Department of Buildings Open Data records DOB NOW approved permit ${cleanText(permit.work_permit)} for ${address}, ${borough} on ${date}.`,
    `The permit row is tied to job filing ${cleanText(app.job_filing_number)}, whose DOB NOW job application row lists job_type '${jobType}', filing_status '${cleanText(app.filing_status)}', and scale fields: ${scaleLabel(scale)}.`
  ].join(" ");
  const limitations = [
    "DOB NOW permit and job filing rows are administrative records.",
    "This candidate records permit issuance only; it is not evidence of construction start, construction completion, opening, occupancy, final built form, safety, affordability, design quality, or outcome effects.",
    "Permit status such as 'Signed-off' is a permit lifecycle field and should not be treated as a certificate of occupancy.",
    "Source-reported cost, floor-area, unit, height, story, use, and status fields can be amended by later DOB records.",
    "Coordinates are DOB/Open Data geocoded address points, not surveyed parcels, entrances, building footprints, or work limits."
  ].join(" ");
  return {
    city: "nyc",
    city_id: "nyc",
    candidate_id: candidateId,
    event_id: candidateId,
    date,
    effective_date: date,
    date_precision: "day",
    effective_date_precision: "day",
    bucket: "planning/development/architecture/building_permits",
    title,
    summary,
    observed_change: `DOB recorded an administrative approved-permit issuance for ${workType} under a ${jobType} job filing at ${address}.`,
    area: `${address}, ${borough}, NY ${cleanText(permit.zip_code || app.postcode)}`,
    address,
    borough,
    latitude: lat,
    longitude: lon,
    geometry: {
      type: "Point",
      coordinates: [lon, lat]
    },
    source_id: DATASETS.permits.sourceId,
    source_ids: [
      DATASETS.permits.canonicalSourceId,
      DATASETS.applications.sourceId,
      DATASETS.permits.sourceId
    ],
    source_name: DATASETS.permits.name,
    publisher: DATASETS.permits.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API permit row, joined to official DOB NOW job application filing row",
    source_dataset_id: DATASETS.permits.sourceId,
    canonical_source_id: DATASETS.permits.canonicalSourceId,
    source_date_field: "issued_date from DOB NOW: Build - Approved Permits; job_type and scale fields joined from DOB NOW: Build - Job Application Filings by job_filing_number",
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use; Socrata metadata for the checked DOB views does not expose a dataset-specific license field.",
    license_url: "https://opendata.cityofnewyork.us/overview/#termsofuse",
    license_or_terms_note: "Factual row metadata and source URLs retained with DOB/NYC Open Data attribution. Check NYC Open Data and NYC.gov terms before bulk redistribution beyond candidate metadata.",
    attribution: "NYC Department of Buildings (DOB), via NYC Open Data",
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    project_type: `DOB NOW ${jobType} ${workType} approved permit`,
    geometry_source: "Latitude/longitude fields from the official DOB NOW: Build - Approved Permits row, cross-checked against the joined DOB NOW job application row when present.",
    geometry_precision: "DOB/Open Data geocoded address point; not a surveyed entrance, parcel polygon, building footprint, or work footprint",
    limitations,
    transformation_method: "Round133 Worker C generator queried DOB NOW job application rows with first_permit_date in the 2024-01-01 to 2026-05-19 window, retained high-signal New Building/Alteration CO/ALT-CO rows with NYC coordinates, removed exact job/permit/source-record duplicates found in the manual corpus and existing tmp candidate packs, joined selected jobs to DOB NOW approved permit rows, and retained one substantial initial permit row per job.",
    duplicate_check_note: "Exact job_filing_number, work_permit, tracking_number, source_record_id, source_url, candidate_id, and event_id tokens were screened against the manual architecture corpus and existing tmp candidate packs available during this run.",
    application_source_url: appUrl,
    application_source_record_id: cleanText(app.job_filing_number),
    application_source_dataset_id: DATASETS.applications.sourceId,
    permit_status: cleanText(permit.permit_status),
    job_filing_number: cleanText(app.job_filing_number),
    work_permit: cleanText(permit.work_permit),
    tracking_number: cleanText(permit.tracking_number),
    sequence_number: cleanText(permit.sequence_number),
    job_type: jobType,
    work_type: workType,
    filing_status: cleanText(app.filing_status),
    bbl: cleanText(permit.bbl || app.bbl),
    bin: cleanText(permit.bin || app.bin),
    block: cleanText(permit.block || app.block),
    lot: cleanText(permit.lot || app.lot),
    community_board: cleanText(permit.community_board || permit.c_b_no || app.commmunity_board),
    council_district: cleanText(permit.council_district || app.council_district),
    nta: cleanText(permit.nta || app.nta),
    scale_fields: {
      total_construction_floor_area: scale.floorArea,
      proposed_dwelling_units: scale.units,
      proposed_no_of_stories: scale.stories,
      proposed_height: scale.height,
      initial_cost: scale.cost,
      estimated_job_costs_from_permit: parseNumber(permit.estimated_job_costs)
    },
    source_row_ref: {
      dataset_id: DATASETS.permits.id,
      source_id: DATASETS.permits.sourceId,
      row_key: sourceRecordId,
      work_permit: cleanText(permit.work_permit),
      sequence_number: cleanText(permit.sequence_number),
      tracking_number: cleanText(permit.tracking_number),
      joined_application_dataset_id: DATASETS.applications.id,
      joined_application_source_id: DATASETS.applications.sourceId,
      joined_application_row_key: cleanText(app.job_filing_number),
      accessed_at: ACCESSED_AT
    },
    source_fields: {
      permit: compactFields(permit, PERMIT_SELECT),
      application: compactFields(app, APPLICATION_SELECT)
    },
    source_metadata: metadataContext
  };
}

function selectBalanced(candidates, target) {
  const sorted = candidates.slice().sort((a, b) => {
    const scoreDelta = b._score - a._score;
    if (scoreDelta) return scoreDelta;
    const dateDelta = cleanText(b.date).localeCompare(cleanText(a.date));
    if (dateDelta) return dateDelta;
    return cleanText(a.candidate_id).localeCompare(cleanText(b.candidate_id));
  });
  const selected = [];
  const byBorough = new Map();
  const cap = Math.ceil(target / 4);
  for (const candidate of sorted) {
    const borough = candidate.borough || "Unknown";
    const count = byBorough.get(borough) || 0;
    if (count >= cap) continue;
    selected.push(candidate);
    byBorough.set(borough, count + 1);
    if (selected.length >= target) break;
  }
  if (selected.length < target) {
    const ids = new Set(selected.map((candidate) => candidate.candidate_id));
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

async function loadMetadata() {
  const [applicationMetadata, permitMetadata] = await Promise.all([
    fetchJson(DATASETS.applications.metadata, "DOB NOW job application metadata"),
    fetchJson(DATASETS.permits.metadata, "DOB NOW approved permits metadata")
  ]);
  return { applicationMetadata, permitMetadata };
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
    license_url: "https://opendata.cityofnewyork.us/overview/#termsofuse"
  };
}

async function fetchApplicationRows() {
  const quotedJobTypes = APPLICATION_JOB_TYPES.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
  const where = [
    `first_permit_date between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
    `job_type in(${quotedJobTypes})`
  ].join(" AND ");
  return fetchAllRows(DATASETS.applications.id, {
    $select: APPLICATION_SELECT.join(","),
    $where: where,
    $order: "first_permit_date DESC"
  }, "DOB NOW application rows");
}

async function fetchPermitRows(jobFilingNumbers) {
  const rows = [];
  const chunks = [];
  for (let i = 0; i < jobFilingNumbers.length; i += 25) {
    chunks.push(jobFilingNumbers.slice(i, i + 25));
  }
  const workTypes = PERMIT_WORK_TYPES.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const quotedJobs = chunk.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
    const where = [
      `job_filing_number in(${quotedJobs})`,
      `issued_date between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      "filing_reason='Initial Permit'",
      "permit_status in('Permit Issued','Signed-off')",
      `work_type in(${workTypes})`
    ].join(" AND ");
    const batch = await fetchAllRows(DATASETS.permits.id, {
      $select: PERMIT_SELECT.join(","),
      $where: where,
      $order: "job_filing_number,issued_date"
    }, `DOB NOW permit rows chunk ${index + 1}/${chunks.length}`, 50000);
    rows.push(...batch);
  }
  return rows;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const existing = buildExistingIndex();
  console.log(`Duplicate index: ${existing.tokens.size} tokens from ${existing.filesRead} files`);

  const { applicationMetadata, permitMetadata } = await loadMetadata();
  const appMetaSummary = metadataSummary(DATASETS.applications, applicationMetadata);
  const permitMetaSummary = metadataSummary(DATASETS.permits, permitMetadata);

  const rejections = [];
  const applicationRows = await fetchApplicationRows();
  const scoredApplications = [];
  const seenJobs = new Set();
  const seenJobBases = new Set();
  for (const row of applicationRows) {
    const job = cleanText(row.job_filing_number);
    const jobBase = dobNowBaseNumber(job);
    const firstPermitDate = parseDate(row.first_permit_date);
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    const scale = scaleForApplication(row);
    if (!job) {
      reject(rejections, row, "missing_job_filing_number");
      continue;
    }
    if (seenJobs.has(job)) {
      reject(rejections, row, "duplicate_application_row_in_source", { note: "same job_filing_number already retained from application query" });
      continue;
    }
    if (seenJobBases.has(jobBase)) {
      reject(rejections, row, "duplicate_base_job_in_source", { note: `${jobBase} already represented by another retained DOB NOW filing` });
      continue;
    }
    if (tokenExists(existing, job) || tokenExists(existing, jobBase)) {
      reject(rejections, row, "existing_job_filing_number_or_base_job");
      continue;
    }
    if (!firstPermitDate || !inDateWindow(firstPermitDate)) {
      reject(rejections, row, "first_permit_date_outside_window");
      continue;
    }
    if (!isNycPoint(lat, lon)) {
      reject(rejections, row, "invalid_or_outside_nyc_application_geometry");
      continue;
    }
    if (!isHighSignal(scale)) {
      reject(rejections, row, "below_high_signal_scale_threshold");
      continue;
    }
    const score = applicationScore(row, scale);
    seenJobs.add(job);
    seenJobBases.add(jobBase);
    scoredApplications.push({ row, score, firstPermitDate });
  }

  scoredApplications.sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta) return scoreDelta;
    return b.firstPermitDate.localeCompare(a.firstPermitDate);
  });

  const permitLookupApplications = scoredApplications.slice(0, PERMIT_LOOKUP_LIMIT);
  const permitRows = await fetchPermitRows(permitLookupApplications.map((item) => cleanText(item.row.job_filing_number)));
  const permitsByJob = new Map();
  const seenPermitRecords = new Set();
  for (const permit of permitRows) {
    const job = cleanText(permit.job_filing_number);
    const recordId = sourceRecordIdForPermit(permit);
    const sourceUrl = permitSourceUrl(permit);
    if (!job) {
      reject(rejections, permit, "permit_missing_job_filing_number", { source_dataset_id: DATASETS.permits.id, source_record_id: recordId });
      continue;
    }
    if (seenPermitRecords.has(recordId)) {
      reject(rejections, permit, "duplicate_permit_row_in_source", { source_dataset_id: DATASETS.permits.id, source_record_id: recordId });
      continue;
    }
    seenPermitRecords.add(recordId);
    if (tokenExists(existing, recordId) || tokenExists(existing, cleanText(permit.work_permit)) || tokenExists(existing, cleanText(permit.tracking_number)) || tokenExists(existing, sourceUrl)) {
      reject(rejections, permit, "existing_permit_record", { source_dataset_id: DATASETS.permits.id, source_record_id: recordId });
      continue;
    }
    if (!parseDate(permit.issued_date) || !inDateWindow(parseDate(permit.issued_date))) {
      reject(rejections, permit, "permit_issue_date_outside_window", { source_dataset_id: DATASETS.permits.id, source_record_id: recordId });
      continue;
    }
    const lat = Number(permit.latitude);
    const lon = Number(permit.longitude);
    if (!isNycPoint(lat, lon)) {
      reject(rejections, permit, "invalid_or_outside_nyc_permit_geometry", { source_dataset_id: DATASETS.permits.id, source_record_id: recordId });
      continue;
    }
    if (!permitsByJob.has(job)) permitsByJob.set(job, []);
    permitsByJob.get(job).push(permit);
  }

  const metadataContext = {
    accessed_at: ACCESSED_AT,
    application_rows_updated_at_utc: appMetaSummary.rows_updated_at_utc,
    permit_rows_updated_at_utc: permitMetaSummary.rows_updated_at_utc
  };
  const candidatePool = [];
  for (const item of permitLookupApplications) {
    const app = item.row;
    const job = cleanText(app.job_filing_number);
    const permitOptions = permitsByJob.get(job) || [];
    if (!permitOptions.length) {
      reject(rejections, app, "no_nonduplicate_substantial_initial_permit_found");
      continue;
    }
    const permit = choosePermit(permitOptions, item.firstPermitDate);
    const candidate = buildCandidate(app, permit, metadataContext);
    candidate._score = item.score + rankPermit(permit, item.firstPermitDate);
    candidatePool.push(candidate);
  }

  const candidates = selectBalanced(candidatePool, TARGET_COUNT);
  const output = {
    schema_version: "round133.nyc_official_architecture_candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    worker: "Worker C",
    scope: "Official NYC DOB NOW Build approved-permit/job-filing candidate pack. Records are administrative permit/job milestones and must not be presented as construction start, completion, opening, occupancy, or outcome evidence.",
    candidate_count: candidates.length,
    source_audits: [
      {
        ...permitMetaSummary,
        reliability: "usable_with_caveats",
        coverage_years_checked: `${START_DATE} through ${END_DATE}, joined to DOB NOW job filings by job_filing_number.`,
        geographic_scope: "New York City DOB NOW construction permits with DOB/Open Data geocoded points.",
        granularity: "One approved permit row; this generator retains one substantial initial permit row per selected job filing.",
        key_fields_for_events: PERMIT_SELECT,
        required_caveats: [
          "Approved permit rows are administrative records, not construction start, completion, opening, occupancy, or final built-form evidence.",
          "Permit status and cost fields can be updated or corrected after the access date.",
          "Coordinates are geocoded address points and are not work footprints.",
          "The dataset excludes Electrical, Elevator, and Limited Alteration Application permit collections."
        ],
        ingestion_recommendation: "Use only as DOB permit/job milestone candidates with source-row citation and explicit limitations. Corroborate before making any physical-delivery claim.",
        rows_fetched: permitRows.length,
        candidates_retained: candidates.length
      },
      {
        ...appMetaSummary,
        reliability: "usable_with_caveats",
        coverage_years_checked: `Rows with first_permit_date ${START_DATE} through ${END_DATE}; job_type filtered to New Building, Alteration CO, and ALT-CO - New Building with Existing Elements to Remain.`,
        geographic_scope: "New York City DOB NOW Build job filings with BBL/BIN/address and latitude/longitude fields.",
        granularity: "One DOB NOW job filing row; used here as a scale/type join for the retained approved-permit row.",
        key_fields_for_events: APPLICATION_SELECT,
        required_caveats: [
          "Job filing rows are administrative filings and can be amended by later DOB records.",
          "First permit date is not a construction start, completion, opening, or occupancy date.",
          "Scale and use fields are source-reported filing attributes, not verified as-built conditions."
        ],
        ingestion_recommendation: "Use as joined context for permit rows and preserve job_filing_number, source URL, date fields, geometry fields, and limitations.",
        rows_fetched: applicationRows.length,
        high_signal_rows_after_duplicate_and_scale_filters: scoredApplications.length
      }
    ],
    selection_summary: {
      date_window: { start: START_DATE, end: END_DATE },
      duplicate_index_files_read: existing.filesRead,
      duplicate_index_tokens: existing.tokens.size,
      application_rows_fetched: applicationRows.length,
      application_rows_after_filters: scoredApplications.length,
      application_rows_sent_to_permit_lookup: permitLookupApplications.length,
      permit_rows_fetched: permitRows.length,
      candidate_pool_before_balancing: candidatePool.length,
      candidate_count: candidates.length,
      rejected_counts: rejectionCounter(rejections),
      selected_job_types: APPLICATION_JOB_TYPES,
      selected_permit_work_types: PERMIT_WORK_TYPES,
      high_signal_thresholds: {
        total_construction_floor_area_gte: 75000,
        proposed_dwelling_units_gte: 50,
        proposed_height_gte: 75,
        proposed_stories_gte: 8,
        initial_cost_gte: 10000000,
        public_owner_name_pattern: "NYCHA|SCHOOL CONSTRUCTION AUTHORITY|NYC|HOSPITAL|LIBRARY|PARKS|DORMITORY AUTHORITY|MTA|CUNY|HHC|HEALTH"
      }
    },
    candidates
  };

  const sourceAudit = {
    schema_version: "round133.nyc_official_architecture_source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Official NYC DOB NOW Build approved permits and job application filings, selected for architecture-change candidate discovery with administrative-record caveats.",
    sources: output.source_audits,
    selection_summary: output.selection_summary,
    caveat: "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, or outcomes unless another source explicitly supports that claim."
  };

  const rejectOutput = {
    schema_version: "round133.nyc_official_architecture_rejections.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_counts: rejectionCounter(rejections),
    sample_rejections: rejections.slice(0, 500)
  };

  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "source_audit.json"), `${JSON.stringify(sourceAudit, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "rejected.json"), `${JSON.stringify(rejectOutput, null, 2)}\n`);
  console.log(`Wrote ${candidates.length} candidates to ${path.join(OUT_DIR, "candidates.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
