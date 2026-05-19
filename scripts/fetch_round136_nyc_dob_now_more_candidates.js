const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2024-01-01";
const END_DATE = ACCESSED_AT;
const TARGET_COUNT = 120;
const OUT_DIR = "tmp/subagents/round136_nyc_dob_now_more";
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
  "approved_date",
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
      const normalized = fullPath.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (normalized === OUT_DIR) continue;
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
    publicLike: /NYCHA|SCHOOL CONSTRUCTION AUTHORITY|NYC|HOSPITAL|LIBRARY|PARKS|DORMITORY AUTHORITY|MTA|CUNY|HHC|HEALTH|UNIVERSITY|DEPARTMENT|AUTHORITY/i.test(cleanText(row.owner_s_business_name))
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
  score += Math.min(scale.floorArea / 1000, 800);
  score += Math.min(scale.units * 2, 600);
  score += Math.min(scale.height, 300);
  score += Math.min(scale.stories * 8, 220);
  score += Math.min(scale.cost / 100000, 220);
  if (cleanText(row.job_type) === "New Building") score += 180;
  if (cleanText(row.job_type).includes("ALT-CO")) score += 120;
  if (scale.publicLike) score += 140;
  if (yesFlag(row.general_construction_work_type_)) score += 40;
  if (yesFlag(row.foundation_work_type_)) score += 35;
  if (yesFlag(row.structural_work_type_)) score += 30;
  return score;
}

function isHighSignal(app, permit, scale) {
  const permitCost = parseNumber(permit.estimated_job_costs);
  const permitOwnerPublic = /NYCHA|SCHOOL CONSTRUCTION AUTHORITY|NYC|HOSPITAL|LIBRARY|PARKS|DORMITORY AUTHORITY|MTA|CUNY|HHC|HEALTH|UNIVERSITY|DEPARTMENT|AUTHORITY/i.test(cleanText(permit.owner_business_name));
  const jobType = cleanText(app.job_type);
  return APPLICATION_JOB_TYPES.includes(jobType) &&
    (scale.floorArea >= 50000 ||
      scale.units >= 40 ||
      scale.height >= 60 ||
      scale.stories >= 7 ||
      scale.cost >= 7500000 ||
      permitCost >= 7500000 ||
      scale.publicLike ||
      permitOwnerPublic);
}

function rejectionCounter(rejections) {
  const counts = {};
  for (const item of rejections) counts[item.reason] = (counts[item.reason] || 0) + 1;
  return counts;
}

function reject(rejections, row, reason, extra = {}) {
  if (rejections.length < 3000) {
    rejections.push({
      reason,
      source_dataset_id: extra.source_dataset_id || DATASETS.permits.id,
      job_filing_number: cleanText(row.job_filing_number),
      work_permit: cleanText(row.work_permit),
      source_record_id: extra.source_record_id || "",
      note: extra.note || ""
    });
  } else {
    rejections.push({ reason });
  }
}

function rankPermit(row) {
  const workType = cleanText(row.work_type);
  const typeRank = {
    "General Construction": 90,
    Foundation: 75,
    Structural: 65,
    Earthwork: 45,
    "Support of Excavation": 35
  }[workType] || 0;
  const statusRank = cleanText(row.permit_status) === "Permit Issued" ? 8 : 4;
  const costRank = Math.min(parseNumber(row.estimated_job_costs) / 100000, 180);
  return typeRank + statusRank + costRank;
}

function chooseApplicationForBase(base, applicationsByExactJob) {
  const options = [];
  for (const [job, rows] of applicationsByExactJob.entries()) {
    if (dobNowBaseNumber(job) === base) {
      for (const row of rows) options.push(row);
    }
  }
  return options
    .slice()
    .sort((a, b) => {
      const scoreDelta = applicationScore(b, scaleForApplication(b)) - applicationScore(a, scaleForApplication(a));
      if (scoreDelta) return scoreDelta;
      return cleanText(a.job_filing_number).localeCompare(cleanText(b.job_filing_number));
    })[0] || null;
}

function compactFields(row, fields) {
  const output = {};
  for (const field of fields) {
    const value = row[field];
    if (value !== undefined && value !== null && cleanText(value) !== "") output[field] = value;
  }
  return output;
}

