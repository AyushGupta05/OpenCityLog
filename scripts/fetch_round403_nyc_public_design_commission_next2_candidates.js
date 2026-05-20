#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round403_nyc_public_design_commission_next2");
const ACCESS_DATE = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const SOURCE_ID = "nyc-pdc-meeting-minutes-certificates-2008-2026";
const PUBLISHER = "New York City Public Design Commission";
const CURRENT_MEETINGS_PAGE = "https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page";
const PAST_MINUTES_PAGE = "https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page";
const NYC_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";
const GEOCODER_URL = "https://geosearch.planninglabs.nyc/v2/search";
const GEOCODER_ATTRIBUTION = "https://geosearch.planninglabs.nyc/attribution";

const INPUTS = {
  certificateRecords: path.join(
    ROOT,
    "tmp",
    "subagents",
    "round124_nyc_public_design_commission",
    "pdc_certificate_records.json"
  ),
  priorCandidateFiles: [
    path.join(ROOT, "tmp", "subagents", "round124_nyc_public_design_commission", "candidates.json"),
    path.join(ROOT, "tmp", "subagents", "round126_nyc_pdc_more_design_review", "candidates.json"),
    path.join(ROOT, "tmp", "subagents", "round295_nyc_public_design_commission_next", "candidates.json"),
  ],
  manualCorpus: path.join(
    ROOT,
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  ),
};

// Curated next2 set after round124/round126/round295: recent, high-signal
// PDC administrative design-review milestones for civic buildings, parks,
// public realm, waterfronts, and related public infrastructure.
const SEED_CERTIFICATES = [
  "30270",
  "30271",
  "30272",
  "30273",
  "30275",
  "30276",
  "30278",
  "30280",
  "30281",
  "30288",
  "30289",
  "30296",
  "30302",
  "30303",
  "30304",
  "30305",
  "30306",
  "30307",
  "30309",
  "30310",
  "30316",
  "30328",
  "30330",
  "30331",
  "30334",
  "30338",
  "30339",
  "30348",
  "30349",
  "30350",
  "30355",
  "30362",
  "30364",
  "30365",
  "30373",
  "30377",
];

const GEOCODE_QUERIES = {
  "30270": "Clason Point Park Bronx",
  "30271": "Arthur Ashe Stadium Billie Jean King National Tennis Center Flushing Meadows Corona Park Queens",
  "30272": "Clove Lakes Park Park Drive Clove Road Staten Island",
  "30273": "Colden Playground Union Street 31st Drive 31st Road Flushing Queens",
  "30275": "Powell's Cove Park Powell's Cove Boulevard 129th Street 130th Street 9th Avenue Whitestone Queens",
  "30276": "Youth Village Playground Bronx",
  "30278": "Crotona Park Southern Boulevard Crotona Park East East 175th Street Bronx",
  "30280": "Bethesda Fountain Central Park Manhattan",
  "30281": "Willets Point Roosevelt Avenue 38th Avenue Willets Point Boulevard Corona Queens",
  "30288": "Ewen Park Bronx",
  "30289": "Corporal Allan F Kivlehan Park Staten Island",
  "30296": "Red Hook Branch Library 7 Wolcott Street Brooklyn",
  "30302": "DeWitt Clinton Park Manhattan",
  "30303": "Telephone Playground 75th Avenue Bell Boulevard 217th Street Oakland Gardens Queens",
  "30304": "Buz O'Rourke Playground Crocheron Park Bayside Queens",
  "30305": "Challenge Playground 251st Street 61st Avenue 63rd Avenue Little Neck Queens",
  "30306": "Jackie Robinson Park Playground Chauncey Street Marion Street Malcolm X Boulevard Brooklyn",
  "30307": "Rocket Playground North Conduit Avenue Arion Road Ozone Park Queens",
  "30309": "87-03 235 Court Queens Village",
  "30310": "Michel Triangle Bronx",
  "30316": "River Run Playground Riverside Park West 81st Street West 83rd Street Manhattan",
  "30328": "Union Square Pavilion 20 Union Square West Manhattan",
  "30330": "Harvard Playground 179th Place Jamaica Avenue 90th Avenue Hollis Queens",
  "30331": "John F. Murray Playground 45th Road and 21st Street Hunters Point Queens",
  "30334": "Washington Park East 183rd Street Washington Avenue Park Avenue Bronx",
  "30338": "American Playground Franklin Street Milton Street Noble Street Brooklyn",
  "30339": "Harlem Meer shoreline Central Park North Fifth Avenue Manhattan",
  "30348": "South Brooklyn Marine Terminal 2nd Avenue 32nd Street 34th Street Brooklyn",
  "30349": "Del Valle Square Hunts Point Avenue East 163rd Street Bruckner Boulevard Bronx",
  "30350": "East 34th Street and FDR Drive Manhattan",
  "30355": "Great Hill Central Park West 103rd Street 107th Street Manhattan",
  "30362": "Ocean Breeze Athletic Complex Staten Island",
  "30364": "Phil Rizzuto Park Queens",
  "30365": "Laurelton Playground Queens",
  "30373": "730 3rd Avenue Brooklyn",
  "30377": "John Allen Payne Park Brooklyn",
};

