const fs = require("fs");
const path = require("path");

const retrievedAt = "2026-05-19";
const outDir = "tmp/subagents/round141_belfast_harni_gaps";
const candidatesPath = path.join(outDir, "candidates.json");
const sourceAuditPath = path.join(outDir, "source_audit.json");
const summaryPath = path.join(outDir, "summary.json");
const notesPath = path.join(outDir, "notes.md");

const manualCorpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const sourceRegistryPath = "config/source_registry.json";
const round128CachePath = "tmp/subagents/round128_belfast_harni_spatial/candidates.json";

const sourceId = "dfc-harni-belfast";
const sourceName = "Heritage at Risk in Northern Ireland Belfast ArcGIS spatial layer";
const publisher = "Department for Communities Historic Environment Division";
const harniPage = "https://apps.communities-ni.gov.uk/HARNI/";
const serviceUrl =
  "https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/3";
const fields = [
  "HB_Ref",
  "BHARNI_Ref",
  "Address",
  "Category",
  "Ownership",
  "Date_Added",
  "LGD",
  "County",
  "OBJECTID",
  "Main_ID"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cleanText(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase();
}

function normalizeRef(value) {
  return normalizeKey(value).replace(/\s+/g, " ");
}

function parseDate(value) {
  const text = cleanText(value);
  let match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  return "";
}

function safeSlug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sourceUrlFor(objectId) {
  return `${serviceUrl}/query?where=OBJECTID%3D${encodeURIComponent(
    objectId
  )}&outFields=${fields.join(",")}&returnGeometry=true&f=geojson`;
}

function projectTypeFor(category) {
  const categoryText = cleanText(category);
  if (/saved/i.test(categoryText)) return "heritage-at-risk saved-status record";
  if (/demolished/i.test(categoryText)) return "heritage-at-risk demolished-status record";
  return "heritage-at-risk status record";
}

function extractObjectIds(...values) {
  const ids = new Set();
  for (const value of values) {
    const text = String(value || "");
    for (const match of text.matchAll(/OBJECTID\s*:\s*([^;,\s]+)/gi)) ids.add(normalizeRef(match[1]));
    for (const match of text.matchAll(/OBJECTID(?:%3D|=)(\d+)/gi)) ids.add(normalizeRef(match[1]));
  }
  return [...ids].filter(Boolean);
}

function extractBharniRefs(...values) {
  const refs = new Set();
  for (const value of values) {
    const text = String(value || "");
    for (const match of text.matchAll(/BHARNI\s*:\s*([0-9]{2}\/[0-9]{2}\/[0-9]{3})/gi)) {
      refs.add(normalizeRef(match[1]));
    }
    for (const match of text.matchAll(/HARNI\s+([0-9]{2}\/[0-9]{2}\/[0-9]{3})/gi)) {
      refs.add(normalizeRef(match[1]));
    }
  }
  return [...refs].filter(Boolean);
}

function extractHbRefs(...values) {
  const refs = new Set();
  for (const value of values) {
    const text = String(value || "");
    for (const match of text.matchAll(/\bHB[0-9]{2}\/[0-9]{2}\/[0-9A-Z ]+\b/gi)) {
      refs.add(normalizeRef(match[0]));
    }
  }
  return [...refs].filter(Boolean);
}

function manualEventSummary(event) {
  return {
    event_id: event.event_id || event.id || "",
    date: event.date || event.effective_date || "",
    title: event.title || "",
    source_record_id: event.source_record_id || event.provenance?.source_record_id || "",
    source_url: event.source_url || event.provenance?.source_url || ""
  };
}

function addIndex(map, key, event) {
  if (!key) return;
  if (!map.has(key)) map.set(key, manualEventSummary(event));
}

function buildManualIndex(events) {
  const index = {
    objectIds: new Map(),
    bharniRefs: new Map(),
    hbRefs: new Map(),
    sourceRecordIds: new Map(),
    sourceUrls: new Map(),
    sourceCandidateIds: new Map()
  };

  for (const event of events) {
    const recordId = event.source_record_id || event.provenance?.source_record_id || "";
    const sourceUrl = event.source_url || event.provenance?.source_url || "";
    const id = event.event_id || event.id || "";
    addIndex(index.sourceRecordIds, normalizeKey(recordId), event);
    addIndex(index.sourceUrls, normalizeKey(sourceUrl), event);
    addIndex(index.sourceCandidateIds, normalizeKey(id), event);
    for (const objectId of extractObjectIds(recordId, sourceUrl)) addIndex(index.objectIds, objectId, event);
    for (const bharniRef of extractBharniRefs(recordId)) addIndex(index.bharniRefs, bharniRef, event);
    for (const hbRef of extractHbRefs(recordId)) addIndex(index.hbRefs, hbRef, event);
  }

  return index;
}

function sourceCandidateFromFeature(feature) {
  const properties = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  const date = parseDate(properties.Date_Added);
  const objectId = cleanText(properties.OBJECTID);
  const bhRef = cleanText(properties.BHARNI_Ref);
  const hbRef = cleanText(properties.HB_Ref);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      rejected: true,
      reason: "missing_point_geometry",
      object_id: objectId,
      bharni_ref: bhRef,
      hb_ref: hbRef,
      date_added: properties.Date_Added || ""
    };
  }

  if (!date || date < "2008-01-01" || date > retrievedAt) {
    return {
      rejected: true,
      reason: "missing_or_out_of_window_date_added",
      object_id: objectId,
      bharni_ref: bhRef,
      hb_ref: hbRef,
      date_added: properties.Date_Added || ""
    };
  }

  return candidateFor({
    rawRow: properties,
    latitude,
    longitude,
    date,
    dateAddedRaw: cleanText(properties.Date_Added)
  });
}

