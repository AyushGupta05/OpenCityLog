const fs = require("fs");
const path = require("path");

const RETRIEVED_AT = "2026-05-19";
const OUT_DIR = "tmp/subagents/round130_belfast_official_more";
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");

const SOURCE_ID = "dfc-hed-scheduled-zones-belfast-round130";
const SERVICE_ROOT = "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const LAYER_URL = `${SERVICE_ROOT}/10`;
const DATASET_PAGE = "https://admin.opendatani.gov.uk/dataset/scheduled-historic-monument-areas";
const REST_API_PAGE = "https://admin.opendatani.gov.uk/dataset/historic-environment-division-esri-rest-api";

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "scheduled_zone";
}

function isoDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString().slice(0, 10);
  }
  const text = cleanText(value);
  if (!text) return "";
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function rowQueryUrl(objectId) {
  const where = `OBJECTID=${Number(objectId)}`;
  const fields = [
    "COUNTY",
    "SMNO",
    "TOWNLAND",
    "EDITED_TYP",
    "DC",
    "BFILE",
    "COMMENTS",
    "Date_added",
    "Centroid_X",
    "Centroid_Y",
    "OBJECTID"
  ].join(",");
  return `${LAYER_URL}/query?where=${encodeURIComponent(where)}&outFields=${encodeURIComponent(fields)}&returnGeometry=true&f=geojson`;
}

function signedRingCentroid(ring) {
  let twiceArea = 0;
  let xTotal = 0;
  let yTotal = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    xTotal += (x1 + x2) * cross;
    yTotal += (y1 + y2) * cross;
  }
  if (Math.abs(twiceArea) < 1e-12) return null;
  return {
    area: twiceArea / 2,
    longitude: xTotal / (3 * twiceArea),
    latitude: yTotal / (3 * twiceArea)
  };
}

function coordinateAverage(points) {
  const valid = points.filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  if (!valid.length) return null;
  const totals = valid.reduce(
    (acc, [lon, lat]) => ({ longitude: acc.longitude + lon, latitude: acc.latitude + lat }),
    { longitude: 0, latitude: 0 }
  );
  return {
    longitude: totals.longitude / valid.length,
    latitude: totals.latitude / valid.length
  };
}

function geometryPoint(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    const [longitude, latitude] = geometry.coordinates || [];
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) return { longitude, latitude };
    return null;
  }

  const rings = [];
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates || []) rings.push(ring);
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates || []) {
      if (polygon[0]) rings.push(polygon[0]);
    }
  }

  let weightedX = 0;
  let weightedY = 0;
  let totalArea = 0;
  const allPoints = [];
  for (const ring of rings) {
    for (const point of ring) allPoints.push(point);
    const centroid = signedRingCentroid(ring);
    if (!centroid) continue;
    const area = Math.abs(centroid.area);
    weightedX += centroid.longitude * area;
    weightedY += centroid.latitude * area;
    totalArea += area;
  }

  if (totalArea > 0) {
    return { longitude: weightedX / totalArea, latitude: weightedY / totalArea };
  }
  return coordinateAverage(allPoints);
}

