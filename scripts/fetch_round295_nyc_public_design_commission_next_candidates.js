#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round295_nyc_public_design_commission_next");
const ACCESS_DATE = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const SOURCE_ID = "nyc-pdc-meeting-minutes-certificates-2008-2026";
const PUBLISHER = "New York City Public Design Commission";
const CURRENT_MEETINGS_PAGE = "https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page";
const PAST_MINUTES_PAGE = "https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page";
const NYC_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page";
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
  ],
  manualCorpus: path.join(
    ROOT,
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  ),
};

// Curated "next" set after round124/round126: high-signal civic design review
// actions with unambiguous NYC locations and official PDC certificate records.
const SEED_CERTIFICATES = [
  "28719",
  "28720",
  "28726",
  "28728",
  "28734",
  "28740",
  "28755",
  "28781",
  "28786",
  "28799",
  "28811",
  "28812",
  "28813",
  "28814",
  "28816",
  "28821",
  "28822",
  "28826",
  "29891",
  "29892",
  "29893",
  "29897",
  "29911",
  "29912",
  "29914",
  "29920",
  "29923",
  "30262",
  "30264",
  "30265",
  "30267",
  "30269",
  "30308",
  "30317",
  "30318",
  "30323",
  "30325",
  "30332",
  "30337",
  "30360",
];

const GEOCODE_QUERIES = {
  "28719": "70 Mulberry Street Manhattan",
  "28720": "East Tremont Avenue Devoe Avenue East 177th Street Bronx",
  "28726": "Sheepshead Bay Road Ocean Avenue Bedford Avenue Nostrand Avenue Shore Belt Parkway Brooklyn",
  "28728": "East 14th Street Shore Parkway Voorhies Avenue Brooklyn",
  "28734": "Esdale Bridge Ambergill Pond Prospect Park Brooklyn",
  "28740": "Harlem River Drive East 140th Street Manhattan Waterfront Greenway Manhattan",
  "28755": "West 79th Street Rotunda Riverside Park Manhattan",
  "28781": "Brooklyn Waterfront Greenway 29th Street 2nd Avenue Brooklyn",
  "28786": "Greenpoint Avenue Kingsland Avenue Brooklyn",
  "28799": "420 East 83rd Street Brooklyn",
  "28811": "89-11 Sutphin Boulevard Jamaica Queens",
  "28812": "299 DeGraw Street Brooklyn",
  "28813": "East Tremont Avenue 3rd Avenue Arthur Avenue Bronx",
  "28814": "444 Thomas S Boyland Street Brooklyn",
  "28816": "134-26 225th Street Laurelton Queens",
  "28821": "Corlears Hook Park Cherry Street Jackson Street FDR Drive Manhattan",
  "28822": "Weeping Beech Park Bowne Street 37th Avenue Flushing Queens",
  "28826": "Mellett Playground Avenue V East 13th Street Brooklyn",
  "29891": "Arden Heights Woods Woodrow Road Shotwell Avenue Staten Island",
  "29892": "275 Atlantic Avenue Brooklyn",
  "29893": "600 West 168th Street Manhattan",
  "29897": "177-11 109th Avenue Jamaica Queens",
  "29911": "Haffen Park Burke Avenue Ely Avenue Bronx",
  "29912": "Gwen Ifill Park 176th Street 129th Avenue Jamaica Queens",
  "29914": "East River Playground FDR Drive East 106th Street Manhattan",
  "29920": "2430 FDR Drive Service Road East 23rd Street Manhattan",
  "29923": "Lipsett Avenue Staten Island",
  "30262": "1932 Arthur Avenue Bronx",
  "30264": "32-11 Harper Street Corona Queens",
  "30265": "1270 Victory Boulevard Staten Island",
  "30267": "Third Avenue 46th Street 47th Street Brooklyn",
  "30269": "Twenty-Four Sycamores Park East 61st Street York Avenue Manhattan",
  "30308": "Meadow Lake Promenade Boat House Bridge Flushing Meadows Corona Park Queens",
  "30317": "3650 Nostrand Avenue Brooklyn",
  "30318": "1044 Eastern Parkway Brooklyn",
  "30323": "Lower East Side Ecology Center East River Park FDR Drive Jackson Street Cherry Street Manhattan",
  "30325": "West Street Chambers Street North Moore Street Manhattan",
  "30332": "Damrosch Park West 62nd Street Columbus Avenue Amsterdam Avenue Manhattan",
  "30337": "Idlewild Park 225th Street 149th Avenue Springfield Gardens Queens",
  "30360": "1801 Richmond Terrace Staten Island",
};

