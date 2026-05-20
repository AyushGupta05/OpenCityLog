const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const retrievedAt = "2026-05-19";
const sourceDatasetUrl = "https://www.planning.data.gov.uk/dataset/certificate-of-immunity";
const inputPath = path.join(repoRoot, "tmp/planning_data_certificate_immunity_all_round112.json");
const manualPath = path.join(repoRoot, "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json");
const outputPath = path.join(repoRoot, "tmp/subagents/london_arch_candidates_round112_certificate_immunity.json");

const londonBounds = {
  minLon: -0.5103,
  minLat: 51.2868,
  maxLon: 0.334,
  maxLat: 51.6919
};

const outsideGreaterLondon = new Map([
  [2300216, "Point is in the Weybridge/Elmbridge area, outside Greater London."],
  [2300381, "Point is at BBC Elstree Centre in Hertfordshire, outside Greater London."]
]);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));

const slug = (value) => String(value || "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .replace(/_{2,}/g, "_")
  .slice(0, 72);

const parsePoint = (value) => {
  const match = String(value || "").match(/^POINT \((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)$/);
  if (!match) return null;
  return { lon: Number(match[1]), lat: Number(match[2]) };
};

const inLondonEnvelope = ({ lon, lat }) => (
  lon >= londonBounds.minLon &&
  lon <= londonBounds.maxLon &&
  lat >= londonBounds.minLat &&
  lat <= londonBounds.maxLat
);

const raw = readJson(inputPath);
const manual = readJson(manualPath);
const rows = Array.isArray(raw.entities) ? raw.entities : [];

const existingSourceKeys = new Set(manual.events.map((event) => (
  `${event.city_id}|${event.source_url}|${event.source_record_id}`
)));
const existingTitleDateKeys = new Set(manual.events.map((event) => (
  `${event.city_id}|${String(event.title || "").toLowerCase()}|${event.date}`
)));

const candidates = [];
const rejects = [];

for (const row of rows) {
  const point = parsePoint(row.point);
  const sourceUrl = `https://www.planning.data.gov.uk/entity/${row.entity}`;
  const sourceRecordId = `planning-data:certificate-of-immunity:${row.entity}; HE ${row.reference}`;

  if (!point) {
    rejects.push({ entity: row.entity, name: row.name, reason: "Missing or unparsable Planning Data point WKT." });
    continue;
  }

  if (!inLondonEnvelope(point)) {
    rejects.push({ entity: row.entity, name: row.name, reason: "Planning Data point is outside the London atlas bounding envelope." });
    continue;
  }

  if (outsideGreaterLondon.has(Number(row.entity))) {
    rejects.push({ entity: row.entity, name: row.name, reason: outsideGreaterLondon.get(Number(row.entity)) });
    continue;
  }

  if (String(row["start-date"] || "") < "2008-01-01" || String(row["start-date"] || "") > retrievedAt) {
    rejects.push({ entity: row.entity, name: row.name, reason: "Certificate start-date is outside the 2008-2026/current retrieval window." });
    continue;
  }

  const sourceKey = `london|${sourceUrl}|${sourceRecordId}`;
  if (existingSourceKeys.has(sourceKey)) {
    rejects.push({ entity: row.entity, name: row.name, reason: "Exact source URL and source record ID already exists in the manual corpus." });
    continue;
  }

  const eventId = `lon_arch_coi_${slug(row.name)}_${row.entity}`;
  const title = `${row.name} certificate of immunity recorded`;
  const titleDateKey = `london|${title.toLowerCase()}|${row["start-date"]}`;
  if (existingTitleDateKeys.has(titleDateKey)) {
    rejects.push({ entity: row.entity, name: row.name, reason: "Same normalized title and date already exists in the manual corpus." });
    continue;
  }

  candidates.push({
    city_id: "london",
    event_id: eventId,
    title,
    summary: `Planning Data records a certificate of immunity for ${row.name}, Historic England reference ${row.reference}. The source row records a certificate period from ${row["start-date"]} to ${row["end-date"]}; this is a heritage/planning status milestone, not evidence of physical construction, alteration, opening, or demolition.`,
    observed_change: `A certificate-of-immunity status period was recorded for ${row.name} starting ${row["start-date"]}.`,
    date: row["start-date"],
    date_precision: "day",
    category: "architecture/heritage/certificate_of_immunity",
    subcategory: "certificate of immunity",
    location_name: row.name,
    lat: point.lat,
    lon: point.lon,
    source_ids: ["planning-data-certificate-of-immunity"],
    source_id: "planning-data-certificate-of-immunity",
    source_name: "Planning Data certificate of immunity records",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    source_url: sourceUrl,
    source_record_id: sourceRecordId,
    source_type: "official planning data entity row",
    source_date_field: "start-date as certificate start; end-date as certificate end; entry-date as Planning Data row entry date",
    source_dataset_id: "certificate-of-immunity",
    license: "Open Government Licence v3.0. Attribution text from the source page includes Historic England 2026 and Ordnance Survey Crown copyright/database right 2026.",
    license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    accessed_at: retrievedAt,
    confidence: "documented",
    architect: "Source row does not name a project architect.",
    project_type: "certificate of immunity heritage/planning status",
    attribution: "Historic England; Ministry of Housing, Communities and Local Government; Ordnance Survey Crown copyright/database right 2026 where applicable",
    limitations: "Certificate-of-immunity rows document a legal/planning heritage status period, not construction, alteration, opening, demolition, building condition, or outcome effects. London filtering used the atlas city envelope with manual exclusions for known outside-Greater-London false positives; source geometry should be inspected for statutory context.",
    transformation_method: "scripts/extract_planning_certificate_immunity_round112.js parsed the official Planning Data JSON entity export, retained rows with start-date from 2008-01-01 through the 2026-05-19 retrieval date, filtered to the London atlas envelope, removed two known outside-Greater-London false positives, parsed point WKT, and checked exact source URL/source record duplicates against the manual corpus.",
    geometry_source: "Planning Data point WKT and multipolygon geometry from the certificate-of-immunity entity row.",
    geometry_precision: "Atlas event stores the source point marker; the source row also contains polygon geometry. This is not a measured building footprint in the manual corpus.",
    duplicate_key: sourceKey,
    raw: {
      entity: row.entity,
      reference: row.reference,
      start_date: row["start-date"],
      end_date: row["end-date"],
      entry_date: row["entry-date"],
      documentation_url: row["documentation-url"]
    }
  });
}

candidates.sort((a, b) => a.date.localeCompare(b.date) || a.event_id.localeCompare(b.event_id));
rejects.sort((a, b) => String(a.entity).localeCompare(String(b.entity)));

const output = {
  source_audit: {
    source_id: "planning-data-certificate-of-immunity",
    source_name: "Planning Data certificate of immunity records",
    publisher: "Ministry of Housing, Communities and Local Government / Historic England",
    url: sourceDatasetUrl,
    api_export_used: "https://www.planning.data.gov.uk/entity.json?dataset=certificate-of-immunity&limit=500",
    license: "Open Government Licence v3.0",
    license_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    attribution_required: "Historic England 2026 and Ordnance Survey Crown copyright/database right 2026 where applicable.",
    collector_last_ran: "2026-05-18",
    new_data_last_found: "2026-05-12",
    coverage_years: "Certificate start-date values in selected London rows run from 2020 through 2026.",
    geography: "National England dataset; this candidate extract keeps rows whose source point is inside the London atlas envelope and removes two known outside-Greater-London false positives.",
    reliability: "strong for documenting a Planning Data/Historic England certificate-of-immunity entity; usable with caveats for city-change atlas milestones.",
    required_caveat: "Do not present as construction, demolition, listing, alteration, completion, building condition, or outcome effect."
  },
  candidates,
  rejects
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log(JSON.stringify({
  input_rows: rows.length,
  candidates: candidates.length,
  rejects: rejects.length,
  output: path.relative(repoRoot, outputPath)
}, null, 2));
