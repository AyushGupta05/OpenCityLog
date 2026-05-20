const fs = require("fs");
const path = require("path");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outDir = "tmp/subagents/round229_nyc_hpd_affordable_housing_next3";
const accessedAt = "2026-05-19";
const generatedAt = `${accessedAt}T00:00:00Z`;
const startDate = "2008-01-01";
const endDate = accessedAt;
const targetCount = 200;
const rejectSampleLimit = 10000;

const DATASET = {
  id: "hg8x-zxpr",
  sourceId: "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  name: "NYC Open Data: Affordable Housing Production by Building",
  publisher: "NYC Department of Housing Preservation and Development (HPD), via NYC Open Data",
  attribution: "Department of Housing Preservation and Development (HPD)",
  page: "https://data.cityofnewyork.us/Housing-Development/Affordable-Housing-Production-by-Building/hg8x-zxpr",
  api: "https://data.cityofnewyork.us/resource/hg8x-zxpr.json",
  metadata: "https://data.cityofnewyork.us/api/views/hg8x-zxpr",
  termsUrl: "https://opendata.cityofnewyork.us/overview/#termsofuse"
};

const selectFields = [
  "project_id",
  "project_name",
  "project_start_date",
  "project_completion_date",
  "building_id",
  "house_number",
  "street_name",
  "borough",
  "postcode",
  "bbl",
  "bin",
  "community_board",
  "council_district",
  "census_tract",
  "neighborhood_tabulation_area",
  "latitude",
  "longitude",
  "building_completion_date",
  "reporting_construction_type",
  "extended_affordability_status",
  "prevailing_wage_status",
  "extremely_low_income_units",
  "very_low_income_units",
  "low_income_units",
  "moderate_income_units",
  "middle_income_units",
  "other_income_units",
  "studio_units",
  "_1_br_units",
  "_2_br_units",
  "_3_br_units",
  "_4_br_units",
  "_5_br_units",
  "_6_br_units",
  "unknown_br_units",
  "counted_rental_units",
  "counted_homeownership_units",
  "all_counted_units",
  "total_units"
];

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
    .slice(0, 128)
    .replace(/_+$/g, "");
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

function inDateWindow(date) {
  return date >= startDate && date <= endDate;
}

function isNycPoint(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= 40.4774 && lat <= 40.9176 && lon >= -74.2591 && lon <= -73.7004;
}

function titleCaseBorough(value) {
  const text = String(value || "").trim().toLowerCase();
  const map = {
    manhattan: "Manhattan",
    brooklyn: "Brooklyn",
    queens: "Queens",
    bronx: "Bronx",
    "staten island": "Staten Island"
  };
  return map[text] || String(value || "").trim();
}

function socrataUrl(datasetId, params = {}) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function rowSourceRecordId(row) {
  const projectId = String(row.project_id || "").trim();
  const buildingId = String(row.building_id || "").trim();
  return projectId && buildingId ? `${projectId}:${buildingId}` : "";
}

function hpdRowToken(row) {
  return `${DATASET.sourceId}:${rowSourceRecordId(row)}`;
}

function sourceDateKey({ cityId, sourceUrl, sourceRecordId, sourceDateField, date }) {
  return [
    cityId || "nyc",
    sourceUrl || "",
    sourceRecordId || "",
    sourceDateField || "",
    date || ""
  ].join("|");
}

function normalizeUrlToken(value) {
  return String(value || "").toLowerCase();
}

function eventLikeRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.events)) return raw.events;
  if (Array.isArray(raw?.candidates)) return raw.candidates;
  return [];
}

function isHpdRecord(row) {
  const sourceIds = row.source_ids || [];
  return sourceIds.includes(DATASET.sourceId) ||
    row.source_dataset_id === DATASET.sourceId ||
    String(row.source_url || "").includes(DATASET.id) ||
    String(row.source_url || "").includes("Affordable-Housing-Production-by-Building");
}

function extractUrlRecordId(urlText) {
  try {
    const url = new URL(urlText);
    const projectId = url.searchParams.get("project_id");
    const buildingId = url.searchParams.get("building_id");
    if (projectId && buildingId) return `${projectId}:${buildingId}`;
  } catch (_) {
    return "";
  }
  return "";
}

