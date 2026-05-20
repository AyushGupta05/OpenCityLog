const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ROUND_ID = "round270_belfast_official_planning_tail";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", ROUND_ID);
const GENERATED_AT = "2026-05-20";
const ACCESSED_AT = "2026-05-20";
const DATE_MIN = "2008-01-01";
const DATE_MAX = "2026-05-20";
const TARGET_CANDIDATES = 100;
const REJECT_DETAIL_CAP = 1200;
const OGL_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/";

const RAW_PLANNING_DIR = path.join(ROOT, "data", "raw", "planning_statistics");
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
  rejected: path.join(OUT_DIR, "rejected.json")
};

const BELFAST_BOUNDS = {
  minLat: 54.45,
  maxLat: 54.75,
  minLon: -6.15,
  maxLon: -5.65
};

const SOURCES = {
  planningStats: {
    source_id: "ni-planning-statistics",
    source_name: "Northern Ireland planning activity statistics",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics",
    source_type: "official annual planning-statistics CSV release",
    license:
      "Open Government Licence v3.0, where the statistical release is published as public-sector information; verify per release.",
    license_url: OGL_URL,
    attribution:
      "Contains public sector information from the Department for Infrastructure licensed under the Open Government Licence v3.0, where applicable."
  },
  bccCurrentPlanning: {
    source_id: "bcc-current-planning-applications-round270",
    source_name: "Current planning applications",
    publisher: "Belfast City Council",
    source_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    source_type: "official council current planning application list",
    license:
      "UK Open Government Licence v3.0 where applicable to public-sector information; Belfast City Council website terms, images, maps, logos and embedded third-party material require source-level rights review before production import.",
    license_url: OGL_URL,
    attribution: "Contains public sector information from Belfast City Council."
  },
  hedListedBuildings: {
    source_id: "dfc-hed-historic-buildings-listed-buildings",
    source_name: "Historic Buildings Record / Listed Buildings Northern Ireland",
    publisher: "Department for Communities Historic Environment Division",
    source_url: "https://admin.opendatani.gov.uk/tl/dataset/listed-buildings-northern-ireland",
    api_endpoint:
      "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/1",
    source_type: "official DfC/HED ArcGIS listed-buildings layer",
    license:
      "UK Open Government Licence v3.0 where applicable to public-sector information; base maps, images, attachments and third-party material require separate rights review.",
    license_url: OGL_URL,
    attribution: "Department for Communities Historic Environment Division."
  }
};

const EXCLUDED_ADMIN_RE =
  /\b(consent to display|advertisements?|signage|signs?|fascia|hoarding|billboard|discharge of conditions?|approval of details|non[- ]material|temporary|certificate of lawful|telecommunications|antenna|mast|monopole|air quality monitoring|section 54|section 76|variation of conditions?|vary conditions?|renewal of permission|permission in principle|storage\/use of gas oil|retention of|retrospective|substitution|in substitution for|car parking reconfiguration|reconfiguration of car parking|change of house types?|alterations to house types?)\b/i;
const EXCLUDED_SMALL_DOMESTIC_RE =
  /\b(single[- ]storey|two[- ]storey|rear|side|front)\s+extension\b|\b(loft conversion|porch|conservatory|garage conversion|domestic garage|garden room|sunroom|domestic purposes|detached dwelling|single dwelling|one dwelling|1 dwelling|1\.5 storey dwelling|dwelling on a farm|extension to dwelling|alterations to dwelling|boundary wall|decking|driveway)\b/i;
const EXCLUDED_LOW_SIGNAL_WORKS_RE =
  /\b(extractor flue|extraction unit|odour extraction|air conditioning|air-conditioning|rooftop plant|roof top plant|outdoor seating|external seating|awning|marquee|smoking area|vehicular security barrier|security gate|prefabricated portacabin|replacement shopfront|shop front|retail frontage|shopfront installation|amalgamation of units|subdivision of existing retail unit|sub-division on retail|reconfiguration of existing shop front|window openings|windows?|doors?|roller shutters?|new entrance lobby|entrance lobby|infill existing pedestrian ramp|minor external alterations|fire enclosure|external fire staircase|boundary treatment|change to elevation|elevation changes?|elevational changes?|alterations to elevations?|fenestration|recladding|curtain walling|trolley park|condenser units?|hot food|take[- ]?away|sandwich bar|time lapse camera|camera|internal layout|secondary gauzing|redundant services|redecoration|repointing|repairs|hmo)\b|fa(?:c|\u00e7)ade/i;
const SUBSTANTIAL_PHYSICAL_WORKS_RE =
  /\b(demolition|redevelopment|new build|erection|construction|construct|extension|conversion|convert|refurbishment|refurbish|alterations|restoration|reconfiguration|replacement|change of use|partial demolition|fit[- ]?out|associated development)\b/i;
const BUILT_USE_RE =
  /\b(apartments?|flats?|dwellings?|housing|student accommodation|student rooms?|studio rooms?|townhouses?|hotel|office|retail|restaurant|bar|cafe|commercial|industrial|warehouse|factory|manufacturing|workshop|laboratory|school|college|university|campus|hospital|clinic|surgery|care home|nursing home|community|social club|library|museum|gallery|theatre|cinema|leisure|sports?|stadium|pavilion|support hub|cleanroom|mixed[- ]use)\b/i;
const CIVIC_FACILITY_RE =
  /\b(school|grammar school|gp surgery|surgery|hospital|community hub|community building|community centre|community hall|social club|support hub|leisure centre|stadium|pavilion|university|college|library|museum)\b/i;
const INDUSTRIAL_FACILITY_RE =
  /\b(warehouse|factory|manufacturing|industrial|workshop|cleanroom|production facility|storage and distribution|storage\/loading|loading bay|service yard|builders merchants|stock yard)\b/i;
const COMMERCIAL_FACILITY_RE =
  /\b(office building|offices?|hotel|restaurant|bar|cafe|retail|public house|photography studio|car showroom)\b/i;

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

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value || "").trim().replace(/\/$/, "").toLowerCase();
  }
}

function slugify(value, limit = 90) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return (slug || "record").slice(0, limit).replace(/_+$/g, "");
}

function truncate(value, limit) {
  const text = cleanText(value);
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

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

function parsePlanningDate(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
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
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const month = months[match[2].toLowerCase().slice(0, 3)];
    return month ? `${year}-${month}-${match[1].padStart(2, "0")}` : "";
  }
  return "";
}

function parseLongDate(value) {
  const raw = cleanText(value);
  const match = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return "";
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12"
  };
  const month = months[match[2].toLowerCase()];
  return month ? `${match[3]}-${month}-${match[1].padStart(2, "0")}` : "";
}

function extractPlanningApplicationId(value) {
  const match = String(value || "").match(/\b(?:LA04|[A-Z])\/\d{4}\/\d{4,5}\/[A-Z0-9]+(?:\/[A-Z0-9]+)?\b/i);
  return match ? match[0].toUpperCase() : "";
}

function allPlanningApplicationIds(value) {
  return [
    ...new Set(
      Array.from(String(value || "").matchAll(/\b(?:LA04|[A-Z])\/\d{4}\/\d{4,5}\/[A-Z0-9]+(?:\/[A-Z0-9]+)?\b/gi)).map(
        (match) => match[0].toUpperCase()
      )
    )
  ];
}