function sourceCandidateFromCachedCandidate(candidate) {
  const rawRow = candidate.raw_row || {};
  return candidateFor({
    rawRow,
    latitude: Number(candidate.latitude),
    longitude: Number(candidate.longitude),
    date: candidate.date,
    dateAddedRaw: cleanText(rawRow.Date_Added || candidate.raw_date_added || candidate.date)
  });
}

function candidateFor({ rawRow, latitude, longitude, date, dateAddedRaw }) {
  const category = cleanText(rawRow.Category || "Heritage at Risk");
  const address = cleanText(rawRow.Address || "Belfast heritage-at-risk record");
  const bhRef = cleanText(rawRow.BHARNI_Ref || rawRow.OBJECTID);
  const hbRef = cleanText(rawRow.HB_Ref);
  const objectId = cleanText(rawRow.OBJECTID);
  const ownership = cleanText(rawRow.Ownership || "not supplied");
  const projectType = projectTypeFor(category);
  const safeRef = safeSlug(bhRef || objectId || `${latitude}_${longitude}`);
  const sourceUrl = sourceUrlFor(objectId);

  return {
    city_id: "belfast",
    record_kind: "candidate_event",
    candidate_id: `belfast-harni-gap-${safeRef}-date-added-${date}`,
    event_id_suggestion: `bfs_arch_belfast_harni_spatial_${safeRef}_date_added_${date.replace(/-/g, "_")}`,
    date,
    date_precision: "day",
    bucket: "planning/development/architecture/heritage_at_risk",
    event_family: "architecture/heritage-status",
    title: `HARNI spatial layer recorded ${category} status for ${address}`,
    summary: `The Department for Communities HED Heritage at Risk spatial layer records ${address} in Belfast with category '${category}', Date_Added ${dateAddedRaw}, BHARNI reference ${bhRef || "not supplied"}, HB reference ${hbRef || "not supplied"}, and ownership '${ownership}'.`,
    observed_change: `Official HARNI spatial-layer milestone: the record carries Date_Added ${dateAddedRaw} and category '${category}' for ${address}. This is a heritage register/status record, not a physical works observation.`,
    area: address,
    latitude,
    longitude,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    source_ids: [sourceId],
    source_name: sourceName,
    publisher,
    source_url: sourceUrl,
    source_record_id: `BHARNI:${bhRef || "not supplied"}; HB:${hbRef || "not supplied"}; OBJECTID:${objectId || "not supplied"}; Main_ID:${cleanText(rawRow.Main_ID) || "not supplied"}`,
    source_type: "official HED ArcGIS REST heritage-at-risk feature row",
    accessed_at: retrievedAt,
    source_date_field: "Date_Added",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Source record does not name a project architect.",
    project_type: projectType,
    geometry_source: "Point geometry from the Department for Communities HED ArcGIS Heritage at Risk layer.",
    geometry_precision:
      "Official heritage-at-risk point for the register entry; not a measured building footprint, parcel boundary, or condition-survey extent.",
    license_or_terms_note:
      "OpenDataNI / UK Open Government Licence v3.0 applies to the ArcGIS factual dataset where applicable; HARNI website content, images, logos, mapping tiles, and third-party material may have separate terms.",
    license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    attribution: "Department for Communities Historic Environment Division / Heritage at Risk in Northern Ireland",
    limitations:
      "HARNI condition/risk records are heritage register/status observations and may lag physical condition. Date_Added is a register/source date, not construction, repair completion, vacancy, occupancy, demolition date, ownership-transfer date, condition outcome, or causal evidence unless separately documented.",
    source_fields: {
      OBJECTID: rawRow.OBJECTID ?? "",
      BHARNI_Ref: rawRow.BHARNI_Ref ?? "",
      HB_Ref: rawRow.HB_Ref ?? "",
      Date_Added: rawRow.Date_Added ?? "",
      Main_ID: rawRow.Main_ID ?? ""
    },
    raw_row: {
      HB_Ref: rawRow.HB_Ref,
      BHARNI_Ref: rawRow.BHARNI_Ref,
      Address: rawRow.Address,
      Category: rawRow.Category,
      Ownership: rawRow.Ownership,
      Date_Added: rawRow.Date_Added,
      LGD: rawRow.LGD,
      County: rawRow.County,
      OBJECTID: rawRow.OBJECTID,
      Main_ID: rawRow.Main_ID
    },
    transformation_method:
      "scripts/fetch_round141_belfast_harni_gaps_candidates.js queried the official HED ArcGIS HARNI Belfast layer, normalized Date_Added and point geometry, then removed rows already present in the current manual architecture corpus by OBJECTID, BHARNI_Ref, source record, and limited fallback keys."
  };
}

