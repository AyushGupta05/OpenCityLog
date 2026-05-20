#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round592_belfast_official_architecture_sweep_next37";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round592_belfast_official_architecture_sweep_next37_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const TARGET_CANDIDATE_COUNT = 30;
const DEDUPE_BOUNDARY_ROUND = 587;
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_ACTIVITY_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const DFI_2024_25_PUBLICATION_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025";
const DFI_2024_25_CSV_URL =
  "https://www.infrastructure-ni.gov.uk/system/files/2025-06/planning-statistics-2024-25-dataset.csv";
const DFI_2025_26_Q1_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-june-2025";
const DFI_2025_26_Q2_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-july-september-2025";
const DFI_2025_26_Q3_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-october-december-2025";
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const EPSG_29902_URL = "https://epsg.io/29902";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const HED_HISTORIC_BUILDINGS_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/1`;
const HED_HERITAGE_AT_RISK_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/3`;
const PLANNING_PORTAL_URL = "https://planningregister.planningsystemni.gov.uk/";
const BCC_PROJECTS_URL = "https://www.belfastcity.gov.uk/";
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "Round592 official Belfast architecture sweep next37 after the completed Round587 next36 pack.",
  "Accepted records are selected from residual Department for Infrastructure Northern Ireland planning-statistics 2024/25 Belfast rows only where the source row supplies an approved planning, listed-building, demolition-consent or other-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit EPSG projection parameters and the TOWGS84 transform.",
  "Each accepted record is an observed administrative planning/statutory-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Round587 is treated as the latest Belfast official architecture sweep dedupe boundary; official page-only, geometry-ref-only, aggregate, duplicate-project, status-only, signage-only, equipment-only, condition-only and lower-priority private-use leads are retained separately."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round592OfficialArchitectureSweepNext37`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round592",
    source_name: "Northern Ireland planning statistics 2024/25 annual dataset",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_dataset_url: DFI_2024_25_CSV_URL,
    source_type: "official annual planning-statistics CSV release",
    license:
      "Open Government Licence v3.0 where applicable to Department for Infrastructure public-sector information; verify release-specific terms before redistribution.",
    license_url: OGL_URL,
    attribution:
      "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0 where applicable.",
    publisher_terms_url: DFI_TERMS_URL,
    coverage_years: "2024-2025",
    geographic_scope: "Belfast planning authority rows in Northern Ireland planning statistics",
    granularity:
      "application-level administrative planning or statutory-consent decision with source Easting/Northing",
    reliability:
      "strong for administrative decision evidence; not physical-start, physical-completion or opening evidence"
  },
  epsg29902: {
    source_id: "epsg-29902-tm65-irish-grid",
    source_name: "EPSG:29902 TM65 / Irish Grid",
    publisher: "EPSG registry via EPSG.io",
    source_url: EPSG_29902_URL,
    source_type: "coordinate reference system definition",
    license:
      "EPSG registry terms apply to CRS metadata; source URL retained for transformation provenance.",
    attribution: "EPSG registry / EPSG.io"
  }
};

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round587 accepted/rejected/readback dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus official Belfast architecture sweep candidate/rejected/readback packs through Round587",
  "source review: DfI planning activity statistics page and 2024/25 annual application-level CSV",
  "source review: DfI 2025/26 Q1-Q3 provisional quarterly publication pages; retained as aggregate-only context until final annual row-level dataset with coordinates",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED Historic Buildings and Heritage at Risk ArcGIS feature layers",
  "source review: Belfast City Council official project/news pages and website terms",
  "source review: DfI point-backed duplicate-project, minor domestic, low-signal HMO/short-let, signage, equipment, boundary/access-only, condition-only, transport and telecom rows retained outside promoted pack"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  return rows.slice(1).map((values, index) => {
    const record = {};
    headers.forEach((header, columnIndex) => {
      const key = header === "Status@31Mar" ? "StatusAt31Mar" : header;
      record[key] = values[columnIndex] === undefined ? "" : values[columnIndex].trim();
    });
    record.row_number = index + 2;
    record.source_file_name = PLANNING_DATASET;
    return record;
  });
}

function readPlanningRows() {
  const text = readTextIfExists(PLANNING_CSV_PATH);
  if (!text) throw new Error(`Missing planning CSV: ${PLANNING_CSV_PATH}`);
  return parseCsv(text);
}

function normaliseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCoord(value) {
  return Number(value.toFixed(6));
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function inverseIrishGridToTm65(easting, northing) {
  const a = 6377340.189;
  const inverseFlattening = 299.3249646;
  const b = a * (1 - 1 / inverseFlattening);
  const f0 = 1.000035;
  const lat0 = degToRad(53.5);
  const lon0 = degToRad(-8);
  const northing0 = 250000;
  const easting0 = 200000;
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b);

  let lat = lat0;
  let meridionalArc = 0;
  do {
    lat = (northing - northing0 - meridionalArc) / (a * f0) + lat;
    const ma =
      (1 + n + (5 / 4) * n ** 2 + (5 / 4) * n ** 3) * (lat - lat0);
    const mb =
      (3 * n + 3 * n ** 2 + (21 / 8) * n ** 3) *
      Math.sin(lat - lat0) *
      Math.cos(lat + lat0);
    const mc =
      ((15 / 8) * n ** 2 + (15 / 8) * n ** 3) *
      Math.sin(2 * (lat - lat0)) *
      Math.cos(2 * (lat + lat0));
    const md =
      (35 / 24) *
      n ** 3 *
      Math.sin(3 * (lat - lat0)) *
      Math.cos(3 * (lat + lat0));
    meridionalArc = b * f0 * (ma - mb + mc - md);
  } while (Math.abs(northing - northing0 - meridionalArc) >= 0.000001);

  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const tanLat = Math.tan(lat);
  const nu = (a * f0) / Math.sqrt(1 - e2 * sinLat ** 2);
  const rho =
    (a * f0 * (1 - e2)) / Math.pow(1 - e2 * sinLat ** 2, 1.5);
  const eta2 = nu / rho - 1;
  const dE = easting - easting0;
  const secLat = 1 / cosLat;

  const vii = tanLat / (2 * rho * nu);
  const viii =
    (tanLat / (24 * rho * nu ** 3)) *
    (5 + 3 * tanLat ** 2 + eta2 - 9 * tanLat ** 2 * eta2);
  const ix =
    (tanLat / (720 * rho * nu ** 5)) *
    (61 + 90 * tanLat ** 2 + 45 * tanLat ** 4);
  const x = secLat / nu;
  const xi = (secLat / (6 * nu ** 3)) * (nu / rho + 2 * tanLat ** 2);
  const xii =
    (secLat / (120 * nu ** 5)) *
    (5 + 28 * tanLat ** 2 + 24 * tanLat ** 4);
  const xiia =
    (secLat / (5040 * nu ** 7)) *
    (61 + 662 * tanLat ** 2 + 1320 * tanLat ** 4 + 720 * tanLat ** 6);

  return {
    latitudeRadians: lat - vii * dE ** 2 + viii * dE ** 4 - ix * dE ** 6,
    longitudeRadians:
      lon0 + x * dE - xi * dE ** 3 + xii * dE ** 5 - xiia * dE ** 7,
    semiMajorAxis: a,
    semiMinorAxis: b
  };
}

function geodeticToCartesian(latitudeRadians, longitudeRadians, height, semiMajorAxis, semiMinorAxis) {
  const e2 = 1 - (semiMinorAxis * semiMinorAxis) / (semiMajorAxis * semiMajorAxis);
  const sinLat = Math.sin(latitudeRadians);
  const nu = semiMajorAxis / Math.sqrt(1 - e2 * sinLat ** 2);
  return {
    x:
      (nu + height) *
      Math.cos(latitudeRadians) *
      Math.cos(longitudeRadians),
    y:
      (nu + height) *
      Math.cos(latitudeRadians) *
      Math.sin(longitudeRadians),
    z: ((1 - e2) * nu + height) * sinLat
  };
}

function applyTm65ToWgs84Transform(cartesian) {
  const tx = 482.5;
  const ty = -130.6;
  const tz = 564.6;
  const rx = -1.042;
  const ry = -0.214;
  const rz = -0.631;
  const scalePpm = 8.15;
  const arcSecondsToRadians = Math.PI / (180 * 3600);
  const rxRad = rx * arcSecondsToRadians;
  const ryRad = ry * arcSecondsToRadians;
  const rzRad = rz * arcSecondsToRadians;
  const scale = 1 + scalePpm * 1e-6;
  return {
    x: tx + scale * (cartesian.x - rzRad * cartesian.y + ryRad * cartesian.z),
    y: ty + scale * (rzRad * cartesian.x + cartesian.y - rxRad * cartesian.z),
    z: tz + scale * (-ryRad * cartesian.x + rxRad * cartesian.y + cartesian.z)
  };
}

function cartesianToGeodetic(cartesian, semiMajorAxis, semiMinorAxis) {
  const e2 = 1 - (semiMinorAxis * semiMinorAxis) / (semiMajorAxis * semiMajorAxis);
  const p = Math.sqrt(cartesian.x ** 2 + cartesian.y ** 2);
  let latitude = Math.atan2(cartesian.z, p * (1 - e2));
  let previousLatitude;
  do {
    previousLatitude = latitude;
    const nu = semiMajorAxis / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2);
    latitude = Math.atan2(cartesian.z + e2 * nu * Math.sin(latitude), p);
  } while (Math.abs(latitude - previousLatitude) > 1e-12);
  const longitude = Math.atan2(cartesian.y, cartesian.x);
  return { latitudeRadians: latitude, longitudeRadians: longitude };
}

function irishGridToWgs84(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const tm65 = inverseIrishGridToTm65(easting, northing);
  const tm65Cartesian = geodeticToCartesian(
    tm65.latitudeRadians,
    tm65.longitudeRadians,
    0,
    tm65.semiMajorAxis,
    tm65.semiMinorAxis
  );
  const wgs84Cartesian = applyTm65ToWgs84Transform(tm65Cartesian);
  const wgs84 = cartesianToGeodetic(
    wgs84Cartesian,
    6378137,
    6356752.314245179
  );
  return {
    latitude: roundCoord(radToDeg(wgs84.latitudeRadians)),
    longitude: roundCoord(radToDeg(wgs84.longitudeRadians))
  };
}

function parseDate(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const months = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };
  const month = months[match[2]];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripTrailingPeriod(value) {
  return cleanText(value).replace(/\.+$/, "");
}

function slug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72)
    .replace(/_+$/g, "");
}

function siteLabel(row) {
  return cleanText(row.SiteAddress)
    .replace(/,?\s*Belfast\b.*$/i, "")
    .replace(/\s+Belfast\s+BT\d.*$/i, "")
    .replace(/,?\s*BT\d.*$/i, "")
    .replace(/\.$/, "");
}

function extractRoundNumber(filePath) {
  const match = filePath.match(/round(\d+)_/i);
  return match ? Number(match[1]) : null;
}

function listFilesRecursive(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function collectDuplicateHaystack() {
  const files = [];
  const manualFile = path.join(
    "data",
    "manual_drops",
    "architecture_milestones",
    "architecture_milestones_2008_2026.json"
  );
  if (fs.existsSync(manualFile)) files.push(manualFile);

  const tmpRoot = path.join("tmp", "subagents");
  for (const file of listFilesRecursive(tmpRoot)) {
    const normalized = file.replace(/\\/g, "/");
    if (normalized.includes(`${ROUND_ID}/`)) continue;
    if (!/belfast_official_architecture_sweep/i.test(normalized)) continue;
    if (!/(candidates|rejected|readback)\.json$/i.test(normalized)) continue;
    const roundNumber = extractRoundNumber(normalized);
    if (roundNumber !== null && roundNumber > DEDUPE_BOUNDARY_ROUND) continue;
    files.push(file);
  }

  const appIds = new Set();
  const sourceRecordIds = new Set();
  const eventIds = new Set();
  const urls = new Set();
  const chunks = [];
  let sampledChars = 0;
  const maxSampledChars = 12_000_000;
  const maxSamplePerFile = 220_000;
  for (const file of [...new Set(files)]) {
    const text = readTextIfExists(file);
    if (!text) continue;
    for (const match of text.matchAll(/LA04\/\d{4}\/\d{4}\/[A-Z]+/g)) {
      appIds.add(match[0]);
    }
    for (const match of text.matchAll(/APP_ID:LA04\/\d{4}\/\d{4}\/[A-Z]+[^"\n]*/g)) {
      sourceRecordIds.add(match[0].trim());
    }
    for (const match of text.matchAll(/bfs_arch_[a-z0-9_]+/g)) {
      eventIds.add(match[0]);
    }
    for (const match of text.matchAll(/https?:\/\/[^\s"')]+/g)) {
      urls.add(match[0].replace(/[),.;]+$/, "").toLowerCase());
    }
    if (sampledChars < maxSampledChars) {
      const sample =
        text.length <= maxSamplePerFile
          ? text
          : `${text.slice(0, maxSamplePerFile / 2)}\n${text.slice(
              -maxSamplePerFile / 2
            )}`;
      chunks.push(sample);
      sampledChars += sample.length;
    }
  }

  return {
    files_checked: [...new Set(files)].length,
    roots: [
      "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
      `tmp/subagents official Belfast architecture sweep candidate/rejected/readback packs through round${DEDUPE_BOUNDARY_ROUND}`
    ],
    files: [...new Set(files)],
    appIds,
    sourceRecordIds,
    eventIds,
    urls,
    text: chunks.join("\n"),
    sampled_chars: sampledChars
  };
}

function duplicateHitsForTerms(haystack, terms, ownId) {
  const hits = [];
  const hay = normalizeText(haystack.text);
  for (const term of terms) {
    const normalized = normalizeText(term);
    if (!normalized || normalized === normalizeText(ownId)) continue;
    if (hay.includes(normalized)) hits.push(term);
  }
  return [...new Set(hits)];
}

function rowText(row) {
  return `${row.Proposal} ${row.StatsCategory} ${row.AppType}`.toLowerCase();
}

function lowSignalReason(row) {
  const text = rowText(row);
  if (
    /\b(advert|advertisement|signage|display sign|fascia sign|projecting sign|totem|hoarding|scaffold|telecom|telecommunications|antenna|dish mounted|mast|cabinet|cctv|charging point|ev charger|car parking bay|parking bay|bus shelter|bus stop|street furniture|atm|awnings?|jet wash|ball stop|fencing|fence|retaining wall|vehicular access|driveway|dropped kerb|domestic curtilage)\b/i.test(
      text
    )
  ) {
    return "equipment_signage_boundary_access_or_transport_only";
  }
  if (
    /\b(discharge of condition|condition \d|non material|variation of condition|temporary|certificate of lawful|clud|cleud|renewal of planning permission)\b/i.test(
      text
    )
  ) {
    return "condition_status_or_temporary_only";
  }
  if (
    /\b(hmo|multiple occup|short[- ]term let|short let|holiday let|serviced accommodation|guest accommodation|stla)\b/i.test(
      text
    ) &&
    !/\b(extension|alteration|dormer|window|door|shopfront|conversion|internal works|fabric|fenestration|demolition|merge flats)\b/i.test(
      text
    )
  ) {
    return "hmo_shortlet_or_guest_use_only";
  }
  return null;
}

function architectureScore(row) {
  if (lowSignalReason(row)) return -999;
  const text = rowText(row);
  let score = 0;
  if (row.AppType === "Listed Building Consents" || /listed building|conservation|heritage/i.test(text)) {
    score += 100;
  }
  if (/school|classroom|health|hospital|surgery|community|library|civic|church|chapel|public realm|sport|pavilion|facility|university|college/i.test(text)) {
    score += 85;
  }
  if (/hotel|aparthotel|student accommodation|office|restaurant|retail|warehouse|bar|cafe|shopfront|commercial|industrial/i.test(text)) {
    score += 80;
  }
  if (
    /change of use/i.test(text) &&
    !/hmo|multiple occup|short[- ]term let|short let|holiday let|serviced accommodation|guest accommodation|stla/i.test(
      text
    )
  ) {
    score += 55;
  }
  if (
    /new (dwelling|house|apartments?)|erection of .*dwelling|residential development|\b\d+\s*(no\.?\s*)?(dwellings|apartments|houses|units)|change of house type/i.test(
      text
    )
  ) {
    score += 70;
  }
  if (/demolition|dca|demolish|partial demolition/i.test(text)) {
    score += 50;
  }
  if (
    /extension|alteration|roof|dormer|fenestration|window|door|loft|attic|garage conversion|outbuilding|garden room|porch|internal works|merge flats|conversion/i.test(
      text
    )
  ) {
    score += 30;
  }
  if (/single storey rear extension|rear dormer|roofspace conversion|loft conversion/i.test(text)) {
    score -= 5;
  }
  return score;
}

function classify(row) {
  const text = rowText(row);
  if (row.AppType === "Other consents" && /demolition|demolish|dca/i.test(text)) {
    return {
      event_type: "planning_decision_demolition_consent",
      category: "architecture_demolition_consent_admin",
      limitation_topic: "demolition-consent approval"
    };
  }
  if (row.AppType === "Listed Building Consents" || /listed building|conservation|heritage/i.test(text)) {
    return {
      event_type: "planning_decision_listed_building_consent",
      category: "architecture_heritage_admin",
      limitation_topic: "listed-building or heritage-related consent approval"
    };
  }
  if (/school|classroom|health|hospital|surgery|community|library|civic|church|chapel|public realm|sport|pavilion|facility|university|college/i.test(text)) {
    return {
      event_type: "planning_decision_civic_development",
      category: "architecture_civic_development_admin",
      limitation_topic: "civic or community development approval"
    };
  }
  if (
    /new (dwelling|house|apartments?)|erection of .*dwelling|residential development|\b\d+\s*(no\.?\s*)?(dwellings|apartments|houses|units)|change of house type/i.test(
      text
    )
  ) {
    return {
      event_type: "planning_decision_residential_development",
      category: "architecture_residential_development_admin",
      limitation_topic: "residential development approval"
    };
  }
  if (/hotel|aparthotel|student accommodation|office|restaurant|retail|warehouse|bar|cafe|shopfront|commercial|industrial/i.test(text)) {
    return {
      event_type: "planning_decision_commercial_or_mixed_use_development",
      category: "architecture_commercial_development_admin",
      limitation_topic: "commercial or mixed-use development approval"
    };
  }
  if (/hmo|multiple occup/i.test(text)) {
    return {
      event_type: "planning_decision_hmo_fabric_change",
      category: "architecture_residential_use_fabric_admin",
      limitation_topic: "HMO or residential-use fabric approval"
    };
  }
  if (/change of use/i.test(text)) {
    return {
      event_type: "planning_decision_change_of_use",
      category: "architecture_commercial_development_admin",
      limitation_topic: "change-of-use approval"
    };
  }
  if (/roof|dormer|loft|attic|fenestration|window/i.test(text)) {
    return {
      event_type: "planning_decision_residential_roof_or_external_alteration",
      category: "architecture_residential_fabric_admin",
      limitation_topic: "roof, dormer, fenestration or external-alteration approval"
    };
  }
  if (/garden room|outbuilding|garage/i.test(text)) {
    return {
      event_type: "planning_decision_residential_outbuilding",
      category: "architecture_residential_fabric_admin",
      limitation_topic: "residential outbuilding or garage-related approval"
    };
  }
  return {
    event_type: "planning_decision_residential_extension",
    category: "architecture_residential_fabric_admin",
    limitation_topic: "residential extension or alteration approval"
  };
}

function hasSourcePoint(row) {
  return Number.isFinite(normaliseNumber(row.Easting)) && Number.isFinite(normaliseNumber(row.Northing));
}

function pointWithinBelfastReviewBounds(point) {
  return (
    point &&
    point.latitude >= 54.45 &&
    point.latitude <= 54.75 &&
    point.longitude >= -6.2 &&
    point.longitude <= -5.65
  );
}

function sourceRecordIdFor(row) {
  return [
    `APP_ID:${row.ID}`,
    `FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`,
    `ROW:${row.row_number}`
  ].join("; ");
}

function projectKey(item) {
  return normalizeText(siteLabel(item.row) || item.row.SiteAddress || item.row.ID);
}

function eligiblePlanningRows(rows, duplicateHaystack) {
  return rows
    .map((row) => {
      const decisionDate = parseDate(row.DecisionIssuedDate || row.DateValid);
      const easting = normaliseNumber(row.Easting);
      const northing = normaliseNumber(row.Northing);
      const point = irishGridToWgs84(easting, northing);
      const score = architectureScore(row);
      return {
        row,
        decisionDate,
        easting,
        northing,
        point,
        score,
        low_signal_reason: lowSignalReason(row)
      };
    })
    .filter(({ row, decisionDate, point, score }) => {
      if (row.Authority !== "Belfast") return false;
      if (row.Decision_Withdrawal !== "Approved" && row.StatusAt31Mar !== "Approved") {
        return false;
      }
      if (!decisionDate || decisionDate < DATE_WINDOW.start || decisionDate > DATE_WINDOW.end) {
        return false;
      }
      if (!hasSourcePoint(row) || !pointWithinBelfastReviewBounds(point)) return false;
      if (duplicateHaystack.appIds.has(row.ID)) return false;
      if (duplicateHaystack.sourceRecordIds.has(sourceRecordIdFor(row))) return false;
      if (score < 50) return false;
      return true;
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.decisionDate.localeCompare(b.decisionDate) ||
        a.row.ID.localeCompare(b.row.ID)
    );
}

function duplicatePlanningRows(rows, duplicateHaystack) {
  return rows.filter(
    (row) =>
      row.Authority === "Belfast" &&
      row.Decision_Withdrawal === "Approved" &&
      duplicateHaystack.appIds.has(row.ID)
  );
}

function selectPromotedRows(eligible) {
  const selected = [];
  const seenProjectKeys = new Set();
  for (const item of eligible) {
    const key = projectKey(item);
    if (key && seenProjectKeys.has(key)) continue;
    selected.push(item);
    if (key) seenProjectKeys.add(key);
    if (selected.length >= TARGET_CANDIDATE_COUNT) break;
  }
  return selected;
}

function lowSignalPlanningRows(rows, duplicateHaystack) {
  return rows
    .map((row) => ({
      row,
      decisionDate: parseDate(row.DecisionIssuedDate || row.DateValid),
      low_signal_reason: lowSignalReason(row)
    }))
    .filter(
      (item) =>
        item.row.Authority === "Belfast" &&
        item.row.Decision_Withdrawal === "Approved" &&
        item.decisionDate &&
        hasSourcePoint(item.row) &&
        !duplicateHaystack.appIds.has(item.row.ID) &&
        item.low_signal_reason
    )
    .sort(
      (a, b) =>
        a.decisionDate.localeCompare(b.decisionDate) ||
        a.row.ID.localeCompare(b.row.ID)
    );
}

function candidateEventId(row, decisionDate) {
  const site = slug(siteLabel(row) || row.SiteAddress || row.ID);
  const appKey = row.ID.toLowerCase().replace(/^la04\//, "").replace(/[^a-z0-9]+/g, "_");
  return `bfs_arch_round592_${site}_${appKey}_approval_${decisionDate.slice(0, 4)}`;
}

function limitationsFor(row, classification) {
  const proposal = stripTrailingPeriod(row.Proposal).toLowerCase();
  return [
    `This records an approved planning/listed-building/demolition/other-consent administrative milestone for ${classification.limitation_topic}: ${proposal}; it does not confirm site works started, physical works completed, opening, occupation, operational use, final built form, funding, public access, heritage condition, service delivery or any outcome.`,
    "The point is transformed from official planning-statistics Easting/Northing in EPSG:29902 TM65 / Irish Grid and should be treated as an application/site navigation point, not a surveyed footprint, legal red-line boundary, curtilage, room, facade, wall, streetworks area, campus boundary, or works extent.",
    "The source row supports the application decision date and administrative decision status only; separate completion/opening evidence would be required for a physical-change corpus record."
  ];
}

function candidateFromPlanningRow(item, duplicateHaystack) {
  const row = item.row;
  const source = SOURCES.dfiPlanningStats;
  const decisionDate = item.decisionDate;
  const classification = classify(row);
  const eventId = candidateEventId(row, decisionDate);
  const proposal = stripTrailingPeriod(row.Proposal);
  const site = siteLabel(row);
  const sourceRecordId = sourceRecordIdFor(row);
  const sourceRowRefs = [
    {
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      source_record_id: `APP_ID:${row.ID}`,
      role: "primary"
    }
  ];
  const duplicateTerms = [eventId, row.ID, row.SiteAddress, site, proposal].filter(Boolean);
  const duplicateScanHits = duplicateHitsForTerms(
    duplicateHaystack,
    duplicateTerms.filter((term) => !String(term).startsWith("LA04/")),
    eventId
  );
  const title = `${site || row.SiteAddress} ${proposal.toLowerCase()} approval was recorded`;
  const cleanSiteAddress = cleanText(row.SiteAddress).replace(/\.\s*$/, "");

  return {
    id: eventId,
    event_id: eventId,
    candidate_id: eventId,
    city_id: CITY_ID,
    title,
    summary: `${source.publisher}'s ${source.coverage_years} planning-statistics dataset records ${row.Decision_Withdrawal || row.StatusAt31Mar} for ${row.ID} at ${cleanSiteAddress}. Administrative proposal summary: ${proposal}`,
    observed_change: `Official planning-statistics row records approval for ${proposal.toLowerCase()} at ${site || cleanSiteAddress}.`,
    event_type: classification.event_type,
    category: classification.category,
    date: decisionDate,
    effective_date: decisionDate,
    effective_date_range: null,
    date_precision: "day",
    source_id: source.source_id,
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: source.source_url,
    source_dataset_url: source.source_dataset_url,
    source_type: source.source_type,
    source_record_id: sourceRecordId,
    source_row_refs: sourceRowRefs,
    source_date_field: "DecisionIssuedDate",
    source_date_value: row.DecisionIssuedDate,
    source_date_key: `${source.source_id}|${row.ID}|${decisionDate}`,
    license: source.license,
    license_url: source.license_url,
    terms: source.publisher_terms_url,
    publisher_terms_url: source.publisher_terms_url,
    attribution: source.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    easting: item.easting,
    northing: item.northing,
    source_easting: item.easting,
    source_northing: item.northing,
    coordinate_reference_system: "EPSG:29902 TM65 / Irish Grid",
    coordinate_conversion:
      "Deterministic EPSG:29902 TM65 / Irish Grid inverse Transverse Mercator conversion to WGS84 using Airy Modified 1849 ellipsoid, latitude_of_origin 53.5, central_meridian -8, scale_factor 1.000035, false_easting 200000, false_northing 250000, and TOWGS84[482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15].",
    coordinate_reference_url: EPSG_29902_URL,
    latitude: item.point.latitude,
    longitude: item.point.longitude,
    geometry: {
      type: "Point",
      coordinates: [item.point.longitude, item.point.latitude]
    },
    geometry_ref: null,
    geometry_source:
      "Source-backed DfI planning-statistics Easting/Northing converted from EPSG:29902 TM65 / Irish Grid to WGS84.",
    geometry_precision:
      "Application/site navigation point from official planning-statistics row; not a surveyed footprint, legal boundary, facade, room, campus, streetworks area or works extent.",
    point_corpus_ready: true,
    source_fields: {
      ID: row.ID,
      related_app_ids: [],
      DateReceived: row.DateReceived,
      DateValid: row.DateValid,
      Authority: row.Authority,
      LPA19CD: row.LPA19CD,
      LPA19NM: row.LPA19NM,
      AppType: row.AppType,
      Classification: row.Classification,
      StatsCategory: row.StatsCategory,
      Proposal: row.Proposal,
      SiteAddress: row.SiteAddress,
      Easting: row.Easting,
      Northing: row.Northing,
      StatusAt31Mar: row.StatusAt31Mar,
      Decision_Withdrawal: row.Decision_Withdrawal,
      DecisionIssuedDate: row.DecisionIssuedDate,
      selection_score: item.score,
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      related_source_rows: []
    },
    evidence_basis: [
      "Official DfI planning-statistics row supplies application ID, decision status, decision date, site address, proposal text and Easting/Northing.",
      "The candidate is modelled as an observed administrative planning/statutory-consent milestone only.",
      `APP_ID was absent from the manual architecture corpus and official Belfast architecture sweep candidate/rejected/readback packs through Round${DEDUPE_BOUNDARY_ROUND} during this sweep.`
    ],
    limitations: limitationsFor(row, classification),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    provenance_links: [
      { rel: "primary_source_page", href: DFI_PLANNING_ACTIVITY_URL },
      { rel: "annual_publication", href: DFI_2024_25_PUBLICATION_URL },
      { rel: "source_dataset", href: DFI_2024_25_CSV_URL },
      { rel: "license", href: OGL_URL },
      { rel: "coordinate_reference_system", href: EPSG_29902_URL }
    ],
    duplicate_check_terms: duplicateTerms,
    duplicate_review:
      `APP_ID, event_id and source_record_id were absent from the manual architecture corpus and official Belfast architecture sweep candidate/rejected/readback outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the Round592 duplicate scan.`,
    duplicate_scan_hits: duplicateScanHits,
    administrative_caveat:
      "Planning-statistics approval is an administrative decision record. It is not a construction, completion, opening, occupancy or outcome record."
  };
}

