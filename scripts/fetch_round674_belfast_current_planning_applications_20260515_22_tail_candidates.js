#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round674_belfast_current_planning_applications_20260515_22_tail";
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
    application_id: "LA04/2026/0657/F",
    advertised_on: "2026-05-22",
    address: "21 Hamill Street, Belfast",
    proposal: "Change of use from a two-bedroom dwelling to short-term-let accommodation, with one bedroom retained as permanent residential.",
    bucket: "planning/development/change_of_use",
    project_type: "change-of-use advertised planning application",
    title: "Belfast advertised short-term-let change-of-use application for 21 Hamill Street",
    latitude: 54.598614,
    longitude: -5.936998,
    geocode_query: "21 Hamill Street, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Hamill Street result; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0752/F",
    advertised_on: "2026-05-22",
    address: "8-14 Union Street, Belfast",
    proposal: "Outdoor covered seating area, retrospective.",
    bucket: "planning/development/hospitality_alteration",
    project_type: "hospitality seating advertised planning application",
    title: "Belfast advertised covered-seating application for 8-14 Union Street",
    latitude: 54.603154,
    longitude: -5.932476,
    geocode_query: "8-14 Union Street, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Union Street road point; not a surveyed outdoor seating footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0724/F",
    advertised_on: "2026-05-22",
    address: "39 Knock Eden Park, Belfast",
    proposal: "Single-storey side and rear extension.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension advertised planning application",
    title: "Belfast advertised side-and-rear extension application for 39 Knock Eden Park",
    latitude: 54.573476,
    longitude: -5.908694,
    geocode_query: "39 Knock Eden Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Knock Eden Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0761/F",
    advertised_on: "2026-05-22",
    address: "72 Cliftondene Crescent, Belfast",
    proposal: "Single-storey rear extension with internal alterations and level access to the rear.",
    bucket: "planning/development/accessibility_alteration",
    project_type: "residential access and rear-extension advertised planning application",
    title: "Belfast advertised level-access rear-extension application for 72 Cliftondene Crescent",
    latitude: 54.62094,
    longitude: -5.957682,
    geocode_query: "72 Cliftondene Crescent, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Cliftondene Crescent road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0826/F",
    advertised_on: "2026-05-22",
    address: "495 Falls Road, Belfast",
    proposal: "Change of use from dwelling to a five-bedroom, seven-person house in multiple occupation.",
    bucket: "planning/development/hmo_change_of_use",
    project_type: "HMO change-of-use advertised planning application",
    title: "Belfast advertised HMO change-of-use application for 495 Falls Road",
    latitude: 54.59037,
    longitude: -5.967929,
    geocode_query: "495 Falls Road, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Falls Road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0843/F",
    advertised_on: "2026-05-22",
    address: "52 Greystown Avenue, Belfast",
    proposal: "Loft conversion with rear dormer.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential loft-conversion advertised planning application",
    title: "Belfast advertised loft-conversion application for 52 Greystown Avenue",
    latitude: 54.554658,
    longitude: -5.974222,
    geocode_query: "52 Greystown Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Greystown Avenue road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0815/F",
    advertised_on: "2026-05-22",
    address: "70 North Gardens, Belfast",
    proposal: "Retention of garden room and associated decking area with steps.",
    bucket: "planning/development/residential_alteration",
    project_type: "garden-room retention advertised planning application",
    title: "Belfast advertised garden-room retention application for 70 North Gardens",
    latitude: 54.591224,
    longitude: -5.878191,
    geocode_query: "70 North Gardens, Belfast",
    geometry_precision: "Approximate OSM/Nominatim North Gardens road point; not a surveyed garden room or application boundary.",
  },
  {
    application_id: "LA04/2026/0852/F",
    advertised_on: "2026-05-22",
    address: "52 Mount Eagles Glen, Belfast",
    proposal: "Loft conversion with rear dormer.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential loft-conversion advertised planning application",
    title: "Belfast advertised loft-conversion application for 52 Mount Eagles Glen",
    latitude: 54.557472,
    longitude: -6.052946,
    geocode_query: "52 Mount Eagles Glen, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Mount Eagles Glen road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0824/F",
    advertised_on: "2026-05-22",
    address: "53 Roddens Crescent, Belfast",
    proposal: "Single-storey rear extension and internal alterations.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential rear-extension advertised planning application",
    title: "Belfast advertised rear-extension application for 53 Roddens Crescent",
    latitude: 54.578979,
    longitude: -5.869596,
    geocode_query: "53 Roddens Crescent, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Roddens Crescent road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0841/F",
    advertised_on: "2026-05-22",
    address: "4 Westway Park, Belfast",
    proposal: "Two-storey side and rear extension, single-storey side extension, raised patio, and new access and driveway.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension and access advertised planning application",
    title: "Belfast advertised extension and driveway application for 4 Westway Park",
    latitude: 54.609895,
    longitude: -5.979996,
    geocode_query: "4 Westway Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Westway Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0872/DCA",
    advertised_on: "2026-05-22",
    address: "6 Broomhill Park, Belfast",
    proposal: "Demolition of garage door.",
    bucket: "planning/development/conservation_area_demolition",
    project_type: "conservation-area demolition advertised application",
    title: "Belfast advertised conservation-area demolition application for 6 Broomhill Park",
    latitude: 54.568258,
    longitude: -5.943265,
    geocode_query: "6 Broomhill Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Broomhill Park road point; not a surveyed garage footprint or application boundary.",
  },
  {
    application_id: "LA04/2024/1867/F",
    advertised_on: "2026-05-22",
    address: "Existing car park adjacent to 13 Talbot Street and rear of 55-67 Donegall Street, Belfast",
    proposal: "Change of use from private car park to public fee-paying car park and construction of ticket payment box, amended description.",
    bucket: "planning/development/car_park_change_of_use",
    project_type: "car park change-of-use re-advertised planning application",
    title: "Belfast re-advertised car-park change-of-use application near Talbot Street",
    latitude: 54.602778,
    longitude: -5.927405,
    geocode_query: "13 Talbot Street, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Talbot Street road point; not a surveyed car-park extent or application boundary.",
  },
  {
    application_id: "LA04/2025/1864/F",
    advertised_on: "2026-05-22",
    address: "549 Ormeau Road, Belfast",
    proposal: "De-conversion of three flats back to original dwelling, fenestration changes, chimney demolition and alterations, demolition of rear internal wall, fence removal, new garage door and associated site works.",
    bucket: "planning/development/heritage_residential_alteration",
    project_type: "residential de-conversion re-advertised planning application",
    title: "Belfast re-advertised de-conversion application for 549 Ormeau Road",
    latitude: 54.586747,
    longitude: -5.923549,
    geocode_query: "549 Ormeau Road, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Ormeau Road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0313/F",
    advertised_on: "2026-05-22",
    address: "73 Ravenhill Park, Belfast",
    proposal: "Partial demolition of existing rear elevation to facilitate single-storey side and rear extension, amended description.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential partial-demolition re-advertised planning application",
    title: "Belfast re-advertised partial-demolition extension application for 73 Ravenhill Park",
    latitude: 54.579031,
    longitude: -5.908048,
    geocode_query: "73 Ravenhill Park, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Ravenhill Park road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2025/0307/F",
    advertised_on: "2026-05-15",
    address: "6 Westland Gardens, Belfast",
    proposal: "Single-storey side and rear extension, roof dormer and roof lights to the rear.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension and dormer advertised planning application",
    title: "Belfast advertised extension and dormer application for 6 Westland Gardens",
    latitude: 54.623554,
    longitude: -5.94857,
    geocode_query: "6 Westland Gardens, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Westland Gardens road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0780/F",
    advertised_on: "2026-05-15",
    address: "39 Hamilton Street, Belfast",
    proposal: "Retrospective change of use from residential to short-term-let accommodation with internal alterations.",
    bucket: "planning/development/change_of_use",
    project_type: "short-term-let change-of-use advertised planning application",
    title: "Belfast advertised short-term-let change-of-use application for 39 Hamilton Street",
    latitude: 54.595249,
    longitude: -5.924757,
    geocode_query: "39 Hamilton Street, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Hamilton Street road point; not a surveyed building footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0708/LBC",
    advertised_on: "2026-05-15",
    address: "39 Hamilton Street, Belfast",
    proposal: "Retrospective change of use from residential to short-term-let accommodation and internal alterations.",
    bucket: "planning/development/listed_building_consent",
    project_type: "listed-building consent advertised application",
    title: "Belfast advertised listed-building consent application for 39 Hamilton Street",
    latitude: 54.595249,
    longitude: -5.924757,
    geocode_query: "39 Hamilton Street, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Hamilton Street road point; not a surveyed listed-building footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0792/F",
    advertised_on: "2026-05-15",
    address: "715-719 Lisburn Road, Belfast",
    proposal: "Change of use of Unit 1 from retail unit to pilates and fitness studio.",
    bucket: "planning/development/commercial_change_of_use",
    project_type: "commercial change-of-use advertised planning application",
    title: "Belfast advertised fitness-studio change-of-use application for 715-719 Lisburn Road",
    latitude: 54.58353,
    longitude: -5.944313,
    geocode_query: "715-719 Lisburn Road, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Lisburn Road point; not a surveyed unit footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0748/F",
    advertised_on: "2026-05-15",
    address: "44E Glen Road, Belfast",
    proposal: "Retrospective change of use from retail shop unit to cafe/sandwich bar, installation of extraction flue and storage shed.",
    bucket: "planning/development/commercial_change_of_use",
    project_type: "cafe change-of-use advertised planning application",
    title: "Belfast advertised cafe change-of-use application for 44E Glen Road",
    latitude: 54.577589,
    longitude: -5.86586,
    geocode_query: "44E Glen Road, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Glen Road point; not a surveyed unit footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0783/F",
    advertised_on: "2026-05-15",
    address: "19 Annadale Avenue, Belfast",
    proposal: "Single-storey rear extension.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential rear-extension advertised planning application",
    title: "Belfast advertised rear-extension application for 19 Annadale Avenue",
    latitude: 54.567823,
    longitude: -5.917086,
    geocode_query: "19 Annadale Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Annadale Avenue point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0784/F",
    advertised_on: "2026-05-15",
    address: "67 Martinez Avenue, Belfast",
    proposal: "Retrospective raised patio to the rear of the property.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential patio advertised planning application",
    title: "Belfast advertised raised-patio application for 67 Martinez Avenue",
    latitude: 54.59347,
    longitude: -5.881107,
    geocode_query: "67 Martinez Avenue, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Martinez Avenue road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0825/F",
    advertised_on: "2026-05-15",
    address: "80 Orchardville Crescent, Belfast",
    proposal: "Proposed single-storey extension to side and rear of dwelling.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension advertised planning application",
    title: "Belfast advertised side-and-rear extension application for 80 Orchardville Crescent",
    latitude: 54.566523,
    longitude: -5.984589,
    geocode_query: "80 Orchardville Crescent, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Orchardville Crescent road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0829/F",
    advertised_on: "2026-05-15",
    address: "33 Brooklands Grange, Belfast",
    proposal: "Proposed first-floor extension over garage to side of dwelling.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential first-floor extension advertised planning application",
    title: "Belfast advertised first-floor garage extension application for 33 Brooklands Grange",
    latitude: 54.56063,
    longitude: -6.018142,
    geocode_query: "33 Brooklands Grange, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Brooklands Grange road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2026/0823/F",
    advertised_on: "2026-05-15",
    address: "44 Marlborough Park North, Belfast",
    proposal: "Provision of new ironwork pedestrian gate, new brick wall, retention of existing garage, new vehicular ironwork gate, ironwork handrail, minor amendments to planting area and driveway finishes.",
    bucket: "planning/development/residential_boundary_works",
    project_type: "residential boundary-works advertised planning application",
    title: "Belfast advertised gates and wall application for 44 Marlborough Park North",
    latitude: 54.575155,
    longitude: -5.950633,
    geocode_query: "44 Marlborough Park North, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Marlborough Park North road point; not a surveyed dwelling footprint or application boundary.",
  },
  {
    application_id: "LA04/2025/2194/F",
    advertised_on: "2026-05-15",
    address: "28 Rosepark East, Belfast",
    proposal: "Two-storey side and rear extension and raised rear terrace with pergola, alterations to boundary with widened access and new hard standing, and extension to existing rear garden store.",
    bucket: "planning/development/residential_alteration",
    project_type: "residential extension re-advertised planning application",
    title: "Belfast re-advertised extension and terrace application for 28 Rosepark East",
    latitude: 54.593915,
    longitude: -5.829873,
    geocode_query: "28 Rosepark East, Belfast",
    geometry_precision: "Approximate OSM/Nominatim Rosepark East road point; not a surveyed dwelling footprint or application boundary.",
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
  return `bfs_arch_round674_current_planning_${slug(row.application_id)}_${row.advertised_on.replace(/-/g, "_")}`;
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

function applicationIdPattern() {
  return /LA04\/\d{4}\/\d{4}\/[A-Z]+/g;
}

function loadExistingKeys() {
  const corpus = readJson(path.join(ROOT, "data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json"));
  const events = Array.isArray(corpus) ? corpus : Array.isArray(corpus.events) ? corpus.events : [];
  const applicationIds = new Set();
  for (const event of events) {
    if (compactText(event.city_id || event.city) !== "belfast") continue;
    for (const match of JSON.stringify(event).matchAll(applicationIdPattern())) {
      applicationIds.add(match[0]);
    }
  }
  return {
    count: events.length,
    eventIds: new Set(events.map((event) => compactText(event.event_id || event.id))),
    sourceRecordIds: new Set(events.map((event) => compactText(event.source_record_id)).filter(Boolean)),
    titleDateKeys: new Set(events.map((event) => `${compactText(event.title).toLowerCase()}\u0000${compactText(event.date || event.effective_date)}`)),
    applicationIds,
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
  const geometry = { type: "Point", coordinates: [row.longitude, row.latitude] };
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
      "scripts/fetch_round674_belfast_current_planning_applications_20260515_22_tail_candidates.js selected additional unrepresented Belfast City Council current-planning rows, checked application IDs on the live source page, attached OSM/Nominatim approximate point provenance, and screened current architecture corpus duplicates by event ID, source record, title/date, and application reference.",
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
  const applicationId = candidate.raw_row_subset.application_id;
  if (!sourceHtml.includes(applicationId)) errors.push(`${candidate.event_id} application id not found on source page`);
  if (existing.eventIds.has(candidate.event_id)) errors.push(`${candidate.event_id} duplicates an existing event_id`);
  if (existing.sourceRecordIds.has(candidate.source_record_id)) errors.push(`${candidate.event_id} duplicates an existing source_record_id`);
  if (existing.applicationIds.has(applicationId)) errors.push(`${candidate.event_id} duplicates an existing Belfast application reference ${applicationId}`);
  const titleDateKey = `${compactText(candidate.title).toLowerCase()}\u0000${candidate.date}`;
  if (existing.titleDateKeys.has(titleDateKey)) errors.push(`${candidate.event_id} duplicates an existing title/date key`);
  if (seen.eventIds.has(candidate.event_id)) errors.push(`${candidate.event_id} duplicates event_id inside pack`);
  if (seen.sourceRecordIds.has(candidate.source_record_id)) errors.push(`${candidate.event_id} duplicates source_record_id inside pack`);
  if (seen.applicationIds.has(applicationId)) errors.push(`${candidate.event_id} duplicates application reference inside pack`);
  if (!Number.isFinite(candidate.longitude) || !Number.isFinite(candidate.latitude)) errors.push(`${candidate.event_id} has invalid coordinates`);
  if (!(candidate.longitude >= -6.1 && candidate.longitude <= -5.75 && candidate.latitude >= 54.45 && candidate.latitude <= 54.75)) {
    errors.push(`${candidate.event_id} is outside the Belfast coordinate sanity bounds`);
  }
  const overclaim = /\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b|\bcaused?\b|\bpredicts?\b|\bprediction\b|\bforecast(ed|s|ing)?\b|\bsimulation result\b|\bimpact score\b|\bproof\s+(of|that)\b|\bas\s+proof\b|\bproves?\s+that\b|\bcompleted construction\b|\bopened\b/i;
  for (const field of ["title", "summary", "observed_change", "limitations"]) {
    if (overclaim.test(candidate[field])) errors.push(`${candidate.event_id} ${field} overclaims`);
  }
  seen.eventIds.add(candidate.event_id);
  seen.sourceRecordIds.add(candidate.source_record_id);
  seen.applicationIds.add(applicationId);
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
    "# Round674 Belfast Current Planning Applications Tail",
    "",
    "Selected additional unrepresented rows from Belfast City Council's current planning applications page advertised on 2026-05-15 and 2026-05-22.",
    "",
    "The accepted records are administrative advertised-application milestones only. They do not assert approval, construction, completion, opening, occupation, final built form, or outcomes.",
    "",
    `Accepted candidates: ${summary.candidate_count}`,
    `Manual corpus rows scanned: ${summary.manual_corpus_rows_scanned}`,
    `Existing Belfast application references scanned: ${summary.existing_belfast_application_ids_scanned}`,
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
  const seen = { eventIds: new Set(), sourceRecordIds: new Set(), applicationIds: new Set() };
  const candidates = [];
  const rejected = [];
  const errors = [];

  for (const row of SELECTED_ROWS) {
    const candidate = candidateForRow(row);
    const candidateErrors = validateCandidate(candidate, sourceHtml, existing, seen);
    if (candidateErrors.length) {
      rejected.push({ application_id: row.application_id, reason: "validation_failed", errors: candidateErrors });
      errors.push(...candidateErrors);
      continue;
    }
    candidates.push(candidate);
  }

  const byDate = {};
  const byBucket = {};
  for (const candidate of candidates) {
    byDate[candidate.date] = (byDate[candidate.date] || 0) + 1;
    byBucket[candidate.bucket] = (byBucket[candidate.bucket] || 0) + 1;
  }
  const summary = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    task: "Round674 Belfast current planning applications tail candidate pack",
    source_id: SOURCE_ID,
    candidate_count: candidates.length,
    rejected_count: rejected.length,
    selected_count: SELECTED_ROWS.length,
    manual_corpus_rows_scanned: existing.count,
    existing_belfast_application_ids_scanned: existing.applicationIds.size,
    by_date: byDate,
    by_bucket: byBucket,
    source_url: SOURCE_URL,
    license_url: TERMS_URL,
    osm_copyright_url: OSM_COPYRIGHT_URL,
    validation_passed: errors.length === 0,
  };
  const pack = {
    generated_at: GENERATED_AT,
    worker: ROUND_ID,
    accessed_at: ACCESSED_AT,
    candidate_count: candidates.length,
    source_id: SOURCE_ID,
    candidates,
  };
  const validation = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    validator: `${ROUND_ID} validation`,
    candidate_count: candidates.length,
    checks: [
      "source page fetched",
      "application ids present on source page",
      "required provenance fields",
      "unique event ids",
      "unique source record ids",
      "unique Belfast application references",
      "no overlap with existing manual Belfast application references",
      "Belfast coordinate sanity bounds",
      "administrative-only wording",
    ],
    errors,
    passed: errors.length === 0,
  };
  const readback = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    candidate_count: candidates.length,
    event_ids: candidates.map((candidate) => candidate.event_id).sort(),
    source_record_ids: candidates.map((candidate) => candidate.source_record_id).sort(),
    application_ids: candidates.map((candidate) => candidate.raw_row_subset.application_id).sort(),
    passed: errors.length === 0 && candidates.length === SELECTED_ROWS.length,
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), pack);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit(candidates));
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  writeJson(path.join(OUT_DIR, "rejected.json"), {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_count: rejected.length,
    rejected,
  });
  writeText(path.join(OUT_DIR, "notes.md"), notes(summary));

  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR),
    candidate_count: candidates.length,
    rejected_count: rejected.length,
    by_date: byDate,
    validation_passed: validation.passed,
  }, null, 2));

  if (!validation.passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