const MANUAL_GEOMETRY = {
  "28726": {
    coordinates: [-73.9524, 40.5889],
    label: "Approximate midpoint of four Shore Belt Parkway bridge sites near Sheepshead Bay, Ocean, Bedford, and Nostrand avenues, Brooklyn",
    source: "Curated midpoint from PDC corridor text; not official PDC geometry.",
    precision: "approximate multi-bridge corridor midpoint",
  },
  "28740": {
    coordinates: [-73.933, 40.817],
    label: "Approximate Harlem River Greenway esplanade midpoint between East 135th Street and East 145th Street, Manhattan",
    source: "Curated midpoint from PDC corridor text; not official PDC geometry.",
    precision: "approximate waterfront corridor midpoint",
  },
  "29891": {
    coordinates: [-74.203, 40.552],
    label: "Approximate Arden Heights Woods Bluebelt area, Staten Island",
    source: "Curated approximate point from named Bluebelt and street-bounds text; not official PDC geometry.",
    precision: "approximate multi-site bluebelt area point",
  },
  "29923": {
    coordinates: [-74.0805, 40.617],
    label: "Approximate Lipsett Avenue shoreline/street-end area, Staten Island",
    source: "Curated approximate point from PDC street-end text; not official PDC geometry.",
    precision: "approximate shoreline street-end point",
  },
  "30308": {
    coordinates: [-73.8442, 40.7288],
    label: "Approximate Meadow Lake Promenade / Boat House Bridge area, Flushing Meadows Corona Park, Queens",
    source: "Curated approximate point from PDC park-location text; not official PDC geometry.",
    precision: "approximate park project point",
  },
  "30325": {
    coordinates: [-74.0125, 40.7183],
    label: "Approximate West Street corridor between Chambers Street and North Moore Street, Manhattan",
    source: "Curated midpoint from PDC corridor text; not official PDC geometry.",
    precision: "approximate resiliency corridor midpoint",
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
  [/community center|recreation center/i, "community_or_recreation_center"],
  [/health center/i, "health_facility"],
  [/detention|courthouse|court/i, "justice_or_civic_facility"],
  [/pump|wastewater|bluebelt|stormwater/i, "water_infrastructure"],
  [/greenway|esplanade|waterfront|shoreline|bulkhead/i, "waterfront_public_realm"],
  [/bridge/i, "bridge_or_pedestrian_connection"],
  [/street|streetscape|plaza/i, "streetscape_or_plaza"],
  [/park|playground|garden|field|outdoor classroom/i, "park_or_playground"],
  [/garage|yard|facility|building|renovation|rehabilitation/i, "public_facility_architecture"],
];

const EXCLUDED_SUBJECT_PATTERN =
  /\b(artwork|artist|monument|sculpture|mural|signage|signs?|plaque|banner|wayfinding|security cameras?|camera|bollards?|guardrail|generator|antenna|telecommunications|distinctive lighting|prototype|prototypical)\b/i;

const INCLUDED_SUBJECT_PATTERN =
  /\b(construction|reconstruction|rehabilitation|restoration|renovation|addition|facade|façade|roof|library|community center|health center|courthouse|detention|park|playground|plaza|greenway|esplanade|waterfront|shoreline|bridge|building|facility|public realm|streetscape|street|pump station|wastewater|bluebelt|garage|recreation center|public restroom)\b/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
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

function existingKeysFromManual(corpusPath) {
  const parsed = readJson(corpusPath);
  const rows = Array.isArray(parsed) ? parsed : parsed.events || parsed.items || [];
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

    const isPdc =
      JSON.stringify(row).toLowerCase().includes("public design commission") ||
      String(eventId || "").toLowerCase().includes("nyc_pdc");
    if (isPdc) {
      for (const cert of extractCertificateIds(row)) keys.certificates.add(cert);
    }
  }

  return { keys, corpusCount: rows.length };
}