const MANUAL_GEOMETRY = {
  "30309": {
    coordinates: [-73.73265, 40.730823],
    label: "Approximate Detective T. William Gunn Playground / P.S. 18 area near 87th Avenue and 235th Court, Queens",
    source:
      "Curated approximate point from PDC location text and NYC Planning Labs Geosearch address match; not official PDC geometry.",
    precision: "approximate playground/school-adjacent point",
    geocoder_attribution: GEOCODER_ATTRIBUTION,
  },
  "30316": {
    coordinates: [-73.9819, 40.785],
    label: "Approximate River Run Playground area, Riverside Park between West 81st Street and West 83rd Street, Manhattan",
    source: "Curated approximate point from PDC park-location text; not official PDC geometry.",
    precision: "approximate park project point",
    geocoder_attribution: null,
  },
  "30331": {
    coordinates: [-73.9476, 40.7475],
    label: "Approximate John F. Murray Playground area near 45th Road, 45th Avenue, 11th Street, and 21st Street, Hunters Point, Queens",
    source: "Curated approximate point from PDC street-bounds text; not official PDC geometry.",
    precision: "approximate playground point",
    geocoder_attribution: null,
  },
  "30339": {
    coordinates: [-73.9542, 40.7977],
    label: "Approximate Harlem Meer south shoreline area, Central Park North between East Drive and Fifth Avenue, Manhattan",
    source: "Curated approximate point from PDC shoreline text; not official PDC geometry.",
    precision: "approximate park shoreline point",
    geocoder_attribution: null,
  },
  "30350": {
    coordinates: [-73.9724, 40.7437],
    label: "Approximate East 34th Street / FDR Drive waterfront open-space area, Manhattan",
    source: "Curated approximate point from PDC waterfront text; not official PDC geometry.",
    precision: "approximate waterfront open-space point",
    geocoder_attribution: null,
  },
  "30355": {
    coordinates: [-73.9598, 40.7972],
    label: "Approximate Great Hill area, Central Park West between West 103rd Street and West 107th Street, Manhattan",
    source: "Curated approximate point from PDC Central Park text; not official PDC geometry.",
    precision: "approximate park path point",
    geocoder_attribution: null,
  },
};

const BOROUGH_BBOX = {
  Bronx: { minLon: -73.933, maxLon: -73.765, minLat: 40.785, maxLat: 40.915 },
  Brooklyn: { minLon: -74.05, maxLon: -73.83, minLat: 40.56, maxLat: 40.74 },
  Manhattan: { minLon: -74.03, maxLon: -73.9, minLat: 40.68, maxLat: 40.89 },
  Queens: { minLon: -73.96, maxLon: -73.7, minLat: 40.53, maxLat: 40.82 },
  "Staten Island": { minLon: -74.26, maxLon: -74.05, minLat: 40.47, maxLat: 40.66 },
};

const PROJECT_TYPE_RULES = [
  [/library/i, "library"],
  [/museum|cultural/i, "cultural_facility"],
  [/community center|recreation center/i, "community_or_recreation_center"],
  [/health center|medical examiner|forensic/i, "health_or_public_health_facility"],
  [/courthouse|detention|juvenile/i, "justice_or_civic_facility"],
  [/pump|wastewater|sewer|stormwater|bluebelt|bulkhead|shoreline|flood|resilien/i, "water_or_resilience_infrastructure"],
  [/greenway|esplanade|waterfront|pier|open space/i, "waterfront_public_realm"],
  [/bridge|staircase|retaining wall/i, "bridge_wall_or_pedestrian_connection"],
  [/park|playground|field|court|pavilion|fountain/i, "park_or_playground"],
  [/street|streetscape|plaza|sidewalk|entrance/i, "streetscape_or_plaza"],
  [/garage|yard|facility|building|renovation|rehabilitation|roof|facade|addition/i, "public_facility_architecture"],
];

const EXCLUDED_SUBJECT_PATTERN =
  /\b(artwork|artist|monument|sculpture|mural|signage|signs?|plaque|banner|wayfinding|security cameras?|camera|bollards?|guardrail|generator|antenna|telecommunications|distinctive lighting|prototype|prototypical|newsstand|bus shelter)\b/i;

const INCLUDED_SUBJECT_PATTERN =
  /\b(construction|reconstruction|rehabilitation|restoration|renovation|addition|facade|roof|library|community center|health center|courthouse|detention|park|playground|plaza|greenway|esplanade|waterfront|shoreline|bridge|building|facility|public realm|streetscape|street|pump station|wastewater|sewer|bluebelt|garage|recreation center|public restroom|comfort station|field house|pier|bulkhead|resiliency|flood|museum|fountain|pavilion)\b/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, maxLength = 74) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength)
    .replace(/_+$/g, "");
}

function hashText(value, length = 8) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function arrayFromCandidateFile(filePath) {
  const parsed = readJson(filePath);
  if (Array.isArray(parsed)) return parsed;
  return parsed.candidates || parsed.events || parsed.items || [];
}