function duplicateMatch(candidate, manualIndex) {
  const recordId = normalizeKey(candidate.source_record_id);
  const sourceUrl = normalizeKey(candidate.source_url);
  const objectIds = extractObjectIds(candidate.source_record_id, candidate.source_url);
  const bharniRefs = extractBharniRefs(candidate.source_record_id);
  const hbRefs = extractHbRefs(candidate.source_record_id);
  const eventIdSuggestion = normalizeKey(candidate.event_id_suggestion);

  if (manualIndex.sourceRecordIds.has(recordId)) {
    return {
      duplicate: true,
      reason: "source_record_id_match",
      matched_manual_event: manualIndex.sourceRecordIds.get(recordId)
    };
  }
  if (manualIndex.sourceUrls.has(sourceUrl)) {
    return {
      duplicate: true,
      reason: "source_url_match",
      matched_manual_event: manualIndex.sourceUrls.get(sourceUrl)
    };
  }
  if (manualIndex.sourceCandidateIds.has(eventIdSuggestion)) {
    return {
      duplicate: true,
      reason: "event_id_suggestion_match",
      matched_manual_event: manualIndex.sourceCandidateIds.get(eventIdSuggestion)
    };
  }
  for (const objectId of objectIds) {
    if (manualIndex.objectIds.has(objectId)) {
      return {
        duplicate: true,
        reason: "objectid_match",
        matched_key: objectId,
        matched_manual_event: manualIndex.objectIds.get(objectId)
      };
    }
  }
  for (const bharniRef of bharniRefs) {
    if (manualIndex.bharniRefs.has(bharniRef)) {
      return {
        duplicate: true,
        reason: "bharni_ref_match",
        matched_key: bharniRef,
        matched_manual_event: manualIndex.bharniRefs.get(bharniRef)
      };
    }
  }

  const hasBharni = bharniRefs.length > 0 && !bharniRefs.includes("not supplied");
  if (!hasBharni) {
    for (const hbRef of hbRefs) {
      if (manualIndex.hbRefs.has(hbRef)) {
        return {
          duplicate: true,
          reason: "hb_ref_fallback_match_when_bharni_missing",
          matched_key: hbRef,
          matched_manual_event: manualIndex.hbRefs.get(hbRef)
        };
      }
    }
  }

  return { duplicate: false };
}

