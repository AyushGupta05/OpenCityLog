const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RETRIEVED_AT = "2026-05-19";
const START_DATE = "2008-01-01";
const END_DATE = RETRIEVED_AT;
const MAX_CANDIDATES = 80;

const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round216_nyc_lpc_designation_tail");
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");
const REJECTED_PATH = path.join(OUT_DIR, "rejected.json");

const NYC_OPEN_DATA_TERMS_URL = "https://opendata.cityofnewyork.us/open-data-law/";
const NYC_OPEN_DATA_FAQ_URL = "https://opendata.cityofnewyork.us/faq/";

const SOURCES = {
  individualLandmarks: {
    source_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
    dataset_id: "buis-pvji",
    source_name: "NYC Open Data: Individual Landmark Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    page_url: "https://data.cityofnewyork.us/d/buis-pvji",
    api_url: "https://data.cityofnewyork.us/resource/buis-pvji.json",
    source_type: "official NYC Open Data Socrata individual-landmark site row"
  },
  designatedCalendared: {
    source_id: "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs",
    dataset_id: "ncre-qhxs",
    source_name: "NYC Open Data: Designated and Calendared Buildings and Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    page_url: "https://data.cityofnewyork.us/d/ncre-qhxs",
    api_url: "https://data.cityofnewyork.us/resource/ncre-qhxs.json",
    source_type: "official NYC Open Data Socrata designated/calendared site row"
  }
};

const PRIOR_PACKS = [
  "tmp/subagents/nyc_arch_candidates_round103_landmarks.json",
  "tmp/subagents/nyc_arch_candidates_round107_lpc_more_designations.json",
  "tmp/subagents/nyc_arch_candidates_round110_lpc.json",
  "tmp/subagents/round115_nyc_lpc_fuller_official/round115_nyc_lpc_fuller_candidates.json",
  "tmp/subagents/round115_nyc_lpc_individual_official/round115_nyc_lpc_individual_candidates.json",
  "tmp/subagents/round120_nyc_lpc_designations_more/candidates.json",
  "tmp/subagents/round122_nyc_lpc_permits_designations/candidates.json",
  "tmp/subagents/round138_nyc_lpc_individual_landmark_gaps/candidates.json",
  "tmp/subagents/round142_nyc_lpc_designation_gaps/candidates.json"
].map((relativePath) => path.join(ROOT, relativePath));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Bims-5 round216 NYC LPC designation tail fetcher" }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fetch failed for ${url}: ${response.status} ${response.statusText} ${body.slice(0, 500)}`);
  }
  return response.json();
}

function cleanText(value, limit) {
  const text = String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!limit || text.length <= limit) return text;
  return `${text.slice(0, limit - 3).trim()}...`;
}

function slugify(value, limit = 80) {
  const slug = cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
  return (slug || "lpc_designation").slice(0, limit).replace(/_+$/g, "");
}

function dateOnly(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function dateDiffDays(a, b) {
  const da = new Date(`${a}T00:00:00Z`);
  const db = new Date(`${b}T00:00:00Z`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return Infinity;
  return Math.abs((da.getTime() - db.getTime()) / 86400000);
}

function normalizeLpFull(value) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/LP[-_\s]?0*(\d{3,5})([A-Z])?/);
  if (!match) return "";
  return `LP-${match[1].padStart(5, "0")}${match[2] || ""}`;
}

function normalizeLpBase(value) {
  const full = normalizeLpFull(value);
  const match = full.match(/^(LP-\d{5})/);
  return match ? match[1] : "";
}

function lpToken(value) {
  return normalizeLpFull(value).replace(/[^A-Z0-9]/g, "").toLowerCase() || slugify(value);
}

function boroughName(value) {
  const code = String(value || "").trim().toUpperCase();
  return {
    BK: "Brooklyn",
    BX: "Bronx",
    MN: "Manhattan",
    QN: "Queens",
    SI: "Staten Island"
  }[code] || cleanText(value) || "New York City";
}

function eachCoordinate(geometry, visit) {
  if (!geometry) return;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
    visit(geometry.coordinates);
    return;
  }
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      visit(node);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry.coordinates);
}

