const fs = require("fs");
const path = require("path");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outDir = "tmp/subagents/round117_nyc_local_dob_bulk";
const accessedAt = "2026-05-19";
const startDate = "2008-01-01";
const endDate = accessedAt;

const DATASETS = {
  dobNowCo: {
    id: "pkdm-hqz6",
    sourceId: "nyc-dob-now-co-pkdm-hqz6",
    name: "NYC Open Data: DOB NOW Certificate of Occupancy",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Certificate-of-Occupancy/pkdm-hqz6"
  },
  legacyCo: {
    id: "bs8b-p36w",
    sourceId: "nyc-dob-co-bs8b-p36w",
    name: "NYC Open Data: DOB Certificate Of Occupancy",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w"
  },
  dobNowBuild: {
    id: "w9ak-ipjd",
    sourceId: "nyc-dob-filings-permits",
    name: "NYC Open Data: DOB NOW Build Job Application Filings",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd"
  },
  legacyFilings: {
    id: "ic3t-wcy2",
    sourceId: "nyc-dob-filings-permits",
    name: "NYC Open Data: DOB Job Application Filings",
    publisher: "NYC Department of Buildings (DOB), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2"
  }
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 96)
    .replace(/_+$/g, "");
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})/);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

function inWindow(date) {
  return date >= startDate && date <= endDate;
}

function isNycPoint(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= 40.4774 && lat <= 40.9176 && lon >= -74.2591 && lon <= -73.7004;
}

