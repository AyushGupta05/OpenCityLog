const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROUND = "round196";
const ROUND_NAME = "round196_london_pld_lifecycle_next11";
const ACCESSED_AT = "2026-05-19";
const GENERATED_AT = "2026-05-19T00:00:00Z";
const START_DATE = "2008-01-01";
const END_DATE = ACCESSED_AT;
const TARGET_COUNT = 150;
const MIN_SCORE = 24;
const REJECTION_SAMPLE_LIMIT = 1200;
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_NAME);
const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const API_ENDPOINT = "https://planningdata.london.gov.uk/api-guest/applications/_search";
const SOURCE_URL_PREFIX = "https://planningdata.london.gov.uk/api-guest/applications/_source/";
const DATASET_PAGE_URL = "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/";

const EXPLICIT_PRIOR_PACKS = [
  "round126_london_pld_lifecycle_direct",
  "round126_london_pld_lifecycle_more",
  "round140_london_pld_lifecycle_more",
  "round147_london_pld_lifecycle_next",
  "round150_london_pld_lifecycle_next2",
  "round153_london_pld_lifecycle_next3",
  "round157_london_pld_lifecycle_next4",
  "round161_london_pld_lifecycle_next5",
  "round166_london_pld_lifecycle_next6",
  "round172_london_pld_lifecycle_next7",
  "round178_london_pld_lifecycle_next8",
  "round184_london_pld_lifecycle_next9",
  "round190_london_pld_lifecycle_next10"
];

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
      "Planning London Datahub records an actual completion date for this planning application row; this is a source-reported administrative lifecycle field, not proof of construction completion, opening, occupation, final built form, or outcomes.",
    sourceDateField: "PLD actual_completion_date",
    dateMeaning: "source-reported administrative actual completion date field"
  },
  {
    field: "actual_commencement_date",
    kind: "commencement",
    titleLabel: "commencement date",
    observedChange:
      "Planning London Datahub records an actual commencement date for this planning application row; this is a source-reported administrative lifecycle field, not proof of construction start, completion, opening, occupation, final built form, or outcomes.",
    sourceDateField: "PLD actual_commencement_date",
    dateMeaning: "source-reported administrative actual commencement date field"
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
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

function normalizeLifecycleField(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) return "";
  if (text.includes("actual_completion_date")) return "actual_completion_date";
  if (text.includes("actual_commencement_date")) return "actual_commencement_date";
  if (text.includes("date_building_work_started_under_previous_permission")) {
    return "date_building_work_started_under_previous_permission";
  }
  if (text.includes("date_building_work_completed_under_previous_permission")) {
    return "date_building_work_completed_under_previous_permission";
  }
  return text.replace(/^pld\s+/, "").replace(/^planning london datahub\s+/, "").trim();
}

function sourceFieldDateKey(pldId, field, date) {
  const normalizedPldId = normalizePldId(pldId);
  const normalizedField = normalizeLifecycleField(field);
  const normalizedDate = isoFromPldDate(date) || dateFromCandidate({ effective_date: date });
  if (!normalizedPldId || !normalizedField || !normalizedDate) return "";
  return `${normalizedPldId}|${normalizedField}|${normalizedDate}`;
}

function packSortValue(name) {
  const match = name.match(/^round(\d+)_/);
  return match ? Number(match[1]) : 999999;
}