function extractCertificateIds(value) {
  const text = JSON.stringify(value || {});
  const out = new Set();
  for (const match of text.matchAll(/\b(?:certificate[- #:]*)?(\d{5})\b/gi)) {
    out.add(match[1]);
  }
  return out;
}

function existingKeysFromRows(rows) {
  const keys = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set(),
    certificates: new Set(),
    normalizedTitles: new Set(),
    sourceUrls: new Set(),
  };

  for (const row of rows) {
    const eventId = row.event_id || row.candidate_id || row.id;
    if (eventId) keys.eventIds.add(String(eventId));
    if (row.source_record_id) keys.sourceRecordIds.add(String(row.source_record_id).toLowerCase());
    if (row.source_url) keys.sourceUrls.add(String(row.source_url));
    const date = row.effective_date || row.date || "";
    const title = row.title || "";
    if (title && date) keys.titleDates.add(`${slugify(title, 140)}|${date}`);
    if (title) keys.normalizedTitles.add(slugify(title, 160));
    for (const cert of extractCertificateIds(row)) keys.certificates.add(cert);
  }

  return keys;
}

function existingKeysFromManual(corpusPath) {
  const parsed = readJson(corpusPath);
  const rows = Array.isArray(parsed) ? parsed : parsed.events || parsed.items || [];
  const pdcRows = rows.filter((row) => {
    const text = JSON.stringify(row).toLowerCase();
    return text.includes("public design commission") || text.includes("nyc_pdc");
  });
  return { keys: existingKeysFromRows(pdcRows), corpusCount: rows.length, pdcCorpusCount: pdcRows.length };
}

function existingKeysFromPrior(files) {
  const mergedRows = [];
  const counts = {};
  for (const file of files) {
    const rows = arrayFromCandidateFile(file);
    counts[path.relative(ROOT, file)] = rows.length;
    mergedRows.push(...rows);
  }
  return { keys: existingKeysFromRows(mergedRows), counts };
}

function mergeKeySets(...sets) {
  const merged = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set(),
    certificates: new Set(),
    normalizedTitles: new Set(),
    sourceUrls: new Set(),
  };
  for (const set of sets) {
    for (const key of Object.keys(merged)) {
      for (const value of set[key] || []) merged[key].add(value);
    }
  }
  return merged;
}

function cleanSubject(record) {
  const direct = normalizeText(record.subject);
  if (direct) return direct;
  const resolution = normalizeText(record.resolution);
  const match = resolution.match(
    /considered (?:designs?|a proposal|a final report) for (.*?), submitted by/i
  );
  return normalizeText(match ? match[1] : resolution);
}

function stripSubjectPrefix(subject) {
  return normalizeText(subject)
    .replace(/^the\s+/i, "")
    .replace(/^minor modifications to the\s+/i, "minor modifications to ")
    .replace(/^modifications to the\s+/i, "modifications to ");
}

function extractBorough(text) {
  const ordered = ["Staten Island", "Manhattan", "Brooklyn", "Queens", "Bronx"];
  return ordered.find((borough) => new RegExp(`\\b${borough}\\b`, "i").test(text)) || null;
}

function boroughMatchesPoint(borough, coordinates) {
  if (!borough || !BOROUGH_BBOX[borough]) return true;
  const [lon, lat] = coordinates;
  const box = BOROUGH_BBOX[borough];
  return lon >= box.minLon && lon <= box.maxLon && lat >= box.minLat && lat <= box.maxLat;
}

function projectType(subject) {
  for (const [pattern, type] of PROJECT_TYPE_RULES) {
    if (pattern.test(subject)) return type;
  }
  return "architecture_or_public_realm_design_review";
}

function eventIdFor(record, subject) {
  const datePart = String(record.effective_date).replace(/-/g, "");
  return `nyc_pdc_round403_${datePart}_${record.certificate}_${slugify(stripSubjectPrefix(subject), 72)}`;
}

function makeTitle(record, subject) {
  return `PDC ${record.approval_type} for ${stripSubjectPrefix(subject)}`;
}

function sourceRecordId(record) {
  return `certificate-${record.certificate}`;
}

function isDuplicate(record, eventId, title, existingKeys) {
  const date = record.effective_date || "";
  const cert = String(record.certificate || "");
  const srid = sourceRecordId(record).toLowerCase();
  const titleDate = `${slugify(title, 140)}|${date}`;
  const normalizedTitle = slugify(title, 160);
  const reasons = [];

  if (existingKeys.certificates.has(cert)) reasons.push("certificate already present in manual corpus or prior PDC output");
  if (existingKeys.sourceRecordIds.has(srid)) reasons.push("source_record_id already present");
  if (existingKeys.eventIds.has(eventId)) reasons.push("event_id already present");
  if (existingKeys.titleDates.has(titleDate)) reasons.push("same normalized title/date already present");
  if (existingKeys.normalizedTitles.has(normalizedTitle)) reasons.push("same normalized title already present");

  return reasons;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Bims-5 round403 source auditor (citation metadata only)",
      accept: "text/html,application/pdf;q=0.9,*/*;q=0.8",
    },
  });
  const text = await response.text();
  return {
    url,
    ok: response.ok,
    status: response.status,
    content_type: response.headers.get("content-type") || null,
    byte_length: Buffer.byteLength(text),
    text,
  };
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, {
      method: "HEAD",
      headers: { "user-agent": "Bims-5 round403 source auditor (citation metadata only)" },
    });
    if (!response.ok || response.status === 405) {
      response = await fetch(url, {
        headers: {
          "user-agent": "Bims-5 round403 source auditor (citation metadata only)",
          range: "bytes=0-2047",
        },
      });
    }
    return {
      url,
      ok: response.ok,
      status: response.status,
      content_type: response.headers.get("content-type") || null,
      checked_at: ACCESS_DATE,
    };
  } catch (error) {
    return { url, ok: false, error: error.message, checked_at: ACCESS_DATE };
  }
}

