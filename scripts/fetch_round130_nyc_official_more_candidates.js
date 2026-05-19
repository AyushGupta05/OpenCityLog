const fs = require("fs");
const path = require("path");

const ACCESSED_AT = "2026-05-19";
const START_DATE = "2008-01-01";
const END_DATE = ACCESSED_AT;
const OUT_DIR = "tmp/subagents/round130_nyc_official_more";
const CORPUS_PATH = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";

const DATASETS = {
  pops: {
    id: "rvih-nhyn",
    sourceId: "nyc-dcp-pops-rvih-nhyn",
    name: "NYC Open Data: Privately Owned Public Spaces (POPS)",
    publisher: "NYC Department of City Planning (DCP), via NYC Open Data",
    page: "https://data.cityofnewyork.us/d/rvih-nhyn",
    api: "https://data.cityofnewyork.us/resource/rvih-nhyn.json",
    metadata: "https://data.cityofnewyork.us/api/views/rvih-nhyn"
  },
  wpaa: {
    id: "388s-pnvc",
    sourceId: "nyc-dcp-wpaa-388s-pnvc",
    name: "NYC Open Data: Waterfront Public Access Areas (WPAAs)",
    publisher: "NYC Department of City Planning (DCP), via NYC Open Data",
    page: "https://data.cityofnewyork.us/d/388s-pnvc",
    api: "https://data.cityofnewyork.us/resource/388s-pnvc.json",
    metadata: "https://data.cityofnewyork.us/api/views/388s-pnvc"
  }
};

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value, maxLength = 96) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/_+$/g, "") || "record";
}

function parseYear(value) {
  const match = cleanText(value).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) return "";
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function inDateWindow(date) {
  return date >= START_DATE && date <= END_DATE;
}