function normaliseNumber(value) {
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
  return Boolean(
    point &&
      Number(point.latitude) >= BELFAST_BOUNDS.minLat &&
      Number(point.latitude) <= BELFAST_BOUNDS.maxLat &&
      Number(point.longitude) >= BELFAST_BOUNDS.minLon &&
      Number(point.longitude) <= BELFAST_BOUNDS.maxLon
  );
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
    units: Math.max(
      maxMatchNumber(
        text,
        /\b(\d{1,4})\s*(?:no\.?\s*)?(?:apartments?|flats?|dwellings?|houses?|homes?|residential units?|student bedrooms?|student rooms?|studio rooms?|bedspaces?|bed spaces?|hotel rooms?|townhouses?)\b/gi
      ),
      maxMatchNumber(text, /\bconsisting of\s+(\d{1,4})\s+(?:studio\s+)?rooms?\b/gi)
    ),
    storeys: maxMatchNumber(text, /(?:^|[^\d.])\b(\d{1,2})\s*(?:-|\s)?storey\b/gi)
  };
}

function readPlanningRows() {
  const files = fs.readdirSync(RAW_PLANNING_DIR).filter((file) => file.toLowerCase().endsWith(".csv")).sort();
  const rows = [];
  const fileAudits = [];

  for (const file of files) {
    const fullPath = path.join(RAW_PLANNING_DIR, file);
    const localPath = path.relative(ROOT, fullPath).replace(/\\/g, "/");
    const text = fs.readFileSync(fullPath, "utf8");
    const parsed = parseCsv(text);
    const header = parsed.shift() || [];
    const index = Object.fromEntries(header.map((name, position) => [cleanText(name), position]));
    let minDecisionDate = null;
    let maxDecisionDate = null;

    const get = (row, ...keys) => {
      for (const key of keys) {
        if (index[key] !== undefined && row[index[key]] !== undefined) return row[index[key]];
      }
      return "";
    };

    parsed.forEach((row, rowIndex) => {
      const decisionDate = parsePlanningDate(get(row, "DecisionIssuedDate"));
      if (decisionDate) {
        minDecisionDate = minDecisionDate ? (decisionDate < minDecisionDate ? decisionDate : minDecisionDate) : decisionDate;
        maxDecisionDate = maxDecisionDate ? (decisionDate > maxDecisionDate ? decisionDate : maxDecisionDate) : decisionDate;
      }
      const appId = cleanText(get(row, "ID", "Id"));
      rows.push({
        file,
        localPath,
        rowNumber: rowIndex + 2,
        appId,
        appIdKey: extractPlanningApplicationId(appId) || appId.toUpperCase(),
        dateReceived: get(row, "DateReceived"),
        dateValid: get(row, "DateValid"),
        authority: get(row, "Authority"),
        lpaName: get(row, "LPA19NM"),
        constituency: get(row, "Constituency"),
        appType: get(row, "AppType"),
        classification: get(row, "Classification", "AppCategory"),
        statsCategory: get(row, "StatsCategory", "AppCategory"),
        urbanRural: get(row, "Urban_Rural"),
        housingType: get(row, "HousingType"),
        renewableType: get(row, "RenewableType"),
        proposal: get(row, "Proposal"),
        address: get(row, "SiteAddress", "Location"),
        eastingRaw: get(row, "Easting"),
        northingRaw: get(row, "Northing"),
        easting: normaliseNumber(get(row, "Easting")),
        northing: normaliseNumber(get(row, "Northing")),
        statusAt31Mar: get(row, "Status@31Mar"),
        decisionWithdrawal: get(row, "Decision_Withdrawal"),
        decisionIssuedDate: get(row, "DecisionIssuedDate"),
        date: decisionDate,
        raw: Object.fromEntries(header.map((name, position) => [cleanText(name), cleanText(row[position])]))
      });
    });

    fileAudits.push({
      file: localPath,
      row_count: parsed.length,
      header,
      sha256: sha256(text),
      decision_date_range: { min: minDecisionDate, max: maxDecisionDate }
    });
  }

  return { rows, fileAudits };
}

function isBelfastPlanningRecord(record) {
  return (
    cleanText(record.authority) === "Belfast" ||
    cleanText(record.lpaName) === "Belfast LPA" ||
    /^LA04\//i.test(cleanText(record.appId))
  );
}

function assessBaseQuality(record) {
  const proposal = cleanText(record.proposal);
  const combined = `${proposal} ${cleanText(record.address)} ${cleanText(record.statsCategory)} ${cleanText(
    record.classification
  )} ${cleanText(record.appType)}`;
  const category = cleanText(record.statsCategory);
  const classification = cleanText(record.classification);
  const appType = cleanText(record.appType);
  const scale = extractScale(proposal);
  const hasPhysicalWorks = SUBSTANTIAL_PHYSICAL_WORKS_RE.test(proposal);
  const hasBuiltUse = BUILT_USE_RE.test(proposal);
  const adminOrMinor = EXCLUDED_ADMIN_RE.test(combined) || /other consents/i.test(appType);
  const smallDomestic = EXCLUDED_SMALL_DOMESTIC_RE.test(combined);
  const lowSignalWorks = EXCLUDED_LOW_SIGNAL_WORKS_RE.test(combined);
  const qualitySignals = [];
  let score = 0;

  if (/major/i.test(classification) && hasPhysicalWorks && hasBuiltUse && !adminOrMinor && !lowSignalWorks) {
    score += 90;
    qualitySignals.push("major physical built-use approval");
  }
  if (scale.units >= 100 && !smallDomestic) {
    score += 70;
    qualitySignals.push(`${scale.units} units or rooms`);
  } else if (scale.units >= 50 && !smallDomestic) {
    score += 60;
    qualitySignals.push(`${scale.units} units or rooms`);
  } else if (scale.units >= 25 && !smallDomestic) {
    score += 50;
    qualitySignals.push(`${scale.units} units or rooms`);
  } else if (scale.units >= 10 && !smallDomestic) {
    score += 42;
    qualitySignals.push(`${scale.units} units or rooms`);
  }
  if (scale.storeys >= 8) {
    score += 30;
    qualitySignals.push(`${scale.storeys} storeys`);
  } else if (scale.storeys >= 5) {
    score += 24;
    qualitySignals.push(`${scale.storeys} storeys`);
  } else if (scale.storeys >= 3) {
    score += 12;
    qualitySignals.push(`${scale.storeys} storeys`);
  }
  if (hasPhysicalWorks) {
    score += 20;
    qualitySignals.push("substantial physical works wording");
  }
  if (hasBuiltUse) {
    score += 20;
    qualitySignals.push("built-use wording");
  }
  if (category === "Civic" || CIVIC_FACILITY_RE.test(proposal)) {
    score += 18;
    qualitySignals.push("civic/public facility wording");
  }
  if (["Industrial", "Commercial", "Mixed Use"].includes(category) && INDUSTRIAL_FACILITY_RE.test(proposal)) {
    score += 28;
    qualitySignals.push("industrial or production-space wording");
  }
  if (
    ["Commercial", "Mixed Use"].includes(category) &&
    COMMERCIAL_FACILITY_RE.test(proposal) &&
    hasPhysicalWorks &&
    !/\b(hot food|take[- ]?away|sandwich bar|awning|outdoor seating)\b/i.test(proposal)
  ) {
    score += 16;
    qualitySignals.push("commercial facility wording");
  }
  if (/listed/i.test(appType) || /listed building/i.test(proposal)) {
    score += 16;
    qualitySignals.push("listed-building context");
  }

  const largeResidential =
    scale.units >= 10 &&
    /\b(apartments?|flats?|dwellings?|housing|student accommodation|residential units?|townhouses?|student rooms?|studio rooms?)\b/i.test(
      proposal
    ) &&
    hasPhysicalWorks &&
    !smallDomestic &&
    !adminOrMinor &&
    !lowSignalWorks;
  const industrialFacility = INDUSTRIAL_FACILITY_RE.test(proposal) && hasPhysicalWorks && !adminOrMinor && !lowSignalWorks && !smallDomestic;
  const civicFacility =
    (CIVIC_FACILITY_RE.test(proposal) || category === "Civic") &&
    hasPhysicalWorks &&
    /\b(demolition|construction|extension|changing rooms?|student residential accommodation|pool pavilion|community hall|parochial house|research laboratories|teaching space)\b/i.test(
      proposal
    ) &&
    !adminOrMinor &&
    !lowSignalWorks &&
    !smallDomestic;
  const majorBuilt = /major/i.test(classification) && hasPhysicalWorks && hasBuiltUse && !adminOrMinor && !lowSignalWorks;
  const heritageConversion =
    (/listed/i.test(appType) || /listed building/i.test(proposal)) &&
    /\b(convert|conversion|redevelopment|restoration|new rear projection|extension|residential|apartments?|hotel|office|community hall|parochial house|student accommodation|changing rooms)\b/i.test(
      proposal
    ) &&
    !adminOrMinor &&
    !lowSignalWorks;

  if (largeResidential) qualitySignals.push("multi-unit residential");
  if (industrialFacility) qualitySignals.push("industrial or production-space works");
  if (civicFacility) qualitySignals.push("civic facility works");
  if (majorBuilt) qualitySignals.push("major built-use planning approval");
  if (heritageConversion) qualitySignals.push("listed high-signal conversion");

  if (adminOrMinor) {
    score -= 100;
    qualitySignals.push("administrative or revision wording excluded");
  }
  if (smallDomestic) {
    score -= 100;
    qualitySignals.push("small domestic wording excluded");
  }
  if (lowSignalWorks) {
    score -= 80;
    qualitySignals.push("minor works, frontage, hospitality, or telecom wording excluded");
  }

  return {
    score,
    scale,
    qualitySignals: [...new Set(qualitySignals)],
    passesGate: largeResidential || industrialFacility || civicFacility || majorBuilt || heritageConversion,
    adminOrMinor,
    smallDomestic,
    lowSignalWorks
  };
}