function coordsForGeometry(geometry) {
  const coords = [];
  eachCoordinate(geometry, (coordinate) => {
    const lon = Number(coordinate[0]);
    const lat = Number(coordinate[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) coords.push([lon, lat]);
  });
  return coords;
}

function pointForRows(rows) {
  const coords = [];
  for (const row of rows) coords.push(...coordsForGeometry(row.the_geom));
  if (!coords.length) return null;
  const sums = coords.reduce((acc, [lon, lat]) => {
    acc.lon += lon;
    acc.lat += lat;
    return acc;
  }, { lon: 0, lat: 0 });
  return {
    lon: Number((sums.lon / coords.length).toFixed(7)),
    lat: Number((sums.lat / coords.length).toFixed(7))
  };
}

function cityEnvelopeCheck(point) {
  return point &&
    point.lon >= -74.2591 &&
    point.lon <= -73.7004 &&
    point.lat >= 40.4774 &&
    point.lat <= 40.9176;
}

function scanLpNumbers(value, callback) {
  const text = String(value || "");
  const regex = /LP[-_\s]?0*(\d{3,5})([A-Z])?/gi;
  let match = regex.exec(text);
  while (match) {
    callback(`LP-${match[1].padStart(5, "0")}${(match[2] || "").toUpperCase()}`);
    match = regex.exec(text);
  }
}

function normalizeName(value) {
  return slugify(value, 120)
    .replace(/\bformer\b/g, "")
    .replace(/\bnow\b/g, "")
    .replace(/\bamendment\b/g, "")
    .replace(/\bto\b/g, "")
    .replace(/\blandmark\b/g, "")
    .replace(/\bsite\b/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function rowsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  return payload.candidates || payload.events || [];
}

function collectPackRecords(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return rowsFromPayload(readJson(file));
  } catch (error) {
    return [{ read_error: error.message, source_file: file }];
  }
}

function collectExisting(corpus) {
  const existing = {
    fullLps: new Set(),
    baseLps: new Set(),
    sourceRecords: new Set(),
    sourceUrls: new Set(),
    titleDates: new Set(),
    nameDateKeys: new Set(),
    siteNearDateKeys: [],
    packPathsRead: PRIOR_PACKS.filter((file) => fs.existsSync(file)).map((file) => path.relative(ROOT, file)),
    missingPackPaths: PRIOR_PACKS.filter((file) => !fs.existsSync(file)).map((file) => path.relative(ROOT, file))
  };

  const addRecord = (record, origin) => {
    const text = JSON.stringify(record);
    scanLpNumbers(text, (lp) => {
      existing.fullLps.add(lp);
      existing.baseLps.add(normalizeLpBase(lp));
    });
    const sourceRecord = cleanText(record.source_record_id || record.raw_context?.lp_number || record.raw_context?.raw_lp_number).toUpperCase();
    if (sourceRecord) {
      existing.sourceRecords.add(sourceRecord);
      const lp = normalizeLpFull(sourceRecord);
      if (lp) {
        existing.fullLps.add(lp);
        existing.baseLps.add(normalizeLpBase(lp));
      }
    }
    const sourceUrl = cleanText(record.source_url || record.raw_context?.source_url).toLowerCase();
    if (sourceUrl) existing.sourceUrls.add(sourceUrl);
    const date = dateOnly(record.date || record.effective_date || record.designation_date);
    const title = cleanText(record.title);
    if (title && date) existing.titleDates.add(`${title.toLowerCase()}|${date}`);
    const name = normalizeName(record.raw_context?.official_name || record.raw_context?.lpc_name || record.raw_context?.lm_name || title);
    const baseLps = new Set();
    scanLpNumbers(text, (lp) => baseLps.add(normalizeLpBase(lp)));
    for (const baseLp of baseLps) {
      if (baseLp && name && date) existing.siteNearDateKeys.push({ baseLp, name, date, origin });
    }
  };

  for (const event of corpus.events || []) {
    if (event.city_id === "nyc" && /lpc|landmark|designation|preservation/i.test(JSON.stringify(event))) {
      addRecord(event, "manual corpus");
    }
  }
  for (const file of PRIOR_PACKS) {
    for (const record of collectPackRecords(file)) addRecord(record, path.relative(ROOT, file));
  }
  return existing;
}

function groupBy(rows, keyFn) {
  const grouped = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
}

function articleFor(value) {
  return /^[aeiou]/i.test(cleanText(value)) ? "an" : "a";
}

function ncreSourceUrl(lpNumber) {
  return `${SOURCES.designatedCalendared.api_url}?lp_number=${encodeURIComponent(lpNumber)}`;
}

function buisSourceUrl(lpNumber) {
  return `${SOURCES.individualLandmarks.api_url}?lpc_lpnumb=${encodeURIComponent(lpNumber)}`;
}

function lpcReportUrl(lpNumber) {
  const full = normalizeLpFull(lpNumber);
  const match = full.match(/^LP-(\d{5})([A-Z])?$/);
  if (!match) return null;
  return `https://s-media.nyc.gov/agencies/lpc/lp/${match[1].slice(1)}${match[2] || ""}.pdf`;
}

function commonFields({ source, lpNumber, date, type, name, point, sourceUrl, sourceDateField }) {
  const year = date.slice(0, 4);
  const typeSlug = slugify(type, 48);
  return {
    city_id: "nyc",
    candidate_id: `nyc_lpc_designation_tail_round216_${typeSlug}_${lpToken(lpNumber)}_${year}`,
    event_id: `nyc_lpc_designation_tail_round216_${typeSlug}_${lpToken(lpNumber)}_${year}`,
    date,
    effective_date: date,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_status",
    category: "planning/development/architecture/historic_preservation",
    subcategory: cleanText(type).toLowerCase(),
    latitude: point.lat,
    longitude: point.lon,
    geometry: {
      type: "Point",
      coordinates: [point.lon, point.lat]
    },
    source_id: source.source_id,
    source_ids: [source.source_id],
    source_name: source.source_name,
    publisher: source.publisher,
    source_url: sourceUrl,
    source_record_id: lpNumber,
    source_type: source.source_type,
    source_date_field: sourceDateField,
    source_dataset_id: source.source_id,
    source_dataset_four_by_four: source.dataset_id,
    accessed_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    license: "NYC Open Data / NYC.gov terms; dataset metadata license field may be null.",
    license_url: NYC_OPEN_DATA_TERMS_URL,
    license_or_terms_note: "NYC Open Data / NYC.gov terms apply. Attribute NYC Landmarks Preservation Commission and NYC Open Data; re-check dataset metadata and terms before redistribution.",
    attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
    limitations: "This LPC record documents administrative legal/protective preservation status only. It does not document construction start, completion, restoration, permit compliance, opening, occupancy, current physical condition, owner action, preservation outcome, or causal effect.",
    raw_context: {
      lp_number: lpNumber,
      official_name: name,
      landmark_type: type
    }
  };
}

function candidateForNcreGroup(lpNumber, rows) {
  const sortedRows = rows.slice().sort((a, b) => cleanText(a[":id"]).localeCompare(cleanText(b[":id"])));
  const row = sortedRows[0];
  const date = dateOnly(row.desdate);
  const name = cleanText(row.lm_name);
  const type = cleanText(row.lm_type || "LPC designation amendment");
  const point = pointForRows(sortedRows);
  if (!lpNumber || !date || !name || !cityEnvelopeCheck(point)) return null;
  const boroughs = [...new Set(sortedRows.map((candidateRow) => boroughName(candidateRow.boroughid)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const boroughLabel = boroughs.length ? boroughs.join(", ") : "New York City";
  const addresses = [...new Set(sortedRows
    .map((candidateRow) => cleanText(candidateRow.desig_addr || candidateRow.pluto_addr))
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const addressLabel = addresses.length <= 4
    ? addresses.join("; ")
    : `${addresses.slice(0, 4).join("; ")}; and ${addresses.length - 4} other source row addresses`;
  const source = SOURCES.designatedCalendared;
  const title = `${name} LPC amendment/modification was accepted`;
  const sourceUrl = ncreSourceUrl(lpNumber);
  const reportUrl = lpcReportUrl(lpNumber);

  return {
    ...commonFields({
      source,
      lpNumber,
      date,
      type: `${type} designation amendment/modification`,
      name,
      point,
      sourceUrl,
      sourceDateField: "DESDATE (LPC designation/amendment date); LAST_ACTIO=DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED)"
    }),
    title,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber}) in ${boroughLabel} as ${articleFor(type)} ${type.toLowerCase()} with LAST_ACTIO "DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED)" on ${date}${addressLabel ? `; source address context includes ${addressLabel}` : ""}.`,
    observed_change: "The official LPC row documents an administrative designation amendment/modification acceptance, a legal/protective preservation-status milestone for the named site.",
    official_report_url: reportUrl,
    supporting_source_urls: [sourceUrl, reportUrl].filter(Boolean),
    area: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    location_name: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    project_type: `administrative heritage status - LPC ${type.toLowerCase()} designation amendment/modification`,
    geometry_ref: {
      dataset_id: source.dataset_id,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      lp_number: lpNumber,
      source_url: sourceUrl,
      official_report_url: reportUrl,
      geometry_type: "Point row aggregate"
    },
    geometry_source: `Official LPC Designated and Calendared Buildings and Sites point geometry for ${lpNumber}; atlas point is the mean of ${sortedRows.length} source row coordinate set(s).`,
    geometry_precision: /interior/i.test(type)
      ? "official host-building/site point aggregate; interior extent is not mapped as a separate boundary"
      : "official row point or aggregate point from LPC designated/calendared site rows; not a surveyed legal boundary",
    transformation_method: "scripts/fetch_round216_nyc_lpc_designation_tail_candidates.js fetched official ncre-qhxs rows with LAST_ACTIO=DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED) and DESDATE from 2008-01-01 through 2026-05-19, grouped rows by full LP number including suffixes, screened against the manual corpus and prior LPC designation packs, and retained only unique administrative amendment/designation milestones.",
    raw_context: {
      lp_number: lpNumber,
      base_lp_number: normalizeLpBase(lpNumber),
      official_name: name,
      landmark_type: type,
      official_report_url: reportUrl,
      status_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.status)).filter(Boolean))],
      last_action_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.last_actio)).filter(Boolean))],
      caldate_values: [...new Set(sortedRows.map((candidateRow) => dateOnly(candidateRow.caldate)).filter(Boolean))],
      desdate_values: [...new Set(sortedRows.map((candidateRow) => dateOnly(candidateRow.desdate)).filter(Boolean))],
      boroughs,
      addresses,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      sample_rows: sortedRows.slice(0, 12).map((candidateRow) => ({
        socrata_row_id: candidateRow[":id"] || null,
        bin_number: cleanText(candidateRow.bin_number),
        bbl: cleanText(candidateRow.bbl),
        boroughid: cleanText(candidateRow.boroughid),
        block: cleanText(candidateRow.block),
        lot: cleanText(candidateRow.lot),
        desig_addr: cleanText(candidateRow.desig_addr),
        pluto_addr: cleanText(candidateRow.pluto_addr)
      }))
    }
  };
}

function candidateForBuisGroup(lpNumber, rows, statusLabel) {
  const sortedRows = rows.slice().sort((a, b) => {
    const objectCompare = Number(a.objectid || 0) - Number(b.objectid || 0);
    if (objectCompare !== 0) return objectCompare;
    return cleanText(a[":id"]).localeCompare(cleanText(b[":id"]));
  });
  const row = sortedRows[0];
  const date = dateOnly(row.desdate);
  const name = cleanText(row.lpc_name || row.lpc_altern);
  const point = pointForRows(sortedRows);
  if (!lpNumber || !date || !name || !cityEnvelopeCheck(point)) return null;
  const source = SOURCES.individualLandmarks;
  const boroughs = [...new Set(sortedRows.map((candidateRow) => boroughName(candidateRow.borough)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const boroughLabel = boroughs.length ? boroughs.join(", ") : "New York City";
  const addresses = [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.address || candidateRow.lpc_sitede)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const addressLabel = addresses.length <= 4
    ? addresses.join("; ")
    : `${addresses.slice(0, 4).join("; ")}; and ${addresses.length - 4} other source row addresses`;
  const sourceUrl = buisSourceUrl(lpNumber);
  const reportUrl = lpcReportUrl(lpNumber);
  const isAmended = /amended/i.test(statusLabel);
  const statusPhrase = isAmended ? "amended individual-landmark site status" : "individual-landmark designation";
  const title = isAmended
    ? `${name} LPC amended individual-landmark status was recorded`
    : `${name} was designated an individual landmark`;

  return {
    ...commonFields({
      source,
      lpNumber,
      date,
      type: isAmended ? "individual landmark amended site status" : "individual landmark designation",
      name,
      point,
      sourceUrl,
      sourceDateField: isAmended
        ? "DesDate (LPC source date) with LPC_SiteSt=Amended"
        : "DesDate (LPC designation date) with LPC_SiteSt=Designated"
    }),
    title,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber})${addressLabel ? ` at ${addressLabel}` : ""}, ${boroughLabel}, with ${statusPhrase} dated ${date}.`,
    observed_change: `The official LPC Individual Landmark Sites row documents ${statusPhrase}, a legal/protective preservation-status milestone for the named site.`,
    official_report_url: reportUrl,
    supporting_source_urls: [sourceUrl, reportUrl].filter(Boolean),
    area: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    location_name: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    project_type: `administrative heritage status - LPC ${statusPhrase}`,
    geometry_ref: {
      dataset_id: source.dataset_id,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      objectids: sortedRows.map((candidateRow) => cleanText(candidateRow.objectid)).filter(Boolean),
      lp_number: lpNumber,
      source_url: sourceUrl,
      official_report_url: reportUrl,
      geometry_type: sortedRows.length === 1 ? sortedRows[0].the_geom?.type || null : "Multi-row polygon aggregate"
    },
    geometry_source: `Official LPC Individual Landmark Sites geometry for ${lpNumber}; atlas point is the mean of source polygon coordinate sets across ${sortedRows.length} row(s).`,
    geometry_precision: "centroid derived from official source site polygon coordinates for atlas navigation; use the official source geometry for legal/site extent",
    transformation_method: `scripts/fetch_round216_nyc_lpc_designation_tail_candidates.js fetched official buis-pvji individual-landmark rows with LPC_SiteSt=${statusLabel} and DesDate from 2008-01-01 through 2026-05-19, grouped rows by full LP number, screened against the manual corpus and prior LPC designation packs, and retained only unique administrative designation/status milestones.`,
    raw_context: {
      lp_number: lpNumber,
      base_lp_number: normalizeLpBase(lpNumber),
      official_name: name,
      landmark_type: "Individual Landmark",
      official_report_url: reportUrl,
      lpc_sitest_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.lpc_sitest)).filter(Boolean))],
      desdate_values: [...new Set(sortedRows.map((candidateRow) => dateOnly(candidateRow.desdate)).filter(Boolean))],
      boroughs,
      addresses,
      url_reports: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.url_report)).filter(Boolean))],
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      objectids: sortedRows.map((candidateRow) => cleanText(candidateRow.objectid)).filter(Boolean),
      sample_rows: sortedRows.slice(0, 12).map((candidateRow) => ({
        socrata_row_id: candidateRow[":id"] || null,
        objectid: cleanText(candidateRow.objectid),
        borough: cleanText(candidateRow.borough),
        block: cleanText(candidateRow.block),
        lot: cleanText(candidateRow.lot),
        bbl: cleanText(candidateRow.bbl),
        address: cleanText(candidateRow.address),
        lpc_sitede: cleanText(candidateRow.lpc_sitede, 240),
        url_report: cleanText(candidateRow.url_report)
      }))
    }
  };
}

