const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2020-01-01";
const END_DATE = ACCESSED_AT;
const TARGET_COUNT = 90;
const MIN_SCORE = 24;
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round150_london_pld_lifecycle_next2");
const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const PRIOR_PACKS = [
  {
    label: "round126_london_pld_lifecycle_direct",
    file: path.join(ROOT, "tmp", "subagents", "round126_london_pld_lifecycle_direct", "candidates.json")
  },
  {
    label: "round126_london_pld_lifecycle_more",
    file: path.join(ROOT, "tmp", "subagents", "round126_london_pld_lifecycle_more", "candidates.json")
  },
  {
    label: "round140_london_pld_lifecycle_more",
    file: path.join(ROOT, "tmp", "subagents", "round140_london_pld_lifecycle_more", "candidates.json")
  },
  {
    label: "round147_london_pld_lifecycle_next",
    file: path.join(ROOT, "tmp", "subagents", "round147_london_pld_lifecycle_next", "candidates.json")
  }
];

const API_ENDPOINT = "https://planningdata.london.gov.uk/api-guest/applications/_search";
const SOURCE_URL_PREFIX = "https://planningdata.london.gov.uk/api-guest/applications/_source/";
const DATASET_PAGE_URL = "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/";

const LONDON_ENVELOPE = {
  minLon: -0.5103,
  maxLon: 0.334,
  minLat: 51.2868,
  maxLat: 51.6919
};

const SOURCE_FIELDS = [
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
  "status",
  "decision",
  "decision_date",
  "application_type_full",
  "url_planning_app",
  "centroid",
  "wgs84_polygon",
  "actual_commencement_date",
  "actual_completion_date",
  "application_details.scheme_name",
  "application_details.site_area",
  "application_details.total_gia_gained",
  "application_details.total_gia_lost",
  "application_details.projected_cost_of_works",
  "application_details.residential_details.total_no_proposed_residential_units"
];

