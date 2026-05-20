const fs = require("fs");
const path = require("path");

const RETRIEVED_AT = "2026-05-19";
const OUT_DIR = "tmp/subagents/round156_belfast_official_heritage_tail";
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");

const MANUAL_CORPUS_PATH = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const BELFAST_BOUNDARY_PATH = "data/2026/belfastboudnary2026.geojson";

const PRIOR_PACK_PATHS = [
  "tmp/subagents/round128_belfast_harni_spatial/candidates.json",
  "tmp/subagents/round130_belfast_official_more/candidates.json",
  "tmp/subagents/round141_belfast_harni_gaps/candidates.json"
];

const PREVIOUS_ROUND156_PATH = CANDIDATES_PATH;

const SERVICE_ROOT =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const HED_SERVICE_PAGE =
  "https://admin.opendatani.gov.uk/dataset/historic-environment-division-esri-rest-api";
const HED_MAP_VIEWER_PAGE =
  "https://www.communities-ni.gov.uk/services/historic-environment-map-viewer";
const DEFENCE_PAGE = "https://www.communities-ni.gov.uk/articles/defence-heritage";
const INDUSTRIAL_PAGE = "https://www.communities-ni.gov.uk/articles/industrial-archaeology";
const LISTED_BUILDINGS_PAGE = "https://admin.opendatani.gov.uk/tl/dataset/listed-buildings-northern-ireland";
const SCHEDULED_AREAS_PAGE = "https://admin.opendatani.gov.uk/dataset/scheduled-historic-monument-areas";
const HARNI_PAGE = "https://apps.communities-ni.gov.uk/HARNI/";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const LAYERS = {
  sitesAndMonuments: {
    id: 0,
    name: "Sites and Monuments Record",
    fields: ["OBJECTID", "MONID", "SMRNo", "Townland_s_", "Edited_Type", "General_Type", "Protection", "Grid_Reference"]
  },
  historicBuildings: {
    id: 1,
    objectIdField: "OBJECTID_1",
    name: "Historic Buildings Record / Listed Buildings",
    fields: [
      "OBJECTID_1",
      "HB_ref",
      "CurrentGra",
      "Address",
      "Extent",
      "Date_Const",
      "CurrentUse",
      "FormerUse",
      "Vernacular",
      "Thatched",
      "Derelict",
      "Townland",
      "Council",
      "TxtIGRef",
      "ChkSS",
      "MainID",
      "ObjectID",
      "BU_ID"
    ]
  },
  industrial: {
    id: 2,
    sourceId: "dfc-hed-industrial-heritage-belfast-round156",
    name: "Industrial Heritage Records",
    fields: ["OBJECTID", "MIAID", "CO", "TD", "IHR", "LOCATION", "GRIDREF", "X_TYPE", "INSERTDATE", "UPDATEDATE"]
  },
  harni: {
    id: 3,
    sourceId: "dfc-harni-belfast",
    name: "Heritage at Risk",
    fields: [
      "OBJECTID",
      "HB_Ref",
      "BHARNI_Ref",
      "Address",
      "Category",
      "Ownership",
      "Date_Added",
      "LGD",
      "County",
      "Main_ID"
    ]
  },
  defence: {
    id: 4,
    sourceId: "dfc-hed-defence-heritage-belfast-round156",
    name: "Defence Heritage",
    fields: [
      "OBJECTID",
      "dhr_number",
      "site_name",
      "county",
      "townland",
      "site_type",
      "period",
      "general_history",
      "Site_Description",
      "associated_dhr",
      "associated_dhr_description",
      "smr_reference",
      "smr_further_info",
      "hb_reference",
      "hb_further_info",
      "condition",
      "condition_detail",
      "visibility",
      "land_use",
      "land_use_details",
      "existing_protection",
      "Other_Sources",
      "date_visited",
      "grid_ref",
      "Site_Visited"
    ]
  },
  wrecks: {
    id: 5,
    objectIdField: "OBJECTID_1",
    name: "Ship and Aircraft Wrecks",
    fields: ["OBJECTID_1", "record_id", "year_lost", "date_lost", "type", "condition", "historic_s"]
  },
  archaeologicalPotential: {
    id: 6,
    name: "Areas of Archaeological Potential",
    fields: ["OBJECTID", "ID", "REFERENCE", "CATEGORY", "ADDRESS", "LGD"]
  },
  significantInterest: {
    id: 7,
    name: "Areas of Significant Archaeological Interest",
    fields: ["OBJECTID", "REFERENCE", "CATEGORY", "LGD"]
  },
  battlesites: {
    id: 8,
    name: "Battlesites",
    fields: ["OBJECTID", "MAIN_REF", "TYPE", "GRIDREF"]
  },
  parks: {
    id: 9,
    name: "Historic Parks, Gardens and Demesnes",
    fields: ["OBJECTID", "REF_NO", "SITE", "STATUS", "Grade", "COUNCIL", "CF_HB", "CF_SMR"]
  },
  scheduledZones: {
    id: 10,
    sourceId: "dfc-hed-scheduled-zones-belfast-round130",
    name: "Scheduled Zones",
    fields: ["OBJECTID", "COUNTY", "SMNO", "TOWNLAND", "EDITED_TYP", "DC", "BFILE", "COMMENTS", "Date_added", "Centroid_X", "Centroid_Y"]
  }
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function safeSlug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96) || "record";
}

function isoDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString().slice(0, 10);
  }
  const text = cleanText(value);
  if (!text) return "";
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return "";
}

function inWindow(date) {
  return date >= "2008-01-01" && date <= RETRIEVED_AT;
}

function rowQueryUrl(layerId, objectId, fields, objectIdField = "OBJECTID") {
  const params = new URLSearchParams({
    where: `${objectIdField}=${Number(objectId)}`,
    outFields: fields.join(","),
    returnGeometry: "true",
    f: "geojson"
  });
  return `${SERVICE_ROOT}/${layerId}/query?${params.toString()}`;
}

function pointFromFeature(feature) {
  const coordinates = feature.geometry?.coordinates || [];
  if (feature.geometry?.type === "Point" && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
    return {
      longitude: Number(coordinates[0]),
      latitude: Number(coordinates[1])
    };
  }
  return null;
}

