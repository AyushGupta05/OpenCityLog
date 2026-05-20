const fs = require("fs");
const path = require("path");

const ACCESS_DATE = "2026-05-20";
const DATE_START = "2008-01-01";
const DATE_END = "2026-05-20";

const OUT_DIR = path.join("tmp", "subagents", "round454_london_nhle_heritage_tail6");
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const VALIDATION_REPORT_PATH = path.join(OUT_DIR, "validation_report.json");
const READBACK_PATH = path.join(OUT_DIR, "readback.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");

const LONDON_BBOX = "-0.5103,51.2868,0.334,51.6919";
const LONDON_BBOX_NUMERIC = [-0.5103, 51.2868, 0.334, 51.6919];
const ONS_LONDON_REGION_URL =
  "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Regions_December_2024_Boundaries_EN_BFC/FeatureServer/0";
const NHLE_SERVICE_URL =
  "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer";
const NHLE_API_CATALOGUE_URL = "https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/";
const NHLE_DATA_DOWNLOADS_URL = "https://historicengland.org.uk/listing/the-list/data-downloads/";
const DELISTED_SERVICE_URL =
  "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Delisted/FeatureServer";
const DELISTED_DATASET_URL =
  "https://opendata-historicengland.hub.arcgis.com/datasets/8836370be44f4916b9ba7d350df24902_0/explore";
const DELISTED_ITEM_URL = "https://www.arcgis.com/sharing/rest/content/items/8836370be44f4916b9ba7d350df24902";

const SOURCE_ID = "historic-england-nhle-open-data-round454-tail6";
const DELISTED_SOURCE_ID = "historic-england-de-designated-sites";
const SOURCE_NAME = "National Heritage List for England (NHLE) open data";
const DELISTED_SOURCE_NAME = "Historic England De-designated sites";
const PUBLISHER = "Historic England";
const LICENSE =
  "Open Government Licence v3.0 with Historic England Open Data Hub terms; spatial data includes Ordnance Survey Crown copyright/database right attribution.";
const LICENSE_URL = "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/";
const ATTRIBUTION = "Historic England; Contains Ordnance Survey data Crown copyright and database right 2026.";

const DATE_FIELD_VARIANTS = {
  ListDate: ["ListDate", "Listing date", "Date first listed"],
  AmendDate: ["AmendDate", "Date of most recent amendment"],
  BPNStart: ["BPNStart", "Building Preservation Notice start date", "BPN Issue Date"],
  BPNExpire: ["BPNExpire", "Building Preservation Notice expiry date"],
  COIStart: ["COIStart", "Start Date of Certificate", "start-date"],
  COIExpire: ["COIExpire", "Expiry Date of Certificate", "end-date"],
  SchedDate: ["SchedDate", "Date first scheduled"],
  RegDate: ["RegDate", "Date first registered"],
  DesigDate: ["DesigDate", "Date first designated"],
  InscrDate: ["InscrDate", "Date first inscribed"],
  DateRemovedFromList: ["DateRemovedFromList", "Date Removed From List"],
};

const SOURCE_QUERIES = [
  {
    layer_id: 0,
    layer_name: "Listed Building points",
    geometry_kind: "point",
    date_field: "ListDate",
    record_type: "nhle_listed_building_designation",
    project_type: "NHLE listed-building designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "added to the NHLE",
    action_label: "listed-building designation",
  },
  {
    layer_id: 0,
    layer_name: "Listed Building points",
    geometry_kind: "point",
    date_field: "AmendDate",
    record_type: "nhle_listed_building_amendment",
    project_type: "NHLE listed-building amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE list-entry record amended",
    action_label: "listed-building list-entry amendment",
  },
  {
    layer_id: 3,
    layer_name: "Listed Building polygons",
    geometry_kind: "polygon",
    date_field: "ListDate",
    record_type: "nhle_listed_building_designation",
    project_type: "NHLE listed-building designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "added to the NHLE",
    action_label: "listed-building designation",
  },
  {
    layer_id: 3,
    layer_name: "Listed Building polygons",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_listed_building_amendment",
    project_type: "NHLE listed-building amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE list-entry record amended",
    action_label: "listed-building list-entry amendment",
  },
  {
    layer_id: 1,
    layer_name: "Building Preservation Notice points",
    geometry_kind: "point",
    date_field: "BPNStart",
    record_type: "nhle_building_preservation_notice_start",
    project_type: "NHLE building preservation notice start",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE building preservation notice started",
    action_label: "building preservation notice start",
  },
  {
    layer_id: 1,
    layer_name: "Building Preservation Notice points",
    geometry_kind: "point",
    date_field: "BPNExpire",
    record_type: "nhle_building_preservation_notice_expiry",
    project_type: "NHLE building preservation notice expiry",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE building preservation notice expired",
    action_label: "building preservation notice expiry",
  },
  {
    layer_id: 4,
    layer_name: "Building Preservation Notices polygons",
    geometry_kind: "polygon",
    date_field: "BPNStart",
    record_type: "nhle_building_preservation_notice_start",
    project_type: "NHLE building preservation notice start",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE building preservation notice started",
    action_label: "building preservation notice start",
  },
  {
    layer_id: 4,
    layer_name: "Building Preservation Notices polygons",
    geometry_kind: "polygon",
    date_field: "BPNExpire",
    record_type: "nhle_building_preservation_notice_expiry",
    project_type: "NHLE building preservation notice expiry",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE building preservation notice expired",
    action_label: "building preservation notice expiry",
  },
  {
    layer_id: 2,
    layer_name: "Certificate of Immunity points",
    geometry_kind: "point",
    date_field: "COIStart",
    record_type: "nhle_certificate_of_immunity_start",
    project_type: "NHLE certificate of immunity start",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE certificate of immunity started",
    action_label: "certificate of immunity start",
  },
  {
    layer_id: 2,
    layer_name: "Certificate of Immunity points",
    geometry_kind: "point",
    date_field: "COIExpire",
    record_type: "nhle_certificate_of_immunity_expiry",
    project_type: "NHLE certificate of immunity expiry",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE certificate of immunity expired",
    action_label: "certificate of immunity expiry",
  },
  {
    layer_id: 5,
    layer_name: "Certificate of Immunity polygons",
    geometry_kind: "polygon",
    date_field: "COIStart",
    record_type: "nhle_certificate_of_immunity_start",
    project_type: "NHLE certificate of immunity start",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE certificate of immunity started",
    action_label: "certificate of immunity start",
  },
  {
    layer_id: 5,
    layer_name: "Certificate of Immunity polygons",
    geometry_kind: "polygon",
    date_field: "COIExpire",
    record_type: "nhle_certificate_of_immunity_expiry",
    project_type: "NHLE certificate of immunity expiry",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "NHLE certificate of immunity expired",
    action_label: "certificate of immunity expiry",
  },
  {
    layer_id: 6,
    layer_name: "Scheduled Monuments",
    geometry_kind: "polygon",
    date_field: "SchedDate",
    record_type: "nhle_scheduled_monument_designation",
    project_type: "NHLE scheduled monument designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "scheduled monument designation recorded",
    action_label: "scheduled monument designation",
  },
  {
    layer_id: 6,
    layer_name: "Scheduled Monuments",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_scheduled_monument_amendment",
    project_type: "NHLE scheduled monument amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "scheduled monument NHLE record amended",
    action_label: "scheduled monument list-entry amendment",
  },
  {
    layer_id: 7,
    layer_name: "Parks and Gardens",
    geometry_kind: "polygon",
    date_field: "RegDate",
    record_type: "nhle_registered_park_garden_designation",
    project_type: "NHLE registered park/garden designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "registered park/garden designation recorded",
    action_label: "registered park/garden designation",
  },
  {
    layer_id: 7,
    layer_name: "Parks and Gardens",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_registered_park_garden_amendment",
    project_type: "NHLE registered park/garden amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "registered park/garden NHLE record amended",
    action_label: "registered park/garden list-entry amendment",
  },
  {
    layer_id: 8,
    layer_name: "Battlefields",
    geometry_kind: "polygon",
    date_field: "RegDate",
    record_type: "nhle_registered_battlefield_designation",
    project_type: "NHLE registered battlefield designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "registered battlefield designation recorded",
    action_label: "registered battlefield designation",
  },
  {
    layer_id: 8,
    layer_name: "Battlefields",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_registered_battlefield_amendment",
    project_type: "NHLE registered battlefield amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "registered battlefield NHLE record amended",
    action_label: "registered battlefield list-entry amendment",
  },
  {
    layer_id: 9,
    layer_name: "Protected Wreck Sites",
    geometry_kind: "polygon",
    date_field: "DesigDate",
    record_type: "nhle_protected_wreck_designation",
    project_type: "NHLE protected wreck designation",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "protected wreck designation recorded",
    action_label: "protected wreck designation",
  },
  {
    layer_id: 9,
    layer_name: "Protected Wreck Sites",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_protected_wreck_amendment",
    project_type: "NHLE protected wreck amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "protected wreck NHLE record amended",
    action_label: "protected wreck list-entry amendment",
  },
  {
    layer_id: 10,
    layer_name: "World Heritage Sites",
    geometry_kind: "polygon",
    date_field: "InscrDate",
    record_type: "nhle_world_heritage_site_inscription",
    project_type: "NHLE world heritage site inscription",
    bucket: "planning/development/architecture/heritage_designation",
    title_suffix: "world heritage site inscription recorded",
    action_label: "world heritage site inscription",
  },
  {
    layer_id: 10,
    layer_name: "World Heritage Sites",
    geometry_kind: "polygon",
    date_field: "AmendDate",
    record_type: "nhle_world_heritage_site_amendment",
    project_type: "NHLE world heritage site amendment",
    bucket: "planning/development/architecture/heritage_administrative_change",
    title_suffix: "world heritage site NHLE record amended",
    action_label: "world heritage site list-entry amendment",
  },
];

