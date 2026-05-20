const fs = require("fs");
const path = require("path");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outDir = "tmp/subagents/round118_nyc_hpd_parks_official";
const accessedAt = "2026-05-19";
const startDate = "2008-01-01";
const endDate = accessedAt;

const DATASETS = {
  hpdBuildings: {
    id: "hg8x-zxpr",
    sourceId: "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
    name: "NYC Open Data: Affordable Housing Production by Building",
    publisher: "NYC Department of Housing Preservation and Development (HPD), via NYC Open Data",
    page: "https://data.cityofnewyork.us/Housing-Development/Affordable-Housing-Production-by-Building/hg8x-zxpr"
  },
  parksCapital: {
    id: "4hcv-tc5r",
    sourceId: "nyc-parks-capital-project-tracker-4hcv-tc5r",
    name: "NYC Open Data: Parks Capital Project Tracker",
    publisher: "NYC Department of Parks and Recreation, via NYC Open Data",
    page: "https://data.cityofnewyork.us/Recreation/Capital-Project-Tracker/4hcv-tc5r"
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
    .slice(0, 112)
    .replace(/_+$/g, "");
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
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

function inWindow(date) {
  return date >= startDate && date <= endDate;
}

function isNycPoint(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= 40.4774 && lat <= 40.9176 && lon >= -74.2591 && lon <= -73.7004;
}

function titleCaseBorough(value) {
  const text = String(value || "").trim().toLowerCase();
  const map = { manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens", bronx: "Bronx", "staten island": "Staten Island" };
  return map[text] || String(value || "").trim();
}

function socrataUrl(datasetId, params) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
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

function appearsExisting(existing, dataset, sourceRecordId) {
  const token = String(sourceRecordId || "");
  if (!token) return false;
  if (existing.ids.has(token) || existing.ids.has(`${dataset.sourceId}:${token}`)) return true;
  for (const id of existing.ids) {
    if (id.includes(token)) return true;
  }
  for (const url of existing.urls) {
    if (url.includes(encodeURIComponent(token)) || url.includes(token)) return true;
  }
  return false;
}

function reject(rejected, row, dataset, reason) {
  rejected.push({
    source_dataset_id: dataset.id,
    source_record_id: row.project_id || row.building_id || row.trackerid || "",
    reason
  });
}

function hpdScore(row) {
  const total = parseNumber(row.total_units);
  const counted = parseNumber(row.all_counted_units);
  const senior = /senior/i.test(`${row.project_name || ""} ${row.program_group || ""}`);
  return Math.max(total, counted) + (senior ? 30 : 0);
}

function hpdCandidate(row, existing, rejected) {
  const dataset = DATASETS.hpdBuildings;
  const date = parseDate(row.building_completion_date || row.project_completion_date);
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const sourceRecordId = `${row.project_id}:${row.building_id}`;
  if (appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate HPD building record already appears in manual corpus.");
    return null;
  }
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window HPD building/project completion date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city HPD source coordinates.");
    return null;
  }
  const total = parseNumber(row.total_units);
  const counted = parseNumber(row.all_counted_units);
  if (Math.max(total, counted) < 20) {
    reject(rejected, row, dataset, "Below Round118 HPD high-signal unit threshold.");
    return null;
  }
  const address = [row.house_number, row.street_name].filter(Boolean).join(" ");
  const borough = titleCaseBorough(row.borough);
  const sourceUrl = socrataUrl(dataset.id, { project_id: row.project_id, building_id: row.building_id });
  const id = slugify(`nyc_arch_hpd_affordable_housing_${row.project_id}_${row.building_id}_${date}`);
  return {
    city_id: "nyc",
    candidate_id: id,
    event_id: id,
    title: `HPD recorded affordable housing completion for ${address || row.project_name}`,
    summary: `${dataset.publisher} records building ${row.building_id} in project ${row.project_id} (${row.project_name}) with ${counted || total} counted affordable-production units and ${total} total units at ${address || "the cited address"}.`,
    observed_change: "HPD recorded an affordable-housing production completion milestone for the cited project/building.",
    date,
    date_precision: "day",
    source_ids: [dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: accessedAt,
    source_date_field: row.building_completion_date ? "building_completion_date" : "project_completion_date",
    latitude: lat,
    longitude: lon,
    geometry_source: "Official NYC Open Data Affordable Housing Production by Building row latitude/longitude.",
    geometry_precision: "official source geocoded building/address point; not a measured building footprint or project boundary",
    confidence: "documented",
    project_type: "HPD affordable housing production building completion",
    license_or_terms_note: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
    attribution: dataset.publisher,
    limitations: "HPD production completion is an administrative housing-production milestone. It is not necessarily first occupancy, DOB final certificate, ribbon cutting, full project closeout, tenant move-in, affordability duration beyond source fields, or causal outcome evidence.",
    area: `${address || row.project_name}, ${borough}, New York City`,
    raw_row: row,
    transformation_method: `Round118 official NYC Open Data HPD fetch from ${dataset.id}; selected because completion date, source coordinates, and unit counts met high-signal threshold; duplicate screened against existing manual corpus.`
  };
}

function parksKeywordScore(row) {
  const text = `${row.title || ""} ${row.summary || ""}`.toLowerCase();
  let score = 0;
  const terms = [
    "recreation center", "comfort station", "field house", "park house", "building",
    "playground", "plaza", "waterfront", "pier", "esplanade", "greenway",
    "skate", "pool", "court", "athletic field", "track", "dog run",
    "entrance", "landscape", "reconstruction", "renovation", "restoration"
  ];
  for (const term of terms) if (text.includes(term)) score += 12;
  score += Math.min(parseNumber(row.totalfunding) / 1000000, 40);
  if (/complete/i.test(row.currentphase || "")) score += 20;
  return score;
}

function parksCandidate(row, existing, rejected) {
  const dataset = DATASETS.parksCapital;
  const date = parseDate(row.constructionactualcompletion || row.designactualcompletion);
  const lat = parseNumber(row.latitude);
  const lon = parseNumber(row.longitude);
  const sourceRecordId = String(row.trackerid || "");
  if (appearsExisting(existing, dataset, sourceRecordId)) {
    reject(rejected, row, dataset, "Duplicate Parks tracker record already appears in manual corpus.");
    return null;
  }
  if (!date || !inWindow(date)) {
    reject(rejected, row, dataset, "Missing or out-of-window Parks actual completion date.");
    return null;
  }
  if (!isNycPoint(lat, lon)) {
    reject(rejected, row, dataset, "Missing or out-of-city Parks source coordinates.");
    return null;
  }
  if (parksKeywordScore(row) < 20) {
    reject(rejected, row, dataset, "Below Round118 Parks architecture/public-realm relevance threshold.");
    return null;
  }
  const sourceUrl = socrataUrl(dataset.id, { trackerid: sourceRecordId });
  const borough = titleCaseBorough(row.borough);
  const id = slugify(`nyc_arch_parks_capital_${sourceRecordId}_${date}`);
  return {
    city_id: "nyc",
    candidate_id: id,
    event_id: id,
    title: `NYC Parks recorded capital completion for ${row.title || row.name}`,
    summary: `${dataset.publisher} records ${row.title || "a capital project"} at ${row.name || "the cited park/site"} with current phase ${row.currentphase || "not supplied"} and source funding field ${row.totalfunding || "not supplied"}.`,
    observed_change: "NYC Parks recorded an actual completion milestone for a capital project at the cited park or public-realm site.",
    date,
    date_precision: "day",
    source_ids: [dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: accessedAt,
    source_date_field: row.constructionactualcompletion ? "constructionactualcompletion" : "designactualcompletion",
    latitude: lat,
    longitude: lon,
    geometry_source: "Official NYC Open Data Parks Capital Project Tracker row latitude/longitude.",
    geometry_precision: "official project/site point; not a measured construction footprint or as-built boundary",
    confidence: "documented",
    project_type: "NYC Parks capital project completion",
    license_or_terms_note: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
    attribution: dataset.publisher,
    limitations: "Parks tracker completion is a capital-project administrative status record. It does not provide as-built drawings, measured work boundaries, opening ceremonies, maintenance state, accessibility audit, usage, or causal outcome evidence.",
    area: `${row.name || row.title}, ${borough}, New York City`,
    raw_row: row,
    transformation_method: `Round118 official NYC Open Data Parks fetch from ${dataset.id}; selected because actual completion, source coordinates, and public-realm keywords met threshold; duplicate screened against existing manual corpus.`
  };
}

function trimBySource(candidates, sourceId, limit) {
  return candidates
    .filter((candidate) => candidate.source_ids.includes(sourceId))
    .sort((a, b) => {
      const aScore = a.raw_row?.total_units ? parseNumber(a.raw_row.total_units) : parksKeywordScore(a.raw_row || {});
      const bScore = b.raw_row?.total_units ? parseNumber(b.raw_row.total_units) : parksKeywordScore(b.raw_row || {});
      return bScore - aScore || String(b.date).localeCompare(String(a.date));
    })
    .slice(0, limit);
}

async function main() {
  const corpus = readJson(corpusPath);
  const existing = buildExistingIndex(corpus);
  ensureDir(outDir);
  const rejected = [];
  const candidates = [];

  const hpdRows = await fetchAll(DATASETS.hpdBuildings.id, {
    $select: "project_id,project_name,project_start_date,project_completion_date,building_id,house_number,street_name,borough,postcode,bbl,bin,community_board,council_district,census_tract,neighborhood_tabulation_area,latitude,longitude,building_completion_date,reporting_construction_type,extended_affordability_status,prevailing_wage_status,extremely_low_income_units,very_low_income_units,low_income_units,moderate_income_units,middle_income_units,other_income_units,counted_rental_units,counted_homeownership_units,all_counted_units,total_units",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND (building_completion_date IS NOT NULL OR project_completion_date IS NOT NULL)"
  }, "HPD affordable housing buildings");
  for (const row of hpdRows) {
    const candidate = hpdCandidate(row, existing, rejected);
    if (candidate) candidates.push(candidate);
  }

  const parksRows = await fetchAll(DATASETS.parksCapital.id, {
    $select: "trackerid,fmsid,title,summary,currentphase,designactualcompletion,constructionactualcompletion,totalfunding,lastupdated,name,parkid,latitude,longitude,borough",
    $where: "latitude IS NOT NULL AND longitude IS NOT NULL AND (constructionactualcompletion IS NOT NULL OR designactualcompletion IS NOT NULL)"
  }, "NYC Parks capital projects");
  for (const row of parksRows) {
    const candidate = parksCandidate(row, existing, rejected);
    if (candidate) candidates.push(candidate);
  }

  const selected = [
    ...trimBySource(candidates, DATASETS.hpdBuildings.sourceId, 350),
    ...trimBySource(candidates, DATASETS.parksCapital.sourceId, 250)
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.event_id.localeCompare(b.event_id));

  const payload = {
    generated_at: `${accessedAt}T00:00:00Z`,
    source_audits: [
      {
        source_id: DATASETS.hpdBuildings.sourceId,
        source_name: DATASETS.hpdBuildings.name,
        publisher: DATASETS.hpdBuildings.publisher,
        url: DATASETS.hpdBuildings.page,
        license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
        coverage_years: "HPD affordable housing production records with completion dates; Round118 filtered to 2008-01-01 through 2026-05-19.",
        geography: "HPD row latitude/longitude building/address point.",
        reliability: "strong for administrative production-completion status; usable with caveats for exact occupancy/opening.",
        caveats: "Completion is an HPD production milestone, not necessarily first occupancy, DOB final CO, tenant move-in, or full project closeout.",
        recommendation: "Append high-unit-count rows with row URL, source date field, coordinates, units, and limitations."
      },
      {
        source_id: DATASETS.parksCapital.sourceId,
        source_name: DATASETS.parksCapital.name,
        publisher: DATASETS.parksCapital.publisher,
        url: DATASETS.parksCapital.page,
        license: "NYC Open Data / NYC.gov terms; dataset metadata should be checked for dataset-specific notes.",
        coverage_years: "Parks capital tracker records with actual completion dates; Round118 filtered to 2008-01-01 through 2026-05-19.",
        geography: "Parks tracker project/site latitude/longitude point.",
        reliability: "strong for tracker milestone status; usable with caveats for exact as-built scope/opening.",
        caveats: "Capital tracker completion does not supply measured work footprint, opening ceremony, usage, maintenance, or outcome effects.",
        recommendation: "Append architecture/public-realm-relevant completions with tracker ID and source date field."
      }
    ],
    candidates: selected,
    rejected
  };
  fs.writeFileSync(path.join(outDir, "candidates.json"), `${JSON.stringify(payload, null, 2)}\n`);

  const bySource = {};
  for (const candidate of selected) {
    const sourceId = candidate.source_ids[0];
    bySource[sourceId] = (bySource[sourceId] || 0) + 1;
  }
  const notes = [
    "# Round118 NYC HPD/Parks official candidate fetch",
    "",
    `Generated ${selected.length} candidates and ${rejected.length} rejects on ${accessedAt}.`,
    "",
    "## Selected by source",
    ...Object.entries(bySource).map(([source, count]) => `- ${source}: ${count}`),
    "",
    "## Caveats",
    "- HPD rows are administrative housing-production completions, not independent evidence of first occupancy or full project closeout.",
    "- Parks rows are tracker completion records, not measured as-built footprints or opening/status audits.",
    "- Existing manual corpus source IDs, row IDs, and URLs were used for duplicate screening before writing candidates."
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "notes.md"), `${notes}\n`);

  console.log(JSON.stringify({ selected: selected.length, rejected: rejected.length, bySource }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