function assessTailQuality(record) {
  const base = assessBaseQuality(record);
  const proposal = cleanText(record.proposal);
  const category = cleanText(record.statsCategory);
  const classification = cleanText(record.classification);
  const appType = cleanText(record.appType);
  const address = cleanText(record.address);
  const combined = `${proposal} ${category} ${classification} ${appType} ${address}`;

  const action =
    /\b(demolition|partial demolition|redevelopment|new build|erection|construction|construct|extension|conversion|convert|change of use|alterations?|refurbishment|restoration|reconfiguration|replacement|fit[- ]?out|associated site works|siteworks|public realm|landscaping works|cladding|roof)\b/i.test(
      proposal
    );
  const builtUse =
    /\b(apartments?|flats?|dwellings?|housing|student accommodation|student rooms?|townhouses?|hotel|office|retail|restaurant|bar|cafe|commercial|industrial|warehouse|factory|workshop|laboratory|school|college|university|hospital|clinic|community|social club|library|museum|gallery|theatre|cinema|leisure|sports?|stadium|pavilion|mixed[- ]use|public house|bank|market)\b/i.test(
      combined
    );
  const domestic =
    /\b(existing dwelling|single dwelling|dwelling house|private dwelling|detached dwelling|semi detached|bungalows?|domestic|rear extension|side extension|front extension|loft conversion|garage|porch|sunroom|conservatory|garden room|garden pavilion|swimming pool|pool pavilion|private garden|de-conversion of three flats back to original dwelling|residential dwelling)\b/i.test(
      combined
    ) &&
    !/\b(\d{1,3}\s*(?:no\.?\s*)?(?:apartments?|flats?|dwellings?|housing units?|residential units?)|apartments?|flats?|student|care home|nursing home|residential home|social housing|residential development)\b/i.test(
      proposal
    );
  const minor =
    /\b(consent to display|advertisements?|signage|signs?|fascia|hoarding|billboard|discharge of conditions?|non[- ]material|telecommunications|antenna|mast|air quality monitoring|section 54|section 76|variation of conditions?|vary conditions?|renewal of permission|permission in principle|certificate of lawful|CCTV|camera|solar panels?|rooflights?|flue|extract(?:ion)?|air conditioning|condenser|awning|marquee|smoking area|roller shutter|atm|boundary wall|fenc(?:e|ing)|gate|safety guarding|handrail|window replacement|roof replacement|new roof light|patio|hard standing)\b/i.test(
      combined
    );
  const listed = /\b(listed building consents?|listed building|lbc|conservation area)\b/i.test(`${appType} ${proposal}`);
  const civic =
    /\b(school|college|university|campus|community centre|community hall|church|parish|parochial|social club|sports facility|sports hall|leisure centre|library|museum|gallery|hospital|clinic|medical centre|care home|nursing home|public realm|park|hub|stadium|stand|changing rooms?|childcare facility)\b/i.test(
      combined
    ) || category === "Civic";
  const publicRealm =
    /\b(public realm|streetscape|pedestrian|cycling|cycleway|greenway|park improvement|play park|landscaping works|pavement|footway|shared space|pedestrian footbridge)\b/i.test(
      combined
    );
  const industrialCommercial =
    /\b(warehouse|factory|industrial|workshop|office building|hotel|commercial building|retail unit|restaurant|bar|public house|market|bank building|bake shop)\b/i.test(
      combined
    ) || ["Commercial", "Industrial", "Mixed Use"].includes(category);
  const smallUse =
    /\b(dental surgery|orthodontic|veterinary|laser eye|medical surgery to shop|shop to dental|offices? to dental|private clinic|massage|beauty|tattoo|pilates|yoga studio|sandwich|hot food|takeaway)\b/i.test(
      combined
    );

  let score = base.score;
  const reasons = [];

  if (base.passesGate && base.score >= 45 && !domestic && !minor) {
    score += 20;
    reasons.push("residual high-signal planning approval");
  }
  if (listed && action && builtUse && !minor && !domestic && !smallUse) {
    score += 38;
    reasons.push("listed/conservation-area building works approval");
  }
  if (
    base.scale.units >= 3 &&
    /\b(apartments?|flats?|dwellings?|housing|student rooms?|student accommodation|residential units?)\b/i.test(proposal) &&
    action &&
    !minor &&
    !domestic
  ) {
    score += 34;
    reasons.push("multi-unit residential planning approval");
  }
  if (
    civic &&
    action &&
    !minor &&
    !domestic &&
    !smallUse &&
    !(category === "Residential" && !/\b(school|college|university|hospital|care home|community|public realm|footbridge|social housing|student accommodation)\b/i.test(combined))
  ) {
    score += 30;
    reasons.push("civic/community/public-facility planning approval");
  }
  if (
    industrialCommercial &&
    action &&
    builtUse &&
    !minor &&
    !domestic &&
    !smallUse &&
    !/\b(shopfront|frontage only|ground floor unit to office\.?$)\b/i.test(combined)
  ) {
    score += 25;
    reasons.push("commercial/industrial/mixed-use building works approval");
  }
  if (publicRealm && action && !minor && !domestic) {
    score += 28;
    reasons.push("public-realm or landscape planning approval");
  }

  if (domestic) score -= 80;
  if (minor) score -= 60;

  return {
    score,
    reasons: [...new Set(reasons)],
    base_score: base.score,
    base_signals: base.qualitySignals,
    scale: base.scale
  };
}

function sourceRecordIdFor(record) {
  return `APP_ID:${cleanText(record.appId)}; FILE:${record.localPath}; ROW:${record.rowNumber}`;
}