const DELISTED_QUERY = {
  layer_id: 0,
  layer_name: "De-designated sites",
  geometry_kind: "polygon",
  date_field: "DateRemovedFromList",
  record_type: "nhle_de_designation_removal",
  project_type: "NHLE de-designation/removal",
  bucket: "planning/development/architecture/heritage_administrative_change",
  title_suffix: "removed from the NHLE",
  action_label: "de-designation/removal from the NHLE",
};

const REQUIRED_FIELDS = [
  "city_id",
  "event_id",
  "title",
  "summary",
  "effective_date",
  "date",
  "source_record_id",
  "source_url",
  "source_name",
  "publisher",
  "source_type",
  "license",
  "attribution",
  "accessed_at",
  "retrieved_at",
  "confidence",
  "limitations",
  "transformation_method",
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n");
}

function oneLine(value) {
  return cleanText(value).replace(/\s+/g, " ").trim();
}

function slug(value, maxLen = 88) {
  const result = oneLine(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (result.slice(0, maxLen).replace(/-+$/g, "") || "record");
}

function dateCompact(value) {
  return String(value).replace(/-/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchJson(url, params = undefined) {
  const fullUrl = params ? `${url}?${new URLSearchParams(params).toString()}` : url;
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(fullUrl, {
        headers: { "User-Agent": "Bims-5 round454 NHLE tail6 fetcher" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === 5) {
        break;
      }
      await sleep(attempt * 2000);
    }
  }
  throw lastError;
}

async function arcgisFeatures(serviceUrl, params, pageSize = 2000) {
  const rows = [];
  let offset = 0;
  while (true) {
    const pageParams = {
      ...params,
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
    };
    const payload = await fetchJson(`${serviceUrl}/query`, pageParams);
    if (payload.error) {
      throw new Error(`ArcGIS query failed for ${serviceUrl}: ${JSON.stringify(payload.error)}`);
    }
    const features = payload.features || [];
    rows.push(...features);
    const exceeded = Boolean(payload.exceededTransferLimit || payload.properties?.exceededTransferLimit);
    if ((features.length < pageSize && !exceeded) || features.length === 0) {
      break;
    }
    offset += pageSize;
  }
  return rows;
}

function isoFromArcgis(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  const date = new Date(numeric);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function* iterPoints(geometry) {
  if (!geometry) {
    return;
  }
  const type = geometry.type;
  const coordinates = geometry.coordinates || [];
  if (type === "Point") {
    yield coordinates;
  } else if (type === "MultiPoint") {
    for (const point of coordinates) {
      yield point;
    }
  } else if (type === "Polygon") {
    for (const ring of coordinates) {
      for (const point of ring) {
        yield point;
      }
    }
  } else if (type === "MultiPolygon") {
    for (const polygon of coordinates) {
      for (const ring of polygon) {
        for (const point of ring) {
          yield point;
        }
      }
    }
  }
}

function firstPoint(geometry) {
  for (const point of iterPoints(geometry)) {
    if (point.length >= 2) {
      return [Number(point[0]), Number(point[1])];
    }
  }
  return null;
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  let j = ring.length - 1;
  for (let i = 0; i < ring.length; i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y)) {
      const xAtY = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (x < xAtY) {
        inside = !inside;
      }
    }
    j = i;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  if (!geometry) {
    return false;
  }
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates || [];
    if (!rings.length || !pointInRing(point, rings[0])) {
      return false;
    }
    return !rings.slice(1).some((ring) => pointInRing(point, ring));
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).some((polygon) =>
      pointInGeometry(point, { type: "Polygon", coordinates: polygon })
    );
  }
  if (geometry.type === "Point" || geometry.type === "MultiPoint") {
    return Array.from(iterPoints(geometry)).some(
      (candidate) => Math.abs(point[0] - Number(candidate[0])) < 1e-9 && Math.abs(point[1] - Number(candidate[1])) < 1e-9
    );
  }
  return false;
}

function representativePoint(geometry, londonGeometry = null) {
  const point = firstPoint(geometry);
  if (geometry && (geometry.type === "Point" || geometry.type === "MultiPoint")) {
    return point;
  }
  const points = Array.from(iterPoints(geometry))
    .filter((candidate) => candidate.length >= 2)
    .map((candidate) => [Number(candidate[0]), Number(candidate[1])])
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  if (!points.length) {
    return null;
  }
  const centroid = [
    points.reduce((sum, candidate) => sum + candidate[0], 0) / points.length,
    points.reduce((sum, candidate) => sum + candidate[1], 0) / points.length,
  ];
  if (pointInGeometry(centroid, geometry) && (!londonGeometry || pointInGeometry(centroid, londonGeometry))) {
    return centroid;
  }
  for (const candidate of points) {
    if (!londonGeometry || pointInGeometry(candidate, londonGeometry)) {
      return candidate;
    }
  }
  return centroid;
}

async function londonRegionGeometry() {
  const payload = await fetchJson(`${ONS_LONDON_REGION_URL}/query`, {
    where: "RGN24CD='E12000007'",
    outFields: "RGN24CD,RGN24NM",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });
  const features = payload.features || [];
  if (!features.length) {
    throw new Error("Could not fetch ONS London region geometry.");
  }
  return features[0].geometry;
}

function eventishRows(value, rows = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      eventishRows(item, rows);
    }
    return rows;
  }
  if (!value || typeof value !== "object") {
    return rows;
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "event_id") ||
    Object.prototype.hasOwnProperty.call(value, "candidate_id") ||
    Object.prototype.hasOwnProperty.call(value, "source_record_id") ||
    Object.prototype.hasOwnProperty.call(value, "source_url") ||
    Object.prototype.hasOwnProperty.call(value, "evidence") ||
    Object.prototype.hasOwnProperty.call(value, "provenance")
  ) {
    rows.push(value);
  }
  for (const item of Object.values(value)) {
    eventishRows(item, rows);
  }
  return rows;
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...listJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      output.push(entryPath);
    }
  }
  return output;
}

function candidatePackJsonFiles() {
  const root = path.join("tmp", "subagents");
  const currentAbs = path.resolve(OUT_DIR);
  const namePattern = /(candidates|arch_candidates|heritage_candidates)/i;
  const skipPattern = /(rejected|summary|source_audit|validation|query|raw|readback)/i;
  return listJsonFiles(root).filter((filePath) => {
    const abs = path.resolve(filePath);
    if (abs.startsWith(`${currentAbs}${path.sep}`)) {
      return false;
    }
    const baseName = path.basename(filePath);
    if (skipPattern.test(baseName)) {
      return false;
    }
    try {
      if (fs.statSync(filePath).size > 50_000_000) {
        return false;
      }
    } catch {
      return false;
    }
    const normalized = filePath.toLowerCase().replace(/\\/g, "/");
    return namePattern.test(baseName) || (normalized.includes("heritage") && baseName.toLowerCase() === "candidates.json");
  });
}

