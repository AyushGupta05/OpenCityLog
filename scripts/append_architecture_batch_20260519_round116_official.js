const fs = require("fs");

const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const retrievedAt = "2026-05-19";

const candidatePaths = {
  londonPlanning: "tmp/subagents/round116_london_planning_official/candidates.json",
  londonHeritage: "tmp/subagents/round116_london_heritage_official/candidates.json",
  belfastPlanning: "tmp/subagents/round116_belfast_planning_official/candidates.json",
  belfastHeritageProjects: "tmp/subagents/round116_belfast_heritage_projects/candidates.json",
  nycLpcPermits: "tmp/subagents/round116_nyc_lpc_permits_official/candidates.json",
  nycPublicProjects: "tmp/subagents/round116_nyc_public_projects_official/candidates.json"
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

const doc = readJson(corpusPath);

const sourceEntries = [
  {
    source_id: "historic-england-har-annual-map-series-2016-2025",
    city_ids: ["london"],
    title: "Historic England Heritage at Risk annual map series, 2016-2025",
    publisher: "Historic England",
    bucket: "planning/development/architecture/heritage_at_risk",
    access_url: "https://historicengland.org.uk/listing/heritage-at-risk/search-register/annual-heritage-at-risk-registers-and-maps/",
    licence: "Open Government Licence v3.0 / Historic England open-data terms where stated; older annual map services require terms caveat.",
    licence_url: "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/",
    coverage_years: { start: 2016, end: 2025 },
    time_coverage: "Annual Heritage at Risk map/open-data rows for 2016-2025, with first-observed post-2016 London status rows selected in Round116.",
    spatial_granularity: "Historic England annual row point or polygon centroid filtered to Greater London.",
    temporal_granularity: "Annual register/map snapshot year; not an exact day of condition change.",
    update_frequency: "Annual register publication",
    retrieved_at: retrievedAt,
    limitations: "Heritage-at-risk annual rows document register/status observations. They are not evidence of construction, repair completion, ownership change, opening, closure, public access, exact condition-change date, or outcome effects."
  },
  {
    source_id: "ni-planning-portal-public-register",
    city_ids: ["belfast"],
    title: "Northern Ireland Planning Portal public register records",
    publisher: "Northern Ireland Planning Portal / planning authorities",
    bucket: "planning/development/architecture",
    access_url: "https://planningregister.planningsystemni.gov.uk/",
    licence: "Planning Portal public-register terms; factual metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://planningregister.planningsystemni.gov.uk/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Application-specific public-register rows cited by Round116 Belfast planning candidates.",
    spatial_granularity: "Planning-portal easting/northing or approximate site point.",
    temporal_granularity: "Application, validation, advertisement, decision, or portal status dates.",
    update_frequency: "Live application-specific public register",
    retrieved_at: retrievedAt,
    limitations: "Planning Portal rows document administrative planning status. They are not evidence of construction start, completion, occupation, opening, public use, or physical works unless a separate source states that."
  },
  {
    source_id: "bcc-current-planning-applications",
    city_ids: ["belfast"],
    title: "Belfast City Council current planning applications",
    publisher: "Belfast City Council",
    bucket: "planning/development/architecture",
    access_url: "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications",
    licence: "Belfast City Council copyright; factual metadata and source URLs retained pending fuller reuse review.",
    licence_url: "https://www.belfastcity.gov.uk/Copyright",
    coverage_years: { start: 2026, end: 2026 },
    time_coverage: "Current application advertisements and related application-stage records selected in Round116.",
    spatial_granularity: "Planning application, address, or approximate site point.",
    temporal_granularity: "Validation, advertisement, or public-list date where stated.",
    update_frequency: "Live/current application list",
    retrieved_at: retrievedAt,
    limitations: "Current-application records document live administrative application stages. They are not decisions, construction starts, completions, occupations, openings, or delivered physical changes unless separately evidenced."
  },
  {
    source_id: "dfc-harni-belfast",
    city_ids: ["belfast"],
    title: "Heritage at Risk in Northern Ireland Belfast records",
    publisher: "Department for Communities Historic Environment Division / nidirect",
    bucket: "planning/development/architecture/heritage_at_risk",
    access_url: "https://apps.communities-ni.gov.uk/HARNI/",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector factual information unless otherwise stated; images, logos, mapping, and third-party material excluded.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected Belfast HARNI record dates, review years, and status notes in the architecture corpus window.",
    spatial_granularity: "Listed building or site approximate address point.",
    temporal_granularity: "HARNI original record date, narrative review year, or stated restoration/status year.",
    update_frequency: "Record-specific update/review cadence",
    retrieved_at: retrievedAt,
    limitations: "HARNI records document heritage-risk or safe-status observations. They are not construction, repair completion, reuse, safety, occupation, ownership, or outcome evidence unless directly stated and separately framed."
  },
  {
    source_id: "dfc-heritage-regeneration-pages",
    city_ids: ["belfast"],
    title: "Department for Communities heritage and regeneration public pages",
    publisher: "Department for Communities, Northern Ireland",
    bucket: "planning/development/architecture/heritage_regeneration",
    access_url: "https://www.communities-ni.gov.uk/",
    licence: "Crown copyright / Open Government Licence v3.0 for public-sector factual information unless otherwise stated.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected dated DfC heritage, regeneration, development brief, and conservation-work status pages in Round116.",
    spatial_granularity: "Named site, property, or approximate address point.",
    temporal_granularity: "Publication date, project-stage date, or source-stated status year.",
    update_frequency: "Page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "DfC public pages document official status, funding, brief, or project-stage records. They are not final permission, construction, completion, public opening, occupation, or long-term reuse evidence unless separately stated."
  },
  {
    source_id: "nyc-ddc-public-building-press-pages",
    city_ids: ["nyc"],
    title: "NYC Department of Design and Construction public building press pages",
    publisher: "NYC Department of Design and Construction",
    bucket: "planning/development/architecture/public_facilities",
    access_url: "https://www.nyc.gov/site/ddc/about/press-releases.page",
    licence: "NYC.gov terms; factual metadata and source URLs retained with publisher attribution.",
    licence_url: "https://www.nyc.gov/home/terms-of-use.page",
    coverage_years: { start: 2008, end: 2026 },
    time_coverage: "Selected dated DDC public-building, project-delivery, and sustainability milestone pages.",
    spatial_granularity: "Named public building/project address where supplied; coordinates require an official geocoding or facility source.",
    temporal_granularity: "Press page publication date and source-stated project dates.",
    update_frequency: "Press/page-specific publication",
    retrieved_at: retrievedAt,
    limitations: "DDC pages document official announcements or project milestones. Procurement and certification records are not construction start, completion, opening, occupancy, usage, or outcome evidence unless separately stated."
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
  "historic-england-nhle-open-data-2026-05-18": "historic-england-nhle",
  "historic-england-nhle": "historic-england-nhle",
  "historic-england-heritage-at-risk": "historic-england-har-annual-map-series-2016-2025",
  "historic-england-har-annual-map-series-2016-2025": "historic-england-har-annual-map-series-2016-2025",
  "bcc-planning-committee-minutes-round116": "bcc-planning-committee-minutes",
  "bcc-current-planning-applications-round116": "bcc-current-planning-applications",
  "dfi-regionally-significant-called-in-round116": "dfi-called-in-planning-documents",
  "ni-planning-portal-public-register-round116": "ni-planning-portal-public-register",
  "round116-nidirect-harni-belfast": "dfc-harni-belfast",
  "round116-dfc-heritage-regeneration-pages": "dfc-heritage-regeneration-pages",
  "round116-dfi-project-and-procurement-pages": "dfi-ni-public-project-pages",
  "round116-bcc-news-and-planning-pages": "belfast-architecture-public-pages",
  "4hcv-tc5r": "nyc-parks-capital-project-tracker-4hcv-tc5r",
  "hg8x-zxpr": "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr",
  "pkdm-hqz6": "nyc-dob-now-co-pkdm-hqz6",
  "hgx4-8ukb": "nyc-dcp-zap-project-data",
  "nyc-ddc-press-2026": "nyc-ddc-public-building-press-pages",
  "NYC DDC official page": "nyc-ddc-public-building-press-pages"
};

function canonicalSourceId(sourceId) {
  return sourceIdAliases[sourceId] || sourceId;
}

function safeText(value) {
  const text = Array.isArray(value) ? value.join(" ") : String(value || "");
  return text
    .replace(/\bdoes not prove\b/gi, "is not evidence of")
    .replace(/\bnot proof of\b/gi, "not evidence of")
    .replace(/\bas proof of\b/gi, "as evidence of")
    .replace(/\bproof that\b/gi, "evidence that")
    .replace(/\bproof\b/gi, "evidence")
    .replace(/\bproves?\b/gi, "documents")
    .replace(/\bcaused\b/gi, "was associated with")
    .replace(/\bcauses?\b/gi, "is associated with")
    .replace(/\bforecasts?\b/gi, "projects")
    .replace(/\bforecast(ed|ing)?\b/gi, "projected")
    .replace(/\bpredicts?\b/gi, "projects")
    .replace(/\bsimulates?\b/gi, "models")
    .replace(/\bwill increase\b/gi, "is described as intended to increase")
    .replace(/\bwill decrease\b/gi, "is described as intended to decrease")
    .trim();
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
    .slice(0, 112)
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

function normalizeDateForComparison(value) {
  const text = String(value || "").trim();
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text;
}

function datePrecision(value) {
  const text = String(value || "");
  if (/^\d{4}$/.test(text)) return "year";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  return "day";
}

function sourceIdsFor(candidate) {
  const explicit = [];
  if (Array.isArray(candidate.source_ids)) explicit.push(...candidate.source_ids);
  if (candidate.source_id) explicit.push(candidate.source_id);
  if (candidate.source_dataset_id) explicit.push(candidate.source_dataset_id);
  if (candidate.source_family && !["NYC Open Data", "NYC DDC official page"].includes(candidate.source_family)) {
    explicit.push(candidate.source_family);
  }
  if (candidate.publisher?.includes("NYC Landmarks Preservation Commission") && candidate.source_record_id?.startsWith("COFA-")) {
    explicit.push("nyc-lpc-permit-application-information");
  }
  const seen = new Set();
  return explicit
    .map(canonicalSourceId)
    .filter((sourceId) => sourceId && sourceId !== "NYC Open Data")
    .filter((sourceId) => {
      if (seen.has(sourceId)) return false;
      seen.add(sourceId);
      return true;
    });
}

function pointFrom(candidate) {
  const options = [
    [candidate.latitude, candidate.longitude],
    [candidate.lat, candidate.lon],
    [candidate.geometry?.latitude, candidate.geometry?.longitude],
    [candidate.location?.latitude, candidate.location?.longitude],
    [candidate.coordinates?.lat, candidate.coordinates?.lon],
    [candidate.coordinates?.latitude, candidate.coordinates?.longitude]
  ];
  for (const [latValue, lonValue] of options) {
    const lat = Number(latValue);
    const lon = Number(lonValue);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  return null;
}

function sourceUrlFor(candidate) {
  if (candidate.source_url) return candidate.source_url;
  if (Array.isArray(candidate.source_urls) && candidate.source_urls.length > 0) return candidate.source_urls[0];
  if (candidate.source_dataset_url) return candidate.source_dataset_url;
  return "";
}

function sourceRecordIdFor(candidate) {
  if (candidate.source_record_id) return candidate.source_record_id;
  if (Array.isArray(candidate.source_record_ids) && candidate.source_record_ids.length > 0) {
    return candidate.source_record_ids.join("; ");
  }
  if (Array.isArray(candidate.planning_refs) && candidate.planning_refs.length > 0) {
    return candidate.planning_refs.join("; ");
  }
  if (candidate.nhle_list_entry) return `NHLE ListEntry ${candidate.nhle_list_entry}`;
  if (candidate.har_list_entry) return `HAR List_Entry ${candidate.har_list_entry}`;
  if (candidate.permit?.regulation_number) return candidate.permit.regulation_number;
  if (candidate.row_fields?.trackerid) return `trackerid ${candidate.row_fields.trackerid}`;
  return candidate.candidate_id || candidate.event_id || "";
}

function eventIdFor(candidate) {
  if (candidate.event_id) {
    const existing = safeText(candidate.event_id);
    if (candidate.city_id === "nyc") return existing.replace(/^nyc_lpc_/, "nyc_arch_lpc_").replace(/^nyc_/, "nyc_arch_");
    if (candidate.city_id === "london" && existing.startsWith("lon_arch_")) return existing;
    if (candidate.city_id === "belfast" && existing.startsWith("bfs_arch_")) return existing;
  }
  const prefix = { belfast: "bfs_arch", london: "lon_arch", nyc: "nyc_arch" }[candidate.city_id];
  const token = candidate.candidate_id || candidate.event_id || `${candidate.title}_${sourceRecordIdFor(candidate)}_${candidate.date || candidate.event_date || candidate.effective_date}`;
  return `${prefix}_${slugify(token)}`;
}

function dateFrom(candidate) {
  const value = candidate.date ||
    candidate.event_date ||
    candidate.effective_date ||
    candidate.date_fields?.decision_or_publication_date ||
    candidate.date_fields?.decision_date ||
    candidate.dates?.decision_date ||
    candidate.dates?.dfi_fei_readvertisement_published ||
    candidate.dates?.dfi_notice_of_opinion_reported ||
    candidate.dates?.dfi_call_in_reported ||
    candidate.dates?.committee_approval_reported ||
    candidate.dates?.committee_date ||
    candidate.dates?.date_last_advertised ||
    candidate.dates?.date_validated ||
    latestDateFromObject(candidate.dates) ||
    latestDateFromObject(candidate.date_fields) ||
    candidate.permit?.issue_date;
  return normalizeDate(value);
}

function latestDateFromObject(value) {
  if (!value || typeof value !== "object") return "";
  const latestAllowed = new Date(`${retrievedAt}T23:59:59Z`);
  const dates = Object.values(value)
    .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
    .map(normalizeDate)
    .filter((entry) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(entry))
    .filter((entry) => new Date(`${normalizeDateForComparison(entry)}T00:00:00Z`) <= latestAllowed)
    .sort();
  return dates.at(-1) || "";
}

function datePrecisionFor(candidate, date) {
  if (candidate.date_precision) return candidate.date_precision;
  if (candidate.date_granularity) return candidate.date_granularity;
  if (candidate.effective_date_precision) return candidate.effective_date_precision;
  return datePrecision(date);
}

function sourceDateFieldFor(candidate) {
  const fields = [];
  if (candidate.source_date_field) fields.push(candidate.source_date_field);
  if (candidate.date_field) fields.push(candidate.date_field);
  if (candidate.date_basis) fields.push(candidate.date_basis);
  if (candidate.date_type) fields.push(candidate.date_type);
  if (candidate.date_fields?.source_date_field) fields.push(candidate.date_fields.source_date_field);
  if (candidate.dates?.decision_date) fields.push(`decision_date ${candidate.dates.decision_date}`);
  if (candidate.permit?.issue_date) fields.push(`issue_date ${candidate.permit.issue_date}`);
  if (fields.length > 0) return fields.join("; ");
  return "Observed administrative date from the cited source record.";
}

function areaFor(candidate) {
  return candidate.area ||
    candidate.location_name ||
    candidate.location?.address ||
    candidate.location?.name ||
    candidate.address ||
    candidate.site ||
    candidate.title ||
    candidate.city_id;
}

function geometrySourceFor(candidate) {
  return candidate.geometry_source ||
    candidate.geometry?.source ||
    candidate.location?.geometry_source ||
    candidate.coordinates?.precision ||
    "Source candidate supplied approximate navigation coordinates.";
}

function geometryPrecisionFor(candidate) {
  return candidate.geometry_precision ||
    candidate.geometry?.precision ||
    candidate.location?.geometry_precision ||
    candidate.coordinates?.precision ||
    "approximate navigation point, not a surveyed boundary or works footprint";
}

function architectFor(candidate) {
  if (candidate.architect) return candidate.architect;
  if (candidate.applicant_name) return `Source row names applicant: ${candidate.applicant_name}; role not independently verified.`;
  if (candidate.permit?.applicant_name) return `Source row names applicant: ${candidate.permit.applicant_name}; role not independently verified.`;
  return "Source record does not name a project architect.";
}

function limitationsFor(candidate) {
  const parts = [];
  if (Array.isArray(candidate.limitations)) parts.push(candidate.limitations.join(" "));
  else if (candidate.limitations) parts.push(candidate.limitations);
  if (candidate.confidence_note) parts.push(candidate.confidence_note);
  if (candidate.effective_date_note) parts.push(candidate.effective_date_note);
  return parts.join(" ") || "Source row documents an administrative or public-source milestone only; do not treat it as construction, completion, occupation, public opening, or outcome evidence unless another cited source states that.";
}

function licenseFor(candidate) {
  return candidate.license_or_terms_note ||
    candidate.license ||
    candidate.license_terms ||
    candidate.license_terms_access_note ||
    candidate.terms_note ||
    "Source-specific public terms; factual metadata and URLs retained.";
}

function normalizeCandidate(candidate, packName) {
  const date = dateFrom(candidate);
  const point = pointFrom(candidate);
  const sourceIds = sourceIdsFor(candidate);
  const primarySourceId = sourceIds[0];
  return {
    city_id: candidate.city_id,
    event_id: eventIdFor(candidate),
    date,
    date_precision: datePrecisionFor(candidate, date),
    bucket: safeText(candidate.bucket || candidate.category || "planning/development/architecture/official_record"),
    title: safeText(candidate.title),
    summary: safeText(candidate.summary),
    observed_change: safeText(candidate.observed_change || candidate.summary || candidate.title),
    area: safeText(areaFor(candidate)),
    latitude: point?.lat,
    longitude: point?.lon,
    source_ids: sourceIds,
    source_name: safeText(candidate.source_name || candidate.source_dataset_url || primarySourceId),
    publisher: safeText(candidate.publisher || candidate.source_publisher || "Source publisher not supplied in candidate."),
    source_url: sourceUrlFor(candidate),
    source_record_id: safeText(sourceRecordIdFor(candidate)),
    source_type: safeText(candidate.source_type || candidate.event_type || "official/public source record"),
    source_retrieved_at: candidate.accessed_at || candidate.source_retrieved_at || candidate.retrieved_at || retrievedAt,
    source_date_field: safeText(sourceDateFieldFor(candidate)),
    source_dataset_id: primarySourceId,
    confidence: candidate.confidence || "documented",
    architect: safeText(architectFor(candidate)),
    project_type: safeText(candidate.project_type || candidate.subcategory || candidate.event_type || candidate.source_family || "official architecture-related record"),
    geometry_source: safeText(geometrySourceFor(candidate)),
    geometry_precision: safeText(geometryPrecisionFor(candidate)),
    license_or_terms_note: safeText(licenseFor(candidate)),
    attribution: safeText(candidate.attribution || candidate.publisher || candidate.source_name || primarySourceId),
    limitations: safeText(limitationsFor(candidate)),
    transformation_method: safeText(`Round116 ${packName} candidate ${candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title}; normalized by scripts/append_architecture_batch_20260519_round116_official.js after source-ID canonicalization, duplicate screening, required-provenance checks, overclaim wording cleanup, current-date guard, and city coordinate-envelope validation.`)
  };
}

function sourceToken(event) {
  const text = `${event.source_record_id || ""} ${event.source_url || ""} ${event.title || ""}`;
  const sourceId = event.source_dataset_id;
  if (sourceId === "nyc-parks-capital-project-tracker-4hcv-tc5r") {
    const match = text.match(/(?:trackerid[=\s]*)?(\d{3,})/i);
    return match ? match[1] : text.toLowerCase();
  }
  if (sourceId === "nyc-dcp-zap-project-data") {
    const match = text.match(/\b20\d{2}[A-Z]\d{4}\b/);
    return match ? match[0] : text.toLowerCase();
  }
  if (/nyc-dob/.test(sourceId)) {
    const match = text.match(/\b(?:CO-\d{6,}|\d{8,})\b/);
    return match ? match[0] : text.toLowerCase();
  }
  if (sourceId === "nyc-lpc-permit-application-information") {
    const match = text.match(/\b[A-Z]*COFA-\d{2}-\d{4,5}\b/i);
    return match ? match[0].replace(/^.*?(COFA-)/i, "COFA-").toUpperCase() : text.toLowerCase();
  }
  if (sourceId === "nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr") {
    return text.match(/\d+:\d+/)?.[0] || text.toLowerCase();
  }
  if (sourceId === "historic-england-nhle") {
    return text.match(/\b(?:NHLE ListEntry |list-entry\/)?(\d{6,7})\b/i)?.[1] || text.toLowerCase();
  }
  if (sourceId === "historic-england-har-annual-map-series-2016-2025") {
    const year = text.match(/\bHAR\s+(20\d{2})\b/i)?.[1] || String(event.date).slice(0, 4);
    const fid = text.match(/\bFID\s+(\d+)\b/i)?.[1];
    const listEntry = text.match(/\bList_Entry\s+([\w-]+)\b/i)?.[1];
    return [year, fid, listEntry].filter(Boolean).join(":") || text.toLowerCase();
  }
  const planningRef = text.match(/\bLA04\/\d{4}\/\d{4}\/[A-Z]+\b/i)?.[0];
  if (planningRef) return planningRef.toUpperCase();
  const pld = text.match(/\bPLD:[^;\s]+/i)?.[0];
  if (pld) return pld.toUpperCase();
  const govuk = text.match(/\bGOVUK:[a-z0-9-]+/i)?.[0];
  if (govuk) return govuk.toUpperCase();
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

function validateRecords(records) {
  const knownSourceIds = new Set(doc.sources.map((source) => source.source_id));
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

  const banned = /\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|will increase|will decrease|impact score)\b/i;
  for (const event of records) {
    const checked = [
      event.title,
      event.summary,
      event.observed_change,
      event.limitations,
      event.transformation_method,
      event.source_date_field,
      event.project_type,
      event.geometry_precision
    ].join(" ");
    if (banned.test(checked)) throw new Error(`Output record contains overclaim wording: ${event.event_id}`);
  }

  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");
  for (const event of records) {
    const comparable = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (comparable > latestAllowedDate) throw new Error(`Future-dated record: ${event.event_id}`);
    if (comparable < earliestAllowedDate) throw new Error(`Pre-window record: ${event.event_id}`);
  }

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

  const batchIds = new Set();
  const batchSourceKeys = new Set();
  for (const event of records) {
    if (batchIds.has(event.event_id)) throw new Error(`Duplicate event_id inside batch: ${event.event_id}`);
    batchIds.add(event.event_id);
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    if (batchSourceKeys.has(sourceKey)) throw new Error(`Duplicate source key inside batch: ${sourceKey}`);
    batchSourceKeys.add(sourceKey);
  }
}

function main() {
  const rows = [];
  const rejections = [];

  for (const [packName, file] of Object.entries(candidatePaths)) {
    const candidates = readJson(file).candidates || [];
    for (const candidate of candidates) {
      const event = normalizeCandidate(candidate, packName);
      if (!event.latitude || !event.longitude) {
        rejections.push({ id: candidate.candidate_id || candidate.event_id || candidate.source_record_id || candidate.title, reason: "Missing source geometry after candidate normalization." });
        continue;
      }
      rows.push(event);
    }
  }

  const existingSourceTokens = buildExistingSourceTokens(doc.events);
  const existingTitleDateKeys = new Set(doc.events.map((event) => `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`));
  const existingIds = new Set(doc.events.map((event) => event.event_id));
  const existingSourceKeys = new Set(doc.events.map((event) => `${event.city_id}|${event.source_url}|${event.source_record_id}`));
  const batchSourceTokens = new Set();
  const records = [];
  const latestAllowedDate = new Date(`${retrievedAt}T23:59:59Z`);
  const earliestAllowedDate = new Date("2008-01-01T00:00:00Z");

  for (const event of rows) {
    const titleDateKey = `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`;
    const sourceKey = `${event.city_id}|${event.source_url}|${event.source_record_id}`;
    const token = sourceToken(event);
    const tokenKey = `${event.source_dataset_id}|${token}`;
    const comparableDate = new Date(`${normalizeDateForComparison(event.date)}T00:00:00Z`);
    if (!event.date || Number.isNaN(comparableDate.getTime())) {
      rejections.push({ id: event.event_id, reason: "Missing or invalid event date after candidate normalization." });
      continue;
    }
    if (comparableDate > latestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Future-dated event date after access date: ${event.date}` });
      continue;
    }
    if (comparableDate < earliestAllowedDate) {
      rejections.push({ id: event.event_id, reason: `Pre-window event date: ${event.date}` });
      continue;
    }
    if (existingIds.has(event.event_id)) {
      rejections.push({ id: event.event_id, reason: "Existing event_id." });
      continue;
    }
    if (existingSourceKeys.has(sourceKey)) {
      rejections.push({ id: event.event_id, reason: `Existing source key: ${sourceKey}` });
      continue;
    }
    if (existingTitleDateKeys.has(titleDateKey)) {
      rejections.push({ id: event.event_id, reason: `Existing title/date key: ${titleDateKey}` });
      continue;
    }
    if (existingSourceTokens.get(event.source_dataset_id)?.has(token)) {
      rejections.push({ id: event.event_id, reason: `Existing source token for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    if (batchSourceTokens.has(tokenKey)) {
      rejections.push({ id: event.event_id, reason: `Duplicate source token inside batch for ${event.source_dataset_id}: ${token}` });
      continue;
    }
    batchSourceTokens.add(tokenKey);
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

  const tmpPath = `${corpusPath}.round116-official.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(doc, null, 2)}\n`);
  fs.renameSync(tmpPath, corpusPath);

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
    rejections: rejections.slice(0, 80)
  }, null, 2));
}

main();