function categoryFor(record, quality) {
  const reason = quality.reasons[0] || "";
  const category = cleanText(record.statsCategory);
  const proposal = cleanText(record.proposal);
  if (reason.includes("listed")) return "heritage_or_listed_building";
  if (reason.includes("residential")) return "residential";
  if (reason.includes("civic") || category === "Civic") return "civic_community";
  if (reason.includes("public-realm") || /public realm|pedestrian|footbridge|greenway|cycleway/i.test(proposal)) return "public_realm";
  if (category === "Industrial" || /warehouse|factory|industrial|workshop/i.test(proposal)) return "industrial";
  if (category === "Mixed Use" || /mixed[- ]use/i.test(proposal)) return "mixed_use";
  if (category === "Commercial" || /office|hotel|restaurant|retail|bar|cafe|public house/i.test(proposal)) return "commercial";
  return "architecture_tail";
}

function projectTypeFor(record, quality) {
  const category = categoryFor(record, quality);
  const labels = {
    heritage_or_listed_building: "listed-building or conservation-area planning approval",
    residential: "multi-unit residential planning approval",
    civic_community: "civic/community/public-facility planning approval",
    public_realm: "public-realm planning approval",
    industrial: "industrial or production-space planning approval",
    mixed_use: "mixed-use planning approval",
    commercial: "commercial planning approval",
    architecture_tail: "architecture-related planning approval"
  };
  return labels[category] || labels.architecture_tail;
}

function limitationsFor(quality) {
  return [
    "Planning statistics rows are administrative planning records, not direct observations of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, or public use.",
    "The selected date is DecisionIssuedDate from the CSV; DateReceived and DateValid are retained as source fields but are not treated as physical-change dates.",
    "Coordinates are approximate WGS84 points converted from source Easting and Northing values for atlas navigation; they are not surveyed footprints, red-line boundaries, legal boundaries, or parcel geometry.",
    `Round270 keeps residual Belfast rows that survived live-corpus and prior-Belfast-pack dedupe and met a conservative tail gate: ${quality.reasons.join("; ")}.`,
    "Approval is not evidence that the proposal was built, opened, occupied, completed, delivered, or linked to any outcome."
  ];
}

function makePlanningCandidate(record, quality) {
  const point = niGridToApproxPoint(record.easting, record.northing);
  const date = record.date;
  const sourceRecordId = sourceRecordIdFor(record);
  const slug = slugify(`${record.appIdKey}_${date}`);
  const id = `${ROUND_ID}_${slug}`;
  const category = categoryFor(record, quality);
  const projectType = projectTypeFor(record, quality);
  const proposal = cleanText(record.proposal);
  const area = cleanText(record.address) || "Belfast";

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    id,
    candidate_id: id,
    event_id: id,
    event_id_suggestion: `bfs_arch_${id}`,
    date,
    effective_date: date,
    effective_date_range: null,
    date_precision: "day",
    bucket: `planning/approved/architecture/${category}`,
    category,
    event_family: "architecture/planning-statistics-tail",
    milestone_type: "planning_approval_administrative_record",
    title: `${projectType} ${cleanText(record.appIdKey)}: ${truncate(proposal, 110)}`,
    summary:
      `Department for Infrastructure Northern Ireland planning statistics record ${cleanText(record.appIdKey)} lists an approved Belfast ${cleanText(record.appType) || "planning"} application at ${area}, with decision date ${date}. Proposal text: ${truncate(proposal, 220)}`,
    observed_change:
      `Administrative planning approval recorded for application ${cleanText(record.appIdKey)}. This records the planning decision only; it is not evidence that the proposal was constructed, opened, occupied, completed, delivered, demolished, or linked to any outcome.`,
    area,
    latitude: point.latitude,
    longitude: point.longitude,
    lat: point.latitude,
    lon: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: `Source CSV Easting/Northing in ${sourceRecordId}`,
    coordinate_conversion:
      "Approximate conversion from source Easting/Northing to WGS84 using the established lightweight Belfast transform: longitude = -5.93 + (easting - 333000) / 65000; latitude = 54.6 + (northing - 374000) / 111000.",
    geometry_source: "Approximate WGS84 point converted from official CSV Easting and Northing fields.",
    geometry_precision:
      "approximate source point for atlas navigation; not a surveyed project footprint, parcel boundary, red-line boundary, legal boundary, or evidence of built works",
    source_id: SOURCES.planningStats.source_id,
    source_ids: [SOURCES.planningStats.source_id],
    source_name: SOURCES.planningStats.source_name,
    source_family: "DfI planning activity statistics",
    publisher: SOURCES.planningStats.publisher,
    source_url: SOURCES.planningStats.source_url,
    source_file: record.localPath,
    source_row_number: record.rowNumber,
    source_record_id: sourceRecordId,
    source_type: "official annual planning-statistics CSV row",
    source_date_field: "DecisionIssuedDate",
    source_date_value: cleanText(record.decisionIssuedDate),
    source_retrieved_at: ACCESSED_AT,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectType,
    planning_application_id: cleanText(record.appIdKey),
    planning_application_type: cleanText(record.appType),
    planning_classification: cleanText(record.classification),
    planning_stats_category: cleanText(record.statsCategory),
    planning_decision_status: cleanText(`${record.decisionWithdrawal} ${record.statusAt31Mar}`),
    planning_quality_gate: quality.reasons[0],
    planning_tail_score: quality.score,
    planning_base_score: quality.base_score,
    planning_quality_reasons: quality.reasons,
    planning_base_signals: quality.base_signals,
    detected_scale: {
      units_or_rooms: quality.scale.units || null,
      storeys: quality.scale.storeys || null
    },
    planning_approval_caveat:
      "Approval is an administrative planning-decision milestone only; do not treat it as observed construction, completion, opening, occupation, delivery, demolition completion, final built form, or impact evidence.",
    source_easting: record.easting,
    source_northing: record.northing,
    license: SOURCES.planningStats.license,
    license_url: SOURCES.planningStats.license_url,
    license_or_terms_note: `${SOURCES.planningStats.license} ${SOURCES.planningStats.license_url}`,
    attribution: SOURCES.planningStats.attribution,
    limitations: limitationsFor(quality),
    transformation_method:
      "scripts/fetch_round270_belfast_official_planning_tail_candidates.js parsed local official DfI planning-statistics CSVs, deduped against the current manual architecture corpus and prior Belfast candidate packs under tmp/subagents, kept approved Belfast rows dated 2008-01-01 through 2026-05-20 with approximate in-city coordinates, applied residual architecture/planning-tail quality gates, excluded domestic/minor/admin/signage/telecom/frontage-only rows, capped the ranked review pack at 100, and preserved file/row/date/license/provenance fields.",
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
      Proposal: proposal,
      SiteAddress: area,
      Easting: cleanText(record.eastingRaw),
      Northing: cleanText(record.northingRaw),
      Decision_Withdrawal: cleanText(record.decisionWithdrawal),
      "Status@31Mar": cleanText(record.statusAt31Mar),
      source_file: record.localPath,
      source_row_number: record.rowNumber
    }
  };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

function rowsFromJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  for (const key of ["events", "candidates", "records", "milestones", "items"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  if (Array.isArray(value.features)) {
    return value.features.map((feature) => ({
      ...(feature.properties || {}),
      geometry: feature.geometry || null
    }));
  }
  return [];
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) out.push(full);
  }
  return out;
}

function isPriorBelfastCandidateFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/").toLowerCase();
  const base = path.basename(file).toLowerCase();
  if (rel.includes(`tmp/subagents/${ROUND_ID}/`)) return false;
  if (!rel.includes("belfast")) return false;
  return base === "candidates.json" || base.includes("candidate") || rel.includes("architecture_milestones");
}