function ringsFromGeometry(geometry) {
  const rings = [];
  if (!geometry) return rings;
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates || []) rings.push(ring);
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates || []) {
      for (const ring of polygon || []) rings.push(ring);
    }
  }
  return rings;
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const xi = ring[index][0];
    const yi = ring[index][1];
    const xj = ring[previous][0];
    const yj = ring[previous][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function loadBelfastBoundary() {
  const geojson = readJson(BELFAST_BOUNDARY_PATH);
  const rings = [];
  for (const feature of geojson.features || []) {
    rings.push(...ringsFromGeometry(feature.geometry));
  }
  if (!rings.length) throw new Error(`No polygon rings found in ${BELFAST_BOUNDARY_PATH}`);
  return {
    source_path: BELFAST_BOUNDARY_PATH,
    source_name: cleanText(geojson.features?.[0]?.properties?.source || "Local Belfast boundary GeoJSON"),
    source_url: cleanText(geojson.features?.[0]?.properties?.source_url || ""),
    rings
  };
}

function pointInsideBoundary(point, boundary) {
  return boundary.rings.some((ring) => pointInRing([point.longitude, point.latitude], ring));
}

async function fetchLayerFeatures(layer, options = {}) {
  const where = options.where || "1=1";
  const resultRecordCount = options.resultRecordCount || 2000;
  const returnGeometry = options.returnGeometry !== false;
  const features = [];
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      where,
      outFields: layer.fields.join(","),
      returnGeometry: returnGeometry ? "true" : "false",
      resultOffset: String(offset),
      resultRecordCount: String(resultRecordCount),
      orderByFields: options.orderByFields || layer.objectIdField || "OBJECTID",
      f: returnGeometry ? "geojson" : "json"
    });
    const url = `${SERVICE_ROOT}/${layer.id}/query?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${layer.name} fetch failed: ${response.status} ${response.statusText}`);
    const json = await response.json();
    if (json.error) throw new Error(`${layer.name} ArcGIS error: ${JSON.stringify(json.error)}`);
    const page = returnGeometry
      ? json.features || []
      : (json.features || []).map((feature) => ({
          type: "Feature",
          properties: feature.attributes || {},
          geometry: null
        }));
    features.push(...page);
    if (page.length < resultRecordCount) break;
    offset += page.length;
  }
  return features;
}