function textForRow(row) {
  try {
    return JSON.stringify(row);
  } catch {
    return String(row);
  }
}

function extractEntries(text) {
  const entries = new Set();
  for (const match of text.matchAll(/historicengland\.org\.uk\/listing\/the-list\/list-entry\/(\d{6,8})/gi)) {
    entries.add(match[1]);
  }
  for (const match of text.matchAll(/\bNHLE\s+(?:COI\s+)?ListEntry\s*(\d{6,8})\b/gi)) {
    entries.add(match[1]);
  }
  for (const match of text.matchAll(/\bOriginalListEntryNumber\D{0,24}(\d{6,8})\b/gi)) {
    entries.add(match[1]);
  }
  if (/(NHLE|Historic England|historicengland\.org\.uk|ListEntry)/i.test(text)) {
    for (const match of text.matchAll(/\bListEntry\D{0,24}(\d{6,8})\b/gi)) {
      entries.add(match[1]);
    }
  }
  if (/(De-designated|DateRemovedFromList|ARTICLEUID)/i.test(text)) {
    for (const match of text.matchAll(/\bARTICLEUID\D{0,24}(\d{6,8})\b/gi)) {
      entries.add(`article-${match[1]}`);
    }
  }
  return entries;
}

function canonicalDateField(value, text = "") {
  const valueText = oneLine(value);
  const lowerValue = valueText.toLowerCase();
  const lowerText = text.toLowerCase();
  for (const [canonical, variants] of Object.entries(DATE_FIELD_VARIANTS)) {
    for (const variant of variants) {
      const lowerVariant = variant.toLowerCase();
      if (lowerVariant === lowerValue) {
        return canonical;
      }
      if (lowerValue.includes(lowerVariant) && canonical !== "COIStart") {
        return canonical;
      }
    }
  }
  if (lowerValue === "start-date" && /(certificate of immunity|coi|nhle coi)/i.test(lowerText)) {
    return "COIStart";
  }
  if (lowerValue === "end-date" && /(certificate of immunity|coi|nhle coi)/i.test(lowerText)) {
    return "COIExpire";
  }
  return "";
}

function addTextFieldDateKeys(text, entries, keys) {
  if (!entries.size) {
    return;
  }
  for (const [canonical, variants] of Object.entries(DATE_FIELD_VARIANTS)) {
    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const after = new RegExp(`\\b${escaped}\\b[^\\d]{0,80}(\\d{4}-\\d{2}-\\d{2})`, "gi");
      const before = new RegExp(`(\\d{4}-\\d{2}-\\d{2})[^\\w]{0,80}\\b${escaped}\\b`, "gi");
      for (const match of text.matchAll(after)) {
        for (const entry of entries) {
          keys.add(`${entry}|${canonical}|${match[1]}`);
        }
      }
      for (const match of text.matchAll(before)) {
        for (const entry of entries) {
          keys.add(`${entry}|${canonical}|${match[1]}`);
        }
      }
    }
  }
}

function provenanceSnippets(row) {
  const snippets = [];
  if (!row || typeof row !== "object") {
    return snippets;
  }
  for (const key of ["source_record_id", "record_id"]) {
    if (row[key]) {
      snippets.push(oneLine(row[key]));
    }
  }
  if (row.provenance && typeof row.provenance === "object") {
    for (const key of ["source_record_id", "record_id"]) {
      if (row.provenance[key]) {
        snippets.push(oneLine(row.provenance[key]));
      }
    }
  }
  for (const evidence of row.evidence || []) {
    if (evidence && typeof evidence === "object") {
      for (const key of ["source_record_id", "record_id"]) {
        if (evidence[key]) {
          snippets.push(oneLine(evidence[key]));
        }
      }
    }
  }
  return snippets;
}

function extractNhleKeys(row) {
  const text = textForRow(row);
  if (!/(NHLE|Historic England|historicengland\.org\.uk|ListEntry|DateRemovedFromList|De-designated)/i.test(text)) {
    return new Set();
  }
  const entries = extractEntries(text);
  const keys = new Set();
  const date = isoFromArcgis(row.date || row.effective_date || "");
  const field = canonicalDateField(row.source_date_field || "", text);
  if (date && field && entries.size) {
    for (const entry of entries) {
      keys.add(`${entry}|${field}|${date}`);
    }
  }
  if (date && !field && entries.size) {
    const lowerText = text.toLowerCase();
    const listDateLike =
      lowerText.includes("listdate") ||
      lowerText.includes("was listed") ||
      lowerText.includes("listed-building designation") ||
      lowerText.includes("statutory listed");
    if (listDateLike && !lowerText.includes("amenddate") && !lowerText.includes("heritage at risk")) {
      for (const entry of entries) {
        keys.add(`${entry}|ListDate|${date}`);
      }
    }
  }
  for (const item of [row, row.source_row].filter(Boolean)) {
    if (!item || typeof item !== "object") {
      continue;
    }
    let listEntry = oneLine(item.ListEntry || item.OriginalListEntryNumber || item.nhle_list_entry || item.list_entry || "");
    if (!listEntry && item.ARTICLEUID) {
      listEntry = `article-${oneLine(item.ARTICLEUID)}`;
    }
    if (!listEntry) {
      continue;
    }
    for (const [canonical, variants] of Object.entries(DATE_FIELD_VARIANTS)) {
      for (const variant of variants) {
        if (Object.prototype.hasOwnProperty.call(item, variant)) {
          const candidateDate = isoFromArcgis(item[variant]);
          if (candidateDate) {
            keys.add(`${listEntry}|${canonical}|${candidateDate}`);
          }
        }
      }
    }
  }
  for (const snippet of provenanceSnippets(row)) {
    const snippetEntries = extractEntries(snippet);
    addTextFieldDateKeys(snippet, snippetEntries.size ? snippetEntries : entries, keys);
  }
  for (const match of text.matchAll(/nhle[-_a-z]*amend[-_a-z]*(\d{6,8})[-_](\d{8})/gi)) {
    keys.add(`${match[1]}|AmendDate|${match[2].slice(0, 4)}-${match[2].slice(4, 6)}-${match[2].slice(6, 8)}`);
  }
  for (const match of text.matchAll(/nhle[-_a-z]*list[-_a-z]*(\d{6,8})[-_](\d{8})/gi)) {
    keys.add(`${match[1]}|ListDate|${match[2].slice(0, 4)}-${match[2].slice(4, 6)}-${match[2].slice(6, 8)}`);
  }
  for (const match of text.matchAll(/coi[-_a-z]*(\d{6,8})[-_](\d{8})/gi)) {
    keys.add(`${match[1]}|COIStart|${match[2].slice(0, 4)}-${match[2].slice(4, 6)}-${match[2].slice(6, 8)}`);
  }
  return keys;
}

function scanExisting() {
  const existingIds = new Set();
  const existingSourceKeys = new Set();
  const existingNhleKeys = new Set();
  let scannedCandidateFiles = 0;
  let corpusEventCount = 0;

  const addRow = (row, defaultCity = "") => {
    if (!row || typeof row !== "object") {
      return;
    }
    const eventId = oneLine(row.event_id || row.candidate_id || "");
    if (eventId) {
      existingIds.add(eventId);
    }
    const city = oneLine(row.city_id || row.city || defaultCity);
    const date = isoFromArcgis(row.date || row.effective_date || "");
    const sourceUrl = oneLine(row.source_url || "");
    const sourceRecordId = oneLine(row.source_record_id || "");
    const field = canonicalDateField(row.source_date_field || "", textForRow(row)) || oneLine(row.source_date_field || "");
    if (city && date && sourceUrl && sourceRecordId) {
      existingSourceKeys.add(`${city}|${sourceUrl}|${sourceRecordId}|${field}|${date}`);
    }
    if (city === "london" || !city) {
      for (const key of extractNhleKeys(row)) {
        existingNhleKeys.add(key);
      }
    }
  };

  const corpusPath = path.join("data", "manual_drops", "architecture_milestones", "architecture_milestones_2008_2026.json");
  if (fs.existsSync(corpusPath)) {
    const corpus = readJson(corpusPath);
    for (const event of corpus.events || []) {
      corpusEventCount += 1;
      addRow(event, "london");
    }
  }

  for (const filePath of candidatePackJsonFiles()) {
    try {
      const payload = readJson(filePath);
      scannedCandidateFiles += 1;
      for (const row of eventishRows(payload)) {
        addRow(row, "london");
      }
    } catch {
      // Ignore malformed temp artifacts written by unrelated workers.
    }
  }

  return {
    existing_ids: existingIds,
    existing_source_keys: existingSourceKeys,
    existing_nhle_keys: existingNhleKeys,
    scanned_candidate_files: scannedCandidateFiles,
    corpus_event_count: corpusEventCount,
  };
}

