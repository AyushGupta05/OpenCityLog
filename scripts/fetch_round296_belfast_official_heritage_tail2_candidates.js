const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round296_belfast_official_heritage_tail2";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const SERVICE_ROOT =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const BUILDINGS_LAYER_ID = 1;
const BUILDINGS_FIELDS = [
  "OBJECTID_1",
  "HB_ref",
  "Address",
  "CurrentGra",
  "CurrentUse",
  "Townland",
  "Council",
  "TxtIGRef",
  "MainID"
];

const MANUAL_CORPUS = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);

const OUTPUTS = {
  candidates: path.join(OUT_DIR, "candidates.json"),
  sourceAudit: path.join(OUT_DIR, "source_audit.json"),
  summary: path.join(OUT_DIR, "summary.json"),
  notes: path.join(OUT_DIR, "notes.md"),
  rejected: path.join(OUT_DIR, "rejected.json"),
  validation: path.join(OUT_DIR, "validation.json"),
  validationReport: path.join(OUT_DIR, "validation_report.json")
};

const SOURCES = {
  hedBuildings: {
    source_id: "dfc-hed-buildings-database-round296",
    source_name: "Historic Building Details / HED Buildings Database",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    license: "Crown copyright / nidirect terms for page content; factual metadata and source URLs retained for review.",
    license_url: "https://www.nidirect.gov.uk/crown-copyright",
    attribution: "Department for Communities Historic Environment Division / nidirect",
    source_type: "official HED Buildings Database historic-building record"
  },
  bccJan2018Additions: {
    source_id: "bcc-hed-additions-to-list-january-2018-round296",
    source_name: "Appendix 3: Additions to the List of Buildings of Special Architectural or Historic Interest in Belfast City Council",
    publisher: "Belfast City Council / Northern Ireland Environment Agency / Department for Communities",
    source_url:
      "https://minutes.belfastcity.gov.uk/%28S%28xhe05jzjdwiv1tvargp0uh45%29%29/documents/s69633/Planning%20January%202018%20Listed%20Buildings%20App%203%20-%20Additions%20to%20List%20of%20Listed%20Buildings.pdf",
    license: "Belfast City Council public committee document; factual metadata and source URLs retained pending full reuse review.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    source_type: "official council committee appendix carrying HED additions-to-list records"
  },
  bccStreetSigns2021: {
    source_id: "bcc-hed-street-signs-formal-listing-2021-round296",
    source_name: "HED Listing - Street Signs",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url:
      "https://minutes.belfastcity.gov.uk/%28S%281w3lda453fhw0f55xyxindbs%29%29/documents/s90925/20210420HEDListingStreetSigns.pdf",
    license: "Belfast City Council public committee document; factual metadata and source URLs retained pending full reuse review.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    source_type: "official council committee report recording HED formal listing confirmation"
  },
  bccBotanic2024: {
    source_id: "bcc-hed-botanic-gates-formal-listing-2024-round296",
    source_name: "HED Listing Structures - Confirmation: Botanic Gardens gate screens",
    publisher: "Belfast City Council / Department for Communities Historic Environment Division",
    source_url:
      "https://minutes.belfastcity.gov.uk/documents/s114549/20240416HEDListingStructuresConfirmationBotanicGateScreens.pdf",
    license: "Belfast City Council public committee document; factual metadata and source URLs retained pending full reuse review.",
    license_url: "https://www.belfastcity.gov.uk/terms-conditions",
    attribution: "Belfast City Council / Department for Communities Historic Environment Division",
    source_type: "official council committee report recording HED formal listing confirmation"
  },
  dfcNewListings2025: {
    source_id: "dfc-hed-new-listings-january-2025-round296",
    source_name: "DfC HED Changes to the List - new listings PDF",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://www.communities-ni.gov.uk/sites/default/files/2026-02/dfc-hed-new-listings.pdf",
    license: "Department for Communities public document; factual metadata and source URLs retained pending full reuse review.",
    license_url: "https://www.communities-ni.gov.uk/copyright",
    attribution: "Department for Communities Historic Environment Division",
    source_type: "official DfC/HED changes-to-list PDF"
  }
};

