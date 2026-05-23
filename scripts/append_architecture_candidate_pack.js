#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const MILESTONES_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json",
);

const CITY_PREFIX = {
  belfast: "bfs",
  london: "lon",
  nyc: "nyc",
};

const SOURCE_ID_ALIASES = {
  "london-planning-datahub-api/core": "london-planning-datahub-api-core",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  fs.writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstValue(...values) {
  for (const value of values) {
    const text = compactText(value);
    if (text) return text;
  }
  return "";
}

function normalizeSourceId(value) {
  const sourceId = compactText(value);
  return SOURCE_ID_ALIASES[sourceId] || sourceId;
}

function firstYear(value) {
  const match = compactText(value).match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function inferPrecision(value) {
  const text = compactText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return "day";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  if (/^\d{4}$/.test(text)) return "year";
  if (/\d{4}.*\d{4}/.test(text)) return "range";
  return "unknown";
}

function slug(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 180);
}

function stableHash(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, 10);
}

function eventIdFor(candidate) {
  const cityId = compactText(candidate.city_id || candidate.city || "nyc");
  const prefix = CITY_PREFIX[cityId] || slug(cityId || "city");
  const raw = compactText(candidate.event_id || candidate.candidate_id);
  if (raw.startsWith(`${prefix}_arch_`)) return raw;
  const body = slug(raw || `${candidate.source_record_id}_${candidate.effective_date || candidate.date}`);
  return `${prefix}_arch_${body || stableHash(JSON.stringify(candidate))}`;
}

function candidateRows(candidateDoc) {
  if (Array.isArray(candidateDoc)) return candidateDoc;
  if (Array.isArray(candidateDoc.candidates)) return candidateDoc.candidates;
  if (Array.isArray(candidateDoc.events)) return candidateDoc.events;
  throw new Error("Candidate pack must be an array or expose a candidates/events array.");
}

function sourceIdsFor(candidate) {
  const ids = Array.isArray(candidate.source_ids) ? candidate.source_ids : [candidate.source_id];
  return [...new Set(ids.map(normalizeSourceId).filter(Boolean))];
}

function sourceTitle(sourceId, rows) {
  if (sourceId === "nyc-dob-now-build-approved-permits-rbx6-tga4") {
    return "NYC Open Data: DOB NOW: Build - Approved Permits";
  }
  if (sourceId === "nyc-dob-now-build-job-application-filings-w9ak-ipjd") {
    return "NYC Open Data: DOB NOW: Build - Job Application Filings";
  }
  if (sourceId === "london-planning-datahub-api-core") {
    return "Planning London Datahub applications API";
  }
  if (sourceId === "nyc-open-data-lpc-permit-application-information-dpm2-m9mq") {
    return "NYC Open Data: LPC Permit Application Information";
  }
  return firstValue(rows[0]?.source_name, sourceId);
}

function accessUrlFor(sourceId, rows) {
  const first = rows[0] || {};
  if (sourceId === "nyc-dob-now-build-approved-permits-rbx6-tga4") {
    return firstValue(
      first.source_page_url,
      "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4",
    );
  }
  if (sourceId === "nyc-dob-now-build-job-application-filings-w9ak-ipjd") {
    return firstValue(
      first.application_source_page_url,
      "https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd",
    );
  }
  if (sourceId === "london-planning-datahub-api-core") {
    return firstValue(first.source_api_url, "https://planningdata.london.gov.uk/api-guest/applications/_search");
  }
  if (sourceId.startsWith("belfast-city-council-current-planning-applications")) {
    return firstValue(first.source_page_url, first.source_url, "https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications");
  }
  if (sourceId === "nyc-open-data-lpc-permit-application-information-dpm2-m9mq") {
    return "https://data.cityofnewyork.us/Housing-Development/LPC-Permit-Application-Information/dpm2-m9mq";
  }
  return firstValue(first.source_page_url, first.source_url, first.application_source_page_url, first.application_source_url);
}

