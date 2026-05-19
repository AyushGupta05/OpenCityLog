const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT_DIR, "data", "raw", "planning_statistics");
const OUT_DIR = path.join(ROOT_DIR, "tmp", "subagents", "round131_belfast_planning_statistics");
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
const DATE_START = "2008-01-01";
const DATE_END = "2026-05-19";
const MIN_SCORE = 120;
const MAX_CANDIDATES = 700;

const BELFAST_ENVELOPE = {
  minLongitude: -6.12,
  maxLongitude: -5.74,
  minLatitude: 54.45,
  maxLatitude: 54.75
};

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
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "planning_record";
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
    if (!month) return "";
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  return "";
}

function normaliseEastingNorthing(value) {
  const cleaned = cleanText(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);
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

function keywordCount(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function extractScale(text) {
  const units = [];
  const unitRegex = /\b(\d{1,4})\s*(?:no\.?|number|x)?\s*(?:apartments|dwellings|units|houses|flats|bedrooms|student|hotel rooms)\b/g;
  let match = unitRegex.exec(text);
  while (match) {
    units.push(Number(match[1]));
    match = unitRegex.exec(text);
  }

  const storeys = [];
  const storeyRegex = /\b(\d{1,2})\s*(?:-|\s)?storey\b/g;
  match = storeyRegex.exec(text);
  while (match) {
    storeys.push(Number(match[1]));
    match = storeyRegex.exec(text);
  }

  return {
    maxUnits: units.length ? Math.max(...units.filter(Number.isFinite)) : 0,
    maxStoreys: storeys.length ? Math.max(...storeys.filter(Number.isFinite)) : 0
  };
}

function scoreRecord(record) {
  const proposal = cleanText(record.proposal);
  const category = cleanText(record.statsCategory);
  const classification = cleanText(record.classification);
  const appType = cleanText(record.appType);
  const text = `${proposal} ${category} ${appType}`.toLowerCase();
  let score = 0;
  const reasons = [];

  if (classification === "Major") {
    score += 80;
    reasons.push("major classification");
  } else if (classification === "Local") {
    score += 8;
  }

  const categoryScores = {
    "Mixed Use": 40,
    Commercial: 35,
    Civic: 35,
    Industrial: 32,
    Residential: 20,
    "Change of Use": 18,
    Other: 0
  };
  if (categoryScores[category]) {
    score += categoryScores[category];
    reasons.push(`${category.toLowerCase()} category`);
  }

  if (appType === "Full") {
    score += 16;
  } else if (appType === "Outline") {
    score += 14;
    reasons.push("outline application");
  } else if (appType === "Reserved Matters") {
    score += 12;
    reasons.push("reserved matters");
  } else if (/listed/i.test(appType)) {
    score += 18;
    reasons.push("listed building consent");
  } else if (/consent to display/i.test(appType)) {
    score -= 65;
    reasons.push("advertising consent downweighted");
  } else if (/other consents/i.test(appType)) {
    score -= 20;
  }

  const scoringGroups = [
    {
      regex: /\b(demolition|demolish|redevelopment|construction|construct|erection|erect|new building|new build|extension|alterations|conversion|refurbishment|renovation|restoration|reconfiguration|replacement|recladding)\b/g,
      points: 18,
      reason: "physical building works wording"
    },
    {
      regex: /\b(apartment|apartments|student accommodation|hotel|office|retail|restaurant|bar|cafe|leisure|community|school|college|university|hospital|health|care home|nursery|warehouse|industrial|social housing|affordable housing|dwellings|housing units|flats)\b/g,
      points: 20,
      reason: "built-use wording"
    },
    {
      regex: /\b(public realm|transport hub|station|museum|library|community centre|sports|stadium|bridge)\b/g,
      points: 28,
      reason: "civic/public building wording"
    },
    {
      regex: /\b(listed building|conservation|facade|fa\u00e7ade|shopfront)\b/g,
      points: 14,
      reason: "heritage or facade wording"
    }
  ];

  for (const group of scoringGroups) {
    const count = keywordCount(text, group.regex);
    if (count > 0) {
      score += Math.min(group.points * count, group.points * 3);
      reasons.push(group.reason);
    }
  }

  const scale = extractScale(text);
  if (scale.maxUnits > 0) {
    if (scale.maxUnits >= 50) score += 45;
    else if (scale.maxUnits >= 20) score += 35;
    else if (scale.maxUnits >= 5) score += 24;
    else score += 8;
    reasons.push(`${scale.maxUnits} unit reference`);
  }

  if (scale.maxStoreys > 0) {
    if (scale.maxStoreys >= 8) score += 30;
    else if (scale.maxStoreys >= 5) score += 22;
    else score += 10;
    reasons.push(`${scale.maxStoreys} storey reference`);
  }

  const downweights = [
    {
      regex: /\b(advertisement|advertisements|signage|signs?|fascia|hoarding|billboard)\b/g,
      points: 40,
      reason: "advertising/signage row"
    },
    {
      regex: /\b(discharge of condition|variation of condition|non[- ]material|reserved matters|renewal of permission|retention of|temporary|certificate of lawful|telecommunications|antenna|mast|air quality monitoring station)\b/g,
      points: 28,
      reason: "minor or secondary administrative row"
    },
    {
      regex: /\b(single storey|garage|porch|conservatory|shed|fence|decking|dormer|rooflight|domestic|driveway|garden room|rear extension|side extension)\b/g,
      points: 18,
      reason: "minor/domestic works wording"
    }
  ];

  for (const group of downweights) {
    const count = keywordCount(text, group.regex);
    if (count > 0) {
      score -= Math.min(group.points * count, group.points * 3);
      reasons.push(group.reason);
    }
  }

  const hasPhysicalBuiltWork = /\b(demolition|demolish|redevelopment|construction|construct|erection|erect|new building|new build|extension|alterations|conversion|refurbishment|renovation|restoration|reconfiguration|replacement|recladding|facade|fa\u00e7ade|shopfront|external alterations)\b/.test(text);
  const hasLargeBuiltUse = /\b(apartment|apartments|student accommodation|hotel|office|retail|leisure|community|school|college|university|hospital|health|care home|warehouse|industrial|dwellings|housing units|flats|mixed use)\b/.test(text);
  const highSignalGate = classification === "Major" ||
    /listed/i.test(appType) ||
    hasPhysicalBuiltWork ||
    scale.maxUnits >= 5 ||
    scale.maxStoreys >= 3 ||
    (hasLargeBuiltUse && category !== "Change of Use");

  return {
    score,
    reasons: [...new Set(reasons)],
    scale,
    hasPhysicalBuiltWork,
    hasLargeBuiltUse,
    highSignalGate
  };
}

function bucketFor(record, score) {
  const proposal = cleanText(record.proposal).toLowerCase();
  const category = cleanText(record.statsCategory);
  const appType = cleanText(record.appType);

  if (/listed/i.test(appType) || /\b(listed building|conservation|facade|fa\u00e7ade)\b/.test(proposal)) {
    return "planning/approved/architecture/heritage_or_listed_building";
  }
  if (/\b(demolition|demolish|redevelopment)\b/.test(proposal)) {
    return "planning/approved/architecture/demolition_redevelopment";
  }
  if (category === "Mixed Use" || /\bmixed use\b/.test(proposal)) {
    return "planning/approved/architecture/mixed_use";
  }
  if (category === "Civic" || /\b(public realm|community|school|college|university|hospital|health|library|museum|leisure|sports|stadium)\b/.test(proposal)) {
    return "planning/approved/architecture/civic_community";
  }
  if (category === "Commercial" || /\b(hotel|office|retail|restaurant|bar|cafe|shop)\b/.test(proposal)) {
    return "planning/approved/architecture/commercial";
  }
  if (category === "Industrial" || /\b(warehouse|industrial)\b/.test(proposal)) {
    return "planning/approved/architecture/industrial";
  }
  if (category === "Residential" || /\b(apartment|apartments|dwellings|housing|flats|student accommodation)\b/.test(proposal)) {
    return "planning/approved/architecture/residential";
  }
  if (category === "Change of Use" || /\b(change of use|conversion)\b/.test(proposal)) {
    return "planning/approved/architecture/adaptive_reuse";
  }
  return score >= 160
    ? "planning/approved/architecture/high_signal_other"
    : "planning/approved/architecture/other_built_environment";
}

function titleFor(record) {
  const appId = cleanText(record.appId);
  const category = cleanText(record.statsCategory) || "Planning";
  const proposal = cleanText(record.proposal);
  const clipped = proposal.length > 112 ? `${proposal.slice(0, 109).trim()}...` : proposal;
  return `${category} planning approval ${appId}: ${clipped || "Belfast architecture-related proposal"}`;
}

function summaryFor(record) {
  const appId = cleanText(record.appId);
  const category = cleanText(record.statsCategory) || "not supplied";
  const classification = cleanText(record.classification) || "not supplied";
  const appType = cleanText(record.appType) || "not supplied";
  const address = cleanText(record.address) || "Belfast";
  return `DfI Northern Ireland planning statistics record ${appId} lists an approved Belfast ${appType} application (${classification}, ${category}) at ${address}, with decision date ${record.date}.`;
}

function observedChangeFor(record) {
  const appId = cleanText(record.appId);
  const proposal = cleanText(record.proposal) || "architecture-related proposal";
  return `Administrative planning approval recorded for application ${appId}: ${proposal}. This records the planning decision only; it is not evidence that the proposal was constructed, opened, occupied, completed, or linked to any outcome.`;
}

function limitationsFor(record) {
  return [
    "Planning statistics rows are administrative planning records, not direct observations of construction, opening, occupation, completion, demolition completion, or project delivery.",
    "The selected date is DecisionIssuedDate from the CSV; DateReceived and DateValid are retained as source fields but are not treated as the effective date of a physical urban change.",
    "Coordinates are approximate WGS84 points converted from source Easting/Northing values using the lightweight helper already used by scripts/build_infrastructure_events.js; they are for atlas navigation, not legal boundaries or building footprints.",
    "Candidate scoring favours major, mixed-use, civic, commercial, residential, listed-building, demolition/redevelopment, multi-unit, and visible building-work language; false positives and duplicates should be reviewed before any corpus append.",
    `Source release coverage is limited to local CSV files available in ${path.relative(ROOT_DIR, RAW_DIR).replace(/\\/g, "/")}; absence of older annual files does not mean absence of Belfast planning activity.`
  ].join(" ");
}

function candidateFor(record) {
  const point = niGridToApproxPoint(record.easting, record.northing);
  const sourceRecordId = `APP_ID:${cleanText(record.appId) || "not supplied"}; FILE:${record.file}; ROW:${record.rowNumber}`;
  const score = record.score;
  const bucket = bucketFor(record, score);
  const candidateId = `round131_belfast_planning_statistics_${slugify(record.appId)}_${record.date}`;

  return {
    city_id: "belfast",
    candidate_id: candidateId,
    event_id: candidateId,
    title: titleFor(record),
    summary: summaryFor(record),
    observed_change: observedChangeFor(record),
    date: record.date,
    effective_date: record.date,
    effective_date_range: null,
    date_precision: "day",
    bucket,
    category: cleanText(record.statsCategory) || "Planning",
    planning_status: "Approved",
    planning_application_id: cleanText(record.appId),
    planning_classification: cleanText(record.classification),
    planning_application_type: cleanText(record.appType),
    planning_score: score,
    planning_score_reasons: record.scoreReasons,
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
    source_record_id: sourceRecordId,
    source_type: "official annual planning-statistics CSV row",
    source_date_field: "DecisionIssuedDate",
    source_retrieved_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: `${cleanText(record.statsCategory) || "Planning"} planning approval candidate`,
    geometry_source: "Approximate WGS84 point converted from official CSV Easting and Northing fields.",
    geometry_precision: "approximate source point for atlas navigation; not a surveyed project footprint, parcel boundary, legal boundary, or evidence of built works",
    license: LICENSE,
    license_url: LICENSE_URL,
    license_or_terms_note: `${LICENSE} ${LICENSE_URL}`,
    attribution: ATTRIBUTION,
    limitations: limitationsFor(record),
    transformation_method: "scripts/fetch_round131_belfast_planning_statistics_candidates.js parsed local DfI planning-statistics CSVs, filtered Belfast approved rows with DecisionIssuedDate from 2008-01-01 through 2026-05-19, converted Easting/Northing to approximate WGS84, scored high-signal architecture-related wording, capped deterministic ranked candidates, and preserved file/row provenance.",
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
      source_file: record.file,
      source_row_number: record.rowNumber
    }
  };
}

function incrementCount(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function reject(rejections, rejectionCounts, record, reason, extra = {}, options = {}) {
  incrementCount(rejectionCounts, reason);
  if (options.includeDetail === false) return;

  rejections.push({
    reason,
    file: record.file,
    row_number: record.rowNumber,
    app_id: cleanText(record.appId),
    decision_date: record.date || cleanText(record.decisionIssuedDate),
    status: cleanText(record.decisionWithdrawal || record.statusAt31Mar),
    category: cleanText(record.statsCategory),
    classification: cleanText(record.classification),
    app_type: cleanText(record.appType),
    proposal: cleanText(record.proposal).slice(0, 220),
    ...extra
  });
}

function recordFromRow(file, row, index, rowNumber) {
  const get = (key) => row[index[key]];
  const appId = get("ID") || get("Id") || "";
  const classification = get("Classification") || get("AppCategory") || "";
  const address = get("SiteAddress") || get("Location") || "";
  const eastingRaw = get("Easting");
  const northingRaw = get("Northing");

  return {
    file,
    rowNumber,
    appId,
    dateReceived: get("DateReceived"),
    dateValid: get("DateValid"),
    authority: get("Authority"),
    lpaName: get("LPA19NM"),
    constituency: get("Constituency"),
    appType: get("AppType"),
    classification,
    statsCategory: get("StatsCategory"),
    urbanRural: get("Urban_Rural"),
    housingType: get("HousingType"),
    renewableType: get("RenewableType"),
    proposal: get("Proposal"),
    address,
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

function readSourceRows() {
  if (!fs.existsSync(RAW_DIR)) {
    throw new Error(`Missing planning statistics directory: ${RAW_DIR}`);
  }

  const files = fs.readdirSync(RAW_DIR)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .sort();

  const rows = [];
  const fileAudits = [];

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const parsed = parseCsv(fs.readFileSync(filePath, "latin1"));
    const header = (parsed.shift() || []).map(cleanText);
    const index = Object.fromEntries(header.map((name, position) => [name, position]));
    let rowCount = 0;

    for (const row of parsed) {
      rowCount += 1;
      rows.push(recordFromRow(file, row, index, rowCount + 1));
    }

    fileAudits.push({
      file,
      local_path: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
      row_count: rowCount,
      headers: header
    });
  }

  return { rows, fileAudits };
}

function sourceAudit(fileAudits, summary) {
  return {
    schema_version: "round131.belfast_planning_statistics.source_audit.v1",
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
    coverage_checked: `Local planning statistics CSV rows filtered for Belfast approvals with DecisionIssuedDate from ${DATE_START} through ${DATE_END}.`,
    date_fields_observed: "DecisionIssuedDate is used as the candidate date; DateReceived and DateValid are retained in raw_row for context.",
    geometry_fields_observed: "Easting and Northing from source CSV rows converted to approximate WGS84 points.",
    required_caveats: "Planning approval is an administrative decision record. It is not evidence of construction start, construction completion, opening, occupation, demolition completion, delivery, public use, or causal impact.",
    transformation_method: "Local CSV parse, authority/LPA Belfast filter, approved status filter, date-window filter, Belfast coordinate-envelope check after NI-grid approximation, high-signal architecture scoring, deterministic ranking and cap.",
    scoring_summary: {
      min_score: MIN_SCORE,
      max_candidates: MAX_CANDIDATES,
      accepted_candidates: summary.accepted_candidates,
      high_signal_rule: "Rows must meet the numeric score threshold and pass a high-signal gate: major classification, listed-building consent, physical building-work wording, multi-unit/storey scale, or large built-use wording outside bare change-of-use rows."
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
        coverage_years_checked: `${DATE_START} through ${DATE_END}; local files cover releases present in ${path.relative(ROOT_DIR, RAW_DIR).replace(/\\/g, "/")}.`,
        geographic_scope: "Belfast planning authority / Belfast LPA rows in Northern Ireland planning statistics CSVs.",
        key_fields_used: "ID/Id, DecisionIssuedDate, Authority, LPA19NM, AppType, Classification/AppCategory, StatsCategory, Proposal, SiteAddress/Location, Easting, Northing, Decision_Withdrawal, Status@31Mar, source file and source row number.",
        reliability: "strong for official administrative planning-decision records; usable with caveats for architecture-change candidate discovery",
        required_caveats: "Do not treat approval as proof that development was built, opened, occupied, completed, demolished, delivered, or causally linked to any outcome.",
        ingestion_recommendation: "Use as candidate evidence for administrative approval milestones only; require duplicate screening and, where physical delivery matters, separate construction/opening/completion evidence before stronger claims."
      }
    ]
  };
}

function validateCandidates(candidates) {
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
    "transformation_method"
  ];
  const ids = new Set();
  const sourceRows = new Set();
  const banned = /\b(proves?|proof|predicts?|forecasts?|simulates?|caused|will increase|will decrease|impact score)\b/i;

  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${candidate.candidate_id || candidate.title}`);
      }
    }
    if (ids.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id: ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    if (sourceRows.has(candidate.source_record_id)) throw new Error(`Duplicate source_record_id: ${candidate.source_record_id}`);
    sourceRows.add(candidate.source_record_id);
    if (candidate.confidence !== "documented") throw new Error(`Unexpected confidence for ${candidate.candidate_id}`);
    if (candidate.source_ids[0] !== SOURCE_ID) throw new Error(`Unexpected source_id for ${candidate.candidate_id}`);
    if (!inBelfastEnvelope({ longitude: Number(candidate.longitude), latitude: Number(candidate.latitude) })) {
      throw new Error(`Candidate outside Belfast envelope: ${candidate.candidate_id}`);
    }
    if (candidate.date < DATE_START || candidate.date > DATE_END) {
      throw new Error(`Candidate outside date window: ${candidate.candidate_id}`);
    }
    const checked = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      candidate.limitations,
      candidate.transformation_method,
      candidate.geometry_precision
    ].join(" ");
    if (banned.test(checked)) {
      throw new Error(`Overclaim wording found for ${candidate.candidate_id}`);
    }
  }
}

function buildPack() {
  const { rows, fileAudits } = readSourceRows();
  const rejections = [];
  const rejectionCounts = {};
  const eligible = [];

  for (const record of rows) {
    const authority = cleanText(record.authority);
    const lpaName = cleanText(record.lpaName);
    if (authority !== "Belfast" && lpaName !== "Belfast LPA") {
      reject(rejections, rejectionCounts, record, "not_belfast", {}, { includeDetail: false });
      continue;
    }

    const status = cleanText(record.decisionWithdrawal) || cleanText(record.statusAt31Mar);
    if (!/approved/i.test(status)) {
      reject(rejections, rejectionCounts, record, "not_approved");
      continue;
    }

    if (!record.date) {
      reject(rejections, rejectionCounts, record, "missing_or_unparsed_decision_date");
      continue;
    }
    if (record.date < DATE_START || record.date > DATE_END) {
      reject(rejections, rejectionCounts, record, "outside_date_window");
      continue;
    }

    const point = niGridToApproxPoint(record.easting, record.northing);
    if (!point) {
      reject(rejections, rejectionCounts, record, "missing_or_invalid_easting_northing");
      continue;
    }
    if (!inBelfastEnvelope(point)) {
      reject(rejections, rejectionCounts, record, "outside_belfast_coordinate_envelope", { longitude: point.longitude, latitude: point.latitude });
      continue;
    }

    const assessment = scoreRecord(record);
    if (assessment.score < MIN_SCORE || !assessment.highSignalGate) {
      reject(rejections, rejectionCounts, record, "below_high_signal_architecture_threshold", {
        score: assessment.score,
        high_signal_gate: assessment.highSignalGate,
        reasons: assessment.reasons
      });
      continue;
    }

    eligible.push({
      ...record,
      score: assessment.score,
      scoreReasons: assessment.reasons,
      maxUnits: assessment.scale.maxUnits,
      maxStoreys: assessment.scale.maxStoreys
    });
  }

  eligible.sort((left, right) =>
    right.score - left.score ||
    right.date.localeCompare(left.date) ||
    cleanText(left.appId).localeCompare(cleanText(right.appId)) ||
    left.file.localeCompare(right.file) ||
    left.rowNumber - right.rowNumber
  );

  const selectedRecords = eligible.slice(0, MAX_CANDIDATES);
  for (const record of eligible.slice(MAX_CANDIDATES)) {
    reject(rejections, rejectionCounts, record, "ranked_below_candidate_cap", {
      score: record.score,
      reasons: record.scoreReasons
    });
  }

  const candidates = selectedRecords
    .map(candidateFor)
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.source_record_id.localeCompare(right.source_record_id)
    );

  validateCandidates(candidates);

  const summary = {
    schema_version: "round131.belfast_planning_statistics.summary.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    input_rows: rows.length,
    accepted_candidates: candidates.length,
    rejected_rows: Object.values(rejectionCounts).reduce((total, count) => total + count, 0),
    detailed_rejection_rows: rejections.length,
    eligible_before_cap: eligible.length,
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
    counts_by_status: countBy(candidates, (candidate) => candidate.planning_status),
    counts_by_classification: countBy(candidates, (candidate) => candidate.planning_classification),
    counts_by_app_type: countBy(candidates, (candidate) => candidate.planning_application_type),
    rejection_counts: Object.fromEntries(Object.entries(rejectionCounts).sort(([left], [right]) => left.localeCompare(right))),
    caveat: "Planning approvals are administrative records and are not proof of construction, opening, completion, demolition completion, occupation, delivery, or causal outcomes."
  };

  return { candidates, rejections, summary, audit: sourceAudit(fileAudits, summary) };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { candidates, rejections, summary, audit } = buildPack();
  const output = {
    schema_version: "round131.belfast_planning_statistics.candidates.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    source_id: SOURCE_ID,
    candidate_count: candidates.length,
    scope_note: "Belfast approved planning-statistics rows ranked as high-signal architecture-related administrative approval candidates. Approval is not evidence of construction, opening, occupation, completion, demolition completion, delivery, or causal effects.",
    candidates
  };

  fs.writeFileSync(CANDIDATES_PATH, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(SOURCE_AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(REJECTIONS_PATH, `${JSON.stringify({
    schema_version: "round131.belfast_planning_statistics.rejections.v1",
    created_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    rejected_count: summary.rejected_rows,
    detailed_rejected_count: rejections.length,
    detail_scope: "Detailed rows exclude not_belfast records to keep the artifact reviewable; rejection_counts retains the full NI-wide exclusion count.",
    rejection_counts: summary.rejection_counts,
    rejected: rejections
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    candidates: candidates.length,
    rejected: summary.rejected_rows,
    detailed_rejections: rejections.length,
    eligible_before_cap: summary.eligible_before_cap,
    candidates_path: path.relative(ROOT_DIR, CANDIDATES_PATH).replace(/\\/g, "/"),
    source_audit_path: path.relative(ROOT_DIR, SOURCE_AUDIT_PATH).replace(/\\/g, "/"),
    summary_path: path.relative(ROOT_DIR, SUMMARY_PATH).replace(/\\/g, "/"),
    rejections_path: path.relative(ROOT_DIR, REJECTIONS_PATH).replace(/\\/g, "/")
  }, null, 2));
}

main();
