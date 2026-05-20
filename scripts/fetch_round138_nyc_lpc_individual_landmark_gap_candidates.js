const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RETRIEVED_AT = "2026-05-19";
const SOURCE_ID = "nyc-lpc-individual-landmark-sites-buis-pvji";
const SOURCE_URL = "https://data.cityofnewyork.us/Housing-Development/Individual-Landmark-Sites/buis-pvji";
const RAW_PATH = path.join(ROOT, "tmp", "nyc_lpc_2008_2026_rows_round110.json");
const CORPUS_PATH = path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round138_nyc_lpc_individual_landmark_gaps");
const OUT_PATH = path.join(OUT_DIR, "candidates.json");
const AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function cleanText(value, limit) {
  const text = String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return limit && text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

function slugify(value, limit = 96) {
  const slug = cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
  return (slug || "lpc_landmark").slice(0, limit).replace(/_+$/g, "");
}

function dateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function flattenCoords(coords, out = []) {
  if (!Array.isArray(coords)) return out;
  if (coords.length >= 2 && coords.every((value) => typeof value === "number")) {
    out.push(coords);
    return out;
  }
  for (const item of coords) flattenCoords(item, out);
  return out;
}

function pointFor(row) {
  const coords = flattenCoords(row.the_geom?.coordinates || []);
  if (!coords.length) return null;
  const sums = coords.reduce((acc, [lon, lat]) => {
    acc.lon += lon;
    acc.lat += lat;
    return acc;
  }, { lon: 0, lat: 0 });
  const longitude = sums.lon / coords.length;
  const latitude = sums.lat / coords.length;
  if (longitude < -74.2591 || longitude > -73.7004 || latitude < 40.4774 || latitude > 40.9176) return null;
  return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}

function existingLpcText(corpus) {
  const events = (corpus.events || []).filter((event) => (
    (event.city_id === "nyc") &&
    (event.source_dataset_id || (event.source_ids || []).join(" ")).toLowerCase().includes("lpc")
  ));
  return JSON.stringify(events).toLowerCase();
}

function isPresent(row, existingText) {
  return [row.objectid, row.lpc_lpnumb, row.lpc_name, row.url_report]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .some((token) => existingText.includes(token));
}

function candidateFor(row) {
  const date = dateOnly(row.desdate);
  const point = pointFor(row);
  const lpNumber = cleanText(row.lpc_lpnumb);
  const name = cleanText(row.lpc_name);
  const address = cleanText(row.address || "New York City");
  const objectId = cleanText(row.objectid);
  return {
    city_id: "nyc",
    candidate_id: `nyc_lpc_individual_gap_round138_${slugify(lpNumber)}_${slugify(name, 64)}_${date.replace(/-/g, "_")}`,
    title: `${name} was designated an individual landmark`,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber}) at ${address} as an individual landmark designated on ${date}.`,
    observed_change: "The official LPC row documents an individual-landmark designation, a legal/protective status milestone for the named site.",
    date,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_status",
    area: address,
    latitude: point.latitude,
    longitude: point.longitude,
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: "NYC Open Data: Individual Landmark Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    source_url: `https://data.cityofnewyork.us/resource/buis-pvji.json?objectid=${encodeURIComponent(objectId)}`,
    source_record_id: `objectid ${objectId}; ${lpNumber}`,
    source_type: "official NYC Open Data Socrata API row",
    accessed_at: RETRIEVED_AT,
    source_date_field: "desdate (LPC designation date)",
    source_dataset_id: SOURCE_ID,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: "administrative heritage status - LPC individual landmark designation",
    geometry_source: `Official LPC Individual Landmark Sites geometry from objectid ${objectId}.`,
    geometry_precision: "centroid derived from official multipolygon coordinates for atlas navigation; use the source geometry for legal/site extent",
    license_or_terms_note: "NYC Open Data FAQ states no restrictions on Open Data use; NYC.gov Terms of Use and dataset-specific metadata still apply.",
    attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
    limitations: "Individual landmark designation rows document legal/protective status only. They are not construction, restoration, permit activity, current occupancy, owner action, physical condition change, or preservation outcome evidence.",
    transformation_method: "scripts/fetch_round138_nyc_lpc_individual_landmark_gap_candidates.js parsed the local official LPC 2008-2026 row cache, screened LP numbers/object IDs/names/report URLs against current corpus LPC events, computed an atlas centroid from source multipolygon geometry, and retained only missing row-level designation records.",
    raw_context: {
      objectid: objectId,
      lpc_lpnumb: lpNumber,
      lpc_name: name,
      landmark_type: cleanText(row.landmarkty),
      borough: cleanText(row.borough),
      address,
      url_report: cleanText(row.url_report)
    }
  };
}

function main() {
  const rawRows = readJson(RAW_PATH).value || [];
  const corpus = readJson(CORPUS_PATH);
  const existingText = existingLpcText(corpus);
  const candidates = [];
  const rejected = {};

  for (const row of rawRows) {
    const date = dateOnly(row.desdate);
    if (!date || date < "2008-01-01" || date > RETRIEVED_AT) {
      rejected.outside_date_window = (rejected.outside_date_window || 0) + 1;
      continue;
    }
    if (row.landmarkty !== "Individual Landmark") {
      rejected.not_individual_landmark = (rejected.not_individual_landmark || 0) + 1;
      continue;
    }
    if (!pointFor(row)) {
      rejected.missing_geometry = (rejected.missing_geometry || 0) + 1;
      continue;
    }
    if (isPresent(row, existingText)) {
      rejected.already_represented = (rejected.already_represented || 0) + 1;
      continue;
    }
    candidates.push(candidateFor(row));
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  const sourceAudit = {
    source_audits: [
      {
        source_id: SOURCE_ID,
        source_name: "NYC Open Data: Individual Landmark Sites",
        publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
        source_url: SOURCE_URL,
        api_endpoint: "https://data.cityofnewyork.us/resource/buis-pvji.json",
        source_type: "official NYC Open Data Socrata dataset",
        license_or_terms_note: "NYC Open Data FAQ states no restrictions on Open Data use; NYC.gov Terms of Use and dataset-specific metadata still apply.",
        license_url: "https://opendata.cityofnewyork.us/faq/",
        accessed_at: RETRIEVED_AT,
        coverage_years_checked: "Local official row cache filtered to 2008-01-01 through 2026-05-19.",
        geographic_scope: "New York City individual landmark polygons/points from LPC Open Data.",
        key_fields_used: ["objectid", "borough", "address", "lpc_name", "lpc_lpnumb", "desdate", "landmarkty", "url_report", "the_geom"],
        reliability_assessment: "strong for LPC individual-landmark administrative designation status",
        required_caveats: "Designation is a legal/protective status milestone, not evidence of construction, restoration, occupancy, condition, owner action, or preservation outcome.",
        ingestion_recommendation: "Append as documented heritage-status milestones after duplicate screening against existing LPC corpus rows."
      }
    ]
  };

  const summary = {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    source_id: SOURCE_ID,
    raw_rows: rawRows.length,
    candidates: candidates.length,
    rejected,
    by_year: candidates.reduce((acc, candidate) => {
      const year = candidate.date.slice(0, 4);
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {})
  };

  writeJson(OUT_PATH, {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    task: "Round138 missing NYC LPC individual-landmark designation records",
    source_audits: sourceAudit.source_audits,
    candidates
  });
  writeJson(AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, summary);
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT_PATH), ...summary }, null, 2));
}

main();