function candidateFor(feature) {
  const properties = feature.properties || {};
  const date = isoDate(properties.Date_added);
  if (!date || date < "2008-01-01" || date > RETRIEVED_AT) return null;
  const point = geometryPoint(feature.geometry);
  if (!point) return null;

  const smno = cleanText(properties.SMNO);
  const townland = cleanText(properties.TOWNLAND);
  const editedType = cleanText(properties.EDITED_TYP || "scheduled monument area");
  const objectId = cleanText(properties.OBJECTID);
  const comments = cleanText(properties.COMMENTS);
  const bfile = cleanText(properties.BFILE);
  const areaLabel = [editedType, townland].filter(Boolean).join(", ");
  const queryUrl = rowQueryUrl(objectId);

  return {
    city_id: "belfast",
    candidate_id: `round130_belfast_dfc_scheduled_zone_${slugify(smno)}_date_added_${date}`,
    event_id: `round130_belfast_dfc_scheduled_zone_${slugify(smno)}_date_added_${date}`,
    date,
    effective_date: date,
    effective_date_range: null,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_designation",
    milestone_type: "scheduled_monument_zone_record_date",
    title: `HED Scheduled Zones recorded ${editedType} at ${townland}`,
    summary: `The Department for Communities Historic Environment Division Scheduled Zones layer records SMNO ${smno || "not supplied"} in Belfast with Date_added ${date}, type '${editedType}', townland '${townland || "not supplied"}' and OBJECTID ${objectId || "not supplied"}.`,
    observed_change: `Official HED Scheduled Zones milestone: the source row carries Date_added ${date} for ${areaLabel || "a Belfast scheduled monument area"}. This is a heritage-designation/source-record date, not evidence of construction, excavation, repair, demolition, opening or causal effects.`,
    area: areaLabel || "Belfast scheduled monument area",
    latitude: Number(point.latitude.toFixed(6)),
    longitude: Number(point.longitude.toFixed(6)),
    geometry: {
      type: "Point",
      coordinates: [
        Number(point.longitude.toFixed(6)),
        Number(point.latitude.toFixed(6))
      ]
    },
    geometry_ref: queryUrl,
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: "Scheduled Historic Monument Areas / HED Scheduled Zones",
    publisher: "Department for Communities Historic Environment Division",
    source_url: queryUrl,
    source_record_id: `SMNO:${smno || "not supplied"}; OBJECTID:${objectId || "not supplied"}; BFILE:${bfile || "not supplied"}`,
    source_type: "official OpenDataNI / DfC HED ArcGIS scheduled-zone feature row",
    accessed_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    source_date_field: "Date_added",
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: "scheduled monument area designation/register milestone",
    geometry_source: "Point centroid computed from the official HED Scheduled Zones polygon returned by the ArcGIS GeoJSON query; the row URL preserves the polygon geometry reference.",
    geometry_precision: "derived polygon centroid for atlas review, not a measured monument point, legal boundary replacement, building footprint or works extent",
    license: "UK Open Government Licence (OGL)",
    license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    license_or_terms_note: "OpenDataNI records the Scheduled Historic Monument Areas dataset and HED ESRI REST API under the UK Open Government Licence (OGL); retain DfC attribution and verify current portal terms before production import.",
    attribution: "Contains public sector information from Department for Communities Historic Environment Division licensed under the UK Open Government Licence.",
    limitations: "Date_added is a source/register date in the Scheduled Zones layer. It can represent scheduling, rescheduling, digitisation or source maintenance depending on the row comments. It must not be used as evidence of physical works, archaeological intervention, monument condition, ownership change, public access, development impact or causal outcomes without separate source evidence.",
    raw_row: {
      COUNTY: properties.COUNTY,
      SMNO: properties.SMNO,
      TOWNLAND: properties.TOWNLAND,
      EDITED_TYP: properties.EDITED_TYP,
      DC: properties.DC,
      BFILE: properties.BFILE,
      COMMENTS: properties.COMMENTS,
      Date_added: properties.Date_added,
      Date_added_iso: date,
      Centroid_X: properties.Centroid_X,
      Centroid_Y: properties.Centroid_Y,
      OBJECTID: properties.OBJECTID
    },
    source_comment: comments || null
  };
}

function sourceAudits() {
  return [
    {
      source_id: SOURCE_ID,
      source_name: "Scheduled Historic Monument Areas / HED Scheduled Zones",
      publisher: "Department for Communities Historic Environment Division",
      source_url: DATASET_PAGE,
      api_endpoint: LAYER_URL,
      license: "UK Open Government Licence (OGL)",
      license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      license_or_terms_note: "OpenDataNI lists the Scheduled Historic Monument Areas dataset under the UK Open Government Licence (OGL).",
      coverage_years_checked: "Belfast Scheduled Zones rows with Date_added from 2008-01-01 through 2026-05-19.",
      update_frequency: "OpenDataNI Scheduled Historic Monument Areas page says quarterly; HED ESRI REST API page says monthly. Use accessed_at and current service metadata for each release.",
      geographic_scope: "Belfast district Scheduled Zones polygon records in the HED ArcGIS service.",
      key_fields_used: "SMNO, TOWNLAND, EDITED_TYP, DC, BFILE, COMMENTS, Date_added, OBJECTID and polygon geometry.",
      reliability: "strong for official heritage scheduled-zone register/source dates; usable with caveats for city-change events",
      required_caveats: "Treat Date_added as a designation/register/source-maintenance date. Do not infer construction, repair, excavation, condition, public access, development impact or causality.",
      ingestion_recommendation: "Recommended as a distinct non-HARNI official source for heritage-designation milestones. Keep as built-environment/heritage evidence and expose polygon geometry as source geometry_ref if integrated."
    },
    {
      source_id: "dfc-hed-esri-rest-api",
      source_name: "Historic Environment Division ESRI REST API",
      publisher: "Department for Communities Historic Environment Division",
      source_url: REST_API_PAGE,
      api_endpoint: SERVICE_ROOT,
      license: "UK Open Government Licence (OGL)",
      license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      license_or_terms_note: "OpenDataNI lists the HED ESRI REST API under the UK Open Government Licence (OGL).",
      coverage_years_checked: "Service metadata and layers checked on 2026-05-19.",
      update_frequency: "Monthly according to OpenDataNI HED ESRI REST API metadata.",
      geographic_scope: "Northern Ireland HED public GIS layers including Scheduled Zones.",
      key_fields_used: "Layer metadata, layer names, fields, source update statement.",
      reliability: "strong for official GIS snapshot metadata",
      required_caveats: "The service is an authoritative public snapshot but not a legal declaration document; retrieve original scheduling declarations for legal boundary or decision-critical use.",
      ingestion_recommendation: "Use as the row-level API for fetching Scheduled Zones; preserve layer URL and OBJECTID query for each candidate."
    }
  ];
}

