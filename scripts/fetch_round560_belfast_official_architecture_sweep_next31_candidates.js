#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROUND_ID = "round560_belfast_official_architecture_sweep_next31";
const OUT_DIR = path.join("tmp", "subagents", ROUND_ID);
const SCRIPT_PATH =
  "scripts/fetch_round560_belfast_official_architecture_sweep_next31_candidates.js";
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const CITY_ID = "belfast";
const EXPECTED_CANDIDATE_COUNT = 30;
const DATE_WINDOW = {
  start: "2008-01-01",
  end: "2026-05-20"
};
const DEDUPE_BOUNDARY_ROUND = 554;

const OGL_URL =
  "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const DFI_PLANNING_ACTIVITY_URL =
  "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const DFI_2024_25_PUBLICATION_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025";
const DFI_2024_25_CSV_URL =
  "https://www.infrastructure-ni.gov.uk/system/files/2025-06/planning-statistics-2024-25-dataset.csv";
const DFI_2025_26_Q3_URL =
  "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-october-december-2025";
const DFI_TERMS_URL = "https://www.infrastructure-ni.gov.uk/terms-and-conditions";
const EPSG_29902_URL = "https://epsg.io/29902";
const HED_FEATURE_SERVICE_URL =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer";
const HED_HISTORIC_BUILDINGS_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/1`;
const HED_HERITAGE_AT_RISK_LAYER_URL = `${HED_FEATURE_SERVICE_URL}/3`;
const BCC_TERMS_URL = "https://www.belfastcity.gov.uk/terms-conditions";
const BCC_COPYRIGHT_URL = "https://www.belfastcity.gov.uk/Copyright";

const PLANNING_DATASET = "planning-statistics-2024-25-dataset.csv";
const PLANNING_CSV_PATH = path.join(
  "data",
  "raw",
  "planning_statistics",
  PLANNING_DATASET
);

const METHOD = [
  "round560 official Belfast architecture sweep next31 after the completed Round554 next30 pack.",
  "Accepted selected residual DfI planning-statistics 2024-25 Belfast rows only where the source row supplied an approved planning, demolition-consent or statutory-consent decision date and official Easting/Northing.",
  "Source Easting/Northing is converted deterministically from EPSG:29902 TM65 / Irish Grid to WGS84 using the EPSG projection parameters and TOWGS84 transform.",
  "Each accepted record is an observed administrative planning, listed-building, demolition-consent or other-consent milestone only.",
  "The records do not assert that works started, works completed, premises opened, occupation changed, or any public, service, economic, environmental, health, education or heritage outcome followed.",
  "Round554 is treated as the latest Belfast official architecture sweep dedupe boundary; official page-only, geometry-ref-only, duplicate-project, status-only, signage-only, equipment-only and lower-priority private-use leads are retained separately."
].join(" ");

const TRANSFORMATION_METHOD = `${SCRIPT_PATH}#round560OfficialArchitectureSweepnext31`;