function existingKeysFromPrior(files) {
  const keys = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    titleDates: new Set(),
    certificates: new Set(),
    normalizedTitles: new Set(),
    sourceUrls: new Set(),
  };
  const counts = {};

  for (const file of files) {
    const rows = arrayFromCandidateFile(file);
    counts[path.relative(ROOT, file)] = rows.length;
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
  }

  return { keys, counts };
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
  return `nyc_pdc_round295_${datePart}_${record.certificate}_${slugify(stripSubjectPrefix(subject), 72)}`;
}

function makeTitle(record, subject) {
  const shortSubject = stripSubjectPrefix(subject);
  return `PDC ${record.approval_type} for ${shortSubject}`;
}

function makeSummary(record, subject) {
  return `Official NYC Public Design Commission certificate ${record.certificate} records ${record.approval_type} for ${subject}.`;
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
      "user-agent": "Bims-5 round295 source auditor (citation metadata only)",
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
      headers: { "user-agent": "Bims-5 round295 source auditor (citation metadata only)" },
    });
    if (!response.ok || response.status === 405) {
      response = await fetch(url, {
        headers: {
          "user-agent": "Bims-5 round295 source auditor (citation metadata only)",
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
      geocoder_attribution: null,
      geocoder_feature: null,
    };
  }

  const query = GEOCODE_QUERIES[cert];
  if (!query) return { ok: false, reason: "no geocode query configured" };

  const url = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Bims-5 round295 geocoding (approximate event map placement)",
        accept: "application/json",
      },
    });
    if (!response.ok) {
      return { ok: false, reason: `geocoder returned HTTP ${response.status}`, query };
    }
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
      "terms_note",
      "accessed_at",
      "confidence",
      "limitations",
      "transformation_method",
    ]) {
      if (!candidate[field] || (Array.isArray(candidate[field]) && !candidate[field].length)) {
        errors.push(`${prefix}: missing ${field}`);
      }
    }
    if (candidate.city_id !== "nyc") errors.push(`${prefix}: city_id is not nyc`);
    if (candidate.accessed_at !== ACCESS_DATE) errors.push(`${prefix}: accessed_at is not ${ACCESS_DATE}`);
    if (candidate.effective_date < DATE_MIN || candidate.effective_date > DATE_MAX) {
      errors.push(`${prefix}: date outside scope`);
    }
    if (candidate.publisher !== PUBLISHER) errors.push(`${prefix}: publisher mismatch`);
    if (candidate.confidence !== "documented") errors.push(`${prefix}: confidence is not documented`);
    if (!candidate.geometry || candidate.geometry.type !== "Point") errors.push(`${prefix}: missing point geometry`);
    const coords = candidate.geometry && candidate.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
      errors.push(`${prefix}: invalid geometry coordinates`);
    } else {
      const [lon, lat] = coords;
      if (!(lon >= -74.26 && lon <= -73.7 && lat >= 40.47 && lat <= 40.92)) {
        errors.push(`${prefix}: coordinates outside NYC bounding box`);
      }
    }
    if (/construction started|construction finished|opened|completed|completion|caused|predicted|forecast/i.test(candidate.observed_change || "")) {
      errors.push(`${prefix}: observed_change appears to overclaim beyond design review`);
    }
    if (!candidate.limitations.some((item) => /not evidence that construction started|not construction/i.test(item))) {
      warnings.push(`${prefix}: limitations should explicitly separate PDC approval from construction status`);
    }
    if (ids.has(candidate.event_id)) errors.push(`${prefix}: duplicate event_id`);
    ids.add(candidate.event_id);
    if (sourceRecordIds.has(candidate.source_record_id)) errors.push(`${prefix}: duplicate source_record_id`);
    sourceRecordIds.add(candidate.source_record_id);
    if (certs.has(candidate.certificate_number)) errors.push(`${prefix}: duplicate certificate_number`);
    certs.add(candidate.certificate_number);
  });

  return {
    ok: errors.length === 0,
    error_count: errors.length,
    warning_count: warnings.length,
    errors,
    warnings,
  };
}

function milestoneMix(candidates) {
  return candidates.reduce((acc, candidate) => {
    acc[candidate.milestone_type] = (acc[candidate.milestone_type] || 0) + 1;
    return acc;
  }, {});
}

