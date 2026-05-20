const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RETRIEVED_AT = "2026-05-19";
const START_DATE = "2008-01-01";
const END_DATE = RETRIEVED_AT;
const CORPUS_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json"
);
const OUT_DIR = path.join(ROOT, "tmp", "subagents", "round142_nyc_lpc_designation_gaps");
const CANDIDATES_PATH = path.join(OUT_DIR, "candidates.json");
const SOURCE_AUDIT_PATH = path.join(OUT_DIR, "source_audit.json");
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const NOTES_PATH = path.join(OUT_DIR, "notes.md");

const NYC_OPEN_DATA_TERMS_URL = "https://opendata.cityofnewyork.us/open-data-law/";
const NYC_OPEN_DATA_FAQ_URL = "https://opendata.cityofnewyork.us/faq/";

const SOURCES = {
  historicDistricts: {
    source_id: "nyc-lpc-historic-districts-skyk-mpzq",
    dataset_id: "skyk-mpzq",
    source_name: "NYC Open Data: Historic Districts",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    page_url: "https://data.cityofnewyork.us/d/skyk-mpzq",
    api_url: "https://data.cityofnewyork.us/resource/skyk-mpzq.json",
    source_type: "official NYC Open Data Socrata historic-district polygon row"
  },
  designatedCalendared: {
    source_id: "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs",
    dataset_id: "ncre-qhxs",
    source_name: "NYC Open Data: Designated and Calendared Buildings and Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    page_url: "https://data.cityofnewyork.us/d/ncre-qhxs",
    api_url: "https://data.cityofnewyork.us/resource/ncre-qhxs.json",
    source_type: "official NYC Open Data Socrata designated/calendared site row"
  },
  individualLandmarks: {
    source_id: "nyc-lpc-individual-landmark-sites-buis-pvji",
    dataset_id: "buis-pvji",
    source_name: "NYC Open Data: Individual Landmark Sites",
    publisher: "NYC Landmarks Preservation Commission / NYC Open Data",
    page_url: "https://data.cityofnewyork.us/d/buis-pvji",
    api_url: "https://data.cityofnewyork.us/resource/buis-pvji.json",
    source_type: "official NYC Open Data Socrata individual-landmark site row"
  }
};

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
  const response = await fetch(url);
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

function normalizeLp(value) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/LP[-_\s]?0*(\d{3,5})/);
  if (!match) return "";
  return `LP-${match[1].padStart(5, "0")}`;
}

