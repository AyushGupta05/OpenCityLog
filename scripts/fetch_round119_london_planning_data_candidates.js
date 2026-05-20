const fs = require("fs");
const path = require("path");

const outDir = "tmp/subagents/round119_london_planning_data_local";
const outPath = path.join(outDir, "candidates.json");
const accessedAt = "2026-05-19";
const startDate = "2008-01-01";
const endDate = accessedAt;

const londonEnvelope = { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 };

const datasets = [
  {
    dataset: "listed-building",
    sourceId: "planning-data-listed-building",
    title: "Planning Data listed-building records",
    projectType: "listed building status",
    bucket: "planning/development/architecture/heritage_status",
    dateField: "start-date",
    dateFallback: "",
    maxCandidates: 45,
    minDateMode: "start-date",
    observedChange: "Planning Data records a listed-building status row for the cited building or structure.",
    limitation: "Listed-building rows document statutory heritage status. start-date is used as the source-stated listing/status start date where supplied. Rows are not evidence of construction, alteration, repair, occupation, opening, building condition, or outcome effects."
  },
  {
    dataset: "locally-listed-building",
    sourceId: "planning-data-locally-listed-building",
    title: "Planning Data locally listed building records",
    projectType: "local heritage status",
    bucket: "planning/development/architecture/local_heritage_status",
    dateField: "start-date",
    dateFallback: "entry-date",
    maxCandidates: 45,
    minDateMode: "start-or-entry-date",
    observedChange: "Planning Data records locally listed building status for the cited local heritage asset.",
    limitation: "Locally listed building rows document local heritage/status records. entry-date is a source-data publication or observation date where no original local-list adoption date is supplied. Rows are not evidence of construction, alteration, repair, occupation, opening, building condition, or outcome effects."
  },
  {
    dataset: "certificate-of-immunity",
    sourceId: "planning-data-certificate-of-immunity",
    title: "Planning Data certificate of immunity records",
    projectType: "certificate of immunity from listing",
    bucket: "planning/development/architecture/heritage_planning_control",
    dateField: "start-date",
    dateFallback: "entry-date",
    maxCandidates: 35,
    minDateMode: "start-or-entry-date",
    observedChange: "Planning Data records a certificate-of-immunity status row for the cited building or site.",
    limitation: "Certificate-of-immunity rows document an administrative heritage-control status. They are not evidence of construction, alteration, repair, occupation, opening, building condition, or outcome effects."
  },
  {
    dataset: "building-preservation-notice",
    sourceId: "planning-data-building-preservation-notice",
    title: "Planning Data building preservation notice records",
    projectType: "building preservation notice",
    bucket: "planning/development/architecture/heritage_planning_control",
    dateField: "start-date",
    dateFallback: "entry-date",
    maxCandidates: 25,
    minDateMode: "start-or-entry-date",
    observedChange: "Planning Data records a building-preservation-notice status row for the cited building or site.",
    limitation: "Building-preservation-notice rows document an administrative heritage-control status. They are not evidence of construction, alteration, repair, occupation, opening, building condition, or outcome effects."
  }
];

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
    .slice(0, 100)
    .replace(/_+$/g, "");
}

function parseDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) return "";
  if (match[2] && match[3]) return `${match[1]}-${match[2]}-${match[3]}`;
  if (match[2]) return `${match[1]}-${match[2]}`;
  return match[1];
}

function comparableDate(value) {
  const text = String(value || "");
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function datePrecision(value) {
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}$/.test(value)) return "month";
  return "day";
}

function inWindow(value) {
  const comparable = comparableDate(value);
  return comparable >= startDate && comparable <= endDate;
}

