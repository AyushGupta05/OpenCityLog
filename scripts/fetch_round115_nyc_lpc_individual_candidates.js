const fs = require("fs");
const path = require("path");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outputDir = "tmp/subagents/round115_nyc_lpc_individual_official";
const outputPath = path.join(outputDir, "round115_nyc_lpc_individual_candidates.json");
const notesPath = path.join(outputDir, "notes.md");
const accessedAt = "2026-05-19";
const datasetId = "buis-pvji";
const datasetUrl = `https://data.cityofnewyork.us/resource/${datasetId}.json?%24limit=50000`;
const startDate = new Date("2008-01-01T00:00:00Z");
const endDate = new Date(`${accessedAt}T23:59:59Z`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeLp(value) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/LP[-\s]?0*(\d+)/);
  if (!match) return text.replace(/[^A-Z0-9]+/g, "");
  return `LP-${match[1].padStart(5, "0")}`;
}

function lpEventToken(value) {
  const normalized = normalizeLp(value);
  const match = normalized.match(/LP-(\d+)/);
  return match ? `lp${match[1]}` : normalized.toLowerCase();
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
    .slice(0, 80)
    .replace(/_+$/g, "");
}

function dateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function boroughName(value) {
  const code = String(value || "").trim().toUpperCase();
  return {
    BK: "Brooklyn",
    BX: "Bronx",
    MN: "Manhattan",
    QN: "Queens",
    SI: "Staten Island"
  }[code] || value || "New York City";
}

function eachCoordinate(geometry, visit) {
  if (!geometry) return;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    visit(geometry.coordinates);
    return;
  }
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      visit(node);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry.coordinates);
}

