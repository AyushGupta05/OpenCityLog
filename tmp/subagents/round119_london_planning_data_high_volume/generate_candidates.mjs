import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "C:/Users/ayush/dev/Bims-5/tmp/subagents/round119_london_planning_data_high_volume";
const CORPUS_PATH = "C:/Users/ayush/dev/Bims-5/data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const ACCESSED_AT = "2026-05-19";
const START = "2008-01-01";
const END = "2026-05-19";

const LONDON_LPA_ENTITIES = [
  626202, 626203, 626204, 626205, 626206, 626188, 626189, 626207,
  626208, 626209, 626210, 626190, 626191, 626192, 626211, 626212,
  626213, 626214, 626193, 626194, 626215, 626195, 626196, 626329,
  626216, 626197, 626330, 626217, 626218, 626198, 626219, 626199,
  626220, 626200, 626201,
];

const PLANNING_DATASETS = [
  "listed-building",
  "conservation-area",
  "article-4-direction-area",
  "archaeological-priority-area",
  "asset-of-community-value",
  "locally-listed-building",
  "building-preservation-notice",
];

const SOURCE_META = {
  "planning-data-listed-building": {
    source_id: "planning-data-listed-building",
    source_name: "Planning Data listed building entities",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    source_url: "https://www.planning.data.gov.uk/dataset/listed-building",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=listed-building",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0. Attribution text includes Historic England and Ordnance Survey/Crown copyright database right 2026.",
    coverage_years: "Current Planning Data listed-building entities. Candidate selection retained records with source start-date from 2008-01-01 through 2026-05-19.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "point", "documentation-url", "listed-building-grade", "quality"],
    reliability_assessment: "strong for statutory listing milestone when start-date is present; point is representative and not a full building extent.",
    required_caveats: "Listing date is a designation/list-entry date, not evidence of construction, opening, refurbishment, occupation, or effects. Some Planning Data listed-building geometries are points only.",
    ingestion_recommendation: "Use as documented heritage-designation events with NHLE reference, Planning Data entity id, date field, attribution, and point-geometry caveat.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-conservation-area": {
    source_id: "planning-data-conservation-area",
    source_name: "Planning Data conservation area entities",
    publisher: "Ministry of Housing, Communities and Local Government / local planning authorities / Historic England",
    source_url: "https://www.planning.data.gov.uk/dataset/conservation-area",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=conservation-area",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0 with Crown copyright/Historic England attribution; the dataset text says it is a work in progress and includes duplicates still being reconciled.",
    coverage_years: "Current Planning Data conservation-area entities. Candidate selection retained records with source start-date from 2008-01-01 through 2026-05-19.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "geometry", "point", "organisation-entity", "quality"],
    reliability_assessment: "usable with caveats",
    required_caveats: "Planning Data warns the conservation-area dataset is incomplete and contains duplicate areas under reconciliation. Start-date should be treated as the source record's designation/start date where supplied.",
    ingestion_recommendation: "Use when the wording stays to conservation-area administrative status and preserves geometry/date caveats.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-article-4-direction-area": {
    source_id: "planning-data-article-4-direction-area",
    source_name: "Planning Data Article 4 direction area entities",
    publisher: "Ministry of Housing, Communities and Local Government / local planning authorities",
    source_url: "https://www.planning.data.gov.uk/dataset/article-4-direction-area",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=article-4-direction-area",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0 with Crown copyright/database right attribution.",
    coverage_years: "Current Planning Data Article 4 direction area entities. Candidate selection retained records with source start-date from 2008-01-01 through 2026-05-19.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "geometry", "point", "organisation-entity", "quality"],
    reliability_assessment: "usable with caveats",
    required_caveats: "An Article 4 direction alters permitted-development rights; the record does not prove physical change to a building.",
    ingestion_recommendation: "Use as administrative planning-control events, not as construction or impact evidence.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-archaeological-priority-area": {
    source_id: "planning-data-archaeological-priority-area",
    source_name: "Planning Data archaeological priority area entities",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    source_url: "https://www.planning.data.gov.uk/dataset/archaeological-priority-area",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=archaeological-priority-area",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0. Attribution text includes Historic England and Ordnance Survey/Crown copyright database right 2026.",
    coverage_years: "Greater London APA entities in Planning Data; many rows expose entry-date but no original designation start-date.",
    geographic_scope: "Greater London archaeological priority areas.",
    key_fields_used: ["entity", "reference", "name", "entry-date", "start-date", "geometry", "point", "archaeological-risk-tier", "quality"],
    reliability_assessment: "usable with caveats",
    required_caveats: "APA rows often lack original designation/effective dates. Entry-date is a Planning Data platform date and must not be presented as the date the APA was first designated.",
    ingestion_recommendation: "Use only with explicit source_date_field language; prefer rows with a supplied start-date if available.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-asset-of-community-value": {
    source_id: "planning-data-asset-of-community-value",
    source_name: "Planning Data asset of community value entities",
    publisher: "Ministry of Housing, Communities and Local Government / local planning authorities",
    source_url: "https://www.planning.data.gov.uk/dataset/asset-of-community-value",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=asset-of-community-value",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0 with Crown copyright/database right attribution.",
    coverage_years: "Current Planning Data ACV entities; this pass retained dated Greater London rows from 2008-01-01 through 2026-05-19.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "end-date", "geometry", "point", "quality"],
    reliability_assessment: "usable with caveats",
    required_caveats: "ACV listing is a planning/land-charge designation. It does not restrict all owner actions and is not evidence of construction or reuse.",
    ingestion_recommendation: "Use as community-asset designation events where date and geometry are present.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-locally-listed-building": {
    source_id: "planning-data-locally-listed-building",
    source_name: "Planning Data locally listed building entities",
    publisher: "Ministry of Housing, Communities and Local Government / local planning authorities",
    source_url: "https://www.planning.data.gov.uk/dataset/locally-listed-building",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=locally-listed-building",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0 with Crown copyright/database right attribution.",
    coverage_years: "Experimental current Planning Data locally listed building entities; this pass retained dated Greater London rows from 2008-01-01 through 2026-05-19.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "geometry", "point", "quality"],
    reliability_assessment: "usable with caveats",
    required_caveats: "Dataset is experimental and may not cover all London local lists. Local listing is a non-statutory heritage designation rather than direct evidence of physical works.",
    ingestion_recommendation: "Use with local-list caveat and source entity reference where dated geometry exists.",
    accessed_at: ACCESSED_AT,
  },
  "planning-data-building-preservation-notice": {
    source_id: "planning-data-building-preservation-notice",
    source_name: "Planning Data building preservation notice entities",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England / local planning authorities",
    source_url: "https://www.planning.data.gov.uk/dataset/building-preservation-notice",
    api_endpoint: "https://www.planning.data.gov.uk/entity.json?dataset=building-preservation-notice",
    license_or_terms_note: "Planning Data dataset page states OGL v3.0. Attribution text includes Historic England and Ordnance Survey/Crown copyright database right 2026.",
    coverage_years: "Very small current dataset; this pass retained dated Greater London rows from 2008-01-01 through 2026-05-19 if present.",
    geographic_scope: "England; this pass selected records intersecting Greater London local planning authority geometries.",
    key_fields_used: ["entity", "reference", "name", "start-date", "geometry", "point", "quality"],
    reliability_assessment: "strong when present but sparse",
    required_caveats: "A BPN is temporary legal protection while a listing application is considered; it is not evidence that physical alteration occurred.",
    ingestion_recommendation: "Use only where the source row has a clear date and geometry.",
    accessed_at: ACCESSED_AT,
  },
  "gla-planning-datahub-listed-building-consent": {
    source_id: "gla-planning-datahub-listed-building-consent",
    source_name: "Planning London Datahub applications API - listed building consent records",
    publisher: "Greater London Authority / London planning authorities",
    source_url: "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/",
    api_endpoint: "https://planningdata.london.gov.uk/api-guest/applications/_search",
    license_or_terms_note: "London Datastore dataset page lists Licence: Not Specified. This candidate file keeps factual row metadata, source URLs, and normalized coordinates only; licence review is needed before redistributing a derived bulk dataset.",
    coverage_years: "Planning London Datahub application records. This pass queried decision_date 2008-01-01 through 2026-05-19 for Listed Building Consent and Full planning & listed building consent rows.",
    geographic_scope: "Greater London planning authorities represented in the Planning London Datahub.",
    key_fields_used: ["id", "lpa_name", "lpa_app_no", "application_type_full", "decision_date", "decision", "status", "description", "site_name", "centroid", "wgs84_polygon", "url_planning_app", "application_details"],
    reliability_assessment: "usable with caveats",
    required_caveats: "Rows are administrative planning application records. They do not prove construction, completion, occupation, heritage benefit, or effect. Some supplied centroids are wrong, so this pass used the WGS84 polygon representative point when the centroid fell outside London.",
    ingestion_recommendation: "Use for cited administrative consent/decision milestones after project-level duplicate review and licence review.",
    accessed_at: ACCESSED_AT,
  },
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value, max = 72) {
  const s = normalize(value).replace(/\s+/g, "_").replace(/^_+|_+$/g, "");
  return (s || "record").slice(0, max).replace(/_+$/g, "");
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceTrim(value, max = 220) {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, "") + ".";
}

function parseWktPoint(point) {
  const match = String(point ?? "").match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!match) return null;
  return { longitude: Number(match[1]), latitude: Number(match[2]) };
}

function flattenCoords(coords, out = []) {
  if (!Array.isArray(coords)) return out;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    out.push([coords[0], coords[1]]);
    return out;
  }
  for (const item of coords) flattenCoords(item, out);
  return out;
}

function representativePointFromGeojson(geojson) {
  if (!geojson?.coordinates) return null;
  const coords = flattenCoords(geojson.coordinates).filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  if (!coords.length) return null;
  const lons = coords.map(([lon]) => lon);
  const lats = coords.map(([, lat]) => lat);
  return {
    longitude: round6((Math.min(...lons) + Math.max(...lons)) / 2),
    latitude: round6((Math.min(...lats) + Math.max(...lats)) / 2),
  };
}

function representativePointFromWkt(wkt) {
  const point = parseWktPoint(wkt);
  if (point) return point;
  const nums = Array.from(String(wkt ?? "").matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g))
    .map((m) => [Number(m[1]), Number(m[2])])
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  if (!nums.length) return null;
  const lons = nums.map(([lon]) => lon);
  const lats = nums.map(([, lat]) => lat);
  return {
    longitude: round6((Math.min(...lons) + Math.max(...lons)) / 2),
    latitude: round6((Math.min(...lats) + Math.max(...lats)) / 2),
  };
}

function round6(value) {
  return Math.round(Number(value) * 1_000_000) / 1_000_000;
}

function isLondonish(pt) {
  return pt && pt.longitude >= -0.65 && pt.longitude <= 0.35 && pt.latitude >= 51.25 && pt.latitude <= 51.75;
}

function isoFromUkDate(value) {
  const match = String(value ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function inRange(iso) {
  return Boolean(iso) && iso >= START && iso <= END;
}

function existingCorpusIndex() {
  const raw = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8"));
  const events = raw.events || [];
  const exact = new Map();
  const refs = new Map();
  const titleDates = new Map();

  for (const event of events) {
    if (event.city_id && event.city_id !== "london") continue;
    const eventId = event.event_id || event.candidate_id || "existing-event";
    const blob = [
      event.source_record_id,
      event.source_url,
      event.title,
      event.summary,
      event.observed_change,
      ...(event.source_ids || []),
      event.source_id,
    ].filter(Boolean).join(" | ");
    const date = event.date || event.effective_date || "";

    for (const value of [event.source_record_id, event.source_url, event.title].filter(Boolean)) {
      exact.set(normalize(value), eventId);
    }
    if (event.title && date) titleDates.set(`${normalize(event.title)}|${date}`, eventId);

    const patterns = [
      /\bNHLE(?:\s+ListEntry)?\s*(\d{7})\b/gi,
      /list-entry\/(\d{7})/gi,
      /\bPlanning Data [^;]*entity\s+(\d{5,})\b/gi,
      /\bentity\s+(\d{5,})\b/gi,
      /\bPLD:([^;\s]+)/gi,
      /applications\/_source\/([^;\s"']+)/gi,
      /\bLPA:([^;\n]+)/gi,
    ];
    for (const pattern of patterns) {
      for (const match of blob.matchAll(pattern)) {
        refs.set(normalize(match[1]), eventId);
      }
    }
  }
  return { exact, refs, titleDates };
}

function duplicateReason(candidate, index) {
  const ids = [
    candidate.source_record_id,
    candidate.source_url,
    candidate.title,
    candidate._dedupe_entity,
    candidate._dedupe_reference,
    candidate._dedupe_pld_id,
    candidate._dedupe_lpa_ref,
  ].filter(Boolean);
  for (const id of ids) {
    const key = normalize(id);
    if (index.exact.has(key)) return `Already represented in architecture_milestones_2008_2026.json as ${index.exact.get(key)}.`;
    if (index.refs.has(key)) return `Source/entity/reference already represented in architecture_milestones_2008_2026.json as ${index.refs.get(key)}.`;
  }
  const td = `${normalize(candidate.title)}|${candidate.date || candidate.effective_date || ""}`;
  if (index.titleDates.has(td)) return `Title/date already represented in architecture_milestones_2008_2026.json as ${index.titleDates.get(td)}.`;
  return "";
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "user-agent": "Bims-5 provenance research (candidate generation)",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchPlanningDataset(dataset) {
  const byEntity = new Map();
  const fields = [
    "entry-date", "start-date", "end-date", "entity", "name", "dataset",
    "typology", "reference", "prefix", "organisation-entity", "geometry",
    "point", "quality", "documentation-url", "listed-building-grade",
    "archaeological-risk-tier",
  ];
  for (const lpa of LONDON_LPA_ENTITIES) {
    let offset = 0;
    while (true) {
      const params = new URLSearchParams({
        dataset,
        geometry_entity: String(lpa),
        geometry_relation: "intersects",
        limit: "500",
        offset: String(offset),
      });
      for (const field of fields) params.append("field", field);
      const url = `https://www.planning.data.gov.uk/entity.json?${params.toString()}`;
      const json = await fetchJson(url);
      for (const entity of json.entities || []) byEntity.set(String(entity.entity), entity);
      offset += 500;
      if (!json.entities?.length || offset >= (json.count || 0)) break;
    }
  }
  return [...byEntity.values()];
}

async function fetchPldLbcRows() {
  const sourceFields = [
      "id", "lpa_name", "borough", "lpa_app_no", "site_name", "site_number",
      "street_name", "secondary_street_name", "locality", "postcode", "description", "decision_date", "valid_date",
      "decision", "status", "application_type_full", "centroid", "wgs84_polygon",
      "url_planning_app", "application_details.site_area",
      "application_details.total_gia_gained", "application_details.total_gia_lost",
      "application_details.projected_cost_of_works", "application_details.scheme_name",
      "application_details.building_details",
  ];
  const byId = new Map();
  const runSearch = async (body) => {
    const json = await fetchJson("https://planningdata.london.gov.uk/api-guest/applications/_search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    for (const hit of json.hits?.hits || []) {
      if (hit._source?.id) byId.set(hit._source.id, hit._source);
    }
  };

  await runSearch({
    size: 700,
    _source: sourceFields,
    sort: [
      { "application_details.total_gia_gained": { order: "desc", missing: "_last" } },
      { "application_details.site_area": { order: "desc", missing: "_last" } },
      { "decision_date": { order: "desc", missing: "_last" } },
    ],
    query: {
      bool: {
        filter: [
          { match_phrase: { application_type_full: "listed building consent" } },
          { range: { decision_date: { gte: "01/01/2008", lte: "19/05/2026" } } },
        ],
        should: [
          { match_phrase: { decision: "Approved" } },
          { match_phrase: { decision: "Granted" } },
          { match_phrase: { status: "Approved" } },
        ],
        minimum_should_match: 1,
      },
    },
  });

  const signalShould = [
    "redevelopment", "demolition", "extension", "alterations", "refurbishment",
    "restoration", "repair", "public realm", "museum", "library", "theatre",
    "station", "market", "hotel", "hospital", "school", "college", "university",
    "gallery", "office", "residential", "mixed use", "town hall", "bridge",
  ].map((term) => ({ match_phrase: { description: term } }));

  for (let year = 2008; year <= 2026; year += 1) {
    const lte = year === 2026 ? "19/05/2026" : `31/12/${year}`;
    await runSearch({
      size: 90,
      _source: sourceFields,
      query: {
        bool: {
          filter: [{ range: { decision_date: { gte: `01/01/${year}`, lte } } }],
          must: [
            {
              bool: {
                should: [
                  { match_phrase: { application_type_full: "listed building consent" } },
                  { match_phrase: { description: "listed building consent" } },
                ],
                minimum_should_match: 1,
              },
            },
            {
              bool: {
                should: [
                  { match_phrase: { decision: "Approved" } },
                  { match_phrase: { decision: "Granted" } },
                  { match_phrase: { decision: "Grant" } },
                  { match_phrase: { status: "Approved" } },
                ],
                minimum_should_match: 1,
              },
            },
          ],
          should: signalShould,
        },
      },
    });
  }

  return [...byId.values()];
}

function planningSourceId(dataset) {
  return `planning-data-${dataset}`;
}

function planningDate(entity) {
  if (inRange(entity["start-date"])) {
    return { date: entity["start-date"], field: "Planning Data start-date", precision: "day", confidence: "documented" };
  }
  if (inRange(entity["entry-date"])) {
    return { date: entity["entry-date"], field: "Planning Data entry-date", precision: "day", confidence: "inferred" };
  }
  return null;
}

function planningProjectType(dataset, entity) {
  if (dataset === "listed-building") return `national listed-building designation${entity["listed-building-grade"] ? ` (${entity["listed-building-grade"]})` : ""}`;
  if (dataset === "conservation-area") return "conservation-area designation";
  if (dataset === "article-4-direction-area") return "Article 4 direction area";
  if (dataset === "archaeological-priority-area") return "archaeological-priority-area record";
  if (dataset === "asset-of-community-value") return "asset-of-community-value designation";
  if (dataset === "locally-listed-building") return "local heritage-list building record";
  if (dataset === "building-preservation-notice") return "building preservation notice";
  return dataset;
}

function planningTitle(dataset, name, entity) {
  if (dataset === "listed-building") return `${name} listed${entity["listed-building-grade"] ? ` at ${entity["listed-building-grade"]}` : ""}`;
  if (dataset === "conservation-area") return `${name} conservation area recorded`;
  if (dataset === "article-4-direction-area") return `${name} Article 4 direction area recorded`;
  if (dataset === "archaeological-priority-area") return `${sentenceTrim(name, 72)} archaeological priority area recorded`;
  if (dataset === "asset-of-community-value") return `${name} asset of community value recorded`;
  if (dataset === "locally-listed-building") return `${name} locally listed building recorded`;
  if (dataset === "building-preservation-notice") return `${name} building preservation notice recorded`;
  return `${name} ${dataset} record`;
}

function planningObservedChange(dataset, name, dateInfo, entity) {
  if (dataset === "listed-building") {
    return `Planning Data records ${name} as a listed-building entity${entity["listed-building-grade"] ? ` at ${entity["listed-building-grade"]}` : ""} with ${dateInfo.field} ${dateInfo.date}.`;
  }
  if (dataset === "conservation-area") return `Planning Data records ${name} as a conservation-area entity with ${dateInfo.field} ${dateInfo.date}.`;
  if (dataset === "article-4-direction-area") return `Planning Data records ${name} as an Article 4 direction area with ${dateInfo.field} ${dateInfo.date}.`;
  if (dataset === "archaeological-priority-area") return `Planning Data records this archaeological priority area with ${dateInfo.field} ${dateInfo.date}; the row does not by itself date the original archaeological designation unless start-date is supplied.`;
  if (dataset === "asset-of-community-value") return `Planning Data records ${name} as an asset of community value with ${dateInfo.field} ${dateInfo.date}.`;
  if (dataset === "locally-listed-building") return `Planning Data records ${name} as a locally listed building with ${dateInfo.field} ${dateInfo.date}.`;
  if (dataset === "building-preservation-notice") return `Planning Data records ${name} as a building preservation notice with ${dateInfo.field} ${dateInfo.date}.`;
  return `Planning Data records ${name} in ${dataset} with ${dateInfo.field} ${dateInfo.date}.`;
}

function planningLimitations(dataset, dateInfo) {
  const common = "This is an administrative/designation record, not evidence of construction, completion, occupation, design quality, causation, or impact.";
  if (dataset === "listed-building") return `${common} Planning Data listed-building geometry is often a representative point rather than the full building extent.`;
  if (dataset === "conservation-area") return `${common} Planning Data states the conservation-area dataset is incomplete and contains duplicates still being reconciled.`;
  if (dataset === "article-4-direction-area") return `${common} The record concerns permitted-development controls, not observed physical works.`;
  if (dataset === "archaeological-priority-area" && dateInfo.field === "Planning Data entry-date") return `${common} The date is the Planning Data entry-date and must not be treated as the original APA designation/effective date.`;
  if (dataset === "asset-of-community-value") return `${common} ACV status is a local-land-charge/planning consideration and does not itself restrict all owner actions.`;
  if (dataset === "locally-listed-building") return `${common} The local-list dataset is experimental and may have incomplete London coverage.`;
  if (dataset === "building-preservation-notice") return `${common} A BPN is temporary legal protection while listing is considered.`;
  return common;
}

function planningScore(dataset, entity, dateInfo) {
  let score = 50;
  if (dataset === "conservation-area") score = 86;
  if (dataset === "article-4-direction-area") score = 84;
  if (dataset === "building-preservation-notice") score = 82;
  if (dataset === "asset-of-community-value") score = 76;
  if (dataset === "locally-listed-building") score = 72;
  if (dataset === "archaeological-priority-area") score = dateInfo.field === "Planning Data start-date" ? 70 : 54;
  if (dataset === "listed-building") {
    const grade = entity["listed-building-grade"] || "";
    score = grade === "I" ? 92 : grade === "II*" ? 88 : 78;
  }
  const name = normalize(entity.name);
  if (/(station|library|museum|theatre|cinema|market|school|college|university|hospital|church|chapel|synagogue|mosque|bridge|town hall|civic|estate|pub|public house|warehouse|factory|office)/.test(name)) score += 4;
  if (entity.geometry) score += 2;
  if (entity.quality === "authoritative") score += 2;
  if (dateInfo.field === "Planning Data entry-date") score -= 12;
  return score;
}

function planningCandidate(entity) {
  const dataset = entity.dataset;
  const dateInfo = planningDate(entity);
  if (!dateInfo) return { rejected: "No source start-date or entry-date in requested window." };
  const point = parseWktPoint(entity.point) || representativePointFromWkt(entity.geometry);
  if (!isLondonish(point)) return { rejected: "No reliable London point/geometry available from the source row." };
  const name = sentenceTrim(entity.name || `${dataset} ${entity.reference || entity.entity}`, 120);
  const title = planningTitle(dataset, name, entity);
  const sourceId = planningSourceId(dataset);
  const sourceMeta = SOURCE_META[sourceId];
  const recordUrl = entity["documentation-url"] || `https://www.planning.data.gov.uk/entity/${entity.entity}`;
  const candidate = {
    city_id: "london",
    candidate_id: `lon_arch_${slug(sourceId, 35)}_${slug(entity.reference || entity.entity, 22)}_${dateInfo.date.replaceAll("-", "_")}`,
    title,
    summary: `${planningObservedChange(dataset, name, dateInfo, entity)} Source row: Planning Data entity ${entity.entity}${entity.reference ? `, reference ${entity.reference}` : ""}.`,
    observed_change: planningObservedChange(dataset, name, dateInfo, entity),
    date: dateInfo.date,
    effective_date: dateInfo.date,
    date_precision: dateInfo.precision,
    source_id: sourceId,
    source_ids: [sourceId],
    source_name: sourceMeta.source_name,
    publisher: sourceMeta.publisher,
    source_url: recordUrl,
    source_record_id: `Planning Data ${dataset} entity ${entity.entity}${entity.reference ? `; reference ${entity.reference}` : ""}`,
    source_type: `official Planning Data ${dataset} entity`,
    accessed_at: ACCESSED_AT,
    source_date_field: dateInfo.field,
    latitude: round6(point.latitude),
    longitude: round6(point.longitude),
    geometry_source: entity.point ? "Planning Data entity point" : "Representative point derived from Planning Data entity geometry bounding box",
    geometry_precision: entity.geometry ? "source polygon/area with representative point" : "source point; extent not supplied in this row",
    confidence: dateInfo.confidence,
    project_type: planningProjectType(dataset, entity),
    license_or_terms_note: sourceMeta.license_or_terms_note,
    attribution: sourceMeta.license_or_terms_note.includes("Historic England")
      ? "Contains Planning Data from MHCLG and Historic England. © Historic England 2026; contains Ordnance Survey data © Crown copyright and database right 2026; licensed under OGL v3.0 except where otherwise stated."
      : "Contains Planning Data from MHCLG/local planning authorities. © Crown copyright and database right 2026; licensed under OGL v3.0 except where otherwise stated.",
    limitations: planningLimitations(dataset, dateInfo),
    transformation_method: `Fetched ${dataset} entities from the Planning Data API using Greater London local-planning-authority geometry_entity filters; de-duplicated by entity/reference/title/date against the existing architecture milestone corpus; converted WKT point/geometry to WGS84 latitude/longitude.`,
    _score: planningScore(dataset, entity, dateInfo),
    _dataset: dataset,
    _dedupe_entity: String(entity.entity),
    _dedupe_reference: String(entity.reference || ""),
  };
  return { candidate };
}

function pldLocation(row) {
  const generic = /^(ground floor|basement|first floor|second floor|third floor|fourth floor|flat|unit|site|land|building|premises|part)$/i;
  const bits = [
    row.application_details?.scheme_name,
    row.site_name,
    [row.site_number, row.street_name || row.secondary_street_name].filter(Boolean).join(" "),
    [row.site_number, row.locality].filter(Boolean).join(" "),
    row.postcode,
    row.lpa_name || row.borough,
  ].filter(Boolean).map((v) => sentenceTrim(v, 110)).filter((v) => !generic.test(v.trim()));
  const seen = new Set();
  const uniq = bits.filter((b) => {
    const n = normalize(b);
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  return uniq[0] || row.lpa_app_no || row.id;
}

function pldProjectType(row) {
  const text = normalize(`${row.description || ""} ${row.application_details?.scheme_name || ""}`);
  if (/library|gallery|museum|theatre|cultural|assembly room|arts? /.test(text)) return "listed-building consent / cultural or civic planning record";
  if (/station|railway|tube|underground|transport|dock|bridge/.test(text)) return "listed-building consent / transport or infrastructure planning record";
  if (/hospital|health|medical|laborator|clinic/.test(text)) return "listed-building consent / health or life-sciences planning record";
  if (/school|college|university|student|education|learning/.test(text)) return "listed-building consent / education planning record";
  if (/office|commercial|workspace|business|class e/.test(text)) return "listed-building consent / commercial planning record";
  if (/residential|dwelling|housing|homes|apartments/.test(text)) return "listed-building consent / residential planning record";
  if (/public realm|landscap|market|community/.test(text)) return "listed-building consent / public-realm or community planning record";
  return "listed-building consent planning record";
}

function pldScore(row) {
  let score = 82;
  const details = row.application_details || {};
  const gia = Number(details.total_gia_gained || 0);
  const lost = Number(details.total_gia_lost || 0);
  const siteArea = Number(details.site_area || 0);
  if (gia >= 100000) score += 14;
  else if (gia >= 50000) score += 11;
  else if (gia >= 10000) score += 8;
  else if (gia >= 1000) score += 5;
  if (lost >= 10000) score += 4;
  if (siteArea >= 1) score += 3;
  const cost = String(details.projected_cost_of_works || "");
  if (/over\s*£?100m/i.test(cost)) score += 8;
  else if (/£?2m/i.test(cost) || /£?100m/i.test(cost)) score += 4;
  const text = normalize(`${row.description || ""} ${details.scheme_name || ""}`);
  if (/(grade i|grade ii|listed|heritage|conservation|restoration|refurbishment|alterations?|demolition|extension|public realm|library|museum|station|theatre|market|hospital|school|university|town hall)/.test(text)) score += 5;
  if (/internal alterations?\.?$/.test(text) && text.length < 80) score -= 12;
  return score;
}

function pldCandidate(row) {
  const date = isoFromUkDate(row.decision_date);
  if (!inRange(date)) return { rejected: "PLD decision_date missing or outside requested window." };
  const decisionText = `${row.decision || ""} ${row.status || ""}`;
  if (!/(approved|granted|grant)/i.test(decisionText) || /(refus|withdraw|invalid|insufficient|comment issued|no objection|not required)/i.test(decisionText)) {
    return { rejected: "PLD row did not contain an approved/granted consent decision/status." };
  }
  let point = null;
  let geometrySource = "Planning London Datahub centroid";
  if (row.centroid) {
    point = { latitude: Number(row.centroid.lat), longitude: Number(row.centroid.lon) };
  }
  if (!isLondonish(point)) {
    const fromPoly = representativePointFromGeojson(row.wgs84_polygon);
    if (fromPoly) {
      point = fromPoly;
      geometrySource = "Representative point derived from Planning London Datahub wgs84_polygon because supplied centroid was absent or outside London";
    }
  }
  if (!isLondonish(point)) return { rejected: "No reliable London centroid or WGS84 polygon available." };

  const location = pldLocation(row);
  if (normalize(location).length < 5 || /^[0-9]+$/.test(normalize(location))) {
    return { rejected: "PLD row location fields were too sparse for a useful changelog candidate title." };
  }
  const desc = sentenceTrim(row.description || "No description supplied in PLD row.", 260);
  const sourceId = "gla-planning-datahub-listed-building-consent";
  const sourceMeta = SOURCE_META[sourceId];
  const sourceUrl = `https://planningdata.london.gov.uk/api-guest/applications/_source/${encodeURIComponent(row.id)}`;
  const lpaRef = row.lpa_app_no || "";
  const title = `${location} listed-building-consent planning record`;
  const observed = `Planning London Datahub records a ${row.application_type_full || "listed building consent"} application for ${location} with ${row.decision || row.status || "recorded"} status on ${date}.`;
  const candidate = {
    city_id: "london",
    candidate_id: `lon_arch_pld_lbc_${slug(location, 42)}_${date.replaceAll("-", "_")}_${slug(row.id, 60)}`,
    title,
    summary: `${observed} Application description field: ${desc}`,
    observed_change: observed,
    date,
    effective_date: date,
    date_precision: "day",
    source_id: sourceId,
    source_ids: [sourceId],
    source_name: sourceMeta.source_name,
    publisher: sourceMeta.publisher,
    source_url: sourceUrl,
    source_record_id: `PLD:${row.id}${lpaRef ? `; LPA:${lpaRef}` : ""}`,
    source_type: "official/public London planning application API row",
    accessed_at: ACCESSED_AT,
    source_date_field: "Planning London Datahub decision_date",
    latitude: round6(point.latitude),
    longitude: round6(point.longitude),
    geometry_source: geometrySource,
    geometry_precision: row.wgs84_polygon ? "source WGS84 polygon with representative point" : "source centroid",
    confidence: "documented",
    project_type: pldProjectType(row),
    license_or_terms_note: sourceMeta.license_or_terms_note,
    attribution: "Contains public Planning London Datahub application data from the Greater London Authority and London planning authorities; licence on London Datastore is marked Not Specified as accessed 2026-05-19.",
    limitations: "This is an administrative planning application/consent row. It does not prove that works started, were completed, were occupied, produced heritage benefit, or caused any outcome. Borough feed quality and field completeness vary.",
    transformation_method: "Queried the Planning London Datahub applications Elasticsearch API for Listed Building Consent / Full planning & listed building consent rows with decision_date from 2008-01-01 through 2026-05-19; ranked by source GIA/site/cost/description signals; converted centroid or WGS84 polygon to a representative point; de-duplicated against existing architecture milestone corpus by PLD id, LPA reference, source URL, title, and date.",
    _score: pldScore(row),
    _dataset: "pld-listed-building-consent",
    _dedupe_pld_id: row.id,
    _dedupe_lpa_ref: lpaRef,
    _group_key: `${normalize(row.application_details?.scheme_name || row.site_name || location)}|${date}`,
  };
  return { candidate };
}

function cleanCandidate(candidate) {
  const copy = {};
  for (const [key, value] of Object.entries(candidate)) {
    if (!key.startsWith("_")) copy[key] = value;
  }
  return copy;
}

function rejectRecord(source, record, reason) {
  const title = record?.title || record?.name || record?.site_name || record?.application_details?.scheme_name || record?.id || "record";
  const sourceRecord = record?.source_record_id
    || (record?.id ? `PLD:${record.id}${record.lpa_app_no ? `; LPA:${record.lpa_app_no}` : ""}` : `Planning Data ${record?.dataset || source} entity ${record?.entity || ""}`.trim());
  return {
    city_id: "london",
    source,
    source_record_id: sourceRecord,
    title: sentenceTrim(title, 140),
    source_url: record?.source_url || (record?.id ? `https://planningdata.london.gov.uk/api-guest/applications/_source/${encodeURIComponent(record.id)}` : record?.entity ? `https://www.planning.data.gov.uk/entity/${record.entity}` : ""),
    accessed_at: ACCESSED_AT,
    reason,
  };
}

function selectCandidates(candidates) {
  candidates.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return String(b.date).localeCompare(String(a.date));
  });
  const caps = {
    "pld-listed-building-consent": 120,
    "listed-building": 30,
    "conservation-area": 24,
    "article-4-direction-area": 16,
    "archaeological-priority-area": 10,
    "asset-of-community-value": 10,
    "locally-listed-building": 10,
    "building-preservation-notice": 10,
  };
  const counts = {};
  const selected = [];
  const groups = new Set();
  const selectedIds = new Set();
  const years = [...new Set(candidates.map((c) => String(c.date).slice(0, 4)).filter(Boolean))].sort();

  for (const year of years) {
    let pickedForYear = 0;
    for (const candidate of candidates.filter((c) => String(c.date).startsWith(year))) {
      if (selected.length >= 120 || pickedForYear >= 4) break;
      const dataset = candidate._dataset;
      if ((counts[dataset] || 0) >= (caps[dataset] || 120)) continue;
      if (candidate._group_key && groups.has(candidate._group_key)) continue;
      selected.push(candidate);
      selectedIds.add(candidate.candidate_id);
      counts[dataset] = (counts[dataset] || 0) + 1;
      pickedForYear += 1;
      if (candidate._group_key) groups.add(candidate._group_key);
    }
  }

  for (const candidate of candidates) {
    if (selected.length >= 120) break;
    if (selectedIds.has(candidate.candidate_id)) continue;
    const dataset = candidate._dataset;
    if ((counts[dataset] || 0) >= (caps[dataset] || 120)) continue;
    if (candidate._group_key && groups.has(candidate._group_key)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.candidate_id);
    counts[dataset] = (counts[dataset] || 0) + 1;
    if (candidate._group_key) groups.add(candidate._group_key);
  }

  for (const candidate of candidates) {
    if (selected.length >= 120) break;
    if (selectedIds.has(candidate.candidate_id)) continue;
    if (candidate._group_key && groups.has(candidate._group_key)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.candidate_id);
    if (candidate._group_key) groups.add(candidate._group_key);
  }
  return selected;
}

function buildNotes(stats, selected, rejected) {
  const bySource = selected.reduce((acc, c) => {
    acc[c.source_id] = (acc[c.source_id] || 0) + 1;
    return acc;
  }, {});
  return `# Round 119 London Planning Data high-volume notes

Accessed: ${ACCESSED_AT}

## What was queried

- MHCLG Planning Data API entity rows for Greater London LPA geometries: ${PLANNING_DATASETS.join(", ")}.
- Planning London Datahub application rows where the application type matched Listed Building Consent / Full planning & listed building consent and \`decision_date\` fell from ${START} through ${END}.
- Existing duplicate context: \`data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json\`.

## Output summary

- Candidate count: ${selected.length}
- Candidate count by source: ${Object.entries(bySource).map(([k, v]) => `${k}: ${v}`).join("; ")}
- Planning Data rows inspected: ${stats.planningRows}
- PLD rows inspected: ${stats.pldRows}
- Reject samples written: ${rejected.length}

## Duplicate handling

Candidates were rejected when the existing corpus already appeared to contain the same source record/entity/reference/title/date. The duplicate index checks exact normalized source records/URLs/titles plus NHLE references, Planning Data entity IDs, PLD IDs, LPA references, and exact title/date pairs. This is conservative, but final ingestion should still do a manual near-duplicate pass for related planning applications that share a scheme name and date.

## Source caveats

- Planning Data listed-building rows are strong for statutory list-entry/designation milestones when \`start-date\` is present. They are not construction, opening, refurbishment, occupation, or impact records. Many listed-building geometries are points only.
- Planning Data conservation-area data is explicitly a work in progress and may include duplicate areas being reconciled. Use the source \`start-date\` wording rather than implying a newly built environment change.
- Article 4 direction areas record planning-control geography. They do not document physical alteration.
- Archaeological Priority Area rows often expose \`entry-date\` without original designation dates. Those rows are lower confidence and must not present entry-date as the original effective date.
- Asset of Community Value rows record a community-asset/local-land-charge planning consideration; they do not by themselves show reuse, preservation, or development outcome.
- Planning London Datahub Listed Building Consent rows are administrative application records. They support decision/consent timeline events only. They do not prove works began, completed, succeeded, or caused a city outcome.
- The London Datastore page for Planning London Datahub applications lists Licence: Not Specified. Treat PLD-derived candidates as factual pointers for review until reuse terms are resolved.
- Some PLD centroid values are visibly outside London; this pass used the supplied WGS84 polygon to derive a representative point when needed and rejected rows without reliable London geometry.

## Recommended next checks

- For selected PLD records, open the borough planning-register URL when present, or the PLD \`_source\` URL otherwise, before final ingestion.
- For selected Planning Data records, verify source rows against the dataset page and, for listed buildings, the NHLE \`documentation-url\` where present.
- Keep all event wording administrative: "records", "listed", "consent row", "designation", "start-date", and "entry-date" rather than construction, causality, forecast, or impact language.
`;
}

async function main() {
  const index = existingCorpusIndex();
  const candidates = [];
  const rejected = [];
  const stats = { planningRows: 0, pldRows: 0 };

  for (const dataset of PLANNING_DATASETS) {
    const rows = await fetchPlanningDataset(dataset);
    stats.planningRows += rows.length;
    for (const row of rows) {
      const result = planningCandidate(row);
      if (result.rejected) {
        if (rejected.length < 90) rejected.push(rejectRecord(dataset, row, result.rejected));
        continue;
      }
      const dupe = duplicateReason(result.candidate, index);
      if (dupe) {
        if (rejected.length < 90) rejected.push(rejectRecord(dataset, result.candidate, dupe));
        continue;
      }
      candidates.push(result.candidate);
    }
  }

  const pldRows = await fetchPldLbcRows();
  stats.pldRows = pldRows.length;
  for (const row of pldRows) {
    const result = pldCandidate(row);
    if (result.rejected) {
      if (rejected.length < 110) rejected.push(rejectRecord("pld-listed-building-consent", row, result.rejected));
      continue;
    }
    const dupe = duplicateReason(result.candidate, index);
    if (dupe) {
      if (rejected.length < 110) rejected.push(rejectRecord("pld-listed-building-consent", result.candidate, dupe));
      continue;
    }
    candidates.push(result.candidate);
  }

  const selected = selectCandidates(candidates);
  const selectedSet = new Set(selected);
  for (const candidate of candidates) {
    if (selectedSet.has(candidate)) continue;
    if (rejected.length >= 130) break;
    rejected.push(rejectRecord(candidate._dataset, candidate, "Non-duplicate but not selected because the output is capped at 120 strongest candidates with source diversity caps."));
  }

  selected.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.candidate_id).localeCompare(String(b.candidate_id)));
  const output = {
    source_audits: Object.values(SOURCE_META),
    candidates: selected.map(cleanCandidate),
    rejected,
  };
  fs.writeFileSync(path.join(OUT_DIR, "candidates.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "notes.md"), buildNotes(stats, selected, rejected), "utf8");
  console.log(JSON.stringify({
    candidates_seen: candidates.length,
    candidates_written: selected.length,
    rejected_written: rejected.length,
    planning_rows: stats.planningRows,
    pld_rows: stats.pldRows,
    output: path.join(OUT_DIR, "candidates.json"),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