const SOURCE_RECORDS = [
  {
    source: "hedBuildings",
    hb_ref: "HB26/50/280",
    date: "2008-08-11",
    date_precision: "day",
    source_date_field: "HED Buildings Database Date of Listing",
    source_date_value: "11/08/2008 00:00:00",
    milestone_type: "listed_building_designation",
    milestone_family: "listing",
    title_prefix: "HED Buildings Database recorded listed status for",
    area: "Frames Snooker Hall, 2/14 Little Donegall Street",
    source_url: "https://apps.communities-ni.gov.uk/Buildings/buildview.aspx?id=13953&js=false",
    source_record_id: "HB26/50/280",
    source_note:
      "The official HED Buildings Database record exposes Date of Listing 11/08/2008 for HB26/50/280. Date is a statutory/admin heritage record date, not construction or refurbishment."
  },
  {
    source: "hedBuildings",
    hb_ref: "HB26/50/190",
    date: "2015-08-21",
    date_precision: "day",
    source_date_field: "HED Buildings Database Date of De-listing",
    source_date_value: "21/08/2015 00:00:00",
    milestone_type: "listed_building_de_listing",
    milestone_family: "delisting",
    title_prefix: "HED Buildings Database recorded de-listed status for",
    area: "Imperial House, 4-10 Donegall Square East",
    source_url: "https://apps.communities-ni.gov.uk/Buildings/buildview.aspx?id=5206&js=false",
    source_record_id: "HB26/50/190",
    source_note:
      "The official HED Buildings Database record exposes Date of De-listing 21/08/2015 for HB26/50/190. Date is a statutory/admin heritage record date, not demolition or redevelopment."
  },
  ...[
    ["HB26/18/082", "30 Malone Park, Belfast BT9 6NJ"],
    ["HB26/30/005", "38-44 Great Victoria Street, Belfast BT2 7BA"],
    ["HB26/17/023 A", "8 Bladon Park, Belfast BT9 5LH"],
    ["HB26/17/023 B", "14-16 Bladon Park, Belfast BT9 5LG"],
    ["HB26/01/075 A", "40 St. Johns Park, Belfast BT7 3JG"],
    ["HB26/01/075 B", "12 St Johns Avenue, Belfast BT7 3JE"],
    ["HB26/01/080", "46 Hampton Park, Belfast BT7 3JP"],
    ["HB26/01/089", "16 Knockbreda Park, Belfast BT6 0HB"],
    ["HB26/17/069", "The Crags including gate piers, 29 New Forge Lane, Belfast BT9 5NU"],
    ["HB26/17/122 A", "1 Sans Souci Lane, Belfast BT9 5QY"],
    ["HB26/17/122 B", "3 Sans Souci Lane, Belfast BT9 5QY"]
  ].map(([hb_ref, area]) => ({
    source: "bccJan2018Additions",
    hb_ref,
    date: "2018-01",
    effective_date_range: { start: "2018-01-01", end: "2018-01-31" },
    date_precision: "month",
    source_date_field: "Appendix heading: Planning January 2018 / Additions to the List",
    source_date_value: "2018-01",
    milestone_type: "listed_building_additions_list_record",
    milestone_family: "listing",
    title_prefix: "HED additions-to-list appendix recorded listed-building addition for",
    area,
    source_record_id: hb_ref,
    source_note:
      "The official Belfast City Council appendix records this HB reference under additions to the list for January 2018. Month precision is retained because the appendix does not expose a row-level day."
  })),
  ...[
    ["HB26/10/010", "Street sign at Beersbridge Road and Upper Newtownards Road"],
    ["HB26/11/013", "Street sign at Summerhill Parade and Barnett's Road"],
    ["HB26/11/014", "Street sign at Knockland Park and Barnett's Road"],
    ["HB26/11/016", "Street sign at Cherryvalley Park and Kensington Road"],
    ["HB26/11/017", "Street sign at Kensington Road and Knock Road"],
    ["HB26/14/025", "Street sign at Eastleigh Drive and Kincora Avenue"],
    ["HB26/14/026", "Street sign at Clonlee Drive and Upper Newtownards Road"],
    ["HB26/12/059", "Street sign at Belmont Church Road and Sydenham Avenue"],
    ["HB26/12/064", "Street sign at Carolhill Gardens and Holywood Road"]
  ].map(([hb_ref, area]) => ({
    source: "bccStreetSigns2021",
    hb_ref,
    date: "2021-04-20",
    date_precision: "day",
    source_date_field: "Belfast City Council Planning Committee report date for HED formal listing confirmation",
    source_date_value: "2021-04-20",
    milestone_type: "listed_street_sign_formal_confirmation",
    milestone_family: "listing",
    title_prefix: "HED formal listing confirmation recorded historic street sign at",
    area,
    source_record_id: hb_ref,
    source_note:
      "The official committee report says HED confirmed the nine street signs were formally listed. The report date is used as the documented administrative milestone, not as a claimed installation date."
  })),
  ...[
    ["HB26/27/105 E", "Gate screen and railings at Colenso Parade, Botanic Gardens"],
    ["HB26/27/105 F", "Gate screen at University Road / Stranmillis Road, Botanic Gardens"]
  ].map(([hb_ref, area]) => ({
    source: "bccBotanic2024",
    hb_ref,
    date: "2024-04-16",
    date_precision: "day",
    source_date_field: "Belfast City Council Planning Committee report date for HED confirmation correspondence",
    source_date_value: "2024-04-16",
    milestone_type: "listed_structure_formal_confirmation",
    milestone_family: "listing",
    title_prefix: "HED formal listing confirmation recorded Botanic Gardens structure at",
    area,
    source_record_id: hb_ref,
    source_note:
      "The official committee report records DfC/HED correspondence confirming the structures had been added to the statutory list. The report date is the documented administrative milestone."
  })),
  {
    source: "dfcNewListings2025",
    hb_ref: "HB26/28/154",
    date: "2025-01",
    effective_date_range: { start: "2025-01-01", end: "2025-01-31" },
    date_precision: "month",
    source_date_field: "DfC HED new-listings PDF heading: Additions added to the list - January 2025 / Updates to the list",
    source_date_value: "2025-01",
    milestone_type: "hed_record_only_update",
    milestone_family: "record_update",
    title_prefix: "DfC HED changes-to-list PDF recorded Record Only heritage update for",
    area: "Russell Court, 40-42 Lisburn Road",
    source_record_id: "HB26/28/154",
    source_note:
      "The DfC HED PDF lists Russell Court as a Record Only update in January 2025. This is a heritage-record update only, not statutory listed status or a physical works event."
  }
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function slugify(value, limit = 90) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return (slug || "record").slice(0, limit).replace(/_+$/g, "");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (fullPath.startsWith(OUT_DIR)) continue;
    if (entry.isDirectory()) {
      results.push(...listJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

function rowsFromDocument(doc) {
  if (Array.isArray(doc)) return doc;
  return doc.events || doc.candidates || doc.records || [];
}

function extractHbRefs(value) {
  const refs = new Set();
  const text = String(value || "");
  for (const match of text.matchAll(/\bHB\d{2}\/\d{2}\/\d{3}(?:\s+[A-Z])?\b/g)) {
    refs.add(cleanText(match[0]).toUpperCase());
  }
  return [...refs];
}

function recordDate(record) {
  return cleanText(record.date || record.effective_date || record.source_date_value || "");
}

function recordMilestoneFamily(record) {
  const text = normalizeText(
    `${record.title || ""} ${record.summary || ""} ${record.observed_change || ""} ${record.milestone_type || ""} ${
      record.project_type || ""
    } ${record.source_type || ""} ${record.source_date_field || ""}`
  );
  if (/\b(de listed|delisted|de listing|date of de listing)\b/.test(text)) return "delisting";
  if (/\b(record only|heritage record update|updates to the list)\b/.test(text)) return "record_update";
  if (/\b(listed|listing|additions? to the list|date of listing|statutory list)\b/.test(text)) return "listing";
  return "";
}

function addIndex(map, key, value) {
  if (!key || map.has(key)) return;
  map.set(key, value);
}

function minimalRecord(record, filePath) {
  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    id: record.event_id || record.candidate_id || record.id || record.event_id_suggestion || "",
    date: recordDate(record),
    title: record.title || "",
    source_record_id: record.source_record_id || record.provenance?.source_record_id || "",
    source_url: record.source_url || record.provenance?.source_url || ""
  };
}

function buildExistingIndex() {
  const files = [MANUAL_CORPUS, ...listJsonFiles(path.join(ROOT, "tmp", "subagents"))].filter((filePath) => fs.existsSync(filePath));
  const index = {
    files: [],
    sourceRecordIds: new Map(),
    sourceUrls: new Map(),
    ids: new Map(),
    hbFamily: new Map(),
    hbDate: new Map(),
    titleDate: new Map()
  };

  for (const filePath of files) {
    let doc;
    try {
      doc = readJson(filePath);
    } catch {
      continue;
    }
    const rows = rowsFromDocument(doc);
    const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const normalizedPath = relativePath.toLowerCase().replace(/\\/g, "/");
    const shouldIndex =
      filePath === MANUAL_CORPUS ||
      normalizedPath.includes("belfast") ||
      normalizedPath.includes("harni");
    if (!shouldIndex) continue;
    index.files.push({ path: relativePath, record_count: rows.length });
    for (const record of rows) {
      const existing = minimalRecord(record, filePath);
      const sourceRecordId = record.source_record_id || record.provenance?.source_record_id || "";
      const sourceUrl = record.source_url || record.provenance?.source_url || "";
      const id = record.event_id || record.candidate_id || record.id || record.event_id_suggestion || "";
      const date = recordDate(record);
      const family = recordMilestoneFamily(record);
      const text = JSON.stringify(record);

      addIndex(index.sourceRecordIds, normalizeKey(sourceRecordId), existing);
      addIndex(index.sourceUrls, normalizeKey(sourceUrl), existing);
      addIndex(index.ids, normalizeKey(id), existing);
      addIndex(index.titleDate, `${normalizeText(record.title || "")}|${date}`, existing);

      for (const hb of extractHbRefs(`${sourceRecordId} ${text}`)) {
        if (family) addIndex(index.hbFamily, `${hb}|${family}`, existing);
        if (date) addIndex(index.hbDate, `${hb}|${family || "any"}|${date}`, existing);
      }
    }
  }
  return index;
}

function duplicateMatch(candidate, index) {
  const exactRecordId = normalizeKey(candidate.source_record_id);
  const exactUrl = normalizeKey(candidate.source_url);
  const exactId = normalizeKey(candidate.candidate_id);
  const titleDateKey = `${normalizeText(candidate.title)}|${candidate.date}`;
  if (index.sourceRecordIds.has(exactRecordId)) {
    return { duplicate: true, reason: "source_record_id_match", matched_record: index.sourceRecordIds.get(exactRecordId) };
  }
  if (index.sourceUrls.has(exactUrl)) {
    return { duplicate: true, reason: "source_url_match", matched_record: index.sourceUrls.get(exactUrl) };
  }
  if (index.ids.has(exactId)) {
    return { duplicate: true, reason: "candidate_id_match", matched_record: index.ids.get(exactId) };
  }
  if (index.titleDate.has(titleDateKey)) {
    return { duplicate: true, reason: "title_date_match", matched_record: index.titleDate.get(titleDateKey) };
  }
  for (const hb of candidate.source_fields?.hb_refs || []) {
    const familyKey = `${hb}|${candidate.source_family_key}`;
    if (index.hbFamily.has(familyKey)) {
      return { duplicate: true, reason: "hb_ref_milestone_family_match", matched_key: familyKey, matched_record: index.hbFamily.get(familyKey) };
    }
    const dateKey = `${hb}|${candidate.source_family_key}|${candidate.date}`;
    if (index.hbDate.has(dateKey)) {
      return { duplicate: true, reason: "hb_ref_date_match", matched_key: dateKey, matched_record: index.hbDate.get(dateKey) };
    }
  }
  return { duplicate: false };
}

function whereForRecord(record) {
  if (record.hb_ref === "HB26/30/005") return "HB_ref LIKE 'HB26/30/005%'";
  return `HB_ref='${record.hb_ref.replace(/'/g, "''")}'`;
}

async function fetchBuildingFeatures(records) {
  const byInputRef = new Map();
  for (const record of records) {
    if (byInputRef.has(record.hb_ref)) continue;
    const params = new URLSearchParams({
      where: whereForRecord(record),
      outFields: BUILDINGS_FIELDS.join(","),
      returnGeometry: "true",
      f: "geojson"
    });
    const url = `${SERVICE_ROOT}/${BUILDINGS_LAYER_ID}/query?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HED ArcGIS fetch failed for ${record.hb_ref}: ${response.status} ${response.statusText}`);
    const json = await response.json();
    if (json.error) throw new Error(`HED ArcGIS error for ${record.hb_ref}: ${JSON.stringify(json.error)}`);
    byInputRef.set(record.hb_ref, {
      query_url: url,
      features: json.features || []
    });
  }
  return byInputRef;
}

function averagePoint(features) {
  const points = features
    .map((feature) => feature.geometry?.coordinates)
    .filter((coordinates) => Array.isArray(coordinates) && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]));
  if (!points.length) return null;
  const lon = points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length;
  const lat = points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length;
  return {
    longitude: Number(lon.toFixed(6)),
    latitude: Number(lat.toFixed(6))
  };
}