function projectTypeMix(candidates) {
  return candidates.reduce((acc, candidate) => {
    acc[candidate.project_type] = (acc[candidate.project_type] || 0) + 1;
    return acc;
  }, {});
}

function dateRange(candidates) {
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return { start: dates[0] || null, end: dates[dates.length - 1] || null };
}

function makeCandidate(record, subject, geocode, sourceStatus) {
  const title = makeTitle(record, subject);
  const eventId = eventIdFor(record, subject);
  const borough = extractBorough(subject);
  const sourcePath = path.join(
    "tmp",
    "subagents",
    "round124_nyc_public_design_commission",
    record.txt_file || ""
  );

  return {
    schema_version: "bims-event-candidate/v0.1",
    city_id: "nyc",
    candidate_id: eventId,
    event_id: eventId,
    title,
    summary: makeSummary(record, subject),
    short_description: makeSummary(record, subject),
    observed_change: `NYC Public Design Commission recorded ${record.approval_type} for ${subject}.`,
    year: Number(String(record.effective_date).slice(0, 4)),
    effective_date: record.effective_date,
    effective_date_range: null,
    date_precision: "day",
    source_date_field: "PDC certificate adoption date",
    category: "design_review_approval",
    lens: "public_design_commission",
    milestone_type: record.approval_type,
    project_type: projectType(subject),
    approval_body: PUBLISHER,
    certificate: String(record.certificate),
    certificate_number: String(record.certificate),
    source_record_id: sourceRecordId(record),
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
      "Official NYC.gov public record; explicit reuse license not stated in the PDF. Treat as citation evidence subject to NYC.gov terms of use.",
    license_url: NYC_TERMS_URL,
    terms_note: "NYC.gov terms of use apply; PDF did not state a separate reuse license.",
    attribution: "Source: New York City Public Design Commission.",
    attribution_text: "Source: New York City Public Design Commission.",
    accessed_at: ACCESS_DATE,
    source_access: sourceStatus || null,
    confidence: "documented",
    geometry_source: geocode.source,
    geometry_precision: geocode.precision,
    limitations: [
      "PDC approval is a design-review milestone, not evidence that construction started, finished, opened, was occupied, or produced outcomes.",
      "The source certificate may include conditions or understandings; consult the PDF before treating the approval as unconditional.",
      "Coordinates are approximate and derived from PDC location text for map placement; PDC did not provide official GIS geometry in the certificate.",
    ],
    evidence: [
      {
        source_id: SOURCE_ID,
        label: `Certificate ${record.certificate}, adopted ${record.effective_date}`,
        kind: "source_record",
        url: record.source_url,
        record_id: sourceRecordId(record),
      },
    ],
    transformation_method:
      "Round295 deterministic extraction from official PDC certificate records parsed from NYC.gov PDFs; deduplicated against manual corpus and prior PDC outputs; approximate point geocoded from certificate location text.",
    provenance: {
      transform:
        "Read parsed official PDC certificate record from round124 support artifact, selected unused architecture/public-realm administrative approvals, checked official source URLs on 2026-05-20, geocoded location text, and emitted candidate event with caveats.",
      source_path: sourcePath.replace(/\\/g, "/"),
      source_record_id: sourceRecordId(record),
      source_url: record.source_url,
      source_retrieved_at: "2026-05-19",
      accessed_at: ACCESS_DATE,
      source_dataset_id: SOURCE_ID,
      source_basis: "Official PDC certificate resolution documenting a design-review approval action.",
      source_date_field: "PDC certificate adoption date",
      source_page: record.page || null,
      source_pdf_status: sourceStatus || null,
      geometry_query: geocode.query,
      geometry_geocode_label: geocode.label,
      geometry_source: geocode.source,
      geometry_precision: geocode.precision,
      geometry_method: geocode.method,
      geocoder_attribution: geocode.geocoder_attribution,
      geocoder_feature: geocode.geocoder_feature,
      manual_geometry_caveat: geocode.method === "curated_approximate_point",
    },
  };
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
    not_seeded_for_round295: 0,
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
        counts.not_seeded_for_round295 += 1;
        reasons.push("available but not selected for clean round295 pack");
      }
    }
    if (reasons.length && sampleRejected.length < 80) {
      sampleRejected.push({
        certificate_number: cert,
        effective_date: record.effective_date || null,
        subject: subject.slice(0, 220),
        reasons,
      });
    }
  }

  return { counts, sampleRejected };
}

