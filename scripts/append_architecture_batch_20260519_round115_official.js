const fs = require("fs");

const path = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const retrievedAt = "2026-05-19";

const candidatePaths = {
  nycLpcIndividual: "tmp/subagents/round115_nyc_lpc_individual_official/round115_nyc_lpc_individual_candidates.json",
  nycLpcFuller: "tmp/subagents/round115_nyc_lpc_fuller_official/round115_nyc_lpc_fuller_candidates.json",
  nycDevelopment: "tmp/subagents/round115_nyc_development_records_codex/candidates.json",
  belfastOfficial: "tmp/subagents/round115_belfast_hed_planning_official/belfast_hed_planning_candidates_round115.json",
  belfastPublic: "tmp/subagents/round115_belfast_public_projects_codex/candidates.json",
  londonPublic: "tmp/subagents/round115_london_public_projects_codex/candidates.json",
  londonOfficial: "tmp/subagents/round115_london_nhle_official/round115_london_nhle_official_candidates.json"
};

const acceptedBelfastPublicIds = new Set([
  "bfs_public_project_ulster_hall_refurbishment_2008_2009",
  "bfs_public_project_city_hall_visitor_exhibition_2017",
  "bfs_public_project_belfast_streets_ahead_phase3_2016",
  "bfs_public_project_belfast_streets_ahead_phase5_screening_2021",
  "bfs_public_project_cathedral_gardens_transformation_2026_2027",
  "bfs_public_project_shankill_gateway_phase1_2026"
]);

const rejectedLondonPublicIds = new Set([
  "lon_public_project_tfl_bond_street_elizabeth_line_station_opening_2022",
  "lon_public_project_tfl_canary_wharf_elizabeth_line_station_transfer_2022"
]);

const acceptedFullerLpcNumbers = new Set(["LP-02254", "LP-02235"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

const doc = readJson(path);

const sourceEntries = [
  {
    source_id: "bcc-planning-decisions-june-2025-round115",
    city_ids: ["belfast"],
    title: "Belfast City Council planning decisions issued June 2025",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture",
    access_url: "https://minutes.belfastcity.gov.uk/documents/s122645/Planning%20Applications%20Issued%20June%202025.pdf",
    licence: "Belfast City Council copyright; factual metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2025, end: 2025 },
    time_coverage: "June 2025 planning decision list records selected for architecture, heritage, conservation-area, and project-stage relevance.",
    spatial_granularity: "Planning application, listed-building consent, conservation-area consent, or proposal notice point from named address.",
    temporal_granularity: "Decision-list month and application reference.",
    update_frequency: "Monthly decision-list publication",
    retrieved_at: retrievedAt,
    limitations: "Decision-list rows document planning, listed-building consent, conservation-area consent, or proposal-notice status. They do not document construction start, completion, occupation, opening, installation, public use, or outcome effects."
  },
  {
    source_id: "dfi-ni-public-project-pages",
    city_ids: ["belfast"],
    title: "Department for Infrastructure NI public project pages",
    publisher: "Department for Infrastructure, Northern Ireland",
    bucket: "planning/development/architecture/transport_infrastructure",
    access_url: "https://www.infrastructure-ni.gov.uk/",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected dated DfI transport and infrastructure project-stage records in the architecture corpus window.",
    spatial_granularity: "Named project or station site point.",
    temporal_granularity: "Publication date or project-stage date stated by DfI.",
    update_frequency: "Project/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "DfI project pages document official project-stage records. They are not evidence of final completion, public opening, service performance, usage, regeneration effects, or every works package unless separately stated."
  },
  {
    source_id: "translink-public-project-pages",
    city_ids: ["belfast"],
    title: "Translink public project and station pages",
    publisher: "Translink / Northern Ireland Transport Holding Company",
    bucket: "planning/development/architecture/transport_infrastructure",
    access_url: "https://www.translink.co.uk/",
    licence: "Translink website terms; factual metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.translink.co.uk/usingtranslink/legalinformation",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected dated Translink station and project-stage records in the architecture corpus window.",
    spatial_granularity: "Named station or project site point.",
    temporal_granularity: "Publication date or project-stage date stated by Translink.",
    update_frequency: "Project/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "Translink project pages document project-stage or station records. They are not evidence of every works package, final public realm delivery, service performance, usage, regeneration effects, or later operational outcomes unless separately stated."
  }
];

for (const sourceEntry of sourceEntries) {
  const index = doc.sources.findIndex((source) => source.source_id === sourceEntry.source_id);
  if (index >= 0) {
    doc.sources[index] = { ...doc.sources[index], ...sourceEntry };
  } else {
    doc.sources.push(sourceEntry);
  }
}

const sourceIdAliases = {
  "dfc-hed-buildings-nidirect-round115": "dfc-hed-nidirect-buildings",
  "dfi-transport-hub-main-works-2022-round115": "dfi-ni-public-project-pages",
  "translink-grand-central-topping-out-2023-round115": "translink-public-project-pages",
  "historic-england-nhle-open-data": "historic-england-nhle",
  "historic-england-har-open-data": "historic-england-har-2025",
  "mhclg-pins-called-in-recovered-decisions": "mhclg-called-in-decisions",
  "nyc-lpc-designated-calendared-buildings-sites-20260519": "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs"
};

const familySourceIds = {
  "DCP ZAP project data": "nyc-dcp-zap-project-data",
  "DOB Certificate Of Occupancy": "nyc-dob-co-bs8b-p36w",
  "DOB NOW Certificate of Occupancy": "nyc-dob-now-co-pkdm-hqz6",
  "HPD Affordable Housing Production by Building": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "NYC Parks Capital Project Tracker": "nyc-parks-capital-project-tracker-4hcv-tc5r"
};

const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));