function centroid(geometry) {
  const coords = [];
  eachCoordinate(geometry, (coordinate) => {
    const lon = Number(coordinate[0]);
    const lat = Number(coordinate[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) coords.push([lon, lat]);
  });
  if (coords.length === 0) return null;
  const sums = coords.reduce((acc, coordinate) => {
    acc.lon += coordinate[0];
    acc.lat += coordinate[1];
    return acc;
  }, { lon: 0, lat: 0 });
  return {
    lon: Number((sums.lon / coords.length).toFixed(7)),
    lat: Number((sums.lat / coords.length).toFixed(7))
  };
}

function centroidForGeometries(geometries) {
  const coords = [];
  for (const geometry of geometries) {
    eachCoordinate(geometry, (coordinate) => {
      const lon = Number(coordinate[0]);
      const lat = Number(coordinate[1]);
      if (Number.isFinite(lon) && Number.isFinite(lat)) coords.push([lon, lat]);
    });
  }
  if (coords.length === 0) return null;
  const sums = coords.reduce((acc, coordinate) => {
    acc.lon += coordinate[0];
    acc.lat += coordinate[1];
    return acc;
  }, { lon: 0, lat: 0 });
  return {
    lon: Number((sums.lon / coords.length).toFixed(7)),
    lat: Number((sums.lat / coords.length).toFixed(7))
  };
}

function collectExistingLpNumbers(doc) {
  const numbers = new Set();
  const scan = (value) => {
    const text = String(value || "");
    const regex = /LP[-_\s]?0*(\d{3,5})/gi;
    let match = regex.exec(text);
    while (match) {
      numbers.add(`LP-${match[1].padStart(5, "0")}`);
      match = regex.exec(text);
    }
  };
  for (const event of doc.events || []) {
    scan(event.event_id);
    scan(event.source_record_id);
    scan(event.source_url);
    scan(event.title);
  }
  return numbers;
}

function cityEnvelopeCheck(point) {
  return point &&
    point.lon >= -74.2591 &&
    point.lon <= -73.7004 &&
    point.lat >= 40.4774 &&
    point.lat <= 40.9176;
}

async function main() {
  const doc = readJson(corpusPath);
  const existingLpNumbers = collectExistingLpNumbers(doc);

  const response = await fetch(datasetUrl);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch ${datasetUrl}: ${response.status} ${response.statusText} ${body.slice(0, 500)}`);
  }
  const rows = await response.json();

  const rowsInWindow = rows
    .filter((row) => {
      const designatedAt = row.desdate ? new Date(row.desdate) : null;
      return designatedAt &&
        !Number.isNaN(designatedAt.getTime()) &&
        designatedAt >= startDate &&
        designatedAt <= endDate &&
        String(row.lpc_sitest || "").toLowerCase() === "designated" &&
        String(row.landmarkty || "").toLowerCase() === "individual landmark" &&
        normalizeLp(row.lpc_lpnumb);
    })
    .sort((a, b) => {
      const dateCompare = dateOnly(a.desdate).localeCompare(dateOnly(b.desdate));
      if (dateCompare !== 0) return dateCompare;
      return normalizeLp(a.lpc_lpnumb).localeCompare(normalizeLp(b.lpc_lpnumb));
    });

  const groupedByLp = new Map();
  for (const row of rowsInWindow) {
    const lpNumber = normalizeLp(row.lpc_lpnumb);
    if (!groupedByLp.has(lpNumber)) groupedByLp.set(lpNumber, []);
    groupedByLp.get(lpNumber).push(row);
  }

  const candidates = [];
  const skipped = [];
  for (const [lpNumber, groupRows] of groupedByLp) {
    if (existingLpNumbers.has(lpNumber)) {
      skipped.push({ lp_number: lpNumber, reason: "already present in corpus" });
      continue;
    }

    const point = centroidForGeometries(groupRows.map((row) => row.the_geom));
    if (!cityEnvelopeCheck(point)) {
      skipped.push({ lp_number: lpNumber, reason: "missing or out-of-envelope geometry" });
      continue;
    }

    const row = groupRows[0];
    const designationDate = dateOnly(row.desdate);
    const year = designationDate.slice(0, 4);
    const name = String(row.lpc_name || row.lpc_altern || "LPC individual landmark").trim();
    const addresses = [...new Set(groupRows
      .map((candidateRow) => String(candidateRow.address || candidateRow.lpc_sitede || "").trim())
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const address = addresses.length <= 3
      ? addresses.join("; ")
      : `${addresses.slice(0, 3).join("; ")}; and ${addresses.length - 3} other mapped address rows`;
    const borough = boroughName(row.borough);
    const sourceUrl = `https://data.cityofnewyork.us/resource/${datasetId}.json?lpc_lpnumb=${encodeURIComponent(lpNumber)}`;

    candidates.push({
      city_id: "nyc",
      event_id: `nyc_arch_lpc_individual_landmark_${slugify(name)}_${lpEventToken(lpNumber)}_${year}`,
      date: designationDate,
      date_precision: "day",
      category: "planning/development/architecture/historic_preservation",
      subcategory: "individual landmark designation",
      title: `${name} was designated an individual landmark`,
      summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber}) at ${address || "a mapped New York City site"}, ${borough}, as designated on ${designationDate}.`,
      observed_change: "The official LPC row documents an individual-landmark designation, a legal/protective status milestone for the named site.",
      location_name: address ? `${address}, ${borough}` : borough,
      lat: point.lat,
      lon: point.lon,
      source_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
      source_ids: ["nyc-lpc-individual-landmark-sites-buis-pvji"],
      source_name: "NYC Open Data: Individual Landmark Sites",
      publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
      source_url: sourceUrl,
      source_record_id: lpNumber,
      source_type: "official NYC Open Data Socrata API row",
      source_date_field: "desdate (designation date) from NYC Open Data Individual Landmark Sites.",
      source_dataset_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
      accessed_at: accessedAt,
      confidence: "documented",
      architect: "Source row does not name a project architect.",
      geometry_source: "Official NYC Open Data Individual Landmark Sites geometry for the LPC record.",
      geometry_precision: groupRows.every((candidateRow) => candidateRow.the_geom?.type === "Point")
        ? "official point geometry; not a surveyed entrance or work footprint"
        : "official polygon-derived navigation centroid; not a surveyed entrance, landmark boundary, or work footprint",
      license: "NYC Open Data / NYC.gov terms; dataset metadata license field is null.",
      license_url: "https://opendata.cityofnewyork.us/open-data-law/",
      attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
      limitations: "LPC designation rows document legal/protective status only. They do not document construction, restoration, permit activity, current occupancy, owner action, physical condition change, or preservation outcomes.",
      transformation_method: `Fetched ${datasetUrl}; filtered locally to designated Individual Landmark rows with desdate from 2008-01-01 through ${accessedAt}; collapsed ${groupRows.length} source row(s) for ${lpNumber} into one designation event; excluded LP numbers already present in the corpus; mapped official geometry to a navigation point; normalized by scripts/fetch_round115_nyc_lpc_individual_candidates.js.`
    });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({
    dataset_url: datasetUrl,
    accessed_at: accessedAt,
    source_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
    row_count: rows.length,
    rows_in_window: rowsInWindow.length,
    skipped_count: skipped.length,
    candidates
  }, null, 2)}\n`);
  fs.writeFileSync(notesPath, [
    "# Round115 NYC LPC Individual Landmark Candidates",
    "",
    `Fetched ${rows.length} rows from ${datasetUrl} on ${accessedAt}.`,
    `Rows in 2008-2026 window after status/type filtering: ${rowsInWindow.length}.`,
    `Distinct LP numbers in that window: ${groupedByLp.size}.`,
    `Skipped existing or unusable rows: ${skipped.length}.`,
    `Candidate rows written: ${candidates.length}.`,
    "",
    "The source documents legal/protective landmark designation status. It does not document construction, restoration, physical condition, occupancy, or preservation outcomes."
  ].join("\n"));

  console.log(JSON.stringify({
    rows: rows.length,
    rows_in_window: rowsInWindow.length,
    distinct_lp_numbers_in_window: groupedByLp.size,
    skipped: skipped.length,
    candidates: candidates.length,
    outputPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