function addExistingRow(index, row, file) {
  const eventId = row.event_id || row.candidate_id || row.id;
  const sourceRecordId = String(row.source_record_id || row.source_id || "").trim();
  const urlRecordId = extractUrlRecordId(row.source_url || "");
  const date = row.date || row.effective_date || row.event_date || "";
  const sourceDateField = row.source_date_field || "";
  const sourceUrl = row.source_url || "";

  if (eventId) index.eventIds.add(String(eventId));
  if (sourceRecordId) {
    index.sourceRecordIds.add(sourceRecordId);
    index.sourceRecordIds.add(`${DATASET.sourceId}:${sourceRecordId}`);
  }
  if (urlRecordId) {
    index.sourceRecordIds.add(urlRecordId);
    index.sourceRecordIds.add(`${DATASET.sourceId}:${urlRecordId}`);
  }
  if (sourceUrl) index.sourceUrls.add(normalizeUrlToken(sourceUrl));
  if (sourceRecordId || sourceUrl || date || sourceDateField) {
    index.sourceDateKeys.add(sourceDateKey({
      cityId: row.city_id || row.city || "nyc",
      sourceUrl,
      sourceRecordId,
      sourceDateField,
      date
    }));
  }
  index.files.add(file);
}

function collectCandidateFiles(rootDir) {
  const ownRoot = path.normalize(outDir).toLowerCase();
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const normalized = path.normalize(full).toLowerCase();
      if (entry.isDirectory()) {
        if (normalized.includes(ownRoot)) continue;
        walk(full);
      } else if (entry.name === "candidates.json" && !normalized.includes(ownRoot)) {
        files.push(full);
      }
    }
  }
  walk(rootDir);
  return files.sort();
}

function buildExistingIndex() {
  const index = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    sourceDateKeys: new Set(),
    sourceUrls: new Set(),
    files: new Set(),
    filesRead: 0,
    hpdRowsIndexed: 0
  };

  const corpus = readJson(corpusPath);
  index.filesRead += 1;
  for (const row of corpus.events || []) {
    if (!isHpdRecord(row)) continue;
    addExistingRow(index, row, corpusPath);
    index.hpdRowsIndexed += 1;
  }

  for (const file of collectCandidateFiles("tmp/subagents")) {
    let raw;
    try {
      raw = readJson(file);
    } catch (error) {
      continue;
    }
    index.filesRead += 1;
    for (const row of eventLikeRows(raw)) {
      if (!isHpdRecord(row)) continue;
      addExistingRow(index, row, file);
      index.hpdRowsIndexed += 1;
    }
  }

  return index;
}

