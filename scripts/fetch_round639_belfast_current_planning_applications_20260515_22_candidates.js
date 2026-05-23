#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round639_belfast_current_planning_applications_20260515_22";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const ACCESSED_AT = "2026-05-23";
const GENERATED_AT = "2026-05-23T00:00:00Z";
const SOURCE_ID = "belfast-city-council-current-planning-applications-2026-05-15-22";
const SOURCE_URL = "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications";
const TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=";

const SELECTED_ROWS = [
  {
    application_id: "LA04/2025/2140/F",
    advertised_on: "2026-05-22",
    address: "Harberton North Special School, 29a Fortwilliam Park, Belfast",
    proposal:
      "Partial demolition, refurbishment and extension of existing school buildings, with accessible parking, play areas, landscaping, drainage and boundary works.",
    bucket: "planning/development/education",
    project_type: "education estate advertised planning application",
    title: "Belfast advertised school redevelopment application for Harberton North Special School",
    latitude: 54.628819,
    longitude: -5.930868,
    geocode_query: "Fortwilliam Park Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Fortwilliam Park road point; not a surveyed school-site boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0750/F",
    advertised_on: "2026-05-22",
    address: "1-2 Kings Square, Belfast",
    proposal: "Change of use from bank to sale of food and drink for consumption off the premises with external alterations.",
    bucket: "planning/development/adaptive_reuse",
    project_type: "commercial change-of-use advertised planning application",
    title: "Belfast advertised bank-to-food-and-drink change-of-use application at Kings Square",
    latitude: 54.589088,
    longitude: -5.845286,
    geocode_query: "Kings Square Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Kings Square point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0844/F",
    advertised_on: "2026-05-22",
    address: "Windsor Lawn Tennis Club, 37 Windsor Avenue, Belfast",
    proposal:
      "Erection of a roof structure over an existing padel court with acoustic fencing and drainage, lighting, parking, landscaping and site works.",
    bucket: "planning/development/sports_facility",
    project_type: "sports-facility advertised planning application",
    title: "Belfast advertised padel-court roof application for Windsor Lawn Tennis Club",
    latitude: 54.579912,
    longitude: -5.944258,
    geocode_query: "Windsor Avenue Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Windsor Avenue road point; not a surveyed court footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0861/F",
    advertised_on: "2026-05-22",
    address: "St Kierans Primary School, 9 Bell Steel Road, Belfast",
    proposal:
      "Demolition of existing mobile classrooms to allow a new modular building, landscaping and associated works.",
    bucket: "planning/development/education",
    project_type: "education modular-building advertised planning application",
    title: "Belfast advertised modular-building application for St Kierans Primary School",
    latitude: 54.55742,
    longitude: -6.031625,
    geocode_query: "Bell Steel Road Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Bell Steel Road point; not a surveyed school-site boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0074/F",
    advertised_on: "2026-05-15",
    address: "Mercy College, Bilston Road, Belfast",
    proposal:
      "New stand-alone Special Educational Needs school building with parking, access, landscaping and associated works.",
    bucket: "planning/development/education",
    project_type: "education SEN-building advertised planning application",
    title: "Belfast advertised SEN school-building application for Mercy College",
    latitude: 54.623856,
    longitude: -5.973446,
    geocode_query: "Bilston Road Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Bilston Road point; not a surveyed school-site boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0782/F",
    advertised_on: "2026-05-15",
    address: "2-4 Bruce Street, Belfast",
    proposal:
      "Structural bracing works to an existing office building, with associated internal and external works.",
    bucket: "planning/development/structural_works",
    project_type: "structural works advertised planning application",
    title: "Belfast advertised structural-bracing application for 2-4 Bruce Street",
    latitude: 54.592815,
    longitude: -5.932791,
    geocode_query: "2-4 Bruce Street Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Bruce Street road point; not a surveyed building footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0809/F",
    advertised_on: "2026-05-15",
    address: "22-24 Berry Street, Belfast",
    proposal: "Alteration to shopfront and associated frontage works.",
    bucket: "planning/development/shopfront",
    project_type: "shopfront alteration advertised planning application",
    title: "Belfast advertised shopfront alteration application for 22-24 Berry Street",
    latitude: 54.600109,
    longitude: -5.931568,
    geocode_query: "22-24 Berry Street Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Berry Street point; not a surveyed shopfront, facade, or application boundary.",
  },
  {
    application_id: "LA04/2026/0810/DCA",
    advertised_on: "2026-05-15",
    address: "22-24 Berry Street, Belfast",
    proposal: "Demolition of existing shopfront to enable replacement frontage works.",
    bucket: "planning/development/conservation_area_demolition",
    project_type: "conservation-area demolition advertised application",
    title: "Belfast advertised conservation-area demolition application for 22-24 Berry Street shopfront",
    latitude: 54.600109,
    longitude: -5.931568,
    geocode_query: "22-24 Berry Street Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Berry Street point; not a surveyed shopfront, facade, or application boundary.",
  },
  {
    application_id: "LA04/2024/1411/F",
    advertised_on: "2026-05-15",
    address: "398-400 Shankill Road, Belfast",
    proposal:
      "Change of use from vacant unit to cafe with shop-front refurbishment, internal alterations, and apartments above.",
    bucket: "planning/development/mixed_use",
    project_type: "mixed-use re-advertised planning application",
    title: "Belfast re-advertised mixed-use application for 398-400 Shankill Road",
    latitude: 54.603988,
    longitude: -5.947505,
    geocode_query: "398-400 Shankill Road Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Shankill Road point; not a surveyed application boundary or building footprint.",
  },
  {
    application_id: "LA04/2026/0243/F",
    advertised_on: "2026-05-15",
    address: "32 Stormont Park, Belfast",
    proposal:
      "Demolition of rear return and erection of single-storey side and rear extension with internal alterations.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential alteration advertised planning application",
    title: "Belfast advertised residential alteration application for 32 Stormont Park",
    latitude: 54.595853,
    longitude: -5.844099,
    geocode_query: "32 Stormont Park Belfast",
    geometry_precision:
      "Approximate OSM/Nominatim Stormont Park road point; not a surveyed dwelling footprint or application boundary.",
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
  return `bfs_arch_round639_current_planning_${slug(row.application_id)}_${row.advertised_on.replace(/-/g, "_")}`;
}

function sourceRecordIdFor(row) {
  return `Belfast current planning applications: ${row.application_id}; advertised ${row.advertised_on}`;
}

function sourceUrlFor(row) {
  return `${SOURCE_URL}?application=${encodeURIComponent(row.application_id)}`;
}

function geocodeUrlFor(row) {
  return `${NOMINATIM_BASE}${encodeURIComponent(row.geocode_query)}`;
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
  const geometry = {
    type: "Point",
    coordinates: [row.longitude, row.latitude],
  };
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
    location_name: row.address,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    geometry,
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
    geometry_source: `OSM/Nominatim geocode checked ${ACCESSED_AT}: ${geocodeUrlFor(row)}`,
    geometry_precision: row.geometry_precision,
    license: "Belfast City Council website terms and copyright apply; OSM geocoding data is copyright OpenStreetMap contributors under ODbL.",
    license_or_terms_note:
      "Belfast City Council website terms apply to the page; OSM/Nominatim geocode metadata is used only for approximate navigation and carries OpenStreetMap attribution.",
    license_url: TERMS_URL,
    attribution: "Belfast City Council current planning applications; geocoding copyright OpenStreetMap contributors.",
    limitations:
      "This is an advertised application row, not planning permission, construction start, construction completion, opening, occupation, final built form, or outcome evidence. Geometry is approximate from OSM/Nominatim address or road results and is not a surveyed application boundary.",
    transformation_method:
      "scripts/fetch_round639_belfast_current_planning_applications_20260515_22_candidates.js selected additional high-signal Belfast City Council current-planning rows, checked application IDs on the live source page, attached OSM/Nominatim approximate point provenance, and screened current architecture corpus duplicates.",
    raw_row_subset: {
      application_id: row.application_id,
      advertised_on: row.advertised_on,
      location: row.address,
      proposal: row.proposal,
      source_page: SOURCE_URL,
      geocode_query: row.geocode_query,
      geocode_url: geocodeUrlFor(row),
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
    "geometry",
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
    if (!candidate[field] || (typeof candidate[field] === "string" && !compactText(candidate[field]))) {
      errors.push(`${candidate.event_id} missing ${field}`);
    }
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
        coverage_years_checked: "Current applications advertised on 2026-05-15 and 2026-05-22, accessed on 2026-05-23.",
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
    "# Round639 Belfast Current Planning Applications",
    "",
    "Selected additional high-signal rows from Belfast City Council's current planning applications page advertised on 2026-05-15 and 2026-05-22.",
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
      "Geometry is approximate OSM/Nominatim address or road support, not application-boundary evidence.",
      "The council current-applications page is mutable; application ids, advertised dates and proposal text are retained for traceability.",
    ],
  };
  const validation = {
    generated_at: GENERATED_AT,
    validator: "Round639 Belfast current planning applications validation",
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
    throw new Error(`Round639 validation failed:\n${errors.join("\n")}`);
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