function lpToken(value) {
  const normalized = normalizeLp(value);
  const match = normalized.match(/LP-(\d+)/);
  return match ? `lp${match[1]}` : slugify(normalized || value);
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

function pointForGeometry(geometry, method = "coordinate_mean") {
  const coords = coordsForGeometry(geometry);
  if (!coords.length) return null;

  if (method === "bbox_midpoint") {
    const extent = coords.reduce((acc, [lon, lat]) => ({
      minLon: Math.min(acc.minLon, lon),
      maxLon: Math.max(acc.maxLon, lon),
      minLat: Math.min(acc.minLat, lat),
      maxLat: Math.max(acc.maxLat, lat)
    }), {
      minLon: Infinity,
      maxLon: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity
    });
    return {
      lon: Number(((extent.minLon + extent.maxLon) / 2).toFixed(7)),
      lat: Number(((extent.minLat + extent.maxLat) / 2).toFixed(7))
    };
  }

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

function scanLpNumbers(value, out) {
  const text = String(value || "");
  const regex = /LP[-_\s]?0*(\d{3,5})/gi;
  let match = regex.exec(text);
  while (match) {
    out.add(`LP-${match[1].padStart(5, "0")}`);
    match = regex.exec(text);
  }
}

function titleDateKey(cityId, title, date) {
  return `${cityId}|${cleanText(title).toLowerCase()}|${date}`;
}

function actionText(event) {
  return [
    event.title,
    event.summary,
    event.observed_change,
    event.project_type,
    event.subcategory,
    event.category,
    event.bucket
  ].filter(Boolean).join(" ").toLowerCase();
}

function collectExistingKeys(corpus) {
  const anyLpNumbers = new Set();
  const designationLpNumbers = new Set();
  const designationRecordIds = new Set();
  const designationTitleDates = new Set();
  const calendarOnlyLpNumbers = new Set();

  for (const event of corpus.events || []) {
    if (event.city_id !== "nyc") continue;
    const allEventLps = new Set();
    scanLpNumbers(JSON.stringify(event), anyLpNumbers);
    scanLpNumbers(JSON.stringify(event), allEventLps);

    const text = actionText(event);
    const isCalendarOnly = /calendar(ed|ing)|designation consideration/.test(text);
    const isDesignation = /designat(ed|ion)/.test(text) && !/calendar(ed|ing).*designation consideration/.test(text);

    if (isCalendarOnly) {
      for (const lp of allEventLps) calendarOnlyLpNumbers.add(lp);
    }
    if (!isDesignation) continue;

    for (const lp of allEventLps) designationLpNumbers.add(lp);
    if (event.source_record_id) designationRecordIds.add(cleanText(event.source_record_id).toUpperCase());
    if (event.title && (event.date || event.effective_date)) {
      designationTitleDates.add(titleDateKey(event.city_id, event.title, event.date || event.effective_date));
    }
  }

  return {
    anyLpNumbers,
    designationLpNumbers,
    designationRecordIds,
    designationTitleDates,
    calendarOnlyLpNumbers
  };
}

function sourceQueryUrl(source, fieldName, value) {
  return `${source.api_url}?${fieldName}=${encodeURIComponent(value)}`;
}

function commonCandidateFields({ source, lpNumber, rawLpNumber, date, type, name, point, sourceUrl }) {
  const typeSlug = slugify(type, 48);
  const year = date.slice(0, 4);
  return {
    city_id: "nyc",
    candidate_id: `nyc_lpc_designation_gap_round142_${typeSlug}_${lpToken(lpNumber)}_${year}`,
    event_id: `nyc_lpc_designation_gap_round142_${typeSlug}_${lpToken(lpNumber)}_${year}`,
    date,
    effective_date: date,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_status",
    category: "planning/development/architecture/historic_preservation",
    subcategory: `${cleanText(type).toLowerCase()} designation`,
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
    source_date_field: "DESDATE / desdate (LPC designation date)",
    source_dataset_id: source.source_id,
    source_dataset_four_by_four: source.dataset_id,
    accessed_at: RETRIEVED_AT,
    source_retrieved_at: RETRIEVED_AT,
    confidence: "documented",
    project_type: `administrative heritage status - LPC ${cleanText(type).toLowerCase()} designation`,
    license: "NYC Open Data / NYC.gov terms; dataset metadata license field may be null.",
    license_url: NYC_OPEN_DATA_TERMS_URL,
    license_or_terms_note: "NYC Open Data / NYC.gov terms apply. Attribute NYC Landmarks Preservation Commission and NYC Open Data; re-check dataset metadata and terms before redistribution.",
    attribution: "NYC Landmarks Preservation Commission / NYC Open Data",
    limitations: "This record documents legal/protective designation status only. It does not document construction, restoration, permit activity, opening, occupancy, current physical condition, owner action, preservation outcome, or causal effect.",
    raw_context: {
      lp_number: lpNumber,
      raw_lp_number: rawLpNumber,
      official_name: name,
      landmark_type: type
    }
  };
}

function titleFor(type, name) {
  const cleanName = cleanText(name);
  if (/historic district/i.test(type)) return `${cleanName} was designated by NYC LPC`;
  if (/interior/i.test(type)) return `${cleanName} was designated an interior landmark`;
  if (/scenic/i.test(type)) return `${cleanName} was designated a scenic landmark`;
  if (/individual/i.test(type)) return `${cleanName} was designated an individual landmark`;
  return `${cleanName} was designated by NYC LPC`;
}

function candidateForHistoricDistrict(row) {
  const source = SOURCES.historicDistricts;
  const lpNumber = normalizeLp(row.lp_number);
  const rawLpNumber = cleanText(row.lp_number);
  const date = dateOnly(row.desdate);
  const name = cleanText(row.area_name);
  const point = pointForGeometry(row.the_geom, "bbox_midpoint");
  if (!lpNumber || !date || !name || !cityEnvelopeCheck(point)) return null;
  const borough = boroughName(row.borough);
  const title = titleFor("Historic District", name);
  const sourceUrl = sourceQueryUrl(source, "lp_number", rawLpNumber || lpNumber);
  return {
    ...commonCandidateFields({
      source,
      lpNumber,
      rawLpNumber,
      date,
      type: "Historic District",
      name,
      point,
      sourceUrl
    }),
    title,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber}) in ${borough} as a historic district designated on ${date}. This is a legal/protective designation status record, not a physical work, restoration, or opening.`,
    observed_change: "The official LPC Historic Districts row documents a historic-district designation, a legal/protective status milestone for the mapped district boundary.",
    area: `${name}, ${borough}`,
    location_name: `${name}, ${borough}`,
    geometry_ref: {
      dataset_id: source.dataset_id,
      socrata_row_id: row[":id"] || null,
      lp_number: lpNumber,
      raw_lp_number: rawLpNumber,
      source_url: sourceUrl,
      geometry_type: row.the_geom?.type || null,
      shape_area: row.shape_area || null,
      shape_length: row.shape_leng || null
    },
    geometry_source: `Official LPC Historic Districts multipolygon for ${rawLpNumber || lpNumber}; atlas point is a bounding-box midpoint derived from the source polygon coordinates.`,
    geometry_precision: "derived navigation centroid for a historic-district polygon; use the official source polygon for legal/boundary interpretation",
    transformation_method: "scripts/fetch_round142_nyc_lpc_designation_gaps_candidates.js fetched official skyk-mpzq historic-district rows, filtered DESDATE to 2008-01-01 through 2026-05-19 and DESIGNATED status, screened final designation LP numbers/title-date keys against the current manual corpus, and derived a navigation point from the official polygon extent.",
    raw_context: {
      ...commonCandidateFields({
        source,
        lpNumber,
        rawLpNumber,
        date,
        type: "Historic District",
        name,
        point,
        sourceUrl
      }).raw_context,
      socrata_row_id: row[":id"] || null,
      borough: cleanText(row.borough),
      borough_name: borough,
      extension: cleanText(row.extension),
      status_of_boundary: cleanText(row.status_of_),
      last_action: cleanText(row.last_actio),
      public_hearing: cleanText(row.public_hea),
      other_hearing: cleanText(row.other_hear),
      caldate: dateOnly(row.caldate),
      desdate: date,
      shape_area: row.shape_area || null,
      shape_leng: row.shape_leng || null
    }
  };
}

function summarizeAddresses(rows) {
  const addresses = [...new Set(rows
    .map((row) => cleanText(row.desig_addr || row.pluto_addr))
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  if (addresses.length <= 4) return addresses.join("; ");
  return `${addresses.slice(0, 4).join("; ")}; and ${addresses.length - 4} other source row addresses`;
}

function candidateForNcreGroup(lpNumber, rows, reason) {
  const source = SOURCES.designatedCalendared;
  const sortedRows = rows.slice().sort((a, b) => {
    const dateCompare = dateOnly(a.desdate).localeCompare(dateOnly(b.desdate));
    if (dateCompare !== 0) return dateCompare;
    return cleanText(a[":id"]).localeCompare(cleanText(b[":id"]));
  });
  const row = sortedRows[0];
  const rawLpNumber = cleanText(row.lp_number);
  const date = dateOnly(row.desdate);
  const name = cleanText(row.lm_name);
  const type = cleanText(row.lm_type || "LPC designation");
  const point = pointForRows(sortedRows);
  if (!lpNumber || !date || !name || !cityEnvelopeCheck(point)) return null;
  const boroughs = [...new Set(sortedRows.map((candidateRow) => boroughName(candidateRow.boroughid)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const boroughLabel = boroughs.length ? boroughs.join(", ") : "New York City";
  const title = titleFor(type, name);
  const addressSummary = summarizeAddresses(sortedRows);
  const sourceUrl = sourceQueryUrl(source, "lp_number", rawLpNumber || lpNumber);
  const isHistoricDistrict = /historic district/i.test(type);
  const geometryPrecision = isHistoricDistrict
    ? "aggregate centroid from official building/site point rows; no matching Historic Districts polygon row was found in skyk-mpzq for this LP at retrieval time"
    : /interior/i.test(type)
      ? "official row point for the host building/site; interior extent is not mapped as a separate boundary"
      : "official row point or aggregate point from LPC designated/calendared site rows; not a surveyed legal boundary";

  return {
    ...commonCandidateFields({
      source,
      lpNumber,
      rawLpNumber,
      date,
      type,
      name,
      point,
      sourceUrl
    }),
    title,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber}) in ${boroughLabel} as ${articleFor(type)} ${type.toLowerCase()} designated on ${date}${addressSummary ? `; source row address context includes ${addressSummary}` : ""}. This is a legal/protective designation status record, not a physical work, restoration, or opening.`,
    observed_change: `The official LPC Designated and Calendared Buildings and Sites rows document ${articleFor(type)} ${type.toLowerCase()} designation, a legal/protective status milestone for the named site or district.`,
    area: `${name}, ${boroughLabel}`,
    location_name: `${name}, ${boroughLabel}`,
    geometry_ref: {
      dataset_id: source.dataset_id,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      lp_number: lpNumber,
      raw_lp_number: rawLpNumber,
      source_url: sourceUrl,
      geometry_type: "Point row aggregate"
    },
    geometry_source: `Official LPC Designated and Calendared Buildings and Sites point geometry for ${rawLpNumber || lpNumber}; atlas point is the mean of ${sortedRows.length} source row coordinate set(s).`,
    geometry_precision: geometryPrecision,
    transformation_method: `scripts/fetch_round142_nyc_lpc_designation_gaps_candidates.js fetched official ncre-qhxs rows, filtered DESDATE to 2008-01-01 through 2026-05-19 with DESIGNATED status and non-individual landmark types, grouped rows by LP number, screened final designation LP numbers/title-date keys against the current manual corpus, and used ncre-qhxs as ${reason}.`,
    raw_context: {
      ...commonCandidateFields({
        source,
        lpNumber,
        rawLpNumber,
        date,
        type,
        name,
        point,
        sourceUrl
      }).raw_context,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      boroughs: boroughs,
      status_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.status)).filter(Boolean))],
      last_action_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.last_actio)).filter(Boolean))],
      public_hearing_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.public_hea)).filter(Boolean))].slice(0, 12),
      caldate_values: [...new Set(sortedRows.map((candidateRow) => dateOnly(candidateRow.caldate)).filter(Boolean))],
      desdate_values: [...new Set(sortedRows.map((candidateRow) => dateOnly(candidateRow.desdate)).filter(Boolean))],
      sample_rows: sortedRows.slice(0, 12).map((candidateRow) => ({
        socrata_row_id: candidateRow[":id"] || null,
        bin_number: cleanText(candidateRow.bin_number),
        bbl: cleanText(candidateRow.bbl),
        boroughid: cleanText(candidateRow.boroughid),
        block: cleanText(candidateRow.block),
        lot: cleanText(candidateRow.lot),
        desig_addr: cleanText(candidateRow.desig_addr),
        pluto_addr: cleanText(candidateRow.pluto_addr),
        count_bldg: cleanText(candidateRow.count_bldg),
        non_bldg: cleanText(candidateRow.non_bldg)
      }))
    }
  };
}