function discoverPriorPacks() {
  const subagentsDir = path.join(ROOT, "tmp", "subagents");
  const names = new Set(EXPLICIT_PRIOR_PACKS);
  if (fs.existsSync(subagentsDir)) {
    for (const entry of fs.readdirSync(subagentsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (/^round\d+_london_pld_lifecycle/.test(entry.name) && entry.name !== ROUND_NAME) {
        names.add(entry.name);
      }
    }
  }
  const prior = [...names]
    .sort((left, right) => packSortValue(left) - packSortValue(right) || left.localeCompare(right))
    .map((name) => ({
      label: name,
      file: path.join(ROOT, "tmp", "subagents", name, "candidates.json")
    }));
  return prior;
}

function loadPriorCandidates(file) {
  if (!fs.existsSync(file)) return [];
  const data = readJson(file);
  return Array.isArray(data) ? data : data.candidates || data.events || [];
}

function textForPldExtraction(record) {
  return [
    record.pld_id,
    record.source_record_id,
    record.source_url,
    record.row_url,
    record.url,
    record.title,
    record.summary,
    record.source_fields?.id,
    record.source_fields?.pld_id,
    record.source_fields?.source_record_id
  ]
    .flat()
    .filter(Boolean)
    .join(" ");
}

function addRecordKeys(index, record, scope, packLabel = "") {
  const date = dateFromCandidate(record);
  const title = cleanText(record.title).toLowerCase();
  const field = normalizeLifecycleField(record.source_lifecycle_field || record.source_date_field);
  if (title && date) index.titleDateKeys.add(`london|${title}|${date}`);
  if (record.source_url || record.source_record_id) {
    index.sourceKeys.add(
      `london|${record.source_url || ""}|${record.source_record_id || ""}|${field}|${
        record.source_lifecycle_date || date
      }`.toLowerCase()
    );
  }

  const ids = collectPldIdsFromText(textForPldExtraction(record));
  if (record.pld_id) ids.push(normalizePldId(record.pld_id));
  if (record.source_fields?.id) ids.push(normalizePldId(record.source_fields.id));
  if (record.source_fields?.pld_id) ids.push(normalizePldId(record.source_fields.pld_id));

  for (const id of ids.filter(Boolean)) {
    const fieldKey = sourceFieldDateKey(id, field, record.source_lifecycle_date || date);
    if (scope === "manual") {
      index.manualPldIds.add(id);
      if (fieldKey) index.manualFieldKeys.add(fieldKey);
    } else {
      index.priorPldIdsByPack.get(packLabel).add(id);
      if (fieldKey) {
        index.priorFieldKeysByPack.get(packLabel).add(fieldKey);
        index.priorFieldKeys.add(fieldKey);
      }
    }
  }
}

function buildDuplicateIndex() {
  const index = {
    manualPldIds: new Set(),
    manualFieldKeys: new Set(),
    priorPldIdsByPack: new Map(),
    priorFieldKeysByPack: new Map(),
    priorFieldKeys: new Set(),
    sourceKeys: new Set(),
    titleDateKeys: new Set(),
    priorPacks: discoverPriorPacks(),
    counts: {
      manual_events_scanned: 0,
      manual_pld_ids: 0,
      manual_field_date_keys: 0,
      prior_packs: []
    }
  };

  const corpus = readJson(CORPUS_PATH);
  const events = Array.isArray(corpus) ? corpus : corpus.events || [];
  for (const event of events) {
    index.counts.manual_events_scanned += 1;
    addRecordKeys(index, event, "manual");
  }
  index.counts.manual_pld_ids = index.manualPldIds.size;
  index.counts.manual_field_date_keys = index.manualFieldKeys.size;

  for (const prior of index.priorPacks) {
    const rows = loadPriorCandidates(prior.file);
    index.priorPldIdsByPack.set(prior.label, new Set());
    index.priorFieldKeysByPack.set(prior.label, new Set());
    for (const candidate of rows) addRecordKeys(index, candidate, "prior", prior.label);
    index.counts.prior_packs.push({
      label: prior.label,
      path: path.relative(ROOT, prior.file).replace(/\\/g, "/"),
      exists: fs.existsSync(prior.file),
      candidates_scanned: rows.length,
      pld_ids: index.priorPldIdsByPack.get(prior.label).size,
      field_date_keys: index.priorFieldKeysByPack.get(prior.label).size
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
    [/school|academy|college|university|campus|student|education|teaching/, 34],
    [/hospital|health|clinic|medical|nhs|care home|surgery|healthcare/, 34],
    [/library|museum|gallery|theatre|cinema|cultural|arts|archive|heritage|listed building/, 32],
    [/town hall|civic|community centre|community hub|leisure centre|sports centre|market|public house/, 30],
    [/estate regeneration|regeneration|masterplan|comprehensive redevelopment|public realm|town centre/, 28],
    [/station|transport|bridge|interchange|public square|park|high street|crossrail|elizabeth line/, 24],
    [/mixed use|hotel|office|commercial|workspace|retail|industrial|warehouse|logistics/, 12],
    [/affordable housing|social rent|council homes|housing estate|extra care|residential-led/, 10],
    [/demolition and redevelopment|new building|new build|erection of|redevelopment/, 8]
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
  if (year >= 2020) value += Math.max(0, year - 2019) * 0.7;
  return value;
}

async function fetchRowsForSpec(spec) {
  const rows = [];
  const seen = new Set();
  let searchAfter = null;
  const pageSize = 500;
  const maxPages = 260;
  const queryRange = {
    gte: pldRangeDate(START_DATE),
    lte: pldRangeDate(END_DATE)
  };

  for (let page = 0; page < maxPages; page += 1) {
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
        "user-agent": "Bims5Round196PldLifecycleNext11/0.1"
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
    if (rows.length && rows.length % 10000 === 0) {
      console.log(`${spec.field}: fetched ${rows.length}`);
    }
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
    gia ? `${gia} sq m GIA gained` : "",
    lost ? `${lost} sq m GIA lost` : "",
    units ? `${units} proposed residential units` : "",
    area ? `${area} ha site area` : "",
    cost ? `GBP ${cost} projected cost of works` : ""
  ].filter(Boolean);
  const description = sentenceTrim(row.description, 420);
  const sourceFields = {
    id: rowId,
    pld_id: pldId,
    lpa_app_no: cleanText(row.lpa_app_no),
    lpa_name: cleanText(row.lpa_name),
    borough: cleanText(row.borough || row.lpa_name),
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
  };
  const summaryMetrics = metrics.length ? ` Source metrics include ${metrics.join("; ")}.` : "";
  const borough = cleanText(row.borough || row.lpa_name) || "London";
  const candidateId = `${ROUND}_lon_pld_${spec.kind}_${slugify(
    `${borough}_${lpaReference}_${date}`
  )}_${hash8(`${pldId}|${spec.field}|${date}`)}`;

  return {
    city_id: "london",
    event_id: candidateId,
    candidate_id: candidateId,
    title: `PLD ${spec.titleLabel} recorded for ${address}`,
    summary: `Planning London Datahub records ${spec.dateMeaning} ${date} for ${lpaReference} at ${address}. The row describes: ${description}.${summaryMetrics}`,
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
    publisher: `Greater London Authority / ${borough}`,
    borough,
    source_url: sourceUrl,
    row_url: sourceUrl,
    api_url: API_ENDPOINT,
    api_endpoint: API_ENDPOINT,
    api_query: `${API_ENDPOINT} with exists/range filter on ${spec.field} between ${START_DATE} and ${END_DATE}; sorted by ${spec.field} then _id with search_after pagination.`,
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
    source_record_id: `PLD:${rowId}; LPA:${lpaReference}`,
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
    latitude: Number(point.lat.toFixed(7)),
    longitude: Number(point.lon.toFixed(7)),
    geometry: {
      type: "Point",
      coordinates: [Number(point.lon.toFixed(7)), Number(point.lat.toFixed(7))]
    },
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
    description,
    source_fields: sourceFields,
    selection_score: Number(scoreValue.toFixed(2)),
    duplicate_check_note:
      "Screened against the live manual architecture corpus and all discovered prior London PLD lifecycle packs through round190, including round126 direct/more, round140, round147, round150, round153, round157, round161, round166, round172, round178, round184, and round190 by PLD row id, source-date-field/date, source URL/source_record/date-field/date, and title/date.",
    limitations: [
      "PLD actual_commencement_date and actual_completion_date are source-reported administrative or applicant/local-authority lifecycle fields from borough planning feeds and may be unevenly populated or interpreted across authorities.",
      "This row is not proof of construction start, construction completion, opening, occupation, current use, service outcomes, design quality, causation, or final built form.",
      "Do not infer delivery of a wider masterplan or proposal outcome from this lifecycle row alone.",
      "Geometry is a PLD point or polygon-derived representative point for atlas navigation and may not be the precise building footprint or phase boundary.",
      "The London Datastore licence entry for the applications source is Not Specified; keep attribution/source URLs and review terms before redistributing source data at bulk scale."
    ],
    transformation_method:
      "scripts/fetch_round196_london_pld_lifecycle_next11_candidates.js queried the official Planning London Datahub guest applications API for actual_commencement_date and actual_completion_date rows, normalized source dates, filtered to the London coordinate envelope and 2008-2026 access window, scored architecture/city-change signals, and removed exact source row/date-field/date duplicates already present in the live manual architecture corpus or prior PLD lifecycle packs through round190."
  };
}

function rejectWith(rejections, reason, item) {
  rejections.counts[reason] = (rejections.counts[reason] || 0) + 1;
  if (rejections.samples.length < REJECTION_SAMPLE_LIMIT && item) {
    rejections.samples.push({
      reason,
      pld_id: normalizePldId(item.row?.id),
      source_lifecycle_field: item.spec?.field || null,
      effective_date: item.date || null,
      lpa_reference: cleanText(item.row?.lpa_app_no),
      borough: cleanText(item.row?.borough || item.row?.lpa_name),
      selection_score: Number((item.scoreValue || 0).toFixed(2)),
      source_url: item.row?.id ? pldSourceUrl(cleanText(item.row.id)) : null
    });
  }
  return true;
}

function priorPackLabelForFieldKey(fieldKey, duplicateIndex) {
  for (const [label, keys] of duplicateIndex.priorFieldKeysByPack.entries()) {
    if (keys.has(fieldKey)) return label;
  }
  return "";
}

function rejectionReason(item, duplicateIndex, batchKeys) {
  const { row, spec, date, point, scoreValue } = item;
  const rowId = normalizePldId(row.id);
  const sourceUrl = pldSourceUrl(cleanText(row.id));
  const sourceRecordId = `PLD:${cleanText(row.id)}; LPA:${cleanText(row.lpa_app_no) || "not supplied"}`;
  const titleDate = `london|${cleanText(`PLD ${spec.titleLabel} recorded for ${addressFor(row)}`).toLowerCase()}|${date}`;
  const fieldKey = sourceFieldDateKey(rowId, spec.field, date);
  const sourceKey = `london|${sourceUrl}|${sourceRecordId}|${normalizeLifecycleField(spec.field)}|${date}`.toLowerCase();
  const lowValueAdminText = `${row.application_type_full || ""} ${row.description || ""}`;

  if (!rowId) return "missing_pld_row_id";
  if (!date || !inDateWindow(date)) return "missing_or_out_of_window_lifecycle_date";
  if (!inLondon(point)) return "missing_or_outside_london_geometry";
  if (duplicateIndex.manualFieldKeys.has(fieldKey)) return "existing_manual_corpus_field_date_key";
  const priorPack = priorPackLabelForFieldKey(fieldKey, duplicateIndex);
  if (priorPack) return `existing_${priorPack}_field_date_key`;
  if (duplicateIndex.priorFieldKeys.has(fieldKey)) return "existing_prior_field_date_key";
  if (duplicateIndex.sourceKeys.has(sourceKey)) return "existing_source_url_record_key";
  if (duplicateIndex.titleDateKeys.has(titleDate)) return "existing_title_date_key";
  if (batchKeys.has(fieldKey)) return "duplicate_row_date_field_inside_round196_batch";
  if (
    /householder|advertisement|tree works|lawful development|certificate of lawfulness|telecommunications|non-material amendment|discharge of condition|approval of details|details pursuant to condition/i.test(
      lowValueAdminText
    )
  ) {
    return "low_value_admin_or_minor_application_type";
  }
  if (scoreValue < MIN_SCORE) return "below_architecture_city_change_signal_threshold";
  return "";
}

function validateCandidates(pack, duplicateIndex) {
  const candidates = pack.candidates || [];
  if (!candidates.length) throw new Error("No candidates written.");
  if (candidates.length > TARGET_COUNT) throw new Error(`Too many candidates: ${candidates.length}`);
  const candidateIds = new Set();
  const eventIds = new Set();
  const sourceKeys = new Set();
  const fieldKeys = new Set();
  for (const candidate of candidates) {
    const required = [
      "event_id",
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
      "raw_lifecycle_dates",
      "geometry",
      "geometry_source",
      "geometry_precision",
      "license_or_terms_note",
      "accessed_at",
      "confidence",
      "limitations",
      "transformation_method"
    ];
    for (const field of required) {
      if (!candidate[field] || (Array.isArray(candidate[field]) && !candidate[field].length)) {
        throw new Error(`Missing required field ${field} on ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (candidate.city_id !== "london") throw new Error(`Unexpected city_id on ${candidate.candidate_id}`);
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
    if (!inLondon({ lon: candidate.geometry.coordinates[0], lat: candidate.geometry.coordinates[1] })) {
      throw new Error(`Candidate geometry outside London envelope: ${candidate.candidate_id}`);
    }
    const caveatText = [
      candidate.observed_change,
      candidate.summary,
      candidate.limitations.join(" "),
      candidate.transformation_method
    ]
      .join(" ")
      .toLowerCase();
    for (const term of ["not proof", "construction", "opening", "occupation", "final built form", "outcomes"]) {
      if (!caveatText.includes(term)) {
        throw new Error(`Missing required lifecycle caveat "${term}" on ${candidate.candidate_id}`);
      }
    }
    const overclaimText = [candidate.title, candidate.observed_change].join(" ").toLowerCase();
    if (/\b(caused|causes|proved|proves|predicts|prediction)\b/.test(overclaimText)) {
      throw new Error(`Potential overclaim wording on ${candidate.candidate_id}`);
    }
    const fieldKey = sourceFieldDateKey(
      candidate.pld_id,
      candidate.source_lifecycle_field || candidate.source_date_field,
      candidate.effective_date
    );
    if (duplicateIndex.manualFieldKeys.has(fieldKey)) {
      throw new Error(`Candidate duplicates manual corpus PLD source/date-field/date key: ${fieldKey}`);
    }
    const priorPack = priorPackLabelForFieldKey(fieldKey, duplicateIndex);
    if (priorPack) {
      throw new Error(`Candidate duplicates prior ${priorPack} PLD source/date-field/date key: ${fieldKey}`);
    }
    if (fieldKeys.has(fieldKey)) throw new Error(`Duplicate source field/date key inside batch: ${fieldKey}`);
    fieldKeys.add(fieldKey);
    if (eventIds.has(candidate.event_id)) throw new Error(`Duplicate event_id: ${candidate.event_id}`);
    eventIds.add(candidate.event_id);
    if (candidateIds.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    const sourceKey = `${candidate.source_url}|${candidate.source_record_id}|${candidate.source_lifecycle_field}|${candidate.effective_date}`;
    if (sourceKeys.has(sourceKey)) throw new Error(`Duplicate source key: ${sourceKey}`);
    sourceKeys.add(sourceKey);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const duplicateIndex = buildDuplicateIndex();
  const rejections = { counts: {}, samples: [] };
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
  const eligibleNotSelected = [];
  let evaluated = 0;
  let evaluatedUntilTargetReached = null;
  for (const item of pool) {
    evaluated += 1;
    const reason = rejectionReason(item, duplicateIndex, batchKeys);
    if (reason) {
      rejectWith(rejections, reason, item);
      continue;
    }
    if (selected.length < TARGET_COUNT) {
      batchKeys.add(sourceFieldDateKey(item.row.id, item.spec.field, item.date));
      selected.push(candidateFor(item));
      if (selected.length === TARGET_COUNT && evaluatedUntilTargetReached === null) {
        evaluatedUntilTargetReached = evaluated;
      }
      continue;
    }
    eligibleNotSelected.push({
      pld_id: normalizePldId(item.row.id),
      source_lifecycle_field: item.spec.field,
      effective_date: item.date,
      selection_score: Number(item.scoreValue.toFixed(2)),
      source_url: pldSourceUrl(cleanText(item.row.id))
    });
  }

  selected.sort(
    (left, right) =>
      left.effective_date.localeCompare(right.effective_date) ||
      left.source_record_id.localeCompare(right.source_record_id) ||
      left.source_lifecycle_field.localeCompare(right.source_lifecycle_field)
  );

  const selectedByField = selected.reduce((acc, candidate) => {
    acc[candidate.source_lifecycle_field] = (acc[candidate.source_lifecycle_field] || 0) + 1;
    return acc;
  }, {});

  const selectedByBorough = selected.reduce((acc, candidate) => {
    const borough = candidate.borough || "unknown";
    acc[borough] = (acc[borough] || 0) + 1;
    return acc;
  }, {});

  const candidatesPack = {
    schema_version: "round196.london_pld_lifecycle_next11.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    task:
      "Round196 London Planning Datahub actual lifecycle candidate pack beyond current manual corpus and prior PLD lifecycle packs through round190",
    candidate_count: selected.length,
    candidates: selected
  };

  const sourceAudit = {
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    task: ROUND_NAME,
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
          "actual_commencement_date and actual_completion_date are source-reported administrative/applicant/local-authority feed fields, not independent proof of construction start, construction completion, opening, occupation, current use, final built form, design quality, outcomes, or causation.",
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
    evaluated,
    evaluated_until_target_reached: evaluatedUntilTargetReached,
    eligible_not_selected_after_target: eligibleNotSelected.length,
    eligible_not_selected_sample: eligibleNotSelected.slice(0, 100),
    accepted_until_target_reached: selected.length,
    rejection_summary: rejections.counts,
    rejection_sample_count: rejections.samples.length,
    duplicate_index: duplicateIndex.counts,
    dedupe_basis:
      "Live data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json plus all discovered London PLD lifecycle scratch packs through round190, explicitly including round126 direct/more, round140, round147, round150, round153, round157, round161, round166, round172, round178, round184, and round190, scanned for PLD ids, source-record/source-url/date-field/date keys, source-date-field/date keys, and title/date keys.",
    selected_by_lifecycle_field: selectedByField,
    selected_by_borough: selectedByBorough,
    selected_date_range: {
      min: selected[0]?.effective_date || null,
      max: selected[selected.length - 1]?.effective_date || null
    },
    selected_score_range: {
      min: selected.length ? Math.min(...selected.map((candidate) => candidate.selection_score)) : null,
      max: selected.length ? Math.max(...selected.map((candidate) => candidate.selection_score)) : null
    },
    caveats: [
      "Candidates are source-reported administrative lifecycle records, not proof that construction started, a building completed, opened, became occupied, reached final built form, or produced an outcome.",
      "Exact source row/date-field/date duplicates already present in the live manual corpus or prior PLD lifecycle packs through round190 were excluded.",
      "London Datastore licence is Not Specified for this source, so the pack retains factual metadata and attribution only."
    ]
  };

  const rejectedPack = {
    schema_version: "round196.london_pld_lifecycle_next11.rejected.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejection_count: Object.values(rejections.counts).reduce((sum, count) => sum + count, 0),
    rejection_summary: rejections.counts,
    sample_limit: REJECTION_SAMPLE_LIMIT,
    sample_count: rejections.samples.length,
    samples: rejections.samples,
    eligible_not_selected_after_target: eligibleNotSelected.length,
    eligible_not_selected_sample: eligibleNotSelected.slice(0, 100),
    note:
      "Rejected samples are bounded for scratch-pack size. Rejection counts cover all evaluated fetched lifecycle rows; eligible_not_selected rows passed filters but were left out after the target count was reached."
  };

  const notes = [
    "# Round 196 London PLD lifecycle next11 candidates",
    "",
    `Generated ${selected.length} candidates from official Planning London Datahub application rows accessed on ${ACCESSED_AT}.`,
    "",
    `This round uses only \`actual_commencement_date\` and \`actual_completion_date\` values from \`${START_DATE}\` through \`${END_DATE}\`. It does not use approval-only rows, previous-permission lifecycle fields, forecast dates, or inferred delivery dates.`,
    "",
    "Deduplication scanned the live manual architecture corpus plus all discovered prior London PLD lifecycle scratch packs through round190, explicitly including round126 direct, round126 more, round140, round147, round150, round153, round157, round161, round166, round172, round178, round184, and round190 by PLD row id, source URL/source record/date-field/date, source date field/date, and title/date.",
    "",
    "Every candidate keeps the PLD row id, LPA reference, official source row URL, API query, raw lifecycle date fields, source geometry fields, borough/publisher, access date, attribution, confidence, limitations, and transformation notes.",
    "",
    "Use these as planning lifecycle milestones only. Do not infer construction start, construction completion, opening, occupation, current use, design quality, outcomes, causation, delivery of a wider masterplan, or final built form.",
    "",
    "The London Datastore applications page was checked on 2026-05-19 and listed daily update frequency with Licence: Not Specified, so redistribution terms need review before promoting this scratch pack into a public data release."
  ].join("\n");

  validateCandidates(candidatesPack, duplicateIndex);

  writeJson(path.join(OUT_DIR, "candidates.json"), candidatesPack);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejectedPack);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notes}\n`);

  console.log(
    JSON.stringify(
      {
        written: selected.length,
        outDir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        queryStats,
        selectedByLifecycleField: summary.selected_by_lifecycle_field,
        selectedDateRange: summary.selected_date_range,
        selectedScoreRange: summary.selected_score_range,
        eligibleNotSelectedAfterTarget: eligibleNotSelected.length,
        rejectionSummary: rejections.counts
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