function countBy(rows, selector) {
  return rows.reduce((counts, row) => {
    const key = selector(row) || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function requireCandidateFields(candidates) {
  const required = [
    "candidate_id",
    "date",
    "bucket",
    "title",
    "source_url",
    "source_record_id",
    "publisher",
    "accessed_at",
    "confidence",
    "geometry_source",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "source_fields"
  ];
  const seenIds = new Set();
  for (const candidate of candidates) {
    if (seenIds.has(candidate.candidate_id)) throw new Error(`Duplicate candidate_id ${candidate.candidate_id}`);
    seenIds.add(candidate.candidate_id);
    for (const field of required) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        throw new Error(`Candidate ${candidate.candidate_id} is missing ${field}`);
      }
    }
    for (const field of ["OBJECTID", "BHARNI_Ref", "HB_Ref", "Date_Added"]) {
      if (!(field in candidate.source_fields)) {
        throw new Error(`Candidate ${candidate.candidate_id} is missing source_fields.${field}`);
      }
    }
  }
}

async function fetchOfficialFeatures() {
  const params = new URLSearchParams({
    where: "LGD='Belfast'",
    outFields: fields.join(","),
    returnGeometry: "true",
    orderByFields: "OBJECTID",
    f: "geojson"
  });
  const sourceUrl = `${serviceUrl}/query?${params.toString()}`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`HARNI ArcGIS fetch failed: ${response.status} ${response.statusText}`);
  const geojson = await response.json();
  return {
    sourceMode: "official_arcgis_live",
    sourceUrl,
    features: geojson.features || [],
    cache: null
  };
}

function loadRound128Cache() {
  const cache = readJson(round128CachePath);
  const candidates = cache.candidates || [];
  const rejected = cache.rejected || [];
  return {
    sourceMode: "round128_local_cache",
    sourceUrl: round128CachePath,
    features: null,
    cache: {
      generated_at: cache.generated_at || "",
      candidates,
      rejected
    }
  };
}

async function loadSourceRows() {
  if (process.argv.includes("--cache-only")) return loadRound128Cache();
  try {
    return await fetchOfficialFeatures();
  } catch (error) {
    if (!fs.existsSync(round128CachePath)) throw error;
    const cached = loadRound128Cache();
    cached.fetch_error = String(error.message || error);
    return cached;
  }
}

function loadSourceRegistryEntry() {
  if (!fs.existsSync(sourceRegistryPath)) return null;
  const registry = readJson(sourceRegistryPath);
  return (registry.sources || []).find((source) => source.source_id === sourceId) || null;
}