function rejectFactory() {
  const rejected = {};
  const rejectedExamples = [];
  const rejectedRows = [];
  return {
    add(reason, context) {
      rejected[reason] = (rejected[reason] || 0) + 1;
      const row = { reason, ...context };
      if (rejectedExamples.length < 80) rejectedExamples.push(row);
      if (rejectedRows.length < 500) rejectedRows.push(row);
    },
    summary() {
      return { rejected, rejected_examples: rejectedExamples, rejected_rows_sample: rejectedRows };
    }
  };
}

function candidateDuplicateReason(candidate, existing, acceptedKeys) {
  const lpFull = normalizeLpFull(candidate.source_record_id);
  const lpBase = normalizeLpBase(candidate.source_record_id);
  const titleDate = `${cleanText(candidate.title).toLowerCase()}|${candidate.date}`;
  const sourceUrl = cleanText(candidate.source_url).toLowerCase();
  const name = normalizeName(candidate.raw_context?.official_name || candidate.title);
  const key = `${candidate.source_dataset_id}|${candidate.source_record_id}|${candidate.source_date_field}|${candidate.date}`;

  if (acceptedKeys.has(key)) return "duplicate source/date key within round216 candidate set";
  if (existing.sourceRecords.has(cleanText(candidate.source_record_id).toUpperCase())) return "exact source_record_id already present in corpus or prior LPC designation pack";
  if (sourceUrl && existing.sourceUrls.has(sourceUrl)) return "exact source_url already present in corpus or prior LPC designation pack";
  if (lpFull && existing.fullLps.has(lpFull) && !/[A-Z]$/.test(lpFull)) return "base LP number already present in corpus or prior LPC designation pack";
  if (existing.titleDates.has(titleDate)) return "same title/date already present in corpus or prior LPC designation pack";

  for (const existingSite of existing.siteNearDateKeys) {
    if (existingSite.baseLp !== lpBase) continue;
    if (!existingSite.name || !name) continue;
    if (existingSite.name === name || existingSite.name.includes(name) || name.includes(existingSite.name)) {
      if (dateDiffDays(existingSite.date, candidate.date) <= 35) {
        return `same LPC base LP/name already represented near this source date (${existingSite.origin})`;
      }
    }
  }
  return "";
}