function sourceFromRows(sourceId, rows, candidateDoc) {
  const years = rows.map((row) => firstYear(row.effective_date || row.date)).filter(Boolean);
  const minYear = years.length ? Math.min(...years) : 2008;
  const maxYear = years.length ? Math.max(...years) : 2026;
  const first = rows[0] || {};
  const dateFields = [...new Set(rows.map((row) => compactText(row.source_date_field)).filter(Boolean))].slice(0, 4);
  const geometryNotes = [...new Set(rows.map((row) => compactText(row.geometry_precision)).filter(Boolean))].slice(0, 3);
  if (sourceId === "london-planning-datahub-api-core") {
    return {
      source_id: sourceId,
      city_ids: [...new Set(rows.map((row) => compactText(row.city_id || row.city)).filter(Boolean))].sort(),
      title: sourceTitle(sourceId, rows),
      publisher: "Greater London Authority and London planning authorities",
      bucket: firstValue(first.bucket, "planning/development/lifecycle"),
      access_url: accessUrlFor(sourceId, rows),
      licence: firstValue(
        first.license,
        first.source_license,
        "Not Specified on London Datastore dataset page checked 2026-05-20; factual row metadata and source URLs retained.",
      ),
      licence_url: firstValue(
        first.license_url,
        "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/",
      ),
      coverage_years: {
        start: minYear,
        end: maxYear,
      },
      time_coverage: `Selected Planning London Datahub administrative lifecycle rows from ${minYear}-${maxYear} in ${candidateDoc.worker || "the architecture candidate pack"}.`,
      spatial_granularity:
        geometryNotes.join("; ") || "Row-level PLD centroid; not a surveyed parcel, building footprint, or work-area polygon.",
      temporal_granularity: dateFields.join("; ") || "PLD actual_commencement_date or actual_completion_date source field.",
      update_frequency: "Daily publisher-updated Planning London Datahub operating dataset.",
      retrieved_at: firstValue(candidateDoc.accessed_at, candidateDoc.generated_at, first.accessed_at, "2026-05-20"),
      limitations:
        "PLD lifecycle rows are administrative planning records. They do not directly evidence construction start, construction completion, public opening, legal occupancy, actual occupancy, final built form, design quality, safety, affordability or outcome effects.",
    };
  }
  if (sourceId.startsWith("belfast-city-council-current-planning-applications")) {
    return {
      source_id: sourceId,
      city_ids: [...new Set(rows.map((row) => compactText(row.city_id || row.city)).filter(Boolean))].sort(),
      title: sourceTitle(sourceId, rows),
      publisher: firstValue(first.publisher, "Belfast City Council"),
      bucket: firstValue(first.bucket, "planning/development/current_applications"),
      access_url: accessUrlFor(sourceId, rows),
      licence: firstValue(
        first.license,
        first.source_license,
        "Belfast City Council website terms and copyright apply; factual application metadata and source URLs retained.",
      ),
      licence_url: firstValue(first.license_url, "https://www.belfastcity.gov.uk/terms-conditions"),
      coverage_years: {
        start: minYear,
        end: maxYear,
      },
      time_coverage: `Selected Belfast City Council current-planning application rows advertised from ${minYear}-${maxYear} in appended architecture candidate packs.`,
      spatial_granularity:
        geometryNotes.join("; ") || "Approximate OSM/Nominatim address or road point; not a surveyed application boundary.",
      temporal_granularity: dateFields.join("; ") || "Belfast City Council advertised-on date from current planning applications page.",
      update_frequency: "Council current-applications page; content changes as applications open and close for comment.",
      retrieved_at: firstValue(candidateDoc.accessed_at, candidateDoc.generated_at, first.accessed_at, "2026-05-23"),
      limitations:
        "Current-planning rows are administrative advertisement/application records. They do not evidence planning permission, construction start, construction completion, public opening, legal occupancy, final built form, or wider effects.",
    };
  }
  if (sourceId === "nyc-open-data-lpc-permit-application-information-dpm2-m9mq") {
    return {
      source_id: sourceId,
      city_ids: [...new Set(rows.map((row) => compactText(row.city_id || row.city)).filter(Boolean))].sort(),
      title: sourceTitle(sourceId, rows),
      publisher: firstValue(first.publisher, "NYC Landmarks Preservation Commission / NYC Open Data"),
      bucket: firstValue(first.bucket, "planning/development/architecture/historic-preservation"),
      access_url: accessUrlFor(sourceId, rows),
      licence: firstValue(first.license, first.source_license, "NYC Open Data Terms of Use / NYC.gov Terms of Use"),
      licence_url: firstValue(first.license_url, "https://opendata.cityofnewyork.us/overview/#termsofuse"),
      coverage_years: {
        start: minYear,
        end: maxYear,
      },
      time_coverage: `Selected LPC administrative permit/application rows from ${minYear}-${maxYear} in ${candidateDoc.worker || "the architecture candidate pack"}.`,
      spatial_granularity:
        geometryNotes.join("; ") || "Official row point/geocode for the permit address or parcel context; not a landmark boundary or proposed-work geometry.",
      temporal_granularity: dateFields.join("; ") || "issue_date from the LPC Permit Application Information row.",
      update_frequency: "NYC Open Data operating dataset; publisher-updated.",
      retrieved_at: firstValue(candidateDoc.accessed_at, candidateDoc.generated_at, first.accessed_at, "2026-05-23"),
      limitations:
        "LPC permit/application rows are administrative preservation records. They do not evidence construction start, construction completion, compliance sign-off, final physical condition, preservation outcome, or full approved-work geometry.",
    };
  }
  return {
    source_id: sourceId,
    city_ids: [...new Set(rows.map((row) => compactText(row.city_id || row.city)).filter(Boolean))].sort(),
    title: sourceTitle(sourceId, rows),
    publisher: firstValue(first.publisher, "NYC Department of Buildings (DOB), via NYC Open Data"),
    bucket: firstValue(first.bucket, "planning/development/architecture/building_permits"),
    access_url: accessUrlFor(sourceId, rows),
    licence: firstValue(
      first.license,
      first.source_license,
      "NYC Open Data Terms of Use / NYC.gov Terms of Use; factual row metadata and source URLs retained.",
    ),
    licence_url: firstValue(first.license_url, "https://opendata.cityofnewyork.us/overview/#termsofuse"),
    coverage_years: {
      start: minYear,
      end: maxYear,
    },
    time_coverage: `Selected DOB NOW administrative permit and filing rows from ${minYear}-${maxYear} in ${candidateDoc.worker || "the architecture candidate pack"}.`,
    spatial_granularity: geometryNotes.join("; ") || "DOB/Open Data geocoded address point; not a parcel, building footprint, or work-area polygon.",
    temporal_granularity: dateFields.join("; ") || "DOB NOW administrative filing or permit date field.",
    update_frequency: "NYC Open Data operating dataset; publisher-updated.",
    retrieved_at: firstValue(candidateDoc.accessed_at, candidateDoc.generated_at, first.accessed_at, "2026-05-20"),
    limitations:
      "DOB NOW filing and permit rows are administrative records. They do not evidence construction start, construction completion, public opening, legal occupancy, actual occupancy, final built form, design quality, safety, affordability or outcome effects.",
  };
}