async function queryFeatures(query) {
  return arcgisFeatures(`${NHLE_SERVICE_URL}/${query.layer_id}`, {
    where: `${query.date_field} >= timestamp '${DATE_START} 00:00:00' AND ${query.date_field} <= timestamp '${DATE_END} 23:59:59'`,
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    geometry: LONDON_BBOX,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
  });
}

async function queryDelistedFeatures() {
  return arcgisFeatures(`${DELISTED_SERVICE_URL}/${DELISTED_QUERY.layer_id}`, {
    where: `${DELISTED_QUERY.date_field} >= timestamp '${DATE_START} 00:00:00' AND ${DELISTED_QUERY.date_field} <= timestamp '${DATE_END} 23:59:59'`,
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    geometry: LONDON_BBOX,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
  });
}

function dateFieldsForSourceRow(properties) {
  const output = {};
  for (const canonical of Object.keys(DATE_FIELD_VARIANTS)) {
    output[canonical] = isoFromArcgis(properties[canonical]);
  }
  return output;
}

function candidateFromFeature(query, feature, point) {
  const properties = feature.properties || {};
  const listEntry = oneLine(properties.ListEntry);
  const eventDate = isoFromArcgis(properties[query.date_field]);
  if (!listEntry || !eventDate) {
    return null;
  }

  const name = oneLine(properties.Name || `NHLE ListEntry ${listEntry}`);
  const grade = oneLine(properties.Grade || "");
  const gradePhrase = grade ? `, Grade ${grade}` : "";
  const sourceUrl = oneLine(properties.hyperlink) || `https://historicengland.org.uk/listing/the-list/list-entry/${listEntry}`;
  const layerSlug = slug(query.layer_name, 36);
  const fieldSlug = slug(query.date_field, 20);
  const candidateId = `london-nhle-round454-${layerSlug}-${fieldSlug}-${listEntry}-${dateCompact(eventDate)}`;
  const sourceRecordId =
    `NHLE ListEntry ${listEntry}; ${query.date_field} ${eventDate}; ` +
    `OBJECTID ${properties.OBJECTID}; layer ${query.layer_id} ${query.layer_name}`;
  const note = oneLine(properties.Notes || "");
  let summary =
    `Historic England's National Heritage List for England ${query.layer_name} layer records ` +
    `${name} as ListEntry ${listEntry}${gradePhrase}, with ${query.date_field} of ${eventDate}. ` +
    `This is an administrative ${query.action_label} record, not evidence of construction, opening, ` +
    "occupation, repair, demolition, condition, impact, prediction, simulation, causation, or broader outcome evidence.";
  if (note) {
    summary += ` NHLE layer note: ${note}.`;
  }
  const canonical = canonicalDateField(query.date_field) || query.date_field;
  const isPointBacked = query.geometry_kind === "point" && feature.geometry?.type === "Point";

  return {
    city_id: "london",
    candidate_id: candidateId,
    event_id: candidateId,
    title: `${name} ${query.title_suffix}`,
    summary,
    observed_change:
      `Official NHLE administrative milestone: the ${query.layer_name} row carries the cited ${query.date_field}. ` +
      "The source does not by itself state a physical change on that date.",
    effective_date: eventDate,
    effective_date_range: null,
    date: eventDate,
    date_precision: "day",
    source_date_field: query.date_field,
    bucket: query.bucket,
    category: "architecture",
    subcategory: "heritage_administrative_status",
    project_type: query.project_type,
    record_type: query.record_type,
    designation_type: query.action_label,
    location_name: name,
    area: name,
    geometry: { type: "Point", coordinates: [Number(point[0]), Number(point[1])] },
    latitude: Number(point[1]),
    longitude: Number(point[0]),
    point_backing: isPointBacked ? "official_source_point" : "representative_point_from_official_source_geometry",
    ready_for_point_corpus: true,
    geometry_ref_only: false,
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_dataset_id: `${SOURCE_ID}-layer-${query.layer_id}`,
    source_layer_id: query.layer_id,
    source_layer_name: query.layer_name,
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official Historic England ArcGIS FeatureServer row",
    accessed_at: ACCESS_DATE,
    retrieved_at: ACCESS_DATE,
    source_retrieved_at: ACCESS_DATE,
    confidence: "documented",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: LICENSE,
    attribution: ATTRIBUTION,
    geometry_source:
      `NHLE ${query.layer_name} geometry from Historic England Open Data Hub, filtered inside ` +
      "ONS London region E12000007.",
    geometry_precision:
      "Official NHLE point or representative polygon point for locating the heritage asset; it does not define " +
      "a surveyed works area, construction footprint, complete curtilage, or condition boundary.",
    limitations:
      `NHLE ${query.date_field} documents an administrative ${query.action_label} date only. It is not evidence ` +
      "of construction, demolition, restoration, occupation, public access, condition change, heritage benefit, " +
      "impact, prediction, simulation, causation, or broader outcome evidence.",
    transformation_method:
      "scripts/fetch_round454_london_nhle_heritage_tail6_candidates.js queried the official Historic England " +
      `NHLE FeatureServer layer ${query.layer_id} (${query.layer_name}) for ${query.date_field} from ${DATE_START} ` +
      `through ${DATE_END}, filtered features to the ONS London region geometry, deduplicated against the manual ` +
      "architecture corpus and prior NHLE/candidate packs through round392 by NHLE ListEntry/date-field/date and " +
      "source keys, and normalized remaining rows into Bims-5 candidate events.",
    nhle_list_entry: listEntry,
    grade,
    source_row: {
      OBJECTID: properties.OBJECTID,
      ListEntry: properties.ListEntry,
      Name: properties.Name,
      Grade: properties.Grade,
      Notes: properties.Notes,
      NGR: properties.NGR,
      Easting: properties.Easting,
      Northing: properties.Northing,
      Latitude: properties.Latitude,
      Longitude: properties.Longitude,
      CaptureScale: properties.CaptureScale,
      area_ha: properties.area_ha,
      hyperlink: sourceUrl,
      ...dateFieldsForSourceRow(properties),
    },
    dedupe_key: `${listEntry}|${canonical}|${eventDate}`,
  };
}