function sampleAppIds(rows, limit = 8) {
  return rows.slice(0, limit).map((item) => (item.row ? item.row.ID : item.ID));
}

function sampleSourceRecordId(rows, label) {
  const ids = sampleAppIds(rows);
  if (!ids.length) return `${label}: no sampled APP_IDs; FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`;
  return `EXAMPLES:${ids.map((id) => `APP_ID:${id}`).join("; ")}; FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`;
}

function planningRejectRecord(idSuffix, title, rejectionCategory, reason, rows, duplicateHaystack, terms) {
  const source = SOURCES.dfiPlanningStats;
  const id = `bfs_arch_round592_reject_${idSuffix}`;
  const duplicateTerms = terms || [title, ...sampleAppIds(rows)];
  return {
    id,
    city_id: CITY_ID,
    title,
    rejection_category: rejectionCategory,
    reason,
    source_id: `round592-reject-${idSuffix}`,
    source_record_id: sampleSourceRecordId(rows, idSuffix),
    source_url: source.source_url,
    source_name: source.source_name,
    publisher: source.publisher,
    source_type: source.source_type,
    license: source.license,
    license_url: source.license_url,
    attribution: source.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    sample_app_ids: sampleAppIds(rows),
    duplicate_check_terms: duplicateTerms,
    duplicate_scan_hits: duplicateHitsForTerms(duplicateHaystack, duplicateTerms, id),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD
  };
}