function safeText(value) {
  return String(value || "")
    .replace(/\bdoes not prove\b/gi, "does not document")
    .replace(/\bnot proof of\b/gi, "not evidence of")
    .replace(/\bas proof of\b/gi, "as evidence of")
    .replace(/\bproof that\b/gi, "evidence that")
    .replace(/\bproof\b/gi, "evidence")
    .replace(/\bproves?\b/gi, "documents")
    .replace(/\bcaused\b/gi, "was associated with")
    .replace(/\bwill increase\b/gi, "is described as intended to increase")
    .replace(/\bwill decrease\b/gi, "is described as intended to decrease");
}

function canonicalSourceId(sourceId) {
  return sourceIdAliases[sourceId] || sourceId;
}

function slugify(value) {
  return safeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, 96)
    .replace(/_+$/g, "");
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{4}-\d{2}$/.test(text)) return text;
  if (/^\d{4}$/.test(text)) return text;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return text;
}

function datePrecision(value) {
  const text = String(value || "");
  if (/^\d{4}$/.test(text)) return "year";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  return "day";
}

function normalizeDateForComparison(value) {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function pointFromCandidate(candidate) {
  if (candidate.lat !== undefined || candidate.lon !== undefined) {
    return { lat: Number(candidate.lat), lon: Number(candidate.lon) };
  }
  if (candidate.latitude !== undefined || candidate.longitude !== undefined) {
    return { lat: Number(candidate.latitude), lon: Number(candidate.longitude) };
  }
  if (candidate.coordinates) {
    return {
      lat: Number(candidate.coordinates.lat ?? candidate.coordinates.latitude),
      lon: Number(candidate.coordinates.lon ?? candidate.coordinates.longitude)
    };
  }
  return null;
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

function centroidFromFeatureCollection(featureCollection) {
  const coordinates = [];
  for (const feature of featureCollection?.features || []) {
    eachCoordinate(feature.geometry, (coordinate) => {
      const lon = Number(coordinate[0]);
      const lat = Number(coordinate[1]);
      if (Number.isFinite(lon) && Number.isFinite(lat)) coordinates.push([lon, lat]);
    });
  }
  if (coordinates.length === 0) return null;
  const sums = coordinates.reduce((acc, coordinate) => {
    acc.lon += coordinate[0];
    acc.lat += coordinate[1];
    return acc;
  }, { lon: 0, lat: 0 });
  return {
    lon: Number((sums.lon / coordinates.length).toFixed(7)),
    lat: Number((sums.lat / coordinates.length).toFixed(7))
  };
}

async function fetchZapPoint(projectId) {
  const response = await fetch(`https://zap-api-production.herokuapp.com/projects/${encodeURIComponent(projectId)}`);
  if (!response.ok) return null;
  const json = await response.json();
  const attrs = json?.data?.attributes || {};
  const point = centroidFromFeatureCollection(attrs["bbl-featurecollection"]);
  if (!point) return null;
  return {
    point,
    geometrySource: "Official DCP ZAP project bbl-featurecollection geometry from the ZAP API.",
    geometryPrecision: "Approximate navigation point from averaged official BBL polygon vertices; not a surveyed building centroid, project boundary, construction footprint, or public-access boundary."
  };
}

function parseDobNowIssuanceDate(candidate) {
  const text = String(candidate.date_range?.issuance_text || "");
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return normalizeDate(candidate.date);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventBase(candidate) {
  const sourceId = canonicalSourceId(candidate.source_dataset_id || candidate.source_id);
  const sourceIds = (candidate.source_ids || [sourceId]).map(canonicalSourceId);
  return {
    city_id: candidate.city_id,
    event_id: safeText(candidate.event_id),
    date: normalizeDate(candidate.date || candidate.effective_date),
    date_precision: candidate.date_precision || candidate.effective_date_precision || datePrecision(normalizeDate(candidate.date || candidate.effective_date)),
    bucket: safeText(candidate.category || "architecture/official_record"),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change),
    area: safeText(candidate.location_name || candidate.address || candidate.area || candidate.city_id),
    latitude: candidate.lat ?? candidate.latitude,
    longitude: candidate.lon ?? candidate.longitude,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name),
    publisher: safeText(candidate.publisher),
    source_url: candidate.source_url,
    source_record_id: safeText(candidate.source_record_id),
    source_type: safeText(candidate.source_type),
    source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || candidate.retrieved_at || retrievedAt,
    source_date_field: safeText(candidate.source_date_field || "Observed administrative date from the cited source record."),
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: safeText(candidate.architect || "Source record does not name a project architect."),
    project_type: safeText(candidate.subcategory || candidate.category || "official architecture-related administrative record"),
    geometry_source: safeText(candidate.geometry_source),
    geometry_precision: safeText(candidate.geometry_precision),
    license_or_terms_note: safeText(candidate.license || candidate.license_or_terms_note || candidate.license_terms),
    attribution: safeText(candidate.attribution || candidate.publisher),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(candidate.transformation_method || "Round115 official-source candidate normalized into the manual architecture milestone schema.")
  };
}

function fromLpcIndividual(candidate) {
  return {
    ...eventBase(candidate),
    transformation_method: safeText(`${candidate.transformation_method} Appended by scripts/append_architecture_batch_20260519_round115_official.js after LP-number duplicate screening, provenance checks, overclaim wording cleanup, date guard, and city coordinate-envelope validation.`)
  };
}

function fromBelfastOrLondonOfficial(candidate) {
  return {
    ...eventBase(candidate),
    event_id: safeText(candidate.event_id).replace(/_round115$/, ""),
    transformation_method: safeText(`${candidate.transformation_method} Appended by scripts/append_architecture_batch_20260519_round115_official.js after source-ID canonicalization, duplicate screening, provenance checks, overclaim wording cleanup, date guard, and city coordinate-envelope validation.`)
  };
}

function fromPublicProject(candidate, cityId) {
  const point = pointFromCandidate(candidate);
  const rawDate = normalizeDate(candidate.date || candidate.date_or_range?.match(/\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\d{4}/)?.[0]);
  const sourceId = cityId === "london"
    ? sourceIdForLondonPublic(candidate)
    : "belfast-architecture-public-pages";
  const stableId = candidate.stable_id || candidate.id;
  const eventPrefix = cityId === "london" ? "lon_arch_" : "bfs_arch_";
  const eventToken = stableId
    .replace(/^lon_public_project_/, "public_project_")
    .replace(/^bfs_public_project_/, "public_project_");
  return {
    city_id: cityId,
    event_id: `${eventPrefix}${slugify(eventToken)}`,
    date: rawDate,
    date_precision: datePrecision(rawDate),
    bucket: "planning/development/architecture/public_project",
    title: safeText(candidate.title),
    summary: safeText(candidate.observed_change || candidate.title),
    observed_change: safeText(candidate.observed_change || candidate.observed_change_type || candidate.title),
    area: safeText(candidate.location || candidate.address_or_location),
    latitude: point?.lat,
    longitude: point?.lon,
    source_ids: [sourceId],
    source_name: safeText(candidate.source_name || candidate.publisher),
    publisher: safeText(candidate.publisher),
    source_url: candidate.source_url,
    source_record_id: safeText(stableId),
    source_type: "official public project, planning, decision, or institutional web page",
    source_retrieved_at: retrievedAt,
    source_date_field: safeText(`Candidate date field: ${candidate.date || candidate.date_or_range || "source page date"}.`),
    source_dataset_id: sourceId,
    confidence: candidate.confidence || "documented",
    architect: "Source record does not name a project architect.",
    project_type: safeText(candidate.observed_change_type || "official public project milestone"),
    geometry_source: safeText(`Approximate navigation point from the candidate location: ${candidate.location || candidate.address_or_location}.`),
    geometry_precision: safeText(candidate.coordinates?.precision || "approximate site point, not a measured boundary or works footprint"),
    license_or_terms_note: safeText(candidate.license_terms || candidate.license_terms_access_note),
    attribution: safeText(candidate.publisher),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(`Round115 public-project candidate ${stableId} from ${cityId}; selected only when the source had an observed date or official administrative milestone, screened against existing manual records by title/source terms, normalized to the architecture milestone schema, and appended by scripts/append_architecture_batch_20260519_round115_official.js.`)
  };
}

function sourceIdForLondonPublic(candidate) {
  const url = String(candidate.source_url || "");
  const id = String(candidate.stable_id || "");
  if (url.includes("gov.uk/government/publications/recovered-appeal")) return "mhclg-called-in-decisions";
  if (url.includes("london.gov.uk/programmes-strategies/planning") || id.includes("_gla_")) return "gla-planning-application-decisions";
  return "london-architecture-public-pages";
}

async function fromNycDevelopment(candidate) {
  const sourceId = familySourceIds[candidate.source_family];
  if (!sourceId) throw new Error(`Unknown NYC development source family: ${candidate.source_family}`);

  const location = candidate.location || {};
  const point = pointFromCandidate(candidate);
  let finalPoint = point;
  let geometrySource = "Official NYC Open Data row latitude/longitude field.";
  let geometryPrecision = "official row point, not a measured building or project footprint";
  if ((!finalPoint || !Number.isFinite(finalPoint.lat) || !Number.isFinite(finalPoint.lon)) && candidate.source_family === "DCP ZAP project data") {
    const zapGeometry = await fetchZapPoint(candidate.stable_source_row_id);
    if (zapGeometry) {
      finalPoint = zapGeometry.point;
      geometrySource = zapGeometry.geometrySource;
      geometryPrecision = zapGeometry.geometryPrecision;
    }
  }
  if (!finalPoint) return null;

  const sourceUrl = candidate.source_api_query || candidate.source_url;
  const date = candidate.source_family === "DOB NOW Certificate of Occupancy"
    ? parseDobNowIssuanceDate(candidate)
    : normalizeDate(candidate.date);
  const address = location.address || location.address_or_site || location.park_or_site || location.borough || "New York City";
  const eventKind = {
    "DCP ZAP project data": "dcp_zap_project_recorded",
    "DOB Certificate Of Occupancy": "dob_legacy_co_issued",
    "DOB NOW Certificate of Occupancy": "dob_now_co_issued",
    "HPD Affordable Housing Production by Building": "hpd_affordable_building_completion",
    "NYC Parks Capital Project Tracker": "parks_capital_project_completed"
  }[candidate.source_family];
  const recordToken = slugify(candidate.stable_source_row_id || candidate.id);

  return {
    city_id: "nyc",
    event_id: `nyc_arch_${eventKind}_${recordToken}`,
    date,
    date_precision: candidate.source_family === "NYC Parks Capital Project Tracker" ? "month" : datePrecision(date),
    bucket: "planning/development/architecture/official_record",
    title: safeText(candidate.title),
    summary: safeText(`${candidate.source_publisher} records ${candidate.title.replace(/^DCP ZAP completed project: /, "").replace(/^NYC Parks completed capital project: /, "")} as a documented ${candidate.source_family} milestone at ${address}.`),
    observed_change: safeText(observedChangeForNycDevelopment(candidate)),
    area: safeText([address, location.borough].filter(Boolean).join(", ")),
    latitude: finalPoint.lat,
    longitude: finalPoint.lon,
    source_ids: [sourceId],
    source_name: safeText(sourceNameForNycDevelopment(candidate.source_family)),
    publisher: safeText(candidate.source_publisher),
    source_url: sourceUrl,
    source_record_id: safeText(candidate.stable_source_row_id),
    source_type: "official NYC Open Data Socrata API row",
    source_retrieved_at: candidate.retrieved_at || retrievedAt,
    source_date_field: safeText(sourceDateFieldForNycDevelopment(candidate)),
    source_dataset_id: sourceId,
    confidence: candidate.confidence,
    architect: "Source record does not name a project architect.",
    project_type: safeText(candidate.source_family),
    geometry_source: safeText(geometrySource),
    geometry_precision: safeText(geometryPrecision),
    license_or_terms_note: "NYC Open Data / NYC.gov terms; dataset metadata license field is null unless the dataset page states otherwise.",
    attribution: safeText(candidate.source_publisher),
    limitations: safeText(candidate.limitations),
    transformation_method: safeText(`Round115 NYC non-LPC candidate ${candidate.id}; normalized from ${candidate.source_family}; stable row id ${candidate.stable_source_row_id}; source query ${sourceUrl}; appended by scripts/append_architecture_batch_20260519_round115_official.js after duplicate screening, date normalization, provenance checks, overclaim wording cleanup, current-date guard, and city coordinate-envelope validation.`)
  };
}

function sourceNameForNycDevelopment(sourceFamily) {
  return {
    "DCP ZAP project data": "NYC Open Data: DCP Zoning Application Portal Project Data",
    "DOB Certificate Of Occupancy": "NYC Open Data: DOB Certificate Of Occupancy",
    "DOB NOW Certificate of Occupancy": "NYC Open Data: DOB NOW Certificate of Occupancy",
    "HPD Affordable Housing Production by Building": "NYC Open Data: Affordable Housing Production by Building",
    "NYC Parks Capital Project Tracker": "NYC Open Data: NYC Parks Capital Project Tracker"
  }[sourceFamily] || sourceFamily;
}

function observedChangeForNycDevelopment(candidate) {
  if (candidate.source_family === "DCP ZAP project data") {
    return `NYC DCP ZAP recorded project ${candidate.stable_source_row_id} as ${candidate.evidence_fields?.public_status || "an administrative planning milestone"}; this is a land-use/project status record.`;
  }
  if (candidate.source_family === "DOB Certificate Of Occupancy" || candidate.source_family === "DOB NOW Certificate of Occupancy") {
    return "NYC DOB recorded a certificate-of-occupancy issuance/status milestone for the cited building or job.";
  }
  if (candidate.source_family === "HPD Affordable Housing Production by Building") {
    return "NYC HPD recorded an affordable-housing production building completion/counting milestone for the cited building row.";
  }
  return "NYC Parks recorded a completed capital-project milestone for the cited tracker row.";
}

function sourceDateFieldForNycDevelopment(candidate) {
  if (candidate.source_family === "DOB NOW Certificate of Occupancy") {
    return `c_of_o_issuance_date text (${candidate.date_range?.issuance_text || "not supplied"}) normalized when parseable; submitted_date retained in candidate notes.`;
  }
  if (candidate.source_family === "NYC Parks Capital Project Tracker") {
    return "construction_actual_completion month/date from the Parks Capital Project Tracker row.";
  }
  if (candidate.source_family === "HPD Affordable Housing Production by Building") {
    return "building_completion date from the HPD Affordable Housing Production by Building row.";
  }
  if (candidate.source_family === "DCP ZAP project data") {
    return "project completed/approved date from the DCP ZAP project row.";
  }
  return "Observed administrative date from the cited source record.";
}

function sourceToken(event) {
  const text = `${event.source_record_id || ""} ${event.source_url || ""}`;
  if (event.source_dataset_id === "nyc-parks-capital-project-tracker-4hcv-tc5r") {
    const match = text.match(/(?:trackerid[=\s]*)?(\d{3,})/i);
    return match ? match[1] : text;
  }
  if (event.source_dataset_id === "nyc-dcp-zap-project-data") {
    const match = text.match(/\b20\d{2}[A-Z]\d{4}\b/);
    return match ? match[0] : text;
  }
  if (/nyc-dob/.test(event.source_dataset_id)) {
    const match = text.match(/\b(?:CO-\d{6,}|\d{8,})\b/);
    return match ? match[0] : text;
  }
  if (event.source_dataset_id === "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr") {
    return text.match(/\d+:\d+/)?.[0] || text;
  }
  if (event.source_dataset_id === "nyc-lpc-individual-landmark-sites-buis-pvji" || event.source_dataset_id === "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs") {
    return text.match(/LP-\d{5}/i)?.[0]?.toUpperCase() || text;
  }
  if (/historic-england/.test(event.source_dataset_id)) {
    return text.match(/\b(?:NHLE ListEntry )?\d{6,7}\b/)?.[0]?.replace("NHLE ListEntry ", "") || text;
  }
  return text.trim().toLowerCase();
}

function buildExistingSourceTokens(events) {
  const bySource = new Map();
  for (const event of events) {
    const sourceIds = event.source_ids || [event.source_dataset_id].filter(Boolean);
    for (const rawSourceId of sourceIds) {
      const sourceId = canonicalSourceId(rawSourceId);
      const token = sourceToken({ ...event, source_dataset_id: sourceId });
      if (!token) continue;
      if (!bySource.has(sourceId)) bySource.set(sourceId, new Set());
      bySource.get(sourceId).add(token);
    }
  }
  return bySource;
}

const existingSourceTokens = buildExistingSourceTokens(doc.events);
const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));