function candidateFromDelistedFeature(feature, point) {
  const properties = feature.properties || {};
  const originalEntry = oneLine(properties.OriginalListEntryNumber);
  const articleUid = oneLine(properties.ARTICLEUID);
  const objectId = properties.OBJECTID;
  const eventDate = isoFromArcgis(properties.DateRemovedFromList);
  if (!eventDate || (!originalEntry && !articleUid)) {
    return null;
  }
  const recordKey = originalEntry || `article-${articleUid}`;
  const name = oneLine(properties.ARTICLEVERSIONNAME || `Historic England de-designated site ${recordKey}`);
  const category = oneLine(properties.HERITAGECATEGORYDESCRIPTION || "");
  const categoryPhrase = category ? ` (${category})` : "";
  const decisionText = oneLine(properties.DecisionText || "");
  const candidateId = `london-nhle-round454-de-designated-sites-date-removed-${recordKey}-${dateCompact(eventDate)}`;
  const sourceRecordId =
    `De-designated sites ARTICLEUID ${articleUid}; OriginalListEntryNumber ${originalEntry}; ` +
    `DateRemovedFromList ${eventDate}; OBJECTID ${objectId}; layer 0 De-designated sites`;
  let summary =
    `Historic England's De-designated sites open-data layer records ${name} as removed from the ` +
    `National Heritage List for England on ${eventDate}${categoryPhrase}. This is an administrative ` +
    "de-designation/removal record, not evidence of construction, demolition, repair, opening, occupation, " +
    "condition, impact, prediction, simulation, causation, or broader outcome evidence.";
  if (decisionText) {
    summary += ` Source decision text summary: ${decisionText}`;
  }

  return {
    city_id: "london",
    candidate_id: candidateId,
    event_id: candidateId,
    title: `${name} removed from the NHLE`,
    summary,
    observed_change:
      "Official Historic England administrative milestone: the De-designated sites row carries DateRemovedFromList. " +
      "The source does not by itself state a physical change on that date.",
    effective_date: eventDate,
    effective_date_range: null,
    date: eventDate,
    date_precision: "day",
    source_date_field: "DateRemovedFromList",
    bucket: DELISTED_QUERY.bucket,
    category: "architecture",
    subcategory: "heritage_administrative_status",
    project_type: DELISTED_QUERY.project_type,
    record_type: DELISTED_QUERY.record_type,
    designation_type: DELISTED_QUERY.action_label,
    location_name: name,
    area: name,
    geometry: { type: "Point", coordinates: [Number(point[0]), Number(point[1])] },
    latitude: Number(point[1]),
    longitude: Number(point[0]),
    point_backing: "representative_point_from_official_source_geometry",
    ready_for_point_corpus: true,
    geometry_ref_only: false,
    source_id: DELISTED_SOURCE_ID,
    source_ids: [DELISTED_SOURCE_ID],
    source_dataset_id: `${DELISTED_SOURCE_ID}-round454-tail6-layer-0`,
    source_layer_id: 0,
    source_layer_name: "De-designated sites",
    source_name: DELISTED_SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: DELISTED_DATASET_URL,
    source_record_id: sourceRecordId,
    source_type: "official Historic England ArcGIS FeatureServer row",
    accessed_at: ACCESS_DATE,
    retrieved_at: ACCESS_DATE,
    source_retrieved_at: ACCESS_DATE,
    confidence: "documented",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: LICENSE,
    attribution: ATTRIBUTION,
    geometry_source:
      "Historic England De-designated sites polygon geometry from the Open Data Hub, filtered inside " +
      "ONS London region E12000007.",
    geometry_precision:
      "Official de-designated-site polygon representative point for locating the heritage asset; it does not " +
      "define a construction footprint, demolition extent, current condition, or works area.",
    limitations:
      "DateRemovedFromList documents an administrative NHLE de-designation/removal date only. It is not evidence " +
      "of construction, demolition, restoration, occupation, public access, condition change, heritage benefit, " +
      "impact, prediction, simulation, causation, or broader outcome evidence.",
    transformation_method:
      "scripts/fetch_round454_london_nhle_heritage_tail6_candidates.js queried the official Historic England " +
      `De-designated sites FeatureServer layer 0 for DateRemovedFromList from ${DATE_START} through ${DATE_END}, ` +
      "filtered features to the ONS London region geometry, deduplicated against the manual architecture corpus " +
      "and prior NHLE/candidate packs through round392 by original NHLE list-entry/date-field/date and source keys, " +
      "and normalized remaining rows into Bims-5 candidate events.",
    nhle_list_entry: originalEntry,
    grade: "",
    source_row: {
      OBJECTID: objectId,
      ARTICLEUID: properties.ARTICLEUID,
      ARTICLEVERSIONNAME: properties.ARTICLEVERSIONNAME,
      HERITAGECATEGORYDESCRIPTION: properties.HERITAGECATEGORYDESCRIPTION,
      CaptureScale: properties.CaptureScale,
      DateRemovedFromList: eventDate,
      DecisionText: properties.DecisionText,
      DDRType: properties.DDRType,
      OriginalListEntryNumber: properties.OriginalListEntryNumber,
      Shape__Area: properties.Shape__Area,
      Shape__Length: properties.Shape__Length,
      source_url: DELISTED_DATASET_URL,
    },
    dedupe_key: `${recordKey}|DateRemovedFromList|${eventDate}`,
  };
}

function rejectionRecord(reason, query, properties = {}, detail = "") {
  const listEntry = oneLine(properties.ListEntry || properties.OriginalListEntryNumber || properties.ARTICLEUID || "");
  const sourceRecordId = listEntry
    ? query === DELISTED_QUERY
      ? `Historic England de-designated record ${listEntry}`
      : `NHLE ListEntry ${listEntry}`
    : "";
  const eventDate = isoFromArcgis(properties[query.date_field]);
  const rejected = {
    reason,
    source_record_id: sourceRecordId,
    source_date_field: query.date_field,
    date: eventDate,
    title: oneLine(properties.Name || properties.ARTICLEVERSIONNAME || ""),
    source_layer_id: query.layer_id,
    source_layer_name: query.layer_name,
  };
  if (detail) {
    rejected.detail = detail;
  }
  return rejected;
}

async function fetchCandidates(existing, londonGeometry) {
  const candidates = [];
  const rejectedRecords = [];
  const reasonCounts = {};
  const queryCounts = [];
  const seenKeys = new Set();
  let sourceRowsFetched = 0;
  const sourceRowsFetchedBySource = {
    national_heritage_list_for_england_nhle: 0,
    historic_england_de_designated_sites: 0,
  };

  const reject = (reason, query, properties = {}, detail = "") => {
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    if (rejectedRecords.length < 1000) {
      rejectedRecords.push(rejectionRecord(reason, query, properties, detail));
    }
  };

  for (const query of SOURCE_QUERIES) {
    const features = await queryFeatures(query);
    sourceRowsFetched += features.length;
    sourceRowsFetchedBySource.national_heritage_list_for_england_nhle += features.length;
    let layerCandidateCount = 0;

    for (const feature of features) {
      const properties = feature.properties || {};
      const geometry = feature.geometry;
      const point = representativePoint(geometry, londonGeometry);
      if (!point) {
        reject("geometry_ref_only_not_ready_for_point_corpus", query, properties);
        continue;
      }
      if (!pointInGeometry(point, londonGeometry)) {
        reject("outside_ons_london_region", query, properties);
        continue;
      }

      const listEntry = oneLine(properties.ListEntry);
      const eventDate = isoFromArcgis(properties[query.date_field]);
      if (!listEntry || !eventDate) {
        reject("missing_list_entry_or_date", query, properties);
        continue;
      }
      if (eventDate < DATE_START || eventDate > DATE_END) {
        reject("outside_date_window", query, properties);
        continue;
      }

      const canonical = canonicalDateField(query.date_field) || query.date_field;
      const nhleKey = `${listEntry}|${canonical}|${eventDate}`;
      if (existing.existing_nhle_keys.has(nhleKey)) {
        reject("existing_corpus_or_prior_pack_nhle_key", query, properties, nhleKey);
        continue;
      }
      if (seenKeys.has(nhleKey)) {
        reject("duplicate_within_round", query, properties, nhleKey);
        continue;
      }

      const candidate = candidateFromFeature(query, feature, point);
      if (!candidate) {
        reject("normalization_failed", query, properties);
        continue;
      }

      const sourceKey = `london|${candidate.source_url}|${candidate.source_record_id}|${canonical}|${candidate.date}`;
      if (existing.existing_ids.has(candidate.event_id)) {
        reject("existing_event_id", query, properties, candidate.event_id);
        continue;
      }
      if (existing.existing_source_keys.has(sourceKey)) {
        reject("existing_source_key", query, properties, sourceKey);
        continue;
      }

      seenKeys.add(nhleKey);
      candidates.push(candidate);
      layerCandidateCount += 1;
    }

    queryCounts.push({
      source: "National Heritage List for England (NHLE)",
      layer_id: query.layer_id,
      layer_name: query.layer_name,
      source_date_field: query.date_field,
      rows_fetched_in_london_bbox: features.length,
      candidate_count_after_dedupe: layerCandidateCount,
    });
  }

  const delistedFeatures = await queryDelistedFeatures();
  sourceRowsFetched += delistedFeatures.length;
  sourceRowsFetchedBySource.historic_england_de_designated_sites += delistedFeatures.length;
  let delistedCandidateCount = 0;

  for (const feature of delistedFeatures) {
    const properties = feature.properties || {};
    const geometry = feature.geometry;
    const point = representativePoint(geometry, londonGeometry);
    if (!point) {
      reject("geometry_ref_only_not_ready_for_point_corpus", DELISTED_QUERY, properties);
      continue;
    }
    if (!pointInGeometry(point, londonGeometry)) {
      reject("outside_ons_london_region", DELISTED_QUERY, properties);
      continue;
    }

    const originalEntry = oneLine(properties.OriginalListEntryNumber);
    const articleUid = oneLine(properties.ARTICLEUID);
    const recordKey = originalEntry || `article-${articleUid}`;
    const eventDate = isoFromArcgis(properties.DateRemovedFromList);
    if (!eventDate || (!originalEntry && !articleUid)) {
      reject("missing_record_id_or_date", DELISTED_QUERY, properties);
      continue;
    }
    if (eventDate < DATE_START || eventDate > DATE_END) {
      reject("outside_date_window", DELISTED_QUERY, properties);
      continue;
    }

    const heritageKey = `${recordKey}|DateRemovedFromList|${eventDate}`;
    if (existing.existing_nhle_keys.has(heritageKey)) {
      reject("existing_corpus_or_prior_pack_nhle_key", DELISTED_QUERY, properties, heritageKey);
      continue;
    }
    if (seenKeys.has(heritageKey)) {
      reject("duplicate_within_round", DELISTED_QUERY, properties, heritageKey);
      continue;
    }

    const candidate = candidateFromDelistedFeature(feature, point);
    if (!candidate) {
      reject("normalization_failed", DELISTED_QUERY, properties);
      continue;
    }

    const sourceKey = `london|${candidate.source_url}|${candidate.source_record_id}|DateRemovedFromList|${candidate.date}`;
    if (existing.existing_ids.has(candidate.event_id)) {
      reject("existing_event_id", DELISTED_QUERY, properties, candidate.event_id);
      continue;
    }
    if (existing.existing_source_keys.has(sourceKey)) {
      reject("existing_source_key", DELISTED_QUERY, properties, sourceKey);
      continue;
    }

    seenKeys.add(heritageKey);
    candidates.push(candidate);
    delistedCandidateCount += 1;
  }

  queryCounts.push({
    source: "Historic England De-designated sites",
    layer_id: DELISTED_QUERY.layer_id,
    layer_name: DELISTED_QUERY.layer_name,
    source_date_field: DELISTED_QUERY.date_field,
    rows_fetched_in_london_bbox: delistedFeatures.length,
    candidate_count_after_dedupe: delistedCandidateCount,
  });

  candidates.sort((a, b) =>
    [a.effective_date, a.record_type, a.source_record_id].join("|").localeCompare(
      [b.effective_date, b.record_type, b.source_record_id].join("|")
    )
  );

  return {
    source_rows_fetched: sourceRowsFetched,
    source_rows_fetched_by_source: sourceRowsFetchedBySource,
    query_counts: queryCounts,
    candidates,
    rejected_records: rejectedRecords,
    reason_counts: reasonCounts,
  };
}

