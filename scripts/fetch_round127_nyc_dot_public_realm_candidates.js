const fs = require("fs");
const https = require("https");
const path = require("path");

const OUT_DIR = "tmp/subagents/round127_nyc_dot_public_realm_reconstruction";
const SOURCE_ID = "nyc-dot-public-realm-capital-reconstruction-block-jvk9-k4re";
const DOT_BLOCK_URL = "https://data.cityofnewyork.us/Transportation/Street-and-Highway-Capital-Reconstruction-Project/jvk9-k4re";
const API_BASE = "https://data.cityofnewyork.us/resource/jvk9-k4re.json";
const RETRIEVED_AT = "2026-05-19";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 500)}`));
            return;
          }
          resolve(JSON.parse(body));
        });
      })
      .on("error", reject);
  });
}

function queryUrl() {
  const params = new URLSearchParams({
    $select: [
      "projectid",
      "projtitle",
      "fmsid",
      "leadagency",
      "managingag",
      "projecttyp",
      "projectt_1",
      "projectsta",
      "constructi",
      "overallsco",
      "onstreetna",
      "fromstreet",
      "tostreetna",
      "boroughnam",
      "safetyscop",
      "the_geom"
    ].join(","),
    $where: "projectsta='Completed Project' AND constructi between '2008' and '2026' AND safetyscop IS NOT NULL",
    $limit: "50000"
  });
  return `${API_BASE}?${params.toString()}`;
}

function walkCoordinates(geometry, collector) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return;
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      collector(value[0], value[1]);
      return;
    }
    for (const item of value) visit(item);
  };
  visit(geometry.coordinates);
}

function centroid(rows) {
  let sumLon = 0;
  let sumLat = 0;
  let count = 0;
  for (const row of rows) {
    walkCoordinates(row.the_geom, (lon, lat) => {
      sumLon += lon;
      sumLat += lat;
      count += 1;
    });
  }
  if (!count) return null;
  return { longitude: sumLon / count, latitude: sumLat / count, coordinate_count: count };
}

function slug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 80);
}

function sourceUrlFor(row) {
  const params = new URLSearchParams({
    projectid: row.projectid,
    fmsid: row.fmsid
  });
  return `${API_BASE}?${params.toString()}`;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort();
}

function candidateFor(group) {
  const row = group.rows[0];
  const center = centroid(group.rows);
  if (!center) return null;
  const year = String(row.constructi || "").slice(0, 4);
  if (!/^\d{4}$/.test(year)) return null;
  const streets = uniqueSorted(group.rows.map((item) => item.onstreetna)).slice(0, 6);
  const fromTo = uniqueSorted(group.rows.map((item) => {
    if (!item.fromstreet && !item.tostreetna) return "";
    return `${item.fromstreet || "unspecified"} to ${item.tostreetna || "unspecified"}`;
  })).slice(0, 6);
  const scopes = uniqueSorted(group.rows.flatMap((item) => String(item.safetyscop || "").split(","))).slice(0, 8);
  const projectTitle = String(row.projtitle || "street and highway capital reconstruction project").trim();
  const area = [row.boroughnam, streets.join("; ")].filter(Boolean).join(" - ");
  const sourceRecordId = `DOT projectid ${row.projectid}; fmsid ${row.fmsid}; ${group.rows.length} block row(s)`;

  return {
    city_id: "nyc",
    candidate_id: `round127_nyc_dot_${row.projectid}_${slug(row.fmsid)}_${year}`,
    title: `NYC DOT public-realm reconstruction completed: ${projectTitle}`,
    summary: `NYC DOT block-level capital reconstruction data records ${projectTitle} as a completed project in ${year}. Retained safety/public-realm scope values include ${scopes.join(", ") || "not specified"}.`,
    observed_change: `NYC DOT records a completed street/highway capital reconstruction project in ${year}; this is an observed public-realm infrastructure milestone, not an outcome or usage claim.`,
    effective_date: year,
    date_precision: "year",
    bucket: "planning/development/architecture/public_realm",
    area,
    latitude: Number(center.latitude.toFixed(7)),
    longitude: Number(center.longitude.toFixed(7)),
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: "NYC DOT Street and Highway Capital Reconstruction Projects - Block",
    publisher: "NYC Department of Transportation via NYC Open Data",
    source_url: sourceUrlFor(row),
    source_record_id: sourceRecordId,
    source_type: "official open-data spatial project row group",
    accessed_at: RETRIEVED_AT,
    source_date_field: "constructi year field with projectsta='Completed Project'",
    source_dataset_id: SOURCE_ID,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: "street, sidewalk, plaza, curb, median, bikeway or related public-realm capital reconstruction",
    geometry_source: "Centroid calculated from official NYC Open Data MultiLineString block geometries for matching projectid and fmsid rows.",
    geometry_precision: `aggregated project review point from ${center.coordinate_count} source coordinate(s), not a measured project footprint or legal boundary`,
    license_or_terms_note: "NYC Open Data terms apply; factual row metadata and source URLs retained with dataset attribution.",
    license: "NYC Open Data terms of use",
    attribution: "NYC Department of Transportation via NYC Open Data",
    limitations: `DOT block rows are street-segment geometries and the construction year is year-level. The grouped point supports atlas discovery only. Source rows do not document building construction, occupancy, usage, safety outcomes, traffic effects, or causal relationships. Streets sampled: ${streets.join("; ") || "not specified"}. Segment labels sampled: ${fromTo.join("; ") || "not specified"}.`,
    raw_group: {
      projectid: row.projectid,
      fmsid: row.fmsid,
      leadagency: row.leadagency,
      managingag: row.managingag,
      projecttyp: row.projecttyp,
      projectt_1: row.projectt_1,
      projectsta: row.projectsta,
      constructi: row.constructi,
      overallsco: row.overallsco,
      boroughnam: row.boroughnam,
      safetyscop_values: scopes,
      street_values: streets,
      source_row_count: group.rows.length
    }
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = await fetchJson(queryUrl());
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.projectid || ""}|${row.fmsid || ""}`;
    if (!row.projectid || !row.fmsid || !row.the_geom) continue;
    if (!groups.has(key)) groups.set(key, { rows: [] });
    groups.get(key).rows.push(row);
  }

  const candidates = [...groups.values()]
    .map(candidateFor)
    .filter(Boolean)
    .filter((candidate) => {
      const scope = `${candidate.title} ${candidate.raw_group.safetyscop_values.join(" ")} ${candidate.raw_group.overallsco}`.toLowerCase();
      return /(plaza|sidewalk|curb|median|bike|bus bulb|shared street|intersection|public.realm|pedestrian)/.test(scope);
    })
    .sort((a, b) => String(b.effective_date).localeCompare(String(a.effective_date)) || a.title.localeCompare(b.title))
    .slice(0, 220);

  const pack = {
    schema_version: "round127.nyc_dot_public_realm_reconstruction.v1",
    created_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    scope: "NYC DOT official open-data project-level candidates derived from block-level Street and Highway Capital Reconstruction Projects rows. Rows are grouped by projectid and fmsid, limited to completed projects from 2008-2026 with public-realm/safety scope terms and usable source geometry.",
    candidate_count: candidates.length,
    candidates
  };

  const sourceAudit = {
    schema_version: "round127.nyc_dot_public_realm_reconstruction.source_audit.v1",
    created_at: RETRIEVED_AT,
    sources: [
      {
        source_id: SOURCE_ID,
        source_name: "NYC DOT Street and Highway Capital Reconstruction Projects - Block",
        publisher: "NYC Department of Transportation via NYC Open Data",
        source_url: DOT_BLOCK_URL,
        source_type: "official open-data spatial project dataset",
        accessed_at: RETRIEVED_AT,
        license_or_terms_note: "NYC Open Data terms apply. Attribute NYC Department of Transportation and NYC Open Data; no warranty is implied by the source dataset.",
        attribution_requirements: "Attribute NYC Department of Transportation via NYC Open Data.",
        coverage_years: "Completed project rows with construction years from 2008 through 2026, filtered for public-realm/safety scope values.",
        update_frequency: "Monthly according to NYC Open Data metadata.",
        geographic_scope: "New York City street and highway capital reconstruction block geometries.",
        granularity: "Source rows are block/segment geometries. This pack groups rows by projectid and fmsid to create project-level atlas candidates.",
        key_fields_for_events: [
          "projectid",
          "fmsid",
          "projtitle",
          "projectsta",
          "constructi",
          "safetyscop",
          "the_geom"
        ],
        geometry_fields: "the_geom MultiLineString rows grouped by projectid and fmsid; candidate point is the arithmetic centroid of source coordinates.",
        reliability: "strong for source-backed project existence, completed status, year-level timing, scope label, and block-level geometry; weaker for precise completion dates and final as-built boundaries.",
        required_caveats: [
          "Construction year is year-level and may be fiscal-year-like rather than an exact completion date.",
          "Grouped centroids are for discovery only and do not represent full project footprints or legal boundaries.",
          "Street reconstruction rows do not establish changes in safety, traffic, economic activity, or other outcomes."
        ],
        ingestion_recommendation: "Use as public-realm infrastructure milestones with year precision. Keep source row IDs, project/FMS IDs, scope values, and geometry caveats visible in evidence drawers."
      }
    ]
  };

  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), `${JSON.stringify(pack, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "source_audit.json"), `${JSON.stringify(sourceAudit, null, 2)}\n`);
  fs.writeFileSync(
    path.join(OUT_DIR, "notes.md"),
    [
      "# Round 127 NYC DOT Public-Realm Reconstruction",
      "",
      `Fetched ${rows.length} completed block rows from NYC Open Data dataset jvk9-k4re on ${RETRIEVED_AT}.`,
      `Grouped into ${groups.size} project/FMS groups and retained ${candidates.length} candidate project-level milestones.`,
      "",
      "The candidate event date uses the `constructi` year field and is intentionally year precision."
    ].join("\n")
  );

  console.log(JSON.stringify({ rows: rows.length, groups: groups.size, candidates: candidates.length, outDir: OUT_DIR }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