function isExistingSourceRecord(event) {
  const token = sourceToken(event);
  return existingSourceTokens.get(event.source_dataset_id)?.has(token);
}

function addBatchSourceToken(event, batchSourceTokens) {
  const token = sourceToken(event);
  const key = `${event.source_dataset_id}|${token}`;
  if (batchSourceTokens.has(key)) return false;
  batchSourceTokens.add(key);
  return true;
}

async function main() {
  const rows = [];
  const rejections = [];

  const nycLpcIndividual = readJson(candidatePaths.nycLpcIndividual).candidates;
  rows.push(...nycLpcIndividual.map(fromLpcIndividual));

  const nycLpcFuller = readJson(candidatePaths.nycLpcFuller).candidates
    .filter((candidate) => acceptedFullerLpcNumbers.has(String(candidate.source_record_id || "").toUpperCase()));
  rows.push(...nycLpcFuller.map(fromBelfastOrLondonOfficial));

  const nycDevelopment = readJson(candidatePaths.nycDevelopment).candidates;
  for (const candidate of nycDevelopment) {
    const event = await fromNycDevelopment(candidate);
    if (event) rows.push(event);
    else rejections.push({ id: candidate.id, reason: "Missing source geometry after attempted enrichment." });
  }

  const belfastOfficial = readJson(candidatePaths.belfastOfficial).candidates;
  rows.push(...belfastOfficial.map(fromBelfastOrLondonOfficial));

  const belfastPublic = readJson(candidatePaths.belfastPublic).candidates
    .filter((candidate) => acceptedBelfastPublicIds.has(candidate.id));
  rows.push(...belfastPublic.map((candidate) => fromPublicProject(candidate, "belfast")));

  const londonPublic = readJson(candidatePaths.londonPublic).candidates
    .filter((candidate) => !rejectedLondonPublicIds.has(candidate.stable_id));
  rows.push(...londonPublic.map((candidate) => fromPublicProject(candidate, "london")));

  const londonOfficial = readJson(candidatePaths.londonOfficial).candidates;
  rows.push(...londonOfficial.map(fromBelfastOrLondonOfficial));

  const batchSourceTokens = new Set();
  const records = [];
  for (const event of rows) {
    const titleDateKey = `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`;
    if (existingTitleDateKeys.has(titleDateKey)) {
      rejections.push({ id: event.event_id, reason: `Existing title/date key: ${titleDateKey}` });
      continue;
    }
    if (isExistingSourceRecord(event)) {
      rejections.push({ id: event.event_id, reason: `Existing source token for ${event.source_dataset_id}: ${sourceToken(event)}` });
      continue;
    }
    if (!addBatchSourceToken(event, batchSourceTokens)) {
      rejections.push({ id: event.event_id, reason: `Duplicate source token inside batch for ${event.source_dataset_id}: ${sourceToken(event)}` });
      continue;
    }
    records.push(event);
  }

  validateRecords(records);

  doc.events.push(...records);
  doc.events.sort((a, b) => (
    a.city_id.localeCompare(b.city_id) ||
    String(a.date).localeCompare(String(b.date)) ||
    a.event_id.localeCompare(b.event_id)
  ));
  doc.sources.sort((a, b) => a.source_id.localeCompare(b.source_id));

  const tmpPath = `${path}.round115-official.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
  fs.renameSync(tmpPath, path);

  const counts = doc.events.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedByCity = records.reduce((acc, event) => {
    acc[event.city_id] = (acc[event.city_id] || 0) + 1;
    return acc;
  }, {});
  const addedBySource = records.reduce((acc, event) => {
    acc[event.source_dataset_id] = (acc[event.source_dataset_id] || 0) + 1;
    return acc;
  }, {});
  console.log(JSON.stringify({
    added: records.length,
    rejected: rejections.length,
    addedByCity,
    addedBySource,
    counts,
    total: doc.events.length,
    rejections
  }, null, 2));
}

function validateRecords(records) {
  const requiredFields = [
    "city_id",
    "event_id",
    "date",
    "bucket",
    "title",
    "summary",
    "observed_change",
    "area",
    "latitude",
    "longitude",
    "source_ids",
    "source_name",
    "publisher",
    "source_url",
    "source_record_id",
    "source_type",
    "source_retrieved_at",
    "source_date_field",
    "source_dataset_id",
    "confidence",
    "architect",
    "project_type",
    "geometry_source",
    "geometry_precision",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "transformation_method"
  ];

  for (const event of records) {
    for (const field of requiredFields) {
      const value = event[field];
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
        throw new Error(`Missing ${field} for ${event.event_id}`);
      }
    }
    if (event.city_id === "belfast" && !/^bfs_arch_/.test(event.event_id)) throw new Error(`Unexpected Belfast event_id prefix: ${event.event_id}`);
    if (event.city_id === "london" && !/^lon_arch_/.test(event.event_id)) throw new Error(`Unexpected London event_id prefix: ${event.event_id}`);
    if (event.city_id === "nyc" && !/^nyc_arch_/.test(event.event_id)) throw new Error(`Unexpected NYC event_id prefix: ${event.event_id}`);
    if (!String(event.source_url).startsWith("http")) throw new Error(`Invalid source URL for ${event.event_id}`);
    if (!["documented", "corroborated", "inferred", "disputed"].includes(event.confidence)) {
      throw new Error(`Invalid confidence for ${event.event_id}: ${event.confidence}`);
    }
    for (const sourceId of event.source_ids) {
      if (!knownSourceIds.has(sourceId)) throw new Error(`Unknown source_id ${sourceId} for ${event.event_id}`);
    }
  }

  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|simulates?|will increase|will decrease|impact score)\b/i;
  for (const event of records) {
    const checked = [
      event.title,
      event.summary,
      event.observed_change,
      event.limitations,
      event.transformation_method,
      event.source_date_field,
      event.project_type
    ].join(" ");
    if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
  }

  const batchIds = new Set();
  const batchSourceKeys = new Set();
  for (const event of records) {
    if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
    batchIds.add(event.event_id);

    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
    batchSourceKeys.add(sourceKey);
  }

  const existingIds = new Set(doc.events.map((event) => event.event_id));
  const duplicateIds = records.filter((event) => existingIds.has(event.event_id)).map((event) => event.event_id);
  if (duplicateIds.length > 0) throw new Error(`Duplicate event_id values: ${duplicateIds.join(", ")}`);

  const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
  const duplicateSourceRecords = records
    .filter((event) => existingSourceKeys.has(`${event.city_id}|${event.source_url}|${event.source_record_id}`))
    .map((event) => event.event_id);
  if (duplicateSourceRecords.length > 0) throw new Error(`Duplicate source records: ${duplicateSourceRecords.join(", ")}`);

  const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
  const duplicateTitleDates = records
    .filter((event) => existingTitleDateKeys.has(`${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`))
    .map((event) => event.event_id);
  if (duplicateTitleDates.length > 0) throw new Error(`Duplicate title/date records: ${duplicateTitleDates.join(", ")}`);

  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const futureRecords = records.filter((event) => new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`) > latestAllowedDate);
  if (futureRecords.length > 0) throw new Error(`Future-dated records: ${futureRecords.map((event) => event.event_id).join(", ")}`);

  const cityEnvelopes = {
    belfast: { minLon: -6.12, maxLon: -5.74, minLat: 54.45, maxLat: 54.75 },
    london: { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 },
    nyc: { minLon: -74.2591, maxLon: -73.7004, minLat: 40.4774, maxLat: 40.9176 }
  };

  for (const event of records) {
    const envelope = cityEnvelopes[event.city_id];
    const longitude = Number(event.longitude);
    const latitude = Number(event.latitude);
    if (
      !envelope ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < envelope.minLon ||
      longitude > envelope.maxLon ||
      latitude < envelope.minLat ||
      latitude > envelope.maxLat
    ) {
      throw new Error(`Invalid or outside-${event.city_id}-envelope coordinates for ${event.event_id}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
