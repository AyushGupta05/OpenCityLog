const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RAW_DIR_PRIMARY = path.join(ROOT_DIR, "data", "raw", "planning_statistics");
const RAW_DIR_FALLBACK = path.join(ROOT_DIR, "planning_statistics");
const CORPUS_PATH = path.join(
  ROOT_DIR,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const OUT_DIR = path.join(
  ROOT_DIR,
  "tmp",
  "subagents",
  "round137_belfast_planning_statistics_more"
);
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const REJECTIONS_PATH = path.join(OUT_DIR, "rejections.json");

const SOURCE_ID = "ni-planning-statistics";
const SOURCE_NAME = "Northern Ireland planning activity statistics";
const PUBLISHER = "Department for Infrastructure, Northern Ireland";
const SOURCE_URL = "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const LICENSE = "Open Government Licence v3.0, where the statistical release is published as public-sector information; verify per release.";
const LICENSE_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";
const ATTRIBUTION = "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0, where applicable.";
const ACCESSED_AT = "2026-05-19";

const DATE_START = "2024-01-01";
const DATE_END = "2025-12-31";
const MIN_SCORE = 66;
const MAX_CANDIDATES = 60;

const BELFAST_ENVELOPE = {
  minLongitude: -6.12,
  maxLongitude: -5.74,
  minLatitude: 54.45,
  maxLatitude: 54.75
};

const EXCLUDED_ADMIN_RE = /\b(consent to display|advertisements?|signage|signs?|fascia|hoarding|billboard|discharge of condition|approval of details|non[- ]material|temporary|certificate of lawful|telecommunications|antenna|mast|monopole|air quality monitoring|section 54|section 76|variation of condition|vary condition|renewal of permission|permission in principle|storage\/use of gas oil|solar panels?|rooflights?|replacement windows?)\b/i;
const EXCLUDED_SMALL_DOMESTIC_RE = /\b(single[- ]storey|two[- ]storey|rear|side|front)\s+extension\b|\b(loft conversion|porch|conservatory|garage conversion|domestic garage|garden room|sunroom|domestic purposes|detached dwelling|single dwelling|one dwelling|1 dwelling|dwelling on a farm|extension to dwelling|alterations to dwelling|boundary wall|decking|driveway)\b/i;
const EXCLUDED_LOW_SIGNAL_WORKS_RE = /\b(extractor flue|air conditioning|air-conditioning|rooftop plant|roof top plant|outdoor seating|prefabricated portacabin|replacement shopfront|shop front|retail frontage|shopfront installation|amalgamation of units|subdivision of existing retail unit|reconfiguration of existing shop front|window openings|rendering of existing brickwork|retention of|hmo)\b|fa(?:c|\u00e7)ade/i;
const PHYSICAL_WORKS_RE = /\b(demolition|redevelopment|new build|erection|construction|construct|extension|conversion|refurbishment|alterations|restoration|reconfiguration|replacement|change of use|partial demolition)\b/i;
const BUILT_USE_RE = /\b(apartments?|flats?|dwellings?|housing|student accommodation|hotel|office|retail|restaurant|bar|cafe|commercial|industrial|warehouse|factory|manufacturing|workshop|laboratory|school|college|university|campus|hospital|clinic|surgery|care home|nursing home|community|social club|library|museum|gallery|theatre|cinema|leisure|sports?|stadium|pavilion|support hub|cleanroom|mixed[- ]use)\b/i;
const CIVIC_FACILITY_RE = /\b(school|grammar school|gp surgery|surgery|hospital|community hub|community building|community centre|social club|support hub|leisure centre|stadium|pavilion|university|college|library|museum)\b/i;
const INDUSTRIAL_FACILITY_RE = /\b(warehouse|factory|manufacturing|industrial|workshop|cleanroom|storage and distribution|storage\/loading)\b/i;
const COMMERCIAL_FACILITY_RE = /\b(office building|offices?|hotel|restaurant|bar|cafe|retail|public house|photography studio)\b/i;
const LISTED_HIGH_SIGNAL_RE = /\b(listed building|listed pavilions?|residential home|bed spaces?|townhouses?)\b/i;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function cleanText(value) {
  return String(value || "")
    .replace(/^\u00ef\u00bb\u00bf/, "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00e2\u0080[\u0098\u0099]/g, "'")
    .replace(/\u00e2\u0080[\u009c\u009d]/g, "\"")
    .replace(/\u00e2\u0080[\u0093\u0094]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, limit = 96) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return (slug || "planning_record").slice(0, limit).replace(/_+$/g, "");
}

function truncate(value, limit) {
  const text = cleanText(value);
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

function extractPlanningApplicationId(value) {
  const match = String(value || "").match(/\b(?:LA04|[A-Z])\/\d{4}\/\d{4,5}\/[A-Z0-9]+(?:\/[A-Z0-9]+)?\b/i);
  return match ? match[0].toUpperCase() : "";
}

function parsePlanningDate(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (match) {
    const months = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12"
    };
    const [, day, monthName, yearRaw] = match;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    const month = months[monthName.toLowerCase().slice(0, 3)];
    return month ? `${year}-${month}-${day.padStart(2, "0")}` : "";
  }

  return "";
}

function normaliseEastingNorthing(value) {
  const number = Number(cleanText(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function niGridToApproxPoint(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  const longitude = -5.93 + (easting - 333000) / 65000;
  const latitude = 54.6 + (northing - 374000) / 111000;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return {
    longitude: Number(longitude.toFixed(6)),
    latitude: Number(latitude.toFixed(6))
  };
}

function inBelfastEnvelope(point) {
  if (!point) return false;
  return point.longitude >= BELFAST_ENVELOPE.minLongitude &&
    point.longitude <= BELFAST_ENVELOPE.maxLongitude &&
    point.latitude >= BELFAST_ENVELOPE.minLatitude &&
    point.latitude <= BELFAST_ENVELOPE.maxLatitude;
}

function maxMatchNumber(text, regex) {
  let max = 0;
  for (const match of text.matchAll(regex)) {
    const number = Number(match[1]);
    if (Number.isFinite(number) && number > max) max = number;
  }
  return max;
}

function extractScale(proposal) {
  const text = cleanText(proposal);
  return {
    units: maxMatchNumber(
      text,
      /\b(\d{1,4})\s*(?:no\.?\s*)?(?:apartments?|flats?|dwellings?|houses?|homes?|residential units?|student bedrooms?|bedspaces?|bed spaces?|hotel rooms?)\b/gi
    ),
    storeys: maxMatchNumber(text, /\b(\d{1,2})\s*(?:-|\s)?storey\b/gi)
  };
}

function targetBucket(record) {
  const category = cleanText(record.statsCategory);
  const proposal = cleanText(record.proposal);
  if (record.qualitySignals.includes("listed high-signal conversion")) {
    return "planning/approved/architecture/heritage_or_listed_building";
  }
  if (record.qualitySignals.includes("multi-unit residential")) {
    return "planning/approved/architecture/residential";
  }
  if (category === "Civic" || CIVIC_FACILITY_RE.test(proposal)) {
    return "planning/approved/architecture/civic_community";
  }
  if (category === "Industrial" || INDUSTRIAL_FACILITY_RE.test(proposal)) {
    return "planning/approved/architecture/industrial";
  }
  if (category === "Mixed Use" || /\bmixed[- ]use\b/i.test(proposal)) {
    return "planning/approved/architecture/mixed_use";
  }
  if (category === "Commercial" || COMMERCIAL_FACILITY_RE.test(proposal)) {
    return "planning/approved/architecture/commercial";
  }
  return "planning/approved/architecture/high_signal_other";
}

function projectTypeFor(record) {
  const proposal = cleanText(record.proposal);
  const category = cleanText(record.statsCategory);
  if (record.qualitySignals.includes("multi-unit residential")) return "multi-unit residential planning approval";
  if (record.qualitySignals.includes("listed high-signal conversion")) return "listed-building conversion planning approval";
  if (CIVIC_FACILITY_RE.test(proposal) || category === "Civic") return "civic or community-facility planning approval";
  if (INDUSTRIAL_FACILITY_RE.test(proposal) || category === "Industrial") return "industrial or production-space planning approval";
  if (COMMERCIAL_FACILITY_RE.test(proposal) || category === "Commercial") return "commercial planning approval";
  if (category === "Mixed Use") return "mixed-use planning approval";
  return "high-signal architecture-related planning approval";
}

function isBelfast(record) {
  return cleanText(record.authority) === "Belfast" ||
    cleanText(record.lpaName) === "Belfast LPA" ||
    /^LA04\//i.test(cleanText(record.appId));
}

function assessQuality(record) {
  const proposal = cleanText(record.proposal);
  const combined = `${proposal} ${cleanText(record.address)} ${cleanText(record.statsCategory)} ${cleanText(record.classification)} ${cleanText(record.appType)}`;
  const category = cleanText(record.statsCategory);
  const classification = cleanText(record.classification);
  const appType = cleanText(record.appType);
  const scale = extractScale(proposal);
  const hasPhysicalWorks = PHYSICAL_WORKS_RE.test(proposal);
  const hasBuiltUse = BUILT_USE_RE.test(proposal);
  const adminOrMinor = EXCLUDED_ADMIN_RE.test(combined) || /other consents/i.test(appType);
  const smallDomestic = EXCLUDED_SMALL_DOMESTIC_RE.test(combined);
  const lowSignalWorks = EXCLUDED_LOW_SIGNAL_WORKS_RE.test(combined);
  const qualitySignals = [];
  let score = 0;

  if (/major/i.test(classification) && !adminOrMinor) {
    score += 70;
    qualitySignals.push("major classification");
  }
  if (["Mixed Use", "Civic", "Commercial", "Industrial"].includes(category)) {
    score += 32;
    qualitySignals.push(`${category.toLowerCase()} category`);
  }
  if (scale.units >= 50) {
    score += 48;
    qualitySignals.push(`${scale.units} units or rooms`);
  } else if (scale.units >= 20) {
    score += 40;
    qualitySignals.push(`${scale.units} units or rooms`);
  } else if (scale.units >= 10) {
    score += 30;
    qualitySignals.push(`${scale.units} units or rooms`);
  }
  if (scale.storeys >= 8) {
    score += 28;
    qualitySignals.push(`${scale.storeys} storeys`);
  } else if (scale.storeys >= 5) {
    score += 22;
    qualitySignals.push(`${scale.storeys} storeys`);
  } else if (scale.storeys >= 3) {
    score += 12;
    qualitySignals.push(`${scale.storeys} storeys`);
  }
  if (hasPhysicalWorks) {
    score += 18;
    qualitySignals.push("physical works wording");
  }
  if (hasBuiltUse) {
    score += 18;
    qualitySignals.push("built-use wording");
  }
  if (CIVIC_FACILITY_RE.test(proposal)) {
    score += 10;
    qualitySignals.push("civic or public-facility wording");
  }

  const multiUnit = scale.units >= 10 && hasBuiltUse && !smallDomestic;
  const civicFacility = category === "Civic" && CIVIC_FACILITY_RE.test(proposal) && hasPhysicalWorks && !adminOrMinor && !lowSignalWorks;
  const industrialFacility = ["Industrial", "Commercial", "Mixed Use"].includes(category) &&
    INDUSTRIAL_FACILITY_RE.test(proposal) &&
    hasPhysicalWorks &&
    !adminOrMinor &&
    !lowSignalWorks;
  const commercialFacility = ["Commercial", "Mixed Use"].includes(category) &&
    COMMERCIAL_FACILITY_RE.test(proposal) &&
    hasPhysicalWorks &&
    !adminOrMinor &&
    !lowSignalWorks &&
    !/\b(frontage|shopfront|extractor flue|outdoor seating|portacabin)\b/i.test(proposal);
  const listedHighSignal = /listed/i.test(appType) &&
    LISTED_HIGH_SIGNAL_RE.test(proposal) &&
    (scale.units >= 10 || hasPhysicalWorks) &&
    !adminOrMinor &&
    !lowSignalWorks;

  if (multiUnit) qualitySignals.push("multi-unit residential");
  if (civicFacility) qualitySignals.push("civic facility works");
  if (industrialFacility) qualitySignals.push("industrial or production-space works");
  if (commercialFacility) qualitySignals.push("commercial facility works");
  if (listedHighSignal) qualitySignals.push("listed high-signal conversion");

  if (adminOrMinor) {
    score -= 90;
    qualitySignals.push("administrative or minor wording excluded");
  }
  if (smallDomestic && !multiUnit && !/major/i.test(classification)) {
    score -= 90;
    qualitySignals.push("small domestic wording excluded");
  }
  if (lowSignalWorks && !multiUnit && !listedHighSignal) {
    score -= 45;
    qualitySignals.push("low-signal works wording excluded");
  }

  const passesGate = (
    /major/i.test(classification) && !adminOrMinor && !lowSignalWorks
  ) || multiUnit || civicFacility || industrialFacility || commercialFacility || listedHighSignal;

  return {
    score,
    scale,
    qualitySignals: [...new Set(qualitySignals)],
    passesGate,
    adminOrMinor,
    smallDomestic,
    lowSignalWorks
  };
}

function recordFromRow(file, localPath, row, index, rowNumber) {
  const get = (...keys) => {
    for (const key of keys) {
      if (index[key] !== undefined && row[index[key]] !== undefined) return row[index[key]];
    }
    return "";
  };

  const eastingRaw = get("Easting");
  const northingRaw = get("Northing");
  const appId = cleanText(get("ID", "Id"));

  return {
    file,
    localPath,
    rowNumber,
    appId,
    appIdKey: extractPlanningApplicationId(appId) || appId.toUpperCase(),
    dateReceived: get("DateReceived"),
    dateValid: get("DateValid"),
    authority: get("Authority"),
    lpaName: get("LPA19NM"),
    constituency: get("Constituency"),
    appType: get("AppType"),
    classification: get("Classification", "AppCategory"),
    statsCategory: get("StatsCategory", "AppCategory"),
    urbanRural: get("Urban_Rural"),
    housingType: get("HousingType"),
    renewableType: get("RenewableType"),
    proposal: get("Proposal"),
    address: get("SiteAddress", "Location"),
    eastingRaw,
    northingRaw,
    easting: normaliseEastingNorthing(eastingRaw),
    northing: normaliseEastingNorthing(northingRaw),
    statusAt31Mar: get("Status@31Mar"),
    decisionWithdrawal: get("Decision_Withdrawal"),
    decisionIssuedDate: get("DecisionIssuedDate"),
    date: parsePlanningDate(get("DecisionIssuedDate"))
  };
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item) || "not supplied";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function addRejection(rejections, counts, record, reason, extra = {}) {
  counts[reason] = (counts[reason] || 0) + 1;
  if (!record || !record.appId || reason === "not_belfast") return;
  if (rejections.length >= 400) return;
  rejections.push({
    reason,
    app_id: cleanText(record.appId),
    source_file: record.localPath || record.file,
    source_row_number: record.rowNumber,
    decision_date: record.date || cleanText(record.decisionIssuedDate),
    category: cleanText(record.statsCategory),
    classification: cleanText(record.classification),
    app_type: cleanText(record.appType),
    proposal: truncate(record.proposal, 220),
    ...extra
  });
}

function existingPlanningKeys() {
  const existingApps = new Set();
  const existingSourceRecords = new Set();

  if (!fs.existsSync(CORPUS_PATH)) {
    throw new Error(`Missing manual corpus for dedupe: ${CORPUS_PATH}`);
  }

  const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8").replace(/^\uFEFF/, ""));
  for (const event of corpus.events || []) {
    const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
    const sourceText = [
      event.source_id,
      event.source_dataset_id,
      event.source_record_id,
      event.transformation_method
    ].join(" ");
    const isPlanningStatistics = sourceIds.includes(SOURCE_ID) ||
      event.source_dataset_id === SOURCE_ID ||
      /planning.statistics/i.test(sourceText);
    if (!isPlanningStatistics) continue;

    const appId = extractPlanningApplicationId([
      event.planning_application_id,
      event.source_record_id,
      event.event_id,
      event.title,
      event.summary,
      event.observed_change
    ].join(" "));
    if (appId) existingApps.add(appId);
    if (event.source_record_id) existingSourceRecords.add(cleanText(event.source_record_id).toUpperCase());
  }

  return { existingApps, existingSourceRecords, corpusEventCount: (corpus.events || []).length };
}

function planningFiles() {
  const dir = fs.existsSync(RAW_DIR_PRIMARY) ? RAW_DIR_PRIMARY : RAW_DIR_FALLBACK;
  if (!fs.existsSync(dir)) throw new Error(`Missing planning statistics directory: ${dir}`);
  return fs.readdirSync(dir)
    .filter((name) => /\.csv$/i.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

function readRows() {
  const rows = [];
  const fileAudits = [];

  for (const filePath of planningFiles()) {
    const parsed = parseCsv(fs.readFileSync(filePath, "latin1"));
    const header = (parsed.shift() || []).map(cleanText);
    const index = Object.fromEntries(header.map((name, position) => [name, position]));
    const file = path.basename(filePath);
    const localPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
    let rowCount = 0;

    for (const row of parsed) {
      rowCount += 1;
      rows.push(recordFromRow(file, localPath, row, index, rowCount + 1));
    }

    fileAudits.push({
      file,
      local_path: localPath,
      row_count: rowCount,
      headers: header
    });
  }

  return { rows, fileAudits };
}

function sourceRecordIdFor(record) {
  return `APP_ID:${cleanText(record.appId)}; FILE:${record.localPath}; ROW:${record.rowNumber}`;
}

function titleFor(record) {
  const category = cleanText(record.statsCategory) || "Planning";
  return `${category} planning approval ${cleanText(record.appId)}: ${truncate(record.proposal, 108)}`;
}

function summaryFor(record) {
  const appId = cleanText(record.appId);
  const category = cleanText(record.statsCategory) || "not supplied";
  const classification = cleanText(record.classification) || "not supplied";
  const appType = cleanText(record.appType) || "not supplied";
  const address = cleanText(record.address) || "Belfast";
  return `DfI Northern Ireland planning statistics record ${appId} lists an approved Belfast ${appType} application (${classification}, ${category}) at ${address}, with decision date ${record.date}.`;
}

function limitationsFor(record) {
  return [
    "Planning statistics rows are administrative planning records, not direct observations of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, or public use.",
    "The selected date is DecisionIssuedDate from the CSV; DateReceived and DateValid are retained as source fields but are not treated as physical-change dates.",
    "Coordinates are approximate WGS84 points converted from source Easting/Northing values for atlas navigation; they are not surveyed footprints, red-line boundaries, legal boundaries, or parcel geometry.",
    "Round137 deliberately keeps only post-dedupe 2024-2025 rows with strong multi-unit, civic, commercial, industrial, listed-conversion, or public-facility wording; omitted rows may still be legitimate planning decisions but were not considered high-signal enough for this pack.",
    "Approval is not evidence that the proposal was built, opened, occupied, completed, delivered, or linked to any outcome."
  ].join(" ");
}

function candidateFor(record) {
  const point = niGridToApproxPoint(record.easting, record.northing);
  const sourceRecordId = sourceRecordIdFor(record);
  const candidateId = `round137_belfast_planning_statistics_more_${slugify(record.appId, 48)}_${record.date}`;
  const bucket = targetBucket(record);

  return {
    city_id: "belfast",
    candidate_id: candidateId,
    event_id: candidateId,
    title: titleFor(record),
    summary: summaryFor(record),
    observed_change: `Administrative planning approval recorded for application ${cleanText(record.appId)}: ${cleanText(record.proposal)}. This records the planning decision only; it is not evidence that the proposal was constructed, opened, occupied, completed, delivered, or linked to any outcome.`,
    date: record.date,
    effective_date: record.date,
    effective_date_range: null,
    date_precision: "day",
    bucket,
    category: cleanText(record.statsCategory) || "Planning",
    planning_status: "Approved",
    planning_approval_caveat: "Planning approval is an administrative decision record, not evidence of construction start, completion, opening, occupation, final built form, or delivery.",
    planning_application_id: cleanText(record.appId),
    planning_classification: cleanText(record.classification),
    planning_application_type: cleanText(record.appType),
    planning_score: record.score,
    planning_score_reasons: record.qualitySignals,
    detected_scale: {
      units_or_rooms: record.scale.units || null,
      storeys: record.scale.storeys || null
    },
    area: cleanText(record.address) || "Belfast",
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: `Source CSV Easting/Northing in ${sourceRecordId}`,
    source_id: SOURCE_ID,
    source_ids: [SOURCE_ID],
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: SOURCE_URL,
    source_file: record.localPath,
    source_row_number: record.rowNumber,
    source_record_id: sourceRecordId,
    source_type: "official annual planning-statistics CSV row",
    source_date_field: "DecisionIssuedDate",
    source_retrieved_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectTypeFor(record),
    geometry_source: "Approximate WGS84 point converted from official CSV Easting and Northing fields.",
    geometry_precision: "approximate source point for atlas navigation; not a surveyed project footprint, parcel boundary, red-line boundary, legal boundary, or evidence of built works",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: `${LICENSE} ${LICENSE_URL}`,
    attribution: ATTRIBUTION,
    limitations: limitationsFor(record),
    transformation_method: "scripts/fetch_round137_belfast_planning_statistics_more_candidates.js parsed local DfI planning-statistics CSVs, deduped against accepted ni-planning-statistics app IDs in the manual architecture corpus, kept only approved 2024-2025 Belfast rows with approximate in-city coordinates and strong architecture/built-use signals, excluded domestic/minor/admin rows, and preserved file/row provenance.",
    raw_row: {
      ID: cleanText(record.appId),
      DateReceived: cleanText(record.dateReceived),
      DateValid: cleanText(record.dateValid),
      DecisionIssuedDate: cleanText(record.decisionIssuedDate),
      Authority: cleanText(record.authority),
      LPA19NM: cleanText(record.lpaName),
      Constituency: cleanText(record.constituency),
      AppType: cleanText(record.appType),
      Classification: cleanText(record.classification),
      StatsCategory: cleanText(record.statsCategory),
      Urban_Rural: cleanText(record.urbanRural),
      HousingType: cleanText(record.housingType),
      RenewableType: cleanText(record.renewableType),
      Proposal: cleanText(record.proposal),
      SiteAddress: cleanText(record.address),
      Easting: cleanText(record.eastingRaw),
      Northing: cleanText(record.northingRaw),
      Decision_Withdrawal: cleanText(record.decisionWithdrawal),
      "Status@31Mar": cleanText(record.statusAt31Mar),
      source_file: record.localPath,
      source_row_number: record.rowNumber
    }
  };
}

function sourceAudit(fileAudits, summary, decision) {
  return {
    schema_version: "round137.belfast_planning_statistics_more.source_audit.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    source_name: SOURCE_NAME,
    publisher: PUBLISHER,
    source_url: SOURCE_URL,
    source_type: "official annual planning-statistics CSV release",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: LICENSE,
    attribution: ATTRIBUTION,
    coverage_checked: `Local planning statistics CSV rows filtered for approved Belfast decisions from ${DATE_START} through ${DATE_END}, after dedupe against ${summary.existing_planning_statistics_records} existing ni-planning-statistics corpus records.`,
    date_fields_observed: "DecisionIssuedDate is used as the candidate date; DateReceived and DateValid are retained for context.",
    geometry_fields_observed: "Easting and Northing from source CSV rows converted to approximate WGS84 points.",
    reliability_assessment: "strong for official administrative planning-decision records; usable with explicit caveats for architecture-change candidate discovery",
    required_caveats: "Planning approval is an administrative decision record. It is not evidence of construction start, completion, opening, occupation, final built form, delivery, demolition completion, public use, or causal impact.",
    ingestion_recommendation: decision,
    transformation_method: "Manual corpus app-ID dedupe, Belfast authority/LPA and coordinate-envelope check, approved decision filter, 2024-2025 date window, high-signal built-use scoring, exclusion of minor domestic/admin/signage/telecom/frontage-only rows, deterministic sorting, and required-provenance validation.",
    scoring_summary: {
      min_score: MIN_SCORE,
      max_candidates: MAX_CANDIDATES,
      emitted_candidates: summary.accepted_candidates,
      quality_gate: "A row must pass at least one high-signal gate: non-admin major classification, multi-unit built-use scale, civic facility works, industrial/production-space works, commercial facility works, or listed high-signal conversion."
    },
    files: fileAudits,
    source_audits: [
      {
        source_id: SOURCE_ID,
        source_name: SOURCE_NAME,
        publisher: PUBLISHER,
        source_url: SOURCE_URL,
        source_type: "official annual planning-statistics CSV release",
        license: LICENSE,
        license_url: LICENSE_URL,
        license_or_terms_note: LICENSE,
        attribution: ATTRIBUTION,
        coverage_years_checked: `${DATE_START} through ${DATE_END}; local files cover releases present in ${path.relative(ROOT_DIR, fs.existsSync(RAW_DIR_PRIMARY) ? RAW_DIR_PRIMARY : RAW_DIR_FALLBACK).replace(/\\/g, "/")}.`,
        geographic_scope: "Belfast planning authority / Belfast LPA rows in Northern Ireland planning statistics CSVs.",
        key_fields_used: "ID/Id, DecisionIssuedDate, Authority, LPA19NM, AppType, Classification/AppCategory, StatsCategory, Proposal, SiteAddress/Location, Easting, Northing, Decision_Withdrawal, Status@31Mar, source file and source row number.",
        reliability: "strong for administrative planning-decision records; usable with caveats for architecture candidate discovery",
        required_caveats: "Do not treat approval as evidence that development was built, opened, occupied, completed, delivered, demolished, or causally linked to any outcome.",
        ingestion_recommendation: decision
      }
    ]
  };
}

function validateCandidates(candidates, existingApps) {
  const required = [
    "candidate_id",
    "city_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "date_precision",
    "bucket",
    "area",
    "latitude",
    "longitude",
    "source_ids",
    "source_url",
    "source_file",
    "source_row_number",
    "source_record_id",
    "source_date_field",
    "source_type",
    "source_name",
    "publisher",
    "license",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "planning_application_id",
    "planning_approval_caveat",
    "geometry_precision",
    "transformation_method"
  ];
  const candidateIds = new Set();
  const sourceRows = new Set();
  const appIds = new Set();
  const banned = /\b(proves?|proof|predicts?|forecasts?|simulates?|caused|will increase|will decrease|impact score)\b/i;

  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (candidateIds.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id: ${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    if (sourceRows.has(candidate.source_record_id)) throw new Error(`Duplicate source_record_id: ${candidate.source_record_id}`);
    sourceRows.add(candidate.source_record_id);
    const appId = extractPlanningApplicationId(candidate.planning_application_id);
    if (!appId) throw new Error(`Missing parseable app id for ${candidate.candidate_id}`);
    if (appIds.has(appId)) throw new Error(`Duplicate planning app id in pack: ${appId}`);
    appIds.add(appId);
    if (existingApps.has(appId)) throw new Error(`Candidate app already exists in corpus: ${appId}`);
    if (candidate.confidence !== "documented") throw new Error(`Unexpected confidence for ${candidate.candidate_id}`);
    if (candidate.source_ids[0] !== SOURCE_ID) throw new Error(`Unexpected source id for ${candidate.candidate_id}`);
    if (candidate.date < DATE_START || candidate.date > DATE_END) {
      throw new Error(`Candidate outside date window: ${candidate.candidate_id}`);
    }
    if (!inBelfastEnvelope({ longitude: Number(candidate.longitude), latitude: Number(candidate.latitude) })) {
      throw new Error(`Candidate outside Belfast envelope: ${candidate.candidate_id}`);
    }
    const checked = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.planning_approval_caveat,
      candidate.geometry_precision,
      candidate.transformation_method
    ].join(" ");
    if (banned.test(checked)) {
      throw new Error(`Overclaim wording found for ${candidate.candidate_id}`);
    }
  }
}

function buildPack() {
  const { existingApps, existingSourceRecords, corpusEventCount } = existingPlanningKeys();
  const { rows, fileAudits } = readRows();
  const rejections = [];
  const rejectionCounts = {};
  const selectedRecords = [];
  const selectedAppIds = new Set();

  for (const record of rows) {
    if (!isBelfast(record)) {
      addRejection(rejections, rejectionCounts, record, "not_belfast");
      continue;
    }

    const status = `${cleanText(record.decisionWithdrawal)} ${cleanText(record.statusAt31Mar)}`;
    if (!/approved/i.test(status)) {
      addRejection(rejections, rejectionCounts, record, "not_approved");
      continue;
    }

    if (!record.date || record.date < DATE_START || record.date > DATE_END) {
      addRejection(rejections, rejectionCounts, record, "outside_round137_recent_window");
      continue;
    }

    const point = niGridToApproxPoint(record.easting, record.northing);
    if (!inBelfastEnvelope(point)) {
      addRejection(rejections, rejectionCounts, record, "missing_or_outside_belfast_geometry");
      continue;
    }

    if (!record.appIdKey) {
      addRejection(rejections, rejectionCounts, record, "missing_application_id");
      continue;
    }
    if (existingApps.has(record.appIdKey)) {
      addRejection(rejections, rejectionCounts, record, "already_in_manual_corpus_app_id");
      continue;
    }
    if (existingSourceRecords.has(sourceRecordIdFor(record).toUpperCase())) {
      addRejection(rejections, rejectionCounts, record, "already_in_manual_corpus_source_row");
      continue;
    }
    if (selectedAppIds.has(record.appIdKey)) {
      addRejection(rejections, rejectionCounts, record, "duplicate_app_id_in_round137_selection");
      continue;
    }

    const assessment = assessQuality(record);
    if (!assessment.passesGate) {
      addRejection(rejections, rejectionCounts, record, "does_not_pass_high_signal_gate", {
        score: assessment.score,
        reasons: assessment.qualitySignals
      });
      continue;
    }
    if (assessment.score < MIN_SCORE) {
      addRejection(rejections, rejectionCounts, record, "below_round137_score_threshold", {
        score: assessment.score,
        reasons: assessment.qualitySignals
      });
      continue;
    }

    selectedAppIds.add(record.appIdKey);
    selectedRecords.push({
      ...record,
      score: assessment.score,
      scale: assessment.scale,
      qualitySignals: assessment.qualitySignals
    });
  }

  selectedRecords.sort((left, right) =>
    right.date.localeCompare(left.date) ||
    right.score - left.score ||
    cleanText(left.appId).localeCompare(cleanText(right.appId))
  );

  for (const record of selectedRecords.slice(MAX_CANDIDATES)) {
    addRejection(rejections, rejectionCounts, record, "ranked_below_candidate_cap", {
      score: record.score,
      reasons: record.qualitySignals
    });
  }

  const cappedRecords = selectedRecords.slice(0, MAX_CANDIDATES);
  const candidates = cappedRecords
    .map(candidateFor)
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.source_record_id.localeCompare(right.source_record_id)
    );

  validateCandidates(candidates, existingApps);

  const summary = {
    schema_version: "round137.belfast_planning_statistics_more.summary.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    input_rows: rows.length,
    corpus_events_seen: corpusEventCount,
    existing_planning_statistics_records: existingSourceRecords.size,
    existing_planning_statistics_app_ids: existingApps.size,
    accepted_candidates: candidates.length,
    eligible_before_cap: selectedRecords.length,
    candidate_cap: MAX_CANDIDATES,
    min_score: MIN_SCORE,
    date_window: {
      start: DATE_START,
      end: DATE_END,
      source_date_field: "DecisionIssuedDate"
    },
    counts_by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    counts_by_bucket: countBy(candidates, (candidate) => candidate.bucket),
    counts_by_category: countBy(candidates, (candidate) => candidate.category),
    counts_by_classification: countBy(candidates, (candidate) => candidate.planning_classification),
    counts_by_app_type: countBy(candidates, (candidate) => candidate.planning_application_type),
    rejection_counts: Object.fromEntries(Object.entries(rejectionCounts).sort(([left], [right]) => left.localeCompare(right))),
    audit_decision: candidates.length > 0
      ? "pack_generated_high_quality_recent_rows"
      : "no_pack_generated_after_quality_filter",
    caveat: "Planning approvals are administrative records and are not evidence of construction, opening, completion, occupation, delivery, final built form, or causal outcomes."
  };

  const decision = candidates.length > 0
    ? "Generate a small candidate pack only for the emitted high-signal recent rows; review before appending and keep the planning-approval caveat visible."
    : "Do not append another pack from this tranche; remaining post-dedupe rows did not clear the high-signal quality gate.";

  return {
    candidates,
    rejections,
    summary,
    audit: sourceAudit(fileAudits, summary, decision)
  };
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { candidates, rejections, summary, audit } = buildPack();
  const output = {
    schema_version: "round137.belfast_planning_statistics_more.candidates.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    candidate_count: candidates.length,
    audit_decision: summary.audit_decision,
    scope_note: "Small post-dedupe Belfast planning-statistics tranche limited to approved 2024-2025 rows with high-signal architecture/built-use evidence. Approval is not evidence of construction, opening, occupation, completion, delivery, or causal effects.",
    source_audits: audit.source_audits,
    candidates
  };

  writeJson(CANDIDATES_PATH, output);
  writeJson(SOURCE_AUDIT_PATH, audit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTIONS_PATH, {
    schema_version: "round137.belfast_planning_statistics_more.rejections.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    rejected_count: Object.values(summary.rejection_counts).reduce((total, count) => total + count, 0),
    detailed_rejected_count: rejections.length,
    detail_scope: "Detailed rows are capped for reviewability; rejection_counts retains full exclusion counts.",
    rejection_counts: summary.rejection_counts,
    rejected: rejections
  });

  console.log(JSON.stringify({
    candidates: candidates.length,
    audit_decision: summary.audit_decision,
    counts_by_year: summary.counts_by_year,
    counts_by_category: summary.counts_by_category,
    candidates_path: path.relative(ROOT_DIR, CANDIDATES_PATH).replace(/\\/g, "/"),
    source_audit_path: path.relative(ROOT_DIR, SOURCE_AUDIT_PATH).replace(/\\/g, "/"),
    summary_path: path.relative(ROOT_DIR, SUMMARY_PATH).replace(/\\/g, "/"),
    rejections_path: path.relative(ROOT_DIR, REJECTIONS_PATH).replace(/\\/g, "/")
  }, null, 2));
}

main();