function sourcesChecked() {
  return [
    {
      source_name: "NI Planning Portal public register / Belfast planning pages",
      publisher: "Department for Infrastructure / Belfast City Council",
      url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning",
      result: "Checked. Existing round126 and main corpus already cover Belfast Planning Committee/current/development-control records heavily; no distinct high-yield, non-overlapping row source selected for this worker."
    },
    {
      source_name: "Belfast City Council public realm/regeneration project pages",
      publisher: "Belfast City Council",
      url: "https://www.belfastcity.gov.uk/business-and-investment/physical-investment",
      result: "Checked. Existing round124/round125/main sources already cover many civic/public-realm project milestones; no separate bulk dataset with row IDs and dates was found in this pass."
    },
    {
      source_name: "HARNI / HED Heritage at Risk ArcGIS layer",
      publisher: "Department for Communities Historic Environment Division",
      url: "https://apps.communities-ni.gov.uk/HARNI/",
      result: "Checked. Already ingested by round128 using Date_Added rows, so not reused."
    },
    {
      source_name: "Listed Buildings, Northern Ireland ArcGIS feature service",
      publisher: "Department for Communities via OpenDataNI / ArcGIS",
      url: "https://www.arcgis.com/home/item.html?id=073026f2b3e64c3d9bcddd5b6ccb15fb",
      result: "Checked. Official and licensed, but the public feature fields expose construction era/current grade rather than a row-level listing date, so it is weaker for 2008-2026 observed change candidates."
    },
    {
      source_name: "Scheduled Historic Monument Areas / HED Scheduled Zones",
      publisher: "Department for Communities Historic Environment Division",
      url: DATASET_PAGE,
      result: "Selected. Distinct official polygon layer with Date_added, SMNO, type, townland and stable OBJECTID row references."
    }
  ];
}

async function fetchScheduledZones() {
  const where = "DC='Belfast' AND Date_added >= DATE '2008-01-01' AND Date_added <= DATE '2026-05-19'";
  const fields = [
    "COUNTY",
    "SMNO",
    "TOWNLAND",
    "EDITED_TYP",
    "DC",
    "BFILE",
    "COMMENTS",
    "Date_added",
    "Centroid_X",
    "Centroid_Y",
    "OBJECTID"
  ].join(",");
  const url = `${LAYER_URL}/query?where=${encodeURIComponent(where)}&outFields=${encodeURIComponent(fields)}&returnGeometry=true&f=geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HED Scheduled Zones fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const geojson = await fetchScheduledZones();
  const candidates = [];
  const rejected = [];

  for (const feature of geojson.features || []) {
    const candidate = candidateFor(feature);
    if (candidate) {
      candidates.push(candidate);
    } else {
      rejected.push({
        object_id: feature.properties?.OBJECTID || "",
        smno: feature.properties?.SMNO || "",
        date_added: feature.properties?.Date_added || "",
        reason: "Missing usable Date_added or centroid geometry, or outside 2008-01-01 through 2026-05-19."
      });
    }
  }

  candidates.sort((a, b) => a.effective_date.localeCompare(b.effective_date) || a.source_record_id.localeCompare(b.source_record_id));

  const audit = {
    schema_version: "round130.belfast_official_more.source_audit.v1",
    created_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    scope: "Belfast / Northern Ireland official architecture and built-environment change data, 2008-2026, beyond already-used HARNI and planning-committee sources where possible.",
    recommendation: "Use DfC/HED Scheduled Zones Date_added rows as heritage-designation/source-register milestones only. Candidate output is suitable for main-agent review and duplicate screening before integration.",
    source_audits: sourceAudits(),
    sources_checked: sourcesChecked()
  };

  const output = {
    schema_version: "round130.belfast_official_more.candidates.v1",
    created_at: RETRIEVED_AT,
    accessed_at: RETRIEVED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    candidate_count: candidates.length,
    rejected_count: rejected.length,
    scope_note: "Scratch candidates from official DfC/HED Scheduled Zones records for Belfast, filtered by Date_added from 2008-01-01 through 2026-05-19. These are heritage designation/register milestones, not physical works or causal claims.",
    source_audits: audit.source_audits,
    sources_checked: audit.sources_checked,
    candidates,
    rejected
  };

  fs.writeFileSync(SOURCE_AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(CANDIDATES_PATH, `${JSON.stringify(output, null, 2)}\n`);

  console.log(JSON.stringify({
    features: geojson.features?.length || 0,
    candidates: candidates.length,
    rejected: rejected.length,
    candidates_path: CANDIDATES_PATH,
    source_audit_path: SOURCE_AUDIT_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
