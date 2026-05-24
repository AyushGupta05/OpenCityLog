#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round671_belfast_current_planning_applications_20260515_22_next";
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
    application_id: "LA04/2026/0866/F",
    advertised_on: "2026-05-22",
    address: "37 Cardigan Drive, Belfast",
    proposal: "Single-storey rear extension with partial demolition of side and rear walls and removal of rear and side openings.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential alteration advertised planning application",
    title: "Belfast advertised residential alteration application for 37 Cardigan Drive",
    latitude: 54.620744,
    longitude: -5.950058,
    geocode_query: "37 Cardigan Drive, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Cardigan Drive road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0807/F",
    advertised_on: "2026-05-22",
    address: "115 Knockbreda Park, Belfast",
    proposal: "Side extension, rear dormer, garage roof and elevation changes, and material changes.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential alteration advertised planning application",
    title: "Belfast advertised dormer and material-change application for 115 Knockbreda Park",
    latitude: 54.568721,
    longitude: -5.909039,
    geocode_query: "115 Knockbreda Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Knockbreda Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0875/F",
    advertised_on: "2026-05-22",
    address: "6 Broomhill Park, Belfast",
    proposal: "Fenestration changes to garage and ancillary office, including removal of garage door and replacement window screen and brick wall.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential fenestration advertised planning application",
    title: "Belfast advertised garage fenestration application for 6 Broomhill Park",
    latitude: 54.568258,
    longitude: -5.943265,
    geocode_query: "6 Broomhill Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Broomhill Park road point; not a surveyed garage, office, or application boundary.",
  },
  {
    application_id: "LA04/2025/2232/F",
    advertised_on: "2026-05-22",
    address: "29 Ponsonby Avenue, Belfast",
    proposal: "Access ramp, replacement rear window, partial demolition of front boundary wall, and associated amended description works.",
    bucket: "planning/development/accessibility_alteration",
    project_type: "access and residential alteration re-advertised planning application",
    title: "Belfast re-advertised access and alteration application for 29 Ponsonby Avenue",
    latitude: 54.615379,
    longitude: -5.935987,
    geocode_query: "29 Ponsonby Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Ponsonby Avenue road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0380/F",
    advertised_on: "2026-05-22",
    address: "46 Willesden Park, Belfast",
    proposal: "Two-storey side extension, loft conversion with rear dormer window, and raised rear patio.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension re-advertised planning application",
    title: "Belfast re-advertised extension and dormer application for 46 Willesden Park",
    latitude: 54.570009,
    longitude: -5.933228,
    geocode_query: "46 Willesden Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Willesden Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0772/F",
    advertised_on: "2026-05-15",
    address: "42 Cheviot Avenue, Belfast",
    proposal: "Partial demolition of existing two-storey rear extension and provision of a new two-storey rear extension.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential demolition and extension advertised planning application",
    title: "Belfast advertised demolition and rear-extension application for 42 Cheviot Avenue",
    latitude: 54.5981,
    longitude: -5.884054,
    geocode_query: "42 Cheviot Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Cheviot Avenue road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0789/F",
    advertised_on: "2026-05-15",
    address: "8 Rosetta Avenue, Belfast",
    proposal: "Demolition of existing two-storey rear return and garage to enable garden, shed, garden room, terrace, access and remodelling works.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential demolition and garden-room advertised planning application",
    title: "Belfast advertised rear-return and garage demolition application for 8 Rosetta Avenue",
    latitude: 54.570958,
    longitude: -5.916216,
    geocode_query: "8 Rosetta Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Rosetta Avenue road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0804/F",
    advertised_on: "2026-05-15",
    address: "41 Richmond Park, Belfast",
    proposal: "Construction of a two-storey rear extension, demolition of existing garage, and associated site works.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension and garage-demolition advertised planning application",
    title: "Belfast advertised rear-extension and garage-demolition application for 41 Richmond Park",
    latitude: 54.570255,
    longitude: -5.935739,
    geocode_query: "41 Richmond Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Richmond Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0820/F",
    advertised_on: "2026-05-15",
    address: "29 Dalebrook Park, Belfast",
    proposal: "Two-storey side and rear extension.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension advertised planning application",
    title: "Belfast advertised two-storey extension application for 29 Dalebrook Park",
    latitude: 54.568166,
    longitude: -6.000855,
    geocode_query: "29 Dalebrook Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Dalebrook Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0666/F",
    advertised_on: "2026-05-15",
    address: "35 King's Road, Belfast",
    proposal: "Two-storey side extension, demolition of existing side extension, window and roof replacement, chimney reinstatement, raised patio, and solar panels.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential alteration re-advertised planning application",
    title: "Belfast re-advertised extension and roof-change application for 35 King's Road",
    latitude: 54.591974,
    longitude: -5.861541,
    geocode_query: "35 King's Road, Belfast",
    geometry_precision: "Approximate OSM/Nominatim King's Road point; not a surveyed dwelling footprint or application boundary.",
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
  return `bfs_arch_round671_current_planning_${slug(row.application_id)}_${row.advertised_on.replace(/-/g, "_")}`;
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
  const events = Array.isArray(corpus) ? corpus : Array.isArray(corpus.events) ? corpus.events : [];
  return {
    count: events.length,
    eventIds: new Set(events.map((event) => compactText(event.event_id || event.id))),
    sourceRecordIds: new Set(events.map((event) => compactText(event.source_record_id)).filter(Boolean)),
    titleDateKeys: new Set(events.map((event) => `${compactText(event.title).toLowerCase()}\u0000${compactText(event.date || event.effective_date)}`)),
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
      "scripts/fetch_round671_belfast_current_planning_applications_20260515_22_next_candidates.js selected additional high-signal Belfast City Council current-planning rows, checked application IDs on the live source page, attached OSM/Nominatim approximate point provenance, and screened current architecture corpus duplicates.",
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
  const overclaim = /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b|\bcaused?\b|\bpredicts?\b|\bprediction\b|\bforecast(ed|s|ing)?\b|\bsimulation result\b|\bimpact score\b|\bproof\s+(of|that)\b|\bas\s+proof\b|\bproves?\s+that\b|\bcompleted construction\b|\bopened\b/i;
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
    "# Round671 Belfast Current Planning Applications",
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
    advertised_on: row.advertised_on,
    reason: "source_record_id already present in architecture corpus",
  }));
  const dates = candidates.map((candidate) => candidate.date).sort();
  const summary = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    round_id: ROUND_ID,
    source_id: SOURCE_ID,
    source_url: SOURCE_URL,
    candidate_count: candidates.length,
    manual_corpus_rows_scanned: existing.count,
    date_range: {
      start: dates[0],
      end: dates.at(-1),
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
    validator: "Round671 Belfast current planning applications validation",
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
    throw new Error(`Round671 validation failed:\n${errors.join("\n")}`);
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