function dateForPrior(row) {
  return String(
    row.date ||
      row.effective_date ||
      row.event_date ||
      row.decision_date ||
      row.milestone_date ||
      row.source_date_value ||
      ""
  ).slice(0, 10);
}

function sourceUrlForPrior(row) {
  if (row.source_url || row.url || row.access_url) return row.source_url || row.url || row.access_url;
  if (row.provenance && row.provenance.source_url) return row.provenance.source_url;
  if (Array.isArray(row.evidence)) {
    const found = row.evidence.find((item) => item && item.url);
    if (found) return found.url;
  }
  return "";
}

function buildPriorIndex() {
  const files = [];
  if (fs.existsSync(MANUAL_CORPUS)) files.push(MANUAL_CORPUS);
  files.push(...walkJsonFiles(path.join(ROOT, "tmp", "subagents")).filter(isPriorBelfastCandidateFile));
  const uniqueFiles = [...new Set(files)].sort((a, b) => a.localeCompare(b));
  const index = {
    files: [],
    record_count: 0,
    applicationIds: new Set(),
    eventIds: new Set(),
    sourceRecordDate: new Set(),
    sourceUrlDate: new Set(),
    titleDate: new Set(),
    sourceRecords: new Set(),
    textRecords: []
  };

  for (const file of uniqueFiles) {
    const rows = rowsFromJson(readJson(file));
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    index.files.push({ path: rel, record_count: rows.length });
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      index.record_count += 1;
      const id = cleanText(row.event_id || row.id || row.candidate_id || row.event_id_suggestion || "");
      const date = dateForPrior(row);
      const title = cleanText(row.title || row.name || "");
      const sourceRecordId = cleanText(row.source_record_id || row.application_reference || row.planning_application_id || "");
      const sourceUrl = sourceUrlForPrior(row);
      const blob = [
        row.planning_application_id,
        row.source_record_id,
        row.event_id,
        row.id,
        row.candidate_id,
        row.title,
        row.summary,
        row.observed_change,
        row.area,
        row.source_url
      ].join(" ");

      if (id) index.eventIds.add(normalizeText(id));
      for (const appId of allPlanningApplicationIds(blob)) index.applicationIds.add(appId);
      if (sourceRecordId) index.sourceRecords.add(normalizeText(sourceRecordId));
      if (sourceRecordId && date) index.sourceRecordDate.add(`${normalizeText(sourceRecordId)}|${date}`);
      if (sourceUrl && date) index.sourceUrlDate.add(`${normalizeUrl(sourceUrl)}|${date}`);
      if (title && date) index.titleDate.add(`${normalizeText(title)}|${date}`);
      index.textRecords.push(normalizeText(blob));
    }
  }

  return index;
}

function addRejection(rejected, counts, reason, row, extra = {}) {
  counts[reason] = (counts[reason] || 0) + 1;
  if (rejected.length >= REJECT_DETAIL_CAP) return;
  rejected.push({
    reason,
    source_family: row && row.source_family ? row.source_family : "DfI planning activity statistics",
    app_id: row ? cleanText(row.appId || row.ref || row.application_reference) : "",
    source_file: row ? row.localPath || "" : "",
    source_row_number: row ? row.rowNumber || null : null,
    date: row ? row.date || row.advertised_date || "" : "",
    category: row ? cleanText(row.statsCategory || row.category || "") : "",
    classification: row ? cleanText(row.classification || "") : "",
    app_type: row ? cleanText(row.appType || "") : "",
    proposal: row ? truncate(row.proposal || "", 260) : "",
    ...extra
  });
}

function buildPlanningCandidates(index) {
  const { rows, fileAudits } = readPlanningRows();
  const rejected = [];
  const rejectionCounts = {};
  const selected = [];
  const seenApps = new Set();
  const seenSourceDate = new Set();
  let latestSourceDate = DATE_MIN;

  for (const record of rows) {
    if (record.date && record.date > latestSourceDate && record.date <= DATE_MAX) {
      latestSourceDate = record.date;
    }
    const point = niGridToApproxPoint(record.easting, record.northing);
    const status = `${cleanText(record.decisionWithdrawal)} ${cleanText(record.statusAt31Mar)}`;
    const sourceRecordId = sourceRecordIdFor(record);

    if (!isBelfastPlanningRecord(record)) {
      addRejection(rejected, rejectionCounts, "not_belfast", record);
      continue;
    }
    if (!/approved/i.test(status)) {
      addRejection(rejected, rejectionCounts, "not_approved", record);
      continue;
    }
    if (!record.date || record.date < DATE_MIN || record.date > DATE_MAX) {
      addRejection(rejected, rejectionCounts, "outside_requested_date_window", record);
      continue;
    }
    if (!point || !inBelfastEnvelope(point)) {
      addRejection(rejected, rejectionCounts, "missing_or_outside_belfast_geometry", record);
      continue;
    }
    if (!record.appIdKey) {
      addRejection(rejected, rejectionCounts, "missing_application_id", record);
      continue;
    }
    if (index.applicationIds.has(record.appIdKey)) {
      addRejection(rejected, rejectionCounts, "already_in_current_corpus_or_prior_belfast_pack_app_id", record);
      continue;
    }
    const linkedExistingAppIds = allPlanningApplicationIds(record.proposal).filter(
      (appId) => appId !== record.appIdKey && index.applicationIds.has(appId)
    );
    if (linkedExistingAppIds.length) {
      addRejection(rejected, rejectionCounts, "references_already_indexed_planning_application_id", record, {
        linked_existing_application_ids: linkedExistingAppIds
      });
      continue;
    }
    const sourceDateKey = `${normalizeText(sourceRecordId)}|${record.date}`;
    if (index.sourceRecordDate.has(sourceDateKey) || index.sourceRecords.has(normalizeText(sourceRecordId))) {
      addRejection(rejected, rejectionCounts, "already_in_current_corpus_or_prior_belfast_pack_source_row", record);
      continue;
    }
    if (seenApps.has(record.appIdKey) || seenSourceDate.has(sourceDateKey)) {
      addRejection(rejected, rejectionCounts, "duplicate_within_round270_source_row_or_app", record);
      continue;
    }
    const quality = assessTailQuality(record);
    if (!quality.reasons.length || quality.score < 65) {
      addRejection(rejected, rejectionCounts, "below_round270_tail_quality_gate", record, {
        tail_score: quality.score,
        base_score: quality.base_score,
        quality_reasons: quality.reasons,
        base_signals: quality.base_signals
      });
      continue;
    }

    seenApps.add(record.appIdKey);
    seenSourceDate.add(sourceDateKey);
    selected.push({ record, quality });
  }

  selected.sort(
    (a, b) =>
      b.quality.score - a.quality.score ||
      b.quality.base_score - a.quality.base_score ||
      b.record.date.localeCompare(a.record.date) ||
      cleanText(a.record.appId).localeCompare(cleanText(b.record.appId))
  );

  for (const item of selected.slice(TARGET_CANDIDATES)) {
    addRejection(rejected, rejectionCounts, "ranked_below_round270_candidate_cap", item.record, {
      tail_score: item.quality.score,
      quality_reasons: item.quality.reasons
    });
  }

  const candidates = selected
    .slice(0, TARGET_CANDIDATES)
    .map(({ record, quality }) => makePlanningCandidate(record, quality))
    .sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  return {
    candidates,
    rejected,
    rejectionCounts,
    fileAudits,
    inputRows: rows.length,
    eligibleBeforeCap: selected.length,
    latestSourceDate
  };
}

