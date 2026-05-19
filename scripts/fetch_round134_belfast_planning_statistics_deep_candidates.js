const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RETRIEVED_AT = "2026-05-19";
const SOURCE_ID = "ni-planning-statistics";
const SOURCE_URL = "https://www.infrastructure-ni.gov.uk/articles/planning-activity-statistics";
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round134_belfast_planning_statistics_deep");
const OUT_PATH = path.join(OUT_DIR, "candidates.json");
const AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const LIMIT = 750;

const START = new Date("2008-01-01T00:00:00Z");
const END = new Date(`${RETRIEVED_AT}T23:59:59Z`);
const BELFAST_BBOX = [-6.12, 54.45, -5.74, 54.75];

const CATEGORY_BUCKET = {
  Residential: "planning/development/housing",
  Commercial: "planning/development/commercial",
  Industrial: "planning/development/employment",
  "Mixed Use": "planning/development/mixed_use",
  Civic: "planning/development/civic",
  "Change of Use": "planning/development/change_of_use",
  Other: "planning/development/other"
};

const HIGH_SIGNAL_RE = /\b(apartment|flat|dwelling|housing|homes?|residential|student|hotel|office|retail|mixed[- ]use|commercial|industrial|warehouse|factory|workshop|laboratory|research|school|college|university|campus|hospital|clinic|surgery|care home|nursing home|community|library|museum|gallery|theatre|cinema|arts?|civic|leisure|sports?|stadium|stand|pool|church|chapel|mosque|synagogue|temple|public realm|square|park|playground|transport|station|terminal|market|regeneration|redevelopment|demolition and redevelopment|extension and refurbishment|conversion)\b/i;
const SMALL_DOMESTIC_RE = /\b(single[- ]storey|two[- ]storey|rear|side|front)\s+extension\b|\b(loft conversion|porch|conservatory|garage conversion|domestic garage|garden room|sunroom|rooflight|replacement windows?|boundary wall|fence|decking|driveway|single dwelling|one dwelling|1 dwelling|dwelling on a farm|improvements to dwelling|alterations to dwelling)\b/i;

function cleanText(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/^`+/, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, limit = 96) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (slug || "planning_record").slice(0, limit).replace(/_+$/g, "");
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
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

function rowObjects(filePath) {
  const text = fs.readFileSync(filePath, "latin1");
  const rows = parseCsv(text);
  const header = rows.shift() || [];
  return rows.map((row, index) => {
    const obj = {};
    header.forEach((name, position) => {
      obj[cleanText(name)] = cleanText(row[position]);
    });
    obj.__rowNumber = index + 2;
    obj.__file = path.relative(ROOT, filePath).replace(/\\/g, "/");
    return obj;
  });
}

function normaliseEastingNorthing(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function niGridToApproxLonLat(easting, northing) {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;
  return [
    -5.93 + (easting - 333000) / 65000,
    54.6 + (northing - 374000) / 111000
  ];
}

function inBelfast(point) {
  if (!point) return false;
  const [lon, lat] = point;
  return lon >= BELFAST_BBOX[0] && lon <= BELFAST_BBOX[2] && lat >= BELFAST_BBOX[1] && lat <= BELFAST_BBOX[3];
}

function parsePlanningDate(value) {
  const raw = cleanText(value);
  if (!raw) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/.test(raw)) {
    const [dayRaw, monthRaw, yearRaw] = raw.split("-");
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
    const month = months[monthRaw.slice(0, 3).toLowerCase()];
    const date = new Date(Date.UTC(year, month, Number(dayRaw)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function field(row, ...names) {
  for (const name of names) {
    if (row[name]) return row[name];
  }
  return "";
}

function appId(row) {
  return cleanText(field(row, "ID", "Id")).replace(/^`+/, "");
}

function isBelfast(row) {
  return field(row, "Authority") === "Belfast" || field(row, "LPA19NM") === "Belfast LPA" || /^LA04\//i.test(appId(row));
}