const SOURCES = {
  dfiPlanningStats: {
    source_id: "dfi-planning-statistics-2024-25-round560",
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

const PLANNING_LEADS = [];

const REJECTED_LEADS = [];

const SEARCH_QUERIES_CHECKED = [
  "local DfI planning-statistics 2024-25 Belfast residual APP_ID scan after Round554 accepted-pack dedupe",
  "local duplicate scan: data/manual_drops/architecture_milestones plus official Belfast architecture sweep candidate packs through Round554",
  "source review: DfI planning activity statistics page and 2024/25 annual application-level CSV",
  "source review: DfI 2025/26 Q1-Q3 provisional quarterly publication pages; retained until final annual row-level dataset with coordinates",
  "source review: EPSG:29902 TM65 / Irish Grid projection and TOWGS84 parameters for Easting/Northing conversion",
  "source review: DfC/HED Historic Buildings and Heritage at Risk ArcGIS feature layers",
  "source review: Belfast City Council official project/news pages and website copyright terms",
  "source review: DfI point-backed duplicate-project, minor domestic, low-signal HMO/short-let, signage, equipment, transport and telecom rows retained outside promoted pack"
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

function replaceRound560LeadBlocks() {
  const lead = (
    app_id,
    related_app_ids,
    event_id,
    title,
    observed_change,
    admin_proposal_summary,
    event_type,
    category,
    limitation_topic
  ) => ({
    app_id,
    ...(related_app_ids.length ? { related_app_ids } : {}),
    event_id,
    title,
    observed_change,
    admin_proposal_summary,
    event_type,
    category,
    limitation_topic
  });

  const selectedLeads = [
    { app_id: "LA04/2024/0041/F" },
    { app_id: "LA04/2023/4322/F" },
    { app_id: "LA04/2024/0009/F" },
    { app_id: "LA04/2024/0028/F" },
    { app_id: "LA04/2024/0250/F" },
    { app_id: "LA04/2024/0297/F" },
    { app_id: "LA04/2023/4311/F" },
    { app_id: "LA04/2023/4332/F" },
    { app_id: "LA04/2024/0123/F" },
    { app_id: "LA04/2023/3013/F" },
    { app_id: "LA04/2024/0078/F" },
    { app_id: "LA04/2024/0450/F" },
    { app_id: "LA04/2023/4398/F" },
    { app_id: "LA04/2024/0275/F" },
    { app_id: "LA04/2023/3902/F" },
    { app_id: "LA04/2024/0182/F" },
    { app_id: "LA04/2024/0204/F" },
    { app_id: "LA04/2024/0258/F" },
    { app_id: "LA04/2024/0256/F", related_app_ids: ["LA04/2024/0252/DCA"] },
    { app_id: "LA04/2023/3266/F" },
    { app_id: "LA04/2024/0460/F" },
    { app_id: "LA04/2024/0595/F" },
    { app_id: "LA04/2024/0246/F" },
    { app_id: "LA04/2024/0363/F" },
    { app_id: "LA04/2024/0476/F" },
    { app_id: "LA04/2023/4605/F" },
    { app_id: "LA04/2024/0324/F", related_app_ids: ["LA04/2024/0319/DCA"] },
    { app_id: "LA04/2024/0011/F" },
    { app_id: "LA04/2024/0242/F" },
    { app_id: "LA04/2024/0159/F" }
  ];

  const rowsById = new Map(readPlanningRows().map((row) => [row.ID, row]));
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const siteLabel = (row) =>
    clean(row.SiteAddress)
      .replace(/,?\s*Belfast\b.*$/i, "")
      .replace(/,?\s*BT\d.*$/i, "")
      .replace(/\.$/, "");
  const slug = (value) =>
    clean(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64)
      .replace(/_+$/g, "");
  const classify = (row) => {
    const text = `${row.Proposal} ${row.StatsCategory}`.toLowerCase();
    if (text.includes("listed building") || row.AppType === "Listed Building Consents") {
      return {
        event_type: "planning_decision_listed_building_consent",
        category: "architecture_heritage_admin"
      };
    }
    if (/school|classroom|health|hospital|surgery|community|footbridge|public realm|sport|pavilion|facility|civic/.test(text)) {
      return {
        event_type: "planning_decision_civic_development",
        category: "architecture_civic_development_admin"
      };
    }
    if (/office|restaurant|retail|warehouse|hotel|aparthotel|bar|commercial|entertainment|gallery|glamping/.test(text)) {
      return {
        event_type: "planning_decision_commercial_or_mixed_use_development",
        category: "architecture_commercial_development_admin"
      };
    }
    if (text.includes("change of use")) {
      return {
        event_type: "planning_decision_change_of_use",
        category: "architecture_commercial_development_admin"
      };
    }
    if (text.includes("outbuilding")) {
      return {
        event_type: "planning_decision_residential_outbuilding",
        category: "architecture_residential_fabric_admin"
      };
    }
    if (/proposed dwelling|new dwelling|detached dwelling|residential development|apartments|dwellinghouses|student accommodation/.test(text)) {
      return {
        event_type: "planning_decision_residential_development",
        category: "architecture_residential_development_admin"
      };
    }
    return {
      event_type: "planning_decision_residential_extension",
      category: "architecture_residential_fabric_admin"
    };
  };

  PLANNING_LEADS.splice(
    0,
    PLANNING_LEADS.length,
    ...selectedLeads.map((selected) => {
      const row = rowsById.get(selected.app_id);
      if (!row) throw new Error(`Selected Round560 app ID missing source row: ${selected.app_id}`);
      const site = siteLabel(row);
      const proposal = clean(row.Proposal).replace(/\.$/, "");
      const appKey = selected.app_id.toLowerCase().replace(/^la04\//, "").replace(/[^a-z0-9]+/g, "_");
      const eventId = `bfs_arch_round560_${slug(site)}_${appKey}_approval_2024`;
      const classification = classify(row);
      return lead(
        selected.app_id,
        selected.related_app_ids || [],
        eventId,
        `${site} ${proposal.toLowerCase()} approval was recorded`,
        `Official planning-statistics row records approval for ${proposal.toLowerCase()} at ${site}.`,
        proposal,
        classification.event_type,
        classification.category,
        `${proposal.toLowerCase()} approval`
      );
    })
  );
}

replaceRound560LeadBlocks();

REJECTED_LEADS.splice(
  0,
  REJECTED_LEADS.length,
  {
    id: "bfs_arch_round560_reject_duplicate_project_rows_through_round554",
    title: "Residual duplicate-project planning rows through the Round554 boundary",
    rejection_category: "duplicate_project_boundary",
    reason:
      "Official point-backed DfI rows for already-covered project families or same-site milestones were retained outside the promoted pack because the manual architecture corpus or official Belfast architecture sweep candidate records through Round554 already cover the same project family.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2022/1458/LBC; APP_ID:LA04/2024/0898/LBC; APP_ID:LA04/2021/1593/F; APP_ID:LA04/2024/0507/F; APP_ID:LA04/2024/0757/LBC; APP_ID:LA04/2021/0316/DCA; APP_ID:LA04/2023/4579/F; APP_ID:LA04/2024/1808/LBC; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: [
      "Glenwood Primary School",
      "41 High Street",
      "Blanchflower Playing Fields",
      "2 Adelaide Park",
      "99 Upper Newtownards Road",
      "37-39 Wellington Park",
      "70 High Street",
      "15-19 William Street South"
    ]
  },
  {
    id: "bfs_arch_round560_reject_short_let_and_hmo_only_tail",
    title: "Lower-signal short-let and HMO-only residual rows",
    rejection_category: "lower_priority_private_residential_use_change_not_promoted",
    reason:
      "Residual point-backed DfI rows limited to apartment-to-short-let, dwelling-to-HMO or guest-accommodation use changes with little or no substantial building-fabric signal were retained for a possible housing-use pass rather than promoted in this architecture/development batch.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2023/3692/F; APP_ID:LA04/2024/0557/F; APP_ID:LA04/2024/0719/F; APP_ID:LA04/2024/1740/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["short term let", "HMO", "Sui Generis", "guest accommodation"]
  },
  {
    id: "bfs_arch_round560_reject_page_only_or_no_point_official_leads",
    title: "Official page-only or no-point Belfast architecture leads",
    rejection_category: "page_only_or_geometry_ref_only",
    reason:
      "Belfast City Council, planning portal and project/news pages were retained as citation or discovery leads where they did not provide reusable source-backed point coordinates or where the page duplicated DfI point rows already handled through the planning-statistics CSV.",
    source_record_id:
      "BCC project/news pages and Planning Portal application pages checked; no additional reusable source-backed point rows promoted in this pack",
    source_url: "https://planningregister.planningsystemni.gov.uk/",
    source_name: "Northern Ireland Planning Portal and Belfast City Council project pages",
    publisher: "Department for Infrastructure / Belfast City Council planning authority",
    source_type: "official planning application and council web pages",
    license:
      "Official page citation metadata retained; page content and documents require source-specific terms review before redistribution.",
    license_url: DFI_TERMS_URL,
    attribution: "Department for Infrastructure / Belfast City Council planning authority",
    duplicate_terms: ["Planning Portal", "Belfast City Council", "project page", "no point coordinates"]
  },
  {
    id: "bfs_arch_round560_reject_signage_equipment_transport_rows",
    title: "Signage, equipment-only, transport and telecom residual rows",
    rejection_category: "not_architecture_atlas_priority",
    reason:
      "Point-backed DfI rows for advertisements, display plaques, bus/coach parking, fencing-only works, equipment-only changes and telecom/transport changes were reviewed but not promoted because they do not add a higher-signal building-fabric, use, civic-facility or heritage-works milestone for this pack.",
    source_record_id:
      "EXAMPLES:APP_ID:LA04/2024/0974/F; APP_ID:LA04/2024/1656/A; APP_ID:LA04/2024/0587/F; APP_ID:LA04/2024/0334/F; FILE:data/raw/planning_statistics/planning-statistics-2024-25-dataset.csv",
    source_url: DFI_2024_25_PUBLICATION_URL,
    source_name: SOURCES.dfiPlanningStats.source_name,
    publisher: SOURCES.dfiPlanningStats.publisher,
    source_type: SOURCES.dfiPlanningStats.source_type,
    license: SOURCES.dfiPlanningStats.license,
    license_url: SOURCES.dfiPlanningStats.license_url,
    attribution: SOURCES.dfiPlanningStats.attribution,
    duplicate_terms: ["advertisement", "coach parking", "fencing", "shipping container", "building plaque"]
  }
);

function readPlanningRows() {
  const text = readTextIfExists(PLANNING_CSV_PATH);
  if (!text) {
    throw new Error(`Missing planning CSV: ${PLANNING_CSV_PATH}`);
  }
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
    if (!/candidates\.json$/i.test(normalized)) continue;
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
      `tmp/subagents official Belfast architecture sweep candidates through round${DEDUPE_BOUNDARY_ROUND}`
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

function sourceRecordIdFor(row, relatedRows = []) {
  const bits = [
    `APP_ID:${row.ID}`,
    ...relatedRows.map((related) => `RELATED_APP_ID:${related.ID}`),
    `FILE:${PLANNING_CSV_PATH.replace(/\\/g, "/")}`,
    `ROW:${row.row_number}`
  ];
  return bits.join("; ");
}

function limitationsFor(lead) {
  return [
    `This records an approved planning/listed-building/demolition/other-consent administrative milestone for ${lead.limitation_topic}; it does not confirm site works started, physical works completed, opening, occupation, operational use, final built form, funding, public access, heritage condition, service delivery or any outcome.`,
    "The point is transformed from official planning-statistics Easting/Northing in EPSG:29902 TM65 / Irish Grid and should be treated as an application/site navigation point, not a surveyed footprint, legal red-line boundary, curtilage, room, facade, wall, streetworks area, campus boundary, or works extent.",
    "The source row supports the application decision date and administrative decision status only; separate completion/opening evidence would be required for a physical-change corpus record."
  ];
}

function candidateFromPlanningLead(lead, rowsById, duplicateHaystack) {
  const row = rowsById.get(lead.app_id);
  if (!row) throw new Error(`Planning lead missing source row: ${lead.app_id}`);
  const relatedRows = (lead.related_app_ids || []).map((appId) => rowsById.get(appId));
  if ((lead.related_app_ids || []).length !== relatedRows.length) {
    throw new Error(`Planning lead missing related source row: ${lead.event_id}`);
  }
  const decisionDate = parseDate(row.DecisionIssuedDate || row.DateValid);
  const easting = normaliseNumber(row.Easting);
  const northing = normaliseNumber(row.Northing);
  const point = irishGridToWgs84(easting, northing);
  if (!decisionDate) throw new Error(`Planning lead missing decision date: ${lead.app_id}`);
  if (!point) throw new Error(`Planning lead missing source point: ${lead.app_id}`);

  const appIdsForCandidate = [row.ID, ...relatedRows.map((related) => related.ID)];
  for (const appId of appIdsForCandidate) {
    if (duplicateHaystack.appIds.has(appId)) {
      throw new Error(`Planning lead duplicates prior accepted/corpus APP_ID: ${appId}`);
    }
  }

  const sourceRecordId = sourceRecordIdFor(row, relatedRows);
  if (duplicateHaystack.sourceRecordIds.has(sourceRecordId)) {
    throw new Error(`Planning lead duplicates prior source record: ${sourceRecordId}`);
  }
  if (duplicateHaystack.eventIds.has(lead.event_id)) {
    throw new Error(`Planning lead duplicates prior event_id: ${lead.event_id}`);
  }

  const source = SOURCES.dfiPlanningStats;
  const sourceRowRefs = [
    {
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      source_record_id: `APP_ID:${row.ID}`,
      role: "primary"
    },
    ...relatedRows.map((related) => ({
      source_file_name: related.source_file_name,
      source_row_number: related.row_number,
      source_record_id: `APP_ID:${related.ID}`,
      role: "related"
    }))
  ];
  const duplicateTerms = [
    lead.event_id,
    row.ID,
    ...relatedRows.map((related) => related.ID),
    row.SiteAddress,
    lead.title,
    lead.admin_proposal_summary
  ];
  const duplicateScanHits = duplicateHitsForTerms(
    duplicateHaystack,
    duplicateTerms.filter((term) => !String(term).startsWith("LA04/")),
    lead.event_id
  );
  const cleanSiteAddress = row.SiteAddress.replace(/\.\s*$/, "");

  return {
    id: lead.event_id,
    event_id: lead.event_id,
    candidate_id: lead.event_id,
    city_id: CITY_ID,
    title: lead.title,
    summary: `${source.publisher}'s ${source.coverage_years} planning-statistics dataset records ${row.Decision_Withdrawal || row.StatusAt31Mar} for ${row.ID} at ${cleanSiteAddress}. Administrative proposal summary: ${lead.admin_proposal_summary}`,
    observed_change: lead.observed_change,
    event_type: lead.event_type,
    category: lead.category,
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
    easting,
    northing,
    source_easting: easting,
    source_northing: northing,
    coordinate_reference_system: "EPSG:29902 TM65 / Irish Grid",
    coordinate_conversion:
      "Deterministic EPSG:29902 TM65 / Irish Grid inverse Transverse Mercator conversion to WGS84 using Airy Modified 1849 ellipsoid, latitude_of_origin 53.5, central_meridian -8, scale_factor 1.000035, false_easting 200000, false_northing 250000, and TOWGS84[482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15].",
    coordinate_reference_url: EPSG_29902_URL,
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: null,
    geometry_source:
      "Source-backed DfI planning-statistics Easting/Northing converted from EPSG:29902 TM65 / Irish Grid to WGS84.",
    geometry_precision:
      "Application/site navigation point from official planning-statistics row; not a surveyed footprint, legal boundary, facade, room, campus, streetworks area or works extent.",
    point_corpus_ready: true,
    source_fields: {
      ID: row.ID,
      related_app_ids: relatedRows.map((related) => related.ID),
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
      source_file_name: row.source_file_name,
      source_row_number: row.row_number,
      related_source_rows: relatedRows.map((related) => ({
        ID: related.ID,
        AppType: related.AppType,
        StatsCategory: related.StatsCategory,
        Proposal: related.Proposal,
        SiteAddress: related.SiteAddress,
        Easting: related.Easting,
        Northing: related.Northing,
        Decision_Withdrawal: related.Decision_Withdrawal,
        DecisionIssuedDate: related.DecisionIssuedDate,
        source_row_number: related.row_number
      }))
    },
    evidence_basis: [
      "Official DfI planning-statistics row supplies application ID, decision status, decision date, site address, proposal text and Easting/Northing.",
      "The candidate is modelled as an observed administrative planning/statutory-consent milestone only.",
      `APP_ID and related APP_IDs were absent from the manual architecture corpus and official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND} during this sweep.`
    ],
    limitations: limitationsFor(lead),
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
      `APP_ID, related APP_IDs, event_id and source_record_id were absent from the manual architecture corpus and official Belfast architecture sweep candidate outputs through Round${DEDUPE_BOUNDARY_ROUND} checked by the round560 duplicate scan.`,
    duplicate_scan_hits: duplicateScanHits
  };
}

function rejectedRecord(lead, duplicateHaystack) {
  return {
    id: lead.id,
    city_id: CITY_ID,
    title: lead.title,
    rejection_category: lead.rejection_category,
    reason: lead.reason,
    source_id: lead.id.replace(/^bfs_arch_round560_reject_/, "round560-reject-"),
    source_record_id: lead.source_record_id,
    source_url: lead.source_url,
    source_name: lead.source_name,
    publisher: lead.publisher,
    source_type: lead.source_type,
    license: lead.license,
    license_url: lead.license_url,
    attribution: lead.attribution,
    accessed_at: ACCESSED_AT,
    retrieved_at: ACCESSED_AT,
    confidence: "documented",
    duplicate_check_terms: lead.duplicate_terms || [lead.title],
    duplicate_scan_hits: duplicateHitsForTerms(
      duplicateHaystack,
      lead.duplicate_terms || [lead.title],
      lead.id
    ),
    method: METHOD,
    transformation_method: TRANSFORMATION_METHOD
  };
}

function validate(candidates, rejected, duplicateHaystack) {
  const errors = [];
  const warnings = [];
  const required = [
    "id",
    "event_id",
    "candidate_id",
    "city_id",
    "title",
    "summary",
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

  if (candidates.length !== EXPECTED_CANDIDATE_COUNT) {
    errors.push(
      `Expected ${EXPECTED_CANDIDATE_COUNT} promoted next31 candidates, found ${candidates.length}`
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
    for (const appId of [
      candidate.source_fields.ID,
      ...(candidate.source_fields.related_app_ids || [])
    ]) {
      if (duplicateHaystack.appIds.has(appId)) {
        errors.push(`${candidate.event_id} overlaps prior APP_ID ${appId}`);
      }
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

function main() {
  ensureDir(OUT_DIR);
  const planningRows = readPlanningRows();
  const rowsById = new Map(planningRows.map((row) => [row.ID, row]));
  const duplicateHaystack = collectDuplicateHaystack();

  const candidates = PLANNING_LEADS.map((lead) =>
    candidateFromPlanningLead(lead, rowsById, duplicateHaystack)
  ).sort(
    (a, b) =>
      a.effective_date.localeCompare(b.effective_date) ||
      a.event_id.localeCompare(b.event_id)
  );
  const rejected = REJECTED_LEADS.map((lead) => rejectedRecord(lead, duplicateHaystack));
  const validation = validate(candidates, rejected, duplicateHaystack);
  const dateRange = minMaxDates(candidates);
  const publishers = [...new Set(candidates.map((candidate) => candidate.publisher))].sort();
  const pointBackedCount = validation.pointBacked.length;
  const geometryRefOnlyCount = validation.geometryRefOnly.length;
  const categoryCounts = countBy(candidates, "category");
  const eventTypeCounts = countBy(candidates, "event_type");

  const sourceAudit = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    date_window: DATE_WINDOW,
    dedupe_boundary: `Round${DEDUPE_BOUNDARY_ROUND}`,
    sources_checked: [
      {
        ...SOURCES.dfiPlanningStats,
        local_file: PLANNING_CSV_PATH,
        local_file_sha256: sha256(readTextIfExists(PLANNING_CSV_PATH)),
        accepted_records: candidates.length,
        accepted_app_ids: candidates.map((candidate) => candidate.source_fields.ID),
        accepted_related_app_ids: candidates.flatMap(
          (candidate) => candidate.source_fields.related_app_ids || []
        ),
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
        source_id: "dfi-planning-statistics-2025-26-quarterly-reviewed-round560",
        source_name: "Northern Ireland planning statistics 2025/26 provisional quarterly publications",
        publisher: "Department for Infrastructure, Northern Ireland",
        source_url: DFI_2025_26_Q3_URL,
        source_type: "official provisional quarterly planning-statistics publication",
        license:
          "Open Government Licence v3.0 where applicable to Department for Infrastructure public-sector information; verify release-specific terms before redistribution.",
        license_url: OGL_URL,
        attribution:
          "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0 where applicable.",
        accepted_records: 0,
        disposition:
          "reviewed for current coverage; not promoted because the available 2025/26 quarterly releases are not the final annual application-level CSV with Easting/Northing"
      },
      {
        source_id: "hed-historic-buildings-and-harni-reviewed-round560",
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
          "reviewed; Historic Buildings layer lacks a usable event date for new dated listing/designation changes, while Heritage at Risk Date_Added rows are retained as status/admin leads outside this DfI residual next31 pack"
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
        `Duplicate scan is conservative and text-based over the manual architecture corpus and official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND}; generated web/data atlas outputs are not treated as source-of-truth blockers.`
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
          "strong for heritage status/location; usable for dated Heritage at Risk Date_Added administrative records with caveats, but not for physical-change dating",
        required_caveat:
          "Status/listing/register dates are not construction, repair, completion or condition-improvement dates.",
        ingestion_recommendation:
          "Use Historic Buildings records only when a dated designation field exists; use HARNI Date_Added rows only as heritage register/status events and preserve status limitations."
      },
      {
        source_name: "Belfast City Council project/news pages",
        publisher: "Belfast City Council",
        reliability: "usable with caveats",
        required_caveat:
          "Council pages can document official announcements or project updates, but page-only leads must not be promoted without source-backed point geometry and compatible reuse terms.",
        ingestion_recommendation:
          "Use as citation-only context or reject unless a source-backed point/boundary and compatible reuse terms are present."
      }
    ],
    caveats: [
      "All accepted candidates are administrative planning/statutory-consent records, not physical start, completion, opening or occupation evidence.",
      "All accepted candidates are point-backed by official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84 using explicit CRS parameters.",
      "No accepted candidate uses invented coordinates or generic geocoding.",
      "Rejected official pages and rows include duplicate-project consents, 2025/26 quarterly aggregate-only releases, lower-priority fixture/equipment-only changes, lower-signal HMO/short-let-only rows, telecom/transport/street-furniture rows, minor domestic rows, sign/advertisement/display rows, page-only leads and status-only heritage sources.",
      "No prediction, simulation, causality, service-performance, capacity, health, education, environmental, economic or heritage-condition outcome claim is made."
    ]
  };

  const validationReport = {
    generated_at: GENERATED_AT,
    round_id: ROUND_ID,
    ok: validation.errors.length === 0,
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
    `- Rejected/retained leads: ${rejected.length}`,
    `- Point-backed candidates: ${pointBackedCount}`,
    `- Geometry-ref-only accepted candidates: ${geometryRefOnlyCount}`,
    `- Date range: ${dateRange.start} to ${dateRange.end}`,
    `- Dedupe boundary: Round${DEDUPE_BOUNDARY_ROUND}`,
    "",
    "## Accepted Source Mix",
    "",
    `- Department for Infrastructure planning statistics 2024/25: ${candidates.length} selected Belfast planning, demolition-consent or statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or official Belfast architecture sweep candidate packs through Round${DEDUPE_BOUNDARY_ROUND}.`,
    "- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.",
    "- Categories include residential fabric alteration, residential development, and small commercial change-of-use records.",
    "",
    "## Rejected/Retained Separately",
    "",
    "- DfI 2025/26 provisional quarterly planning-statistics publications were checked as the current DfI planning-statistics coverage available by 2026-05-20, but they were not promoted because this pack requires application-level rows with Easting/Northing.",
    "- DfC/HED layers were checked: Historic Buildings is point-backed but lacks a usable event date for a new designation/listing event in this pack; HARNI Date_Added rows are status/register records and retained outside this DfI residual pack.",
    "- Belfast City Council project/news pages remain citation-only/page-only or license-limited leads unless a source-backed point/boundary and compatible reuse terms are available.",
    "- Minor private domestic rows, short-let/HMO-only rows without substantial fabric or public/commercial signal, signage/display-only rows, equipment-only rows, bus/telecom/street-furniture rows and duplicate same-project rows were retained in rejected.json.",
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