function incrementMix(mix, key) {
  mix[key] = (mix[key] || 0) + 1;
}

function makeSummary(existing, result) {
  const dates = result.candidates.map((candidate) => candidate.date);
  const recordTypeMix = {};
  const sourceDateFieldMix = {};
  const designationTypeMix = {};
  const sourceLayerMix = {};
  const pointBackingMix = {};
  for (const candidate of result.candidates) {
    incrementMix(recordTypeMix, candidate.record_type);
    incrementMix(sourceDateFieldMix, candidate.source_date_field);
    incrementMix(designationTypeMix, candidate.designation_type);
    incrementMix(sourceLayerMix, `${candidate.source_layer_id} ${candidate.source_layer_name}`);
    incrementMix(pointBackingMix, candidate.point_backing || "unknown");
  }
  return {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    worker_scope: "round454 London Historic England/NHLE heritage-designation tail6",
    date_window: { start: DATE_START, end: DATE_END },
    source_rows_fetched: result.source_rows_fetched,
    source_rows_fetched_by_source: result.source_rows_fetched_by_source,
    candidate_count: result.candidates.length,
    accepted_count: result.candidates.length,
    point_backed_count: result.candidates.filter((candidate) => candidate.ready_for_point_corpus && !candidate.geometry_ref_only).length,
    official_source_point_count: result.candidates.filter((candidate) => candidate.point_backing === "official_source_point").length,
    geometry_ref_only_count: result.candidates.filter((candidate) => candidate.geometry_ref_only).length,
    pack_type: result.candidates.length ? "candidate" : "exhaustion",
    exhaustion_note: result.candidates.length
      ? null
      : "No clean deduped London NHLE or de-designated administrative rows remained after scanning the manual architecture corpus and prior NHLE/candidate packs through round392.",
    date_range: { start: dates.length ? dates[0] : null, end: dates.length ? dates[dates.length - 1] : null },
    record_type_mix: recordTypeMix,
    source_date_field_mix: sourceDateFieldMix,
    designation_type_mix: designationTypeMix,
    source_layer_mix: sourceLayerMix,
    point_backing_mix: pointBackingMix,
    query_counts: result.query_counts,
    rejected_reason_counts: result.reason_counts,
    duplicate_screening: {
      manual_corpus_path: "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
      corpus_events_scanned: existing.corpus_event_count,
      prior_candidate_pack_files_scanned: existing.scanned_candidate_files,
      explicit_prior_tail_pack_checked: "tmp/subagents/round392_london_nhle_heritage_tail5/candidates.json",
      existing_event_ids_seen: existing.existing_ids.size,
      existing_source_keys_seen: existing.existing_source_keys.size,
      existing_nhle_date_keys_seen: existing.existing_nhle_keys.size,
      dedupe_key: "NHLE ListEntry or de-designated OriginalListEntryNumber/ARTICLEUID + canonical source date field + administrative date",
      screening_note:
        "Scanned the manual architecture corpus and candidate-like tmp/subagents JSON packs, including prior Historic England/NHLE London heritage packs through round392, for event IDs, source keys, exact NHLE ListEntry/date-field/date keys, and de-designated OriginalListEntryNumber/date keys. Rejected files and raw query captures were not treated as accepted candidate packs.",
    },
    critical_interpretation_note:
      "These records are administrative heritage designation, listing, inscription, certificate/status-start or expiry, de-designation/removal, or amendment rows only. They are not evidence of construction, completion, demolition, opening, occupation, repair, condition, impact, prediction, simulation, or causation.",
    candidate_ids: result.candidates.map((candidate) => candidate.candidate_id),
  };
}