const LIFECYCLE_SPECS = [
  {
    field: "actual_completion_date",
    kind: "completion",
    titleLabel: "completion date",
    observedChange:
      "Planning London Datahub records an actual completion date for this planning application row; this is an administrative lifecycle field, not evidence of opening, occupation, final built form, or outcomes.",
    sourceDateField: "PLD actual_completion_date",
    dateMeaning: "administrative actual completion date field"
  },
  {
    field: "actual_commencement_date",
    kind: "commencement",
    titleLabel: "commencement date",
    observedChange:
      "Planning London Datahub records an actual commencement date for this planning application row; this is an administrative lifecycle field, not evidence of opening, occupation, final built form, or outcomes.",
    sourceDateField: "PLD actual_commencement_date",
    dateMeaning: "administrative actual commencement date field"
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceTrim(value, limit = 380) {
  const text = cleanText(value);
  if (text.length <= limit) return text;
  const cut = text
    .slice(0, limit - 1)
    .split(" ")
    .slice(0, -1)
    .join(" ")
    .replace(/[,:;.-]+$/, "");
  return `${cut}...`;
}

function slugify(value, limit = 90) {
  return (
    cleanText(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_{2,}/g, "_")
      .toLowerCase()
      .slice(0, limit)
      .replace(/_+$/g, "") || "planning_row"
  );
}

function hash8(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 8);
}

function isoFromPldDate(value) {
  const text = cleanText(value);
  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return "";
}

function pldRangeDate(value) {
  const iso = isoFromPldDate(value);
  if (!iso) throw new Error(`Invalid configured date: ${value}`);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function inDateWindow(value) {
  return value >= START_DATE && value <= END_DATE;
}

function pldSourceUrl(rowId) {
  return `${SOURCE_URL_PREFIX}${encodeURIComponent(rowId)}`;
}

function normalizePldId(value) {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(value || ""));
    } catch {
      return String(value || "");
    }
  })();
  return decoded
    .replace(/^PLD:/i, "")
    .replace(/^applications\/_source\//i, "")
    .replace(/^.*\/api-guest\/applications\/_source\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/\//g, "_")
    .trim()
    .toUpperCase();
}

function collectPldIdsFromText(value) {
  const text = String(value || "");
  const ids = [];
  for (const match of text.matchAll(/PLD:([^;\s]+)/gi)) ids.push(normalizePldId(match[1]));
  for (const match of text.matchAll(/applications\/_source\/([^?#\s"'<>]+)/gi)) {
    ids.push(normalizePldId(match[1]));
  }
  return ids.filter(Boolean);
}

function dateFromCandidate(candidate) {
  return candidate.effective_date || candidate.date || candidate.event_date || "";
}

function loadPriorCandidates(file) {
  if (!fs.existsSync(file)) return [];
  const data = readJson(file);
  return Array.isArray(data) ? data : data.candidates || data.events || [];
}

function buildDuplicateIndex() {
  const index = {
    manualPldIds: new Set(),
    priorPldIdsByPack: new Map(),
    priorFieldKeys: new Set(),
    sourceKeys: new Set(),
    titleDateKeys: new Set(),
    counts: {
      manual_events_scanned: 0,
      manual_pld_ids: 0,
      prior_packs: []
    }
  };

  const corpus = readJson(CORPUS_PATH);
  for (const event of corpus.events || []) {
    index.counts.manual_events_scanned += 1;
    const date = event.effective_date || event.date || "";
    const title = cleanText(event.title).toLowerCase();
    if (title && date) index.titleDateKeys.add(`london|${title}|${date}`);
    if (event.source_url || event.source_record_id) {
      index.sourceKeys.add(`london|${event.source_url || ""}|${event.source_record_id || ""}`.toLowerCase());
    }
    const text = [
      event.source_record_id,
      event.source_url,
      event.source_urls,
      event.title,
      event.summary
    ]
      .flat()
      .filter(Boolean)
      .join(" ");
    for (const id of collectPldIdsFromText(text)) index.manualPldIds.add(id);
  }
  index.counts.manual_pld_ids = index.manualPldIds.size;

  for (const prior of PRIOR_PACKS) {
    const rows = loadPriorCandidates(prior.file);
    const idsForPack = new Set();
    for (const candidate of rows) {
      const sourceText = [
        candidate.pld_id,
        candidate.source_record_id,
        candidate.source_url,
        candidate.row_url,
        candidate.title,
        candidate.summary
      ]
        .filter(Boolean)
        .join(" ");
      const ids = collectPldIdsFromText(sourceText);
      if (candidate.pld_id) ids.push(normalizePldId(candidate.pld_id));
      for (const id of ids) {
        idsForPack.add(id);
        const field = cleanText(candidate.source_lifecycle_field || candidate.source_date_field)
          .replace(/^PLD\s+/i, "")
          .toLowerCase();
        const date = dateFromCandidate(candidate);
        if (field && date) index.priorFieldKeys.add(`${id}|${field}|${date}`);
      }
      const title = cleanText(candidate.title).toLowerCase();
      const date = dateFromCandidate(candidate);
      if (title && date) index.titleDateKeys.add(`london|${title}|${date}`);
      if (candidate.source_url || candidate.source_record_id) {
        index.sourceKeys.add(`london|${candidate.source_url || ""}|${candidate.source_record_id || ""}`.toLowerCase());
      }
    }
    index.priorPldIdsByPack.set(prior.label, idsForPack);
    index.counts.prior_packs.push({
      label: prior.label,
      path: path.relative(ROOT, prior.file).replace(/\\/g, "/"),
      exists: fs.existsSync(prior.file),
      candidates_scanned: rows.length,
      pld_ids: idsForPack.size
    });
  }

  return index;
}

function numberFrom(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function nestedApplicationDetails(row) {
  return row.application_details || {};
}

function totalGiaGained(row) {
  return numberFrom(nestedApplicationDetails(row).total_gia_gained);
}

function totalGiaLost(row) {
  return Math.abs(numberFrom(nestedApplicationDetails(row).total_gia_lost));
}

function proposedUnits(row) {
  return numberFrom(nestedApplicationDetails(row).residential_details?.total_no_proposed_residential_units);
}

function siteArea(row) {
  return numberFrom(nestedApplicationDetails(row).site_area);
}

function costOfWorks(row) {
  return numberFrom(nestedApplicationDetails(row).projected_cost_of_works);
}

function pointFor(row) {
  const centroid = row.centroid || {};
  const lon = Number(centroid.lon);
  const lat = Number(centroid.lat);
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    return {
      lon,
      lat,
      source: "PLD centroid",
      precision: "Row-level PLD centroid; not a surveyed building footprint."
    };
  }

  const coordinates = [];
  function visit(value) {
    if (!value) return;
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1]))
    ) {
      coordinates.push({ lon: Number(value[0]), lat: Number(value[1]) });
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  }
  visit(row.wgs84_polygon?.coordinates);

  const usable = coordinates.filter((point) => Number.isFinite(point.lon) && Number.isFinite(point.lat));
  if (!usable.length) return null;
  return {
    lon: usable.reduce((sum, point) => sum + point.lon, 0) / usable.length,
    lat: usable.reduce((sum, point) => sum + point.lat, 0) / usable.length,
    source: "Representative point computed from PLD wgs84_polygon coordinates",
    precision: "Representative point from supplied site polygon; not a measured building footprint or statutory boundary."
  };
}

function inLondon(point) {
  return (
    Boolean(point) &&
    point.lon >= LONDON_ENVELOPE.minLon &&
    point.lon <= LONDON_ENVELOPE.maxLon &&
    point.lat >= LONDON_ENVELOPE.minLat &&
    point.lat <= LONDON_ENVELOPE.maxLat
  );
}

function addressPart(value) {
  return cleanText(value).replace(/[,\s]+$/g, "");
}

function normalizedAddressPart(value) {
  return addressPart(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function addressFor(row) {
  const siteName = addressPart(row.site_name);
  const streetLine = addressPart([row.site_number, row.street_name].filter(Boolean).join(" "));
  const siteKey = normalizedAddressPart(siteName);
  const streetKey = normalizedAddressPart(streetLine);
  const parts = [];

  if (siteName && (!streetKey || !streetKey.startsWith(siteKey))) parts.push(siteName);
  if (streetLine && (!siteKey || !siteKey.startsWith(streetKey))) parts.push(streetLine);
  for (const part of [row.secondary_street_name, row.locality, row.postcode].map(addressPart).filter(Boolean)) {
    const key = normalizedAddressPart(part);
    if (!parts.some((existing) => normalizedAddressPart(existing) === key)) parts.push(part);
  }

  return parts.join(", ") || cleanText(row.lpa_app_no) || cleanText(row.id);
}

function searchableText(row) {
  return [
    row.site_name,
    row.description,
    row.application_details?.scheme_name,
    row.application_type_full,
    row.street_name,
    row.locality,
    row.postcode,
    row.lpa_name,
    row.borough
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function score(row, spec, date, point) {
  const text = searchableText(row);
  let value = 0;

  const positiveSignals = [
    [/school|academy|college|university|campus|student|education/, 34],
    [/hospital|health|clinic|medical|nhs|care home|surgery|healthcare/, 34],
    [/library|museum|gallery|theatre|cinema|cultural|arts|archive|heritage|listed building/, 32],
    [/town hall|civic|community centre|community hub|leisure centre|sports centre|market|public house/, 30],
    [/estate regeneration|regeneration|masterplan|comprehensive redevelopment|public realm|town centre/, 28],
    [/station|transport|bridge|interchange|public square|park|high street/, 24],
    [/mixed use|hotel|office|commercial|workspace|retail|industrial|warehouse/, 12],
    [/affordable housing|social rent|council homes|housing estate|extra care/, 10]
  ];
  for (const [regex, points] of positiveSignals) {
    if (regex.test(text)) value += points;
  }

  const gia = totalGiaGained(row);
  const lost = totalGiaLost(row);
  const units = proposedUnits(row);
  const area = siteArea(row);
  const cost = costOfWorks(row);

  if (gia >= 50000) value += 52;
  else if (gia >= 25000) value += 44;
  else if (gia >= 10000) value += 34;
  else if (gia >= 2500) value += 20;
  else if (gia >= 750) value += 10;

  if (lost >= 10000) value += 18;
  else if (lost >= 3000) value += 10;

  if (units >= 500) value += 40;
  else if (units >= 250) value += 30;
  else if (units >= 100) value += 22;
  else if (units >= 25) value += 10;

  if (area >= 2) value += 12;
  else if (area >= 0.5) value += 7;
  if (cost >= 50000000) value += 16;
  else if (cost >= 10000000) value += 10;

  if (point?.source === "PLD centroid") value += 4;
  if (String(row.status || "").toLowerCase().includes("completed") && spec.kind === "completion") value += 10;
  if (String(row.decision || "").toLowerCase().includes("approved")) value += 4;

  if (
    /householder|advert|advertisement|tree works|tree preservation|lawful development|certificate of lawfulness|telecom|telecommunications|non-material amendment|discharge of condition|approval of details|details pursuant|variation of condition/i.test(
      row.application_type_full || ""
    )
  ) {
    value -= 40;
  }
  if (
    /certificate of lawfulness|existing use|advertisement|tree works|non-material amendment|discharge of condition|approval of details|details pursuant to condition|telecom|telecommunications|satellite dish/i.test(
      row.description || ""
    )
  ) {
    value -= 40;
  }
  if (
    /single family dwelling|rear extension|roof extension|loft conversion|dormer|outbuilding|garden room|boundary wall|window replacement/i.test(
      row.description || ""
    )
  ) {
    value -= 12;
  }

  const year = Number(date.slice(0, 4));
  value += Math.max(0, year - 2019) * 0.7;
  return value;
}

async function fetchRowsForSpec(spec) {
  const rows = [];
  const seen = new Set();
  let searchAfter = null;
  const pageSize = 500;
  const queryRange = {
    gte: pldRangeDate(START_DATE),
    lte: pldRangeDate(END_DATE)
  };

  for (let page = 0; page < 90; page += 1) {
    const body = {
      size: pageSize,
      _source: SOURCE_FIELDS,
      sort: [
        { [spec.field]: { order: "asc", missing: "_last" } },
        { _id: { order: "asc" } }
      ],
      query: {
        bool: {
          filter: [
            { exists: { field: spec.field } },
            { range: { [spec.field]: queryRange } }
          ]
        }
      }
    };
    if (searchAfter) body.search_after = searchAfter;

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Bims5Round150PldLifecycleNext2/0.1"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`${spec.field} page ${page}: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    const hits = data.hits?.hits || [];
    for (const hit of hits) {
      const row = { ...(hit._source || {}), id: hit._source?.id || hit._id };
      const key = normalizePldId(row.id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
    if (!hits.length || hits.length < pageSize) break;
    searchAfter = hits[hits.length - 1].sort;
    console.log(`${spec.field}: fetched ${rows.length}`);
  }
  return rows;
}

function candidateFor(item) {
  const { row, spec, date, point, scoreValue } = item;
  const address = addressFor(row);
  const rowId = cleanText(row.id);
  const pldId = normalizePldId(rowId);
  const sourceUrl = pldSourceUrl(rowId);
  const lpaReference = cleanText(row.lpa_app_no) || "not supplied";
  const gia = totalGiaGained(row);
  const lost = totalGiaLost(row);
  const units = proposedUnits(row);
  const area = siteArea(row);
  const cost = costOfWorks(row);
  const metrics = [
    gia ? `${gia} sqm GIA gained` : "",
    lost ? `${lost} sqm GIA lost` : "",
    units ? `${units} proposed residential units` : "",
    area ? `${area} ha site area` : "",
    cost ? `GBP ${cost} projected cost of works` : ""
  ].filter(Boolean);
  const metricText = metrics.length ? ` Source metrics include ${metrics.join("; ")}.` : "";
  const title = `PLD ${spec.titleLabel} recorded for ${address}`;
  const sourceRecordId = `PLD:${rowId}; LPA:${lpaReference}`;
  const candidateId = `round150_lon_pld_${spec.kind}_${slugify(rowId)}_${date.replace(/-/g, "_")}_${hash8(
    `${rowId}|${spec.field}|${date}`
  )}`;
  const geometry = {
    type: "Point",
    coordinates: [Number(point.lon.toFixed(6)), Number(point.lat.toFixed(6))]
  };
  const apiQuery =
    `${API_ENDPOINT} with exists/range filter on ${spec.field} between ${START_DATE} and ${END_DATE}; ` +
    `sorted by ${spec.field} then _id with search_after pagination.`;

  return {
    city_id: "london",
    candidate_id: candidateId,
    title,
    summary: `Planning London Datahub records ${spec.dateMeaning} ${date} for ${lpaReference} at ${address}. The row describes: ${sentenceTrim(
      row.description
    )}${metricText}`,
    observed_change: spec.observedChange,
    date,
    effective_date: date,
    effective_date_range: null,
    date_precision: "day",
    pld_id: pldId,
    lpa_reference: lpaReference,
    source_id: "gla-planning-datahub-applications",
    source_ids: ["gla-planning-datahub-applications", "london-planning-datahub-api/core"],
    source_name: "Planning London Datahub applications",
    publisher: `Greater London Authority / ${cleanText(row.lpa_name || row.borough) || "London planning authorities"}`,
    borough: cleanText(row.borough || row.lpa_name),
    source_url: sourceUrl,
    row_url: sourceUrl,
    api_url: API_ENDPOINT,
    api_endpoint: API_ENDPOINT,
    api_query: apiQuery,
    source_api_query: {
      endpoint: API_ENDPOINT,
      method: "POST",
      range_field: spec.field,
      range: {
        gte: START_DATE,
        lte: END_DATE,
        submitted_to_api_as: {
          gte: pldRangeDate(START_DATE),
          lte: pldRangeDate(END_DATE)
        }
      },
      sort: [spec.field, "_id"],
      source_fields: SOURCE_FIELDS
    },
    source_record_id: sourceRecordId,
    source_type: "official Planning London Datahub application API record",
    accessed_at: ACCESSED_AT,
    source_date_field: spec.sourceDateField,
    source_lifecycle_field: spec.field,
    source_lifecycle_date: date,
    source_lifecycle_date_value: cleanText(row[spec.field]),
    raw_lifecycle_dates: {
      actual_commencement_date: cleanText(row.actual_commencement_date),
      actual_completion_date: cleanText(row.actual_completion_date)
    },
    latitude: geometry.coordinates[1],
    longitude: geometry.coordinates[0],
    geometry,
    geometry_source: `${point.source}; PLD source row ${sourceUrl}.`,
    geometry_precision: point.precision,
    source_geometry: {
      centroid: row.centroid || null,
      wgs84_polygon: row.wgs84_polygon || null
    },
    license_or_terms_note:
      "London Datastore Planning London Datahub applications page lists Licence: Not Specified as checked on 2026-05-19; this candidate pack retains factual row metadata, official row/API URLs, attribution, and retrieval date, and terms should be reviewed before redistribution.",
    attribution:
      "Contains Planning London Datahub application information supplied by the Greater London Authority and London planning authorities.",
    confidence: "documented",
    project_type: `${spec.kind} lifecycle planning record`,
    planning_status: cleanText(row.status),
    decision: cleanText(row.decision),
    application_type_full: cleanText(row.application_type_full),
    site_name: cleanText(row.site_name),
    description: sentenceTrim(row.description, 500),
    source_fields: {
      id: rowId,
      pld_id: pldId,
      lpa_app_no: lpaReference,
      lpa_name: cleanText(row.lpa_name),
      borough: cleanText(row.borough),
      site_name: cleanText(row.site_name),
      decision: cleanText(row.decision),
      decision_date: cleanText(row.decision_date),
      status: cleanText(row.status),
      actual_commencement_date: cleanText(row.actual_commencement_date),
      actual_completion_date: cleanText(row.actual_completion_date),
      application_type_full: cleanText(row.application_type_full),
      url_planning_app: cleanText(row.url_planning_app),
      scheme_name: cleanText(row.application_details?.scheme_name),
      site_area: area || null,
      total_gia_gained: gia || null,
      total_gia_lost: lost || null,
      projected_cost_of_works: cost || null,
      total_no_proposed_residential_units: units || null
    },
    selection_score: Number(scoreValue.toFixed(2)),
    duplicate_check_note:
      "Screened against the live manual architecture corpus and prior London PLD lifecycle packs through round147 by PLD row id, source URL/source_record_id, source-date-field/date, and title/date.",
    limitations: [
      "PLD actual_commencement_date and actual_completion_date are administrative lifecycle fields from borough planning feeds and may be unevenly populated or interpreted across authorities.",
      "This row is not evidence of opening, occupation, current use, service outcomes, design quality, causation, or final built form.",
      "Do not infer delivery of a wider masterplan or proposal outcome from this lifecycle row alone.",
      "Geometry is a PLD point or polygon-derived representative point for atlas navigation and may not be the precise building footprint or phase boundary.",
      "The London Datastore licence entry for the applications source is Not Specified; keep attribution/source URLs and review terms before redistributing source data at bulk scale."
    ],
    transformation_method:
      "scripts/fetch_round150_london_pld_lifecycle_next2_candidates.js queried the official Planning London Datahub guest applications API for actual_commencement_date and actual_completion_date rows, normalized source dates, filtered to the London coordinate envelope and 2020-2026 access window, scored architecture/city-change signals, and removed rows already present in the live manual architecture corpus or prior PLD lifecycle packs through round147."
  };
}

function rejectWith(rejections, reason) {
  rejections[reason] = (rejections[reason] || 0) + 1;
  return true;
}

function priorPackLabelFor(rowId, duplicateIndex) {
  for (const [label, ids] of duplicateIndex.priorPldIdsByPack.entries()) {
    if (ids.has(rowId)) return label;
  }
  return "";
}

function shouldReject(row, spec, date, point, duplicateIndex, batchKeys, scoreValue, rejections) {
  const rowId = normalizePldId(row.id);
  const sourceUrl = pldSourceUrl(cleanText(row.id));
  const sourceRecordId = `PLD:${cleanText(row.id)}; LPA:${cleanText(row.lpa_app_no) || "not supplied"}`;
  const titleDate = `london|${cleanText(`PLD ${spec.titleLabel} recorded for ${addressFor(row)}`).toLowerCase()}|${date}`;
  const sourceKey = `london|${sourceUrl}|${sourceRecordId}`.toLowerCase();
  const fieldKey = `${rowId}|${spec.field.toLowerCase()}|${date}`;
  const rowKindKey = `${rowId}|${spec.kind}`;
  const lowValueAdminText = `${row.application_type_full || ""} ${row.description || ""}`;

  if (!rowId) return rejectWith(rejections, "missing_pld_row_id");
  if (!date || !inDateWindow(date)) return rejectWith(rejections, "missing_or_out_of_window_lifecycle_date");
  if (!inLondon(point)) return rejectWith(rejections, "missing_or_outside_london_geometry");
  if (duplicateIndex.manualPldIds.has(rowId)) return rejectWith(rejections, "existing_manual_corpus_pld_id");
  const priorPack = priorPackLabelFor(rowId, duplicateIndex);
  if (priorPack) return rejectWith(rejections, `existing_${priorPack}_pld_id`);
  if (duplicateIndex.priorFieldKeys.has(fieldKey)) return rejectWith(rejections, "existing_prior_field_date_key");
  if (duplicateIndex.sourceKeys.has(sourceKey)) return rejectWith(rejections, "existing_source_url_record_key");
  if (duplicateIndex.titleDateKeys.has(titleDate)) return rejectWith(rejections, "existing_title_date_key");
  if (batchKeys.has(rowKindKey)) return rejectWith(rejections, "duplicate_row_kind_inside_round150_batch");
  if (
    /householder|advertisement|tree works|lawful development|certificate of lawfulness|telecommunications|non-material amendment|discharge of condition|approval of details|details pursuant to condition/i.test(
      lowValueAdminText
    )
  ) {
    return rejectWith(rejections, "low_value_admin_or_minor_application_type");
  }
  if (scoreValue < MIN_SCORE) return rejectWith(rejections, "below_architecture_city_change_signal_threshold");
  return false;
}

function validateCandidates(pack, duplicateIndex) {
  const candidates = pack.candidates || [];
  if (!candidates.length) throw new Error("No candidates written.");
  const candidateIds = new Set();
  const sourceKeys = new Set();
  for (const candidate of candidates) {
    const required = [
      "candidate_id",
      "city_id",
      "title",
      "summary",
      "observed_change",
      "effective_date",
      "pld_id",
      "lpa_reference",
      "source_url",
      "row_url",
      "api_query",
      "source_record_id",
      "borough",
      "publisher",
      "source_lifecycle_field",
      "source_lifecycle_date",
      "source_lifecycle_date_value",
      "geometry",
      "geometry_source",
      "license_or_terms_note",
      "accessed_at",
      "confidence",
      "limitations"
    ];
    for (const field of required) {
      if (!candidate[field] || (Array.isArray(candidate[field]) && !candidate[field].length)) {
        throw new Error(`Missing required field ${field} on ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (!["actual_commencement_date", "actual_completion_date"].includes(candidate.source_lifecycle_field)) {
      throw new Error(`Unexpected lifecycle field ${candidate.source_lifecycle_field}`);
    }
    if (!inDateWindow(candidate.effective_date)) {
      throw new Error(`Out-of-window candidate ${candidate.candidate_id}: ${candidate.effective_date}`);
    }
    if (candidate.source_lifecycle_date !== candidate.effective_date) {
      throw new Error(`Lifecycle date mismatch for ${candidate.candidate_id}`);
    }
    if (!candidate.source_record_id.includes("PLD:")) {
      throw new Error(`Missing PLD row id in source_record_id for ${candidate.candidate_id}`);
    }
    if (candidate.confidence !== "documented") {
      throw new Error(`Unexpected confidence on ${candidate.candidate_id}: ${candidate.confidence}`);
    }
    const caveatText = candidate.limitations.join(" ").toLowerCase();
    for (const term of ["opening", "occupation", "final built form"]) {
      if (!caveatText.includes(term)) {
        throw new Error(`Missing required lifecycle caveat "${term}" on ${candidate.candidate_id}`);
      }
    }
    if (duplicateIndex.manualPldIds.has(candidate.pld_id)) {
      throw new Error(`Candidate duplicates manual corpus PLD id: ${candidate.pld_id}`);
    }
    const priorPack = priorPackLabelFor(candidate.pld_id, duplicateIndex);
    if (priorPack) {
      throw new Error(`Candidate duplicates prior ${priorPack} PLD id: ${candidate.pld_id}`);
    }
    if (candidateIds.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    const sourceKey = `${candidate.source_url}|${candidate.source_record_id}|${candidate.source_lifecycle_field}`;
    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source key: ${sourceKey}`);
    sourceKeys.add(sourceKey);
  }
}

async function main() {
  ensureDir(OUT_DIR);
  const duplicateIndex = buildDuplicateIndex();
  const rejections = {};
  const queryStats = [];
  const pool = [];

  for (const spec of LIFECYCLE_SPECS) {
    const rows = await fetchRowsForSpec(spec);
    queryStats.push({ field: spec.field, kind: spec.kind, fetched: rows.length });
    for (const row of rows) {
      const date = isoFromPldDate(row[spec.field]);
      const point = pointFor(row);
      const scoreValue = score(row, spec, date, point);
      pool.push({ row, spec, date, point, scoreValue });
    }
  }

  pool.sort(
    (left, right) =>
      right.scoreValue - left.scoreValue ||
      right.date.localeCompare(left.date) ||
      normalizePldId(left.row.id).localeCompare(normalizePldId(right.row.id)) ||
      left.spec.kind.localeCompare(right.spec.kind)
  );

  const batchKeys = new Set();
  const selected = [];
  let evaluatedUntilTarget = 0;
  for (const item of pool) {
    evaluatedUntilTarget += 1;
    if (
      shouldReject(
        item.row,
        item.spec,
        item.date,
        item.point,
        duplicateIndex,
        batchKeys,
        item.scoreValue,
        rejections
      )
    ) {
      continue;
    }
    batchKeys.add(`${normalizePldId(item.row.id)}|${item.spec.kind}`);
    selected.push(candidateFor(item));
    if (selected.length >= TARGET_COUNT) break;
  }

  selected.sort(
    (left, right) =>
      left.effective_date.localeCompare(right.effective_date) ||
      left.source_record_id.localeCompare(right.source_record_id) ||
      left.source_lifecycle_field.localeCompare(right.source_lifecycle_field)
  );

  const candidatesPack = {
    schema_version: "round150.london_pld_lifecycle_next2.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    task:
      "Round150 London Planning Datahub actual lifecycle candidate pack beyond current manual corpus and prior PLD packs through round147",
    candidate_count: selected.length,
    candidates: selected
  };

  const sourceAudit = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    task: "round150_london_pld_lifecycle_next2",
    source_audits: [
      {
        source_id: "gla-planning-datahub-applications",
        source_name: "Planning London Datahub applications",
        publisher: "Greater London Authority / London planning authorities",
        source_url: DATASET_PAGE_URL,
        api_endpoint: API_ENDPOINT,
        source_type: "official planning application and lifecycle API",
        license_or_terms_note:
          "London Datastore dataset page lists Licence: Not Specified as checked on 2026-05-19. This scratch pack keeps factual row metadata, official row/API URLs, normalized coordinates, attribution, and retrieval date only. Review terms before bulk redistribution.",
        coverage_years: `Rows queried where actual_commencement_date or actual_completion_date falls from ${START_DATE} through ${END_DATE}.`,
        update_frequency: "Daily according to the London Datastore dataset page checked on 2026-05-19.",
        geographic_scope:
          "Greater London planning authorities represented in the PLD guest applications API, filtered to a Greater London coordinate envelope.",
        granularity:
          "Application-row lifecycle dates with source row id, LPA reference, centroid or polygon-derived representative point.",
        key_fields_used: SOURCE_FIELDS,
        reliability_assessment: "usable with caveats",
        required_caveats: [
          "actual_commencement_date and actual_completion_date are administrative feed fields, not independent evidence of opening, occupation, current use, final built form, design quality, outcomes, or causation.",
          "Feed completeness, date semantics, and geometry availability vary by borough system.",
          "Coordinates support atlas navigation only; use source planning documents for site or phase boundaries.",
          "Licence for the applications dataset is Not Specified, so downstream use should preserve attribution and source links and avoid bulk reproduction without terms review."
        ],
        ingestion_recommendation:
          "Use selected rows as documented planning lifecycle milestones only, with inline limitations and no claims about delivery outcomes."
      },
      {
        source_id: "london-planning-datahub-api/core",
        source_name: "Planning London Datahub guest applications API",
        publisher: "Greater London Authority",
        source_url: "https://planningdata.london.gov.uk/",
        api_endpoint: API_ENDPOINT,
        source_type: "official API access path for Planning London Datahub application rows",
        license_or_terms_note:
          "Same terms caveat as the GLA applications dataset; retain official row ids and URLs.",
        coverage_years: `Queried ${START_DATE} through ${END_DATE} actual lifecycle fields.`,
        reliability_assessment: "usable with caveats",
        ingestion_recommendation:
          "Use as source-row retrieval/provenance URL, not as a standalone claim source without the row fields."
      }
    ]
  };

  const summary = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
    candidate_count: selected.length,
    target_count: TARGET_COUNT,
    min_score: MIN_SCORE,
    query_stats: queryStats,
    candidate_pool_after_fetch: pool.length,
    evaluated_until_target_reached: evaluatedUntilTarget,
    accepted_until_target_reached: selected.length,
    rejection_summary: rejections,
    duplicate_index: duplicateIndex.counts,
    dedupe_basis:
      "Live data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json plus round126_london_pld_lifecycle_direct, round126_london_pld_lifecycle_more, round140_london_pld_lifecycle_more, and round147_london_pld_lifecycle_next candidates were scanned for PLD ids, source_record_id/source_url pairs, source-date-field/date keys, and title/date keys.",
    selected_by_lifecycle_field: selected.reduce((acc, candidate) => {
      acc[candidate.source_lifecycle_field] = (acc[candidate.source_lifecycle_field] || 0) + 1;
      return acc;
    }, {}),
    selected_by_borough: selected.reduce((acc, candidate) => {
      const borough = candidate.borough || "unknown";
      acc[borough] = (acc[borough] || 0) + 1;
      return acc;
    }, {}),
    selected_date_range: {
      min: selected[0]?.effective_date || null,
      max: selected[selected.length - 1]?.effective_date || null
    },
    caveats: [
      "Candidates are administrative lifecycle records, not claims that a building opened, became occupied, reached final built form, or produced an outcome.",
      "Rows with PLD ids already present in the live manual corpus or prior PLD lifecycle packs through round147 were excluded.",
      "London Datastore licence is Not Specified for this source, so the pack retains factual metadata and attribution only."
    ]
  };

  const notes = [
    "# Round 150 London PLD lifecycle next2 candidates",
    "",
    `Generated ${selected.length} candidates from official Planning London Datahub application rows accessed on ${ACCESSED_AT}.`,
    "",
    "This round only uses `actual_commencement_date` and `actual_completion_date` values from `2020-01-01` through `2026-05-19`. It does not use approval-only rows, previous-permission lifecycle fields, forecast dates, or inferred delivery dates.",
    "",
    "Deduplication scanned the live manual architecture corpus plus the prior round126 direct, round126 more, round140, and round147 London PLD lifecycle scratch packs by PLD row id, source URL/source record, source date field/date, and title/date.",
    "",
    "Every candidate keeps the PLD row id, LPA reference, official source row URL, API query, raw lifecycle date fields, source geometry fields, borough/publisher, access date, attribution, confidence, and limitations.",
    "",
    "Use these as planning lifecycle milestones only. Do not infer opening, occupation, current use, design quality, outcomes, causation, delivery of a wider masterplan, or final built form.",
    "",
    "The London Datastore applications page was checked on 2026-05-19 and listed daily update frequency with Licence: Not Specified, so redistribution terms need review before promoting this scratch pack into a public data release."
  ].join("\n");

  validateCandidates(candidatesPack, duplicateIndex);

  writeJson(path.join(OUT_DIR, "candidates.json"), candidatesPack);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notes}\n`);

  console.log(
    JSON.stringify(
      {
        written: selected.length,
        outDir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        queryStats,
        selectedByLifecycleField: summary.selected_by_lifecycle_field,
        selectedDateRange: summary.selected_date_range,
        rejectionSummary: rejections
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