function writeNotes({ candidates, rejected, summary, validation }) {
  const range = dateRange(candidates);
  const lines = [
    "# Round295 NYC Public Design Commission next candidates",
    "",
    `Created: ${ACCESS_DATE}`,
    "",
    "## Scope",
    "",
    "Official NYC Public Design Commission design-review and certificate records only. These are administrative design review or approval milestones, not construction starts, completions, openings, forecasts, or causal claims.",
    "",
    "## Outputs",
    "",
    `- candidates.json: ${candidates.length} candidate events.`,
    "- source_audit.json: source, terms, coverage, and caveat audit.",
    "- summary.json: count, date range, milestone mix, source status, and reject counts.",
    "- rejected.json: selected-record rejections plus screening counts and sampled non-selected rejects.",
    "- validation.json and validation_report.md: machine-readable and human-readable validation results.",
    "",
    "## Result",
    "",
    `- Date range: ${range.start || "n/a"} through ${range.end || "n/a"}.`,
    `- Milestone mix: ${Object.entries(milestoneMix(candidates))
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ") || "none"}.`,
    `- Validation: ${validation.ok ? "passed" : "failed"} with ${validation.error_count} errors and ${validation.warning_count} warnings.`,
    `- Selected rejections: ${rejected.selected_rejections.length}.`,
    "",
    "## Method",
    "",
    "1. Reused the parsed official PDC certificate records from the round124 support artifact, whose source URLs are NYC.gov PDC PDF links.",
    "2. Re-checked the current PDC meetings page, the past-minutes archive, NYC.gov terms URL, and selected source PDF URLs during this pass.",
    "3. Excluded certificate IDs and normalized title/date keys already present in the manual architecture corpus or prior round124/round126 PDC candidate packs.",
    "4. Selected a small next set of clean architecture, civic facility, park, bridge, waterfront, public-realm, and water-infrastructure design-review actions.",
    "5. Added approximate point geometry from NYC Planning Labs Geosearch where possible, with curated midpoint points for multi-site/corridor projects.",
    "",
    "## Caveats",
    "",
    "- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.",
    "- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.",
    "- PDFs do not state a separate open-data license. The pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.",
    "- The official current meetings page listed the May 18, 2026 row at access time, but no linked May 18 minutes/certificates PDF was available in the page HTML used by this pass.",
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
    "# Round295 validation report",
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
    "- Coordinates are points within a broad NYC bounding box.",
    "- Candidate IDs, source record IDs, and certificate numbers are unique.",
    "- `observed_change` text avoids construction/completion/opening/outcome claims.",
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
  const { keys: manualKeys, corpusCount } = existingKeysFromManual(INPUTS.manualCorpus);
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
          /href=["'][^"']*(?:5-18-26|05-18-26|5%2F18%2F26|05%2F18%2F26)[^"']*["']/i.test(result.text);
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
    round: "round295",
    task: "nyc_public_design_commission_next_candidates",
    generated_at: ACCESS_DATE,
    date_scope: { start: DATE_MIN, end: DATE_MAX },
    candidate_count: candidates.length,
    date_range: range,
    milestone_mix: milestoneMix(candidates),
    project_type_mix: projectTypeMix(candidates),
    source_url_count: sourceUrlsUsed.length,
    source_urls_used: sourceUrlsUsed,
    manual_corpus_count: corpusCount,
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
    note: "The full PDC record pool is much larger than this clean candidate pack; sampled screening rejections are representative, while selected_rejections lists every seeded record dropped from round295.",
  };

  const sourceAudit = {
    schema_version: "bims-source-audit/v0.1",
    city_id: "nyc",
    created_at: ACCESS_DATE,
    accessed_at: ACCESS_DATE,
    auditor: "Codex worker Round295",
    task_scope:
      "Find additional NYC Public Design Commission / official civic design review architecture-related candidate events after prior PDC packs through round126/124.",
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
          "The May 18, 2026 meeting row was present on the current page at access time, but no linked May 18 minutes/certificates PDF was available in the fetched HTML.",
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
        url: "https://geosearch.planninglabs.nyc/v2/search",
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
          "Corridor and multi-site records use curated midpoint approximations where a single address geocode is not defensible.",
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