function staticRejectRecord(record, duplicateHaystack) {
  const duplicateTerms = record.duplicate_terms || [record.title];
  return {
    id: record.id,
    city_id: CITY_ID,
    title: record.title,
    rejection_category: record.rejection_category,
    reason: record.reason,
    source_id: record.source_id,
    source_record_id: record.source_record_id,
    source_url: record.source_url,
    source_name: record.source_name,
    publisher: record.publisher,
    source_type: record.source_type,
    license: record.license,
    license_url: record.license_url,
    attribution: record.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    duplicate_check_terms: duplicateTerms,
    duplicate_scan_hits: duplicateHitsForTerms(duplicateHaystack, duplicateTerms, record.id),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD,
    ...(record.layer_urls ? { layer_urls: record.layer_urls } : {}),
    ...(record.publisher_terms_url ? { publisher_terms_url: record.publisher_terms_url } : {})
  };
}

function buildRejectedRecords(rows, duplicateHaystack, eligible, selected) {
  const duplicateRows = duplicatePlanningRows(rows, duplicateHaystack);
  const lowSignalRows = lowSignalPlanningRows(rows, duplicateHaystack);
  const lowSignalGroups = lowSignalRows.reduce((groups, item) => {
    const key = item.low_signal_reason;
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
  const selectedIds = new Set(selected.map((item) => item.row.ID));
  const tailRows = eligible.filter((item) => !selectedIds.has(item.row.ID));
  const rejected = [
    planningRejectRecord(
      `duplicate_project_rows_through_round${DEDUPE_BOUNDARY_ROUND}`,
      `Residual duplicate-project planning rows through the Round${DEDUPE_BOUNDARY_ROUND} boundary`,
      "duplicate_project_boundary",
      `Official point-backed DfI rows already represented by APP_ID in the manual architecture corpus or official Belfast architecture sweep candidate/rejected/readback packs through Round${DEDUPE_BOUNDARY_ROUND} were retained outside the promoted pack.`,
      duplicateRows,
      duplicateHaystack,
      ["Round587", "APP_ID duplicate", "manual architecture corpus"]
    )
  ];

  for (const [reasonKey, items] of Object.entries(lowSignalGroups)) {
    const titles = {
      equipment_signage_boundary_access_or_transport_only:
        "Signage, equipment, boundary/access-only, transport and telecom residual rows",
      condition_status_or_temporary_only:
        "Condition-only, status-only, renewal or temporary planning rows",
      hmo_shortlet_or_guest_use_only:
        "Lower-signal HMO, short-let or guest-accommodation use-only rows"
    };
    const reasons = {
      equipment_signage_boundary_access_or_transport_only:
        "Point-backed DfI rows limited to signs, advertisements, awnings, telecoms, cabinets, bus/street equipment, parking/access, boundary treatments, fencing or similar low-signal works were reviewed but not promoted because they do not add a stronger building-fabric, use, civic-facility or heritage-works milestone for this architecture pack.",
      condition_status_or_temporary_only:
        "Rows limited to condition discharge, non-material amendments, renewal, temporary permissions or status-only administrative changes were retained outside the promoted pack because they do not supply a new observed architecture/development milestone.",
      hmo_shortlet_or_guest_use_only:
        "Point-backed rows limited to HMO, short-let, holiday-let or guest-accommodation use changes without substantial building-fabric evidence were retained for possible housing/use review rather than promoted in this architecture/development batch."
    };
    rejected.push(
      planningRejectRecord(
        reasonKey,
        titles[reasonKey],
        reasonKey,
        reasons[reasonKey],
        items,
        duplicateHaystack,
        [reasonKey, ...sampleAppIds(items)]
      )
    );
  }

  rejected.push(
    planningRejectRecord(
      "eligible_tail_after_target_count",
      "Additional point-backed eligible DfI rows retained after target count",
      "eligible_point_backed_tail_not_promoted",
      `Additional non-duplicate, point-backed DfI rows passed the Round592 architecture filters but were retained outside the promoted pack to keep this next sweep close to the requested ${TARGET_CANDIDATE_COUNT}-candidate target. They may be reconsidered in a later residual pass.`,
      tailRows,
      duplicateHaystack,
      ["eligible point-backed tail", ...sampleAppIds(tailRows)]
    )
  );

  rejected.push(
    staticRejectRecord(
      {
        id: "bfs_arch_round592_reject_page_only_or_no_point_official_leads",
        title: "Official page-only or no-point Belfast architecture leads",
        rejection_category: "page_only_or_geometry_ref_only",
        reason:
          "Northern Ireland Planning Portal application pages, Belfast City Council project/news pages and similar official public pages were retained as citation or discovery leads where they did not provide reusable source-backed point coordinates or where the page duplicated DfI point rows already handled through the planning-statistics CSV.",
        source_id: "round592-reject-page-only-or-no-point-official-leads",
        source_record_id:
          "PLANNING_PORTAL_AND_BCC_PAGES: page-only or geometry-ref-only leads checked; no additional reusable source-backed point rows promoted in this pack",
        source_url: PLANNING_PORTAL_URL,
        source_name: "Northern Ireland Planning Portal and Belfast City Council project pages",
        publisher: "Department for Infrastructure / Belfast City Council planning authority",
        source_type: "official planning application and council web pages",
        license:
          "Official page citation metadata retained; page content and documents require source-specific terms review before redistribution.",
        license_url: DFI_TERMS_URL,
        publisher_terms_url: BCC_TERMS_URL,
        attribution: "Department for Infrastructure / Belfast City Council planning authority",
        duplicate_terms: ["Planning Portal", "Belfast City Council", "project page", "no point coordinates"]
      },
      duplicateHaystack
    )
  );

  rejected.push(
    staticRejectRecord(
      {
        id: "bfs_arch_round592_reject_aggregate_only_dfi_quarterly_sources",
        title: "DfI 2025/26 provisional quarterly planning statistics are aggregate-only for this pack",
        rejection_category: "aggregate_only_no_source_backed_point_records",
        reason:
          "DfI 2025/26 provisional quarterly publications were reviewed as current planning-statistics context available on 2026-05-20, but they were not promoted because this pack requires application-level source rows with application IDs, decision dates and reusable Easting/Northing point coordinates.",
        source_id: "round592-reject-aggregate-only-dfi-quarterly-sources",
        source_record_id:
          "PUBLICATIONS: Northern Ireland planning statistics 2025/26 Q1, Q2 and Q3 provisional quarterly publications; no promoted application-level point rows",
        source_url: DFI_2025_26_Q3_URL,
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: SOURCES.dfiPlanningStats.publisher,
        source_type: "official provisional quarterly planning-statistics publication",
        license: SOURCES.dfiPlanningStats.license,
        license_url: SOURCES.dfiPlanningStats.license_url,
        attribution: SOURCES.dfiPlanningStats.attribution,
        duplicate_terms: ["quarterly", "provisional", "aggregate", "October - December 2025"]
      },
      duplicateHaystack
    )
  );

  rejected.push(
    staticRejectRecord(
      {
        id: "bfs_arch_round592_reject_hed_status_or_geometry_ref_only_leads",
        title: "DfC/HED heritage status or geometry-reference-only leads",
        rejection_category: "status_or_geometry_ref_only_not_promoted",
        reason:
          "Historic Environment Division layers remain useful official spatial/status context, but this pack did not promote rows lacking a new dated architecture/planning event or rows that would only support a register/status observation rather than a planning/statutory-consent milestone.",
        source_id: "round592-reject-hed-status-or-geometry-ref-only-leads",
        source_record_id:
          "HED_FEATURE_SERVICE: Historic Buildings layer and Heritage at Risk layer reviewed; no new dated point-event rows promoted in this DfI residual next37 pack",
        source_url: HED_FEATURE_SERVICE_URL,
        layer_urls: [HED_HISTORIC_BUILDINGS_LAYER_URL, HED_HERITAGE_AT_RISK_LAYER_URL],
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        source_type: "official ArcGIS feature service",
        license: "Crown copyright / Open Government Licence v3.0 where applicable.",
        license_url: OGL_URL,
        attribution: "Department for Communities Historic Environment Division",
        duplicate_terms: ["Historic Environment Division", "Heritage at Risk", "status only", "geometry ref"]
      },
      duplicateHaystack
    )
  );

  return rejected;
}

function validate(candidates, rejected, duplicateHaystack, expectedCandidateCount) {
  const errors = [];
  const warnings = [];
  const required = [
    "id",
    "event_id",
    "candidate_id",
    "city_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "effective_date",
    "source_record_id",
    "source_row_refs",
    "source_url",
    "source_dataset_url",
    "source_name",
    "publisher",
    "source_type",
    "license",
    "attribution",
    "accessed_at",
    "retrieved_at",
    "confidence",
    "limitations",
    "method",
    "transformation_method",
    "latitude",
    "longitude",
    "geometry_source",
    "geometry_precision"
  ];
  const seenIds = new Set();
  const seenCandidateIds = new Set();
  const seenSourceDateKeys = new Set();
  const seenSourceRecordIds = new Set();
  const pointBacked = [];
  const geometryRefOnly = [];
  const badClaim =
    /\b(predicts?|forecast|simulation|simulate|caused|causes|will increase|will decrease|proves|impact score|10-year|officially opened|was opened|has opened|completion report)\b/i;

  if (candidates.length !== expectedCandidateCount) {
    errors.push(
      `Expected ${expectedCandidateCount} promoted next37 candidates, found ${candidates.length}`
    );
  }

  for (const candidate of candidates) {
    if (seenIds.has(candidate.event_id)) {
      errors.push(`Duplicate event_id in candidates: ${candidate.event_id}`);
    }
    seenIds.add(candidate.event_id);
    if (seenCandidateIds.has(candidate.candidate_id)) {
      errors.push(`Duplicate candidate_id in candidates: ${candidate.candidate_id}`);
    }
    seenCandidateIds.add(candidate.candidate_id);
    if (seenSourceDateKeys.has(candidate.source_date_key)) {
      errors.push(`Duplicate source/date key in candidates: ${candidate.source_date_key}`);
    }
    seenSourceDateKeys.add(candidate.source_date_key);
    if (seenSourceRecordIds.has(candidate.source_record_id)) {
      errors.push(`Duplicate source_record_id in candidates: ${candidate.source_record_id}`);
    }
    seenSourceRecordIds.add(candidate.source_record_id);
    for (const field of required) {
      if (
        candidate[field] === undefined ||
        candidate[field] === null ||
        candidate[field] === "" ||
        (Array.isArray(candidate[field]) && candidate[field].length === 0)
      ) {
        errors.push(`${candidate.event_id} missing required field ${field}`);
      }
    }
    if (candidate.city_id !== CITY_ID) {
      errors.push(`${candidate.event_id} has wrong city_id`);
    }
    if (
      candidate.effective_date < DATE_WINDOW.start ||
      candidate.effective_date > DATE_WINDOW.end
    ) {
      errors.push(`${candidate.event_id} effective_date outside task window`);
    }
    if (duplicateHaystack.eventIds.has(candidate.event_id)) {
      errors.push(`${candidate.event_id} already appears in duplicate haystack`);
    }
    if (duplicateHaystack.appIds.has(candidate.source_fields.ID)) {
      errors.push(`${candidate.event_id} overlaps prior APP_ID ${candidate.source_fields.ID}`);
    }
    if (!candidate.geometry && !candidate.geometry_ref) {
      errors.push(`${candidate.event_id} missing geometry or geometry_ref`);
    }
    if (candidate.geometry) {
      const coords = candidate.geometry.coordinates || [];
      if (
        candidate.geometry.type !== "Point" ||
        coords.length !== 2 ||
        !Number.isFinite(coords[0]) ||
        !Number.isFinite(coords[1])
      ) {
        errors.push(`${candidate.event_id} has invalid point geometry`);
      } else {
        pointBacked.push(candidate.event_id);
        if (coords[1] < 54.45 || coords[1] > 54.75 || coords[0] < -6.2 || coords[0] > -5.65) {
          errors.push(`${candidate.event_id} point is outside broad Belfast review bounds`);
        }
      }
      if (
        !Number.isFinite(candidate.latitude) ||
        !Number.isFinite(candidate.longitude)
      ) {
        errors.push(`${candidate.event_id} has point geometry without latitude/longitude`);
      }
      if (candidate.point_corpus_ready !== true) {
        errors.push(`${candidate.event_id} point-backed record must set point_corpus_ready true`);
      }
    } else {
      geometryRefOnly.push(candidate.event_id);
      if (candidate.point_corpus_ready !== false) {
        errors.push(
          `${candidate.event_id} geometry_ref-only record must set point_corpus_ready false`
        );
      }
      warnings.push(`${candidate.event_id} is geometry_ref-only and not point-corpus-ready`);
    }
    const claimText = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      ...(candidate.evidence_basis || []),
      ...(candidate.limitations || [])
    ].join(" ");
    if (badClaim.test(claimText)) {
      errors.push(`${candidate.event_id} contains overclaim language`);
    }
  }

  for (const item of rejected) {
    for (const field of [
      "id",
      "city_id",
      "title",
      "rejection_category",
      "reason",
      "source_url",
      "source_name",
      "publisher",
      "source_type",
      "source_record_id",
      "license",
      "attribution",
      "accessed_at",
      "retrieved_at"
    ]) {
      if (item[field] === undefined || item[field] === null || item[field] === "") {
        errors.push(`${item.id} missing rejected field ${field}`);
      }
    }
  }

  return { pointBacked, geometryRefOnly, errors, warnings };
}

function minMaxDates(candidates) {
  const dates = candidates.map((candidate) => candidate.effective_date).sort();
  return {
    start: dates[0] || null,
    end: dates[dates.length - 1] || null
  };
}

function countBy(candidates, key) {
  return candidates.reduce((acc, candidate) => {
    const value = candidate[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildSourceAudit(candidates, rejected, duplicateHaystack) {
  return {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    candidate_target: TARGET_CANDIDATE_COUNT,
    dedupe_boundary: `Round${DEDUPE_BOUNDARY_ROUND}`,
    sources_checked: [
      {
        ...SOURCES.dfiPlanningStats,
        local_file: PLANNING_CSV_PATH,
        local_file_sha256: sha256(readTextIfExists(PLANNING_CSV_PATH)),
        accepted_records: candidates.length,
        accepted_app_ids: candidates.map((candidate) => candidate.source_fields.ID),
        disposition:
          `accepted curated residual Belfast planning/statutory-consent rows with official Easting/Northing after manual/corpus/official-sweep duplicate review through Round${DEDUPE_BOUNDARY_ROUND}`
      },
      {
        ...SOURCES.epsg29902,
        accepted_records: candidates.length,
        disposition:
          "used as coordinate-reference provenance for deterministic conversion of source Easting/Northing to WGS84 point coordinates"
      },
      {
        source_id: "dfi-planning-statistics-2025-26-quarterly-reviewed-round592",
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: "Department for Infrastructure, Northern Ireland",
        source_url: DFI_2025_26_Q3_URL,
        related_urls: [DFI_2025_26_Q1_URL, DFI_2025_26_Q2_URL, DFI_2025_26_Q3_URL],
        source_type: "official provisional quarterly planning-statistics publication",
        license: SOURCES.dfiPlanningStats.license,
        license_url: OGL_URL,
        attribution: SOURCES.dfiPlanningStats.attribution,
        accepted_records: 0,
        disposition:
          "reviewed for current coverage; not promoted because the available 2025/26 quarterly releases are aggregate/provisional tables rather than final annual application-level CSV rows with Easting/Northing"
      },
      {
        source_id: "hed-historic-buildings-and-harni-reviewed-round592",
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        source_url: HED_FEATURE_SERVICE_URL,
        layer_urls: [HED_HISTORIC_BUILDINGS_LAYER_URL, HED_HERITAGE_AT_RISK_LAYER_URL],
        source_type: "official ArcGIS feature service",
        license: "Crown copyright / Open Government Licence v3.0 where applicable.",
        license_url: OGL_URL,
        attribution: "Department for Communities Historic Environment Division",
        accepted_records: 0,
        disposition:
          "reviewed; retained as heritage spatial/status context because this DfI residual pack promotes planning/statutory-consent point rows only"
      },
      {
        source_id: "bcc-and-planning-portal-pages-reviewed-round592",
        source_name: "Northern Ireland Planning Portal and Belfast City Council project pages",
        publisher: "Department for Infrastructure / Belfast City Council planning authority",
        source_url: PLANNING_PORTAL_URL,
        related_urls: [BCC_PROJECTS_URL, BCC_TERMS_URL],
        source_type: "official planning application and council web pages",
        license:
          "Official page citation metadata retained; page content and documents require source-specific terms review before redistribution.",
        accepted_records: 0,
        disposition:
          "reviewed as page-only/context leads; not promoted without reusable source-backed point geometry or because they duplicate DfI point-backed rows"
      },
      ...rejected.map((item) => ({
        source_id: item.source_id,
        source_name: item.source_name,
        publisher: item.publisher,
        source_url: item.source_url,
        source_type: item.source_type,
        disposition: item.rejection_category,
        reason: item.reason
      }))
    ],
    search_queries_checked: SEARCH_QUERIES_CHECKED,
    duplicate_scan: {
      roots: duplicateHaystack.roots,
      files_checked: duplicateHaystack.files_checked,
      app_id_count: duplicateHaystack.appIds.size,
      source_record_id_count: duplicateHaystack.sourceRecordIds.size,
      event_id_count: duplicateHaystack.eventIds.size,
      url_count: duplicateHaystack.urls.size,
      sampled_chars: duplicateHaystack.sampled_chars,
      note:
        `Duplicate scan is conservative and text-based over the manual architecture corpus and official Belfast architecture sweep candidate/rejected/readback packs through Round${DEDUPE_BOUNDARY_ROUND}; generated web/data atlas outputs are not treated as source-of-truth blockers.`
    },
    source_assessment: [
      {
        source_name: SOURCES.dfiPlanningStats.source_name,
        publisher: SOURCES.dfiPlanningStats.publisher,
        reliability: SOURCES.dfiPlanningStats.reliability,
        required_caveat:
          "Rows support administrative planning/statutory-consent evidence only. They do not demonstrate built completion, opening, occupation, service delivery or outcomes.",
        ingestion_recommendation:
          "Point-backed review candidates may be promoted only if the atlas accepts planning/statutory-consent milestones and carries the administrative-status limitations inline."
      },
      {
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: "Department for Infrastructure, Northern Ireland",
        reliability:
          "usable for aggregate current context; not usable for this point-event ingestion until the annual application-level dataset is published",
        required_caveat:
          "Quarterly tables should not be treated as point-backed application rows without application IDs, row-level dates and Easting/Northing.",
        ingestion_recommendation:
          "Retain as source audit context and revisit after the final 2025/26 annual application-level dataset is available."
      },
      {
        source_name: SOURCES.epsg29902.source_name,
        publisher: SOURCES.epsg29902.publisher,
        reliability:
          "strong for CRS parameter provenance; does not certify the DfI row point as a surveyed footprint",
        required_caveat:
          "Converted points represent source row Easting/Northing locations only, not planning red-line boundaries or building footprints.",
        ingestion_recommendation:
          "Retain source Easting/Northing, CRS URL and conversion method alongside WGS84 coordinates."
      },
      {
        source_name: "Historic Environment Division GIS Data",
        publisher: "Department for Communities Historic Environment Division",
        reliability:
          "strong for heritage status/location; not used here for physical-change dating or planning/statutory-consent rows",
        required_caveat:
          "Status/listing/register dates are not construction, repair, completion or condition-improvement dates.",
        ingestion_recommendation:
          "Use only when a dated designation/status event is explicitly in scope and carry status limitations."
      }
    ],
    caveats: [
      "All accepted candidates are administrative planning/statutory-consent records, not physical start, completion, opening or occupation evidence.",
      "All accepted candidates are point-backed by official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit CRS parameters.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include duplicate-project consents, 2025/26 quarterly aggregate-only releases, lower-priority fixture/equipment/signage/boundary/access-only changes, lower-signal HMO/short-let-only rows, condition-only/compliance variations, telecom/transport/street-furniture rows, page-only leads and status-only heritage sources.",
      "No prediction, simulation, causality, service-performance, capacity, health, education, environmental, economic or heritage-condition outcome claim is made."
    ]
  };
}

function main() {
  ensureDir(OUT_DIR);
  const planningRows = readPlanningRows();
  const duplicateHaystack = collectDuplicateHaystack();
  const eligible = eligiblePlanningRows(planningRows, duplicateHaystack);
  const selected = selectPromotedRows(eligible);
  const expectedCandidateCount = Math.min(TARGET_CANDIDATE_COUNT, eligible.length);
  const candidates = selected
    .map((item) => candidateFromPlanningRow(item, duplicateHaystack))
    .sort(
      (a, b) =>
        a.effective_date.localeCompare(b.effective_date) ||
        a.event_id.localeCompare(b.event_id)
    );
  const rejected = buildRejectedRecords(planningRows, duplicateHaystack, eligible, selected);
  const validation = validate(candidates, rejected, duplicateHaystack, expectedCandidateCount);
  const dateRange = minMaxDates(candidates);
  const publishers = [...new Set(candidates.map((candidate) => candidate.publisher))].sort();
  const pointBackedCount = validation.pointBacked.length;
  const geometryRefOnlyCount = validation.geometryRefOnly.length;
  const categoryCounts = countBy(candidates, "category");
  const eventTypeCounts = countBy(candidates, "event_type");
  const sourceAudit = buildSourceAudit(candidates, rejected, duplicateHaystack);

  const validationReport = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    ok: validation.errors.length === 0,
    candidate_target: TARGET_CANDIDATE_COUNT,
    eligible_count_before_target: eligible.length,
    expected_candidate_count: expectedCandidateCount,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    publishers,
    source_count: new Set(candidates.map((candidate) => candidate.source_id)).size,
    source_record_id_count: new Set(candidates.map((candidate) => candidate.source_record_id))
      .size,
    source_date_key_count: new Set(candidates.map((candidate) => candidate.source_date_key))
      .size,
    category_counts: categoryCounts,
    event_type_counts: eventTypeCounts,
    warnings: validation.warnings,
    errors: validation.errors,
    duplicate_scan_roots: duplicateHaystack.roots,
    duplicate_scan_files_checked: duplicateHaystack.files_checked,
    dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND,
    searched_queries: SEARCH_QUERIES_CHECKED
  };

  const summary = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    accepted_count: candidates.length,
    rejected_count: rejected.length,
    point_backed_count: pointBackedCount,
    geometry_ref_only_count: geometryRefOnlyCount,
    date_range: dateRange,
    sources: publishers,
    source_mix: {
      source_types: countBy(candidates, "source_type"),
      categories: categoryCounts,
      event_types: eventTypeCounts
    },
    caveats: sourceAudit.caveats,
    outputs: [
      path.join(OUT_DIR, "candidates.json"),
      path.join(OUT_DIR, "rejected.json"),
      path.join(OUT_DIR, "validation_report.json"),
      path.join(OUT_DIR, "source_audit.json"),
      path.join(OUT_DIR, "summary.json"),
      path.join(OUT_DIR, "readback.json"),
      path.join(OUT_DIR, "notes.md")
    ]
  };

  const readback = {
    round_id: ROUND_ID,
    accepted_event_ids: candidates.map((candidate) => candidate.event_id),
    accepted_candidate_ids: candidates.map((candidate) => candidate.candidate_id),
    accepted_source_record_ids: candidates.map((candidate) => candidate.source_record_id),
    accepted_source_date_keys: candidates.map((candidate) => candidate.source_date_key),
    accepted_source_row_refs: candidates.flatMap((candidate) => candidate.source_row_refs),
    accepted_app_ids: candidates.map((candidate) => candidate.source_fields.ID),
    rejected_ids: rejected.map((item) => item.id),
    point_backed_event_ids: validation.pointBacked,
    geometry_ref_only_event_ids: validation.geometryRefOnly,
    point_corpus_ready:
      validation.geometryRefOnly.length === 0 && validation.errors.length === 0,
    validation_ok: validation.errors.length === 0,
    dedupe_boundary_round: DEDUPE_BOUNDARY_ROUND
  };

  const notes = [
    `# ${ROUND_ID}`,
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Result",
    "",
    `- Accepted candidates: ${candidates.length}`,
    `- Rejected/retained lead groups: ${rejected.length}`,
    `- Point-backed candidates: ${pointBackedCount}`,
    `- Geometry-ref-only accepted candidates: ${geometryRefOnlyCount}`,
    `- Date range: ${dateRange.start} to ${dateRange.end}`,
    `- Dedupe boundary: Round${DEDUPE_BOUNDARY_ROUND}`,
    `- Eligible non-duplicate DfI rows before target cap: ${eligible.length}`,
    "",
    "## Accepted Source Mix",
    "",
    `- Department for Infrastructure planning statistics 2024/25: ${candidates.length} selected Belfast planning, listed-building, demolition-consent or statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or official Belfast architecture sweep candidate/rejected/readback packs through Round${DEDUPE_BOUNDARY_ROUND}.`,
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- The source mix is intentionally administrative: approvals and consents are recorded as planning milestones, not physical completion or opening evidence.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- DfI 2025/26 provisional quarterly planning-statistics publications were checked as the current DfI planning-statistics context available on 2026-05-20, but they were not promoted because this pack requires application-level rows with Easting/Northing.",
    "- DfC/HED layers were checked as official spatial/status context; they were not promoted in this DfI residual batch without a new dated planning/statutory-consent point-event row.",
    "- Belfast City Council and Planning Portal pages remain citation-only/page-only or license-limited leads unless a source-backed point/boundary and compatible reuse terms are available.",
    "- Duplicate rows, short-let/HMO-only rows without substantial fabric signal, signage/display-only rows, equipment-only rows, boundary/access-only rows, transport/telecom/street-furniture rows and condition/status-only rows were retained in rejected.json.",
    "",
    "## Caveats",
    "",
    "- Planning approvals and listed-building/demolition/other consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.",
    "- Source-backed points come from official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84; use as application/site navigation points only.",
    "- No accepted record uses invented coordinates or generic geocoding.",
    "- No causality, prediction, simulation, service-performance, health, education, environmental, economic or heritage-condition impact claim is made.",
    ""
  ].join("\n");

  writeJson(path.join(OUT_DIR, "candidates.json"), candidates);
  writeJson(path.join(OUT_DIR, "rejected.json"), rejected);
  writeJson(path.join(OUT_DIR, "validation_report.json"), validationReport);
  writeJson(path.join(OUT_DIR, "source_audit.json"), sourceAudit);
  writeJson(path.join(OUT_DIR, "summary.json"), summary);
  writeJson(path.join(OUT_DIR, "readback.json"), readback);
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), notes);

  if (validation.errors.length) {
    console.error(JSON.stringify(validationReport, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        accepted_count: candidates.length,
        rejected_count: rejected.length,
        point_backed_count: pointBackedCount,
        geometry_ref_only_count: geometryRefOnlyCount,
        date_range: dateRange,
        out_dir: OUT_DIR
      },
      null,
      2
    )
  );
}

main();