function unitCount(text) {
  const counts = [];
  const patterns = [
    /\b(\d{1,4})\s*(?:no\.?\s*)?(?:apartments?|flats?|dwellings?|houses?|homes?|units?|residential units?|student bedrooms?|bedspaces?|bed spaces?)\b/gi,
    /\b(?:apartments?|flats?|dwellings?|houses?|homes?|units?|student bedrooms?|bedspaces?|bed spaces?)\s*(?:of|:|-)?\s*(\d{1,4})\b/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) counts.push(Number(match[1]));
  }
  return counts.length ? Math.max(...counts.filter((value) => Number.isFinite(value))) : 0;
}

function categoryFor(row) {
  return field(row, "StatsCategory") || field(row, "AppCategory") || "Planning";
}

function scoreRow(row) {
  const proposal = field(row, "Proposal");
  const category = categoryFor(row);
  const classification = field(row, "Classification", "AppCategory");
  const appType = field(row, "AppType");
  const text = `${proposal} ${field(row, "SiteAddress", "Location")} ${category} ${appType}`;
  const units = unitCount(proposal);
  let score = 0;
  if (/major/i.test(classification)) score += 45;
  if (["Civic", "Mixed Use", "Commercial", "Industrial"].includes(category)) score += 30;
  if (category === "Residential") score += Math.min(35, units / 4);
  if (category === "Change of Use") score += 12;
  if (HIGH_SIGNAL_RE.test(text)) score += 20;
  if (units >= 10) score += Math.min(35, units / 5);
  if (/\b(demolition|redevelopment|new build|erection|construction|extension|conversion|refurbishment|replacement)\b/i.test(text)) score += 8;
  if (/reserved matters|condition|discharge|variation|section 54|section 76/i.test(text)) score -= 8;
  if (SMALL_DOMESTIC_RE.test(text) && units < 10 && !/major/i.test(classification)) score -= 70;
  return score;
}

function includeRow(row) {
  const category = categoryFor(row);
  const classification = field(row, "Classification", "AppCategory");
  const proposal = field(row, "Proposal");
  const text = `${proposal} ${field(row, "SiteAddress", "Location")} ${category}`;
  const units = unitCount(proposal);
  if (/major/i.test(classification)) return true;
  if (["Civic", "Mixed Use", "Commercial", "Industrial"].includes(category)) return !SMALL_DOMESTIC_RE.test(text);
  if (category === "Residential" && (units >= 10 || /\b(apartment|flat|housing development|residential development|student|care home|nursing home|affordable|social housing)\b/i.test(text))) return true;
  if (category === "Change of Use" && HIGH_SIGNAL_RE.test(text) && !SMALL_DOMESTIC_RE.test(text)) return true;
  if (category === "Other" && HIGH_SIGNAL_RE.test(text) && /\b(redevelopment|demolition|new build|erection|construction|conversion|public realm|station|campus|hospital|hotel)\b/i.test(text)) return true;
  return false;
}

