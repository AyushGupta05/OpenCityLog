#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ROUND = 672;
const NEXT = "next133";
const ROUND_NAME = `round${ROUND}_london_pld_lifecycle_${NEXT}`;
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json",
);
const API_URL = "https://planningdata.london.gov.uk/api-guest/applications/_search";
const SOURCE_URL_PREFIX = "https://planningdata.london.gov.uk/api-guest/applications/_source/";
const LANDING_URL = "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/";
const ACCESSED_AT = "2026-05-23";
const GENERATED_AT = "2026-05-23T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = "2008-12-10";
const TARGET_COUNT = 150;
const MIN_SCORE = 24;

const LONDON_BOUNDS = {
  minLon: -0.5103,
  maxLon: 0.334,
  minLat: 51.2868,
  maxLat: 51.6919,
};

const FIELDS = [
  "id",
  "lpa_name",
  "borough",
  "lpa_app_no",
  "site_name",
  "site_number",
  "street_name",
  "secondary_street_name",
  "locality",
  "postcode",
  "description",
  "decision",
  "decision_date",
  "status",
  "application_type_full",
  "centroid",
  "wgs84_polygon",
  "url_planning_app",
  "actual_commencement_date",
  "actual_completion_date",
  "application_details.scheme_name",
  "application_details.site_area",
  "application_details.total_gia_gained",
  "application_details.total_gia_lost",
  "application_details.projected_cost_of_works",
  "application_details.residential_details.total_no_proposed_residential_units",
];