function buildSourceCandidates(sourceLoad) {
  if (sourceLoad.cache) {
    const candidates = sourceLoad.cache.candidates.map(sourceCandidateFromCachedCandidate);
    const rejected = sourceLoad.cache.rejected.map((row) => ({
      rejected: true,
      reason: row.reason || "rejected_by_round128_cache",
      object_id: row.object_id || "",
      bharni_ref: row.bharni_ref || "",
      hb_ref: row.hb_ref || "",
      date_added: row.date_added || ""
    }));
    return { candidates, rejected };
  }

  const candidates = [];
  const rejected = [];
  for (const feature of sourceLoad.features || []) {
    const row = sourceCandidateFromFeature(feature);
    if (row.rejected) rejected.push(row);
    else candidates.push(row);
  }
  return { candidates, rejected };
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function buildNotes(summary) {
  return [
    "# Round141 Belfast HARNI spatial gap candidate pack",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    `Source rows seen: ${summary.source_rows.total_rows_seen}. Candidate-eligible rows after Date_Added and point-geometry screening: ${summary.source_rows.eligible_source_rows}.`,
    `Rows already represented in the current manual corpus: ${summary.dedupe.duplicates_against_manual}.`,
    `New gap candidates emitted: ${summary.dedupe.new_candidate_count}.`,
    "",
    "## Caveat",
    "",
    "HARNI rows are heritage risk/register status records. Date_Added is a source/register date, not evidence of physical works, repair completion, vacancy, occupancy, demolition date, ownership transfer, condition outcome, or causal impact unless a separate source directly supports that narrower claim.",
    "",
    "## Deduplication",
    "",
    "The pass deduped against the current manual architecture corpus using source_record_id, source_url, suggested event id, OBJECTID, BHARNI_Ref, and HB_Ref only as a fallback where BHARNI_Ref is missing.",
    ""
  ].join("\n");
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const sourceLoad = await loadSourceRows();
  const { candidates: sourceCandidates, rejected } = buildSourceCandidates(sourceLoad);
  sourceCandidates.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  const manualDoc = readJson(manualCorpusPath);
  const manualEvents = manualDoc.events || [];
  const manualIndex = buildManualIndex(manualEvents);
  const registryEntry = loadSourceRegistryEntry();

  const candidates = [];
  const duplicates = [];
  for (const candidate of sourceCandidates) {
    const match = duplicateMatch(candidate, manualIndex);
    if (match.duplicate) {
      duplicates.push({
        candidate_id: candidate.candidate_id,
        date: candidate.date,
        title: candidate.title,
        source_record_id: candidate.source_record_id,
        object_id: candidate.source_fields.OBJECTID,
        bharni_ref: candidate.source_fields.BHARNI_Ref,
        hb_ref: candidate.source_fields.HB_Ref,
        duplicate_reason: match.reason,
        matched_key: match.matched_key || "",
        matched_manual_event: match.matched_manual_event
      });
    } else {
      candidates.push(candidate);
    }
  }

  requireCandidateFields(candidates);

  const sourceRowsSeen = sourceLoad.cache
    ? sourceLoad.cache.candidates.length + sourceLoad.cache.rejected.length
    : (sourceLoad.features || []).length;
  const round128Cache = fs.existsSync(round128CachePath) ? readJson(round128CachePath) : null;
  const round128CandidateIds = new Set((round128Cache?.candidates || []).map((candidate) => candidate.candidate_id));
  const liveCandidateIds = new Set(
    sourceCandidates.map((candidate) =>
      candidate.candidate_id.replace(/^belfast-harni-gap-/, "belfast-harni-spatial-")
    )
  );
  const cacheComparison = round128Cache
    ? {
        cache_path: round128CachePath,
        cache_generated_at: round128Cache.generated_at || "",
        cache_candidate_count: (round128Cache.candidates || []).length,
        cache_rejected_count: (round128Cache.rejected || []).length,
        live_or_loaded_eligible_count: sourceCandidates.length,
        candidate_ids_missing_from_cache: [...liveCandidateIds].filter((id) => !round128CandidateIds.has(id)).sort(),
        cache_candidate_ids_not_in_live_or_loaded: [...round128CandidateIds].filter((id) => !liveCandidateIds.has(id)).sort()
      }
    : null;

  const sourceAudit = {
    generated_at: retrievedAt,
    source_id: sourceId,
    source_name: sourceName,
    publisher,
    source_url: harniPage,
    api_endpoint: serviceUrl,
    query_url_or_cache: sourceLoad.sourceUrl,
    source_mode: sourceLoad.sourceMode,
    fetch_error: sourceLoad.fetch_error || null,
    license_or_terms_note:
      registryEntry?.licence ||
      "Crown copyright / Open Government Licence v3.0 for public-sector factual information unless otherwise stated; images, logos, mapping, and third-party material excluded.",
    license_url: registryEntry?.licence_url || "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    attribution:
      registryEntry?.attribution_text ||
      "Attribute Department for Communities Historic Environment Division / Heritage at Risk in Northern Ireland.",
    coverage_years_checked: `Belfast HARNI ArcGIS rows with Date_Added from 2008-01-01 through ${retrievedAt}.`,
    update_frequency: registryEntry?.update_frequency || "Record-specific update/review cadence.",
    geographic_scope: "Belfast heritage-at-risk point records in the HED ArcGIS service.",
    key_fields_used: fields.join(", "),
    preserved_fields: ["OBJECTID", "BHARNI_Ref", "HB_Ref", "Date_Added", "point geometry", "publisher", "source URL", "license", "attribution", "accessed_at", "confidence", "limitations"],
    reliability: "strong for official register/status observations; usable with caveats for city-change events",
    ingestion_recommendation:
      "Use Date_Added/category as heritage-register/status milestones only. Do not infer construction, restoration, demolition timing, ownership change, condition improvement, vacancy, occupancy, or outcome effects from the status row alone.",
    required_caveats: [
      "Heritage risk/register status, not observed physical works or condition outcome.",
      "Date_Added is a register/source date, not necessarily a real-world change date.",
      "Point geometry identifies the HARNI register entry location; it is not a measured building footprint, parcel boundary, or condition-survey extent."
    ],
    registry_reference: registryEntry
      ? {
          source_id: registryEntry.source_id,
          title: registryEntry.title,
          provider: registryEntry.provider,
          reliability: registryEntry.reliability,
          source_confidence: registryEntry.source_confidence,
          caveats: registryEntry.caveats || []
        }
      : null,
    row_counts: {
      total_rows_seen: sourceRowsSeen,
      eligible_source_rows: sourceCandidates.length,
      rejected_source_rows: rejected.length,
      duplicate_rows_against_manual_corpus: duplicates.length,
      emitted_gap_candidates: candidates.length
    }
  };

  const manualHarniLikeCount = manualEvents.filter((event) => {
    const text = JSON.stringify(event);
    return (
      event.city_id === "belfast" &&
      (/HARNI|BHARNI|heritage-at-risk|heritage_at_risk/i.test(text) ||
        (event.source_ids || []).includes(sourceId) ||
        event.source_dataset_id === sourceId)
    );
  }).length;

  const summary = {
    generated_at: retrievedAt,
    source_rows: {
      source_mode: sourceLoad.sourceMode,
      total_rows_seen: sourceRowsSeen,
      eligible_source_rows: sourceCandidates.length,
      rejected_source_rows: rejected.length,
      categories_in_eligible_rows: countBy(sourceCandidates, (candidate) => candidate.raw_row.Category),
      eligible_rows_by_year: countBy(sourceCandidates, (candidate) => candidate.date.slice(0, 4)),
      rejection_reason_counts: countBy(rejected, (row) => row.reason)
    },
    dedupe: {
      manual_corpus_path: manualCorpusPath,
      manual_event_count: manualEvents.length,
      manual_belfast_harni_like_count: manualHarniLikeCount,
      manual_index_counts: {
        object_ids: manualIndex.objectIds.size,
        bharni_refs: manualIndex.bharniRefs.size,
        hb_refs: manualIndex.hbRefs.size,
        source_record_ids: manualIndex.sourceRecordIds.size,
        source_urls: manualIndex.sourceUrls.size
      },
      dedupe_keys: [
        "source_record_id",
        "source_url",
        "event_id_suggestion",
        "OBJECTID",
        "BHARNI_Ref",
        "HB_Ref fallback only when BHARNI_Ref is missing"
      ],
      duplicates_against_manual: duplicates.length,
      duplicate_reason_counts: countBy(duplicates, (row) => row.duplicate_reason),
      new_candidate_count: candidates.length,
      duplicate_samples: duplicates.slice(0, 12)
    },
    round128_cache_comparison: cacheComparison,
    output_files: {
      candidates: candidatesPath,
      source_audit: sourceAuditPath,
      summary: summaryPath,
      notes: notesPath
    },
    caveat:
      "HARNI rows are heritage risk/register status records. They are not physical works, repair completion, demolition timing, condition outcome, ownership, occupancy, or causal-impact evidence unless separately sourced."
  };

  const candidatesPayload = {
    generated_at: retrievedAt,
    source_id: sourceId,
    source_name: sourceName,
    source_mode: sourceLoad.sourceMode,
    source_url: harniPage,
    api_endpoint: serviceUrl,
    accessed_at: retrievedAt,
    deduped_against: manualCorpusPath,
    candidate_count: candidates.length,
    candidates
  };

  writeJson(candidatesPath, candidatesPayload);
  writeJson(sourceAuditPath, sourceAudit);
  writeJson(summaryPath, summary);
  fs.writeFileSync(notesPath, buildNotes(summary));

  console.log(
    JSON.stringify(
      {
        source_mode: sourceLoad.sourceMode,
        source_rows_seen: sourceRowsSeen,
        eligible_source_rows: sourceCandidates.length,
        duplicates_against_manual: duplicates.length,
        candidates: candidates.length,
        rejected: rejected.length,
        outDir
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