function inYearWindow(year) {
  return year >= "2008" && year <= "2026";
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isNycPoint(latitude, longitude) {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 40.4774 &&
    latitude <= 40.9176 &&
    longitude >= -74.2591 &&
    longitude <= -73.7004;
}

function socrataUrl(datasetId, params = {}) {
  const url = new URL(`https://data.cityofnewyork.us/resource/${datasetId}.json`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function fetchJson(url, label) {
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${(await response.text()).slice(0, 300)}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      const delayMs = attempt * attempt * 750;
      console.warn(`${label}: fetch attempt ${attempt} failed (${error.message}); retrying in ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function fetchAllRows(dataset, label) {
  const rows = [];
  const limit = 50000;
  for (let offset = 0; ; offset += limit) {
    const url = socrataUrl(dataset.id, { $limit: limit, $offset: offset });
    const batch = await fetchJson(url, `${label} offset ${offset}`);
    if (!Array.isArray(batch)) throw new Error(`${label} returned non-array payload`);
    rows.push(...batch);
    if (batch.length < limit) break;
  }
  return rows;
}

function readExistingCorpusText() {
  if (!fs.existsSync(CORPUS_PATH)) return "";
  return fs.readFileSync(CORPUS_PATH, "utf8").toLowerCase();
}

function existingNeedleNotes(corpusText, needles) {
  const hits = [];
  for (const needle of needles.map(cleanText).filter(Boolean)) {
    if (needle.length < 4) continue;
    if (corpusText.includes(needle.toLowerCase())) hits.push(needle);
  }
  return hits;
}

function walkCoordinates(geometry, collector) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return;
  const visit = (value) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      collector(value[0], value[1]);
      return;
    }
    for (const item of value) visit(item);
  };
  visit(geometry.coordinates);
}

function representativePoint(geometry) {
  let longitudeSum = 0;
  let latitudeSum = 0;
  let count = 0;
  walkCoordinates(geometry, (longitude, latitude) => {
    longitudeSum += longitude;
    latitudeSum += latitude;
    count += 1;
  });
  if (!count) return null;
  return {
    latitude: Number((latitudeSum / count).toFixed(7)),
    longitude: Number((longitudeSum / count).toFixed(7)),
    coordinate_count: count
  };
}

function trimRow(row, fields) {
  const out = {};
  for (const field of fields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== "") out[field] = row[field];
  }
  return out;
}

function popsCandidate(row, corpusText, rejected) {
  const dataset = DATASETS.pops;
  const year = parseYear(row.year_completed);
  const latitude = parseNumber(row.latitude);
  const longitude = parseNumber(row.longitude);
  const popsNumber = cleanText(row.pops_number);
  const constructed = cleanText(row.building_constructed);
  if (!popsNumber) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: "", reason: "Missing POPS number." });
    return null;
  }
  if (!inYearWindow(year) || !/completed/i.test(constructed)) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: popsNumber, reason: "Missing 2008-2026 completed year/status." });
    return null;
  }
  if (!isNycPoint(latitude, longitude)) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: popsNumber, reason: "Missing or out-of-city POPS coordinates." });
    return null;
  }

  const address = cleanText(row.building_address_with_zip || [row.address_number, row.street_name, row.borough_name].filter(Boolean).join(" "));
  const buildingName = cleanText(row.building_name);
  const label = buildingName || address || `POPS ${popsNumber}`;
  const spaceType = cleanText(row.public_space_type || "privately owned public space");
  const sourceRecordId = `pops_number:${popsNumber}; bbl:${cleanText(row.bbl) || "not supplied"}; year_completed:${year}`;
  const id = `nyc_dcp_pops_${slugify(popsNumber)}_${year}`;
  const duplicateHints = existingNeedleNotes(corpusText, [popsNumber, address, buildingName].filter(Boolean));

  return {
    city: "nyc",
    city_id: "nyc",
    candidate_id: id,
    event_id: id,
    effective_date: year,
    effective_date_precision: "year",
    date: year,
    date_precision: "year",
    bucket: "planning/development/architecture/privately_owned_public_space",
    title: `DCP POPS records ${spaceType} at ${label} as completed in ${year}`,
    summary: `${dataset.publisher} records POPS ${popsNumber} at ${address || label} with building_constructed '${constructed}', year_completed ${year}, public_space_type '${spaceType}', and required size '${cleanText(row.size_required) || "not supplied"}'.`,
    observed_change: `DCP's POPS dataset records a completed development/public-space requirement row for ${label} at year precision.`,
    area: address || `${label}, New York City`,
    latitude,
    longitude,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    source_ids: [dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: socrataUrl(dataset.id, { pops_number: popsNumber }),
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API row",
    source_dataset_id: dataset.sourceId,
    source_date_field: "year_completed",
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use; dataset metadata does not list a separate dataset-specific open license.",
    license_url: "https://www.nyc.gov/home/terms-of-use.page",
    attribution: dataset.publisher,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    architect: cleanText(row.building_architect || "Source row does not name a building architect."),
    project_type: "privately owned public space completion-year record",
    geometry_source: "Official POPS row latitude/longitude for the development.",
    geometry_precision: "official development point for atlas navigation; not a measured plaza, arcade, concourse, open-space boundary, legal easement, or building footprint",
    limitations: "The POPS row's year_completed field is year precision and, per the source metadata, is based on published information and discussions with the owner. Treat it as a DCP-maintained completion-year record for the development/public-space requirement, not as an exact opening date, current compliance inspection, public access audit, occupancy record, or outcome claim.",
    duplicate_check_note: duplicateHints.length
      ? `Exact POPS source id was not found in the manual corpus, but related manual-corpus text was found for: ${duplicateHints.slice(0, 4).join("; ")}. Treat as possible same-site supplemental evidence during integration.`
      : "No exact POPS number, address, or building-name match was found in the manual architecture corpus text during this worker pass.",
    source_row_ref: {
      dataset_id: dataset.id,
      row_key: popsNumber,
      bbl: cleanText(row.bbl),
      bin: cleanText(row.bin)
    },
    source_fields: trimRow(row, [
      "pops_number",
      "borough_name",
      "building_address_with_zip",
      "building_name",
      "building_location",
      "year_completed",
      "building_constructed",
      "public_space_type",
      "developer",
      "building_architect",
      "principal_public_space",
      "size_required",
      "hour_of_access_required",
      "amenities_required",
      "permitted_amenities",
      "physically_disabled",
      "latitude",
      "longitude",
      "bin",
      "bbl"
    ])
  };
}

function wpaaCandidate(row, corpusText, rejected) {
  const dataset = DATASETS.wpaa;
  const wpaaId = cleanText(row.wpaa_id);
  const cpcDate = parseDate(row.cpc_approv);
  const chairDate = parseDate(row.chair_cert);
  const date = cpcDate || chairDate;
  const sourceDateField = cpcDate ? "cpc_approv" : "chair_cert";
  if (!wpaaId) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: "", reason: "Missing WPAA ID." });
    return null;
  }
  if (!date || !inDateWindow(date)) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: wpaaId, reason: "Missing or out-of-window chair certification/CPC approval date." });
    return null;
  }
  const point = representativePoint(row.the_geom);
  if (!point || !isNycPoint(point.latitude, point.longitude)) {
    rejected.push({ source_dataset_id: dataset.id, source_record_id: wpaaId, reason: "Missing or out-of-city WPAA source geometry." });
    return null;
  }

  const name = cleanText(row.name || `WPAA ${wpaaId}`);
  const actionLabel = cpcDate ? "CPC approval" : "Chair certification";
  const status = cleanText(row.status || "status not supplied");
  const waterway = cleanText(row.waterway);
  const zapProject = cleanText(row.zap_link).match(/projects\/([^/?#]+)/i)?.[1] || "";
  const sourceRecordId = `wpaa_id:${wpaaId}; ${sourceDateField}:${date}${zapProject ? `; zap_project:${zapProject}` : ""}`;
  const id = `nyc_dcp_wpaa_${slugify(wpaaId)}_${date.replace(/-/g, "_")}`;
  const duplicateHints = existingNeedleNotes(corpusText, [wpaaId, zapProject, name, cleanText(row.cpc_report)].filter(Boolean));

  return {
    city: "nyc",
    city_id: "nyc",
    candidate_id: id,
    event_id: id,
    effective_date: date,
    effective_date_precision: "day",
    date,
    date_precision: "day",
    bucket: "planning/development/architecture/waterfront_public_access_area",
    title: `DCP WPAA records ${actionLabel.toLowerCase()} for ${name}`,
    summary: `${dataset.publisher} records ${actionLabel} on ${date} for Waterfront Public Access Area ${wpaaId} (${name}). Current dataset status is '${status}', adjacent waterway is '${waterway || "not supplied"}', total WPAA area is '${cleanText(row.wpaa_area) || "not supplied"}' square feet, and maintenance is listed as '${cleanText(row.maintenanc) || "not supplied"}'.`,
    observed_change: `DCP records an administrative ${actionLabel.toLowerCase()} associated with creation of a waterfront public access area; this is not a construction or opening claim.`,
    area: [name, waterway, "New York City"].filter(Boolean).join(", "),
    latitude: point.latitude,
    longitude: point.longitude,
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    geometry_ref: `Official ${dataset.id} the_geom multipolygon for wpaa_id ${wpaaId}; candidate point is a representative coordinate average.`,
    source_ids: [dataset.sourceId],
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: socrataUrl(dataset.id, { wpaa_id: wpaaId }),
    source_record_id: sourceRecordId,
    source_type: "official NYC Open Data Socrata API spatial row",
    source_dataset_id: dataset.sourceId,
    source_date_field: sourceDateField,
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use; dataset metadata does not list a separate dataset-specific open license.",
    license_url: "https://www.nyc.gov/home/terms-of-use.page",
    attribution: dataset.publisher,
    accessed_at: ACCESSED_AT,
    confidence: "documented",
    architect: "Source row does not name a project architect.",
    project_type: "waterfront public access area approval or certification",
    geometry_source: "Official WPAA source multipolygon summarized to a representative point for candidate review.",
    geometry_precision: `representative point from ${point.coordinate_count} source geometry coordinate(s); use the official source multipolygon for boundaries`,
    limitations: "The selected date is the Chair certification or City Planning Commission approval date associated with creation of the WPAA, not an observed construction start, completion, public opening, current access/compliance inspection, or outcome measure. The status field is the dataset's current construction status at retrieval and may not describe status on the approval date.",
    duplicate_check_note: duplicateHints.length
      ? `Exact WPAA source id was not found in the manual corpus, but related manual-corpus text was found for: ${duplicateHints.slice(0, 4).join("; ")}. Treat as possible same-site or related-ZAP supplemental evidence during integration.`
      : "No exact WPAA ID, ZAP project ID, CPC report URL, or name match was found in the manual architecture corpus text during this worker pass.",
    related_links: {
      zap_link: cleanText(row.zap_link),
      cpc_report: cleanText(row.cpc_report),
      restrictive_declaration: cleanText(row.res_dec)
    },
    source_row_ref: {
      dataset_id: dataset.id,
      row_key: wpaaId,
      zap_project_id: zapProject
    },
    source_fields: trimRow(row, [
      "wpaa_id",
      "name",
      "status",
      "chair_cert",
      "cpc_approv",
      "maintenanc",
      "summary",
      "res_dec",
      "cpc_report",
      "sup_area",
      "wpaa_area",
      "zap_link",
      "hours_open",
      "waterway",
      "shore_area",
      "shore_line",
      "a_volleyct",
      "a_basketct",
      "a_fishing",
      "a_boating",
      "a_playgrnd",
      "a_splash",
      "a_otherrec",
      "a_swimming",
      "f_promenad",
      "f_seatlawn",
      "f_pier",
      "f_wetland",
      "f_dogrun",
      "f_edu_intp",
      "f_restroom",
      "f_shade",
      "f_art",
      "f_food_bev",
      "f_grpseat",
      "shape_leng",
      "shape_area"
    ])
  };
}

function sourceAudit(dataset, metadata, count, retained, rejected, extra) {
  const update = metadata?.metadata?.custom_fields?.Update || {};
  return {
    source_id: dataset.sourceId,
    dataset_id: dataset.id,
    source_name: dataset.name,
    publisher: dataset.publisher,
    source_url: dataset.page,
    api_endpoint: dataset.api,
    source_type: extra.source_type,
    license: "NYC Open Data Terms of Use / NYC.gov Terms of Use; no dataset-specific license was found in the Socrata metadata during this pass.",
    license_url: "https://www.nyc.gov/home/terms-of-use.page",
    coverage_years_checked: extra.coverage_years_checked,
    update_frequency: update["Update Frequency"] || "Not stated in fetched metadata",
    data_change_frequency: update["Data Change Frequency"] || "Not stated in fetched metadata",
    geographic_scope: extra.geographic_scope,
    granularity: extra.granularity,
    key_fields_for_events: extra.key_fields_for_events,
    reliability: extra.reliability,
    required_caveats: extra.required_caveats,
    ingestion_recommendation: extra.ingestion_recommendation,
    rows_fetched: count,
    candidates_retained: retained,
    rows_rejected_or_outside_scope: rejected
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const corpusText = readExistingCorpusText();

  const [popsMetadata, wpaaMetadata, popsRows, wpaaRows] = await Promise.all([
    fetchJson(DATASETS.pops.metadata, "POPS metadata"),
    fetchJson(DATASETS.wpaa.metadata, "WPAA metadata"),
    fetchAllRows(DATASETS.pops, "POPS rows"),
    fetchAllRows(DATASETS.wpaa, "WPAA rows")
  ]);

  const candidates = [];
  const rejected = [];
  for (const row of popsRows) {
    const candidate = popsCandidate(row, corpusText, rejected);
    if (candidate) candidates.push(candidate);
  }
  for (const row of wpaaRows) {
    const candidate = wpaaCandidate(row, corpusText, rejected);
    if (candidate) candidates.push(candidate);
  }

  candidates.sort((a, b) =>
    String(a.effective_date).localeCompare(String(b.effective_date)) ||
    String(a.source_record_id).localeCompare(String(b.source_record_id))
  );

  const sourceAudits = [
    sourceAudit(
      DATASETS.pops,
      popsMetadata,
      popsRows.length,
      candidates.filter((candidate) => candidate.source_ids.includes(DATASETS.pops.sourceId)).length,
      rejected.filter((reject) => reject.source_dataset_id === DATASETS.pops.id).length,
      {
        source_type: "official open-data point dataset",
        coverage_years_checked: "Rows with year_completed 2008 through 2026 and building_constructed='Completed'.",
        geographic_scope: "New York City privately owned public spaces attached to developments.",
        granularity: "One row per POPS building/development address, with DCP POPS number and source latitude/longitude.",
        key_fields_for_events: ["pops_number", "year_completed", "building_constructed", "public_space_type", "building_address_with_zip", "latitude", "longitude", "bbl", "bin"],
        reliability: "usable_with_caveats",
        required_caveats: [
          "Year completed is year precision and sourced by DCP from published information and owner discussions.",
          "The row does not document exact public opening date, current access compliance, public usage, or outcome effects.",
          "Coordinates are development points rather than legally surveyed public-space boundaries."
        ],
        ingestion_recommendation: "Use for public-space completion-year candidates where an official DCP POPS row adds provenance. Treat same-site architecture/DOB events as potential duplicates or supplemental evidence."
      }
    ),
    sourceAudit(
      DATASETS.wpaa,
      wpaaMetadata,
      wpaaRows.length,
      candidates.filter((candidate) => candidate.source_ids.includes(DATASETS.wpaa.sourceId)).length,
      rejected.filter((reject) => reject.source_dataset_id === DATASETS.wpaa.id).length,
      {
        source_type: "official open-data spatial multipolygon dataset",
        coverage_years_checked: "Rows with chair_cert or cpc_approv from 2008-01-01 through 2026-05-19.",
        geographic_scope: "New York City waterfront public access areas.",
        granularity: "One row per Waterfront Public Access Area, with WPAA ID, status, approval/certification date, links, features, and source multipolygon.",
        key_fields_for_events: ["wpaa_id", "name", "status", "chair_cert", "cpc_approv", "the_geom", "summary", "zap_link", "cpc_report", "wpaa_area", "waterway"],
        reliability: "strong for official approval/certification records and source geometry; usable with caveats for current status and delivery timing",
        required_caveats: [
          "Chair certification and CPC approval dates are administrative dates, not construction starts, completions, public openings, or compliance inspections.",
          "Current status may post-date the approval date.",
          "Candidate points are representative summaries of source multipolygons; production maps should use the official source geometry."
        ],
        ingestion_recommendation: "Use as a non-overlapping DCP waterfront-access evidence source. Emit approval/certification milestones, not opening or delivered-public-space claims unless corroborated by a separate source."
      }
    )
  ];

  const payload = {
    schema_version: "round130.nyc_official_more.v1",
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    accessed_at: ACCESSED_AT,
    scope: "Official NYC DCP public-space candidate records from POPS and Waterfront Public Access Areas, 2008-2026. Output is scratch integration material only.",
    source_audits: sourceAudits,
    candidate_count: candidates.length,
    candidates,
    rejected
  };

  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "source_audit.json"), `${JSON.stringify({
    schema_version: "round130.nyc_official_more.source_audit.v1",
    generated_at: `${ACCESSED_AT}T00:00:00Z`,
    sources: sourceAudits
  }, null, 2)}\n`);

  const bySource = {};
  for (const candidate of candidates) {
    const sourceId = candidate.source_ids[0];
    bySource[sourceId] = (bySource[sourceId] || 0) + 1;
  }
  const notes = [
    "# Round130 NYC Official More Candidates",
    "",
    `Generated ${candidates.length} candidate records from official NYC DCP open-data sources on ${ACCESSED_AT}.`,
    "",
    "## Sources Checked And Used",
    "",
    "- Privately Owned Public Spaces (POPS), dataset rvih-nhyn: retained completed rows with year_completed from 2008 through 2026.",
    "- Waterfront Public Access Areas (WPAAs), dataset 388s-pnvc: retained rows with chair certification or CPC approval dates from 2008-01-01 through 2026-05-19.",
    "",
    "## Candidate Count By Source",
    "",
    ...Object.entries(bySource).sort().map(([sourceId, count]) => `- ${sourceId}: ${count}`),
    "",
    "## Integration Caveats",
    "",
    "- POPS year_completed is year precision and should not be treated as an exact public opening or compliance date.",
    "- WPAA chair certification and CPC approval dates are administrative milestones, not observed construction or opening dates.",
    "- Candidate geometry is point geometry for review. WPAA production geometry should point back to the official source multipolygon.",
    "- Existing manual corpus text was scanned for source IDs, addresses, names, ZAP IDs, and report links; records with related-site hits carry duplicate_check_note for integration review."
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), `${notes}\n`);

  console.log(JSON.stringify({
    candidates: candidates.length,
    rejected: rejected.length,
    bySource,
    outDir: OUT_DIR
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