async function geocodeCertificate(cert, borough) {
  if (MANUAL_GEOMETRY[cert]) {
    const manual = MANUAL_GEOMETRY[cert];
    return {
      ok: true,
      coordinates: manual.coordinates,
      label: manual.label,
      source: manual.source,
      precision: manual.precision,
      method: "curated_approximate_point",
      query: GEOCODE_QUERIES[cert] || manual.label,
      geocoder_attribution: manual.geocoder_attribution,
      geocoder_feature: null,
    };
  }

  const query = GEOCODE_QUERIES[cert];
  if (!query) return { ok: false, reason: "no geocode query configured" };

  const url = `${GEOCODER_URL}?text=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Bims-5 round403 geocoding (approximate event map placement)",
        accept: "application/json",
      },
    });
    if (!response.ok) return { ok: false, reason: `geocoder returned HTTP ${response.status}`, query };
    const parsed = await response.json();
    const features = Array.isArray(parsed.features) ? parsed.features : [];
    const match =
      features.find((feature) => {
        const props = feature.properties || {};
        const coords = feature.geometry && feature.geometry.coordinates;
        return (
          coords &&
          boroughMatchesPoint(borough, coords) &&
          (!borough || !props.borough || String(props.borough).toLowerCase() === borough.toLowerCase())
        );
      }) ||
      features.find((feature) => feature.geometry && boroughMatchesPoint(borough, feature.geometry.coordinates));

    if (!match || !match.geometry || !match.geometry.coordinates) {
      return { ok: false, reason: "no borough-compatible geocode match", query };
    }

    const [lon, lat] = match.geometry.coordinates.map((n) => Number(n));
    return {
      ok: true,
      coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))],
      label: (match.properties && match.properties.label) || query,
      source: "NYC Planning Labs Geosearch / NYC PAD geocode from PDC location text; not official PDC geometry.",
      precision: "approximate address/site/intersection point",
      method: "nyc_planning_labs_geosearch",
      query,
      geocoder_attribution: GEOCODER_ATTRIBUTION,
      geocoder_feature: {
        gid: match.properties && match.properties.gid,
        layer: match.properties && match.properties.layer,
        source: match.properties && match.properties.source,
        confidence: match.properties && match.properties.confidence,
        accuracy: match.properties && match.properties.accuracy,
        borough: match.properties && match.properties.borough,
        label: match.properties && match.properties.label,
      },
    };
  } catch (error) {
    return { ok: false, reason: error.message, query };
  }
}

function makeCandidate(record, subject, geocode, sourceStatus) {
  const title = makeTitle(record, subject);
  const eventId = eventIdFor(record, subject);
  const borough = extractBorough(`${subject} ${record.resolution || ""}`);
  const sourcePath = path.join("tmp", "subagents", "round124_nyc_public_design_commission", record.txt_file || "");
  const indexUrl = Number(record.year) >= 2025 ? CURRENT_MEETINGS_PAGE : PAST_MINUTES_PAGE;
  const indexLabel = Number(record.year) >= 2025 ? "PDC current meetings page" : "PDC past meeting minutes archive";
  const sourceAccess = {
    checked_at: ACCESS_DATE,
    pdf_ok: sourceStatus ? Boolean(sourceStatus.ok) : null,
    pdf_status: sourceStatus ? sourceStatus.status || null : null,
    pdf_content_type: sourceStatus ? sourceStatus.content_type || null : null,
  };

  return {
    schema_version: "bims-event-candidate/v0.1",
    city_id: "nyc",
    candidate_id: eventId,
    event_id: eventId,
    title,
    summary: `Official NYC Public Design Commission certificate ${record.certificate} records ${record.approval_type} for ${subject}.`,
    short_description: `Official NYC Public Design Commission certificate ${record.certificate} records ${record.approval_type} for ${subject}.`,
    observed_change: `NYC Public Design Commission recorded ${record.approval_type} for ${subject}.`,
    year: Number(record.year || String(record.effective_date).slice(0, 4)),
    effective_date: record.effective_date,
    effective_date_range: null,
    date_precision: "day",
    source_date_field: "PDC certificate adoption date",
    category: "design_review_approval",
    lens: "public_design_commission",
    milestone_type: record.approval_type,
    project_type: projectType(subject),
    approval_body: Number(record.year) < 2009 ? "Art Commission of the City of New York" : PUBLISHER,
    certificate: String(record.certificate),
    certificate_number: String(record.certificate),
    source_record_id: sourceRecordId(record),
    meeting_item_id: sourceRecordId(record),
    meeting_material_id: record.txt_file || null,
    source_page: record.page || null,
    geometry: {
      type: "Point",
      coordinates: geocode.coordinates,
    },
    longitude: geocode.coordinates[0],
    latitude: geocode.coordinates[1],
    affected_area: {
      label: subject,
      borough,
    },
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: "NYC Public Design Commission meeting minutes and certificates",
    publisher: PUBLISHER,
    source_url: record.source_url,
    source_type: "official_design_review_certificate_pdf",
    license:
      "Official NYC.gov public record; explicit reuse license not stated in the PDF. Treat as citation evidence subject to NYC.gov terms.",
    license_url: NYC_TERMS_URL,
    terms_note: "NYC.gov terms of use apply; source used as citation evidence, not as an open-data license grant.",
    attribution: "Source: New York City Public Design Commission.",
    attribution_text: "Source: New York City Public Design Commission.",
    accessed_at: ACCESS_DATE,
    source_access: sourceAccess,
    confidence: "documented",
    geometry_source: geocode.source,
    geometry_precision: geocode.precision,
    limitations: [
      "This is an administrative PDC design-review approval/certificate record, not evidence of construction start, completion, opening, occupancy, operation, or urban outcome.",
      "PDC certificates provide location text rather than authoritative GIS geometry; coordinates are approximate map-placement points.",
      "Approval conditions and later revisions may alter project scope after this certificate date.",
    ],
    evidence: [
      {
        source_id: SOURCE_ID,
        label: `Certificate ${record.certificate}, adopted ${record.effective_date}`,
        kind: "source_record",
        url: record.source_url,
        record_id: sourceRecordId(record),
        page: record.page || null,
      },
      {
        source_id: Number(record.year) >= 2025 ? "nyc-pdc-current-meetings-page" : "nyc-pdc-past-minutes-page",
        label: indexLabel,
        kind: "source_index",
        url: indexUrl,
      },
    ],
    transformation_method:
      "scripts/fetch_round403_nyc_public_design_commission_next2_candidates.js filtered parsed official PDC certificate records, screened prior PDC packs/manual corpus for duplicates, checked official NYC.gov URLs, and added caveated approximate point geometry.",
    provenance: {
      source_id: SOURCE_ID,
      source_name: "NYC Public Design Commission meeting minutes and certificates",
      publisher: PUBLISHER,
      source_type: "official_design_review_certificate_pdf",
      source_url: record.source_url,
      source_record_id: sourceRecordId(record),
      certificate_number: String(record.certificate),
      meeting_item_id: sourceRecordId(record),
      meeting_material_id: record.txt_file || null,
      source_page: record.page || null,
      source_path: sourcePath.replace(/\\/g, "/"),
      source_artifact_note:
        "Source row read from round124 parsed PDC certificate artifact; official NYC.gov PDF URL was rechecked for this round.",
      source_date_field: "PDC certificate adoption date",
      source_pdf_status: sourceStatus || null,
      accessed_at: ACCESS_DATE,
      license: "NYC.gov public record; explicit reuse license not stated in PDF.",
      license_url: NYC_TERMS_URL,
      attribution_text: "Source: New York City Public Design Commission.",
      transformation_script: "scripts/fetch_round403_nyc_public_design_commission_next2_candidates.js",
      geometry_query: geocode.query,
      geometry_geocode_label: geocode.label,
      geometry_source: geocode.source,
      geometry_precision: geocode.precision,
      geometry_method: geocode.method,
      geocoder_attribution: geocode.geocoder_attribution,
      geocoder_feature: geocode.geocoder_feature,
      manual_geometry_caveat: geocode.method === "curated_approximate_point",
      confidence: "documented",
      limitation_summary:
        "Design-review approval/certificate record only; no construction completion or project outcome is claimed.",
      source_fingerprint: hashText(`${record.certificate}|${record.effective_date}|${subject}|${record.source_url}`),
    },
  };
}

function validateCandidates(candidates) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const sourceRecordIds = new Set();
  const certs = new Set();

  candidates.forEach((candidate, index) => {
    const prefix = `candidate[${index}] ${candidate.event_id || "(no event_id)"}`;
    for (const field of [
      "event_id",
      "city_id",
      "title",
      "effective_date",
      "source_record_id",
      "source_date_field",
      "source_url",
      "publisher",
      "license",
      "attribution_text",
      "accessed_at",
      "confidence",
      "transformation_method",
    ]) {
      if (!candidate[field]) errors.push(`${prefix}: missing ${field}`);
    }
    if (candidate.city_id !== "nyc") errors.push(`${prefix}: city_id is not nyc`);
    if (candidate.effective_date < DATE_MIN || candidate.effective_date > DATE_MAX) {
      errors.push(`${prefix}: effective_date outside scope`);
    }
    if (candidate.accessed_at !== ACCESS_DATE) errors.push(`${prefix}: accessed_at must be ${ACCESS_DATE}`);
    if (!String(candidate.source_url || "").startsWith("https://www.nyc.gov/")) {
      errors.push(`${prefix}: source_url is not an official nyc.gov URL`);
    }
    if (!candidate.geometry || candidate.geometry.type !== "Point") errors.push(`${prefix}: missing point geometry`);
    const coords = candidate.geometry && candidate.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
      errors.push(`${prefix}: invalid coordinates`);
    } else {
      const [lon, lat] = coords;
      if (!(lon >= -74.3 && lon <= -73.65 && lat >= 40.45 && lat <= 40.95)) {
        errors.push(`${prefix}: coordinates outside broad NYC bounds`);
      }
      const borough = candidate.affected_area && candidate.affected_area.borough;
      if (!boroughMatchesPoint(borough, coords)) errors.push(`${prefix}: coordinates outside expected borough`);
    }
    if (!Array.isArray(candidate.evidence) || candidate.evidence.length < 1) {
      errors.push(`${prefix}: missing evidence array`);
    }
    if (!Array.isArray(candidate.limitations) || !candidate.limitations.join(" ").includes("not evidence of construction")) {
      errors.push(`${prefix}: missing explicit design-review limitation`);
    }
    if (/completed|opened|will increase|will decrease|caused|forecast|predict|simulation/i.test(candidate.observed_change || "")) {
      errors.push(`${prefix}: observed_change appears to overclaim`);
    }
    if (ids.has(candidate.event_id)) errors.push(`${prefix}: duplicate event_id`);
    ids.add(candidate.event_id);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${prefix}: duplicate source_record_id`);
    sourceRecordIds.add(candidate.source_record_id);
    if (certs.has(candidate.certificate_number)) errors.push(`${prefix}: duplicate certificate_number`);
    certs.add(candidate.certificate_number);
    if (candidate.source_access && candidate.source_access.pdf_ok === false) {
      warnings.push(`${prefix}: source PDF check did not return ok`);
    }
  });

  return {
    ok: errors.length === 0,
    error_count: errors.length,
    warning_count: warnings.length,
    errors,
    warnings,
  };
}

