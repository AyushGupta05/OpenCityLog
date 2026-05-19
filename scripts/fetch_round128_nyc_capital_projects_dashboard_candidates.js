const fs = require("fs");
const path = require("path");

const retrievedAt = "2026-05-19";
const outDir = "tmp/subagents/round128_nyc_capital_projects_dashboard";
const outPath = path.join(outDir, "candidates.json");

const sourceId = "nyc-capital-projects-dashboard-budget-schedule-fb86-vt7u";
const datasetPage = "https://data.cityofnewyork.us/City-Government/Capital-Projects-Dashboard-Citywide-Budget-and-Sched/fb86-vt7u";
const apiEndpoint = "https://data.cityofnewyork.us/resource/fb86-vt7u.json";

const boroughPoints = {
  "Bronx": { latitude: 40.8448, longitude: -73.8648 },
  "Brooklyn": { latitude: 40.6782, longitude: -73.9442 },
  "Manhattan": { latitude: 40.7831, longitude: -73.9712 },
  "Queens": { latitude: 40.7282, longitude: -73.7949 },
  "Staten Island": { latitude: 40.5795, longitude: -74.1502 }
};

const includePattern = /park|playground|ballfield|recreat|facility|facilities|building|court|police|public safety|shelter|clinic|branch|zoo|ferry terminal|waterfront|boardwalk|sidewalk|pedestrian|plaza|office space|renovation|reconstruction|construction/i;
const excludePattern = /equipment|vehicles|tree planting|management information|data processing|capital equipment|press|stitcher|collator|information system|software|meters/i;

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isoDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function queryString(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function fetchAll(params) {
  const limit = 50000;
  const rows = [];
  for (let offset = 0; ; offset += limit) {
    const url = `${apiEndpoint}?${queryString({ ...params, "$limit": limit, "$offset": offset })}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fb86-vt7u fetch failed: ${response.status} ${response.statusText}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error(`fb86-vt7u returned non-array payload: ${JSON.stringify(batch).slice(0, 200)}`);
    rows.push(...batch);
    if (batch.length < limit) break;
  }
  return rows;
}

function parseSingleBorough(value) {
  const text = cleanText(value);
  const matches = Object.keys(boroughPoints).filter((borough) => new RegExp(`\\b${borough}\\b`, "i").test(text));
  return matches.length === 1 ? matches[0] : "";
}

function latestRowsByFmsId(rows) {
  const byFmsId = new Map();
  for (const row of rows) {
    const fmsId = cleanText(row.fms_id);
    if (!fmsId) continue;
    const current = byFmsId.get(fmsId);
    const rowDate = isoDate(row.fms_data_date) || row.reporting_period || "";
    const currentDate = current ? (isoDate(current.fms_data_date) || current.reporting_period || "") : "";
    if (!current || rowDate >= currentDate) byFmsId.set(fmsId, row);
  }
  return [...byFmsId.values()];
}

function typeFor(row) {
  const text = `${row.ten_year_plan_category || ""} ${row.agency_project_name || ""} ${row.fms_project_name || ""}`.toLowerCase();
  if (/park|playground|ballfield|plaza|boardwalk|pedestrian|sidewalk|waterfront/.test(text)) return "parks/public realm capital project";
  if (/clinic|health|hospital/.test(text)) return "health facility capital project";
  if (/police|public safety|jail|court|correction/.test(text)) return "justice/public safety capital project";
  if (/shelter|social service|child welfare/.test(text)) return "social service facility capital project";
  if (/branch|library/.test(text)) return "library/civic branch capital project";
  if (/ferry terminal/.test(text)) return "ferry terminal capital project";
  if (/zoo|recreat/.test(text)) return "recreation/cultural facility capital project";
  return "public facility capital project";
}

function categorySlug(value) {
  return cleanText(value || "capital_project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72) || "capital_project";
}

function candidateFor(row) {
  const date = isoDate(row.actual_construction_end);
  if (!date || date < "2008-01-01" || date > retrievedAt) return null;
  const borough = parseSingleBorough(row.borough);
  if (!borough) return null;
  const textForFilter = cleanText([
    row.ten_year_plan_category,
    row.agency_project_name,
    row.fms_project_name,
    row.agency_project_description
  ].filter(Boolean).join(" "));
  if (!includePattern.test(textForFilter) || excludePattern.test(textForFilter)) return null;
  const point = boroughPoints[borough];
  const fmsId = cleanText(row.fms_id);
  const pid = cleanText(row.pid);
  const projectName = cleanText(row.agency_project_name || row.fms_project_name || `Capital project ${fmsId}`);
  const fmsName = cleanText(row.fms_project_name);
  const description = cleanText(row.agency_project_description);
  const category = cleanText(row.ten_year_plan_category || "Capital project");
  const projectType = typeFor(row);
  const agencies = [row.managing_agency, row.sponsor_agency].map(cleanText).filter(Boolean).join(" / ");

  return {
    city_id: "nyc",
    candidate_id: `nyc-cpdb-fb86-${fmsId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}-actual-construction-end-${date}`,
    date,
    date_precision: "day",
    bucket: `planning/development/architecture/${categorySlug(projectType)}`,
    title: `NYC Capital Projects Dashboard recorded actual construction end for ${projectName}`,
    summary: `The NYC Capital Projects Dashboard citywide budget/schedule row records actual_construction_end ${date} for ${projectName}. FMS project name: ${fmsName || "not supplied"}; ten-year plan category: ${category}; managing/sponsor agency: ${agencies || "not supplied"}. ${description}`,
    observed_change: `Official capital-project milestone: actual construction end was recorded for ${projectName}. This dashboard milestone does not by itself document public opening, occupancy, final scope, or outcome effects.`,
    area: `${borough}; ${fmsId}${pid ? `; PID ${pid}` : ""}`,
    latitude: point.latitude,
    longitude: point.longitude,
    source_ids: [sourceId],
    source_name: "NYC Capital Projects Dashboard - Citywide Budget and Schedule",
    publisher: "NYC Mayor's Office of Operations / NYC Open Data",
    source_url: `${apiEndpoint}?fms_id=${encodeURIComponent(fmsId)}`,
    source_record_id: `fms_id:${fmsId}; pid:${pid || "not supplied"}; actual_construction_end:${date}; reporting_period:${cleanText(row.reporting_period) || "not supplied"}`,
    source_type: "official NYC Open Data Socrata API capital project budget/schedule row",
    accessed_at: retrievedAt,
    source_date_field: "actual_construction_end",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectType,
    geometry_source: `Borough-level point assigned from dashboard borough field (${borough}) because fb86-vt7u rows do not expose site coordinates.`,
    geometry_precision: "Borough centroid for atlas navigation only; not a project site, footprint, route, parcel, or facility coordinate.",
    license_or_terms_note: "NYC Open Data / NYC.gov terms apply. Attribute NYC Mayor's Office of Operations and NYC Open Data, preserve FMS/PID identifiers and dataset URL, and re-check metadata before redistribution.",
    attribution: "NYC Mayor's Office of Operations / NYC Open Data",
    limitations: "The dashboard row is an administrative capital-program record. It is not independent evidence of public opening, occupancy, construction quality, final delivered scope, operational status, use, safety, regeneration, or causal outcomes. Geometry is borough-level only because the official dataset row lacks site coordinates.",
    raw_row: {
      reporting_period: row.reporting_period,
      managing_agency: row.managing_agency,
      sponsor_agency: row.sponsor_agency,
      pid: row.pid,
      fms_id: row.fms_id,
      fms_project_name: row.fms_project_name,
      agency_project_name: row.agency_project_name,
      agency_project_description: row.agency_project_description,
      current_phase: row.current_phase,
      actual_construction_start: row.actual_construction_start,
      actual_construction_end: row.actual_construction_end,
      borough: row.borough,
      community_board: row.community_board,
      budget_line: row.budget_line,
      ten_year_plan_category: row.ten_year_plan_category,
      agency_data_date: row.agency_data_date,
      fms_data_date: row.fms_data_date
    }
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const rows = await fetchAll({
    "$select": "reporting_period,managing_agency,sponsor_agency,pid,fms_id,total_budget,spend_to_date,fms_project_name,agency_project_name,agency_project_description,current_phase,current_phase_start,actual_design_start,actual_design_end,actual_construction_start,actual_construction_end,borough,community_board,budget_line,ten_year_plan_category,agency_data_date,fms_data_date",
    "$where": "actual_construction_end IS NOT NULL AND actual_construction_end between '2008-01-01T00:00:00' and '2026-05-19T23:59:59'"
  });
  const latestRows = latestRowsByFmsId(rows);
  const candidates = [];
  const rejected = [];
  for (const row of latestRows) {
    const candidate = candidateFor(row);
    if (candidate) candidates.push(candidate);
    else rejected.push({
      fms_id: row.fms_id || "",
      pid: row.pid || "",
      reason: "Missing date/single-borough geometry or filtered as not architecture/public-realm/building related.",
      category: row.ten_year_plan_category || "",
      borough: row.borough || ""
    });
  }
  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  fs.writeFileSync(outPath, `${JSON.stringify({
    generated_at: retrievedAt,
    source_audits: [
      {
        source_id: sourceId,
        source_name: "NYC Capital Projects Dashboard - Citywide Budget and Schedule",
        publisher: "NYC Mayor's Office of Operations / NYC Open Data",
        source_url: datasetPage,
        api_endpoint: apiEndpoint,
        license_or_terms_note: "NYC Open Data / NYC.gov terms apply.",
        coverage_years_checked: "Rows with actual_construction_end from 2008-01-01 through 2026-05-19 were fetched; latest row per FMS ID retained.",
        update_frequency: "Dashboard/open-data update cadence; rows include reporting_period, agency_data_date, and fms_data_date.",
        geographic_scope: "NYC capital projects with borough field; the dataset row does not expose project-site coordinates.",
        key_fields_used: "fms_id, pid, agency_project_name, fms_project_name, agency_project_description, actual_construction_end, borough, ten_year_plan_category.",
        reliability: "usable_with_caveats",
        ingestion_recommendation: "Use actual_construction_end as an administrative construction-phase milestone only. Display borough-level geometry caveat and do not infer opening, occupancy, final scope, or outcomes."
      }
    ],
    candidates,
    rejected
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    fetchedRows: rows.length,
    latestFmsRows: latestRows.length,
    candidates: candidates.length,
    rejected: rejected.length,
    outPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