function sourceAudit(summary) {
  return {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    source_audits: [
      {
        source_id: SOURCE_ID,
        stable_id: SOURCE_ID,
        source_name: SOURCE_NAME,
        publisher: PUBLISHER,
        url: NHLE_DATA_DOWNLOADS_URL,
        source_url: NHLE_DATA_DOWNLOADS_URL,
        api_catalogue_url: NHLE_API_CATALOGUE_URL,
        api_endpoint: NHLE_SERVICE_URL,
        source_type: "official Historic England ArcGIS FeatureServer",
        license: LICENSE,
        license_url: LICENSE_URL,
        license_or_terms_note: LICENSE,
        attribution: ATTRIBUTION,
        accessed_at: ACCESS_DATE,
        retrieved_at: ACCESS_DATE,
        date_or_date_range: { start: DATE_START, end: DATE_END },
        coverage_years_checked: `${DATE_START} through ${DATE_END}`,
        update_frequency:
          "Historic England's data-download page and UK API catalogue identify the NHLE as official open data; the API catalogue states that NHLE data is updated daily.",
        geographic_scope: "England source layers; features filtered to the ONS London region E12000007.",
        geometry_ref: "Official NHLE layer geometries filtered inside the ONS London region boundary E12000007.",
        granularity: "One NHLE source row and one explicit administrative source date field.",
        method:
          "Queried the official NHLE FeatureServer layers and date fields listed below, filtered rows to ONS London region geometry, and deduped against the manual corpus plus prior NHLE/candidate packs through round392.",
        confidence: "documented source audit",
        limitations:
          "NHLE rows support administrative heritage dates only. They do not by themselves document physical works, access, condition, ownership, impact, prediction, simulation, causation, or broader outcome evidence.",
        layers_checked: SOURCE_QUERIES.map((query) => ({
          layer_id: query.layer_id,
          layer_name: query.layer_name,
          source_date_field: query.date_field,
          record_type: query.record_type,
        })),
        key_fields: [
          "OBJECTID",
          "ListEntry",
          "Name",
          "Grade",
          "ListDate",
          "AmendDate",
          "BPNStart",
          "BPNExpire",
          "COIStart",
          "COIExpire",
          "SchedDate",
          "RegDate",
          "DesigDate",
          "InscrDate",
          "hyperlink",
          "NGR",
          "Easting",
          "Northing",
          "geometry",
        ],
        reliability: "strong for official NHLE administrative source dates, with interpretation caveats",
        records_reviewed: summary.source_rows_fetched_by_source.national_heritage_list_for_england_nhle || 0,
        candidate_count: Object.entries(summary.record_type_mix)
          .filter(([recordType]) => recordType !== DELISTED_QUERY.record_type)
          .reduce((sum, [, count]) => sum + count, 0),
        required_caveats: [
          "NHLE date fields used here are administrative designation, listing, inscription, notice/certificate start or expiry, or amendment dates, not construction dates.",
          "NHLE point and polygon geometries locate heritage assets for atlas use but do not define construction areas, curtilage, condition, ownership, access, or outcomes.",
          "Use factual metadata and source URLs; list-entry page narrative text, images, logos, and map products require separate terms review before broader redistribution.",
        ],
        ingestion_recommendation:
          "Append only as documented heritage-administrative change events after the main appender re-checks corpus duplicates.",
      },
      {
        source_id: DELISTED_SOURCE_ID,
        stable_id: DELISTED_SOURCE_ID,
        source_name: DELISTED_SOURCE_NAME,
        publisher: PUBLISHER,
        url: DELISTED_DATASET_URL,
        source_url: DELISTED_DATASET_URL,
        api_item_url: DELISTED_ITEM_URL,
        api_endpoint: DELISTED_SERVICE_URL,
        source_type: "official Historic England ArcGIS FeatureServer",
        license: LICENSE,
        license_url: LICENSE_URL,
        license_or_terms_note: LICENSE,
        attribution: ATTRIBUTION,
        accessed_at: ACCESS_DATE,
        retrieved_at: ACCESS_DATE,
        date_or_date_range: { start: DATE_START, end: DATE_END },
        coverage_years_checked: `${DATE_START} through ${DATE_END}`,
        update_frequency:
          "Historic England's data-download page says the De-Designated Sites dataset includes complete removals from the NHLE since 4 April 2011 and was last updated on 2026-05-20 when checked.",
        geographic_scope: "England source layer; features filtered to the ONS London region E12000007.",
        geometry_ref: "Official de-designated-site polygon geometries filtered inside the ONS London region boundary E12000007.",
        granularity: "One de-designated source row and the DateRemovedFromList administrative field.",
        method:
          "Queried the official de-designated sites FeatureServer DateRemovedFromList field, filtered rows to ONS London region geometry, and deduped against the manual corpus plus prior NHLE/candidate packs through round392.",
        confidence: "documented source audit",
        limitations:
          "DateRemovedFromList supports an administrative removal date only. It does not by itself document physical works, access, condition, ownership, impact, prediction, simulation, causation, or broader outcome evidence.",
        layers_checked: [
          {
            layer_id: DELISTED_QUERY.layer_id,
            layer_name: DELISTED_QUERY.layer_name,
            source_date_field: DELISTED_QUERY.date_field,
            record_type: DELISTED_QUERY.record_type,
          },
        ],
        key_fields: [
          "OBJECTID",
          "ARTICLEUID",
          "ARTICLEVERSIONNAME",
          "HERITAGECATEGORYDESCRIPTION",
          "DateRemovedFromList",
          "DecisionText",
          "DDRType",
          "OriginalListEntryNumber",
          "geometry",
        ],
        reliability:
          "strong for official Historic England de-designation/removal administrative dates, with interpretation caveats",
        records_reviewed: summary.source_rows_fetched_by_source.historic_england_de_designated_sites || 0,
        candidate_count: summary.record_type_mix[DELISTED_QUERY.record_type] || 0,
        required_caveats: [
          "DateRemovedFromList is a heritage-administrative de-designation/removal date, not a demolition, construction, repair, opening, occupation, condition, or outcome date.",
          "The de-designated polygon or representative point is for atlas location only and is not evidence of current physical condition or work extent.",
          "The dataset states it covers complete removals from the NHLE since 4 April 2011 and excludes partial delisting, removal of part of an area, and duplicate-entry removals.",
        ],
        ingestion_recommendation:
          "Append only as documented heritage-administrative change events after the main appender re-checks corpus duplicates.",
      },
    ],
    supporting_boundary_source: {
      source_name: "ONS Regions December 2024 Boundaries EN BFC",
      publisher: "Office for National Statistics / Esri ArcGIS service",
      url: ONS_LONDON_REGION_URL,
      filter: "RGN24CD='E12000007'",
      use: "London region spatial inclusion test only, not event evidence.",
    },
    summary,
  };
}