function extendSourceCoverage(source, rows, candidateDoc) {
  const years = rows.map((row) => firstYear(row.date || row.effective_date)).filter(Boolean);
  if (!years.length) return false;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const currentStart = Number(source.coverage_years?.start) || minYear;
  const currentEnd = Number(source.coverage_years?.end) || maxYear;
  const nextStart = Math.min(currentStart, minYear);
  const nextEnd = Math.max(currentEnd, maxYear);
  if (nextStart === currentStart && nextEnd === currentEnd) return false;

  source.coverage_years = { start: nextStart, end: nextEnd };
  if (source.source_id === "london-planning-datahub-api-core") {
    source.time_coverage = `Selected Planning London Datahub administrative lifecycle rows from ${nextStart}-${nextEnd} in appended architecture candidate packs.`;
  } else if (!compactText(source.time_coverage)) {
    source.time_coverage = `Selected administrative source rows from ${nextStart}-${nextEnd} in ${candidateDoc.worker || "appended architecture candidate packs"}.`;
  }
  return true;
}

function normalizeEvent(candidate, candidateDoc) {
  const date = firstValue(candidate.date, candidate.effective_date, candidate.issuance_date, candidate.filing_date);
  const retrievedAt = firstValue(
    candidate.source_retrieved_at,
    candidate.retrieved_at,
    candidate.accessed_at,
    candidateDoc.accessed_at,
    candidateDoc.generated_at,
  );
  const sourceIds = sourceIdsFor(candidate);
  return {
    ...candidate,
    city_id: compactText(candidate.city_id || candidate.city || "nyc"),
    event_id: eventIdFor(candidate),
    date,
    date_precision: firstValue(candidate.date_precision, candidate.effective_date_precision, inferPrecision(date)),
    bucket: firstValue(candidate.bucket, "planning/development/architecture/building_permits"),
    title: compactText(candidate.title),
    summary: compactText(candidate.summary),
    observed_change: compactText(candidate.observed_change),
    source_ids: sourceIds,
    source_url: firstValue(candidate.source_url, candidate.source_page_url, candidate.application_source_url),
    source_record_id: firstValue(candidate.source_record_id, candidate.candidate_id, candidate.event_id),
    source_retrieved_at: retrievedAt,
    source_date_field: firstValue(candidate.source_date_field, "DOB NOW source date field"),
    confidence: firstValue(candidate.confidence, "documented"),
    longitude: Number(candidate.longitude),
    latitude: Number(candidate.latitude),
    geometry_source: firstValue(candidate.geometry_source, "DOB/Open Data geocoded address point."),
    geometry_precision: firstValue(candidate.geometry_precision, "Approximate source geocoded point, not a surveyed footprint."),
    license_or_terms_note: firstValue(
      candidate.license_or_terms_note,
      candidate.license,
      "Source-specific terms; factual row metadata and source URLs retained.",
    ),
    attribution: firstValue(candidate.attribution, `Attribute ${candidate.publisher || "NYC Department of Buildings and NYC Open Data"}.`),
    limitations: compactText(candidate.limitations),
    transformation_method: firstValue(
      candidate.transformation_method,
      `${candidateDoc.worker || "candidate pack"} normalized into architecture_milestones_2008_2026.json with row-level source URL, source date, point geometry and caveats retained.`,
    ),
  };
}