async function fetchJsonWithRetry(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      const waitMs = attempt * attempt * 1000;
      console.warn(`${label}: attempt ${attempt} failed (${error.message}); retrying in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function fetchAll(datasetId, params, label, pageSize = 50000, maxRows = 300000) {
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

async function fetchMetadata() {
  try {
    return await fetchJsonWithRetry(DATASET.metadata, "HPD metadata");
  } catch (error) {
    return { metadata_error: error.message };
  }
}

function unixSecondsToIso(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return new Date(parsed * 1000).toISOString();
}

function chooseDate(row) {
  const options = [
    ["building_completion_date", row.building_completion_date, 3],
    ["project_completion_date", row.project_completion_date, 2],
    ["project_start_date", row.project_start_date, 1]
  ];
  for (const [field, raw, priority] of options) {
    const date = parseDate(raw);
    if (date) return { date, field, priority };
  }
  return { date: "", field: "", priority: 0 };
}

function countUnits(row) {
  return {
    extremelyLow: parseNumber(row.extremely_low_income_units),
    veryLow: parseNumber(row.very_low_income_units),
    low: parseNumber(row.low_income_units),
    moderate: parseNumber(row.moderate_income_units),
    middle: parseNumber(row.middle_income_units),
    other: parseNumber(row.other_income_units),
    countedRental: parseNumber(row.counted_rental_units),
    countedHomeownership: parseNumber(row.counted_homeownership_units),
    allCounted: parseNumber(row.all_counted_units),
    total: parseNumber(row.total_units)
  };
}

function hpdScore(row, dateInfo) {
  const units = countUnits(row);
  const seniorOrSupportive = /senior|supportive/i.test(`${row.project_name || ""}`);
  const newConstruction = /new/i.test(`${row.reporting_construction_type || ""}`);
  const extensionOnly = /^yes$/i.test(`${row.extended_affordability_status || ""}`);
  return Math.max(units.allCounted, units.total) +
    (newConstruction ? 150 : 0) +
    (seniorOrSupportive ? 40 : 0) -
    (extensionOnly ? 25 : 0);
}

function reject(rejected, reason, row, detail = {}) {
  rejected.count += 1;
  rejected.by_reason[reason] = (rejected.by_reason[reason] || 0) + 1;
  if (rejected.samples.length < rejectSampleLimit) {
    const dateInfo = chooseDate(row || {});
    rejected.samples.push({
      source_dataset_id: DATASET.id,
      source_record_id: rowSourceRecordId(row || {}),
      date: dateInfo.date,
      source_date_field: dateInfo.field,
      reason,
      project_id: row?.project_id || "",
      building_id: row?.building_id || "",
      project_name: row?.project_name || "",
      borough: row?.borough || "",
      detail
    });
  }
}

function appearsExisting(existing, eventId, sourceRecordId, sourceUrl, sourceDateField, date) {
  if (eventId && existing.eventIds.has(eventId)) return "event_id already appears in corpus or prior HPD candidates.";
  if (sourceRecordId && (existing.sourceRecordIds.has(sourceRecordId) || existing.sourceRecordIds.has(`${DATASET.sourceId}:${sourceRecordId}`))) {
    return "HPD project/building source row already appears in corpus or prior HPD candidates.";
  }
  if (sourceUrl && existing.sourceUrls.has(normalizeUrlToken(sourceUrl))) return "HPD Socrata row URL already appears in corpus or prior HPD candidates.";
  const key = sourceDateKey({
    cityId: "nyc",
    sourceUrl,
    sourceRecordId,
    sourceDateField,
    date
  });
  if (existing.sourceDateKeys.has(key)) return "HPD source/date key already appears in corpus or prior HPD candidates.";
  return "";
}

function buildCandidate(row, existing, rejected) {
  const sourceRecordId = rowSourceRecordId(row);
  const dateInfo = chooseDate(row);
  const date = dateInfo.date;
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const sourceUrl = socrataUrl(DATASET.id, {
    project_id: row.project_id,
    building_id: row.building_id
  });
  const eventId = slugify(`nyc_arch_hpd_affordable_housing_${row.project_id}_${row.building_id}_${date}`);

  if (!sourceRecordId) {
    reject(rejected, "missing_project_or_building_id", row);
    return null;
  }
  if (!date || !inDateWindow(date)) {
    reject(rejected, "missing_or_out_of_window_source_date", row, { date });
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, "missing_or_out_of_city_source_coordinates", row, { latitude: row.latitude, longitude: row.longitude });
    return null;
  }

  const duplicateReason = appearsExisting(existing, eventId, sourceRecordId, sourceUrl, dateInfo.field, date);
  if (duplicateReason) {
    reject(rejected, "duplicate_hpd_source_row_or_event", row, { duplicate_reason: duplicateReason });
    return null;
  }

  const units = countUnits(row);
  const totalOrCounted = Math.max(units.total, units.allCounted);
  if (totalOrCounted <= 0) {
    reject(rejected, "missing_unit_count", row);
    return null;
  }

  const address = [row.house_number, row.street_name].filter(Boolean).join(" ").trim();
  const borough = titleCaseBorough(row.borough);
  const constructionType = row.reporting_construction_type || "HPD affordable housing production";
  const datePhrase = dateInfo.field === "project_start_date" ? "start" : "completion";
  const countedPhrase = units.allCounted ? `${units.allCounted} counted affordable-production units` : `${totalOrCounted} source-reported units`;
  const totalPhrase = units.total ? `${units.total} total units` : "total units not supplied";

  return {
    city_id: "nyc",
    candidate_id: eventId,
    event_id: eventId,
    title: `HPD recorded affordable housing ${datePhrase} for ${address || row.project_name}`,
    summary: `${DATASET.publisher} records building ${row.building_id} in project ${row.project_id} (${row.project_name || "project name not supplied"}) with ${countedPhrase} and ${totalPhrase} at ${address || "the cited address"}.`,
    observed_change: `HPD recorded an affordable-housing production ${datePhrase} milestone for the cited project/building.`,
    date,
    effective_date: date,
    date_precision: "day",
    source_ids: [DATASET.sourceId],
    source_dataset_id: DATASET.sourceId,
    source_name: DATASET.name,
    publisher: DATASET.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: accessedAt,
    source_date_field: dateInfo.field,
    latitude: lat,
    longitude: lon,
    geometry: {
      type: "Point",
      coordinates: [lon, lat]
    },
    geometry_ref: {
      latitude_field: "latitude",
      longitude_field: "longitude",
      bbl: row.bbl || "",
      bin: row.bin || ""
    },
    geometry_source: "Official NYC Open Data Affordable Housing Production by Building row latitude/longitude.",
    geometry_precision: "official source geocoded building/address point; not a measured building footprint, parcel geometry, or project boundary",
    confidence: "documented",
    project_type: "HPD affordable housing production building milestone",
    architecture_change_type: dateInfo.field === "project_start_date" ? "housing_program_start_record" : "housing_delivery_completion_record",
    construction_type: constructionType,
    extended_affordability_status: row.extended_affordability_status || "",
    prevailing_wage_status: row.prevailing_wage_status || "",
    units: {
      extremely_low_income_units: units.extremelyLow,
      very_low_income_units: units.veryLow,
      low_income_units: units.low,
      moderate_income_units: units.moderate,
      middle_income_units: units.middle,
      other_income_units: units.other,
      counted_rental_units: units.countedRental,
      counted_homeownership_units: units.countedHomeownership,
      all_counted_units: units.allCounted,
      total_units: units.total
    },
    address: {
      house_number: row.house_number || "",
      street_name: row.street_name || "",
      borough,
      postcode: row.postcode || "",
      bbl: row.bbl || "",
      bin: row.bin || "",
      community_board: row.community_board || "",
      council_district: row.council_district || "",
      census_tract: row.census_tract || "",
      neighborhood_tabulation_area: row.neighborhood_tabulation_area || ""
    },
    license_or_terms_note: "No dataset-specific license field was exposed in the Socrata metadata checked during this run; NYC Open Data Terms of Use / NYC.gov Terms of Use apply.",
    attribution: DATASET.publisher,
    limitations: "HPD Affordable Housing Production by Building is administrative housing-program delivery evidence. It is not a full building-completion survey, DOB final certificate, first occupancy record, tenant move-in record, as-built footprint, affordability-duration audit, or causal outcome evidence.",
    area: `${address || row.project_name || "HPD affordable housing production row"}, ${borough || "New York City"}, New York City`,
    raw_row: row,
    transformation_method: `Round229 official NYC Open Data HPD fetch from ${DATASET.id}; selected from rows with project/building identifiers, a source date, source coordinates, unit counts, and duplicate screening against the live manual corpus plus prior HPD candidate packs.`
  };
}

function summarizeCandidates(candidates) {
  const byYear = {};
  const byBorough = {};
  const byDateField = {};
  const byConstructionType = {};
  const byExtendedAffordability = {};
  const unitCounts = [];
  let minDate = "9999-99-99";
  let maxDate = "0000-00-00";

  for (const candidate of candidates) {
    const year = candidate.date.slice(0, 4);
    byYear[year] = (byYear[year] || 0) + 1;
    byBorough[candidate.address.borough || "unknown"] = (byBorough[candidate.address.borough || "unknown"] || 0) + 1;
    byDateField[candidate.source_date_field || "unknown"] = (byDateField[candidate.source_date_field || "unknown"] || 0) + 1;
    byConstructionType[candidate.construction_type || "unknown"] = (byConstructionType[candidate.construction_type || "unknown"] || 0) + 1;
    byExtendedAffordability[candidate.extended_affordability_status || "unknown"] = (byExtendedAffordability[candidate.extended_affordability_status || "unknown"] || 0) + 1;
    const units = Math.max(candidate.units.total_units || 0, candidate.units.all_counted_units || 0);
    unitCounts.push(units);
    if (candidate.date < minDate) minDate = candidate.date;
    if (candidate.date > maxDate) maxDate = candidate.date;
  }

  unitCounts.sort((a, b) => a - b);
  const medianIndex = Math.floor(unitCounts.length / 2);
  const median = unitCounts.length ? unitCounts[medianIndex] : 0;

  return {
    by_year: byYear,
    by_borough: byBorough,
    by_date_field: byDateField,
    by_reporting_construction_type: byConstructionType,
    by_extended_affordability_status: byExtendedAffordability,
    date_range: {
      start: candidates.length ? minDate : null,
      end: candidates.length ? maxDate : null
    },
    total_or_counted_units: {
      min: unitCounts.length ? unitCounts[0] : 0,
      median,
      max: unitCounts.length ? unitCounts[unitCounts.length - 1] : 0
    }
  };
}

function sourceAudit(metadata, acceptedCount, selectedSummary) {
  const license = metadata.license ||
    "No dataset-specific license field exposed in Socrata metadata checked during this run; NYC Open Data Terms of Use / NYC.gov Terms of Use apply.";
  const description = metadata.description || metadata.descriptionText || "";
  const customFields = metadata.metadata?.custom_fields || {};
  const updateFrequency = customFields?.Update?.["Update Frequency"] ||
    customFields?.["Update"]?.["Update Frequency"] ||
    customFields?.["Data Refresh"]?.["Update Frequency"] ||
    "Not explicitly parsed from metadata in this run; rows_updated_at_utc is recorded.";

  return {
    schema_version: "round229.nyc_hpd_affordable_housing_next3_source_audit.v1",
    generated_at: generatedAt,
    accessed_at: accessedAt,
    audit_scope: "Official NYC Open Data HPD Affordable Housing Production by Building source audit for Bims-5 candidate ingestion.",
    sources: [
      {
        source_id: DATASET.sourceId,
        canonical_source_id: DATASET.sourceId,
        dataset_id: DATASET.id,
        source_name: DATASET.name,
        publisher: DATASET.publisher,
        source_url: DATASET.page,
        api_endpoint: DATASET.api,
        metadata_url: DATASET.metadata,
        source_type: "official NYC Open Data Socrata dataset",
        description,
        attribution: metadata.attribution || DATASET.attribution,
        provenance: metadata.provenance || "official",
        rows_updated_at_utc: unixSecondsToIso(metadata.rowsUpdatedAt),
        publication_date_utc: unixSecondsToIso(metadata.publicationDate),
        update_frequency: updateFrequency,
        license,
        license_url: DATASET.termsUrl,
        reliability: "strong for HPD affordable-housing production administrative milestones; usable with caveats for physical completion/occupancy claims",
        coverage_years_checked: `${startDate} through ${endDate}`,
        published_coverage_note: "Round229 checked HPD building-level rows with coordinates and building/project completion or project start dates available through the access date.",
        geographic_scope: "New York City HPD affordable housing production rows with address, BBL/BIN where available, and latitude/longitude geocoded points.",
        granularity: "One HPD project/building row. Multi-building projects can produce multiple building rows and project-level dates can repeat across buildings.",
        key_fields_for_events: [
          "project_id",
          "project_name",
          "project_start_date",
          "project_completion_date",
          "building_id",
          "house_number",
          "street_name",
          "borough",
          "postcode",
          "bbl",
          "bin",
          "community_board",
          "council_district",
          "census_tract",
          "neighborhood_tabulation_area",
          "latitude",
          "longitude",
          "building_completion_date",
          "reporting_construction_type",
          "extended_affordability_status",
          "prevailing_wage_status",
          "all_counted_units",
          "total_units"
        ],
        source_date_fields: [
          "building_completion_date",
          "project_completion_date",
          "project_start_date"
        ],
        geometry_fields: [
          "latitude",
          "longitude",
          "bbl",
          "bin"
        ],
        accepted_candidate_count: acceptedCount,
        accepted_date_fields: selectedSummary.by_date_field,
        accepted_program_fields: {
          reporting_construction_type: selectedSummary.by_reporting_construction_type,
          extended_affordability_status: selectedSummary.by_extended_affordability_status
        },
        required_caveats: [
          "HPD production rows are administrative housing-program delivery evidence, not a complete independent survey of all building completions.",
          "Building completion, project completion, and project start fields are HPD source dates and are kept distinct from retrieval date.",
          "Coordinates are HPD/Open Data geocoded points, not surveyed footprints, parcels, or project boundaries.",
          "Unit counts, construction type, and extended-affordability status are source row values and may be updated or corrected by HPD.",
          "No causality, forecast, neighborhood impact, or first-occupancy claim is made from this dataset."
        ],
        ingestion_recommendation: "Append only with row-level Socrata URL, project/building source record id, source date field, coordinates, unit counts, attribution, NYC terms caveat, and limitations."
      }
    ]
  };
}

function writeJson(file, payload) {
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  ensureDir(outDir);
  const metadata = await fetchMetadata();
  const existing = buildExistingIndex();
  const rejected = { count: 0, by_reason: {}, samples: [] };
  const candidates = [];
  const seenThisRun = new Set();

  const rows = await fetchAll(DATASET.id, {
    $select: selectFields.join(","),
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND (building_completion_date IS NOT NULL OR project_completion_date IS NOT NULL OR project_start_date IS NOT NULL)"
  }, "HPD affordable housing buildings");

  for (const row of rows) {
    const token = hpdRowToken(row);
    if (seenThisRun.has(token)) {
      reject(rejected, "duplicate_source_row_within_fetch", row);
      continue;
    }
    seenThisRun.add(token);
    const candidate = buildCandidate(row, existing, rejected);
    if (candidate) candidates.push(candidate);
  }

  const selected = candidates
    .sort((a, b) => {
      const aDate = chooseDate(a.raw_row);
      const bDate = chooseDate(b.raw_row);
      return bDate.priority - aDate.priority ||
        hpdScore(b.raw_row, bDate) - hpdScore(a.raw_row, aDate) ||
        String(b.date).localeCompare(String(a.date)) ||
        a.event_id.localeCompare(b.event_id);
    })
    .slice(0, targetCount)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.event_id.localeCompare(b.event_id));

  const selectedSummary = summarizeCandidates(selected);
  const sourceAuditPayload = sourceAudit(metadata, selected.length, selectedSummary);
  const headroomAfterPack = Math.max(0, candidates.length - selected.length);
  const metadataColumns = Array.isArray(metadata.columns)
    ? metadata.columns.filter((column) => column.fieldName).map((column) => ({
      field_name: column.fieldName,
      name: column.name,
      data_type: column.dataTypeName
    }))
    : [];

  const summaryPayload = {
    schema_version: "round229.nyc_hpd_affordable_housing_next3_summary.v1",
    generated_at: generatedAt,
    accessed_at: accessedAt,
    output_files: [
      path.join(outDir, "candidates.json").replace(/\\/g, "/"),
      path.join(outDir, "source_audit.json").replace(/\\/g, "/"),
      path.join(outDir, "summary.json").replace(/\\/g, "/"),
      path.join(outDir, "notes.md").replace(/\\/g, "/"),
      path.join(outDir, "rejected.json").replace(/\\/g, "/")
    ],
    source_id: DATASET.sourceId,
    dataset_id: DATASET.id,
    source_url: DATASET.page,
    api_endpoint: DATASET.api,
    date_window: {
      start: startDate,
      end: endDate
    },
    candidate_count: selected.length,
    target_count: targetCount,
    selected_summary: selectedSummary,
    selection_summary: {
      fetched_source_rows: rows.length,
      eligible_after_required_fields_and_duplicate_screening: candidates.length,
      retained_less_than_target_reason: selected.length < targetCount ? "Fewer unique eligible HPD rows remained after duplicate/provenance screening." : null,
      headroom_after_this_candidate_pack: headroomAfterPack,
      duplicate_screening: {
        files_read: existing.filesRead,
        hpd_rows_indexed: existing.hpdRowsIndexed,
        event_ids: existing.eventIds.size,
        source_record_ids: existing.sourceRecordIds.size,
        source_date_keys: existing.sourceDateKeys.size,
        source_urls: existing.sourceUrls.size,
        screened_files: Array.from(existing.files).sort()
      },
      ranking: "Source date priority is applied first: building_completion_date rows, then project_completion_date rows, then project_start_date rows. Within each date-field tier, higher total/all-counted unit counts, new-construction text signals, senior/supportive text signals, and newer dates are preferred.",
      rejected_count: rejected.count,
      rejected_by_reason: rejected.by_reason
    },
    metadata: {
      name: metadata.name || DATASET.name,
      id: metadata.id || DATASET.id,
      provenance: metadata.provenance || "official",
      attribution: metadata.attribution || DATASET.attribution,
      rows_updated_at_utc: unixSecondsToIso(metadata.rowsUpdatedAt),
      publication_date_utc: unixSecondsToIso(metadata.publicationDate),
      license: metadata.license || null,
      columns: metadataColumns
    },
    caveats: [
      "HPD Affordable Housing Production by Building is housing-program/administrative delivery evidence, not a full building-completion survey.",
      "Source date fields are kept explicit and are not treated as DOB certificate dates, first occupancy, tenant move-in, ribbon cutting, or causal outcome evidence.",
      "Coordinates are source geocoded points and should not be displayed as exact building footprints or project boundaries.",
      "NYC Open Data Terms of Use / NYC.gov Terms of Use apply because no dataset-specific license field was exposed in the checked metadata."
    ]
  };

  const candidatesPayload = {
    schema_version: "round229.nyc_hpd_affordable_housing_next3_candidates.v1",
    generated_at: generatedAt,
    accessed_at: accessedAt,
    source_audits: sourceAuditPayload.sources,
    candidates: selected
  };

  const rejectedPayload = {
    schema_version: "round229.nyc_hpd_affordable_housing_next3_rejected.v1",
    generated_at: generatedAt,
    accessed_at: accessedAt,
    source_id: DATASET.sourceId,
    dataset_id: DATASET.id,
    rejected_count: rejected.count,
    by_reason: rejected.by_reason,
    samples_limit: rejectSampleLimit,
    samples: rejected.samples
  };

  const notes = [
    "# Round229 NYC HPD Affordable Housing Production Candidate Pack",
    "",
    `Generated ${selected.length} candidates from ${rows.length} fetched HPD building rows on ${accessedAt}.`,
    "",
    "## Scope",
    "",
    `- Source: ${DATASET.name} (${DATASET.id}).`,
    `- Source page: ${DATASET.page}`,
    `- Date window: ${startDate} through ${endDate}.`,
    "- Dataset only: NYC HPD Affordable Housing Production by Building. No parks records are included.",
    "",
    "## Counts",
    "",
    `- Candidates retained: ${selected.length}`,
    `- Eligible unique HPD rows after required-field and duplicate screening: ${candidates.length}`,
    `- Headroom after this candidate pack: ${headroomAfterPack}`,
    `- Rejected/source-screened rows: ${rejected.count}`,
    "",
    "## Date Fields",
    "",
    ...Object.entries(selectedSummary.by_date_field).map(([field, count]) => `- ${field}: ${count}`),
    "",
    "## Program Fields",
    "",
    ...Object.entries(selectedSummary.by_reporting_construction_type).map(([field, count]) => `- Reporting construction type ${field}: ${count}`),
    ...Object.entries(selectedSummary.by_extended_affordability_status).map(([field, count]) => `- Extended affordability status ${field}: ${count}`),
    "",
    "## Caveats",
    "",
    "- HPD production rows are administrative housing-program delivery evidence, not a full building-completion survey.",
    "- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, or project closeout unless another source independently documents that.",
    "- Coordinates are HPD/Open Data geocoded points, not surveyed building footprints or project boundaries.",
    "- NYC Open Data Terms of Use / NYC.gov Terms of Use apply; no dataset-specific license field was exposed in the metadata checked during this run.",
    "- Duplicate screening used the live manual corpus and prior HPD candidate packs; this script did not edit the corpus, appender, or generated atlas files."
  ].join("\n");

  writeJson(path.join(outDir, "candidates.json"), candidatesPayload);
  writeJson(path.join(outDir, "source_audit.json"), sourceAuditPayload);
  writeJson(path.join(outDir, "summary.json"), summaryPayload);
  fs.writeFileSync(path.join(outDir, "notes.md"), `${notes}\n`);
  writeJson(path.join(outDir, "rejected.json"), rejectedPayload);

  console.log(JSON.stringify({
    selected: selected.length,
    fetched_source_rows: rows.length,
    eligible_after_duplicate_screening: candidates.length,
    headroom_after_this_candidate_pack: headroomAfterPack,
    date_range: selectedSummary.date_range,
    by_date_field: selectedSummary.by_date_field,
    by_reporting_construction_type: selectedSummary.by_reporting_construction_type,
    duplicate_screening: summaryPayload.selection_summary.duplicate_screening,
    rejected_count: rejected.count,
    rejected_by_reason: rejected.by_reason,
    output_dir: outDir
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
