const fs = require("fs");
const path = require("path");

const manualPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outDir = "tmp/subagents/round116_nyc_lpc_permits_official";
const outPath = path.join(outDir, "candidates.json");
const notesPath = path.join(outDir, "notes.md");
const retrievedAt = "2026-05-19";
const sourceId = "nyc-lpc-permit-application-information";
const endpoint = "https://data.cityofnewyork.us/resource/dpm2-m9mq.json";
const datasetPage = "https://data.cityofnewyork.us/d/dpm2-m9mq";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 80)
    .replace(/_+$/g, "");
}

function isoDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function cityPoint(row) {
  const lat = Number(row.latitude);
  const lon = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < 40.4774 || lat > 40.9176 || lon < -74.2591 || lon > -73.7004) return null;
  return { lat, lon };
}

function text(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function scoreWorktypes(worktypes, landmarkName) {
  const haystack = `${worktypes || ""} ${landmarkName || ""}`.toLowerCase();
  const weighted = [
    [/new building|new structure|new construction/, 9],
    [/rooftop|roof addition|addition|enlargement|rear yard additions?|vertical enlargement/, 8],
    [/demolition|partial demolition|excavation|foundation/, 8],
    [/reconstruction of facades?|facade reconstruction|primary facades?/, 7],
    [/restoration|replacement of deteriorated architectural features|historic material/, 7],
    [/storefront infill|full replacement|new storefront/, 6],
    [/barrier[- ]free access|accessibility|ramp|lift|elevator/, 5],
    [/window replacement|door replacement|openings?/, 4],
    [/hvac|mechanical equipment|solar|green roof/, 3],
    [/interior landmark|individual landmark/, 2]
  ];
  return weighted.reduce((sum, [regex, weight]) => sum + (regex.test(haystack) ? weight : 0), 0);
}

function candidateFrom(row) {
  const date = isoDate(row.issue_date);
  const year = date.slice(0, 4);
  const address = text(row.address);
  const borough = text(row.borough);
  const regulationNumber = text(row.regulation_number);
  const landmarkName = text(row.lmnametype);
  const worktypes = text(row.worktypes);
  const point = cityPoint(row);
  const eventId = `nyc_lpc_cofa_${slugify(address)}_${slugify(regulationNumber)}_${year}`;
  const site = [address, borough, "New York City"].filter(Boolean).join(", ");
  const sourceUrl = `${endpoint}?regulation_number=${encodeURIComponent(regulationNumber)}`;
  return {
    city_id: "nyc",
    event_id: eventId,
    title: `LPC issued a Certificate of Appropriateness for ${address}`,
    summary: `NYC Open Data records ${regulationNumber} as an LPC Certificate of Appropriateness issued on ${date} for ${site}${landmarkName ? ` within ${landmarkName}` : ""}. Listed work types: ${worktypes || "not supplied in the selected row"}.`,
    observed_change: "The Landmarks Preservation Commission issued a Certificate of Appropriateness for proposed work at this protected site; this is an administrative preservation action.",
    date,
    date_precision: "day",
    category: "planning/development/architecture/historic-preservation",
    subcategory: landmarkName.toLowerCase().includes("individual landmark")
      ? "certificate-of-appropriateness-individual-landmark"
      : "certificate-of-appropriateness-historic-district",
    location_name: site,
    lat: point.lat,
    lon: point.lon,
    source_id: sourceId,
    source_dataset_id: sourceId,
    source_name: "NYC Open Data: LPC Permit Application Information",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    source_url: sourceUrl,
    source_record_id: regulationNumber,
    source_type: "official NYC Open Data Socrata API row",
    source_date_field: "issue_date used as the observed administrative action date",
    license: "Dataset metadata license field is null; NYC Open Data / NYC.gov terms apply. Factual metadata and source URLs retained with LPC attribution.",
    license_url: "https://opendata.cityofnewyork.us/open-data-law/",
    accessed_at: retrievedAt,
    confidence: "documented",
    architect: text(row.applicant_name) || "Source row does not name a project architect.",
    project_type: "LPC Certificate of Appropriateness permit action",
    geometry_source: "Latitude/longitude fields supplied by NYC Open Data LPC Permit Application Information row, apparently geocoded from address/block/lot.",
    geometry_precision: "official geocoded point; not a surveyed building footprint, landmark boundary, or approved work area",
    attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
    limitations: "The row documents permit issuance/application processing only. It is not evidence of construction start, completion, compliance sign-off, final physical condition, approved-work boundary, or preservation outcome. Work type text is LPC permit metadata and may summarize rather than fully describe the approved scope.",
    transformation_method: `Round116 fetch from official NYC Open Data LPC Permit Application Information dataset dpm2-m9mq; filtered to COFA rows with issue_date in 2008-01-01 through ${retrievedAt}, non-null coordinates, architecture-facing work types, duplicate-screened against the manual architecture corpus by source_record_id, title/date, and source URL.`,
    evidence_fields: {
      docket: text(row.docket),
      regulation_type: text(row.regulation_type),
      landmark_name_type: landmarkName,
      worktypes,
      block: text(row.block),
      lot: text(row.lot),
      community_board: text(row.community_board || row.communityboard)
    },
    selection_score: scoreWorktypes(worktypes, landmarkName)
  };
}

function existingKeys(doc) {
  const recordIds = new Set();
  const titleDates = new Set();
  const urls = new Set();
  for (const event of doc.events || []) {
    if (event.source_dataset_id === sourceId || (event.source_ids || []).includes(sourceId)) {
      if (event.source_record_id) recordIds.add(String(event.source_record_id).toUpperCase());
      if (event.source_url) urls.add(String(event.source_url).toLowerCase());
    }
    titleDates.add(`${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`);
  }
  return { recordIds, titleDates, urls };
}

async function fetchRows() {
  const params = new URLSearchParams({
    "$select": [
      "docket",
      "address",
      "borough",
      "block",
      "lot",
      "lmnametype",
      "applicant_name",
      "communityboard",
      "community_board",
      "worktypes",
      "regulation_type",
      "issue_date",
      "latitude",
      "longitude",
      "regulation_number",
      "expiration_date"
    ].join(","),
    "$where": "issue_date between '2008-01-01T00:00:00' and '2026-05-19T23:59:59' AND regulation_number like 'COFA%' AND latitude IS NOT NULL AND longitude IS NOT NULL",
    "$order": "issue_date desc",
    "$limit": "50000"
  });
  const url = `${endpoint}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`LPC permit fetch failed: ${response.status} ${response.statusText}`);
  const rows = await response.json();
  return { rows, url };
}

function collapseByRegulationNumber(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = text(row.regulation_number).toUpperCase();
    if (!key) continue;
    if (!grouped.has(key)) {
      grouped.set(key, { ...row, __worktypes: new Set(), __landmarks: new Set() });
    }
    const current = grouped.get(key);
    if (new Date(row.issue_date) > new Date(current.issue_date)) current.issue_date = row.issue_date;
    if (text(row.worktypes)) current.__worktypes.add(text(row.worktypes));
    if (text(row.lmnametype)) current.__landmarks.add(text(row.lmnametype));
  }
  return [...grouped.values()].map((row) => ({
    ...row,
    worktypes: [...row.__worktypes].join(", "),
    lmnametype: [...row.__landmarks].join("; ")
  }));
}

function selectCandidates(rows, keys) {
  const rejects = [];
  const candidatesByYear = new Map();
  for (const row of collapseByRegulationNumber(rows)) {
    const point = cityPoint(row);
    const regulationNumber = text(row.regulation_number).toUpperCase();
    const date = isoDate(row.issue_date);
    if (!date) {
      rejects.push({ source_record_id: regulationNumber, reason: "missing issue_date" });
      continue;
    }
    if (!point) {
      rejects.push({ source_record_id: regulationNumber, reason: "missing or outside-NYC coordinates" });
      continue;
    }
    if (keys.recordIds.has(regulationNumber)) {
      rejects.push({ source_record_id: regulationNumber, reason: "existing LPC permit source_record_id in manual corpus" });
      continue;
    }
    const candidate = candidateFrom(row);
    const titleDateKey = `${candidate.city_id}|${candidate.title.toLowerCase()}|${candidate.date}`;
    if (keys.titleDates.has(titleDateKey)) {
      rejects.push({ source_record_id: regulationNumber, reason: "existing title/date key in manual corpus" });
      continue;
    }
    if (candidate.selection_score < 6) {
      rejects.push({ source_record_id: regulationNumber, reason: "low architecture-signal work type score" });
      continue;
    }
    const year = date.slice(0, 4);
    if (!candidatesByYear.has(year)) candidatesByYear.set(year, []);
    candidatesByYear.get(year).push(candidate);
  }

  const selected = [];
  for (const year of [...candidatesByYear.keys()].sort()) {
    const yearRows = candidatesByYear.get(year)
      .sort((a, b) => b.selection_score - a.selection_score || b.date.localeCompare(a.date) || a.source_record_id.localeCompare(b.source_record_id))
      .slice(0, 4);
    selected.push(...yearRows);
  }
  return {
    candidates: selected
      .sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id))
      .map(({ selection_score, ...candidate }) => candidate),
    rejects
  };
}

async function main() {
  const doc = readJson(manualPath);
  const keys = existingKeys(doc);
  const { rows, url } = await fetchRows();
  const { candidates, rejects } = selectCandidates(rows, keys);
  const payload = {
    source_audit: [
      {
        source_name: "NYC Open Data: LPC Permit Application Information",
        publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
        url: datasetPage,
        api_endpoint: endpoint,
        api_query: url,
        license: "Dataset metadata license field is null; NYC Open Data / NYC.gov terms apply.",
        license_url: "https://opendata.cityofnewyork.us/open-data-law/",
        coverage_years: "Rows with issue_date from 2008-01-01 through 2026-05-19 were queried; dataset metadata marks the source as official and daily updated.",
        geographic_scope: "New York City designated landmarks and historic districts, with row latitude/longitude when geocoded.",
        key_fields: "regulation_number, issue_date, address, borough, lmnametype, worktypes, regulation_type, latitude, longitude.",
        reliability: "usable_with_caveats",
        required_caveats: "LPC permit issuance is an administrative preservation action, not evidence of construction start, completion, compliance sign-off, final physical condition, or preservation outcome.",
        accessed_at: retrievedAt
      }
    ],
    candidates,
    rejects,
    metadata: {
      round: 116,
      fetched_rows: rows.length,
      selected_candidates: candidates.length,
      rejected_candidates: rejects.length,
      selection: "Grouped by regulation_number, required coordinates and high-signal architecture worktype keywords, then selected at most four non-duplicate COFA rows per issue year."
    }
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(notesPath, [
    "# Round116 NYC LPC Permit Candidates",
    "",
    `Fetched ${rows.length} COFA rows from dpm2-m9mq.`,
    `Selected ${candidates.length} non-duplicate high-signal candidates.`,
    `Rejected ${rejects.length} rows before append.`,
    "",
    "The candidate list intentionally treats LPC permits as administrative preservation records only."
  ].join("\n"));
  console.log(JSON.stringify(payload.metadata, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