function validateCandidateEvent(event) {
  const required = [
    "city_id",
    "event_id",
    "date",
    "date_precision",
    "bucket",
    "title",
    "summary",
    "observed_change",
    "source_ids",
    "source_url",
    "source_record_id",
    "source_retrieved_at",
    "source_date_field",
    "confidence",
    "longitude",
    "latitude",
    "geometry_source",
    "geometry_precision",
    "license_or_terms_note",
    "attribution",
    "limitations",
    "transformation_method",
  ];
  for (const field of required) {
    if (Array.isArray(event[field]) ? event[field].length === 0 : !compactText(event[field])) {
      throw new Error(`Candidate ${event.event_id} is missing ${field}`);
    }
  }
  if (!/^(lon|nyc|bfs)_arch_/.test(event.event_id)) {
    throw new Error(`Candidate ${event.event_id} does not match architecture event id convention`);
  }
  if (!/^https?:\/\//.test(event.source_url)) {
    throw new Error(`Candidate ${event.event_id} has non-HTTP source_url`);
  }
  if (!Number.isFinite(event.longitude) || !Number.isFinite(event.latitude)) {
    throw new Error(`Candidate ${event.event_id} has invalid point geometry`);
  }
}

function appendPack(packPath) {
  const milestoneDoc = readJson(MILESTONES_PATH);
  const candidateDoc = readJson(path.resolve(ROOT, packPath));
  const rows = candidateRows(candidateDoc);
  const existingEventIds = new Set(milestoneDoc.events.map((event) => event.event_id));
  const existingSourceRecordIds = new Set(
    milestoneDoc.events.map((event) => compactText(event.source_record_id)).filter(Boolean),
  );
  const sourceById = new Map(milestoneDoc.sources.map((source) => [source.source_id, source]));

  const appended = [];
  const skipped = [];
  const rowsBySourceId = new Map();
  const appendedRowsBySourceId = new Map();

  for (const candidate of rows) {
    const event = normalizeEvent(candidate, candidateDoc);
    validateCandidateEvent(event);
    if (existingEventIds.has(event.event_id)) {
      skipped.push({ event_id: event.event_id, reason: "event_id exists" });
      continue;
    }
    if (existingSourceRecordIds.has(compactText(event.source_record_id))) {
      skipped.push({ event_id: event.event_id, reason: "source_record_id exists" });
      continue;
    }
    for (const sourceId of event.source_ids) {
      if (!sourceById.has(sourceId)) {
        rowsBySourceId.set(sourceId, [...(rowsBySourceId.get(sourceId) || []), candidate]);
      }
      appendedRowsBySourceId.set(sourceId, [...(appendedRowsBySourceId.get(sourceId) || []), event]);
    }
    milestoneDoc.events.push(event);
    existingEventIds.add(event.event_id);
    existingSourceRecordIds.add(compactText(event.source_record_id));
    appended.push(event.event_id);
  }

  for (const [sourceId, sourceRows] of rowsBySourceId.entries()) {
    if (!sourceById.has(sourceId)) {
      const source = sourceFromRows(sourceId, sourceRows, candidateDoc);
      milestoneDoc.sources.push(source);
      sourceById.set(sourceId, source);
    }
  }

  const extendedSources = [];
  for (const [sourceId, sourceRows] of appendedRowsBySourceId.entries()) {
    const source = sourceById.get(sourceId);
    if (source && extendSourceCoverage(source, sourceRows, candidateDoc)) {
      extendedSources.push(sourceId);
    }
  }

  milestoneDoc.events.sort(
    (a, b) =>
      String(a.city_id).localeCompare(String(b.city_id)) ||
      String(a.date).localeCompare(String(b.date)) ||
      String(a.event_id).localeCompare(String(b.event_id)),
  );
  milestoneDoc.sources.sort((a, b) => String(a.source_id).localeCompare(String(b.source_id)));
  milestoneDoc.last_normalized_at = firstValue(candidateDoc.accessed_at, candidateDoc.generated_at, milestoneDoc.last_normalized_at);

  writeJson(MILESTONES_PATH, milestoneDoc);
  console.log(
    JSON.stringify(
      {
        pack: packPath,
        input_count: rows.length,
        appended_count: appended.length,
        skipped_count: skipped.length,
        added_source_count: rowsBySourceId.size,
        added_sources: [...rowsBySourceId.keys()].sort(),
        extended_source_count: extendedSources.length,
        extended_sources: extendedSources.sort(),
        first_appended_event_id: appended[0] || null,
      },
      null,
      2,
    ),
  );
}

function main() {
  const packs = process.argv.slice(2);
  if (!packs.length) {
    throw new Error("Usage: node scripts/append_architecture_candidate_pack.js <candidate-pack.json> [...]");
  }
  for (const packPath of packs) appendPack(packPath);
}

if (require.main === module) {
  main();
}