function articleFor(type) {
  return /^[aeiou]/i.test(cleanText(type)) ? "an" : "a";
}

function candidateForIndividualGroup(lpNumber, rows) {
  const source = SOURCES.individualLandmarks;
  const sortedRows = rows.slice().sort((a, b) => {
    const objectCompare = Number(a.objectid || 0) - Number(b.objectid || 0);
    if (objectCompare !== 0) return objectCompare;
    return cleanText(a[":id"]).localeCompare(cleanText(b[":id"]));
  });
  const row = sortedRows[0];
  const rawLpNumber = cleanText(row.lpc_lpnumb);
  const date = dateOnly(row.desdate);
  const name = cleanText(row.lpc_name);
  const type = cleanText(row.landmarkty || "Individual Landmark");
  const point = pointForRows(sortedRows);
  if (!lpNumber || !date || !name || !cityEnvelopeCheck(point)) return null;
  const boroughs = [...new Set(sortedRows.map((candidateRow) => boroughName(candidateRow.borough)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const boroughLabel = boroughs.length ? boroughs.join(", ") : "New York City";
  const addresses = [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.address)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const addressLabel = addresses.length <= 4
    ? addresses.join("; ")
    : `${addresses.slice(0, 4).join("; ")}; and ${addresses.length - 4} other source row addresses`;
  const title = titleFor(type, name);
  const sourceUrl = sourceQueryUrl(source, "lpc_lpnumb", rawLpNumber || lpNumber);

  return {
    ...commonCandidateFields({
      source,
      lpNumber,
      rawLpNumber,
      date,
      type,
      name,
      point,
      sourceUrl
    }),
    title,
    summary: `NYC Landmarks Preservation Commission Open Data records ${name} (${lpNumber})${addressLabel ? ` at ${addressLabel}` : ""}, ${boroughLabel}, as an individual landmark designated on ${date}. This is a legal/protective designation status record, not a physical work, restoration, or opening.`,
    observed_change: "The official LPC Individual Landmark Sites row documents an individual-landmark designation, a legal/protective status milestone for the named site.",
    area: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    location_name: addressLabel ? `${addressLabel}, ${boroughLabel}` : `${name}, ${boroughLabel}`,
    geometry_ref: {
      dataset_id: source.dataset_id,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      objectids: sortedRows.map((candidateRow) => cleanText(candidateRow.objectid)).filter(Boolean),
      lp_number: lpNumber,
      raw_lp_number: rawLpNumber,
      source_url: sourceUrl,
      geometry_type: sortedRows.length === 1 ? sortedRows[0].the_geom?.type || null : "Multi-row polygon aggregate"
    },
    geometry_source: `Official LPC Individual Landmark Sites geometry for ${rawLpNumber || lpNumber}; atlas point is the mean of source polygon coordinate sets across ${sortedRows.length} row(s).`,
    geometry_precision: "centroid derived from official source site polygon coordinates for atlas navigation; use the official source geometry for legal/site extent",
    transformation_method: "scripts/fetch_round142_nyc_lpc_designation_gaps_candidates.js fetched official buis-pvji individual landmark rows, filtered DESDATE to 2008-01-01 through 2026-05-19 and Designated status, grouped rows by LP number, screened final designation LP numbers/title-date keys against the current manual corpus, and derived a navigation point from official polygon coordinates.",
    raw_context: {
      ...commonCandidateFields({
        source,
        lpNumber,
        rawLpNumber,
        date,
        type,
        name,
        point,
        sourceUrl
      }).raw_context,
      row_count: sortedRows.length,
      source_row_ids: sortedRows.map((candidateRow) => candidateRow[":id"]).filter(Boolean),
      objectids: sortedRows.map((candidateRow) => cleanText(candidateRow.objectid)).filter(Boolean),
      boroughs,
      addresses,
      lpc_sitest_values: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.lpc_sitest)).filter(Boolean))],
      url_reports: [...new Set(sortedRows.map((candidateRow) => cleanText(candidateRow.url_report)).filter(Boolean))],
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

function groupByLp(rows, fieldName) {
  const grouped = new Map();
  for (const row of rows) {
    const lpNumber = normalizeLp(row[fieldName]);
    if (!lpNumber) continue;
    if (!grouped.has(lpNumber)) grouped.set(lpNumber, []);
    grouped.get(lpNumber).push(row);
  }
  return grouped;
}

function candidateAlreadyRepresented(candidate, existingKeys) {
  if (existingKeys.designationLpNumbers.has(candidate.source_record_id)) return "existing designation LP number in manual corpus";
  if (existingKeys.designationRecordIds.has(cleanText(candidate.source_record_id).toUpperCase())) return "existing designation source_record_id in manual corpus";
  if (existingKeys.designationTitleDates.has(titleDateKey(candidate.city_id, candidate.title, candidate.date))) return "existing designation title/date in manual corpus";
  return "";
}

function makeSourceAudit(metadataByDataset, counts) {
  const auditFor = (key, extras) => {
    const source = SOURCES[key];
    const metadata = metadataByDataset[source.dataset_id] || {};
    return {
      source_id: source.source_id,
      dataset_id: source.dataset_id,
      source_name: source.source_name,
      publisher: source.publisher,
      source_url: source.page_url,
      api_url: source.api_url,
      source_type: "official NYC Open Data Socrata dataset",
      attribution: metadata.attribution || "Landmarks Preservation Commission (LPC)",
      license_or_terms_note: "Dataset metadata may not declare a standalone license. NYC Open Data / NYC.gov terms apply; attribute LPC and NYC Open Data and re-check current metadata before redistribution.",
      license_url: NYC_OPEN_DATA_TERMS_URL,
      terms_url: NYC_OPEN_DATA_FAQ_URL,
      accessed_at: RETRIEVED_AT,
      coverage_years_reviewed: `${START_DATE} through ${END_DATE}`,
      update_frequency: metadata.metadata?.custom_fields?.Update?.["Update Frequency"] || metadata.metadata?.custom_fields?.Update?.["Update Frequency"] || null,
      date_made_public: metadata.metadata?.custom_fields?.Update?.["Date Made Public"] || null,
      key_fields_used: extras.key_fields_used,
      geographic_scope: extras.geographic_scope,
      granularity: extras.granularity,
      reliability_assessment: extras.reliability_assessment,
      required_caveats: extras.required_caveats,
      ingestion_recommendation: extras.ingestion_recommendation,
      rows_reviewed: counts.rows_reviewed[source.dataset_id] || 0,
      candidate_count: counts.candidates_by_dataset[source.dataset_id] || 0,
      metadata_name: metadata.name || null,
      metadata_description: cleanText(metadata.description, 360)
    };
  };

  return {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    source_audits: [
      auditFor("historicDistricts", {
        key_fields_used: ["lp_number", "area_name", "borough", "status_of_", "last_actio", "desdate", "caldate", "the_geom", ":id", "shape_area", "shape_leng"],
        geographic_scope: "New York City historic district boundaries.",
        granularity: "One polygon/multipolygon row per historic district or district action boundary.",
        reliability_assessment: "strong for historic-district administrative designation status and source polygon boundaries when DESDATE and DESIGNATED status are present",
        required_caveats: [
          "Designation is legal/protective status, not construction, restoration, occupancy, condition, or outcome evidence.",
          "Atlas coordinates are derived centroids; use source polygons for legal/boundary interpretation.",
          "The Historic Districts API was not as current as ncre-qhxs for two 2025 district LPs at retrieval time, so those use ncre-qhxs point aggregates."
        ],
        ingestion_recommendation: "Use as the preferred source for missing historic-district designation candidates when a matching LP polygon row exists."
      }),
      auditFor("designatedCalendared", {
        key_fields_used: ["lp_number", "lm_name", "lm_type", "status", "last_actio", "desdate", "caldate", "boroughid", "desig_addr", "pluto_addr", "bbl", "bin_number", "the_geom", ":id"],
        geographic_scope: "New York City individual, interior, scenic, and historic-district building/site rows.",
        granularity: "Point rows for individual sites, interiors, scenic landmarks, and properties/buildings within historic districts.",
        reliability_assessment: "strong for documented LPC designation status, usable with caveats for historic-district geometry because rows are building/site points rather than district polygons",
        required_caveats: [
          "STATUS describes the specific row and can differ from broader LP-number action context; this script keeps LAST_ACTIO/DESDATE and groups by LP.",
          "Historic district candidates from this source use point aggregates where no skyk-mpzq polygon row was available.",
          "Interior landmark points represent host buildings/sites, not interior boundaries."
        ],
        ingestion_recommendation: "Use for non-individual designation gaps and as a fallback for recent historic districts not present in the Historic Districts polygon API."
      }),
      auditFor("individualLandmarks", {
        key_fields_used: ["objectid", "lpc_lpnumb", "lpc_name", "landmarkty", "lpc_sitest", "desdate", "address", "borough", "bbl", "the_geom", "url_report", ":id"],
        geographic_scope: "New York City individual landmark sites.",
        granularity: "Site polygon/multipolygon rows for designated individual landmarks.",
        reliability_assessment: "strong for individual-landmark administrative designation status and source site geometry",
        required_caveats: [
          "Designation is legal/protective status, not construction, restoration, occupancy, condition, or outcome evidence.",
          "Some LP numbers can have multiple source rows/site parts; this script groups by LP and preserves objectids/source row IDs."
        ],
        ingestion_recommendation: "Use for current individual-landmark designation gaps that are not represented as final designations in the manual corpus."
      })
    ]
  };
}

function makeNotes(summary) {
  const lines = [
    "# Round 142 NYC LPC designation gaps",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "Scope: official NYC Landmarks Preservation Commission Open Data records with designation dates from 2008-01-01 through 2026-05-19 that are not already represented as final designation events in the current manual architecture corpus.",
    "",
    "Duplicate screening:",
    "",
    "- LP numbers were normalized to LP-00000 form before comparison.",
    "- Manual corpus events that only say calendared/designation consideration do not suppress later final designation candidates.",
    "- Existing final designation LP numbers, source_record_id values, and title/date keys suppress candidates.",
    "",
    "Source priority:",
    "",
    "- Historic Districts (`skyk-mpzq`) is preferred for historic-district polygons.",
    "- Designated and Calendared Buildings and Sites (`ncre-qhxs`) is used for interiors/scenic landmarks and for historic districts missing from `skyk-mpzq` at retrieval time.",
    "- Individual Landmark Sites (`buis-pvji`) is used for individual-landmark site polygons.",
    "",
    "Counts:",
    "",
    `- Candidates: ${summary.candidate_count}`,
    `- Historic District: ${summary.by_landmark_type["Historic District"] || 0}`,
    `- Interior Landmark: ${summary.by_landmark_type["Interior Landmark"] || 0}`,
    `- Scenic Landmark: ${summary.by_landmark_type["Scenic Landmark"] || 0}`,
    `- Individual Landmark: ${summary.by_landmark_type["Individual Landmark"] || 0}`,
    "",
    "Caveat: these candidates document LPC legal/protective designation status only. They do not document physical works, restoration, opening, construction, occupancy, preservation outcome, or causal impact."
  ];
  return lines.join("\n");
}

async function main() {
  const corpus = readJson(CORPUS_PATH);
  const existingKeys = collectExistingKeys(corpus);

  const metadataEntries = await Promise.all(Object.values(SOURCES).map(async (source) => {
    const metadata = await fetchJson(`https://data.cityofnewyork.us/api/views/${source.dataset_id}`);
    return [source.dataset_id, metadata];
  }));
  const metadataByDataset = Object.fromEntries(metadataEntries);

  const historicDistrictParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND status_of_='DESIGNATED'`,
    "$order": "desdate,lp_number",
    "$limit": "50000"
  });
  const ncreParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59' AND status='DESIGNATED' AND last_actio='DESIGNATED' AND lm_type != 'Individual Landmark'`,
    "$order": "desdate,lp_number",
    "$limit": "50000"
  });
  const individualParams = new URLSearchParams({
    "$select": "*,:id",
    "$where": `desdate between '${START_DATE}T00:00:00' and '${END_DATE}T23:59:59'`,
    "$order": "desdate,lpc_lpnumb,objectid",
    "$limit": "50000"
  });

  const [historicDistrictRows, ncreRows, individualRows] = await Promise.all([
    fetchJson(`${SOURCES.historicDistricts.api_url}?${historicDistrictParams}`),
    fetchJson(`${SOURCES.designatedCalendared.api_url}?${ncreParams}`),
    fetchJson(`${SOURCES.individualLandmarks.api_url}?${individualParams}`)
  ]);

  const candidatesByLp = new Map();
  const rejected = {};
  const rejected_examples = [];

  const reject = (reason, context) => {
    rejected[reason] = (rejected[reason] || 0) + 1;
    if (rejected_examples.length < 60) rejected_examples.push({ reason, ...context });
  };

  const considerCandidate = (candidate) => {
    if (!candidate) {
      reject("invalid_candidate_missing_required_fields_or_geometry", {});
      return;
    }
    const representedReason = candidateAlreadyRepresented(candidate, existingKeys);
    if (representedReason) {
      reject(representedReason, { source_record_id: candidate.source_record_id, title: candidate.title, date: candidate.date });
      return;
    }
    if (candidatesByLp.has(candidate.source_record_id)) {
      reject("duplicate_candidate_lp_after_source_priority", { source_record_id: candidate.source_record_id, title: candidate.title });
      return;
    }
    candidatesByLp.set(candidate.source_record_id, candidate);
  };

  for (const row of historicDistrictRows) {
    if (cleanText(row.last_actio).toUpperCase() !== "DESIGNATED") {
      reject("historic_district_last_action_not_designated", { lp_number: normalizeLp(row.lp_number), last_actio: cleanText(row.last_actio) });
      continue;
    }
    considerCandidate(candidateForHistoricDistrict(row));
  }

  const ncreGroups = groupByLp(ncreRows, "lp_number");
  for (const [lpNumber, rows] of ncreGroups) {
    const type = cleanText(rows[0]?.lm_type || "");
    if (/historic district/i.test(type) && candidatesByLp.has(lpNumber)) {
      reject("ncre_historic_district_covered_by_polygon_source", { source_record_id: lpNumber, title: cleanText(rows[0]?.lm_name), row_count: rows.length });
      continue;
    }
    const reason = /historic district/i.test(type)
      ? "a historic-district point-row fallback because no matching skyk-mpzq polygon candidate was retained"
      : "the primary source for non-individual designation geometry/status";
    considerCandidate(candidateForNcreGroup(lpNumber, rows, reason));
  }

  const individualGroups = groupByLp(individualRows.filter((row) => (
    cleanText(row.lpc_sitest).toLowerCase() === "designated" &&
    cleanText(row.landmarkty).toLowerCase() === "individual landmark"
  )), "lpc_lpnumb");
  for (const [lpNumber, rows] of individualGroups) {
    considerCandidate(candidateForIndividualGroup(lpNumber, rows));
  }

  const candidates = [...candidatesByLp.values()].sort((a, b) => (
    a.date.localeCompare(b.date) ||
    cleanText(a.raw_context.landmark_type).localeCompare(cleanText(b.raw_context.landmark_type)) ||
    a.source_record_id.localeCompare(b.source_record_id)
  ));

  const summary = {
    generated_at: `${RETRIEVED_AT}T00:00:00Z`,
    task: "Round142 NYC LPC historic-district/designation gap candidates from official Open Data",
    start_date: START_DATE,
    end_date: END_DATE,
    candidate_count: candidates.length,
    by_landmark_type: candidates.reduce((acc, candidate) => {
      const key = candidate.raw_context.landmark_type || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    by_year: candidates.reduce((acc, candidate) => {
      const year = candidate.date.slice(0, 4);
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {}),
    by_source_dataset: candidates.reduce((acc, candidate) => {
      acc[candidate.source_dataset_four_by_four] = (acc[candidate.source_dataset_four_by_four] || 0) + 1;
      return acc;
    }, {}),
    rows_reviewed: {
      [SOURCES.historicDistricts.dataset_id]: historicDistrictRows.length,
      [SOURCES.designatedCalendared.dataset_id]: ncreRows.length,
      [SOURCES.individualLandmarks.dataset_id]: individualRows.length
    },
    current_manual_corpus_screen: {
      nyc_lp_numbers_seen_any_action: existingKeys.anyLpNumbers.size,
      nyc_lp_numbers_seen_final_designation: existingKeys.designationLpNumbers.size,
      nyc_lp_numbers_seen_calendar_only: existingKeys.calendarOnlyLpNumbers.size,
      calendar_only_lp_numbers: [...existingKeys.calendarOnlyLpNumbers]
        .filter((lp) => !existingKeys.designationLpNumbers.has(lp))
        .sort()
    },
    rejected,
    rejected_examples
  };

  const sourceAudit = makeSourceAudit(metadataByDataset, {
    rows_reviewed: summary.rows_reviewed,
    candidates_by_dataset: summary.by_source_dataset
  });

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
    caveat: "Candidates document legal/protective LPC designation status only; they are not evidence of physical works, restoration, opening, construction, occupancy, condition, preservation outcome, or causal impact.",
    candidates
  });
  writeJson(SOURCE_AUDIT_PATH, sourceAudit);
  writeJson(SUMMARY_PATH, summary);
  writeText(NOTES_PATH, makeNotes(summary));

  console.log(JSON.stringify({
    out_dir: path.relative(ROOT, OUT_DIR),
    candidate_count: candidates.length,
    by_landmark_type: summary.by_landmark_type,
    by_source_dataset: summary.by_source_dataset,
    rows_reviewed: summary.rows_reviewed
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