function validateOutputs(pack, summary, audit, rejected, existing) {
  const errors = [];
  const warnings = [];
  const candidates = pack.candidates || [];
  const duplicateKeys = [];
  const candidateIds = new Set();
  const roundKeys = new Set();
  const sourceDateFieldMix = {};
  const recordTypeMix = {};
  const dates = [];

  if (pack.metadata?.candidate_count !== candidates.length) {
    errors.push("candidates.json metadata candidate_count does not match candidates length.");
  }
  if (summary.candidate_count !== candidates.length) {
    errors.push("summary.json candidate_count does not match candidates length.");
  }
  if (JSON.stringify(pack.metadata?.date_window) !== JSON.stringify({ start: DATE_START, end: DATE_END })) {
    errors.push("candidates metadata date_window is not the required round454 window.");
  }
  if (!audit.source_audits?.length) {
    errors.push("source_audit.json has no source_audits entries.");
  }
  if (!rejected.reason_counts || !Array.isArray(rejected.records)) {
    errors.push("rejected.json missing reason_counts or records.");
  }

  candidates.forEach((candidate, index) => {
    const label = candidate.candidate_id || `row ${index}`;
    for (const field of REQUIRED_FIELDS) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${label} missing required field ${field}.`);
      }
    }
    if (candidate.geometry_ref_only) {
      warnings.push(`${label} is geometry_ref_only and not ready for the point-only corpus.`);
      if (candidate.ready_for_point_corpus) {
        errors.push(`${label} is geometry_ref_only but ready_for_point_corpus is true.`);
      }
      return;
    }
    for (const field of ["latitude", "longitude"]) {
      if (typeof candidate[field] !== "number" || !Number.isFinite(candidate[field])) {
        errors.push(`${label} ${field} is not numeric.`);
      }
    }
    if (candidate.city_id !== "london") {
      errors.push(`${label} city_id is not london.`);
    }
    if (candidate.accessed_at !== ACCESS_DATE || candidate.retrieved_at !== ACCESS_DATE) {
      errors.push(`${label} accessed_at/retrieved_at is not ${ACCESS_DATE}.`);
    }
    const date = isoFromArcgis(candidate.date);
    if (!date || candidate.effective_date !== date) {
      errors.push(`${label} has mismatched or invalid date/effective_date.`);
    } else if (date < DATE_START || date > DATE_END) {
      errors.push(`${label} date outside required window.`);
    } else {
      dates.push(date);
    }
    if (!Object.prototype.hasOwnProperty.call(DATE_FIELD_VARIANTS, candidate.source_date_field)) {
      errors.push(`${label} has unsupported source_date_field ${candidate.source_date_field}.`);
    }
    if (candidate.confidence !== "documented") {
      errors.push(`${label} confidence is not documented.`);
    }
    const limitations = oneLine(candidate.limitations).toLowerCase();
    if (!limitations.includes("not evidence of construction")) {
      errors.push(`${label} limitations do not clearly block construction-date interpretation.`);
    }
    const [minLon, minLat, maxLon, maxLat] = LONDON_BBOX_NUMERIC;
    if (!(minLon <= candidate.longitude && candidate.longitude <= maxLon && minLat <= candidate.latitude && candidate.latitude <= maxLat)) {
      errors.push(`${label} coordinates outside coarse London bbox.`);
    }
    const coords = candidate.geometry?.coordinates || [];
    if (
      coords.length !== 2 ||
      Math.abs(Number(coords[0]) - candidate.longitude) > 1e-9 ||
      Math.abs(Number(coords[1]) - candidate.latitude) > 1e-9
    ) {
      errors.push(`${label} geometry coordinates do not match latitude/longitude.`);
    }
    if (candidateIds.has(label)) {
      errors.push(`Duplicate candidate_id ${label}.`);
    }
    candidateIds.add(label);
    if (!candidate.dedupe_key || !/^(?:\d{6,8}|article-\d{6,8})\|[A-Za-z]+\|\d{4}-\d{2}-\d{2}$/.test(candidate.dedupe_key)) {
      errors.push(`${label} has invalid dedupe_key ${candidate.dedupe_key}.`);
    } else {
      const extracted = extractNhleKeys(candidate);
      if (!extracted.has(candidate.dedupe_key)) {
        errors.push(`${label} dedupe_key is not supported by candidate source fields.`);
      }
      if (roundKeys.has(candidate.dedupe_key)) {
        errors.push(`Duplicate NHLE/admin key within round454: ${candidate.dedupe_key}.`);
      }
      roundKeys.add(candidate.dedupe_key);
      if (existing.existing_nhle_keys.has(candidate.dedupe_key)) {
        duplicateKeys.push(candidate.dedupe_key);
      }
    }
    incrementMix(sourceDateFieldMix, candidate.source_date_field);
    incrementMix(recordTypeMix, candidate.record_type);
  });

  if (duplicateKeys.length) {
    errors.push(`Round454 candidates duplicate existing NHLE/admin keys: ${duplicateKeys.slice(0, 20).join(", ")}`);
  }
  const expectedRange = { start: dates.length ? dates.sort()[0] : null, end: dates.length ? dates.sort()[dates.length - 1] : null };
  if (JSON.stringify(summary.date_range) !== JSON.stringify(expectedRange)) {
    errors.push("summary date_range does not match candidate dates.");
  }
  if (JSON.stringify(summary.source_date_field_mix) !== JSON.stringify(sourceDateFieldMix)) {
    errors.push("summary source_date_field_mix does not match candidates.");
  }
  if (JSON.stringify(summary.record_type_mix) !== JSON.stringify(recordTypeMix)) {
    errors.push("summary record_type_mix does not match candidates.");
  }

  return {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    passed: errors.length === 0,
    errors,
    warnings,
    candidate_count: candidates.length,
    accepted_count: candidates.length,
    point_backed_count: candidates.filter((candidate) => candidate.ready_for_point_corpus && !candidate.geometry_ref_only).length,
    official_source_point_count: candidates.filter((candidate) => candidate.point_backing === "official_source_point").length,
    geometry_ref_only_count: candidates.filter((candidate) => candidate.geometry_ref_only).length,
    date_range: expectedRange,
    source_date_field_mix: sourceDateFieldMix,
    record_type_mix: recordTypeMix,
    independent_duplicate_scan: {
      manual_corpus_events_scanned: existing.corpus_event_count,
      prior_candidate_pack_files_scanned: existing.scanned_candidate_files,
      existing_nhle_or_admin_keys_seen: existing.existing_nhle_keys.size,
      duplicate_keys_found: duplicateKeys,
    },
  };
}

function makeReadback(summary, validationReport, rejected) {
  const artifacts = [
    "candidates.json",
    "rejected.json",
    "validation_report.json",
    "source_audit.json",
    "summary.json",
    "readback.json",
    "notes.md",
  ];
  const files = {};
  for (const name of artifacts) {
    const filePath = path.join(OUT_DIR, name);
    files[name] = {
      exists: fs.existsSync(filePath),
      size_bytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    };
    if (name.endsWith(".json") && fs.existsSync(filePath) && name !== "readback.json") {
      try {
        readJson(filePath);
        files[name].json_readback_ok = true;
      } catch (error) {
        files[name].json_readback_ok = false;
        files[name].error = error.message;
      }
    }
  }
  return {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    passed:
      validationReport.passed &&
      Object.values(files).every((details) => details.exists) &&
      Object.values(files).every((details) => details.json_readback_ok !== false),
    files,
    pack_type: summary.pack_type,
    candidate_count: summary.candidate_count,
    accepted_count: summary.accepted_count,
    point_backed_count: summary.point_backed_count,
    date_range: summary.date_range,
    source_rows_fetched: summary.source_rows_fetched,
    source_rows_fetched_by_source: summary.source_rows_fetched_by_source,
    source_names: [SOURCE_NAME, DELISTED_SOURCE_NAME],
    event_source_publishers: [PUBLISHER],
    rejected_reason_counts: rejected.reason_counts,
    duplicate_screening: summary.duplicate_screening,
    critical_interpretation_note: summary.critical_interpretation_note,
  };
}

function notesMd(summary, validationReport) {
  const lines = [
    "# Round454 London NHLE Heritage Tail6",
    "",
    "This pack re-runs the official Historic England/NHLE London heritage administrative-source sweep after the earlier London NHLE packs through round392.",
    "",
    `- Accessed: ${ACCESS_DATE}`,
    `- Date window: ${DATE_START} through ${DATE_END}`,
    `- Source rows fetched across all official Historic England queries: ${summary.source_rows_fetched}`,
    `- NHLE source rows fetched: ${summary.source_rows_fetched_by_source.national_heritage_list_for_england_nhle || 0}`,
    `- De-designated source rows fetched: ${summary.source_rows_fetched_by_source.historic_england_de_designated_sites || 0}`,
    `- Accepted candidate count: ${summary.accepted_count}`,
    `- Point-backed count: ${summary.point_backed_count}`,
    `- Date range: ${summary.date_range.start} to ${summary.date_range.end}`,
    `- Pack type: ${summary.pack_type}`,
    `- Manual corpus events scanned: ${summary.duplicate_screening.corpus_events_scanned}`,
    `- Prior candidate pack JSON files scanned: ${summary.duplicate_screening.prior_candidate_pack_files_scanned}`,
    `- Validation passed: ${validationReport.passed}`,
    "",
  ];
  if (summary.exhaustion_note) {
    lines.push(summary.exhaustion_note, "");
  }
  lines.push("Rejected reason counts:", "");
  for (const [reason, count] of Object.entries(summary.rejected_reason_counts).sort()) {
    lines.push(`- ${reason}: ${count}`);
  }
  lines.push(
    "",
    "Caveat: these are administrative Historic England/NHLE dates only. Do not treat designation, listing, inscription, certificate/status-start or expiry, amendment, or de-designation/removal dates as construction, demolition, repair, opening, occupation, condition, impact, prediction, simulation, or causal evidence.",
    ""
  );
  return lines.join("\n");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const existing = scanExisting();
  const londonGeometry = await londonRegionGeometry();
  const result = await fetchCandidates(existing, londonGeometry);
  const summary = makeSummary(existing, result);
  const pack = {
    metadata: {
      schema_version: "round454_london_nhle_heritage_tail6_candidates_v1",
      generated_at: `${ACCESS_DATE}T00:00:00Z`,
      city_id: "london",
      source_id: SOURCE_ID,
      date_window: { start: DATE_START, end: DATE_END },
      candidate_count: result.candidates.length,
      point_backed_count: summary.point_backed_count,
      geometry_ref_only_count: summary.geometry_ref_only_count,
      critical_interpretation_note: summary.critical_interpretation_note,
      duplicate_screening: summary.duplicate_screening,
    },
    candidates: result.candidates,
  };
  const rejected = {
    generated_at: `${ACCESS_DATE}T00:00:00Z`,
    reason_counts: result.reason_counts,
    records: result.rejected_records,
    record_limit_note: "Detailed rejected records are capped at 1000 examples; reason_counts contains full counts.",
  };
  const audit = sourceAudit(summary);
  const validationReport = validateOutputs(pack, summary, audit, rejected, existing);

  writeJson(CANDIDATES_PATH, pack);
  writeJson(REJECTED_PATH, rejected);
  writeJson(SOURCE_AUDIT_PATH, audit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(VALIDATION_REPORT_PATH, validationReport);
  fs.writeFileSync(NOTES_PATH, notesMd(summary, validationReport), "utf8");
  writeJson(READBACK_PATH, makeReadback(summary, validationReport, rejected));
  writeJson(READBACK_PATH, makeReadback(summary, validationReport, rejected));

  console.log(JSON.stringify({ summary, validation_report: validationReport }, null, 2));
  if (!validationReport.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