async function fetchLayerCount(layer, where = "1=1") {
  const params = new URLSearchParams({
    where,
    returnCountOnly: "true",
    f: "json"
  });
  const response = await fetch(`${SERVICE_ROOT}/${layer.id}/query?${params.toString()}`);
  if (!response.ok) throw new Error(`${layer.name} count failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  if (json.error) throw new Error(`${layer.name} ArcGIS count error: ${JSON.stringify(json.error)}`);
  return Number(json.count || 0);
}

async function fetchLayerSample(layer, where = "1=1", resultRecordCount = 5) {
  const params = new URLSearchParams({
    where,
    outFields: layer.fields.join(","),
    returnGeometry: "false",
    resultRecordCount: String(resultRecordCount),
    orderByFields: layer.objectIdField || "OBJECTID",
    f: "json"
  });
  const response = await fetch(`${SERVICE_ROOT}/${layer.id}/query?${params.toString()}`);
  if (!response.ok) throw new Error(`${layer.name} sample failed: ${response.status} ${response.statusText}`);
  const json = await response.json();
  if (json.error) throw new Error(`${layer.name} ArcGIS sample error: ${JSON.stringify(json.error)}`);
  return (json.features || []).map((feature) => feature.attributes || feature.properties || {});
}

function extractRefsFromText(value, regex) {
  const refs = new Set();
  const text = String(value || "");
  for (const match of text.matchAll(regex)) {
    refs.add(normalizeKey(match[1] || match[0]));
  }
  return [...refs].filter(Boolean);
}

function minimalExistingRecord(record) {
  return {
    candidate_id: record.candidate_id || "",
    event_id: record.event_id || record.id || record.event_id_suggestion || "",
    date: record.date || record.effective_date || "",
    title: record.title || "",
    source_record_id: record.source_record_id || record.provenance?.source_record_id || "",
    source_url: record.source_url || record.provenance?.source_url || ""
  };
}

function addIndex(map, key, record) {
  if (!key) return;
  if (!map.has(key)) map.set(key, minimalExistingRecord(record));
}

function addRecordToIndex(index, record) {
  const recordId = record.source_record_id || record.provenance?.source_record_id || "";
  const sourceUrl = record.source_url || record.provenance?.source_url || "";
  const id = record.candidate_id || record.event_id || record.id || record.event_id_suggestion || "";
  const text = JSON.stringify(record);

  addIndex(index.sourceRecordIds, normalizeKey(recordId), record);
  addIndex(index.sourceUrls, normalizeKey(sourceUrl), record);
  addIndex(index.ids, normalizeKey(id), record);
  for (const ref of extractRefsFromText(`${recordId} ${text}`, /\bDHR[:\s]*([0-9]{5}:[0-9]{3})\b/gi)) {
    addIndex(index.dhrNumbers, ref, record);
  }
  for (const ref of extractRefsFromText(`${recordId} ${text}`, /\bIHR\s*([0-9]{5}:[0-9]{3}:[0-9]{2})\b/gi)) {
    addIndex(index.ihrRefs, `ihr ${ref}`, record);
  }
  for (const ref of extractRefsFromText(`${recordId} ${text}`, /\bBHARNI[:\s]*([0-9]{2}\/[0-9]{2}\/[0-9]{3})\b/gi)) {
    addIndex(index.bharniRefs, ref, record);
  }
  for (const ref of extractRefsFromText(`${recordId} ${text}`, /\bSMNO[:\s]*([0-9]{3}[:/][0-9A-Za-z]+|[0-9]{3}:MULTIPLE)\b/gi)) {
    addIndex(index.scheduledRefs, ref.replace(/\//g, ":"), record);
  }
}

function buildExistingIndex() {
  const index = {
    sourceRecordIds: new Map(),
    sourceUrls: new Map(),
    ids: new Map(),
    dhrNumbers: new Map(),
    ihrRefs: new Map(),
    bharniRefs: new Map(),
    scheduledRefs: new Map(),
    packCounts: {}
  };

  if (fs.existsSync(MANUAL_CORPUS_PATH)) {
    const manual = readJson(MANUAL_CORPUS_PATH);
    const events = manual.events || [];
    index.packCounts[MANUAL_CORPUS_PATH] = events.length;
    for (const event of events) addRecordToIndex(index, event);
  }

  for (const packPath of PRIOR_PACK_PATHS) {
    if (!fs.existsSync(packPath)) {
      index.packCounts[packPath] = null;
      continue;
    }
    const doc = readJson(packPath);
    const candidates = doc.candidates || [];
    index.packCounts[packPath] = candidates.length;
    for (const candidate of candidates) addRecordToIndex(index, candidate);
  }

  let previousRound156 = null;
  if (fs.existsSync(PREVIOUS_ROUND156_PATH)) {
    const doc = readJson(PREVIOUS_ROUND156_PATH);
    previousRound156 = doc.candidates || [];
  }

  return { index, previousRound156 };
}

function duplicateMatch(candidate, index) {
  const recordId = normalizeKey(candidate.source_record_id);
  const sourceUrl = normalizeKey(candidate.source_url);
  const id = normalizeKey(candidate.candidate_id);
  if (index.sourceRecordIds.has(recordId)) {
    return { duplicate: true, reason: "source_record_id_match", matched_record: index.sourceRecordIds.get(recordId) };
  }
  if (index.sourceUrls.has(sourceUrl)) {
    return { duplicate: true, reason: "source_url_match", matched_record: index.sourceUrls.get(sourceUrl) };
  }
  if (index.ids.has(id)) {
    return { duplicate: true, reason: "candidate_or_event_id_match", matched_record: index.ids.get(id) };
  }
  if (candidate.source_family_key === "defence_heritage") {
    const dhr = normalizeKey(candidate.source_fields?.dhr_number || "");
    if (dhr && index.dhrNumbers.has(dhr)) {
      return { duplicate: true, reason: "dhr_number_match", matched_key: dhr, matched_record: index.dhrNumbers.get(dhr) };
    }
  }
  if (candidate.source_family_key === "industrial_heritage") {
    const ihr = normalizeKey(candidate.source_fields?.IHR || "");
    if (ihr && index.ihrRefs.has(ihr)) {
      return { duplicate: true, reason: "ihr_reference_match", matched_key: ihr, matched_record: index.ihrRefs.get(ihr) };
    }
  }
  return { duplicate: false };
}

function countBy(rows, selector) {
  return rows.reduce((counts, row) => {
    const key = cleanText(selector(row)) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function makeDefenceCandidate(feature, boundary) {
  const row = feature.properties || {};
  const point = pointFromFeature(feature);
  if (!point) {
    return { rejected: true, reason: "missing_point_geometry", source_family: "defence_heritage", raw_row: row };
  }
  if (!pointInsideBoundary(point, boundary)) {
    return {
      rejected: true,
      reason: "outside_local_belfast_boundary_filter",
      source_family: "defence_heritage",
      source_record_id: `DHR:${cleanText(row.dhr_number) || "not supplied"}; OBJECTID:${cleanText(row.OBJECTID) || "not supplied"}; HED layer:4`,
      raw_row: row
    };
  }

  const date = isoDate(row.date_visited);
  if (!date || !inWindow(date)) {
    return {
      rejected: true,
      reason: "missing_or_out_of_window_date_visited",
      source_family: "defence_heritage",
      source_record_id: `DHR:${cleanText(row.dhr_number) || "not supplied"}; OBJECTID:${cleanText(row.OBJECTID) || "not supplied"}; HED layer:4`,
      raw_row: row
    };
  }

  const dhrNumber = cleanText(row.dhr_number);
  const objectId = cleanText(row.OBJECTID);
  const siteType = cleanText(row.site_type || "defence heritage site").replace(/_/g, " ");
  const condition = cleanText(row.condition || "condition not supplied").replace(/_/g, " ");
  const conditionDetail = cleanText(row.condition_detail);
  const siteName = cleanText(row.site_name);
  const townland = cleanText(row.townland).replace(/_/g, " ");
  const area = [siteName, townland].filter(Boolean).join(", ") || `DHR ${dhrNumber || objectId}`;
  const sourceUrl = rowQueryUrl(LAYERS.defence.id, objectId, LAYERS.defence.fields);
  const safeRef = safeSlug(dhrNumber || objectId || `${point.longitude}_${point.latitude}`);
  const titlePlace = siteName || townland || `DHR ${dhrNumber || objectId}`;

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: `round156_belfast_dfc_defence_heritage_${safeRef}_date_visited_${date}`,
    event_id_suggestion: `bfs_arch_round156_dfc_defence_heritage_${safeRef}_date_visited_${date.replace(/-/g, "_")}`,
    date,
    effective_date: date,
    effective_date_range: null,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_status",
    event_family: "architecture/heritage-status",
    milestone_type: "defence_heritage_record_date_visited",
    title: `HED Defence Heritage recorded ${condition} condition for ${titlePlace}`,
    summary:
      `The Department for Communities Historic Environment Division Defence Heritage layer records ${area} in Belfast with Date Visited ${date}, ` +
      `DHR number ${dhrNumber || "not supplied"}, site type '${siteType}', condition '${condition}', ` +
      `site visited flag '${cleanText(row.Site_Visited) || "not supplied"}' and OBJECTID ${objectId || "not supplied"}.`,
    observed_change:
      `Official HED Defence Heritage source milestone: the source row carries date_visited ${date}, condition '${condition}', ` +
      `and site type '${siteType}' for ${area}. This is a heritage register/inspection/source-record observation, not evidence of construction, repair completion, vacancy, occupancy, demolition timing, ownership change, final condition outcome or causal effects unless separately sourced.`,
    area,
    latitude: Number(point.latitude.toFixed(6)),
    longitude: Number(point.longitude.toFixed(6)),
    geometry: {
      type: "Point",
      coordinates: [Number(point.longitude.toFixed(6)), Number(point.latitude.toFixed(6))]
    },
    geometry_ref: sourceUrl,
    source_id: LAYERS.defence.sourceId,
    source_ids: [LAYERS.defence.sourceId],
    source_family_key: "defence_heritage",
    source_name: "Defence Heritage Record ArcGIS layer",
    publisher: "Department for Communities Historic Environment Division",
    source_url: sourceUrl,
    source_record_id: `DHR:${dhrNumber || "not supplied"}; OBJECTID:${objectId || "not supplied"}; HED layer:4`,
    source_type: "official DfC/HED ArcGIS Defence Heritage feature row",
    accessed_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: "date_visited",
    source_date_value: date,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: "defence heritage condition/status register observation",
    geometry_source:
      "Point geometry from the official Department for Communities Historic Environment Division Defence Heritage ArcGIS layer; local Belfast boundary was used only to scope records to Belfast.",
    geometry_precision:
      "Official Defence Heritage point for the register entry; not a measured building footprint, parcel boundary, works extent or legal designation boundary.",
    license: "UK Open Government Licence (OGL)",
    license_url: OGL_URL,
    license_or_terms_note:
      "OpenDataNI/HED public GIS factual data is treated as public sector information under the UK Open Government Licence where applicable; images, logos, base maps and third-party content are excluded. Retain DfC/HED attribution and verify portal terms before production import.",
    attribution: "Contains public sector information from Department for Communities Historic Environment Division licensed under the UK Open Government Licence.",
    limitations:
      "The date_visited field is an official heritage register/source observation date. The condition and condition_detail fields may reflect site survey, desk review or record maintenance depending on Site_Visited and row notes. Do not treat this row as construction, repair completion, vacancy, occupancy, demolition timing, ownership change, final condition outcome or causal evidence unless another source directly supports that narrower claim.",
    source_fields: {
      OBJECTID: row.OBJECTID ?? "",
      dhr_number: row.dhr_number ?? "",
      site_name: row.site_name ?? "",
      site_type: row.site_type ?? "",
      condition: row.condition ?? "",
      condition_detail: row.condition_detail ?? "",
      existing_protection: row.existing_protection ?? "",
      date_visited: row.date_visited ?? "",
      date_visited_iso: date,
      Site_Visited: row.Site_Visited ?? "",
      grid_ref: row.grid_ref ?? ""
    },
    raw_row: {
      OBJECTID: row.OBJECTID,
      dhr_number: row.dhr_number,
      site_name: row.site_name,
      county: row.county,
      townland: row.townland,
      site_type: row.site_type,
      period: row.period,
      general_history: row.general_history,
      Site_Description: row.Site_Description,
      associated_dhr: row.associated_dhr,
      associated_dhr_description: row.associated_dhr_description,
      smr_reference: row.smr_reference,
      smr_further_info: row.smr_further_info,
      hb_reference: row.hb_reference,
      hb_further_info: row.hb_further_info,
      condition: row.condition,
      condition_detail: row.condition_detail,
      visibility: row.visibility,
      land_use: row.land_use,
      land_use_details: row.land_use_details,
      existing_protection: row.existing_protection,
      Other_Sources: row.Other_Sources,
      date_visited: row.date_visited,
      date_visited_iso: date,
      grid_ref: row.grid_ref,
      Site_Visited: row.Site_Visited
    },
    source_comment: conditionDetail || null,
    belfast_scope_filter: {
      method: "point_inside_local_belfast_boundary_geojson",
      boundary_path: BELFAST_BOUNDARY_PATH,
      boundary_source: boundary.source_name,
      boundary_source_url: boundary.source_url
    },
    transformation_method:
      "scripts/fetch_round156_belfast_official_heritage_tail_candidates.js queried the official DfC/HED Defence Heritage ArcGIS layer, scoped point rows to Belfast using the local boundary, normalized date_visited and geometry, preserved row-level provenance, and deduped against the manual corpus plus rounds 128, 130 and 141."
  };
}

function makeIndustrialCandidate(feature, boundary) {
  const row = feature.properties || {};
  const point = pointFromFeature(feature);
  if (!point) {
    return { rejected: true, reason: "missing_point_geometry", source_family: "industrial_heritage", raw_row: row };
  }
  if (!pointInsideBoundary(point, boundary)) {
    return {
      rejected: true,
      reason: "outside_local_belfast_boundary_filter",
      source_family: "industrial_heritage",
      source_record_id: `IHR:${cleanText(row.IHR) || "not supplied"}; OBJECTID:${cleanText(row.OBJECTID) || "not supplied"}; HED layer:2`,
      raw_row: row
    };
  }

  const insertDate = isoDate(row.INSERTDATE);
  const updateDate = isoDate(row.UPDATEDATE);
  const date = updateDate && inWindow(updateDate) ? updateDate : insertDate;
  const sourceDateField = updateDate && inWindow(updateDate) ? "UPDATEDATE" : "INSERTDATE";
  if (!date || !inWindow(date)) {
    return {
      rejected: true,
      reason: "missing_or_out_of_window_insert_or_update_date",
      source_family: "industrial_heritage",
      source_record_id: `IHR:${cleanText(row.IHR) || "not supplied"}; OBJECTID:${cleanText(row.OBJECTID) || "not supplied"}; HED layer:2`,
      raw_row: row
    };
  }

  const ihr = cleanText(row.IHR);
  const objectId = cleanText(row.OBJECTID);
  const type = cleanText(row.X_TYPE || "industrial heritage record");
  const townland = cleanText(row.TD);
  const location = cleanText(row.LOCATION);
  const area = [location, townland].filter(Boolean).join(", ") || `IHR ${ihr || objectId}`;
  const safeRef = safeSlug(ihr || objectId || `${point.longitude}_${point.latitude}`);
  const sourceUrl = rowQueryUrl(LAYERS.industrial.id, objectId, LAYERS.industrial.fields);

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: `round156_belfast_dfc_industrial_heritage_${safeRef}_${sourceDateField.toLowerCase()}_${date}`,
    event_id_suggestion: `bfs_arch_round156_dfc_industrial_heritage_${safeRef}_${sourceDateField.toLowerCase()}_${date.replace(/-/g, "_")}`,
    date,
    effective_date: date,
    effective_date_range: null,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_status",
    event_family: "architecture/heritage-status",
    milestone_type: "industrial_heritage_record_insert_or_update_date",
    title: `HED Industrial Heritage recorded ${type} at ${townland || area}`,
    summary:
      `The Department for Communities Historic Environment Division Industrial Heritage Records layer records ${type} in Belfast with ${sourceDateField} ${date}, ` +
      `IHR reference ${ihr || "not supplied"}, townland '${townland || "not supplied"}' and OBJECTID ${objectId || "not supplied"}.`,
    observed_change:
      `Official HED Industrial Heritage source milestone: the source row carries ${sourceDateField} ${date} for ${type} at ${area}. ` +
      "This is a heritage register/source-maintenance observation, not evidence of construction, repair completion, vacancy, occupancy, demolition timing, ownership change, condition outcome or causal effects unless separately sourced.",
    area,
    latitude: Number(point.latitude.toFixed(6)),
    longitude: Number(point.longitude.toFixed(6)),
    geometry: {
      type: "Point",
      coordinates: [Number(point.longitude.toFixed(6)), Number(point.latitude.toFixed(6))]
    },
    geometry_ref: sourceUrl,
    source_id: LAYERS.industrial.sourceId,
    source_ids: [LAYERS.industrial.sourceId],
    source_family_key: "industrial_heritage",
    source_name: "Industrial Heritage Records ArcGIS layer",
    publisher: "Department for Communities Historic Environment Division",
    source_url: sourceUrl,
    source_record_id: `IHR:${ihr || "not supplied"}; OBJECTID:${objectId || "not supplied"}; HED layer:2`,
    source_type: "official DfC/HED ArcGIS Industrial Heritage feature row",
    accessed_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: sourceDateField,
    source_date_value: date,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: "industrial heritage register/source-maintenance observation",
    geometry_source:
      "Point geometry from the official Department for Communities Historic Environment Division Industrial Heritage Records ArcGIS layer; local Belfast boundary was used only to scope records to Belfast.",
    geometry_precision:
      "Official Industrial Heritage point for the register entry; not a measured building footprint, parcel boundary, works extent or legal designation boundary.",
    license: "UK Open Government Licence (OGL)",
    license_url: OGL_URL,
    license_or_terms_note:
      "OpenDataNI/HED public GIS factual data is treated as public sector information under the UK Open Government Licence where applicable; images, logos, base maps and third-party content are excluded. Retain DfC/HED attribution and verify portal terms before production import.",
    attribution: "Contains public sector information from Department for Communities Historic Environment Division licensed under the UK Open Government Licence.",
    limitations:
      "INSERTDATE and UPDATEDATE are official source/register maintenance fields. Most Industrial Heritage rows are location-only records compiled from historic-map and survey sources; this row must not be used as evidence of physical works, construction, closure, demolition, occupancy, ownership, condition outcome or causal effects unless another source directly supports that narrower claim.",
    source_fields: {
      OBJECTID: row.OBJECTID ?? "",
      MIAID: row.MIAID ?? "",
      CO: row.CO ?? "",
      TD: row.TD ?? "",
      IHR: row.IHR ?? "",
      LOCATION: row.LOCATION ?? "",
      GRIDREF: row.GRIDREF ?? "",
      X_TYPE: row.X_TYPE ?? "",
      INSERTDATE: row.INSERTDATE ?? "",
      INSERTDATE_iso: insertDate,
      UPDATEDATE: row.UPDATEDATE ?? "",
      UPDATEDATE_iso: updateDate
    },
    raw_row: {
      OBJECTID: row.OBJECTID,
      MIAID: row.MIAID,
      CO: row.CO,
      TD: row.TD,
      IHR: row.IHR,
      LOCATION: row.LOCATION,
      GRIDREF: row.GRIDREF,
      X_TYPE: row.X_TYPE,
      INSERTDATE: row.INSERTDATE,
      INSERTDATE_iso: insertDate,
      UPDATEDATE: row.UPDATEDATE,
      UPDATEDATE_iso: updateDate
    },
    source_comment: null,
    belfast_scope_filter: {
      method: "point_inside_local_belfast_boundary_geojson",
      boundary_path: BELFAST_BOUNDARY_PATH,
      boundary_source: boundary.source_name,
      boundary_source_url: boundary.source_url
    },
    transformation_method:
      "scripts/fetch_round156_belfast_official_heritage_tail_candidates.js queried the official DfC/HED Industrial Heritage Records ArcGIS layer, scoped point rows to Belfast using the local boundary, normalized INSERTDATE/UPDATEDATE and geometry, preserved row-level provenance, and deduped against the manual corpus plus rounds 128, 130 and 141."
  };
}

function requireCandidateFields(candidates) {
  const requiredFields = [
    "candidate_id",
    "event_id_suggestion",
    "date",
    "effective_date",
    "bucket",
    "title",
    "summary",
    "observed_change",
    "source_id",
    "source_url",
    "source_record_id",
    "publisher",
    "accessed_at",
    "source_date_field",
    "confidence",
    "geometry",
    "geometry_source",
    "geometry_precision",
    "license",
    "license_url",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "raw_row",
    "source_fields",
    "transformation_method"
  ];
  const ids = new Set();
  const recordIds = new Set();
  for (const candidate of candidates) {
    if (ids.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    if (recordIds.has(candidate.source_record_id)) throw new Error(`Duplicate source_record_id ${candidate.source_record_id}`);
    recordIds.add(candidate.source_record_id);
    for (const field of requiredFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        throw new Error(`${candidate.candidate_id} missing required field ${field}`);
      }
    }
    if (!inWindow(candidate.date)) throw new Error(`${candidate.candidate_id} has out-of-window date ${candidate.date}`);
    if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude)) {
      throw new Error(`${candidate.candidate_id} has invalid coordinates`);
    }
    if (!/not evidence of construction|not physical works|not evidence of physical works/i.test(candidate.observed_change + " " + candidate.limitations)) {
      throw new Error(`${candidate.candidate_id} missing overclaim caveat`);
    }
  }
}

async function buildSourceScreens(boundary) {
  const [
    defenceRows,
    industrialRows,
    harniRows,
    scheduledRows,
    historicBuildingsRows,
    parksRows,
    sitesCount,
    aapCount,
    asaiCount,
    battlesiteCount,
    wreckCount
  ] = await Promise.all([
    fetchLayerFeatures(LAYERS.defence),
    fetchLayerFeatures(LAYERS.industrial),
    fetchLayerFeatures(LAYERS.harni, { where: "LGD='Belfast'", returnGeometry: false }),
    fetchLayerFeatures(LAYERS.scheduledZones, { where: "DC='Belfast'", returnGeometry: false }),
    fetchLayerFeatures(LAYERS.historicBuildings, { where: "Council='Belfast'", returnGeometry: false }),
    fetchLayerFeatures(LAYERS.parks, { where: "COUNCIL='BELFAST'", returnGeometry: false }),
    fetchLayerCount(LAYERS.sitesAndMonuments),
    fetchLayerCount(LAYERS.archaeologicalPotential, "LGD='Belfast'"),
    fetchLayerCount(LAYERS.significantInterest, "LGD='Belfast'"),
    fetchLayerCount(LAYERS.battlesites),
    fetchLayerCount(LAYERS.wrecks)
  ]);

  const defenceScreen = defenceRows.map((feature) => makeDefenceCandidate(feature, boundary));
  const industrialScreen = industrialRows.map((feature) => makeIndustrialCandidate(feature, boundary));

  const harniDateRows = harniRows.filter((feature) => inWindow(isoDate(feature.properties?.Date_Added)));
  const scheduledDateRows = scheduledRows.filter((feature) => inWindow(isoDate(feature.properties?.Date_added)));
  const parksBelfastRows = parksRows;

  return {
    defenceRows,
    industrialRows,
    defenceScreen,
    industrialScreen,
    auditScreens: {
      harni: {
        total_rows_seen: harniRows.length,
        eligible_date_rows: harniDateRows.length,
        candidate_decision: "not_emitted_prior_rounds_exhausted",
        rejection_reason:
          "HARNI has Date_Added, but Belfast HARNI rows were already covered by round128 and round141/manual-corpus dedupe. This round records it as checked rather than forcing duplicates.",
        sample_rows: harniDateRows.slice(0, 5).map((feature) => ({
          OBJECTID: feature.properties?.OBJECTID,
          BHARNI_Ref: feature.properties?.BHARNI_Ref,
          HB_Ref: feature.properties?.HB_Ref,
          Address: cleanText(feature.properties?.Address),
          Category: cleanText(feature.properties?.Category),
          Date_Added: feature.properties?.Date_Added,
          Date_Added_iso: isoDate(feature.properties?.Date_Added)
        }))
      },
      scheduledZones: {
        total_rows_seen: scheduledRows.length,
        eligible_date_rows: scheduledDateRows.length,
        candidate_decision: "not_emitted_prior_rounds_exhausted",
        rejection_reason:
          "Scheduled Zones has Date_added, but Belfast dated rows were already covered by round130/manual-corpus dedupe. This round records it as checked rather than forcing duplicates.",
        sample_rows: scheduledDateRows.slice(0, 5).map((feature) => ({
          OBJECTID: feature.properties?.OBJECTID,
          SMNO: feature.properties?.SMNO,
          TOWNLAND: feature.properties?.TOWNLAND,
          EDITED_TYP: feature.properties?.EDITED_TYP,
          Date_added: feature.properties?.Date_added,
          Date_added_iso: isoDate(feature.properties?.Date_added)
        }))
      },
      historicBuildings: {
        total_rows_seen: historicBuildingsRows.length,
        candidate_decision: "not_emitted_no_defensible_2008_2026_event_date",
        rejection_reason:
          "Historic Buildings/Listed Buildings rows expose CurrentGra, CurrentUse, Derelict, Date_Const and Second Survey flags, but no public row-level listing/status/change date in the 2008-2026 window. Date_Const is a construction era and is not a modern event date.",
        sample_rows: historicBuildingsRows.slice(0, 5).map((feature) => ({
          OBJECTID_1: feature.properties?.OBJECTID_1,
          HB_ref: feature.properties?.HB_ref,
          CurrentGra: feature.properties?.CurrentGra,
          Address: cleanText(feature.properties?.Address),
          Date_Const: feature.properties?.Date_Const,
          CurrentUse: feature.properties?.CurrentUse,
          Derelict: feature.properties?.Derelict,
          Council: feature.properties?.Council
        }))
      },
      parks: {
        total_rows_seen: parksBelfastRows.length,
        candidate_decision: "not_emitted_no_defensible_2008_2026_event_date",
        rejection_reason:
          "Historic Parks, Gardens and Demesnes rows expose status, grade and council, but no row-level designation/change/status date in the public ArcGIS fields.",
        sample_rows: parksBelfastRows.slice(0, 5).map((feature) => ({
          OBJECTID: feature.properties?.OBJECTID,
          REF_NO: feature.properties?.REF_NO,
          SITE: feature.properties?.SITE,
          STATUS: feature.properties?.STATUS,
          Grade: feature.properties?.Grade,
          COUNCIL: feature.properties?.COUNCIL
        }))
      },
      sitesAndMonuments: {
        total_rows_seen: sitesCount,
        candidate_decision: "not_emitted_no_modern_event_date",
        rejection_reason:
          "Sites and Monuments Record rows expose type, period, protection and grid reference, but no row-level 2008-2026 source date/status-change field in the public layer."
      },
      archaeologicalPotential: {
        total_rows_seen: aapCount,
        candidate_decision: "not_emitted_no_row_level_event_date",
        rejection_reason:
          "Areas of Archaeological Potential rows expose category/address/LGD, but no row-level date/status-change field."
      },
      significantInterest: {
        total_rows_seen: asaiCount,
        candidate_decision: "not_emitted_no_row_level_event_date",
        rejection_reason:
          "Areas of Significant Archaeological Interest rows expose category/LGD, but no row-level date/status-change field."
      },
      battlesites: {
        total_rows_seen: battlesiteCount,
        candidate_decision: "not_emitted_no_modern_event_date",
        rejection_reason:
          "Battlesites rows are historic-place records and do not expose a row-level 2008-2026 architecture/status-change date."
      },
      wrecks: {
        total_rows_seen: wreckCount,
        candidate_decision: "not_emitted_out_of_scope_for_architecture_tail",
        rejection_reason:
          "Ship and Aircraft Wrecks expose loss dates and condition, but are maritime/aviation wreck records rather than Belfast architecture/building-status rows for this candidate pack."
      }
    }
  };
}

function buildSourceAudits(summary, auditScreens) {
  return [
    {
      source_id: "dfc-hed-esri-rest-api",
      source_name: "Historic Environment Division GIS Data FeatureServer",
      publisher: "Department for Communities Historic Environment Division",
      source_url: HED_SERVICE_PAGE,
      api_endpoint: SERVICE_ROOT,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      license_or_terms_note:
        "OpenDataNI/HED public GIS factual data is treated as public sector information under the UK Open Government Licence where applicable; images, logos, base maps and third-party content are excluded.",
      coverage_years_checked: `HED public GIS layers checked on ${RETRIEVED_AT}; service metadata reported current update published 2026-05-06 during this pass.`,
      update_frequency: "Monthly according to HED service/OpenDataNI metadata.",
      geographic_scope: "Northern Ireland public HED GIS layers; Belfast rows scoped by layer Council/LGD/DC fields where present or by local Belfast boundary for point layers without LGD.",
      key_fields_used: "Layer metadata, row OBJECTID/reference fields, date_visited, INSERTDATE, UPDATEDATE, Date_Added, Date_added, current grade/status fields and geometries.",
      reliability: "strong for official register/source rows; usable with caveats for city-change candidate events",
      required_caveats:
        "The service is an authoritative public snapshot for HED map-viewer use, not a legal declaration document or physical-works observation. Preserve accessed_at and row URL for review.",
      ingestion_recommendation:
        "Use only rows with defensible row-level source dates/status observations. Keep legal/admin/source-maintenance caveats attached to every event."
    },
    {
      source_id: LAYERS.defence.sourceId,
      source_name: "Defence Heritage Record ArcGIS layer",
      publisher: "Department for Communities Historic Environment Division",
      source_url: DEFENCE_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.defence.id}`,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      license_or_terms_note:
        "DfC/HED factual public data reused with OGL attribution where applicable; publication images, base maps, logos and third-party material are excluded.",
      coverage_years_checked: `Belfast-scoped Defence Heritage rows with date_visited from 2008-01-01 through ${RETRIEVED_AT}.`,
      update_frequency: "HED GIS service is monthly; DfC describes the Defence Heritage Record survey project as 2020-2024 with records available through the map viewer.",
      geographic_scope: "Belfast point records selected from Defence Heritage by point-in-local-Belfast-boundary because the layer does not expose LGD/Council fields.",
      key_fields_used: LAYERS.defence.fields.join(", "),
      reliability: "strong for official defence-heritage register/condition observations; usable with caveats for city-change events",
      required_caveats:
        "date_visited is a source/register observation date. Site_Visited can be yes/no/null, so do not overstate fieldwork. Condition text is not proof of construction, demolition timing, repair completion, vacancy, occupancy, ownership change, final outcome or causation.",
      ingestion_recommendation:
        "Recommended as Belfast heritage/building-status tail candidates with explicit source-observation caveats and row-level OBJECTID/DHR provenance.",
      row_counts: summary.sources.defence_heritage
    },
    {
      source_id: LAYERS.industrial.sourceId,
      source_name: "Industrial Heritage Records ArcGIS layer",
      publisher: "Department for Communities Historic Environment Division",
      source_url: INDUSTRIAL_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.industrial.id}`,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      license_or_terms_note:
        "DfC/HED factual public data reused with OGL attribution where applicable; publication images, base maps, logos and third-party material are excluded.",
      coverage_years_checked: `Belfast-scoped Industrial Heritage rows with INSERTDATE or UPDATEDATE from 2008-01-01 through ${RETRIEVED_AT}.`,
      update_frequency: "HED GIS service is monthly; DfC notes the Industrial Heritage Record is largely a record of industry-related sites compiled from historic maps and survey sources.",
      geographic_scope: "Belfast point records selected from Industrial Heritage Records by point-in-local-Belfast-boundary because the layer does not expose LGD/Council fields.",
      key_fields_used: LAYERS.industrial.fields.join(", "),
      reliability: "strong for official source/register inserted/update dates; limited for real-world change without corroboration",
      required_caveats:
        "INSERTDATE/UPDATEDATE are register maintenance fields and must not be treated as construction, demolition, closure, occupancy, ownership, condition outcome or causal evidence.",
      ingestion_recommendation:
        "Recommended only for the small dated Belfast inserted-date tail. Most Industrial Heritage rows are rejected because they lack 2008-2026 row-level dates.",
      row_counts: summary.sources.industrial_heritage
    },
    {
      source_id: "dfc-harni-belfast",
      source_name: "Heritage at Risk in Northern Ireland ArcGIS layer",
      publisher: "Department for Communities Historic Environment Division",
      source_url: HARNI_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.harni.id}`,
      license: "UK Open Government Licence (OGL) / HARNI site terms caveat",
      license_url: OGL_URL,
      coverage_years_checked: `Belfast HARNI rows with Date_Added from 2008-01-01 through ${RETRIEVED_AT}.`,
      update_frequency: "Record-specific HARNI updates through HED.",
      geographic_scope: "Belfast HARNI rows where LGD='Belfast'.",
      key_fields_used: LAYERS.harni.fields.join(", "),
      reliability: "strong for official HARNI register/status dates; already exhausted in prior packs",
      required_caveats:
        "Date_Added is a heritage risk/register date, not construction, repair completion, vacancy, occupancy, demolition timing, ownership change, condition outcome or causal evidence.",
      ingestion_recommendation: "Do not emit in round156. Prior rounds 128 and 141/manual corpus already cover this source.",
      row_counts: auditScreens.harni
    },
    {
      source_id: "dfc-hed-scheduled-zones-belfast-round130",
      source_name: "Scheduled Historic Monument Areas / Scheduled Zones",
      publisher: "Department for Communities Historic Environment Division",
      source_url: SCHEDULED_AREAS_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.scheduledZones.id}`,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      coverage_years_checked: `Belfast Scheduled Zones rows with Date_added from 2008-01-01 through ${RETRIEVED_AT}.`,
      update_frequency: "Monthly in HED service; OpenDataNI page may list quarterly for dataset exports.",
      geographic_scope: "Belfast Scheduled Zones where DC='Belfast'.",
      key_fields_used: LAYERS.scheduledZones.fields.join(", "),
      reliability: "strong for official scheduled-zone source/register dates; already exhausted in prior packs",
      required_caveats:
        "Date_added is a heritage designation/register/source-maintenance date, not construction, excavation, repair, demolition, opening, condition or causal evidence.",
      ingestion_recommendation: "Do not emit in round156. Prior round130/manual corpus already covers the dated Belfast rows.",
      row_counts: auditScreens.scheduledZones
    },
    {
      source_id: "dfc-hed-historic-buildings-listed-buildings",
      source_name: "Historic Buildings Record / Listed Buildings Northern Ireland",
      publisher: "Department for Communities Historic Environment Division",
      source_url: LISTED_BUILDINGS_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.historicBuildings.id}`,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      coverage_years_checked: `Belfast listed-building rows checked on ${RETRIEVED_AT}.`,
      update_frequency: "Monthly according to OpenDataNI listed-buildings page.",
      geographic_scope: "Belfast rows where Council='Belfast'.",
      key_fields_used: LAYERS.historicBuildings.fields.join(", "),
      reliability: "strong for current listed-building snapshot; reject for 2008-2026 event candidates without a row-level listing/change date",
      required_caveats:
        "Current grade/current use/derelict fields are a snapshot. Date_Const is construction-era metadata, not a modern listing/status-change date.",
      ingestion_recommendation:
        "Audit-only for this round. Do not force candidates until a row-level listing/revision/status date is available.",
      row_counts: auditScreens.historicBuildings
    },
    {
      source_id: "dfc-hed-historic-parks-gardens-demesnes",
      source_name: "Historic Parks, Gardens and Demesnes",
      publisher: "Department for Communities Historic Environment Division",
      source_url: HED_MAP_VIEWER_PAGE,
      api_endpoint: `${SERVICE_ROOT}/${LAYERS.parks.id}`,
      license: "UK Open Government Licence (OGL)",
      license_url: OGL_URL,
      coverage_years_checked: `Belfast rows checked on ${RETRIEVED_AT}.`,
      update_frequency: "HED GIS service is monthly.",
      geographic_scope: "Belfast rows where COUNCIL='BELFAST'.",
      key_fields_used: LAYERS.parks.fields.join(", "),
      reliability: "strong for current register geography; reject for 2008-2026 event candidates without row-level dates",
      required_caveats:
        "Status and grade are current snapshot fields in the public layer; no row-level date supports a 2008-2026 event candidate.",
      ingestion_recommendation: "Audit-only for this round.",
      row_counts: auditScreens.parks
    }
  ];
}