function parseCurrentPlanningRows(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"");
  const lines = text.split(/\n+/).map((line) => cleanText(line)).filter(Boolean);
  let advertised = "";
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const dateMatch = lines[index].match(/^Advertised on\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
    if (dateMatch) {
      advertised = parseLongDate(dateMatch[1]);
      continue;
    }
    if (/^LA04\/\d{4}\/\d{4,5}\//.test(lines[index])) {
      rows.push({
        source_family: "BCC current planning applications",
        application_reference: lines[index],
        advertised_date: advertised,
        location: lines[index + 1] || "",
        proposal: lines[index + 2] || ""
      });
    }
  }
  return rows;
}

function currentPlanningRejects(currentRows, index) {
  const rejected = [];
  const counts = {};
  for (const row of currentRows) {
    const appId = extractPlanningApplicationId(row.application_reference);
    const date = row.advertised_date;
    const combined = `${row.location} ${row.proposal}`;
    let reason = "low_signal_or_minor_current_application";
    if (!date || date < DATE_MIN || date > DATE_MAX) reason = "current_application_outside_date_window";
    else if (appId && index.applicationIds.has(appId)) reason = "current_application_already_in_current_corpus_or_prior_pack";
    else if (
      /\b(single storey|two-storey|rear extension|side extension|roof dormer|patio|domestic|dwelling|householder|garden room|flue|signage|shopfront|variation of conditions|retrospective)\b/i.test(
        combined
      )
    ) {
      reason = "minor_domestic_or_admin_current_application";
    } else if (
      /\b(SEN building|mixed use development|serviced apartments|public realm|structural bracing|demolition|pedestrian|market|padel|student accommodation)\b/i.test(
        combined
      )
    ) {
      reason = "screened_current_application_needs_planning_portal_geometry_before_candidate";
    }
    counts[reason] = (counts[reason] || 0) + 1;
    rejected.push({
      reason,
      source_family: "BCC current planning applications",
      source_name: SOURCES.bccCurrentPlanning.source_name,
      publisher: SOURCES.bccCurrentPlanning.publisher,
      source_url: SOURCES.bccCurrentPlanning.source_url,
      source_type: SOURCES.bccCurrentPlanning.source_type,
      license: SOURCES.bccCurrentPlanning.license,
      license_url: SOURCES.bccCurrentPlanning.license_url,
      accessed_at: ACCESSED_AT,
      application_reference: row.application_reference,
      advertised_date: row.advertised_date,
      location: row.location,
      proposal: row.proposal,
      caveat:
        "Current-planning rows are mutable advertised-application records and do not provide row-level official coordinates on the council page; use the NI Planning Portal before production ingest."
    });
  }
  return { rejected, counts };
}

async function retrieve(url, asJson = false) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": `${ROUND_ID}/1.0 (+https://openai.com/codex; public-source-audit)`
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    let json = null;
    if (asJson) {
      try {
        json = JSON.parse(buffer.toString("utf8"));
      } catch {
        json = null;
      }
    }
    return {
      ok: response.ok,
      http_status: response.status,
      final_url: response.url,
      elapsed_ms: Date.now() - started,
      bytes: buffer.length,
      content_sha256: sha256(buffer),
      body: buffer.toString("utf8"),
      json,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null,
      final_url: url,
      elapsed_ms: Date.now() - started,
      bytes: 0,
      content_sha256: null,
      body: "",
      json: null,
      error: error && error.message ? error.message : String(error)
    };
  }
}