function parsePoint(row) {
  const point = String(row.point || "");
  const pointMatch = point.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (pointMatch) return { lon: Number(pointMatch[1]), lat: Number(pointMatch[2]), source: "Planning Data point field" };

  const geometry = String(row.geometry || "");
  const numbers = [...geometry.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
    .slice(0, 500)
    .map((match) => ({ lon: Number(match[1]), lat: Number(match[2]) }))
    .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
  if (numbers.length) {
    const lon = numbers.reduce((sum, item) => sum + item.lon, 0) / numbers.length;
    const lat = numbers.reduce((sum, item) => sum + item.lat, 0) / numbers.length;
    return { lon, lat, source: "Approximate centroid derived from Planning Data geometry coordinates" };
  }
  return null;
}

function inLondon(point) {
  return point &&
    point.lon >= londonEnvelope.minLon && point.lon <= londonEnvelope.maxLon &&
    point.lat >= londonEnvelope.minLat && point.lat <= londonEnvelope.maxLat;
}

function planningUrl(params) {
  const url = new URL("https://www.planning.data.gov.uk/entity.json");
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
      const waitMs = 1000 * attempt * attempt;
      console.warn(`${label}: attempt ${attempt} failed (${error.message}); retrying in ${waitMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function fetchDataset(dataset) {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; offset < 500000; offset += pageSize) {
    const url = planningUrl({ dataset: dataset.dataset, limit: String(pageSize), offset: String(offset) });
    const page = await fetchJsonWithRetry(url, `${dataset.dataset} offset ${offset}`);
    const entities = page.entities || [];
    rows.push(...entities);
    console.log(`${dataset.dataset}: fetched ${rows.length}`);
    if (rows.length > 0 && rows.length % 50000 === 0) {
      const londonRows = rows.filter((row) => inLondon(parsePoint(row))).length;
      if (londonRows >= dataset.maxCandidates * 8) break;
    }
    if (entities.length < pageSize) break;
  }
  return rows;
}

function score(row, date, point) {
  let value = 0;
  const grade = String(row["listed-building-grade"] || "").toUpperCase();
  if (grade === "I") value += 120;
  if (grade === "II*") value += 90;
  if (grade === "II") value += 20;
  const year = Number(String(date).slice(0, 4));
  value += Math.max(0, year - 2007);
  if (row.geometry) value += 8;
  if (point?.source.includes("point")) value += 6;
  if (/station|library|school|hospital|theatre|museum|market|cinema|church|town hall|bridge|estate|college|university/i.test(row.name || "")) value += 20;
  return value;
}

function candidateFor(row, dataset, date, point) {
  const sourceUrl = row["documentation-url"] || `https://www.planning.data.gov.uk/entity/${row.entity}`;
  const entityUrl = `https://www.planning.data.gov.uk/entity/${row.entity}`;
  const gradeText = row["listed-building-grade"] ? `, grade ${row["listed-building-grade"]}` : "";
  const refText = row.reference ? `reference ${row.reference}` : `entity ${row.entity}`;
  const dateField = row[dataset.dateField] ? dataset.dateField : dataset.dateFallback;
  const sourceDateNote = row[dataset.dateField]
    ? `${dataset.dateField} as supplied by Planning Data`
    : `${dataset.dateFallback} used as source-observed status date because ${dataset.dateField} is blank`;
  return {
    city_id: "london",
    candidate_id: `round119_lon_${slugify(`${dataset.dataset}_${row.entity}_${date}`)}`,
    title: `${dataset.title.replace("Planning Data ", "Planning Data records ")} for ${row.name || refText}`,
    summary: `Planning Data ${dataset.dataset} entity ${row.entity} records ${row.name || "the cited asset"} (${refText}${gradeText}) with ${sourceDateNote}.`,
    observed_change: dataset.observedChange,
    date,
    effective_date: date,
    date_precision: datePrecision(date),
    source_id: dataset.sourceId,
    source_ids: [dataset.sourceId],
    source_name: dataset.title,
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / Historic England or local planning authorities",
    source_url: sourceUrl || entityUrl,
    source_record_id: `${dataset.dataset} entity ${row.entity}; reference ${row.reference || ""}`.trim(),
    source_type: "official Planning Data entity JSON row",
    accessed_at: accessedAt,
    source_date_field: sourceDateNote,
    latitude: Number(point.lat.toFixed(6)),
    longitude: Number(point.lon.toFixed(6)),
    geometry_source: `${point.source}; source entity page ${entityUrl}.`,
    geometry_precision: point.source.includes("centroid") ? "approximate centroid from source geometry; not a surveyed building footprint" : "Planning Data point for atlas navigation; not a surveyed building footprint",
    confidence: "documented",
    project_type: dataset.projectType,
    license_or_terms_note: "Planning Data is published under the Open Government Licence v3.0 with Crown copyright/database right attribution where stated.",
    attribution: "Ministry of Housing, Communities and Local Government Planning Data / Historic England or local planning authorities",
    limitations: dataset.limitation,
    transformation_method: `Round119 local Planning Data fetcher selected ${dataset.dataset} entity ${row.entity}; filtered to London coordinate envelope, 2008-2026 source date window, non-empty provenance fields, and high-signal architecture/heritage status rows.`
  };
}

async function main() {
  ensureDir(outDir);
  const candidates = [];
  const rejected = [];
  const sourceAudits = datasets.map((dataset) => ({
    source_id: dataset.sourceId,
    source_name: dataset.title,
    publisher: "Ministry of Housing, Communities and Local Government Planning Data / Historic England or local planning authorities",
    source_url: `https://www.planning.data.gov.uk/dataset/${dataset.dataset}`,
    source_type: "official Planning Data entity API",
    accessed_at: accessedAt,
    coverage_years_checked: "2008-2026 source-date window, filtered to representative London coordinates.",
    geographic_scope: "London coordinate envelope within England-wide Planning Data records.",
    date_fields_observed: `${dataset.dateField}${dataset.dateFallback ? ` with ${dataset.dateFallback} fallback` : ""}`,
    geometry_fields_observed: "point field where supplied, otherwise approximate centroid from geometry coordinates.",
    license_or_terms_note: "Open Government Licence v3.0 with Crown copyright/database right attribution where stated by Planning Data.",
    reliability: "Strong for source-record status and identifiers; usable with caveats for effective dates when only entry-date is supplied.",
    caveats: dataset.limitation,
    recommendation: "Use as documented administrative/status milestones, not physical construction or outcome records."
  }));

  for (const dataset of datasets) {
    const rows = await fetchDataset(dataset);
    const selected = [];
    for (const row of rows) {
      const point = parsePoint(row);
      if (!inLondon(point)) {
        rejected.push({ source_dataset_id: dataset.dataset, source_record_id: row.entity || row.reference || "", reason: "Outside London coordinate envelope or missing usable point." });
        continue;
      }
      const primaryDate = parseDate(row[dataset.dateField]);
      const fallbackDate = parseDate(row[dataset.dateFallback]);
      const date = primaryDate || fallbackDate;
      if (!date || !inWindow(date)) {
        rejected.push({ source_dataset_id: dataset.dataset, source_record_id: row.entity || row.reference || "", reason: `Missing or out-of-window ${dataset.minDateMode}.` });
        continue;
      }
      selected.push({ row, date, point, score: score(row, date, point) });
    }
    selected.sort((a, b) => b.score - a.score || String(b.date).localeCompare(String(a.date)) || Number(a.row.entity) - Number(b.row.entity));
    candidates.push(...selected.slice(0, dataset.maxCandidates).map((item) => candidateFor(item.row, dataset, item.date, item.point)));
  }

  fs.writeFileSync(outPath, `${JSON.stringify({ source_audits: sourceAudits, candidates, rejected: rejected.slice(0, 600) }, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "notes.md"), [
    "# Round119 London Planning Data Local Fetch",
    "",
    "Fetched Planning Data entity API rows for listed-building, locally-listed-building, certificate-of-immunity, and building-preservation-notice datasets.",
    "Rows were filtered to the London coordinate envelope and 2008-2026 source-date window.",
    "Rows with only `entry-date` are status-observed records, not original adoption, designation, or physical-change dates.",
    "The candidate pack keeps factual metadata, identifiers, source URLs and caveats only."
  ].join("\n"));
  console.log(JSON.stringify({ candidates: candidates.length, rejected: rejected.length, outPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
