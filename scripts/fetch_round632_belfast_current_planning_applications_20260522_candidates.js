#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round632_belfast_current_planning_applications_20260522";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const ACCESSED_AT = "2026-05-23";
const GENERATED_AT = "2026-05-23T00:00:00Z";
const SOURCE_ID = "belfast-city-council-current-planning-applications-2026-05-22";
const SOURCE_URL = "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications";
const TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=";

const SELECTED_ROWS = [
  {
    application_id: "LA04/2026/0701/F",
    advertised_on: "2026-05-22",
    address: "Land adjacent to and south of the junction of London Road and Lismore Street, Belfast",
    proposal:
      "Construction of a residential development comprising 69 residential units, with communal areas, resident support services, landscaping, parking and site works.",
    bucket: "planning/development/residential",
    project_type: "residential development advertised planning application",
    title: "Belfast advertised residential application near London Road and Lismore Street",
    latitude: 54.589451,
    longitude: -5.907245,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("London Road and Lismore Street, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim road-intersection point derived from London Road and Lismore Street road results; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0787/LBC",
    advertised_on: "2026-05-22",
    address: "Bandstand, Ormeau Park, Ormeau Road, Belfast",
    proposal: "Remedial works and alterations to the bandstand.",
    bucket: "planning/development/heritage_works",
    project_type: "listed-building consent advertised application",
    title: "Belfast advertised listed-building consent application for Ormeau Park bandstand works",
    latitude: 54.585457,
    longitude: -5.91566,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("Ormeau Park, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Ormeau Park point; not the surveyed bandstand footprint or consent boundary.",
  },
  {
    application_id: "LA04/2026/0855/DCA",
    advertised_on: "2026-05-22",
    address: "20 Rosemary Street, Belfast",
    proposal:
      "Minor internal and external demolition works to facilitate a hotel conversion, refurbishment and extension.",
    bucket: "planning/development/hotel",
    project_type: "conservation-area demolition advertised application",
    title: "Belfast advertised conservation-area demolition application for 20 Rosemary Street hotel conversion works",
    latitude: 54.600217,
    longitude: -5.929412,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("20 Rosemary Street, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Rosemary Street road point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0384/F",
    advertised_on: "2026-05-22",
    address: "419-421 Newtownards Road, Belfast",
    proposal:
      "Change of use from fitness facility to art education and studio space including ground-floor cafe, shop and external alterations.",
    bucket: "planning/development/adaptive_reuse",
    project_type: "change-of-use advertised planning application",
    title: "Belfast advertised adaptive-reuse application for 419-421 Newtownards Road",
    latitude: 54.599181,
    longitude: -5.900747,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("419 Newtownards Road, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Newtownards Road point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2023/4069/F",
    advertised_on: "2026-05-22",
    address: "380 Oldpark Road, Belfast",
    proposal:
      "Re-advertised construction of 10 apartments and two dwellings with communal garden, bin store, cycle parking and associated works.",
    bucket: "planning/development/residential",
    project_type: "residential development re-advertised planning application",
    title: "Belfast re-advertised residential application for 380 Oldpark Road",
    latitude: 54.615512,
    longitude: -5.950713,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("380 Oldpark Road, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Oldpark Road point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2025/1865/LBC",
    advertised_on: "2026-05-22",
    address: "549 Ormeau Road, Belfast",
    proposal:
      "Internal alterations and fenestration changes to rear return to support de-conversion of offices into single dwelling with ancillary accommodation.",
    bucket: "planning/development/heritage_works",
    project_type: "listed-building consent advertised application",
    title: "Belfast advertised listed-building consent application for 549 Ormeau Road de-conversion works",
    latitude: 54.577646,
    longitude: -5.918588,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("549 Ormeau Road, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Ormeau Road point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2024/2032/O",
    advertised_on: "2026-05-22",
    address: "Windsor Tennis Club, 37 Windsor Avenue, Belfast",
    proposal:
      "Erection of a structure over existing padel tennis courts with elevated walkway and access stair, changing facilities and associated works.",
    bucket: "planning/development/sports_facility",
    project_type: "sports-facility outline application re-advertised",
    title: "Belfast re-advertised sports-facility application for Windsor Tennis Club padel-court structure",
    latitude: 54.579912,
    longitude: -5.944258,
    geocode_url: `${NOMINATIM_BASE}${encodeURIComponent("37 Windsor Avenue, Belfast")}`,
    geometry_precision:
      "Approximate OSM/Nominatim Windsor Avenue road point; not a surveyed court, building footprint or application boundary.",
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(filePath, body) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, body, "utf8");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slug(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 160);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function eventIdFor(row) {
  return `bfs_arch_round632_current_planning_${slug(row.application_id)}_${row.advertised_on.replace(/-/g, "_")}`;
}

function sourceRecordIdFor(row) {
  return `Belfast current planning applications: ${row.application_id}; advertised ${row.advertised_on}`;
}

function sourceUrlFor(row) {
  return `${SOURCE_URL}?application=${encodeURIComponent(row.application_id)}`;
}

function loadExistingKeys() {
  const corpus = readJson(path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json"));
  const events = Array.isArray(corpus.events) ? corpus.events : [];
  return {
    count: events.length,
    eventIds: new Set(events.map((event) => compactText(event.event_id))),
    sourceRecordIds: new Set(events.map((event) => compactText(event.source_record_id)).filter(Boolean)),
    titleDateKeys: new Set(events.map((event) => `${compactText(event.title).toLowerCase()}\u0000${compactText(event.date)}`)),
  };
}

async function fetchSourcePage() {
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Bims-5 architecture source audit" },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch Belfast current planning applications page: ${response.status}`);
  }
  return response.text();
}

function candidateForRow(row) {
  return {
    city_id: "belfast",
    event_id: eventIdFor(row),
    candidate_id: eventIdFor(row).replace(/^bfs_arch_/, ""),
    date: row.advertised_on,
    effective_date: row.advertised_on,
    date_precision: "day",
    bucket: row.bucket,
    category: "planning_application_advertised",
    title: row.title,
    summary: `Belfast City Council's current planning applications page advertised ${row.application_id} for ${row.address}. Source proposal summary: ${row.proposal}`,
    observed_change:
      "Belfast City Council recorded an advertised planning-application milestone. This is an administrative application/advertisement record only.",
    area: row.address,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    source_ids: [SOURCE_ID],
    source_id: SOURCE_ID,
    source_name: "Belfast City Council: Current planning applications",
    publisher: "Belfast City Council",
    source_url: sourceUrlFor(row),
    source_page_url: SOURCE_URL,
    source_record_id: sourceRecordIdFor(row),
    source_type: "official council current-planning application web page",
    source_date_field: "advertised_on",
    source_retrieved_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: row.project_type,
    geometry_source: `OSM/Nominatim geocode checked ${ACCESSED_AT}: ${row.geocode_url}`,
    geometry_precision: row.geometry_precision,
    license: "Belfast City Council website terms and copyright apply; OSM geocoding data is copyright OpenStreetMap contributors under ODbL.",
    license_or_terms_note:
      "Belfast City Council website terms apply to the page; OSM/Nominatim geocode metadata is used only for approximate navigation and carries OpenStreetMap attribution.",
    license_url: TERMS_URL,
    attribution: "Belfast City Council current planning applications; geocoding copyright OpenStreetMap contributors.",
    limitations:
      "This is an advertised application row, not planning permission, construction start, construction completion, opening, occupation, final built form, or outcome evidence. Geometry is approximate from OSM/Nominatim address or road results and is not a surveyed application boundary.",
    transformation_method:
      "scripts/fetch_round632_belfast_current_planning_applications_20260522_candidates.js selected high-signal Belfast City Council current-planning rows, checked application IDs on the live source page, attached OSM/Nominatim approximate point provenance, and screened current architecture corpus duplicates.",
    raw_row_subset: {
      application_id: row.application_id,
      advertised_on: row.advertised_on,
      location: row.address,
      proposal: row.proposal,
      source_page: SOURCE_URL,
      geocode_url: row.geocode_url,
      osm_copyright_url: OSM_COPYRIGHT_URL,
    },
  };
}

function validateCandidate(candidate, sourceHtml, existing, seen) {
  const errors = [];
  const required = [
    "city_id",
    "event_id",
    "candidate_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "source_url",
    "source_record_id",
    "source_type",
    "source_date_field",
    "accessed_at",
    "retrieved_at",
    "geometry_source",
    "geometry_precision",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "transformation_method",
  ];
  for (const field of required) {
    if (!compactText(candidate[field])) errors.push(`${candidate.event_id} missing ${field}`);
  }
  if (!sourceHtml.includes(candidate.raw_row_subset.application_id)) {
    errors.push(`${candidate.event_id} application id not found on source page`);
  }
  if (existing.eventIds.has(candidate.event_id)) errors.push(`${candidate.event_id} duplicates an existing event_id`);
  if (existing.sourceRecordIds.has(candidate.source_record_id)) {
    errors.push(`${candidate.event_id} duplicates an existing source_record_id`);
  }
  const titleDateKey = `${compactText(candidate.title).toLowerCase()}\u0000${candidate.date}`;
  if (existing.titleDateKeys.has(titleDateKey)) errors.push(`${candidate.event_id} duplicates an existing title/date key`);
  if (seen.eventIds.has(candidate.event_id)) errors.push(`${candidate.event_id} duplicates event_id inside pack`);
  if (seen.sourceRecordIds.has(candidate.source_record_id)) {
    errors.push(`${candidate.event_id} duplicates source_record_id inside pack`);
  }
  if (!Number.isFinite(candidate.longitude) || !Number.isFinite(candidate.latitude)) {
    errors.push(`${candidate.event_id} has invalid coordinates`);
  }
  if (!(candidate.longitude >= -6.1 && candidate.longitude <= -5.75 && candidate.latitude >= 54.45 && candidate.latitude <= 54.75)) {
    errors.push(`${candidate.event_id} is outside the Belfast coordinate sanity bounds`);
  }
  const overclaim = /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b|\bcaused?\b|\bpredicts?\b|\bprediction\b|\bforecast(ed|s|ing)?\b|\bsimulation result\b|\bimpact score\b|\bproof\s+(of|that)\b|\bas\s+proof\b|\bproves?\s+that\b/i;
  for (const field of ["title", "summary", "observed_change", "limitations"]) {
    if (overclaim.test(candidate[field])) errors.push(`${candidate.event_id} ${field} overclaims`);
  }
  seen.eventIds.add(candidate.event_id);
  seen.sourceRecordIds.add(candidate.source_record_id);
  return errors;
}

function sourceAudit(candidates) {
  return {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    sources: [
      {
        source_id: SOURCE_ID,
        source_name: "Belfast City Council: Current planning applications",
        publisher: "Belfast City Council",
        source_url: SOURCE_URL,
        source_type: "official council current-planning application web page",
        license: "Belfast City Council website terms and copyright apply; OSM geocoding data is copyright OpenStreetMap contributors under ODbL.",
        license_url: TERMS_URL,
        attribution: "Belfast City Council current planning applications; geocoding copyright OpenStreetMap contributors.",
        coverage_years_checked: "Current applications advertised on 2026-05-22 and accessed on 2026-05-23.",
        geographic_scope: "Belfast City Council planning authority area.",
        granularity: "Application-level advertisement row with application reference and text location.",
        key_fields_used: ["application reference", "location", "proposal", "advertised date"],
        reliability: "usable with caveats for administrative advertised-application milestones",
        required_caveats:
          "Do not treat advertised applications as approval, construction, completion, opening, occupation, or final built-form evidence. OSM/Nominatim geometry is approximate navigation support only.",
        row_count: candidates.length,
        geometry_source: "OSM/Nominatim approximate address or road geocodes; not Belfast City Council application boundaries.",
        geometry_license_url: OSM_COPYRIGHT_URL,
      },
    ],
  };
}

function notes(summary) {
  return [
    "# Round632 Belfast Current Planning Applications",
    "",
    "Selected high-signal rows from Belfast City Council's current planning applications page advertised on 2026-05-22.",
    "",
    "The accepted records are administrative advertised-application milestones only. They do not assert approval, construction, completion, opening, occupation, final built form, or outcomes.",
    "",
    `Accepted candidates: ${summary.candidate_count}`,
    `Manual corpus rows scanned: ${summary.manual_corpus_rows_scanned}`,
    "",
    "Outputs:",
    "- candidates.json",
    "- source_audit.json",
    "- summary.json",
    "- validation.json",
    "- readback.json",
    "- rejected.json",
    "- notes.md",
    "",
  ].join("\n");
}

async function main() {
  ensureDir(OUT_DIR);
  const sourceHtml = await fetchSourcePage();
  const existing = loadExistingKeys();
  const candidates = SELECTED_ROWS.map(candidateForRow);
  const seen = { eventIds: new Set(), sourceRecordIds: new Set() };
  const errors = candidates.flatMap((candidate) => validateCandidate(candidate, sourceHtml, existing, seen));
  const rejected = SELECTED_ROWS.filter((row) => existing.sourceRecordIds.has(sourceRecordIdFor(row))).map((row) => ({
    application_id: row.application_id,
    reason: "source_record_id already present in architecture corpus",
  }));
  const summary = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    round_id: ROUND_ID,
    source_id: SOURCE_ID,
    source_url: SOURCE_URL,
    candidate_count: candidates.length,
    manual_corpus_rows_scanned: existing.count,
    date_range: {
      start: candidates.map((candidate) => candidate.date).sort()[0],
      end: candidates.map((candidate) => candidate.date).sort().at(-1),
    },
    by_bucket: candidates.reduce((acc, candidate) => {
      acc[candidate.bucket] = (acc[candidate.bucket] || 0) + 1;
      return acc;
    }, {}),
    caveats: [
      "Rows are current planning application advertisements only; approval and construction are not claimed.",
      "Geometry is approximate OSM/Nominatim address or road/park support, not application-boundary evidence.",
      "The council current-applications page is mutable; application ids, advertised dates and proposal text are retained for traceability.",
    ],
  };
  const validation = {
    generated_at: GENERATED_AT,
    validator: "Round632 Belfast current planning applications validation",
    checked_files: [],
    checks: [
      "source page fetched and selected application IDs found",
      "required candidate provenance fields",
      "manual corpus duplicate source_record_id/event_id/title-date scan",
      "Belfast coordinate sanity bounds",
      "administrative-only wording",
    ],
    errors,
    passed: errors.length === 0,
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), {
    schema_version: "1.0.0",
    worker: ROUND_ID,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    source_url: SOURCE_URL,
    candidate_count: candidates.length,
    candidates,
  });
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit(candidates));
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "readback.json"), {
    generated_at: GENERATED_AT,
    candidate_count: candidates.length,
    candidate_ids: candidates.map((candidate) => candidate.candidate_id).sort(),
    source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    passed: validation.passed && new Set(candidates.map((candidate) => candidate.event_id)).size === candidates.length,
  });
  writeJson(path.join(OUT_DIR, "rejected.json"), {
    generated_at: GENERATED_AT,
    rejected_count: rejected.length,
    rejected,
  });
  writeText(path.join(OUT_DIR, "notes.md"), notes(summary));

  if (!validation.passed) {
    throw new Error(`Round632 validation failed:\n${errors.join("\n")}`);
  }
  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR),
    candidate_count: candidates.length,
    date_range: summary.date_range,
    by_bucket: summary.by_bucket,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