async function buildSourceAudit(planningResult, bccRows, bccRetrieval, hedRetrieval) {
  const planningRetrieval = await retrieve(SOURCES.planningStats.source_url);
  const hedCount = hedRetrieval.json && Number.isFinite(Number(hedRetrieval.json.count)) ? Number(hedRetrieval.json.count) : null;

  const audit = [
    {
      source_id: SOURCES.planningStats.source_id,
      source_name: SOURCES.planningStats.source_name,
      publisher: SOURCES.planningStats.publisher,
      url: SOURCES.planningStats.source_url,
      final_url: planningRetrieval.final_url,
      source_type: SOURCES.planningStats.source_type,
      source_family: "DfI planning activity statistics",
      license: SOURCES.planningStats.license,
      license_url: SOURCES.planningStats.license_url,
      attribution: SOURCES.planningStats.attribution,
      coverage_years: `Local CSV files screened for Belfast planning decisions from ${DATE_MIN} through ${planningResult.latestSourceDate}.`,
      update_frequency: "Annual official statistical releases; source page may add newer releases.",
      geographic_scope: "Belfast planning authority / Belfast LPA rows.",
      granularity: "Planning application CSV row with application reference, decision date, proposal, address, Easting/Northing and status fields.",
      key_fields: [
        "ID/Id",
        "DecisionIssuedDate",
        "Authority/LPA19NM",
        "AppType",
        "Classification/AppCategory",
        "StatsCategory",
        "Proposal",
        "SiteAddress/Location",
        "Easting",
        "Northing",
        "Decision_Withdrawal",
        "Status@31Mar",
        "source file",
        "source row number"
      ],
      reliability_assessment:
        "strong for official administrative planning-decision records; usable with explicit caveats for architecture/city-change candidate discovery",
      required_caveats: [
        "Planning approval is an administrative decision record, not evidence of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, public use, or causal impact.",
        "Approximate converted points are for review navigation and not legal planning red lines or surveyed project geometry."
      ],
      ingestion_recommendation:
        "Recommended for review-only candidate import with the planning-approval caveat visible and row-level CSV provenance retained.",
      retrieval: retrievalSummary(planningRetrieval),
      local_files: planningResult.fileAudits
    },
    {
      source_id: SOURCES.bccCurrentPlanning.source_id,
      source_name: SOURCES.bccCurrentPlanning.source_name,
      publisher: SOURCES.bccCurrentPlanning.publisher,
      url: SOURCES.bccCurrentPlanning.source_url,
      final_url: bccRetrieval.final_url,
      source_type: SOURCES.bccCurrentPlanning.source_type,
      source_family: "BCC current planning applications",
      license: SOURCES.bccCurrentPlanning.license,
      license_url: SOURCES.bccCurrentPlanning.license_url,
      attribution: SOURCES.bccCurrentPlanning.attribution,
      coverage_years: `Current advertised rows visible on ${ACCESSED_AT}; parsed rows dated within ${DATE_MIN} through ${DATE_MAX}.`,
      update_frequency: "Mutable council current-planning page, updated as applications are advertised.",
      geographic_scope: "Belfast current applications open for comment.",
      granularity: "Advertised application list row with reference, location, proposal and advertised date.",
      key_fields: ["Advertised date", "application reference", "location", "proposal", "source URL"],
      reliability_assessment:
        "usable with caveats for application-advertisement discovery; row-level official geometry is not present on this page",
      required_caveats: [
        "Current applications are mutable advertised administrative rows, not decisions or delivery evidence.",
        "Rows require NI Planning Portal verification for source geometry and application details before production ingest."
      ],
      ingestion_recommendation:
        "Audit/reject in round270 unless a row can be linked to planning portal geometry; do not emit approximate address-only candidates from this page alone.",
      retrieval: retrievalSummary(bccRetrieval),
      parsed_row_count: bccRows.length
    },
    {
      source_id: SOURCES.hedListedBuildings.source_id,
      source_name: SOURCES.hedListedBuildings.source_name,
      publisher: SOURCES.hedListedBuildings.publisher,
      url: SOURCES.hedListedBuildings.source_url,
      api_endpoint: SOURCES.hedListedBuildings.api_endpoint,
      final_url: hedRetrieval.final_url,
      source_type: SOURCES.hedListedBuildings.source_type,
      source_family: "DfC/HED listed buildings",
      license: SOURCES.hedListedBuildings.license,
      license_url: SOURCES.hedListedBuildings.license_url,
      attribution: SOURCES.hedListedBuildings.attribution,
      coverage_years:
        "Belfast listed-building layer checked on 2026-05-20; public ArcGIS fields expose current grade/use and construction-era dates but not a row-level 2008-2026 listing/change date.",
      update_frequency: "OpenDataNI/HED public layer; verify current service metadata before production import.",
      geographic_scope: "Belfast listed-building rows where Council='Belfast'.",
      granularity: "Listed-building point feature row.",
      key_fields: ["HB_ref", "CurrentGra", "Address", "Council", "TxtIGRef", "geometry", "Date_Const"],
      reliability_assessment: "strong for current register snapshot; not sufficient for modern event-date candidates without row-level listing/change dates",
      required_caveats: [
        "Date_Const is construction-era metadata, not a modern listing or change date.",
        "Current grade/current use are snapshot fields and should not be forced into 2008-2026 event chronology without a dated register change."
      ],
      ingestion_recommendation:
        "Audit-only in round270. Do not emit listed-building candidates from this layer unless a modern row-level listing/change date is available.",
      retrieval: retrievalSummary(hedRetrieval),
      belfast_layer_count: hedCount
    }
  ];

  return {
    schema_version: `${ROUND_ID}.source_audit.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    audit_count: audit.length,
    source_mix: countBy(audit, (row) => row.publisher),
    audit
  };
}

function retrievalSummary(retrieval) {
  return {
    retrieved_at: ACCESSED_AT,
    ok: retrieval.ok,
    http_status: retrieval.http_status,
    final_url: retrieval.final_url,
    elapsed_ms: retrieval.elapsed_ms,
    bytes: retrieval.bytes,
    content_sha256: retrieval.content_sha256,
    error: retrieval.error
  };
}

function countBy(rows, selector) {
  const counts = {};
  for (const row of rows) {
    const key = selector(row) || "not supplied";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function dateRange(rows) {
  const dates = rows.map((row) => row.date || row.effective_date).filter(Boolean).sort();
  return dates.length ? { min: dates[0], max: dates[dates.length - 1] } : { min: null, max: null };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function validateCandidates(candidates, index) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const eventIds = new Set();
  const sourceDateKeys = new Set();
  const titleDateKeys = new Set();
  const required = [
    "id",
    "candidate_id",
    "event_id",
    "title",
    "summary",
    "observed_change",
    "date",
    "effective_date",
    "date_precision",
    "city_id",
    "geometry",
    "latitude",
    "longitude",
    "source_ids",
    "source_name",
    "publisher",
    "source_url",
    "source_record_id",
    "source_type",
    "license",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method"
  ];
  const banned = /\b(proves?|proof|predicts?|forecasts?|simulates?|caused|will increase|will decrease|impact score|causal)\b/i;

  for (const candidate of candidates) {
    for (const field of required) {
      const value = candidate[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        errors.push(`${candidate.id || candidate.title || "candidate"} missing ${field}`);
      }
    }

    if (candidate.city_id !== "belfast") errors.push(`${candidate.id} city_id is not belfast`);
    if (candidate.confidence !== "documented") errors.push(`${candidate.id} confidence is not documented`);
    if (!candidate.geometry || candidate.geometry.type !== "Point") errors.push(`${candidate.id} missing Point geometry`);
    const lon = Number(candidate.geometry && candidate.geometry.coordinates && candidate.geometry.coordinates[0]);
    const lat = Number(candidate.geometry && candidate.geometry.coordinates && candidate.geometry.coordinates[1]);
    if (!inBelfastEnvelope({ latitude: lat, longitude: lon })) errors.push(`${candidate.id} coordinate outside Belfast envelope`);

    const date = String(candidate.date || candidate.effective_date || "").slice(0, 10);
    if (date < DATE_MIN || date > DATE_MAX) errors.push(`${candidate.id} date ${date} outside requested window`);

    const idKey = normalizeText(candidate.id);
    const eventKey = normalizeText(candidate.event_id);
    const appIds = allPlanningApplicationIds(candidate.planning_application_id || candidate.source_record_id);
    const sourceRecordDate = `${normalizeText(candidate.source_record_id)}|${date}`;
    const titleDate = `${normalizeText(candidate.title)}|${date}`;

    if (ids.has(idKey)) errors.push(`duplicate candidate id ${candidate.id}`);
    ids.add(idKey);
    if (eventIds.has(eventKey)) errors.push(`duplicate event id ${candidate.event_id}`);
    eventIds.add(eventKey);
    if (sourceDateKeys.has(sourceRecordDate)) errors.push(`duplicate source-record/date key ${sourceRecordDate}`);
    sourceDateKeys.add(sourceRecordDate);
    if (titleDateKeys.has(titleDate)) errors.push(`duplicate title/date key ${titleDate}`);
    titleDateKeys.add(titleDate);

    for (const appId of appIds) {
      if (index.applicationIds.has(appId)) errors.push(`${candidate.id} overlaps prior application id ${appId}`);
    }
    if (index.sourceRecordDate.has(sourceRecordDate)) {
      errors.push(`${candidate.id} overlaps prior source/date key`);
    }
    if (index.titleDate.has(titleDate)) errors.push(`${candidate.id} overlaps prior title/date key`);

    const checked = [
      candidate.title,
      candidate.summary,
      candidate.observed_change,
      Array.isArray(candidate.limitations) ? candidate.limitations.join(" ") : candidate.limitations,
      candidate.planning_approval_caveat,
      candidate.transformation_method
    ].join(" ");
    if (banned.test(checked)) errors.push(`${candidate.id} contains overclaim wording`);
    if (!/not evidence/i.test(checked)) warnings.push(`${candidate.id} does not include explicit not-evidence caveat`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    checked: {
      required_provenance: true,
      date_window: `${DATE_MIN}..${DATE_MAX}`,
      belfast_coordinate_sanity: true,
      unique_event_ids: true,
      unique_source_date_keys: true,
      unique_title_date_keys: true,
      no_overlap_against_current_corpus_and_prior_belfast_packs: true,
      overclaim_wording_scan: true
    }
  };
}

function buildNotes(summary, sourceAudit) {
  const sourceLines = sourceAudit.audit
    .map(
      (row) =>
        `- ${row.publisher}: ${row.source_name} (${row.retrieval.ok ? `HTTP ${row.retrieval.http_status}` : `failed: ${row.retrieval.error}`})`
    )
    .join("\n");
  return `# ${ROUND_ID}

Generated: ${GENERATED_AT}
Accessed: ${ACCESSED_AT}

## Scope

Official Belfast architecture/city-change tail pass for records dated ${DATE_MIN} through ${DATE_MAX}. The accepted candidates are Department for Infrastructure planning-statistics approval rows that were still missing after screening the current manual architecture corpus and prior Belfast candidate packs under \`tmp/subagents\`.

## Result

- Accepted candidates: ${summary.accepted_candidates}
- Eligible before cap: ${summary.eligible_before_cap}
- Candidate cap: ${summary.target_candidate_count}
- Accepted date range: ${summary.emitted_date_range.min || "none"} to ${summary.emitted_date_range.max || "none"}
- Rejected/detail rows retained: ${summary.rejected_detail_count}
- Prior files screened: ${summary.dedupe.prior_file_count}
- Prior records indexed: ${summary.dedupe.prior_record_count}

## Accepted Source Mix

${Object.entries(summary.source_mix)
  .map(([source, count]) => `- ${source}: ${count}`)
  .join("\n")}

## Audited Sources

${sourceLines}

## Caveats

- Planning approvals are administrative decision records. They are not evidence of construction, completion, opening, occupation, final built form, delivery, demolition completion, public use, outcomes, or causation.
- DfI CSV Easting/Northing values were converted to approximate WGS84 review points; they are not surveyed footprints, parcels, legal boundaries, or planning red lines.
- BCC current-planning rows were audited but not emitted because the council page is mutable and lacks row-level official geometry.
- HED listed-building data was audited but not emitted from the current ArcGIS layer because public fields expose construction-era dates/current snapshot fields rather than a row-level modern listing/change date.
`;
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildPriorIndex();
  const planningResult = buildPlanningCandidates(index);

  const bccRetrieval = await retrieve(SOURCES.bccCurrentPlanning.source_url);
  const bccRows = bccRetrieval.ok ? parseCurrentPlanningRows(bccRetrieval.body) : [];
  const bccRejected = currentPlanningRejects(bccRows, index);

  const hedCountUrl = `${SOURCES.hedListedBuildings.api_endpoint}/query?where=${encodeURIComponent(
    "Council='Belfast'"
  )}&returnCountOnly=true&f=json`;
  const hedRetrieval = await retrieve(hedCountUrl, true);
  const sourceAudit = await buildSourceAudit(planningResult, bccRows, bccRetrieval, hedRetrieval);

  const candidates = planningResult.candidates;
  const validation = validateCandidates(candidates, index);
  if (!validation.ok) {
    throw new Error(`Round270 validation failed: ${validation.errors.join("; ")}`);
  }

  const emittedRange = dateRange(candidates);
  const sourceMix = countBy(candidates, (candidate) => candidate.publisher);
  const rejectedPayload = {
    schema_version: `${ROUND_ID}.rejected.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    rejected_count:
      Object.values(planningResult.rejectionCounts).reduce((sum, count) => sum + count, 0) + bccRejected.rejected.length + 1,
    rejected_detail_count: planningResult.rejected.length + bccRejected.rejected.length + 1,
    detail_scope:
      "DfI planning-statistics rejected detail is capped for reviewability; rejection_counts preserves full exclusion counts. BCC current-planning rows are listed individually.",
    rejection_counts: {
      ...Object.fromEntries(Object.entries(planningResult.rejectionCounts).sort(([a], [b]) => a.localeCompare(b))),
      ...Object.fromEntries(Object.entries(bccRejected.counts).map(([key, count]) => [`bcc_${key}`, count])),
      hed_listed_buildings_no_modern_row_date: 1
    },
    rejected: [
      ...planningResult.rejected,
      ...bccRejected.rejected,
      {
        reason: "hed_listed_buildings_no_modern_row_date",
        source_family: "DfC/HED listed buildings",
        source_name: SOURCES.hedListedBuildings.source_name,
        publisher: SOURCES.hedListedBuildings.publisher,
        source_url: SOURCES.hedListedBuildings.source_url,
        api_endpoint: SOURCES.hedListedBuildings.api_endpoint,
        accessed_at: ACCESSED_AT,
        caveat:
          "The public HED listed-buildings ArcGIS layer has HB references, current grade/use, construction-era Date_Const and geometry, but not a row-level 2008-2026 listing/change date. It was audited but not forced into event candidates."
      }
    ]
  };

  const summary = {
    schema_version: `${ROUND_ID}.summary.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    target_candidate_count: TARGET_CANDIDATES,
    accepted_candidates: candidates.length,
    eligible_before_cap: planningResult.eligibleBeforeCap,
    rejected_detail_count: rejectedPayload.rejected_detail_count,
    source_audit_count: sourceAudit.audit_count,
    source_mix: sourceMix,
    audited_source_mix: sourceAudit.source_mix,
    emitted_date_range: emittedRange,
    date_window: { start: DATE_MIN, end: DATE_MAX },
    counts_by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    counts_by_bucket: countBy(candidates, (candidate) => candidate.bucket),
    counts_by_category: countBy(candidates, (candidate) => candidate.category),
    counts_by_quality_gate: countBy(candidates, (candidate) => candidate.planning_quality_gate),
    counts_by_app_type: countBy(candidates, (candidate) => candidate.planning_application_type),
    counts_by_source_file: countBy(candidates, (candidate) => candidate.source_file),
    dfi_input_rows: planningResult.inputRows,
    dfi_latest_source_date_seen: planningResult.latestSourceDate,
    bcc_current_rows_seen: bccRows.length,
    dedupe: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length,
      prior_record_count: index.record_count,
      indexed_application_ids: index.applicationIds.size,
      indexed_event_ids: index.eventIds.size,
      indexed_source_record_date_keys: index.sourceRecordDate.size,
      indexed_source_url_date_keys: index.sourceUrlDate.size,
      indexed_title_date_keys: index.titleDate.size,
      prior_files: index.files.map((entry) => entry.path)
    },
    validation,
    output_files: {
      candidates: path.relative(ROOT, OUTPUTS.candidates).replace(/\\/g, "/"),
      source_audit: path.relative(ROOT, OUTPUTS.sourceAudit).replace(/\\/g, "/"),
      summary: path.relative(ROOT, OUTPUTS.summary).replace(/\\/g, "/"),
      notes: path.relative(ROOT, OUTPUTS.notes).replace(/\\/g, "/"),
      rejected: path.relative(ROOT, OUTPUTS.rejected).replace(/\\/g, "/")
    },
    caveat:
      "Accepted candidates are source-backed administrative planning milestones only. They must not be counted as construction starts, completions, openings, delivery outcomes, forecasts, impacts, or causal evidence."
  };

  const candidatesPayload = {
    schema_version: `${ROUND_ID}.candidates.v1`,
    generated_at: GENERATED_AT,
    accessed_at: ACCESSED_AT,
    city_id: "belfast",
    round_id: ROUND_ID,
    candidate_count: candidates.length,
    accepted_count: candidates.length,
    source_ids: [...new Set(candidates.flatMap((candidate) => candidate.source_ids))].sort(),
    source_urls: [...new Set(candidates.map((candidate) => candidate.source_url))].sort(),
    deduped_against: {
      manual_corpus: path.relative(ROOT, MANUAL_CORPUS).replace(/\\/g, "/"),
      prior_file_count: index.files.length,
      prior_record_count: index.record_count,
      prior_files: index.files.map((entry) => entry.path)
    },
    scope_note:
      "Official DfI Belfast planning-statistics tail candidates not already present in the current manual architecture corpus or prior Belfast packs. Planning approval is not evidence of construction, opening, occupation, completion, delivery, final built form, or causal effects.",
    source_audits: sourceAudit.audit.filter((row) => row.source_id === SOURCES.planningStats.source_id),
    validation,
    candidates
  };

  writeJson(OUTPUTS.candidates, candidatesPayload);
  writeJson(OUTPUTS.sourceAudit, sourceAudit);
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.rejected, rejectedPayload);
  fs.writeFileSync(OUTPUTS.notes, buildNotes(summary, sourceAudit), "utf8");

  console.log(
    JSON.stringify(
      {
        round_id: ROUND_ID,
        accepted_candidates: candidates.length,
        emitted_date_range: emittedRange,
        source_mix: sourceMix,
        audited_sources: sourceAudit.audit_count,
        rejected_detail_count: rejectedPayload.rejected_detail_count,
        validation_ok: validation.ok,
        output_dir: path.relative(ROOT, OUT_DIR).replace(/\\/g, "/")
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