function dateRange(candidates) {
  if (!candidates.length) return { start: null, end: null };
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

function mixBy(candidates, key) {
  const out = {};
  for (const candidate of candidates) out[candidate[key]] = (out[candidate[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

function auditRecordPool(records, existingKeys) {
  const counts = {
    total_certificate_records: records.length,
    in_date_scope: 0,
    outside_date_scope: 0,
    duplicate_certificate_or_source_record: 0,
    not_architecture_or_public_realm: 0,
    art_equipment_or_signage_only: 0,
    missing_nyc_location_text: 0,
    available_after_basic_filters: 0,
    not_seeded_for_round403: 0,
  };
  const sampleRejected = [];
  const seedSet = new Set(SEED_CERTIFICATES);

  for (const record of records) {
    const subject = cleanSubject(record);
    const text = `${subject} ${record.resolution || ""}`;
    const cert = String(record.certificate || "");
    const reasons = [];
    if (!record.effective_date || record.effective_date < DATE_MIN || record.effective_date > DATE_MAX) {
      counts.outside_date_scope += 1;
      reasons.push("outside date scope");
    } else {
      counts.in_date_scope += 1;
    }
    if (existingKeys.certificates.has(cert) || existingKeys.sourceRecordIds.has(sourceRecordId(record).toLowerCase())) {
      counts.duplicate_certificate_or_source_record += 1;
      reasons.push("duplicate certificate/source_record_id");
    }
    if (!INCLUDED_SUBJECT_PATTERN.test(text)) {
      counts.not_architecture_or_public_realm += 1;
      reasons.push("not architecture/public realm review language");
    }
    if (EXCLUDED_SUBJECT_PATTERN.test(text)) {
      counts.art_equipment_or_signage_only += 1;
      reasons.push("art/equipment/signage-only pattern");
    }
    if (!extractBorough(text)) {
      counts.missing_nyc_location_text += 1;
      reasons.push("missing explicit NYC borough text");
    }
    if (reasons.length === 0) {
      counts.available_after_basic_filters += 1;
      if (!seedSet.has(cert)) {
        counts.not_seeded_for_round403 += 1;
        reasons.push("available but not selected for clean round403 pack");
      }
    }
    if (reasons.length && sampleRejected.length < 90) {
      sampleRejected.push({
        certificate_number: cert,
        effective_date: record.effective_date || null,
        subject: subject.slice(0, 240),
        reasons,
      });
    }
  }

  return { counts, sampleRejected };
}

function writeNotes({ candidates, rejected, summary, validation }) {
  const range = dateRange(candidates);
  const lines = [
    "# Round403 NYC Public Design Commission next2 candidates",
    "",
    `Created/accessed: ${ACCESS_DATE}`,
    "",
    "## Scope",
    "",
    "Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, or causal/outcome claims.",
    "",
    "## Outputs",
    "",
    `- candidates.json: ${candidates.length} candidate events.`,
    "- source_audit.json: source, terms, coverage, geometry, and caveat audit.",
    "- summary.json: count, date range, source URLs, milestone mix, and screening counts.",
    "- rejected.json: seeded-record rejections plus pool screening counts and sampled rejects.",
    "- validation.json and validation_report.md: machine-readable and human-readable validation results.",
    "",
    "## Result",
    "",
    `- Date range: ${range.start || "n/a"} through ${range.end || "n/a"}.`,
    `- Candidate count: ${candidates.length}.`,
    `- Milestone mix: ${Object.entries(mixBy(candidates, "milestone_type"))
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ") || "none"}.`,
    `- Validation: ${validation.ok ? "passed" : "failed"} with ${validation.error_count} errors and ${validation.warning_count} warnings.`,
    `- Seeded rejections: ${rejected.selected_rejections.length}.`,
    "",
    "## Method",
    "",
    "1. Read the parsed PDC certificate rows from the prior official-PDF extraction artifact.",
    "2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual architecture corpus and prior PDC packs through Round295.",
    "3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.",
    "4. Selected a fresh next2 set of recent civic buildings, park/playground, public realm, waterfront/resilience, and public facility design-review actions.",
    "5. Added approximate point geometry from NYC Planning Labs Geosearch where it matched the borough; used curated approximate points for known ambiguous park/corridor sites.",
    "",
    "## Caveats",
    "",
    "- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.",
    "- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.",
    "- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.",
    "- The current meetings page was checked because the access date is 2026-05-20; selected candidates come from certificate PDFs available in the parsed official source artifact and rechecked by URL.",
    "",
    "## Source URLs",
    "",
    `- Current meetings page: ${CURRENT_MEETINGS_PAGE}`,
    `- Past minutes archive: ${PAST_MINUTES_PAGE}`,
    `- NYC.gov terms: ${NYC_TERMS_URL}`,
  ];

  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${lines.join("\n")}\n`);
}

function writeValidationReport(validation, summary) {
  const lines = [
    "# Round403 validation report",
    "",
    `Created: ${ACCESS_DATE}`,
    "",
    `Status: ${validation.ok ? "PASS" : "FAIL"}`,
    "",
    `Candidate count: ${summary.candidate_count}`,
    `Date range: ${summary.date_range.start || "n/a"} through ${summary.date_range.end || "n/a"}`,
    `Validation errors: ${validation.error_count}`,
    `Validation warnings: ${validation.warning_count}`,
    "",
    "## Checks",
    "",
    "- Required provenance/source fields present.",
    "- Dates are within 2008-01-01 through 2026-05-20.",
    "- `accessed_at` is 2026-05-20.",
    "- Coordinates are points within a broad NYC bounding box and expected borough.",
    "- Candidate IDs, source record IDs, and certificate numbers are unique.",
    "- Source URLs are official nyc.gov links.",
    "- `observed_change` text avoids completion, opening, prediction, and causality claims.",
    "",
    "## Errors",
    "",
    ...(validation.errors.length ? validation.errors.map((item) => `- ${item}`) : ["- None."]),
    "",
    "## Warnings",
    "",
    ...(validation.warnings.length ? validation.warnings.map((item) => `- ${item}`) : ["- None."]),
  ];
  fs.writeFileSync(path.join(OUT_DIR, "validation_report.md"), `${lines.join("\n")}\n`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const records = readJson(INPUTS.certificateRecords);
  const { keys: manualKeys, corpusCount, pdcCorpusCount } = existingKeysFromManual(INPUTS.manualCorpus);
  const { keys: priorKeys, counts: priorCandidateCounts } = existingKeysFromPrior(INPUTS.priorCandidateFiles);
  const existingKeys = mergeKeySets(manualKeys, priorKeys);
  const recordByCert = new Map(records.map((record) => [String(record.certificate), record]));
  const recordPoolAudit = auditRecordPool(records, existingKeys);

  const sourcePages = {};
  for (const [name, url] of [
    ["current_meetings_page", CURRENT_MEETINGS_PAGE],
    ["past_minutes_page", PAST_MINUTES_PAGE],
    ["nyc_terms", NYC_TERMS_URL],
  ]) {
    try {
      const result = await fetchText(url);
      sourcePages[name] = {
        url,
        ok: result.ok,
        status: result.status,
        content_type: result.content_type,
        byte_length: result.byte_length,
        checked_at: ACCESS_DATE,
      };
      if (name === "current_meetings_page") {
        sourcePages[name].mentions_may_18_2026 = /May\s+18|5\/18\/26/i.test(result.text);
        sourcePages[name].may_18_2026_minutes_link_present =
          /href=["'][^"']*(?:5-18-26|05-18-26)[^"']*(?:minutes|certificates)[^"']*\.pdf["']/i.test(
            result.text
          );
      }
    } catch (error) {
      sourcePages[name] = { url, ok: false, error: error.message, checked_at: ACCESS_DATE };
    }
  }

  const selectedUrls = new Set();
  for (const cert of SEED_CERTIFICATES) {
    const record = recordByCert.get(cert);
    if (record && record.source_url) selectedUrls.add(record.source_url);
  }
  const sourceStatusByUrl = new Map();
  for (const url of [...selectedUrls].sort()) {
    sourceStatusByUrl.set(url, await checkUrl(url));
  }

  const candidates = [];
  const selectedRejections = [];

  for (const cert of SEED_CERTIFICATES) {
    const record = recordByCert.get(cert);
    if (!record) {
      selectedRejections.push({ certificate_number: cert, reasons: ["certificate not found in parsed record artifact"] });
      continue;
    }

    const subject = cleanSubject(record);
    const text = `${subject} ${record.resolution || ""}`;
    const title = makeTitle(record, subject);
    const eventId = eventIdFor(record, subject);
    const borough = extractBorough(text);
    const reasons = [];

    if (record.effective_date < DATE_MIN || record.effective_date > DATE_MAX) reasons.push("date outside scope");
    if (!String(record.source_url || "").startsWith("https://www.nyc.gov/")) reasons.push("source URL is not nyc.gov");
    if (!INCLUDED_SUBJECT_PATTERN.test(text)) reasons.push("does not match architecture/public-realm scope");
    if (EXCLUDED_SUBJECT_PATTERN.test(text)) reasons.push("appears to be art/equipment/signage-only");
    if (!borough) reasons.push("no explicit NYC borough in source text");
    reasons.push(...isDuplicate(record, eventId, title, existingKeys));

    const geocode = reasons.length ? null : await geocodeCertificate(cert, borough);
    if (geocode && !geocode.ok) reasons.push(`geocode rejected: ${geocode.reason}`);
    if (geocode && geocode.ok && !boroughMatchesPoint(borough, geocode.coordinates)) {
      reasons.push(`geocode outside expected borough: ${borough}`);
    }

    if (reasons.length) {
      selectedRejections.push({
        certificate_number: cert,
        effective_date: record.effective_date || null,
        source_url: record.source_url || null,
        subject,
        reasons,
      });
      continue;
    }

    candidates.push(makeCandidate(record, subject, geocode, sourceStatusByUrl.get(record.source_url) || null));
  }

  candidates.sort((a, b) => {
    const byDate = a.effective_date.localeCompare(b.effective_date);
    if (byDate) return byDate;
    return Number(a.certificate_number) - Number(b.certificate_number);
  });

  const validation = validateCandidates(candidates);
  validation.generated_at = ACCESS_DATE;
  validation.script = path.relative(ROOT, __filename).replace(/\\/g, "/");
  validation.input_files = {
    certificate_records: path.relative(ROOT, INPUTS.certificateRecords).replace(/\\/g, "/"),
    manual_corpus: path.relative(ROOT, INPUTS.manualCorpus).replace(/\\/g, "/"),
    prior_candidate_files: INPUTS.priorCandidateFiles.map((file) => path.relative(ROOT, file).replace(/\\/g, "/")),
  };

  const range = dateRange(candidates);
  const sourceUrlsUsed = [...new Set(candidates.map((candidate) => candidate.source_url))].sort();
  const summary = {
    schema_version: "bims-round-summary/v0.1",
    round: "round403",
    task: "nyc_public_design_commission_next2_candidates",
    generated_at: ACCESS_DATE,
    date_scope: { start: DATE_MIN, end: DATE_MAX },
    candidate_count: candidates.length,
    date_range: range,
    milestone_mix: mixBy(candidates, "milestone_type"),
    project_type_mix: mixBy(candidates, "project_type"),
    source_url_count: sourceUrlsUsed.length,
    source_urls_used: sourceUrlsUsed,
    manual_corpus_count: corpusCount,
    manual_pdc_corpus_count: pdcCorpusCount,
    prior_candidate_counts: priorCandidateCounts,
    selected_certificate_count: SEED_CERTIFICATES.length,
    selected_rejection_count: selectedRejections.length,
    record_pool_audit_counts: recordPoolAudit.counts,
    validation_ok: validation.ok,
    validation_error_count: validation.error_count,
    validation_warning_count: validation.warning_count,
    source_page_status: sourcePages,
  };

  const rejected = {
    schema_version: "bims-rejected-records/v0.1",
    generated_at: ACCESS_DATE,
    selected_rejections: selectedRejections,
    screening_summary: recordPoolAudit.counts,
    sampled_screening_rejections: recordPoolAudit.sampleRejected,
    note:
      "The full PDC certificate pool is much larger than this clean next2 pack; sampled screening rejections are representative, while selected_rejections lists every seeded record dropped from round403.",
  };

  const sourceAudit = {
    schema_version: "bims-source-audit/v0.1",
    city_id: "nyc",
    created_at: ACCESS_DATE,
    accessed_at: ACCESS_DATE,
    auditor: "Codex worker Round403",
    task_scope:
      "Continue NYC Public Design Commission official design-review source ingestion after Round295; select fresh non-duplicate public-realm/civic/building administrative milestones through the 2026-05-20 access date.",
    official_source_only: true,
    sources: [
      {
        source_id: "nyc-pdc-current-meetings-page",
        source_name: "Public Design Commission meetings page",
        publisher: PUBLISHER,
        url: CURRENT_MEETINGS_PAGE,
        source_type: "official_index_page",
        license:
          "No explicit data license found on the page or PDFs during this pass; treat as official NYC.gov public records subject to NYC.gov terms.",
        license_url: NYC_TERMS_URL,
        terms_note: "NYC.gov terms of use apply.",
        coverage_years: { start: 2025, end: 2026 },
        update_frequency:
          "Meeting-driven; agendas are posted before meetings and minutes/certificates are generally posted after meetings.",
        geographic_scope:
          "New York City public projects reviewed by the Public Design Commission, with occasional city-owned/city-agency projects outside the five boroughs.",
        granularity: "Meeting PDF and certificate-level design-review action.",
        key_fields: [
          "meeting/adoption date",
          "certificate number",
          "approval type",
          "project/location text",
          "submitting agency",
          "conditions or understandings",
        ],
        reliability: "strong",
        source_confidence: "documented",
        required_caveats: [
          "PDC records document design review actions, not construction, completion, opening, operation, or urban outcome claims.",
          "PDC PDFs generally provide location descriptions rather than machine-readable geometry.",
        ],
        ingestion_recommendation:
          "Use for administrative design-review milestones. Pair with separate official construction/opening sources only if emitting built-outcome events.",
        access_status: sourcePages.current_meetings_page,
      },
      {
        source_id: "nyc-pdc-past-minutes-page",
        source_name: "Public Design Commission past meeting minutes archive",
        publisher: PUBLISHER,
        url: PAST_MINUTES_PAGE,
        source_type: "official_archive_page",
        license:
          "No explicit data license found on archived PDFs during this pass; treat as official NYC.gov public records subject to NYC.gov terms.",
        license_url: NYC_TERMS_URL,
        terms_note: "NYC.gov terms of use apply.",
        coverage_years: { start: 2008, end: 2024 },
        update_frequency: "Archived/static with occasional file revisions.",
        geographic_scope: "NYC civic buildings, parks, public realm, waterfronts, infrastructure, and public art subject to PDC review.",
        granularity: "Meeting PDF and certificate-level design-review action.",
        key_fields: [
          "meeting/adoption date",
          "certificate number",
          "approval type",
          "project/location text",
          "agency submitter",
          "conditions",
        ],
        reliability: "strong",
        source_confidence: "documented",
        required_caveats: [
          "Older archive PDFs use former Art Commission/PDC naming and may have OCR extraction defects.",
          "Approval dates are certificate adoption dates and must not be relabelled as physical change dates.",
        ],
        ingestion_recommendation: "Use for documented design-review approval events with explicit provenance and geometry caveats.",
        access_status: sourcePages.past_minutes_page,
      },
      {
        source_id: "nyc-planning-labs-geosearch",
        source_name: "NYC Planning Labs Geosearch",
        publisher: "NYC Planning Labs / NYC Department of City Planning ecosystem",
        url: GEOCODER_URL,
        source_type: "geocoding_service",
        license: "Used only for approximate geocoding metadata; check service attribution and underlying source terms before redistribution.",
        license_url: GEOCODER_ATTRIBUTION,
        terms_note: "Geocoding supports map placement only and is not event evidence.",
        geographic_scope: "New York City addresses, venues, streets, neighborhoods, and boroughs.",
        granularity: "Point geocode candidate.",
        reliability: "usable_with_caveats",
        source_confidence: "inferred",
        required_caveats: [
          "Geocoder coordinates are approximate and must not be treated as official PDC geometry.",
          "Corridor, shoreline, and large-park records use curated approximate points when a single address geocode is not defensible.",
        ],
        ingestion_recommendation: "Use as map-placement geometry with explicit caveats; replace with authoritative project geometry if available.",
      },
    ],
    selected_pdf_status: [...sourceStatusByUrl.values()],
  };

  const candidateEnvelope = {
    schema_version: "bims-pdc-candidates/v0.1",
    generated_at: ACCESS_DATE,
    source_id: SOURCE_ID,
    count: candidates.length,
    candidates,
  };

  writeJson(path.join(OUT_DIR, "candidates.json"), candidateEnvelope);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejected);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeNotes({ candidates, rejected, summary, validation });
  writeValidationReport(validation, summary);

  if (!validation.ok) {
    console.error(`Validation failed with ${validation.error_count} errors.`);
    process.exitCode = 1;
  }

  console.log(
    JSON.stringify(
      {
        output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        candidate_count: candidates.length,
        date_range: range,
        selected_rejections: selectedRejections.length,
        validation_ok: validation.ok,
        validation_errors: validation.error_count,
        validation_warnings: validation.warning_count,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