function truncate(value, limit) {
  const text = cleanText(value);
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

function titleFor(row) {
  const category = categoryFor(row);
  const location = truncate(field(row, "SiteAddress", "Location") || "Belfast", 80);
  return `${category} planning approval at ${location}`;
}

function projectTypeFor(row) {
  const category = categoryFor(row);
  const proposal = field(row, "Proposal");
  if (/student/i.test(proposal)) return "student accommodation planning approval";
  if (/hotel/i.test(proposal)) return "hotel planning approval";
  if (/office|commercial/i.test(proposal) || category === "Commercial") return "commercial planning approval";
  if (/school|college|university|hospital|clinic|surgery|community|library|leisure|sports|stadium/i.test(proposal) || category === "Civic") return "civic or public-facility planning approval";
  if (/industrial|warehouse|factory|workshop/i.test(proposal) || category === "Industrial") return "industrial or employment planning approval";
  if (/mixed/i.test(proposal) || category === "Mixed Use") return "mixed-use planning approval";
  if (/apartment|flat|dwelling|housing|homes?|residential/i.test(proposal) || category === "Residential") return "housing planning approval";
  return "architecture-related planning approval";
}

function candidateFor(row) {
  const id = appId(row);
  const decisionRaw = field(row, "DecisionIssuedDate") || field(row, "DateValid") || field(row, "DateReceived");
  const decisionDate = parsePlanningDate(decisionRaw);
  const easting = normaliseEastingNorthing(field(row, "Easting"));
  const northing = normaliseEastingNorthing(field(row, "Northing"));
  const point = niGridToApproxLonLat(easting, northing);
  const category = categoryFor(row);
  const proposal = field(row, "Proposal") || "Planning application approved";
  const location = field(row, "SiteAddress", "Location") || "Belfast";
  const units = unitCount(proposal);
  const metrics = [];
  if (units) metrics.push(`${units} source-described residential/student units or spaces`);
  const metricText = metrics.length ? ` Source text includes ${metrics.join("; ")}.` : "";
  const sourceRecordId = `${id}; ${row.__file} row ${row.__rowNumber}`;
  const date = dateString(decisionDate);
  return {
    city_id: "belfast",
    candidate_id: `bfs_planning_statistics_round134_${slugify(id, 48)}_${slugify(location, 48)}_${date.replace(/-/g, "_")}`,
    title: titleFor(row),
    summary: `Department for Infrastructure planning statistics record ${id} lists an approved ${category.toLowerCase()} planning decision for ${truncate(proposal, 180)} at ${truncate(location, 120)}.${metricText}`,
    observed_change: `An official Northern Ireland planning statistics row recorded an approved planning decision for the cited Belfast proposal.`,
    date,
    date_precision: "day",
    bucket: CATEGORY_BUCKET[category] || "planning/development/architecture/official_record",
    area: location,
    latitude: Number(point[1].toFixed(6)),
    longitude: Number(point[0].toFixed(6)),
    source_ids: [SOURCE_ID],
    source_name: "Northern Ireland planning activity statistics",
    publisher: "Department for Infrastructure, Northern Ireland",
    source_url: SOURCE_URL,
    source_record_id: sourceRecordId,
    source_type: "official planning statistics CSV row",
    accessed_at: RETRIEVED_AT,
    source_date_field: `DecisionIssuedDate (${decisionRaw || "not supplied; fallback date used"})`,
    source_dataset_id: SOURCE_ID,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectTypeFor(row),
    geometry_source: "Approximate conversion from source Easting/Northing in Northern Ireland planning statistics CSV.",
    geometry_precision: "approximate source coordinate point for atlas navigation; not a surveyed footprint, red-line boundary, or building outline",
    license_or_terms_note: "Open Government Licence v3.0 where published as public-sector information; verify terms for each annual release.",
    attribution: "Contains public sector information from the Department for Infrastructure, Northern Ireland, licensed under the Open Government Licence v3.0 where applicable.",
    limitations: "The record documents a planning approval/decision in official statistics. It is not evidence of construction start, construction completion, opening, occupation, final built form, public use, outcome effects, or a causal relationship. Coordinates are approximate points converted from source grid references.",
    transformation_method: `scripts/fetch_round134_belfast_planning_statistics_deep_candidates.js parsed ${row.__file} row ${row.__rowNumber}, filtered Belfast approved architecture-related records, converted Easting/Northing to an approximate atlas point, and retained source row references and planning-approval caveats.`,
    raw_context: {
      application_id: id,
      source_file: row.__file,
      source_row_number: row.__rowNumber,
      authority: field(row, "Authority"),
      lpa: field(row, "LPA19NM"),
      app_type: field(row, "AppType"),
      classification: field(row, "Classification", "AppCategory"),
      stats_category: category,
      status_at_31_mar: field(row, "Status@31Mar"),
      decision_or_withdrawal: field(row, "Decision_Withdrawal"),
      decision_issued_date: field(row, "DecisionIssuedDate"),
      date_valid: field(row, "DateValid"),
      unit_count_detected: units || undefined
    }
  };
}

function planningFiles() {
  const preferred = path.join(ROOT, "data", "raw", "planning_statistics");
  const fallback = path.join(ROOT, "planning_statistics");
  const dir = fs.existsSync(preferred) ? preferred : fallback;
  return fs.readdirSync(dir)
    .filter((name) => /\.csv$/i.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

function main() {
  const stats = {
    files_read: [],
    scanned: 0,
    belfast: 0,
    approved: 0,
    in_window: 0,
    with_geometry: 0,
    high_signal: 0,
    emitted: 0,
    rejected: {}
  };
  const candidates = [];

  for (const file of planningFiles()) {
    stats.files_read.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    for (const row of rowObjects(file)) {
      stats.scanned += 1;
      const id = appId(row);
      if (!id) {
        stats.rejected.missing_id = (stats.rejected.missing_id || 0) + 1;
        continue;
      }
      if (!isBelfast(row)) continue;
      stats.belfast += 1;
      const decision = `${field(row, "Decision_Withdrawal")} ${field(row, "Status@31Mar")}`;
      if (!/approved/i.test(decision)) {
        stats.rejected.not_approved = (stats.rejected.not_approved || 0) + 1;
        continue;
      }
      stats.approved += 1;
      const decisionDate = parsePlanningDate(field(row, "DecisionIssuedDate") || field(row, "DateValid") || field(row, "DateReceived"));
      if (!decisionDate || decisionDate < START || decisionDate > END) {
        stats.rejected.outside_window_or_invalid_date = (stats.rejected.outside_window_or_invalid_date || 0) + 1;
        continue;
      }
      stats.in_window += 1;
      const point = niGridToApproxLonLat(normaliseEastingNorthing(field(row, "Easting")), normaliseEastingNorthing(field(row, "Northing")));
      if (!inBelfast(point)) {
        stats.rejected.missing_or_outside_geometry = (stats.rejected.missing_or_outside_geometry || 0) + 1;
        continue;
      }
      stats.with_geometry += 1;
      if (!includeRow(row)) {
        stats.rejected.low_signal = (stats.rejected.low_signal || 0) + 1;
        continue;
      }
      stats.high_signal += 1;
      candidates.push({ row, score: scoreRow(row), date: dateString(decisionDate) });
    }
  }

  const seenApps = new Set();
  const selected = candidates
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date) || appId(a.row).localeCompare(appId(b.row)))
    .filter(({ row }) => {
      const key = appId(row).toUpperCase();
      if (seenApps.has(key)) return false;
      seenApps.add(key);
      return true;
    })
    .slice(0, LIMIT)
    .map(({ row }) => candidateFor(row));

  stats.emitted = selected.length;
  stats.by_category = selected.reduce((acc, candidate) => {
    const category = candidate.raw_context.stats_category || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  stats.by_year = selected.reduce((acc, candidate) => {
    const year = candidate.date.slice(0, 4);
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const sourceAudit = {
    source_audits: [
      {
        source_id: SOURCE_ID,
        source_name: "Northern Ireland planning activity statistics",
        publisher: "Department for Infrastructure, Northern Ireland",
        source_url: SOURCE_URL,
        source_type: "official annual planning statistics CSV releases",
        license_or_terms_note: "Open Government Licence v3.0 where published as public-sector information; verify terms for each annual release.",
        license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        accessed_at: RETRIEVED_AT,
        coverage_years: "Round134 read local 2016-17 through 2024-25 annual planning-statistics CSVs and filtered approved Belfast decision records through 2026-05-19.",
        geographic_scope: "Northern Ireland planning applications; this pack filters Belfast/Belfast LPA rows and checks approximate Belfast coordinate envelope.",
        key_fields_used: ["ID/Id", "DecisionIssuedDate", "Decision_Withdrawal", "Status@31Mar", "StatsCategory", "Classification/AppCategory", "Proposal", "SiteAddress/Location", "Easting", "Northing"],
        reliability_assessment: "strong for administrative planning-statistics rows; usable with caveats for physical city-change interpretation",
        required_caveats: "Approval/decision records are administrative planning milestones. They are not construction starts, completions, openings, occupations, final built-form records, or outcome evidence.",
        ingestion_recommendation: "Use as source-backed planning-decision milestones with source row/file references, approximate point geometry, and visible planning-approval caveats."
      }
    ]
  };

  writeJson(OUT_PATH, {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    task: "Round134 Belfast high-signal architecture-related planning statistics candidates",
    source_audits: sourceAudit.source_audits,
    candidates: selected
  });
  writeJson(AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, stats);
  console.log(JSON.stringify({ out: path.relative(ROOT, OUT_PATH), ...stats }, null, 2));
}

main();