function buildNotes(summary) {
  return [
    "# Round156 Belfast Official Heritage Tail Candidate Pack",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "## Candidate Output",
    "",
    `- Total candidates emitted: ${summary.candidate_count}`,
    `- Defence Heritage candidates: ${summary.sources.defence_heritage.emitted_candidates}`,
    `- Industrial Heritage candidates: ${summary.sources.industrial_heritage.emitted_candidates}`,
    "",
    "## Source/Date Coverage",
    "",
    `- Defence Heritage date_visited range: ${summary.sources.defence_heritage.emitted_date_range.min || "none"} to ${summary.sources.defence_heritage.emitted_date_range.max || "none"}.`,
    `- Industrial Heritage INSERTDATE/UPDATEDATE range: ${summary.sources.industrial_heritage.emitted_date_range.min || "none"} to ${summary.sources.industrial_heritage.emitted_date_range.max || "none"}.`,
    "",
    "## Checked But Not Emitted",
    "",
    "- HARNI and Scheduled Zones were checked but not emitted because they were already covered by rounds 128, 130 and 141/manual-corpus dedupe.",
    "- Historic Buildings / Listed Buildings and Historic Parks were checked but not emitted because the public layers do not expose a defensible row-level 2008-2026 event/status-change date. Listed-building Date_Const is a construction-era field, not a modern listing date.",
    "- Sites and Monuments, Areas of Archaeological Potential, Areas of Significant Archaeological Interest, Battlesites and Ship/Aircraft Wrecks were audit-only for this round because their public fields either lack a relevant modern event date or are out of scope for Belfast architecture/building-status candidates.",
    "",
    "## Caveat",
    "",
    "Heritage register/status dates are legal/admin/source-maintenance observations. They are not construction, repair completion, vacancy, occupancy, demolition timing, ownership change, condition outcome or causal evidence unless separately sourced.",
    "",
    "## Deduplication",
    "",
    `The script deduped against ${MANUAL_CORPUS_PATH} and prior packs ${PRIOR_PACK_PATHS.join(", ")} using source_record_id, source_url, candidate/event IDs and source-specific DHR/IHR references. Existing round156 output is read only to report overlap because this script overwrites its own output deterministically.`,
    ""
  ].join("\n");
}