const LIFECYCLE_SPECS = [
  {
    field: "actual_completion_date",
    kind: "completion",
    titleNoun: "completion date",
    observed:
      "Planning London Datahub records an actual completion date for this planning application row; this is a source-reported administrative lifecycle field.",
  },
  {
    field: "actual_commencement_date",
    kind: "commencement",
    titleNoun: "commencement date",
    observed:
      "Planning London Datahub records an actual commencement date for this planning application row; this is a source-reported administrative lifecycle field.",
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

function slug(value, limit = 120) {
  return compactText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, limit)
    .replace(/_+$/g, "");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function isoFromPldDate(value) {
  const text = compactText(value);
  const dmy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return "";
}

function dmyFromIso(value) {
  const match = compactText(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`Expected ISO date, got ${value}`);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function pldIdKey(value) {
  const text = compactText(value);
  if (!text) return "";
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    decoded = text;
  }
  return decoded.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sourceUrlFor(row) {
  return `${SOURCE_URL_PREFIX}${encodeURIComponent(row.id)}`;
}

function addressFor(row) {
  return [
    row.site_name,
    [row.site_number, row.street_name].filter(Boolean).join(" "),
    row.secondary_street_name,
    row.locality,
    row.postcode,
  ]
    .map(compactText)
    .filter(Boolean)
    .join(", ") || row.lpa_app_no || row.id;
}

function sentenceTrim(value, limit = 340) {
  const text = compactText(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).split(" ").slice(0, -1).join(" ").replace(/[,:;.-]+$/, "")}...`;
}

function textFor(row) {
  return [
    row.site_name,
    row.description,
    row.application_details?.scheme_name,
    row.application_type_full,
    row.street_name,
    row.locality,
    row.postcode,
    row.lpa_name,
  ]
    .map(compactText)
    .filter(Boolean)
    .join(" ");
}

function pointFor(row) {
  const centroid = row.centroid || {};
  const lon = Number(centroid.lon);
  const lat = Number(centroid.lat);
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    return { lon, lat, source: "Planning London Datahub centroid field" };
  }

  const coords = [];
  function visit(value) {
    if (!value) return;
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1]))
    ) {
      coords.push({ lon: Number(value[0]), lat: Number(value[1]) });
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  }
  visit(row.wgs84_polygon?.coordinates);
  if (!coords.length) return null;
  return {
    lon: coords.reduce((sum, point) => sum + point.lon, 0) / coords.length,
    lat: coords.reduce((sum, point) => sum + point.lat, 0) / coords.length,
    source: "Approximate centroid derived from Planning London Datahub WGS84 polygon coordinates",
  };
}

function inLondon(point) {
  return (
    point &&
    point.lon >= LONDON_BOUNDS.minLon &&
    point.lon <= LONDON_BOUNDS.maxLon &&
    point.lat >= LONDON_BOUNDS.minLat &&
    point.lat <= LONDON_BOUNDS.maxLat
  );
}

function isLowValueAdmin(row) {
  const text = `${row.application_type_full || ""} ${row.description || ""}`.toLowerCase();
  return /certificate of lawfulness|lawful development|tree works|advertisement|non[- ]material amendment|details pursuant|approval of details|discharge of condition|telecommunications|satellite dish|fascia sign|hoarding|temporary use/.test(
    text,
  );
}

function score(row, spec, date) {
  const text = textFor(row).toLowerCase();
  let value = 0;
  const keywords = [
    [/school|academy|college|university|campus|student/, 34],
    [/hospital|health|clinic|medical|nhs|care home|extra care/, 34],
    [/library|museum|gallery|theatre|cinema|arts|cultural|heritage|listed building/, 32],
    [/town hall|civic|community centre|community hub|leisure centre|market|sports centre/, 30],
    [/estate regeneration|regeneration|masterplan|comprehensive redevelopment|public realm|public square/, 28],
    [/station|transport interchange|bridge|park|playground|open space/, 22],
    [/mixed use|hotel|office|commercial|retail|residential redevelopment/, 12],
  ];
  for (const [regex, points] of keywords) {
    if (regex.test(text)) value += points;
  }

  const details = row.application_details || {};
  const gia = Number(details.total_gia_gained || 0);
  const lost = Math.abs(Number(details.total_gia_lost || 0));
  const units = Number(details.residential_details?.total_no_proposed_residential_units || 0);
  const siteArea = Number(details.site_area || 0);
  const cost = Number(details.projected_cost_of_works || 0);
  if (gia >= 25000) value += 45;
  else if (gia >= 10000) value += 35;
  else if (gia >= 2500) value += 20;
  if (lost >= 5000) value += 12;
  if (units >= 500) value += 38;
  else if (units >= 150) value += 28;
  else if (units >= 50) value += 16;
  if (siteArea >= 1) value += 10;
  if (cost >= 50000000) value += 18;
  else if (cost >= 10000000) value += 10;
  if (String(row.status || "").toLowerCase().includes("completed")) value += spec.kind === "completion" ? 8 : 3;
  if (/demolition|erection|redevelopment|extension|alteration|conversion|refurbishment/.test(text)) value += 8;
  if (isLowValueAdmin(row)) value -= 40;
  if (date < START_DATE || date > END_DATE) value -= 100;
  return value;
}

function existingKeysFromManualCorpus() {
  const doc = readJson(CORPUS_PATH);
  const result = {
    eventIds: new Set(),
    sourceRecordIds: new Set(),
    sourceUrls: new Set(),
    pldIds: new Set(),
    pldFieldDateKeys: new Set(),
    titleDateKeys: new Set(),
  };

  for (const event of doc.events || []) {
    result.eventIds.add(compactText(event.event_id));
    result.sourceRecordIds.add(compactText(event.source_record_id));
    result.sourceUrls.add(compactText(event.source_url));
    result.titleDateKeys.add(`${compactText(event.title).toLowerCase()}\u0000${compactText(event.date || event.effective_date)}`);

    const text = `${event.source_record_id || ""} ${event.source_url || ""}`;
    for (const match of text.matchAll(/PLD:([^;]+)/gi)) {
      const id = pldIdKey(match[1]);
      if (id) result.pldIds.add(id);
    }
    for (const match of text.matchAll(/applications\/_source\/([^?\s]+)/gi)) {
      const id = pldIdKey(match[1]);
      if (id) result.pldIds.add(id);
    }
    const pld = text.match(/PLD:([^;]+)/i);
    const field = text.match(/DATE_FIELD:([^;]+)/i);
    const date = text.match(/DATE:([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (pld && field && date) {
      result.pldFieldDateKeys.add(`${pldIdKey(pld[1])}\u0000${compactText(field[1])}\u0000${date[1]}`);
    }
  }
  return result;
}

function candidateRowsFromPack(pack) {
  if (Array.isArray(pack)) return pack;
  if (Array.isArray(pack.candidates)) return pack.candidates;
  if (Array.isArray(pack.events)) return pack.events;
  return [];
}

function addPriorScratchKeys(keys) {
  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  if (!fs.existsSync(subagentsDir)) return [];
  const scanned = [];
  for (const entry of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^round\d+_london_pld_lifecycle_/.test(entry.name)) continue;
    const roundMatch = entry.name.match(/^round(\d+)_/);
    const roundNumber = roundMatch ? Number(roundMatch[1]) : 0;
    if (roundNumber >= ROUND) continue;
    const packPath = path.join(subagentsDir, entry.name, "candidates.json");
    if (!fs.existsSync(packPath)) continue;
    const pack = readJson(packPath);
    const rows = candidateRowsFromPack(pack);
    for (const row of rows) {
      const sourceUrl = compactText(row.source_url);
      if (sourceUrl) keys.sourceUrls.add(sourceUrl);
      const sourceRecord = compactText(row.source_record_id);
      if (sourceRecord) keys.sourceRecordIds.add(sourceRecord);
      const text = `${sourceRecord} ${sourceUrl}`;
      const pld = text.match(/PLD:([^;]+)/i);
      const field = compactText(row.source_lifecycle_field || row.source_date_field).replace(/^PLD\s+/i, "");
      const date = compactText(row.effective_date || row.date);
      if (pld && field && date) {
        keys.pldFieldDateKeys.add(`${pldIdKey(pld[1])}\u0000${field}\u0000${date}`);
        keys.pldIds.add(pldIdKey(pld[1]));
      }
      for (const match of text.matchAll(/applications\/_source\/([^?\s]+)/gi)) {
        const id = pldIdKey(match[1]);
        if (id) keys.pldIds.add(id);
      }
      keys.titleDateKeys.add(`${compactText(row.title).toLowerCase()}\u0000${date}`);
    }
    scanned.push({ name: entry.name, candidates: rows.length });
  }
  return scanned.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchRows(spec) {
  const rows = [];
  const seenIds = new Set();
  for (let from = 0; from < 25000; from += 500) {
    const body = {
      from,
      size: 500,
      _source: FIELDS,
      sort: [{ [spec.field]: { order: "desc", missing: "_last" } }],
      query: {
        bool: {
          filter: [
            { exists: { field: spec.field } },
            { range: { [spec.field]: { gte: dmyFromIso(START_DATE), lte: dmyFromIso(END_DATE) } } },
          ],
        },
      },
    };
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": `Bims5Round${ROUND}PldLifecycle/0.1`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`${spec.field} ${from}: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    const hits = data.hits?.hits || [];
    for (const hit of hits) {
      const row = { ...(hit._source || {}), id: hit._source?.id || hit._id };
      if (!row.id || seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      rows.push(row);
    }
    console.log(`${spec.field}: fetched ${rows.length}`);
    if (hits.length < 500) break;
  }
  return rows;
}

function sourceRecordIdFor(row, spec, date) {
  return `PLD:${row.id}; LPA:${row.lpa_app_no || ""}; DATE_FIELD:${spec.field}; DATE:${date}`;
}

function candidateIdFor(row, spec, date) {
  return `round${ROUND}_lon_pld_${spec.kind}_${slug(row.id)}_${date.replace(/-/g, "_")}`;
}

function metricsText(row) {
  const details = row.application_details || {};
  const items = [];
  const gia = Number(details.total_gia_gained || 0);
  const lost = Math.abs(Number(details.total_gia_lost || 0));
  const units = Number(details.residential_details?.total_no_proposed_residential_units || 0);
  const siteArea = Number(details.site_area || 0);
  if (gia) items.push(`${gia} sqm GIA gained`);
  if (lost) items.push(`${lost} sqm GIA lost`);
  if (units) items.push(`${units} proposed residential units`);
  if (siteArea) items.push(`${siteArea} ha site area`);
  return items.length ? ` Source metrics include ${items.join("; ")}.` : "";
}

function candidateFor(row, spec, date, point, selectionScore) {
  const address = addressFor(row);
  const sourceUrl = sourceUrlFor(row);
  const roundedLon = Number(point.lon.toFixed(6));
  const roundedLat = Number(point.lat.toFixed(6));
  return {
    city_id: "london",
    event_id: `lon_arch_${candidateIdFor(row, spec, date)}`,
    candidate_id: candidateIdFor(row, spec, date),
    date,
    effective_date: date,
    date_precision: "day",
    bucket: "planning/development/architecture/lifecycle",
    category: `planning_${spec.kind}`,
    title: `PLD ${spec.titleNoun} recorded for ${address}`,
    summary: `Planning London Datahub records a source-reported administrative ${spec.titleNoun} field dated ${date} for ${row.lpa_app_no || row.id} at ${address}. The row describes: ${sentenceTrim(row.description)}.${metricsText(row)}`,
    observed_change: `${spec.observed} Treat it as an administrative planning-feed record only, not a direct site observation of construction, opening, occupation, final built form, or wider results.`,
    area: row.borough || row.lpa_name || "London",
    location_name: address,
    address,
    latitude: roundedLat,
    longitude: roundedLon,
    geometry: { type: "Point", coordinates: [roundedLon, roundedLat] },
    source_id: "gla-planning-datahub-applications",
    source_ids: ["gla-planning-datahub-applications"],
    source_name: "Planning London Datahub applications",
    publisher: `Greater London Authority / ${row.lpa_name || row.borough || "London planning authority"}`,
    source_url: sourceUrl,
    source_page_url: LANDING_URL,
    source_api_url: API_URL,
    source_record_id: sourceRecordIdFor(row, spec, date),
    source_type: "official Planning London Datahub application API record",
    source_lifecycle_field: spec.field,
    source_date_field: spec.field,
    source_dataset_id: "gla-planning-datahub-applications",
    source_retrieved_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    project_type: `${spec.kind} lifecycle planning record`,
    selection_score: Number(selectionScore.toFixed(1)),
    pld_id: row.id,
    lpa_reference: row.lpa_app_no || "",
    borough: row.borough || row.lpa_name || "",
    decision: row.decision || "",
    status: row.status || "",
    application_type_full: row.application_type_full || "",
    geometry_source: `${point.source}; PLD source row ${sourceUrl}.`,
    geometry_precision: point.source.includes("polygon")
      ? "approximate representative point from PLD polygon; not a surveyed parcel, building footprint, phase boundary, or works extent"
      : "PLD centroid for atlas navigation; not a surveyed parcel, building footprint, phase boundary, or works extent",
    license: "London Datastore record for Planning London Datahub applications lists Licence: Not Specified; retain factual row metadata, official source URLs, attribution, and retrieval date.",
    license_url: LANDING_URL,
    license_or_terms_note:
      "London Datastore Planning London Datahub applications page lists Licence: Not Specified as checked on 2026-05-23; this candidate pack retains factual row metadata, official row/API URLs, attribution, and retrieval date, and terms should be reviewed before redistribution.",
    attribution:
      "Contains Planning London Datahub application information supplied by the Greater London Authority and London planning authorities.",
    limitations:
      "PLD actual_commencement_date and actual_completion_date are source-reported administrative or applicant/local-authority lifecycle fields from borough planning feeds and may be unevenly populated or interpreted across authorities. This row is not evidence of construction start, construction completion, public opening, legal occupancy, actual occupancy, current use, design quality, safety, affordability, delivery outcomes, causation, or final built form. Geometry is a PLD point or polygon-derived representative point for atlas navigation and may not be the precise building footprint, parcel, phase boundary, or works extent. The London Datastore licence entry for the applications source is Not Specified; keep attribution/source URLs and review terms before redistributing source data at bulk scale.",
    transformation_method:
      `scripts/fetch_round${ROUND}_london_pld_lifecycle_${NEXT}_candidates.js queried the official PLD guest API for ${spec.field} rows from ${START_DATE} through ${END_DATE}, filtered duplicates against the live architecture corpus and prior PLD packs, scored architecture/city-change signal, and retained row-level source URL, date field, point geometry, attribution, access date, and limitations.`,
  };
}

function rejectionFor(reason, row, spec, date, selectionScore) {
  return {
    reason,
    pld_id: row.id || "",
    source_lifecycle_field: spec.field,
    effective_date: date,
    lpa_reference: row.lpa_app_no || "",
    borough: row.borough || row.lpa_name || "",
    selection_score: Number(selectionScore.toFixed(1)),
    source_url: row.id ? sourceUrlFor(row) : "",
  };
}

function validateCandidates(candidates, keys, priorPackCount) {
  const errors = [];
  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const fields = {};
  let minDate = "";
  let maxDate = "";
  for (const candidate of candidates) {
    const required = [
      "city_id",
      "event_id",
      "date",
      "title",
      "summary",
      "observed_change",
      "source_url",
      "source_record_id",
      "source_date_field",
      "source_retrieved_at",
      "latitude",
      "longitude",
      "geometry_source",
      "geometry_precision",
      "license_or_terms_note",
      "attribution",
      "limitations",
      "transformation_method",
    ];
    for (const field of required) {
      if (Array.isArray(candidate[field]) ? !candidate[field].length : !compactText(candidate[field])) {
        errors.push(`${candidate.event_id || candidate.candidate_id} missing ${field}`);
      }
    }
    if (eventIds.has(candidate.event_id)) errors.push(`duplicate event_id ${candidate.event_id}`);
    eventIds.add(candidate.event_id);
    const pld = pldIdKey(candidate.pld_id);
    const key = `${pld}\u0000${candidate.source_date_field}\u0000${candidate.effective_date}`;
    if (sourceDateKeys.has(key)) errors.push(`duplicate source-date key ${key}`);
    sourceDateKeys.add(key);
    if (keys.pldFieldDateKeys.has(key)) errors.push(`candidate overlaps prior source-date key ${key}`);
    if (keys.sourceRecordIds.has(candidate.source_record_id)) {
      errors.push(`candidate overlaps prior source_record_id ${candidate.source_record_id}`);
    }
    if (keys.sourceUrls.has(candidate.source_url)) {
      errors.push(`candidate overlaps prior source_url ${candidate.source_url}`);
    }
    if (candidate.effective_date < START_DATE || candidate.effective_date > END_DATE) {
      errors.push(`${candidate.event_id} outside expected date range`);
    }
    if (!inLondon({ lon: Number(candidate.longitude), lat: Number(candidate.latitude) })) {
      errors.push(`${candidate.event_id} outside London coordinate bounds`);
    }
    if (/opened|occupied|caused|predicted|forecast|proved/i.test(candidate.observed_change)) {
      errors.push(`${candidate.event_id} has restricted lifecycle wording`);
    }
    fields[candidate.source_date_field] = (fields[candidate.source_date_field] || 0) + 1;
    minDate = !minDate || candidate.effective_date < minDate ? candidate.effective_date : minDate;
    maxDate = !maxDate || candidate.effective_date > maxDate ? candidate.effective_date : maxDate;
  }
  return {
    ok: errors.length === 0 && candidates.length === TARGET_COUNT,
    validated_at: GENERATED_AT,
    validation_type: `${ROUND_NAME}_pack_validation`,
    candidate_count: candidates.length,
    target_count: TARGET_COUNT,
    date_range: { min: minDate, max: maxDate },
    lifecycle_field_mix: fields,
    unique_event_ids: eventIds.size,
    unique_source_date_keys: sourceDateKeys.size,
    manual_and_prior_source_url_keys_scanned: keys.sourceUrls.size,
    manual_and_prior_source_record_keys_scanned: keys.sourceRecordIds.size,
    manual_and_prior_pld_field_date_keys_scanned: keys.pldFieldDateKeys.size,
    prior_pack_count_scanned: priorPackCount,
    checks: [
      "required provenance fields",
      "fixed retrieval date",
      "literal PLD lifecycle field names",
      "2008 date window",
      "London coordinate bounds",
      "unique event ids and source-date keys",
      "no overlap with manual corpus or prior PLD lifecycle packs",
      "official source/API URLs",
      "licence and lifecycle caveats",
      "administrative-only wording",
    ],
    errors,
  };
}

async function main() {
  ensureDir(OUT_DIR);
  const keys = existingKeysFromManualCorpus();
  const priorPacks = addPriorScratchKeys(keys);
  const rejected = [];
  const candidates = [];
  const inBatchPldIds = new Set();
  const inBatchSourceDateKeys = new Set();
  const queryStats = [];

  for (const spec of LIFECYCLE_SPECS) {
    const rows = await fetchRows(spec);
    queryStats.push({ field: spec.field, kind: spec.kind, fetched: rows.length });
    const scored = [];
    for (const row of rows) {
      const date = isoFromPldDate(row[spec.field]);
      const point = pointFor(row);
      const selectionScore = score(row, spec, date);
      const pldId = pldIdKey(row.id);
      const sourceUrl = sourceUrlFor(row);
      const sourceRecordId = sourceRecordIdFor(row, spec, date);
      const sourceDateKey = `${pldId}\u0000${spec.field}\u0000${date}`;
      const titleDateKey = `${`PLD ${spec.titleNoun} recorded for ${addressFor(row)}`.toLowerCase()}\u0000${date}`;

      let rejectReason = "";
      if (!date || date < START_DATE || date > END_DATE) rejectReason = "missing_or_outside_date_window";
      else if (!point || !inLondon(point)) rejectReason = "missing_or_outside_london_geometry";
      else if (keys.pldFieldDateKeys.has(sourceDateKey)) rejectReason = "existing_manual_or_prior_field_date_key";
      else if (keys.sourceUrls.has(sourceUrl)) rejectReason = "existing_manual_or_prior_source_url_key";
      else if (keys.sourceRecordIds.has(sourceRecordId)) rejectReason = "existing_manual_or_prior_source_record_id_key";
      else if (keys.titleDateKeys.has(titleDateKey)) rejectReason = "existing_manual_or_prior_title_date_key";
      else if (inBatchPldIds.has(pldId)) rejectReason = "duplicate_pld_row_inside_round";
      else if (inBatchSourceDateKeys.has(sourceDateKey)) rejectReason = "duplicate_source_date_inside_round";
      else if (isLowValueAdmin(row)) rejectReason = "low_value_admin_or_minor_application_type";
      else if (selectionScore < MIN_SCORE) rejectReason = "below_architecture_city_change_signal_threshold";

      if (rejectReason) {
        if (rejected.length < 1500) rejected.push(rejectionFor(rejectReason, row, spec, date, selectionScore));
        continue;
      }

      scored.push({ row, spec, date, point, selectionScore });
      inBatchPldIds.add(pldId);
      inBatchSourceDateKeys.add(sourceDateKey);
    }
    scored.sort(
      (a, b) =>
        b.selectionScore - a.selectionScore ||
        b.date.localeCompare(a.date) ||
        String(a.row.id).localeCompare(String(b.row.id)),
    );
    for (const item of scored) {
      if (candidates.length >= TARGET_COUNT) break;
      candidates.push(candidateFor(item.row, item.spec, item.date, item.point, item.selectionScore));
    }
    if (candidates.length >= TARGET_COUNT) break;
  }

  candidates.sort(
    (a, b) =>
      a.effective_date.localeCompare(b.effective_date) ||
      a.source_date_field.localeCompare(b.source_date_field) ||
      a.event_id.localeCompare(b.event_id),
  );

  const validation = validateCandidates(candidates, keys, priorPacks.length);
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  const sourceAudit = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    sources: [
      {
        source_id: "gla-planning-datahub-applications",
        source_name: "Planning London Datahub applications",
        publisher: "Greater London Authority / Planning London Datahub and London planning authorities",
        source_url: LANDING_URL,
        api_endpoint: API_URL,
        source_type: "official planning application and lifecycle API",
        license_or_terms_note:
          "London Datastore page for Planning London Datahub applications lists Licence: Not Specified as checked on 2026-05-23.",
        update_frequency: "Daily, according to the London Datastore source page.",
        coverage_years: `${dates[0] || START_DATE} through ${dates[dates.length - 1] || END_DATE} selected in this round; source inventory records broader PLD coverage from 2004 onward.`,
        geographic_scope: "Greater London planning authorities represented in Planning London Datahub.",
        key_fields_used: FIELDS,
        reliability_assessment: "usable with caveats",
        required_caveats:
          "PLD lifecycle fields are administrative/source-reported planning-feed fields and do not by themselves evidence physical construction start, construction completion, opening, occupation, current use, final built form, design quality, outcomes, or causation.",
        ingestion_recommendation:
          "Use selected rows as documented administrative planning lifecycle milestones with source row URL, LPA reference, lifecycle date field, attribution, geometry caveat, and licence caveat visible.",
      },
    ],
  };
  const pack = {
    schema_version: `${ROUND_NAME}.candidates.v1`,
    worker: ROUND_NAME,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    source_url: LANDING_URL,
    source_api_url: API_URL,
    target_count: TARGET_COUNT,
    candidate_count: candidates.length,
    date_window: { start: START_DATE, end: END_DATE },
    query_stats: queryStats,
    min_score: MIN_SCORE,
    prior_pack_count_scanned: priorPacks.length,
    candidates,
  };
  const rejectionSummary = rejected.reduce((acc, item) => {
    acc[item.reason] = (acc[item.reason] || 0) + 1;
    return acc;
  }, {});
  const rejectedDoc = {
    schema_version: `${ROUND_NAME}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    sample_limit: 1500,
    sample_count: rejected.length,
    rejection_summary: rejectionSummary,
    samples: rejected,
  };
  const summary = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
    candidate_count: candidates.length,
    target_count: TARGET_COUNT,
    min_score: MIN_SCORE,
    query_stats: queryStats,
    date_range: validation.date_range,
    lifecycle_field_mix: validation.lifecycle_field_mix,
    prior_pack_count_scanned: priorPacks.length,
    prior_packs_scanned: priorPacks,
    validation_ok: validation.ok,
    rejection_summary: rejectionSummary,
    first_candidate: candidates[0]?.source_record_id || null,
    last_candidate: candidates[candidates.length - 1]?.source_record_id || null,
  };
  const notes = [
    `# Round ${ROUND} London PLD lifecycle ${NEXT} candidates`,
    "",
    `Generated ${candidates.length} candidates from official Planning London Datahub application rows accessed on ${ACCESSED_AT}.`,
    "",
    `This round queries only \`actual_commencement_date\` and \`actual_completion_date\` values from \`${START_DATE}\` through \`${END_DATE}\`. It does not use approval-only rows, previous-permission lifecycle fields, future-dated lifecycle values, or inferred delivery dates.`,
    "",
    "Deduplication scanned the live manual architecture corpus plus prior London PLD lifecycle scratch packs by PLD row id, source URL/source record/date-field/date, source date field/date, and title/date.",
    "",
    "Every candidate keeps the PLD row id, LPA reference, official source row URL, API query, lifecycle date field, source geometry fields, borough/publisher, access date, attribution, confidence, limitations, and transformation notes.",
    "",
    "Use these as source-reported administrative planning lifecycle milestones only. Treat construction start, construction completion, opening, occupation, current use, design quality, service-result statements, delivery of a wider masterplan, and final built form as requiring separate source evidence.",
    "",
    "The London Datastore applications page was checked on 2026-05-23 and listed daily update frequency with Licence: Not Specified, so redistribution terms need review before promoting this scratch pack into a public data release.",
    "",
  ].join("\n");

  writeJson(path.join(OUT_DIR, "candidates.json"), pack);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "validation.json"), validation);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validation);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedDoc);
  writeText(path.join(OUT_DIR, "notes.md"), notes);

  console.log(
    JSON.stringify(
      {
        outDir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        candidates: candidates.length,
        dateRange: validation.date_range,
        lifecycleFieldMix: validation.lifecycle_field_mix,
        validationOk: validation.ok,
      },
      null,
      2,
    ),
  );
  if (!validation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