function inBelfastBounds(point) {
  return point && point.latitude >= 54.45 && point.latitude <= 54.75 && point.longitude >= -6.15 && point.longitude <= -5.65;
}

function dateWindowValue(date, range) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return { start: date, end: date };
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [year, month] = date.split("-").map(Number);
    const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    return { start: `${date}-01`, end };
  }
  if (range?.start && range?.end) return range;
  return { start: date, end: date };
}

function countBy(rows, selector) {
  return rows.reduce((counts, row) => {
    const key = cleanText(selector(row)) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sourceRecordId(record, features) {
  const featureParts = features
    .map((feature) => {
      const props = feature.properties || {};
      return `${cleanText(props.HB_ref)} OBJECTID_1:${cleanText(props.OBJECTID_1)} MainID:${cleanText(props.MainID)}`;
    })
    .filter(Boolean)
    .join("; ");
  return `${record.source_record_id}; HED layer:1${featureParts ? `; ${featureParts}` : ""}`;
}

function makeCandidate(record, featureResult) {
  const source = SOURCES[record.source];
  const features = featureResult.features;
  const point = averagePoint(features);
  if (!point) {
    return {
      rejected: true,
      reason: "missing_hed_arcgis_geometry",
      record
    };
  }
  if (!inBelfastBounds(point)) {
    return {
      rejected: true,
      reason: "outside_belfast_coordinate_sanity",
      record,
      point
    };
  }
  const props = features.map((feature) => feature.properties || {});
  const hbRefs = [...new Set(props.map((property) => cleanText(property.HB_ref).toUpperCase()).filter(Boolean))];
  const currentGrades = [...new Set(props.map((property) => cleanText(property.CurrentGra)).filter(Boolean))];
  const currentUses = [...new Set(props.map((property) => cleanText(property.CurrentUse)).filter(Boolean))];
  const objectIds = props.map((property) => property.OBJECTID_1).filter((value) => value !== undefined && value !== null);
  const mainIds = props.map((property) => property.MainID).filter((value) => value !== undefined && value !== null);
  const dateWindow = dateWindowValue(record.date, record.effective_date_range);
  const sourceUrl = record.source_url || source.source_url;
  const safeRef = slugify(record.hb_ref);
  const safeDate = slugify(record.date);
  const title = `${record.title_prefix} ${record.area}`;
  const eventId = `bfs_arch_round296_${safeRef}_${slugify(record.milestone_type)}_${safeDate}`;
  const candidateId = `round296_belfast_${safeRef}_${slugify(record.milestone_type)}_${safeDate}`;
  const displayDate = record.date_precision === "month" ? record.date : dateWindow.start;

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: candidateId,
    event_id_suggestion: eventId,
    date: record.date,
    effective_date: record.date_precision === "day" ? record.date : null,
    effective_date_range: record.date_precision === "day" ? null : dateWindow,
    date_precision: record.date_precision,
    bucket: "planning/development/architecture/heritage_designation",
    event_family: "architecture/heritage-status",
    milestone_type: record.milestone_type,
    title,
    summary:
      `${source.publisher} source material records ${record.area} (${record.hb_ref}) as a heritage/listing administrative milestone with source date ${displayDate}. ` +
      `The current HED ArcGIS historic-buildings row gives grade/status '${currentGrades.join("; ") || "not supplied"}' and use '${currentUses.join("; ") || "not supplied"}'.`,
    observed_change:
      `Official heritage administrative milestone: ${record.source_note} This is not evidence of construction, physical works, repair completion, opening, occupancy, ownership change, condition outcome, forecast, simulation or causal effect.`,
    area: record.area,
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: featureResult.query_url,
    source_id: source.source_id,
    source_ids: [source.source_id, "dfc-hed-historic-buildings-arcgis-layer"],
    source_family_key: record.milestone_family,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: sourceUrl,
    source_record_id: sourceRecordId(record, features),
    source_type: source.source_type,
    accessed_at: ACCESSED_AT,
    source_retrieved_at: ACCESSED_AT,
    source_date_field: record.source_date_field,
    source_date_value: record.source_date_value,
    confidence: "documented",
    architect: "Source row may contain architect details in HED narrative, but this candidate does not rely on architect attribution.",
    project_type:
      record.milestone_family === "record_update"
        ? "heritage record administrative update"
        : record.milestone_family === "delisting"
          ? "listed-building de-listing administrative record"
          : "listed-building / heritage designation administrative record",
    geometry_source:
      "Point geometry from the official DfC/HED Historic Buildings Record / Listed Buildings ArcGIS layer; source report/PDF supplies the administrative date or confirmation.",
    geometry_precision:
      features.length > 1
        ? "Average of multiple official HED building points for a grouped HB reference; not a measured boundary, curtilage, works extent or statutory map."
        : "Official HED historic-building point for atlas navigation; not a measured footprint, boundary, curtilage or works extent.",
    license: source.license,
    license_url: source.license_url,
    license_or_terms_note:
      `${source.license} HED ArcGIS factual geometry is treated as public-sector information under the UK Open Government Licence where applicable; images, narrative page content, base maps and third-party content require separate review.`,
    attribution: source.attribution,
    limitations:
      "This candidate records an official heritage/listing administrative milestone only. It must not be treated as a construction date, real-world build date, repair completion, demolition timing, opening, occupancy, ownership change, condition outcome, prediction, simulation or causal evidence. HED historic-building dates are distinct from Date of Construction.",
    source_fields: {
      input_hb_ref: record.hb_ref,
      hb_refs: hbRefs,
      object_ids: objectIds,
      main_ids: mainIds,
      current_grades: currentGrades,
      current_uses: currentUses,
      source_date_field: record.source_date_field,
      source_date_value: record.source_date_value
    },
    raw_row: {
      curated_source_record: record,
      hed_arcgis_features: features.map((feature) => ({
        geometry: feature.geometry,
        properties: feature.properties
      }))
    },
    supporting_source_url: featureResult.query_url,
    transformation_method:
      "scripts/fetch_round296_belfast_official_heritage_tail2_candidates.js uses curated official HED/Belfast City Council/DfC source rows, queries the official HED Historic Buildings ArcGIS layer for Belfast geometry and current HB identifiers, normalizes provenance/date fields, and dedupes against the manual corpus plus prior Belfast candidate packs through round291."
  };
}

function validateCandidates(candidates, duplicateRejects, index) {
  const errors = [];
  const warnings = [];
  const required = [
    "candidate_id",
    "event_id_suggestion",
    "date",
    "bucket",
    "title",
    "summary",
    "observed_change",
    "source_id",
    "source_url",
    "source_record_id",
    "publisher",
    "license",
    "license_url",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method",
    "geometry",
    "geometry_ref",
    "source_date_field",
    "source_date_value"
  ];
  const ids = new Set();
  const sourceDateKeys = new Set();

  for (const candidate of candidates) {
    for (const field of required) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`${candidate.candidate_id || "candidate"} missing required field ${field}`);
      }
    }
    if (ids.has(candidate.candidate_id)) errors.push(`duplicate candidate_id ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    const dateWindow = dateWindowValue(candidate.date, candidate.effective_date_range);
    if (dateWindow.start < DATE_MIN || dateWindow.end > DATE_MAX) {
      errors.push(`${candidate.candidate_id} has out-of-window date/range ${JSON.stringify(dateWindow)}`);
    }
    if (!inBelfastBounds({ latitude: candidate.latitude, longitude: candidate.longitude })) {
      errors.push(`${candidate.candidate_id} has coordinates outside Belfast sanity bounds`);
    }
    const sourceDateKey = `${normalizeKey(candidate.source_record_id)}|${candidate.date}`;
    if (sourceDateKeys.has(sourceDateKey)) errors.push(`duplicate source/date key ${sourceDateKey}`);
    sourceDateKeys.add(sourceDateKey);
    if (!/not evidence of construction|not be treated as a construction date/i.test(`${candidate.observed_change} ${candidate.limitations}`)) {
      errors.push(`${candidate.candidate_id} missing construction-date caveat`);
    }
    if (/\b(predicted|predictive|caused|will increase|will decrease|impact score|10-year simulation)\b/i.test(JSON.stringify(candidate))) {
      errors.push(`${candidate.candidate_id} contains overclaim wording`);
    }
    const dupe = duplicateMatch(candidate, index);
    if (dupe.duplicate) errors.push(`${candidate.candidate_id} still duplicates prior pack: ${dupe.reason}`);
  }

  if (!duplicateRejects.length) warnings.push("No duplicate rejects were produced; review dedupe index coverage.");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_provenance: true,
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      belfast_coordinate_sanity: true,
      unique_candidate_ids: true,
      unique_source_date_keys: true,
      no_overlap_against_manual_and_prior_belfast_packs: true,
      overclaim_wording_scan: true,
      prior_file_count: index.files.length,
      duplicate_reject_count: duplicateRejects.length
    }
  };
}

function buildSourceAudit(summary) {
  return {
    schema_version: "round296_belfast_official_heritage_tail2.source_audit.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    scope:
      "Official Belfast/DfC/HED heritage administrative records not already represented in the manual corpus or prior Belfast heritage/HARNI/planning-tail packs.",
    source_audits: [
      {
        ...SOURCES.hedBuildings,
        api_endpoint: `${SERVICE_ROOT}/${BUILDINGS_LAYER_ID}`,
        coverage_years_checked: "Selected HED Buildings Database Date of Listing/Date of De-listing records from 2008-01-01 through 2026-05-20.",
        update_frequency: "Record-specific HED Buildings Database / HED ArcGIS snapshot.",
        geographic_scope: "Belfast historic-building records with official HED point geometry.",
        key_fields_used: "HB Ref No, Date of Listing, Date of De-listing, MainID, OBJECTID_1, CurrentGra, CurrentUse, Address, point geometry.",
        reliability: "strong for official listing/de-listing administrative records; source page availability can be intermittent",
        required_caveats:
          "Date of Listing/De-listing is a statutory/admin heritage date, not construction, demolition, repair, occupancy or outcome evidence.",
        ingestion_recommendation: "Use exact HED page records where not already present; keep source page URL and HED ArcGIS geometry reference.",
        emitted_candidates: summary.source_mix[SOURCES.hedBuildings.source_id] || 0
      },
      {
        ...SOURCES.bccJan2018Additions,
        coverage_years_checked: "January 2018 HED additions-to-list appendix for Belfast.",
        update_frequency: "Committee-report specific.",
        geographic_scope: "Belfast City Council area; geometry cross-checked against HED historic-building rows.",
        key_fields_used: "HB Ref No, address text, appendix month, HED ArcGIS HB_ref/current grade/current use/geometry.",
        reliability: "strong for official additions-to-list appendix; month precision only",
        required_caveats:
          "The appendix supports an additions-to-list administrative milestone at month precision. It does not expose row-level day dates or physical works.",
        ingestion_recommendation: "Use after HB-reference dedupe; prefer exact HED Date of Listing if later retrieved.",
        emitted_candidates: summary.source_mix[SOURCES.bccJan2018Additions.source_id] || 0
      },
      {
        ...SOURCES.bccStreetSigns2021,
        coverage_years_checked: "20 April 2021 HED formal listing confirmation for nine Belfast historic street signs.",
        update_frequency: "Committee-report specific.",
        geographic_scope: "Nine Belfast street-sign HB records with current HED point geometry.",
        key_fields_used: "Report date, junction names, HED ArcGIS HB_ref/current grade/current use/geometry.",
        reliability: "strong for formal listing confirmation date; does not supply installation dates",
        required_caveats: "Use as a heritage public-realm listing confirmation only, not street-sign installation or repair evidence.",
        ingestion_recommendation: "Recommended as public-realm heritage designation candidates with explicit report-date caveat.",
        emitted_candidates: summary.source_mix[SOURCES.bccStreetSigns2021.source_id] || 0
      },
      {
        ...SOURCES.bccBotanic2024,
        coverage_years_checked: "16 April 2024 HED confirmation for Botanic Gardens gate-screen structures.",
        update_frequency: "Committee-report specific.",
        geographic_scope: "Two Belfast Botanic Gardens HED historic-building point records.",
        key_fields_used: "Report date, HB refs, HED ArcGIS current grade/current use/geometry.",
        reliability: "strong for formal listing confirmation date",
        required_caveats: "Use as statutory-list confirmation only, not works, conservation treatment, opening or condition evidence.",
        ingestion_recommendation: "Recommended as distinct heritage/public-realm structure listing confirmation candidates.",
        emitted_candidates: summary.source_mix[SOURCES.bccBotanic2024.source_id] || 0
      },
      {
        ...SOURCES.dfcNewListings2025,
        coverage_years_checked: "January 2025 DfC/HED changes-to-list PDF checked for Belfast rows not already represented.",
        update_frequency: "Published changes-to-list PDF.",
        geographic_scope: "Belfast rows in the DfC/HED PDF, cross-checked against HED ArcGIS point geometry.",
        key_fields_used: "HB Ref No, address, Survey 2/current grade, current use, PDF heading month, HED ArcGIS geometry.",
        reliability: "usable with caveats for month-level record update; not statutory listing where row says Record Only",
        required_caveats:
          "Record Only update is not listed-building designation, construction, demolition, physical works, condition or outcome evidence.",
        ingestion_recommendation: "Use only as a labelled heritage-record update, separate from planning approval records for the same site.",
        emitted_candidates: summary.source_mix[SOURCES.dfcNewListings2025.source_id] || 0
      }
    ],
    caveat:
      "All emitted rows are heritage/listing administrative milestones. Do not treat HED historic-building Date of Construction or record dates as real-world construction/change dates."
  };
}

function buildNotes(summary) {
  const range = summary.emitted_date_range;
  return [
    "# Round296 Belfast Official Heritage Tail2 Candidate Pack",
    "",
    `Generated/accessed: ${ACCESSED_AT}`,
    "",
    "## Output",
    "",
    `- Accepted candidates: ${summary.accepted_candidates}`,
    `- Rejected records: ${summary.rejected_detail_count}`,
    `- Date range: ${range.min || "none"} to ${range.max || "none"}`,
    "",
    "## Source Date Fields",
    "",
    ...Object.entries(summary.source_date_field_mix).map(([field, count]) => `- ${field}: ${count}`),
    "",
    "## Dedupe",
    "",
    `Deduped against ${path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/")} and ${summary.dedupe.prior_file_count} prior Belfast/heritage/HARNI/planning-tail JSON packs through round291.`,
    "HB references already represented as listing/de-listing events were rejected; HARNI risk rows with the same HB reference are not treated as duplicates of distinct listing confirmations unless the listing/de-listing milestone is already present.",
    "",
    "## Caveat",
    "",
    "Do not treat heritage record dates as construction dates. These rows are source-backed administrative milestones only and make no forecast, simulation, causality or impact claim.",
    ""
  ].join("\n");
}

function emittedDateRange(candidates) {
  const starts = candidates.map((candidate) => dateWindowValue(candidate.date, candidate.effective_date_range).start).sort();
  const ends = candidates.map((candidate) => dateWindowValue(candidate.date, candidate.effective_date_range).end).sort();
  return {
    min: starts[0] || null,
    max: ends[ends.length - 1] || null
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildExistingIndex();
  const featureMap = await fetchBuildingFeatures(SOURCE_RECORDS);

  const normalized = [];
  const screenRejects = [];
  for (const record of SOURCE_RECORDS) {
    const candidate = makeCandidate(record, featureMap.get(record.hb_ref));
    if (candidate.rejected) screenRejects.push(candidate);
    else normalized.push(candidate);
  }

  const accepted = [];
  const duplicateRejects = [];
  for (const candidate of normalized) {
    const match = duplicateMatch(candidate, index);
    if (match.duplicate) {
      duplicateRejects.push({
        rejected: true,
        reason: match.reason,
        matched_key: match.matched_key || "",
        candidate_id: candidate.candidate_id,
        date: candidate.date,
        title: candidate.title,
        source_record_id: candidate.source_record_id,
        source_fields: candidate.source_fields,
        matched_record: match.matched_record
      });
    } else {
      accepted.push(candidate);
    }
  }

  accepted.sort(
    (a, b) =>
      dateWindowValue(a.date, a.effective_date_range).start.localeCompare(dateWindowValue(b.date, b.effective_date_range).start) ||
      a.source_id.localeCompare(b.source_id) ||
      a.source_record_id.localeCompare(b.source_record_id)
  );

  const validation = validateCandidates(accepted, duplicateRejects, index);
  const summary = {
    schema_version: "round296_belfast_official_heritage_tail2.summary.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    input_source_records: SOURCE_RECORDS.length,
    accepted_candidates: accepted.length,
    candidate_count: accepted.length,
    rejected_detail_count: duplicateRejects.length + screenRejects.length,
    emitted_date_range: emittedDateRange(accepted),
    date_window: { start: DATE_MIN, end: DATE_MAX },
    counts_by_year: countBy(accepted, (candidate) => dateWindowValue(candidate.date, candidate.effective_date_range).start.slice(0, 4)),
    counts_by_date_precision: countBy(accepted, (candidate) => candidate.date_precision),
    source_mix: countBy(accepted, (candidate) => candidate.source_id),
    source_date_field_mix: countBy(accepted, (candidate) => candidate.source_date_field),
    milestone_mix: countBy(accepted, (candidate) => candidate.milestone_type),
    dedupe: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length,
      prior_record_count: index.files.reduce((sum, entry) => sum + Number(entry.record_count || 0), 0),
      prior_files: index.files,
      duplicate_reject_count: duplicateRejects.length,
      duplicate_reason_counts: countBy(duplicateRejects, (row) => row.reason)
    },
    validation,
    output_files: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, path.relative(ROOT, value).replace(/\\/g, "/")])),
    caveat:
      "Accepted candidates are official heritage/listing administrative milestones only. They are not construction dates, physical works, forecasts, simulations, impact scores, or causal claims."
  };

  const candidatesPayload = {
    schema_version: "round296_belfast_official_heritage_tail2.candidates.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: accepted.length,
    source_ids: [...new Set(accepted.map((candidate) => candidate.source_id))],
    source_urls: [...new Set(accepted.map((candidate) => candidate.source_url))],
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length
    },
    scope_note:
      "Official Belfast/DfC/HED heritage/listing administrative candidates. Dates are source/report/listing record dates, not construction dates or physical works.",
    candidates: accepted
  };

  const rejectedPayload = {
    schema_version: "round296_belfast_official_heritage_tail2.rejected.v1",
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    rejected_count: summary.rejected_detail_count,
    duplicate_rejects: duplicateRejects,
    screen_rejects: screenRejects,
    duplicate_reason_counts: summary.dedupe.duplicate_reason_counts,
    source_records_checked: SOURCE_RECORDS.map((record) => ({
      hb_ref: record.hb_ref,
      area: record.area,
      date: record.date,
      source: record.source,
      milestone_family: record.milestone_family
    }))
  };

  writeJson(OUTPUTS.candidates, candidatesPayload);
  writeJson(OUTPUTS.sourceAudit, buildSourceAudit(summary));
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.rejected, rejectedPayload);
  writeJson(OUTPUTS.validation, validation);
  writeJson(OUTPUTS.validationReport, validation);
  fs.writeFileSync(OUTPUTS.notes, buildNotes(summary));

  if (!validation.ok) {
    console.error(JSON.stringify(validation, null, 2));
    process.exitCode = 1;
  }
  console.log(
    JSON.stringify(
      {
        accepted_candidates: accepted.length,
        rejected: summary.rejected_detail_count,
        date_range: summary.emitted_date_range,
        source_date_field_mix: summary.source_date_field_mix,
        out_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/"),
        validation_ok: validation.ok
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