function validateCandidate(candidate) {
  const required = [
    "candidate_id",
    "event_id",
    "city_id",
    "date",
    "title",
    "summary",
    "source_name",
    "publisher",
    "source_url",
    "source_type",
    "source_date_field",
    "source_dataset_id",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method"
  ];
  const missing = required.filter((field) => !candidate[field]);
  if (!candidate.geometry || !Array.isArray(candidate.geometry.coordinates)) missing.push("geometry");
  if (!cityEnvelopeCheck({ lon: candidate.longitude, lat: candidate.latitude })) missing.push("nyc coordinate envelope");
  return missing;
}

function dateRange(candidates) {
  if (!candidates.length) return { min: null, max: null };
  return candidates.reduce((acc, candidate) => ({
    min: !acc.min || candidate.date < acc.min ? candidate.date : acc.min,
    max: !acc.max || candidate.date > acc.max ? candidate.date : acc.max
  }), { min: null, max: null });
}

function countBy(candidates, keyFn) {
  return candidates.reduce((acc, candidate) => {
    const key = keyFn(candidate) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  const corpus = readJson(CORPUS_PATH);
  const existing = collectExisting(corpus);
  const reject = rejectFactory();
  const acceptedKeys = new Set();
  const candidates = [];

  const metadataEntries = await Promise.all(Object.values(SOURCES).map(async (source) => {
    const metadata = await fetchJson(`https://data.cityofnewyork.us/api/views/${source.dataset_id}`);
    return [source.dataset_id, metadata];
  }));
  const metadataByDataset = Object.fromEntries(metadataEntries);

  const ncreAmendmentParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND status='DESIGNATED' AND last_actio='DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED)'`,
    "$order": "desdate,lp_number",
    "$limit": "50000"
  });
  const buisDesignatedParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND landmarkty='Individual Landmark' AND lpc_sitest='Designated'`,
    "$order": "desdate,lpc_lpnumb,objectid",
    "$limit": "50000"
  });
  const buisAmendedParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND landmarkty='Individual Landmark' AND lpc_sitest='Amended'`,
    "$order": "desdate,lpc_lpnumb,objectid",
    "$limit": "50000"
  });
  const ncreIndividualParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND status='DESIGNATED' AND last_actio='DESIGNATED' AND lm_type='Individual Landmark'`,
    "$order": "desdate,lp_number",
    "$limit": "50000"
  });
  const ncreCalendarParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `caldate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND status='CALENDARED'`,
    "$order": "caldate,lp_number",
    "$limit": "50000"
  });

  const [
    ncreAmendmentRows,
    buisDesignatedRows,
    buisAmendedRows,
    ncreIndividualRows,
    ncreCalendaredRows
  ] = await Promise.all([
    fetchJson(`${SOURCES.designatedCalendared.api_url}?${ncreAmendmentParams}`),
    fetchJson(`${SOURCES.individualLandmarks.api_url}?${buisDesignatedParams}`),
    fetchJson(`${SOURCES.individualLandmarks.api_url}?${buisAmendedParams}`),
    fetchJson(`${SOURCES.designatedCalendared.api_url}?${ncreIndividualParams}`),
    fetchJson(`${SOURCES.designatedCalendared.api_url}?${ncreCalendarParams}`)
  ]);

  const pools = [
    {
      name: "ncre amendment/modification accepted",
      rows: ncreAmendmentRows,
      groups: groupBy(ncreAmendmentRows, (row) => normalizeLpFull(row.lp_number)),
      toCandidate: (lp, rows) => candidateForNcreGroup(lp, rows)
    },
    {
      name: "buis amended individual-landmark site status",
      rows: buisAmendedRows,
      groups: groupBy(buisAmendedRows, (row) => normalizeLpFull(row.lpc_lpnumb)),
      toCandidate: (lp, rows) => candidateForBuisGroup(lp, rows, "Amended")
    },
    {
      name: "buis designated individual landmark tail",
      rows: buisDesignatedRows,
      groups: groupBy(buisDesignatedRows, (row) => normalizeLpFull(row.lpc_lpnumb)),
      toCandidate: (lp, rows) => candidateForBuisGroup(lp, rows, "Designated")
    },
    {
      name: "ncre designated individual landmark tail",
      rows: ncreIndividualRows,
      groups: groupBy(ncreIndividualRows, (row) => normalizeLpFull(row.lp_number)),
      toCandidate: (lp, rows) => {
        const candidate = candidateForNcreGroup(lp, rows);
        if (!candidate) return null;
        candidate.title = candidate.title.replace("LPC amendment/modification was accepted", "was designated an individual landmark");
        candidate.subcategory = "individual landmark designation";
        candidate.project_type = "administrative heritage status - LPC individual landmark designation";
        candidate.source_date_field = "DESDATE (LPC designation date); STATUS=DESIGNATED; LAST_ACTIO=DESIGNATED";
        candidate.observed_change = "The official LPC row documents an individual-landmark designation, a legal/protective preservation-status milestone for the named site.";
        candidate.transformation_method = "scripts/fetch_round216_nyc_lpc_designation_tail_candidates.js fetched official ncre-qhxs individual landmark rows with STATUS=DESIGNATED, LAST_ACTIO=DESIGNATED, and DESDATE from 2008-01-01 through 2026-05-19, grouped rows by full LP number, screened against the manual corpus and prior LPC designation packs, and retained only unique administrative designation milestones.";
        return candidate;
      }
    }
  ];

  for (const pool of pools) {
    for (const [lpNumber, rows] of pool.groups) {
      const candidate = pool.toCandidate(lpNumber, rows);
      if (!candidate) {
        reject.add("invalid candidate missing required fields or geometry", {
          pool: pool.name,
          lp_number: lpNumber,
          row_count: rows.length
        });
        continue;
      }
      const missing = validateCandidate(candidate);
      if (missing.length) {
        reject.add("candidate failed required provenance/geometry validation", {
          pool: pool.name,
          lp_number: lpNumber,
          title: candidate.title,
          missing
        });
        continue;
      }
      const duplicateReason = candidateDuplicateReason(candidate, existing, acceptedKeys);
      if (duplicateReason) {
        reject.add(duplicateReason, {
          pool: pool.name,
          lp_number: lpNumber,
          base_lp_number: normalizeLpBase(lpNumber),
          title: candidate.title,
          date: candidate.date,
          source_record_id: candidate.source_record_id
        });
        continue;
      }
      const key = `${candidate.source_dataset_id}|${candidate.source_record_id}|${candidate.source_date_field}|${candidate.date}`;
      acceptedKeys.add(key);
      candidates.push(candidate);
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  for (const row of ncreCalendaredRows) {
    reject.add("calendar/proposed row audited but not emitted as final designation or amendment", {
      pool: "ncre calendared audit only",
      lp_number: normalizeLpFull(row.lp_number),
      title: cleanText(row.lm_name),
      caldate: dateOnly(row.caldate),
      status: cleanText(row.status),
      last_actio: cleanText(row.last_actio)
    });
  }

  candidates.sort((a, b) => (
    a.date.localeCompare(b.date) ||
    cleanText(a.raw_context.landmark_type).localeCompare(cleanText(b.raw_context.landmark_type)) ||
    a.source_record_id.localeCompare(b.source_record_id)
  ));

  const range = dateRange(candidates);
  const rejectedSummary = reject.summary();
  const eligibleGroupsReviewed = pools.reduce((acc, pool) => acc + pool.groups.size, 0);
  const sourceAudit = {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    source_audits: Object.values(SOURCES).map((source) => {
      const metadata = metadataByDataset[source.dataset_id] || {};
      const rowsReviewed = source.dataset_id === "buis-pvji"
        ? buisDesignatedRows.length + buisAmendedRows.length
        : ncreAmendmentRows.length + ncreIndividualRows.length + ncreCalendaredRows.length;
      return {
        source_id: source.source_id,
        dataset_id: source.dataset_id,
        source_name: source.source_name,
        publisher: source.publisher,
        source_url: source.page_url,
        api_url: source.api_url,
        source_type: "official NYC Open Data Socrata dataset",
        attribution: metadata.attribution || "Landmarks Preservation Commission (LPC)",
        license: metadata.license || null,
        license_id: metadata.licenseId || null,
        license_or_terms_note: "Dataset metadata may not declare a standalone license. NYC Open Data / NYC.gov terms apply; attribute LPC and NYC Open Data and re-check current metadata before redistribution.",
        license_url: NYC_OPEN_DATA_TERMS_URL,
        terms_url: NYC_OPEN_DATA_FAQ_URL,
        accessed_at: RETRIEVED_AT,
        coverage_years_reviewed: `${START_DATE} through ${END_DATE}`,
        update_frequency: metadata.metadata?.custom_fields?.Update?.["Update Frequency"] || null,
        date_made_public: metadata.metadata?.custom_fields?.Update?.["Date Made Public"] || null,
        rows_reviewed: rowsReviewed,
        candidate_count: candidates.filter((candidate) => candidate.source_dataset_four_by_four === source.dataset_id).length,
        key_fields_used: source.dataset_id === "buis-pvji"
          ? ["objectid", "borough", "address", "lpc_name", "lpc_lpnumb", "lpc_sitest", "desdate", "landmarkty", "url_report", "the_geom", ":id"]
          : ["lp_number", "lm_name", "lm_type", "status", "last_actio", "desdate", "caldate", "boroughid", "desig_addr", "pluto_addr", "bbl", "bin_number", "the_geom", ":id"],
        geographic_scope: source.dataset_id === "buis-pvji"
          ? "New York City individual landmark site polygons from LPC Open Data."
          : "New York City designated/calendared LPC building and site point rows.",
        granularity: source.dataset_id === "buis-pvji"
          ? "Site polygon/multipolygon rows for individual landmarks."
          : "Point rows that may include multiple property/building rows for a single LP number.",
        reliability_assessment: "strong for documented LPC administrative preservation status when DESDATE, status/action fields, LP number, and geometry are present",
        required_caveats: [
          "Designation/amendment dates are administrative legal/protective preservation-status dates, not construction or completion dates.",
          "Coordinates are source geometry-derived navigation points or row points; they are not surveyed work footprints or proof of physical change.",
          "Rows can be updated or corrected by the source after retrieval."
        ],
        ingestion_recommendation: "Append only unique designation/amendment records after duplicate screening against the manual corpus and prior LPC designation packs."
      };
    })
  };

  const summary = {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    task: "Round216 NYC LPC individual landmark/designation tail from official Open Data",
    start_date: START_DATE,
    end_date: END_DATE,
    candidate_count: candidates.length,
    candidate_date_range: range,
    target_candidate_cap: MAX_CANDIDATES,
    record_type_mix: countBy(candidates, (candidate) => candidate.subcategory || candidate.raw_context?.landmark_type),
    by_source_dataset: countBy(candidates, (candidate) => candidate.source_dataset_four_by_four),
    by_year: countBy(candidates, (candidate) => candidate.date.slice(0, 4)),
    rows_reviewed: {
      "ncre-qhxs amendment/modification accepted rows": ncreAmendmentRows.length,
      "buis-pvji amended individual landmark rows": buisAmendedRows.length,
      "buis-pvji designated individual landmark rows": buisDesignatedRows.length,
      "ncre-qhxs designated individual landmark rows": ncreIndividualRows.length,
      "ncre-qhxs calendared audit-only rows": ncreCalendaredRows.length
    },
    groups_reviewed: Object.fromEntries(pools.map((pool) => [pool.name, pool.groups.size])),
    eligible_groups_reviewed: eligibleGroupsReviewed,
    remaining_high_signal_headroom_after_dedupe: candidates.length >= MAX_CANDIDATES
      ? "unknown_after_cap"
      : 0,
    duplicate_screen: {
      manual_corpus_events: (corpus.events || []).length,
      prior_pack_paths_read: existing.packPathsRead,
      missing_prior_pack_paths: existing.missingPackPaths,
      existing_full_lp_tokens_seen: existing.fullLps.size,
      existing_base_lp_tokens_seen: existing.baseLps.size,
      exact_source_records_seen: existing.sourceRecords.size,
      source_urls_seen: existing.sourceUrls.size
    },
    rejected: rejectedSummary.rejected,
    caveat: "Round216 emits only unique official LPC designation/amendment records. Designation and amendment dates are administrative preservation-status dates, not evidence of construction, completion, opening, condition, owner action, or causation."
  };

  writeJson(CANDIDATES_PATH, {
    generated_at: summary.generated_at,
    task: summary.task,
    sources: sourceAudit.source_audits.map((audit) => ({
      source_id: audit.source_id,
      dataset_id: audit.dataset_id,
      source_name: audit.source_name,
      source_url: audit.source_url,
      api_url: audit.api_url,
      publisher: audit.publisher,
      license_or_terms_note: audit.license_or_terms_note,
      accessed_at: audit.accessed_at
    })),
    caveat: summary.caveat,
    candidates
  });
  writeJson(SOURCE_AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, summary);
  writeJson(REJECTED_PATH, {
    generated_at: summary.generated_at,
    rejected_summary: rejectedSummary.rejected,
    rejected_examples: rejectedSummary.rejected_examples,
    rejected_rows_sample: rejectedSummary.rejected_rows_sample
  });
  writeText(NOTES_PATH, [
    "# Round216 NYC LPC designation tail",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "Scope: official NYC LPC Open Data designation/amendment rows from 2008-01-01 through 2026-05-19, excluding dpm2-m9mq permit rows.",
    "",
    "Sources reviewed:",
    "",
    "- Individual Landmark Sites (`buis-pvji`) for `LPC_SiteSt=Designated` and `LPC_SiteSt=Amended` individual-landmark rows.",
    "- Designated and Calendared Buildings and Sites (`ncre-qhxs`) for `LAST_ACTIO=DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED)` and individual-landmark designation tail checks.",
    "- `ncre-qhxs` calendared rows were audited but not emitted because they are not final designation/amendment records.",
    "",
    "Duplicate screening:",
    "",
    "- Screened against the live manual architecture corpus.",
    "- Screened against prior LPC designation packs: round103, round107, round110, round115, round120, round122, round138, and round142.",
    "- Full LP numbers with amendment suffixes were preserved, but same base-LP/name near-date matches were rejected to avoid double-counting one LPC action.",
    "",
    "Counts:",
    "",
    `- Candidates: ${summary.candidate_count}`,
    `- Date range: ${range.min || "none"} to ${range.max || "none"}`,
    `- Rows reviewed: ${Object.values(summary.rows_reviewed).reduce((acc, value) => acc + value, 0)}`,
    `- Eligible LP groups reviewed: ${eligibleGroupsReviewed}`,
    `- Remaining high-signal headroom after dedupe: ${summary.remaining_high_signal_headroom_after_dedupe}`,
    "",
    "Caveat: these records document LPC administrative legal/protective status only. They do not document construction starts, completions, restorations, openings, occupancy, condition, preservation outcomes, or causal impacts."
  ].join("\n"));

  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR),
    candidate_count: candidates.length,
    candidate_date_range: summary.candidate_date_range,
    record_type_mix: summary.record_type_mix,
    rows_reviewed: summary.rows_reviewed,
    groups_reviewed: summary.groups_reviewed,
    remaining_high_signal_headroom_after_dedupe: summary.remaining_high_signal_headroom_after_dedupe,
    rejected: summary.rejected
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