function buildCandidate(app, permit, metadataContext, selectionMode) {
  const date = parseDate(permit.issued_date);
  const lat = Number(permit.latitude || app.latitude);
  const lon = Number(permit.longitude || app.longitude);
  const address = cleanAddress(permit) || cleanAddress(app);
  const borough = titleCaseBorough(permit.borough || app.borough);
  const jobType = cleanText(app.job_type);
  const workType = cleanText(permit.work_type);
  const scale = scaleForApplication(app);
  const sourceRecordId = sourceRecordIdForPermit(permit);
  const candidateId = `nyc_dob_now_more_rbx6_${slugify(cleanText(permit.work_permit), 64)}_${slugify(cleanText(permit.sequence_number) || "seq", 20)}_${slugify(cleanText(permit.tracking_number) || "tracking", 36)}_${date.replace(/-/g, "_")}`;
  const sourceUrl = permitSourceUrl(permit);
  const appUrl = applicationSourceUrl(app);
  const title = `NYC DOB NOW Build recorded an approved ${workType} permit for a ${jobType} filing at ${address}`;
  const summary = [
    `NYC Department of Buildings Open Data records DOB NOW approved permit ${cleanText(permit.work_permit)} for ${address}, ${borough} with issued_date ${date}.`,
    `The permit row is tied to job filing ${cleanText(app.job_filing_number)}, whose DOB NOW job application row lists job_type '${jobType}', filing_status '${cleanText(app.filing_status)}', and scale fields: ${scaleLabel(scale)}.`
  ].join(" ");
  const limitations = [
    "DOB NOW permit and job filing rows are administrative records.",
    "This candidate records permit issuance only; it is not evidence of construction start, construction completion, public opening, occupancy, final built form, safety, affordability, design quality, or outcome effects.",
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
    source_date_field: "issued_date from DOB NOW: Build - Approved Permits; job_type and scale fields joined from DOB NOW: Build - Job Application Filings by job_filing_number or DOB NOW base job number",
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
    transformation_method: `Round136 generator queried DOB NOW approved permit rows directly for ${START_DATE} through ${END_DATE}, joined them to DOB NOW job application rows, retained one nonduplicate high-signal administrative permit row per base DOB NOW job, and preserved row-level permit/application provenance. Selection mode: ${selectionMode}.`,
    duplicate_check_note: "Exact job_filing_number, base DOB NOW job number, work_permit, tracking_number, source_record_id, source_url, candidate_id, and event_id tokens were screened against the manual architecture corpus and existing tmp candidate packs available during this run.",
    application_source_url: appUrl,
    application_source_record_id: cleanText(app.job_filing_number),
    application_source_dataset_id: DATASETS.applications.sourceId,
    permit_status: cleanText(permit.permit_status),
    job_filing_number: cleanText(app.job_filing_number),
    base_job_filing_number: dobNowBaseNumber(app.job_filing_number || permit.job_filing_number),
    permit_job_filing_number: cleanText(permit.job_filing_number),
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
      canonical_source_id: DATASETS.permits.canonicalSourceId,
      row_key: sourceRecordId,
      work_permit: cleanText(permit.work_permit),
      sequence_number: cleanText(permit.sequence_number),
      tracking_number: cleanText(permit.tracking_number),
      joined_application_dataset_id: DATASETS.applications.id,
      joined_application_source_id: DATASETS.applications.sourceId,
      joined_application_row_key: cleanText(app.job_filing_number),
      base_job_filing_number: dobNowBaseNumber(app.job_filing_number || permit.job_filing_number),
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
  const byWorkType = new Map();
  const boroughCap = Math.ceil(target / 3);
  const workTypeCap = Math.ceil(target / 2);
  for (const candidate of sorted) {
    const borough = candidate.borough || "Unknown";
    const workType = candidate.work_type || "Unknown";
    if ((byBorough.get(borough) || 0) >= boroughCap) continue;
    if ((byWorkType.get(workType) || 0) >= workTypeCap) continue;
    selected.push(candidate);
    byBorough.set(borough, (byBorough.get(borough) || 0) + 1);
    byWorkType.set(workType, (byWorkType.get(workType) || 0) + 1);
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

async function fetchPermitRows() {
  const workTypes = PERMIT_WORK_TYPES.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
  const where = [
    `issued_date between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
    "filing_reason='Initial Permit'",
    "permit_status in('Permit Issued','Signed-off')",
    `work_type in(${workTypes})`
  ].join(" AND ");
  return fetchAllRows(DATASETS.permits.id, {
    $select: PERMIT_SELECT.join(","),
    $where: where,
    $order: "issued_date DESC,tracking_number"
  }, "DOB NOW approved permit rows", 50000);
}

async function fetchApplicationRows() {
  const quotedJobTypes = APPLICATION_JOB_TYPES.map((value) => `'${value.replace(/'/g, "''")}'`).join(",");
  const where = [
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
    `job_type in(${quotedJobTypes})`
  ].join(" AND ");
  return fetchAllRows(DATASETS.applications.id, {
    $select: APPLICATION_SELECT.join(","),
    $where: where,
    $order: "job_filing_number"
  }, "DOB NOW target application rows", 50000);
}

function validateCandidates(candidates) {
  const ids = new Set();
  const sourceKeys = new Set();
  const bases = new Set();
  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  const required = [
    "city_id",
    "candidate_id",
    "event_id",
    "date",
    "title",
    "summary",
    "observed_change",
    "latitude",
    "longitude",
    "source_ids",
    "source_name",
    "publisher",
    "source_url",
    "source_record_id",
    "source_type",
    "source_date_field",
    "confidence",
    "geometry_source",
    "geometry_precision",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "transformation_method"
  ];
  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (!candidate.source_ids.includes("nyc-dob-filings-permits")) {
      throw new Error(`Missing canonical nyc-dob-filings-permits source id for ${candidate.candidate_id}`);
    }
    if (!isNycPoint(Number(candidate.latitude), Number(candidate.longitude))) {
      throw new Error(`Invalid NYC point for ${candidate.candidate_id}`);
    }
    if (banned.test([candidate.title, candidate.summary, candidate.observed_change, candidate.limitations, candidate.transformation_method].join(" "))) {
      throw new Error(`Overclaim wording detected for ${candidate.candidate_id}`);
    }
    if (ids.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    const sourceKey = `${candidate.source_url}|${candidate.source_record_id}`;
    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source row ${sourceKey}`);
    sourceKeys.add(sourceKey);
    const base = candidate.base_job_filing_number;
    if (bases.has(base)) throw new Error(`Duplicate base DOB NOW job ${base}`);
    bases.add(base);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const existing = buildExistingIndex();
  console.log(`Duplicate index: ${existing.tokens.size} tokens from ${existing.filesRead} files`);

  const { applicationMetadata, permitMetadata } = await loadMetadata();
  const appMetaSummary = metadataSummary(DATASETS.applications, applicationMetadata);
  const permitMetaSummary = metadataSummary(DATASETS.permits, permitMetadata);

  const rejections = [];
  const permitRows = await fetchPermitRows();
  const candidatePermits = [];
  const seenPermitRecords = new Set();
  const seenBaseJobs = new Set();

  for (const permit of permitRows) {
    const recordId = sourceRecordIdForPermit(permit);
    const sourceUrl = permitSourceUrl(permit);
    const date = parseDate(permit.issued_date);
    const job = cleanText(permit.job_filing_number);
    const baseJob = dobNowBaseNumber(job);
    const lat = Number(permit.latitude);
    const lon = Number(permit.longitude);
    if (!job) {
      reject(rejections, permit, "missing_permit_job_filing_number", { source_record_id: recordId });
      continue;
    }
    if (seenPermitRecords.has(recordId)) {
      reject(rejections, permit, "duplicate_permit_row_in_source", { source_record_id: recordId });
      continue;
    }
    seenPermitRecords.add(recordId);
    if (seenBaseJobs.has(baseJob)) {
      reject(rejections, permit, "duplicate_base_job_in_permit_query", { source_record_id: recordId, note: `${baseJob} already retained from permit query` });
      continue;
    }
    if (tokenExists(existing, job) ||
      tokenExists(existing, baseJob) ||
      tokenExists(existing, recordId) ||
      tokenExists(existing, cleanText(permit.work_permit)) ||
      tokenExists(existing, cleanText(permit.tracking_number)) ||
      tokenExists(existing, sourceUrl)) {
      reject(rejections, permit, "existing_job_or_permit_record", { source_record_id: recordId });
      continue;
    }
    if (!date || !inDateWindow(date)) {
      reject(rejections, permit, "permit_issue_date_outside_window", { source_record_id: recordId });
      continue;
    }
    if (!isNycPoint(lat, lon)) {
      reject(rejections, permit, "invalid_or_outside_nyc_permit_geometry", { source_record_id: recordId });
      continue;
    }
    seenBaseJobs.add(baseJob);
    candidatePermits.push(permit);
  }

  candidatePermits.sort((a, b) => {
    const rankDelta = rankPermit(b) - rankPermit(a);
    if (rankDelta) return rankDelta;
    return parseDate(b.issued_date).localeCompare(parseDate(a.issued_date));
  });

  const applicationRows = await fetchApplicationRows();
  const applicationsByExactJob = new Map();
  for (const app of applicationRows) {
    const job = cleanText(app.job_filing_number);
    if (!applicationsByExactJob.has(job)) applicationsByExactJob.set(job, []);
    applicationsByExactJob.get(job).push(app);
  }

  const metadataContext = {
    accessed_at: ACCESSED_AT,
    application_rows_updated_at_utc: appMetaSummary.rows_updated_at_utc,
    permit_rows_updated_at_utc: permitMetaSummary.rows_updated_at_utc
  };

  const candidatePool = [];
  for (const permit of candidatePermits) {
    const job = cleanText(permit.job_filing_number);
    const baseJob = dobNowBaseNumber(job);
    const exactApp = (applicationsByExactJob.get(job) || [])[0];
    const app = exactApp || chooseApplicationForBase(baseJob, applicationsByExactJob);
    if (!app) {
      reject(rejections, permit, "no_joined_application_row", { source_record_id: sourceRecordIdForPermit(permit) });
      continue;
    }
    const appJob = cleanText(app.job_filing_number);
    const scale = scaleForApplication(app);
    if (tokenExists(existing, appJob) || tokenExists(existing, dobNowBaseNumber(appJob))) {
      reject(rejections, permit, "joined_application_existing_job", { source_record_id: sourceRecordIdForPermit(permit) });
      continue;
    }
    if (!APPLICATION_JOB_TYPES.includes(cleanText(app.job_type))) {
      reject(rejections, permit, "joined_application_not_target_job_type", { source_record_id: sourceRecordIdForPermit(permit), note: cleanText(app.job_type) });
      continue;
    }
    if (!isNycPoint(Number(app.latitude), Number(app.longitude))) {
      reject(rejections, permit, "invalid_or_outside_nyc_application_geometry", { source_record_id: sourceRecordIdForPermit(permit) });
      continue;
    }
    if (!isHighSignal(app, permit, scale)) {
      reject(rejections, permit, "below_high_signal_scale_threshold", { source_record_id: sourceRecordIdForPermit(permit) });
      continue;
    }
    const candidate = buildCandidate(app, permit, metadataContext, exactApp ? "exact job_filing_number join" : "base DOB NOW job fallback join");
    candidate._score = applicationScore(app, scale) + rankPermit(permit);
    candidatePool.push(candidate);
  }

  const candidates = selectBalanced(candidatePool, TARGET_COUNT);
  validateCandidates(candidates);

  const output = {
    schema_version: "round136.nyc_dob_now_more_candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    worker: "Round136 NYC DOB NOW more candidates",
    scope: "Official NYC DOB NOW Build approved-permit/job-filing candidate pack. Records are administrative permit/job milestones and must not be presented as construction start, completion, opening, occupancy, or outcome evidence.",
    candidate_count: candidates.length,
    source_audits: [
      {
        ...permitMetaSummary,
        reliability: "usable_with_caveats",
        coverage_years_checked: `${START_DATE} through ${END_DATE}; this round paginated approved permit rows directly before joining job filings.`,
        geographic_scope: "New York City DOB NOW construction permits with DOB/Open Data geocoded points.",
        granularity: "One approved permit row; this generator retains one substantial initial permit row per base DOB NOW job filing.",
        key_fields_for_events: PERMIT_SELECT,
        required_caveats: [
          "Approved permit rows are administrative records, not construction start, completion, opening, occupancy, or final built-form evidence.",
          "Permit status and cost fields can be updated or corrected after the access date.",
          "Coordinates are geocoded address points and are not work footprints.",
          "The dataset excludes Electrical, Elevator, and Limited Alteration Application permit collections."
        ],
        ingestion_recommendation: "Use only as DOB permit/job milestone candidates with source-row citation and explicit limitations. Corroborate before making any physical-delivery claim.",
        rows_fetched: permitRows.length,
        rows_after_duplicate_and_geometry_filters: candidatePermits.length,
        candidates_retained: candidates.length
      },
      {
        ...appMetaSummary,
        reliability: "usable_with_caveats",
        coverage_years_checked: `Rows joined from the directly paginated permit set; job_type filtered to New Building, Alteration CO, and ALT-CO - New Building with Existing Elements to Remain.`,
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
        candidates_retained: candidates.length
      }
    ],
    selection_summary: {
      date_window: { start: START_DATE, end: END_DATE },
      duplicate_index_files_read: existing.filesRead,
      duplicate_index_tokens: existing.tokens.size,
      permit_rows_fetched: permitRows.length,
      permit_rows_after_duplicate_and_geometry_filters: candidatePermits.length,
      application_rows_fetched: applicationRows.length,
      candidate_pool_before_balancing: candidatePool.length,
      candidate_count: candidates.length,
      rejected_counts: rejectionCounter(rejections),
      selected_job_types: APPLICATION_JOB_TYPES,
      selected_permit_work_types: PERMIT_WORK_TYPES,
      high_signal_thresholds: {
        total_construction_floor_area_gte: 50000,
        proposed_dwelling_units_gte: 40,
        proposed_height_gte: 60,
        proposed_stories_gte: 7,
        initial_cost_or_estimated_job_costs_gte: 7500000,
        public_owner_name_pattern: "NYCHA|SCHOOL CONSTRUCTION AUTHORITY|NYC|HOSPITAL|LIBRARY|PARKS|DORMITORY AUTHORITY|MTA|CUNY|HHC|HEALTH|UNIVERSITY|DEPARTMENT|AUTHORITY"
      }
    },
    candidates
  };

  const sourceAudit = {
    schema_version: "round136.nyc_dob_now_more_source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    audit_scope: "Official NYC DOB NOW Build approved permits and job application filings, selected for more architecture-change candidate discovery with administrative-record caveats.",
    sources: output.source_audits,
    selection_summary: output.selection_summary,
    caveat: "DOB permits/job filings are administrative records. Do not present them as evidence of construction start, construction completion, opening, occupancy, or outcomes unless another source explicitly supports that claim."
  };

  const rejectOutput = {
    schema_version: "round136.nyc_dob_now_more_rejections.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_counts: rejectionCounter(rejections),
    sample_rejections: rejections.slice(0, 500)
  };

  const notes = [
    "# Round136 NYC DOB NOW More Candidate Pack",
    "",
    `Generated ${candidates.length} administrative DOB NOW approved-permit candidates on ${ACCESSED_AT}.`,
    "",
    "## Scope",
    "",
    "Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.",
    "",
    "## Caveats",
    "",
    "- Rows are administrative permit/job filing records only.",
    "- They do not document construction start, construction completion, public opening, occupancy, final built form, or outcome effects.",
    "- Scale fields are source-reported filing attributes and can be amended by later DOB records.",
    "- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.",
    "- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.",
    "",
    "## Duplicate Screening",
    "",
    `Screened against ${existing.filesRead} manual-corpus/tmp candidate files and ${existing.tokens.size} exact identifier tokens, including round133 selected jobs.`
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "source_audit.json"), `${JSON.stringify(sourceAudit, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "rejected.json"), `${JSON.stringify(rejectOutput, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notes}\n`);
  console.log(`Wrote ${candidates.length} candidates to ${path.join(OUT_DIR, "candidates.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
