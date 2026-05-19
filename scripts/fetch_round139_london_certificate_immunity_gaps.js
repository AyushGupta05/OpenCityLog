const fs = require("fs");
const path = require("path");

const accessedAt = "2026-05-19";
const inputPath = "tmp/planning_data_certificate_immunity_all_round112.json";
const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const outDir = "tmp/subagents/round139_london_certificate_immunity_gaps";
const sourceId = "planning-data-certificate-of-immunity";
const datasetUrl = "https://www.planning.data.gov.uk/dataset/certificate-of-immunity";

const londonEnvelope = {
  minLon: -0.5103,
  maxLon: 0.334,
  minLat: 51.2868,
  maxLat: 51.6919
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function slugify(value) {
  return String(value || "")
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

function parsePoint(wkt) {
  const match = String(wkt || "").match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!match) return null;
  return {
    longitude: Number(match[1]),
    latitude: Number(match[2])
  };
}

function inLondon(point) {
  return Boolean(point) &&
    point.longitude >= londonEnvelope.minLon &&
    point.longitude <= londonEnvelope.maxLon &&
    point.latitude >= londonEnvelope.minLat &&
    point.latitude <= londonEnvelope.maxLat;
}

function entityIdsFromCorpus(corpus) {
  const ids = new Set();
  for (const event of corpus.events || []) {
    const sourceIds = event.source_ids || [event.source_dataset_id].filter(Boolean);
    if (!sourceIds.includes(sourceId)) continue;
    const text = `${event.source_url || ""} ${event.source_record_id || ""} ${event.event_id || ""}`;
    for (const match of text.matchAll(/\b230\d{4,}\b/g)) {
      ids.add(match[0]);
    }
  }
  return ids;
}

function sourceAudit() {
  return {
    source_id: sourceId,
    source_name: "Planning Data certificate of immunity records",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    source_url: datasetUrl,
    source_type: "official Planning Data entity export",
    license_or_terms_note: "Open Government Licence v3.0; attribution to Historic England and Ordnance Survey where applicable.",
    license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    accessed_at: accessedAt,
    coverage_years_checked: `Certificate-of-immunity rows with start-date from 2008-01-01 through ${accessedAt}, filtered to the London atlas coordinate envelope.`,
    update_frequency: "Planning Data source page provides collector and row entry dates; this pack uses the local official entity export previously retrieved for the 2026-05-19 corpus run.",
    geographic_scope: "National Planning Data certificate-of-immunity entities, filtered to London atlas coordinates.",
    key_fields_used: [
      "entity",
      "name",
      "reference",
      "start-date",
      "end-date",
      "entry-date",
      "point",
      "geometry",
      "documentation-url"
    ],
    reliability_assessment: "usable_with_caveats",
    required_caveats: "Certificate-of-immunity rows document a legal/planning heritage status period, not construction, alteration, opening, demolition, building condition, listing, or outcome effects.",
    ingestion_recommendation: "Append only missing London-bounds entity rows as documented heritage/planning status milestones with visible caveats."
  };
}

function candidateFromRow(row) {
  const point = parsePoint(row.point);
  const date = row["start-date"];
  const entity = String(row.entity);
  const reference = String(row.reference || "");
  const name = String(row.name || `certificate-of-immunity entity ${entity}`).trim();
  return {
    city_id: "london",
    candidate_id: `lon_coi_gap_round139_${entity}_${slugify(name)}`,
    title: `${name} certificate of immunity recorded`,
    summary: `Planning Data records a certificate of immunity for ${name}${reference ? `, Historic England reference ${reference}` : ""}. The source row records a certificate period from ${date} to ${row["end-date"] || "an unspecified end date"}; this is a heritage/planning status milestone, not evidence of physical construction, alteration, opening, demolition, or building condition.`,
    observed_change: `A certificate-of-immunity status period was recorded for ${name} starting ${date}.`,
    date,
    date_precision: "day",
    bucket: "architecture/heritage/certificate_of_immunity",
    area: name,
    latitude: point.latitude,
    longitude: point.longitude,
    source_id: sourceId,
    source_ids: [sourceId],
    source_name: "Planning Data certificate of immunity records",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    source_url: `https://www.planning.data.gov.uk/entity/${entity}`,
    source_record_id: `planning-data:certificate-of-immunity:${entity}${reference ? `; HE ${reference}` : ""}`,
    source_type: "official planning data entity row",
    accessed_at: accessedAt,
    source_date_field: "start-date as certificate start; end-date as certificate end; entry-date as Planning Data row entry date",
    source_dataset_id: sourceId,
    confidence: "documented",
    architect: "Source row does not name a project architect.",
    project_type: "certificate of immunity heritage/planning status",
    geometry_source: "Planning Data point WKT and multipolygon geometry from the certificate-of-immunity entity row.",
    geometry_precision: "Atlas event stores the source point marker; the source row also contains polygon geometry. This is not a measured building footprint in the manual corpus.",
    license_or_terms_note: "Open Government Licence v3.0. Attribution text from the source page includes Historic England and Ordnance Survey where applicable.",
    attribution: "Historic England; Ministry of Housing, Communities and Local Government; Ordnance Survey Crown copyright/database right where applicable",
    limitations: "Certificate-of-immunity rows document a legal/planning heritage status period, not construction, alteration, opening, demolition, building condition, listing, or outcome effects. London filtering used the atlas city envelope; source geometry should be inspected for statutory context.",
    transformation_method: "scripts/fetch_round139_london_certificate_immunity_gaps.js parsed the official Planning Data certificate-of-immunity entity export, filtered to 2008-01-01 through the 2026-05-19 retrieval date and the London atlas coordinate envelope, removed entities already present in the manual corpus, and emitted missing row-level heritage/planning status milestones.",
    raw_context: {
      entity: row.entity,
      reference: row.reference,
      name: row.name,
      dataset: row.dataset,
      start_date: row["start-date"],
      end_date: row["end-date"],
      entry_date: row["entry-date"],
      documentation_url: row["documentation-url"],
      point: row.point,
      quality: row.quality
    }
  };
}

function main() {
  const sourceDoc = readJson(inputPath);
  const corpus = readJson(corpusPath);
  const existingEntities = entityIdsFromCorpus(corpus);
  const rows = Array.isArray(sourceDoc.entities) ? sourceDoc.entities : [];
  const rejected = {};

  const candidates = [];
  for (const row of rows) {
    const point = parsePoint(row.point);
    const startDate = String(row["start-date"] || "");
    const entity = String(row.entity || "");
    if (row.dataset !== "certificate-of-immunity") {
      rejected.other_dataset = (rejected.other_dataset || 0) + 1;
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < "2008-01-01" || startDate > accessedAt) {
      rejected.outside_date_window = (rejected.outside_date_window || 0) + 1;
      continue;
    }
    if (!inLondon(point)) {
      rejected.outside_london_envelope_or_missing_point = (rejected.outside_london_envelope_or_missing_point || 0) + 1;
      continue;
    }
    if (existingEntities.has(entity)) {
      rejected.already_in_manual_corpus = (rejected.already_in_manual_corpus || 0) + 1;
      continue;
    }
    candidates.push(candidateFromRow(row));
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date) || a.source_record_id.localeCompare(b.source_record_id));

  const pack = {
    generated_at: `${accessedAt}T00:00:00Z`,
    task: "Round139 London Planning Data certificate-of-immunity corpus gaps",
    source_audits: [sourceAudit()],
    candidates
  };
  const summary = {
    generated_at: `${accessedAt}T00:00:00Z`,
    input_path: inputPath,
    raw_entities: rows.length,
    existing_entities_seen: existingEntities.size,
    candidate_count: candidates.length,
    rejected,
    candidate_ids: candidates.map((candidate) => candidate.candidate_id)
  };

  writeJson(path.join(outDir, "candidates.json"), pack);
  writeJson(path.join(outDir, "source_audit.json"), { generated_at: `${accessedAt}T00:00:00Z`, source_audits: [sourceAudit()], summary });
  writeJson(path.join(outDir, "summary.json"), summary);
  console.log(JSON.stringify(summary, null, 2));
}

main();