function dateRange(candidates) {
  const dates = candidates.map((candidate) => candidate.date).filter(Boolean).sort();
  return {
    min: dates[0] || null,
    max: dates[dates.length - 1] || null
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.error("[round156] Loading Belfast boundary and prior dedupe indexes...");
  const boundary = loadBelfastBoundary();
  const { index, previousRound156 } = buildExistingIndex();
  console.error("[round156] Fetching official HED source screens...");
  const screens = await buildSourceScreens(boundary);
  console.error("[round156] Normalizing and deduping candidates...");

  const sourceCandidates = [
    ...screens.defenceScreen.filter((row) => !row.rejected),
    ...screens.industrialScreen.filter((row) => !row.rejected)
  ];

  const candidates = [];
  const duplicateRejects = [];
  for (const candidate of sourceCandidates) {
    const match = duplicateMatch(candidate, index);
    if (match.duplicate) {
      duplicateRejects.push({
        rejected: true,
        reason: match.reason,
        source_family: candidate.source_family_key,
        candidate_id: candidate.candidate_id,
        date: candidate.date,
        title: candidate.title,
        source_record_id: candidate.source_record_id,
        matched_key: match.matched_key || "",
        matched_record: match.matched_record
      });
    } else {
      candidates.push(candidate);
    }
  }

  candidates.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.source_id.localeCompare(b.source_id) ||
      a.source_record_id.localeCompare(b.source_record_id)
  );

  requireCandidateFields(candidates);
  console.error("[round156] Building output artifacts...");

  const screenRejects = [...screens.defenceScreen, ...screens.industrialScreen].filter((row) => row.rejected);
  const previousRound156Keys = new Set((previousRound156 || []).map((candidate) => normalizeKey(candidate.source_record_id)));
  const overlapWithPreviousRound156 = candidates.filter((candidate) => previousRound156Keys.has(normalizeKey(candidate.source_record_id))).length;
  const defenceCandidates = candidates.filter((candidate) => candidate.source_family_key === "defence_heritage");
  const industrialCandidates = candidates.filter((candidate) => candidate.source_family_key === "industrial_heritage");

  const summary = {
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    candidate_count: candidates.length,
    source_rows_seen: {
      defence_heritage_total_rows: screens.defenceRows.length,
      industrial_heritage_total_rows: screens.industrialRows.length
    },
    sources: {
      defence_heritage: {
        source_id: LAYERS.defence.sourceId,
        total_source_rows_seen: screens.defenceRows.length,
        belfast_date_window_rows_before_dedupe: screens.defenceScreen.filter((row) => !row.rejected).length,
        emitted_candidates: defenceCandidates.length,
        duplicate_rejects: duplicateRejects.filter((row) => row.source_family === "defence_heritage").length,
        emitted_date_range: dateRange(defenceCandidates),
        emitted_by_year: countBy(defenceCandidates, (candidate) => candidate.date.slice(0, 4)),
        emitted_by_condition: countBy(defenceCandidates, (candidate) => candidate.source_fields.condition),
        emitted_by_site_visited_flag: countBy(defenceCandidates, (candidate) => candidate.source_fields.Site_Visited),
        source_date_field: "date_visited"
      },
      industrial_heritage: {
        source_id: LAYERS.industrial.sourceId,
        total_source_rows_seen: screens.industrialRows.length,
        belfast_date_window_rows_before_dedupe: screens.industrialScreen.filter((row) => !row.rejected).length,
        emitted_candidates: industrialCandidates.length,
        duplicate_rejects: duplicateRejects.filter((row) => row.source_family === "industrial_heritage").length,
        emitted_date_range: dateRange(industrialCandidates),
        emitted_by_year: countBy(industrialCandidates, (candidate) => candidate.date.slice(0, 4)),
        source_date_fields: ["INSERTDATE", "UPDATEDATE"]
      }
    },
    dedupe: {
      manual_corpus_path: MANUAL_CORPUS_PATH,
      prior_pack_paths: PRIOR_PACK_PATHS,
      indexed_record_counts: index.packCounts,
      duplicate_reject_count: duplicateRejects.length,
      duplicate_reason_counts: countBy(duplicateRejects, (row) => row.reason),
      previous_round156_path: PREVIOUS_ROUND156_PATH,
      previous_round156_candidate_count: previousRound156 ? previousRound156.length : 0,
      overlap_with_previous_round156_source_records: overlapWithPreviousRound156,
      note:
        "Previous round156 output is read only for overlap reporting. The script overwrites this worker-owned output deterministically rather than appending duplicates."
    },
    rejection_summary: {
      screen_reject_count: screenRejects.length,
      screen_reject_reason_counts: countBy(screenRejects, (row) => `${row.source_family}:${row.reason}`),
      audit_only_sources: screens.auditScreens
    },
    boundary_filter: {
      source_path: boundary.source_path,
      source_name: boundary.source_name,
      source_url: boundary.source_url,
      use_note:
        "The local Belfast boundary is used only for source screening on point layers without LGD/Council fields. The event geometry/provenance remains the official HED row geometry and row URL."
    },
    output_files: {
      candidates: CANDIDATES_PATH,
      source_audit: SOURCE_AUDIT_PATH,
      summary: SUMMARY_PATH,
      notes: NOTES_PATH,
      rejected: REJECTED_PATH
    },
    caveat:
      "Heritage register/status dates are legal/admin/source-maintenance observations, not construction, repair completion, vacancy, occupancy, demolition timing, ownership change, condition outcome or causal evidence unless separately sourced."
  };

  const sourceAudit = {
    schema_version: "round156.belfast_official_heritage_tail.source_audit.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    scope:
      "Official DfC/HED/OpenDataNI ArcGIS heritage and building-status sources for Belfast, focusing on rows not already exhausted by Belfast planning-statistics work and prior HARNI/Scheduled Zone packs.",
    recommendation:
      "Emit Defence Heritage date_visited rows and the small Industrial Heritage INSERTDATE tail as source-observation candidates only. Do not force listed-building/current-register snapshots without row-level modern event dates.",
    source_audits: buildSourceAudits(summary, screens.auditScreens),
    sources_checked: screens.auditScreens,
    caveat: summary.caveat
  };

  const rejectedPayload = {
    schema_version: "round156.belfast_official_heritage_tail.rejected.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    rejected_count: screenRejects.length + duplicateRejects.length,
    duplicate_rejects: duplicateRejects,
    screen_reject_summary: summary.rejection_summary.screen_reject_reason_counts,
    screen_reject_samples: screenRejects.slice(0, 60),
    audit_only_sources: screens.auditScreens
  };

  const candidatesPayload = {
    schema_version: "round156.belfast_official_heritage_tail.candidates.v1",
    generated_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    candidate_count: candidates.length,
    source_ids: [LAYERS.defence.sourceId, LAYERS.industrial.sourceId],
    source_urls: [DEFENCE_PAGE, INDUSTRIAL_PAGE, SERVICE_ROOT],
    deduped_against: [MANUAL_CORPUS_PATH, ...PRIOR_PACK_PATHS],
    scope_note:
      "Official DfC/HED heritage/building-status source-observation candidates for Belfast. Dates are register/status/source-maintenance observations, not physical works or causal claims.",
    candidates
  };

  writeJson(CANDIDATES_PATH, candidatesPayload);
  writeJson(SOURCE_AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTED_PATH, rejectedPayload);
  fs.writeFileSync(NOTES_PATH, buildNotes(summary));
  console.error("[round156] Wrote output artifacts.");

  console.log(
    JSON.stringify(
      {
        candidates: candidates.length,
        defence_heritage: summary.sources.defence_heritage,
        industrial_heritage: summary.sources.industrial_heritage,
        duplicate_rejects: duplicateRejects.length,
        screen_rejects: screenRejects.length,
        out_dir: OUT_DIR
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