function cleanAddress(parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function titleCaseBorough(value) {
  const text = String(value || "").trim().toLowerCase();
  const map = { manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens", bronx: "Bronx", "staten island": "Staten Island" };
  return map[text] || String(value || "").trim();
}

function socrataUrl(datasetId, params) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fetchJsonWithRetry(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      const waitMs = 1000 * attempt * attempt;
      console.warn(`${label}: request attempt ${attempt} failed (${error.message}); retrying in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function fetchAll(datasetId, params, label, pageSize = 20000, maxRows = 500000) {
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const url = socrataUrl(datasetId, { ...params, $limit: String(pageSize), $offset: String(offset) });
    const page = await fetchJsonWithRetry(url, `${label} offset ${offset}`);
    rows.push(...page);
    console.log(`${label}: fetched ${rows.length}`);
    if (page.length < pageSize) break;
  }
  return rows;
}

function buildExistingIndex(corpus) {
  const ids = new Set();
  const urls = new Set();
  for (const event of corpus.events || []) {
    if (event.source_record_id) ids.add(String(event.source_record_id));
    if (event.source_url) urls.add(String(event.source_url));
    for (const sourceId of event.source_ids || []) {
      if (event.source_record_id) ids.add(`${sourceId}:${event.source_record_id}`);
    }
  }
  return { ids, urls };
}

function appearsExisting(existing, dataset, id) {
  const token = String(id || "");
  if (!token) return false;
  if (existing.ids.has(token) || existing.ids.has(`${dataset.sourceId}:${token}`)) return true;
  for (const existingId of existing.ids) {
    if (existingId.includes(token)) return true;
  }
  for (const url of existing.urls) {
    if (url.includes(encodeURIComponent(token)) || url.includes(token)) return true;
  }
  return false;
}

function scaleLabel({ units, floorArea, height, stories, cost }) {
  const pieces = [];
  if (units) pieces.push(`${units} dwelling units`);
  if (floorArea) pieces.push(`${Math.round(floorArea).toLocaleString("en-US")} sq ft`);
  if (height) pieces.push(`${height} ft proposed height`);
  if (stories) pieces.push(`${stories} proposed stories`);
  if (cost) pieces.push(`reported initial cost $${Math.round(cost).toLocaleString("en-US")}`);
  return pieces.length ? pieces.join("; ") : "scale fields not supplied";
}

function scoreRecord({ units, floorArea, height, stories, cost, newBuilding, finalLike, publicLike }) {
  let score = 0;
  if (units >= 50) score += 120 + Math.min(units, 500);
  if (floorArea >= 50000) score += 100 + Math.min(floorArea / 1000, 500);
  if (height >= 75) score += 50 + Math.min(height / 4, 100);
  if (stories >= 8) score += 40 + Math.min(stories * 2, 80);
  if (cost >= 10000000) score += 40 + Math.min(cost / 1000000, 100);
  if (newBuilding) score += 40;
  if (finalLike) score += 20;
  if (publicLike) score += 20;
  return score;
}

function isHighSignal(scale) {
  return scale.units >= 50 ||
    scale.floorArea >= 50000 ||
    scale.height >= 75 ||
    scale.stories >= 8 ||
    scale.cost >= 10000000 ||
    scale.publicLike;
}

function reject(rejected, row, dataset, reason) {
  rejected.push({
    source_dataset_id: dataset.id,
    source_record_id: row.application_number || row.job_number || row.job_filing_number || row.job__ || row.job_filing_name || "",
    reason
  });
}

function commonCandidateFields(dataset, row, sourceRecordId, address, borough, lat, lon, date, sourceDateField, projectType, scale, sourceUrl) {
  const scaleText = scaleLabel(scale);
  return {
    city_id: "nyc",
    date,
    date_precision: "day",
    source_ids: [dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: accessedAt,
    source_date_field: sourceDateField,
    latitude: lat,
    longitude: lon,
    geometry_source: "Official NYC Open Data row latitude/longitude field.",
    geometry_precision: "official geocoded point; not a surveyed building footprint or work-area polygon",
    confidence: "documented",
    project_type: projectType,
    license_or_terms_note: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for any dataset-specific license notes.",
    attribution: dataset.publisher,
    limitations: "This record documents an administrative DOB milestone for the cited building, job, filing, or occupancy certificate. It is not by itself evidence of construction start, construction completion, public opening, occupancy level, design quality, affordability, safety condition, or causal effects.",
    scale_note: scaleText,
    area: `${address}, ${borough}, New York City`,
    row_fields: row
  };
}

function dobNowCoCandidate(row, existing, rejected) {
  const dataset = DATASETS.dobNowCo;
  const sourceRecordId = row.application_number || row.c_of_o_number || row.job_filing_name;
  if (appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate DOB NOW CO source record already appears in manual corpus.");
    return null;
  }
  const date = parseDate(row.c_of_o_issuance_date || row.submitted_date);
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const borough = titleCaseBorough(row.borough);
  const address = cleanAddress([row.house_no, row.street_name]);
  const units = parseNumber(row.number_of_dwelling_units);
  const newBuilding = /new building/i.test(row.job_type || "");
  const finalLike = /final|initial/i.test(row.c_of_o_filing_type || "") || /issued/i.test(row.c_of_o_status || "");
  const scale = { units, floorArea: 0, height: 0, stories: 0, cost: 0, newBuilding, finalLike, publicLike: false };
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window DOB NOW CO issuance/submitted date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city DOB NOW CO coordinates.");
    return null;
  }
  if (!isHighSignal(scale)) {
    reject(rejected, row, dataset, "Below high-signal threshold for DOB NOW CO candidate.");
    return null;
  }
  const sourceUrl = socrataUrl(dataset.id, { application_number: sourceRecordId });
  const base = commonCandidateFields(
    dataset,
    row,
    sourceRecordId,
    address,
    borough,
    lat,
    lon,
    date,
    "c_of_o_issuance_date normalized when parseable; submitted_date retained in raw row.",
    "DOB NOW certificate of occupancy",
    scale,
    sourceUrl
  );
  const id = slugify(`nyc_arch_dob_now_co_bulk_${sourceRecordId}`);
  return {
    ...base,
    candidate_id: id,
    event_id: id,
    title: `DOB NOW ${row.c_of_o_filing_type || "CO"} issued for ${address}`,
    summary: `${dataset.publisher} records ${row.c_of_o_status || "a certificate-of-occupancy status"} for ${address} as ${row.job_type || "a DOB NOW job"} with ${scaleLabel(scale)}.`,
    observed_change: "NYC DOB recorded a certificate-of-occupancy issuance/status milestone for the cited building or job.",
    transformation_method: `Round117 local DOB bulk fetch from ${dataset.id}; selected because units/scale fields met high-signal threshold; duplicate screened against existing manual corpus.`
  };
}

function legacyCoCandidate(row, existing, rejected) {
  const dataset = DATASETS.legacyCo;
  const date = parseDate(row.c_o_issue_date);
  const issueType = row.issue_type || "";
  const sourceRecordId = `job ${row.job_number} / ${date} ${issueType}`.trim();
  if (appearsExisting(existing, dataset, row.job_number) || appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate legacy DOB CO source record already appears in manual corpus.");
    return null;
  }
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const borough = titleCaseBorough(row.borough);
  const address = cleanAddress([row.house_number, row.street_name]);
  const units = Math.max(parseNumber(row.pr_dwelling_unit), parseNumber(row.ex_dwelling_unit));
  const newBuilding = /^NB$/i.test(row.job_type || "");
  const finalLike = /final|temporary/i.test(issueType) && /issued/i.test(row.application_status_raw || "");
  const scale = { units, floorArea: 0, height: 0, stories: 0, cost: 0, newBuilding, finalLike, publicLike: false };
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window legacy DOB CO issue date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city legacy DOB CO coordinates.");
    return null;
  }
  if (!isHighSignal(scale)) {
    reject(rejected, row, dataset, "Below high-signal threshold for legacy DOB CO candidate.");
    return null;
  }
  const sourceUrl = socrataUrl(dataset.id, { job_number: row.job_number });
  const base = commonCandidateFields(
    dataset,
    row,
    sourceRecordId,
    address,
    borough,
    lat,
    lon,
    date,
    "c_o_issue_date",
    "DOB certificate of occupancy",
    scale,
    sourceUrl
  );
  const id = slugify(`nyc_arch_dob_legacy_co_bulk_${row.job_number}_${date}_${issueType}`);
  return {
    ...base,
    candidate_id: id,
    event_id: id,
    title: `DOB ${issueType || "certificate of occupancy"} for ${address}`,
    summary: `${dataset.publisher} records a ${issueType || "certificate-of-occupancy"} issue for job ${row.job_number} at ${address}; source dwelling-unit fields indicate ${scaleLabel(scale)}.`,
    observed_change: "NYC DOB recorded a certificate-of-occupancy issuance/status milestone for the cited building or job.",
    transformation_method: `Round117 local DOB bulk fetch from ${dataset.id}; selected because dwelling-unit fields met high-signal threshold; duplicate screened against existing manual corpus.`
  };
}

function dobNowBuildCandidate(row, existing, rejected) {
  const dataset = DATASETS.dobNowBuild;
  const sourceRecordId = row.job_filing_number;
  if (appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate DOB NOW Build source record already appears in manual corpus.");
    return null;
  }
  const date = parseDate(row.signoff_date || row.first_permit_date || row.approved_date || row.current_status_date || row.filing_date);
  const sourceDateField = row.signoff_date ? "signoff_date" : row.first_permit_date ? "first_permit_date" : row.approved_date ? "approved_date" : row.current_status_date ? "current_status_date" : "filing_date";
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const borough = titleCaseBorough(row.borough);
  const address = cleanAddress([row.house_no, row.street_name]);
  const units = parseNumber(row.proposed_dwelling_units);
  const floorArea = parseNumber(row.total_construction_floor_area);
  const height = parseNumber(row.proposed_height);
  const stories = parseNumber(row.proposed_no_of_stories);
  const cost = parseNumber(row.initial_cost);
  const newBuilding = /new building/i.test(row.job_type || "");
  const finalLike = /LOC Issued|CO Issued|Permit Entire|Approved/i.test(row.filing_status || "");
  const publicLike = /city|nyc|school|hospital|library|authority|department|university/i.test(row.owner_s_business_name || "");
  const scale = { units, floorArea, height, stories, cost, newBuilding, finalLike, publicLike };
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window DOB NOW Build milestone date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city DOB NOW Build coordinates.");
    return null;
  }
  if (!isHighSignal(scale)) {
    reject(rejected, row, dataset, "Below high-signal threshold for DOB NOW Build candidate.");
    return null;
  }
  const sourceUrl = socrataUrl(dataset.id, { job_filing_number: sourceRecordId });
  const base = commonCandidateFields(
    dataset,
    row,
    sourceRecordId,
    address,
    borough,
    lat,
    lon,
    date,
    sourceDateField,
    "DOB NOW Build job filing",
    scale,
    sourceUrl
  );
  const id = slugify(`nyc_arch_dob_now_build_${sourceRecordId}`);
  return {
    ...base,
    candidate_id: id,
    event_id: id,
    title: `DOB NOW Build ${row.filing_status || "filing"} milestone for ${address}`,
    summary: `${dataset.publisher} records ${row.filing_status || "a filing status"} for ${sourceRecordId} at ${address}; source scale fields show ${scaleLabel(scale)}.`,
    observed_change: "NYC DOB recorded a DOB NOW Build filing, permit, approval, signoff, or related administrative milestone for the cited project.",
    transformation_method: `Round117 local DOB bulk fetch from ${dataset.id}; selected because source scale/status fields met high-signal threshold; duplicate screened against existing manual corpus.`
  };
}

function legacyFilingCandidate(row, existing, rejected) {
  const dataset = DATASETS.legacyFilings;
  const sourceRecordId = row.job__;
  if (appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate legacy DOB Job Application source record already appears in manual corpus.");
    return null;
  }
  const date = parseDate(row.signoff_date || row.latest_action_date || row.approved || row.fully_permitted || row.pre__filing_date);
  const sourceDateField = row.signoff_date ? "signoff_date" : row.latest_action_date ? "latest_action_date" : row.approved ? "approved" : row.fully_permitted ? "fully_permitted" : "pre__filing_date";
  const lat = parseNumber(row.gis_latitude);
  const lon = parseNumber(row.gis_longitude);
  const borough = titleCaseBorough(row.borough);
  const address = cleanAddress([row.house__, row.street_name]);
  const units = parseNumber(row.proposed_dwelling_units);
  const floorArea = Math.max(parseNumber(row.proposed_zoning_sqft), parseNumber(row.total_construction_floor_area), parseNumber(row.enlargement_sq_footage));
  const height = parseNumber(row.proposed_height);
  const stories = parseNumber(row.proposed_no_of_stories);
  const cost = parseNumber(row.initial_cost);
  const newBuilding = /^NB$/i.test(row.job_type || "");
  const finalLike = /SIGNED OFF|PERMIT ISSUED|PLAN EXAM - APPROVED/i.test(row.job_status_descrp || "");
  const publicLike = /city|nyc|school|hospital|library|authority|department|university/i.test(row.owner_s_business_name || "");
  const scale = { units, floorArea, height, stories, cost, newBuilding, finalLike, publicLike };
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window legacy DOB filing milestone date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city legacy DOB filing coordinates.");
    return null;
  }
  if (!isHighSignal(scale)) {
    reject(rejected, row, dataset, "Below high-signal threshold for legacy DOB Job Application candidate.");
    return null;
  }
  const sourceUrl = socrataUrl(dataset.id, { job__: sourceRecordId });
  const base = commonCandidateFields(
    dataset,
    row,
    sourceRecordId,
    address,
    borough,
    lat,
    lon,
    date,
    sourceDateField,
    "DOB job application filing",
    scale,
    sourceUrl
  );
  const id = slugify(`nyc_arch_dob_legacy_filing_${sourceRecordId}`);
  return {
    ...base,
    candidate_id: id,
    event_id: id,
    title: `DOB ${row.job_status_descrp || "filing"} milestone for ${address}`,
    summary: `${dataset.publisher} records ${row.job_status_descrp || "a job application status"} for job ${sourceRecordId} at ${address}; source scale fields show ${scaleLabel(scale)}.`,
    observed_change: "NYC DOB recorded a job-application, approval, permit, signoff, or related administrative milestone for the cited project.",
    transformation_method: `Round117 local DOB bulk fetch from ${dataset.id}; selected because source scale/status fields met high-signal threshold; duplicate screened against existing manual corpus.`
  };
}

function uniqueByKey(candidates) {
  const best = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.source_ids[0]}:${candidate.source_record_id}`;
    const score = candidate._score || 0;
    if (!best.has(key) || score > (best.get(key)._score || 0)) {
      best.set(key, candidate);
    }
  }
  return [...best.values()];
}

function trimCandidates(candidates, maxPerDataset) {
  const groups = new Map();
  for (const candidate of candidates) {
    const dataset = candidate.row_fields?.__dataset || candidate.source_name;
    if (!groups.has(dataset)) groups.set(dataset, []);
    groups.get(dataset).push(candidate);
  }
  const trimmed = [];
  for (const group of groups.values()) {
    group.sort((a, b) => (b._score || 0) - (a._score || 0) || String(b.date).localeCompare(String(a.date)));
    trimmed.push(...group.slice(0, maxPerDataset));
  }
  return trimmed;
}

async function main() {
  const corpus = readJson(corpusPath);
  const existing = buildExistingIndex(corpus);
  ensureDir(outDir);

  const rejected = [];
  const candidates = [];

  const dobNowCoRows = await fetchAll(DATASETS.dobNowCo.id, {
    $select: "application_number,job_filing_name,job_type,bin,borough,house_no,street_name,block,lot,zip_code,submitted_date,c_of_o_status,c_of_o_filing_type,c_of_o_issuance_date,number_of_dwelling_units,c_of_o_number,latitude,longitude,bbl,ntaname",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND c_of_o_status='CO Issued' AND c_of_o_filing_type in('Final','Initial','Renewal With Change')"
  }, "DOB NOW CO");
  for (const row of dobNowCoRows) {
    row.__dataset = DATASETS.dobNowCo.id;
    const candidate = dobNowCoCandidate(row, existing, rejected);
    if (candidate) {
      const units = parseNumber(row.number_of_dwelling_units);
      candidate._score = scoreRecord({ units, floorArea: 0, height: 0, stories: 0, cost: 0, newBuilding: /new building/i.test(row.job_type || ""), finalLike: true, publicLike: false });
      candidates.push(candidate);
    }
  }

  const legacyCoRows = await fetchAll(DATASETS.legacyCo.id, {
    $select: "job_number,job_type,c_o_issue_date,bin_number,borough,house_number,street_name,block,lot,postcode,pr_dwelling_unit,ex_dwelling_unit,application_status_raw,filing_status_raw,item_number,issue_type,latitude,longitude,community_board,council_district,census_tract,bin,bbl,nta",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND job_type in('NB','A1') AND application_status_raw='Issued'"
  }, "Legacy DOB CO");
  for (const row of legacyCoRows) {
    row.__dataset = DATASETS.legacyCo.id;
    const candidate = legacyCoCandidate(row, existing, rejected);
    if (candidate) {
      const units = Math.max(parseNumber(row.pr_dwelling_unit), parseNumber(row.ex_dwelling_unit));
      candidate._score = scoreRecord({ units, floorArea: 0, height: 0, stories: 0, cost: 0, newBuilding: /^NB$/i.test(row.job_type || ""), finalLike: /final/i.test(row.issue_type || ""), publicLike: false });
      candidates.push(candidate);
    }
  }

  const dobNowBuildRows = await fetchAll(DATASETS.dobNowBuild.id, {
    $select: "job_filing_number,filing_status,house_no,street_name,borough,block,lot,bin,applicant_professional_title,owner_s_business_name,initial_cost,total_construction_floor_area,building_type,existing_stories,existing_height,existing_dwelling_units,proposed_no_of_stories,proposed_height,proposed_dwelling_units,postcode,latitude,longitude,bbl,nta,filing_date,current_status_date,first_permit_date,approved_date,signoff_date,job_type",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND job_type in('New Building','Alteration CO','ALT-CO - New Building with Existing Elements to Remain') AND filing_status in('Approved','Permit Entire','LOC Issued','CO Issued')"
  }, "DOB NOW Build filings");
  const seenDobNowBuildBase = new Map();
  for (const row of dobNowBuildRows) {
    row.__dataset = DATASETS.dobNowBuild.id;
    const candidate = dobNowBuildCandidate(row, existing, rejected);
    if (!candidate) continue;
    const scale = {
      units: parseNumber(row.proposed_dwelling_units),
      floorArea: parseNumber(row.total_construction_floor_area),
      height: parseNumber(row.proposed_height),
      stories: parseNumber(row.proposed_no_of_stories),
      cost: parseNumber(row.initial_cost),
      newBuilding: /new building/i.test(row.job_type || ""),
      finalLike: /LOC Issued|CO Issued|Permit Entire|Approved/i.test(row.filing_status || ""),
      publicLike: /city|nyc|school|hospital|library|authority|department|university/i.test(row.owner_s_business_name || "")
    };
    candidate._score = scoreRecord(scale);
    const baseKey = String(row.job_filing_number || "").replace(/-[A-Z]\d+$/i, "");
    const current = seenDobNowBuildBase.get(baseKey);
    if (!current || candidate._score > current._score || String(candidate.date) > String(current.date)) {
      seenDobNowBuildBase.set(baseKey, candidate);
    }
  }
  candidates.push(...seenDobNowBuildBase.values());

  const legacyRows = await fetchAll(DATASETS.legacyFilings.id, {
    $select: "job__,doc__,borough,house__,street_name,block,lot,bin__,job_type,job_status_descrp,latest_action_date,building_type,landmarked,city_owned,applicant_professional_title,applicant_s_first_name,applicant_s_last_name,pre__filing_date,approved,fully_permitted,initial_cost,existing_zoning_sqft,proposed_zoning_sqft,horizontal_enlrgmt,vertical_enlrgmt,enlargement_sq_footage,existingno_of_stories,proposed_no_of_stories,existing_height,proposed_height,existing_dwelling_units,proposed_dwelling_units,existing_occupancy,proposed_occupancy,owner_type,non_profit,owner_s_business_name,job_description,total_construction_floor_area,signoff_date,building_class,gis_latitude,gis_longitude,gis_nta_name,gis_bin",
    $where: "gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL AND job_type in('NB','A1') AND job_status_descrp in('SIGNED OFF','PERMIT ISSUED - ENTIRE JOB/WORK','PLAN EXAM - APPROVED')"
  }, "Legacy DOB Job Application Filings");
  for (const row of legacyRows) {
    row.__dataset = DATASETS.legacyFilings.id;
    const candidate = legacyFilingCandidate(row, existing, rejected);
    if (candidate) {
      const scale = {
        units: parseNumber(row.proposed_dwelling_units),
        floorArea: Math.max(parseNumber(row.proposed_zoning_sqft), parseNumber(row.total_construction_floor_area), parseNumber(row.enlargement_sq_footage)),
        height: parseNumber(row.proposed_height),
        stories: parseNumber(row.proposed_no_of_stories),
        cost: parseNumber(row.initial_cost),
        newBuilding: /^NB$/i.test(row.job_type || ""),
        finalLike: /SIGNED OFF|PERMIT ISSUED|PLAN EXAM - APPROVED/i.test(row.job_status_descrp || ""),
        publicLike: /city|nyc|school|hospital|library|authority|department|university/i.test(row.owner_s_business_name || "")
      };
      candidate._score = scoreRecord(scale);
      candidates.push(candidate);
    }
  }

  const selected = trimCandidates(uniqueByKey(candidates), 225)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.event_id.localeCompare(b.event_id))
    .map((candidate) => {
      const copy = { ...candidate };
      delete copy._score;
      return copy;
    });

  const sourceAudits = [
    {
      source_id: DATASETS.dobNowCo.sourceId,
      source_name: DATASETS.dobNowCo.name,
      publisher: DATASETS.dobNowCo.publisher,
      url: DATASETS.dobNowCo.page,
      license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
      coverage_years: "DOB NOW CO records in the API; Round117 filtered administrative dates to 2008-01-01 through 2026-05-19.",
      geography: "NYC geocoded address points supplied by source row latitude/longitude.",
      reliability: "strong",
      caveats: "CO records are administrative occupancy-certificate milestones, not evidence of design quality, full occupancy, or causal impacts.",
      recommendation: "Append selected high-signal rows with source row URL, coordinates, date field, limitations, and terms notes."
    },
    {
      source_id: DATASETS.legacyCo.sourceId,
      source_name: DATASETS.legacyCo.name,
      publisher: DATASETS.legacyCo.publisher,
      url: DATASETS.legacyCo.page,
      license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
      coverage_years: "Legacy DOB CO rows; Round117 filtered issue dates to 2008-01-01 through 2026-05-19.",
      geography: "NYC geocoded address points supplied by source row latitude/longitude.",
      reliability: "strong",
      caveats: "Legacy CO records are administrative records and may duplicate DOB NOW-era transition records at the same property.",
      recommendation: "Append selected high-signal rows after duplicate screening by job number, source URL, and generated event ID."
    },
    {
      source_id: DATASETS.dobNowBuild.sourceId,
      source_name: DATASETS.dobNowBuild.name,
      publisher: DATASETS.dobNowBuild.publisher,
      url: DATASETS.dobNowBuild.page,
      license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
      coverage_years: "DOB NOW Build filings in the API; Round117 filtered dates to 2008-01-01 through 2026-05-19.",
      geography: "NYC geocoded address points supplied by source row latitude/longitude.",
      reliability: "usable with caveats",
      caveats: "Filing, approval, permit, LOC, and signoff dates are administrative milestones; they do not prove construction completion or opening.",
      recommendation: "Use only high-signal rows with scale fields and clear source date fields."
    },
    {
      source_id: DATASETS.legacyFilings.sourceId,
      source_name: DATASETS.legacyFilings.name,
      publisher: DATASETS.legacyFilings.publisher,
      url: DATASETS.legacyFilings.page,
      license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
      coverage_years: "Legacy DOB job application filings; Round117 filtered milestone dates to 2008-01-01 through 2026-05-19.",
      geography: "NYC geocoded address points supplied by GIS latitude/longitude fields.",
      reliability: "usable with caveats",
      caveats: "Job application statuses are administrative and can be revised; source scale fields can be zero or inconsistent and require filtering.",
      recommendation: "Use selected high-signal records with the original job number, status, date field, and row-level caveats."
    }
  ];

  const payload = {
    generated_at: `${accessedAt}T00:00:00Z`,
    source_audits: sourceAudits,
    candidates: selected,
    rejected
  };
  fs.writeFileSync(path.join(outDir, "candidates.json"), `${JSON.stringify(payload, null, 2)}\n`);

  const bySource = {};
  for (const candidate of selected) {
    const source = candidate.source_name;
    bySource[source] = (bySource[source] || 0) + 1;
  }
  const notes = [
    "# Round117 NYC DOB bulk candidate fetch",
    "",
    `Generated ${selected.length} high-signal candidates and ${rejected.length} rejects on ${accessedAt}.`,
    "",
    "## Selected by source",
    "",
    ...Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => `- ${source}: ${count}`),
    "",
    "## Selection caveats",
    "",
    "- Rows were selected from official NYC Open Data DOB datasets only.",
    "- Candidate dates are DOB administrative date fields, not independent construction or opening observations.",
    "- Point geometry is source geocoding, not a footprint or work-area polygon.",
    "- Records below the dwelling-unit, floor-area, height, stories, cost, or public-owner thresholds were rejected.",
    "- Existing manual-corpus source IDs, source URLs, and row identifiers were used for duplicate screening before writing candidates."
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "notes.md"), `${notes}\n`);

  console.log(JSON.stringify({ selected: selected.length, rejected: rejected.length, bySource }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
